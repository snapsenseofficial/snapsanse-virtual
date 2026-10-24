---
name: ig-poster-design
description: SnapSense designers (Mira, Hana, Farid, Qistina) — render, review and fix the daily Instagram feed posters and stories with the igposter engine. Use for any request to make, redo, restyle or QA SnapSense IG posters/stories.
---

# IG poster design (SnapSense designers)

Owner: the designer of each department — Authenticity **Hana**, Awareness **Mira**, Trust **Farid**, Sales **Qistina**.
Each designer renders and checks **only their own department** (`--dept <id>`), unless the manager asks otherwise.

## Engine
- Code: `crew/tools/igposter/` (in git). Data: `crew/data/igpack/` (git-ignored: content, photos, research, output).
  Override the data folder with `IGPACK_DATA=/path`.
- Render: `node crew/tools/igposter/render.js [--only 2026-10-13,2026-10-14] [--dept sales] [--style noir] [--html]`
  → `<data>/out2/<date>/<n>-<dept>-feed.jpg` (1080×1350) and `-story.jpg` (1080×1920) + `caption.txt`.
- Contact sheets: `python3 crew/tools/igposter/contact.py <data>/out2` (weekly sheets + `grid-preview.jpg`).
- Quick review strip: `COLS=6 python3 crew/tools/igposter/sheet.py /tmp/x.jpg <jpg> <jpg> …` then look at the image.
- Poster text comes from `content-en/<dept>.json` (English). Captions inside stay Malay.

## Styles (chosen automatically by `styleFor` — department + layout + package + photo)
| style | look | used for |
|---|---|---|
| paper | warm paper, giant Inter Tight, hairlines, mono metadata | minimalist tips/steps/FAQ |
| noir | black, Anton caps, outline word behind | Awareness hooks |
| film | 35mm strip, sprocket holes, edge marks | Authenticity BTS |
| block | full department colour, giant cropped numerals | prices, dates, hooks |
| editorial | Bodoni masthead "SNAPSENSE", magazine cover | Trust/Sales lists |
| impact | black + lime, arcs | content-creator packages (`cc-*`) |
| street | car/bike photo, CAR SHOOT / MOTORCYCLE SHOOT word behind the vehicle; price posters use a photo band on top | `au-*` |
| ivory | wedding photo, NIKAH/SANDING/TUNANG/WEDDING word behind the couple, glass price cards | `wed-*`, `konvo-*`, `pre-*` |
| portrait | portrait/product photo, PORTRAIT/FAMILY/PRODUCT/BRAND word behind the subject | `pot-*`, `prod-*` |

Typography technique: the giant word sits **between the photo and its cut-out** (`photos/<cat>/<name>.cut.png`), so the subject stands in front of the type. The word colour follows the photo's sky brightness (`photos/meta.json`).

## Rules (owner's decisions — do not break)
1. **All poster text in English.** Titles must be upright and easy to read: Anton, Inter Tight, Bodoni Moda (roman). **No script/handwriting fonts, no italic titles.**
2. **Every design carries the USP strip** ("Why SnapSense …"), from `research/usp-en.json` / the package's catalogue facts.
3. Photos must be SnapSense's own work. **Never remove or crop out another studio's watermark** — exclude such photos instead (move them to a folder outside `photos/`).
4. Car packages say "1 car": price/package posters use **car photos only** (files starting `c`). Bike photos (files starting `m`) go on general posts, which then say **MOTORCYCLE SHOOT / bike** and never "car" (`prepare()` does this; check it).
5. No AI-generated people presented as portfolio. Prices only from the catalogue (`seed/packages.json`). No invented discounts, scarcity or testimonials.
6. Story text stays inside y 250–1670 (IG UI covers the rest).

## QA checklist (do this on every render)
- Render log: `WARN … overflow` or `headline shrunk to 30%` means the layout does not fit → shorten copy (ask the copywriter) or pick another style with `FEED_PLAN` in `templates.js`.
- Look at the contact sheet: no text over faces/vehicles, nothing clipped, no repeated photo on neighbouring days, USP matches the price shown, DM keyword is `CAR`, `WEDDING` or `MOTORCYCLE` (not Malay).
- Spot-check 3 posters at full size.
- Report to your manager: what changed, file list, warnings left.
