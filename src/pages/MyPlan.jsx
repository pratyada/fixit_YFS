import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, ChevronDown, ChevronUp, AlertTriangle, Play, Lock } from 'lucide-react';
import { ACL_REHAB_PROGRAM, EXERCISE_LIBRARY } from '../data/exercises';
import { usePatientData } from '../hooks/usePatientData';

export default function MyPlan() {
  const [completedSessions] = usePatientData('completed_sessions', []);
  const [profile, setProfile] = usePatientData('user_profile', null);
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [showSetup, setShowSetup] = useState(!profile);

  const [name, setName] = useState(profile?.name || '');
  const [injury, setInjury] = useState(profile?.injury || 'ACL Reconstruction');
  const [surgeryDate, setSurgeryDate] = useState(profile?.surgeryDate || '');
  const [side, setSide] = useState(profile?.side || 'Left');

  const saveProfile = () => {
    setProfile({ name, injury, surgeryDate, side });
    setShowSetup(false);
  };

  const currentWeek = profile?.surgeryDate
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.surgeryDate).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 0;

  const getCurrentPhaseIndex = () => {
    if (currentWeek <= 2) return 0;
    if (currentWeek <= 6) return 1;
    if (currentWeek <= 12) return 2;
    return 3;
  };

  const today = new Date().toISOString().split('T')[0];
  const todayCompleted = new Set(completedSessions.filter(s => s.date === today).map(s => s.exerciseId));

  if (showSetup) {
    return (
      <div className="fade-in" style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: '6px' }}>Set Up Your Rehab Plan</h1>
          <p style={{ fontSize: '0.85rem' }}>Tell us about your injury so we can personalize your program</p>
        </div>

        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid var(--color-border)', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <FormField label="Your Name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
          </FormField>
          <FormField label="Injury / Condition">
            <select value={injury} onChange={e => setInjury(e.target.value)}>
              <option>ACL Reconstruction</option>
              <option>ACL Tear (Non-surgical)</option>
              <option>Meniscus Repair</option>
              <option>Patella Tendinopathy</option>
              <option>Rotator Cuff Repair</option>
              <option>Frozen Shoulder</option>
              <option>Lower Back Pain</option>
              <option>Ankle Sprain</option>
              <option>Hip Replacement</option>
              <option>General Conditioning</option>
            </select>
          </FormField>
          <FormField label="Surgery / Injury Date">
            <input type="date" value={surgeryDate} onChange={e => setSurgeryDate(e.target.value)} />
          </FormField>
          <FormField label="Affected Side">
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Left', 'Right', 'Both'].map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                    border: `1.5px solid ${side === s ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: side === s ? 'var(--color-accent)' : 'white',
                    color: side === s ? 'white' : 'var(--color-text)',
                    fontFamily: "'Public Sans'", transition: 'all 0.2s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormField>

          <button
            onClick={saveProfile}
            disabled={!name.trim()}
            style={{
              width: '100%', padding: '13px', borderRadius: '10px',
              background: name.trim() ? 'var(--color-secondary)' : '#ccc',
              color: 'white', fontWeight: 600, fontSize: '0.72rem',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              border: 'none', cursor: name.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            Create My Plan
          </button>
        </div>
      </div>
    );
  }

  const program = ACL_REHAB_PROGRAM;
  const currentPhaseIdx = getCurrentPhaseIndex();
  const progress = program.totalWeeks ? Math.min(Math.round((currentWeek / program.totalWeeks) * 100), 100) : 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #B0C4BB 0%, #708E86 100%)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
              {profile.injury} — {profile.side} Side
            </div>
            <h2 style={{ color: 'white', marginBottom: '4px' }}>{profile.name}'s Rehab Plan</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>
              {profile.surgeryDate ? (
                <>{program.totalWeeks ? `Week ${currentWeek} of ${program.totalWeeks}` : 'Daily routine'} — {program.phases[currentPhaseIdx].name}</>
              ) : 'Custom rehabilitation program'}
            </p>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              fontSize: '0.68rem', background: 'rgba(255,255,255,0.2)', color: 'white',
              padding: '6px 14px', borderRadius: '50px', border: 'none',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>

        {profile.surgeryDate && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'white', borderRadius: '3px', transition: 'width 0.5s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Today's Exercises */}
      <div style={{
        background: 'white', borderRadius: '16px',
        border: '1px solid var(--color-border)', padding: '20px',
      }}>
        <h3 style={{ marginBottom: '4px' }}>Today's Exercises</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '14px' }}>
          {todayCompleted.size} of {program.phases[currentPhaseIdx].exercises.length} completed today
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {program.phases[currentPhaseIdx].exercises.map(exId => {
            const ex = EXERCISE_LIBRARY.find(e => e.id === exId);
            if (!ex) return null;
            const done = todayCompleted.has(exId);
            return (
              <Link
                key={exId}
                to={`/exercises/${exId}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: done ? '#F0F9F0' : 'var(--color-bg-alt)',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                {done ? (
                  <CheckCircle2 size={18} style={{ color: '#4CAF50', flexShrink: 0 }} />
                ) : (
                  <Play size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.85rem', fontWeight: 500,
                    color: done ? '#388E3C' : 'var(--color-secondary)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {ex.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                    {ex.sets}x{ex.reps} — {ex.duration}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.8px', padding: '3px 8px', borderRadius: '50px',
                  background: ex.difficulty === 'Beginner' ? '#E8F5E9' : '#FFF8E1',
                  color: ex.difficulty === 'Beginner' ? '#2E7D32' : '#F57F17',
                }}>
                  {ex.difficulty}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Phase Timeline */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Rehabilitation Phases</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {program.phases.map((phase, i) => {
            const isCurrent = i === currentPhaseIdx;
            const isPast = i < currentPhaseIdx;
            const isExpanded = expandedPhase === i;

            return (
              <div key={i} style={{
                background: 'white', borderRadius: '14px',
                border: `1.5px solid ${isCurrent ? 'var(--color-accent)' : 'var(--color-border)'}`,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedPhase(isExpanded ? -1 : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', background: 'none', border: 'none',
                    textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isPast ? '#E8F5E9' : isCurrent ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                    color: isPast ? '#4CAF50' : isCurrent ? 'white' : 'var(--color-text)',
                  }}>
                    {isPast ? <CheckCircle2 size={15} /> : isCurrent ? <Calendar size={15} /> : <Lock size={13} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-secondary)' }}>{phase.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>Weeks {phase.weeks}</div>
                  </div>
                  {isCurrent && (
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '1px', padding: '3px 10px', borderRadius: '50px',
                      background: 'var(--color-accent)', color: 'white',
                    }}>
                      Current
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={15} color="var(--color-text)" /> : <ChevronDown size={15} color="var(--color-text)" />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <h6 style={{ marginBottom: '6px' }}>Goals</h6>
                      {phase.goals.map((g, j) => (
                        <div key={j} style={{ fontSize: '0.82rem', display: 'flex', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--color-success)' }}>•</span> {g}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h6 style={{ marginBottom: '6px' }}>Exercises ({phase.exercises.length})</h6>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {phase.exercises.map(exId => {
                          const ex = EXERCISE_LIBRARY.find(e => e.id === exId);
                          return ex ? (
                            <Link key={exId} to={`/exercises/${exId}`} style={{
                              fontSize: '0.72rem', background: 'var(--color-bg-alt)',
                              color: 'var(--color-accent)', padding: '4px 12px',
                              borderRadius: '50px', textDecoration: 'none',
                              fontWeight: 500, transition: 'all 0.2s',
                            }}>
                              {ex.name}
                            </Link>
                          ) : null;
                        })}
                      </div>
                    </div>
                    {phase.precautions.length > 0 && (
                      <div style={{ background: '#FFF8E1', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 600, color: '#F57F17', marginBottom: '6px' }}>
                          <AlertTriangle size={13} /> Precautions
                        </div>
                        {phase.precautions.map((p, j) => (
                          <div key={j} style={{ fontSize: '0.75rem', color: '#E65100', marginBottom: '3px' }}>⚠️ {p}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: '6px',
        fontSize: '0.68rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '1.5px',
        color: 'var(--color-secondary)',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
