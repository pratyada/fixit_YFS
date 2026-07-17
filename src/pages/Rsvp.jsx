import { useState } from 'react';
import { Check, Calendar, MapPin } from 'lucide-react';
import { subscribe } from '../lib/subscribe';

// Public RSVP page. Reads optional query params so it's reusable per event:
//   /rsvp?e=Event+Title&d=Sun+3PM+·+11+Caperol+Ct&c=watch-party
const q = new URLSearchParams(window.location.search);
const EVENT = q.get('e') || 'FIFA 2026 Finale — Watch Party';
const DETAIL = q.get('d') || 'Sunday · 3:00 PM · 11 Caperol Ct';
const CATEGORY = q.get('c') || 'watch-party';

export default function Rsvp() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading'); setError('');
    try {
      await subscribe(email.trim(), name.trim(), { category: CATEGORY, source: 'rsvp' });
      setState('done');
    } catch (err) {
      setError(err.message || 'Something went wrong'); setState('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'radial-gradient(120% 80% at 50% 0%, #2b3531, #141917)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      fontFamily: "'Tenor Sans','Optima',system-ui,sans-serif", color: '#eef4f1',
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '34px 30px',
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: '0.95rem', letterSpacing: '1px', marginBottom: '20px' }}>
          <span style={{ fontWeight: 700 }}>FIXIT</span> <span style={{ opacity: 0.55, fontFamily: 'system-ui' }}>by YourFormSux</span>
        </div>

        {state === 'done' ? (
          <>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#708E86', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>You're on the list! 🎉</h1>
            <p style={{ fontFamily: 'system-ui', fontSize: '0.9rem', color: '#a9c2b8', lineHeight: 1.5 }}>
              We'll email you the details for <strong style={{ color: '#eef4f1' }}>{EVENT}</strong>. See you there.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2.5px', color: '#d3ac57', fontFamily: 'system-ui', fontWeight: 700, marginBottom: '10px' }}>You're invited</div>
            <h1 style={{ fontSize: 'clamp(1.5rem,5vw,2rem)', lineHeight: 1.15, margin: '0 0 14px', textWrap: 'balance' }}>{EVENT}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'system-ui', fontSize: '0.85rem', color: '#a9c2b8', marginBottom: '24px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'center' }}><Calendar size={14} /> {DETAIL.split('·')[0]?.trim()}{DETAIL.includes('·') ? ' · ' + DETAIL.split('·')[1]?.trim() : ''}</span>
              {DETAIL.split('·')[2] && <span style={{ display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'center' }}><MapPin size={14} /> {DETAIL.split('·').slice(2).join('·').trim()}</span>}
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
                style={inp} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com"
                style={inp} />
              <button type="submit" disabled={state === 'loading'} style={{
                marginTop: '4px', padding: '13px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#e6c987,#d3ac57)', color: '#1c2321', fontWeight: 800, fontSize: '0.95rem',
                fontFamily: 'system-ui', opacity: state === 'loading' ? 0.7 : 1,
              }}>
                {state === 'loading' ? 'Reserving…' : 'RSVP — Reserve my spot'}
              </button>
            </form>
            {state === 'error' && <p style={{ color: '#e79a9a', fontSize: '0.78rem', marginTop: '10px', fontFamily: 'system-ui' }}>{error}</p>}
            <p style={{ fontFamily: 'system-ui', fontSize: '0.68rem', color: '#7f9089', marginTop: '16px' }}>
              We'll only email you about this event and FIXIT updates. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const inp = {
  width: '100%', padding: '12px 14px', borderRadius: '11px', boxSizing: 'border-box',
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
  color: '#eef4f1', fontSize: '0.9rem', fontFamily: 'system-ui',
};
