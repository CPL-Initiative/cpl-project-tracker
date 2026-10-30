#!/usr/bin/env python3
"""What changes if a choose-courses block's printed units stand in for the units its courses add to.

S528 (2026-10-30), for Open Asks Sheet 143 card 2. The scorer
(kb/_program_requirements_score.py, block_units) uses a block's printed figure
("Select 2 courses from one language (10 units)") only when a course has no
units or the rule picks units; otherwise it adds the courses, so a block whose
cheapest pick falls under the printed figure carries the program's low end under
the printed total. This reads every filed record holding such a block under two
readings and prints how each record's program arithmetic would move. No write.

    python3 kb/_block_total_reading_measure.py            # the printed figure always stands in
    python3 kb/_block_total_reading_measure.py --inside   # only where the courses can make it, and the block
                                                          # does not print "minimum"
    python3 kb/_block_total_reading_measure.py --floor    # the printed figure is the block's floor, never its
                                                          # ceiling (S529, Open Asks Sheet 144 card 2)

S529 read the 44 records the first reading unpasses (Sam ruled Sheet 143 card 2 "printed", 12:58Z 2026-10-30):
few are catalog slips. Most lists print their smallest figure ("Select two courses (6 units)") over courses
that run 6 to 7 inside a program total of 18-19, so the printed figure in place of the courses drops the top
the program's own total carries. --floor keeps it.
"""
import collections
import copy
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _program_requirements_score as s  # noqa: E402


def reread(rec, inside):
    r = copy.deepcopy(rec)
    for b in r.get('blocks') or []:
        sp = s._span(b.get('stated'))
        if b.get('rule') != 'choose_courses' or not sp:
            continue
        if inside:
            cu = s.block_units(b, {})[0]
            if not cu or not (cu[0] <= sp[0] and sp[1] <= cu[1]) or 'minimum' in (b.get('name') or '').lower():
                continue
        b['rule'] = 'choose_units'
    return r


def floor_units(block, listed, hours=False):
    """block_units, with a choose-courses block's printed figure as its floor: (max(lo, printed lo),
    max(hi, printed hi)), and the printed figure itself when the courses cannot be added."""
    r, why = _ORIG_BLOCK_UNITS(block, listed, hours)
    sp = s._span(block.get('stated'))
    if block.get('rule') == 'choose_courses' and sp:
        return ((max(r[0], sp[0]), max(r[1], sp[1])) if r else sp), []
    return r, why


_ORIG_BLOCK_UNITS = s.block_units


def status(rec):
    prog = rec.get('program') or {}
    st = s._span(prog.get('total_units'))
    if not st:
        return None
    (lo, hi), why = s.program_units(rec, {})
    return 'incomplete' if why else s.program_verdict(prog, st, lo, hi)['status']


def main():
    inside = '--inside' in sys.argv
    floor = '--floor' in sys.argv
    moves, colleges, ex = collections.Counter(), collections.defaultdict(set), collections.defaultdict(list)
    for f in sorted(glob.glob('kb/program_requirements_college/*/records/*.json')):
        d = json.load(open(f))
        rec = d.get('record')
        if not rec or not any(b.get('rule') == 'choose_courses' and s._span(b.get('stated'))
                              for b in rec.get('blocks') or []):
            continue
        if floor:
            a = status(rec)
            s.block_units = floor_units
            try:
                b = status(rec)
            finally:
                s.block_units = _ORIG_BLOCK_UNITS
        else:
            a, b = status(rec), status(reread(rec, inside))
        if a is None:
            continue
        college = f.split('/')[2]
        moves[(a, b)] += 1
        colleges[(a, b)].add(college)
        if a != b and len(ex[(a, b)]) < 6:
            ex[(a, b)].append('%s/%s' % (college, d.get('control_number')))
    for k, v in sorted(moves.items()):
        print('%-11s -> %-11s %4d records, %3d colleges  %s' % (k[0], k[1], v, len(colleges[k]), ' '.join(ex.get(k, []))))


if __name__ == '__main__':
    main()
