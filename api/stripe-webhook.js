import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin (once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

// Map Stripe price IDs to tier names
function getTierFromPriceId(priceId) {
  const PRICE_TIER_MAP = {
    [process.env.STRIPE_PRICE_BASIC]: 'basic',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
  };
  return PRICE_TIER_MAP[priceId] || 'basic';
}

async function updateUserSubscription(firebaseUid, data) {
  await db.collection('users').doc(firebaseUid).update({
    ...data,
    updatedAt: new Date(),
  });
}

async function handleCheckoutCompleted(session) {
  const uid = session.metadata?.firebaseUid;
  if (!uid) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const priceId = subscription.items.data[0]?.price?.id;

  await updateUserSubscription(uid, {
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    subscriptionTier: getTierFromPriceId(priceId),
    subscriptionStatus: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

async function handleSubscriptionUpdated(subscription) {
  const uid = subscription.metadata?.firebaseUid;
  if (!uid) return;

  const priceId = subscription.items.data[0]?.price?.id;

  await updateUserSubscription(uid, {
    subscriptionTier: subscription.status === 'active' ? getTierFromPriceId(priceId) : 'free',
    subscriptionStatus: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

async function handleSubscriptionDeleted(subscription) {
  const uid = subscription.metadata?.firebaseUid;
  if (!uid) return;

  await updateUserSubscription(uid, {
    subscriptionTier: 'free',
    subscriptionStatus: 'canceled',
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
  });
}

async function handlePaymentFailed(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const uid = subscription.metadata?.firebaseUid;
  if (!uid) return;

  await updateUserSubscription(uid, {
    subscriptionStatus: 'past_due',
  });
}

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err.message);
    return res.status(500).json({ error: 'Webhook handler error' });
  }

  return res.status(200).json({ received: true });
}
