# Subject cut-out for "type behind subject" posters.
# usage: cutenv/bin/python tools/cut.py photo.jpg [...]  -> writes photo.cut.png (RGBA, same size) next to each photo
import sys, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
import os
M = os.environ.get('CUT_MODEL') or os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'models', 'isnet-general-use.onnx')
sess = ort.InferenceSession(M, providers=['CPUExecutionProvider'])
name = sess.get_inputs()[0].name
for p in sys.argv[1:]:
    im = Image.open(p).convert('RGB')
    x = np.asarray(im.resize((1024, 1024), Image.BICUBIC)).astype(np.float32) / 255.0
    x = (x - 0.5) / 1.0
    x = x.transpose(2, 0, 1)[None]
    y = sess.run(None, {name: x})[0][0, 0]
    y = (y - y.min()) / (y.max() - y.min() + 1e-8)
    m = Image.fromarray((y * 255).astype(np.uint8)).resize(im.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    out = im.copy(); out.putalpha(m)
    out.save(p.rsplit('.', 1)[0] + '.cut.png')
    print(p, 'coverage %.0f%%' % (100 * (np.asarray(m) > 128).mean()))
