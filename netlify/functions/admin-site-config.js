const { json, readJson } = require('./_util');
const { requireAdmin } = require('./_admin');
const { query } = require('./_db');
const defaultConfig = require('../../site-config.json');

exports.handler = async (event) => {
  const admin = await requireAdmin(event);
  if (!admin.ok) return admin.response;

  if (event.httpMethod === 'GET') {
    const r = await query(`select value from site_settings where key = 'site_config' limit 1`, []);
    return json(200, { config: r.rows[0]?.value || defaultConfig });
  }

  if (event.httpMethod === 'POST') {
    const body = readJson(event);
    const config = body.config || defaultConfig;
    await query(
      `insert into site_settings (key, value, updated_by, updated_at)
       values ('site_config', $1::jsonb, $2, now())
       on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`,
      [JSON.stringify(config), admin.user.userId]
    );
    return json(200, { ok: true, config });
  }

  return json(405, { error: 'Method not allowed' });
};
