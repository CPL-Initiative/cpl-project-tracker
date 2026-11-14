---
title: "Session 652 handoff (from SkyDunlin, S651)"
created: 2026-11-14
updated: 2026-11-14
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyAvocet (Session 652)

From SkyDunlin, S651, the CPL Queue routine's 09:12Z firing of 2026-11-14, in conductor mode with no person in the
session. This is S651's **full checkpoint** (a lane's state changed and data receipts were written), written about 10:55Z
2026-11-14 (`date -u`) on `claude/practical-meitner-7bl2ta` (#3292) over `main` at `67ab1621`. A fact marked *as
reported* was not re-read by the session that wrote this file.

**How S651 ran.** The firing had no `list_sessions`, `get_trigger`, `send_later` or `set_session_tags`; the open PRs
(none updated since 08:26Z) and `main` at `6efd07e5` were the one-writer check, and draft #3292 declared the queue at
09:14Z. Sheet 196 had no replies at 09:15Z. `queue_todo_done`: none since 2026-11-14. No CER procedure request, no open
exhibit re-analysis. The dashboard run, the UI pass, the credential harvest and step 11's two runs for the UTC day were
already done by S650. The Supabase connector was up all session.

## First things, in order

1. **Read the replies on [Open Asks Sheet 196](https://claude.ai/artifact/9JJAP1MKrRgKGUdrxFo7yA)** (current,
   `SHEET_ID` `2026-11-14-open-asks-196`; no replies at 09:15Z) before any other work; carry out what Sam answered (card 1
   S649's decisions; card 2 delete HUMA M10ME and LIBR M10CJ; card 3 five Honors design choices; card 4 the identities
   apply and the 625). An unanswered card holds only itself. S651 added no ask; its decisions go on the next sheet's card 1.
2. **The one dry run on draft #3293** (`claude/passing-dry-run-s651`, head `cb60a1b0`, nothing applied, its migration
   not in `.apply`): read COBIx on #3111 from the last comment (his review of comment 6875299481, his answer on the
   own-list definition, the statewide count of neighbor-page word matches he asked for). Then one migration (applies on
   the push of `.apply`) and one rescore; Cosumnes River's seven held passes (04602, 04607, 04614, 07305, 11319, 11338,
   33542) follow it.
3. **Allan Hancock on #3284** (draft): the 12-page trial is due 2026-11-15 (`index=kb/course_outline_index/index_43566318943.json`,
   `slugs=allan_hancock`, `trial=12`), on the same branch; the helper said `trial; host hancockcollege unproven: 12 pages first`.
4. **#3283** (sdccd objectives, loaded): open, merging on green at writing. If still open, read its comments, poll
   `test` on its head, merge. Then the next objectives host, sac, writing `.load` by hand once every slice is filed.
5. **Lassen's five restored records** (31132, 33263, 33729, 33730, 42300): a capture pinned to `main`'s pages, then the
   same `set` step; and a per-record hold in the `set` step (31297's hold lives in the plan today).
6. **The display's gaps as structured fields** (`d-display-rule-withdrawn-structured-fields-s651`): a design, with a
   second reader on it before any builder change.
7. **The three colleges, for a session with a person** (Sam, relayed by COBIx on #3111, comment 6869724112, 01:52Z
   2026-11-14): Los Medanos an electives sentence in its own words; Monterey Peninsula three reader fixes (39266, 41831,
   03633) and why the build carries 03653, 22098, 39361; Los Angeles Valley a reading for 13 records or a structured export.

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it
(otherwise the open PRs and `main` since this handoff), `df -h /`, `git worktree list`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 (answered cards not on the
hold list), 2 once COBIx has answered (the migration and rescore are a data write: a second reader first), 3, 4, 5, and
code-only items from the lanes' NEXT lines. The display go of 2026-10-10 stands for every college; a merge that
publishes waits on COBIx's spot-check. **Never run without Sam's word:** the two Honors bot-row deletes (HUMA M10ME,
LIBR M10CJ); any Honors mint; the identities apply; the Sierra `is_test` deploy; anything on the `CLAUDE.md` hold
list. #2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S651, and what worked* included.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx (Sam, 2026-11-11, relayed by COBIx on #3110;
  `cpl_memory` `sam-conductor-model-fable-5-2-2026-11-11`). The routine's form sets the model and ultracode; medium
  effort lives in its prompt.
- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at **high** effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses **at most 9 agents in all**, readers and second readers together. Drop the second reader on
  minor findings first.
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Every brief that adds a test file says: its floor goes in `tests/check_floor.json`, run the tests touching your files
plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest. A brief that adds
a migration says: it applies on the push of the `.apply` change, before any merge.

## Ledger (PR, branch, state) at writing

| PR or branch | State | Next |
|---|---|---|
| #3292 `claude/practical-meitner-7bl2ta` | open: the declaration and this checkpoint | merge on green |
| #3291 (Lassen) | merged `8d6be618` (about 10:46Z, green `test` on `814aed46`); display run 43586782908 | First things 5 |
| #3294 (Veteran map header) | merged `f0339e38` (about 10:10Z) | library lane's minor NEXT |
| #3293 `claude/passing-dry-run-s651` | draft, head `cb60a1b0`, awaits COBIx | First things 2 |
| #3283 (sdccd objectives) | ready, open, merging on green at writing | First things 4 |
| #3284 (Allan Hancock) | draft, index landed | First things 3 (due 2026-11-15) |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| samueltlee/CPLBrain#787 `claude/determined-mayer-7bl2ta` | draft: this session's note (`0045274`) | merge on green |

Worktrees: all removed except the sdccd worker's (`.claude/worktrees/agent-a552ac7316dddcdea`, #3283), which the
conductor removes at its merge. Workers do not survive the session; brief a fresh worker per branch from its diff and
this ledger.

## What shipped (S651)

- **#3291 Lassen College**: the catalog prints Cal-GETC 34 (2026-2027 PDF p.72), so a `set` step; five rows reread.
- **#3294** the Veteran map's public header, built in `build_selfcontained.py`, hidden under `?embed=1`; `npm run a11y`
  passes light, dark and embed.
- **#3283** sdccd's course objectives loaded (2,532 rows).
- **Draft #3293** the one dry run, posted on #3111.
- **Plan v2 on #3111** (comment 6875146891) answering the issue's nine questions; the August drop settled (comment
  6875161191). `docs/reference/pipeline_reference.md` points at the funding sources (Q9; no total is named there).

## Live data written, each with its undo

- `program_requirement_records`, Lassen: reread run 43581530119 replaced exactly 30947, 31015, 31037, 31379, 32083
  (GE units 34; 30947 and 32083 pass; Lassen 35 to 37 of 59, the conductor's reads at about 09:41Z and 09:42Z); receipt
  `kb/receipts/program_requirement_records_college_reread_lassen_43581530119.json` (before-values, guarded rollback).
  Display run 43586782908 on `main` at `8d6be618` (10:45Z to 10:48Z, success); the conductor's read after it (about
  10:53Z): all 59 Lassen rows carry display build `a83667f9fa0d`. Undo: the receipt's rollback, then a display run.
- `course_outcomes`, sdccd: load run 43585473767 inserted 2,532 objective rows (San Diego City 698, Mesa 1,151, Miramar
  683); SLO rows unchanged at 2,229 (the conductor's reads before and after); receipt
  `kb/receipts/course_outcomes_sdccd_43585473767.json` names every id for rollback.
- `cpl_memory`: eight rows, `kb/receipts/cpl_memory_s651_rows_2026-11-14.sql` (run by the conductor at the checkpoint;
  its header says RUN once it is; undo by slug).
- No `kb_curation` write; no model spend.

## Decisions to honor

**Sam's:** none new in session (no person in it). Two go's relayed by COBIx on #3111 on 2026-11-14 stand, recorded as
his: 01:52Z, comment 6869724112, *"Ok, we could take those 3 and work the rules on them as a priority"*
(`sam-three-colleges-rules-first-2026-11-13`); 01:55Z, comment 6869751713, *"Yes, let the checker read Total Hours for
noncredit wherever the page prints it"* (`sam-noncredit-total-hours-2026-11-13`). His standing rulings in earlier
handoffs stand.

**The conductor's,** each a `cpl_memory` row (proposed) and a DECIDED line in its lane, for Sam to revise on the next
sheet's card 1: `d-lassen-five-rows-loaded-s651`, `d-display-rule-withdrawn-structured-fields-s651`,
`d-passing-dry-run-held-for-cobix-s651`, `d-sdccd-objectives-loaded-s651` (program-requirements-harvest);
`d-sierra-test-session-ids-excluded-s651` (sierra-retrieval-corpus); `d-strategic-plan-generated-in-commons-builder-s651`
(commons); fact `august-2026-transcribed-drop-pierce-s651` (map-custom-reports); pitfall
`p-word-guard-neighbor-page-pass-s651`.

## Pitfalls learned

- The word guard can pass a row on a match outside its own program's section (Lassen 32083, "elective" on p.93). COBIx
  ruled it stays loaded and asks for a statewide count before #3293 changes the rule.
- `reconciled[].words` holds curator notes, not catalog quotations; a rule that rewrites free text across colleges gets
  its second reader before it is built into a college PR (the display rule reverted at `7f0f1b91`).
- The outcomes helper never prints **load** for an objectives reread; write `.load` by hand.
- `list_workflow_runs` and `get_workflow_run` on a squash-merge head return the whole squash message (about 9,000
  tokens); read a run's state from the "Applied record" commit or a live read.

## COBIx threads

On #3111: plan v2 (6875146891), the August drop (6875161191) and the dry run (6875299481) await his reply; Q5 (the Pages
traffic archive recommended) and the own-list definition are his. On #3291 he spot-checked Lassen (checks 1 and 3 pass)
and ruled 32083 stays. His v2 on #3237 is still awaited. Read him from the last comment (`perPage` 1 from the last
page); never `get` #3111 or #3110.

## The Library (step 6 of the routine)

The same four rows, each waiting on a person, nothing built: `...-mwdvs6l1` Draft 2 `b18c5759` waits on Ally Barker's
*Publish it*; `...-mwdv9pl5` is its superseded duplicate; `adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5` has
ready draft `7a26c199` (pictures 4, 5 and 14 show names or emails to cover); `iaca-mvpmcjyl` waits on Crystal Nasio's
file.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** the one dry run (#3293) then Cosumnes River's seven; Lassen's five restored
   records and the `set` step's per-record hold; the display gaps as structured fields; objectives sac, laspositas,
   Coastline, Golden West; Allan Hancock's trial; the three colleges (a person); Cerro Coso 40922 and Grossmont 46141
   stay held; Chaffey's objectives-only read; the RCCD district profile; Glendale's three follow-ups; Desert 10195's
   stored hold; the reading-procedure check; the PDF headings; the free GE page reads; the district phase 0 builder; the
   wave sample.
2. **`commons`:** the data dashboard's MIS course matches and COE regional demand (each waits on a definition); Copper
   Mountain's registry `catalog_url` at its next capture; the Honors design (Sheet 196 cards 2 and 3); FIRE 130 X's
   row-audit card; the identities apply after Sam's word (card 4); the strategic plan file (not built); price the model
   pass; a potential-CPL column; the Leadership outlines.
3. **`sierra-retrieval-corpus`:** an `is_test` column set by the edge function (a deploy).
4. **`map-custom-reports`:** the MAP team or Pierce says what the August 6 and 7 drop was.
5. **`cer-procedures`:** the Exhibits rename batch with the ASE Certificate Bundles title; `series_aliases` into
   `kb/credential_aliases.py` (both write shared data: a reviewed plan first).
6. **`library`:** the Veteran map's minor follow-ups (480px logos, the HTML comment naming the vault path, the
   origin-wide theme key); the Fact Sheet's header; the four rows above.
7. **`governance-team-enablement`** and **`workplan-annual-goals`** (S649's side session; not worked in S650 or S651):
   the first daily log carrying `Daily push conflicted`; the pushing workflows' groups; key-reading workflows into
   environments; workplan NEXT 0a and 0c.
8. **Vault:** about ten older session-note PRs sit open as drafts on samueltlee/CPLBrain (#743 to #765); a session with
   a person decides whether to merge or close them.

## A full checkpoint: what it touched and what it skipped

Touched: the docs audit (and `--apply`); this handoff; the lanes `program-requirements-harvest`, `library`,
`sierra-retrieval-corpus`, `commons`, `map-custom-reports` (each under 20,000 bytes, retired text moved verbatim to the
lessons docs, *Moved from the lane (S651 checkpoint)*); the harvest lessons' S651 section and a compaction into archive
5; `conductor_mode.md`'s S651 lessons; the index rebuild; the run log `kb/status/program-requirements.json`; the memory
receipt; the vault note. **Skipped, with reason:** the pipeline view (no M-ID stage, auditor count or re-mint moved);
`kb/README.md` and `README.md` (no structure or user-facing surface beyond lane detail; the Veteran map's header is in
the library lane); `CLAUDE.md`'s §11 rows (no lane changed state); a KB note (the two lessons are recorded in
`conductor_mode.md` and the harvest lessons). Step 12's headline and harvest rows: see the run log's own `written_at`
and `headline` (refreshed only when the conductor's reads arrived). Wiki candidates (`/wiki-ingest`): the August 2026
drop in transcribed units is one college, Pierce.

## Let go

The conductor holds no PR subscription after sign-off (it unsubscribed #3294 and drops #3293's), no artifact watch and
no scheduled check-in; its background `sleep` timers end with it. The next session watches Sheet 196 and the drafts above.

Greetings, you are SkyAvocet (Session 652), see SkyDunlin's handoff — `docs/session_652_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_652_handoff.md) — let's keep rolling with our queue.
