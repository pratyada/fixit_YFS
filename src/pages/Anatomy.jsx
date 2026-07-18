import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import { Plane, Vector3 } from 'three';
import '@google/model-viewer'; // registers <model-viewer> for AR / phone viewing
import { Box, X } from 'lucide-react';
import { Bone, RotateCcw, Plus, Trash2, ChevronRight, Activity, Sparkles, Mic, Printer } from 'lucide-react';
import { listenStream } from '../lib/voice';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';
import {
  getAllUsers, getAnatomyInjuries, addAnatomyInjury, updateAnatomyInjury, deleteAnatomyInjury, getSessions, updatePatientDossier,
} from '../lib/firestore';
import { marketing } from '../lib/marketingApi';

// ── AI Anatomy Consult — the full loop ─────────────────────────────────
// Body-part detail → mark injury → linked exercises → healing over time,
// persisted per patient (users/{uid}/anatomyInjuries). The 3D knee is a
// procedural placeholder; a real segmented GLB drops into KneeModel (see
// GLB_INTEGRATION below) using the same structure IDs + selection logic.

const LAYER_COLORS = { muscle: '#cf7b6e', tendon: '#ddc59c', ligament: '#cbbd97', cartilage: '#a9c4d6', nerve: '#ecd35a', vessel: '#c0555a', bone: '#e9e3d5' };
const LAYER_LABELS = { muscle: 'Muscles', tendon: 'Tendon', ligament: 'Ligaments', cartilage: 'Cartilage', nerve: 'Nerves', vessel: 'Vessels', bone: 'Bones' };
const STATUS = { acute: { c: '#e0655a', label: 'Acute' }, healing: { c: '#d8ab4f', label: 'Healing' }, recovered: { c: '#6fc08a', label: 'Recovered' } };
const STATUS_ORDER = ['acute', 'healing', 'recovered'];
const INJURY_TYPES = ['Sprain', 'Tear', 'Strain', 'Tendinopathy', 'Inflammation', 'Bruise', 'Post-surgery', 'Arthritis', 'Fracture'];

const STRUCTURES = [
  { id: 'femur', name: 'Femur', layer: 'bone', label: [0, 1.7, 0], desc: 'Thigh bone — forms the top of the knee joint.',
    parts: [{ geo: 'cyl', args: [0.33, 0.36, 2.2, 20], pos: [0, 1.55, 0] }, { geo: 'sph', args: [0.5, 24, 20], pos: [-0.42, 0.35, 0], scale: [1, 0.8, 1.15] }, { geo: 'sph', args: [0.5, 24, 20], pos: [0.42, 0.35, 0], scale: [1, 0.8, 1.15] }] },
  { id: 'tibia', name: 'Tibia', layer: 'bone', label: [0, -1.6, 0.2], desc: 'Shin bone — the main weight-bearing bone below the knee.',
    parts: [{ geo: 'cyl', args: [0.3, 0.34, 2.0, 20], pos: [0, -1.5, 0] }, { geo: 'cyl', args: [0.6, 0.55, 0.3, 24], pos: [0, -0.42, 0] }] },
  { id: 'fibula', name: 'Fibula', layer: 'bone', label: [0.7, -1.5, 0], desc: 'Slender outer lower-leg bone; anchors the LCL.',
    parts: [{ geo: 'cyl', args: [0.11, 0.13, 1.9, 14], pos: [0.63, -1.45, -0.05] }] },
  { id: 'patella', name: 'Patella', layer: 'bone', label: [0, 0.25, 0.9], desc: 'Kneecap — glides in front and protects the joint.',
    parts: [{ geo: 'sph', args: [0.34, 24, 20], pos: [0, 0.2, 0.62], scale: [1, 1.25, 0.55] }] },
  { id: 'acl', name: 'ACL', layer: 'ligament', label: [0.25, 0, 0.35], desc: 'Anterior cruciate ligament — stops the shin sliding forward; the classic sports tear.',
    parts: [{ geo: 'cyl', args: [0.08, 0.08, 1.1, 12], pos: [0.03, -0.02, 0.06], rot: [0.5, 0, 0.4] }] },
  { id: 'pcl', name: 'PCL', layer: 'ligament', label: [-0.25, 0, -0.35], desc: 'Posterior cruciate ligament — stops the shin sliding backward.',
    parts: [{ geo: 'cyl', args: [0.085, 0.085, 1.1, 12], pos: [-0.03, -0.02, -0.12], rot: [-0.55, 0, -0.35] }] },
  { id: 'mcl', name: 'MCL', layer: 'ligament', label: [-0.75, 0, 0], desc: 'Medial collateral — inner-side stabilizer; sprained by blows to the outer knee.',
    parts: [{ geo: 'cyl', args: [0.075, 0.075, 1.45, 12], pos: [-0.62, -0.05, 0.02], rot: [0, 0, 0.08] }] },
  { id: 'lcl', name: 'LCL', layer: 'ligament', label: [0.8, 0, -0.1], desc: 'Lateral collateral — outer-side stabilizer.',
    parts: [{ geo: 'cyl', args: [0.07, 0.07, 1.4, 12], pos: [0.67, -0.05, -0.05], rot: [0, 0, -0.08] }] },
  { id: 'medial_meniscus', name: 'Medial meniscus', layer: 'cartilage', label: [-0.25, -0.28, 0.4], desc: 'Inner shock-absorbing cartilage; commonly torn with twisting.',
    parts: [{ geo: 'tor', args: [0.34, 0.09, 10, 22], pos: [-0.2, -0.27, 0.02], rot: [1.5708, 0, 0], scale: [1, 1, 0.5] }] },
  { id: 'lateral_meniscus', name: 'Lateral meniscus', layer: 'cartilage', label: [0.25, -0.28, 0.4], desc: 'Outer shock-absorbing cartilage.',
    parts: [{ geo: 'tor', args: [0.34, 0.09, 10, 22], pos: [0.2, -0.27, 0.02], rot: [1.5708, 0, 0], scale: [1, 1, 0.5] }] },
  { id: 'patellar_tendon', name: 'Patellar tendon', layer: 'tendon', label: [0, -0.45, 0.7], desc: 'Connects the kneecap to the shin; drives knee extension.',
    parts: [{ geo: 'cyl', args: [0.09, 0.09, 0.8, 12], pos: [0, -0.4, 0.5], rot: [0.35, 0, 0] }] },
  // ── Muscles (translucent so they overlay without hiding the joint) ──
  { id: 'quadriceps', name: 'Quadriceps', layer: 'muscle', translucent: true, label: [0, 1.15, 0.65], desc: 'Front-thigh muscles; extend the knee and stabilise the kneecap.',
    parts: [{ geo: 'cyl', args: [0.44, 0.34, 1.5, 18], pos: [0, 1.0, 0.32], rot: [0.12, 0, 0] }] },
  { id: 'hamstrings', name: 'Hamstrings', layer: 'muscle', translucent: true, label: [0, 0.7, -0.75], desc: 'Back-thigh muscles; flex the knee and protect the ACL.',
    parts: [{ geo: 'cyl', args: [0.34, 0.28, 1.6, 16], pos: [0, 0.6, -0.45], rot: [-0.12, 0, 0] }] },
  { id: 'gastrocnemius', name: 'Calf (gastrocnemius)', layer: 'muscle', translucent: true, label: [0, -1.35, -0.75], desc: 'Calf muscle; crosses the back of the knee and points the foot.',
    parts: [{ geo: 'cyl', args: [0.26, 0.18, 1.4, 14], pos: [-0.24, -1.35, -0.35], rot: [-0.05, 0, 0.05] }, { geo: 'cyl', args: [0.26, 0.18, 1.4, 14], pos: [0.24, -1.35, -0.35], rot: [-0.05, 0, -0.05] }] },
  // ── Nerves ──
  { id: 'tibial_nerve', name: 'Tibial nerve', layer: 'nerve', label: [-0.2, -0.9, -0.55], desc: 'Major nerve running down the back of the knee to the foot.',
    parts: [{ geo: 'cyl', args: [0.05, 0.05, 3.4, 8], pos: [-0.05, 0, -0.32], rot: [0.03, 0, 0.02] }] },
  { id: 'fibular_nerve', name: 'Common fibular nerve', layer: 'nerve', label: [0.8, -0.7, -0.35], desc: 'Wraps around the fibular head; vulnerable to compression (foot drop).',
    parts: [{ geo: 'cyl', args: [0.045, 0.045, 1.3, 8], pos: [0.5, -0.6, -0.18], rot: [0.4, 0, -0.35] }] },
  // ── Vessels ──
  { id: 'popliteal_artery', name: 'Popliteal artery', layer: 'vessel', label: [0.2, -0.4, -0.55], desc: 'Main artery behind the knee; supplies the lower leg.',
    parts: [{ geo: 'cyl', args: [0.06, 0.06, 2.2, 8], pos: [0.06, -0.15, -0.3], rot: [0.02, 0, -0.02] }] },
];
const STRUCT_BY_ID = Object.fromEntries(STRUCTURES.map((s) => [s.id, s]));

// Range-of-motion: the lower-leg structures rotate about the knee joint line.
const PIVOT = [0, -0.4, 0];
const NEG_PIVOT = [0, 0.4, 0];
const MOVERS = new Set(['tibia', 'fibula', 'patella', 'patellar_tendon', 'medial_meniscus', 'lateral_meniscus', 'gastrocnemius', 'tibial_nerve', 'fibular_nerve', 'popliteal_artery']);

// Per-structure centroid (for camera fly-to) + explode direction.
const CENTROID = Object.fromEntries(STRUCTURES.map((s) => {
  const c = s.parts.reduce((a, p) => [a[0] + p.pos[0], a[1] + p.pos[1], a[2] + p.pos[2]], [0, 0, 0]).map((v) => v / s.parts.length);
  return [s.id, c];
}));
const DEFAULT_TARGET = new Vector3(0, -0.1, 0);

// Explode direction per structure = outward from the model centre.
const MODEL_CENTER = [0, -0.1, 0];
const EXPLODE_DIR = Object.fromEntries(STRUCTURES.map((s) => {
  const c = s.parts.reduce((a, p) => [a[0] + p.pos[0], a[1] + p.pos[1], a[2] + p.pos[2]], [0, 0, 0]).map((v) => v / s.parts.length);
  let d = [c[0] - MODEL_CENTER[0], c[1] - MODEL_CENTER[1], c[2] - MODEL_CENTER[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  d = d.map((v) => v / len);
  return [s.id, d];
}));

/* GLB_INTEGRATION — to swap in a real segmented knee:
   1) drop a Draco/KTX2 GLB at public/models/knee.glb with separately-named meshes
   2) map its mesh names → our structure ids in GLB_NAME_MAP below
   3) set USE_GLB = true. The selection/isolate/injury logic is unchanged —
      it keys off structure ids, not geometry. */
// const GLB_NAME_MAP = { Femur: 'femur', ACL_Ligament: 'acl', /* … */ };
const USE_GLB = false;

// Knee-relevant exercises pulled from the existing library.
const KNEE_MUSCLES = ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'];
const KNEE_EXERCISES = [...FIXIT_EXERCISES, ...GYM_EXERCISES]
  .filter((e) => e.bodyPart === 'Lower Body' || (e.musclesTargeted || []).some((m) => KNEE_MUSCLES.includes(m)))
  .map((e) => ({ id: e.id, name: e.name }))
  .filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i)
  .slice(0, 16);

function Geo({ p }) {
  if (p.geo === 'cyl') return <cylinderGeometry args={p.args} />;
  if (p.geo === 'sph') return <sphereGeometry args={p.args} />;
  if (p.geo === 'tor') return <torusGeometry args={p.args} />;
  return null;
}

function Structure({ s, selected, anySelected, visible, injuryStatus, explode, clipPlanes, flex, onSelect }) {
  const matRefs = useRef([]);
  const [hover, setHover] = useState(false);
  const off = explode ? EXPLODE_DIR[s.id].map((v) => v * explode * 1.7) : [0, 0, 0];
  const injColor0 = injuryStatus ? STATUS[injuryStatus].c : null;
  // Living tissue + smooth fades: ease opacity and glow every frame (no snapping)
  // — artery heartbeat, nerve shimmer, selected/injured throb, isolate fade.
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let ei;
    if (selected) ei = 0.55 + 0.32 * Math.sin(t * 4);
    else if (injColor0) ei = 0.3 + 0.14 * Math.sin(t * 3);
    else if (s.layer === 'vessel') ei = 0.18 + 0.28 * Math.max(0, Math.sin(t * 2.3)); // heartbeat
    else if (s.layer === 'nerve') ei = 0.12 + 0.14 * (0.5 + 0.5 * Math.sin(t * 5 + s.id.length));
    else ei = hover ? 0.5 : 0;
    const targetOp = (anySelected && !selected) ? 0.09 : (s.translucent && !selected && !injColor0) ? 0.5 : 1;
    matRefs.current.forEach((m) => {
      if (!m) return;
      m.emissiveIntensity += (ei - m.emissiveIntensity) * 0.2;
      m.opacity += (targetOp - m.opacity) * 0.16;
      m.depthWrite = m.opacity > 0.9;
    });
  });
  if (!visible) return null;
  const mover = MOVERS.has(s.id);
  const injColor = injColor0;
  const base = injColor || LAYER_COLORS[s.layer];
  const idleEmissive = s.layer === 'vessel' ? '#c0555a' : s.layer === 'nerve' ? '#ecd35a' : '#000000';
  const emissive = selected ? '#e0655a' : injColor ? injColor : hover ? '#3d8593' : idleEmissive;
  const content = (
    <group
      position={off}
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
            emissive={emissive}
            roughness={0.5} metalness={0.05}
            clippingPlanes={clipPlanes}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
  // Flex the knee: rotate movers about the joint pivot (translate→rotate→translate back).
  if (!mover || !flex) return content;
  return (
    <group position={PIVOT} rotation={[flex, 0, 0]}>
      <group position={NEG_PIVOT}>{content}</group>
    </group>
  );
}

// Eases the orbit target toward the selected structure — a cinematic recenter.
function CameraRig({ focus }) {
  const { controls } = useThree();
  useFrame(() => {
    if (!controls?.target) return;
    controls.target.lerp(focus || DEFAULT_TARGET, 0.07);
    controls.update?.();
  });
  return null;
}

function Scene({ selectedId, setSelectedId, layers, injuryMap, explode, clipPlanes, flex }) {
  const selected = STRUCT_BY_ID[selectedId];
  const focus = selected ? new Vector3(CENTROID[selected.id][0], CENTROID[selected.id][1], CENTROID[selected.id][2]) : null;
  return (
    <Canvas camera={{ position: [3.6, 0.8, 4.6], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, localClippingEnabled: true }} onPointerMissed={() => setSelectedId(null)}>
      <color attach="background" args={['#0c0f12']} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#bcd6de', '#241d1a', 0.45]} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <directionalLight position={[-5, 2, -4]} intensity={0.45} color="#9fd0da" />
      <directionalLight position={[0, 1, -6]} intensity={0.5} color="#ffd9c0" />
      <Suspense fallback={null}>
        {STRUCTURES.map((s) => (
          <Structure key={s.id} s={s} selected={s.id === selectedId} anySelected={!!selectedId}
            visible={layers[s.layer]} injuryStatus={injuryMap[s.id]?.status || null}
            explode={explode} clipPlanes={clipPlanes} flex={flex} onSelect={setSelectedId} />
        ))}
        {/* persistent injury tags (hidden while a structure is isolated) */}
        {!selectedId && Object.entries(injuryMap).map(([id, inj]) => {
          const s = STRUCT_BY_ID[id]; if (!s || !layers[s.layer]) return null;
          return (
            <Html key={id} position={s.label} center distanceFactor={9} pointerEvents="none" zIndexRange={[10, 0]}>
              <div style={{ background: STATUS[inj.status].c, color: '#1a1a1a', fontFamily: 'system-ui', fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>{s.name}</div>
            </Html>
          );
        })}
        {selected && layers[selected.layer] && (
          <Html position={selected.label} center distanceFactor={9} pointerEvents="none" zIndexRange={[11, 0]}>
            <div style={{ background: 'rgba(224,101,90,0.94)', color: '#fff', fontFamily: 'system-ui', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap', boxShadow: '0 6px 18px rgba(0,0,0,0.4)', transform: 'translateY(-8px)' }}>{selected.name}</div>
          </Html>
        )}
        <ContactShadows position={[0, -2.75, 0]} opacity={0.45} scale={12} blur={2.6} far={4.5} color="#000000" />
      </Suspense>
      <CameraRig focus={focus} />
      <OrbitControls makeDefault enablePan minDistance={2.2} maxDistance={13} autoRotate={!selectedId} autoRotateSpeed={0.5} />
    </Canvas>
  );
}

const inp = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', boxSizing: 'border-box' };
const chip = (active, color) => ({ padding: '5px 11px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${active ? color : 'var(--color-border)'}`, background: active ? color + '22' : 'white', color: active ? color : 'var(--color-text)' });
const ctlBtn = (active) => ({ padding: '5px 10px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer', border: `1px solid ${active ? '#57b6c4' : 'rgba(255,255,255,0.18)'}`, background: active ? 'rgba(87,182,196,0.2)' : 'rgba(0,0,0,0.35)', color: active ? '#9fe3ec' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)' });

export default function Anatomy() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [injuries, setInjuries] = useState([]);          // for selected patient
  const [sessions, setSessions] = useState([]);          // patient's pose-check sessions (real rehab data)
  const [selectedId, setSelectedId] = useState(null);
  const [layers, setLayers] = useState({ muscle: true, tendon: true, ligament: true, cartilage: true, nerve: true, vessel: true, bone: true });
  const [explode, setExplode] = useState(0);            // 0..1 exploded view
  const [flex, setFlex] = useState(0);                  // 0..1 knee flexion
  const [crossOn, setCrossOn] = useState(false);        // cross-section on/off
  const [crossAxis, setCrossAxis] = useState('z');
  const [crossPos, setCrossPos] = useState(0);
  const clipPlanes = useMemo(() => {
    if (!crossOn) return [];
    const n = crossAxis === 'x' ? new Vector3(1, 0, 0) : crossAxis === 'y' ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);
    return [new Plane(n, crossPos)];
  }, [crossOn, crossAxis, crossPos]);
  const [form, setForm] = useState(null);                // new-injury draft
  const [busy, setBusy] = useState(false);
  const [aiNote, setAiNote] = useState('');              // free-text clinical note
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const [listening, setListening] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const [notes, setNotes] = useState('');           // patient background notes
  const [summary, setSummary] = useState('');       // AI patient summary
  const [savingNotes, setSavingNotes] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    getAllUsers().then((all) => setPatients(all.filter((u) => {
      const roles = u.roles && Array.isArray(u.roles) ? u.roles : [u.role];
      return roles.includes('patient');
    }))).catch(() => {});
  }, []);

  const loadInjuries = (uid) => {
    if (!uid) { setInjuries([]); return; }
    getAnatomyInjuries(uid).then(setInjuries).catch(() => setInjuries([]));
  };
  useEffect(() => {
    loadInjuries(patientId);
    if (patientId) getSessions(patientId).then(setSessions).catch(() => setSessions([])); else setSessions([]);
  }, [patientId]);

  // Real rehab signal: latest pose-check score across an injury's linked exercises.
  const rehabFor = (inj) => {
    const ids = new Set((inj.exercises || []).map((e) => e.id));
    const matched = sessions.filter((s) => ids.has(s.exerciseId) && typeof s.aiScore === 'number');
    if (!matched.length) return null;                    // sessions are desc by createdAt
    return { latest: matched[0].aiScore, count: matched.length, delta: matched[0].aiScore - matched[matched.length - 1].aiScore };
  };

  // ── Patient dossier: notes + AI summary + assigned exercises & performance ──
  const patient = useMemo(() => patients.find((p) => p.id === patientId) || null, [patients, patientId]);
  useEffect(() => { setNotes(patient?.background || ''); setSummary(patient?.aiSummary || ''); }, [patient]);
  const reloadPatients = () => getAllUsers().then((all) => setPatients(all.filter((u) => {
    const r = u.roles && Array.isArray(u.roles) ? u.roles : [u.role];
    return r.includes('patient');
  }))).catch(() => {});
  const assignedExercises = useMemo(() => {
    const m = {};
    for (const inj of injuries) for (const ex of (inj.exercises || [])) m[ex.id] = ex.name;
    return Object.entries(m).map(([id, name]) => {
      const matched = sessions.filter((s) => s.exerciseId === id && typeof s.aiScore === 'number');
      return { id, name, latest: matched.length ? matched[0].aiScore : null, count: matched.length };
    });
  }, [injuries, sessions]);
  const saveNotes = async () => {
    if (!patientId) return;
    setSavingNotes(true);
    try { await updatePatientDossier(patientId, { background: notes }); reloadPatients(); } finally { setSavingNotes(false); }
  };
  const genSummary = async () => {
    if (!patientId) return;
    setSummarizing(true);
    try {
      const { summary: s } = await marketing.summarizePatient({ background: notes, injuries, sessions: sessions.slice(0, 30) });
      setSummary(s); await updatePatientDossier(patientId, { aiSummary: s });
    } catch { /* */ } finally { setSummarizing(false); }
  };

  const injuryMap = useMemo(() => Object.fromEntries(injuries.map((i) => [i.structureId, i])), [injuries]);
  const selected = STRUCT_BY_ID[selectedId];
  const selectedInjury = selected ? injuryMap[selected.id] : null;

  const pick = (id) => {
    const s = STRUCT_BY_ID[id];
    if (s && !layers[s.layer]) setLayers((l) => ({ ...l, [s.layer]: true }));
    setSelectedId(id); setForm(null);
  };

  const startMark = () => setForm({ injuryType: 'Sprain', grade: '', side: '', note: '', exercises: [] });

  const saveInjury = async () => {
    if (!patientId || !selected) return;
    setBusy(true);
    try {
      await addAnatomyInjury(patientId, {
        structureId: selected.id, structureName: selected.name,
        injuryType: form.injuryType, grade: form.grade, side: form.side, note: form.note,
        exercises: form.exercises, status: 'acute',
        healingLog: [{ date: new Date().toISOString(), status: 'acute', note: 'Injury marked' }],
      });
      setForm(null); loadInjuries(patientId);
    } finally { setBusy(false); }
  };

  const advance = async (inj) => {
    const next = STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(inj.status) + 1, STATUS_ORDER.length - 1)];
    if (next === inj.status) return;
    const log = [...(inj.healingLog || []), { date: new Date().toISOString(), status: next, note: `Advanced to ${STATUS[next].label}` }];
    await updateAnatomyInjury(patientId, inj.id, { status: next, healingLog: log });
    loadInjuries(patientId);
  };
  const removeInjury = async (inj) => { await deleteAnatomyInjury(patientId, inj.id); loadInjuries(patientId); };

  // AI: parse a free-text clinical note → mark the structures on the model.
  const markFromNotes = async (noteArg) => {
    const note = (typeof noteArg === 'string' ? noteArg : aiNote).trim();
    if (!patientId || !note) return;
    setAiBusy(true); setAiMsg('');
    try {
      const { injuries: parsed } = await marketing.parseAnatomy(
        note,
        STRUCTURES.map((s) => ({ id: s.id, name: s.name })),
        KNEE_EXERCISES,
      );
      if (!parsed?.length) { setAiMsg('No structure recognised — try naming one, e.g. “ACL grade 3”.'); return; }
      const exLookup = Object.fromEntries(KNEE_EXERCISES.map((e) => [e.id, e]));
      for (const p of parsed) {
        const s = STRUCT_BY_ID[p.structureId]; if (!s) continue;
        await addAnatomyInjury(patientId, {
          structureId: p.structureId, structureName: s.name,
          injuryType: p.injuryType || 'Inflammation', grade: p.grade || '', side: p.side || '', note: p.note || '',
          exercises: (p.exerciseIds || []).map((id) => exLookup[id]).filter(Boolean),
          status: 'acute',
          healingLog: [{ date: new Date().toISOString(), status: 'acute', note: 'Marked from clinical note' }],
        });
      }
      loadInjuries(patientId);
      setAiMsg(`Marked ${parsed.length}: ${parsed.map((p) => STRUCT_BY_ID[p.structureId]?.name).filter(Boolean).join(', ')}`);
      setAiNote(''); setSelectedId(parsed[0].structureId);
    } catch (e) { setAiMsg('Could not parse — ' + (e.message || 'try again')); }
    finally { setAiBusy(false); }
  };

  // Voice: dictate the clinical note, then auto-mark the model.
  const dictate = async () => {
    if (listening || aiBusy) return;
    setListening(true); setAiMsg('Listening… speak the injury');
    try {
      const t = await listenStream({ onInterim: (x) => setAiNote(x) });
      setListening(false);
      if (t && t.trim()) { setAiNote(t); await markFromNotes(t); }
      else setAiMsg('Didn’t catch that — try again or type it.');
    } catch { setListening(false); setAiMsg('Mic unavailable — type the note instead.'); }
  };
  const toggleEx = (ex) => setForm((f) => ({ ...f, exercises: f.exercises.some((x) => x.id === ex.id) ? f.exercises.filter((x) => x.id !== ex.id) : [...f.exercises, ex] }));

  // Patient takeaway: a clean printable recovery plan.
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const printHandout = () => {
    const p = patients.find((x) => x.id === patientId);
    const cards = injuries.map((inj) => {
      const s = STRUCT_BY_ID[inj.structureId]; const r = rehabFor(inj);
      return `<div class="inj"><h3>${esc(inj.structureName)} <span class="pill" style="background:${STATUS[inj.status].c}22;color:${STATUS[inj.status].c}">${STATUS[inj.status].label}</span></h3>
        <p class="t">${esc(inj.injuryType)}${inj.grade ? ` · Grade ${esc(inj.grade)}` : ''}${inj.side ? ` · ${esc(inj.side)}` : ''}</p>
        <p class="d">${esc(s?.desc || '')}</p>
        ${inj.note ? `<p><b>Note:</b> ${esc(inj.note)}</p>` : ''}
        ${inj.exercises?.length ? `<p><b>Your exercises:</b> ${inj.exercises.map((e) => esc(e.name)).join(', ')}</p>` : ''}
        ${r ? `<p><b>Latest form score:</b> ${r.latest}/100 · ${r.count} check${r.count > 1 ? 's' : ''}</p>` : ''}</div>`;
    }).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>FIXIT recovery plan</title>
      <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2b3531;max-width:640px;margin:32px auto;padding:0 20px}
      h1{font-size:22px;margin:0}.sub{color:#6b746f;font-size:13px;margin:2px 0 20px}
      .inj{border:1px solid #e0dacd;border-radius:12px;padding:14px 16px;margin:10px 0}
      .inj h3{margin:0 0 4px;font-size:16px}.pill{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;vertical-align:middle}
      .t{color:#708E86;font-weight:600;margin:2px 0}.d{color:#44504c;font-size:13px;margin:4px 0}
      p{font-size:13px;margin:4px 0}.foot{color:#98a2a0;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:10px}</style></head>
      <body><h1>FIXIT · Your recovery plan</h1><div class="sub">Prepared for ${esc(p?.name || 'you')} · ${new Date().toLocaleDateString()}</div>
      ${cards || '<p>No injuries recorded yet.</p>'}
      <p class="foot">Patient-education material from your practitioner — not a diagnosis. Follow your clinician's guidance.</p></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups to print the handout.'); return; }
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Bone size={22} /> Anatomy Consult <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-accent)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '999px' }}>Knee</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setArOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)' }}><Box size={15} /> View in AR</button>
          <select value={patientId} onChange={(e) => { setPatientId(e.target.value); setSelectedId(null); setForm(null); }} style={{ ...inp, width: 'auto', fontWeight: 600 }}>
            <option value="">Demo (no patient)</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name || p.email}</option>)}
          </select>
        </div>
      </div>

      {arOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,10,12,0.96)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', color: '#e9eef1' }}>
            <div style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.1rem' }}>Knee — 3D / AR</div>
            <button onClick={() => setArOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#e9eef1', borderRadius: '999px', padding: '7px 14px', cursor: 'pointer', fontSize: '0.8rem' }}><X size={14} /> Close</button>
          </div>
          <model-viewer
            src="/models/knee.glb" alt="3D knee anatomy"
            camera-controls auto-rotate ar ar-modes="webxr scene-viewer quick-look"
            shadow-intensity="1" exposure="1.05" camera-orbit="30deg 75deg 4m"
            style={{ flex: 1, width: '100%', background: '#0c0f12' }}
          ></model-viewer>
          <div style={{ textAlign: 'center', color: '#9fb0ba', fontSize: '0.78rem', padding: '12px 18px 20px' }}>
            On a phone or tablet, tap the <b>AR</b> icon to place the knee in the room. On desktop, drag to rotate.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* viewport */}
        <div style={{ position: 'relative', flex: '1 1 440px', minWidth: '300px', height: '74vh', minHeight: '440px', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--color-border)', background: '#0c0f12' }}>
          <Scene selectedId={selectedId} setSelectedId={setSelectedId} layers={layers} injuryMap={injuryMap} explode={explode} clipPlanes={clipPlanes} flex={flex * 1.3} />
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '80%' }}>
            {Object.keys(LAYER_LABELS).map((k) => (
              <button key={k} onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.66rem', fontWeight: 700, padding: '5px 10px', borderRadius: '999px', cursor: 'pointer', border: `1px solid ${layers[k] ? LAYER_COLORS[k] : 'rgba(255,255,255,0.15)'}`, background: layers[k] ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.3)', color: layers[k] ? '#fff' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(6px)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: LAYER_COLORS[k], opacity: layers[k] ? 1 : 0.4 }} /> {LAYER_LABELS[k]}
              </button>
            ))}
          </div>
          {selectedId && (
            <button onClick={() => { setSelectedId(null); setForm(null); }} style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 700, padding: '6px 12px', borderRadius: '999px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(6px)' }}><RotateCcw size={12} /> Show all</button>
          )}
          {/* bottom bar: view tools + status legend */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 14px', background: 'linear-gradient(0deg, rgba(6,10,12,0.9), transparent)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.66rem', fontWeight: 700, color: '#cfe0e4' }}>
                Flex {flex > 0 ? `${Math.round(flex * 75)}°` : ''}
                <input type="range" min="0" max="1" step="0.01" value={flex} onChange={(e) => setFlex(+e.target.value)} style={{ width: 84, accentColor: '#57b6c4' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.66rem', fontWeight: 700, color: '#cfe0e4' }}>
                Explode
                <input type="range" min="0" max="1" step="0.01" value={explode} onChange={(e) => setExplode(+e.target.value)} style={{ width: 84, accentColor: '#57b6c4' }} />
              </label>
              <button onClick={() => setCrossOn((v) => !v)} style={ctlBtn(crossOn)}>Cross-section</button>
              {crossOn && (
                <>
                  {['x', 'y', 'z'].map((a) => <button key={a} onClick={() => setCrossAxis(a)} style={ctlBtn(crossAxis === a)}>{a.toUpperCase()}</button>)}
                  <input type="range" min="-1.8" max="1.8" step="0.02" value={crossPos} onChange={(e) => setCrossPos(+e.target.value)} style={{ width: 84, accentColor: '#57b6c4' }} />
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui' }}>
              {Object.entries(STATUS).map(([k, v]) => <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: v.c }} />{v.label}</span>)}
            </div>
          </div>
        </div>

        {/* right rail */}
        <div style={{ flex: '0 0 320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Patient dossier — notes + AI summary + assigned exercises & performance */}
          {patientId && (
            <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{patient?.name || patient?.email}</div>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>Patient</span>
              </div>
              <label style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>Background notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Injuries, goals, history, contraindications… (admin-only)"
                style={{ ...inp, minHeight: '52px', resize: 'vertical', marginTop: '4px' }} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button onClick={saveNotes} disabled={savingNotes} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--color-secondary)', color: 'white', fontWeight: 700, fontSize: '0.72rem' }}>{savingNotes ? 'Saving…' : 'Save notes'}</button>
                <button onClick={genSummary} disabled={summarizing} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer', background: 'white', color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.72rem' }}><Sparkles size={12} /> {summarizing ? 'Summarizing…' : 'AI summary'}</button>
              </div>
              {summary && <div style={{ marginTop: '8px', fontSize: '0.76rem', color: 'var(--color-text)', background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 10px', lineHeight: 1.5 }}>{summary}</div>}
              {assignedExercises.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)', marginBottom: '4px' }}>Assigned exercises &amp; performance</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {assignedExercises.map((ex) => (
                      <div key={ex.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--color-text)' }}>
                        <span>🏋 {ex.name}</span>
                        {ex.latest != null ? <span style={{ fontWeight: 700, color: ex.latest >= 80 ? '#2e7d32' : ex.latest >= 60 ? '#b8860b' : '#c0392b' }}>{ex.latest}<span style={{ opacity: 0.5, fontWeight: 400 }}> · {ex.count}✓</span></span> : <span style={{ opacity: 0.5 }}>not done</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI: mark from clinical notes */}
          {patientId && (
            <div style={{ background: 'linear-gradient(135deg, #14262b, #101b1f)', border: '1px solid #2c4750', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#7fd0dc' }}>
                  <Sparkles size={13} /> Mark from notes
                </div>
                <button onClick={dictate} disabled={aiBusy} title="Dictate" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.66rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', cursor: 'pointer', border: `1px solid ${listening ? '#e0655a' : '#2c4750'}`, background: listening ? 'rgba(224,101,90,0.2)' : 'rgba(255,255,255,0.04)', color: listening ? '#f0b8b0' : '#9fb0ba' }}>
                  <Mic size={12} /> {listening ? 'Listening…' : 'Speak'}
                </button>
              </div>
              <textarea value={aiNote} onChange={(e) => setAiNote(e.target.value)}
                placeholder="Type or speak — e.g. “ACL grade 3 tear, medial meniscus tear, early arthritis in the knee”"
                style={{ width: '100%', minHeight: '58px', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1px solid #2c4750', background: 'rgba(255,255,255,0.04)', color: '#e9eef1', fontSize: '0.82rem', padding: '8px 10px' }} />
              <button onClick={() => markFromNotes()} disabled={aiBusy || !aiNote.trim()} style={{ marginTop: '8px', width: '100%', padding: '9px', borderRadius: '9px', border: 'none', cursor: aiBusy || !aiNote.trim() ? 'default' : 'pointer', background: 'linear-gradient(135deg,#57b6c4,#3d8593)', color: '#08181b', fontWeight: 800, fontSize: '0.82rem', opacity: aiBusy || !aiNote.trim() ? 0.6 : 1 }}>
                {aiBusy ? 'Reading the note…' : 'Mark on the model →'}
              </button>
              {aiMsg && <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#9fb0ba' }}>{aiMsg}</div>}
            </div>
          )}

          {/* selected structure / mark form / injury detail */}
          <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px' }}>
            {!selected ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>Click a structure to inspect it{patientId ? ' and mark an injury' : ''}.</div>
            ) : form ? (
              <>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '10px' }}>Mark injury · {selected.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select value={form.injuryType} onChange={(e) => setForm({ ...form, injuryType: e.target.value })} style={inp}>{INJURY_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['1', '2', '3'].map((g) => <button key={g} onClick={() => setForm({ ...form, grade: form.grade === g ? '' : g })} style={chip(form.grade === g, '#d8ab4f')}>Grade {g}</button>)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['left', 'right'].map((sd) => <button key={sd} onClick={() => setForm({ ...form, side: form.side === sd ? '' : sd })} style={chip(form.side === sd, '#3d8593')}>{sd[0].toUpperCase() + sd.slice(1)}</button>)}
                  </div>
                  <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Clinical note (optional)" style={{ ...inp, minHeight: '52px', resize: 'vertical' }} />
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>Link exercises</div>
                  <div style={{ maxHeight: '132px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {KNEE_EXERCISES.map((ex) => {
                      const on = form.exercises.some((x) => x.id === ex.id);
                      return <button key={ex.id} onClick={() => toggleEx(ex)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 9px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${on ? '#6fc08a' : 'var(--color-border)'}`, background: on ? '#6fc08a18' : 'white', fontSize: '0.78rem', color: on ? '#2e7d32' : 'var(--color-secondary)', textAlign: 'left' }}><span style={{ width: 14, height: 14, borderRadius: '4px', border: `2px solid ${on ? '#6fc08a' : '#ccc'}`, background: on ? '#6fc08a' : 'white', color: 'white', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on ? '✓' : ''}</span>{ex.name}</button>;
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <button onClick={saveInjury} disabled={busy} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'var(--color-secondary)', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>{busy ? 'Saving…' : 'Save injury'}</button>
                    <button onClick={() => setForm(null)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text)' }}>Cancel</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{selected.name}</div>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>{LAYER_LABELS[selected.layer]}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', margin: '6px 0 10px', lineHeight: 1.5 }}>{selected.desc}</p>
                {selectedInjury ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '999px', background: STATUS[selectedInjury.status].c + '22', color: STATUS[selectedInjury.status].c, fontWeight: 700, fontSize: '0.68rem' }}>{STATUS[selectedInjury.status].label}</span>
                    {selectedInjury.injuryType}{selectedInjury.grade ? ` · Grade ${selectedInjury.grade}` : ''} — see below
                  </div>
                ) : patientId ? (
                  <button onClick={startMark} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#e0655a', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}><Plus size={14} /> Mark injury here</button>
                ) : (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', fontStyle: 'italic' }}>Select a patient above to mark an injury.</div>
                )}
              </>
            )}
          </div>

          {/* injuries + healing loop */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={12} /> Injuries &amp; recovery {injuries.length ? `(${injuries.length})` : ''}</div>
              {injuries.length > 0 && (
                <button onClick={printHandout} title="Print patient handout" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', fontWeight: 700, padding: '4px 9px', borderRadius: '999px', cursor: 'pointer', border: '1px solid var(--color-border)', background: 'white', color: 'var(--color-text)' }}><Printer size={12} /> Handout</button>
              )}
            </div>
            {!patientId ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text)', fontStyle: 'italic', padding: '4px 0' }}>Pick a patient to build their recovery record.</div>
            ) : injuries.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text)', fontStyle: 'italic', padding: '4px 0' }}>No injuries marked yet. Click a structure → “Mark injury”.</div>
            ) : injuries.map((inj) => (
              <div key={inj.id} style={{ background: 'white', border: `1px solid ${STATUS[inj.status].c}55`, borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <button onClick={() => pick(inj.structureId)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>{inj.structureName} <ChevronRight size={13} /></button>
                  <span style={{ padding: '2px 9px', borderRadius: '999px', background: STATUS[inj.status].c + '22', color: STATUS[inj.status].c, fontWeight: 800, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{STATUS[inj.status].label}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text)', margin: '4px 0' }}>{inj.injuryType}{inj.grade ? ` · Grade ${inj.grade}` : ''}{inj.side ? ` · ${inj.side}` : ''}{inj.note ? ` — ${inj.note}` : ''}</div>
                {inj.exercises?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0' }}>
                    {inj.exercises.map((ex) => <span key={ex.id} style={{ fontSize: '0.64rem', padding: '2px 8px', borderRadius: '999px', background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}>🏋 {ex.name}</span>)}
                  </div>
                )}
                {/* real rehab signal from pose-check scores */}
                {(() => {
                  const r = rehabFor(inj);
                  if (!r) return null;
                  const sc = r.latest >= 80 ? '#2e7d32' : r.latest >= 60 ? '#b8860b' : '#c0392b';
                  return (
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text)', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Activity size={11} /> Rehab form <b style={{ color: sc }}>{r.latest}</b>
                      {r.delta ? <span style={{ color: r.delta > 0 ? '#2e7d32' : '#c0392b', fontWeight: 700 }}>{r.delta > 0 ? '↑' : '↓'}{Math.abs(r.delta)}</span> : null}
                      <span style={{ opacity: 0.7 }}>· {r.count} check{r.count > 1 ? 's' : ''}</span>
                      {r.latest >= 80 && inj.status !== 'recovered' && <span style={{ color: '#2e7d32', fontWeight: 700 }}>— strong, consider advancing</span>}
                    </div>
                  );
                })()}
                {/* healing progress bar */}
                <div style={{ display: 'flex', gap: '3px', margin: '8px 0 6px' }}>
                  {STATUS_ORDER.map((st) => <div key={st} style={{ flex: 1, height: '5px', borderRadius: '3px', background: STATUS_ORDER.indexOf(st) <= STATUS_ORDER.indexOf(inj.status) ? STATUS[inj.status].c : 'var(--color-border)' }} />)}
                </div>
                {inj.healingLog?.length > 0 && (
                  <div style={{ fontSize: '0.66rem', color: 'var(--color-text)', marginBottom: '6px' }}>
                    {inj.healingLog.slice(-2).map((h, i) => <div key={i}>· {new Date(h.date).toLocaleDateString()} — {h.note}</div>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {inj.status !== 'recovered' && <button onClick={() => advance(inj)} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: STATUS[STATUS_ORDER[STATUS_ORDER.indexOf(inj.status) + 1]].c, color: '#1a1a1a', fontWeight: 700, fontSize: '0.72rem' }}>Mark {STATUS[STATUS_ORDER[STATUS_ORDER.indexOf(inj.status) + 1]].label} →</button>}
                  <button onClick={() => removeInjury(inj)} title="Delete" style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', color: '#c0392b' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.66rem', color: 'var(--color-text)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5 }}>
            <strong>The loop:</strong> inspect a part → mark the injury → link exercises → advance healing (Acute → Healing → Recovered) and watch the structure change colour on the model. Next: swap in a real segmented knee{USE_GLB ? '' : ' (GLB drop-in ready)'} + let the AI voice operate it.
          </div>
        </div>
      </div>
    </div>
  );
}
