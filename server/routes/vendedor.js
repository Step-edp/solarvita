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

    if (!dados?.nome || !dados?.endereco) {
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

module.exports = router;
