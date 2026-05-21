import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight, Search } from 'lucide-react';
import { GUIDES, GUIDE_CATEGORIES } from '../data/guides';

export default function Guides() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = GUIDES.filter(g => {
    if (categoryFilter !== 'All' && g.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return g.title.toLowerCase().includes(s) || g.subtitle.toLowerCase().includes(s)
        || g.tags.some(t => t.includes(s));
    }
    return true;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>Guides</h1>
        <p style={{ fontSize: '0.85rem' }}>Training guides, tips, and resources for your fitness journey</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)', opacity: 0.4 }} />
        <input
          type="text"
          placeholder="Search guides..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px',
            border: '1px solid var(--color-border)', fontSize: '0.85rem',
            background: 'white', maxWidth: '100%',
          }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {['All', ...GUIDE_CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
            padding: '8px 16px', borderRadius: '50px',
            background: categoryFilter === cat ? 'var(--color-accent)' : 'white',
            color: categoryFilter === cat ? 'white' : 'var(--color-text)',
            border: `1px solid ${categoryFilter === cat ? 'var(--color-accent)' : 'var(--color-border)'}`,
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Guide cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {filtered.map(guide => (
          <Link
            key={guide.id}
            to={`/guides/${guide.slug}`}
            style={{
              display: 'flex', flexDirection: 'column',
              background: 'white', borderRadius: '16px',
              border: '1px solid var(--color-border)',
              textDecoration: 'none', overflow: 'hidden',
              transition: 'all 0.2s',
            }}
          >
            {/* Hero bar */}
            <div style={{
              padding: '24px 20px 16px',
              background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '2rem' }}>{guide.heroEmoji}</span>
              <div>
                <div style={{
                  fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px',
                }}>
                  {guide.category}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                  {guide.title}
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 20px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{
                fontSize: '0.8rem', color: 'var(--color-text)', lineHeight: 1.5,
                flex: 1, marginBottom: '12px',
              }}>
                {guide.subtitle}
              </p>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.7rem', color: 'var(--color-text)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {guide.readTime}
                  </span>
                  <span>{new Date(guide.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text)' }}>
          <BookOpen size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>No guides found matching your search.</p>
        </div>
      )}
    </div>
  );
}
