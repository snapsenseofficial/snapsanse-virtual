"""Patch the portfolio site's index.html for use at <catalogue>/portfolio/.
Adds a Harga/Catalogue link to its menu, drops the Netlify HUD script, retitles the page, and fixes
the YouTube thumbnail fallbacks (their inline onload/onerror handlers had \\' escapes, a JS syntax error)."""
import re, sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
s = re.sub(r'<script[^>]*src="/\.netlify/scripts/hud[^"]*"[^>]*></script>', '', s)
link = '<li><a href="../#harga" data-en="Prices &amp; booking">Harga &amp; tempah</a></li>\n      <li><a href="#hubungi"'
if 'href="../#harga"' not in s:
    assert '<li><a href="#hubungi"' in s
    s = s.replace('<li><a href="#hubungi"', link, 1)
s = re.sub(r'(on(?:load|error)="[^"]*")', lambda m: m.group(1).replace("\\'", "'"), s)
s = re.sub(r'<title>[^<]*</title>', '<title>Portfolio · SnapSense Johor</title>', s, count=1)
open(p, "w", encoding="utf-8").write(s)
