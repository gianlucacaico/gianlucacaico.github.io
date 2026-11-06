#!/usr/bin/env node
// Before-and-after check: screenshots every view of two versions of the site
// at mobile and desktop, full page, and reports any pixel that differs.
// Use it to prove a behind-the-scenes change leaves the site looking identical.
//
// Usage (from the repo root):
//   node tools/compare.js                     main on GitHub vs your working copy
//   node tools/compare.js --base <git ref>    compare against another version
//   node tools/compare.js --after <folder>    compare against a built folder (e.g. _site)
//   node tools/compare.js blog home           only some views
//
// Difference images (changed pixels in red) go to tools/previews/compare/.
// Exits non-zero if anything differs.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { ROOT, SIZES, allViews, serveDir, newContext, openView } = require('./lib');

const args = process.argv.slice(2);
let baseRef = 'origin/main', afterDir = ROOT; const views = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base') baseRef = args[++i];
  else if (args[i] === '--after') afterDir = path.resolve(args[++i]);
  else views.push(args[i]);
}

(async () => {
  // Unpack the "before" version into a temporary folder.
  const beforeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-before-'));
  execSync(`git -C "${ROOT}" archive ${baseRef} | tar -x -C "${beforeDir}"`);
  const targets = views.length ? views : allViews(beforeDir);
  const out = path.join(__dirname, 'previews', 'compare');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const before = await serveDir(beforeDir), after = await serveDir(afterDir);
  const browser = await chromium.launch();
  let changed = 0;
  try {
    for (const t of targets) {
      for (const size of Object.keys(SIZES)) {
        const shots = [];
        for (const base of [before.url, after.url]) {
          const ctx = await newContext(browser, size, 1);
          const page = await ctx.newPage();
          await openView(page, base, t);
          // Stop looping animations (like the pulsing timeline dot) so both shots catch the same frame.
          await page.addStyleTag({ content: '*,*::before,*::after{animation-iteration-count:1 !important;}' });
          await page.waitForTimeout(100);
          shots.push(PNG.sync.read(await page.screenshot({ fullPage: true })));
          await ctx.close();
        }
        const [a, b] = shots;
        const label = `${t} (${size})`;
        if (a.width !== b.width || a.height !== b.height) {
          console.log(`DIFF  ${label}: page size changed from ${a.width}x${a.height} to ${b.width}x${b.height}`);
          changed++; continue;
        }
        const diff = new PNG({ width: a.width, height: a.height });
        const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0 });
        if (n) {
          const file = path.join(out, `${t.replace(/\//g, '-')}-${size}.png`);
          fs.writeFileSync(file, PNG.sync.write(diff));
          console.log(`DIFF  ${label}: ${n} pixels differ (${(100 * n / (a.width * a.height)).toFixed(3)}%), see ${path.relative(process.cwd(), file)}`);
          changed++;
        } else console.log(`SAME  ${label}`);
      }
    }
  } finally {
    await browser.close();
    before.server.close(); after.server.close();
    fs.rmSync(beforeDir, { recursive: true, force: true });
  }
  console.log(changed ? `\n${changed} screenshot(s) differ.` : '\nIdentical: every view matches at both sizes.');
  process.exit(changed ? 1 : 0);
})();
