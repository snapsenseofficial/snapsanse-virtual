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
    thinking: 'thinking', delegating: 'excited', waiting: 'worried', done: 'happy',
  };
  // One-off reactions to events (from the activity log).
  const EMOTES = {
    hire: { mood: 'excited', text: 'NEW HIRE!', ms: 5000, arms: 'wave' },
    prompt: { mood: 'excited', text: 'GOT IT!', ms: 2500 },
    done: { mood: 'happy', text: 'DONE!', ms: 4000, arms: 'cheer' },
    error: { mood: 'frustrated', text: 'OOPS!', ms: 4000 },
    fire: { mood: 'surprised', text: 'FIRE!!', ms: 60000, arms: 'wave', sticky: true },
    thanks: { mood: 'happy', text: 'THANKS!', ms: 3500, arms: 'cheer' },
    allclear: { mood: 'happy', text: 'ALL CLEAR!', ms: 3000, arms: 'cheer' },
    onmyway: { mood: 'focused', text: 'ON MY WAY!', ms: 3000 },
  };
  // Workload: this many tool calls inside LOAD_WINDOW seconds sets the desk on fire.
  const LOAD_WINDOW = 20, STRESS_AT = 8, FIRE_AT = 13, FIRE_COOLDOWN = 180;
  const FIRE_ROLE = { id: 'fire-marshal', verb: 'ON DUTY', label: 'Fire Marshal', short: 'Fire Marshal', ms: 'Bomba', color: '#e5484d', accessory: 'helmet' };
  const { drawCharacter, shade, NAMES } = PO.sprites;

  // Stable look per agent id, with a unique first name among everyone seen.
  const looks = new Map();
  function lookFor(id) {
    let look = looks.get(id);
    if (look) return look;
    look = PO.sprites.lookFor(id);
    const live = new Set([...sims.values()].map((s) => s.look.name));
    const start = NAMES.indexOf(look.name);
    for (let i = 1; live.has(look.name) && i < NAMES.length; i++) look.name = NAMES[(start + i) % NAMES.length];
    looks.set(id, look);
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
  const BEANBAGS = [[19, 12, '#f5b83d'], [22, 12, '#12a594']];
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

  // ---- static background --------------------------------------------------------
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  (function paintBackground() {
    const g = bg.getContext('2d');
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    // wooden floor
    for (let ty = 2; ty < ROWS - 1; ty++) {
      for (let tx = 1; tx < COLS - 1; tx++) {
        const X = tx * T, Y = ty * T;
        for (let p = 0; p < 2; p++) {
          const c = ((tx + ty * 3 + p) % 3 === 0) ? '#c49a72' : ((tx + p) % 2 ? '#cba37c' : '#c79f78');
          r(X, Y + p * 8, T, 8, c);
          r(X, Y + p * 8 + 7, T, 1, '#ab8059');
          const seam = (tx * 5 + ty * 3 + p * 7) % 16;
          r(X + seam, Y + p * 8, 1, 7, '#b48a63');
        }
      }
    }
    // role-coloured mats under every desk chair
    for (const d of desks) {
      const mx = d.x - 10, my = (d.ty - 1) * T + 2;
      g.globalAlpha = 0.5;
      r(mx, my, 20, 13, shade(d.role.color, -0.2));
      r(mx + 1, my + 1, 18, 11, d.role.color);
      g.globalAlpha = 1;
    }
    // lounge rug
    r(18 * T + 4, 8 * T + 2, 6 * T - 8, 6 * T - 6, '#3d5674');
    r(18 * T + 6, 8 * T + 4, 6 * T - 12, 6 * T - 10, '#4f6d8f');
    for (let y = 8 * T + 8; y < 14 * T - 6; y += 6) for (let x = 18 * T + 10; x < 24 * T - 8; x += 6) r(x, y, 2, 2, '#5d7ea3');
    // SnapSense camera emblem woven into the rug
    {
      const ex = 21 * T - 2, ey = 13 * T - 6;
      r(ex + 2, ey, 4, 1, '#f5b83d'); r(ex, ey + 1, 14, 7, '#f5b83d');
      r(ex + 4, ey + 2, 6, 5, '#3d5674'); r(ex + 5, ey + 3, 4, 3, '#f5b83d'); r(ex + 6, ey + 4, 2, 1, '#3d5674');
      r(ex + 11, ey + 2, 2, 1, '#3d5674');
    }
    // exposed brick wall
    r(0, 0, W, 32, '#8f3f2d');
    for (let row = 0; row < 7; row++) {
      const y = 3 + row * 4;
      for (let x = -(row % 2) * 4; x < W; x += 8) {
        const k = (x * 7 + row * 13) % 5;
        r(x, y, 7, 3, ['#b5543c', '#a84a35', '#bf5f45', '#ad4f39', '#c46a4f'][k]);
      }
    }
    r(0, 0, W, 3, '#3b2c1f');
    r(0, 29, W, 3, '#3b2c1f');
    // gallery wall: framed photos between windows and whiteboard
    [[98, 6], [178, 8], [17, 7]].forEach(([fx, fy], i) => {
      r(fx, fy, 12, 14, '#1d1d24'); r(fx + 1, fy + 1, 10, 12, '#fafafa');
      const sky = ['#7cc4ea', '#f2a76b', '#3a3c6e'][i], land = ['#30a46c', '#8a4b2a', '#f5b83d'][i];
      r(fx + 2, fy + 2, 8, 6, sky); r(fx + 2, fy + 8, 8, 3, land); r(fx + 6, fy + 3, 2, 2, '#fff6c9');
    });
    // side + bottom walls
    r(0, 32, T, H - 32, '#6b5442'); r(T - 3, 32, 3, H - 32, '#57432f');
    r(W - T, 32, T, H - 32, '#6b5442'); r(W - T, 32, 3, H - 32, '#57432f');
    r(0, H - T, W, T, '#6b5442'); r(0, H - T, W, 3, '#57432f');
    // door
    r(0, DOOR.ty * T, T, T, '#cba37c');
    r(0, DOOR.ty * T - 3, T, 3, '#3b2c1f');
    r(2, DOOR.ty * T + 2, 10, 12, '#8d3b3b');
    r(3, DOOR.ty * T + 3, 8, 10, '#a64b4b');
  })();

  // ---- dynamic decor ------------------------------------------------------------
  function skyColor(h) {
    if (h < 5 || h >= 21) return ['#141a33', '#1f2850', true];
    if (h < 7) return ['#f2a76b', '#f6cfa0', false];
    if (h < 17) return ['#7cc4ea', '#b6e1f5', false];
    if (h < 19) return ['#e9895c', '#f4c08f', false];
    return ['#3a3c6e', '#6d5a8c', true];
  }

  function drawWindow(g, x, t, now) {
    const [top, bottom, night] = skyColor(now.getHours());
    g.fillStyle = '#5b4636'; g.fillRect(x, 4, 32, 21);
    g.fillStyle = top; g.fillRect(x + 2, 6, 28, 8);
    g.fillStyle = bottom; g.fillRect(x + 2, 14, 28, 9);
    if (night) {
      g.fillStyle = '#fff6c9';
      [[5, 8], [17, 10], [24, 7], [10, 16]].forEach(([sx, sy]) => g.fillRect(x + sx, sy, 1, 1));
      g.fillRect(x + 22, 15, 3, 3);
    } else {
      const cx = x + 2 + Math.floor((t * 2 + x) % 34) - 6;
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.save(); g.beginPath(); g.rect(x + 2, 6, 28, 17); g.clip();
      g.fillRect(cx, 10, 8, 2); g.fillRect(cx + 2, 9, 4, 1);
      g.restore();
    }
    g.fillStyle = '#5b4636'; g.fillRect(x + 15, 6, 2, 17); g.fillRect(x + 2, 14, 28, 1);
    g.fillStyle = '#e6d6bd'; g.fillRect(x - 1, 25, 34, 2);
  }

  // ---- SnapSense brand ---------------------------------------------------------
  // Drop a logo at public/logo.png to replace the built-in pixel sign.
  const FONT = {
    S: ['###', '#..', '###', '..#', '###'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'], P: ['##.', '#.#', '##.', '#..', '#..'],
    E: ['###', '#..', '##.', '#..', '###'],
  };
  const logoImg = new Image();
  let logoReady = false;
  logoImg.onload = () => { logoReady = logoImg.naturalWidth > 0; };
  function setLogo(url) { if (url && logoImg.src !== url) logoImg.src = url; }

  function pixelText(g, text, x, y, color) {
    g.fillStyle = color;
    for (const ch of text) {
      (FONT[ch] || []).forEach((row, j) => {
        for (let i = 0; i < row.length; i++) if (row[i] === '#') g.fillRect(x + i, y + j, 1, 1);
      });
      x += (FONT[ch] ? FONT[ch][0].length : 3) + 1;
    }
    return x;
  }

  function drawCamera(g, x, y, flash) {
    g.fillStyle = '#e6e8ef'; g.fillRect(x + 2, y, 3, 1); g.fillRect(x, y + 1, 11, 6);
    g.fillStyle = '#9aa4b2'; g.fillRect(x, y + 6, 11, 1);
    g.fillStyle = '#2a2d35'; g.fillRect(x + 3, y + 2, 5, 4); g.fillRect(x + 4, y + 1, 3, 6);
    g.fillStyle = '#79c0ff'; g.fillRect(x + 4, y + 3, 3, 2);
    g.fillStyle = '#ffffff'; g.fillRect(x + 4, y + 3, 1, 1);
    g.fillStyle = flash ? '#fff6c9' : '#f5b83d'; g.fillRect(x + 9, y + 2, 1, 1);
  }

  // Backlit wall sign; the camera flash fires every few seconds.
  let signRect = null;
  function drawBrandSign(g, x, t) {
    const w = 58, y = 4, h = 19;
    const flash = (t % 7) < 0.12;
    g.fillStyle = '#3b2c1f'; g.fillRect(x, y, w, h);
    g.fillStyle = '#1d2131'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = 'rgba(245,184,61,0.25)'; g.fillRect(x - 1, y + h, w + 2, 1);
    if (logoReady) {
      // the logo itself is drawn crisp at screen resolution in drawOverlay
      signRect = { x: x + 3, y: y + 3, w: w - 6, h: h - 6 };
      g.fillStyle = '#f5b83d'; g.fillRect(x + 3, y + h - 4, w - 6, 1);
      return false;
    }
    signRect = null;
    drawCamera(g, x + 4, y + 6, flash);
    const tx = pixelText(g, 'SNAP', x + 18, y + 7, '#f5b83d');
    pixelText(g, 'SENSE', tx, y + 7, '#e6e8ef');
    g.fillStyle = '#f5b83d'; g.fillRect(x + 18, y + 14, 37, 1);
    return flash;
  }

  function drawClock(g, cx, cy, now) {
    g.fillStyle = '#3b2c1f'; g.fillRect(cx - 6, cy - 5, 12, 10); g.fillRect(cx - 5, cy - 6, 10, 12);
    g.fillStyle = '#fbf7ee'; g.fillRect(cx - 5, cy - 4, 10, 8); g.fillRect(cx - 4, cy - 5, 8, 10);
    const hand = (ang, len, c) => {
      g.fillStyle = c;
      for (let i = 0; i <= len; i++) g.fillRect(Math.round(cx + Math.sin(ang) * i) - (i ? 0 : 0), Math.round(cy - Math.cos(ang) * i), 1, 1);
    };
    const h = now.getHours() % 12, m = now.getMinutes();
    hand(((h + m / 60) / 12) * Math.PI * 2, 2.5, '#222');
    hand((m / 60) * Math.PI * 2, 4, '#444');
    g.fillStyle = '#e5484d'; g.fillRect(cx, cy, 1, 1);
  }

  // Kanban board: sticky notes per agent, by status column
  function drawWhiteboard(g, x, sims) {
    g.fillStyle = '#8a8f98'; g.fillRect(x, 3, 64, 23);
    g.fillStyle = '#fbfbf8'; g.fillRect(x + 1, 4, 62, 20);
    g.fillStyle = '#b9bec7'; g.fillRect(x + 4, 26, 56, 2);
    const cols = [['#30a46c', (s) => WORK.has(s) && s !== 'waiting'], ['#f5b83d', (s) => s === 'waiting'], ['#9aa4b2', (s) => !WORK.has(s)]];
    cols.forEach(([c, test], i) => {
      const cx = x + 3 + i * 20;
      g.fillStyle = c; g.fillRect(cx, 6, 18, 2);
      let n = 0;
      for (const s of sims.values()) {
        if (s.leaving || s.data.npc || !test(s.data.status)) continue;
        if (n >= 8) break;
        const nx = cx + (n % 3) * 6, ny = 10 + Math.floor(n / 3) * 5;
        g.fillStyle = s.look.shirt; g.fillRect(nx, ny, 5, 4);
        g.fillStyle = shade(s.look.shirt, -0.2); g.fillRect(nx, ny + 3, 5, 1);
        n++;
      }
    });
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

  function drawDesk(g, d, t, owner) {
    const X = d.tx * T, Y = d.ty * T;
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
    // cubicle partition on the right
    r(31, -12, 3, 27, '#3d5674'); r(31, -12, 3, 1, '#7a9cc0'); r(32, -11, 1, 25, '#4f6d8f');
    // desk body
    r(2, 12, 2, 4, '#6e4a2c'); r(27, 12, 2, 4, '#6e4a2c');
    r(0, 3, 31, 10, '#b98455'); r(0, 3, 31, 1, '#d29d6c'); r(0, 12, 31, 2, '#8f5f37');
    // monitor (left), facing the viewer
    r(5, -8, 15, 11, '#2a2d35'); r(11, 3, 3, 2, '#2a2d35'); r(9, 4, 7, 1, '#2a2d35');
    const st = deskStatus(d);
    drawScreen(g, X + 6, Y - 7, st, t, d.tx + d.ty);
    if (st && st !== 'idle') { g.fillStyle = 'rgba(160,200,255,0.10)'; g.fillRect(X + 2, Y - 10, 22, 16); }
    // keyboard + hands of whoever sits here
    r(18, 7, 11, 2, '#e3e6ea'); r(18, 8, 11, 1, '#b8bec7');
    if (owner && owner.atTarget && owner.pose === 'sitDesk') {
      const typing = ['typing', 'running', 'planning'].includes(owner.data.status);
      const k = typing ? Math.floor(t * 9) % 2 : 0;
      r(19, 6 - k, 2, 2, owner.look.skin); r(26, 5 + k, 2, 2, owner.look.skin);
    }
    drawProp(r, d.role, t, !!owner && owner.atTarget && !owner.leaving);
    // nameplate in the role colour
    r(19, 10, 9, 2, d.role.color); r(20, 10, 7, 1, shade(d.role.color, 0.25));
    if (st === 'running' || st === 'browsing') { // progress bar above the monitor
      const k = Math.floor((t * 4) % 12);
      r(6, -11, 13, 3, '#1d1d24'); r(7, -10, k, 1, st === 'running' ? '#3fb950' : '#58a6ff');
    }
    if (d.fire) drawFire(g, d, t);
  }

  // Desk props per job role, on the left of the desk (tall ones stand beside it).
  function drawProp(r, role, t, busy) {
    const D = '#1d1d24';
    switch (role.prop) {
      case 'trophy': r(0, 0, 5, 3, '#f5b83d'); r(-1, 0, 1, 2, '#f5b83d'); r(5, 0, 1, 2, '#f5b83d'); r(1, 3, 3, 2, '#d99a1e'); r(0, 5, 5, 2, '#8a6d1f'); r(1, 1, 1, 1, '#fff6c9'); break;
      case 'chart': r(-2, -4, 7, 10, '#fafafa'); r(-1, 1, 1, 4, '#3e8ef7'); r(1, -1, 1, 6, '#30a46c'); r(3, -3, 1, 8, '#f5b83d'); r(-2, 6, 7, 1, '#9aa4b2'); break;
      case 'sticky': r(0, 2, 3, 3, '#f5b83d'); r(2, 5, 3, 3, '#e93d82'); r(0, 8, 3, 2, '#79c0ff'); break;
      case 'deskphone': r(-1, 5, 6, 3, '#2a2d35'); r(-1, 3, 6, 2, '#44444c'); r(0, 6, 1, 1, busy && Math.floor(t * 2) % 2 ? '#30a46c' : '#5d6580'); break;
      case 'tablet': r(-1, 6, 7, 5, D); r(0, 7, 5, 3, '#44444c'); r(5, 3, 1, 6, '#e6e8ef'); r(0, 8, 2, 1, '#30a46c'); break;
      case 'dslr': r(-1, 3, 7, 4, D); r(0, 2, 2, 1, D); r(1, 4, 3, 3, '#3a3f4b'); r(2, 5, 1, 1, '#79c0ff'); r(5, 3, 1, 1, '#e5484d'); break;
      case 'tripod': r(-9, -12, 7, 5, D); r(-3, -11, 1, 3, '#3a3f4b'); r(-8, -11, 1, 1, busy && Math.floor(t * 2) % 2 ? '#e5484d' : '#5a1d1f');
        r(-6, -7, 1, 21, '#5d6580'); r(-9, 10, 1, 5, '#5d6580'); r(-3, 10, 1, 5, '#5d6580'); break;
      case 'monitor2': r(-3, -5, 8, 8, '#2a2d35'); r(-2, -4, 6, 5, '#0f1720'); r(-2, -1, 3, 1, '#8e4ec6'); r(0, 0, 3, 1, '#30a46c'); r(0, 3, 2, 2, '#2a2d35'); break;
      case 'ringlight': r(-10, -16, 8, 1, '#fff6c9'); r(-10, -8, 8, 1, '#fff6c9'); r(-11, -15, 1, 7, '#fff6c9'); r(-2, -15, 1, 7, '#fff6c9');
        r(-7, -14, 3, 5, D); r(-6, -7, 1, 21, '#5d6580'); r(-9, 14, 7, 1, '#5d6580');
        if (busy) { r(-13, -18, 14, 13, 'rgba(255,246,201,0.12)'); }
        break;
      case 'phonestand': r(0, 0, 4, 6, D); r(1, 1, 2, 4, '#fafafa'); r(1, 2, 2, 1, '#e93d82'); r(0, 6, 4, 1, '#5d6580'); break;
      case 'notebook': r(-1, 5, 7, 5, '#fafafa'); r(0, 6, 5, 1, '#9aa4b2'); r(0, 8, 4, 1, '#9aa4b2'); r(5, 4, 1, 5, '#3e8ef7'); break;
      case 'duck': r(0, 6, 4, 3, '#f5d000'); r(1, 4, 2, 2, '#f5d000'); r(3, 5, 1, 1, '#f76b15'); r(1, 4, 1, 1, D); break;
      default: r(0, 6, 3, 4, '#fafafa'); r(0, 6, 3, 1, '#6b3e1f');
    }
  }

  function drawChair(g, d) {
    const x = d.x, Y = d.ty * T;
    g.fillStyle = '#2a2d35'; g.fillRect(x - 8, Y - 9, 16, 12);
    g.fillStyle = '#3b3f4a'; g.fillRect(x - 7, Y - 8, 14, 10);
    g.fillStyle = shade(d.role.color, -0.1); g.fillRect(x - 7, Y - 8, 14, 2);
  }

  function drawPlant(g, tx, ty, kind = 0) {
    const X = tx * T, Y = ty * T;
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
    if (kind === 1) { // monstera in a white pot
      r(4, 9, 8, 7, '#eceff3'); r(3, 8, 10, 2, '#cfd6df');
      r(0, -2, 7, 6, '#2e8b57'); r(9, -4, 7, 6, '#2e8b57'); r(4, -8, 8, 7, '#3cb371');
      r(2, 0, 1, 2, '#1f6b42'); r(12, -2, 1, 2, '#1f6b42'); r(7, -6, 2, 1, '#1f6b42'); r(7, -1, 2, 9, '#1f6b42');
      return;
    }
    if (kind === 2) { // cactus in terracotta
      r(4, 10, 8, 6, '#c2603a'); r(3, 9, 10, 2, '#9c4a2c');
      r(6, -1, 4, 11, '#3f9a5c'); r(3, 2, 3, 2, '#3f9a5c'); r(3, -1, 2, 4, '#3f9a5c'); r(10, 4, 3, 2, '#3f9a5c'); r(11, 1, 2, 4, '#3f9a5c');
      r(7, 1, 1, 1, '#a6e3b8'); r(8, 5, 1, 1, '#a6e3b8'); r(7, -2, 2, 1, '#e93d82');
      return;
    }
    if (kind === 3) { // snake plant in a black pot
      r(4, 9, 8, 7, '#2a2d35'); r(3, 8, 10, 2, '#1d1d24');
      [[4, -6, 2], [6, -9, 2], [8, -7, 2], [10, -4, 2]].forEach(([x, y, w]) => { r(x, y, w, 17 - (y + 8) - 1 + 0, '#4c8c4a'); r(x, y, 1, 4, '#d9c35c'); });
      return;
    }
    r(4, 9, 8, 7, '#b5651d'); r(3, 8, 10, 2, '#8b4513');
    r(3, 0, 10, 8, '#2e8b57'); r(1, 2, 4, 5, '#3cb371'); r(11, 1, 4, 5, '#3cb371');
    r(6, -4, 4, 6, '#3cb371'); r(5, 3, 2, 2, '#56c98a'); r(10, -1, 2, 2, '#56c98a');
  }

  function drawBookshelf(g) {
    const X = 18 * T, Y = 2 * T;
    g.fillStyle = '#5a3a22'; g.fillRect(X, Y - 18, 32, 34);
    g.fillStyle = '#6e4a2c'; g.fillRect(X + 2, Y - 16, 28, 30);
    const books = ['#e5484d', '#3e8ef7', '#30a46c', '#f5b83d', '#8e4ec6', '#12a594', '#f76b15'];
    for (let s = 0; s < 3; s++) {
      const sy = Y - 15 + s * 10;
      let bx = X + 3;
      for (let i = 0; bx < X + 28; i++) {
        const w = 2 + ((i + s) % 2), h = 6 + ((i * 3 + s) % 3);
        g.fillStyle = books[(i + s * 2) % books.length]; g.fillRect(bx, sy + 9 - h, w, h);
        bx += w + 1;
      }
      g.fillStyle = '#5a3a22'; g.fillRect(X + 2, sy + 9, 28, 1);
    }
  }

  function drawCoffeeBar(g, t, busy) {
    const X = 21 * T, Y = 2 * T;
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
    r(0, 0, 48, 15, '#8d99ae'); r(0, 0, 48, 3, '#dfe3e8'); r(0, 14, 48, 2, '#6b7488');
    // coffee machine
    r(4, -12, 13, 14, '#2b2b30'); r(5, -11, 11, 4, '#44444c'); r(14, -10, 1, 1, Math.floor(t * 2) % 2 ? '#e5484d' : '#7a1d1f');
    r(8, -4, 5, 1, '#111'); r(9, -2, 3, 3, '#fafafa');
    if (busy) {
      g.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 3; i++) {
        const k = (t * 6 + i * 4) % 10;
        g.fillRect(X + 10 + Math.round(Math.sin(t * 3 + i) * 1), Y - 4 - k, 1, 1);
      }
    }
    // microwave + cups
    r(28, -7, 15, 9, '#d7dbe1'); r(29, -6, 9, 7, '#2a2d35'); r(39, -5, 2, 1, '#30a46c');
    r(22, -2, 3, 3, '#e5484d'); r(44, -1, 2, 2, '#3e8ef7');
    // menu board on wall
    g.fillStyle = '#2b2f3a'; g.fillRect(X + 4, 5, 40, 12);
    g.fillStyle = '#f5b83d'; g.fillRect(X + 7, 8, 14, 1); g.fillStyle = '#cfd6df';
    g.fillRect(X + 7, 11, 22, 1); g.fillRect(X + 7, 13, 18, 1);
  }

  function drawCooler(g) {
    const X = 24 * T, Y = 2 * T;
    g.fillStyle = '#9fd3ff'; g.fillRect(X + 4, Y - 14, 8, 9);
    g.fillStyle = '#c9e7ff'; g.fillRect(X + 5, Y - 13, 3, 6);
    g.fillStyle = '#e7ebf0'; g.fillRect(X + 3, Y - 5, 10, 20);
    g.fillStyle = '#3e8ef7'; g.fillRect(X + 5, Y + 1, 2, 2);
    g.fillStyle = '#e5484d'; g.fillRect(X + 9, Y + 1, 2, 2);
  }

  function drawArcade(g, t, playing) {
    const X = 24 * T, Y = 5 * T;
    g.fillStyle = '#3a1d5c'; g.fillRect(X + 2, Y - 14, 13, 30);
    g.fillStyle = '#5b2a86'; g.fillRect(X + 3, Y - 13, 11, 28);
    g.fillStyle = '#111'; g.fillRect(X + 4, Y - 10, 9, 8);
    if (playing) {
      const c = ['#e93d82', '#f5b83d', '#3fb950', '#3e8ef7'][Math.floor(t * 4) % 4];
      g.fillStyle = c; g.fillRect(X + 5 + Math.floor(t * 6) % 6, Y - 8, 2, 2);
      g.fillStyle = '#f5b83d'; g.fillRect(X + 6, Y - 4, 4, 1);
    } else {
      g.fillStyle = '#2a2050'; g.fillRect(X + 5, Y - 9, 7, 6);
    }
    g.fillStyle = '#f5b83d'; g.fillRect(X + 3, Y - 13, 11, 2);
    g.fillStyle = '#2a1640'; g.fillRect(X + 3, Y, 11, 3);
    g.fillStyle = '#e5484d'; g.fillRect(X + 5, Y, 2, 2);
  }

  // Photo studio: seamless paper backdrop, two softboxes and a camera on a tripod.
  function drawBackdrop(g) {
    const X = 19 * T, Y = 5 * T;
    g.fillStyle = '#3a3f4b'; g.fillRect(X - 1, Y - 22, 2, 38); g.fillRect(X + 63, Y - 22, 2, 38);
    g.fillStyle = '#2a2d35'; g.fillRect(X - 2, Y - 23, 68, 3);
    g.fillStyle = '#e9e4f5'; g.fillRect(X + 1, Y - 20, 62, 30);
    g.fillStyle = '#ddd6ee'; g.fillRect(X + 1, Y + 4, 62, 6);
    g.fillStyle = '#d0c7e6'; g.fillRect(X + 1, Y + 10, 62, 6);
  }

  function drawSoftbox(g, tx, on) {
    const X = tx * T, Y = 6 * T;
    g.fillStyle = '#5d6580'; g.fillRect(X + 7, Y - 6, 2, 20); g.fillRect(X + 3, Y + 13, 10, 1);
    g.fillStyle = '#1d1d24'; g.fillRect(X + 1, Y - 16, 14, 11);
    g.fillStyle = on ? '#fffbea' : '#d9dde3'; g.fillRect(X + 2, Y - 15, 12, 9);
    if (on) { g.fillStyle = 'rgba(255,250,220,0.18)'; g.fillRect(X - 6, Y - 20, 28, 20); }
  }

  function drawTripod(g, t, rec) {
    const X = 20 * T, Y = 7 * T;
    g.fillStyle = '#5d6580'; g.fillRect(X + 7, Y - 2, 1, 14); g.fillRect(X + 4, Y + 8, 1, 6); g.fillRect(X + 10, Y + 8, 1, 6);
    g.fillStyle = '#1d1d24'; g.fillRect(X + 3, Y - 7, 9, 6); g.fillRect(X + 5, Y - 9, 3, 2);
    g.fillStyle = '#3a3f4b'; g.fillRect(X + 5, Y - 5, 5, 3);
    g.fillStyle = rec && Math.floor(t * 2) % 2 ? '#e5484d' : '#5a1d1f'; g.fillRect(X + 10, Y - 6, 1, 1);
  }

  function drawBeanbag(g, tx, ty, c) {
    const X = tx * T, Y = ty * T;
    g.fillStyle = shade(c, -0.25); g.fillRect(X + 1, Y + 4, 14, 11); g.fillRect(X + 2, Y + 2, 12, 2);
    g.fillStyle = c; g.fillRect(X + 2, Y + 3, 12, 10); g.fillRect(X + 3, Y + 1, 10, 2);
    g.fillStyle = shade(c, 0.2); g.fillRect(X + 4, Y + 3, 4, 2);
  }

  // Neon heart on the brick wall, with a little flicker.
  function drawNeon(g, x, t) {
    const on = !((t % 9) > 8.6 && Math.floor(t * 20) % 2);
    const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
    if (on) { g.fillStyle = 'rgba(233,61,130,0.22)'; g.fillRect(x - 3, 4, 15, 14); }
    HEART.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') { g.fillStyle = on ? (j === 0 || i === 0 || i === 6 ? '#ff8fc0' : '#e93d82') : '#5e2a40'; g.fillRect(x + i, 7 + j, 1, 1); } });
  }

  function drawSofa(g) {
    const X = 19 * T, Y = 9 * T;
    g.fillStyle = '#7b2d3b'; g.fillRect(X, Y - 4, 64, 10);
    g.fillStyle = '#93394a'; g.fillRect(X + 1, Y - 3, 62, 3);
    g.fillStyle = '#a8455a'; g.fillRect(X, Y + 6, 64, 8);
    g.fillStyle = '#7b2d3b'; g.fillRect(X - 3, Y - 1, 4, 15); g.fillRect(X + 63, Y - 1, 4, 15);
    g.fillStyle = '#5e2230'; g.fillRect(X, Y + 13, 64, 2);
    for (let i = 1; i < 4; i++) { g.fillStyle = '#93394a'; g.fillRect(X + i * 16, Y + 6, 1, 7); }
  }

  function drawTable(g) {
    const X = 20 * T, Y = 11 * T;
    g.fillStyle = '#6e4a2c'; g.fillRect(X + 3, Y + 10, 2, 5); g.fillRect(X + 27, Y + 10, 2, 5);
    g.fillStyle = '#a0683c'; g.fillRect(X + 1, Y + 3, 30, 8);
    g.fillStyle = '#b97b4a'; g.fillRect(X + 1, Y + 3, 30, 1);
    g.fillStyle = '#fafafa'; g.fillRect(X + 8, Y + 5, 3, 3); g.fillRect(X + 18, Y + 5, 7, 4);
    g.fillStyle = '#3e8ef7'; g.fillRect(X + 19, Y + 6, 5, 2);
  }

  // ---- agents -------------------------------------------------------------------
  const sims = new Map();
  let selectedId = null, hoverId = null;
  let onSelect = () => {};

  function upsert(agent, opts = {}) {
    let s = sims.get(agent.id);
    if (!s) {
      const look = lookFor(agent.id);
      if (!look.role) {
        const taken = new Set([...sims.values()].filter((o) => !o.data.parentId).map((o) => o.look.role.id));
        const role = PO.roles.pick(agent, taken);
        look.role = role;
        look.accessory = role.accessory === 'glasses' ? null : role.accessory;
        look.glasses = look.glasses || role.accessory === 'glasses';
        look.roleColor = role.color;
      }
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
      const look = lookFor(id);
      Object.assign(look, { role: FIRE_ROLE, accessory: 'helmet', roleColor: FIRE_ROLE.color, shirt: '#f76b15', shirtDark: '#d2570f', name: 'Bomba' });
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
      const X = d.tx * T, Y = d.ty * T;
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

  function drawFire(g, d, t) {
    const f = d.fire;
    const X = d.tx * T, Y = d.ty * T;
    g.fillStyle = '#1a0d0a'; g.fillRect(X + 6, Y - 7, 13, 8);
    if (f.phase === 'smoke') return;
    const k = f.phase === 'extinguishing' ? Math.max(0, 1 - (t - f.at) / 3) : 1;
    g.fillStyle = `rgba(255,110,30,${0.18 * k})`; g.fillRect(X - 2, Y - 20, 30, 34);
    for (let i = 0; i < 7; i++) {
      const h = Math.round((6 + Math.sin(t * 12 + i * 1.7) * 3 + (i % 3) * 2) * k);
      const x = X + 6 + i * 2;
      g.fillStyle = '#e5484d'; g.fillRect(x, Y - 7 - h, 2, h);
      g.fillStyle = '#f76b15'; g.fillRect(x, Y - 7 - Math.round(h * 0.7), 2, Math.round(h * 0.7));
      g.fillStyle = '#f5d000'; g.fillRect(x, Y - 7 - Math.round(h * 0.35), 2, Math.round(h * 0.35));
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
      g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
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
  function moodFor(s, t) {
    if (s.emote && t < s.emote.until) return s.emote.mood;
    const st = s.data.status;
    if (WORK.has(st) && s.atTarget && loadOf(s, t) >= STRESS_AT) return 'worried';
    if (STATUS_MOOD[st] && (s.atTarget || st === 'waiting')) return STATUS_MOOD[st];
    if (s.pose === 'walk') return 'neutral';
    const spotName = s.spot ? s.spot.name : '';
    if (/^(sofa|bean)/.test(spotName)) return ((t + s.blinkAt * 7) % 30) < 14 ? 'sleepy' : 'happy';
    if (/^(coffee|cooler)/.test(spotName)) return 'happy';
    if (/^(studio|arcade|shoot)/.test(spotName)) return 'excited';
    if (/^books/.test(spotName)) return 'curious';
    return 'neutral';
  }

  function armsFor(s, t) {
    if (s.emote && t < s.emote.until && s.emote.arms && (s.emote.sticky || t - s.emote.start < 2)) return s.emote.arms;
    if (s.task && s.task.phase === 'spraying') return 'wave';
    if (s.atTarget && s.data.status === 'waiting') return 'wave';
    if (s.atTarget && s.spot && /^studio/.test(s.spot.name) && Math.floor(t / 2) % 2) return 'cheer';
    return null;
  }

  function bubbleFor(s, t) {
    if (s.emote && t < s.emote.until && s.emote.text) return s.emote.text;
    const st = s.data.status;
    if (st === 'typing') return s.look.role.verb || 'WORKING';
    if (st === 'idle' && s.id !== selectedId && s.id !== hoverId) return null;
    return BUBBLE[st] || null;
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
    if (!s.spot || now > s.nextWander) {
      const taken = new Set([...sims.values()].filter((o) => o !== s && o.spot).map((o) => o.spot.name));
      const options = SPOTS.filter((p) => !taken.has(p.name) && (!s.spot || p.name !== s.spot.name));
      if (options.length) s.spot = options[Math.floor(Math.random() * options.length)];
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
  const low = document.createElement('canvas');
  low.width = W; low.height = H;
  const g = low.getContext('2d');
  let canvas, out, scale = 2, last = performance.now();

  function frame(nowMs) {
    const dt = Math.min(0.1, (nowMs - last) / 1000);
    last = nowMs;
    const t = nowMs / 1000;
    for (const s of [...sims.values()]) step(s, dt);
    updateFires(t);
    workParticles(t);
    updateParticles(dt);
    draw(t);
    requestAnimationFrame(frame);
  }

  function draw(t) {
    const now = new Date();
    g.drawImage(bg, 0, 0);
    drawWindow(g, 4 * T, t, now);
    drawWindow(g, 12 * T, t, now);
    drawWhiteboard(g, 7 * T, sims);
    drawNeon(g, 20 * T + 4, t);
    drawClock(g, 2 * T + 8, 14, now);
    const flash = drawBrandSign(g, 14 * T + 2, t);

    const at = (name) => [...sims.values()].some((s) => s.atTarget && s.spot && s.spot.name.startsWith(name) && !WORK.has(s.data.status));
    const items = [];
    for (const d of desks) {
      const owner = d.owner && sims.get(d.owner);
      items.push({ y: d.ty * T + 15, draw: () => drawDesk(g, d, t, owner) });
      items.push({ y: d.ty * T + 7, draw: () => drawChair(g, d) });
    }
    plants.forEach(([x, y], i) => items.push({ y: y * T + 15, draw: () => drawPlant(g, x, y, i % 4) }));
    items.push({ y: 5 * T + 15, draw: () => drawBackdrop(g) });
    [18, 23].forEach((x) => items.push({ y: 6 * T + 15, draw: () => drawSoftbox(g, x, at('studio')) }));
    items.push({ y: 7 * T + 15, draw: () => drawTripod(g, t, at('studio')) });
    BEANBAGS.forEach(([x, y, c]) => items.push({ y: y * T + 6, draw: () => drawBeanbag(g, x, y, c) }));
    items.push({ y: 2 * T + 15, draw: drawBookshelf.bind(null, g) });
    items.push({ y: 2 * T + 15, draw: () => drawCoffeeBar(g, t, at('coffee')) });
    items.push({ y: 2 * T + 15, draw: () => drawCooler(g) });
    items.push({ y: 5 * T + 15, draw: () => drawArcade(g, t, at('arcade')) });
    items.push({ y: 9 * T + 6, draw: () => drawSofa(g) });
    items.push({ y: 11 * T + 14, draw: () => drawTable(g) });

    for (const s of sims.values()) {
      items.push({ y: s.y, draw: () => {
        if ((s.id === selectedId || s.id === hoverId) && s.pose !== 'sitDesk') {
          g.fillStyle = s.id === selectedId ? (Math.floor(t * 3) % 2 ? '#f5b83d' : '#ffe08a') : 'rgba(255,255,255,0.6)';
          g.fillRect(Math.round(s.x) - 7, s.y, 14, 1);
          g.fillRect(Math.round(s.x) - 8, s.y - 1, 1, 1); g.fillRect(Math.round(s.x) + 7, s.y - 1, 1, 1);
        }
        const blink = ((t + s.blinkAt) % 4) < 0.15;
        drawCharacter(g, s.x, s.y, s.look, {
          dir: s.dir, pose: s.pose, frame: s.frame, t, blink, mood: moodFor(s, t), arms: armsFor(s, t),
        });
        if (s.task) { // fire extinguisher
          const ex = Math.round(s.x) + (s.dir === 'left' ? -9 : 5), ey = Math.round(s.y) - 12;
          g.fillStyle = '#b42318'; g.fillRect(ex, ey, 4, 8);
          g.fillStyle = '#e5484d'; g.fillRect(ex + 1, ey + 1, 2, 6);
          g.fillStyle = '#1d1d24'; g.fillRect(ex + 1, ey - 2, 2, 2); g.fillRect(ex + 3, ey - 3, 2, 1);
        }
      } });
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    drawParticles(g);
    if (flash) { g.fillStyle = 'rgba(255,250,230,0.07)'; g.fillRect(0, 0, W, H); }

    // night tint
    const hr = now.getHours();
    if (hr < 6 || hr >= 20) { g.fillStyle = 'rgba(18,22,60,0.22)'; g.fillRect(0, 0, W, H); }

    out.imageSmoothingEnabled = false;
    out.drawImage(low, 0, 0, W * scale, H * scale);
    drawOverlay(t);
  }

  function drawOverlay(t) {
    const S = scale;
    if (signRect) {
      const k = Math.min((signRect.w * S) / logoImg.naturalWidth, ((signRect.h - 2) * S) / logoImg.naturalHeight);
      const lw = logoImg.naturalWidth * k, lh = logoImg.naturalHeight * k;
      out.imageSmoothingEnabled = true;
      out.drawImage(logoImg, (signRect.x + signRect.w / 2) * S - lw / 2, (signRect.y + (signRect.h - 2) / 2) * S - lh / 2, lw, lh);
      out.imageSmoothingEnabled = false;
    }
    out.textBaseline = 'middle';
    out.textAlign = 'center';
    drawLinks(t);
    const ordered = [...sims.values()].sort((a, b) => (a.id === selectedId) - (b.id === selectedId) || a.y - b.y);
    for (const s of ordered) {
      const cx = s.x * S;
      const sitting = s.pose === 'sitDesk' || s.pose === 'sitFront';
      const headTop = (s.y - 22 + (sitting ? 2 : 0)) * S;
      const text = bubbleFor(s, t);
      if (text && !(s.data.status === 'waiting' && !s.emote && Math.floor(t * 2.5) % 2 === 1)) {
        drawBubble(cx, headTop - S * 3 + Math.sin(t * 3 + s.blinkAt) * S * 0.6, text, s);
      }
      // name tag + job title
      const nfs = Math.max(8, Math.round(S * 2));
      const rfs = Math.max(14, Math.round(S * 4.6));
      const name = s.look.name;
      const role = s.look.role;
      const tagY = (s.pose === 'sitDesk' && s.atTarget ? s.y + 11 : s.y + 4) * S;
      out.font = `${nfs}px "Press Start 2P", monospace`;
      const nw = out.measureText(name).width;
      out.font = `${rfs}px "VT323", monospace`;
      const rw = out.measureText(role.short).width;
      const tw = Math.max(nw, rw) + nfs * 0.8;
      const th = nfs * 1.3 + rfs * 0.95;
      out.fillStyle = 'rgba(15,17,26,0.82)';
      out.fillRect(cx - tw / 2, tagY - nfs * 0.75, tw, th);
      out.fillStyle = role.color;
      out.fillRect(cx - tw / 2, tagY - nfs * 0.75, tw, Math.max(1, S * 0.5));
      out.fillText(role.short, cx, tagY + nfs * 0.55 + rfs * 0.45);
      out.font = `${nfs}px "Press Start 2P", monospace`;
      out.fillStyle = s.id === selectedId ? '#ffe08a' : '#ffffff';
      out.fillText(name, cx, tagY);
    }
    // tooltip for hovered/selected agent
    const s = sims.get(hoverId) || sims.get(selectedId);
    if (s) {
      const lines = [`${s.look.name} · ${s.look.role.label} (${s.look.role.ms}) — ${s.data.project}`, `${(s.data.status || '').toUpperCase()}: ${s.data.detail || ''}`];
      const tfs = Math.max(12, Math.round(S * 4.2));
      out.font = `${tfs}px "VT323", monospace`;
      out.textAlign = 'left';
      const tw = Math.min(W * S * 0.6, Math.max(...lines.map((l) => out.measureText(l).width)) + tfs);
      let x = s.x * S + 14 * S, y = (s.y - 30) * S;
      if (x + tw > W * S - 4) x = s.x * S - 14 * S - tw;
      y = Math.max(4, Math.min(H * S - tfs * 2.6 - 4, y));
      out.fillStyle = 'rgba(15,17,26,0.92)';
      out.fillRect(x, y, tw, tfs * 2.6);
      out.fillStyle = s.look.shirt; out.fillRect(x, y, S, tfs * 2.6);
      out.fillStyle = '#ffffff'; out.fillText(clip(lines[0], tw - tfs), x + tfs / 2, y + tfs * 0.75);
      out.fillStyle = '#c9d1d9'; out.fillText(clip(lines[1], tw - tfs), x + tfs / 2, y + tfs * 1.85);
    }
  }

  // White pixel speech bubble with a tail, anchored at (cx, bottom).
  function drawBubble(cx, bottom, text, s) {
    const S = scale;
    const fs = Math.max(8, Math.round(S * 2.2));
    out.font = `${fs}px "Press Start 2P", monospace`;
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
      const fs = Math.max(8, Math.round(S * 1.8));
      out.font = `${fs}px "Press Start 2P", monospace`;
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

  function pick(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * W;
    const y = ((ev.clientY - rect.top) / rect.height) * H;
    let best = null;
    for (const s of sims.values()) {
      const top = s.y - 22, bottom = s.y + 2;
      if (x >= s.x - 7 && x <= s.x + 7 && y >= top && y <= bottom && (!best || s.y > best.y)) best = s;
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
    canvas.addEventListener('mousemove', (e) => {
      const s = pick(e);
      hoverId = s ? s.id : null;
      canvas.style.cursor = s ? 'pointer' : 'default';
    });
    canvas.addEventListener('mouseleave', () => { hoverId = null; });
    canvas.addEventListener('click', (e) => { const s = pick(e); select(s ? s.id : null); });
    requestAnimationFrame(frame);
  }

  function reset() {
    sims.clear();
    desks.forEach((d) => { d.owner = null; });
  }

  PO.world = {
    init, upsert, remove, reset, select, setLogo, emote, noteTool,
    onEvent: (cb) => { onEvent = cb; },
    look: (id) => (sims.get(id) ? sims.get(id).look : lookFor(id)),
    get selected() { return selectedId; },
  };
})(window.PO = window.PO || {});
