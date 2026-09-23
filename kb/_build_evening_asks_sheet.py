#!/usr/bin/env python3
"""The two calls left for Sam after Scenario 1 was published (2026-09-23 evening, S284 SkyWage).

  1. The six transcription strategies Career attainment picked up when Sam
     deleted Completion with Transcription in Scenario 1 (the Delete panel's
     "add its strategies" box was checked). Completion now measures transcribed
     CPL with the Counselor step checked, which is the work those six describe.
  2. The Max award column, still unruled: item 4 on the Scenario 3 sheet and
     item 2 on the grants sheet, both after the last item he reviewed.

⚠️ ITS OWN SHEET, WITH ITS OWN STORE, for the reason the grants sheet gives: the
standing open-asks sheet's store is keyed to the 21 cards Sam answered
(docs/reference/decision_sheets.md).

Figures read from the live config saved 2026-09-23 19:44:46 UTC and measured
through the model the same evening. Re-measure at execution.

Run: python3 kb/_build_evening_asks_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-23-evening-asks.html')
SHEET_ID = '2026-09-23-evening-asks'
CH_LATER = ('Later', 'later')


def items():
    I = []

    I.append({
        'lane': 'implementation-funding',
        'title': 'Move the six transcription strategies from Career attainment to Completion',
        'ref': 'published Scenario 1 · your Delete of Completion with Transcription, 19:44 UTC · lanes/implementation-funding',
        'facts': (
            "When you deleted Completion with Transcription in Scenario 1, the box that adds its "
            "recommended strategies to the priority taking its share was checked, so Career attainment "
            "now lists all six: batch upload of transcribed CPL since 2023; AP, IB, CLEP and other credit "
            "waived but never transcribed; the Transcribe step in MAP; matching SIS records to MAP; "
            "support for Admissions and Records and the Veterans Resource Center; and screening "
            "near-completers. Before the move Career attainment listed none. The public explainer and the "
            "college briefing show each priority's strategies under it. Completion now measures "
            "<strong>transcribed CPL with the Counselor step checked</strong>, and its own seven "
            "strategies cover the landing page, the Counselor step, education plans and JSTs."),
        'why': (
            "Career attainment is measured by the Chancellor's Office from EDD wage records, so a college "
            "reading its card learns what to do from the strategies listed there. The six describe "
            "transcription, which is the work Completion's measure counts."),
        'rec': (
            "<strong>Move them to Completion</strong>: add the six to Completion's recommended strategies "
            "and remove them from Career attainment, both in the tab. <em>It might be wrong if</em> you "
            "want Career attainment to carry them, since the career measure also counts only the CPL a "
            "college has recorded."),
        'chips': [('Move to Completion', 'move'), ('Keep on Career attainment', 'keep'),
                  ('Clear them', 'clear'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Keep the Max award column beside the CR/NC pair',
        'ref': 'the institution table · your ruling R6/R7 of 2026-08-31 · Scenario 3 sheet item 4 and grants sheet item 2, not reached',
        'facts': (
            "Every institution at the $150,000 base receives exactly $150,000. The table used to show only "
            "the credit and noncredit shares, so Clovis read <strong>$149,321 (at base)</strong> in CR award "
            "and <strong>$679</strong> in NC award, which is how the base came to read as about $149,000. "
            "Pull request 1664 added a <strong>Max award</strong> column ahead of the pair: it prints the "
            "combined figure the base and the cap bind, with <em>(at base)</em> or <em>(at cap)</em> beside "
            "it and the one qualifying line under it. On 2026-08-31 you retired a combined column when the "
            "table went to one row per institution (R6/R7), because the pair's sum is the award. This item "
            "came after the last one you reviewed on two sheets today, so the column stands as shipped."),
        'why': (
            "A college reading its row sees the figure the base promises without adding two cells, and the "
            "confirm-participation line reads once instead of twice."),
        'rec': (
            "<strong>Keep the Max award column.</strong> <em>It might be wrong if</em> you want colleges to "
            "read the credit and noncredit subtotals as the award itself; then the column comes out and the "
            "bound word moves back to the pair."),
        'chips': [('Keep the Max award column', 'keep'), ('Back to the pair only', 'pair'), CH_LATER],
    })

    return I


def build():
    I = items()
    framing = (
        "Two calls left after you published Scenario 1. Its shares add up to 100% and the 115 maximum "
        "awards total the $24,757,639 allocation. Neither item moves an award. Career attainment's "
        "factor of 0.5 is your standing ruling and needs no call here.")
    counts = f"{len(I)} items · Implementation Funding"
    out = m.build_sheet(
        "Strategies and Max Award", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
