'use strict';
// Minimal Google APIs client (Calendar, Sheets, Drive) using OAuth for
// installed apps with a loopback redirect. No SDK dependency.
const { loadConfig } = require('./config');
const { loadToken, saveToken, pkce, postForm } = require('./oauth');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

function authUrl(redirectUri) {
  const { google } = loadConfig();
  if (!google.clientId) throw new Error('Set google.clientId in crew/config.json');
  const p = pkce();
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: google.clientId, redirect_uri: redirectUri, response_type: 'code', scope: SCOPES.join(' '),
    access_type: 'offline', prompt: 'consent', state: p.state, code_challenge: p.challenge, code_challenge_method: 'S256',
  });
  return { url, ...p };
}

async function exchange(code, verifier, redirectUri) {
  const { google } = loadConfig();
  const tok = await postForm('https://oauth2.googleapis.com/token', {
    code, client_id: google.clientId, client_secret: google.clientSecret || '', redirect_uri: redirectUri,
    grant_type: 'authorization_code', code_verifier: verifier,
  });
  return saveToken('google', tok);
}

async function accessToken() {
  const { google } = loadConfig();
  const t = loadToken('google');
  if (!t) throw new Error('Google not connected. Open the office and click "Connect Google".');
  if (t.expires_at && Date.now() < t.expires_at) return t.access_token;
  const fresh = await postForm('https://oauth2.googleapis.com/token', {
    client_id: google.clientId, client_secret: google.clientSecret || '', refresh_token: t.refresh_token, grant_type: 'refresh_token',
  });
  return saveToken('google', { ...t, ...fresh, refresh_token: fresh.refresh_token || t.refresh_token }).access_token;
}

async function api(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${await accessToken()}`, ...(opts.headers || {}) } });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`Google API ${res.status}: ${(json.error && json.error.message) || text}`);
  return json;
}

const cal = () => encodeURIComponent(loadConfig().google.calendarId || 'primary');

async function listEvents(days = 7, from = new Date()) {
  const to = new Date(from.getTime() + days * 864e5);
  const q = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '100' });
  const r = await api(`https://www.googleapis.com/calendar/v3/calendars/${cal()}/events?${q}`);
  return (r.items || []).map((e) => ({
    id: e.id, title: e.summary || '(no title)', start: e.start.dateTime || e.start.date, end: e.end.dateTime || e.end.date,
    location: e.location || '', link: e.htmlLink,
  }));
}

async function freeBusy(fromISO, toISO) {
  const { google, timezone } = loadConfig();
  const r = await api('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin: fromISO, timeMax: toISO, timeZone: timezone, items: [{ id: google.calendarId || 'primary' }] }),
  });
  const c = r.calendars && Object.values(r.calendars)[0];
  return (c && c.busy) || [];
}

async function createEvent({ title, start, end, description, location }) {
  const { timezone } = loadConfig();
  return api(`https://www.googleapis.com/calendar/v3/calendars/${cal()}/events`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: title, description, location, start: { dateTime: start, timeZone: timezone }, end: { dateTime: end, timeZone: timezone } }),
  });
}

async function sheetRows(sheetId, range) {
  const r = await api(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`);
  const [header = [], ...rows] = r.values || [];
  return rows.map((row, i) => {
    const o = { _row: i + 2 };
    header.forEach((h, j) => { o[h || `col${j + 1}`] = row[j] || ''; });
    return o;
  });
}

async function driveSearch(query, folderId) {
  const parts = ['trashed = false'];
  if (query) parts.push(`name contains '${query.replace(/'/g, "\\'")}'`);
  if (folderId) parts.push(`'${folderId}' in parents`);
  const q = new URLSearchParams({ q: parts.join(' and '), fields: 'files(id,name,mimeType,modifiedTime,webViewLink)', orderBy: 'modifiedTime desc', pageSize: '30' });
  return (await api(`https://www.googleapis.com/drive/v3/files?${q}`)).files || [];
}

// Upload text as a Google Doc into a folder.
async function uploadDoc(name, text, folderId) {
  const boundary = `snap${Date.now()}`;
  const meta = { name, mimeType: 'application/vnd.google-apps.document', ...(folderId ? { parents: [folderId] } : {}) };
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${text}\r\n--${boundary}--`;
  return api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
  });
}

const connected = () => !!loadToken('google');

module.exports = { SCOPES, authUrl, exchange, listEvents, freeBusy, createEvent, sheetRows, driveSearch, uploadDoc, connected };
