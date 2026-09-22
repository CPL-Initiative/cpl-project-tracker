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
out of its lane's wording is a bug in this file, never a licence to update the
lane from here.

Run: python3 kb/_build_open_asks_decision_sheet.py
     python3 kb/_build_open_asks_decision_sheet.py --check   (coverage only)
"""
import glob
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
    'implementation-funding':
        "its own marker reads 'NEEDS SAM - nothing open'; the 2026-09-15 sheet's "
        "seven items are answered AND executed. Its one residue is a note Sam "
        "SENDS, which is not a decision.",
    'README':
        "the lanes index, which documents the marker rather than carrying one.",
}


def chips(*pairs):
    return list(pairs)


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
    I.append({
        'lane': 'cobi-dark-mode',
        'title': 'Do --surface-1 / --surface-2 get light values too',
        'ref': 'cobi-dark-mode · NEEDS SAM 1',
        'facts': (
            "Giving them light values unifies six tabs' tints and <strong>repaints them in the light "
            "theme</strong>. It is the one change here that a reader who never opens dark mode would "
            "notice."),
        'why': (
            "It is a design call about the light identity, not a theming fix, which is why no session "
            "swept it."),
        'rec': (
            "<strong>Yes &mdash; one tint vocabulary across both themes.</strong> <em>It might be wrong "
            "if</em> the six tabs' tints are deliberate per-tab identity, in which case unifying them "
            "flattens something you chose."),
        'chips': chips(('Unify the tints', 'unify'), ('Leave light alone', 'leave'), CH_LATER),
    })

    I.append({
        'lane': 'cobi-dark-mode',
        'title': 'The --text-faint sites on Implementation Funding',
        'ref': 'cobi-dark-mode · NEEDS SAM 2',
        'rows': 10,
        'facts': (
            "Ten sites paint essential text in <code>--text-faint</code> at <strong>3.06:1</strong>, "
            "below AA. The token's own comment reads <em>decorative only &mdash; never essential "
            "text</em>, so each is a site using the wrong role rather than a bad token value. "
            "<code>--text-muted</code> is the fix, and it changes the light theme."),
        'why': (
            "It is your tab, and the repair is visible in light where you read it."),
        'rec': (
            "<strong>Move them to <code>--text-muted</code>.</strong> <em>It might be wrong if</em> the "
            "text really is decorative there, in which case the fix is to cut it rather than darken "
            "it."),
        'chips': chips(('Move to --text-muted', 'muted'), ('It is decorative, cut it', 'cut'), CH_LATER),
    })

    I.append({
        'lane': 'cobi-dark-mode',
        'title': 'The 24 declarations that resolve to nothing in both themes',
        'ref': 'cobi-dark-mode · NEEDS SAM 3',
        'rows': 24,
        'facts': (
            "24 <code>var(--brand)</code> / <code>var(--link)</code> / <code>var(--text)</code> "
            "declarations were written with <strong>no fallback and no such token</strong>, so they are "
            "invalid at computed-value time. <code>college_briefing.js</code>'s "
            "<code>.cb-bfrac&gt;i</code> progress bar paints <code>transparent</code>, and its "
            "<code>.cb-lead</code> / <code>.cb-next</code> accent borders do not draw at all."),
        'why': (
            "This is a live rendering bug in both themes rather than a theming question &mdash; it "
            "reached this sheet only because the fix is visible in light."),
        'rec': (
            "<strong>Point all 24 at the real roles and re-measure both themes.</strong> <em>It might "
            "be wrong if</em> you want the progress bar to stay invisible, which nothing in the lane "
            "suggests."),
        'chips': chips(('Fix all 24', 'fix'), ('Show me first', 'show'), CH_LATER),
    })

    # ══ SkyView ══════════════════════════════════════════════════════════════
    I.append({
        'lane': 'skyview-ccr-interface',
        'title': 'What the statewide exhibits are FOR',
        'ref': 'skyview · NEEDS SAM ①',
        'rows': 84,
        'facts': (
            "Your 2026-09-10 ask cut off at <em>&ldquo;shown visibly on the sky so folks can easily "
            "see&hellip;&rdquo;</em>. The data side is done &mdash; <code>sw</code> is on all 84 &mdash; "
            "but the treatment depends on the rest of the sentence."),
        'why': (
            "Three readings fit the fragment and they draw differently: see which are statewide, see "
            "what a college could adopt, or see where they are already in use."),
        'rec': (
            "<strong>Which are statewide, as a persistent mark on the node.</strong> <em>It might be "
            "wrong if</em> you meant adoption, which needs a college picked first and is a different "
            "control."),
        'chips': chips(('Which are statewide', 'sw'), ('What a college could adopt', 'adopt'),
                       ('Where already in use', 'inuse'), CH_LATER),
    })

    I.append({
        'lane': 'skyview-ccr-interface',
        'title': 'The sierra_guidance CHECK constraint and skyview-ask',
        'ref': 'skyview · NEEDS SAM ②',
        'facts': (
            "The live CHECK constraint does not allow <code>skyview-ask</code>, though the schema of "
            "record does. A curator picking it gets a hard save failure. Not blocking anything today; "
            "it matters only to scope a Sierra rule to this surface."),
        'why': (
            "It is one statement against a live table, which is why it waits for you rather than "
            "riding a session's own judgment."),
        'rec': (
            "<strong>Apply the one-statement migration so the live constraint matches the schema of "
            "record.</strong> <em>It might be wrong if</em> you would rather no Sierra rule ever scope "
            "to SkyView, in which case the schema of record is what should change."),
        'chips': chips(('Align the constraint', 'align'), ('Drop it from the schema', 'drop'), CH_LATER),
    })

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
        'lane': 'map-users-student-contact',
        'title': 'Eight colleges keep a snapshot contact where MAP is now blank',
        'ref': 'map-users · NEEDS SAM',
        'rows': 8,
        'facts': (
            "Eight colleges still show a contact captured on <strong>2026-06-25</strong> where MAP now "
            "holds nothing. MAP is read-only for us, so the blank cannot be filled there; the choice is "
            "whether a student sees a possibly-stale name or no name."),
        'why': (
            "A stale roster costs a student the wrong person to email. A blank costs them nobody to "
            "email. Both are real, and this lane exists so that every landing page routes to a person."),
        'rec': (
            "<strong>Keep showing them, labelled with the date they were captured.</strong> "
            "<em>It might be wrong if</em> a wrong name is worse than none, which is the reading that "
            "would drop all eight."),
        'chips': chips(('Keep, dated', 'keep'), ('Drop them', 'drop'), ('Ask the colleges', 'ask'), CH_LATER),
    })

    I.append({
        'lane': 'partner-crosswalks',
        'title': 'ASCCC areas are a separate taxonomy and are still missing',
        'ref': 'partner-crosswalks · NEEDS SAM',
        'facts': (
            "No Supabase column carries ASCCC areas. The region work resolved the SWP consortium roster "
            "(117 colleges, 9 regions) and proximity regions, and those two already disagree &mdash; "
            "<code>--region &quot;Bay Area&quot;</code> returns 23 where the consortium holds 28. ASCCC "
            "areas are a third taxonomy on top of that."),
        'why': (
            "Each taxonomy answers a different question, and a roster that silently drops five member "
            "colleges is the shape of the error a missing third one would add."),
        'rec': (
            "<strong>Add ASCCC area as its own column, sourced from the ASCCC's own roster, and never "
            "derive it from county.</strong> <em>It might be wrong if</em> nothing we ship is scoped by "
            "ASCCC area, in which case the honest move is to say we do not carry it."),
        'chips': chips(('Add the column', 'add'), ('We do not carry it', 'skip'), CH_LATER),
    })

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
        print(f"coverage ok — {len(I)} items across {len(lanes)} lanes; "
              f"{len(found)} lane(s) carry a marker, {len(NO_OPEN_ASK)} dismissed by name")
        return 0

    framing = (
        "You asked for a sheet of everything outstanding for you, so this is all of it in one place "
        f"rather than scattered through {len(lanes)} lane files. Nine of these were asked before and "
        "have been sitting unanswered &mdash; that is the reason the sheet exists. Two carry a live "
        "rendering bug behind them (items 13 and 14), and two are the same decision-rights question "
        "asked twice (items 2 and 20), so they can travel together. Nothing here has been acted on.")
    counts = (f"{len(I)} items across {len(lanes)} lanes · "
              f"every lane carrying an open ask is covered, by build-time audit")

    out = m.build_sheet(
        "Everything outstanding for you", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(lanes)} lanes · {len(out):,} bytes "
          f"→ {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build(check_only='--check' in sys.argv[1:]))
