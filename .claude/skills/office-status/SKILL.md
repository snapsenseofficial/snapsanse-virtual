---
name: office-status
description: Every SnapSense crew member — show what you are doing in the live virtual office (crew status + activity log) so the owner sees the team working. Use at the start, at milestones (at least every 30 minutes) and at the end of any crew task.
---

# Office status (all crew)

Live office: https://claude.ai/artifact/LZMZiGWM3pVdcCy1ud1h9h. Database collection `crew`, one document per crew member (doc id = mascot id below).

| Dept | Manager | Creator | Designer | Editor | Copywriter | Planner |
|---|---|---|---|---|---|---|
| Authenticity | black (Zul) | orange (Amir) | hana (Hana) | syafiq (Syafiq) | izzah (Izzah) | adam (Adam) |
| Awareness | yellow (Irfan) | purple (Sofea) | red (Mira) | blu (Danial) | balqis (Balqis) | lili (Lili) |
| Trust | rina (Rina) | iman (Iman) | cyan (Farid) | faiz (Faiz) | wani (Wani) | khairul (Khairul) |
| Sales | navy (Hafiz) | ariff (Ariff) | qistina (Qistina) | hakim (Hakim) | white (Aina) | green (Haziq) |
| Head office | PA: lilac (Nadia) | | | | | |

## How
Use the `ArtifactData` tool. Read the doc first and pin `if_version`. Use `batch` when you update several crew members.
```json
{"status":"running","detail":"Hana: render semula poster Authenticity","updatedAt":"<now ISO UTC>","startedAt":"<task start>"}
```
- Working statuses (animated at the desk): `typing`, `reading`, `running`, `browsing`, `thinking`, `planning`, `delegating`.
- `waiting` means blocked on the owner.
- `idle` means done. Put "Siap: …" in `detail` and set `lastSummary`.
- A working status older than **40 minutes** shows as "Rehat". Refresh `updatedAt` at least every 30 minutes while the task runs.
- `detail` is short Malay, starting with the person's name.
- Never write customer data into the office.
