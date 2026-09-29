#!/usr/bin/env python3
"""The progressive Jev ladder — ten calls on where Jev runs next, and in what order.

Sam, 2026-09-21: *"I will want to set up a prioritized and progressive set of
Jev runs... configured for each of our large consolidation centers such as CER,
CSR, CCR, CCRR."*

Rule 1's habit: the sheet has a generator, so a change to the template
regenerates it rather than being hand-edited into the HTML.

    python3 kb/_build_jev_ladder_sheet.py

EVERY NUMBER BELOW WAS MEASURED ON 2026-09-21 (S282), and the query that
produced it is named beside it, because a sheet's own counts go stale and the
next session has to be able to re-take them rather than inherit them.

⚠️ THE RANKING RULE THIS SHEET HAD TO ABANDON. The handoff said to prioritize
the centers by collapse value (rows x colleges), which is this lane's own rule.
Measured against `chatbox_peer_articulations`, all four centers ride the SAME
9,413 articulation rows across the SAME 82 colleges — they consolidate different
columns of one corpus. Collapse value orders items WITHIN a center and is a
constant BETWEEN them, so it ranks nothing here. This is the second time the
rule has failed on a new corpus for a corpus-specific reason; the standing note
is `a-ranking-rule-must-be-rederived-per-corpus` (2026-08-14), which found the
mirror image in the ACE lane. What separates the centers is what ONE SITTING of
verdicts is worth, which the items below measure instead.
"""
import sys

sys.path.insert(0, 'kb')
import _decision_sheet_replies as m  # noqa: E402

SHEET_ID = '2026-09-21-jev-ladder'
OUT = 'docs/visuals/2026-09-21-jev-ladder.html'

ITEMS = [
    # ── 1. the call the handoff named as the first one ──────────────────────
    {
        'title': 'Which center gets the next sitting of verdicts',
        'ref': 'ladder-01-first-verdict-set',
        'facts':
            'Jev has a calibrated gate on exactly one center. Your 51 CCRR verdicts '
            'set it at 0.85, where Jev folded <strong>25 of 25</strong> correctly. '
            'The CER, the CSR and the CCR carry <strong>no human verdict at all</strong>. '
            'Measured today against the articulation corpus, all four centers ride the '
            '<strong>same 9,413 rows across the same 82 colleges</strong> — they '
            'consolidate different columns of one table — so collapse value, the rule '
            'this lane ranks by, is a constant between them and orders nothing. What '
            'separates them is what one sitting of verdicts buys: your 51 CCRR verdicts '
            'settled <strong>1,459 rows</strong>, about 29 rows each, while the CER’s '
            'entire judgment backlog of 59 findings reaches <strong>71 rows across 20 '
            'colleges</strong>, about 1.2 rows each. The CCR carries <strong>134,485 '
            'member rows over 16,478 course identities</strong>, fourteen times the whole '
            'articulated corpus.',
        'why':
            'A gate is calibrated once and then runs unattended. Spending a sitting where '
            'the corpus is largest buys the most unattended running afterward, and the CCR '
            'is larger than the other three together by an order of magnitude.',
        'rec':
            'Give the <strong>CCR</strong> the next sitting of verdicts, and calibrate its '
            'gate on them. <em>It might be wrong if</em> the CCR’s questions turn out '
            'too varied for one gate to cover, in which case a sitting spent there '
            'calibrates nothing and the CCRR head harvest in item 5 was the better buy.',
    },
    # ── 2. what has to exist before item 1 can happen ───────────────────────
    {
        'title': 'The CCR has nothing to hand Jev yet',
        'ref': 'ladder-02-ccr-trust-card-adapter',
        'facts':
            'The adjudication module wires the CSR, the CER and the CCRR. The CCR sits '
            'outside it for a structural reason: its method half, <code>kb/_row_audit.py</code>, '
            'emits <strong>Trust Cards</strong> — a score per row across eight rules — where '
            'the other three emit <strong>findings</strong>, which are discrete questions. '
            'Jev answers questions.',
        'why':
            'Item 1 sends a sitting to the CCR, and a sitting needs questions to answer. '
            'The adapter is the step between the two.',
        'rec':
            'Build the adapter that turns a Trust Card into a question, and run it before '
            'the CCR sitting. <em>It might be wrong if</em> the Trust Card rules carry no '
            'question a curator would recognize as a question, which the adapter would '
            'surface in its first batch rather than after a sitting is spent.',
    },
    # ── 3. the gate is not portable ─────────────────────────────────────────
    {
        'title': 'Each center calibrates its own gate',
        'ref': 'ladder-03-per-center-gate',
        'facts':
            'The 0.85 gate was measured on one question put to the CCRR: do these two '
            'recommendations describe the same course content. The CER asks whether two '
            'credential titles name one credential, the CSR whether a four-letter subject '
            'code is wrong, the CCR whether two local courses are one course. Nothing '
            'measured says a probability carries the same meaning across those four '
            'questions.',
        'why':
            'The battery already showed what happens when a general prior meets a domain '
            'that has overruled it: on <code>units</code> Jev scored 0.281, below chance, '
            'because this lane rules that units are not identity and Jev assumes they are. '
            'A gate carries that kind of error with it.',
        'rec':
            'Calibrate a gate per center against that center’s own verdicts, and let '
            'none of them inherit 0.85. Until a center has verdicts, treat its Jev output '
            'as a ranked worklist and never as a suggestion to act on.',
    },
    # ── 4. Rule 10(a3): a write surface is a decision-rights change ─────────
    {
        'title': 'Three centers have nowhere to record a verdict',
        'ref': 'ladder-04-decisions-store-per-center',
        'facts':
            'The CCRR writes to <code>cr_reference_decisions</code>, which carries a '
            '<code>note</code> column for the reason behind each call. The CER, the CSR and '
            'the CCR have no decisions table. Measured today: those two are the only '
            'decision or curation tables in the database.',
        'why':
            'A center with nowhere to record a verdict asks you the same question again '
            'next run, and the reason behind the first answer is lost. The reference '
            'already states that a center needs a decisions store with a reason column '
            'before its first sheet.',
        'rec':
            'Create one decisions table per center on the CCRR’s shape, reason column '
            'included, and route each through Governance before it ships — a first writer '
            'to a shared table is a decision-rights change under Rule 10, rather than a '
            'code detail.',
    },
    # ── 5. the harvest that costs no verdicts ───────────────────────────────
    {
        'title': 'Harvest the CCRR head now, at no cost in verdicts',
        'ref': 'ladder-05-ccrr-head-harvest',
        'facts':
            'The CCRR gate is calibrated and it folded 25 of 25 correctly, covering 346 '
            'articulation rows with nothing wrong in it. The adjudicator has only ever run '
            'over the 51 anchored pairs. The rung-5 population behind them holds '
            '<strong>1,936 groups</strong> that have never been put to it.',
        'why':
            'This is the one move on the sheet that spends no sitting of yours. The gate '
            'already earned the right to suggest, and suggestions above it have been right '
            'every time they were checked.',
        'rec':
            'Run the adjudicator across the rung-5 population and bring back only what '
            'clears 0.85, as a sheet. <em>It might be wrong if</em> the wider population '
            'holds pair shapes the 51 never contained, so the first batch comes to you for '
            'review before anything is written.',
    },
    # ── 6. the band: stop asking ────────────────────────────────────────────
    {
        'title': 'The 26 hard CCRR pairs come to you, and Jev stops being asked',
        'ref': 'ladder-06-band-to-curator',
        'facts':
            'The pre-registered battery of six variables ran on those 26 pairs and nothing '
            'passed. The primary came back at <strong>AUC 0.378</strong>, below chance: '
            'where Jev found a reason to hold two recommendations apart, you were more '
            'likely to fold them. Six phrasings have now been spent on the same two '
            'strings. The band carries <strong>838 articulation rows</strong>.',
        'why':
            'The band is where curator judgment is the product rather than a cost. A '
            'seventh phrasing against the same evidence is the move the battery was run to '
            'rule out.',
        'rec':
            'Put the 26 on a sheet as your work, and stop asking Jev about them. '
            '<em>It might be wrong if</em> a genuinely different kind of evidence reaches '
            'them — member course titles, the units spread, what other colleges did with '
            'the same pair — which item 7 tests on one variable before anyone builds it.',
        'rows': 838,
    },
    # ── 7. the one lead, held to its pre-registration ───────────────────────
    {
        'title': 'The one lead from the battery gets a single re-test',
        'ref': 'ladder-07-level-retest',
        'facts':
            'Of the six variables, <code>level</code> pointed the right way with the '
            'largest effect, at raw <strong>p 0.023</strong>. Corrected for having asked '
            'six questions at once it reads <strong>0.138</strong>. Six questions yield '
            'about one good-looking result by luck, and the rule that says so was fixed in '
            'the source before any answer existed.',
        'why':
            'A lead is worth one honest shot. Re-analyzing the rows that produced it turns '
            'a lucky draw into a finding, which is the failure the pre-registration was '
            'written to prevent.',
        'rec':
            'Give <code>level</code> one targeted re-test on a batch it did not pick, '
            'pre-registered as a single hypothesis, and drop it if it fails. Leave the '
            'original 26 rows out of that analysis entirely.',
    },
    # ── 8. the findings under the triage are 73 days old ────────────────────
    {
        'title': 'The CER and CSR findings are ten weeks old',
        'ref': 'ladder-08-rerun-method-halves',
        'facts':
            'Both method halves last ran on <strong>2026-07-10</strong>, which is 73 days '
            'ago. Every count in the current triage comes off those two files: CER 239 '
            'findings of which 59 need judgment, CSR 185 of which 143 do. The curation has '
            'moved since, and the M-ID layer has been through a re-mint in that window.',
        'why':
            'A Jev call spent on a finding the scanner would no longer raise is spent '
            'twice: once on the call, and again on the verdict it asks you for.',
        'rec':
            'Re-run both scanners and re-triage before a single Jev call is spent on '
            'either center. Record the fresh counts, so the next session compares against '
            'a number it can re-take.',
    },
    # ── 9. Rule 7: identity is not Jev's to gate ────────────────────────────
    {
        'title': 'Hold the CSR out of the ladder while it asks identity questions',
        'ref': 'ladder-09-csr-rule-7',
        'facts':
            '<strong>123 of the CSR’s 143</strong> judgment findings are one rule, '
            '<code>cs9_anchor_subj_diverge</code>: it asks whether a discipline’s '
            'canonical four-letter code should change to match its anchor course. A change '
            'there is a re-mint, governed by Rule 7 and its mandatory playbook. Rule 7 also '
            'holds that an unreliable signal never gates identity.',
        'why':
            'A fold in the CCRR collapses two wordings and a curator can pull them apart '
            'again. A subject code change re-keys stored identifiers, and the alias chain '
            'exists because that is expensive to undo.',
        'rec':
            'Let Jev rank the 123 as a worklist for a human and keep it away from the '
            'verdict, so no re-mint is ever proposed by a model. Hold the CSR below the '
            'CCR and the CCRR in the ladder until the M-ID layer is declared '
            'faculty-published and Rule 7 re-locks.',
    },
    # ── 10. the CER, measured ───────────────────────────────────────────────
    {
        'title': 'The CER goes last, and earns its place as a cheap calibration set',
        'ref': 'ladder-10-cer-last',
        'facts':
            'Measured today: all 59 CER judgment findings together reach <strong>71 '
            'articulation rows across 20 colleges</strong>, and only 21 of their 38 '
            'distinct credential titles appear in the articulated corpus at all. '
            'The CER governs credential titles across all of MAP — <strong>3,813 '
            'unified titles</strong> — so its value may sit in exhibit adoption rather '
            'than in articulation rows, which is a measure this sheet has not taken.',
        'why':
            'It buys the least per verdict, and 59 verdicts is one short sitting, which '
            'makes it the cheapest place to see what a second center’s calibration '
            'curve looks like.',
        'rec':
            'Put the CER last in the running order, and use it as the cheap calibration '
            'set once the CCR is running. <em>It might be wrong if</em> exhibit adoption '
            'is the measure that matters here, in which case tell me and I will take that '
            'measurement before the ladder fixes the order.',
    },
]


def main():
    out = m.build_sheet(
        "The Jev ladder",
        ITEMS,
        sheet_id=SHEET_ID,
        # A PLAN sheet, so the chips name a plan's two outcomes. CHIPS_FOLD
        # would read as folding something, and a bare Yes is what Sam's
        # 2026-09-20 ruling retired.
        chips=m.CHIPS_PLAN,
    )
    open(OUT, 'w', encoding='utf-8').write(out)
    rows = sum(it.get('rows', 0) for it in ITEMS)
    print(f"{len(ITEMS)} items · {rows} rows · {len(out)} bytes → {OUT}")


if __name__ == '__main__':
    main()
