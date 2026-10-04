#!/usr/bin/env python3
"""The 20 pilot records, one card each, for Sam's check (the fourth bar).

The program requirements harvest (docs/reference/lanes/program-requirements-harvest.md)
tests every record four ways. Three run without a person
(kb/_program_requirements_score.py: coverage of the state's closed list, no
invented course, unit arithmetic), and all 20 pilot records pass them
(extraction runs 37171952080 and 37173589029, S324). The fourth is a person
reading the record against the catalog: Sam's call on open-asks sheet 25
(2026-10-03), "Sam himself checks the 20-program sample".

Each card shows the record as the extractor wrote it, what the scorer
measured, the extractor's own notes, and a link to the catalog page or export
it read. The proposal is "matches the catalog" unless this session read the
record against its filed catalog text and found a fault; then it names the fix.
Every number on a card is read from the filed record and fixture at build time.

⚠️ ITS OWN SHEET, WITH ITS OWN STORE: the standing open-asks sheet's store is
keyed to its own cards (docs/reference/decision_sheets.md). A sheet whose cards
change is published under a fresh SHEET_ID and artifact.

Run: python3 kb/_build_pilot_records_review_sheet.py
"""
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECORDS = os.path.join(ROOT, 'kb', 'program_requirements_pilot', 'records')
OUT = os.path.join(ROOT, 'docs/visuals/2026-10-04-pilot-records-review.html')
SHEET_ID = '2026-10-04-pilot-records-review'
E = m.E

OK = ('Matches the catalog', 'ok')
FIX = ('Needs a fix', 'fix')
LATER = ('Later', 'later')

COLLEGE_ORDER = ['Cerritos College', 'Mt. San Antonio College', 'Riverside City College',
                 'San Diego Miramar College', 'West Los Angeles College']
SHAPE_WORDS = {
    'adt': 'transfer degree',
    'degree_list': 'degree with a choose list',
    'cert_electives': 'certificate with electives',
    'noncredit': 'noncredit certificate',
    'noncredit_substitute': 'degree read for its sequence (Miramar offers no noncredit program)',
}
RULE_WORDS = {'all': 'every course required', 'choose_courses': 'choose %s course%s',
              'choose_units': 'choose %s units'}

# This session read each of these records against its filed catalog text and
# found a fault the three automatic bars cannot see. Keyed by record file.
FAULTS = {
    'mtsac_03086': (
        "The elective block lists FIRE 86 twice; the catalog prints it once. Drop the second "
        "entry. The block's other path (FIRE 86 and KINF 53 plus one more FIRE course) stays in "
        "the record's notes, because the record shape has no way to say \"this set of three, "
        "or any two\"."),
    'mtsac_08086': (
        "The catalog heads the anatomy courses \"Select one of the following sequences: 8-10\", "
        "and the record pairs them course by course (ANAT 10A or ANAT 35, ANAT 10B or ANAT 36), "
        "which lets a student mix 10A with 36. Record two whole sequences instead, ANAT 10A and "
        "10B (8 units) or ANAT 35 and 36 (10 units), as one option group."),
}
# A doubt worth naming on a card that is otherwise proposed as matching.
DOUBTS = {
    'wlac_37050': (
        "the heading sits on catalog page 122, which the capture did not read, so the extractor "
        "named the section by its Cal-GETC line and its place before Kinesiology (AA). The "
        "catalog itself numbers the elective areas 3 to 6, and the five listed courses it does "
        "not print (BIOLOGY 3, KIN 232, 288, 303 and 345) are absent from both Kinesiology "
        "sections."),
    'miramar_35030': (
        "a page break splits the supplemental business list, and the extractor read ACCT 102, "
        "ACCT 150 and CISC 181 as its continuation. That reading adds to the printed 27 to 31 "
        "units."),
    'riverside_39033': (
        "the block heading says 240 hours while the catalog's own total and the course hours "
        "say 246. The record takes 246."),
    'mtsac_42916': (
        "the catalog prints no hours, units or total for this certificate, so nothing could be "
        "added; the hours would have to come from the college."),
}


def num(v):
    if v is None:
        return None
    return int(v) if float(v) == int(v) else v


def span(d):
    if not isinstance(d, dict) or (d.get('min') is None and d.get('max') is None):
        return None
    lo, hi = num(d.get('min')), num(d.get('max'))
    return '%s' % lo if lo == hi or hi is None else '%s to %s' % (lo, hi)


def course(c):
    u = num(c.get('units'))
    if c.get('units_max') is not None:
        u = '%s to %s' % (u, num(c['units_max']))
    s = E(c['code']) + ('' if u is None else ' (%s)' % u)
    if c.get('catalog_addition'):
        s += ' [not on the state list]'
    alts = []
    for a in c.get('alternatives') or []:
        code = a['code'] if isinstance(a, dict) else a
        flag = ' [not on the state list]' if isinstance(a, dict) and a.get('catalog_addition') else ''
        alts.append(E(code) + flag)
    if alts:
        s += ' or ' + ' or '.join(alts)
    return s


def block(b, measure):
    rule = b.get('rule')
    words = RULE_WORDS.get(rule, rule)
    if rule == 'choose_courses':
        n = num(b.get('minimum'))
        words = words % (n, '' if n == 1 else 's')
    elif rule == 'choose_units':
        words = words % num(b.get('minimum'))
    bits = [words]
    if span(b.get('stated')):
        bits.append('the catalog prints %s %s' % (span(b['stated']), measure))
    if b.get('option_group'):
        bits.append('one of the blocks marked "%s"' % E(b['option_group']))
    return ('<p><strong>%s</strong> (%s): %s.</p>'
            % (E(b['name']), '; '.join(bits), '; '.join(course(c) for c in b.get('courses') or [])))


def card(path):
    key = os.path.splitext(os.path.basename(path))[0]
    r = json.load(open(path, encoding='utf-8'))
    fx = json.load(open(os.path.join(ROOT, r['source_file']), encoding='utf-8'))
    rec, sc = r['record'], r['score']
    prog = rec['program']
    measure = prog.get('measure') or 'units'
    src = (fx.get('source') or {}).get('url') or fx.get('catalog_url') or ''
    pages = (fx.get('source') or {}).get('pages')
    where = '<a href="%s">%s</a>' % (E(src), 'the catalog export' if 'Export' in src else
                                     'the catalog PDF, pages %s' % ', '.join(map(str, pages))
                                     if pages else 'the catalog page')
    cov = sc['coverage']
    facts = ['<p>Read from %s (%s catalog). Heading as printed: %s.</p>'
             % (where, E(fx.get('catalog_year') or 'year not recorded'), E(prog.get('section_heading') or ''))]
    facts += [block(b, measure) for b in rec.get('blocks') or []]
    total = span(prog.get('total_units'))
    ar = sc['arithmetic']
    if ar['status'] == 'unstated':
        facts.append('<p>The catalog states no total, and prints no %s beside any course.</p>' % measure)
    else:
        facts.append('<p>The catalog states %s %s; the blocks add to %s.</p>'
                     % (total, measure, span({'min': ar['computed'][0], 'max': ar['computed'][1]})))
    miss = rec.get('missing_explained') or []
    line = 'The record places %d of the %d courses the state lists for this program.' % (
        cov['placed'], cov['listed'])
    if miss:
        line += ' Not placed: ' + '; '.join('%s, %s' % (E(x['code']), E(x['why'])) for x in miss) + '.'
    facts.append('<p>%s</p>' % line)
    notes = rec.get('notes') or []
    why = ('<p>The extractor noted: ' + ' '.join(E(n) for n in notes) + '</p>') if notes else ''
    if key in FAULTS:
        rec_html = '<strong>Needs a fix.</strong> ' + E(FAULTS[key])
        chips = [FIX, OK, LATER]
    else:
        rec_html = '<strong>Matches the catalog.</strong>'
        if key in DOUBTS:
            rec_html += ' <em>It might be wrong if</em> ' + E(DOUBTS[key])
        chips = [OK, FIX, LATER]
    return {
        'college': r['college'],
        'title': '%s, %s (%s)' % (r['college'], r['title'], SHAPE_WORDS.get(r['shape'], r['shape'])),
        'ref': '%s · control number %s · %s' % (key, r['control_number'],
                                                os.path.relpath(path, ROOT)),
        'facts': ''.join(facts),
        'why': why,
        'rec': rec_html,
        'chips': chips,
        '_key': key,
    }


def items():
    I = [card(p) for p in sorted(glob.glob(os.path.join(RECORDS, '*.json')))]
    I.sort(key=lambda it: (COLLEGE_ORDER.index(it['college']) if it['college'] in COLLEGE_ORDER
                           else 99, it['_key']))
    missing = set(FAULTS) | set(DOUBTS)
    missing -= {it['_key'] for it in I}
    if missing:
        raise SystemExit('a proposal names a record that is not filed: %s' % sorted(missing))
    return I


def build():
    I = items()
    out = m.build_sheet('The 20 pilot records', I, sheet_id=SHEET_ID)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w', encoding='utf-8').write(out)
    print('%d items · %d proposed as a fix · %s bytes -> %s'
          % (len(I), sum(1 for it in I if it['chips'][0] == FIX), format(len(out), ','),
             os.path.relpath(OUT, ROOT)))
    return 0


if __name__ == '__main__':
    sys.exit(build())
