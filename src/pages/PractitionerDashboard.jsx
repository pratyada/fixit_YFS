import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, Search, ChevronRight, Activity, Heart, Dumbbell, Video, Clock, Star, ChevronDown, ChevronUp, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatientsByPractitioner, getPatientSessions, getPainEntries, getAssignments, addFeedback, updateSession, getFeedbackForSession, getUsersByRole, assignPatientToPractitioner } from '../lib/firestore';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { addAssignment } from '../lib/firestore';

export default function PractitionerDashboard() {
  const { t, i18n } = useTranslation('practitioner');
  const { user, session } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSessions, setPatientSessions] = useState([]);
  const [patientPain, setPatientPain] = useState([]);
  const [patientAssignments, setPatientAssignments] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [allPatients, setAllPatients] = useState([]);
  const [addSearch, setAddSearch] = useState('');
  const [loadingAll, setLoadingAll] = useState(false);

  const loadPatients = async () => {
    if (user) {
      const p = await getPatientsByPractitioner(user.uid);
      setPatients(p);
      setLoading(false);
    }
  };

  useEffect(() => { loadPatients(); }, [user]);

  const openAddPatient = async () => {
    setShowAddPatient(true);
    setLoadingAll(true);
    const all = await getUsersByRole('patient');
    setAllPatients(all);
    setLoadingAll(false);
  };

  const handleAddPatient = async (patientId) => {
    await assignPatientToPractitioner(patientId, user.uid);
    await loadPatients();
    setAllPatients(prev => prev.map(p => p.id === patientId ? { ...p, practitionerId: user.uid } : p));
  };

  const handleRemovePatient = async (patientId) => {
    await assignPatientToPractitioner(patientId, '');
    await loadPatients();
    setAllPatients(prev => prev.map(p => p.id === patientId ? { ...p, practitionerId: '' } : p));
  };

  const viewPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoadingDetail(true);
    const [sessions, pain, assignments] = await Promise.all([
      getPatientSessions(patient.id),
      getPainEntries(patient.id),
      getAssignments(patient.id),
    ]);
    setPatientSessions(sessions);
    setPatientPain(pain);
    setPatientAssignments(assignments);
    setLoadingDetail(false);
  };

  const filtered = patients.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.condition?.toLowerCase().includes(search.toLowerCase())
  );

  // Detail view
  if (selectedPatient) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button onClick={() => setSelectedPatient(null)} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'none', border: 'none', color: 'var(--color-accent)',
          fontSize: '0.78rem', fontWeight: 500, padding: 0,
        }}>
          {t('backToPatients')}
        </button>

        {/* Patient header */}
        <div style={{
          background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
          borderRadius: '20px', padding: '24px', color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {selectedPatient.photoURL ? (
              <img src={selectedPatient.photoURL} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                {selectedPatient.name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h2 style={{ color: 'white', marginBottom: '2px' }}>{selectedPatient.name}</h2>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                {selectedPatient.condition || t('noConditionSet')} &bull; {selectedPatient.email}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <StatBox icon={<Video size={14} />} value={patientSessions.length} label={t('patientDetail.sessions')} />
            <StatBox icon={<Heart size={14} />} value={patientPain.length} label={t('patientDetail.painLogs')} />
            <StatBox icon={<Star size={14} />} value={patientSessions.filter(s => s.aiScore).length} label={t('patientDetail.analyzed')} />
          </div>
        </div>

        {/* Assign Exercise */}
        <AssignExercisePanel patient={selectedPatient} practitionerId={user.uid} t={t} />

        {/* Assigned Exercises Overview */}
        {!loadingDetail && patientAssignments.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '16px' }}>
            <h3 style={{ marginBottom: '12px' }}>
              {t('assignedExercises', { count: patientAssignments.length })}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {patientAssignments.map(a => {
                const ex = FIXIT_EXERCISES.find(e => e.id === a.exerciseId);
                // Find sessions matching this exercise
                const exerciseSessions = patientSessions.filter(s => s.exerciseId === a.exerciseId);
                const latestSession = exerciseSessions[0];
                const bestScore = exerciseSessions.length > 0
                  ? Math.max(...exerciseSessions.filter(s => s.aiScore).map(s => s.aiScore))
                  : null;
                const sessionCount = exerciseSessions.length;

                return (
                  <div key={a.id} style={{
                    padding: '12px', borderRadius: '12px',
                    background: 'var(--color-bg-alt)',
                    border: '1px solid var(--color-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                          {ex?.name || a.exerciseName || a.exerciseId}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text)' }}>
                          {a.sets}x{a.reps} &bull; {a.frequency || 'Daily'}
                          {a.notes && <> &bull; <em>{a.notes}</em></>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {bestScore ? (
                          <div style={{
                            fontSize: '1rem', fontWeight: 700,
                            color: bestScore >= 80 ? '#2E7D32' : bestScore >= 60 ? '#F57F17' : '#C62828',
                          }}>
                            {Math.round(bestScore)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: '#9E9E9E' }}>—</div>
                        )}
                        <div style={{ fontSize: '0.58rem', color: 'var(--color-text)' }}>
                          {bestScore ? t('best') : t('noScore')}
                        </div>
                      </div>
                    </div>

                    {/* Session count & status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '50px',
                        background: sessionCount > 0 ? '#E8F5E9' : '#FFF8E1',
                        color: sessionCount > 0 ? '#2E7D32' : '#F57F17',
                        fontWeight: 600,
                      }}>
                        {t(sessionCount !== 1 ? 'sessionCount_plural' : 'sessionCount', { count: sessionCount })}
                      </span>
                      {latestSession && (
                        <span style={{ color: 'var(--color-text)' }}>
                          {t('last')} {latestSession.createdAt?.toDate ? latestSession.createdAt.toDate().toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }) : t('recent')}
                        </span>
                      )}
                      {latestSession?.status === 'REVIEWED' && (
                        <CheckCircle2 size={13} color="#4CAF50" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text)' }}>{'Loading...'}</div>
        ) : (
          <>
            {/* Sessions with feedback */}
            <div>
              <h3 style={{ marginBottom: '10px' }}>
                {t('poseCheckSessions', { count: patientSessions.length })}
              </h3>
              {patientSessions.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '24px', textAlign: 'center', color: 'var(--color-text)', fontSize: '0.85rem' }}>
                  {t('noRecordings')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patientSessions.map(s => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      patient={selectedPatient}
                      practitionerId={user.uid}
                      t={t}
                      i18n={i18n}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pain entries */}
            <div>
              <h3 style={{ marginBottom: '10px' }}>{t('painJournal')}</h3>
              {patientPain.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '24px', textAlign: 'center', color: 'var(--color-text)', fontSize: '0.85rem' }}>
                  {t('noPainEntries')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {patientPain.slice(0, 10).map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'white', borderRadius: '10px',
                      border: '1px solid var(--color-border)', padding: '10px 14px',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-secondary)' }}>
                          {p.location} — {p.activity}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                          {p.timestamp?.toDate ? p.timestamp.toDate().toLocaleDateString() : p.date || 'Recent'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1rem', fontWeight: 700,
                        color: p.level >= 7 ? '#C62828' : p.level >= 4 ? '#F57F17' : '#2E7D32',
                      }}>
                        {p.level}/10
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Patient list view
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
          {t('roleLabel')}
        </div>
        <h2 style={{ color: 'white', marginBottom: '4px' }}>
          {t('welcome', { name: session?.name })}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
          {t(patients.length !== 1 ? 'patientsAssigned_plural' : 'patientsAssigned', { count: patients.length })}
        </p>
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPatients')} style={{ paddingLeft: '34px', fontSize: '0.82rem' }} />
        </div>
        <button onClick={openAddPatient} style={{
          background: 'var(--color-accent)', color: 'white', border: 'none',
          borderRadius: '12px', padding: '0 16px', fontSize: '0.72rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          + Add
        </button>
      </div>

      {/* Add Patient Panel */}
      {showAddPatient && (
        <div style={{
          background: 'white', borderRadius: '16px', border: '1px solid var(--color-accent)',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4>{t('addPatient')}</h4>
            <button onClick={() => setShowAddPatient(false)} style={{
              background: 'none', border: 'none', color: 'var(--color-text)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}>Close</button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
            <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder={t('searchAllPatients')} style={{ paddingLeft: '34px', fontSize: '0.82rem' }} />
          </div>
          {loadingAll ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text)', fontSize: '0.82rem' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflow: 'auto' }}>
              {allPatients
                .filter(p => !addSearch || p.name?.toLowerCase().includes(addSearch.toLowerCase()) || p.email?.toLowerCase().includes(addSearch.toLowerCase()))
                .map(p => {
                  const isMine = p.practitionerId === user.uid;
                  const isAssigned = p.practitionerId && !isMine;
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '10px',
                      background: isMine ? '#E8F5E9' : 'var(--color-bg-alt)',
                      border: `1px solid ${isMine ? '#C8E6C9' : 'transparent'}`,
                    }}>
                      {p.photoURL ? (
                        <img src={p.photoURL} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)',
                        }}>{p.name?.charAt(0) || '?'}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{p.name || 'Unnamed'}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.email}
                          {isAssigned && ` ${t('assignedToAnother')}`}
                        </div>
                      </div>
                      {isMine ? (
                        <button onClick={() => handleRemovePatient(p.id)} style={{
                          background: '#FFEBEE', color: '#C62828', border: 'none',
                          borderRadius: '8px', padding: '6px 12px',
                          fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', cursor: 'pointer',
                        }}>Remove</button>
                      ) : (
                        <button onClick={() => handleAddPatient(p.id)} disabled={isAssigned} style={{
                          background: isAssigned ? '#eee' : 'var(--color-accent)', color: isAssigned ? '#aaa' : 'white',
                          border: 'none', borderRadius: '8px', padding: '6px 12px',
                          fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', cursor: isAssigned ? 'default' : 'pointer',
                        }}>Add</button>
                      )}
                    </div>
                  );
                })}
              {allPatients.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text)', fontSize: '0.82rem' }}>
                  {t('noPatientsFound')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)' }}>{t('loadingPatients')}</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <Users size={32} color="var(--color-border)" style={{ margin: '0 auto 12px' }} />
          <h4>{t('noPatientsYet')}</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginTop: '4px' }}>
            {t('noPatientsDesc')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => viewPatient(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '14px',
                background: 'white', border: '1px solid var(--color-border)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; }}
            >
              {p.photoURL ? (
                <img src={p.photoURL} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: '#EDF3F1', color: '#708E86',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 600,
                }}>
                  {p.name?.charAt(0) || '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{p.name || t('noName', { defaultValue: 'Unnamed' })}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>{p.condition || t('noCondition')}</div>
              </div>
              <ChevronRight size={16} color="var(--color-border)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignExercisePanel({ patient, practitionerId, t }) {
  const [showPanel, setShowPanel] = useState(false);
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState([]);

  const handleAssign = async (exercise) => {
    setAssigning(true);
    try {
      await addAssignment(patient.id, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        practitionerId,
        sets,
        reps,
        notes: notes.trim() || null,
        frequency: 'Daily',
      });
      setAssigned(prev => [...prev, exercise.id]);
      setNotes('');
    } catch (e) {
      console.error('Failed to assign:', e);
    } finally {
      setAssigning(false);
    }
  };

  if (!showPanel) {
    return (
      <button onClick={() => setShowPanel(true)} style={{
        width: '100%', padding: '14px', borderRadius: '14px',
        background: 'var(--color-accent)', color: 'white',
        border: 'none', fontSize: '0.75rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '1px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        cursor: 'pointer',
      }}>
        <Dumbbell size={16} /> {t('assignExercise.title')}
      </button>
    );
  }

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: '1px solid var(--color-accent)', padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4>{t('assignExercise.assignTo', { name: patient.name?.split(' ')[0] })}</h4>
        <button onClick={() => setShowPanel(false)} style={{
          background: 'none', border: 'none', color: 'var(--color-text)',
          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
        }}>Close</button>
      </div>

      {/* Sets/Reps config */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', display: 'block', marginBottom: '4px' }}>{t('assignExercise.sets')}</label>
          <input type="number" value={sets} onChange={e => setSets(Number(e.target.value))} min={1} max={10} style={{ fontSize: '0.82rem' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', display: 'block', marginBottom: '4px' }}>{t('assignExercise.reps')}</label>
          <input type="number" value={reps} onChange={e => setReps(Number(e.target.value))} min={1} max={50} style={{ fontSize: '0.82rem' }} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', display: 'block', marginBottom: '4px' }}>{t('assignExercise.notesOptional')}</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('assignExercise.notesPlaceholder')} style={{ fontSize: '0.82rem' }} />
      </div>

      {/* Exercise list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {FIXIT_EXERCISES.map(ex => {
          const isAssigned = assigned.includes(ex.id);
          return (
            <div key={ex.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              background: isAssigned ? '#E8F5E9' : 'var(--color-bg-alt)',
              border: `1px solid ${isAssigned ? '#C8E6C9' : 'transparent'}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isAssigned ? '#2E7D32' : 'var(--color-secondary)' }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text)' }}>
                  {ex.bodyPart} &bull; {ex.difficulty}
                </div>
              </div>
              {isAssigned ? (
                <CheckCircle2 size={18} color="#4CAF50" />
              ) : (
                <button onClick={() => handleAssign(ex)} disabled={assigning} style={{
                  background: 'var(--color-accent)', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '6px 14px',
                  fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.5px', cursor: assigning ? 'default' : 'pointer',
                  opacity: assigning ? 0.5 : 1,
                }}>
                  {t('assignExercise.assign')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({ session: s, patient, practitionerId, t, i18n }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [rating, setRating] = useState(3);
  const [whatGood, setWhatGood] = useState('');
  const [whatImprove, setWhatImprove] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(s.status === 'REVIEWED');
  const [existingFeedback, setExistingFeedback] = useState(null);
  // AI retraining: per-fault corrections + score override + per-category ratings
  const [faultCorrections, setFaultCorrections] = useState({});
  const [scoreOverride, setScoreOverride] = useState(null);
  const [categoryRatings, setCategoryRatings] = useState({});

  const ex = EXERCISE_LIBRARY.find(e => e.id === s.exerciseId);
  const analysis = s.aiAnalysis;
  const scoreColor = (sc) => sc >= 80 ? '#2E7D32' : sc >= 60 ? '#F57F17' : '#C62828';
  const scoreBg = (sc) => sc >= 80 ? '#E8F5E9' : sc >= 60 ? '#FFF8E1' : '#FFEBEE';

  const loadFeedback = async () => {
    const fb = await getFeedbackForSession(s.id);
    if (fb) {
      setExistingFeedback(fb);
      setSubmitted(true);
    }
  };

  const handleExpand = () => {
    if (!expanded) loadFeedback();
    setExpanded(!expanded);
  };

  const submitFeedback = async () => {
    setSubmitting(true);
    try {
      // Build fault corrections for AI retraining
      const corrections = Object.entries(faultCorrections).map(([faultId, verdict]) => ({
        faultId,
        faultName: analysis?.faults?.find(f => f.id === faultId)?.name || faultId,
        verdict, // 'agree' | 'disagree' | 'partial'
      }));

      await addFeedback({
        sessionId: s.id,
        patientId: patient.id,
        practitionerId,
        exerciseId: s.exerciseId,
        exerciseName: ex?.name || s.exerciseName,
        rating,
        whatWasGood: whatGood,
        whatNeedsImproving: whatImprove,
        aiScore: s.aiScore,
        practitionerScore: scoreOverride,
        aiModelVersionSnapshot: s.aiModelVersion || 'movenet-lightning-v1',
        // AI retraining data
        faultCorrections: corrections,
        categoryRatings: Object.entries(categoryRatings).map(([name, score]) => ({ name, practitionerScore: score, aiScore: analysis?.categories?.find(c => c.name === name)?.score })),
        aiCategories: analysis?.categories || [],
        aiFaults: analysis?.faults || [],
        aiAngles: analysis?.angles || null,
      });
      await updateSession(patient.id, s.id, { status: 'REVIEWED' });
      setSubmitted(true);
      setFeedbackMode(false);
      setExistingFeedback({ rating, whatWasGood: whatGood, whatNeedsImproving: whatImprove, faultCorrections: corrections, practitionerScore: scoreOverride, categoryRatings });
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'white', borderRadius: '14px',
      border: `1px solid ${expanded ? 'var(--color-accent)' : 'var(--color-border)'}`,
      overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* Header — tap to expand */}
      <button onClick={handleExpand} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px', background: 'none', border: 'none', textAlign: 'left',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
          background: s.aiScore ? scoreBg(s.aiScore) : 'var(--color-bg-alt)',
          color: s.aiScore ? scoreColor(s.aiScore) : 'var(--color-text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.95rem', fontWeight: 700,
        }}>
          {s.aiScore ? Math.round(s.aiScore) : '—'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
            {ex?.name || s.exerciseName || s.exerciseId}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-text)' }}>
            {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : t('recent')}
            {s.type === 'pose_check' && ` • ${t('feedback.poseCheck')}`}
            {submitted && ` • ${t('feedback.reviewed')}`}
          </div>
        </div>
        {(s.frontVideoUrl || s.sideVideoUrl) && (
          <div title="Has video" style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: '#EDE7F6', color: '#5E35B1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Video size={12} />
          </div>
        )}
        {submitted && <CheckCircle2 size={16} color="#4CAF50" />}
        {expanded ? <ChevronUp size={14} color="var(--color-text)" /> : <ChevronDown size={14} color="var(--color-text)" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* AI Summary */}
          {s.aiSummary && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontStyle: 'italic', padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: '8px' }}>
              {s.aiSummary}
            </div>
          )}

          {/* Analysis details */}
          {analysis && (
            <>
              {/* Categories — AI vs Practitioner comparison */}
              {analysis.categories && (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', marginBottom: '8px' }}>
                    {t('analysis.scoreBreakdown')} {feedbackMode && ' — Rate each category'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: feedbackMode ? '10px' : '6px' }}>
                    {analysis.categories.map(cat => {
                      const practScore = categoryRatings[cat.name];
                      const existingCatRating = existingFeedback?.categoryRatings?.[cat.name];
                      const showPractitioner = feedbackMode || existingCatRating != null;
                      return (
                        <div key={cat.name} style={{
                          padding: feedbackMode ? '10px 12px' : '0',
                          background: feedbackMode ? 'white' : 'transparent',
                          borderRadius: feedbackMode ? '10px' : '0',
                          border: feedbackMode ? '1px solid var(--color-border)' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: feedbackMode ? '6px' : '0' }}>
                            <span style={{ fontSize: '0.85rem' }}>{cat.icon}</span>
                            <span style={{ fontSize: '0.78rem', flex: 1, color: 'var(--color-secondary)', fontWeight: 600 }}>{cat.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--color-text)', fontWeight: 600 }}>AI</span>
                              <div style={{ width: '50px', height: '6px', background: 'var(--color-bg-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${cat.score}%`, background: scoreColor(cat.score), borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor(cat.score), width: '28px', textAlign: 'right' }}>{cat.score}</span>
                            </div>
                          </div>
                          {feedbackMode && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.6rem', color: '#5E35B1', fontWeight: 600, minWidth: '28px' }}>You</span>
                              <input
                                type="range" min="0" max="100"
                                value={practScore ?? cat.score}
                                onChange={e => setCategoryRatings(prev => ({ ...prev, [cat.name]: Number(e.target.value) }))}
                                style={{ flex: 1, accentColor: '#5E35B1', height: '4px' }}
                              />
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 700, width: '28px', textAlign: 'right',
                                color: scoreColor(practScore ?? cat.score),
                              }}>
                                {practScore ?? cat.score}
                              </span>
                            </div>
                          )}
                          {!feedbackMode && existingCatRating != null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.6rem', color: '#5E35B1', fontWeight: 600, minWidth: '28px' }}>You</span>
                              <div style={{ width: '50px', height: '6px', background: 'var(--color-bg-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${existingCatRating}%`, background: '#5E35B1', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5E35B1', width: '28px', textAlign: 'right' }}>{existingCatRating}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faults */}
              {analysis.faults?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', marginBottom: '8px' }}>
                    {t('analysis.formIssues')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {analysis.faults.map(f => (
                      <div key={f.id} style={{
                        fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px',
                        background: f.severity === 'high' ? '#FFF3F0' : f.severity === 'moderate' ? '#FFF8E1' : '#E8F5E9',
                        color: f.severity === 'high' ? '#C62828' : f.severity === 'moderate' ? '#E65100' : '#2E7D32',
                      }}>
                        <strong>{f.name}</strong> — {f.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Angles */}
              {analysis.angles && (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', marginBottom: '8px' }}>
                    {t('analysis.jointAngles')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Object.entries(analysis.angles).map(([joint, data]) => (
                      <div key={joint} style={{
                        background: 'var(--color-bg-alt)', borderRadius: '8px', padding: '6px 12px',
                        fontSize: '0.72rem', color: 'var(--color-secondary)',
                      }}>
                        <strong>{joint.replace(/([A-Z])/g, ' $1').trim()}</strong>: {data.avg}° ({data.min}°–{data.max}°)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Inline Video Players */}
          {!(s.frontVideoUrl || s.sideVideoUrl) && (
            <div style={{
              background: '#FFF8E1', borderRadius: '10px', padding: '12px 14px',
              border: '1px solid #FFE082', fontSize: '0.78rem', color: '#F57F17',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Video size={14} />
              No video recorded for this session. Ask the patient to use the Pose Checker — new sessions will include video.
            </div>
          )}
          {(s.frontVideoUrl || s.sideVideoUrl) && (
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', marginBottom: '8px' }}>
                Session Videos
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {s.frontVideoUrl && (
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {t('analysis.frontVideo')}
                    </div>
                    <video src={s.frontVideoUrl} controls playsInline preload="metadata" style={{
                      width: '100%', borderRadius: '8px', background: '#000',
                      maxHeight: '200px',
                    }} />
                  </div>
                )}
                {s.sideVideoUrl && (
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {t('analysis.sideVideo')}
                    </div>
                    <video src={s.sideVideoUrl} controls playsInline preload="metadata" style={{
                      width: '100%', borderRadius: '8px', background: '#000',
                      maxHeight: '200px',
                    }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing feedback display */}
          {existingFeedback && !feedbackMode && (
            <div style={{ background: '#EDF3F1', borderRadius: '10px', padding: '14px', border: '1px solid #D8E8E3' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#708E86', marginBottom: '8px' }}>
                {t('feedback.yourFeedback')}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} fill={i <= existingFeedback.rating ? '#F59E0B' : 'none'} color={i <= existingFeedback.rating ? '#F59E0B' : '#D1D5DB'} />
                ))}
              </div>
              {existingFeedback.whatWasGood && (
                <div style={{ fontSize: '0.78rem', color: '#2E7D32', marginBottom: '4px' }}>
                  <strong>{t('feedback.good')}</strong> {existingFeedback.whatWasGood}
                </div>
              )}
              {existingFeedback.whatNeedsImproving && (
                <div style={{ fontSize: '0.78rem', color: '#E65100' }}>
                  <strong>{t('feedback.improve')}</strong> {existingFeedback.whatNeedsImproving}
                </div>
              )}
              {existingFeedback.practitionerScore != null && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-secondary)', marginTop: '4px' }}>
                  <strong>Your Score:</strong> {existingFeedback.practitionerScore} (AI: {s.aiScore})
                </div>
              )}
              {existingFeedback.faultCorrections?.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#708E86', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Fault Corrections
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {existingFeedback.faultCorrections.map((c, i) => (
                      <span key={i} style={{
                        fontSize: '0.65rem', padding: '3px 8px', borderRadius: '50px',
                        background: c.verdict === 'agree' ? '#E8F5E9' : c.verdict === 'disagree' ? '#FFEBEE' : '#FFF8E1',
                        color: c.verdict === 'agree' ? '#2E7D32' : c.verdict === 'disagree' ? '#C62828' : '#F57F17',
                        fontWeight: 600,
                      }}>
                        {c.verdict === 'agree' ? '✓' : c.verdict === 'disagree' ? '✗' : '~'} {c.faultName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback form */}
          {feedbackMode ? (
            <div style={{ background: 'var(--color-bg-alt)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)' }}>
                {t('feedback.title')}
              </div>

              {/* Star rating */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                  {t('feedback.rating')}
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setRating(i)} style={{
                      background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                    }}>
                      <Star size={24} fill={i <= rating ? '#F59E0B' : 'none'} color={i <= rating ? '#F59E0B' : '#D1D5DB'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Practitioner's score override */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                  Your Score (AI gave {s.aiScore})
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range" min="0" max="100"
                    value={scoreOverride ?? s.aiScore ?? 50}
                    onChange={e => setScoreOverride(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{
                    fontSize: '1.1rem', fontWeight: 700, minWidth: '36px', textAlign: 'center',
                    color: (scoreOverride ?? s.aiScore) >= 80 ? '#2E7D32' : (scoreOverride ?? s.aiScore) >= 60 ? '#F57F17' : '#C62828',
                  }}>
                    {scoreOverride ?? s.aiScore ?? '—'}
                  </span>
                </div>
              </div>

              {/* Fault corrections — AI retraining data */}
              {analysis?.faults?.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                    Do you agree with the AI's detected issues?
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {analysis.faults.map(f => {
                      const verdict = faultCorrections[f.id];
                      return (
                        <div key={f.id} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 10px', borderRadius: '8px',
                          background: verdict === 'agree' ? '#E8F5E9' : verdict === 'disagree' ? '#FFEBEE' : verdict === 'partial' ? '#FFF8E1' : 'white',
                          border: '1px solid var(--color-border)',
                          transition: 'all 0.2s',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{f.name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text)' }}>{f.severity} severity</div>
                          </div>
                          {['agree', 'partial', 'disagree'].map(v => (
                            <button
                              key={v}
                              onClick={() => setFaultCorrections(prev => ({ ...prev, [f.id]: prev[f.id] === v ? undefined : v }))}
                              style={{
                                padding: '4px 8px', borderRadius: '6px', border: 'none',
                                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                                cursor: 'pointer', transition: 'all 0.15s',
                                background: verdict === v
                                  ? (v === 'agree' ? '#4CAF50' : v === 'disagree' ? '#EF5350' : '#FFC107')
                                  : '#f0f0f0',
                                color: verdict === v ? 'white' : '#888',
                              }}
                            >
                              {v === 'agree' ? '✓ Yes' : v === 'disagree' ? '✗ No' : '~ Partial'}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#2E7D32', display: 'block', marginBottom: '4px' }}>
                  {t('feedback.whatGood')}
                </label>
                <textarea value={whatGood} onChange={e => setWhatGood(e.target.value)}
                  placeholder={t('feedback.whatGoodPlaceholder')}
                  rows={2} style={{ fontSize: '0.82rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#E65100', display: 'block', marginBottom: '4px' }}>
                  {t('feedback.whatImprove')}
                </label>
                <textarea value={whatImprove} onChange={e => setWhatImprove(e.target.value)}
                  placeholder={t('feedback.whatImprovePlaceholder')}
                  rows={2} style={{ fontSize: '0.82rem' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={submitFeedback} disabled={submitting} style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  background: submitting ? '#aaa' : 'var(--color-secondary)', color: 'white',
                  border: 'none', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: submitting ? 'default' : 'pointer',
                }}>
                  <Send size={13} /> {submitting ? t('feedback.sending') : t('feedback.submitFeedback')}
                </button>
                <button onClick={() => setFeedbackMode(false)} style={{
                  padding: '10px 16px', borderRadius: '10px',
                  background: 'white', color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : !submitted ? (
            <button onClick={() => setFeedbackMode(true)} style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              background: 'var(--color-accent)', color: 'white',
              border: 'none', fontSize: '0.72rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '1px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              cursor: 'pointer',
            }}>
              <MessageSquare size={14} /> {t('feedback.giveFeedback')}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, value, label }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.12)', borderRadius: '12px',
      padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: 'rgba(255,255,255,0.6)' }}>{icon}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{value}</div>
      <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.45)' }}>{label}</div>
    </div>
  );
}
