import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

const TIER_COLORS = {
  basic: { bg: '#E3F2FD', border: '#1565C0', text: '#1565C0', accent: '#1976D2' },
  pro: { bg: '#FFF3E0', border: '#E65100', text: '#E65100', accent: '#F57C00' },
};

export default function UpgradePrompt({ feature, requiredTier, compact = false }) {
  const { getRequiredTier, allTiers, openCheckout, tier: currentTier } = useSubscription();

  const needed = requiredTier || getRequiredTier(feature);
  const tierData = allTiers[needed] || allTiers.pro;
  const colors = TIER_COLORS[needed] || TIER_COLORS.pro;

  if (compact) {
    return (
      <button
        onClick={() => openCheckout(needed)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '20px',
          background: colors.bg, border: `1px solid ${colors.border}`,
          color: colors.text, fontSize: '0.75rem', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <Lock size={12} />
        Upgrade to {tierData.name} — {tierData.priceLabel}
      </button>
    );
  }

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '32px 24px',
      textAlign: 'center', border: `2px solid ${colors.border}`,
      maxWidth: '380px', margin: '24px auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Sparkles size={24} color={colors.accent} />
      </div>

      <h3 style={{
        fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-secondary)',
        margin: '0 0 8px',
      }}>
        {tierData.name} Feature
      </h3>

      <p style={{
        fontSize: '0.85rem', color: 'var(--color-text)', margin: '0 0 20px',
        lineHeight: 1.5,
      }}>
        This feature is available on the <strong>{tierData.name}</strong> plan.
        Upgrade to unlock it and more.
      </p>

      <button
        onClick={() => openCheckout(needed)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: '12px',
          background: colors.accent, border: 'none',
          color: 'white', fontSize: '0.9rem', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: `0 4px 12px ${colors.accent}40`,
        }}
      >
        Upgrade to {tierData.name} — {tierData.priceLabel}
        <ArrowRight size={16} />
      </button>

      <p style={{
        fontSize: '0.7rem', color: 'var(--color-text)', marginTop: '12px',
        opacity: 0.6,
      }}>
        Cancel anytime. You're currently on the <strong>{allTiers[currentTier]?.name || 'Free'}</strong> plan.
      </p>
    </div>
  );
}
