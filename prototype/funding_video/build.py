#!/usr/bin/env python3
"""Build the CPL Funding in Motion video pages (a 90-second introduction per scenario).

  python3 prototype/funding_video/build.py               -> funding_in_motion.html (Scenario 1)
  python3 prototype/funding_video/build.py s2            -> funding_in_motion_s2.html (Scenario 2)
  python3 prototype/funding_video/build.py [s2] --render -> also render[_s2].html, the 1920x1080 frame page render.sh drives

ONE source, funding_in_motion.src.html, carries the animation, the score and
the arrow's flight. What differs per scenario is the CONFIG below: the
priorities scene, Sample College's target, and the explainer link. Every figure
here is typed from the engine under the stored scenario config on its date; if
a dial moves, update the figure here and re-render (render.sh).

Image placeholders: __LOGO__ (the CPL Initiative logo), __MAP__ (the MAP
wordmark with its arrow cut out) and __ARROW__ (the arrow, which flies). Every
image is inlined so a built page is one file.
"""
import base64, json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE / 'assets'
LOGO = HERE.parent.parent / 'sierra' / 'cpl-initiative-logo-navy.png'
BASE = 'https://cpl-initiative.github.io/cpl-project-tracker/funding-model/'

ACCESS = 'Applied CPL units from students who start at the CPL Portal, your college’s CPL landing page, or a batch upload.'
COMPLETION = 'Transcribed CPL units, with the MAP counselor step checked.'

CONFIG = {
    # Scenario 1, the published scenario (config read 2026-09-24): Access 33 /
    # Completion 34 / Career attainment 33; Chaffey's Access target 44.3 FTES / $112,484.
    's1': {
        'pageTitle': 'CPL Funding in Motion: An Introduction',
        'eyebrow': 'CPL Initiative',
        'dek': 'A 90-second introduction for colleges, with music. Play opens it full screen; press Esc to leave. Detailed guidance will follow.',
        'linkLabel': 'CPL funding model',
        'kick': 'An introduction for colleges',
        'titleText': '2026 to 2028 CPL Initiative funding, how it works: an introduction for colleges.',
        'mp4': '20260926_CPL_Funding_in_Motion.mp4',
        'explainer': BASE,
        'explainerShort': 'cpl-initiative.github.io/cpl-project-tracker/funding-model',
        'closingSuffix': '',
        'prioName': 'Three priorities',
        'prioHead': 'Three priorities carry the funding',
        'prioText': 'Three priorities carry the funding. Access, 33 percent, counts applied CPL units from students who start at the CPL Portal, a college CPL landing page, or a batch upload. Completion, 34 percent, counts transcribed CPL units with the counselor step checked. Career attainment, 33 percent, counts CPL units for students who reach a career outcome in EDD wage records, measured by the Chancellor’s Office.',
        'prios': [[33, 'Access', ACCESS], [34, 'Completion', COMPLETION],
                  [33, 'Career attainment', 'CPL units for students who reach a career outcome in EDD wage records, measured by the Chancellor’s Office.']],
        'target': {'ftes': 44.3, 'usd': 112484, 'ftesWords': '44.3', 'usdWords': '112,484', 'halfFtesWords': '22.2', 'halfUsdWords': '56,242'},
    },
    # Scenario 2 (stored 2026-09-25 15:16 UTC): Access 50 / Completion 50, Career
    # attainment and innovation projects as a reported card; Chaffey's Access
    # target 67.1 FTES / $170,431.
    's2': {
        'pageTitle': 'CPL Funding in Motion: An Introduction, Scenario 2',
        'eyebrow': 'CPL Initiative · Scenario 2',
        'dek': 'A 90-second introduction for colleges, with music, for Scenario 2 of the funding model. Play opens it full screen; press Esc to leave. Detailed guidance will follow.',
        'linkLabel': 'CPL funding model, Scenario 2',
        'kick': 'Scenario 2 · An introduction for colleges',
        'titleText': '2026 to 2028 CPL Initiative funding, how it works: an introduction for colleges, Scenario 2.',
        'mp4': '20260926_CPL_Funding_in_Motion_Scenario_2.mp4',
        'explainer': BASE + '?scenario=Scenario%202',
        'explainerShort': 'cpl-initiative.github.io/cpl-project-tracker/funding-model/?scenario=Scenario 2',
        'closingSuffix': ' for Scenario 2',
        'prioName': 'Two priorities',
        'prioHead': 'Two priorities carry the funding',
        'prioText': 'Two priorities carry the funding in Scenario 2. Access, 50 percent, counts applied CPL units from students who start at the CPL Portal, a college CPL landing page, or a batch upload. Completion, 50 percent, counts transcribed CPL units with the counselor step checked. Career attainment and innovation projects are funded statewide through the project allocation and reported alongside; they add nothing to an institution’s allocation.',
        'prios': [[50, 'Access', ACCESS], [50, 'Completion', COMPLETION],
                  [None, 'Career attainment and innovation projects', 'Funded statewide through the project allocation and reported alongside. It adds nothing to an institution’s allocation.']],
        'target': {'ftes': 67.1, 'usd': 170431, 'ftesWords': '67.1', 'usdWords': '170,431', 'halfFtesWords': '33.6', 'halfUsdWords': '85,216'},
    },
}

args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else 's1'
cfg = CONFIG[variant]
suffix = '' if variant == 's1' else '_' + variant
src = (HERE / 'funding_in_motion.src.html').read_text(encoding='utf8')

def uri(p):
    return 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()

page = (src.replace('__PAGETITLE__', cfg['pageTitle']).replace('__EYEBROW__', cfg['eyebrow'])
        .replace('__DEK__', cfg['dek']).replace('__EXPLAINER__', cfg['explainer']).replace('__LINKLABEL__', cfg['linkLabel']).replace('__MP4__', cfg['mp4'])
        .replace('__CFG__', json.dumps(cfg, ensure_ascii=False))
        .replace('__LOGO__', uri(LOGO)).replace('__MAP__', uri(ASSETS / 'map_wordmark.png')).replace('__ARROW__', uri(ASSETS / 'map_arrow.png')))
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
    css += ('body{background:#FBFAF6}.player{width:1920px!important;padding:0!important;margin:0}.wrap,.controls,.bigplay{display:none!important}'
            '.stage{margin:0;border:0;border-radius:0;box-shadow:none;width:1920px}')
    (HERE / ('render%s.html' % suffix)).write_text(page.replace('</style>', '</style><style>' + css + '</style>', 1), encoding='utf8')
print('built', variant)
