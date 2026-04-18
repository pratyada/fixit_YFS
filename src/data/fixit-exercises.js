// ─── FIXIT Phase 1 Exercises ───
// Only these 5 exercises are active in Phase 1 testing.
// All other exercises from the library are shown as "Coming Soon".

export const PHASE_1_IDS = [
  'fixit-squats',
  'fixit-deadlift',
  'fixit-reverse-fly',
  'fixit-bicep-curl',
  'fixit-plank',
];

export const FIXIT_EXERCISES = [
  {
    id: 'fixit-squats',
    name: 'Squats',
    bodyPart: 'Lower Body',
    difficulty: 'Beginner',
    position: 'Standing',
    equipment: 'None',
    goals: ['Strength', 'Stability'],
    category: 'LOWER_BODY',
    phase: 'Phase 1',
    duration: '10 min',
    sets: 3, reps: 10,
    description: 'Stand with feet shoulder-width apart, lower your hips back and down as if sitting into a chair, then drive through your heels to return to standing.',
    instructions: [
      'Stand with feet shoulder-width apart, toes pointing slightly outward',
      'Keep your chest up and core engaged',
      'Lower your hips back and down as if sitting into a chair',
      'Descend until thighs are parallel to the floor (or as deep as comfortable)',
      'Drive through your heels to return to standing',
    ],
    tips: [
      'Knees track over toes — don\'t let them collapse inward',
      'Keep a neutral spine — no rounding',
      'Heels stay planted throughout',
      'Aim for symmetrical depth left vs. right',
    ],
    keyFormCues: [
      'Knees track over toes (not collapsing inward)',
      'Neutral spine — no rounding',
      'Heels stay planted',
      'Hip crease descends below knee crease at bottom',
      'Symmetrical depth left vs. right',
    ],
    contraindications: ['Acute knee pain', 'Recent surgery without clearance'],
    musclesTargeted: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    conditions: ['General Conditioning', 'ACL Reconstruction'],
    maxDurationSec: 60,
    requiresFront: true,
    requiresSide: true,
  },
  {
    id: 'fixit-deadlift',
    name: 'Deadlift',
    bodyPart: 'Lower Body',
    difficulty: 'Intermediate',
    position: 'Standing',
    equipment: 'None',
    goals: ['Strength'],
    category: 'LOWER_BODY',
    phase: 'Phase 1',
    duration: '10 min',
    sets: 3, reps: 8,
    description: 'Hinge at the hips, keep your back flat, and drive through the floor to stand tall. The gold standard for posterior chain strength.',
    instructions: [
      'Stand with feet hip-width apart, weight (or imagined weight) over mid-foot',
      'Hinge at the hips, sending your hips back while keeping your back flat',
      'Grip bar (or hands at shin level) with arms straight',
      'Drive through the floor, extending hips and knees together',
      'Stand tall at the top, shoulders back. Reverse the motion to return',
    ],
    tips: [
      'Keep bar/hands tracking close to body',
      'Hips and shoulders should rise together',
      'Full hip extension at lockout — no leaning back',
      'Slow eccentric (lowering) phase for control',
    ],
    keyFormCues: [
      'Neutral spine throughout (no rounding or hyperextension)',
      'Bar/hands track close to body',
      'Hips and shoulders rise together',
      'Lockout at top — full hip extension, no leaning back',
      'Knees and toes aligned',
    ],
    contraindications: ['Acute low back pain', 'Disc herniation without clearance'],
    musclesTargeted: ['Hamstrings', 'Glutes', 'Erector Spinae', 'Lats', 'Core'],
    conditions: ['General Conditioning', 'Low Back Pain'],
    maxDurationSec: 60,
    requiresFront: true,
    requiresSide: true,
  },
  {
    id: 'fixit-reverse-fly',
    name: 'Reverse Fly',
    bodyPart: 'Upper Body',
    difficulty: 'Beginner',
    position: 'Standing',
    equipment: 'None',
    goals: ['Strength'],
    category: 'UPPER_BODY',
    phase: 'Phase 1',
    duration: '8 min',
    sets: 3, reps: 12,
    description: 'Hinge forward, let arms hang, then raise them out to the sides squeezing your shoulder blades together. Great for posture.',
    instructions: [
      'Hinge forward at the hips, back flat, knees softly bent',
      'Let arms hang straight down, palms facing each other',
      'With a slight bend in the elbows, raise arms out to the sides',
      'Squeeze shoulder blades together at the top',
      'Lower with control',
    ],
    tips: [
      'Maintain the hinged torso position — don\'t stand up mid-rep',
      'Arms move in the scapular plane (slightly forward of straight sideways)',
      'No momentum or swinging',
      'Aim for symmetrical arm height',
    ],
    keyFormCues: [
      'Hinged torso position maintained',
      'Arms move in scapular plane',
      'Shoulder blades retract at top',
      'No momentum / swinging',
      'Symmetrical arm height',
    ],
    contraindications: ['Acute shoulder pain'],
    musclesTargeted: ['Rear Deltoids', 'Rhomboids', 'Middle Trapezius'],
    conditions: ['General Conditioning', 'Shoulder Impingement'],
    maxDurationSec: 45,
    requiresFront: true,
    requiresSide: true,
  },
  {
    id: 'fixit-bicep-curl',
    name: 'Bicep Curl',
    bodyPart: 'Upper Body',
    difficulty: 'Beginner',
    position: 'Standing',
    equipment: 'None',
    goals: ['Strength'],
    category: 'UPPER_BODY',
    phase: 'Phase 1',
    duration: '8 min',
    sets: 3, reps: 12,
    description: 'Stand tall, arms at sides, curl forearms up toward your shoulders keeping elbows pinned to your ribs.',
    instructions: [
      'Stand tall, arms at sides, palms facing forward',
      'Keep elbows pinned to your ribs',
      'Curl forearms up toward your shoulders',
      'Squeeze at the top; lower under control',
    ],
    tips: [
      'Elbows stay anchored — no forward drift',
      'No torso swing or hip thrust',
      'Full range of motion — bottom and top',
      'Controlled tempo on the eccentric (lowering) phase',
    ],
    keyFormCues: [
      'Elbows stay anchored at sides (no forward drift)',
      'No torso swing or hip thrust',
      'Full range — bottom and top',
      'Wrists neutral, not collapsed',
      'Controlled eccentric phase',
    ],
    contraindications: ['Acute elbow pain'],
    musclesTargeted: ['Biceps Brachii', 'Brachialis', 'Forearms'],
    conditions: ['General Conditioning'],
    maxDurationSec: 45,
    requiresFront: true,
    requiresSide: true,
  },
  {
    id: 'fixit-plank',
    name: 'Plank',
    bodyPart: 'Core',
    difficulty: 'Beginner',
    position: 'Prone',
    equipment: 'Mat',
    goals: ['Stability', 'Endurance'],
    category: 'CORE',
    phase: 'Phase 1',
    duration: '5 min',
    sets: 3, reps: 1, holdSeconds: 30,
    description: 'Hold a straight line from head to heels on your forearms. The gold-standard core endurance exercise.',
    instructions: [
      'Start on forearms and toes, elbows directly under shoulders',
      'Body forms a straight line from head to heels',
      'Engage your core, glutes, and quads',
      'Breathe normally — do not hold your breath',
      'Hold for the prescribed time',
    ],
    tips: [
      'Don\'t let hips sag or pike up',
      'Neutral neck — look at the floor, not forward',
      'Squeeze glutes to protect lower back',
      'Build duration gradually — quality over time',
    ],
    keyFormCues: [
      'Hips level with shoulders — no sagging or piking',
      'Neutral neck (gaze down, not forward)',
      'Elbows directly under shoulders',
      'Glutes engaged',
      'Body holds the line for the full duration',
    ],
    contraindications: ['Acute back pain', 'Wrist injury'],
    musclesTargeted: ['Rectus Abdominis', 'Transverse Abdominis', 'Obliques', 'Glutes', 'Shoulders'],
    conditions: ['General Conditioning', 'Low Back Pain'],
    maxDurationSec: 90,
    requiresFront: true,
    requiresSide: true,
  },
];

// Helper: check if an exercise is active in Phase 1
export function isPhase1Active(exerciseId) {
  return PHASE_1_IDS.includes(exerciseId);
}

// Get all FIXIT exercises + remaining library exercises marked as coming soon
export function getAllExercisesWithStatus(libraryExercises) {
  // Phase 1 exercises first
  const active = FIXIT_EXERCISES.map(e => ({ ...e, isActive: true }));

  // All other library exercises as coming soon
  const comingSoon = libraryExercises
    .filter(e => !PHASE_1_IDS.includes(e.id))
    .map(e => ({ ...e, isActive: false, comingSoon: true }));

  return [...active, ...comingSoon];
}
