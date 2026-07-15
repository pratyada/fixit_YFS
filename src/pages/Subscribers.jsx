import { useEffect, useState } from 'react';
import { Users, Search, Trash2, UploadCloud, Plus, RefreshCw } from 'lucide-react';
import { marketing } from '../lib/marketingApi';

// Minimal CSV → rows[{email,name,category,phone}]. Expects a header row that
// includes an 'email' column. Not a full RFC-4180 parser (no quoted commas).
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (names) => headers.findIndex((h) => names.includes(h));
  const iEmail = idx(['email', 'e-mail', 'email address']);
  const iName = idx(['name', 'full name', 'first name']);
  const iCat = idx(['category', 'tag', 'segment']);
  const iPhone = idx(['phone', 'phone no', 'mobile']);
  if (iEmail === -1) return [];
  return lines.slice(1).map((line) => {
    const c = line.split(',');
    return {
      email: (c[iEmail] || '').trim(),
      name: iName > -1 ? (c[iName] || '').trim() : '',
      category: iCat > -1 ? (c[iCat] || '').trim() : '',
      phone: iPhone > -1 ? (c[iPhone] || '').trim() : '',
    };
  }).filter((r) => r.email);
}

const card = { background: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px' };

export default function Subscribers() {
  const [data, setData] = useState({ subscribers: [], count: 0, activeCount: 0, categories: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [form, setForm] = useState({ email: '', name: '', category: '' });
  const [busy, setBusy] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try { setData(await marketing.listSubscribers()); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setBusy(true); setErr('');
    try { await marketing.addSubscriber(form); setForm({ email: '', name: '', category: '' }); await load(); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (email) => {
    if (!confirm(`Unsubscribe ${email}?`)) return;
    try { await marketing.removeSubscriber(email); await load(); }
    catch (e) { setErr(e.message); }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg('Importing…'); setBusy(true);
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) { setImportMsg('No valid rows found (need an "email" column).'); return; }
      const r = await marketing.importSubscribers(rows);
      setImportMsg(`Imported ${r.imported}, skipped ${r.skipped} (unsubscribed/invalid) of ${r.total}.`);
      await load();
    } catch (e) { setImportMsg(`Import failed: ${e.message}`); }
    finally { setBusy(false); e.target.value = ''; }
  };

  const rows = data.subscribers.filter((s) => {
    if (catFilter !== 'All' && s.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.email || '').toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={22} /> Subscribers</h1>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div style={card}><div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{data.count}</div><div style={{ fontSize: '0.75rem' }}>Total</div></div>
        <div style={card}><div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-accent)' }}>{data.activeCount}</div><div style={{ fontSize: '0.75rem' }}>Active</div></div>
        <div style={card}><div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{data.count - data.activeCount}</div><div style={{ fontSize: '0.75rem' }}>Unsubscribed</div></div>
        <div style={card}><div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{data.categories.length}</div><div style={{ fontSize: '0.75rem' }}>Categories</div></div>
      </div>

      {err && <div style={{ ...card, borderColor: '#e0a0a0', color: '#c0392b', fontSize: '0.82rem' }}>{err}</div>}

      {/* Add + Import */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        <form onSubmit={add} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Add subscriber</div>
          <input required type="email" placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder="name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} />
            <input placeholder="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inp} />
          </div>
          <button type="submit" disabled={busy} style={btn}><Plus size={14} /> Add</button>
        </form>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Import CSV</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text)' }}>Header row with an <code>email</code> column (optional: name, category, phone). Previously-unsubscribed emails are skipped.</p>
          <label style={{ ...btn, cursor: 'pointer', justifyContent: 'center' }}>
            <UploadCloud size={14} /> Choose CSV
            <input type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
          </label>
          {importMsg && <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{importMsg}</div>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input placeholder="Search email or name…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, paddingLeft: '34px' }} />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={inp}>
          <option>All</option>
          {data.categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text)' }}>Loading…</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={th}>Email</th><th style={th}>Name</th><th style={th}>Status</th><th style={th}>Source</th><th style={th}>Category</th><th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.email} style={{ borderBottom: '1px solid var(--color-bg-alt)' }}>
                  <td style={td}>{s.email}</td>
                  <td style={td}>{s.name || '—'}</td>
                  <td style={td}><span style={{ color: s.status === 'active' ? 'var(--color-accent)' : '#c0392b', fontWeight: 600 }}>{s.status}</span></td>
                  <td style={td}>{s.source || '—'}</td>
                  <td style={td}>{s.category || '—'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button onClick={() => remove(s.email)} title="Unsubscribe" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b' }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--color-text)', padding: '30px' }}>No subscribers{search || catFilter !== 'All' ? ' match your filter' : ' yet'}.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inp = { flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: '9px', border: '1px solid var(--color-border)', fontSize: '0.82rem', background: 'white' };
const btn = { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', border: 'none', background: 'var(--color-secondary)', color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' };
const th = { padding: '12px 14px', fontWeight: 600 };
const td = { padding: '11px 14px' };
