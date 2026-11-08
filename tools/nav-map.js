#!/usr/bin/env node
// Navigation map: sweeps gianlucacaico.com and its design system (gianlucacaico.com/design-system)
// as one space, the way a visitor moves through them, at phone (390px) and desktop (1280px) size.
// For every page it asks three questions: where am I, where can I go, and how do I get back. It also
// measures how long each page is on a phone and how fast it is growing (from its history in git), and
// flags long reference pages that should become sub-pages with a menu.
// It is the first step of the /navigate skill, which turns this map into a heuristic review.
//
// Usage (from the repo root):
//   node tools/nav-map.js                  this working copy, with the live design system
//   node tools/nav-map.js --ds <folder>    with a local design system checkout instead (built with its own tools/build.sh),
//                                          which also lets it measure the design system's growth
//   node tools/nav-map.js --live           the live site and the live design system
//   node tools/nav-map.js --shots          also screenshot the top and bottom of every page at both sizes
//   node tools/nav-map.js --json <file>    where to save the full map (default tools/previews/nav/map.json)
//
// Prints PASS / WARN / FAIL per check and INFO notes, then exits 1 if anything failed.
// FAIL: a link to a missing page, an in-page link with no target, or a page with no visible way home.
// WARN: a usability problem worth a decision (no "you are here" marker, a dead end, small tap targets...).

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { build, useLocalInter } = require('./lib');

const LIVE = 'https://gianlucacaico.com';
const DS = '/design-system/';
const SIZES = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } };
const VAGUE = /^(click here|here|read more|more|learn more|link|this|go|details)$/i;
// Page length: a page people look things up in should fit in about this many phone screens.
const LONG = 12, MANY_SECTIONS = 6, AHEAD = 10, TRUST = 5; // project growth over the next AHEAD changes, once a page has TRUST or more
const ROOT = path.resolve(__dirname, '..');

function args(argv) {
  const o = { live: false, ds: null, shots: false, json: path.join(__dirname, 'previews', 'nav', 'map.json') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--live') o.live = true;
    else if (argv[i] === '--shots') o.shots = true;
    else if (argv[i] === '--ds') o.ds = path.resolve(argv[++i]);
    else if (argv[i] === '--json') o.json = path.resolve(argv[++i]);
    else if (argv[i] === '-h' || argv[i] === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 20).join('\n')); process.exit(0); }
  }
  return o;
}

// One local server for both sites, as on the real domain: the design system under /design-system/.
function serveSpaces(siteDir, dsDir) {
  const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    let dir = siteDir;
    if (dsDir && (p + '/').startsWith(DS)) { dir = dsDir; p = p.slice(DS.length - 1) || '/'; }
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(dir, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    let status = 200;
    if (!file.startsWith(dir) || !fs.existsSync(file)) { file = path.join(siteDir, '404.html'); status = 404; }
    res.writeHead(status, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

const spaceOf = (p) => ((p + '/').startsWith(DS) ? 'ds' : 'site');
const homeOf = (space) => (space === 'ds' ? DS : '/');
// A page's parent, from its address: /blog/x -> /blog/, /work -> /, /design-system/workflows -> /design-system/.
function parentOf(p) {
  if (p === '/') return null;
  if (p === DS) return '/';
  const trimmed = p.endsWith('/') ? p.slice(0, -1) : p;
  return trimmed.slice(0, trimmed.lastIndexOf('/') + 1);
}
// Normalise an address to the page it lands on: no query, no index.html, no .html.
function norm(p) {
  p = p.split('?')[0].replace(/index\.html$/, '').replace(/\.html$/, '');
  if (p === '/design-system') p = DS;
  if (p === '/blog') p = '/blog/';
  return p || '/';
}

// Everything the review needs from one page at one size, read in the browser.
function readPage() {
  const region = (el) => {
    if (el.closest('nav[aria-label*="readcrumb" i]')) return 'breadcrumb';
    if (el.closest('.tabbar')) return 'tabbar';
    if (el.closest('header.topbar, header.ds-bar, body > header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('main')) return 'main';
    return 'other';
  };
  const visible = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const name = (el) => (el.getAttribute('aria-label') || el.innerText || el.textContent || [...el.querySelectorAll('img[alt]')].map((i) => i.alt).join(' ')).replace(/\s+/g, ' ').trim();
  // Inline links inside a sentence are exempt from the tap target size rule (WCAG 2.5.8).
  const inSentence = (el) => getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.replace(/\s+/g, ' ').trim().length > name(el).length + 20;
  const links = [...document.querySelectorAll('a[href]')].map((a) => {
    const r = a.getBoundingClientRect();
    return {
      href: a.getAttribute('href'),
      abs: a.href,
      label: name(a),
      region: region(a),
      visible: visible(a),
      hidden: a.getAttribute('aria-hidden') === 'true' || a.tabIndex < 0,
      current: a.getAttribute('aria-current'),
      newTab: a.target === '_blank',
      noopener: /noopener|noreferrer/.test(a.rel),
      w: Math.round(r.width), h: Math.round(r.height),
      inline: inSentence(a),
    };
  });
  const navs = [...document.querySelectorAll('nav')].filter(visible).map((n) => n.getAttribute('aria-label') || '(no label)');
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).join(' ');
  const first = document.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  return {
    title: document.title,
    canonical: (document.querySelector('link[rel="canonical"]') || {}).href || '',
    h1: (document.querySelector('h1') || {}).innerText || '',
    links,
    navs,
    ids: [...document.querySelectorAll('[id]')].map((e) => e.id),
    breadcrumb: !!document.querySelector('nav[aria-label*="readcrumb" i]') && visible(document.querySelector('nav[aria-label*="readcrumb" i]')),
    breadcrumbData: /BreadcrumbList/.test(ld),
    skipLink: !!first && first.tagName === 'A' && (first.getAttribute('href') || '').startsWith('#') && /skip/i.test(first.textContent),
    main: !!document.querySelector('main'),
    height: document.documentElement.scrollHeight,
    sections: document.querySelectorAll('main h2').length,
    sectionIds: [...document.querySelectorAll('main [id]')].filter((e) => e.querySelector('h2')).map((e) => e.id),
  };
}

// The source file behind a page, so its history can be read: this repo for the site, the --ds checkout
// for the design system. Posts are written once, so they have none.
function sourceOf(p, dsRepo) {
  if (spaceOf(p) === 'ds') return dsRepo ? { repo: dsRepo, file: ((p.slice(DS.length).replace(/\/$/, '')) || 'index') + '.html' } : null;
  if (p.startsWith('/blog/') && p !== '/blog/') return null;
  return { repo: ROOT, file: (p === '/' ? 'index' : p === '/blog/' ? 'blog' : p.slice(1)) + '.html' };
}
// How the page's section count (its h2 headings) changed over every commit that touched it, oldest first.
function growthOf(src) {
  if (!src) return null;
  try {
    const log = execFileSync('git', ['-C', src.repo, 'log', '--format=%H %cI', '--', src.file], { encoding: 'utf8' }).trim();
    const points = log.split('\n').filter(Boolean).reverse().map((line) => {
      const [sha, when] = line.split(' ');
      let text = '';
      try { text = execFileSync('git', ['-C', src.repo, 'show', `${sha}:${src.file}`], { encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { /* not there yet */ }
      return { when, sections: (text.match(/<h2[\s>]/g) || []).length, ok: !!text };
    }).filter((pt) => pt.ok);
    if (points.length < 2) return { changes: points.length, perChange: 0 };
    const recent = points.slice(-(AHEAD + 1)); // the last few changes say more about where it is heading
    const first = points[0], last = points[points.length - 1];
    return {
      changes: points.length,
      from: first.sections, to: last.sections,
      days: Math.max(1, Math.round((new Date(last.when) - new Date(first.when)) / 864e5)),
      perChange: (recent[recent.length - 1].sections - recent[0].sections) / (recent.length - 1),
    };
  } catch (e) { return null; }
}

(async () => {
  const o = args(process.argv.slice(2));
  let origin = LIVE, srv = null, dsLive = true;
  if (!o.live) {
    const siteDir = build();
    let dsDir = null;
    if (o.ds) {
      dsDir = path.join(o.ds, 'tools', '_site');
      execFileSync('bash', [path.join(o.ds, 'tools', 'build.sh'), o.ds, dsDir], { stdio: 'inherit' });
      dsLive = false;
    }
    srv = await serveSpaces(siteDir, dsDir);
    origin = srv.origin;
  }
  const browser = await chromium.launch();
  const contexts = {};
  for (const size of Object.keys(SIZES)) {
    contexts[size] = await browser.newContext({ viewport: SIZES[size], isMobile: size === 'mobile', hasTouch: size === 'mobile', reducedMotion: 'reduce' });
    // Local site, live design system: fetch /design-system/ pages from the live domain.
    if (!o.live && dsLive) {
      await contexts[size].route(origin + DS + '**', async (route) => {
        const u = new URL(route.request().url());
        const res = await route.fetch({ url: LIVE + u.pathname + u.search });
        route.fulfill({ response: res });
      });
    }
    await useLocalInter(contexts[size]); // the real font, even when Google Fonts is unreachable
  }

  // Crawl from both front doors (the design system has no link from the main site, by design),
  // plus every address in the site's sitemap, so orphan pages are found too.
  const pages = {};
  const queue = ['/', DS, '/404'];
  try {
    const sm = await (await contexts.desktop.request.get(origin + '/sitemap.xml')).text();
    for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) queue.push(norm(new URL(m[1]).pathname));
  } catch (e) { /* no sitemap */ }
  const inSitemap = new Set(queue.slice(3));
  const missing = [];
  while (queue.length) {
    const p = queue.shift();
    if (pages[p] || missing.includes(p)) continue;
    const entry = { path: p, space: spaceOf(p), status: 0, sizes: {} };
    for (const size of Object.keys(SIZES)) {
      const page = await contexts[size].newPage();
      const res = await page.goto(origin + p, { waitUntil: 'networkidle' }).catch(() => null);
      entry.status = res ? res.status() : 0;
      if (entry.status === 200) {
        entry.sizes[size] = await page.evaluate(readPage);
        if (o.shots) { // first screen and last screen: the menus, the trail and the footer
          const dir = path.join(path.dirname(o.json), 'shots'), name = (p.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home') + '-' + size;
          fs.mkdirSync(dir, { recursive: true });
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: path.join(dir, name + '-top.png') });
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(dir, name + '-end.png') });
        }
      }
      await page.close();
      if (entry.status !== 200) break;
    }
    if (entry.status !== 200) { missing.push(p); continue; }
    pages[p] = entry;
    for (const size of Object.keys(entry.sizes)) {
      for (const l of entry.sizes[size].links) {
        let u = new URL(l.abs, origin + p);
        if (u.origin === LIVE && origin !== LIVE) u = new URL(u.pathname + u.search + u.hash, origin);
        l.external = u.origin !== origin;
        l.kind = /^mailto:/.test(l.href) ? 'email' : /^tel:/.test(l.href) ? 'phone' : l.external ? 'external' : 'internal';
        if (l.kind !== 'internal') continue;
        l.to = norm(u.pathname);
        l.hash = u.hash.slice(1);
        if (!pages[l.to] && !queue.includes(l.to)) queue.push(l.to);
      }
    }
  }

  // ---------- The graph ----------
  const paths = Object.keys(pages).sort((a, b) => spaceOf(a).localeCompare(spaceOf(b)) || a.localeCompare(b));
  const edges = {};   // page -> set of pages one tap away, at phone size (visible links only)
  const inbound = {}; // page -> pages that link to it (from content, not counting itself)
  for (const p of paths) { edges[p] = new Set(); inbound[p] = new Set(); }
  for (const p of paths) {
    for (const size of Object.keys(SIZES)) {
      for (const l of pages[p].sizes[size].links) {
        if (l.kind !== 'internal' || !pages[l.to] || !l.visible) continue;
        if (size === 'mobile') edges[p].add(l.to);
        if (l.to !== p) inbound[l.to].add(p);
      }
    }
  }
  const taps = (from) => { // fewest taps from one page to every other, at phone size
    const d = { [from]: 0 }, q = [from];
    while (q.length) { const c = q.shift(); for (const n of edges[c]) if (d[n] === undefined) { d[n] = d[c] + 1; q.push(n); } }
    return d;
  };
  const fromHome = taps('/'), fromDs = taps(DS);
  // Contact counts as reached by any visible link to the contact footer or an email address.
  const reachesContact = (p, size) => pages[p].sizes[size].links.some((l) => l.visible && (l.kind === 'email' || (l.kind === 'internal' && l.hash === 'contact')));

  // ---------- Checks ----------
  const results = [];
  const add = (level, group, msg) => results.push({ level, group, msg });
  const G = { here: 'Where am I?', go: 'Where can I go?', back: 'How do I get back?', across: 'Across the two sites', labels: 'Labels and tap targets' };

  for (const p of missing) add('FAIL', G.go, `A link leads to ${p}, which does not exist`);

  for (const p of paths) {
    const pg = pages[p], space = pg.space, home = homeOf(space), parent = parentOf(p);
    const where = `${p}`;
    for (const size of Object.keys(SIZES)) {
      const s = pg.sizes[size], vis = s.links.filter((l) => l.visible);
      const globalNav = vis.filter((l) => l.region === 'header' || l.region === 'tabbar');
      // Where am I?
      const marked = globalNav.some((l) => l.current === 'page');
      if (!globalNav.length) add('INFO', G.here, `${where} (${size}): has no menu, only its own links`);
      else if (p !== '/404') {
        if (marked) add('PASS', G.here, `${where} (${size}): the menu marks where you are`);
        else add('WARN', G.here, `${where} (${size}): nothing in the menu marks where you are`);
      }
      // How do I get back?
      const homeLink = vis.some((l) => l.kind === 'internal' && l.to === home && !l.hash);
      if (!homeLink) add('FAIL', G.back, `${where} (${size}): no visible link back to ${space === 'ds' ? 'the design system home' : 'the homepage'}`);
      if (parent && parent !== '/') {
        const up = vis.some((l) => l.kind === 'internal' && l.to === parent && l.region !== 'header' && l.region !== 'tabbar');
        if (!up && !s.breadcrumb) add('WARN', G.back, `${where} (${size}): no breadcrumb or back link to its parent page (${parent})`);
      }
      // In-page links must land on something.
      for (const l of s.links.filter((x) => x.kind === 'internal' && x.hash && pages[x.to])) {
        if (!pages[l.to].sizes[size].ids.includes(l.hash)) add('FAIL', G.go, `${where} (${size}): "${l.label}" points to ${l.to}#${l.hash}, which has no such section`);
      }
      // Labels and tap targets
      for (const l of vis.filter((x) => !x.hidden && VAGUE.test(x.label))) add('WARN', G.labels, `${where} (${size}): the link "${l.label}" does not say where it goes`);
      for (const l of vis.filter((x) => !x.hidden && !x.label)) add('WARN', G.labels, `${where} (${size}): a link to ${l.href} has no readable name`);
      for (const l of s.links.filter((x) => x.newTab && !x.noopener)) add('WARN', G.labels, `${where}: "${l.label}" opens a new tab without rel="noopener"`);
      if (size === 'mobile') {
        const small = vis.filter((l) => !l.hidden && !l.inline && (l.w < 24 || l.h < 24));
        for (const l of small) add('WARN', G.labels, `${where} (phone): "${l.label}" is a small tap target (${l.w}x${l.h}px, under 24px)`);
      }
    }
    // Where am I, for search engines and shared links: the page's own address should be the one links use.
    const canon = pg.sizes.desktop.canonical ? new URL(pg.sizes.desktop.canonical).pathname : '';
    if (canon && canon !== p && p !== '/404') add('WARN', G.here, `${where}: its address for search engines and link previews is ${canon}, but links use ${p}`);
    // Where can I go? (from content and footer, beyond the menu, at phone size)
    const onward = new Set(pg.sizes.mobile.links.filter((l) => l.visible && (l.region === 'main' || l.region === 'footer' || l.region === 'breadcrumb') && l.kind === 'internal' && pages[l.to] && l.to !== p).map((l) => l.to));
    if (!onward.size && p !== '/404') add('WARN', G.go, `${where}: a dead end, the only way on is the menu`);
    if (!reachesContact(p, 'mobile') && space === 'site') add('WARN', G.go, `${where}: no visible way to get in touch on a phone`);
    if (p !== '/' && p !== DS && p !== '/404' && !inbound[p].size) add('WARN', G.go, `${where}: an orphan, no other page links to it`);
    if (inSitemap.has(p) && !inbound[p].size) add('WARN', G.go, `${where}: listed in the sitemap but not linked from any page`);
  }

  // Across the two sites
  const cross = (from, to) => paths.filter((p) => spaceOf(p) === from).flatMap((p) => pages[p].sizes.desktop.links.filter((l) => l.kind === 'internal' && pages[l.to] && spaceOf(l.to) === to).map((l) => ({ from: p, to: l.to, label: l.label, region: l.region })));
  const s2d = cross('site', 'ds'), d2s = cross('ds', 'site');
  const where2 = (xs) => (xs.length ? ' (' + [...new Set(xs.map((x) => `"${x.label}" in the ${x.region}`))].join(', ') + ')' : '');
  add('INFO', G.across, `Main site to design system: ${s2d.length} link(s)${where2(s2d)}`);
  add('INFO', G.across, `Design system to main site: ${d2s.length} link(s)${where2(d2s)}`);
  // Each site's footer links to the other (decision, November 2026). Pages with no footer at all are noted, not warned.
  for (const [from, to, name, other] of [['site', 'ds', 'Main site', 'the design system'], ['ds', 'site', 'Design system', 'gianlucacaico.com']]) {
    const own = paths.filter((p) => pages[p].space === from && p !== '/404');
    const footless = own.filter((p) => !pages[p].sizes.desktop.links.some((l) => l.region === 'footer'));
    const without = own.filter((p) => !footless.includes(p) && !Object.keys(SIZES).every((size) => pages[p].sizes[size].links.some((l) => l.visible && l.region === 'footer' && l.kind === 'internal' && pages[l.to] && spaceOf(l.to) === to)));
    if (without.length) add('WARN', G.across, `${name}: the footer does not link to ${other} on ${without.join(', ')}`);
    else add('PASS', G.across, `${name}: every footer links to ${other}`);
    if (footless.length) add('INFO', G.across, `${name}: ${footless.join(', ')} has no footer`);
  }

  // Key journeys, in taps at phone size
  const tops = { site: ['/', '/work', '/blog/'], ds: [DS, DS + 'workflows', DS + 'demo'] };
  for (const p of paths) {
    const d = taps(p);
    const far = tops[pages[p].space].filter((t) => pages[t] && t !== p && (d[t] === undefined || d[t] > 1));
    if (far.length) add('INFO', G.go, `${p}: ${far.map((t) => `${t} is ${d[t] === undefined ? 'unreachable' : d[t] + ' taps'} away`).join(', ')}`);
  }

  // Footer as a map of the space
  for (const space of ['site', 'ds']) {
    const sample = paths.find((p) => pages[p].space === space && p !== '/404');
    if (!sample) continue;
    const foot = new Set(pages[sample].sizes.desktop.links.filter((l) => l.region === 'footer' && l.kind === 'internal' && pages[l.to]).map((l) => l.to));
    const covered = tops[space].filter((t) => pages[t] && foot.has(t));
    add(covered.length === tops[space].filter((t) => pages[t]).length ? 'PASS' : 'INFO', G.go, `${space === 'ds' ? 'Design system' : 'Main site'} footer links to ${covered.length} of its ${tops[space].filter((t) => pages[t]).length} main pages${covered.length ? ' (' + covered.join(', ') + ')' : ''}`);
  }

  // Every page needs its own title, so tabs, history and search results can tell them apart.
  const titles = {};
  for (const p of paths) (titles[pages[p].sizes.desktop.title] = titles[pages[p].sizes.desktop.title] || []).push(p);
  for (const [t, ps] of Object.entries(titles)) if (ps.length > 1) add('WARN', G.here, `${ps.join(' and ')} share the title "${t}"`);

  // Breadcrumbs, structured data, skip links and landmark names
  const crumbsNeeded = paths.filter((p) => p !== '/' && p !== '/404');
  const crumbs = crumbsNeeded.filter((p) => pages[p].sizes.desktop.breadcrumb);
  const data = crumbsNeeded.filter((p) => pages[p].sizes.desktop.breadcrumbData);
  add('INFO', G.here, `Breadcrumb trails on ${crumbs.length} of ${crumbsNeeded.length} inner pages; breadcrumb data for search results on ${data.length}`);
  const skips = paths.filter((p) => pages[p].sizes.desktop.skipLink).length;
  add('INFO', G.here, `"Skip to content" link on ${skips} of ${paths.length} pages (every page has a <main> landmark, which already meets the basic rule)`);
  for (const p of paths) for (const size of Object.keys(SIZES)) {
    const dup = pages[p].sizes[size].navs.filter((n, i, a) => a.indexOf(n) !== i);
    if (dup.length) add('INFO', G.here, `${p} (${size}): two visible menus share the name "${dup[0]}"`);
  }

  // Same words, different destinations (confusing), or the same destination named differently in the phone and desktop menus.
  const byLabel = {};
  for (const p of paths) for (const size of Object.keys(SIZES)) for (const l of pages[p].sizes[size].links.filter((x) => x.visible && !x.hidden && x.label)) {
    if (l.kind === 'external' || l.kind === 'phone') continue;
    const dest = l.kind === 'email' ? 'email' : l.to === p && l.hash ? '#' + l.hash : l.to + (l.hash ? '#' + l.hash : '');
    const key = l.label.replace(/[←-⇿]/g, '').trim().toLowerCase();
    (byLabel[key] = byLabel[key] || new Set()).add(dest);
  }
  for (const [label, dests] of Object.entries(byLabel)) {
    const real = [...dests].filter((d) => !d.startsWith('#'));
    if (real.length > 1) add('INFO', G.labels, `"${label}" leads to different places: ${real.join(', ')}`);
  }
  for (const space of ['site', 'ds']) {
    const sample = paths.find((p) => pages[p].space === space);
    const names = (size) => Object.fromEntries(pages[sample].sizes[size].links.filter((l) => l.visible && (l.region === 'header' || l.region === 'tabbar')).map((l) => [l.kind === 'internal' ? l.to + (l.hash ? '#' + l.hash : '') : l.href, l.label]));
    const m = names('mobile'), d = names('desktop');
    for (const k of Object.keys(m)) if (d[k] && d[k] !== m[k]) add('INFO', G.labels, `${space === 'ds' ? 'Design system' : 'Main site'} menu: ${k} is "${d[k]}" on desktop but "${m[k]}" on a phone`);
  }

  // Page length and growth. A long page whose menu is a table of contents for it (the menu jumps to its
  // sections), or whose growth will make it long, is a reference page that wants sub-pages and a menu.
  // A long page read top to bottom (a homepage story, a post) can stay whole.
  G.size = 'Page length and growth';
  for (const p of paths.filter((x) => !(x.startsWith('/blog/') && x !== '/blog/') && x !== '/404')) {
    const m = pages[p].sizes.mobile, screens = m.height / SIZES.mobile.height;
    const jumps = new Set(paths.flatMap((q) => Object.values(pages[q].sizes).flatMap((s) => s.links.filter((l) => (l.region === 'header' || l.region === 'tabbar') && l.to === p && l.hash && m.sectionIds.includes(l.hash)).map((l) => l.hash))));
    const g = growthOf(sourceOf(p, o.live ? o.ds : (dsLive ? null : o.ds)));
    pages[p].size = { screens: +screens.toFixed(1), sections: m.sections, menuJumps: jumps.size, growth: g };
    const perSection = m.sections ? screens / m.sections : 0;
    const ahead = g && g.perChange > 0 ? { sections: Math.round(m.sections + g.perChange * AHEAD), screens: Math.round((m.sections + g.perChange * AHEAD) * perSection) } : null;
    if (ahead) pages[p].size.ahead = ahead;
    const facts = `${Math.round(screens)} phone screens, ${m.sections} sections` + (jumps.size ? `, and the menu jumps to ${jumps.size} of them` : '')
      + (g && g.changes > 1 ? `; ${g.from === g.to ? 'steady at' : 'went from ' + g.from + ' to'} ${g.to} sections over ${g.changes} changes in ${g.days} day${g.days === 1 ? '' : 's'}` : g === null && spaceOf(p) === 'ds' ? '; growth not measured (add --ds with a local checkout)' : '')
      + (ahead ? `; at this pace, about ${ahead.sections} sections and ${ahead.screens} screens after the next ${AHEAD} changes` : '');
    const trusted = g && g.changes >= TRUST; // a forecast from a handful of changes is a guess
    const long = Math.round(screens) >= LONG, growingLong = trusted && ahead && ahead.screens >= LONG * 1.5;
    if (m.sections >= MANY_SECTIONS && ((long && jumps.size >= 3) || (long && growingLong) || (!long && growingLong && jumps.size >= 3))) {
      add('WARN', G.size, `${p}: ${facts}. A reference page this long is hard to look things up in: split it into sub-pages, with a menu always one tap away`);
    } else if (long) {
      add('INFO', G.size, `${p}: ${facts}. Long, but its menu does not jump within it${!ahead ? ' and it is not growing' : !trusted ? ', and ' + g.changes + ' changes are too few to trust a forecast' : ''}, so it can stay one page for now`);
    } else if (ahead && ahead.screens >= LONG) {
      add('INFO', G.size, `${p}: ${facts}. Not long yet, but heading that way: plan its structure before it gets there`);
    } else {
      add('PASS', G.size, `${p}: ${facts}`);
    }
  }

  // ---------- Report ----------
  console.log(`\nNavigation map of ${o.live ? 'the live sites' : 'this working copy'} (design system: ${dsLive ? 'live' : o.ds})\n`);
  console.log('Page'.padEnd(46) + 'Taps from home  Links in  Onward  Crumbs  Phone screens');
  for (const p of paths) {
    const d = pages[p].space === 'ds' ? fromDs[p] : fromHome[p];
    const onward = new Set(pages[p].sizes.mobile.links.filter((l) => l.kind === 'internal' && l.visible && pages[l.to] && l.to !== p).map((l) => l.to)).size;
    console.log(`${(p + '  ' + pages[p].sizes.desktop.title).slice(0, 45).padEnd(46)}${String(d === undefined ? '-' : d).padEnd(16)}${String(inbound[p].size).padEnd(10)}${String(onward).padEnd(8)}${(pages[p].sizes.desktop.breadcrumb ? 'yes' : 'no').padEnd(8)}${Math.round(pages[p].sizes.mobile.height / SIZES.mobile.height)}`);
  }
  for (const g of Object.values(G)) {
    const rs = results.filter((r) => r.group === g);
    if (!rs.length) continue;
    console.log(`\n${g}`);
    const passes = rs.filter((r) => r.level === 'PASS');
    if (passes.length > 6) console.log(`PASS  ${passes.length} checks passed`);
    for (const r of rs) if (r.level !== 'PASS' || passes.length <= 6) console.log(`${r.level.padEnd(5)} ${r.msg}`);
  }
  const count = (lv) => results.filter((r) => r.level === lv).length;
  console.log(`\n${count('FAIL')} fail, ${count('WARN')} warn, ${count('PASS')} pass, ${count('INFO')} info across ${paths.length} pages`);

  fs.mkdirSync(path.dirname(o.json), { recursive: true });
  fs.writeFileSync(o.json, JSON.stringify({ generated: new Date().toISOString(), live: o.live, dsLive, pages, missing, results, crossLinks: { siteToDs: s2d, dsToSite: d2s } }, null, 1));
  console.log(`Full map saved to ${path.relative(process.cwd(), o.json)}`);

  await browser.close();
  if (srv) srv.server.close();
  process.exit(count('FAIL') ? 1 : 0);
})();
