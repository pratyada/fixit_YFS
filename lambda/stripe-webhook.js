import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

function getTierFromPriceId(priceId) {
  const PRICE_TIER_MAP = {
    [process.env.STRIPE_PRICE_BASIC]: 'basic',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
  };
  return PRICE_TIER_MAP[priceId] || 'basic';
}

async function updateUserSubscription(firebaseUid, data) {
  await db.collection('users').doc(firebaseUid).update({ ...data, updatedAt: new Date() });
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
  await updateUserSubscription(uid, { subscriptionStatus: 'past_due' });
}

export const handler = async (event) => {
  const sig = event.headers?.['stripe-signature'];
  if (!sig) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing stripe-signature header' }) };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: `Webhook Error: ${err.message}` }) };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
    }
  } catch (err) {
    console.error(`Error handling ${stripeEvent.type}:`, err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Webhook handler error' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
