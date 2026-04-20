import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, Repeat, Target, AlertTriangle, CheckCircle2, Camera, Play, Pause, RotateCcw, Upload, Video, X } from 'lucide-react';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { usePatientData } from '../hooks/usePatientData';
import { addCompletedSession, getExercise, setExercise } from '../lib/firestore';
import { uploadDemoVideo } from '../lib/storage-firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateId } from '../utils/storage';

export default function ExerciseDetail() {
  const { t } = useTranslation('exercises');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isPractitioner } = useAuth();
  const exercise = FIXIT_EXERCISES.find(e => e.id === id) || EXERCISE_LIBRARY.find(e => e.id === id);
  const canManage = isAdmin || isPractitioner;

  // Helper to get translated exercise content from exerciseData namespace
  const getExT = (field) => {
    const key = `${exercise?.id}.${field}`;
    const val = t(key, { ns: 'exerciseData', returnObjects: field === 'instructions' || field === 'tips' || field === 'contraindications' || field === 'musclesTargeted' });
    return val !== key ? val : exercise?.[field];
  };
  const [completedSessions, setCompleted] = usePatientData('completed_sessions', []);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [notes, setNotes] = useState('');
  const [painDuring, setPainDuring] = useState(0);

  // Demo video
  const [demoVideoUrl, setDemoVideoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    getExercise(id).then(doc => {
      if (doc?.demoVideoUrl) setDemoVideoUrl(doc.demoVideoUrl);
    }).catch(() => {});
  }, [id]);

  const handleDemoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadDemoVideo(id, file, (p) => setUploadProgress(p));
      await setExercise(id, { demoVideoUrl: result.url, demoVideoPath: result.path });
      setDemoVideoUrl(result.url);
    } catch (err) {
      console.error('Demo upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeDemoVideo = async () => {
    try {
      await setExercise(id, { demoVideoUrl: null, demoVideoPath: null });
      setDemoVideoUrl(null);
    } catch (err) {
      console.error('Failed to remove demo:', err);
    }
  };

  if (!exercise) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p>{t('detail.exerciseNotFound')}</p>
        <Link to="/exercises" style={{ color: 'var(--color-accent)', marginTop: '8px', display: 'inline-block' }}>{t('detail.backToExercises')}</Link>
      </div>
    );
  }

  const startTimer = () => {
    if (timerInterval) return;
    setIsActive(true);
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
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

  const saveSession = async () => {
    const sessionData = {
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
    setCompleted(prev => [...prev, sessionData]);
    // Persist to Firestore so it shows in Progress
    if (user?.uid) {
      try { await addCompletedSession(user.uid, sessionData); } catch (e) { console.error('Failed to save session:', e); }
    }
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
        <ArrowLeft size={15} /> {t('detail.backToExercises')}
      </Link>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h6 style={{ marginBottom: '8px' }}>{exercise.bodyPart} — {exercise.difficulty}</h6>
        <h1 style={{ marginBottom: '6px' }}>{getExT('name')}</h1>
        <p style={{ fontSize: '0.85rem', marginBottom: '14px' }}>{getExT('description')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.82rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={14} style={{ color: 'var(--color-accent)' }} /> {exercise.duration}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Repeat size={14} style={{ color: 'var(--color-accent)' }} /> {t('detail.setsXReps', { sets: exercise.sets, reps: exercise.reps })}
          </span>
          {exercise.holdSeconds && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Target size={14} style={{ color: 'var(--color-accent)' }} /> {t('detail.holdSeconds', { seconds: exercise.holdSeconds })}
            </span>
          )}
        </div>
      </div>

      {/* Demo Video Guide */}
      {demoVideoUrl ? (
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid var(--color-border)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: '#EDF3F1', color: '#708E86',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Video size={14} />
              </div>
              <h4 style={{ margin: 0 }}>Demo Video</h4>
            </div>
            {canManage && (
              <button onClick={removeDemoVideo} style={{
                background: 'none', border: 'none', color: 'var(--color-text)',
                cursor: 'pointer', padding: '4px',
              }} title="Remove demo video">
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ padding: '12px 16px 16px' }}>
            <video
              src={demoVideoUrl}
              controls
              playsInline
              preload="metadata"
              style={{
                width: '100%', borderRadius: '12px', background: '#000',
                maxHeight: '300px',
              }}
            />
          </div>
        </div>
      ) : canManage ? (
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '2px dashed var(--color-border)', padding: '24px',
          textAlign: 'center',
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleDemoUpload}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '8px' }}>
                Uploading demo video... {Math.round(uploadProgress * 100)}%
              </div>
              <div style={{
                height: '6px', background: 'var(--color-bg-alt)',
                borderRadius: '3px', overflow: 'hidden', maxWidth: '200px', margin: '0 auto',
              }}>
                <div style={{
                  height: '100%', width: `${uploadProgress * 100}%`,
                  background: 'var(--color-accent)', borderRadius: '3px',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          ) : (
            <>
              <Video size={28} style={{ color: 'var(--color-border)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '4px' }}>
                Add Demo Video
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '12px' }}>
                Upload a video showing correct form for this exercise
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'var(--color-accent)', color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '10px',
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Upload size={14} /> Upload Video
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* Workout Tracker */}
      <div style={{
        background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
        borderRadius: '16px', padding: '22px', color: 'white',
      }}>
        <h4 style={{ color: 'white', marginBottom: '16px' }}>{t('detail.workoutTracker')}</h4>

        {!sessionComplete ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '2.2rem', fontFamily: 'monospace', fontWeight: 600 }}>{formatTime(timer)}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                {!isActive ? (
                  <button onClick={startTimer} style={btnStyle('rgba(255,255,255,0.2)')}><Play size={13} /> {t('start', { ns: 'common' })}</button>
                ) : (
                  <button onClick={pauseTimer} style={btnStyle('rgba(255,255,255,0.2)')}><Pause size={13} /> {t('pause', { ns: 'common' })}</button>
                )}
                <button onClick={resetSession} style={btnStyle('rgba(255,255,255,0.1)')}><RotateCcw size={13} /> {t('reset', { ns: 'common' })}</button>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                <span>{t('detail.setOf', { current: currentSet + 1, total: exercise.sets })}</span>
                <span>{t('detail.repOf', { current: currentRep + 1, total: exercise.reps })}</span>
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
                <CheckCircle2 size={15} /> {t('detail.completeRep')}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <h3 style={{ color: 'white' }}>{t('detail.exerciseComplete')}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              {t('detail.setsRepsInTime', { sets: exercise.sets, reps: exercise.reps, time: formatTime(timer) })}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                  {t('detail.painDuringExercise')}
                </label>
                <input type="range" min="0" max="10" value={painDuring} onChange={e => setPainDuring(Number(e.target.value))}
                  style={{ width: '100%', border: 'none', padding: 0, background: 'transparent', accentColor: 'white' }} />
                <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>{painDuring}/10</div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>{t('detail.notes')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('detail.notesPlaceholder')} rows={2}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '8px', fontSize: '0.82rem' }} />
              </div>
            </div>

            <button onClick={saveSession} style={{
              background: 'white', color: 'var(--color-accent)', border: 'none',
              padding: '12px 24px', borderRadius: '10px', fontWeight: 700,
              fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.2px',
              cursor: 'pointer',
            }}>
              {t('detail.saveAndFinish')}
            </button>
          </div>
        )}
      </div>


      {/* Instructions */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h3 style={{ marginBottom: '14px' }}>{t('detail.howToPerform')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(getExT('instructions') || []).map((step, i) => (
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
          <CheckCircle2 size={15} style={{ color: '#4CAF50' }} /> {t('detail.proTips')}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(getExT('tips') || []).map((tip, i) => (
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
            <AlertTriangle size={15} /> {t('detail.cautions')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(getExT('contraindications') || []).map((c, i) => (
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
          <h4 style={{ marginBottom: '8px' }}>{t('detail.musclesTargeted')}</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(getExT('musclesTargeted') || []).map(m => (
              <span key={m} style={{
                fontSize: '0.72rem', background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
                padding: '4px 12px', borderRadius: '50px', fontWeight: 500,
              }}>{m}</span>
            ))}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <h4 style={{ marginBottom: '8px' }}>{t('detail.equipmentNeeded')}</h4>
          <p style={{ fontSize: '0.85rem' }}>{exercise.equipmentNeeded}</p>
        </div>
      </div>
    </div>
  );
}

