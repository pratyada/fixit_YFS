import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── 3D Material Palette ───
const MAT = {
  skin: '#D9B190',
  shirt: '#708E86',
  shorts: '#4A615C',
  hair: '#3A2E26',
  shoe: '#2D2D32',
  active: '#D4A853',
  mat: '#9FB8B0',
  step: '#A89684',
  wall: '#E2E0DF',
};

// ─── Reusable 3D body part ───
function Limb({ length, radius = 0.18, color = MAT.skin, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -length / 2, 0]} castShadow>
        <capsuleGeometry args={[radius, length, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
      </mesh>
    </group>
  );
}

function Joint({ position, radius = 0.13 }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={MAT.skin} roughness={0.6} />
    </mesh>
  );
}

function Head({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      {/* Hair cap */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.34, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial color={MAT.hair} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Torso({ position, rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Chest */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.85, 0.55, 0.42]} />
        <meshStandardMaterial color={MAT.shirt} roughness={0.7} />
      </mesh>
      {/* Waist taper */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[0.75, 0.5, 0.38]} />
        <meshStandardMaterial color={MAT.shirt} roughness={0.7} />
      </mesh>
      {/* Hip */}
      <mesh position={[0, -0.78, 0]} castShadow>
        <boxGeometry args={[0.78, 0.3, 0.4]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Foot({ position, rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={[0.18, 0.12, 0.36]} />
      <meshStandardMaterial color={MAT.shoe} roughness={0.5} />
    </mesh>
  );
}

// ─── Highlight glow for active muscle ───
function MuscleGlow({ position, radius = 0.4 }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.material.opacity = 0.25 + 0.2 * Math.sin(t * 2);
      ref.current.scale.setScalar(1 + 0.08 * Math.sin(t * 2));
    }
  });
  return (
    <mesh position={position} ref={ref}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial color={MAT.active} transparent opacity={0.3} />
    </mesh>
  );
}

// ─── Person poses by exercise ───

function QuadSetsPerson() {
  // Lying on back
  const animRef = useRef();
  useFrame((s) => {
    if (animRef.current) {
      const t = s.clock.elapsedTime;
      const press = Math.sin(t * 1.5) * 0.04;
      animRef.current.position.y = -0.5 + press;
    }
  });
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
      <Head position={[1.5, 0, 0]} />
      <Torso position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
      {/* Left leg straight (animating) */}
      <group ref={animRef} position={[-0.5, 0, 0]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
          <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
        </mesh>
        <mesh position={[-0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.15, 0.7, 8, 16]} />
          <meshStandardMaterial color={MAT.skin} roughness={0.65} />
        </mesh>
        <Foot position={[-1.45, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
      </group>
      {/* Right leg bent */}
      <mesh position={[-0.1, 0.3, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <capsuleGeometry args={[0.17, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[-0.55, 0.65, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <capsuleGeometry args={[0.14, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <MuscleGlow position={[-0.6, 0, 0]} radius={0.3} />
    </group>
  );
}

function StraightLegRaisePerson() {
  const legRef = useRef();
  useFrame((s) => {
    if (legRef.current) {
      const t = s.clock.elapsedTime;
      const lift = (Math.sin(t * 1.2) + 1) * 0.5; // 0..1
      legRef.current.rotation.z = Math.PI / 2 - lift * 0.7;
    }
  });
  return (
    <group rotation={[0, 0, 0]} position={[0, -0.3, 0]}>
      <Head position={[1.4, 0, 0]} />
      <Torso position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
      {/* Animated leg */}
      <group ref={legRef} position={[-0.45, 0, 0]}>
        <mesh position={[-0.5, 0, 0]} castShadow>
          <capsuleGeometry args={[0.18, 1.4, 8, 16]} />
          <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
        </mesh>
        <mesh position={[-1.45, 0, 0]} castShadow>
          <capsuleGeometry args={[0.14, 0.4, 8, 16]} />
          <meshStandardMaterial color={MAT.skin} roughness={0.65} />
        </mesh>
      </group>
      {/* Bent leg */}
      <mesh position={[-0.1, 0.35, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
        <capsuleGeometry args={[0.17, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[-0.5, 0.7, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <capsuleGeometry args={[0.14, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
    </group>
  );
}

function StandingPerson({ kneeAngleRef }) {
  return (
    <group position={[0, -1, 0]}>
      <Head position={[0, 1.95, 0]} />
      <Torso position={[0, 1.0, 0]} />
      {/* Arms */}
      <mesh position={[-0.55, 1.05, 0]} rotation={[0, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <mesh position={[-0.62, 0.45, 0]} rotation={[0, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.1, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <mesh position={[0.55, 1.05, 0]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <mesh position={[0.62, 0.45, 0]} rotation={[0, 0, 0.08]} castShadow>
        <capsuleGeometry args={[0.1, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.22, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[-0.22, -0.55, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <Foot position={[-0.22, -0.95, 0.05]} />
      <mesh position={[0.22, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[0.22, -0.55, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <Foot position={[0.22, -0.95, 0.05]} />
    </group>
  );
}

function MiniSquatPerson() {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) {
      const t = s.clock.elapsedTime;
      const squat = (Math.sin(t * 1.3) + 1) * 0.5; // 0..1
      ref.current.position.y = -squat * 0.4;
      ref.current.scale.y = 1 - squat * 0.12;
    }
  });
  return (
    <group ref={ref}>
      <StandingPerson />
    </group>
  );
}

function WallSitPerson() {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Wall */}
      <mesh position={[0, 0.5, -0.5]} receiveShadow>
        <boxGeometry args={[3, 3, 0.15]} />
        <meshStandardMaterial color={MAT.wall} roughness={0.9} />
      </mesh>
      <Head position={[0, 1.5, -0.4]} />
      <Torso position={[0, 0.55, -0.4]} />
      {/* Arms forward */}
      <mesh position={[-0.6, 0.55, -0.4]} rotation={[0, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <mesh position={[0.6, 0.55, -0.4]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      {/* Thighs horizontal forward */}
      <mesh position={[-0.22, -0.1, 0.05]} rotation={[Math.PI / 2.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[0.22, -0.1, 0.05]} rotation={[Math.PI / 2.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      {/* Shins down */}
      <mesh position={[-0.22, -0.65, 0.55]} castShadow>
        <capsuleGeometry args={[0.15, 0.65, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <mesh position={[0.22, -0.65, 0.55]} castShadow>
        <capsuleGeometry args={[0.15, 0.65, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <Foot position={[-0.22, -1.05, 0.6]} />
      <Foot position={[0.22, -1.05, 0.6]} />
    </group>
  );
}

function BridgePerson() {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) {
      const t = s.clock.elapsedTime;
      const lift = (Math.sin(t * 1.2) + 1) * 0.5;
      ref.current.position.y = lift * 0.3;
    }
  });
  return (
    <group rotation={[0, 0, 0]} position={[0, -0.7, 0]}>
      <Head position={[1.6, 0, 0]} />
      <group ref={ref}>
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <boxGeometry args={[0.85, 0.55, 0.42]} />
          <meshStandardMaterial color={MAT.shirt} roughness={0.7} />
        </mesh>
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <boxGeometry args={[0.78, 0.3, 0.4]} />
          <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
        </mesh>
        {/* Bent legs */}
        <mesh position={[-0.65, -0.25, 0.18]} rotation={[0, 0, Math.PI / 3]} castShadow>
          <capsuleGeometry args={[0.17, 0.7, 8, 16]} />
          <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
        </mesh>
        <mesh position={[-0.65, -0.25, -0.18]} rotation={[0, 0, Math.PI / 3]} castShadow>
          <capsuleGeometry args={[0.17, 0.7, 8, 16]} />
          <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
        </mesh>
      </group>
      <MuscleGlow position={[-0.3, 0.1, 0]} radius={0.32} />
    </group>
  );
}

function ClamshellPerson() {
  const topLegRef = useRef();
  useFrame((s) => {
    if (topLegRef.current) {
      const t = s.clock.elapsedTime;
      const open = (Math.sin(t * 1.3) + 1) * 0.5;
      topLegRef.current.rotation.z = open * 0.6;
    }
  });
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
      <Head position={[1.5, 0, 0]} />
      <Torso position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
      {/* Bottom leg bent */}
      <mesh position={[-0.3, 0.1, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <capsuleGeometry args={[0.17, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[-0.78, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      {/* Top leg — animated open */}
      <group ref={topLegRef} position={[-0.3, 0, 0]}>
        <mesh position={[-0.25, 0.1, 0.3]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <capsuleGeometry args={[0.17, 0.6, 8, 16]} />
          <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
        </mesh>
        <mesh position={[-0.5, 0.4, 0.3]} castShadow>
          <capsuleGeometry args={[0.14, 0.55, 8, 16]} />
          <meshStandardMaterial color={MAT.skin} roughness={0.65} />
        </mesh>
      </group>
      <MuscleGlow position={[-0.3, 0, 0]} radius={0.28} />
    </group>
  );
}

function HamstringCurlPerson() {
  const shinRef = useRef();
  useFrame((s) => {
    if (shinRef.current) {
      const t = s.clock.elapsedTime;
      const curl = (Math.sin(t * 1.4) + 1) * 0.5;
      shinRef.current.rotation.x = -curl * Math.PI * 0.7;
    }
  });
  return (
    <group position={[0, -1, 0]}>
      <Head position={[0, 1.95, 0]} />
      <Torso position={[0, 1.0, 0]} />
      {/* Standing leg */}
      <mesh position={[-0.22, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[-0.22, -0.55, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <Foot position={[-0.22, -0.95, 0.05]} />
      {/* Curling leg */}
      <mesh position={[0.22, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <group ref={shinRef} position={[0.22, -0.15, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
          <meshStandardMaterial color={MAT.skin} roughness={0.65} />
        </mesh>
        <Foot position={[0, -0.7, 0.05]} />
      </group>
      <MuscleGlow position={[0.22, -0.5, -0.15]} radius={0.25} />
    </group>
  );
}

function SingleLegBalancePerson() {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) {
      const t = s.clock.elapsedTime;
      ref.current.rotation.z = Math.sin(t * 2) * 0.025;
    }
  });
  return (
    <group ref={ref} position={[0, -1, 0]}>
      <Head position={[0, 1.95, 0]} />
      <Torso position={[0, 1.0, 0]} />
      <mesh position={[-0.55, 1.05, 0]} rotation={[0, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <mesh position={[0.55, 1.05, 0]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.12, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      {/* Standing leg */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.55, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
      <Foot position={[0, -0.95, 0.05]} />
      {/* Lifted leg */}
      <mesh position={[0.35, 0.3, 0.2]} rotation={[0.5, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={MAT.shorts} roughness={0.7} />
      </mesh>
      <mesh position={[0.55, -0.15, 0.5]} rotation={[0.7, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.15, 0.55, 8, 16]} />
        <meshStandardMaterial color={MAT.skin} roughness={0.65} />
      </mesh>
    </group>
  );
}

// Default fallback
function DefaultPerson() {
  return <StandingPerson />;
}

const PERSON_BY_EXERCISE = {
  'quad-sets': QuadSetsPerson,
  'straight-leg-raise': StraightLegRaisePerson,
  'heel-slides': StraightLegRaisePerson,
  'wall-sits': WallSitPerson,
  'mini-squats': MiniSquatPerson,
  'step-ups': MiniSquatPerson,
  'hamstring-curls': HamstringCurlPerson,
  'clamshells': ClamshellPerson,
  'single-leg-balance': SingleLegBalancePerson,
  'bridge': BridgePerson,
  'pendulum': DefaultPerson,
  'wall-angels': DefaultPerson,
  'cat-cow': DefaultPerson,
  'bird-dog': DefaultPerson,
  'ankle-abc': DefaultPerson,
};

export default function Exercise3D({ exerciseId }) {
  const Person = PERSON_BY_EXERCISE[exerciseId] || DefaultPerson;
  const controlsRef = useRef();
  const [view, setView] = useState('front');

  const setView3D = (preset) => {
    if (!controlsRef.current) return;
    const positions = {
      front: [0, 0.5, 4.5],
      back: [0, 0.5, -4.5],
      left: [-4.5, 0.5, 0],
      right: [4.5, 0.5, 0],
      top: [0, 5, 0.01],
      iso: [3.2, 2.2, 3.2],
    };
    const pos = positions[preset];
    controlsRef.current.object.position.set(...pos);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    setView(preset);
  };

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: '1px solid var(--color-border)', overflow: 'hidden',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #F8FAF9 0%, #DDE8E3 100%)',
        height: '320px', position: 'relative',
      }}>
        <Canvas
          shadows
          camera={{ position: [3.2, 2.2, 3.2], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[3, 5, 4]}
            intensity={1.1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} />

          <Suspense fallback={null}>
            <Person />
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={6} blur={2.4} far={4} />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={2.5}
            maxDistance={8}
            target={[0, 0, 0]}
          />
        </Canvas>

        {/* View preset buttons */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          display: 'flex', flexDirection: 'column', gap: '4px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(4px)',
          padding: '6px', borderRadius: '10px',
          border: '1px solid var(--color-border)',
        }}>
          {[
            { k: 'front', l: 'F' },
            { k: 'right', l: 'R' },
            { k: 'left', l: 'L' },
            { k: 'back', l: 'B' },
            { k: 'top', l: 'T' },
            { k: 'iso', l: '◆' },
          ].map(v => (
            <button
              key={v.k}
              onClick={() => setView3D(v.k)}
              title={v.k.toUpperCase()}
              style={{
                width: '28px', height: '28px', borderRadius: '6px',
                border: 'none',
                background: view === v.k ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                color: view === v.k ? 'white' : 'var(--color-secondary)',
                fontSize: '0.7rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {v.l}
            </button>
          ))}
        </div>

        {/* Hint */}
        <div style={{
          position: 'absolute', bottom: '10px', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.62rem', color: 'var(--color-text)',
          background: 'rgba(255,255,255,0.85)',
          padding: '4px 12px', borderRadius: '50px',
          border: '1px solid var(--color-border)',
          fontWeight: 500,
        }}>
          🖱 Drag to rotate · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
