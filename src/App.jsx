import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, Dumbbell, Heart, Camera, LogOut, BarChart3 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
import RecordSession from './pages/RecordSession';

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;
  if (!user) return <Login />;
  return <MobileLayout />;
}

const TABS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/exercises', icon: Dumbbell, label: 'Exercises' },
  { to: '/pose', icon: Camera, label: 'Pose' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/pain', icon: Heart, label: 'Pain' },
];

function MobileLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide tabs on detail/sub-pages
  const showTabs = !(/\/(exercises|programs)\//.test(location.pathname)
    || ['/measures', '/reports', '/builder', '/plan'].includes(location.pathname));

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
              FIXIT
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
              {session?.name || 'Patient'}
            </div>
            <div style={{ fontSize: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>
              {session?.condition || 'Patient'}
            </div>
          </div>
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

function SplashScreen() {
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
        FIXIT
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
