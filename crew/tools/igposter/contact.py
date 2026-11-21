#!/usr/bin/env python3
"""Weekly contact sheets for the SnapSense IG pack.

python3 engine/contact.py [OUT_DIR]   (default: igpack/out)
Writes OUT_DIR/contact-week<N>.jpg (one row per day: feed+story for each dept in posting order)
and OUT_DIR/grid-preview.jpg (the IG profile grid, newest post top-left, 3 columns).
"""
import datetime as dt
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'out'))
DEPTS = ['authenticity', 'awareness', 'trust', 'sales']
DEPT_COL = {'authenticity': (52, 64, 42), 'awareness': (240, 138, 44), 'trust': (62, 142, 247), 'sales': (122, 30, 48)}
TW = 200
FH, SH = round(1350 * TW / 1080), round(1920 * TW / 1080)
BG = (234, 229, 219)


def font(sz, bold=False):
    p = '/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if bold else '')
    return ImageFont.truetype(p, sz) if os.path.exists(p) else ImageFont.load_default()


def thumb(path, h):
    if not os.path.exists(path):
        im = Image.new('RGB', (TW, h), (200, 196, 188))
        ImageDraw.Draw(im).text((12, h // 2 - 8), 'missing', fill=(90, 90, 90), font=font(14))
        return im
    return Image.open(path).convert('RGB').resize((TW, h), Image.LANCZOS)


dates = sorted(d for d in os.listdir(OUT) if os.path.isdir(os.path.join(OUT, d)) and len(d) == 10 and d[4] == '-')
if not dates:
    sys.exit('no dated folders in ' + OUT)
first = dt.date.fromisoformat(dates[0])
week0 = first - dt.timedelta(days=first.weekday())  # Monday of the first week
weeks = {}
for d in dates:
    wk = (dt.date.fromisoformat(d) - week0).days // 7 + 1
    weeks.setdefault(wk, []).append(d)

G, DG, PAD, HEAD, LBL, RG = 10, 34, 50, 120, 30, 26
DAYW = 130
COLW = 2 * TW + G
W = PAD * 2 + DAYW + 4 * COLW + 3 * DG
MS = 'Isn Sel Rab Kha Jum Sab Ahd'.split()
written = []
for wk, ds in sorted(weeks.items()):
    H = HEAD + len(ds) * (SH + LBL + RG) + PAD
    sheet = Image.new('RGB', (W, H), BG)
    dr = ImageDraw.Draw(sheet)
    dr.text((PAD, 34), f'SNAPSENSE  IG daily pack  -  minggu {wk}  ({ds[0]} to {ds[-1]})', fill=(24, 24, 20), font=font(30, True))
    for i, dept in enumerate(DEPTS):
        x = PAD + DAYW + i * (COLW + DG)
        dr.rectangle([x, 88, x + COLW, 94], fill=DEPT_COL[dept])
        dr.text((x, 98), f'{i + 1}  {dept.upper()}   feed | story', fill=(60, 60, 56), font=font(14, True))
    for r, d in enumerate(ds):
        y = HEAD + r * (SH + LBL + RG)
        day = dt.date.fromisoformat(d)
        dr.text((PAD, y + 10), MS[day.weekday()], fill=(24, 24, 20), font=font(26, True))
        dr.text((PAD, y + 44), day.strftime('%d.%m'), fill=(90, 90, 84), font=font(20))
        for i, dept in enumerate(DEPTS):
            x = PAD + DAYW + i * (COLW + DG)
            base = os.path.join(OUT, d, f'{i + 1}-{dept}')
            if not (os.path.exists(base + '-feed.jpg') or os.path.exists(base + '-story.jpg')):
                continue
            sheet.paste(thumb(base + '-feed.jpg', FH), (x, y))
            sheet.paste(thumb(base + '-story.jpg', SH), (x + TW + G, y))
    name = os.path.join(OUT, f'contact-week{wk}.jpg')
    sheet.save(name, quality=88)
    written.append(os.path.basename(name))

# IG grid preview: posts in publishing order (dates x dept order), newest first, 3 columns.
feeds = []
for d in dates:
    for i, dept in enumerate(DEPTS):
        p = os.path.join(OUT, d, f'{i + 1}-{dept}-feed.jpg')
        if os.path.exists(p):
            feeds.append(p)
feeds.reverse()
GT, GG = 180, 4
gh = round(GT * 1350 / 1080)
cols = 3
rows = (len(feeds) + cols - 1) // cols
grid = Image.new('RGB', (cols * GT + (cols - 1) * GG, rows * gh + (rows - 1) * GG), (255, 255, 255))
for k, p in enumerate(feeds):
    grid.paste(Image.open(p).convert('RGB').resize((GT, gh), Image.LANCZOS), ((k % cols) * (GT + GG), (k // cols) * (gh + GG)))
grid.save(os.path.join(OUT, 'grid-preview.jpg'), quality=85)
written.append('grid-preview.jpg')
print('contact sheets:', ', '.join(written), 'in', OUT)
