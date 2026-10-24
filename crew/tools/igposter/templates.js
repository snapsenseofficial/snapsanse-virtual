// SnapSense IG pack v2 — editorial / typographic poster system.
// Five styles, chosen per department + layout + day so the grid alternates:
//   paper     minimalist Swiss: warm paper, giant tight grotesk, serif-italic accent word, hairlines, mono metadata
//   noir      black, condensed caps (Anton), serif-italic accent word, giant outline word behind
//   film      35mm strip: sprocket holes, edge markings, serif headline inside the frame (BTS / raw)
//   block     full-bleed department colour, giant cropped numerals / price
//   editorial magazine cover: Bodoni masthead, issue line, roman + italic headline, centred
// When a photo exists for the item's category (../photos/<cat>/*.jpg) the poster becomes photo-led
// (full-bleed cover, or split photo/paper for the paper style).
const fs = require('fs');
const path = require('path');

// Data (content, photos, research) lives outside git: crew/data/igpack, or IGPACK_DATA.
const ROOT = process.env.IGPACK_DATA || path.resolve(__dirname, '..', '..', 'data', 'igpack');
const FONTS = path.join(__dirname, 'fonts');
const LOGO = fs.existsSync(path.join(ROOT, 'assets', 'logo.png')) ? path.join(ROOT, 'assets', 'logo.png') : path.resolve(__dirname, '..', '..', '..', 'hq', 'logo.png');
const PHOTOS = process.env.PHOTOS_DIR || path.join(ROOT, 'photos');
const SIZES = { feed: { W: 1080, H: 1350 }, story: { W: 1080, H: 1920 } };
const PERIOD_START = '2026-10-13';
const PERIOD_DAYS = 27;

/* ---------------------------------------------------------------- assets */
const b64 = (p) => fs.readFileSync(p).toString('base64');
let _fonts = null;
function fontCss() {
  if (_fonts) return _fonts;
  const face = (fam, file, w = 400, st = 'normal') =>
    `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${b64(path.join(FONTS, file))}) format('woff2');font-weight:${w};font-style:${st}}`;
  _fonts = [
    face('Anton', 'anton-latin-400-normal.woff2'),
    face('Instrument', 'instrument-serif-latin-400-normal.woff2'),
    face('Instrument', 'instrument-serif-latin-400-italic.woff2', 400, 'italic'),
    ...[400, 500, 700].flatMap((w) => [face('Bodoni', `bodoni-moda-latin-${w}-normal.woff2`, w), face('Bodoni', `bodoni-moda-latin-${w}-italic.woff2`, w, 'italic')]),
    ...[300, 400, 500, 600, 700, 800].map((w) => face('Inter', `inter-tight-latin-${w}-normal.woff2`, w)),
    face('Archivo', 'archivo-black-latin-400-normal.woff2'),
    face('Mono', 'space-mono-latin-400-normal.woff2'),
    face('Mono', 'space-mono-latin-700-normal.woff2', 700),
  ].join('\n');
  return _fonts;
}
let _logo = null;
const logoUri = () => (_logo ||= `data:image/png;base64,${b64(LOGO)}`);

/* ---------------------------------------------------------------- photos */
const PHOTO_CATS = [
  ['auto', /\bbikes?\b|\bmotor|kereta|car\b|car shoot|bengkel|showroom|rim\b|rolling|automotif|modified/i],
  ['wedding', /bride|groom|kahwin|nikah|sanding|tunang|pengantin|wedding|pelamin|bridal|majlis perkahwinan/i],
  ['convo', /konvo|graduan|graduat|convo/i],
  ['product', /produk|product|shopee|tiktok shop|jenama|brand/i],
  ['event', /event|majlis korporat|launching|liputan/i],
  ['maternity', /maternity|mengandung|bersalin/i],
  ['raya', /raya|deepavali|perayaan/i],
  ['profile', /portrait|family|potret|profile|model|portfolio|keluarga/i],
];
const PKG_CAT = [[/^(wed|pre|addon)/, 'wedding'], [/^au-/, 'auto'], [/^konvo/, 'convo'], [/^prod/, 'product'], [/^ev-/, 'event'], [/^pot/, 'profile']];
function photoCat(item) {
  // the post's package decides first; keywords only when no package is known
  for (const [re, cat] of PKG_CAT) if (re.test(item.pkg || '')) return cat;
  const f = item.feed || {};
  const txt = [f.eyebrow, f.headline, f.sub, item.caption].join(' ');
  for (const [cat, re] of PHOTO_CATS) if (re.test(txt)) return cat;
  return 'studio';
}
const _plist = new Map();
function photoList(cat) {
  if (_plist.has(cat)) return _plist.get(cat);
  const dir = path.join(PHOTOS, cat);
  const l = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('.') && !f.includes('.cut.')).sort().map((f) => path.join(dir, f)) : [];
  _plist.set(cat, l);
  return l;
}
let _meta = null;
const photoMeta = (file) => ((_meta ||= fs.existsSync(path.join(PHOTOS, 'meta.json')) ? JSON.parse(fs.readFileSync(path.join(PHOTOS, 'meta.json'), 'utf8')) : {})[file] || {});
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
function photoFor(item, fmt) {
  if (item.noPhoto) return null;
  const cat = photoCat(item);
  let l = photoList(cat);
  if (!l.length && cat === 'studio') l = photoList('profile');
  if (cat === 'auto') {
    const f = item.feed || {};
    const pricey = fmt === 'feed' && (f.layout === 'price' || (f.items || []).some((x) => /RM\s?\d/.test(x.value || ''))) || /RM\s?\d/.test(JSON.stringify(fmt === 'story' ? item.story || {} : f));
    const cars = l.filter((x) => !path.basename(x).startsWith('m'));
    if (pricey && cars.length) l = cars;
  }
  if (!l.length) return null;
  const pin = ((fmt === 'feed' ? item.feed : item.story) || {}).photo;
  const pinned = pin && l.find((x) => path.basename(x) === pin);
  const n = DEPTS[item.dept] ? DEPTS[item.dept].n : 0;
  const p = pinned || l[(dayIndex(item.date) + n * 2 + (fmt === 'story' ? Math.ceil(l.length / 2) : 0)) % l.length];
  const ext = path.extname(p).slice(1).toLowerCase().replace('jpg', 'jpeg');
  const cutP = p.replace(/\.[^.]+$/, '.cut.png');
  const m = photoMeta(path.basename(p));
  const useCut = fs.existsSync(cutP) && m.coverage > 0.14 && m.coverage < 0.6;
  return { uri: `data:image/${ext};base64,${b64(p)}`, cut: useCut ? `data:image/png;base64,${b64(cutP)}` : null, file: path.basename(p), bright: (m.topLum || 0) > 0.62 };
}

/* ---------------------------------------------------------------- text */
// date labels like '17 Okt Sab' or '12.12.26 Sab' -> { day, mon, wd, rest }
const MONTHS = { jan: 'Jan', feb: 'Feb', mac: 'Mac', mar: 'Mac', apr: 'Apr', mei: 'Mei', may: 'Mei', jun: 'Jun', jul: 'Jul', ogo: 'Ogo', aug: 'Ogo', sep: 'Sep', okt: 'Okt', oct: 'Okt', nov: 'Nov', dis: 'Dis', dec: 'Dis' };
const DAY3 = { isn: 'Isn', sel: 'Sel', rab: 'Rab', kha: 'Kha', jum: 'Jum', sab: 'Sab', ahd: 'Ahd', aha: 'Ahd' };
function parseDateLabel(s) {
  const t = String(s || '');
  const m = t.match(/(\d{1,2}(?:\s*[–\-&]\s*\d{1,2})*)\s*(?:\.|\s)?\s*(Jan|Feb|Mac|Mar|Apr|Mei|May|Jun|Jul|Ogo|Aug|Sep|Okt|Oct|Nov|Dis|Dec)[a-z]*/i)
    || t.match(/\b(\d{1,2})\.(\d{1,2})(?:\.\d{2,4})?\b/);
  if (!m) return null;
  let day = m[1].replace(/\s+/g, ''), mon;
  if (/^\d+$/.test(m[2] || '')) mon = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'][+m[2] - 1];
  else mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (!mon) return null;
  const w = t.match(/\b(Isnin|Selasa|Rabu|Khamis|Jumaat|Sabtu|Ahad|Isn|Sel|Rab|Kha|Jum|Sab|Ahd)\b/i);
  const dotted = /^\d/.test(m[0]) && /^\d{1,2}\.\d{1,2}/.test(m[0]);
  let wdc = '';
  const y = t.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\b/);
  if (y) { const dd = new Date(Date.UTC(y[3].length === 2 ? 2000 + +y[3] : +y[3], +y[2] - 1, +y[1])); if (!isNaN(dd)) wdc = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'][dd.getUTCDay()]; }
  const rest = t.replace(m[0], '').replace(w ? w[0] : '', '').replace(/^[\s·,\-–:]+|[\s·,\-–:]+$/g, '').trim();
  return { day: day.replace(/-/g, '–'), mon, wd: w ? DAY3[w[1].slice(0, 3).toLowerCase()] : wdc, rest: rest || (dotted ? t.trim() : '') };
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const has = (s) => s != null && String(s).trim() !== '';
const pad2 = (n) => String(n).padStart(2, '0');
const rich = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const fmtAmount = (a) => (/^\d{4,}$/.test(String(a)) ? Number(a).toLocaleString('en-US') : String(a ?? ''));
// Headline with one accent word: *marked* words, else the last word (or last two when the last is tiny).
function emph(s) {
  const t = String(s || '').trim();
  if (t.includes('*')) return rich(t);
  const w = t.split(/\s+/);
  if (w.length < 2) return esc(t);
  let n = 1;
  if (w[w.length - 1].replace(/[^\p{L}\p{N}]/gu, '').length <= 3 && w.length > 2) n = 2;
  return `${esc(w.slice(0, -n).join(' '))} <em>${esc(w.slice(-n).join(' '))}</em>`;
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_EN = { Jan: 'Jan', Feb: 'Feb', Mac: 'Mar', Apr: 'Apr', Mei: 'May', Jun: 'Jun', Jul: 'Jul', Ogo: 'Aug', Sep: 'Sep', Okt: 'Oct', Nov: 'Nov', Dis: 'Dec' };
const WD_EN = { Isn: 'Mon', Sel: 'Tue', Rab: 'Wed', Kha: 'Thu', Jum: 'Fri', Sab: 'Sat', Ahd: 'Sun' };
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayIndex = (date) => Math.max(0, Math.round((Date.parse(date) - Date.parse(PERIOD_START)) / 864e5));

/* ---------------------------------------------------------------- departments + palettes */
const DEPTS = {
  authenticity: { n: 1, name: 'Authenticity', acc: '#C4602A', dark: '#E58A52', deep: '#1E3125' },
  awareness: { n: 2, name: 'Awareness', acc: '#FF5A1F', dark: '#FF6B2E', deep: '#FF5A1F' },
  trust: { n: 3, name: 'Trust', acc: '#2347D9', dark: '#8EA2FF', deep: '#2347D9' },
  sales: { n: 4, name: 'Sales', acc: '#8E1B2C', dark: '#D8B47A', deep: '#65101E' },
};
function palette(dept, style) {
  const d = DEPTS[dept];
  const light = (bg) => ({ bg, ink: '#141312', mute: 'rgba(20,19,18,.64)', rule: 'rgba(20,19,18,.22)', acc: d.acc, logo: 'brightness(0)', dark: 0 });
  const dark = (bg, acc) => ({ bg, ink: '#F2EDE4', mute: 'rgba(242,237,228,.62)', rule: 'rgba(242,237,228,.2)', acc, logo: 'none', dark: 1 });
  if (style === 'paper') return light('#ECE8E0');
  if (style === 'editorial') return light('#F3EEE6');
  if (style === 'noir') return dark('#0E0E0E', d.dark);
  if (style === 'film') return dark('#090909', d.dark);
  // reference-led styles (photo-first)
  if (style === 'impact') return { bg: '#0E0F0C', ink: '#F3F3EE', mute: 'rgba(243,243,238,.64)', rule: 'rgba(243,243,238,.18)', acc: '#C8F135', logo: 'none', dark: 1 };
  if (style === 'street') return { bg: '#0B0B0C', ink: '#F4F4F0', mute: 'rgba(244,244,240,.74)', rule: 'rgba(244,244,240,.28)', acc: '#FF3B2F', logo: 'none', dark: 1 };
  if (style === 'portrait') return { bg: '#0D0D0D', ink: '#F6F1E8', mute: 'rgba(246,241,232,.8)', rule: 'rgba(246,241,232,.32)', acc: DEPTS[dept].dark, logo: 'none', dark: 1 };
  if (style === 'ivory') return { bg: '#1A1512', ink: '#FBF6EE', mute: 'rgba(251,246,238,.82)', rule: 'rgba(251,246,238,.35)', acc: '#EBD5AA', logo: 'none', dark: 1 };
  // block
  if (dept === 'awareness') return { bg: d.deep, ink: '#0F0F0F', mute: 'rgba(15,15,15,.72)', rule: 'rgba(15,15,15,.3)', acc: '#FFF4E8', logo: 'brightness(0)', dark: 0 };
  return { ...dark(d.deep, dept === 'sales' ? '#E6C590' : dept === 'trust' ? '#FFD9A8' : '#EE9A5F'), ink: '#F6F0E6', mute: 'rgba(246,240,230,.72)', rule: 'rgba(246,240,230,.3)' };
}

// Style per department/layout; the list rotates by day so neighbours differ on the grid.
const FEED_PLAN = {
  authenticity: { quote: ['film', 'editorial'], announce: ['film', 'paper'], steps: ['paper', 'film'], list: ['film', 'paper'], tip: ['paper', 'film'], price: ['editorial'], faq: ['paper'], hook: ['film'], dates: ['paper'] },
  awareness: { hook: ['noir', 'block'], tip: ['block', 'noir', 'paper'], list: ['noir', 'paper'], faq: ['paper', 'noir'], dates: ['block'], quote: ['noir'], price: ['block'], announce: ['block'], steps: ['noir'] },
  trust: { steps: ['paper'], quote: ['editorial'], faq: ['paper', 'editorial'], list: ['paper', 'editorial', 'block'], tip: ['block', 'paper'], announce: ['editorial', 'block'], hook: ['editorial'], dates: ['paper'], price: ['editorial'] },
  sales: { list: ['editorial', 'noir', 'block'], price: ['block', 'editorial', 'noir'], dates: ['editorial'], announce: ['editorial'], quote: ['editorial'], hook: ['noir'], tip: ['noir'], faq: ['editorial'], steps: ['editorial'] },
};
const STORY_PLAN = { authenticity: ['film', 'paper'], awareness: ['block', 'noir'], trust: ['paper', 'block'], sales: ['noir', 'editorial'] };
function styleFor(item, fmt) {
  const i = dayIndex(item.date);
  const pk = item.pkg || '';
  const lay = fmt === 'feed' ? item.feed.layout : (item.story || {}).layout;
  const hasPh = !item.noPhoto && photoList(photoCat(item)).length > 0;
  if (/^cc-/.test(pk)) return 'impact';
  const hasAnyPh = !item.noPhoto && (photoList(photoCat(item)).length > 0 || (photoCat(item) === 'studio' && photoList('profile').length > 0));
  if (hasAnyPh && /^prod-/.test(pk) && (fmt === 'story' || ['price', 'announce', 'hook', 'quote'].includes(lay))) return 'portrait';
  if (hasAnyPh && /^pot-/.test(pk) && (fmt === 'story' || ['price', 'announce', 'hook', 'quote'].includes(lay))) return 'portrait';
  if (hasAnyPh && !pk && photoCat(item) === 'studio' && i % 2 === 0 && (fmt === 'story' ? ['announce', 'question', 'tip'].includes(lay) : ['hook', 'announce', 'quote'].includes(lay))) return 'portrait';
  if (hasPh && /^au-/.test(pk) && (fmt === 'story' || !['faq', 'steps'].includes(lay))) return 'street';
  if (hasPh && /^(wed|konvo|pre|addon)/.test(pk) && (fmt === 'story' || ['list', 'price', 'announce', 'hook', 'quote', 'dates'].includes(lay))) return 'ivory';
  if (fmt === 'story') { const a = STORY_PLAN[item.dept]; return a[i % a.length]; }
  const a = (FEED_PLAN[item.dept] || FEED_PLAN.sales)[item.feed.layout] || ['paper'];
  return a[i % a.length];
}

/* ---------------------------------------------------------------- CSS */
const GRAIN = (op) => `background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");opacity:${op}`;

function css(dept, style, fmt, P, photo) {
  const { W, H } = SIZES[fmt];
  const S = fmt === 'story';
  const M = 72; // side margin
  // vertical frame: [top meta] [stage] [bottom meta]
  const topY = S ? 250 : 58, botY = S ? 1665 : H - 58; // story: clear of IG's top/bottom UI
  const stageTop = S ? 370 : 150, stageBot = S ? 1550 : H - 150;
  const film = style === 'film';
  const fx = film ? 112 : M; // film: content sits inside the frame
  const hl = {
    paper: `font-family:'Inter';font-weight:800;letter-spacing:-.055em;line-height:.9`,
    noir: `font-family:'Anton';font-weight:400;letter-spacing:-.005em;line-height:.9;text-transform:uppercase`,
    block: `font-family:'Anton';font-weight:400;letter-spacing:-.005em;line-height:.9;text-transform:uppercase`,
    film: `font-family:'Instrument';font-weight:400;letter-spacing:-.025em;line-height:.92`,
    editorial: `font-family:'Bodoni';font-weight:500;letter-spacing:-.035em;line-height:.96`,
    impact: `font-family:'Anton';font-weight:400;letter-spacing:0;line-height:.92;text-transform:uppercase`,
    street: `font-family:'Archivo';letter-spacing:-.025em;line-height:.92;text-transform:uppercase`,
    ivory: `font-family:'Bodoni';font-weight:500;letter-spacing:.03em;line-height:1.02;text-transform:uppercase`,
    portrait: `font-family:'Inter';font-weight:800;letter-spacing:-.045em;line-height:.92`,
  }[style];
  const em = {
    paper: `color:var(--acc)`,
    noir: `color:var(--acc);font-style:normal`,
    block: `color:var(--acc);font-style:normal`,
    film: `font-style:normal;color:var(--acc)`,
    editorial: `font-style:normal;color:var(--acc)`,
    impact: `color:var(--acc);font-style:normal`,
    street: `color:var(--acc);font-style:normal`,
    ivory: `font-style:normal;color:var(--acc)`,
    portrait: `font-style:normal;color:var(--acc)`,
  }[style];
  return `
:root{--bg:${P.bg};--ink:${P.ink};--mute:${P.mute};--rule:${P.rule};--acc:${P.acc}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--bg)}
body{position:relative;color:var(--ink);font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;font-variant-numeric:lining-nums}
.grain{position:absolute;inset:0;${GRAIN(P.dark ? 0.1 : 0.16)};mix-blend-mode:${P.dark ? 'screen' : 'multiply'};pointer-events:none;z-index:5}
.mono{font-family:'Mono',monospace;text-transform:uppercase;letter-spacing:.12em}
.meta{position:absolute;left:${fx}px;right:${fx}px;display:flex;align-items:center;justify-content:space-between;gap:24px;font-family:'Mono';font-size:${S ? 22 : 19}px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink);z-index:6;white-space:nowrap}
.meta.top{top:${topY}px}
.meta.bot{top:${botY}px;transform:translateY(-100%)}
.meta .logo{height:${S ? 26 : 22}px;filter:${P.logo};display:block}
.meta .dim{color:var(--mute)}
.meta.bot .cta{font-family:'Inter';font-weight:600;font-size:${S ? 32 : 27}px;letter-spacing:-.01em;text-transform:none;white-space:normal;line-height:1.15;max-width:72%}
.meta.bot .cta b{font-weight:700;font-family:'Inter';margin-right:12px;color:var(--acc)}
.hair{position:absolute;left:${fx}px;right:${fx}px;height:1.5px;background:var(--rule);z-index:6}
.stage{position:absolute;left:${fx}px;right:${fx}px;top:${stageTop}px;height:${stageBot - stageTop}px;display:flex;flex-direction:column;overflow:hidden;z-index:4}
.stage>*{flex:none}
.sp{flex:1 1 auto !important;min-height:0}
.eb{font-family:'Mono';font-size:${S ? 24 : 20}px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);display:flex;gap:16px;align-items:center;margin-bottom:${S ? 40 : 30}px}
.eb .k{color:var(--acc)}
.eb .ln{flex:0 0 64px;height:1.5px;background:currentColor;opacity:.5}
.hl{${hl};color:var(--ink);overflow-wrap:normal;word-break:normal;hyphens:none}
.hl em{font-style:normal;${em}}
.sub{font-family:'Inter';font-weight:400;font-size:${S ? 36 : 30}px;line-height:1.3;letter-spacing:-.01em;color:var(--mute);margin-top:${S ? 36 : 28}px;max-width:${S ? 860 : 820}px}
.note{font-family:'Mono';font-size:${S ? 19 : 16}px;letter-spacing:.06em;color:var(--mute);margin-top:22px;text-transform:none}
.badge{display:inline-flex;align-items:center;gap:12px;font-family:'Mono';font-size:${S ? 22 : 18}px;letter-spacing:.16em;text-transform:uppercase;color:var(--acc);margin-bottom:22px}
.badge:before{content:'';width:12px;height:12px;border-radius:50%;background:var(--acc)}
/* rows */
.rows{border-top:1.5px solid var(--ink)}
.r{display:flex;align-items:baseline;gap:22px;padding:${S ? 26 : 20}px 0;border-bottom:1.5px solid var(--rule)}
.r .n{font-family:'Mono';font-size:${S ? 21 : 18}px;letter-spacing:.08em;color:var(--acc);flex:none;width:${S ? 54 : 46}px}
.r .t{font-family:'Inter';font-weight:500;font-size:${S ? 36 : 31}px;line-height:1.2;letter-spacing:-.015em;flex:1}
.r .v{font-family:'Inter';font-weight:700;font-size:${S ? 36 : 31}px;letter-spacing:-.02em;white-space:nowrap;flex:none}
.r .t small{display:block;font-weight:400;color:var(--mute);font-size:.8em;margin-top:6px;line-height:1.3}
/* steps: big numerals */
.steps .r{align-items:center;gap:30px}
.steps .r .n{font-family:'Anton';font-size:${S ? 96 : 76}px;line-height:1;letter-spacing:0;width:auto;min-width:${S ? 110 : 88}px;color:var(--acc)}
/* faq */
.qa{padding:${S ? 26 : 20}px 0;border-bottom:1.5px solid var(--rule);display:grid;grid-template-columns:${S ? 58 : 48}px 1fr;column-gap:16px;row-gap:8px}
.qa .k{font-family:'Mono';font-size:${S ? 21 : 18}px;color:var(--acc);padding-top:6px}
.qa .q{font-family:'Inter';font-weight:700;font-size:${S ? 35 : 30}px;line-height:1.2;letter-spacing:-.02em}
.qa .a{font-family:'Inter';font-weight:400;font-size:${S ? 30 : 26}px;line-height:1.3;color:var(--mute)}
/* dates */
.dt{display:flex;align-items:center;gap:30px;padding:${S ? 20 : 14}px 0;border-bottom:1.5px solid var(--rule)}
.dt .d{font-family:'Anton';font-size:${S ? 120 : 92}px;line-height:.9;color:var(--acc);min-width:${S ? 150 : 120}px}
.dt .m{font-family:'Mono';font-size:${S ? 21 : 18}px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);margin-bottom:6px}
.dt .l{font-family:'Inter';font-weight:600;font-size:${S ? 34 : 29}px;line-height:1.2;letter-spacing:-.015em}
/* price */
.price{display:flex;align-items:flex-start;line-height:.8;margin-top:${S ? 30 : 18}px}
.price .cur{font-family:'Mono';font-size:${S ? 40 : 34}px;letter-spacing:.06em;margin-top:.3em;margin-right:14px;color:var(--acc)}
.price .amt{font-family:'Anton';font-size:${S ? 400 : 300}px;letter-spacing:-.01em;line-height:.82}
.price .unit{font-family:'Inter';font-weight:500;font-size:${S ? 60 : 50}px;align-self:flex-end;margin-left:14px;color:var(--mute)}
.pnote{font-family:'Mono';font-size:${S ? 22 : 19}px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);margin:${S ? 44 : 36}px 0 ${S ? 30 : 22}px}
.inc .r{padding:${S ? 16 : 12}px 0}
.inc .r .n{color:var(--acc);font-family:'Inter';font-weight:300;font-size:${S ? 36 : 30}px;width:28px}
.inc .r .t{font-size:${S ? 30 : 26}px;font-weight:500}
/* quote */
.qg{font-family:'Instrument';font-size:${S ? 420 : 340}px;line-height:.62;height:${S ? 200 : 160}px;margin-top:10px;color:var(--acc);margin-left:-8px}
.hl.quote{font-family:'Bodoni';font-style:normal;font-weight:500;text-transform:none;letter-spacing:-.03em;line-height:1}
.hl.quote em{font-style:normal;color:var(--acc);-webkit-text-stroke:0}
.attr{font-family:'Mono';font-size:${S ? 22 : 19}px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-top:${S ? 40 : 30}px;max-width:860px;line-height:1.5}
/* story parts */
.box{border:1.5px solid var(--ink);padding:34px 36px;display:flex;flex-direction:column;gap:18px}
.box .k{font-family:'Mono';font-size:21px;letter-spacing:.16em;text-transform:uppercase;color:var(--acc)}
.box .p{font-family:'Inter';font-weight:600;font-size:40px;line-height:1.2;letter-spacing:-.02em}
.box .f{font-family:'Mono';font-size:21px;letter-spacing:.1em;color:var(--mute);border-top:1.5px dashed var(--rule);padding-top:18px;text-transform:uppercase}
.opt{font-family:'Anton';text-transform:uppercase;font-size:230px;line-height:.86;letter-spacing:-.005em}
.opt.b{color:transparent;-webkit-text-stroke:3px var(--ink)}
.or{font-family:'Mono';font-size:34px;letter-spacing:.3em;line-height:1;color:var(--acc);margin:18px 0 16px}
.cd{font-family:'Anton';font-size:620px;line-height:.8;letter-spacing:-.02em;color:var(--acc)}
.cdl{font-family:'Mono';font-size:28px;letter-spacing:.2em;text-transform:uppercase;margin-top:24px}
.bigq{font-family:'Anton';font-size:380px;line-height:.8;color:var(--acc);height:300px}
.usp{display:flex;align-items:center;gap:18px;margin-top:${S ? 34 : 24}px;background:var(--ink);color:var(--bg);padding:${S ? '18px 24px' : '14px 20px'};align-self:flex-start;max-width:100%}
.usp .k{font-family:'Mono';font-size:${S ? 18 : 15}px;letter-spacing:.16em;text-transform:uppercase;opacity:.75;white-space:nowrap;flex:none}
.usp .u{font-family:'Inter';font-weight:700;font-size:${S ? 30 : 25}px;letter-spacing:-.01em;line-height:1.15;min-width:0}
.st-editorial .usp{align-self:center}
/* background type */
.bgword{position:absolute;white-space:nowrap;font-family:'Anton';text-transform:uppercase;line-height:.8;color:transparent;-webkit-text-stroke:2px var(--rule);z-index:1;pointer-events:none}
.numeral{position:absolute;font-family:'Anton';line-height:.8;color:var(--acc);z-index:1;pointer-events:none}
.vert{position:absolute;font-family:'Mono';font-size:${S ? 18 : 16}px;letter-spacing:.3em;text-transform:uppercase;color:var(--mute);transform-origin:left top;z-index:6;white-space:nowrap}
${styleCss(dept, style, fmt, P, { W, H, S, M, stageTop, stageBot, topY, botY })}
${photo ? photoCss(style, fmt, { W, H, S, M, stageTop, stageBot }) : ''}
`;
}

function styleCss(dept, style, fmt, P, g) {
  const { W, H, S } = g;
  if (style === 'film') {
    // 35mm strip: holes down both edges, frame inset, orange edge text
    const hole = (x) => `linear-gradient(#000,#000)`;
    return `
body{background:#090909}
.strip{position:absolute;top:0;bottom:0;width:62px;z-index:2;background-image:radial-gradient(circle at 50% 50%,transparent 0,transparent 0),repeating-linear-gradient(180deg,transparent 0 16px,#e9e2d3 16px 48px,transparent 48px 64px);-webkit-mask:linear-gradient(90deg,transparent 0 20px,#000 20px 42px,transparent 42px);opacity:.9}
.strip.l{left:6px}.strip.r{right:6px}
.frame{position:absolute;left:84px;right:84px;top:${S ? 110 : 40}px;bottom:${S ? 110 : 40}px;background:#1A1816;border-radius:10px;z-index:1;overflow:hidden}
.frame:after{content:'';position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 40%,rgba(255,240,215,.06),rgba(0,0,0,.35));}
.edge{position:absolute;font-family:'Mono';font-weight:700;font-size:${S ? 19 : 16}px;letter-spacing:.24em;color:#E07B34;z-index:3;white-space:nowrap;transform-origin:left top}
.rows,.r,.qa,.dt{border-color:var(--rule)}
.rows{border-top-color:rgba(242,237,228,.5)}
.r .t{font-family:'Inter';font-weight:400}
`;
  }
  if (style === 'editorial') {
    return `
.stage{align-items:center;text-align:center}
.mast{position:absolute;left:${g.M}px;right:${g.M}px;top:${S ? 250 : 52}px;text-align:center;z-index:6}
.mast .w{display:inline-block;font-family:'Bodoni';font-weight:500;font-size:200px;line-height:.8;letter-spacing:-.02em;white-space:nowrap}
.mast .il{display:flex;justify-content:space-between;font-family:'Mono';font-size:${S ? 20 : 17}px;letter-spacing:.16em;text-transform:uppercase;border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);padding:10px 0 9px;margin-top:${S ? 26 : 18}px}
.eb{justify-content:center}
.eb .ln{display:none}
.sub{margin-left:auto;margin-right:auto}
.rows{width:100%;border-top:1.5px solid var(--ink)}
.r{text-align:left}
.r .t{font-family:'Bodoni';font-weight:500;font-size:${S ? 40 : 34}px;letter-spacing:-.01em}
.r .v{font-family:'Bodoni';font-weight:500;font-size:${S ? 42 : 36}px}
.r .lead{flex:1 1 auto;border-bottom:2px dotted var(--rule);transform:translateY(-8px);min-width:30px}
.price{justify-content:center}
.price .amt{font-family:'Bodoni';font-weight:500;letter-spacing:-.05em;font-size:${S ? 360 : 270}px;line-height:.86}
.price .cur{font-family:'Bodoni';font-size:${S ? 70 : 60}px;letter-spacing:0;margin-top:.25em}
.price .unit{font-family:'Bodoni'}
.inc{width:100%}
.qa{text-align:left}
.qa .q{font-family:'Bodoni';font-weight:500;font-size:${S ? 38 : 33}px}
.dt{text-align:left}
.dt .d{font-family:'Bodoni';font-weight:500;letter-spacing:-.04em}
.qg{font-family:'Bodoni';margin:0 auto}
.hl.quote{font-family:'Bodoni';font-weight:400}
.box{width:100%;text-align:left}
.opt{font-family:'Bodoni';font-weight:500;text-transform:none;letter-spacing:-.04em}
.opt.b{-webkit-text-stroke:0;color:var(--acc)}
.cd{font-family:'Bodoni';font-weight:500;letter-spacing:-.06em}
.meta.bot{justify-content:center;text-align:center;flex-direction:column;gap:10px}
.meta.bot .cta{max-width:100%;font-family:'Inter';font-weight:600;font-size:${S ? 32 : 27}px}
.meta.bot .cta b{display:none}
`;
  }
  if (style === 'paper') {
    return `
.r .t{font-weight:500}
.dot{position:absolute;width:${S ? 30 : 24}px;height:${S ? 30 : 24}px;border-radius:50%;background:var(--acc);z-index:6}
.numeral{mix-blend-mode:multiply;opacity:.95}
`;
  }
  if (style === 'block') {
    return `
.rows{border-top-color:var(--ink)}
.numeral{color:transparent;-webkit-text-stroke:3px var(--ink);opacity:.35}
.price .amt{color:var(--ink)}
.dt .d,.steps .r .n,.r .n{color:var(--acc)}
${dept === 'awareness' ? '.dt .d,.steps .r .n,.r .n,.price .cur,.qa .k,.eb .k,.badge,.qg,.bigq,.or{color:#0F0F0F}.badge:before{background:#0F0F0F}.cd{color:#0F0F0F}' : ''}
`;
  }
  if (style === 'impact') {
    return `
.meta.bot .cta b{display:inline-grid;place-items:center;width:${S ? 60 : 50}px;height:${S ? 60 : 50}px;border-radius:50%;background:var(--acc);color:#0E0F0C;font-family:'Inter';font-weight:800;font-size:${S ? 30 : 26}px;margin-right:16px;vertical-align:middle}
.meta.bot .cta{display:flex;align-items:center}
.r .n,.steps .r .n,.qa .k,.dt .d,.eb .k{color:var(--acc)}
.usp{background:var(--acc);color:#0E0F0C}
.arc{position:absolute;border:3px solid var(--acc);border-radius:50%;z-index:1;pointer-events:none}
.ph{position:absolute;right:0;bottom:0;width:58%;height:${S ? 46 : 54}%;background-size:cover;background-position:center;filter:grayscale(1) contrast(1.12);border-top-left-radius:36px;z-index:1}
.ph:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(14,15,12,.65),rgba(14,15,12,0) 40%),linear-gradient(0deg,rgba(14,15,12,.7),rgba(14,15,12,0) 35%);border-top-left-radius:36px}
`;
  }
  if (style === 'street') {
    return `
.ph,.cut{position:absolute;inset:0;background-size:cover;background-position:center 40%;filter:saturate(.9) contrast(1.08);z-index:0}
.cut{z-index:2}
.scrim{position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,.2) 22%,rgba(0,0,0,.35) 34%,rgba(0,0,0,.72) 50%,rgba(0,0,0,.9) 68%,rgba(0,0,0,.95) 100%)}
.bigw{position:absolute;left:36px;top:${S ? 300 : 112}px;font-family:'Archivo';text-transform:uppercase;letter-spacing:-.03em;line-height:.82;color:#fff;white-space:nowrap;z-index:2;font-size:300px;-webkit-mask-image:linear-gradient(180deg,#000 45%,rgba(0,0,0,.25) 100%);opacity:.94}
.onum{position:absolute;font-family:'Archivo';line-height:.8;color:transparent;-webkit-text-stroke:3px var(--acc);z-index:2;letter-spacing:-.02em}
.band .ph,.band .cut{bottom:auto;height:620px;background-position:center 62%}
.band .stage>.sub{display:none}
.band .eb{margin-bottom:14px}
.band .inc .r{padding:9px 0}
.band .scrim{background:linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 34%,rgba(11,11,12,1) 600px,rgba(11,11,12,1) 100%)}
.band .onum{display:none}
.band .price{margin-top:6px}
.band .price .amt{font-size:180px}
.band .price .cur{font-size:28px}
.band .pnote{margin:12px 0 14px}
.xh{position:absolute;width:26px;height:26px;z-index:6}
.xh:before,.xh:after{content:'';position:absolute;background:var(--ink);opacity:.8}
.xh:before{left:12px;top:0;width:2px;height:26px}.xh:after{top:12px;left:0;height:2px;width:26px}
.r{padding:${S ? 16 : 12}px 0}
.r .t{font-family:'Mono';text-transform:uppercase;font-size:${S ? 23 : 19}px;letter-spacing:.06em;font-weight:400}
.r .v{font-family:'Archivo';font-size:${S ? 32 : 27}px;color:var(--acc)}
.r .n{color:var(--acc)}
.usp{background:var(--acc);color:#fff}
.sub{color:var(--mute)}
`;
  }
  if (style === 'portrait') {
    return `
.ph,.cut{position:absolute;inset:0;background-size:cover;background-position:center 18%;z-index:0}
.cut{z-index:2}
.bigw.front{z-index:4}
.bigw{position:absolute;left:30px;top:${S ? 300 : 92}px;font-family:'Anton';text-transform:uppercase;line-height:.8;color:var(--acc);white-space:nowrap;z-index:1;font-size:400px;letter-spacing:-.01em}
.scrim{position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 14%,rgba(0,0,0,.1) 32%,rgba(0,0,0,.72) 46%,rgba(0,0,0,.92) 60%,rgba(0,0,0,.96) 100%)}
.usp{background:var(--acc);color:#0D0D0D}
.r .n,.eb .k{color:var(--acc)}
.price .amt{font-size:${S ? 300 : 210}px}
.inc .r{padding:8px 0}
`;
  }
  if (style === 'ivory') {
    return `
.ph,.cut{position:absolute;inset:0;background-size:cover;background-position:center 22%;z-index:0}
.cut{z-index:2}
.bigw.front{z-index:4;font-size:200px}
.bigw{position:absolute;left:40px;top:${S ? 300 : 96}px;font-family:'Bodoni';font-weight:500;text-transform:uppercase;letter-spacing:-.01em;line-height:.8;color:#FBF6EE;white-space:nowrap;z-index:1;font-size:300px;opacity:.96}
.scrim{position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(180deg,rgba(15,11,9,.6) 0%,rgba(15,11,9,0) 16%,rgba(15,11,9,0) 28%,rgba(15,11,9,.55) 40%,rgba(15,11,9,.86) 54%,rgba(15,11,9,.94) 100%)}
.frm{position:absolute;inset:26px;border:1.5px solid rgba(251,246,238,.38);z-index:2;pointer-events:none}
.stage{align-items:center;text-align:center}
.scr-unused{font-family:'Script';font-size:${S ? 190 : 150}px;line-height:.9;color:var(--acc);margin-bottom:${S ? -8 : -6}px;position:relative;z-index:2;white-space:nowrap;text-shadow:0 2px 24px rgba(0,0,0,.35)}
.hl{text-shadow:0 2px 30px rgba(0,0,0,.35)}
.sub{margin-left:auto;margin-right:auto;color:var(--ink)}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%;margin-top:${S ? 40 : 30}px}
.card{background:rgba(20,15,12,.5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1.5px solid rgba(251,246,238,.24);border-radius:18px;padding:${S ? '26px 12px' : '20px 10px'};display:flex;flex-direction:column;gap:8px;align-items:center}
.card.pop{border-color:var(--acc);background:rgba(60,45,25,.55)}
.card .nm{font-family:'Bodoni';text-transform:uppercase;letter-spacing:.08em;font-size:${S ? 24 : 20}px;line-height:1.15}
.card .pr{font-family:'Bodoni';font-weight:500;font-size:${S ? 50 : 42}px;letter-spacing:-.02em;line-height:1}
.card .pr small{font-size:.42em;margin-right:4px;font-family:'Inter';font-weight:600}
.card .tg{font-family:'Mono';font-size:${S ? 14 : 12}px;letter-spacing:.14em;text-transform:uppercase;color:var(--acc)}
.card.wide{grid-column:1/-1;padding:${S ? '32px 30px' : '26px 26px'}}
.card.wide .pr{font-size:${S ? 130 : 104}px}
.card.wide .inc{font-family:'Inter';font-size:${S ? 26 : 22}px;line-height:1.5;color:var(--mute)}
.rows{width:100%;border-top-color:rgba(251,246,238,.6)}
.r{text-align:left}
.dt{text-align:left}
.dt .d{font-family:'Bodoni';color:var(--acc)}
.usp{align-self:center;background:var(--acc);color:#1A1512}
.meta.bot{justify-content:center;flex-direction:column;gap:8px;text-align:center}
.meta.bot .cta{max-width:100%;font-family:'Inter';font-weight:600;font-size:${S ? 32 : 27}px}
.meta.bot .cta b{display:none}
.opt{font-family:'Bodoni';font-weight:400;text-transform:uppercase;letter-spacing:.02em}
.opt.b{-webkit-text-stroke:0;color:var(--acc)}
`;
  }
  // noir
  return `
.glow{position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,var(--acc) 0%,transparent 62%);opacity:.18;filter:blur(30px);z-index:0}
`;
}

function photoCss(style, fmt, g) {
  const { W, H, S, M } = g;
  if (['impact', 'street', 'ivory', 'portrait'].includes(style)) return '';
  if (style === 'paper') {
    // split: photo panel on top, paper below; stage moves into the lower half
    const ph = S ? 760 : 640;
    return `
.ph{position:absolute;left:0;right:0;top:0;height:${ph}px;background-size:cover;background-position:center;z-index:3}
.meta.top{color:#fff}.meta.top .logo{filter:none}.meta.top .dim{color:rgba(255,255,255,.8)}
.ph:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,0) 30%)}
.stage{top:${ph + (S ? 60 : 44)}px !important;height:${(S ? 1520 : H - 150) - ph - (S ? 60 : 44)}px !important}
.numeral,.bgword{display:none}
`;
  }
  // cover: photo fills the frame, dark gradient under the type, ink forced light
  return `
:root{--ink:#F6F1E8;--mute:rgba(246,241,232,.78);--rule:rgba(246,241,232,.3)}
.ph{position:absolute;${style === 'film' ? `left:84px;right:84px;top:${S ? 110 : 40}px;bottom:${S ? 110 : 40}px;border-radius:10px` : 'inset:0'};background-size:cover;background-position:center;z-index:1}
.ph:after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.08) 22%,rgba(0,0,0,.1) 42%,rgba(0,0,0,.72) 72%,rgba(0,0,0,.88) 100%)}
.meta .logo{filter:none}
.bgword,.numeral,.glow,.frame{display:none}
.rows{border-top-color:rgba(246,241,232,.6)}
.box{border-color:rgba(246,241,232,.7);background:rgba(0,0,0,.25);backdrop-filter:blur(6px)}
.usp{background:#F6F1E8;color:#141312}
.opt.b{-webkit-text-stroke-color:#F6F1E8}
.hl em{${style === 'block' ? '-webkit-text-stroke-color:#F6F1E8' : ''}}
`;
}

/* ---------------------------------------------------------------- page */
const FIT_JS = `
(async()=>{
 await document.fonts.ready;
 const R=[];const fs=e=>parseFloat(getComputedStyle(e).fontSize);
 for(const e of document.querySelectorAll('[data-fill]')){const w=e.getBoundingClientRect().width;if(w>0)e.style.fontSize=(fs(e)*(+e.dataset.fill)/w)+'px';}
 for(const box of document.querySelectorAll('[data-box]')){
  const P=[...box.querySelectorAll('[data-fit=p]')],S=[...box.querySelectorAll('[data-fit=s]')];
  const b=new Map([...P,...S].map(e=>[e,fs(e)]));
  const wide=()=>[...P,...S].some(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+2);
  const tall=()=>box.scrollHeight>box.clientHeight+4;
  const set=(A,k)=>A.forEach(e=>e.style.fontSize=(b.get(e)*k)+'px');
  // headline down to 55%, body text to 64%, then drop the last list rows, then the headline may shrink further
  let k=1;while((tall()||wide())&&k>0.55){k*=0.97;set(P,k);}
  let k2=1;while(tall()&&k2>0.64){k2*=0.97;set(S,k2);}
  const rows=[...box.querySelectorAll('[data-drop]')];
  while(tall()&&rows.filter(e=>e.style.display!=='none').length>3){const d=rows.filter(e=>e.style.display!=='none').pop();d.style.display='none';R.push({field:d.dataset.drop,kind:'dropped (no room)'});}
  while((tall()||wide())&&k>0.3){k*=0.97;set(P,k);}
  while(tall()){const d=rows.filter(e=>e.style.display!=='none').pop();if(!d)break;d.style.display='none';R.push({field:d.dataset.drop,kind:'dropped (no room)'});}
  if(tall()||wide())R.push({field:'layout',kind:'overflow'});
  if(k<0.5)R.push({field:'headline',kind:'shrunk to '+Math.round(k*100)+'%'});
 }
 for(const e of document.querySelectorAll('[data-fitw]')){const W=+e.dataset.fitw;let f=fs(e);while(e.scrollWidth>W&&f>16){f*=0.96;e.style.fontSize=f+'px';}}
 window.__fit=R;document.body.dataset.ready='1';
})();`;

function decor(item, fmt, style, P, layout, photo) {
  const { W, H } = SIZES[fmt];
  const S = fmt === 'story';
  const d = DEPTS[item.dept];
  const f = item.feed || {};
  const out = [];
  if (style === 'film') {
    const fr = dayIndex(item.date) + 1;
    out.push(`<div class="frame"></div><div class="strip l"></div><div class="strip r"></div>`);
    // edge markings, rotated along both edges
    out.push(`<div class="edge" style="left:${W - 70}px;top:${S ? 260 : 150}px;transform:rotate(90deg)">SNAPSENSE 400 &nbsp;▸ ${fr}A &nbsp;&nbsp;&nbsp; ${pad2(fr)} &nbsp;▸ ${pad2(fr)}A &nbsp;&nbsp;&nbsp; TRIGGER YOUR SENSE</div>`);
    out.push(`<div class="edge" style="left:70px;top:${H - (S ? 260 : 150)}px;transform:rotate(-90deg)">${esc(d.name.toUpperCase())} &nbsp;▸ ${pad2(fr)} &nbsp;&nbsp;&nbsp; SAFETY FILM &nbsp; ${pad2(fr + 1)}</div>`);
  }
  if (style === 'ivory') out.push('<div class="frm"></div>');
  if (style === 'street') {
    if (!(photo && photo.cut)) out.push(bigWord(item, fmt, style, photo));
    const num = layout === 'price' && f.price && f.price.amount ? String(f.price.amount) : pad2(dayIndex(item.date) + 1);
 if (!S) out.push(`<div class="onum" style="font-size:${S ? 560 : 420}px;right:${S ? 40 : 36}px;top:${S ? 640 : 360}px">${esc(num)}</div>`);
    const m = 34, t = S ? 250 : 34;
    out.push(`<div class="xh" style="left:${m}px;top:${t}px"></div><div class="xh" style="right:${m}px;top:${t}px"></div><div class="xh" style="left:${m}px;bottom:${S ? 250 : 34}px"></div><div class="xh" style="right:${m}px;bottom:${S ? 250 : 34}px"></div>`);
  }
  if (style === 'impact') out.push(`<div class="arc" style="width:${S ? 1100 : 900}px;height:${S ? 1100 : 900}px;right:${S ? -640 : -560}px;top:${S ? 520 : 380}px"></div>`);
  if (photo) return out.join('');
  if (style === 'noir') {
    const lead = !S && String(f.headline || '').match(/^(\d{1,2})\b/);
    if (lead) out.push(`<div class="numeral" style="font-size:900px;right:-40px;top:300px;color:transparent;-webkit-text-stroke:2.5px var(--acc);opacity:.55">${esc(lead[1])}</div>`);
    out.push(`<div class="glow" style="right:-380px;top:${S ? -260 : -360}px"></div>`);
    const word = (has(f.eyebrow) && fmt === 'feed' ? f.eyebrow : d.name).toUpperCase();
    out.push(`<div class="bgword" style="font-size:${S ? 560 : 470}px;left:-20px;bottom:${S ? -70 : -60}px">${esc(word)}</div>`);
  }
  if (style === 'block' && !S && !['price'].includes(layout)) {
    const lead = fmt === 'feed' && String(f.headline || '').match(/^(\d{1,2})\b/);
    const big = lead ? lead[1] : pad2(dayIndex(item.date) + 1);
    out.push(`<div class="numeral" style="font-size:${S ? 1100 : 900}px;right:-60px;bottom:${S ? -120 : -110}px">${esc(big)}</div>`);
  }
  if (style === 'paper') {
    const lead = fmt === 'feed' && ['tip', 'list', 'steps'].includes(layout) && String(f.headline || '').match(/^(\d{1,2})\b/);
    if (lead) out.push(`<div class="numeral" style="font-size:${S ? 1000 : 820}px;right:-40px;top:${S ? 150 : 40}px;opacity:.9">${esc(lead[1])}</div>`);
    else out.push(`<div class="dot" style="right:72px;top:${S ? 300 : 158}px"></div>`);
    out.push(`<div class="vert" style="left:${S ? 30 : 28}px;top:${S ? 1500 : 1140}px;transform:rotate(-90deg)">SnapSense — Trigger your sense — ${new Date(item.date).getUTCFullYear()}</div>`);
  }
  return out.join('');
}

const HL_SCALE = { ivory: 0.55, street: 0.62 };
// The giant word that sits behind the subject (between the photo and its cut-out).
function bigWord(item, fmt, style, photo) {
  const { W } = SIZES[fmt];
  const pk = item.pkg || '';
  const f = item.feed || {};
  const short = (t) => (has(t) && String(t).length <= 11 ? String(t) : '');
  let w;
  if (style === 'street' && item.moto) w = 'MOTORCYCLE SHOOT';
  else if (style === 'street') w = pk === 'au-bengkel' ? 'WORKSHOP' : pk === 'au-cine' ? 'ROLLING' : 'CAR SHOOT';
  else if (style === 'ivory' && (f.items || []).filter((x) => /RM/.test(x.value || '')).length >= 3) w = 'WEDDING';
  else if (style === 'ivory') w = { 'wed-tunang': 'TUNANG', 'wed-nikah': 'NIKAH', 'wed-sanding': 'SANDING', 'wed-ns': 'NIKAH', 'wed-fv': 'FOREVER', 'wed-prem': 'PREMIUM' }[pk] || (/^konvo/.test(pk) ? 'CONVO' : /^pre/.test(pk) ? 'TOGETHER' : 'WEDDING');
  else w = pk === 'prod-1' ? 'PRODUCT' : pk === 'prod-2' ? 'BRAND' : pk === 'pot-1' ? 'PORTRAIT' : pk === 'pot-2' ? 'FAMILY' : short(f.eyebrow) || 'SNAPSENSE';
  const col = photo && photo.bright ? (style === 'portrait' ? '' : 'color:#1B1512;') : '';
  return `<div class="bigw" data-fill="${W - (style === 'portrait' ? 60 : 80)}" style="${col}">${esc(String(w).toUpperCase())}</div>`;
}
function page(item, fmt, style, layout, body, extra = {}) {
  const { W, H } = SIZES[fmt];
  const S = fmt === 'story';
  const d = DEPTS[item.dept] || DEPTS.sales;
  const P = palette(item.dept, style);
  // photo-led only where the type is light (text-heavy lists stay typographic and readable)

  const band = style === 'street' && fmt === 'feed' && ['price', 'list', 'tip', 'steps', 'faq', 'dates'].includes(layout);
  const photo = extra.noPhoto || !usesPhoto(style, fmt, layout) ? null : photoFor(item, fmt);
  const dt = new Date(item.date + 'T00:00:00Z');
  const dateStr = `${pad2(dt.getUTCDate())}.${pad2(dt.getUTCMonth() + 1)}.${String(dt.getUTCFullYear()).slice(2)}`;
  const no = `N°${pad2(dayIndex(item.date) + 1)}`;
  const f = item.feed || {};
  const cta = fmt === 'feed' ? f.cta : (item.story && item.story.cta) || '';
  const contact = item.dept === 'sales' && !/016-?803/.test(cta || '') ? 'WA 016-803 1153' : '@snapsenseofficial';
  let top, bot = '';
  if (style === 'ivory') {
    const kind = /^konvo/.test(item.pkg || '') ? 'Convocation' : /^pre/.test(item.pkg || '') ? 'Pre-wedding' : /^pot/.test(item.pkg || '') ? 'Portraits' : 'Weddings';
    top = `<div class="meta top" style="justify-content:center;gap:28px"><img class="logo" src="${logoUri()}" alt="SnapSense"><span>· ${kind} ·</span><span>${no}</span></div>`;
  } else if (style === 'editorial') {
    top = `<div class="mast"><div class="w" data-fill="${W - 144}">SNAPSENSE</div>
      <div class="il"><span>${no}</span><span>${esc(MONL[dt.getUTCMonth()])} ${dt.getUTCFullYear()}</span><span>${esc(d.name)}</span></div></div>`;
  } else {
    top = `<div class="meta top"><img class="logo" src="${logoUri()}" alt="SnapSense"><span class="dim">${esc(d.name)}</span><span>${no} — ${dateStr}</span></div>`;
  }
  if (S) bot = `<div class="meta bot">${has(cta) ? `<span class="cta"><b>→</b>${esc(cta)}</span>` : `<span class="dim">Trigger your sense</span>`}<span>${contact}</span></div>`;
  else bot = `<div class="meta bot">${has(cta) ? `<span class="cta"><b>→</b>${esc(cta)}</span>` : '<span></span>'}<span class="${style === 'editorial' ? 'dim' : ''}">${contact}</span></div>`;
  const stageTop = style === 'editorial' ? (S ? 560 : 330) : band ? 520 : style === 'street' ? (S ? 640 : 400) : style === 'ivory' ? (S ? 700 : 470) : style === 'portrait' ? (S ? 760 : 480) : null;
  const stageStyle = stageTop ? ` style="top:${stageTop}px;height:${(S ? 1550 : H - 170) - stageTop}px"` : '';
  const hair = ['editorial', 'ivory', 'street', 'portrait'].includes(style) || photo ? '' : `<div class="hair" style="top:${S ? 1582 : H - 128}px"></div>`;
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=${W}, height=${H}">
<title>${esc(item.date)} ${esc(item.dept)} ${fmt} ${layout} ${style}</title>
<style>${fontCss()}
${css(item.dept, style, fmt, P, !!photo)}</style></head>
<body class="st-${style} f-${fmt}${band ? ' band' : ''}" data-dept="${item.dept}">
${photo ? `<div class="ph" style="background-image:url('${photo.uri}')"></div>` : ''}
${photo && photo.cut && ['street', 'ivory', 'portrait'].includes(style) ? `${bigWord(item, fmt, style, photo)}<div class="cut" style="background-image:url('${photo.cut}')"></div>` : ''}
${photo && ['street', 'ivory', 'portrait'].includes(style) ? '<div class="scrim"></div>' : ''}
${photo && !photo.cut && ['ivory', 'portrait'].includes(style) ? bigWord(item, fmt, style, photo).replace('class="bigw"', 'class="bigw front"') : ''}
${decor(item, fmt, style, P, layout, photo)}
${top}
<div class="stage" data-box${stageStyle}>${photo || ['ivory', 'street', 'portrait'].includes(style) ? '<div class="sp"></div>' : ''}${HL_SCALE[style] ? body.replace(/(class="hl[^"]*" data-fit="p" style="font-size:)(\d+)px/g, (m, a, n) => `${a}${Math.round(n * HL_SCALE[style])}px`) : body}${uspHtml(fmt === 'feed' ? f.usp : (item.story || {}).usp)}</div>
${hair}${bot}
<div class="grain"></div>
<script>${FIT_JS}</script>
</body></html>`;
}

/* ---------------------------------------------------------------- building blocks */
// USP strip: inverted bar at the foot of the stage, on every design
const uspHtml = (u) => (has(u) ? `<div class="usp"><span class="k">Why SnapSense</span><span class="u" data-fit="s">${rich(u)}</span></div>` : '');
const items = (f) => (Array.isArray(f.items) ? f.items.filter((x) => x && (has(x.label) || has(x.value))) : []);
const EB = (text, style, k) => (has(text) ? `<div class="eb">${k ? `<span class="k">${esc(k)}</span>` : ''}<span class="ln"></span><span>${esc(text)}</span></div>` : '');
const HL = (text, px, cls = '') => (has(text) ? `<div class="hl ${cls}" data-fit="p" style="font-size:${px}px">${cls.includes('quote') ? rich(text) : emph(text)}</div>` : '');
const SUB = (text) => (has(text) ? `<div class="sub" data-fit="s">${rich(text)}</div>` : '');
const NOTE = (text) => (has(text) ? `<div class="note" data-fit="s">${rich(text)}</div>` : '');
const BADGE = (text) => (has(text) ? `<div class="badge">${esc(text)}</div>` : '');
const sz = (fmt, a) => Math.round(fmt === 'story' ? a * 1.22 : a);
// strip "1. " prefixes when we print our own numbers
const clean = (s) => String(s || '').replace(/^\s*\d{1,2}[.)]\s*/, '');

function rowsHtml(list, style, { numbers = true, field = 'feed.items' } = {}) {
  const anyVal = list.some((x) => has(x.value));
  return `<div class="rows">${list.map((x, i) => `<div class="r" data-drop="${field}[${i}]">
    ${numbers ? `<span class="n">${pad2(i + 1)}</span>` : ''}
    <span class="t" data-fit="s">${rich(clean(x.label))}</span>
    ${anyVal && has(x.value) ? `${style === 'editorial' ? '<span class="lead"></span>' : ''}<span class="v">${esc(x.value)}</span>` : ''}
  </div>`).join('')}</div>`;
}

/* ---------------------------------------------------------------- FEED layouts */
const FEED = {};
const ebK = (item) => `(${pad2(DEPTS[item.dept].n)})`;

FEED.hook = (item, style) => {
  const f = item.feed;
  return [EB(f.eyebrow, style, ebK(item)), BADGE(f.badge), '<div class="sp"></div>', HL(f.headline, style === 'paper' ? 190 : 230), SUB(f.sub), NOTE(f.footnote)].join('');
};
FEED.announce = (item, style) => {
  const f = item.feed;
  return [EB(f.eyebrow, style, ebK(item)), BADGE(f.badge), '<div class="sp"></div>', HL(f.headline, style === 'paper' || style === 'editorial' ? 160 : 190), SUB(f.sub), NOTE(f.footnote), style === 'editorial' ? '<div class="sp"></div>' : ''].join('');
};
FEED.quote = (item, style) => {
  const f = item.feed;
  return [EB(f.eyebrow, style, ebK(item)), '<div class="qg">&ldquo;</div>', HL(f.headline, 130, 'quote'), has(f.sub) ? `<div class="attr" data-fit="s">— ${rich(f.sub)}</div>` : '', '<div class="sp"></div>', NOTE(f.footnote)].join('');
};
function ivoryCards(list, popular) {
  return `<div class="cards">${list.map((x, i) => {
    const m = String(x.value || '').match(/^(RM)\s?([\d,]+)(.*)$/i);
    return `<div class="card${popular === i ? ' pop' : ''}" data-drop="feed.items[${i}]">${popular === i ? '<span class="tg">Most popular</span>' : ''}<span class="nm">${esc(x.label)}</span><span class="pr">${m ? `<small>RM</small>${esc(m[2])}${m[3] ? `<small>${esc(m[3])}</small>` : ''}` : esc(x.value)}</span></div>`;
  }).join('')}</div>`;
}
FEED.list = (item, style) => {
  const f = item.feed, it = items(f);
  if (style === 'ivory' && it.length && it.every((x) => has(x.value))) {
    const pop = it.findIndex((x) => /nikah \+ sanding/i.test(x.label));
    return [EB(f.eyebrow, style), HL(f.headline, 76), SUB(f.sub), ivoryCards(it, pop)].join('');
  }
  return [EB(f.eyebrow, style, ebK(item)), BADGE(f.badge), HL(f.headline, 130), SUB(f.sub), '<div class="sp" style="min-height:30px"></div>', rowsHtml(it, style, { numbers: !it.some((x) => has(x.value)) || style !== 'editorial' }), NOTE(f.footnote)].join('');
};
FEED.tip = (item, style) => {
  const f = item.feed, it = items(f);
  return [EB(f.eyebrow || 'Tip', style, ebK(item)), HL(f.headline, 140), SUB(f.sub), '<div class="sp" style="min-height:30px"></div>', it.length ? rowsHtml(it, style) : '', NOTE(f.footnote)].join('');
};
FEED.steps = (item, style) => {
  const f = item.feed, it = items(f);
  const steps = `<div class="rows steps">${it.map((x, i) => `<div class="r" data-drop="feed.items[${i}]"><span class="n">${pad2(i + 1)}</span><span class="t" data-fit="s">${rich(clean(x.label))}${has(x.value) ? `<small>${rich(x.value)}</small>` : ''}</span></div>`).join('')}</div>`;
  return [EB(f.eyebrow, style, ebK(item)), HL(f.headline, 130), SUB(f.sub), '<div class="sp" style="min-height:30px"></div>', steps, NOTE(f.footnote)].join('');
};
FEED.faq = (item, style) => {
  const f = item.feed, it = items(f);
  const qa = it.map((x, i) => `<div class="qa" data-drop="feed.items[${i}]"><span class="k">Q${i + 1}</span><span class="q" data-fit="s">${rich(x.label)}</span>${has(x.value) ? `<span class="k" style="color:var(--mute)">A</span><span class="a" data-fit="s">${rich(x.value)}</span>` : ''}</div>`).join('');
  return [EB(f.eyebrow || 'FAQ', style, ebK(item)), HL(f.headline, 120), SUB(f.sub), '<div class="sp" style="min-height:24px"></div>', `<div class="rows" style="border-top-width:1.5px">${qa}</div>`, NOTE(f.footnote)].join('');
};
FEED.dates = (item, style) => {
  const f = item.feed, it = items(f);
  const rows = it.map((x, i) => {
    const p = parseDateLabel(x.label);
    const meta = p ? [MON_EN[p.mon] || p.mon, WD_EN[p.wd] || p.wd || (x.label.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/) || [])[1]].filter(Boolean).join(' · ') : '';
    const title = p ? (p.rest || x.value || '') : x.label;
    const val = p && p.rest ? x.value : '';
    return `<div class="dt" data-drop="feed.items[${i}]"><span class="d">${esc(p ? p.day : '—')}</span><span style="flex:1"><div class="m">${esc(meta)}</div><div class="l" data-fit="s">${rich(title)}</div>${has(val) ? `<div class="m" style="margin:8px 0 0;text-transform:none;letter-spacing:.04em">${rich(val)}</div>` : ''}</span></div>`;
  }).join('');
  return [EB(f.eyebrow, style, ebK(item)), HL(f.headline, 120), SUB(f.sub), '<div class="sp" style="min-height:24px"></div>', `<div class="rows">${rows}</div>`, NOTE(f.footnote)].join('');
};
FEED.price = (item, style) => {
  const f = item.feed, p = f.price || {}, inc = items(f);
  if (style === 'ivory') {
    const unitI = has(p.unit) ? `/${String(p.unit).replace(/^\//, '')}` : '';
    return [EB(f.eyebrow, style), HL(f.headline, 78), `<div class="cards"><div class="card wide${has(f.badge) ? ' pop' : ''}">${has(f.badge) ? `<span class="tg">${esc(f.badge)}</span>` : ''}<span class="pr" data-fit="p"><small>${esc(p.prefix || 'RM')}</small>${esc(fmtAmount(p.amount))}${unitI ? `<small>${esc(unitI)}</small>` : ''}</span>${has(p.note) ? `<span class="tg" style="color:var(--ink)">${rich(p.note)}</span>` : ''}${inc.length ? `<span class="inc" data-fit="s">${inc.map((x) => esc(x.label)).join(' &nbsp;·&nbsp; ')}</span>` : ''}</div></div>`, NOTE(f.footnote)].join('');
  }
  const unit = has(p.unit) ? (String(p.unit).trim().startsWith('/') ? p.unit : `/${p.unit}`) : '';
  const price = has(p.amount) ? `<div class="price" data-fit="p"><span class="cur">${esc(p.prefix || 'RM')}</span><span class="amt">${esc(fmtAmount(p.amount))}</span>${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</div>` : '';
  const incl = inc.length ? `<div class="inc">${rowsHtml(inc.map((x) => ({ label: x.label + (has(x.value) ? ` — ${x.value}` : '') })), style, { numbers: false }).replace(/<div class="r"/g, '<div class="r"><span class="n">+</span').replace(/<span class="n">\+<\/span( data-drop="[^"]*")>/g, '<span class="n">+</span>').replace(/<div class="r"><span class="n">\+<\/span data-drop/g, '<div class="r" data-drop')}</div>` : '';
  return [BADGE(f.badge), EB(f.eyebrow, style, ebK(item)), HL(f.headline, 92), '<div class="sp"></div>', price, has(p.note) ? `<div class="pnote">${rich(p.note)}</div>` : '', incl, SUB(f.sub), NOTE(f.footnote)].join('');
};

/* ---------------------------------------------------------------- STORY layouts */
const STORY = {};
const st = (item) => item.story || {};
const promptBox = (item, k = 'Reply to this story', foot = 'Type your answer…') => has(st(item).prompt)
  ? `<div class="box"><span class="k">${esc(k)}</span><span class="p" data-fit="s">${rich(st(item).prompt)}</span><span class="f">${esc(foot)}</span></div>` : '';
STORY.announce = (item, style) => {
  const s = st(item);
  return [EB(DEPTS[item.dept].name, style, ebK(item)), '<div class="sp"></div>', HL(s.headline, 230), SUB(s.sub), '<div class="sp" style="min-height:40px"></div>', promptBox(item, 'Next step', 'Tap & DM us')].join('');
};
STORY.question = (item, style) => {
  const s = st(item);
  return [['street', 'ivory', 'portrait'].includes(style) || (style === 'paper' && photoFor(item, 'story')) ? '' : `<div class="bigq">?</div>`, HL(s.headline, 200), SUB(s.sub), '<div class="sp" style="min-height:40px"></div>', promptBox(item, 'Question for you')].join('');
};
STORY.tip = (item, style) => {
  const s = st(item);
  return [EB('Tip of the day', style, ebK(item)), '<div class="sp"></div>', HL(s.headline, 220), SUB(s.sub), '<div class="sp" style="min-height:40px"></div>', promptBox(item, 'Try this', 'Save & share')].join('');
};
const KEY_DATES = [[/deepavali/i, '2026-11-08', 'Deepavali'], [/11\.11/, '2026-11-11', '11.11'], [/12\.12/, '2026-12-12', '12.12'], [/cuti sekolah akhir|akhir tahun|year-end/i, '2026-12-05', 'School holidays'], [/cuti sekolah|school holiday/i, '2026-11-07', 'School holidays']];
function countdownTarget(item) {
  const s = st(item);
  if (s.target && !isNaN(Date.parse(s.target))) return { date: s.target, name: s.targetLabel || '' };
  const txt = [s.headline, s.sub, s.prompt].join(' ');
  for (const [re, date, name] of KEY_DATES) if (re.test(txt)) return { date, name };
  return null;
}
STORY.countdown = (item, style) => {
  const s = st(item), t = countdownTarget(item);
  const days = t ? Math.round((Date.parse(t.date) - Date.parse(item.date)) / 864e5) : null;
  const ok = days != null && days >= 0 && days < 100;
  return [EB('Countdown', style, ebK(item)), HL(s.headline, 150), '<div class="sp"></div>',
    ok ? `<div class="cd" data-fit="p">${days}</div><div class="cdl">${days === 0 ? 'Today' : days === 1 ? 'Day to go' : 'Days to go'}${t.name ? ` · ${esc(t.name)}` : ''}</div>` : '',
    SUB(s.sub), '<div class="sp" style="min-height:30px"></div>', promptBox(item, 'Don\'t miss it', 'Tap & DM us')].join('');
};
STORY.poll = (item, style) => {
  const s = st(item);
  let opts = Array.isArray(s.options) ? s.options.filter(has).slice(0, 2) : [];
  if (opts.length < 2) opts = ['Ya', 'Tidak'];
  return [EB('Vote', style, ebK(item)), HL(s.headline, 150), '<div class="sp"></div>',
    `<div class="opt" data-fit="p">${esc(opts[0])}</div><div class="or">or</div><div class="opt b" data-fit="p">${esc(opts[1])}</div>`,
    '<div class="sp" style="min-height:40px"></div>', has(s.prompt) ? `<div class="box"><span class="k">Poll</span><span class="p" data-fit="s">${rich(s.prompt)}</span><span class="f">Vote on the poll sticker</span></div>` : ''].join('');
};

/* ---------------------------------------------------------------- dispatch */
// photo-led only where the type is light (text-heavy lists stay typographic and readable)
function usesPhoto(style, fmt, layout) {
  const S = fmt === 'story';
  const PHOTO_LAYOUTS = S ? ['announce', 'question', 'tip', 'poll', 'countdown'] : ['hook', 'announce', 'quote'];
  const refStyle = ['street', 'ivory', 'portrait'].includes(style) || (style === 'impact' && (S || ['hook', 'announce'].includes(layout)));
  return refStyle || (!['impact', 'editorial'].includes(style) && PHOTO_LAYOUTS.includes(layout));
}
// A motorcycle photo on an automotive post: the poster talks about bikes, never "car".
const isMoto = (ph, item) => !!(ph && /^m/.test(ph.file) && photoCat(item) === 'auto');
const swapCase = (w, to) => (w === w.toUpperCase() ? to.toUpperCase() : w[0] === w[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
function motoText(v) {
  if (typeof v === 'string') return v.replace(/'CAR'/g, "'MOTORCYCLE'").replace(/\bcar shoot\b/gi, (w) => swapCase(w, 'motorcycle shoot')).replace(/\bcars\b/gi, (w) => swapCase(w, 'bikes')).replace(/\bcar\b/gi, (w) => swapCase(w, 'bike')).replace(/\bkereta\b/gi, (w) => swapCase(w, 'motor'));
  if (Array.isArray(v)) return v.map(motoText);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, motoText(x)]));
  return v;
}
// The item exactly as a format will print it (motorcycle wording when a bike photo is used).
function prepare(item, fmt, ctx = {}) {
  const lay = fmt === 'feed' ? (FEED[item.feed && item.feed.layout] ? item.feed.layout : 'announce') : (STORY[item.story && item.story.layout] ? item.story.layout : 'announce');
  const style = ctx.style || styleFor(item, fmt);
  const ph = !ctx.noPhoto && usesPhoto(style, fmt, lay) ? photoFor(item, fmt) : null;
  // car-package USPs never sit on a bike photo: the catalogue's car packages say "1 car"
  const brandUsp = (o) => (o ? { ...o, usp: 'Every price is listed in the catalogue' } : o);
  return isMoto(ph, item) ? { ...item, moto: true, feed: brandUsp(motoText(item.feed)), story: brandUsp(motoText(item.story)), caption: motoText(item.caption), hashtags: String(item.hashtags || '').replace(/#?CarShoot\w*/gi, '#MotorcycleShoot') } : item;
}
function renderFeed(item, ctx = {}) {
  item = prepare(item, 'feed', ctx);
  const layout = FEED[item.feed && item.feed.layout] ? item.feed.layout : 'announce';
  const style = ctx.style || styleFor(item, 'feed');
  let body = FEED[layout](item, style);
  // bump the base font sizes for each style's display face
  return page(item, 'feed', style, layout, body, ctx);
}
function renderStory(item, ctx = {}) {
  item = prepare(item, 'story', ctx);
  const layout = STORY[item.story && item.story.layout] ? item.story.layout : 'announce';
  const style = ctx.style || styleFor(item, 'story');
  return page(item, 'story', style, layout, STORY[layout](item, style), ctx);
}

module.exports = { prepare, FEED, STORY, renderFeed, renderStory, DEPTS, SIZES, PERIOD_START, styleFor, photoCat, photoList, PHOTOS };
