---
name: photo-prep
description: SnapSense editors (Syafiq, Danial, Faiz, Hakim) — bring the owner's photos into the poster library: resize, sort by category, cut out the subject for type-behind-subject posters, and keep the library clean and permitted. Use whenever new photos arrive or a poster uses the wrong photo.
---

# Photo prep (SnapSense editors)

Owner: the editor of each department — Authenticity **Syafiq**, Awareness **Danial**, Trust **Faiz**, Sales **Hakim**.

## Library
`crew/data/igpack/photos/<category>/` (git-ignored — client photos never go into git).
Categories: `wedding`, `auto`, `convo`, `product`, `event`, `profile`, `maternity`, `raya`, `studio`.
A post's category comes from its package (`wed-*` → wedding, `au-*` → auto, `konvo-*` → convo, `prod-*` → product, `ev-*` → event, `pot-*` → profile), else from keywords.

## Steps for new photos
1. Only photos the owner sent in chat (saved under the session's images folder) or uploaded to Drive. Note the client/brand for each.
2. Resize and save as JPEG q88, longest side 1700–1800 px, EXIF-rotated (Pillow `ImageOps.exif_transpose`).
3. Name files by kind: auto → `c<nn>.jpg` for **cars**, `m<nn>.jpg` for **motorcycles** (the engine relies on this prefix). Others: `w` wedding, `p` portrait, `r` product, any number.
4. Cut-outs: `python crew/tools/igposter/cut.py photos/<cat>/*.jpg` (ISNet model at `crew/data/models/isnet-general-use.onnx`, or `CUT_MODEL=`; needs `onnxruntime`, `numpy`, `pillow` — use a venv). Then `python crew/tools/igposter/meta.py` to refresh `photos/meta.json`.
5. Check each cut-out visually. If it picked the wrong subject (e.g. a hose reel instead of the shirt) **delete that `.cut.png`** — the poster then puts the word in front of the photo instead.
6. Ask the designer to re-render the affected department and check it.

## Rules
- **Never remove, blur or crop out another studio's watermark** (e.g. "GFI Wedding Services"). Move such photos out of `photos/` and tell the owner; ask for the original unwatermarked file if SnapSense owns it.
- People in photos: owner confirmed models are fine. For client brands/cars (SOKU Racing, Haos, Masdora…) ask the owner if unsure.
- No AI-generated or stock people as portfolio.
