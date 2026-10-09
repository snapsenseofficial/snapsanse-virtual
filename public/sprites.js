// Procedural chibi pixel-art characters with facial expressions.
// No image assets: every worker is drawn from a palette picked by hashing
// the agent id, so each session gets a stable, unique look.
(function (PO) {
  'use strict';

  const SKIN = ['#f6d5b8', '#eab68f', '#cf9466', '#a86b45', '#7a4a2e', '#55331f'];
  const HAIR = ['#2b1d14', '#4a2f1e', '#8a4b2a', '#d9a441', '#e8e2d0', '#b8322a', '#2a4d9c', '#6d3aa0', '#151515', '#e86fa0'];
  const SHIRT = ['#e5484d', '#3e8ef7', '#30a46c', '#f5b83d', '#8e4ec6', '#f76b15', '#12a594', '#f0f0f0', '#3a4a63', '#e93d82', '#5b5bd6', '#a18072'];
  const PANTS = ['#26324a', '#3a3f4b', '#1d2a44', '#5a4032', '#2f3e46', '#4b3a5c'];
  const NAMES = ['Aiman', 'Siti', 'Kai', 'Mei', 'Raj', 'Nora', 'Zack', 'Lina', 'Hana', 'Dani', 'Iris', 'Omar',
    'Yuki', 'Ravi', 'Tasha', 'Faris', 'Ezra', 'Maya', 'Leo', 'Aisyah', 'Juno', 'Ben', 'Sara', 'Theo'];

  // Character box, in logical pixels.
  const CW = 14, CH = 22;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function lookFor(id) {
    const h = hash(String(id));
    const pick = (arr, salt) => arr[(h >>> salt) % arr.length];
    const shirt = pick(SHIRT, 9);
    return {
      skin: pick(SKIN, 0),
      hair: pick(HAIR, 4),
      shirt,
      shirtDark: shade(shirt, -0.14),
      pants: pick(PANTS, 13),
      style: (h >>> 17) % 4, // 0 short, 1 long, 2 spiky, 3 bun
      glasses: ((h >>> 21) % 5) === 0,
      name: pick(NAMES, 23),
    };
  }

  const EYE = '#1d1d24';
  const MOUTH = '#7a2e2e';
  const BLUSH = '#f49ab0';
  const SHOE = '#22222a';
  const DARK = '#1d1d24';

  // Draw a character. (cx, by) = center x, bottom (feet) y.
  // opts: dir 'down'|'up'|'left'|'right', frame 0..3 (walk),
  //       pose 'stand'|'walk'|'sitDesk'|'sitFront', arms 'wave'|'cheer'|null,
  //       mood (see drawFace), blink, t (seconds)
  function drawCharacter(g, cx, by, look, opts) {
    const dir = opts.dir || 'down';
    const pose = opts.pose || 'stand';
    const frame = pose === 'walk' ? opts.frame || 0 : 0;
    const ox = Math.round(cx - CW / 2);
    const oy = Math.round(by - CH);
    const flip = dir === 'left';
    const r = (x, y, w, h, c) => {
      g.fillStyle = c;
      g.fillRect(flip ? ox + (CW - x - w) : ox + x, oy + y, w, h);
    };
    const sitting = pose === 'sitDesk' || pose === 'sitFront';
    if (!sitting) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(ox + 2, oy + CH - 1, 10, 2); }

    const bob = pose === 'walk' && frame % 2 === 1 ? -1 : 0;
    const t = bob + (sitting ? 2 : 0);
    const c = { r, look, opts, frame, pose, t };
    if (dir === 'down') drawFront(c);
    else if (dir === 'up') drawBack(c);
    else drawSide(c);
    if (look.accessory) drawAccessory(c, dir);
    if (dir !== 'up') drawEffects(r, opts.mood, opts.t || 0, t);
  }

  function hairTop(r, look, t) {
    r(2, 0 + t, 10, 1, look.hair);
    r(1, 1 + t, 12, 3, look.hair);
    if (look.style === 2) { r(2, -1 + t, 2, 1, look.hair); r(6, -1 + t, 2, 1, look.hair); r(10, -1 + t, 2, 1, look.hair); }
    if (look.style === 3) r(5, -2 + t, 4, 2, look.hair);
  }

  function legs(c) {
    const { r, look, frame, pose, t } = c;
    if (pose === 'sitFront' || pose === 'sitDesk') {
      r(3, 17 + t, 8, 2, look.pants);
      r(3, 19 + t, 3, 1, SHOE); r(8, 19 + t, 3, 1, SHOE);
      return;
    }
    const lUp = frame === 1 ? 1 : 0, rUp = frame === 3 ? 1 : 0;
    r(4, 17 + t, 3, 4 - lUp, look.pants); r(4, 21 + t - lUp, 3, 1, SHOE);
    r(7, 17 + t, 3, 4 - rUp, look.pants); r(7, 21 + t - rUp, 3, 1, SHOE);
  }

  function arms(c) {
    const { r, look, opts, frame, pose, t } = c;
    const swing = pose === 'walk' ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
    const up = (side) => { // raised arm sits beside the head so the face stays visible
      const x = side ? 13 : -1;
      r(x, 6 + t, 2, 5, look.shirtDark); r(x, 5 + t, 2, 1, look.skin);
    };
    const down = (side, dy) => {
      const x = side ? 11 : 1;
      const len = pose === 'sitDesk' ? 3 : 5;
      r(x, 11 + t + dy, 2, len, look.shirtDark);
      if (pose !== 'sitDesk') r(x, 16 + t + dy, 2, 1, look.skin);
    };
    if (opts.arms === 'cheer') { up(0); up(1); return; }
    down(0, swing);
    if (opts.arms === 'wave') up(1); else down(1, -swing);
  }

  function drawFront(c) {
    const { r, look, opts, t } = c;
    hairTop(r, look, t);
    r(2, 4 + t, 10, 6, look.skin);
    r(3, 10 + t, 8, 1, look.skin);
    const side = look.style === 1 ? 9 : 4;
    r(1, 4 + t, 1, side, look.hair); r(12, 4 + t, 1, side, look.hair);
    if (look.style === 0) r(2, 4 + t, 4, 1, look.hair);
    if (look.style === 2) r(8, 4 + t, 3, 1, look.hair);
    drawFace(r, look, opts.mood, opts.blink, t);
    r(3, 11 + t, 8, 6, look.shirt);
    r(6, 11 + t, 2, 1, look.skin);
    arms(c);
    legs(c);
  }

  function drawBack(c) {
    const { r, look, t } = c;
    hairTop(r, look, t);
    r(1, 4 + t, 12, 7, look.hair);
    r(0, 6 + t, 1, 2, look.skin); r(13, 6 + t, 1, 2, look.skin);
    if (look.style === 3) r(5, 1 + t, 4, 2, shade(look.hair, 0.12));
    r(3, 11 + t, 8, 6, look.shirt);
    if (look.style === 1) r(2, 11 + t, 10, 3, look.hair);
    arms(c);
    legs(c);
  }

  function drawSide(c) {
    // drawn facing right; mirrored for left
    const { r, look, opts, frame, pose, t } = c;
    r(3, 0 + t, 8, 1, look.hair);
    r(2, 1 + t, 10, 3, look.hair);
    if (look.style === 2) { r(4, -1 + t, 2, 1, look.hair); r(8, -1 + t, 2, 1, look.hair); }
    if (look.style === 3) r(1, 1 + t, 3, 3, look.hair);
    r(4, 4 + t, 8, 6, look.skin);
    r(5, 10 + t, 6, 1, look.skin);
    r(12, 7 + t, 1, 1, look.skin); // nose
    r(2, 4 + t, 3, look.style === 1 ? 9 : 6, look.hair);
    r(6, 6 + t, 1, 2, shade(look.skin, -0.12)); // ear
    drawSideFace(r, look, opts.mood, opts.blink, t);
    r(4, 11 + t, 6, 6, look.shirt);
    if (look.style === 1) r(3, 11 + t, 2, 3, look.hair);
    const sw = pose === 'walk' ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
    if (opts.arms === 'wave' || opts.arms === 'cheer') { r(8, 6 + t, 2, 5, look.shirtDark); r(8, 5 + t, 2, 1, look.skin); }
    else { r(6 + sw, 11 + t, 2, 5, look.shirtDark); r(6 + sw, 16 + t, 2, 1, look.skin); }
    if (pose === 'sitFront' || pose === 'sitDesk') {
      r(5, 17 + t, 7, 2, look.pants); r(10, 19 + t, 3, 1, SHOE);
    } else if (pose === 'walk' && frame % 2 === 1) {
      r(3, 17 + t, 3, 4, look.pants); r(8, 17 + t, 3, 4, look.pants);
      r(2, 21 + t, 3, 1, SHOE); r(8, 21 + t, 4, 1, SHOE);
    } else {
      r(5, 17 + t, 4, 4, look.pants); r(5, 21 + t, 5, 1, SHOE);
    }
  }

  // ---- faces ----------------------------------------------------------------------
  // Moods: neutral, focused, happy, excited, worried, frustrated, thinking,
  //        sleepy, curious, surprised
  function drawFace(r, look, mood, blink, t) {
    const lid = shade(look.skin, -0.1);
    const brow = shade(look.hair, -0.05);
    const open = () => {
      r(3, 6 + t, 2, 2, EYE); r(9, 6 + t, 2, 2, EYE);
      r(3, 6 + t, 1, 1, '#ffffff'); r(9, 6 + t, 1, 1, '#ffffff');
    };
    const closed = () => { r(3, 7 + t, 2, 1, EYE); r(9, 7 + t, 2, 1, EYE); };
    const smile = () => { r(5, 8 + t, 1, 1, MOUTH); r(6, 9 + t, 2, 1, MOUTH); r(8, 8 + t, 1, 1, MOUTH); };
    const blush = () => { r(2, 8 + t, 1, 1, BLUSH); r(11, 8 + t, 1, 1, BLUSH); };
    switch (mood) {
      case 'focused':
        if (blink) closed(); else { r(3, 7 + t, 2, 1, EYE); r(9, 7 + t, 2, 1, EYE); r(3, 6 + t, 2, 1, lid); r(9, 6 + t, 2, 1, lid); }
        r(3, 5 + t, 2, 1, brow); r(9, 5 + t, 2, 1, brow);
        r(6, 9 + t, 2, 1, MOUTH);
        break;
      case 'happy':
        r(3, 7 + t, 1, 1, EYE); r(4, 6 + t, 1, 1, EYE); r(5, 7 + t, 1, 1, EYE);
        r(8, 7 + t, 1, 1, EYE); r(9, 6 + t, 1, 1, EYE); r(10, 7 + t, 1, 1, EYE);
        smile(); blush();
        break;
      case 'excited':
        open(); r(4, 7 + t, 1, 1, '#ffffff'); r(10, 7 + t, 1, 1, '#ffffff');
        r(5, 8 + t, 4, 2, MOUTH); r(6, 9 + t, 2, 1, '#e5797f');
        blush();
        break;
      case 'worried':
        if (blink) closed(); else open();
        r(3, 5 + t, 1, 1, brow); r(4, 4 + t, 1, 1, brow); r(10, 5 + t, 1, 1, brow); r(9, 4 + t, 1, 1, brow);
        r(5, 9 + t, 1, 1, MOUTH); r(6, 8 + t, 1, 1, MOUTH); r(7, 9 + t, 1, 1, MOUTH); r(8, 8 + t, 1, 1, MOUTH);
        break;
      case 'frustrated':
        open();
        r(3, 4 + t, 1, 1, brow); r(4, 5 + t, 1, 1, brow); r(10, 4 + t, 1, 1, brow); r(9, 5 + t, 1, 1, brow);
        r(5, 9 + t, 1, 1, MOUTH); r(6, 8 + t, 2, 1, MOUTH); r(8, 9 + t, 1, 1, MOUTH);
        r(2, 8 + t, 10, 1, 'rgba(229,72,77,0.25)');
        break;
      case 'thinking':
        r(4, 6 + t, 1, 1, EYE); r(10, 6 + t, 1, 1, EYE); r(3, 7 + t, 2, 1, lid); r(9, 7 + t, 2, 1, lid);
        r(9, 4 + t, 2, 1, brow);
        r(7, 9 + t, 2, 1, MOUTH);
        break;
      case 'sleepy':
        closed();
        r(6, 9 + t, 1, 1, MOUTH);
        break;
      case 'curious':
        if (blink) closed(); else { r(3, 7 + t, 2, 1, EYE); r(9, 7 + t, 2, 1, EYE); r(3, 6 + t, 2, 1, '#ffffff'); r(9, 6 + t, 2, 1, '#ffffff'); }
        r(6, 9 + t, 2, 1, MOUTH);
        break;
      case 'surprised':
        r(3, 5 + t, 2, 3, EYE); r(9, 5 + t, 2, 3, EYE); r(3, 5 + t, 1, 1, '#ffffff'); r(9, 5 + t, 1, 1, '#ffffff');
        r(6, 8 + t, 2, 2, MOUTH);
        break;
      default: // neutral
        if (blink) closed(); else open();
        r(6, 9 + t, 2, 1, MOUTH);
    }
    if (look.glasses) {
      const f = '#2a2d35';
      r(2, 5 + t, 4, 1, f); r(8, 5 + t, 4, 1, f); r(6, 5 + t, 2, 1, f);
      r(2, 6 + t, 1, 2, f); r(5, 6 + t, 1, 2, f); r(8, 6 + t, 1, 2, f); r(11, 6 + t, 1, 2, f);
    }
  }

  function drawSideFace(r, look, mood, blink, t) {
    const closedEye = blink || mood === 'sleepy' || mood === 'happy';
    if (closedEye) r(9, 7 + t, 2, 1, EYE); else { r(9, 6 + t, 2, 2, EYE); r(9, 6 + t, 1, 1, '#ffffff'); }
    if (mood === 'excited' || mood === 'surprised') r(10, 9 + t, 2, 1, MOUTH);
    else if (mood === 'happy') { r(10, 9 + t, 2, 1, MOUTH); r(8, 8 + t, 1, 1, BLUSH); }
    else r(11, 9 + t, 1, 1, MOUTH);
    if (mood === 'frustrated' || mood === 'focused') r(9, 5 + t, 2, 1, shade(look.hair, -0.05));
    if (look.glasses) { r(8, 5 + t, 4, 1, '#2a2d35'); r(8, 6 + t, 1, 2, '#2a2d35'); }
  }

  // Little emotion effects around the head.
  function drawEffects(r, mood, time, t) {
    switch (mood) {
      case 'worried': { // sweat drop sliding down
        const k = Math.floor(time * 3) % 4;
        r(13, 2 + k + t, 1, 1, '#c9e9ff'); r(13, 3 + k + t, 1, 2, '#7cc4ea');
        break;
      }
      case 'frustrated': // anger mark
        r(12, -3 + t, 1, 3, '#e5484d'); r(11, -2 + t, 3, 1, '#e5484d');
        break;
      case 'happy': case 'excited': { // sparkles
        const c = '#ffe08a';
        if (Math.floor(time * 4) % 2) { r(-2, 1 + t, 1, 3, c); r(-3, 2 + t, 3, 1, c); }
        else { r(14, 0 + t, 1, 3, c); r(13, 1 + t, 3, 1, c); }
        break;
      }
      case 'sleepy': { // floating z
        const k = Math.floor(time * 1.5) % 3;
        const c = '#c9d1d9';
        r(13, -1 - k * 2 + t, 3, 1, c); r(14, 0 - k * 2 + t, 1, 1, c); r(13, 1 - k * 2 + t, 3, 1, c);
        break;
      }
      default:
    }
  }

  // ---- job-role accessories ---------------------------------------------------------
  function drawAccessory(c, dir) {
    const { r, look, pose, t } = c;
    const front = dir === 'down', back = dir === 'up', side = !front && !back;
    const col = look.roleColor || '#888';
    switch (look.accessory) {
      case 'beret':
        r(1, -1 + t, 12, 2, DARK); r(3, -2 + t, 7, 1, DARK); r(9, -3 + t, 1, 1, DARK);
        break;
      case 'beanie':
        r(1, -1 + t, 12, 4, col); r(1, 2 + t, 12, 1, shade(col, -0.18)); r(6, -2 + t, 2, 1, '#f0f0f0');
        break;
      case 'cap':
        r(1, -1 + t, 12, 4, col);
        if (front) r(1, 3 + t, 12, 1, shade(col, -0.25));
        if (side) r(10, 3 + t, 4, 1, shade(col, -0.25));
        break;
      case 'headphones':
        r(1, -1 + t, 12, 1, DARK);
        if (side) { r(6, 0 + t, 1, 5, DARK); r(5, 5 + t, 3, 3, col); }
        else { r(0, 0 + t, 1, 5, DARK); r(13, 0 + t, 1, 5, DARK); r(0, 5 + t, 2, 3, col); r(12, 5 + t, 2, 3, col); }
        break;
      case 'camera':
        if (front) { r(4, 11 + t, 1, 2, DARK); r(9, 11 + t, 1, 2, DARK); r(5, 13 + t, 4, 3, DARK); r(6, 14 + t, 2, 1, '#79c0ff'); }
        else if (side) { r(9, 13 + t, 3, 3, DARK); r(11, 14 + t, 1, 1, '#79c0ff'); }
        break;
      case 'tie':
        if (front) { r(6, 11 + t, 2, 1, '#f0f0f0'); r(6, 12 + t, 2, 4, col); }
        break;
      case 'clipboard':
        if (front && pose !== 'sitDesk') { r(0, 13 + t, 3, 5, '#a0683c'); r(0, 14 + t, 3, 3, '#fafafa'); }
        else if (side && pose !== 'sitDesk') r(9, 12 + t, 2, 5, '#a0683c');
        break;
      case 'phone':
        if (front && pose !== 'sitDesk') { r(11, 14 + t, 3, 3, DARK); r(12, 15 + t, 1, 1, col); }
        else if (side && pose !== 'sitDesk') r(9, 13 + t, 2, 3, DARK);
        break;
      case 'helmet': // fire marshal
        r(1, -2 + t, 12, 4, '#e5484d'); r(0, 2 + t, 14, 1, '#b42318'); r(1, 0 + t, 12, 1, '#f5d000');
        if (front) r(6, -2 + t, 2, 3, '#f5d000');
        break;
      case 'hoodie':
        if (front) { r(5, 11 + t, 1, 4, '#f0f0f0'); r(8, 11 + t, 1, 4, '#f0f0f0'); }
        if (back) r(3, 10 + t, 8, 2, look.shirtDark);
        if (side) r(3, 10 + t, 3, 2, look.shirtDark);
        break;
      default:
    }
  }

  // Face only, for the 3D view's head texture (14x12 px).
  function drawFaceTile(g, look, mood, blink) {
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    r(0, 0, 14, 12, look.skin);
    r(0, 0, 14, 3, look.hair);
    if (look.style === 0) r(1, 3, 4, 1, look.hair);
    drawFace(r, look, mood, blink, -1);
  }

  PO.sprites = { lookFor, drawCharacter, drawFaceTile, shade, hash, NAMES, CW, CH };
})(window.PO = window.PO || {});
