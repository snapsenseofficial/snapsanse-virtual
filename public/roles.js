// Job roles (jawatan). Each role owns one desk, a character accessory,
// a desk prop and a themed monitor screen. An agent's role comes from
// office.config.json (server), then keywords in its project name, then
// the first role nobody holds yet.
(function (PO) {
  'use strict';

  // Desk order: row 1 = management, row 2 = production, row 3 = content & web.
  const ROLES = [
    { id: 'creative-director', label: 'Creative Director', short: 'Creative Dir', ms: 'Pengarah Kreatif', color: '#f5b83d', accessory: 'beret', prop: 'trophy', screen: 'moodboard',
      keywords: ['creative', 'director', 'brief', 'concept', 'pitch', 'moodboard'] },
    { id: 'marketing-manager', label: 'Marketing Manager', short: 'Marketing', ms: 'Pengurus Pemasaran', color: '#3e8ef7', accessory: 'tie', prop: 'chart', screen: 'chart',
      keywords: ['marketing', 'campaign', 'ads', 'seo', 'analytics', 'growth', 'funnel', 'promo', 'launch'] },
    { id: 'project-manager', label: 'Project Manager', short: 'Project Mgr', ms: 'Pengurus Projek', color: '#12a594', accessory: 'clipboard', prop: 'sticky', screen: 'kanban',
      keywords: ['project', 'roadmap', 'sprint', 'planning', 'ops', 'schedule', 'timeline'] },
    { id: 'account-manager', label: 'Account Manager', short: 'Account Mgr', ms: 'Pengurus Akaun Pelanggan', color: '#a18072', accessory: 'tie', prop: 'deskphone', screen: 'inbox',
      keywords: ['client', 'account', 'crm', 'invoice', 'proposal', 'quotation', 'sales', 'booking'] },
    { id: 'graphic-designer', label: 'Graphic Designer', short: 'Designer', ms: 'Pereka Grafik', color: '#30a46c', accessory: 'beanie', prop: 'tablet', screen: 'canvas',
      keywords: ['design', 'brand', 'logo', 'graphic', 'poster', 'figma', 'canva', 'illustrat', 'banner', 'thumbnail'] },
    { id: 'photographer', label: 'Photographer', short: 'Photographer', ms: 'Jurugambar', color: '#e5484d', accessory: 'camera', prop: 'dslr', screen: 'photos',
      keywords: ['photo', 'gallery', 'image', 'img', 'lightroom', 'portrait', 'wedding', 'raw', 'shoot'] },
    { id: 'videographer', label: 'Videographer', short: 'Videographer', ms: 'Jurukamera Video', color: '#f76b15', accessory: 'cap', prop: 'tripod', screen: 'viewfinder',
      keywords: ['footage', 'camera', 'film', 'videograph', 'drone', 'cinema', 'broll'] },
    { id: 'video-editor', label: 'Video Editor', short: 'Video Editor', ms: 'Penyunting Video', color: '#8e4ec6', accessory: 'headphones', prop: 'monitor2', screen: 'timeline',
      keywords: ['video', 'reel', 'edit', 'premiere', 'davinci', 'capcut', 'youtube', 'clip', 'motion', 'render', 'subtitle'] },
    { id: 'content-creator', label: 'Content Creator', short: 'Creator', ms: 'Pencipta Kandungan', color: '#e93d82', accessory: 'phone', prop: 'ringlight', screen: 'feed',
      keywords: ['content', 'creator', 'vlog', 'tiktok', 'story', 'stories', 'caption', 'ugc', 'podcast'] },
    { id: 'social-media', label: 'Social Media Manager', short: 'Social Media', ms: 'Pengurus Media Sosial', color: '#d6409f', accessory: 'phone', prop: 'phonestand', screen: 'feed',
      keywords: ['social', 'instagram', 'insta', 'facebook', 'threads', 'twitter', 'linkedin', 'post', 'hashtag', 'community'] },
    { id: 'copywriter', label: 'Copywriter', short: 'Copywriter', ms: 'Penulis Iklan', color: '#ffa657', accessory: 'glasses', prop: 'notebook', screen: 'doc',
      keywords: ['copy', 'blog', 'article', 'script', 'newsletter', 'writing', 'email', 'headline', 'translate'] },
    { id: 'web-developer', label: 'Web Developer', short: 'Web Dev', ms: 'Pembangun Web', color: '#5b5bd6', accessory: 'hoodie', prop: 'duck', screen: null,
      keywords: ['web', 'site', 'app', 'api', 'portal', 'server', 'frontend', 'backend', 'dev', 'code', 'next', 'react', 'landing'] },
  ];
  const ASSISTANT = { id: 'assistant', label: 'Assistant', short: 'Assistant', ms: 'Pembantu', color: '#9aa4b2', accessory: null, prop: null, screen: null, keywords: [] };

  // Tie-break order when several roles match equally (most specific first).
  const PRIORITY = ['video-editor', 'videographer', 'photographer', 'graphic-designer', 'social-media', 'content-creator',
    'copywriter', 'marketing-manager', 'web-developer', 'account-manager', 'project-manager', 'creative-director'];
  // Unmatched sessions fill these first (most Claude Code work is code & content).
  const FALLBACK = ['web-developer', 'content-creator', 'graphic-designer', 'video-editor', 'copywriter', 'social-media',
    'photographer', 'videographer', 'marketing-manager', 'project-manager', 'account-manager', 'creative-director'];

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
