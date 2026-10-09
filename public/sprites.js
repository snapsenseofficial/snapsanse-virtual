// Procedural pixel-art characters. No image assets: every worker is drawn
// from a palette picked by hashing the agent id, so each session gets a
// stable, unique look.
(function (PO) {
  'use strict';

  const SKIN = ['#f6d5b8', '#eab68f', '#cf9466', '#a86b45', '#7a4a2e', '#55331f'];
  const HAIR = ['#2b1d14', '#4a2f1e', '#8a4b2a', '#d9a441', '#e8e2d0', '#b8322a', '#2a4d9c', '#6d3aa0', '#151515', '#e86fa0'];
  const SHIRT = ['#e5484d', '#3e8ef7', '#30a46c', '#f5b83d', '#8e4ec6', '#f76b15', '#12a594', '#f0f0f0', '#3a4a63', '#e93d82', '#5b5bd6', '#a18072'];
  const PANTS = ['#26324a', '#3a3f4b', '#1d2a44', '#5a4032', '#2f3e46', '#4b3a5c'];
  const NAMES = ['Aiman', 'Siti', 'Kai', 'Mei', 'Raj', 'Nora', 'Zack', 'Lina', 'Hana', 'Dani', 'Iris', 'Omar',
    'Yuki', 'Ravi', 'Tasha', 'Faris', 'Ezra', 'Maya', 'Leo', 'Aisyah', 'Juno', 'Ben', 'Sara', 'Theo'];

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
  const SHOE = '#22222a';

  // Draw a 10x17 character. (cx, by) = center x, bottom (feet) y.
  // opts: dir 'down'|'up'|'left'|'right', frame 0..3 (walk), pose 'stand'|'walk'|'sitDesk'|'sitFront',
  //       anim: 'type'|'read'|'think'|'wave'|null, t: time (s), blink bool
  function drawCharacter(g, cx, by, look, opts) {
    const dir = opts.dir || 'down';
    const pose = opts.pose || 'stand';
    const frame = pose === 'walk' ? opts.frame || 0 : 0;
    const ox = Math.round(cx - 5);
    const oy = Math.round(by - 17);
    const flip = dir === 'left';
    const r = (x, y, w, h, c) => {
      g.fillStyle = c;
      g.fillRect(flip ? ox + (10 - x - w) : ox + x, oy + y, w, h);
    };

    // shadow
    if (pose !== 'sitDesk') {
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(ox + 1, oy + 16, 8, 2);
    }

    const bob = pose === 'walk' && (frame === 1 || frame === 3) ? -1 : 0;
    const sitDrop = pose === 'sitFront' ? 2 : 0;
    const top = bob + sitDrop;

    if (dir === 'down') drawFront(r, look, opts, frame, pose, top);
    else if (dir === 'up') drawBack(r, look, opts, frame, pose, top);
    else drawSide(r, look, opts, frame, pose, top);
  }

  function hairTop(r, look, t) {
    r(2, 0 + t, 6, 1, look.hair);
    r(1, 1 + t, 8, 2, look.hair);
    if (look.style === 2) { r(2, -1 + t, 1, 1, look.hair); r(4, -1 + t, 1, 1, look.hair); r(7, -1 + t, 1, 1, look.hair); }
    if (look.style === 3) r(4, -2 + t, 2, 2, look.hair);
  }

  function legs(r, look, frame, pose, t) {
    if (pose === 'sitFront') {
      r(2, 12 + t, 6, 2, look.pants);
      r(2, 14 + t, 2, 1, SHOE); r(6, 14 + t, 2, 1, SHOE);
      return;
    }
    const lUp = frame === 1 ? 1 : 0;
    const rUp = frame === 3 ? 1 : 0;
    r(3, 13 + t, 2, 3 - lUp, look.pants); r(3, 16 + t - lUp, 2, 1, SHOE);
    r(5, 13 + t, 2, 3 - rUp, look.pants); r(5, 16 + t - rUp, 2, 1, SHOE);
  }

  function drawFront(r, look, opts, frame, pose, t) {
    hairTop(r, look, t);
    r(2, 3 + t, 6, 5, look.skin);
    const sideLen = look.style === 1 ? 6 : 2;
    r(1, 3 + t, 1, sideLen, look.hair); r(8, 3 + t, 1, sideLen, look.hair);
    if (opts.blink) { r(3, 5 + t, 1, 1, look.skin); r(6, 5 + t, 1, 1, look.skin); }
    else { r(3, 5 + t, 1, 1, EYE); r(6, 5 + t, 1, 1, EYE); }
    if (look.glasses) { r(2, 5 + t, 3, 1, 'rgba(30,30,40,0.55)'); r(5, 5 + t, 3, 1, 'rgba(30,30,40,0.55)'); r(3, 5 + t, 1, 1, '#9fd3ff'); r(6, 5 + t, 1, 1, '#9fd3ff'); }
    r(4, 7 + t, 2, 1, shadeSkin(look));
    // torso + arms
    r(2, 8 + t, 6, 5, look.shirt);
    r(4, 8 + t, 2, 1, look.skin);
    const swing = pose === 'walk' ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
    if (opts.anim === 'wave') {
      r(8, 5 + t, 1, 4, look.shirtDark); r(8, 4 + t, 1, 1, look.skin);
    } else {
      r(8, 8 + t - swing, 1, 4, look.shirtDark); r(8, 12 + t - swing, 1, 1, look.skin);
    }
    r(1, 8 + t + swing, 1, 4, look.shirtDark); r(1, 12 + t + swing, 1, 1, look.skin);
    legs(r, look, frame, pose, t);
  }

  function drawBack(r, look, opts, frame, pose, t) {
    hairTop(r, look, t);
    r(1, 3 + t, 8, 5, look.hair);
    r(0, 5 + t, 1, 1, look.skin); r(9, 5 + t, 1, 1, look.skin); // ears
    if (look.style === 1) r(2, 8 + t, 6, 2, look.hair);
    r(2, 8 + t, 6, 5, look.shirt);
    if (look.style === 1) r(2, 8 + t, 6, 2, look.hair);
    if (look.style === 3) r(4, 1 + t, 2, 2, shadeHair(look));

    if (pose === 'sitDesk') {
      // arms reaching to keyboard; elbows jiggle while typing
      const tt = opts.t || 0;
      let l = 0, rr = 0;
      if (opts.anim === 'type') { l = Math.floor(tt * 9) % 2; rr = 1 - l; }
      else if (opts.anim === 'read') { l = rr = Math.floor(tt * 1.2) % 2 ? 0 : 0; }
      if (opts.anim === 'wave') {
        r(9, 3 + t, 1, 6, look.shirtDark); r(9, 2 + t, 1, 1, look.skin);
        r(0, 8 + t, 2, 3, look.shirtDark);
      } else {
        r(0, 8 + t - l, 2, 3, look.shirtDark);
        r(8, 8 + t - rr, 2, 3, look.shirtDark);
      }
      return; // chair hides legs
    }
    const swing = pose === 'walk' ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
    r(1, 8 + t - swing, 1, 4, look.shirtDark); r(1, 12 + t - swing, 1, 1, look.skin);
    r(8, 8 + t + swing, 1, 4, look.shirtDark); r(8, 12 + t + swing, 1, 1, look.skin);
    legs(r, look, frame, pose, t);
  }

  function drawSide(r, look, opts, frame, pose, t) {
    // drawn facing right; caller mirrors for left
    r(2, 0 + t, 5, 1, look.hair);
    r(2, 1 + t, 7, 2, look.hair);
    if (look.style === 2) { r(3, -1 + t, 1, 1, look.hair); r(5, -1 + t, 1, 1, look.hair); }
    if (look.style === 3) r(1, 1 + t, 2, 2, look.hair);
    r(3, 3 + t, 5, 5, look.skin);
    r(8, 5 + t, 1, 1, look.skin);
    r(2, 3 + t, 2, look.style === 1 ? 7 : 4, look.hair);
    r(4, 5 + t, 1, 1, look.skin); // ear
    r(6, 5 + t, 1, 1, opts.blink ? look.skin : EYE);
    if (look.glasses) r(5, 5 + t, 3, 1, 'rgba(30,30,40,0.55)');
    r(3, 8 + t, 4, 5, look.shirt);
    if (look.style === 1) r(2, 8 + t, 2, 2, look.hair);
    const sw = pose === 'walk' ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
    r(4 + sw, 8 + t, 2, 4, look.shirtDark); r(4 + sw, 12 + t, 2, 1, look.skin);
    if (pose === 'walk' && frame % 2 === 1) {
      r(2, 13 + t, 2, 3, look.pants); r(6, 13 + t, 2, 3, look.pants);
      r(1, 16 + t, 3, 1, SHOE); r(6, 16 + t, 3, 1, SHOE);
    } else {
      r(4, 13 + t, 3, 3, look.pants); r(4, 16 + t, 4, 1, SHOE);
    }
  }

  function shadeSkin(look) { return shade(look.skin, -0.12); }
  function shadeHair(look) { return shade(look.hair, 0.12); }

  PO.sprites = { lookFor, drawCharacter, shade, hash, NAMES };
})(window.PO = window.PO || {});
