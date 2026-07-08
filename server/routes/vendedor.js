const express = require('express');
const { query } = require('../db');
const { onlyDigits } = require('../utils/users');
const { attachSession, requireVendedor } = require('../middleware/session');

const router = express.Router();

router.use(attachSession);
router.use(requireVendedor);

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
