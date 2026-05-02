const { json } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');
const { isAdminEmail } = require('./_admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const { userId, email, deviceId, device_known, identity_type } = auth.user;
  const r = await query(
    `select interests, onboarding_complete, email
       from user_profiles
      where user_id = $1
      limit 1`,
    [userId]
  );
  const row = r.rows[0] || {};
  const resolvedEmail = row.email || email;
  return json(200, {
    user_id: userId,
    email: resolvedEmail,
    device_id: deviceId,
    device_known: !!device_known,
    identity_type,
    interests: row.interests || [],
    onboarding_complete: !!row.onboarding_complete,
    is_admin: isAdminEmail(resolvedEmail),
  });
};
