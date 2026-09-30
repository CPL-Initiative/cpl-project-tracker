#!/usr/bin/env python3
"""Sierra's credit source data, as one numbered sheet (2026-09-30).

Sam asked Sierra for the breakdown of Chaffey's 19,405 applied units and then for
the military and non-military split and the exhibits behind them (chat_interactions
d38c37bc, 68e0f93e, 434e2638; his Sierra Training note on turn 1b9230ce). She had
neither: her disposition block reads only map_college_credit_summary's four college
totals. This sheet carries what the source tables can support, what the student-detail
ADR allows, and two defects the measurement turned up on the way.

⚠️ ITS OWN SHEET, WITH ITS OWN STORE. The standing open-asks sheet belongs to the
funding queue SkyLatch (S305) is running, and its replies are keyed to its own cards
(docs/reference/decision_sheets.md). Nothing here adds a NEEDS-SAM marker to a lane.

Figures measured 2026-09-30 against the live database (the 2026-09-29 18:56 UTC
promotion, map_data_loads id 46) and cpl_funding_performance.js (as of 2026-09-30).
Re-measure at execution.

Run: python3 kb/_build_sierra_credit_source_decision_sheet.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-30-sierra-credit-source.html')
SHEET_ID = '2026-09-30-sierra-credit-source'
CH_LATER = ('Later', 'later')


def items():
    I = []

    I.append({
        'title': 'Close the small-group totals in the college credit summary',
        'ref': 'map_college_credit_summary · map_college_credit_summary_pub · '
               'adr-student-detail-aggregate-disclosure-control (amendment 2026-08-11)',
        'facts': (
            "The summary Sierra quotes, and the public copy the college briefing reads, suppress a "
            "college only when it has fewer than 10 students in total. Its applied and transcribed "
            "figures come from smaller groups. Of the 99 colleges it publishes, <strong>8 show a "
            "transcribed total drawn from fewer than 10 students</strong>, three of them from a single "
            "student, and <strong>3 show an applied total</strong> drawn from fewer than 10. The public "
            "copy, which the anonymous key reads (built 2026-09-17), carries the same 8 and 3. At one "
            "student, a transcribed total is that student's record. The ADR's 2026-08-11 amendment "
            "already rules on this shape: suppression follows the group behind each figure."),
        'why': (
            "This predates today's question, and it reaches the public page. Every new table on this "
            "sheet builds on the same summary, so the fix comes first."),
        'rec': (
            "<strong>Fix now.</strong> The rebuild suppresses each figure on the students behind it "
            "(applied on students with applied credit, transcribed on students with transcribed "
            "credit, the Needs Action figures on students at Needs Action), the promotion refuses a "
            "figure backed by fewer than 10, and the public copy rebuilds. The statewide totals Sierra "
            "adds up already skip suppressed cells, and eight hidden cells leave none recoverable. "
            "<em>It might be wrong if</em> you would rather revisit the floor itself first; the ADR "
            "lists that as an open question."),
        'chips': [('Fix now', 'fix'), CH_LATER],
    })

    I.append({
        'title': 'Say applied for credit on the CPL plan, and name the articulated credit waiting beside it',
        'ref': 'map_college_credit_summary.applied_credits · chat_interactions d38c37bc · '
               'lanes/disposition-grain-student-detail (publish both and name the gap)',
        'facts': (
            "Chaffey's <strong>19,405</strong> applied units are <strong>18,199</strong> at Applied to "
            "CPL Plan and <strong>1,206</strong> at Needs Action. The 1,206 are one exhibit, Credit for "
            "Basic Military Service area credit: 402 students at 3 units each, articulated and not yet "
            "acted on. MAP repeats the articulated credit in its Applied Credits column on every Needs "
            "Action row, and the summary adds that column across every status. Sierra then counted the "
            "same 1,206 units inside the 7,641 not acted on and called the two separate pools. "
            "Statewide the column carries <strong>74,697</strong> Needs Action units beside "
            "<strong>171,078</strong> at Applied to CPL Plan. Your 2026-08-19 ruling stands on record: "
            "publish both and name the gap. A second gap sits under it. MAP's two views disagree: "
            "applied on the plan reads 171,078 in the articulation view and <strong>162,603</strong> in "
            "the student view, transcribed 82,178 and 75,233, at 26 colleges (Chaffey 18,199 and "
            "18,066). No document records that gap yet."),
        'why': (
            "The breakdowns on items 4 and 5 have to come from the student view, which holds the "
            "student counts suppression needs and MAP's own military split. Built on today's headline, "
            "a breakdown would not add up to the total Sierra quotes beside it."),
        'rec': (
            "<strong>Do it.</strong> The summary gains applied-on-the-plan and transcribed from the "
            "student view; Sierra leads with those, names the Needs Action figure as articulated credit "
            "waiting on a decision, and keeps MAP's column as a labeled second figure. The Course Credit "
            "tab keeps its display. The view gap goes to Pedro as a question through the MAP custom "
            "reports lane. <em>It might be wrong if</em> you want the Course Credit tab moved to the "
            "same definition in the same change."),
        'chips': [('Do it', 'do'), ('Move the Course Credit tab too', 'both'), CH_LATER],
    })

    I.append({
        'title': "Ask the funding lane whether Chaffey's applied units include credit nobody acted on",
        'ref': 'cpl_funding_performance.js Chaffey pa_u · lanes/implementation-funding · '
               'owned by SkyLatch (S305); this session changes nothing there',
        'facts': (
            "The funding tab reads Chaffey's applied units as <strong>19,020</strong>, from a third MAP "
            "view (the student aggregated values). The student view held <strong>18,066</strong> units "
            "at Applied to CPL Plan one day earlier, so the funding figure carries at least 954 units "
            "from rows outside the plan. The 1,206 units of basic military service credit at Needs "
            "Action are the likely source. The funding pull is transient and not stored, so this "
            "session cannot confirm it row by row."),
        'why': (
            "You traced Chaffey's applied FTES to these units. If the model counts articulated credit "
            "a college has not yet applied, the allocation reflects articulation work rather than "
            "credit on students' plans."),
        'rec': (
            "<strong>Hand it to the funding lane</strong> as an open question, worded as above, for "
            "the session that owns the tab. <em>It might be wrong if</em> the model means to count "
            "articulated credit as applied; then the question closes with that reason written down."),
        'chips': [('Hand to the funding lane', 'handoff'), ('Dismiss', 'dismiss'), CH_LATER],
    })

    I.append({
        'title': 'Give Sierra the military and non-military split of applied and transcribed credit, per college',
        'ref': 'map_student_credit.military_credits / non_military_credits / apprenticeship_credits · '
               'methodology-bucket-military-and-non-military-credit-recommendations',
        'facts': (
            "MAP splits applied credit itself. Its military and non-military columns add up to the "
            "applied figure on 73,933 of the 73,939 rows at Applied to CPL Plan statewide, and "
            "apprenticeship credit sits inside the non-military column (8,206 units). At Chaffey the "
            "columns match the exhibit-code test exactly: <strong>674 military units (123 "
            "students)</strong> and <strong>17,392 non-military (1,177 students)</strong>, 53 of them "
            "apprenticeship, plus the 1,206 basic military units at Needs Action. The bucketing note's "
            "warning still holds for rows: the columns read zero wherever no credit was applied. For "
            "splitting applied credit, they are MAP's own split. Transcribed credit has no split "
            "column; the exhibit's CPL type splits it (item 5). At 10 students a cell, the split shows "
            "at <strong>53 of the 63 colleges</strong> holding applied credit on the plan, 95% of the "
            "units: 14 show both buckets, 39 hold one bucket and a true zero, 7 have one bucket under 10 "
            "and withhold both, and 3 have both under 10."),
        'why': (
            "You asked for it on the Chaffey answer, and your 2026-08-13 ruling asks every figure a "
            "college reads to split the buckets before it totals them."),
        'rec': (
            "<strong>Build it.</strong> A new published table, rebuilt in the nightly promotion: per "
            "college, military and non-military (apprenticeship within it), each with applied on the "
            "plan, transcribed and students, 10 students a cell, and the other bucket withheld with it "
            "where one is thin. Sierra leads a college with its non-military bucket and gives the "
            "military figure with its per-student context; separating the buckets never discounts "
            "either. <em>It might be wrong if</em> you want apprenticeship shown as a third bucket "
            "rather than a line within non-military."),
        'chips': [('Build it', 'build'), ('Apprenticeship as a third bucket', 'three'), CH_LATER],
    })

    I.append({
        'title': 'Give Sierra the exhibits and credit recommendations behind applied and transcribed credit, per college',
        'ref': 'map_college_cr_unit · map_student_credit · map_ace_exhibit_titles · '
               'View_ExhibitCRsCatalog_Dataset.CPLTypeCode · chat_interactions 434e2638',
        'facts': (
            "Both MAP views carry the exhibit and recommendation behind every unit, and the title "
            "lookup names 1,502 of the 1,503 exhibits holding applied credit. Sierra reads neither, so "
            "she answered from the list of what Chaffey has articulated, and her 110 Standardized and "
            "77 Credit by Exam were counts of exhibits. By units, Chaffey's applied credit on the plan "
            "is <strong>Standardized Assessment 17,104 (95%)</strong>, military 674, industry "
            "certification 282 and other 6. <strong>Credit by Exam carries none</strong>: no Chaffey "
            "student row holds a Credit by Exam exhibit. Four AP exams carry half: English Literature "
            "2,616, Spanish Language 2,444, English Language 2,172, U.S. History 1,878. Of the 163 "
            "exhibits behind Chaffey's applied credit, 28 reach 10 students and carry 94% of the units. "
            "Transcribed runs the other way at Chaffey: 260 of its 276 units sit in exhibits under 10 "
            "students. Statewide, 337 of 2,112 college-and-exhibit cells reach 10 and carry 90% of "
            "applied units and 91% of transcribed. For the CPL type, the nightly fetch already asks "
            "MAP's exhibit catalog for its type code, and the sync keeps only the id and title. Reading "
            "type from the id instead mistypes 546 of the 677 exhibits Sierra's list calls Credit By "
            "Exam."),
        'why': (
            "This is the question you asked, and item 2's student view lets the breakdown add up to "
            "the total beside it."),
        'rec': (
            "<strong>Build it.</strong> The sync stores MAP's type code beside each title, and a new "
            "published table, rebuilt in the nightly promotion, carries per college and exhibit: title, "
            "CPL type, applied on the plan, transcribed, students and the recommendation text, with "
            "units per recommendation only where that cell reaches 10. Ten students a cell, a thin "
            "exhibit withheld with its smallest neighbor, and one line per college adding up the thin "
            "exhibits when two or more are hidden and together reach 10. Sierra gains a route for "
            "\"where does this college's applied or transcribed credit come from.\" <em>It might be "
            "wrong if</em> you need Chaffey's transcribed sources, which only item 6's reviewer tier "
            "can show."),
        'chips': [('Build it', 'build'), CH_LATER],
    })

    I.append({
        'title': 'Show items 4 and 5 to every viewer at 10 students a cell; hold a reviewer tier for later',
        'ref': 'deriveViewer (v66) · chat_interactions / sierra_feedback RLS · '
               'kb/governance_surface_map.json · Rule 10 (a3)',
        'facts': (
            "Sierra already tells a reviewer, the team and the public apart. Her answers are saved in "
            "two tables the team phrase can read, and the ADR keeps the team phrase away from the "
            "reviewer-only student numbers. The articulation view already opens to the team phrase; the "
            "military split lives only in the reviewer-only student table. Built at 10 students a cell, "
            "items 4 and 5 publish only what the ADR allows today, to every viewer, including a "
            "coordinator on My College. The two tables have one writer, the nightly promotion, and no "
            "human writer, so the governance map dismisses them with that reason."),
        'why': (
            "A reviewer tier would show the thin cells, Chaffey's transcribed sources among them. That "
            "widens who sees student-grain figures, so it goes through the Governance register and an "
            "ADR amendment first, and its answers need a home the team phrase cannot read."),
        'rec': (
            "<strong>Every viewer at 10 now.</strong> The reviewer tier waits until you want it, then "
            "goes through Governance. <em>It might be wrong if</em> reviewer depth is what you need "
            "this month; then both get built, the reviewer tier after its Governance row."),
        'chips': [('Every viewer at 10 now', 'k10'), ('Build the reviewer tier too', 'reviewer'),
                  CH_LATER],
    })

    I.append({
        'title': 'Write the Sierra Training rule after the data ships, and I draft it',
        'ref': 'sierra_feedback turn 1b9230ce (your note, status new) · sierra_guidance',
        'facts': (
            "Your note on the Chaffey answer reads: <em>\"Need to add the data for military vs. "
            "non-military split and the data to show the exhibits and CRs for the applied credit "
            "source.\"</em> A rule written today would ask Sierra for figures she cannot reach, and she "
            "would say so, as she did twice in that conversation."),
        'why': (
            "Once items 4 and 5 ship, the rule carries only what the data cannot: how to answer a "
            "source question."),
        'rec': (
            "<strong>Draft after the data ships.</strong> I draft it for you to paste into Training: "
            "answer where credit comes from by units from the exhibit table, never from a count of "
            "exhibits; give the thin exhibits as one line; lead a college with its non-military bucket, "
            "then military with its per-student context. Your note is marked addressed when the data "
            "ships. <em>It might be wrong if</em> you want a stopgap rule now telling Sierra to say the "
            "split is coming."),
        'chips': [('Draft after the data ships', 'after'), ('Draft a stopgap now', 'now'),
                  ('Dismiss', 'dismiss')],
    })

    return I


def build():
    I = items()
    out = m.build_sheet("Sierra Credit Sources", I, sheet_id=SHEET_ID)
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(I)} items · {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == '__main__':
    sys.exit(build())
