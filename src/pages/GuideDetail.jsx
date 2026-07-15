import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Tag, Share2 } from 'lucide-react';
import { getGuideBySlug, GUIDES } from '../data/guides';
import SubscribeForm from '../components/SubscribeForm';

export default function GuideDetail() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Support both Route params and direct path extraction
  const slug = params.slug || location.pathname.replace('/guides/', '');
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Guide not found</h2>
        <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
          <Link to="/guides" style={{ color: 'var(--color-accent)' }}>Back to all guides</Link>
        </p>
      </div>
    );
  }

  // Related guides (same category, exclude current)
  const related = GUIDES.filter(g => g.category === guide.category && g.id !== guide.id).slice(0, 3);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: guide.title, text: guide.subtitle, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '720px' }}>
      {/* Back button */}
      <button onClick={() => navigate('/guides')} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'none', border: 'none', color: 'var(--color-accent)',
        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
        padding: '0 0 16px',
      }}>
        <ArrowLeft size={16} /> All Guides
      </button>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '20px', padding: '32px 28px', marginBottom: '24px',
        color: 'white',
      }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px',
        }}>
          {guide.category}
        </div>
        <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>{guide.heroEmoji}</div>
        <h1 style={{ color: 'white', fontSize: '1.6rem', lineHeight: 1.25, marginBottom: '10px' }}>
          {guide.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '16px' }}>
          {guide.subtitle}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {guide.readTime} read
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} /> {new Date(guide.date).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: '50px',
            fontSize: '0.72rem', cursor: 'pointer',
          }}>
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>

      {/* Article content */}
      <article style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {guide.sections.map((section, i) => (
          <section key={i}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>
              {section.heading}
            </h2>
            <div style={{
              fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.75,
              whiteSpace: 'pre-line',
            }}>
              {section.content.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </div>
          </section>
        ))}
      </article>

      {/* Tags */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px',
        marginTop: '32px', paddingTop: '20px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <Tag size={14} style={{ color: 'var(--color-text)', opacity: 0.4, marginTop: '4px' }} />
        {guide.tags.map(tag => (
          <span key={tag} style={{
            padding: '4px 10px', borderRadius: '50px',
            background: 'var(--color-bg-alt)', color: 'var(--color-text)',
            fontSize: '0.7rem', fontWeight: 500,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '16px', padding: '28px', textAlign: 'center',
        marginTop: '32px', color: 'white',
      }}>
        <h3 style={{ color: 'white', fontSize: '1.15rem', marginBottom: '8px' }}>
          Ready to start training?
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
          Track your workouts, analyze your form with AI, and crush your goals.
        </p>
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 28px', borderRadius: '12px',
          background: 'white', color: 'var(--color-secondary)',
          textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700,
        }}>
          Get Started Free
        </Link>
      </div>

      {/* Newsletter signup */}
      <div style={{ marginTop: '32px' }}>
        <SubscribeForm />
      </div>

      {/* Related guides */}
      {related.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '14px' }}>Related Guides</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {related.map(r => (
              <Link key={r.id} to={`/guides/${r.slug}`} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '12px',
                background: 'white', border: '1px solid var(--color-border)',
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{r.heroEmoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{r.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginTop: '2px' }}>
                    {r.readTime} &bull; {r.category}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
