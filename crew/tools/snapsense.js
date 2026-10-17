#!/usr/bin/env node
'use strict';
// The crew's toolbox. Agents call it from their workspace, e.g.
//   node ../../tools/snapsense.js tiktok snapshot
// Read commands talk to TikTok / Google. Anything that would change an
// account is only *proposed* and waits for approval in the office.
const fs = require('fs');
const path = require('path');
const { P, readJSON, writeJSON, loadConfig } = require('../lib/config');
const google = require('../lib/google');
const tiktok = require('../lib/tiktok');
const approvals = require('../lib/approvals');
const bookings = require('../lib/bookings');

const [, , area, cmd, ...rest] = process.argv;
const flags = {};
const words = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) { const k = rest[i].slice(2); flags[k] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true; }
  else words.push(rest[i]);
}
const out = (x) => process.stdout.write(JSON.stringify(x, null, 2) + '\n');
const today = () => new Date().toISOString().slice(0, 10);
const by = () => flags.by || path.basename(process.cwd());

const HELP = `SnapSense crew tools
  status                                  which accounts are connected
  tiktok snapshot                         profile + last 20 videos + engagement summary (saved daily)
  tiktok history                          trend of saved snapshots
  calendar list [--days 7]                upcoming events
  calendar free --from ISO --to ISO       busy blocks in a window
  bookings new [--peek]                   bookings not seen before (marks them seen unless --peek)
  bookings all                            every booking row
  drive search [words] [--folder ID]      find files
  propose event  --title T --start ISO --end ISO [--description D] [--location L]
  propose upload --file ../../output/... --name NAME [--folder ID]
  propose reply  --to CUSTOMER --text MESSAGE
  propose note   --title T --text TEXT
All propose commands wait for the owner's approval in the office.`;

async function main() {
  const cfg = loadConfig();
  switch (`${area || ''} ${cmd || ''}`.trim()) {
    case 'status':
      return out({ tiktok: tiktok.connected(), google: google.connected(), bookingsSheet: !!cfg.google.bookingsSheetId, reportsFolder: cfg.google.driveReportsFolderId || null, timezone: cfg.timezone });

    case 'tiktok snapshot': {
      const [user, vids] = await Promise.all([tiktok.profile(), tiktok.videos(Number(flags.max) || 20)]);
      const summary = tiktok.summarize(user, vids);
      const dir = path.join(P.data, 'tiktok');
      const prevFile = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith(today())).sort().pop() : null;
      const prev = prevFile ? readJSON(path.join(dir, prevFile), null) : null;
      writeJSON(path.join(dir, `${today()}.json`), { date: today(), displayName: user.display_name, ...summary });
      const change = prev ? {
        since: prev.date, followers: summary.followers - prev.followers, totalLikes: summary.totalLikes - prev.totalLikes,
        avgViews: summary.avgViews - prev.avgViews, avgEngagementRate: +(summary.avgEngagementRate - prev.avgEngagementRate).toFixed(2),
      } : null;
      return out({ displayName: user.display_name, ...summary, change });
    }
    case 'tiktok history': {
      const dir = path.join(P.data, 'tiktok');
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
      return out(files.map((f) => { const s = readJSON(path.join(dir, f), {}); return { date: s.date, followers: s.followers, totalLikes: s.totalLikes, avgViews: s.avgViews, avgEngagementRate: s.avgEngagementRate }; }));
    }

    case 'calendar list': return out(await google.listEvents(Number(flags.days) || 7));
    case 'calendar free':
      if (!flags.from || !flags.to) throw new Error('--from and --to (ISO date-times) are required');
      return out({ busy: await google.freeBusy(flags.from, flags.to) });

    case 'bookings new':
    case 'bookings all': {
      if (!cfg.google.bookingsSheetId) throw new Error('Set google.bookingsSheetId in crew/config.json');
      const rows = await google.sheetRows(cfg.google.bookingsSheetId, cfg.google.bookingsRange || 'A:Z');
      if (cmd === 'all') return out(rows);
      const fresh = bookings.diff(rows, bookings.loadSeen());
      if (!flags.peek) bookings.markSeen(fresh);
      return out({ newBookings: fresh, total: rows.length });
    }

    case 'drive search': return out(await google.driveSearch(words.join(' '), flags.folder));

    case 'propose event':
      if (!flags.title || !flags.start || !flags.end) throw new Error('--title, --start and --end are required');
      return out(approvals.propose({ kind: 'calendar-event', by: by(), title: `Calendar: ${flags.title}`,
        details: `${flags.start} → ${flags.end}${flags.location ? ` @ ${flags.location}` : ''}\n${flags.description || ''}`.trim(),
        payload: { title: flags.title, start: flags.start, end: flags.end, description: flags.description || '', location: flags.location || '' } }));
    case 'propose upload': {
      const file = path.resolve(String(flags.file || ''));
      if (!file.startsWith(P.output + path.sep) || !fs.existsSync(file)) throw new Error(`--file must be an existing file inside ${P.output}`);
      return out(approvals.propose({ kind: 'drive-upload', by: by(), title: `Drive: upload "${flags.name || path.basename(file)}"`,
        details: fs.readFileSync(file, 'utf8').slice(0, 600),
        payload: { file, name: flags.name || path.basename(file), folder: flags.folder || cfg.google.driveReportsFolderId || null } }));
    }
    case 'propose reply':
      if (!flags.to || !flags.text) throw new Error('--to and --text are required');
      return out(approvals.propose({ kind: 'reply', by: by(), title: `Reply to ${flags.to}`, details: flags.text, payload: { to: flags.to, text: flags.text } }));
    case 'propose note':
      if (!flags.title) throw new Error('--title is required');
      return out(approvals.propose({ kind: 'note', by: by(), title: flags.title, details: flags.text || '' }));

    default:
      process.stdout.write(HELP + '\n');
      if (area && area !== 'help') process.exitCode = 1;
  }
}

main().catch((e) => { process.stderr.write(`error: ${e.message}\n`); process.exit(1); });
