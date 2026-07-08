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
    const perfil = decodeURIComponent(req.params.perfil);
    const status = req.body.status;

    if (!['aprovado', 'rejeitado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const whereClause = `
      WHERE cpf = $1 AND tipo = 'admin' AND perfil = $2 AND status = 'pendente'
    `;

    let result;

    try {
      if (status === 'aprovado') {
        result = await query(
          `UPDATE users
           SET status = 'aprovado', aprovado_em = NOW()
           ${whereClause}
           RETURNING *`,
          [cpf, perfil]
        );
      } else {
        result = await query(
          `UPDATE users
           SET status = 'rejeitado', rejeitado_em = NOW()
           ${whereClause}
           RETURNING *`,
          [cpf, perfil]
        );
      }
    } catch (error) {
      if (error.code !== '42703') throw error;

      result = await query(
        `UPDATE users
         SET status = $3
         WHERE cpf = $1 AND tipo = 'admin' AND perfil = $2 AND status = 'pendente'
         RETURNING *`,
        [cpf, perfil, status]
      );
    }

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Cadastro não encontrado.' });
    }

    res.json({ user: mapUserRow(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao atualizar cadastro:', error);
    next(error);
  }
});

module.exports = router;
