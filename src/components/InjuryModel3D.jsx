import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { STRUCTURES, STRUCT_BY_ID, STATUS } from '../data/knee-anatomy';

// Read-only, patient-facing 3D knee. Shows the bones as faint context and
// lights up ONLY the structures the practitioner marked as injured — so the
// patient sees exactly "what is impacted in my body" before their exercises.
// Same geometry + structure ids as the practitioner view, so marks flow through.

const BONE = new Set(['femur', 'tibia', 'fibula', 'patella']);

function Geo({ p }) {
  if (p.geo === 'cyl') return <cylinderGeometry args={p.args} />;
  if (p.geo === 'sph') return <sphereGeometry args={p.args} />;
  if (p.geo === 'tor') return <torusGeometry args={p.args} />;
  return null;
}

// One structure: bright + throbbing if injured, faint bone if it's context,
// hidden otherwise (keeps the patient focused on what's impacted).
function Part({ s, status }) {
  const matRefs = useRef([]);
  const injured = !!status;
  const injColor = injured ? (STATUS[status]?.c || STATUS.acute.c) : null;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const ei = injured ? 0.45 + 0.3 * Math.sin(t * 3) : 0;
    matRefs.current.forEach((m) => { if (m) m.emissiveIntensity += (ei - m.emissiveIntensity) * 0.12; });
  });
  const isBone = BONE.has(s.id);
  if (!injured && !isBone) return null; // only show injured parts + skeletal context
  const color = injured ? injColor : '#d9d3c6';
  return (
    <group>
      {s.parts.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot || [0, 0, 0]} scale={p.scale || 1}>
          <Geo p={p} />
          <meshStandardMaterial
            ref={(el) => { matRefs.current[i] = el; }}
            color={color}
            emissive={injColor || '#000000'}
            emissiveIntensity={0}
            roughness={0.55} metalness={0.05}
            transparent
            opacity={injured ? 1 : 0.16}
            depthWrite={injured}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function InjuryModel3D({ injuries = [], height = 340 }) {
  // structureId → status, so the model can key off marks (latest wins).
  const injuryMap = useMemo(() => {
    const m = {};
    for (const inj of injuries) if (inj?.structureId) m[inj.structureId] = inj.status || 'acute';
    return m;
  }, [injuries]);
  const marked = Object.keys(injuryMap).filter((id) => STRUCT_BY_ID[id]);

  return (
    <div>
      <div style={{ position: 'relative', height, borderRadius: '18px', overflow: 'hidden', background: 'radial-gradient(120% 120% at 50% 0%, #16202a 0%, #0c0f12 70%)' }}>
        <Canvas camera={{ position: [3.4, 0.6, 4.8], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }}>
          <ambientLight intensity={0.55} />
          <hemisphereLight args={['#bcd6de', '#241d1a', 0.45]} />
          <directionalLight position={[4, 6, 5]} intensity={1.1} />
          <directionalLight position={[-5, 2, -4]} intensity={0.4} color="#9fd0da" />
          <Suspense fallback={null}>
            {STRUCTURES.map((s) => <Part key={s.id} s={s} status={injuryMap[s.id] || null} />)}
            <ContactShadows position={[0, -2.75, 0]} opacity={0.4} scale={12} blur={2.6} far={4.5} color="#000000" />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={3} maxDistance={11} autoRotate autoRotateSpeed={0.7} enableDamping />
        </Canvas>
        <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontFamily: 'system-ui', pointerEvents: 'none' }}>
          Drag to rotate
        </div>
      </div>
      {/* Legend under the model (not floating over it) — names each highlighted part. */}
      {marked.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text)', opacity: 0.7 }}>Highlighted:</span>
          {marked.map((id) => {
            const c = STATUS[injuryMap[id]]?.c || STATUS.acute.c;
            return (
              <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-secondary)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: '999px' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
                {STRUCT_BY_ID[id].name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
