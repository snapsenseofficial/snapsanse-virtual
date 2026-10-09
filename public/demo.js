// Demo mode: simulated Claude Code sessions, so the office can be shown
// (or recorded for social media) without any real agents running.
(function (PO) {
  'use strict';

  // One simulated agent per job role, each with its own project and briefs.
  const CREW = {
    'video-editor': ['reels-editor', ['Cut a 30s reel from the event footage', 'Add Malay subtitles to the brand video']],
    'social-media': ['instagram-social', ['Generate a content calendar for October', 'Write captions for this week\'s Instagram reels']],
    'project-manager': ['event-planning', ['Plan the client launch event', 'Update the shoot schedule for next week']],
    'content-creator': ['tiktok-content', ['Script 5 TikTok hooks for the OOTD series', 'Plan a behind-the-scenes vlog']],
    'marketing-manager': ['ad-campaign', ['Build the October ads budget plan', 'Create a monthly analytics report for the client']],
    'graphic-designer': ['brand-kit', ['Design 5 Instagram post templates', 'Export the new logo in all sizes']],
    'web-developer': ['snapsense-web', ['Build a landing page for the photography package', 'Research booking widgets and add WhatsApp button']],
    'photographer': ['photo-archive', ['Sort 300 RAW files by date and client', 'Optimise all portfolio images to WebP']],
    'videographer': ['sound-production', ['Clean up the interview audio', 'Organise drone footage into folders']],
    'copywriter': ['blog-copy', ['Write a blog post: 10 tips for a wedding photoshoot', 'Write the newsletter headline options']],
    'account-manager': ['client-portal', ['Prepare a quotation for the corporate video package', 'Plan the Q4 client strategy meeting']],
    'hr': ['team-people', ['Draft the onboarding checklist for new interns', 'Plan this month\'s team bonding']],
  };

  const FILES = ['index.html', 'Gallery.tsx', 'upload.ts', 'styles.css', 'booking.ts', 'report.md', 'captions.json', 'README.md'];
  const SCRIPT = [
    () => ['thinking', 'Thinking…', null],
    () => ['reading', `Read ${pick(FILES)}`, 'Read'],
    () => ['reading', `Grep "${pick(['upload', 'Gallery', 'TODO', 'price'])}"`, 'Grep'],
    () => ['planning', 'Plan 5 todos', 'TodoWrite'],
    () => ['typing', `Edit ${pick(FILES)}`, 'Edit'],
    () => ['typing', `Write ${pick(FILES)}`, 'Write'],
    () => ['running', `$ ${pick(['npm test', 'npm run build', 'git status', 'npx sharp-cli *.jpg'])}`, 'Bash'],
    () => ['browsing', `Search "${pick(['instagram reel size 2026', 'webp vs avif', 'best booking UX'])}"`, 'WebSearch'],
    () => ['typing', `Edit ${pick(FILES)}`, 'Edit'],
  ];

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function uid() { return Math.random().toString(16).slice(2, 10) + '-demo'; }

  function start(emit) {
    const agents = new Map();
    const timers = new Set();
    const later = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

    const push = (a) => emit({ type: 'agent', agent: { ...a } });
    const log = (a, kind, text) => emit({ type: 'log', entry: { ts: Date.now(), agentId: a.id, project: a.project, kind, text } });

    function set(a, status, detail, tool) {
      a.status = status; a.detail = detail; a.tool = tool || null; a.lastActive = Date.now();
      if (tool) a.toolCount++;
      push(a);
      if (tool || status === 'waiting') log(a, status, detail);
    }

    function freeRole() {
      const held = new Set([...agents.values()].map((x) => x.jobRole));
      const open = Object.keys(CREW).filter((r) => !held.has(r));
      return pick(open.length ? open : Object.keys(CREW));
    }

    function spawn(parent) {
      const jobRole = parent ? null : freeRole();
      const a = {
        jobRole,
        id: parent ? `${parent.id}/${uid()}` : uid(),
        parentId: parent ? parent.id : null,
        project: parent ? parent.project : CREW[jobRole][0],
        role: parent ? pick(['Explore', 'reviewer', 'designer', 'researcher']) : null,
        status: 'idle', detail: 'Joined the office', tool: null, toolCount: 0,
        startedAt: Date.now(), lastActive: Date.now(),
      };
      agents.set(a.id, a);
      push(a);
      log(a, 'session', parent ? `Sub-agent "${a.role}" joined` : 'Clocked in');
      if (parent) runSub(a); else later(1500 + Math.random() * 2000, () => newTask(a));
      return a;
    }

    function leave(a) {
      if (!agents.has(a.id)) return;
      agents.delete(a.id);
      log(a, 'session', 'Clocked out');
      emit({ type: 'remove', id: a.id });
    }

    function newTask(a) {
      if (!agents.has(a.id)) return;
      const p = pick(CREW[a.jobRole][1]);
      set(a, 'thinking', `Task: ${p}`, null);
      log(a, 'prompt', p);
      let steps = 4 + Math.floor(Math.random() * 6);
      const next = () => {
        if (!agents.has(a.id)) return;
        if (steps-- <= 0) {
          set(a, 'idle', 'Waiting for your next task', null);
          log(a, 'done', 'Turn complete');
          later(6000 + Math.random() * 14000, () => newTask(a));
          return;
        }
        const r = Math.random();
        if (r < 0.1) {
          set(a, 'waiting', `Approve Bash?`, null);
          later(3500 + Math.random() * 3000, () => { set(a, 'running', '$ npm run build', 'Bash'); later(2500, next); });
          return;
        }
        if (r < 0.26 && r >= 0.2) { // crunch time: a burst of rapid tool calls (may overheat the computer)
          let n = 15;
          const burst = () => {
            if (!agents.has(a.id)) return;
            const [st, detail, tool] = pick(SCRIPT.slice(1))();
            set(a, st, detail, tool);
            if (--n > 0) later(200, burst); else later(2500, next);
          };
          burst();
          return;
        }
        if (r < 0.2 && agents.size < 12) {
          set(a, 'delegating', 'Delegate: explore the codebase', 'Task');
          const child = spawn(a);
          child.onDone = () => { set(a, 'thinking', 'Reviewing Task result', null); later(1500, next); };
          return;
        }
        const [st, detail, tool] = pick(SCRIPT)();
        set(a, st, detail, tool);
        later(1800 + Math.random() * 3200, next);
      };
      later(1200, next);
    }

    function runSub(c) {
      let n = 3 + Math.floor(Math.random() * 3);
      const tick = () => {
        if (!agents.has(c.id)) return;
        if (n-- <= 0) {
          set(c, 'done', 'Finished — heading out', null);
          log(c, 'done', `Sub-agent "${c.role}" finished`);
          later(800, () => { leave(c); if (c.onDone) c.onDone(); });
          return;
        }
        const [st, detail, tool] = pick(SCRIPT.slice(0, 3).concat(SCRIPT.slice(6)))();
        set(c, st, detail, tool);
        later(1500 + Math.random() * 2500, tick);
      };
      later(2500, tick);
    }

    // initial crew, then occasional arrivals/departures
    for (let i = 0; i < 7; i++) later(i * 1500, () => spawn());
    const churn = setInterval(() => {
      const mains = [...agents.values()].filter((a) => !a.parentId);
      if (mains.length < 10 && Math.random() < 0.5) spawn();
      else if (mains.length > 6) {
        const idle = mains.find((a) => a.status === 'idle');
        if (idle) leave(idle);
      }
    }, 25000);

    return () => { clearInterval(churn); timers.forEach(clearTimeout); };
  }

  PO.demo = { start };
})(window.PO = window.PO || {});
