// The office: map, furniture, path-finding, agent movement and rendering.
(function (PO) {
  'use strict';

  const T = 16, COLS = 26, ROWS = 16, W = COLS * T, H = ROWS * T;
  const SPEED = 44; // px / second (logical)
  const WORK = new Set(['typing', 'reading', 'running', 'browsing', 'thinking', 'planning', 'delegating', 'waiting']);
  const BUBBLE = {
    typing: ['</>', '#7ee787'], reading: ['READ', '#79c0ff'], running: ['>_', '#3fb950'],
    browsing: ['WWW', '#58a6ff'], thinking: ['...', '#d2a8ff'], planning: ['TODO', '#ffa657'],
    delegating: ['TEAM', '#f778ba'], waiting: ['!', '#f5b83d'], done: ['OK', '#3fb950'], idle: ['zZ', '#9aa4b2'],
  };
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
        tx: dx, ty: dy, owner: null, deco: (dx * 7 + dy * 3) % 4,
        seat: { tx: dx, ty: dy + 1 }, x: dx * T + 16, y: (dy + 1) * T + 9,
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
    spot('rug19', 19, 12, 'stand', 'right'), spot('rug22', 22, 12, 'stand', 'left'),
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
    // top wall
    r(0, 0, W, 32, '#ece1cf');
    r(0, 0, W, 3, '#5b4636');
    r(0, 22, W, 7, '#dccbb0');
    r(0, 22, W, 1, '#cdb994');
    r(0, 29, W, 3, '#7a5c43');
    // side + bottom walls
    r(0, 32, T, H - 32, '#6b5442'); r(T - 3, 32, 3, H - 32, '#57432f');
    r(W - T, 32, T, H - 32, '#6b5442'); r(W - T, 32, 3, H - 32, '#57432f');
    r(0, H - T, W, T, '#6b5442'); r(0, H - T, W, 3, '#57432f');
    // door
    r(0, DOOR.ty * T, T, T, '#cba37c');
    r(0, DOOR.ty * T - 3, T, 3, '#3b2c1f');
    r(2, DOOR.ty * T + 2, 10, 12, '#8d3b3b');
    r(3, DOOR.ty * T + 3, 8, 10, '#a64b4b');
    // poster on lounge wall
    r(20 * T + 2, 6, 12, 15, '#2b2f3a'); r(20 * T + 3, 7, 10, 13, '#f76b15');
    r(20 * T + 5, 10, 6, 6, '#fff3c4'); r(20 * T + 6, 11, 4, 4, '#f5b83d');
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
  function drawBrandSign(g, x, t) {
    const w = 58, y = 4, h = 19;
    const flash = (t % 7) < 0.12;
    g.fillStyle = '#3b2c1f'; g.fillRect(x, y, w, h);
    g.fillStyle = '#1d2131'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = 'rgba(245,184,61,0.25)'; g.fillRect(x - 1, y + h, w + 2, 1);
    if (logoReady) {
      const k = Math.min((w - 4) / logoImg.naturalWidth, (h - 4) / logoImg.naturalHeight);
      const lw = Math.round(logoImg.naturalWidth * k), lh = Math.round(logoImg.naturalHeight * k);
      g.imageSmoothingEnabled = false;
      g.drawImage(logoImg, x + Math.round((w - lw) / 2), y + Math.round((h - lh) / 2), lw, lh);
      return false;
    }
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
        if (s.leaving || !test(s.data.status)) continue;
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
      default: { // idle owner: screensaver
        r(0, 0, 12, 8, '#0d1424');
        const px = Math.floor((t * 5 + seed * 3) % 22), py = Math.floor((t * 3 + seed) % 14);
        r(px > 11 ? 22 - px : px, py > 7 ? 14 - py : py, 1, 1, '#5b5bd6');
      }
    }
  }

  function drawDesk(g, d, t, owner) {
    const X = d.tx * T, Y = d.ty * T;
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
    // legs + body
    r(2, 12, 2, 4, '#6e4a2c'); r(28, 12, 2, 4, '#6e4a2c');
    r(1, 4, 30, 9, '#b98455'); r(1, 4, 30, 1, '#d29d6c'); r(1, 12, 30, 2, '#8f5f37');
    // monitor
    r(9, -6, 14, 11, '#2a2d35'); r(15, 5, 2, 2, '#2a2d35'); r(12, 6, 8, 1, '#2a2d35');
    const st = owner ? (owner.leaving ? null : (WORK.has(owner.data.status) && owner.atTarget ? owner.data.status : 'idle')) : null;
    drawScreen(g, X + 10, Y - 5, st, t, d.tx + d.ty);
    if (st && st !== 'idle') { g.fillStyle = 'rgba(160,200,255,0.10)'; g.fillRect(X + 6, Y - 8, 20, 16); }
    // keyboard + deco
    r(11, 8, 10, 2, '#e3e6ea'); r(11, 9, 10, 1, '#b8bec7');
    if (d.deco === 0) { r(25, 6, 3, 4, '#fafafa'); r(28, 7, 1, 2, '#fafafa'); r(25, 6, 3, 1, '#6b3e1f'); }
    else if (d.deco === 1) { r(3, 5, 6, 4, '#f0f0e8'); r(4, 6, 4, 1, '#c9c9c0'); }
    else if (d.deco === 2) { r(25, 5, 4, 4, '#b5651d'); r(24, 1, 6, 5, '#3cb371'); r(26, 0, 2, 2, '#2e8b57'); }
    else { r(3, 6, 5, 3, '#2a2d35'); r(4, 7, 3, 1, '#e5484d'); }
  }

  function drawChair(g, d) {
    const x = d.x, y = (d.ty + 1) * T;
    g.fillStyle = '#3b3f4a'; g.fillRect(x - 6, y + 2, 12, 7);
    g.fillStyle = '#4c5260'; g.fillRect(x - 5, y + 3, 10, 5);
    g.fillStyle = '#2a2d35'; g.fillRect(x - 1, y + 9, 2, 3); g.fillRect(x - 5, y + 12, 10, 1);
  }

  function drawPlant(g, tx, ty) {
    const X = tx * T, Y = ty * T;
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
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
      s = { id: agent.id, data: agent, look, path: [], dir: 'right', pose: 'stand', frame: 0, dist: 0,
        x: -10, y: DOOR.ty * T + 12, targetKey: null, desk: null, spot: null, nextWander: 0,
        leaving: false, atTarget: false, blinkAt: Math.random() * 4 };
      sims.set(agent.id, s);
      if (opts.instant) {
        const tg = targetFor(s);
        s.x = tg.x; s.y = tg.y; s.pose = tg.pose; s.dir = tg.dir; s.targetKey = tg.key; s.atTarget = true;
      } else {
        s.path = [tileFeet(DOOR.tx, DOOR.ty)];
      }
    }
    s.data = agent;
    s.leaving = agent.status === 'done' || (s.leaving && opts.removed);
  }

  function remove(id) {
    const s = sims.get(id);
    if (s) s.leaving = true;
  }

  function freeDesk(s) {
    if (s.desk) { s.desk.owner = null; s.desk = null; }
  }

  function targetFor(s) {
    if (s.leaving) {
      freeDesk(s);
      return { key: 'door', tile: DOOR, x: -12, y: DOOR.ty * T + 12, pose: 'stand', dir: 'left' };
    }
    if (WORK.has(s.data.status)) {
      if (!s.desk) {
        // children prefer a desk close to their parent
        const parent = s.data.parentId && sims.get(s.data.parentId);
        const pd = parent && parent.desk;
        const free = desks.filter((d) => !d.owner)
          .sort((a, b) => pd ? (Math.abs(a.tx - pd.tx) + Math.abs(a.ty - pd.ty) * 2) - (Math.abs(b.tx - pd.tx) + Math.abs(b.ty - pd.ty) * 2) : 0);
        let d = free[0];
        if (!d) { // borrow a desk from someone on a break
          d = desks.find((k) => { const o = sims.get(k.owner); return o && !WORK.has(o.data.status); });
          if (d) sims.get(d.owner).desk = null;
        }
        if (d) { d.owner = s.id; s.desk = d; }
      }
      if (s.desk) {
        s.spot = null;
        return { key: `desk:${s.desk.tx},${s.desk.ty}`, tile: s.desk.seat, x: s.desk.x, y: s.desk.y, pose: 'sitDesk', dir: 'up' };
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
    draw(t);
    requestAnimationFrame(frame);
  }

  function draw(t) {
    const now = new Date();
    g.drawImage(bg, 0, 0);
    drawWindow(g, 4 * T, t, now);
    drawWindow(g, 12 * T, t, now);
    drawWhiteboard(g, 7 * T, sims);
    drawClock(g, 2 * T + 8, 14, now);
    const flash = drawBrandSign(g, 14 * T + 2, t);

    const at = (name) => [...sims.values()].some((s) => s.atTarget && s.spot && s.spot.name.startsWith(name) && !WORK.has(s.data.status));
    const items = [];
    for (const d of desks) {
      const owner = d.owner && sims.get(d.owner);
      items.push({ y: d.ty * T + 15, draw: () => drawDesk(g, d, t, owner) });
      items.push({ y: (d.ty + 1) * T + 11, draw: () => drawChair(g, d) });
    }
    plants.forEach(([x, y]) => items.push({ y: y * T + 15, draw: () => drawPlant(g, x, y) }));
    items.push({ y: 2 * T + 15, draw: drawBookshelf.bind(null, g) });
    items.push({ y: 2 * T + 15, draw: () => drawCoffeeBar(g, t, at('coffee')) });
    items.push({ y: 2 * T + 15, draw: () => drawCooler(g) });
    items.push({ y: 5 * T + 15, draw: () => drawArcade(g, t, at('arcade')) });
    items.push({ y: 9 * T + 6, draw: () => drawSofa(g) });
    items.push({ y: 11 * T + 14, draw: () => drawTable(g) });

    for (const s of sims.values()) {
      items.push({ y: s.y, draw: () => {
        if (s.id === selectedId || s.id === hoverId) {
          g.fillStyle = s.id === selectedId ? (Math.floor(t * 3) % 2 ? '#f5b83d' : '#ffe08a') : 'rgba(255,255,255,0.6)';
          const y0 = s.pose === 'sitDesk' ? s.y - 20 : s.y - 1;
          g.fillRect(Math.round(s.x) - 6, y0, 12, 1);
          if (s.pose !== 'sitDesk') { g.fillRect(Math.round(s.x) - 7, y0 + 1, 1, 1); g.fillRect(Math.round(s.x) + 6, y0 + 1, 1, 1); }
        }
        const st = s.data.status;
        let anim = null;
        if (s.atTarget && s.pose === 'sitDesk') anim = st === 'waiting' ? 'wave' : (st === 'typing' || st === 'running') ? 'type' : 'read';
        if (s.atTarget && st === 'waiting' && s.pose !== 'sitDesk') anim = 'wave';
        const blink = ((t + s.blinkAt) % 4) < 0.15;
        drawCharacter(g, s.x, s.y, s.look, { dir: s.dir, pose: s.pose, frame: s.frame, anim, t, blink });
      } });
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

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
    const fs = Math.max(8, Math.round(S * 2.4));
    out.textBaseline = 'middle';
    out.textAlign = 'center';
    const ordered = [...sims.values()].sort((a, b) => (a.id === selectedId) - (b.id === selectedId) || a.y - b.y);
    for (const s of ordered) {
      const st = s.data.status;
      // seated agents: bubble floats above the monitor so the screen stays visible
      const headY = (s.pose === 'sitDesk' && s.atTarget ? s.y - 33 : s.y - 18) * S;
      const cx = s.x * S;
      // status bubble
      const b = BUBBLE[st];
      const showBubble = b && (st !== 'idle' || s.id === selectedId || s.id === hoverId) && !(st === 'waiting' && Math.floor(t * 2.5) % 2);
      if (showBubble && s.atTarget !== undefined) {
        out.font = `${fs}px "Press Start 2P", monospace`;
        const bw = out.measureText(b[0]).width + fs, bh = fs * 1.7;
        const by = headY - bh - S * 2 + Math.sin(t * 3 + s.blinkAt) * S * 0.6;
        out.fillStyle = 'rgba(15,17,26,0.88)';
        out.fillRect(cx - bw / 2, by, bw, bh);
        out.fillRect(cx - S, by + bh, S * 2, S);
        out.fillStyle = b[1];
        out.fillRect(cx - bw / 2, by + bh - S * 0.6, bw, S * 0.6);
        out.fillText(b[0], cx, by + bh / 2);
      }
      // name tag
      const nfs = Math.max(8, Math.round(S * 2));
      out.font = `${nfs}px "Press Start 2P", monospace`;
      const name = s.data.parentId ? `${s.look.name}·${s.data.role || 'sub'}` : s.look.name;
      const tagY = (s.pose === 'sitDesk' ? s.y + 7 : s.y + 4) * S;
      const tw = out.measureText(name).width + nfs * 0.8;
      out.fillStyle = 'rgba(15,17,26,0.72)';
      out.fillRect(cx - tw / 2, tagY - nfs * 0.75, tw, nfs * 1.5);
      out.fillStyle = s.id === selectedId ? '#ffe08a' : '#ffffff';
      out.fillText(name, cx, tagY);
    }
    // tooltip for hovered/selected agent
    const s = sims.get(hoverId) || sims.get(selectedId);
    if (s) {
      const lines = [`${s.look.name} — ${s.data.project}`, `${(s.data.status || '').toUpperCase()}: ${s.data.detail || ''}`];
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
      const top = s.y - 18, bottom = s.y + 2;
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
    init, upsert, remove, reset, select, setLogo,
    look: (id) => (sims.get(id) ? sims.get(id).look : lookFor(id)),
    get selected() { return selectedId; },
  };
})(window.PO = window.PO || {});
