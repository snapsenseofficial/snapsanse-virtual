'use strict';
// roles.js is a browser script; load it into a sandbox with a fake window.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/roles.js'), 'utf8'), ctx);
const roles = ctx.window.PO.roles;

test('four departments with six roles each, plus PA and Head of Marketing', () => {
  assert.strictEqual(roles.DEPTS.length, 4);
  assert.strictEqual(roles.ROLES.length, 26);
  assert.strictEqual(new Set(roles.ROLES.map((r) => r.id)).size, 26);
  for (const d of roles.DEPTS) {
    assert.deepStrictEqual([...roles.ROLES.filter((r) => r.dept === d.id).map((r) => r.type)],
      ['manager', 'creator', 'designer', 'editor', 'copywriter', 'planner']);
  }
  assert.ok(roles.get('pa') && roles.get('hom'));
});

test('project names map to a job and a department by keyword', () => {
  const role = (project) => roles.pick({ project }, new Set()).id;
  assert.strictEqual(role('reels-editor'), 'awareness-editor');
  assert.strictEqual(role('testimonial-poster'), 'trust-designer');
  assert.strictEqual(role('promo-caption'), 'sales-copywriter');
  assert.strictEqual(role('bts-vlog'), 'authenticity-creator');
});

test('explicit jobRole wins, old role ids still work; unmatched agents take a free role', () => {
  assert.strictEqual(roles.pick({ project: 'reels', jobRole: 'sales-copywriter' }, new Set()).id, 'sales-copywriter');
  assert.strictEqual(roles.pick({ project: 'x', jobRole: 'social-media' }, new Set()).id, 'awareness-planner');
  assert.strictEqual(roles.pick({ project: 'zzz' }, new Set(['authenticity-manager'])).id, 'awareness-manager');
  assert.strictEqual(roles.pick({ project: 'reels-editor' }, new Set(['awareness-editor'])).id, 'authenticity-editor');
  assert.strictEqual(roles.pick({ project: 'x', parentId: 'p', role: 'Explore' }, new Set()).id, 'assistant');
});
