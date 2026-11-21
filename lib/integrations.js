'use strict';
// Office routes for the live crew: connect Google / TikTok (OAuth), see
// connection status, and approve or reject what the crew proposes.
// Local only: every state-changing request needs the per-run session token,
// which only pages served by this server can read.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { P, readJSON, loadConfig } = require('../crew/lib/config');
const google = require('../crew/lib/google');
const tiktok = require('../crew/lib/tiktok');
const approvals = require('../crew/lib/approvals');

const TOKEN = crypto.randomBytes(24).toString('hex');
const pendingAuth = new Map(); // state -> { provider, verifier, redirect }

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

// workspace folder -> office role, from crew/jobs.json
function crewRoles() {
  const jobs = readJSON(P.jobs, { jobs: [] }).jobs || [];
  return Object.fromEntries(jobs.map((j) => [j.workspace, j.role]));
}

function status() {
  const cfg = loadConfig();
  const jobs = readJSON(P.jobs, { jobs: [] }).jobs || [];
  return {
    google: { configured: !!cfg.google.clientId, connected: google.connected(), bookingsSheet: !!cfg.google.bookingsSheetId },
    tiktok: { configured: !!cfg.tiktok.clientKey, connected: tiktok.connected() },
    jobs: jobs.map((j) => ({ id: j.id, name: j.name, role: j.role, workspace: j.workspace, prompt: j.prompt, schedule: j.schedule })),
    approvals: approvals.all().slice(-60).reverse(),
  };
}

async function execute(item) {
  const p = item.payload || {};
  switch (item.kind) {
    case 'calendar-event': {
      const ev = await google.createEvent(p);
      return { link: ev.htmlLink, id: ev.id };
    }
    case 'drive-upload': {
      const file = path.resolve(p.file || '');
      if (!file.startsWith(P.output + path.sep)) throw new Error('File is outside crew/output');
      const doc = await google.uploadDoc(p.name, fs.readFileSync(file, 'utf8'), p.folder);
      return { link: doc.webViewLink, id: doc.id };
    }
    default:
      return null; // replies and notes: approval is the action (copy & send yourself)
  }
}

// Returns true when the request was handled.
function handle(req, res, url, port) {
  const p = url.pathname;
  const redirect = (provider) => `http://127.0.0.1:${port}/oauth/${provider}`;

  if (p === '/api/session' && req.method === 'GET') return json(res, 200, { token: TOKEN }), true;
  if (p === '/api/crew' && req.method === 'GET') return json(res, 200, status()), true;

  const oauth = p.match(/^\/oauth\/(google|tiktok)(\/start)?$/);
  if (oauth && req.method === 'GET') {
    const provider = oauth[1];
    const lib = provider === 'google' ? google : tiktok;
    const redirectUri = provider === 'tiktok' && loadConfig().tiktok.redirectUri ? loadConfig().tiktok.redirectUri : redirect(provider);
    if (oauth[2]) {
      if (url.searchParams.get('token') !== TOKEN) return json(res, 403, { error: 'Open this from the office page' }), true;
      try {
        const a = lib.authUrl(redirectUri);
        pendingAuth.set(a.state, { provider, verifier: a.verifier, redirectUri });
        res.writeHead(302, { Location: a.url }); res.end();
      } catch (e) { json(res, 400, { error: e.message }); }
      return true;
    }
    const st = pendingAuth.get(url.searchParams.get('state') || '');
    const done = (msg) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(`<meta charset="utf-8"><body style="font:16px system-ui;background:#0f111a;color:#e6e8ef;padding:40px"><h2>${msg}</h2><p>Anda boleh tutup tab ini dan kembali ke office.</p><script>setTimeout(()=>location.href='/',2500)</script>`); };
    if (!st || st.provider !== provider) { done('✖ Sesi log masuk tidak sah atau tamat. Cuba lagi dari office.'); return true; }
    pendingAuth.delete(url.searchParams.get('state'));
    if (url.searchParams.get('error')) { done(`✖ ${provider} menolak: ${url.searchParams.get('error_description') || url.searchParams.get('error')}`); return true; }
    lib.exchange(url.searchParams.get('code'), st.verifier, st.redirectUri)
      .then(() => done(`✔ ${provider === 'google' ? 'Google' : 'TikTok'} berjaya disambung`))
      .catch((e) => done(`✖ Gagal: ${e.message}`));
    return true;
  }

  if (p === '/api/approvals/decide' && req.method === 'POST') {
    const origin = req.headers.origin;
    if (req.headers['x-office-token'] !== TOKEN || (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin))) {
      return json(res, 403, { error: 'forbidden' }), true;
    }
    readBody(req).then(async ({ id, action }) => {
      const item = approvals.all().find((x) => x.id === id);
      if (!item) return json(res, 404, { error: 'No such proposal' });
      if (action === 'reject') return json(res, 200, approvals.decide(id, 'rejected'));
      try {
        const result = await execute(item);
        json(res, 200, approvals.decide(id, 'approved', result));
      } catch (e) {
        json(res, 502, { error: e.message });
      }
    }).catch(() => json(res, 400, { error: 'bad request' }));
    return true;
  }
  return false;
}

// Push approval-queue changes to open offices.
function watch(onChange) {
  let last = '';
  setInterval(() => {
    let cur = '';
    try { cur = String(fs.statSync(approvals.FILE).mtimeMs); } catch (_) { /* no file yet */ }
    if (cur !== last) { last = cur; onChange(status()); }
  }, 2000).unref();
}

module.exports = { handle, watch, crewRoles, status };
