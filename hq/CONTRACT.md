# SnapSense HQ — shared build contract

SnapSense is a Malaysian photography / videography / content studio (owner: a marketing manager,
photographer & videographer; non-technical; WhatsApp 016-803 1153; IG @snapsenseofficial).
We are building **SnapSense HQ**, a single-page company dashboard that runs as a claude.ai Artifact.
ALL UI TEXT IS IN BAHASA MELAYU (casual-professional Malaysian, e.g. "Tambah tugasan", "Simpan", "Padam").

Folder: this directory. Files:
- `core.js` — DONE, read it fully first. Global `HQ` namespace (data store, tabs, modal, toast, dates, money).
- `shell.html` — DONE. Page skeleton (header, `#nav`, `#main`). Loads scripts in this order:
  core.js, overview.js, todo.js, content.js, quote.js, settings.js, then calls `HQ.start()`.
- `style.css` — Mira (graphic designer) writes it: tokens + shared component classes below.
- Also `copy.js` (tab id `copy`, label "Copywriting") — Farid.
- Also `insight.js` (tab id `insight`, label "Insight & Plan") — Farid.
- Each module = one plain-JS IIFE file that calls `HQ.tab(id, { label, icon, mount(root), onShow?(root) })`.
  Tab ids: `utama` (overview.js), `todo` (todo.js), `content` (content.js), `quote` (quote.js), `settings` (settings.js).
  `icon` = one short inline SVG string (20x20, stroke="currentColor", fill="none", stroke-width 1.8) — no emoji.
- Build: `python3 build.py out.html --local` bundles everything into one HTML file (vendored libs for offline test).

## Hard rules (artifact sandbox)
- No `alert/confirm/prompt` (use `HQ.modal`, `HQ.confirm`), no `window.print()`, no `<a download>`, no iframes,
  no fetch to other hosts. `mailto:`/`tel:` unreliable — show the number as text + a copy button.
- External scripts already loaded by shell: `html2canvas` 1.4.1 (global `html2canvas`), `jspdf` 2.5.1 (global `window.jspdf.jsPDF`).
  Do not add others.
- Files are saved for the viewer with `const dl = await HQ.capability('downloads')` → `await dl.save({ filename, data: Blob })`
  (rejects with `{code}`; `declined` = user said no; if `dl` is null, hide the button / show a toast).
- Must work at 400px wide (no horizontal page scroll; tables inside `overflow-x:auto`), light AND dark theme
  (colours only via the CSS tokens below — never literal colours in module CSS, except crew colours from `HQ.CREW` and
  semantic tones via tokens).
- Module-specific CSS: `HQ.css('<module>', \`...\`)` with class names prefixed by the module (`ov-`, `td-`, `cp-`, `qt-`, `st-`).
- Escape every user string with `HQ.esc()` before putting it in innerHTML.
- Re-render from data on every `HQ.watch` callback; keep UI state (filters, open forms) in module variables so a
  re-render does not lose it. Do not re-render while the user is typing in a form inside the list — forms live in modals.
- Each module must render a designed EMPTY STATE (what goes here + a button to add the first item) before data arrives
  or when the collection is empty. Never hard-code sample records in the page.
- Every form control gets a stable `id`.

## Data (HQ.list/HQ.get/HQ.watch read; HQ.add/HQ.set/HQ.update/HQ.remove write)
Dates are `'YYYY-MM-DD'` strings (Malaysia time, use `HQ.today()`), timestamps ISO strings.

`todos/<id>`: { title, notes, due:'YYYY-MM-DD'|'' , time:'HH:MM'|'', priority:'tinggi'|'sederhana'|'rendah',
  status:'todo'|'doing'|'done', assignee: crew id ('me' = owner), category:'Klien'|'Content'|'Shooting'|'Editing'|'Admin'|'Kewangan'|'Lain-lain',
  link?:string, createdAt, doneAt? }

`campaigns/<id>`: { name, month:'YYYY-MM', goal, audience, bigIdea, offer, kpis:[string], pillars:[{name, share:number(%), desc}],
  storyline:[{week:number, title, dates:'10–16 Okt', theme, story, cta}], hashtags:[string], notes, createdAt }

`content/<id>`: { title, date:'YYYY-MM-DD', time:'HH:MM', platforms:['tiktok'|'instagram'|'facebook'|'youtube'|'threads'],
  format:'Reel'|'TikTok'|'Carousel'|'Poster'|'Story'|'Live'|'Video panjang', pillar, campaignId?, week?:number,
  status:'idea'|'skrip'|'shoot'|'edit'|'siap'|'posted', owner: crew id, hook, storyline (scene-by-scene, newline separated),
  caption, hashtags, cta, shotList?, notes?, link?, createdAt }

`copies/<id>`: { no:number (1..30), title, type:'Caption TikTok'|'Caption IG'|'Iklan Meta'|'Iklan TikTok'|'WhatsApp broadcast'|'Story'|'Carousel'|'Bio'|'DM / balas komen'|'Google Business'|'Facebook post',
  service: package id or 'umum', pillar?, month:'YYYY-MM', date?:'YYYY-MM-DD', headline, body (multi-line text), cta, hashtags, notes?, status:'draf'|'diluluskan'|'digunakan', by:'white' (Aina), createdAt }

`insights/<id>`: { title, platform:'tiktok'|'instagram'|'facebook'|'youtube'|'threads'|'umum', category:'Trend'|'Pesaing'|'Hashtag'|'Masa posting'|'Algoritma'|'Musim & tarikh'|'Audiens'|'Format',
  finding (2–4 sentences), action (what SnapSense should do), impact:'tinggi'|'sederhana'|'rendah', sources:[{title, url}], by: crew id, createdAt }

`weddingDates/<id>`: { date:'YYYY-MM-DD', day:'Sab', label:'12.12.26', tags:['Tarikh cantik'|'Cuti sekolah'|'Hujung minggu'|'Hujung minggu panjang'|'Cuti umum'|'Malam Jumaat'], demand:'sangat tinggi'|'tinggi'|'sederhana',
  why, tip (which package to promote / booking advice), sources:[{title,url}], by, createdAt }

`competitors/<id>`: { name, type:'photographer'|'videographer'|'agency'|'creator', handles:{instagram,tiktok,facebook,youtube,website}, location, niche:[..],
  followers:{instagram,tiktok,facebook} (number|null — only when a public source shows it), followersAsOf, followersSource, contentPillars:[..], formats:[..],
  postingFreq, priceInfo, strengths, lessons, sources:[{title,url}], by, createdAt }

`plans/<id>`: { name, start:'YYYY-MM-DD', end:'YYYY-MM-DD', goal, summary, kpis:[string],
  weeks:[{ week:number, dates:'10–16 Okt', focus, platformMix (e.g. 'TikTok 7 · IG feed 3 · IG story 7 · FB 3'), crewTasks:[{ who: crew id, task }] }],
  days:[{ date:'YYYY-MM-DD', theme, tiktok, igFeed, igStory, facebook, task (offline/production task), who: crew id }],
  createdAt }

`packages/<id>`: { cat:'wedding'|'konvo'|'potret'|'produk'|'auto'|'content'|'event'|'addon', name, price:number, unit?:'jam'|'bulan'|'seorang'|'reel',
  min?:number, cover, inc:[string], popular?:bool }   (seeded from the SnapSense catalogue — see seed/packages.json)

`quotes/<id>`: { no:'SS-Q-2610-001', date:'YYYY-MM-DD', validUntil:'YYYY-MM-DD', status:'draf'|'dihantar'|'diterima'|'ditolak'|'dibayar',
  client:{ name, company, phone, email, address }, event:{ title, date, location },
  items:[{ desc, detail, qty:number, unit, price:number }], discount:number (RM), discountPct?:number,
  depositPct:number, notes, terms, subtotal, total, deposit, createdAt, updatedAt }

`settings/company`: { name:'SnapSense', legalName, regNo, tagline:'TRIGGER YOUR SENSE', phone:'016-803 1153', email, address, website,
  instagram, bankName, bankAccount, bankHolder, quotePrefix:'SS-Q', depositPct:30, validDays:14, terms:string (one per line) }

## Shared CSS contract (Mira implements in style.css; modules only use these + their own prefixed classes)
Tokens on `:root` (light) + dark redefinitions (both `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`
and `:root[data-theme="dark"]`):
`--bg --surface --surface-2 --ink --muted --line --accent --accent-ink --info --good --warn --bad --good-bg --warn-bg --bad-bg --info-bg
 --radius --radius-sm --shadow --font-display --font-body --font-mono`
Components:
`.page-head` (h1 + `.sub` + `.actions` row), `.card` (+ `.card-head` with h2/h3 and right-side actions, `.card-body`),
`.grid` (+ `.cols-2`, `.cols-3`, `.cols-4` responsive → 1 col on phone), `.row` (flex wrap gap), `.stack` (column gap),
`.btn` (+ `.primary`, `.ghost`, `.danger`, `.sm`), `.icon-btn`, `.input` (inputs/select/textarea), `.field` (label + control, `.hint`),
`.form-grid` (2-col form → 1 col on phone), `.chip` (+ `.on` selected; used as filter toggles),
`.pill` with `data-tone="good|warn|bad|info|muted|accent"`, `.avatar` (round initial badge, set `style="--c:<crew colour>"`),
`.kpi` (`.kpi-label`, `.kpi-value`, `.kpi-foot`), `.table-wrap` + `table.table`, `.empty` (icon, title, text, button),
`.tabs-inline` (segmented control of `.chip`s), `.muted`, `.mono`, `.num` (tabular numbers),
modal: `.modal-backdrop .modal(.wide) .modal-head .modal-body .modal-foot`, `.icon-btn`, toasts: `.toasts .toast(.tone-good|.tone-bad|.out)`,
header: `.topbar .brand .brand-logo(white PNG wordmark — invert in light theme) .brand-sub .nav a[aria-current=page] .nav-ico .topbar-end .store-badge[data-live]`,
`.main` (max-width ~1200px, centered, side gutter ≥16px), `.view`.

## Crew
`HQ.CREW` = [{id,name,role,color}], `HQ.crew(id)`. 'me' = Saya (owner). Show assignees as `.avatar` with the initial.
Virtual office link: `HQ.OFFICE_URL`.
