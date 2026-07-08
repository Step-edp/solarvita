const bcrypt = require('bcryptjs');

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf,
    email: row.email || null,
    tipo: row.tipo,
    perfil: row.perfil || null,
    whatsapp: row.whatsapp || null,
    nascimento: row.nascimento ? row.nascimento.toISOString().slice(0, 10) : null,
    status: row.status,
    criadoEm: row.criado_em ? row.criado_em.toISOString() : null,
    aprovadoEm: row.aprovado_em ? row.aprovado_em.toISOString() : null,
    rejeitadoEm: row.rejeitado_em ? row.rejeitado_em.toISOString() : null
  };
}

function mapSessionUser(row) {
  const user = mapUserRow(row);
  if (!user) return null;
  delete user.id;
  return user;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function isAdminApproved(user) {
  return user.tipo !== 'admin' || !user.status || user.status === 'aprovado';
}

module.exports = {
  onlyDigits,
  mapUserRow,
  mapSessionUser,
  hashPassword,
  verifyPassword,
  isAdminApproved
};
