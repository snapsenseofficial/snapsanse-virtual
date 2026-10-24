'use strict';
// TikTok official API (Login Kit + Display API v2): profile stats and the
// public metrics of your videos. Read-only: this app never posts.
const { loadConfig } = require('./config');
const { loadToken, saveToken, pkce, postForm } = require('./oauth');

const SCOPES = ['user.info.basic', 'user.info.stats', 'video.list'];
const API = 'https://open.tiktokapis.com/v2';

function authUrl(redirectUri) {
  const { tiktok } = loadConfig();
  if (!tiktok.clientKey) throw new Error('Set tiktok.clientKey in crew/config.json');
  const p = pkce();
  const url = 'https://www.tiktok.com/v2/auth/authorize/?' + new URLSearchParams({
    client_key: tiktok.clientKey, response_type: 'code', scope: SCOPES.join(','), redirect_uri: redirectUri,
    state: p.state, code_challenge: p.challenge, code_challenge_method: 'S256',
  });
  return { url, ...p };
}

async function exchange(code, verifier, redirectUri) {
  const { tiktok } = loadConfig();
  const tok = await postForm(`${API}/oauth/token/`, {
    client_key: tiktok.clientKey, client_secret: tiktok.clientSecret || '', code, grant_type: 'authorization_code',
    redirect_uri: redirectUri, code_verifier: verifier,
  });
  return saveToken('tiktok', tok);
}

async function accessToken() {
  const { tiktok } = loadConfig();
  const t = loadToken('tiktok');
  if (!t) throw new Error('TikTok not connected. Open the office and click "Connect TikTok".');
  if (t.expires_at && Date.now() < t.expires_at) return t.access_token;
  const fresh = await postForm(`${API}/oauth/token/`, {
    client_key: tiktok.clientKey, client_secret: tiktok.clientSecret || '', grant_type: 'refresh_token', refresh_token: t.refresh_token,
  });
  return saveToken('tiktok', { ...t, ...fresh }).access_token;
}

async function call(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { Authorization: `Bearer ${await accessToken()}`, ...(opts.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json.error && json.error.code && json.error.code !== 'ok')) {
    throw new Error(`TikTok API ${res.status}: ${(json.error && json.error.message) || JSON.stringify(json)}`);
  }
  return json.data || {};
}

async function profile() {
  const fields = 'open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count';
  return (await call(`/user/info/?fields=${fields}`)).user || {};
}

async function videos(max = 20) {
  const fields = 'id,title,video_description,create_time,share_url,duration,view_count,like_count,comment_count,share_count';
  const out = [];
  let cursor;
  while (out.length < max) {
    const d = await call(`/video/list/?fields=${fields}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_count: Math.min(20, max - out.length), ...(cursor ? { cursor } : {}) }),
    });
    out.push(...(d.videos || []));
    if (!d.has_more) break;
    cursor = d.cursor;
  }
  return out;
}

// Engagement summary used by reports (pure, unit-tested).
function summarize(user, vids) {
  const rows = vids.map((v) => {
    const views = v.view_count || 0;
    const eng = (v.like_count || 0) + (v.comment_count || 0) + (v.share_count || 0);
    return {
      id: v.id, title: (v.title || v.video_description || '').slice(0, 80), url: v.share_url,
      posted: v.create_time ? new Date(v.create_time * 1000).toISOString().slice(0, 10) : null,
      views, likes: v.like_count || 0, comments: v.comment_count || 0, shares: v.share_count || 0,
      engagementRate: views ? +(eng / views * 100).toFixed(2) : 0,
    };
  });
  const views = rows.reduce((n, r) => n + r.views, 0);
  const eng = rows.reduce((n, r) => n + r.likes + r.comments + r.shares, 0);
  return {
    followers: user.follower_count || 0, totalLikes: user.likes_count || 0, videoCount: user.video_count || 0,
    recentVideos: rows.length, avgViews: rows.length ? Math.round(views / rows.length) : 0,
    avgEngagementRate: views ? +(eng / views * 100).toFixed(2) : 0,
    top: [...rows].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 5),
    videos: rows,
  };
}

const connected = () => !!loadToken('tiktok');

module.exports = { SCOPES, authUrl, exchange, profile, videos, summarize, connected };
