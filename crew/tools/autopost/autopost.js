#!/usr/bin/env node
// SnapSense auto-post: publish one rendered poster to the Facebook Page and Instagram (feed or story).
//
//   node crew/tools/autopost/autopost.js whoami
//   node crew/tools/autopost/autopost.js post --type feed  --image 4-sales-feed.jpg  --caption-file cap.txt [--only fb|ig] [--dry-run]
//   node crew/tools/autopost/autopost.js post --type story --image 4-sales-story.jpg [--only fb|ig] [--dry-run]
//
// Env: META_PAGE_TOKEN (Page access token with pages_manage_posts, pages_read_engagement,
//      pages_show_list, instagram_basic, instagram_content_publish). Optional META_PAGE_ID, META_IG_ID,
//      META_GRAPH_VERSION (default v21.0). The token is never printed.
//
// How the image reaches Instagram: Instagram's API only takes a public image URL, so the poster is first
// uploaded to the Facebook Page (unpublished for stories), and Instagram fetches it from Meta's own CDN.
// Prints one JSON line: {ok, fb:{id}, ig:{id}, errors:[...]}. Exit code 1 if anything failed.
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const flag = (k) => argv.includes(`--${k}`);

const TOKEN = process.env.META_PAGE_TOKEN || '';
const V = process.env.META_GRAPH_VERSION || 'v21.0';
const G = `https://graph.facebook.com/${V}`;
const DRY = flag('dry-run');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const redact = (s) => String(s).split(TOKEN || '\u0000').join('***');

async function api(method, p, params = {}, body = null) {
  const u = new URL(p.startsWith('http') ? p : `${G}/${p}`);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  u.searchParams.set('access_token', TOKEN);
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(u, { method, body });
      const j = await r.json().catch(() => ({}));
      if (r.ok && !j.error) return j;
      const e = j.error || {};
      lastErr = new Error(`${method} ${p}: ${r.status} ${e.type || ''} ${e.code || ''} ${e.message || ''}`.trim());
      if (r.status < 500 && e.code !== 2 && e.code !== 4) break; // only retry transient errors
    } catch (e) { lastErr = e; }
    await sleep(2000 * (attempt + 1));
  }
  throw new Error(redact(lastErr && lastErr.message));
}

async function ids() {
  let page = process.env.META_PAGE_ID, ig = process.env.META_IG_ID, name = '', igUser = '';
  if (!page || !ig) {
    const me = await api('GET', 'me', { fields: 'id,name,instagram_business_account{id,username}' });
    page = page || me.id; name = me.name || '';
    ig = ig || (me.instagram_business_account && me.instagram_business_account.id);
    igUser = (me.instagram_business_account && me.instagram_business_account.username) || '';
  }
  if (!page) throw new Error('No Facebook Page id (use a Page access token or set META_PAGE_ID)');
  return { page, ig, name, igUser };
}

function imageForm(file, extra) {
  const fd = new FormData();
  fd.append('source', new Blob([fs.readFileSync(file)], { type: 'image/jpeg' }), path.basename(file));
  for (const [k, v] of Object.entries(extra)) if (v != null) fd.append(k, String(v));
  return fd;
}
async function cdnUrl(photoId) {
  const j = await api('GET', photoId, { fields: 'images' });
  const best = (j.images || []).sort((a, b) => b.width - a.width)[0];
  if (!best) throw new Error(`no image URL for photo ${photoId}`);
  return best.source;
}
async function igPublish(ig, params) {
  const c = await api('POST', `${ig}/media`, params);
  for (let i = 0; i < 30; i++) { // wait until Instagram has fetched and processed the image
    const s = await api('GET', c.id, { fields: 'status_code' });
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`instagram container ${s.status_code}`);
    await sleep(3000);
  }
  return api('POST', `${ig}/media_publish`, { creation_id: c.id });
}

async function post() {
  const type = opt('type');
  const file = opt('image');
  const only = opt('only');
  if (!['feed', 'story'].includes(type)) throw new Error('--type feed|story');
  if (!file || !fs.existsSync(file)) throw new Error(`image not found: ${file}`);
  const capFile = opt('caption-file');
  const caption = capFile ? fs.readFileSync(capFile, 'utf8').trim() : (opt('caption') || '');
  if (type === 'feed' && !caption) throw new Error('feed posts need --caption-file');
  const out = { ok: true, type, image: path.basename(file), fb: null, ig: null, errors: [] };
  if (DRY) { out.dryRun = true; out.captionChars = caption.length; console.log(JSON.stringify(out)); return; }
  if (!TOKEN) throw new Error('META_PAGE_TOKEN is not set');
  const { page, ig } = await ids();

  // 1) Facebook: the poster goes up first (Instagram needs its CDN URL)
  let photoId;
  try {
    if (type === 'feed') {
      const r = await api('POST', `${page}/photos`, {}, imageForm(file, { caption, published: only === 'ig' ? 'false' : 'true' }));
      photoId = r.id; if (only !== 'ig') out.fb = { id: r.post_id || r.id };
    } else {
      const r = await api('POST', `${page}/photos`, {}, imageForm(file, { published: 'false' }));
      photoId = r.id;
      if (only !== 'ig') { const s = await api('POST', `${page}/photo_stories`, { photo_id: photoId }); out.fb = { id: s.post_id || s.id || photoId }; }
    }
  } catch (e) { out.errors.push(`facebook: ${e.message}`); }

  // 2) Instagram
  if (only !== 'fb') {
    try {
      if (!ig) throw new Error('no Instagram professional account linked to this Page');
      if (!photoId) throw new Error('skipped: Facebook upload failed, so no image URL for Instagram');
      const url = await cdnUrl(photoId);
      const r = type === 'feed' ? await igPublish(ig, { image_url: url, caption }) : await igPublish(ig, { image_url: url, media_type: 'STORIES' });
      out.ig = { id: r.id };
    } catch (e) { out.errors.push(`instagram: ${e.message}`); }
  }
  out.ok = out.errors.length === 0;
  console.log(JSON.stringify(out));
  if (!out.ok) process.exitCode = 1;
}

(async () => {
  try {
    if (cmd === 'whoami') {
      if (!TOKEN) throw new Error('META_PAGE_TOKEN is not set');
      const r = await ids();
      console.log(JSON.stringify({ ok: true, page: r.page, pageName: r.name, ig: r.ig || null, igUsername: r.igUser || null }));
    } else if (cmd === 'post') await post();
    else { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 16).join('\n')); }
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: redact(e.message) }));
    process.exitCode = 1;
  }
})();
