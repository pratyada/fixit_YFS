// ─── Sample users (practitioners + patients) ───
// In a real app these would come from a backend.
// For this demo we seed local-only fake users.

import { load, save } from '../utils/storage';

const PRACTITIONERS_KEY = 'practitioners';
const PATIENTS_KEY = 'patients';

const SEED_PRACTITIONERS = [
  { id: 'pract-1', name: 'Dr. Sarah Khan', title: 'Physiotherapist', clinic: 'Your Form Sux Wellness Centre' },
  { id: 'pract-2', name: 'Ashima Naval', title: 'Physiotherapist — Sports & Running', clinic: 'Your Form Sux Wellness Centre' },
];

const SEED_PATIENTS = [
  {
    id: 'pat-1', name: 'Alex Chen', age: 28, condition: 'ACL Reconstruction',
    side: 'Right', surgeryDate: '2026-02-14', practitionerId: 'pract-1',
    avatar: '🧑',
  },
  {
    id: 'pat-2', name: 'Maria Rodriguez', age: 45, condition: 'Frozen Shoulder',
    side: 'Left', surgeryDate: null, practitionerId: 'pract-1',
    avatar: '👩',
  },
  {
    id: 'pat-3', name: 'James Wilson', age: 52, condition: 'Low Back Pain',
    side: 'N/A', surgeryDate: null, practitionerId: 'pract-1',
    avatar: '🧔',
  },
  {
    id: 'pat-4', name: 'Priya Patel', age: 34, condition: 'Plantar Fasciitis',
    side: 'Right', surgeryDate: null, practitionerId: 'pract-1',
    avatar: '👩‍🦱',
  },
  {
    id: 'pat-5', name: 'Prateek', age: 32, condition: 'General Conditioning',
    side: 'Right', surgeryDate: null, practitionerId: 'pract-2',
    avatar: '🏃',
    history: 'Past ACL reconstruction + meniscus tear (right knee). Currently asymptomatic.',
    activity: 'Daily running — 4 miles at 9:00/mile pace',
    goals: 'Pre-run mobility & post-run recovery to protect knee long-term',
  },
];

// Idempotent merge: always ensure seed users exist, but preserve any
// custom users that were added later. This way bumping the seed list
// automatically adds new demo users without wiping data.
export function getPractitioners() {
  const stored = load(PRACTITIONERS_KEY, []);
  const merged = [...stored];
  let changed = false;
  SEED_PRACTITIONERS.forEach(seed => {
    if (!merged.find(p => p.id === seed.id)) {
      merged.push(seed);
      changed = true;
    }
  });
  if (changed) save(PRACTITIONERS_KEY, merged);
  return merged;
}

export function getPatients() {
  const stored = load(PATIENTS_KEY, []);
  const merged = [...stored];
  let changed = false;
  SEED_PATIENTS.forEach(seed => {
    if (!merged.find(p => p.id === seed.id)) {
      merged.push(seed);
      changed = true;
    }
  });
  if (changed) save(PATIENTS_KEY, merged);
  return merged;
}

export function getPatientsByPractitioner(practitionerId) {
  return getPatients().filter(p => p.practitionerId === practitionerId);
}

export function getPatientById(id) {
  return getPatients().find(p => p.id === id);
}

export function getPractitionerById(id) {
  return getPractitioners().find(p => p.id === id);
}

export function addPatient(patient) {
  const patients = getPatients();
  const newPatient = {
    id: 'pat-' + Date.now().toString(36),
    avatar: '👤',
    ...patient,
  };
  const updated = [...patients, newPatient];
  save(PATIENTS_KEY, updated);
  return newPatient;
}

export function updatePatient(id, updates) {
  const patients = getPatients();
  const updated = patients.map(p => p.id === id ? { ...p, ...updates } : p);
  save(PATIENTS_KEY, updated);
}

export function deletePatient(id) {
  const patients = getPatients();
  save(PATIENTS_KEY, patients.filter(p => p.id !== id));
}
