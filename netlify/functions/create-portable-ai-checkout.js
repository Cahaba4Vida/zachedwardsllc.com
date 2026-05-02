const Stripe = require('stripe');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(payload)
  };
}

function getOrigin(event) {
  const proto = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  return `${proto}://${host}`;
}

const PRODUCTS = {
  ssd: {
    amount: 30000,
    name: 'Portable AI SSD',
    description: 'Complete offline-ready local AI SSD setup for remote work, travel, and private use.'
  },
  flash: {
    amount: 7000,
    name: 'Portable AI Flash Drive',
    description: 'Portable entry setup for fully offline local AI on a flash drive.'
  },
  download: {
    amount: 3500,
    name: 'Bring Your Own Drive Install',
    description: 'Software-only Jarvas portable install for customers providing their own SSD or flash drive.'
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return json(500, { error: 'Missing STRIPE_SECRET_KEY environment variable.' });

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const productKey = String(body.product || '').trim().toLowerCase();
  const product = PRODUCTS[productKey];
  if (!product) return json(400, { error: 'Invalid product requested.' });

  try {
    const stripe = new Stripe(secretKey);
    const origin = getOrigin(event);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${origin}/software/jarvas-local/unlock/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/software/jarvas-local/unlock/?checkout=cancelled&product=${encodeURIComponent(productKey)}`,
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      metadata: {
        portable_ai_product: productKey
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: product.amount,
            product_data: {
              name: product.name,
              description: product.description
            }
          }
        }
      ]
    });

    return json(200, {
      ok: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    return json(500, { error: error.message || 'Unable to create portable AI checkout.' });
  }
};
