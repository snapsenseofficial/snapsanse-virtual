// SnapSense HQ — Content Plan (Sofea). Campaign banner + calendar / board / list of posts.
// Collections: content, campaigns. Exposes HQ.openContent(id) and HQ.newContent(prefill).
(function () {
  'use strict';
  const HQ = window.HQ;
  const E = HQ.esc;

  // ---------------------------------------------------------------- constants
  const PLATFORMS = [
    { id: 'tiktok', label: 'TikTok', short: 'TT' },
    { id: 'instagram', label: 'Instagram', short: 'IG' },
    { id: 'facebook', label: 'Facebook', short: 'FB' },
    { id: 'youtube', label: 'YouTube', short: 'YT' },
    { id: 'threads', label: 'Threads', short: 'TH' },
  ];
  const FORMATS = ['Reel', 'TikTok', 'Carousel', 'Poster', 'Story', 'Live', 'Video panjang'];
  const STATUSES = [
    { id: 'idea', label: 'Idea', tone: 'muted' },
    { id: 'skrip', label: 'Skrip', tone: 'info' },
    { id: 'shoot', label: 'Shoot', tone: 'warn' },
    { id: 'edit', label: 'Edit', tone: 'accent' },
    { id: 'siap', label: 'Siap', tone: 'good' },
    { id: 'posted', label: 'Posted', tone: 'good' },
  ];
  const WEEKDAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
  const PILLAR_TONES = ['accent', 'info', 'good', 'warn', 'bad', 'muted'];

  const svg = (d, extra) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra || ''}>${d}</svg>`;
  const ICON = {
    tab: svg('<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M10.5 13v4.5l4-2.25z"/>'),
    left: svg('<path d="M15 18l-6-6 6-6"/>'),
    right: svg('<path d="M9 18l6-6-6-6"/>'),
    down: svg('<path d="M6 9l6 6 6-6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    flag: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    film: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
  };

  // ---------------------------------------------------------------- state
  const S = { month: null, view: 'kalendar', pf: new Set(), pillar: '', owner: '', cmp: null, bannerOpen: true };
  let root = null;
  let uid = 0;
  try {
    const p = JSON.parse(localStorage.getItem('hq-content-prefs') || '{}');
    if (['kalendar', 'papan', 'senarai'].includes(p.view)) S.view = p.view;
    if (typeof p.bannerOpen === 'boolean') S.bannerOpen = p.bannerOpen;
    else if (window.matchMedia && window.matchMedia('(max-width: 719.98px)').matches) S.bannerOpen = false;
  } catch (e) { /* ignore */ }
  const savePrefs = () => { try { localStorage.setItem('hq-content-prefs', JSON.stringify({ view: S.view, bannerOpen: S.bannerOpen })); } catch (e) { /* ignore */ } };

  // ---------------------------------------------------------------- helpers
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const monthOf = (s) => String(s || '').slice(0, 7);
  const monthLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return `${HQ.MONTHS[m - 1]} ${y}`; };
  const shiftMonth = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7); };
  const daysIn = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  const status = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
  const statusIdx = (id) => Math.max(0, STATUSES.findIndex((s) => s.id === id));
  const sortKey = (c) => (c.date || '9999-99-99') + ' ' + (c.time || '99:99') + ' ' + (c.title || '');
  const byDate = (a, b) => sortKey(a).localeCompare(sortKey(b));
  const lines = (s) => String(s || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const stripNo = (l) => l.replace(/^(?:(?:scene|babak|adegan|shot|syot)\s*)?\d{1,2}\s*[.):\-–—]\s*/i, '').replace(/^[-•*·]\s+/, '').trim();

  const statusPill = (id) => { const s = status(id); return `<span class="pill cp-st" data-tone="${s.tone}" data-st="${s.id}">${E(s.label)}</span>`; };
  const pfTags = (arr) => (arr || []).map((id) => { const p = PLATFORMS.find((x) => x.id === id); return p ? `<span class="cp-pf" title="${E(p.label)}">${p.short}</span>` : ''; }).join('');
  const avatar = (id, sm) => { const c = HQ.crew(id); return `<span class="avatar${sm ? ' sm' : ''}" style="--c:${E(c.color)}" title="${E(c.name)} · ${E(c.role)}">${E(c.name.charAt(0))}</span>`; };

  const allContent = () => HQ.list('content');
  const campaigns = () => HQ.list('campaigns').slice().sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  const monthCampaigns = (ym) => campaigns().filter((c) => c.month === ym);
  const cmpName = (id) => { const c = id && HQ.get('campaigns', id); return c ? c.name : ''; };

  // storyline 'dates' like "10–16 Okt" → ranges inside the campaign month (best effort)
  function weekRanges(c) {
    if (!c || !/^\d{4}-\d{2}$/.test(c.month || '')) return [];
    const [y, m] = c.month.split('-').map(Number);
    const max = daysIn(c.month);
    return (c.storyline || []).map((s, i) => {
      const mm = String(s.dates || '').match(/(\d{1,2})\D{1,4}?(\d{1,2})/);
      if (!mm) return null;
      const a = +mm[1]; const b = +mm[2];
      if (!a || !b || a > b || b > max) return null;
      return { week: Number(s.week) || i + 1, from: ymd(y, m, a), to: ymd(y, m, b) };
    }).filter(Boolean);
  }
  const weekFor = (c, date) => { const r = weekRanges(c).find((w) => date >= w.from && date <= w.to); return r ? r.week : ''; };

  function filtered(rows) {
    return rows.filter((c) => {
      if (S.pf.size && !(c.platforms || []).some((p) => S.pf.has(p))) return false;
      if (S.pillar && (c.pillar || '') !== S.pillar) return false;
      if (S.owner && (c.owner || 'me') !== S.owner) return false;
      return true;
    });
  }
  const filtersOn = () => !!(S.pf.size || S.pillar || S.owner);
  const inMonth = () => allContent().filter((c) => monthOf(c.date) === S.month);
  const undated = () => allContent().filter((c) => !c.date);

  // ---------------------------------------------------------------- CSS
  HQ.css('content', `
.cp-month { display: inline-flex; align-items: center; gap: 2px; height: 40px; padding: 0 2px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: var(--surface); }
.cp-month .icon-btn { width: 34px; height: 34px; }
.cp-month-label { min-width: 9.5em; text-align: center; font-weight: 700; font-size: 14px; white-space: nowrap; }
.cp-today-btn[hidden] { display: none; }
.cp-kicker, .cp-label { display: block; font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); line-height: 1.3; }

/* campaign banner */
.cp-cmp { overflow: hidden; border-top: 3px solid var(--accent); }
.cp-cmp-tabs { padding: 10px 16px 0; }
.cp-cmp-head { align-items: flex-end; }
.cp-cmp-head h2 { font-size: clamp(18px, 2.2vw, 22px); margin-top: 2px; }
.cp-cmp-title { min-width: 0; flex: 1 1 240px; }
.cp-cmp-closed-sum { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
.cp-toggle svg { transition: transform 0.18s ease; }
.cp-toggle[aria-expanded="false"] svg { transform: rotate(-90deg); }
.cp-cmp-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 20px 28px; padding: 18px 16px 4px; }
.cp-bigidea { margin: 0 0 14px; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--accent-bg); }
.cp-bigidea p { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(17px, 2vw, 20px); font-weight: 700; line-height: 1.3; color: var(--ink); text-wrap: pretty; }
.cp-facts { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 8px 14px; margin: 0; font-size: 14px; }
.cp-facts dt { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); padding-top: 3px; }
.cp-facts dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.cp-kpis { margin: 6px 0 16px; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
.cp-kpis li { display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; line-height: 1.4; }
.cp-kpis li::before { content: ""; flex: none; width: 6px; height: 6px; border-radius: 2px; background: var(--accent); transform: translateY(-2px); }
.cp-pillars { display: flex; flex-direction: column; gap: 9px; margin-top: 6px; }
.cp-pillar-top { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 600; }
.cp-pillar-top span:last-child { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
.cp-bar { height: 6px; margin-top: 4px; border-radius: 99px; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); overflow: hidden; }
.cp-bar > i { display: block; height: 100%; border-radius: inherit; background: var(--ink); }
.cp-bar > i[data-tone="accent"] { background: var(--accent); }
.cp-bar > i[data-tone="info"] { background: var(--info); }
.cp-bar > i[data-tone="good"] { background: var(--good); }
.cp-bar > i[data-tone="warn"] { background: var(--warn); }
.cp-bar > i[data-tone="bad"] { background: var(--bad); }
.cp-bar > i[data-tone="muted"] { background: var(--muted); }
.cp-pillar-desc { font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.4; }
.cp-story { padding: 14px 16px 16px; }
.cp-story-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
.cp-story-head h3 { font-size: 15px; }
.cp-arc { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr)); gap: 10px; counter-reset: wk; }
.cp-week { position: relative; display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 12px 12px 10px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface-2); }
.cp-week::before { content: ""; position: absolute; left: 12px; right: 12px; top: -1px; height: 3px; border-radius: 0 0 3px 3px; background: var(--line-strong); }
.cp-week.now { border-color: var(--accent); background: var(--surface); }
.cp-week.now::before { background: var(--accent); }
.cp-week.past { opacity: 0.78; }
.cp-week-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap; }
.cp-week-no { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.cp-week-dates { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
.cp-week h4 { font-family: var(--font-display); font-size: 16px; line-height: 1.25; }
.cp-week > .pill { align-self: flex-start; }
.cp-week-theme { align-self: flex-start; max-width: 100%; white-space: normal; height: auto; min-height: 22px; padding-block: 3px; line-height: 1.3; }
.cp-week p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ink); }
.cp-week-cta { margin-top: auto; padding-top: 6px; border-top: 1px dashed var(--line-strong); font-size: 12.5px; font-weight: 600; }
.cp-week-cta span { color: var(--muted); font-weight: 500; }
.cp-week-count { font-size: 12px; color: var(--muted); }
.cp-nocmp { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 16px; border-style: dashed; }
.cp-nocmp-ico { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--accent-bg); flex: none; }
.cp-nocmp-ico svg { width: 18px; height: 18px; }
.cp-nocmp-txt { flex: 1 1 220px; min-width: 0; font-size: 13.5px; }
.cp-nocmp-txt strong { display: block; font-size: 14px; }

/* toolbar */
.cp-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }
.cp-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; justify-content: flex-end; }
.cp-pfs { display: flex; flex-wrap: wrap; gap: 6px; }
.cp-pfs .chip { height: 30px; padding: 0 10px; }
.cp-sel { width: auto; max-width: 100%; height: 32px; font-size: 13px; padding-left: 10px; flex: 0 1 auto; }

/* summary */
.cp-sum { display: flex; flex-wrap: wrap; align-items: stretch; gap: 14px 28px; padding: 14px 16px; }
.cp-sum .kpi { flex: 0 0 auto; }
.cp-sum-prog { flex: 1 1 200px; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.cp-sum-prog .cp-bar { height: 8px; margin: 0; }
.cp-sum-prog .cp-bar > i { background: var(--good); }
.cp-sum-line { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; flex-wrap: wrap; }
.cp-sum-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1 1 220px; justify-content: center; }
.cp-sum-group .row { gap: 6px; }
.cp-count { font-family: var(--font-mono); font-weight: 700; margin-left: 2px; }

/* status tones for chips & cards */
.cp-st[data-st="posted"] { background: var(--good); color: var(--surface); }
.cp-ev { --st: var(--muted); --st-bg: var(--surface-2); --st-ink: var(--ink); }
.cp-ev[data-st="skrip"] { --st: var(--info); --st-bg: var(--info-bg); }
.cp-ev[data-st="shoot"] { --st: var(--warn); --st-bg: var(--warn-bg); }
.cp-ev[data-st="edit"] { --st: var(--accent); --st-bg: var(--accent-bg); }
.cp-ev[data-st="siap"] { --st: var(--good); --st-bg: var(--good-bg); }
.cp-ev[data-st="posted"] { --st: var(--good); --st-bg: var(--good); --st-ink: var(--surface); }
.cp-dot { display: inline-block; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--st); }

.cp-pf { display: inline-block; padding: 2px 4px 1px; border-radius: 4px; border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-family: var(--font-mono); font-size: 9.5px; font-weight: 700; line-height: 1.1; letter-spacing: 0.02em; }
.cp-pfrow { display: inline-flex; flex-wrap: wrap; gap: 3px; }

/* calendar */
.cp-cal { overflow: hidden; }
.cp-cal-head, .cp-cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.cp-cal-head { background: var(--surface-2); border-bottom: 1px solid var(--line); }
.cp-cal-head div { padding: 8px 10px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.cp-day { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; min-height: 132px; padding: 6px 6px 8px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); cursor: pointer; transition: background-color 0.12s ease; }
.cp-day:nth-child(7n) { border-right: 0; }
.cp-day:hover { background: var(--surface-2); }
.cp-day.out { background: var(--surface-2); cursor: default; opacity: 0.55; }
.cp-day.wkend:not(.out) { background: color-mix(in srgb, var(--surface-2) 55%, var(--surface)); }
.cp-day.wkend:not(.out):hover { background: var(--surface-2); }
.cp-day-top { display: flex; align-items: center; justify-content: space-between; gap: 4px; min-height: 24px; }
.cp-day-no { display: inline-grid; place-items: center; min-width: 24px; height: 24px; padding: 0 4px; border-radius: 999px; font-size: 12.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
.cp-day.today .cp-day-no { background: var(--accent); color: var(--accent-ink); }
.cp-day.today { box-shadow: inset 0 0 0 2px var(--accent); }
.cp-day.past:not(.today) .cp-day-no { color: var(--muted); }
.cp-wk-mark { font-family: var(--font-mono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 5px; border-radius: 4px; background: var(--accent-bg); color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.cp-day-add { opacity: 0; width: 24px; height: 24px; border-radius: 6px; }
.cp-day-add svg { width: 14px; height: 14px; }
.cp-day:hover .cp-day-add, .cp-day-add:focus-visible { opacity: 1; }
.cp-chip { display: flex; flex-direction: column; gap: 3px; width: 100%; min-width: 0; padding: 4px 6px 5px; border: 0; border-left: 3px solid var(--st); border-radius: 5px; background: var(--st-bg); color: var(--st-ink); text-align: left; font-size: 12px; line-height: 1.25; cursor: pointer; }
.cp-chip:hover { filter: brightness(0.97); box-shadow: 0 0 0 1px var(--line-strong); }
.cp-chip-t { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-chip-m { display: flex; align-items: center; gap: 3px; min-width: 0; overflow: hidden; }
.cp-chip-m .cp-time { font-family: var(--font-mono); font-size: 10px; opacity: 0.8; margin-right: 2px; }
.cp-chip .cp-pf { font-size: 8.5px; padding: 1px 3px 0; background: transparent; border-color: currentColor; color: inherit; opacity: 0.85; }
.cp-ev[data-st="posted"].cp-chip { border-left-color: color-mix(in srgb, var(--surface) 45%, var(--good)); }
.cp-more { align-self: flex-start; border: 0; background: none; padding: 1px 4px; font-size: 12px; font-weight: 700; color: var(--muted); cursor: pointer; border-radius: 4px; }
.cp-more:hover { color: var(--ink); background: var(--surface-2); }
.cp-undated { padding: 10px 16px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); }
.cp-agenda { display: none; }

/* agenda (phone) */
.cp-ag-day { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--line); }
.cp-ag-day:last-child { border-bottom: 0; }
.cp-ag-date { display: flex; flex-direction: column; align-items: center; gap: 0; padding-top: 2px; }
.cp-ag-date b { font-family: var(--font-display); font-size: 22px; line-height: 1; font-weight: 800; }
.cp-ag-date span { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.cp-ag-day.today .cp-ag-date b { background: var(--accent); color: var(--accent-ink); border-radius: 8px; padding: 3px 6px; }
.cp-ag-list { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cp-ag-item { display: flex; align-items: center; gap: 10px; width: 100%; min-width: 0; padding: 8px 10px; border: 1px solid var(--line); border-left: 3px solid var(--st); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); text-align: left; cursor: pointer; }
.cp-ag-item:hover { border-color: var(--line-strong); border-left-color: var(--st); }
.cp-ag-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.cp-ag-main strong { font-size: 14px; line-height: 1.3; overflow-wrap: anywhere; }
.cp-ag-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font-size: 12px; color: var(--muted); }

/* board */
.cp-board { display: flex; gap: 12px; overflow-x: auto; overscroll-behavior-x: contain; padding-bottom: 8px; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
.cp-col { flex: 0 0 264px; min-width: 0; display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface-2); scroll-snap-align: start; }
.cp-col-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 2px 4px; }
.cp-col-head .cp-count { font-size: 12px; color: var(--muted); }
.cp-col-empty { padding: 18px 8px; text-align: center; font-size: 12.5px; color: var(--muted); border: 1.5px dashed var(--line-strong); border-radius: var(--radius-sm); }
.cp-card { display: flex; flex-direction: column; gap: 8px; padding: 10px 10px 8px; border: 1px solid var(--line); border-top: 3px solid var(--st); border-radius: var(--radius-sm); background: var(--surface); box-shadow: var(--shadow); cursor: pointer; }
.cp-ev[data-st="posted"].cp-card { border-top-color: var(--good); }
.cp-card:hover { border-color: var(--line-strong); border-top-color: var(--st); }
.cp-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.cp-card-t { font-weight: 700; font-size: 14px; line-height: 1.3; overflow-wrap: anywhere; }
.cp-card-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font-size: 12px; color: var(--muted); }
.cp-card-foot { display: flex; align-items: center; gap: 6px; padding-top: 6px; border-top: 1px solid var(--line); }
.cp-card-foot .spacer { flex: 1; }
.cp-card-foot .icon-btn { width: 30px; height: 30px; }
.cp-card-foot .icon-btn svg { width: 16px; height: 16px; }

/* list */
.cp-table td { vertical-align: middle; }
.cp-table tbody tr { cursor: pointer; }
.cp-table .cp-t-title { min-width: 200px; font-weight: 600; }
.cp-table .cp-t-sub { display: block; font-weight: 400; font-size: 12px; color: var(--muted); max-width: 42ch; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-table .cp-t-date { white-space: nowrap; }
.cp-empty-note { padding: 18px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; color: var(--muted); font-size: 13.5px; }

/* detail */
.cp-det-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.cp-det-date { font-weight: 600; font-size: 13.5px; }
.cp-det-who { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 12px; font-size: 13.5px; }
.cp-det-who .who { display: inline-flex; align-items: center; gap: 8px; }
.cp-det-who .who small { display: block; color: var(--muted); font-size: 12px; }
.cp-hook { position: relative; margin: 18px 0 0; padding: 16px 18px 16px 46px; border-radius: var(--radius); background: var(--accent-bg); }
.cp-hook::before { content: "\\201C"; position: absolute; left: 12px; top: 2px; font-family: var(--font-display); font-size: 56px; font-weight: 800; line-height: 1; color: var(--accent); }
.cp-hook p { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(19px, 2.6vw, 25px); font-weight: 700; line-height: 1.28; letter-spacing: -0.01em; color: var(--ink); overflow-wrap: anywhere; }
.cp-det-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 18px 24px; margin-top: 20px; }
.cp-sec { min-width: 0; }
.cp-sec + .cp-sec { margin-top: 18px; }
.cp-sec-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.cp-sec h4 { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); }
.cp-sec-head h4 { margin: 0; }
.cp-sec > h4 { margin-bottom: 8px; }
.cp-scenes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; }
.cp-scenes li { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 14px; line-height: 1.5; }
.cp-scenes li:last-child { border-bottom: 0; }
.cp-scene-no { display: grid; place-items: center; width: 28px; height: 24px; border-radius: 6px; background: var(--ink); color: var(--surface); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
.cp-shots { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
.cp-shots li { display: flex; gap: 8px; font-size: 13.5px; line-height: 1.45; }
.cp-shots li::before { content: ""; flex: none; width: 12px; height: 12px; margin-top: 3px; border: 1.5px solid var(--line-strong); border-radius: 3px; }
.cp-box { padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface-2); font-size: 14px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.cp-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
.cp-tag { font-family: var(--font-mono); font-size: 11.5px; padding: 3px 7px; border-radius: 5px; background: var(--info-bg); color: var(--info); overflow-wrap: anywhere; }
.cp-cta { font-weight: 700; font-size: 14.5px; }
.cp-none { color: var(--muted); font-size: 13px; font-style: italic; }
.cp-link { overflow-wrap: anywhere; font-size: 13.5px; }

/* forms */
.cp-pf-toggles { display: flex; flex-wrap: wrap; gap: 6px; }
.cp-form-sec { grid-column: 1 / -1; padding-top: 8px; margin-top: 4px; border-top: 1px solid var(--line); }
.cp-rep { display: flex; flex-direction: column; gap: 10px; }
.cp-rep-row { position: relative; display: grid; gap: 8px 10px; padding: 12px 44px 12px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface-2); }
.cp-rep-row[data-kind="pillar"] { grid-template-columns: minmax(0, 1.2fr) 90px minmax(0, 2fr); }
.cp-rep-row[data-kind="week"] { grid-template-columns: 80px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); }
.cp-rep-row .wide { grid-column: 1 / -1; }
.cp-rep-row .field > label { font-size: 12px; }
.cp-rep-row .input { height: 36px; font-size: 13.5px; }
.cp-rep-row textarea.input { height: auto; min-height: 64px; }
.cp-rep-x { position: absolute; top: 8px; right: 6px; }
.cp-dayl { display: flex; flex-direction: column; gap: 6px; }

@media (max-width: 900px) {
  .cp-cmp-grid { grid-template-columns: minmax(0, 1fr); }
  .cp-det-grid { grid-template-columns: minmax(0, 1fr); }
  .cp-filters { justify-content: flex-start; }
}
@media (max-width: 719.98px) {
  .cp-cal-wrap { display: none; }
  .cp-agenda { display: block; }
  .cp-month-label { min-width: 0; flex: 1; }
  .cp-month { flex: 1 1 auto; }
  .page-head .actions { width: 100%; }
  .cp-rep-row[data-kind="pillar"], .cp-rep-row[data-kind="week"] { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .cp-rep-row[data-kind="pillar"] .field:last-child { grid-column: 1 / -1; }
  .cp-rep-row[data-kind="week"] .field:nth-child(2) { grid-column: 2; }
  .cp-hook { padding: 14px 14px 14px 40px; }
  .cp-hook::before { font-size: 46px; left: 9px; }
  .cp-sum { gap: 14px 18px; }
  .cp-col { flex-basis: 78vw; max-width: 280px; }
  .cp-facts { grid-template-columns: minmax(0, 1fr); gap: 2px 0; }
  .cp-facts dd { margin-bottom: 8px; }
}
`);

  // ---------------------------------------------------------------- frame
  function frame() {
    return `
<div class="page-head">
  <h1>Content Plan</h1>
  <p class="sub">Kempen bulanan, kalendar post & status produksi untuk semua platform.</p>
  <div class="actions">
    <div class="cp-month" role="group" aria-label="Pilih bulan">
      <button class="icon-btn" id="cp-month-prev" data-act="month" data-d="-1" aria-label="Bulan sebelum">${ICON.left}</button>
      <span class="cp-month-label" data-slot="month" aria-live="polite"></span>
      <button class="icon-btn" id="cp-month-next" data-act="month" data-d="1" aria-label="Bulan seterusnya">${ICON.right}</button>
    </div>
    <button class="btn ghost sm cp-today-btn" id="cp-month-today" data-act="month-today" hidden>Bulan ini</button>
    <button class="btn primary" id="cp-new" data-act="new">${ICON.plus}Content baru</button>
  </div>
</div>
<div data-slot="banner"></div>
<div data-slot="toolbar" class="cp-toolbar"></div>
<div data-slot="summary"></div>
<div data-slot="view"></div>`;
  }

  function render() {
    if (!root) return;
    const slot = (n) => root.querySelector(`[data-slot="${n}"]`);
    slot('month').textContent = monthLabel(S.month);
    root.querySelector('#cp-month-today').hidden = S.month === monthOf(HQ.today());
    slot('banner').innerHTML = bannerHTML();
    slot('toolbar').innerHTML = toolbarHTML();
    slot('summary').innerHTML = summaryHTML();
    slot('summary').hidden = !HQ.loaded.content || !inMonth().length;
    slot('view').innerHTML = viewHTML();
  }

  // ---------------------------------------------------------------- banner
  function bannerHTML() {
    if (!HQ.loaded.campaigns) return '';
    const list = monthCampaigns(S.month);
    if (!list.length) {
      return `<div class="card cp-nocmp">
        <span class="cp-nocmp-ico">${ICON.flag}</span>
        <div class="cp-nocmp-txt"><strong>Tiada kempen untuk bulan ini</strong><span class="muted">Tetapkan matlamat, big idea dan storyline mingguan untuk ${E(monthLabel(S.month))}.</span></div>
        <button class="btn sm" id="cp-cmp-new" data-act="cmp-new">${ICON.plus}Kempen baru</button>
      </div>`;
    }
    if (!list.find((c) => c.id === S.cmp)) S.cmp = list[0].id;
    const c = list.find((x) => x.id === S.cmp);
    const open = S.bannerOpen;
    const today = HQ.today();
    const posts = allContent().filter((p) => p.campaignId === c.id);
    const ranges = weekRanges(c);
    const tabs = list.length > 1 ? `<div class="cp-cmp-tabs"><div class="tabs-inline" role="tablist" aria-label="Kempen">${list.map((x) =>
      `<button class="chip ${x.id === c.id ? 'on' : ''}" role="tab" aria-selected="${x.id === c.id}" data-act="cmp-tab" data-id="${E(x.id)}">${E(x.name || 'Tanpa nama')}</button>`).join('')}</div></div>` : '';
    const facts = [['Matlamat', c.goal], ['Sasaran', c.audience], ['Tawaran', c.offer]].filter((f) => f[1]);
    const pillars = (c.pillars || []).filter((p) => p && p.name);
    const story = (c.storyline || []).slice().sort((a, b) => (Number(a.week) || 0) - (Number(b.week) || 0));
    const sumLine = [c.goal, `${story.length} minggu`, `${posts.length} post`].filter(Boolean).join(' · ');

    return `<section class="card cp-cmp" aria-label="Kempen bulan ini">${tabs}
  <div class="card-head cp-cmp-head">
    <div class="cp-cmp-title">
      <span class="cp-kicker">Kempen · ${E(monthLabel(c.month))}</span>
      <h2>${E(c.name || 'Tanpa nama')}</h2>
      ${open ? '' : `<p class="cp-cmp-closed-sum">${E(sumLine)}</p>`}
    </div>
    <div class="row">
      <button class="btn sm" id="cp-cmp-edit" data-act="cmp-edit" data-id="${E(c.id)}">Edit kempen</button>
      <button class="btn sm ghost" id="cp-cmp-add" data-act="cmp-new" title="Tambah kempen lain untuk bulan ini">${ICON.plus}<span class="sr-only">Kempen baru</span></button>
      <button class="icon-btn cp-toggle" id="cp-cmp-toggle" data-act="cmp-toggle" aria-expanded="${open}" aria-label="${open ? 'Lipat kempen' : 'Buka kempen'}">${ICON.down}</button>
    </div>
  </div>
  <div class="cp-cmp-body"${open ? '' : ' hidden'}>
    <div class="cp-cmp-grid">
      <div>
        ${c.bigIdea ? `<div class="cp-bigidea"><span class="cp-label">Big idea</span><p>${E(c.bigIdea)}</p></div>` : ''}
        ${facts.length ? `<dl class="cp-facts">${facts.map((f) => `<dt>${f[0]}</dt><dd>${E(f[1])}</dd>`).join('')}</dl>` : ''}
        ${!c.bigIdea && !facts.length ? '<p class="cp-none">Belum ada matlamat atau big idea. Klik "Edit kempen".</p>' : ''}
      </div>
      <div>
        ${(c.kpis || []).filter(Boolean).length ? `<span class="cp-label">KPI</span><ul class="cp-kpis">${c.kpis.filter(Boolean).map((k) => `<li>${E(k)}</li>`).join('')}</ul>` : ''}
        ${pillars.length ? `<span class="cp-label">Pillar content</span><div class="cp-pillars">${pillars.map((p, i) => {
          const share = Math.max(0, Math.min(100, Number(p.share) || 0));
          return `<div><div class="cp-pillar-top"><span>${E(p.name)}</span><span>${share}%</span></div>
            <div class="cp-bar" role="img" aria-label="${E(p.name)} ${share}%"><i data-tone="${PILLAR_TONES[i % PILLAR_TONES.length]}" style="width:${share}%"></i></div>
            ${p.desc ? `<div class="cp-pillar-desc">${E(p.desc)}</div>` : ''}</div>`;
        }).join('')}</div>` : ''}
      </div>
    </div>
    ${story.length ? `<div class="cp-story">
      <div class="cp-story-head"><h3>Storyline</h3><span class="muted">${story.length} minggu</span></div>
      <ol class="cp-arc">${story.map((s, i) => {
        const wk = Number(s.week) || i + 1;
        const r = ranges.find((x) => x.week === wk);
        const cls = r ? (today >= r.from && today <= r.to ? 'now' : today > r.to ? 'past' : '') : '';
        const n = posts.filter((p) => Number(p.week) === wk).length;
        return `<li class="cp-week ${cls}">
          <div class="cp-week-top"><span class="cp-week-no">Minggu ${wk}</span><span class="cp-week-dates">${E(s.dates || '')}</span></div>
          ${cls === 'now' ? '<span class="pill" data-tone="accent">Minggu ini</span>' : ''}
          ${s.title ? `<h4>${E(s.title)}</h4>` : ''}
          ${s.theme ? `<span class="pill cp-week-theme" data-tone="info">${E(s.theme)}</span>` : ''}
          ${s.story ? `<p>${E(s.story)}</p>` : ''}
          ${s.cta ? `<div class="cp-week-cta"><span>CTA:</span> ${E(s.cta)}</div>` : ''}
          <div class="cp-week-count">${n} post dirancang</div>
        </li>`;
      }).join('')}</ol>
    </div>` : ''}
  </div>
</section>`;
  }

  // ---------------------------------------------------------------- toolbar & summary
  function toolbarHTML() {
    const views = [['kalendar', 'Kalendar'], ['papan', 'Papan'], ['senarai', 'Senarai']];
    const pillarSet = new Set();
    monthCampaigns(S.month).forEach((c) => (c.pillars || []).forEach((p) => p && p.name && pillarSet.add(p.name)));
    inMonth().forEach((c) => c.pillar && pillarSet.add(c.pillar));
    if (S.pillar) pillarSet.add(S.pillar);
    return `<div class="tabs-inline" role="tablist" aria-label="Paparan">${views.map(([id, label]) =>
      `<button class="chip ${S.view === id ? 'on' : ''}" id="cp-view-${id}" role="tab" aria-selected="${S.view === id}" data-act="view" data-v="${id}">${label}</button>`).join('')}</div>
  <div class="cp-filters">
    <div class="cp-pfs" role="group" aria-label="Tapis platform">${PLATFORMS.map((p) =>
      `<button class="chip ${S.pf.has(p.id) ? 'on' : ''}" id="cp-filter-pf-${p.id}" aria-pressed="${S.pf.has(p.id)}" data-act="pf" data-p="${p.id}">${p.label}</button>`).join('')}</div>
    <select class="input cp-sel" id="cp-filter-pillar" aria-label="Tapis pillar"><option value="">Semua pillar</option>${[...pillarSet].sort().map((p) =>
      `<option value="${E(p)}" ${p === S.pillar ? 'selected' : ''}>${E(p)}</option>`).join('')}</select>
    <select class="input cp-sel" id="cp-filter-owner" aria-label="Tapis owner"><option value="">Semua owner</option>${HQ.CREW.map((c) =>
      `<option value="${E(c.id)}" ${c.id === S.owner ? 'selected' : ''}>${E(c.name)} · ${E(c.role)}</option>`).join('')}</select>
    ${filtersOn() ? '<button class="btn ghost sm" id="cp-filter-clear" data-act="clear">Kosongkan tapisan</button>' : ''}
  </div>`;
  }

  function summaryHTML() {
    const rows = filtered(inMonth());
    const total = rows.length;
    const posted = rows.filter((c) => c.status === 'posted').length;
    const today = HQ.today();
    const late = rows.filter((c) => c.date && c.date < today && c.status !== 'posted').length;
    const pct = total ? Math.round((posted / total) * 100) : 0;
    return `<div class="card cp-sum">
    <div class="kpi"><span class="kpi-label">Post ${E(HQ.MONTHS[+S.month.slice(5) - 1])}${filtersOn() ? ' (ditapis)' : ''}</span><span class="kpi-value">${total}</span>
      <span class="kpi-foot">${rows.filter((c) => c.date >= today).length} akan datang</span></div>
    <div class="cp-sum-prog">
      <div class="cp-sum-line"><span><strong class="num">${posted}</strong> posted daripada <strong class="num">${total}</strong> dirancang</span><span class="mono">${pct}%</span></div>
      <div class="cp-bar" role="img" aria-label="${pct}% sudah posted"><i style="width:${pct}%"></i></div>
      ${late ? `<span><span class="pill" data-tone="bad">${late} lewat</span> <span class="muted" style="font-size:12.5px">tarikh sudah lepas, belum posted</span></span>` : ''}
    </div>
    <div class="cp-sum-group"><span class="kpi-label">Status</span><div class="row">${STATUSES.map((s) => {
      const n = rows.filter((c) => (c.status || 'idea') === s.id).length;
      return `<span class="pill cp-st" data-tone="${s.tone}" data-st="${s.id}">${s.label}<span class="cp-count">${n}</span></span>`;
    }).join('')}</div></div>
    <div class="cp-sum-group"><span class="kpi-label">Platform</span><div class="row">${PLATFORMS.map((p) => {
      const n = rows.filter((c) => (c.platforms || []).includes(p.id)).length;
      return `<span class="pill" data-tone="muted" title="${p.label}"><span class="cp-pf">${p.short}</span><span class="cp-count">${n}</span></span>`;
    }).join('')}</div></div>
  </div>`;
  }

  // ---------------------------------------------------------------- views
  function viewHTML() {
    if (!HQ.loaded.content) {
      return `<div class="card"><div class="cp-empty-note">Memuatkan content plan…</div></div>`;
    }
    const month = inMonth();
    const extra = S.view === 'kalendar' ? [] : undated();
    if (!month.length && !extra.length) {
      return `<div class="empty">
        <div class="empty-ico">${ICON.film}</div>
        <p class="empty-title">Belum ada content untuk ${E(monthLabel(S.month))}</p>
        <p class="empty-text">Rancang post TikTok, Reels, carousel dan live di sini — setiap satu dengan hook, storyline babak demi babak, caption dan status produksi.</p>
        <button class="btn primary" id="cp-empty-new" data-act="new">${ICON.plus}Content pertama</button>
      </div>`;
    }
    const rows = filtered(month).sort(byDate);
    if (S.view === 'papan') return boardHTML(rows.concat(filtered(extra)));
    if (S.view === 'senarai') return listHTML(rows.concat(filtered(extra).sort(byDate)));
    return calendarHTML(rows);
  }

  const noMatch = () => `<div class="card"><div class="cp-empty-note">Tiada post ikut tapisan ini. <button class="btn sm" data-act="clear">Kosongkan tapisan</button></div></div>`;

  function chipHTML(c) {
    return `<button class="cp-chip cp-ev" data-st="${E(c.status || 'idea')}" data-act="open" data-id="${E(c.id)}" title="${E(c.title || '')} · ${E(status(c.status).label)}">
      <span class="cp-chip-t">${E(c.title || 'Tanpa tajuk')}</span>
      <span class="cp-chip-m">${c.time ? `<span class="cp-time">${E(c.time)}</span>` : ''}${pfTags(c.platforms)}</span></button>`;
  }

  function calendarHTML(rows) {
    const today = HQ.today();
    const first = `${S.month}-01`;
    const n = daysIn(S.month);
    const lead = (HQ.weekday(first) + 6) % 7;
    const total = Math.ceil((lead + n) / 7) * 7;
    const byDay = {};
    rows.forEach((c) => { (byDay[c.date] = byDay[c.date] || []).push(c); });
    const marks = {};
    monthCampaigns(S.month).forEach((c) => weekRanges(c).forEach((r) => { if (!marks[r.from]) marks[r.from] = `Minggu ${r.week}`; }));
    const [y, m] = S.month.split('-').map(Number);
    let cells = '';
    for (let i = 0; i < total; i++) {
      const d = i - lead + 1;
      const wkend = i % 7 >= 5 ? ' wkend' : '';
      if (d < 1 || d > n) { cells += `<div class="cp-day out${wkend}" aria-hidden="true"></div>`; continue; }
      const date = ymd(y, m, d);
      const list = byDay[date] || [];
      const cls = (date === today ? ' today' : '') + (date < today ? ' past' : '') + wkend;
      cells += `<div class="cp-day${cls}" data-act="day-new" data-date="${date}">
        <div class="cp-day-top"><span class="cp-day-no">${d}</span>${marks[date] ? `<span class="cp-wk-mark">${marks[date]}</span>` : ''}
          <button class="icon-btn cp-day-add" data-act="day-new" data-date="${date}" aria-label="Content baru pada ${E(HQ.fmtDate(date))}">${ICON.plus}</button></div>
        ${list.slice(0, 3).map(chipHTML).join('')}
        ${list.length > 3 ? `<button class="cp-more" data-act="more" data-date="${date}">+${list.length - 3} lagi</button>` : ''}
      </div>`;
    }
    const und = filtered(undated()).length;
    const agenda = rows.length ? agendaHTML(rows, today) : '';
    return `<div class="card cp-cal cp-cal-wrap">
      <div class="cp-cal-head">${WEEKDAYS.map((w) => `<div>${w}</div>`).join('')}</div>
      <div class="cp-cal-grid">${cells}</div>
      ${und ? `<div class="cp-undated">${und} idea belum bertarikh — lihat di <button class="btn ghost sm" data-act="view" data-v="papan">Papan</button></div>` : ''}
    </div>
    <div class="cp-agenda">${agenda ? `<div class="card">${agenda}</div>` : noMatch()}</div>
    ${!rows.length && filtersOn() ? `<div class="cp-cal-wrap" style="margin-top:12px">${noMatch()}</div>` : ''}`;
  }

  function agendaHTML(rows, today) {
    const days = [];
    rows.forEach((c) => { const last = days[days.length - 1]; if (last && last.date === c.date) last.items.push(c); else days.push({ date: c.date, items: [c] }); });
    return days.map((g) => {
      const wd = HQ.weekday(g.date);
      return `<div class="cp-ag-day ${g.date === today ? 'today' : ''}">
        <div class="cp-ag-date"><span>${HQ.DAYS_SHORT[wd]}</span><b>${+g.date.slice(8)}</b><span>${HQ.MONTHS_SHORT[+g.date.slice(5, 7) - 1]}</span></div>
        <div class="cp-ag-list">${g.items.map((c) => `<button class="cp-ag-item cp-ev" data-st="${E(c.status || 'idea')}" data-act="open" data-id="${E(c.id)}">
          <span class="cp-ag-main"><strong>${E(c.title || 'Tanpa tajuk')}</strong>
            <span class="cp-ag-meta">${c.time ? `<span class="mono">${E(c.time)}</span>` : ''}<span class="cp-pfrow">${pfTags(c.platforms)}</span>${c.format ? `<span>${E(c.format)}</span>` : ''}</span></span>
          ${statusPill(c.status)}</button>`).join('')}</div>
      </div>`;
    }).join('');
  }

  function boardHTML(rows) {
    if (!rows.length) return noMatch();
    return `<div class="cp-board" role="list" aria-label="Papan status">${STATUSES.map((s, si) => {
      const col = rows.filter((c) => (c.status || 'idea') === s.id);
      return `<section class="cp-col" role="listitem" aria-label="${s.label}">
        <div class="cp-col-head">${statusPill(s.id)}<span class="cp-count">${col.length}</span></div>
        ${col.length ? col.map((c) => `<article class="cp-card cp-ev" data-st="${s.id}" data-act="open" data-id="${E(c.id)}" tabindex="0" aria-label="${E(c.title || 'Tanpa tajuk')}">
          <div class="cp-card-t">${E(c.title || 'Tanpa tajuk')}</div>
          <div class="cp-card-meta"><span class="mono">${c.date ? E(HQ.fmtDate(c.date, true)) : 'Tiada tarikh'}${c.time ? ' · ' + E(c.time) : ''}</span></div>
          <div class="cp-card-meta"><span class="cp-pfrow">${pfTags(c.platforms)}</span>${c.format ? `<span>${E(c.format)}</span>` : ''}${c.week ? `<span>· M${E(c.week)}</span>` : ''}</div>
          ${c.pillar ? `<div class="cp-card-meta"><span class="pill" data-tone="muted">${E(c.pillar)}</span></div>` : ''}
          <div class="cp-card-foot">${avatar(c.owner || 'me', true)}<span class="spacer"></span>
            <button class="icon-btn" data-act="move" data-id="${E(c.id)}" data-d="-1" ${si === 0 ? 'disabled' : ''} aria-label="Undur ke ${si ? STATUSES[si - 1].label : ''}" title="${si ? '← ' + STATUSES[si - 1].label : ''}">${ICON.left}</button>
            <button class="icon-btn" data-act="move" data-id="${E(c.id)}" data-d="1" ${si === STATUSES.length - 1 ? 'disabled' : ''} aria-label="Maju ke ${si < STATUSES.length - 1 ? STATUSES[si + 1].label : ''}" title="${si < STATUSES.length - 1 ? STATUSES[si + 1].label + ' →' : ''}">${ICON.right}</button>
          </div></article>`).join('') : '<div class="cp-col-empty">Kosong</div>'}
      </section>`;
    }).join('')}</div>`;
  }

  function listHTML(rows) {
    if (!rows.length) return noMatch();
    return `<div class="card"><div class="table-wrap"><table class="table cp-table">
      <thead><tr><th>Tarikh</th><th>Tajuk</th><th>Platform</th><th>Format</th><th>Pillar</th><th>Minggu</th><th>Status</th><th>Owner</th></tr></thead>
      <tbody>${rows.map((c) => `<tr data-act="open" data-id="${E(c.id)}" tabindex="0">
        <td class="cp-t-date"><span class="mono">${c.date ? E(HQ.fmtDate(c.date, true)) : '—'}</span>${c.time ? `<span class="muted mono"> ${E(c.time)}</span>` : ''}</td>
        <td class="cp-t-title">${E(c.title || 'Tanpa tajuk')}${c.hook ? `<span class="cp-t-sub">${E(c.hook)}</span>` : ''}</td>
        <td><span class="cp-pfrow">${pfTags(c.platforms)}</span></td>
        <td>${E(c.format || '—')}</td>
        <td>${E(c.pillar || '—')}</td>
        <td class="mono">${c.week ? 'M' + E(c.week) : '—'}</td>
        <td>${statusPill(c.status)}</td>
        <td>${avatar(c.owner || 'me', true)}</td>
      </tr>`).join('')}</tbody></table></div></div>`;
  }

  // ---------------------------------------------------------------- detail
  function openContent(id, override) {
    const c = override || HQ.get('content', id);
    if (!c) { HQ.toast('Content ini tak dijumpai', 'bad'); return; }

    const idx = statusIdx(c.status);
    const next = STATUSES[idx + 1];
    const owner = HQ.crew(c.owner || 'me');
    const scenes = lines(c.storyline).map(stripNo).filter(Boolean);
    const shots = lines(c.shotList).map(stripNo).filter(Boolean);
    const tags = String(c.hashtags || '').split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith('#') ? t : '#' + t));
    const cmp = c.campaignId ? HQ.get('campaigns', c.campaignId) : null;
    const body = `<div class="cp-det">
      <div class="cp-det-meta">${statusPill(c.status)}
        <span class="cp-det-date">${c.date ? E(HQ.fmtDate(c.date, true)) : 'Tiada tarikh'}${c.time ? ' · ' + E(c.time) : ''}</span>
        ${c.date ? `<span class="muted" style="font-size:12.5px">${E(HQ.relDay(c.date))}</span>` : ''}
        <span class="cp-pfrow">${pfTags(c.platforms)}</span>
        ${c.format ? `<span class="pill" data-tone="muted">${E(c.format)}</span>` : ''}
        ${c.pillar ? `<span class="pill" data-tone="info">${E(c.pillar)}</span>` : ''}
      </div>
      <div class="cp-det-who">
        <span class="who">${avatar(owner.id)}<span><strong>${E(owner.name)}</strong><small>${E(owner.role)}</small></span></span>
        ${cmp ? `<span class="who"><span><small>Kempen</small><strong>${E(cmp.name)}</strong>${c.week ? ` · Minggu ${E(c.week)}` : ''}</span></span>` : c.week ? `<span>Minggu ${E(c.week)}</span>` : ''}
      </div>
      ${c.hook ? `<blockquote class="cp-hook"><span class="cp-label">Hook (3 saat pertama)</span><p>${E(c.hook)}</p></blockquote>` : ''}
      <div class="cp-det-grid">
        <div>
          <section class="cp-sec"><h4>Storyline</h4>${scenes.length ? `<ol class="cp-scenes">${scenes.map((s, i) => `<li><span class="cp-scene-no">${pad(i + 1)}</span><span>${E(s)}</span></li>`).join('')}</ol>` : '<p class="cp-none">Belum ada storyline.</p>'}</section>
          <section class="cp-sec"><h4>Shot list</h4>${shots.length ? `<ul class="cp-shots">${shots.map((s) => `<li>${E(s)}</li>`).join('')}</ul>` : '<p class="cp-none">Belum ada shot list.</p>'}</section>
        </div>
        <div>
          <section class="cp-sec"><div class="cp-sec-head"><h4>Caption</h4>${c.caption || tags.length ? `<button class="btn sm" id="cp-det-copy" data-copy>${ICON.copy}Salin caption</button>` : ''}</div>
            ${c.caption ? `<div class="cp-box">${E(c.caption)}</div>` : '<p class="cp-none">Belum ada caption.</p>'}
            ${tags.length ? `<div class="cp-tags">${tags.map((t) => `<span class="cp-tag">${E(t)}</span>`).join('')}</div>` : ''}
          </section>
          <section class="cp-sec"><h4>CTA</h4>${c.cta ? `<div class="cp-cta">${E(c.cta)}</div>` : '<p class="cp-none">—</p>'}</section>
          ${c.notes ? `<section class="cp-sec"><h4>Nota</h4><div class="cp-box">${E(c.notes)}</div></section>` : ''}
          ${c.link ? `<section class="cp-sec"><h4>Link</h4><a class="cp-link" href="${E(/^https?:\/\//i.test(c.link) ? c.link : 'https://' + c.link)}" target="_blank" rel="noopener">${E(c.link)}</a></section>` : ''}
        </div>
      </div>
    </div>`;
    const actions = [
      { label: 'Padam', kind: 'danger', onClick: async () => {
        const ok = await HQ.confirm(`Padam "${c.title || 'content ini'}"? Tindakan ini tak boleh diundur.`, 'Padam');
        if (!ok) return false;
        await HQ.remove('content', c.id); HQ.toast('Content dipadam');
      } },
      { label: 'Duplikasi', kind: 'ghost', onClick: async () => {
        const copy = { ...c }; delete copy.id; delete copy.createdAt;
        copy.title = (c.title || 'Content') + ' (salinan)'; copy.status = 'idea';
        const nid = await HQ.add('content', copy, 'ct');
        HQ.toast('Diduplikasi', 'good');
        setTimeout(() => editContent(HQ.get('content', nid) || { id: nid, ...copy }), 0);
      } },
      { label: 'Edit', onClick: () => { setTimeout(() => editContent(c), 0); } },
    ];
    if (next) actions.push({ label: `→ ${next.label}`, kind: 'primary', onClick: async () => {
      await HQ.update('content', c.id, { status: next.id });
      HQ.toast(`Status: ${next.label}`, 'good');
      setTimeout(() => openContent(c.id, HQ.get('content', c.id) || { ...c, status: next.id }), 0);
    } });
    const m = HQ.modal({ title: c.title || 'Tanpa tajuk', wide: true, body, actions });
    const cb = m.body.querySelector('[data-copy]');
    if (cb) cb.onclick = () => HQ.copy([c.caption || '', tags.join(' ')].filter(Boolean).join('\n\n'));
  }

  // ---------------------------------------------------------------- content form
  function editContent(c) {
    const isNew = !c || !c.id;
    const d = { title: '', date: '', time: '', platforms: [], format: 'Reel', pillar: '', campaignId: '', week: '', status: 'idea', owner: 'me',
      hook: '', storyline: '', caption: '', hashtags: '', cta: '', shotList: '', notes: '', link: '', ...(c || {}) };
    if (isNew && d.date && !d.campaignId) {
      const mc = monthCampaigns(monthOf(d.date));
      if (mc.length) { d.campaignId = (mc.find((x) => x.id === S.cmp) || mc[0]).id; }
    }
    if (isNew && d.campaignId && d.date && !d.week) d.week = weekFor(HQ.get('campaigns', d.campaignId), d.date);
    const cmps = campaigns();
    const pillarOpts = new Set();
    cmps.forEach((x) => (x.pillars || []).forEach((p) => p && p.name && pillarOpts.add(p.name)));
    allContent().forEach((x) => x.pillar && pillarOpts.add(x.pillar));
    const ta = (id, key, label, rows, hint, ph) => `<div class="field span-2"><label for="cp-f-${id}">${label}</label>
      <textarea class="input" id="cp-f-${id}" rows="${rows}" ${ph ? `placeholder="${E(ph)}"` : ''}>${E(d[key])}</textarea>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    const body = HQ.h(`<form class="form-grid cp-form" novalidate>
      <div class="field span-2"><label for="cp-f-title">Tajuk</label><input class="input" id="cp-f-title" value="${E(d.title)}" placeholder="cth. Before/after detailing Civic Type R" required></div>
      <div class="field"><label for="cp-f-date">Tarikh post</label><input class="input" type="date" id="cp-f-date" value="${E(d.date)}"></div>
      <div class="field"><label for="cp-f-time">Masa</label><input class="input" type="time" id="cp-f-time" value="${E(d.time)}"></div>
      <div class="field span-2"><span class="label" id="cp-f-pf-label">Platform</span>
        <div class="cp-pf-toggles" role="group" aria-labelledby="cp-f-pf-label">${PLATFORMS.map((p) =>
          `<button type="button" class="chip ${d.platforms.includes(p.id) ? 'on' : ''}" id="cp-f-pf-${p.id}" data-pf="${p.id}" aria-pressed="${d.platforms.includes(p.id)}"><span class="cp-pf">${p.short}</span>${p.label}</button>`).join('')}</div></div>
      <div class="field"><label for="cp-f-format">Format</label><select class="input" id="cp-f-format">${FORMATS.map((f) => `<option ${f === d.format ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
      <div class="field"><label for="cp-f-pillar">Pillar</label><input class="input" id="cp-f-pillar" list="cp-f-pillar-list" value="${E(d.pillar)}" placeholder="Pilih atau taip">
        <datalist id="cp-f-pillar-list">${[...pillarOpts].map((p) => `<option value="${E(p)}"></option>`).join('')}</datalist></div>
      <div class="field"><label for="cp-f-status">Status</label><select class="input" id="cp-f-status">${STATUSES.map((s) => `<option value="${s.id}" ${s.id === d.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
      <div class="field"><label for="cp-f-owner">Owner</label><select class="input" id="cp-f-owner">${HQ.CREW.map((x) => `<option value="${E(x.id)}" ${x.id === d.owner ? 'selected' : ''}>${E(x.name)} · ${E(x.role)}</option>`).join('')}</select></div>
      <div class="field"><label for="cp-f-campaign">Kempen</label><select class="input" id="cp-f-campaign"><option value="">Tiada kempen</option>${cmps.map((x) =>
        `<option value="${E(x.id)}" ${x.id === d.campaignId ? 'selected' : ''}>${E(x.name || 'Tanpa nama')} (${E(x.month ? monthLabel(x.month) : '')})</option>`).join('')}</select></div>
      <div class="field"><label for="cp-f-week">Minggu kempen</label><input class="input" type="number" min="1" max="6" id="cp-f-week" value="${E(d.week)}" placeholder="cth. 2"><span class="hint">Diisi automatik ikut tarikh jika kosong.</span></div>
      ${ta('hook', 'hook', 'Hook', 2, '3 saat pertama — ayat yang buat orang berhenti scroll.')}
      ${ta('storyline', 'storyline', 'Storyline', 6, 'Satu babak satu baris. Nombor akan ditambah automatik.', 'Buka dengan close-up…\nReveal…\nCTA di akhir…')}
      ${ta('shotlist', 'shotList', 'Shot list', 4, 'Satu shot satu baris.')}
      ${ta('caption', 'caption', 'Caption', 5)}
      <div class="field span-2"><label for="cp-f-hashtags">Hashtag</label><input class="input" id="cp-f-hashtags" value="${E(d.hashtags)}" placeholder="#snapsense #carphotography"></div>
      <div class="field span-2"><label for="cp-f-cta">CTA</label><input class="input" id="cp-f-cta" value="${E(d.cta)}" placeholder="cth. WhatsApp 016-803 1153 untuk slot"></div>
      ${ta('notes', 'notes', 'Nota', 3)}
      <div class="field span-2"><label for="cp-f-link">Link (post / draf / folder)</label><input class="input" id="cp-f-link" value="${E(d.link)}" placeholder="https://"></div>
    </form>`);
    const $ = (id) => body.querySelector('#cp-f-' + id);
    body.querySelectorAll('[data-pf]').forEach((b) => { b.onclick = () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }; });
    let autoWeek = !d.week;
    const inferWeek = () => {
      if (!autoWeek) return;
      const cmp = HQ.get('campaigns', $('campaign').value);
      $('week').value = cmp && $('date').value ? weekFor(cmp, $('date').value) : '';
    };
    $('week').addEventListener('input', () => { autoWeek = !$('week').value; });
    $('date').addEventListener('change', () => {
      const dt = $('date').value;
      if (dt && !$('campaign').value) { const mc = monthCampaigns(monthOf(dt)); if (mc.length) $('campaign').value = mc[0].id; }
      inferWeek();
    });
    $('campaign').addEventListener('change', inferWeek);
    body.addEventListener('submit', (e) => e.preventDefault());

    HQ.modal({
      title: isNew ? 'Content baru' : 'Edit content', wide: true, body,
      actions: [
        { label: 'Batal', kind: 'ghost' },
        { label: isNew ? 'Simpan content' : 'Simpan', kind: 'primary', onClick: async () => {
          const title = $('title').value.trim();
          if (!title) { $('title').setAttribute('aria-invalid', 'true'); $('title').focus(); HQ.toast('Tajuk diperlukan', 'bad'); return false; }
          const wk = parseInt($('week').value, 10);
          const out = {
            title, date: $('date').value, time: $('time').value,
            platforms: [...body.querySelectorAll('[data-pf].on')].map((b) => b.dataset.pf),
            format: $('format').value, pillar: $('pillar').value.trim(), campaignId: $('campaign').value, week: Number.isFinite(wk) ? wk : '',
            status: $('status').value, owner: $('owner').value,
            hook: $('hook').value.trim(), storyline: $('storyline').value.trim(), shotList: $('shotlist').value.trim(),
            caption: $('caption').value.trim(), hashtags: $('hashtags').value.trim(), cta: $('cta').value.trim(),
            notes: $('notes').value.trim(), link: $('link').value.trim(),
          };
          try {
            if (isNew) {
              const nid = await HQ.add('content', out, 'ct');
              HQ.toast('Content disimpan', 'good');
              if (out.date && monthOf(out.date) !== S.month) { S.month = monthOf(out.date); render(); }
              void nid;
            } else {
              await HQ.update('content', c.id, out);
              HQ.toast('Perubahan disimpan', 'good');
            }
          } catch (e) { return false; }
          return undefined;
        } },
      ],
    });
  }

  // ---------------------------------------------------------------- campaign form
  function pillarRow(p) {
    const k = ++uid;
    return `<div class="cp-rep-row" data-kind="pillar">
      <div class="field"><label for="cp-pl-${k}-name">Pillar</label><input class="input" id="cp-pl-${k}-name" data-k="name" value="${E(p.name || '')}" placeholder="cth. Before / After"></div>
      <div class="field"><label for="cp-pl-${k}-share">Bahagian %</label><input class="input" type="number" min="0" max="100" id="cp-pl-${k}-share" data-k="share" value="${E(p.share == null ? '' : p.share)}"></div>
      <div class="field"><label for="cp-pl-${k}-desc">Penerangan</label><input class="input" id="cp-pl-${k}-desc" data-k="desc" value="${E(p.desc || '')}"></div>
      <button type="button" class="icon-btn cp-rep-x" data-rm aria-label="Buang pillar">${ICON.x}</button>
    </div>`;
  }
  function weekRow(s, i) {
    const k = ++uid;
    return `<div class="cp-rep-row" data-kind="week">
      <div class="field"><label for="cp-wk-${k}-week">Minggu</label><input class="input" type="number" min="1" max="6" id="cp-wk-${k}-week" data-k="week" value="${E(s.week || i + 1)}"></div>
      <div class="field"><label for="cp-wk-${k}-title">Tajuk</label><input class="input" id="cp-wk-${k}-title" data-k="title" value="${E(s.title || '')}"></div>
      <div class="field"><label for="cp-wk-${k}-dates">Tarikh</label><input class="input" id="cp-wk-${k}-dates" data-k="dates" value="${E(s.dates || '')}" placeholder="10–16 Okt"></div>
      <div class="field"><label for="cp-wk-${k}-theme">Tema</label><input class="input" id="cp-wk-${k}-theme" data-k="theme" value="${E(s.theme || '')}"></div>
      <div class="field wide"><label for="cp-wk-${k}-story">Cerita minggu ini</label><textarea class="input" rows="2" id="cp-wk-${k}-story" data-k="story">${E(s.story || '')}</textarea></div>
      <div class="field wide"><label for="cp-wk-${k}-cta">CTA</label><input class="input" id="cp-wk-${k}-cta" data-k="cta" value="${E(s.cta || '')}"></div>
      <button type="button" class="icon-btn cp-rep-x" data-rm aria-label="Buang minggu">${ICON.x}</button>
    </div>`;
  }

  function editCampaign(c) {
    const isNew = !c || !c.id;
    const d = { name: '', month: S.month, goal: '', audience: '', bigIdea: '', offer: '', kpis: [], pillars: [], storyline: [], hashtags: [], notes: '', ...(c || {}) };
    const pillars = d.pillars.length ? d.pillars : [{ name: '', share: '' }];
    const story = d.storyline.length ? d.storyline : [{ week: 1 }];
    const body = HQ.h(`<form class="form-grid cp-form" novalidate>
      <div class="field"><label for="cp-c-name">Nama kempen</label><input class="input" id="cp-c-name" value="${E(d.name)}" placeholder="cth. Drive Your Story"></div>
      <div class="field"><label for="cp-c-month">Bulan</label><input class="input" type="month" id="cp-c-month" value="${E(d.month)}"></div>
      <div class="field span-2"><label for="cp-c-goal">Matlamat</label><input class="input" id="cp-c-goal" value="${E(d.goal)}"></div>
      <div class="field span-2"><label for="cp-c-audience">Sasaran audiens</label><input class="input" id="cp-c-audience" value="${E(d.audience)}"></div>
      <div class="field span-2"><label for="cp-c-bigidea">Big idea</label><textarea class="input" rows="2" id="cp-c-bigidea">${E(d.bigIdea)}</textarea></div>
      <div class="field span-2"><label for="cp-c-offer">Tawaran</label><input class="input" id="cp-c-offer" value="${E(d.offer)}"></div>
      <div class="field"><label for="cp-c-kpis">KPI</label><textarea class="input" rows="4" id="cp-c-kpis">${E((d.kpis || []).join('\n'))}</textarea><span class="hint">Satu KPI satu baris.</span></div>
      <div class="field"><label for="cp-c-hashtags">Hashtag kempen</label><textarea class="input" rows="4" id="cp-c-hashtags">${E((d.hashtags || []).join(' '))}</textarea></div>
      <div class="cp-form-sec"><div class="cp-sec-head"><h4 class="cp-label">Pillar content</h4><span class="hint muted" data-share></span></div>
        <div class="cp-rep" data-rep="pillar">${pillars.map(pillarRow).join('')}</div>
        <button type="button" class="btn sm" id="cp-c-add-pillar" data-add="pillar" style="margin-top:10px">${ICON.plus}Tambah pillar</button></div>
      <div class="cp-form-sec"><div class="cp-sec-head"><h4 class="cp-label">Storyline mingguan</h4></div>
        <div class="cp-rep" data-rep="week">${story.map(weekRow).join('')}</div>
        <button type="button" class="btn sm" id="cp-c-add-week" data-add="week" style="margin-top:10px">${ICON.plus}Tambah minggu</button></div>
      <div class="field span-2"><label for="cp-c-notes">Nota</label><textarea class="input" rows="3" id="cp-c-notes">${E(d.notes)}</textarea></div>
    </form>`);
    const $ = (id) => body.querySelector('#cp-c-' + id);
    const shareHint = () => {
      const t = [...body.querySelectorAll('[data-kind="pillar"] [data-k="share"]')].reduce((s, i) => s + (Number(i.value) || 0), 0);
      body.querySelector('[data-share]').textContent = `Jumlah ${t}%${t !== 100 ? ' (sasar 100%)' : ''}`;
    };
    body.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { rm.closest('.cp-rep-row').remove(); shareHint(); return; }
      const add = e.target.closest('[data-add]');
      if (add) {
        const box = body.querySelector(`[data-rep="${add.dataset.add}"]`);
        const n = box.children.length;
        const el = HQ.h(add.dataset.add === 'pillar' ? pillarRow({}) : weekRow({ week: n + 1 }, n));
        box.appendChild(el); el.querySelector('input').focus();
      }
    });
    body.addEventListener('input', (e) => { if (e.target.dataset.k === 'share') shareHint(); });
    body.addEventListener('submit', (e) => e.preventDefault());
    shareHint();
    const rows = (kind) => [...body.querySelectorAll(`[data-kind="${kind}"]`)].map((r) => {
      const o = {}; r.querySelectorAll('[data-k]').forEach((i) => { o[i.dataset.k] = i.value.trim(); }); return o;
    });
    const actions = [];
    if (!isNew) actions.push({ label: 'Padam kempen', kind: 'danger', onClick: async () => {
      const ok = await HQ.confirm(`Padam kempen "${c.name || ''}"? Content yang dipaut kekal, cuma pautan kempen hilang.`, 'Padam');
      if (!ok) return false;
      await HQ.remove('campaigns', c.id); HQ.toast('Kempen dipadam');
    } });
    actions.push({ label: 'Batal', kind: 'ghost' });
    actions.push({ label: 'Simpan kempen', kind: 'primary', onClick: async () => {
      const name = $('name').value.trim();
      if (!name) { $('name').setAttribute('aria-invalid', 'true'); $('name').focus(); HQ.toast('Nama kempen diperlukan', 'bad'); return false; }
      const month = /^\d{4}-\d{2}$/.test($('month').value) ? $('month').value : S.month;
      const out = {
        name, month, goal: $('goal').value.trim(), audience: $('audience').value.trim(), bigIdea: $('bigidea').value.trim(), offer: $('offer').value.trim(),
        kpis: lines($('kpis').value),
        hashtags: $('hashtags').value.split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith('#') ? t : '#' + t)),
        pillars: rows('pillar').filter((p) => p.name).map((p) => ({ name: p.name, share: Number(p.share) || 0, desc: p.desc })),
        storyline: rows('week').filter((s) => s.title || s.story || s.theme).map((s, i) => ({ week: parseInt(s.week, 10) || i + 1, title: s.title, dates: s.dates, theme: s.theme, story: s.story, cta: s.cta })),
        notes: $('notes').value.trim(),
      };
      try {
        if (isNew) { const nid = await HQ.add('campaigns', out, 'cmp'); S.cmp = nid; } else await HQ.update('campaigns', c.id, out);
      } catch (e) { return false; }
      if (month !== S.month) { S.month = month; }
      S.bannerOpen = true; savePrefs(); render();
      HQ.toast('Kempen disimpan', 'good');
      return undefined;
    } });
    HQ.modal({ title: isNew ? 'Kempen baru' : 'Edit kempen', wide: true, body, actions });
  }

  // ---------------------------------------------------------------- day list (+n lagi)
  function openDay(date) {
    const rows = filtered(allContent().filter((c) => c.date === date)).sort(byDate);
    const body = HQ.h(`<div class="cp-dayl">${rows.map((c) => `<button class="cp-ag-item cp-ev" data-st="${E(c.status || 'idea')}" data-id="${E(c.id)}">
      <span class="cp-ag-main"><strong>${E(c.title || 'Tanpa tajuk')}</strong><span class="cp-ag-meta">${c.time ? `<span class="mono">${E(c.time)}</span>` : ''}<span class="cp-pfrow">${pfTags(c.platforms)}</span>${c.format ? `<span>${E(c.format)}</span>` : ''}</span></span>
      ${statusPill(c.status)}</button>`).join('')}</div>`);
    const m = HQ.modal({ title: HQ.fmtDate(date, true), body, actions: [{ label: '+ Content pada hari ini', kind: 'primary', onClick: () => { setTimeout(() => editContent({ date }), 0); } }] });
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) { m.close(); openContent(b.dataset.id); } });
  }

  // ---------------------------------------------------------------- events
  async function move(id, dir) {
    const c = HQ.get('content', id); if (!c) return;
    const n = STATUSES[statusIdx(c.status) + dir]; if (!n) return;
    await HQ.update('content', id, { status: n.id });
    HQ.toast(`${c.title || 'Content'} → ${n.label}`, 'good');
  }

  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el) || el.disabled) return;
    const a = el.dataset.act;
    if (a === 'month') { S.month = shiftMonth(S.month, +el.dataset.d); render(); }
    else if (a === 'month-today') { S.month = monthOf(HQ.today()); render(); }
    else if (a === 'new') editContent(defaultPrefill());
    else if (a === 'view') { S.view = el.dataset.v; savePrefs(); render(); }
    else if (a === 'pf') { const p = el.dataset.p; if (S.pf.has(p)) S.pf.delete(p); else S.pf.add(p); render(); }
    else if (a === 'clear') { S.pf.clear(); S.pillar = ''; S.owner = ''; render(); }
    else if (a === 'cmp-tab') { S.cmp = el.dataset.id; render(); }
    else if (a === 'cmp-toggle') { S.bannerOpen = !S.bannerOpen; savePrefs(); render(); }
    else if (a === 'cmp-edit') editCampaign(HQ.get('campaigns', el.dataset.id));
    else if (a === 'cmp-new') editCampaign(null);
    else if (a === 'open') openContent(el.dataset.id);
    else if (a === 'move') { e.stopPropagation(); move(el.dataset.id, +el.dataset.d); }
    else if (a === 'more') openDay(el.dataset.date);
    else if (a === 'day-new') editContent({ date: el.dataset.date });
  }

  function defaultPrefill() {
    const today = HQ.today();
    return { date: monthOf(today) === S.month ? today : `${S.month}-01` };
  }

  // ---------------------------------------------------------------- public + tab
  HQ.openContent = (id) => openContent(id);
  HQ.newContent = (prefill) => editContent({ ...(prefill || {}) });

  HQ.tab('content', {
    label: 'Content Plan',
    icon: ICON.tab,
    mount(el) {
      root = el;
      S.month = monthOf(HQ.today());
      root.innerHTML = frame();
      root.addEventListener('click', onClick);
      root.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act][tabindex]')) { e.preventDefault(); e.target.click(); }
      });
      root.addEventListener('change', (e) => {
        if (e.target.id === 'cp-filter-pillar') { S.pillar = e.target.value; render(); }
        else if (e.target.id === 'cp-filter-owner') { S.owner = e.target.value; render(); }
      });
      render();
      HQ.watch('content', render);
      HQ.watch('campaigns', render);
    },
    onShow() { render(); },
  });
})();
