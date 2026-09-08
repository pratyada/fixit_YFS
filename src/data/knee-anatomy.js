// Shared knee anatomy — the SINGLE source of truth for both the practitioner's
// interactive "Know Your Injury" (src/pages/Anatomy.jsx) and the patient's
// read-only 3D view (src/components/InjuryModel3D.jsx). Because both read the
// same structure ids + geometry here, an injury the practitioner marks on a
// structure lights up on the exact same part of the patient's model.

export const LAYER_COLORS = { muscle: '#cf7b6e', tendon: '#ddc59c', ligament: '#cbbd97', cartilage: '#a9c4d6', nerve: '#ecd35a', vessel: '#c0555a', bone: '#e9e3d5' };
export const LAYER_LABELS = { muscle: 'Muscles', tendon: 'Tendon', ligament: 'Ligaments', cartilage: 'Cartilage', nerve: 'Nerves', vessel: 'Vessels', bone: 'Bones' };
export const STATUS = { acute: { c: '#e0655a', label: 'Acute' }, healing: { c: '#d8ab4f', label: 'Healing' }, recovered: { c: '#6fc08a', label: 'Recovered' } };

export const STRUCTURES = [
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

export const STRUCT_BY_ID = Object.fromEntries(STRUCTURES.map((s) => [s.id, s]));
