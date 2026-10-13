// Fill fields the v2 design needs: content for items that used to reuse Mira's wedding posters,
// and the USP line per package (research/usp-map.json, written from the department research).
const fs = require('fs');
const path = require('path');
const DATA = process.env.IGPACK_DATA || path.resolve(__dirname, '..', '..', 'data', 'igpack');
const SEED = path.join(DATA, 'seed');
const PK = JSON.parse(fs.readFileSync(path.join(SEED, 'packages.json'), 'utf8'));
const pk = (id) => PK.find((p) => p.id === id);
const WD = Object.values(JSON.parse(fs.readFileSync(path.join(SEED, 'wedding-dates.json'), 'utf8')));
const RES = path.join(DATA, 'research');
const readJ = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const PK_EN = readJ(path.join(RES, 'packages-en.json'), {});
const USP_EN = readJ(path.join(RES, 'usp-en.json'), null);
const ADDON_EN = { 'ad-jam': 'Extra hour', 'ad-reel': 'Extra reel', 'ad-dron': 'Drone footage', 'ad-sde': 'Same-day edit', 'ad-album': 'Printed album (20 pages)', 'ad-ekspres': '48-hour express' };
const TAG_EN = { 'Tarikh cantik': 'Pretty date', 'Cuti sekolah': 'School holidays', 'Hujung minggu': 'Weekend', 'Hujung minggu panjang': 'Long weekend', 'Cuti umum': 'Public holiday', 'Malam Jumaat': 'Thursday night' };
const DAY_EN = { Isn: 'Mon', Sel: 'Tue', Rab: 'Wed', Kha: 'Thu', Jum: 'Fri', Sab: 'Sat', Ahd: 'Sun' };
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const enOf = (p) => ({ name: ADDON_EN[p.id] || p.name, cover: (PK_EN[p.id] && PK_EN[p.id].cover) || p.cover, inc: (PK_EN[p.id] && PK_EN[p.id].inc && PK_EN[p.id].inc.length ? PK_EN[p.id].inc : p.inc) });
const USP_FILE = process.env.USP_FILE || path.join(RES, 'usp-map.json');
const USP = fs.existsSync(USP_FILE) ? JSON.parse(fs.readFileSync(USP_FILE, 'utf8')) : { packages: {}, items: {} };

const POSTER_PKG = { '02-tunang': 'wed-tunang', '03-nikah': 'wed-nikah', '04-sanding': 'wed-sanding', '05-nikah-sanding': 'wed-ns', '06-foto-video': 'wed-fv', '07-premium': 'wed-prem' };
const MON = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
const DAY = { Isn: 'Isn', Sel: 'Sel', Rab: 'Rab', Kha: 'Kha', Jum: 'Jum', Sab: 'Sab', Ahd: 'Ahd' };

function fromPoster(f, date) {
  const ex = f.existingPoster;
  const id = POSTER_PKG[ex];
  if (id) {
    const p = pk(id);
    const e = enOf(p);
    return { ...f, layout: 'price', badge: p.popular ? 'Most popular' : f.badge, eyebrow: f.eyebrow || p.name, price: { prefix: 'RM', amount: String(p.price), unit: '', note: e.cover }, items: e.inc.map((x) => ({ label: x })), pkg: id };
  }
  if (ex === '01-pakej-kahwin') return { ...f, layout: 'list', items: PK.filter((p) => p.cat === 'wedding').map((p) => ({ label: p.name, value: `RM${p.price.toLocaleString('en-US')}` })).slice(0, 6), pkg: 'wed-ns' };
  if (ex === '08-tambah-lagi') return { ...f, layout: 'list', items: PK.filter((p) => p.cat === 'addon').map((p) => ({ label: enOf(p).name, value: `RM${p.price}${p.unit ? '/' + p.unit : ''}` })).slice(0, 6), pkg: 'addon' };
  if (ex === '09-tarikh-kahwin') {
    const rank = { 'sangat tinggi': 0, tinggi: 1, sederhana: 2 };
    const list = WD.filter((w) => w.date > date).sort((a, b) => (rank[a.demand] - rank[b.demand]) || a.date.localeCompare(b.date)).slice(0, 5).sort((a, b) => a.date.localeCompare(b.date));
    return { ...f, layout: 'dates', items: list.map((w) => { const d = new Date(w.date + 'T00:00:00Z'); return { label: `${d.getUTCDate()} ${MON_EN[d.getUTCMonth()]} ${DAY_EN[w.day] || w.day || ''}`.trim(), value: (w.tags || []).slice(0, 2).map((t) => TAG_EN[t] || t).join(' · ') }; }), pkg: 'wed-ns' };
  }
  return f;
}

// which package an item talks about (for its USP line)
const PKG_HINTS = [
  [/\bbride|\bgroom|\bwedding\b/i, 'wed-ns'], [/\bconvo\b|graduat/i, 'konvo-grad'], [/\bportrait|\bfamily photo/i, 'pot-1'], [/\bproduct/i, 'prod-1'], [/\bbike\b|\bcars?\b/i, 'au-reel'],
  [/premium/i, 'wed-prem'], [/foto \+ video|foto dan video|videografer/i, 'wed-fv'], [/nikah \+ sanding|nikah dan sanding/i, 'wed-ns'], [/tunang/i, 'wed-tunang'], [/sanding/i, 'wed-sanding'], [/nikah/i, 'wed-nikah'],
  [/kahwin|pengantin|wedding/i, 'wed-ns'], [/pre-?wedding.*sinematik|sinematik.*pre-?wedding/i, 'pre-2'], [/pre-?wedding/i, 'pre-1'],
  [/bengkel|showroom|aksesori/i, 'au-bengkel'], [/rolling|sinematik.*kereta/i, 'au-cine'], [/reel.*kereta|kereta.*reel/i, 'au-reel'], [/\bkereta\b|\bcar\b|\bmyvi\b/i, 'au-reel'],
  [/konvo geng|geng/i, 'konvo-geng'], [/konvo|graduan/i, 'konvo-grad'], [/keluarga/i, 'pot-2'], [/potret|profile|model/i, 'pot-1'],
  [/produk brand|lifestyle/i, 'prod-2'], [/produk|shopee|tiktok shop/i, 'prod-1'],
  [/\bevent\b|majlis korporat|launching/i, 'ev-full'], [/\bads\b|\biklan\b/i, 'cc-ads'], [/content (kickstart|full)|pakej content|a–z 30/i, 'cc-full'],
];
function pkgOf(item) {
  const f = item.feed || {};
  if (f.pkg) return f.pkg;
  // 0) a price poster: the package with exactly that price (when only one has it)
  const amt = f.price && Number(String(f.price.amount || '').replace(/[^\d]/g, ''));
  if (amt) { const hit = PK.filter((p) => p.cat !== 'addon' && p.price === amt); if (hit.length === 1) return hit[0].id; }
  // 1) a catalogue package named in the eyebrow / headline (longest name first)
  const head = [f.eyebrow, f.headline].join(' ').toLowerCase();
  const byName = [...PK].filter((p) => p.cat !== 'addon').sort((a, b) => b.name.length - a.name.length).find((p) => head.includes(p.name.toLowerCase()));
  if (byName) return byName.id;
  // 2) keywords in the poster text, then (sales only) in the caption
  const feedTxt = [f.eyebrow, f.headline, f.sub, ...(f.items || []).map((x) => x.label)].join(' ');
  for (const txt of [feedTxt, item.dept === 'sales' ? item.caption : '']) for (const [re, id] of PKG_HINTS) if (re.test(txt || '')) return id;
  return null;
}

function enrich(item) {
  const it = { ...item, feed: { ...(item.feed || {}) }, story: item.story ? { ...item.story } : null };
  if (it.feed.existingPoster) it.feed = fromPoster(it.feed, it.date);
  const key = `${it.date}/${it.dept}`;
  const id = pkgOf(it);
  it.pkg = id;
  // posters that compare several packages get a category line (catalogue facts only)
  const priced = (it.feed.items || []).filter((x) => /RM\s?\d/.test(x.value || '')).length;
  const cat = id && (PK.find((p) => p.id === id) || {}).cat;
  const CAT_USP = { auto: 'From RM150 · reel packages too', konvo: 'From RM120 per grad (min 5)', event: 'From RM200/hr (min 2 hrs)', wedding: 'From RM450 · full prices in catalogue', content: 'From RM1,999 a month', potret: 'From RM350 · full prices in catalogue', produk: 'From RM450 · Shopee & TikTok sizes' };
  const catU = it.feed.layout === 'list' && priced >= 3 && CAT_USP[cat];
  const U = USP_EN || USP;
  const u = USP.items[key] || catU || (id && U.packages[id] && U.packages[id].uspShort) || U.brand || '';
  if (u) { it.feed.usp = it.feed.usp || u; if (it.story) it.story.usp = it.story.usp || u; }
  return it;
}
module.exports = { enrich, pkgOf };
