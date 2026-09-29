#!/usr/bin/env python3
"""Two open decisions after #1664 and #1665, as one numbered sheet (2026-09-23, S284 SkyWage).

  1. The live apply of the five nightly rebuild functions with explicit grants.
     Supabase's notice (forwarded by Sam 2026-09-23): from 2026-10-30 a NEW table
     in public gets no Data API grant, and these five functions create their table
     afresh every night. The repo carries the grants (#1665); the live database
     does not until the functions are re-created, a DDL write that is his call.
  2. The Max award column, carried from the Scenario 3 sheet, where it was item 4
     and not reached (his replies ran through item 3). It shipped in #1664.

⚠️ ITS OWN SHEET, WITH ITS OWN STORE, for the reason the Scenario 3 sheet gives:
the standing open-asks sheet's store is keyed to the 21 cards Sam answered
(docs/reference/decision_sheets.md).

Figures measured 2026-09-23 against the live database and the published
artifacts. Re-measure at execution.

Run: python3 kb/_build_grants_decision_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-23-grants-and-max-award.html')
SHEET_ID = '2026-09-23-grants-and-max-award'
CH_LATER = ('Later', 'later')


def items():
    I = []

    I.append({
        'lane': 'map-custom-reports',
        'title': 'Apply the table grants to the five nightly rebuilds on the live database',
        'ref': 'Supabase notice of 2026-09-23 · pull request 1665 · lanes/map-custom-reports',
        'facts': (
            "From <strong>October 30</strong>, Supabase stops granting the Data API roles on a "
            "<em>new</em> table in the public schema; existing tables keep their grants. A read of the "
            "live database today found every table holding its grants. Five functions, though, drop "
            "and re-create their table inside every nightly promotion of the MAP custom reports: "
            "College Goal 2, the credit summary, the clean-up worklist, the transcribed-gap detail and "
            "the Credit by Exam guidance. Each rebuild is a new table, so the first promotion after "
            "October 30 would leave all five unreadable: the clean-up views in COBI and the college "
            "briefing's daily publish read them. Pull request 1665 adds the grants to the five "
            "functions in the repository, and a check now fails any table the SQL creates without "
            "them. The live copies change only when the five functions are re-created on the "
            "database. The repository's copies match live apart from a dash in two lines of text "
            "shown to colleges."),
        'why': (
            "Re-creating a function on the live database is a schema change to shared ground, and "
            "the session's tools ask you before making one. The change touches only these five "
            "functions; each keeps its policy, and the grants repeat what the default grants give "
            "the tables today."),
        'rec': (
            "<strong>Apply now</strong>, five <code>create or replace function</code> statements and "
            "nothing else, then confirm after tonight's promotion that the API roles can still read "
            "all five tables. <em>It might be wrong if</em> you would rather apply it closer to "
            "October 30 alongside other schema work; the repository is ready either way."),
        'chips': [('Apply now', 'apply'), ('Apply closer to Oct 30', 'hold'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Keep the Max award column beside the CR/NC pair',
        'ref': 'the institution table · your ruling R6/R7 of 2026-08-31 · Scenario 3 sheet item 4, not reached',
        'facts': (
            "You reported that colleges at the $150,000 base read about $149,000. Every one of the 51 "
            "institutions at the base receives exactly $150,000; the table showed only its two shares, "
            "so Clovis read <strong>$149,321 (at base)</strong> in CR award and <strong>$679</strong> "
            "in NC award. Pull request 1664, now live, added a <strong>Max award</strong> column ahead "
            "of the pair: it prints the combined figure the base and the cap bind, with <em>(at "
            "base)</em> or <em>(at cap)</em> beside it and the one qualifying line under it. On "
            "2026-08-31 you retired a combined column when the table went to one row per institution "
            "(R6/R7), because the pair's sum is the award. This was item 4 on the Scenario 3 sheet, "
            "after the last item you reviewed there."),
        'why': (
            "A college reading its row sees the figure the base promises without adding two cells, "
            "and the confirm-participation line reads once instead of twice."),
        'rec': (
            "<strong>Keep the Max award column.</strong> <em>It might be wrong if</em> you want "
            "colleges to read the credit and noncredit subtotals as the award itself, in which case "
            "the column comes out and the bound word moves back to the pair."),
        'chips': [('Keep the Max award column', 'keep'),
                  ('Back to the pair only', 'pair'), CH_LATER],
    })

    return I


def build():
    I = items()
    framing = (
        "Two decisions after today's funding and Supabase work. Pull request 1664 is live and the "
        "daily run has published the Counselor-step measure; pull request 1665 carries the table "
        "grants in the repository. Nothing on this sheet has been acted on.")
    counts = f"{len(I)} items · MAP custom reports and Implementation Funding"
    out = m.build_sheet(
        "Grants and Max Award", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
