const { json } = require('./_util');
const { requireAdmin } = require('./_admin');
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  const admin = await requireAdmin(event);
  if (!admin.ok) return admin.response;

  const r = await query(
    `select id as project_id, quote_id, project_name, kind, classification, status, email,
            deposit_paid, quoted_total_cents, maintenance_cents, setup_completed, client_approved, created_at
       from client_projects
      order by created_at desc
      limit 100`,
    []
  );
  return json(200, { projects: r.rows });
};
