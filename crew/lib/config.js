'use strict';
// Paths and settings for the live crew. Secrets and data never leave crew/
// (all gitignored): config.json, secrets/, data/, output/.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const P = {
  root: ROOT,
  config: path.join(ROOT, 'config.json'),
  jobs: path.join(ROOT, 'jobs.json'),
  secrets: path.join(ROOT, 'secrets'),
  data: process.env.SNAPSENSE_CREW_DATA || path.join(ROOT, 'data'),
  output: path.join(ROOT, 'output'),
  workspaces: path.join(ROOT, 'workspaces'),
  tool: path.join(ROOT, 'tools', 'snapsense.js'),
};

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
}

// Write atomically, private to the user (tokens live in these files).
function writeJSON(file, value, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode });
  fs.renameSync(tmp, file);
}

function loadConfig() {
  const c = readJSON(P.config, {});
  return {
    timezone: c.timezone || 'Asia/Kuala_Lumpur',
    google: { calendarId: 'primary', bookingsRange: 'A:Z', ...(c.google || {}) },
    tiktok: { ...(c.tiktok || {}) },
    claude: { bin: 'claude', ...(c.claude || {}) },
  };
}

module.exports = { P, readJSON, writeJSON, loadConfig };
