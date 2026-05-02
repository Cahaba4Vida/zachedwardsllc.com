const { json, readJson } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const body = readJson(event);
  const projectId = Number(body.project_id || 0);
  if (!projectId) return json(400, { error: 'project_id is required' });

  const pr = await query(`select id from client_projects where id = $1 and user_id = $2 limit 1`, [projectId, auth.user.userId]);
  if (!pr.rows[0]) return json(404, { error: 'Project not found' });

  const answers = { ...body };
  delete answers.project_id;

  await query(
    `insert into project_setup_submissions (project_id, user_id, answers_json, created_at, updated_at)
     values ($1,$2,$3::jsonb,now(),now())
     on conflict (project_id) do update set answers_json = excluded.answers_json, updated_at = now()`,
    [projectId, auth.user.userId, JSON.stringify(answers)]
  );

  await query(
    `update client_projects
        set setup_completed = true,
            status = case when status = 'deposit_paid' then 'setup_in_progress' else status end,
            project_name = coalesce(nullif($2, ''), project_name),
            updated_at = now()
      where id = $1`,
    [projectId, answers.project_name || '']
  );

  return json(200, { ok: true });
};
