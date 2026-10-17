# Bundle shell.html + local css/js + logo into one page: python3 build.py out.html [--local]
import base64, re, sys, pathlib
d = pathlib.Path(__file__).parent
out = sys.argv[1]
local = '--local' in sys.argv  # use vendored libs for offline testing
html = (d / 'shell.html').read_text()
logo = base64.b64encode((d / 'logo.png').read_bytes()).decode()
html = html.replace('src="logo.png"', f'src="data:image/png;base64,{logo}"')
css = (d / 'style.css').read_text() if (d / 'style.css').exists() else ''
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    name = m.group(1)
    if not (d / name).exists():
        return '<!-- missing ' + name + ' -->'
    return '<script>\n' + (d / name).read_text().replace('</script', '<\\/script') + '\n</script>'
html = re.sub(r'<script src="([a-z0-9]+\.js)"></script>', inline, html)
if local:
    for lib in ['html2canvas.min.js', 'jspdf.umd.min.js']:
        p = d / 'vendor' / lib
        if p.exists():
            html = re.sub(r'<script src="https://cdnjs[^"]*/' + re.escape(lib) + r'"></script>', lambda m: '<script>' + p.read_text() + '</script>', html)
pathlib.Path(out).write_text(html)
print(out, len(html))
