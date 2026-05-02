const { json } = require('./_util');
const { query } = require('./_db');
const defaultConfig = require('../../site-config.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  try {
    const r = await query(`select value from site_settings where key = 'site_config' limit 1`, []);
    const config = r.rows[0]?.value || defaultConfig;
    return json(200, { config });
  } catch (e) {
    return json(200, { config: defaultConfig });
  }
};
