import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [condition, setCondition] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const CONDITIONS = [
    'ACL Reconstruction', 'Meniscus Repair', 'Patellofemoral Pain',
    'Frozen Shoulder', 'Rotator Cuff Repair', 'Low Back Pain',
    'Disc Herniation', 'Sciatica', 'Hip Replacement',
    'Ankle Sprain', 'Achilles Tendinopathy', 'Plantar Fasciitis',
    'Neck Pain', 'Tennis Elbow', 'Carpal Tunnel',
    'General Conditioning',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
        await signup(email, password, name.trim(), condition);
      }
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email'
        : err.code === 'auth/wrong-password' ? 'Incorrect password'
        : err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use' ? 'An account with this email already exists'
        : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email address'
        : err.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png"
            alt="YFS"
            style={{ width: '54px', height: '54px', borderRadius: '50%', margin: '0 auto 12px' }}
          />
          <div style={{
            fontFamily: "'Tenor Sans', serif", fontSize: '1.4rem',
            color: 'var(--color-secondary)', letterSpacing: '-0.5px',
          }}>
            FIXIT
          </div>
          <div style={{
            fontSize: '0.6rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '2px',
            color: 'var(--color-accent)', marginTop: '4px',
          }}>
            by Your Form Sux
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', marginBottom: '24px',
          background: 'var(--color-bg-alt)', borderRadius: '12px', padding: '3px',
        }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                background: mode === m ? 'white' : 'transparent',
                border: 'none', fontWeight: 600, fontSize: '0.82rem',
                color: mode === m ? 'var(--color-secondary)' : 'var(--color-text)',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <InputField
              icon={<User size={16} />}
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}

          <InputField
            icon={<Mail size={16} />}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div style={{ position: 'relative' }}>
            <InputField
              icon={<Lock size={16} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--color-text)', padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'signup' && (
            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text)',
              }} />
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                style={{ paddingLeft: '40px' }}
              >
                <option value="">Select your condition (optional)</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {error && (
            <div style={{
              background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '10px',
              padding: '10px 14px', fontSize: '0.8rem', color: '#C62828',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              background: loading ? '#aaa' : 'var(--color-secondary)',
              color: 'white', fontWeight: 600, fontSize: '0.78rem',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              border: 'none', cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: '0.7rem', marginTop: '20px', color: 'var(--color-text)',
        }}>
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none', color: 'var(--color-accent)',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.7rem',
            }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

function InputField({ icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && (
        <div style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-text)',
        }}>
          {icon}
        </div>
      )}
      <input
        {...props}
        style={{
          paddingLeft: icon ? '40px' : '14px',
          ...props.style,
        }}
      />
    </div>
  );
}
