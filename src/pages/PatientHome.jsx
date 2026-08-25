import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Camera, CheckCircle2, ChevronRight, Sparkles, ClipboardList, PlayCircle } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { useAuth } from '../contexts/AuthContext';
import { getExercises } from '../lib/firestore';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';

const ALL_EXERCISES = [...FIXIT_EXERCISES, ...GYM_EXERCISES, ...EXERCISE_LIBRARY];
const ytThumb = (url) => {
  if (!url) return null;
  const m = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
};
const findExercise = (id) => ALL_EXERCISES.find((e) => e.id === id);

// Body-part → tile visual identity (emoji + gradient). Normalises the coarse
// 'Lower Body' / 'Upper Body' tags to a clean region name.
const REGION = {
  Knee:        { label: 'Knee',        emoji: '🦵', grad: ['#3f7d86', '#2b5b62'] },
  Hip:         { label: 'Hip',         emoji: '🦴', grad: ['#6a6ab0', '#474787'] },
  Shoulder:    { label: 'Shoulder',    emoji: '💪', grad: ['#c07d3a', '#8a5626'] },
  Back:        { label: 'Lower Back',  emoji: '🔙', grad: ['#4a8a6f', '#2f6350'] },
  Neck:        { label: 'Neck',        emoji: '🧣', grad: ['#a8556f', '#7a3d52'] },
  Ankle:       { label: 'Ankle',       emoji: '🦶', grad: ['#5a86b0', '#3d6187'] },
  Core:        { label: 'Core',        emoji: '🎯', grad: ['#b0685a', '#874a3d'] },
  Elbow:       { label: 'Elbow',       emoji: '💪', grad: ['#8a7a3a', '#635826'] },
  Wrist:       { label: 'Wrist',       emoji: '✋', grad: ['#5a9ab0', '#3d6d87'] },
  Foot:        { label: 'Foot',        emoji: '🦶', grad: ['#5a86b0', '#3d6187'] },
  'Lower Body':{ label: 'Lower Body',  emoji: '🦵', grad: ['#3f7d86', '#2b5b62'] },
  'Upper Body':{ label: 'Upper Body',  emoji: '💪', grad: ['#c07d3a', '#8a5626'] },
  Other:       { label: 'Other',       emoji: '🏋️', grad: ['#5a6b76', '#3d4952'] },
};
const regionFor = (bodyPart) => REGION[bodyPart] || REGION.Other;

export default function PatientHome() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [assigned, , assignedLoaded] = usePatientData('assigned_exercises', []);
  const [completed] = usePatientData('completed_sessions', []);
  const [thumbs, setThumbs] = useState({});
  useEffect(() => {
    getExercises().then(docs => {
      const map = {}; docs.forEach(d => { const t = ytThumb(d.demoVideoUrl); if (t) map[d.id] = t; });
      setThumbs(map);
    }).catch(() => {});
  }, []);

  // exercises the patient has logged today (by exerciseId)
  const doneToday = useMemo(() => {
    const today = new Date().toDateString();
    const set = new Set();
    (completed || []).forEach((c) => {
      const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt || c.date || 0);
      if (d.toDateString() === today) set.add(c.exerciseId);
    });
    return set;
  }, [completed]);

  // group assigned exercises by body-part region
  const groups = useMemo(() => {
    const byRegion = {};
    (assigned || []).forEach((a) => {
      const ex = findExercise(a.exerciseId);
      const key = ex?.bodyPart || 'Other';
      (byRegion[key] = byRegion[key] || []).push({ assignment: a, ex });
    });
    // stable order: known regions first, then alpha
    const order = Object.keys(REGION);
    return Object.entries(byRegion).sort((x, y) => {
      const ix = order.indexOf(x[0]); const iy = order.indexOf(y[0]);
      return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy);
    });
  }, [assigned]);

  const firstName = (session?.name || '').split(' ')[0] || 'there';
  const total = assigned?.length || 0;
  const done = (assigned || []).filter((a) => doneToday.has(a.exerciseId)).length;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ margin: '0 0 4px' }}>Hi {firstName} 👋</h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
          {!assignedLoaded ? 'Loading your plan…' : total === 0 ? 'No exercises assigned yet.' : `${done} of ${total} done today · keep it up!`}
        </div>
      </div>

      {/* Loading state — don't show "no exercises" until data has actually loaded */}
      {!assignedLoaded && total === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text)' }}>
          <div style={{ fontSize: '0.85rem' }}>Loading your exercises…</div>
        </div>
      )}

      {/* Empty state — only once we're sure there are none */}
      {assignedLoaded && total === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--color-bg-alt)', borderRadius: '18px', border: '1px solid var(--color-border)' }}>
          <ClipboardList size={40} style={{ color: 'var(--color-border)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '4px' }}>No exercises yet</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>Your practitioner will assign exercises here. You'll get an email when they do.</div>
        </div>
      )}

      {/* Grouped tiles by body region */}
      {groups.map(([regionKey, items]) => {
        const r = regionFor(regionKey);
        return (
          <section key={regionKey} style={{ marginBottom: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>{r.emoji}</span>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{r.label}</h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text)', background: 'var(--color-bg-alt)', padding: '2px 9px', borderRadius: '999px' }}>{items.length}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {items.map(({ assignment: a, ex }) => {
                const name = ex?.name || a.exerciseName || 'Exercise';
                const isDone = doneToday.has(a.exerciseId);
                return (
                  <div key={a.id} style={{
                    borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)',
                    background: 'var(--color-surface, #fff)', transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                  >
                    {/* tap image/name → exercise demo + guide */}
                    <div onClick={() => navigate(`/exercises/${a.exerciseId}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ height: '110px', background: `linear-gradient(135deg, ${r.grad[0]}, ${r.grad[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        {thumbs[a.exerciseId] ? (
                          <>
                            <img src={thumbs[a.exerciseId]} alt="" loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '12px solid white', marginLeft: '3px' }} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '2.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>{r.emoji}</span>
                        )}
                        {isDone && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#fff', borderRadius: '999px', display: 'flex' }}>
                            <CheckCircle2 size={20} color="#2E7D32" />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px 14px 8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-secondary)', lineHeight: 1.25 }}>{name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginTop: '3px' }}>
                          {a.sets && a.reps ? `${a.sets} × ${a.reps}` : ex?.duration || ''}{a.frequency ? ` · ${a.frequency}` : ''}
                        </div>
                      </div>
                    </div>
                    {/* two actions: View demo/guide, and Pose Check (AI score) */}
                    <div style={{ display: 'flex', gap: '6px', padding: '0 12px 12px', marginTop: 'auto' }}>
                      <button onClick={() => navigate(`/exercises/${a.exerciseId}`)} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        padding: '8px', borderRadius: '9px', border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)',
                        color: 'var(--color-secondary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                      }}><PlayCircle size={14} /> Demo</button>
                      <button onClick={() => navigate(`/pose?exercise=${a.exerciseId}`)} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        padding: '8px', borderRadius: '9px', border: 'none', background: 'var(--color-accent)',
                        color: 'white', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                      }}><Camera size={14} /> Pose Check</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
