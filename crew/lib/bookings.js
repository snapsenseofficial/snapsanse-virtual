'use strict';
// New-booking detection for the Google Form / Sheet behind the catalogue site.
const path = require('path');
const { P, readJSON, writeJSON } = require('./config');

const SEEN = path.join(P.data, 'bookings-seen.json');

// A row's identity: the form timestamp if present, else its whole content.
function rowKey(row) {
  const ts = row.Timestamp || row['Cap masa'] || row['Tarikh & Masa'] || row.timestamp;
  const { _row, ...rest } = row;
  return ts ? `ts:${ts}` : `row:${JSON.stringify(rest)}`;
}

// Pure: which rows have not been seen yet.
function diff(rows, seenKeys) {
  const seen = new Set(seenKeys);
  return rows.filter((r) => !seen.has(rowKey(r)));
}

function loadSeen() { return readJSON(SEEN, []); }
function markSeen(rows) {
  const keys = new Set(loadSeen());
  rows.forEach((r) => keys.add(rowKey(r)));
  writeJSON(SEEN, [...keys].slice(-5000));
}

module.exports = { rowKey, diff, loadSeen, markSeen };
