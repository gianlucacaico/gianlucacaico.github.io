#!/usr/bin/env node
// Checks every page of the site renders properly. Starting from the homepage it
// follows every internal link and checks each page: the right view shows, every
// image loads, there are no script errors, and the link preview tags (title,
// description, canonical address, Open Graph and Twitter) are present, point
// at the page's own address, and the preview image loads. It also checks that old "#/" addresses redirect to
// the new ones, that in-page links like #contact have a target, that no page
// contains an em dash, and that a
// missing page shows the "page not found" page.
//
// Usage: node tools/check-views.js [url | local]   (default https://gianlucacaico.com/)
//        "local" builds the working copy with Jekyll and checks that.

const { chromium } = require('playwright');
const { LIVE, build, serveDir, liveMode, expectedMain, allViews } = require('./lib');

(async () => {
  let base = process.argv[2] || LIVE, srv = null;
  if (base === 'local') { srv = await serveDir(build()); base = srv.url; }
  const site = new URL(base).origin;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  let errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let bad = 0;
  const report = (ok, msg) => { console.log(`  ${ok ? 'ok' : 'x '} ${msg}`); if (!ok) bad++; };
  const bust = () => 'check=' + Date.now();

  if (await liveMode(context, base) === 'hash') {
    // The old single-page site: every view lives on the homepage behind a "#/" address.
    await page.goto(base + '?' + bust(), { waitUntil: 'networkidle' });
    for (const v of allViews()) {
      const hash = v === 'home' ? '#/' : '#/' + v;
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForTimeout(250);
      const shown = await page.evaluate(() => { const m = [...document.querySelectorAll('main[data-view]')].find((x) => !x.hidden); return m && m.id; });
      report(shown === expectedMain(v), hash);
    }
  } else {
    const seen = new Set(), queue = ['/'], anchors = [];
    while (queue.length) {
      const path = queue.shift();
      if (seen.has(path)) continue;
      seen.add(path);
      errors = [];
      const res = await page.goto(site + path + '?' + bust(), { waitUntil: 'networkidle' });
      const r = await page.evaluate(() => {
        const meta = (sel) => { const e = document.querySelector(sel); return e ? (e.content || e.href || '') : ''; };
        const main = document.querySelector('main[data-view]');
        return {
          main: main && main.id,
          broken: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length,
          title: document.title,
          canonical: meta('link[rel="canonical"]'),
          tags: ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[property="og:url"]', 'meta[name="twitter:card"]', 'meta[name="twitter:title"]', 'meta[name="twitter:image"]'].filter((s) => !meta(s)),
          ogUrl: meta('meta[property="og:url"]'),
          ogImage: meta('meta[property="og:image"]'),
          emDashes: (document.documentElement.outerHTML.match(/\u2014/g) || []).length,
          links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        };
      });
      const issues = [];
      if (!res || res.status() !== 200) issues.push(`status ${res && res.status()}`);
      if (!r.main) issues.push('no main view');
      if (r.broken) issues.push(`${r.broken} broken image(s)`);
      if (!r.title) issues.push('no page title');
      if (r.tags.length) issues.push('missing link preview tags: ' + r.tags.join(', '));
      const own = 'https://gianlucacaico.com' + path;
      if (r.canonical !== own || r.ogUrl !== own) issues.push(`canonical/og:url is ${r.canonical} (expected ${own})`);
      if (r.emDashes) issues.push(`${r.emDashes} em dash(es)`);
      // The link preview image must exist (checked on the site being tested, so new images count locally).
      if (r.ogImage) {
        const img = await context.request.get(r.ogImage.replace('https://gianlucacaico.com', site)).catch(() => null);
        if (!img || img.status() !== 200 || !/^image\//.test(img.headers()['content-type'] || '')) issues.push(`link preview image ${r.ogImage} does not load`);
      }
      if (errors.length) issues.push('script errors: ' + errors.join('; '));
      report(!issues.length, `${path} (${r.title})${issues.length ? ': ' + issues.join(', ') : ''}`);
      for (const href of r.links) {
        if (href.startsWith('#')) anchors.push([path, href.slice(1)]);
        else if (href.startsWith('/')) {
          const [p, h] = href.split('#');
          if (h) anchors.push([p, h]);
          if (!seen.has(p)) queue.push(p);
        }
      }
    }
    // In-page links (#contact, /#timeline) must point at something that exists.
    const checked = new Set();
    for (const [p, id] of anchors) {
      if (checked.has(p + '#' + id)) continue;
      checked.add(p + '#' + id);
      await page.goto(site + p + '?' + bust(), { waitUntil: 'domcontentloaded' });
      report(await page.evaluate((i) => !!document.getElementById(i), id), `link target ${p}#${id} exists`);
    }
    // Old "#/" addresses redirect to the new pages.
    const olds = [['#/', '/'], ['#/work', '/work'], ['#/blog', '/blog/'], ...[...seen].filter((p) => /^\/blog\/[^/]+$/.test(p)).map((p) => ['#' + p, p])];
    for (const [hash, want] of olds) {
      await page.goto('about:blank');
      await page.goto(site + '/' + hash, { waitUntil: 'networkidle' });
      const got = new URL(page.url()).pathname;
      report(got === want, `old address /${hash} redirects to ${want}${got === want ? '' : ' (went to ' + got + ')'}`);
    }
    // A missing page shows the "page not found" page with a 404 status.
    const nf = await page.goto(site + '/blog/this-page-does-not-exist', { waitUntil: 'networkidle' });
    report(nf.status() === 404 && await page.evaluate(() => !!document.getElementById('view-404')), 'missing pages show the "page not found" page (404)');
  }
  await browser.close();
  if (srv) srv.server.close();
  process.exit(bad ? 1 : 0);
})();
