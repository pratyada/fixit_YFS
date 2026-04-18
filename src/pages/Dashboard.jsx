import { Link } from 'react-router-dom';
import { Dumbbell, TrendingUp, Camera, Heart, Calendar, Award, ArrowRight, Flame, Target, ChevronRight, Sparkles, Play, CheckCircle2, Stethoscope } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { useAuth } from '../contexts/AuthContext';
import { EXERCISE_LIBRARY, PAIN_SCALE } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';

const ALL_EXERCISES = [...FIXIT_EXERCISES, ...EXERCISE_LIBRARY];
function findExercise(id) { return ALL_EXERCISES.find(e => e.id === id); }

export default function Dashboard() {
  const [completedSessions] = usePatientData('completed_sessions', []);
  const [painEntries] = usePatientData('pain_entries', []);
  const [profile] = usePatientData('user_profile', null);
  const [assignedExercises] = usePatientData('assigned_exercises', []);
  const { session } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = completedSessions.filter(s => s.date === today);
  const thisWeek = completedSessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  // Streak calculation
  let streak = 0;
  const dates = [...new Set(completedSessions.map(s => s.date))].sort().reverse();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (dates[i] === expected.toISOString().split('T')[0]) {
      streak++;
    } else break;
  }

  const lastPain = painEntries[painEntries.length - 1];
  const totalExercises = new Set(completedSessions.map(s => s.exerciseId)).size;

  const quickActions = [
    { to: '/plan', icon: Calendar, label: "Today's Plan", desc: 'View your rehab program', color: '#708E86', bg: '#EDF3F1' },
    { to: '/exercises', icon: Dumbbell, label: 'Exercises', desc: 'Browse exercise library', color: '#8B7355', bg: '#F5F0EB' },
    { to: '/pose', icon: Camera, label: 'Record & Analyze', desc: 'Record form for AI feedback', color: '#6B7FA3', bg: '#EEF1F6' },
    { to: '/pain', icon: Heart, label: 'Log Pain', desc: 'Track how you feel', color: '#A36B6B', bg: '#F6EEEE' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Hero Section ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
          borderRadius: '20px',
          padding: '28px 24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20px', right: '60px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
            Welcome Back
          </div>
          <h1 style={{ color: 'white', fontSize: '1.7rem', marginBottom: '6px' }}>
            {profile?.name ? `Hey, ${profile.name}` : 'Your Recovery Journey'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', maxWidth: '420px', lineHeight: '1.5' }}>
            Every rep brings you closer to full recovery. Stay consistent and trust the process.
          </p>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginTop: '20px',
          }}>
            <StatCard icon={<Flame size={16} />} value={streak} label="Day Streak" />
            <StatCard icon={<Target size={16} />} value={todaySessions.length} label="Today" />
            <StatCard icon={<Dumbbell size={16} />} value={thisWeek.length} label="This Week" />
            <StatCard icon={<Award size={16} />} value={totalExercises} label="Tried" />
          </div>
        </div>
      </div>

      {/* ── Exercises Allocated By Practitioner ── */}
      {assignedExercises.length > 0 && (
        <AssignedExercisesSection
          assignedExercises={assignedExercises}
          completedToday={new Set(todaySessions.map(s => s.exerciseId))}
        />
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Quick Actions</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px',
        }}>
          {quickActions.map(({ to, icon: Icon, label, desc, color, bg }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                borderRadius: '14px',
                padding: '18px 16px',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="group"
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bg, color: color, marginBottom: '12px',
              }}>
                <Icon size={19} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '2px' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', lineHeight: '1.4' }}>
                {desc}
              </div>
              <ChevronRight
                size={14}
                style={{
                  position: 'absolute', bottom: '16px', right: '14px',
                  color: 'var(--color-border)', transition: 'color 0.25s',
                }}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Pain & Activity Row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
      }}>
        {/* Pain Status */}
        <div style={{
          background: 'white',
          borderRadius: '14px',
          border: '1px solid var(--color-border)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: '#F6EEEE', color: '#A36B6B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={14} />
            </div>
            <h4 style={{ margin: 0 }}>Pain Status</h4>
          </div>
          {lastPain ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: PAIN_SCALE[lastPain.level]?.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', flexShrink: 0,
              }}>
                {PAIN_SCALE[lastPain.level]?.emoji}
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-secondary)', lineHeight: 1 }}>
                  {lastPain.level}/10
                </div>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 500,
                  color: PAIN_SCALE[lastPain.level]?.color,
                  marginTop: '2px',
                }}>
                  {PAIN_SCALE[lastPain.level]?.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text)', marginTop: '4px' }}>
                  {new Date(lastPain.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '16px 0',
              color: 'var(--color-text)', fontSize: '0.85rem',
            }}>
              <Heart size={24} style={{ margin: '0 auto 8px', color: 'var(--color-border)' }} />
              <div>No pain logged yet</div>
              <Link to="/pain" style={{
                display: 'inline-block', marginTop: '8px',
                fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: 'var(--color-accent)',
              }}>
                Log your first entry
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '14px',
          border: '1px solid var(--color-border)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: '#EDF3F1', color: '#708E86',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={14} />
            </div>
            <h4 style={{ margin: 0 }}>Recent Activity</h4>
          </div>
          {completedSessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {completedSessions.slice(-4).reverse().map((s, i) => {
                const ex = findExercise(s.exerciseId);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: '10px',
                    background: 'var(--color-bg-alt)', fontSize: '0.8rem',
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-secondary)' }}>{ex?.name || s.exerciseId}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>{s.date}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '16px 0',
              color: 'var(--color-text)', fontSize: '0.85rem',
            }}>
              <Dumbbell size={24} style={{ margin: '0 auto 8px', color: 'var(--color-border)' }} />
              <div>No exercises completed yet</div>
              <Link to="/exercises" style={{
                display: 'inline-block', marginTop: '8px',
                fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: 'var(--color-accent)',
              }}>
                Start your first exercise
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Features Showcase ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        <FeatureCard
          to="/pose"
          icon={<Camera size={20} />}
          title="AI Pose Analysis"
          desc="Turn on your camera and get real-time form feedback while exercising"
          gradient="linear-gradient(135deg, #EDF3F1, #D8E8E3)"
          iconColor="#708E86"
        />
        <FeatureCard
          to="/progress"
          icon={<TrendingUp size={20} />}
          title="Track Progress"
          desc="See your recovery journey with charts, milestones, and trends"
          gradient="linear-gradient(135deg, #F5F0EB, #E8DFD4)"
          iconColor="#8B7355"
        />
        <FeatureCard
          to="/reports"
          icon={<Sparkles size={20} />}
          title="Upload MRI & Reports"
          desc="Store your medical documents securely on your device"
          gradient="linear-gradient(135deg, #EEF1F6, #DDE3ED)"
          iconColor="#6B7FA3"
        />
      </div>

      {/* ── Motivational ── */}
      <div style={{
        background: 'white',
        borderRadius: '14px',
        border: '1px solid var(--color-border)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'Tenor Sans', serif",
          color: 'var(--color-secondary)',
          fontSize: '1.05rem',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          "The body achieves what the mind believes."
        </p>
        <p style={{
          fontSize: '0.7rem', marginTop: '8px',
          color: 'var(--color-accent)', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '1.5px',
        }}>
          — Your Form Sux Team
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: 'rgba(255,255,255,0.6)' }}>
        {icon}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '1.5px', color: 'rgba(255,255,255,0.45)', marginTop: '2px',
      }}>
        {label}
      </div>
    </div>
  );
}

function AssignedExercisesSection({ assignedExercises, completedToday }) {
  const totalAssigned = assignedExercises.length;
  const doneCount = assignedExercises.filter(a => completedToday.has(a.exerciseId)).length;
  const allDone = doneCount === totalAssigned && totalAssigned > 0;
  const pct = totalAssigned ? Math.round((doneCount / totalAssigned) * 100) : 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      padding: '20px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '4px', flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: '#EDF3F1', color: '#708E86',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Stethoscope size={16} />
          </div>
          <div>
            <h3 style={{ marginBottom: '2px' }}>Assigned by Your Practitioner</h3>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
              {doneCount} of {totalAssigned} completed today
            </div>
          </div>
        </div>
        {allDone && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: '#E8F5E9', color: '#2E7D32',
            padding: '5px 12px', borderRadius: '50px',
            fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            <CheckCircle2 size={11} /> All Done
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        height: '6px', background: 'var(--color-bg-alt)',
        borderRadius: '3px', overflow: 'hidden', margin: '12px 0 14px',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #708E86, #B0C4BB)',
          borderRadius: '3px', transition: 'width 0.4s',
        }} />
      </div>

      {/* Exercise list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {assignedExercises.map(a => {
          const ex = findExercise(a.exerciseId);
          if (!ex) return null;
          const done = completedToday.has(a.exerciseId);
          return (
            <Link
              key={a.id}
              to={`/exercises/${a.exerciseId}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px',
                background: done ? '#F0F9F0' : 'var(--color-bg-alt)',
                border: `1px solid ${done ? '#C8E6C9' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              {done ? (
                <CheckCircle2 size={20} style={{ color: '#4CAF50', flexShrink: 0 }} />
              ) : (
                <Play size={20} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: done ? '#388E3C' : 'var(--color-secondary)',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                  {a.sets} × {a.reps}
                  {a.holdSeconds ? ` × ${a.holdSeconds}s hold` : ''} • {a.frequency}
                </div>
                {a.notes && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-accent)', fontStyle: 'italic', marginTop: '3px' }}>
                    💬 {a.notes}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                padding: '3px 8px', borderRadius: '50px',
                background: ex.difficulty === 'Beginner' ? '#E8F5E9' : ex.difficulty === 'Intermediate' ? '#FFF8E1' : '#FFEBEE',
                color: ex.difficulty === 'Beginner' ? '#2E7D32' : ex.difficulty === 'Intermediate' ? '#F57F17' : '#C62828',
                flexShrink: 0,
              }}>
                {ex.difficulty}
              </div>
              <ChevronRight size={16} color="var(--color-border)" style={{ flexShrink: 0 }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FeatureCard({ to, icon, title, desc, gradient, iconColor }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        background: gradient,
        borderRadius: '14px',
        padding: '20px',
        textDecoration: 'none',
        transition: 'all 0.25s ease',
        border: '1px solid transparent',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: 'white', color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '4px' }}>
        {title}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', lineHeight: 1.45 }}>
        {desc}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        marginTop: '10px', fontSize: '0.65rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '1px', color: iconColor,
      }}>
        Explore <ArrowRight size={11} />
      </div>
    </Link>
  );
}
