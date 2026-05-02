const { json } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const r = await query(
    `select id, kind, classification, quoted_total_cents, deposit_cents, monthly_cents, created_at, status, terms_accepted_at, deposit_paid_at
       from project_quotes
      where user_id = $1
      order by created_at desc
      limit 25`,
    [auth.user.userId]
  );
  return json(200, { quotes: r.rows });
};
