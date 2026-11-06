#!/usr/bin/env node
// Opens every view of the site and checks it renders: the right view shows,
// every image loads, the page title is set, and there are no script errors.
// Also checks every in-page "#/..." link points at a view that exists.
// Usage: node tools/check-views.js [url | local]   (default https://gianlucacaico.com/)
//        "local" builds the working copy with Jekyll and checks that.

const { chromium } = require('playwright');
let base = process.argv[2] || 'https://gianlucacaico.com/';

(async () => {
  let srv = null;
  if (base === 'local') { const { build, serveDir } = require('./lib'); srv = await serveDir(build()); base = srv.url; }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let bad = 0;

  await page.goto(base + '?check=' + Date.now(), { waitUntil: 'networkidle' });
  const views = await page.evaluate(() => [...document.querySelectorAll('main[data-view]')].map((m) => m.id));
  const links = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href')))]);

  const hashFor = (id) => id === 'view-home' ? '#/' : id === 'view-work' ? '#/work' : id === 'view-blog' ? '#/blog' : '#/blog/' + id.replace(/^post-/, '');
  for (const id of views) {
    await page.evaluate((h) => { location.hash = h; }, hashFor(id));
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const m = [...document.querySelectorAll('main[data-view]')].find((x) => !x.hidden);
      const imgs = [...m.querySelectorAll('img[src]')].filter((i) => !i.complete || i.naturalWidth === 0).length;
      return { shown: m && m.id, brokenImgs: imgs, title: document.title };
    });
    const issues = [];
    if (r.shown !== id) issues.push(`showed ${r.shown}`);
    if (r.brokenImgs) issues.push(`${r.brokenImgs} broken image(s)`);
    if (!r.title) issues.push('no page title');
    console.log(`  ${issues.length ? 'x' : 'ok'} ${hashFor(id)}${issues.length ? ': ' + issues.join(', ') : ''}`);
    if (issues.length) bad++;
  }
  for (const h of links) {
    const target = h === '#/' ? 'view-home' : h.startsWith('#/work') ? 'view-work' : h === '#/blog' ? 'view-blog' : 'post-' + h.slice(7);
    if (!views.includes(target)) { console.log(`  x link ${h} points to a view that does not exist`); bad++; }
  }
  if (errors.length) { errors.forEach((e) => console.log('  x script error: ' + e)); bad++; }
  await browser.close();
  if (srv) srv.server.close();
  process.exit(bad ? 1 : 0);
})();
