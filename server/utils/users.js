const bcrypt = require('bcryptjs');

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return null;
}

function toIsoDateTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }
  if (typeof value.toISOString === 'function') return value.toISOString();
  return String(value);
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
    nascimento: toIsoDate(row.nascimento),
    status: row.status,
    criadoEm: toIsoDateTime(row.criado_em),
    aprovadoEm: toIsoDateTime(row.aprovado_em),
    rejeitadoEm: toIsoDateTime(row.rejeitado_em)
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
