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

test('every desk has a distinct role', () => {
  assert.strictEqual(roles.ROLES.length, 12);
  assert.strictEqual(new Set(roles.ROLES.map((r) => r.id)).size, 12);
});

test('project names map to roles by keyword', () => {
  const role = (project) => roles.pick({ project }, new Set()).id;
  assert.strictEqual(role('reels-editor'), 'video-editor');
  assert.strictEqual(role('photo-archive'), 'photographer');
  assert.strictEqual(role('brand-kit'), 'graphic-designer');
  assert.strictEqual(role('ad-campaign'), 'marketing-manager');
  assert.strictEqual(role('client-portal'), 'web-developer');
  assert.strictEqual(role('instagram-social'), 'social-media');
});

test('explicit jobRole wins; unmatched agents take a free role', () => {
  assert.strictEqual(roles.pick({ project: 'reels', jobRole: 'copywriter' }, new Set()).id, 'copywriter');
  assert.strictEqual(roles.pick({ project: 'zzz' }, new Set(['web-developer'])).id, 'content-creator');
  assert.strictEqual(roles.pick({ project: 'x', parentId: 'p', role: 'Explore' }, new Set()).id, 'assistant');
});
