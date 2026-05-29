import { useState } from 'react';
import { Save, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { setUserProfile } from '../../lib/firestore';

export default function HealthTargets({ targets, onSave }) {
  const { user, refreshProfile } = useAuth();
  const [values, setValues] = useState({
    dailyCalories: targets.dailyCalories || 2200,
    dailyProtein: targets.dailyProtein || 170,
    dailyCarbs: targets.dailyCarbs || 250,
    dailyFat: targets.dailyFat || 70,
    dailyWater: targets.dailyWater || 3000,
    height: targets.height || 70,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.uid) {
        await setUserProfile(user.uid, values);
        await refreshProfile();
      }
      onSave?.();
    } catch (e) {
      console.error('Failed to save targets:', e);
    }
    setSaving(false);
  };

  const update = (key, val) => setValues(prev => ({ ...prev, [key]: Number(val) || 0 }));

  return (
    <div style={{
      background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Target size={16} color="var(--color-accent)" />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Daily Targets</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <Field label="Calories" value={values.dailyCalories} onChange={v => update('dailyCalories', v)} suffix="cal" />
        <Field label="Protein" value={values.dailyProtein} onChange={v => update('dailyProtein', v)} suffix="g" />
        <Field label="Carbs" value={values.dailyCarbs} onChange={v => update('dailyCarbs', v)} suffix="g" />
        <Field label="Fat" value={values.dailyFat} onChange={v => update('dailyFat', v)} suffix="g" />
        <Field label="Water" value={values.dailyWater} onChange={v => update('dailyWater', v)} suffix="ml" />
        <Field label="Height" value={values.height} onChange={v => update('height', v)} suffix="in" />
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: '10px', borderRadius: '10px',
        background: 'var(--color-accent)', border: 'none',
        color: 'white', fontSize: '0.82rem', fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <Save size={14} /> {saving ? 'Saving...' : 'Save Targets'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, suffix }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)', marginBottom: '3px' }}>
        {label} ({suffix})
      </div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', boxSizing: 'border-box', maxWidth: '100%' }} />
    </div>
  );
}
