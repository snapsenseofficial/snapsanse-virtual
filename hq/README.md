# SnapSense HQ

Company dashboard for SnapSense, built by the virtual-office crew. It has these sections:

| Tab | Built by | What it does |
|---|---|---|
| Utama | Irfan | Today's tasks, content this week, quote pipeline, Google Calendar, team |
| To-Do | Haziq | Tasks with list and board views, filters, assignees |
| Content Plan | Sofea | Monthly campaign, weekly storyline, calendar and board of posts |
| Copywriting | Farid | Monthly copy written by Aina, with copy buttons and approval status |
| Sebut Harga | Hafiz | Quotation builder from the price list, A4 preview, PDF download, WhatsApp message |
| Tetapan | Farid | Company details and the catalogue price list |

The styling is Mira's (`style.css`). `core.js` holds the shared helpers and the data store. Read `CONTRACT.md` before adding a module.

It runs as a claude.ai artifact with the `db`, `downloads` and `mcp` (Google Calendar `list_events`) capabilities. Outside Claude it falls back to a preview store in the browser's localStorage.

```
python3 build.py out.html            # one self-contained page (libraries from cdnjs)
python3 build.py out.html --local    # uses vendor/ copies of html2canvas and jsPDF for offline tests
node shot.js out.html shot.png todo 1280 light seed.json
```
