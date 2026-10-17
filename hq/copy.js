// SnapSense HQ — Copywriting (Farid). Koleksi `copies`, ditulis oleh Aina.
(function () {
  'use strict';

  const TYPES = ['Caption TikTok', 'Caption IG', 'Iklan Meta', 'Iklan TikTok', 'WhatsApp broadcast', 'Story', 'Carousel', 'Bio', 'DM / balas komen', 'Google Business', 'Facebook post'];
  const STATUSES = [['draf', 'Draf', 'muted'], ['diluluskan', 'Diluluskan', 'info'], ['digunakan', 'Digunakan', 'good']];
  const ST = Object.fromEntries(STATUSES.map((s) => [s[0], s]));
  const PILLARS = ['', 'Edukasi', 'Hiburan', 'Testimoni', 'Behind the scenes', 'Promosi', 'Portfolio', 'Tips'];

  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
  const ICON_BIG = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';

  HQ.css('copy', `
.cw-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.cw-month { display: inline-flex; align-items: center; gap: 2px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 2px; }
.cw-month-label { min-width: 120px; text-align: center; font-weight: 700; font-size: 14px; padding: 0 6px; }
.cw-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
@media (max-width: 720px) { .cw-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.cw-stat { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; min-width: 0; }
.cw-stat-v { font-family: var(--font-display); font-weight: 800; font-size: 26px; line-height: 1.1; font-variant-numeric: tabular-nums; }
.cw-stat-v small { font-size: 13px; color: var(--muted); font-weight: 500; font-family: var(--font-body); }
.cw-stat-l { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
.cw-filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.cw-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cw-fline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.cw-fline .input { flex: 1 1 180px; min-width: 0; width: auto; }
.cw-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 820px) { .cw-grid { grid-template-columns: minmax(0, 1fr); } }
.cw-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.cw-top { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.cw-top .cw-st { margin-left: auto; }
.cw-no { font-family: var(--font-mono); font-size: 12px; font-weight: 700; background: var(--ink); color: var(--surface); border-radius: 6px; padding: 2px 7px; }
.cw-title { margin: 0; font-size: 12.5px; color: var(--muted); font-weight: 500; overflow-wrap: anywhere; }
.cw-head { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 18px; line-height: 1.25; overflow-wrap: anywhere; }
.cw-body { white-space: pre-wrap; font-size: 14px; line-height: 1.55; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 8; line-clamp: 8; overflow: hidden; }
.cw-body.open { display: block; overflow: visible; }
.cw-more { align-self: flex-start; background: none; border: 0; padding: 0; color: var(--info); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.cw-more[hidden] { display: none; }
.cw-cta { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.cw-cta::before { content: "CTA  "; font-family: var(--font-mono); font-size: 10.5px; color: var(--muted); letter-spacing: 0.06em; margin-right: 4px; }
.cw-tags { color: var(--muted); font-size: 13px; overflow-wrap: anywhere; }
.cw-date { font-size: 12.5px; color: var(--muted); }
.cw-acts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--line); }
.cw-acts .push { margin-left: auto; }
`);

  let root;
  const S = { month: HQ.today().slice(0, 7), type: '', status: '', service: '', q: '' };
  const expanded = new Set();

  const monthLabel = (m) => { const [y, mo] = m.split('-').map(Number); return `${HQ.MONTHS[mo - 1]} ${y}`; };
  const shiftMonth = (m, n) => { const [y, mo] = m.split('-').map(Number); const d = new Date(Date.UTC(y, mo - 1 + n, 1)); return d.toISOString().slice(0, 7); };
  const pad = (n) => String(n).padStart(2, '0');
  const svcName = (id) => (!id || id === 'umum') ? 'Umum' : ((HQ.get('packages', id) || {}).name || id);

  function mount(el) {
    root = el;
    root.innerHTML = `
      <div class="page-head"><h1>Copywriting</h1><p class="sub">Disediakan oleh Aina</p>
        <div class="actions"><div class="cw-month">
          <button class="icon-btn" id="cw-prev" type="button" aria-label="Bulan sebelum">‹</button>
          <span class="cw-month-label" id="cw-month" aria-live="polite"></span>
          <button class="icon-btn" id="cw-next" type="button" aria-label="Bulan seterusnya">›</button></div>
          <button class="btn ghost sm" id="cw-now" type="button">Bulan ini</button>
          <button class="btn primary" id="cw-new" type="button">+ Copy baru</button></div></div>
      <div class="cw-stats" id="cw-stats"></div>
      <div class="cw-filters" id="cw-filters" hidden>
        <div class="cw-chips" id="cw-types" role="group" aria-label="Jenis copy"></div>
        <div class="cw-fline"><select class="input" id="cw-service" aria-label="Servis"></select>
          <input class="input" id="cw-search" type="search" placeholder="Cari tajuk, headline, kandungan…" autocomplete="off" aria-label="Cari copy"></div>
        <div class="cw-chips" id="cw-status" role="group" aria-label="Status"></div>
      </div>
      <div id="cw-list"></div>`;

    root.querySelector('#cw-prev').onclick = () => setMonth(shiftMonth(S.month, -1));
    root.querySelector('#cw-next').onclick = () => setMonth(shiftMonth(S.month, 1));
    root.querySelector('#cw-now').onclick = () => setMonth(HQ.today().slice(0, 7));
    root.querySelector('#cw-new').onclick = () => edit(null);
    root.querySelector('#cw-search').addEventListener('input', (e) => { S.q = e.target.value.trim().toLowerCase(); renderList(); });
    root.querySelector('#cw-service').addEventListener('change', (e) => { S.service = e.target.value; renderList(); });
    root.querySelector('#cw-types').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (b) { S.type = b.dataset.type; render(); } });
    root.querySelector('#cw-status').addEventListener('click', (e) => { const b = e.target.closest('[data-status]'); if (b) { S.status = b.dataset.status; render(); } });
    root.querySelector('#cw-list').addEventListener('click', onClick);

    HQ.watch('copies', render);
    HQ.watch('packages', render);
    render();
  }

  function setMonth(m) { S.month = m; S.type = ''; S.status = ''; S.service = ''; render(); }

  const inMonth = () => HQ.list('copies').filter((c) => (c.month || (c.date || '').slice(0, 7)) === S.month);

  function filtered(rows) {
    return rows.filter((c) =>
      (!S.type || c.type === S.type) && (!S.status || c.status === S.status) &&
      (!S.service || (c.service || 'umum') === S.service) &&
      (!S.q || [c.title, c.headline, c.body, c.cta, c.hashtags, c.type, svcName(c.service)].join(' ').toLowerCase().includes(S.q)))
      .sort((a, b) => (a.no || 999) - (b.no || 999) || String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  function render() {
    if (!root) return;
    const rows = inMonth();
    root.querySelector('#cw-month').textContent = monthLabel(S.month);
    root.querySelector('#cw-now').hidden = S.month === HQ.today().slice(0, 7);

    const cnt = (s) => rows.filter((c) => c.status === s).length;
    root.querySelector('#cw-stats').innerHTML =
      `<div class="cw-stat"><div class="cw-stat-v">${rows.length}<small> / 30</small></div><div class="cw-stat-l">Jumlah bulan ini</div></div>` +
      STATUSES.map(([id, label]) => `<div class="cw-stat"><div class="cw-stat-v">${cnt(id)}</div><div class="cw-stat-l">${label}</div></div>`).join('');

    const filtersEl = root.querySelector('#cw-filters');
    filtersEl.hidden = !rows.length;
    if (rows.length) {
      const types = TYPES.filter((t) => rows.some((c) => c.type === t)).concat([...new Set(rows.map((c) => c.type))].filter((t) => t && !TYPES.includes(t)));
      if (S.type && !types.includes(S.type)) S.type = '';
      root.querySelector('#cw-types').innerHTML = [['', 'Semua']].concat(types.map((t) => [t, t]))
        .map(([v, l]) => `<button type="button" class="chip ${S.type === v ? 'on' : ''}" aria-pressed="${S.type === v}" data-type="${HQ.esc(v)}">${HQ.esc(l)}</button>`).join('');
      root.querySelector('#cw-status').innerHTML = [['', 'Semua status']].concat(STATUSES.map((s) => [s[0], s[1]]))
        .map(([v, l]) => `<button type="button" class="chip ${S.status === v ? 'on' : ''}" aria-pressed="${S.status === v}" data-status="${v}">${l}${v ? ' · ' + cnt(v) : ''}</button>`).join('');
      const svcs = [...new Set(rows.map((c) => c.service || 'umum'))];
      if (S.service && !svcs.includes(S.service)) S.service = '';
      const sel = root.querySelector('#cw-service');
      const opts = '<option value="">Semua servis</option>' + svcs.map((s) => `<option value="${HQ.esc(s)}">${HQ.esc(svcName(s))}</option>`).join('');
      if (sel.dataset.sig !== opts) { sel.innerHTML = opts; sel.dataset.sig = opts; }
      sel.value = S.service;
    }
    renderList();
  }

  function renderList() {
    const box = root.querySelector('#cw-list');
    const rows = inMonth();
    if (!rows.length) {
      const total = HQ.list('copies').length;
      box.innerHTML = `<div class="empty"><div class="empty-ico">${ICON_BIG}</div>
        <div class="empty-title">${HQ.loaded.copies ? `Belum ada copy untuk ${HQ.esc(monthLabel(S.month))}` : 'Memuatkan copy…'}</div>
        <p class="empty-text">Aina menulis 30 copy sebulan di sini: caption TikTok &amp; IG, iklan Meta, WhatsApp broadcast dan lain-lain, siap dengan headline, CTA dan hashtag. Minta Aina di Virtual Office, atau tambah sendiri.${total ? ' Copy bulan lain ada, gunakan butang bulan di atas.' : ''}</p>
        <button class="btn primary" data-act="new" type="button">+ Copy baru</button></div>`;
      return;
    }
    const list = filtered(rows);
    if (!list.length) {
      box.innerHTML = `<div class="empty"><div class="empty-title">Tiada copy sepadan</div><p class="empty-text">Tiada copy sepadan dengan tapisan semasa.</p>
        <button class="btn" data-act="clear" type="button">Kosongkan tapisan</button></div>`;
      return;
    }
    box.innerHTML = `<div class="cw-grid">${list.map(cardHTML).join('')}</div>`;
    requestAnimationFrame(measure);
  }

  function cardHTML(c) {
    const st = ST[c.status] || ST.draf;
    const open = expanded.has(c.id);
    const acts = [];
    acts.push(`<button class="btn sm" data-act="copy" data-id="${HQ.esc(c.id)}" type="button">Salin</button>`);
    if (c.status === 'draf' || !c.status) acts.push(`<button class="btn sm" data-act="approve" data-id="${HQ.esc(c.id)}" type="button">Lulus</button>`);
    if (c.status !== 'digunakan') acts.push(`<button class="btn sm" data-act="used" data-id="${HQ.esc(c.id)}" type="button">Tanda digunakan</button>`);
    else acts.push(`<button class="btn sm ghost" data-act="unused" data-id="${HQ.esc(c.id)}" type="button">Batal guna</button>`);
    acts.push(`<button class="btn sm ghost push" data-act="edit" data-id="${HQ.esc(c.id)}" type="button">Edit</button>`);
    acts.push(`<button class="btn sm ghost" data-act="del" data-id="${HQ.esc(c.id)}" type="button">Padam</button>`);
    return `<article class="cw-card" data-id="${HQ.esc(c.id)}">
      <div class="cw-top"><span class="cw-no">#${c.no ? pad(c.no) : '--'}</span>
        <span class="pill" data-tone="accent">${HQ.esc(c.type || 'Copy')}</span>
        <span class="pill" data-tone="muted">${HQ.esc(svcName(c.service))}</span>
        <span class="pill cw-st" data-tone="${st[2]}">${st[1]}</span></div>
      ${c.title ? `<p class="cw-title">${HQ.esc(c.title)}</p>` : ''}
      ${c.headline ? `<h3 class="cw-head">${HQ.esc(c.headline)}</h3>` : ''}
      ${c.body ? `<div class="cw-body ${open ? 'open' : ''}">${HQ.esc(c.body)}</div><button class="cw-more" type="button" data-act="more" data-id="${HQ.esc(c.id)}" ${open ? '' : 'hidden'}>${open ? 'Tutup' : 'Baca penuh'}</button>` : ''}
      ${c.cta ? `<div class="cw-cta">${HQ.esc(c.cta)}</div>` : ''}
      ${c.hashtags ? `<div class="cw-tags">${HQ.esc(c.hashtags)}</div>` : ''}
      ${c.date ? `<div class="cw-date">${HQ.esc(HQ.fmtDate(c.date, true))}</div>` : ''}
      <div class="cw-acts">${acts.join('')}</div></article>`;
  }

  function measure() {
    root.querySelectorAll('.cw-card').forEach((card) => {
      const b = card.querySelector('.cw-body'); const m = card.querySelector('.cw-more');
      if (!b || !m || b.classList.contains('open')) return;
      m.hidden = !(b.scrollHeight > b.clientHeight + 2);
    });
  }

  const fullText = (c) => [c.headline, c.body, c.cta, c.hashtags].filter((x) => x && String(x).trim()).join('\n\n');

  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id; const c = id ? HQ.get('copies', id) : null;
    switch (b.dataset.act) {
      case 'new': edit(null); break;
      case 'clear': S.type = ''; S.status = ''; S.service = ''; S.q = ''; root.querySelector('#cw-search').value = ''; render(); break;
      case 'more': if (expanded.has(id)) expanded.delete(id); else expanded.add(id); renderList(); break;
      case 'copy': if (c) HQ.copy(fullText(c)); break;
      case 'approve': if (c) HQ.update('copies', id, { status: 'diluluskan' }).then(() => HQ.toast('Diluluskan', 'good'), () => {}); break;
      case 'used': if (c) HQ.update('copies', id, { status: 'digunakan' }).then(() => HQ.toast('Ditanda digunakan', 'good'), () => {}); break;
      case 'unused': if (c) HQ.update('copies', id, { status: 'diluluskan' }).then(() => HQ.toast('Dikembalikan ke diluluskan'), () => {}); break;
      case 'edit': if (c) edit(c); break;
      case 'del': if (c) del(c); break;
      default:
    }
  }

  async function del(c) {
    if (!(await HQ.confirm(`Padam copy #${c.no ? pad(c.no) : ''} "${c.headline || c.title || ''}"?`, 'Padam'))) return;
    try { await HQ.remove('copies', c.id); HQ.toast('Copy dipadam'); } catch (e) { /* toast by core */ }
  }

  const val = (id) => document.getElementById(id).value;

  function edit(c) {
    const isNew = !c;
    const month = S.month;
    const nextNo = HQ.list('copies').filter((x) => x.month === month).reduce((m, x) => Math.max(m, x.no || 0), 0) + 1;
    c = c || { no: nextNo, type: S.type || TYPES[1], service: S.service || 'umum', month, status: 'draf', title: '', headline: '', body: '', cta: '', hashtags: '', date: '', pillar: '', notes: '' };
    const pk = HQ.list('packages').slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const svcOpts = [['umum', 'Umum']].concat(pk.map((p) => [p.id, p.name]));
    if (c.service && !svcOpts.some((o) => o[0] === c.service)) svcOpts.push([c.service, c.service]);
    const typeOpts = TYPES.includes(c.type) ? TYPES : TYPES.concat([c.type]);
    const pillarOpts = c.pillar && !PILLARS.includes(c.pillar) ? PILLARS.concat([c.pillar]) : PILLARS;
    const sel = (opts, cur) => opts.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o || '(tiada)']; return `<option value="${HQ.esc(v)}" ${v === cur ? 'selected' : ''}>${HQ.esc(l)}</option>`; }).join('');
    const body = HQ.h(`<div class="form-grid">
      <div class="field"><label for="cw-f-no">No.</label><input class="input" id="cw-f-no" type="number" min="1" max="99" inputmode="numeric" value="${HQ.esc(c.no || '')}"></div>
      <div class="field"><label for="cw-f-type">Jenis</label><select class="input" id="cw-f-type">${sel(typeOpts, c.type)}</select></div>
      <div class="field"><label for="cw-f-service">Servis</label><select class="input" id="cw-f-service">${sel(svcOpts, c.service || 'umum')}</select></div>
      <div class="field"><label for="cw-f-pillar">Pillar</label><select class="input" id="cw-f-pillar">${sel(pillarOpts, c.pillar || '')}</select></div>
      <div class="field span-2"><label for="cw-f-title">Tajuk (rujukan dalaman)</label><input class="input" id="cw-f-title" value="${HQ.esc(c.title || '')}" autocomplete="off"></div>
      <div class="field span-2"><label for="cw-f-headline">Headline</label><input class="input" id="cw-f-headline" value="${HQ.esc(c.headline || '')}" autocomplete="off"></div>
      <div class="field span-2"><label for="cw-f-body">Kandungan</label><textarea class="input" id="cw-f-body" rows="9">${HQ.esc(c.body || '')}</textarea></div>
      <div class="field span-2"><label for="cw-f-cta">CTA</label><input class="input" id="cw-f-cta" value="${HQ.esc(c.cta || '')}" autocomplete="off"></div>
      <div class="field span-2"><label for="cw-f-tags">Hashtag</label><input class="input" id="cw-f-tags" value="${HQ.esc(c.hashtags || '')}" placeholder="#snapsense #fotografimalaysia" autocomplete="off"></div>
      <div class="field"><label for="cw-f-date">Tarikh siar (pilihan)</label><input class="input" id="cw-f-date" type="date" value="${HQ.esc(c.date || '')}"></div>
      <div class="field"><label for="cw-f-status">Status</label><select class="input" id="cw-f-status">${sel(STATUSES.map((s) => [s[0], s[1]]), c.status || 'draf')}</select></div>
      <div class="field span-2"><label for="cw-f-notes">Nota</label><textarea class="input" id="cw-f-notes" rows="2">${HQ.esc(c.notes || '')}</textarea></div>
    </div>`);
    HQ.modal({
      title: isNew ? 'Copy baru' : `Edit copy #${c.no ? pad(c.no) : ''}`, body, wide: true,
      actions: [
        { label: 'Batal', kind: 'ghost' },
        {
          label: 'Simpan', kind: 'primary',
          onClick: async () => {
            const headline = val('cw-f-headline').trim(); const text = val('cw-f-body').trim();
            if (!headline && !text) { HQ.toast('Isi headline atau kandungan', 'bad'); return false; }
            const date = val('cw-f-date');
            const o = {
              ...(isNew ? { by: 'me' } : c),
              no: Math.round(HQ.num(val('cw-f-no'))) || undefined, type: val('cw-f-type'), service: val('cw-f-service'), pillar: val('cw-f-pillar'),
              title: val('cw-f-title').trim(), headline, body: val('cw-f-body').replace(/\s+$/, ''), cta: val('cw-f-cta').trim(), hashtags: val('cw-f-tags').trim(),
              status: val('cw-f-status'), notes: val('cw-f-notes').trim(), month: date ? date.slice(0, 7) : (c.month || month),
            };
            if (date) o.date = date; else delete o.date;
            if (!o.pillar) delete o.pillar;
            if (!o.notes) delete o.notes;
            if (!o.no) delete o.no;
            try {
              if (isNew) await HQ.add('copies', o, 'cp'); else await HQ.set('copies', c.id, o);
            } catch (e) { return false; }
            HQ.toast('Disimpan', 'good');
            if (o.month !== S.month) { S.month = o.month; S.type = ''; S.status = ''; S.service = ''; render(); }
          },
        },
      ],
    });
  }

  HQ.tab('copy', { label: 'Copywriting', icon: ICON, mount });
})();
