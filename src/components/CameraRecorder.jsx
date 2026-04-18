// ─── Camera Recorder with Grid Overlay ───
// Records front and side angle videos for exercise form analysis.
// Designed for mobile: uses rear camera, supports angle switching,
// shows recording timer, and returns video blobs.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Square, RotateCcw, Check, FlipHorizontal, Clock, AlertCircle } from 'lucide-react';
import GridOverlay from './GridOverlay';

const ANGLES = ['front', 'side'];
const MAX_DURATION = 60; // seconds

export default function CameraRecorder({ onComplete, onCancel, exerciseName }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [currentAngle, setCurrentAngle] = useState(0); // 0 = front, 1 = side
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordings, setRecordings] = useState({}); // { front: Blob, side: Blob }
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'

  const angleName = ANGLES[currentAngle];
  const hasRecording = !!recordings[angleName];
  const allDone = recordings.front && recordings.side;

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setError('');
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setCameraReady(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCamera]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp9' };
    let recorder;
    try {
      recorder = new MediaRecorder(streamRef.current, options);
    } catch {
      recorder = new MediaRecorder(streamRef.current);
    }
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordings(prev => ({ ...prev, [angleName]: blob }));
      setRecording(false);
      setElapsed(0);
      clearInterval(timerRef.current);
    };

    recorder.start(100);
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= MAX_DURATION - 1) {
          stopRecording();
          return MAX_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
  };

  const retakeAngle = () => {
    setRecordings(prev => {
      const next = { ...prev };
      delete next[angleName];
      return next;
    });
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const nextAngle = () => {
    if (currentAngle < ANGLES.length - 1) {
      setCurrentAngle(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onComplete(recordings);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#000', display: 'flex', flexDirection: 'column',
      height: '100vh', height: '100dvh', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: 'env(safe-area-inset-top, 12px) 16px 12px',
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 3,
      }}>
        <button onClick={() => {
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          onCancel();
        }} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
          padding: '8px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600,
        }}>
          Cancel
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
            {exerciseName || 'Record Exercise'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {angleName} angle {currentAngle + 1}/{ANGLES.length}
          </div>
        </div>
        <button onClick={flipCamera} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
          width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FlipHorizontal size={16} />
        </button>
      </div>

      {/* Camera viewfinder */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          }}
        />
        <GridOverlay />

        {/* Angle indicator */}
        <div style={{
          position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          padding: '8px 20px', borderRadius: '50px', zIndex: 3,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Camera size={14} color="white" />
          <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {angleName} view
          </span>
          {hasRecording && <Check size={14} color="#4CAF50" />}
        </div>

        {/* Recording timer */}
        {recording && (
          <div style={{
            position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(200,0,0,0.8)', padding: '6px 16px', borderRadius: '50px',
            display: 'flex', alignItems: 'center', gap: '6px', zIndex: 3,
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', background: '#FF4444',
              animation: 'pulse 1s infinite',
            }} />
            <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(elapsed)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem' }}>
              / {formatTime(MAX_DURATION)}
            </span>
          </div>
        )}

        {/* Progress bar when recording */}
        {recording && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '4px', background: 'rgba(255,255,255,0.2)', zIndex: 3,
          }}>
            <div style={{
              height: '100%', background: '#FF4444',
              width: `${(elapsed / MAX_DURATION) * 100}%`,
              transition: 'width 1s linear',
            }} />
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px', padding: '40px', zIndex: 3,
          }}>
            <AlertCircle size={40} color="#FF6B6B" />
            <p style={{ color: 'white', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}
      </div>

      {/* Controls — always visible above phone nav bar */}
      <div style={{
        padding: '16px 20px 32px',
        paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 32px), 48px)',
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px',
        zIndex: 3,
        flexShrink: 0,
      }}>
        {!recording && hasRecording ? (
          <>
            <button onClick={retakeAngle} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              padding: '12px 20px', borderRadius: '50px',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.75rem', fontWeight: 600,
            }}>
              <RotateCcw size={14} /> Retake
            </button>

            {!allDone && currentAngle < ANGLES.length - 1 ? (
              <button onClick={nextAngle} style={{
                background: 'var(--color-accent)', border: 'none', color: 'white',
                padding: '14px 28px', borderRadius: '50px',
                fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                Next: Side Angle
              </button>
            ) : allDone ? (
              <button onClick={handleSubmit} style={{
                background: '#4CAF50', border: 'none', color: 'white',
                padding: '14px 28px', borderRadius: '50px',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                <Check size={16} /> Submit Both
              </button>
            ) : null}
          </>
        ) : (
          <>
            {/* Angle selector dots */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {ANGLES.map((a, i) => (
                <div key={a} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: recordings[a] ? '#4CAF50' : i === currentAngle ? 'white' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.2s',
                }} />
              ))}
            </div>

            {/* Record button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={!cameraReady}
              style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: recording ? 'transparent' : 'transparent',
                border: `4px solid ${recording ? '#FF4444' : 'white'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: cameraReady ? 'pointer' : 'default',
              }}
            >
              {recording ? (
                <Square size={28} fill="#FF4444" color="#FF4444" />
              ) : (
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: '#FF4444',
                }} />
              )}
            </button>

            <div style={{ width: '8px' }} /> {/* spacer */}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
