import { useMemo } from 'react';
import { Shield, Mic, Bone, Mail, PenTool, Palette, Check, CreditCard, Calendar } from 'lucide-react';

// The CLIENT's subscription view. FIXIT is the product by Musée Initialize;
// this is what a customer (here: YourFormSux, who purchased every module)
// sees for their own plan, billing and included features.
const CLIENT = 'YourFormSux';
const PLAN = 'Complete';
const CURRENCY = 'CAD';
const MODULES = [
  { id: 'core', name: 'FIXIT Core', icon: Shield, price: 99, desc: 'Patient management, AI pose & form tracking, clinic dashboard, roles.' },
  { id: 'voice', name: 'Voice AI Kiosk', icon: Mic, price: 79, desc: 'Hands-free AI form coach — say “FIXIT”, get scored, spoken results.' },
  { id: 'anatomy', name: 'AI Anatomy Consult', icon: Bone, price: 129, desc: 'Interactive 3D body — mark injuries, link exercises, healing loop, AR.' },
  { id: 'email', name: 'Email Marketing', icon: Mail, price: 49, desc: 'AI newsletters, subscribers, open/click tracking, 3 brand voices.' },
  { id: 'blog', name: 'Blog & SEO', icon: PenTool, price: 39, desc: 'AI blog posts with auto-SEO, sitemap and search indexing.' },
  { id: 'creatives', name: 'Creatives Studio', icon: Palette, price: 29, desc: 'AI posters, PNG exports and 10-second social videos.' },
];

export default function Billing() {
  const monthly = MODULES.reduce((s, m) => s + m.price, 0);
  const yearly = monthly * 10; // 2 months free on annual
  const renews = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '920px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><CreditCard size={22} /> Your subscription</h1>

      {/* Plan summary */}
      <div style={{ background: 'linear-gradient(135deg, #2b3531, #4E4E53)', borderRadius: '20px', padding: '24px', color: 'white', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)' }}>FIXIT · by Musée Initialize</div>
          <div style={{ fontSize: '1.6rem', fontFamily: "'Tenor Sans', serif", marginTop: '2px' }}>{CLIENT}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'rgba(111,192,138,0.2)', color: '#a9e6bd', border: '1px solid rgba(111,192,138,0.4)', borderRadius: '999px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700 }}>
            <Check size={13} /> {PLAN} plan · Active
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>${monthly}<span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.7 }}>/mo</span></div>
          <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.62)', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Calendar size={12} /> Renews {renews} · {CURRENCY}
          </div>
        </div>
      </div>

      {/* Included features */}
      <div style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)' }}>What's included ({MODULES.length} modules)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} style={{ background: 'white', border: '1.5px solid var(--color-accent)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--color-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', fontWeight: 800, color: '#2e7d32', background: '#e8f5e9', borderRadius: '999px', padding: '3px 9px' }}><Check size={12} /> Active</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{m.name}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-text)', lineHeight: 1.45, flex: 1 }}>{m.desc}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', fontWeight: 600 }}>${m.price}<span style={{ opacity: 0.6 }}>/mo</span></div>
            </div>
          );
        })}
      </div>

      {/* Billing summary + actions */}
      <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '18px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text)' }}>
          <div><strong style={{ color: 'var(--color-secondary)' }}>${monthly}/mo</strong> billed monthly · or <strong style={{ color: 'var(--color-secondary)' }}>${yearly}/yr</strong> (2 months free)</div>
          <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>Billed by FIXIT · Musée Initialize. Next charge {renews}.</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="mailto:hello@museeinitialize.com?subject=FIXIT%20subscription%20—%20YourFormSux" style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', background: 'var(--color-secondary)', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>Manage / contact billing</a>
        </div>
      </div>
    </div>
  );
}
