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
    waiting: '⚠', prompt: '💬', done: '✓', error: '✖', session: '🚪', thinking: '…',
  };
  let soundOn = false;
  let renderQueued = false;

  PO.world.init($('office'), (id) => { renderPanel(); if (id) scrollToCard(id); });

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
    if (location.protocol.startsWith('http') && !window.PO_FORCE_DEMO) {
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
        <span class="avatar" style="--shirt:${look.shirt};--hair:${look.hair};--skin:${look.skin}"></span>
        <span class="who"><b>${esc(look.name)}</b>${a.parentId ? ` <i>sub-agent</i>` : ''}
          <span class="job" style="--role:${role.color}">${esc(role.label)} · ${esc(role.ms)}</span><small>${esc(a.project)}</small></span>
        <span class="pill">${STATUS_LABEL[a.status] || a.status}</span>
        <span class="detail">${esc(a.detail)}</span>
        <span class="meta">${a.toolCount} tools · ${ago(a.startedAt)}</span>
      </button>`;
    }).join('') : `<p class="empty">No agents yet.<br>Run <code>claude</code> in any project and watch them clock in.<br><a href="?demo">Try demo mode →</a></p>`;

    $('log').innerHTML = log.slice(-60).reverse().map((e) => {
      const look = PO.world.look(e.agentId);
      const t = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `<li class="${e.kind}"><span class="t">${t}</span><span class="dot" style="background:${look.shirt}"></span>
        <span class="k">${KIND_ICON[e.kind] || '•'}</span><span class="x"><b>${esc(look.name)}</b> ${esc(e.text)}</span></li>`;
    }).join('');

    const all = [...agents.values()];
    const working = all.filter((a) => !['idle', 'waiting', 'done'].includes(a.status)).length;
    const waiting = all.filter((a) => a.status === 'waiting').length;
    const tools = all.reduce((n, a) => n + (a.toolCount || 0), 0);
    $('stats').innerHTML = `<span><b>${all.length}</b> agents</span><span><b>${working}</b> working</span>` +
      `<span class="${waiting ? 'warn' : ''}"><b>${waiting}</b> need you</span><span><b>${tools}</b> tool calls</span>`;
    document.title = waiting ? `(${waiting}) ⚠ Pixel Office` : 'SnapSense Pixel Office';
  }

  function scrollToCard(id) {
    const el = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

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

  setInterval(renderPanel, 5000);
})(window.PO = window.PO || {});
