import { useRef, useState, useMemo, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Play, Pause, RotateCcw, Gauge, User, Move3d, ArrowLeft } from 'lucide-react';
import { getExerciseAnimation } from '../data/exercise-animations';

// ── Rig proportions (metres) ────────────────────────────────────────────────
const P = {
  hipY: 0.92,            // standing pelvis height
  pelvis: 0.16,
  torso: 0.52, neck: 0.09, head: 0.13,
  upperArm: 0.30, foreArm: 0.28, armR: 0.045,
  thigh: 0.42, shin: 0.42, legR: 0.055,
  foot: 0.20,
  hipW: 0.11, shoulderW: 0.19,
};
const SKIN = '#5b8f97';
const SKIN2 = '#3f6f77';

// Smooth 0→1→0 over one rep (down then up).
const repEase = (phase) => (1 - Math.cos(phase * Math.PI * 2)) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

function Limb({ len, r = 0.05, color = SKIN, children, dir = 'down' }) {
  // A joint group whose limb extends `len` in `dir`; children mount at the far end.
  const offset = dir === 'down' ? -len / 2 : len / 2;
  const childY = dir === 'down' ? -len : len;
  return (
    <>
      <mesh position={[0, offset, 0]} castShadow>
        <capsuleGeometry args={[r, len - r * 2, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <group position={[0, childY, 0]}>{children}</group>
    </>
  );
}

function Humanoid({ anim, playing, speed, yaw }) {
  const model = useRef();
  const hips = useRef();
  const torso = useRef();
  const neck = useRef();
  const shL = useRef(); const shR = useRef();
  const elL = useRef(); const elR = useRef();
  const hipL = useRef(); const hipR = useRef();
  const knL = useRef(); const knR = useRef();
  const akL = useRef(); const akR = useRef();
  const phase = useRef(0);

  useFrame((_, delta) => {
    // advance the rep phase
    if (playing) phase.current = (phase.current + (delta * speed) / anim.tempoSec) % 1;
    const s = repEase(phase.current);
    const j = (key) => lerp(anim.rest[key] ?? 0, anim.target[key] ?? 0, s);

    if (hips.current) hips.current.position.y = P.hipY + j('hipsY');
    if (torso.current) torso.current.rotation.x = j('torso');
    if (neck.current) neck.current.rotation.x = j('neck');
    const hf = j('hip'), kf = j('knee'), af = j('ankle'), sh = j('shoulder'), el = j('elbow');
    for (const ref of [hipL, hipR]) if (ref.current) ref.current.rotation.x = hf;
    for (const ref of [knL, knR]) if (ref.current) ref.current.rotation.x = kf;
    for (const ref of [akL, akR]) if (ref.current) ref.current.rotation.x = af;
    for (const ref of [shL, shR]) if (ref.current) ref.current.rotation.x = sh;
    for (const ref of [elL, elR]) if (ref.current) ref.current.rotation.x = el;

    // ease the whole figure toward the requested viewing yaw (front/side)
    if (model.current) model.current.rotation.y = lerp(model.current.rotation.y, yaw, 0.12);
  });

  const jointDot = (r = 0.05) => (
    <mesh castShadow><sphereGeometry args={[r, 12, 12]} /><meshStandardMaterial color={SKIN2} roughness={0.7} /></mesh>
  );

  return (
    <group ref={model}>
      <group ref={hips} position={[0, P.hipY, 0]}>
        {/* pelvis */}
        <mesh castShadow><boxGeometry args={[0.26, P.pelvis, 0.17]} /><meshStandardMaterial color={SKIN2} roughness={0.75} /></mesh>

        {/* torso → neck → head + arms */}
        <group ref={torso} position={[0, P.pelvis / 2, 0]}>
          <mesh position={[0, P.torso / 2, 0]} castShadow>
            <capsuleGeometry args={[0.13, P.torso - 0.16, 6, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.75} />
          </mesh>
          <group position={[0, P.torso, 0]}>
            <group ref={neck}>
              <mesh position={[0, P.neck / 2, 0]}><cylinderGeometry args={[0.05, 0.06, P.neck, 10]} /><meshStandardMaterial color={SKIN2} /></mesh>
              <mesh position={[0, P.neck + P.head * 0.85, 0]} castShadow><sphereGeometry args={[P.head, 18, 18]} /><meshStandardMaterial color={SKIN} roughness={0.7} /></mesh>
            </group>
          </group>

          {/* shoulders (near top of torso) */}
          <group position={[-P.shoulderW, P.torso * 0.9, 0]}>
            <group ref={shL}>{jointDot(0.055)}<Limb len={P.upperArm} r={P.armR} color={SKIN}><group ref={elL}>{jointDot(0.045)}<Limb len={P.foreArm} r={P.armR * 0.9} color={SKIN2} /></group></Limb></group>
          </group>
          <group position={[P.shoulderW, P.torso * 0.9, 0]}>
            <group ref={shR}>{jointDot(0.055)}<Limb len={P.upperArm} r={P.armR} color={SKIN}><group ref={elR}>{jointDot(0.045)}<Limb len={P.foreArm} r={P.armR * 0.9} color={SKIN2} /></group></Limb></group>
          </group>
        </group>

        {/* legs */}
        <group position={[-P.hipW, -P.pelvis / 2, 0]}>
          <group ref={hipL}>{jointDot(0.06)}<Limb len={P.thigh} r={P.legR} color={SKIN}><group ref={knL}>{jointDot(0.055)}<Limb len={P.shin} r={P.legR * 0.9} color={SKIN2}><group ref={akL}><mesh position={[0, -0.03, P.foot / 2 - 0.05]} castShadow><boxGeometry args={[0.09, 0.06, P.foot]} /><meshStandardMaterial color={SKIN2} /></mesh></group></Limb></group></Limb></group>
        </group>
        <group position={[P.hipW, -P.pelvis / 2, 0]}>
          <group ref={hipR}>{jointDot(0.06)}<Limb len={P.thigh} r={P.legR} color={SKIN}><group ref={knR}>{jointDot(0.055)}<Limb len={P.shin} r={P.legR * 0.9} color={SKIN2}><group ref={akR}><mesh position={[0, -0.03, P.foot / 2 - 0.05]} castShadow><boxGeometry args={[0.09, 0.06, P.foot]} /><meshStandardMaterial color={SKIN2} /></mesh></group></Limb></group></Limb></group>
        </group>
      </group>
    </group>
  );
}

export default function ExerciseGuide() {
  const { exerciseId } = useParams();
  const anim = useMemo(() => getExerciseAnimation(exerciseId), [exerciseId]);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [side, setSide] = useState(false);   // false = front, true = side

  const btn = (active) => ({
    display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 15px', borderRadius: '10px',
    border: `1px solid ${active ? '#57b6c4' : 'var(--color-border)'}`, cursor: 'pointer',
    background: active ? 'rgba(87,182,196,0.16)' : 'var(--color-surface, #fff)',
    color: active ? '#2f8b96' : 'var(--color-text)', fontSize: '0.82rem', fontWeight: 700,
  });

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <div>
          <Link to="/exercises" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-accent)', textDecoration: 'none', marginBottom: '4px' }}><ArrowLeft size={14} /> Exercises</Link>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>{anim.name}
            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--color-accent)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '999px' }}>{anim.region}</span>
          </h1>
        </div>
      </div>

      {/* 3D stage */}
      <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'linear-gradient(180deg,#0e2024,#132e33)', height: '460px' }}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.1, 3.2], fov: 42 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <color attach="background" args={['#10262b']} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 6, 4]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-3, 3, -2]} intensity={0.35} />
          <Suspense fallback={null}>
            <group position={[0, -0.9, 0]}>
              <Humanoid anim={anim} playing={playing} speed={slow ? 0.4 : 1} yaw={side ? Math.PI / 2 : 0} />
              <ContactShadows position={[0, 0.01, 0]} opacity={0.5} blur={2.4} far={2.2} scale={4} color="#020a0c" />
            </group>
          </Suspense>
          <OrbitControls enablePan={false} minDistance={2} maxDistance={5} target={[0, 0.15, 0]} minPolarAngle={0.5} maxPolarAngle={1.7} />
        </Canvas>

        <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#cfe6e9', fontSize: '0.72rem', background: 'rgba(0,0,0,0.35)', padding: '5px 10px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
          Drag to rotate · scroll to zoom
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button style={btn(false)} onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause' : 'Play'}</button>
        <button style={btn(slow)} onClick={() => setSlow((s) => !s)}><Gauge size={15} /> {slow ? 'Slow-mo' : 'Normal speed'}</button>
        <button style={btn(side)} onClick={() => setSide((s) => !s)}>{side ? <Move3d size={15} /> : <User size={15} />} {side ? 'Side view' : 'Front view'}</button>
      </div>

      {/* Cue */}
      <div style={{ marginTop: '14px', padding: '14px 16px', borderRadius: '12px', background: 'var(--color-bg-alt, #eef5f2)', border: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '5px' }}>How to do it</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>{anim.cue}</div>
      </div>
    </div>
  );
}
