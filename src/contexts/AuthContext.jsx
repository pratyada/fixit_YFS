import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const googleProvider = new GoogleAuthProvider();
import { getUserProfile, setUserProfile, updateUserRole, updateUserRoles, deleteUserData } from '../lib/firestore';
import i18n from '../i18n';

// Emails that should automatically get admin + practitioner roles
const ADMIN_EMAILS = ['musee.initialize@gmail.com', 'ashimanaval@gmail.com'];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase Auth user
  const [profile, setProfile] = useState(null);  // Firestore user doc
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null); // which role is currently active
  const [needsRolePick, setNeedsRolePick] = useState(false); // show role picker?

  // Get the roles array for a profile (backward compat with single `role` field)
  const getUserRoles = (prof) => {
    if (prof?.roles && Array.isArray(prof.roles) && prof.roles.length > 0) return prof.roles;
    return [prof?.role || 'patient'];
  };

  useEffect(() => {
    // Handle redirect result (for incognito/popup-blocked browsers)
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let prof = await getUserProfile(firebaseUser.uid);
        const email = firebaseUser.email?.toLowerCase() || '';

        // New user — profile doesn't exist yet.
        // loginWithGoogle will create it, so wait briefly and retry.
        if (!prof) {
          await new Promise(r => setTimeout(r, 1500));
          prof = await getUserProfile(firebaseUser.uid);
        }

        // Still no profile — create a default one
        if (!prof) {
          const isAdminEmail = ADMIN_EMAILS.includes(email);
          const roles = isAdminEmail ? ['admin', 'practitioner'] : ['patient'];
          const profileData = {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || '',
            condition: '',
            role: roles[0],
            roles,
            createdAt: new Date().toISOString(),
          };
          await setUserProfile(firebaseUser.uid, profileData);
          prof = { id: firebaseUser.uid, ...profileData };
        }

        if (ADMIN_EMAILS.includes(email) && prof) {
          const currentRoles = getUserRoles(prof);
          const needed = ['admin', 'practitioner'];
          const missing = needed.filter(r => !currentRoles.includes(r));
          if (missing.length > 0) {
            const newRoles = [...new Set([...currentRoles, ...needed])];
            await updateUserRoles(firebaseUser.uid, newRoles);
            prof = { ...prof, roles: newRoles, role: newRoles[0] };
          }
        }

        setProfile(prof);

        // Restore user's language preference
        if (prof?.language && prof.language !== i18n.language) {
          i18n.changeLanguage(prof.language);
        }

        // If user has multiple roles, show the role picker
        const roles = getUserRoles(prof);
        if (roles.length > 1) {
          const lastRole = sessionStorage.getItem(`fixit_active_role_${firebaseUser.uid}`);
          if (lastRole && roles.includes(lastRole)) {
            setActiveRole(lastRole);
            setNeedsRolePick(false);
          } else {
            setNeedsRolePick(true);
          }
        } else {
          setActiveRole(roles[0]);
          setNeedsRolePick(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setActiveRole(null);
        setNeedsRolePick(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const pickRole = (r) => {
    setActiveRole(r);
    setNeedsRolePick(false);
    if (user) sessionStorage.setItem(`fixit_active_role_${user.uid}`, r);
  };

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
      roles: ['patient'],
      createdAt: new Date().toISOString(),
    };
    await setUserProfile(cred.user.uid, profileData);
    setProfile({ id: cred.user.uid, ...profileData });
    return cred.user;
  };

  const loginWithGoogle = async () => {
    let cred;
    try {
      cred = await signInWithPopup(auth, googleProvider);
    } catch (popupErr) {
      // Popup blocked or sessionStorage issue (incognito) — fallback to redirect
      if (popupErr.code === 'auth/popup-blocked' ||
          popupErr.code === 'auth/internal-error' ||
          popupErr.message?.includes('sessionStorage')) {
        await signInWithRedirect(auth, googleProvider);
        return; // redirect will reload the page
      }
      throw popupErr;
    }
    let prof = await getUserProfile(cred.user.uid);
    const email = cred.user.email?.toLowerCase() || '';
    const isAdminEmail = ADMIN_EMAILS.includes(email);

    if (!prof) {
      const roles = isAdminEmail ? ['admin', 'practitioner'] : ['patient'];
      const profileData = {
        name: cred.user.displayName || '',
        email: cred.user.email,
        photoURL: cred.user.photoURL || '',
        condition: '',
        role: roles[0],
        roles,
        createdAt: new Date().toISOString(),
      };
      await setUserProfile(cred.user.uid, profileData);
      prof = { id: cred.user.uid, ...profileData };
    } else if (isAdminEmail) {
      const currentRoles = getUserRoles(prof);
      const needed = ['admin', 'practitioner'];
      const missing = needed.filter(r => !currentRoles.includes(r));
      if (missing.length > 0) {
        const newRoles = [...new Set([...currentRoles, ...needed])];
        await updateUserRoles(cred.user.uid, newRoles);
        prof = { ...prof, roles: newRoles, role: newRoles[0] };
      }
    }

    setProfile(prof);
    return cred.user;
  };

  const logout = async () => {
    if (user) sessionStorage.removeItem(`fixit_active_role_${user.uid}`);
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setActiveRole(null);
    setNeedsRolePick(false);
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

  const allRoles = getUserRoles(profile);
  const role = activeRole || allRoles[0] || 'patient';
  const isAdmin = role === 'admin';
  const isPractitioner = role === 'practitioner';
  const isPatient = role === 'patient';
  const hasMultipleRoles = allRoles.length > 1;

  // Delete account (PIPEDA compliance)
  const deleteAccount = async () => {
    if (!user) return;
    await deleteUserData(user.uid);
    await user.delete();
    setUser(null);
    setProfile(null);
    setActiveRole(null);
  };

  // Switch role (for header toggle)
  const switchRole = (newRole) => {
    if (allRoles.includes(newRole)) {
      pickRole(newRole);
    }
  };

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
      allRoles,
      isAdmin,
      isPractitioner,
      isPatient,
      hasMultipleRoles,
      switchRole,
      deleteAccount,
      needsRolePick,
      pickRole,
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
