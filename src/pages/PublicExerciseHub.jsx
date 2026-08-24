import { Link } from 'react-router-dom';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';
import { EXERCISE_VIDEOS } from '../data/exercise-videos';

// PUBLIC exercise library index — groups every exercise (with a demo video) by
// body region. Firebase-free; the internal links feed SEO to the detail pages.
const ALL = [...FIXIT_EXERCISES, ...EXERCISE_LIBRARY, ...GYM_EXERCISES];
const REGION_EMOJI = {
  Knee: '🦵', Shoulder: '💪', Back: '🔙', Hip: '🦴', Ankle: '🦶',
  Neck: '🧣', Wrist: '✋', Elbow: '💪', Core: '🎯', Foot: '👣',
  'Lower Body': '🦵', 'Upper Body': '💪',
};
const ORDER = ['Knee', 'Hip', 'Back', 'Neck', 'Shoulder', 'Core', 'Ankle', 'Foot', 'Wrist', 'Elbow', 'Lower Body', 'Upper Body'];

export default function PublicExerciseHub() {
  const withVideo = ALL.filter((e) => EXERCISE_VIDEOS[e.id]);
  const byRegion = {};
  withVideo.forEach((e) => { (byRegion[e.bodyPart] = byRegion[e.bodyPart] || []).push(e); });
  const regions = Object.keys(byRegion).sort((a, b) => {
    const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>Exercise Library</h1>
      <p style={{ color: '#47574f', fontSize: '1.02rem', margin: '0 0 26px', maxWidth: '62ch' }}>
        Free how-to demo videos and step-by-step form for {withVideo.length} exercises across knee, hip, back, neck, shoulder, core and more — rehab, physio and strength. Track them with AI form scoring in the FIXIT app.
      </p>

      {regions.map((region) => (
        <section key={region} style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{REGION_EMOJI[region] || '🏋️'}</span> {region}
            <span style={{ fontSize: '0.72rem', color: '#7b8b85', fontWeight: 400 }}>({byRegion[region].length})</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {byRegion[region].map((e) => (
              <Link key={e.id} to={`/exercise/${e.id}`} style={{ textDecoration: 'none', padding: '12px 14px', border: '1px solid #dbe4e2', borderRadius: '12px', color: '#12211f' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#7b8b85', marginTop: '2px' }}>{e.difficulty || 'Guided'} · ▶ Video</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
