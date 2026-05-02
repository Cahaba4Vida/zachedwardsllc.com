const { json } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const r = await query(
    `select u.device_id, coalesce(u.device_name, '') as device_name, coalesce(u.is_enabled, true) as is_enabled,
            u.created_at, u.last_seen_at
       from user_device_links u
      where u.user_id = $1
      order by u.last_seen_at desc`,
    [auth.user.userId]
  );
  return json(200, {
    current_device_id: auth.user.deviceId || null,
    devices: r.rows.map((d) => ({
      device_id: d.device_id,
      device_name: d.device_name,
      is_enabled: d.is_enabled,
      created_at: d.created_at,
      last_seen_at: d.last_seen_at,
      is_current: auth.user.deviceId ? d.device_id === auth.user.deviceId : false,
    })),
  });
};
