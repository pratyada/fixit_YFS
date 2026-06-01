import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Droplets, Activity, FileText, Brain, Settings2, CheckCircle2, Circle, Target, TrendingDown, TrendingUp, ArrowRight, Flame, Dumbbell, Plus, Zap } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { addWaterEntry } from '../lib/firestore';
import { generateId } from '../utils/storage';
import FoodLogger from '../components/health/FoodLogger';
import WaterTracker from '../components/health/WaterTracker';
import BodyMetrics from '../components/health/BodyMetrics';
import HealthReports from '../components/health/HealthReports';
import HealthInsights from '../components/health/HealthInsights';
import HealthTargets from '../components/health/HealthTargets';
import FeatureGate from '../components/FeatureGate';
import TodayWorkout from '../components/health/TodayWorkout';
import WorkoutPlanSelector from '../components/health/WorkoutPlanSelector';

const TABS = [
  { id: 'today', label: 'Today', icon: Zap },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'body', label: 'Body', icon: Activity },
  { id: 'plan', label: 'Plan', icon: Dumbbell },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'insights', label: 'Insights', icon: Brain },
];

export default function Health() {
  const [activeTab, setActiveTab] = useState('today');
  const [showTargets, setShowTargets] = useState(false);
  const { user, profile } = useAuth();
  const { canUseFeature } = useSubscription();

  const [foodEntries, setFoodEntries] = usePatientData('food_entries', []);
  const [waterEntries, setWaterEntries] = usePatientData('water_entries', []);
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
      {activeTab === 'today' && (
        <TodayDashboard
          foodEntries={foodEntries}
          waterEntries={waterEntries}
          bodyMetrics={bodyMetrics}
          completedSessions={completedSessions}
          targets={targets}
          user={user}
          profile={profile}
          setWaterEntries={setWaterEntries}
          onSwitchTab={setActiveTab}
        />
      )}
      {activeTab === 'food' && <FoodLogger />}
      {activeTab === 'water' && <WaterTracker />}
      {activeTab === 'body' && <BodyMetrics />}
      {activeTab === 'plan' && (
        <WorkoutPlanSelector
          currentPlanId={profile?.workoutPlanId}
          onSelect={() => setActiveTab('today')}
        />
      )}
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

function TodayDashboard({ foodEntries, waterEntries, bodyMetrics, completedSessions, targets, user, profile, setWaterEntries, onSwitchTab }) {
  const today = new Date().toISOString().split('T')[0];
  const todayFood = foodEntries.filter(e => e.date === today);
  const todayWater = waterEntries.filter(e => e.date === today);
  const todaySessions = completedSessions.filter(s => s.date === today);

  const cal = todayFood.reduce((s, e) => s + (e.calories || 0), 0);
  const pro = todayFood.reduce((s, e) => s + (e.protein || 0), 0);
  const carb = todayFood.reduce((s, e) => s + (e.carbs || 0), 0);
  const fat = todayFood.reduce((s, e) => s + (e.fat || 0), 0);
  const water = todayWater.reduce((s, e) => s + (e.amount || 0), 0);

  // Latest body metrics
  const sorted = [...bodyMetrics].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const latest = sorted[0];
  const previous = sorted[1];
  const weightChange = latest?.weight && previous?.weight ? latest.weight - previous.weight : null;

  // Body fat target (from InBody recommendation: lose 0.9 lbs fat)
  const bfGoal = latest?.bodyFatPct ? Math.max(10, latest.bodyFatPct - 2) : null;

  // Build action items
  const actions = [];

  // Calories
  const calPct = (cal / targets.dailyCalories) * 100;
  const calRemaining = Math.max(0, targets.dailyCalories - cal);
  actions.push({
    id: 'calories', done: calPct >= 80 && calPct <= 115,
    label: calPct < 80 ? `Eat ${calRemaining} more calories` : calPct > 115 ? 'Over calorie target — slow down' : 'Calories on track',
    detail: `${cal} / ${targets.dailyCalories} cal`,
    pct: Math.min(100, calPct), color: '#F57C00',
    action: () => onSwitchTab('food'),
  });

  // Protein
  const proPct = (pro / targets.dailyProtein) * 100;
  const proRemaining = Math.max(0, targets.dailyProtein - pro);
  actions.push({
    id: 'protein', done: proPct >= 90,
    label: proPct < 90 ? `Eat ${proRemaining}g more protein` : 'Protein target hit',
    detail: `${pro}g / ${targets.dailyProtein}g`,
    pct: Math.min(100, proPct), color: '#1565C0',
    action: () => onSwitchTab('food'),
  });

  // Water
  const waterPct = (water / targets.dailyWater) * 100;
  const waterRemaining = Math.max(0, targets.dailyWater - water);
  actions.push({
    id: 'water', done: waterPct >= 90,
    label: waterPct < 90 ? `Drink ${(waterRemaining / 1000).toFixed(1)}L more water` : 'Water target hit',
    detail: `${(water / 1000).toFixed(1)}L / ${(targets.dailyWater / 1000).toFixed(1)}L`,
    pct: Math.min(100, waterPct), color: '#00897B',
    action: () => onSwitchTab('water'),
  });

  // Exercise
  actions.push({
    id: 'exercise', done: todaySessions.length > 0,
    label: todaySessions.length > 0 ? `${todaySessions.length} workout${todaySessions.length > 1 ? 's' : ''} done` : 'Do a workout today',
    detail: todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''}` : 'No sessions yet',
    pct: todaySessions.length > 0 ? 100 : 0, color: '#708E86',
  });

  const completedCount = actions.filter(a => a.done).length;
  const totalPct = Math.round((completedCount / actions.length) * 100);

  // Quick water add
  const handleQuickWater = async (amount) => {
    const entry = { id: generateId(), date: today, timestamp: new Date().toISOString(), amount };
    setWaterEntries(prev => [entry, ...prev]);
    if (user?.uid) {
      try { await addWaterEntry(user.uid, entry); } catch (e) { console.error(e); }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Day score */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '18px', padding: '24px 20px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>
              Today's Score
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
              {completedCount}/{actions.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
              {completedCount === actions.length ? 'All targets hit! Great job.' : `${actions.length - completedCount} action${actions.length - completedCount > 1 ? 's' : ''} remaining`}
            </div>
          </div>
          {/* Circular progress */}
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="6"
              strokeDasharray={2 * Math.PI * 26} strokeDashoffset={2 * Math.PI * 26 * (1 - totalPct / 100)}
              strokeLinecap="round" transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.5s' }} />
            <text x="32" y="36" textAnchor="middle" fill="white" fontSize="14" fontWeight="800">{totalPct}%</text>
          </svg>
        </div>

        {/* Quick water buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {[250, 500].map(amt => (
            <button key={amt} onClick={() => handleQuickWater(amt)} style={{
              padding: '6px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Droplets size={12} /> +{amt}ml
            </button>
          ))}
          <Link to="/exercises" style={{
            padding: '6px 14px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Dumbbell size={12} /> Workout
          </Link>
        </div>
      </div>

      {/* Action checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {actions.map(a => (
          <button key={a.id} onClick={a.action} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', borderRadius: '14px',
            background: a.done ? '#F0F9F0' : 'white',
            border: `1px solid ${a.done ? '#C8E6C9' : 'var(--color-border)'}`,
            cursor: a.action ? 'pointer' : 'default',
            textAlign: 'left', width: '100%',
            transition: 'all 0.15s',
          }}>
            {a.done ? (
              <CheckCircle2 size={22} style={{ color: '#4CAF50', flexShrink: 0 }} />
            ) : (
              <Circle size={22} style={{ color: 'var(--color-border)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.88rem', fontWeight: 600,
                color: a.done ? '#388E3C' : 'var(--color-secondary)',
              }}>
                {a.label}
              </div>
              <div style={{ marginTop: '6px' }}>
                <div style={{ height: '5px', background: 'var(--color-bg-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${a.pct}%`, borderRadius: '3px',
                    background: a.done ? '#4CAF50' : a.color,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text)', marginTop: '3px' }}>
                  {a.detail}
                </div>
              </div>
            </div>
            {a.action && !a.done && <ArrowRight size={16} style={{ color: 'var(--color-text)', opacity: 0.3, flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* Today's Workout */}
      <TodayWorkout
        planId={profile?.workoutPlanId}
        onChangePlan={() => onSwitchTab('plan')}
      />

      {/* Body stats card */}
      {latest && (
        <div style={{
          background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={16} color="var(--color-accent)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Body Composition</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text)', marginLeft: 'auto' }}>
              {latest.source === 'manual' ? 'Manual' : latest.source?.toUpperCase()} &bull; {latest.date}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
            {latest.weight && (
              <BodyStat label="Weight" value={`${latest.weight} lbs`}
                change={weightChange} changeUnit="lbs" />
            )}
            {latest.bodyFatPct && (
              <BodyStat label="Body Fat" value={`${latest.bodyFatPct}%`}
                goal={bfGoal ? `Goal: ${bfGoal}%` : null} />
            )}
            {latest.muscleMass && (
              <BodyStat label="Muscle" value={`${latest.muscleMass} lbs`} />
            )}
            {latest.bmi && (
              <BodyStat label="BMI" value={latest.bmi.toFixed ? latest.bmi.toFixed(1) : latest.bmi} />
            )}
          </div>

          {/* Action recommendation based on body stats */}
          {latest.bodyFatPct && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
              background: '#EDF3F1', fontSize: '0.78rem', color: 'var(--color-secondary)', lineHeight: 1.5,
            }}>
              <strong style={{ color: 'var(--color-accent)' }}>Recommendation:</strong>{' '}
              {latest.bodyFatPct > 20
                ? `Focus on a slight calorie deficit (${targets.dailyCalories - 300} cal/day) while keeping protein at ${targets.dailyProtein}g to preserve muscle. Aim to lose 0.5-1 lb/week.`
                : latest.bodyFatPct > 15
                ? `You're in a healthy range. To lean out further, maintain ${targets.dailyProtein}g protein and train consistently. Target: lose 0.5 lbs fat/week while maintaining ${latest.muscleMass || '—'} lbs muscle.`
                : `Excellent body composition. Focus on maintaining muscle mass with ${targets.dailyProtein}g protein/day and progressive overload in training.`}
            </div>
          )}
        </div>
      )}

      {/* Macro breakdown */}
      {todayFood.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px' }}>
            Today's Nutrition
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <MacroCircle label="Calories" value={cal} target={targets.dailyCalories} color="#F57C00" />
            <MacroCircle label="Protein" value={pro} target={targets.dailyProtein} color="#1565C0" unit="g" />
            <MacroCircle label="Carbs" value={carb} target={targets.dailyCarbs} color="#7B1FA2" unit="g" />
            <MacroCircle label="Fat" value={fat} target={targets.dailyFat} color="#E53935" unit="g" />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button onClick={() => onSwitchTab('food')} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '14px', borderRadius: '12px',
          background: 'white', border: '1px solid var(--color-border)',
          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)',
        }}>
          <Plus size={16} color="#F57C00" /> Log Food
        </button>
        <button onClick={() => onSwitchTab('body')} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '14px', borderRadius: '12px',
          background: 'white', border: '1px solid var(--color-border)',
          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)',
        }}>
          <Plus size={16} color="#1565C0" /> Log Weight
        </button>
        <button onClick={() => onSwitchTab('reports')} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '14px', borderRadius: '12px',
          background: 'white', border: '1px solid var(--color-border)',
          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)',
        }}>
          <FileText size={16} color="#2E7D32" /> Upload Report
        </button>
        <button onClick={() => onSwitchTab('insights')} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '14px', borderRadius: '12px',
          background: 'white', border: '1px solid var(--color-border)',
          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)',
        }}>
          <Brain size={16} color="#5E35B1" /> View Insights
        </button>
      </div>
    </div>
  );
}

function BodyStat({ label, value, change, changeUnit, goal }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)' }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-secondary)', marginTop: '2px' }}>{value}</div>
      {change != null && (
        <div style={{
          fontSize: '0.65rem', fontWeight: 600, marginTop: '2px',
          color: change < 0 ? '#4CAF50' : change > 0 ? '#F57C00' : 'var(--color-text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
        }}>
          {change < 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
          {change > 0 ? '+' : ''}{change.toFixed(1)} {changeUnit}
        </div>
      )}
      {goal && <div style={{ fontSize: '0.6rem', color: 'var(--color-accent)', marginTop: '2px' }}>{goal}</div>}
    </div>
  );
}

function MacroCircle({ label, value, target, color, unit = '' }) {
  const pct = Math.min(100, (value / target) * 100);
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div>
      <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: 'block', margin: '0 auto' }}>
        <circle cx="27" cy="27" r={r} fill="none" stroke="#F0F0F0" strokeWidth="5" />
        <circle cx="27" cy="27" r={r} fill="none" stroke={pct >= 90 ? '#4CAF50' : color} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 27 27)"
          style={{ transition: 'all 0.3s' }} />
        <text x="27" y="30" textAnchor="middle" fill="var(--color-secondary)" fontSize="10" fontWeight="700">
          {Math.round(pct)}%
        </text>
      </svg>
      <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)', marginTop: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
        {value}{unit}
      </div>
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
