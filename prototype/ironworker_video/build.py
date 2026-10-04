#!/usr/bin/env python3
"""Build the Ironworker pathway film (100 seconds, with music).

  python3 prototype/ironworker_video/build.py            -> ironworker_in_motion.html
  python3 prototype/ironworker_video/build.py --render   -> also render.html, the 1920x1080 frame page render.sh drives

Sam, 2026-10-04 ~19:55Z: "Would love to have a 100-second video like the one we
did for the funding model for this use case...but we can play with that at the
stage you recommend." The stage came when the Cerritos runner reads confirmed the
ladder's lines (S329-S330). The engine (the animation helpers, the lockup, the
arrow, the barriers, the score, the player) is the funding film's,
prototype/funding_video/funding_in_motion.src.html, forked into
ironworker_in_motion.src.html with this film's scenes.

EVERY FIGURE BELOW IS A LINE THE CPL PATHWAYS LADDER MARKS "In our data"
(cpl_pathways_data.js, cerritos-ironworker-ladder) or the display build's figure
for the A.S. (cpl_pathways_roep_data.js, cerritos_42158, build bbbbfb611f15).
Narrate only those (Sam, the same request). When a ladder line changes, change it
here and re-render.
"""
import base64, json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE.parent / 'funding_video' / 'assets'
LOGO = HERE.parent.parent / 'sierra' / 'cpl-initiative-logo-navy.png'
# The CPL Pathways tab on COBI, which opens on the ladder (cpl_pathways.js lists it first).
LINK = 'https://cpl-initiative.github.io/cpl-project-tracker/#cpl-pathways'

FACTS = {
    # Downey Unified, CTE pathways board presentation (June 27, 2023); WELD 60 is now WELD 160 (2026-27
    # catalog). The route Columbus High uses (articulation or dual enrollment) is still To confirm, so the
    # film names both of Cerritos's routes and never says which one this pathway takes.
    'start': {
        'head': 'Columbus High School’s welding pathway',
        'lead': 'Downey Unified · maps to two Cerritos courses',
        'courses': [['WELD 160', 'Welding and Metal Fabrication Safety', 1.0],
                    ['WELD 100', 'Welding Fundamentals', 2.5]],
        'sum': 3.5,
        # Cerritos 2026-27 catalog, Educational Partnerships and Programs; the Credit by Examination petition.
        'route': 'Cerritos grants credit by exam for an articulated high school course, with a B or better, or through dual enrollment.',
        'text': 'Columbus High School’s welding pathway, in Downey Unified, maps to two Cerritos courses: WELD 160, Welding and Metal Fabrication Safety, 1 unit, and WELD 100, Welding Fundamentals, 2.5 units, 3.5 units in all. Cerritos grants credit by exam for an articulated high school course, with a B or better, or through dual enrollment.',
    },
    # Cerritos's Field Ironwork page (four years); the 2026-27 IWAP course descriptions (contact hours);
    # Schedule+ read 2026-10-04 (run 37241996688); MAP articulated-exhibit records (15 of 24 A.S. courses).
    'app': {
        'locals': 'Ironworkers Locals 433 and 416',
        'head': 'Four years on the job and in the classroom',
        'hours': [[878, 'classroom hours · Reinforcing'], [898, 'classroom hours · Structural']],
        'sections': 'Fall 2026: Cerritos runs sections of <b>22 IWAP courses</b>.',
        'cpl': 'Cerritos already credits this training <b>through CPL</b>.',
        'text': 'The Ironworkers apprenticeship, Locals 433 and 416, runs four years on the job and in the classroom: 878 classroom hours on the Reinforcing track and 898 on the Structural. In Fall 2026 Cerritos runs sections of 22 IWAP courses, and it already credits this training through CPL.',
    },
    # 2026-27 catalog: each certificate is one complete A.S. major option (the core plus the option).
    'cert': {
        'head': 'Two certificates',
        'names': ['Reinforcing', 'Structural'],
        'each': 'The A.S. core plus this option’s courses',
        'line': 'Each certificate is one complete <b>A.S. major option</b>.',
        'text': 'Two certificates, Reinforcing and Structural. Each is one complete A.S. major option: the core plus that option’s courses.',
    },
    # The display build (cpl_pathways_roep_data.js, cerritos_42158): up_to 31.5 of 34-38 units, the major's
    # requirements as the catalog prints them (general education sits beside them, so never "a degree"); 15 of the
    # program's 24 courses carry CPL Cerritos has articulated ("here").
    'as': {
        'kick': 'A.S., Apprenticeship: Field Ironworkers',
        'upTo': 31.5, 'total': 'of the major’s 34–38 units',
        'through': 'a learner could meet through <b>CPL Cerritos has already articulated</b>',
        'courses': 24, 'here': 15,
        'line': '<b>15 of the program’s 24 courses</b> carry articulated CPL.',
        'close': 'Four years of training cover most of the major.',
        'text': 'The A.S., Apprenticeship: Field Ironworkers: its major runs 34 to 38 units, and a learner could meet up to 31.5 of them through CPL Cerritos has already articulated: 15 of the program’s 24 courses carry it.',
    },
    # Cerritos's 2026 State of the College (approved, its second bachelor's degree); the Field Ironwork page
    # (Spring 2027); the 2024 regional program record (admission). The proposed course list stays off screen.
    'bs': {
        'head': 'B.S., Field Ironworker Supervision',
        'lines': ['Approved: Cerritos’s second bachelor’s degree',
                  'Apprenticeship graduates can begin in Spring 2027',
                  'Admission: two years of prerequisite courses and a completed general education pattern'],
        'text': 'The B.S. in Field Ironworker Supervision is approved, Cerritos’s second bachelor’s degree. Apprenticeship graduates can begin in Spring 2027; admission follows two years of prerequisite courses and a completed general education pattern.',
    },
    # Centers of Excellence occupational demand 2024-2029, Los Angeles and Orange County regions.
    'career': {
        'kick': 'Career · Los Angeles and Orange County, 2024–2029',
        'head': 'From the crew to supervising it',
        'regions': ['Los Angeles', 'Orange County'],
        'jobs': [['Structural iron and steel workers', 35, 37],
                 ['First-line supervisors, construction trades', 43, 48]],
        'openings': '1,130 + 680 = <span class="gold">1,810</span> supervisor openings a year',
        'source': 'Centers of Excellence occupational projections, 2024–2029',
        'text': 'In Los Angeles and Orange County, structural iron and steel workers earn a median 35 and 37 dollars an hour; first-line supervisors of construction trades, 43 and 48. The two regions project 1,130 and 680 supervisor openings a year, 1,810 together.',
    },
    'recap': {
        'head': 'One pathway, step by step',
        'lines': [['High school', 'Welding mapped to 3.5 units'],
                  ['Apprenticeship', 'Four years, credited through CPL'],
                  ['Certificates', 'Reinforcing or Structural'],
                  ['A.S.', 'Up to 31.5 of the major’s 34–38 units through CPL'],
                  ['B.S.', 'Open to apprenticeship graduates from Spring 2027']],
        'text': 'One pathway, step by step: high school welding mapped to 3.5 units; a four-year apprenticeship credited through CPL; a Reinforcing or Structural certificate; an A.S. with up to 31.5 of its major’s 34 to 38 units through CPL; and a B.S. open to apprenticeship graduates from Spring 2027.',
    },
}

CONFIG = {
    'pageTitle': 'Ironworker Pathway in Motion',
    'eyebrow': 'CPL Initiative · draft',
    'dek': 'A 100-second film of one pathway at Cerritos College, from high school to a bachelor’s degree, with music. Every figure comes from a public source; play opens it full screen, and Esc leaves.',
    'linkLabel': 'The Ironworker ladder on CPL Pathways',
    'kick': 'Cerritos College<br>Field Ironworkers',
    'sub': 'One pathway, high school to a bachelor’s degree, with the credit for prior learning (CPL) at each step.',
    'titleText': 'From high school to the job site: one Field Ironworkers pathway at Cerritos College, with the credit for prior learning at each step.',
    'mp4': '20261004_Ironworker_Pathway_in_Motion_v1.mp4',
    'link': LINK,
    'facts': FACTS,
    # [the moment the bolt lands, x, y, caption]: each at the top of the scene whose fact brings it down.
    'barriers': [[7.35, 76, 25, 'Retaking high school welding'],
                 [17.35, 78, 24, 'Four years, zero units'],
                 [37.35, 80, 26, 'A degree from zero'],
                 [51.35, 78, 27, 'Nothing past the A.S.'],
                 [62.35, 79, 28, 'Same job, same wage']],
    'close': {'head': 'One pathway, high school to a <span class="blue">bachelor’s degree</span>',
              'label': 'See every step on CPL Pathways',
              'text': 'One pathway, high school to a bachelor’s degree. See every step, with its sources, on CPL Pathways.'},
}

src = (HERE / 'ironworker_in_motion.src.html').read_text(encoding='utf8')


def uri(p):
    return 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()


cfg = CONFIG
page = (src.replace('__PAGETITLE__', cfg['pageTitle']).replace('__EYEBROW__', cfg['eyebrow'])
        .replace('__DEK__', cfg['dek']).replace('__LINK__', cfg['link']).replace('__LINKLABEL__', cfg['linkLabel'])
        .replace('__MP4__', cfg['mp4'])
        .replace('__CFG__', json.dumps(cfg, ensure_ascii=False))
        .replace('__LOGO__', uri(LOGO)).replace('__MAP__', uri(ASSETS / 'map_wordmark.png')).replace('__ARROW__', uri(ASSETS / 'map_arrow.png')))
(HERE / 'ironworker_in_motion.html').write_text(page, encoding='utf8')
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
    (HERE / 'render.html').write_text(page.replace('</style>', '</style><style>' + css + '</style>', 1), encoding='utf8')
print('wrote', (HERE / 'ironworker_in_motion.html').relative_to(HERE.parent.parent))
