import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ChevronRight, Activity, Heart, Dumbbell, Video, Clock, Star, ChevronDown, ChevronUp, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatientsByPractitioner, getPatientSessions, getPainEntries, addFeedback, updateSession, getFeedbackForSession, getUsersByRole, assignPatientToPractitioner } from '../lib/firestore';
import { EXERCISE_LIBRARY } from '../data/exercises';

export default function PractitionerDashboard() {
  const { user, session } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSessions, setPatientSessions] = useState([]);
  const [patientPain, setPatientPain] = useState([]);
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
    const [sessions, pain] = await Promise.all([
      getPatientSessions(patient.id),
      getPainEntries(patient.id),
    ]);
    setPatientSessions(sessions);
    setPatientPain(pain);
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
          ← Back to patients
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
                {selectedPatient.condition || 'No condition set'} &bull; {selectedPatient.email}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <StatBox icon={<Video size={14} />} value={patientSessions.length} label="Sessions" />
            <StatBox icon={<Heart size={14} />} value={patientPain.length} label="Pain Logs" />
            <StatBox icon={<Star size={14} />} value={patientSessions.filter(s => s.aiScore).length} label="Analyzed" />
          </div>
        </div>

        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text)' }}>Loading...</div>
        ) : (
          <>
            {/* Sessions with feedback */}
            <div>
              <h3 style={{ marginBottom: '10px' }}>
                Pose Check Sessions ({patientSessions.length})
              </h3>
              {patientSessions.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '24px', textAlign: 'center', color: 'var(--color-text)', fontSize: '0.85rem' }}>
                  No recordings yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patientSessions.map(s => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      patient={selectedPatient}
                      practitionerId={user.uid}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pain entries */}
            <div>
              <h3 style={{ marginBottom: '10px' }}>Pain Journal</h3>
              {patientPain.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '24px', textAlign: 'center', color: 'var(--color-text)', fontSize: '0.85rem' }}>
                  No pain entries yet
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
          Practitioner
        </div>
        <h2 style={{ color: 'white', marginBottom: '4px' }}>
          Welcome, {session?.name}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
          {patients.length} patient{patients.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." style={{ paddingLeft: '34px', fontSize: '0.82rem' }} />
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
            <h4>Add Patient</h4>
            <button onClick={() => setShowAddPatient(false)} style={{
              background: 'none', border: 'none', color: 'var(--color-text)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}>Close</button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
            <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Search all patients..." style={{ paddingLeft: '34px', fontSize: '0.82rem' }} />
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
                          {isAssigned && ' (assigned to another)'}
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
                  No patients found. Patients need to sign in first.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)' }}>Loading patients...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <Users size={32} color="var(--color-border)" style={{ margin: '0 auto 12px' }} />
          <h4>No patients yet</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginTop: '4px' }}>
            Ask your admin to assign patients to you
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
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{p.name || 'Unnamed'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>{p.condition || 'No condition'}</div>
              </div>
              <ChevronRight size={16} color="var(--color-border)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session: s, patient, practitionerId }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [rating, setRating] = useState(3);
  const [whatGood, setWhatGood] = useState('');
  const [whatImprove, setWhatImprove] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(s.status === 'REVIEWED');
  const [existingFeedback, setExistingFeedback] = useState(null);

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
        aiModelVersionSnapshot: s.aiModelVersion || 'movenet-lightning-v1',
      });
      await updateSession(patient.id, s.id, { status: 'REVIEWED' });
      setSubmitted(true);
      setFeedbackMode(false);
      setExistingFeedback({ rating, whatWasGood: whatGood, whatNeedsImproving: whatImprove });
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
            {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recent'}
            {s.type === 'pose_check' && ' • Pose Check'}
            {submitted && ' • Reviewed'}
          </div>
        </div>
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
              {/* Categories */}
              {analysis.categories && (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', marginBottom: '8px' }}>
                    Score Breakdown
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {analysis.categories.map(cat => (
                      <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem' }}>{cat.icon}</span>
                        <span style={{ fontSize: '0.78rem', flex: 1, color: 'var(--color-secondary)' }}>{cat.name}</span>
                        <div style={{ width: '60px', height: '6px', background: 'var(--color-bg-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cat.score}%`, background: scoreColor(cat.score), borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor(cat.score), width: '28px', textAlign: 'right' }}>{cat.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Faults */}
              {analysis.faults?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', marginBottom: '8px' }}>
                    Form Issues
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
                    Joint Angles
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

          {/* Video links */}
          {(s.frontVideoUrl || s.sideVideoUrl) && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {s.frontVideoUrl && (
                <a href={s.frontVideoUrl} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                  color: 'var(--color-accent)', padding: '6px 12px', background: 'var(--color-bg-alt)', borderRadius: '6px',
                }}>Front Video</a>
              )}
              {s.sideVideoUrl && (
                <a href={s.sideVideoUrl} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                  color: 'var(--color-accent)', padding: '6px 12px', background: 'var(--color-bg-alt)', borderRadius: '6px',
                }}>Side Video</a>
              )}
            </div>
          )}

          {/* Existing feedback display */}
          {existingFeedback && !feedbackMode && (
            <div style={{ background: '#EDF3F1', borderRadius: '10px', padding: '14px', border: '1px solid #D8E8E3' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#708E86', marginBottom: '8px' }}>
                Your Feedback
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} fill={i <= existingFeedback.rating ? '#F59E0B' : 'none'} color={i <= existingFeedback.rating ? '#F59E0B' : '#D1D5DB'} />
                ))}
              </div>
              {existingFeedback.whatWasGood && (
                <div style={{ fontSize: '0.78rem', color: '#2E7D32', marginBottom: '4px' }}>
                  <strong>Good:</strong> {existingFeedback.whatWasGood}
                </div>
              )}
              {existingFeedback.whatNeedsImproving && (
                <div style={{ fontSize: '0.78rem', color: '#E65100' }}>
                  <strong>Improve:</strong> {existingFeedback.whatNeedsImproving}
                </div>
              )}
            </div>
          )}

          {/* Feedback form */}
          {feedbackMode ? (
            <div style={{ background: 'var(--color-bg-alt)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)' }}>
                Submit Feedback
              </div>

              {/* Star rating */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'block', marginBottom: '6px' }}>
                  Rating (how accurate was the AI?)
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

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#2E7D32', display: 'block', marginBottom: '4px' }}>
                  What was good?
                </label>
                <textarea value={whatGood} onChange={e => setWhatGood(e.target.value)}
                  placeholder="e.g., Good depth on squats, knees tracking well..."
                  rows={2} style={{ fontSize: '0.82rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#E65100', display: 'block', marginBottom: '4px' }}>
                  What needs improving?
                </label>
                <textarea value={whatImprove} onChange={e => setWhatImprove(e.target.value)}
                  placeholder="e.g., Lower back rounding at the bottom, knee valgus on rep 3..."
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
                  <Send size={13} /> {submitting ? 'Sending...' : 'Submit Feedback'}
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
              <MessageSquare size={14} /> Give Feedback
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
