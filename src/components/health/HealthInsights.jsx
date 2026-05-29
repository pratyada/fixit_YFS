import { useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { generateDailySummary, generateWeeklyTrends, generateInsights } from '../../utils/healthInsights';

const SEVERITY_STYLES = {
  success: { bg: '#E8F5E9', border: '#C8E6C9', color: '#2E7D32', icon: CheckCircle2 },
  warning: { bg: '#FFF3E0', border: '#FFE0B2', color: '#E65100', icon: AlertTriangle },
  info: { bg: '#E3F2FD', border: '#BBDEFB', color: '#1565C0', icon: Info },
};

export default function HealthInsights({ foodEntries, waterEntries, bodyMetrics, completedSessions, targets }) {
  const daily = useMemo(() => generateDailySummary(foodEntries, waterEntries, completedSessions, targets), [foodEntries, waterEntries, completedSessions, targets]);
  const weekly = useMemo(() => generateWeeklyTrends(bodyMetrics, foodEntries, waterEntries), [bodyMetrics, foodEntries, waterEntries]);
  const insights = useMemo(() => generateInsights(foodEntries, waterEntries, bodyMetrics, completedSessions, targets), [foodEntries, waterEntries, bodyMetrics, completedSessions, targets]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Daily Summary */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Brain size={16} color="var(--color-accent)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Today's Summary</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ProgressRow label="Calories" consumed={daily.calories.consumed} target={daily.calories.target} unit="cal" color="#F57C00" />
          <ProgressRow label="Protein" consumed={daily.protein.consumed} target={daily.protein.target} unit="g" color="#1565C0" />
          <ProgressRow label="Water" consumed={`${(daily.water.consumed / 1000).toFixed(1)}L`} target={`${(daily.water.target / 1000).toFixed(1)}L`} pct={(daily.water.consumed / daily.water.target) * 100} color="#00897B" />
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--color-text)' }}>
          {daily.mealsLogged} meals logged &bull; {daily.exerciseCount} exercise session{daily.exerciseCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Weekly Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <MiniStat label="Avg Calories" value={weekly.avgCalories || '—'} icon={<TrendingUp size={12} />} />
        <MiniStat label="Avg Protein" value={weekly.avgProtein ? `${weekly.avgProtein}g` : '—'} icon={<TrendingUp size={12} />} />
        <MiniStat label="Weight" value={weekly.weightChange != null ? `${weekly.weightChange > 0 ? '+' : ''}${weekly.weightChange.toFixed(1)} lbs` : '—'}
          icon={weekly.weightChange < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />} />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '10px' }}>
            Insights & Recommendations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {insights.map((insight, i) => {
              const style = SEVERITY_STYLES[insight.type] || SEVERITY_STYLES.info;
              return (
                <div key={i} style={{
                  background: style.bg, border: `1px solid ${style.border}`,
                  borderRadius: '12px', padding: '14px 16px',
                  display: 'flex', gap: '12px',
                }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1 }}>{insight.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: style.color, marginBottom: '2px' }}>
                      {insight.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                      {insight.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text)', fontSize: '0.85rem' }}>
          <Brain size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>Start logging food, water, and body metrics to get personalized insights.</p>
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, consumed, target, unit, pct, color }) {
  const numConsumed = typeof consumed === 'number' ? consumed : parseFloat(consumed) || 0;
  const numTarget = typeof target === 'number' ? target : parseFloat(target) || 1;
  const percentage = pct || Math.min(100, (numConsumed / numTarget) * 100);
  const status = percentage >= 90 ? '#4CAF50' : percentage >= 50 ? color : '#E0E0E0';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
        <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{label}</span>
        <span style={{ color: 'var(--color-text)' }}>
          {typeof consumed === 'number' ? consumed.toLocaleString() : consumed}
          {unit && ` ${unit}`} / {typeof target === 'number' ? target.toLocaleString() : target}{unit && ` ${unit}`}
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--color-bg-alt)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, percentage)}%`, background: status, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div style={{
      background: 'white', borderRadius: '10px', border: '1px solid var(--color-border)',
      padding: '10px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--color-text)', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{value}</div>
      <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)' }}>{label}</div>
    </div>
  );
}
