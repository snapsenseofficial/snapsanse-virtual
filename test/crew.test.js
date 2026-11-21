'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.SNAPSENSE_CREW_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-'));
const approvals = require('../crew/lib/approvals');
const bookings = require('../crew/lib/bookings');
const tiktok = require('../crew/lib/tiktok');

test('proposals wait for a decision and cannot be decided twice', () => {
  const a = approvals.propose({ kind: 'calendar-event', title: 'Shoot', by: 'bookings', payload: { start: 'x' } });
  assert.strictEqual(a.status, 'pending');
  assert.throws(() => approvals.propose({ kind: 'post-to-tiktok', title: 'nope' }));
  const d = approvals.decide(a.id, 'approved', { link: 'L' });
  assert.strictEqual(d.status, 'approved');
  assert.throws(() => approvals.decide(a.id, 'rejected'));
});

test('only unseen bookings are reported', () => {
  const rows = [{ _row: 2, Timestamp: '1/10/2026 10:00', Nama: 'Ali' }, { _row: 3, Timestamp: '1/10/2026 11:00', Nama: 'Siti' }];
  assert.strictEqual(bookings.diff(rows, []).length, 2);
  bookings.markSeen([rows[0]]);
  const fresh = bookings.diff(rows, bookings.loadSeen());
  assert.deepStrictEqual(fresh.map((r) => r.Nama), ['Siti']);
});

test('TikTok engagement summary', () => {
  const s = tiktok.summarize({ follower_count: 1200, likes_count: 9000, video_count: 40 }, [
    { id: 'a', title: 'Wedding BTS', view_count: 1000, like_count: 80, comment_count: 10, share_count: 10, create_time: 1790000000 },
    { id: 'b', title: 'Product shoot', view_count: 3000, like_count: 60, comment_count: 0, share_count: 0 },
  ]);
  assert.strictEqual(s.avgViews, 2000);
  assert.strictEqual(s.videos[0].engagementRate, 10);
  assert.strictEqual(s.avgEngagementRate, 4);
  assert.strictEqual(s.top[0].id, 'a');
});
