import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { TrendingUp, Calendar, Award, Target } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';

const ALL_EXERCISES = [...FIXIT_EXERCISES, ...GYM_EXERCISES, ...EXERCISE_LIBRARY];
function findExercise(id) { return ALL_EXERCISES.find(e => e.id === id); }

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Progress() {
  const { t, i18n } = useTranslation('progress');
  const [sessions] = usePatientData('completed_sessions', []);
  const [painEntries] = usePatientData('pain_entries', []);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    const uniqueExercises = new Set(sessions.map(s => s.exerciseId)).size;
    const avgPain = painEntries.length
      ? (painEntries.reduce((a, e) => a + e.level, 0) / painEntries.length).toFixed(1)
      : '—';
    return { totalSessions, totalMinutes: Math.round(totalMinutes), uniqueExercises, avgPain };
  }, [sessions, painEntries]);

  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = sessions.filter(s => s.date === dateStr).length;
      days.push({ date: dateStr, label: d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }), count });
    }
    return days;
  }, [sessions, i18n.language]);

  const painData = useMemo(() => {
    return painEntries.slice(-20).map(e => ({
      label: new Date(e.timestamp).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
      value: e.level,
    }));
  }, [painEntries, i18n.language]);

  const exerciseBreakdown = useMemo(() => {
    const counts = {};
    sessions.forEach(s => { counts[s.exerciseId] = (counts[s.exerciseId] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, count]) => ({
      name: findExercise(id)?.name || id, count,
    }));
  }, [sessions]);

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'Public Sans'", size: 10 } } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: "'Public Sans'", size: 10 } }, grid: { color: '#f5f5f5' } },
    },
    elements: { line: { tension: 0.4 }, point: { radius: 3, hoverRadius: 5 } },
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>{t('title')}</h1>
        <p style={{ fontSize: '0.85rem' }}>{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
        <SummaryCard icon={<Calendar size={17} />} value={stats.totalSessions} label={t('stats.totalSessions')} color="#708E86" />
        <SummaryCard icon={<TrendingUp size={17} />} value={`${stats.totalMinutes}m`} label={t('stats.activeTime')} color="#B0C4BB" />
        <SummaryCard icon={<Target size={17} />} value={stats.uniqueExercises} label={t('stats.exercisesDone')} color="#B7ACA0" />
        <SummaryCard icon={<Award size={17} />} value={stats.avgPain} label={t('stats.avgPain')} color="#C06060" />
      </div>

      {/* Activity Chart */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h4 style={{ marginBottom: '14px' }}>{t('charts.dailyActivity')}</h4>
        <div style={{ height: '180px' }}>
          {sessions.length > 0 ? (
            <Bar data={{
              labels: dailyData.map(d => d.label),
              datasets: [{ data: dailyData.map(d => d.count), backgroundColor: '#B0C4BB', borderRadius: 6, borderSkipped: false }],
            }} options={chartOpts} />
          ) : <Empty msg={t('empty.activityChart')} />}
        </div>
      </div>

      {/* Pain Trend */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h4 style={{ marginBottom: '14px' }}>{t('charts.painLevelTrend')}</h4>
        <div style={{ height: '180px' }}>
          {painData.length > 1 ? (
            <Line data={{
              labels: painData.map(d => d.label),
              datasets: [{ data: painData.map(d => d.value), borderColor: '#C06060', backgroundColor: 'rgba(192,96,96,0.08)', fill: true, pointBackgroundColor: '#C06060' }],
            }} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 10 } } }} />
          ) : <Empty msg={t('empty.painTrend')} />}
        </div>
      </div>

      {/* Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h4 style={{ marginBottom: '14px' }}>{t('charts.mostPerformed')}</h4>
          {exerciseBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exerciseBreakdown.map((ex, i) => {
                const max = exerciseBreakdown[0].count;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--color-secondary)' }}>{ex.name}</span>
                      <span>{ex.count}x</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--color-bg-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(ex.count / max) * 100}%`, background: '#708E86', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <Empty msg={t('empty.noExercises')} />}
        </div>

        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h4 style={{ marginBottom: '14px' }}>{t('charts.bodyPartDistribution')}</h4>
          {sessions.length > 0 ? (
            <div style={{ height: '200px' }}>
              <Doughnut data={{
                labels: [...new Set(sessions.map(s => findExercise(s.exerciseId)?.bodyPart || 'Other'))],
                datasets: [{
                  data: (() => {
                    const parts = {};
                    sessions.forEach(s => {
                      const bp = findExercise(s.exerciseId)?.bodyPart || 'Other';
                      parts[bp] = (parts[bp] || 0) + 1;
                    });
                    return Object.values(parts);
                  })(),
                  backgroundColor: ['#708E86', '#B0C4BB', '#B7ACA0', '#4E4E53', '#77786A', '#C06060'],
                  borderWidth: 0,
                }],
              }} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { family: "'Public Sans'", size: 11 }, padding: 12 } } },
                cutout: '65%',
              }} />
            </div>
          ) : <Empty msg={t('empty.bodyPart')} />}
        </div>
      </div>

      {/* Milestones */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h4 style={{ marginBottom: '12px' }}>{t('milestones.title')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
          <Milestone emoji="🌱" label={t('milestones.firstExercise')} achieved={sessions.length >= 1} />
          <Milestone emoji="🔥" label={t('milestones.sevenDayStreak')} achieved={(() => {
            let s = 0;
            const dates = [...new Set(sessions.map(x => x.date))].sort().reverse();
            const d = new Date();
            for (let i = 0; i < dates.length; i++) {
              const exp = new Date(d); exp.setDate(exp.getDate() - i);
              if (dates[i] === exp.toISOString().split('T')[0]) s++; else break;
            }
            return s >= 7;
          })()} />
          <Milestone emoji="💯" label={t('milestones.fiftySessions')} achieved={sessions.length >= 50} />
          <Milestone emoji="🏆" label={t('milestones.allExercises')} achieved={new Set(sessions.map(s => s.exerciseId)).size >= EXERCISE_LIBRARY.length} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, value, label, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: '14px',
      border: '1px solid var(--color-border)', padding: '16px', textAlign: 'center',
    }}>
      <div style={{
        margin: '0 auto 8px', width: '34px', height: '34px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color + '18', color,
      }}>{icon}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{value}</div>
      <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-text)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function Milestone({ emoji, label, achieved }) {
  const { t } = useTranslation('progress');
  return (
    <div style={{
      textAlign: 'center', padding: '14px 8px', borderRadius: '12px',
      background: achieved ? 'var(--color-bg-alt)' : '#fafafa',
      opacity: achieved ? 1 : 0.45,
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{emoji}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-secondary)' }}>{label}</div>
      {achieved && <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('milestones.achieved')}</div>}
    </div>
  );
}

function Empty({ msg }) {
  return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', color: 'var(--color-text)' }}>{msg}</div>;
}
