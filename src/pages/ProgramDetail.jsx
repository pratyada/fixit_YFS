import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Target, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Plus, Play } from 'lucide-react';
import { PROTOCOLS, getProtocolById } from '../data/protocols';
import { getById as getExercise } from '../data/exercises';
import { useLocalState } from '../hooks/useLocalState';
import { usePatientData } from '../hooks/usePatientData';

export default function ProgramDetail() {
  const { t } = useTranslation('plan');
  const { id } = useParams();
  const [customPrograms] = useLocalState('custom_programs', []);
  const [assignedPrograms, setAssignedPrograms] = usePatientData('assigned_programs', []);
  const [completedSessions] = usePatientData('completed_sessions', []);
  const [expandedPhase, setExpandedPhase] = useState(0);

  const program = getProtocolById(id) || customPrograms.find(p => p.id === id);

  if (!program) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p>Program not found.</p>
        <Link to="/programs" style={{ color: 'var(--color-accent)' }}>Back to programs</Link>
      </div>
    );
  }

  const assignment = assignedPrograms.find(a => a.protocolId === id);
  const isAssigned = !!assignment;

  const assignProgram = () => {
    setAssignedPrograms(prev => [...prev, {
      id: Date.now().toString(36),
      protocolId: id,
      isCustom: !PROTOCOLS.find(p => p.id === id),
      assignedDate: new Date().toISOString(),
      startDate: new Date().toISOString().split('T')[0],
      currentPhase: 0,
      status: 'active',
    }]);
  };

  const unassign = () => {
    if (confirm('Remove this program from your assignments?')) {
      setAssignedPrograms(prev => prev.filter(a => a.protocolId !== id));
    }
  };

  // Compute current phase based on weeks since start
  const currentWeek = assignment?.startDate
    ? Math.floor((Date.now() - new Date(assignment.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0;

  const totalExercises = program.phases.reduce((sum, p) => sum + p.exercises.length, 0);
  const completedToday = new Set(
    completedSessions
      .filter(s => s.date === new Date().toISOString().split('T')[0])
      .map(s => s.exerciseId)
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/programs" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
        <ArrowLeft size={15} /> Back to Programs
      </Link>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86, #4E4E53)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
          }}>
            {program.icon || '📋'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
              {program.condition} • {program.bodyPart}
            </div>
            <h2 style={{ color: 'white', marginBottom: '6px' }}>{program.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {program.description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px', fontSize: '0.78rem' }}>
          <Stat icon={<Calendar size={13} />} label={program.totalWeeks ? `${program.totalWeeks} weeks` : 'Daily Routine'} />
          <Stat icon={<Target size={13} />} label={`${totalExercises} exercises`} />
          <Stat icon={<Play size={13} />} label={`${program.phases.length} phases`} />
          {program.frequency && <Stat icon="🔁" label={program.frequency} />}
        </div>

        <div style={{ marginTop: '18px' }}>
          {!isAssigned ? (
            <button onClick={assignProgram} style={{
              background: 'white', color: '#4E4E53',
              padding: '12px 24px', borderRadius: '50px', border: 'none',
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Plus size={14} /> Assign to Me
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                padding: '12px 20px', borderRadius: '50px',
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <CheckCircle2 size={14} /> Active — Week {currentWeek + 1}
              </div>
              <button onClick={unassign} style={{
                background: 'transparent', color: 'rgba(255,255,255,0.7)',
                padding: '12px 18px', borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                cursor: 'pointer',
              }}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Objective */}
      {program.objective && (
        <div style={{ background: 'var(--color-bg-alt)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-accent)', marginBottom: '4px' }}>
            Goal
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-secondary)' }}>{program.objective}</p>
        </div>
      )}

      {/* Phases */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>{t('rehabilitationPhases')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {program.phases.map((phase, i) => (
            <PhaseCard
              key={phase.id || i}
              phase={phase}
              index={i}
              expanded={expandedPhase === i}
              toggle={() => setExpandedPhase(expandedPhase === i ? -1 : i)}
              completedToday={completedToday}
              isCurrent={isAssigned && currentWeek <= weeksRangeEnd(phase.weeks)}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function weeksRangeEnd(weeksStr) {
  if (!weeksStr) return 999;
  const parts = weeksStr.split('-');
  return parseInt(parts[parts.length - 1]) || 999;
}

function Stat({ icon, label }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      background: 'rgba(255,255,255,0.12)', padding: '5px 12px',
      borderRadius: '50px', color: 'white', fontWeight: 500,
    }}>
      {icon} {label}
    </span>
  );
}

function PhaseCard({ phase, index, expanded, toggle, completedToday, t }) {
  return (
    <div style={{
      background: 'white', borderRadius: '14px',
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <button onClick={toggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', background: 'none', border: 'none',
        textAlign: 'left', cursor: 'pointer',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
          fontSize: '0.8rem', fontWeight: 700,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
            {phase.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
            Weeks {phase.weeks} • {phase.exercises.length} exercises
          </div>
        </div>
        {expanded ? <ChevronUp size={16} color="var(--color-text)" /> : <ChevronDown size={16} color="var(--color-text)" />}
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {phase.focus && (
            <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--color-text)' }}>
              Focus: {phase.focus}
            </div>
          )}

          {phase.goals?.length > 0 && (
            <div>
              <h6 style={{ marginBottom: '6px' }}>{t('goals')}</h6>
              {phase.goals.map((g, j) => (
                <div key={j} style={{ fontSize: '0.78rem', display: 'flex', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ color: '#4CAF50' }}>✓</span> {g}
                </div>
              ))}
            </div>
          )}

          <div>
            <h6 style={{ marginBottom: '8px' }}>{t('exercises', { count: phase.exercises.length })}</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {phase.exercises.map((ex, j) => {
                const exData = getExercise(ex.id);
                if (!exData) return null;
                const done = completedToday.has(ex.id);
                return (
                  <Link key={j} to={`/exercises/${ex.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px',
                    background: done ? '#F0F9F0' : 'var(--color-bg-alt)',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}>
                    {done ? (
                      <CheckCircle2 size={17} style={{ color: '#4CAF50', flexShrink: 0 }} />
                    ) : (
                      <Play size={17} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-secondary)' }}>
                        {exData.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                        {ex.sets} sets × {ex.reps} reps
                        {ex.holdSeconds && ` × ${ex.holdSeconds}s hold`}
                        {ex.frequency && ` • ${ex.frequency}`}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {phase.precautions?.length > 0 && (
            <div style={{ background: '#FFF8E1', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 700, color: '#F57F17', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                <AlertTriangle size={12} /> {t('precautions')}
              </div>
              {phase.precautions.map((p, j) => (
                <div key={j} style={{ fontSize: '0.78rem', color: '#E65100', marginBottom: '3px' }}>
                  ⚠️ {p}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
