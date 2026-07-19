// ─── Movement Analysis Engine v2 ───
// Redesign grounded in the pose-scoring research spec:
//  • angle-based (scale/distance invariant); pixel metrics normalized by body size
//  • per-keypoint confidence gating + One-Euro temporal smoothing
//  • camera-view detection (front/side) — each criterion gated to the view it's valid in
//  • rep segmentation (hysteresis) with per-rep depth/tempo, or isometric hold detection
//  • per-exercise biomechanical profiles with calibrated scoring bands
//  • intra-rep smoothness + inter-rep consistency instead of "global variance = instability"
//  • companion data-quality score so a bad recording never yields a confidently-wrong verdict
// Output stays backward-compatible (overall/categories/faults/angles/timeline) and adds
// { reps, view, dataQuality, perRep, consistency }.

const C_MIN = 0.3;   // keypoint confidence floor

// ── math helpers ──
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const std = (a) => { if (a.length < 2) return 0; const m = avg(a); return Math.sqrt(avg(a.map((v) => (v - m) ** 2))); };
const pct = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[clamp(Math.round((p / 100) * (s.length - 1)), 0, s.length - 1)]; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// joint angle at vertex b (A-B-C), 0..180 — invariant to translation/scale
function angle(a, b, c) {
  if (!a || !b || !c) return null;
  const ux = a.x - b.x, uy = a.y - b.y, vx = c.x - b.x, vy = c.y - b.y;
  const dot = ux * vx + uy * vy, cr = ux * vy - uy * vx;
  const deg = Math.abs(Math.atan2(cr, dot) * 180 / Math.PI);
  return deg > 180 ? 360 - deg : deg;
}
// angle of segment (a→b) from vertical (0 = straight up/down), degrees 0..90
function fromVertical(a, b) {
  if (!a || !b) return null;
  const x = Math.abs(Math.atan2(b.x - a.x, b.y - a.y) * 180 / Math.PI) % 180;
  return x > 90 ? 180 - x : x;
}

// piecewise-linear scoring band: full credit inside [idealLo,idealHi], ramps to 0 at fail edges
function bandScore(x, idealLo, idealHi, failLo, failHi) {
  if (x == null || Number.isNaN(x)) return null;
  if (x >= idealLo && x <= idealHi) return 100;
  if (x < idealLo) return clamp(100 * (x - failLo) / (idealLo - failLo));
  return clamp(100 * (failHi - x) / (failHi - idealHi));
}

// ── One-Euro filter (per coordinate stream) ──
function oneEuro(times, vals, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
  const out = new Array(vals.length);
  let xPrev = null, dxPrev = 0, tPrev = null;
  const a = (cut, dt) => { const tau = 1 / (2 * Math.PI * cut); return 1 / (1 + tau / dt); };
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v == null || Number.isNaN(v)) { out[i] = xPrev; continue; }
    if (xPrev == null) { out[i] = v; xPrev = v; tPrev = times[i]; continue; }
    const dt = Math.max(1e-3, (times[i] - tPrev) / 1000);
    const dx = (v - xPrev) / dt;
    const ad = a(dCutoff, dt); dxPrev = ad * dx + (1 - ad) * dxPrev;
    const cutoff = minCutoff + beta * Math.abs(dxPrev);
    const ac = a(cutoff, dt); const xHat = ac * v + (1 - ac) * xPrev;
    out[i] = xHat; xPrev = xHat; tPrev = times[i];
  }
  return out;
}

// ── exercise profiles ── (measures referenced by key; bands are biomechanical, not magic)
// view: which camera view the criterion is valid in. primary: joint used for rep segmentation.
const PROFILES = {
  squat: { label: 'Squat', view: 'side', primary: 'knee', iso: false,
    criteria: [
      { key: 'depth', label: 'Depth', view: 'side', w: 0.3, band: [40, 95, 40, 125], target: '≤95° knee', faultLabel: 'Insufficient depth', faultWhen: (v) => v > 105 },
      { key: 'torsoLean', label: 'Torso angle', view: 'side', w: 0.25, band: [0, 40, 0, 70], target: '<40° lean', faultLabel: 'Excessive forward lean', faultWhen: (v) => v > 48 },
      { key: 'valgus', label: 'Knee tracking', view: 'front', w: 0.2, band: [0, 8, 0, 25], target: 'knees over toes', faultLabel: 'Knee cave (valgus)', faultWhen: (v) => v > 12 },
      { key: 'tempo', label: 'Control (tempo)', view: 'side', w: 0.15, band: [0.6, 4, 0.2, 4], target: 'controlled descent', faultLabel: 'Dropping too fast', faultWhen: (v) => v < 0.4 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.1, band: [0, 8, 0, 25], target: 'even L/R', faultLabel: 'Left/right asymmetry', faultWhen: (v) => v > 14 },
    ] },
  deadlift: { label: 'Deadlift / hinge', view: 'side', primary: 'hip', iso: false,
    criteria: [
      { key: 'spine', label: 'Neutral spine', view: 'side', w: 0.4, band: [0, 10, 0, 25], target: '<10° flexion change', faultLabel: 'Lumbar rounding', faultWhen: (v) => v > 15 },
      { key: 'hinge', label: 'Hip hinge', view: 'side', w: 0.25, band: [1.4, 6, 0.7, 6], target: 'hip-dominant', faultLabel: 'Squatting the hinge', faultWhen: (v) => v < 1.1 },
      { key: 'lockout', label: 'Lockout', view: 'side', w: 0.15, band: [165, 185, 130, 185], target: 'full hip extension', faultLabel: 'Incomplete lockout', faultWhen: (v) => v < 160 },
      { key: 'tempo', label: 'Control (tempo)', view: 'side', w: 0.2, band: [0.6, 4, 0.2, 4], target: 'controlled', faultLabel: 'Uncontrolled', faultWhen: (v) => v < 0.4 },
    ] },
  wallsit: { label: 'Wall sit', view: 'side', primary: 'knee', iso: true,
    criteria: [
      { key: 'holdAngle', label: 'Knee ~90°', view: 'side', w: 0.5, band: [82, 98, 60, 120], target: '90° knee', faultLabel: 'Off 90° (too high/low)', faultWhen: (v) => v < 80 || v > 100 },
      { key: 'holdTime', label: 'Hold quality', view: 'side', w: 0.3, band: [80, 100, 0, 100], target: 'steady hold', faultLabel: 'Unsteady hold', faultWhen: (v) => v < 60 },
      { key: 'drift', label: 'No drift', view: 'side', w: 0.2, band: [0, 5, 0, 25], target: 'no sag/rise', faultLabel: 'Sliding / rising', faultWhen: (v) => v > 12 },
    ] },
  bridge: { label: 'Glute bridge', view: 'side', primary: 'hip', iso: false,
    criteria: [
      { key: 'extension', label: 'Hip extension', view: 'side', w: 0.5, band: [165, 185, 140, 195], target: '~180° at top', faultLabel: 'Under-extended', faultWhen: (v) => v < 160 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.2, band: [0, 8, 0, 25], target: 'even L/R', faultLabel: 'Uneven push', faultWhen: (v) => v > 14 },
      { key: 'tempo', label: 'Control', view: 'side', w: 0.3, band: [0.5, 4, 0.2, 4], target: 'controlled', faultLabel: 'Uncontrolled', faultWhen: (v) => v < 0.35 },
    ] },
  lunge: { label: 'Lunge', view: 'side', primary: 'knee', iso: false,
    criteria: [
      { key: 'depth', label: 'Front-knee depth', view: 'side', w: 0.35, band: [80, 100, 60, 125], target: '~90°', faultLabel: 'Shallow', faultWhen: (v) => v > 110 },
      { key: 'torsoLean', label: 'Upright torso', view: 'side', w: 0.25, band: [0, 25, 0, 55], target: 'upright', faultLabel: 'Leaning', faultWhen: (v) => v > 35 },
      { key: 'valgus', label: 'Knee tracking', view: 'front', w: 0.25, band: [0, 8, 0, 25], target: 'stacked knee', faultLabel: 'Knee cave', faultWhen: (v) => v > 12 },
      { key: 'tempo', label: 'Control', view: 'side', w: 0.15, band: [0.6, 4, 0.2, 4], target: 'controlled', faultLabel: 'Uncontrolled', faultWhen: (v) => v < 0.4 },
    ] },
  press: { label: 'Shoulder press', view: 'front', primary: 'elbow', iso: false,
    criteria: [
      { key: 'lockout', label: 'Full ROM', view: 'any', w: 0.4, band: [160, 185, 120, 185], target: 'full lockout', faultLabel: 'Partial range', faultWhen: (v) => v < 155 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.35, band: [0, 10, 0, 30], target: 'even arms', faultLabel: 'Asymmetric press', faultWhen: (v) => v > 16 },
      { key: 'tempo', label: 'Control', view: 'any', w: 0.25, band: [0.4, 4, 0.15, 4], target: 'controlled', faultLabel: 'Uncontrolled', faultWhen: (v) => v < 0.3 },
    ] },
  plank: { label: 'Plank', view: 'side', primary: 'hip', iso: true,
    criteria: [
      { key: 'holdAngle', label: 'Neutral hip line', view: 'side', w: 0.55, band: [168, 185, 150, 200], target: '~180° hip line', faultLabel: 'Sagging or piking', faultWhen: (v) => v < 165 || v > 190 },
      { key: 'holdTime', label: 'Hold quality', view: 'side', w: 0.25, band: [80, 100, 0, 100], target: 'steady', faultLabel: 'Unsteady', faultWhen: (v) => v < 60 },
      { key: 'drift', label: 'No sag creep', view: 'side', w: 0.2, band: [0, 5, 0, 25], target: 'no creep', faultLabel: 'Sagging over time', faultWhen: (v) => v > 12 },
    ] },
  curl: { label: 'Biceps curl', view: 'front', primary: 'elbow', iso: false,
    criteria: [
      { key: 'rom', label: 'Full range', view: 'any', w: 0.4, band: [80, 160, 40, 160], target: 'full curl & extend', faultLabel: 'Partial range', faultWhen: (v) => v < 60 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.3, band: [0, 10, 0, 30], target: 'even arms', faultLabel: 'Asymmetric', faultWhen: (v) => v > 16 },
      { key: 'tempo', label: 'Control', view: 'any', w: 0.3, band: [0.4, 4, 0.15, 4], target: 'controlled, no swing', faultLabel: 'Swinging / uncontrolled', faultWhen: (v) => v < 0.3 },
    ] },
  pushup: { label: 'Push-up', view: 'side', primary: 'elbow', iso: false,
    criteria: [
      { key: 'depth', label: 'Depth', view: 'side', w: 0.35, band: [45, 100, 45, 150], target: '~90° elbow at bottom', faultLabel: 'Partial depth', faultWhen: (v) => v > 120 },
      { key: 'bodyLine', label: 'Body line', view: 'side', w: 0.4, band: [165, 190, 145, 205], target: 'straight shoulder-hip-ankle', faultLabel: 'Hips sagging or piking', faultWhen: (v) => v < 160 || v > 195 },
      { key: 'tempo', label: 'Control', view: 'any', w: 0.25, band: [0.4, 4, 0.15, 4], target: 'controlled', faultLabel: 'Uncontrolled', faultWhen: (v) => v < 0.3 },
    ] },
  pullup: { label: 'Pull-up', view: 'front', primary: 'elbow', iso: false,
    criteria: [
      { key: 'rom', label: 'Full range', view: 'any', w: 0.5, band: [80, 170, 40, 170], target: 'full hang to chin-up', faultLabel: 'Partial range', faultWhen: (v) => v < 55 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.5, band: [0, 12, 0, 32], target: 'even pull', faultLabel: 'Asymmetric', faultWhen: (v) => v > 18 },
    ] },
  row: { label: 'Row', view: 'side', primary: 'elbow', iso: false,
    criteria: [
      { key: 'rom', label: 'Pull range', view: 'any', w: 0.4, band: [70, 160, 35, 160], target: 'full pull & extend', faultLabel: 'Partial range', faultWhen: (v) => v < 50 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.3, band: [0, 10, 0, 30], target: 'even arms', faultLabel: 'Asymmetric', faultWhen: (v) => v > 16 },
      { key: 'tempo', label: 'Control', view: 'any', w: 0.3, band: [0.4, 4, 0.15, 4], target: 'no swinging', faultLabel: 'Swinging', faultWhen: (v) => v < 0.3 },
    ] },
  stepup: { label: 'Step-up', view: 'side', primary: 'knee', iso: false,
    criteria: [
      { key: 'depth', label: 'Knee drive', view: 'side', w: 0.35, band: [70, 110, 55, 130], target: '~90° working knee', faultLabel: 'Shallow', faultWhen: (v) => v > 115 },
      { key: 'tempo', label: 'Control', view: 'side', w: 0.3, band: [0.5, 4, 0.2, 4], target: 'controlled', faultLabel: 'Uncontrolled', faultWhen: (v) => v < 0.4 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.35, band: [0, 10, 0, 26], target: 'even L/R', faultLabel: 'Asymmetry', faultWhen: (v) => v > 15 },
    ] },
  sideplank: { label: 'Side plank', view: 'side', primary: 'body', iso: true,
    criteria: [
      { key: 'holdAngle', label: 'Straight body line', view: 'side', w: 0.6, band: [165, 190, 145, 205], target: '~180° shoulder-hip-ankle', faultLabel: 'Hips dropping', faultWhen: (v) => v < 165 },
      { key: 'holdTime', label: 'Hold quality', view: 'side', w: 0.25, band: [80, 100, 0, 100], target: 'steady', faultLabel: 'Unsteady', faultWhen: (v) => v < 60 },
      { key: 'drift', label: 'No sag creep', view: 'side', w: 0.15, band: [0, 5, 0, 25], target: 'no creep', faultLabel: 'Sagging over time', faultWhen: (v) => v > 12 },
    ] },
  generic: { label: 'Movement', view: 'any', primary: 'knee', iso: false,
    criteria: [
      { key: 'rom', label: 'Range of motion', view: 'any', w: 0.4, band: [45, 200, 15, 200], target: 'full ROM', faultLabel: 'Limited range', faultWhen: (v) => v < 25 },
      { key: 'tempo', label: 'Control', view: 'any', w: 0.3, band: [0.5, 4, 0.15, 4], target: 'controlled', faultLabel: 'Uncontrolled', faultWhen: (v) => v < 0.35 },
      { key: 'symmetry', label: 'Symmetry', view: 'front', w: 0.3, band: [0, 10, 0, 28], target: 'even L/R', faultLabel: 'Asymmetry', faultWhen: (v) => v > 16 },
    ] },
};
// Required visible joints per profile (paired L/R base names) + the body region to
// name in the "we can't see you" message. This is the visibility gate: if these
// joints aren't in frame with enough confidence, we DON'T fabricate a score.
const REQUIRES = {
  squat: { joints: ['hip', 'knee', 'ankle'], region: 'legs' },
  deadlift: { joints: ['shoulder', 'hip', 'knee'], region: 'back and legs' },
  wallsit: { joints: ['hip', 'knee', 'ankle'], region: 'legs' },
  bridge: { joints: ['shoulder', 'hip', 'knee'], region: 'hips and legs' },
  lunge: { joints: ['hip', 'knee', 'ankle'], region: 'legs' },
  press: { joints: ['shoulder', 'elbow', 'wrist'], region: 'arms' },
  curl: { joints: ['shoulder', 'elbow', 'wrist'], region: 'arms' },
  plank: { joints: ['shoulder', 'hip', 'ankle'], region: 'body' },
  pushup: { joints: ['shoulder', 'elbow', 'wrist', 'hip'], region: 'upper body' },
  pullup: { joints: ['shoulder', 'elbow', 'wrist'], region: 'arms' },
  row: { joints: ['shoulder', 'elbow', 'wrist'], region: 'arms and back' },
  stepup: { joints: ['hip', 'knee', 'ankle'], region: 'legs' },
  sideplank: { joints: ['shoulder', 'hip', 'ankle'], region: 'body' },
  generic: { joints: ['hip', 'knee'], region: 'body' },
};
for (const k in PROFILES) { PROFILES[k].id = k; PROFILES[k].requires = REQUIRES[k].joints; PROFILES[k].region = REQUIRES[k].region; }
function profileFor(name = '') {
  const n = String(name).toLowerCase();
  if (/side\s*plank/.test(n)) return PROFILES.sideplank;
  if (/wall\s*sit/.test(n)) return PROFILES.wallsit;
  if (/plank/.test(n)) return PROFILES.plank;
  if (/push[-\s]*up|press[-\s]*up/.test(n)) return PROFILES.pushup;
  if (/pull[-\s]*up|chin[-\s]*up/.test(n)) return PROFILES.pullup;
  if (/deadlift|hinge|rdl|good\s*morning/.test(n)) return PROFILES.deadlift;
  if (/bridge|hip\s*thrust/.test(n)) return PROFILES.bridge;
  if (/lunge|split\s*squat/.test(n)) return PROFILES.lunge;
  if (/step[-\s]*up/.test(n)) return PROFILES.stepup;
  if (/\brow\b|bent[-\s]*over/.test(n)) return PROFILES.row;
  if (/curl/.test(n)) return PROFILES.curl;
  if (/press|overhead|shoulder|raise|fly/.test(n)) return PROFILES.press;
  if (/squat/.test(n)) return PROFILES.squat;
  return PROFILES.generic;
}

// ── main ──
export function analyzeMovement(frames, exerciseName = '') {
  if (!frames || frames.length < 5) return { error: 'Not enough frames captured. Record for at least 3 seconds.' };
  const profile = profileFor(exerciseName);
  const N = frames.length;
  const times = frames.map((f) => f.timestamp);
  const duration = (times[N - 1] - times[0]) / 1000;

  // 1. per-keypoint streams + confidence + One-Euro smoothing
  const names = [...new Set(frames.flatMap((f) => f.keypoints.map((k) => k.name)))];
  const kp = {}; // name -> { x:[], y:[], s:[] }
  for (const nm of names) kp[nm] = { x: new Array(N).fill(null), y: new Array(N).fill(null), s: new Array(N).fill(0) };
  frames.forEach((f, i) => f.keypoints.forEach((k) => {
    if (!kp[k.name]) return;
    kp[k.name].s[i] = k.score ?? 0;
    if ((k.score ?? 0) >= C_MIN) { kp[k.name].x[i] = k.x; kp[k.name].y[i] = k.y; }
  }));
  for (const nm of names) { kp[nm].x = oneEuro(times, kp[nm].x); kp[nm].y = oneEuro(times, kp[nm].y); }
  const P = (nm, i) => (kp[nm] && kp[nm].x[i] != null ? { x: kp[nm].x[i], y: kp[nm].y[i], s: kp[nm].s[i] } : null);

  // ── Visibility gate ── the exercise's key joints must actually be in frame,
  // else we refuse to fabricate a score (e.g. a biceps curl with the arm off-screen).
  const visFrac = (base) => Math.max(
    kp[`left_${base}`] ? kp[`left_${base}`].s.filter((v) => v >= C_MIN).length / N : 0,
    kp[`right_${base}`] ? kp[`right_${base}`].s.filter((v) => v >= C_MIN).length / N : 0,
  );
  const minVis = Math.min(...profile.requires.map(visFrac));
  if (minVis < 0.4) {
    return { error: `Couldn't see your ${profile.region} clearly for the ${profile.label.toLowerCase()}. Keep your whole ${profile.region} in frame with good lighting, then record again.` };
  }

  // 2. reference scale (median torso length) + view detection
  const torsoLens = [], swRatios = [];
  for (let i = 0; i < N; i++) {
    const sl = P('left_shoulder', i), sr = P('right_shoulder', i), hl = P('left_hip', i), hr = P('right_hip', i);
    if (sl && sr && hl && hr) {
      const neck = { x: (sl.x + sr.x) / 2, y: (sl.y + sr.y) / 2 };
      const midhip = { x: (hl.x + hr.x) / 2, y: (hl.y + hr.y) / 2 };
      const tl = dist(neck, midhip); torsoLens.push(tl);
      if (tl > 1) swRatios.push(Math.abs(sl.x - sr.x) / tl);
    }
  }
  const Lref = median(torsoLens) || 1;
  const viewRatio = median(swRatios);
  const view = viewRatio > 0.9 ? 'front' : viewRatio < 0.5 ? 'side' : 'oblique';
  const viewOk = (need) => need === 'any' || need === view || (view === 'oblique' && false);

  // 3. camera-side limb (higher mean confidence) for sagittal angles
  const meanConf = (nm) => avg(kp[nm] ? kp[nm].s.filter((v) => v > 0) : [0]);
  const side = (meanConf('left_knee') + meanConf('left_hip')) >= (meanConf('right_knee') + meanConf('right_hip')) ? 'left' : 'right';
  const oppo = side === 'left' ? 'right' : 'left';

  // 4. per-frame angles (camera-side + both for symmetry/timeline)
  const kneeS = [], hipS = [], elbowS = [], trunkLean = [], valgus = [], hipSym = [], kneeSym = [], elbowSym = [], bodyLineS = [];
  const tl = [], tr = [], hl2 = [], hr2 = [];
  const confSeq = [];
  for (let i = 0; i < N; i++) {
    const ka = angle(P(`${side}_hip`, i), P(`${side}_knee`, i), P(`${side}_ankle`, i));
    const kb = angle(P(`${oppo}_hip`, i), P(`${oppo}_knee`, i), P(`${oppo}_ankle`, i));
    const ha = angle(P(`${side}_shoulder`, i), P(`${side}_hip`, i), P(`${side}_knee`, i));
    const hb = angle(P(`${oppo}_shoulder`, i), P(`${oppo}_hip`, i), P(`${oppo}_knee`, i));
    const ea = angle(P(`${side}_shoulder`, i), P(`${side}_elbow`, i), P(`${side}_wrist`, i));
    const eb = angle(P(`${oppo}_shoulder`, i), P(`${oppo}_elbow`, i), P(`${oppo}_wrist`, i));
    if (ka != null) kneeS.push(ka); if (ha != null) hipS.push(ha); if (ea != null) elbowS.push((ea + (eb ?? ea)) / (eb != null ? 2 : 1));
    tl.push(ka); tr.push(kb); hl2.push(ha); hr2.push(hb);
    // trunk vs vertical (shoulder→hip on camera side)
    const lean = fromVertical(P(`${side}_shoulder`, i), P(`${side}_hip`, i));
    if (lean != null) trunkLean.push(lean);
    // body line (shoulder-hip-ankle) — plank / push-up / side-plank straightness
    const bl = angle(P(`${side}_shoulder`, i), P(`${side}_hip`, i), P(`${side}_ankle`, i));
    if (bl != null) bodyLineS.push(bl);
    // knee valgus (front): knee-x deviation from hip→ankle line, normalized
    const hh = P(`${side}_hip`, i), kk = P(`${side}_knee`, i), aa = P(`${side}_ankle`, i);
    if (hh && kk && aa && view === 'front') { const line = (hh.x + aa.x) / 2; valgus.push(Math.abs(kk.x - line) / Lref * 100); }
    if (ka != null && kb != null) kneeSym.push(Math.abs(ka - kb));
    if (ha != null && hb != null) hipSym.push(Math.abs(ha - hb));
    if (ea != null && eb != null) elbowSym.push(Math.abs(ea - eb));
    confSeq.push(avg(names.map((nm) => kp[nm].s[i]).filter((v) => v > 0)));
  }

  // 5. primary signal + rep segmentation (or isometric hold)
  const primary = profile.primary === 'hip' ? hipS : profile.primary === 'elbow' ? elbowS : kneeS;
  let reps = [];
  let holdQuality = null, holdAngle = null, holdDrift = null;
  const measures = {};

  if (profile.iso) {
    // isometric: longest plateau within ±8° of the mode
    const sig = profile.primary === 'body' ? bodyLineS : profile.primary === 'hip' ? hl2 : tl;
    const vals = sig.filter((v) => v != null);
    holdAngle = median(vals);
    let inBand = 0; for (const v of vals) if (Math.abs(v - holdAngle) <= 8) inBand++;
    holdQuality = vals.length ? (inBand / vals.length) * 100 : 0;
    // drift = |slope| across the hold (deg over the set), normalized to a 0..~ range
    const xs = vals.map((_, i) => i); const mx = avg(xs), my = avg(vals);
    const num = xs.reduce((s, x, i) => s + (x - mx) * (vals[i] - my), 0), den = xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1;
    holdDrift = Math.abs((num / den) * vals.length);
    measures.holdAngle = holdAngle; measures.holdTime = holdQuality; measures.drift = holdDrift;
  } else {
    const clean = primary.filter((v) => v != null);
    const top = pct(clean, 90), bot = pct(clean, 10), range = top - bot;
    measures.rom = range;
    if (range >= 25) {
      const enter = bot + 0.25 * range, exit = bot + 0.40 * range;
      let state = 'top', dwell = 0, curBot = 180;
      const seq = primary.map((v) => v); // may contain nulls; skip them
      for (let i = 0; i < seq.length; i++) {
        const v = seq[i]; if (v == null) continue;
        if (state === 'top') { if (v < enter) { state = 'bottom'; dwell = 0; curBot = v; } }
        else { curBot = Math.min(curBot, v); dwell++; if (v > exit && dwell >= 3) { state = 'top'; reps.push({ bottom: curBot, top }); } }
      }
      // fallback: if hysteresis found nothing but there is range, treat as 1 rep
      if (!reps.length) reps.push({ bottom: bot, top });
    }
    // per-rep depth + tempo (approx tempo from duration / reps)
    const nrep = Math.max(1, reps.length);
    const tempoPerRep = duration / (nrep * 2); // rough per-phase seconds
    reps = reps.map((r) => ({ depth: r.top - r.bottom, bottomAngle: r.bottom, tempo: tempoPerRep }));
    // outlier-rep rejection: drop partial reps (ROM < 50% of the set median) so a
    // botched rep doesn't distort the score — self-calibrated to the set's own range.
    if (reps.length >= 3) {
      const medROM = median(reps.map((r) => r.depth));
      const kept = reps.filter((r) => r.depth >= 0.5 * medROM);
      if (kept.length >= 2) reps = kept;
    }
    measures.depth = median(reps.map((r) => r.bottomAngle));         // lower = deeper (knee) — bands expect angle
    measures.tempo = tempoPerRep;
    measures.lockout = pct(clean, 92);                               // top angle (press/deadlift/bridge)
    measures.extension = pct(hipS.length ? hipS : clean, 92);
    // hip hinge ratio: hip ROM vs knee ROM
    const hipRange = hipS.length ? (pct(hipS, 90) - pct(hipS, 10)) : 0;
    const kneeRange = kneeS.length ? (pct(kneeS, 90) - pct(kneeS, 10)) : 1;
    measures.hinge = hipRange / (kneeRange || 1);
    // spine flexion change proxy: shoulder-hip-knee angle drift from set start neutral
    const spineVals = hl2.filter((v) => v != null);
    measures.spine = spineVals.length ? Math.abs(pct(spineVals, 50) - spineVals[0]) : 0;
  }
  measures.torsoLean = avg(trunkLean);
  measures.bodyLine = bodyLineS.length ? median(bodyLineS) : null;
  measures.valgus = valgus.length ? avg(valgus) : null;
  measures.symmetry = (profile.primary === 'elbow')
    ? (elbowSym.length ? avg(elbowSym) : null)
    : (avg(kneeSym.length ? kneeSym : hipSym) || null);

  // 6. intra-rep smoothness (velocity-based, dimensionless-ish) + inter-rep consistency
  const dv = []; for (let i = 1; i < primary.length; i++) if (primary[i] != null && primary[i - 1] != null) dv.push(Math.abs(primary[i] - primary[i - 1]));
  const smoothness = clamp(100 - std(dv) * 6);
  const depthCv = reps.length > 1 ? std(reps.map((r) => r.depth)) / (avg(reps.map((r) => r.depth)) || 1) : 0;

  // 7. score each criterion (view-gated, band-mapped) → weighted FormScore
  const per = [];
  for (const c of profile.criteria) {
    const val = measures[c.key];
    const valid = viewOk(c.view) && val != null && !Number.isNaN(val);
    const sc = valid ? bandScore(val, c.band[0], c.band[1], c.band[2], c.band[3]) : null;
    per.push({ key: c.key, label: c.label, value: val, score: sc, weight: c.w, viewValid: valid, target: c.target, faultLabel: c.faultLabel, isFault: valid && c.faultWhen(val) });
  }
  const scored = per.filter((p) => p.score != null);
  let overall = scored.length ? Math.round(scored.reduce((s, p) => s + p.score * p.weight, 0) / scored.reduce((s, p) => s + p.weight, 0)) : 0;
  // fold control/consistency into the overall lightly
  if (!profile.iso && reps.length) overall = Math.round(overall * 0.85 + smoothness * 0.1 + clamp(100 - depthCv * 200) * 0.05);
  // safety cap: a clear high-severity fault can't hide behind a good average
  const criticalFault = per.find((p) => p.isFault && (p.key === 'spine' || p.key === 'valgus' || p.key === 'depth'));
  if (criticalFault && per.filter((p) => p.isFault).length) overall = Math.min(overall, 68);

  // 8. data-quality score
  const meanC = avg(confSeq.filter((v) => v > 0));
  const viewClarity = view === 'oblique' ? 0.5 : 1;
  const repConf = profile.iso ? (holdQuality > 50 ? 1 : 0.6) : (reps.length ? 1 : 0.5);
  const dataQuality = clamp(meanC * viewClarity * repConf, 0, 1);

  // 9. faults list (only view-valid, only what this exercise cares about)
  const faults = per.filter((p) => p.isFault).map((p) => ({
    id: p.key, name: p.faultLabel,
    severity: p.score != null && p.score < 45 ? 'high' : 'moderate',
    description: `${p.label}: measured ${typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value} (target ${p.target}).`,
    tip: FAULT_TIPS[p.key] || 'Focus on this cue and re-record from the correct camera angle.',
  }));
  if (view === 'oblique') faults.unshift({ id: 'view', name: 'Angle the camera squarely', severity: 'moderate', description: 'The camera view was oblique, so some checks were skipped.', tip: profile.view === 'front' ? 'Face the camera head-on.' : 'Turn side-on to the camera.' });
  if (!faults.length) faults.push({ id: 'none', name: 'No major faults detected', severity: 'low', description: 'Form looks solid for the criteria this view can measure.', tip: 'Keep it up and progress gradually.' });

  // 10. tips
  const tips = [];
  if (dataQuality < 0.5) tips.push('Low-confidence capture — record from a clean side or front view, full body in frame, good lighting.');
  scored.filter((p) => p.score < 60).forEach((p) => tips.push(`${p.label}: ${p.target}.`));
  if (overall >= 80) tips.push('Great form — challenge yourself progressively.');

  // 11. UI-compatible categories + angles + timeline
  const categories = per.filter((p) => p.viewValid).map((p) => ({ name: p.label, score: Math.round(p.score), icon: CAT_ICONS[p.key] || '•', desc: p.target }));
  if (!categories.length) categories.push({ name: 'Data quality', score: Math.round(dataQuality * 100), icon: '📷', desc: 'reposition camera' });
  const angleStat = (arr) => { const a = arr.filter((v) => v != null); return a.length ? { avg: Math.round(avg(a)), min: Math.round(Math.min(...a)), max: Math.round(Math.max(...a)) } : { avg: 0, min: 0, max: 0 }; };
  const timeline = frames.filter((_, i) => i % 3 === 0).map((f, i) => ({ frame: i, time: ((f.timestamp - times[0]) / 1000).toFixed(1), leftKnee: tl[i * 3] ?? null, rightKnee: tr[i * 3] ?? null, leftHip: hl2[i * 3] ?? null, rightHip: hr2[i * 3] ?? null }));

  return {
    overall: clamp(overall), duration: Math.round(duration), totalFrames: N,
    exercise: profile.label, view, reps: profile.iso ? 0 : reps.length,
    dataQuality: Math.round(dataQuality * 100) / 100,
    categories, faults, tips,
    perCriterion: per.map((p) => ({ label: p.label, value: p.value, score: p.score, target: p.target, viewValid: p.viewValid })),
    perRep: profile.iso ? [] : (() => { const med = reps.length ? median(reps.map((r) => r.depth)) : 0; return reps.map((r, i) => ({ rep: i + 1, rom: Math.round(r.depth), bottomAngle: Math.round(r.bottomAngle), tempo: Math.round(r.tempo * 10) / 10, shallow: reps.length > 1 && r.depth < 0.8 * med })); })(),
    consistency: { depthCv: Math.round(depthCv * 100) / 100, smoothness: Math.round(smoothness) },
    angles: { leftKnee: angleStat(tl), rightKnee: angleStat(tr), leftHip: angleStat(hl2), rightHip: angleStat(hr2) },
    timeline,
  };
}

// Live feedback while recording — a quick per-frame framing cue (null = looks good).
export function liveCue(keypoints, exerciseName = '') {
  if (!keypoints || !keypoints.length) return 'Step into frame';
  const m = {}; keypoints.forEach((k) => { if ((k.score ?? 0) >= C_MIN) m[k.name] = k; });
  const profile = profileFor(exerciseName);
  for (const j of profile.requires) {
    if (!m[`left_${j}`] && !m[`right_${j}`]) return `Keep your ${profile.region} in frame`;
  }
  const sl = m.left_shoulder, sr = m.right_shoulder, hl = m.left_hip, hr = m.right_hip;
  if (sl && sr && hl && hr) {
    const neck = { x: (sl.x + sr.x) / 2, y: (sl.y + sr.y) / 2 };
    const mh = { x: (hl.x + hr.x) / 2, y: (hl.y + hr.y) / 2 };
    const torso = Math.hypot(neck.x - mh.x, neck.y - mh.y) || 1;
    const ratio = Math.abs(sl.x - sr.x) / torso;
    if (profile.view === 'side' && ratio >= 0.5) return 'Turn side-on to the camera';
    if (profile.view === 'front' && ratio <= 0.9) return 'Face the camera';
  }
  return null;
}

const FAULT_TIPS = {
  depth: 'Sit back and down until thighs reach parallel; work on ankle/hip mobility if you can’t.',
  torsoLean: 'Keep the chest up and brace the core; strengthen the posterior chain.',
  valgus: 'Drive the knees out over the toes; strengthen glute medius (banded walks, clamshells).',
  symmetry: 'Load both sides evenly; add single-leg/single-arm work for the weaker side.',
  tempo: 'Control the lowering phase (2–3s); avoid dropping into the bottom.',
  spine: 'Keep a neutral spine — hinge at the hips, brace, and avoid rounding the lower back.',
  hinge: 'Push the hips back (hinge), don’t squat it down.',
  lockout: 'Finish the rep — full hip/elbow extension at the top.',
  extension: 'Squeeze the glutes to a straight shoulder-hip-knee line at the top.',
  holdAngle: 'Hold the target joint angle steady throughout.',
  holdTime: 'Keep the position steady — minimise wobble.',
  drift: 'Don’t let the position sag or creep — hold the line.',
  rom: 'Move through a fuller range of motion; warm up and mobilise first.',
};
const CAT_ICONS = { depth: '📐', torsoLean: '🧍', valgus: '🦵', symmetry: '🔄', tempo: '⏱️', spine: '🧬', hinge: '🍑', lockout: '🔝', extension: '🍑', holdAngle: '📐', holdTime: '⏳', drift: '📉', rom: '📐' };
