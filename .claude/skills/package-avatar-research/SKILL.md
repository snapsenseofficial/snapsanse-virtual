---
name: package-avatar-research
description: SnapSense department managers (Zul, Irfan, Rina, Hafiz) — research each package's target audience, customer avatar and USP on the internet with sources, and keep the USP map that every poster prints. Use for audience/avatar/USP/market research tasks.
---

# Package audience, avatar & USP research (SnapSense managers)

| Manager | Department | Packages |
|---|---|---|
| Hafiz | Sales | `wed-*`, `ad-*` (weddings + add-ons) |
| Irfan | Awareness | `au-*`, `cc-*` (car/bike, content creator) |
| Rina | Trust | `prod-*`, `ev-*` (product, event) |
| Zul | Authenticity | `konvo-*`, `pot-*`, `pre-*` (convo, portrait, pre-wedding) |

Managers delegate searching to their creator/planner and sign off the file.

## Output
`crew/data/igpack/research/avatars-<dept>.json`:
```json
{"dept":"sales","by":["…"],"packages":[{"id":"wed-ns","name":"Nikah + Sanding","price":1500,
 "audience":"…","avatar":{"label":"Aisyah, 27 (ilustrasi)","age":"25-30","location":"…","life":"…","goals":[],"pains":[],"objections":[],"triggers":[],"platforms":[],"searchPhrases":[]},
 "usp":["2-4 true differentiators"],"uspShort":"≤34 chars","hook":"≤38 chars",
 "facts":[{"claim":"…","source":"url"}],"assumptions":["…"]}],"sources":[{"title":"…","url":"…"}]}
```
Then `python3 crew/tools/igposter/build-usp.py` (writes `research/usp-map.json`), ask the copywriter to update `research/usp-en.json`, and the designer to re-render.

## Accuracy rules (strict)
- Every number or factual claim needs a source URL from your search. Unsourced → `assumptions`, never a fact.
- Persona names are fictional and marked "(ilustrasi)".
- USPs only from catalogue facts (`seed/packages.json`). No "terbaik/No. 1", no scarcity, no testimonials, no client counts.
- Prices/names must match `packages.json` exactly; validate the JSON with python3.
- Flag anything the catalogue leaves open (delivery times, permits, minimum contracts) as "sahkan dengan pemilik".
