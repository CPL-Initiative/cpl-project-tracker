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

Sheet 19 (S315, 2026-10-02, SHEET_ID 2026-10-02-open-asks-19): sheet 18's one card, unanswered, plus the
statewide Access target (the 2.3% gap, measured: the maximum award trims the capped institutions' targets).
Sheet 18 carried no replies when it was superseded. Published at
https://claude.ai/artifact/HSGh2r1HAE5CzfWTW49K44 (capabilities db + comments).
Sheet 18 (S315, 2026-10-02, SHEET_ID 2026-10-02-open-asks-18): Sam answered sheet 17 at 04:18Z (card 2
"Apply them", written at 04:52Z; card 1 "Done" with no kb_curation row and no CER load). One card: the
session writes the AWS fold and the Microsoft title through a workflow, or he types them. Published at
https://claude.ai/artifact/NopXsApvXCGbnGjSTPRC5A (capabilities db + comments).
Sheet 17 (S314, 2026-10-02, SHEET_ID 2026-10-02-open-asks-17): Sam answered all five cards of sheet 16 at
00:36Z. Two asks remain: the CER titles and the AWS merge (sheet 16 named a button the CER draws only after
a title is typed), and cards 23-24 shown today beside the revision. Published at
https://claude.ai/artifact/BUSR19kLbQ8yponfQVk1AP (capabilities db + comments).
Sheet 16 (S313, 2026-10-01, SHEET_ID 2026-10-01-open-asks-16): five cards, published onto sheet 15's artifact
https://claude.ai/artifact/49Rh1tw4TZy4MS9o1jF7UH; its replies stay there.
Sheet 15 (S312 checkpoint, 2026-10-01, SHEET_ID 2026-10-01-open-asks-15): Sam answered all six cards of
sheet 14 at 21:22Z (each his own call; recorded in the lanes). Three asks remain: the Microsoft title and the
AWS fold (partner-crosswalks), cards 23-24 of the model sweep, and the confirmation deadline.
Published at https://claude.ai/artifact/49Rh1tw4TZy4MS9o1jF7UH (capabilities db + comments).
Sheet 14 (S312, 2026-10-01, SHEET_ID 2026-10-01-open-asks-14): sheet 13's five cards (no reply yet), then
S312's one: whether colleges get the explainer alone or the tab's Public view as well (Sam, 2026-10-01: "I may
also give access to the 'Public View'--depends on whether this view has everything needed").
Published at https://claude.ai/artifact/EpuRqmsBBiwjNK6ZsD4LaU (capabilities db + comments).
Sheet 13 (S311, 2026-10-01, SHEET_ID 2026-10-01-open-asks-13): sheet 12's one card (no reply), then
S311's three: running the CER rename receipt (#1803, Cisco and AWS), the Microsoft title (the exam was
renamed, not the credential), folding AWS's second SysOps record; and a pointer to the "model" sweep
sheet (artifact T2MTd4n2cP2LXZXRXvbBQ6), whose replies are the port's spec. Published at
https://claude.ai/artifact/CyhTj4tH2sSMjKtgaW6o69 (capabilities db + comments).
Sheet 12 (S308/S309, 2026-09-30, SHEET_ID 2026-09-30-open-asks-12): one card, sheet 11's card 6 (the
City College of San Francisco check in Sierra), which Sam marked Later. Sheet 11's other eight left with his
rulings (replies/done at 22:48:37Z, all nine his own call), each recorded in its lane in the same change.
Published at https://claude.ai/artifact/B6Gnzmha8kArgiSQw1SdTe (capabilities db + comments).
Sheet 11 (S308/S309, 2026-09-30, SHEET_ID 2026-09-30-open-asks-11): sheet 10's six cards (no reply yet),
then the credential side session's three asks for the partner-crosswalks lane: who verifies an issuer's
skills against course outcomes for the CER as a phase 0 credential registry; retitling the three
renamed-credential exhibits; the network allowlist for the watch agent. Published at
https://claude.ai/artifact/8CdZcCGsDU6hMwhBLRZViM (capabilities db + comments). Sheet 10's store stays where
it is; a reply there still counts for its card.
Sheet 10 (S308/S309, 2026-09-30, SHEET_ID 2026-09-30-open-asks-10): six cards. Sheet 9's card (no reply
yet) with the catalog-year view's double count added; three S308 choices Sam may reverse (the Timeline's
type size, the priority cards' boxes, where the college sign-in sits); the note to Pedro about MAP's two
views; and the City College of San Francisco check in Sierra. Published at
https://claude.ai/artifact/DSky8iUvxg5WeemRm4wpW2 (capabilities db + comments). Sheet 9's store stays where
it is; a reply there still counts for its card.
Sheet 9 (S307, 2026-09-30, SHEET_ID 2026-09-30-open-asks-9): one card, whether Priority 1 counts credit
still at Needs Action (the question the Sierra chain handed the funding lane), set against MAP's student
view, which pa_u reads. Published at https://claude.ai/artifact/XnHFDLys7WRGjHC26NY9KP (capabilities db +
comments).

Sheet 8 (S307, 2026-09-30, SHEET_ID 2026-09-30-open-asks-8): one card, whether the CO style guide
gets a curated copy in the public knowledge base. Published at
https://claude.ai/artifact/7sb3cMt8iU9YWmjKyyHCT1 (capabilities db + comments). Sam answered it at
18:52Z the same day (`replies/done` through 1, his own call: curate a public draft).

Sheet 7 (S307, 2026-09-30, SHEET_ID 2026-09-30-open-asks-7): one card, how a college's staff sign
in to see its own reported expenditures (the Reporting box's college half). Published at
https://claude.ai/artifact/6VafxJwkrVpVyL8TCWFpNY (capabilities db + comments). Sam answered it at
17:09Z the same day (`replies/done` through 1, his own call: MAP's two contacts); the funding lane
records it and the card left in the same change.

Sheet 6 was answered in full at 15:26Z the same day (`replies/done` through 7, six his own call,
card 3 as proposed); its rulings are in the funding and My College lanes, and the builder holds no
card until a lane marks a new ask.

Sheet 6 (S306, 2026-09-30, SHEET_ID 2026-09-30-open-asks-6): sheet 5's five cards, which carried no
reply when S306 read its store, and two new ones: Scenario 2 reads as published in the stored model,
and Priority 1's wording against what `pa_u` counts. Published at
https://claude.ai/artifact/KCuKxKytRRWqNvqrusvtmr (capabilities db + comments); read its replies first.
Sheet 5's store stays where it is; a reply there still counts for its five.

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
OUT = os.path.join(ROOT, 'docs/visuals/2026-10-02-open-asks-19.html')
SHEET_ID = '2026-10-02-open-asks-19'

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

def p_cap_trims_targets():
    """Card: the statewide Access target. Open while a capped institution's target is still
    sized to the maximum (prioEntitlement scales by capScale), which is what makes the
    institutions' targets sum below the statewide division."""
    code = _code(_read("cpl_funding.js"))
    i = code.find("function prioEntitlement(")
    body = code[i:code.find("\n  }", i)] if i >= 0 else ""
    trims = "capScale(c)" in body
    return trims, ("prioEntitlement scales a capped institution's target by capScale()" if trims
                   else "prioEntitlement no longer scales by capScale(): re-measure the gap")


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


# The Reporting box's college half (sheet 6 card 4, S307): My College does not
# read cpl_funding_reports until Sam picks how a college's staff sign in.
def p_college_reports_unbuilt():
    """My College does not read the college's own reports yet."""
    n = _code(_read("college_briefing.js")).count("cpl_funding_reports")
    return n == 0, ("My College does not read cpl_funding_reports" if n == 0
                    else "My College reads cpl_funding_reports")


# Priority 1 on pa_u (Sam, 2026-09-30): the feed's applied measure still
# leaves out portal-origin students, whom ppa_u counts on their own.
def p_pa_excludes_portal():
    """cpl_funding_performance.js says PA and PPA describe disjoint cohorts."""
    src = _read("cpl_funding_performance.js")
    open_ = "PA and PPA describe disjoint cohorts" in src
    return open_, ("the feed's basis still says PA leaves out portal-origin students" if open_
                   else "the feed's basis no longer describes PA and PPA as disjoint")


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

    # Sheet 6's seven cards (S306; sheet 5's five carried) left with their
    # rulings: Sam answered all seven at 15:26Z on 2026-09-30 (through 7; six
    # his own call, card 3 as proposed), and each lane records its ruling in the
    # same change. The predicates above stay for a later card.

    # Sheet 7's one card (S307) left with its ruling: Sam chose MAP's two
    # contacts at 17:09Z on 2026-09-30, and the funding lane records it.

    # Sheet 8's one card (S307) left with its ruling: Sam chose "curate" at
    # 18:52Z on 2026-09-30 (cpl-knowledge-base#24), and the governance lane
    # records it.

    # Sheet 14's six cards left with Sam's rulings (21:22Z, 2026-10-01, all his own call).
    # Sheet 16's five cards (S313) were all answered at 00:36Z on 2026-10-02 (through 5):
    # card 4 Dec 30 (applied, S314), card 5 keep $9,759,692. Card 1 "wrong" restated v76's
    # answer: no ask had reached v77; smoke 15e asked it and v77 answers right (sierra lane). Card 2 "Done" left
    # no write in kb_curation, and the card itself was wrong: the CER shows Confirm merge
    # only after the new title is typed. Card 3 asked what cards 23-24 are.
    # Sheet 17's two cards (S314) were answered at 04:18Z on 2026-10-02 (through 2, both his
    # own call). Card 2 "Apply them": written by funding-config-edit-apply.yml at 04:52Z
    # (plan 2026-10-02-2, S315). Card 1 "Done" again left no kb_curation row: the CER reads
    # its overlay on every load, and the API log shows no such read after the 22:46Z rename
    # run on 2026-10-01, so the CER was not opened. The substance was ruled on sheet 14
    # (cpl_memory sam-sheet14-rulings-2026-10-01); only the entry is open.
    I.append({
        'lane': 'partner-crosswalks',
        'title': "The AWS merge and the Microsoft title: I write them, or you type them",
        'ref': 'partner-crosswalks · CER triage lane · sheet 17 card 1 · sheet 18 card 1',
        'facts': (
            "Your Done on sheet 17 left no row in the curation table. The CER loads its saved decisions "
            "each time it opens, and the API log shows no such load after the rename run at 22:46 UTC on "
            "October 1, so nothing was typed there. You ruled on both on sheet 14: fold "
            "<em>AWS Certified SysOps Administrator</em> into <em>AWS CloudOps Engineer - Associate</em>, and "
            "drop the exam code from <em>Microsoft Certified: Azure AI Fundamentals (AI-900)</em>. Only the "
            "entry is left."
            "<br><br>To type them yourself: on <em>AWS Certified SysOps Administrator</em>, type "
            "<em>AWS CloudOps Engineer - Associate</em> and press Confirm merge; on the Microsoft record, type "
            "<em>Microsoft Certified: Azure AI Fundamentals</em>."),
        'why': "The repo's guard keeps a session out of the curation table, so a session writes there only "
               "through a reviewed workflow, as it wrote your funding text this morning.",
        'rec': "<strong>Write them for me:</strong> the session adds a small workflow that inserts the three "
               "rows (the AWS title, its merge confirmation, the Microsoft title) under a bot name with a "
               "receipt, maps it in Governance, then runs the rename. <em>It might be wrong if</em> you want "
               "CER decisions entered only by a curator's hand.",
        'chips': chips(('Write them for me', 'write'), ("I'll type them", 'type'), CH_LATER),
        'evidence': [live('2026-10-02', 'kb_curation (newest row 2026-09-27) and the API log (no CER '
                          'overlay read after 22:46Z on 2026-10-01), read-only')],
    })
    # S315 measured S313's open 2.3% gap with the engine over the e21658f9 fixture: lifting the
    # $400,000 maximum award makes the 118 institutions' Access targets sum to 4,467.60, the
    # statewide division, exactly; with it, the seven institutions at the maximum carry 78.8 FTES
    # each and the sum is 4,366.66. No other institution's target moves. Which figure the state
    # publishes is a definition, so it is his.
    I.append({
        'lane': 'implementation-funding',
        'title': "The statewide Access target: the funding divided by the price, or the institutions' targets added up",
        'ref': 'implementation-funding NEEDS SAM · the 2.3% gap · cpl_memory statewide-target-exceeds-institution-sum-2026-10-01',
        'facts': (
            "The Access card prints a statewide target of 4,467.6 CPL FTES: $12,620,154 divided by the "
            "$2,824.82 price, as the explainer and the Scenario 2 film state it. The Statewide row's detail adds "
            "the institutions' own targets and reads 4,366.7 (credit 4,069.3, noncredit 297.4), 100.9 FTES less."
            "<br><br>The difference is the seven institutions at the $400,000 maximum award. The model sizes "
            "each of their targets to the maximum, 78.8 FTES, rather than to the institution's size. "
            "Mt. San Antonio accounts for 62.0 of the 100.9 FTES; Pasadena 14.0, Santa Ana 10.5, Long Beach "
            "7.4, Fresno City 4.6, Bakersfield 2.0 and El Camino 0.4. No other institution's target moves "
            "with the maximum. When every institution meets its own target, the state demonstrates 4,366.7 "
            "FTES and every institution qualifies for its full award."),
        'why': "One target appears as two figures on the same tab, and a reader who adds the detail's lanes "
               "arrives at the second.",
        'rec': "<strong>Use the sum:</strong> the card, the explainer and the film print 4,366.7, the figure "
               "at which every institution qualifies for its full award; the film is rendered again. "
               "<em>It might be wrong if</em> you want the public figure to stay the funding divided by the "
               "price; the detail then keeps its sum and says in one line that the maximum award accounts "
               "for the difference.",
        'chips': chips(('Use the sum', 'sum'), ('Keep the division', 'division'), CH_LATER),
        'evidence': [measured(p_cap_trims_targets, 'S315 ran cpl_funding.js over '
                              'tests/fixtures/cpl_funding_config_e21658f9.json, Scenario 2, with and without '
                              'the $400,000 maximum (cap_window)')],
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
