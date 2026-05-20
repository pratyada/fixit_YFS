import { useState } from 'react';
import { Target, Activity, Heart, Dumbbell, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { setUserProfile } from '../lib/firestore';
import { BODY_PARTS, GOALS, CONDITIONS } from '../data/exercises';
import { useClinic } from '../contexts/ClinicContext';

const GOAL_OPTIONS = [
  { id: 'rehab', label: 'Rehabilitation', desc: 'Recovering from injury or surgery', icon: Heart, color: '#E53935' },
  { id: 'fitness', label: 'Fitness & Strength', desc: 'Build strength and improve form', icon: Dumbbell, color: '#1565C0' },
  { id: 'pain', label: 'Pain Management', desc: 'Manage chronic pain and mobility', icon: Activity, color: '#F57C00' },
  { id: 'wellness', label: 'General Wellness', desc: 'Stay active and track health', icon: Target, color: '#2E7D32' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: 'Beginner', desc: 'New to exercise or returning after a break' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with basic exercises' },
  { id: 'advanced', label: 'Advanced', desc: 'Experienced with structured training' },
];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const clinic = useClinic();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [goals, setGoals] = useState([]);
  const [bodyAreas, setBodyAreas] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('');

  const toggle = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const canAdvance = [
    goals.length > 0,
    bodyAreas.length > 0,
    true, // conditions optional
    experienceLevel !== '',
  ];

  const handleFinish = async () => {
    setSaving(true);
    try {
      await setUserProfile(user.uid, {
        goals,
        bodyAreas,
        conditions,
        experienceLevel,
        onboardingComplete: true,
      });
      await refreshProfile();
    } catch (err) {
      console.error('Failed to save onboarding:', err);
    }
    setSaving(false);
  };

  const steps = [
    // Step 0: Goals
    <div key="goals">
      <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', color: 'white' }}>What brings you here?</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '20px' }}>Select one or more goals</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {GOAL_OPTIONS.map(g => {
          const selected = goals.includes(g.id);
          const Icon = g.icon;
          return (
            <button key={g.id} onClick={() => toggle(goals, setGoals, g.id)} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '16px', borderRadius: '14px',
              background: selected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${selected ? 'rgba(255,255,255,0.4)' : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: selected ? g.color : 'rgba(255,255,255,0.1)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{g.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{g.desc}</div>
              </div>
              {selected && <Check size={18} style={{ color: 'rgba(255,255,255,0.8)', flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 1: Body Areas
    <div key="body">
      <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', color: 'white' }}>Areas of focus</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '20px' }}>Select the body areas you want to work on</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {BODY_PARTS.map(bp => {
          const selected = bodyAreas.includes(bp);
          return (
            <button key={bp} onClick={() => toggle(bodyAreas, setBodyAreas, bp)} style={{
              padding: '10px 18px', borderRadius: '50px',
              background: selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${selected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: 'white', fontSize: '0.85rem', fontWeight: selected ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {bp}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 2: Conditions (optional)
    <div key="conditions">
      <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', color: 'white' }}>Any conditions?</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '20px' }}>Optional — helps us tailor recommendations</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
        {CONDITIONS.map(c => {
          const selected = conditions.includes(c);
          return (
            <button key={c} onClick={() => toggle(conditions, setConditions, c)} style={{
              padding: '8px 14px', borderRadius: '50px',
              background: selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${selected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: 'white', fontSize: '0.78rem', fontWeight: selected ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {c}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 3: Experience Level
    <div key="experience">
      <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', color: 'white' }}>Your experience level</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '20px' }}>This helps us pick the right exercises</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {EXPERIENCE_OPTIONS.map(e => {
          const selected = experienceLevel === e.id;
          return (
            <button key={e.id} onClick={() => setExperienceLevel(e.id)} style={{
              padding: '18px', borderRadius: '14px',
              background: selected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${selected ? 'rgba(255,255,255,0.4)' : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{e.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{e.desc}</div>
            </button>
          );
        })}
      </div>
    </div>,
  ];

  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src={clinic.logo}
            alt={clinic.name}
            style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '8px' }}
          />
          <div style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.2rem', color: 'white' }}>
            FIXIT
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '24px' : '8px', height: '8px', borderRadius: '4px',
              background: i <= step ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Step content */}
        {steps[step]}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              padding: '14px 20px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={step === steps.length - 1 ? handleFinish : () => setStep(s => s + 1)}
            disabled={!canAdvance[step] || saving}
            style={{
              flex: 1, padding: '14px 20px', borderRadius: '12px',
              background: canAdvance[step] ? 'white' : 'rgba(255,255,255,0.2)',
              border: 'none',
              color: canAdvance[step] ? 'var(--color-secondary)' : 'rgba(255,255,255,0.4)',
              fontSize: '0.9rem', fontWeight: 700,
              cursor: canAdvance[step] ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving...' : step === steps.length - 1 ? (
              <><Sparkles size={16} /> Get Started</>
            ) : (
              <>Continue <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        {/* Skip for conditions step */}
        {step === 2 && (
          <button onClick={() => setStep(3)} style={{
            display: 'block', margin: '12px auto 0', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer',
          }}>
            Skip this step
          </button>
        )}
      </div>
    </div>
  );
}
