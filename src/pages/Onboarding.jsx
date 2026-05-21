import { useState } from 'react';
import { Target, Activity, Heart, Dumbbell, ArrowRight, ArrowLeft, Check, Sparkles, Trophy, Zap, Mountain, Timer, Flame, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { setUserProfile } from '../lib/firestore';
import { BODY_PARTS, GOALS, CONDITIONS } from '../data/exercises';
import { useClinic } from '../contexts/ClinicContext';

const GOAL_OPTIONS = [
  { id: 'rehab', label: 'Rehabilitation', desc: 'Recovering from injury or surgery', icon: Heart, color: '#E53935' },
  { id: 'fitness', label: 'Fitness & Strength', desc: 'Build strength and improve form', icon: Dumbbell, color: '#1565C0' },
  { id: 'competition', label: 'Competition & Events', desc: 'Training for a race, event, or competition', icon: Trophy, color: '#7B1FA2' },
  { id: 'skills', label: 'Skill Goals', desc: 'Learn a specific movement or skill', icon: Star, color: '#00897B' },
  { id: 'pain', label: 'Pain Management', desc: 'Manage chronic pain and mobility', icon: Activity, color: '#F57C00' },
  { id: 'wellness', label: 'General Wellness', desc: 'Stay active and track health', icon: Target, color: '#2E7D32' },
];

const TRAINING_TARGETS = [
  // Hyrox
  { id: 'hyrox-strength', label: 'Hyrox Strength', category: 'Hyrox', icon: '💪', desc: 'Strength-focused Hyrox prep' },
  { id: 'hyrox-conditioning', label: 'Hyrox Conditioning', category: 'Hyrox', icon: '🔥', desc: 'Cardio & endurance for race day' },
  { id: 'hyrox-build', label: 'Hyrox Build', category: 'Hyrox', icon: '🏗️', desc: 'Full Hyrox race preparation' },
  // Endurance
  { id: 'marathon-full', label: 'Marathon', category: 'Endurance', icon: '🏃', desc: '42.2 km / 26.2 miles' },
  { id: 'marathon-half', label: 'Half Marathon', category: 'Endurance', icon: '🏃‍♂️', desc: '21.1 km / 13.1 miles' },
  { id: 'ironman-full', label: 'Ironman Full', category: 'Endurance', icon: '🏊', desc: 'Swim 3.8km, Bike 180km, Run 42km' },
  { id: 'ironman-half', label: 'Ironman 70.3', category: 'Endurance', icon: '🏊‍♂️', desc: 'Half distance triathlon' },
  { id: '5k-10k', label: '5K / 10K', category: 'Endurance', icon: '👟', desc: 'Shorter distance running' },
  // Strength
  { id: 'powerlifting', label: 'Powerlifting', category: 'Strength', icon: '🏋️', desc: 'Squat, bench, deadlift focus' },
  { id: 'bodybuilding', label: 'Bodybuilding', category: 'Strength', icon: '💪', desc: 'Hypertrophy & aesthetics' },
  { id: 'crossfit', label: 'CrossFit', category: 'Strength', icon: '⚡', desc: 'Functional fitness & WODs' },
  { id: 'olympic-lifting', label: 'Olympic Lifting', category: 'Strength', icon: '🥇', desc: 'Snatch & clean and jerk' },
  // Skills
  { id: 'handstand', label: 'Handstand', category: 'Skills', icon: '🤸', desc: 'Freestanding handstand hold' },
  { id: 'backflip', label: 'Backflip', category: 'Skills', icon: '🌀', desc: 'Standing back tuck' },
  { id: 'muscle-up', label: 'Muscle-Up', category: 'Skills', icon: '💫', desc: 'Bar or ring muscle-up' },
  { id: 'pistol-squat', label: 'Pistol Squat', category: 'Skills', icon: '🦵', desc: 'Single-leg squat mastery' },
  { id: 'planche', label: 'Planche', category: 'Skills', icon: '🤸‍♂️', desc: 'Full planche hold' },
  { id: 'front-lever', label: 'Front Lever', category: 'Skills', icon: '🏋️‍♂️', desc: 'Full front lever hold' },
  // Flexibility & Movement
  { id: 'splits', label: 'Full Splits', category: 'Flexibility', icon: '🧘', desc: 'Front or side splits' },
  { id: 'mobility', label: 'Full Body Mobility', category: 'Flexibility', icon: '🧘‍♂️', desc: 'Improve overall range of motion' },
];

const TARGET_CATEGORIES = [...new Set(TRAINING_TARGETS.map(t => t.category))];

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
  const [trainingTargets, setTrainingTargets] = useState([]);
  const [bodyAreas, setBodyAreas] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('');

  const toggle = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  // Show training targets step only if user selected competition, fitness, or skills
  const showTargetsStep = goals.some(g => ['competition', 'fitness', 'skills'].includes(g));

  const canAdvance = [
    goals.length > 0,
    ...(showTargetsStep ? [true] : []), // targets optional
    bodyAreas.length > 0,
    true, // conditions optional
    experienceLevel !== '',
  ];

  const handleFinish = async () => {
    setSaving(true);
    try {
      await setUserProfile(user.uid, {
        goals,
        trainingTargets,
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

    // Step 1: Training Targets (conditional)
    ...(showTargetsStep ? [<div key="targets">
      <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', color: 'white' }}>What's your target?</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '20px' }}>Pick one or more — we'll build your plan around these</p>
      <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {TARGET_CATEGORIES.map(cat => {
          const items = TRAINING_TARGETS.filter(t => t.category === cat);
          return (
            <div key={cat}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px',
                color: 'rgba(255,255,255,0.4)', marginBottom: '8px', paddingLeft: '4px',
              }}>{cat}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {items.map(t => {
                  const selected = trainingTargets.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggle(trainingTargets, setTrainingTargets, t.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', borderRadius: '12px',
                      background: selected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${selected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: 'white', fontSize: '0.82rem', fontWeight: selected ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                      <div>
                        <div>{t.label}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>{t.desc}</div>
                      </div>
                      {selected && <Check size={14} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>] : []),

    // Step 2: Body Areas
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
      <div style={{ maxWidth: '520px', width: '100%' }}>
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

        {/* Skip for optional steps (targets and conditions) */}
        {((showTargetsStep && step === 1) || step === (showTargetsStep ? 3 : 2)) && (
          <button onClick={() => setStep(s => s + 1)} style={{
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
