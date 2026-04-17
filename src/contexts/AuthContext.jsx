import { createContext, useContext, useState, useEffect } from 'react';
import { save, load } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => load('session', null));

  useEffect(() => {
    if (session) save('session', session);
  }, [session]);

  // session shape: { userId: string, name: string }

  const login = (userId, name) => {
    setSession({ userId, name });
  };

  const logout = () => {
    setSession(null);
    save('session', null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      login,
      logout,
      activePatientId: session?.userId,
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
