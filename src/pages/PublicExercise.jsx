import { useParams, useLocation, Link } from 'react-router-dom';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';
import { EXERCISE_VIDEOS } from '../data/exercise-videos';

// PUBLIC, Firebase-free exercise page — the SEO acquisition funnel. Renders the
// demo video + how-to + target muscles for search engines and logged-out
// visitors, with a CTA into the app (signup → patient → subscription).
const ALL = [...FIXIT_EXERCISES, ...EXERCISE_LIBRARY, ...GYM_EXERCISES];

const REGION_EMOJI = {
  Knee: '🦵', Shoulder: '💪', Back: '🔙', Hip: '🦴', Ankle: '🦶',
  Neck: '🧣', Wrist: '✋', Elbow: '💪', Core: '🎯', Foot: '👣',
  'Lower Body': '🦵', 'Upper Body': '💪',
};

function relatedFor(ex) {
  return ALL.filter((e) => e.id !== ex.id && e.bodyPart === ex.bodyPart && EXERCISE_VIDEOS[e.id]).slice(0, 6);
}

export default function PublicExercise() {
  const params = useParams();
  const location = useLocation();
  const slug = params.slug || location.pathname.replace('/exercise/', '');
  const ex = ALL.find((e) => e.id === slug);

  if (!ex) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p>Exercise not found.</p>
        <Link to="/exercise" style={{ color: 'var(--color-accent, #1c7c86)' }}>Browse the exercise library →</Link>
      </div>
    );
  }

  const video = EXERCISE_VIDEOS[ex.id];
  const emoji = REGION_EMOJI[ex.bodyPart] || '🏋️';
  const related = relatedFor(ex);

  return (
    <article style={{ maxWidth: '760px', margin: '0 auto' }}>
      <nav style={{ fontSize: '0.8rem', color: '#7b8b85', marginBottom: '14px' }}>
        <Link to="/exercise" style={{ color: '#1c7c86', textDecoration: 'none' }}>Exercise Library</Link>
        {ex.bodyPart && <> · {ex.bodyPart}</>}
      </nav>

      <h1 style={{ fontSize: '1.9rem', lineHeight: 1.15, margin: '0 0 6px' }}>
        {emoji} {ex.name}
      </h1>
      <p style={{ color: '#47574f', fontSize: '1.02rem', margin: '0 0 6px' }}>{ex.description}</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.72rem', margin: '10px 0 22px' }}>
        {ex.bodyPart && <span style={tag}>{ex.bodyPart}</span>}
        {ex.difficulty && <span style={tag}>{ex.difficulty}</span>}
        {ex.equipment && <span style={tag}>{ex.equipment}</span>}
        {ex.sets && ex.reps && <span style={tag}>{ex.sets} × {ex.reps}</span>}
      </div>

      {/* Demo video */}
      {video && (
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '14px', overflow: 'hidden', background: '#000', marginBottom: '24px' }}>
          <iframe
            src={video} title={`${ex.name} demonstration video`}
            allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      )}

      {/* How to */}
      {ex.instructions?.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={h2}>How to do the {ex.name}</h2>
          <ol style={{ paddingLeft: '20px', lineHeight: 1.7, color: '#47574f' }}>
            {ex.instructions.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)}
          </ol>
        </section>
      )}

      {ex.tips?.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={h2}>Form tips</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: 1.7, color: '#47574f' }}>
            {ex.tips.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
          </ul>
        </section>
      )}

      {ex.musclesTargeted?.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={h2}>Muscles worked</h2>
          <p style={{ color: '#47574f' }}>{ex.musclesTargeted.join(', ')}</p>
        </section>
      )}

      {ex.contraindications?.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={h2}>When to be cautious</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: 1.7, color: '#47574f' }}>
            {ex.contraindications.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
          </ul>
        </section>
      )}

      {/* CTA into the app */}
      <div style={{ background: 'linear-gradient(135deg, #708E86, #4E4E53)', borderRadius: '16px', padding: '24px', color: 'white', textAlign: 'center', margin: '10px 0 30px' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Track this exercise with AI form scoring</div>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 16px', maxWidth: '46ch', marginInline: 'auto' }}>
          Get FIXIT free — follow guided demos, record your reps, and get instant AI feedback on your form.
        </p>
        <Link to="/" style={{ display: 'inline-block', background: 'white', color: '#4E4E53', textDecoration: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: 700 }}>
          Start free →
        </Link>
      </div>

      {/* Related — internal links help SEO */}
      {related.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={h2}>Related {ex.bodyPart} exercises</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            {related.map((r) => (
              <Link key={r.id} to={`/exercise/${r.id}`} style={{ textDecoration: 'none', padding: '10px 12px', border: '1px solid #dbe4e2', borderRadius: '10px', color: '#12211f', fontSize: '0.85rem', fontWeight: 600 }}>
                {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

const tag = { background: '#eef5f2', color: '#1c7c86', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 };
const h2 = { fontSize: '1.15rem', margin: '0 0 10px', color: '#12211f' };
