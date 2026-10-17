'use strict';
// The approval queue: agents propose, the human approves in the office.
const crypto = require('crypto');
const path = require('path');
const { P, readJSON, writeJSON } = require('./config');

const FILE = path.join(P.data, 'approvals.json');
const KINDS = new Set(['calendar-event', 'drive-upload', 'reply', 'note']);

const all = () => readJSON(FILE, []);
const save = (list) => writeJSON(FILE, list.slice(-300));

function propose({ kind, title, details, payload, by }) {
  if (!KINDS.has(kind)) throw new Error(`Unknown proposal kind "${kind}" (use ${[...KINDS].join(', ')})`);
  if (!title) throw new Error('A proposal needs a title');
  const item = { id: crypto.randomBytes(6).toString('hex'), kind, title, details: details || '', payload: payload || {}, by: by || 'agent', status: 'pending', createdAt: new Date().toISOString() };
  const list = all();
  list.push(item);
  save(list);
  return item;
}

function decide(id, status, result) {
  const list = all();
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error('No such proposal');
  if (item.status !== 'pending') throw new Error(`Already ${item.status}`);
  Object.assign(item, { status, decidedAt: new Date().toISOString(), result: result || null });
  save(list);
  return item;
}

module.exports = { FILE, all, propose, decide, KINDS };
