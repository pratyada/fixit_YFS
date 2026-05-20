import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stripeCustomerId, returnUrl } = req.body;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'Missing required field: stripeCustomerId' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${req.headers.origin}/#/subscription`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
