# igposter — SnapSense IG poster engine

Renders the daily Instagram pack (4 feed posters + 4 stories a day, one per department) from JSON content,
with editorial typography and the owner's photos (big word behind the subject via cut-outs).

- Skills that use it: `.claude/skills/ig-poster-design`, `photo-prep`, `poster-copy-en`, `package-avatar-research`, `ig-content-plan`, `office-status`.
- Data lives outside git in `crew/data/igpack/` (or `IGPACK_DATA`):
  `content/` (Malay master plan), `content-en/` (English poster text), `photos/<category>/`, `research/`, `seed/packages.json`, `seed/wedding-dates.json`, `assets/logo.png`.
- `node render.js [--only dates] [--dept id] [--style name] [--html]` → `<data>/out2/`
- `python3 contact.py <data>/out2` contact sheets · `python3 sheet.py out.jpg a.jpg b.jpg …` review strip
- `cut.py` / `meta.py` subject cut-outs (ISNet ONNX model in `crew/data/models/`) · `build-usp.py` USP map from research
- Needs Playwright Chromium (`/opt/node-tools/node_modules/playwright` in the cloud container) and Python Pillow.
- Fonts: Anton, Archivo Black, Bodoni Moda, Instrument Serif, Inter Tight, Space Mono — SIL Open Font License (see `fonts/LICENSE-*.txt`).
