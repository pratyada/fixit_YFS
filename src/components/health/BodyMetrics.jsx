import { useState, useMemo } from 'react';
import { Scale, TrendingDown, TrendingUp, Plus } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { usePatientData } from '../../hooks/usePatientData';
import { useAuth } from '../../contexts/AuthContext';
import { addBodyMetric } from '../../lib/firestore';
import { generateId } from '../../utils/storage';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function BodyMetrics() {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = usePatientData('body_metrics', []);
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');

  const latest = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return sorted[0] || null;
  }, [metrics]);

  const heightInches = profile?.height || 70;
  const currentBmi = latest?.weight ? ((latest.weight / (heightInches * heightInches)) * 703).toFixed(1) : null;

  const chartData = useMemo(() => {
    const sorted = [...metrics].filter(m => m.weight).sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(-20);
    return {
      labels: sorted.map(m => {
        const d = new Date(m.date || m.timestamp);
        return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
      }),
      weight: sorted.map(m => m.weight),
      bodyFat: sorted.filter(m => m.bodyFatPct).map(m => m.bodyFatPct),
      bodyFatLabels: sorted.filter(m => m.bodyFatPct).map(m => {
        const d = new Date(m.date || m.timestamp);
        return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
      }),
    };
  }, [metrics]);

  const handleSave = async () => {
    const entry = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      source: 'manual',
      weight: Number(weight) || null,
      bodyFatPct: Number(bodyFat) || null,
      muscleMass: Number(muscleMass) || null,
      bmi: weight ? ((Number(weight) / (heightInches * heightInches)) * 703) : null,
    };
    setMetrics(prev => [entry, ...prev]);
    if (user?.uid) {
      try { await addBodyMetric(user.uid, entry); } catch (e) { console.error(e); }
    }
    setWeight(''); setBodyFat(''); setMuscleMass(''); setShowForm(false);
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
    scales: { x: { display: true, ticks: { font: { size: 9 } } }, y: { beginAtZero: false } },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <StatCard label="Weight" value={latest?.weight ? `${latest.weight} lbs` : '—'} icon={<Scale size={16} />} color="#1565C0" />
        <StatCard label="Body Fat" value={latest?.bodyFatPct ? `${latest.bodyFatPct}%` : '—'} icon={<TrendingDown size={16} />} color="#F57C00" />
        <StatCard label="Muscle Mass" value={latest?.muscleMass ? `${latest.muscleMass} lbs` : '—'} icon={<TrendingUp size={16} />} color="#2E7D32" />
        <StatCard label="BMI" value={currentBmi || '—'} icon={<Scale size={16} />} color="#5E35B1" />
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(!showForm)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '12px', borderRadius: '10px',
        background: showForm ? 'var(--color-bg-alt)' : 'var(--color-secondary)',
        border: showForm ? '1px solid var(--color-border)' : 'none',
        color: showForm ? 'var(--color-text)' : 'white',
        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
      }}>
        <Plus size={16} /> {showForm ? 'Cancel' : 'Log Measurement'}
      </button>

      {/* Entry form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <div style={labelStyle}>Weight (lbs)</div>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="170"
                style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Body Fat %</div>
              <input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="15"
                style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Muscle (lbs)</div>
              <input type="number" value={muscleMass} onChange={e => setMuscleMass(e.target.value)} placeholder="82"
                style={inputStyle} />
            </div>
          </div>
          <button onClick={handleSave} disabled={!weight} style={{
            width: '100%', padding: '10px', borderRadius: '10px',
            background: weight ? 'var(--color-accent)' : '#E0E0E0',
            border: 'none', color: 'white', fontSize: '0.82rem', fontWeight: 700,
            cursor: weight ? 'pointer' : 'not-allowed',
          }}>
            Save
          </button>
        </div>
      )}

      {/* Weight chart */}
      {chartData.weight.length >= 2 && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px' }}>Weight Trend</div>
          <div style={{ height: '180px' }}>
            <Line data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.weight, borderColor: '#1565C0', backgroundColor: 'rgba(21,101,192,0.08)', fill: true, pointBackgroundColor: '#1565C0', tension: 0.3 }],
            }} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Body fat chart */}
      {chartData.bodyFat.length >= 2 && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px' }}>Body Fat % Trend</div>
          <div style={{ height: '180px' }}>
            <Line data={{
              labels: chartData.bodyFatLabels,
              datasets: [{ data: chartData.bodyFat, borderColor: '#F57C00', backgroundColor: 'rgba(245,124,0,0.08)', fill: true, pointBackgroundColor: '#F57C00', tension: 0.3 }],
            }} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)',
      padding: '14px', display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: `${color}12`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{value}</div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)', marginBottom: '3px' };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', boxSizing: 'border-box', maxWidth: '100%' };
