// Full-page screenshot with Puppeteer
// Usage: node screenshot.mjs <url> [label] [--firefox] [--mobile]
// Saves to ./temporary screenshots/screenshot-N[-label].png (auto-incremented, never overwritten)
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [url, label] = args.filter((a) => !a.startsWith('--'));

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label] [--firefox] [--mobile]');
  process.exit(1);
}

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'temporary screenshots');
fs.mkdirSync(outDir, { recursive: true });

// Next number = highest existing screenshot-N + 1
const used = fs.readdirSync(outDir)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const n = used.length ? Math.max(...used) + 1 : 1;
const outFile = path.join(outDir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const viewport = flags.has('--mobile')
  ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { width: 1440, height: 900 };

const browser = await puppeteer.launch({ browser: flags.has('--firefox') ? 'firefox' : 'chrome' });
try {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outFile, fullPage: true });
  console.log(outFile);
} finally {
  await browser.close();
}
