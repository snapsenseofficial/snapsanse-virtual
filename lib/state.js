'use strict';
// Office state: turns Claude Code activity (from transcripts or hooks)
// into a small set of "agents" with a visual status.

const EventEmitter = require('events');
const path = require('path');

// Visual statuses understood by the front-end.
const TOOL_STATUS = {
  Edit: 'typing', MultiEdit: 'typing', Write: 'typing', NotebookEdit: 'typing',
  Read: 'reading', Grep: 'reading', Glob: 'reading', LS: 'reading', NotebookRead: 'reading',
  Bash: 'running', BashOutput: 'running', KillShell: 'running', KillBash: 'running',
  WebFetch: 'browsing', WebSearch: 'browsing',
  Task: 'delegating', Agent: 'delegating',
  TodoWrite: 'planning', ExitPlanMode: 'planning',
};
// Tools that may legitimately run for a long time (not a permission wait).
const LONG_TOOLS = new Set(['Bash', 'Task', 'Agent', 'WebFetch', 'WebSearch', 'BashOutput']);
const SUBAGENT_TOOLS = new Set(['Task', 'Agent']);

const WAIT_GUESS_MS = 8000;       // pending short tool this long => probably asking permission
const TEXT_IDLE_MS = 10000;        // text reply, then silence => turn finished
const STALE_IDLE_MS = 120000;      // no activity => idle
const REMOVE_MS = 30 * 60 * 1000;  // no activity => agent leaves the office
const MAX_LOG = 250;

function classifyTool(name) {
  if (!name) return 'thinking';
  if (TOOL_STATUS[name]) return TOOL_STATUS[name];
  if (name.startsWith('mcp__')) return 'browsing';
  return 'running';
}

function trunc(s, n) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function describeTool(name, input) {
  input = input || {};
  const file = input.file_path || input.notebook_path || input.path || '';
  const base = file ? path.basename(String(file)) : '';
  switch (name) {
    case 'Bash': return '$ ' + trunc(input.description || input.command, 60);
    case 'Read': case 'Edit': case 'Write': case 'MultiEdit': case 'NotebookEdit':
      return `${name} ${base}`.trim();
    case 'Grep': return `Grep "${trunc(input.pattern, 30)}"`;
    case 'Glob': return `Glob ${trunc(input.pattern, 40)}`;
    case 'WebFetch': {
      let host = input.url || '';
      try { host = new URL(input.url).host; } catch (_) {}
      return `Fetch ${trunc(host, 40)}`;
    }
    case 'WebSearch': return `Search "${trunc(input.query, 40)}"`;
    case 'Task': case 'Agent':
      return `Delegate: ${trunc(input.description || input.subagent_type || 'subtask', 44)}`;
    case 'TodoWrite': return `Plan ${(input.todos || []).length} todos`;
    case 'ExitPlanMode': return 'Present plan';
    default:
      if (name && name.startsWith('mcp__')) {
        const parts = name.split('__');
        return `MCP ${parts[1]}: ${parts.slice(2).join('_')}`;
      }
      return name || 'tool';
  }
}

function projectName(cwd, fallback) {
  if (cwd) return path.basename(cwd);
  if (fallback) {
    // ~/.claude/projects/-home-user-my-app  ->  my-app (best effort)
    const parts = String(fallback).split('-').filter(Boolean);
    return parts.slice(-2).join('-') || fallback;
  }
  return 'project';
}

class OfficeState extends EventEmitter {
  // config.roles: { "<project folder name>": "<role id>" } from office.config.json
  constructor(config = {}) {
    super();
    this.roleMap = (config && config.roles) || {};
    this.agents = new Map();
    this.log = [];
    this.pending = new Map(); // toolUseId -> { agentId, name, start }
    this.recentKeys = new Map(); // log de-dup (hooks + transcript can both report)
    this.hookSeq = 0;
    setInterval(() => this.tick(), 1000).unref();
  }

  // ---- agents -------------------------------------------------------------

  ensureAgent(info, ts) {
    const id = info.sessionId;
    let a = this.agents.get(id);
    if (!a) {
      a = {
        id,
        parentId: null,
        project: projectName(info.cwd, info.projectDir),
        cwd: info.cwd || null,
        role: null,
        jobRole: null,
        status: 'idle',
        detail: 'Joined the office',
        tool: null,
        toolCount: 0,
        startedAt: ts,
        lastActive: ts,
        lastKind: null,
      };
      this.agents.set(id, a);
    } else if (info.cwd && !a.cwd) {
      a.cwd = info.cwd;
      a.project = projectName(info.cwd);
    }
    if (!a.parentId) a.jobRole = Object.prototype.hasOwnProperty.call(this.roleMap, a.project) ? this.roleMap[a.project] : null;
    return a;
  }

  // Sidechain (subagent) lines belong to the newest live child of the session.
  resolveAgent(info, ts) {
    if (!info.sidechain) return this.ensureAgent(info, ts);
    let child = null;
    for (const a of this.agents.values()) {
      if (a.parentId === info.sessionId && a.status !== 'done') child = a;
    }
    return child;
  }

  update(a, patch, ts) {
    Object.assign(a, patch);
    if (ts && ts > a.lastActive) a.lastActive = ts;
    this.emit('agent', a);
  }

  remove(id) {
    if (!this.agents.has(id)) return;
    this.agents.delete(id);
    for (const [k, p] of this.pending) if (p.agentId === id) this.pending.delete(k);
    this.emit('remove', id);
    for (const a of [...this.agents.values()]) if (a.parentId === id) this.remove(a.id);
  }

  addLog(a, kind, text, ts, key) {
    if (key) {
      if (this.recentKeys.has(key)) return;
      this.recentKeys.set(key, ts);
    }
    const entry = { ts, agentId: a.id, project: a.project, kind, text: trunc(text, 140) };
    this.log.push(entry);
    if (this.log.length > MAX_LOG) this.log.shift();
    this.emit('log', entry);
  }

  // ---- events (shared by transcript watcher and hooks) ---------------------

  sessionStart(info, ts = Date.now()) {
    const a = this.ensureAgent(info, ts);
    this.update(a, { status: 'idle', detail: 'Session started', tool: null }, ts);
    this.addLog(a, 'session', 'Clocked in', ts, `start:${a.id}`);
  }

  userPrompt(info, text, ts = Date.now()) {
    const a = this.resolveAgent(info, ts);
    if (!a) return;
    const t = trunc(text, 120);
    this.update(a, { status: 'thinking', detail: t ? `Task: ${t}` : 'New task', tool: null, lastKind: 'prompt' }, ts);
    if (!info.sidechain) this.addLog(a, 'prompt', t || 'New task', ts, `prompt:${a.id}:${t.slice(0, 40)}`);
  }

  thinking(info, ts = Date.now()) {
    const a = this.resolveAgent(info, ts);
    if (!a) return;
    this.update(a, { status: 'thinking', detail: 'Thinking…', tool: null, lastKind: 'thinking' }, ts);
  }

  assistantText(info, text, ts = Date.now()) {
    const a = this.resolveAgent(info, ts);
    if (!a) return;
    const t = trunc(text, 120);
    if (!t) return;
    this.update(a, { status: 'thinking', detail: t, tool: null, lastKind: 'text' }, ts);
  }

  toolStart(info, toolUseId, name, input, ts = Date.now()) {
    const a = this.resolveAgent(info, ts);
    if (!a) return;
    const id = toolUseId || `hook-${a.id}-${++this.hookSeq}`;
    if (this.pending.has(id)) return; // already reported by the other source
    this.pending.set(id, { agentId: a.id, name, start: ts });
    const detail = describeTool(name, input);
    this.update(a, {
      status: classifyTool(name), detail, tool: name,
      toolCount: a.toolCount + 1, lastKind: 'tool',
    }, ts);
    this.addLog(a, classifyTool(name), detail, ts, `tool:${id}`);

    if (SUBAGENT_TOOLS.has(name)) {
      const child = this.ensureAgent({ sessionId: `${a.id}/${id}`, cwd: a.cwd }, ts);
      child.parentId = a.id;
      child.project = a.project;
      child.role = (input && input.subagent_type) || 'helper';
      this.update(child, {
        status: 'thinking',
        detail: trunc((input && (input.description || input.prompt)) || 'Sub-task', 80),
      }, ts);
      this.addLog(child, 'session', `Sub-agent "${child.role}" joined`, ts);
    }
  }

  toolEnd(info, toolUseId, isError, ts = Date.now(), toolName) {
    let id = toolUseId;
    if (!id && toolName) {
      // Hooks without tool_use_id: close the oldest pending call of this tool.
      for (const [k, p] of this.pending) {
        if (p.agentId === info.sessionId && p.name === toolName) { id = k; break; }
      }
    }
    const p = id && this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    const a = this.agents.get(p.agentId);
    if (!a) return;
    if (isError) this.addLog(a, 'error', `${p.name} failed`, ts, `err:${id}`);
    // Still busy with other tools? keep current status.
    const busy = [...this.pending.values()].some((q) => q.agentId === a.id);
    if (!busy) this.update(a, { status: 'thinking', detail: `Reviewing ${p.name} result`, tool: null, lastKind: 'result' }, ts);

    if (SUBAGENT_TOOLS.has(p.name)) {
      const child = this.agents.get(`${a.id}/${id}`);
      if (child) {
        this.update(child, { status: 'done', detail: 'Finished — heading out' }, ts);
        this.addLog(child, 'done', `Sub-agent "${child.role}" finished`, ts);
        setTimeout(() => this.remove(child.id), 4000).unref();
      }
    }
  }

  turnEnd(info, ts = Date.now()) {
    const a = this.agents.get(info.sessionId);
    if (!a || a.status === 'idle') return;
    for (const [k, p] of this.pending) if (p.agentId === a.id) this.pending.delete(k);
    this.update(a, { status: 'idle', detail: 'Waiting for your next task', tool: null, lastKind: 'end' }, ts);
    this.addLog(a, 'done', 'Turn complete', ts, `end:${a.id}:${Math.floor(ts / 5000)}`);
  }

  needsAttention(info, message, ts = Date.now()) {
    const a = this.ensureAgent(info, ts);
    const msg = trunc(message || 'Needs your attention', 100);
    if (/waiting for your input/i.test(msg)) return this.turnEnd(info, ts);
    this.update(a, { status: 'waiting', detail: msg }, ts);
    this.addLog(a, 'waiting', msg, ts, `wait:${a.id}:${msg}`);
  }

  sessionEnd(info, ts = Date.now()) {
    const a = this.agents.get(info.sessionId);
    if (!a) return;
    this.addLog(a, 'session', 'Clocked out', ts);
    this.remove(a.id);
  }

  // ---- heuristics -----------------------------------------------------------

  tick() {
    const now = Date.now();
    for (const [k, p] of this.recentKeys) if (now - p > 60000) this.recentKeys.delete(k);

    for (const p of this.pending.values()) {
      const a = this.agents.get(p.agentId);
      if (!a || a.status === 'waiting' || LONG_TOOLS.has(p.name)) continue;
      if (now - p.start > WAIT_GUESS_MS && now - a.lastActive > WAIT_GUESS_MS) {
        this.update(a, { status: 'waiting', detail: `Approve ${p.name}?` });
        this.addLog(a, 'waiting', `Probably waiting for permission (${p.name})`, now, `wait:${a.id}:${p.start}`);
      }
    }

    for (const a of [...this.agents.values()]) {
      const quiet = now - a.lastActive;
      if (quiet > REMOVE_MS && !a.parentId) { this.remove(a.id); continue; }
      const busy = [...this.pending.values()].some((p) => p.agentId === a.id);
      if (a.status === 'thinking' && a.lastKind === 'text' && !busy && quiet > TEXT_IDLE_MS) {
        this.update(a, { status: 'idle', detail: 'Waiting for your next task', tool: null });
      } else if (!['idle', 'waiting', 'done'].includes(a.status) && !busy && quiet > STALE_IDLE_MS) {
        this.update(a, { status: 'idle', detail: 'On a coffee break', tool: null });
      }
    }
  }

  snapshot() {
    return { agents: [...this.agents.values()], log: this.log.slice(-80) };
  }
}

module.exports = { OfficeState, classifyTool, describeTool };
