import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Save, Search, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { EXERCISE_LIBRARY, BODY_PARTS } from '../data/exercises';
import { useLocalState } from '../hooks/useLocalState';
import { generateId } from '../utils/storage';

export default function ProgramBuilder() {
  const { t } = useTranslation('plan');
  const navigate = useNavigate();
  const [customPrograms, setCustomPrograms] = useLocalState('custom_programs', []);

  const [name, setName] = useState('');
  const [bodyPart, setBodyPart] = useState('Knee');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📋');
  const [phases, setPhases] = useState([
    { id: 'p1', name: 'Phase 1', weeks: '1-2', focus: '', goals: [], exercises: [], precautions: [] },
  ]);
  const [showPicker, setShowPicker] = useState(null); // phase index
  const [pickerSearch, setPickerSearch] = useState('');
  const [expandedPhase, setExpandedPhase] = useState(0);

  const addPhase = () => {
    const n = phases.length + 1;
    setPhases([...phases, { id: `p${n}`, name: `Phase ${n}`, weeks: '', focus: '', goals: [], exercises: [], precautions: [] }]);
    setExpandedPhase(phases.length);
  };

  const removePhase = (i) => {
    setPhases(phases.filter((_, idx) => idx !== i));
  };

  const updatePhase = (i, key, value) => {
    setPhases(phases.map((p, idx) => idx === i ? { ...p, [key]: value } : p));
  };

  const addExerciseToPhase = (phaseIdx, exerciseId) => {
    const ex = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    if (!ex) return;
    const newEx = { id: exerciseId, sets: ex.sets || 3, reps: ex.reps || 10, holdSeconds: ex.holdSeconds, frequency: 'Daily' };
    updatePhase(phaseIdx, 'exercises', [...phases[phaseIdx].exercises, newEx]);
    setShowPicker(null);
    setPickerSearch('');
  };

  const removeExercise = (phaseIdx, exIdx) => {
    const newExs = phases[phaseIdx].exercises.filter((_, i) => i !== exIdx);
    updatePhase(phaseIdx, 'exercises', newExs);
  };

  const updateExercise = (phaseIdx, exIdx, key, value) => {
    const newExs = phases[phaseIdx].exercises.map((e, i) => i === exIdx ? { ...e, [key]: value } : e);
    updatePhase(phaseIdx, 'exercises', newExs);
  };

  const totalExercises = phases.reduce((sum, p) => sum + p.exercises.length, 0);

  const saveProgram = () => {
    if (!name.trim()) {
      alert('Please enter a program name');
      return;
    }
    if (totalExercises === 0) {
      alert('Add at least one exercise');
      return;
    }
    const program = {
      id: 'custom-' + generateId(),
      name: name.trim(),
      bodyPart,
      condition: condition || 'General',
      description: description || 'Custom program',
      icon,
      totalWeeks: phases.reduce((max, p) => {
        const end = parseInt((p.weeks || '0').split('-').pop()) || 0;
        return Math.max(max, end);
      }, 0),
      phases: phases.filter(p => p.exercises.length > 0),
      tags: ['Custom'],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    setCustomPrograms([...customPrograms, program]);
    navigate(`/programs/${program.id}`);
  };

  const filteredExercises = EXERCISE_LIBRARY.filter(e => {
    if (!pickerSearch) return true;
    return e.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
           e.bodyPart.toLowerCase().includes(pickerSearch.toLowerCase());
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>Program Builder</h1>
        <p style={{ fontSize: '0.85rem' }}>Create a custom rehabilitation program with exercises, phases, and goals</p>
      </div>

      {/* Basic info */}
      <div style={{
        background: 'white', borderRadius: '16px',
        border: '1px solid var(--color-border)', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <h4>Program Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '12px', alignItems: 'flex-start' }}>
          <div>
            <Label>Icon</Label>
            <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="📋" style={{ textAlign: 'center', fontSize: '1.4rem', padding: '8px' }} />
          </div>
          <div>
            <Label>Program Name *</Label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Post-Op Knee Rehab" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <Label>Body Region</Label>
            <select value={bodyPart} onChange={e => setBodyPart(e.target.value)}>
              {BODY_PARTS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <Label>Condition</Label>
            <input value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g., ACL Reconstruction" />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description..." />
        </div>
      </div>

      {/* Phases */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3>Phases ({phases.length})</h3>
          <button onClick={addPhase} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
            padding: '7px 14px', borderRadius: '50px', border: '1px solid var(--color-border)',
            fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
            cursor: 'pointer',
          }}>
            <Plus size={12} /> Add Phase
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {phases.map((phase, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '14px',
              border: '1px solid var(--color-border)', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                background: expandedPhase === i ? 'var(--color-bg-alt)' : 'white',
                cursor: 'pointer',
              }} onClick={() => setExpandedPhase(expandedPhase === i ? -1 : i)}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--color-accent)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{phase.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                    {phase.exercises.length} exercises
                    {phase.weeks && ` • Weeks ${phase.weeks}`}
                  </div>
                </div>
                {phases.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removePhase(i); }} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: '6px', color: 'var(--color-text)',
                  }}>
                    <Trash2 size={14} />
                  </button>
                )}
                {expandedPhase === i ? <ChevronUp size={16} color="var(--color-text)" /> : <ChevronDown size={16} color="var(--color-text)" />}
              </div>

              {expandedPhase === i && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <Label>Phase Name</Label>
                      <input value={phase.name} onChange={e => updatePhase(i, 'name', e.target.value)} />
                    </div>
                    <div>
                      <Label>Weeks (e.g., 1-2)</Label>
                      <input value={phase.weeks} onChange={e => updatePhase(i, 'weeks', e.target.value)} placeholder="1-2" />
                    </div>
                  </div>
                  <div>
                    <Label>Focus</Label>
                    <input value={phase.focus} onChange={e => updatePhase(i, 'focus', e.target.value)} placeholder="e.g., Reduce swelling, restore ROM" />
                  </div>

                  {/* Exercises in this phase */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h6>Exercises ({phase.exercises.length})</h6>
                      <button onClick={() => setShowPicker(i)} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'var(--color-accent)', color: 'white',
                        padding: '6px 12px', borderRadius: '50px', border: 'none',
                        fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                        cursor: 'pointer',
                      }}>
                        <Plus size={11} /> Add Exercise
                      </button>
                    </div>
                    {phase.exercises.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text)', textAlign: 'center', padding: '14px', background: 'var(--color-bg-alt)', borderRadius: '10px' }}>
                        No exercises yet. Click "Add Exercise" above.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {phase.exercises.map((ex, exIdx) => {
                          const exData = EXERCISE_LIBRARY.find(e => e.id === ex.id);
                          if (!exData) return null;
                          return (
                            <div key={exIdx} style={{
                              background: 'var(--color-bg-alt)', borderRadius: '10px', padding: '10px 12px',
                              display: 'flex', flexDirection: 'column', gap: '8px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                                  {exData.name}
                                </div>
                                <button onClick={() => removeExercise(i, exIdx)} style={{
                                  background: 'transparent', border: 'none', cursor: 'pointer',
                                  color: 'var(--color-text)', padding: '4px',
                                }}>
                                  <X size={13} />
                                </button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '6px' }}>
                                <NumInput label="Sets" value={ex.sets} onChange={v => updateExercise(i, exIdx, 'sets', v)} />
                                <NumInput label="Reps" value={ex.reps} onChange={v => updateExercise(i, exIdx, 'reps', v)} />
                                <NumInput label="Hold (s)" value={ex.holdSeconds || 0} onChange={v => updateExercise(i, exIdx, 'holdSeconds', v)} />
                                <div>
                                  <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text)', marginBottom: '2px' }}>
                                    Frequency
                                  </div>
                                  <input value={ex.frequency} onChange={e => updateExercise(i, exIdx, 'frequency', e.target.value)} style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/programs')} style={{
          padding: '12px 22px', borderRadius: '50px',
          background: 'white', color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px',
          cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button onClick={saveProgram} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '12px 24px', borderRadius: '50px',
          background: 'var(--color-secondary)', color: 'white', border: 'none',
          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
          cursor: 'pointer',
        }}>
          <Save size={14} /> Save Program
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {showPicker !== null && (
        <div onClick={() => setShowPicker(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '16px',
            maxWidth: '600px', maxHeight: '85vh', width: '100%',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4>Add Exercise</h4>
                <button onClick={() => setShowPicker(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-border)' }} />
                <input
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search exercises..."
                  style={{ paddingLeft: '36px' }}
                  autoFocus
                />
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              {filteredExercises.map(ex => (
                <button key={ex.id} onClick={() => addExerciseToPhase(showPicker, ex.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', background: 'transparent', border: 'none',
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                  marginBottom: '4px', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{ex.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                      {ex.bodyPart} • {ex.difficulty} • {ex.position}
                    </div>
                  </div>
                  <Plus size={16} color="var(--color-accent)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)', marginBottom: '5px' }}>
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text)', marginBottom: '2px' }}>
        {label}
      </div>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min="0" style={{ padding: '6px 8px', fontSize: '0.78rem', textAlign: 'center' }} />
    </div>
  );
}
