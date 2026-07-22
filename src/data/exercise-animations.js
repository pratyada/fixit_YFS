// ─── Exercise animation catalog ────────────────────────────────────────────
// Each exercise is defined as a blend between a REST pose and a TARGET pose.
// The player eases rest→target→rest each rep (a smooth down/up), so a single
// entry fully describes a symmetric rep. To REPLICATE: copy an entry, tweak the
// joint angles (radians) and tempo. Joints not listed default to 0 (rest).
//
// Joint keys (all rotations in radians about the X axis unless noted):
//   hipsY   — vertical travel of the pelvis, in metres (negative = sink)
//   torso   — trunk lean (positive = lean forward / toward camera)
//   neck    — head nod (positive = chin down)
//   hip     — hip flexion (negative = thigh swings forward/up)
//   knee    — knee flexion (positive = shin folds back under)
//   ankle   — ankle dorsiflexion
//   shoulder— arm raise (negative = arms forward to horizontal)
//   elbow   — elbow flexion (negative = forearm up)
//
// Signs follow three.js: +Y-up, camera looks from +Z (front). If a motion looks
// inverted, flip that joint's sign — the rig structure stays the same.

export const EXERCISE_ANIMATIONS = {
  squat: {
    id: 'squat',
    name: 'Bodyweight Squat',
    region: 'Knee',
    tempoSec: 3.4,                 // seconds per full rep (down + up)
    cue: 'Sit back and down, knees tracking over toes, chest tall.',
    rest:   { hipsY: 0,     torso: 0,    hip: 0,     knee: 0,    ankle: 0,    shoulder: 0,     elbow: 0 },
    target: { hipsY: -0.30, torso: 0.42, hip: -1.05, knee: 1.55, ankle: 0.32, shoulder: -1.45, elbow: -0.15 },
  },
};

export function getExerciseAnimation(id) {
  return EXERCISE_ANIMATIONS[id] || EXERCISE_ANIMATIONS.squat;
}
