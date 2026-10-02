#!/usr/bin/env python3
"""Build the CPL Funding in Motion video pages (a 90-second introduction per scenario).

  python3 prototype/funding_video/build.py               -> funding_in_motion.html (Scenario 1)
  python3 prototype/funding_video/build.py s2            -> funding_in_motion_s2.html (Scenario 2)
  python3 prototype/funding_video/build.py n1|n2        -> funding_in_motion_n1.html / _n2.html (the narrated drafts, Scenario 1 / 2)
  python3 prototype/funding_video/build.py [s2] --render -> also render[_s2].html, the 1920x1080 frame page render.sh drives

ONE source, funding_in_motion.src.html, carries the animation, the score and
the arrow's flight. What differs per scenario is the CONFIG below: the
priorities scene, the example allocation and its target, the appropriation's
destinations, and the explainer link. Every figure
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
# The Implementation Funding tab opened on its Public view (cpl_funding.js reads ?fundview=public).
PUBLIC_VIEW = 'https://cpl-initiative.github.io/cpl-project-tracker/?fundview=public#implementation-funding'

# Access counts every applied unit (Sam, 2026-10-01: "P1 no longer requires CPL
# requests to originate from landing page, portal, or batch upload"). Scenario
# 1's narrated draft keeps ACCESS_VOICED, the box its voice reads, until re-voiced.
ACCESS = 'Applied CPL units, from every CPL request.'
ACCESS_VOICED = 'Applied CPL units from students who start at the CPL Portal, your college’s CPL landing page, or a batch upload.'
COMPLETION = 'Transcribed CPL units, with the MAP counselor step checked.'

# THE APPROPRIATION'S DESTINATIONS. The introductions show two (Sam, 2026-10-01:
# "combine in one box the Projects & Supports with Staff funding together with
# projects in one value"): $8,959,692 of projects and technology plus $800,000
# for the two posts. Scenario 1's narrated draft keeps the three its voice names.
SPLIT_TWO = {
    'text': 'The state set aside 35 million dollars in one-time funding for 2026–27. 25.2 million goes directly to 118 institutions, and 9.8 million funds statewide CPL projects and technology and two Chancellor’s Office positions that support colleges.',
    'segs': [[0, 72.1, 'var(--stage-blue)'], [72.1, 27.9, 'var(--stage-navy)']],
    'labs': [[4.5, '$25,240,308', 'directly to 118 institutions', 'var(--stage-blue)', 40],
             [52, '$9,759,692', 'statewide CPL projects and technology, and two Chancellor’s Office positions supporting colleges', 'var(--stage-navy)', 43.5]],
}
SPLIT_THREE = {
    'text': 'The state set aside 35 million dollars in one-time funding for 2026–27. 25.2 million goes directly to 118 institutions, 9.0 million funds statewide CPL projects and technology, and 800 thousand funds two Chancellor’s Office positions that support colleges.',
    'segs': [[0, 72.1, 'var(--stage-blue)'], [72.1, 25.6, 'var(--stage-navy)'], [97.7, 2.3, 'var(--stage-seg3)']],
    'labs': [[4.5, '$25,240,308', 'directly to 118 institutions', 'var(--stage-blue)'],
             [36, '$8,959,692', 'statewide CPL projects and technology', 'var(--stage-navy)'],
             [67, '$800,000', 'two Chancellor’s Office positions supporting colleges', 'var(--stage-muted)']],
}
# THE EXAMPLE ALLOCATION. The introductions show the average (Sam, 2026-10-01:
# "replacing 'Sample College' with average funding (showing an average CR/NC
# funding split as well)"): the 118 max awards, credit shares and noncredit
# shares, each averaged by the engine under config md5 e21658f9 (saved
# 2026-10-01 18:35 UTC). The credit figure is the average less the noncredit
# one, so the split sums to the figure it splits. `pos` is where the marker
# sits on the base-to-cap track: (213,901 - 150,000) / 250,000.
# The same in both scenarios: the award, the base, the cap and the split do
# not depend on the priorities.
AVERAGE = {'name': 'Average allocation', 'max': 213901, 'cr': 198542, 'nc': 15359, 'pos': 25.6,
           'ticks': [[0, '$150,000', 'base'], [100, '$400,000', 'cap']],
           'maxText': 'The average maximum allocation is 213,901 dollars.',
           'splitHead': 'The average splits in two',
           'splitText': ' On average, 198,542 dollars is credit and 15,359 dollars noncredit.',
           'targetLead': 'The average Access target is', 'qualifier': 'an institution',
           # Sam, 2026-10-01: "Priority 1 · Access · average allocation · target 34.5 FTES · $99,271"
           'kickLead': 'Priority 1 · Access · average allocation', 'kickSize': 1.9}
# Sample College (Chaffey College's figures) stays in Scenario 1's narrated draft
# until its script changes: the voice speaks its maximum and its Access target.
SAMPLE = {'name': 'Sample College', 'max': 345220, 'cr': 340861, 'nc': 4358, 'pos': 78.1,
          'ticks': [[0, '$150,000', 'base'], [8.9, '$172,314', 'typical'], [100, '$400,000', 'cap']],
          'maxText': 'Sample College’s maximum allocation is 345,220 dollars.',
          'splitHead': 'Every allocation splits in two', 'splitText': '',
          'targetLead': 'Sample College’s Access target is', 'qualifier': 'it',
          'kickLead': 'Sample College · Access'}
# THE CLOSING SCENE (Sam, 2026-10-01, and sweep card 25): a plain label linked to
# the real address in the web player, no github.io address and no scenario name
# in the film (an MP4 cannot carry a link). Scenario 1's narrated draft keeps the
# heading and the address its voice names until it is re-voiced.
CLOSE = {'head': 'Find your college on the <span class="blue">CPL funding page</span>',
         'label': 'How CPL Funding Works', 'size': 3.2,
         'text': 'Find your college’s maximum allocation, targets, and progress on the CPL funding page.'}
def close_voiced(short, suffix):
    return {'head': 'Find your college on the <span class="blue">funding model page</span>',
            'label': 'Read the full explainer: ' + short,
            'text': 'Find your college’s maximum allocation, targets, and progress on the CPL funding model page' + suffix + '.'}
# THE TIMING SCENE's nodes, [position, date, label], dated from each scenario's
# stored Timeline (config md5 e21658f9): Oct 2026 for the procedure and the
# guidance memo. The confirmation node and the minimum-conditions date follow
# participationDeadline (Scenario 2: 2026-12-30; Scenario 1: 2026-12-01). Sam
# ruled Scenario 2's date Dec 30, 2026, the Timeline's (open-asks sheet 16 card 4,
# 2026-10-02); the node prints the month, as Scenario 1's does.
def timing(conf):
    return [[0, 'Oct 2026', 'Procedure and guidance memo'], [18, conf, 'Confirmation deadline'],
            [40, 'Feb 2027', 'Release 1'], [58, 'Jul 2027', 'Release 2'], [80, 'Dec 2027', 'Release 3'], [100, 'Jun 2028', 'Release 4']]
TIMING_VOICED = [[0, 'Sep 2026', 'Model released'], [18, 'Nov 2026', 'Confirmation deadline'],
                 [40, 'Feb 2027', 'Release 1'], [58, 'Jul 2027', 'Release 2'], [80, 'Dec 2027', 'Release 3'], [100, 'Jun 2028', 'Release 4']]
# HOW A TARGET IS SET (Sam, 2026-10-01): a slide after the priorities, statewide.
# A priority's statewide funding divided by its FTES reimbursement rate, the base
# rate times the priority's factor. Each figure read from the engine under config md5
# e21658f9 (the Public view's priority cards): base rate $5,649.63, factor 0.5,
# $2,824.82 per CPL FTES in both scenarios. A row is [title, statewide funding,
# the division, the published target]; the fourth figure, when present, is the
# institutions' targets added up (Sam, sheet 19 card 2, 2026-10-02: "sum"), and
# `capped` counts the institutions at the maximum award, whose targets it lowers.
# The slide then subtracts the difference. "FTES reimbursement rate", never price
# (Sam, 2026-10-02).
SAMPLE_TARGET_S1 = {'ftes': 44.3, 'usd': 112484, 'ftesWords': '44.3', 'usdWords': '112,484', 'halfFtesWords': '22.2', 'halfUsdWords': '56,242'}

CONFIG = {
    # Scenario 1 (config read 2026-10-01, Scenario 2 is published): Access 33 /
    # Completion 34 / Career attainment 33. The average Access target from the
    # engine: 22.76 FTES behind $65,518.72 (33% of the average credit share);
    # half is 11.4 FTES for $32,759.
    's1': {
        'pageTitle': 'CPL Funding in Motion: An Introduction',
        'eyebrow': 'CPL Initiative',
        'dek': 'A 100-second introduction to CPL funding for colleges, with music. Play opens it full screen; press Esc to leave. Detailed guidance will follow.',
        'linkLabel': 'How CPL funding works',
        'kick': 'An introduction for colleges',
        'titleText': '2026 to 2028 CPL Initiative funding, how it works: an introduction for colleges.',
        'mp4': '20260926_CPL_Funding_in_Motion_v4.mp4',
        # Scenario 2 is the published one, so the bare address shows Scenario 2.
        'explainer': BASE + '?scenario=Scenario%201',
        'prioName': 'Three priorities',
        'prioHead': 'Three priorities carry the funding',
        'prioText': 'Three priorities carry the funding. Access, 33 percent, 8.3 million dollars statewide, counts applied CPL units from every CPL request. Completion, 34 percent, 8.6 million dollars statewide, counts transcribed CPL units with the counselor step checked. Career attainment, 33 percent, 8.3 million dollars statewide, counts CPL units for students who reach a career outcome in EDD wage records, measured by the Chancellor’s Office.',
        # [share, title, what counts, statewide funding]: the Public view's Total Possible
        'prios': [[33, 'Access', ACCESS, 8329302], [34, 'Completion', COMPLETION, 8581705],
                  [33, 'Career attainment', 'CPL units for students who reach a career outcome in EDD wage records, measured by the Chancellor’s Office.', 8329302]],
        'timing': timing('Dec 2026'), 'deadline': 'December 1, 2026', 'close': CLOSE,
        'how': {'rows': [['Access', 8329302, 2948.6], ['Completion', 8581705, 3038.0], ['Career attainment', 8329302, 2948.6]],
                'rate': 5649.63, 'factor': 0.5, 'price': 2824.82},
        'split': SPLIT_TWO, 'ex': AVERAGE,
        'target': {'ftes': 22.76, 'usd': 65518.72, 'ftesWords': '22.8', 'usdWords': '65,519', 'halfFtesWords': '11.4', 'halfUsdWords': '32,759'},
    },
    # Scenario 2, the published scenario (config read 2026-10-01): Access 50 /
    # Completion 50; the Chancellor's Office reports career attainment with the
    # innovation projects (Sam, 2026-09-29), one reported card here. The average
    # Access target from the engine: 34.49 FTES behind $99,270.78 (half the
    # average credit share); `usd` keeps the cents so the half-target hold prints
    # the engine's half, $49,635.
    's2': {
        # Scenario 2 is the published scenario, so neither the film nor its page
        # names it (Sam, 2026-10-01); the file names keep it.
        'pageTitle': 'CPL Funding in Motion: An Introduction',
        'eyebrow': 'CPL Initiative',
        'dek': 'A 100-second introduction to CPL funding for colleges, with music. Play opens it full screen; press Esc to leave. Detailed guidance will follow.',
        'linkLabel': 'How CPL funding works',
        'kick': 'An introduction for colleges',
        'titleText': '2026 to 2028 CPL Initiative funding, how it works: an introduction for colleges.',
        'mp4': '20260926_CPL_Funding_in_Motion_Scenario_2_v7.mp4',
        'explainer': BASE,
        'prioName': 'Two priorities',
        'prioHead': 'Two priorities carry the funding',
        'prioText': 'Two priorities carry the funding. Access, 50 percent, 12.6 million dollars statewide, counts applied CPL units from every CPL request. Completion, 50 percent, 12.6 million dollars statewide, counts transcribed CPL units with the counselor step checked. The Chancellor’s Office reports career attainment together with the innovation projects, in qualitative terms, beside 9.8 million dollars statewide for CPL projects and technology and two Chancellor’s Office positions; the institutions’ allocations follow Access and Completion.',
        # The reported box shows the statewide projects, technology and the two
        # positions together, $9,759,692 (S312's proposal; $8,959,692 is the
        # projects and technology alone).
        'prios': [[50, 'Access', ACCESS, 12620154], [50, 'Completion', COMPLETION, 12620154],
                  [None, 'Career attainment and innovation projects', 'Reported by the Chancellor’s Office in qualitative terms. The institutions’ allocations follow Access and Completion.', 9759692]],
        'timing': timing('Dec 2026'), 'deadline': 'December 30, 2026', 'close': CLOSE,
        # The published target is the sum (sheet 19 card 2): the engine's
        # _publicProgress over the live config, md5 764fd264 (2026-10-02),
        # 4,366.66 for each priority; the seven institutions at the $400,000
        # maximum account for the 100.9 FTES.
        'how': {'rows': [['Access', 12620154, 4467.6, 4366.7], ['Completion', 12620154, 4467.6, 4366.7]],
                'rate': 5649.63, 'factor': 0.5, 'price': 2824.82, 'capped': 7},
        'split': SPLIT_TWO, 'ex': AVERAGE,
        'target': {'ftes': 34.49, 'usd': 99270.78, 'ftesWords': '34.5', 'usdWords': '99,271', 'halfFtesWords': '17.2', 'halfUsdWords': '49,635'},
    },
}

# The narrated draft of Scenario 1 (Sam, 2026-09-26: "a natural feminine
# voice-over that follows a script your write... tone down the music to just
# background level... slow down and lengthen the timing"). The narration drives
# the clock: narrate.py writes the track and its layout, each scene stretches to
# its lead-in, clip and air, and the score plays as a bed under the voice.
def narration(name):
    # the literal filename at each call, so kb/_build_dependency_map.py sees the read
    layout = HERE / name
    return json.loads(layout.read_text(encoding='utf8')) if layout.exists() else None


CONFIG['n1'] = dict(
    CONFIG['s1'],
    pageTitle='CPL Funding in Motion: Narrated Draft',
    eyebrow='CPL Initiative · draft',
    dek='A narrated draft of the introduction to CPL funding for colleges, about three minutes. Play opens it full screen; press Esc to leave. Captions are on; the Captions button turns them off.',
    mp4='20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4',
    split=SPLIT_THREE, ex=SAMPLE, target=SAMPLE_TARGET_S1,
    # The frames the voice was laid out on (narration_s1_layout.json): no targets
    # slide, the boxes and dates it reads, the explainer address it names.
    explainer=BASE, how=None, timing=TIMING_VOICED, deadline='November 1, 2026',
    prioText='Three priorities carry the funding. Access, 33 percent, counts applied CPL units from students who start at the CPL Portal, a college CPL landing page, or a batch upload. Completion, 34 percent, counts transcribed CPL units with the counselor step checked. Career attainment, 33 percent, counts CPL units for students who reach a career outcome in EDD wage records, measured by the Chancellor’s Office.',
    prios=[[33, 'Access', ACCESS_VOICED], [34, 'Completion', COMPLETION],
           [33, 'Career attainment', 'CPL units for students who reach a career outcome in EDD wage records, measured by the Chancellor’s Office.']],
    close=close_voiced('cpl-initiative.github.io/cpl-project-tracker/funding-model', ''),
    audio='narration_s1.mp3',
    credit='Narrated with a synthetic voice (Kokoro-82M, Heart).',
    narr=narration('narration_s1_layout.json'),
)
# The narrated cut of Scenario 2, draft 2 (Sam, 2026-10-02: "write a script for
# the scenario 2 video for an ElevenLabs narrator. Keep it very simple and
# focused... select a female voice model to narrate and give her the name Sierra
# on the video as a sample"; "The music can drop to background level"). The
# introduction's own picture (every figure above, the targets slide, December
# 30, 2026, the CPL funding page) under narration_s2.json's voice, Sierra, read
# in ElevenLabs. Only the page, the title's name line and the closing credit
# differ from s2. The explainer does not link it while it waits on Sam's review.
CONFIG['n2'] = dict(
    CONFIG['s2'],
    pageTitle='CPL Funding in Motion: Narrated Draft, Scenario 2',
    eyebrow='CPL Initiative · draft',
    dek='A narrated draft of the introduction to CPL funding for colleges, about two minutes, voiced by Sierra. Play opens it full screen; press Esc to leave. Captions are on; the Captions button turns them off.',
    mp4='20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_2.mp4',
    narrator='Narrated by Sierra',
    audio='narration_s2.mp3',
    credit='Sierra is a synthetic voice made with ElevenLabs.',
    narr=narration('narration_s2_layout.json'),
)

args = [a for a in sys.argv[1:] if not a.startswith('--')]
variant = args[0] if args else 's1'
cfg = CONFIG[variant]
suffix = '' if variant == 's1' else '_' + variant
src = (HERE / 'funding_in_motion.src.html').read_text(encoding='utf8')

def uri(p):
    return 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()

page = (src.replace('__PAGETITLE__', cfg['pageTitle']).replace('__EYEBROW__', cfg['eyebrow'])
        .replace('__DEK__', cfg['dek']).replace('__EXPLAINER__', cfg['explainer']).replace('__PUBLICVIEW__', PUBLIC_VIEW).replace('__LINKLABEL__', cfg['linkLabel']).replace('__MP4__', cfg['mp4'])
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
print('built', variant)
