const { json, readJson } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Missing STRIPE_SECRET_KEY' });

  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const body = readJson(event);
  if (!body.session_id) return json(400, { error: 'session_id is required' });

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(body.session_id)}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json(res.status || 500, { error: data?.error?.message || 'Stripe lookup failed' });

  const metadata = data.metadata || {};
  const quoteId = Number(metadata.quote_id || 0);
  if (!quoteId) return json(400, { error: 'Checkout metadata missing quote_id' });

  const qr = await query(
    `select id, user_id, email, kind, classification, quoted_total_cents, deposit_cents, monthly_cents, intake_json, stripe_checkout_session_id
       from project_quotes
      where id = $1 and user_id = $2
      limit 1`,
    [quoteId, auth.user.userId]
  );
  const quote = qr.rows[0];
  if (!quote) return json(404, { error: 'Quote not found for this user' });

  const paid = data.payment_status === 'paid' || data.status === 'complete';
  if (!paid) return json(400, { error: 'Checkout session is not paid yet' });

  await query(
    `update project_quotes
        set status = 'deposit_paid',
            stripe_checkout_session_id = $2,
            stripe_payment_status = $3,
            deposit_paid_at = now()
      where id = $1`,
    [quoteId, data.id, data.payment_status || data.status || 'paid']
  );

  const projectName = quote.intake_json?.business_name || quote.intake_json?.project_name || quote.intake_json?.name || (quote.kind === 'website' ? 'Website project' : quote.kind === 'app' ? 'App project' : 'Software project');

  const pr = await query(
    `insert into client_projects
      (quote_id, user_id, email, kind, classification, project_name, status, deposit_paid, quoted_total_cents, maintenance_cents, stripe_checkout_session_id, updated_at)
     values ($1,$2,$3,$4,$5,$6,'deposit_paid',true,$7,$8,$9,now())
     on conflict (quote_id) do update
       set deposit_paid = true,
           status = 'deposit_paid',
           quoted_total_cents = excluded.quoted_total_cents,
           maintenance_cents = excluded.maintenance_cents,
           stripe_checkout_session_id = excluded.stripe_checkout_session_id,
           project_name = coalesce(client_projects.project_name, excluded.project_name),
           updated_at = now()
     returning id, quote_id, status, setup_completed, project_name, quoted_total_cents, maintenance_cents, created_at`,
    [quote.id, quote.user_id, quote.email, quote.kind, quote.classification, projectName, quote.quoted_total_cents || 0, quote.monthly_cents || 0, data.id]
  );

  return json(200, {
    ok: true,
    project: {
      project_id: pr.rows[0].id,
      quote_id: pr.rows[0].quote_id,
      status: pr.rows[0].status,
      setup_completed: pr.rows[0].setup_completed,
      project_name: pr.rows[0].project_name,
      quoted_total_cents: pr.rows[0].quoted_total_cents,
      maintenance_cents: pr.rows[0].maintenance_cents,
      next_step: 'Complete the project setup handoff so the build can begin cleanly.',
      created_at: pr.rows[0].created_at,
    },
  });
};
