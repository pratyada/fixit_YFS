import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Heart, Camera, LogOut, BarChart3, Users, Shield, Stethoscope, BookOpen, ArrowRightLeft, Settings as SettingsIcon, Compass, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClinicProvider, useClinic } from './contexts/ClinicContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import LanguageSwitcher from './components/LanguageSwitcher';
import ConsentBanner from './components/ConsentBanner';

import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import ExerciseDetail from './pages/ExerciseDetail';
import PoseChecker from './pages/PoseChecker';
import Progress from './pages/Progress';
import Reports from './pages/Reports';
import MyPlan from './pages/MyPlan';
import PainJournal from './pages/PainJournal';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import ProgramBuilder from './pages/ProgramBuilder';
import OutcomeMeasures from './pages/OutcomeMeasures';
import RecordSession from './pages/RecordSession';
import AdminDashboard from './pages/AdminDashboard';
import PractitionerDashboard from './pages/PractitionerDashboard';
import ClinicKiosk from './pages/ClinicKiosk';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import Health from './pages/Health';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import FeatureGate from './components/FeatureGate';

export default function App() {
  return (
    <ClinicProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AppShell />
        </SubscriptionProvider>
      </AuthProvider>
    </ClinicProvider>
  );
}

function AppShell() {
  const { user, loading, needsRolePick, needsOnboarding } = useAuth();
  const location = useLocation();

  // Guides — always accessible, logged in or not, no auth wait
  const isGuidesPage = location.pathname === '/guides' || location.pathname.startsWith('/guides/');
  if (isGuidesPage) {
    // Extract slug from path: /guides/some-slug → some-slug
    const guideSlug = location.pathname.startsWith('/guides/') ? location.pathname.replace('/guides/', '') : null;
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <img src="/favicon.ico" alt="FIXIT" style={{ width: '28px', height: '28px', borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
            <span style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.1rem', color: 'var(--color-secondary)' }}>FIXIT</span>
          </Link>
          {user ? (
            <Link to="/" style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--color-secondary)', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
              Dashboard
            </Link>
          ) : (
            <Link to="/login" style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--color-secondary)', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
              Sign In
            </Link>
          )}
        </div>
        {guideSlug ? <GuideDetail /> : <Guides />}
        <ConsentBanner />
      </div>
    );
  }

  // Public pages — no auth wait
  if (!user && location.pathname === '/privacy') {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 24px' }}>
        <PrivacyPolicy />
        <ConsentBanner />
      </div>
    );
  }

  // Show splash while auth loads
  if (loading) return <SplashScreen />;

  // Pre-auth: landing page or login
  if (!user) {
    if (location.pathname === '/login') return <><Login /><ConsentBanner /></>;
    return <><Landing /><ConsentBanner /></>;
  }
  if (needsRolePick) return <RolePickerScreen />;
  if (needsOnboarding) return <Onboarding />;
  return <><AppLayout /><ConsentBanner /></>;
}

// ─── Tab configs per role ───
const PATIENT_TABS = [
  { to: '/', icon: Home, labelKey: 'nav:tabs.home' },
  { to: '/health', icon: HeartPulse, labelKey: 'nav:tabs.health' },
  { to: '/exercises', icon: Dumbbell, labelKey: 'nav:tabs.exercises' },
  { to: '/progress', icon: BarChart3, labelKey: 'nav:tabs.progress' },
  { to: '/guides', icon: Compass, labelKey: 'nav:tabs.guides' },
];

const PRACTITIONER_TABS = [
  { to: '/', icon: Users, labelKey: 'nav:tabs.patients' },
  { to: '/exercises', icon: BookOpen, labelKey: 'nav:tabs.library' },
];

const ADMIN_TABS = [
  { to: '/', icon: Shield, labelKey: 'nav:tabs.admin' },
  { to: '/exercises', icon: BookOpen, labelKey: 'nav:tabs.library' },
  { to: '/kiosk', icon: Camera, labelKey: 'nav:tabs.kiosk' },
];

const ROLE_META = {
  admin: { icon: Shield, color: '#5E35B1', bg: '#EDE7F6', labelKey: 'nav:roles.admin.label', descKey: 'nav:roles.admin.desc' },
  practitioner: { icon: Stethoscope, color: '#2E7D32', bg: '#E8F5E9', labelKey: 'nav:roles.practitioner.label', descKey: 'nav:roles.practitioner.desc' },
  patient: { icon: Home, color: '#1565C0', bg: '#E3F2FD', labelKey: 'nav:roles.patient.label', descKey: 'nav:roles.patient.desc' },
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function AppLayout() {
  const { t } = useTranslation('nav');
  const clinic = useClinic();
  const { session, logout, role, isAdmin, isPractitioner, hasMultipleRoles, switchRole, allRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();

  const TABS = isAdmin ? ADMIN_TABS : isPractitioner ? PRACTITIONER_TABS : PATIENT_TABS;

  const getRoleLabel = (r) => clinic.roleLabels?.[r] || t(`roles.${r}.label`);
  const roleLabel = getRoleLabel(role);
  const roleMeta = ROLE_META[role] || ROLE_META.patient;

  const showTabs = !(/\/(exercises|programs)\//.test(location.pathname)
    || ['/measures', '/reports', '/builder', '/plan', '/kiosk'].includes(location.pathname));

  const cycleRole = () => {
    const idx = allRoles.indexOf(role);
    const next = allRoles[(idx + 1) % allRoles.length];
    switchRole(next);
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      background: 'var(--color-bg-alt)',
    }}>
      {/* ── Desktop Sidebar ── */}
      {isDesktop && (
        <aside style={{
          width: '220px',
          background: 'white',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          height: '100dvh',
          position: 'sticky',
          top: 0,
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '20px 18px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <img src={clinic.logo} alt={clinic.name}
              style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1rem', color: 'var(--color-secondary)', letterSpacing: '-0.3px' }}>
                {clinic.productName || t('auth:brandName')}
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: roleMeta.color, marginTop: '2px' }}>
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {TABS.map(({ to, icon: Icon, labelKey }) => (
              <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '10px',
                    background: isActive ? 'var(--color-accent)' : 'transparent',
                    color: isActive ? 'white' : 'var(--color-text)',
                    transition: 'all 0.15s',
                    fontSize: '0.85rem', fontWeight: isActive ? 600 : 500,
                  }}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                    {t(labelKey)}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
              {session?.name || 'User'}
            </div>
            {hasMultipleRoles && (
              <button onClick={cycleRole} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                color: roleMeta.color, display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <ArrowRightLeft size={10} /> Switch Role
              </button>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <LanguageSwitcher />
              <button onClick={() => navigate('/settings')} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SettingsIcon size={14} />
              </button>
              <button onClick={async () => { await logout(); navigate('/'); }} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* ── Mobile Top bar (hidden on desktop) ── */}
        {!isDesktop && (
          <header style={{
            background: 'white',
            borderBottom: '1px solid var(--color-border)',
            padding: 'env(safe-area-inset-top, 0px) 16px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '52px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={clinic.logo} alt={clinic.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              <div style={{ fontFamily: "'Tenor Sans', serif", fontSize: '0.92rem', color: 'var(--color-secondary)', letterSpacing: '-0.3px' }}>
                {clinic.productName || t('auth:brandName')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                  {session?.name || 'User'}
                </div>
                {hasMultipleRoles ? (
                  <button onClick={cycleRole} style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontSize: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                    color: roleMeta.color, display: 'flex', alignItems: 'center', gap: '3px',
                  }}>
                    {roleLabel}
                    <ArrowRightLeft size={8} style={{ opacity: 0.6 }} />
                  </button>
                ) : (
                  <div style={{ fontSize: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: roleMeta.color }}>
                    {roleLabel}
                  </div>
                )}
              </div>
              <LanguageSwitcher />
              <button onClick={() => navigate('/settings')} style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <SettingsIcon size={12} />
              </button>
              <button onClick={async () => { await logout(); navigate('/'); }} style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <LogOut size={12} />
              </button>
            </div>
          </header>
        )}

        {/* ── Main scrollable content ── */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: isDesktop ? '24px 32px 32px' : '16px 16px 100px',
          maxWidth: isDesktop ? '1100px' : undefined,
          WebkitOverflowScrolling: 'touch',
        }}>
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/exercises/:id" element={<ExerciseDetail />} />
                <Route path="/exercises/:exerciseId/record" element={<RecordSession />} />
                <Route path="/pose" element={<PoseChecker />} />
                <Route path="/kiosk" element={<ClinicKiosk />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : isPractitioner ? (
              <>
                <Route path="/" element={<PractitionerDashboard />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/exercises/:id" element={<ExerciseDetail />} />
                <Route path="/exercises/:exerciseId/record" element={<RecordSession />} />
                <Route path="/pose" element={<PoseChecker />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/health" element={<Health />} />
                <Route path="/plan" element={<MyPlan />} />
                <Route path="/programs" element={<FeatureGate feature="programs"><Programs /></FeatureGate>} />
                <Route path="/programs/:id" element={<FeatureGate feature="programs"><ProgramDetail /></FeatureGate>} />
                <Route path="/builder" element={<FeatureGate feature="programs"><ProgramBuilder /></FeatureGate>} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/exercises/:id" element={<ExerciseDetail />} />
                <Route path="/exercises/:exerciseId/record" element={<FeatureGate feature="videoRecording"><RecordSession /></FeatureGate>} />
                <Route path="/pose" element={<FeatureGate feature="poseChecker"><PoseChecker /></FeatureGate>} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/measures" element={<FeatureGate feature="outcomeMeasures"><OutcomeMeasures /></FeatureGate>} />
                <Route path="/pain" element={<PainJournal />} />
                <Route path="/reports" element={<FeatureGate feature="reports"><Reports /></FeatureGate>} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/:slug" element={<GuideDetail />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar (hidden on desktop) ── */}
      {!isDesktop && showTabs && (
        <nav style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'white',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          zIndex: 50,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
        }}>
          {TABS.map(({ to, icon: Icon, labelKey }) => (
            <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none', flex: 1 }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '10px 4px 6px', gap: '3px',
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: '36px', height: '28px', borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'var(--color-accent)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    <Icon size={18} color={isActive ? 'white' : 'var(--color-text)'} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                    letterSpacing: '0.3px',
                  }}>
                    {t(labelKey)}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

// ─── Role Picker Screen (shown after login for multi-role users) ───
function RolePickerScreen() {
  const { t } = useTranslation('nav');
  const clinic = useClinic();
  const { session, allRoles, pickRole, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', padding: '24px',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '36px 28px',
        maxWidth: '440px', width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <img
          src={clinic.logo}
          alt={clinic.name}
          style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '12px' }}
        />
        <div style={{
          fontFamily: "'Tenor Sans', serif", fontSize: '1.3rem',
          color: 'var(--color-secondary)', marginBottom: '4px',
        }}>
          {clinic.productName || t('auth:brandName')}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '6px' }}>
          {t('rolePicker.welcome', { name: session?.name || 'User' })}
        </div>
        <div style={{
          fontSize: '0.75rem', color: 'var(--color-text)', marginBottom: '24px',
        }}>
          {t('rolePicker.howToContinue')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {allRoles.map(r => {
            const meta = ROLE_META[r] || ROLE_META.patient;
            const Icon = meta.icon;
            return (
              <button
                key={r}
                onClick={() => pickRole(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 18px', borderRadius: '14px',
                  background: meta.bg, border: `2px solid transparent`,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'white', color: meta.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: meta.color }}>
                    {clinic.roleLabels?.[r] || t(meta.labelKey)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginTop: '2px' }}>
                    {clinic.roleDescriptions?.[r] || t(meta.descKey)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={logout}
          style={{
            marginTop: '20px', background: 'none', border: 'none',
            color: 'var(--color-text)', fontSize: '0.72rem', fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            margin: '20px auto 0',
          }}
        >
          <LogOut size={12} /> {t('rolePicker.signOut')}
        </button>
      </div>
    </div>
  );
}

function SplashScreen() {
  const { t } = useTranslation('auth');
  const clinic = useClinic();
  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <img
        src={clinic.logo}
        alt={clinic.name}
        style={{ width: '64px', height: '64px', borderRadius: '50%' }}
      />
      <div style={{
        fontFamily: "'Tenor Sans', serif", fontSize: '1.5rem',
        color: 'white', letterSpacing: '-0.5px',
      }}>
        {t('brandName')}
      </div>
      <div style={{
        width: '32px', height: '3px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.3)', overflow: 'hidden',
      }}>
        <div style={{
          width: '50%', height: '100%', background: 'white', borderRadius: '2px',
          animation: 'loading 1s ease-in-out infinite alternate',
        }} />
      </div>
      <style>{`
        @keyframes loading {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
