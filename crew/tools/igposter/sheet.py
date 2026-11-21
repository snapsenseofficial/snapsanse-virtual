import sys, glob, os
from PIL import Image
# usage: sheet.py out.jpg img1 img2 ...  (feeds and stories mixed; scaled to same height)
out, files = sys.argv[1], sys.argv[2:]
H = 640
ims = [Image.open(f).convert('RGB') for f in files]
ims = [im.resize((round(im.width * H / im.height), H)) for im in ims]
cols = int(os.environ.get('COLS', '4'))
rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
W = max(sum(i.width for i in r) + 16 * (len(r) + 1) for r in rows)
sheet = Image.new('RGB', (W, len(rows) * (H + 16) + 16), (60, 60, 60))
y = 16
for r in rows:
    x = 16
    for im in r: sheet.paste(im, (x, y)); x += im.width + 16
    y += H + 16
sheet.save(out, quality=85)
