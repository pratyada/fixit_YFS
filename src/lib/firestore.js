// ─── Firestore Service Layer ───
// Collections map to the FIXIT schema from dev_roadmap/0.1/schema.prisma
// Adapted for Firestore's document-based model.
//
// Collection structure:
//   users/{uid}                          — patient profile
//   users/{uid}/sessions/{sessionId}     — exercise recording sessions
//   users/{uid}/painEntries/{entryId}    — pain journal entries
//   users/{uid}/assignments/{assignId}   — exercises assigned by practitioner
//   exercises/{exerciseId}               — exercise library (shared)
//   feedback/{feedbackId}                — practitioner feedback on sessions

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Helpers ───

function toDate(ts) {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function docWithId(snap) {
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, ...data };
}

async function queryDocs(ref) {
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Users ───

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return docWithId(snap);
}

export async function setUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Exercises (shared library) ───

export async function getExercises() {
  return queryDocs(
    query(collection(db, 'exercises'), orderBy('name'))
  );
}

export async function getExercise(exerciseId) {
  const snap = await getDoc(doc(db, 'exercises', exerciseId));
  return docWithId(snap);
}

export async function setExercise(exerciseId, data) {
  await setDoc(doc(db, 'exercises', exerciseId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Assignments (per patient) ───

export async function getAssignments(uid) {
  return queryDocs(
    query(collection(db, 'users', uid, 'assignments'), orderBy('assignedAt', 'desc'))
  );
}

export async function addAssignment(uid, data) {
  return addDoc(collection(db, 'users', uid, 'assignments'), {
    ...data,
    status: 'PENDING',
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAssignment(uid, assignmentId, data) {
  await updateDoc(doc(db, 'users', uid, 'assignments', assignmentId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Sessions (exercise recordings per patient) ───

export async function getSessions(uid) {
  return queryDocs(
    query(collection(db, 'users', uid, 'sessions'), orderBy('createdAt', 'desc'))
  );
}

export async function getSessionsByExercise(uid, exerciseId) {
  return queryDocs(
    query(
      collection(db, 'users', uid, 'sessions'),
      where('exerciseId', '==', exerciseId),
      orderBy('createdAt', 'desc')
    )
  );
}

export async function addSession(uid, data) {
  return addDoc(collection(db, 'users', uid, 'sessions'), {
    ...data,
    status: 'UPLOADING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSession(uid, sessionId, data) {
  await updateDoc(doc(db, 'users', uid, 'sessions', sessionId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Pain Entries (per patient) ───

export async function getPainEntries(uid) {
  return queryDocs(
    query(collection(db, 'users', uid, 'painEntries'), orderBy('timestamp', 'desc'))
  );
}

export async function addPainEntry(uid, data) {
  return addDoc(collection(db, 'users', uid, 'painEntries'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

export async function deletePainEntry(uid, entryId) {
  await deleteDoc(doc(db, 'users', uid, 'painEntries', entryId));
}

// ─── Completed Exercise Logs (per patient) ───
// Lightweight log of each exercise completion (date, reps, pain, etc.)

export async function getCompletedSessions(uid) {
  return queryDocs(
    query(collection(db, 'users', uid, 'completedSessions'), orderBy('date', 'desc'))
  );
}

export async function addCompletedSession(uid, data) {
  return addDoc(collection(db, 'users', uid, 'completedSessions'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

// ─── Admin: User Management ───

export async function getAllUsers() {
  return queryDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  );
}

export async function getUsersByRole(role) {
  return queryDocs(
    query(collection(db, 'users'), where('role', '==', role))
  );
}

export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserRoles(uid, roles) {
  await updateDoc(doc(db, 'users', uid), {
    roles,
    role: roles[0] || 'patient',
    updatedAt: serverTimestamp(),
  });
}

// ─── Kiosk Sessions (clinic walk-ins) ───

export async function addKioskSession(data) {
  return addDoc(collection(db, 'kioskSessions'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getKioskSessions(limitCount = 100) {
  return queryDocs(
    query(collection(db, 'kioskSessions'), orderBy('createdAt', 'desc'), limit(limitCount))
  );
}

export async function assignPatientToPractitioner(patientId, practitionerId) {
  // Backward compat: also set single practitionerId
  await updateDoc(doc(db, 'users', patientId), {
    practitionerId,
    updatedAt: serverTimestamp(),
  });
}

export async function setPatientPractitioners(patientId, practitionerIds) {
  await updateDoc(doc(db, 'users', patientId), {
    practitionerIds,
    practitionerId: practitionerIds[0] || null, // backward compat
    updatedAt: serverTimestamp(),
  });
}

// ─── Practitioner: get their patients ───

export async function getPatientsByPractitioner(practitionerId) {
  // Query both old single field and new array field
  const [oldResults, newResults] = await Promise.all([
    queryDocs(query(collection(db, 'users'), where('practitionerId', '==', practitionerId))),
    queryDocs(query(collection(db, 'users'), where('practitionerIds', 'array-contains', practitionerId))),
  ]);
  // Merge and deduplicate
  const map = {};
  [...oldResults, ...newResults].forEach(u => { map[u.id] = u; });
  return Object.values(map).filter(u => {
    const roles = u.roles || [u.role];
    return roles.includes('patient');
  });
}

// ─── Practitioner: get all sessions for a patient ───

export async function getPatientSessions(patientId) {
  return queryDocs(
    query(collection(db, 'users', patientId, 'sessions'), orderBy('createdAt', 'desc'))
  );
}

// ─── Feedback (from practitioner on a session) ───

export async function getFeedbackForSession(sessionId) {
  const results = await queryDocs(
    query(collection(db, 'feedback'), where('sessionId', '==', sessionId))
  );
  return results[0] || null;
}

export async function addFeedback(data) {
  return addDoc(collection(db, 'feedback'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getAllFeedback(limitCount = 500) {
  return queryDocs(
    query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(limitCount))
  );
}

// ─── Real-time listeners ───

export function onAssignments(uid, callback) {
  return onSnapshot(
    query(collection(db, 'users', uid, 'assignments'), orderBy('assignedAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function onSessions(uid, callback) {
  return onSnapshot(
    query(collection(db, 'users', uid, 'sessions'), orderBy('createdAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function onPainEntries(uid, callback) {
  return onSnapshot(
    query(collection(db, 'users', uid, 'painEntries'), orderBy('timestamp', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function onCompletedSessions(uid, callback) {
  return onSnapshot(
    query(collection(db, 'users', uid, 'completedSessions'), orderBy('date', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// ─── Account Deletion (PIPEDA compliance) ───

async function deleteSubcollection(uid, subcollection) {
  const snap = await getDocs(collection(db, 'users', uid, subcollection));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  if (snap.docs.length > 0) await batch.commit();
}

export async function deleteUserData(uid) {
  // Delete all subcollections
  const subcollections = ['sessions', 'painEntries', 'assignments', 'completedSessions'];
  for (const sub of subcollections) {
    await deleteSubcollection(uid, sub);
  }
  // Delete feedback docs referencing this user
  const feedbackSnap = await getDocs(
    query(collection(db, 'feedback'), where('practitionerId', '==', uid))
  );
  if (feedbackSnap.docs.length > 0) {
    const batch = writeBatch(db);
    feedbackSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  // Delete user document
  await deleteDoc(doc(db, 'users', uid));
}
