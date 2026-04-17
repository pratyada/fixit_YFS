import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, TrendingUp, TrendingDown, Activity, Heart, AlertCircle, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatientsByPractitioner, addPatient } from '../data/users';
import { load } from '../utils/storage';
import { PROTOCOLS } from '../data/protocols';
import { PAIN_SCALE, EXERCISE_LIBRARY } from '../data/exercises';

export default function PractitionerDashboard() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const patients = useMemo(() =>
    getPatientsByPractitioner(session.userId),
    [session.userId, refreshKey]
  );

  // Compute stats per patient
  const patientStats = useMemo(() => {
    return patients.map(p => {
      const sessions = load(`patient_${p.id}_completed_sessions`, []);
      const painEntries = load(`patient_${p.id}_pain_entries`, []);
      const assigned = load(`patient_${p.id}_assigned_programs`, []);

      // Adherence: % of last 7 days with at least 1 session
      const last7Days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
      }
      const daysActive = last7Days.filter(d => sessions.some(s => s.date === d)).length;
      const adherence = Math.round((daysActive / 7) * 100);

      const lastPain = painEntries[painEntries.length - 1];
      const previousPain = painEntries[painEntries.length - 2];
      const painTrend = (lastPain && previousPain)
        ? lastPain.level - previousPain.level
        : null;

      const program = assigned[0] ? PROTOCOLS.find(pr => pr.id === assigned[0].protocolId) : null;

      const lastActiveDate = sessions.length > 0 ? sessions[sessions.length - 1].date : null;
      const daysSinceLastActive = lastActiveDate
        ? Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / (24 * 60 * 60 * 1000))
        : null;

      return {
        ...p,
        adherence,
        daysActive,
        totalSessions: sessions.length,
        lastPain,
        painTrend,
        program,
        lastActiveDate,
        daysSinceLastActive,
        needsAttention: (lastPain && lastPain.level >= 6) || (daysSinceLastActive != null && daysSinceLastActive > 3),
      };
    });
  }, [patients]);

  const filtered = patientStats.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase())
  );

  // Aggregate stats
  const totalPatients = patientStats.length;
  const avgAdherence = totalPatients > 0
    ? Math.round(patientStats.reduce((s, p) => s + p.adherence, 0) / totalPatients)
    : 0;
  const needAttention = patientStats.filter(p => p.needsAttention).length;
  const activeToday = patientStats.filter(p => {
    const sessions = load(`patient_${p.id}_completed_sessions`, []);
    return sessions.some(s => s.date === new Date().toISOString().split('T')[0]);
  }).length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
          {session.name}
        </div>
        <h1 style={{ color: 'white', marginBottom: '4px' }}>Patient Caseload</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Monitor adherence, pain trends, and progress across all your patients
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <Stat icon={<Users size={16} />} value={totalPatients} label="Patients" />
          <Stat icon={<Activity size={16} />} value={`${avgAdherence}%`} label="Avg Adherence" />
          <Stat icon={<Heart size={16} />} value={activeToday} label="Active Today" />
          <Stat icon={<AlertCircle size={16} />} value={needAttention} label="Need Review" />
        </div>
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-border)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." style={{ paddingLeft: '36px' }} />
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'var(--color-secondary)', color: 'white',
          padding: '11px 16px', borderRadius: '12px', border: 'none',
          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <Plus size={14} /> Add Patient
        </button>
      </div>

      {/* Needs attention banner */}
      {needAttention > 0 && (
        <div style={{
          background: '#FFF3F0', borderRadius: '12px', padding: '12px 16px',
          border: '1px solid #FFCDD2', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <AlertCircle size={18} color="#C62828" />
          <div style={{ fontSize: '0.82rem', color: '#C62828' }}>
            <strong>{needAttention}</strong> patient{needAttention !== 1 ? 's' : ''} may need your attention — high pain or no recent activity
          </div>
        </div>
      )}

      {/* Patients */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>All Patients ({filtered.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text)' }}>
              No patients found. Click "Add Patient" to get started.
            </div>
          ) : filtered.map(p => (
            <PatientCard key={p.id} patient={p} />
          ))}
        </div>
      </div>

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); setRefreshKey(k => k + 1); }} practitionerId={session.userId} />}
    </div>
  );
}

function PatientCard({ patient: p }) {
  const adherenceColor = p.adherence >= 80 ? '#4CAF50' : p.adherence >= 50 ? '#FFC107' : '#F44336';
  const painColor = p.lastPain ? PAIN_SCALE[p.lastPain.level]?.color : '#888';

  return (
    <Link to={`/patients/${p.id}`} style={{
      background: 'white', borderRadius: '14px',
      border: `1px solid ${p.needsAttention ? '#FFCDD2' : 'var(--color-border)'}`,
      padding: '16px', textDecoration: 'none',
      display: 'flex', alignItems: 'center', gap: '14px',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'var(--color-bg-alt)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem', flexShrink: 0,
      }}>
        {p.avatar}
      </div>

      {/* Name + condition */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{p.name}</div>
          {p.needsAttention && (
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
              background: '#FFEBEE', color: '#C62828',
              padding: '2px 7px', borderRadius: '50px',
            }}>
              Review
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
          {p.condition} • Age {p.age}
          {p.program && ` • ${p.program.name}`}
        </div>
      </div>

      {/* Stats column */}
      <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
        <MiniStat
          label="Adherence"
          value={`${p.adherence}%`}
          color={adherenceColor}
        />
        <MiniStat
          label="Pain"
          value={p.lastPain ? `${p.lastPain.level}/10` : '—'}
          color={painColor}
          trend={p.painTrend}
        />
        <MiniStat
          label="Sessions"
          value={p.totalSessions}
          color="var(--color-text)"
        />
      </div>

      <ChevronRight size={16} color="var(--color-border)" style={{ flexShrink: 0 }} />
    </Link>
  );
}

function MiniStat({ label, value, color, trend }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '52px' }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
        {value}
        {trend != null && trend !== 0 && (
          trend < 0 ? <TrendingDown size={11} color="#4CAF50" /> : <TrendingUp size={11} color="#F44336" />
        )}
      </div>
      <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text)', marginTop: '3px' }}>
        {label}
      </div>
    </div>
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
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
        {label}
      </div>
    </div>
  );
}

function AddPatientModal({ onClose, onAdded, practitionerId }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('ACL Reconstruction');
  const [side, setSide] = useState('Right');

  const submit = () => {
    if (!name.trim() || !age) return;
    addPatient({
      name: name.trim(),
      age: Number(age),
      condition,
      side,
      practitionerId,
      surgeryDate: null,
    });
    onAdded();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3>Add New Patient</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <Label>Full Name</Label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px' }}>
            <div>
              <Label>Age</Label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="35" />
            </div>
            <div>
              <Label>Condition</Label>
              <select value={condition} onChange={e => setCondition(e.target.value)}>
                <option>ACL Reconstruction</option>
                <option>Meniscus Repair</option>
                <option>Patellofemoral Pain</option>
                <option>Rotator Cuff Repair</option>
                <option>Frozen Shoulder</option>
                <option>Low Back Pain</option>
                <option>Sciatica</option>
                <option>Ankle Sprain</option>
                <option>Plantar Fasciitis</option>
                <option>Tennis Elbow</option>
                <option>Neck Pain</option>
                <option>Hip Bursitis</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Affected Side</Label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Left', 'Right', 'Both', 'N/A'].map(s => (
                <button key={s} onClick={() => setSide(s)} style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${side === s ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: side === s ? 'var(--color-accent)' : 'white',
                  color: side === s ? 'white' : 'var(--color-text)',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={!name.trim() || !age} style={{
            padding: '12px', borderRadius: '10px', marginTop: '8px',
            background: name.trim() && age ? 'var(--color-secondary)' : '#ccc',
            color: 'white', border: 'none',
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
            cursor: name.trim() && age ? 'pointer' : 'default',
          }}>
            Add Patient
          </button>
        </div>
      </div>
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
