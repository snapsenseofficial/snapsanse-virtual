// The office: map, furniture, path-finding, agent movement and rendering.
(function (PO) {
  'use strict';

  const T = 16, COLS = 26, ROWS = 16, W = COLS * T, H = ROWS * T;
  const SPEED = 44; // px / second (logical)
  const WORK = new Set(['typing', 'reading', 'running', 'browsing', 'thinking', 'planning', 'delegating', 'waiting']);
  // Speech-bubble text per status (typing uses the job role's own verb).
  const BUBBLE = {
    reading: 'READING', running: 'RUN CODE', browsing: 'SEARCH WEB', thinking: '?',
    planning: 'PLANNING', delegating: 'ASSIGN TASK', waiting: 'NEED YOU!', done: 'DONE!', idle: 'BREAK',
  };
  const STATUS_MOOD = {
    typing: 'focused', running: 'focused', planning: 'focused', reading: 'curious', browsing: 'curious',
    thinking: 'thinking', delegating: 'happy', waiting: 'embarrassed', done: 'joyful',
  };
  // One-off reactions to events (from the activity log).
  const EMOTES = {
    hire: { mood: 'joyful', text: 'NEW HIRE!', ms: 5000, arms: 'wave' },
    prompt: { mood: 'joyful', text: 'GOT IT!', ms: 2500 },
    done: { mood: 'joyful', text: 'DONE!', ms: 4000, arms: 'cheer' },
    error: { mood: 'angry', text: 'OOPS!', ms: 4000 },
    fire: { mood: 'shocked', text: 'FIRE!!', ms: 60000, arms: 'wave', sticky: true },
    thanks: { mood: 'love', text: 'THANKS!', ms: 3500, arms: 'cheer' },
    allclear: { mood: 'happy', text: 'ALL CLEAR!', ms: 3000, arms: 'cheer' },
    onmyway: { mood: 'focused', text: 'ON MY WAY!', ms: 3000 },
    comforted: { mood: 'love', ms: 4000 },
    approval: { mood: 'embarrassed', text: 'APPROVE?', ms: 8000, arms: 'wave' },
  };
  // Workload: this many tool calls inside LOAD_WINDOW seconds sets the desk on fire.
  const LOAD_WINDOW = 20, STRESS_AT = 8, FIRE_AT = 13, FIRE_COOLDOWN = 180;
  const FIRE_ROLE = { id: 'fire-marshal', verb: 'ON DUTY', label: 'Fire Marshal', short: 'Fire Marshal', ms: 'Bomba', tags: 'berani · cekap', color: '#e5484d' };
  const { shade, mascotLook } = PO.sprites;

  // Every agent is played by a crew mascot: its role's mascot, an intern
  // version of its lead for sub-agents, or Bomba for the fire marshal.
  const looks = new Map();
  function lookFor(id) {
    return looks.get(id) || PO.sprites.lookFor(id);
  }

  function castLook(agent) {
    if (looks.has(agent.id)) return looks.get(agent.id);
    let role, mascot;
    if (agent.npc) { role = FIRE_ROLE; mascot = PO.mascots.FIRE; }
    else if (agent.parentId) {
      role = PO.roles.ASSISTANT;
      const lead = looks.get(agent.parentId);
      mascot = PO.mascots.intern(lead && lead.mascot, looks.size);
    } else {
      const taken = new Set([...sims.values()].filter((o) => !o.data.parentId && !o.data.npc).map((o) => o.look.role.id));
      role = PO.roles.pick(agent, taken);
      mascot = PO.mascots.forRole(role.id) || PO.mascots.CREW[0];
    }
    const look = mascotLook(mascot);
    look.mascot = mascot;
    look.role = role;
    // a second agent in the same role gets a numbered twin
    const same = [...looks.values()].filter((l) => l.mascot.id === mascot.id && [...sims.values()].some((s) => s.look === l)).length;
    look.name = same ? `${mascot.name} ${same + 1}` : mascot.name;
    looks.set(agent.id, look);
    return look;
  }

  // ---- map -------------------------------------------------------------------
  const blocked = [];
  for (let y = 0; y < ROWS; y++) {
    blocked.push([]);
    for (let x = 0; x < COLS; x++) blocked[y].push(y < 2 || y === ROWS - 1 || x === 0 || x === COLS - 1);
  }
  const DOOR = { tx: 0, ty: 13 };
  blocked[DOOR.ty][DOOR.tx] = false;
  const block = (x, y, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) blocked[y + j][x + i] = true; };

  const desks = [];
  for (const dy of [3, 7, 11]) {
    for (const dx of [2, 6, 10, 14]) {
      block(dx, dy, 2, 1);
      desks.push({
        tx: dx, ty: dy, owner: null, role: PO.roles.ROLES[desks.length],
        seat: { tx: dx + 1, ty: dy - 1 }, x: dx * T + 24, y: dy * T + 8,
      });
    }
  }
  const plants = [[17, 3], [17, 7], [17, 11], [24, 14], [18, 14], [1, 2]];
  plants.forEach(([x, y]) => block(x, y));
  block(18, 2, 2, 1); // bookshelf
  block(21, 2, 3, 1); // coffee counter
  block(24, 2);       // water cooler
  block(24, 5);       // arcade
  block(19, 9, 4, 1); // sofa
  block(20, 11, 2, 1); // coffee table
  block(19, 5, 4, 1);  // photo studio backdrop
  block(18, 6); block(23, 6); // softboxes
  block(20, 7);        // camera on tripod
  const BEANBAGS = [[19, 12, '#f5b83d'], [22, 12, '#9b6ad8']];
  block(1, 9);          // "WORK HARD STAY COOL" chalk sign
  block(11, 14, 2, 1);  // "Same team, different vibes" board
  BEANBAGS.forEach(([x, y]) => block(x, y));

  const tileFeet = (tx, ty) => ({ x: tx * T + 8, y: ty * T + 12 });
  const spot = (name, tx, ty, pose, dir, fx, fy) => {
    const f = tileFeet(tx, ty);
    return { name, tile: { tx, ty }, x: fx != null ? fx : f.x, y: fy != null ? fy : f.y, pose, dir };
  };
  const SPOTS = [
    ...[19, 20, 21, 22].map((x) => spot(`sofa${x}`, x, 9, 'sitFront', 'down', null, 9 * T + 13)),
    ...[21, 22, 23].map((x) => spot(`coffee${x}`, x, 3, 'stand', 'up')),
    spot('cooler', 24, 3, 'stand', 'up'),
    spot('arcade', 23, 5, 'stand', 'right'),
    spot('books18', 18, 3, 'stand', 'up'), spot('books19', 19, 3, 'stand', 'up'),
    spot('win4', 4, 2, 'stand', 'up'), spot('win13', 13, 2, 'stand', 'up'),
    ...BEANBAGS.map(([x, y]) => spot(`bean${x}`, x, y, 'sitFront', 'down', null, y * T + 13)),
    spot('studio20', 20, 6, 'stand', 'down'), spot('studio21', 21, 6, 'stand', 'down'),
    spot('shoot', 21, 8, 'stand', 'up'),
  ];

  function findPath(from, to) {
    const key = (x, y) => y * COLS + x;
    const prev = new Map([[key(from.tx, from.ty), null]]);
    const q = [from];
    while (q.length) {
      const c = q.shift();
      if (c.tx === to.tx && c.ty === to.ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = c.tx + dx, ny = c.ty + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        if (blocked[ny][nx] && !(nx === to.tx && ny === to.ty)) continue;
        const k = key(nx, ny);
        if (prev.has(k)) continue;
        prev.set(k, c);
        q.push({ tx: nx, ty: ny });
      }
    }
    if (!prev.has(key(to.tx, to.ty))) return null;
    const out = [];
    for (let c = to; c; c = prev.get(key(c.tx, c.ty))) out.unshift(c);
    return out;
  }

  // ---- SnapSense brand ---------------------------------------------------------
  // Drop a logo at public/logo.png to replace the built-in pixel sign.
  const logoImg = new Image();
  let logoReady = false;
  logoImg.onload = () => { logoReady = logoImg.naturalWidth > 0; };
  function setLogo(url) { if (url && logoImg.src !== url) logoImg.src = url; }

  // "To Do" whiteboard: boxes get ticked as the team finishes tasks; sticky notes per agent.
  let tasksDone = 0;
  const TODO = ['Content', 'Design', 'Edit', 'Meeting', 'Create', 'Grow'];
  // Handwritten text on the chalkboards, whiteboard and signs, drawn at
  // screen resolution (S = pixels per logical pixel) for both 2D and 3D.
  function drawWallText(g, S, region = 'all') {
    const hand = (size) => `${Math.round(size * S)}px "Caveat", "Patrick Hand", cursive`;
    const txt = (s, x, y, size, color, align = 'center') => {
      g.font = hand(size); g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle';
      g.fillText(s, x * S, y * S);
    };
    g.save();
    // chalkboard
    txt('Better Ideas', 32, 10.5, 7, '#f1f1ec');
    txt('Bigger Dreams ☺', 32, 17.5, 7, '#f1f1ec');
    // To Do whiteboard
    txt('To Do:', 116, 7, 5.5, '#2a2d35', 'left');
    TODO.forEach((label, i) => txt(label, 7 * T + 8.5 + Math.floor(i / 3) * 24, 11.5 + (i % 3) * 5, 4.6, '#2a2d35', 'left'));
    // coffee bar chalk menu
    txt('Good Food', 21 * T + 24, 8.5, 5, '#f1f1ec');
    txt('Good Mood ☺', 21 * T + 24, 14, 5, '#f5b83d');
    if (region === 'all') {
      // floor signs
      ['WORK', 'HARD', 'STAY', 'COOL'].forEach((w, i) => txt(w, 24, 141 + i * 4.6, 4.4, '#f1f1ec'));
      txt('Same team', 192, 220, 5.2, '#f1f1ec');
      txt('Different vibes ♡', 192, 226.5, 5.2, '#f5b83d');
    }
    g.restore();
  }

  // ---- furniture drawables ------------------------------------------------------
  const SCREEN_CODE = ['#7ee787', '#79c0ff', '#ffa657', '#d2a8ff', '#ff7b72'];

  function drawScreen(g, X, Y, status, t, seed) {
    // screen area 12x8 at (X, Y)
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
    if (!status) return r(0, 0, 12, 8, '#141820');
    switch (status) {
      case 'typing': {
        r(0, 0, 12, 8, '#0f1720');
        const off = Math.floor(t * 3);
        for (let i = 0; i < 4; i++) {
          const k = (i + off + seed) * 2654435761 >>> 0;
          r(1 + (k % 3), 1 + i * 2, 3 + (k >>> 4) % 7, 1, SCREEN_CODE[(k >>> 8) % SCREEN_CODE.length]);
        }
        if (Math.floor(t * 2) % 2) r(10, 7, 1, 1, '#fff');
        break;
      }
      case 'running': {
        r(0, 0, 12, 8, '#05080a');
        const off = Math.floor(t * 4);
        for (let i = 0; i < 3; i++) r(1, 1 + i * 2, 2 + ((i + off + seed) * 7) % 8, 1, '#3fb950');
        if (Math.floor(t * 3) % 2) r(1, 7, 2, 1, '#3fb950');
        break;
      }
      case 'reading':
        r(0, 0, 12, 8, '#e8edf3');
        for (let i = 0; i < 4; i++) r(1, 1 + i * 2, 9 - ((i + seed) % 3) * 2, 1, '#8b95a1');
        r(0, (Math.floor(t * 2) % 4) * 2 + 1, 12, 1, 'rgba(121,192,255,0.6)');
        break;
      case 'browsing':
        r(0, 0, 12, 8, '#ffffff'); r(0, 0, 12, 2, '#3e8ef7'); r(1, 3, 4, 4, '#cfe3ff');
        r(6, 3, 5, 1, '#9aa4b2'); r(6, 5, 4, 1, '#9aa4b2');
        break;
      case 'planning':
        r(0, 0, 12, 8, '#fff8e1');
        for (let i = 0; i < 3; i++) { r(1, 1 + i * 2 + i % 1, 1, 1, i < (Math.floor(t) % 4) ? '#30a46c' : '#c8b88a'); r(3, 1 + i * 2, 7, 1, '#c8b88a'); }
        break;
      case 'delegating':
        r(0, 0, 12, 8, '#2a1830'); r(2, 2, 3, 3, '#f778ba'); r(7, 2, 3, 3, '#79c0ff'); r(5, 3, 2, 1, '#fff');
        break;
      case 'waiting':
        r(0, 0, 12, 8, Math.floor(t * 2) % 2 ? '#f5b83d' : '#7a5410'); r(5, 1, 2, 4, '#1b1406'); r(5, 6, 2, 1, '#1b1406');
        break;
      case 'thinking':
        r(0, 0, 12, 8, '#161b2e');
        for (let i = 0; i < 3; i++) r(3 + i * 3, 4, 1, 1, i <= Math.floor(t * 3) % 3 ? '#d2a8ff' : '#3b3f5c');
        break;
      case 'moodboard':
        r(0, 0, 12, 8, '#2b2f3a'); r(1, 1, 4, 3, '#f5b83d'); r(6, 1, 5, 2, '#e93d82'); r(1, 5, 3, 2, '#79c0ff'); r(5, 4, 3, 3, '#30a46c'); r(9, 4, 2, 3, '#fafafa');
        r(1 + (Math.floor(t * 2) % 5) * 2, 0, 1, 1, '#fff');
        break;
      case 'chart': {
        r(0, 0, 12, 8, '#f6f8fb');
        const k = Math.floor(t * 2) % 4;
        [3, 4, 6, 7].forEach((h, i) => r(1 + i * 3, 7 - Math.min(h, h - 3 + k), 2, Math.min(h, h - 3 + k), i === 3 ? '#30a46c' : '#3e8ef7'));
        r(0, 7, 12, 1, '#9aa4b2');
        break;
      }
      case 'kanban':
        r(0, 0, 12, 8, '#eef1f5');
        for (let c = 0; c < 3; c++) { r(c * 4 + 1, 1, 3, 1, ['#9aa4b2', '#f5b83d', '#30a46c'][c]); for (let i = 0; i < 3 - c + (Math.floor(t) % 2); i++) r(c * 4 + 1, 3 + i * 2, 3, 1, '#fafafa'); }
        break;
      case 'inbox':
        r(0, 0, 12, 8, '#ffffff'); r(0, 0, 12, 1, '#a18072');
        for (let i = 0; i < 3; i++) { r(1, 2 + i * 2, 1, 1, i === Math.floor(t) % 3 ? '#3e8ef7' : '#d0d5dc'); r(3, 2 + i * 2, 7 - i, 1, '#8b95a1'); }
        break;
      case 'canvas': {
        r(0, 0, 12, 8, '#fafafa'); r(0, 0, 2, 8, '#3a3f4b');
        r(3, 1, 4, 4, '#e93d82'); r(6, 3, 4, 4, 'rgba(62,142,247,0.8)'); r(8, 1, 2, 2, '#f5b83d');
        const cx = 3 + Math.floor((t * 3) % 8), cy = 1 + Math.floor((t * 2) % 6);
        r(cx, cy, 1, 1, '#111');
        break;
      }
      case 'photos': {
        r(0, 0, 12, 8, '#1d1d24');
        const pal = [['#7cc4ea', '#30a46c'], ['#f2a76b', '#8a4b2a'], ['#3a3c6e', '#f5b83d'], ['#b6e1f5', '#e5484d']];
        pal.forEach(([a, b], i) => { const x = 1 + (i % 2) * 5, y = 1 + Math.floor(i / 2) * 3; r(x, y, 4, 2, a); r(x, y + 1, 4, 1, b); });
        const sel = Math.floor(t) % 4; r(1 + (sel % 2) * 5, 1 + Math.floor(sel / 2) * 3, 4, 1, '#fff');
        break;
      }
      case 'viewfinder':
        r(0, 0, 12, 8, '#3d5674'); r(0, 5, 12, 3, '#30a46c'); r(7, 1, 3, 3, '#f5d000');
        r(0, 0, 2, 1, '#fff'); r(10, 0, 2, 1, '#fff'); r(0, 7, 2, 1, '#fff'); r(10, 7, 2, 1, '#fff');
        if (Math.floor(t * 2) % 2) r(1, 1, 1, 1, '#e5484d');
        break;
      case 'timeline': {
        r(0, 0, 12, 8, '#141820'); r(3, 0, 6, 4, '#3d5674'); r(3, 2, 6, 2, '#30a46c');
        r(0, 5, 5, 1, '#8e4ec6'); r(6, 5, 6, 1, '#8e4ec6'); r(1, 6, 7, 1, '#3e8ef7'); r(0, 7, 4, 1, '#30a46c'); r(5, 7, 5, 1, '#f5b83d');
        r(Math.floor((t * 3) % 12), 4, 1, 4, '#e5484d');
        break;
      }
      case 'feed': {
        r(0, 0, 12, 8, '#e9ecf2'); r(3, 0, 6, 8, '#ffffff');
        const off = Math.floor(t * 2) % 3;
        r(4, 1 - off + 1, 4, 3, ['#e93d82', '#f5b83d', '#3e8ef7'][off]); r(4, 5, 1, 1, '#e5484d'); r(6, 5, 2, 1, '#c9d1d9');
        if (Math.floor(t * 3) % 3 === 0) r(9, 2, 2, 1, '#e5484d');
        break;
      }
      case 'doc':
        r(0, 0, 12, 8, '#fffdf7');
        for (let i = 0; i < 4; i++) r(1, 1 + i * 2, i === 3 ? (Math.floor(t * 4) % 8) + 1 : 9 - (i % 2) * 2, 1, '#5d6580');
        break;
      default: { // idle owner: screensaver
        r(0, 0, 12, 8, '#0d1424');
        const px = Math.floor((t * 5 + seed * 3) % 22), py = Math.floor((t * 3 + seed) % 14);
        r(px > 11 ? 22 - px : px, py > 7 ? 14 - py : py, 1, 1, '#5b5bd6');
      }
    }
  }

  function deskStatus(d) {
    const owner = d.owner && sims.get(d.owner);
    if (!owner || owner.leaving) return null;
    const st = WORK.has(owner.data.status) && owner.atTarget ? owner.data.status : 'idle';
    return st === 'typing' && d.role.screen && owner.look.role === d.role ? d.role.screen : st;
  }

  // ---- agents -------------------------------------------------------------------
  const sims = new Map();
  let selectedId = null, hoverId = null;
  let onSelect = () => {};

  function upsert(agent, opts = {}) {
    let s = sims.get(agent.id);
    if (!s) {
      const look = castLook(agent);
      s = { id: agent.id, data: agent, look, path: [], dir: 'right', pose: 'stand', frame: 0, dist: 0,
        x: -10, y: DOOR.ty * T + 12, targetKey: null, desk: null, spot: null, nextWander: 0,
        leaving: false, atTarget: false, blinkAt: Math.random() * 4 };
      sims.set(agent.id, s);
      if (opts.instant) {
        const tg = targetFor(s);
        s.x = tg.x; s.y = tg.y; s.pose = tg.pose; s.dir = tg.dir; s.targetKey = tg.key; s.atTarget = true;
      } else {
        s.path = [tileFeet(DOOR.tx, DOOR.ty)];
        emote(agent.id, 'hire');
      }
    }
    s.data = agent;
    s.leaving = agent.status === 'done' || (s.leaving && opts.removed);
  }

  function emote(id, kind) {
    const s = sims.get(id), e = EMOTES[kind];
    if (!s || !e) return;
    if (s.emote && s.emote.sticky && kind !== 'thanks' && performance.now() / 1000 < s.emote.until) return;
    s.emote = { ...e, until: performance.now() / 1000 + e.ms / 1000, start: performance.now() / 1000 };
    if (kind === 'done' || kind === 'thanks' || kind === 'allclear') confetti(s.x, s.y - 24);
    if (kind === 'done' && !s.data.parentId) tasksDone++;
    if (kind === 'done') say(s, pickLine(s, 'done'), 3.5);
  }

  // ---- workload, fires and rescues ---------------------------------------------
  let onEvent = () => {};
  let npcSeq = 0;

  function loadOf(s, t) {
    if (!s.tools) return 0;
    while (s.tools.length && t - s.tools[0] > LOAD_WINDOW) s.tools.shift();
    return s.tools.length;
  }

  // Called for every tool call an agent makes.
  function noteTool(id) {
    const s = sims.get(id);
    if (!s) return;
    const t = performance.now() / 1000;
    (s.tools = s.tools || []).push(t);
    const d = s.desk;
    if (d && !desks.some((k) => k.fire) && loadOf(s, t) >= FIRE_AT && (!s.lastFire || t - s.lastFire > FIRE_COOLDOWN)) startFire(d, s, t);
  }

  function startFire(d, victim, t) {
    victim.lastFire = t;
    d.fire = { start: t, phase: 'burning', victim: victim.id, helper: null };
    emote(victim.id, 'fire');
    onEvent({ kind: 'fire', agentId: victim.id, text: `Computer overheated! ${FIRE_AT}+ tool calls in ${LOAD_WINDOW}s 🔥` });
    // nearest agent on a break grabs the extinguisher, otherwise call the fire marshal
    const idle = [...sims.values()].filter((o) => o !== victim && !o.leaving && !o.task && !o.data.npc &&
      !WORK.has(o.data.status) && o.data.status !== 'done')
      .sort((a, b) => Math.hypot(a.x - d.x, a.y - d.y) - Math.hypot(b.x - d.x, b.y - d.y));
    let helper = idle[0];
    if (!helper) {
      const id = `npc-fire-${++npcSeq}`;
      upsert({ id, npc: true, status: 'idle', project: 'Facilities', detail: 'Fire duty', toolCount: 0, startedAt: Date.now(), lastActive: Date.now() });
      helper = sims.get(id);
    }
    helper.task = { type: 'extinguish', desk: d, phase: 'going' };
    d.fire.helper = helper.id;
    helper.emote = null;
    emote(helper.id, 'onmyway');
  }

  function updateFires(t) {
    for (const d of desks) {
      const f = d.fire;
      if (!f) continue;
      const helper = sims.get(f.helper);
      const [fox, foy] = fireOffset(d);
      const X = d.tx * T + fox, Y = d.ty * T + foy;
      if (f.phase === 'burning') {
        if (Math.random() < 0.5) particle(X + 8 + Math.random() * 10, Y - 12, (Math.random() - 0.5) * 6, -12 - Math.random() * 8, 1.6, Math.random() < 0.5 ? '#6b6f7a' : '#4a4e58', 2);
        if (helper && helper.task && helper.atTarget) { f.phase = 'extinguishing'; f.at = t; helper.task.phase = 'spraying'; }
        else if (!helper || t - f.start > 40) { f.phase = 'smoke'; f.at = t; }
      } else if (f.phase === 'extinguishing') {
        for (let i = 0; i < 3; i++) {
          const sx = helper.x + 3, sy = helper.y - 14;
          const tx = X + 12 + Math.random() * 6, ty = Y - 4 + Math.random() * 6;
          particle(sx, sy, (tx - sx) * 1.6 + (Math.random() - 0.5) * 8, (ty - sy) * 1.6, 0.6, Math.random() < 0.3 ? '#cfe8ff' : '#ffffff', 1);
        }
        if (t - f.at > 3.2) { f.phase = 'smoke'; f.at = t; }
      } else if (f.phase === 'smoke') {
        if (Math.random() < 0.25) particle(X + 8 + Math.random() * 10, Y - 10, (Math.random() - 0.5) * 4, -8, 1.8, '#9aa4b2', 2);
        if (t - f.at > 2.5) {
          d.fire = null;
          emote(f.victim, 'thanks');
          if (helper) {
            helper.task = null;
            emote(helper.id, 'allclear');
            if (helper.data.npc) setTimeout(() => { helper.leaving = true; }, 2500);
            onEvent({ kind: 'rescue', agentId: helper.id, text: `${helper.look.name} put out the fire 🧯`, npc: !!helper.data.npc });
          }
        }
      }
    }
  }

  // ---- particles (code bits, smoke, foam, confetti) -----------------------------
  const particles = [];
  function particle(x, y, vx, vy, life, color, size = 1, gravity = 0) {
    if (particles.length > 400) return;
    particles.push({ x, y, vx, vy, life, max: life, color, size, gravity });
  }

  function confetti(x, y) {
    const cols = ['#e5484d', '#f5b83d', '#30a46c', '#3e8ef7', '#e93d82', '#8e4ec6'];
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 30;
      particle(x, y, Math.cos(a) * v, Math.sin(a) * v - 25, 1.4 + Math.random() * 0.6, cols[i % cols.length], 1, 60);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }

  function drawParticles(g) {
    for (const p of particles) {
      g.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      g.fillStyle = p.color;
      g.beginPath(); g.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  // Little signs of work rising from busy desks.
  function workParticles(t) {
    for (const s of sims.values()) {
      if (!s.atTarget || s.pose !== 'sitDesk' || !s.desk || s.desk.fire) continue;
      const st = s.data.status, X = s.desk.tx * T, Y = s.desk.ty * T;
      if ((st === 'typing') && Math.random() < 0.12) {
        particle(X + 20 + Math.random() * 8, Y + 5, (Math.random() - 0.5) * 4, -10 - Math.random() * 6, 1.2, Math.random() < 0.5 ? s.look.role.color : '#7ee787');
      } else if (st === 'browsing' && Math.random() < 0.08) {
        particle(X + 12, Y - 8, (Math.random() - 0.5) * 6, -8, 1, '#58a6ff');
      } else if (st === 'reading' && Math.random() < 0.05) {
        particle(X + 12 + Math.random() * 4, Y - 8, 0, -6, 1.2, '#e8edf3');
      }
    }
  }

  // Current emotion of an agent: event reaction, else status, else where they hang out.
  // ---- personality: moods, chatter, couples, jokes, comfort -----------------------
  const now = () => performance.now() / 1000;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pickFrom = (arr) => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);
  const isNight = () => { const h = new Date().getHours(); return h >= 23 || h < 5; };
  const LOVE = { blu: ['Lili, nak kopi?', 'Kau okay tak?', 'Jom tengok movie', 'Different but same energy'], lili: ['Jom makan! Setuju je!', 'Hehe~ 💕', 'Danial comel la', 'Teman Lili shopping?'] };
  const JOKES = ['Kenapa PC sejuk? Ada Windows! 😂', 'Bug ni feature la bro!', 'Deadline? Dead... line 😂', 'Kopi habis, motivasi pun habis', 'Ctrl+Z hidup aku boleh?'];
  const LAUGHS = ['HAHAHA!', 'Hahaha kelakar!', 'LOL 😂', 'Wkwkwk', 'Hahah adoi'];

  function pickLine(s, ctx) {
    const L = s.look.mascot.lines || {};
    return pickFrom(L[ctx]) || pickFrom(L.chat) || null;
  }

  function say(s, text, secs = 3.5) {
    if (!text) return;
    s.chat = { text, until: now() + secs };
  }

  function feel(s, mood, secs) { s.social = { mood, until: now() + secs }; }

  function stressed(s, t) {
    const st = s.data.status;
    if (WORK.has(st) && s.atTarget && loadOf(s, t) >= STRESS_AT) return true;
    return st === 'waiting' && s.waitingSince && t - s.waitingSince > 12;
  }

  // Current emotion: event reaction > social moment > stress > work > where they hang out.
  function moodFor(s, t) {
    if (s.emote && t < s.emote.until) return s.emote.mood;
    if (s.social && t < s.social.until) return s.social.mood;
    if (s.task) return s.task.type === 'comfort' ? 'happy' : 'focused';
    const st = s.data.status;
    if (stressed(s, t)) {
      const crit = loadOf(s, t) >= FIRE_AT - 2;
      return crit || Math.floor(t / 3) % 2 ? 'stressed' : s.look.mascot.stressMood || 'embarrassed';
    }
    if (WORK.has(st) && s.atTarget && isNight() && (t + s.blinkAt * 13) % 25 < 5) return 'tired';
    if (STATUS_MOOD[st] && (s.atTarget || st === 'waiting')) return STATUS_MOOD[st];
    if (s.pose === 'walk') return 'normal';
    const spotName = s.spot ? s.spot.name : '';
    if (/^(sofa|bean)/.test(spotName)) return ((t + s.blinkAt * 7) % 30) < 12 ? 'tired' : 'happy';
    if (/^(coffee|cooler)/.test(spotName)) return 'happy';
    if (/^(studio|shoot)/.test(spotName)) return 'joyful';
    if (/^arcade/.test(spotName)) return Math.floor(t / 4) % 3 === 0 ? 'angry' : 'joyful';
    if (/^books/.test(spotName)) return 'curious';
    if (/^win/.test(spotName)) return 'thinking';
    return 'normal';
  }

  function armsFor(s, t) {
    if (s.emote && t < s.emote.until && s.emote.arms && (s.emote.sticky || t - s.emote.start < 2)) return s.emote.arms;
    if (s.task && s.task.phase === 'spraying') return 'wave';
    if (s.task && s.task.type === 'comfort' && s.atTarget) return 'wave';
    if (s.social && t < s.social.until && s.social.mood === 'laughing') return Math.floor(t * 3) % 2 ? 'cheer' : null;
    if (s.atTarget && s.data.status === 'waiting') return 'wave';
    if (s.atTarget && s.spot && /^studio/.test(s.spot.name) && Math.floor(t / 2) % 2) return 'cheer';
    return null;
  }

  // Bubble: event text > what they are saying > status label.
  function bubbleFor(s, t) {
    if (s.emote && t < s.emote.until && s.emote.text) return s.emote.text;
    if (s.chat && t < s.chat.until) return s.chat.text;
    const st = s.data.status;
    if (st === 'typing') return s.look.role.verb || 'WORKING';
    if (st === 'idle' && s.id !== selectedId && s.id !== hoverId) return null;
    return BUBBLE[st] || null;
  }
  const isChat = (s, t) => !(s.emote && t < s.emote.until && s.emote.text) && s.chat && t < s.chat.until;

  const idleHere = (s) => !s.leaving && !s.task && s.atTarget && !WORK.has(s.data.status) && !s.data.npc;
  const near = (a, b, d) => Math.hypot(a.x - b.x, a.y - b.y) < d;
  let nextJoke = 0, nextComfort = 0, nextPairChat = 0;

  function updateSocial(t) {
    const all = [...sims.values()];
    for (const s of all) {
      if (s.data.status === 'waiting') s.waitingSince = s.waitingSince || t; else s.waitingSince = 0;
      if (s.nextChat == null) s.nextChat = t + rand(3, 15);
      if (t < s.nextChat || (s.chat && t < s.chat.until) || s.leaving) continue;
      let ctx = WORK.has(s.data.status) ? 'work' : 'idle';
      if (stressed(s, t)) ctx = 'stress';
      if (s.task) ctx = s.task.type === 'comfort' ? 'comfort' : 'help';
      if (WORK.has(s.data.status) && isNight() && Math.random() < 0.3) { say(s, pickFrom(['Ngantuk gila...', 'Kopi lagi satu...', '*menguap*'])); feel(s, 'tired', 4); }
      else say(s, pickLine(s, ctx));
      s.nextChat = t + (ctx === 'stress' ? rand(6, 11) : rand(16, 38));
    }

    // couple: Danial & Lili share the sofa and get all heart-eyed
    const blu = all.find((o) => o.look.mascot.id === 'blu'), lili = all.find((o) => o.look.mascot.id === 'lili');
    if (blu && lili && !WORK.has(blu.data.status) && !WORK.has(lili.data.status) && !blu.leaving && !lili.leaving) {
      blu.date = 'sofa20'; lili.date = 'sofa21';
      if (idleHere(blu) && idleHere(lili) && near(blu, lili, 24)) {
        for (const o of [blu, lili]) if (!o.social || t > o.social.until) feel(o, 'love', 6);
        if (t > (blu.nextLove || 0)) {
          blu.nextLove = t + rand(12, 20);
          say(blu, pickFrom(LOVE.blu), 3);
          setTimeout(() => say(lili, pickFrom(LOVE.lili), 3), 1600);
        }
      }
    } else { if (blu) blu.date = null; if (lili) lili.date = null; }

    // Amir (the joker) cracks a joke; whoever is close by bursts out laughing
    const orange = all.find((o) => o.look.mascot.id === 'orange');
    if (orange && idleHere(orange) && t > nextJoke) {
      const crowd = all.filter((o) => o !== orange && idleHere(o) && near(o, orange, 64));
      if (crowd.length) {
        nextJoke = t + rand(22, 35);
        say(orange, pickFrom(JOKES), 3.5); feel(orange, 'laughing', 4);
        setTimeout(() => crowd.forEach((o) => { feel(o, 'laughing', 3.5); say(o, pickFrom(LAUGHS), 2.5); }), 1800);
      }
    }

    // two idle colleagues next to each other have a little chat
    if (t > nextPairChat) {
      nextPairChat = t + rand(8, 14);
      const idle = all.filter(idleHere);
      for (const a of idle) {
        const b = idle.find((o) => o !== a && near(o, a, 40) && !(o.chat && t < o.chat.until));
        if (b && !(a.chat && t < a.chat.until)) {
          say(a, pickLine(a, 'chat'), 3); feel(a, 'happy', 3);
          setTimeout(() => { say(b, pickLine(b, 'chat'), 3); feel(b, Math.random() < 0.3 ? 'laughing' : 'happy', 3); }, 1700);
          break;
        }
      }
    }

    // the caring ones (Nadia, Aina, Lili, Haziq) walk over to whoever is stressed
    if (t > nextComfort) {
      const victim = all.find((o) => stressed(o, t) && o.desk && !o.desk.fire && (!o.comfortedAt || t - o.comfortedAt > 60));
      if (victim) {
        const carers = ['lilac', 'white', 'lili', 'green'];
        const helper = carers.map((id) => all.find((o) => o.look.mascot.id === id && o !== victim && !o.leaving && !o.task && !WORK.has(o.data.status))).find(Boolean);
        if (helper) {
          nextComfort = t + 20;
          victim.comfortedAt = t;
          helper.task = { type: 'comfort', desk: victim.desk, phase: 'going', victim: victim.id };
          say(helper, `Jap, ${victim.look.name} macam stress...`, 3);
          onEvent({ kind: 'comfort', agentId: helper.id, text: `${helper.look.name} pergi pujuk ${victim.look.name} 💜` });
        }
      }
    }
    for (const h of all) {
      const k = h.task;
      if (!k || k.type !== 'comfort') continue;
      const victim = sims.get(k.victim);
      if (!victim) { h.task = null; continue; }
      if (k.phase === 'going' && h.atTarget) {
        k.phase = 'talking'; k.at = t;
        say(h, pickLine(h, 'comfort') || 'Okay tak? Rehat jap 💜', 3.5);
        setTimeout(() => { say(victim, pickLine(victim, 'thanks') || 'Terima kasih 🥹', 3); emote(victim.id, 'comforted'); if (victim.tools) victim.tools.splice(0, Math.ceil(victim.tools.length / 2)); }, 1800);
      } else if (k.phase === 'talking' && t - k.at > 4.5) {
        h.task = null; feel(h, 'happy', 3);
      }
    }
  }

  function remove(id) {
    const s = sims.get(id);
    if (s) s.leaving = true;
  }

  function freeDesk(s) {
    if (s.desk) { s.desk.owner = null; s.desk = null; }
  }

  function targetFor(s) {
    if (s.task && !s.leaving) {
      const d = s.task.desk;
      if (s.task.type === 'comfort') return { key: `comfort:${d.tx},${d.ty}`, tile: { tx: d.tx + 1, ty: d.ty + 1 }, x: d.tx * T + 24, y: (d.ty + 1) * T + 10, pose: 'stand', dir: 'up' };
      return { key: `task:${d.tx},${d.ty}`, tile: { tx: d.tx, ty: d.ty + 1 }, x: d.tx * T + 10, y: (d.ty + 1) * T + 10, pose: 'stand', dir: 'up' };
    }
    if (s.leaving) {
      freeDesk(s);
      return { key: 'door', tile: DOOR, x: -12, y: DOOR.ty * T + 12, pose: 'stand', dir: 'left' };
    }
    if (WORK.has(s.data.status)) {
      if (!s.desk) {
        // children prefer a desk close to their parent
        const parent = s.data.parentId && sims.get(s.data.parentId);
        const pd = parent && parent.desk;
        const own = desks.find((d) => !d.owner && d.role === s.look.role);
        const free = desks.filter((d) => !d.owner)
          .sort((a, b) => pd ? (Math.abs(a.tx - pd.tx) + Math.abs(a.ty - pd.ty) * 2) - (Math.abs(b.tx - pd.tx) + Math.abs(b.ty - pd.ty) * 2) : 0);
        let d = own || free[0];
        if (!d) { // borrow a desk from someone on a break
          d = desks.find((k) => { const o = sims.get(k.owner); return o && !WORK.has(o.data.status); });
          if (d) sims.get(d.owner).desk = null;
        }
        if (d) { d.owner = s.id; s.desk = d; }
      }
      if (s.desk) {
        s.spot = null;
        return { key: `desk:${s.desk.tx},${s.desk.ty}`, tile: s.desk.seat, x: s.desk.x, y: s.desk.y, pose: 'sitDesk', dir: 'down' };
      }
    }
    const now = performance.now() / 1000;
    const date = s.date && SPOTS.find((p) => p.name === s.date);
    if (date && (!s.spot || s.spot !== date) && ![...sims.values()].some((o) => o !== s && o.spot === date)) { s.spot = date; s.nextWander = now + 60; }
    if (!s.spot || now > s.nextWander) {
      const taken = new Set([...sims.values()].filter((o) => o !== s && o.spot).map((o) => o.spot.name));
      const options = SPOTS.filter((p) => !taken.has(p.name) && (!s.spot || p.name !== s.spot.name));
      // personality: most of the time they go where they like to hang out
      const likes = (s.look.mascot.likes || []);
      const fav = options.filter((p) => likes.some((l) => p.name.startsWith(l)));
      const pool = fav.length && Math.random() < 0.75 ? fav : options;
      if (pool.length) s.spot = pool[Math.floor(Math.random() * pool.length)];
      s.nextWander = now + 25 + Math.random() * 35;
    }
    if (!s.spot) return { key: 'stand', tile: { tx: 8, ty: 6 }, x: 8 * T + 8, y: 6 * T + 12, pose: 'stand', dir: 'down' };
    return { key: `spot:${s.spot.name}`, tile: s.spot.tile, x: s.spot.x, y: s.spot.y, pose: s.spot.pose, dir: s.spot.dir };
  }

  function step(s, dt) {
    const tg = targetFor(s);
    if (tg.key !== s.targetKey) {
      s.targetKey = tg.key;
      s.atTarget = false;
      const from = {
        tx: Math.max(0, Math.min(COLS - 1, Math.floor(s.x / T))),
        ty: Math.max(0, Math.min(ROWS - 1, Math.floor((s.y - 1) / T))),
      };
      const tiles = findPath(from, tg.tile) || [tg.tile];
      s.path = tiles.map((c) => tileFeet(c.tx, c.ty));
      s.path.push({ x: tg.x, y: tg.y });
      s.final = tg;
    }
    if (s.path.length) {
      const p = s.path[0];
      const dx = p.x - s.x, dy = p.y - s.y;
      const d = Math.hypot(dx, dy);
      const mv = SPEED * dt;
      if (d <= mv) { s.x = p.x; s.y = p.y; s.path.shift(); s.dist += d; }
      else { s.x += (dx / d) * mv; s.y += (dy / d) * mv; s.dist += mv; }
      if (d > 0.5) s.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      s.pose = 'walk';
      s.frame = Math.floor(s.dist / 4) % 4;
      if (!s.path.length) {
        s.atTarget = true;
        s.pose = s.final.pose;
        s.dir = s.final.dir;
        if (s.leaving) { freeDesk(s); sims.delete(s.id); if (selectedId === s.id) select(null); }
      }
    }
  }

  // ---- render -------------------------------------------------------------------
  // The office is drawn as a vector illustration (scene.js) and the crew as
  // cartoon characters (toon.js), on one canvas transformed by the camera.
  let canvas, out, scale = 2, last = performance.now();
  let active2D = true;
  const BG_RES = 4; // cached background pixels per world unit
  let bg = null;
  function background() {
    if (bg) return bg;
    bg = document.createElement('canvas');
    bg.width = W * BG_RES; bg.height = H * BG_RES;
    const c = bg.getContext('2d');
    c.scale(BG_RES, BG_RES);
    PO.scene.paintBackground(c, W, H, desks, DOOR);
    return bg;
  }
  function fireOffset(d) { return PO.scene.fireOffset(d); }

  function frame(nowMs) {
    const dt = Math.min(0.1, (nowMs - last) / 1000);
    last = nowMs;
    const t = nowMs / 1000;
    for (const s of [...sims.values()]) step(s, dt);
    updateFires(t);
    updateSocial(t);
    workParticles(t);
    updateParticles(dt);
    if (active2D) draw(t);
    requestAnimationFrame(frame);
  }

  // smooth blink: 0 open .. 1 closed
  function blinkOf(s, t) {
    const k = (t + s.blinkAt) % 4.2;
    return k < 0.22 ? Math.sin((k / 0.22) * Math.PI) : 0;
  }

  function drawScene(g, t) {
    const SC = PO.scene;
    const now = new Date();
    g.drawImage(background(), 0, 0, W, H);
    SC.drawWindow(g, 4 * T, t, now);
    SC.drawWindow(g, 12 * T, t, now);
    SC.drawWhiteboard(g, 7 * T, sims, tasksDone, WORK);
    SC.drawNeon(g, 20 * T + 4, t);
    SC.drawClock(g, 104, 14, now);
    const flash = SC.drawBrandSign(g, 14 * T + 2, t, logoReady ? logoImg : null);

    const at = (name) => [...sims.values()].some((s) => s.atTarget && s.spot && s.spot.name.startsWith(name) && !WORK.has(s.data.status));
    const I = PO.world.internals;
    const items = [];
    for (const d of desks) {
      const owner = d.owner && sims.get(d.owner);
      items.push({ y: d.ty * T + 15, draw: () => SC.drawDesk(g, d, t, owner, I) });
      items.push({ y: d.ty * T + 7, draw: () => SC.drawChair(g, d) });
    }
    plants.forEach(([x, y], i) => items.push({ y: y * T + 15, draw: () => SC.drawPlant(g, x, y, i % 4) }));
    items.push({ y: 5 * T + 15, draw: () => SC.drawBackdrop(g) });
    [18, 23].forEach((x) => items.push({ y: 6 * T + 15, draw: () => SC.drawSoftbox(g, x, at('studio')) }));
    items.push({ y: 7 * T + 15, draw: () => SC.drawTripod(g, t, at('studio')) });
    BEANBAGS.forEach(([x, y, c]) => items.push({ y: y * T + 6, draw: () => SC.drawBeanbag(g, x, y, c) }));
    items.push({ y: 2 * T + 15, draw: () => SC.drawBookshelf(g) });
    items.push({ y: 2 * T + 15, draw: () => SC.drawCoffeeBar(g, t, at('coffee')) });
    items.push({ y: 2 * T + 15, draw: () => SC.drawCooler(g) });
    items.push({ y: 5 * T + 15, draw: () => SC.drawArcade(g, t, at('arcade')) });
    items.push({ y: 9 * T + 6, draw: () => SC.drawSofa(g) });
    items.push({ y: 11 * T + 14, draw: () => SC.drawTable(g) });
    items.push({ y: 9 * T + 15, draw: () => SC.drawSigns(g) });
    items.push({ y: 14 * T + 15, draw: () => SC.drawTeamBoard(g) });

    for (const s of sims.values()) {
      items.push({ y: s.y, draw: () => {
        if ((s.id === selectedId || s.id === hoverId) && s.pose !== 'sitDesk') {
          PO.toon.ell(g, s.x, s.y + 0.2, 9, 2.6, null, s.id === selectedId ? '#f5b83d' : 'rgba(255,255,255,0.6)', 0.8);
        }
        const typing = s.pose === 'sitDesk' && s.atTarget && ['typing', 'running', 'planning'].includes(s.data.status);
        PO.toon.draw(g, s.x, s.y, s.look, {
          dir: s.dir, pose: s.pose, phase: s.dist * 0.32, t, seed: s.blinkAt, blink: blinkOf(s, t),
          mood: moodFor(s, t), arms: armsFor(s, t), typing,
        });
        if (s.task && s.task.type !== 'comfort') { // fire extinguisher
          const ex = s.x + (s.dir === 'left' ? -9 : 7), ey = s.y - 12;
          PO.toon.rr(g, ex - 1.8, ey, 3.6, 8.4, 1.6, '#e5484d', '#16171d', 0.5);
          PO.toon.rr(g, ex - 1, ey - 2, 2, 2.2, 0.5, '#1d1d24');
          PO.toon.line(g, [ex + 0.6, ey - 1.6, ex + 3, ey - 3.4], '#1d1d24', 0.6);
        }
      } });
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    drawParticles(g);
    if (flash) { g.fillStyle = 'rgba(255,250,230,0.08)'; g.fillRect(0, 0, W, H); }
    const hr = now.getHours();
    if (hr < 6 || hr >= 20) { g.fillStyle = 'rgba(18,22,60,0.2)'; g.fillRect(0, 0, W, H); }
  }

  function draw(t) {
    const f = cam.follow && sims.get(cam.follow);
    if (f) { cam.cx += (f.x - cam.cx) * 0.08; cam.cy += (f.y - 16 - cam.cy) * 0.08; }
    clampCam();
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.fillStyle = '#0f111a'; out.fillRect(0, 0, canvas.width, canvas.height);
    const [tx, ty] = camOffset();
    out.setTransform(scale * cam.z, 0, 0, scale * cam.z, tx, ty);
    out.imageSmoothingEnabled = true;
    drawScene(out, t);
    out.setTransform(cam.z, 0, 0, cam.z, tx, ty);
    drawOverlay(t);
    out.setTransform(1, 0, 0, 1, 0, 0);
  }

  function drawOverlay(t) {
    const S = scale;
    drawWallText(out, S);
    out.textBaseline = 'middle';
    out.textAlign = 'center';
    drawLinks(t);
    const ordered = [...sims.values()].sort((a, b) => (a.id === selectedId) - (b.id === selectedId) || a.y - b.y);
    for (const s of ordered) {
      const cx = s.x * S;
      const sitting = s.pose === 'sitDesk' || s.pose === 'sitFront';
      const headTop = (s.y - PO.toon.HEIGHT + (sitting ? 3 : 0)) * S;
      const text = bubbleFor(s, t);
      if (text && !(s.data.status === 'waiting' && !s.emote && Math.floor(t * 2.5) % 2 === 1)) {
        const by = headTop - S * 3 + Math.sin(t * 3 + s.blinkAt) * S * 0.6;
        if (isChat(s, t)) drawChatBubble(cx, by, text, s); else drawBubble(cx, by, text, s);
      }
      // name tag + job title
      const nfs = Math.max(10, Math.round(S * 3.4));
      const rfs = Math.max(9, Math.round(S * 2.9));
      const name = s.look.name;
      const role = s.look.role;
      const tagY = (s.pose === 'sitDesk' && s.atTarget ? s.y + 11 : s.y + 4) * S;
      out.font = `800 ${nfs}px "Nunito", system-ui, sans-serif`;
      const nw = out.measureText(name).width;
      out.font = `700 ${rfs}px "Nunito", system-ui, sans-serif`;
      const rw = out.measureText(role.short).width;
      const tw = Math.max(nw, rw) + nfs * 0.8;
      const th = nfs * 1.3 + rfs * 0.95;
      out.fillStyle = 'rgba(15,17,26,0.82)';
      out.fillRect(cx - tw / 2, tagY - nfs * 0.75, tw, th);
      out.fillStyle = role.color;
      out.fillRect(cx - tw / 2, tagY - nfs * 0.75, tw, Math.max(1, S * 0.5));
      out.fillText(role.short, cx, tagY + nfs * 0.55 + rfs * 0.45);
      out.font = `800 ${nfs}px "Nunito", system-ui, sans-serif`;
      out.fillStyle = s.id === selectedId ? '#ffe08a' : '#ffffff';
      out.fillText(name, cx, tagY);
    }
    // tooltip for hovered/selected agent
    const s = sims.get(hoverId) || sims.get(selectedId);
    if (s) {
      const lines = [`${s.look.name} · ${s.look.role.label} (${s.look.role.ms}) — ${s.data.project}`, `${(s.data.status || '').toUpperCase()}: ${s.data.detail || ''}`];
      const tfs = Math.max(11, Math.round(S * 3.4));
      out.font = `600 ${tfs}px "Nunito", system-ui, sans-serif`;
      out.textAlign = 'left';
      const tw = Math.min(W * S * 0.6, Math.max(...lines.map((l) => out.measureText(l).width)) + tfs);
      let x = s.x * S + 14 * S, y = (s.y - 30) * S;
      if (x + tw > W * S - 4) x = s.x * S - 14 * S - tw;
      y = Math.max(4, Math.min(H * S - tfs * 2.6 - 4, y));
      out.fillStyle = 'rgba(15,17,26,0.92)';
      out.fillRect(x, y, tw, tfs * 2.6);
      out.fillStyle = s.look.skin; out.fillRect(x, y, S, tfs * 2.6);
      out.fillStyle = '#ffffff'; out.fillText(clip(lines[0], tw - tfs), x + tfs / 2, y + tfs * 0.75);
      out.fillStyle = '#c9d1d9'; out.fillText(clip(lines[1], tw - tfs), x + tfs / 2, y + tfs * 1.85);
    }
  }

  // White pixel speech bubble with a tail, anchored at (cx, bottom).
  function drawBubble(cx, bottom, text, s) {
    const S = scale;
    const fs = Math.max(10, Math.round(S * 3.2));
    out.font = `800 ${fs}px "Nunito", system-ui, sans-serif`;
    const warn = text === 'NEED YOU!' || text === 'OOPS!';
    const w = out.measureText(text).width + fs * 1.2, h = fs * 2;
    const x = Math.round(cx - w / 2), y = Math.round(bottom - h - S * 2);
    const b = Math.max(1, Math.round(S * 0.6));
    out.fillStyle = '#1d1d24';
    out.fillRect(x - b, y - b, w + b * 2, h + b * 2);
    out.fillRect(cx - S * 1.5 - b, y + h, S * 3 + b * 2, S + b);
    out.fillRect(cx - S * 0.5 - b, y + h + S, S + b * 2, S + b);
    out.fillStyle = warn ? '#f5b83d' : '#ffffff';
    out.fillRect(x, y, w, h);
    out.fillRect(cx - S * 1.5, y + h, S * 3, S);
    out.fillRect(cx - S * 0.5, y + h + S, S, S);
    out.fillStyle = text === 'OOPS!' ? '#b42318' : text === 'DONE!' ? '#1f7a45' : '#1d1d24';
    out.fillText(text, cx, y + h / 2 + 1);
  }

  // Rounded speech bubble for what an agent says (wraps to two lines).
  function drawChatBubble(cx, bottom, text, s) {
    const S = scale;
    const fs = Math.max(11, Math.round(S * 3.4));
    out.font = `800 ${fs}px "Nunito", system-ui, sans-serif`;
    const maxW = S * 70;
    const words = text.split(' ');
    const lines = [''];
    for (const w of words) {
      const test = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${w}` : w;
      if (out.measureText(test).width > maxW && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = test;
    }
    const shown = lines.slice(0, 2);
    const w = Math.max(...shown.map((l) => out.measureText(l).width)) + fs * 0.9;
    const h = shown.length * fs * 0.9 + fs * 0.5;
    const x = Math.round(Math.min(Math.max(cx - w / 2, 2), W * S - w - 2)), y = Math.round(bottom - h - S * 2);
    const b = Math.max(1, Math.round(S * 0.6)), rad = S * 2;
    out.save();
    out.fillStyle = s.look.skin;
    out.beginPath(); out.roundRect ? out.roundRect(x - b, y - b, w + b * 2, h + b * 2, rad + b) : out.rect(x - b, y - b, w + b * 2, h + b * 2); out.fill();
    out.fillRect(cx - S * 1.5 - b, y + h, S * 3 + b * 2, S + b);
    out.fillStyle = '#ffffff';
    out.beginPath(); out.roundRect ? out.roundRect(x, y, w, h, rad) : out.rect(x, y, w, h); out.fill();
    out.fillRect(cx - S * 1.5, y + h - 1, S * 3, S);
    out.fillStyle = '#1d1d24';
    shown.forEach((l, i) => out.fillText(l, x + w / 2, y + fs * 0.25 + fs * 0.45 + i * fs * 0.9));
    out.restore();
  }

  // Animated "ASSIGN TASK" arrows from a lead agent to its sub-agents.
  function drawLinks(t) {
    const S = scale;
    for (const c of sims.values()) {
      const p = c.data.parentId && sims.get(c.data.parentId);
      if (!p || p.leaving) continue;
      const back = c.data.status === 'done';
      const [a, b] = back ? [c, p] : [p, c];
      const ax = a.x * S, ay = (a.y - 10) * S, bx = b.x * S, by = (b.y - 10) * S;
      const len = Math.hypot(bx - ax, by - ay);
      if (len < S * 20) continue;
      const ux = (bx - ax) / len, uy = (by - ay) / len;
      const sx = ax + ux * S * 10, sy = ay + uy * S * 10, ex = bx - ux * S * 12, ey = by - uy * S * 12;
      const col = back ? '#3fb950' : '#4fd1ff';
      out.save();
      out.strokeStyle = 'rgba(15,17,26,0.6)'; out.lineWidth = S * 1.6;
      out.beginPath(); out.moveTo(sx, sy); out.lineTo(ex, ey); out.stroke();
      out.strokeStyle = col; out.lineWidth = S * 0.8;
      out.setLineDash([S * 3, S * 2]); out.lineDashOffset = -t * S * 12;
      out.beginPath(); out.moveTo(sx, sy); out.lineTo(ex, ey); out.stroke();
      out.setLineDash([]);
      out.fillStyle = col;
      out.beginPath();
      out.moveTo(ex + ux * S * 4, ey + uy * S * 4);
      out.lineTo(ex - uy * S * 3, ey + ux * S * 3);
      out.lineTo(ex + uy * S * 3, ey - ux * S * 3);
      out.fill();
      const label = back ? 'REPORT' : 'ASSIGN TASK';
      const fs = Math.max(9, Math.round(S * 2.6));
      out.font = `800 ${fs}px "Nunito", system-ui, sans-serif`;
      const mx = (sx + ex) / 2, my = (sy + ey) / 2;
      const w = out.measureText(label).width + fs;
      out.fillStyle = 'rgba(15,17,26,0.85)'; out.fillRect(mx - w / 2, my - fs, w, fs * 2);
      out.fillStyle = col; out.fillText(label, mx, my + 1);
      out.restore();
    }
  }

  function clip(text, maxW) {
    if (out.measureText(text).width <= maxW) return text;
    while (text.length > 3 && out.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  }

  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pad = 32;
    const bw = box.width - pad, bh = box.height > pad * 2 ? box.height - pad : bw * H / W;
    const fit = Math.min((bw * dpr) / W, (bh * dpr) / H);
    scale = Math.max(1, Math.floor(fit * 2) / 2);
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    canvas.style.width = `${canvas.width / dpr}px`;
    canvas.style.height = `${canvas.height / dpr}px`;
  }

  // ---- 2D camera ----------------------------------------------------------------
  const cam = { z: 1, cx: W / 2, cy: H / 2, follow: null };
  function camOffset() {
    return [canvas.width / 2 - cam.cx * scale * cam.z, canvas.height / 2 - cam.cy * scale * cam.z];
  }
  function clampCam() {
    cam.z = Math.max(1, Math.min(4, cam.z));
    const hw = W / 2 / cam.z, hh = H / 2 / cam.z;
    cam.cx = Math.max(hw, Math.min(W - hw, cam.cx));
    cam.cy = Math.max(hh, Math.min(H - hh, cam.cy));
  }
  function toWorld(ev) {
    const rect = canvas.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((ev.clientY - rect.top) / rect.height) * canvas.height;
    const [tx, ty] = camOffset();
    return [(px - tx) / cam.z / scale, (py - ty) / cam.z / scale];
  }
  function zoomBy(k, at) {
    const [wx, wy] = at || [cam.cx, cam.cy];
    const z0 = cam.z;
    cam.z = Math.max(1, Math.min(4, cam.z * k));
    cam.cx = wx - (wx - cam.cx) * (z0 / cam.z);
    cam.cy = wy - (wy - cam.cy) * (z0 / cam.z);
    if (cam.z === 1) cam.follow = null;
  }
  function focus(id) {
    const s = sims.get(id);
    if (!s) return;
    cam.follow = id; cam.z = Math.max(cam.z, 2.4);
  }
  function fit() { cam.z = 1; cam.cx = W / 2; cam.cy = H / 2; cam.follow = null; }

  function pick(ev) {
    const [x, y] = toWorld(ev);
    let best = null;
    for (const s of sims.values()) {
      const top = s.y - 32, bottom = s.y + 1;
      if (x >= s.x - 9 && x <= s.x + 9 && y >= top && y <= bottom && (!best || s.y > best.y)) best = s;
    }
    return best;
  }

  function select(id) {
    selectedId = id;
    onSelect(id);
  }

  function init(el, cb) {
    canvas = el;
    out = canvas.getContext('2d');
    onSelect = cb || onSelect;
    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, cx: cam.cx, cy: cam.cy, moved: false }; });
    window.addEventListener('pointerup', () => { setTimeout(() => { drag = null; }, 0); });
    canvas.addEventListener('pointermove', (e) => {
      if (drag && (e.buttons & 1)) {
        const rect = canvas.getBoundingClientRect();
        const dx = (e.clientX - drag.x) / rect.width * W / cam.z, dy = (e.clientY - drag.y) / rect.height * H / cam.z;
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) { drag.moved = true; cam.follow = null; }
        if (drag.moved) { cam.cx = drag.cx - dx; cam.cy = drag.cy - dy; canvas.style.cursor = 'grabbing'; return; }
      }
      const s = pick(e);
      hoverId = s ? s.id : null;
      canvas.style.cursor = s ? 'pointer' : cam.z > 1 ? 'grab' : 'default';
    });
    canvas.addEventListener('mouseleave', () => { hoverId = null; });
    canvas.addEventListener('click', (e) => { if (drag && drag.moved) return; const s = pick(e); select(s ? s.id : null); });
    canvas.addEventListener('dblclick', (e) => { const s = pick(e); if (s) focus(s.id); else fit(); });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, toWorld(e)); }, { passive: false });
    requestAnimationFrame(frame);
  }

  function reset() {
    sims.clear();
    desks.forEach((d) => { d.owner = null; });
  }

  PO.world = {
    init, upsert, remove, reset, select, setLogo, emote, noteTool, zoomBy, focus, fit,
    onEvent: (cb) => { onEvent = cb; },
    set2D(on) { active2D = on; },
    // shared with the 3D view (world3d.js)
    internals: {
      T, COLS, ROWS, W, H, WORK, desks, sims, plants, BEANBAGS, DOOR, logoImg, BG_RES,
      get bg() { return background(); },
      get tasksDone() { return tasksDone; },
      get logoReady() { return logoReady; },
      get hoverId() { return hoverId; },
      drawScreen, deskStatus, drawWallText, isChat,
      moodFor, armsFor, bubbleFor,
    },
    look: (id) => (sims.get(id) ? sims.get(id).look : lookFor(id)),
    get selected() { return selectedId; },
  };
})(window.PO = window.PO || {});
