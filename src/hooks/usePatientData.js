import { useState, useCallback, useEffect } from 'react';
import { save, load } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

// Patient-scoped storage hook.
// Reads/writes data scoped to the active patient ID,
// so each patient has their own sessions, pain entries, etc.
export function usePatientData(key, initialValue) {
  const { activePatientId } = useAuth();
  const scopedKey = activePatientId ? `patient_${activePatientId}_${key}` : `anon_${key}`;

  const [state, setState] = useState(() => load(scopedKey, initialValue));

  // When patient changes, reload data
  useEffect(() => {
    setState(load(scopedKey, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePatientId]);

  const update = useCallback((valueOrFn) => {
    setState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      save(scopedKey, next);
      return next;
    });
  }, [scopedKey]);

  return [state, update];
}
