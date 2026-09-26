#!/usr/bin/env python3
"""Build the CPL Funding in Motion video pages.

  python3 prototype/funding_video/build.py               -> funding_in_motion.html (Scenario 1, the shareable page)
  python3 prototype/funding_video/build.py s2            -> funding_in_motion_s2.html (Scenario 2)
  python3 prototype/funding_video/build.py [s2] --render -> also render[_s2].html, the 1920x1080 frame page render.sh drives

Each variant is a source page with image placeholders: __LOGO__ (the CPL
Initiative logo), and for Scenario 2 __MAP__ (the MAP wordmark with its arrow
cut out) and __ARROW__ (the arrow, which flies). Every image is inlined so the
built page is one file.
"""
import base64, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE / 'assets'
LOGO = HERE.parent.parent / 'sierra' / 'cpl-initiative-logo-navy.png'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else 's1'
suffix = '' if variant == 's1' else '_' + variant
src = (HERE / ('funding_in_motion%s.src.html' % suffix)).read_text(encoding='utf8')

def uri(p):
    return 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()

page = src.replace('__LOGO__', uri(LOGO))
if '__MAP__' in page:
    page = page.replace('__MAP__', uri(ASSETS / 'map_wordmark.png')).replace('__ARROW__', uri(ASSETS / 'map_arrow.png'))
(HERE / ('funding_in_motion%s.html' % suffix)).write_text(page, encoding='utf8')
if '--render' in sys.argv:
    F = '.fonts/'
    faces = [('Playfair Display', 'normal', 700, 'playfair-display', 'latin-700-normal'),
             ('Playfair Display', 'normal', 900, 'playfair-display', 'latin-900-normal'),
             ('Playfair Display', 'italic', 700, 'playfair-display', 'latin-700-italic'),
             ('Source Sans 3', 'normal', 400, 'source-sans-3', 'latin-400-normal'),
             ('Source Sans 3', 'normal', 600, 'source-sans-3', 'latin-600-normal'),
             ('Source Sans 3', 'italic', 600, 'source-sans-3', 'latin-600-italic'),
             ('Source Sans 3', 'normal', 700, 'source-sans-3', 'latin-700-normal')]
    css = ''.join("@font-face{font-family:'%s';font-style:%s;font-weight:%d;src:url(%s%s/files/%s-%s.woff2)}" % (f, s, w, F, pkg, pkg, file) for f, s, w, pkg, file in faces)
    css += ('body{background:#FBFAF6}.wrap{max-width:none;padding:0}header,.controls,.scenes,.wrap>p,.bigplay{display:none!important}'
            '.stage{margin:0;border:0;border-radius:0;box-shadow:none;width:1920px}')
    (HERE / ('render%s.html' % suffix)).write_text(page.replace('</style>', '</style><style>' + css + '</style>', 1), encoding='utf8')
print('built', variant)
