---
title: "Session 700 handoff (from SkyAuklet, S698, Sam's plain session of 2026-11-21: the Subjects page under #3655, COBIx's page follow-ups and the hourly dependency map)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows
`docs/session_699_handoff.md`, never this file.

# You are SkyGuillemot (Session 700)

From SkyAuklet (S698), Sam's plain session of 2026-11-21, 18:31Z to about 22:25Z, on Fable 5.2. This is the session's
second checkpoint and replaces the first (20:35Z). A **light checkpoint**: the Commons lane took its paragraph inside
the PRs, no Roadmap row moved, and no re-mint or shared data write ran (the memory rows aside). It was run at
113,889 tokens of context left, the warning line. Skipped: steps 2 and 3 (no KB or README surface), 5 (no new KB
note), 7 (the pipeline did not move), 9 (its own queue item) and 12 (`kb/status/program-requirements.json` is the
routine's run log; `kb/status/subjects.json` was not restamped: do it at the next checkpoint that moves the Common
Subjects lane).

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21). **Then
   read issue #3655 whole**: the Subjects brief, COBIx's two later comments and this session's six.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns: it wakes no one and stops at the two-hour background limit. Act on each new
   `<!-- cobix -->` comment. This session did not run it; Sam pointed it at #3655 himself.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints
   match. COBIx reviews do not gate a merge (`r-cobix-review-never-gates-merge-sam-2026-11-21`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the
   next wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves
   the M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3652, #3654, #3656, #3657 and #3658 are merged. This checkpoint's PR merges at sign-off.
   Dependabot's #3383 waits.

## What shipped (squash-merged, `test` green on each head, each thread read)

- **#3652 `290f5177`:** COBIx's follow-ups on #3643 and #3646 (the Exhibits tab says *combine*, chips are notes, the
  details retry, the narrower *Possible duplicate*; the Commons card counts colleges and campuses, *Stuck on a person
  or a fix*, the term match, a checked catalog address).
- **#3654 `e470bd7e`:** `dependency-map.yml` runs at minute 43 of each hour and on dispatch, never on a push.
- **#3657 `60ac51d6`, the Subjects data (#3655):** 1,334 of 1,629 local subject codes at the 16 filed colleges hold a
  title from the catalog's own subject heading (746 before), saved in Title Case. Twelve colleges' headings are filed
  under `kb/hand_filed_catalogs/subjects/` by `kb/_file_subject_headings.py`: eight from the lines above each
  subject's first course (the reader's new plan key `subject_context`; runs 44948526227, 44948529916), four from
  their course-descriptions index with each subject's own address (`links_cap`; run 44948295544). The filer matched
  all 167 codes whose title the catalogs already held.
- **#3658 `80d9b0b8`, the Subjects page (#3655):** the labels (*Local Title*, *Source*, *COCI only*); a chip on every
  row with no title (*Not in catalog* 108, *Not read yet* 139, *Blocked* 0, *Noncredit: on hold* 48); the list of
  codes with no title at `#commons/subjects/disagree`; credit and noncredit courses counted apart on the row;
  `kb/status/noncredit_categories.json` (each code's noncredit courses under the COCI export's category); Sam's 30
  Cerritos decisions recorded as a held answer set.

## Decisions Sam made (in session, 2026-11-21, unless marked relayed)

1. **The chip:** *"we need an indicator (chip) in the row to indicate that the catalog read was either blocked,
   title not in catalog, or not parsed yet"* (`r-subject-row-chip-sam-2026-11-21`).
2. **Program titles inform the recommendation:** *"it doesn't change the rule, it uses the information to provide a
   better recommendation...knowing that there is often crossover between the two"*
   (`r-program-titles-inform-subject-recommendation-sam-2026-11-21`).
3. **A web search for every *Not in catalog* row, and his go on the plan:** *"I would add the web search any time
   it's not in the catalog and you are forced to make a recommendation based on a combo of data"*; *"good, let's do
   it!"* (`r-subject-web-search-and-go-sam-2026-11-21`).
4. **Title Case:** *"make sure all titles are saved in Title case, not all caps"*
   (`r-subject-titles-title-case-sam-2026-11-21`).
5. **Noncredit and credit apart:** *"the noncredit and credit disciplines are often different and are separated in
   the MQs, which are the basis for the common subject codes we are associating with all the local titles"*; *"so nc
   and cr courses should be differentiated in the college subject sidebars and the recommendation analysis"*
   (`r-noncredit-disciplines-separate-in-mqs-sam-2026-11-21`).
6. **The noncredit hold** (relayed by COBIx on #3655, comment 7069586791; then in session *"make all adjustments
   based on your recommendation"*): every noncredit title and common-code recommendation waits until SDCCE, NOCE,
   Mt. SAC noncredit and Santa Ana SCE are read (`r-noncredit-hold-sam-2026-11-21`).
7. **His 30 Cerritos common-code decisions** (relayed by COBIx, comment 7069308014): *"you make the decision
   whether to file them or better maybe to let them be determined by our new procedure and see what diverges."*

## Decisions the session made (each his to revise)

`d-possible-duplicate-shares-a-word-s698`, `d-term-reports-named-term-s698`, `d-dependency-map-hourly-s698`,
`d-cerritos-30-held-answer-set-s698` (the 30 are held in
`kb/reference/subject_code_decisions_cerritos_2026-11-21.json`, not applied; the recommender is scored against them
and his decision stands where it diverges), `d-subject-save-key-three-part-s698` (a decision is keyed by college,
local code and band). Memory rows: `kb/migrations/2026-11-21_s698_cpl_memory_rows.sql` (17 rows: Sam's six rulings
`verified`, 11 `proposed`; the first five in full, the later twelve named by slug; rollback beside it), each batch
applied with `execute_sql` and read back.

## Open work, from the lanes' NEXT lines

1. **`commons`, the Subjects page (#3655), in order:**
   - Read the 23 pages the indexes link at their own addresses (the `address` column; Cerritos `/math/`, `/soc/`,
     `/pol/` among them), and file their courses.
   - The recommendations file for every code with no title, credit rows first, by credit band: a sibling code, the
     same code titled at other colleges (the Los Angeles district shares codes), course joins, program titles (through
     each program's required courses), a web search that lifts or lowers the confidence. Measure each source on the
     1,334 titled codes and on Sam's 30 before any level shows. A `candidate` line is already filed for 36 rows.
   - The course sidebar: a local code opens its courses, credit and noncredit apart, with C-ID and CCN.
   - The common code with its discipline title; the list holds the noncredit MQ disciplines, those with no code
     shown by name. **ATHL**, one of Sam's 30 targets, is not in `kb/discipline_canonical_subj4.json`.
   - The three other large noncredit catalogs read (North Orange is filed), then the noncredit title list and the
     hold lifted.
   - Edit and Save, after Sam approves the write path (`kb_curation`, insert only, with its line in
     `kb/governance_surface_map.json`), then his 30 filed.
   - 139 *Not read yet* rows: Los Angeles Valley's PDF is read out of column order (36 with no heading); Mission 29
     and Trade-Technical 31 print the heading away from the first course.
2. **`commons`, the rest:** `commons_handover_summary()` carrying the term our reader names; a per-college
   credential count for the College Data Collection card; the *Stuck: waiting on a fix* view; the three Collect cards.
3. **`cer-procedures`:** the pair apply (its NEXT 1), then #3524 and #3522; `issuer_resolution.js` still says "Set by
   the fold on"; the Exhibits Queue view keeps its name.
4. **`repo-size`:** the spreadsheet export and the videos out of the tree; the other timed workflows' commits capped;
   the session trim with COBIx; `START_HERE.md` and the `CLAUDE.md` cut. Part 5 waits on Sam's go.
5. **`common-subjects-reference` and the pile (handoff 696, items 3 to 8):** the 168 other tutoring titles; the held
   codes; *Propose a new M-ID*; Jev as the second stage; SLOs in the score; the state course list rebuilt.
6. **`library`:** deploy #3600, then part 4, then part 3.
7. **`program-requirements-harvest`** is the routine's (handoff 699).

## Not answered by Sam

- The write path for Subjects saves (asked on #3655; no card filed: the page stays read-only until he answers).
- The TBA figures on the College Data Collection card, and the Plan card's phases (handoff 698).

## Pitfalls from this run

- **A job log comes back whole through a helper.** `get_job_logs` with `return_content` and `tail_lines: 5000`
  returns up to 5,000 lines; a result that large is saved to a file under the session's `tool-results/`, and a
  subagent can strip the timestamps by script into the scratchpad. The download address is blocked in the sandbox.
- **A read plan's push runs the read.** `college-page-read.yml` reads the plans its last commit adds or changes, so
  commit at most four catalog plans at a time to keep one run's log inside the window.
- **A subject's first mention is not its first course.** A code named in an honors list or a certificate table opens
  the wrong lines; the headings read takes the file's own units patterns.
- **A new tracked file under `kb/status/` or `kb/reference/` needs a line in `.github/pages_allowlist.txt`**, and a
  new Python test a step in `js-tests.yml`; `check_generated.sh` names neither. Run `node tests/pages_allowlist.test.js`
  and `python3 tests/every_test_runs_test.py` before the push.
- **`npm run a11y` lost its browser twice**; a wrapper config that keeps the wanted targets, passed with `--config`,
  runs them in minutes (`p-a11y-sweep-browser-dies-s698`). The Exhibits Progress target times out on `main`.
- **A merged branch is deleted on GitHub**: delete the stale tracking ref (`git update-ref -d
  refs/remotes/origin/<branch>`) and push; `git fetch --prune origin` runs for minutes.
- **`cpl_memory.summary` holds at most 400 characters.**

## Let go

Dropped: the PR subscriptions on #3652, #3654, #3656, #3657 and #3658 (all merged). No check-in is scheduled and no
artifact is watched. The checkpoint PR's watch is dropped when it merges.

Spend: not available; 2026-11-21T18:31Z to 2026-11-21T22:25Z.

The work was the Subjects page and its data, two page follow-ups and one workflow change, by one session with four
helpers that read job logs and issue comments, and `pr-gate` reads.

Opening line: *Greetings, you are SkyGuillemot (Session 700), see SkyAuklet's handoff — `docs/session_700_handoff.md` — let's keep rolling with our queue.*
