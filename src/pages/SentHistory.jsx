import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, RefreshCw, ChevronDown, ChevronRight, Repeat } from 'lucide-react';
import { marketing } from '../lib/marketingApi';

const card = { background: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px' };
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export default function SentHistory() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  const navigate = useNavigate();

  // Load a past campaign's content back into the Email composer to send to others.
  const reuse = (c) => {
    if (!c.bodyHtml) { setErr('This campaign was sent before content-saving — open the Email tab to recompose it.'); return; }
    localStorage.setItem('fixit_email_draft', JSON.stringify({
      subject: c.subject, preheader: c.preheader || '', bodyHtml: c.bodyHtml, heroImageUrl: c.heroImageUrl || '',
    }));
    navigate('/email');
  };

  const load = async () => {
    setLoading(true); setErr('');
    try { setEmails((await marketing.emailHistory()).emails || []); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const totalSent = emails.reduce((a, e) => a + (e.sentCount || 0), 0);
  const totalOpens = emails.reduce((a, e) => a + (e.openCount || 0), 0);
  const totalClicks = emails.reduce((a, e) => a + (e.clickCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Send size={22} /> Sent History</h1>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <div style={card}><div style={stat}>{emails.length}</div><div style={sub}>Campaigns</div></div>
        <div style={card}><div style={stat}>{totalSent}</div><div style={sub}>Emails sent</div></div>
        <div style={card}><div style={stat}>{totalOpens}</div><div style={sub}>Opens ({pct(totalOpens, totalSent)}%)</div></div>
        <div style={card}><div style={stat}>{totalClicks}</div><div style={sub}>Clicks ({pct(totalClicks, totalSent)}%)</div></div>
      </div>

      {err && <div style={{ ...card, borderColor: '#e0a0a0', color: '#c0392b', fontSize: '0.82rem' }}>{err}</div>}
      {loading ? <div style={{ ...card, textAlign: 'center' }}>Loading…</div> : !emails.length ? (
        <div style={{ ...card, textAlign: 'center', color: 'var(--color-text)' }}>No campaigns sent yet.</div>
      ) : emails.map((e) => {
        const isOpen = open === e.emailId;
        return (
          <div key={e.emailId} style={card}>
            <div onClick={() => setOpen(isOpen ? null : e.emailId)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-secondary)', fontSize: '0.9rem' }}>{e.subject}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
                  {new Date(e.sentAt).toLocaleString('en-CA')} · {e.type}{e.category ? ` (${e.category})` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', textAlign: 'center' }}>
                <div><div style={{ fontWeight: 700 }}>{e.sentCount}</div><div style={sub}>sent</div></div>
                <div><div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{pct(e.openCount, e.sentCount)}%</div><div style={sub}>open</div></div>
                <div><div style={{ fontWeight: 700 }}>{e.clickCount || 0}</div><div style={sub}>clicks</div></div>
              </div>
            </div>
            {isOpen && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-bg-alt)', fontSize: '0.78rem' }}>
                <div style={{ marginBottom: '6px' }}><b>Opened by:</b> {(e.opens || []).map((o) => o.email).join(', ') || '—'}</div>
                <div><b>Clicked:</b> {(e.clicks || []).map((c) => `${c.email} → ${c.url}`).join('; ') || '—'}</div>
                {e.failedCount > 0 && <div style={{ color: '#c0392b', marginTop: '6px' }}>{e.failedCount} failed to send</div>}
                <button onClick={() => reuse(e)} style={{
                  marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: '9px',
                  padding: '9px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                }}>
                  <Repeat size={14} /> Send this to others
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const stat = { fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-secondary)' };
const sub = { fontSize: '0.72rem', color: 'var(--color-text)' };
