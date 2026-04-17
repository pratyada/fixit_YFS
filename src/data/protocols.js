// ─── Pre-built rehabilitation protocols ───
// Physiotherapist-designed multi-phase programs for common conditions.
// Each protocol contains phases with specific exercises, frequency, and goals.

export const PROTOCOLS = [
  // ════════════════════════════════════════════════════════
  //                    KNEE PROTOCOLS
  // ════════════════════════════════════════════════════════
  {
    id: 'acl-recon-24wk',
    name: 'ACL Reconstruction (24 weeks)',
    bodyPart: 'Knee',
    condition: 'ACL Reconstruction',
    totalWeeks: 24,
    description: 'Standard 6-month rehabilitation program following ACL reconstruction surgery. Designed to safely restore strength, mobility, and return-to-sport function.',
    objective: 'Restore full knee function, symmetrical strength, and safe return to sport.',
    frequency: 'Daily for Phase 1, 5 days/week thereafter',
    icon: '🦵',
    tags: ['Post-Surgical', 'Return to Sport', 'Long-term'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Protection & Early Motion',
        weeks: '0-2',
        focus: 'Reduce swelling, restore extension, quad activation',
        goals: ['Knee extension to 0°', 'Active quadriceps contraction', 'Weight bearing as tolerated', 'Reduce effusion'],
        exercises: [
          { id: 'quad-sets', sets: 3, reps: 15, frequency: '3x daily' },
          { id: 'straight-leg-raise', sets: 3, reps: 10, frequency: '3x daily' },
          { id: 'heel-slides', sets: 3, reps: 15, frequency: '3x daily' },
          { id: 'ankle-abc', sets: 2, reps: 1, frequency: '3x daily' },
          { id: 'glute-bridge', sets: 3, reps: 12, frequency: '2x daily' },
          { id: 'clamshells', sets: 3, reps: 15, frequency: '2x daily' },
        ],
        precautions: ['Use crutches as directed', 'Wear brace per surgeon', 'Ice 20 min, 3-4x daily', 'Elevate when resting'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Progressive Strengthening',
        weeks: '3-6',
        focus: 'Restore full range of motion and begin loading',
        goals: ['Full knee flexion to 130°+', 'Normal gait pattern', 'Single-leg stance >10s'],
        exercises: [
          { id: 'wall-slides', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'wall-sits', sets: 3, reps: 5, holdSeconds: 20, frequency: 'Daily' },
          { id: 'mini-squats', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'terminal-knee-extension', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'single-leg-balance', sets: 3, reps: 4, holdSeconds: 30, frequency: 'Daily' },
          { id: 'banded-clamshells', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'single-leg-bridge', sets: 3, reps: 10, frequency: '5x/week' },
        ],
        precautions: ['No running, jumping, pivoting'],
      },
      {
        id: 'p3',
        name: 'Phase 3 — Advanced Strengthening',
        weeks: '7-12',
        focus: 'Build symmetry and dynamic control',
        goals: ['Quad strength >80% of opposite side', 'Single leg squat without valgus', 'Begin straight-line jogging'],
        exercises: [
          { id: 'mini-squats', sets: 4, reps: 15, frequency: '5x/week' },
          { id: 'step-ups', sets: 3, reps: 12, frequency: '5x/week' },
          { id: 'lateral-step-ups', sets: 3, reps: 12, frequency: '5x/week' },
          { id: 'single-leg-balance-eyes-closed', sets: 3, reps: 4, holdSeconds: 20, frequency: '5x/week' },
          { id: 'bird-dog', sets: 3, reps: 10, holdSeconds: 5, frequency: '3x/week' },
          { id: 'monster-walks', sets: 3, reps: 12, frequency: '3x/week' },
        ],
        precautions: ['No cutting or pivoting sports'],
      },
      {
        id: 'p4',
        name: 'Phase 4 — Return to Activity',
        weeks: '13-24',
        focus: 'Sport-specific training and return to play',
        goals: ['Quad strength symmetry', 'Pass single-leg hop tests', 'Sport-specific drills without pain'],
        exercises: [
          { id: 'full-squats', sets: 4, reps: 12, frequency: '3x/week' },
          { id: 'lateral-step-ups', sets: 3, reps: 15, frequency: '3x/week' },
          { id: 'single-leg-balance-eyes-closed', sets: 3, reps: 4, holdSeconds: 30, frequency: '3x/week' },
          { id: 'bird-dog', sets: 3, reps: 12, holdSeconds: 5, frequency: '3x/week' },
        ],
        precautions: ['Pass functional testing battery before return to sport'],
      },
    ],
  },

  {
    id: 'meniscus-repair-12wk',
    name: 'Meniscus Repair (12 weeks)',
    bodyPart: 'Knee',
    condition: 'Meniscus Repair',
    totalWeeks: 12,
    description: 'Recovery program after meniscus repair surgery focused on protecting the repair while restoring function.',
    objective: 'Protect repair site, restore ROM, return to full activity.',
    frequency: 'Daily',
    icon: '🦵',
    tags: ['Post-Surgical', 'Conservative'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Protection',
        weeks: '0-4',
        focus: 'Protect repair, minimize swelling',
        goals: ['Restore extension to 0°', 'Knee flexion to 90°', 'Quad activation'],
        exercises: [
          { id: 'quad-sets', sets: 3, reps: 15, frequency: '3x daily' },
          { id: 'straight-leg-raise', sets: 3, reps: 10, frequency: '3x daily' },
          { id: 'ankle-abc', sets: 2, reps: 1, frequency: '3x daily' },
          { id: 'heel-slides', sets: 3, reps: 10, frequency: 'Daily, limit 90°' },
        ],
        precautions: ['Brace locked in extension for ambulation', 'No deep flexion', 'Toe-touch weight bearing'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Progressive Loading',
        weeks: '5-8',
        focus: 'Progressive ROM and strength',
        goals: ['Full ROM', 'Normal gait', 'Begin closed-chain exercises'],
        exercises: [
          { id: 'heel-slides', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'wall-sits', sets: 3, reps: 5, holdSeconds: 20, frequency: 'Daily' },
          { id: 'mini-squats', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'glute-bridge', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'single-leg-balance', sets: 3, reps: 4, holdSeconds: 30, frequency: 'Daily' },
        ],
        precautions: ['Avoid deep squats >90°', 'No twisting under load'],
      },
      {
        id: 'p3',
        name: 'Phase 3 — Return to Function',
        weeks: '9-12',
        focus: 'Full strength and return to activity',
        goals: ['Symmetrical strength', 'Return to recreational activity'],
        exercises: [
          { id: 'step-ups', sets: 3, reps: 12, frequency: '5x/week' },
          { id: 'lateral-step-ups', sets: 3, reps: 12, frequency: '5x/week' },
          { id: 'single-leg-bridge', sets: 3, reps: 12, frequency: '5x/week' },
          { id: 'monster-walks', sets: 3, reps: 12, frequency: '3x/week' },
        ],
        precautions: ['Avoid impact activity until cleared'],
      },
    ],
  },

  {
    id: 'patellofemoral-8wk',
    name: 'Patellofemoral Pain (8 weeks)',
    bodyPart: 'Knee',
    condition: 'Patellofemoral Pain',
    totalWeeks: 8,
    description: 'Conservative program for runner\'s knee / kneecap pain. Focuses on hip and quad strengthening.',
    objective: 'Reduce kneecap pain and restore pain-free movement.',
    frequency: '5 days/week',
    icon: '🏃',
    tags: ['Conservative', 'Overuse'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Pain Relief',
        weeks: '1-2',
        focus: 'Reduce pain, gentle activation',
        goals: ['Pain reduction', 'Quad activation', 'Hip activation'],
        exercises: [
          { id: 'quad-sets', sets: 3, reps: 15, frequency: '2x daily' },
          { id: 'straight-leg-raise', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'clamshells', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'glute-bridge', sets: 3, reps: 12, frequency: 'Daily' },
        ],
        precautions: ['Avoid stairs and squats causing pain', 'Ice after activity'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Strengthening',
        weeks: '3-6',
        focus: 'Build hip and quad strength',
        goals: ['Single leg squat without pain', 'Hip strength symmetry'],
        exercises: [
          { id: 'wall-sits', sets: 3, reps: 5, holdSeconds: 20, frequency: '5x/week' },
          { id: 'mini-squats', sets: 3, reps: 12, frequency: '5x/week' },
          { id: 'banded-clamshells', sets: 3, reps: 15, frequency: '5x/week' },
          { id: 'monster-walks', sets: 3, reps: 12, frequency: '3x/week' },
          { id: 'single-leg-balance', sets: 3, reps: 4, holdSeconds: 30, frequency: '5x/week' },
        ],
        precautions: ['Track pain — should not exceed 3/10'],
      },
      {
        id: 'p3',
        name: 'Phase 3 — Return to Activity',
        weeks: '7-8',
        focus: 'Sport-specific reintegration',
        goals: ['Pain-free running', 'Stair descent without pain'],
        exercises: [
          { id: 'mini-squats', sets: 3, reps: 15, frequency: '4x/week' },
          { id: 'step-ups', sets: 3, reps: 12, frequency: '4x/week' },
          { id: 'lateral-step-ups', sets: 3, reps: 12, frequency: '4x/week' },
          { id: 'single-leg-bridge', sets: 3, reps: 10, frequency: '4x/week' },
        ],
        precautions: ['Gradual return to running'],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  //                  SHOULDER PROTOCOLS
  // ════════════════════════════════════════════════════════
  {
    id: 'rotator-cuff-12wk',
    name: 'Rotator Cuff Repair (12 weeks)',
    bodyPart: 'Shoulder',
    condition: 'Rotator Cuff Repair',
    totalWeeks: 12,
    description: 'Post-surgical program protecting the cuff repair while progressively restoring motion and strength.',
    objective: 'Protect surgical repair, restore ROM, and rebuild rotator cuff strength.',
    frequency: 'Daily',
    icon: '💪',
    tags: ['Post-Surgical'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Passive Motion',
        weeks: '0-4',
        focus: 'Protect repair, passive ROM only',
        goals: ['Pendulum motion', 'Passive flexion to 90°'],
        exercises: [
          { id: 'pendulum', sets: 3, reps: 20, frequency: '3x daily' },
        ],
        precautions: ['Sling at all times except exercise', 'No active shoulder movement', 'No lifting'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Active Assisted ROM',
        weeks: '5-8',
        focus: 'Begin active motion',
        goals: ['Active flexion to 120°', 'External rotation 30°'],
        exercises: [
          { id: 'pendulum', sets: 3, reps: 20, frequency: '2x daily' },
          { id: 'wall-walks', sets: 3, reps: 10, frequency: 'Daily' },
          { id: 'scapular-squeezes', sets: 3, reps: 15, holdSeconds: 5, frequency: 'Daily' },
        ],
        precautions: ['No resistance exercises yet'],
      },
      {
        id: 'p3',
        name: 'Phase 3 — Strengthening',
        weeks: '9-12',
        focus: 'Build rotator cuff strength',
        goals: ['Full ROM', 'Symmetric strength'],
        exercises: [
          { id: 'external-rotation-band', sets: 3, reps: 15, frequency: '5x/week' },
          { id: 'internal-rotation-band', sets: 3, reps: 15, frequency: '5x/week' },
          { id: 'scapular-squeezes', sets: 3, reps: 15, holdSeconds: 5, frequency: '5x/week' },
          { id: 'wall-angels', sets: 3, reps: 10, frequency: '3x/week' },
          { id: 'ys-ts-ws', sets: 3, reps: 10, frequency: '3x/week' },
        ],
        precautions: ['No overhead lifting beyond body weight'],
      },
    ],
  },

  {
    id: 'frozen-shoulder-12wk',
    name: 'Frozen Shoulder (12 weeks)',
    bodyPart: 'Shoulder',
    condition: 'Frozen Shoulder',
    totalWeeks: 12,
    description: 'Progressive mobility program for adhesive capsulitis. Slow and steady stretching wins.',
    objective: 'Restore shoulder range of motion in all planes.',
    frequency: 'Daily, multiple times',
    icon: '❄️',
    tags: ['Conservative', 'Mobility-focused'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Pain Management',
        weeks: '1-4',
        focus: 'Reduce pain, gentle motion',
        goals: ['Reduce night pain', 'Maintain available ROM'],
        exercises: [
          { id: 'pendulum', sets: 3, reps: 20, frequency: '3x daily' },
          { id: 'wall-walks', sets: 3, reps: 10, frequency: '3x daily' },
        ],
        precautions: ['Stay within pain-free range', 'Heat before exercise'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Progressive Mobility',
        weeks: '5-12',
        focus: 'Aggressive but tolerable stretching',
        goals: ['Restore functional ROM in all planes'],
        exercises: [
          { id: 'wall-walks', sets: 3, reps: 15, frequency: '3x daily' },
          { id: 'wall-angels', sets: 3, reps: 10, frequency: 'Daily' },
          { id: 'pendulum', sets: 3, reps: 20, frequency: '2x daily' },
          { id: 'scapular-squeezes', sets: 3, reps: 15, frequency: 'Daily' },
        ],
        precautions: ['Stretch to discomfort, not severe pain'],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  //                    BACK PROTOCOLS
  // ════════════════════════════════════════════════════════
  {
    id: 'low-back-pain-6wk',
    name: 'Low Back Pain (6 weeks)',
    bodyPart: 'Back',
    condition: 'Low Back Pain',
    totalWeeks: 6,
    description: 'Conservative program for non-specific low back pain. Focus on core stability and movement re-education.',
    objective: 'Reduce pain, restore movement, and build core stability.',
    frequency: 'Daily',
    icon: '🔙',
    tags: ['Conservative', 'Core Stability'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Pain Relief',
        weeks: '1-2',
        focus: 'Calm the system',
        goals: ['Pain reduction', 'Restore confidence in movement'],
        exercises: [
          { id: 'pelvic-tilts', sets: 3, reps: 15, frequency: '2x daily' },
          { id: 'cat-cow', sets: 3, reps: 10, frequency: '2x daily' },
          { id: 'press-up', sets: 3, reps: 10, frequency: '2x daily' },
          { id: 'glute-bridge', sets: 3, reps: 12, frequency: 'Daily' },
        ],
        precautions: ['Avoid prolonged sitting', 'Walk frequently'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Stability',
        weeks: '3-6',
        focus: 'Build core endurance',
        goals: ['Plank 30s', 'Bird dog with control'],
        exercises: [
          { id: 'bird-dog', sets: 3, reps: 10, holdSeconds: 5, frequency: 'Daily' },
          { id: 'dead-bug', sets: 3, reps: 10, frequency: 'Daily' },
          { id: 'plank', sets: 3, reps: 3, holdSeconds: 30, frequency: 'Daily' },
          { id: 'glute-bridge', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'side-plank', sets: 3, reps: 2, holdSeconds: 20, frequency: '3x/week' },
        ],
        precautions: ['Stop if symptoms worsen'],
      },
    ],
  },

  {
    id: 'sciatica-6wk',
    name: 'Sciatica (6 weeks)',
    bodyPart: 'Back',
    condition: 'Sciatica',
    totalWeeks: 6,
    description: 'Nerve mobilization and core stability for sciatic nerve pain.',
    objective: 'Centralize symptoms, restore nerve mobility, build stability.',
    frequency: 'Daily',
    icon: '⚡',
    tags: ['Nerve Pain', 'Conservative'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Centralization',
        weeks: '1-2',
        focus: 'Reduce leg symptoms',
        goals: ['Centralize pain', 'Reduce numbness'],
        exercises: [
          { id: 'press-up', sets: 3, reps: 10, frequency: '3x daily' },
          { id: 'sciatic-nerve-glide', sets: 3, reps: 10, frequency: '3x daily' },
          { id: 'pelvic-tilts', sets: 3, reps: 15, frequency: '2x daily' },
        ],
        precautions: ['Avoid sustained flexion (sitting)', 'Walk frequently'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Stability',
        weeks: '3-6',
        focus: 'Core stability',
        goals: ['Pain-free movement', 'Core endurance'],
        exercises: [
          { id: 'bird-dog', sets: 3, reps: 10, holdSeconds: 5, frequency: 'Daily' },
          { id: 'glute-bridge', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'dead-bug', sets: 3, reps: 10, frequency: 'Daily' },
          { id: 'sciatic-nerve-glide', sets: 2, reps: 10, frequency: 'Daily' },
        ],
        precautions: [],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  //                  ANKLE & FOOT PROTOCOLS
  // ════════════════════════════════════════════════════════
  {
    id: 'ankle-sprain-6wk',
    name: 'Ankle Sprain (6 weeks)',
    bodyPart: 'Ankle',
    condition: 'Ankle Sprain',
    totalWeeks: 6,
    description: 'Standard recovery for grade I-II lateral ankle sprain. Focuses on early motion, then strength and balance.',
    objective: 'Restore ROM, strength, and proprioception.',
    frequency: 'Daily',
    icon: '🦶',
    tags: ['Acute', 'Conservative'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Acute Care',
        weeks: '1-2',
        focus: 'PRICE protocol + early motion',
        goals: ['Reduce swelling', 'Restore ROM'],
        exercises: [
          { id: 'ankle-abc', sets: 3, reps: 1, frequency: '3x daily' },
          { id: 'calf-raises', sets: 3, reps: 15, frequency: 'Daily' },
        ],
        precautions: ['Ice 20 min, 3-4x daily', 'Compression', 'Elevation'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Strengthening',
        weeks: '3-4',
        focus: 'Build strength in all directions',
        goals: ['Calf strength symmetry', 'Pain-free single leg stance'],
        exercises: [
          { id: 'banded-ankle-eversion', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'calf-raises', sets: 3, reps: 15, holdSeconds: 2, frequency: 'Daily' },
          { id: 'single-leg-calf-raise', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'single-leg-balance', sets: 3, reps: 4, holdSeconds: 30, frequency: 'Daily' },
        ],
        precautions: ['Avoid uneven surfaces'],
      },
      {
        id: 'p3',
        name: 'Phase 3 — Return to Sport',
        weeks: '5-6',
        focus: 'Dynamic stability and return',
        goals: ['Single leg balance eyes closed 20s', 'Return to running'],
        exercises: [
          { id: 'single-leg-calf-raise', sets: 3, reps: 15, frequency: '5x/week' },
          { id: 'single-leg-balance-eyes-closed', sets: 3, reps: 4, holdSeconds: 20, frequency: '5x/week' },
          { id: 'banded-ankle-eversion', sets: 3, reps: 20, frequency: '5x/week' },
        ],
        precautions: ['Use brace for high-risk activity'],
      },
    ],
  },

  {
    id: 'plantar-fasciitis-8wk',
    name: 'Plantar Fasciitis (8 weeks)',
    bodyPart: 'Foot',
    condition: 'Plantar Fasciitis',
    totalWeeks: 8,
    description: 'Conservative program for chronic heel pain. Stretching and progressive loading.',
    objective: 'Reduce pain, restore foot function, prevent recurrence.',
    frequency: 'Daily',
    icon: '👣',
    tags: ['Chronic', 'Conservative'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Pain Relief',
        weeks: '1-3',
        focus: 'Stretch and relieve',
        goals: ['Reduce morning pain', 'Restore plantar fascia mobility'],
        exercises: [
          { id: 'plantar-fascia-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '3x daily, including first thing AM' },
          { id: 'calf-raises', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'towel-scrunches', sets: 3, reps: 10, frequency: 'Daily' },
        ],
        precautions: ['Supportive footwear', 'Avoid barefoot on hard floors'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Strengthening',
        weeks: '4-8',
        focus: 'Progressive loading',
        goals: ['Pain-free walking', 'Strong foot intrinsics'],
        exercises: [
          { id: 'plantar-fascia-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '2x daily' },
          { id: 'single-leg-calf-raise', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'towel-scrunches', sets: 3, reps: 15, frequency: 'Daily' },
        ],
        precautions: ['Slow eccentric calf raises are key'],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  //                  ELBOW PROTOCOLS
  // ════════════════════════════════════════════════════════
  {
    id: 'tennis-elbow-8wk',
    name: 'Tennis Elbow (8 weeks)',
    bodyPart: 'Elbow',
    condition: 'Tennis Elbow',
    totalWeeks: 8,
    description: 'Eccentric loading program for lateral epicondylitis. Slow heavy lowering is the gold standard.',
    objective: 'Reduce pain, restore tendon health, return to function.',
    frequency: 'Daily',
    icon: '🎾',
    tags: ['Tendinopathy', 'Conservative'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Pain Relief & Stretching',
        weeks: '1-2',
        focus: 'Reduce inflammation, mobilize',
        goals: ['Reduce pain', 'Restore wrist ROM'],
        exercises: [
          { id: 'wrist-extensor-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '3x daily' },
          { id: 'wrist-flexor-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '3x daily' },
        ],
        precautions: ['Avoid aggravating activities', 'Counterforce brace if needed'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Eccentric Strengthening',
        weeks: '3-8',
        focus: 'Slow heavy eccentric loading',
        goals: ['Build tendon strength', 'Pain-free grip'],
        exercises: [
          { id: 'eccentric-wrist-extension', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'wrist-extensor-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '2x daily' },
        ],
        precautions: ['Mild pain during exercise is okay (3/10)', 'Should not increase next day pain'],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  //                  NECK PROTOCOLS
  // ════════════════════════════════════════════════════════
  {
    id: 'neck-pain-4wk',
    name: 'Neck Pain (4 weeks)',
    bodyPart: 'Neck',
    condition: 'Neck Pain',
    totalWeeks: 4,
    description: 'Postural program for chronic neck and upper back pain. Great for desk workers.',
    objective: 'Reduce pain, restore mobility, improve posture.',
    frequency: 'Daily',
    icon: '🦒',
    tags: ['Postural', 'Conservative'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Mobility & Pain Relief',
        weeks: '1-2',
        focus: 'Restore motion, reduce pain',
        goals: ['Pain reduction', 'Improved cervical ROM'],
        exercises: [
          { id: 'neck-rotations', sets: 3, reps: 10, frequency: '3x daily' },
          { id: 'upper-trap-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '3x daily' },
          { id: 'chin-tucks', sets: 3, reps: 10, holdSeconds: 5, frequency: '3x daily' },
        ],
        precautions: ['Avoid prolonged screen time'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Postural Strengthening',
        weeks: '3-4',
        focus: 'Strengthen postural muscles',
        goals: ['Improved posture', 'Pain-free desk work'],
        exercises: [
          { id: 'chin-tucks', sets: 3, reps: 12, holdSeconds: 5, frequency: 'Daily' },
          { id: 'scapular-squeezes', sets: 3, reps: 15, holdSeconds: 5, frequency: 'Daily' },
          { id: 'wall-angels', sets: 3, reps: 10, frequency: 'Daily' },
          { id: 'upper-trap-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: 'Daily' },
        ],
        precautions: [],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  //                  HIP PROTOCOLS
  // ════════════════════════════════════════════════════════
  {
    id: 'hip-bursitis-6wk',
    name: 'Hip Bursitis (6 weeks)',
    bodyPart: 'Hip',
    condition: 'Hip Bursitis',
    totalWeeks: 6,
    description: 'Conservative program for greater trochanteric bursitis. Hip stabilization focus.',
    objective: 'Reduce lateral hip pain, build hip stability.',
    frequency: 'Daily',
    icon: '🦴',
    tags: ['Conservative', 'Overuse'],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1 — Pain Relief',
        weeks: '1-2',
        focus: 'Calm irritation',
        goals: ['Reduce pain'],
        exercises: [
          { id: 'clamshells', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'glute-bridge', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'hip-flexor-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: 'Daily' },
        ],
        precautions: ['Avoid lying on affected side'],
      },
      {
        id: 'p2',
        name: 'Phase 2 — Stability',
        weeks: '3-6',
        focus: 'Build hip stabilizer strength',
        goals: ['Single leg stance without pain', 'Stable gait'],
        exercises: [
          { id: 'banded-clamshells', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'fire-hydrants', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'monster-walks', sets: 3, reps: 12, frequency: 'Daily' },
          { id: 'single-leg-bridge', sets: 3, reps: 10, frequency: 'Daily' },
          { id: 'single-leg-balance', sets: 3, reps: 4, holdSeconds: 30, frequency: 'Daily' },
        ],
        precautions: [],
      },
    ],
  },

  // ════════════════════════════════════════════════════════
  //                  RUNNER PROGRAMS (Ashima)
  // ════════════════════════════════════════════════════════
  {
    id: 'pre-run-warmup',
    name: 'Pre-Running Warm-Up',
    bodyPart: 'Knee',
    condition: 'General Conditioning',
    totalWeeks: 0, // ongoing routine
    description: 'A 10-12 minute dynamic warm-up to prime the body for running. Activates glutes, mobilizes hips, and elevates heart rate before you head out the door.',
    objective: 'Prepare the body for a safe and efficient run by activating key muscles and lubricating joints.',
    frequency: 'Before every run',
    icon: '🏃‍♂️',
    tags: ['Routine', 'Running', 'Warm-up'],
    phases: [
      {
        id: 'p1',
        name: 'Stage 1 — Activation (3 min)',
        weeks: 'Routine',
        focus: 'Wake up the glutes and core before adding movement',
        goals: ['Glute activation', 'Hip stability primed', 'Core engaged'],
        exercises: [
          { id: 'glute-bridge', sets: 2, reps: 12, holdSeconds: 2, frequency: 'Pre-run' },
          { id: 'banded-clamshells', sets: 2, reps: 15, frequency: 'Pre-run' },
          { id: 'monster-walks', sets: 2, reps: 12, frequency: 'Pre-run' },
        ],
        precautions: ['Skip if any sharp pain — go straight to walking warm-up instead'],
      },
      {
        id: 'p2',
        name: 'Stage 2 — Mobility (4 min)',
        weeks: 'Routine',
        focus: 'Open hips, hamstrings, and thoracic spine',
        goals: ['Hip mobility', 'Multi-plane movement prep'],
        exercises: [
          { id: 'leg-swings', sets: 2, reps: 12, frequency: 'Pre-run' },
          { id: 'world-greatest-stretch', sets: 2, reps: 6, frequency: 'Pre-run' },
        ],
        precautions: [],
      },
      {
        id: 'p3',
        name: 'Stage 3 — Dynamic Warm-Up (4 min)',
        weeks: 'Routine',
        focus: 'Elevate heart rate with running-specific drills',
        goals: ['Heart rate elevated', 'Running-specific patterns activated'],
        exercises: [
          { id: 'walking-lunges', sets: 2, reps: 12, frequency: 'Pre-run' },
          { id: 'high-knees', sets: 2, reps: 20, frequency: 'Pre-run' },
          { id: 'butt-kicks', sets: 2, reps: 20, frequency: 'Pre-run' },
        ],
        precautions: ['Land softly on the balls of your feet'],
      },
    ],
  },

  {
    id: 'post-run-recovery',
    name: 'Post-Running Recovery',
    bodyPart: 'Knee',
    condition: 'General Conditioning',
    totalWeeks: 0,
    description: 'A 15 minute static cool-down and recovery routine to do immediately after every run. Loosens tight muscles, improves flexibility long-term, and helps prevent overuse injuries.',
    objective: 'Reduce post-run muscle tightness, restore flexibility, and accelerate recovery.',
    frequency: 'After every run',
    icon: '🧘',
    tags: ['Routine', 'Running', 'Cool-down', 'Recovery'],
    phases: [
      {
        id: 'p1',
        name: 'Stage 1 — Standing Cool-Down (5 min)',
        weeks: 'Routine',
        focus: 'Quick standing stretches while still warm',
        goals: ['Cool down major running muscles', 'Avoid stiffness'],
        exercises: [
          { id: 'standing-quad-stretch', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run' },
          { id: 'standing-hamstring-stretch', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run' },
          { id: 'calf-stretch-wall', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run' },
        ],
        precautions: ['Hold steady — no bouncing'],
      },
      {
        id: 'p2',
        name: 'Stage 2 — Floor Stretches (6 min)',
        weeks: 'Routine',
        focus: 'Deep hip and glute work',
        goals: ['Open up hips', 'Release glutes and IT band area'],
        exercises: [
          { id: 'pigeon-pose', sets: 1, reps: 1, holdSeconds: 60, frequency: 'Post-run' },
          { id: 'figure-4-stretch', sets: 1, reps: 1, holdSeconds: 30, frequency: 'Post-run' },
          { id: 'hip-flexor-stretch', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run' },
        ],
        precautions: ['Use a pillow under the front hip in pigeon if tight'],
      },
      {
        id: 'p3',
        name: 'Stage 3 — Self-Myofascial Release (4 min)',
        weeks: 'Routine',
        focus: 'Foam rolling for ITB and quads',
        goals: ['Release fascial tension', 'Reduce next-day soreness'],
        exercises: [
          { id: 'foam-roll-it-band', sets: 1, reps: 1, holdSeconds: 90, frequency: 'Post-run' },
        ],
        precautions: ['Discomfort is okay, sharp pain is not — back off if needed'],
      },
    ],
  },

  {
    id: 'runners-knee-maintenance',
    name: "Runner's Knee Maintenance",
    bodyPart: 'Knee',
    condition: 'General Conditioning',
    totalWeeks: 0,
    description: 'A daily 5-minute knee resilience routine for runners with ACL or meniscus history. Keeps the VMO firing and proprioception sharp.',
    objective: 'Long-term knee protection through targeted strengthening and balance training.',
    frequency: 'Daily',
    icon: '🦵',
    tags: ['Routine', 'Running', 'Knee Protection'],
    phases: [
      {
        id: 'p1',
        name: 'Daily Routine',
        weeks: 'Routine',
        focus: 'VMO strength and proprioception',
        goals: ['Maintain quad strength', 'Sharp proprioception', 'Knee tracking confidence'],
        exercises: [
          { id: 'terminal-knee-extension', sets: 3, reps: 15, frequency: 'Daily' },
          { id: 'single-leg-balance', sets: 2, reps: 4, holdSeconds: 30, frequency: 'Daily' },
          { id: 'quad-sets', sets: 2, reps: 15, holdSeconds: 5, frequency: 'Daily' },
        ],
        precautions: ['Stop if knee pain develops — see your physio'],
      },
    ],
  },
];

export function getProtocolById(id) {
  return PROTOCOLS.find(p => p.id === id);
}

export function getProtocolsByBodyPart(bodyPart) {
  return PROTOCOLS.filter(p => p.bodyPart === bodyPart);
}

export function getProtocolsByCondition(condition) {
  return PROTOCOLS.filter(p => p.condition === condition);
}
