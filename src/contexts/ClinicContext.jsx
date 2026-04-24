import { createContext, useContext, useState, useEffect } from 'react';
import { resolveClinic, applyClinicTheme, DEFAULT_CLINIC } from '../lib/clinicConfig';

const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resolveClinic()
      .then(c => {
        setClinic(c);
        applyClinicTheme(c);
        setLoading(false);
      })
      .catch(() => {
        setClinic(DEFAULT_CLINIC);
        applyClinicTheme(DEFAULT_CLINIC);
        setLoading(false);
      });
  }, []);

  if (loading) return null; // App shows splash screen during auth loading anyway

  return (
    <ClinicContext.Provider value={clinic}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  return ctx || DEFAULT_CLINIC;
}
