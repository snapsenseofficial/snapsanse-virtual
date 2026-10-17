#!/usr/bin/env node
// SnapSense IG pack v2 renderer.
//   node crew/tools/igposter/render.js     every date in <data>/content-en/*.json -> <data>/out2/
//   --only 2026-10-13[,..]  --dept sales  --out dir  --html  --style noir (force one style, for previews)
const fs = require('fs');
const path = require('path');
const T = require('./templates');
const { enrich } = require('./enrich');

const ROOT = process.env.IGPACK_DATA || path.resolve(__dirname, '..', '..', 'data', 'igpack');
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const vals = (f) => argv.flatMap((a, i) => (a === f && argv[i + 1] ? argv[i + 1].split(',') : []));
const OUT = path.resolve(ROOT, vals('--out')[0] || 'out2');
const ONLY = new Set(vals('--only'));
const ONLY_DEPT = new Set(vals('--dept'));
const FORCE = vals('--style')[0];
const DEPT_ORDER = ['authenticity', 'awareness', 'trust', 'sales'];

function load() {
  const all = [];
  for (const dept of DEPT_ORDER) {
    // posters print the English copy (content-en/) when it exists; captions inside it stay Malay
    const en = path.join(ROOT, 'content-en', `${dept}.json`);
    const src = !flag('--ms') && fs.existsSync(en) ? en : path.join(ROOT, 'content', `${dept}.json`);
    const arr = JSON.parse(fs.readFileSync(src, 'utf8'));
    for (const it of arr) if (it && it.date) all.push(enrich({ ...it, dept }));
  }
  return all;
}

(async () => {
  let items = load();
  if (ONLY.size) items = items.filter((x) => ONLY.has(x.date));
  if (ONLY_DEPT.size) items = items.filter((x) => ONLY_DEPT.has(x.dept));
  let pw;
  try { pw = require('playwright'); } catch (_) { pw = require('/opt/node-tools/node_modules/playwright'); }
  const { chromium } = pw;
  const browser = await chromium.launch();
  const jobs = [];
  for (const it of items) {
    const base = path.join(OUT, it.date, `${T.DEPTS[it.dept].n}-${it.dept}`);
    jobs.push({ it, fmt: 'feed', out: `${base}-feed.jpg` });
    if (it.story) jobs.push({ it, fmt: 'story', out: `${base}-story.jpg` });
  }
  const warns = [];
  let next = 0, done = 0;
  const t0 = Date.now();
  async function worker() {
    const pages = {};
    for (const fmt of ['feed', 'story']) {
      const { W, H } = T.SIZES[fmt];
      const ctx = await browser.newContext({ viewport: { width: W, height: H } });
      pages[fmt] = await ctx.newPage();
      pages[fmt].on('pageerror', (e) => console.error('pageerror', String(e)));
    }
    while (next < jobs.length) {
      const j = jobs[next++];
      const pg = pages[j.fmt];
      fs.mkdirSync(path.dirname(j.out), { recursive: true });
      const html = j.fmt === 'feed' ? T.renderFeed(j.it, { style: FORCE }) : T.renderStory(j.it, { style: FORCE });
      if (flag('--html')) fs.writeFileSync(j.out.replace(/\.jpg$/, '.html'), html);
      await pg.setContent(html, { waitUntil: 'load' });
      await pg.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 20000 });
      (await pg.evaluate(() => window.__fit || [])).forEach((r) => warns.push(`${j.it.date} ${j.it.dept} ${j.fmt} ${r.field}: ${r.kind}`));
      await pg.screenshot({ path: j.out, type: 'jpeg', quality: 92 });
      if (++done % 24 === 0) console.log(`  ${done}/${jobs.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, worker));
  await browser.close();
  console.log(`rendered ${done} in ${((Date.now() - t0) / 1000).toFixed(1)}s; ${warns.length} warnings`);
  warns.forEach((w) => console.log('  WARN ' + w));
  // captions
  for (const it of items) {
    const dir = path.join(OUT, it.date);
    const f = path.join(dir, 'caption.txt');
    const prev = fs.existsSync(f) && fs.statSync(f).mtimeMs > t0 ? fs.readFileSync(f, 'utf8') : '';
    const cap = T.prepare(it, 'feed', { style: FORCE });
    fs.writeFileSync(f, prev + `=== ${T.DEPTS[it.dept].n}-${it.dept} ===\n${cap.caption || ''}\n\n${cap.hashtags || ''}\n\n`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
