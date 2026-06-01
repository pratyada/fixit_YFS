import { useState } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Clock, Check, PlayCircle } from 'lucide-react';
import { getPlanById, getTodayWorkout } from '../../data/workout-plans';

export default function TodayWorkout({ planId, onChangePlan }) {
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState(new Set());

  const plan = getPlanById(planId);
  const todayWorkout = getTodayWorkout(plan);

  if (!plan) {
    return (
      <button onClick={onChangePlan} style={{
        width: '100%', padding: '20px', borderRadius: '14px',
        background: 'white', border: '2px dashed var(--color-border)',
        cursor: 'pointer', textAlign: 'center',
      }}>
        <Dumbbell size={24} style={{ color: 'var(--color-accent)', margin: '0 auto 8px' }} />
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
          Choose a Workout Plan
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', marginTop: '4px' }}>
          Pick from Hyrox, Marathon, Calisthenics, Full Body, and more
        </div>
      </button>
    );
  }

  if (!todayWorkout) {
    return (
      <div style={{
        background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)',
        padding: '18px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>😴</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Rest Day</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', marginTop: '4px' }}>
          {plan.name} — Recovery is part of the plan. Stretch, foam roll, or go for a walk.
        </div>
      </div>
    );
  }

  const toggleExercise = (i) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const donePct = Math.round((completed.size / todayWorkout.exercises.length) * 100);

  return (
    <div style={{
      background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px', width: '100%',
        background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%)',
        border: 'none', cursor: 'pointer', textAlign: 'left', color: 'white',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '1.4rem' }}>{plan.icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)' }}>
            Today's Workout
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>
            {todayWorkout.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
            {todayWorkout.focus} &bull; {todayWorkout.exercises.length} exercises
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{donePct}%</div>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Done</div>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--color-bg-alt)' }}>
        <div style={{
          height: '100%', width: `${donePct}%`,
          background: donePct >= 100 ? '#4CAF50' : 'var(--color-accent)',
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Exercises */}
      {expanded && (
        <div style={{ padding: '12px 16px 16px' }}>
          {todayWorkout.warmup && (
            <div style={{
              padding: '8px 12px', borderRadius: '8px', background: '#FFF8E1',
              fontSize: '0.72rem', color: '#F57F17', marginBottom: '10px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <PlayCircle size={12} /> Warm-up: {todayWorkout.warmup}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {todayWorkout.exercises.map((ex, i) => {
              const done = completed.has(i);
              return (
                <button key={i} onClick={() => toggleExercise(i)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: done ? '#F0F9F0' : 'var(--color-bg-alt)',
                  border: `1px solid ${done ? '#C8E6C9' : 'transparent'}`,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}>
                  {done ? (
                    <Check size={18} style={{ color: '#4CAF50', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: '2px solid var(--color-border)', flexShrink: 0,
                    }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 600,
                      color: done ? '#388E3C' : 'var(--color-secondary)',
                      textDecoration: done ? 'line-through' : 'none',
                    }}>
                      {ex.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text)', marginTop: '1px' }}>
                      {ex.sets}×{ex.reps} &bull; Rest: {ex.rest}
                      {ex.notes ? ` &bull; ${ex.notes}` : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={onChangePlan} style={{
            marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px',
            background: 'none', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
          }}>
            Change Plan
          </button>
        </div>
      )}
    </div>
  );
}
