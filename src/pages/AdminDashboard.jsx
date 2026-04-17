import { useState, useEffect } from 'react';
import { Users, Shield, Stethoscope, User, ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import { getAllUsers, updateUserRole, assignPatientToPractitioner } from '../lib/firestore';

const ROLES = ['admin', 'practitioner', 'patient'];
const ROLE_COLORS = {
  admin: { bg: '#EDE7F6', color: '#5E35B1', icon: Shield },
  practitioner: { bg: '#E8F5E9', color: '#2E7D32', icon: Stethoscope },
  patient: { bg: '#E3F2FD', color: '#1565C0', icon: User },
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [expandedUser, setExpandedUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    const all = await getAllUsers();
    setUsers(all);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (uid, newRole) => {
    await updateUserRole(uid, newRole);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
  };

  const handleAssignPractitioner = async (patientId, practitionerId) => {
    await assignPatientToPractitioner(patientId, practitionerId);
    setUsers(prev => prev.map(u => u.id === patientId ? { ...u, practitionerId } : u));
  };

  const practitioners = users.filter(u => u.role === 'practitioner');
  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    practitioner: users.filter(u => u.role === 'practitioner').length,
    patient: users.filter(u => u.role === 'patient').length,
  };

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
        <h2 style={{ color: 'white', marginBottom: '16px' }}>User Management</h2>
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
      </div>

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
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.patient;
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
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                    padding: '4px 10px', borderRadius: '50px',
                    background: rc.bg, color: rc.color,
                  }}>
                    {u.role || 'patient'}
                  </span>
                  {isExpanded ? <ChevronUp size={14} color="var(--color-text)" /> : <ChevronDown size={14} color="var(--color-text)" />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Role changer */}
                    <div>
                      <label style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', display: 'block', marginBottom: '6px' }}>
                        Change Role
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {ROLES.map(r => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(u.id, r)}
                            style={{
                              flex: 1, padding: '8px', borderRadius: '8px',
                              fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                              border: `1.5px solid ${u.role === r ? ROLE_COLORS[r].color : 'var(--color-border)'}`,
                              background: u.role === r ? ROLE_COLORS[r].bg : 'white',
                              color: u.role === r ? ROLE_COLORS[r].color : 'var(--color-text)',
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
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
    </div>
  );
}
