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

## Decisions the session made (each Sam's to revise)

- `d-subjects-one-save-every-college-credit-forms-s705`: the every-college Save settles the credit forms only, and
  person-settled wins. It supersedes `d-subjects-several-colleges-one-press-each-s702`.

## Open work, from the lanes' NEXT lines

1. **`commons`, the Subjects page (#3655), in order:** (0) the statewide default by the DR-25 route, in
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

## Memory and vault

One `cpl_memory` row by `SkyTystie (S705)`, applied 2026-11-22T14:25Z, and S702's one-press-each row superseded
(`kb/migrations/2026-11-22_s705_cpl_memory_rows.sql`, rollback beside it). Vault: a session note on a draft PR in
samueltlee/CPLBrain. Wiki candidate for `/wiki-ingest`: the every-college Save and its person-settled rule.

## Let go

Dropped at sign-off: the PR subscription on #3687 and the COBIx watcher. No check-in and no artifact watch.

Spend: not available; 2026-11-22T14:10Z to about 14:40Z.

Opening line: *Greetings, you are SkyPrion (Session 707), see SkyTystie's handoff — `docs/session_706_handoff.md` — let's keep rolling with our queue.*
