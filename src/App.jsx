import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Dumbbell, Heart, Camera, Menu, X, LogOut, Users, BookOpen, Eye, ArrowLeft } from 'lucide-react';
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
  useEffect(() => {
    seedDemoData();
  }, []);

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { session } = useAuth();
  if (!session) return <Login />;
  return <Layout />;
}

const PATIENT_NAV = [
  { to: '/', icon: Home, label: 'My Plan' },
  { to: '/exercises', icon: Dumbbell, label: 'Library' },
  { to: '/pose', icon: Camera, label: 'Pose' },
  { to: '/pain', icon: Heart, label: 'Pain' },
];

const PRACTITIONER_NAV = [
  { to: '/', icon: Users, label: 'Patients' },
  { to: '/exercises', icon: BookOpen, label: 'Library' },
];

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, logout, isPractitioner, stopViewingPatient } = useAuth();
  const navigate = useNavigate();

  // If practitioner is impersonating a patient, show patient-style nav
  const isImpersonating = isPractitioner && session.viewingPatientId;
  const NAV = isPractitioner && !isImpersonating ? PRACTITIONER_NAV : PATIENT_NAV;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStopImpersonating = () => {
    stopViewingPatient();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-alt)' }}>
      {/* Impersonation banner */}
      {isImpersonating && (
        <div style={{
          background: '#FFF3E0', borderBottom: '1px solid #FFCC80',
          padding: '8px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#E65100' }}>
            <Eye size={14} /> Viewing as <strong>{session.viewingPatientName}</strong>
          </div>
          <button onClick={handleStopImpersonating} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: '#E65100', color: 'white', border: 'none',
            padding: '6px 12px', borderRadius: '50px',
            fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
            cursor: 'pointer',
          }}>
            <ArrowLeft size={11} /> Back to Caseload
          </button>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255,255,255,0.92)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 20px',
          height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png"
              alt="YFS"
              style={{ width: '34px', height: '34px', borderRadius: '50%' }}
            />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.05rem', color: 'var(--color-secondary)', letterSpacing: '-0.5px' }}>
                Your Form Sux
              </div>
              <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.8px', color: 'var(--color-accent)' }}>
                {isPractitioner && !isImpersonating ? 'Practitioner Portal' : 'Rehab & Recovery'}
              </div>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hidden md:flex">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px',
                    fontSize: '0.72rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                    background: isActive ? 'var(--color-bg-alt)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}>
                    <Icon size={15} /> {label}
                  </div>
                )}
              </NavLink>
            ))}

            {/* User menu */}
            <div style={{
              marginLeft: '8px', paddingLeft: '12px',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)', lineHeight: 1.1 }}>
                  {session.name}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>
                  {session.role}
                </div>
              </div>
              <button onClick={handleLogout} title="Sign out" style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogOut size={13} />
              </button>
            </div>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden"
            style={{
              background: 'none', border: 'none',
              padding: '8px', color: 'var(--color-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <nav style={{
            borderTop: '1px solid var(--color-border)',
            background: 'white', padding: '8px',
            display: 'flex', flexDirection: 'column', gap: '2px',
          }} className="md:hidden">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', borderRadius: '10px',
                    fontSize: '0.88rem', fontWeight: 500,
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                    background: isActive ? 'var(--color-bg-alt)' : 'transparent',
                  }}>
                    <Icon size={17} /> {label}
                  </div>
                )}
              </NavLink>
            ))}
            <div style={{
              marginTop: '6px', paddingTop: '8px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{session.name}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-accent)' }}>{session.role}</div>
              </div>
              <button onClick={handleLogout} style={{
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                padding: '8px 12px', borderRadius: '50px', cursor: 'pointer',
                fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <LogOut size={12} /> Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main */}
      <main style={{
        flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px 20px',
      }}>
        <Routes>
          {isPractitioner && !isImpersonating ? (
            <>
              {/* Practitioner-only routes */}
              <Route path="/" element={<PractitionerDashboard />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/exercises/:id" element={<ExerciseDetail />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              {/* Patient routes (and practitioner impersonating) */}
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

      {/* Footer */}
      <footer style={{
        background: 'var(--color-footer)', color: 'rgba(255,255,255,0.6)',
        textAlign: 'center', padding: '20px 20px',
        fontSize: '0.78rem', marginTop: 'auto',
      }}>
        <div style={{ fontFamily: "'Tenor Sans', serif", color: 'white', fontSize: '0.92rem', marginBottom: '4px' }}>
          Your Form Sux
        </div>
        <div>Wellness Centre — Toronto</div>
      </footer>
    </div>
  );
}
