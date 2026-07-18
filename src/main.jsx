import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.jsx'
import { RouteSeo } from './components/Seo.jsx'

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
      <App />
    </BrowserRouter>
  </StrictMode>,
)
