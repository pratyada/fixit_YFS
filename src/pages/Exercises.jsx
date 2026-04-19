import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Clock, Repeat, ChevronRight, X, Stethoscope } from 'lucide-react';
import { EXERCISE_LIBRARY, BODY_PARTS, DIFFICULTY, EQUIPMENT, POSITIONS, GOALS, CONDITIONS } from '../data/exercises';
import { FIXIT_EXERCISES, PHASE_1_IDS, getAllExercisesWithStatus } from '../data/fixit-exercises';
import ExerciseThumbnail from '../components/ExerciseThumbnail';
import { useAuth } from '../contexts/AuthContext';
import { usePatientData } from '../hooks/usePatientData';
import { PROTOCOLS } from '../data/protocols';

const BODY_PART_ICONS = {
  Knee: '🦵', Shoulder: '💪', Back: '🔙', Hip: '🦴',
  Ankle: '🦶', Neck: '🫥', Wrist: '✋', Elbow: '💪', Core: '🎯', Foot: '👣',
};

const DIFF_COLORS = {
  Beginner: { bg: '#E8F5E9', text: '#2E7D32' },
  Intermediate: { bg: '#FFF8E1', text: '#F57F17' },
  Advanced: { bg: '#FFEBEE', text: '#C62828' },
};

export default function Exercises() {
  const { t } = useTranslation('exercises');
  const { isPatient, session } = useAuth();
  const isImpersonating = session?.role === 'practitioner' && !!session?.viewingPatientId;
  const isPatientView = isPatient || isImpersonating;

  const [assignedExercises] = usePatientData('assigned_exercises', []);
  const [assignedPrograms] = usePatientData('assigned_programs', []);

  // Compute the universe of exercises this patient is allowed to see.
  // Includes: directly assigned exercises + exercises inside their assigned programs.
  const allowedExerciseIds = useMemo(() => {
    if (!isPatientView) return null; // null = no filter (practitioner sees all)
    const ids = new Set(assignedExercises.map(a => a.exerciseId));
    assignedPrograms.forEach(ap => {
      const protocol = PROTOCOLS.find(p => p.id === ap.protocolId);
      if (protocol) {
        protocol.phases.forEach(ph => {
          ph.exercises.forEach(e => ids.add(e.id));
        });
      }
    });
    return ids;
  }, [isPatientView, assignedExercises, assignedPrograms]);

  // The pool: FIXIT Phase 1 exercises (active) + rest (coming soon)
  const pool = useMemo(() => {
    return getAllExercisesWithStatus(EXERCISE_LIBRARY);
  }, []);

  // Body parts and levels available based on what's allocated
  const availableBodyParts = useMemo(() => {
    const set = new Set(pool.map(e => e.bodyPart));
    return BODY_PARTS.filter(bp => set.has(bp));
  }, [pool]);

  const availableLevels = useMemo(() => {
    const set = new Set(pool.map(e => e.difficulty));
    return DIFFICULTY.filter(d => set.has(d));
  }, [pool]);

  const [search, setSearch] = useState('');
  const [bodyFilter, setBodyFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [goalFilter, setGoalFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [groupBy, setGroupBy] = useState('bodyPart');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filtered = useMemo(() => {
    return pool.filter(ex => {
      if (search) {
        const s = search.toLowerCase();
        const inName = ex.name.toLowerCase().includes(s);
        const inDesc = ex.description?.toLowerCase().includes(s);
        const inMuscles = ex.musclesTargeted?.some(m => m.toLowerCase().includes(s));
        if (!inName && !inDesc && !inMuscles) return false;
      }
      if (bodyFilter !== 'All' && ex.bodyPart !== bodyFilter) return false;
      if (diffFilter !== 'All' && ex.difficulty !== diffFilter) return false;
      if (equipmentFilter !== 'All' && ex.equipment !== equipmentFilter) return false;
      if (positionFilter !== 'All' && ex.position !== positionFilter) return false;
      if (goalFilter !== 'All' && !ex.goals?.includes(goalFilter)) return false;
      if (conditionFilter !== 'All' && !ex.conditions?.includes(conditionFilter)) return false;
      return true;
    });
  }, [pool, search, bodyFilter, diffFilter, equipmentFilter, positionFilter, goalFilter, conditionFilter]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(ex => {
      let key;
      if (groupBy === 'difficulty') key = ex.difficulty;
      else if (groupBy === 'goal') key = ex.goals?.[0] || 'Other';
      else key = ex.bodyPart;
      if (!g[key]) g[key] = [];
      g[key].push(ex);
    });
    return g;
  }, [filtered, groupBy]);

  const activeFilterCount = [bodyFilter, diffFilter, equipmentFilter, positionFilter, goalFilter, conditionFilter]
    .filter(f => f !== 'All').length;

  const clearFilters = () => {
    setBodyFilter('All'); setDiffFilter('All'); setEquipmentFilter('All');
    setPositionFilter('All'); setGoalFilter('All'); setConditionFilter('All');
    setSearch('');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>
          {isPatientView ? t('myExercises') : t('exerciseLibrary')}
        </h1>
        <p style={{ fontSize: '0.85rem' }}>
          {isPatientView
            ? t('exercisesAllocated', { count: pool.length })
            : t('physiotherapistApproved', { count: EXERCISE_LIBRARY.length })}
        </p>
      </div>

      {isPatientView && pool.length === 0 && (
        <div style={{
          background: '#FFF8E1', borderRadius: '14px', padding: '20px',
          border: '1px solid #FFE082', textAlign: 'center',
        }}>
          <Stethoscope size={32} style={{ color: '#F57F17', margin: '0 auto 8px', display: 'block' }} />
          <h4 style={{ marginBottom: '4px' }}>{t('noExercisesYet')}</h4>
          <p style={{ fontSize: '0.82rem' }}>
            {t('noExercisesDesc')}
          </p>
        </div>
      )}

      {isPatientView && pool.length > 0 && (
        <div style={{
          background: '#EDF3F1', borderRadius: '12px', padding: '12px 16px',
          border: '1px solid #D8E8E3',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Stethoscope size={16} color="#708E86" />
          <div style={{ fontSize: '0.78rem', color: '#4E4E53' }}>
            {t('showingAllocated')}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div style={{
        background: 'white', borderRadius: '14px',
        border: '1px solid var(--color-border)', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-border)',
          }} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Body part */}
        <FilterRow label={t('filters.body')} icon={<Filter size={12} />}>
          {['All', ...(isPatientView ? availableBodyParts : BODY_PARTS)].map(bp => (
            <Pill key={bp} active={bodyFilter === bp} onClick={() => setBodyFilter(bp)}>
              {bp !== 'All' && BODY_PART_ICONS[bp]} {bp}
            </Pill>
          ))}
        </FilterRow>

        {/* Difficulty */}
        <FilterRow label={t('filters.level')}>
          {['All', ...(isPatientView ? availableLevels : DIFFICULTY)].map(d => (
            <Pill key={d} active={diffFilter === d} onClick={() => setDiffFilter(d)}>{d}</Pill>
          ))}
        </FilterRow>

        {/* Toggle for advanced */}
        <button onClick={() => setShowAdvanced(!showAdvanced)} style={{
          alignSelf: 'flex-start', background: 'none', border: 'none',
          color: 'var(--color-accent)', fontSize: '0.7rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '1.2px', cursor: 'pointer',
          padding: '4px 0', display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {showAdvanced ? t('filters.hideFilters') : t('filters.moreFilters')}
          {activeFilterCount > 2 && (
            <span style={{
              background: 'var(--color-accent)', color: 'white',
              fontSize: '0.6rem', padding: '1px 6px', borderRadius: '50px',
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {showAdvanced && (
          <>
            <FilterRow label={t('filters.goal')}>
              {['All', ...GOALS].map(g => (
                <Pill key={g} active={goalFilter === g} onClick={() => setGoalFilter(g)}>{g}</Pill>
              ))}
            </FilterRow>
            <FilterRow label={t('filters.equipment')}>
              {['All', ...EQUIPMENT].map(e => (
                <Pill key={e} active={equipmentFilter === e} onClick={() => setEquipmentFilter(e)}>{e}</Pill>
              ))}
            </FilterRow>
            <FilterRow label={t('filters.position')}>
              {['All', ...POSITIONS].map(p => (
                <Pill key={p} active={positionFilter === p} onClick={() => setPositionFilter(p)}>{p}</Pill>
              ))}
            </FilterRow>
            <div>
              <Label>{t('filters.condition')}</Label>
              <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
                <option value="All">{t('filters.allConditions')}</option>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Group by + clear */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{t('filters.groupBy')}</span>
            {[
              { k: 'bodyPart', l: t('filters.bodyPart') },
              { k: 'difficulty', l: t('filters.level') },
              { k: 'goal', l: t('filters.goal') },
            ].map(opt => (
              <button key={opt.k} onClick={() => setGroupBy(opt.k)} style={{
                fontSize: '0.65rem', padding: '4px 10px', borderRadius: '50px',
                border: 'none', cursor: 'pointer', fontWeight: 600,
                background: groupBy === opt.k ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                color: groupBy === opt.k ? 'white' : 'var(--color-text)',
              }}>{opt.l}</button>
            ))}
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text)', fontSize: '0.7rem', fontWeight: 600,
            }}>
              <X size={12} /> {t('filters.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text)' }}>
        {t('showing')} <strong style={{ color: 'var(--color-secondary)' }}>{filtered.length}</strong> {t('ofExercises', { total: pool.length })}
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', fontSize: '0.85rem', color: 'var(--color-text)' }}>
          {t('noMatchingFilters')}
        </div>
      ) : (
        Object.entries(grouped).map(([groupKey, exercises]) => (
          <div key={groupKey}>
            <h6 style={{ marginBottom: '10px' }}>
              {groupBy === 'bodyPart' && BODY_PART_ICONS[groupKey]} {groupKey} ({exercises.length})
            </h6>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '12px',
            }}>
              {exercises.map(ex => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ExerciseCard({ exercise: ex }) {
  const { t } = useTranslation('exercises');
  const isComingSoon = ex.comingSoon;

  const card = (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        background: isComingSoon ? '#F5F5F5' : 'white',
        borderRadius: '14px',
        border: `1px solid ${isComingSoon ? '#E0E0E0' : 'var(--color-border)'}`,
        padding: '16px',
        textDecoration: 'none',
        transition: 'all 0.25s ease',
        opacity: isComingSoon ? 0.55 : 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: isComingSoon ? 'default' : 'pointer',
      }}
    >
      {isComingSoon && (
        <div style={{
          position: 'absolute', top: '10px', right: '-24px',
          background: '#9E9E9E', color: 'white',
          padding: '3px 32px', fontSize: '0.52rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '1.5px',
          transform: 'rotate(35deg)',
        }}>
          {t('comingSoon')}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{
          width: '56px', height: '48px', borderRadius: '10px',
          background: isComingSoon ? '#EEEEEE' : 'linear-gradient(135deg, #FAFCFB, #EFF6F4)',
          overflow: 'hidden', flexShrink: 0,
          filter: isComingSoon ? 'grayscale(1)' : 'none',
        }}>
          <ExerciseThumbnail exerciseId={ex.id} />
        </div>
        <span style={{
          fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.8px', padding: '3px 8px', borderRadius: '50px',
          background: isComingSoon ? '#E0E0E0' : (DIFF_COLORS[ex.difficulty]?.bg || '#E8F5E9'),
          color: isComingSoon ? '#9E9E9E' : (DIFF_COLORS[ex.difficulty]?.text || '#2E7D32'),
        }}>
          {ex.difficulty}
        </span>
      </div>
      <h4 style={{ marginBottom: '4px', color: isComingSoon ? '#9E9E9E' : undefined }}>{ex.name}</h4>
      <p style={{
        fontSize: '0.75rem', color: isComingSoon ? '#BDBDBD' : 'var(--color-text)', lineHeight: 1.45,
        marginBottom: '10px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {ex.description}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
        {ex.goals?.slice(0, 2).map(g => (
          <span key={g} style={{
            fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.5px', padding: '2px 7px', borderRadius: '50px',
            background: isComingSoon ? '#E0E0E0' : 'var(--color-bg-alt)',
            color: isComingSoon ? '#9E9E9E' : 'var(--color-accent)',
          }}>{g}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', color: isComingSoon ? '#BDBDBD' : 'var(--color-text)', marginTop: 'auto' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {ex.duration}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Repeat size={12} /> {ex.sets}x{ex.reps}
        </span>
        {!isComingSoon && <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--color-border)' }} />}
      </div>
    </div>
  );

  if (isComingSoon) return card;
  return <Link to={`/exercises/${ex.id}`} style={{ textDecoration: 'none' }}>{card}</Link>;
}

function FilterRow({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px', minWidth: '60px' }}>
        {icon} {label}:
      </span>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      fontSize: '0.7rem', padding: '5px 12px', borderRadius: '50px',
      border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
      background: active ? 'var(--color-accent)' : 'white',
      color: active ? 'white' : 'var(--color-text)',
      fontFamily: "'Public Sans'", fontWeight: 500, cursor: 'pointer',
      whiteSpace: 'nowrap', transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)', marginBottom: '5px' }}>
      {children}
    </div>
  );
}
