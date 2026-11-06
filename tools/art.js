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
// Project artwork (<body data-kind="work">, 1040 x 400) becomes assets/img/work/<name>.webp, the art on a Work page card.
// Page artwork (<body data-kind="share">) becomes assets/img/share/<name>.jpg, a link preview only.
// Posts and projects are rendered before pages, because the Blog and Work previews show their artwork.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ROOT, serveDir, useLocalInter } = require('./lib');

const ART = path.join(__dirname, 'art');
const SIZE = { post: [1200, 630], share: [1200, 630], work: [1040, 400] };

(async () => {
  const wanted = process.argv.slice(2);
  const all = fs.readdirSync(ART).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
  const names = wanted.length ? wanted : all;
  for (const n of names) if (!all.includes(n)) { console.error(`No artwork called "${n}" in tools/art`); process.exit(1); }
  const kindOf = (n) => (fs.readFileSync(path.join(ART, n + '.html'), 'utf8').match(/data-kind="(\w+)"/) || [])[1] || 'post';
  names.sort((a, b) => (kindOf(a) === 'share' ? 1 : 0) - (kindOf(b) === 'share' ? 1 : 0));

  const { server, url } = await serveDir(ROOT);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await useLocalInter(context);
  const page = await context.newPage();

  for (const name of names) {
    const kind = kindOf(name);
    await page.setViewportSize({ width: SIZE[kind][0], height: SIZE[kind][1] });
    await page.goto(url + 'tools/art/' + name + '.html', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const font = await page.evaluate(() => document.fonts.check('700 16px Inter'));
    if (!font) console.warn(`WARN ${name}: Inter did not load`);
    const png = await page.screenshot({ type: 'png' });

    // Resize and encode in the browser itself, so no extra image software is needed.
    const outputs = {
      post: [[`blog/${name}.webp`, 2400, 'image/webp', 0.86], [`blog/${name}-sm.webp`, 720, 'image/webp', 0.82], [`blog/${name}.jpg`, 1200, 'image/jpeg', 0.9]],
      work: [[`work/${name}.webp`, 1040, 'image/webp', 0.86]],
      share: [[`share/${name}.jpg`, 1200, 'image/jpeg', 0.9]],
    }[kind];
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
