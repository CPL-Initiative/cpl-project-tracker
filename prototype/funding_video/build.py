#!/usr/bin/env python3
"""Build the CPL Funding in Motion video page.

  python3 prototype/funding_video/build.py           -> funding_in_motion.html (the shareable page)
  python3 prototype/funding_video/build.py --render  -> also render.html, the 1920x1080 frame page render.sh drives
"""
import base64, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
LOGO = HERE.parent.parent / 'sierra' / 'cpl-initiative-logo-navy.png'
src = (HERE / 'funding_in_motion.src.html').read_text(encoding='utf8')
page = src.replace('__LOGO__', 'data:image/png;base64,' + base64.b64encode(LOGO.read_bytes()).decode())
(HERE / 'funding_in_motion.html').write_text(page, encoding='utf8')
if '--render' in sys.argv:
    F = '.fonts/'
    faces = [('Playfair Display', 'normal', 700, 'playfair-display', 'latin-700-normal'),
             ('Playfair Display', 'normal', 900, 'playfair-display', 'latin-900-normal'),
             ('Playfair Display', 'italic', 700, 'playfair-display', 'latin-700-italic'),
             ('Source Sans 3', 'normal', 400, 'source-sans-3', 'latin-400-normal'),
             ('Source Sans 3', 'normal', 600, 'source-sans-3', 'latin-600-normal'),
             ('Source Sans 3', 'normal', 700, 'source-sans-3', 'latin-700-normal')]
    css = ''.join("@font-face{font-family:'%s';font-style:%s;font-weight:%d;src:url(%s%s/files/%s-%s.woff2)}" % (f, s, w, F, pkg, pkg, file) for f, s, w, pkg, file in faces)
    css += ('body{background:#FBFAF6}.wrap{max-width:none;padding:0}header,.controls,.scenes,.wrap>p,.bigplay{display:none!important}'
            '.stage{margin:0;border:0;border-radius:0;box-shadow:none;width:1920px}')
    (HERE / 'render.html').write_text(page.replace('</style>', '</style><style>' + css + '</style>', 1), encoding='utf8')
print('built')
