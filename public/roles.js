// Job roles (jawatan). Each role owns one desk, a mascot, a desk prop
// and a themed monitor screen. An agent's role comes from
// office.config.json (server), then keywords in its project name, then
// the first role nobody holds yet.
(function (PO) {
  'use strict';

  // Desk order follows the team photo: row 1 Blu, Lili, Green, Purple;
  // row 2 Yellow, Red, Cyan, Orange; row 3 Black, White, Navy, Lilac.
  // Each role is played by one mascot (mascots.js).
  const ROLES = [
    { id: 'video-editor', verb: 'EDITING', label: 'Video Editor', short: 'Video Editor', ms: 'Penyunting Video', tags: 'edit · video · camera', color: '#2f6df6', prop: 'monitor2', screen: 'timeline',
      keywords: ['video', 'reel', 'edit', 'premiere', 'davinci', 'capcut', 'youtube', 'clip', 'motion', 'render', 'subtitle'] },
    { id: 'social-media', verb: 'POSTING', label: 'Social Media Manager', short: 'Social Media', ms: 'Pengurus Media Sosial', tags: 'content · social media · design', color: '#f06a9b', prop: 'phonestand', screen: 'feed',
      keywords: ['social', 'instagram', 'insta', 'facebook', 'threads', 'twitter', 'linkedin', 'post', 'hashtag', 'community'] },
    { id: 'project-manager', verb: 'PLANNING', label: 'Event & Project Planner', short: 'Planner', ms: 'Perancang Acara & Projek', tags: 'travel · planning · event', color: '#3fae6a', prop: 'sticky', screen: 'kanban',
      keywords: ['project', 'roadmap', 'sprint', 'planning', 'ops', 'schedule', 'timeline', 'event', 'travel', 'trip'] },
    { id: 'content-creator', verb: 'CREATING', label: 'Content Creator', short: 'Creator', ms: 'Pencipta Kandungan', tags: 'fashion · content · creative', color: '#9b6ad8', prop: 'ringlight', screen: 'feed',
      keywords: ['content', 'creator', 'vlog', 'tiktok', 'story', 'stories', 'caption', 'ugc', 'podcast', 'fashion', 'ootd'] },
    { id: 'marketing-manager', verb: 'ANALYZING', label: 'Marketing Manager', short: 'Marketing', ms: 'Pengurus Pemasaran', tags: 'music · energy · marketing', color: '#f2c230', prop: 'chart', screen: 'chart',
      keywords: ['marketing', 'campaign', 'ads', 'seo', 'analytics', 'growth', 'funnel', 'promo', 'launch', 'music'] },
    { id: 'graphic-designer', verb: 'DESIGNING', label: 'Graphic Designer', short: 'Designer', ms: 'Pereka Grafik', tags: 'designer · branding · creative', color: '#e04545', prop: 'tablet', screen: 'canvas',
      keywords: ['design', 'brand', 'logo', 'graphic', 'poster', 'figma', 'canva', 'illustrat', 'banner', 'thumbnail'] },
    { id: 'web-developer', verb: 'CODING', label: 'Web Dev & Research', short: 'Web Dev', ms: 'Pembangun Web & Penyelidik', tags: 'admin · research · planning', color: '#38c6e0', prop: 'duck', screen: null,
      keywords: ['web', 'site', 'app', 'api', 'portal', 'server', 'frontend', 'backend', 'dev', 'code', 'next', 'react', 'landing', 'research', 'admin'] },
    { id: 'photographer', verb: 'RETOUCHING', label: 'Photographer', short: 'Photographer', ms: 'Jurugambar', tags: 'photo · video · outdoor', color: '#f08a2c', prop: 'dslr', screen: 'photos',
      keywords: ['photo', 'gallery', 'image', 'img', 'lightroom', 'portrait', 'wedding', 'raw', 'shoot', 'outdoor'] },
    { id: 'videographer', verb: 'MIXING', label: 'Videographer & Sound', short: 'Production', ms: 'Jurukamera & Bunyi', tags: 'sound · edit · production', color: '#4a4a52', prop: 'tripod', screen: 'viewfinder',
      keywords: ['footage', 'camera', 'film', 'videograph', 'drone', 'cinema', 'broll', 'sound', 'audio', 'production'] },
    { id: 'copywriter', verb: 'WRITING', label: 'Copywriter', short: 'Copywriter', ms: 'Penulis Iklan', tags: 'copywriting · planning · research', color: '#d9d6cf', prop: 'notebook', screen: 'doc',
      keywords: ['copy', 'blog', 'article', 'script', 'newsletter', 'writing', 'email', 'headline', 'translate'] },
    { id: 'account-manager', verb: 'MEETING', label: 'Strategy & Client', short: 'Strategy', ms: 'Strategi & Pelanggan', tags: 'strategy · meeting · client', color: '#3b5bd6', prop: 'deskphone', screen: 'inbox',
      keywords: ['client', 'account', 'crm', 'invoice', 'proposal', 'quotation', 'sales', 'booking', 'strategy'] },
    { id: 'hr', verb: 'CARING', label: 'HR & People', short: 'HR', ms: 'Sumber Manusia', tags: 'HR · support · people', color: '#b79be6', prop: 'heart', screen: 'inbox',
      keywords: ['hr', 'people', 'recruit', 'hiring', 'onboard', 'payroll', 'culture', 'support', 'team'] },
  ];
  const ASSISTANT = { id: 'assistant', verb: 'LEARNING', label: 'Intern', short: 'Intern', ms: 'Pelatih', tags: 'belajar · bantu', color: '#9aa4b2', accessory: null, prop: null, screen: null, keywords: [] };

  // Tie-break order when several roles match equally (most specific first).
  const PRIORITY = ['video-editor', 'videographer', 'photographer', 'graphic-designer', 'social-media', 'content-creator',
    'copywriter', 'marketing-manager', 'web-developer', 'account-manager', 'project-manager', 'hr'];
  // Unmatched sessions fill these first (most Claude Code work is code & content).
  const FALLBACK = ['web-developer', 'content-creator', 'graphic-designer', 'video-editor', 'copywriter', 'social-media',
    'photographer', 'videographer', 'marketing-manager', 'project-manager', 'account-manager', 'hr'];

  const byId = new Map(ROLES.map((r) => [r.id, r]));
  byId.set(ASSISTANT.id, ASSISTANT);

  function match(text) {
    const tokens = String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    let best = null, bestScore = 0;
    for (const id of PRIORITY) {
      const role = byId.get(id);
      const score = role.keywords.reduce((n, k) => n + (tokens.some((t) => t.startsWith(k)) ? 1 : 0), 0);
      if (score > bestScore) { best = role; bestScore = score; }
    }
    return best;
  }

  // agent: server agent object; taken: Set of role ids already held by live main agents
  function pick(agent, taken) {
    if (agent.jobRole && byId.has(agent.jobRole)) return byId.get(agent.jobRole);
    if (agent.parentId) return match(`${agent.role || ''} ${agent.detail || ''}`) || ASSISTANT;
    const m = match(`${agent.project || ''} ${agent.cwd || ''}`);
    if (m) return m;
    const free = FALLBACK.find((id) => !taken.has(id));
    return byId.get(free || FALLBACK[Math.floor(Math.random() * FALLBACK.length)]);
  }

  PO.roles = { ROLES, ASSISTANT, get: (id) => byId.get(id), pick, match };
})(window.PO = window.PO || {});
