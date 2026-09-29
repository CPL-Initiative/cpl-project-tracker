#!/usr/bin/env python3
"""Scenario 3's open decisions, as one numbered sheet (2026-09-23, S284 SkyWage).

Sam built Scenario 3 to match the statute's four outcomes: delete the second
completion priority, number Career attainment P3 and the (D) card P4
"Innovation Projects". The session shipped the controls (Add/Delete, one
numbering, the rows toggle, the published scenario). Three judgments remain
that only he can make:

  1. Priority 2's wording names "Transcribed CPL units (FTES) for students with
     Counselor step checked" while its measure counts transcribed CPL alone;
     the Metric wiring flags the mismatch, and no measure cuts both yet.
  2. His mid-session ruling, verbatim: "I want to put the 33% into Career
     Attainment". Career attainment has no data until CO research's first EDD
     import, and the public page shows whichever scenario is published.
  3. His question, verbatim: "the allocations for NC seem too low--can you have
     a closer look at that?" and "What do you think about setting a base/cap
     for those that is proportional to each college's NC FTES % of total FTES.
     And the NC base could be deducted from the CR base--so the base would
     still sit at 150K...Advise if I'm nuts."

⚠️ ITS OWN SHEET, WITH ITS OWN STORE. The standing open-asks sheet's `replies`
store is keyed to the 21 cards Sam answered and its builder now emits 15, so
cards added there would inherit his saved replies at the wrong positions
(docs/reference/decision_sheets.md). A fresh SHEET_ID starts an empty store.

Every figure below was measured on the live Scenario 3 dials with the tab's own
engine (scripts/funding_effective.js's boot path), 2026-09-23. Re-measure at
execution: the daily feed moves the Current Totals.

Run: python3 kb/_build_funding_scenario3_decision_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-23-funding-scenario-3.html')
SHEET_ID = '2026-09-23-funding-scenario-3'
CH_LATER = ('Later', 'later')


def items():
    I = []

    I.append({
        'lane': 'implementation-funding',
        'title': 'Priority 2: transcribed CPL with the Counselor step checked',
        'ref': 'Scenario 3 · Priority 2 "Completion" · the Metric wiring panel',
        'facts': (
            "Priority 2's metric reads <em>Transcribed CPL units (FTES) for students with Counselor step "
            "checked</em>, and its measure is <strong>Transcribed CPL</strong>, which counts every "
            "transcribed unit whether or not the Counselor step was checked. The Metric wiring panel "
            "flags the gap. The model has no measure that cuts both: <strong>Applied CPL with the "
            "Counselor step checked</strong> covers the counselor step on applied credit, and "
            "<strong>Transcribed CPL</strong> covers transcription without it. The daily MAP feed "
            "carries both facts on every student row (<code>Counselor_Verified</code> and "
            "<code>Transcribed Credits</code>), so the builder can cut transcribed units for students "
            "whose Counselor step is checked, the same way it cuts the applied ones."),
        'why': (
            "The measure decides what every college's Current Total on this priority counts. Your "
            "wording asks for the counselor attestation and the transcription together, which keeps "
            "completion anchored on the transcript and still asks the college to stand behind the "
            "advising step."),
        'rec': (
            "<strong>Build the measure your wording names</strong>: transcribed CPL for students with "
            "the Counselor step checked, in FTES, serving (B). It reaches the tab on the next daily run "
            "after the change, and the card's picker offers it by name. <em>It might be wrong if</em> "
            "the combined figure turns out much smaller than transcribed CPL alone, since the Counselor "
            "step is checked on fewer records; the first daily run measures it, and you can switch the "
            "picker back in one click."),
        'chips': [('Build the combined measure', 'build'),
                  ('Keep transcribed CPL and reword', 'transcribed'),
                  ('Use applied CPL with the Counselor step', 'applied'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'When Scenario 3 is published, with 33% on Career attainment',
        'ref': 'Scenario 3 · Priority 3 Career attainment · the Publish control on the scenario strip',
        'facts': (
            "You ruled today: <em>&ldquo;I want to put the 33% into Career Attainment.&rdquo;</em> The "
            "Delete panel does it: delete Completion with Transcription and move its 33% share to "
            "Career attainment. Career attainment is measured from CO research's EDD import, and the "
            "first file has not arrived, so the model counts that 33% as <strong>$0</strong> toward "
            "every institution's Current Total until it does. Measured on Scenario 3: the statewide "
            "Current Total is <strong>$2,613,990</strong> today, <strong>$2,082,547</strong> with the "
            "33% moved into Completion, and <strong>$1,354,241</strong> with it moved into Career "
            "attainment, of $25,240,308. The public page and the college briefing read the "
            "<strong>published</strong> scenario, which stays Scenario 1 until you press Publish on "
            "Scenario 3."),
        'why': (
            "A third of each institution's max award would read as funding it cannot yet qualify for. "
            "Your rule from 2026-08-31 applies: <em>&ldquo;I would never publish anything unless we "
            "could measure it with our data.&rdquo;</em> This morning's ruling also paired the share "
            "with a funding factor of 0.5, and Career attainment's factor is still 1.0."),
        'rec': (
            "<strong>Set it up in Scenario 3 now and keep Scenario 1 published until the first EDD "
            "import lands.</strong> Set Career attainment's factor to 0.5 when you move the share. "
            "<em>It might be wrong if</em> the leadership review needs to see the final shape on the "
            "public page before the import, in which case publish and let the page show the (C) "
            "funding as awaiting measurement."),
        'chips': [('Hold Scenario 1 until the import', 'hold'),
                  ('Publish Scenario 3 when ready', 'publish'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'The noncredit share: keep parity, or weight noncredit FTES',
        'ref': 'the one-pool model (adopted 2026-08-31) · the NC award column',
        'facts': (
            "Your base-and-cap idea is how the model already works: each institution's noncredit base is "
            "$150,000 times its noncredit share of its own FTES, taken out of the credit base, and the "
            "cap splits the same way. Run against the live model it reproduces every award to the "
            "dollar. Noncredit is <strong>7.12%</strong> of statewide FTES and receives "
            "<strong>7.07%</strong> of the funding, <strong>$1,783,399</strong>: about $21.75 per "
            "noncredit FTES against $21.94 per credit FTES. The shortfall sits at the two largest "
            "noncredit programs on credit campuses, where the $400,000 cap on the combined award binds: "
            "Mt. SAC's noncredit share is $115,102 (its proportion alone would give $237,441) and Santa "
            "Ana's is $131,052 ($171,409). Counting each noncredit FTES as 1.25 raises the noncredit "
            "total to $2,106,330; 1.5 gives $2,415,289; the base and cap stay as they are. Letting the "
            "cap bind the credit share alone gives $1,880,823 and puts six institutions over $400,000."),
        'why': (
            "Every noncredit share qualifies only through the noncredit origination measures, which "
            "wait on MAP's origination feed, and the Chancellor's Office pull of all reported FTES "
            "lands before the model is final. A weight set now raises funding that no institution "
            "can qualify for until the feed arrives."),
        'rec': (
            "<strong>Keep parity until the origination feed and the FTES pull land</strong>, then "
            "revisit with measured origination. <em>It might be wrong if</em> the CO wants the "
            "allocation itself to signal a priority on noncredit CPL, in which case a noncredit weight "
            "dial (default 1.0) lets you try 1.25 in Scenario 3 before anything is published."),
        'chips': [('Keep parity for now', 'parity'),
                  ('Build the weight dial', 'dial'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Keep the Max award column beside the CR/NC pair',
        'ref': 'the institution table · your ruling R6/R7 of 2026-08-31 · your base report of 2026-09-23',
        'facts': (
            "You reported that colleges at the $150,000 base read about $149,000. Every one of the 51 "
            "institutions at the base receives exactly $150,000; the table showed only its two shares, "
            "so Clovis read <strong>$149,321 (at base)</strong> in CR award and <strong>$679</strong> "
            "in NC award. The pull request adds a <strong>Max award</strong> column ahead of the pair: "
            "it prints the combined figure the base and the cap bind, with <em>(at base)</em> or "
            "<em>(at cap)</em> beside it and the one qualifying line under it, and the pair cells show "
            "their figures. On 2026-08-31 you retired a combined column when the table went to one row "
            "per institution (R6/R7), because the pair's sum is the award."),
        'why': (
            "A college reading its row sees the figure the base promises without adding two cells, and "
            "the confirm-participation line reads once instead of twice. The table also fits a "
            "1280-pixel screen again: the pair cells had carried the long qualifying line."),
        'rec': (
            "<strong>Keep the Max award column.</strong> <em>It might be wrong if</em> you want colleges "
            "to read the credit and noncredit subtotals as the award itself, in which case the column "
            "comes out and the bound word moves back to the pair."),
        'chips': [('Keep the Max award column', 'keep'),
                  ('Back to the pair only', 'pair'), CH_LATER],
    })

    return I


def build():
    I = items()
    framing = (
        "Four decisions from the Scenario 3 build. The controls you asked for are live in the pull "
        "request: Add and Delete, one numbering for every card, the college-rows toggle, the editable "
        "Measured-from list, and a Publish control that says which scenario the public page reads. "
        "Nothing on this sheet has been acted on.")
    counts = f"{len(I)} items · one lane (Implementation Funding)"
    out = m.build_sheet(
        "Scenario 3 Decisions", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
