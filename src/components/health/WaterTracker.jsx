import { useMemo } from 'react';
import { Droplets, Undo2, Clock } from 'lucide-react';
import { usePatientData } from '../../hooks/usePatientData';
import { useAuth } from '../../contexts/AuthContext';
import { addWaterEntry, deleteWaterEntry } from '../../lib/firestore';
import { generateId } from '../../utils/storage';
import { useLocalState } from '../../hooks/useLocalState';

const today = () => new Date().toISOString().split('T')[0];
const AMOUNTS = [250, 500, 1000];

export default function WaterTracker() {
  const { user } = useAuth();
  const [entries, setEntries] = usePatientData('water_entries', []);
  const [target] = useLocalState('water_target', 3000);

  const todayEntries = useMemo(() =>
    entries.filter(e => e.date === today()).sort((a, b) =>
      (b.timestamp || '').localeCompare(a.timestamp || '')
    ), [entries]);

  const consumed = todayEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const pct = Math.min(100, (consumed / target) * 100);
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const ringColor = pct >= 90 ? '#4CAF50' : pct >= 50 ? '#00897B' : 'var(--color-accent)';

  const handleAdd = async (amount) => {
    const entry = {
      id: generateId(),
      date: today(),
      timestamp: new Date().toISOString(),
      amount,
    };
    setEntries(prev => [entry, ...prev]);
    if (user?.uid) {
      try { await addWaterEntry(user.uid, entry); } catch (e) { console.error(e); }
    }
  };

  const handleUndo = async () => {
    if (!todayEntries.length) return;
    const last = todayEntries[0];
    setEntries(prev => prev.filter(e => e.id !== last.id));
    if (user?.uid) {
      try { await deleteWaterEntry(user.uid, last.id); } catch (e) { console.error(e); }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      {/* Progress ring */}
      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-bg-alt)" strokeWidth="12" />
          <circle cx="100" cy="100" r={radius} fill="none" stroke={ringColor} strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Droplets size={20} style={{ color: ringColor, marginBottom: '4px' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
            {(consumed / 1000).toFixed(1)}L
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
            / {(target / 1000).toFixed(1)}L
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: ringColor, marginTop: '2px' }}>
            {Math.round(pct)}%
          </div>
        </div>
      </div>

      {/* Add buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {AMOUNTS.map(amt => (
          <button key={amt} onClick={() => handleAdd(amt)} style={{
            padding: '12px 20px', borderRadius: '12px',
            background: 'white', border: '2px solid var(--color-border)',
            color: 'var(--color-secondary)', fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Droplets size={14} color="#00897B" />
            +{amt >= 1000 ? `${amt / 1000}L` : `${amt}ml`}
          </button>
        ))}
      </div>

      {/* Undo */}
      {todayEntries.length > 0 && (
        <button onClick={handleUndo} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '50px',
          background: 'var(--color-bg-alt)', border: 'none',
          color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
        }}>
          <Undo2 size={12} /> Undo last ({todayEntries[0].amount}ml)
        </button>
      )}

      {/* Timeline */}
      {todayEntries.length > 0 && (
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '8px' }}>
            Today's Log
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {todayEntries.map(e => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: '8px', background: 'white',
                border: '1px solid var(--color-border)', fontSize: '0.78rem',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-secondary)' }}>
                  <Droplets size={12} color="#00897B" /> +{e.amount}ml
                </span>
                <span style={{ color: 'var(--color-text)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
