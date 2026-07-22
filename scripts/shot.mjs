import puppeteer from 'puppeteer';

const URL = 'http://127.0.0.1:5199/guidetest.html';
const out = process.argv[2] || '/tmp/guide-shot';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 620, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('PAGE:', m.text()));
page.on('pageerror', (e) => console.log('PAGEERR:', e.message));
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

if (process.env.V2) {
  // click "Version 2 · Realistic"
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Version 2/.test(x.textContent));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 2500));
}

// capture the squat across the rep: standing(~0), bottom(~1.7s), mid(~2.6s)
const stamps = [200, 1700, 2600];
for (let i = 0; i < stamps.length; i++) {
  await new Promise((r) => setTimeout(r, i === 0 ? stamps[0] : stamps[i] - stamps[i - 1]));
  await page.screenshot({ path: `${out}-${i}.png` });
  console.log('shot', i, '->', `${out}-${i}.png`);
}
await browser.close();
console.log('done');
