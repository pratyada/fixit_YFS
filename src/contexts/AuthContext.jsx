import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const googleProvider = new GoogleAuthProvider();
import { getUserProfile, setUserProfile, updateUserRole } from '../lib/firestore';

// Emails that should automatically be set as admin on first login
const ADMIN_EMAILS = ['museinitialize@gmail.com'];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase Auth user
  const [profile, setProfile] = useState(null);  // Firestore user doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let prof = await getUserProfile(firebaseUser.uid);
        // Auto-fix admin role if needed
        const email = firebaseUser.email?.toLowerCase() || '';
        if (ADMIN_EMAILS.includes(email) && prof && prof.role !== 'admin') {
          await updateUserRole(firebaseUser.uid, 'admin');
          prof = { ...prof, role: 'admin' };
        }
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const prof = await getUserProfile(cred.user.uid);
    setProfile(prof);
    return cred.user;
  };

  const signup = async (email, password, name, condition) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profileData = {
      name,
      email,
      condition: condition || '',
      role: 'patient',
      createdAt: new Date().toISOString(),
    };
    await setUserProfile(cred.user.uid, profileData);
    setProfile({ id: cred.user.uid, ...profileData });
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    let prof = await getUserProfile(cred.user.uid);
    const email = cred.user.email?.toLowerCase() || '';
    const isAdminEmail = ADMIN_EMAILS.includes(email);

    if (!prof) {
      // First-time login — create profile
      const profileData = {
        name: cred.user.displayName || '',
        email: cred.user.email,
        photoURL: cred.user.photoURL || '',
        condition: '',
        role: isAdminEmail ? 'admin' : 'patient',
        createdAt: new Date().toISOString(),
      };
      await setUserProfile(cred.user.uid, profileData);
      prof = { id: cred.user.uid, ...profileData };
    } else if (isAdminEmail && prof.role !== 'admin') {
      // Existing user who should be admin — fix their role
      await updateUserRole(cred.user.uid, 'admin');
      prof = { ...prof, role: 'admin' };
    }

    setProfile(prof);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
    }
  };

  // Build a session-like object for backward compatibility
  const session = user ? {
    userId: user.uid,
    name: profile?.name || user.displayName || user.email,
    email: user.email,
    condition: profile?.condition || '',
    ...profile,
  } : null;

  const role = profile?.role || 'patient';
  const isAdmin = role === 'admin';
  const isPractitioner = role === 'practitioner';
  const isPatient = role === 'patient';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      login,
      signup,
      loginWithGoogle,
      logout,
      refreshProfile,
      role,
      isAdmin,
      isPractitioner,
      isPatient,
      activePatientId: isPatient ? user?.uid : null,
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
