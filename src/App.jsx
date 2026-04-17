import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Dumbbell, Heart, Camera, LogOut, ChevronLeft, Eye, ArrowLeft, Users, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { seedDemoData } from './data/seed';

import Login from './pages/Login';
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
import PractitionerDashboard from './pages/PractitionerDashboard';
import PatientDetail from './pages/PatientDetail';

export default function App() {
  useEffect(() => { seedDemoData(); }, []);
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { session } = useAuth();
  if (!session) return <Login />;
  return <MobileLayout />;
}

// ─── Bottom tab items for patient ───
const PATIENT_TABS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/exercises', icon: Dumbbell, label: 'Exercises' },
  { to: '/pose', icon: Camera, label: 'Pose' },
  { to: '/pain', icon: Heart, label: 'Pain' },
];

// Practitioner still gets a simple top nav on desktop
const PRACT_TABS = [
  { to: '/', icon: Users, label: 'Patients' },
  { to: '/exercises', icon: BookOpen, label: 'Library' },
];

function MobileLayout() {
  const { session, logout, isPractitioner, stopViewingPatient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isImpersonating = isPractitioner && session.viewingPatientId;
  const isPatientMode = !isPractitioner || isImpersonating;
  const TABS = isPatientMode ? PATIENT_TABS : PRACT_TABS;

  // Check if current route is a detail/sub-page (hide tabs)
  const isSubPage = /\/(exercises|programs|patients)\//.test(location.pathname)
    || ['/pose', '/progress', '/measures', '/reports', '/builder'].includes(location.pathname);
  // For pose page, show tabs but it's a main page
  const showTabs = !(/\/(exercises|programs|patients)\//.test(location.pathname)
    || ['/progress', '/measures', '/reports', '/builder'].includes(location.pathname));

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-alt)',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0 0 40px rgba(0,0,0,0.06)',
    }}>
      {/* ── Impersonation banner ── */}
      {isImpersonating && (
        <div style={{
          background: '#FFF3E0', borderBottom: '1px solid #FFCC80',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 'env(safe-area-inset-top, 8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#E65100' }}>
            <Eye size={13} /> Viewing as <strong>{session.viewingPatientName}</strong>
          </div>
          <button onClick={() => { stopViewingPatient(); navigate('/'); }} style={{
            background: '#E65100', color: 'white', border: 'none',
            padding: '5px 10px', borderRadius: '50px',
            fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
          }}>
            <ArrowLeft size={10} style={{ marginRight: '3px', verticalAlign: '-1px' }} /> Back
          </button>
        </div>
      )}

      {/* ── Minimal top bar ── */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        padding: `${isImpersonating ? '0' : 'env(safe-area-inset-top, 0px)'} 16px 0`,
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
              Your Form Sux
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
              {session.name}
            </div>
            <div style={{ fontSize: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>
              {isPractitioner && !isImpersonating ? 'Practitioner' : 'Patient'}
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{
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
          {isPractitioner && !isImpersonating ? (
            <>
              <Route path="/" element={<PractitionerDashboard />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/exercises/:id" element={<ExerciseDetail />} />
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
              <Route path="/pose" element={<PoseChecker />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/measures" element={<OutcomeMeasures />} />
              <Route path="/pain" element={<PainJournal />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </main>

      {/* ── Bottom Tab Bar (mobile native feel) ── */}
      {showTabs && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          background: 'white',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          zIndex: 50,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
        }}>
          {TABS.map(({ to, icon: Icon, label }) => (
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
                    {label}
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
