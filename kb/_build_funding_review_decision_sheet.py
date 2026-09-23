#!/usr/bin/env python3
"""The funding review's open decisions, as one numbered sheet (2026-09-22, S283).

Sam, during the Implementation Funding tab's last edits before the CO leadership
review, said two things that are his to rule on rather than a session's to
execute:

    "On Career Attainment, I had been thinking we wouldn't be able to measure
    it, but after speaking with CO research team, we can use EDD wage data to
    measure this. Recommend how we should revise this (yes, more than a content
    tweak:). This would not be reported by the colleges but instead measured by
    the CO and reflected on our funding model with periodic updates (imports)
    of the data."

    "Thinking we should be able to eliminate or really simplify and
    consolidate the circled items in the college table. Advise"

Items 1-2 are the first; item 3 is the second. REBUILT 2026-09-23 with three
cards on an EMPTY replies store (checked first): Sam's chat asks settled the old
item 3 ("Change P2 B&C Completion to B Completion with Counseling") and #1662
added Priority 4, so items 1-2 were rewritten around it. Renumbering is safe
only because nothing was stored against the old positions.

⚠️ WHY THIS IS ITS OWN SHEET AND NOT CARDS ON THE STANDING ONE. The standing
open-asks sheet (kb/_build_open_asks_decision_sheet.py) is published as its
21-item version, and its live `replies` store is keyed to those 21 positions.
Its builder has since dropped to 15 cards, so a rebuild republished today would
put Sam's saved replies on the wrong cards. That sheet's own coverage audit
names this lane in NO_OPEN_ASK with the reason, so the backlog still has one
index.

Run: python3 kb/_build_funding_review_decision_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-22-funding-review.html')
SHEET_ID = '2026-09-22-funding-review'
CH_LATER = ('Later', 'later')


def items():
    I = []

    I.append({
        'lane': 'implementation-funding',
        'title': 'When Priority 4 takes a share, and at what factor',
        'ref': 'Priority 4 · goal (C) · Ed. Code §78093.2(d)(1)(C) · pull request 1662',
        'facts': (
            "Priority 4, career attainment, is on the tab with every control the other three carry. It "
            "holds a <strong>0% share</strong> and a funding factor of <strong>1.0</strong>; the other three "
            "run at 33 / 33 / 34 and <strong>0.5</strong>. Its measure is the CPL units, in FTES, of students "
            "who reach a career outcome in EDD wage records, which CO research measures and the model "
            "imports. The model reads a measure it has not yet received as <strong>$0</strong> "
            "(<code>srcDelivered()</code>), so a share set before the first import sits at $0 until it lands."),
        'why': (
            "A share moves funding off the other three priorities, and the factor sets how many FTES its "
            "target asks for. At 1.0 beside 0.5, Priority 4's target is half the size the others' factor "
            "would give the same share."),
        'rec': (
            "<strong>Hold at 0% until the first import lands, then set the share and a factor of 0.5 "
            "together.</strong> The card shows the measure from the first import, and the share follows "
            "once CO research has stated the lag between an award and its wage record. <em>It might be "
            "wrong if</em> the CO intends (C) funding to follow the wage measure from Year 1, in which case "
            "the first import has to land before the Year-1 disbursement."),
        'chips': [('Hold at 0% until the first import', 'hold'),
                  ('Set a share now', 'now'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Which wage outcome, and whose definition',
        'ref': 'goal (C) · ca_u in the measure registry (cpl_funding.js)',
        'facts': (
            "CO research already reports wage outcomes for community college students from EDD "
            "unemployment-insurance wage records, among them employment in the second fiscal quarter "
            "after exit, median annual earnings, and attainment of the regional living wage. Priority 4 "
            "counts the CPL units of the students who reach the outcome, in FTES like the other three, "
            "because you ruled that headcount is not a metric in this tab. The outcome decides which "
            "students count."),
        'why': (
            "The definition decides what a college's figure means and whether it matches the figure CO "
            "research publishes elsewhere. One definition, applied the same way in both places, lets the "
            "leadership review read the model's (C) figure against numbers it already knows."),
        'rec': (
            "<strong>CO research defines the outcome.</strong> The import carries, per college, the CPL "
            "units of students awarded CPL who reach it, with student counts under 10 masked by CO "
            "research before the figure reaches the model, per the funding-counts ADR. <em>It might be "
            "wrong if</em> you want the model to name its outcome now, so the leadership review sees a "
            "specific measure rather than a pending one."),
        'chips': [('CO research defines it', 'co'), ('Employment after the award', 'employ'),
                  ('Living-wage attainment', 'living'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Consolidate the institution drill-in',
        'ref': 'the college table expand · your screenshot of 2026-09-22 (Alameda)',
        'facts': (
            "Each institution's expand opens on three prose cells before its priority table: the FTES "
            "share (<em>3,155 FTES = 0.274% of the statewide 1,151,171</em>), the base explanation "
            "(<em>a pure proportional share would be $69,175 &hellip; brought up to the $150,000 base "
            "award</em>), and a baseline paragraph that restates the reserve and ends on a Mark opted-in "
            "button. Below them a second Confirm Participation control repeats the one on the row, and "
            "the line above the priority table states the reserve a third time. The priority table now "
            "carries a fourth row, Career attainment, at 0%."),
        'why': (
            "The row already carries the FTES, the <em>(at base)</em> word with its hover, and the Elig "
            "pie, and the Summary and the Baseline section state the reserve rule. The expand's work is "
            "this institution's priority figures."),
        'rec': (
            "<strong>One status line, then the priority table.</strong> The line reads, for Alameda: "
            "<em>Baseline: coordinator on file &middot; local confirmation due 2026-11-01 &middot; Veteran "
            "Star not yet &middot; $1,225 reserved until confirmation</em>, with the CO's Mark confirmed "
            "control on it. The FTES share moves into the CR FTES hover; the base cell and the second "
            "Confirm Participation control go; the line above the table keeps Current Total and Total "
            "Possible. <em>It might be wrong if</em> colleges use the FTES-share sentence to check their "
            "own figure, in which case it stays as a short line under the status."),
        'chips': [('Consolidate as proposed', 'consolidate'), ('Keep the FTES share line', 'keepftes'),
                  CH_LATER],
    })

    return I


def build():
    I = items()
    framing = (
        "Three decisions from the funding review. Items 1 and 2 concern career attainment, which "
        "Priority 4 now carries at a 0% share (pull request 1662), and item 3 is the drill-in you "
        "circled. Your chat ruling of 2026-09-22 settled the question of Priority 2: it serves (B) alone. "
        "Nothing on this sheet has been acted on.")
    counts = f"{len(I)} items · one lane (Implementation Funding)"
    out = m.build_sheet(
        "Funding Review Decisions", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
