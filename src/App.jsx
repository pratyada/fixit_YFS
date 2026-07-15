import { lazy, Suspense } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ConsentBanner from './components/ConsentBanner';

// Eager, Firebase-free public pages (kept in the entry chunk so the prerender
// crawl renders them synchronously — no Suspense race).
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';

// The ENTIRE authenticated app — providers (Clinic/Auth/Subscription) and every
// app page — lives behind this lazy boundary. That keeps the Firebase SDK
// (~150 KB gzip) out of the entry chunk, so public/guide pages never download
// it. Only routes that actually need auth pull the chunk.
const AuthedApp = lazy(() => import('./AuthedApp'));

export default function App() {
  const { pathname } = useLocation();

  // Guides are always public and never authenticated → render provider-free.
  if (pathname === '/guides' || pathname.startsWith('/guides/')) {
    return <PublicShell pathname={pathname} />;
  }

  return (
    <Suspense fallback={<BootSplash />}>
      <AuthedApp />
    </Suspense>
  );
}

// Provider-free shell for public guide pages. Uses only static CSS-var theming
// (defaults live in index.css) and eager-imported page components — no Firebase.
function PublicShell({ pathname }) {
  const guideSlug = pathname.startsWith('/guides/') ? pathname.replace('/guides/', '') : null;
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/favicon.ico" alt="FIXIT" style={{ width: '28px', height: '28px', borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.1rem', color: 'var(--color-secondary)' }}>FIXIT</span>
        </Link>
        <Link to="/" style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--color-secondary)', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
          Open App
        </Link>
      </div>
      {guideSlug ? <GuideDetail /> : <Guides />}
      <ConsentBanner />
    </div>
  );
}

// Shown while the authenticated app chunk loads. Marked data-loading so the
// prerender crawler waits for real content instead of snapshotting this.
function BootSplash() {
  return (
    <div data-loading="1" style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'linear-gradient(135deg, #708E86 0%, #4E4E53 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: "'Tenor Sans', serif", fontSize: '1.5rem',
        color: 'white', letterSpacing: '-0.5px',
      }}>FIXIT</div>
    </div>
  );
}
