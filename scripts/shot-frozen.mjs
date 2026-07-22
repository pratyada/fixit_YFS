import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.on('console', (m) => { const t = m.text(); if (/BONES|POSE|ERR/.test(t)) console.log('PAGE:', t); });
page.on('pageerror', (e) => console.log('PAGEERR:', e.message));
await page.setViewport({ width: 900, height: 640, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:5199/guidetest.html', { waitUntil: 'networkidle0', timeout: 30000 });

// switch to Version 2 (realistic mannequin) unless V1 requested
if (!process.env.V1) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Version 2/.test(x.textContent));
    if (b) b.click();
  });
}
await new Promise((r) => setTimeout(r, 2500));

// freeze at a given rep progress s (1 = bottom of squat)
const S = parseFloat(process.env.S ?? '1');
await page.evaluate((s) => { window.__S = s; }, S);
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: process.env.OUT || '/tmp/frozen.png' });
await browser.close();
console.log('done S=' + S + ' -> ' + (process.env.OUT || '/tmp/frozen.png'));
