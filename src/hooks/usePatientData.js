import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  onCompletedSessions, onPainEntries, onAssignments,
  addCompletedSession, addPainEntry, addAssignment,
  getCompletedSessions, getPainEntries, getAssignments,
} from '../lib/firestore';
import { save, load } from '../utils/storage';

// Hybrid hook: uses Firestore when authenticated, falls back to localStorage.
// This ensures existing pages work during migration and also offline.

export function usePatientData(key, initialValue) {
  const { activePatientId, user } = useAuth();
  const [state, setState] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  // Firestore collection mapping
  const firestoreKey = key === 'completed_sessions' ? 'completedSessions'
    : key === 'pain_entries' ? 'painEntries'
    : key === 'assigned_exercises' ? 'assignments'
    : null;

  useEffect(() => {
    if (!activePatientId) return;

    // If we have a Firestore mapping and user is authenticated, use realtime listener
    if (user && firestoreKey) {
      const listenerMap = {
        completedSessions: onCompletedSessions,
        painEntries: onPainEntries,
        assignments: onAssignments,
      };
      const listener = listenerMap[firestoreKey];
      if (listener) {
        const unsub = listener(activePatientId, (docs) => {
          setState(docs);
          setLoaded(true);
        });
        return unsub;
      }
    }

    // Fallback to localStorage for keys without Firestore mapping
    const scopedKey = `patient_${activePatientId}_${key}`;
    const stored = load(scopedKey, initialValue);
    setState(stored);
    setLoaded(true);
  }, [activePatientId, user, key]);

  const update = useCallback((valueOrFn) => {
    setState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      // Also save to localStorage as fallback/cache
      if (activePatientId) {
        const scopedKey = `patient_${activePatientId}_${key}`;
        save(scopedKey, next);
      }
      return next;
    });
  }, [activePatientId, key]);

  return [state, update];
}
