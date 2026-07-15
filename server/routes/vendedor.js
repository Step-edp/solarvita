const express = require('express');
const { query } = require('../db');
const { onlyDigits } = require('../utils/users');
const { attachSession, requireVendedor } = require('../middleware/session');
const { upload } = require('../uploads');

const router = express.Router();

router.use(attachSession);
router.use(requireVendedor);

router.post('/anexos', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado.' });
    }

    const cpf = onlyDigits(req.user.cpf);
    const inserted = await query(
      `INSERT INTO anexo_arquivos (vendedor_cpf, nome, mime, tamanho, dados)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, mime, tamanho`,
      [cpf, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer]
    );

    const row = inserted.rows[0];
    res.status(201).json({
      name: row.nome,
      type: row.mime,
      size: row.tamanho,
      url: `/api/vendedor/anexos/${row.id}`
    });
  } catch (error) {
    next(error);
  }
});

router.get('/anexos/:id', async (req, res, next) => {
  try {
    const cpf = onlyDigits(req.user.cpf);
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Anexo inválido.' });
    }

    const result = await query(
      `SELECT nome, mime, tamanho, dados, vendedor_cpf
       FROM anexo_arquivos
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Anexo não encontrado.' });
    }

    const row = result.rows[0];
    if (row.vendedor_cpf !== cpf) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    res.setHeader('Content-Type', row.mime || 'application/octet-stream');
    res.setHeader('Content-Length', row.tamanho || row.dados.length);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.nome || 'anexo')}"`);
    res.send(row.dados);
  } catch (error) {
    next(error);
  }
});

router.get('/clientes', async (req, res, next) => {
  try {
    const cpf = onlyDigits(req.user.cpf);
    const result = await query(
      `SELECT id, dados, criado_em FROM vendedor_clientes
       WHERE vendedor_cpf = $1
       ORDER BY criado_em DESC`,
      [cpf]
    );

    const clientes = result.rows.map((row) => ({
      id: row.id,
      ...row.dados,
      criadoEm: row.criado_em ? row.criado_em.toISOString() : null
    }));

    res.json({ clientes });
  } catch (error) {
    next(error);
  }
});

router.post('/clientes', async (req, res, next) => {
  try {
    const cpf = onlyDigits(req.user.cpf);
    const dados = req.body;

    if (dados?.tipoRegistro === 'pap') {
      if (!dados?.observacao || !dados?.endereco) {
        return res.status(400).json({ error: 'Dados do PAP incompletos.' });
      }
    } else if (!dados?.nome || !dados?.endereco) {
      return res.status(400).json({ error: 'Dados do cliente incompletos.' });
    }

    const inserted = await query(
      `INSERT INTO vendedor_clientes (vendedor_cpf, dados) VALUES ($1, $2::jsonb)
       RETURNING id, dados, criado_em`,
      [cpf, JSON.stringify(dados)]
    );

    const row = inserted.rows[0];
    res.status(201).json({
      cliente: {
        id: row.id,
        ...row.dados,
        criadoEm: row.criado_em.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/clientes/:id', async (req, res, next) => {
  try {
    const cpf = onlyDigits(req.user.cpf);
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Registro inválido.' });
    }

    const existing = await query(
      `SELECT id, dados FROM vendedor_clientes
       WHERE id = $1 AND vendedor_cpf = $2`,
      [id, cpf]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    if (existing.rows[0].dados?.tipoRegistro !== 'pap') {
      return res.status(403).json({ error: 'Somente registros PAP podem ser excluídos.' });
    }

    await query(
      `DELETE FROM vendedor_clientes WHERE id = $1 AND vendedor_cpf = $2`,
      [id, cpf]
    );

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
