import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Pose Challenge — always-on clinic-TV kiosk ─────────────────────────────
// Full-screen, no login. Camera is always on. Raise both hands to start; do as
// many good reps as you can in 30s; get a fun score. Auto-resets for the next
// person. Reuses MoveNet (SinglePose Lightning) for pose keypoints.

const EXERCISES = [
  {
    id: 'squat', name: 'Squats', emoji: '🦵', cue: 'Sit back and down, then stand tall',
    joint: 'knee', down: 110, up: 150, ideal: 90, mirrorOk: true,
  },
  {
    id: 'curl', name: 'Bicep Curls', emoji: '💪', cue: 'Curl all the way up, then lower',
    joint: 'elbow', down: 70, up: 150, ideal: 45, mirrorOk: true,
  },
  {
    id: 'situp', name: 'Sit-ups', emoji: '🎯', cue: 'Rise up, then lower back down',
    joint: 'hip', down: 120, up: 150, ideal: 95, mirrorOk: true,
  },
];
const ROUND_SECONDS = 30;

// angle (degrees) at joint B for points A-B-C
function angle(A, B, C) {
  if (!A || !B || !C) return null;
  const ab = { x: A.x - B.x, y: A.y - B.y };
  const cb = { x: C.x - B.x, y: C.y - B.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (!mag) return null;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI;
}

// per-exercise "signal" angle from a keypoint map (averaging both sides when visible)
function signalAngle(kp, joint) {
  const g = (n) => { const k = kp[n]; return k && k.score > 0.3 ? k : null; };
  const pairs = {
    knee: [['left_hip', 'left_knee', 'left_ankle'], ['right_hip', 'right_knee', 'right_ankle']],
    elbow: [['left_shoulder', 'left_elbow', 'left_wrist'], ['right_shoulder', 'right_elbow', 'right_wrist']],
    hip: [['left_shoulder', 'left_hip', 'left_knee'], ['right_shoulder', 'right_hip', 'right_knee']],
  }[joint];
  const vals = [];
  for (const [a, b, c] of pairs) { const v = angle(g(a), g(b), g(c)); if (v != null) vals.push(v); }
  return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
}

export default function PoseChallenge() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);

  const [phase, setPhase] = useState('loading'); // loading | attract | ready | active | result | error
  const [exIdx, setExIdx] = useState(0);
  const [count, setCount] = useState(0);         // countdown number (ready)
  const [reps, setReps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [result, setResult] = useState(null);    // {reps, form, score}
  const [feedback, setFeedback] = useState('');  // "step into frame" etc.

  // mutable state read inside the rAF loop
  const phaseRef = useRef(phase);
  const exRef = useRef(EXERCISES[0]);
  const repStateRef = useRef({ stage: 'up', reps: 0, formSum: 0, bestRange: 0 });
  const gestureHeldRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { exRef.current = EXERCISES[exIdx]; }, [exIdx]);

  // ── camera + detector ──
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const pd = await import('@tensorflow-models/pose-detection');
        detectorRef.current = await pd.createDetector(pd.SupportedModels.MoveNet, {
          modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING, enableSmoothing: true,
        });
        setPhase('attract');
        loop();
      } catch (e) {
        console.error('[Challenge] camera/detector failed:', e);
        setPhase('error');
      }
    })();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── the always-running detection loop ──
  const loop = useCallback(async () => {
    const video = videoRef.current, canvas = canvasRef.current, det = detectorRef.current;
    if (video && canvas && det && video.videoWidth) {
      let kp = {};
      try {
        const poses = await det.estimatePoses(video);
        if (poses[0]) poses[0].keypoints.forEach((k) => { kp[k.name] = k; });
      } catch { /* skip frame */ }
      drawSkeleton(canvas, video, kp);

      const ph = phaseRef.current;
      // ATTRACT: watch for both-hands-up gesture
      if (ph === 'attract') {
        const lw = kp.left_wrist, rw = kp.right_wrist, ls = kp.left_shoulder, rs = kp.right_shoulder;
        const up = lw && rw && ls && rs && lw.score > 0.3 && rw.score > 0.3 && ls.score > 0.3 && rs.score > 0.3
          && lw.y < ls.y - 30 && rw.y < rs.y - 30;
        gestureHeldRef.current = up ? gestureHeldRef.current + 1 : 0;
        if (gestureHeldRef.current > 12) { gestureHeldRef.current = 0; startRound(); }
      }
      // ACTIVE: count reps live
      else if (ph === 'active') {
        const ex = exRef.current;
        const a = signalAngle(kp, ex.joint);
        const st = repStateRef.current;
        if (a == null) { setFeedback('Step into the camera'); }
        else {
          setFeedback('');
          if (st.stage === 'up' && a < ex.down) { st.stage = 'down'; st.bestRange = a; }
          else if (st.stage === 'down') {
            if (a < st.bestRange) st.bestRange = a;               // track deepest point
            if (a > ex.up) {                                       // completed a rep
              st.stage = 'up';
              st.reps += 1;
              // form for this rep: how close the deepest point got to ideal (0..1)
              const range = Math.max(0, Math.min(1, (ex.down - st.bestRange) / (ex.down - ex.ideal)));
              st.formSum += range;
              setReps(st.reps);
            }
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── round lifecycle ──
  const startRound = () => {
    repStateRef.current = { stage: 'up', reps: 0, formSum: 0, bestRange: 0 };
    setReps(0); setResult(null); setFeedback('');
    setPhase('ready');
    let n = 3; setCount(n);
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(iv); beginActive(); } else setCount(n);
    }, 1000);
  };

  const beginActive = () => {
    setPhase('active');
    setTimeLeft(ROUND_SECONDS);
    let t = ROUND_SECONDS;
    const iv = setInterval(() => {
      t -= 1; setTimeLeft(t);
      if (t <= 0) { clearInterval(iv); finishRound(); }
    }, 1000);
  };

  const finishRound = () => {
    const st = repStateRef.current;
    const form = st.reps ? Math.round((st.formSum / st.reps) * 100) : 0;
    const score = st.reps * 10 + Math.round(form / 2);
    setResult({ reps: st.reps, form, score });
    setPhase('result');
    // advance the exercise for the next person, auto-return to attract
    setTimeout(() => { setExIdx((i) => (i + 1) % EXERCISES.length); setPhase('attract'); }, 11000);
  };

  const ex = EXERCISES[exIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b1416', color: 'white', overflow: 'hidden', fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      {/* camera (mirrored) */}
      <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: phase === 'attract' ? 0.5 : 0.85 }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,20,22,0.55), rgba(11,20,22,0.2) 40%, rgba(11,20,22,0.75))' }} />

      {/* brand */}
      <div style={{ position: 'absolute', top: 28, left: 36, zIndex: 3, fontFamily: "'Tenor Sans', serif", fontSize: '1.6rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ background: 'linear-gradient(135deg,#57b6c4,#708E86)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FIXIT</span>
        <span style={{ fontSize: '0.9rem', opacity: 0.7, fontFamily: 'var(--sans)' }}>Pose Challenge</span>
      </div>

      <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        {phase === 'loading' && <Big sub="Warming up the camera…">⏳</Big>}
        {phase === 'error' && <Big sub="Camera unavailable — check permissions / connect a camera.">📷</Big>}

        {phase === 'attract' && (
          <div style={{ animation: 'chPulse 2.4s ease-in-out infinite' }}>
            <div style={{ fontSize: '5.5rem', marginBottom: 6 }}>🙌</div>
            <div style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.05 }}>Raise both hands<br />to start!</div>
            <div style={{ marginTop: 22, fontSize: '1.5rem', opacity: 0.85 }}>Next up: <b>{ex.emoji} {ex.name}</b> · 30-second challenge</div>
          </div>
        )}

        {phase === 'ready' && (
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, opacity: 0.9 }}>Get ready for</div>
            <div style={{ fontSize: 'clamp(2.6rem, 8vw, 5rem)', fontWeight: 900, margin: '4px 0 14px' }}>{ex.emoji} {ex.name}</div>
            <div style={{ fontSize: '10rem', fontWeight: 900, lineHeight: 1, color: '#57b6c4', textShadow: '0 0 40px rgba(87,182,196,0.6)' }}>{count}</div>
          </div>
        )}

        {phase === 'active' && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, opacity: 0.9 }}>{ex.emoji} {ex.name}</div>
            <div style={{ fontSize: '1.1rem', opacity: 0.7, marginBottom: 8 }}>{ex.cue}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 'clamp(5rem, 18vw, 12rem)', fontWeight: 900, lineHeight: 1, color: '#7CFC9E', textShadow: '0 0 30px rgba(124,252,158,0.4)' }}>{reps}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>reps</div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: 900, lineHeight: 1, color: timeLeft <= 5 ? '#ff6b6b' : 'white' }}>{timeLeft}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 }}>seconds</div>
              </div>
            </div>
            {feedback && <div style={{ marginTop: 18, fontSize: '1.4rem', color: '#ffd166', fontWeight: 700 }}>{feedback}</div>}
          </div>
        )}

        {phase === 'result' && result && (
          <div style={{ animation: 'chPop 0.5s ease-out' }}>
            <div style={{ fontSize: '4rem' }}>{result.reps >= 15 ? '🔥' : result.reps >= 8 ? '💪' : '👏'}</div>
            <div style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 900 }}>{result.reps} {ex.name.toLowerCase()}!</div>
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', margin: '20px 0 6px' }}>
              <Stat v={result.reps} l="Reps" c="#7CFC9E" />
              <Stat v={`${result.form}`} l="Form" c="#57b6c4" />
              <Stat v={result.score} l="Score" c="#ffd166" />
            </div>
            <div style={{ marginTop: 18, fontSize: '1.4rem', opacity: 0.85 }}>Raise both hands for the next challenge 🙌</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes chPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes chPop { 0%{transform:scale(0.6);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}

function Big({ children, sub }) {
  return (
    <div>
      <div style={{ fontSize: '5rem' }}>{children}</div>
      <div style={{ fontSize: '1.5rem', opacity: 0.8, marginTop: 8 }}>{sub}</div>
    </div>
  );
}
function Stat({ v, l, c }) {
  return (
    <div>
      <div style={{ fontSize: 'clamp(2.6rem, 8vw, 4.5rem)', fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.75 }}>{l}</div>
    </div>
  );
}

// draw a simple skeleton overlay so it feels alive + confirms tracking
function drawSkeleton(canvas, video, kp) {
  const w = video.videoWidth, h = video.videoHeight;
  if (canvas.width !== w) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const EDGES = [
    ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
  ];
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(87,182,196,0.9)';
  EDGES.forEach(([a, b]) => {
    const p = kp[a], q = kp[b];
    if (p && q && p.score > 0.3 && q.score > 0.3) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  });
  ctx.fillStyle = '#7CFC9E';
  Object.values(kp).forEach((k) => { if (k.score > 0.3) { ctx.beginPath(); ctx.arc(k.x, k.y, 6, 0, Math.PI * 2); ctx.fill(); } });
}
