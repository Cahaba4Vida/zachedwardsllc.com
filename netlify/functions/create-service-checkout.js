const { json, readJson } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, '');
  if (raw.startsWith('//')) return `https:${raw}`.replace(/\/$/, '');
  return `https://${raw.replace(/^\/+/, '')}`.replace(/\/$/, '');
}

function pickBaseUrl(event) {
  const headers = event.headers || {};
  const proto =
    headers['x-forwarded-proto'] ||
    headers['X-Forwarded-Proto'] ||
    'https';
  const host =
    headers['x-forwarded-host'] ||
    headers['X-Forwarded-Host'] ||
    headers.host ||
    headers.Host ||
    '';

  const envBase =
    process.env.PUBLIC_BASE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.DEPLOY_URL ||
    '';

  if (envBase) return normalizeBaseUrl(envBase);
  if (host) return normalizeBaseUrl(`${proto}://${host}`);
  return '';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Missing STRIPE_SECRET_KEY' });

  const body = readJson(event);
  if (!body.quote_id) return json(400, { error: 'quote_id is required' });
  if (!body.accepted_terms) return json(400, { error: 'Terms must be accepted before checkout.' });

  const qr = await query(
    `select id, user_id, email, kind, classification, quoted_total_cents, deposit_cents, monthly_cents
       from project_quotes
      where id = $1 and user_id = $2
      limit 1`,
    [body.quote_id, auth.user.userId]
  );
  const quote = qr.rows[0];
  if (!quote) return json(404, { error: 'Quote not found' });

  const base = pickBaseUrl(event);
  if (!base) return json(500, { error: 'Missing PUBLIC_BASE_URL / URL for checkout.' });
  const successUrl = `${base}/account/?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const requestRoute = quote.kind === 'website' ? 'request-website' : quote.kind === 'app' ? 'request-app' : 'request-software';
  const cancelUrl = `${base}/${requestRoute}/?checkout=cancel`;

  const name = quote.kind === 'website' ? 'Website deposit' : quote.kind === 'app' ? 'App deposit' : 'Software deposit';
  const description = `${quote.classification} ${quote.kind} request deposit toward ${quote.quoted_total_cents ? '$' + (quote.quoted_total_cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'project quote'}`;

  const params = new URLSearchParams({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: 'true',
    billing_address_collection: 'auto',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': name,
    'line_items[0][price_data][product_data][description]': description,
    'line_items[0][price_data][unit_amount]': String(quote.deposit_cents),
    'line_items[0][quantity]': '1',
    customer_email: quote.email || auth.user.email || '',
    'metadata[user_id]': String(auth.user.userId),
    'metadata[quote_id]': String(quote.id),
    'metadata[kind]': String(quote.kind),
    'metadata[classification]': String(quote.classification),
    'metadata[quoted_total_cents]': String(quote.quoted_total_cents || 0),
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json(res.status || 500, { error: data?.error?.message || 'Stripe error' });

  await query(
    `update project_quotes
        set stripe_checkout_session_id = $2,
            terms_version = $3,
            terms_accepted_at = now()
      where id = $1`,
    [quote.id, data.id, body.terms_version || 'v2_2026_03_quote_acceptance']
  );

  return json(200, { ok: true, url: data.url });
};
