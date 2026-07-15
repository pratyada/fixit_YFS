import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { subscribe } from '../lib/subscribe';

// Public newsletter signup. `variant`: 'section' (boxed, for landing) or
// 'inline' (compact, for guide/blog footers).
export default function SubscribeForm({
  variant = 'section',
  heading = 'Get FIXIT tips in your inbox',
  subtext = 'Training guides, nutrition science, and product updates. No spam.',
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading'); setError('');
    try {
      await subscribe(email.trim());
      setState('done');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
        color: 'var(--color-accent)', fontSize: '0.9rem', fontWeight: 600,
        padding: variant === 'section' ? '20px' : '8px',
      }}>
        <Check size={18} /> You're subscribed — check your inbox.
      </div>
    );
  }

  const box = variant === 'section';
  return (
    <div style={box ? {
      background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px',
      padding: '28px', textAlign: 'center', maxWidth: '520px', margin: '0 auto',
    } : { padding: '4px 0' }}>
      {box && (
        <>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 12px',
            background: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={20} style={{ color: 'var(--color-accent)' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--color-secondary)' }}>{heading}</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '16px' }}>{subtext}</p>
        </>
      )}
      <form onSubmit={submit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com" aria-label="Email address"
          style={{
            flex: '1 1 220px', minWidth: 0, padding: '11px 14px', borderRadius: '10px',
            border: '1px solid var(--color-border)', fontSize: '0.85rem', background: 'white',
          }}
        />
        <button type="submit" disabled={state === 'loading'} style={{
          padding: '11px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: 'var(--color-secondary)', color: 'white', fontSize: '0.85rem', fontWeight: 700,
          opacity: state === 'loading' ? 0.7 : 1, whiteSpace: 'nowrap',
        }}>
          {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {state === 'error' && (
        <p style={{ color: '#d64545', fontSize: '0.75rem', marginTop: '8px' }}>{error}</p>
      )}
    </div>
  );
}
