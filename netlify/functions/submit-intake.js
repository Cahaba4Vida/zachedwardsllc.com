const { json, readJson } = require('./_util');
const { requireUser } = require('./_auth');
const { query } = require('./_db');
const { classifyFallback, normalizeQuote } = require('./_quote');

async function aiClassify(kind, payload) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return classifyFallback(kind, payload);

  const system = `You classify inbound ${kind} service requests for Zach Edwards LLC.
Return only JSON with keys classification, quoted_total_cents, headline, summary.
Rules:
- classification must be "basic" or "custom"
- quoted_total_cents must be the actual total project quote the client is agreeing to
- Do not invent a deposit or monthly fee. Those are fixed by the backend lane.
- Websites basic should usually land between 90000 and 180000 cents.
- Websites custom should usually land between 250000 and 1200000 cents.
- Apps basic should usually land between 350000 and 650000 cents.
- Apps custom should usually land between 850000 and 3500000 cents.
- Software basic should usually land between 200000 and 500000 cents.
- Software custom should usually land between 600000 and 2500000 cents.
- Prefer custom if the scope sounds complex.
- Keep headline short and summary concise.
- Do not return markdown.`;

  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(payload) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  };

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return classifyFallback(kind, payload);
    const data = await res.json();
    let parsed = {};
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}'); } catch {}
    if (!parsed.classification || !parsed.quoted_total_cents) return classifyFallback(kind, payload);
    return normalizeQuote(kind, parsed, payload);
  } catch {
    return classifyFallback(kind, payload);
  }
}

async function sendFormSubmitEmail(kind, payload, quote) {
  const target = process.env.FORM_SUBMIT_EMAIL || 'zach@zachedwardsllc.com';
  const url = `https://formsubmit.co/ajax/${encodeURIComponent(target)}`;
  const form = {
    _subject: `New ${kind} request · ${payload.name || payload.email || 'new lead'}`,
    _template: 'table',
    _captcha: 'false',
    kind,
    classification: quote.classification,
    quoted_total_dollars: (Number(quote.quoted_total_cents || 0) / 100).toFixed(2),
    deposit_due_now_dollars: (Number(quote.deposit_cents || 0) / 100).toFixed(2),
    monthly_after_completion_dollars: (Number(quote.monthly_cents || 0) / 100).toFixed(2),
    quote_valid_days: quote.quote_valid_days,
    pricing_summary: quote.summary,
    ...payload,
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(form),
    });
  } catch (e) {
    console.error('FormSubmit failed', e);
  }
}

async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const auth = await requireUser(event);
  if (!auth.ok) return auth.response;

  const payload = readJson(event);
  const kind = payload.kind === 'app' ? 'app' : payload.kind === 'software' ? 'software' : 'website';

  if (!payload.name || !payload.email || !payload.project_summary) {
    return json(400, { error: 'Missing required intake fields' });
  }

  const quote = normalizeQuote(kind, await aiClassify(kind, payload), payload);
  const r = await query(
    `insert into project_quotes
      (user_id, email, kind, classification, quoted_total_cents, deposit_cents, monthly_cents, intake_json, headline, summary, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,'pending')
     returning id, kind, classification, quoted_total_cents, deposit_cents, monthly_cents, headline, summary, created_at`,
    [
      auth.user.userId,
      payload.email,
      kind,
      quote.classification,
      Number(quote.quoted_total_cents),
      Number(quote.deposit_cents),
      Number(quote.monthly_cents || 0),
      JSON.stringify(payload),
      quote.headline || `${kind} request`,
      quote.summary || '',
    ]
  );

  await query(
    `update user_profiles
        set email = coalesce(email, $2),
            interests = (
              select array(select distinct unnest(coalesce(interests, '{}') || $3::text[]))
            )
      where user_id = $1`,
    [auth.user.userId, payload.email, [kind === 'website' ? 'websites' : kind === 'app' ? 'apps' : 'software']]
  );

  sendFormSubmitEmail(kind, payload, quote).catch(() => {});
  return json(200, { ok: true, quote: { ...r.rows[0], quote_valid_days: quote.quote_valid_days } });
}

exports.handler = handler;
exports.classifyFallback = classifyFallback;
