import { useRef, useState } from 'react';
import { Palette, Sparkles, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { marketing } from '../lib/marketingApi';

// Formats rendered at TRUE export resolution (scaled down only for display).
const FORMATS = [
  { key: 'igpost', label: 'Instagram / FB post', w: 1080, h: 1080, variant: 'portrait', disp: 360 },
  { key: 'story', label: 'Story (IG / WhatsApp)', w: 1080, h: 1920, variant: 'portrait', disp: 250 },
  { key: 'linkedin', label: 'LinkedIn / FB banner', w: 1200, h: 630, variant: 'landscape', disp: 470 },
  { key: 'email', label: 'Email header', w: 1200, h: 400, variant: 'header', disp: 520 },
];

const CSS = `
.cr-art{position:relative;overflow:hidden;color:#eef4f1;font-family:"Tenor Sans","Optima","Gill Sans","Gill Sans MT",system-ui,sans-serif;
  background:radial-gradient(120% 85% at 50% -12%,#46564f 0,transparent 55%),linear-gradient(158deg,#2b3531 0%,#222a27 55%,#1a201e 100%)}
.cr-art *{box-sizing:border-box}
.cr-art .glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(80% 40% at 82% 108%,rgba(211,172,87,.14),transparent 60%)}
.cr-art .pitch{position:absolute;left:0;right:0;bottom:0;height:38%;opacity:.5;pointer-events:none;
  background:repeating-linear-gradient(90deg,transparent 0 100px,rgba(143,174,159,.06) 100px 200px),linear-gradient(180deg,transparent,rgba(112,142,134,.10));
  -webkit-mask:linear-gradient(180deg,transparent,#000);mask:linear-gradient(180deg,transparent,#000)}
.cr-art .ball{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 6%,#e9efec 18%,#9fb3ab 60%,#6d817a 100%);box-shadow:0 18px 50px rgba(0,0,0,.4),inset -14px -18px 34px rgba(0,0,0,.25)}
.cr-wm{display:flex;align-items:center;gap:.5em;letter-spacing:.5px;font-family:var(--b)}
.cr-wm .fx{font-family:"Tenor Sans","Optima","Gill Sans",system-ui,sans-serif;font-weight:700;letter-spacing:1px}
.cr-wm .by{color:rgba(238,244,241,.6)}
.cr-eyebrow{font-family:var(--b);text-transform:uppercase;font-weight:700;color:#B0C4BB;letter-spacing:.22em}
.cr-head{font-weight:700;line-height:.92;letter-spacing:.5px}
.cr-head .g{color:#d3ac57}
.cr-tag{font-family:var(--b);color:#dfe8e3;line-height:1.4}
.cr-when{display:inline-flex;align-items:center;gap:.7em;font-family:var(--b);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:999px;font-variant-numeric:tabular-nums}
.cr-when b{color:#fff;font-weight:700}
.cr-when .d{width:.28em;height:.28em;border-radius:50%;background:#d3ac57}
.cr-demo{font-family:var(--b);color:#B0C4BB;font-weight:600;line-height:1.45}
.cr-stat{display:flex;align-items:center;gap:.5em}
.cr-stat .n{font-weight:700;color:#d3ac57;line-height:.9;font-variant-numeric:tabular-nums}
.cr-stat .t{font-family:var(--b);color:rgba(238,244,241,.6);line-height:1.35}
.cr-cta{display:inline-flex;align-items:center;font-family:var(--b);font-weight:700;color:#1c2321;background:linear-gradient(135deg,#e6c987,#d3ac57);box-shadow:0 10px 26px rgba(211,172,87,.28)}
.cr-foot{font-family:var(--b);color:rgba(238,244,241,.55);border-top:1px solid rgba(255,255,255,.12)}
`;

function Poster({ c, fmt }) {
  const B = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  const has = (v) => v && String(v).trim();
  const wm = (s) => (
    <div className="cr-wm" style={{ fontSize: `${s}px` }}>
      <span className="fx">FIXIT</span><span className="by">by YourFormSux</span>
    </div>
  );
  const stat = (nSize, tW) => (
    <div className="cr-stat" style={{ '--b': B }}>
      <div className="n" style={{ fontSize: `${nSize}px` }}>{c.statNumber}</div>
      <div className="t" style={{ fontSize: `${nSize * 0.24}px`, maxWidth: tW }}>{c.statText}</div>
    </div>
  );
  const when = (s) => has(c.dateLine) && (
    <div className="cr-when" style={{ fontSize: `${s}px`, padding: `${s * 0.6}px ${s * 1.1}px` }}>
      <b>{c.dateLine}</b>{has(c.venue) && <><span className="d" />{c.venue}</>}
    </div>
  );
  const cta = (s) => (
    <div className="cr-cta" style={{ fontSize: `${s}px`, padding: `${s * 0.85}px ${s * 1.4}px`, borderRadius: `${s * 0.75}px` }}>{c.ctaText}</div>
  );

  if (fmt.variant === 'portrait') {
    const story = fmt.key === 'story';
    const k = story ? 0.9 : 1;
    return (
      <div className="cr-art" style={{ '--b': B, width: fmt.w, height: fmt.h, padding: story ? 90 : 76, display: 'flex', flexDirection: 'column' }}>
        <span className="glow" /><span className="pitch" />
        <span className="ball" style={{ width: 330 * k, height: 330 * k, right: -70, top: story ? 150 : -60 }} />
        {wm(38)}
        <div className="cr-eyebrow" style={{ fontSize: 25, marginTop: story ? 120 : 66 }}>{c.eyebrow}</div>
        <div className="cr-head" style={{ fontSize: story ? 150 : 138, marginTop: 22 }}>{c.headline}<span className="g" style={{ display: 'block' }}>{c.headlineAccent}</span></div>
        <div className="cr-tag" style={{ fontSize: 34, marginTop: 30, maxWidth: '20ch' }}>{c.tagline}</div>
        {when(30) && <div style={{ marginTop: 40 }}>{when(30)}</div>}
        {story && has(c.demoLine) && <div className="cr-demo" style={{ fontSize: 30, marginTop: 34 }}>{c.demoLine}</div>}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'flex-start' }}>
          {stat(story ? 104 : 116, '30ch')}
          {cta(34)}
        </div>
      </div>
    );
  }
  if (fmt.variant === 'landscape') {
    return (
      <div className="cr-art" style={{ '--b': B, width: fmt.w, height: fmt.h, padding: 72, display: 'flex', flexDirection: 'column' }}>
        <span className="glow" /><span className="pitch" />
        <span className="ball" style={{ width: 420, height: 420, right: -120, bottom: -140 }} />
        {wm(34)}
        <div className="cr-eyebrow" style={{ fontSize: 24, marginTop: 34 }}>{c.eyebrow}</div>
        <div className="cr-head" style={{ fontSize: 108, marginTop: 16 }}>{c.headline} <span className="g">{c.headlineAccent}</span></div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
          <div style={{ maxWidth: '30ch' }}>
            <div className="cr-tag" style={{ fontSize: 30 }}>{c.tagline}</div>
            {when(28) && <div style={{ marginTop: 26 }}>{when(28)}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22 }}>
            {stat(96, '18ch')}{cta(32)}
          </div>
        </div>
      </div>
    );
  }
  // header
  return (
    <div className="cr-art" style={{ '--b': B, width: fmt.w, height: fmt.h, padding: '54px 62px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span className="glow" /><span className="ball" style={{ width: 300, height: 300, right: -70, top: 60 }} />
      <div style={{ position: 'absolute', top: 40, left: 62 }}>{wm(30)}</div>
      <div className="cr-eyebrow" style={{ fontSize: 22, marginTop: 10 }}>{c.eyebrow}</div>
      <div className="cr-head" style={{ fontSize: 92, marginTop: 12 }}>{c.headline} <span className="g">{c.headlineAccent}</span></div>
      {when(26) && <div style={{ marginTop: 26, alignSelf: 'flex-start' }}>{when(26)}</div>}
    </div>
  );
}

const card = { background: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '18px' };
const btn = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' };

export default function Creatives() {
  const [brief, setBrief] = useState('');
  const [selected, setSelected] = useState(() => new Set(FORMATS.map((f) => f.key)));
  const [content, setContent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const refs = useRef({});

  const toggle = (k) => setSelected((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const generate = async () => {
    if (!brief.trim()) return;
    setBusy(true); setErr('');
    try { setContent(await marketing.generateCreative(brief.trim())); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const download = async (fmt) => {
    const node = refs.current[fmt.key];
    if (!node) return;
    try {
      const url = await toPng(node, { width: fmt.w, height: fmt.h, pixelRatio: 1, style: { transform: 'none' }, cacheBust: true });
      const a = document.createElement('a'); a.href = url; a.download = `fixit-${fmt.key}-${fmt.w}x${fmt.h}.png`; a.click();
    } catch (e) { setErr('Export failed: ' + e.message); }
  };

  const chosen = FORMATS.filter((f) => selected.has(f.key));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '980px' }}>
      <style>{CSS}</style>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Palette size={22} /> Creatives</h1>
      {err && <div style={{ ...card, borderColor: '#e0a0a0', color: '#c0392b', fontSize: '0.82rem' }}>{err}</div>}

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)' }}>What do you want to promote?</label>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. FIFA 2026 finale watch party — Sun 3PM, 11 Caperol Ct. Community launch of FIXIT with live pose-detection demos. RSVP in the app."
            style={{ width: '100%', minHeight: '90px', padding: '11px 13px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.85rem', boxSizing: 'border-box', marginTop: '4px' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '8px' }}>Formats to generate</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {FORMATS.map((f) => (
              <button key={f.key} onClick={() => toggle(f.key)} style={{
                padding: '8px 14px', borderRadius: '50px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                border: `1px solid ${selected.has(f.key) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: selected.has(f.key) ? 'var(--color-accent)' : 'white', color: selected.has(f.key) ? 'white' : 'var(--color-text)',
              }}>{selected.has(f.key) ? '✓ ' : ''}{f.label} · {f.w}×{f.h}</button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={busy || !selected.size} style={{ ...btn, background: 'var(--color-accent)', alignSelf: 'flex-start' }}>
          <Sparkles size={15} /> {busy ? 'Designing…' : 'Generate creatives'}
        </button>
      </div>

      {content && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {chosen.map((f) => {
            const s = f.disp / f.w;
            return (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: f.disp, height: f.h * s, overflow: 'hidden', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>
                  <div ref={(el) => (refs.current[f.key] = el)} style={{ transform: `scale(${s})`, transformOrigin: 'top left' }}>
                    <Poster c={content} fmt={f} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>{f.label} · {f.w}×{f.h}</span>
                  <button onClick={() => download(f)} style={{ ...btn, background: 'var(--color-secondary)', padding: '7px 12px', fontSize: '0.75rem' }}>
                    <Download size={13} /> PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
