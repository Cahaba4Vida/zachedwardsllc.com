const { json } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');

function nextStep(row) {
  if (!row.setup_completed) return 'Complete the setup handoff so planning can move into build.';
  if (row.status === 'deposit_paid') return 'Setup is complete. Project can now move into build.';
  if (row.status === 'setup_in_progress') return 'Finish any remaining setup details and confirm references.';
  if (row.status === 'in_build') return 'Project is currently being built.';
  if (row.status === 'review') return 'Review and approval are the current focus.';
  if (row.status === 'completed') return row.client_approved ? 'Completed and approved.' : 'Completed. Awaiting approval.';
  return 'Project is in progress.';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const r = await query(
    `select p.id as project_id, p.quote_id, p.project_name, p.kind, p.classification, p.status,
            p.deposit_paid, p.quoted_total_cents, p.maintenance_cents, p.setup_completed, p.client_approved,
            p.created_at, p.updated_at
       from client_projects p
      where p.user_id = $1
      order by p.created_at desc`,
    [auth.user.userId]
  );

  return json(200, {
    projects: r.rows.map((row) => ({ ...row, next_step: nextStep(row) })),
  });
};
