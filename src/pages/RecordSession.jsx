// ─── Record Session Page ───
// Full flow: select exercise → record front+side → upload → view AI results

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Video, Clock, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import CameraRecorder from '../components/CameraRecorder';
import { uploadVideo } from '../lib/storage-firebase';
import { addSession, updateSession } from '../lib/firestore';

export default function RecordSession() {
  const { t } = useTranslation('exercises');
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const exercise = FIXIT_EXERCISES.find(e => e.id === exerciseId) || EXERCISE_LIBRARY.find(e => e.id === exerciseId);

  const [step, setStep] = useState('intro'); // 'intro' | 'recording' | 'uploading' | 'done' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState('');

  if (!exercise) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={40} color="var(--color-danger)" style={{ margin: '0 auto 12px' }} />
        <h3>{t('detail.exerciseNotFound')}</h3>
        <Link to="/exercises" style={{ fontSize: '0.8rem', marginTop: '12px', display: 'inline-block' }}>
          {t('detail.backToExercises')}
        </Link>
      </div>
    );
  }

  const handleRecordingComplete = async (recordings) => {
    setStep('uploading');
    try {
      // Create session doc in Firestore
      const sessionRef = await addSession(user.uid, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        status: 'UPLOADING',
      });
      const sid = sessionRef.id;
      setSessionId(sid);

      // Upload front video
      let frontResult = null;
      if (recordings.front) {
        setUploadProgress(0.1);
        frontResult = await uploadVideo(user.uid, sid, 'front', recordings.front, (p) => {
          setUploadProgress(p * 0.45);
        });
      }

      // Upload side video
      let sideResult = null;
      if (recordings.side) {
        setUploadProgress(0.5);
        sideResult = await uploadVideo(user.uid, sid, 'side', recordings.side, (p) => {
          setUploadProgress(0.5 + p * 0.45);
        });
      }

      // Update session with video paths
      await updateSession(user.uid, sid, {
        status: 'ANALYZED', // Will be 'ANALYZING' when AI is connected
        frontVideoKey: frontResult?.path || null,
        frontVideoUrl: frontResult?.url || null,
        sideVideoKey: sideResult?.path || null,
        sideVideoUrl: sideResult?.url || null,
        videoMimeType: 'video/webm',
        // Placeholder AI result until real engine is connected
        aiScore: Math.floor(Math.random() * 20) + 75,
        aiSummary: `Good form on ${exercise.name}. Recording captured successfully from both angles.`,
        aiModelVersion: 'fixit-v0.1-placeholder',
      });

      setUploadProgress(1);
      setStep('done');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
      setStep('error');
    }
  };

  if (step === 'recording') {
    return (
      <CameraRecorder
        exerciseName={exercise.name}
        onComplete={handleRecordingComplete}
        onCancel={() => setStep('intro')}
      />
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back button */}
      <Link to={`/exercises/${exerciseId}`} style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-accent)',
      }}>
        <ArrowLeft size={14} /> {t('detail.backToExercises')}
      </Link>

      {step === 'intro' && (
        <>
          {/* Exercise info card */}
          <div style={{
            background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
            borderRadius: '20px', padding: '24px', color: 'white',
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
              {t('detail.recordSession')}
            </div>
            <h2 style={{ color: 'white', marginBottom: '8px' }}>{exercise.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.5 }}>
              {exercise.description}
            </p>
          </div>

          {/* Instructions */}
          <div style={{
            background: 'white', borderRadius: '16px',
            border: '1px solid var(--color-border)', padding: '20px',
          }}>
            <h3 style={{ marginBottom: '14px' }}>{'How it works'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <StepInfo
                num="1"
                icon={<Video size={16} />}
                title="Record front angle"
                desc="Position your phone facing you and record your exercise"
              />
              <StepInfo
                num="2"
                icon={<Video size={16} />}
                title="Record side angle"
                desc="Turn 90° and record the same exercise from the side"
              />
              <StepInfo
                num="3"
                icon={<Target size={16} />}
                title="AI Analysis"
                desc="Our AI analyzes your form and gives you a score with feedback"
              />
            </div>
          </div>

          {/* Tips */}
          <div style={{
            background: '#FFF8E1', borderRadius: '14px', padding: '16px',
            border: '1px solid #FFCC80',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#F57F17', marginBottom: '8px' }}>
              Tips for best results
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: '#E65100', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Use the grid lines to center yourself</li>
              <li>Ensure good lighting</li>
              <li>Place phone at waist height, 6-8 feet away</li>
              <li>Wear fitted clothing for better tracking</li>
            </ul>
          </div>

          {/* Start button */}
          <button
            onClick={() => setStep('recording')}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              background: 'var(--color-secondary)', color: 'white',
              fontWeight: 700, fontSize: '0.82rem',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Video size={18} /> {'Start Recording'}
          </button>
        </>
      )}

      {step === 'uploading' && (
        <div style={{
          background: 'white', borderRadius: '20px',
          border: '1px solid var(--color-border)',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <Upload size={40} color="var(--color-accent)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Uploading your videos...</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '20px' }}>
            Please wait while we upload and analyze your recording
          </p>
          {/* Progress bar */}
          <div style={{
            height: '8px', background: 'var(--color-bg-alt)',
            borderRadius: '4px', overflow: 'hidden', marginBottom: '8px',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.round(uploadProgress * 100)}%`,
              background: 'linear-gradient(90deg, #708E86, #B0C4BB)',
              borderRadius: '4px', transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
            {Math.round(uploadProgress * 100)}% complete
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{
          background: 'white', borderRadius: '20px',
          border: '1px solid #C8E6C9',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <CheckCircle2 size={48} color="#4CAF50" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Recording Submitted!</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '24px' }}>
            Your exercise has been recorded and uploaded. Your practitioner will review it and provide feedback.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'var(--color-secondary)', color: 'white',
                fontWeight: 600, fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                border: 'none', cursor: 'pointer',
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate(`/exercises/${exerciseId}`)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'var(--color-bg-alt)', color: 'var(--color-secondary)',
                fontWeight: 600, fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                border: '1px solid var(--color-border)', cursor: 'pointer',
              }}
            >
              View Exercise
            </button>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div style={{
          background: 'white', borderRadius: '20px',
          border: '1px solid #FFCDD2',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <AlertCircle size={48} color="#C62828" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Upload Failed</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '16px' }}>
            {error || 'Something went wrong. Please try again.'}
          </p>
          <button
            onClick={() => setStep('intro')}
            style={{
              padding: '14px 28px', borderRadius: '12px',
              background: 'var(--color-secondary)', color: 'white',
              fontWeight: 600, fontSize: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              border: 'none', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

function StepInfo({ num, icon, title, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'var(--color-accent)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
      }}>
        {num}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '2px' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text)' }}>
          {desc}
        </div>
      </div>
    </div>
  );
}
