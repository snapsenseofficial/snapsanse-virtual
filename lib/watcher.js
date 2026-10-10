'use strict';
// Tails Claude Code transcript files (~/.claude/projects/**/*.jsonl)
// and feeds every new line into OfficeState. Read-only: never writes there.

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ACTIVE_WINDOW_MS = 20 * 60 * 1000; // only pick up recently-touched sessions
const BACKFILL_BYTES = 64 * 1024;          // context read when a file is first seen
const MAX_READ = 1024 * 1024;
const SCAN_MS = 1000;

function ts(obj) {
  const t = obj && obj.timestamp ? Date.parse(obj.timestamp) : NaN;
  return Number.isFinite(t) ? Math.min(t, Date.now()) : Date.now();
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter((b) => b && b.type === 'text').map((b) => b.text).join(' ');
}

// Prompts Claude Code injects itself (slash-command plumbing, reminders, ...)
function isSyntheticPrompt(text) {
  return /^\s*<(command-|local-command|system-reminder|bash-|user-memory)/.test(text) ||
    /^\s*Caveat:/.test(text);
}

class TranscriptWatcher {
  constructor(state, roots, opts = {}) {
    this.state = state;
    this.roots = roots;
    this.verbose = !!opts.verbose;
    this.files = new Map(); // file -> { offset, buf }
    this.busy = false;
  }

  start() {
    this.scan();
    this.timer = setInterval(() => this.scan(), SCAN_MS);
    this.timer.unref();
  }

  async scan() {
    if (this.busy) return;
    this.busy = true;
    try {
      for (const root of this.roots) {
        for (const file of await this.list(root, 0)) await this.poll(file);
      }
    } catch (e) {
      if (this.verbose) console.error('[watcher]', e.message);
    } finally {
      this.busy = false;
    }
  }

  async list(dir, depth) {
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch (_) { return []; }
    const out = [];
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && depth < 3) out.push(...await this.list(p, depth + 1));
      else if (e.isFile() && e.name.endsWith('.jsonl')) out.push(p);
    }
    return out;
  }

  async poll(file) {
    let st;
    try { st = await fsp.stat(file); } catch (_) { this.files.delete(file); return; }
    let t = this.files.get(file);
    if (!t) {
      if (Date.now() - st.mtimeMs > ACTIVE_WINDOW_MS) return;
      const offset = Math.max(0, st.size - BACKFILL_BYTES);
      t = { offset, buf: '', skipPartial: offset > 0 };
      this.files.set(file, t);
      if (this.verbose) console.log('[watcher] tracking', file);
    }
    if (st.size < t.offset) { t.offset = 0; t.buf = ''; } // truncated / rewritten
    if (st.size === t.offset) return;

    const len = Math.min(st.size - t.offset, MAX_READ);
    const fh = await fsp.open(file, 'r');
    try {
      const { bytesRead, buffer } = await fh.read(Buffer.alloc(len), 0, len, t.offset);
      t.offset += bytesRead;
      t.buf += buffer.toString('utf8', 0, bytesRead);
    } finally {
      await fh.close();
    }
    const lines = t.buf.split('\n');
    t.buf = lines.pop();
    if (t.skipPartial) { lines.shift(); t.skipPartial = false; }
    for (const line of lines) {
      if (!line.trim()) continue;
      let obj;
      try { obj = JSON.parse(line); } catch (_) { continue; }
      try { this.handle(obj, file); } catch (e) { if (this.verbose) console.error('[watcher] line', e); }
    }
  }

  handle(obj, file) {
    const projectDir = path.basename(path.dirname(file));
    const fileId = path.basename(file, '.jsonl');
    const sessionId = obj.sessionId || fileId;
    const info = {
      sessionId,
      cwd: obj.cwd,
      projectDir: projectDir.startsWith('-') ? projectDir : path.basename(path.dirname(path.dirname(file))),
      // Sub-agent transcripts live in their own files (agent-*.jsonl / subagents/)
      sidechain: !!obj.isSidechain || (fileId !== sessionId && fileId.startsWith('agent-')),
    };
    const t = ts(obj);
    const s = this.state;
    const content = obj.message && obj.message.content;

    if (obj.type === 'user') {
      if (obj.isMeta) return;
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b && b.type === 'tool_result') s.toolEnd(info, b.tool_use_id, !!b.is_error, t);
        }
      }
      const text = textOf(content);
      if (!text) return;
      if (/^\[Request interrupted/.test(text)) return s.turnEnd(info, t);
      if (!isSyntheticPrompt(text)) s.userPrompt(info, text, t);
      return;
    }

    if (obj.type === 'assistant' && Array.isArray(content)) {
      for (const b of content) {
        if (!b) continue;
        if (b.type === 'tool_use') s.toolStart(info, b.id, b.name, b.input, t);
        else if (b.type === 'text') s.assistantText(info, b.text, t);
        else if (b.type === 'thinking' || b.type === 'redacted_thinking') s.thinking(info, t);
      }
      const stop = obj.message.stop_reason;
      if (!info.sidechain && (stop === 'end_turn' || stop === 'stop_sequence')) s.turnEnd(info, t);
      return;
    }

    if (obj.type === 'system' && /turn_duration|stop_hook/.test(obj.subtype || '') && !info.sidechain) {
      s.turnEnd(info, t);
    }
  }
}

module.exports = { TranscriptWatcher };
