#!/usr/bin/env node
// Turn the artwork in tools/art/ into the site's images.
//
//   node tools/art.js            render everything
//   node tools/art.js <name>...  render only these (file names in tools/art without .html)
//
// Post artwork (tools/art/<slug>.html, <body data-kind="post">) becomes three files in assets/img/blog/:
//   <slug>.webp     2400 x 1260  banner on the post page and the blog page's featured card
//   <slug>-sm.webp   720 x 378   thumbnail in post lists
//   <slug>.jpg      1200 x 630   link preview (LinkedIn, iMessage, Slack...)
// Page artwork (<body data-kind="share">) becomes assets/img/share/<name>.jpg, a link preview only.
// Posts are rendered before pages, because the Blog page's preview shows the post artwork.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ROOT, serveDir, useLocalInter } = require('./lib');

const ART = path.join(__dirname, 'art');
const W = 1200, H = 630;

(async () => {
  const wanted = process.argv.slice(2);
  const all = fs.readdirSync(ART).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
  const names = wanted.length ? wanted : all;
  for (const n of names) if (!all.includes(n)) { console.error(`No artwork called "${n}" in tools/art`); process.exit(1); }
  const kindOf = (n) => (fs.readFileSync(path.join(ART, n + '.html'), 'utf8').match(/data-kind="(\w+)"/) || [])[1] || 'post';
  names.sort((a, b) => (kindOf(a) === 'post' ? 0 : 1) - (kindOf(b) === 'post' ? 0 : 1));

  const { server, url } = await serveDir(ROOT);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await useLocalInter(context);
  const page = await context.newPage();

  for (const name of names) {
    const kind = kindOf(name);
    await page.goto(url + 'tools/art/' + name + '.html', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const font = await page.evaluate(() => document.fonts.check('700 16px Inter'));
    if (!font) console.warn(`WARN ${name}: Inter did not load`);
    const png = await page.screenshot({ type: 'png' });

    // Resize and encode in the browser itself, so no extra image software is needed.
    const outputs = kind === 'post'
      ? [[`blog/${name}.webp`, 2400, 'image/webp', 0.86], [`blog/${name}-sm.webp`, 720, 'image/webp', 0.82], [`blog/${name}.jpg`, 1200, 'image/jpeg', 0.9]]
      : [[`share/${name}.jpg`, 1200, 'image/jpeg', 0.9]];
    const encoded = await page.evaluate(async ({ b64, outputs }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      return outputs.map(([, w, type, q]) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = Math.round(w * img.height / img.width);
        const x = c.getContext('2d');
        x.imageSmoothingQuality = 'high';
        x.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL(type, q).split(',')[1];
      });
    }, { b64: png.toString('base64'), outputs });

    outputs.forEach(([rel], i) => {
      const file = path.join(ROOT, 'assets/img', rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(encoded[i], 'base64'));
      console.log(`OK   assets/img/${rel} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
    });
  }
  await browser.close();
  server.close();
})();
