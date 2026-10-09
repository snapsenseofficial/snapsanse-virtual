// Illustrated (vector) office: floor, walls, desks, furniture, fire.
// Everything is drawn in world units (one tile = 16) on a transformed
// canvas, so it stays smooth at any zoom.
(function (PO) {
  'use strict';

  const T = 16;
  const LINE = '#16171d';
  const { ell, rr, line, heart } = PO.toon;
  const shade = (c, a) => PO.sprites.shade(c, a);
  function poly(g, pts, fill, stroke, lw = 0.6) {
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  function vgrad(g, y0, y1, a, b) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }

  // ---- static background (cached by the world) ------------------------------------------
  function paintBackground(g, W, H, desks, DOOR) {
    // floor: large dark tiles with soft variation
    g.fillStyle = '#44474f'; g.fillRect(0, 32, W, H - 32);
    for (let ty = 2; ty < 15; ty++) for (let tx = 1; tx < 25; tx++) {
      const v = ((tx * 7 + ty * 13) % 5) * 0.012;
      g.fillStyle = shade((tx + ty) % 2 ? '#474a52' : '#4b4e57', v);
      g.fillRect(tx * T + 0.25, ty * T + 0.25, T - 0.5, T - 0.5);
    }
    // light pooling from the windows
    const pool = g.createRadialGradient(130, 40, 4, 130, 40, 150);
    pool.addColorStop(0, 'rgba(255,240,210,0.10)'); pool.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = pool; g.fillRect(0, 32, W, H);
    // lounge rug with the SnapSense camera emblem
    rr(g, 18 * T + 3, 8 * T + 2, 6 * T - 6, 6 * T - 5, 4, '#232c42', '#1a2133', 0.8);
    rr(g, 18 * T + 6, 8 * T + 5, 6 * T - 12, 6 * T - 11, 3, null, 'rgba(255,255,255,0.08)', 0.6);
    const ex = 21 * T + 5, ey = 13 * T - 2;
    rr(g, ex - 7, ey - 4.5, 14, 9, 2, '#f5b83d'); rr(g, ex - 4, ey - 6.2, 4.5, 2, 0.8, '#f5b83d');
    ell(g, ex, ey, 3, 3, '#232c42'); ell(g, ex, ey, 1.8, 1.8, '#f5b83d'); ell(g, ex + 4.6, ey - 2.4, 0.8, 0.8, '#232c42');
    // charcoal back wall
    g.fillStyle = vgrad(g, 0, 32, '#2a2d34', '#353841'); g.fillRect(0, 0, W, 32);
    g.fillStyle = 'rgba(255,255,255,0.03)'; for (let x = 0; x < W; x += 24) g.fillRect(x, 3, 0.5, 25);
    g.fillStyle = '#1b1d22'; g.fillRect(0, 0, W, 3);
    g.fillStyle = '#1f2126'; g.fillRect(0, 28, W, 4); g.fillStyle = '#3a3d45'; g.fillRect(0, 28, W, 0.6);
    // chalkboard frame (text drawn crisp in drawWallText)
    rr(g, 4, 4, 56, 22, 1.5, '#6b4a2f', LINE, 0.5); rr(g, 5.5, 5.5, 53, 19, 1, '#22292b');
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(8, 8, 20, 0.4); g.fillRect(30, 18, 24, 0.4);
    rr(g, 10, 22.6, 6, 1.2, 0.5, '#f1f1ec'); rr(g, 46, 22.6, 4, 1.2, 0.5, '#f5b83d');
    // framed photo
    rr(g, 178, 7, 12, 14, 0.8, '#1d1d24'); rr(g, 179.2, 8.2, 9.6, 11.6, 0.4, '#fafafa');
    g.fillStyle = vgrad(g, 9, 15, '#f2a76b', '#f6cfa0'); g.fillRect(180, 9, 8, 6);
    poly(g, [180, 18, 182.5, 13.5, 185, 16, 186.5, 14, 188, 18], '#6b4a2f'); ell(g, 186, 11, 1, 1, '#fff6c9');
    // side + bottom walls
    g.fillStyle = '#2a2c32'; g.fillRect(0, 32, T, H - 32); g.fillRect(W - T, 32, T, H - 32); g.fillRect(0, H - T, W, T);
    g.fillStyle = '#1f2126'; g.fillRect(T - 3, 32, 3, H - 48); g.fillRect(W - T, 32, 3, H - 48); g.fillRect(0, H - T, W, 3);
    // door
    g.fillStyle = '#4b4e57'; g.fillRect(0, DOOR.ty * T, T, T);
    rr(g, 1.5, DOOR.ty * T + 1, 11, 14, 1, '#3a3f4b', LINE, 0.5); rr(g, 3, DOOR.ty * T + 2.5, 8, 11, 0.8, '#4a505e');
    ell(g, 9.6, DOOR.ty * T + 8.5, 0.7, 0.7, '#f5b83d');
  }

  // ---- wall decor (animated) --------------------------------------------------------------
  function skyColor(h) {
    if (h < 5 || h >= 21) return ['#121830', '#26305a', true];
    if (h < 7) return ['#f2a76b', '#f8d7ac', false];
    if (h < 17) return ['#78c0ea', '#c4e7f8', false];
    if (h < 19) return ['#e9895c', '#f6c595', false];
    return ['#3a3c6e', '#7a5f92', true];
  }

  function drawWindow(g, x, t, now) {
    const [top, bottom, night] = skyColor(now.getHours());
    rr(g, x, 4, 32, 22, 1, '#1b1d22');
    g.save();
    g.beginPath(); g.rect(x + 1.5, 5.5, 29, 19); g.clip();
    g.fillStyle = vgrad(g, 5, 25, top, bottom); g.fillRect(x + 1.5, 5.5, 29, 19);
    if (!night) {
      const cx = x + ((t * 1.5 + x) % 46) - 8;
      ell(g, cx, 10, 4, 1.4, 'rgba(255,255,255,0.85)'); ell(g, cx + 2.5, 9.2, 2.5, 1.4, 'rgba(255,255,255,0.85)');
    } else { ell(g, x + 25, 9, 1.6, 1.6, '#fff6c9'); }
    const towers = [[1, 13, 6], [7, 9.5, 5], [12, 15, 6], [18, 8, 6], [24, 12, 4.5], [28, 14, 4]];
    for (const [bx, by, bw] of towers) {
      g.fillStyle = night ? '#1a2036' : '#5c7290';
      g.fillRect(x + bx + 1, by, bw, 26 - by);
      for (let wy = by + 2; wy < 24; wy += 2.6) for (let wx = bx + 2; wx < bx + bw; wx += 2) {
        if (((wx * 13 + wy * 7 + x) % 5) < (night ? 3 : 1.2)) { g.fillStyle = night ? '#ffd88a' : '#b3c8e0'; g.fillRect(x + wx, wy, 0.9, 1); }
      }
    }
    g.restore();
    g.fillStyle = '#1b1d22'; g.fillRect(x + 15.3, 5, 1.4, 20);
    g.fillStyle = 'rgba(255,255,255,0.12)'; poly(g, [x + 3, 6, x + 8, 6, x + 4, 24, x + 1.6, 24], 'rgba(255,255,255,0.10)');
    rr(g, x - 1, 25.6, 34, 1.8, 0.6, '#3a3d45');
  }

  function drawClock(g, cx, cy, now) {
    ell(g, cx, cy, 6.2, 6.2, '#1b1d22'); ell(g, cx, cy, 5.2, 5.2, '#fbf7ee', LINE, 0.4);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(g, [cx + Math.sin(a) * 4.2, cy - Math.cos(a) * 4.2, cx + Math.sin(a) * 4.7, cy - Math.cos(a) * 4.7], '#5d6580', 0.35); }
    const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
    const hand = (a, l, w, c) => line(g, [cx, cy, cx + Math.sin(a) * l, cy - Math.cos(a) * l], c, w);
    hand(((h + m / 60) / 12) * Math.PI * 2, 2.6, 0.7, '#22242b');
    hand(((m + s / 60) / 60) * Math.PI * 2, 3.8, 0.5, '#22242b');
    hand((s / 60) * Math.PI * 2, 4.1, 0.25, '#e5484d');
    ell(g, cx, cy, 0.5, 0.5, '#e5484d');
  }

  // "To Do" whiteboard; boxes tick as the team finishes tasks; a dot per teammate.
  function drawWhiteboard(g, x, sims, tasksDone, WORK) {
    rr(g, x, 3, 64, 23, 1.2, '#8a8f98', LINE, 0.4); rr(g, x + 1.2, 4.2, 61.6, 20.4, 0.6, '#f6f7f4');
    rr(g, x + 4, 25.6, 56, 1.6, 0.6, '#b9bec7');
    for (let i = 0; i < 6; i++) {
      const bx = x + 4 + Math.floor(i / 3) * 24, by = 9.6 + (i % 3) * 5;
      rr(g, bx, by, 3, 3, 0.5, '#ffffff', '#5d6580', 0.4);
      if (i < tasksDone % 7) line(g, [bx + 0.6, by + 1.6, bx + 1.3, by + 2.4, bx + 2.6, by + 0.5], '#30a46c', 0.6);
    }
    let n = 0;
    for (const s of sims.values()) {
      if (s.leaving || s.data.npc || s.data.parentId || n >= 6) continue;
      const nx = x + 54 + (n % 2) * 5, ny = 8 + Math.floor(n / 2) * 5.6;
      ell(g, nx, ny, 1.9, 1.9, s.look.skin, LINE, 0.3);
      ell(g, nx + 1.4, ny + 1.4, 0.7, 0.7, WORK.has(s.data.status) ? '#30a46c' : '#9aa4b2');
      n++;
    }
  }

  function drawNeon(g, x, t) {
    const on = !((t % 9) > 8.6 && Math.floor(t * 20) % 2);
    g.save();
    if (on) { g.shadowColor = '#ff4fa0'; g.shadowBlur = 6; }
    g.beginPath();
    const cx = x + 3.5, cy = 11;
    g.moveTo(cx, cy + 4); g.bezierCurveTo(cx - 6, cy, cx - 3, cy - 5, cx, cy - 2); g.bezierCurveTo(cx + 3, cy - 5, cx + 6, cy, cx, cy + 4);
    g.strokeStyle = on ? '#ff8fc0' : '#5e2a40'; g.lineWidth = 1.2; g.stroke();
    g.restore();
  }

  function drawBrandSign(g, x, t, logo) {
    const w = 58, y = 4, h = 19;
    rr(g, x, y, w, h, 1.5, '#1b1d22', LINE, 0.5); rr(g, x + 1, y + 1, w - 2, h - 2, 1, '#1d2131');
    g.fillStyle = 'rgba(245,184,61,0.22)'; g.fillRect(x, y + h, w, 0.8);
    if (logo) {
      const lw = w - 8, lh = lw * logo.naturalHeight / logo.naturalWidth;
      g.drawImage(logo, x + 4, y + (h - lh) / 2 - 1, lw, lh);
    } else {
      PO.toon.text(g, 'SNAPSENSE', x + w / 2, y + h / 2 - 1, 6.5, '#ffffff');
    }
    rr(g, x + 4, y + h - 3.6, w - 8, 0.8, 0.4, '#f5b83d');
    return (t % 7) < 0.12; // camera flash moment
  }

  // ---- desks --------------------------------------------------------------------------------
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 48; screenCanvas.height = 32;
  const sctx = screenCanvas.getContext('2d');

  function screen(g, x, y, w, h, status, t, seed, drawScreen) {
    sctx.setTransform(4, 0, 0, 4, 0, 0);
    sctx.clearRect(0, 0, 12, 8);
    drawScreen(sctx, 0, 0, status, t, seed);
    g.save();
    rr(g, x, y, w, h, 0.6, '#000');
    g.clip();
    g.imageSmoothingEnabled = true;
    g.drawImage(screenCanvas, x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x, y, w, h / 2);
    g.restore();
  }

  function drawDesk(g, d, t, owner, I) {
    const X = d.tx * T, Y = d.ty * T;
    const mascot = PO.mascots.forRole(d.role.id) || {};
    const st = I.deskStatus(d);
    const working = st && st !== 'idle';
    // partition
    rr(g, X + 31, Y - 13, 3.2, 28, 1.2, '#2b2e36', LINE, 0.5);
    rr(g, X + 30.6, Y - 13.6, 4, 1.6, 0.8, '#4a4e58');
    // legs + top
    rr(g, X + 2, Y + 11, 2, 5, 0.6, '#26282e'); rr(g, X + 27, Y + 11, 2, 5, 0.6, '#26282e');
    rr(g, X, Y + 3, 31, 10, 1.6, '#d6c4a5', LINE, 0.55);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(X + 1, Y + 3.6, 29, 0.8);
    rr(g, X, Y + 11, 31, 3, 1, '#ad9b7d', LINE, 0.45);
    if (mascot.device !== 'laptop') {
      rr(g, X + 4.5, Y - 9, 16, 12, 1.2, '#16171c', LINE, 0.5);
      screen(g, X + 5.6, Y - 7.9, 13.8, 9.4, st, t, d.tx + d.ty, I.drawScreen);
      rr(g, X + 11, Y + 3, 3, 2.2, 0.5, '#16171c'); rr(g, X + 8.5, Y + 4.4, 8, 1.4, 0.6, '#16171c');
      if (working) { g.fillStyle = 'rgba(150,200,255,0.08)'; ell(g, X + 13, Y - 3, 12, 9, 'rgba(150,200,255,0.08)'); }
      // keyboard + hands
      rr(g, X + 18, Y + 6.4, 11, 2.6, 0.6, '#eceef1', LINE, 0.4);
      if (owner && owner.atTarget && owner.pose === 'sitDesk') {
        const typing = ['typing', 'running', 'planning'].includes(owner.data.status);
        const k = typing ? Math.sin(t * 22) * 0.6 : 0;
        ell(g, X + 20.5, Y + 6.2 - k, 1.5, 1.3, owner.look.skin, LINE, 0.45); ell(g, X + 26.5, Y + 6.2 + k, 1.5, 1.3, owner.look.skin, LINE, 0.45);
      }
    } else {
      // books + small plant where a monitor would be
      rr(g, X + 5, Y - 1.5, 9, 2.2, 0.4, '#3e8ef7', LINE, 0.35); rr(g, X + 5.6, Y - 3.6, 8, 2.1, 0.4, '#e5484d', LINE, 0.35); rr(g, X + 6.4, Y - 5.6, 7, 2, 0.4, '#f5b83d', LINE, 0.35);
      rr(g, X + 8, Y + 4.4, 4, 3.4, 0.8, '#f4f4f4', LINE, 0.35);
      ell(g, X + 8.6, Y + 3.2, 2, 1.4, '#3cb371'); ell(g, X + 11.4, Y + 3, 2, 1.4, '#2e8b57'); ell(g, X + 10, Y + 2, 1.6, 1.6, '#45c27d');
      // laptop facing the agent: we see the lid with stickers, the screen lights their face
      if (working) ell(g, X + 24, Y - 4, 9, 6, 'rgba(170,210,255,0.16)');
      g.save(); g.translate(X + 24, Y + 3.6);
      poly(g, [-7.4, -4.8, 7.4, -4.8, 6.8, 4, -6.8, 4], '#c3c7cf', LINE, 0.5);
      ell(g, 0, -0.6, 1.5, 1.5, '#f4f4f4');
      rr(g, -5.6, -3.6, 2.6, 2.6, 1.2, mascot.color || '#e93d82'); rr(g, 3.2, 0.6, 2.6, 2.2, 0.8, '#f5b83d'); ell(g, -3.6, 2, 1, 1, '#79c0ff');
      rr(g, -8.2, 4, 16.4, 1.8, 0.8, '#a2a7b1', LINE, 0.4);
      g.restore();
    }
    drawProp(g, X, Y, d.role, t, !!owner && owner.atTarget && !owner.leaving);
    // drink
    if (mascot.item === 'iced') { rr(g, X + 12.6, Y + 6.4, 3, 4.2, 0.6, '#c9a27a', LINE, 0.35); line(g, [X + 14.3, Y + 6.4, X + 14.8, Y + 4.2], '#1d1d24', 0.5); }
    else { rr(g, X + 12.6, Y + 6.6, 3, 3.8, 0.8, '#f4f4f4', LINE, 0.35); ell(g, X + 14.1, Y + 6.8, 1.2, 0.4, '#6b3e1f'); }
    // nameplate
    rr(g, X + 3.5, Y + 9.6, 8, 2.2, 0.8, d.role.color, LINE, 0.35);
    if ((st === 'running' || st === 'browsing') && mascot.device !== 'laptop') {
      const k = (t * 0.35) % 1;
      rr(g, X + 5.5, Y - 12.2, 14, 2, 1, '#16171c'); rr(g, X + 5.9, Y - 11.8, 13.2 * k, 1.2, 0.6, st === 'running' ? '#3fb950' : '#58a6ff');
    }
    if (d.fire) drawFire(g, d, t);
  }

  function drawProp(g, X, Y, role, t, busy) {
    const D = '#1d1d24';
    switch (role.prop) {
      case 'chart': rr(g, X - 2, Y - 5, 7.4, 10, 0.6, '#fafafa', LINE, 0.4); [['#3e8ef7', 3], ['#30a46c', 5.5], ['#f5b83d', 8]].forEach(([c, h], i) => rr(g, X - 1 + i * 2.2, Y + 4 - h, 1.4, h, 0.3, c)); break;
      case 'sticky': rr(g, X, Y + 2.4, 3.4, 3.4, 0.3, '#f5b83d'); rr(g, X + 2.4, Y + 5, 3.4, 3.4, 0.3, '#e93d82'); rr(g, X + 0.4, Y + 8, 3.2, 2.6, 0.3, '#79c0ff'); break;
      case 'deskphone': rr(g, X - 1, Y + 4, 6.4, 4, 1, '#2a2d35', LINE, 0.4); rr(g, X - 1.4, Y + 2.6, 7.2, 2, 1, '#44444c', LINE, 0.35); ell(g, X + 0.4, Y + 6, 0.6, 0.6, busy && Math.floor(t * 2) % 2 ? '#30a46c' : '#5d6580'); break;
      case 'tablet': rr(g, X - 1.4, Y + 5.6, 7.4, 5, 0.8, D, LINE, 0.4); rr(g, X - 0.6, Y + 6.4, 5.8, 3.4, 0.4, '#3d5674'); line(g, [X + 6.4, Y + 3, X + 5.4, Y + 9], '#e6e8ef', 0.6); break;
      case 'dslr': rr(g, X - 1.4, Y + 2.6, 7.6, 4.6, 1, D, LINE, 0.4); ell(g, X + 2.4, Y + 5, 2, 2, '#3a3f4b'); ell(g, X + 2.4, Y + 5, 1, 1, '#79c0ff'); break;
      case 'tripod':
        line(g, [X - 5.5, Y - 6, X - 9, Y + 14], '#5d6580', 0.6); line(g, [X - 5.5, Y - 6, X - 2, Y + 14], '#5d6580', 0.6); line(g, [X - 5.5, Y - 6, X - 5.5, Y + 15], '#5d6580', 0.6);
        rr(g, X - 9.4, Y - 12.4, 8, 5.6, 1, D, LINE, 0.45); ell(g, X - 2.2, Y - 9.6, 1.2, 1.6, '#3a3f4b');
        ell(g, X - 8, Y - 11, 0.6, 0.6, busy && Math.floor(t * 2) % 2 ? '#ff3b3b' : '#5a1d1f');
        break;
      case 'monitor2': rr(g, X - 3.4, Y - 5.6, 9, 8, 0.8, '#16171c', LINE, 0.4); rr(g, X - 2.6, Y - 4.8, 7.4, 5.6, 0.4, '#141820'); rr(g, X - 2.2, Y - 1.4, 3.2, 0.9, 0.3, '#8e4ec6'); rr(g, X + 0.6, Y - 0.2, 3.6, 0.9, 0.3, '#30a46c'); rr(g, X, Y + 2.4, 2, 2, 0.3, '#16171c'); break;
      case 'ringlight':
        line(g, [X - 6, Y - 8, X - 6, Y + 14], '#5d6580', 0.6); line(g, [X - 9, Y + 14.6, X - 3, Y + 14.6], '#5d6580', 0.8);
        g.save(); if (busy) { g.shadowColor = '#fff1b0'; g.shadowBlur = 8; }
        ell(g, X - 6, Y - 12, 4.6, 4.6, null, '#fff3c4', 1.4); g.restore();
        rr(g, X - 7.3, Y - 14, 2.6, 4, 0.6, D);
        break;
      case 'phonestand': rr(g, X, Y, 4, 6.4, 0.8, D, LINE, 0.4); rr(g, X + 0.6, Y + 0.7, 2.8, 5, 0.5, '#fafafa'); heart(g, X + 2, Y + 2.8, 0.9, '#e93d82'); break;
      case 'notebook': rr(g, X - 1.4, Y + 4.6, 7.6, 5.6, 0.6, '#fafafa', LINE, 0.4); line(g, [X, Y + 6.4, X + 5, Y + 6.4], '#9aa4b2', 0.35); line(g, [X, Y + 8, X + 4, Y + 8], '#9aa4b2', 0.35); line(g, [X + 6.6, Y + 3.6, X + 5.6, Y + 9.6], '#3e8ef7', 0.7); break;
      case 'heart': heart(g, X + 2.4, Y + 5, 2.4, '#e93d82'); break;
      case 'duck': ell(g, X + 2.2, Y + 7.4, 2.6, 1.9, '#f5d000', LINE, 0.4); ell(g, X + 2.8, Y + 4.8, 1.5, 1.5, '#f5d000', LINE, 0.4); poly(g, [X + 4.1, Y + 4.8, X + 5.6, Y + 5.2, X + 4.1, Y + 5.6], '#f76b15'); ell(g, X + 2.9, Y + 4.4, 0.35, 0.35, D); break;
      default:
    }
  }

  function drawChair(g, d) {
    const x = d.x, Y = d.ty * T;
    rr(g, x - 8.4, Y - 10, 16.8, 13, 3.2, '#17181d', LINE, 0.5);
    rr(g, x - 7.2, Y - 8.8, 14.4, 10.4, 2.6, '#22242b');
  }

  // ---- furniture -----------------------------------------------------------------------------
  function drawPlant(g, tx, ty, kind) {
    const X = tx * T + 8, Y = ty * T;
    const potColor = kind === 1 ? '#eceff3' : kind === 3 ? '#2a2d35' : '#c0703f';
    if (kind === 2) { // cactus
      rr(g, X - 2.4, Y - 4, 4.8, 14, 2.4, '#3f9a5c', LINE, 0.5); rr(g, X - 6, Y + 1, 3.6, 2.4, 1.2, '#3f9a5c', LINE, 0.45); rr(g, X - 6, Y - 2, 2.4, 4.4, 1.2, '#3f9a5c', LINE, 0.45);
      rr(g, X + 2.4, Y + 3, 3.4, 2.4, 1.2, '#3f9a5c', LINE, 0.45); rr(g, X + 3.4, Y, 2.4, 4.6, 1.2, '#3f9a5c', LINE, 0.45);
      ell(g, X, Y - 4.4, 1.2, 0.9, '#e93d82');
    } else if (kind === 3) { // snake plant
      [-3.4, -1.4, 0.6, 2.6].forEach((dx, i) => { poly(g, [X + dx, Y + 9, X + dx + 0.9, Y - 8 + i * 2, X + dx + 2, Y + 9], '#4c8c4a', LINE, 0.4); line(g, [X + dx + 0.9, Y - 6 + i * 2, X + dx + 1, Y + 6], '#d9c35c', 0.3); });
    } else {
      const leaves = kind === 1 ? [[-5, -1, 0.5], [5, -3, -0.5], [0, -7, 0], [-3, -6, 0.3], [4, 1, -0.3]] : [[-4, 0, 0.4], [4, -1, -0.4], [0, -5, 0], [-2.6, -4, 0.2], [2.8, -4.4, -0.2], [0, 1, 0]];
      leaves.forEach(([dx, dy, rot], i) => {
        g.save(); g.translate(X + dx, Y + dy); g.rotate(rot);
        ell(g, 0, 0, kind === 1 ? 4.2 : 2.6, kind === 1 ? 2.8 : 3.6, i % 2 ? '#3cb371' : '#2e8b57', LINE, 0.45);
        if (kind === 1) line(g, [-3, 0, 3, 0], '#1f6b42', 0.35);
        g.restore();
      });
    }
    poly(g, [X - 4.6, Y + 8, X + 4.6, Y + 8, X + 3.6, Y + 16, X - 3.6, Y + 16], potColor, LINE, 0.5);
    rr(g, X - 5.2, Y + 7, 10.4, 2.4, 1, shade(potColor, -0.1), LINE, 0.45);
  }

  function drawBookshelf(g) {
    const X = 18 * T, Y = 2 * T;
    rr(g, X, Y - 18, 32, 34, 1.2, '#4a3220', LINE, 0.6); rr(g, X + 2, Y - 16, 28, 30, 0.6, '#5c3e27');
    const books = ['#e5484d', '#3e8ef7', '#30a46c', '#f5b83d', '#8e4ec6', '#12a594', '#f76b15'];
    for (let s = 0; s < 3; s++) {
      const sy = Y - 15 + s * 10;
      let bx = X + 3;
      for (let i = 0; bx < X + 27; i++) {
        const w = 2.4 + ((i + s) % 2) * 0.8, h = 6 + ((i * 3 + s) % 3);
        rr(g, bx, sy + 9 - h, w, h, 0.4, books[(i + s * 2) % books.length], LINE, 0.3);
        bx += w + 0.5;
      }
      rr(g, X + 2, sy + 9, 28, 1, 0.3, '#3a2718');
    }
  }

  function drawCoffeeBar(g, t, busy) {
    const X = 21 * T, Y = 2 * T;
    rr(g, X, Y, 48, 15, 1.2, '#2b2e36', LINE, 0.5); rr(g, X - 0.6, Y - 0.6, 49.2, 3, 1, '#d6c4a5', LINE, 0.45);
    line(g, [X + 24, Y + 4, X + 24, Y + 13], '#1c1e23', 0.5); ell(g, X + 22, Y + 8, 0.5, 1.6, '#4a4e58'); ell(g, X + 26, Y + 8, 0.5, 1.6, '#4a4e58');
    // coffee machine
    rr(g, X + 4, Y - 13, 13, 14, 1.4, '#2b2b30', LINE, 0.5); rr(g, X + 5.2, Y - 11.8, 10.6, 4, 0.8, '#44444c');
    ell(g, X + 14, Y - 9.8, 0.7, 0.7, Math.floor(t * 2) % 2 ? '#e5484d' : '#7a1d1f');
    rr(g, X + 8, Y - 4.4, 5, 1, 0.4, '#111'); rr(g, X + 8.6, Y - 2.8, 3.6, 3.4, 0.8, '#fafafa', LINE, 0.3);
    if (busy) for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i * 0.33) % 1; g.globalAlpha = 1 - k; ell(g, X + 10.4 + Math.sin(t * 3 + i), Y - 4 - k * 8, 1 + k, 1 + k, 'rgba(255,255,255,0.7)'); g.globalAlpha = 1; }
    // microwave + cups
    rr(g, X + 28, Y - 8, 15, 9, 1, '#d7dbe1', LINE, 0.45); rr(g, X + 29, Y - 7, 9, 7, 0.6, '#2a2d35'); ell(g, X + 40.5, Y - 4.5, 0.6, 0.6, '#30a46c');
    rr(g, X + 21.6, Y - 3, 3, 3.4, 0.8, '#e5484d', LINE, 0.3); rr(g, X + 44, Y - 2.4, 2.6, 2.8, 0.8, '#3e8ef7', LINE, 0.3);
    // chalk menu board (text in drawWallText)
    rr(g, X + 3, 4, 42, 14, 1.2, '#6b4a2f', LINE, 0.45); rr(g, X + 4.2, 5.2, 39.6, 11.6, 0.8, '#22292b');
  }

  function drawCooler(g) {
    const X = 24 * T + 8, Y = 2 * T;
    rr(g, X - 4, Y - 14, 8, 9.6, 3, 'rgba(150,205,250,0.85)', LINE, 0.5); ell(g, X - 1.6, Y - 11, 1, 2.6, 'rgba(255,255,255,0.6)');
    rr(g, X - 5, Y - 5, 10, 20, 1.4, '#e7ebf0', LINE, 0.5);
    ell(g, X - 2, Y + 1.6, 1, 1, '#3e8ef7'); ell(g, X + 2, Y + 1.6, 1, 1, '#e5484d');
  }

  function drawArcade(g, t, playing) {
    const X = 24 * T, Y = 5 * T;
    rr(g, X + 2, Y - 15, 13, 31, 1.6, '#4a2272', LINE, 0.55); rr(g, X + 3, Y - 13, 11, 27, 1, '#5b2a86');
    rr(g, X + 4, Y - 10.6, 9, 8, 0.8, '#0d0d14', LINE, 0.4);
    if (playing) { const c = ['#e93d82', '#f5b83d', '#3fb950', '#3e8ef7'][Math.floor(t * 4) % 4]; ell(g, X + 6 + (t * 5) % 5, Y - 6.5, 1, 1, c); rr(g, X + 6, Y - 4.4, 4, 0.7, 0.3, '#f5b83d'); }
    rr(g, X + 3, Y - 14, 11, 2.4, 0.8, '#f5b83d');
    rr(g, X + 3, Y, 11, 3, 0.8, '#2a1640'); ell(g, X + 6, Y + 1.4, 1, 1, '#e5484d'); ell(g, X + 10, Y + 1.4, 0.8, 0.8, '#3e8ef7');
  }

  function drawBackdrop(g) {
    const X = 19 * T, Y = 5 * T;
    line(g, [X, Y - 23, X, Y + 15], '#3a3f4b', 1); line(g, [X + 64, Y - 23, X + 64, Y + 15], '#3a3f4b', 1);
    rr(g, X - 2, Y - 24, 68, 2.4, 1.2, '#2a2d35', LINE, 0.4);
    g.fillStyle = vgrad(g, Y - 21, Y + 16, '#f0ecf8', '#d4cbe8');
    g.beginPath(); g.moveTo(X + 1, Y - 21); g.lineTo(X + 63, Y - 21); g.lineTo(X + 63, Y + 6); g.quadraticCurveTo(X + 63, Y + 16, X + 54, Y + 16);
    g.lineTo(X + 10, Y + 16); g.quadraticCurveTo(X + 1, Y + 16, X + 1, Y + 6); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 0.5; g.stroke();
  }

  function drawSoftbox(g, tx, on) {
    const X = tx * T + 8, Y = 6 * T;
    line(g, [X, Y - 6, X, Y + 13], '#5d6580', 0.7); line(g, [X - 4, Y + 13.6, X + 4, Y + 13.6], '#5d6580', 0.8);
    g.save(); if (on) { g.shadowColor = '#fff4d0'; g.shadowBlur = 10; }
    rr(g, X - 7, Y - 17, 14, 11, 1.2, '#16171c', LINE, 0.5);
    rr(g, X - 6, Y - 16, 12, 9, 0.8, on ? '#fffbea' : '#d9dde3');
    g.restore();
  }

  function drawTripod(g, t, rec) {
    const X = 20 * T + 8, Y = 7 * T;
    line(g, [X, Y - 3, X - 4, Y + 13], '#5d6580', 0.6); line(g, [X, Y - 3, X + 4, Y + 13], '#5d6580', 0.6); line(g, [X, Y - 3, X, Y + 14], '#5d6580', 0.6);
    rr(g, X - 4.6, Y - 9, 9.2, 6.4, 1.2, '#16171c', LINE, 0.5); ell(g, X, Y - 9.6, 1.6, 1, '#16171c');
    ell(g, X + 3.4, Y - 7.6, 0.6, 0.6, rec && Math.floor(t * 2) % 2 ? '#ff3b3b' : '#5a1d1f');
  }

  function drawBeanbag(g, tx, ty, c) {
    const X = tx * T + 8, Y = ty * T + 8;
    g.beginPath(); g.moveTo(X - 7.4, Y + 6); g.bezierCurveTo(X - 9, Y - 2, X - 4, Y - 7, X, Y - 6); g.bezierCurveTo(X + 4, Y - 7, X + 9, Y - 2, X + 7.4, Y + 6); g.closePath();
    g.fillStyle = c; g.fill(); g.strokeStyle = LINE; g.lineWidth = 0.55; g.stroke();
    ell(g, X - 2.6, Y - 2.6, 2.4, 1.4, shade(c, 0.18)); curve(g, X - 4, Y + 1, X, Y + 3, X + 4, Y + 1, shade(c, -0.2), 0.5);
  }
  const curve = PO.toon.curve;

  function drawSofa(g) {
    const X = 19 * T, Y = 9 * T;
    rr(g, X - 1, Y - 5, 66, 12, 3, '#26304a', LINE, 0.6);
    rr(g, X, Y + 4, 64, 10, 2.4, '#3a4870', LINE, 0.55);
    for (let i = 1; i < 4; i++) line(g, [X + i * 16, Y + 5, X + i * 16, Y + 13], '#2b365a', 0.5);
    rr(g, X - 4, Y - 2, 6, 16, 2.6, '#26304a', LINE, 0.55); rr(g, X + 62, Y - 2, 6, 16, 2.6, '#26304a', LINE, 0.55);
    g.save(); g.translate(X + 7, Y + 1); g.rotate(-0.15); rr(g, -5, -4, 10, 8, 2.4, '#d6a341', LINE, 0.5); g.restore();
    g.save(); g.translate(X + 57, Y + 1); g.rotate(0.15); rr(g, -4.6, -3.6, 9.2, 7.4, 2.4, '#e2e6ee', LINE, 0.5); g.restore();
  }

  function drawTable(g) {
    const X = 20 * T, Y = 11 * T;
    rr(g, X + 3, Y + 9, 1.6, 6, 0.5, '#4a3220'); rr(g, X + 27.4, Y + 9, 1.6, 6, 0.5, '#4a3220');
    rr(g, X + 1, Y + 3, 30, 7.4, 2, '#8b5a34', LINE, 0.55); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(X + 3, Y + 3.8, 26, 0.6);
    rr(g, X + 7.6, Y + 4.6, 3.4, 3.2, 0.8, '#fafafa', LINE, 0.3); ell(g, X + 9.3, Y + 4.8, 1.3, 0.4, '#6b3e1f');
    rr(g, X + 17, Y + 4.6, 8, 4.4, 0.6, '#f4f4f4', LINE, 0.3); rr(g, X + 18, Y + 5.4, 6, 2.6, 0.4, '#3e8ef7');
  }

  function drawSigns(g) {
    poly(g, [17, 157, 20, 136, 28, 136, 31, 157], '#6b4a2f', LINE, 0.5);
    rr(g, 18.4, 137.4, 11.2, 18.6, 0.6, '#22292b');
  }
  function drawTeamBoard(g) {
    const X = 11 * T, Y = 14 * T;
    line(g, [X + 5, Y + 12, X + 5, Y + 16], '#1b1d22', 1); line(g, [X + 27, Y + 12, X + 27, Y + 16], '#1b1d22', 1);
    rr(g, X - 1, Y - 12, 34, 25, 1.4, '#1b1d22', LINE, 0.5); rr(g, X + 0.6, Y - 10.4, 30.8, 21.8, 0.8, '#22292b');
  }

  // ---- fire ---------------------------------------------------------------------------------------
  function fireOffset(d) {
    const m = PO.mascots.forRole(d.role.id);
    return m && m.device === 'laptop' ? [12, 7] : [0, 0];
  }

  function flame(g, x, y, h, w, color) {
    g.beginPath(); g.moveTo(x - w, y);
    g.bezierCurveTo(x - w, y - h * 0.5, x - w * 0.2, y - h * 0.6, x, y - h);
    g.bezierCurveTo(x + w * 0.2, y - h * 0.6, x + w, y - h * 0.5, x + w, y);
    g.quadraticCurveTo(x, y + w * 0.6, x - w, y); g.fillStyle = color; g.fill();
  }

  function drawFire(g, d, t) {
    const f = d.fire;
    const [ox, oy] = fireOffset(d);
    const X = d.tx * T + ox, Y = d.ty * T + oy;
    rr(g, X + 5.6, Y - 7.9, 13.8, 9.4, 0.6, '#1a0d0a');
    if (f.phase === 'smoke') return;
    const k = f.phase === 'extinguishing' ? Math.max(0, 1 - (t - f.at) / 3) : 1;
    const glow = g.createRadialGradient(X + 12, Y - 8, 1, X + 12, Y - 8, 22);
    glow.addColorStop(0, `rgba(255,140,40,${0.35 * k})`); glow.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = glow; g.fillRect(X - 12, Y - 30, 48, 44);
    for (let i = 0; i < 5; i++) {
      const x = X + 7 + i * 2.6, h = (8 + Math.sin(t * 11 + i * 1.7) * 3 + (i % 2) * 2) * k;
      flame(g, x, Y - 6, h, 2.2 * k + 0.2, '#e5484d');
      flame(g, x, Y - 6, h * 0.7, 1.6 * k + 0.1, '#f76b15');
      flame(g, x, Y - 6, h * 0.38, 1 * k + 0.1, '#ffd84d');
    }
  }

  PO.scene = {
    paintBackground, drawWindow, drawClock, drawWhiteboard, drawNeon, drawBrandSign, skyColor,
    drawDesk, drawChair, drawPlant, drawBookshelf, drawCoffeeBar, drawCooler, drawArcade,
    drawBackdrop, drawSoftbox, drawTripod, drawBeanbag, drawSofa, drawTable, drawSigns, drawTeamBoard,
    drawFire, fireOffset,
  };
})(window.PO = window.PO || {});
