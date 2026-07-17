import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';
import { speak, listen, wakeWord } from '../lib/voice';

const EXERCISES = [...FIXIT_EXERCISES, ...GYM_EXERCISES];

// state → orb colors
const PALETTE = {
  idle: { core: '#c2d6cd', edge: '#708E86', ring: 'rgba(112,142,134,' },
  listening: { core: '#b5dde4', edge: '#4f93a0', ring: 'rgba(79,147,160,' },
  thinking: { core: '#f0d99a', edge: '#d3ac57', ring: 'rgba(211,172,87,' },
  speaking: { core: '#d3e6dd', edge: '#7ea08f', ring: 'rgba(160,185,175,' },
};

// ── The living voice orb (canvas, audio-reactive) ──
function Orb({ stateRef, ampRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas.getContext('2d');
    let raf, t = 0, ampSmooth = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; };
    resize(); window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
      const st = stateRef.current; const p = PALETTE[st] || PALETTE.idle;
      ampSmooth += ((ampRef.current || 0) - ampSmooth) * 0.2;
      t += 0.016;
      g.clearRect(0, 0, W, H);

      const base = Math.min(W, H) * 0.17;
      const breathe = st === 'idle' ? Math.sin(t * 1.1) * 0.03 : 0;
      const react = (st === 'listening' || st === 'speaking') ? ampSmooth * 0.55 : 0;
      const spin = st === 'thinking' ? t * 1.6 : t * 0.35;
      const R = base * (1 + breathe + react);

      // emanating rings (listening/speaking)
      if (st === 'listening' || st === 'speaking') {
        for (let i = 0; i < 3; i++) {
          const phase = ((t * 0.6 + i / 3) % 1);
          const rr = R * (1 + phase * 1.6);
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2);
          g.strokeStyle = p.ring + (0.22 * (1 - phase)) + ')'; g.lineWidth = 2 * dpr; g.stroke();
        }
      }

      // wobbly organic blob
      const pts = 96;
      g.beginPath();
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const w = 0.08 + react * 0.6;
        const wob = Math.sin(a * 3 + spin) * 0.5 + Math.sin(a * 5 - t * 1.3) * 0.3 + Math.sin(a * 2 + t * 0.7) * 0.4;
        const r = R * (1 + wob * w);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.closePath();
      const grad = g.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.1, cx, cy, R * 1.25);
      grad.addColorStop(0, p.core); grad.addColorStop(0.55, p.edge); grad.addColorStop(1, p.edge + '00');
      g.shadowColor = p.edge; g.shadowBlur = (28 + react * 90) * dpr;
      g.fillStyle = grad; g.fill();
      g.shadowBlur = 0;

      // inner sheen
      g.beginPath(); g.arc(cx - R * 0.22, cy - R * 0.26, R * 0.4, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [stateRef, ampRef]);
  return <canvas ref={canvasRef} style={{ width: 'min(52vw,420px)', height: 'min(52vw,420px)' }} />;
}

function matchExercise(said) {
  const s = said.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  if (!s) return null;
  const words = s.split(/\s+/).filter((w) => w.length > 2);
  let best = null, bestScore = 0;
  for (const ex of EXERCISES) {
    const n = ex.name.toLowerCase();
    let score = 0;
    for (const w of words) if (n.includes(w)) score += w.length;
    if (n.includes(s)) score += 5;
    if (score > bestScore) { bestScore = score; best = ex; }
  }
  return bestScore >= 3 ? best : null;
}

export default function VoiceKiosk() {
  const navigate = useNavigate();
  const stateRef = useRef('idle');   // idle | listening | thinking | speaking
  const ampRef = useRef(0);
  const [uiState, setUiState] = useState('idle');
  const [caption, setCaption] = useState('');   // what the coach says
  const [heard, setHeard] = useState('');       // live transcript
  const [awake, setAwake] = useState(false);
  const runningRef = useRef(false);

  const setState = (s) => { stateRef.current = s; setUiState(s); };

  const say = useCallback(async (text) => {
    setCaption(text); setHeard(''); setState('speaking');
    await speak(text, { onAmplitude: (a) => { ampRef.current = a; } });
    ampRef.current = 0;
  }, []);

  const hear = useCallback(async () => {
    setState('listening');
    const t = await listen({ onInterim: setHeard, onAmplitude: (a) => { ampRef.current = a; } });
    ampRef.current = 0; setState('thinking');
    return t;
  }, []);

  const runFlow = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true; setAwake(true);
    try {
      await say("Hi there, welcome to FIXIT by YourFormSux. I'm your AI form coach. Before we start — I'll use the camera to check your form; that's stored securely just for your feedback. What's your first name?");
      const name = (await hear()).split(' ')[0] || '';
      const greet = name ? `Nice to meet you, ${name}. ` : '';
      await say(`${greet}Which exercise would you like me to check? You can say things like squat, wall sit, glute bridge, or straight leg raise.`);

      let exercise = null;
      for (let tries = 0; tries < 3 && !exercise; tries++) {
        const said = await hear();
        exercise = matchExercise(said);
        if (!exercise) await say(`Hmm, I didn't catch an exercise. Try naming one — for example, "squat" or "wall sit".`);
      }
      if (!exercise) { await say("No problem — let's try again later. Say FIXIT whenever you're ready."); return; }

      await say(`Great choice — the ${exercise.name}. Stand back so the camera can see your whole body, and I'll walk you through it. Starting your pose check now.`);
      setState('idle');
      navigate('/pose?exercise=' + exercise.id);
    } catch {
      await say("Sorry, something went wrong with the microphone. Please check the mic and say FIXIT to try again.").catch(() => {});
    } finally {
      runningRef.current = false; setAwake(false); setState('idle');
    }
  }, [say, hear, navigate]);

  // Wake word listener (idle only)
  useEffect(() => {
    if (awake) return;
    const stop = wakeWord('fixit', () => runFlow());
    return stop;
  }, [awake, runFlow]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, #2b3531, #141917)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '36px',
      color: '#eef4f1', fontFamily: "'Tenor Sans','Optima',system-ui,sans-serif", textAlign: 'center', padding: '24px',
    }}>
      <div style={{ position: 'absolute', top: 26, fontSize: '0.95rem', letterSpacing: '1px' }}>
        <span style={{ fontWeight: 700 }}>FIXIT</span> <span style={{ opacity: 0.55, fontFamily: 'system-ui' }}>by YourFormSux</span>
      </div>

      <Orb stateRef={stateRef} ampRef={ampRef} />

      <div style={{ minHeight: '92px', maxWidth: '620px' }}>
        <div style={{ fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', lineHeight: 1.4, textWrap: 'balance' }}>
          {caption || (awake ? '' : 'Say “FIXIT” to begin')}
        </div>
        {heard && <div style={{ marginTop: '12px', fontFamily: 'system-ui', fontSize: '0.95rem', color: '#9fc0b3', fontStyle: 'italic' }}>“{heard}”</div>}
      </div>

      <div style={{ position: 'absolute', bottom: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontFamily: 'system-ui', fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#7f9089' }}>
          {uiState === 'listening' ? 'Listening…' : uiState === 'thinking' ? 'Thinking…' : uiState === 'speaking' ? 'Speaking…' : 'Ready'}
        </div>
        {!awake && (
          <button onClick={runFlow} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#eef4f1',
            borderRadius: '999px', padding: '11px 26px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'system-ui',
          }}>
            Tap to start (or say “FIXIT”)
          </button>
        )}
      </div>
    </div>
  );
}
