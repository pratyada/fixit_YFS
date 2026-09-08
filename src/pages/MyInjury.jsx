import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, PlayCircle, Camera, ChevronRight, Sparkles, RotateCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAnatomyInjuries } from '../lib/firestore';
import { plainInjury } from '../data/injury-plain';
import { STRUCT_BY_ID } from '../data/knee-anatomy';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';

// Patient-facing "Know Your Injury" — personalized to the patient's OWN marked
// injuries, in plain language: what it is, what it means, and what to do (their
// exercises). Works cleanly on iPad. No clinical jargon, no 3D required.
const ALL_EX = [...FIXIT_EXERCISES, ...GYM_EXERCISES, ...EXERCISE_LIBRARY];
const findEx = (e) => {
  if (!e) return null;
  const id = typeof e === 'string' ? e : (e.id || e.exerciseId);
  const name = typeof e === 'string' ? e : (e.name || e.exerciseName);
  return ALL_EX.find((x) => x.id === id) || ALL_EX.find((x) => x.name === name) || (name ? { id, name } : null);
};

const TONES = {
  red: { bg: '#FFEBEE', fg: '#C62828', dot: '#E53935' },
  amber: { bg: '#FFF8E1', fg: '#F57F17', dot: '#FFA000' },
  green: { bg: '#E8F5E9', fg: '#2E7D32', dot: '#4CAF50' },
};

// three.js is heavy — only pulled in when this page renders (a real injury exists).
const InjuryModel3D = lazy(() => import('../components/InjuryModel3D'));

export default function MyInjury() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [injuries, setInjuries] = useState(null); // null = loading

  useEffect(() => {
    if (!user?.uid) return;
    let live = true;
    getAnatomyInjuries(user.uid)
      .then((rows) => { if (live) setInjuries(rows || []); })
      .catch(() => { if (live) setInjuries([]); });
    return () => { live = false; };
  }, [user]);

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HeartPulse size={24} /> Know Your Injury
        </h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
          Understand what your practitioner found — in plain language — and what to do about it.
        </div>
      </div>

      {injuries === null && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text)', fontSize: '0.9rem' }}>Loading your recovery plan…</div>
      )}

      {injuries !== null && injuries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--color-bg-alt)', borderRadius: '18px', border: '1px solid var(--color-border)' }}>
          <HeartPulse size={40} style={{ color: 'var(--color-border)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '4px' }}>Nothing marked yet</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>When your practitioner reviews you, your injury and recovery plan will appear here in plain language.</div>
        </div>
      )}

      {/* 3D overview — the same model the practitioner marks, lit up on the
          exact parts that are impacted, so the patient SEES it before exercises. */}
      {injuries !== null && injuries.some((i) => STRUCT_BY_ID[i.structureId]) && (
        <div style={{ marginBottom: '18px', background: 'var(--color-surface,#fff)', border: '1px solid var(--color-border)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCw size={16} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-secondary)' }}>What's impacted in your body</span>
          </div>
          <div style={{ padding: '0 14px 14px' }}>
            <Suspense fallback={<div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18, background: '#0c0f12', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>Loading your 3D model…</div>}>
              <InjuryModel3D injuries={injuries.filter((i) => STRUCT_BY_ID[i.structureId])} />
            </Suspense>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {(injuries || []).map((inj) => {
          const p = plainInjury(inj);
          const tone = TONES[p.status.tone] || TONES.amber;
          const exercises = (inj.exercises || []).map(findEx).filter(Boolean);
          return (
            <div key={inj.id} style={{ background: 'var(--color-surface,#fff)', border: '1px solid var(--color-border)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Header */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '18px 18px 0' }}>
                <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{p.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{p.title}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.72rem', fontWeight: 700, color: tone.fg, background: tone.bg, padding: '4px 11px', borderRadius: '999px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tone.dot }} /> {p.status.label}
                  </span>
                </div>
              </div>

              <div style={{ padding: '14px 18px 18px' }}>
                {/* What it is */}
                <Block label="What is it?">{p.what}</Block>
                {/* What it means */}
                <Block label="What this means for you">{p.meaning} {p.status.note}</Block>
                {/* Practitioner note */}
                {inj.note && <Block label="Your practitioner's note">“{inj.note}”</Block>}

                {/* What to do — exercises */}
                {exercises.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>Your exercises for this</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {exercises.map((ex, i) => (
                        <div key={ex.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg-alt)' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-secondary)' }}>{ex.name}</span>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button onClick={() => navigate(`/exercises/${ex.id}`)} title="How to do it" style={iconBtn}><PlayCircle size={16} /></button>
                            <button onClick={() => navigate(`/pose?exercise=${ex.id}`)} title="Check my form" style={{ ...iconBtn, background: 'var(--color-accent)', color: '#fff', border: 'none' }}><Camera size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {injuries !== null && injuries.length > 0 && (
        <div style={{ marginTop: '20px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(87,182,196,0.08)', border: '1px solid rgba(87,182,196,0.3)', fontSize: '0.82rem', color: 'var(--color-text)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Sparkles size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '1px' }} />
          <span>This is educational information from your practitioner — not a diagnosis. Follow their guidance, and stop any exercise that causes sharp pain.</span>
        </div>
      )}
    </div>
  );
}

function Block({ label, children }) {
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.92rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

const iconBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '9px', border: '1px solid var(--color-border)', background: 'var(--color-surface,#fff)', color: 'var(--color-secondary)', cursor: 'pointer' };
