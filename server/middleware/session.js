const crypto = require('crypto');
const { query } = require('../db');
const { mapSessionUser } = require('../utils/users');

const SESSION_COOKIE = 'solarvita_session';
const SESSION_DAYS = 7;

function getSessionToken(req) {
  return req.cookies?.[SESSION_COOKIE] || null;
}

async function loadSessionUser(token) {
  if (!token) return null;

  const result = await query(
    `SELECT u.*
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );

  return mapSessionUser(result.rows[0]);
}

async function createSession(res, userId) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  );

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
  });
}

async function destroySession(req, res) {
  const token = getSessionToken(req);
  if (token) {
    await query(`DELETE FROM sessions WHERE token = $1`, [token]);
  }
  res.clearCookie(SESSION_COOKIE);
}

async function attachSession(req, res, next) {
  try {
    const token = getSessionToken(req);
    req.user = token ? await loadSessionUser(token) : null;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  next();
}

function requireAdminMaster(req, res, next) {
  if (!req.user || req.user.tipo !== 'admin' || req.user.perfil !== 'administrador') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  next();
}

function requireVendedor(req, res, next) {
  if (!req.user || req.user.tipo !== 'admin' || req.user.perfil !== 'vendedor') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  next();
}

module.exports = {
  SESSION_COOKIE,
  attachSession,
  requireAuth,
  requireAdminMaster,
  requireVendedor,
  createSession,
  destroySession,
  loadSessionUser
};
