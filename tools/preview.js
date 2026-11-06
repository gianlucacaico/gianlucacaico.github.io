#!/usr/bin/env node
// Renders pages or sections of the site at mobile (390px) and desktop (1280px)
// and saves screenshots, so changes can be reviewed before they go live.
//
// Usage (from the repo root):
//   node tools/preview.js                         home page, both sizes
//   node tools/preview.js blog                    blog index
//   node tools/preview.js blog/dynamic-blueprinting
//   node tools/preview.js home --section writing  one section (id or CSS selector)
//   node tools/preview.js all                     every view
//   node tools/preview.js home --live             the live site instead of local files
//   node tools/preview.js home --full             whole page instead of the first screen
//   node tools/preview.js home --only mobile      one size only
//   node tools/preview.js home --out some/folder  choose where screenshots go
//
// Local previews are built first with GitHub Pages' own Jekyll (tools/build.sh).
// Screenshots go to tools/previews/ by default (git ignores that folder).
// The Inter font is served from a local copy, so screenshots always use the
// real font even when Google Fonts is unreachable.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { LIVE, SIZES, build, allViews, expectedMain, serveDir, newContext, openView } = require('./lib');

function parseArgs(argv) {
  const opts = { targets: [], section: null, live: false, full: false, only: null, out: path.join(__dirname, 'previews') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--section') opts.section = argv[++i];
    else if (a === '--live') opts.live = true;
    else if (a === '--full') opts.full = true;
    else if (a === '--only') opts.only = argv[++i];
    else if (a === '--out') opts.out = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 18).join('\n')); process.exit(0); }
    else opts.targets.push(a);
  }
  if (!opts.targets.length) opts.targets = ['home'];
  if (opts.targets.includes('all')) opts.targets = allViews();
  return opts;
}

function slug(t, section) {
  const base = t.replace(/^#?\/?/, '').replace(/\//g, '-') || 'home';
  return section ? base + '--' + section.replace(/[^a-z0-9-]+/gi, '') : base;
}

async function shoot(browser, base, target, size, opts) {
  const context = await newContext(browser, size);
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('Script error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('Console error: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`Missing file (${r.status()}): ${r.url()}`); });

  await openView(page, base, target, opts.live);

  const fontOk = await page.evaluate(() => document.fonts.check('700 16px Inter') && [...document.fonts].some((f) => f.family.replace(/['"]/g, '') === 'Inter' && f.status === 'loaded'));
  if (!fontOk) problems.push('Inter font did not load');

  const shown = await page.evaluate(() => { const m = [...document.querySelectorAll('main[data-view]')].find((x) => !x.hidden); return m && m.id; });
  const expected = expectedMain(target);
  if (shown !== expected) problems.push(`Expected view "${expected}" but "${shown}" is showing (check the address)`);

  fs.mkdirSync(opts.out, { recursive: true });
  const file = path.join(opts.out, `${slug(target, opts.section)}-${size}${opts.live ? '-live' : ''}.png`);

  if (opts.section) {
    const sel = /^[a-z][\w-]*$/i.test(opts.section) && !/^(main|section|header|footer|article)$/.test(opts.section) ? '#' + opts.section : opts.section;
    const el = page.locator(sel).filter({ visible: true }).first();
    if (!(await el.count())) { problems.push(`Section "${opts.section}" not found on this view`); await page.screenshot({ path: file }); }
    else await el.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, fullPage: opts.full });
  }
  await context.close();
  return { file, problems };
}

(async () => {
  const opts = parseArgs(process.argv.slice(2));
  let srv = null;
  let base = LIVE;
  if (!opts.live) { srv = await serveDir(build()); base = srv.url; } // build exactly as GitHub Pages would
  const browser = await chromium.launch();
  let failed = false;
  try {
    for (const t of opts.targets) {
      for (const size of Object.keys(SIZES)) {
        if (opts.only && opts.only !== size) continue;
        const { file, problems } = await shoot(browser, base, t, size, opts);
        console.log(`${problems.length ? 'WARN' : 'OK  '} ${path.relative(process.cwd(), file)}`);
        problems.forEach((p) => console.log('     - ' + p));
        if (problems.length) failed = true;
      }
    }
  } finally {
    await browser.close();
    if (srv) srv.server.close();
  }
  process.exit(failed ? 1 : 0);
})();
