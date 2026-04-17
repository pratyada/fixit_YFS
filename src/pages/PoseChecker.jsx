import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, CheckCircle2, Grid3x3, Square, Search, ChevronRight, FlipHorizontal, RotateCcw, Check } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { analyzeMovement } from '../utils/movementAnalysis';
import { EXERCISE_LIBRARY, BODY_PARTS } from '../data/exercises';

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

export default function PoseChecker() {
  // Flow: 'select' → 'camera' → 'report'
  const [step, setStep] = useState('select');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [search, setSearch] = useState('');
  const [filterBody, setFilterBody] = useState('All');

  // Camera state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detector, setDetector] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [facingMode, setFacingMode] = useState('user');

  // Angle recording
  const [currentAngle, setCurrentAngle] = useState(0); // 0=front, 1=side
  const [recording, setRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [angleRecorded, setAngleRecorded] = useState({ front: false, side: false });
  const [liveAngles, setLiveAngles] = useState({});

  // Data
  const [report, setReport] = useState(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const recordedFramesRef = useRef({ front: [], side: [] });
  const timerRef = useRef(null);

  const angleName = ANGLES[currentAngle];

  // ─── Camera controls ───
  const startCamera = async () => {
    setLoading(true); setError(null);
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
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

  const finishAndAnalyze = () => {
    // Merge front + side frames for analysis
    const allFrames = [...(recordedFramesRef.current.front || []), ...(recordedFramesRef.current.side || [])];
    const analysis = analyzeMovement(allFrames);
    setReport(analysis);
    stopCamera();
    setStep('report');
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Restart camera when facingMode changes
  useEffect(() => {
    if (step === 'camera' && cameraReady) {
      startCamera();
    }
  }, [facingMode]);

  // ─── Detection loop ───
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
          ctx.strokeStyle = 'rgba(176,196,187,0.25)';
          ctx.lineWidth = 1;
          for (let i = 1; i < 4; i++) {
            const x = (canvas.width / 4) * i;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            const y = (canvas.height / 4) * i;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
          }
          // Center cross
          ctx.strokeStyle = 'rgba(112,142,134,0.4)';
          ctx.lineWidth = 1.5;
          const cx = canvas.width / 2, cy = canvas.height / 2;
          ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20); ctx.stroke();
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
              ctx.lineWidth = 3; ctx.stroke();
            }
          });

          keypoints.forEach(kp => {
            if (kp.score > 0.3) {
              ctx.beginPath(); ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = kp.score > 0.6 ? '#708E86' : '#B7ACA0';
              ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            }
          });

          const drawAngle = (a, b, c) => {
            if (kpMap[a]?.score > 0.3 && kpMap[b]?.score > 0.3 && kpMap[c]?.score > 0.3) {
              const ang = calculateAngle(kpMap[a], kpMap[b], kpMap[c]);
              ctx.fillStyle = 'rgba(0,0,0,0.6)';
              ctx.fillRect(kpMap[b].x + 8, kpMap[b].y - 18, 48, 18);
              ctx.fillStyle = '#fff';
              ctx.font = '11px Public Sans';
              ctx.fillText(`${ang}°`, kpMap[b].x + 12, kpMap[b].y - 4);
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

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const scoreColor = (s) => s >= 80 ? '#4CAF50' : s >= 60 ? '#FFC107' : s >= 40 ? '#FF9800' : '#F44336';

  // ═══════════════════════════════════════════════
  // STEP 1: SELECT EXERCISE
  // ═══════════════════════════════════════════════
  if (step === 'select') {
    const filtered = EXERCISE_LIBRARY.filter(e => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
      const matchBody = filterBody === 'All' || e.bodyPart === filterBody;
      return matchSearch && matchBody;
    });

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Pose Checker</h1>
          <p style={{ fontSize: '0.85rem' }}>Select an exercise to analyze your form</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..." style={{ paddingLeft: '34px', fontSize: '0.82rem' }} />
        </div>

        {/* Body part filter */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['All', ...BODY_PARTS].map(bp => (
            <button
              key={bp}
              onClick={() => setFilterBody(bp)}
              style={{
                padding: '6px 14px', borderRadius: '50px', border: 'none',
                background: filterBody === bp ? 'var(--color-secondary)' : 'white',
                color: filterBody === bp ? 'white' : 'var(--color-text)',
                fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: filterBody === bp ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {bp}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => {
                setSelectedExercise(ex);
                setCurrentAngle(0);
                setAngleRecorded({ front: false, side: false });
                recordedFramesRef.current = { front: [], side: [] };
                setReport(null);
                setStep('camera');
                setTimeout(() => startCamera(), 100);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                background: 'white', border: '1px solid var(--color-border)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Camera size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{ex.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>{ex.bodyPart} &bull; {ex.difficulty}</div>
              </div>
              <ChevronRight size={16} color="var(--color-border)" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STEP 2: FULLSCREEN CAMERA (front → side)
  // ═══════════════════════════════════════════════
  if (step === 'camera') {
    const hasCurrentRecording = angleRecorded[angleName];
    const allDone = angleRecorded.front && angleRecorded.side;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: '#000', display: 'flex', flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{
          padding: 'env(safe-area-inset-top, 12px) 16px 12px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10,
        }}>
          <button onClick={() => { stopCamera(); setStep('select'); }} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            padding: '8px 16px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 600,
          }}>
            Cancel
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'white', fontSize: '0.82rem', fontWeight: 600 }}>
              {selectedExercise?.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {angleName} angle &bull; {currentAngle + 1}/{ANGLES.length}
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
          <video ref={videoRef} playsInline muted style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          }} />
          <canvas ref={canvasRef} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          }} />

          {/* Angle badge */}
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
            {hasCurrentRecording && <Check size={14} color="#4CAF50" />}
          </div>

          {/* Recording indicator */}
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
                {formatTime(recordTimer)}
              </span>
            </div>
          )}

          {/* Live angles */}
          {cameraReady && liveAngles.leftKnee && !recording && (
            <div style={{
              position: 'absolute', top: '16px', right: '14px', zIndex: 3,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              padding: '10px 14px', borderRadius: '12px',
              color: 'white', fontSize: '0.72rem',
            }}>
              <div>L Knee: <strong>{liveAngles.leftKnee}°</strong></div>
              {liveAngles.rightKnee && <div>R Knee: <strong>{liveAngles.rightKnee}°</strong></div>}
              {liveAngles.leftHip && <div>L Hip: <strong>{liveAngles.leftHip}°</strong></div>}
            </div>
          )}

          {/* Grid toggle */}
          {cameraReady && (
            <button onClick={() => setShowGrid(!showGrid)} style={{
              position: 'absolute', bottom: '14px', right: '14px', zIndex: 3,
              background: showGrid ? 'rgba(176,196,187,0.8)' : 'rgba(0,0,0,0.4)',
              color: 'white', border: 'none', padding: '10px', borderRadius: '10px',
            }}>
              <Grid3x3 size={18} />
            </button>
          )}

          {/* Recording progress bar */}
          {recording && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '4px', background: 'rgba(255,255,255,0.2)', zIndex: 3,
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
              flexDirection: 'column', gap: '12px', zIndex: 10,
            }}>
              <RefreshCw size={32} style={{ color: '#B0C4BB', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Loading AI model...</p>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px', padding: '40px', zIndex: 10,
            }}>
              <AlertCircle size={36} color="#ef5350" />
              <p style={{ color: '#ef9a9a', textAlign: 'center', fontSize: '0.85rem' }}>{error}</p>
              <button onClick={startCamera} style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                padding: '10px 20px', borderRadius: '50px', border: 'none',
                fontSize: '0.72rem', fontWeight: 600,
              }}>Try Again</button>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
          zIndex: 10,
        }}>
          {!recording && hasCurrentRecording ? (
            // After recording an angle: retake or next/submit
            <>
              <button onClick={retakeAngle} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                padding: '12px 20px', borderRadius: '50px',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.72rem', fontWeight: 600,
              }}>
                <RotateCcw size={14} /> Retake
              </button>

              {!allDone && currentAngle === 0 ? (
                <button onClick={nextAngle} style={{
                  background: 'var(--color-accent)', border: 'none', color: 'white',
                  padding: '14px 28px', borderRadius: '50px',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                }}>
                  Next: Side Angle
                </button>
              ) : allDone ? (
                <button onClick={finishAndAnalyze} style={{
                  background: '#4CAF50', border: 'none', color: 'white',
                  padding: '14px 28px', borderRadius: '50px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                }}>
                  <Check size={16} /> Analyze Form
                </button>
              ) : null}
            </>
          ) : (
            // Record button + angle dots
            <>
              {/* Angle dots */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {ANGLES.map((a, i) => (
                  <div key={a} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: angleRecorded[a] ? '#4CAF50' : i === currentAngle ? 'white' : 'rgba(255,255,255,0.3)',
                  }} />
                ))}
              </div>

              {/* Big record/stop button */}
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={!cameraReady}
                style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  border: `4px solid ${recording ? '#FF4444' : 'white'}`,
                  background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: cameraReady ? 'pointer' : 'default',
                  opacity: cameraReady ? 1 : 0.4,
                }}
              >
                {recording ? (
                  <Square size={28} fill="#FF4444" color="#FF4444" />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FF4444' }} />
                )}
              </button>

              <div style={{ width: '24px' }} />
            </>
          )}
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STEP 3: REPORT
  // ═══════════════════════════════════════════════
  if (step === 'report' && report && !report.error) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Score header */}
        <div style={{
          background: `linear-gradient(135deg, ${scoreColor(report.overall)}, #4E4E53)`,
          borderRadius: '20px', padding: '28px', color: 'white', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '4px' }}>
            {selectedExercise?.name}
          </div>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.5, marginBottom: '12px' }}>
            Front + Side Analysis
          </div>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', flexDirection: 'column',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{report.overall}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.7 }}>/ 100</div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {report.overall >= 80 ? 'Excellent Form!' : report.overall >= 60 ? 'Good Form' : report.overall >= 40 ? 'Needs Improvement' : 'Poor Form'}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
            {report.duration}s recorded &bull; {report.totalFrames} frames analyzed
          </div>
        </div>

        {/* Categories */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h4 style={{ marginBottom: '16px' }}>Score Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.categories.map(cat => (
              <div key={cat.name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{cat.name}</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: scoreColor(cat.score) }}>{cat.score}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-bg-alt)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.score}%`, borderRadius: '4px', background: scoreColor(cat.score), transition: 'width 0.8s' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text)', marginTop: '3px' }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Faults */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h4 style={{ marginBottom: '14px' }}>Form Analysis</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.faults.map(fault => (
              <div key={fault.id} style={{
                padding: '14px', borderRadius: '12px',
                background: fault.severity === 'high' ? '#FFF3F0' : fault.severity === 'moderate' ? '#FFF8E1' : '#E8F5E9',
                border: `1px solid ${fault.severity === 'high' ? '#FFCDD2' : fault.severity === 'moderate' ? '#FFE082' : '#C8E6C9'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {fault.severity === 'high' ? <AlertCircle size={16} color="#C62828" /> :
                   fault.severity === 'moderate' ? <AlertCircle size={16} color="#F57F17" /> :
                   <CheckCircle2 size={16} color="#2E7D32" />}
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: fault.severity === 'high' ? '#C62828' : fault.severity === 'moderate' ? '#E65100' : '#2E7D32' }}>{fault.name}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: '6px', lineHeight: 1.5 }}>{fault.description}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 500 }}>{fault.tip}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Joint Angles */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h4 style={{ marginBottom: '14px' }}>Joint Angles</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {Object.entries(report.angles).map(([joint, data]) => (
              <div key={joint} style={{ background: 'var(--color-bg-alt)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', marginBottom: '6px' }}>
                  {joint.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{data.avg}°</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text)', marginTop: '4px' }}>
                  {data.min}° — {data.max}°
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {report.timeline.length > 3 && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h4 style={{ marginBottom: '14px' }}>Angle Timeline</h4>
            <div style={{ height: '200px' }}>
              <Line
                data={{
                  labels: report.timeline.map(t => `${t.time}s`),
                  datasets: [
                    { label: 'L Knee', data: report.timeline.map(t => t.leftKnee), borderColor: '#708E86', backgroundColor: 'rgba(112,142,134,0.08)', fill: true, tension: 0.3, pointRadius: 1 },
                    { label: 'R Knee', data: report.timeline.map(t => t.rightKnee), borderColor: '#B7ACA0', tension: 0.3, pointRadius: 1 },
                    { label: 'L Hip', data: report.timeline.map(t => t.leftHip), borderColor: '#D4A853', tension: 0.3, pointRadius: 1 },
                  ],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { labels: { font: { family: "'Public Sans'", size: 10 }, padding: 10 } } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 10 } },
                    y: { ticks: { font: { size: 9 } }, grid: { color: '#f5f5f5' } },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div style={{ background: '#EDF3F1', borderRadius: '16px', padding: '20px', border: '1px solid #D8E8E3' }}>
          <h4 style={{ marginBottom: '10px' }}>Recommendations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {report.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                <span style={{ color: '#708E86' }}>→</span> {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => { setStep('camera'); setCurrentAngle(0); setAngleRecorded({ front: false, side: false }); recordedFramesRef.current = { front: [], side: [] }; setReport(null); startCamera(); }} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--color-secondary)', color: 'white',
            padding: '12px 24px', borderRadius: '50px', border: 'none',
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', cursor: 'pointer',
          }}>
            <Camera size={14} /> Record Again
          </button>
          <button onClick={() => { setStep('select'); setReport(null); }} style={{
            background: 'white', color: 'var(--color-text)',
            padding: '12px 24px', borderRadius: '50px',
            border: '1px solid var(--color-border)',
            fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', cursor: 'pointer',
          }}>
            New Exercise
          </button>
        </div>
      </div>
    );
  }

  // Fallback (error in report)
  if (step === 'report' && report?.error) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={40} color="var(--color-danger)" style={{ margin: '0 auto 12px' }} />
        <h3>Analysis Failed</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginTop: '8px' }}>{report.error}</p>
        <button onClick={() => setStep('select')} style={{
          marginTop: '16px', background: 'var(--color-secondary)', color: 'white',
          padding: '12px 24px', borderRadius: '50px', border: 'none',
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', cursor: 'pointer',
        }}>
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
