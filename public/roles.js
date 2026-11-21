// Departments and job roles (jabatan & jawatan).
// The office has four content departments: Authenticity, Awareness, Sales
// and Trust. Each has the same six roles: manager, content creator, designer,
// editor, copywriter and content planner. The Head of Marketing (the owner) has
// a private office with a Personal Assistant outside the door.
// Each role owns one desk and is played by one mascot (mascots.js). An agent's
// role comes from office.config.json (server), then keywords in its project
// name, then the first role nobody holds yet.
(function (PO) {
  'use strict';

  const DEPTS = [
    { id: 'authenticity', name: 'AUTHENTICITY', ms: 'Keaslian', color: '#3fae6a', floor: '#3d4a43',
      focus: 'BTS, kisah sebenar, momen raw', keywords: ['bts', 'behind', 'story', 'raw', 'real', 'vlog', 'founder', 'daily'] },
    { id: 'awareness', name: 'AWARENESS', ms: 'Kesedaran', color: '#f08a2c', floor: '#4b4339',
      focus: 'Trend, hook viral, follower baru', keywords: ['trend', 'viral', 'reach', 'hook', 'tiktok', 'reels', 'social', 'instagram', 'awareness'] },
    { id: 'sales', name: 'SALES', ms: 'Jualan', color: '#e5484d', floor: '#4b3a3d',
      focus: 'Pakej, promosi, DM jadi tempahan', keywords: ['sales', 'promo', 'offer', 'booking', 'price', 'package', 'quotation', 'ads', 'campaign', 'client'] },
    { id: 'trust', name: 'TRUST', ms: 'Kepercayaan', color: '#3e8ef7', floor: '#383f4d',
      focus: 'Testimoni, portfolio, edukasi', keywords: ['trust', 'testimonial', 'review', 'portfolio', 'faq', 'education', 'tips', 'case', 'web', 'site'] },
  ];

  const TYPES = [
    { id: 'manager', verb: 'LEADING', label: 'Manager', short: 'Manager', ms: 'Pengurus', prop: 'chart', screen: 'chart',
      keywords: ['manager', 'strategy', 'report', 'analytics', 'kpi', 'growth', 'marketing'] },
    { id: 'creator', verb: 'CREATING', label: 'Content Creator', short: 'Creator', ms: 'Pencipta Kandungan', prop: 'ringlight', screen: 'feed',
      keywords: ['content', 'creator', 'shoot', 'photo', 'ugc', 'ootd', 'camera', 'film'] },
    { id: 'designer', verb: 'DESIGNING', label: 'Designer', short: 'Designer', ms: 'Pereka', prop: 'tablet', screen: 'canvas',
      keywords: ['design', 'brand', 'logo', 'graphic', 'poster', 'figma', 'canva', 'banner', 'thumbnail', 'illustrat'] },
    { id: 'editor', verb: 'EDITING', label: 'Editor', short: 'Editor', ms: 'Penyunting', prop: 'monitor2', screen: 'timeline',
      keywords: ['edit', 'video', 'reel', 'premiere', 'davinci', 'capcut', 'render', 'subtitle', 'retouch', 'lightroom'] },
    { id: 'copywriter', verb: 'WRITING', label: 'Copywriter', short: 'Copywriter', ms: 'Penulis Iklan', prop: 'notebook', screen: 'doc',
      keywords: ['copy', 'caption', 'script', 'blog', 'article', 'newsletter', 'writing', 'email', 'headline'] },
    { id: 'planner', verb: 'PLANNING', label: 'Content Planner', short: 'Planner', ms: 'Perancang Kandungan', prop: 'sticky', screen: 'kanban',
      keywords: ['plan', 'calendar', 'schedule', 'timeline', 'roadmap', 'project', 'posting'] },
  ];

  const deptOf = new Map(DEPTS.map((d) => [d.id, d]));
  const ROLES = [];
  for (const d of DEPTS) {
    for (const ty of TYPES) {
      ROLES.push({
        id: `${d.id}-${ty.id}`, dept: d.id, type: ty.id, verb: ty.verb,
        label: `${ty.label} · ${d.name[0]}${d.name.slice(1).toLowerCase()}`, short: ty.short,
        ms: `${ty.ms} ${d.ms}`, tags: d.focus, color: d.color, prop: ty.prop, screen: ty.screen,
        keywords: [...ty.keywords, ...d.keywords],
      });
    }
  }
  const PA = { id: 'pa', dept: 'hom', type: 'pa', verb: 'SCHEDULING', label: 'Personal Assistant', short: 'PA', ms: 'Pembantu Peribadi',
    tags: 'jadual · kelulusan · peringatan', color: '#b79be6', prop: 'deskphone', screen: 'inbox',
    keywords: ['assistant', 'admin', 'hr', 'people', 'support', 'approval', 'inbox', 'reminder'] };
  const HOM = { id: 'hom', dept: 'hom', type: 'hom', verb: 'REVIEWING', label: 'Head of Marketing', short: 'Head of Marketing', ms: 'Ketua Pemasaran',
    tags: 'visi · keputusan · kelulusan', color: '#f5b83d', prop: 'dslr', screen: 'chart', keywords: [] };
  ROLES.push(PA, HOM);
  const ASSISTANT = { id: 'assistant', verb: 'LEARNING', label: 'Intern', short: 'Intern', ms: 'Pelatih', tags: 'belajar · bantu', color: '#9aa4b2', prop: null, screen: null, keywords: [] };

  // Role ids used before the office was split into departments.
  const LEGACY = {
    'video-editor': 'awareness-editor', 'social-media': 'awareness-planner', 'project-manager': 'sales-planner',
    'content-creator': 'awareness-creator', 'marketing-manager': 'awareness-manager', 'graphic-designer': 'awareness-designer',
    'web-developer': 'trust-designer', 'photographer': 'authenticity-creator', 'videographer': 'authenticity-manager',
    'copywriter': 'sales-copywriter', 'account-manager': 'sales-manager', 'hr': 'pa',
  };

  const byId = new Map(ROLES.map((r) => [r.id, r]));
  byId.set(ASSISTANT.id, ASSISTANT);
  const get = (id) => byId.get(id) || byId.get(LEGACY[id]);

  // Unmatched sessions fill desks in this order: one of each role per department in turn.
  const FALLBACK = TYPES.flatMap((ty) => DEPTS.map((d) => `${d.id}-${ty.id}`));

  // Best role for some text: the job type with the most keyword hits, then the
  // department with the most hits (Awareness when nothing says otherwise).
  function match(text) {
    const tokens = String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const hits = (kw) => kw.reduce((n, k) => n + (tokens.some((t) => t.startsWith(k)) ? 1 : 0), 0);
    let type = null, best = 0;
    for (const ty of TYPES) { const s = hits(ty.keywords); if (s > best) { type = ty; best = s; } }
    let dept = null; best = 0;
    for (const d of DEPTS) { const s = hits(d.keywords); if (s > best) { dept = d; best = s; } }
    if (!type && !dept) return null;
    return byId.get(`${(dept || deptOf.get('awareness')).id}-${(type || TYPES[1]).id}`);
  }

  // agent: server agent object; taken: Set of role ids already held by live main agents
  function pick(agent, taken) {
    if (agent.jobRole && get(agent.jobRole)) return get(agent.jobRole);
    if (agent.parentId) return match(`${agent.role || ''} ${agent.detail || ''}`) || ASSISTANT;
    const m = match(`${agent.project || ''} ${agent.cwd || ''}`);
    if (m && !taken.has(m.id)) return m;
    if (m) { // same job in another department
      const alt = DEPTS.map((d) => `${d.id}-${m.type}`).find((id) => !taken.has(id));
      if (alt) return byId.get(alt);
    }
    const free = FALLBACK.find((id) => !taken.has(id));
    return byId.get(free || FALLBACK[Math.floor(Math.random() * FALLBACK.length)]);
  }

  PO.roles = { DEPTS, TYPES, ROLES, PA, HOM, ASSISTANT, LEGACY, get, dept: (id) => deptOf.get(id), pick, match };
})(window.PO = window.PO || {});
