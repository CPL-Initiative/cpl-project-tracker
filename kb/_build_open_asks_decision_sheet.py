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

Published: https://claude.ai/artifact/74AfMNmXPQYP5X7XKpjHfH (2026-09-27 evening, SHEET_ID
2026-09-27-funding-asks, capabilities db + comments, four funding cards). Sam answered cards 1
and 2 there and leaves off at card 3; cards 3 and 4 wait on that same store, so read its
`replies` and `replies/done` for them, and NEVER republish onto it. This builder carries
those two beside the ETHS extension card (SHEET_ID 2026-09-28-open-asks; the two-card
2026-09-27-funding-asks-2 was built, never published, and is gone). When the 2026-09-28 sheet
is published, Sam answers cards 1 and 2 there or as cards 3 and 4 on the 2026-09-27 sheet:
read both stores, and the later answer stands. Before it:
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
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-28-open-asks.html')
SHEET_ID = '2026-09-28-open-asks'

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
        "Three questions wait on you: the last three sections of your funding tab review, the "
        "explainer's footer, and how far the Exercise Science re-mint reaches. Cards 1 and 2 are the same "
        "two questions as cards 3 and 4 of the 27 September sheet; answer them once, on either sheet. Your "
        "answers on the Annual view's percent and on Pedro's request are carried out, and the 31 identities "
        "you ruled on move this week.")
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
