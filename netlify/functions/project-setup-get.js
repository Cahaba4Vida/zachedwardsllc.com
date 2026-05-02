const { json } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const projectId = Number((event.queryStringParameters || {}).project_id || 0);
  if (!projectId) return json(400, { error: 'project_id is required' });

  const pr = await query(
    `select id, quote_id, project_name, kind, classification, status, setup_completed, maintenance_cents
       from client_projects
      where id = $1 and user_id = $2
      limit 1`,
    [projectId, auth.user.userId]
  );
  const project = pr.rows[0];
  if (!project) return json(404, { error: 'Project not found' });

  const sr = await query(`select answers_json from project_setup_submissions where project_id = $1 limit 1`, [projectId]);
  return json(200, { project, answers: sr.rows[0]?.answers_json || {} });
};
