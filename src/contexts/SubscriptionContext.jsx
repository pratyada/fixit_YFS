import { createContext, useContext, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from './AuthContext';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// API base URL — defaults to same origin (CloudFront proxies /api/* to API Gateway)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const SubscriptionContext = createContext(null);

// Feature → minimum tier required
const FEATURE_TIER_MAP = {
  // Free features
  exerciseBrowse: 'free',
  painJournal: 'free',
  basicStats: 'free',

  // Basic features
  fullLibrary: 'basic',
  unlimitedSessions: 'basic',
  progressCharts: 'basic',
  outcomeMeasures: 'basic',

  // Basic features — health
  foodFavorites: 'basic',
  foodPhotos: 'basic',
  healthReports: 'basic',
  bodyMetricsFull: 'basic',
  healthCharts: 'basic',

  // Pro features
  poseChecker: 'pro',
  videoRecording: 'pro',
  exercise3D: 'pro',
  programs: 'pro',
  reports: 'pro',
  aiInsights: 'pro',
  reportParsing: 'pro',
  unlimitedHistory: 'pro',
};

const TIER_LEVELS = { free: 0, basic: 1, pro: 2 };

// Price IDs — set these in your Stripe dashboard and update here
const PRICE_IDS = {
  basic: import.meta.env.VITE_STRIPE_PRICE_BASIC || '',
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
};

const TIER_INFO = {
  free: { name: 'Free', price: 0, priceLabel: 'Free' },
  basic: { name: 'Basic', price: 7, priceLabel: '$7/mo' },
  pro: { name: 'Pro', price: 15, priceLabel: '$15/mo' },
};

export function SubscriptionProvider({ children }) {
  const { user, profile } = useAuth();

  const value = useMemo(() => {
    const tier = profile?.subscriptionTier || 'free';
    const tierLevel = TIER_LEVELS[tier] || 0;

    function canUseFeature(featureName) {
      const requiredTier = FEATURE_TIER_MAP[featureName];
      if (!requiredTier) return true; // unknown features are allowed
      return tierLevel >= (TIER_LEVELS[requiredTier] || 0);
    }

    function getRequiredTier(featureName) {
      return FEATURE_TIER_MAP[featureName] || 'free';
    }

    async function openCheckout(tierKey) {
      const priceId = PRICE_IDS[tierKey];
      if (!priceId) {
        console.error(`No price ID configured for tier: ${tierKey}`);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId,
            uid: user?.uid,
            email: user?.email,
            returnUrl: window.location.origin,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error('Failed to create checkout session:', err);
      }
    }

    async function openPortal() {
      const customerId = profile?.stripeCustomerId;
      if (!customerId) return;

      try {
        const res = await fetch(`${API_BASE}/api/create-portal-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stripeCustomerId: customerId,
            returnUrl: window.location.origin,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error('Failed to create portal session:', err);
      }
    }

    return {
      tier,
      tierLevel,
      tierInfo: TIER_INFO[tier] || TIER_INFO.free,
      allTiers: TIER_INFO,
      isFreeTier: tier === 'free',
      isBasic: tierLevel >= TIER_LEVELS.basic,
      isPro: tierLevel >= TIER_LEVELS.pro,
      subscriptionStatus: profile?.subscriptionStatus || null,
      currentPeriodEnd: profile?.currentPeriodEnd || null,
      stripeCustomerId: profile?.stripeCustomerId || null,
      canUseFeature,
      getRequiredTier,
      openCheckout,
      openPortal,
      FEATURE_TIER_MAP,
      PRICE_IDS,
    };
  }, [user, profile]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

export default SubscriptionContext;
