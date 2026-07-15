import { useEffect, useState } from 'react';
import { Mail, Sparkles, Send } from 'lucide-react';
import { marketing } from '../lib/marketingApi';

const card = { background: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '18px' };
const inp = { width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: 'white', boxSizing: 'border-box' };
const btn = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' };

export default function EmailCampaigns() {
  const [meta, setMeta] = useState({ activeCount: 0, categories: [] });
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [audience, setAudience] = useState('all');
  const [category, setCategory] = useState('');
  const [single, setSingle] = useState('');
  const [gen, setGen] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { marketing.listSubscribers().then((d) => setMeta(d)).catch(() => {}); }, []);

  const generate = async () => {
    if (!topic.trim()) return;
    setGen(true); setErr('');
    try {
      const r = await marketing.generateEmail(topic.trim());
      setSubject(r.subject || ''); setPreheader(r.preheader || ''); setBodyHtml(r.bodyHtml || '');
    } catch (e) { setErr(e.message); }
    finally { setGen(false); }
  };

  const send = async () => {
    if (!subject.trim() || !bodyHtml.trim()) { setErr('Subject and body are required'); return; }
    const audDesc = audience === 'all' ? `all ${meta.activeCount} active subscribers`
      : audience === 'category' ? `category "${category}"` : single;
    if (!confirm(`Send "${subject}" to ${audDesc}?`)) return;
    setSending(true); setErr(''); setMsg('');
    try {
      const r = await marketing.sendEmail({
        type: audience, subject, preheader, bodyHtml,
        category: audience === 'category' ? category : undefined,
        to: audience === 'single' ? single : undefined,
      });
      setMsg(`Sent to ${r.sent}${r.failed ? `, ${r.failed} failed` : ''}. Campaign ${r.emailId.slice(0, 8)}.`);
    } catch (e) { setErr(e.message); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={22} /> Email Campaigns</h1>
      {err && <div style={{ ...card, borderColor: '#e0a0a0', color: '#c0392b', fontSize: '0.82rem' }}>{err}</div>}
      {msg && <div style={{ ...card, borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600 }}>{msg}</div>}

      {/* AI compose */}
      <div style={{ ...card, display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)' }}>AI draft — topic</label>
          <input style={inp} placeholder="e.g. why tracking protein changes results" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <button onClick={generate} disabled={gen} style={{ ...btn, background: 'var(--color-accent)' }}>
          <Sparkles size={15} /> {gen ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {/* Editable email */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={lbl}>Subject</label>
          <input style={inp} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Preheader (inbox preview)</label>
          <input style={inp} value={preheader} onChange={(e) => setPreheader(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Body HTML <span style={{ fontWeight: 400, color: 'var(--color-text)' }}>— use {'{{firstName}}'} for personalization</span></label>
          <textarea style={{ ...inp, minHeight: '200px', fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }} value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} />
        </div>
      </div>

      {/* Preview */}
      {bodyHtml && (
        <div style={card}>
          <div style={lbl}>Preview (body)</div>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '18px', background: '#fff', fontSize: '0.9rem', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
      )}

      {/* Audience + send */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={lbl}>Audience</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'category', 'single'].map((a) => (
            <button key={a} onClick={() => setAudience(a)} style={{
              padding: '8px 14px', borderRadius: '50px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              border: `1px solid ${audience === a ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: audience === a ? 'var(--color-accent)' : 'white', color: audience === a ? 'white' : 'var(--color-text)',
            }}>{a === 'all' ? `All active (${meta.activeCount})` : a === 'category' ? 'By category' : 'Single email'}</button>
          ))}
        </div>
        {audience === 'category' && (
          <select style={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category…</option>
            {meta.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        {audience === 'single' && (
          <input style={inp} type="email" placeholder="recipient@email.com" value={single} onChange={(e) => setSingle(e.target.value)} />
        )}
        <div>
          <button onClick={send} disabled={sending} style={{ ...btn, background: 'var(--color-secondary)' }}>
            <Send size={15} /> {sending ? 'Sending…' : 'Send campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '4px' };
