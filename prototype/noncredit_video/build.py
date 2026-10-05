#!/usr/bin/env python3
"""Build the Noncredit Summit film (100 seconds with music, and a narrated cut).

  python3 prototype/noncredit_video/build.py                    -> noncredit_in_motion.html (the music cut)
  python3 prototype/noncredit_video/build.py narrated           -> noncredit_in_motion_narrated.html (the narrated cut)
  python3 prototype/noncredit_video/build.py [narrated] --render -> also render[_narrated].html, the 1920x1080 frame page render.sh drives

Sam, 2026-10-05, after the deck for Chancellor Christian's 2026 Noncredit Summit
keynote ("Deck is amazing"): "Go ahead on the explainer vid and do one version with
just music and another with voice over from our ElevenLabs narrator. See if we have
access to a female voice with a slight hispanic accent." He picked ladypatty1 by ear
the same day (S335): "Let's go with Ladypatty". The engine (the animation helpers,
the lockup, the arrow, the barriers, the score, the player, the narrated clock) is
the Cerritos film's, prototype/ironworker_video/ironworker_in_motion.src.html,
itself the funding film's; the narrated cut follows prototype/funding_video/'s n2.

EVERY FIGURE BELOW IS THE DECK'S: CPLBrain 04-projects/cpl-initiative/
20261005_Noncredit_Summit_CPL_Slides_1.md (its slides, notes and the checks Sam asked
for), read 2026-10-05. When the deck's figures are refreshed the week of the summit
(the students served, the funding figures), change them here and re-render.
"""
import base64, json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE.parent / 'funding_video' / 'assets'
LOGO = HERE.parent.parent / 'sierra' / 'cpl-initiative-logo-navy.png'
PAGES = 'https://cpl-initiative.github.io/cpl-project-tracker/prototype/noncredit_video/'
# The MP4s on GitHub, so the Download button works wherever the page opens (a Claude artifact grants a
# page no download permission, and Pages prunes prototype/ media).
RAW = 'https://github.com/CPL-Initiative/cpl-project-tracker/raw/main/prototype/noncredit_video/'


def jpg(name):
    return 'data:image/jpeg;base64,' + base64.b64encode((HERE / 'assets' / name).read_bytes()).decode()


FACTS = {
    # Slide 1. Her words: the Chancellor's 2025 Noncredit Summit keynote (Oct. 2025). Students served: the MAP
    # CPL dashboard via live_metrics.json, raw.Students = 52,394, scraped 2026-10-05T16:38Z (refresh the week of
    # the summit). The 2030 line is the deck's (an aspiration the CPL Initiative sets, never a model projection):
    # one in four of about 30,000 noncredit award earners a year, or about one in ten of 69,488 noncredit CTE students.
    'promise': {
        'kick': 'Chancellor Sonya Christian · Noncredit Summit, October 2025',
        'quote': '“Noncredit and not-for-credit learners will be key to meeting this goal.”',
        'label': 'Students served through credit for prior learning (CPL)',
        'served': 52394, 'servedLab': 'served so far',
        'goal': 250000, 'goalLab': 'Vision 2030 goal',
        'line': 'Within reach by 2030: CPL for about <b>7,500 noncredit learners a year</b>, one in four noncredit award earners.',
        'text': 'Last October Chancellor Christian said noncredit and not-for-credit learners will be key to meeting the goal of 250,000 Californians served through CPL by 2030. Colleges have served 52,394 so far. Within reach by 2030: CPL for about 7,500 noncredit learners a year, one in four noncredit award earners.',
    },
    # Slide 1. COMIS as shown in the 2025 keynote. The 34% is the keynote's slide 11 chart (median quarterly wage
    # $7,833 in the quarter before entry, $10,479 a year after exit or award, 33.8%), worded as the deck's .md says
    # to say it: students working before they enrolled, a year after finishing or leaving their program.
    'scale': {
        'kick': 'Noncredit in the California Community Colleges',
        'head': 'Your programs already hold the learners',
        'stats': [['1 in 4', None, 'community college students enroll in at least one noncredit course each year'],
                  ['29,649', 29649, 'students earned a noncredit award in 2024–25, nearly five times the 6,291 of 2012–13'],
                  ['+34%', 34, 'median quarterly wages, $7,833 to $10,479, for students working before they enrolled, a year after finishing or leaving', 'pct']],
        'source': 'Sources: COMIS noncredit enrollment, awards and wages, 2012–13 to 2024–25. Wages: first-time noncredit students who entered 2017–18 to 2020–21, the quarter before entry and the fifth quarter after exit (N = 14,144), nominal dollars.',
        'text': 'About one in four community college students enrolls in a noncredit course each year. 29,649 students earned a noncredit award in 2024–25, nearly five times the 6,291 of 2012–13. Noncredit students who were working before they enrolled saw their median quarterly wages rise 34%, from $7,833 to $10,479, a year after finishing or leaving their program.',
    },
    'illus': 'Illustrative learner and photo. Each step follows courses, programs and CPL on record in COCI and MAP.',
    'wip': 'Being documented now',
    # Slide 2. Composites; every step is on record in COCI or MAP except the two dashed ones (Sam, 2026-10-05:
    # Mt. SAC "is recently working on getting these documented in MAP"; NOCE's path is in development).
    'people': [
        # MAP: HS 130 + HS 131 (4 units each) transcribed at Cabrillo; the noncredit courses mirror credit.
        {'name': 'Mira', 'kind': 'Mirrored course', 'college': 'Cabrillo College', 'img': 'mira.jpg',
         'alt': 'Illustrative photo: a woman holding a clipboard talks with a visitor in a community health center.',
         'steps': [['Free noncredit community health worker courses that mirror credit', 's'],
                   ['8 units of CPL, with no course retaken', 'cpl'],
                   ['Community Health Worker Certificate of Achievement', 's'],
                   ['A health career, with college credit on her transcript', 's']],
         'note': 'Assessed once, by the faculty who taught her.',
         'text': 'Mira, a mirrored course at Cabrillo College: free noncredit community health worker courses that mirror credit carry 8 units of CPL with no course retaken, toward the Community Health Worker Certificate of Achievement.'},
        # The 2025 keynote, slide 17 (8.5 units); COCI control 46215 (the B.S.).
        {'name': 'Emilio', 'kind': 'EMT', 'college': 'Moreno Valley College', 'img': 'emilio.jpg',
         'alt': 'Illustrative photo: a young man in an EMT uniform kneels beside a medical bag in an ambulance bay.',
         'steps': [['Noncredit EMT training and state EMT certification', 's'],
                   ['8.5 units of CPL', 'cpl'],
                   ['Associate degree in paramedic or fire technology', 's'],
                   ['Bachelor’s degree in emergency management, at the same college', 's']],
         'note': 'His units count toward degrees at the same college.',
         'text': 'Emilio, EMT at Moreno Valley College: noncredit EMT training and state certification carry 8.5 units of CPL toward an associate degree in paramedic or fire technology and a bachelor’s degree in emergency management at the same college.'},
        # COCI: Mt. SAC noncredit CNA, medical assistant, surgical technician, vocational nursing. MAP: the LVN license
        # carries 22.0 units at College of the Desert (13 NRN courses, 35 students transcribed) and Los Angeles Pierce
        # College (6 NURSING courses), checked course by course for Sam on 2026-10-05.
        {'name': 'Carla', 'kind': 'Career ladder', 'college': 'Mt. San Antonio College', 'img': 'carla.jpg',
         'alt': 'Illustrative photo: a nursing student in scrubs takes a classmate’s blood pressure in a skills lab.',
         'steps': [['Noncredit CNA, then medical assistant or surgical technician', 's'],
                   ['Noncredit vocational nursing and the LVN license', 's'],
                   ['22 units of CPL for the LVN license', 'wip'],
                   ['Associate degree in nursing (ADN)', 's']],
         'note': 'College of the Desert awards 22 units for the LVN license; Los Angeles Pierce College awards a similar 22.',
         'text': 'Carla, a career ladder at Mt. San Antonio College: noncredit CNA, medical assistant or surgical technician, then vocational nursing and the LVN license. College of the Desert awards 22 units of CPL for the license, and Los Angeles Pierce College a similar 22; Mt. San Antonio College is documenting its own. Next, an associate degree in nursing.'},
        # MAP: CompTIA A+ statewide exhibit at 21 colleges, Google IT Support at 2; NOCE's landing work in development.
        {'name': 'Nadia', 'kind': 'Noncredit certificate', 'college': 'North Orange Continuing Education', 'img': 'nadia.jpg',
         'alt': 'Illustrative photo: an adult learner holds a memory module beside an open computer in an IT classroom.',
         'steps': [['Noncredit IT support certificate', 's'],
                   ['Google IT Support and CompTIA A+ certifications', 's'],
                   ['3 or more units of CPL', 'wip'],
                   ['Credit certificate and associate degree in information technology', 's']],
         'note': 'CompTIA A+ already carries credit at 21 colleges.',
         'text': 'Nadia, a noncredit certificate at North Orange Continuing Education: a noncredit IT support certificate and the Google IT Support and CompTIA A+ certifications. CompTIA A+ already carries credit at 21 colleges, and her path to a credit certificate and an associate degree in information technology is in development.'},
    ],
    # Slide 3. MAP credential reference (credential_reference_data.js, 2026-10-05) and Supabase map_college_cr_unit:
    # EMT Certification 1,219.6 of 1,557.6 eligible units transcribed (78.3%) at 28 colleges against a 47.9% system
    # rate; 49 of 84 statewide exhibits published at 253 college sites with nothing transcribed; 3,269 transcribed units
    # on credentials noncredit and adult-ed programs commonly teach, about 4% of all transcribed CPL (MAP does not yet
    # record whether a learner came from noncredit, so these are credentials noncredit teaches, never noncredit completers).
    'ready': {
        'kick': 'Ready and waiting',
        'head': 'Faculty have already said yes',
        'cols': [[78, '%', 'EMT · 28 colleges', 'of eligible units reach a transcript, against 48% across all CPL'],
                 [49, '', 'Statewide credit', 'determinations ready at 253 college sites for their first student'],
                 [3269, '', 'Units transcribed', 'on credentials noncredit programs teach, about 4% of all CPL']],
        'line': 'Most of the opportunity is still ahead.',
        'text': 'Faculty have already said yes. At 28 colleges, 78% of eligible EMT units reach a transcript, against 48% across all CPL. Forty-nine statewide credit determinations are ready at 253 college sites for their first student. Credentials noncredit programs teach carry 3,269 transcribed units, about 4% of all CPL. Most of the opportunity is still ahead.',
    },
    # Slide 4. The 2026-27 state budget ($35 million one-time, $2 million ongoing). The published allocation (Scenario 2,
    # final Sept. 30, 2026): $25,240,308 to 118 institutions sized on credit + noncredit FTES; $1,783,399 noncredit,
    # restricted to noncredit outcomes. Last year's $50,000 grants to the three noncredit programs: Sam, 2026-10-05.
    # Funding vocabulary (CLAUDE.md): funding, allocated, max award, reserved; never earn, money or pool.
    'funding': {
        'kick': 'CPL funding · the 2026–27 state budget',
        'big': 35,
        'side': 'one-time, and <b>$2 million ongoing</b>, for credit for prior learning',
        'cards': [['Last year', '$50,000 grants', 'to the noncredit programs at North Orange Continuing Education, Mt. San Antonio College and San Diego College of Continuing Education'],
                  ['This year', '$1.8 million', 'in noncredit funding for every community college noncredit program, reserved for noncredit outcomes']],
        'line': 'Noncredit counts from the start: credit and noncredit FTES together size every max award.',
        'text': 'The 2026–27 state budget provides $35 million one-time and $2 million ongoing for CPL. Last year, $50,000 grants went to the noncredit programs at North Orange Continuing Education, Mt. San Antonio College and San Diego College of Continuing Education. This year, $1.8 million in noncredit funding reaches every community college noncredit program, reserved for noncredit outcomes. Credit and noncredit FTES together size every max award.',
    },
}
for p in FACTS['people']:
    p['img'] = jpg(p['img'])

CONFIG = {
    'pageTitle': 'Noncredit Summit in Motion',
    'eyebrow': 'CPL Initiative · draft',
    'dek': 'A 100-second film for the 2026 Noncredit Summit, with music: four noncredit learners, the credit already waiting for them, and the funding that counts noncredit from the start. Play opens it full screen, and Esc leaves.',
    'link': PAGES + 'noncredit_in_motion_narrated.html',
    'linkLabel': 'Watch the narrated version',
    'sources': 'Every figure is from the CPL slides for Chancellor Christian’s 2026 Noncredit Summit keynote: COMIS noncredit enrollment, awards and wages; MAP CPL data, Oct. 5, 2026; and the CPL funding allocation published Sept. 30, 2026. The learners are composites.',
    'kick': 'Vision 2030<br>Noncredit Summit 2026',
    'title': 'Noncredit learning, college credit',
    'sub': 'Four learners, the credit already waiting for them, and the funding that counts noncredit from the start.',
    'titleText': 'Noncredit learning, college credit: four learners, the credit already waiting for them, and the funding that counts noncredit from the start. Vision 2030 Noncredit Summit, 2026.',
    'mp4': '20261005_Noncredit_Summit_in_Motion_v1.mp4',
    'facts': FACTS,
    # [the moment the bolt lands, x, y, caption]: each at the top of the scene whose fact brings it down. The
    # handoff's five (2026-10-05); "Noncredit as afterthought" is Sam's own framing of how the field feels.
    'barriers': [[29.35, 78, 25, 'Retaking what you know'],
                 [39.35, 79, 24, 'Training with no transcript'],
                 [49.35, 78, 26, 'A ladder missing rungs'],
                 [67.35, 79, 27, 'Credit nobody claimed'],
                 [77.35, 78, 27, 'Noncredit as afterthought']],
    'close': {'kick': 'Three invitations',
              'invites': ['Mirror a course', 'Post your certificates in MAP', 'Invite your completers back'],
              'help': 'The CPL Initiative team will help with each one.',
              'band': 'Our Time is Now!',
              'text': 'Three invitations to the field: mirror a course, post your certificates in MAP, and invite your completers back. The CPL Initiative team will help with each one. Our Time is Now!'},
}


def narration(name):
    # the literal filename at each call, so kb/_build_dependency_map.py sees the read
    layout = HERE / name
    return json.loads(layout.read_text(encoding='utf8')) if layout.exists() else None


VARIANTS = {
    '': CONFIG,
    # The narrated cut (Sam, 2026-10-05: "another with voice over from our ElevenLabs narrator"), the music cut's
    # picture under narration.json's voice, read in ElevenLabs. Only the page, the title's name line and the closing
    # credit differ; the narration drives the clock and the score plays as a bed under the voice.
    'narrated': dict(
        CONFIG,
        pageTitle='Noncredit Summit in Motion: Narrated',
        dek='The Noncredit Summit film, narrated by Sierra, about three minutes. Play opens it full screen; press Esc to leave. Captions are on; the Captions button turns them off.',
        link=PAGES + 'noncredit_in_motion.html',
        linkLabel='Watch the music-only version',
        mp4='20261005_Noncredit_Summit_in_Motion_Narrated_v1.mp4',
        narrator='Narrated by Sierra',
        audio='narration.mp3',
        credit='Sierra is a synthetic voice made with ElevenLabs.',
        narr=narration('narration_layout.json'),
    ),
}

args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else ''
cfg = VARIANTS[variant]
suffix = '_' + variant if variant else ''
src = (HERE / 'noncredit_in_motion.src.html').read_text(encoding='utf8')


def uri(p):
    return 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()


page = (src.replace('__PAGETITLE__', cfg['pageTitle']).replace('__EYEBROW__', cfg['eyebrow'])
        .replace('__DEK__', cfg['dek']).replace('__LINK__', cfg['link']).replace('__LINKLABEL__', cfg['linkLabel'])
        .replace('__SOURCES__', cfg['sources']).replace('__MP4URL__', RAW + cfg['mp4'])
        .replace('__CFG__', json.dumps(cfg, ensure_ascii=False))
        .replace('__LOGO__', uri(LOGO)).replace('__MAP__', uri(ASSETS / 'map_wordmark.png')).replace('__ARROW__', uri(ASSETS / 'map_arrow.png')))
assert not re.search(r'__[A-Z0-9]+__', page), 'a placeholder was left unfilled'
(HERE / ('noncredit_in_motion%s.html' % suffix)).write_text(page, encoding='utf8')
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
            '.stage{margin:0;border:0;border-radius:0;box-shadow:none;width:1920px}'
            # the MP4 carries the captions as a subtitle track a viewer can switch off
            '.cc{display:none!important}')
    (HERE / ('render%s.html' % suffix)).write_text(page.replace('</style>', '</style><style>' + css + '</style>', 1), encoding='utf8')
    if cfg.get('narr'):
        def stamp(x):
            ms = int(round(x * 1000))
            return '%02d:%02d:%02d,%03d' % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)
        srt = ''.join('%d\n%s --> %s\n%s\n\n' % (i, stamp(c['start']), stamp(c['end']), c['text'])
                      for i, c in enumerate(cfg['narr']['cues'], 1))
        (HERE / ('.captions%s.srt' % suffix)).write_text(srt, encoding='utf8')
print('wrote', (HERE / ('noncredit_in_motion%s.html' % suffix)).relative_to(HERE.parent.parent))
