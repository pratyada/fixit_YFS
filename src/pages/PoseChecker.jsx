import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, CheckCircle2, Grid3x3, Circle, Square } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { analyzeMovement } from '../utils/movementAnalysis';

const POSE_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'], ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];

function calculateAngle(a, b, c) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

export default function PoseChecker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detector, setDetector] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [report, setReport] = useState(null);
  const [liveAngles, setLiveAngles] = useState({});
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const recordedFramesRef = useRef([]);
  const timerRef = useRef(null);

  const startCamera = async () => {
    setLoading(true); setError(null); setReport(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const tf = await import('@tensorflow/tfjs');
      await tf.setBackend('webgl');
      await tf.ready();
      const pd = await import('@tensorflow-models/pose-detection');
      const det = await pd.createDetector(pd.SupportedModels.MoveNet, {
        modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING, enableSmoothing: true,
      });
      setDetector(det); setCameraOn(true); setLoading(false);
    } catch (err) {
      setError(err.message.includes('Permission') || err.message.includes('NotAllowed')
        ? 'Camera permission denied. Please allow camera access in your browser.'
        : `Failed to initialize: ${err.message}`);
      setLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (timerRef.current) clearInterval(timerRef.current);
    setCameraOn(false); setRecording(false); setRecordTimer(0);
  }, []);

  const startRecording = () => {
    recordedFramesRef.current = [];
    setRecording(true);
    setRecordTimer(0);
    timerRef.current = setInterval(() => setRecordTimer(t => t + 1), 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const analysis = analyzeMovement(recordedFramesRef.current);
    setReport(analysis);
    stopCamera();
  };

  // Main detection loop
  useEffect(() => {
    if (!cameraOn || !detector || !videoRef.current || !canvasRef.current) return;
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
          ctx.strokeStyle = 'rgba(176,196,187,0.3)';
          ctx.lineWidth = 1;
          const cols = 6, rows = 8;
          for (let i = 1; i < cols; i++) {
            const x = (canvas.width / cols) * i;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
          }
          for (let i = 1; i < rows; i++) {
            const y = (canvas.height / rows) * i;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(176,196,187,0.5)';
          ctx.lineWidth = 1.5;
          const cx = canvas.width / 2, cy = canvas.height / 2;
          ctx.beginPath(); ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15); ctx.stroke();
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
            recordedFramesRef.current.push({
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
  }, [cameraOn, detector, showGrid, recording]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const scoreColor = (s) => s >= 80 ? '#4CAF50' : s >= 60 ? '#FFC107' : s >= 40 ? '#FF9800' : '#F44336';

  // ─── FULLSCREEN CAMERA VIEW (when camera is on) ───
  if (cameraOn || loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: '#000', display: 'flex', flexDirection: 'column',
      }}>
        {/* Camera viewfinder — fills the screen */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video ref={videoRef} playsInline muted style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', transform: 'scaleX(-1)',
          }} />
          <canvas ref={canvasRef} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', transform: 'scaleX(-1)',
          }} />

          {/* Recording indicator */}
          {recording && (
            <div style={{
              position: 'absolute', top: 'env(safe-area-inset-top, 14px)', left: '14px', zIndex: 10,
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
              padding: '8px 16px', borderRadius: '50px',
              marginTop: '14px',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%', background: '#FF4444',
                animation: 'pulse 1s ease-in-out infinite',
              }} />
              <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>
                REC {formatTime(recordTimer)}
              </span>
            </div>
          )}

          {/* Live angles overlay */}
          {cameraOn && liveAngles.leftKnee && (
            <div style={{
              position: 'absolute', top: 'env(safe-area-inset-top, 14px)', right: '14px', zIndex: 10,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              padding: '10px 14px', borderRadius: '12px',
              color: 'white', fontSize: '0.75rem', marginTop: '14px',
            }}>
              <div>L Knee: <strong>{liveAngles.leftKnee}°</strong></div>
              {liveAngles.rightKnee && <div>R Knee: <strong>{liveAngles.rightKnee}°</strong></div>}
              {liveAngles.leftHip && <div>L Hip: <strong>{liveAngles.leftHip}°</strong></div>}
            </div>
          )}

          {/* Grid toggle */}
          {cameraOn && (
            <button onClick={() => setShowGrid(!showGrid)} style={{
              position: 'absolute', bottom: '14px', right: '14px', zIndex: 10,
              background: showGrid ? 'rgba(176,196,187,0.8)' : 'rgba(0,0,0,0.4)',
              color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer',
            }}>
              <Grid3x3 size={20} />
            </button>
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
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px', padding: '40px', zIndex: 10,
            }}>
              <AlertCircle size={36} color="#ef5350" />
              <p style={{ fontSize: '0.85rem', color: '#ef9a9a', textAlign: 'center' }}>{error}</p>
              <button onClick={startCamera} style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                padding: '10px 20px', borderRadius: '50px', border: 'none',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              }}>Try Again</button>
            </div>
          )}
        </div>

        {/* Bottom controls bar */}
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
          zIndex: 10,
        }}>
          {!recording ? (
            <>
              <button onClick={stopCamera} style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                padding: '12px 18px', borderRadius: '50px', border: 'none',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <CameraOff size={14} /> Close
              </button>

              {/* Big record button */}
              <button onClick={startRecording} style={{
                width: '72px', height: '72px', borderRadius: '50%',
                border: '4px solid white', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: '#FF4444',
                }} />
              </button>

              <div style={{ width: '80px' }} /> {/* spacer to center record button */}
            </>
          ) : (
            <button onClick={stopRecording} style={{
              width: '72px', height: '72px', borderRadius: '50%',
              border: '4px solid #FF4444', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Square size={28} fill="#FF4444" color="#FF4444" />
            </button>
          )}
        </div>

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>
    );
  }

  // ─── REPORT VIEW ───
  if (report && !report.error) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Score header */}
        <div style={{
          background: `linear-gradient(135deg, ${scoreColor(report.overall)}, #4E4E53)`,
          borderRadius: '20px', padding: '28px', color: 'white', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '8px' }}>
            Movement Analysis Complete
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

        {/* Category Breakdown */}
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
                  <div style={{
                    height: '100%', width: `${cat.score}%`, borderRadius: '4px',
                    background: `linear-gradient(90deg, ${scoreColor(cat.score)}, ${scoreColor(cat.score)}88)`,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text)', marginTop: '3px' }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Faults */}
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
                  <span style={{
                    fontSize: '0.88rem', fontWeight: 700,
                    color: fault.severity === 'high' ? '#C62828' : fault.severity === 'moderate' ? '#E65100' : '#2E7D32',
                  }}>{fault.name}</span>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                    padding: '2px 8px', borderRadius: '50px',
                    background: fault.severity === 'high' ? '#FFCDD2' : fault.severity === 'moderate' ? '#FFE082' : '#C8E6C9',
                    color: fault.severity === 'high' ? '#C62828' : fault.severity === 'moderate' ? '#F57F17' : '#2E7D32',
                  }}>{fault.severity}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '6px', lineHeight: 1.5 }}>{fault.description}</p>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-secondary)', fontWeight: 500 }}>
                  {fault.tip}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Joint Angles */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h4 style={{ marginBottom: '14px' }}>Joint Angle Measurements</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {Object.entries(report.angles).map(([joint, data]) => (
              <div key={joint} style={{
                background: 'var(--color-bg-alt)', borderRadius: '12px', padding: '14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', marginBottom: '6px' }}>
                  {joint.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{data.avg}°</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text)', marginTop: '4px' }}>
                  Min {data.min}° — Max {data.max}°
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Chart */}
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
          <button onClick={() => { setReport(null); startCamera(); }} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--color-secondary)', color: 'white',
            padding: '12px 24px', borderRadius: '50px', border: 'none',
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '1.2px', cursor: 'pointer',
          }}>
            <Camera size={14} /> Record Another
          </button>
          <button onClick={() => setReport(null)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'white', color: 'var(--color-text)',
            padding: '12px 24px', borderRadius: '50px',
            border: '1px solid var(--color-border)',
            fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '1.2px', cursor: 'pointer',
          }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  // ─── START SCREEN (camera off, no report) ───
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hidden video/canvas for when camera starts */}
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div>
        <h1 style={{ marginBottom: '4px' }}>Pose Checker</h1>
        <p style={{ fontSize: '0.85rem' }}>AI-powered movement analysis — record your set for a full form report</p>
      </div>

      {report?.error && (
        <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '14px', border: '1px solid #FFE082', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} color="#F57F17" />
          <div style={{ fontSize: '0.82rem', color: '#E65100' }}>{report.error}</div>
        </div>
      )}

      {/* Big CTA card */}
      <div style={{
        background: '#1a1a1a', borderRadius: '20px', overflow: 'hidden',
        position: 'relative', aspectRatio: '3/4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: 'white', zIndex: 1, padding: '32px' }}>
          <Camera size={52} style={{ margin: '0 auto 18px', display: 'block', opacity: 0.3 }} />
          <h2 style={{ color: 'white', marginBottom: '10px' }}>Movement Analysis</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Start the camera, perform your exercise, and get a detailed form score with specific feedback.
          </p>
          <button onClick={startCamera} style={{
            background: '#708E86', color: 'white',
            padding: '14px 32px', borderRadius: '50px', border: 'none',
            fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '1.5px', cursor: 'pointer', display: 'inline-flex',
            alignItems: 'center', gap: '8px',
          }}>
            <Camera size={16} /> Start Camera
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
        <h4 style={{ marginBottom: '14px' }}>How It Works</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { n: '1', t: 'Start Camera', d: 'Allow camera access and position yourself 6-8 feet away' },
            { n: '2', t: 'Hit Record', d: 'Tap the red button — frames are captured in real time' },
            { n: '3', t: 'Perform Exercise', d: 'Move through 3-5 reps with your natural form' },
            { n: '4', t: 'Get Your Score', d: 'Stop recording for a full analysis with score and form faults' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--color-accent)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '2px' }}>{s.t}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text)' }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: 'var(--color-bg-alt)', borderRadius: '14px', padding: '18px', border: '1px solid var(--color-border)' }}>
        <h4 style={{ marginBottom: '10px' }}>Tips for Best Results</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.82rem' }}>
          <div>• Stand 6-8 feet from camera, <strong>full body visible</strong></div>
          <div>• Camera at <strong>hip height</strong> for squats/lunges</div>
          <div>• Wear <strong>fitted clothing</strong> for better tracking</div>
          <div>• Record <strong>3-5 reps</strong> for best analysis</div>
          <div>• Good <strong>lighting</strong> — face a window if possible</div>
        </div>
      </div>
    </div>
  );
}
