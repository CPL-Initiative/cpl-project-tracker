---
title: "Session 706 handoff (from SkyTystie, S705, Sam's plain session of 2026-11-22: one Save settles a code at every college; the queue kept running beside it)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff (S703 SkyDovekie writes 704 on #3674, then its successors), never this file, even
though this file's number is higher. **Numbering.** The routine holds S703 and handoff 704 and will take the next numbers
tonight, so the next plain session is named **Session 707** and reads this file; if the routine has taken 707 by then,
take the next free number and say so in the handoff.

# You are SkyPrion (Session 707)

From SkyTystie (S705), Sam's plain session of 2026-11-22, 14:10Z to about 14:40Z. A **light checkpoint**: the commons
lane's text moved with its PR, one `cpl_memory` row, no re-mint and no data receipt. Skipped: steps 2, 3, 4 (no retired
text), 5, 7, 9, and in 12 every status file but `kb/status/subjects.json`.

## Open with the standing block (unchanged from handoff 703)

0. **COBIx's brief is on issue #3358** (comment 7064588752, Sam's two rulings of 2026-11-21); then issue #3655, the
   Subjects brief. No new COBIx comment landed between 11:00Z and 14:40Z.
0a. **Inside the routine's hours (06:12Z to 14:12Z), open a draft PR in your first minutes whose body declares a
   side-session scope** (*Subjects side session (<moniker>): <files> and <tables>*) and says the routine proceeds. This
   session did so with #3687 at 14:13Z.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; read it every few turns.
1a. **Clone light:** `git clone --filter=blob:none`, never a full clone.
2. **Merge rules:** at most 3 open PRs (the routine's own count separately), oldest first, one update from `main` right
   before a merge, `test` green on the head. COBIx reviews do not gate a merge.
2a. **Sam's work order (2026-11-20):** collection first, ranked by the M-ID cards it unblocks.
3. **Keep a plain session to about an hour and never stand the queue down**
   (`r-plain-session-short-and-queue-keeps-running-sam-2026-11-22`).

## What shipped

- **#3687** (`commons_subjects.js`): signed in, the course panel of a code used at several colleges carries *Settle
  <code> at every college*: one common subject code field and one Save that writes one `kb_curation` row per college
  (`field` `subject_decision`), keyed as that college's credit form keys it (`credit`, or `whole` where COCI lists no
  course), under the reviewer's own email. Before Save it names the colleges it writes; a college whose code another
  person or a filing settled keeps it and is named with its code; a noncredit-only code keeps its category forms, since
  each COCI noncredit category takes its noncredit MQ code; the reviewer's own earlier save keeps its title; a college
  already holding the reviewer's same code is not written again; a refused write names its college. Same surface as
  S701's single Save (DR-25), so no Governance change. Guard `tests/commons_subjects_every_college.test.js` (16
  checks); the other Subjects suites and `every_view_has_an_address` pass; `npm run a11y -- commons-subjects
  commons-subjects-dark` passed 15 routes.

- **Sam's four asks of 2026-11-22, on the same PR (#3687):**
  1. **Cerritos's department list.** Sam found Cerritos's schedule (https://secure.cerritos.edu/schedule/index.cgi),
     whose *All Departments* list names each code's title, and pasted it. Filed at
     `kb/reference/college_department_lists/cerritos.json`; `kb/_build_local_subject_titles.py` reads a college's list
     after the catalog (a code the catalog gives no title, or one whose catalog name is another code's department
     title): AED Adult Education, STAT Statistics. Procedure: `docs/kb-notes/playbook-local-subject-title-sources.md`.
     The Edit form takes a source link, saved as `source_url`, with *Open the link* to check it; the saved line links it.
  2. **The panel resizes from its left edge and its top row stays frozen**, Close included, inside one scroller. Sam
     made it a rule for every sidebar; it is in CLAUDE.md's presentation rules.
  3. **Move courses.** Signed in, each course in the panel has a checkbox (and one per table for all); *Move the checked
     courses* writes one `kb_curation` row per course, field `course_subject_decision`, key
     `CRS:<college>|<code>|<number>`, value `common_code`, `from_mid`, `title`, `band`, under the reviewer's email (DR-25,
     in `kb/governance_surface_map.json`). Another person's move is held; one's own shows *Take it back*. The M-ID moves
     only at a re-mint. 138 of Cerritos's 143 AED courses sit on ELEC M-IDs.
  4. **Every Subjects table sorts by a header word and resizes by its header's edge**, for the visit.
  Guards: `tests/commons_subjects_tools.test.js` (23), `tests/local_subject_titles_test.py` (the department list);
  `npm run a11y -- commons-subjects commons-subjects-dark` passed 15 routes.

## Decisions the session made (each Sam's to revise)

- `d-subjects-one-save-every-college-credit-forms-s705`: the every-college Save settles the credit forms only, and
  person-settled wins. It supersedes `d-subjects-several-colleges-one-press-each-s702`.
- `d-course-move-field-crs-key-s705`: a course move is one row keyed by college, code and number; it records the
  decision and the M-ID moves at a re-mint.
- `d-source-link-on-form-before-handover-s705`: the source link sits on the Edit form; the hand-over box's server reader
  for a subject source waits on a `commons_handover` dataset (a migration) and on its 503.
- The department list wins over the catalog only where the catalog's name is another code's department title (STAT);
  the eight other Cerritos codes the list words differently (AB, AUTO, EDT, ELAP, NAIS, VCS, WELD, WMT) keep the
  catalog heading, for a person to change on the page.

- **An M-ID's prefix no longer reads as a filing.** Sam read Cerritos AED's ELEC M-IDs as ELEC courses filed under
  AED. They are AED's own courses (older adults, painting trades, ironworkers, ESL, GED prep); the subject map's
  `"AED": "Electricity"` gave them ELEC M-IDs at the mint. The panel now says the courses are listed under the local
  code, counts the M-IDs minted under another code, and says the code's common subject code moves them at a re-mint;
  each such M-ID reads *(minted under ELEC)*. Sam's save sets AED (Short-term Vocational) to VOCE. The per-course move
  is for a course that belongs under a different code than the rest.

- **A category's save shows which courses it touches.** Sam read the AED panel as moving every listed course to VOCE.
  `kb/_build_subject_courses.py` now carries each noncredit course's COCI category (`category`, joined on the control
  number; a blank CreditType takes none, as `kb/_build_noncredit_categories.py` tallies), and the panel lists the
  noncredit courses under their category, each heading saying the code that category's save sets, that it applies to
  those courses only, and that the local subject stays. An enhanced course says *COCI, enhanced* on its row (it was a
  table of its own). Cerritos AED: Short-term Vocational 48 (VOCE, Sam's save), Basic Skills 32 (BSKL by its MQ, not
  saved), Workforce Preparation 19 (no code), ESL 8 (ESLN), Older Adults 6 (OLAD), Substantial Disabilities 3 and Health
  and Safety 2 (no code), 1 with no category, and 24 with no credit type or category in the export.

- **Exhibits Review card, Sam's asks of 2026-11-22 (same PR):** Previous and Next move without saving and Undo is its
  own word; the line under the words says which title Change saves; *Changes this visit* lists before and after at the
  foot; *Move the issuer to training sites* and *Edit training sites* (a side panel with the List's editor, frozen top,
  resizable) replace the link that left the view; a source id opens MAP in a new tab where Course details is not drawn;
  Course details looks in another subject (`kb/_build_exhibits_review.py` writes every discipline, 250 titles each,
  from tonight's rebuild; code-only, the file is the runner's). The Commons List's side panel (`commons_list.js`, every
  List) now holds its place in the window with its trail and Close fixed and its body scrolling. `a11y` passed
  `exhibits-review-card` light and dark. The card also shows **Articulated with**: each college course, its units and
  its credit recommendation (`credit_recs` on each card from tonight's rebuild), and an exhibit with none reads, in a flag,
  that it is not a valid exhibit and needs MAP team follow-up (`r-exhibits-card-shows-articulated-course-cr-sam-2026-11-22`).
  Today's 37 held cards all carry one; the flag has no case yet. A worklist of flagged exhibits for the MAP team is the
  next step if Sam wants one.

- **Sam's two answers at about 16:15Z:** the four noncredit MQ disciplines take common codes (CTZN, HLSN, HMEN, DSPN;
  shipped on #3687, `r-noncredit-four-mq-codes-sam-2026-11-22`); and exhibits with no credit recommendation go on the
  MAP team worklist (`r-map-team-worklist-for-no-cr-exhibits-sam-2026-11-22`). **The worklist is built** on the MAP Team Queue tab
  (`map_team_queue.js`, item `exhibits-no-cr`): it counts the held exhibits whose `credit_recs` is empty, names each
  with its college and MAP id, and reads unknown until tonight's rebuild writes `credit_recs` (guard
  `tests/map_team_queue.test.js`, S705 block). Sam: *"we have a cobi tab for map team to-do but I don't think I've used
  it since creating it"*. Next: widen it from the held cards to every statewide exhibit with no credit recommendation.

## Decisions Sam made (in session, verbatim in `cpl_memory`)

`r-college-department-list-is-a-title-source-sam-2026-11-22`, `r-subject-title-source-link-sam-2026-11-22`,
`r-sidebars-resize-and-frozen-top-sam-2026-11-22`, `r-subjects-move-courses-sam-2026-11-22`,
`r-subjects-columns-sort-resize-sam-2026-11-22`, `r-mid-prefix-is-not-the-local-subject-sam-2026-11-22`, and on Exhibits
`r-exhibits-review-nav-undo-apart-sam-2026-11-22`, `r-exhibits-review-say-what-change-saves-sam-2026-11-22`,
`r-exhibits-review-session-changes-list-sam-2026-11-22`, `r-exhibits-review-edit-sites-in-place-sam-2026-11-22`,
`r-exhibits-look-in-another-subject-sam-2026-11-22`.

## Open work, from the lanes' NEXT lines

1. **`commons`, the Subjects page (#3655), in order:** (000) the subject map's `"AED": "Electricity"` (keyed by code
   alone) read against every college's AED and corrected, then a re-mint dry run for Cerritos AED's ELEC M-IDs by the
   code's decisions per noncredit category; (00) the course moves into the re-mint:
   `kb/_sync_subject_decisions.py` reads `course_subject_decision` into the committed file, then a re-mint dry run under
   `docs/coursecontrolnumber_remint.md` for the Cerritos AED courses Sam moves; the hand-over box's *Try the link* for a
   subject source; the frozen top and grip on the other Commons sidebars (Sam's rule); (0) the statewide default by the DR-25 route, in
   `kb/reference/subject_discipline_map.json`, for a code that reads the same at every college (the map is keyed by code
   alone, `f-subject-map-ignores-credit-band-s698`); (1) the per-course reader through `for_noncredit_course` in
   `kb/subject_decisions.py`; (2) the 8 catalog pages a web search found; (3) the code spellings as sibling codes (LATTC
   LABR is LABR ST, REAL is REAL ES; El Camino E DEV is EDEV); (4) the stale Common SUBJ in the state list's M-ID column
   (THEA, ECED, FLKO). Those three are M-ID prefixes such as `FLKO M1001`, so resolve them through `kb/alias_chain.py`
   (Rule 7) before you compare them, and find which surface the "state list" names first; (5) the common-code list with
   the noncredit MQ disciplines.
2. **`commons`, the rest, `cer-procedures`, `repo-size`, `common-subjects-reference`, `library`:** as handoff 703 lists
   them; nothing moved here. The commons lane is 21,500 bytes against its 20,000 limit (it was 20,772 at the start):
   compact it at the next full checkpoint.
3. **`program-requirements-harvest`** is the routine's.

## Not answered by Sam

- The 192 Cerritos courses whose M-ID sits under another Common SUBJ (a re-mint; on no reply nothing is re-minted).
- The TBA figures on the College Data Collection card, and the Plan card's phases (handoff 698).
- His closer look at the noncredit title list.

## Pitfalls from this run

- **`cpl_memory.summary` is capped at 400 characters** (`cpl_memory_summary_check`); the insert fails with a
  check-constraint error that does not name the length.
- **The `test` check was absent on the head right after a draft PR was marked ready**; the gate waits for it.
- **The auto-mode check refused an ad-hoc Playwright script against a local server**; `npm run a11y` is the sanctioned
  browser pass and ran clean.

## Memory and vault

Eight `cpl_memory` rows by `SkyTystie (S705)`: one at 14:25Z with S702's one-press-each row superseded
(`kb/migrations/2026-11-22_s705_cpl_memory_rows.sql`), seven later, Sam's five statements verified and two decisions
(`kb/migrations/2026-11-22_s705b_cpl_memory_rows.sql`); rollbacks beside each. Vault: a session note on a draft PR in
samueltlee/CPLBrain. Wiki candidate for `/wiki-ingest`: the every-college Save and its person-settled rule.

## Let go

Still held at the last checkpoint (16:25Z): the PR subscription on #3687, and one check-in (`S705: recheck main's lints
for #3687`, trigger `trig_01WZN1tsonQugRm4EmtHwcC1`, 16:17Z) that merges #3687 once S703's #3689 makes `main` green. The
COBIx watcher stopped at its two-hour limit at about 16:10Z and was not restarted; no COBIx comment arrived while it ran.
No artifact is watched. #3687 merges on a green `test` after #3689; if this session has ended first, the next session
merges it (update from `main`, `test` green on the head, squash).

Spend: not available; 2026-11-22T14:10Z to about 16:25Z. Context at the checkpoint: 677,014 of 786,077 tokens.

Opening line: *Greetings, you are SkyPrion (Session 707), see SkyTystie's handoff — `docs/session_706_handoff.md` — let's keep rolling with our queue.*
