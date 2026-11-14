---
title: "Session 653 handoff (from SkyAvocet, S652)"
created: 2026-11-14
updated: 2026-11-14
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyGodwit (Session 653)

From SkyAvocet, S652, the CPL Queue routine's 12:12Z firing of 2026-11-14, in conductor mode. Sam joined at about
12:57Z ("good morning") and stayed in the session. This is S652's **full checkpoint** (shared data was written: the
identities map's apply and drop; lanes changed state), written about 14:30Z 2026-11-14 (`date -u`) on
`claude/practical-meitner-7rzj3f` (#3295) over `main` at `c6e0b893`. A fact marked *as reported* was not re-read by the
worker that wrote this file.

**How S652 ran.** The firing had no `list_sessions`, `get_trigger`, `send_later` or `set_session_tags`; the open PRs
(none updated since 10:55Z) and `main` at `5278e928` were the one-writer check, and draft #3295 declared the queue at
12:18Z. Start reads at 12:17Z: no `queue_todo_done` since 2026-11-14, no CER procedure request, no exhibit
re-analysis, the Library's same four rows. Sam pressed Complete on Sheet 196 at 11:52Z (card 1 "fine"; card 4 "Go" in
both pickers; cards 2 and 3 blank). The dashboard run, the UI pass, the credential harvest and step 11's two runs for
the UTC day were S650's; the contacts harvest is Sundays.

## First things, in order

1. **Read the replies on [Open Asks Sheet 197](https://claude.ai/artifact/2gYvXAKzrrZyqV24scFavd)** (current) before any other work; carry out what Sam
   answered. Card 1 carries S652's decisions; the Honors deletes (card 2), the Honors design (card 3) and slice B's go (card 4) wait on him. Sheet 196 is superseded by 197. An unanswered card
   holds only itself.
2. **Slice A on draft #3300** (`claude/ncl-catalog-lookup-s652`): Skyline's free capture (run 43600982846) filed
   `capture_preview.json` at `18f220ac`. Of Skyline's 86 no-closed-list programs, 49 are `found` on 49 distinct pages
   (05809 on `programs/accounting-as.php`), 37 `not_matched`, none `not_listed`; the run's self-test on real pages was
   27 of 28 with no false match (*as reported* by the worker, who judged the 49 by page address: run artifacts cannot be
   downloaded here). At least five `not_matched` look like matcher misses (Interdisciplinary Studies titles written
   with abbreviations or "Opt I"). The worker was adding each `not_matched` reason, each found page's heading and the
   self-test numbers to the filed preview when S652 ended: read the branch's head and PR body first. Then a second
   reader on that head, then merge on a green `test`. Extracting Skyline's 49 found pages is about $3.44 (estimated),
   inside the $40 limit: the conductor's call after the merge.
3. **Riverside City under the prefix aliases: the reread is HELD, and the reader has a fault.** The first reconcile
   (run 43603042173, branch `claude/riverside-city-prefix-rescore-s652` at `e9a6304f`, a fresh capture) read 244 pages
   where the filed capture (run 38108461470) read 435 index entries: `cq_distinct` in
   `kb/_program_requirements_college.py` now drops curriQunet index entries whose title key repeats (191 dropped; the
   rule came from Chaffey, run 38203335820). 36 transfer-degree "(CalGETC)" pages went `page_claimed` with no source
   and 33218, 33229, 37483, 41364 `not_found`; no page errored. Only 42719 moved to passing; no record went pass to
   fail; 31892's sum changed (21 to 42 against 24) and it still fails. **Do not reread from that branch.** Two next
   steps: (a) the alias proof over the FILED pages: run dispatched at 14:38Z on
   `claude/riverside-city-prefix-rescore-filed-s652` (`step=reconcile`, `extract=0`, `sources_from=38108461470`,
   `limit=0`; free, no page loaded): compare it with `main` record by record
   (`compare(load_records(main), load_records(branch))` in `kb/_program_requirements_wave.py`), expecting 32938, 41749,
   41757, 42719, 43695, 43896, 44155 newly passing (and 44363, 44469; 18113, 31163, 37483 change coverage); then
   `step=reread` with `force=<that run id>` (receipt
   `kb/receipts/program_requirement_records_college_reread_riverside_city_<run>.json`), rebuild
   `kb/status/commons_data.json` and `commons.json` on the branch, and `step=display` with
   `display_college=Riverside City College` after COBIx's spot-check. (b) **the `cq_distinct` fix**: dedupe by page id
   or key on `cq_group`'s local award codes, so two programs sharing an index title both keep their pages; a second
   reader before any dispatch, and a count of how many curriQunet colleges' next capture would lose pages the same way.
   This is the catalog-first weakness #3299 names (a reader missing a program that is in the catalog): tell COBIx.
   Then Merced, Moreno Valley, Norco, San Bernardino Valley and Diablo Valley, one college at a time.
4. **The `CrsId` prefix route:** the build takes the prefix from the Program Course File's `CrsId` where the course
   list disagrees; 11 of slice C's 17 pairs then retire.
5. **Draft #3293** (the passing dry run, head `cb60a1b0`) after slice A's first capture: fold the own-list rule in,
   then one migration and one rescore; Cosumnes River's seven held passes follow. COBIx's statewide count is delivered
   (#3297).
6. **Allan Hancock's trial on #3284**, due 2026-11-15 (`index=kb/course_outline_index/index_43566318943.json`,
   `slugs=allan_hancock`, `trial=12`), and the next objectives host, sac (a new full read).
7. **Lassen:** a capture pinned to main's pages for 31132, 33263, 33729, 33730 and 42300, then the `set` step with a
   per-record hold; and the structured-fields design's migration step 1, Lassen first, with COBIx's spot-check before
   step 4.
8. **Slice B** of #3299 on Sam's go (Sheet 197 card 4), under the conductor's four guards (#3299, comment 6877610924).

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it
(otherwise the open PRs and `main` since this handoff), `df -h /`, `git worktree list`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 (answered cards not on the
hold list), 2, 3 (the reread is a data write: the compare and COBIx's spot-check first), 4, 5, 6 and 7, and code-only
items from the lanes' NEXT lines. The display go of 2026-10-10 stands for every college; a merge that publishes waits
on COBIx's spot-check. **Never run without Sam's word:** slice B (it moves a public figure); the two Honors bot-row
deletes (HUMA M10ME, LIBR M10CJ); any Honors mint; the Sierra `is_test` deploy; anything on the `CLAUDE.md` hold list.
#2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S652, and what worked* included.

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
| #3295 `claude/practical-meitner-7rzj3f` | open: the declaration and this checkpoint | merge on green |
| #3300 `claude/ncl-catalog-lookup-s652` | draft, head `13fe2023`; Skyline run 43600982846 | First things 2 |
| `claude/riverside-city-prefix-rescore-s652` | no PR; `e9a6304f`, the short fresh capture: do not reread from it | First things 3 |
| `claude/riverside-city-prefix-rescore-filed-s652` | no PR; cut from `main` `936c75d8`; the filed-pages reconcile dispatched 14:38Z | First things 3 (a) |
| #3301 (slice C, prefix aliases) | merged `c6e0b893` (14:04Z) | First things 3 and 4 |
| #3303 (COBIx's review of the design) | merged `3b2d9b38` (about 13:59Z) | none |
| #3302 (the drop of the 625) | merged `bd549c5f` (13:40Z) | commons NEXT 6 |
| #3298 (the identities apply) | merged `feeeeef2` (about 13:31Z) | commons NEXT 6 |
| #3296 (the display design) | merged `19ed0958` (about 12:53Z) | First things 7 |
| #3297 (the electives-fill census) | merged `e713ee10` (about 12:45Z) | First things 5 |
| #3293 `claude/passing-dry-run-s651` | draft, head `cb60a1b0`, not reviewed by COBIx | First things 5 |
| #3284 (Allan Hancock) | draft | First things 6 (due 2026-11-15) |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| samueltlee/CPLBrain#788 `claude/determined-mayer-7rzj3f` | draft, head `0dd1cbd9`: Sheet 197 and this session's note | merge on green |

Worktrees: `.claude/worktrees/agent-a308250014c9995ad` (slice A, #3300) and
`.claude/worktrees/agent-aef967aa254e37687` (Riverside City). Workers do not survive the session: brief a fresh worker
per branch from its diff and this ledger, and remove a worktree whose branch is pushed and whose worker is gone.

## What shipped (S652)

- **The identities map** (#3298, #3302): 651 fills and 578 refreshes (2,290 to 2,941 entries), then the 625 held
  entries dropped (2,941 to 2,316). The daily run 43600934967 (`b806c7ff`) rebuilt the lists; the conductor's read of
  `fact_sheet_metrics.json` at 14:21Z: `statewide_exhibits.could_adopt_total` 115 (was 114).
- **Slice C of #3299** (#3301): 17 per-college prefix aliases at 13 colleges, from committed evidence; no table written.
- **The display's structured-fields design** (#3296, COBIx's review folded in by #3303).
- **COBIx's electives-fill census** (#3297; on #3111, comment 6877317551): 31 outside candidates at most, about 2 real.
- **Draft #3300**, slice A: the no-closed-list lookup, self-tested at 85.3% recall with no false match.
- Headline (the conductor's reads at 14:22Z): 14,597 of 20,282 active programs pass, at 118 colleges (unchanged).

## Live data written, each with its undo

- `kb/coci_articulations.json` (committed, shared by the daily run and the public adoption page): the apply, receipt
  `kb/identities_rebuild_out/2026-11-14b/apply_receipt.json`; the drop, receipt
  `kb/identities_rebuild_out/2026-11-14-drop/apply_receipt.json` (each dropped entry whole). Undo in order, each by
  `python3 kb/_identities_rebuild.py --undo <receipt>`: the drop's receipt first, then the 14b receipt; then a daily
  run.
- `cpl_memory`: the rows in `kb/receipts/cpl_memory_s652_rows_2026-11-14.sql` (the conductor runs it at the checkpoint;
  its header says RUN once it is; undo by slug).
- No Supabase table written by the session's PRs; no model spend; no paid run.

## Decisions to honor

**Sam's, in session (2026-11-14):** *"1. apply 2 drop"* (about 13:07Z) and *"drop"* (about 13:19Z), on Sheet 196
card 4 (`sam-identities-apply-and-drop-2026-11-14`). His other words: *"see cobix notes on adjusting our college data
collection (cdc) catalog, program, courses procedure and advise...good morning!"* (about 12:57Z) and *"196 said pick
but there was not indication I could find of what I was supposed to pick--no options to choose from"* (about 13:03Z).

**Sam's, relayed by COBIx on #3299** (his go "Nov 14, 2026, about 4:55 AM PT";
`sam-catalog-first-collection-2026-11-14`): work the catalog-first collection; *"nothing stops the collection bus from
rolling."* Start from the published catalog; compare back to COCI; one second look in the catalog by title and award;
if still not found, flag "on COCI, not listed in the catalog" and move on, never in Still to pass.

**The conductor's,** each a `cpl_memory` row (proposed) and a DECIDED line in its lane, for Sam to revise on the
sheet's card 1: `d-catalog-first-slice-order-s652`, `d-ncl-lookup-not-listed-needs-catalog-list-s652`,
`d-prefix-alias-evidence-rule-s652`, `d-lassen-stale-note-known-defect-s652` (program-requirements-harvest);
`d-sheet-pickers-are-buttons-s652` (the vault's sheet builder). Facts `electives-fill-outside-section-census-s652`,
`identities-map-applied-and-dropped-s652`.

## Pitfalls learned

- `p-merged-before-reading-pr-comment-s652`: #3296 merged twelve minutes after COBIx's review without reading it.
  Read a PR's own comments in the same batch as its check runs.
- `p-worker-delete-refused-surface-to-sam-s652`: a permission refusal goes to Sam, never around the check.
- `p-new-matcher-needs-self-recall-test-s652`: the first title rule found 63% of pages already held
  ([note](kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)).
- `p-mis-codes-carry-record-id-suffix-s652`: ENGL304-2507 reads as ENGL 304.
- Times from memory were wrong twice; run `date -u`. Run scripts in the shared scratchpad with `python3 -I` from a
  subfolder (a stray `inspect.py` shadowed the standard library).

## COBIx threads

On #3111: plan v2, the August drop, the dry run (6875299481) and the census (6877317551) await him. On #3299: the
conductor's guards (6877610924) and 6878460974. #3110 (6877162522) is moot: Sam answered in session. His v2 on #3237
is still awaited. On #3291 the conductor answered his question (6877180917). Read him from the last comment (`perPage`
1 from the last page); never `get` #3111 or #3110.

## The Library (step 6 of the routine)

The same four rows, each waiting on a person, nothing built: `...-mwdvs6l1` Draft 2 `b18c5759` waits on Ally Barker's
*Publish it*; `...-mwdv9pl5` is its superseded duplicate; `adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5` has
ready draft `7a26c199` (pictures 4, 5 and 14 show names or emails to cover); `iaca-mvpmcjyl` waits on Crystal Nasio's
file.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** First things 2 to 8; then Los Medanos, Monterey Peninsula and Los Angeles Valley
   (a person); the standing list (Cerro Coso 40922 and Grossmont 46141 held; Chaffey's objectives-only read; the RCCD
   district profile; COBIx's three Glendale follow-ups; Desert 10195's stored hold; the reading-procedure check; the PDF
   headings; the free GE page reads; the district phase 0 builder; the wave sample, De Anza, Redwoods); objectives
   laspositas, Coastline, Golden West after sac.
2. **`commons`:** the Honors design (Sheet 197 cards 2 and 3); FIRE 130 X's row-audit card; price the model pass; a
   potential-CPL column; the Leadership outlines; the #3298 and #3302 follow-ups (`title_differs_in_substance` and the 16
   `_superseded_rekeyed_from` entries; the header's 2,319; a merge member with no articulation record gets no entry;
   the drop report's rows section; `standards_2_ruled_renames_test.py` and `ccc_metric_test.py` failing on `main` with
   no workflow running them); the data dashboard's MIS course matches and COE regional demand (each waits on a
   definition); Copper Mountain's registry `catalog_url`; the strategic plan file.
3. **`sierra-retrieval-corpus`:** an `is_test` column set by the edge function (a deploy).
4. **`map-custom-reports`:** the MAP team or Pierce says what the August 6 and 7 drop was.
5. **`cer-procedures`:** the Exhibits rename batch with the ASE Certificate Bundles title; `series_aliases` into
   `kb/credential_aliases.py` (both write shared data: a reviewed plan first).
6. **`library`:** the Veteran map's minor follow-ups; the Fact Sheet's header; the four rows above.
7. **`governance-team-enablement`** and **`workplan-annual-goals`**: the first daily log carrying `Daily push
   conflicted`; the pushing workflows' groups; key-reading workflows into environments; workplan NEXT 0a and 0c.
8. **Vault:** about ten older session-note PRs sit open as drafts on samueltlee/CPLBrain (#743 to #765); a session with
   a person decides whether to merge or close them.

## A full checkpoint: what it touched and what it skipped

Touched: the docs audit (and `--apply`); this handoff; the lanes `program-requirements-harvest` and `commons` (each
under 20,000 bytes; retired text moved verbatim to the lessons docs, *Moved from the lane (S652 checkpoint)*); the
harvest lessons' S652 section and a compaction into archive 5; the Commons lessons' S652 section and a compaction into
its archive; a KB note, `methodology-a-new-matcher-is-gated-by-a-self-recall-test`; `conductor_mode.md`'s S652 lessons;
`CLAUDE.md`'s standing-sheet line (no §11 row: no lane changed state); the index rebuild; the run logs
`kb/status/program-requirements.json` and `kb/status/course.json`; the memory receipt. The vault note and Sheet 197
are the vault worker's. **Skipped, with reason:** the pipeline view (the identities map feeds the adoption lists, not
the M-ID stage list; no auditor count or re-mint moved); `kb/README.md` and `README.md` (no KB structure, generator or
user-facing surface changed beyond lane detail). Wiki candidates (`/wiki-ingest`): the identities map applied and its
625 held entries dropped (2,316 entries); catalog-first collection is Sam's rule.

## Let go

The conductor drops every PR subscription it holds (#3295, #3300 and any worker PR), holds no artifact watch and no
scheduled check-in; its background timers end with it. The next session watches Sheet 197, #3300 and the Riverside
City branch.

Greetings, you are SkyGodwit (Session 653), see SkyAvocet's handoff — `docs/session_653_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_653_handoff.md) — let's keep rolling with our queue.
