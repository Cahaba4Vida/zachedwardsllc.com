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

function getOrigin(event) {
  const proto = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  return `${proto}://${host}`;
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

  const quote = body.quote || {};
  const intake = body.intake || {};
  const siteSnapshot = body.siteSnapshot || {};
  const siteId = String(body.siteId || siteSnapshot.id || '');
  const siteName = String(body.siteName || siteSnapshot.name || 'Untitled project');
  const previewSlug = String(body.previewSlug || '').trim();
  const customerEmail = String(intake.customerEmail || body.ownerEmail || '').trim();
  const customerName = String(intake.customerName || '').trim();
  const totalNow = Number(quote.totalNow || 0);

  if (!siteId) return json(400, { error: 'siteId is required.' });
  if (!customerEmail) return json(400, { error: 'customerEmail is required.' });
  if (!customerName) return json(400, { error: 'customerName is required.' });
  if (!Number.isFinite(totalNow) || totalNow <= 0) return json(400, { error: 'Quote total must be greater than zero.' });
  if (!intake.deploymentAgreement || !intake.domainDisclaimerAccepted) {
    return json(400, { error: 'Required customer terms were not accepted.' });
  }

  const stripe = new Stripe(secretKey);
  const orderId = uid('order');
  const origin = getOrigin(event);
  const amount = Math.round(totalNow * 100);
  const featureSummary = Array.isArray(quote.featureSummary) ? quote.featureSummary.slice(0, 8).join(' | ') : '';

  const client = createClient();
  try {
    if (client) {
      await client.connect();
      await client.query(
        `insert into public.builder_orders (
          id, site_id, owner_id, site_name, customer_name, customer_email, business_name,
          host_preference, wants_domain, requested_domain, gallery_opt_in, gallery_note,
          customer_built_note, preview_slug, quoted_now_cents, estimated_domain_cents,
          feature_flags, additional_features, terms_accepted, status, quote_json, intake_json, site_snapshot
        ) values (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,$10,$11,$12,
          $13,$14,$15,$16,
          $17::jsonb,$18,$19,$20,$21::jsonb,$22::jsonb,$23::jsonb
        )`,
        [
          orderId,
          siteId,
          body.ownerId || null,
          siteName,
          customerName,
          customerEmail,
          intake.businessName || null,
          intake.hostPreference || null,
          !!intake.wantsDomain,
          intake.requestedDomain || null,
          !!intake.galleryOptIn,
          intake.galleryNote || null,
          intake.customerBuiltNote !== false,
          previewSlug || null,
          amount,
          Math.round(Number(quote.estimatedDomain || 0) * 100),
          JSON.stringify(quote.featureFlags || {}),
          intake.featureNotes || null,
          true,
          'pending',
          JSON.stringify(quote || {}),
          JSON.stringify(intake || {}),
          JSON.stringify(siteSnapshot || {})
        ]
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}&site_id=${encodeURIComponent(siteId)}`,
      cancel_url: `${origin}/?checkout=cancelled&site_id=${encodeURIComponent(siteId)}`,
      metadata: {
        order_id: orderId,
        site_id: siteId,
        site_name: siteName.slice(0, 100),
        preview_slug: previewSlug.slice(0, 100),
        customer_email: customerEmail.slice(0, 200)
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: `${siteName} · ${body.productName || 'Manual Webbuilder package'}`,
              description: featureSummary || 'Base build package with selected paid add-ons.'
            }
          },
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      payment_method_types: ['card']
    });

    if (client) {
      await client.query(`update public.builder_orders set stripe_session_id = $1, updated_at = now() where id = $2`, [session.id, orderId]);
    }

    return json(200, { ok: true, url: session.url, sessionId: session.id, orderId });
  } catch (error) {
    return json(500, { error: error.message || 'Unable to create checkout session.' });
  } finally {
    await client?.end().catch(() => {});
  }
};
