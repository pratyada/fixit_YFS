import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, ArrowRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPractitioners, getPatients } from '../data/users';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('role'); // 'role' | 'practitioner' | 'patient'

  const practitioners = getPractitioners();
  const patients = getPatients();

  const handleLogin = (role, userId, name) => {
    login(role, userId, name);
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      paddingTop: 'env(safe-area-inset-top, 20px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px',
        padding: '32px 22px', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png"
            alt="YFS"
            style={{ width: '54px', height: '54px', borderRadius: '50%', margin: '0 auto 12px' }}
          />
          <div style={{
            fontFamily: "'Tenor Sans', serif",
            fontSize: '1.4rem',
            color: 'var(--color-secondary)',
            letterSpacing: '-0.5px',
          }}>
            Your Form Sux
          </div>
          <div style={{
            fontSize: '0.6rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '2px',
            color: 'var(--color-accent)', marginTop: '4px',
          }}>
            Rehab & Recovery Platform
          </div>
        </div>

        {step === 'role' && (
          <>
            <h3 style={{ textAlign: 'center', marginBottom: '6px' }}>Welcome Back</h3>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '24px' }}>
              Choose how you'd like to sign in
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <RoleCard
                icon={<Stethoscope size={24} />}
                title="I'm a Practitioner"
                desc="Manage patients, assign exercises, track progress"
                color="#708E86"
                bg="#EDF3F1"
                onClick={() => setStep('practitioner')}
              />
              <RoleCard
                icon={<User size={24} />}
                title="I'm a Patient"
                desc="Access my exercises, log pain, track recovery"
                color="#8B7355"
                bg="#F5F0EB"
                onClick={() => setStep('patient')}
              />
            </div>
          </>
        )}

        {step === 'practitioner' && (
          <>
            <BackButton onClick={() => setStep('role')} />
            <h3 style={{ textAlign: 'center', marginBottom: '6px' }}>Practitioner Sign-in</h3>
            <p style={{ textAlign: 'center', fontSize: '0.82rem', marginBottom: '20px' }}>
              Select your account
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {practitioners.map(p => (
                <UserRow
                  key={p.id}
                  icon="👩‍⚕️"
                  name={p.name}
                  sub={p.title + ' • ' + p.clinic}
                  onClick={() => handleLogin('practitioner', p.id, p.name)}
                />
              ))}
            </div>
          </>
        )}

        {step === 'patient' && (
          <>
            <BackButton onClick={() => setStep('role')} />
            <h3 style={{ textAlign: 'center', marginBottom: '6px' }}>Patient Sign-in</h3>
            <p style={{ textAlign: 'center', fontSize: '0.82rem', marginBottom: '20px' }}>
              Select your account
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflow: 'auto' }}>
              {patients.map(p => (
                <UserRow
                  key={p.id}
                  icon={p.avatar}
                  name={p.name}
                  sub={`${p.condition} • Age ${p.age}`}
                  onClick={() => handleLogin('patient', p.id, p.name)}
                />
              ))}
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.65rem', marginTop: '24px', color: 'var(--color-text)' }}>
          Demo accounts for testing — no password required
        </p>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '18px', borderRadius: '14px',
      background: bg, border: '1px solid transparent',
      cursor: 'pointer', textAlign: 'left',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'white', color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '2px' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text)' }}>
          {desc}
        </div>
      </div>
      <ArrowRight size={16} color={color} />
    </button>
  );
}

function UserRow({ icon, name, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '12px',
      background: 'var(--color-bg-alt)', border: '1px solid transparent',
      cursor: 'pointer', textAlign: 'left', width: '100%',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.borderColor = 'var(--color-accent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--color-bg-alt)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>{sub}</div>
      </div>
      <ArrowRight size={14} color="var(--color-accent)" />
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--color-accent)', fontSize: '0.78rem', fontWeight: 500,
      marginBottom: '14px',
    }}>
      <ChevronLeft size={14} /> Back
    </button>
  );
}
