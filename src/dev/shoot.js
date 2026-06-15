// Headless screenshot tool: loads the dev page, seeks the audio to given
// timestamps, and saves a PNG of each. Lets us see the piece without recording.
// Usage: node src/dev/shoot.js [t1 t2 ...]   (seconds; defaults to key moments)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.SHOOT_URL || 'http://localhost:5173/?shoot=1';
const OUT = 'shots';
const args = process.argv.slice(2);
const times = (args.length ? args : ['5', '30', '58', '75', '150', '265', '300']).map(Number);

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()); });
page.on('pageerror', (e) => console.log('PAGE EXCEPTION:', e.message));

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => {
  const a = document.getElementById('track');
  return a && a.readyState >= 1 && a.duration > 0;
}, null, { timeout: 15000 }).catch(() => console.log('WARN: audio metadata not ready (duration unknown)'));

for (const t of times) {
  await page.evaluate((tt) => { document.getElementById('track').currentTime = tt; }, t);
  await page.waitForTimeout(300);
  const name = `${OUT}/t_${String(Math.round(t)).padStart(3, '0')}.png`;
  await page.screenshot({ path: name });
  console.log('shot', name);
}
await browser.close();
console.log('done');
