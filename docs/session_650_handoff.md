---
title: "Session 650 handoff (from SkyOriole, S649)"
created: 2026-11-14
updated: 2026-11-14
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyPlover (Session 650)

From SkyOriole, S649. This is the S649 **final state**, a **light refresh** of the full checkpoint #3271 (`a8ea580b`,
merged 01:39Z 2026-11-14), written about 03:06Z 2026-11-14 (`date -u`) on `main` at `18c74d87`. A fact marked *as
reported* was not re-read by the session that wrote this file. Times come from GitHub's timestamps or `date -u`.

**How S649 ran.** Conductor mode (Fable 5.2 conductor, Opus 5.5 workers, ultracode on), from 22:21Z 2026-11-13 on
handoff 649, Sam in session (his statements below). The Supabase connector was up all session. A side session Sam
opened from iOS at 23:52Z, **SkyOriole-B** (`session_01Rvwe2XpJ9892BvDE9kTT2v`), took the nine carried lanes, small
governance items and the identities rebuild; it writes no numbered handoff (its ledger is below).

## First things, in order

1. **Build Open Asks Sheet 196 first**, before any other work: Sheet 195 is fully answered and carried out. Its cards
   must carry: (a) *Needs your word*: delete the two `automerge-v1@bot` rows HUMA M10ME and LIBR M10CJ so HUMA M1110's
   and LIBR M1040's Honors courses stand apart (the commons lane's NEEDS SAM (a)); (b) the Honors design choices:
   numbering of a new Honors M-ID, one-way or two-way equivalence, the `honors_of` field, equivalence rows for the 508
   pairs already apart, who is asked about MATH M1044 (NEEDS SAM (b)); (c) the side session's 625 held identity entries
   and its refused commit (its own ask; read its message first); (d) card 1, the conductor's decisions since Sheet 195
   (the seven rows of statement 2 in `kb/receipts/cpl_memory_s649_final_rows_2026-11-14.sql`, the positions on #3237,
   #3229 and #3111, and the `kb/credentials.json` edit taken as inside card 4). The builder demands (a) and (b) from
   the commons lane's markers. Publish under a fresh `SHEET_ID`; then move `CLAUDE.md`'s pointer (byte-neutral).
2. **The memory receipt** `kb/receipts/cpl_memory_s649_final_rows_2026-11-14.sql`: both statements are RUN (statement 2 at 03:07Z 2026-11-14, 7 rows); nothing to run.
3. **#3265** (`claude/slo-objectives-rccd`, head `68a5c8b7`): merge on a green `test` if the conductor did not (open
   at 03:05Z). Its load is done.
4. **Los Medanos, Monterey Peninsula, Los Angeles Valley:** work their rules first (Sam, below).
5. **The one dry run** for the three passing-function changes (noncredit Total Hours; the own-list rule; the
   GE-pattern certificate rule), by college, posted on #3111 before any rescore; one migration, one rescore.
6. **Objectives reread:** sdccd (not started), then sac, laspositas, Coastline, Golden West, one host at a time.
7. **Cosumnes River** 30566 and 33072 (a capture that picks pp.552 and 404), then its seven rescore-only passes
   (04602, 04607, 04614, 07305, 11319, 11338, 33542); Cerro Coso 40922 and Grossmont 46141 stay held (Sheet 82).
8. **COBIx:** post Sky's plan v2 against COBIx's nine questions on #3111 as your first COBIx item; await his v2 on
   #3237.
9. **Commons data dashboard:** Copper Mountain's link split; MIS course matches; COE regional demand;
   `#commons/data` into `a11y.config.js`; the builder's no-objectives list from `OBJECTIVES_BY_SYSTEM`.
10. **Exhibits:** the cross-tab reload (#3260); two `exhibits.js` fetches under `kb/*_dryrun` that 404 on the
    deployed site; the rename batch with the ASE Certificate Bundles title; `series_aliases`.
11. **Look at the deployed site:** no session has yet seen the new College Data Collection page or the Exhibits
    Review fix there (both verified in tests, a local browser review and committed data only).

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it
(the side session may still be working: read its open PRs first), `df -h /`, `git worktree list`, and the issues COBIx
opened or commented on today, checked against this list. Read the replies on [Open Asks Sheet 195](https://claude.ai/artifact/WqSfUB7wrQdxpX1ShbYRhX)
(complete, current until 196 is published). Before any merge, read COBIx from the last comment (`perPage` 1 from the
last page); never `get` #3111 or #3110.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 (build and publish the
sheet), 2, 3, 6, 7 (one plan, compared with main first), 9 and 10 (code only); the display go of 2026-10-10 stands for
every college, and a merge that publishes waits on COBIx's spot-check. **Never run by a session without his word:**
the two Honors bot-row deletes; any Honors mint; the identities apply; anything on the `CLAUDE.md` hold list. #2894 is
his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S649, and what worked* included.

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
| #3265 `claude/slo-objectives-rccd` | open, head `68a5c8b7`; the load ran | merge on green `test` |
| this refresh, `claude/checkpoint-s649-final` | open | merge on green |
| #3268, #3278 (side session) | open | its own gates |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| merged since the checkpoint: #3271 (01:38Z), #3270 and #3267 (02:02Z), #3275 `b27d7aab` (02:12Z), #3274 `a7af46ee` (02:32Z), #3272 `91d451aa` and #3276 `18c74d87` (02:55Z) | merged | none |
| #3250 | closed 01:21Z (Sheet 195 card 5) | none |

Workers do not survive the session; brief a fresh worker per branch from its diff and this ledger.

## What shipped (S649 in all)

- **#3260, #3269** Exhibits Review: a decided card stays decided (held queue 168 to 0).
- **#3263** objectives collected with every SLO read; **#3265** the Riverside district's objectives loaded.
- **#3259** Cerro Coso Cal-GETC 35; **#3262** Cosumnes River 39656 at the statewide 34.
- **#3261** College Data Collection, Sam's asks 1 to 5.
- **#3274** the BUSI M1228 split (Sheet 195 card 3); **#3275** the three CVMA rows (card 4); #3250 closed (card 5).
- Side session: #3266, #3270, #3267 (design principles v3), #3276 (`docs/reference/sam_rulings.md`, 57 quoted
  rulings), #3272 (the identities rebuild as a reviewed dry-run plan, nothing applied).

## Live data written, each with its undo

- `program_requirement_records`, Cerro Coso: 5 rows (reread 43521333437); Cosumnes River: 1 row, 39656 (reread
  43523284838); before-values in each `kb/receipts/program_requirement_records_college_reread_*` receipt. Display
  builds: Cerro Coso record `b9f9af4d`; Cosumnes River run 43538586107, record `99229a48` (*as reported*).
- **The BUSI delete:** one guarded DELETE of BUSI M10XW merge_into BUSI M1228 (`automerge-titlelane-v1@bot`),
  `kb/migrations/2026-11-14_s649_busi_split_delete.sql`, run 43542044321; the receipt holds the row whole; undo: the
  rollback file re-inserts it. Live reads before and after by the conductor; daily run `bb25d373` published it.
- **The CVMA migration:** `kb/migrations/2026-11-14_s649_cvma_three_rows.sql`, run 43542969094: two value-only
  UPDATEs (before-values in the receipt) and one DELETE (whole in the receipt); undo: the rollback restores all three.
  The three `kb/credentials.json` copies revert with #3275.
- **The rccd objectives load:** run 43546799435, 2,536 `course_outcomes` rows (kind objective; Moreno Valley 640, Norco
  754, Riverside City 1,142), no SLO row touched; receipt `kb/receipts/course_outcomes_rccd_43546799435.json` (undo by
  its ids; read it with a script that prints scalars only).
- `cpl_memory`: the checkpoint's 14 rows (`kb/receipts/cpl_memory_s649_rows_2026-11-14.sql`, RUN); Sam's three rows of
  statement 1 of `kb/receipts/cpl_memory_s649_final_rows_2026-11-14.sql` (RUN about 01:22Z and 02:58Z); its statement
  2 is RUN (03:07Z 2026-11-14, 7 rows). Undo by slug.
- No `kb_curation` write beyond the BUSI delete; no model spend.

## Decisions to honor

**Sam's:** (1) Sheet 195, Complete 01:18Z (`sam-sheet-195-answers-2026-11-14`): card 1 as proposed; card 2 *Take every
recommendation* (Honors: M-IDs only; keep AJ 160, MUS 130 and REAL; MATH M1044 after the MAP team settles it); card 3
*Remove the row*; card 4 *Fix both, remove the Water Treatment row*; card 5 *Close it, keep Sheet 82*. (2) 5:51 PM PT
2026-11-13, relayed by COBIx on #3111 (comment 6869724112; `sam-three-colleges-rules-first-2026-11-13`): *"Ok, we could
take those 3 and work the rules on them as a priority."* (Los Medanos, Monterey Peninsula, LA Valley.) (3) 5:54 PM PT
(comment 6869751713; `sam-noncredit-total-hours-2026-11-13`): *"Yes, let the checker read Total Hours for noncredit
wherever the page prints it."* (4) In session about 02:57Z: *"Any thoughts for Cobix on **#3237 (college bots), #3111
and #3229:**"*, and about 02:59Z: *"Sounds good! Appreciate you Sky!!!"* (5) Earlier in S649: the Las Positas loop
(`sam-review-loop-las-positas-2026-11-13`) and the six College Data Collection asks
(`sam-data-collection-six-asks-2026-11-13`).

**The conductor's,** each a row and a DECIDED line in its lane: the checkpoint's twelve (receipt
`cpl_memory_s649_rows_2026-11-14.sql`); since then `d-busi-split-delete-applied-s649`, `d-cvma-three-rows-applied-s649`
(the `kb/credentials.json` copies taken as inside card 4), `d-honors-mids-stopped-for-design-s649`,
`d-rccd-objectives-loaded-s649`, `d-specialist-pilot-counterproposal-s649`, `d-one-rescore-for-three-rules-s649`;
pitfall `p-back-to-back-merges-stale-status-s649`.

## COBIx threads: the conductor's positions (posted about 02:57Z)

- **#3237** (comment 6870604909, counterproposal v1): pilot accepted, RCCD, then LACCD, then Citrus; three real
  district profiles first (`kb/district_profiles/` holds a schema and an example only); claims enforced by CI from a
  committed claims file; before any parallel run, the reconcile config split per college, one owner rebuilding
  generated files after merges, a first reconcile compared record by record; four worktrees a container, one conductor
  checks about five specialists, review is the bound; the pilot measures session tokens per newly passing program for
  Sam before a 14-day go; PUSH doctrine stays in the tracker's `CLAUDE.md`, a Home Repo held until the pilot shows what
  a specialist reads at start. COBIx's v2 is awaited.
- **#3229** (comment 6870605500): COBIx's GE-pattern completion-certificate rule (89 programs: 36 Cal-GETC, 28 IGETC,
  25 CSU-GE, at 47 colleges; comment 6869816372) accepted with three amendments (evidence quoted per college in the
  reconcile config; IGETC and CSU-GE checked for Active and teach-out first; one migration). Only Copper Mountain's
  catalog link is broken: split the displayed link from the capture root; a 500 from Pingora with an empty body reads
  "unreachable from here". The default sort is built.
- **#3111** (comment 6870605963): Sam's two go's taken; one dry run by college, one migration, one rescore for the
  three passing-function changes; the plan becomes `kb/strategic_plan.json` with a read-only view whose measures point
  at live sources; the next conductor posts Sky's plan v2 against COBIx's nine questions first.

## The side session (SkyOriole-B), as reported by it at 02:40Z

Merged #3266, #3270, #3267, #3276, #3272 (the last two confirmed on `main`). Open: #3268 (workplan reports) and #3278
(Pages publishes from an allowlist, issue #3104: once it merges, a NEW tracked file at the repo root or directly under
`kb/`, `kb/reference` or `kb/status` needs a line in `.github/pages_allowlist.txt` or `test` fails). It plans a
follow-up withholding `kb/contacts_harvest` (named officials with email and phone, served by Pages today), `.claude/`,
`CLAUDE.md` and `kb/migrations` from the site. Its ask (the 625 held identity entries, the refused commit) goes on
Sheet 196.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** the three colleges; the one dry run; the objectives reread; Cosumnes River;
   the held overlaps; Chaffey; the RCCD district profile; then Glendale, the Desert hold, the reading-procedure check,
   the PDF headings, the free GE page reads, Monterey Peninsula's three, the district phase 0 builder, the wave sample.
2. **`commons`:** the data dashboard's NEXT (Copper Mountain, MIS, COE, a11y, `OBJECTIVES_BY_SYSTEM`); the Honors
   design and its two cards; FIRE 130 X's row-audit card; the identities apply after Sam's word; price the model pass;
   a potential-CPL column; the Leadership outlines.
3. **`cer-procedures`:** the cross-tab reload; the two 404 fetches; the rename batch with the ASE title;
   `series_aliases`; its NEXT list.
4. **Side session's lanes** (`governance-team-enablement`, `library` and the nine carried lanes), each with its own
   NEXT.

## A light refresh: what it touched and what it skipped

Touched: the docs audit; this handoff; the lanes `program-requirements-harvest`, `commons`, `cer-procedures` (each
under 20,000 bytes, retired text moved verbatim to `docs/program_requirements_harvest_lessons.md`,
`docs/commons_lessons.md` and `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S649 final refresh)*);
`conductor_mode.md`'s S649 lessons; the index rebuild; the memory receipt (both statements RUN).
**Skipped, with reason:** the run logs under `kb/status/` (step 12: the headline and harvest rows need Supabase reads
this refresh did not make; the next checkpoint refreshes them, and #3265 rebuilt `commons_data.json`); the vault note
and the wiki `log.md` line (the documents worker cannot write to `CPLBrain`; the conductor holds the text); the
`CLAUDE.md` sheet pointer (Sheet 195 stays current until 196 is published); the pipeline view, `kb/README.md`,
`README.md` and a new KB note (nothing moved). Wiki candidates (`/wiki-ingest`, not written): Sam's three-colleges and
noncredit Total Hours rulings; the specialist pilot's conditions.

## Lessons after the checkpoint

- Back-to-back merges left a generated status file stale twice; the second of two merges re-runs on the new `main`.
- Read a load receipt with a script that prints scalars only (2,536 ids reached the conductor's context).
- Length-check every memory row by script, the conductor's own included.
- A container restart stops workers mid-wait; a GitHub run finishes anyway: read the branch, resume by message.

## Let go

Every PR subscription was dropped as it was created. The artifact watches on Sheet 194 and Sheet 195 are the
conductor's to drop at sign-off; no scheduled check-in is meant to stay armed (the conductor names any that does).

Greetings, you are SkyPlover (Session 650), see SkyOriole's handoff — `docs/session_650_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_650_handoff.md) — let's keep rolling with our queue.
