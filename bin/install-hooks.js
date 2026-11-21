#!/usr/bin/env node
'use strict';
// Adds (or removes with --uninstall) Pixel Office hooks to Claude Code settings.
// Hooks are optional: transcripts already work. Hooks add instant updates and
// exact "needs permission" detection.
//   node bin/install-hooks.js            -> ~/.claude/settings.json
//   node bin/install-hooks.js --project  -> ./.claude/settings.json
//   node bin/install-hooks.js --uninstall
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const uninstall = args.includes('--uninstall');
const base = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const file = args.includes('--project')
  ? path.join(process.cwd(), '.claude', 'settings.json')
  : path.join(base, 'settings.json');

const hookScript = path.resolve(__dirname, 'hook.js');
const MARKER = 'pixel-office';
const command = `node "${hookScript}" # ${MARKER}`;
const EVENTS = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SessionEnd'];
const TOOL_EVENTS = new Set(['PreToolUse', 'PostToolUse']);

let settings = {};
if (fs.existsSync(file)) {
  const raw = fs.readFileSync(file, 'utf8');
  try { settings = raw.trim() ? JSON.parse(raw) : {}; } catch (e) {
    console.error(`✖ ${file} is not valid JSON, refusing to touch it.`);
    process.exit(1);
  }
  fs.writeFileSync(`${file}.bak`, raw);
}
settings.hooks = settings.hooks || {};

// Remove our previous entries first (idempotent install / clean uninstall).
for (const ev of Object.keys(settings.hooks)) {
  settings.hooks[ev] = (settings.hooks[ev] || [])
    .map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !String(h.command || '').includes(MARKER)) }))
    .filter((g) => g.hooks.length);
  if (!settings.hooks[ev].length) delete settings.hooks[ev];
}

if (!uninstall) {
  for (const ev of EVENTS) {
    const group = { hooks: [{ type: 'command', command, timeout: 3 }] };
    if (TOOL_EVENTS.has(ev)) group.matcher = '*';
    (settings.hooks[ev] = settings.hooks[ev] || []).push(group);
  }
}
if (!Object.keys(settings.hooks).length) delete settings.hooks;

fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
console.log(uninstall ? `✔ Pixel Office hooks removed from ${file}` : `✔ Pixel Office hooks installed in ${file}`);
if (fs.existsSync(`${file}.bak`)) console.log(`  (backup: ${file}.bak)`);
if (!uninstall) console.log('  Restart running Claude Code sessions to pick them up.');
