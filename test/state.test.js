'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { OfficeState, classifyTool, describeTool } = require('../lib/state');
const { TranscriptWatcher } = require('../lib/watcher');

const info = { sessionId: 's1', cwd: '/home/me/my-app' };

test('classifies tools into visual statuses', () => {
  assert.strictEqual(classifyTool('Edit'), 'typing');
  assert.strictEqual(classifyTool('Grep'), 'reading');
  assert.strictEqual(classifyTool('Bash'), 'running');
  assert.strictEqual(classifyTool('mcp__github__get_me'), 'browsing');
  assert.strictEqual(describeTool('Read', { file_path: '/a/b/c.ts' }), 'Read c.ts');
});

test('tool lifecycle updates agent and dedupes hook + transcript reports', () => {
  const s = new OfficeState();
  s.userPrompt(info, 'Build it');
  s.toolStart(info, 'tu1', 'Edit', { file_path: 'x.ts' });
  s.toolStart(info, 'tu1', 'Edit', { file_path: 'x.ts' }); // second source
  const a = s.agents.get('s1');
  assert.strictEqual(a.project, 'my-app');
  assert.strictEqual(a.status, 'typing');
  assert.strictEqual(a.toolCount, 1);
  s.toolEnd(info, 'tu1', false);
  assert.strictEqual(a.status, 'thinking');
  s.turnEnd(info);
  assert.strictEqual(a.status, 'idle');
});

test('Task tool spawns and retires a sub-agent', () => {
  const s = new OfficeState();
  s.toolStart(info, 't9', 'Task', { description: 'Explore', subagent_type: 'Explore' });
  const child = s.agents.get('s1/t9');
  assert.ok(child);
  assert.strictEqual(child.parentId, 's1');
  // sidechain lines are attributed to the child
  s.toolStart({ ...info, sidechain: true }, 'c1', 'Grep', { pattern: 'x' });
  assert.strictEqual(child.status, 'reading');
  s.toolEnd(info, 'c1', false);
  s.toolEnd(info, 't9', false);
  assert.strictEqual(child.status, 'done');
});

test('watcher parses transcript lines', () => {
  const s = new OfficeState();
  const w = new TranscriptWatcher(s, []);
  const file = '/x/.claude/projects/-home-me-app/s2.jsonl';
  w.handle({ type: 'user', cwd: '/home/me/app', message: { content: 'Hello there' } }, file);
  w.handle({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'a', name: 'Bash', input: { command: 'ls' } }], stop_reason: 'tool_use' } }, file);
  assert.strictEqual(s.agents.get('s2').status, 'running');
  w.handle({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'a' }] } }, file);
  w.handle({ type: 'assistant', message: { content: [{ type: 'text', text: 'Done!' }], stop_reason: 'end_turn' } }, file);
  assert.strictEqual(s.agents.get('s2').status, 'idle');
});

test('office.config.json maps projects to job roles', () => {
  const s = new OfficeState({ roles: { 'my-app': 'video-editor' } });
  s.userPrompt(info, 'Cut a reel');
  assert.strictEqual(s.agents.get('s1').jobRole, 'video-editor');
  s.userPrompt({ sessionId: 's9', cwd: '/x/other' }, 'hi');
  assert.strictEqual(s.agents.get('s9').jobRole, null);
});
