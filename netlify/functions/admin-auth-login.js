const crypto = require('crypto');
const { readJson } = require('./_util');
const { getAdminPassword, createSessionToken, buildCookie } = require('./_admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const configuredPassword = getAdminPassword();
  if (!configuredPassword) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing ADMIN_PASSWORD env var' }) };
  }

  const body = readJson(event);
  const providedPassword = String(body.password || '');
  const a = Buffer.from(providedPassword);
  const b = Buffer.from(configuredPassword);
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!matches) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Incorrect password' }) };
  }

  const token = createSessionToken();
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildCookie(token),
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ ok: true, authenticated: true }),
  };
};
