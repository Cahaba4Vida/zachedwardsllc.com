const { json } = require('./_util');
const { getAdminPassword, isPasswordSession } = require('./_admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  return json(200, {
    authenticated: isPasswordSession(event),
    password_configured: !!getAdminPassword(),
  });
};
