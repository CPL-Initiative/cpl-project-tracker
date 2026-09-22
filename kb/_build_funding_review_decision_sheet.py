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

Items 1-3 are the first; item 4 is the second.

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
        'title': 'How the career-attainment measure enters the model',
        'ref': 'goal (C) · Ed. Code §78093.2(d)(1)(C) · docs/reference/lanes/implementation-funding.md',
        'facts': (
            "Goal (C) is funded today through the statewide project allocation, split with (D), and its "
            "card reads <em>&ldquo;Awaiting a campus measure. This outcome reports through its designated "
            "activities.&rdquo;</em> Your note of 2026-09-22 gives it a measure of a different kind: CO "
            "research measures career attainment from EDD wage data, colleges report nothing, and the "
            "model takes the figure through periodic imports. The model reads a measure it has not yet "
            "received as <strong>$0</strong> (<code>srcDelivered()</code>), so a funded priority pinned to "
            "the wage measure before its first import would strand its share."),
        'why': (
            "Two questions turn on the same fact: when the first import lands. Showing the measure on "
            "the (C) card needs one import. Moving funding onto it needs an import that covers the "
            "window's awards, and wage records arrive quarters after the awards they follow."),
        'rec': (
            "<strong>Show it first, fund it after an import.</strong> From the first import the (C) card "
            "reads the wage measure as a reported outcome, dated by that import. A share of institution "
            "funding moves onto it by a separate ruling once an import has landed and CO research has "
            "stated the lag. <em>It might be wrong if</em> the CO intends (C) funding to follow the wage "
            "measure from Year 1, in which case the first import has to land before the Year-1 "
            "disbursement."),
        'chips': [('Show first, fund after an import', 'show'),
                  ('Fund from the first import', 'fund'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Which wage outcome, and whose definition',
        'ref': 'goal (C) · the measure registry in cpl_funding.js',
        'facts': (
            "CO research already reports wage outcomes for community college students from EDD "
            "unemployment-insurance wage records, among them employment in the second fiscal quarter "
            "after exit, median annual earnings, and attainment of the regional living wage. The model "
            "measures either units of CPL, converted to FTES, or students. A wage outcome is a count of "
            "students."),
        'why': (
            "The definition decides what a college's figure means and whether it matches the figure CO "
            "research publishes elsewhere. One definition, applied the same way in both places, lets the "
            "leadership review read the model's (C) figure against numbers it already knows."),
        'rec': (
            "<strong>CO research defines it, applied to students awarded CPL.</strong> The import carries "
            "one count of students per college, with counts under 10 masked by CO research before the "
            "figure reaches the model, per the funding-counts ADR. <em>It might be wrong if</em> you want "
            "the model to name its outcome now, so the leadership review sees a specific measure rather "
            "than a pending one."),
        'chips': [('CO research defines it', 'co'), ('Employment after the award', 'employ'),
                  ('Living-wage attainment', 'living'), CH_LATER],
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Does Priority 2 keep serving goal (C)',
        'ref': 'prioGoals() · your ruling of 2026-09-01',
        'facts': (
            "Priority 2 (Awards) measures applied CPL units for students with the Counselor step checked, "
            "and <code>prioGoals()</code> resolves it to (B) and (C): your 2026-09-01 ruling that the "
            "advising step is the part of career attainment a campus controls. The wage measure would give "
            "(C) a second measure, one the CO takes."),
        'why': (
            "With a CO measure in place, (C) can rest on the wage data alone and Priority 2 return to (B), "
            "or (C) can carry both the campus step and the CO outcome."),
        'rec': (
            "<strong>Keep Priority 2 on (B) and (C).</strong> The counselor step stays the campus lever "
            "toward career attainment, and the wage measure reports the outcome that lever serves. "
            "<em>It might be wrong if</em> the leadership review reads one goal carrying two measures as "
            "the same figure claimed twice, in which case Priority 2 returns to (B) when the first import "
            "lands."),
        'chips': [('Keep (B) and (C)', 'keep'), ('Move Priority 2 to (B) only', 'b'), CH_LATER],
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
            "the line above the priority table states the reserve a third time."),
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
        "Four decisions from today's funding review. Items 1 to 3 concern the career-attainment measure "
        "you described this afternoon, and item 4 is the drill-in you circled. The leadership-review "
        "edits themselves are in pull request 1660. Nothing on this sheet has been acted on.")
    counts = f"{len(I)} items · one lane (Implementation Funding)"
    out = m.build_sheet(
        "Funding Review Decisions", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
