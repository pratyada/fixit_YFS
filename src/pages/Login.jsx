import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
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
        padding: '40px 24px', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="https://yourformsux.com/wp-content/uploads/2024/08/cropped-Untitled-design-14-150x150.png"
            alt="YFS"
            style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 14px' }}
          />
          <div style={{
            fontFamily: "'Tenor Sans', serif", fontSize: '1.6rem',
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

        {/* Tagline */}
        <p style={{
          textAlign: 'center', fontSize: '0.88rem',
          color: 'var(--color-text)', marginBottom: '28px', lineHeight: 1.5,
        }}>
          AI-powered exercise form analysis for your recovery journey
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: 'white', color: 'var(--color-secondary)',
            fontWeight: 600, fontSize: '0.88rem',
            border: '1.5px solid var(--color-border)',
            cursor: loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <div style={{
            background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '10px',
            padding: '10px 14px', fontSize: '0.8rem', color: '#C62828',
            marginTop: '14px', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <p style={{
          textAlign: 'center', fontSize: '0.65rem', marginTop: '24px',
          color: 'var(--color-text)', lineHeight: 1.5,
        }}>
          Sign in with your Google account to get started.
          <br />New users are automatically registered.
        </p>
      </div>
    </div>
  );
}
