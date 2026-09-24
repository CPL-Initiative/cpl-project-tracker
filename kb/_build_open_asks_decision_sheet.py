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

⚠️ AND THIS SHEET REPORTS; IT NEVER RULES. Nine of these were asked before and
have sat unanswered — restating them is the whole job. An item that has drifted
out of its lane's wording is a bug in this file, never a license to update the
lane from here.

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
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-22-open-asks.html')
SHEET_ID = '2026-09-22-open-asks'

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
    1:  [measured(p_eths_misprefixed)],
    2:  [policy()],
    3:  [quoted("docs/reference/lanes/esl-packaging.md", "2026-08-29")],
    4:  [quoted("docs/reference/lanes/esl-packaging.md", "2026-08-29")],
    5:  [quoted("docs/reference/lanes/esl-packaging.md", "2026-08-29")],
    6:  [quoted("docs/reference/lanes/esl-packaging.md", "2026-08-29")],
    7:  [quoted("docs/military_cr_reference_scope.md", "2026-09-05")],
    8:  [quoted("docs/military_cr_reference_scope.md", "2026-09-05")],
    9:  [policy()],
    10: [policy()],
    11: [measured(p_phone_opening)],
    # 12 was the ASCCC-areas card, retired 2026-09-24 on Sam's ruling ("use what
    # we have for ASCCC regions and we'll get the new report later"); the three
    # below moved up one, as position keys must.
    12: [policy()],
    13: [live("2026-09-22", "the mojibake count in chatbox_college_courses")],
    14: [quoted("docs/reference/lanes/t5-55050-article-9.md", "2026-08-30")],
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

    # ══ held from the cross-list sheet ═══════════════════════════════════════
    I.append({
        'lane': 'discipline-crosslist',
        'title': 'Re-mint the 31 Ethnic Studies identities that are swimming and track courses',
        'ref': 'crosslist item 3 · docs/reference/lanes/discipline-crosslist.md',
        'rows': 31,
        'facts': (
            "<code>ES</code> maps to Ethnic Studies and appears on 82 rows, but at many colleges it "
            "means <em>Exercise Science</em>. <strong>31 of the 226 ETHS-prefixed M-IDs are physical "
            "activity courses</strong> &mdash; <em>Advanced Fencing</em>, <em>Swimming for "
            "Nonswimmers</em>, <em>Intercollegiate Track</em>, <em>Advanced Golf</em>. Two read "
            "<code>subj=['PE']</code>, so the prefix disagrees with the row's own mapping. The gate "
            "that stops new ones landed in #1653; these 31 predate it."),
        'why': (
            "The M-ID layer is AI-assisted staging rather than faculty-published, so Rule 7 permits a "
            "principled re-mint under the playbook. It changes stored identifiers, which is why a "
            "session holds it for you rather than taking the opt-out."),
        'rec': (
            "<strong>Re-mint the 31 under the playbook</strong> &mdash; dry run, alias map, "
            "<code>kb/promotions.json</code> re-key, atomic land in one cron window. "
            "<em>It might be wrong if</em> you would rather leave staging identifiers alone until "
            "the layer is published, and carry the 31 as known-wrong in the meantime."),
        'chips': chips(('Re-mint them', 'remint'), ('Leave them', 'leave'), CH_LATER),
    })

    I.append({
        'lane': 'discipline-crosslist',
        'title': 'Who may add a cross-list',
        'ref': 'crosslist item 10 · Rule 10(a3)',
        'facts': (
            "The <code>xdisc</code> field carries 9 rows today and works. Opening it to curators makes "
            "it a shared human-write surface, which is a decision-rights change rather than a code "
            "detail &mdash; Rule 10(a3) routes the first writer to any shared table through Governance "
            "and the privacy ADRs before it ships."),
        'why': (
            "Item 6 of the cross-list sheet (cross-listing kind C, 535 rows) is the work this gates. A "
            "session can write the rows under a cohort <code>reviewer_email</code> with a receipt "
            "today; a curator writing them needs the surface to exist."),
        'rec': (
            "<strong>Sessions write it under a cohort receipt; curators get the surface only after "
            "Governance maps it.</strong> <em>It might be wrong if</em> you want curators in from the "
            "start, in which case the Governance mapping is the first build rather than the second."),
        'chips': chips(('Sessions first', 'sessions'), ('Curators from the start', 'curators'), CH_LATER),
    })

    # ══ ESL packaging ════════════════════════════════════════════════════════
    I.append({
        'lane': 'esl-packaging',
        'title': 'The 9 over-claims, or move the cut to 6+',
        'ref': 'esl-packaging · ladder re-level',
        'rows': 9,
        'facts': (
            "Nine rows claim a rung the evidence does not reach. Moving the cut to <code>6+</code> "
            "removes the question instead of answering it, at the cost of the rows between."),
        'why': (
            "A threshold set to make a worklist empty stops measuring anything. Either the nine are "
            "wrong, or the cut was."),
        'rec': (
            "<strong>Fix the nine; leave the cut where it is.</strong> <em>It might be wrong if</em> "
            "you read the cut as the thing that was mis-set, in which case the nine are symptoms."),
        'chips': chips(('Fix the nine', 'fix'), ('Move the cut to 6+', 'cut'), CH_LATER),
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'Does the numeric pinning survive',
        'ref': 'esl-packaging · ladder re-level',
        'facts': (
            "The weakest reader tier is a bare trailing integer in the course title. "
            "<strong>90 of 130</strong> re-levels rest on a SINGLE member course."),
        'why': (
            "A trailing integer is a real signal at many colleges and noise at others, and a rung "
            "resting on one member course has no second voice to check it."),
        'rec': (
            "<strong>Keep the numeric pinning, and hold the 90 single-member rows out of the fold "
            "until a second member agrees.</strong> <em>It might be wrong if</em> you read a single "
            "catalog as sufficient evidence for a rung, which would clear all 90 now."),
        'chips': chips(('Keep it, hold the 90', 'hold'), ('Keep it, fold all', 'fold'),
                       ('Drop the pinning', 'drop'), CH_LATER),
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'Roll back the re-levels, or not',
        'ref': 'esl-packaging · 22 reverts',
        'rows': 22,
        'facts': (
            "<strong>All 22 reverts whose catalog speaks DISAGREE with the revert</strong> &mdash; the "
            "catalogs say the band those rows sit at today, unanimously. Nothing was written to "
            "Supabase."),
        'why': (
            "Blast radius argues for holding a ruling against noisy local variance. This is not noisy: "
            "the catalogs agree with each other and against the revert."),
        'rec': (
            "<strong>Do not roll back.</strong> <em>It might be wrong if</em> you weight the original "
            "ruling over the catalogs, which is the one reading that survives unanimity."),
        'chips': chips(('Do not roll back', 'hold'), ('Roll back', 'rollback'), CH_LATER),
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'Extend the ladder table to L=2',
        'ref': 'esl-packaging · 21 abstaining colleges',
        'rows': 21,
        'facts': (
            "<strong>21 colleges read as 2-rung and the table has no L=2 row</strong>, so they abstain "
            "&mdash; they contribute nothing to the ladder rather than contributing a short one."),
        'why': (
            "An abstention is invisible in the output; it looks like agreement. Ladders derive from the "
            "whole ESL corpus, and a short ladder pushes rungs higher, so the 21 are not neutral."),
        'rec': (
            "<strong>Add the L=2 row so the 21 vote.</strong> <em>It might be wrong if</em> a 2-rung "
            "reading is usually a parse failure rather than a real two-level program, in which case "
            "their silence is correct."),
        'chips': chips(('Add L=2', 'add'), ('Let them abstain', 'abstain'), CH_LATER),
    })

    # ══ Military ACE ═════════════════════════════════════════════════════════
    I.append({
        'lane': 'military-ace-cr-reference',
        'title': 'Are ACE unit variants one recommendation',
        'ref': 'military scope §10 ①',
        'facts': (
            "<code>AR-2201-0552</code> issues <em>Orienteering</em> at 1, 2 AND 3 hours. "
            "<strong>22.2% of the vocabulary turns on this question</strong> &mdash; the single largest "
            "lever in the lane. An earlier units ruling exists but came from a different situation."),
        'why': (
            "ACE is already a controlled vocabulary: 93.4% of (exhibit, units, topic) groups hold "
            "exactly one text. Whether units are part of the identity decides whether that vocabulary "
            "is one entry or three."),
        'rec': (
            "<strong>One recommendation, with units as an attribute of it.</strong> <em>It might be "
            "wrong if</em> a college awarding 3 hours is making a different decision from one awarding "
            "1, in which case units are identity and the vocabulary is three times larger."),
        'chips': chips(('One recommendation', 'one'), ('Units are identity', 'split'), CH_LATER),
    })

    I.append({
        'lane': 'military-ace-cr-reference',
        'title': 'The 767-string typographic class — upstream or downstream',
        'ref': 'military scope §10 ② · cpl_memory o3',
        'rows': 767,
        'facts': (
            "The 6.6% residue of the ACE vocabulary is <strong>case and punctuation, never wording</strong> "
            "&mdash; 767 strings. Fixing it upstream repairs the source; absorbing it downstream "
            "normalizes at read time and leaves the source as ACE published it."),
        'why': (
            "ACE is somebody else's system of record. A repair we make upstream is a divergence we then "
            "maintain forever."),
        'rec': (
            "<strong>Absorb it downstream.</strong> <em>It might be wrong if</em> the normalization has "
            "to be reimplemented by every consumer, which is the argument for fixing it once at the "
            "source."),
        'chips': chips(('Downstream', 'down'), ('Upstream', 'up'), CH_LATER),
    })

    I.append({
        'lane': 'military-ace-cr-reference',
        'title': 'How far to merge subject-area granularity',
        'ref': 'military scope §10 ③',
        'facts': (
            "<em>supervision</em> and <em>principles of supervision</em> are either one topic or two. "
            "The same question repeats across the 6,725 real topics."),
        'why': (
            "Merging raises the share that resolves with zero judgment; holding the distinction keeps "
            "recommendations that a faculty reviewer would read as genuinely different."),
        'rec': (
            "<strong>Merge only where the qualifier adds no scope</strong> &mdash; "
            "<em>principles of X</em> into <em>X</em>, never <em>advanced X</em> into <em>X</em>. "
            "<em>It might be wrong if</em> <em>principles of</em> reliably signals a survey course, "
            "which would make it scope after all."),
        'chips': chips(('Merge empty qualifiers', 'merge'), ('Keep them distinct', 'keep'), CH_LATER),
    })

    I.append({
        'lane': 'military-ace-cr-reference',
        'title': 'Is the not-a-topic class auto-N/A',
        'ref': 'military scope §10 ④',
        'facts': (
            "Some strings in the topic position are not topics at all. Auto-N/A takes them out of the "
            "vocabulary without a reviewer seeing them."),
        'why': (
            "It is the cheapest win in the lane if the class is clean, and an invisible data loss if it "
            "is not."),
        'rec': (
            "<strong>Auto-N/A it, and commit the list of what was removed.</strong> <em>It might be "
            "wrong if</em> the class is mixed, in which case it wants a sitting rather than a rule."),
        'chips': chips(('Auto-N/A with a receipt', 'auto'), ('Review them', 'review'), CH_LATER),
    })

    # ══ COBI dark mode ═══════════════════════════════════════════════════════



    # ══ SkyView ══════════════════════════════════════════════════════════════


    I.append({
        'lane': 'skyview-ccr-interface',
        'title': 'The opening width on a phone',
        'ref': 'skyview · NEEDS SAM ③',
        'facts': (
            "At 188&deg; across on a 390px canvas the discipline labels clip off both edges. Narrowing "
            "is a real improvement, but <code>NODE_ZOOM</code> decides per island whether courses draw "
            "at all, and the margin is what makes that work."),
        'why': (
            "This is a ruling rather than a sweep: a narrower opening trades legible labels against "
            "islands that stop drawing their courses."),
        'rec': (
            "<strong>Narrow the opening on phone widths and let the affected islands open collapsed.</strong> "
            "<em>It might be wrong if</em> a collapsed island reads as an empty one, which is the "
            "failure the margin exists to prevent."),
        'chips': chips(('Narrow it', 'narrow'), ('Keep the margin', 'keep'), CH_LATER),
    })

    # ══ the rest ═════════════════════════════════════════════════════════════

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
            "ships. Same gate as the cross-list surface above, and the two could go through together."),
        'rec': (
            "<strong>Take it through Governance alongside the cross-list surface</strong>, as one "
            "decision-rights change covering both. <em>It might be wrong if</em> you would rather grow "
            "the curated map by hand and add no table at all."),
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
            "These rode the Open Verdicts sheet and were not reached. They are the residue of a filing "
            "that has otherwise shipped."),
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
        "You asked for a sheet of everything outstanding for you, so this is all of it in one place "
        f"rather than scattered through {len(lanes)} lane files. Nine of these were asked before and "
        "have been sitting unanswered &mdash; that is the reason the sheet exists. Two carry a live "
        "rendering bug behind them (items 13 and 14), and two are the same decision-rights question "
        "asked twice (items 2 and 20), so they can travel together. Nothing here has been acted on.")
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
