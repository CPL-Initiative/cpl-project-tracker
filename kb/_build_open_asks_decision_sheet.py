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

Published: https://claude.ai/artifact/5sWY4QCCDfkAegZtZrW1oe (2026-09-27, SHEET_ID
2026-09-27-open-asks, capabilities db + comments). The 2026-09-22 sheet
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
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-27-open-asks.html')
SHEET_ID = '2026-09-27-open-asks'

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


# Keyed by the item's POSITION on the sheet — the number Sam replies with, and
# the only unique handle (two ESL cards share a `ref`).
EVIDENCE = {
    # 2026-09-27 (S295): a fresh sheet. The 2026-09-22 cards 1, 2, 3-6 (military)
    # and 7 (the phone width) were answered on that sheet, below Sam's high-water
    # mark, and left it with their lanes' markers; see decision_sheets.md.
    1:  [quoted("prototype/funding_video/README.md", "2026-09-26")],
    2:  [live("2026-09-27", "the pull request's state on GitHub")],
    3:  [quoted("docs/military_cr_reference_scope.md", "2026-08-14"),
         live("2026-09-27", "the replies stored on the 2026-09-22 sheet")],
    4:  [quoted("docs/military_cr_reference_scope.md", "2026-08-14"),
         live("2026-09-27", "the replies stored on the 2026-09-22 sheet")],
    5:  [policy()],
    6:  [policy()],
    7:  [live("2026-09-22", "the mojibake count in chatbox_college_courses")],
    8:  [quoted("docs/reference/lanes/t5-55050-article-9.md", "2026-08-30")],
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
    I = []

    # ══ quick ones first: each asks for one look ═════════════════════════════
    I.append({
        'lane': 'implementation-funding',
        'title': 'The narrated draft of CPL Funding in Motion',
        'ref': 'implementation-funding · prototype/funding_video/README.md',
        'facts': (
            "The narrated cut of Scenario 1 is built: three minutes, a natural voice reading the script "
            "you asked for on 2026-09-26, the music at background level, and captions on the page and in "
            "the MP4 (<code>20260926_CPL_Funding_in_Motion_Narrated_Draft.mp4</code>, sent to you in "
            "session 294). The explainer does not link it until you approve it."),
        'why': (
            "Colleges reach the video from the explainer, and today they see only the 90-second "
            "introductions, which carry music and no voice."),
        'rec': (
            "<strong>Link it from the explainer as it stands.</strong> <em>It might be wrong if</em> "
            "each reveal should land on the word that names it; the layout carries the cue times for "
            "that, and the draft does not use them yet."),
        'chips': chips(('Link it as it stands', 'link'), ('Cue the reveals first', 'cue'), CH_LATER),
    })

    I.append({
        'lane': 'governance-team-enablement',
        'title': "Merge the knowledge base's instruction fix",
        'ref': 'CLAUDE.md Cleanup sheet card 5 · cpl-knowledge-base #23',
        'facts': (
            "Your card 5 verdict was a pull request that touches no curated content. "
            "<code>cpl-knowledge-base</code> #23 names the file for the knowledge base (it read "
            "<em>CPL Project Tracker</em>), corrects the checkpoint's rule number to 9 in "
            "<code>CLAUDE.md</code> and <code>CURATION.md</code>, and has sessions read the local clone "
            "before the network. It waits as a draft, as #17 did."),
        'why': (
            "A session leaves a merge to the public repository to you, and until this one lands every "
            "session attached to the knowledge base reads a file titled for the tracker."),
        'rec': (
            "<strong>Merge it: pick this and a session merges it on your word.</strong> <em>It might be "
            "wrong if</em> the local-clone line should wait until the file and its canonical copy, "
            "<code>claude/CLAUDE.md</code>, are reconciled (they have drifted apart)."),
        'chips': chips(('Merge #23', 'merge'), ('Hold it', 'hold'), CH_LATER),
    })

    # ══ Military ACE: two answers from August that September contradicted ════
    I.append({
        'lane': 'military-ace-cr-reference',
        'title': 'The not-a-topic class: canonicalize it or auto-N/A it',
        'ref': 'military scope §10 ④ · cpl_memory ace-not-a-topic-gets-canonical-crs',
        'facts': (
            "On 2026-08-14 you said: <em>&ldquo;We still need a canonicalized CR for it to account for "
            "every CR in the corpus.&rdquo;</em> The class folds into three recommendations: "
            "<em>Credit Is Not Recommended</em>, <em>Credit May Be Granted by Individualized "
            "Assessment</em>, and <em>Credit Is Not Recommended Until Prerequisite Completed</em>. The "
            "lane never recorded that answer, so the 2026-09-22 sheet asked again and proposed "
            "<em>auto-N/A with a receipt</em>, which removes the class without a reviewer. You "
            "completed that sheet past it, so the proposal stands as agreed under your high-water rule."),
        'why': (
            "Individualized assessment is a <em>may</em>: ACE says credit can follow a review. When "
            "measured on 2026-08-14 it held 2,730 rows across 95 colleges and had been granted "
            "nowhere. Marking it N/A records a decision nobody made."),
        'rec': (
            "<strong>Keep the August answer: canonicalize the class into its three recommendations and "
            "exclude none of it.</strong> <em>It might be wrong if</em> you meant September's auto-N/A "
            "for the flat <em>no credit</em> rows alone, which your August words allow, while "
            "individualized assessment stays open."),
        'chips': chips(('Canonicalize it (August)', 'august'), ('Auto-N/A it (September)', 'september'), CH_LATER),
    })

    I.append({
        'lane': 'military-ace-cr-reference',
        'title': 'Subject-area granularity: suggestions or a merge rule',
        'ref': 'military scope §10 ③',
        'facts': (
            "On 2026-08-14 you ruled subject-area granularity <strong>suggestion-only</strong>: pairwise, "
            "gated and never transitive, with a curator working the list family by family. The "
            "2026-09-22 sheet asked again and proposed a rule: fold <em>principles of X</em> into "
            "<em>X</em> wherever the qualifier adds no scope. You completed that sheet past it, so the "
            "rule stands as agreed."),
        'why': (
            "The two answers differ in who decides. Under August a curator accepts each merge; under "
            "September one class of merge happens without one. The September card never showed you "
            "the August answer."),
        'rec': (
            "<strong>Keep the August answer: every merge stays a suggestion a curator "
            "accepts.</strong> <em>It might be wrong if</em> you meant September's rule to sit on top, "
            "folding <em>principles of X</em> without a curator while everything else stays a "
            "suggestion."),
        'chips': chips(('Suggestions only (August)', 'august'), ('Fold empty qualifiers (September)', 'september'), CH_LATER),
    })

    I.append({
        'lane': 'military-ace-cr-reference',
        'title': 'Name the unit range on every merge and mint',
        'ref': 'military scope §10 ① · your note of 2026-09-22',
        'facts': (
            "You ruled that ACE unit variants stay one recommendation that names its range, and added: "
            "<em>&ldquo;I think this should be a rule for all merges and mints. Advise.&rdquo;</em> "
            "<code>AR-2201-0552</code> issues <em>Orienteering</em> at 1, 2 and 3 hours, so one "
            "recommendation reads <em>Orienteering (1&ndash;3 units)</em>. The same question arises "
            "wherever a merge or a mint joins records whose units differ."),
        'why': (
            "Units that differ inside one identity are information a faculty reviewer uses. Naming "
            "the range keeps it in view without splitting the identity."),
        'rec': (
            "<strong>Make it a display rule for every merge and mint: an identity shows the unit range "
            "of what it joins, and units never split an identity.</strong> It follows your TOP ruling: "
            "gate identity, keep display. <em>It might be wrong if</em> a C-ID descriptor's minimum "
            "units should gate membership, since a course below the minimum cannot carry that C-ID."),
        'chips': chips(('Make it the rule', 'rule'), ('ACE recommendations only', 'ace'), CH_LATER),
    })

    # ══ not reached on the 2026-09-22 sheet ══════════════════════════════════

    I.append({
        'lane': 'partner-crosswalks',
        'title': 'The cpl_occupation_match verdict queue',
        'ref': 'partner-crosswalks Next ④ · Rule 10(a3)',
        'facts': (
            "The occupation matcher's recall ceiling is vocabulary, not thresholds &mdash; "
            "<em>application developer</em> to Computer Programming shares no token at all. A verdict "
            "queue would let curators close that gap by hand. It is a <strong>new shared human-write "
            "table</strong>."),
        'why': (
            "Rule 10(a3) routes a new write surface through Governance and the privacy ADRs before it "
            "ships. The cross-list surface faces the same gate when curators get it, and your ruling of "
            "2026-09-22 puts sessions first there."),
        'rec': (
            "<strong>Take it through Governance before it ships</strong>, and bring the cross-list "
            "curator surface with it when that one is ready. <em>It might be wrong if</em> you would "
            "rather grow the curated map by hand and add no table at all."),
        'chips': chips(('Both through Governance', 'both'), ('Curated map only', 'map'), CH_LATER),
    })

    I.append({
        'lane': 'sierra-retrieval-corpus',
        'title': 'The 381 course titles carrying mojibake',
        'ref': 'sierra · s274-sam-course-title-cleanup',
        'rows': 381,
        'facts': (
            "381 course titles carry mojibake. It is <strong>repaired at the loader today</strong>, so "
            "nothing Sierra says is wrong; the damage sits in the stored titles. A loader edit on a "
            "merge re-syncs the catalog."),
        'why': (
            "The repair is real but invisible, which makes the stored corruption easy to forget until "
            "something reads the titles without going through the loader."),
        'rec': (
            "<strong>Clean the stored titles once, under a cohort receipt, and keep the loader repair "
            "as the belt.</strong> <em>It might be wrong if</em> the upstream keeps re-introducing it, "
            "in which case the loader is the only fix worth having."),
        'chips': chips(('Clean the source', 'clean'), ('Loader repair is enough', 'loader'), CH_LATER),
    })

    I.append({
        'lane': 't5-55050-article-9',
        'title': 'GR register rows #2, #10 and #16',
        'ref': 't5-55050 · Open Verdicts sheet item 8',
        'facts': (
            "Three register rows are still open: <strong>#2</strong> (which still asks for enacted "
            "law), <strong>#10</strong> and <strong>#16</strong>. The v5 package went out on "
            "2026-08-28, and Tier 2 is ruled &mdash; the four November items travel together as one "
            "filing."),
        'why': (
            "They rode the Open Verdicts sheet and the 2026-09-22 open-asks sheet, and your review "
            "stopped before them both times. They are the residue of a filing that has otherwise "
            "shipped."),
        'rec': (
            "<strong>Rule the three on the GR Priorities tab, where the procedure work already "
            "lives.</strong> <em>It might be wrong if</em> #2's ask for enacted law makes it a hold "
            "rather than a verdict, which would park it until the law exists."),
        'chips': chips(('Rule them on the tab', 'tab'), ('Park #2, rule #10 and #16', 'park2'), CH_LATER),
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
        "You asked for a sheet of everything outstanding for you. This one replaces the sheet of "
        "2026-09-22, and every answer you gave there stands: you completed it through card 18, so "
        "seven of the cards it still listed are rulings that sessions now carry out, and the three "
        "you did not reach return here. Two of those rulings contradict answers you gave on "
        "2026-08-14 to the same military questions, which the lane never recorded; they come back as "
        "items 3 and 4 with August proposed. Items 1 and 2 each ask for one look.")
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
