// SnapSense HQ core — shared helpers every module uses (HQ namespace).
// Modules: HQ.tab('id', { label, mount(root) }) and read data with HQ.watch / HQ.list.
(function () {
  'use strict';

  const HQ = window.HQ = window.HQ || {};
  const TZ = 'Asia/Kuala_Lumpur';
  const COLLECTIONS = ['todos', 'content', 'campaigns', 'copies', 'insights', 'plans', 'weddingDates', 'competitors', 'quotes', 'packages', 'settings'];

  // ---------- crew (assignees) ----------
  HQ.CREW = [
    { id: 'me', name: 'Saya', role: 'Pemilik', color: '#16181d' },
    { id: 'green', name: 'Haziq', role: 'Project Manager', color: '#3fae6a' },
    { id: 'lili', name: 'Lili', role: 'Social Media', color: '#f06a9b' },
    { id: 'purple', name: 'Sofea', role: 'Content Creator', color: '#9b6ad8' },
    { id: 'yellow', name: 'Irfan', role: 'Marketing Manager', color: '#f2c230' },
    { id: 'red', name: 'Mira', role: 'Graphic Designer', color: '#e04545' },
    { id: 'cyan', name: 'Farid', role: 'Web Developer', color: '#38c6e0' },
    { id: 'orange', name: 'Amir', role: 'Photographer', color: '#f08a2c' },
    { id: 'black', name: 'Zul', role: 'Videographer', color: '#2a2a30' },
    { id: 'blu', name: 'Danial', role: 'Video Editor', color: '#2f6df6' },
    { id: 'white', name: 'Aina', role: 'Copywriter', color: '#b9b6ae' },
    { id: 'navy', name: 'Hafiz', role: 'Account Manager', color: '#24346e' },
    { id: 'lilac', name: 'Nadia', role: 'HR', color: '#b79be6' },
  ];
  HQ.crew = (id) => HQ.CREW.find((c) => c.id === id) || HQ.CREW[0];
  HQ.OFFICE_URL = 'https://claude.ai/artifact/LZMZiGWM3pVdcCy1ud1h9h';

  // ---------- small utils ----------
  HQ.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  HQ.uid = (prefix) => `${prefix || 'x'}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  HQ.num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };
  HQ.rm = (n) => 'RM ' + (Number(n) || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  HQ.rm0 = (n) => 'RM ' + Math.round(Number(n) || 0).toLocaleString('en-MY');
  HQ.nowISO = () => new Date().toISOString();

  // Dates are plain 'YYYY-MM-DD' strings in Malaysia time.
  HQ.today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  HQ.addDays = (ymd, n) => { const d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  HQ.diffDays = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000); // a - b
  HQ.weekday = (ymd) => new Date(ymd + 'T00:00:00Z').getUTCDay(); // 0 = Ahad
  HQ.DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  HQ.DAYS_SHORT = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
  HQ.MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  HQ.MONTHS_SHORT = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  HQ.fmtDate = (ymd, withDay) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-').map(Number);
    const s = `${d} ${HQ.MONTHS_SHORT[m - 1]} ${y}`;
    return withDay ? `${HQ.DAYS_SHORT[HQ.weekday(ymd)]}, ${s}` : s;
  };
  HQ.fmtDateLong = (ymd) => { if (!ymd) return ''; const [y, m, d] = ymd.split('-').map(Number); return `${d} ${HQ.MONTHS[m - 1]} ${y}`; };
  HQ.relDay = (ymd) => {
    if (!ymd) return '';
    const n = HQ.diffDays(ymd, HQ.today());
    if (n === 0) return 'Hari ini';
    if (n === 1) return 'Esok';
    if (n === -1) return 'Semalam';
    if (n < 0) return `${-n} hari lewat`;
    if (n < 7) return HQ.DAYS[HQ.weekday(ymd)];
    return HQ.fmtDate(ymd);
  };

  // Create an element from an HTML string (single root).
  HQ.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  // Add module CSS once (use tokens only: var(--…)).
  HQ.css = (id, text) => {
    if (document.getElementById('css-' + id)) return;
    const s = document.createElement('style'); s.id = 'css-' + id; s.textContent = text; document.head.appendChild(s);
  };

  // ---------- toast / modal / confirm / copy ----------
  HQ.toast = (msg, tone) => {
    let box = document.getElementById('toasts');
    if (!box) { box = HQ.h('<div id="toasts" class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(box); }
    const t = HQ.h(`<div class="toast ${tone ? 'tone-' + tone : ''}">${HQ.esc(msg)}</div>`);
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  };

  // HQ.modal({ title, body: html|Node, wide, actions: [{label, kind:'primary'|'ghost'|'danger', onClick(close) -> false keeps open}] })
  HQ.modal = (opts) => {
    const wrap = HQ.h(`<div class="modal-backdrop"><div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${HQ.esc(opts.title || '')}</h3><button class="icon-btn" data-x aria-label="Tutup">✕</button></div>
      <div class="modal-body"></div><div class="modal-foot"></div></div></div>`);
    const body = wrap.querySelector('.modal-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); };
    const onKey = (e) => { if (e.key !== 'Escape') return; const all = document.querySelectorAll('.modal-backdrop'); if (all[all.length - 1] === wrap) { e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-x]').onclick = close;
    const foot = wrap.querySelector('.modal-foot');
    (opts.actions || []).forEach((a) => {
      const b = HQ.h(`<button class="btn ${a.kind || ''}">${HQ.esc(a.label)}</button>`);
      b.onclick = async () => { const r = a.onClick ? await a.onClick(close, body) : undefined; if (r !== false) close(); };
      foot.appendChild(b);
    });
    if (!foot.children.length) foot.remove();
    document.body.appendChild(wrap);
    const first = body.querySelector('input,select,textarea'); if (first) first.focus();
    return { el: wrap, body, close };
  };

  HQ.confirm = (text, okLabel) => new Promise((resolve) => {
    let done = false;
    HQ.modal({
      title: 'Pasti?', body: `<p>${HQ.esc(text)}</p>`,
      actions: [{ label: 'Batal', kind: 'ghost', onClick: () => { done = true; resolve(false); } },
        { label: okLabel || 'Ya', kind: 'danger', onClick: () => { done = true; resolve(true); } }],
      onClose: () => { if (!done) resolve(false); },
    });
  });

  HQ.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); HQ.toast('Disalin', 'good'); return true; } catch (e) {
      HQ.modal({ title: 'Salin teks ini', body: `<textarea class="input" rows="10" readonly>${HQ.esc(text)}</textarea>` });
      const ta = document.querySelector('.modal textarea'); if (ta) { ta.focus(); ta.select(); }
      return false;
    }
  };

  // ---------- capabilities ----------
  const cap = (name) => (window.claude && window.claude.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null));
  HQ.capability = cap; // HQ.capability('downloads'), HQ.capability('mcp')

  // ---------- data store ----------
  // Live: claude db. Elsewhere (local preview): a localStorage store with the same small API.
  function localStore() {
    const KEY = 'snapsense-hq-local';
    let data = {};
    try { data = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { data = {}; }
    const subs = {};
    const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } };
    const snap = (col) => ({ docs: Object.entries(data[col] || {}).map(([id, body]) => ({ id, exists: true, data: () => body })) });
    const emit = (col) => { persist(); (subs[col] || []).forEach((fn) => fn(snap(col))); };
    return {
      local: true,
      collection(col) {
        return {
          onSnapshot(fn) { (subs[col] = subs[col] || []).push(fn); setTimeout(() => fn(snap(col)), 0); return () => {}; },
          doc(id) {
            return {
              async set(body) { (data[col] = data[col] || {})[id] = JSON.parse(JSON.stringify(body)); emit(col); },
              async update(body) { (data[col] = data[col] || {})[id] = { ...(data[col][id] || {}), ...JSON.parse(JSON.stringify(body)) }; emit(col); },
              async delete() { if (data[col]) delete data[col][id]; emit(col); },
            };
          },
        };
      },
    };
  }

  const cache = {}; // col -> array of {id, ...data}
  const listeners = {}; // col -> [fn]
  let store = null;
  HQ.loaded = {}; // col -> true once first snapshot arrived

  HQ.ready = (async () => {
    const db = await cap('db');
    store = db || localStore();
    HQ.live = !!db;
    COLLECTIONS.forEach((col) => {
      store.collection(col).onSnapshot((snap) => {
        cache[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        HQ.loaded[col] = true;
        (listeners[col] || []).forEach((fn) => { try { fn(cache[col]); } catch (e) { console.error(e); } });
      }, (err) => {
        console.error(col, err);
        HQ.toast(`Gagal baca ${col}: ${err && err.code ? err.code : 'ralat'}`, 'bad');
      });
    });
    document.documentElement.dataset.store = HQ.live ? 'live' : 'local';
    return store;
  })();

  // Subscribe to a collection: fn(rows) now (if loaded) and on every change. Returns unsubscribe.
  HQ.watch = (col, fn) => {
    (listeners[col] = listeners[col] || []).push(fn);
    if (cache[col]) fn(cache[col]);
    return () => { listeners[col] = listeners[col].filter((f) => f !== fn); };
  };
  HQ.list = (col) => cache[col] || [];
  HQ.get = (col, id) => (cache[col] || []).find((r) => r.id === id) || null;

  const clean = (obj) => { const o = { ...obj }; delete o.id; return JSON.parse(JSON.stringify(o)); };
  const fail = (what) => (e) => { console.error(e); HQ.toast(`Tak dapat simpan (${e && e.code ? e.code : 'ralat'}). Cuba lagi.`, 'bad'); throw e; };
  HQ.set = async (col, id, body) => { await HQ.ready; return store.collection(col).doc(id).set(clean(body)).catch(fail(col)); };
  HQ.update = async (col, id, patch) => { await HQ.ready; return store.collection(col).doc(id).update(clean(patch)).catch(fail(col)); };
  HQ.remove = async (col, id) => { await HQ.ready; return store.collection(col).doc(id).delete().catch(fail(col)); };
  HQ.add = async (col, body, prefix) => { const id = HQ.uid(prefix || col.slice(0, 2)); await HQ.set(col, id, { createdAt: HQ.nowISO(), ...body }); return id; };

  // Company settings live in settings/company.
  HQ.company = () => HQ.get('settings', 'company') || {};

  // ---------- tabs / router ----------
  const tabs = [];
  HQ.tab = (id, def) => { tabs.push({ id, ...def }); };
  HQ.go = (id) => { if (location.hash !== '#' + id) location.hash = id; else show(id); };

  function show(id) {
    const t = tabs.find((x) => x.id === id) || tabs[0];
    if (!t) return;
    document.querySelectorAll('.nav a').forEach((a) => a.setAttribute('aria-current', a.dataset.tab === t.id ? 'page' : 'false'));
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.tab !== t.id; });
    let root = document.querySelector(`.view[data-tab="${t.id}"]`);
    if (!root) {
      root = HQ.h(`<section class="view" data-tab="${t.id}"></section>`);
      document.getElementById('main').appendChild(root);
      try { t.mount(root); } catch (e) { console.error(e); root.innerHTML = `<p class="empty">Bahagian ini gagal dimuat: ${HQ.esc(e.message)}</p>`; }
    }
    window.scrollTo(0, 0);
    if (t.onShow) t.onShow(root);
  }

  HQ.start = () => {
    const order = ['utama', 'todo', 'content', 'insight', 'copy', 'quote', 'settings'];
    tabs.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    document.getElementById('nav').innerHTML = tabs.map((t) =>
      `<a href="#${t.id}" data-tab="${t.id}"><span class="nav-ico" aria-hidden="true">${t.icon || ''}</span><span>${HQ.esc(t.label)}</span></a>`).join('');
    const route = () => show((location.hash || '').slice(1) || tabs[0].id);
    window.addEventListener('hashchange', route);
    route();
  };
})();
