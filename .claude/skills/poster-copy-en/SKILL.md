---
name: poster-copy-en
description: SnapSense copywriters (Aina, Izzah, Balqis, Wani) — write and fix the English text printed on IG posters/stories (content-en/<dept>.json) while captions stay Malay. Use for any poster headline, CTA, list or poll wording task.
---

# Poster copy in English (SnapSense copywriters)

Owner: Authenticity **Izzah**, Awareness **Balqis**, Trust **Wani**, Sales **Aina**. Each edits only `crew/data/igpack/content-en/<own dept>.json`.

## What to edit
Poster fields only: `feed.eyebrow, headline, sub, items[].label/value, price.note/unit, badge, cta, footnote` and `story.headline, sub, prompt, options[]`.
**Never** change `caption`, `hashtags`, `date`, `layout`, `existingPoster` (captions are Malay and posted as written). Schema and limits: `crew/data/igpack/SCHEMA.md`.

## Limits
headline ≤ 38 chars (story ≤ 32), sub ≤ 90, items ≤ 42, cta ≤ 40, footnote ≤ 80, uspShort ≤ 34, hook ≤ 38. If the render log says "shrunk to 30%" or "overflow", shorten.

## Rules
- Natural, confident English for Malaysians aged 20–40. Short. No emoji.
- Keep: Nikah, Sanding, Tunang, Konvo/Convo, Raya, Deepavali, kenduri, pelamin, songkok, tanjak, and catalogue package names exactly (`seed/packages.json`).
- DM keywords: **CAR** (cars), **WEDDING** (weddings), **MOTORCYCLE** (bikes). Other keywords stay as they are until the owner decides.
- Facts only from the catalogue: prices, hours, photo counts, delivery days, inclusions. No invented discounts, deadlines, "limited slots", testimonials, client counts or "No. 1".
- Delivery time may be claimed only where the catalogue states it (e.g. Nikah + Sanding 14 days, Konvo Mini/Graduan 5 days, Car Shoot Asas 3 days, events "selected photos in 48 hours").
- A post that will carry a bike photo must not say "car" (the engine rewrites car→bike; re-read the result).
- Dates as "17 Oct · Sat".

## Check before handing over
`python3 -c "import json;json.load(open('crew/data/igpack/content-en/<dept>.json'))"`, same 27 dates as `content/<dept>.json`, every `RM` price unchanged, then ask your designer to render.
