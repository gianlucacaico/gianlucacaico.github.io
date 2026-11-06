// Shared helpers for the preview and comparison tools.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LIVE = 'https://gianlucacaico.com/';
const SIZES = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};

// Every view in a built site, found from its <main id="..."> tags, so new posts are included automatically.
function allViews(dir = ROOT) {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  return [...html.matchAll(/<main id="([^"]+)" data-view/g)].map((m) =>
    m[1] === 'view-home' ? 'home' : m[1].startsWith('view-') ? m[1].slice(5) : 'blog/' + m[1].replace(/^post-/, ''));
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

// Tiny static server for a folder, so absolute links (/assets/...) behave as on the live site.
function serveDir(dir) {
  const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(dir, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
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
async function openView(page, base, target, bust = false) {
  await page.goto(base + (bust ? '?preview=' + Date.now() : '') + toHash(target), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))));
  await page.waitForTimeout(400);
}

module.exports = { ROOT, LIVE, SIZES, allViews, toHash, expectedMain, serveDir, useLocalInter, newContext, openView };
