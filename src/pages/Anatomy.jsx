import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Bone, RotateCcw, Layers, X } from 'lucide-react';

// ── Phase-0 anatomy spike ──────────────────────────────────────────────
// A procedural KNEE where every structure is its OWN named, selectable mesh.
// This proves the product mechanic (click → highlight → isolate → annotate).
// A real segmented anatomy GLB drops into the SAME selection code later —
// just replace STRUCTURES-driven meshes with GLB nodes and keep name→mesh map.

const LAYER_COLORS = { bone: '#e9e3d5', ligament: '#cbbd97', cartilage: '#a9c4d6', tendon: '#ddc59c' };
const LAYER_LABELS = { bone: 'Bones', ligament: 'Ligaments', cartilage: 'Cartilage', tendon: 'Tendon' };

// Each structure = one selectable group of primitive parts. Approximate, not
// anatomically exact — enough to be recognizable and to exercise the interaction.
const STRUCTURES = [
  { id: 'femur', name: 'Femur', layer: 'bone', label: [0, 1.7, 0],
    desc: 'Thigh bone — forms the top of the knee joint.',
    parts: [
      { geo: 'cyl', args: [0.33, 0.36, 2.2, 20], pos: [0, 1.55, 0] },
      { geo: 'sph', args: [0.5, 24, 20], pos: [-0.42, 0.35, 0], scale: [1, 0.8, 1.15] },
      { geo: 'sph', args: [0.5, 24, 20], pos: [0.42, 0.35, 0], scale: [1, 0.8, 1.15] },
    ] },
  { id: 'tibia', name: 'Tibia', layer: 'bone', label: [0, -1.6, 0.2],
    desc: 'Shin bone — the main weight-bearing bone below the knee.',
    parts: [
      { geo: 'cyl', args: [0.3, 0.34, 2.0, 20], pos: [0, -1.5, 0] },
      { geo: 'cyl', args: [0.6, 0.55, 0.3, 24], pos: [0, -0.42, 0] },
    ] },
  { id: 'fibula', name: 'Fibula', layer: 'bone', label: [0.7, -1.5, 0],
    desc: 'Slender outer lower-leg bone; anchors the LCL.',
    parts: [{ geo: 'cyl', args: [0.11, 0.13, 1.9, 14], pos: [0.63, -1.45, -0.05] }] },
  { id: 'patella', name: 'Patella', layer: 'bone', label: [0, 0.25, 0.9],
    desc: 'Kneecap — glides in front and protects the joint.',
    parts: [{ geo: 'sph', args: [0.34, 24, 20], pos: [0, 0.2, 0.62], scale: [1, 1.25, 0.55] }] },
  { id: 'acl', name: 'ACL', layer: 'ligament', label: [0.25, 0, 0.35],
    desc: 'Anterior cruciate ligament — stops the shin sliding forward; the classic sports tear.',
    parts: [{ geo: 'cyl', args: [0.08, 0.08, 1.1, 12], pos: [0.03, -0.02, 0.06], rot: [0.5, 0, 0.4] }] },
  { id: 'pcl', name: 'PCL', layer: 'ligament', label: [-0.25, 0, -0.35],
    desc: 'Posterior cruciate ligament — stops the shin sliding backward.',
    parts: [{ geo: 'cyl', args: [0.085, 0.085, 1.1, 12], pos: [-0.03, -0.02, -0.12], rot: [-0.55, 0, -0.35] }] },
  { id: 'mcl', name: 'MCL', layer: 'ligament', label: [-0.75, 0, 0],
    desc: 'Medial collateral — inner-side stabilizer; sprained by blows to the outer knee.',
    parts: [{ geo: 'cyl', args: [0.075, 0.075, 1.45, 12], pos: [-0.62, -0.05, 0.02], rot: [0, 0, 0.08] }] },
  { id: 'lcl', name: 'LCL', layer: 'ligament', label: [0.8, 0, -0.1],
    desc: 'Lateral collateral — outer-side stabilizer.',
    parts: [{ geo: 'cyl', args: [0.07, 0.07, 1.4, 12], pos: [0.67, -0.05, -0.05], rot: [0, 0, -0.08] }] },
  { id: 'medial_meniscus', name: 'Medial meniscus', layer: 'cartilage', label: [-0.25, -0.28, 0.4],
    desc: 'Inner shock-absorbing cartilage; commonly torn with twisting.',
    parts: [{ geo: 'tor', args: [0.34, 0.09, 10, 22], pos: [-0.2, -0.27, 0.02], rot: [1.5708, 0, 0], scale: [1, 1, 0.5] }] },
  { id: 'lateral_meniscus', name: 'Lateral meniscus', layer: 'cartilage', label: [0.25, -0.28, 0.4],
    desc: 'Outer shock-absorbing cartilage.',
    parts: [{ geo: 'tor', args: [0.34, 0.09, 10, 22], pos: [0.2, -0.27, 0.02], rot: [1.5708, 0, 0], scale: [1, 1, 0.5] }] },
  { id: 'patellar_tendon', name: 'Patellar tendon', layer: 'tendon', label: [0, -0.45, 0.7],
    desc: 'Connects the kneecap to the shin; drives knee extension.',
    parts: [{ geo: 'cyl', args: [0.09, 0.09, 0.8, 12], pos: [0, -0.4, 0.5], rot: [0.35, 0, 0] }] },
];

function Geo({ p }) {
  if (p.geo === 'cyl') return <cylinderGeometry args={p.args} />;
  if (p.geo === 'sph') return <sphereGeometry args={p.args} />;
  if (p.geo === 'tor') return <torusGeometry args={p.args} />;
  return null;
}

function Structure({ s, selected, anySelected, visible, onSelect }) {
  const matRefs = useRef([]);
  const [hover, setHover] = useState(false);
  const ghost = anySelected && !selected;

  // Gentle pulse on the selected structure so the eye lands on it.
  useFrame(({ clock }) => {
    if (!selected) return;
    const p = 0.5 + 0.35 * Math.sin(clock.elapsedTime * 4);
    matRefs.current.forEach((m) => { if (m) m.emissiveIntensity = p; });
  });

  if (!visible) return null;
  const base = LAYER_COLORS[s.layer];
  return (
    <group
      onClick={(e) => { e.stopPropagation(); onSelect(s.id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
    >
      {s.parts.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot || [0, 0, 0]} scale={p.scale || 1}>
          <Geo p={p} />
          <meshStandardMaterial
            ref={(el) => { matRefs.current[i] = el; }}
            color={selected ? '#f4e5e0' : base}
            emissive={selected ? '#e0655a' : hover ? '#3d8593' : '#000000'}
            emissiveIntensity={selected ? 0.6 : hover ? 0.5 : 0}
            roughness={0.5} metalness={0.05}
            transparent={ghost} opacity={ghost ? 0.09 : 1} depthWrite={!ghost}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ selectedId, setSelectedId, layers }) {
  const selected = STRUCTURES.find((s) => s.id === selectedId) || null;
  return (
    <Canvas
      camera={{ position: [3.6, 0.8, 4.6], fov: 42 }}
      dpr={[1, 2]} gl={{ antialias: true }}
      onPointerMissed={() => setSelectedId(null)}
    >
      <color attach="background" args={['#0c0f12']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <directionalLight position={[-5, 2, -4]} intensity={0.4} color="#9fd0da" />
      <Suspense fallback={null}>
        {STRUCTURES.map((s) => (
          <Structure
            key={s.id} s={s}
            selected={s.id === selectedId}
            anySelected={!!selectedId}
            visible={layers[s.layer]}
            onSelect={setSelectedId}
          />
        ))}
        {selected && layers[selected.layer] && (
          <Html position={selected.label} center distanceFactor={9} pointerEvents="none" zIndexRange={[10, 0]}>
            <div style={{
              background: 'rgba(224,101,90,0.92)', color: '#fff', fontFamily: 'system-ui',
              fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
              whiteSpace: 'nowrap', boxShadow: '0 6px 18px rgba(0,0,0,0.4)', transform: 'translateY(-8px)',
            }}>{selected.name}</div>
          </Html>
        )}
      </Suspense>
      <OrbitControls makeDefault enablePan minDistance={2.2} maxDistance={13} target={[0, -0.1, 0]} />
    </Canvas>
  );
}

export default function Anatomy() {
  const [selectedId, setSelectedId] = useState(null);
  const [layers, setLayers] = useState({ bone: true, ligament: true, cartilage: true, tendon: true });
  const selected = STRUCTURES.find((s) => s.id === selectedId) || null;

  const grouped = useMemo(() => {
    const g = {};
    for (const s of STRUCTURES) (g[s.layer] ||= []).push(s);
    return g;
  }, []);

  const pick = (id) => {
    const s = STRUCTURES.find((x) => x.id === id);
    if (s && !layers[s.layer]) setLayers((l) => ({ ...l, [s.layer]: true }));
    setSelectedId(id);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Bone size={22} /> Anatomy <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-accent)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '999px' }}>Knee · Phase 0</span>
        </h1>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>Drag to rotate · scroll to zoom · click a structure</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* 3D viewport */}
        <div style={{
          position: 'relative', flex: '1 1 460px', minWidth: '300px', height: '72vh', minHeight: '440px',
          borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--color-border)', background: '#0c0f12',
        }}>
          <Scene selectedId={selectedId} setSelectedId={setSelectedId} layers={layers} />

          {/* Layer toggles (overlay) */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '80%' }}>
            {Object.keys(LAYER_LABELS).map((k) => (
              <button key={k} onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))} style={{
                display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.66rem', fontWeight: 700,
                padding: '5px 10px', borderRadius: '999px', cursor: 'pointer',
                border: `1px solid ${layers[k] ? LAYER_COLORS[k] : 'rgba(255,255,255,0.15)'}`,
                background: layers[k] ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.3)',
                color: layers[k] ? '#fff' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(6px)',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: LAYER_COLORS[k], opacity: layers[k] ? 1 : 0.4 }} />
                {LAYER_LABELS[k]}
              </button>
            ))}
          </div>

          {selectedId && (
            <button onClick={() => setSelectedId(null)} style={{
              position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '0.7rem', fontWeight: 700, padding: '6px 12px', borderRadius: '999px', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(6px)',
            }}><RotateCcw size={12} /> Show all</button>
          )}
        </div>

        {/* Structure panel */}
        <div style={{
          flex: '0 0 300px', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {/* Selected info */}
          <div style={{
            background: selected ? 'rgba(224,101,90,0.08)' : 'var(--color-bg-alt)',
            border: `1px solid ${selected ? 'rgba(224,101,90,0.35)' : 'var(--color-border)'}`,
            borderRadius: '14px', padding: '16px', minHeight: '92px',
          }}>
            {selected ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{selected.name}</div>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>{LAYER_LABELS[selected.layer]}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', margin: '6px 0 0', lineHeight: 1.5 }}>{selected.desc}</p>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
                <Layers size={16} /> Click any structure to isolate &amp; learn about it.
              </div>
            )}
          </div>

          {/* Structure list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(grouped).map(([layer, items]) => (
              <div key={layer}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', margin: '0 0 6px 2px' }}>{LAYER_LABELS[layer]}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {items.map((s) => {
                    const isSel = s.id === selectedId;
                    return (
                      <button key={s.id} onClick={() => pick(s.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                        padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
                        border: `1px solid ${isSel ? '#e0655a' : 'var(--color-border)'}`,
                        background: isSel ? 'rgba(224,101,90,0.10)' : 'white',
                        color: isSel ? '#c0392b' : 'var(--color-secondary)', fontWeight: isSel ? 700 : 500, fontSize: '0.82rem',
                      }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: LAYER_COLORS[s.layer], flexShrink: 0 }} />
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            fontSize: '0.68rem', color: 'var(--color-text)', background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5,
          }}>
            <strong>Phase 0 spike.</strong> Procedural placeholder knee — proves the click → isolate → annotate loop. Next: swap in a real segmented anatomy model, then let the AI voice operate it.
          </div>
        </div>
      </div>
    </div>
  );
}
