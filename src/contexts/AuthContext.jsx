import { createContext, useContext, useState, useEffect } from 'react';
import { save, load } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => load('session', null));

  useEffect(() => {
    if (session) save('session', session);
  }, [session]);

  // session shape:
  // { role: 'practitioner' | 'patient', userId: string, name: string }

  const login = (role, userId, name) => {
    setSession({ role, userId, name });
  };

  const logout = () => {
    setSession(null);
    save('session', null);
  };

  const switchPatient = (patientId, name) => {
    if (session?.role === 'practitioner') {
      // Practitioners can view a patient
      setSession({ ...session, viewingPatientId: patientId, viewingPatientName: name });
    }
  };

  const stopViewingPatient = () => {
    if (session?.role === 'practitioner') {
      const { viewingPatientId, viewingPatientName, ...rest } = session;
      setSession(rest);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      login,
      logout,
      switchPatient,
      stopViewingPatient,
      isPractitioner: session?.role === 'practitioner',
      isPatient: session?.role === 'patient',
      // The "active patient" is either the logged-in patient,
      // or the patient the practitioner is currently viewing
      activePatientId: session?.role === 'patient' ? session.userId : session?.viewingPatientId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
