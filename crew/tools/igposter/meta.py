# photos/meta.json: per photo, how much of the frame the cut-out covers and how bright the top band is
import json, glob, os, numpy as np
from PIL import Image
root = os.path.join(os.environ.get('IGPACK_DATA') or os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'igpack'), 'photos')
meta = {}
for p in sorted(glob.glob(os.path.join(root, '*', '*.jpg'))):
    im = np.asarray(Image.open(p).convert('L').resize((200, 250)), dtype=np.float32) / 255
    c = p[:-4] + '.cut.png'
    cov = float((np.asarray(Image.open(c).split()[-1].resize((200, 250))) > 128).mean()) if os.path.exists(c) else None
    meta[os.path.basename(p)] = {'coverage': round(cov, 3) if cov is not None else None, 'topLum': round(float(im[:90].mean()), 3)}
json.dump(meta, open(os.path.join(root, 'meta.json'), 'w'), indent=1)
print(json.dumps(meta))
