import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Bone, RotateCcw, Plus, Trash2, ChevronRight, Activity, Sparkles } from 'lucide-react';
import { FIXIT_EXERCISES } from '../data/fixit-exercises';
import { GYM_EXERCISES } from '../data/gym-exercises';
import {
  getAllUsers, getAnatomyInjuries, addAnatomyInjury, updateAnatomyInjury, deleteAnatomyInjury,
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

function Structure({ s, selected, anySelected, visible, injuryStatus, onSelect }) {
  const matRefs = useRef([]);
  const [hover, setHover] = useState(false);
  const ghost = anySelected && !selected;
  useFrame(({ clock }) => {
    if (!selected) return;
    const p = 0.5 + 0.35 * Math.sin(clock.elapsedTime * 4);
    matRefs.current.forEach((m) => { if (m) m.emissiveIntensity = p; });
  });
  if (!visible) return null;
  const injColor = injuryStatus ? STATUS[injuryStatus].c : null;
  const base = injColor || LAYER_COLORS[s.layer];
  const emissive = selected ? '#e0655a' : injColor ? injColor : hover ? '#3d8593' : '#000000';
  const emissiveInt = selected ? 0.6 : injColor ? 0.35 : hover ? 0.5 : 0;
  // Bulky muscles render translucent so you can still see the joint underneath.
  const translucent = s.translucent && !selected && !injColor;
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
            emissive={emissive} emissiveIntensity={emissiveInt}
            roughness={0.5} metalness={0.05}
            transparent={ghost || translucent} opacity={ghost ? 0.09 : translucent ? 0.5 : 1} depthWrite={!ghost && !translucent}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ selectedId, setSelectedId, layers, injuryMap }) {
  const selected = STRUCT_BY_ID[selectedId];
  return (
    <Canvas camera={{ position: [3.6, 0.8, 4.6], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }} onPointerMissed={() => setSelectedId(null)}>
      <color attach="background" args={['#0c0f12']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <directionalLight position={[-5, 2, -4]} intensity={0.4} color="#9fd0da" />
      <Suspense fallback={null}>
        {STRUCTURES.map((s) => (
          <Structure key={s.id} s={s} selected={s.id === selectedId} anySelected={!!selectedId}
            visible={layers[s.layer]} injuryStatus={injuryMap[s.id]?.status || null} onSelect={setSelectedId} />
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
      </Suspense>
      <OrbitControls makeDefault enablePan minDistance={2.2} maxDistance={13} target={[0, -0.1, 0]} />
    </Canvas>
  );
}

const inp = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', boxSizing: 'border-box' };
const chip = (active, color) => ({ padding: '5px 11px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${active ? color : 'var(--color-border)'}`, background: active ? color + '22' : 'white', color: active ? color : 'var(--color-text)' });

export default function Anatomy() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [injuries, setInjuries] = useState([]);          // for selected patient
  const [selectedId, setSelectedId] = useState(null);
  const [layers, setLayers] = useState({ muscle: true, tendon: true, ligament: true, cartilage: true, nerve: true, vessel: true, bone: true });
  const [form, setForm] = useState(null);                // new-injury draft
  const [busy, setBusy] = useState(false);
  const [aiNote, setAiNote] = useState('');              // free-text clinical note
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState('');

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
  useEffect(() => { loadInjuries(patientId); }, [patientId]);

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
  const markFromNotes = async () => {
    if (!patientId || !aiNote.trim()) return;
    setAiBusy(true); setAiMsg('');
    try {
      const { injuries: parsed } = await marketing.parseAnatomy(
        aiNote.trim(),
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
  const toggleEx = (ex) => setForm((f) => ({ ...f, exercises: f.exercises.some((x) => x.id === ex.id) ? f.exercises.filter((x) => x.id !== ex.id) : [...f.exercises, ex] }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Bone size={22} /> Anatomy Consult <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-accent)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '999px' }}>Knee</span>
        </h1>
        <select value={patientId} onChange={(e) => { setPatientId(e.target.value); setSelectedId(null); setForm(null); }} style={{ ...inp, width: 'auto', fontWeight: 600 }}>
          <option value="">Demo (no patient)</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name || p.email}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* viewport */}
        <div style={{ position: 'relative', flex: '1 1 440px', minWidth: '300px', height: '74vh', minHeight: '440px', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--color-border)', background: '#0c0f12' }}>
          <Scene selectedId={selectedId} setSelectedId={setSelectedId} layers={layers} injuryMap={injuryMap} />
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
          {/* legend */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: '10px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui' }}>
            {Object.entries(STATUS).map(([k, v]) => <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: v.c }} />{v.label}</span>)}
          </div>
        </div>

        {/* right rail */}
        <div style={{ flex: '0 0 320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* AI: mark from clinical notes */}
          {patientId && (
            <div style={{ background: 'linear-gradient(135deg, #14262b, #101b1f)', border: '1px solid #2c4750', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#7fd0dc', marginBottom: '8px' }}>
                <Sparkles size={13} /> Mark from notes
              </div>
              <textarea value={aiNote} onChange={(e) => setAiNote(e.target.value)}
                placeholder="e.g. ACL grade 3 tear, medial meniscus tear, early arthritis in the knee"
                style={{ width: '100%', minHeight: '58px', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1px solid #2c4750', background: 'rgba(255,255,255,0.04)', color: '#e9eef1', fontSize: '0.82rem', padding: '8px 10px' }} />
              <button onClick={markFromNotes} disabled={aiBusy || !aiNote.trim()} style={{ marginTop: '8px', width: '100%', padding: '9px', borderRadius: '9px', border: 'none', cursor: aiBusy || !aiNote.trim() ? 'default' : 'pointer', background: 'linear-gradient(135deg,#57b6c4,#3d8593)', color: '#08181b', fontWeight: 800, fontSize: '0.82rem', opacity: aiBusy || !aiNote.trim() ? 0.6 : 1 }}>
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
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={12} /> Injuries &amp; recovery {injuries.length ? `(${injuries.length})` : ''}</div>
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
