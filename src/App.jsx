import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Heart, Camera, LogOut, BarChart3, Users, Shield, Stethoscope, BookOpen, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user, loading, needsRolePick } = useAuth();
  const location = useLocation();

  if (loading) return <SplashScreen />;

  // Privacy policy accessible without login
  if (location.pathname === '/privacy' && !user) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        <PrivacyPolicy />
        <ConsentBanner />
      </div>
    );
  }

  if (!user) return <><Login /><ConsentBanner /></>;
  if (needsRolePick) return <RolePickerScreen />;
  return <><MobileLayout /><ConsentBanner /></>;
}

// ─── Tab configs per role ───
const PATIENT_TABS = [
  { to: '/', icon: Home, labelKey: 'nav:tabs.home' },
  { to: '/exercises', icon: Dumbbell, labelKey: 'nav:tabs.exercises' },
  { to: '/pose', icon: Camera, labelKey: 'nav:tabs.pose' },
  { to: '/progress', icon: BarChart3, labelKey: 'nav:tabs.progress' },
  { to: '/pain', icon: Heart, labelKey: 'nav:tabs.pain' },
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

function MobileLayout() {
  const { t } = useTranslation('nav');
  const { session, logout, role, isAdmin, isPractitioner, hasMultipleRoles, switchRole, allRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const TABS = isAdmin ? ADMIN_TABS : isPractitioner ? PRACTITIONER_TABS : PATIENT_TABS;

  const roleLabel = isAdmin ? t('roles.admin.label') : isPractitioner ? t('roles.practitioner.label') : (session?.condition || t('roles.patient.label'));
  const roleMeta = ROLE_META[role] || ROLE_META.patient;

  // Hide tabs on detail/sub-pages
  const showTabs = !(/\/(exercises|programs)\//.test(location.pathname)
    || ['/measures', '/reports', '/builder', '/plan', '/kiosk'].includes(location.pathname));

  // Cycle to next role
  const cycleRole = () => {
    const idx = allRoles.indexOf(role);
    const next = allRoles[(idx + 1) % allRoles.length];
    switchRole(next);
    navigate('/');
  };

  const isWideLayout = isPractitioner || isAdmin;

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-alt)',
      maxWidth: isWideLayout ? '1200px' : '480px',
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0 0 40px rgba(0,0,0,0.06)',
    }}>
      {/* ── Top bar ── */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        padding: 'env(safe-area-inset-top, 0px) 16px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '52px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png"
            alt="YFS"
            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: "'Tenor Sans', serif", fontSize: '0.92rem', color: 'var(--color-secondary)', letterSpacing: '-0.3px' }}>
              {t('auth:brandName')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
              {session?.name || 'User'}
            </div>
            {hasMultipleRoles ? (
              <button
                onClick={cycleRole}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontSize: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                  color: roleMeta.color,
                  display: 'flex', alignItems: 'center', gap: '3px',
                }}
                title={t('header.switchRole', { roles: allRoles.join(' / ') })}
              >
                {roleLabel}
                <ArrowRightLeft size={8} style={{ opacity: 0.6 }} />
              </button>
            ) : (
              <div style={{
                fontSize: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                color: roleMeta.color,
              }}>
                {roleLabel}
              </div>
            )}
          </div>
          <LanguageSwitcher />
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

      {/* ── Main scrollable content ── */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px 16px 100px',
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
              <Route path="/plan" element={<MyPlan />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/builder" element={<ProgramBuilder />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/exercises/:id" element={<ExerciseDetail />} />
              <Route path="/exercises/:exerciseId/record" element={<RecordSession />} />
              <Route path="/pose" element={<PoseChecker />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/measures" element={<OutcomeMeasures />} />
              <Route path="/pain" element={<PainJournal />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </main>

      {/* ── Bottom Tab Bar ── */}
      {showTabs && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: isWideLayout ? '1200px' : '480px',
          background: 'white',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          zIndex: 50,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
        }}>
          {TABS.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={{ textDecoration: 'none', flex: 1 }}
            >
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
        maxWidth: '380px', width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <img
          src="https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png"
          alt="YFS"
          style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '12px' }}
        />
        <div style={{
          fontFamily: "'Tenor Sans', serif", fontSize: '1.3rem',
          color: 'var(--color-secondary)', marginBottom: '4px',
        }}>
          {t('auth:brandName')}
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
                    {t(meta.labelKey)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginTop: '2px' }}>
                    {t(meta.descKey)}
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
  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <img
        src="https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png"
        alt="YFS"
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
