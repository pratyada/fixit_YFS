// ─── Multi-Tenant Clinic Configuration ───
// Detects which clinic based on hostname and loads config from Firestore.

import { doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Default FIXIT branding (fallback when no clinic matches)
export const DEFAULT_CLINIC = {
  id: 'fixit',
  name: 'FIXIT',
  slug: 'fixit',
  domain: 'localhost',
  logo: 'https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png',
  favicon: 'https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png',
  colors: {
    primary: '#B0C4BB',
    secondary: '#4E4E53',
    accent: '#708E86',
  },
  tagline: 'AI-Powered Physio Rehab',
  byLine: 'Powered by FIXIT',
  contactEmail: 'info@fixit.ca',
  location: { city: 'Toronto', region: 'Ontario', country: 'CA' },
  analyticsId: '',
  adminEmails: ['musee.initialize@gmail.com'],
};

// Platform super admin (can manage all clinics)
export const SUPER_ADMIN_EMAIL = 'musee.initialize@gmail.com';

// Detect clinic slug from hostname
export function getClinicSlugFromHostname(hostname) {
  // fixit.yourformsux.com → yourformsux
  // fixit.fitfactory.com → fitfactory
  // localhost → check localStorage for dev override
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('fixit_dev_clinic') || null;
  }
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] === 'fixit') {
    return parts[1]; // fixit.CLINICNAME.com → CLINICNAME
  }
  if (parts.length >= 2 && parts[0] !== 'fixit') {
    // custom domain like app.fitfactory.com
    return null; // will query by domain
  }
  return null;
}

// Fetch clinic config from Firestore by slug
export async function getClinicBySlug(slug) {
  if (!slug) return null;
  const snap = await getDoc(doc(db, 'clinics', slug));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
}

// Fetch clinic config by domain
export async function getClinicByDomain(domain) {
  const snap = await getDocs(query(collection(db, 'clinics'), where('domain', '==', domain)));
  if (snap.docs.length > 0) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  return null;
}

// Resolve clinic from current hostname
export async function resolveClinic() {
  const hostname = window.location.hostname;

  // Try slug from hostname
  const slug = getClinicSlugFromHostname(hostname);
  if (slug) {
    const clinic = await getClinicBySlug(slug);
    if (clinic) return clinic;
  }

  // Try full domain match
  const fullDomain = `${hostname}${window.location.port ? ':' + window.location.port : ''}`;
  const byDomain = await getClinicByDomain(hostname) || await getClinicByDomain(fullDomain);
  if (byDomain) return byDomain;

  // Fallback to default
  return DEFAULT_CLINIC;
}

// Apply clinic theme to the page
export function applyClinicTheme(clinic) {
  if (!clinic) return;
  const root = document.documentElement;
  if (clinic.colors) {
    root.style.setProperty('--color-primary', clinic.colors.primary);
    root.style.setProperty('--color-secondary', clinic.colors.secondary);
    root.style.setProperty('--color-accent', clinic.colors.accent);
  }
  // Update page title
  document.title = `${clinic.name} — FIXIT`;
  // Update favicon
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon && clinic.favicon) favicon.href = clinic.favicon;
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleTouchIcon && clinic.logo) appleTouchIcon.href = clinic.logo;
}

// ─── Clinic CRUD (for super admin) ───

export async function getAllClinics() {
  const snap = await getDocs(collection(db, 'clinics'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createClinic(slug, data) {
  await setDoc(doc(db, 'clinics', slug), {
    ...data,
    slug,
    createdAt: serverTimestamp(),
  });
}

export async function updateClinic(slug, data) {
  await updateDoc(doc(db, 'clinics', slug), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
