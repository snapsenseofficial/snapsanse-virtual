#!/usr/bin/env node
'use strict';
// SnapSense Pixel Office — a live pixel-art office for your Claude Code agents.
// Zero dependencies. Run:  node server.js  [--port 4317] [--host 127.0.0.1] [--demo] [--no-watch]

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { OfficeState } = require('./lib/state');
const { TranscriptWatcher } = require('./lib/watcher');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

if (flag('help') || flag('h')) {
  console.log(`Usage: node server.js [options]
  --port <n>        Port (default 4317, or $PORT)
  --host <addr>     Bind address (default 127.0.0.1 — keep it local!)
  --projects <dir>  Claude transcripts dir (default ~/.claude/projects)
  --no-watch        Don't read transcripts (hooks only)
  --demo            Simulated agents, no Claude Code needed
  --verbose         Log watcher activity`);
  process.exit(0);
}

const PORT = Number(opt('port', process.env.PORT || 4317));
const HOST = opt('host', process.env.HOST || '127.0.0.1');
const DEMO = flag('demo');
const PUBLIC = path.join(__dirname, 'public');
const MAX_BODY = 1024 * 1024;

const state = new OfficeState();
const clients = new Set();

function broadcast(msg) {
  const data = `data: ${JSON.stringify(msg)}\n\n`;
  for (const res of clients) res.write(data);
}
state.on('agent', (agent) => broadcast({ type: 'agent', agent }));
state.on('remove', (id) => broadcast({ type: 'remove', id }));
state.on('log', (entry) => broadcast({ type: 'log', entry }));

// ---- Claude Code hook receiver ----------------------------------------------
function handleHook(h) {
  const info = { sessionId: h.session_id, cwd: h.cwd, sidechain: false };
  if (!info.sessionId) return;
  const now = Date.now();
  switch (h.hook_event_name) {
    case 'SessionStart': return state.sessionStart(info, now);
    case 'UserPromptSubmit': return state.userPrompt(info, h.prompt, now);
    case 'PreToolUse': return state.toolStart(info, h.tool_use_id, h.tool_name, h.tool_input, now);
    case 'PostToolUse': return state.toolEnd(info, h.tool_use_id, false, now, h.tool_name);
    case 'PostToolUseFailure': return state.toolEnd(info, h.tool_use_id, true, now, h.tool_name);
    case 'PermissionRequest': return state.needsAttention(info, `Approve ${h.tool_name || 'tool'}?`, now);
    case 'Notification': return state.needsAttention(info, h.message, now);
    case 'Stop': return state.turnEnd(info, now);
    case 'SessionEnd': return state.sessionEnd(info, now);
    default: return undefined;
  }
}

// ---- HTTP -------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify({ type: 'snapshot', demo: DEMO, ...state.snapshot() })}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  if (url.pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ demo: DEMO, ...state.snapshot() }));
  }

  if (url.pathname === '/hook' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on('end', () => {
      try { handleHook(JSON.parse(body)); } catch (_) { /* ignore malformed */ }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
    return;
  }

  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405); res.end();
});

if (!DEMO && !flag('no-watch')) {
  const base = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const roots = [opt('projects', path.join(base, 'projects'))];
  new TranscriptWatcher(state, roots, { verbose: flag('verbose') }).start();
}

server.listen(PORT, HOST, () => {
  const url = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/${DEMO ? '?demo' : ''}`;
  console.log(`\n  🏢 SnapSense Pixel Office is open → ${url}\n`);
  if (DEMO) console.log('  Demo mode: simulated agents only.\n');
  else console.log('  Watching Claude Code sessions. Start `claude` in any project and watch your agent clock in.\n');
});
