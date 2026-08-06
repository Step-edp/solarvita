const { query } = require('./db');
const { hashPassword, onlyDigits } = require('./utils/users');

const SEED_ADMIN = {
  nome: 'Administrador',
  cpf: '40280221851',
  email: 'admin@solamplo.com.br',
  senha: 'Step@241',
  tipo: 'admin',
  perfil: 'administrador',
  whatsapp: '12996839184',
  nascimento: '1990-01-15',
  status: 'aprovado'
};

async function seedAdmin() {
  const cpf = onlyDigits(SEED_ADMIN.cpf);
  const existing = await query(
    `SELECT id FROM users WHERE cpf = $1 AND tipo = 'admin' AND perfil = $2`,
    [cpf, SEED_ADMIN.perfil]
  );

  const senhaHash = await hashPassword(SEED_ADMIN.senha);

  if (existing.rows.length) {
    await query(
      `UPDATE users
       SET nome = $1, email = $2, senha_hash = $3, whatsapp = $4, nascimento = $5,
           status = 'aprovado', aprovado_em = COALESCE(aprovado_em, NOW())
       WHERE cpf = $6 AND tipo = 'admin' AND perfil = $7`,
      [
        SEED_ADMIN.nome,
        SEED_ADMIN.email,
        senhaHash,
        SEED_ADMIN.whatsapp,
        SEED_ADMIN.nascimento,
        cpf,
        SEED_ADMIN.perfil
      ]
    );
    return;
  }

  await query(
    `INSERT INTO users (nome, cpf, email, senha_hash, tipo, perfil, whatsapp, nascimento, status, aprovado_em)
     VALUES ($1, $2, $3, $4, 'admin', $5, $6, $7, 'aprovado', NOW())`,
    [
      SEED_ADMIN.nome,
      cpf,
      SEED_ADMIN.email,
      senhaHash,
      SEED_ADMIN.perfil,
      SEED_ADMIN.whatsapp,
      SEED_ADMIN.nascimento
    ]
  );
}

module.exports = { seedAdmin };
