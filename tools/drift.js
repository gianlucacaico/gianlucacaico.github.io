#!/usr/bin/env node
// Drift check: is this site still in step with its design system (gianlucacaico.com/design-system)?
// Reads the design system's published tokens (tokens.json) and compares them with the :root tokens in
// assets/css/site.css. It also checks the artwork template (tools/art/art.css), and lists colours in the
// site's rules, artwork template and project pictograms that are not tokens yet.
// The design system runs the same comparison from its side (its own tools/drift.js reads this site's
// live stylesheet), so a difference shows up whichever site changes first.
//
// Usage: node tools/drift.js                    this working copy against the live design system
//        node tools/drift.js --live             the live site against the live design system
//        node tools/drift.js --tokens <file|URL> compare against another tokens.json (a design system branch)
// Exit code: 0 in step, 1 drift found, 2 the design system's tokens could not be loaded.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TOKENS = 'https://gianlucacaico.com/design-system/tokens.json';
const LIVE_CSS = 'https://gianlucacaico.com/assets/css/site.css';

function load(src) {
  if (!/^https?:\/\//.test(src)) return fs.readFileSync(src, 'utf8');
  // curl goes through the session's network proxy, which Node's own fetch does not.
  return execFileSync('curl', ['-fsSL', '-m', '30', src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now()], { encoding: 'utf8' });
}
const norm = (v) => {
  const s = String(v).toLowerCase().replace(/\s+/g, '');
  const short = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  return short ? '#' + short[1] + short[1] + short[2] + short[2] + short[3] + short[3] : s;
};
// Custom properties declared in a stylesheet's :root blocks.
function rootVars(css) {
  const out = {};
  for (const block of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const decl of block[1].split(';')) {
      const m = decl.match(/^\s*--([\w-]+)\s*:\s*([\s\S]+?)\s*$/);
      if (m) out[m[1]] = m[2];
    }
  }
  return out;
}

const args = process.argv.slice(2);
const live = args.includes('--live');
const tokensSrc = args.includes('--tokens') ? args[args.indexOf('--tokens') + 1] : TOKENS;
const say = (tag, msg) => console.log(`${tag.padEnd(5)} ${msg}`);

// The design system's tokens, flattened: name -> { value, source } ("site", "artwork" or "kit").
let kit = {};
try {
  const json = JSON.parse(load(tokensSrc));
  for (const group of ['color', 'art', 'layout']) {
    for (const [name, t] of Object.entries(json[group] || {})) {
      const ext = (t.$extensions || {})['com.gianlucacaico.kit'] || {};
      kit[name] = { value: t.$value, source: ext.source || 'site' };
    }
  }
} catch (e) {
  say('SKIP', `Could not load the design system's tokens from ${tokensSrc}, so the drift check did not run`);
  process.exit(2);
}

const siteSrc = live ? LIVE_CSS : 'assets/css/site.css';
const siteCss = live ? load(LIVE_CSS) : fs.readFileSync(path.join(ROOT, 'assets/css/site.css'), 'utf8');
console.log(`Drift check: ${siteSrc} against the design system (${tokensSrc})`);

let drift = 0, matched = 0;
const site = rootVars(siteCss);
for (const [name, t] of Object.entries(kit)) {
  if (t.source !== 'site') continue;
  if (!(name in site)) { say('DRIFT', `--${name} is in the design system (${t.value}) but not on this site`); drift++; }
  else if (norm(site[name]) !== norm(t.value)) { say('DRIFT', `--${name}: this site has ${site[name]}, the design system has ${t.value}`); drift++; }
  else matched++;
}
for (const name of Object.keys(site)) {
  if (!(name in kit)) { say('DRIFT', `--${name} (${site[name]}) is on this site but not in the design system`); drift++; }
}
if (matched) say('OK', `${matched} site tokens match the design system`);

// The artwork template's tokens must agree with the design system's, whatever their source.
const artCss = path.join(ROOT, 'tools/art/art.css');
if (!live && fs.existsSync(artCss)) {
  let same = 0;
  for (const [name, value] of Object.entries(rootVars(fs.readFileSync(artCss, 'utf8')))) {
    if (!(name in kit)) { say('INFO', `tools/art/art.css has --${name} (${value}), which is not in the design system`); continue; }
    if (norm(value) !== norm(kit[name].value)) { say('DRIFT', `tools/art/art.css says --${name} is ${value}, the design system says ${kit[name].value}`); drift++; }
    else same++;
  }
  if (same) say('OK', `${same} artwork template tokens match the design system`);
}

// Colours written straight into rules or drawings rather than as tokens: candidates for the design system.
const known = new Set(Object.values(kit).map((t) => norm(t.value)));
function loose(text) {
  const counts = {};
  const rules = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root\s*\{[^}]*\}/g, '');
  for (const m of rules.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    const c = norm(m[0]);
    if (!known.has(c)) counts[c] = (counts[c] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c.toUpperCase()} (${n})`).join(', ');
}
const siteLoose = loose(siteCss);
if (siteLoose) say('INFO', `Colours in the stylesheet that are not tokens yet: ${siteLoose}`);
if (!live) {
  const picDir = path.join(ROOT, 'assets/img/work');
  for (const f of fs.existsSync(picDir) ? fs.readdirSync(picDir).filter((f) => f.endsWith('.svg')).sort() : []) {
    const l = loose(fs.readFileSync(path.join(picDir, f), 'utf8'));
    if (l) say('INFO', `Colours in assets/img/work/${f} that are not tokens yet: ${l}`);
  }
}

if (drift) {
  console.log(`\n${drift} difference(s) between this site and the design system. Ask Gianluca which side is right:`);
  console.log('- If this site is right, the design system follows: update _data/kit.yml in gianlucacaico/design-system, on its own review page.');
  console.log('- If the design system is right, change this site to match before publishing.');
} else console.log('\nIn step: every site token matches the design system.');
process.exit(drift ? 1 : 0);
