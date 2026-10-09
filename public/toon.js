// Cartoon (vector) renderer for the SnapSense crew: smooth chibi mascots
// with outlines, soft shading, animated faces and emotion effects.
// Units are world units (one floor tile = 16); (x, y) is the feet.
(function (PO) {
  'use strict';

  const LINE = '#1b1d26';
  const MOUTH = '#6a2230';
  const TONGUE = '#f07f8e';
  const SHOE = '#f6f6f4', SOLE = '#c3c8d0';
  const ALIAS = { neutral: 'normal', excited: 'joyful', worried: 'embarrassed', frustrated: 'angry', sleepy: 'tired', surprised: 'shocked' };
  const HEIGHT = 34; // feet to top of the sprout

  const shade = (c, a) => PO.sprites.shade(c, a);

  // ---- tiny drawing helpers ----------------------------------------------------------
  function ell(g, x, y, rx, ry, fill, stroke, lw = 0.7) {
    g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  function rr(g, x, y, w, h, r, fill, stroke, lw = 0.7) {
    g.beginPath();
    r = Math.min(r, w / 2, h / 2);
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  function line(g, pts, color, lw = 0.7, cap = 'round') {
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.strokeStyle = color; g.lineWidth = lw; g.lineCap = cap; g.lineJoin = 'round'; g.stroke();
  }
  function curve(g, x1, y1, cx, cy, x2, y2, color, lw = 0.7) {
    g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(cx, cy, x2, y2);
    g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.stroke();
  }
  // limb: outlined capsule from (x1,y1) to (x2,y2)
  function limb(g, x1, y1, x2, y2, w, color) {
    line(g, [x1, y1, x2, y2], LINE, w + 1.1);
    line(g, [x1, y1, x2, y2], color, w);
  }
  function heart(g, x, y, s, color) {
    g.beginPath();
    g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
    g.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
    g.fillStyle = color; g.fill();
  }
  function star(g, x, y, s, color) {
    g.beginPath();
    g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s);
    g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s);
    g.fillStyle = color; g.fill();
  }
  function drop(g, x, y, s, color) {
    g.beginPath(); g.moveTo(x, y - s * 1.6);
    g.bezierCurveTo(x + s * 1.1, y - s * 0.2, x + s, y + s, x, y + s);
    g.bezierCurveTo(x - s, y + s, x - s * 1.1, y - s * 0.2, x, y - s * 1.6);
    g.fillStyle = color; g.fill();
    ell(g, x - s * 0.3, y, s * 0.25, s * 0.35, 'rgba(255,255,255,0.8)');
  }

  // ---- main entry --------------------------------------------------------------------
  // opts: dir, pose 'stand'|'walk'|'sitDesk'|'sitFront', phase (walk cycle), arms, mood,
  //       blink 0..1, t (seconds), seed
  function draw(g, x, y, look, opts) {
    const dir = opts.dir || 'down';
    const pose = opts.pose || 'stand';
    const mood = ALIAS[opts.mood] || opts.mood || 'normal';
    const t = opts.t || 0, seed = opts.seed || 0;
    const sitting = pose === 'sitDesk' || pose === 'sitFront';
    const walk = pose === 'walk';
    const ph = opts.phase || 0;

    g.save();
    g.translate(x, y);
    if (!sitting) ell(g, 0, 0.2, 7.5, 1.9, 'rgba(0,0,0,0.22)');
    let dy = sitting ? 3 : 0;
    if (walk) dy -= Math.abs(Math.sin(ph)) * 1.3;
    else dy += Math.sin(t * 2.1 + seed) * 0.25; // breathing
    if ((mood === 'joyful' || mood === 'laughing') && !walk) dy -= Math.abs(Math.sin(t * 9)) * (sitting ? 0.8 : 1.6);
    if (mood === 'stressed') g.translate(Math.sin(t * 47) * 0.45, 0);
    g.translate(0, dy);
    if (dir === 'left') g.scale(-1, 1);

    const c = { g, look, opts, mood, t, seed, pose, sitting, walk, ph, dir };
    if (dir === 'up') drawBack(c); else if (dir === 'down') drawFront(c); else drawSide(c);
    if (dir !== 'up') effects(c);
    g.restore();
  }

  // ---- body parts --------------------------------------------------------------------
  function legs(c, view) {
    const { g, look, sitting, walk, ph } = c;
    if (sitting) {
      rr(g, -6.2, -7, 12.4, 4.6, 2, look.pants, LINE);
      ell(g, -3.4, -2.2, 3.2, 1.6, SHOE, LINE); ell(g, 3.4, -2.2, 3.2, 1.6, SHOE, LINE);
      return;
    }
    const a = walk ? Math.sin(ph) : 0;
    if (view === 'side') {
      [[-1, -a], [1, a]].forEach(([k, s]) => {
        const fx = s * 3.2;
        rr(g, -2.8 + fx * 0.5, -7, 5.6, 5.4, 2, k < 0 ? look.pantsDark : look.pants, LINE);
        ell(g, 0.8 + fx, -1.1, 3.8, 1.6, SHOE, LINE);
        line(g, [-2.6 + fx, -0.2, 4.2 + fx, -0.2], SOLE, 0.6);
      });
      return;
    }
    [-1, 1].forEach((k) => {
      const lift = walk ? Math.max(0, Math.sin(ph) * k) * 1.4 : 0;
      rr(g, k * 3 - 2.8, -7, 5.6, 5.6 - lift, 2.2, look.pants, LINE);
      if (view === 'front') line(g, [k * 3 + k * 1.6, -5.4, k * 3 + k * 1.6, -3.6], look.pantsDark, 0.6);
      ell(g, k * 3.3, -1.2 - lift, 3.4, 1.7, SHOE, LINE);
      line(g, [k * 3.3 - 2.8, -0.2 - lift, k * 3.3 + 2.8, -0.2 - lift], SOLE, 0.6);
      if (view === 'front') line(g, [k * 3.3 - 1.2, -2 - lift, k * 3.3 + 1.2, -2 - lift], '#2a2d35', 0.4);
    });
  }

  function torso(c, view) {
    const { g, look } = c;
    g.beginPath();
    g.moveTo(-5.6, -14); g.quadraticCurveTo(0, -15.2, 5.6, -14);
    g.quadraticCurveTo(7.2, -9, 6.6, -5.4); g.quadraticCurveTo(0, -4.6, -6.6, -5.4);
    g.quadraticCurveTo(-7.2, -9, -5.6, -14); g.closePath();
    g.fillStyle = look.hoodie; g.fill(); g.strokeStyle = LINE; g.lineWidth = 0.7; g.stroke();
    if (view === 'back') { ell(g, 0, -13.4, 4.6, 2.2, look.hoodieDark, LINE, 0.5); return; }
    ell(g, 0, -13.6, 4, 1.4, look.hoodieDark);
    if (look.track) {
      line(g, [0, -13, 0, -5], '#f4f4f4', 0.7);
      return;
    }
    if (view === 'front') {
      line(g, [-1.4, -12.8, -1.5, -9.6], look.string, 0.45); line(g, [1.4, -12.8, 1.5, -9.6], look.string, 0.45);
      ell(g, -1.5, -9.4, 0.35, 0.35, look.string); ell(g, 1.5, -9.4, 0.35, 0.35, look.string);
      rr(g, -3.4, -8.6, 6.8, 2.2, 0.8, null, look.hoodieDark, 0.5);
      if (look.hoodieMark) { line(g, [-1.6, -11.6, 1.6, -8.4], look.hoodieMark, 0.8); line(g, [1.6, -11.6, -1.6, -8.4], look.hoodieMark, 0.8); }
    }
  }

  // arm angles: 0 = hanging down, + = forward/outward, ~3 = straight up
  function arm(c, side, angle, holdItem) {
    const { g, look } = c;
    const sx = side * 5.3, sy = -12.6, L = 6.6;
    const hx = sx + Math.sin(angle) * L * side, hy = sy + Math.cos(angle) * L;
    limb(g, sx, sy, hx, hy, 2.9, look.hoodieDark);
    if (look.track) line(g, [sx + side * 0.6, sy + 0.8, hx + side * 0.6, hy - 0.8], '#f4f4f4', 0.5);
    ell(g, hx, hy + 0.4, 1.45, 1.45, look.skin, LINE, 0.55);
    if (holdItem) item(c, holdItem, hx, hy);
    return [hx, hy];
  }

  function item(c, kind, hx, hy) {
    const { g } = c;
    switch (kind) {
      case 'coffee':
        rr(g, hx - 1.7, hy - 3.6, 3.4, 4.6, 0.6, '#8a5a36', LINE, 0.5); rr(g, hx - 2, hy - 4.4, 4, 1.1, 0.4, '#f4f4f4', LINE, 0.45);
        rr(g, hx - 1.7, hy - 2.4, 3.4, 1.4, 0.2, '#d6b48c');
        break;
      case 'iced':
        line(g, [hx + 0.3, hy - 4.4, hx + 0.8, hy - 7], '#1d1d24', 0.6);
        rr(g, hx - 1.8, hy - 4.4, 3.6, 5.4, 0.7, 'rgba(240,226,206,0.95)', LINE, 0.5); rr(g, hx - 1.8, hy - 2.2, 3.6, 3.2, 0.7, '#b07d4f');
        rr(g, hx - 2.1, hy - 4.8, 4.2, 0.9, 0.4, '#f4f4f4', LINE, 0.4);
        break;
      case 'phone': rr(g, hx - 1.2, hy - 3, 2.4, 4, 0.5, '#1d1d24', LINE, 0.4); rr(g, hx - 0.8, hy - 2.6, 1.6, 2.9, 0.3, '#79c0ff'); break;
      case 'tablet': rr(g, hx - 1.4, hy - 4.6, 3.6, 5, 0.6, '#3a3f4b', LINE, 0.45); rr(g, hx - 1, hy - 4.2, 2.8, 4, 0.4, '#9fd3ff'); break;
      default:
    }
  }

  function gear(c, view) {
    const { g, look } = c;
    if (look.backpack && view === 'front') { line(g, [-3.8, -13.6, -3.6, -7.2], '#25262c', 1.1); line(g, [3.8, -13.6, 3.6, -7.2], '#25262c', 1.1); }
    if (look.bag && view === 'front') { line(g, [-4.5, -13.4, 4.2, -6.8], '#3a2f28', 0.8); rr(g, 2.4, -8.4, 4.4, 3.4, 0.8, '#4a3a30', LINE, 0.5); }
    if (look.item === 'camera' && view === 'front') {
      line(g, [-3, -13.5, -2.4, -10], '#1d1d24', 0.5); line(g, [3, -13.5, 2.4, -10], '#1d1d24', 0.5);
      rr(g, -2.8, -10.6, 5.6, 3.6, 0.8, '#1d1d24', LINE, 0.4); ell(g, 0, -8.8, 1.2, 1.2, '#3a3f4b'); ell(g, 0, -8.8, 0.6, 0.6, '#79c0ff');
    }
    if (look.neckphones && view !== 'back') { curve(g, -4.6, -13.5, 0, -11.2, 4.6, -13.5, look.neckphones, 0.9); rr(g, -6.2, -14.4, 2.4, 3, 0.9, look.neckphones, LINE, 0.4); rr(g, 3.8, -14.4, 2.4, 3, 0.9, look.neckphones, LINE, 0.4); }
  }

  // ---- head -----------------------------------------------------------------------------
  const HX = 0, HY = -21.4, RX = 8.6, RY = 7.9;

  function hairBack(c) {
    const { g, look } = c;
    if (!look.hairLong) return;
    g.beginPath();
    g.moveTo(-8.6, -22); g.quadraticCurveTo(-10.2, -12, -7.6, -9.2); g.lineTo(7.6, -9.2);
    g.quadraticCurveTo(10.2, -12, 8.6, -22); g.closePath();
    g.fillStyle = look.hair; g.fill(); g.strokeStyle = LINE; g.lineWidth = 0.7; g.stroke();
  }

  function sprouts(c) {
    const { g, look, t, seed } = c;
    const sway = Math.sin(t * 2.4 + seed) * 0.5;
    const sprout = (x, dir) => {
      g.beginPath(); g.moveTo(x, -28.6);
      g.quadraticCurveTo(x + dir * 0.4 + sway * 0.3, -31.5, x + dir * 2.4 + sway, -32.6);
      g.strokeStyle = LINE; g.lineWidth = 2.1; g.lineCap = 'round'; g.stroke();
      g.strokeStyle = look.skin; g.lineWidth = 1.2; g.stroke();
      ell(g, x + dir * 2.6 + sway, -32.5, 1.3, 1.1, look.skin, LINE, 0.5);
    };
    if (look.gender === 'girl') { sprout(-2.6, -1); sprout(2.6, 1); } else sprout(0.4, 1);
  }

  function skull(c) {
    const { g, look } = c;
    const grad = g.createRadialGradient(HX - 3, HY - 3.5, 1, HX, HY, RX + 1);
    grad.addColorStop(0, look.skinLight); grad.addColorStop(0.55, look.skin); grad.addColorStop(1, look.skinDark);
    ell(g, HX, HY, RX, RY, grad, LINE, 0.75);
  }

  function hairFront(c, view) {
    const { g, look } = c;
    if (!look.hairLong) return;
    if (view === 'front') {
      // side strands + bangs
      rr(g, -9.3, -24, 3.4, 13, 1.7, look.hair, LINE, 0.6);
      rr(g, 5.9, -24, 3.4, 13, 1.7, look.hair, LINE, 0.6);
      g.beginPath(); g.moveTo(-7.4, -24.2); g.quadraticCurveTo(0, -30.6, 7.4, -24.2);
      g.quadraticCurveTo(4, -25.4, 1.5, -23.4); g.quadraticCurveTo(-1, -25.6, -3.5, -23.6); g.quadraticCurveTo(-5.6, -25, -7.4, -24.2);
      g.fillStyle = look.hair; g.fill(); g.strokeStyle = LINE; g.lineWidth = 0.55; g.stroke();
    } else if (view === 'side') {
      rr(g, -9.2, -25, 5, 15, 2.2, look.hair, LINE, 0.6);
    } else {
      rr(g, -8.6, -25, 17.2, 15.5, 4, look.hair, LINE, 0.6);
    }
  }

  function headgear(c, view) {
    const { g, look } = c;
    const h = look.hat;
    if (look.sunglasses && view !== 'back') { rr(g, -6, -28.4, 5.2, 2.6, 1.2, '#121216', LINE, 0.4); rr(g, 0.8, -28.4, 5.2, 2.6, 1.2, '#121216', LINE, 0.4); line(g, [-0.8, -27.4, 0.8, -27.4], '#121216', 0.5); }
    if (h) {
      const dome = (color, bottom) => {
        g.beginPath(); g.moveTo(-8.8, bottom); g.bezierCurveTo(-9, -32.4, 9, -32.4, 8.8, bottom); g.closePath();
        g.fillStyle = color; g.fill(); g.strokeStyle = LINE; g.lineWidth = 0.7; g.stroke();
      };
      if (h.type === 'cap') {
        dome(h.color, -23.4);
        line(g, [0, -30.2, 0, -23.6], shade(h.color, -0.15), 0.4);
        if (view === 'front') { ell(g, 0, -23.4, 8.6, 1.8, shade(h.color, -0.12), LINE, 0.6); rr(g, -1.6, -27.6, 3.2, 1.8, 0.6, h.logo || '#1d1d24'); }
        if (view === 'side') ell(g, 7.6, -23.6, 4.2, 1.3, shade(h.color, -0.12), LINE, 0.6);
      } else if (h.type === 'beanie') {
        dome(h.color, -22.6);
        rr(g, -9, -24.6, 18, 3.2, 1.4, shade(h.color, 0.08), LINE, 0.6);
        for (let i = -7; i <= 7; i += 2) line(g, [i, -24.2, i, -21.8], shade(h.color, 0.2), 0.3);
        if (view === 'front') rr(g, -2, -28.6, 4, 2, 0.6, shade(h.color, 0.3));
      } else if (h.type === 'helmet') {
        dome('#e5484d', -23); ell(g, 0, -23, 9.8, 1.8, '#b42318', LINE, 0.6); rr(g, -1, -31, 2, 7.5, 0.8, '#f5d000');
      } else if (h.type === 'grad') {
        dome('#2a2d35', -25);
        g.beginPath(); g.moveTo(-10, -30); g.lineTo(0, -33.4); g.lineTo(10, -30); g.lineTo(0, -26.8); g.closePath();
        g.fillStyle = '#1d1d24'; g.fill(); g.strokeStyle = LINE; g.stroke();
        line(g, [6, -29.4, 7.4, -25], '#f5b83d', 0.6); ell(g, 7.4, -24.6, 0.7, 0.9, '#f5b83d');
      }
    }
    if (look.headphones) {
      g.beginPath(); g.arc(0, -22, 9.4, Math.PI * 1.05, Math.PI * 1.95);
      g.strokeStyle = LINE; g.lineWidth = 1.9; g.stroke(); g.strokeStyle = look.headphones; g.lineWidth = 1.1; g.stroke();
      if (view === 'side') rr(g, -2, -24.4, 3.6, 5.4, 1.4, look.headphones, LINE, 0.5);
      else { rr(g, -10.6, -23.6, 3.2, 5.4, 1.4, look.headphones, LINE, 0.5); rr(g, 7.4, -23.6, 3.2, 5.4, 1.4, look.headphones, LINE, 0.5); }
    }
    if (look.bow && view !== 'back') {
      g.save(); g.translate(6.2, -27.6); g.rotate(0.3);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-3, -1.8); g.lineTo(-3, 1.8); g.closePath(); g.moveTo(0, 0); g.lineTo(3, -1.8); g.lineTo(3, 1.8); g.closePath();
      g.fillStyle = look.bow; g.fill(); g.strokeStyle = LINE; g.lineWidth = 0.45; g.stroke();
      ell(g, 0, 0, 0.9, 0.9, shade(look.bow, -0.15), LINE, 0.4);
      g.restore();
    }
  }

  // ---- faces ------------------------------------------------------------------------------
  function eye(c, x, y, o) {
    const { g, look } = c;
    const lidColor = shade(look.skin, -0.16);
    switch (o.shape) {
      case 'happy': curve(g, x - 2, y + 0.6, x, y - 2.2, x + 2, y + 0.6, LINE, 0.85); return;
      case 'closed': curve(g, x - 2, y, x, y + 1.6, x + 2, y, LINE, 0.75); return;
      case 'laugh': line(g, [x - 1.8 * o.side, y - 1.4, x + 1.2 * o.side, y, x - 1.8 * o.side, y + 1.4], LINE, 0.85); return;
      case 'heart': heart(g, x, y - 0.2, 2, '#e93d82'); return;
      case 'wide':
        ell(g, x, y, 2.5, 2.8, '#ffffff', LINE, 0.55); ell(g, x, y, 0.75, 0.75, LINE); return;
      default: {
        ell(g, x, y, 2.05, 2.45, '#ffffff');
        const gx = o.gx || 0, gy = o.gy || 0;
        g.save(); g.beginPath(); g.ellipse(x, y, 2.05, 2.45, 0, 0, Math.PI * 2); g.clip();
        ell(g, x + gx, y + gy + 0.2, 1.55, 1.85, look.iris);
        ell(g, x + gx, y + gy + 0.3, 0.8, 0.95, '#0b0b10');
        ell(g, x + gx - 0.55, y + gy - 0.55, 0.55, 0.55, '#ffffff');
        ell(g, x + gx + 0.6, y + gy + 0.8, 0.25, 0.25, 'rgba(255,255,255,0.8)');
        const lid = Math.min(1, o.lid || 0);
        if (lid > 0) { g.fillStyle = lidColor; g.fillRect(x - 2.2, y - 2.6, 4.4, 5.1 * lid); }
        g.restore();
        ell(g, x, y, 2.05, 2.45, null, LINE, 0.45);
        const ly = y - 2.45 + 4.9 * Math.min(1, o.lid || 0);
        line(g, [x - 2.2, ly + 0.15, x + 2.2, ly - 0.1], LINE, (o.lid || 0) > 0.05 ? 0.75 : 0.55);
      }
    }
  }

  function brows(c, kind) {
    const { g, look } = c;
    const col = look.brow && look.brow !== '#e6e8ef' ? look.brow : LINE;
    const y = -25.4;
    switch (kind) {
      case 'down': line(g, [-5, y - 0.6, -2, y + 0.8], col, 0.75); line(g, [5, y - 0.6, 2, y + 0.8], col, 0.75); break;
      case 'up': line(g, [-5, y + 0.6, -2, y - 0.8], col, 0.65); line(g, [5, y + 0.6, 2, y - 0.8], col, 0.65); break;
      case 'flat': line(g, [-5, y + 0.4, -2, y + 0.4], col, 0.7); line(g, [5, y + 0.4, 2, y + 0.4], col, 0.7); break;
      case 'raise': line(g, [5, y - 1, 2, y - 1.2], col, 0.6); break;
      default:
    }
  }

  function mouth(c, kind) {
    const { g } = c;
    const y = -16.6;
    switch (kind) {
      case 'smile': curve(g, -1.8, y - 0.4, 0, y + 1.5, 1.8, y - 0.4, MOUTH, 0.65); break;
      case 'grin':
        g.beginPath(); g.moveTo(-2.2, y - 0.6); g.quadraticCurveTo(0, y + 3.2, 2.2, y - 0.6); g.closePath();
        g.fillStyle = MOUTH; g.fill(); ell(g, 0, y + 0.9, 1, 0.6, TONGUE); break;
      case 'laugh':
        g.beginPath(); g.moveTo(-2.8, y - 1); g.quadraticCurveTo(0, y + 4, 2.8, y - 1); g.closePath();
        g.fillStyle = MOUTH; g.fill(); rr(g, -2.2, y - 0.9, 4.4, 0.8, 0.3, '#ffffff'); ell(g, 0, y + 1.6, 1.3, 0.7, TONGUE); break;
      case 'frown': curve(g, -1.7, y + 0.8, 0, y - 0.9, 1.7, y + 0.8, MOUTH, 0.65); break;
      case 'wavy':
        g.beginPath(); g.moveTo(-2, y); g.quadraticCurveTo(-1, y - 0.9, 0, y); g.quadraticCurveTo(1, y + 0.9, 2, y);
        g.strokeStyle = MOUTH; g.lineWidth = 0.55; g.stroke(); break;
      case 'o': ell(g, 0, y, 0.9, 1.1, MOUTH); break;
      case 'bigo': ell(g, 0, y + 0.3, 1.4, 1.8, MOUTH); break;
      case 'side': curve(g, 0.4, y + 0.1, 1.5, y + 0.6, 2.6, y - 0.2, MOUTH, 0.6); break;
      case 'teeth':
        rr(g, -2.4, y - 1, 4.8, 2.2, 0.6, '#ffffff', MOUTH, 0.45);
        line(g, [-2.2, y + 0.1, 2.2, y + 0.1], '#9aa0aa', 0.3); line(g, [-0.8, y - 0.9, -0.8, y + 1.1], '#9aa0aa', 0.3); line(g, [0.8, y - 0.9, 0.8, y + 1.1], '#9aa0aa', 0.3);
        break;
      default: curve(g, -1, y, 0, y + 0.5, 1, y, MOUTH, 0.6);
    }
  }

  function blush(c, strong) {
    const { g } = c;
    const col = strong ? 'rgba(255,105,140,0.55)' : 'rgba(255,120,150,0.35)';
    ell(g, -5.3, -17.6, 1.9, 1, col); ell(g, 5.3, -17.6, 1.9, 1, col);
    if (strong) [-6.2, -5.2, -4.2].forEach((x) => { line(g, [x, -18.1, x - 0.5, -17.1], 'rgba(220,60,100,0.6)', 0.3); line(g, [-x, -18.1, -x - 0.5, -17.1], 'rgba(220,60,100,0.6)', 0.3); });
  }

  function face(c) {
    const { g, look, mood, opts, t } = c;
    const blink = opts.blink || 0;
    const L = -3.3, R = 3.3, Y = -20.6;
    const open = (lid, gx = 0, gy = 0) => { eye(c, L, Y, { lid: Math.max(lid, blink), gx, gy }); eye(c, R, Y, { lid: Math.max(lid, blink), gx, gy }); };
    switch (mood) {
      case 'focused': open(0.5, 0, 0.4); brows(c, 'flat'); mouth(c, 'small'); break;
      case 'curious': open(0.1, 0, 0.6); mouth(c, 'o'); blush(c); break;
      case 'happy': eye(c, L, Y, { shape: 'happy' }); eye(c, R, Y, { shape: 'happy' }); mouth(c, 'smile'); blush(c); break;
      case 'joyful': eye(c, L, Y, { shape: 'happy' }); eye(c, R, Y, { shape: 'happy' }); mouth(c, 'grin'); blush(c, true); break;
      case 'laughing':
        eye(c, L, Y, { shape: 'laugh', side: 1 }); eye(c, R, Y, { shape: 'laugh', side: -1 }); mouth(c, 'laugh'); blush(c, true);
        if (Math.floor(t * 4) % 2) { drop(g, -6.4, -19, 0.6, '#9fd3ff'); drop(g, 6.4, -19, 0.6, '#9fd3ff'); }
        break;
      case 'love': eye(c, L, Y, { shape: 'heart' }); eye(c, R, Y, { shape: 'heart' }); mouth(c, 'smile'); blush(c, true); break;
      case 'sad':
        open(0.3, 0, 0.6); brows(c, 'up'); mouth(c, 'frown');
        drop(g, -4.6, -17.6 + ((t * 6) % 4), 0.55, '#7cc4ea');
        break;
      case 'angry':
        open(0.3, 0, 0); brows(c, 'down'); mouth(c, 'frown');
        ell(g, 0, -17.6, 6.5, 1.6, 'rgba(229,72,77,0.18)');
        break;
      case 'shocked': eye(c, L, Y, { shape: 'wide' }); eye(c, R, Y, { shape: 'wide' }); mouth(c, 'bigo'); break;
      case 'embarrassed': open(0.3, -0.8, 0.3); mouth(c, 'wavy'); blush(c, true); break;
      case 'tired':
        eye(c, L, Y, { shape: 'closed' }); eye(c, R, Y, { shape: 'closed' });
        ell(g, L, Y + 2.2, 1.6, 0.5, 'rgba(80,60,130,0.25)'); ell(g, R, Y + 2.2, 1.6, 0.5, 'rgba(80,60,130,0.25)');
        mouth(c, Math.sin(t * 0.8) > 0.7 ? 'bigo' : 'o');
        break;
      case 'thinking': open(0.2, 0.7, -0.7); brows(c, 'raise'); mouth(c, 'side'); break;
      case 'stressed':
        eye(c, L, Y, { shape: 'laugh', side: 1 }); eye(c, R, Y, { shape: 'laugh', side: -1 }); mouth(c, 'teeth');
        ell(g, 0, -25.6, 6, 1.4, 'rgba(70,80,140,0.2)');
        break;
      default: { // normal: the chill half-lidded look
        eye(c, L, Y, { lid: Math.max(0.38, blink) });
        if (look.wink && !blink) eye(c, R, Y, { shape: 'happy' }); else eye(c, R, Y, { lid: Math.max(0.38, blink) });
        mouth(c, 'small'); blush(c);
      }
    }
    if (look.glasses) {
      rr(g, -6.4, -23.4, 6.2, 5.6, 1.6, null, '#121216', 0.9); rr(g, 0.2, -23.4, 6.2, 5.6, 1.6, null, '#121216', 0.9);
      line(g, [-0.2, -21.6, 0.2, -21.6], '#121216', 0.8);
      ell(g, -4.6, -22.2, 0.8, 0.4, 'rgba(255,255,255,0.35)'); ell(g, 2, -22.2, 0.8, 0.4, 'rgba(255,255,255,0.35)');
    }
  }

  function sideFace(c) {
    const { g, look, mood, opts } = c;
    const blink = opts.blink || 0;
    const x = 4.4, y = -20.6;
    if (blink > 0.6 || mood === 'tired') eye(c, x, y, { shape: 'closed' });
    else if (mood === 'happy' || mood === 'joyful') eye(c, x, y, { shape: 'happy' });
    else if (mood === 'laughing' || mood === 'stressed') eye(c, x, y, { shape: 'laugh', side: -1 });
    else if (mood === 'love') eye(c, x, y, { shape: 'heart' });
    else if (mood === 'shocked') eye(c, x, y, { shape: 'wide' });
    else eye(c, x, y, { lid: mood === 'focused' ? 0.5 : 0.35, gx: 0.6 });
    g.save(); g.translate(5, 0);
    mouth(c, mood === 'laughing' ? 'laugh' : mood === 'joyful' ? 'grin' : mood === 'happy' || mood === 'love' ? 'smile' : mood === 'shocked' ? 'bigo' : mood === 'sad' || mood === 'angry' ? 'frown' : 'small');
    g.restore();
    ell(g, 6.2, -17.6, 1.5, 0.9, 'rgba(255,120,150,0.4)');
    if (look.glasses) rr(g, 1.6, -23.4, 6, 5.6, 1.6, null, '#121216', 0.9);
  }

  // ---- views ------------------------------------------------------------------------------
  function armAngles(c) {
    const { opts, walk, ph, pose, mood, t } = c;
    const sw = walk ? Math.sin(ph) * 0.55 : 0;
    let l = -sw * 0.6 + 0.12, r = sw * 0.6 + 0.12;
    if (pose === 'sitDesk') {
      l = r = 0.9;
      if (opts.typing) { l += Math.sin(t * 22) * 0.12; r -= Math.sin(t * 22) * 0.12; }
    }
    if (opts.arms === 'wave') r = 2.6 + Math.sin(t * 10) * 0.35;
    if (opts.arms === 'cheer') { l = r = 2.7 + Math.sin(t * 9) * 0.2; }
    if (mood === 'thinking' && !walk && !opts.arms) r = 2.2;
    return [l, r];
  }

  function drawFront(c) {
    const { look, pose, opts, mood } = c;
    hairBack(c);
    legs(c, 'front');
    torso(c, 'front');
    gear(c, 'front');
    const [la, ra] = armAngles(c);
    const hold = pose !== 'sitDesk' && !opts.arms;
    arm(c, -1, la, hold && (look.item === 'coffee' || look.item === 'iced') ? look.item : null);
    arm(c, 1, ra, hold && mood !== 'thinking' && (look.item === 'phone' || look.item === 'tablet') ? look.item : null);
    if (look.item === 'skate' && pose === 'stand') skateboard(c, 10.5);
    sprouts(c);
    skull(c);
    face(c);
    hairFront(c, 'front');
    headgear(c, 'front');
  }

  function drawBack(c) {
    const { g, look } = c;
    legs(c, 'back');
    torso(c, 'back');
    const [la, ra] = armAngles(c);
    arm(c, -1, la); arm(c, 1, ra);
    if (look.backpack) { rr(g, -4.8, -13.4, 9.6, 8, 2, '#25262c', LINE, 0.6); rr(g, -3.4, -10, 6.8, 3.4, 1.2, '#33343c'); }
    sprouts(c);
    skull(c);
    hairFront(c, 'back');
    headgear(c, 'back');
  }

  function drawSide(c) {
    const { g, look, walk, ph, opts } = c;
    if (look.backpack) rr(g, -8.6, -13.6, 4.4, 8, 1.6, '#25262c', LINE, 0.6);
    legs(c, 'side');
    // side torso
    rr(g, -5, -14.4, 10, 9.4, 3.4, look.hoodie, LINE, 0.7);
    const sw = walk ? Math.sin(ph) * 0.6 : 0;
    const a = opts.arms ? 2.6 : sw + 0.1;
    const sx = 0.5, sy = -12.8;
    const hx = sx + Math.sin(a) * 6.6, hy = sy + Math.cos(a) * 6.6;
    limb(g, sx, sy, hx, hy, 2.9, look.hoodieDark);
    ell(g, hx, hy + 0.3, 1.45, 1.45, look.skin, LINE, 0.55);
    if (look.item === 'coffee' || look.item === 'iced') item(c, look.item, hx, hy);
    sprouts(c);
    skull(c);
    hairFront(c, 'side');
    sideFace(c);
    headgear(c, 'side');
  }

  function skateboard(c, x) {
    const { g } = c;
    rr(g, x - 1.4, -17, 2.8, 17, 1.4, '#6b4a2f', LINE, 0.55);
    ell(g, x, -15.6, 1.2, 0.9, '#e6e2da', LINE, 0.4); ell(g, x, -1.6, 1.2, 0.9, '#e6e2da', LINE, 0.4);
  }

  // ---- emotion effects ----------------------------------------------------------------------
  function effects(c) {
    const { g, mood, t } = c;
    switch (mood) {
      case 'happy': case 'joyful': case 'laughing': {
        const k = (Math.sin(t * 5) + 1) / 2;
        star(g, -11, -27, 1.2 + k * 0.8, '#ffd84d');
        star(g, 11, -31, 2 - k * 0.8, '#ffe58a');
        if (mood !== 'happy') star(g, 12.5, -22, 0.9 + k * 0.6, '#ffd84d');
        break;
      }
      case 'love': {
        for (let i = 0; i < 2; i++) {
          const p = ((t * 0.7 + i * 0.5) % 1);
          g.globalAlpha = 1 - p;
          heart(g, 9 + Math.sin(t * 3 + i) * 1.5 - i * 18, -27 - p * 9, 1.6 + i * 0.3, i ? '#ff8fc0' : '#e93d82');
          g.globalAlpha = 1;
        }
        break;
      }
      case 'angry': {
        g.save(); g.translate(8.4, -28.6);
        g.strokeStyle = '#e5484d'; g.lineWidth = 0.9; g.lineCap = 'round';
        for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0.7, -2.4); g.quadraticCurveTo(0.3, -0.8, 2.4, -0.7); g.stroke(); }
        g.restore();
        break;
      }
      case 'shocked': text(g, '?!', 10.5, -30, 6, '#e5484d'); break;
      case 'embarrassed': drop(g, 9.6, -24 + ((t * 3) % 3), 1, '#8fd0f5'); break;
      case 'stressed': {
        g.save(); g.translate(0, -36);
        g.strokeStyle = '#4a4e58'; g.lineWidth = 0.6;
        g.beginPath();
        for (let i = 0; i <= 40; i++) {
          const a = i / 40 * Math.PI * 6 + t * 6;
          const r = 2 + (i % 7) * 0.25;
          const px = -6 + i * 0.3 + Math.cos(a) * r, py = Math.sin(a) * r * 0.6;
          if (i) g.lineTo(px, py); else g.moveTo(px, py);
        }
        g.stroke(); g.restore();
        drop(g, 9.6, -23 + ((t * 4) % 3), 0.9, '#8fd0f5');
        break;
      }
      case 'tired': {
        const p = (t * 0.6) % 1;
        g.globalAlpha = 1 - p * 0.8;
        text(g, 'z', 9 + p * 2, -28 - p * 6, 4 + p * 2, '#c9d1d9');
        text(g, 'Z', 12 + p * 2, -33 - p * 6, 3 + p * 2, '#e6e8ef');
        g.globalAlpha = 1;
        break;
      }
      case 'thinking': {
        const n = Math.floor(t * 2.5) % 4;
        for (let i = 0; i < n; i++) ell(g, 8.5 + i * 2.2, -30 - i * 0.6, 0.75, 0.75, '#e6e8ef', LINE, 0.3);
        break;
      }
      default:
    }
  }

  function text(g, s, x, y, size, color) {
    g.font = `800 ${size}px "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = size * 0.22; g.strokeStyle = '#1b1d26'; g.strokeText(s, x, y);
    g.fillStyle = color; g.fillText(s, x, y);
  }

  // Face drawn into a square canvas for the 3D head texture.
  function drawFaceTexture(g, size, look, mood, blink, t) {
    g.save();
    g.clearRect(0, 0, size, size);
    g.scale(size / 18, size / 18);
    g.translate(9, 29.4);
    const c = { g, look, mood: ALIAS[mood] || mood || 'normal', opts: { blink }, t, seed: 0 };
    face(c);
    g.restore();
  }

  PO.toon = { draw, drawFaceTexture, HEIGHT, ell, rr, line, curve, heart, star, drop, text };
})(window.PO = window.PO || {});
