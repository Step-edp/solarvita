const { query } = require('./db');

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cpf CHAR(11) NOT NULL,
      email VARCHAR(255),
      senha_hash VARCHAR(255) NOT NULL,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('parceiro', 'cliente', 'admin')),
      perfil VARCHAR(50),
      whatsapp VARCHAR(20),
      nascimento DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'aprovado',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      aprovado_em TIMESTAMPTZ,
      rejeitado_em TIMESTAMPTZ
    )
  `);

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'aprovado'`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rejeitado_em TIMESTAMPTZ`);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_cpf_tipo_perfil_idx
    ON users (cpf, tipo, COALESCE(perfil, ''))
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token UUID PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS vendedor_clientes (
      id SERIAL PRIMARY KEY,
      vendedor_cpf CHAR(11) NOT NULL,
      dados JSONB NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS vendedor_clientes_cpf_idx ON vendedor_clientes(vendedor_cpf)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS anexo_arquivos (
      id SERIAL PRIMARY KEY,
      vendedor_cpf CHAR(11) NOT NULL,
      nome TEXT NOT NULL,
      mime TEXT,
      tamanho INTEGER,
      dados BYTEA NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS anexo_arquivos_cpf_idx ON anexo_arquivos(vendedor_cpf)
  `);

  await query(`ALTER TABLE anexo_arquivos ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES vendedor_clientes(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE anexo_arquivos ADD COLUMN IF NOT EXISTS anexo_path TEXT`);

  await query(`
    CREATE INDEX IF NOT EXISTS anexo_arquivos_cliente_idx ON anexo_arquivos(cliente_id)
  `);
}

module.exports = { migrate };
