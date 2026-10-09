// node shot.js <built.html> <out.png> [tab] [width] [dark] [seedJsonFile]
// Opens the built page from file://, optional localStorage seed {collection:{id:doc}}, screenshots full page, prints JS errors.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const [file, out, tab, w, dark, seed] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w || 1280, height: 900 }, colorScheme: dark === 'dark' ? 'dark' : 'light' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
  const url = 'file://' + path.resolve(file);
  if (seed) {
    await ctx.addInitScript((d) => { try { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('snapsense-hq-local', d); sessionStorage.setItem('seeded', '1'); } } catch (e) {} }, fs.readFileSync(seed, 'utf8'));
  }
  await p.goto(url + (tab ? '#' + tab : ''));
  await p.waitForTimeout(1200);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await p.screenshot({ path: out, fullPage: true });
  console.log(JSON.stringify({ errors: errs, horizontalOverflow: overflow }));
  await b.close();
})();
