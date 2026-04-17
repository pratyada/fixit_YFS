import { useState, useCallback } from 'react';
import { save, load } from '../utils/storage';

export function useLocalState(key, initialValue) {
  const [state, setState] = useState(() => load(key, initialValue));

  const update = useCallback((valueOrFn) => {
    setState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      save(key, next);
      return next;
    });
  }, [key]);

  return [state, update];
}
