const Stripe = require('stripe');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(payload)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return json(500, { error: 'Missing STRIPE_SECRET_KEY environment variable.' });

  const sessionId = String((event.queryStringParameters || {}).session_id || '').trim();
  if (!sessionId) return json(400, { error: 'session_id is required.' });

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const product = session.metadata?.portable_ai_product || '';
    const paid = session.payment_status === 'paid';
    return json(200, {
      ok: true,
      paid,
      product,
      customerEmail: session.customer_details?.email || '',
      amountTotal: session.amount_total || 0
    });
  } catch (error) {
    return json(500, { error: error.message || 'Unable to verify checkout session.' });
  }
};
