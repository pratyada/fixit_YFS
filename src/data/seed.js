// ─── Demo data seeder ───
// Runs once on first app load to populate the demo with realistic data
// for all seeded patients: assigned programs, assigned exercises,
// completed sessions, and pain entries.

import { save, load } from '../utils/storage';

const SEED_FLAG = 'demo_seeded_v3';

const PATIENT_SEEDS = {
  // Alex Chen — ACL Reconstruction
  'pat-1': {
    program: 'acl-recon-24wk',
    exercises: [
      { exerciseId: 'quad-sets', sets: 3, reps: 15, holdSeconds: 5, frequency: '3x daily', notes: 'Focus on full extension' },
      { exerciseId: 'straight-leg-raise', sets: 3, reps: 10, holdSeconds: 3, frequency: 'Daily' },
      { exerciseId: 'heel-slides', sets: 3, reps: 15, frequency: '2x daily', notes: 'Track ROM weekly' },
      { exerciseId: 'glute-bridge', sets: 3, reps: 12, holdSeconds: 3, frequency: 'Daily' },
      { exerciseId: 'clamshells', sets: 3, reps: 15, frequency: 'Daily' },
      { exerciseId: 'single-leg-balance', sets: 3, reps: 4, holdSeconds: 30, frequency: 'Daily' },
    ],
    sessions: [
      { exerciseId: 'quad-sets', daysAgo: 0, painLevel: 2 },
      { exerciseId: 'straight-leg-raise', daysAgo: 0, painLevel: 2 },
      { exerciseId: 'heel-slides', daysAgo: 1, painLevel: 3 },
      { exerciseId: 'glute-bridge', daysAgo: 1, painLevel: 2 },
      { exerciseId: 'quad-sets', daysAgo: 2, painLevel: 3 },
      { exerciseId: 'clamshells', daysAgo: 2, painLevel: 2 },
      { exerciseId: 'quad-sets', daysAgo: 3, painLevel: 4 },
      { exerciseId: 'straight-leg-raise', daysAgo: 4, painLevel: 4 },
      { exerciseId: 'heel-slides', daysAgo: 5, painLevel: 5 },
      { exerciseId: 'quad-sets', daysAgo: 6, painLevel: 5 },
    ],
    painEntries: [
      { level: 5, location: 'Knee (front)', activity: 'Walking', daysAgo: 8 },
      { level: 4, location: 'Knee (front)', activity: 'Stairs', daysAgo: 6 },
      { level: 4, location: 'Knee (front)', activity: 'Exercise', daysAgo: 4 },
      { level: 3, location: 'Knee (front)', activity: 'Walking', daysAgo: 2 },
      { level: 2, location: 'Knee (front)', activity: 'Rest', daysAgo: 0 },
    ],
    profile: { name: 'Alex Chen', injury: 'ACL Reconstruction', side: 'Right', surgeryDate: '2026-02-14' },
  },

  // Maria Rodriguez — Frozen Shoulder
  'pat-2': {
    program: 'frozen-shoulder-12wk',
    exercises: [
      { exerciseId: 'pendulum', sets: 3, reps: 20, frequency: '3x daily', notes: 'Use heat first' },
      { exerciseId: 'wall-walks', sets: 3, reps: 10, frequency: '3x daily', notes: 'Track height progress' },
      { exerciseId: 'wall-angels', sets: 3, reps: 10, frequency: 'Daily' },
      { exerciseId: 'scapular-squeezes', sets: 3, reps: 15, holdSeconds: 5, frequency: 'Daily' },
      { exerciseId: 'upper-trap-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '2x daily' },
    ],
    sessions: [
      { exerciseId: 'pendulum', daysAgo: 0, painLevel: 3 },
      { exerciseId: 'wall-walks', daysAgo: 0, painLevel: 4 },
      { exerciseId: 'pendulum', daysAgo: 1, painLevel: 4 },
      { exerciseId: 'wall-angels', daysAgo: 2, painLevel: 4 },
      { exerciseId: 'pendulum', daysAgo: 3, painLevel: 5 },
      { exerciseId: 'scapular-squeezes', daysAgo: 4, painLevel: 4 },
      { exerciseId: 'wall-walks', daysAgo: 5, painLevel: 5 },
    ],
    painEntries: [
      { level: 7, location: 'Shoulder', activity: 'Night/Sleep', daysAgo: 9 },
      { level: 6, location: 'Shoulder', activity: 'Exercise', daysAgo: 7 },
      { level: 6, location: 'Shoulder', activity: 'Night/Sleep', daysAgo: 5 },
      { level: 5, location: 'Shoulder', activity: 'Exercise', daysAgo: 3 },
      { level: 4, location: 'Shoulder', activity: 'Rest', daysAgo: 1 },
    ],
    profile: { name: 'Maria Rodriguez', injury: 'Frozen Shoulder', side: 'Left' },
  },

  // James Wilson — Low Back Pain
  'pat-3': {
    program: 'low-back-pain-6wk',
    exercises: [
      { exerciseId: 'pelvic-tilts', sets: 3, reps: 15, holdSeconds: 5, frequency: '2x daily' },
      { exerciseId: 'cat-cow', sets: 3, reps: 10, frequency: '2x daily' },
      { exerciseId: 'press-up', sets: 3, reps: 10, frequency: '2x daily', notes: 'Stop if leg pain increases' },
      { exerciseId: 'glute-bridge', sets: 3, reps: 12, frequency: 'Daily' },
      { exerciseId: 'bird-dog', sets: 3, reps: 10, holdSeconds: 5, frequency: 'Daily' },
      { exerciseId: 'dead-bug', sets: 3, reps: 10, frequency: 'Daily' },
    ],
    sessions: [
      { exerciseId: 'pelvic-tilts', daysAgo: 0, painLevel: 3 },
      { exerciseId: 'glute-bridge', daysAgo: 0, painLevel: 3 },
      { exerciseId: 'cat-cow', daysAgo: 1, painLevel: 4 },
      { exerciseId: 'bird-dog', daysAgo: 2, painLevel: 3 },
      { exerciseId: 'press-up', daysAgo: 3, painLevel: 4 },
      { exerciseId: 'glute-bridge', daysAgo: 4, painLevel: 5 },
    ],
    painEntries: [
      { level: 6, location: 'Lower Back', activity: 'Sitting', daysAgo: 7 },
      { level: 5, location: 'Lower Back', activity: 'Standing', daysAgo: 5 },
      { level: 5, location: 'Lower Back', activity: 'Sitting', daysAgo: 3 },
      { level: 4, location: 'Lower Back', activity: 'Walking', daysAgo: 1 },
    ],
    profile: { name: 'James Wilson', injury: 'Low Back Pain', side: 'N/A' },
  },

  // Priya Patel — Plantar Fasciitis
  'pat-4': {
    program: 'plantar-fasciitis-8wk',
    exercises: [
      { exerciseId: 'plantar-fascia-stretch', sets: 3, reps: 1, holdSeconds: 30, frequency: '3x daily', notes: 'First thing in the morning is essential' },
      { exerciseId: 'calf-raises', sets: 3, reps: 15, frequency: 'Daily' },
      { exerciseId: 'towel-scrunches', sets: 3, reps: 10, frequency: 'Daily' },
      { exerciseId: 'single-leg-calf-raise', sets: 3, reps: 12, frequency: '5x/week' },
    ],
    sessions: [
      { exerciseId: 'plantar-fascia-stretch', daysAgo: 0, painLevel: 3 },
      { exerciseId: 'calf-raises', daysAgo: 0, painLevel: 3 },
      { exerciseId: 'towel-scrunches', daysAgo: 1, painLevel: 4 },
      { exerciseId: 'plantar-fascia-stretch', daysAgo: 2, painLevel: 4 },
      { exerciseId: 'calf-raises', daysAgo: 3, painLevel: 5 },
      { exerciseId: 'plantar-fascia-stretch', daysAgo: 4, painLevel: 5 },
      { exerciseId: 'plantar-fascia-stretch', daysAgo: 5, painLevel: 6 },
    ],
    painEntries: [
      { level: 7, location: 'Other', activity: 'Morning stiffness', daysAgo: 8, notes: 'Worst in the morning' },
      { level: 6, location: 'Other', activity: 'Walking', daysAgo: 6 },
      { level: 5, location: 'Other', activity: 'Walking', daysAgo: 4 },
      { level: 4, location: 'Other', activity: 'Walking', daysAgo: 2 },
      { level: 3, location: 'Other', activity: 'Rest', daysAgo: 0 },
    ],
    profile: { name: 'Priya Patel', injury: 'Plantar Fasciitis', side: 'Right' },
  },

  // Prateek — Daily runner, ACL recon + meniscus tear history
  // Allocated by Ashima Naval (sports physio)
  // Pre-run dynamic warm-up + post-run static cool-down
  'pat-5': {
    program: null, // No formal protocol — custom exercise allocation
    exercises: [
      // ── PRE-RUN: Dynamic warm-up ──
      { exerciseId: 'leg-swings', sets: 2, reps: 12, frequency: 'Pre-run', notes: 'PRE-RUN ▸ Dynamic warm-up. 12 forward swings + 12 lateral swings each leg.' },
      { exerciseId: 'world-greatest-stretch', sets: 2, reps: 6, frequency: 'Pre-run', notes: 'PRE-RUN ▸ Hits hips, hamstrings, T-spine in one move. 6 reps per side.' },
      { exerciseId: 'walking-lunges', sets: 2, reps: 12, frequency: 'Pre-run', notes: 'PRE-RUN ▸ 12 lunges per leg. Long stride, knee tracks over ankle.' },
      { exerciseId: 'high-knees', sets: 2, reps: 20, frequency: 'Pre-run', notes: 'PRE-RUN ▸ 20 per leg. Light marching pace, build to a jog.' },
      { exerciseId: 'butt-kicks', sets: 2, reps: 20, frequency: 'Pre-run', notes: 'PRE-RUN ▸ 20 per leg. Stay light on your feet.' },
      { exerciseId: 'glute-bridge', sets: 2, reps: 12, holdSeconds: 2, frequency: 'Pre-run', notes: 'PRE-RUN ▸ Wakes up glutes — protects the knee. Squeeze hard at the top.' },
      { exerciseId: 'banded-clamshells', sets: 2, reps: 15, frequency: 'Pre-run', notes: 'PRE-RUN ▸ Critical for ACL grafts. Glute med activation.' },
      { exerciseId: 'monster-walks', sets: 2, reps: 12, frequency: 'Pre-run', notes: 'PRE-RUN ▸ 12 forward + 12 backward. Stay low, knees pushed out.' },

      // ── POST-RUN: Static cool-down ──
      { exerciseId: 'standing-quad-stretch', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run', notes: 'POST-RUN ▸ Hold 30s per leg. Tuck tailbone, knees together.' },
      { exerciseId: 'standing-hamstring-stretch', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run', notes: 'POST-RUN ▸ Hinge from hips, not back. 30s per leg.' },
      { exerciseId: 'calf-stretch-wall', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run', notes: 'POST-RUN ▸ Both straight-knee AND bent-knee versions. 30s each, both legs.' },
      { exerciseId: 'pigeon-pose', sets: 1, reps: 1, holdSeconds: 60, frequency: 'Post-run', notes: 'POST-RUN ▸ Hold 60s per side. Use a pillow under hip if tight.' },
      { exerciseId: 'figure-4-stretch', sets: 1, reps: 1, holdSeconds: 30, frequency: 'Post-run', notes: 'POST-RUN ▸ Easier alternative to pigeon if hip is tight today.' },
      { exerciseId: 'foam-roll-it-band', sets: 1, reps: 1, holdSeconds: 90, frequency: 'Post-run', notes: 'POST-RUN ▸ 90s each side. Critical with ACL history — keep IT band loose.' },
      { exerciseId: 'hip-flexor-stretch', sets: 2, reps: 1, holdSeconds: 30, frequency: 'Post-run', notes: 'POST-RUN ▸ Hold 30s per side. Squeeze back glute to deepen.' },

      // ── KNEE MAINTENANCE (DAILY) ──
      { exerciseId: 'terminal-knee-extension', sets: 3, reps: 15, frequency: 'Daily (any time)', notes: 'KNEE MAINTENANCE ▸ Keep VMO strong long-term. Lock knee at the end.' },
      { exerciseId: 'single-leg-balance', sets: 2, reps: 4, holdSeconds: 30, frequency: 'Daily (any time)', notes: 'KNEE MAINTENANCE ▸ Proprioception. Try eyes-closed once stable.' },
    ],
    sessions: [],   // No sessions yet — Prateek will fill these in
    painEntries: [], // Same — let him log his own
    profile: {
      name: 'Prateek',
      injury: 'Past ACL Recon + Meniscus (asymptomatic)',
      side: 'Right',
      goal: 'Daily 4-mile running, knee protection',
    },
  },
};

function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function seedDemoData() {
  if (load(SEED_FLAG, false)) return;

  Object.entries(PATIENT_SEEDS).forEach(([patientId, data]) => {
    // Assigned program
    if (data.program) {
      save(`patient_${patientId}_assigned_programs`, [{
        id: genId(),
        protocolId: data.program,
        assignedDate: daysAgoDate(10).toISOString(),
        startDate: daysAgoDate(10).toISOString().split('T')[0],
        currentPhase: 0,
        status: 'active',
      }]);
    }

    // Assigned individual exercises
    save(`patient_${patientId}_assigned_exercises`, data.exercises.map(ex => ({
      id: genId(),
      ...ex,
      assignedDate: daysAgoDate(10).toISOString(),
    })));

    // Completed sessions
    save(`patient_${patientId}_completed_sessions`, data.sessions.map((s, i) => {
      const dateObj = daysAgoDate(s.daysAgo);
      return {
        id: genId() + i,
        exerciseId: s.exerciseId,
        date: dateObj.toISOString().split('T')[0],
        timestamp: dateObj.toISOString(),
        duration: 600 + Math.floor(Math.random() * 300),
        setsCompleted: 3,
        repsCompleted: 12,
        painLevel: s.painLevel,
        notes: '',
      };
    }));

    // Pain entries
    save(`patient_${patientId}_pain_entries`, data.painEntries.map((p, i) => {
      const dateObj = daysAgoDate(p.daysAgo);
      return {
        id: genId() + i,
        timestamp: dateObj.toISOString(),
        date: dateObj.toISOString().split('T')[0],
        level: p.level,
        location: p.location,
        activity: p.activity,
        swelling: p.level >= 5 ? 'Mild' : 'None',
        stiffness: p.level >= 4 ? 'Moderate' : 'Mild',
        rom: null,
        notes: p.notes || '',
      };
    }));

    // Profile
    if (data.profile) {
      save(`patient_${patientId}_user_profile`, data.profile);
    }
  });

  save(SEED_FLAG, true);
}
