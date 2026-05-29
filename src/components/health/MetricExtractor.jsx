import { useState } from 'react';
import { Save, X } from 'lucide-react';

const BODY_COMP_FIELDS = [
  { key: 'weight', label: 'Weight (lbs)', placeholder: '170.2' },
  { key: 'bodyFatPct', label: 'Body Fat %', placeholder: '15.4' },
  { key: 'muscleMass', label: 'Muscle Mass (lbs)', placeholder: '82.2' },
  { key: 'bmi', label: 'BMI', placeholder: '24.4' },
  { key: 'bmr', label: 'BMR (kcal)', placeholder: '1781' },
  { key: 'totalBodyWater', label: 'Total Body Water (lbs)', placeholder: '105.6' },
];

const BLOOD_FIELDS = [
  { key: 'weight', label: 'Weight (lbs)', placeholder: '170' },
  { key: 'cholesterol', label: 'Cholesterol (mg/dL)', placeholder: '200' },
  { key: 'triglycerides', label: 'Triglycerides', placeholder: '150' },
  { key: 'glucose', label: 'Glucose (mg/dL)', placeholder: '90' },
  { key: 'hemoglobin', label: 'Hemoglobin (g/dL)', placeholder: '14.5' },
  { key: 'vitaminD', label: 'Vitamin D (ng/mL)', placeholder: '40' },
];

const OTHER_FIELDS = [
  { key: 'weight', label: 'Weight (lbs)', placeholder: '170' },
  { key: 'notes', label: 'Notes', placeholder: 'Any observations...', isText: true },
];

export default function MetricExtractor({ reportType, onSave, onCancel }) {
  const [values, setValues] = useState({});

  const typeKey = reportType?.toLowerCase().replace(' ', '') || 'other';
  const fields = typeKey === 'bloodwork' ? BLOOD_FIELDS
    : typeKey === 'other' ? OTHER_FIELDS
    : BODY_COMP_FIELDS;

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const metrics = {};
    fields.forEach(f => {
      if (values[f.key]) {
        metrics[f.key] = f.isText ? values[f.key] : Number(values[f.key]) || null;
      }
    });
    onSave(metrics);
  };

  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '12px' }}>
        Enter metrics from your {reportType} report
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: fields.length > 3 ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: '14px' }}>
        {fields.map(f => (
          <div key={f.key}>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)', marginBottom: '3px' }}>
              {f.label}
            </div>
            {f.isText ? (
              <textarea value={values[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder} rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', boxSizing: 'border-box', resize: 'vertical', maxWidth: '100%' }} />
            ) : (
              <input type="number" step="0.1" value={values[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', boxSizing: 'border-box', maxWidth: '100%' }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '10px', borderRadius: '10px',
          background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
          color: 'var(--color-text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <X size={14} /> Cancel
        </button>
        <button onClick={handleSave} style={{
          flex: 1, padding: '10px', borderRadius: '10px',
          background: 'var(--color-accent)', border: 'none',
          color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <Save size={14} /> Save Metrics
        </button>
      </div>
    </div>
  );
}
