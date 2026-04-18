import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, Stethoscope, User, ChevronDown, ChevronUp, Search, RefreshCw, Camera, TrendingUp, Award, Calendar, Brain, Download, Star } from 'lucide-react';
import { getAllUsers, updateUserRole, updateUserRoles, assignPatientToPractitioner, getKioskSessions, getAllFeedback } from '../lib/firestore';

const ROLES = ['admin', 'practitioner', 'patient'];
const ROLE_COLORS = {
  admin: { bg: '#EDE7F6', color: '#5E35B1', icon: Shield },
  practitioner: { bg: '#E8F5E9', color: '#2E7D32', icon: Stethoscope },
  patient: { bg: '#E3F2FD', color: '#1565C0', icon: User },
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation('admin');
  const [tab, setTab] = useState('users'); // 'users' | 'kiosk' | 'aiTraining'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [expandedUser, setExpandedUser] = useState(null);

  // Kiosk state
  const [kioskSessions, setKioskSessions] = useState([]);
  const [kioskLoading, setKioskLoading] = useState(false);

  // AI Training state
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const all = await getAllUsers();
    setUsers(all);
    setLoading(false);
  };

  const loadKiosk = async () => {
    setKioskLoading(true);
    const sessions = await getKioskSessions(200);
    setKioskSessions(sessions);
    setKioskLoading(false);
  };

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    const data = await getAllFeedback(500);
    setFeedbackData(data);
    setFeedbackLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (tab === 'kiosk' && kioskSessions.length === 0) loadKiosk(); }, [tab]);
  useEffect(() => { if (tab === 'aiTraining' && feedbackData.length === 0) loadFeedback(); }, [tab]);

  const handleRoleChange = async (uid, newRole) => {
    await updateUserRole(uid, newRole);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
  };

  const handleToggleRole = async (uid, toggledRole) => {
    const user = users.find(u => u.id === uid);
    const currentRoles = user?.roles && Array.isArray(user.roles) ? [...user.roles] : [user?.role || 'patient'];
    let newRoles;
    if (currentRoles.includes(toggledRole)) {
      // Remove role (but must keep at least one)
      newRoles = currentRoles.filter(r => r !== toggledRole);
      if (newRoles.length === 0) return; // can't remove last role
    } else {
      newRoles = [...currentRoles, toggledRole];
    }
    await updateUserRoles(uid, newRoles);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, roles: newRoles, role: newRoles[0] } : u));
  };

  const handleAssignPractitioner = async (patientId, practitionerId) => {
    await assignPatientToPractitioner(patientId, practitionerId);
    setUsers(prev => prev.map(u => u.id === patientId ? { ...u, practitionerId } : u));
  };

  const getUserRoles = (u) => (u?.roles && Array.isArray(u.roles) && u.roles.length > 0) ? u.roles : [u?.role || 'patient'];
  const practitioners = users.filter(u => getUserRoles(u).includes('practitioner'));
  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const roles = getUserRoles(u);
    const matchRole = filterRole === 'all' || roles.includes(filterRole);
    return matchSearch && matchRole;
  });

  const counts = {
    total: users.length,
    admin: users.filter(u => getUserRoles(u).includes('admin')).length,
    practitioner: users.filter(u => getUserRoles(u).includes('practitioner')).length,
    patient: users.filter(u => getUserRoles(u).includes('patient')).length,
  };

  // ─── Kiosk stats ───
  const kioskStats = useMemo(() => {
    const total = kioskSessions.length;
    const avgScore = total ? Math.round(kioskSessions.reduce((a, s) => a + (s.score || 0), 0) / total) : 0;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = kioskSessions.filter(s => {
      const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return d.toISOString().split('T')[0] === today;
    }).length;
    const exercises = {};
    kioskSessions.forEach(s => { exercises[s.exerciseName] = (exercises[s.exerciseName] || 0) + 1; });
    const topExercise = Object.entries(exercises).sort((a, b) => b[1] - a[1])[0];
    return { total, avgScore, todayCount, topExercise };
  }, [kioskSessions]);

  // AI Training stats
  const aiStats = useMemo(() => {
    const total = feedbackData.length;
    if (!total) return { total: 0, avgRating: 0, avgDelta: 0, agreePct: 0, corrections: 0 };
    const avgRating = (feedbackData.reduce((a, f) => a + (f.rating || 0), 0) / total).toFixed(1);
    const withScoreOverride = feedbackData.filter(f => f.practitionerScore != null && f.aiScore != null);
    const avgDelta = withScoreOverride.length
      ? Math.round(withScoreOverride.reduce((a, f) => a + Math.abs(f.practitionerScore - f.aiScore), 0) / withScoreOverride.length)
      : '—';
    const allCorrections = feedbackData.flatMap(f => f.faultCorrections || []);
    const corrections = allCorrections.length;
    const agrees = allCorrections.filter(c => c.verdict === 'agree').length;
    const agreePct = corrections ? Math.round((agrees / corrections) * 100) : '—';
    return { total, avgRating, avgDelta, agreePct, corrections };
  }, [feedbackData]);

  const exportTrainingData = () => {
    const rows = feedbackData.map(f => ({
      sessionId: f.sessionId,
      exerciseId: f.exerciseId,
      exerciseName: f.exerciseName,
      aiScore: f.aiScore,
      practitionerScore: f.practitionerScore,
      rating: f.rating,
      whatWasGood: f.whatWasGood,
      whatNeedsImproving: f.whatNeedsImproving,
      aiModelVersion: f.aiModelVersionSnapshot,
      faultCorrections: JSON.stringify(f.faultCorrections || []),
      aiCategories: JSON.stringify(f.aiCategories || []),
      aiFaults: JSON.stringify(f.aiFaults || []),
      aiAngles: JSON.stringify(f.aiAngles || null),
      createdAt: f.createdAt?.toDate ? f.createdAt.toDate().toISOString() : f.createdAt,
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fixit-training-data-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #5E35B1 0%, #4E4E53 100%)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
          {t('adminPanel')}
        </div>
        <h2 style={{ color: 'white', marginBottom: '16px' }}>
          {tab === 'users' ? t('userManagement') : tab === 'kiosk' ? t('clinicKioskLog') : 'AI Training Data'}
        </h2>
        {tab === 'aiTraining' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Feedback', value: aiStats.total, icon: Star },
              { label: 'Avg Rating', value: aiStats.avgRating, icon: Star },
              { label: 'Score Delta', value: aiStats.avgDelta, icon: TrendingUp },
              { label: 'AI Agree %', value: aiStats.agreePct, icon: Brain },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: '12px',
                padding: '12px 8px', textAlign: 'center',
              }}>
                <s.icon size={14} style={{ margin: '0 auto 4px', display: 'block', opacity: 0.6 }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        ) : tab === 'users' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: t('stats.total'), value: counts.total, icon: Users },
              { label: t('stats.admins'), value: counts.admin, icon: Shield },
              { label: t('stats.practitioners'), value: counts.practitioner, icon: Stethoscope },
              { label: t('stats.patients'), value: counts.patient, icon: User },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: '12px',
                padding: '12px 8px', textAlign: 'center',
              }}>
                <s.icon size={14} style={{ margin: '0 auto 4px', display: 'block', opacity: 0.6 }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: t('stats.totalChecks'), value: kioskStats.total, icon: Camera },
              { label: t('stats.today'), value: kioskStats.todayCount, icon: Calendar },
              { label: t('stats.avgScore'), value: kioskStats.avgScore, icon: TrendingUp },
              { label: t('stats.topExercise'), value: kioskStats.topExercise?.[1] || 0, icon: Award },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: '12px',
                padding: '12px 8px', textAlign: 'center',
              }}>
                <s.icon size={14} style={{ margin: '0 auto 4px', display: 'block', opacity: 0.6 }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--color-bg-alt)', borderRadius: '50px', padding: '4px', border: '1px solid var(--color-border)' }}>
        {[
          { key: 'users', label: t('tabs.users'), icon: Users },
          { key: 'kiosk', label: t('tabs.kioskLog'), icon: Camera },
          { key: 'aiTraining', label: 'AI Training', icon: Brain },
        ].map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              flex: 1, padding: '9px 14px', borderRadius: '50px', border: 'none',
              background: tab === tb.key ? 'var(--color-secondary)' : 'transparent',
              color: tab === tb.key ? 'white' : 'var(--color-text)',
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              transition: 'all 0.2s',
            }}
          >
            <tb.icon size={13} /> {tb.label}
          </button>
        ))}
      </div>

      {tab === 'kiosk' && (
        <>
          {/* Kiosk top exercise */}
          {kioskStats.topExercise && (
            <div style={{
              background: '#EDF3F1', borderRadius: '12px', padding: '12px 16px',
              border: '1px solid #D8E8E3', fontSize: '0.78rem', color: '#4E4E53',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Award size={14} color="#708E86" />
              {t('kiosk.mostPopular', { name: kioskStats.topExercise[0], count: kioskStats.topExercise[1] })}
            </div>
          )}

          {/* Refresh */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={loadKiosk} style={{
              background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
              borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer',
            }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* Kiosk Session List */}
          {kioskLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
              {t('kiosk.loadingKiosk')}
            </div>
          ) : kioskSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
              <Camera size={32} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--color-border)' }} />
              {t('kiosk.noKioskSessions')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {kioskSessions.map((s, i) => {
                const scoreColor = s.score >= 80 ? '#4CAF50' : s.score >= 60 ? '#FFC107' : s.score >= 40 ? '#FF9800' : '#F44336';
                const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
                const faultNames = s.faults?.map(f => f.name).join(', ') || 'None';
                return (
                  <div key={s.id || i} style={{
                    background: 'white', borderRadius: '14px',
                    border: '1px solid var(--color-border)', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: scoreColor + '18', color: scoreColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '1rem',
                        }}>
                          {s.score}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                            {s.exerciseName}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text)' }}>
                            {date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            {s.duration ? ` \u2022 ${s.duration}s` : ''}
                            {s.totalFrames ? ` \u2022 ${s.totalFrames} frames` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.8px', padding: '4px 10px', borderRadius: '50px',
                        background: scoreColor + '18', color: scoreColor,
                      }}>
                        {s.score >= 80 ? t('kiosk.excellent') : s.score >= 60 ? t('kiosk.good') : s.score >= 40 ? t('kiosk.needsWork') : t('kiosk.poor')}
                      </div>
                    </div>
                    {/* Score breakdown mini */}
                    {s.categories && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {s.categories.map(cat => (
                          <span key={cat.name} style={{
                            fontSize: '0.6rem', padding: '2px 8px', borderRadius: '50px',
                            background: 'var(--color-bg-alt)', color: 'var(--color-text)',
                          }}>
                            {cat.icon} {cat.name}: <strong>{cat.score}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Faults */}
                    {s.faults?.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                        <span style={{ fontWeight: 600 }}>{t('kiosk.issues')} </span>
                        {s.faults.map((f, j) => (
                          <span key={j} style={{
                            color: f.severity === 'high' ? '#C62828' : f.severity === 'moderate' ? '#E65100' : '#2E7D32',
                          }}>
                            {f.name}{j < s.faults.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'aiTraining' && (
        <>
          {/* Export + Refresh */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text)' }}>
              {aiStats.total} feedback entries &bull; {aiStats.corrections} fault corrections
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={exportTrainingData} disabled={feedbackData.length === 0} style={{
                background: '#5E35B1', color: 'white', border: 'none',
                borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', opacity: feedbackData.length ? 1 : 0.5,
              }}>
                <Download size={13} /> Export CSV
              </button>
              <button onClick={loadFeedback} style={{
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                borderRadius: '10px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <RefreshCw size={13} color="var(--color-text)" />
              </button>
            </div>
          </div>

          {/* Info box */}
          <div style={{
            background: '#EDE7F6', borderRadius: '12px', padding: '14px 16px',
            border: '1px solid #D1C4E9', fontSize: '0.78rem', color: '#4E4E53',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <Brain size={16} color="#5E35B1" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>How AI retraining works:</strong> When practitioners review sessions, they rate the AI's accuracy, provide a corrected score, and agree/disagree with each detected fault. This data is exported as CSV and used to calibrate the movement analysis scoring model.
            </div>
          </div>

          {/* Feedback list */}
          {feedbackLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
              Loading training data...
            </div>
          ) : feedbackData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
              <Brain size={32} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--color-border)' }} />
              No practitioner feedback yet. Feedback creates training data for AI improvement.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feedbackData.map((f, i) => {
                const delta = f.practitionerScore != null && f.aiScore != null
                  ? f.practitionerScore - f.aiScore : null;
                const date = f.createdAt?.toDate ? f.createdAt.toDate() : new Date(f.createdAt);
                return (
                  <div key={f.id || i} style={{
                    background: 'white', borderRadius: '14px',
                    border: '1px solid var(--color-border)', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                          {f.exerciseName}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text)' }}>
                          {date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {[1,2,3,4,5].map(j => (
                          <Star key={j} size={12} fill={j <= f.rating ? '#F59E0B' : 'none'} color={j <= f.rating ? '#F59E0B' : '#D1D5DB'} />
                        ))}
                      </div>
                    </div>

                    {/* Score comparison */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{
                        flex: 1, background: 'var(--color-bg-alt)', borderRadius: '8px', padding: '8px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '2px' }}>AI Score</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{f.aiScore ?? '—'}</div>
                      </div>
                      {f.practitionerScore != null && (
                        <div style={{
                          flex: 1, background: 'var(--color-bg-alt)', borderRadius: '8px', padding: '8px', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '2px' }}>Practitioner</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{f.practitionerScore}</div>
                        </div>
                      )}
                      {delta != null && (
                        <div style={{
                          flex: 1, background: Math.abs(delta) <= 10 ? '#E8F5E9' : Math.abs(delta) <= 20 ? '#FFF8E1' : '#FFEBEE',
                          borderRadius: '8px', padding: '8px', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '2px' }}>Delta</div>
                          <div style={{
                            fontSize: '1.1rem', fontWeight: 700,
                            color: Math.abs(delta) <= 10 ? '#2E7D32' : Math.abs(delta) <= 20 ? '#F57F17' : '#C62828',
                          }}>
                            {delta > 0 ? '+' : ''}{delta}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fault corrections */}
                    {f.faultCorrections?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {f.faultCorrections.map((c, j) => (
                          <span key={j} style={{
                            fontSize: '0.6rem', padding: '3px 8px', borderRadius: '50px', fontWeight: 600,
                            background: c.verdict === 'agree' ? '#E8F5E9' : c.verdict === 'disagree' ? '#FFEBEE' : '#FFF8E1',
                            color: c.verdict === 'agree' ? '#2E7D32' : c.verdict === 'disagree' ? '#C62828' : '#F57F17',
                          }}>
                            {c.verdict === 'agree' ? '✓' : c.verdict === 'disagree' ? '✗' : '~'} {c.faultName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Text feedback */}
                    {(f.whatWasGood || f.whatNeedsImproving) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text)' }}>
                        {f.whatWasGood && <div><span style={{ color: '#2E7D32', fontWeight: 600 }}>Good:</span> {f.whatWasGood}</div>}
                        {f.whatNeedsImproving && <div><span style={{ color: '#E65100', fontWeight: 600 }}>Improve:</span> {f.whatNeedsImproving}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'users' && <>
      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('searchUsers')}
            style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
          />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 'auto', fontSize: '0.82rem' }}>
          <option value="all">{t('allRoles')}</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <button onClick={loadUsers} style={{
          background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
          borderRadius: '12px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RefreshCw size={14} color="var(--color-text)" />
        </button>
      </div>

      {/* User List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
          {t('loadingUsers')}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
          {t('noUsersFound')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(u => {
            const roles = getUserRoles(u);
            const primaryRole = roles[0] || 'patient';
            const rc = ROLE_COLORS[primaryRole] || ROLE_COLORS.patient;
            const RoleIcon = rc.icon;
            const isExpanded = expandedUser === u.id;
            const assignedPract = practitioners.find(p => p.id === u.practitionerId);

            return (
              <div key={u.id} style={{
                background: 'white', borderRadius: '14px',
                border: `1px solid ${isExpanded ? 'var(--color-accent)' : 'var(--color-border)'}`,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', background: 'none', border: 'none', textAlign: 'left',
                  }}
                >
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: rc.bg, color: rc.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <RoleIcon size={16} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                      {u.name || t('noName')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {roles.map(r => {
                      const rrc = ROLE_COLORS[r] || ROLE_COLORS.patient;
                      return (
                        <span key={r} style={{
                          fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
                          padding: '3px 7px', borderRadius: '50px',
                          background: rrc.bg, color: rrc.color,
                        }}>
                          {r}
                        </span>
                      );
                    })}
                  </div>
                  {isExpanded ? <ChevronUp size={14} color="var(--color-text)" /> : <ChevronDown size={14} color="var(--color-text)" />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Role changer (multi-select) */}
                    <div>
                      <label style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', display: 'block', marginBottom: '6px' }}>
                        {t('roles.selectMultiple')}
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {ROLES.map(r => {
                          const isActive = roles.includes(r);
                          const isLastRole = isActive && roles.length === 1;
                          return (
                            <button
                              key={r}
                              onClick={() => handleToggleRole(u.id, r)}
                              disabled={isLastRole}
                              style={{
                                flex: 1, padding: '8px', borderRadius: '8px',
                                fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                                border: `1.5px solid ${isActive ? ROLE_COLORS[r].color : 'var(--color-border)'}`,
                                background: isActive ? ROLE_COLORS[r].bg : 'white',
                                color: isActive ? ROLE_COLORS[r].color : 'var(--color-text)',
                                cursor: isLastRole ? 'not-allowed' : 'pointer',
                                opacity: isLastRole ? 0.6 : 1,
                                transition: 'all 0.2s',
                                position: 'relative',
                              }}
                            >
                              {isActive && <span style={{ marginRight: '2px' }}>&#10003;</span>}
                              {r}
                            </button>
                          );
                        })}
                      </div>
                      {roles.length > 1 && (
                        <div style={{ fontSize: '0.62rem', color: 'var(--color-text)', marginTop: '4px' }}>
                          {t('roles.chooseOnLogin')}
                        </div>
                      )}
                    </div>

                    {/* Assign to practitioner (for patients) */}
                    {u.role === 'patient' && practitioners.length > 0 && (
                      <div>
                        <label style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', display: 'block', marginBottom: '6px' }}>
                          {t('assignedPractitioner')}
                        </label>
                        <select
                          value={u.practitionerId || ''}
                          onChange={e => handleAssignPractitioner(u.id, e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="">{t('unassigned')}</option>
                          {practitioners.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div><strong>{t('uid')}</strong> {u.id}</div>
                      {u.condition && <div><strong>{t('condition')}</strong> {u.condition}</div>}
                      {assignedPract && <div><strong>{t('practitioner')}</strong> {assignedPract.name}</div>}
                      {u.createdAt && <div><strong>{t('joined')}</strong> {new Date(u.createdAt).toLocaleDateString(i18n.language)}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>}
    </div>
  );
}
