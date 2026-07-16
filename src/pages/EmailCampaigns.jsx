import { useEffect, useState } from 'react';
import { Mail, Sparkles, Send, Eye, ImagePlus } from 'lucide-react';
import { marketing } from '../lib/marketingApi';

// Resize/compress in the browser before upload (keeps emails light, no server lib).
function resizeImage(file, maxW = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.82).split(',')[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const card = { background: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '18px' };
const inp = { width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: 'white', boxSizing: 'border-box' };
const btn = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' };
const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '4px' };

// Persist the draft so leaving/refreshing the page doesn't lose it.
const DRAFT_KEY = 'fixit_email_draft';
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch { return {}; } };

export default function EmailCampaigns() {
  const [meta, setMeta] = useState({ activeCount: 0, categories: [] });
  const [topic, setTopic] = useState(() => loadDraft().topic || '');
  const [subject, setSubject] = useState(() => loadDraft().subject || '');
  const [preheader, setPreheader] = useState(() => loadDraft().preheader || '');
  const [bodyHtml, setBodyHtml] = useState(() => loadDraft().bodyHtml || '');
  const [heroImageUrl, setHeroImageUrl] = useState(() => loadDraft().heroImageUrl || '');
  const [audience, setAudience] = useState('all');
  const [category, setCategory] = useState('');
  const [single, setSingle] = useState('');
  const [gen, setGen] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const uploadFile = async (file) => {
    const base64 = await resizeImage(file);
    const { url } = await marketing.uploadImage(base64, 'jpg', 'image/jpeg');
    return url;
  };
  const onHeroFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true); setErr('');
    try { setHeroImageUrl(await uploadFile(f)); setPreviewHtml(''); }
    catch (er) { setErr('Upload failed: ' + er.message); }
    finally { setUploading(false); e.target.value = ''; }
  };
  const onInlineFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true); setErr('');
    try {
      const url = await uploadFile(f);
      setBodyHtml((b) => `${b}\n<img src="${url}" alt="" style="display:block;max-width:100%;border-radius:12px;margin:18px 0">\n`);
      setPreviewHtml('');
    } catch (er) { setErr('Upload failed: ' + er.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  useEffect(() => { marketing.listSubscribers().then(setMeta).catch(() => {}); }, []);

  // Auto-save the draft (debounced) whenever any field changes.
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ topic, subject, preheader, bodyHtml, heroImageUrl }));
    }, 300);
    return () => clearTimeout(t);
  }, [topic, subject, preheader, bodyHtml, heroImageUrl]);

  const clearDraft = () => {
    if (!confirm('Clear this draft and start fresh?')) return;
    localStorage.removeItem(DRAFT_KEY);
    setTopic(''); setSubject(''); setPreheader(''); setBodyHtml(''); setHeroImageUrl(''); setPreviewHtml(''); setMsg('');
  };

  // Any edit invalidates the current preview.
  const edited = (setter) => (v) => { setter(v); setPreviewHtml(''); };

  const generate = async () => {
    if (!topic.trim()) return;
    setGen(true); setErr(''); setPreviewHtml('');
    try {
      const r = await marketing.generateEmail(topic.trim());
      setSubject(r.subject || ''); setPreheader(r.preheader || ''); setBodyHtml(r.bodyHtml || '');
    } catch (e) { setErr(e.message); }
    finally { setGen(false); }
  };

  const preview = async () => {
    if (!bodyHtml.trim()) { setErr('Nothing to preview yet'); return; }
    setPreviewing(true); setErr('');
    try {
      const r = await marketing.previewEmail({ subject, preheader, bodyHtml, heroImageUrl });
      setPreviewHtml(r.html);
    } catch (e) { setErr(e.message); }
    finally { setPreviewing(false); }
  };

  const send = async () => {
    if (!subject.trim() || !bodyHtml.trim()) { setErr('Subject and body are required'); return; }
    const audDesc = audience === 'all' ? `all ${meta.activeCount} active subscribers`
      : audience === 'category' ? `category "${category}"` : single;
    if (!confirm(`Send "${subject}" to ${audDesc}?`)) return;
    setSending(true); setErr(''); setMsg('');
    try {
      const r = await marketing.sendEmail({
        type: audience, subject, preheader, bodyHtml, heroImageUrl,
        category: audience === 'category' ? category : undefined,
        to: audience === 'single' ? single : undefined,
      });
      setMsg(`Sent to ${r.sent}${r.failed ? `, ${r.failed} failed` : ''}. Campaign ${r.emailId.slice(0, 8)}.`);
    } catch (e) { setErr(e.message); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '920px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Mail size={22} /> Email Campaigns</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>Draft auto-saves on this device</span>
          <button onClick={clearDraft} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--color-text)' }}>Clear draft</button>
        </div>
      </div>
      {err && <div style={{ ...card, borderColor: '#e0a0a0', color: '#c0392b', fontSize: '0.82rem' }}>{err}</div>}
      {msg && <div style={{ ...card, borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600 }}>{msg}</div>}

      {/* AI compose */}
      <div style={{ ...card, display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
          <label style={lbl}>AI draft — topic</label>
          <input style={inp} placeholder="e.g. why protein timing matters for recovery" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <button onClick={generate} disabled={gen} style={{ ...btn, background: 'var(--color-accent)' }}>
          <Sparkles size={15} /> {gen ? 'Writing…' : 'Generate'}
        </button>
      </div>

      {/* Editable fields */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div><label style={lbl}>Subject</label><input style={inp} value={subject} onChange={(e) => edited(setSubject)(e.target.value)} /></div>
        <div><label style={lbl}>Preheader (inbox preview)</label><input style={inp} value={preheader} onChange={(e) => edited(setPreheader)(e.target.value)} /></div>
        <div>
          <label style={lbl}>Hero image (top banner, optional)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={inp} placeholder="paste an image URL, or upload →" value={heroImageUrl} onChange={(e) => edited(setHeroImageUrl)(e.target.value)} />
            <label style={{ ...btn, background: 'var(--color-accent)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <ImagePlus size={15} /> Upload
              <input type="file" accept="image/*" onChange={onHeroFile} style={{ display: 'none' }} />
            </label>
          </div>
          {heroImageUrl && <img src={heroImageUrl} alt="" style={{ maxHeight: '90px', borderRadius: '8px', marginTop: '8px' }} />}
        </div>
        <div>
          <label style={lbl}>Body HTML <span style={{ fontWeight: 400, color: 'var(--color-text)' }}>— edit freely; {'{{firstName}}'} personalizes</span></label>
          <textarea style={{ ...inp, minHeight: '220px', fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem' }} value={bodyHtml} onChange={(e) => edited(setBodyHtml)(e.target.value)} />
          <label style={{ ...btn, background: 'var(--color-accent)', cursor: 'pointer', marginTop: '8px' }}>
            <ImagePlus size={15} /> {uploading ? 'Uploading…' : 'Insert image into body'}
            <input type="file" accept="image/*" onChange={onInlineFile} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
        <div>
          <button onClick={preview} disabled={previewing} style={{ ...btn, background: 'var(--color-secondary)' }}>
            <Eye size={15} /> {previewing ? 'Building…' : 'Preview full email'}
          </button>
        </div>
      </div>

      {/* Full branded preview */}
      {previewHtml && (
        <div style={card}>
          <div style={{ ...lbl, marginBottom: '10px' }}>Preview — exactly what recipients receive</div>
          <iframe title="email preview" srcDoc={previewHtml} style={{ width: '100%', height: '640px', border: '1px solid var(--color-border)', borderRadius: '10px', background: '#eef2f1' }} />
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
        {audience === 'single' && <input style={inp} type="email" placeholder="recipient@email.com" value={single} onChange={(e) => setSingle(e.target.value)} />}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={send} disabled={sending} style={{ ...btn, background: 'var(--color-secondary)' }}>
            <Send size={15} /> {sending ? 'Sending…' : 'Send campaign'}
          </button>
          {!previewHtml && <span style={{ fontSize: '0.75rem', color: 'var(--color-text)' }}>Tip: preview before sending.</span>}
        </div>
      </div>
    </div>
  );
}
