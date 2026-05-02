const crypto = require('crypto');
const { json } = require('./_util');
const { requireUser } = require('./_auth');

const SESSION_COOKIE = 'ze_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function parseAdmins() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function getAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || process.env.ADMIN_ACCESS_PASSWORD || '').trim();
}

function getSessionSecret() {
  return getAdminPassword();
}

function parseCookies(event) {
  const raw = event?.headers?.cookie || event?.headers?.Cookie || '';
  return String(raw)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return acc;
      const key = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function createSessionToken() {
  const secret = getSessionSecret();
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ iat: now, exp: now + SESSION_TTL_SECONDS, role: 'admin' }));
  const sig = sign(payload, secret);
  return `${payload}.${sig}`;
}

function verifySessionToken(token) {
  const secret = getSessionSecret();
  if (!secret || !token || !String(token).includes('.')) return false;
  const [payload, sig] = String(token).split('.', 2);
  if (!payload || !sig) return false;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return decoded?.role === 'admin' && Number(decoded.exp || 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function isPasswordSession(event) {
  const cookies = parseCookies(event);
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

function buildCookie(token, maxAgeSeconds = SESSION_TTL_SECONDS) {
  const secure = String(process.env.URL || '').startsWith('https://');
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ].filter(Boolean).join('; ');
}

function clearCookie() {
  const secure = String(process.env.URL || '').startsWith('https://');
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    'Max-Age=0',
  ].filter(Boolean).join('; ');
}

async function requireAdmin(event) {
  if (isPasswordSession(event)) {
    return {
      ok: true,
      user: { userId: 'password_admin', email: null, is_admin: true, auth_method: 'password' },
    };
  }

  const auth = await requireUser(event);
  if (!auth.ok) return auth;
  const admins = parseAdmins();
  const email = String(auth.user.email || '').toLowerCase();
  const isAdmin = !!email && admins.includes(email);
  if (!isAdmin) {
    return { ok: false, response: json(403, { error: 'Admin access required' }) };
  }
  return { ok: true, user: { ...auth.user, is_admin: true, auth_method: 'email' } };
}

function isAdminEmail(email) {
  const admins = parseAdmins();
  return !!email && admins.includes(String(email).toLowerCase());
}

module.exports = {
  requireAdmin,
  isAdminEmail,
  getAdminPassword,
  createSessionToken,
  buildCookie,
  clearCookie,
  isPasswordSession,
};
