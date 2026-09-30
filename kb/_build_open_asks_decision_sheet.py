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

Sheet 5 (S305, 2026-09-30, SHEET_ID 2026-09-30-open-asks-5): five cards, the Scenario 2 narrated
draft (card 8's review), the Reporting box's three calls and the "units waiting" label. Published
at https://claude.ai/artifact/4PhPMFSvUVJLxrV7PazTQr (capabilities db + comments); read its replies first.

Sheet 4 (S303, 2026-09-29, SHEET_ID 2026-09-29-open-asks-4): nine cards from the S303
handoff's list, less the gray-cell question Sam settled in session (round 9). JUST THE ITEMS:
no framing, count line or how-to box (Sam, 2026-09-29). Sam answered all nine that
evening (22:26Z, through 9, each his own call); the lanes record them. Published at
https://claude.ai/artifact/PzVQ6KftWPtbk8afPXbZmf (capabilities db + comments). Read its
replies before anything else; sheet 3's store keeps his eighteen answers, never republish onto it.

Published: https://claude.ai/artifact/XzQMks96QszUDAyXADP3Ag (2026-09-29, S301, SHEET_ID
2026-09-29-open-asks-3, capabilities db + comments, eighteen cards: sheet 2's twelve at the same
positions, two unit-range calls and the narrated draft's four). Its store keeps his answers;
never republish onto it. Sheet 2,
https://claude.ai/artifact/9Wikhf54XyJgWXDEw5AK7G (SHEET_ID 2026-09-29-open-asks-2, twelve
cards), held no replies when sheet 3 replaced it. Its cards 1-7 are the seven of
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
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-30-open-asks-5.html')
SHEET_ID = '2026-09-30-open-asks-5'

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


# The unit range (Sam, 2026-09-27: units never split an identity), read from the
# CR Reference worklist. Not memoized: the coverage fixtures swap _read per call.
_UNIT_LEAD = re.compile(r"^\s*[\d.]+(?:\s*(?:or|-|\u2013|to)\s*[\d.]+)?\s*(?:hours?|units?)\s+in\s+", re.I)


def _crr_units():
    try:
        groups = json.loads(_read("kb/cr_reference_worklist.json") or "{}").get("groups", [])
    except ValueError:
        groups = []
    vary = [g for g in groups if g.get("units_differ")]
    worded = [g for g in vary if g.get("canonical_source") in ("most_colleges", "published_statewide")
              and _UNIT_LEAD.match(g.get("canonical") or "")]
    held = [g for g in vary if g.get("rung") == 4 and "units" in (g.get("screens_objecting") or [])]
    return {"vary": len(vary), "worded": len(worded), "held": len(held),
            "published": sum(1 for g in worded if g.get("canonical_source") == "published_statewide")}


def p_crr_canonical_units():
    """A wording canonical still states one unit figure over wordings that differ."""
    n = _crr_units()["worded"]
    return n > 0, "%d wording canonicals state one figure over wordings that differ" % n


def p_crr_rung4_units_screen():
    """Units still hold a rung-4 twin merge for a curator."""
    open_ = "if rung == 4 and units_differ:" in _read("kb/_build_cr_reference.py")
    return open_, ("the rung-4 units screen is in the builder" if open_
                   else "the rung-4 units screen is gone")


# The narrated draft of CPL Funding in Motion (Sam, 2026-09-27: it comes back
# to him before the explainer links it), read from the committed files.
def p_video_narrated_unlinked():
    """The explainer still does not link the narrated cut."""
    page = _read("funding-model/index.html")
    open_ = "Narrated_Draft" not in page and "funding_in_motion_n1" not in page
    return open_, ("the explainer does not link the narrated cut" if open_
                   else "the explainer links the narrated cut")


def _video_scene(name):
    try:
        scenes = json.loads(_read("prototype/funding_video/narration_s1.json") or "{}").get("scenes", [])
    except ValueError:
        scenes = []
    return next((s for s in scenes if s.get("scene") == name), {})


def p_video_timing_trails():
    """The Timing scene's two-year line still trails its words (its cue is skipped)."""
    open_ = any(c.get("skip") and (c.get("word") or "").startswith("The full two-year amount")
                for c in _video_scene("Timing").get("cues", []))
    return open_, ("the two-year amount's cue is skipped" if open_
                   else "the two-year amount's cue is pinned")


def p_video_sample_unnarrated():
    """The Targets scene's voice still does not name Sample College."""
    text = _video_scene("Targets").get("text", "")
    open_ = bool(text) and "Sample College" not in text
    return open_, ("the Targets narration does not name Sample College" if open_
                   else "the Targets narration names Sample College")


_ZERO_RANGE = re.compile(r"\(0\s*[\u2013-]\s*[\d.]+ units?\)|^0(?:\.0+)?\s+hours?\s+in\s", re.I)


def p_crr_zero_hours():
    """Sheet 4, card 3: CR Reference groups still name a range or a figure of 0."""
    try:
        groups = json.loads(_read("kb/cr_reference_worklist.json") or "{}").get("groups", [])
    except ValueError:
        return True, "kb/cr_reference_worklist.json unparsed - premise unverified"
    n = sum(1 for g in groups if _ZERO_RANGE.search(g.get("canonical") or ""))
    return n > 0, "%d CR Reference group(s) named with a figure of 0" % n


# The narrated Scenario 2 draft (sheet 4 card 8, S305): the explainer must not
# link it until Sam approves the read AND the Chancellor finalizes Scenario 2.
def p_video_n2_unlinked():
    """The explainer does not link the Scenario 2 narrated draft."""
    page = _read("funding-model/index.html")
    open_ = "funding_in_motion_n2" not in page and "Scenario_2_Narrated" not in page
    return open_, ("the explainer does not link the Scenario 2 narrated draft" if open_
                   else "the explainer links the Scenario 2 narrated draft")


# The Reporting box (sheet 4 card 2): nothing writes expenditures yet.
def p_reporting_box_unbuilt():
    """No consumer writes cpl_funding_reports yet."""
    n = sum(_code(_read(f)).count("cpl_funding_reports") for f in ("cpl_funding.js", "college_briefing.js"))
    return n == 0, ("no tab reads or writes cpl_funding_reports" if n == 0
                    else "%d reference(s) to cpl_funding_reports in the tabs" % n)


# My College: two different figures carry the one label "units waiting".
def p_units_waiting_twice():
    """college_briefing.js labels two different figures 'units waiting'."""
    src = _code(_read("college_briefing.js"))
    dormant = bool(re.search(r'fmt\(dormant\)\s*\+\s*" units waiting"', src))
    art = bool(re.search(r'fmt\(st\.articulatedWaiting\)\s*\+\s*" units waiting', src))
    return dormant and art, ("both figures read 'units waiting'" if dormant and art
                             else "the two figures no longer share the label")


# ⚠️ EACH CARD CARRIES ITS OWN EVIDENCE (S302, 2026-09-29), under the key
# `evidence`. Until then a dict keyed by the card's POSITION held it, and every
# pull request that dropped one card renumbered every card after it, so two
# parallel verdict PRs could not both land without a hand-merged renumbering.
# The position is still the number Sam replies with; it is simply no longer a
# key anything else depends on.
def evidence_of(I):
    """The evidence each card declares, by the number the sheet shows it under."""
    return {n: list(it.get("evidence") or []) for n, it in enumerate(I, 1)}


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
        for e in it.get("evidence") or []:
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

    2026-09-29 (S302): Sam answered all eighteen cards of sheet 3
    (`2026-09-29-open-asks-3`, `replies/done` through 18 at 12:39Z), and each
    ruling left with its lane's marker in one pull request. The predicates the
    cards rested on stay above: a later card may rest on the same premise, and
    the fixtures in `tests/open_asks_sheet_coverage_test.py` keep each one honest
    both ways.

    A card is a dict: lane, title, ref, facts, why, rec, chips, and `evidence`,
    a list of measured() / live() / quoted() / policy() entries.
    """
    I = []

    # Sheet 4's nine cards (S303) left with their rulings: Sam answered all nine
    # on 2026-09-29 (through 9, each his own call), and each lane records its
    # ruling in the same change. p_crr_zero_hours stays for a later card.

    # ── Sheet 5 (S305, 2026-09-30) ──────────────────────────────────────────
    N2 = "https://cpl-initiative.github.io/cpl-project-tracker/prototype/funding_video/funding_in_motion_n2.html"
    MOCK = "https://claude.ai/artifact/BV2Xqt49vCYicX5xdEKP5E"
    I.append({
        'lane': 'implementation-funding',
        'title': 'The Scenario 2 narrated draft',
        'ref': 'implementation-funding · sheet 4 card 8 · prototype/funding_video/README.md',
        'facts': (
            "The <a href=\"%s\">Scenario 2 narrated draft</a> (3:05) is built from draft 4, which you "
            "approved for Scenario 1. Eight scenes read word for word as draft 4, because Scenario 2 gives "
            "them the same figures. Two scenes are Scenario 2's own. The priorities scene says <em>\"Two "
            "priorities carry the funding, in equal shares\"</em> and <em>\"the Chancellor's Office reports on "
            "career attainment together with the innovation projects, in qualitative terms.\"</em> The Targets "
            "scene gives Sample College's Access target, <em>\"about sixty-seven FTES, behind about a hundred "
            "seventy thousand dollars.\"</em> The voice never names the scenario; the picture does. The "
            "Scenario 2 introduction now shows 67.2 FTES, the model's figure, where it showed 67.1." % N2),
        'why': (
            "The explainer links a narrated cut only after you approve it, and Scenario 2's only after the "
            "Chancellor finalizes it."),
        'rec': (
            "<strong>Approve the read</strong>, and link it from the explainer's Scenario 2 view once the "
            "Chancellor finalizes Scenario 2. <em>It might be wrong if</em> the voice should say Scenario 2 "
            "aloud; then the title line takes the words and the read is redone."),
        'chips': chips(('The read works', 'approve'), ('Changes, in my note', 'changes'), CH_LATER),
        'evidence': [measured(p_video_n2_unlinked), policy()],
    })
    I.append({
        'lane': 'implementation-funding',
        'title': 'How often a college reports its expenditures',
        'ref': 'implementation-funding · sheet 4 card 2 · the Reporting box mockup',
        'facts': (
            "You ruled that the Reporting box starts with spending. The <a href=\"%s\">mockup</a> records "
            "one report per quarter, the cadence of NOVA's expenditure reports, from the first release in "
            "February 2027 through June 2028: six quarters." % MOCK),
        'why': "The period decides the table's key and how often reviewers record a report.",
        'rec': (
            "<strong>Quarterly.</strong> A NOVA import later fills the same periods. <em>It might be wrong "
            "if</em> the Chancellor's Office asks colleges for one report a year; then the box carries a "
            "fiscal year and six reports become two."),
        'chips': chips(('Quarterly', 'quarterly'), ('Once a year', 'yearly'), CH_LATER),
        'evidence': [measured(p_reporting_box_unbuilt), policy()],
    })
    I.append({
        'lane': 'implementation-funding',
        'title': 'Which expenditure categories the box carries',
        'ref': 'implementation-funding · sheet 4 card 2 · the Reporting box mockup',
        'facts': (
            "The mockup carries NOVA's eight categories, the object codes every district reports by: 1000 "
            "instructional salaries, 2000 noninstructional salaries, 3000 employee benefits, 4000 supplies "
            "and materials, 5000 other operating expenses and services, 6000 capital outlay, 7000 other outgo, "
            "and indirect costs."),
        'why': "The categories become the table's columns, and a NOVA import can fill only the ones it shares.",
        'rec': (
            "<strong>All eight</strong>, so a college reports in the categories its business office already "
            "uses. <em>It might be wrong if</em> this funding does not allow capital outlay or indirect costs; "
            "then the box drops those two."),
        'chips': chips(('All eight', 'all'), ('Fewer, in my note', 'fewer'), CH_LATER),
        'evidence': [policy()],
    })
    I.append({
        'lane': 'implementation-funding',
        'title': "Who sees a college's reported expenditures",
        'ref': 'implementation-funding · sheet 4 card 2 · DR-09',
        'facts': (
            "Signed-in reviewers see the CO Monitor's note, and the public explainer and My College show "
            "none of it. The mockup keeps expenditures the same way. A report is an institution's dollars "
            "with no student record, so privacy does not decide this."),
        'why': "A college that sees its own figures can catch a recording error; a public figure invites comparison.",
        'rec': (
            "<strong>Reviewers only</strong> for the first year, and revisit once the first reports are in. "
            "<em>It might be wrong if</em> colleges should confirm what the Chancellor's Office recorded; then "
            "My College shows each college its own figures, to its signed-in staff."),
        'chips': chips(('Reviewers only', 'reviewers'), ('Each college sees its own', 'college'), CH_LATER),
        'evidence': [policy()],
    })
    I.append({
        'lane': 'my-college-action-page',
        'title': 'Two figures named "units waiting" on My College',
        'ref': 'my-college-action-page · college_briefing.js',
        'facts': (
            "My College uses one label for two figures. <em>Start here</em> leads with every unit not yet "
            "acted on, and <em>Where you stand</em> leads with the articulated units still waiting for an "
            "award. At San Diego City College they read 96,268 and about 6,500."),
        'why': "A reader who sees both reads one number as wrong.",
        'rec': (
            "<strong>Name the larger figure <em>units not yet acted on</em></strong>, and keep <em>units "
            "waiting</em> for the articulated units, where nothing blocks the award. <em>It might be wrong "
            "if</em> you want the page to lead with the larger figure; then it takes the shorter name."),
        'chips': chips(('Rename as proposed', 'rename'), ('Other names, in my note', 'edit'), CH_LATER),
        'evidence': [measured(p_units_waiting_twice), quoted("the S304 session note", "2026-09-30")],
    })
    return I


def build(check_only=False):
    I = items()
    found, missing, stale, dead = audit_coverage(I)

    # ── every card declares its evidence ─────────────────────────────────────
    EV = evidence_of(I)
    undeclared = [n for n in range(1, len(I) + 1) if not EV[n]]
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
            for e in EV[n]:
                kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
        print(f"coverage ok — {len(I)} items across {len(lanes)} lanes; "
              f"{len(found)} lane(s) carry a marker, {len(NO_OPEN_ASK)} dismissed by name")
        print("evidence: " + " · ".join("%s %d" % (k, v) for k, v in sorted(kinds.items()))
              + "  (every measured premise re-checked and still open)")
        return 0

    # The reader sees where each claim came from, in their own words.
    I = [dict(it, facts=it["facts"]
              + '<p class="prov"><em>' + m.E(provenance_line(EV[n]))
              + '</em></p>')
         for n, it in enumerate(I, 1)]

    # JUST THE ITEMS (Sam, 2026-09-29): "Per our rules, no need for instruction
    # section on decision sheets; just the items." No framing, no count line,
    # no how-to box: build_sheet() draws its intro only when one is passed.
    out = m.build_sheet("Everything outstanding for you", I, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(lanes)} lanes · {len(out):,} bytes "
          f"→ {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build(check_only='--check' in sys.argv[1:]))
