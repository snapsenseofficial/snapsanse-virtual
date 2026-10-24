// SnapSense HQ — Insight & Plan (Farid). Koleksi `insights` dan `plans`.
(function () {
  'use strict';

  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';
  const ICON_PLAN = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
  const ICON_INS = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';

  const PLATS = { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', threads: 'Threads', umum: 'Umum' };
  const CATS = ['Trend', 'Pesaing', 'Hashtag', 'Masa posting', 'Algoritma', 'Musim & tarikh', 'Audiens', 'Format'];
  const IMPACT = { tinggi: ['Impak tinggi', 'bad', 0], sederhana: ['Impak sederhana', 'warn', 1], rendah: ['Impak rendah', 'muted', 2] };
  const DAYCOLS = [['tiktok', 'TikTok'], ['igFeed', 'IG Feed'], ['igStory', 'IG Story'], ['facebook', 'Facebook']];

  HQ.css('insight', `
.in-seg { margin-bottom: 18px; }
.in-sec { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.in-h { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 18px; }
.in-sub-h { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; }
.in-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.in-chips .in-lbl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-right: 2px; }
.in-plan-head { display: flex; flex-direction: column; gap: 10px; padding: 18px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; }
.in-plan-top { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 10px; }
.in-plan-name { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: clamp(20px, 3vw, 26px); line-height: 1.2; overflow-wrap: anywhere; }
.in-dates { font-family: var(--font-mono); font-size: 12.5px; color: var(--muted); }
.in-plan-pick { min-width: 0; max-width: 100%; width: auto; }
.in-goal { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
.in-goal b { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; color: var(--muted); font-weight: 500; text-transform: uppercase; margin-right: 6px; }
.in-summary { margin: 0; font-size: 14px; line-height: 1.6; color: var(--muted); overflow-wrap: anywhere; }
.in-kpis { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: 0; list-style: none; }
.in-kpis li { display: inline-flex; align-items: flex-start; gap: 6px; padding: 6px 12px; border: 1px solid var(--line-strong); border-radius: 14px; background: var(--surface-2); font-size: 13px; font-weight: 600; line-height: 1.4; min-width: 0; overflow-wrap: anywhere; }
.in-kpis li::before { content: ""; flex: none; width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: var(--accent); }
.in-weeks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.in-week { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; }
.in-week.is-now { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-bg), var(--shadow); }
.in-week-top { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.in-week-no { font-family: var(--font-mono); font-size: 11px; font-weight: 700; background: var(--ink); color: var(--surface); border-radius: 6px; padding: 2px 8px; letter-spacing: 0.04em; }
.in-week-dates { font-size: 12.5px; color: var(--muted); }
.in-week-focus { margin: 0; font-weight: 700; font-size: 15px; line-height: 1.4; overflow-wrap: anywhere; }
.in-mix { margin: 0; font-family: var(--font-mono); font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }
.in-tasks { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--line); padding-top: 8px; }
.in-tasks li { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; line-height: 1.45; min-width: 0; }
.in-tasks li > span { min-width: 0; overflow-wrap: anywhere; }
.in-tasks b { font-weight: 700; }
.in-tbl-wrap { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); overflow: hidden; }
.in-tbl-wrap .table-wrap { overflow-x: auto; }
.in-tbl { min-width: 860px; }
.in-tbl td { vertical-align: top; overflow-wrap: anywhere; }
.in-tbl td.in-c-date { white-space: nowrap; min-width: 92px; }
.in-tbl td.in-c-theme { min-width: 130px; font-weight: 600; }
.in-tbl td.in-c-plat { min-width: 150px; font-size: 13px; }
.in-tbl td.in-c-task { min-width: 190px; }
.in-wd { display: block; font-weight: 700; }
.in-dm { display: block; font-size: 12.5px; color: var(--muted); }
.in-tbl tr.is-today td { background: var(--accent-bg); }
.in-tbl tr.is-today td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
.in-tbl tr.is-past td { opacity: 0.58; }
.in-tbl tr.is-past:hover td { opacity: 1; }
.in-who { display: flex; gap: 8px; align-items: flex-start; }
.in-who > span:last-child { min-width: 0; }
.in-add { margin-top: 8px; }
.in-cards { display: none; flex-direction: column; gap: 12px; }
.in-day { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; scroll-margin-top: 80px; }
.in-day.is-today { border-color: var(--accent); background: var(--accent-bg); }
.in-day.is-past { opacity: 0.6; }
.in-day-top { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; }
.in-day-top .in-wd { display: inline; }
.in-day-theme { margin: 0; font-weight: 700; font-size: 15px; line-height: 1.4; overflow-wrap: anywhere; }
.in-line { display: grid; grid-template-columns: 74px minmax(0, 1fr); gap: 8px; font-size: 13.5px; line-height: 1.45; }
.in-line > span:first-child { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding-top: 2px; }
.in-line > span:last-child { overflow-wrap: anywhere; min-width: 0; }
.in-day-task { display: flex; gap: 8px; align-items: flex-start; padding-top: 8px; border-top: 1px solid var(--line); font-size: 13.5px; }
.in-day-task > span:last-child { min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 720px) {
  .in-weeks { grid-template-columns: minmax(0, 1fr); }
  .in-tbl-wrap { display: none; }
  .in-cards { display: flex; }
}
.in-strip { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: baseline; padding: 10px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); font-size: 13px; }
.in-strip b { font-family: var(--font-display); font-weight: 800; font-size: 18px; font-variant-numeric: tabular-nums; margin-right: 3px; }
.in-strip span { color: var(--muted); white-space: nowrap; }
.in-strip span.zero { opacity: 0.5; }
.in-strip .in-total { color: var(--ink); font-weight: 600; margin-right: 6px; }
.in-filters { display: flex; flex-direction: column; gap: 10px; }
.in-fline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.in-fline .input { flex: 1 1 160px; min-width: 0; width: auto; }
.in-fline .input.in-sel { flex: 0 1 180px; }
.in-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 820px) { .in-grid { grid-template-columns: minmax(0, 1fr); } }
.in-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; }
.in-card-top { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.in-card-top .in-imp { margin-left: auto; }
.in-title { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 17px; line-height: 1.3; overflow-wrap: anywhere; }
.in-finding { margin: 0; font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; }
.in-act { padding: 10px 12px; border-radius: var(--radius-sm); background: var(--accent-bg); border-left: 3px solid var(--accent); font-size: 14px; line-height: 1.55; overflow-wrap: anywhere; }
.in-act b { display: block; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 2px; }
.in-src { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12.5px; }
.in-src a { color: var(--info); text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; min-width: 0; }
.in-src .in-lbl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.in-by { display: flex; align-items: center; gap: 8px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }

.in-wed-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; }
.in-cals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 960px) { .in-cals { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .in-cals { grid-template-columns: minmax(0, 1fr); } }
.in-cal { padding: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; }
.in-cal h4 { margin: 0 0 8px; font-family: var(--font-display); font-weight: 800; font-size: 15px; }
.in-cal-g { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }
.in-cal-g > span, .in-cal-g > button { display: grid; place-items: center; aspect-ratio: 1 / 1; min-width: 0; border-radius: 8px; font-size: 12.5px; font-variant-numeric: tabular-nums; padding: 0; font-family: var(--font-body); }
.in-cal-g .in-dow { aspect-ratio: auto; height: 20px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
.in-cal-g .in-d { color: var(--muted); border: 1px solid transparent; }
.in-cal-g .in-d.is-past { opacity: 0.45; }
.in-cal-g button.in-d { cursor: pointer; font-weight: 700; color: var(--ink); background: var(--surface); border: 1.5px solid var(--line-strong); }
.in-cal-g button.in-d[data-dem="sangat tinggi"] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.in-cal-g button.in-d[data-dem="tinggi"] { background: var(--warn-bg); border-color: var(--warn); color: var(--warn); }
.in-cal-g button.in-d.is-dim { opacity: 0.25; }
.in-cal-g .in-d.is-today { box-shadow: 0 0 0 2px var(--ink); color: var(--ink); font-weight: 800; }
.in-cal-g button.in-d:hover { filter: brightness(0.95); border-color: var(--ink); }
.in-cal-g button.in-d:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
.in-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; color: var(--muted); align-items: center; }
.in-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 4px; margin-right: 5px; vertical-align: -1px; border: 1.5px solid var(--line-strong); }
.in-legend i.sg { background: var(--accent); border-color: var(--accent); }
.in-legend i.tg { background: var(--warn-bg); border-color: var(--warn); }
.in-legend i.td { box-shadow: 0 0 0 2px var(--ink); border-color: transparent; }
.in-wcard { display: flex; flex-direction: column; gap: 10px; padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; scroll-margin-top: 90px; transition: box-shadow 0.2s ease, border-color 0.2s ease; }
.in-wcard.is-past { opacity: 0.6; }
.in-wcard.is-hl { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent), var(--shadow); }
.in-wtop { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 6px 10px; }
.in-wlabel { font-family: var(--font-display); font-weight: 800; font-size: 28px; line-height: 1.1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.in-wday { font-size: 13px; color: var(--muted); margin-top: 2px; }
.in-wtags { display: flex; flex-wrap: wrap; gap: 6px; }
.in-note { margin: 0; font-size: 12.5px; color: var(--muted); line-height: 1.5; }

.in-ctbl { min-width: 780px; }
.in-ctbl td { vertical-align: top; overflow-wrap: anywhere; }
.in-ctbl tbody tr { cursor: pointer; }
.in-ctbl tbody tr:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px; }
.in-ctbl .num { white-space: nowrap; }
.in-ctbl th button { all: unset; cursor: pointer; display: inline-flex; gap: 4px; align-items: center; text-transform: inherit; letter-spacing: inherit; }
.in-ctbl th button:focus-visible { outline: 2px solid var(--ink); }
.in-cname { font-weight: 700; display: block; }
.in-cloc { font-size: 12.5px; color: var(--muted); }
.in-niche { display: flex; flex-wrap: wrap; gap: 4px; }
.in-ccards { display: none; flex-direction: column; gap: 12px; }
.in-ccard { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; cursor: pointer; text-align: left; font: inherit; color: inherit; width: 100%; }
.in-ccard:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.in-cfoll { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; }
.in-cfoll b { font-family: var(--font-mono); font-weight: 700; }
.in-cmeta { font-size: 13px; color: var(--muted); overflow-wrap: anywhere; }
@media (max-width: 720px) { .in-ctblw { display: none; } .in-ccards { display: flex; } }
.in-m-sec { margin-bottom: 14px; }
.in-m-sec > b { display: block; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 4px; }
.in-m-sec p { margin: 0; font-size: 14px; line-height: 1.55; overflow-wrap: anywhere; }
.in-m-links { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13.5px; }
.in-m-links a, .in-m-sec .in-src a { color: var(--info); text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; }
`);

  const S = { view: 'plan', ct: '', cn: '', cq: '', cs: '', cd: 1, wt: '', wd: '', planId: '', plat: '', ip: '', ic: '', ii: '', q: '' };
  let root;
  let scrollDone = false;

  const esc = HQ.esc;
  const avatar = (id, sm) => { const c = HQ.crew(id); return `<span class="avatar ${sm ? 'sm' : ''}" style="--c:${esc(c.color)}" title="${esc(c.name)}">${esc(c.name.charAt(0))}</span>`; };
  const safeUrl = (u) => { try { const x = new URL(String(u || '').trim()); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };
  const chip = (attr, val, label, on) => `<button type="button" class="chip ${on ? 'on' : ''}" aria-pressed="${on}" ${attr}="${esc(val)}">${esc(label)}</button>`;

  // ---------------------------------------------------------------- mount
  function mount(el) {
    root = el;
    root.innerHTML = `
      <div class="page-head"><h1>Insight &amp; Plan</h1><p class="sub">Plan kandungan 30 hari dan insight media sosial untuk SnapSense</p></div>
      <div class="in-seg"><div class="tabs-inline" id="in-seg" role="group" aria-label="Paparan"></div></div>
      <div id="in-plan" class="in-sec"></div>
      <div id="in-wed" class="in-sec" hidden>
        <div class="in-wed-bar"><h2 class="in-h">Tarikh menarik untuk kahwin · Okt–Dis 2026</h2>
          <button class="btn" id="in-wcopy" type="button">Salin senarai</button></div>
        <div id="in-wcals" class="in-cals"></div>
        <div id="in-wlegend" class="in-legend"><span><i class="sg"></i>Sangat tinggi</span><span><i class="tg"></i>Tinggi</span><span><i></i>Sederhana</span><span><i class="td"></i>Hari ini</span></div>
        <div class="in-filters"><div class="in-chips" id="in-wtags" role="group" aria-label="Tapis tag"></div>
          <div class="in-fline"><select class="input in-sel" id="in-wdem" aria-label="Tapis permintaan"><option value="">Semua permintaan</option><option value="sangat tinggi">Sangat tinggi</option><option value="tinggi">Tinggi</option><option value="sederhana">Sederhana</option></select></div></div>
        <div id="in-wlist"></div>
        <p class="in-note">Cuti sekolah ikut Kumpulan B (Johor). Sahkan tarikh nikah dengan pejabat agama.</p>
      </div>
      <div id="in-comp" class="in-sec" hidden>
        <div><h2 class="in-h">Benchmark pesaing</h2><p class="in-note" style="margin-top:4px">Dibina daripada sumber awam sahaja. Bilangan pengikut hanya dipaparkan jika ada sumber yang menunjukkannya.</p></div>
        <div id="in-cstrip" class="in-strip"></div>
        <div class="in-filters"><div class="in-chips" id="in-ctypes" role="group" aria-label="Tapis jenis"></div>
          <div class="in-fline"><select class="input in-sel" id="in-cniche" aria-label="Tapis niche"></select>
            <input class="input" id="in-cq" type="search" placeholder="Cari nama, lokasi, pengajaran…" autocomplete="off" aria-label="Cari pesaing">
            <button class="btn" id="in-ccopy" type="button">Salin pengajaran</button></div></div>
        <div id="in-clist"></div>
      </div>
      <div id="in-ins" class="in-sec" hidden>
        <div id="in-strip" class="in-strip"></div>
        <div class="in-filters">
          <div class="in-chips" id="in-fp" role="group" aria-label="Tapis platform"></div>
          <div class="in-chips" id="in-fc" role="group" aria-label="Tapis kategori"></div>
          <div class="in-fline">
            <select class="input in-sel" id="in-impact" aria-label="Tapis impak">
              <option value="">Semua impak</option><option value="tinggi">Impak tinggi</option><option value="sederhana">Impak sederhana</option><option value="rendah">Impak rendah</option></select>
            <input class="input" id="in-q" type="search" placeholder="Cari tajuk, dapatan, tindakan…" autocomplete="off" aria-label="Cari insight">
            <button class="btn" id="in-copyall" type="button">Salin semua tindakan</button>
          </div>
        </div>
        <div id="in-list"></div>
      </div>`;

    root.querySelector('#in-seg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-view]'); if (!b) return;
      S.view = b.dataset.view; if (S.view === 'plan') scrollDone = false; render();
    });
    root.querySelector('#in-impact').addEventListener('change', (e) => { S.ii = e.target.value; renderIns(); });
    root.querySelector('#in-q').addEventListener('input', (e) => { S.q = e.target.value.trim().toLowerCase(); renderIns(); });
    root.querySelector('#in-copyall').onclick = copyAll;
    root.querySelector('#in-fp').addEventListener('click', (e) => { const b = e.target.closest('[data-ip]'); if (b) { S.ip = b.dataset.ip; renderIns(); } });
    root.querySelector('#in-fc').addEventListener('click', (e) => { const b = e.target.closest('[data-ic]'); if (b) { S.ic = b.dataset.ic; renderIns(); } });
    root.querySelector('#in-list').addEventListener('click', onListClick);
    root.querySelector('#in-plan').addEventListener('click', onPlanClick);
    root.querySelector('#in-plan').addEventListener('change', (e) => { if (e.target.id === 'in-pick') { S.planId = e.target.value; scrollDone = false; renderPlan(); } });

    HQ.watch('plans', render);
    HQ.watch('insights', render);
    HQ.watch('weddingDates', render);
    HQ.watch('competitors', render);
    root.querySelector('#in-cniche').addEventListener('change', (e) => { S.cn = e.target.value; renderComp(); });
    root.querySelector('#in-cq').addEventListener('input', (e) => { S.cq = e.target.value.trim().toLowerCase(); renderComp(); });
    root.querySelector('#in-ccopy').onclick = copyLessons;
    root.querySelector('#in-ctypes').addEventListener('click', (e) => { const b = e.target.closest('[data-ct]'); if (b) { S.ct = b.dataset.ct; renderComp(); } });
    root.querySelector('#in-clist').addEventListener('click', onCompClick);
    root.querySelector('#in-clist').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('tr[data-cid]')) openComp(e.target.dataset.cid); });
    root.querySelector('#in-wdem').addEventListener('change', (e) => { S.wd = e.target.value; renderWed(); });
    root.querySelector('#in-wcopy').onclick = copyWed;
    root.querySelector('#in-wtags').addEventListener('click', (e) => { const b = e.target.closest('[data-wt]'); if (b) { S.wt = b.dataset.wt; renderWed(); } });
    root.querySelector('#in-wcals').addEventListener('click', (e) => { const b = e.target.closest('[data-goto]'); if (b) gotoCard(b.dataset.goto); });
    root.querySelector('#in-wlist').addEventListener('click', onWedClick);
    render();
  }

  function render() {
    if (!root) return;
    root.querySelector('#in-seg').innerHTML = [['plan', 'Plan 30 Hari'], ['wed', 'Tarikh Kahwin'], ['comp', 'Pesaing'], ['ins', 'Insight Media Sosial']].map(([v, l]) => chip('data-view', v, l, S.view === v)).join('');
    root.querySelector('#in-plan').hidden = S.view !== 'plan';
    root.querySelector('#in-wed').hidden = S.view !== 'wed';
    root.querySelector('#in-comp').hidden = S.view !== 'comp';
    root.querySelector('#in-ins').hidden = S.view !== 'ins';
    if (S.view === 'plan') renderPlan(); else if (S.view === 'wed') renderWed(); else if (S.view === 'comp') renderComp(); else renderIns();
  }

  // ---------------------------------------------------------------- plan view
  function currentPlan(plans) {
    if (!plans.length) return null;
    const picked = plans.find((p) => p.id === S.planId);
    if (picked) return picked;
    const t = HQ.today();
    const sorted = plans.slice().sort((a, b) => String(b.start || '').localeCompare(String(a.start || '')));
    return sorted.find((p) => p.start <= t && t <= (p.end || p.start)) || sorted[0];
  }

  function dateParts(ymd) {
    const [, m, d] = ymd.split('-').map(Number);
    return { wd: HQ.DAYS[HQ.weekday(ymd)], dm: `${d} ${HQ.MONTHS_SHORT[m - 1]}` };
  }

  function renderPlan() {
    const box = root.querySelector('#in-plan');
    const plans = HQ.list('plans');
    const plan = currentPlan(plans);
    if (!plan) {
      box.innerHTML = `<div class="empty"><div class="empty-ico">${ICON_PLAN}</div>
        <div class="empty-title">${HQ.loaded.plans ? 'Belum ada plan 30 hari' : 'Memuatkan plan…'}</div>
        <p class="empty-text">Di sini anda akan nampak plan kandungan 30 hari: matlamat, KPI, fokus mingguan, dan jadual harian untuk TikTok, IG Feed, IG Story &amp; Facebook, siap dengan tugasan krew. Minta Lili atau Sofea sediakan di Virtual Office.</p>
        <a class="btn primary" href="${esc(HQ.OFFICE_URL)}" target="_blank" rel="noopener">Buka Virtual Office ↗</a></div>`;
      return;
    }
    const y = window.scrollY;
    const today = HQ.today();
    const days = (plan.days || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const canAdd = typeof HQ.todoQuickAdd === 'function';
    const showCol = (k) => !S.plat || S.plat === k;
    const cols = DAYCOLS.filter(([k]) => showCol(k));

    const head = `<div class="in-plan-head">
      <div class="in-plan-top"><div><h2 class="in-plan-name">${esc(plan.name || 'Plan tanpa nama')}</h2>
        <div class="in-dates">${esc(HQ.fmtDate(plan.start))} – ${esc(HQ.fmtDate(plan.end))}${plan.start <= today && today <= plan.end ? ` · Hari ke-${HQ.diffDays(today, plan.start) + 1}` : ''}</div></div>
        ${plans.length > 1 ? `<select class="input in-plan-pick" id="in-pick" aria-label="Pilih plan">${plans.slice().sort((a, b) => String(b.start).localeCompare(String(a.start))).map((p) => `<option value="${esc(p.id)}" ${p.id === plan.id ? 'selected' : ''}>${esc(p.name || p.id)}</option>`).join('')}</select>` : ''}</div>
      ${plan.goal ? `<p class="in-goal"><b>Matlamat</b>${esc(plan.goal)}</p>` : ''}
      ${plan.summary ? `<p class="in-summary">${esc(plan.summary)}</p>` : ''}
      ${(plan.kpis || []).length ? `<ul class="in-kpis" aria-label="KPI">${plan.kpis.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}</div>`;

    const weeks = (plan.weeks || []).length ? `<div><div class="in-sub-h" style="margin-bottom:10px"><h3 class="in-h">Fokus mingguan</h3></div>
      <div class="in-weeks">${plan.weeks.map((w) => weekHTML(w, plan, today)).join('')}</div></div>` : '';

    let daysHTML;
    if (!days.length) {
      daysHTML = `<div class="empty"><div class="empty-title">Jadual harian belum ada</div><p class="empty-text">Plan ini belum ada butiran harian.</p></div>`;
    } else {
      const chips = `<div class="in-chips" id="in-pf" role="group" aria-label="Tapis platform">${chip('data-plat', '', 'Semua', !S.plat)}${DAYCOLS.map(([k, l]) => chip('data-plat', k, l, S.plat === k)).join('')}</div>`;
      const addBtn = (d) => canAdd && (d.task || d.theme) ? `<button type="button" class="btn sm in-add" data-add="${esc(d.date)}">Tambah ke To-Do</button>` : '';
      const rows = days.map((d) => {
        const p = dateParts(d.date); const cls = d.date === today ? 'is-today' : d.date < today ? 'is-past' : '';
        return `<tr class="${cls}" data-date="${esc(d.date)}">
          <td class="in-c-date"><span class="in-wd">${p.wd}</span><span class="in-dm">${p.dm}${d.date === today ? ' · hari ini' : ''}</span></td>
          <td class="in-c-theme">${esc(d.theme || '')}</td>
          ${cols.map(([k]) => `<td class="in-c-plat">${esc(d[k] || '')}</td>`).join('')}
          <td class="in-c-task"><div class="in-who">${d.who ? avatar(d.who, true) : ''}<span>${esc(d.task || '')}${addBtn(d)}</span></div></td></tr>`;
      }).join('');
      const cards = days.map((d) => {
        const p = dateParts(d.date); const cls = d.date === today ? 'is-today' : d.date < today ? 'is-past' : '';
        return `<article class="in-day ${cls}" data-date="${esc(d.date)}">
          <div class="in-day-top"><span class="in-wd">${p.wd}</span><span class="in-dm">${p.dm}</span>${d.date === today ? '<span class="pill" data-tone="accent">Hari ini</span>' : ''}</div>
          ${d.theme ? `<p class="in-day-theme">${esc(d.theme)}</p>` : ''}
          ${cols.map(([k, l]) => d[k] ? `<div class="in-line"><span>${l}</span><span>${esc(d[k])}</span></div>` : '').join('')}
          ${d.task ? `<div class="in-day-task">${d.who ? avatar(d.who, true) : ''}<span>${esc(d.task)}</span></div>` : ''}
          ${addBtn(d)}</article>`;
      }).join('');
      daysHTML = `<div><div class="in-sub-h" style="margin-bottom:10px"><h3 class="in-h">Jadual harian</h3>${chips}</div>
        <div class="in-tbl-wrap"><div class="table-wrap"><table class="table in-tbl"><thead><tr><th>Tarikh</th><th>Tema</th>${cols.map(([, l]) => `<th>${l}</th>`).join('')}<th>Tugasan</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <div class="in-cards">${cards}</div></div>`;
    }
    box.innerHTML = head + weeks + daysHTML;
    if (scrollDone) window.scrollTo(0, y);
    else if (HQ.loaded.plans && S.view === 'plan') scrollToday();
  }

  function weekHTML(w, plan, today) {
    const wk = (plan.weeks || []);
    const idx = wk.indexOf(w);
    const start = HQ.addDays(plan.start, idx * 7);
    const now = start <= today && today <= HQ.addDays(start, 6);
    return `<article class="in-week ${now ? 'is-now' : ''}">
      <div class="in-week-top"><span class="in-week-no">Minggu ${esc(w.week || idx + 1)}</span><span class="in-week-dates">${esc(w.dates || '')}</span>${now ? '<span class="pill" data-tone="accent">Minggu ini</span>' : ''}</div>
      ${w.focus ? `<p class="in-week-focus">${esc(w.focus)}</p>` : ''}
      ${w.platformMix ? `<p class="in-mix">${esc(w.platformMix)}</p>` : ''}
      ${(w.crewTasks || []).length ? `<ul class="in-tasks">${w.crewTasks.map((t) => `<li>${avatar(t.who, true)}<span><b>${esc(HQ.crew(t.who).name)}</b> · ${esc(t.task)}</span></li>`).join('')}</ul>` : ''}</article>`;
  }

  function scrollToday() {
    if (!root || root.hidden) return;
    const t = HQ.today();
    const els = [...root.querySelectorAll(`#in-plan [data-date="${t}"]`)].filter((e) => e.offsetParent !== null);
    if (!els.length) return;
    scrollDone = true;
    requestAnimationFrame(() => { const e = els.find((x) => x.isConnected && x.offsetParent !== null); if (e) e.scrollIntoView({ block: 'center', behavior: 'auto' }); });
  }

  async function onPlanClick(e) {
    const f = e.target.closest('[data-plat]');
    if (f) { S.plat = f.dataset.plat; renderPlan(); return; }
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const plan = currentPlan(HQ.list('plans'));
    const d = plan && (plan.days || []).find((x) => x.date === b.dataset.add);
    if (!d) return;
    if (typeof HQ.todoQuickAdd !== 'function') { HQ.toast('Modul To-Do belum sedia', 'bad'); return; }
    b.disabled = true;
    try {
      await HQ.todoQuickAdd(d.task || d.theme, { due: d.date, assignee: d.who || 'me', category: 'Content' });
      HQ.toast(`Ditambah ke To-Do (${HQ.fmtDate(d.date)})`, 'good');
      b.textContent = 'Sudah ditambah';
    } catch (err) { b.disabled = false; }
  }

  // ---------------------------------------------------------------- wedding dates view
  const WTAGS = ['Tarikh cantik', 'Cuti sekolah', 'Hujung minggu', 'Hujung minggu panjang', 'Cuti umum', 'Malam Jumaat'];
  const DEM = { 'sangat tinggi': ['Sangat tinggi', 'accent', 0], tinggi: ['Tinggi', 'warn', 1], sederhana: ['Sederhana', 'muted', 2] };
  const wedLabel = (w) => w.label || (() => { const [y, m, d] = w.date.split('-').map(Number); return `${d}.${m}.${String(y).slice(2)}`; })();

  function wedFiltered(rows) {
    return rows.filter((w) => (!S.wt || (w.tags || []).includes(S.wt)) && (!S.wd || w.demand === S.wd))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function calHTML(ym, byDate, shown, today) {
    const [y, m] = ym.split('-').map(Number);
    const first = `${ym}-01`;
    const lead = (HQ.weekday(first) + 6) % 7; // Isnin = 0
    const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    let cells = ['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd'].map((d) => `<span class="in-dow">${d}</span>`).join('');
    for (let i = 0; i < lead; i++) cells += '<span></span>';
    for (let d = 1; d <= n; d++) {
      const ymd = `${ym}-${String(d).padStart(2, '0')}`;
      const w = byDate[ymd];
      const cls = ['in-d', ymd < today ? 'is-past' : '', ymd === today ? 'is-today' : ''].filter(Boolean).join(' ');
      if (w) cells += `<button type="button" class="${cls} ${shown.has(w.id) ? '' : 'is-dim'}" data-dem="${esc(w.demand)}" data-goto="${esc(w.id)}" aria-label="${esc(HQ.fmtDateLong(ymd))}, permintaan ${esc(w.demand)}">${d}</button>`;
      else cells += `<span class="${cls}">${d}</span>`;
    }
    return `<div class="in-cal"><h4>${HQ.MONTHS[m - 1]} ${y}</h4><div class="in-cal-g">${cells}</div></div>`;
  }

  function renderWed() {
    if (!root) return;
    const all = HQ.list('weddingDates');
    const list = wedFiltered(all);
    const today = HQ.today();
    const has = all.length > 0;
    const frame = (sel, hide) => root.querySelectorAll(sel).forEach((e) => { e.hidden = hide; });
    frame('#in-wcals, #in-wlegend, #in-wed .in-filters, #in-wed .in-note', !has);
    root.querySelector('#in-wcopy').disabled = !list.length;
    root.querySelector('#in-wdem').value = S.wd;
    const box = root.querySelector('#in-wlist');
    if (!has) {
      box.innerHTML = `<div class="empty"><div class="empty-ico">${ICON_PLAN}</div>
        <div class="empty-title">${HQ.loaded.weddingDates ? 'Belum ada tarikh kahwin' : 'Memuatkan tarikh…'}</div>
        <p class="empty-text">Senarai tarikh menarik untuk kahwin (tarikh cantik, cuti sekolah, hujung minggu panjang) akan dipaparkan di sini bersama cadangan promosi. Minta Irfan sediakan di Virtual Office.</p>
        <a class="btn primary" href="${esc(HQ.OFFICE_URL)}" target="_blank" rel="noopener">Buka Virtual Office ↗</a></div>`;
      return;
    }
    const tags = WTAGS.filter((t) => all.some((w) => (w.tags || []).includes(t))).concat([...new Set(all.flatMap((w) => w.tags || []))].filter((t) => !WTAGS.includes(t)));
    if (S.wt && !tags.includes(S.wt)) S.wt = '';
    root.querySelector('#in-wtags').innerHTML = `<span class="in-lbl">Tag</span>` + chip('data-wt', '', 'Semua', !S.wt) + tags.map((t) => chip('data-wt', t, t, S.wt === t)).join('');
    const byDate = Object.fromEntries(all.map((w) => [w.date, w]));
    const shown = new Set(list.map((w) => w.id));
    const months = [...new Set(['2026-10', '2026-11', '2026-12'].concat(all.map((w) => String(w.date).slice(0, 7))))].sort();
    root.querySelector('#in-wcals').innerHTML = months.map((ym) => calHTML(ym, byDate, shown, today)).join('');
    if (!list.length) {
      box.innerHTML = `<div class="empty"><div class="empty-title">Tiada tarikh sepadan</div><p class="empty-text">Tiada tarikh sepadan dengan tapisan semasa.</p>
        <button class="btn" data-wclear type="button">Kosongkan tapisan</button></div>`;
      return;
    }
    box.innerHTML = `<div class="in-grid">${list.map((w) => wedCard(w, today)).join('')}</div>`;
  }

  function wedCard(w, today) {
    const dem = DEM[w.demand] || [w.demand || '-', 'muted'];
    const srcs = (w.sources || []).map((s) => ({ t: s && (s.title || s.url), u: safeUrl(s && s.url) })).filter((s) => s.u);
    const past = w.date < today;
    return `<article class="in-wcard ${past ? 'is-past' : ''}" id="in-w-${esc(w.id)}" data-id="${esc(w.id)}">
      <div class="in-wtop"><div><div class="in-wlabel">${esc(wedLabel(w))}</div>
        <div class="in-wday">${esc(HQ.DAYS[HQ.weekday(w.date)])} · ${esc(HQ.fmtDateLong(w.date))}</div></div>
        <span class="pill" data-tone="${dem[1]}">Permintaan ${esc(dem[0].toLowerCase())}</span></div>
      ${(w.tags || []).length ? `<div class="in-wtags">${w.tags.map((t) => `<span class="pill" data-tone="info">${esc(t)}</span>`).join('')}</div>` : ''}
      ${w.why ? `<p class="in-finding"><b>Kenapa</b> · ${esc(w.why)}</p>` : ''}
      ${w.tip ? `<div class="in-act"><b>Cadangan</b>${esc(w.tip)}</div>` : ''}
      ${srcs.length ? `<div class="in-src"><span class="in-lbl">Sumber</span>${srcs.map((s) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)} ↗</a>`).join('')}</div>` : ''}
      ${past ? '' : `<div><button type="button" class="btn sm" data-wadd="${esc(w.id)}">Tambah ke To-Do</button></div>`}
      ${w.by ? `<div class="in-by">${avatar(w.by, true)}<span>${esc(HQ.crew(w.by).name)} · ${esc(HQ.crew(w.by).role)}</span></div>` : ''}</article>`;
  }

  let hlTimer;
  function gotoCard(id) {
    const el = root.querySelector(`.in-wcard[data-id="${CSS.escape(id)}"]`);
    if (!el) { HQ.toast('Tarikh ini tersembunyi oleh tapisan'); return; }
    root.querySelectorAll('.in-wcard.is-hl').forEach((e) => e.classList.remove('is-hl'));
    el.classList.add('is-hl');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    clearTimeout(hlTimer); hlTimer = setTimeout(() => el.classList.remove('is-hl'), 2200);
  }

  async function onWedClick(e) {
    if (e.target.closest('[data-wclear]')) { S.wt = ''; S.wd = ''; renderWed(); return; }
    const b = e.target.closest('[data-wadd]'); if (!b) return;
    const w = HQ.get('weddingDates', b.dataset.wadd); if (!w) return;
    if (typeof HQ.todoQuickAdd !== 'function') { HQ.toast('Modul To-Do belum sedia', 'bad'); return; }
    const t = HQ.today(); const due = HQ.addDays(w.date, -14);
    b.disabled = true;
    try {
      await HQ.todoQuickAdd(`Promosi tarikh ${wedLabel(w)}`, { due: due > t ? due : t, assignee: 'lili', category: 'Content' });
      HQ.toast(`Ditambah ke To-Do (${wedLabel(w)})`, 'good'); b.textContent = 'Sudah ditambah';
    } catch (err) { b.disabled = false; }
  }

  function copyWed() {
    const today = HQ.today();
    const list = wedFiltered(HQ.list('weddingDates')).filter((w) => w.date >= today);
    if (!list.length) { HQ.toast('Tiada tarikh untuk disalin', 'bad'); return; }
    HQ.copy(['Tarikh menarik kahwin Okt–Dis 2026', '']
      .concat(list.map((w) => `• ${HQ.fmtDate(w.date, true)} (${wedLabel(w)})${(w.tags || []).length ? ' — ' + w.tags.join(', ') : ''}`))
      .concat(['', 'Kunci tarikh anda dengan SnapSense — WhatsApp 016-803 1153']).join('\n'));
  }

  // ---------------------------------------------------------------- competitors view
  const CTYPES = { photographer: 'Jurugambar', videographer: 'Videografer', agency: 'Agensi', creator: 'Kreator' };
  const fmtN = (n) => {
    if (n == null || !Number.isFinite(Number(n))) return '—';
    n = Number(n);
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(Math.round(n));
  };
  const fol = (c, k) => (c.followers && Number.isFinite(Number(c.followers[k])) && c.followers[k] !== null ? Number(c.followers[k]) : null);
  const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const asOf = (c) => (c.followersAsOf ? `Setakat ${c.followersAsOf}` : 'Tarikh data tidak diketahui');
  const cleanHandle = (h) => String(h || '').trim().replace(/^https?:\/\/[^/]+\/?/, '').replace(/^@/, '').replace(/\/+$/, '');
  function handleLinks(h) {
    h = h || {}; const out = [];
    const add = (label, url, text) => { if (url) out.push(`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}: ${esc(text)} ↗</a>`); };
    const ig = cleanHandle(h.instagram), tt = cleanHandle(h.tiktok), fb = cleanHandle(h.facebook), yt = cleanHandle(h.youtube);
    if (ig) add('Instagram', safeUrl(`https://instagram.com/${ig}`), '@' + ig);
    if (tt) add('TikTok', safeUrl(`https://tiktok.com/@${tt}`), '@' + tt);
    if (fb) add('Facebook', safeUrl(/^https?:/.test(h.facebook) ? h.facebook : `https://facebook.com/${fb}`), fb);
    if (yt) add('YouTube', safeUrl(/^https?:/.test(h.youtube) ? h.youtube : `https://youtube.com/${yt.startsWith('@') ? yt : '@' + yt}`), yt);
    if (h.website) { const w = String(h.website).trim(); add('Laman web', safeUrl(/^https?:/.test(w) ? w : 'https://' + w), w.replace(/^https?:\/\//, '')); }
    return out;
  }

  function compFiltered(rows) {
    const out = rows.filter((c) => (!S.ct || c.type === S.ct) && (!S.cn || (c.niche || []).includes(S.cn)) &&
      (!S.cq || [c.name, c.location, c.lessons, c.strengths, (c.niche || []).join(' '), (c.contentPillars || []).join(' ')].join(' ').toLowerCase().includes(S.cq)));
    if (S.cs) {
      out.sort((a, b) => { const x = fol(a, S.cs), y = fol(b, S.cs); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x - y) * S.cd; });
    } else out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return out;
  }

  function renderComp() {
    if (!root) return;
    const all = HQ.list('competitors');
    const has = all.length > 0;
    root.querySelectorAll('#in-cstrip, #in-comp .in-filters').forEach((e) => { e.hidden = !has; });
    const box = root.querySelector('#in-clist');
    root.querySelector('#in-cniche').dataset.v = S.cn;
    if (!has) {
      root.querySelector('#in-ccopy').disabled = true;
      box.innerHTML = `<div class="empty"><div class="empty-ico">${ICON_INS}</div>
        <div class="empty-title">${HQ.loaded.competitors ? 'Belum ada data pesaing' : 'Memuatkan pesaing…'}</div>
        <p class="empty-text">Benchmark pesaing akan dipaparkan di sini: jurugambar, videografer, agensi dan kreator, siap dengan niche, kekerapan posting, harga dan pengajaran untuk SnapSense. Minta Lili kumpulkan di Virtual Office.</p>
        <a class="btn primary" href="${esc(HQ.OFFICE_URL)}" target="_blank" rel="noopener">Buka Virtual Office ↗</a></div>`;
      return;
    }
    const list = compFiltered(all);
    root.querySelector('#in-ccopy').disabled = !list.length;
    const types = Object.keys(CTYPES).filter((t) => all.some((c) => c.type === t));
    if (S.ct && !types.includes(S.ct)) S.ct = '';
    const niches = [...new Set(all.flatMap((c) => c.niche || []))].sort((a, b) => a.localeCompare(b));
    if (S.cn && !niches.includes(S.cn)) S.cn = '';
    root.querySelector('#in-ctypes').innerHTML = `<span class="in-lbl">Jenis</span>` + chip('data-ct', '', 'Semua', !S.ct) + types.map((t) => chip('data-ct', t, CTYPES[t], S.ct === t)).join('');
    const sel = root.querySelector('#in-cniche');
    const opts = '<option value="">Semua niche</option>' + niches.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (sel.dataset.sig !== opts) { sel.innerHTML = opts; sel.dataset.sig = opts; }
    sel.value = S.cn;
    const med = (k) => median(list.map((c) => fol(c, k)).filter((n) => n != null));
    const cnt = (t) => list.filter((c) => c.type === t).length;
    root.querySelector('#in-cstrip').innerHTML = `<span class="in-total"><b>${list.length}</b>pesaing</span>` +
      types.map((t) => `<span class="${cnt(t) ? '' : 'zero'}"><b>${cnt(t)}</b>${CTYPES[t]}</span>`).join('') +
      [['instagram', 'IG'], ['tiktok', 'TikTok'], ['facebook', 'FB']].map(([k, l]) => `<span title="Median pengikut yang diketahui sahaja"><b>${fmtN(med(k))}</b>median ${l}</span>`).join('');
    if (!list.length) {
      box.innerHTML = `<div class="empty"><div class="empty-title">Tiada pesaing sepadan</div><p class="empty-text">Tiada pesaing sepadan dengan tapisan semasa.</p>
        <button class="btn" data-cclear type="button">Kosongkan tapisan</button></div>`;
      return;
    }
    const th = (k, l) => `<th class="num" aria-sort="${S.cs === k ? (S.cd > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" data-csort="${k}" title="Susun mengikut ${l}">${l}${S.cs === k ? (S.cd > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
    const foll = (c, k) => { const n = fol(c, k); return n == null ? '—' : `<span title="${esc(asOf(c))}">${fmtN(n)}</span>`; };
    const niche = (c) => `<div class="in-niche">${(c.niche || []).map((n) => `<span class="pill" data-tone="muted">${esc(n)}</span>`).join('')}</div>`;
    const rows = list.map((c) => `<tr data-cid="${esc(c.id)}" tabindex="0" role="button" aria-label="Butiran ${esc(c.name)}">
      <td><span class="in-cname">${esc(c.name)}</span><span class="in-cloc">${esc(c.location || '')}</span></td>
      <td style="white-space:nowrap">${esc(CTYPES[c.type] || c.type || '')}</td><td>${niche(c)}</td>
      <td class="num">${foll(c, 'instagram')}</td><td class="num">${foll(c, 'tiktok')}</td>
      <td>${esc(c.postingFreq || '—')}</td><td>${esc(c.priceInfo || '—')}</td></tr>`).join('');
    const cards = list.map((c) => `<button type="button" class="in-ccard" data-cid="${esc(c.id)}">
      <div class="in-card-top"><span class="pill" data-tone="info">${esc(CTYPES[c.type] || c.type || '')}</span></div>
      <div><span class="in-cname">${esc(c.name)}</span><span class="in-cloc">${esc(c.location || '')}</span></div>
      ${niche(c)}
      <div class="in-cfoll"><span>IG <b>${fmtN(fol(c, 'instagram'))}</b></span><span>TikTok <b>${fmtN(fol(c, 'tiktok'))}</b></span></div>
      ${c.postingFreq ? `<div class="in-cmeta">Kekerapan: ${esc(c.postingFreq)}</div>` : ''}
      ${c.priceInfo ? `<div class="in-cmeta">Harga: ${esc(c.priceInfo)}</div>` : ''}</button>`).join('');
    box.innerHTML = `<div class="in-tbl-wrap in-ctblw"><div class="table-wrap"><table class="table in-ctbl"><thead><tr><th>Nama</th><th>Jenis</th><th>Niche</th>${th('instagram', 'IG')}${th('tiktok', 'TikTok')}<th>Kekerapan</th><th>Harga</th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="in-ccards">${cards}</div>`;
  }

  function onCompClick(e) {
    if (e.target.closest('[data-cclear]')) { S.ct = ''; S.cn = ''; S.cq = ''; root.querySelector('#in-cq').value = ''; renderComp(); return; }
    const so = e.target.closest('[data-csort]');
    if (so) { const k = so.dataset.csort; if (S.cs === k) { if (S.cd > 0) S.cd = -1; else { S.cs = ''; S.cd = 1; } } else { S.cs = k; S.cd = -1; } renderComp(); return; }
    const r = e.target.closest('[data-cid]'); if (r) openComp(r.dataset.cid);
  }

  function openComp(id) {
    const c = HQ.get('competitors', id); if (!c) return;
    const sec = (l, html) => (html ? `<div class="in-m-sec"><b>${l}</b>${html}</div>` : '');
    const chips = (a) => (a && a.length ? `<div class="in-niche">${a.map((x) => `<span class="pill" data-tone="muted">${esc(x)}</span>`).join('')}</div>` : '');
    const links = handleLinks(c.handles);
    const fl = [['Instagram', 'instagram'], ['TikTok', 'tiktok'], ['Facebook', 'facebook']].filter(([, k]) => fol(c, k) != null).map(([l, k]) => `${l} ${fmtN(fol(c, k))}`).join(' · ');
    const fsrc = safeUrl(c.followersSource);
    const srcs = (c.sources || []).map((x) => ({ t: x && (x.title || x.url), u: safeUrl(x && x.url) })).filter((x) => x.u);
    const body = `<div class="in-m-sec"><span class="pill" data-tone="info">${esc(CTYPES[c.type] || c.type || '')}</span> <span class="in-cloc">${esc(c.location || '')}</span></div>
      ${sec('Akaun', links.length ? `<div class="in-m-links">${links.join('')}</div>` : '<p>Tiada akaun diketahui.</p>')}
      ${sec('Pengikut', fl ? `<p>${esc(fl)}</p><p class="in-cloc">${esc(asOf(c))}${fsrc ? ` · <a href="${esc(fsrc)}" target="_blank" rel="noopener" style="color:var(--info)">sumber ↗</a>` : ''}</p>` : '<p>Tiada angka pengikut daripada sumber awam.</p>')}
      ${sec('Niche', chips(c.niche))}${sec('Pillar kandungan', chips(c.contentPillars))}${sec('Format', chips(c.formats))}
      ${sec('Kekerapan posting', c.postingFreq ? `<p>${esc(c.postingFreq)}</p>` : '')}${sec('Harga', c.priceInfo ? `<p>${esc(c.priceInfo)}</p>` : '')}
      ${sec('Kekuatan', c.strengths ? `<p>${esc(c.strengths)}</p>` : '')}
      ${c.lessons ? `<div class="in-act in-m-sec"><b>Apa SnapSense boleh belajar</b>${esc(c.lessons)}</div>` : ''}
      ${srcs.length ? `<div class="in-m-sec"><b>Sumber</b><div class="in-src">${srcs.map((x) => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)} ↗</a>`).join('')}</div></div>` : ''}`;
    HQ.modal({ title: c.name, body, wide: true, actions: [{ label: 'Tutup', kind: 'ghost' }] });
  }

  function copyLessons() {
    const list = compFiltered(HQ.list('competitors')).filter((c) => c.lessons);
    if (!list.length) { HQ.toast('Tiada pengajaran untuk disalin', 'bad'); return; }
    HQ.copy(list.map((c, n) => `${n + 1}. ${c.lessons}  [${c.name}]`).join('\n'));
  }

  // ---------------------------------------------------------------- insight view
  const impactRank = (i) => (IMPACT[i.impact] || [0, 0, 3])[2];

  function filtered(rows) {
    return rows.filter((i) =>
      (!S.ip || i.platform === S.ip) && (!S.ic || i.category === S.ic) && (!S.ii || i.impact === S.ii) &&
      (!S.q || [i.title, i.finding, i.action, i.category, PLATS[i.platform]].join(' ').toLowerCase().includes(S.q)))
      .sort((a, b) => impactRank(a) - impactRank(b) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function renderIns() {
    if (!root) return;
    const all = HQ.list('insights');
    const list = filtered(all);
    const plats = Object.keys(PLATS).filter((p) => all.some((i) => i.platform === p));
    const cats = CATS.filter((c) => all.some((i) => i.category === c)).concat([...new Set(all.map((i) => i.category))].filter((c) => c && !CATS.includes(c)));
    if (S.ip && !plats.includes(S.ip)) S.ip = '';
    if (S.ic && !cats.includes(S.ic)) S.ic = '';
    const has = all.length > 0;
    root.querySelector('.in-filters').hidden = !has;
    root.querySelector('#in-strip').hidden = !has;
    root.querySelector('#in-impact').value = S.ii;
    root.querySelector('#in-copyall').disabled = !list.length;
    if (has) {
      root.querySelector('#in-fp').innerHTML = `<span class="in-lbl">Platform</span>` + chip('data-ip', '', 'Semua', !S.ip) + plats.map((p) => chip('data-ip', p, PLATS[p], S.ip === p)).join('');
      root.querySelector('#in-fc').innerHTML = `<span class="in-lbl">Kategori</span>` + chip('data-ic', '', 'Semua', !S.ic) + cats.map((c) => chip('data-ic', c, c, S.ic === c)).join('');
      root.querySelector('#in-strip').innerHTML = `<span class="in-total"><b>${list.length}</b>insight${list.length !== all.length ? ` daripada ${all.length}` : ''}</span>` +
        cats.map((c) => { const n = list.filter((i) => i.category === c).length; return `<span class="${n ? '' : 'zero'}"><b>${n}</b>${esc(c)}</span>`; }).join('');
    }
    const box = root.querySelector('#in-list');
    if (!has) {
      box.innerHTML = `<div class="empty"><div class="empty-ico">${ICON_INS}</div>
        <div class="empty-title">${HQ.loaded.insights ? 'Belum ada insight' : 'Memuatkan insight…'}</div>
        <p class="empty-text">Insight media sosial dikumpul di sini: trend, pesaing, hashtag, masa posting, algoritma dan musim, setiap satu dengan dapatan, tindakan untuk SnapSense dan sumber rujukan. Minta Irfan atau Lili buat kajian di Virtual Office.</p>
        <a class="btn primary" href="${esc(HQ.OFFICE_URL)}" target="_blank" rel="noopener">Buka Virtual Office ↗</a></div>`;
      return;
    }
    if (!list.length) {
      box.innerHTML = `<div class="empty"><div class="empty-title">Tiada insight sepadan</div><p class="empty-text">Tiada insight sepadan dengan tapisan semasa.</p>
        <button class="btn" data-clear type="button">Kosongkan tapisan</button></div>`;
      return;
    }
    box.innerHTML = `<div class="in-grid">${list.map(cardHTML).join('')}</div>`;
  }

  function cardHTML(i) {
    const imp = IMPACT[i.impact] || ['Impak ?', 'muted'];
    const srcs = (i.sources || []).map((s) => ({ t: s && (s.title || s.url), u: safeUrl(s && s.url) })).filter((s) => s.u);
    const by = HQ.crew(i.by);
    return `<article class="in-card">
      <div class="in-card-top"><span class="pill" data-tone="info">${esc(i.category || 'Insight')}</span>
        <span class="pill" data-tone="muted">${esc(PLATS[i.platform] || i.platform || 'Umum')}</span>
        <span class="pill in-imp" data-tone="${imp[1]}">${esc(imp[0])}</span></div>
      <h3 class="in-title">${esc(i.title)}</h3>
      ${i.finding ? `<p class="in-finding">${esc(i.finding)}</p>` : ''}
      ${i.action ? `<div class="in-act"><b>Apa kita buat</b>${esc(i.action)}</div>` : ''}
      ${srcs.length ? `<div class="in-src"><span class="in-lbl">Sumber</span>${srcs.map((s) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)} ↗</a>`).join('')}</div>` : ''}
      <div class="in-by">${avatar(i.by, true)}<span>${esc(by.name)} · ${esc(by.role)}</span></div></article>`;
  }

  function onListClick(e) {
    if (!e.target.closest('[data-clear]')) return;
    S.ip = ''; S.ic = ''; S.ii = ''; S.q = ''; root.querySelector('#in-q').value = ''; renderIns();
  }

  function copyAll() {
    const list = filtered(HQ.list('insights')).filter((i) => i.action);
    if (!list.length) { HQ.toast('Tiada tindakan untuk disalin', 'bad'); return; }
    HQ.copy(list.map((i, n) => `${n + 1}. ${i.action}  [${i.title}]`).join('\n'));
  }

  HQ.tab('insight', { label: 'Insight & Plan', icon: ICON, mount, onShow() { if (S.view === 'plan') { scrollDone = false; if (root) renderPlan(); } } });
})();
