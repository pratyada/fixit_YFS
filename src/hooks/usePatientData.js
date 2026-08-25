import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  onCompletedSessions, onPainEntries, onAssignments,
  onFoodEntries, onWaterEntries, onBodyMetrics, onHealthReports,
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
  const FIRESTORE_KEY_MAP = {
    completed_sessions: 'completedSessions',
    pain_entries: 'painEntries',
    assigned_exercises: 'assignments',
    food_entries: 'foodEntries',
    water_entries: 'waterEntries',
    body_metrics: 'bodyMetrics',
    health_reports: 'healthReports',
  };
  const firestoreKey = FIRESTORE_KEY_MAP[key] || null;

  useEffect(() => {
    if (!activePatientId) return;
    const scopedKey = `patient_${activePatientId}_${key}`;

    // If we have a Firestore mapping and user is authenticated, use realtime listener
    if (user && firestoreKey) {
      const listenerMap = {
        completedSessions: onCompletedSessions,
        painEntries: onPainEntries,
        assignments: onAssignments,
        foodEntries: onFoodEntries,
        waterEntries: onWaterEntries,
        bodyMetrics: onBodyMetrics,
        healthReports: onHealthReports,
      };
      const listener = listenerMap[firestoreKey];
      if (listener) {
        // Hydrate instantly from the cached snapshot so navigating back doesn't
        // flash an empty state (e.g. "no exercises allocated") while Firestore
        // reconnects. The listener then overwrites with fresh data.
        const cached = load(scopedKey, null);
        if (cached != null) setState(cached);
        const unsub = listener(activePatientId, (docs) => {
          setState(docs);
          setLoaded(true);
          save(scopedKey, docs); // keep the cache warm for the next mount
        });
        return unsub;
      }
    }

    // Fallback to localStorage for keys without Firestore mapping
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

  return [state, update, loaded];
}
