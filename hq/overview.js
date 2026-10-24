// SnapSense HQ — Utama (overview). Tab id: utama.
(function () {
  'use strict';
  const HQ = window.HQ;
  const TZ = 'Asia/Kuala_Lumpur';
  const LS_KEY = 'hq-gcal-connected';

  const ICON = '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 10 3.5l7 6"/><path d="M5 8.5V16h10V8.5"/><path d="M8.5 16v-4h3v4"/></svg>';

  const PLATFORM = { tiktok: 'TikTok', instagram: 'IG', facebook: 'FB', youtube: 'YouTube', threads: 'Threads' };
  const CONTENT_STATUS = {
    idea: ['Idea', 'muted'], skrip: ['Skrip', 'info'], shoot: ['Shoot', 'warn'],
    edit: ['Edit', 'warn'], siap: ['Siap', 'good'], posted: ['Posted', 'accent'],
  };
  const QUOTE_STATUS = {
    draf: ['Draf', 'muted'], dihantar: ['Dihantar', 'info'], diterima: ['Diterima', 'accent'],
    ditolak: ['Ditolak', 'bad'], dibayar: ['Dibayar', 'good'],
  };
  const PIPE = [
    { key: 'draf', label: 'Draf', color: 'var(--line-strong)' },
    { key: 'dihantar', label: 'Dihantar', color: 'var(--info)' },
    { key: 'diterima', label: 'Diterima', color: 'var(--accent)' },
    { key: 'dibayar', label: 'Dibayar', color: 'var(--good)' },
  ];

  HQ.css('overview', `
    .ov-kpis { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ov-kpis > * { min-width: 0; }
    @media (min-width: 900px) { .ov-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; } }
    .ov-kpis .kpi-value { font-size: clamp(22px, 5.4vw, 30px); }
    .ov-kpi-bad { color: var(--bad); }
    .ov-cards { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); margin-top: 16px; }
    .ov-cards > * { min-width: 0; }
    @media (min-width: 900px) { .ov-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ov-wide { grid-column: 1 / -1; } }
    .ov-cards .card { display: flex; flex-direction: column; }
    .ov-cards .card-body { flex: 1 1 auto; }
    .ov-head-link { font-size: 13px; }
    .ov-hello { margin: 0; }

    .ov-note { margin: 0; padding: 14px 4px; color: var(--muted); font-size: 13.5px; text-align: center; }
    .ov-note .btn { margin-top: 10px; }
    .ov-list { list-style: none; margin: 0; padding: 0; }
    .ov-more { margin: 8px 0 0; font-size: 12.5px; color: var(--muted); }

    .ov-todo { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--line); }
    .ov-todo:last-child { border-bottom: 0; }
    .ov-todo input[type="checkbox"] { flex: none; width: 20px; height: 20px; margin: 0; cursor: pointer; }
    .ov-todo-main { flex: 1 1 auto; min-width: 0; }
    .ov-todo-title { display: block; font-weight: 600; overflow-wrap: anywhere; line-height: 1.35; }
    .ov-todo-meta { display: block; font-size: 12.5px; color: var(--muted); }
    .ov-late { color: var(--bad); font-weight: 600; }
    .ov-add { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
    .ov-add .input { flex: 1 1 auto; }
    .ov-add .btn { flex: none; }

    .ov-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 6px; margin: 0; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: none; color: inherit; text-align: left; cursor: pointer; font: inherit; }
    .ov-row:last-child { border-bottom: 0; }
    .ov-row:hover { background: var(--surface-2); }
    .ov-row:focus-visible { outline-offset: -2px; }
    .ov-date { flex: none; width: 78px; line-height: 1.2; }
    .ov-date b { display: block; white-space: nowrap; font-size: 13px; }
    .ov-date span { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
    .ov-grow { flex: 1 1 auto; min-width: 0; }
    .ov-title { display: block; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ov-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
    .ov-tags .pill { height: 18px; font-size: 11px; padding: 0 6px; }
    .ov-camp { margin-top: 12px; padding: 12px; border-radius: var(--radius-sm); background: var(--accent-bg); }
    .ov-camp-k { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .ov-camp-name { font-weight: 700; margin-top: 2px; overflow-wrap: anywhere; }
    .ov-camp-week { margin-top: 6px; font-size: 13.5px; overflow-wrap: anywhere; }

    .ov-bar { display: flex; gap: 2px; height: 16px; border-radius: 999px; overflow: hidden; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); }
    .ov-seg { height: 100%; min-width: 6px; }
    .ov-legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin: 14px 0 6px; }
    .ov-leg { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; min-width: 0; }
    .ov-dot { flex: none; width: 10px; height: 10px; margin-top: 4px; border-radius: 3px; }
    .ov-leg b { display: block; font-variant-numeric: tabular-nums; }
    .ov-leg span { color: var(--muted); font-size: 12px; }
    .ov-q-sub { display: block; font-size: 12.5px; color: var(--muted); }
    .ov-q-amt { flex: none; font-family: var(--font-mono); font-size: 12.5px; font-variant-numeric: tabular-nums; }
    .ov-sub-h { margin: 14px 0 2px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }

    .ov-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .ov-stat { padding: 10px; border-radius: var(--radius-sm); background: var(--surface-2); text-align: center; }
    .ov-stat b { display: block; font-family: var(--font-display); font-size: 24px; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .ov-stat span { font-size: 12px; color: var(--muted); }
    .ov-draft { display: flex; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--line); font-size: 13.5px; }
    .ov-draft:last-child { border-bottom: 0; }
    .ov-draft .mono { flex: none; color: var(--muted); }
    .ov-draft span:last-child { min-width: 0; overflow-wrap: anywhere; }

    .ov-cal-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .ov-cal-msg { margin: 10px 0 0; font-size: 13px; color: var(--muted); }
    .ov-cal-msg.bad { color: var(--bad); }
    .ov-ev { display: flex; align-items: baseline; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); }
    .ov-ev:last-child { border-bottom: 0; }
    .ov-ev-d { flex: none; width: 82px; font-size: 13px; font-weight: 600; }
    .ov-ev-t { flex: none; width: 50px; font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
    .ov-ev-s { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }

    .ov-crew { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
    .ov-person { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--radius-sm); min-width: 0; }
    .ov-person.idle { opacity: 0.6; }
    .ov-crew-card .ov-crew { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
    .ov-person b { display: block; font-size: 13.5px; line-height: 1.25; }
    .ov-person div span { display: block; font-size: 12px; color: var(--muted); line-height: 1.3; }
    .ov-office { margin: 14px 0 0; font-size: 13.5px; }
    .ov-links { display: flex; flex-wrap: wrap; gap: 8px; }
  `);

  // ---------- helpers ----------
  const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const hourMY = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
  const monthKey = () => HQ.today().slice(0, 7);
  const prevMonthKey = () => { let [y, m] = monthKey().split('-').map(Number); m -= 1; if (m < 1) { m = 12; y -= 1; } return y + '-' + String(m).padStart(2, '0'); };
  const greeting = () => { const h = hourMY(); return h >= 5 && h < 12 ? 'Selamat pagi' : h >= 12 && h < 15 ? 'Selamat tengah hari' : h >= 15 && h < 19 ? 'Selamat petang' : 'Selamat malam'; };
  const pill = (txt, tone) => `<span class="pill" data-tone="${tone}">${HQ.esc(txt)}</span>`;
  const dayWord = (ymdStr) => { const n = HQ.diffDays(ymdStr, HQ.today()); return n === 0 ? 'Hari ini' : n === 1 ? 'Esok' : `${HQ.DAYS_SHORT[HQ.weekday(ymdStr)]}, ${Number(ymdStr.slice(8))} ${HQ.MONTHS_SHORT[Number(ymdStr.slice(5, 7)) - 1]}`; };
  const PRIO = { tinggi: 0, sederhana: 1, rendah: 2 };

  function mount(root) {
    root.innerHTML = `
      <div class="page-head">
        <h1 id="ov-hello" class="ov-hello"></h1>
        <p class="sub" id="ov-sub"></p>
      </div>
      <div class="ov-kpis" id="ov-kpis"></div>
      <div class="ov-cards">
        <section class="card" aria-labelledby="ov-h-today">
          <div class="card-head"><h2 id="ov-h-today">Hari ini</h2><button class="btn ghost sm ov-head-link" id="ov-go-todo" type="button">Lihat semua →</button></div>
          <div class="card-body">
            <div id="ov-todos"></div>
            <form class="ov-add" id="ov-add" autocomplete="off">
              <input class="input" id="ov-add-title" type="text" placeholder="Tambah tugasan untuk hari ini" aria-label="Tajuk tugasan baharu" maxlength="200">
              <button class="btn primary" id="ov-add-btn" type="submit">Tambah</button>
            </form>
          </div>
        </section>
        <section class="card" aria-labelledby="ov-h-content">
          <div class="card-head"><h2 id="ov-h-content">Content minggu ini</h2><button class="btn ghost sm ov-head-link" id="ov-go-content" type="button">Lihat semua →</button></div>
          <div class="card-body" id="ov-content"></div>
        </section>
        <section class="card" aria-labelledby="ov-h-pipe">
          <div class="card-head"><h2 id="ov-h-pipe">Pipeline sebut harga</h2><button class="btn sm" id="ov-new-quote" type="button">+ Sebut harga</button></div>
          <div class="card-body" id="ov-pipe"></div>
        </section>
        <section class="card" aria-labelledby="ov-h-copy">
          <div class="card-head"><h2 id="ov-h-copy">Copywriting bulan ini</h2><button class="btn ghost sm ov-head-link" id="ov-go-copy" type="button">Buka Copywriting →</button></div>
          <div class="card-body" id="ov-copy"></div>
        </section>
        <section class="card" aria-labelledby="ov-h-cal">
          <div class="card-head"><h2 id="ov-h-cal">Jadual Google Calendar</h2><button class="btn sm" id="ov-cal-btn" type="button">Sambung Google Calendar</button></div>
          <div class="card-body" id="ov-cal"></div>
        </section>
        <section class="card" aria-labelledby="ov-h-links">
          <div class="card-head"><h2 id="ov-h-links">Pautan pantas</h2></div>
          <div class="card-body">
            <div class="ov-links">
              <button class="btn sm" id="ov-q-todo" type="button">+ Tugasan</button>
              <button class="btn sm" id="ov-q-content" type="button">+ Content</button>
              <button class="btn sm" id="ov-q-quote" type="button">+ Sebut harga</button>
              <a class="btn sm" id="ov-q-katalog" href="https://snapsensecatalogue.netlify.app/" target="_blank" rel="noopener">Katalog ↗</a>
              <a class="btn sm" id="ov-q-tiktok" href="https://www.tiktok.com/tiktokstudio" target="_blank" rel="noopener">TikTok Studio ↗</a>
            </div>
          </div>
        </section>
        <section class="card ov-wide ov-crew-card" aria-labelledby="ov-h-crew">
          <div class="card-head"><h2 id="ov-h-crew">Pasukan</h2></div>
          <div class="card-body">
            <div id="ov-crew"></div>
            <p class="ov-office"><a href="${HQ.esc(HQ.OFFICE_URL)}" target="_blank" rel="noopener">Lihat mereka bekerja di Virtual Office ↗</a></p>
          </div>
        </section>
      </div>`;

    const $ = (id) => root.querySelector('#' + id);
    const todoInput = $('ov-add-title');

    // ---------- renderers ----------
    function openTodos() { return HQ.list('todos').filter((t) => t.status !== 'done'); }
    function dueTodos() {
      const today = HQ.today();
      return openTodos().filter((t) => t.due && t.due <= today).sort((a, b) =>
        (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || ((a.time || '99') < (b.time || '99') ? -1 : (a.time || '99') > (b.time || '99') ? 1 : 0) || ((PRIO[a.priority] ?? 1) - (PRIO[b.priority] ?? 1)));
    }
    function weekContent() {
      const a = HQ.today(), b = HQ.addDays(a, 6);
      return HQ.list('content').filter((c) => c.date && c.date >= a && c.date <= b).sort((x, y) =>
        (x.date < y.date ? -1 : x.date > y.date ? 1 : 0) || ((x.time || '') < (y.time || '') ? -1 : 1));
    }
    function waitingQuotes() { return HQ.list('quotes').filter((q) => q.status === 'dihantar'); }
    const qTotal = (q) => Number(q.total) || 0;

    function renderHead() {
      $('ov-hello').textContent = greeting();
      const today = HQ.today();
      const nT = dueTodos().length, nC = weekContent().length, nQ = waitingQuotes().length;
      const sum = (nT + nC + nQ) === 0 ? 'Tiada tugasan, content atau sebut harga yang menunggu.'
        : `${nT} tugasan hari ini · ${nC} content minggu ini · ${nQ} sebut harga menunggu`;
      $('ov-sub').textContent = `${HQ.DAYS[HQ.weekday(today)]}, ${HQ.fmtDateLong(today)} — ${sum}`;
    }

    function renderKpis() {
      const today = HQ.today(), mk = monthKey(), pk = prevMonthKey();
      const open = openTodos();
      const late = open.filter((t) => t.due && t.due < today).length;
      const monthC = HQ.list('content').filter((c) => (c.date || '').slice(0, 7) === mk);
      const posted = monthC.filter((c) => c.status === 'posted').length;
      const wait = waitingQuotes();
      const waitRM = wait.reduce((s, q) => s + qTotal(q), 0);
      const won = (m) => HQ.list('quotes').filter((q) => (q.status === 'diterima' || q.status === 'dibayar') && (q.date || '').slice(0, 7) === m).reduce((s, q) => s + qTotal(q), 0);
      const cur = won(mk), prev = won(pk);
      let foot;
      if (!prev && !cur) foot = 'Belum ada jualan bulan ini atau bulan lepas';
      else if (!prev) foot = `Bulan lepas: RM 0`;
      else { const pct = Math.round(((cur - prev) / prev) * 100); foot = `${pct >= 0 ? '+' : ''}${pct}% berbanding bulan lepas (${HQ.rm0(prev)})`; }
      const k = (label, value, foot2, cls) => `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value ${cls || ''}">${value}</div><div class="kpi-foot">${foot2}</div></div>`;
      $('ov-kpis').innerHTML =
        k('Tugasan belum siap', open.length, late ? `${late} lewat` : 'Tiada yang lewat') +
        k('Content bulan ini', `${posted} / ${monthC.length}`, 'posted / dirancang') +
        k('Sebut harga menunggu', wait.length, wait.length ? HQ.esc(HQ.rm0(waitRM)) + ' dihantar' : 'Tiada yang dihantar') +
        k('Jualan diterima bulan ini', HQ.esc(HQ.rm0(cur)), HQ.esc(foot));
    }

    function renderTodos() {
      const list = dueTodos(), today = HQ.today();
      const box = $('ov-todos');
      if (!list.length) { box.innerHTML = '<p class="ov-note">Tiada tugasan untuk hari ini. Tambah satu di bawah.</p>'; return; }
      const shown = list.slice(0, 8);
      box.innerHTML = '<ul class="ov-list">' + shown.map((t) => {
        const n = HQ.diffDays(t.due, today);
        const when = n < 0 ? `<span class="ov-late">${-n} hari lewat</span>` : `Hari ini${t.time ? ' · ' + HQ.esc(t.time) : ''}`;
        const c = HQ.crew(t.assignee);
        return `<li class="ov-todo">
          <input class="input" type="checkbox" id="ov-chk-${HQ.esc(t.id)}" data-todo="${HQ.esc(t.id)}" aria-label="Tanda siap: ${HQ.esc(t.title)}">
          <label class="ov-todo-main" for="ov-chk-${HQ.esc(t.id)}"><span class="ov-todo-title">${HQ.esc(t.title)}</span><span class="ov-todo-meta">${when}${t.category ? ' · ' + HQ.esc(t.category) : ''}</span></label>
          <span class="avatar sm" style="--c:${c.color}" title="${HQ.esc(c.name)}">${HQ.esc(c.name[0])}</span>
        </li>`;
      }).join('') + '</ul>' + (list.length > shown.length ? `<p class="ov-more">+${list.length - shown.length} lagi dalam senarai penuh</p>` : '');
    }

    function renderContent() {
      const list = weekContent(), box = $('ov-content');
      const mk = monthKey();
      const camp = HQ.list('campaigns').filter((c) => c.month === mk)[0];
      let html;
      if (!list.length) html = '<p class="ov-note">Tiada content dijadualkan untuk 7 hari akan datang.<br><button class="btn sm" id="ov-empty-content" type="button">+ Content</button></p>';
      else {
        html = '<div>' + list.slice(0, 7).map((c) => {
          const st = CONTENT_STATUS[c.status] || [c.status || 'Idea', 'muted'];
          const tags = (c.platforms || []).map((p) => `<span class="pill" data-tone="muted">${HQ.esc(PLATFORM[p] || p)}</span>`).join('');
          return `<button type="button" class="ov-row" data-content="${HQ.esc(c.id)}">
            <span class="ov-date"><b>${HQ.esc(dayWord(c.date))}</b><span>${HQ.esc(c.time || '')}</span></span>
            <span class="ov-grow"><span class="ov-title">${HQ.esc(c.title)}</span><span class="ov-tags">${tags}</span></span>
            ${pill(st[0], st[1])}
          </button>`;
        }).join('') + '</div>' + (list.length > 7 ? `<p class="ov-more">+${list.length - 7} lagi minggu ini</p>` : '');
      }
      if (camp) {
        const sl = Array.isArray(camp.storyline) ? camp.storyline : [];
        let week = '';
        if (sl.length) {
          const maxW = Math.max(...sl.map((s) => Number(s.week) || 0));
          const w = Math.min(Math.ceil(Number(HQ.today().slice(8)) / 7), maxW || 1);
          const item = sl.find((s) => Number(s.week) === w) || sl[Math.min(w, sl.length) - 1];
          if (item) week = `<div class="ov-camp-week"><b>Minggu ${w}:</b> ${HQ.esc(item.title)}</div>`;
        }
        html += `<div class="ov-camp"><div class="ov-camp-k">Kempen aktif</div><div class="ov-camp-name">${HQ.esc(camp.name)}</div>${week}</div>`;
      } else html += '<p class="ov-more">Tiada kempen aktif bulan ini.</p>';
      box.innerHTML = html;
    }

    function renderPipe() {
      const qs = HQ.list('quotes'), box = $('ov-pipe');
      if (!qs.length) { box.innerHTML = '<p class="ov-note">Belum ada sebut harga. Cipta yang pertama untuk lihat pipeline di sini.</p>'; return; }
      const sums = PIPE.map((p) => { const r = qs.filter((q) => q.status === p.key); return { ...p, n: r.length, rm: r.reduce((s, q) => s + qTotal(q), 0) }; });
      const total = sums.reduce((s, x) => s + x.rm, 0);
      const bar = sums.filter((x) => x.rm > 0).map((x) => `<div class="ov-seg" style="width:${(x.rm / total * 100).toFixed(2)}%;background:${x.color}" title="${HQ.esc(x.label)}: ${HQ.esc(HQ.rm0(x.rm))}"></div>`).join('');
      const legend = sums.map((x) => `<div class="ov-leg"><i class="ov-dot" style="background:${x.color}"></i><div><b>${HQ.esc(HQ.rm0(x.rm))}</b><span>${x.label} · ${x.n}</span></div></div>`).join('');
      const recent = qs.slice().sort((a, b) => ((b.date || '') + (b.createdAt || '')).localeCompare((a.date || '') + (a.createdAt || ''))).slice(0, 4);
      const rows = recent.map((q) => {
        const st = QUOTE_STATUS[q.status] || [q.status || '-', 'muted'];
        const cl = (q.client && (q.client.company || q.client.name)) || 'Tanpa nama';
        return `<button type="button" class="ov-row" data-quote="${HQ.esc(q.id)}"><span class="ov-grow"><span class="ov-title">${HQ.esc(cl)}</span><span class="ov-q-sub">${HQ.esc(q.no || '')}${q.event && q.event.title ? ' · ' + HQ.esc(q.event.title) : ''}</span></span><span class="ov-q-amt">${HQ.esc(HQ.rm0(qTotal(q)))}</span>${pill(st[0], st[1])}</button>`;
      }).join('');
      box.innerHTML = `<div class="ov-bar" role="img" aria-label="Nilai sebut harga mengikut status">${bar}</div><div class="ov-legend">${legend}</div><div class="ov-sub-h">Terkini</div>${rows}`;
    }

    function renderCopy() {
      const mk = monthKey(), cs = HQ.list('copies').filter((c) => c.month === mk), box = $('ov-copy');
      if (!cs.length) { box.innerHTML = '<p class="ov-note">Belum ada copywriting untuk bulan ini.<br><button class="btn sm" id="ov-empty-copy" type="button">Buka Copywriting</button></p>'; return; }
      const n = (s) => cs.filter((c) => c.status === s).length;
      const drafts = cs.filter((c) => c.status === 'draf').sort((a, b) => (a.no || 0) - (b.no || 0)).slice(0, 3);
      box.innerHTML = `<div class="ov-stats"><div class="ov-stat"><b>${n('draf')}</b><span>Draf</span></div><div class="ov-stat"><b>${n('diluluskan')}</b><span>Diluluskan</span></div><div class="ov-stat"><b>${n('digunakan')}</b><span>Digunakan</span></div></div>` +
        (drafts.length ? `<div class="ov-sub-h">Draf seterusnya</div>` + drafts.map((c) => `<div class="ov-draft"><span class="mono">#${HQ.esc(c.no || '-')}</span><span>${HQ.esc(c.title)}</span></div>`).join('') : '<p class="ov-more">Tiada draf menunggu.</p>');
    }

    function renderCrew() {
      const mk = monthKey(), open = openTodos(), cont = HQ.list('content').filter((c) => (c.date || '').slice(0, 7) === mk);
      $('ov-crew').innerHTML = '<div class="ov-crew">' + HQ.CREW.map((c) => {
        const t = open.filter((x) => x.assignee === c.id).length, p = cont.filter((x) => x.owner === c.id).length;
        return `<div class="ov-person${t + p ? '' : ' idle'}"><span class="avatar" style="--c:${c.color}">${HQ.esc(c.name[0])}</span><div><b>${HQ.esc(c.name)}</b><span>${HQ.esc(c.role)}</span><span>${t} tugasan · ${p} post</span></div></div>`;
      }).join('') + '</div>';
    }

    function renderAll() { renderHead(); renderKpis(); renderTodos(); renderContent(); renderPipe(); renderCopy(); renderCrew(); }
    let raf = 0;
    const schedule = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; renderAll(); }); };
    ['todos', 'content', 'campaigns', 'copies', 'quotes'].forEach((c) => HQ.watch(c, schedule));
    renderAll();

    // ---------- Google Calendar ----------
    const cal = { state: 'idle', events: [], msg: '', last: 0 };
    let connected = false;
    try { connected = localStorage.getItem(LS_KEY) === '1'; } catch (e) { /* ignore */ }

    function evStart(ev) { const s = ev && ev.start; return (s && (s.dateTime || s.date)) || (typeof s === 'string' ? s : ''); }
    function extract(result) {
      let data = result;
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        data = result.payload ?? result.structuredContent;
        if (data == null) { const t = result.content && result.content[0] && result.content[0].text; data = t != null ? JSON.parse(t) : result; }
      }
      if (typeof data === 'string') data = JSON.parse(data);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.events)) return data.events;
        if (Array.isArray(data.items)) return data.items;
        const inner = data.result || data.data;
        if (inner && typeof inner === 'object') { if (Array.isArray(inner)) return inner; if (Array.isArray(inner.events)) return inner.events; if (Array.isArray(inner.items)) return inner.items; }
        // An empty calendar comes back as calendar details with no events list.
        if ('accessRole' in data || 'timeZone' in data || 'nextPageToken' in data) return [];
      }
      throw Object.assign(new Error('format'), { code: 'format_tidak_dikenali' });
    }
    function fmtEv(ev) {
      const s = evStart(ev);
      if (!s) return { day: '', time: '', ts: 0 };
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { day: dayWord(s), time: 'Sehari', ts: Date.parse(s + 'T00:00:00+08:00') };
      const d = new Date(s);
      if (isNaN(d)) return { day: String(s).slice(0, 10), time: '', ts: 0 };
      const time = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
      return { day: dayWord(ymd(d)), time, ts: d.getTime() };
    }
    function renderCal() {
      const box = $('ov-cal'), btn = $('ov-cal-btn');
      btn.textContent = cal.state === 'loading' ? 'Memuatkan…' : (connected || cal.state === 'ok') ? 'Muat semula' : 'Sambung Google Calendar';
      btn.disabled = cal.state === 'loading';
      let html = '';
      if (cal.state === 'ok') {
        const evs = cal.events.map((e) => ({ e, f: fmtEv(e) })).sort((a, b) => a.f.ts - b.f.ts).slice(0, 8);
        html = evs.length ? '<div>' + evs.map(({ e, f }) => `<div class="ov-ev"><span class="ov-ev-d">${HQ.esc(f.day)}</span><span class="ov-ev-t">${HQ.esc(f.time)}</span><span class="ov-ev-s">${HQ.esc(e.summary || e.title || '(Tanpa tajuk)')}</span></div>`).join('') + '</div>'
          : '<p class="ov-note">Tiada acara dalam 7 hari akan datang.</p>';
      } else if (cal.state === 'err') html = `<p class="ov-cal-msg bad">${HQ.esc(cal.msg)}</p>`;
      else if (cal.state === 'nomcp') html = `<p class="ov-cal-msg">${HQ.esc(cal.msg)}</p>`;
      else if (cal.state === 'loading') html = '<p class="ov-cal-msg">Memuatkan jadual 7 hari akan datang.</p>';
      else html = '<p class="ov-note">Sambung Google Calendar untuk lihat acara 7 hari akan datang di sini.</p>';
      box.innerHTML = html;
    }
    async function loadCal(auto) {
      if (cal.state === 'loading') return;
      cal.state = 'loading'; renderCal();
      try {
        const mcp = await HQ.capability('mcp');
        if (!mcp) { cal.state = 'nomcp'; cal.msg = 'Buka dalam Claude untuk sambung'; if (auto) cal.state = 'idle'; renderCal(); return; }
        const now = new Date();
        // The connector wants local Malaysia time with no offset, plus the zone name.
        const local = (d) => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d).replace(' ', 'T');
        const res = await mcp.callTool('Google Calendar', 'list_events', { startTime: local(now), endTime: local(new Date(now.getTime() + 7 * 86400000)), timeZone: TZ, orderBy: 'startTime', pageSize: 20 });
        if (res && res.isError) { const t = res.content && res.content[0] && res.content[0].text; throw Object.assign(new Error(t || 'ralat'), { code: res.code || 'ralat_alat' }); }
        cal.events = extract(res); cal.state = 'ok'; cal.last = Date.now(); connected = true;
        try { localStorage.setItem(LS_KEY, '1'); } catch (e) { /* ignore */ }
      } catch (e) {
        cal.state = 'err';
        cal.msg = `Tak dapat muat jadual (${(e && e.code) || (e && e.message) || 'ralat'}). Cuba lagi.`;
      }
      renderCal();
    }
    renderCal();
    if (connected) setTimeout(() => loadCal(true), 0);
    root.__ovCal = () => { if (connected && Date.now() - cal.last > 60000) loadCal(true); };

    // ---------- actions ----------
    const go = (tab) => () => HQ.go(tab);
    $('ov-go-todo').onclick = go('todo');
    $('ov-go-content').onclick = go('content');
    $('ov-go-copy').onclick = go('copy');
    $('ov-cal-btn').onclick = () => loadCal(false);
    const newQuote = () => (HQ.newQuote ? HQ.newQuote({}) : HQ.go('quote'));
    const newContent = () => (HQ.newContent ? HQ.newContent({ date: HQ.today() }) : HQ.go('content'));
    $('ov-new-quote').onclick = newQuote;
    $('ov-q-quote').onclick = newQuote;
    $('ov-q-content').onclick = newContent;
    $('ov-q-todo').onclick = () => { todoInput.scrollIntoView({ block: 'center', behavior: 'smooth' }); todoInput.focus({ preventScroll: true }); };

    root.addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-content],[data-quote],#ov-empty-content,#ov-empty-copy');
      if (!t) return;
      if (t.dataset.content) HQ.openContent ? HQ.openContent(t.dataset.content) : HQ.go('content');
      else if (t.dataset.quote) HQ.go('quote');
      else if (t.id === 'ov-empty-content') newContent();
      else HQ.go('copy');
    });
    root.addEventListener('change', async (ev) => {
      const cb = ev.target.closest('input[data-todo]');
      if (!cb) return;
      cb.disabled = true;
      try { await HQ.update('todos', cb.dataset.todo, { status: 'done', doneAt: HQ.nowISO() }); HQ.toast('Tugasan siap', 'good'); }
      catch (e) { cb.checked = false; cb.disabled = false; }
    });
    $('ov-add').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const title = todoInput.value.trim();
      if (!title) { todoInput.focus(); return; }
      const btn = $('ov-add-btn'); btn.disabled = true;
      try {
        if (HQ.todoQuickAdd) await HQ.todoQuickAdd(title, { due: HQ.today() });
        else await HQ.add('todos', { title, notes: '', due: HQ.today(), time: '', priority: 'sederhana', status: 'todo', assignee: 'me', category: 'Lain-lain' }, 'td');
        todoInput.value = ''; HQ.toast('Tugasan ditambah', 'good');
      } catch (e) { /* core shows toast */ }
      btn.disabled = false; todoInput.focus();
    });
  }

  HQ.tab('utama', { label: 'Utama', icon: ICON, mount, onShow: (root) => { if (root.__ovCal) root.__ovCal(); } });
})();
