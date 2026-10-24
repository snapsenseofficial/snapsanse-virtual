// SnapSense HQ — To-Do module (Haziq). Tab id: todo. Collection: todos.
(function () {
  'use strict';

  const ICON = '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M6.6 10.2l2.4 2.4 4.4-4.9"/></svg>';
  const I_LINK = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 11.5a3.2 3.2 0 0 0 4.5 0l2.6-2.6a3.2 3.2 0 0 0-4.5-4.5l-.9.9"/><path d="M11.5 8.5a3.2 3.2 0 0 0-4.5 0l-2.6 2.6a3.2 3.2 0 0 0 4.5 4.5l.9-.9"/></svg>';
  const I_CHECK = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.2 8.4l3.2 3.2 6.4-7"/></svg>';
  const I_CHEV = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
  const I_PLUS = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>';

  const CATS = ['Klien', 'Content', 'Shooting', 'Editing', 'Admin', 'Kewangan', 'Lain-lain'];
  const PRIOS = [['tinggi', 'Tinggi', 'bad'], ['sederhana', 'Sederhana', 'warn'], ['rendah', 'Rendah', 'muted']];
  const PRANK = { tinggi: 0, sederhana: 1, rendah: 2 };
  const STATUSES = [['todo', 'Belum mula'], ['doing', 'Sedang buat'], ['done', 'Siap']];
  const FILTERS = [['all', 'Semua'], ['today', 'Hari ini'], ['week', 'Minggu ini'], ['late', 'Lewat'], ['done', 'Siap']];
  const DONE_LIMIT = 20;

  // ---------- UI state (survives re-render) ----------
  const S = { view: 'list', filter: 'all', who: 'all', cat: 'all', q: '', doneOpen: false };
  let root = null;
  let loaded = false;

  // ---------- helpers ----------
  const esc = (s) => HQ.esc(s);
  const prio = (p) => PRIOS.find((x) => x[0] === p) || PRIOS[1];
  const isDone = (t) => t.status === 'done';
  const crewName = (id) => HQ.crew(id).name;
  const safeUrl = (u) => { u = String(u || '').trim(); if (!u) return ''; return /^https?:\/\//i.test(u) ? u : 'https://' + u; };

  function cmp(a, b) {
    return (PRANK[a.priority] ?? 1) - (PRANK[b.priority] ?? 1)
      || (a.time || '99:99').localeCompare(b.time || '99:99')
      || String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  }
  const cmpDue = (a, b) => String(a.due || '').localeCompare(String(b.due || '')) || cmp(a, b);

  function matches(t, today) {
    if (S.who !== 'all' && (t.assignee || 'me') !== S.who) return false;
    if (S.cat !== 'all' && (t.category || 'Lain-lain') !== S.cat) return false;
    if (S.q) {
      const hay = `${t.title || ''} ${t.notes || ''} ${t.category || ''} ${crewName(t.assignee || 'me')}`.toLowerCase();
      if (!hay.includes(S.q.toLowerCase())) return false;
    }
    const open = !isDone(t);
    switch (S.filter) {
      case 'today': return open && t.due === today;
      case 'week': return open && !!t.due && t.due >= today && t.due <= HQ.addDays(today, 6);
      case 'late': return open && !!t.due && t.due < today;
      case 'done': return !open;
      default: return true;
    }
  }

  function groupOf(t, today) {
    if (isDone(t)) return 'done';
    if (!t.due) return 'nodate';
    const n = HQ.diffDays(t.due, today);
    if (n < 0) return 'late';
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    if (n <= 6) return 'week';
    return 'later';
  }
  const GROUPS = [['late', 'Lewat'], ['today', 'Hari ini'], ['tomorrow', 'Esok'], ['week', 'Minggu ini'], ['later', 'Akan datang'], ['nodate', 'Tiada tarikh'], ['done', 'Siap']];

  // ---------- writes ----------
  // Full-document replace so removed fields (doneAt) really disappear.
  async function save(t, changes) {
    const doc = { ...t, ...changes };
    delete doc.id;
    Object.keys(doc).forEach((k) => { if (doc[k] === undefined) delete doc[k]; });
    if (doc.status === 'done') { if (!doc.doneAt) doc.doneAt = HQ.nowISO(); } else delete doc.doneAt;
    return HQ.set('todos', t.id, doc);
  }
  const setStatus = (t, status) => save(t, { status });

  const defaults = () => ({ title: '', notes: '', due: '', time: '', priority: 'sederhana', status: 'todo', assignee: 'me', category: 'Lain-lain', link: '' });
  HQ.todoQuickAdd = async (title, opts) => {
    const doc = { ...defaults(), ...(opts || {}), title: String(title || '').trim() };
    if (doc.status === 'done') doc.doneAt = HQ.nowISO();
    return HQ.add('todos', doc, 'td');
  };

  // ---------- rendering ----------
  function rowHtml(t, today) {
    const done = isDone(t);
    const p = prio(t.priority);
    const crew = HQ.crew(t.assignee || 'me');
    const late = !done && t.due && t.due < today;
    const url = safeUrl(t.link);
    const dueTxt = t.due ? `<span class="td-due ${late ? 'late' : t.due === today && !done ? 'now' : ''}">${esc(HQ.relDay(t.due))}</span>` : '';
    const timeTxt = t.time ? `<span class="td-time mono">${esc(t.time)}</span>` : '';
    const notes = String(t.notes || '').trim().split('\n')[0];
    return `<div class="td-row ${done ? 'is-done' : ''}" data-id="${esc(t.id)}" role="button" tabindex="0" aria-label="Sunting: ${esc(t.title)}">
      <button type="button" class="td-check" data-act="toggle" role="checkbox" aria-checked="${done}" aria-label="${done ? 'Tanda belum siap' : 'Tanda siap'}">${I_CHECK}</button>
      <div class="td-main">
        <div class="td-title"><span class="td-title-t">${esc(t.title)}</span>${url ? `<a class="td-link" data-act="link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Buka pautan" aria-label="Buka pautan">${I_LINK}</a>` : ''}</div>
        <div class="td-meta">
          <span class="pill" data-tone="${p[2]}">${p[1]}</span>${dueTxt}${timeTxt}
          <span class="td-cat">${esc(t.category || 'Lain-lain')}</span>
        </div>
        ${notes ? `<div class="td-notes">${esc(notes)}</div>` : ''}
      </div>
      <span class="avatar sm td-who" style="--c:${esc(crew.color)}" title="${esc(crew.name)}">${esc(crew.name.charAt(0))}</span>
    </div>`;
  }

  function cardHtml(t, today) {
    const done = isDone(t);
    const p = prio(t.priority);
    const crew = HQ.crew(t.assignee || 'me');
    const late = !done && t.due && t.due < today;
    const idx = STATUSES.findIndex((s) => s[0] === (t.status || 'todo'));
    const url = safeUrl(t.link);
    return `<div class="td-card ${done ? 'is-done' : ''}" data-id="${esc(t.id)}" role="button" tabindex="0" aria-label="Sunting: ${esc(t.title)}">
      <div class="td-title"><span class="td-title-t">${esc(t.title)}</span>${url ? `<a class="td-link" data-act="link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Buka pautan" aria-label="Buka pautan">${I_LINK}</a>` : ''}</div>
      <div class="td-meta">
        <span class="pill" data-tone="${p[2]}">${p[1]}</span>
        ${t.due ? `<span class="td-due ${late ? 'late' : ''}">${esc(HQ.relDay(t.due))}</span>` : ''}${t.time ? `<span class="td-time mono">${esc(t.time)}</span>` : ''}
        <span class="td-cat">${esc(t.category || 'Lain-lain')}</span>
      </div>
      <div class="td-card-foot">
        <span class="avatar sm" style="--c:${esc(crew.color)}" title="${esc(crew.name)}">${esc(crew.name.charAt(0))}</span>
        <span class="td-who-name">${esc(crew.name)}</span>
        <span class="td-mv">
          <button type="button" class="icon-btn" data-act="mv" data-dir="-1" aria-label="Pindah ke ${esc(STATUSES[Math.max(idx - 1, 0)][1])}" ${idx <= 0 ? 'disabled' : ''}>◀</button>
          <button type="button" class="icon-btn" data-act="mv" data-dir="1" aria-label="Pindah ke ${esc(STATUSES[Math.min(idx + 1, 2)][1])}" ${idx >= 2 ? 'disabled' : ''}>▶</button>
        </span>
      </div>
    </div>`;
  }

  function emptyHtml(filtered) {
    if (filtered) {
      return `<div class="empty"><div class="empty-ico">${ICON}</div>
        <h3 class="empty-title">Tiada tugasan sepadan</h3>
        <p class="empty-text">Cuba tukar tapisan atau carian anda.</p>
        <button class="btn" type="button" data-act="reset">Kosongkan tapisan</button></div>`;
    }
    return `<div class="empty"><div class="empty-ico">${ICON}</div>
      <h3 class="empty-title">Belum ada tugasan</h3>
      <p class="empty-text">Senaraikan semua kerja studio di sini: edit gambar, hantar quotation, booking shooting, posting content. Tetapkan tarikh, keutamaan dan siapa yang uruskan, supaya tiada yang tertinggal.</p>
      <button class="btn primary" type="button" data-act="new">+ Tugasan pertama</button></div>`;
  }

  function renderList(shown, today) {
    const buckets = {};
    shown.forEach((t) => { (buckets[groupOf(t, today)] = buckets[groupOf(t, today)] || []).push(t); });
    let html = '';
    GROUPS.forEach(([key, label]) => {
      let items = buckets[key];
      if (!items || !items.length) return;
      if (key === 'done') {
        items = items.slice().sort((a, b) => String(b.doneAt || '').localeCompare(String(a.doneAt || '')));
        const total = items.length;
        const open = S.doneOpen || S.filter === 'done';
        const body = open ? items.slice(0, DONE_LIMIT).map((t) => rowHtml(t, today)).join('') : '';
        const more = open && total > DONE_LIMIT ? `<div class="td-more">+${total - DONE_LIMIT} lagi tugasan siap disembunyikan</div>` : '';
        html += `<section class="card td-group" data-g="done">
          <button type="button" class="td-gh td-gh-btn" data-act="doneToggle" aria-expanded="${open}"><span class="td-chev ${open ? 'open' : ''}">${I_CHEV}</span><h3>${label}</h3><span class="td-count">${total}</span></button>
          ${body}${more}</section>`;
        return;
      }
      items = items.slice().sort(key === 'late' || key === 'week' || key === 'later' ? cmpDue : cmp);
      html += `<section class="card td-group ${key === 'late' ? 'is-late' : ''}" data-g="${key}">
        <div class="td-gh"><h3>${label}</h3><span class="td-count">${items.length}</span></div>
        ${items.map((t) => rowHtml(t, today)).join('')}</section>`;
    });
    return `<div class="stack td-groups">${html}</div>`;
  }

  function renderBoard(shown, today) {
    const cols = STATUSES.map(([key, label]) => {
      let items = shown.filter((t) => (t.status || 'todo') === key);
      const total = items.length;
      if (key === 'done') items = items.sort((a, b) => String(b.doneAt || '').localeCompare(String(a.doneAt || ''))).slice(0, DONE_LIMIT);
      else items = items.sort(cmpDue);
      const body = items.length ? items.map((t) => cardHtml(t, today)).join('') : '<div class="td-col-empty">Tiada tugasan</div>';
      const more = total > items.length ? `<div class="td-more">+${total - items.length} lagi</div>` : '';
      return `<section class="td-col" data-col="${key}"><div class="td-col-head"><h3>${label}</h3><span class="td-count">${total}</span></div><div class="td-col-body">${body}${more}</div></section>`;
    }).join('');
    return `<div class="td-board">${cols}</div>`;
  }

  function render() {
    if (!root) return;
    const today = HQ.today();
    const all = loaded ? HQ.list('todos') : [];
    const open = all.filter((t) => !isDone(t));
    const late = open.filter((t) => t.due && t.due < today).length;
    const dueToday = open.filter((t) => t.due === today).length;

    // head sub line
    const sub = root.querySelector('#td-sub');
    sub.textContent = all.length
      ? `${open.length} belum siap · ${late} lewat · ${dueToday} hari ini`
      : 'Senarai kerja harian studio, semua di satu tempat';

    // toolbar visibility + chip counts
    root.querySelector('#td-tools').hidden = !all.length;
    root.querySelector('#td-team').hidden = true;
    const counts = {
      all: all.length,
      today: open.filter((t) => t.due === today).length,
      week: open.filter((t) => t.due && t.due >= today && t.due <= HQ.addDays(today, 6)).length,
      late,
      done: all.length - open.length,
    };
    root.querySelectorAll('[data-filter]').forEach((b) => {
      const k = b.dataset.filter;
      b.classList.toggle('on', S.filter === k);
      b.setAttribute('aria-pressed', S.filter === k);
      b.querySelector('.td-n').textContent = counts[k];
    });
    root.querySelectorAll('[data-view]').forEach((b) => {
      b.classList.toggle('on', S.view === b.dataset.view);
      b.setAttribute('aria-pressed', S.view === b.dataset.view);
    });
    const whoSel = root.querySelector('#td-who'); if (whoSel.value !== S.who) whoSel.value = S.who;
    const catSel = root.querySelector('#td-cat'); if (catSel.value !== S.cat) catSel.value = S.cat;

    // team strip (crew with open tasks)
    const byWho = {};
    open.forEach((t) => { const w = t.assignee || 'me'; byWho[w] = (byWho[w] || 0) + 1; });
    const members = HQ.CREW.filter((c) => byWho[c.id]);
    const team = root.querySelector('#td-team');
    if (members.length) {
      team.hidden = false;
      team.querySelector('.td-team-list').innerHTML = members.map((c) =>
        `<button type="button" class="td-member ${S.who === c.id ? 'on' : ''}" data-who="${esc(c.id)}" aria-pressed="${S.who === c.id}" title="${esc(c.name)} · ${esc(c.role)}">
          <span class="avatar sm" style="--c:${esc(c.color)}">${esc(c.name.charAt(0))}</span><span class="td-member-name">${esc(c.name)}</span><span class="td-member-n">${byWho[c.id]}</span></button>`).join('');
    }

    // body
    const body = root.querySelector('#td-body');
    if (!all.length) { body.innerHTML = emptyHtml(false); return; }
    const shown = all.filter((t) => matches(t, today));
    if (!shown.length) { body.innerHTML = emptyHtml(true); return; }
    body.innerHTML = S.view === 'board' ? renderBoard(shown, today) : renderList(shown, today);
  }

  // ---------- edit modal ----------
  function openEditor(t, preset) {
    const isNew = !t;
    const v = isNew ? { ...defaults(), ...(preset || {}) } : t;
    const opt = (val, label, cur) => `<option value="${esc(val)}" ${val === cur ? 'selected' : ''}>${esc(label)}</option>`;
    const body = `<div class="form-grid">
      <div class="field span-2"><label for="td-f-title">Tugasan</label><input id="td-f-title" class="input" type="text" value="${esc(v.title)}" placeholder="Apa yang perlu dibuat?" maxlength="200"></div>
      <div class="field span-2"><label for="td-f-notes">Nota</label><textarea id="td-f-notes" class="input" rows="3" placeholder="Butiran, arahan klien, dll.">${esc(v.notes || '')}</textarea></div>
      <div class="field"><label for="td-f-due">Tarikh akhir</label><input id="td-f-due" class="input" type="date" value="${esc(v.due || '')}"></div>
      <div class="field"><label for="td-f-time">Masa</label><input id="td-f-time" class="input" type="time" value="${esc(v.time || '')}"></div>
      <div class="field"><label for="td-f-pri">Keutamaan</label><select id="td-f-pri" class="input">${PRIOS.map((p) => opt(p[0], p[1], v.priority || 'sederhana')).join('')}</select></div>
      <div class="field"><label for="td-f-status">Status</label><select id="td-f-status" class="input">${STATUSES.map((s) => opt(s[0], s[1], v.status || 'todo')).join('')}</select></div>
      <div class="field"><label for="td-f-who">Ditugaskan kepada</label><select id="td-f-who" class="input">${HQ.CREW.map((c) => opt(c.id, c.id === 'me' ? 'Saya' : `${c.name} · ${c.role}`, v.assignee || 'me')).join('')}</select></div>
      <div class="field"><label for="td-f-cat">Kategori</label><select id="td-f-cat" class="input">${CATS.map((c) => opt(c, c, v.category || 'Lain-lain')).join('')}</select></div>
      <div class="field span-2"><label for="td-f-link">Pautan (pilihan)</label><input id="td-f-link" class="input" type="url" inputmode="url" value="${esc(v.link || '')}" placeholder="https://drive.google.com/…"></div>
    </div>`;
    const actions = [];
    if (!isNew) {
      actions.push({
        label: 'Padam', kind: 'danger',
        onClick: async () => {
          const ok = await HQ.confirm(`Padam tugasan "${t.title}"? Tindakan ini tidak boleh dibatalkan.`, 'Padam');
          if (!ok) return false;
          await HQ.remove('todos', t.id);
          HQ.toast('Tugasan dipadam', 'good');
        },
      });
    }
    actions.push({ label: 'Batal', kind: 'ghost' });
    actions.push({
      label: 'Simpan', kind: 'primary',
      onClick: async (close, bodyEl) => {
        const g = (id) => bodyEl.querySelector('#' + id).value;
        const title = g('td-f-title').trim();
        if (!title) { HQ.toast('Sila tulis nama tugasan', 'bad'); bodyEl.querySelector('#td-f-title').focus(); return false; }
        const data = {
          title, notes: g('td-f-notes').trim(), due: g('td-f-due'), time: g('td-f-time'),
          priority: g('td-f-pri'), status: g('td-f-status'), assignee: g('td-f-who'),
          category: g('td-f-cat'), link: safeUrl(g('td-f-link')),
        };
        try {
          if (isNew) await HQ.todoQuickAdd(title, data); else await save(t, data);
        } catch (e) { return false; }
        HQ.toast(isNew ? 'Tugasan ditambah ✓' : 'Disimpan ✓', 'good');
      },
    });
    const m = HQ.modal({ title: isNew ? 'Tugasan baru' : 'Sunting tugasan', body, actions });
    const del = m.el.querySelector('.modal-foot .btn.danger'); if (del) del.style.marginRight = 'auto';
    const titleInput = m.el.querySelector('#td-f-title');
    titleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); m.el.querySelector('.modal-foot .btn.primary').click(); } });
  }

  // ---------- mount ----------
  function mount(el) {
    root = el;
    HQ.css('todo', CSS);
    el.innerHTML = `
      <div class="page-head">
        <h1>To-Do</h1>
        <p class="sub" id="td-sub">Senarai kerja harian studio, semua di satu tempat</p>
        <div class="actions"><button type="button" class="btn primary" id="td-new">+ Tugasan baru</button></div>
      </div>

      <div class="card td-quick">
        <input id="td-qa-title" class="input" type="text" placeholder="Tulis tugasan… tekan Enter" maxlength="200" autocomplete="off" aria-label="Tugasan baru">
        <input id="td-qa-due" class="input" type="date" aria-label="Tarikh akhir">
        <select id="td-qa-pri" class="input" aria-label="Keutamaan">${PRIOS.map((p) => `<option value="${p[0]}" ${p[0] === 'sederhana' ? 'selected' : ''}>${p[1]}</option>`).join('')}</select>
        <button type="button" class="btn" id="td-qa-btn">${I_PLUS} Tambah</button>
      </div>

      <div class="td-tools" id="td-tools">
        <div class="td-tools-row">
          <div class="row td-filters" role="group" aria-label="Tapisan">${FILTERS.map(([k, l]) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="false">${l} <span class="td-n num">0</span></button>`).join('')}</div>
          <div class="tabs-inline td-views" role="group" aria-label="Paparan">
            <button type="button" class="chip" data-view="list" aria-pressed="true">Senarai</button>
            <button type="button" class="chip" data-view="board" aria-pressed="false">Papan</button>
          </div>
        </div>
        <div class="td-tools-row td-selects">
          <select id="td-who" class="input" aria-label="Tapis orang"><option value="all">Semua orang</option>${HQ.CREW.map((c) => `<option value="${esc(c.id)}">${c.id === 'me' ? 'Saya' : esc(c.name)}</option>`).join('')}</select>
          <select id="td-cat" class="input" aria-label="Tapis kategori"><option value="all">Semua kategori</option>${CATS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
          <input id="td-search" class="input" type="search" placeholder="Cari tugasan…" aria-label="Cari tugasan" autocomplete="off">
        </div>
      </div>

      <div class="td-team" id="td-team" hidden>
        <div class="td-team-label">Tugasan pasukan</div>
        <div class="td-team-list"></div>
      </div>

      <div id="td-body"></div>`;

    const $ = (s) => el.querySelector(s);

    // quick add
    const qaTitle = $('#td-qa-title');
    const quickAdd = async () => {
      const title = qaTitle.value.trim();
      if (!title) { qaTitle.focus(); return; }
      const opts = { due: $('#td-qa-due').value || '', priority: $('#td-qa-pri').value };
      qaTitle.value = ''; $('#td-qa-pri').value = 'sederhana';
      try { await HQ.todoQuickAdd(title, opts); HQ.toast('Tugasan ditambah ✓', 'good'); } catch (e) { qaTitle.value = title; }
      qaTitle.focus();
    };
    qaTitle.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); quickAdd(); } });
    $('#td-qa-btn').onclick = quickAdd;
    $('#td-new').onclick = () => openEditor(null);

    // filters
    el.querySelectorAll('[data-filter]').forEach((b) => { b.onclick = () => { S.filter = b.dataset.filter; render(); }; });
    el.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => { S.view = b.dataset.view; render(); }; });
    $('#td-who').onchange = (e) => { S.who = e.target.value; render(); };
    $('#td-cat').onchange = (e) => { S.cat = e.target.value; render(); };
    $('#td-search').addEventListener('input', (e) => { S.q = e.target.value.trim(); render(); });
    $('#td-team').addEventListener('click', (e) => {
      const b = e.target.closest('[data-who]'); if (!b) return;
      S.who = S.who === b.dataset.who ? 'all' : b.dataset.who; render();
    });

    // list / board interactions (delegated; body is re-rendered)
    const body = $('#td-body');
    body.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]');
      const a = act && act.dataset.act;
      if (a === 'new') return openEditor(null);
      if (a === 'reset') {
        Object.assign(S, { filter: 'all', who: 'all', cat: 'all', q: '' });
        $('#td-search').value = ''; return render();
      }
      if (a === 'doneToggle') { S.doneOpen = !S.doneOpen; return render(); }
      if (a === 'link') { e.stopPropagation(); return; }
      const host = e.target.closest('[data-id]');
      if (!host) return;
      const t = HQ.get('todos', host.dataset.id);
      if (!t) return;
      if (a === 'toggle') { e.stopPropagation(); return setStatus(t, isDone(t) ? 'todo' : 'done').catch(() => {}); }
      if (a === 'mv') {
        e.stopPropagation();
        const i = STATUSES.findIndex((s) => s[0] === (t.status || 'todo'));
        const j = Math.min(2, Math.max(0, i + Number(act.dataset.dir)));
        if (j !== i) return setStatus(t, STATUSES[j][0]).catch(() => {});
        return;
      }
      openEditor(t);
    });
    body.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const host = e.target.closest('.td-row, .td-card');
      if (!host || e.target !== host) return;
      e.preventDefault();
      const t = HQ.get('todos', host.dataset.id); if (t) openEditor(t);
    });

    HQ.watch('todos', () => { loaded = true; render(); });
    render();
  }

  // ---------- styles (tokens only) ----------
  const CSS = `
.td-quick { display: grid; grid-template-columns: minmax(0, 1fr) 160px 150px auto; gap: 8px; padding: 10px; align-items: center; }
.td-quick .input { min-width: 0; }
.td-tools { display: flex; flex-direction: column; gap: 10px; }
.td-tools[hidden] { display: none; }
.td-tools-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; }
.td-filters { gap: 6px; }
.td-filters .chip .td-n { font-size: 11.5px; font-weight: 700; opacity: 0.6; }
.td-filters .chip.on .td-n { opacity: 0.8; }
.td-selects { justify-content: flex-start; flex-wrap: nowrap; }
.td-selects select.input { width: auto; flex: 0 1 170px; }
.td-selects input.input { flex: 1 1 160px; }

.td-team { display: flex; align-items: center; gap: 8px 12px; flex-wrap: wrap; }
.td-team[hidden] { display: none; }
.td-team-label { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); flex: none; }
.td-team-list { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.td-member { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px 0 5px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink); font: 600 13px var(--font-body); cursor: pointer; }
.td-member:hover { border-color: var(--ink); }
.td-member.on { background: var(--ink); border-color: var(--ink); color: var(--surface); }
.td-member:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.td-member-n { font-family: var(--font-mono); font-size: 12px; font-weight: 700; opacity: 0.7; }

.td-groups { gap: 16px; }
.td-group { overflow: hidden; }
.td-gh { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--line); background: var(--surface-2); }
.td-gh h3 { margin: 0; font-size: 12.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.td-group.is-late .td-gh h3 { color: var(--bad); }
.td-gh-btn { width: 100%; border: 0; border-bottom: 0; text-align: left; cursor: pointer; font-family: var(--font-body); color: var(--ink); }
.td-gh-btn[aria-expanded="true"] { border-bottom: 1px solid var(--line); }
.td-gh-btn:hover { background: var(--line); }
.td-gh-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.td-chev { display: inline-grid; transition: transform 0.15s ease; transform: rotate(-90deg); color: var(--muted); }
.td-chev.open { transform: none; }
.td-count { font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; color: var(--muted); background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 1px 7px; }
.td-more { padding: 10px 14px; font-size: 12.5px; color: var(--muted); text-align: center; }

.td-row { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 12px; align-items: start; padding: 11px 14px; border-bottom: 1px solid var(--line); cursor: pointer; }
.td-row:last-child { border-bottom: 0; }
.td-row:hover { background: var(--surface-2); }
.td-row:focus-visible, .td-card:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.td-check { width: 22px; height: 22px; margin-top: 1px; padding: 0; display: inline-grid; place-items: center; border: 2px solid var(--line-strong); border-radius: 7px; background: var(--surface); color: transparent; cursor: pointer; flex: none; transition: background-color 0.12s ease, border-color 0.12s ease; }
.td-check:hover { border-color: var(--good); }
.td-check[aria-checked="true"] { background: var(--good); border-color: var(--good); color: var(--surface); }
.td-check:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.td-main { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.td-title { display: flex; align-items: flex-start; gap: 8px; font-size: 14.5px; font-weight: 600; line-height: 1.35; min-width: 0; }
.td-title-t { min-width: 0; overflow-wrap: anywhere; }
.td-link { display: inline-grid; place-items: center; flex: none; width: 22px; height: 22px; margin-top: -1px; border-radius: 6px; color: var(--info); }
.td-link:hover { background: var(--info-bg); }
.td-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: 12.5px; color: var(--muted); }
.td-due { font-weight: 600; }
.td-due.now { color: var(--ink); }
.td-due.late { color: var(--bad); }
.td-time { font-size: 12px; }
.td-cat { display: inline-flex; align-items: center; height: 20px; padding: 0 8px; border: 1px solid var(--line); border-radius: 6px; font-size: 11.5px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.td-notes { font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.td-who { margin-top: 1px; }
.is-done .td-title-t { text-decoration: line-through; color: var(--muted); }
.is-done .td-meta, .is-done .td-notes { opacity: 0.75; }

.td-board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
.td-col { background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--radius); min-width: 0; }
.td-col-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
.td-col-head h3 { margin: 0; font-size: 12.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.td-col-body { display: flex; flex-direction: column; gap: 8px; padding: 0 8px 8px; min-width: 0; }
.td-col-empty { padding: 18px 8px; text-align: center; font-size: 13px; color: var(--muted); }
.td-card { display: flex; flex-direction: column; gap: 8px; padding: 11px 12px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); box-shadow: var(--shadow); cursor: pointer; min-width: 0; }
.td-card:hover { border-color: var(--line-strong); }
.td-card-foot { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--muted); }
.td-who-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-mv { margin-left: auto; display: inline-flex; gap: 2px; flex: none; }
.td-mv .icon-btn { width: 30px; height: 30px; font-size: 11px; }

@media (max-width: 900px) {
  .td-quick { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; }
  .td-quick #td-qa-title { grid-column: 1 / -1; }
  .td-quick #td-qa-pri { grid-column: 2; }
}
@media (max-width: 719.98px) {
  .td-board { grid-template-columns: minmax(0, 1fr); }
  .td-selects { flex-wrap: wrap; }
  .td-selects select.input { flex: 1 1 calc(50% - 8px); }
  .td-selects input.input { flex: 1 1 100%; }
  .td-tools-row.td-selects { justify-content: stretch; }
  .td-views { align-self: flex-start; }
}
@media (max-width: 480px) {
  .td-quick { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .td-quick #td-qa-btn { grid-column: 1 / -1; }
  .td-quick #td-qa-pri { grid-column: auto; }
  .td-row { gap: 10px; padding: 11px 12px; }
  .td-filters .chip { padding: 0 10px; }
}
`;

  HQ.tab('todo', { label: 'To-Do', icon: ICON, mount });
})();
