import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.jsx'
import { RouteSeo } from './components/Seo.jsx'

// Tiny top-level boundary (inlined so it adds nothing to the entry chunk). Any
// render crash in the shell/providers shows a recovery screen instead of a blank
// white page, with a one-tap reload.
class TopBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err, info) { console.error('[FIXIT] Top-level crash:', err, info?.componentStack) }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: '1.3rem', color: '#4E4E53', fontWeight: 700 }}>Something hiccuped</div>
        <p style={{ fontSize: '0.9rem', color: '#6b746f', maxWidth: '320px', margin: 0 }}>The app ran into an error loading this screen. A quick reload usually fixes it.</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#708E86', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Reload</button>
      </div>
    )
  }
}

// Auto-recover from a failed lazy-chunk load (flaky network, ad-blocker, or a
// chunk that changed under a just-deployed build). Without this the app hangs
// on the splash and only a manual refresh fixes it. Reload at most once per
// 10s so a genuinely broken build can't loop. A fresh index.html (served
// no-store) then points at the current chunk hashes.
const recoverFromChunkError = (e) => {
  const msg = String(e?.message || e?.reason?.message || '');
  const isChunk = e?.type === 'vite:preloadError'
    || /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|ChunkLoadError|error loading dynamically imported/i.test(msg);
  if (!isChunk) return;
  const last = Number(sessionStorage.getItem('chunkReloadAt')) || 0;
  if (Date.now() - last > 10000) {
    sessionStorage.setItem('chunkReloadAt', String(Date.now()));
    e.preventDefault?.();
    window.location.reload();
  }
};
window.addEventListener('vite:preloadError', recoverFromChunkError);
window.addEventListener('unhandledrejection', recoverFromChunkError);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <RouteSeo />
      <TopBoundary>
        <App />
      </TopBoundary>
    </BrowserRouter>
  </StrictMode>,
)
