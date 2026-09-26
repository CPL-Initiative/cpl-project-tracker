#!/usr/bin/env python3
"""The ESL merging procedure, rule by rule, as one numbered sheet (2026-09-26, S294).

Sam asked for it by name on 2026-09-21 (S282), and five handoffs carried it:

    "we have an ESL merging procedure I'd like to adjust but I will want you to
    give me in the next session a decision sheet to manage the adjustments to
    what we currently use or have queued to use."

Items 1-4 are the rules the fold runs today; items 5-9 are what is queued. His
2026-08-24 rulings (the per-ladder sets, the two-rung row, the noncredit shift,
no rollback of the 32, two members or more) are settled and the cards build on
them; none is re-asked here. Every count below was measured on 2026-09-26:

  - the published list: unified_courses_data.js (generated 2026-09-26 13:48),
    102 ESL rows; the 2026-07-15 plan's ids resolved through kb/alias_chain.py
    (428 re-keyed since) cover 10 of them;
  - the Z-band alias map (kb/zband_retire_out/2026-09-03/alias_map.json) names
    91 of the other 92;
  - the fold classifier (kb/_esl_package_dryrun.classify) run over those 92;
  - the ladder plan (kb/esl_ladder_relevel_out/2026-08-24/plan.json): 122
    proposals, 17 reverts, 75 more resting on one member, 30 left;
  - the spot-check (kb/esl_fold_spotcheck/2026-08-24/report.md);
  - kb_curation, read live: FTVE M1018 (formerly FIMS M1018) merged into
    ESOL M1152 by automerge-v1@bot on 2026-06-12.

⚠️ THE FOUR ESL CARDS ON THE STANDING OPEN-ASKS SHEET ARE RETIRED BY THIS ONE.
They re-asked questions Sam settled on 2026-08-24; he left all four as proposed
in his 2026-09-22 sitting, and card 3's proposal ("fix the nine") contradicts his
own 2026-08-24 words ("leave them"). Item 7 below asks which stands.

Published: https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS (capabilities db + comments; its `replies`
store is keyed to these nine positions, so a builder that drops or reorders a
card starts a fresh SHEET_ID rather than republishing onto it).

Run: python3 kb/_build_esl_merging_decision_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-26-esl-merging-procedure.html')
SHEET_ID = '2026-09-26-esl-merging-procedure'
CH_LATER = ('Later', 'later')


def items():
    I = []

    # ══ In use: the rules the fold runs today ═══════════════════════════════
    I.append({
        'lane': 'esl-packaging',
        'title': 'How a course’s level is read',
        'ref': 'in use · kb/_esl_package_dryrun.py classify() · kb/reference/esl_level_sets.json',
        'rows': 1990,
        'facts': (
            "The fold reads each title in a fixed order and stops at the first answer: a purpose word "
            "(citizenship, vocational, culture and media), then a level word (Beginning, Intermediate, "
            "Advanced, their synonyms, and pairs such as Beginning-Intermediate), then the course’s "
            "rung on its own college’s ladder, and Beginning when none of these speaks. Your "
            "per-ladder sets of 2026-08-24 decide a rung’s band, with the two-rung row and the "
            "noncredit shift one band down. Checked against the colleges’ catalog descriptions, a "
            "level word was wrong <strong>6.2%</strong> of the time, the old fixed rung reading "
            "<strong>49.2%</strong>, and the Beginning default <strong>76.7%</strong>."),
        'why': (
            "Every other rule sits inside this order, so a change here moves more courses than any other "
            "card. The 92 newer identities (item 5) show three misreads: <em>Careers</em>, plural, misses "
            "the vocational word <em>career</em>, so <em>ESL for Healthcare Careers</em> falls to "
            "Beginning; <em>High-Interm</em> is not read as Intermediate; and <em>Part 1</em> of a two-part "
            "course reads as rung 1."),
        'rec': (
            "<strong>Keep the order and fix the three misreads: plurals of the purpose words, "
            "<em>Interm</em> as Intermediate, and <em>Part N</em> no longer read as a rung.</strong> "
            "<em>It might be wrong if</em> a college numbers its ladder in parts, in which case Part 2 is "
            "a real rung and the third fix drops it."),
        'chips': [('Keep the order, fix the three', 'fix'), ('Keep the order as it is', 'keep'), CH_LATER],
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'Titles that name no level fold to Beginning',
        'ref': 'in use · the classify() default · kb/esl_fold_spotcheck/2026-08-24/report.md',
        'rows': 102,
        'facts': (
            "<strong>517</strong> of the 1,990 folds reached Beginning because the title named no level "
            "and carried no rung. For 133 of them, a member course’s catalog description names a "
            "level, and it disagrees with Beginning in <strong>102</strong>. The other 384 name no level "
            "anywhere, in the title or the catalog."),
        'why': (
            "Your 2026-08-24 ruling lets the statewide standard win over local catalog wording, and it "
            "applies where a standard reached the course. On these 517 none did: Beginning is where the "
            "fold put them for want of a signal, and where a catalog speaks it disagrees three times in "
            "four."),
        'rec': (
            "<strong>Move the 102 to the band their catalogs name, and leave the 384 at Beginning, where "
            "faculty can pull a course up.</strong> <em>It might be wrong if</em> a description names the "
            "level a course prepares students for rather than its own, which would lift the course a band "
            "too far; the spot-check already sets prerequisite clauses aside, and the apply re-reads each "
            "of the 102 first."),
        'chips': [('Move the 102 to their catalog band', 'move'), ('Keep all 517 at Beginning', 'keep'), CH_LATER],
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'Purpose before level, and the healthcare courses',
        'ref': 'in use · classify() carve-outs · kb/_esl_package_apply.py Enrichment and Healthcare',
        'rows': 18,
        'facts': (
            "Citizenship courses go to Civic ESL, vocational and workplace courses to Vocational ESL, and "
            "courses framed around culture, film, music or leisure to Enrichment ESL, before any level is "
            "read; Vocational ESL then sends its health courses to Vocational — Healthcare. A re-level "
            "never moves a course out of a purpose group (the ladder pass skipped 181), and 45 stay put "
            "although a member’s catalog names a level. Health words are missing from the first step: "
            "of the <strong>23</strong> health-titled ESL folds, 5 reached Vocational — Healthcare, and "
            "<strong>17</strong> sit in Beginning and 1 in Intermediate (<em>ESL for Healthcare 1</em>, "
            "<em>ESL for Medical Terminology</em>, <em>ESL for Patient Care Skills</em>)."),
        'why': (
            "A purpose group tells a student and a counselor what a course is for, and a level group tells "
            "them where it sits; a course that belongs to both can live in only one. You made "
            "Vocational — Healthcare its own comprehensive, and 18 of its courses have not reached it."),
        'rec': (
            "<strong>Keep purpose first, and add health words to it, so the 18 move to Vocational — "
            "Healthcare.</strong> <em>It might be wrong if</em> some of the 18 are general ESL courses that "
            "use health topics for reading practice, which the apply shows by name before it writes."),
        'chips': [('Keep purpose first, add health words', 'health'), ('Keep purpose first as it is', 'keep'),
                  ('Let a stated level win', 'level'), CH_LATER],
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'Transfer composition stays out of the fold',
        'ref': 'in use · kb/_esl_package_apply.py (transfer-level held back, unruled) · 8 identities',
        'rows': 3,
        'facts': (
            "The fold holds back composition taught for ESL students because it may carry transferable "
            "credit, and the code notes that you have not ruled on it. Eight identities sit there. Five "
            "are transfer composition: <em>ESL College Composition and Reading</em> (ESOL M1205), "
            "<em>Composition, Reading, and Freshman English</em> (M1239), <em>College Composition for "
            "ESL</em> (M10KY), <em>Composition for Non-Native Speakers</em> (M10PO) and <em>Freshman "
            "Composition for Non-Native Speakers</em> (M10PN). Three are not: two <em>Preparation for "
            "English Composition for Multilingual Students</em> (M10AD credit, M91BQ noncredit) and a "
            "noncredit <em>Composition for ESL Students</em> (M9192)."),
        'why': (
            "A transfer course and the course before it serve different students, and a noncredit course "
            "carries no transferable credit. Held apart, the three appear under no level group, so a "
            "counselor looking under Advanced does not find them."),
        'rec': (
            "<strong>Fold the three into Advanced ESL and keep the five apart as transfer "
            "composition.</strong> <em>It might be wrong if</em> a college runs the preparation course as "
            "a co-requisite of transfer composition, or your noncredit rule puts the two noncredit courses "
            "one band lower, at Intermediate."),
        'chips': [('Fold the three, keep the five apart', 'three'), ('Keep all eight apart', 'keep'), CH_LATER],
    })

    # ══ Queued: what is waiting to run ══════════════════════════════════════
    I.append({
        'lane': 'esl-packaging',
        'title': '92 ESL identities arrived after the fold',
        'ref': 'queued · unified_courses_data.js (2026-09-26) · kb/zband_retire_out/2026-09-03',
        'rows': 92,
        'facts': (
            "Today’s published list carries <strong>102</strong> ESL identities, and the fold plan of "
            "2026-07-15 knew 10 of them: the seven comprehensives and three transfer composition courses. "
            "The other <strong>92</strong> reached ESL later; 91 got their current ids on 2026-09-03, when "
            "the Z band retired (82 former Z ids and 9 legacy anchors), and ESLN M9274 came by another "
            "route. 59 are noncredit, 27 credit and 6 unrecorded; 83 have two or more member courses. Nine "
            "carry a third spelling of the discipline, <em>English as a Second Language (ESL)</em>, which "
            "the fold’s scope does not list. Run through the fold’s classifier as it stands, the "
            "92 land 52 Beginning, 21 Intermediate, 6 Advanced, 10 Vocational and 2 Civic, with 1 held "
            "as transfer composition; 37 placements rest on a level word, 19 on a number and 21 on the "
            "Beginning default."),
        'why': (
            "No rule has touched the 92, so each shows today as its own course, and none counts toward a "
            "comprehensive."),
        'rec': (
            "<strong>Fold the 92 under this sheet’s answers in one dated cohort, after a dry run that "
            "lists every placement, and add the third spelling to the scope.</strong> <em>It might be "
            "wrong if</em> a former Z cluster mixes ESL with other courses, as the film course in item 9 "
            "did before the first fold; the dry run checks each member’s discipline first and holds "
            "any mixed cluster out."),
        'chips': [('Fold the 92 after a dry run', 'fold'), ('Show me the dry run first', 'show'), CH_LATER],
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'Apply the 30 re-levels your rulings allow',
        'ref': 'queued · kb/esl_ladder_relevel_out/2026-08-24/plan.json · your rulings of 2026-08-24',
        'rows': 30,
        'facts': (
            "Your per-ladder sets propose <strong>122</strong> re-levels, and nothing from that pass has "
            "been written. Your 2026-08-24 rulings keep two groups out: the 17 that would undo the 32 "
            "re-levels you chose not to roll back, and 75 more that rest on a single member course, which "
            "you asked to see as a named worklist. That leaves <strong>30</strong>: 14 Intermediate to "
            "Beginning, 9 Beginning to Intermediate, 5 Advanced to Intermediate and 2 Intermediate to "
            "Advanced. Catalogs agree on 4, disagree on 9 and say nothing on 17; on the 9, your ruling "
            "lets the statewide standard win."),
        'why': (
            "The 30 are the part of the ladder pass your rulings have already cleared, and a guarded "
            "update with a before-value receipt can reverse any of them."),
        'rec': (
            "<strong>Apply the 30 once this sheet’s answers are in, recomputed under them, and publish "
            "the 75 as the named worklist.</strong> <em>It might be wrong if</em> your answers here change "
            "the ladder sets or the noncredit shift, in which case the recomputed count differs from 30 "
            "and the apply waits for you to see it."),
        'chips': [('Apply the 30', 'apply'), ('Hold the ladder pass', 'hold'), CH_LATER],
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'The nine over-claims: two answers disagree',
        'ref': 'queued · cpl_memory sam-esl-over-claims-standard-wins · open-asks sheet card 3 (2026-09-22)',
        'rows': 9,
        'facts': (
            "Nine identities in the numeric lane sit a band higher than their own college’s catalog "
            "describes. On 2026-08-24 you ruled on the over-claims: <em>leave them</em>, because the "
            "statewide standard wins over local catalog wording. On 2026-09-22 the standing open-asks "
            "sheet asked again and proposed <em>fix the nine</em>; you left that card as proposed, below "
            "the point you reviewed through, so the sheet reads it as agreed."),
        'why': (
            "The untouched card carries none of your words, and your 2026-08-24 ruling does. Until one of "
            "them stands, a session could act on either."),
        'rec': (
            "<strong>Your 2026-08-24 ruling stands, and the nine stay where they are.</strong> <em>It might "
            "be wrong if</em> you changed your mind by 2026-09-22 and let the card stand on purpose."),
        'chips': [('Leave the nine', 'leave'), ('Move the nine to their catalog band', 'fix'), CH_LATER],
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'How new ESL courses join the fold',
        'ref': 'queued · no rule today · Rule 10 (every curation write carries a receipt)',
        'facts': (
            "Nothing folds a new ESL identity today; the 92 in item 5 have waited since 2026-09-03. New "
            "ones arrive when colleges add courses to COCI and the nightly build mints them."),
        'why': (
            "A standing rhythm keeps the comprehensives whole without a sitting each time. Each fold is a "
            "write to curation, so each pass carries its own dated cohort and receipt, which makes it "
            "reversible."),
        'rec': (
            "<strong>A monthly pass: a session dry-runs the fold over new ESL identities, applies what a "
            "level or purpose word places, and lists the rest for you.</strong> <em>It might be wrong "
            "if</em> you want new courses folded the night they appear, which makes the nightly build a "
            "writer to curation and needs a Governance mapping first."),
        'chips': [('A monthly pass', 'monthly'), ('Only when I ask', 'ask'), CH_LATER],
    })

    I.append({
        'lane': 'esl-packaging',
        'title': 'A film course sits inside Enrichment ESL',
        'ref': 'queued · FTVE M1018 (formerly FIMS M1018) · automerge-v1@bot, 2026-06-12',
        'rows': 1,
        'facts': (
            "<em>Film and American Culture</em>, a film studies course, was merged by title into "
            "<em>American Culture and Film</em> (ESOL M1152) in June, before the ESL fold made that "
            "identity the Enrichment ESL comprehensive. It is the one course from another discipline found "
            "among the seven comprehensives’ members."),
        'why': (
            "Among the comprehensive’s many members it no longer stands out, and a student’s film "
            "credit reads as ESL."),
        'rec': (
            "<strong>Pull it out: remove the June merge so the course stands again under Film and Media "
            "Studies.</strong> <em>It might be wrong if</em> it belongs with another film identity, such as "
            "<em>Film and American Culture Honors</em> (FTVE M1019), which a later pass can merge it into."),
        'chips': [('Pull it out', 'pull'), ('Leave it', 'leave'), CH_LATER],
    })

    return I


def build():
    I = items()
    framing = (
        "You asked on 2026-09-21: <em>“we have an ESL merging procedure I’d like to adjust but I "
        "will want you to give me in the next session a decision sheet to manage the adjustments to what "
        "we currently use or have queued to use.”</em> Items 1 to 4 are the rules the fold runs "
        "today; items 5 to 9 are what is queued. Your rulings of 2026-08-24 stand as they are, and the "
        "cards build on them. Each card arrives with my recommendation selected; change only what you "
        "want adjusted, and put the adjustment in its note. Nothing on this sheet has been written.")
    counts = f"{len(I)} items · 1,990 folds and 102 published ESL identities"
    out = m.build_sheet(
        "ESL Merging Procedure", I,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
