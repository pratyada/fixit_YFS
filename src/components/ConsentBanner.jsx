import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

const CONSENT_KEY = 'fixit_consent';

export default function ConsentBanner() {
  const { t } = useTranslation('compliance');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: 'white', borderTop: '1px solid var(--color-border, #e0e0e0)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
      padding: '16px 20px',
      paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 16px), 24px)',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#EDE7F6', color: '#5E35B1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Shield size={16} />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text, #666)', lineHeight: 1.5, margin: 0 }}>
            {t('consentBanner.message')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <a
            href="#/privacy"
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: 'transparent', border: '1px solid var(--color-border, #e0e0e0)',
              color: 'var(--color-text, #666)', fontSize: '0.72rem', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            {t('consentBanner.learnMore')}
          </a>
          <button
            onClick={accept}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              background: 'var(--color-secondary, #4E4E53)', border: 'none',
              color: 'white', fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('consentBanner.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
