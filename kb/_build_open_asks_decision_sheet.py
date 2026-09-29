#!/usr/bin/env python3
"""Everything outstanding for Sam, as one numbered sheet.

Standing rule, his words (2026-09-22):

    "Always give me a decision sheet for any outstanding items for me..."

⚠️ THE FAILURE MODE IS A SHEET THAT QUIETLY MISSES A LANE, so this script does
not trust its own item list. `audit_coverage()` reads every
`docs/reference/lanes/*.md`, finds each NEEDS-SAM marker, and REFUSES TO BUILD
unless every lane carrying one is either covered by an item here or named in
`NO_OPEN_ASK` with a reason. That is Rule 10(a3)'s posture — map it or dismiss
it, and the reason is the point — pointed at the backlog instead of at a write
surface.

⚠️ THE ITEMS THEMSELVES ARE HAND-WRITTEN, AND THAT IS DELIBERATE. A lane's
NEEDS-SAM block is freehand prose; a parser could list the lanes but never
produce what a sheet needs — the ask in plain words, the measured context, and a
proposal with its draft reason. So the scan guards COVERAGE and a person writes
the CARD. When a lane's ask changes, the card here is what has to change with it.

⚠️ AND THIS SHEET REPORTS; IT NEVER RULES. An item that has drifted out of its
lane's wording is a bug in this file, never a license to update the lane from here.

⚠️ A RULING LEAVES THE SHEET IN THE SAME CHANGE THAT RECORDS IT IN ITS LANE.
Measured 2026-09-27 (S295): Sam completed the 2026-09-22 sheet through card 18,
and seven of the cards this builder still carried five days later were at or
below that mark, answered under his high-water rule. Their lanes still read
NEEDS SAM, so the coverage audit kept them here as asks. Four of the seven had
also been answered on 2026-08-14 (military scope §10), and two of the 09-22
proposals contradicted those August answers. When a verdict lands, change the
lane's marker in the same pull request, or the sheet asks again.

Published: https://claude.ai/artifact/9Wikhf54XyJgWXDEw5AK7G (2026-09-29, S301, SHEET_ID
2026-09-29-open-asks-2, capabilities db + comments, twelve cards: the seven below carried over,
four Jev next steps, one Sierra Training call). Its cards 1-7 are the seven of
https://claude.ai/artifact/QiaDezD2AN6XDzctUCSCfw (2026-09-29, S300, SHEET_ID 2026-09-29-open-asks),
where Sam pressed Complete at 03:34Z with no card touched (`through: null`, nothing reviewed); that
sheet's thread points here, and a reply there still counts for its seven. Before it: https://claude.ai/artifact/C1uyRhneegqQ4XSPRKiC3B (2026-09-28, S297, SHEET_ID
2026-09-28-open-asks, capabilities db + comments, three cards; its store held no replies when
S300 read it on 2026-09-29). Its cards 1 and 2 are cards 3
and 4 of https://claude.ai/artifact/74AfMNmXPQYP5X7XKpjHfH (2026-09-27 evening, SHEET_ID
2026-09-27-funding-asks, four funding cards; Sam answered cards 1 and 2 there and left off at
card 3), so read BOTH stores' `replies` and `replies/done`, and the later answer stands; NEVER
republish onto either. The two-card 2026-09-27-funding-asks-2 was built, never published, and
is gone. Before them:
https://claude.ai/artifact/5sWY4QCCDfkAegZtZrW1oe (SHEET_ID 2026-09-27-open-asks; all eight
cards answered that day, through card 8, and recorded in their lanes). A card list that
changes is published under a fresh SHEET_ID, OUT and artifact. The 2026-09-22 sheet
(https://claude.ai/artifact/FTEhLfMxhRfv4YH6DGSPhn) keeps Sam's answers of that day;
never republish onto it, and give any sheet whose cards change a fresh SHEET_ID.

Run: python3 kb/_build_open_asks_decision_sheet.py
     python3 kb/_build_open_asks_decision_sheet.py --check   (coverage only)
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANES = os.path.join(ROOT, 'docs', 'reference', 'lanes')
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-29-open-asks-2.html')
SHEET_ID = '2026-09-29-open-asks-2'

NEEDS = re.compile(r'NEEDS SAM', re.I)

# A lane whose marker is NOT an open ask. The reason is the point: a bare
# exclusion list would let a real ask be silenced by adding one line.
NO_OPEN_ASK = {
    'README':
        "the lanes index, which documents the marker rather than carrying one.",
}


def chips(*pairs):
    return list(pairs)

# ── what each card's premise rests on ────────────────────────────────────────
# ⚠️ FOUR OF THE 2026-09-22 SHEET'S TWENTY-ONE CARDS RESTED ON A PREMISE THAT
# HAD ALREADY MOVED, and Sam ruled on all four before anyone noticed:
#
#   item 14  "the treatment depends on the rest of the sentence" — ccr_universe.js
#            had been drawing the statewide ring since 2026-09-10, citing his ask
#            BY DATE in its own comment
#   item 15  "the live CHECK constraint does not allow skyview-ask" — it does
#   item 17  "8 colleges" — five profiles, and not one of them a community college
#   item 16  the risk was stated backwards: NODE_ZOOM fails islands as the window
#            WIDENS, so narrowing makes stars safer, never emptier
#
# The cause is specific and fixable. The cross-list sheet RECOMPUTED every count
# at build time; this builder QUOTED lane prose, and lane prose lags the code.
# So every card now declares its evidence, and the kinds that the repo can settle
# are settled HERE, on every build:
#
#   measured(fn)       the repo can answer it. Answered at build time, every time.
#                      If the predicate says the premise no longer holds, the
#                      BUILD REFUSES — the sheet stops asking what is already done.
#   live(date, how)    only a running system knows (Supabase, a deployed function),
#                      and this script cannot reach one. The card carries the date
#                      it was last checked and says so in the reader's own words.
#   quoted(src, as_of) copied from a lane file. The card names the file and the
#                      date, so a ruling is made knowing the number is second-hand.
#   policy()           a judgment with no factual premise; nothing to go stale.
#
# ⚠️ `quoted` IS NOT A LOOPHOLE. It is the honest label for a claim nobody
# re-checked, and it prints as one. If a claim CAN be measured, measure it.

def measured(fn, note=""):
    return {"kind": "measured", "fn": fn, "note": note}


def live(checked, how):
    return {"kind": "live", "checked": checked, "how": how}


def quoted(src, as_of):
    return {"kind": "quoted", "src": src, "as_of": as_of}


def policy():
    return {"kind": "policy"}


def _read(rel):
    try:
        return open(os.path.join(ROOT, rel), encoding="utf-8").read()
    except OSError:
        return ""


def _code(src):
    """Source with comments stripped — prose ABOUT a defect is not the defect."""
    return re.sub(r"/\*[\s\S]*?\*/", "", re.sub(r"^\s*//.*$", "", src, flags=re.M))


# ── the repo-checkable premises ──────────────────────────────────────────────
# Each returns (still_open, detail). A False is not an error: it means the work
# landed and the card has to go.

def p_phantom_tokens():
    bare = []
    for f in ("college_briefing.js", "cpl_funding.js", "map_users.js", "governance.js"):
        bare += re.findall(r"var\(--(brand|link|text)\)", _code(_read(f)))
    return bool(bare), "%d bare phantom-token use(s) in consumer JS" % len(bare)


def p_text_faint_funding():
    n = len(re.findall(r"var\(--text-faint\b", _code(_read("cpl_funding.js"))))
    return n > 0, "%d --text-faint site(s) on Implementation Funding" % n


def p_surface_light():
    src = _read("CPL_Dashboard.html")
    i = src.find(":root")
    light = src[i:src.find("}", i)] if i >= 0 else ""
    defined = bool(re.search(r"--surface-1:\s*#", light))
    return (not defined), ("--surface-1/2 are dark-only" if not defined
                           else "--surface-1/2 already carry light values")


def p_statewide_ring():
    src = _read("prototype/ccr_universe.js")
    draws = bool(re.search(r"nd\.sw\s*&&[\s\S]{0,200}?ctx\.arc", src))
    return (not draws), ("no statewide ring in ccr_universe.js" if not draws
                         else "ccr_universe.js already draws the statewide ring")


def p_phone_opening():
    src = _read("prototype/ccr_universe.js")
    aware = bool(re.search(r"(narrowScreen|matchMedia|innerWidth)[\s\S]{0,400}?sph\.half", src))
    return (not aware), ("sph.half is fixed for every viewport" if not aware
                         else "the opening already reads the viewport")


def p_eths_misprefixed():
    src = _read("unified_courses_data.js")
    if not src:
        return True, "unified_courses_data.js unreadable — premise unverified"
    try:
        rows = json.loads(src[src.index("{"):src.rindex("}") + 1])["rows"]
    except Exception:
        return True, "unified_courses_data.js unparsed — premise unverified"
    PHYS = ("fencing", "swim", "golf", "track", "yoga", "aerobic", "fitness",
            "weight", "aquatic", "tennis", "soccer", "basketball", "volleyball")
    n = sum(1 for r in rows
            if str(r.get("id", "")).startswith("ETHS")
            and any(w in (r.get("title") or "").lower() for w in PHYS))
    return n > 0, "%d ETHS-prefixed physical-activity identities" % n


def p_eths_extension_open():
    """Card 3: do ETHS stand-alones still carry the Exercise Science mix-up?"""
    from _build_crosslist_decision_sheet import PHYSICAL
    try:
        recs = (json.loads(_read("kb/coci_minted_singletons.json") or "{}").get("courses") or {})
    except ValueError:
        return True, "kb/coci_minted_singletons.json unparsed - premise unverified"
    n = sum(1 for k, r in recs.items() if k.split(" ")[0] == "ETHS"
            and any(w in (r.get("common_title") or "").lower() for w in PHYSICAL))
    return n > 0, "%d ETHS stand-alones carry a physical-activity title" % n


def p_cards_current_total():
    """Card 4: does the priority card still call the demonstrated figure Current Total?"""
    src = _code(_read("cpl_funding.js"))
    m = re.search(r"function earnedLineHtml[\s\S]{0,1500}?'\">Current Total: <strong>'", src)
    return bool(m), ("the priority card labels the demonstrated figure Current Total" if m
                     else "the priority card no longer says Current Total")


def p_thankyou_acknowledge():
    """Card 5: does the college thank-you still promise the CO will acknowledge it?"""
    n = len(re.findall(r"will acknowledge it", _code(_read("cpl_funding.js"))))
    return n > 0, "%d thank-you line(s) promise an acknowledgment" % n


def p_explainer_reserve():
    """Card 6: does the explainer's Step two note still say the model reserves funding?"""
    html = _read("funding-model/index.html")
    hit = "reserves the funding an institution demonstrates" in html
    return hit, ("the explainer's Step two note still says the model reserves funding" if hit
                 else "the explainer's Step two note no longer says reserves")


def _next_steps():
    """kb/_jev_next_steps.py, measured once per build (it reads the catalog)."""
    global _NEXT
    try:
        return _NEXT
    except NameError:
        import _jev_next_steps
        _NEXT = _jev_next_steps.measure()
        return _NEXT


def p_ccr_no_gate():
    """Card 8: the course reference still has no measured gate."""
    src = _code(_read("kb/_jev_adjudicate.py"))
    block = re.search(r"GATES = \{[\s\S]*?\n\}", src)
    open_ = bool(block) and '"ccr"' not in block.group(0)
    return open_, ("the ccr has no entry in GATES" if open_ else "the ccr has a gate in GATES")


def p_ccrr_course_pairing():
    """Card 9: pairing by shared course identity is measured and not yet built."""
    built = "def build_course_pairs" in _read("kb/_typesafe_cr_trial.py")
    n = _next_steps()["ccrr"]["course_pairs"]
    return (n > 0 and not built), ("%d course pairs measured; pairing %s" %
                                   (n, "built" if built else "not built"))


def _latest_rel(pattern):
    hits = sorted(glob.glob(os.path.join(ROOT, pattern)))
    return os.path.relpath(hits[-1], ROOT) if hits else ""


# The exhibit scanner's rules that need a person (kb/_jev_adjudicate.py CER_RULES).
CER_JUDGED = ("norm_dup_titles", "bare_vs_leveled", "issuer_variant_cluster",
              "level_notation_twins", "issuer_family_mixed")


def p_cer_judgment_open():
    """Card 10: the latest exhibit scan still reports findings that need judgment."""
    try:
        raw = json.loads(_read(_latest_rel("kb/trail_crew_out/*/findings.json")) or "{}")
    except ValueError:
        return True, "the exhibit findings did not parse - premise unverified"
    rows = raw.get("findings", []) if isinstance(raw, dict) else raw
    n = sum(1 for f in rows if f.get("needs_judgment") and f.get("rule") in CER_JUDGED)
    return n > 0, "%d exhibit findings need judgment" % n


def p_csr_autb_collision():
    """Card 11: AUTB still names two disciplines, with no fan-in declared."""
    try:
        reg = (json.loads(_read("kb/discipline_canonical_subj4.json") or "{}")
               .get("disciplines") or {})
    except ValueError:
        return True, "the CSR registry did not parse - premise unverified"
    names = [d for d, e in reg.items() if (e or {}).get("canonical_subj4") == "AUTB"]
    ruled = len(names) == 2 and all(
        set(names) - {d} <= set((reg[d] or {}).get("fan_in_with") or []) for d in names)
    open_ = len(names) > 1 and not ruled
    return open_, ("AUTB names %d disciplines" % len(names))


def p_sierra_try_both_buttons():
    """Card 12: Try it in still shows both buttons wherever CPL Assistant is hidden."""
    src = _code(_read("sierra_training.js"))
    m = re.search(r"function tryGroup\([\s\S]*?\n  \}", src)
    body = m.group(0) if m else ""
    open_ = ">Sierra</button>" in body and "sierraHost(" not in body and "org-hidden" not in body
    return open_, ("tryGroup draws Sierra and My College whatever the side menu hides" if open_
                   else "tryGroup already reads the side menu")


# Keyed by the item's POSITION on the sheet — the number Sam replies with, and
# the only unique handle (two ESL cards share a `ref`).
EVIDENCE = {
    # 2026-09-27 (S295), the funding asks sheet. The lane carried these as prose
    # ("Unruled, his call"), so no sheet asked them; the coverage audit could not
    # see an ask the lane never marked.
    # Cards 1 and 2 of the published sheet are answered (Sam, 2026-09-27 19:55
    # UTC, read through card 2: year against year, and wait for Pedro), recorded
    # in the lane, and gone from this list (S296): card 1's change landed, and its
    # measured premise would have made the build refuse. What remains is the
    # published sheet's cards 3 and 4, numbered 1 and 2 here.
    1:  [live("2026-09-27", "the funding tab review sheet's stored replies (reviewed through item 7)")],
    2:  [policy()],
    # 2026-09-28 (S296): the ETHS re-mint's dry run measured the defect past the
    # 31 Sam ruled on; the lane (discipline-crosslist) marks the ask.
    3:  [measured(p_eths_extension_open),
         quoted("kb/eths_remint_out/2026-09-28/ruled/report.md", "2026-09-28")],
    # 2026-09-29 (S300): the College Dashboard port's four asks. S299 carried
    # two of them in its handoff; the lane marks all four.
    4:  [measured(p_cards_current_total),
         quoted("docs/ui_mockup_lessons.md (the 2026-09-28 mockup data)", "2026-09-29")],
    5:  [measured(p_thankyou_acknowledge)],
    6:  [measured(p_explainer_reserve)],
    7:  [live("2026-09-29", "cpl_funding_config, Scenarios 1 and 2: the timeline's August 2027 "
              "line and the Minimum Conditions introduction")],
    # 2026-09-29 (S301): Sam's ask of 28 September, a Jev next step per reference.
    # Every count on these four cards is recomputed here by kb/_jev_next_steps.py.
    8:  [measured(p_ccr_no_gate),
         quoted("kb/receipts/jev_ccr_title_rung_calibration_2026-09-22_s282.json", "2026-09-22")],
    9:  [measured(p_ccrr_course_pairing)],
    10: [measured(p_cer_judgment_open),
         live("2026-09-29", "the database's decision tables: cr_reference_decisions and "
              "kb_curation are the only two")],
    11: [measured(p_csr_autb_collision)],
    # The Sierra Training round-1 port (#1733) left two calls for Sam.
    12: [measured(p_sierra_try_both_buttons)],
}

PROVENANCE = {
    "measured": "Measured from the repo when this sheet was built.",
    "live": "Checked against the live system on %s. Re-verify before ruling — "
            "this builder cannot reach it.",
    "quoted": "Quoted from %s as of %s. Second-hand: nobody re-checked it for "
              "this sheet.",
    "policy": "A judgment, not a measurement — nothing here to go stale.",
}


def provenance_line(ev):
    bits = []
    for e in ev:
        k = e["kind"]
        if k == "live":
            bits.append(PROVENANCE[k] % e["checked"])
        elif k == "quoted":
            bits.append(PROVENANCE[k] % (e["src"], e["as_of"]))
        else:
            bits.append(PROVENANCE[k])
    return " ".join(bits)


def check_premises(I):
    """Run every measured premise. Returns the cards whose premise has moved."""
    settled = []
    for n, it in enumerate(I, 1):
        for e in EVIDENCE.get(n, []):
            if e["kind"] != "measured":
                continue
            still_open, detail = e["fn"]()
            if not still_open:
                settled.append((n, it["title"], detail))
    return settled



CH_LATER = ('Later', 'later')


# ── the coverage audit ───────────────────────────────────────────────────────
def lanes_with_asks():
    out = {}
    for p in sorted(glob.glob(os.path.join(LANES, '*.md'))):
        text = open(p, encoding='utf-8').read()
        n = len(NEEDS.findall(text))
        if n:
            out[os.path.splitext(os.path.basename(p))[0]] = n
    return out


def audit_coverage(items):
    """Every lane carrying a NEEDS-SAM marker is covered or dismissed by name."""
    found = lanes_with_asks()
    covered = {it['lane'] for it in items}
    missing = sorted(set(found) - covered - set(NO_OPEN_ASK))
    stale = sorted(covered - set(found))
    dead = sorted(set(NO_OPEN_ASK) - set(found))
    return found, missing, stale, dead


# ── the items ────────────────────────────────────────────────────────────────
def items():
    """The cards: every ask a lane marks, one card each.

    2026-09-27 (S295): Sam answered all eight cards of the 2026-09-27 open-asks
    sheet that afternoon, and each ruling left with its lane's marker (#1716). The
    funding lane's asks follow here. The lane had carried them as prose, so the
    coverage audit never saw them; marking them is what brought them onto a sheet.
    """
    I = []

    I.append({
        'lane': 'implementation-funding',
        'title': 'The last three sections of your funding tab review',
        'ref': 'implementation-funding ⓪b · the 2026-09-24 tab review sheet',
        'facts': (
            "You reviewed items 1 to 7 of the <a href=\"https://claude.ai/artifact/Ayp39ynE6Yw9cvsvQbH7eu\">"
            "funding tab review</a> on 24 September, and sessions carried out each change. Items 8 to 10 "
            "carry no verdict: the <em>Funding window</em> (the year pickers, the Annual and Combined "
            "switch, and the reading note), the <em>Funding Breakdown</em> (the ledger lines and the total "
            "for institution awards), and <em>How an allocation is computed</em> (FTES share times priority "
            "share times the window's funding, then the base, the cap and the noncredit sentences)."),
        'why': (
            "All three show on the public explainer, and they are the only sections of the tab you have "
            "not read through."),
        'rec': (
            "<strong>Let the three stand</strong>, and change any line in place on the review sheet if it "
            "reads wrong. <em>It might be wrong if</em> the Annual view's new year-against-year percent "
            "reads differently from the Funding window's reading note, which describes it."),
        'chips': chips(('Let them stand', 'leave'), ('I will review them there', 'review'), CH_LATER),
    })

    I.append({
        'lane': 'implementation-funding',
        'title': "The explainer's footer: keep it whole or split it",
        'ref': 'implementation-funding ⑧ · funding-model/index.html',
        'facts': (
            "The explainer's footer holds two paragraphs: where the figures come from, the committed FTES "
            "roster for 118 institutions and the tab's saved settings; and the disclaimer, <em>&ldquo;a "
            "working model for discussion, not adopted policy.&rdquo;</em> Curators can hide or reword every "
            "section of the page except this footer, by design, and a test pins that. The question from "
            "9 September: should the first paragraph become editable while the disclaimer stays fixed?"),
        'why': (
            "The disclaimer has to show wherever the page shows, and the first paragraph names a roster "
            "count that will change."),
        'rec': (
            "<strong>Keep the footer whole and fixed.</strong> The named sources already appear in the "
            "institution table's Sources line, which curators can hide. <em>It might be wrong if</em> you "
            "want to reword the first paragraph, its count of 118 institutions among it, without waiting "
            "on a code change."),
        'chips': chips(('Keep it whole', 'keep'), ('Split it', 'split'), CH_LATER),
    })

    I.append({
        'lane': 'discipline-crosslist',
        'title': 'The Exercise Science mix-up beyond the 31',
        'ref': 'discipline-crosslist item 3 · kb/eths_remint_out/2026-09-28/ruled/report.md',
        'facts': (
            "Your 22 September ruling re-mints 31 corroborated identities that the catalog files under "
            "Ethnic Studies because the colleges' code ES means Exercise Science. Measured on the catalog "
            "files, the same mix-up reaches 40 stand-alone identities (<em>Adapted Water Aerobics</em>, "
            "<em>Advanced Techniques and Strategies of Water Polo</em>, <em>Intermediate Trail Running</em>) "
            "and 3 corroborated rows the title list missed (<em>Self Defense for Women</em>, <em>Intermediate "
            "Springboard Diving</em>, <em>Physical Education in the Elementary School</em>). Three of these 43 "
            "have no second signal beside the title and would hold. Another 42 ETHS identities are already "
            "merged under Kinesiology parents, 11 under the 31 and 31 under KINE, ATHL or PEDS parents; they "
            "display under the right parent, and only their own ids read ETHS."),
        'why': (
            "Until they move, 42 of the 43 file under Ethnic Studies wherever the catalog shows a "
            "discipline. The re-mint script already carries each group, and it moves none of them "
            "without your ruling."),
        'rec': (
            "<strong>Re-mint the 43 the way the 31 move</strong>, and leave the 42 merged ones on their "
            "ids. <em>It might be wrong if</em> you want every id in the catalog to name its discipline; "
            "then the 42 move too."),
        'chips': chips(('Re-mint the 43', 'remint'), ('All 85, the merged ones too', 'all'),
                       ('Leave them', 'leave'), CH_LATER),
    })

    # ── the College Dashboard port's asks (S300, 2026-09-29) ─────────────────
    I.append({
        'lane': 'implementation-funding',
        'title': 'Current Total now names two figures',
        'ref': 'implementation-funding · cpl_funding.js earnedLineHtml() and the Curr columns',
        'facts': (
            "Since the College Dashboard, a Curr column shows the funding an institution qualifies for: "
            "$0 until it meets all three minimum conditions. Each Priority Outcomes card still reads "
            "<em>Current Total: $X of $Y Total Possible</em>, your 31 August label, and its $X is what "
            "institutions have demonstrated, the conditions aside. In the 28 September mockup data the "
            "cards added to $758,725 while the Statewide row's Curr Total Funds read $338. The download "
            "carries both, as <em>Current total</em> and <em>Demonstrated</em>."),
        'why': (
            "A reader who sees Current Total on a card and Curr Total Funds on the Statewide row will "
            "expect one figure."),
        'rec': (
            "<strong>The cards say Demonstrated</strong>: <em>Demonstrated: $X of $Y Total Possible</em>. "
            "Demonstrated is the statute's verb, §78093.2(d)(2), and the cards keep reporting the "
            "outcomes. <em>It might be wrong if</em> you want every figure on screen to be funding a "
            "college can receive today; then the cards read the qualifying figure too."),
        'chips': chips(('Cards say Demonstrated', 'demonstrated'), ('Cards read the qualifying figure', 'qualifying'),
                       ('Both stand as they are', 'both'), CH_LATER),
    })

    I.append({
        'lane': 'implementation-funding',
        'title': "The college's thank-you still promises the CO will acknowledge it",
        'ref': 'implementation-funding · cpl_funding.js optinAffordanceHtml()',
        'facts': (
            "When an administrator confirms participation, the page thanks them: <em>&ldquo;The "
            "Chancellor&rsquo;s Office will acknowledge it; your college is counted as participating in "
            "the meantime.&rdquo;</em> The form's note says their name and email are recorded "
            "<em>&ldquo;for the Chancellor&rsquo;s Office to acknowledge.&rdquo;</em> Your 28 September "
            "ruling removed Mark confirmed and the CO's Confirm, and the review lane already offers only "
            "Reject on a self-attested request (S298's port). No acknowledgment step remains."),
        'why': "Colleges read both lines, and the promised step no longer exists.",
        'rec': (
            "<strong>Say what happens.</strong> The thank-you: <em>&ldquo;Thank you. Your participation "
            "is confirmed, and your college counts as participating from today.&rdquo;</em> The note: "
            "<em>&ldquo;Your name and email are recorded for the Chancellor&rsquo;s Office and are not "
            "shown publicly.&rdquo;</em> <em>It might be wrong if</em> the Chancellor's Office will write "
            "to each college that confirms; then the thank-you should say so."),
        'chips': chips(('Use these words', 'use'), ('Keep as is', 'keep'), CH_LATER),
    })

    I.append({
        'lane': 'implementation-funding',
        'title': "The explainer's Step two note and the table's heading",
        'ref': 'implementation-funding · funding-model/index.html (public)',
        'facts': (
            "The public explainer's Step two note reads: <em>&ldquo;Each institution keeps its full award "
            "while it meets the baseline. The model reserves the funding an institution demonstrates for "
            "that institution, and the institution receives it once it confirms local "
            "participation.&rdquo;</em> Three words have moved: Minimum Conditions replaced baseline, "
            "your ruling took every reserve figure off the screen, and funding now waits on all three "
            "conditions rather than confirmation alone. The table's heading, <em>Max award by "
            "institution</em>, now sits over the Curr columns as well."),
        'why': "The explainer is the page colleges read, and public wording comes to you before it ships.",
        'rec': (
            "<strong>The note:</strong> <em>&ldquo;Every institution keeps its full max award. The model "
            "counts every outcome an institution demonstrates toward that award, and the institution "
            "receives the funding once it meets all three minimum conditions.&rdquo;</em> <strong>The "
            "heading:</strong> <em>Funding by institution</em>. <em>It might be wrong if</em> you want the "
            "note to name the three conditions; they are listed just above it."),
        'chips': chips(('Use both', 'both'), ('The note only', 'note'), ('Keep as is', 'keep'), CH_LATER),
    })

    I.append({
        'lane': 'implementation-funding',
        'title': 'Two of your saved texts use words you have since retired',
        'ref': 'implementation-funding · cpl_funding_config, Scenarios 1 and 2',
        'facts': (
            "Both scenarios store the same two lines. The timeline's August 2027 entry reads "
            "<em>&ldquo;Undispersed Funds Rolled to Year 2 and Releveled&rdquo;</em>; on 25 September you "
            "ruled that year-one funding carries forward to the same college and is not releveled. The "
            "Minimum Conditions introduction reads <em>&ldquo;Baseline outcomes to accrue implementation "
            "funding:&rdquo;</em>; you replaced baseline with Minimum Conditions on 28 September, and "
            "accrue is the banking sense your vocabulary map retires. The code's defaults already read "
            "correctly; your saved text overrides them."),
        'why': "Both lines show on the public explainer, in both scenarios.",
        'rec': (
            "<strong>A session writes both, in both scenarios, with a receipt of the old text:</strong> "
            "<em>&ldquo;Remaining Funds Carried Forward to Year 2&rdquo;</em> and <em>&ldquo;Minimum "
            "conditions to qualify for implementation funding:&rdquo;</em> <em>It might be wrong if</em> "
            "you would rather edit them yourself on the tab; then choose that."),
        'chips': chips(('Write both for me', 'write'), ("I'll edit them on the tab", 'self'), CH_LATER),
    })

    # ── Jev: a next step per reference (S301, Sam's ask of 2026-09-28) ───────
    # Every number below is measured at build time (kb/_jev_next_steps.py), so a
    # card cannot quote a count that has moved while the sheet waited.
    N = _next_steps()
    cc, cr, ce, cs = N["ccr"], N["ccrr"], N["cer"], N["csr"]
    from _build_crosslist_decision_sheet import measure as crosslist_measure
    kind_c = crosslist_measure()["kinds"]["C"]

    I.append({
        'lane': 'common-cr-reference',
        'title': 'The course reference: ask where a course belongs',
        'ref': 'common-cr-reference · the CCR ladder · kb/_jev_next_steps.py',
        'facts': (
            f"On 22 September you ruled {cc['scored']} of the 50 title-rung cards: {cc['moves']} moves and "
            f"{cc['keeps']} keeps. Jev ranked them well (AUC {cc['auc']:.3f}), and no cut-off separates the two: "
            f"your lowest-scored move sat at {cc['lowest_move_p']:.2f} and your highest-scored keep at "
            f"{cc['highest_keep_p']:.2f}. Jev was asked whether a title matches its discipline, and each move you "
            "made answered where the course belongs: Photography out of Art, Theater out of Music twice, Ethnic "
            "Studies out of Sociology, Office Technology out of Computer Information Systems. Measured today, the "
            f"course's own member colleges name {cc['destinations_named']} of the {cc['destinations']} destinations "
            f"you gave, and their plurality alone picks {cc['plurality_matches']} of them (Photography, 7 members "
            "against Art's 5), so the title and the description settle the rest. The cross-list sheet of 22 "
            f"September holds the population this question fits: {kind_c:,} identities whose member colleges "
            "genuinely disagree (its kind C)."),
        'why': (
            "The course reference is the largest of the four. A sitting spent on the title question calibrates "
            "nothing, because your answers are about placement."),
        'rec': (
            "<strong>Ask where the course belongs.</strong> Jev chooses among the disciplines the course's member "
            "colleges name, with the title and the description as evidence, and a session scores that choice "
            "against your 26 answers before you see a card; it costs cents and writes nothing. If it agrees with "
            f"you, the next sitting takes 50 of the {kind_c:,}, most member rows first, each card offering Keep, "
            "Move or Cross-list with Jev's choice selected. <em>It might be wrong if</em> you want the ladder as "
            "designed first: rung 2 re-asks the title question with descriptions added."),
        'chips': chips(('Ask where it belongs', 'placement'), ('Keep the ladder', 'ladder'), CH_LATER),
    })

    I.append({
        'lane': 'common-cr-reference',
        'title': 'The credit recommendation reference: a second way to pair wordings',
        'ref': 'common-cr-reference · kb/_typesafe_cr_trial.py build_pairs() · kb/_jev_next_steps.py',
        'facts': (
            "Your 51 verdicts of 20 September gave this reference the only measured gate: above 0.85, Jev agreed "
            "with you 25 times in 25. Those pairs came from grouping wordings under a shared published line, C-ID "
            f"or course identity, and that way in is spent: {cr['anchored_pairs']} pairs, 51 of them ruled. Of the "
            f"{cr['groups']:,} recommendation groups, {cr['rung5_groups']:,} stand alone. Pairing groups that "
            f"articulate to the same course identity yields {cr['course_pairs']} pairs over {cr['course_groups']} "
            f"groups, {cr['course_rung5_groups']} of them among the stand-alones ({cr['course_rung5_rows']:,} "
            f"articulation rows), nearly twice the {cr['anchored_rows']:,} rows your first sitting settled. One "
            "guard comes first: a credential that articulates every line to one course, as POST does to AJ 110, "
            "pairs unrelated lines, and the credential's course count is the test that catches it. Another "
            f"{cr['unanchored_clusters']} small clusters share a wording with no anchor ({cr['unanchored_groups']} "
            f"groups, {cr['unanchored_rows']} rows)."),
        'why': (
            "This is the one reference with a measured gate, so each verdict here settles the most rows: about 29 "
            "on the first sitting."),
        'rec': (
            "<strong>Pair by course, with the course-count guard,</strong> and run Jev on the new pairs, the "
            f"{cr['unanchored_clusters']} unanchored clusters and the {cr['anchored_pairs'] - 51} newer anchored "
            "pairs under the 0.85 gate. A sheet of 40 to 60 then comes to you, most rows first, with Jev's "
            "proposal selected. <em>It might be wrong if</em> you would rather finish the head by hand: the top 50 "
            "wordings carry half of all articulations."),
        'chips': chips(('Pair by course', 'course'), ('Head by hand first', 'head'), CH_LATER),
    })

    by = ce['jev_by_rule']
    I.append({
        'lane': 'common-cr-reference',
        'title': 'The exhibit reference: the same questions as July, and nowhere to keep the answers',
        'ref': 'common-cr-reference · ' + (ce['file'] or 'kb/trail_crew_out/'),
        'facts': (
            "The exhibit scanner ran today for the first time since 10 July. Its findings fell from 239 to "
            f"{ce['findings']}, because July's clean renames cleared the roman numerals and the duplicate titles. "
            f"The {ce['jev_askable']} that need judgment are the ones July found: {by.get('issuer_variant_cluster', 0)} "
            "issuer names that look like spellings of one organization (<em>International Code Council</em> "
            f"beside <em>International Code Council (ICC)</em>), {by.get('level_notation_twins', 0)} titles that "
            f"differ only in how the level is written, {by.get('issuer_family_mixed', 0)} credential families "
            f"carrying more than one issuer, and {by.get('bare_vs_leveled', 0)} bare titles beside leveled "
            f"siblings. The other {ce['findings'] - ce['jev_askable']} are mechanical under your canon. The exhibit "
            "reference has no decisions store, so a ruling has nowhere to live, and a new store is a write surface "
            "that goes through Governance first (Rule 10(a3))."),
        'why': (
            "The exhibit reference is the vocabulary MAP will prompt with at data entry, so each spelling left "
            "standing becomes a fork in tomorrow's data."),
        'rec': (
            "<strong>Governance maps a decisions store first.</strong> Jev then reads the "
            f"{ce['jev_askable']} as a calibration sitting, with no gate yet, and they come to you on one sheet "
            "with each issuer name checked against the credential registry you shared on 16 September. The "
            "mechanical fixes go through the clean-rename path July's did, under a receipt. <em>It might be wrong "
            "if</em> you want the issuer names settled against the registry before any sitting; the national "
            "sample holds 974 of its 6,738 credentials."),
        'chips': chips(('Store first, then the sitting', 'store'), ('Registry first', 'registry'), CH_LATER),
    })

    jb = cs['jev_by_rule']
    autb = next((c for c in cs['collisions'] if c['code'] == 'AUTB'), {})
    I.append({
        'lane': 'common-cr-reference',
        'title': 'The subject reference: the backlog was a misread, and one code names two disciplines',
        'ref': 'common-cr-reference · ' + (cs['file'] or 'kb/csr_out/') + ' · PR #1735',
        'facts': (
            "The subject scanner read the anchor's old key format, so it compared each anchor's local code and "
            "never its identifier. Fixed today (#1735): 121 of its 136 questions for Jev were anchors whose "
            "identifiers already carry the canonical code, or languages that keep their own code under Foreign "
            "Languages by design. Your FTVE ruling of 3 September also read as a collision and now reads as "
            f"ruled. What remains is {cs['jev_askable']} questions for Jev ({jb.get('cs6_weak_mnemonic', 0)} codes "
            "that are hard to recognize from the discipline's name, and Commercial Music and Health Information "
            "Technology leaving an official CCN prefix unused) and one real collision. AUTB is Auto Body "
            f"Technology's code ({autb.get('mids_b') or 221} identities), and Agricultural Business and Related "
            "Services took it from its own two: <em>Supervision and Management in Agriculture</em> carries "
            "AUTB M1006 because the subject map reads its college's two-letter code AB as Auto Body, and "
            "<em>Import Body Customizing</em>, an auto body course, is filed under Agricultural Business."),
        'why': (
            "Every new identifier is minted from these codes, so a shared code reaches every course minted after "
            "it. Your two-letter gate of 22 September stops new mints from repeating this; these two stay until "
            "they move."),
        'rec': (
            "<strong>File <em>Import Body Customizing</em> under Auto Body Technology, give Agricultural Business "
            "its own code, AGAB, beside the agriculture umbrella's other codes, and re-mint <em>Supervision and "
            "Management in Agriculture</em> under it through the re-mint playbook.</strong> The "
            f"{cs['jev_askable']} then go to Jev and come to you ranked on a short sheet. <em>It might be wrong "
            "if</em> Agricultural Business belongs inside Agriculture itself; then its course re-mints under AGRI."),
        'chips': chips(('As proposed', 'proposed'), ('Fold it into Agriculture', 'fold'), CH_LATER),
    })

    # ── Sierra Training's round-1 port left two calls (S300, #1733) ──────────
    I.append({
        'lane': 'sierra-retrieval-corpus',
        'title': 'Sierra Training: the Try it in buttons',
        'ref': 'sierra-retrieval-corpus · sierra_training.js tryGroup() and sierraHost() · #1733',
        'facts': (
            "Round 1 shipped on 29 September as you approved it: <em>Try it in: Sierra · My College</em>. The "
            "Sierra button opens the tab the side menu calls CPL Assistant. Where a site hides that tab, the "
            "Sierra button already falls back to My College, which mounts the same assistant, so both buttons "
            "open the same place there."),
        'why': (
            "A reader who looks for a Sierra tab in the side menu finds CPL Assistant, and two buttons that open "
            "one place read as a fault."),
        'rec': (
            "<strong>Keep the word Sierra, and show only My College where CPL Assistant is hidden.</strong> The "
            "assistant is Sierra in both tabs. <em>It might be wrong if</em> you want each button to name the tab "
            "it opens; then the first reads CPL Assistant."),
        'chips': chips(('As proposed', 'proposed'), ('Name it CPL Assistant', 'rename'), CH_LATER),
    })
    return I


def build(check_only=False):
    I = items()
    found, missing, stale, dead = audit_coverage(I)

    # ── every card declares its evidence ─────────────────────────────────────
    undeclared = [n for n in range(1, len(I) + 1) if not EVIDENCE.get(n)]
    if undeclared:
        print("REFUSING TO BUILD — these cards declare no evidence: %s\n"
              "Every card says what its premise rests on: measured(), live(), "
              "quoted() or policy(). A card with none is a claim nobody owns."
              % ", ".join(map(str, undeclared)), file=sys.stderr)
        return 1

    # ── and every measured premise is re-run, here, now ──────────────────────
    settled = check_premises(I)
    if settled:
        print("REFUSING TO BUILD — these cards ask about work that is already "
              "done. Measured just now:", file=sys.stderr)
        for n, title, detail in settled:
            print("  %2d. %s\n      -> %s" % (n, title, detail), file=sys.stderr)
        print("\nRemove the card, or correct it if the premise changed rather "
              "than closed. This guard exists because four cards on the "
              "2026-09-22 sheet asked Sam to rule on work that had already "
              "shipped — one of them citing his own ask, by date, in the very "
              "file that implemented it.", file=sys.stderr)
        return 1

    if missing:
        print("REFUSING TO BUILD — these lanes carry a NEEDS-SAM marker that no item "
              "covers and no dismissal names:", file=sys.stderr)
        for lane in missing:
            print(f"  · {lane} ({found[lane]} marker(s))", file=sys.stderr)
        print("\nAdd an item with 'lane': '<name>', or name it in NO_OPEN_ASK with a "
              "reason. A sheet that silently misses a lane is the failure this guard "
              "exists for.", file=sys.stderr)
        return 1

    for lane in stale:
        print(f"note: item(s) cover '{lane}', which carries no NEEDS-SAM marker — "
              f"check the lane still holds the ask.", file=sys.stderr)
    for lane in dead:
        print(f"note: NO_OPEN_ASK names '{lane}', which carries no marker — "
              f"the dismissal can go.", file=sys.stderr)

    lanes = sorted({it['lane'] for it in I})
    if not I:
        # Nothing waits on Sam that a lane has marked. Write no sheet: an empty
        # one would read as a decision to make, and the last published sheet
        # keeps his answers in its own store.
        print("coverage ok — nothing outstanding: no lane carries a NEEDS-SAM "
              "marker, so no sheet is written")
        return 0
    if check_only:
        kinds = {}
        for n in range(1, len(I) + 1):
            for e in EVIDENCE[n]:
                kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
        print(f"coverage ok — {len(I)} items across {len(lanes)} lanes; "
              f"{len(found)} lane(s) carry a marker, {len(NO_OPEN_ASK)} dismissed by name")
        print("evidence: " + " · ".join("%s %d" % (k, v) for k, v in sorted(kinds.items()))
              + "  (every measured premise re-checked and still open)")
        return 0

    framing = (
        "Twelve questions wait on you. Cards 1 to 7 are the 29 September sheet's, unchanged: you pressed "
        "Complete there without touching a card, so none of them is reviewed yet (cards 1 and 2 are also "
        "cards 3 and 4 of the 27 September sheet; answer them once). Cards 8 to 11 answer your ask of 28 "
        "September, a next step for each Jev reference: courses, credit recommendations, exhibits and "
        "subjects. Card 12 is Sierra Training's Try it in buttons.")
    counts = (f"{len(I)} items across {len(lanes)} lanes · "
              f"every lane carrying an open ask is covered, by build-time audit")

    # The reader sees where each claim came from, in their own words.
    I = [dict(it, facts=it["facts"]
              + '<p class="prov"><em>' + m.E(provenance_line(EVIDENCE[n]))
              + '</em></p>')
         for n, it in enumerate(I, 1)]

    out = m.build_sheet(
        "Everything outstanding for you", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(lanes)} lanes · {len(out):,} bytes "
          f"→ {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build(check_only='--check' in sys.argv[1:]))
