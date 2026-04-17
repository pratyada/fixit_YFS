import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Clock, Repeat, Target, AlertTriangle, CheckCircle2, Camera, Play, Pause, RotateCcw } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { usePatientData } from '../hooks/usePatientData';
import { generateId } from '../utils/storage';
import ExerciseAnimation from '../components/ExerciseAnimation';
import Exercise3D from '../components/Exercise3D';

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exercise = EXERCISE_LIBRARY.find(e => e.id === id);
  const [completedSessions, setCompleted] = usePatientData('completed_sessions', []);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [notes, setNotes] = useState('');
  const [painDuring, setPainDuring] = useState(0);

  if (!exercise) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p>Exercise not found.</p>
        <Link to="/exercises" style={{ color: 'var(--color-accent)', marginTop: '8px', display: 'inline-block' }}>Back to exercises</Link>
      </div>
    );
  }

  const startTimer = () => {
    if (timerInterval) return;
    setIsActive(true);
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    clearInterval(timerInterval);
    setTimerInterval(null);
    setIsActive(false);
  };

  const resetSession = () => {
    pauseTimer();
    setTimer(0);
    setCurrentSet(0);
    setCurrentRep(0);
    setSessionComplete(false);
  };

  const completeRep = () => {
    if (currentRep + 1 >= exercise.reps) {
      if (currentSet + 1 >= exercise.sets) {
        pauseTimer();
        setSessionComplete(true);
      } else {
        setCurrentSet(s => s + 1);
        setCurrentRep(0);
      }
    } else {
      setCurrentRep(r => r + 1);
    }
  };

  const saveSession = () => {
    const session = {
      id: generateId(),
      exerciseId: exercise.id,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      duration: timer,
      setsCompleted: currentSet + 1,
      repsCompleted: (currentSet * exercise.reps) + currentRep + 1,
      painLevel: painDuring,
      notes,
    };
    setCompleted(prev => [...prev, session]);
    navigate('/exercises');
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const totalReps = exercise.sets * exercise.reps;
  const doneReps = currentSet * exercise.reps + currentRep;
  const pct = (doneReps / totalReps) * 100;

  const btnStyle = (bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: bg, color: 'white', border: 'none',
    padding: '8px 18px', borderRadius: '50px',
    fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '1.2px', cursor: 'pointer', transition: 'all 0.2s',
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Back */}
      <Link to="/exercises" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
        <ArrowLeft size={15} /> Back to Exercises
      </Link>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h6 style={{ marginBottom: '8px' }}>{exercise.bodyPart} — {exercise.difficulty}</h6>
        <h1 style={{ marginBottom: '6px' }}>{exercise.name}</h1>
        <p style={{ fontSize: '0.85rem', marginBottom: '14px' }}>{exercise.description}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.82rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={14} style={{ color: 'var(--color-accent)' }} /> {exercise.duration}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Repeat size={14} style={{ color: 'var(--color-accent)' }} /> {exercise.sets} sets x {exercise.reps} reps
          </span>
          {exercise.holdSeconds && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Target size={14} style={{ color: 'var(--color-accent)' }} /> {exercise.holdSeconds}s hold
            </span>
          )}
        </div>
      </div>

      {/* Exercise Visual — 2D/3D toggle */}
      <ViewToggleAnimation exerciseId={exercise.id} />

      {/* Workout Tracker */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '16px', padding: '22px', color: 'white',
      }}>
        <h4 style={{ color: 'white', marginBottom: '16px' }}>Workout Tracker</h4>

        {!sessionComplete ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '2.2rem', fontFamily: 'monospace', fontWeight: 600 }}>{formatTime(timer)}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                {!isActive ? (
                  <button onClick={startTimer} style={btnStyle('rgba(255,255,255,0.2)')}><Play size={13} /> Start</button>
                ) : (
                  <button onClick={pauseTimer} style={btnStyle('rgba(255,255,255,0.2)')}><Pause size={13} /> Pause</button>
                )}
                <button onClick={resetSession} style={btnStyle('rgba(255,255,255,0.1)')}><RotateCcw size={13} /> Reset</button>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                <span>Set {currentSet + 1} of {exercise.sets}</span>
                <span>Rep {currentRep + 1} of {exercise.reps}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'white', borderRadius: '3px', transition: 'width 0.3s' }} />
              </div>
              <button
                onClick={completeRep}
                style={{
                  width: '100%', marginTop: '14px', padding: '12px',
                  background: 'white', color: 'var(--color-accent)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1.2px', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <CheckCircle2 size={15} /> Complete Rep
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <h3 style={{ color: 'white' }}>Exercise Complete!</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              {exercise.sets} sets x {exercise.reps} reps in {formatTime(timer)}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                  Pain during exercise (0-10)
                </label>
                <input type="range" min="0" max="10" value={painDuring} onChange={e => setPainDuring(Number(e.target.value))}
                  style={{ width: '100%', border: 'none', padding: 0, background: 'transparent', accentColor: 'white' }} />
                <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>{painDuring}/10</div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel?" rows={2}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '8px', fontSize: '0.82rem' }} />
              </div>
            </div>

            <button onClick={saveSession} style={{
              background: 'white', color: 'var(--color-accent)', border: 'none',
              padding: '12px 24px', borderRadius: '10px', fontWeight: 700,
              fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.2px',
              cursor: 'pointer',
            }}>
              Save & Finish
            </button>
          </div>
        )}
      </div>

      {/* Record & Pose Check CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link to={`/exercises/${id}/record`} style={{
          display: 'block', background: 'linear-gradient(135deg, #708E86 0%, #5A7A72 100%)', borderRadius: '14px',
          padding: '20px', textDecoration: 'none', textAlign: 'center',
          border: 'none', transition: 'all 0.2s', color: 'white',
        }}>
          <Camera size={22} style={{ margin: '0 auto 6px', display: 'block' }} />
          <h4 style={{ color: 'white' }}>Record Session</h4>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Record front + side angles for AI form analysis</p>
        </Link>
        <Link to="/pose" style={{
          display: 'block', background: 'var(--color-bg-alt)', borderRadius: '14px',
          padding: '16px', textDecoration: 'none', textAlign: 'center',
          border: '1px solid var(--color-border)', transition: 'all 0.2s',
        }}>
          <h4>Live Pose Check</h4>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>Real-time form analysis with your camera</p>
        </Link>
      </div>

      {/* Instructions */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h3 style={{ marginBottom: '14px' }}>How To Perform</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {exercise.instructions.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ paddingTop: '2px' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: '#F0F9F0', borderRadius: '14px', padding: '20px', border: '1px solid #C8E6C9' }}>
        <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} style={{ color: '#4CAF50' }} /> Pro Tips
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {exercise.tips.map((tip, i) => (
            <div key={i} style={{ fontSize: '0.82rem', display: 'flex', gap: '6px' }}>
              <span style={{ color: '#4CAF50' }}>✓</span> {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Contraindications */}
      {exercise.contraindications?.length > 0 && (
        <div style={{ background: '#FFF3F0', borderRadius: '14px', padding: '20px', border: '1px solid #FFCDD2' }}>
          <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#C62828' }}>
            <AlertTriangle size={15} /> Cautions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {exercise.contraindications.map((c, i) => (
              <div key={i} style={{ fontSize: '0.82rem', color: '#D32F2F', display: 'flex', gap: '6px' }}>
                ⚠️ {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Muscles & Equipment */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <h4 style={{ marginBottom: '8px' }}>Muscles Targeted</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {exercise.musclesTargeted.map(m => (
              <span key={m} style={{
                fontSize: '0.72rem', background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
                padding: '4px 12px', borderRadius: '50px', fontWeight: 500,
              }}>{m}</span>
            ))}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <h4 style={{ marginBottom: '8px' }}>Equipment Needed</h4>
          <p style={{ fontSize: '0.85rem' }}>{exercise.equipmentNeeded}</p>
        </div>
      </div>
    </div>
  );
}

function ViewToggleAnimation({ exerciseId }) {
  const [mode, setMode] = useState('2d');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{
        display: 'flex', gap: '6px', padding: '4px',
        background: 'var(--color-bg-alt)', borderRadius: '50px',
        alignSelf: 'center', border: '1px solid var(--color-border)',
      }}>
        {[
          { k: '2d', l: '2D Animation' },
          { k: '3d', l: '3D Rotatable' },
        ].map(opt => (
          <button
            key={opt.k}
            onClick={() => setMode(opt.k)}
            style={{
              padding: '7px 18px', borderRadius: '50px', border: 'none',
              background: mode === opt.k ? 'var(--color-secondary)' : 'transparent',
              color: mode === opt.k ? 'white' : 'var(--color-text)',
              fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '1.2px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {opt.l}
          </button>
        ))}
      </div>
      {mode === '2d' ? (
        <ExerciseAnimation exerciseId={exerciseId} />
      ) : (
        <Exercise3D exerciseId={exerciseId} />
      )}
    </div>
  );
}
