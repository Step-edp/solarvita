const express = require('express');
const { query } = require('../db');
const {
  onlyDigits,
  mapUserRow,
  mapSessionUser,
  hashPassword,
  verifyPassword,
  isAdminApproved
} = require('../utils/users');
const {
  attachSession,
  requireAuth,
  createSession,
  destroySession
} = require('../middleware/session');

const router = express.Router();

router.use(attachSession);

router.get('/me', (req, res) => {
  res.json({ user: req.user || null });
});

router.post('/logout', async (req, res, next) => {
  try {
    await destroySession(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const cpf = onlyDigits(req.body.cpf);
    const senha = req.body.senha || '';
    const preferredTipo = req.body.tipo || null;

    if (!cpf || !senha) {
      return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
    }

    const result = await query(`SELECT * FROM users WHERE cpf = $1`, [cpf]);
    const matches = [];

    for (const row of result.rows) {
      if (await verifyPassword(senha, row.senha_hash)) {
        matches.push(row);
      }
    }

    if (!matches.length) {
      if (result.rows.length) {
        return res.status(401).json({ error: 'wrong_password', message: 'Senha incorreta.' });
      }
      return res.status(404).json({ error: 'not_found', message: 'CPF não cadastrado.' });
    }

    let userRow = null;

    if (preferredTipo) {
      const inArea = matches.filter((row) => row.tipo === preferredTipo);
      if (inArea.length === 1) userRow = inArea[0];
      else if (inArea.length > 1) {
        userRow = inArea.find((row) => isAdminApproved(mapUserRow(row))) || inArea[0];
      }
    }

    if (!userRow) {
      userRow = matches.length === 1
        ? matches[0]
        : matches.find((row) => isAdminApproved(mapUserRow(row))) || matches[0];
    }

    const user = mapUserRow(userRow);

    if (user.tipo === 'admin' && !isAdminApproved(user)) {
      return res.status(403).json({ error: 'pending', message: 'Cadastro pendente de aprovação.' });
    }

    await createSession(res, userRow.id);
    res.json({ user: mapSessionUser(userRow) });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const cpf = onlyDigits(req.body.cpf);
    const senha = req.body.senha || '';
    const tipo = req.body.tipo;
    const perfil = req.body.perfil || null;

    if (!nome || nome.length < 3) {
      return res.status(400).json({ error: 'Informe seu nome completo.' });
    }
    if (!cpf || cpf.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }
    if (!senha || senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }
    if (!['parceiro', 'cliente', 'admin'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de cadastro inválido.' });
    }

    let email = null;
    let whatsapp = null;
    let nascimento = null;
    let status = 'aprovado';

    if (tipo === 'admin') {
      if (!perfil) {
        return res.status(400).json({ error: 'Selecione seu perfil de acesso.' });
      }
      email = String(req.body.email || '').trim();
      whatsapp = onlyDigits(req.body.whatsapp || '');
      nascimento = req.body.nascimento || null;

      if (!email) {
        return res.status(400).json({ error: 'Informe um e-mail válido.' });
      }
      if (!whatsapp) {
        return res.status(400).json({ error: 'Informe um WhatsApp válido.' });
      }
      if (!nascimento) {
        return res.status(400).json({ error: 'Informe uma data de nascimento válida.' });
      }
      status = 'pendente';
    }

    const exists = await query(
      `SELECT id FROM users
       WHERE cpf = $1 AND tipo = $2 AND COALESCE(perfil, '') = COALESCE($3, '')`,
      [cpf, tipo, perfil]
    );

    if (exists.rows.length) {
      return res.status(409).json({ error: 'Este CPF já está cadastrado neste perfil.' });
    }

    const senhaHash = await hashPassword(senha);
    const inserted = await query(
      `INSERT INTO users (nome, cpf, email, senha_hash, tipo, perfil, whatsapp, nascimento, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nome, cpf, email, senhaHash, tipo, perfil, whatsapp, nascimento, status]
    );

    const user = mapUserRow(inserted.rows[0]);

    if (tipo === 'admin') {
      return res.status(201).json({ pending: true, user });
    }

    await createSession(res, inserted.rows[0].id);
    res.status(201).json({ user: mapSessionUser(inserted.rows[0]) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
