import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle2, Grid3x3, Square, ChevronRight, RotateCcw, Check, ArrowLeft, Zap } from 'lucide-react';
import { analyzeMovement } from '../utils/movementAnalysis';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { addKioskSession } from '../lib/firestore';

const POSE_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'], ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];

const ANGLES = ['front', 'side'];

function calculateAngle(a, b, c) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

const scoreColor = (s) => s >= 80 ? '#4CAF50' : s >= 60 ? '#FFC107' : s >= 40 ? '#FF9800' : '#F44336';
const scoreLabel = (s) => s >= 80 ? 'Excellent!' : s >= 60 ? 'Good Form' : s >= 40 ? 'Needs Work' : 'Keep Practicing';
const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const BODY_ICONS = { 'Lower Body': '🦵', 'Upper Body': '💪', Core: '🎯' };

export default function ClinicKiosk() {
  const [step, setStep] = useState('select'); // select | camera | report
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detector, setDetector] = useState(null);
  const [showGrid, setShowGrid] = useState(true);

  // Recording
  const [currentAngle, setCurrentAngle] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [angleRecorded, setAngleRecorded] = useState({ front: false, side: false });
  const [liveAngles, setLiveAngles] = useState({});
  const [report, setReport] = useState(null);

  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const recordedFramesRef = useRef({ front: [], side: [] });
  const timerRef = useRef(null);
  // Auto-reset timer: go back to exercise select after inactivity
  const idleRef = useRef(null);

  const angleName = ANGLES[currentAngle];

  // Reset idle timer on any interaction
  const resetIdle = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    if (step === 'report') {
      idleRef.current = setTimeout(() => {
        setStep('select');
        setReport(null);
        setSelectedExercise(null);
      }, 60000); // 60s on report screen
    }
  }, [step]);

  useEffect(() => { resetIdle(); return () => { if (idleRef.current) clearTimeout(idleRef.current); }; }, [step, resetIdle]);

  // Camera controls
  const startCamera = async () => {
    setLoading(true); setError(null);
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (!detector) {
        const tf = await import('@tensorflow/tfjs');
        await tf.setBackend('webgl');
        await tf.ready();
        const pd = await import('@tensorflow-models/pose-detection');
        const det = await pd.createDetector(pd.SupportedModels.MoveNet, {
          modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING, enableSmoothing: true,
        });
        setDetector(det);
      }
      setCameraReady(true); setLoading(false);
    } catch (err) {
      setError(err.message.includes('Permission') || err.message.includes('NotAllowed')
        ? 'Camera permission denied. Please allow camera access.'
        : `Failed: ${err.message}`);
      setLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (timerRef.current) clearInterval(timerRef.current);
    setCameraReady(false); setRecording(false); setRecordTimer(0);
  }, []);

  const startRecording = () => {
    recordedFramesRef.current[angleName] = [];
    setRecording(true);
    setRecordTimer(0);
    timerRef.current = setInterval(() => setRecordTimer(t => t + 1), 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setAngleRecorded(prev => ({ ...prev, [angleName]: true }));
  };

  const retakeAngle = () => {
    recordedFramesRef.current[angleName] = [];
    setAngleRecorded(prev => ({ ...prev, [angleName]: false }));
  };

  const nextAngle = () => {
    if (currentAngle < ANGLES.length - 1) {
      setCurrentAngle(1);
      setRecordTimer(0);
    }
  };

  const finishAndAnalyze = async () => {
    const allFrames = [...(recordedFramesRef.current.front || []), ...(recordedFramesRef.current.side || [])];
    const analysis = analyzeMovement(allFrames);
    setReport(analysis);
    stopCamera();
    setStep('report');

    // Save to Firestore for admin tracking
    if (analysis && !analysis.error) {
      try {
        await addKioskSession({
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
          score: analysis.overall,
          categories: analysis.categories,
          faults: analysis.faults?.map(f => ({ name: f.name, severity: f.severity })) || [],
          duration: analysis.duration,
          totalFrames: analysis.totalFrames,
        });
      } catch (e) {
        console.error('Failed to save kiosk session:', e);
      }
    }
  };

  const selectExercise = (ex) => {
    setSelectedExercise(ex);
    setCurrentAngle(0);
    setAngleRecorded({ front: false, side: false });
    recordedFramesRef.current = { front: [], side: [] };
    setReport(null);
    setStep('camera');
    setTimeout(() => startCamera(), 100);
  };

  const backToSelect = () => {
    stopCamera();
    setStep('select');
    setReport(null);
    setSelectedExercise(null);
  };

  // Detection loop
  useEffect(() => {
    if (!cameraReady || !detector || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const detect = async () => {
      if (!video.videoWidth) { animFrameRef.current = requestAnimationFrame(detect); return; }
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      try {
        const poses = await detector.estimatePoses(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (showGrid) {
          ctx.strokeStyle = 'rgba(176,196,187,0.2)';
          ctx.lineWidth = 1;
          for (let i = 1; i < 4; i++) {
            const x = (canvas.width / 4) * i;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            const y = (canvas.height / 4) * i;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
          }
        }

        if (poses.length > 0) {
          const keypoints = poses[0].keypoints;
          const kpMap = {};
          keypoints.forEach(k => { kpMap[k.name] = k; });

          POSE_CONNECTIONS.forEach(([a, b]) => {
            const pa = kpMap[a], pb = kpMap[b];
            if (pa?.score > 0.3 && pb?.score > 0.3) {
              ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
              ctx.strokeStyle = recording ? '#FF6B6B' : '#B0C4BB';
              ctx.lineWidth = 4; ctx.stroke();
            }
          });

          keypoints.forEach(kp => {
            if (kp.score > 0.3) {
              ctx.beginPath(); ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
              ctx.fillStyle = kp.score > 0.6 ? '#708E86' : '#B7ACA0';
              ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            }
          });

          const drawAngle = (a, b, c) => {
            if (kpMap[a]?.score > 0.3 && kpMap[b]?.score > 0.3 && kpMap[c]?.score > 0.3) {
              const ang = calculateAngle(kpMap[a], kpMap[b], kpMap[c]);
              ctx.fillStyle = 'rgba(0,0,0,0.6)';
              ctx.fillRect(kpMap[b].x + 10, kpMap[b].y - 22, 56, 22);
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 14px Public Sans';
              ctx.fillText(`${ang}°`, kpMap[b].x + 14, kpMap[b].y - 5);
              return ang;
            }
            return null;
          };
          const lk = drawAngle('left_hip', 'left_knee', 'left_ankle');
          const rk = drawAngle('right_hip', 'right_knee', 'right_ankle');
          const lh = drawAngle('left_shoulder', 'left_hip', 'left_knee');
          setLiveAngles({ leftKnee: lk, rightKnee: rk, leftHip: lh });

          if (recording) {
            recordedFramesRef.current[angleName].push({
              timestamp: Date.now(),
              keypoints: keypoints.map(k => ({ name: k.name, x: k.x, y: k.y, score: k.score })),
            });
          }
        }
      } catch (e) { /* retry */ }
      animFrameRef.current = requestAnimationFrame(detect);
    };
    detect();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [cameraReady, detector, showGrid, recording, angleName]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  // ═══════════════════════════════════════════════
  // FULL-SCREEN KIOSK WRAPPER
  // ═══════════════════════════════════════════════
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Public Sans', system-ui, sans-serif",
      overflow: 'hidden',
    }} onClick={resetIdle}>

      {step === 'select' && <SelectScreen exercises={FIXIT_EXERCISES} onSelect={selectExercise} />}

      {step === 'camera' && (
        <CameraScreen
          exercise={selectedExercise}
          angleName={angleName}
          currentAngle={currentAngle}
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraReady={cameraReady}
          loading={loading}
          error={error}
          recording={recording}
          recordTimer={recordTimer}
          angleRecorded={angleRecorded}
          liveAngles={liveAngles}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onRetake={retakeAngle}
          onNextAngle={nextAngle}
          onFinish={finishAndAnalyze}
          onBack={backToSelect}
          onRetryCamera={startCamera}
          formatTime={formatTime}
        />
      )}

      {step === 'report' && report && !report.error && (
        <ReportScreen
          report={report}
          exercise={selectedExercise}
          onTryAgain={() => {
            setCurrentAngle(0);
            setAngleRecorded({ front: false, side: false });
            recordedFramesRef.current = { front: [], side: [] };
            setReport(null);
            setStep('camera');
            setTimeout(() => startCamera(), 100);
          }}
          onNewExercise={backToSelect}
        />
      )}

      {step === 'report' && report?.error && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px', padding: '40px',
        }}>
          <AlertCircle size={48} color="#ef5350" />
          <p style={{ color: '#ef9a9a', textAlign: 'center', fontSize: '1.1rem' }}>{report.error}</p>
          <button onClick={backToSelect} style={kioskBtn('#863bff')}>Try Another Exercise</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .kiosk-fade { animation: fadeIn 0.4s ease-out; }
        .kiosk-scale { animation: scaleIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}

// ─── Shared button style ───
function kioskBtn(bg, size = 'normal') {
  return {
    background: bg, border: 'none', color: 'white',
    padding: size === 'large' ? '18px 40px' : '14px 28px',
    borderRadius: '60px',
    fontSize: size === 'large' ? '1rem' : '0.85rem',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'inline-flex', alignItems: 'center', gap: '8px',
  };
}

// ═══════════════════════════════════════════════
// EXERCISE SELECT SCREEN (iPad-optimized grid)
// ═══════════════════════════════════════════════
function SelectScreen({ exercises, onSelect }) {
  return (
    <div className="kiosk-fade" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'auto', padding: '40px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #863bff, #7e14ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={24} color="white" />
          </div>
          <span style={{
            fontSize: '2rem', fontWeight: 800, color: 'white',
            letterSpacing: '3px',
          }}>
            FIXIT
          </span>
        </div>
        <h1 style={{
          color: 'white', fontSize: '1.8rem', fontWeight: 300,
          marginBottom: '8px',
        }}>
          Check Your Form
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
          Tap an exercise to get your AI pose score
        </p>
      </div>

      {/* Exercise Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
      }}>
        {exercises.map(ex => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            style={{
              display: 'flex', flexDirection: 'column',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '28px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.25s',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(134,59,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(134,59,255,0.4)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', marginBottom: '16px',
            }}>
              <span style={{ fontSize: '2rem' }}>{BODY_ICONS[ex.bodyPart] || '🏋️'}</span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1px', padding: '4px 12px', borderRadius: '50px',
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
              }}>
                {ex.difficulty}
              </span>
            </div>
            <div style={{
              fontSize: '1.3rem', fontWeight: 700, color: 'white',
              marginBottom: '6px',
            }}>
              {ex.name}
            </div>
            <div style={{
              fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.5, marginBottom: '16px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {ex.description}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginTop: 'auto',
              fontSize: '0.75rem', fontWeight: 600, color: '#863bff',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              <Camera size={14} /> Start Pose Check <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', marginTop: '40px', padding: '20px',
        color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem',
      }}>
        Powered by FIXIT &bull; yourformsux.com
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CAMERA SCREEN
// ═══════════════════════════════════════════════
function CameraScreen({
  exercise, angleName, currentAngle, videoRef, canvasRef,
  cameraReady, loading, error, recording, recordTimer,
  angleRecorded, liveAngles, showGrid,
  onToggleGrid, onStartRecording, onStopRecording,
  onRetake, onNextAngle, onFinish, onBack, onRetryCamera, formatTime,
}) {
  const hasCurrentRecording = angleRecorded[angleName];
  const allDone = angleRecorded.front && angleRecorded.side;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '16px 24px',
        paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 10, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
          padding: '10px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>{exercise?.name}</div>
          <div style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '1.5px',
          }}>
            {angleName} angle &bull; {currentAngle + 1}/{ANGLES.length}
          </div>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      {/* Camera viewfinder */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video ref={videoRef} playsInline muted style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transform: 'scaleX(-1)',
        }} />
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transform: 'scaleX(-1)',
        }} />

        {/* Angle badge */}
        <div style={{
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          padding: '10px 24px', borderRadius: '50px', zIndex: 3,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Camera size={16} color="white" />
          <span style={{
            color: 'white', fontSize: '0.85rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '1.5px',
          }}>
            {angleName} view
          </span>
          {hasCurrentRecording && <Check size={16} color="#4CAF50" />}
        </div>

        {/* Recording indicator */}
        {recording && (
          <div style={{
            position: 'absolute', top: '72px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(200,0,0,0.8)', padding: '8px 20px', borderRadius: '50px',
            display: 'flex', alignItems: 'center', gap: '8px', zIndex: 3,
          }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%', background: '#FF4444',
              animation: 'pulse 1s infinite',
            }} />
            <span style={{ color: 'white', fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(recordTimer)}
            </span>
          </div>
        )}

        {/* Live angles panel */}
        {cameraReady && liveAngles.leftKnee && !recording && (
          <div style={{
            position: 'absolute', top: '20px', right: '20px', zIndex: 3,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            padding: '14px 18px', borderRadius: '14px',
            color: 'white', fontSize: '0.9rem',
          }}>
            <div>L Knee: <strong>{liveAngles.leftKnee}°</strong></div>
            {liveAngles.rightKnee && <div>R Knee: <strong>{liveAngles.rightKnee}°</strong></div>}
            {liveAngles.leftHip && <div>L Hip: <strong>{liveAngles.leftHip}°</strong></div>}
          </div>
        )}

        {/* Grid toggle */}
        {cameraReady && (
          <button onClick={onToggleGrid} style={{
            position: 'absolute', bottom: '20px', right: '20px', zIndex: 3,
            background: showGrid ? 'rgba(176,196,187,0.8)' : 'rgba(0,0,0,0.4)',
            color: 'white', border: 'none', padding: '12px', borderRadius: '12px',
            cursor: 'pointer',
          }}>
            <Grid3x3 size={22} />
          </button>
        )}

        {/* Recording progress bar */}
        {recording && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '5px', background: 'rgba(255,255,255,0.2)', zIndex: 3,
          }}>
            <div style={{
              height: '100%', background: '#FF4444',
              width: `${Math.min((recordTimer / 60) * 100, 100)}%`,
              transition: 'width 1s linear',
            }} />
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '16px', zIndex: 10,
          }}>
            <RefreshCw size={40} style={{ color: '#B0C4BB', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>Loading AI model...</p>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '16px', padding: '40px', zIndex: 10,
          }}>
            <AlertCircle size={44} color="#ef5350" />
            <p style={{ color: '#ef9a9a', textAlign: 'center', fontSize: '1rem' }}>{error}</p>
            <button onClick={onRetryCamera} style={kioskBtn('rgba(255,255,255,0.15)')}>Try Again</button>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{
        padding: '20px 24px',
        paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 20px), 36px)',
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
        zIndex: 10, flexShrink: 0,
      }}>
        {!recording && hasCurrentRecording ? (
          <>
            <button onClick={onRetake} style={kioskBtn('rgba(255,255,255,0.15)')}>
              <RotateCcw size={16} /> Retake
            </button>
            {!allDone && currentAngle === 0 ? (
              <button onClick={onNextAngle} style={kioskBtn('#863bff', 'large')}>
                Next: Side Angle
              </button>
            ) : allDone ? (
              <button onClick={onFinish} style={kioskBtn('#4CAF50', 'large')}>
                <Check size={18} /> Analyze Form
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px' }}>
              {ANGLES.map((a, i) => (
                <div key={a} style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: angleRecorded[a] ? '#4CAF50' : i === currentAngle ? 'white' : 'rgba(255,255,255,0.3)',
                }} />
              ))}
            </div>
            <button
              onClick={recording ? onStopRecording : onStartRecording}
              disabled={!cameraReady}
              style={{
                width: '84px', height: '84px', borderRadius: '50%',
                border: `4px solid ${recording ? '#FF4444' : 'white'}`,
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: cameraReady ? 'pointer' : 'default',
                opacity: cameraReady ? 1 : 0.4,
              }}
            >
              {recording ? (
                <Square size={32} fill="#FF4444" color="#FF4444" />
              ) : (
                <div style={{ width: '66px', height: '66px', borderRadius: '50%', background: '#FF4444' }} />
              )}
            </button>
            <div style={{ width: '30px' }} />
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// REPORT SCREEN (iPad-optimized)
// ═══════════════════════════════════════════════
function ReportScreen({ report, exercise, onTryAgain, onNewExercise }) {
  return (
    <div className="kiosk-fade" style={{
      flex: 1, overflow: 'auto', padding: '40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Big Score */}
      <div className="kiosk-scale" style={{
        background: `linear-gradient(135deg, ${scoreColor(report.overall)}22, ${scoreColor(report.overall)}08)`,
        border: `2px solid ${scoreColor(report.overall)}44`,
        borderRadius: '32px', padding: '48px', textAlign: 'center',
        width: '100%', maxWidth: '500px', marginBottom: '32px',
      }}>
        <div style={{
          fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px',
        }}>
          {exercise?.name}
        </div>
        <div style={{
          width: '140px', height: '140px', borderRadius: '50%',
          background: `${scoreColor(report.overall)}22`,
          border: `4px solid ${scoreColor(report.overall)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', flexDirection: 'column',
        }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
            {report.overall}
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>/ 100</div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
          {scoreLabel(report.overall)}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
          {report.duration}s recorded &bull; {report.totalFrames} frames analyzed
        </div>
      </div>

      {/* Score Breakdown + Faults in a 2-col grid for iPad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px', width: '100%', maxWidth: '900px', marginBottom: '32px',
      }}>
        {/* Categories */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)', padding: '24px',
        }}>
          <h4 style={{ color: 'white', marginBottom: '20px', fontSize: '1rem' }}>Score Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {report.categories.map(cat => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    {cat.icon} {cat.name}
                  </span>
                  <span style={{ fontWeight: 700, color: scoreColor(cat.score), fontSize: '1rem' }}>
                    {cat.score}
                  </span>
                </div>
                <div style={{
                  height: '8px', background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${cat.score}%`, borderRadius: '4px',
                    background: scoreColor(cat.score), transition: 'width 0.8s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Faults */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)', padding: '24px',
        }}>
          <h4 style={{ color: 'white', marginBottom: '20px', fontSize: '1rem' }}>Form Analysis</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.faults.map(fault => (
              <div key={fault.id} style={{
                padding: '14px', borderRadius: '12px',
                background: fault.severity === 'high' ? 'rgba(198,40,40,0.15)' :
                  fault.severity === 'moderate' ? 'rgba(245,127,23,0.15)' : 'rgba(46,125,50,0.15)',
                border: `1px solid ${
                  fault.severity === 'high' ? 'rgba(198,40,40,0.3)' :
                  fault.severity === 'moderate' ? 'rgba(245,127,23,0.3)' : 'rgba(46,125,50,0.3)'
                }`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {fault.severity === 'high' ? <AlertCircle size={16} color="#EF5350" /> :
                   fault.severity === 'moderate' ? <AlertCircle size={16} color="#FFA726" /> :
                   <CheckCircle2 size={16} color="#66BB6A" />}
                  <span style={{
                    fontSize: '0.9rem', fontWeight: 700,
                    color: fault.severity === 'high' ? '#EF5350' :
                      fault.severity === 'moderate' ? '#FFA726' : '#66BB6A',
                  }}>
                    {fault.name}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', lineHeight: 1.5 }}>
                  {fault.description}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                  {fault.tip}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Joint Angles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px', width: '100%', maxWidth: '900px', marginBottom: '40px',
      }}>
        {Object.entries(report.angles).map(([joint, data]) => (
          <div key={joint} style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)', padding: '18px', textAlign: 'center',
          }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '1px', color: '#863bff', marginBottom: '6px',
            }}>
              {joint.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white' }}>{data.avg}°</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              {data.min}° — {data.max}°
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px' }}>
        <button onClick={onTryAgain} style={kioskBtn('#863bff', 'large')}>
          <Camera size={18} /> Try Again
        </button>
        <button onClick={onNewExercise} style={kioskBtn('rgba(255,255,255,0.1)', 'large')}>
          New Exercise
        </button>
      </div>

      <div style={{
        textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem',
        paddingBottom: '20px',
      }}>
        Powered by FIXIT &bull; yourformsux.com
      </div>
    </div>
  );
}
