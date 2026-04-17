// =============================================================================
// FIXIT — Seed Script
// =============================================================================
// Seeds: 1 admin, 2 practitioners, 4 patients (2 per practitioner),
//        5 exercises, 4 sample assignments, 1 completed session with feedback.
//
// Run: `npx prisma db seed` (after configuring package.json prisma.seed entry)
// or:  `npx tsx prisma/seed.ts`
//
// Defaults assumed (CONFIRM during discovery):
//   - bcryptjs for password hashing (swap for argon2/scrypt if YourFormSux uses one)
//   - Default password for all seeded users: "FixitDemo2026!"
//   - Database is empty or this script is run against a fresh schema
// =============================================================================

import { PrismaClient, UserRole, ExerciseCategory, ExerciseDifficulty,
         AssignmentStatus, SessionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'FixitDemo2026!';

// -----------------------------------------------------------------------------
// EXERCISE LIBRARY (5 exercises across 3 categories)
// -----------------------------------------------------------------------------

const EXERCISES = [
  {
    slug: 'squats',
    name: 'Squats',
    category: ExerciseCategory.LOWER_BODY,
    difficulty: ExerciseDifficulty.BEGINNER,
    instructions: `## Squats

1. Stand with feet shoulder-width apart, toes pointing slightly outward.
2. Keep your chest up and core engaged.
3. Lower your hips back and down as if sitting into a chair.
4. Descend until thighs are parallel to the floor (or as deep as comfortable).
5. Drive through your heels to return to standing.

**Reps:** 3 sets of 10 unless your practitioner says otherwise.`,
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    keyFormCues: [
      'Knees track over toes (not collapsing inward)',
      'Neutral spine — no rounding',
      'Heels stay planted',
      'Hip crease descends below knee crease at bottom',
      'Symmetrical depth left vs. right',
    ],
    maxDurationSec: 60,
  },
  {
    slug: 'deadlift',
    name: 'Deadlift',
    category: ExerciseCategory.LOWER_BODY,
    difficulty: ExerciseDifficulty.INTERMEDIATE,
    instructions: `## Deadlift

1. Stand with feet hip-width apart, weight (or imagined weight) over mid-foot.
2. Hinge at the hips, sending your hips back while keeping your back flat.
3. Grip bar (or hands at shin level) with arms straight.
4. Drive through the floor, extending hips and knees together.
5. Stand tall at the top, shoulders back. Reverse the motion to return.

**Reps:** 3 sets of 8 unless your practitioner says otherwise.`,
    targetMuscles: ['hamstrings', 'glutes', 'erector spinae', 'lats', 'core'],
    keyFormCues: [
      'Neutral spine throughout (no rounding or hyperextension)',
      'Bar/hands track close to body',
      'Hips and shoulders rise together',
      'Lockout at top — full hip extension, no leaning back',
      'Knees and toes aligned',
    ],
    maxDurationSec: 60,
  },
  {
    slug: 'reverse-fly',
    name: 'Reverse Fly',
    category: ExerciseCategory.UPPER_BODY,
    difficulty: ExerciseDifficulty.BEGINNER,
    instructions: `## Reverse Fly

1. Hinge forward at the hips, back flat, knees softly bent.
2. Let arms hang straight down, palms facing each other.
3. With a slight bend in the elbows, raise arms out to the sides.
4. Squeeze shoulder blades together at the top.
5. Lower with control.

**Reps:** 3 sets of 12 unless your practitioner says otherwise.`,
    targetMuscles: ['rear deltoids', 'rhomboids', 'middle trapezius'],
    keyFormCues: [
      'Hinged torso position maintained — no standing up mid-rep',
      'Arms move in scapular plane (slightly forward of straight sideways)',
      'Shoulder blades retract at top',
      'No momentum / swinging',
      'Symmetrical arm height',
    ],
    maxDurationSec: 45,
  },
  {
    slug: 'bicep-curl',
    name: 'Bicep Curl',
    category: ExerciseCategory.UPPER_BODY,
    difficulty: ExerciseDifficulty.BEGINNER,
    instructions: `## Bicep Curl

1. Stand tall, arms at sides, palms facing forward.
2. Keep elbows pinned to your ribs.
3. Curl forearms up toward your shoulders.
4. Squeeze at the top; lower under control.

**Reps:** 3 sets of 12 unless your practitioner says otherwise.`,
    targetMuscles: ['biceps brachii', 'brachialis', 'forearms'],
    keyFormCues: [
      'Elbows stay anchored at sides (no forward drift)',
      'No torso swing or hip thrust',
      'Full range — bottom and top',
      'Wrists neutral, not collapsed',
      'Controlled tempo on the eccentric (lowering) phase',
    ],
    maxDurationSec: 45,
  },
  {
    slug: 'plank',
    name: 'Plank',
    category: ExerciseCategory.CORE,
    difficulty: ExerciseDifficulty.BEGINNER,
    instructions: `## Plank

1. Start on forearms and toes, elbows directly under shoulders.
2. Body forms a straight line from head to heels.
3. Engage your core, glutes, and quads.
4. Breathe normally — do not hold your breath.
5. Hold for the prescribed time.

**Hold time:** 30–60 seconds unless your practitioner says otherwise.`,
    targetMuscles: ['rectus abdominis', 'transverse abdominis', 'obliques', 'glutes', 'shoulders'],
    keyFormCues: [
      'Hips level with shoulders — no sagging or piking',
      'Neutral neck (gaze down, not forward)',
      'Elbows directly under shoulders',
      'Glutes engaged',
      'Body holds the line for the full duration',
    ],
    maxDurationSec: 90,
  },
];

// -----------------------------------------------------------------------------
// USERS
// -----------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding FIXIT data...\n');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // ---- ADMIN ----
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fixit.yourformsux.com' },
    update: {},
    create: {
      email: 'admin@fixit.yourformsux.com',
      name: 'Alex Admin',
      role: UserRole.ADMIN,
      // passwordHash,  // uncomment once existing user model field name is confirmed
    },
  });
  console.log(`✓ Admin: ${admin.email}`);

  // ---- PRACTITIONERS ----
  const drNova = await prisma.user.upsert({
    where: { email: 'dr.nova@fixit.yourformsux.com' },
    update: {},
    create: {
      email: 'dr.nova@fixit.yourformsux.com',
      name: 'Dr. Nova Patel',
      role: UserRole.PRACTITIONER,
    },
  });
  const drKai = await prisma.user.upsert({
    where: { email: 'dr.kai@fixit.yourformsux.com' },
    update: {},
    create: {
      email: 'dr.kai@fixit.yourformsux.com',
      name: 'Dr. Kai Rivera',
      role: UserRole.PRACTITIONER,
    },
  });
  console.log(`✓ Practitioners: ${drNova.email}, ${drKai.email}`);

  // ---- PATIENTS (2 per practitioner) ----
  const patientsData = [
    { email: 'patient1@example.com', name: 'Sam Carter',  practitionerId: drNova.id },
    { email: 'patient2@example.com', name: 'Jordan Lee',  practitionerId: drNova.id },
    { email: 'patient3@example.com', name: 'Riley Chen',  practitionerId: drKai.id },
    { email: 'patient4@example.com', name: 'Morgan Patel', practitionerId: drKai.id },
  ];
  const patients = [];
  for (const p of patientsData) {
    const patient = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        role: UserRole.PATIENT,
        practitionerId: p.practitionerId,
      },
    });
    patients.push(patient);
  }
  console.log(`✓ Patients: ${patients.length} created\n`);

  // ---- EXERCISES ----
  const exercises = [];
  for (const ex of EXERCISES) {
    const exercise = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {},
      create: ex,
    });
    exercises.push(exercise);
  }
  console.log(`✓ Exercises: ${exercises.length} (${exercises.map(e => e.slug).join(', ')})\n`);

  const squats     = exercises.find(e => e.slug === 'squats')!;
  const deadlift   = exercises.find(e => e.slug === 'deadlift')!;
  const plank      = exercises.find(e => e.slug === 'plank')!;
  const bicepCurl  = exercises.find(e => e.slug === 'bicep-curl')!;

  // ---- ASSIGNMENTS ----
  const a1 = await prisma.assignment.create({
    data: {
      practitionerId: drNova.id,
      patientId: patients[0].id,  // Sam
      exerciseId: squats.id,
      status: AssignmentStatus.PENDING,
      notes: 'Focus on depth and knee tracking. Send video by Friday.',
    },
  });
  await prisma.assignment.create({
    data: {
      practitionerId: drNova.id,
      patientId: patients[1].id,  // Jordan
      exerciseId: plank.id,
      status: AssignmentStatus.PENDING,
      notes: '60-second hold. Two sets if comfortable.',
    },
  });
  await prisma.assignment.create({
    data: {
      practitionerId: drKai.id,
      patientId: patients[2].id,  // Riley
      exerciseId: bicepCurl.id,
      status: AssignmentStatus.PENDING,
    },
  });
  const a4 = await prisma.assignment.create({
    data: {
      practitionerId: drKai.id,
      patientId: patients[3].id,  // Morgan
      exerciseId: deadlift.id,
      status: AssignmentStatus.REVIEWED,
      notes: 'Hip hinge looking good last time — keep it up.',
    },
  });
  console.log(`✓ Assignments: 4 created\n`);

  // ---- SAMPLE COMPLETED SESSION (with feedback) ----
  // For the Morgan/Deadlift assignment that's already REVIEWED.
  const completedSession = await prisma.session.create({
    data: {
      assignmentId: a4.id,
      patientId: patients[3].id,
      exerciseId: deadlift.id,
      status: SessionStatus.REVIEWED,
      frontVideoKey: 'sessions/seed-demo/front.webm',  // placeholder; no actual file
      sideVideoKey:  'sessions/seed-demo/side.webm',
      videoMimeType: 'video/webm',
      durationSecFront: 42,
      durationSecSide: 38,
      aiModelVersion: 'yfs-pose-v1.0.0-seed',
      aiScore: 78.5,
      aiAnalyzedAt: new Date(),
      aiSummary: 'Strong hip hinge. Mild lower-back rounding at the bottom of the lift. Knees track well.',
      aiAnalysis: {
        overallScore: 78.5,
        cuesEvaluated: [
          { cue: 'Neutral spine throughout',           score: 65, status: 'needs_improvement',
            note: 'Slight lumbar flexion observed in bottom third of lift.' },
          { cue: 'Bar/hands track close to body',      score: 88, status: 'good' },
          { cue: 'Hips and shoulders rise together',   score: 82, status: 'good' },
          { cue: 'Lockout at top',                     score: 90, status: 'good' },
          { cue: 'Knees and toes aligned',             score: 85, status: 'good' },
        ],
        keypointConfidence: 0.91,
        framesAnalyzed: { front: 1260, side: 1140 },
      },
    },
  });

  await prisma.feedback.create({
    data: {
      sessionId: completedSession.id,
      practitionerId: drKai.id,
      rating: 4,
      whatWasGood: 'AI correctly identified the lumbar flexion at the bottom — that was the main thing I was looking for. Confidence scores look reasonable.',
      whatNeedsImproving: 'AI rated knee tracking at 85 but I think it was closer to 70 — left knee drifted inward on reps 3 and 5. Worth flagging that pattern more aggressively.',
      corrections: [
        { issue: 'Knee tracking score',
          aiValue: 85,
          practitionerValue: 70,
          note: 'Left-knee valgus on reps 3 and 5; AI under-weighted asymmetry.' },
      ],
      aiModelVersionSnapshot: 'yfs-pose-v1.0.0-seed',
    },
  });
  console.log(`✓ Sample completed session + feedback created\n`);

  console.log('═══════════════════════════════════════════════════');
  console.log('  Seed complete.');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log('  Admin:        admin@fixit.yourformsux.com');
  console.log('  Practitioner: dr.nova@fixit.yourformsux.com');
  console.log('  Practitioner: dr.kai@fixit.yourformsux.com');
  console.log('  Patient:      patient1@example.com (under Dr. Nova)');
  console.log('  Patient:      patient2@example.com (under Dr. Nova)');
  console.log('  Patient:      patient3@example.com (under Dr. Kai)');
  console.log('  Patient:      patient4@example.com (under Dr. Kai)');
  console.log('═══════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
