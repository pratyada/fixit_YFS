import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPatients } from '../data/users';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const patients = getPatients();

  const handleLogin = (userId, name) => {
    login(userId, name);
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
            Rehab & Recovery
          </div>
        </div>

        <h3 style={{ textAlign: 'center', marginBottom: '6px' }}>Welcome Back</h3>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '24px' }}>
          Select your account to continue
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflow: 'auto' }}>
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => handleLogin(p.id, p.name)}
              style={{
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
                {p.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>{p.condition} &bull; Age {p.age}</div>
              </div>
              <ArrowRight size={14} color="var(--color-accent)" />
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.65rem', marginTop: '24px', color: 'var(--color-text)' }}>
          Demo accounts for testing — no password required
        </p>
      </div>
    </div>
  );
}
