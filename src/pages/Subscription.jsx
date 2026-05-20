import { Check, X, Crown, Sparkles, CreditCard, ExternalLink } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const TIERS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#6B7280',
    features: [
      { name: 'Browse 5 exercises', included: true },
      { name: '2 sessions per week', included: true },
      { name: 'Pain journal', included: true },
      { name: 'Basic stats', included: true },
      { name: 'Full exercise library', included: false },
      { name: 'Progress charts', included: false },
      { name: 'AI pose scoring', included: false },
      { name: 'Video recording', included: false },
      { name: '3D visualizations', included: false },
      { name: 'Programs & protocols', included: false },
    ],
  },
  {
    key: 'basic',
    name: 'Basic',
    price: '$7',
    period: '/month',
    color: '#1565C0',
    popular: false,
    features: [
      { name: 'Full exercise library', included: true },
      { name: 'Unlimited sessions', included: true },
      { name: 'Pain journal', included: true },
      { name: 'Full progress charts', included: true },
      { name: 'Outcome measures', included: true },
      { name: 'AI pose scoring', included: false },
      { name: 'Video recording', included: false },
      { name: '3D visualizations', included: false },
      { name: 'Programs & protocols', included: false },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$15',
    period: '/month',
    color: '#F57C00',
    popular: true,
    features: [
      { name: 'Everything in Basic', included: true },
      { name: 'AI pose scoring', included: true },
      { name: 'Video recording & analysis', included: true },
      { name: '3D exercise visualizations', included: true },
      { name: 'Programs & protocols', included: true },
      { name: 'Reports & uploads', included: true },
      { name: 'Priority support', included: true },
    ],
  },
];

export default function Subscription() {
  const { tier, tierInfo, subscriptionStatus, currentPeriodEnd, stripeCustomerId, openCheckout, openPortal } = useSubscription();

  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  const isPastDue = subscriptionStatus === 'past_due';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>Subscription</h1>
        <p style={{ fontSize: '0.85rem' }}>Choose the plan that works for you</p>
      </div>

      {/* Current plan banner */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '16px', padding: '20px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Crown size={18} />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7 }}>
            Current Plan
          </span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{tierInfo.name}</div>
        {isActive && currentPeriodEnd && (
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
            Renews {new Date(currentPeriodEnd.seconds ? currentPeriodEnd.seconds * 1000 : currentPeriodEnd).toLocaleDateString()}
          </div>
        )}
        {isPastDue && (
          <div style={{
            marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(255,82,82,0.2)', fontSize: '0.78rem',
          }}>
            Payment failed. Please update your payment method.
          </div>
        )}
        {stripeCustomerId && (
          <button onClick={openPortal} style={{
            marginTop: '12px', padding: '8px 16px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <CreditCard size={14} /> Manage Billing <ExternalLink size={12} />
          </button>
        )}
      </div>

      {/* URL params feedback */}
      {window.location.hash.includes('success=true') && (
        <div style={{
          background: '#E8F5E9', borderRadius: '12px', padding: '14px 16px',
          border: '1px solid #C8E6C9', color: '#2E7D32', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Check size={16} /> Subscription activated! Welcome to the {tierInfo.name} plan.
        </div>
      )}

      {/* Pricing tiers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {TIERS.map(t => {
          const isCurrent = t.key === tier;
          const isUpgrade = !isCurrent && (t.key === 'basic' || t.key === 'pro');
          return (
            <div key={t.key} style={{
              background: 'white', borderRadius: '16px',
              border: t.popular ? `2px solid ${t.color}` : '1px solid var(--color-border)',
              padding: '20px', position: 'relative',
              opacity: isCurrent ? 1 : 0.95,
            }}>
              {t.popular && (
                <div style={{
                  position: 'absolute', top: '-10px', right: '16px',
                  background: t.color, color: 'white',
                  padding: '3px 12px', borderRadius: '50px',
                  fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <Sparkles size={10} /> Most Popular
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{t.name}</div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: t.color }}>{t.price}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{t.period}</span>
                  </div>
                </div>
                {isCurrent && (
                  <div style={{
                    padding: '4px 12px', borderRadius: '50px',
                    background: '#E8F5E9', color: '#2E7D32',
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                  }}>
                    Current
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {t.features.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '0.8rem',
                    color: f.included ? 'var(--color-secondary)' : 'var(--color-text)',
                    opacity: f.included ? 1 : 0.4,
                  }}>
                    {f.included ? <Check size={14} color="#4CAF50" /> : <X size={14} />}
                    {f.name}
                  </div>
                ))}
              </div>

              {isUpgrade && !isCurrent && (
                <button onClick={() => openCheckout(t.key)} style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  background: t.popular ? t.color : 'var(--color-secondary)',
                  border: 'none', color: 'white',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  Upgrade to {t.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.5 }}>
        All plans include a 14-day money-back guarantee. Cancel anytime from the billing portal.
        Payments are processed securely by Stripe.
      </p>
    </div>
  );
}
