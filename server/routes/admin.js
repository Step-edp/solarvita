const express = require('express');
const { query } = require('../db');
const { mapUserRow } = require('../utils/users');
const { attachSession, requireAdminMaster } = require('../middleware/session');

const router = express.Router();

router.use(attachSession);
router.use(requireAdminMaster);

router.get('/cadastros/pendentes', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM users
       WHERE tipo = 'admin' AND status = 'pendente'
       ORDER BY criado_em DESC`
    );
    res.json({ cadastros: result.rows.map(mapUserRow) });
  } catch (error) {
    next(error);
  }
});

router.patch('/cadastros/:cpf/:perfil', async (req, res, next) => {
  try {
    const cpf = String(req.params.cpf).replace(/\D/g, '');
    const perfil = req.params.perfil;
    const status = req.body.status;

    if (!['aprovado', 'rejeitado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const result = await query(
      `UPDATE users
       SET status = $1,
           aprovado_em = CASE WHEN $1 = 'aprovado' THEN NOW() ELSE aprovado_em END,
           rejeitado_em = CASE WHEN $1 = 'rejeitado' THEN NOW() ELSE rejeitado_em END
       WHERE cpf = $2 AND tipo = 'admin' AND perfil = $3 AND status = 'pendente'
       RETURNING *`,
      [status, cpf, perfil]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Cadastro não encontrado.' });
    }

    res.json({ user: mapUserRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
