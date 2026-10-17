// SnapSense HQ — Tetapan (Farid). Maklumat syarikat + senarai harga (katalog) + tentang data.
(function () {
  'use strict';

  // Katalog harga awam SnapSense (salinan seed/packages.json).
  const DEFAULT_PACKAGES = [{"id": "wed-tunang","cat": "wedding","name": "Tunang","price": 450,"cover": "3 jam · 1 jurugambar","inc": ["Unlimited shot","20 gambar disunting","Outdoor + indoor"]},{"id": "wed-nikah","cat": "wedding","name": "Nikah","price": 750,"cover": "3 jam · 1 jurugambar","inc": ["Gambar tanpa had, 150+ disunting","Penghantaran melalui Google Drive","Sesi potret pengantin"]},{"id": "wed-sanding","cat": "wedding","name": "Sanding","price": 1100,"cover": "5 jam · 1 jurugambar","inc": ["250+ gambar disunting","Potret pengantin & keluarga","1 reel 30–60 saat"]},{"id": "wed-ns","cat": "wedding","name": "Nikah + Sanding","price": 1500,"popular": true,"cover": "8 jam · 1 jurugambar","inc": ["350+ gambar disunting","Sesi outdoor mini","2 reels untuk TikTok/IG","Siap dalam 14 hari"]},{"id": "wed-fv","cat": "wedding","name": "Foto + Video","price": 3200,"cover": "8 jam · jurugambar + videografer","inc": ["Semua dalam Nikah + Sanding","Video highlight 3–5 minit","3 reels"]},{"id": "wed-prem","cat": "wedding","name": "Premium","price": 3999,"cover": "10 jam · 2 jurugambar + videografer","inc": ["Semua dalam Foto + Video","Same-day edit","Album cetak 20 muka","Printed frame A1 poster","Custom pendrive"]},{"id": "konvo-mini","cat": "konvo","name": "Konvo Mini","price": 180,"cover": "1 jam","inc": ["40 gambar disunting","Siap dalam 5 hari"]},{"id": "konvo-grad","cat": "konvo","name": "Konvo Graduan","price": 280,"popular": true,"cover": "2 jam · 2 lokasi","inc": ["80 gambar disunting","1 reel","Siap dalam 5 hari"]},{"id": "konvo-geng","cat": "konvo","name": "Konvo Geng","price": 120,"unit": "seorang","min": 5,"cover": "2 jam · minimum 5 graduan","inc": ["30 gambar setiap graduan","1 gambar group","1 reel group"]},{"id": "pot-1","cat": "potret","name": "Potret / Model","price": 350,"cover": "1 jam · 1 lokasi","inc": ["30 gambar disunting","Sesuai untuk portfolio model & profil"]},{"id": "pot-2","cat": "potret","name": "Potret Plus / Keluarga","price": 650,"cover": "2 jam · 2 outfit atau lokasi","inc": ["60 gambar disunting","1 reel"]},{"id": "pre-1","cat": "potret","name": "Pre-wedding Kasual","price": 699,"cover": "2 jam · 1 lokasi","inc": ["50 gambar disunting","1 reel"]},{"id": "pre-2","cat": "potret","name": "Pre-wedding Sinematik","price": 1499,"popular": true,"cover": "4 jam · 2 lokasi","inc": ["80 gambar disunting","Video teaser 60 saat","2 reels"]},{"id": "prod-1","cat": "produk","name": "Produk Starter","price": 450,"cover": "10 gambar produk","inc": ["Latar putih bersih","Saiz sedia Shopee & TikTok Shop"]},{"id": "prod-2","cat": "produk","name": "Produk Brand","price": 990,"popular": true,"cover": "20 gambar + 1 video","inc": ["15 gambar produk","5 gambar lifestyle bersama model","1 video 15–30 saat"]},{"id": "au-asas","cat": "auto","name": "Car Shoot Asas","price": 150,"cover": "1 kereta · 1 jam · 1 lokasi","inc": ["10 gambar disunting (warna & pantulan dibersihkan)","Sudut luar + 3 detail (rim, lampu, interior)","Siap dalam 3 hari"]},{"id": "au-reel","cat": "auto","name": "Car Shoot + Reel","price": 299,"popular": true,"cover": "1 kereta · 2 jam · 2 lokasi","inc": ["20 gambar disunting","1 reel 9:16 (30–45 saat) untuk TikTok & IG","Sesi golden hour atau malam dengan lampu","Siap dalam 4 hari"]},{"id": "au-cine","cat": "auto","name": "Sinematik + Rolling Shot","price": 1299,"cover": "1 kereta · 4 jam · foto + video","inc": ["Video sinematik 60–90 saat (16:9 + 9:16)","Rolling shot di jalan (kereta pengiring disediakan pelanggan)","20 gambar disunting","Muzik berlesen & color grading","Siap dalam 7 hari"]},{"id": "au-bengkel","cat": "auto","name": "Bengkel & Showroom","price": 1799,"unit": "bulan","min": 1,"cover": "4 sesi sebulan untuk kedai aksesori & bengkel","inc": ["4 sesi penggambaran sebulan di premis anda","Gambar before/after setiap pemasangan (sehingga 60 gambar)","8 reel 9:16 untuk promosi","Poster IG dengan logo & nama produk anda","Siap dalam 48 jam selepas setiap sesi"]},{"id": "cc-kick","cat": "content","name": "Content Kickstart","price": 1999,"unit": "bulan","cover": "12 video + 12 poster sebulan","inc": ["12 video bawah 1 minit","12 poster / carousel Instagram","Talent dari pihak anda, kami arahkan dari A hingga Z","1 hari shooting sebulan","Content plan, caption & hashtag","Jadual & posting dibuat oleh kami"]},{"id": "cc-full","cat": "content","name": "Content Full A–Z 30","price": 4999,"unit": "bulan","popular": true,"cover": "30 video + 30 poster sebulan","inc": ["30 video bawah 1 minit (1 sehari)","30 poster / carousel Instagram","Talent kami","Idea & skrip ikut content pillar dan marketing funnel","2–3 hari shooting sebulan","Caption, hashtag, jadual & posting ke IG, TikTok, FB","Laporan prestasi bulanan"]},{"id": "cc-ads","cat": "content","name": "Content Full A–Z + Ads","price": 6999,"unit": "bulan","cover": "30 + 30 dengan pengurusan iklan","inc": ["Semua dalam Full A–Z 30","Setup & urus iklan Meta dan TikTok (bajet iklan berasingan)","2 kempen iklan sebulan","Balas komen & DM waktu pejabat","Laporan ringkas setiap minggu"]},{"id": "ev-jam","cat": "event","name": "Foto Event","price": 200,"unit": "jam","min": 2,"cover": "Minimum 2 jam","inc": ["Semua gambar disunting","Sesuai untuk majlis kecil & launching"]},{"id": "ev-half","cat": "event","name": "Event Separuh Hari","price": 750,"cover": "4 jam · foto","inc": ["Liputan penuh 4 jam","Gambar terpilih dalam 48 jam"]},{"id": "ev-full","cat": "event","name": "Event Sehari","price": 1400,"popular": true,"cover": "8 jam · foto","inc": ["Liputan penuh 8 jam","Gambar terpilih dalam 48 jam"]},{"id": "ev-vid","cat": "event","name": "Event Video Highlight","price": 1999,"cover": "1 hari · video","inc": ["Video highlight 2–3 minit","2 reels"]},{"id": "ad-jam","cat": "addon","name": "Jam tambahan","price": 150,"unit": "jam","inc": []},{"id": "ad-reel","cat": "addon","name": "Reel tambahan","price": 150,"unit": "reel","inc": []},{"id": "ad-dron","cat": "addon","name": "Rakaman dron","price": 300,"inc": []},{"id": "ad-sde","cat": "addon","name": "Same-day edit","price": 500,"inc": []},{"id": "ad-album","cat": "addon","name": "Album cetak 20 muka","price": 350,"inc": []},{"id": "ad-ekspres","cat": "addon","name": "Siap ekspres 48 jam","price": 200,"inc": []}];

  const CATS = [
    ['wedding', 'Perkahwinan'], ['konvo', 'Konvokesyen'], ['potret', 'Potret & Pre-wedding'], ['produk', 'Produk'],
    ['auto', 'Automotif'], ['content', 'Content Bulanan'], ['event', 'Event'], ['addon', 'Add-on'],
  ];
  const CAT_NAME = Object.fromEntries(CATS);
  const UNITS = [['', '(tiada — harga pakej)'], ['jam', '/ jam'], ['bulan', '/ bulan'], ['seorang', '/ seorang'], ['reel', '/ reel']];

  const DEFAULT_TERMS = [
    'Tempahan disahkan selepas bayaran deposit diterima.',
    'Baki bayaran perlu dijelaskan selewat-lewatnya pada hari sesi / majlis.',
    'Deposit tidak dikembalikan jika pembatalan dibuat kurang 7 hari sebelum tarikh sesi.',
    'Pertukaran tarikh dibenarkan sekali dengan notis sekurang-kurangnya 7 hari, tertakluk kepada kekosongan jadual.',
    'Hasil siap disunting dihantar melalui Google Drive dalam tempoh yang dijanjikan; fail mentah tidak diserahkan melainkan dipersetujui.',
    'Kos perjalanan jauh, penginapan dan parkir (jika ada) ditanggung oleh klien.',
  ].join('\n');

  const DEFAULTS = {
    name: 'SnapSense', legalName: '', regNo: '', tagline: 'TRIGGER YOUR SENSE', phone: '016-803 1153', email: '', address: '',
    website: 'https://snapsensecatalogue.netlify.app/', instagram: '@snapsenseofficial', bankName: '', bankAccount: '', bankHolder: '',
    quotePrefix: 'SS-Q', depositPct: 30, validDays: 14, terms: DEFAULT_TERMS,
  };

  // [key, label, kind, span2, placeholder]
  const FIELDS = [
    ['name', 'Nama jenama', 'text'], ['legalName', 'Nama berdaftar', 'text', 0, 'cth. SnapSense Enterprise'],
    ['regNo', 'No. SSM', 'text'], ['tagline', 'Tagline', 'text'],
    ['phone', 'Telefon / WhatsApp', 'text'], ['email', 'Emel', 'email'],
    ['address', 'Alamat', 'area', 1], ['website', 'Laman web', 'text'],
    ['instagram', 'Instagram', 'text'], ['bankName', 'Bank', 'text', 0, 'cth. Maybank'],
    ['bankAccount', 'No. akaun', 'text'], ['bankHolder', 'Nama pemegang akaun', 'text'],
    ['quotePrefix', 'Prefix sebut harga', 'text'], ['depositPct', 'Deposit % default', 'number'],
    ['validDays', 'Sah (hari) default', 'number'], ['terms', 'Terma default', 'area', 1],
  ];

  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  const ICON_TAG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>';

  HQ.css('settings', `
.st-stack { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.st-hint { margin: 0 0 14px; font-size: 13.5px; color: var(--muted); }
.st-formfoot { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 16px; }
.st-formfoot .st-state { font-size: 13px; color: var(--muted); }
.st-formfoot .st-state[data-dirty="1"] { color: var(--warn); }
.st-notice { margin: 0 0 14px; padding: 10px 12px; font-size: 13px; border-radius: var(--radius-sm); background: var(--info-bg); color: var(--info); }
.st-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
.st-tools .input { flex: 1 1 200px; min-width: 0; }
.st-tools-sum { font-size: 13px; color: var(--muted); }
.st-table { min-width: 0; }
.st-table td { vertical-align: top; }
.st-group th { background: var(--surface-2); text-align: left; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 8px 16px; }
.st-group th small { font-weight: 500; letter-spacing: 0; text-transform: none; margin-left: 6px; }
.st-name { font-weight: 600; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.st-sub { display: none; font-size: 12.5px; color: var(--muted); margin-top: 2px; font-weight: 400; }
.st-price { white-space: nowrap; text-align: right; font-family: var(--font-mono); font-size: 13px; }
.st-price small { color: var(--muted); font-size: 11.5px; }
.st-acts { white-space: nowrap; text-align: right; }
.st-acts .btn { margin-left: 4px; }
.st-about { display: grid; gap: 14px; font-size: 14px; line-height: 1.55; }
.st-about p { margin: 0; }
.st-about b { font-weight: 700; }
.st-mode { display: inline-flex; gap: 6px; align-items: center; }
.st-inc { font-family: var(--font-body); }
.st-check { display: flex; align-items: center; gap: 8px; font-size: 14px; }
@media (max-width: 720px) {
  .st-cover-col { display: none; }
  .st-sub { display: block; }
  .st-acts .btn.ghost { padding: 0 8px; }
}
`);

  let root, formEl;
  let dirty = false, filled = false;
  let query = '';

  const val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };

  function fieldHTML(f) {
    const [key, label, kind, span, ph] = f;
    const id = 'st-c-' + key;
    const ctl = kind === 'area'
      ? `<textarea class="input" id="${id}" rows="${key === 'terms' ? 8 : 3}" placeholder="${HQ.esc(ph || '')}"></textarea>`
      : `<input class="input" id="${id}" type="${kind}" ${kind === 'number' ? 'inputmode="numeric" min="0"' : ''} placeholder="${HQ.esc(ph || '')}" autocomplete="off">`;
    const hint = key === 'terms' ? '<span class="hint">Satu terma setiap baris. Muncul pada setiap sebut harga.</span>'
      : key === 'quotePrefix' ? '<span class="hint">No. sebut harga: SS-Q-2610-001</span>' : '';
    return `<div class="field ${span ? 'span-2' : ''}"><label for="${id}">${HQ.esc(label)}</label>${ctl}${hint}</div>`;
  }

  function mount(el) {
    root = el;
    root.innerHTML = `
      <div class="page-head"><h1>Tetapan</h1><p class="sub">Maklumat syarikat, senarai harga dan cara data disimpan.</p></div>
      <div class="st-stack">
        <section class="card" id="st-company-card">
          <div class="card-head"><h2>Maklumat syarikat</h2></div>
          <div class="card-body">
            <div class="st-notice" id="st-defaults-note" hidden>Belum ada maklumat disimpan. Nilai asal SnapSense diisi dahulu. Semak, kemudian tekan Simpan.</div>
            <p class="st-hint">Butiran ini digunakan pada sebut harga (kepala surat, akaun bank, terma dan deposit asal).</p>
            <form id="st-company-form" class="form-grid" autocomplete="off" novalidate>${FIELDS.map(fieldHTML).join('')}</form>
            <div class="st-formfoot">
              <button class="btn primary" id="st-save" type="button">Simpan</button>
              <button class="btn ghost" id="st-reset" type="button">Batal perubahan</button>
              <span class="st-state" id="st-state" data-dirty="0"></span>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>Senarai harga (katalog)</h2>
            <div class="row"><button class="btn sm" id="st-addmissing" type="button" hidden>Tambah pakej yang belum ada dari katalog</button>
              <button class="btn sm primary" id="st-newpkg" type="button">+ Pakej baru</button></div></div>
          <div class="st-tools"><input class="input" id="st-search" type="search" placeholder="Cari pakej…" aria-label="Cari pakej" autocomplete="off"><span class="st-tools-sum" id="st-sum"></span></div>
          <div id="st-pk"></div>
        </section>

        <section class="card">
          <div class="card-head"><h2>Tentang data</h2><span class="st-mode" id="st-mode"></span></div>
          <div class="card-body st-about" id="st-about"></div>
        </section>
      </div>`;
    formEl = root.querySelector('#st-company-form');

    formEl.addEventListener('input', () => { dirty = true; setState(); });
    root.querySelector('#st-save').onclick = saveCompany;
    root.querySelector('#st-reset').onclick = () => { dirty = false; fillForm(true); setState(); };
    root.querySelector('#st-newpkg').onclick = () => editPkg(null);
    root.querySelector('#st-addmissing').onclick = addMissing;
    root.querySelector('#st-search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderPkgs(); });
    root.querySelector('#st-pk').addEventListener('click', onPkgClick);

    renderAbout();
    renderPkgs();
    HQ.watch('settings', () => { if (!dirty) fillForm(); setState(); });
    HQ.watch('packages', renderPkgs);
    HQ.ready.then(() => { renderAbout(); renderPkgs(); });
  }

  // ---------- company form ----------
  function fillForm(force) {
    if (!HQ.loaded.settings && !force) return;
    if (filled && dirty && !force) return;
    const doc = HQ.get('settings', 'company');
    const src = doc || DEFAULTS;
    FIELDS.forEach(([key]) => {
      const e = document.getElementById('st-c-' + key);
      if (!e) return;
      const v = src[key] == null ? (doc ? '' : DEFAULTS[key]) : src[key];
      e.value = v == null ? '' : v;
    });
    filled = true;
    root.querySelector('#st-defaults-note').hidden = !!doc;
  }

  function setState() {
    const s = root.querySelector('#st-state');
    if (!s) return;
    const doc = HQ.get('settings', 'company');
    s.dataset.dirty = dirty ? '1' : '0';
    s.textContent = dirty ? 'Ada perubahan belum disimpan' : (doc && doc.updatedAt ? 'Disimpan ' + HQ.fmtDate(doc.updatedAt.slice(0, 10)) : '');
  }

  async function saveCompany() {
    const out = {};
    FIELDS.forEach(([key, , kind]) => {
      const v = val('st-c-' + key);
      out[key] = kind === 'number' ? HQ.num(v) : v.trim();
    });
    if (!out.name) { HQ.toast('Sila isi nama jenama', 'bad'); document.getElementById('st-c-name').focus(); return; }
    out.terms = val('st-c-terms').split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
    const existing = HQ.get('settings', 'company') || {};
    const merged = { ...existing, ...out, updatedAt: HQ.nowISO() };
    delete merged.id;
    try { await HQ.set('settings', 'company', merged); } catch (e) { return; }
    dirty = false;
    fillForm(true);
    setState();
    HQ.toast('Disimpan', 'good');
  }

  // ---------- catalogue ----------
  function unitLabel(p) { return p.unit ? `<small>/${HQ.esc(p.unit)}</small>` : ''; }

  function renderPkgs() {
    const box = root && root.querySelector('#st-pk');
    if (!box) return;
    const all = HQ.list('packages');
    const have = new Set(all.map((p) => p.id));
    const missing = DEFAULT_PACKAGES.filter((p) => !have.has(p.id)).length;
    root.querySelector('#st-addmissing').hidden = !(all.length && missing);
    root.querySelector('#st-search').parentElement.hidden = !all.length;
    root.querySelector('#st-sum').textContent = all.length ? `${all.length} pakej` : '';

    if (!all.length) {
      const loaded = HQ.loaded.packages;
      box.innerHTML = `<div class="empty"><div class="empty-ico">${ICON_TAG}</div>
        <div class="empty-title">${loaded ? 'Katalog masih kosong' : 'Memuatkan katalog…'}</div>
        <p class="empty-text">Katalog harga ini menjadi sumber penjana sebut harga dan pilihan pakej dalam Copywriting. Import senarai harga SnapSense atau tambah pakej sendiri.</p>
        <div class="row"><button class="btn primary" data-act="import" type="button">Import katalog SnapSense</button>
        <button class="btn" data-act="new" type="button">+ Pakej baru</button></div></div>`;
      return;
    }

    const rows = all.filter((p) => !query || [p.name, p.cover, CAT_NAME[p.cat], (p.inc || []).join(' ')].join(' ').toLowerCase().includes(query));
    if (!rows.length) {
      box.innerHTML = `<div class="empty"><div class="empty-title">Tiada pakej sepadan</div><p class="empty-text">Cuba kata kunci lain.</p></div>`;
      return;
    }
    const catIds = CATS.map((c) => c[0]);
    const groups = CATS.map(([id, name]) => [id, name, rows.filter((p) => p.cat === id)]);
    const other = rows.filter((p) => !catIds.includes(p.cat));
    if (other.length) groups.push(['_', 'Lain-lain', other]);
    let html = '<div class="table-wrap"><table class="table st-table"><thead><tr><th>Pakej</th><th class="st-cover-col">Liputan</th><th class="num">Harga</th><th></th></tr></thead><tbody>';
    groups.forEach(([, name, items]) => {
      if (!items.length) return;
      html += `<tr class="st-group"><th colspan="4">${HQ.esc(name)}<small>${items.length}</small></th></tr>`;
      items.sort((a, b) => (a.price || 0) - (b.price || 0)).forEach((p) => {
        html += `<tr><td><div class="st-name">${HQ.esc(p.name)}${p.popular ? '<span class="pill" data-tone="accent">Popular</span>' : ''}</div>
          <div class="st-sub">${HQ.esc(p.cover || '')}${p.min ? ' · min ' + HQ.esc(p.min) : ''}</div></td>
          <td class="st-cover-col muted">${HQ.esc(p.cover || '')}${p.min ? ' · min ' + HQ.esc(p.min) : ''}</td>
          <td class="st-price">${HQ.rm0(p.price)}${unitLabel(p)}</td>
          <td class="st-acts"><button class="btn sm ghost" data-act="edit" data-id="${HQ.esc(p.id)}" type="button">Edit</button><button class="btn sm ghost" data-act="del" data-id="${HQ.esc(p.id)}" type="button" aria-label="Padam ${HQ.esc(p.name)}">Padam</button></td></tr>`;
      });
    });
    box.innerHTML = html + '</tbody></table></div>';
  }

  function onPkgClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'import') importAll();
    else if (b.dataset.act === 'new') editPkg(null);
    else if (b.dataset.act === 'edit') editPkg(HQ.get('packages', id));
    else if (b.dataset.act === 'del') delPkg(HQ.get('packages', id));
  }

  async function writeMany(list) {
    try {
      await Promise.all(list.map((p) => { const { id, ...body } = p; return HQ.set('packages', id, { ...body, createdAt: HQ.nowISO() }); }));
      return list.length;
    } catch (e) { return 0; }
  }
  async function importAll() {
    const n = await writeMany(DEFAULT_PACKAGES);
    if (n) HQ.toast(`${n} pakej diimport`, 'good');
  }
  async function addMissing() {
    const have = new Set(HQ.list('packages').map((p) => p.id));
    const list = DEFAULT_PACKAGES.filter((p) => !have.has(p.id));
    if (!list.length) { HQ.toast('Semua pakej katalog sudah ada'); return; }
    const n = await writeMany(list);
    if (n) HQ.toast(`${n} pakej ditambah`, 'good');
  }

  async function delPkg(p) {
    if (!p) return;
    if (!(await HQ.confirm(`Padam pakej "${p.name}"? Sebut harga sedia ada tidak terjejas.`, 'Padam'))) return;
    try { await HQ.remove('packages', p.id); HQ.toast('Pakej dipadam'); } catch (e) { /* toast by core */ }
  }

  function editPkg(p) {
    const isNew = !p;
    p = p || { cat: 'wedding', name: '', price: '', cover: '', inc: [] };
    const body = HQ.h(`<div class="form-grid">
      <div class="field span-2"><label for="st-p-name">Nama pakej</label><input class="input" id="st-p-name" value="${HQ.esc(p.name)}" autocomplete="off"></div>
      <div class="field"><label for="st-p-cat">Kategori</label><select class="input" id="st-p-cat">${CATS.map(([id, n]) => `<option value="${id}" ${p.cat === id ? 'selected' : ''}>${HQ.esc(n)}</option>`).join('')}</select></div>
      <div class="field"><label for="st-p-price">Harga (RM)</label><input class="input" id="st-p-price" type="number" inputmode="decimal" min="0" value="${HQ.esc(p.price)}"></div>
      <div class="field"><label for="st-p-unit">Unit harga</label><select class="input" id="st-p-unit">${UNITS.map(([v, n]) => `<option value="${v}" ${(p.unit || '') === v ? 'selected' : ''}>${HQ.esc(n)}</option>`).join('')}</select></div>
      <div class="field"><label for="st-p-min">Kuantiti minimum</label><input class="input" id="st-p-min" type="number" inputmode="numeric" min="0" value="${HQ.esc(p.min || '')}" placeholder="pilihan"></div>
      <div class="field span-2"><label for="st-p-cover">Liputan</label><input class="input" id="st-p-cover" value="${HQ.esc(p.cover || '')}" placeholder="cth. 3 jam · 1 jurugambar" autocomplete="off"></div>
      <div class="field span-2"><label for="st-p-inc">Termasuk</label><textarea class="input" id="st-p-inc" rows="5" placeholder="Satu item setiap baris">${HQ.esc((p.inc || []).join('\n'))}</textarea><span class="hint">Satu item setiap baris.</span></div>
      <label class="st-check span-2" for="st-p-popular"><input class="input" type="checkbox" id="st-p-popular" ${p.popular ? 'checked' : ''}> Tandakan sebagai popular</label>
    </div>`);
    HQ.modal({
      title: isNew ? 'Pakej baru' : 'Edit pakej', body, wide: true,
      actions: [
        { label: 'Batal', kind: 'ghost' },
        {
          label: 'Simpan', kind: 'primary',
          onClick: async () => {
            const name = val('st-p-name').trim();
            if (!name) { HQ.toast('Sila isi nama pakej', 'bad'); return false; }
            const o = { ...(isNew ? {} : p), cat: val('st-p-cat'), name, price: HQ.num(val('st-p-price')), cover: val('st-p-cover').trim(),
              inc: val('st-p-inc').split('\n').map((l) => l.trim()).filter(Boolean) };
            const unit = val('st-p-unit'); const min = HQ.num(val('st-p-min'));
            if (unit) o.unit = unit; else delete o.unit;
            if (min > 0) o.min = min; else delete o.min;
            if (document.getElementById('st-p-popular').checked) o.popular = true; else delete o.popular;
            const id = isNew ? HQ.uid('pkg') : p.id;
            if (isNew) o.createdAt = HQ.nowISO();
            try { await HQ.set('packages', id, o); } catch (e) { return false; }
            HQ.toast('Disimpan', 'good');
          },
        },
      ],
    });
  }

  // ---------- about ----------
  function renderAbout() {
    const box = root.querySelector('#st-about');
    const live = !!HQ.live;
    root.querySelector('#st-mode').innerHTML = `<span class="pill" data-tone="${live ? 'good' : 'warn'}">${live ? 'Live' : 'Pratonton'}</span>`;
    box.innerHTML = `
      <p><b>Di mana data disimpan.</b> Semua data (tugasan, content, copy, sebut harga, katalog) disimpan di dalam dashboard ini. Ia peribadi kepada akaun Claude pemilik kecuali pemilik memilih untuk berkongsi dashboard ini.</p>
      <p><b>Kru virtual office.</b> Pasukan di <a href="${HQ.esc(HQ.OFFICE_URL)}" target="_blank" rel="noopener">Virtual Office</a> boleh mengemas kini data ini apabila diminta, contohnya Aina menyediakan copywriting bulanan atau Irfan menyusun kempen.</p>
      <p><b>${live ? 'Live' : 'Pratonton'}.</b> ${live
        ? 'Anda sedang dalam mod Live: perubahan disimpan terus dan dikongsi dengan kru yang mengemas kini dashboard.'
        : 'Anda sedang dalam mod Pratonton: data hanya disimpan dalam pelayar ini sebagai percubaan dan tidak dikongsi dengan kru. Buka dashboard melalui Claude untuk mod Live.'}</p>`;
  }

  HQ.tab('settings', { label: 'Tetapan', icon: ICON, mount, onShow: () => { if (root) renderAbout(); } });
})();
