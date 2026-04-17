import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Target, ChevronRight, CheckCircle2, Plus, Filter, Search } from 'lucide-react';
import { PROTOCOLS } from '../data/protocols';
import { BODY_PARTS } from '../data/exercises';
import { useLocalState } from '../hooks/useLocalState';
import { usePatientData } from '../hooks/usePatientData';

export default function Programs() {
  const [search, setSearch] = useState('');
  const [bodyFilter, setBodyFilter] = useState('All');
  const [assignedPrograms, setAssignedPrograms] = usePatientData('assigned_programs', []);
  const [customPrograms] = useLocalState('custom_programs', []);

  const allPrograms = [...PROTOCOLS, ...customPrograms];

  const filtered = allPrograms.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (bodyFilter !== 'All' && p.bodyPart !== bodyFilter) return false;
    return true;
  });

  const isAssigned = (id) => assignedPrograms.some(a => a.protocolId === id);

  const assignProgram = (protocol) => {
    if (isAssigned(protocol.id)) return;
    const assignment = {
      id: Date.now().toString(36),
      protocolId: protocol.id,
      isCustom: !PROTOCOLS.find(p => p.id === protocol.id),
      assignedDate: new Date().toISOString(),
      startDate: new Date().toISOString().split('T')[0],
      currentPhase: 0,
      status: 'active',
    };
    setAssignedPrograms(prev => [...prev, assignment]);
  };

  const grouped = {};
  filtered.forEach(p => {
    if (!grouped[p.bodyPart]) grouped[p.bodyPart] = [];
    grouped[p.bodyPart].push(p);
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Programs</h1>
          <p style={{ fontSize: '0.85rem' }}>Browse pre-built rehabilitation protocols or create your own</p>
        </div>
        <Link to="/builder" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--color-secondary)', color: 'white',
          padding: '10px 18px', borderRadius: '50px', textDecoration: 'none',
          fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px',
        }}>
          <Plus size={14} /> Create Custom
        </Link>
      </div>

      {/* Active programs */}
      {assignedPrograms.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #708E86, #4E4E53)',
          borderRadius: '16px', padding: '18px', color: 'white',
        }}>
          <h6 style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '10px' }}>Currently Assigned</h6>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignedPrograms.map(a => {
              const p = allPrograms.find(x => x.id === a.protocolId);
              if (!p) return null;
              return (
                <Link key={a.id} to={`/programs/${p.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'rgba(255,255,255,0.12)', borderRadius: '10px',
                  padding: '10px 14px', textDecoration: 'none', color: 'white',
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{p.icon || '📋'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                      Phase {a.currentPhase + 1} of {p.phases.length} — Started {new Date(a.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div style={{
        background: 'white', borderRadius: '14px',
        border: '1px solid var(--color-border)', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-border)' }} />
          <input type="text" placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={12} /> Body:
          </span>
          {['All', ...BODY_PARTS].map(bp => (
            <button key={bp} onClick={() => setBodyFilter(bp)} style={{
              fontSize: '0.7rem', padding: '5px 12px', borderRadius: '50px',
              border: `1.5px solid ${bodyFilter === bp ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: bodyFilter === bp ? 'var(--color-accent)' : 'white',
              color: bodyFilter === bp ? 'white' : 'var(--color-text)',
              fontFamily: "'Public Sans'", fontWeight: 500, cursor: 'pointer',
            }}>{bp}</button>
          ))}
        </div>
      </div>

      {/* Program list */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text)' }}>
          No programs found.
        </div>
      ) : (
        Object.entries(grouped).map(([bp, programs]) => (
          <div key={bp}>
            <h6 style={{ marginBottom: '10px' }}>{bp} Programs ({programs.length})</h6>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {programs.map(p => (
                <ProgramCard key={p.id} program={p} assigned={isAssigned(p.id)} onAssign={() => assignProgram(p)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProgramCard({ program, assigned, onAssign }) {
  const totalExercises = program.phases.reduce((sum, p) => sum + p.exercises.length, 0);

  return (
    <div style={{
      background: 'white', borderRadius: '14px',
      border: '1px solid var(--color-border)', padding: '18px',
      display: 'flex', flexDirection: 'column', gap: '12px',
      transition: 'all 0.25s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '12px',
          background: 'var(--color-bg-alt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', flexShrink: 0,
        }}>
          {program.icon || '📋'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ marginBottom: '2px' }}>{program.name}</h4>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>{program.condition}</p>
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
        {program.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.72rem', color: 'var(--color-text)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} /> {program.totalWeeks ? `${program.totalWeeks} weeks` : 'Daily Routine'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Target size={12} /> {totalExercises} exercises
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {program.phases.length} phases
        </span>
      </div>

      {program.tags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {program.tags.map(t => (
            <span key={t} style={{
              fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.8px', padding: '3px 9px', borderRadius: '50px',
              background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
            }}>{t}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <Link to={`/programs/${program.id}`} style={{
          flex: 1, padding: '9px', borderRadius: '10px',
          background: 'var(--color-bg-alt)', color: 'var(--color-secondary)',
          fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
          textAlign: 'center', textDecoration: 'none', border: '1px solid var(--color-border)',
        }}>
          View Details
        </Link>
        <button onClick={onAssign} disabled={assigned} style={{
          flex: 1, padding: '9px', borderRadius: '10px',
          background: assigned ? '#E8F5E9' : 'var(--color-accent)',
          color: assigned ? '#2E7D32' : 'white',
          fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
          border: 'none', cursor: assigned ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          {assigned ? <><CheckCircle2 size={12} /> Assigned</> : <><Plus size={12} /> Assign</>}
        </button>
      </div>
    </div>
  );
}
