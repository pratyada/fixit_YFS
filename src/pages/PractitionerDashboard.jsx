import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ChevronRight, Activity, Heart, Dumbbell, Video, Clock, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatientsByPractitioner, getPatientSessions, getPainEntries } from '../lib/firestore';
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

  useEffect(() => {
    if (user) {
      getPatientsByPractitioner(user.uid).then(p => {
        setPatients(p);
        setLoading(false);
      });
    }
  }, [user]);

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
            {/* Sessions */}
            <div>
              <h3 style={{ marginBottom: '10px' }}>Recording Sessions</h3>
              {patientSessions.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '24px', textAlign: 'center', color: 'var(--color-text)', fontSize: '0.85rem' }}>
                  No recordings yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patientSessions.map(s => {
                    const ex = EXERCISE_LIBRARY.find(e => e.id === s.exerciseId);
                    return (
                      <div key={s.id} style={{
                        background: 'white', borderRadius: '14px',
                        border: '1px solid var(--color-border)', padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                            {ex?.name || s.exerciseName || s.exerciseId}
                          </div>
                          {s.aiScore && (
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700,
                              padding: '3px 10px', borderRadius: '50px',
                              background: s.aiScore >= 80 ? '#E8F5E9' : s.aiScore >= 60 ? '#FFF8E1' : '#FFEBEE',
                              color: s.aiScore >= 80 ? '#2E7D32' : s.aiScore >= 60 ? '#F57F17' : '#C62828',
                            }}>
                              Score: {Math.round(s.aiScore)}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
                          {s.status} &bull; {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : 'Recent'}
                        </div>
                        {s.aiSummary && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '6px', fontStyle: 'italic' }}>
                            {s.aiSummary}
                          </div>
                        )}
                        {s.frontVideoUrl && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {s.frontVideoUrl && (
                              <a href={s.frontVideoUrl} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                                color: 'var(--color-accent)',
                              }}>
                                Front Video
                              </a>
                            )}
                            {s.sideVideoUrl && (
                              <a href={s.sideVideoUrl} target="_blank" rel="noopener noreferrer" style={{
                                fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                                color: 'var(--color-accent)',
                              }}>
                                Side Video
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." style={{ paddingLeft: '34px', fontSize: '0.82rem' }} />
      </div>

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
