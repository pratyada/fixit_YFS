// Post-build static prerender.
//
// Runs the REAL built bundle in headless Chrome, waits for React to render +
// the per-route <head> to settle (window.__SEO_READY__), then snapshots the DOM
// to dist/<route>/index.html. Because it uses a real browser, no SSR-safety
// refactor of the Firebase/auth-heavy app is needed.
//
// Fail-soft: if puppeteer/Chromium is unavailable, we log and exit 0 so the
// deploy still ships (falling back to runtime dynamic meta, which already fixes
// the canonical bug for Googlebot).

import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname } from 'node:path';
import { SITEMAP_ROUTES } from '../src/seo/routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const PORT = 41729;
const NAV_TIMEOUT = 20000;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml',
  '.wasm': 'application/wasm', '.map': 'application/json',
};

// Static file server with SPA fallback to index.html (so client routing resolves).
function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = join(DIST, urlPath);
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        createReadStream(filePath).pipe(res);
        return;
      }
      // SPA fallback — always serve the built template so React can route.
      filePath = join(DIST, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      createReadStream(filePath).pipe(res);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
  return new Promise((res) => server.listen(PORT, () => res(server)));
}

async function loadPuppeteer() {
  try {
    const mod = await import('puppeteer');
    return mod.default || mod;
  } catch {
    return null;
  }
}

// Resolve a Chrome binary: env override → puppeteer's bundled browser (Vercel/CI)
// → a system Chrome (local dev, where the bundled download may be blocked).
function resolveExecutable(puppeteer) {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  try {
    const bundled = puppeteer.executablePath();
    if (bundled && existsSync(bundled)) return bundled;
  } catch { /* no bundled browser */ }
  const systemCandidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return systemCandidates.find((p) => existsSync(p)) || undefined;
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.warn('[prerender] dist/index.html missing — run vite build first. Skipping.');
    return;
  }

  const puppeteer = await loadPuppeteer();
  if (!puppeteer) {
    console.warn('[prerender] puppeteer not installed — skipping static prerender. ' +
      'Runtime dynamic meta still applies. `npm i -D puppeteer` to enable.');
    return;
  }

  const server = await startServer();
  let browser;
  let ok = 0;
  const failed = [];

  try {
    const executablePath = resolveExecutable(puppeteer);
    if (!executablePath) {
      console.warn('[prerender] no Chrome binary found (bundled download blocked & no system Chrome) — skipping.');
      server.close();
      return;
    }
    console.log(`[prerender] using Chrome: ${executablePath}`);
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    for (const route of SITEMAP_ROUTES) {
      const page = await browser.newPage();
      try {
        await page.goto(`http://localhost:${PORT}${route.path}`, {
          waitUntil: 'networkidle2',
          timeout: NAV_TIMEOUT,
        });
        // Wait until: SEO head applied, #root has content, and no loading
        // placeholder ([data-loading]) remains — so lazy chunks / auth splash
        // have resolved and we snapshot the real page, not a spinner.
        await page.waitForFunction(
          () => {
            const root = document.getElementById('root');
            return window.__SEO_READY__
              && root && root.children.length > 0
              && !root.querySelector('[data-loading]');
          },
          { timeout: NAV_TIMEOUT },
        );

        // Strip <link rel="modulepreload"> before snapshotting. During render,
        // Vite's runtime injects preload hints for chunks it *might* need
        // (e.g. the lazy authed-app graph), which would otherwise force public
        // pages to download Firebase. These are only fetch-early hints — the
        // entry <script> still imports exactly what each route needs — so
        // removing them keeps public/guide pages lean without breaking anything.
        const html = await page.evaluate(() => {
          document.querySelectorAll('link[rel="modulepreload"]').forEach((el) => el.remove());
          return '<!doctype html>\n' + document.documentElement.outerHTML;
        });
        const outDir = route.path === '/' ? DIST : join(DIST, route.path);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, 'index.html'), html, 'utf8');
        ok++;
        console.log(`[prerender] ✓ ${route.path}`);
      } catch (e) {
        failed.push(route.path);
        console.warn(`[prerender] ✗ ${route.path} — ${e.message}`);
      } finally {
        await page.close();
      }
    }
  } catch (e) {
    console.warn(`[prerender] browser launch failed — skipping. ${e.message}`);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log(`[prerender] done: ${ok} rendered, ${failed.length} failed${failed.length ? ' → ' + failed.join(', ') : ''}`);
}

main().catch((e) => {
  console.warn(`[prerender] unexpected error, continuing build: ${e.message}`);
});
