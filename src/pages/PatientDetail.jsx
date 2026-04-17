import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Activity, Heart, TrendingUp, Plus, X, CheckCircle2, AlertCircle, Trash2, Eye, Search, Dumbbell } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { getPatientById, deletePatient } from '../data/users';
import { load, save } from '../utils/storage';
import { PROTOCOLS } from '../data/protocols';
import { EXERCISE_LIBRARY, PAIN_SCALE, BODY_PARTS } from '../data/exercises';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { switchPatient } = useAuth();
  const patient = getPatientById(id);
  const [showAssignProgram, setShowAssignProgram] = useState(false);
  const [showAssignExercise, setShowAssignExercise] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!patient) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p>Patient not found.</p>
        <Link to="/" style={{ color: 'var(--color-accent)' }}>Back</Link>
      </div>
    );
  }

  // Read patient-scoped data directly via load (since we're a practitioner viewing this patient)
  const sessions = useMemo(() => load(`patient_${id}_completed_sessions`, []), [id, refreshKey]);
  const painEntries = useMemo(() => load(`patient_${id}_pain_entries`, []), [id, refreshKey]);
  const assignedPrograms = useMemo(() => load(`patient_${id}_assigned_programs`, []), [id, refreshKey]);
  const assignedExercises = useMemo(() => load(`patient_${id}_assigned_exercises`, []), [id, refreshKey]);
  const outcomeScores = useMemo(() => load(`patient_${id}_outcome_scores`, []), [id, refreshKey]);

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const last14Days = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        sessionCount: sessions.filter(s => s.date === dateStr).length,
      });
    }
    return days;
  }, [sessions]);

  const adherence = useMemo(() => {
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }
    const daysActive = last7Days.filter(d => sessions.some(s => s.date === d)).length;
    return Math.round((daysActive / 7) * 100);
  }, [sessions]);

  const painData = useMemo(() => {
    return painEntries.slice(-20).map(e => ({
      label: new Date(e.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      value: e.level,
    }));
  }, [painEntries]);

  const lastPain = painEntries[painEntries.length - 1];
  const totalSessions = sessions.length;
  const uniqueExercises = new Set(sessions.map(s => s.exerciseId)).size;

  // Open as the patient (impersonate)
  const viewAsPatient = () => {
    switchPatient(patient.id, patient.name);
    navigate('/');
  };

  // Assign program
  const assignProgram = (protocolId) => {
    const newAssignment = {
      id: Date.now().toString(36),
      protocolId,
      assignedDate: new Date().toISOString(),
      startDate: new Date().toISOString().split('T')[0],
      currentPhase: 0,
      status: 'active',
    };
    const existing = load(`patient_${id}_assigned_programs`, []);
    save(`patient_${id}_assigned_programs`, [...existing, newAssignment]);
    setShowAssignProgram(false);
    setRefreshKey(k => k + 1);
  };

  const removeAssignment = (assignmentId) => {
    if (!confirm('Remove this program from the patient?')) return;
    const existing = load(`patient_${id}_assigned_programs`, []);
    save(`patient_${id}_assigned_programs`, existing.filter(a => a.id !== assignmentId));
    setRefreshKey(k => k + 1);
  };

  // Assign individual exercise
  const assignExercise = (exerciseId, params) => {
    const ex = EXERCISE_LIBRARY.find(e => e.id === exerciseId);
    if (!ex) return;
    const newEx = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      exerciseId,
      sets: params.sets || ex.sets || 3,
      reps: params.reps || ex.reps || 10,
      holdSeconds: params.holdSeconds || ex.holdSeconds,
      frequency: params.frequency || 'Daily',
      notes: params.notes || '',
      assignedDate: new Date().toISOString(),
    };
    const existing = load(`patient_${id}_assigned_exercises`, []);
    save(`patient_${id}_assigned_exercises`, [...existing, newEx]);
    setRefreshKey(k => k + 1);
  };

  const removeExercise = (assignmentId) => {
    const existing = load(`patient_${id}_assigned_exercises`, []);
    save(`patient_${id}_assigned_exercises`, existing.filter(a => a.id !== assignmentId));
    setRefreshKey(k => k + 1);
  };

  const updateExerciseAssignment = (assignmentId, updates) => {
    const existing = load(`patient_${id}_assigned_exercises`, []);
    save(`patient_${id}_assigned_exercises`, existing.map(a => a.id === assignmentId ? { ...a, ...updates } : a));
    setRefreshKey(k => k + 1);
  };

  const removePatient = () => {
    if (!confirm(`Delete ${patient.name}? This cannot be undone.`)) return;
    deletePatient(patient.id);
    navigate('/');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
        <ArrowLeft size={15} /> Back to Caseload
      </Link>

      {/* Patient header */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '70px', height: '70px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
          }}>
            {patient.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: 'white', marginBottom: '4px' }}>{patient.name}</h2>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              {patient.condition} • {patient.side} side • Age {patient.age}
            </div>
            {patient.surgeryDate && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: '2px' }}>
                Surgery: {new Date(patient.surgeryDate).toLocaleDateString()}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={viewAsPatient} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.2)', color: 'white',
              padding: '9px 16px', borderRadius: '50px', border: 'none',
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
              cursor: 'pointer',
            }}>
              <Eye size={12} /> View As Patient
            </button>
            <button onClick={removePatient} style={{
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              padding: '9px', borderRadius: '50px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' }}>
          <Stat icon={<Activity size={15} />} value={`${adherence}%`} label="Adherence" />
          <Stat icon={<CheckCircle2 size={15} />} value={totalSessions} label="Sessions" />
          <Stat icon={<TrendingUp size={15} />} value={uniqueExercises} label="Exercises" />
          <Stat icon={<Heart size={15} />} value={lastPain ? `${lastPain.level}/10` : '—'} label="Pain" />
        </div>
      </div>

      {/* Assigned programs */}
      <div style={{
        background: 'white', borderRadius: '14px',
        border: '1px solid var(--color-border)', padding: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4>Assigned Programs ({assignedPrograms.length})</h4>
          <button onClick={() => setShowAssignProgram(true)} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'var(--color-accent)', color: 'white',
            padding: '7px 14px', borderRadius: '50px', border: 'none',
            fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
            cursor: 'pointer',
          }}>
            <Plus size={11} /> Assign Program
          </button>
        </div>

        {assignedPrograms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text)', fontSize: '0.82rem' }}>
            No programs assigned. Click "Assign Program" to allocate a rehabilitation plan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignedPrograms.map(a => {
              const protocol = PROTOCOLS.find(p => p.id === a.protocolId);
              if (!protocol) return null;
              const startedDays = Math.floor((Date.now() - new Date(a.startDate).getTime()) / (24 * 60 * 60 * 1000));
              const week = Math.floor(startedDays / 7) + 1;
              return (
                <div key={a.id} style={{
                  background: 'var(--color-bg-alt)', borderRadius: '10px', padding: '12px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{ fontSize: '1.6rem' }}>{protocol.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{protocol.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                      {protocol.totalWeeks ? `Week ${week} of ${protocol.totalWeeks}` : 'Daily routine'} • Started {new Date(a.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={() => removeAssignment(a.id)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px',
                    color: 'var(--color-text)',
                  }}>
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assigned individual exercises */}
      <div style={{
        background: 'white', borderRadius: '14px',
        border: '1px solid var(--color-border)', padding: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4>Assigned Exercises ({assignedExercises.length})</h4>
          <button onClick={() => setShowAssignExercise(true)} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'var(--color-accent)', color: 'white',
            padding: '7px 14px', borderRadius: '50px', border: 'none',
            fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
            cursor: 'pointer',
          }}>
            <Plus size={11} /> Assign Exercise
          </button>
        </div>

        {assignedExercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text)', fontSize: '0.82rem' }}>
            No exercises assigned individually. Use "Assign Exercise" to add one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignedExercises.map(a => {
              const ex = EXERCISE_LIBRARY.find(e => e.id === a.exerciseId);
              if (!ex) return null;
              return (
                <AssignedExerciseRow
                  key={a.id}
                  assignment={a}
                  exercise={ex}
                  onUpdate={(updates) => updateExerciseAssignment(a.id, updates)}
                  onRemove={() => removeExercise(a.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
        <div style={{
          background: 'white', borderRadius: '14px',
          border: '1px solid var(--color-border)', padding: '18px',
        }}>
          <h4 style={{ marginBottom: '12px' }}>Activity (Last 14 Days)</h4>
          <div style={{ height: '170px' }}>
            {sessions.length > 0 ? (
              <Bar
                data={{
                  labels: last14Days.map(d => d.label),
                  datasets: [{
                    data: last14Days.map(d => d.sessionCount),
                    backgroundColor: '#B0C4BB',
                    borderRadius: 5,
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 9 } }, grid: { color: '#f5f5f5' } },
                  },
                }}
              />
            ) : (
              <Empty msg="No sessions logged yet" />
            )}
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: '14px',
          border: '1px solid var(--color-border)', padding: '18px',
        }}>
          <h4 style={{ marginBottom: '12px' }}>Pain Trend</h4>
          <div style={{ height: '170px' }}>
            {painData.length > 1 ? (
              <Line
                data={{
                  labels: painData.map(d => d.label),
                  datasets: [{
                    data: painData.map(d => d.value),
                    borderColor: '#C06060',
                    backgroundColor: 'rgba(192,96,96,0.08)',
                    fill: true,
                    pointBackgroundColor: '#C06060',
                    tension: 0.4,
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                    y: { beginAtZero: true, max: 10, ticks: { stepSize: 2, font: { size: 9 } }, grid: { color: '#f5f5f5' } },
                  },
                }}
              />
            ) : (
              <Empty msg="No pain entries yet" />
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div style={{
        background: 'white', borderRadius: '14px',
        border: '1px solid var(--color-border)', padding: '18px',
      }}>
        <h4 style={{ marginBottom: '12px' }}>Recent Sessions</h4>
        {sessions.length === 0 ? (
          <Empty msg="No sessions logged yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflow: 'auto' }}>
            {[...sessions].reverse().slice(0, 15).map((s, i) => {
              const ex = EXERCISE_LIBRARY.find(e => e.id === s.exerciseId);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '10px', background: 'var(--color-bg-alt)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-secondary)' }}>{ex?.name || s.exerciseId}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                      {s.setsCompleted} sets • {Math.round((s.duration || 0) / 60)} min
                      {s.painLevel != null && ` • Pain: ${s.painLevel}/10`}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>{s.date}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Pain Entries */}
      <div style={{
        background: 'white', borderRadius: '14px',
        border: '1px solid var(--color-border)', padding: '18px',
      }}>
        <h4 style={{ marginBottom: '12px' }}>Recent Pain Reports</h4>
        {painEntries.length === 0 ? (
          <Empty msg="No pain entries logged" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflow: 'auto' }}>
            {[...painEntries].reverse().slice(0, 12).map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', background: 'var(--color-bg-alt)',
              }}>
                <div style={{ fontSize: '1.4rem' }}>{PAIN_SCALE[p.level]?.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{p.level}/10</span>
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                      padding: '2px 7px', borderRadius: '50px',
                      background: PAIN_SCALE[p.level]?.color + '15', color: PAIN_SCALE[p.level]?.color,
                    }}>
                      {PAIN_SCALE[p.level]?.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                    {p.location} • {p.activity} • {new Date(p.timestamp).toLocaleDateString()}
                  </div>
                  {p.notes && <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', fontStyle: 'italic', marginTop: '3px' }}>"{p.notes}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outcome Scores */}
      {outcomeScores.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '14px',
          border: '1px solid var(--color-border)', padding: '18px',
        }}>
          <h4 style={{ marginBottom: '12px' }}>Outcome Measure Scores</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {outcomeScores.slice(-5).reverse().map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: '10px', background: 'var(--color-bg-alt)',
              }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '10px',
                  background: s.interpretation.color + '15', color: s.interpretation.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.05rem', fontWeight: 700,
                }}>
                  {s.score}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{s.measureName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                    {s.interpretation.level} • {new Date(s.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Program Modal */}
      {showAssignProgram && (
        <AssignProgramModal
          onClose={() => setShowAssignProgram(false)}
          onAssign={assignProgram}
          patientCondition={patient.condition}
          alreadyAssigned={assignedPrograms.map(a => a.protocolId)}
        />
      )}

      {/* Assign Exercise Modal */}
      {showAssignExercise && (
        <AssignExerciseModal
          onClose={() => setShowAssignExercise(false)}
          onAssign={(exId, params) => {
            assignExercise(exId, params);
            setShowAssignExercise(false);
          }}
          patientBodyPart={getBodyPartFromCondition(patient.condition)}
        />
      )}
    </div>
  );
}

function getBodyPartFromCondition(condition) {
  const map = {
    'ACL Reconstruction': 'Knee', 'Meniscus Repair': 'Knee', 'Patellofemoral Pain': 'Knee',
    'Total Knee Replacement': 'Knee', 'IT Band Syndrome': 'Knee',
    'Rotator Cuff Repair': 'Shoulder', 'Frozen Shoulder': 'Shoulder', 'Shoulder Impingement': 'Shoulder',
    'Tennis Elbow': 'Elbow', "Golfer's Elbow": 'Elbow',
    'Carpal Tunnel': 'Wrist',
    'Low Back Pain': 'Back', 'Disc Herniation': 'Back', 'Sciatica': 'Back', 'SI Joint Dysfunction': 'Back',
    'Hip Replacement': 'Hip', 'Hip Bursitis': 'Hip',
    'Ankle Sprain': 'Ankle', 'Achilles Tendinopathy': 'Ankle',
    'Plantar Fasciitis': 'Foot',
    'Neck Pain': 'Neck', 'Whiplash': 'Neck',
  };
  return map[condition] || null;
}

function AssignedExerciseRow({ assignment, exercise, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{
      background: 'var(--color-bg-alt)', borderRadius: '10px', padding: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Dumbbell size={18} color="var(--color-accent)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{exercise.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
            {assignment.sets} × {assignment.reps}
            {assignment.holdSeconds ? ` × ${assignment.holdSeconds}s hold` : ''} • {assignment.frequency}
          </div>
          {assignment.notes && (
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text)', fontStyle: 'italic', marginTop: '3px' }}>
              "{assignment.notes}"
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button onClick={() => setEditing(!editing)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '5px', color: 'var(--color-accent)', fontSize: '0.65rem', fontWeight: 700,
          }}>
            {editing ? 'Done' : 'Edit'}
          </button>
          <button onClick={onRemove} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '5px', color: 'var(--color-text)',
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '6px', marginTop: '10px' }}>
          <NumField label="Sets" value={assignment.sets} onChange={v => onUpdate({ sets: v })} />
          <NumField label="Reps" value={assignment.reps} onChange={v => onUpdate({ reps: v })} />
          <NumField label="Hold (s)" value={assignment.holdSeconds || 0} onChange={v => onUpdate({ holdSeconds: v })} />
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text)', marginBottom: '2px' }}>
              Frequency
            </div>
            <input value={assignment.frequency} onChange={e => onUpdate({ frequency: e.target.value })} style={{ padding: '6px 8px', fontSize: '0.78rem' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text)', marginBottom: '2px' }}>
        {label}
      </div>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min="0" style={{ padding: '6px 8px', fontSize: '0.78rem', textAlign: 'center' }} />
    </div>
  );
}

function AssignExerciseModal({ onClose, onAssign, patientBodyPart }) {
  const [search, setSearch] = useState('');
  const [bodyFilter, setBodyFilter] = useState(patientBodyPart || 'All');
  const [selected, setSelected] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [frequency, setFrequency] = useState('Daily');
  const [notes, setNotes] = useState('');

  const filtered = EXERCISE_LIBRARY.filter(e => {
    if (bodyFilter !== 'All' && e.bodyPart !== bodyFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pickExercise = (ex) => {
    setSelected(ex);
    setSets(ex.sets || 3);
    setReps(ex.reps || 10);
    setHoldSeconds(ex.holdSeconds || 0);
  };

  const submit = () => {
    if (!selected) return;
    onAssign(selected.id, { sets, reps, holdSeconds, frequency, notes });
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '16px', maxWidth: '640px', width: '100%',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3>Assign Exercise</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}>
              <X size={18} />
            </button>
          </div>

          {!selected && (
            <>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-border)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..." style={{ paddingLeft: '36px' }} autoFocus />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {['All', ...BODY_PARTS].map(bp => (
                  <button key={bp} onClick={() => setBodyFilter(bp)} style={{
                    fontSize: '0.65rem', padding: '4px 10px', borderRadius: '50px',
                    border: `1.5px solid ${bodyFilter === bp ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: bodyFilter === bp ? 'var(--color-accent)' : 'white',
                    color: bodyFilter === bp ? 'white' : 'var(--color-text)',
                    fontWeight: 500, cursor: 'pointer',
                  }}>{bp}</button>
                ))}
              </div>
            </>
          )}
        </div>

        {!selected ? (
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)' }}>
                No exercises found
              </div>
            ) : filtered.map(ex => (
              <button key={ex.id} onClick={() => pickExercise(ex)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                padding: '12px 14px', borderRadius: '10px', background: 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '4px',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{ex.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                    {ex.bodyPart} • {ex.difficulty} • {ex.position}
                  </div>
                </div>
                <Plus size={16} color="var(--color-accent)" />
              </button>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', padding: '18px' }}>
            <div style={{
              background: 'var(--color-bg-alt)', borderRadius: '12px',
              padding: '14px', marginBottom: '14px',
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '4px' }}>{selected.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text)' }}>{selected.bodyPart} • {selected.difficulty} • {selected.position}</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', marginTop: '8px', lineHeight: 1.5 }}>{selected.description}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <NumField label="Sets" value={sets} onChange={setSets} />
              <NumField label="Reps" value={reps} onChange={setReps} />
              <NumField label="Hold (s)" value={holdSeconds} onChange={setHoldSeconds} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)', marginBottom: '5px' }}>
                Frequency
              </div>
              <input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="e.g., 3x daily" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)', marginBottom: '5px' }}>
                Notes for patient (optional)
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any specific instructions..." rows={2} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setSelected(null)} style={{
                padding: '11px 18px', borderRadius: '10px',
                background: 'white', color: 'var(--color-text)', border: '1px solid var(--color-border)',
                fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px',
                cursor: 'pointer',
              }}>← Back</button>
              <button onClick={submit} style={{
                flex: 1, padding: '11px', borderRadius: '10px',
                background: 'var(--color-secondary)', color: 'white', border: 'none',
                fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
                cursor: 'pointer',
              }}>Assign to Patient</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssignProgramModal({ onClose, onAssign, patientCondition, alreadyAssigned }) {
  const [filter, setFilter] = useState('All');
  // Suggest matching protocols first
  const suggested = PROTOCOLS.filter(p => p.condition === patientCondition);
  const others = PROTOCOLS.filter(p => p.condition !== patientCondition);
  const all = [...suggested, ...others];

  const filtered = all.filter(p => filter === 'All' || p.bodyPart === filter);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3>Assign Program</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {['All', ...BODY_PARTS].map(bp => (
              <button key={bp} onClick={() => setFilter(bp)} style={{
                fontSize: '0.65rem', padding: '4px 10px', borderRadius: '50px',
                border: `1.5px solid ${filter === bp ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: filter === bp ? 'var(--color-accent)' : 'white',
                color: filter === bp ? 'white' : 'var(--color-text)',
                fontWeight: 500, cursor: 'pointer',
              }}>{bp}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {suggested.length > 0 && filter === 'All' && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', padding: '0 4px' }}>
                ✨ Recommended for {patientCondition}
              </div>
              {suggested.map(p => <ProtocolRow key={p.id} protocol={p} onAssign={onAssign} disabled={alreadyAssigned.includes(p.id)} />)}
            </div>
          )}
          {filtered.filter(p => filter !== 'All' || !suggested.includes(p)).map(p => (
            <ProtocolRow key={p.id} protocol={p} onAssign={onAssign} disabled={alreadyAssigned.includes(p.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProtocolRow({ protocol, onAssign, disabled }) {
  return (
    <button
      onClick={() => !disabled && onAssign(protocol.id)}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px', borderRadius: '10px',
        background: disabled ? '#f5f5f5' : 'transparent', border: 'none',
        cursor: disabled ? 'default' : 'pointer', textAlign: 'left',
        marginBottom: '4px', opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = 'var(--color-bg-alt)')}
      onMouseLeave={e => !disabled && (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ fontSize: '1.6rem' }}>{protocol.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{protocol.name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
          {protocol.totalWeeks ? `${protocol.totalWeeks} weeks` : 'Daily routine'} • {protocol.phases.length} stages • {protocol.bodyPart}
        </div>
      </div>
      {disabled ? (
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#4CAF50', textTransform: 'uppercase' }}>Assigned</span>
      ) : (
        <Plus size={16} color="var(--color-accent)" />
      )}
    </button>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px', padding: '12px 8px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: 'rgba(255,255,255,0.6)' }}>{icon}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
        {label}
      </div>
    </div>
  );
}

function Empty({ msg }) {
  return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text)', fontSize: '0.82rem' }}>{msg}</div>;
}
