#!/usr/bin/env python3
"""My CPL Funding language mockup, round 1 (S310, 2026-10-01).

Sam: "See screenshot for My CPL Funding view and make a mockup with revised
language that follows the norms and examples in our rules and memory. Show me
in the mockup your revisions before we make any changes to prod."

Reads a capture from capture_mycpl.mjs (the Public view's My CPL Funding block
as COBI's own code draws it) and writes one page: the Revised view and the
Today view of the same institution, each change numbered where it sits, and a
card per change carrying today's words, the revision (editable in place, saved
to the artifact's `edits` collection), the reason, how the proposal could be
wrong, and the decision-sheet reply chips (saved to `replies`).

    python3 assemble_mycpl.py <capture.json> <out.html> [stamp]
"""
import html
import json
import re
import sys

sys.path.insert(0, "/home/user/cpl-project-tracker/kb")
import _decision_sheet_replies as m  # noqa: E402

E = html.escape
SHEET_ID = "2026-10-01-my-cpl-funding-language"
CHIPS = [("Use the revision", "revise"), ("Keep today's", "keep"), ("Later", "later")]

cap_path, out_path = sys.argv[1], sys.argv[2]
stamp = sys.argv[3] if len(sys.argv) > 3 else ""
cap = json.load(open(cap_path, encoding="utf-8"))
base = cap["html"]

# ── the changes ──────────────────────────────────────────────────────────────
# Each part: ref, label, `old` (the exact markup the capture carries), `rev`
# (the revised words, plain text). `view` False keeps a part out of the drawn
# block (the PDF lines and the other states, which the block does not show
# for Coastline).
C = []


def change(n, title, why, wrong, parts):
    C.append({"n": n, "title": title, "why": why, "wrong": wrong, "parts": parts})


INTRO_OLD = ("The Dashboard lists the potential funding and FTES for each institution. Total Funds is its "
             "<strong>max award</strong>: maximum funding to be awarded based on measurable outcomes and allocated "
             "as credit and noncredit subtotals, shown as Max CR Funds and Max NC Funds. The Curr (current) columns "
             "show the funding qualifying so far. The numbered pie before each name shows which of the three minimum "
             "conditions the institution meets, and a star marks the third, the Veteran Star. Click an institution to "
             "see its conditions and each priority's maximum and actual FTES and funding.")

change(1, "Introduction, when My CPL Funding is chosen",
       "The paragraph above the chooser describes the institution table: Total Funds, the Curr columns, the pie, "
       "and clicking a row. None of those appear in this view. Under All institutions your Sept. 28 text stays "
       "as it is.",
       "you would rather this view carry no introduction, since the chooser already tells the reader what to do.",
       [dict(ref="1.1", label="Introduction", old=INTRO_OLD,
             rev="My CPL Funding shows one institution's seed grant and implementation funding, with the outcomes "
                 "MAP tracks for each. Choose an institution, or choose a district to see each of its institutions.")])

change(2, "Seed grant: the tag and the opening",
       "Each sentence names its actor: the college received the grant and expends it, its chief instructional "
       "officer certified the commitment, and MAP tracks progress. The certification wording is ESS 25-82's own. "
       "Calling the marks progress on a commitment says what they are, so the compliance sentence drops (your "
       "Sept. 16 and 22 rulings). The tag gives the date to the sentence, and spring takes the style guide's "
       "lowercase.",
       "the Chancellor's Office wants the compliance point said outright. The paragraph would then end: The marks "
       "below report progress.",
       [dict(ref="2.1", label="Tag", old="ESS 25-82 · distributed Spring 2026", rev="ESS 25-82"),
        dict(ref="2.2", label="Opening",
             old="Received. Must be fully expended by <b>June 30, 2028</b>. It was directed at the three priority "
                 "outcomes below — progress on them is tracked through MAP, as ESS 25-82 specifies. "
                 "<b>These are not a compliance determination.</b>",
             rev="The college received this grant in spring 2026 and has until June 30, 2028, to expend it. Under "
                 "ESS 25-82, its chief instructional officer certified the college's commitment to three priority "
                 "outcomes. MAP tracks progress on each.")])

change(3, "Seed outcome 1, the veterans' JSTs",
       "JST is spelled out once, as the style guide asks of an acronym on first use. Words replace the "
       "greater-than-or-equal sign, and the Chancellor's Office replaces MIS. The line keeps the Veteran Star's 75% "
       "bar in view, since ESS 25-82 asks for every enrolled veteran. The second line says what a Student CPL Plan "
       "records, in the CPL Initiative report's own terms, with the veteran as the subject.",
       "colleges know this measure as MIS-reported veterans, and the plainer wording drops a term they use.",
       [dict(ref="3.1", label="Outcome", old="Upload a JST for every enrolled veteran",
             rev="Upload a Joint Services Transcript (JST) for every enrolled veteran"),
        dict(ref="3.2", label="Status line",
             old="Veteran Star met — ≥75% of MIS-reported enrolled veterans have a JST uploaded in MAP",
             rev="JSTs in MAP cover at least 75% of the enrolled veterans the college reports to the Chancellor's "
                 "Office, which meets the Veteran Star."),
        dict(ref="3.3", label="Second line",
             old="Every JST uploaded creates a Student CPL Plan — that is the step that puts a veteran's credit in "
                 "front of somebody.",
             rev="Each JST uploaded creates a Student CPL Plan, which documents each credit the veteran is offered, "
                 "accepts, and has transcribed.")])

change(4, "Seed outcome 2, the statewide recommendations",
       "The line says what meets the outcome and gives the number to work from. The Not yet mark already carries "
       "the state, so the line no longer repeats it in the negative.",
       "articulation officers phrase it another way; a local course articulated to a statewide recommendation is "
       "the alternative.",
       [dict(ref="4.1", label="Status line",
             old="no local articulation yet against a statewide credit recommendation",
             rev="Articulating any one of the 84 statewide credit recommendations in MAP to a local course meets "
                 "this outcome.")])

change(5, "Seed outcome 3, the eligible students",
       "Active voice, and the metaphor (\"the cheap half\") goes. The second line ties the step to the funding it "
       "counts toward: Access measures every applied CPL unit since your Sept. 30 save.",
       "you would rather keep the seed outcomes apart from the implementation funding in the reader's mind.",
       [dict(ref="5.1", label="Status line", old="980 students identified as CPL-eligible in MAP",
             rev="The college has identified 980 students in MAP as eligible for CPL."),
        dict(ref="5.2", label="Second line",
             old="Identifying a student is the cheap half; the credit still has to be applied to their record to "
                 "count.",
             rev="Next, apply each student's credit in MAP. Every applied unit also counts toward Access in the "
                 "implementation funding.")])

change(6, "Implementation funding: the tag and the opening",
       "The dashboard above defines Total Funds as the max award, in your words of Sept. 1, and cap names the "
       "$400,000 ceiling, so \"allocation cap\" gave \"cap\" two meanings on one page. The opening keeps your Aug. 22 ask "
       "for a positive statement that funding follows CPL outcomes as MAP records them, now with the model as the "
       "actor and without the bold or the aside. FTES is spelled out once. The sentence on active revision drops, "
       "since you chose Scenario 2 on Sept. 30.",
       "the model still waits on the Chancellor. A sentence would then stay: The Chancellor's Office may revise the "
       "model before it releases the guidance memo. Your word for the video on Sept. 25, \"maximum allocation,\" "
       "is the other candidate for the tag.",
       [dict(ref="6.1", label="Tag", old="allocation cap", rev="max award"),
        dict(ref="6.2", label="Opening",
             old="What this college receives is driven by <b>its own CPL results, as they happen</b>: the measures "
                 "MAP records count toward this figure. It is modeled, and the model is under active revision.",
             rev="The max award is the most the college can receive in 2026-27 and 2027-28. Each day the model "
                 "reads the college's CPL outcomes in MAP and measures them in full-time equivalent students "
                 "(FTES). The priority outcomes below count toward the award.")])

BASE_OLD = ("At the <b>$150,000 base award</b> — this institution's proportional share came out below the base, so "
            "it is brought up to it, and the base award is its allocation.")
GATE_OLD = ("<b>Participation requirements are outstanding</b> — CPL Coordinator assigned and primary CPL contact "
            "listed in MAP and the college public CPL Landing Page configured. and Local confirmation on file by "
            "2026-11-01. The cap is unchanged and the funding rolls forward; the college receives its demonstrated "
            "funding once it confirms.")

change(7, "The base award line",
       "The model is the actor, \"brought up to\" is the sector term from your vocabulary list, and the closing clause "
       "that restated the point drops (Sept. 22). It reads as a paragraph, without the bullet or the bold.",
       "readers need a sentence that ties the two together: The base award is the college's max award.",
       [dict(ref="7.1", label="Base award", old=BASE_OLD,
             rev="The college's proportional share of the funding falls below the $150,000 base award, so the model "
                 "brings it up to the base.")])

change(8, "The minimum conditions line",
       "The line uses your term, minimum conditions, and counts all three (Sept. 28), named as the dashboard's "
       "pie and drill-in name them. Today it lists two, reads \"configured. and Local,\" and says the college receives "
       "its funding once it confirms, which leaves out the coordinator. The $71,000 is the figure the College "
       "Dashboard shows in gray on Coastline's row under your Sept. 29 ruling, at the public $1,000 rounding. "
       "The last sentence is yours: funding stays with the college, and the full funding is available within the "
       "two-year window (Sept. 25 and 29).",
       "you would rather the block show no current figure until the conditions are met.",
       [dict(ref="8.1", label="Minimum conditions", old=GATE_OLD,
             rev="Funding waits on the three minimum conditions. The college meets one, veteran JSTs at 75%, and "
                 "two remain: a CPL coordinator on file in MAP, and the college's confirmation by Nov. 1, 2026. Its "
                 "outcomes so far demonstrate $71,000, which the college receives once it meets all three. The full "
                 "max award stays available within the two-year window.")])

NC_OLD = ("<b>Noncredit share: $8,611</b> of the combined award above, set by this institution's own noncredit FTES "
          "and restricted to the noncredit measures, so only noncredit results count toward it.")
change(9, "The noncredit share",
       "Active voice with the model as the actor. \"Restricted\" is the sector term from your list, so the clause "
       "after it, which said the same thing again, drops.",
       "a noncredit dean needs it said outright that only noncredit outcomes count toward this share.",
       [dict(ref="9.1", label="Noncredit share", old=NC_OLD,
             rev="Noncredit share: $8,611 of the max award. The model sets this share from the college's noncredit "
                 "FTES and restricts it to noncredit outcomes.")])

change(10, "Labels in the priority list",
       "\"Priority Outcomes\" is the tab's own name for these, and it replaces an \"it\" with no clear antecedent. The "
       "steps name who suggests them, since a college reader does not know \"the team.\" The style guide spells out "
       "one through nine.",
       "\"What counts toward it\" was chosen to carry the counts-toward vocabulary.",
       [dict(ref="10.1", label="Heading", old="What counts toward it", rev="Priority outcomes"),
        dict(ref="10.2", label="Access steps", old="8 steps the team suggests",
             rev="Eight steps the CPL Initiative suggests"),
        dict(ref="10.3", label="Completion steps", old="6 steps the team suggests",
             rev="Six steps the CPL Initiative suggests")])

change(11, "What each priority measures (tab text you type)",
       "Access has measured every applied unit since your Sept. 30 save, so the origins listed today describe "
       "the old measure. The Access wording is your example from sheet 6, card 7. Both are tab text: you type them "
       "on the tab in both scenarios, and the tab, the explainer and My College read them from there.",
       "you want each measure to name the MAP step it counts, such as Applied to CPL Plan.",
       [dict(ref="11.1", label="Access",
             old="Applied CPL Units (FTES) originating from either CPL Portal, College CPL Landing Page, or batch "
                 "upload",
             rev="Applied CPL units (FTES) in MAP"),
        dict(ref="11.2", label="Completion",
             old="Transcribed CPL units (FTES) for students  with Counselor step checked",
             rev="Transcribed CPL units (FTES) for students with the Counselor step checked in MAP")])

PROP_OLD = ("Reaching a target qualifies the college for the <b>whole</b> share, and partial progress qualifies it "
            "for a proportional part, so there is no cliff to miss.")
change(12, "How progress qualifies",
       "The metaphor and the bold go. \"Amount\" replaces \"share,\" because \"share\" already names the noncredit "
       "share and the proportional share in this box.",
       "readers know these figures as shares from the explainer.",
       [dict(ref="12.1", label="Closing sentence", old=PROP_OLD,
             rev="Progress toward each target qualifies the college for the same proportion of the amount beside "
                 "it, and reaching the target qualifies it for the full amount.")])

NEXT_OLD = ("<b>For the seed funding:</b> Adopt or adapt the statewide credit recommendations — the outcome with "
            "the most ground still to cover.")
change(13, "Do this next",
       "All funding waits on the minimum conditions, so they lead, with the date, and each step is one action. "
       "The metaphor and the bold go. Today the implementation step never appears: the "
       "code looks for the steps under a field name the briefing does not carry, and the port fixes that too.",
       "the seed outcome should lead, since that grant is already in hand.",
       [dict(ref="13.1", label="Implementation step", old=None,
             rev="For the implementation funding: name the college's CPL coordinator in MAP, and confirm the "
                 "college's participation by Nov. 1, 2026, with the Confirm button on its row under All "
                 "institutions."),
        dict(ref="13.2", label="Seed step", old=NEXT_OLD,
             rev="For the seed funding: adopt or adapt one of the 84 statewide credit recommendations in MAP.")])

FOOT_OLD = ("Both figures come from the same model as the institution table. Choose All institutions for every "
            "institution's full detail.")
change(14, "The closing note",
       "The $50,000 seed grant is a fixed ESS 25-82 grant, so both figures credited the model with one it does not "
       "compute.",
       "you want the note to point readers to the institution table by name.",
       [dict(ref="14.1", label="Closing note", old=FOOT_OLD,
             rev="The funding model computes the implementation figures above, as it does for every institution "
                 "under All institutions.")])

change(15, "The PDF's opening lines",
       "A college reading the PDF has no use for scenario names. The date takes the style guide's form, and the "
       "PDF spells out CPL and MAP once, since it stands alone. \"Every figure\" and \"reads it live\" do not hold "
       "for the seed grant or for paper.",
       "the Chancellor's Office wants the scenario named on paper for version control. The line would then read: "
       "as modeled under Scenario 2.",
       [dict(ref="15.1", label="Under the PDF's title", view=False,
             old="CPL Implementation Funding, Scenario 2, as of 2026-10-01. The funding model computes every figure; "
                 "the page reads it live.",
             rev="Credit for prior learning (CPL) funding, as of Oct. 1, 2026. The funding model computes the "
                 "implementation figures each day from the Mapping Articulated Pathways (MAP) platform.")])

OTHER = [
    ("A declined seed grant",
     "This college declined the grant pending further review. That is a decision on record, not a missed payment.",
     "The college declined this grant pending further review."),
    ("An institution at the cap",
     "At the $400,000 cap — this institution's proportional share came out above the maximum, so it is held there "
     "and the difference re-splits across the other colleges. Its performance targets scale down with it, so it "
     "qualifies for funding at the same rate as every other college above the minimum.",
     "The college's proportional share of the funding exceeds the $400,000 cap, so the model holds it at the cap and "
     "redirects the difference to the other colleges. Its targets scale to the cap, so it qualifies for funding at "
     "the same rate as every college above the base."),
    ("While the minimum conditions load",
     "Participation is recorded but not yet confirmed.",
     "The minimum conditions are still loading."),
    ("A noncredit institution's third condition",
     "Noncredit certificates posted as exhibits in MAP (replaces the veteran-JST gate for the noncredit-only "
     "campuses — N1 a)",
     "noncredit certificates posted in MAP"),
    ("The other first-condition parts",
     "CPL Coordinator assigned and primary CPL contact listed in MAP and the college public CPL Landing Page "
     "configured.",
     "a primary CPL contact on file in MAP; the college's CPL landing page configured"),
    ("A district's line (Coast CCD)",
     "3 institutions · max award $592,959 in total · current total $0. Each institution's own funding follows.",
     "Three institutions, with a combined max award of $592,959 and a current total of $0. Each institution's "
     "funding follows."),
    ("The model did not load",
     "The funding model did not load, so this page cannot show an allocation for this college yet. Reload to read "
     "it.",
     "The funding model did not load. Reload the page to see the college's funding."),
    ("No allocation",
     "No allocation modeled for this college yet.",
     "The funding model holds no allocation for this college."),
    ("My College, an institution off the roster",
     "[Institution] is not on the 115-college funding roster. The noncredit institutions are funded through the "
     "noncredit carve-out, a separate mechanism from the college allocation below, so this institution has its "
     "own route to funding.",
     "[Institution] is outside the College Implementation Funding roster."),
    ("Seed outcomes while MAP loads",
     "veteran/JST feed not loaded yet (and two lines like it)",
     "Status loading."),
    ("Veteran Star not reached",
     "below the Veteran Star bar (≥75% of enrolled veterans with a JST in MAP)",
     "The Veteran Star needs JSTs in MAP for at least 75% of the enrolled veterans the college reports to the "
     "Chancellor's Office."),
    ("No enrolled veterans on record",
     "no MIS-reported enrolled veterans to measure against (or not in the veteran feed)",
     "The Chancellor's Office records no enrolled veterans for the college."),
    ("Statewide recommendation met",
     "articulates at least one of the 84 statewide credit recommendations in MAP",
     "The college articulates at least one of the 84 statewide credit recommendations in MAP."),
    ("Eligible and transcribed students",
     "[N] students identified as CPL-eligible · [M] with transcribed CPL in MAP",
     "The college has identified [N] students in MAP as eligible for CPL, and [M] have CPL on their transcripts."),
    ("Fewer than 10 students",
     "activity present but fewer than 10 students (privacy-suppressed)",
     "MAP shows CPL activity for fewer than 10 students, and the page withholds counts under 10 to protect "
     "student privacy."),
    ("No CPL activity yet",
     "no CPL activity recorded in MAP yet",
     "Identifying an eligible student in MAP, or transcribing CPL there, meets this outcome."),
    ("My College, the statewide recommendations",
     "The By CPL type section below ranks your best candidates by how many peer colleges already run them.",
     "The By CPL type section below ranks the recommendations by how many other colleges have adopted each one."),
    ("My College, the closing note",
     "Both figures come from the Implementation Funding tab's model, not from this page — open it for the full "
     "derivation and the year split.",
     "The Implementation Funding tab's model computes the implementation figures. Open the tab for the full "
     "derivation and the year split."),
]
change(16, "The same block's other states",
       "The same rules, applied to what this block says in other cases: a declined grant, an institution at the "
       "cap, a district, the loading and empty states, and My College's own lines. Coastline shows none of them. "
       "On My College, the confirmation step points to the Implementation Funding tab.",
       "any of these needs its own look; choose Later and name it in the note.",
       [dict(ref="16.%d" % (i + 1), label=lbl, old=o, rev=r, view=False, plain=True)
        for i, (lbl, o, r) in enumerate(OTHER)])


# ── helpers ──────────────────────────────────────────────────────────────────
def esc_old(s):
    """`old` is markup as the capture holds it: apostrophes and dashes as
    characters, & as &amp;. Our strings are written with bare characters, so
    escape only what outerHTML escapes in text."""
    return s.replace("&", "&amp;")


def text_of(markup):
    return html.unescape(re.sub(r"<[^>]+>", "", markup))


def sub_once(h, old, new):
    k = h.count(old)
    assert k == 1, "expected one occurrence, found %d: %r" % (k, old[:80])
    return h.replace(old, new, 1)


def marker(n):
    return ('<a class="mk-n" href="#c%d"><span class="mk-sr">Change </span>%d</a>' % (n, n))


def span(ref, inner, first, n):
    return (marker(n) if first else "") + '<span class="mk-p" data-ref="%s">%s</span>' % (ref, inner)


# ── the two views ────────────────────────────────────────────────────────────
def inert(h):
    """The replica's controls do nothing here; say so to every reader."""
    h = h.replace('<button type="button" data-val="all" aria-pressed="false">',
                  '<button type="button" data-val="all" aria-pressed="false" disabled title="Works in COBI">')
    h = h.replace('<button type="button" data-val="one" aria-pressed="true" class="on">',
                  '<button type="button" data-val="one" aria-pressed="true" class="on" disabled title="Works in COBI">')
    h = h.replace('<select id="cplFundOnePick">', '<select id="cplFundOnePick" disabled title="Works in COBI">')
    h = h.replace('id="cplFundOnePdf" title="Open a print-ready copy of this funding view, then choose Save as PDF"',
                  'id="cplFundOnePdf" disabled title="Works in COBI"')
    return h


def view(revised, vid):
    h = inert(base)
    # ids must be unique on the page: the two copies get their own.
    for i in ("cplFundCollegeView", "cplFundOnePick", "cplFundOnePdf", "cplFundOnePanel"):
        h = h.replace('id="%s"' % i, 'id="%s-%s"' % (i, vid)).replace('for="%s"' % i, 'for="%s-%s"' % (i, vid))
    for c in C:
        first = True
        for p in c["parts"]:
            if p.get("view") is False:
                continue
            ref, n = p["ref"], c["n"]
            if ref == "7.1" or ref == "8.1":
                continue          # the flags list, below
            if ref == "13.1":
                continue          # a new line, below
            old = esc_old(p["old"])
            new = E(p["rev"]) if revised else old
            if ref == "1.1":
                old_block = "<p>" + old + "</p>"
                h = sub_once(h, old_block, "<p>" + span(ref, new, True, n) + "</p>")
            elif ref == "13.2":
                pass              # handled with 13.1
            else:
                h = sub_once(h, old, span(ref, new, first, n))
            first = False
    # 7 and 8: the flags list. Revised: two paragraphs, no bullets or bold.
    flags_old = ('<ul class="cb-flags"><li>%s</li><li>%s</li></ul>' % (esc_old(BASE_OLD), esc_old(GATE_OLD)))
    if revised:
        base_rev = [p for c in C for p in c["parts"] if p["ref"] == "7.1"][0]["rev"]
        gate_rev = [p for c in C for p in c["parts"] if p["ref"] == "8.1"][0]["rev"]
        flags_new = ('<div class="cb-lab mk-flag">%s</div><div class="cb-lab mk-flag">%s</div>'
                     % (span("7.1", E(base_rev), True, 7), span("8.1", E(gate_rev), True, 8)))
    else:
        flags_new = ('<ul class="cb-flags"><li>%s</li><li>%s</li></ul>'
                     % (span("7.1", esc_old(BASE_OLD), True, 7), span("8.1", esc_old(GATE_OLD), True, 8)))
    h = sub_once(h, flags_old, flags_new)
    # 13: Do this next.
    next_old = "<ul><li>%s</li></ul>" % esc_old(NEXT_OLD)
    if revised:
        r1 = [p for c in C for p in c["parts"] if p["ref"] == "13.1"][0]["rev"]
        r2 = [p for c in C for p in c["parts"] if p["ref"] == "13.2"][0]["rev"]
        next_new = "<ul><li>%s</li><li>%s</li></ul>" % (span("13.1", E(r1), True, 13), span("13.2", E(r2), False, 13))
    else:
        next_new = "<ul><li>%s</li></ul>" % span("13.2", esc_old(NEXT_OLD), True, 13)
    h = sub_once(h, next_old, next_new)
    return h


view_rev = view(True, "rev")
view_today = view(False, "today")


# ── the cards ────────────────────────────────────────────────────────────────
def card(c):
    n = c["n"]
    if n == 16:
        rows = "".join(
            '<li class="mk-orow"><span class="mk-olbl">%s</span>'
            '<span class="mk-otoday"><span class="mk-otag">Today</span> %s</span>'
            '<span class="mk-orev"><span class="mk-otag">Revised</span> '
            '<span class="mk-edit" data-ref="%s" data-item="16">%s</span></span></li>'
            % (E(p["label"]), E(p["old"]), p["ref"], E(p["rev"])) for p in c["parts"])
        body = ('<details class="mk-others"><summary>Show the %d lines, today and revised</summary>'
                '<ul class="mk-olist">%s</ul></details>' % (len(c["parts"]), rows))
        rec = "Revise all %d lines as shown in the list above." % len(c["parts"])
        today_dd = body
    else:
        today_dd = "".join(
            '<span class="mk-line"><span class="mk-lbl">%s</span>%s</span>'
            % (E(p["label"]) if len(c["parts"]) > 1 else "",
               E(text_of(esc_old(p["old"]))) if p["old"] else '<em>Not shown today.</em>')
            for p in c["parts"])
        rec = "".join(
            '<span class="mk-line">%s<span class="mk-edit" data-ref="%s" data-item="%d">%s</span></span>'
            % (('<span class="mk-lbl">%s</span>' % E(p["label"])) if len(c["parts"]) > 1 else "",
               p["ref"], n, E(p["rev"])) for p in c["parts"])
    block = m.replies_block(str(n), ref="my-cpl-funding#%d" % n, chips=CHIPS, title=c["title"],
                            rec=rec, preselect="revise",
                            other=None)
    block = block.replace("A condition, a rewrite, a name to hold out, what to follow up on",
                          "A condition, other wording, what to follow up on")
    return ('<article class="card mk-card" id="c%d" aria-labelledby="c%d-h">'
            '<h3 id="c%d-h"><span class="mk-cn">%d</span> %s</h3>'
            '<dl><dt>%s</dt><dd class="mk-today">%s</dd>'
            '<dt>Why</dt><dd>%s</dd>'
            '<dt>It might be wrong if</dt><dd>%s</dd></dl>%s</article>'
            % (n, n, n, n, E(c["title"]), "The lines" if n == 16 else "Today", today_dd,
               E(c["why"]), E(c["wrong"]), block))


cards = "\n".join(card(c) for c in C)

# ── CSS ──────────────────────────────────────────────────────────────────────
css = []
for r in cap["css"]:
    if r.startswith(".cb-next {"):
        # CSSOM serializes a shorthand with var() as empty longhands; the
        # source rule (college_briefing.js ensureCss) is restored instead.
        r = (".cb-next { border: 1px solid var(--border-strong); border-left: 4px solid var(--brand, var(--cobalt)); "
             "border-radius: 8px; padding: 13px 15px; margin-top: 14px; background: var(--surface-subtle); }")
    assert ": ;" not in r, r[:120]
    css.append(r)

FRAME_CSS = r"""
/* My CPL Funding mockup: COBI's captured block, framed. First Light v1.6, the light identity,
   committed to one look on purpose: the replica is of the light COBI view. */
:root {
  color-scheme: light;
  --mk-paper: #F4F2ED; --mk-ink: #1C1C1A; --mk-body: #3A3A36; --mk-muted: #5C5C55;
  --mk-card: #FFFFFF; --mk-line: rgba(28,28,26,.14); --mk-line-strong: rgba(28,28,26,.30);
  --mk-seal: #002F6D; --mk-cobalt: #0047AB; --mk-tint: #E8EFF8; --mk-hl: #FDF6E3; --mk-gold: #8B6800;
  --mk-display: "Playfair Display", Georgia, serif; --mk-text: "Source Sans 3", Arial, sans-serif;
}
html, body { background: var(--mk-paper); color: var(--mk-body); }
body { font-family: var(--mk-text); font-size: 16px; line-height: 1.55; padding-inline: 16px; padding-block: 0 140px; }
.mk-wrap { max-width: 1240px; margin: 0 auto; }
.mk-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mk-skip { position: absolute; left: -9999px; top: 0; background: var(--mk-card); color: var(--mk-cobalt); padding: 8px 14px; z-index: 10; }
.mk-skip:focus { left: 8px; }
:focus-visible { outline: 3px solid var(--mk-cobalt); outline-offset: 2px; }
.mk-head { display: grid; gap: 8px; padding-block: 26px 14px; }
.mk-head h1 { font-family: var(--mk-display); color: var(--mk-ink); font-size: clamp(1.6rem, 4.4vw, 2.2rem); line-height: 1.15; text-wrap: balance; }
.mk-sample { color: var(--mk-body); max-width: 72ch; }
.mk-controls { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; margin-top: 6px; }
.mk-seg { display: inline-flex; border: 1px solid var(--mk-line-strong); border-radius: 8px; overflow: hidden; }
.mk-seg button { font: inherit; font-size: .95rem; font-weight: 600; min-height: 40px; padding: 6px 16px; border: 0;
  background: var(--mk-card); color: var(--mk-body); cursor: pointer; }
.mk-seg button + button { border-left: 1px solid var(--mk-line-strong); }
.mk-seg button[aria-pressed="true"] { background: var(--mk-seal); color: #FFFFFF; }
.mk-check { display: inline-flex; align-items: center; gap: 8px; font-size: .95rem; color: var(--mk-body); min-height: 40px; }
.mk-check input { width: 20px; height: 20px; accent-color: var(--mk-seal); }
.mk-viewlab { font-family: var(--mk-text); font-size: .78rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--mk-muted); margin: 14px 0 6px; }
.mk-view { min-width: 0; }
.mk-view .cplfund-sec { margin: 0; }
/* A district of numbers: each changed passage carries its number, which links to its card. */
.mk-n { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; min-height: 24px;
  margin-right: 5px; padding: 0 6px; border-radius: 6px; vertical-align: middle;
  font: 700 .74rem/1 var(--mk-text); font-variant-numeric: tabular-nums; letter-spacing: 0; text-transform: none;
  color: var(--mk-seal); background: var(--mk-tint); text-decoration: none; }
.mk-n:hover { text-decoration: underline; }
.mk-on .mk-p { background: var(--mk-hl); box-shadow: 0 0 0 2px var(--mk-hl); border-radius: 2px; }
.mk-off .mk-n { display: none; }
.mk-flag { margin-top: 8px; }
/* The disabled replica controls stay readable: WCAG exempts inactive controls, and the words still matter. */
.mk-view button[disabled], .mk-view select[disabled] { cursor: not-allowed; }
/* Inert here, drawn as COBI draws them: the disabled defaults would gray the words out. */
.mk-view select[disabled] { color: var(--mk-ink); background: var(--mk-card); opacity: 1; border: 1px solid var(--mk-line-strong); border-radius: 4px; }
.mk-view .cplfund-seg button[disabled] { opacity: 1; }
.mk-changes-h { font-family: var(--mk-display); color: var(--mk-ink); font-size: 1.35rem; margin: 34px 0 4px; }
.mk-changes-sub { color: var(--mk-muted); font-size: .95rem; margin-bottom: 6px; max-width: 72ch; }
.mk-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; margin-top: 10px; max-width: 880px; }
.card { background: var(--mk-card); border: 1px solid var(--mk-line); border-radius: 12px; padding: 16px 18px; min-width: 0; scroll-margin-top: 16px; }
.card h3 { font-family: var(--mk-text); font-size: 1.05rem; font-weight: 700; color: var(--mk-ink); display: flex; gap: 10px; align-items: baseline; }
.mk-cn { flex: 0 0 auto; min-width: 1.9em; padding: 0 6px; border-radius: 6px; text-align: center; font-variant-numeric: tabular-nums;
  color: var(--mk-seal); background: var(--mk-tint); font-size: .9rem; }
.card dl { margin-top: 8px; }
.card dt { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; color: var(--mk-muted); margin-top: 10px; }
.card dd { margin: 2px 0 0; color: var(--mk-body); font-size: .95rem; }
.mk-today { color: var(--mk-muted); }
.mk-line { display: block; }
.mk-line + .mk-line { margin-top: 6px; }
.mk-lbl { display: block; font-size: .75rem; font-weight: 700; color: var(--mk-muted); }
.reply-rec .mk-lbl { color: var(--mk-seal); }
.mk-edit { display: inline; border-radius: 3px; outline: none; }
.mk-edit[contenteditable]:hover { box-shadow: inset 0 -1px 0 var(--mk-seal); cursor: text; }
.mk-edit[contenteditable]:focus { box-shadow: 0 0 0 2px var(--mk-cobalt); }
.mk-edited { background: var(--mk-hl); box-shadow: inset 3px 0 0 var(--mk-gold); }
.mk-mark { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; font: 600 .78rem/1.5 var(--mk-text); color: var(--mk-ink); }
.mk-undo { font: inherit; min-height: 28px; padding: 0 10px; border: 1px solid var(--mk-line-strong); border-radius: 6px;
  background: var(--mk-card); color: var(--mk-ink); cursor: pointer; }
.mk-others summary { cursor: pointer; color: var(--mk-cobalt); font-weight: 600; min-height: 32px; display: flex; align-items: center; }
.mk-olist { list-style: none; display: grid; gap: 10px; margin-top: 8px; }
.mk-orow { display: grid; gap: 2px; padding-top: 8px; border-top: 1px solid var(--mk-line); }
.mk-olbl { font-size: .78rem; font-weight: 700; color: var(--mk-ink); }
.mk-otoday { color: var(--mk-muted); font-size: .9rem; }
.mk-orev { color: var(--mk-ink); font-size: .92rem; font-weight: 600; }
.mk-otag { font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-right: 4px; }
.mk-orev .mk-otag { color: var(--mk-seal); }
.submit h2 { font-family: var(--mk-display); color: var(--mk-ink); }
.reply-bar { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
.mk-fine { color: var(--mk-muted); font-size: .88rem; margin-top: 10px; max-width: 80ch; }
@media (max-width: 560px) {
  .card { padding: 14px; }
  .mk-seg button { padding: 6px 12px; }
}
/* The block's two boxes sit side by side above ~650px; below that each takes the column (no sideways scroll at 320px). */
.mk-view .cb-fund { grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
"""

EDIT_JS = r"""
<script>
(function(){
  "use strict";
  var SHEET = %s, LS = "sheet-edits:" + SHEET;
  var col = null, timers = {}, saved = {};
  var lines = {};
  function norm(t){ return String(t || "").replace(/\s+/g, " ").trim(); }
  Array.prototype.forEach.call(document.querySelectorAll(".mk-edit[data-ref]"), function(el){
    var ref = el.getAttribute("data-ref");
    var L = { ref: ref, item: el.getAttribute("data-item"), el: el, orig: norm(el.textContent),
      today: el.getAttribute("data-today") || "" };
    lines[ref] = L;
    try { el.contentEditable = "plaintext-only"; } catch (e) {}
    if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
    el.setAttribute("role", "textbox");
    el.setAttribute("aria-multiline", "true");
    el.setAttribute("spellcheck", "true");
    el.setAttribute("aria-label", "Revised wording, change " + ref + ", editable");
    el.addEventListener("input", function(){ mirror(L); clearTimeout(timers[ref]); mark(L, "saving"); timers[ref] = setTimeout(function(){ commit(L); }, 700); });
    el.addEventListener("blur", function(){ clearTimeout(timers[ref]); commit(L); });
    el.addEventListener("keydown", function(ev){ if (ev.key === "Enter") { ev.preventDefault(); el.blur(); } });
  });
  // The drawn view follows the card: what Sam types is what the view shows.
  function mirror(L){
    var t = norm(L.el.textContent);
    Array.prototype.forEach.call(document.querySelectorAll('#view-rev .mk-p[data-ref="' + L.ref + '"]'), function(p){ p.textContent = t; });
  }
  function mark(L, state, why){
    var host = L.el.parentNode, m = host.querySelector(":scope > .mk-mark");
    if (!state) { if (m) host.removeChild(m); L.el.classList.remove("mk-edited"); count(); return; }
    if (!m) {
      m = document.createElement("span"); m.className = "mk-mark";
      m.innerHTML = '<span class="mk-mark-txt"></span><button type="button" class="mk-undo">Undo</button>';
      m.querySelector(".mk-undo").addEventListener("click", function(ev){ ev.preventDefault(); undo(L); });
      host.appendChild(m);
    }
    L.el.classList.add("mk-edited");
    m.querySelector(".mk-mark-txt").textContent = state === "saved" ? "Edited, saved" :
      state === "saving" ? "Edited, saving" : state === "local" ? "Edited, saved in this browser only" : "Edited, not saved: " + (why || "try again");
    count();
  }
  function local(){ try { return JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) { return {}; } }
  function keepLocal(ref, rec){ try { var o = local(); if (rec) o[ref] = rec; else delete o[ref]; localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function commit(L){
    var now = norm(L.el.textContent);
    if (now === L.orig) { if (saved[L.ref] !== undefined || local()[L.ref]) drop(L); else mark(L, null); return; }
    if (saved[L.ref] === now) { mark(L, col ? "saved" : "local"); return; }
    var rec = { ref: L.ref, item: L.item, before: L.orig, after: now, t: new Date().toISOString() };
    keepLocal(L.ref, rec);
    if (!col) { mark(L, "local"); return; }
    col.doc(L.ref).set(rec).then(function(){ saved[L.ref] = now; mark(L, "saved"); },
      function(e){ mark(L, "failed", e && e.code ? e.code : ""); });
  }
  function drop(L){
    keepLocal(L.ref, null); delete saved[L.ref]; mark(L, null);
    if (col) { try { col.doc(L.ref).delete(); } catch (e) {} }
  }
  function undo(L){ L.el.textContent = L.orig; mirror(L); clearTimeout(timers[L.ref]); drop(L); }
  function count(){
    var n = Object.keys(lines).filter(function(r){ return lines[r].el.classList.contains("mk-edited"); }).length;
    var s = document.getElementById("mk-edits-state");
    if (s) s.textContent = n ? (n + (n === 1 ? " line" : " lines") + " reworded by you" + (col ? ", saved to this mockup." : ", kept in this browser.")) : "";
  }
  function apply(rec){
    var L = rec && lines[rec.ref]; if (!L || typeof rec.after !== "string") return;
    if (norm(L.el.textContent) !== rec.after && document.activeElement !== L.el) { L.el.textContent = rec.after; mirror(L); }
    saved[rec.ref] = rec.after; mark(L, col ? "saved" : "local");
  }
  var lo = local(); Object.keys(lo).forEach(function(r){ apply(lo[r]); });
  // Views and numbers.
  var root = document.getElementById("mk-views");
  Array.prototype.forEach.call(document.querySelectorAll("[data-mkview]"), function(b){
    b.addEventListener("click", function(){
      var want = b.getAttribute("data-mkview");
      Array.prototype.forEach.call(document.querySelectorAll("[data-mkview]"), function(x){ x.setAttribute("aria-pressed", String(x === b)); });
      document.getElementById("view-rev").hidden = want !== "rev";
      document.getElementById("view-today").hidden = want !== "today";
      document.getElementById("mk-viewlab").textContent = want === "rev" ? "Revised, Coastline" : "Today, Coastline";
    });
  });
  var nums = document.getElementById("mk-nums");
  if (nums) nums.addEventListener("change", function(){
    root.classList.toggle("mk-on", nums.checked); root.classList.toggle("mk-off", !nums.checked);
  });
  var C = window.claude;
  if (!C || typeof C.use !== "function") return;
  var p; try { p = C.use("db"); } catch (e) { return; }
  if (!p || typeof p.then !== "function") return;
  p.then(function(db){
    if (!db) return;
    col = db.collection("edits");
    col.get().then(function(snap){
      var seen = {};
      snap.docs.forEach(function(d){ var r = d.data(); if (r && r.ref) { seen[r.ref] = 1; apply(r); } });
      Object.keys(lo).forEach(function(r){ if (!seen[r] && lines[r]) commit(lines[r]); });
      count();
    }, function(){});
  }, function(){});
})();
</script>
"""

page = """<title>My CPL Funding Language</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
/* ── COBI's own rules for the College Dashboard section, captured from the running tab ── */
%(css)s
</style>
<style>
%(frame)s
%(replies)s
</style>
<a class="mk-skip" href="#changes">Skip to the changes</a>
<div class="mk-wrap">
<header class="mk-head">
  <h1>My CPL Funding, revised language</h1>
  <p class="mk-sample">Coastline, as COBI's own code draws it from the published model and today's MAP data%(stamp)s.
  Each number marks a change and links to its card below.</p>
  <div class="mk-controls">
    <div class="mk-seg" role="group" aria-label="Version shown">
      <button type="button" data-mkview="rev" aria-pressed="true">Revised</button>
      <button type="button" data-mkview="today" aria-pressed="false">Today</button>
    </div>
    <label class="mk-check" for="mk-nums"><input type="checkbox" id="mk-nums" checked> Show change numbers</label>
  </div>
</header>
<main>
<h2 class="mk-viewlab" id="mk-viewlab" aria-live="polite">Revised, Coastline</h2>
<div id="mk-views" class="mk-on">
  <section id="view-rev" class="mk-view cplfund" aria-label="Revised view">%(rev)s</section>
  <section id="view-today" class="mk-view cplfund" aria-label="Today's view" hidden>%(today)s</section>
</div>
<p class="mk-fine">The chooser, the view switch and Save as PDF work in COBI only. The steps under Access and
Completion open here as they do in COBI; their wording is the team's tab text and is unchanged in this round.</p>
<h2 class="mk-changes-h" id="changes">The changes</h2>
<p class="mk-changes-sub">Each card arrives set to Use the revision. Click into any revised line to reword it; the
view above follows what you type. <span id="mk-edits-state" aria-live="polite"></span></p>
<div class="mk-grid">
%(cards)s
</div>
%(submit)s
</main>
</div>
%(bar)s
%(rjs)s
%(ejs)s
""" % {
    "css": "\n".join(css), "frame": FRAME_CSS, "replies": m.REPLIES_CSS,
    "stamp": (", " + E(stamp)) if stamp else "",
    "rev": view_rev, "today": view_today, "cards": cards,
    "submit": m.SUBMIT_BLOCK, "bar": m.REPLIES_BAR,
    "rjs": m.replies_js(SHEET_ID), "ejs": EDIT_JS % json.dumps(SHEET_ID),
}
open(out_path, "w", encoding="utf-8").write(page)
print("wrote", out_path, len(page.encode()) // 1024, "KB;", len(C), "changes;",
      sum(len(c["parts"]) for c in C), "lines")
