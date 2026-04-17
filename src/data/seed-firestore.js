// ─── Firestore Seed Script ───
// Seeds the exercises collection with the full exercise library.
// Run this once from the app or a script to populate Firestore.

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EXERCISE_LIBRARY } from './exercises';

const SEED_DOC = '_meta/seed_status';

export async function seedFirestoreExercises() {
  // Check if already seeded
  const statusDoc = await getDoc(doc(db, SEED_DOC));
  if (statusDoc.exists() && statusDoc.data().exercisesSeeded) {
    return false; // Already done
  }

  // Seed all exercises
  const batch = [];
  for (const exercise of EXERCISE_LIBRARY) {
    batch.push(
      setDoc(doc(db, 'exercises', exercise.id), {
        ...exercise,
        isActive: true,
        requiresFront: true,
        requiresSide: true,
        maxDurationSec: 60,
        createdAt: new Date().toISOString(),
      }, { merge: true })
    );
  }
  await Promise.all(batch);

  // Mark as seeded
  await setDoc(doc(db, SEED_DOC), {
    exercisesSeeded: true,
    exerciseCount: EXERCISE_LIBRARY.length,
    seededAt: new Date().toISOString(),
  }, { merge: true });

  return true;
}
