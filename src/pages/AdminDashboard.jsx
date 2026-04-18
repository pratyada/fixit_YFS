import { useState, useEffect, useMemo } from 'react';
import { Users, Shield, Stethoscope, User, ChevronDown, ChevronUp, Search, RefreshCw, Camera, TrendingUp, Award, Calendar } from 'lucide-react';
import { getAllUsers, updateUserRole, updateUserRoles, assignPatientToPractitioner, getKioskSessions } from '../lib/firestore';

const ROLES = ['admin', 'practitioner', 'patient'];
const ROLE_COLORS = {
  admin: { bg: '#EDE7F6', color: '#5E35B1', icon: Shield },
  practitioner: { bg: '#E8F5E9', color: '#2E7D32', icon: Stethoscope },
  patient: { bg: '#E3F2FD', color: '#1565C0', icon: User },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('users'); // 'users' | 'kiosk'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [expandedUser, setExpandedUser] = useState(null);

  // Kiosk state
  const [kioskSessions, setKioskSessions] = useState([]);
  const [kioskLoading, setKioskLoading] = useState(false);

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

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (tab === 'kiosk' && kioskSessions.length === 0) loadKiosk(); }, [tab]);

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

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #5E35B1 0%, #4E4E53 100%)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
          Admin Panel
        </div>
        <h2 style={{ color: 'white', marginBottom: '16px' }}>
          {tab === 'users' ? 'User Management' : 'Clinic Kiosk Log'}
        </h2>
        {tab === 'users' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Total', value: counts.total, icon: Users },
              { label: 'Admins', value: counts.admin, icon: Shield },
              { label: 'Practitioners', value: counts.practitioner, icon: Stethoscope },
              { label: 'Patients', value: counts.patient, icon: User },
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
              { label: 'Total Checks', value: kioskStats.total, icon: Camera },
              { label: 'Today', value: kioskStats.todayCount, icon: Calendar },
              { label: 'Avg Score', value: kioskStats.avgScore, icon: TrendingUp },
              { label: 'Top Exercise', value: kioskStats.topExercise?.[1] || 0, icon: Award },
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
          { key: 'users', label: 'Users', icon: Users },
          { key: 'kiosk', label: 'Kiosk Log', icon: Camera },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '9px 14px', borderRadius: '50px', border: 'none',
              background: tab === t.key ? 'var(--color-secondary)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--color-text)',
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              transition: 'all 0.2s',
            }}
          >
            <t.icon size={13} /> {t.label}
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
              Most popular: <strong>{kioskStats.topExercise[0]}</strong> ({kioskStats.topExercise[1]} checks)
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
              Loading kiosk data...
            </div>
          ) : kioskSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
              <Camera size={32} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--color-border)' }} />
              No kiosk sessions yet. Set up the iPad in the clinic to start collecting data.
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
                            {date.toLocaleDateString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
                        {s.score >= 80 ? 'Excellent' : s.score >= 60 ? 'Good' : s.score >= 40 ? 'Needs Work' : 'Poor'}
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
                        <span style={{ fontWeight: 600 }}>Issues: </span>
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

      {tab === 'users' && <>
      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
          />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 'auto', fontSize: '0.82rem' }}>
          <option value="all">All Roles</option>
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
          Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
          No users found
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
                      {u.name || 'No name'}
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
                        Roles (select multiple)
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
                          This user will choose their view on login
                        </div>
                      )}
                    </div>

                    {/* Assign to practitioner (for patients) */}
                    {u.role === 'patient' && practitioners.length > 0 && (
                      <div>
                        <label style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', display: 'block', marginBottom: '6px' }}>
                          Assigned Practitioner
                        </label>
                        <select
                          value={u.practitionerId || ''}
                          onChange={e => handleAssignPractitioner(u.id, e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="">Unassigned</option>
                          {practitioners.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div><strong>UID:</strong> {u.id}</div>
                      {u.condition && <div><strong>Condition:</strong> {u.condition}</div>}
                      {assignedPract && <div><strong>Practitioner:</strong> {assignedPract.name}</div>}
                      {u.createdAt && <div><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</div>}
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
