// 3D view of the same office (three.js r128, vendored in public/vendor).
// It reads the 2D simulation every frame, so agents, moods, screens,
// fires and rescues stay in sync. 1 tile = 1 world unit; 2D (x, y) -> 3D (x, z).
(function (PO) {
  'use strict';

  const SRC = window.PO_THREE_URLS || ['vendor/three.min.js', 'vendor/OrbitControls.js'];
  let THREE, renderer, scene, camera, controls, container, clock;
  let built = false, active = false, loading = null, shownOnce = false;
  const I = () => PO.world.internals;
  const shade = (c, a) => PO.sprites.shade(c, a);
  const chars = new Map(); // sim id -> rig
  const deskViews = [];
  let wall, wallCtx, wallTex, wallAt = 0, ring, fireLight, sun, hemi;
  const puffs = [];

  function loadScript(src) {
    return new Promise((res, rej) => {
      const el = document.createElement('script');
      el.src = src; el.onload = res; el.onerror = () => rej(new Error(`Could not load ${src}`));
      document.head.appendChild(el);
    });
  }

  async function ensure() {
    if (built) return;
    if (!loading) loading = (async () => { for (const src of SRC) if (!(src.includes('Orbit') ? window.THREE && window.THREE.OrbitControls : window.THREE)) await loadScript(src); })();
    await loading;
    THREE = window.THREE;
    build();
    built = true;
  }

  // ---- helpers -------------------------------------------------------------------
  const mats = new Map();
  function mat(color, opts = {}) {
    const key = color + JSON.stringify(opts);
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...opts }));
    return mats.get(key);
  }
  function box(w, h, d, color, x, y, z, parent, opts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function cyl(rt, rb, h, color, x, y, z, parent, seg = 12) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function pixelTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    return tex;
  }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  // ---- scene ---------------------------------------------------------------------
  function build() {
    const { T, bg, desks, plants, BEANBAGS } = I();
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#151926');
    scene.fog = new THREE.Fog('#151926', 40, 70);

    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'office3d';
    clock = new THREE.Clock();

    hemi = new THREE.HemisphereLight('#fff6e8', '#5a4030', 0.75);
    scene.add(hemi);
    sun = new THREE.DirectionalLight('#ffe7c4', 0.75);
    sun.position.set(6, 18, 20);
    sun.target.position.set(13, 0, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 14, bottom: -14, near: 1, far: 60 });
    sun.shadow.bias = -0.0008;
    scene.add(sun, sun.target);
    fireLight = new THREE.PointLight('#ff7a2a', 0, 5);
    scene.add(fireLight);

    // floor = the 2D floor art (rugs, desk mats, emblem)
    const B = I().BG_RES;
    const fc = canvas(416 * 3, 224 * 3);
    const fg = fc.getContext('2d');
    fg.drawImage(bg, 0, 32 * B, 416 * B, 224 * B, 0, 0, fc.width, fc.height);
    const floorTex = new THREE.CanvasTexture(fc);
    floorTex.anisotropy = 4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(13, 0, 9);
    floor.receiveShadow = true;
    scene.add(floor);

    // back wall: live texture (windows, whiteboard, sign, neon, clock)
    const WS = 4;
    const wc = canvas(416 * WS, 32 * WS);
    wallCtx = wc.getContext('2d');
    wallTex = new THREE.CanvasTexture(wc);
    wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 2), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }));
    wall.position.set(13, 1, 2);
    wall.receiveShadow = true;
    scene.add(wall);
    box(26, 2, 0.2, '#5b2a1f', 13, 1, 1.89);
    box(26, 0.12, 0.35, '#3b2c1f', 13, 2.04, 1.95);
    // low side/front walls (cut-away dollhouse view)
    box(0.25, 0.7, 11, '#6b5442', 0.88, 0.35, 7.5);
    box(0.25, 0.7, 1.1, '#6b5442', 0.88, 0.35, 14.45);
    box(0.25, 0.7, 13, '#6b5442', 25.12, 0.35, 8.5);
    box(26, 0.35, 0.25, '#6b5442', 13, 0.17, 15.12);
    box(0.06, 1.3, 0.9, '#8d3b3b', 0.95, 0.65, 13.5); // door

    // desks
    for (const d of desks) deskViews.push(buildDesk(d));
    // furniture
    plants.forEach(([x, y], i) => buildPlant(x + 0.5, y + 0.5, i % 4));
    buildLounge(BEANBAGS);

    ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 24), new THREE.MeshBasicMaterial({ color: '#f5b83d', side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    scene.add(ring);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 5; controls.maxDistance = 45;
    controls.autoRotateSpeed = 0.6;
    resetView();

    // click an agent to select it
    let down = null;
    renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera({ x: ((e.clientX - rect.left) / rect.width) * 2 - 1, y: -((e.clientY - rect.top) / rect.height) * 2 + 1 }, camera);
      const hit = ray.intersectObjects([...chars.values()].map((c) => c.root), true)[0];
      let o = hit && hit.object;
      while (o && !o.userData.simId) o = o.parent;
      PO.world.select(o ? o.userData.simId : null);
    });
  }

  function resetView() {
    // pull back far enough to fit the whole floor at the current aspect ratio
    const aspect = camera.aspect || 1.6;
    const dist = Math.max(25, 38 / Math.min(1.8, aspect));
    camera.position.set(13, dist * 0.72, 8.6 + dist * 0.72);
    controls.target.set(13, 0, 8.6);
    controls.update();
  }

  // ---- desks -----------------------------------------------------------------------
  function buildDesk(d) {
    const g = new THREE.Group();
    const x0 = d.tx, z0 = d.ty;
    box(1.9, 0.06, 0.62, '#d6c4a5', x0 + 1, 0.74, z0 + 0.62, g);
    box(1.9, 0.5, 0.05, '#ad9b7d', x0 + 1, 0.46, z0 + 0.92, g);
    [[0.12, 0.36], [1.88, 0.36]].forEach(([dx, dz]) => box(0.06, 0.72, 0.06, '#26282e', x0 + dx, 0.36, z0 + dz, g));
    box(0.5, 0.04, 0.03, d.role.color, x0 + 1.5, 0.6, z0 + 0.95, g); // nameplate
    box(0.07, 1.25, 1.2, '#2b2e36', x0 + 2.02, 0.63, z0 + 0.35, g); // cubicle partition
    box(0.09, 0.06, 1.22, '#4a4e58', x0 + 2.02, 1.27, z0 + 0.35, g);
    // monitor + live screen
    box(0.9, 0.62, 0.05, '#2a2d35', x0 + 0.8, 1.13, z0 + 0.48, g);
    box(0.08, 0.3, 0.05, '#2a2d35', x0 + 0.8, 0.9, z0 + 0.5, g);
    box(0.36, 0.03, 0.2, '#2a2d35', x0 + 0.8, 0.78, z0 + 0.5, g);
    const sc = canvas(12, 8);
    const tex = pixelTexture(sc);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.53), new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.set(x0 + 0.8, 1.13, z0 + 0.51);
    g.add(screen);
    const m = PO.mascots.forRole(d.role.id) || {};
    if (m.device === 'laptop') {
      // laptop in front of the agent instead of a monitor: we see the lid
      g.children.slice(-4).forEach((o) => { o.visible = false; });
      box(0.62, 0.02, 0.42, '#a2a7b1', x0 + 1.5, 0.78, z0 + 0.62, g);
      const lid = box(0.62, 0.42, 0.02, '#c3c7cf', x0 + 1.5, 0.98, z0 + 0.82, g); lid.rotation.x = 0.25;
      box(0.1, 0.1, 0.005, m.color || '#e93d82', x0 + 1.32, 1.04, z0 + 0.86, g);
    } else box(0.62, 0.02, 0.16, '#e3e6ea', x0 + 1.48, 0.78, z0 + 0.72, g); // keyboard
    buildProp(d.role, x0, z0, g);
    // chair behind the agent
    box(0.5, 0.07, 0.48, '#1f2026', x0 + 1.5, 0.46, z0 - 0.02, g);
    box(0.5, 0.55, 0.07, '#1f2026', x0 + 1.5, 0.78, z0 - 0.27, g);
    box(0.5, 0.08, 0.075, d.role.color, x0 + 1.5, 1.02, z0 - 0.27, g);
    cyl(0.04, 0.04, 0.4, '#2a2d35', x0 + 1.5, 0.22, z0 - 0.02, g);
    // flames (hidden until the desk catches fire)
    const flames = new THREE.Group();
    const fl = [];
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), new THREE.MeshBasicMaterial({ color: ['#e5484d', '#f76b15', '#f5d000'][i % 3] }));
      c.position.set(x0 + 0.5 + i * 0.15, 1.6, z0 + 0.48);
      flames.add(c); fl.push(c);
    }
    flames.visible = false;
    g.add(flames);
    scene.add(g);
    return { d, sc, sctx: sc.getContext('2d'), tex, flames, fl };
  }

  function buildProp(role, x0, z0, g) {
    const px = x0 + 0.18, pz = z0 + 0.62, py = 0.77;
    switch (role.prop) {
      case 'trophy': cyl(0.08, 0.05, 0.16, '#f5b83d', px, py + 0.14, pz, g); cyl(0.07, 0.07, 0.04, '#8a6d1f', px, py + 0.02, pz, g); break;
      case 'chart': box(0.3, 0.36, 0.03, '#fafafa', px, py + 0.18, pz - 0.1, g);
        [['#3e8ef7', 0.1], ['#30a46c', 0.18], ['#f5b83d', 0.26]].forEach(([c, h], i) => box(0.05, h, 0.02, c, px - 0.08 + i * 0.08, py + 0.04 + h / 2, pz - 0.08, g)); break;
      case 'sticky': ['#f5b83d', '#e93d82', '#79c0ff'].forEach((c, i) => box(0.1, 0.01, 0.1, c, px - 0.05 + i * 0.07, py + 0.01 + i * 0.005, pz, g)); break;
      case 'deskphone': box(0.22, 0.08, 0.16, '#2a2d35', px, py + 0.04, pz, g); box(0.22, 0.04, 0.06, '#44444c', px, py + 0.1, pz - 0.05, g); break;
      case 'tablet': box(0.28, 0.02, 0.2, '#1d1d24', px, py + 0.01, pz + 0.05, g); cyl(0.01, 0.01, 0.18, '#e6e8ef', px + 0.17, py + 0.02, pz, g); break;
      case 'dslr': box(0.2, 0.13, 0.1, '#1d1d24', px, py + 0.07, pz, g); { const l = cyl(0.045, 0.045, 0.1, '#3a3f4b', px, py + 0.07, pz + 0.09, g); l.rotation.x = Math.PI / 2; } break;
      case 'tripod': {
        const tx = x0 - 0.35, tz = z0 + 0.35;
        for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const leg = cyl(0.015, 0.015, 1.3, '#5d6580', tx + Math.cos(a) * 0.15, 0.62, tz + Math.sin(a) * 0.15, g); leg.rotation.z = Math.cos(a) * 0.15; leg.rotation.x = -Math.sin(a) * 0.15; }
        box(0.26, 0.18, 0.18, '#1d1d24', tx, 1.36, tz, g); box(0.03, 0.03, 0.03, '#e5484d', tx + 0.1, 1.45, tz + 0.09, g, { emissive: '#e5484d' });
        break;
      }
      case 'monitor2': box(0.5, 0.38, 0.04, '#2a2d35', px + 0.05, py + 0.32, pz - 0.15, g); box(0.44, 0.3, 0.01, '#3d5674', px + 0.05, py + 0.32, pz - 0.125, g, { emissive: '#1a2a44' }); break;
      case 'ringlight': {
        const tx = x0 - 0.35, tz = z0 + 0.4;
        cyl(0.015, 0.015, 1.35, '#5d6580', tx, 0.68, tz, g);
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 24), new THREE.MeshStandardMaterial({ color: '#fff6c9', emissive: '#fff1b0', emissiveIntensity: 0.8 }));
        t.position.set(tx, 1.5, tz); g.add(t);
        break;
      }
      case 'phonestand': box(0.1, 0.18, 0.02, '#1d1d24', px, py + 0.1, pz, g); box(0.08, 0.14, 0.005, '#e93d82', px, py + 0.1, pz + 0.012, g, { emissive: '#7a1f45' }); break;
      case 'notebook': box(0.26, 0.02, 0.2, '#fafafa', px, py + 0.01, pz, g); cyl(0.01, 0.01, 0.18, '#3e8ef7', px + 0.16, py + 0.02, pz, g); break;
      case 'duck': {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#f5d000')); b.position.set(px, py + 0.07, pz); b.scale.y = 0.8; g.add(b);
        const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat('#f5d000')); h.position.set(px, py + 0.16, pz + 0.03); g.add(h);
        box(0.04, 0.02, 0.05, '#f76b15', px, py + 0.15, pz + 0.09, g);
        break;
      }
      default: cyl(0.05, 0.05, 0.1, '#fafafa', px, py + 0.05, pz, g);
    }
  }

  function buildPlant(x, z, kind) {
    const g = new THREE.Group();
    cyl(0.2, 0.15, 0.32, kind === 1 ? '#eceff3' : kind === 3 ? '#2a2d35' : '#b5651d', x, 0.16, z, g);
    if (kind === 2) { // cactus
      cyl(0.1, 0.1, 0.6, '#3f9a5c', x, 0.6, z, g); cyl(0.05, 0.05, 0.25, '#3f9a5c', x + 0.14, 0.62, z, g); cyl(0.05, 0.05, 0.2, '#3f9a5c', x - 0.13, 0.55, z, g);
    } else if (kind === 3) { // snake plant
      for (let i = 0; i < 5; i++) { const l = box(0.06, 0.7, 0.02, '#4c8c4a', x - 0.12 + i * 0.06, 0.65, z, g); l.rotation.z = (i - 2) * 0.12; }
    } else {
      const n = kind === 1 ? 5 : 7;
      for (let i = 0; i < n; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(kind === 1 ? 0.2 : 0.16, 8, 6), mat(i % 2 ? '#3cb371' : '#2e8b57'));
        const a = (i / n) * Math.PI * 2;
        s.position.set(x + Math.cos(a) * 0.15, 0.55 + (i % 3) * 0.12, z + Math.sin(a) * 0.15);
        if (kind === 1) s.scale.set(1.3, 0.35, 1);
        s.castShadow = true; g.add(s);
      }
    }
    scene.add(g);
  }

  function buildLounge(BEANBAGS) {
    const g = new THREE.Group();
    // bookshelf
    box(1.9, 1.7, 0.42, '#5a3a22', 19, 0.85, 2.25, g);
    const books = ['#e5484d', '#3e8ef7', '#30a46c', '#f5b83d', '#8e4ec6', '#12a594', '#f76b15'];
    for (let s = 0; s < 3; s++) for (let i = 0; i < 9; i++) box(0.14, 0.32 + (i % 3) * 0.04, 0.3, books[(i + s * 2) % books.length], 18.25 + i * 0.19, 0.4 + s * 0.52, 2.38, g);
    // coffee bar
    box(2.9, 0.92, 0.65, '#8d99ae', 22.5, 0.46, 2.4, g); box(2.95, 0.05, 0.7, '#dfe3e8', 22.5, 0.94, 2.4, g);
    box(0.45, 0.55, 0.4, '#2b2b30', 21.6, 1.24, 2.3, g); box(0.05, 0.05, 0.02, '#e5484d', 21.75, 1.4, 2.51, g, { emissive: '#e5484d' });
    box(0.6, 0.35, 0.4, '#d7dbe1', 23.2, 1.14, 2.3, g); box(0.38, 0.25, 0.01, '#2a2d35', 23.1, 1.14, 2.51, g);
    // water cooler
    box(0.45, 1.0, 0.45, '#e7ebf0', 24.5, 0.5, 2.5, g); cyl(0.17, 0.17, 0.45, '#9fd3ff', 24.5, 1.22, 2.5, g);
    // arcade cabinet
    box(0.7, 1.6, 0.7, '#5b2a86', 24.5, 0.8, 5.5, g);
    box(0.02, 0.45, 0.5, '#e93d82', 24.14, 1.2, 5.5, g, { emissive: '#7a1f45' });
    box(0.25, 0.08, 0.6, '#2a1640', 24.05, 0.95, 5.5, g);
    // photo studio: backdrop, softboxes, camera
    box(4, 2.2, 0.05, '#e9e4f5', 21, 1.1, 5.05, g);
    const sweep = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.9), mat('#ddd6ee')); sweep.rotation.x = -Math.PI / 2; sweep.position.set(21, 0.01, 5.5); sweep.receiveShadow = true; g.add(sweep);
    [18.5, 23.5].forEach((x) => { cyl(0.02, 0.02, 1.5, '#5d6580', x, 0.75, 6.5, g); box(0.6, 0.5, 0.25, '#1d1d24', x, 1.6, 6.5, g); box(0.5, 0.42, 0.01, '#fffbea', x, 1.6, 6.63, g, { emissive: '#fff4d0', emissiveIntensity: 0.6 }); });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const l = cyl(0.015, 0.015, 1.1, '#5d6580', 20.5 + Math.cos(a) * 0.12, 0.52, 7.5 + Math.sin(a) * 0.12, g); l.rotation.z = Math.cos(a) * 0.12; }
    box(0.28, 0.2, 0.2, '#1d1d24', 20.5, 1.12, 7.5, g);
    // sofa + table
    box(4, 0.4, 0.85, '#3a4870', 21, 0.2, 9.55, g); box(4, 0.7, 0.2, '#26304a', 21, 0.55, 9.1, g);
    box(0.2, 0.55, 0.85, '#26304a', 18.95, 0.28, 9.55, g); box(0.2, 0.55, 0.85, '#26304a', 23.05, 0.28, 9.55, g);
    box(1.8, 0.07, 0.6, '#a0683c', 21, 0.42, 11.5, g);
    [[20.2, 11.3], [21.8, 11.3], [20.2, 11.7], [21.8, 11.7]].forEach(([x, z]) => box(0.05, 0.4, 0.05, '#26282e', x, 0.2, z, g));
    box(0.18, 0.02, 0.12, '#3e8ef7', 21.2, 0.47, 11.5, g);
    // bean bags
    BEANBAGS.forEach(([x, y, c]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), mat(c)); b.scale.y = 0.55; b.position.set(x + 0.5, 0.22, y + 0.5); b.castShadow = true; b.receiveShadow = true; g.add(b); });
    scene.add(g);
  }

  // ---- characters ------------------------------------------------------------------
  function sphere(r, color, x, y, z, parent, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat(color, { roughness: 0.6 }));
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }

  // Cartoon mascot: round head with a painted face, sprout, hoodie, baggy pants, sneakers.
  function buildChar(s) {
    const L = s.look;
    const root = new THREE.Group();
    root.userData.simId = s.id;
    const body = new THREE.Group(); root.add(body);
    cyl(0.19, 0.22, 0.36, L.hoodie, 0, 0.52, 0, body, 18);                 // hoodie
    sphere(0.13, L.hoodieDark, 0, 0.7, -0.03, body, 1.3, 0.45, 1);          // hood collar
    const head = new THREE.Group(); head.position.set(0, 0.98, 0); body.add(head);
    sphere(0.29, L.skin, 0, 0, 0, head, 1.08, 1, 1);
    if (L.hairLong) { sphere(0.3, L.hair, 0, -0.06, -0.06, head, 1.12, 1.1, 0.95); }
    // sprout(s)
    const sprout = (x, dir) => {
      const st = cyl(0.025, 0.03, 0.14, L.skin, x, 0.33, 0, head, 8); st.rotation.z = -dir * 0.35;
      sphere(0.05, L.skin, x + dir * 0.06, 0.4, 0, head);
    };
    if (L.gender === 'girl') { sprout(-0.1, -1); sprout(0.1, 1); } else sprout(0.02, 1);
    // painted face
    const fc = canvas(128, 128);
    const faceTex = new THREE.CanvasTexture(fc);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: faceTex, transparent: true }));
    face.position.set(0, 0.05, 0.275); head.add(face);
    const limb = (x, y, r1, r2, h, color, end, endColor) => {
      const pivot = new THREE.Group(); pivot.position.set(x, y, 0); body.add(pivot);
      cyl(r1, r2, h, color, 0, -h / 2, 0, pivot, 12);
      if (end === 'hand') sphere(0.05, endColor, 0, -h - 0.02, 0, pivot);
      if (end === 'shoe') sphere(0.085, '#f6f6f4', 0, -h - 0.02, 0.05, pivot, 1, 0.6, 1.5);
      return pivot;
    };
    const armL = limb(-0.24, 0.66, 0.05, 0.055, 0.28, L.hoodieDark, 'hand', L.skin);
    const armR = limb(0.24, 0.66, 0.05, 0.055, 0.28, L.hoodieDark, 'hand', L.skin);
    const legL = limb(-0.1, 0.36, 0.08, 0.09, 0.3, L.pants, 'shoe');
    const legR = limb(0.1, 0.36, 0.08, 0.09, 0.3, L.pants, 'shoe');
    accessory3d(L, head, body);
    const ext = new THREE.Group(); // fire extinguisher
    cyl(0.07, 0.07, 0.3, '#e5484d', 0, -0.32, 0.08, ext); box(0.04, 0.06, 0.04, '#1d1d24', 0, -0.14, 0.08, ext);
    ext.visible = false; armR.add(ext);
    const label = makeSprite(); root.add(label.sprite);
    const bubble = makeSprite(); root.add(bubble.sprite);
    scene.add(root);
    return { root, body, head, armL, armR, legL, legR, faceCtx: fc.getContext('2d'), faceTex, faceKey: '', label, bubble, ext, rot: 0 };
  }

  function accessory3d(L, head, body) {
    const h = L.hat;
    if (h && (h.type === 'cap' || h.type === 'helmet')) {
      const col = h.type === 'helmet' ? '#e5484d' : h.color;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(col));
      dome.position.set(0, 0.06, 0); dome.scale.set(1.06, 0.8, 1); dome.castShadow = true; head.add(dome);
      const brim = cyl(0.2, 0.2, 0.025, shade(col, -0.12), 0, 0.07, 0.26, head, 20); brim.scale.set(1.2, 1, 0.8);
      if (h.type === 'helmet') box(0.06, 0.2, 0.3, '#f5d000', 0, 0.2, 0.05, head);
      else box(0.08, 0.05, 0.01, h.logo || '#1d1d24', 0, 0.17, 0.27, head);
    } else if (h && h.type === 'beanie') {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.315, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(h.color));
      dome.position.set(0, 0.02, 0); dome.scale.set(1.06, 0.9, 1); head.add(dome);
      cyl(0.315, 0.315, 0.09, shade(h.color, 0.08), 0, 0.04, 0, head, 24).scale.set(1.06, 1, 1);
    } else if (h && h.type === 'grad') {
      box(0.6, 0.03, 0.6, '#1d1d24', 0, 0.3, 0, head); cyl(0.2, 0.22, 0.12, '#2a2d35', 0, 0.23, 0, head, 16);
      box(0.02, 0.18, 0.02, '#f5b83d', 0.25, 0.22, 0.2, head);
    }
    if (L.headphones) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.025, 8, 24, Math.PI), mat(L.headphones));
      band.position.set(0, 0.02, 0); head.add(band);
      sphere(0.08, L.headphones, -0.31, -0.02, 0, head, 0.6, 1, 1); sphere(0.08, L.headphones, 0.31, -0.02, 0, head, 0.6, 1, 1);
    }
    if (L.neckphones) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 20), mat(L.neckphones)); band.rotation.x = Math.PI / 2; band.position.set(0, 0.72, 0.02); body.add(band); }
    if (L.sunglasses) { box(0.16, 0.06, 0.02, '#111114', -0.1, 0.2, 0.25, head); box(0.16, 0.06, 0.02, '#111114', 0.1, 0.2, 0.25, head); }
    if (L.bow) { sphere(0.05, L.bow, 0.16, 0.25, 0.1, head, 1.4, 0.8, 0.6); sphere(0.05, L.bow, 0.26, 0.25, 0.08, head, 1.4, 0.8, 0.6); }
    if (L.backpack) box(0.3, 0.32, 0.14, '#25262c', 0, 0.52, -0.24, body);
    if (L.item === 'camera') box(0.14, 0.1, 0.06, '#1d1d24', 0, 0.55, 0.22, body);
    if (L.track) box(0.02, 0.34, 0.01, '#f4f4f4', 0, 0.52, 0.215, body);
  }

  // Canvas-texture sprite for name tags and speech bubbles.
  function makeSprite() {
    const c = canvas(512, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sprite.renderOrder = 10;
    return { c, ctx: c.getContext('2d'), tex, sprite, key: null };
  }

  function drawLabel(lbl, s, selected) {
    const role = s.look.role;
    const key = `${s.look.name}|${role.short}|${selected}`;
    if (lbl.key === key) return;
    lbl.key = key;
    const g = lbl.ctx;
    g.clearRect(0, 0, 512, 128);
    g.font = '800 40px "Nunito", system-ui, sans-serif';
    const nw = g.measureText(s.look.name).width;
    g.font = '700 30px "Nunito", system-ui, sans-serif';
    const rw = g.measureText(role.short).width;
    const w = Math.max(nw, rw) + 36, x = 256 - w / 2;
    g.fillStyle = 'rgba(15,17,26,0.85)'; g.fillRect(x, 14, w, 100);
    g.fillStyle = role.color; g.fillRect(x, 14, w, 6);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = selected ? '#ffe08a' : '#ffffff';
    g.font = '800 40px "Nunito", system-ui, sans-serif'; g.fillText(s.look.name, 256, 46);
    g.fillStyle = role.color; g.font = '700 30px "Nunito", system-ui, sans-serif'; g.fillText(role.short, 256, 88);
    lbl.tex.needsUpdate = true;
    lbl.sprite.scale.set(2.2, 0.55, 1);
  }

  function drawBubbleSprite(b, text) {
    if (b.key === text) return;
    b.key = text;
    b.sprite.visible = !!text;
    if (!text) return;
    const g = b.ctx;
    g.clearRect(0, 0, 512, 128);
    g.font = '800 40px "Nunito", system-ui, sans-serif';
    const w = Math.min(480, g.measureText(text).width + 44), x = 256 - w / 2;
    const warn = text === 'NEED YOU!' || text === 'OOPS!' || text === 'FIRE!!';
    g.fillStyle = '#1d1d24'; g.fillRect(x - 5, 9, w + 10, 80); g.fillRect(238, 89, 36, 16); g.fillRect(250, 105, 12, 10);
    g.fillStyle = warn ? '#f5b83d' : '#ffffff'; g.fillRect(x, 14, w, 70); g.fillRect(243, 84, 26, 16); g.fillRect(253, 100, 6, 8);
    g.fillStyle = text === 'DONE!' || text === 'ALL CLEAR!' ? '#1f7a45' : text === 'FIRE!!' || text === 'OOPS!' ? '#b42318' : '#1d1d24';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 51);
    b.tex.needsUpdate = true;
    b.sprite.scale.set(2.4, 0.6, 1);
  }

  const DIR_ROT = { down: 0, up: Math.PI, right: Math.PI / 2, left: -Math.PI / 2 };

  function syncChars(t, dt) {
    const { sims, moodFor, armsFor, bubbleFor, T } = I();
    for (const [id, c] of chars) if (!sims.has(id)) { scene.remove(c.root); chars.delete(id); }
    const sel = PO.world.selected;
    ring.visible = false;
    for (const s of sims.values()) {
      let c = chars.get(s.id);
      if (!c) { c = buildChar(s); chars.set(s.id, c); }
      const sitting = s.pose === 'sitDesk' || s.pose === 'sitFront';
      let x = s.x / T, z = s.y / T, y = 0;
      if (s.pose === 'sitDesk') { z -= 0.5; y = 0.13; }
      else if (s.pose === 'sitFront') { z -= 0.25; y = /bean/.test(s.spot ? s.spot.name : '') ? 0.02 : 0.08; }
      c.root.position.set(x, y, z);
      // smooth turning
      const target = DIR_ROT[s.dir] || 0;
      let diff = target - c.rot;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      c.rot += diff * Math.min(1, dt * 12);
      c.root.rotation.y = c.rot;
      // limbs
      const walk = s.pose === 'walk';
      const sw = walk ? Math.sin(s.dist * 0.35) * 0.7 : 0;
      c.legL.rotation.x = sitting ? -Math.PI / 2 : sw;
      c.legR.rotation.x = sitting ? -Math.PI / 2 : -sw;
      const arms = armsFor(s, t);
      const typing = s.pose === 'sitDesk' && s.atTarget && ['typing', 'running', 'planning'].includes(s.data.status);
      let aL = -sw, aR = sw;
      if (s.pose === 'sitDesk') { aL = aR = -1.2; if (typing) { const k = Math.sin(t * 22) * 0.12; aL += k; aR -= k; } }
      if (arms === 'wave') { aR = -Math.PI + Math.sin(t * 10) * 0.3; }
      if (arms === 'cheer') { aL = aR = -Math.PI + Math.sin(t * 8) * 0.2; }
      if (s.task) aR = s.task.phase === 'spraying' ? -1.4 : -0.4;
      c.armL.rotation.x = aL; c.armR.rotation.x = aR;
      c.ext.visible = !!s.task;
      c.body.position.y = walk ? Math.abs(Math.sin(s.dist * 0.35)) * 0.04 : 0;
      // face
      const mood = moodFor(s, t);
      const blink = ((t + s.blinkAt) % 4) < 0.15;
      const fk = mood + blink;
      if (fk !== c.faceKey) { c.faceKey = fk; PO.toon.drawFaceTexture(c.faceCtx, 128, s.look, mood, blink ? 1 : 0, t); c.faceTex.needsUpdate = true; }
      c.head.rotation.z = mood === 'thinking' ? 0.12 : mood === 'sleepy' ? Math.sin(t) * 0.08 : 0;
      // labels
      const selected = s.id === sel;
      drawLabel(c.label, s, selected);
      c.label.sprite.position.set(0, 1.55, 0);
      const text = bubbleFor(s, t);
      const blinkOff = s.data.status === 'waiting' && !s.emote && Math.floor(t * 2.5) % 2 === 1;
      drawBubbleSprite(c.bubble, blinkOff ? null : text);
      c.bubble.sprite.position.set(0, 2.15 + Math.sin(t * 3 + s.blinkAt) * 0.03, 0);
      if (selected) { ring.visible = true; ring.position.set(x, 0.02, z); }
    }
  }

  function syncDesks(t) {
    const { deskStatus, drawScreen } = I();
    let fire = null;
    for (const v of deskViews) {
      const st = deskStatus(v.d);
      v.sctx.clearRect(0, 0, 12, 8);
      drawScreen(v.sctx, 0, 0, v.d.fire ? 'waiting' : st, t, v.d.tx + v.d.ty);
      v.tex.needsUpdate = true;
      const f = v.d.fire;
      v.flames.visible = !!f && f.phase !== 'smoke';
      if (v.flames.visible) {
        fire = v;
        const k = f.phase === 'extinguishing' ? Math.max(0.05, 1 - (t - f.at) / 3) : 1;
        v.fl.forEach((m, i) => { m.scale.set(k, k * (0.8 + Math.sin(t * 14 + i * 1.7) * 0.35), k); });
      }
      if (f && Math.random() < (f.phase === 'smoke' ? 0.15 : 0.3)) puff(v.d.tx + 0.8, 1.6, v.d.ty + 0.5, f.phase === 'extinguishing' ? '#ffffff' : '#6b6f7a');
    }
    fireLight.intensity = fire ? 2 + Math.sin(t * 20) * 0.6 : 0;
    if (fire) fireLight.position.set(fire.d.tx + 0.8, 1.8, fire.d.ty + 0.9);
  }

  function puff(x, y, z, color) {
    if (puffs.length > 60) return;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    m.position.set(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.2);
    m.userData.life = 1.6;
    scene.add(m); puffs.push(m);
  }

  function syncPuffs(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const m = puffs[i];
      m.userData.life -= dt;
      m.position.y += dt * 0.6;
      m.scale.multiplyScalar(1 + dt * 0.8);
      m.material.opacity = Math.max(0, m.userData.life / 1.6) * 0.7;
      if (m.userData.life <= 0) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); puffs.splice(i, 1); }
    }
  }

  function syncWall(t) {
    if (t - wallAt < 0.25) return;
    wallAt = t;
    const W3 = I();
    const SC = PO.scene, T = W3.T, B = W3.BG_RES;
    const g = wallCtx, now = new Date();
    g.setTransform(4, 0, 0, 4, 0, 0);
    g.drawImage(W3.bg, 0, 0, 416 * B, 32 * B, 0, 0, 416, 32);
    SC.drawWindow(g, 4 * T, t, now); SC.drawWindow(g, 12 * T, t, now);
    SC.drawWhiteboard(g, 7 * T, W3.sims, W3.tasksDone, W3.WORK); SC.drawNeon(g, 20 * T + 4, t); SC.drawClock(g, 104, 14, now);
    SC.drawBrandSign(g, 14 * T + 2, t, W3.logoReady ? W3.logoImg : null);
    g.setTransform(1, 0, 0, 1, 0, 0);
    W3.drawWallText(g, 4, 'wall');
    wallTex.needsUpdate = true;
    // day / night
    const hr = now.getHours(), night = hr < 6 || hr >= 20;
    hemi.intensity = night ? 0.45 : 0.75;
    sun.intensity = night ? 0.35 : 0.75;
  }

  function loop() {
    if (!active) return;
    const dt = Math.min(0.1, clock.getDelta());
    const t = performance.now() / 1000;
    syncWall(t);
    syncDesks(t);
    syncChars(t, dt);
    syncPuffs(dt);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  function resize() {
    if (!renderer || !container) return;
    const r = container.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }

  async function show(el) {
    container = el;
    await ensure();
    if (renderer.domElement.parentElement !== el) el.appendChild(renderer.domElement);
    renderer.domElement.hidden = false;
    active = true;
    resize();
    if (!shownOnce) { shownOnce = true; resetView(); }
    clock.getDelta();
    requestAnimationFrame(loop);
  }

  function hide() {
    active = false;
    if (renderer) renderer.domElement.hidden = true;
  }

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(document.documentElement);

  PO.view3d = {
    show, hide, resize,
    resetView: () => built && resetView(),
    setAutoRotate: (on) => { if (controls) controls.autoRotate = on; },
    get active() { return active; },
  };
})(window.PO = window.PO || {});
