const express = require('express');
const { pool, query } = require('../db');
const { onlyDigits } = require('../utils/users');
const { attachSession, requireVendedor } = require('../middleware/session');
const { upload } = require('../uploads');
const {
  getAnexoAtPath,
  setAnexoAtPath,
  extractAnexoId,
  validateArquivosHaveUrls,
  linkAnexosToCliente,
  pruneUnstoredAnexos
} = require('../utils/anexos');
const { buildPropostaPdf } = require('../utils/propostaPdf');

const router = express.Router();

router.use(attachSession);
router.use(requireVendedor);

function mapClienteRow(row) {
  return {
    id: row.id,
    ...row.dados,
    criadoEm: row.criado_em ? row.criado_em.toISOString() : null
  };
}

router.post('/anexos', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado.' });
    }

    if (!req.file.buffer?.length) {
      return res.status(400).json({ error: 'Arquivo vazio ou corrompido.' });
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
      url: `/api/vendedor/anexos/${row.id}`,
      stored: true
    });
  } catch (error) {
    next(error);
  }
});

router.post('/clientes/:id/anexos', upload.single('file'), async (req, res, next) => {
  let client;
  let transactionStarted = false;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado.' });
    }

    if (!req.file.buffer?.length) {
      return res.status(400).json({ error: 'Arquivo vazio ou corrompido.' });
    }

    const cpf = onlyDigits(req.user.cpf);
    const id = Number.parseInt(req.params.id, 10);
    const anexoPath = String(req.body?.anexoPath || '').trim();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Registro inválido.' });
    }

    if (!anexoPath) {
      return res.status(400).json({ error: 'Referência do anexo é obrigatória.' });
    }

    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    const existing = await client.query(
      `SELECT id, dados FROM vendedor_clientes
       WHERE id = $1 AND vendedor_cpf = $2
       FOR UPDATE`,
      [id, cpf]
    );

    if (!existing.rows.length) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    if (existing.rows[0].dados?.tipoRegistro === 'pap') {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(403).json({ error: 'Anexos de PAP não podem ser editados aqui.' });
    }

    const currentEntry = getAnexoAtPath(existing.rows[0].dados?.arquivos, anexoPath) || {};
    const oldAnexoId = extractAnexoId(currentEntry.url);

    const inserted = await client.query(
      `INSERT INTO anexo_arquivos (vendedor_cpf, cliente_id, anexo_path, nome, mime, tamanho, dados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, mime, tamanho`,
      [cpf, id, anexoPath, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer]
    );

    const stored = inserted.rows[0];
    const fileInfo = {
      ...currentEntry,
      name: stored.nome,
      type: stored.mime,
      size: stored.tamanho,
      url: `/api/vendedor/anexos/${stored.id}`,
      stored: true
    };

    const arquivosRaw = setAnexoAtPath(existing.rows[0].dados?.arquivos, anexoPath, fileInfo);
    const arquivos = pruneUnstoredAnexos(arquivosRaw) || arquivosRaw;

    if (!getAnexoAtPath(arquivos, anexoPath)?.url) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(500).json({
        error: 'upload_failed',
        message: 'Não foi possível vincular o arquivo ao cliente.'
      });
    }

    const dados = {
      ...existing.rows[0].dados,
      arquivos
    };

    const updated = await client.query(
      `UPDATE vendedor_clientes
       SET dados = $1::jsonb
       WHERE id = $2
       RETURNING id, dados, criado_em`,
      [JSON.stringify(dados), id]
    );

    if (oldAnexoId && oldAnexoId !== stored.id) {
      await client.query(
        `DELETE FROM anexo_arquivos WHERE id = $1 AND vendedor_cpf = $2`,
        [oldAnexoId, cpf]
      );
    }

    await client.query('COMMIT');
    transactionStarted = false;

    res.status(201).json({
      cliente: mapClienteRow(updated.rows[0]),
      anexo: fileInfo,
      stored: true
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query('ROLLBACK').catch(() => {});
    }

    if (error?.code === 'anexos_nao_armazenados') {
      return res.status(400).json({ error: error.code, message: error.message });
    }

    next(error);
  } finally {
    if (client) client.release();
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

    if (!row.dados?.length) {
      return res.status(404).json({ error: 'Conteúdo do anexo indisponível.' });
    }

    res.setHeader('Content-Type', row.mime || 'application/octet-stream');
    res.setHeader('Content-Length', row.tamanho || row.dados.length);
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
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

    res.json({ clientes: result.rows.map(mapClienteRow) });
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

    if (dados?.arquivos) {
      validateArquivosHaveUrls(dados.arquivos);
    }

    const inserted = await query(
      `INSERT INTO vendedor_clientes (vendedor_cpf, dados) VALUES ($1, $2::jsonb)
       RETURNING id, dados, criado_em`,
      [cpf, JSON.stringify(dados)]
    );

    const row = inserted.rows[0];

    if (dados?.arquivos) {
      await linkAnexosToCliente(query, row.id, dados.arquivos, cpf);
    }

    res.status(201).json({ cliente: mapClienteRow(row) });
  } catch (error) {
    next(error);
  }
});

router.patch('/clientes/:id', async (req, res, next) => {
  try {
    const cpf = onlyDigits(req.user.cpf);
    const id = Number.parseInt(req.params.id, 10);
    const updates = req.body || {};

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

    if (existing.rows[0].dados?.tipoRegistro === 'pap') {
      return res.status(403).json({ error: 'Registro PAP não pode ser editado aqui.' });
    }

    const allowedFields = [
      'nome',
      'endereco',
      'whatsapp',
      'dataRetorno',
      'tipoRetorno',
      'tipoRetornoLabel',
      'observacao',
      'dadosConsumo',
      'definicaoPerfil',
      'arquivos',
      'status',
      'possuiFoto',
      'inviavel',
      'semContaLuz',
      'naoQuis',
      'etapaTrilha'
    ];

    const dados = { ...existing.rows[0].dados };
    let hasUpdates = false;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        dados[field] = updates[field];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return res.status(400).json({ error: 'Nada para atualizar.' });
    }

    if (updates.nome != null && String(updates.nome).trim().length < 3) {
      return res.status(400).json({ error: 'Informe o nome completo do cliente.' });
    }

    if (updates.endereco != null && String(updates.endereco).trim().length < 5) {
      return res.status(400).json({ error: 'Informe o endereço completo.' });
    }

    if (updates.arquivos != null) {
      if (typeof updates.arquivos !== 'object') {
        return res.status(400).json({ error: 'Anexos inválidos.' });
      }
      validateArquivosHaveUrls(updates.arquivos);
    }

    const updated = await query(
      `UPDATE vendedor_clientes
       SET dados = $1::jsonb
       WHERE id = $2 AND vendedor_cpf = $3
       RETURNING id, dados, criado_em`,
      [JSON.stringify(dados), id, cpf]
    );

    if (updates.arquivos) {
      await linkAnexosToCliente(query, id, updates.arquivos, cpf);
    }

    res.json({ cliente: mapClienteRow(updated.rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.get('/clientes/:id/proposta.pdf', async (req, res, next) => {
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

    const cliente = mapClienteRow(existing.rows[0]);
    const { bytes, filename } = await buildPropostaPdf(cliente, {}, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(Buffer.from(bytes));
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
