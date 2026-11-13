---
title: Conductor mode — how a session runs workers, COBIx and the merge gate
date: 2026-11-11
updated: 2026-11-13
tags: [reference, conductor, governance-team-enablement, scheduled-sessions]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
---

# Conductor mode

Session 638 (SkyTamarind) ran this way first. A session Sam names the conductor runs from this page; it restates no
doctrine, so each step names the doc that holds the rule.

**Sam's assignment (2026-11-11, verbatim):** "you're the conductor. you do the thinking with your partner cobix: the
plan, the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every
worker until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him.
while they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next
task. handle anything that doesn't need me. only stop when you need a decision from me."

## Settings (Sam, 2026-11-11)

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
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling below): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Sam's words: "high effort on data-writing workers, hold reviews to 9...yes, please add these parameters to the
handoffs from here on out". Every handoff copies this block under `## Conductor settings`
(`.claude/commands/checkpoint.md` step 8; lint `handoff_missing_conductor_settings`). Call the effort level in one line
at the top of each piece of work so Sam can change the dial before it runs.

## Start (in this order)

1. Rule 8's `cpl_memory` query (`CLAUDE.md`), then the three-repo check and the highest-numbered handoff.
2. `list_sessions` and the routine's trigger, then `/coord` if anyone is live (`docs/reference/scheduled_sessions.md`,
   *At the start*).
3. A disposition for every open PR (merge, port, or close with a pointer) and a subscription (`subscribe_pr_activity`)
   for each one the session keeps. No tool lists subscriptions, so keep a ledger (PR, branch, worker, state) and carry
   it in every handoff.
4. Workers do not survive a new session or a container restart. `ListAgents` shows the live ones. Brief a fresh worker
   per open branch from its PR diff and the ledger. `SendMessage` to a worker's name nudges it or gives it its next task.
5. `git worktree list` and `df -h /home/user` before spawning. A locked worktree whose worker is not in `ListAgents`
   is dead: push any unpushed commits from it, then `git worktree unlock`, `git worktree remove --force`, `git worktree
   prune`. Each checkout is 4.4 GB.
6. `python3 kb/_context_budget.py`. Then read the COBIx threads #3110 and #3111 to their last comment, and every issue
   or PR COBIx touched today (search `commenter:cobi-cto updated:>=<today>`), and read them again at every wake. Before
   merging any PR, read its own comments to the last page: a reviewer's note on the PR thread is a finding.

## Workers

- One worker per concern, one `claude/*` branch per concern, one writer per file; the brief names the files the worker
  may not touch.
- A brief states the goal and why, what is ruled (with the `cpl_memory` slug), the design decisions made, the limits
  below, the tests that guard the failure mode, and the report wanted with a word limit. A worker knows only its brief.
- A brief whose plan compares stored ids to the live set says: resolve through `kb/alias_chain.py` (import it, never
  copy it), and run the `consult-doctrine` skill before stating a count the plan acts on.
- Limits in every brief: no Supabase MCP calls (the worker sends SQL to the conductor); no paid run, dispatch, merge,
  PR subscription or empty commit; `git add`, then `CPL_VAULT_ROOT=/home/user/CPLBrain bash
  scripts/check_generated.sh`, read its last line, then commit; when `main` moves under an open PR, merge `main` (a
  merge commit) and regenerate generated files with their tools; a PR that changes a builder of a committed file runs
  the builder (`docs/kb-notes/methodology-a-pr-that-changes-a-builder-runs-the-builder.md`).
- **SQL a worker sends:** the conductor runs a SELECT as sent, kept narrow (aggregates, never `select *`; `kb_curation`
  paged by Range). A write runs only in Rule 10's shape and only from a plan the conductor has read.

## Merging (`CLAUDE.md` Branch policy; `docs/reference/branch_policy.md`)

- Every PR merges on a green `test` on the current head, `clean` or `unstable`: `update_pull_request` with
  `draft: false`, poll `get_check_runs` on the current head sha until `test` succeeds, then `merge_pull_request`
  (squash). Never `enable_pr_auto_merge` (with no required check it merges at once). Never act on a wake's sha. A head
  that is a `Receipt: supabase migrate` commit has no checks: push the next real change, never an empty commit.
- A PR that writes shared data or changes an apply (an `*-apply.yml` workflow, its script, or a file under
  `kb/migrations/.apply`) gets a review of at most 9 agents: independent readers by dimension, then a second reader who
  tries to refute each finding. Its findings are fixed forward unless one breaks the undo. A file landing in
  `kb/migrations/.apply` applies at once on merge (Rule 10 c); a new function also needs the Rule 10 (b2) revoke.
- A PR that makes something the first writer to a shared table, or gives a read-only surface writes, waits until
  `kb/governance_surface_map.json` maps it and the student-detail disclosure ADR is checked (Rule 10 a3).

## Dispatching a data plan (Rule 10; `docs/reference/data_write_rollback.md`)

- A fresh live read at write time; the worklist re-measured; for `kb_curation`, the pending
  `unified_title_merge_confirm` targets cross-checked and held.
- INSERT-only `ON CONFLICT DO NOTHING` under a cohort `<lane>-s<N>@bot`, unless a reviewed plan names a guarded UPDATE
  or DELETE with before-values. The receipt is one a session that did not do the write could roll back from, and the
  undo is tested. A plan whose undo has run only against a test double goes first on a small scope, and Sam hears the
  blast radius beforehand when it is in doubt.
- Timing: clear of the daily cron's 06:17, 09:17 and 12:17 UTC slots when the apply touches `kb/` files the daily run
  commits; never two applies on one table at once; one writer per table with any other live session.
- Dispatch with `actions_run_trigger` (ref `main`, the inputs its `workflow_dispatch` names), read the run with
  `actions_get`, pull its receipt, and confirm with one aggregate live count before telling COBIx or Sam it landed.
- Deleting data, funding figures to colleges and a public KB merge wait for Sam (the hold list in `CLAUDE.md`).

## COBIx (`docs/reference/cobix_pr_loop.md`)

- He posts as `cobi-cto` under `## COBIx`; nudge him with `add_issue_comment` on the thread or the PR. A comment under
  `samueltlee` carries Sam's authority whatever its heading.
- A ruling COBIx relays is confirmed: record it as Sam's, with his verbatim words and "relayed by COBIx" as where they
  reached the session. Sam, in session S639, 2026-11-11, verbatim: "confirmation can count in this session or relayed
  from cobix--remember, ask forgiveness, not permission:)" and "trust what cobix says and only push back if you
  disagree with his recommendation, action, information. Forward motion is good motion." (`cpl_memory`
  `sam-cobix-relay-confirms-2026-11-11`).
- The conductor takes COBIx's findings and information as given and pushes back only where it disagrees with his
  recommendation, action or information. The hold list in `CLAUDE.md` stands.
- Two rounds, then a person, stands. On 2026-11-11 Sam was in session directing the exchange, which is what made the
  longer exchange proper.

## Recording and Sam

- A decision is a `cpl_memory` row (`kind` required, summary at most 400 characters, who, when, his words verbatim,
  in session or relayed) **and** a DECIDED line in the lane file, in the same PR. Rows, log and verify go as one
  `execute_sql` call with a receipt under `kb/receipts/`.
- The standing decision sheet (`CPLBrain/decision-sheets/decision_sheets.md`) carries the conductor's decisions, never
  asks. Sam, in session S639, 2026-11-11, verbatim: "Remember on the Decision Sheet that I want your decisions on it,
  not asking me for mine. I am pushing decision to you as conductor and informed by help from cobix, your force
  multiplier:)" (`sam-sheet-carries-conductor-decisions-2026-11-11`). Each card reads Decided, Evidence, and Carried out
  with how to reverse it; its chips are Fine, Change it and Revisit later. An outward send or a go-live is a card that
  opens on "Waits for my send or go", and an unanswered card holds only its own item. First built as Open Asks Sheet
  181 (https://claude.ai/artifact/M3YaDrpkT7HhH8rYRnvkjx).
- His unplanned statements are captured verbatim (the vault's braindump skill, on-the-fly mode) and he is told in one
  line. Replies to him are a few lines, active voice, stated positively.

## Checkpoint and sign-off

- At the warning line (110,000 tokens left) say the number to Sam; run `/checkpoint` by Rule 9's commit count. A
  worker may write the documents; the conductor keeps the steps that need Supabase or the remote tools (step 10's
  `cpl_memory` rows, step 12's headline and harvest SQL and the routine's `get_trigger`).
- Run a checkpoint near four hours into the session, whatever the commit count says.
- The sign-off turn unsubscribes every PR, deletes every scheduled check-in, drops every artifact watch, names each in
  the handoff, then gives the one opening line (`CLAUDE.md`, *Sign off*).
- A wait on CI or a run ends the turn with one scheduled check-in (`send_later`), never a poll loop. S638 used 75% of
  its context in about five and a half hours, and each worker PR's subscription notice costs about 8,000 tokens.

## What went wrong in S646, and what worked

- The conductor's decision 16(b) put a guard in `file_run`, which every college shares, and the second reader refuted it (decision 18 removed it). This is the third session running that a conductor design rule was wrong and review caught it: a decision that changes a pinned test gets a reader before anything is built on it.
- A `get` on issue #3111 cost about 20,000 tokens again at the start, against this page's warning: read its comments from the last page and never `get` it.
- A paid run on a new route (Glendale's `route=slow`) crashed in `capture()` at no cost, because its tests called the reader directly and the reader was briefed in parallel with the dispatch. When the route is new, brief the reader first and dispatch after.
- The firing had no `send_later`, `list_sessions`, `get_trigger` or `set_session_tags`: one background `sleep` timer per wait brought the session back, and the open PRs and `main` since the handoff were the one-writer check.
- Worked: resuming a finished worker for the next task on its branch (four worktrees, 5.8 GB free throughout); readers with no worktree reading refs with `git show`; a compare tool before each load; a free capture on the final head before each paid read; workers reading capture results, so the conductor's context stood at 33% after 1 h 45 m.

## What went wrong in S645, and what worked

- The conductor's decision 9 on #3201 had every college PR regenerate and `--check` a committed snapshot, so each would conflict on one 335 KB file; it was corrected to the gap census's pattern (a dispatch-only workflow writes the snapshot).
- Its title test refused right blocks: in a catalog whose number lines all vote one way, 16 of 17 refused records were right. Bind by the number line there (decisions 13 and 14).
- The display step writes the whole committed build and ignored `college`, so the first live run went out on one college through a new `display_college` input (#3204), and the whole build followed once the live count matched.
- A dated-reads job fails its verify unless the branch carries `main`'s latest refresh (Diablo Valley, after #3200): merge `main` first.
- A wave over colleges whose records are all filed extracts nothing (wave s645a): read the census before naming a wave.
- Merging a college PR publishes its display build to the page, so COBIx's spot-check comes before the merge.
- A worker's PR subscribes the session, and each notice costs context: drop the subscription when the PR opens.
- The disk allowance held three worktrees, so finished workers were resumed for the next task instead of new ones.
- A `get` on issue #3111 and a full-comment read of the scout file cost about 40,000 tokens at the start: page from the last comment, read files by section.
- Worked: one college first, a count gate, then the whole build (two runs, 0 errors); a compare gate before each reread; the permission refusal left to Sam, not worked around.

## What went wrong in S644, and what worked

- A new workflow file cannot be dispatched until it is on `main` (the wave runner, #3191): merge first, then trial on
  a branch.
- The conductor missed COBIx's 00:21Z reply for forty minutes, and his finding on #3191's own thread was caught only
  because the thread was read before the merge. Read COBIx's threads at every wake, not only before merging.
- A fetch of ten full comments on #3111 cost about 10,000 tokens. Page with `perPage` 1 from the last page.
- A regex reading of free catalog text (the no-colon hours reading, #3193) took three review rounds and still passed
  constructed pages; gating it per college with positive evidence in the record's own section ended it. Gate first.
- The conductor's own design rules were wrong twice (the price rate rule, widening `passes_live`), and review and the
  existing tests caught both. A decision that changes a pinned test reverses someone's earlier decision: read why the
  test exists before changing it.
- `get_job_logs` returns the runner's cleanup as its tail; reproduce a lint failure locally.
- A first-read college PR cannot go green without the display build (`tests/roep_display_test.py`), so plan the dated
  reads and the build as part of the read (#3197 moves the dated reads to a runner job).
- A worker's PR subscribes the session on its own, and each notice costs context.
- Worked: the gap census before choosing work (one cause and one lever per program); one wave, one branch, one filing
  job, agreed with COBIx before the build; COBIx's offers taken on Sam's relayed go. The container restarted at about
  01:38Z and pushed work survived.

## What went wrong in S643, and what worked

- A test that read held cards from live `kb/exhibits_review.json` turned `main` red when a reviewer ruled on one
  (#3178). A brief that adds a test against committed data says: pin the rule to a fixture.
- `supabase-migrate.yml` applies a migration on the PUSH of its `kb/migrations/.apply` change to a `claude/**` branch,
  never on merge, so the review happens before that push. Its receipt-commit head gets no `test` run; the worker
  stopped and asked. Brief the next one: push a real change after the receipt, never an empty commit.
- `grep` on `tests/check_floor.json` prints a `_note` of about 10,000 tokens: always `cut -c1-200`.
- A stacked PR conflicts once its base squash-merges: merge `main`, take `main`'s copy of the base's files.
- Six first-round PRs touched `tests/check_floor.json` and the dependency map, so each conflicted with `main` once.
- A completed worker's notification repeats its report. Deleting a check-in that covered two PRs dropped one; re-arm.
- The Agent tool's worktree isolation fails when the shell's directory has reset to `/home/user`: `cd` into the
  tracker first. Disk: 6.2 GB free with four worktrees of 4.4 GB on 252 GB, so cap at four and remove each at merge.
- The container restarted at about 22:20Z and stopped the documents worker mid-checkpoint. Its unpushed commit and
  staged files survived in its worktree, and its vault commit had already been pushed. Push each repo as soon as it
  has a coherent commit.
- Worked: one combined finding list per PR after all its readers report; a second reader briefed to refute the fixes
  (First Light: five majors, then three more). COBIx had not commented on any S643 PR by 22:05Z; the conductor posted
  on #3110, #2962 and #3153.

## What went wrong in S642, and what worked

- The conductor merged and ran #3158 (the ghost-row delete) without reading COBIx's 13:13Z note on the PR's own thread;
  it had read #3153 and its reviewers. His two findings became #3166 after the 230 rows were gone, and neither touched
  them. Read each PR's own comments, last page included, before merging it (*Start* step 6).
- Sam had to point at #3111 and #2962: the conductor read #3153 at the start and not the standing threads. Read #3110,
  #3111 and every issue COBIx touched today at the start and at each wake.
- Three PRs failed `suite (6)` for one reason: `tests/check_ledger.test.js` needs each new test file's floor in
  `tests/check_floor.json`, and `main` sits at the 60% line. Every brief that adds a test says so.
- Workers stopped a full local `npm test` past 30 minutes; CI is the gate. Briefs say: run the tests that touch your
  files plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, then let CI run the rest.
- `list_workflow_runs` and `get_job_logs` (tail) returned huge or useless output again; `actions_get`
  `get_workflow_run` by id, and a `git fetch` of `main` for the receipt commit, were enough.
- `scripts/check_generated.sh` reports *credential title resolver, one copy* stale in a checkout that holds worker
  worktrees under `.claude/worktrees/` (the test scans them): a local false alarm.
- The vault's open-asks sheet check fails locally until Sheet 183's card 6 and Sheet 184's card 11 are settled in the
  builder; the sheet is rebuilt at the checkpoint.
- Worked: one worker per concern, each opening its own PR; readers by dimension, then one second reader on the delete;
  COBIx reviewing each push within minutes; one `send_later` per wait; worktrees removed at merge (the disk held 11 to
  24 GB free).
- Worked: a plan receipt read by keys and counts, then a 12-row sample of the risky class (ghosts with students) before
  the apply.
- Workers' commits carry the harness's attribution line (Opus 5.5), which is right for them.
- Publishing a sheet the conductor did not write cost about 45,000 tokens: the tool requires reading the whole file
  first. Have the vault worker keep the sheet under 60 KB, or publish from a session with room.

## What went wrong in S641, and what worked

- The 06:12Z firing stopped with no handoff, and the 10:12Z firing had no `list_sessions`. What worked: read every
  channel (open PRs, `main`, runs, #3110, `cpl_memory`), watch `git ls-remote` for 23 minutes, then open a draft PR
  declaring the queue before any other write (`scheduled_sessions.md`, *A session that stopped without a handoff*).
- A bare `git fetch origin` on the shallow clone pulled over a gigabyte for 302 branches. Fetch a branch by name, with
  `--depth`.
- The conductor printed a load receipt's 1,549 rollback ids into its context. Read a receipt's keys and counts.
- A reviewer copied the repository (4.4 GB) into the scratchpad despite the brief. The round-two brief said why not, and
  the conductor checks `du` on the scratchpad after each review.
- `get_check_runs` with `perPage` 1 shows `test` first only once it has finished; while it runs another job is first.
- A worker's change beyond its brief (narrowing #3135's call 2a) needed its own second reader, who found it bought a
  paid read every run. One reader on a worker's delta is cheap, and here it paid.
- Two PRs that regenerate `kb/dependency_map.json` merged in sequence cleanly; the third (#3152) conflicted. Merge them
  one at a time and expect a `main` merge on the rest.
- The conductor wrote "10:55Z" on #3110 for a note posted about 10:45Z. Read `date -u` first (S640's lesson, again).
- Worked: a verifier compared each paid read's records with `main`'s before the load and caught a passing record that
  lost coverage (American River 11566, 15 of 20 courses to 9); #3154 guards it. A new test file needs its floor in
  `tests/check_floor.json` (`tests/check_ledger.test.js` check 4), or `test` fails on the PR that adds it.
- Worked: replacing #3150's design after round one instead of patching an imitation of the runner; mutation checks by
  workers; a proof dispatch right after merging a workflow change, while the session is there to revert it.

## What went wrong in S640, and what worked

- Context went fast: 370,000 tokens in the first 85 minutes. Largest first: a review workflow's completion notice
  echoes its whole `args` (about 10,000 tokens each with a long context string); `get_check_runs` and
  `list_workflow_runs` return full job and commit text; each PR subscription sends two long notices (about 6,000
  tokens). What worked from 05:15Z: the review's context in a scratchpad file and a one-line `context` argument;
  `get_check_runs` with `perPage` 1 or 2 (`test` lists first once it exists); `list_workflow_runs` filtered to
  `status: in_progress, branch: main` to see whether an apply or the daily run is in flight.
- The conductor wrote clock times from memory twice in notes to COBIx, five to twenty minutes off, and corrected both.
  Read `date -u` before writing a time.
- A capture that met HTTP 503s filed a partial read as if complete (Rio Hondo: 34 pages of 328), and the reconcile
  measured against almost no fresh text. Check a capture's pages answered before reading its measure.
- Three of #3135's five capture proofs compared against reads `main` filed a month earlier, so the drift was the
  reader's. A proof run takes a same-day baseline by `main`'s reader on a scratch branch
  (`docs/kb-notes/methodology-a-proof-run-needs-a-same-day-baseline.md`).
- A second write path (#3140's hand-run SQL, then its separate job, then the apply itself) left a live row with no way
  back or a replay on the wrong apply in each of five review rounds. A fix that needs a fourth round is a design to
  replace; the conductor stopped #3140 and recommended read-time resolution.
- `tests/partner_crosswalk_test.py` fails on `main` and no workflow runs it. A test outside every workflow goes red
  unseen; the governance lane carries the fix.
- Worked: disk held at four worktrees of 4.4 GB, with reviews reading refs (`git show`, `git diff`) and never copying,
  and a finished worker's worktree removed once its PR merged or its branch was pushed with nothing left to resume.
- Worked: readers by dimension, then a second reader on each finding: three breaks-the-undo findings on #3140, a
  fingerprint that dropped bare unit figures on #3135.
- Worked: a documents worker wrote the checkpoint while the conductor kept the Supabase and remote steps.

## What went wrong in S639

- Reviewers copied the repo three times into the session scratchpad (12 GB) and filled the disk. Every review brief
  now names the one existing checkout to read and forbids copies, and the conductor runs `df -h /home/user` before
  each fan-out.
- A worker whose worktree the conductor removed cannot be resumed. Remove a worktree only when its PR has merged.
- The review of #3122 and #3123 found the same fault in both appliers: each built its receipt from a write's response,
  so a lost response left nothing to roll back. A receipt is now filed from a fresh read after the writes, and rollback
  works from the planned lists.
- S638's two ASE applies deleted 13 rows people had saved after COBIx had asked to leave them. `load_plan` now refuses
  such a plan.
- The #3123 merge touched generated `kb/` files while the 23:42Z daily-dashboard run was in flight, and the run lost
  its push to a rebase conflict; a fresh run committed at 00:28Z. Merge such a PR only when no daily, cer, rename or
  family apply run is in flight (read the workflow runs first).
- `cred-rename-apply.yml` has no dry-run-only mode, so the conductor ran `kb/_cred_rename_dryrun.py --only-plan` locally
  before the dispatch. Do the same until the workflow gains one.
- The review of #3127 read the code and the plan, and `main` went red after the apply: two checks in
  `tests/credential_family_test.py` read committed titles and expected the pre-rename state. A review of an apply also
  runs the suite against the data as it will stand after the apply.
- A dry run that exits 0 has not said it is correct. Read its summary line in the job log (the last 36 lines or so).
- The session's tool connections dropped four times in an hour, and each reconnection cost context. Keep briefs and
  reads short when the connections are unsteady.

## What went wrong in S638

- Sky told Sam COBIx had not replied when he had (read the threads at every wake); read a stale summary file as a
  finished run (confirm the commit and run that wrote a figure); took Sam a question one web search answers (ASE MIL3).
- #3116 went through three review rounds (14, 8, 8 findings). A third round of the same class means the design is
  wrong; it was redesigned.
- #3119 changed a builder of `kb/status/commons.json`, passed CI, and broke `main` when the nightly run wrote the file.
- GitHub's runner queue stalled `test` for an hour, and a worker pushed an empty commit to restart it. Wait instead.
- A container restart lost the live workers; their reports were recovered from their transcripts.
