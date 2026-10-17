---
name: meta-autopost
description: SnapSense planners (Adam, Lili, Khairul, Haziq) — publish the day's rendered story and feed poster to the SnapSense Facebook Page, Instagram and Threads (feed only) at the scheduled time, from the Post Queue, and record the result. Use when a posting routine fires or the owner asks to post now.
---

# Auto-post to Facebook + Instagram + Threads (SnapSense planners)

| Dept | Planner (office id) | Story | Feed |
|---|---|---|---|
| Authenticity | Adam (`adam`) | 08:30 | 09:30 |
| Awareness | Lili (`lili`) | 11:30 | 12:30 |
| Trust | Khairul (`khairul`) | 15:30 | 17:30 |
| Sales | Haziq (`green`) | 19:30 | 21:00 |
Times are Malaysia time (UTC+8).

- **Post Queue** (posters + captions + status): https://claude.ai/artifact/3uRoQJpfoTLVZUPUF19Z8v
  - collection `posts`, doc id `<YYYY-MM-DD>_<dept>_<feed|story>`
  - fields: `date, time, at, dept, type, agent, assetId, url, caption, status (scheduled|posting|posted|failed|skipped), fb, ig, threads, threadsError, error, postedAt`
  - doc `settings/meta`: connection state shown on the page.
- **Script**: `node crew/tools/autopost/autopost.js` (`whoami`, `post --type feed|story --image <jpg> [--caption-file f] [--only fb|ig|threads] [--no-threads] [--dry-run]`). It prints one JSON line and exits 1 on failure.
- **Threads**: feed posts also go to Threads (no stories there). The script cuts the caption to 500 characters, keeps the WhatsApp/DM line and one topic tag. It needs a second Network secret on host `graph.threads.net` (Bearer) holding the Threads user token (`threads_basic, threads_content_publish`, expires after 60 days). A Threads failure lands in `threadsError` and does not fail the FB/IG post.
- **Needs** (owner sets once): a **Network secret** on the cloud environment for host `graph.facebook.com` (Bearer, Authorization header) holding a System User token, or env `META_PAGE_TOKEN`. Old note:
  - env `META_PAGE_TOKEN`: a Page access token with `pages_manage_posts, pages_read_engagement, pages_show_list, instagram_basic, instagram_content_publish`
  - network access to `graph.facebook.com` and `*.fbcdn.net`.

## Steps for one slot
1. Office: set your crew doc to `running`, detail "<Name>: posting <type> <Dept> <time>" (skill `office-status`).
2. Read the queue doc with `ArtifactData get`. If `status` is `posted`, stop: it is already done. Never post the same slot twice.
3. Run `node crew/tools/autopost/autopost.js whoami` (auth comes from the environment's network secret). If it fails:
   - write `status: "skipped"` and `error: "<short reason>"` to the doc
   - update `settings/meta` with `connected: false` and a `note`
   - set your office status to `waiting`, detail "<Name>: tunggu token Meta"
   - stop.
4. Set the doc's `status` to `posting`, pinning `if_version`.
5. Download the poster: Artifact tool `action: "read"`, `url` = the queue, `path` = the doc's `assetId`. It saves a local file. (In the repo checkout the same image may also exist at `crew/data/igpack/upload/<date>_<dept>-<type>.jpg`.)
6. Feed only: write `caption` to a temp file.
7. Run `autopost.js post --type <type> --image <file> [--caption-file <tmp>]`.
8. Write the result to the doc:
   - success: `status: "posted"`, `fb`, `ig`, `threads` (feed), `postedAt`; if the output has `threadsError`, store it too
   - failure: `status: "failed"`, `error` (the message only, never the token).
   - If one platform succeeded, keep its id. A retry must use `--only` for the platform that failed (`--only threads` for a missed Threads post).
9. Update `settings/meta` from `whoami`: `connected`, `pageName`, `igUsername`, `threadsUsername`, `checkedAt`.
10. Office: set your crew doc to `idle`, detail "Siap: <type> <Dept> <time> dipost". On failure use `waiting` with a short reason.

## Rules
- Post only what is in the queue, exactly as rendered. Never edit captions or images at posting time.
- Never print, log or store the token. Never ask anyone to paste it into chat. It lives only in the environment's secrets.
- Instagram allows 50 API posts per 24 hours, so 4 feed posts plus 4 stories a day is well within the limit. If a slot is more than 2 hours late, mark it `skipped` instead of posting it out of order, and tell the owner.
