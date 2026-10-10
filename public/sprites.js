// Colour helpers and mascot "looks" (palette derived from a mascot's colour).
// The characters themselves are drawn by toon.js (2D) and world3d.js (3D).
(function (PO) {
  'use strict';

  const DARK = '#1d1d24';

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

  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  // Turn a mascot definition (mascots.js) into ready-to-draw colours.
  function mascotLook(m) {
    const dark = lum(m.color) < 0.25;
    return {
      ...m,
      skin: m.color,
      skinDark: shade(m.color, -0.12),
      skinLight: shade(m.color, dark ? 0.12 : 0.16),
      outline: shade(m.color, dark ? 0.18 : -0.38),
      lid: shade(m.color, dark ? 0.1 : -0.28),
      brow: dark ? '#e6e8ef' : shade(m.color, -0.5),
      hair: shade(m.color, -0.07),
      iris: m.iris || DARK,
      hoodieDark: shade(m.hoodie, lum(m.hoodie) < 0.2 ? 0.06 : -0.12),
      pantsDark: shade(m.pants, lum(m.pants) < 0.2 ? 0.08 : -0.12),
      string: lum(m.hoodie) < 0.4 ? '#d9d6cf' : shade(m.hoodie, -0.3),
    };
  }

  // Fallback for ids we know nothing about.
  function lookFor(id) {
    const crew = PO.mascots ? PO.mascots.CREW : null;
    const m = crew ? crew[hash(String(id)) % crew.length] : { name: 'Agent', color: '#7a8299', hoodie: '#1d1d24', pants: '#1b1d22' };
    return mascotLook(m);
  }

  PO.sprites = { lookFor, mascotLook, shade, hash };
})(window.PO = window.PO || {});
