import { useState } from 'react';
import { UtensilsCrossed, Droplets, Activity, FileText, Brain, Settings2 } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import FoodLogger from '../components/health/FoodLogger';
import WaterTracker from '../components/health/WaterTracker';
import BodyMetrics from '../components/health/BodyMetrics';
import HealthReports from '../components/health/HealthReports';
import HealthInsights from '../components/health/HealthInsights';
import HealthTargets from '../components/health/HealthTargets';
import FeatureGate from '../components/FeatureGate';

const TABS = [
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'body', label: 'Body', icon: Activity },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'insights', label: 'Insights', icon: Brain },
];

export default function Health() {
  const [activeTab, setActiveTab] = useState('food');
  const [showTargets, setShowTargets] = useState(false);
  const { user, profile } = useAuth();
  const { canUseFeature } = useSubscription();

  const [foodEntries] = usePatientData('food_entries', []);
  const [waterEntries] = usePatientData('water_entries', []);
  const [bodyMetrics] = usePatientData('body_metrics', []);
  const [healthReports] = usePatientData('health_reports', []);
  const [completedSessions] = usePatientData('completed_sessions', []);

  const targets = {
    dailyCalories: profile?.dailyCalories || 2200,
    dailyProtein: profile?.dailyProtein || 170,
    dailyCarbs: profile?.dailyCarbs || 250,
    dailyFat: profile?.dailyFat || 70,
    dailyWater: profile?.dailyWater || 3000,
    height: profile?.height || 70,
  };

  const today = new Date().toISOString().split('T')[0];

  // Today's quick stats for the header
  const todayCalories = foodEntries.filter(e => e.date === today).reduce((s, e) => s + (e.calories || 0), 0);
  const todayWater = waterEntries.filter(e => e.date === today).reduce((s, e) => s + (e.amount || 0), 0);
  const todayProtein = foodEntries.filter(e => e.date === today).reduce((s, e) => s + (e.protein || 0), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Health Tracker</h1>
          <p style={{ fontSize: '0.82rem' }}>Track food, water, and body composition</p>
        </div>
        <button onClick={() => setShowTargets(!showTargets)} style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: showTargets ? 'var(--color-accent)' : 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          color: showTargets ? 'white' : 'var(--color-text)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Settings2 size={16} />
        </button>
      </div>

      {/* Targets panel */}
      {showTargets && <HealthTargets targets={targets} onSave={() => setShowTargets(false)} />}

      {/* Quick stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
      }}>
        <QuickStat label="Calories" value={todayCalories} target={targets.dailyCalories} unit="cal" color="#F57C00" />
        <QuickStat label="Protein" value={todayProtein} target={targets.dailyProtein} unit="g" color="#1565C0" />
        <QuickStat label="Water" value={`${(todayWater / 1000).toFixed(1)}L`} target={`${(targets.dailyWater / 1000).toFixed(1)}L`} unit="" color="#00897B" />
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '50px', whiteSpace: 'nowrap',
              background: active ? 'var(--color-accent)' : 'white',
              color: active ? 'white' : 'var(--color-text)',
              border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
              fontSize: '0.78rem', fontWeight: active ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
            }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'food' && <FoodLogger />}
      {activeTab === 'water' && <WaterTracker />}
      {activeTab === 'body' && <BodyMetrics />}
      {activeTab === 'reports' && (
        <FeatureGate feature="healthReports">
          <HealthReports />
        </FeatureGate>
      )}
      {activeTab === 'insights' && (
        <FeatureGate feature="aiInsights">
          <HealthInsights
            foodEntries={foodEntries}
            waterEntries={waterEntries}
            bodyMetrics={bodyMetrics}
            completedSessions={completedSessions}
            targets={targets}
          />
        </FeatureGate>
      )}
    </div>
  );
}

function QuickStat({ label, value, target, unit, color }) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const numTarget = typeof target === 'number' ? target : parseFloat(target) || 1;
  const pct = Math.min(100, (numValue / numTarget) * 100);

  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '12px',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--color-text)' }}> {unit}</span>
      </div>
      <div style={{ height: '4px', background: 'var(--color-bg-alt)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '2px',
          background: pct >= 90 ? '#4CAF50' : pct >= 50 ? color : '#E0E0E0',
          transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--color-text)', marginTop: '2px' }}>
        / {typeof target === 'number' ? target.toLocaleString() : target}
      </div>
    </div>
  );
}
