import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, Calendar, Target, Dumbbell } from 'lucide-react';
import { WORKOUT_PLANS } from '../../data/workout-plans';
import { useAuth } from '../../contexts/AuthContext';
import { setUserProfile } from '../../lib/firestore';

export default function WorkoutPlanSelector({ currentPlanId, onSelect }) {
  const { user, refreshProfile } = useAuth();
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (planId) => {
    setSaving(true);
    try {
      if (user?.uid) {
        await setUserProfile(user.uid, { workoutPlanId: planId });
        await refreshProfile();
      }
      onSelect?.(planId);
    } catch (e) {
      console.error('Failed to save plan:', e);
    }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '4px' }}>
        Choose Your Workout Plan
      </div>

      {WORKOUT_PLANS.map(plan => {
        const isCurrent = plan.id === currentPlanId;
        const isExpanded = expandedPlan === plan.id;

        return (
          <div key={plan.id} style={{
            borderRadius: '14px',
            border: isCurrent ? '2px solid #4CAF50' : '1px solid var(--color-border)',
            background: isCurrent ? '#F0F9F0' : 'white',
            overflow: 'hidden',
          }}>
            {/* Plan header */}
            <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', width: '100%',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{plan.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.9rem', fontWeight: 700,
                  color: isCurrent ? '#2E7D32' : 'var(--color-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {plan.name}
                  {isCurrent && <Check size={14} color="#4CAF50" />}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginTop: '2px' }}>
                  {plan.description}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.65rem', color: 'var(--color-text)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Calendar size={10} /> {plan.daysPerWeek} days/week
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} /> {plan.duration}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Target size={10} /> {plan.level}
                  </span>
                </div>
              </div>
              {isExpanded ? <ChevronUp size={16} color="var(--color-text)" /> : <ChevronDown size={16} color="var(--color-text)" />}
            </button>

            {/* Expanded: show schedule */}
            {isExpanded && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  {plan.schedule.map(day => (
                    <DayPreview key={day.day} day={day} />
                  ))}
                </div>

                {!isCurrent && (
                  <button onClick={() => handleSelect(plan.id)} disabled={saving} style={{
                    width: '100%', padding: '11px', borderRadius: '10px',
                    background: 'var(--color-accent)', border: 'none',
                    color: 'white', fontSize: '0.82rem', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}>
                    <Dumbbell size={14} /> {saving ? 'Saving...' : `Start ${plan.name}`}
                  </button>
                )}
                {isCurrent && (
                  <div style={{
                    width: '100%', padding: '11px', borderRadius: '10px',
                    background: '#E8F5E9', border: '1px solid #C8E6C9',
                    color: '#2E7D32', fontSize: '0.82rem', fontWeight: 700,
                    textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}>
                    <Check size={14} /> Active Plan
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayPreview({ day }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderRadius: '10px', background: 'var(--color-bg-alt)',
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', width: '100%',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'var(--color-accent)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
        }}>
          D{day.day}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{day.name}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text)' }}>{day.focus}</div>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text)' }}>{day.exercises.length} exercises</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div style={{ padding: '0 12px 10px' }}>
          {day.warmup && (
            <div style={{ fontSize: '0.68rem', color: 'var(--color-accent)', marginBottom: '6px', fontStyle: 'italic' }}>
              Warm-up: {day.warmup}
            </div>
          )}
          {day.exercises.map((ex, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 0', borderBottom: i < day.exercises.length - 1 ? '1px solid var(--color-border)' : 'none',
              fontSize: '0.72rem',
            }}>
              <span style={{ color: 'var(--color-secondary)', fontWeight: 500 }}>{ex.name}</span>
              <span style={{ color: 'var(--color-text)', fontSize: '0.65rem', flexShrink: 0, marginLeft: '8px' }}>
                {ex.sets}×{ex.reps}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
