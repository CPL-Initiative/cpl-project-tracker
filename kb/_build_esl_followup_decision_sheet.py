#!/usr/bin/env python3
"""Two ESL asks the merging sheet's verdicts left open, as their own small sheet (2026-09-26, S294).

Sam completed the ESL merging procedure sheet on 2026-09-26, all nine items as proposed
(https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS). Placing the new identities under those
verdicts (kb/_esl_new_identities_dryrun.py) held three of the 92 back, and two questions
remain that no verdict answers:

  1. ESOL M9309, a noncredit supplemental composition course, arrived after the fold. The
     placement rule holds transfer composition apart; item 4 folded the one noncredit
     composition course it named (M9192) into Advanced, since noncredit carries no
     transferable credit, and named the co-requisite case as where that might be wrong.
     M9309 is that case.
  2. ESOL M9267 and M9272, Optical Technician 1 and 2, sit in ESL while their member courses
     are HLTH 614/615 (San Diego College of Continuing Education) and NC 311/312
     (Southwestern College). Item 9 pulled a film course out of Enrichment ESL on the same
     grounds.

New asks ride their own sheet: the merging sheet's `replies` store is keyed to its nine
positions (docs/reference/decision_sheets.md), so it is never republished with more cards.

Published: https://claude.ai/artifact/PaozKqfruMT3hZ93vcg5gr (capabilities db + comments; its `replies`
store is keyed to these two positions). Answered 2026-09-27 00:02 UTC, both Sam's own calls: 1 keep,
2 vesl. The one write is kb/esl_sheet_out/2026-09-27/apply.sql.

Run: python3 kb/_build_esl_followup_decision_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-26-esl-followup.html')
SHEET_ID = '2026-09-26-esl-followup'
CH_LATER = ('Later', 'later')


def items():
    I = []
    I.append({
        'lane': 'esl-packaging',
        'title': 'A noncredit composition course reads as transfer composition',
        'ref': 'held · ESOL M9309 · Orange Coast College ESL A043N and A044N · kb/esl_sheet_out/2026-09-26/new_identities.json',
        'rows': 1,
        'facts': (
            "<em>ESL Supplemental Freshman Composition: Paragraphs</em> (ESOL M9309) holds two noncredit "
            "courses at Orange Coast College, ESL A043N (<em>Paragraphs</em>) and ESL A044N "
            "(<em>Essays</em>). It reached ESL after the fold, and the placement rule holds transfer "
            "composition apart, so the fold left it out. Your verdict on item 4 of the merging sheet "
            "folded the one noncredit composition course it named, <em>Composition for ESL Students</em> "
            "(ESOL M9192), into Advanced ESL, and named a co-requisite course as the case where that "
            "might be wrong. These two courses support students taking freshman composition."),
        'why': (
            "Held apart, it appears under no level group, so a counselor looking under Advanced does not "
            "find it. Kept beside transfer composition, it stays with the course it supports."),
        'rec': (
            "<strong>Fold it into Advanced ESL, as item 4 did for the noncredit composition "
            "course.</strong> <em>It might be wrong if</em> you want co-requisite support kept beside the "
            "transfer course it serves."),
        'chips': [('Fold into Advanced', 'fold'), ('Keep beside transfer composition', 'keep'), CH_LATER],
    })
    I.append({
        'lane': 'esl-packaging',
        'title': 'Two optical technician courses sit in ESL',
        'ref': 'held · ESOL M9267 and M9272 · HLTH 614/615 and NC 311/312 · kb/esl_sheet_out/2026-09-26/new_identities.json',
        'rows': 2,
        'facts': (
            "<em>Optical Technician 1</em> (ESOL M9267) and <em>Optical Technician 2</em> (ESOL M9272) "
            "each hold two noncredit courses: HLTH 614 and 615 at San Diego College of Continuing "
            "Education, and NC 311 and 312 at Southwestern College. Nothing in their titles names English "
            "instruction, and the subject map places HLTH in Health. The fold held both out because a "
            "member course's subject maps outside ESL, the same grounds on which item 9 pulled the film "
            "course out of Enrichment ESL."),
        'why': (
            "Folded into an ESL comprehensive, a student's optical technician coursework would read as "
            "English as a second language."),
        'rec': (
            "<strong>Move both out of ESL to Health, the discipline of their HLTH member "
            "courses.</strong> <em>It might be wrong if</em> the colleges teach them as vocational ESL for "
            "optical technicians, which would place them in Vocational ESL."),
        'chips': [('Move to Health', 'health'), ('Fold into Vocational ESL', 'vesl'), CH_LATER],
    })
    return I


def build():
    I = items()
    framing = (
        "Your verdicts on the ESL merging sheet left two small questions. Placing the 92 new ESL "
        "identities under those verdicts held three back, and no verdict answers where they belong. "
        "Each card arrives with my recommendation selected; change only what you want adjusted. "
        "Nothing on this sheet has been written, and your ESL paste does not touch these three.")
    counts = f"{len(I)} items · 3 identities held from the fold"
    out = m.build_sheet(
        "ESL Held Courses", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
