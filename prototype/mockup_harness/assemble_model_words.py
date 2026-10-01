#!/usr/bin/env python3
"""The "model" sweep, round 1 (S311, 2026-10-01).

Sam, 2026-10-01, widening card 14 of the My CPL Funding mockup ("as it's
finalized, it's no longer a model but now a procedure"): "Yes replace model on
other surfaces as well." This sheet carries every sentence a college can read
on the funding explainer (funding-model/index.html) and the tab's Public view
that says "model", found by rendering both with the product's own code
(capture_model_words.mjs) and by reading the strings that show only in other
states. One card per sentence or sentence family: today's words with the word
marked, the revision (editable in place, saved to `edits`), why, how the
proposal could be wrong, and reply chips (saved to `replies`).

    python3 assemble_model_words.py <out.html> [stamp]

Rendered text only. Paths, ids, the BroadcastChannel name and the
funding-model/ address keep the word.
"""
import html
import json
import re
import sys

sys.path.insert(0, "/home/user/cpl-project-tracker/kb")
import _decision_sheet_replies as m  # noqa: E402

E = html.escape
SHEET_ID = "2026-10-01-model-sweep"
CHIPS = [("Use the revision", "revise"), ("Keep today's", "keep"), ("Later", "later")]
CHIPS_TYPE = [("Use the revision; I'll type it", "revise"), ("Keep today's", "keep"), ("Later", "later")]
CHIPS_KEEP = [("Keep as is", "keep"), ("Sweep these too", "revise"), ("Later", "later")]

out_path = sys.argv[1]
stamp = sys.argv[2] if len(sys.argv) > 2 else ""

C = []


def card(where, title, why, wrong, parts, chips=CHIPS, preselect="revise", listed=False):
    C.append(dict(n=len(C) + 1, where=where, title=title, why=why, wrong=wrong, parts=parts,
                  chips=chips, preselect=preselect, listed=listed))


def P(label, old, rev):
    return dict(label=label, old=old, rev=rev)


EX = "Explainer"
TB = "Institution table, on the explainer and the tab"
TP = "Tab, Public view"
YT = "Yours to type on the tab"

# ── the explainer ────────────────────────────────────────────────────────────
card(EX, "The tag at the top",
     "The tag keeps its status and drops the word.",
     "the Chancellor has approved Scenario 2. The tag then goes, with card 14's sentence and card 17's chip.",
     [P("", "Draft model — not adopted policy", "Draft — not adopted policy")])

card(EX, "The note beside Download PDF",
     "The reader saves figures, so the sentence names them and says when they were current.",
     "you want the note to end at Save as PDF.",
     [P("", "The file carries the model as it currently stands.",
        "The file holds the figures as they stand the day you save it.")])

card(EX, "The opening, third paragraph",
     "The Chancellor's Office does the measuring, so the sentence names it.",
     "you would rather the sentence open on the institution: Each institution's outcomes are measured from its "
     "own MAP data. That reads passive, which the house voice avoids.",
     [P("", "The model measures the prior-learning credit each institution puts on students' records, from that "
            "institution's own MAP data, against two priorities.",
        "The Chancellor's Office measures the prior-learning credit each institution puts on students' records, "
        "from that institution's own MAP data, against two priorities.")])

card(EX, "Funding outcomes and milestones, the opening",
     "One active sentence replaces two clauses, and \"do about it\" had no clear antecedent.",
     "you want the word \"currently\" kept, to signal that the shares can still move.",
     [P("", "The shares and measures below are the ones currently set in the model; the strategies under each are "
            "what the Chancellor's Office recommends a college do about it.",
        "The Chancellor's Office sets the shares and measures below and recommends the strategies under each.")])

card(EX, "Above the Timeline",
     "Names who set the dates.",
     "the dates are yours to set rather than the office's, in which case: The dates below, as they stand.",
     [P("", "The dates set in the model, as they stand. A milestone without a date is contingent.",
        "The Chancellor's Office has set the dates below. A milestone without a date is contingent.")])

card(EX, "How an award is sized, the first paragraph",
     "The office becomes the subject, so its standard measure becomes \"its\" standard measure. \"In the model\" "
     "adds nothing to the count of 118.",
     "the noncredit-only campuses read \"the 118 institutions\" as excluding them. Today's sentence has the same "
     "reach.",
     [P("Sentence 1", "The model measures an institution's size in full-time equivalent students, the Chancellor's "
                      "Office's standard measure of instructional volume, counting credit and noncredit instruction "
                      "together.",
        "The Chancellor's Office measures an institution's size in full-time equivalent students, its standard "
        "measure of instructional volume, counting credit and noncredit instruction together."),
      P("Sentence 2", "Across the 118 institutions in the model the combined total is 1,193,952 FTES.",
        "Across the 118 institutions the combined total is 1,193,952 FTES.")])

card(EX, "How an award is sized, the two adjustments",
     "Redirect is the sector's word for moving funding between institutions (your Aug. 31 vocabulary), and the "
     "office is the actor in both sentences.",
     "you prefer the sentence without an actor: Two adjustments then apply to that proportional figure.",
     [P("The lead-in", "The model then applies two adjustments to that proportional figure:",
        "The Chancellor's Office then makes two adjustments to that proportional figure:"),
      P("The cap", "The model re-splits the difference, $429,283, across the institutions below the cap.",
        "The Chancellor's Office redirects the difference, $429,283, to the institutions below the cap.")])

card(EX, "The noncredit share, the opening sentence",
     "Names the office as the one that calculates, and the priorities are the ones on this page.",
     "the noncredit funding counts toward the noncredit measures only, in which case the clause should say so. "
     "The paragraph's third sentence already does.",
     [P("", "Noncredit funding is calculated from the noncredit FTES each institution reports to MIS, and counts "
            "toward the priorities set out in this model.",
        "The Chancellor's Office calculates noncredit funding from the noncredit FTES each institution reports to "
        "MIS, and that funding counts toward the priorities on this page.")])

card(EX, "How outcomes are measured",
     "Names the office. \"In units\" reads more plainly than \"by units\", and a colon replaces the dash.",
     "you want the regulation's phrase to lead the sentence, as it does today.",
     [P("", "The model measures outcomes by units of credit for prior learning converted to equivalent FTES at the "
            "college's own calendar — 30 semester units make one FTES, or 45 on a quarter calendar.",
        "The Chancellor's Office measures outcomes in units of credit for prior learning, converted to equivalent "
        "FTES on the college's own calendar: 30 semester units make one FTES, or 45 on a quarter calendar.")])

card(EX, "How a target is set",
     "Names the office. The page builds \"All two factors\" from the count of priorities; with two it should say "
     "\"Both\", and the fix is in the page's code.",
     "a third priority returns. The code then says \"All three\" again, as it did before.",
     [P("Sentence 1", "The model divides each priority's share by a price to produce its target.",
        "The Chancellor's Office divides each priority's share by a price to set its target."),
      P("Sentence 3", "All two factors are currently set to 0.5, so each priority is priced at 0.5 times the state "
                      "rate and the two targets differ only because the shares do.",
        "Both factors are currently set to 0.5, so each priority is priced at 0.5 times the state rate and the two "
        "targets differ only because the shares do."),
      P("When the factors differ", "The factors currently set in the model are 0.5, 1.0.",
        "The factors currently set are 0.5 and 1.0.")])

card(EX, "Timing, the opening",
     "\"In effect\" already says current.",
     "you want the office named here too: The Chancellor's Office has set two timing rules.",
     [P("", "Two timing settings are in effect in the current model.", "Two timing settings are in effect.")])

card(EX, "Policy choices and given figures",
     "Names the office and replaces the idiom \"takes them as it finds them\". The table's label for screen "
     "readers changes with it.",
     "you prefer \"the allocation\" as the actor in the second sentence.",
     [P("The sentences", "Some of the figures in this model are policy decisions the Chancellor's Office can change. "
                         "Others are given, and the model takes them as it finds them.",
        "The Chancellor's Office sets some of these figures as policy and can change them. Others are given, and it "
        "uses them as they are."),
      P("The table's label (screen readers)", "Which figures in the model are policy choices and which are given",
        "Which figures are policy choices and which are given")])

card(EX, "Where these numbers come from",
     "The tab is the actor colleges can find. \"Committed\" is our word for a saved file, and colleges do not "
     "need it.",
     "you would rather the page not point colleges at the tab at all, since most of them cannot open it.",
     [P("", "The same model that runs the Implementation Funding tab produces every figure on this page, over the "
            "committed 2025-26 credit and noncredit FTES roster for 118 institutions and the policy settings saved "
            "in it. Change a setting on the tab and these figures move with it; the institution table above is "
            "the tab's own.",
        "The Implementation Funding tab computes every figure on this page from the 2025-26 credit and noncredit "
        "FTES roster of 118 institutions and the policy settings saved on the tab. A change to a setting there "
        "changes the figures here, and the institution table above is the tab's own.")])

card(EX, "The closing note",
     "\"Working draft\" keeps the status without the word.",
     "the Chancellor has approved Scenario 2. The first sentence then goes, with card 1's tag.",
     [P("", "This is a working model for discussion, not adopted policy.",
        "This is a working draft for discussion, not adopted policy.")])

# ── the institution table ────────────────────────────────────────────────────
card(TB, "The hovers on the Curr columns",
     "Your Dashboard introduction says \"The Curr (current) columns show the funding qualifying so far\"; the "
     "hovers now use the same words. The figures are examples from one row.",
     "you want the hover to name the maximum: Credit funding qualifying so far: $17,000 of a $147,938 maximum.",
     [P("Curr CR", "Credit funding the model computes: $17,000 of $147,938.",
        "Credit funding qualifying so far: $17,000 of $147,938."),
      P("Curr NC", "Noncredit funding the model computes: $0 of $2,062.",
        "Noncredit funding qualifying so far: $0 of $2,062."),
      P("Curr Total Funds", "Funding the model computes, credit and noncredit together: $17,000 of $150,000.",
        "Funding qualifying so far, credit and noncredit together: $17,000 of $150,000.")])

card(TB, "The hovers on the base and the cap",
     "Names the office, and the cap's hover takes the wording you approved for My CPL Funding (\"holds it at the "
     "cap and redirects the difference\").",
     "you want \"brought up to the minimum\", your Aug. 31 phrase, in place of \"brings it up to the base\".",
     [P("At the base", "…below the $150,000 base award, so the model brings it up to the base from within the same "
                       "total.",
        "…below the $150,000 base award, so the Chancellor's Office brings it up to the base from within the same "
        "total."),
      P("At the cap", "…above the $400,000 cap, so the model holds it at the cap and the difference funds the other "
                      "institutions.",
        "…above the $400,000 cap, so the Chancellor's Office holds it at the cap and redirects the difference to the "
        "other institutions.")])

# ── the tab's Public view ────────────────────────────────────────────────────
card(TP, "The Draft chip beside the tab's title (its hover)",
     "The chip says Draft; the hover now says what is a draft without the word.",
     "the Chancellor has approved Scenario 2, in which case the chip goes.",
     [P("", "Draft funding model — under active revision; figures are potential allocations, not awards.",
        "CPL funding draft, under active revision. The figures are potential allocations, not awards.")])

card(TP, "Priority Outcomes, the opening",
     "Drops the word and the \"rather than\" frame, and capitalizes the Chancellor's Office as the style guide "
     "asks (the lowercase came from the statute).",
     "you want the statute's lowercase kept outside the quotation marks too.",
     [P("Sentence 1", "The chancellor's office must allocate this appropriation…",
        "The Chancellor's Office must allocate this appropriation…"),
      P("Sentence 2", "This is that account, read live from the model rather than written down beside it.",
        "The cards below give that account, computed live from the current figures.")])

card(TP, "Priority Outcomes, the note on \"Equitably\"",
     "\"Equity devices\" belong to the allocation, and the page's own names for them are the base award and the "
     "cap. The note also ends on an internal attribution, (Sam, 2026-08-30), which a college reader sees; the "
     "revision drops it.",
     "you want the attribution kept as the source of the ruling.",
     [P("The devices", "…and the model's equity devices — the minimum-award floor and the award ceiling — equalize "
                       "between colleges…",
        "…and the allocation's equity devices — the base award and the cap — equalize between colleges…"),
      P("The close", "…pulled together, disaggregated, and analyzed (Sam, 2026-08-30).",
        "…pulled together, disaggregated, and analyzed.")])

card(TP, "How the allocation is computed (the formula section)",
     "Seven sentences make the model the actor. The office takes most of them; an institution \"qualifies for\" "
     "its share (your Sept. 13 map); and \"redirects\" replaces \"re-splits\" where funding moves between "
     "institutions.",
     "you want the formula's own sentences to stay with no actor at all, since the arithmetic is the subject.",
     [P("The heading", "How the model computes each institution's allocation:",
        "How the Chancellor's Office computes each institution's allocation:"),
      P("Per priority", "The model computes each institution's potential allocation per priority as credit + "
                        "noncredit FTES share × priority share × $25,240,308…",
        "Each institution's potential allocation per priority is credit + noncredit FTES share × priority share × "
        "$25,240,308…"),
      P("Balance", "Balance for Year 1: $0. The model allocates the full annual funding.",
        "Balance for Year 1: $0. The Chancellor's Office allocates the full annual funding."),
      P("The award", "The model awards max award × (actual ÷ target), up to 100%…",
        "An institution qualifies for max award × (actual ÷ target), up to 100%…"),
      P("The base", "The model brings 50 institutions up to the base (≈$2,653,956, 10.51% of the funding) and "
                    "re-splits the remainder proportionally across the other institutions, so the total still "
                    "balances.",
        "The Chancellor's Office brings 50 institutions up to the base (≈$2,653,956, 10.51% of the funding) and "
        "shares the remainder proportionally among the other institutions, so the total still balances."),
      P("The cap", "Cap: the model holds 7 institutions at $400,000 for the window and re-splits the $429,283 above "
                   "it (1.7% of the funding) across the other institutions. The model solves the base and the cap "
                   "together…",
        "Cap: the Chancellor's Office holds 7 institutions at $400,000 for the window and redirects the $429,283 "
        "above it (1.7% of the funding) to the other institutions. It sets the base and the cap together…"),
      P("The noncredit share", "The noncredit share: the model divides every award into a credit share and a "
                               "noncredit share by the institution's own FTES split.",
        "The noncredit share: the Chancellor's Office divides every award into a credit share and a noncredit "
        "share by the institution's own FTES split.")])

card(TP, "Questions, when guidance arrives",
     "\"Procedure\" is your word for it (card 14), and the sentence appears twice in the answers.",
     "the procedure is final now. The sentence then says when guidance arrives: The Chancellor's Office will "
     "release detailed guidance in (month).",
     [P("", "The Chancellor's Office will release detailed guidance once the funding model is final.",
        "The Chancellor's Office will release detailed guidance once the CPL funding procedure is final.")])

card(TP, "Questions, a student who declines the credit",
     "The Access priority is what counts these requests: its measure reads applied CPL units from the landing "
     "page, the portal and batch upload. \"The first draft of the priorities\" is drafting history colleges do "
     "not need.",
     "the answer means a measure other than Access; the measure's own text (card 11 of the My CPL Funding sheet, "
     "still yours to type) is the authority.",
     [P("", "…still counts toward funding: in the first draft of the priorities, the model counts public CPL "
            "requests with faculty-approved CPL that arrive through the College Landing Page, the student portal "
            "(CreditforBeingYou.org), or a college's batch upload.",
        "…still counts toward funding: the Access priority counts public CPL requests with faculty-approved CPL "
        "that arrive through the College Landing Page, the student portal (CreditforBeingYou.org), or a college's "
        "batch upload.")])

# ── the stored text: Sam types it ────────────────────────────────────────────
card(YT, "The Introduction's last paragraph, both scenarios",
     "This is your approved introduction, saved on the tab, so you type the change there (no session writes the "
     "funding text). Only the two sentences that name the model change; the statute quotation is untouched. The "
     "page's built-in fallback text follows whatever you type.",
     "you want \"CPL funding\" as the actor in the first sentence too: CPL funding measures outcomes… reads as if "
     "funding did the measuring.",
     [P("Sentence 1", "The model measures outcomes in equivalent FTES based on CPL units and allocates funding to "
                      "institutions proportionally for each priority at an FTES reimbursement rate.",
        "The Chancellor's Office measures outcomes in equivalent FTES based on CPL units and allocates funding to "
        "institutions proportionally for each priority at an FTES reimbursement rate."),
      P("Sentence 3", "The model relies on data in the MAP platform, which serves as the Chancellor's Office "
                      "systemwide CPL infrastructure.",
        "CPL funding relies on data in the MAP platform, which serves as the Chancellor's Office systemwide CPL "
        "infrastructure.")],
     chips=CHIPS_TYPE)

card(YT, "Two Timeline milestones, both scenarios",
     "Your word, procedure, in the first; the second drops the repeated phrase, since the guidance memo carries "
     "the procedure. Typed on the tab's Timeline, like card 7's line.",
     "you want the second to name both: Guidance Memo and CPL Funding Procedure Release.",
     [P("Milestone 1", "Funding Model Finalized", "CPL Funding Procedure Finalized"),
      P("Milestone 2", "Guidance Memo and Funding Model Release", "Guidance Memo Release")],
     chips=CHIPS_TYPE)

# ── the videos ───────────────────────────────────────────────────────────────
card("Videos", "The introduction videos",
     "The page text changes now. The last scene's heading is drawn into the 90-second films, so both films are "
     "rendered again. The spoken line goes into your Scenario 2 script rewrite; the Scenario 1 narrated draft "
     "keeps it until that scenario is voiced again.",
     "you would rather leave the films alone until the Chancellor decides, since only the last scene changes.",
     [P("Under the title (90 seconds)", "A 90-second introduction for colleges, with music, for Scenario 2 of the "
                                        "funding model.",
        "A 90-second introduction to CPL funding for colleges, with music, for Scenario 2."),
      P("Under the title (narrated)", "A narrated draft of the introduction for colleges, for Scenario 2 of the "
                                      "funding model, about three minutes.",
        "A narrated draft of the introduction to CPL funding for colleges, for Scenario 2, about three minutes."),
      P("The link to the explainer", "CPL funding model, Scenario 2", "How CPL funding works, Scenario 2"),
      P("The last scene's heading (in the film)", "Find your college on the funding model page",
        "Find your college on the CPL funding page"),
      P("Spoken (narrated)", "…visit the CPL funding model page.", "…visit the CPL funding page.")])

# ── lines in other states ────────────────────────────────────────────────────
card("Other states", "Lines that show only in other states",
     "None of these shows on the published scenario today: they appear when a page fails to load, a goal is "
     "open, a measure arrives late, an institution has no noncredit share, or in the CSV and the memo. Two also "
     "end on an internal attribution, which the revision drops.",
     "one of them is curator-only after all; it would then belong on card 27 and keep the word.",
     [P("Explainer, load failure", "Could not load the funding model on this page.",
        "The CPL funding figures did not load. Reload the page."),
      P("Explainer, compute failure", "Could not compute the current model — figures below may be out of date.",
        "This page could not compute the current figures, so those below may be out of date."),
      P("Explainer, while loading", "The minimum conditions arrive with the model.",
        "The minimum conditions are still loading."),
      P("Tab, data failure", "Funding model data is unavailable right now (cpl_funding_data.js failed to load). "
                             "Try a hard refresh.",
        "The CPL funding figures did not load. Reload the page."),
      P("Outcome card, measure late", "A priority is tagged to this goal and its measure is awaiting delivery to the "
                                      "model.",
        "A priority is tagged to this goal, and its measure has not been delivered."),
      P("Outcome card, open goal", "Every priority, funding line and project in the model is tagged to another "
                                   "goal; this one is open.",
        "Every priority, funding line and project is tagged to another goal, so this one is open."),
      P("Outcome card, open goal (list)", "Open — every priority, funding line and project in this model is tagged "
                                          "to another goal.",
        "Open: every priority, funding line and project is tagged to another goal."),
      P("Career attainment card", "…brings each update into the model by import, so the goal asks no reporting of "
                                  "colleges (Sam, 2026-09-22).",
        "…imports each update, so the goal asks no reporting of colleges."),
      P("A measure the office imports", "The Chancellor's Office measures this outcome from EDD wage records and "
                                        "updates the model with each import.",
        "The Chancellor's Office measures this outcome from EDD wage records and imports each update."),
      P("A reporting designation", "A reporting designation, which leaves every college award exactly as the model "
                                   "computes it.",
        "A reporting designation; it leaves every college award unchanged."),
      P("Shares that miss 100%", "…sum to 95% — the model under-allocates the annual funding (see Balance)",
        "…sum to 95%, which under-allocates the annual funding (see Balance)"),
      P("Annual funding (not front-loaded)", "The model computes each institution's potential allocation of one "
                                             "annual tranche per priority as…",
        "Each institution's potential allocation of one annual tranche per priority is…"),
      P("Drill-in, a credit-only institution", "Credit only: the model holds no noncredit share.",
        "Credit only: this institution has no noncredit share."),
      P("Statewide row, no conditions shown", "Institutions that meet every minimum condition the model tracks.",
        "Institutions that meet every minimum condition."),
      P("The CSV's first line", "CPL Implementation Funding (DRAFT model 2026-08-31)…",
        "CPL Implementation Funding (draft of 2026-08-31)…"),
      P("The guidance memo's footer", "Live model & dashboard: https://cpl-initiative.github.io/cpl-project-tracker/",
        "Live figures and dashboard: https://cpl-initiative.github.io/cpl-project-tracker/")],
     listed=True)

# ── kept: curator-only text ──────────────────────────────────────────────────
KEPT = [
    "How this funding model works (the link to the explainer, and its hover)",
    "Add project: clones the current model as its starting point",
    "Viewing the shared model",
    "Edit them there and this model follows",
    "Who moves: this exploration vs the saved model",
    "Regenerate from the current model (the memo builder)",
    "Remaining 2025-26 one-time balance: not part of the College Implementation Funding model",
    "Refresh everything and its report: Read the saved model, The saved model did not load, and eight more",
]
card("Kept", "The curators' own controls keep the word",
     "Your ruling covers college-facing text. These appear only to a signed-in curator, where you still develop "
     "the allocation, and the code hides each of them on every public surface. Paths and ids (funding-model/, "
     "cpl-funding-model) keep the word too.",
     "you want the word gone from COBI entirely, curator view included.",
     [P(k, k, "") for k in KEPT], chips=CHIPS_KEEP, preselect="keep", listed=True)


# ── the page ─────────────────────────────────────────────────────────────────
def marked(s):
    """Today's words, with every "model" marked."""
    return re.sub(r"(?i)\b(model)", r'<mark class="mk-hit">\1</mark>', E(s))


def card_html(c):
    n = c["n"]
    multi = len(c["parts"]) > 1
    kept = c["chips"] is CHIPS_KEEP
    if c["listed"]:
        rows = "".join(
            '<li class="mk-orow"><span class="mk-olbl">%s</span>' % E(p["label"]) +
            ("" if kept else
             '<span class="mk-otoday"><span class="mk-otag">Today</span> %s</span>'
             '<span class="mk-orev"><span class="mk-otag">Revised</span> '
             '<span class="mk-edit" data-ref="%d.%d" data-item="%d">%s</span></span>'
             % (marked(p["old"]), n, i + 1, n, E(p["rev"]))) + "</li>"
            for i, p in enumerate(c["parts"]))
        today_dd = ('<details class="mk-others"%s><summary>%s the %d lines</summary>'
                    '<ul class="mk-olist">%s</ul></details>'
                    % ("" if kept else " open", "Show" if kept else "Hide", len(c["parts"]), rows))
        rec = ("Keep the word in these %d curator-only lines." % len(c["parts"]) if kept
               else "Revise all %d lines as shown above." % len(c["parts"]))
        dt = "The lines"
    else:
        today_dd = "".join(
            '<span class="mk-line">%s%s</span>' % (('<span class="mk-lbl">%s</span>' % E(p["label"])) if multi else "",
                                                   marked(p["old"]))
            for p in c["parts"])
        rec = "".join(
            '<span class="mk-line">%s<span class="mk-edit" data-ref="%d.%d" data-item="%d">%s</span></span>'
            % (('<span class="mk-lbl">%s</span>' % E(p["label"])) if multi else "", n, i + 1, n, E(p["rev"]))
            for i, p in enumerate(c["parts"]))
        dt = "Today"
    block = m.replies_block(str(n), ref="model-sweep#%d" % n, chips=c["chips"], title=c["title"],
                            rec=rec, preselect=c["preselect"], other=None)
    block = block.replace("A condition, a rewrite, a name to hold out, what to follow up on",
                          "A condition, other wording, what to follow up on")
    return ('<article class="card mk-card" id="c%d" aria-labelledby="c%d-h">'
            '<p class="mk-where">%s</p>'
            '<h2 id="c%d-h"><span class="mk-cn">%d</span> %s</h2>'
            '<dl><dt>%s</dt><dd class="mk-today">%s</dd>'
            '<dt>Why</dt><dd>%s</dd>'
            '<dt>It might be wrong if</dt><dd>%s</dd></dl>%s</article>'
            % (n, n, E(c["where"]), n, n, E(c["title"]), dt, today_dd, E(c["why"]), E(c["wrong"]), block))


cards = "\n".join(card_html(c) for c in C)

FRAME_CSS = r"""
/* The "model" sweep sheet. First Light v1.6, the light identity. */
:root {
  color-scheme: light;
  --mk-paper: #F4F2ED; --mk-ink: #1C1C1A; --mk-body: #3A3A36; --mk-muted: #5C5C55;
  --mk-card: #FFFFFF; --mk-line: rgba(28,28,26,.14); --mk-line-strong: rgba(28,28,26,.30);
  --mk-seal: #002F6D; --mk-cobalt: #0047AB; --mk-tint: #E8EFF8; --mk-hl: #FDF6E3; --mk-gold: #8B6800;
  --mk-display: "Playfair Display", Georgia, serif; --mk-text: "Source Sans 3", Arial, sans-serif;
  /* The reply controls' own tokens (kb/_decision_sheet_replies.py), First Light v1.6 values. */
  --text-strong: #1C1C1A; --text-body: #3A3A36; --text-muted: #5C5C55;
  --surface-opaque: #FFFFFF; --surface-subtle: #F7F5F1;
  --border: rgba(28,28,26,.14); --border-strong: rgba(28,28,26,.30);
  --cobalt: #0047AB; --seal-blue: #002F6D; --mustard-text: #8B6800;
  --rec-tint: #E8EFF8; --rest-tint: #FDF6E3;
}
*, *::before, *::after { box-sizing: border-box; }
html, body { background: var(--mk-paper); color: var(--mk-body); margin: 0; }
body { font-family: var(--mk-text); font-size: 16px; line-height: 1.55; padding-inline: 16px; padding-block: 0 140px; }
.mk-wrap { max-width: 880px; margin: 0 auto; }
.mk-skip { position: absolute; left: -9999px; top: 0; background: var(--mk-card); color: var(--mk-cobalt); padding: 8px 14px; z-index: 10; }
.mk-skip:focus { left: 8px; }
:focus-visible { outline: 3px solid var(--mk-cobalt); outline-offset: 2px; }
.mk-head { padding-block: 26px 6px; }
.mk-head h1 { font-family: var(--mk-display); color: var(--mk-ink); font-size: clamp(1.6rem, 4.4vw, 2.2rem); line-height: 1.15; margin: 0; text-wrap: balance; }
.mk-head p { margin: 6px 0 0; color: var(--mk-muted); font-size: .95rem; }
.mk-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; margin-top: 16px; }
.card { background: var(--mk-card); border: 1px solid var(--mk-line); border-radius: 12px; padding: 16px 18px; min-width: 0; scroll-margin-top: 16px; }
.mk-where { margin: 0; font-size: .74rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--mk-muted); }
.card h2 { font-family: var(--mk-text); font-size: 1.05rem; font-weight: 700; color: var(--mk-ink); display: flex; gap: 10px; align-items: baseline; margin: 4px 0 0; }
.mk-cn { flex: 0 0 auto; min-width: 1.9em; padding: 0 6px; border-radius: 6px; text-align: center; font-variant-numeric: tabular-nums;
  color: var(--mk-seal); background: var(--mk-tint); font-size: .9rem; }
.card dl { margin: 8px 0 0; }
.card dt { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; color: var(--mk-muted); margin-top: 10px; }
.card dd { margin: 2px 0 0; color: var(--mk-body); font-size: .95rem; }
.mk-today { color: var(--mk-muted); }
.mk-hit { background: var(--mk-hl); color: var(--mk-ink); box-shadow: inset 0 -2px 0 var(--mk-gold); padding: 0 1px; }
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
.mk-olist { list-style: none; display: grid; gap: 10px; margin: 8px 0 0; padding: 0; }
.mk-orow { display: grid; gap: 2px; padding-top: 8px; border-top: 1px solid var(--mk-line); }
.mk-olbl { font-size: .78rem; font-weight: 700; color: var(--mk-ink); }
.mk-otoday { color: var(--mk-muted); font-size: .9rem; }
.mk-orev { color: var(--mk-ink); font-size: .92rem; font-weight: 600; }
.mk-otag { font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-right: 4px; }
.mk-orev .mk-otag { color: var(--mk-seal); }
.submit h2 { font-family: var(--mk-display); color: var(--mk-ink); }
.reply-bar { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
@media (max-width: 560px) { .card { padding: 14px; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
"""

# The in-place edits, as S310's sheet keeps them (assemble_mycpl.py), without
# the drawn view: a typed revision saves to the `edits` collection.
EDIT_JS = r"""
<script>
(function(){
  "use strict";
  var SHEET = %s, LS = "sheet-edits:" + SHEET;
  var col = null, timers = {}, saved = {}, lines = {};
  function norm(t){ return String(t || "").replace(/\s+/g, " ").trim(); }
  Array.prototype.forEach.call(document.querySelectorAll(".mk-edit[data-ref]"), function(el){
    var ref = el.getAttribute("data-ref");
    var L = { ref: ref, item: el.getAttribute("data-item"), el: el, orig: norm(el.textContent) };
    lines[ref] = L;
    try { el.contentEditable = "plaintext-only"; } catch (e) {}
    if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
    el.setAttribute("role", "textbox");
    el.setAttribute("aria-multiline", "true");
    el.setAttribute("spellcheck", "true");
    el.setAttribute("aria-label", "Revised wording, line " + ref + ", editable");
    el.addEventListener("input", function(){ clearTimeout(timers[ref]); mark(L, "saving"); timers[ref] = setTimeout(function(){ commit(L); }, 700); });
    el.addEventListener("blur", function(){ clearTimeout(timers[ref]); commit(L); });
    el.addEventListener("keydown", function(ev){ if (ev.key === "Enter") { ev.preventDefault(); el.blur(); } });
  });
  function mark(L, state, why){
    var host = L.el.parentNode, mm = host.querySelector(":scope > .mk-mark");
    if (!state) { if (mm) host.removeChild(mm); L.el.classList.remove("mk-edited"); return; }
    if (!mm) {
      mm = document.createElement("span"); mm.className = "mk-mark";
      mm.innerHTML = '<span class="mk-mark-txt"></span><button type="button" class="mk-undo">Undo</button>';
      mm.querySelector(".mk-undo").addEventListener("click", function(ev){ ev.preventDefault(); undo(L); });
      host.appendChild(mm);
    }
    L.el.classList.add("mk-edited");
    mm.querySelector(".mk-mark-txt").textContent = state === "saved" ? "Edited, saved" :
      state === "saving" ? "Edited, saving" : state === "local" ? "Edited, saved in this browser only" : "Edited, not saved: " + (why || "try again");
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
  function undo(L){ L.el.textContent = L.orig; clearTimeout(timers[L.ref]); drop(L); }
  function apply(rec){
    var L = rec && lines[rec.ref]; if (!L || typeof rec.after !== "string") return;
    if (norm(L.el.textContent) !== rec.after && document.activeElement !== L.el) L.el.textContent = rec.after;
    saved[rec.ref] = rec.after; mark(L, col ? "saved" : "local");
  }
  var lo = local(); Object.keys(lo).forEach(function(r){ apply(lo[r]); });
  var CL = window.claude;
  if (!CL || typeof CL.use !== "function") return;
  var p; try { p = CL.use("db"); } catch (e) { return; }
  if (!p || typeof p.then !== "function") return;
  p.then(function(db){
    if (!db) return;
    col = db.collection("edits");
    col.get().then(function(snap){
      var seen = {};
      snap.docs.forEach(function(d){ var r = d.data(); if (r && r.ref) { seen[r.ref] = 1; apply(r); } });
      Object.keys(lo).forEach(function(r){ if (!seen[r] && lines[r]) commit(lines[r]); });
    }, function(){});
  }, function(){});
})();
</script>
"""

page = """<title>Model Sweep, Round 1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
%(frame)s
%(replies)s
</style>
<a class="mk-skip" href="#c1">Skip to item 1</a>
<div class="mk-wrap">
<header class="mk-head">
  <h1>&ldquo;Model&rdquo; leaves the public funding text</h1>
  <p>The explainer and the tab's Public view, read from the published scenario%(stamp)s.</p>
</header>
<main>
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
    "frame": FRAME_CSS, "replies": m.REPLIES_CSS,
    "stamp": (", " + E(stamp)) if stamp else "",
    "cards": cards, "submit": m.SUBMIT_BLOCK, "bar": m.REPLIES_BAR,
    "rjs": m.replies_js(SHEET_ID), "ejs": EDIT_JS % json.dumps(SHEET_ID),
}
open(out_path, "w", encoding="utf-8").write(page)
print("wrote", out_path, len(page.encode()) // 1024, "KB;", len(C), "cards;",
      sum(len(c["parts"]) for c in C), "lines")
