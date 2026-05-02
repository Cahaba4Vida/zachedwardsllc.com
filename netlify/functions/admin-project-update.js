const { json, readJson } = require('./_util');
const { requireAdmin } = require('./_admin');
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const admin = await requireAdmin(event);
  if (!admin.ok) return admin.response;

  const body = readJson(event);
  const projectId = Number(body.project_id || 0);
  if (!projectId) return json(400, { error: 'project_id is required' });

  const allowedStatuses = ['deposit_paid', 'setup_in_progress', 'in_build', 'review', 'completed'];
  const status = allowedStatuses.includes(body.status) ? body.status : 'deposit_paid';

  await query(
    `update client_projects
        set status = $2,
            client_approved = $3,
            setup_completed = $4,
            updated_at = now()
      where id = $1`,
    [projectId, status, !!body.client_approved, !!body.setup_completed]
  );

  return json(200, { ok: true });
};
