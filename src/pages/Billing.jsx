import { useState, useMemo } from 'react';
import { Shield, Mic, Bone, Mail, PenTool, Palette, Check, CreditCard } from 'lucide-react';

// FIXIT is the product by Musée Initialize; clients (e.g. YourFormSux)
// subscribe to feature modules. This is the per-client subscription view —
// pricing linked to features, with the client's monthly total.
const CLIENT = 'YourFormSux';
const CURRENCY = 'CAD';
const MODULES = [
  { id: 'core', name: 'FIXIT Core', icon: Shield, price: 99, core: true, desc: 'Patient management, AI pose & form tracking, clinic dashboard, roles.' },
  { id: 'voice', name: 'Voice AI Kiosk', icon: Mic, price: 79, desc: 'Hands-free AI form coach — say “FIXIT”, get scored, spoken results.' },
  { id: 'anatomy', name: 'AI Anatomy Consult', icon: Bone, price: 129, desc: 'Interactive 3D body — mark injuries, link exercises, healing loop.' },
  { id: 'email', name: 'Email Marketing', icon: Mail, price: 49, desc: 'AI newsletters, subscribers, open/click tracking, 3 brand voices.' },
  { id: 'blog', name: 'Blog & SEO', icon: PenTool, price: 39, desc: 'AI blog posts with auto-SEO, sitemap and search indexing.' },
  { id: 'creatives', name: 'Creatives Studio', icon: Palette, price: 29, desc: 'AI posters, PNG exports and 10-second social videos.' },
];

export default function Billing() {
  // The client's currently-subscribed modules (core is always on).
  const [active, setActive] = useState(() => new Set(MODULES.map((m) => m.id)));
  const toggle = (m) => {
    if (m.core) return;
    setActive((prev) => { const n = new Set(prev); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n; });
  };
  const monthly = useMemo(() => MODULES.filter((m) => active.has(m.id)).reduce((s, m) => s + m.price, 0), [active]);
  const yearly = monthly * 10; // 2 months free on annual

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '920px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><CreditCard size={22} /> Subscription</h1>

      {/* Client + total */}
      <div style={{ background: 'linear-gradient(135deg, #2b3531, #4E4E53)', borderRadius: '20px', padding: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)' }}>FIXIT · by Musée Initialize</div>
          <div style={{ fontSize: '1.5rem', fontFamily: "'Tenor Sans', serif", marginTop: '2px' }}>{CLIENT}</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{active.size} module{active.size !== 1 ? 's' : ''} · billed monthly</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1 }}>${monthly}<span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.7 }}>/mo</span></div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>{CURRENCY} · or ${yearly}/yr (2 months free)</div>
        </div>
      </div>

      {/* Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {MODULES.map((m) => {
          const on = active.has(m.id);
          const Icon = m.icon;
          return (
            <div key={m.id} style={{
              background: 'white', border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px',
              opacity: on ? 1 : 0.7,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: on ? 'var(--color-accent)' : 'var(--color-bg-alt)', color: on ? 'white' : 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-secondary)' }}>${m.price}<span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text)' }}>/mo</span></div>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{m.name}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-text)', lineHeight: 1.45, flex: 1 }}>{m.desc}</div>
              {m.core ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent)' }}><Check size={14} /> Included in every plan</div>
              ) : (
                <button onClick={() => toggle(m)} style={{
                  padding: '8px', borderRadius: '9px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700,
                  border: on ? '1px solid var(--color-border)' : 'none',
                  background: on ? 'white' : 'var(--color-secondary)', color: on ? 'var(--color-text)' : 'white',
                }}>{on ? 'Remove from plan' : 'Add to plan'}</button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px 14px', lineHeight: 1.5 }}>
        <strong>Per-client subscription.</strong> FIXIT (by Musée Initialize) is licensed to clinics &amp; studios per feature module. This is the plan shown to <strong>{CLIENT}</strong>. Automated billing (Stripe) can be wired next; for now this is the pricing &amp; plan overview.
      </div>
    </div>
  );
}
