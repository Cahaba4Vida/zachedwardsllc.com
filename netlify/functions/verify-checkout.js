const Stripe = require('stripe');
const { Client } = require('pg');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(payload)
  };
}

function getConnectionString() {
  return process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || '';
}

function createClient() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;
  return new Client({ connectionString, ssl: { rejectUnauthorized: false } });
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return json(500, { error: 'Missing STRIPE_SECRET_KEY environment variable.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const sessionId = String(body.sessionId || '').trim();
  const siteId = String(body.siteId || '').trim();
  if (!sessionId || !siteId) return json(400, { error: 'sessionId and siteId are required.' });

  const stripe = new Stripe(secretKey);
  const client = createClient();
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';
    const orderId = session.metadata?.order_id || uid('order');
    const previewSlug = session.metadata?.preview_slug || null;
    let quote = null;

    if (client) {
      await client.connect();
      const orderRes = await client.query(`select * from public.builder_orders where id = $1 or stripe_session_id = $2 limit 1`, [orderId, sessionId]);
      const order = orderRes.rows[0] || null;
      quote = order?.quote_json || null;

      if (order) {
        await client.query(
          `update public.builder_orders
             set status = $1,
                 stripe_session_id = $2,
                 paid_at = case when $1 = 'paid' then now() else paid_at end,
                 updated_at = now()
           where id = $3`,
          [paid ? 'paid' : 'pending', sessionId, order.id]
        );

        if (paid && order.gallery_opt_in && order.preview_slug) {
          await client.query(
            `insert into public.builder_gallery_projects (
              id, order_id, preview_slug, site_name, business_name, gallery_note,
              customer_built_note, preview_enabled, quote_json, site_snapshot
            ) values ($1,$2,$3,$4,$5,$6,$7,true,$8::jsonb,$9::jsonb)
            on conflict (preview_slug) do update
            set order_id = excluded.order_id,
                site_name = excluded.site_name,
                business_name = excluded.business_name,
                gallery_note = excluded.gallery_note,
                customer_built_note = excluded.customer_built_note,
                preview_enabled = true,
                quote_json = excluded.quote_json,
                site_snapshot = excluded.site_snapshot,
                updated_at = now()`,
            [
              uid('gallery'),
              order.id,
              order.preview_slug,
              order.site_name,
              order.business_name,
              order.gallery_note,
              order.customer_built_note,
              JSON.stringify(order.quote_json || {}),
              JSON.stringify(order.site_snapshot || {})
            ]
          );
        }
      }
    }

    return json(200, {
      ok: true,
      paid,
      orderId,
      paidAt: paid ? new Date().toISOString() : null,
      previewSlug,
      quote
    });
  } catch (error) {
    return json(500, { error: error.message || 'Unable to verify checkout session.' });
  } finally {
    await client?.end().catch(() => {});
  }
};
