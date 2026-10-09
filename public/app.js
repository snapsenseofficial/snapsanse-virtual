// Data layer + side panel: connects to the server (SSE) or runs the demo.
(function (PO) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const agents = new Map();
  const log = [];
  const STATUS_LABEL = {
    typing: 'Coding', reading: 'Reading', running: 'Running', browsing: 'Browsing', thinking: 'Thinking',
    planning: 'Planning', delegating: 'Delegating', waiting: 'Needs you', idle: 'Idle', done: 'Done',
  };
  const KIND_ICON = {
    typing: '✎', reading: '📖', running: '▶', browsing: '🌐', planning: '☑', delegating: '👥',
    waiting: '⚠', prompt: '💬', done: '✓', error: '✖', session: '🚪', thinking: '…', fire: '🔥', rescue: '🧯', comfort: '💜',
  };
  const TOOL_KINDS = new Set(['typing', 'reading', 'running', 'browsing', 'planning', 'delegating']);
  let soundOn = false;
  let renderQueued = false;

  PO.world.init($('office'), (id) => { renderPanel(); if (id) scrollToCard(id); });
  // office incidents (overheated computers, rescues) go into the activity feed
  PO.world.onEvent((e) => {
    const a = agents.get(e.agentId);
    log.push({ ts: Date.now(), agentId: e.agentId, project: a ? a.project : 'Facilities', kind: e.kind, text: e.text });
    if (e.kind === 'fire') chime();
    queueRender();
  });

  // ---- events -------------------------------------------------------------------
  function handle(msg) {
    switch (msg.type) {
      case 'snapshot':
        agents.clear(); log.length = 0; PO.world.reset();
        if (msg.logo) PO.world.setLogo(msg.logo);
        msg.agents.forEach((a) => { agents.set(a.id, a); PO.world.upsert(a, { instant: true }); });
        log.push(...msg.log);
        break;
      case 'agent': {
        const prev = agents.get(msg.agent.id);
        if (msg.agent.status === 'waiting' && (!prev || prev.status !== 'waiting')) chime();
        agents.set(msg.agent.id, msg.agent);
        PO.world.upsert(msg.agent);
        break;
      }
      case 'remove':
        agents.delete(msg.id);
        PO.world.remove(msg.id);
        break;
      case 'log':
        log.push(msg.entry);
        if (['prompt', 'done', 'error'].includes(msg.entry.kind)) PO.world.emote(msg.entry.agentId, msg.entry.kind);
        if (TOOL_KINDS.has(msg.entry.kind)) PO.world.noteTool(msg.entry.agentId);
        if (log.length > 200) log.shift();
        break;
      default:
    }
    queueRender();
  }

  function startDemo() {
    $('conn').textContent = '● demo mode';
    $('conn').className = 'conn demo';
    PO.demo.start(handle);
    // demo recordings should still show your own logo when the server has one
    if (window.PO_LOGO) PO.world.setLogo(window.PO_LOGO);
    else if (location.protocol === 'file:') PO.world.setLogo('logo.png');
    else if (location.protocol.startsWith('http')) {
      fetch('api/state').then((r) => r.json()).then((j) => PO.world.setLogo(j.logo)).catch(() => {});
    }
  }

  const params = new URLSearchParams(location.search);
  if (params.has('demo') || location.protocol === 'file:' || window.PO_FORCE_DEMO) {
    startDemo();
  } else {
    let opened = false;
    const es = new EventSource('events');
    es.onopen = () => { opened = true; $('conn').textContent = '● live'; $('conn').className = 'conn live'; };
    es.onerror = () => {
      if (!opened) { es.close(); startDemo(); return; }
      $('conn').textContent = '● reconnecting…'; $('conn').className = 'conn off';
    };
    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'snapshot' && msg.demo) { es.close(); startDemo(); return; }
      if (msg.type === 'snapshot') loadCrew();
      if (msg.type === 'crew') { renderCrew(msg.status); return; }
      handle(msg);
    };
  }

  // ---- panel --------------------------------------------------------------------
  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; renderPanel(); });
  }

  function ago(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderPanel() {
    const list = [...agents.values()].sort((a, b) =>
      (a.parentId || a.id).localeCompare(b.parentId || b.id) || (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0));
    const sel = PO.world.selected;
    $('agents').innerHTML = list.length ? list.map((a) => {
      const look = PO.world.look(a.id);
      const role = look.role || PO.roles.ASSISTANT;
      return `<button class="card ${a.status} ${a.parentId ? 'child' : ''} ${a.id === sel ? 'sel' : ''}" data-id="${esc(a.id)}">
        <img class="avatar" src="${portrait(look)}" alt="">
        <span class="who"><b>${esc(look.name)}</b>${a.parentId ? ` <i>intern</i>` : ''}
          <span class="job" style="--role:${role.color}">${esc(role.label)} · ${esc(role.ms)}</span>
          <span class="traits">${(look.mascot ? look.mascot.traits.slice(0, 3) : []).map((x) => `<em>${esc(x)}</em>`).join('')}</span>
          <small>${esc(a.project)}</small></span>
        <span class="pill">${STATUS_LABEL[a.status] || a.status}</span>
        <span class="detail">${esc(a.detail)}</span>
        <span class="meta">${a.toolCount} tools · ${ago(a.startedAt)}</span>
      </button>`;
    }).join('') : `<p class="empty">No agents yet.<br>Run <code>claude</code> in any project and watch them clock in.<br><a href="?demo">Try demo mode →</a></p>`;

    $('log').innerHTML = log.slice(-60).reverse().map((e) => {
      const look = PO.world.look(e.agentId);
      const t = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `<li class="${e.kind}"><span class="t">${t}</span><span class="dot" style="background:${look.skin}"></span>
        <span class="k">${KIND_ICON[e.kind] || '•'}</span><span class="x"><b>${esc(look.name)}</b> ${esc(e.text)}</span></li>`;
    }).join('');

    const all = [...agents.values()];
    const working = all.filter((a) => !['idle', 'waiting', 'done'].includes(a.status)).length;
    const waiting = all.filter((a) => a.status === 'waiting').length;
    const tools = all.reduce((n, a) => n + (a.toolCount || 0), 0);
    $('stats').innerHTML = `<span><b>${all.length}</b> agents</span><span><b>${working}</b> working</span>` +
      `<span class="${waiting ? 'warn' : ''}"><b>${waiting}</b> need you</span><span><b>${tools}</b> tool calls</span>`;
    document.title = waiting ? `(${waiting}) ⚠ Virtual Office` : 'SnapSense Virtual Office';
  }

  // Pixel portrait of a crew member for the agent cards (cached per look).
  const portraits = new Map();
  function portrait(look) {
    const key = look.name + look.skin;
    if (portraits.has(key)) return portraits.get(key);
    const c = document.createElement('canvas');
    c.width = 80; c.height = 72;
    const g = c.getContext('2d');
    g.fillStyle = '#262b3f'; g.fillRect(0, 0, 80, 72);
    g.scale(2.6, 2.6);
    PO.toon.draw(g, 15.4, 38, look, { dir: 'down', pose: 'stand', mood: 'normal', t: 0 });
    const url = c.toDataURL();
    portraits.set(key, url);
    return url;
  }

  function scrollToCard(id) {
    const el = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  $('agents').addEventListener('dblclick', (e) => {
    const card = e.target.closest('.card');
    if (card) PO.world.focus(card.dataset.id);
  });
  $('agents').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) PO.world.select(card.dataset.id === PO.world.selected ? null : card.dataset.id);
  });

  // ---- sound --------------------------------------------------------------------
  let audio;
  function chime() {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach((f, i) => {
        const o = audio.createOscillator(), gn = audio.createGain();
        o.type = 'square'; o.frequency.value = f;
        gn.gain.setValueAtTime(0.06, audio.currentTime + i * 0.12);
        gn.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + i * 0.12 + 0.11);
        o.connect(gn).connect(audio.destination);
        o.start(audio.currentTime + i * 0.12); o.stop(audio.currentTime + i * 0.12 + 0.12);
      });
    } catch (_) { /* no audio */ }
  }
  $('sound').addEventListener('click', () => {
    soundOn = !soundOn;
    $('sound').textContent = soundOn ? '🔔 Sound on' : '🔕 Sound off';
    $('sound').setAttribute('aria-pressed', soundOn);
    if (soundOn) chime();
  });

  // ---- 2D / 3D view -------------------------------------------------------------
  async function setView(mode) {
    const is3d = mode === '3d';
    $('view2d').setAttribute('aria-pressed', !is3d);
    $('view3d').setAttribute('aria-pressed', is3d);
    $('spin').hidden = $('resetcam').hidden = !is3d;
    $('office').hidden = is3d;
    $('zoom2d').hidden = is3d;
    $('stage3d').hidden = !is3d;
    PO.world.set2D(!is3d);
    try { localStorage.setItem('po-view', mode); } catch (_) { /* storage blocked */ }
    if (!is3d) { PO.view3d.hide(); return; }
    $('msg3d').hidden = false; $('msg3d').textContent = 'Building 3D office…';
    try {
      await PO.view3d.show($('stage3d'));
      $('msg3d').hidden = true;
    } catch (e) {
      $('msg3d').textContent = '3D could not load (three.js missing). Showing 2D.';
      setTimeout(() => { $('msg3d').hidden = true; }, 3000);
      setView('2d');
    }
  }
  $('zin').addEventListener('click', () => PO.world.zoomBy(1.3));
  $('zout').addEventListener('click', () => PO.world.zoomBy(1 / 1.3));
  $('zfit').addEventListener('click', () => PO.world.fit());
  $('view2d').addEventListener('click', () => setView('2d'));
  $('view3d').addEventListener('click', () => setView('3d'));
  $('resetcam').addEventListener('click', () => PO.view3d.resetView());
  $('spin').addEventListener('click', () => {
    const on = $('spin').getAttribute('aria-pressed') !== 'true';
    $('spin').setAttribute('aria-pressed', on);
    PO.view3d.setAutoRotate(on);
  });
  let savedView = '2d';
  try { savedView = localStorage.getItem('po-view') || (location.hash === '#3d' ? '3d' : '2d'); } catch (_) { /* ignore */ }
  if (location.hash === '#3d') savedView = '3d';
  if (savedView === '3d') setView('3d');

  // ---- live crew: connections, approvals, jobs -------------------------------------
  let sessionToken = null;
  let crewStatus = null;
  const greeted = new Set();
  async function loadCrew() {
    try {
      sessionToken = sessionToken || (await (await fetch('api/session')).json()).token;
      renderCrew(await (await fetch('api/crew')).json());
    } catch (_) { /* demo or older server */ }
  }

  function renderCrew(st) {
    crewStatus = st;
    $('crew').hidden = false;
    const conn = (name, label, c, hint) => `<div class="conn-row ${c.connected ? 'ok' : ''}">
      <span><b>${label}</b> ${c.connected ? '✔ disambung' : c.configured ? 'belum disambung' : `<small>${hint}</small>`}</span>
      ${c.configured ? `<a class="btn" href="oauth/${name}/start?token=${sessionToken}">${c.connected ? 'Sambung semula' : 'Sambung'}</a>` : ''}</div>`;
    $('connections').innerHTML = conn('google', 'Google (Calendar, Drive, Sheet)', st.google, 'isi crew/config.json') +
      conn('tiktok', 'TikTok', st.tiktok, 'isi crew/config.json');
    const pending = st.approvals.filter((a) => a.status === 'pending');
    $('approvals').innerHTML = pending.length ? pending.map((a) => `<div class="approval">
        <div class="ap-head"><b>${esc(a.title)}</b><small>${esc(a.by)} · ${new Date(a.createdAt).toLocaleString()}</small></div>
        <pre>${esc(a.details)}</pre>
        <div class="ap-actions">
          <button class="btn ok" data-ap="${a.id}" data-act="approve">${a.kind === 'reply' ? 'Lulus (saya hantar sendiri)' : 'Approve'}</button>
          <button class="btn" data-ap="${a.id}" data-act="reject">Reject</button>
          ${a.kind === 'reply' ? `<button class="btn" data-copy="${esc(a.payload.text)}">Salin</button>` : ''}
        </div></div>`).join('') : '<p class="muted">Tiada yang menunggu kelulusan.</p>';
    $('joblist').innerHTML = st.jobs.map((j) => `<div class="job"><b>${esc(j.name)}</b>
      <small>${esc(j.workspace)} · ${esc(JSON.stringify(j.schedule))}</small>
      <code>cd crew/workspaces/${esc(j.workspace)} &amp;&amp; claude "${esc(j.prompt)}"</code></div>`).join('');
    // whoever proposed something waves at you
    for (const a of pending) {
      if (greeted.has(a.id)) continue;
      greeted.add(a.id);
      const agent = [...agents.values()].find((x) => x.project === a.by);
      if (agent) PO.world.emote(agent.id, 'approval');
    }
  }

  $('approvals').addEventListener('click', async (e) => {
    const copy = e.target.closest('[data-copy]');
    if (copy) { try { await navigator.clipboard.writeText(copy.dataset.copy); copy.textContent = 'Disalin ✔'; } catch (_) { /* clipboard blocked */ } return; }
    const b = e.target.closest('[data-ap]');
    if (!b) return;
    b.disabled = true; b.textContent = '…';
    const r = await fetch('api/approvals/decide', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Office-Token': sessionToken },
      body: JSON.stringify({ id: b.dataset.ap, action: b.dataset.act }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { b.disabled = false; b.textContent = 'Cuba lagi'; alertBox(j.error || 'Gagal'); }
    loadCrew();
  });
  function alertBox(msg) {
    const p = document.createElement('p'); p.className = 'ap-error'; p.textContent = msg;
    $('approvals').prepend(p); setTimeout(() => p.remove(), 8000);
  }

  setInterval(renderPanel, 5000);
})(window.PO = window.PO || {});
