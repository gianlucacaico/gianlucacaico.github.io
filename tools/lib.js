// Shared helpers for the preview and comparison tools.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIVE = 'https://gianlucacaico.com/';
const SIZES = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};

// Every view of the site, so new posts are included automatically. Works on the
// source folder (posts in _posts), a built folder (blog/*.html) or the old single page.
function allViews(dir = ROOT) {
  const posts = fs.existsSync(path.join(dir, '_posts'))
    ? fs.readdirSync(path.join(dir, '_posts')).filter((f) => /\.(md|html)$/.test(f)).sort().reverse().map((f) => f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.\w+$/, ''))
    : fs.existsSync(path.join(dir, 'blog')) ? fs.readdirSync(path.join(dir, 'blog')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)) : null;
  if (posts) return ['home', 'work', 'blog', ...posts.map((s) => 'blog/' + s)];
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  return [...html.matchAll(/<main id="([^"]+)" data-view/g)].map((m) =>
    m[1] === 'view-home' ? 'home' : m[1].startsWith('view-') ? m[1].slice(5) : 'blog/' + m[1].replace(/^post-/, ''));
}

// Address of a view. "path" sites have real pages (/blog/x); the old single page used "#/blog/x".
function viewUrl(base, t, mode = 'path', bust = false) {
  const q = bust ? '?preview=' + Date.now() : '';
  if (mode === 'hash') return base + q + toHash(t);
  const p = t.replace(/^#?\/?/, '');
  return base + (p === 'home' ? '' : p) + q;
}

// Does a built folder (or the live site) use real page addresses? Checks whether /work exists.
function modeOf(dir) { return fs.existsSync(path.join(dir, 'work.html')) ? 'path' : 'hash'; }
async function liveMode(context, base) {
  const r = await context.request.get(base + 'work', { maxRedirects: 0 }).catch(() => null);
  return r && r.status() === 200 ? 'path' : 'hash';
}

// "home", "#/", "/" -> "#/"; "blog/x" or "#/blog/x" -> "#/blog/x"
function toHash(t) {
  const h = t.replace(/^#?\/?/, '');
  if (h === '' || h === 'home') return '#/';
  return '#/' + h;
}

// The main id a view should show, e.g. "blog/x" -> "post-x".
function expectedMain(t) {
  const hash = toHash(t);
  return hash === '#/' ? 'view-home' : hash === '#/work' ? 'view-work' : hash === '#/blog' ? 'view-blog' : 'post-' + hash.slice(7);
}

// Build a folder with GitHub Pages' Jekyll (tools/build.sh) and return where it was built.
function build(src = ROOT, dest = path.join(__dirname, '_site')) {
  execFileSync('bash', [path.join(__dirname, 'build.sh'), src, dest], { stdio: 'inherit' });
  return dest;
}

// Tiny static server for a folder, so absolute links (/assets/...) behave as on the live site.
function serveDir(dir) {
  const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(dir, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html'; // /blog/x serves blog/x.html, as on GitHub Pages
    let status = 200;
    if (!file.startsWith(dir) || !fs.existsSync(file)) {
      const notFound = path.join(dir, '404.html');
      if (!fs.existsSync(notFound)) { res.writeHead(404); return res.end('Not found'); }
      file = notFound; status = 404;
    }
    res.writeHead(status, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

// Answer Google Fonts requests with the local Inter files, so screenshots always use the real font.
async function useLocalInter(context) {
  const dir = path.dirname(require.resolve('@fontsource/inter/package.json')) + '/files';
  const css = [400, 500, 600, 700, 800].map((w) => `@font-face{font-family:'Inter';font-style:normal;font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/local/inter-${w}.woff2) format('woff2');}`).join('\n');
  await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await context.route('https://fonts.gstatic.com/**', (route) => {
    const m = route.request().url().match(/inter-(\d+)\.woff2$/);
    if (!m) return route.abort();
    route.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(`${dir}/inter-latin-${m[1]}-normal.woff2`) });
  });
}

// A browser context at one of the standard sizes, with stable (reduced) motion and local Inter.
async function newContext(browser, size, scale = 2) {
  const context = await browser.newContext({
    viewport: SIZES[size],
    deviceScaleFactor: scale,
    isMobile: size === 'mobile',
    hasTouch: size === 'mobile',
    reducedMotion: 'reduce',
  });
  await useLocalInter(context);
  return context;
}

// Open a view and wait until fonts and images are ready.
async function openView(page, base, target, bust = false, mode = 'path') {
  await page.goto(viewUrl(base, target, mode, bust), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))));
  await page.waitForTimeout(400);
}

module.exports = { ROOT, LIVE, SIZES, build, allViews, toHash, viewUrl, modeOf, liveMode, expectedMain, serveDir, useLocalInter, newContext, openView };
