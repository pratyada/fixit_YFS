import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, uid, email, returnUrl } = req.body;

    if (!priceId || !uid || !email) {
      return res.status(400).json({ error: 'Missing required fields: priceId, uid, email' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl || req.headers.origin}/#/subscription?success=true`,
      cancel_url: `${returnUrl || req.headers.origin}/#/subscription?canceled=true`,
      metadata: { firebaseUid: uid },
      subscription_data: {
        metadata: { firebaseUid: uid },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
