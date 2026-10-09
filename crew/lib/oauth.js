'use strict';
// Token storage + refresh shared by the Google and TikTok clients.
const crypto = require('crypto');
const path = require('path');
const { P, readJSON, writeJSON } = require('./config');

const tokenFile = (name) => path.join(P.secrets, `${name}.json`);
const loadToken = (name) => readJSON(tokenFile(name), null);
function saveToken(name, tok) {
  const t = { ...tok, obtained_at: Date.now() };
  if (tok.expires_in) t.expires_at = Date.now() + (tok.expires_in - 60) * 1000;
  writeJSON(tokenFile(name), t);
  return t;
}

function pkce() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge, state: crypto.randomBytes(16).toString('hex') };
}

async function postForm(url, form) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`OAuth ${res.status}: ${json.error_description || json.error || JSON.stringify(json)}`);
  return json;
}

module.exports = { loadToken, saveToken, pkce, postForm };
