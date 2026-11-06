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
// Screenshots go to tools/previews/ by default (git ignores that folder).
// The Inter font is served from a local copy, so screenshots always use the
// real font even when Google Fonts is unreachable.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const LIVE = 'https://gianlucacaico.com/';
const SIZES = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};
// Every view in index.html, found from its <main id="..."> tags, so new posts are included automatically.
function allViews() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<main id="([^"]+)" data-view/g)].map((m) =>
    m[1] === 'view-home' ? 'home' : m[1].startsWith('view-') ? m[1].slice(5) : 'blog/' + m[1].replace(/^post-/, ''));
}

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

// "home", "#/", "/" -> "#/"; "blog/x" or "#/blog/x" -> "#/blog/x"
function toHash(t) {
  let h = t.replace(/^#?\/?/, '');
  if (h === '' || h === 'home') return '#/';
  return '#/' + h;
}

function slug(t, section) {
  const base = t.replace(/^#?\/?/, '').replace(/\//g, '-') || 'home';
  return section ? base + '--' + section.replace(/[^a-z0-9-]+/gi, '') : base;
}

// Tiny static server for the repo, so relative links (assets/...) behave as on the live site.
function serve() {
  const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Answer Google Fonts requests with the local Inter files.
async function useLocalInter(context) {
  const dir = path.dirname(require.resolve('@fontsource/inter/package.json')) + '/files';
  const weights = [400, 500, 600, 700, 800];
  const css = weights.map((w) => `@font-face{font-family:'Inter';font-style:normal;font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/local/inter-${w}.woff2) format('woff2');}`).join('\n');
  await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await context.route('https://fonts.gstatic.com/**', (route) => {
    const m = route.request().url().match(/inter-(\d+)\.woff2$/);
    if (!m) return route.abort();
    route.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(`${dir}/inter-latin-${m[1]}-normal.woff2`) });
  });
}

async function shoot(browser, base, target, size, opts) {
  const context = await browser.newContext({
    viewport: SIZES[size],
    deviceScaleFactor: 2,
    isMobile: size === 'mobile',
    hasTouch: size === 'mobile',
    reducedMotion: 'reduce', // entrance animations finish instantly, so screenshots are stable
  });
  await useLocalInter(context);
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('Script error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('Console error: ' + m.text()); });

  const hash = toHash(target);
  const url = base + (opts.live ? '?preview=' + Date.now() : '') + hash;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const fontOk = await page.evaluate(() => document.fonts.check('700 16px Inter') && [...document.fonts].some((f) => f.family.replace(/['"]/g, '') === 'Inter' && f.status === 'loaded'));
  if (!fontOk) problems.push('Inter font did not load');

  const shown = await page.evaluate(() => { const m = [...document.querySelectorAll('main[data-view]')].find((x) => !x.hidden); return m && m.id; });
  const expected = hash === '#/' ? 'view-home' : hash === '#/work' ? 'view-work' : hash === '#/blog' ? 'view-blog' : 'post-' + hash.slice(7);
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
  let server = null;
  let base = LIVE;
  if (!opts.live) { server = await serve(); base = `http://127.0.0.1:${server.address().port}/`; }
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
    if (server) server.close();
  }
  process.exit(failed ? 1 : 0);
})();
