const { clearCookie } = require('./_admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookie(),
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ ok: true }),
  };
};
