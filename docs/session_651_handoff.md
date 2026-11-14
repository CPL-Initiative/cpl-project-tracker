---
title: "Session 651 handoff (from SkyPlover, S650)"
created: 2026-11-14
updated: 2026-11-14
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyDunlin (Session 651)

From SkyPlover, S650, the CPL Queue routine's 06:12Z firing of 2026-11-14, in conductor mode with no person in the
session. This is S650's **full checkpoint** (a lane's state changed and data receipts were written), written about 07:40Z
2026-11-14 (`date -u`) on `claude/practical-meitner-bxjpkg` (#3282) over `main` at `24205f4c`. A fact marked *as
reported* was not re-read by the session that wrote this file.

**How S650 ran.** The firing had no `list_sessions`, `get_trigger`, `send_later` or `set_session_tags`; the open PRs and
`main` since handoff 650 were the one-writer check (only Sam's #2894 open), and draft #3282 declared the queue at 06:20Z.
The daily dashboard run had already landed (`bb25d373`, 02:40Z), so nothing was dispatched for it. The Supabase connector
was up all session. `queue_todo_done`: no rows since 2026-11-13. No CER procedure request; the one exhibit re-analysis
request is done.

## First things, in order

1. **Read the replies on [Open Asks Sheet 196](https://claude.ai/artifact/9JJAP1MKrRgKGUdrxFo7yA)** (current,
   `SHEET_ID` `2026-11-14-open-asks-196`) before any other work; carry out what Sam answered (card 1 S649's decisions;
   card 2 delete HUMA M10ME and LIBR M10CJ; card 3 five Honors design choices; card 4 the identities apply and the 625).
   An unanswered card holds only itself.
2. **Lassen on #3291** (draft, `claude/sweep-next-s650`, head `cb9c3350`): the free Cal-GETC page read (plan
   `kb/college_reads/lassen_cal_getc_page.json`) started on the push. Next: the reconcile config entry with quoted
   words, `step=reconcile extract=0`, `--calgetc-review --restore`, `step=reread`, the display build, COBIx's
   spot-check. All free. Ten records fail on arithmetic alone (30947, 31015, 31037, 31132, 31379, 32083, 33263, 33729,
   33730, 42300).
3. **sdccd objectives on #3283** (draft): `kb/course_outcomes/.run` with `index_38350560193.json`, slugs
   san_diego_city, san_diego_mesa, san_diego_miramar, `parts=4`, started about 06:25Z, due about 09:30Z. Once every
   slice is filed, write `.load` (`host=` as the helper prints, `kind=objective`); read the load receipt with a script
   that prints scalars only. Its first commit's Claude-Session trailer names the wrong session; leave it.
4. **Read #3284** (draft): Allan Hancock's course outline index (preparation run).
5. **The one dry run** for the passing-function changes, by college, posted on #3111 before any rescore: noncredit
   Total Hours; the own-list rule; the GE-pattern certificate rule; and **the degree electives-fill guard** (the fill
   must check the units it fills; `p-degree-electives-fill-false-pass-s650`). One migration, one rescore. Cosumnes
   River's seven held passes (04602, 04607, 04614, 07305, 11319, 11338, 33542) follow it.
6. **The three colleges, for a session with a person** (Sam's priority): Los Medanos an electives sentence in its own
   words; Monterey Peninsula three reader fixes (39266, 41831, 03633) and why the build carries 03653, 22098, 39361;
   Los Angeles Valley a reading for 13 records ("not used in List A", the STEM 18-21 lists) or a structured export.
7. **COBIx:** post Sky's plan v2 against COBIx's nine questions on #3111; await his v2 on #3237. Read him from the
   last comment (`perPage` 1 from the last page); never `get` #3111 or #3110.

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it
(otherwise the open PRs and `main` since this handoff), `df -h /`, `git worktree list`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 (carry out answered cards
that are not on the hold list), 2, 3, 4, and 5 up to the dry run's post on #3111 (the rescore waits on the post's
review); code-only items from the lanes' NEXT lines. The display go of 2026-10-10 stands for every college; a merge
that publishes waits on COBIx's spot-check. **Never run without Sam's word:** the two Honors bot-row deletes (HUMA
M10ME, LIBR M10CJ); any Honors mint; the identities apply; anything on the `CLAUDE.md` hold list. #2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S650, and what worked* included.

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
| #3282 `claude/practical-meitner-bxjpkg` | open: the declaration and this checkpoint | merge on green |
| #3285 | merged `b07aafb0` | none |
| #3286, #3290 | merged `edf92643`, `24205f4c` | none |
| #3287 | merged `b48434bd` (credential harvest 2026-11-14) | none |
| #3289 | merged `26d3849b` (UI pass: the Veteran map) | none |
| #3288 (Cosumnes River) | merged `<MERGE_SHA_3288>`; display run `<DISPLAY_RUN_3288>` | COBIx spot-checked; none |
| #3291 `claude/sweep-next-s650` | draft, head `cb9c3350`, Lassen's page read running | First things 2 |
| #3283 | draft, sdccd objectives read running | First things 3 |
| #3284 | draft, Allan Hancock outline index | First things 4 |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| samueltlee/CPLBrain#786 | open: Sheet 196's source, this session's note | merge on green |

Workers do not survive the session; brief a fresh worker per branch from its diff and this ledger.

## What shipped (S650)

- **Open Asks Sheet 196** published (four cards); vault `a218014b`, CPLBrain#786; `CLAUDE.md`'s pointer moved
  byte-neutral on #3282.
- **#3285** Exhibits: a title cleared in another browser tab reopens its card without a reload; the two
  `kb/cred_rename_dryrun` reads publish. A second reader and COBIx found the same fault (a browser-tab return put the
  reviewer on card 1 with the Teach draft open); fixed before the merge.
- **#3286, #3290** College Data Collection: Copper Mountain's displayed catalog link split from the capture root; the
  SLOs view and the catalog pane in `a11y.config.js` (11 routes pass); the no-objectives list from one source
  (`kb/_objectives_by_system.py`); COBIx's three findings built (the override expires loudly).
- **#3287** credential harvest: Oracle, Cisco, NVIDIA, Salesforce, Meta, Amazon Web Services, IBM; 3 new, 0 changed;
  stopping-rule count 3 of 14; cisco.com refused curl (403) and was read with the fetch tool.
- **#3289** the UI pass, the Veteran map: a11y passes light, dark and embedded; the CPL page link 21px to its 44px row;
  two 24px floors to 25px. The missing public header is a NEXT in the library lane.
- **#3288** Cosumnes River's two pinned pages loaded (below).
- The deployed site, looked at signed out: root, `#commons/data` (118 rows, default sort, Copper Mountain's pane; the
  deploy carried #3286 at 06:58:58Z), the Exhibits shell asks for sign-in and its two files return 200, withheld paths
  404, Sierra, the Fact Sheet, the Library and the Veteran map load.

## Live data written, each with its undo

- `program_requirement_records`, Cosumnes River: reread run 43568812092 replaced exactly two rows, 30566 Psychology
  AA-T (p.552) and 33072 History AA-T (p.404), GE units 34, both pass (filed passing 136 to 138); receipt
  `kb/receipts/program_requirement_records_college_reread_cosumnes_river_43568812092.json` (before-values; the guarded
  rollback restores them). The conductor read the table before (about 06:40Z) and after (about 07:13Z); COBIx
  spot-checked both against the public catalog. Display: `step=display`, `display_college=Cosumnes River College`, run
  `<DISPLAY_RUN_3288>` on `main` after merge `<MERGE_SHA_3288>`.
- `cpl_memory`: five rows, `kb/receipts/cpl_memory_s650_rows_2026-11-14.sql` (NOT YET RUN at writing; undo by slug).
- No `kb_curation` write; no model spend.

## Decisions to honor

**Sam's:** none new this session (no person in it). His standing rulings in handoff 650's *Decisions to honor* stand.

**The conductor's,** each a `cpl_memory` row and a DECIDED line in its lane: `d-cosumnes-two-pins-loaded-seven-held-s650`
(program-requirements-harvest); pitfall `p-degree-electives-fill-false-pass-s650` (the fill fills a degree's major
total and its guard accepts any "elective"; 11338 with 6 of 24 units placed and 04614 with ten codes missing would
pass; KB note `methodology-a-fill-must-check-what-it-fills`); `d-sheet-196-published-s650`;
`d-lassen-calgetc-page-read-s650`; `d-library-four-wait-on-people-s650` (library).

## COBIx threads

Nothing new from COBIx on #3110, #3111, #3237 or #3229 since S649's three notes; his v2 on #3237 is awaited. He
verified #3285's fix and spot-checked #3288's two records. Sky's plan v2 against his nine questions on #3111 is not
posted (First things 7).

## The Library (step 6 of the routine)

Four open rows, each waiting on a person, nothing built: `...-mwdvs6l1` Draft 2 `b18c5759` waits on Ally Barker's
*Publish it*; `...-mwdv9pl5` is its superseded duplicate (retiring it is her press);
`adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5` has ready draft `7a26c199`, whose pictures 4, 5 and 14 show
names or emails to cover before publishing; `iaca-mvpmcjyl` waits on Crystal Nasio's file (a SharePoint deck).

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** Lassen; sdccd `.load`, then sac, laspositas, Coastline, Golden West; the one
   dry run with the electives-fill guard, then Cosumnes River's seven; the three colleges (a person); Cerro Coso 40922
   and Grossmont 46141 stay held; Chaffey's objectives-only read; the RCCD district profile; Glendale's three
   follow-ups; Desert 10195's stored hold; the reading-procedure check; the PDF headings; the free GE page reads; the
   district phase 0 builder; the wave sample.
2. **`commons`:** the data dashboard's MIS course matches and COE regional demand (each waits on a definition of the
   per-college figure); Copper Mountain's registry `catalog_url` at its next capture (a live write); the Honors design
   (Sheet 196 cards 2 and 3); FIRE 130 X's row-audit card; the identities apply after Sam's word (card 4); price the
   model pass; a potential-CPL column; the Leadership outlines.
3. **`cer-procedures`:** the Exhibits rename batch with the ASE Certificate Bundles title; `series_aliases` into
   `kb/credential_aliases.py` (both write shared data: a reviewed plan first).
4. **`library`:** the public header on the Veteran map, built in `build_selfcontained.py` and hidden under `?embed=1`;
   the four rows above.
5. **`governance-team-enablement`** (S649's side session; not worked in S650): read the first daily log carrying
   `Daily push conflicted` or `Daily push rebased over a changed input`; which of the 21 self-grouped pushing workflows
   share a group; move the other key-reading workflows into environments, one PR per group.
6. **`workplan-annual-goals`** (S649's side session; not worked in S650): its NEXT 0a (read the S426 migration's
   receipt) and 0c (drop `current` once a build publishes with `cur_*`, one migration).
7. **Vault:** about ten older session-note PRs sit open as drafts on samueltlee/CPLBrain (#743 to #765); a session with
   a person decides whether to merge or close them.

## A full checkpoint: what it touched and what it skipped

Touched: the docs audit (and `--apply`); this handoff; the lanes `program-requirements-harvest`, `commons`, `library`
(each under 20,000 bytes, retired text moved verbatim to their lessons docs, *Moved from the lane (S650 checkpoint)*);
the harvest lessons' S650 section; `conductor_mode.md`'s S650 lessons; a KB note; the index rebuild; the run logs
`kb/status/program-requirements.json` and `exhibit.json`; the memory receipt; the vault note.
**Skipped, with reason:** step 12's headline and harvest rows `<STEP12_STATUS>`; the pipeline view (no M-ID stage,
auditor count or re-mint moved); `kb/README.md` and `README.md` (no structure or user-facing surface beyond lane
detail); `CLAUDE.md`'s §11 rows (no lane changed state; the sheet pointer already moved). Wiki candidates
(`/wiki-ingest`, not written): Sheet 196 is the current sheet; a fill must check the units it fills.

## Let go

The conductor made no PR subscription and no artifact watch (a remote session cannot subscribe), and armed no
scheduled check-in; its background `sleep` timers end with it. The next session watches Sheet 196 and the drafts above.

Greetings, you are SkyDunlin (Session 651), see SkyPlover's handoff — `docs/session_651_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_651_handoff.md) — let's keep rolling with our queue.
