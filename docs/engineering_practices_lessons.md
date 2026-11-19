---
title: Engineering Practices — Decisions & Lessons (dev infra, testing, design system)
date: 2026-06-04
last_updated: 2026-11-18
session: 32 (Busy Feynman) — established from the Session-32 retrospective
status: ACTIVE — committed test harness + CI + stop-hook fix shipped; design-system tokens established; CLAUDE.md trim + bulk CSS migration STAGED
tags: [engineering, dev-infra, testing, jsdom, ci, design-system, process]
artifacts:
  - package.json
  - tests/run.js
  - tests/cer.test.js
  - .github/workflows/js-tests.yml
  - scripts/stop-hook-git-check.sh
  - docs/kb-notes/reference-ui-design-system.md
  - docs/kb-notes/methodology-commit-the-test-harness.md
related:
  - "[[CLAUDE]]"
  - "[[docs/INDEX]]"
---

# Engineering Practices — Decisions & Lessons

Cross-workstream lane for how we *build* (dev infra, testing, the design
system), as distinct from what we build (the CER/EACR/Excel workstreams). Born
from a Session-32 retrospective Sam asked for: "looking back across the session
artifacts, what would improve efficiency / continuity / UI aesthetics?"

## Session 32 — retrospective → shipped process improvements (2026-06-04)

The retrospective pulled real numbers from the repo rather than guessing:
- **CLAUDE.md 1,874 lines** loaded in full every session (growing token tax).
- **148 distinct hex colors** in the dashboard; brand navy `#0A2240` hardcoded
  **568×** vs **92 total `var()`** uses — a token system that existed but was
  barely used → aesthetic drift on the newer tabs.
- **`force-push` in 22 docs, `Rule 4`/mirror in 51** — recurring rituals/taxes.
- The stop-hook "Unverified" false-positive fired **4× in one session**.
- "jsdom N/N" cited across handoffs, but the tests lived in `/tmp` and evaporated.

### Shipped this session (PR #288 + token PR)
1. **Committed jsdom test harness + CI** — `package.json` + `tests/` (`run.js`
   runner + `cer.test.js`) + `npm test` + `.github/workflows/js-tests.yml`
   (non-required check). The CER test renders the **real baked payload** and
   guards the Session-32 behaviors, including a **synthetic `raw_variants:null`
   row** that fails the build if the search/expand `|| []` guard regresses.
   18/18. Distilled: `docs/kb-notes/methodology-commit-the-test-harness.md`.
2. **Stop-hook false-positive fix** — `scripts/stop-hook-git-check.sh` (durable
   repo copy of `~/.claude/stop-hook-git-check.sh`) with a one-line `awk` change:
   skip commits committed by `noreply@github.com` (GitHub's own squash-merge
   commit, left at HEAD by the session-branch-reuse flow, un-amendable without
   force-pushing main / Rule 5). Applied live + committed for install.
3. **Design-system tokens** — added surface/border/text-scale/link tokens to the
   `:root` block (both HTMLs, Rule 4) so the newer tabs' ad-hoc slate scale has
   canonical names to converge on. Rule codified: **new CSS uses `var(--token)`,
   never a raw hex.** Reference + component cheatsheet:
   `docs/kb-notes/reference-ui-design-system.md`.

### Learnings
- **Ground a retrospective in measurements.** `grep`/`wc` over the repo turned
  vague "things feel heavy" into specific, prioritized, actionable levers.
- **Throwaway verification is a smell** — if a test is worth running once, commit
  it. And make it guard the *failure mode* (the synthetic null row), not a happy
  path.
- **A false-positive that fires every cycle erodes signal.** The hook nagged on a
  commit no one can fix; the fix is to teach the check what it legitimately can't
  control (GitHub's own merge commits).
- **A token system only helps if it's used.** Defining `:root` vars wasn't
  enough; the drift came from not *referencing* them — hence the explicit rule +
  the reference note + (staged) migration.

### Staged for a focused next session (Sam's call — see session_33_handoff.md)
- **CLAUDE.md history→archive trim**: move the completed roadmap-table rows +
  the per-session narrative blocks (≤ Session 31) to `docs/roadmap_archive.md`;
  keep Critical Rules, the Pipeline Reference, live/open roadmap rows, and the
  current session inline. High-stakes (project memory) → its own verified pass.
- **Bulk CSS literal→`var(--token)` migration**: replace the 568 brand-hex
  literals (+ the worst slate-scale offenders) with tokens, parity-verified
  (var resolves to the same hex → visually byte-identical), excluding
  generator-emitted + JS-string regions. Its own parity-checked pass.

### Next concrete step
Either pick up the two staged items (CLAUDE.md trim first — biggest per-session
win), or fold these practices into normal feature work (tests committed under
`tests/`, CSS via `var()` + the reference note, prototype-first for new tabs).

## 2026-09-10 — SkyLedger S251: four green checks that could not see what they checked

Repairing the cron (#1540) produced its first successful run in three days, and
that run turned three checks red. A fourth went red on my own PR the same
afternoon. **All four are one shape: the check was green because the tool could
not see the thing it was checking.** None was a false alarm; each named real
drift that had been accumulating invisibly.

| # | the check | why it was green | what it could not see |
|---|---|---|---|
| 1 | `cpl_theme.test.js` "no literal white background" | the cron was dead, so the section was never re-emitted | `college_activity_template.html`, the generator's INPUT |
| 2 | `discipline_edge_fill_test.py` "still fills half the blanks" | the payload predated the fill moving into the generator | that yield goes to ZERO when the work moves upstream |
| 3 | the whole suite, for two days | no generator ran at all | every deferred generator change at once |
| 4 | `_build_dependency_map.py --check` | rebuilt while the new files were untracked | `git ls-files` lists TRACKED files only |

### The rules that fall out

- ⚠️ **Guard a generator's INPUT, not only its output.** A check reading a
  committed artifact reports the state of the last run. S245 swept both HTMLs and
  left `background:#fff` in the template `excel_to_dashboard.py` emits verbatim;
  measured at that commit, HTML 0 / template 4. `cpl_theme.test.js` now carries a
  `GENERATED_FROM` list — add every emitted template to it.
- ⚠️ **Never measure a transformation's YIELD on an artifact that has already had
  it applied.** `filter >= blank_before * 0.5` was sound while the fill was a
  post-hoc repair; once S242 wired it into the generator, the correct result was
  `0 of 86` and the check failed ON SUCCESS. Assert the FIXED POINT instead —
  re-running finds nothing to do — which catches the real failure (the fill
  stopping) from the side that survives the move.
- ⚠️ **STAGE BEFORE YOU REBUILD ANYTHING WHOSE INPUTS COME FROM GIT.**
  `kb/_build_dependency_map.py` inventories via `git ls-files`, so three untracked
  new files were invisible: it wrote a map missing them (710/326) and `--check`
  passed against that same blind view. CI, with the files tracked, got 713/327.
- ⭐ **Read a red check right after a generator repair as a BACKLOG COMING DUE**,
  not as the repair misbehaving. The reds are deferred drift arriving all at once.
- ⭐ **Run the full CI guard list locally, not the subset you think is relevant.**
  After the first cycle I had run only the guards I judged related and missed #2;
  extracting every `python3 …` line from `js-tests.yml` and running all 41 caught
  #4's sibling before a second red cycle. One command, ~2 minutes.

### A check that greps source cannot tell a warning from a call

Writing the guard for #1's sibling, I asserted "the builder never reads the stale
crosswalk" by grepping its source — and it failed on the builder's own comment
saying not to read it. Replaced with a runtime assertion that records what the
build actually opens. **Assert the behavior, not a proxy for it.**

Full note: [`methodology-a-guard-on-generated-output-cannot-see-its-source`](kb-notes/methodology-a-guard-on-generated-output-cannot-see-its-source.md).

## 2026-09-29 — S303 (SkyWarp): a PR that conflicts runs no `pull_request` CI

- **A PR whose head conflicts with its base gets no `pull_request` workflow run at all**, so `test` never appears and a `check_suite.completed` wake arrives with nothing in it. On #1755 the daily dashboard committed to main (`ba91608`, a row-audit regeneration) seventy seconds before the session pushed its merge of main, so the pushed head already conflicted. When a head shows no check runs, fetch main and try the merge (`git merge-tree`) before waiting on CI.
- **Hold a merge that a cron run could overwrite until that run finishes.** The ETHS re-key had to follow the merge before any dashboard run synced curation; the session waited for the in-flight dispatch to finish, merged, re-keyed, read back (0/0/4/3), then dispatched the dashboard.
- **A bot commit on a feature branch is routine**: the First Light art job pushes `[skip ci]` after each push to a branch. A rejected push means fetch and look before blaming a person.
- **A clean head can still get no CI.** #1766's pushes at 23:40Z and 23:56Z (heads `58d19030`, `841bbb77`) produced no workflow run in the whole repo for over half an hour, with `mergeable_state` stuck at `unknown`, though `git merge-tree` against main was clean and `git ls-remote` showed the head. Rule out a conflict first; then the next push is the remedy, on Sam's word (*"Try pushing"*, 2026-09-30), never a close and reopen.

## 2026-11-18 — S679 (SkyKinglet, Sam's session, the conductor): nine merges, one generated file, one guard

- **A generated file every PR touches serializes the merges.** `kb/dependency_map.json` (and its `.md`) changed on every
  open PR after each merge, so each PR conflicted with `main` the moment the one before it landed. A PR in conflict gets
  no `pull_request` CI at all (the S303 lesson above), and the `test` gate takes about 11 minutes, so nine merges ran
  one after another. Regenerate the map after merging `main` (`python3 kb/_build_dependency_map.py`), push, and wait
  for `test` on the new head; there is no way to batch them.
- **Auto-resolve only the dependency maps; stop on any other conflict.** One merge of `main` ran `git add -A` over a
  conflicted `kb/migrations/.apply` and committed the conflict markers. The migrate runner read no valid `file=` line and
  skipped, so nothing ran, but a trigger file is the one place where a bad merge could apply the wrong SQL. The rule
  for a worker: regenerate `kb/dependency_map.*` on a conflict, and on a conflict in any other file stop and report it.
- **A guard patched one bypass at a time keeps leaking; on the third round, redesign it into one choke point that fails
  closed.** The combine guard on the Exhibits List had three rounds of the same finding class (a surface that folded
  without the graded and cert-based check). The third round moved every fold behind `foldWrite` and `foldGate`. The
  fourth read still found two fail-open paths, both where the guard did not know the answer: the CPL types file had not
  loaded, and 1,025 of 2,849 titles carry no type. A guard has to treat "unknown" as "hold", by design, not as a case
  to add later. KB note: `methodology-a-guard-must-fail-closed-when-it-cannot-decide`.
- **A worker worktree inside the repo trips the stop hook, and harness worktrees stay locked after their agent ends.**
  Put worker worktrees outside the repo folder. To clean one up: check its branch matches the pushed head
  (`git -C <wt> rev-parse HEAD` against `git ls-remote origin <branch>`), then `git worktree unlock`, then
  `git worktree remove`.
- **Ask pr-gate for facts, not for a merge call.** Auto mode flagged a brief that asked pr-gate whether to merge. Ask it
  for the head sha, the `test` result on that head and the mergeable state; the conductor makes the call from those.
- **A count settles a scope dispute faster than an argument.** The conductor narrowed Sam's ruling 2 (`short_high`) to
  range sums; COBIx answered with the number of records the narrow reading left failing (single-figure sums inside a
  printed range), and the conductor reversed it in one exchange. Detail: `docs/program_requirements_harvest_lessons.md`,
  *S679*.

## 2026-11-18 — S680 (SkyPhoebe, the CPL Queue routine's conductor night): slimming the repo, one wave PR

- **Move bulky generated data out, then hold the line in CI.** 141 display receipts (2,266.4 MB in the tree) and 165
  row audit reports left for the private bucket `cpl-receipts`, each verified by sha256 against its index entry before a
  `git rm`; a gate test (`tests/receipt_move_gate_test.py`) holds every removed path to an entry. Then the size guard
  (`scripts/repo_size_guard.py`) runs inside `lints`, so a red guard is a red `test`. The tree went from 4,862 MB to
  1,619.8 MB, and a depth-1 download from about 2.0 GB to 438.6 MB. Lane: `docs/reference/lanes/repo-size.md`.
- **A fetch from a private store on a public repo is a publication.** A run artifact on this public repo is readable by
  anyone, so `step=fetch` hands out only the kinds in `kb/_receipt_store.py`'s `PUBLIC_SAFE` table (COBIx's finding).
- **Scan before you call a history rewrite a privacy question.** All 141 display receipts held no email address and no
  person key, so Part 5 is a size question only.
- **A read is free in dollars and not in runner slots.** Eight outcome runs and CI on a dozen PRs saturated the runner
  pool; each CI took 25 to 40 minutes. Cap concurrent reads when PRs must merge the same night.
- **A chain of PRs survives one link; one wave PR lands the rest.** The chain (each branch holding the one before it)
  merged #3496 (`71548415`), then #3498 conflicted: the squash on `main` and a branch holding the same change plus more
  edit the same hunks of the generated files (dependency maps, Commons data), so each further link needed a merge of
  `main`, a new head and a new CI run. One wave PR, #3504, carried #3498 with #3501, #3490, #3503, #3502 and the outcome
  PRs #3387, #3493, #3488, #3489 and #3421: one merge of `main`, one CI run, one squash; each carried PR closed with a
  pointer. KB note: `methodology-chain-prs-when-every-merge-conflicts-a-generated-file`.
- **A merged branch carries its `.apply` line, and a push re-triggers the apply.** Chaining copied #3496's
  `kb/migrations/.apply` line onto other branches, and their pushes re-ran its full-row apply (runs 44269433074 and
  44272782139). The count guard refused both ("the UPDATE matched 0 rows, the plan names 39"); nothing was written
  twice. A branch that merges another branch keeps `main`'s `.apply` text; every apply file stays guarded and
  idempotent.
- **A guard that fails where nobody looks is not a guard** (COBIx on #3490, 08:49Z): a red weekly size run reached
  nobody, and the cron's pushes skip the file rules. The wave keeps the weekly job on the failure watch list, and
  weekly mode lists the over-limit files on `main`.
- **`check_generated.sh` is not the whole of CI's generated checks.** A PR that changes what the Commons data reads must
  rebuild `commons_data.json`; CI's `lints` checks it and `check_generated.sh` does not, so three PRs went red. NEXT for
  a plain session: add it.
- **Sparse checkout and `git -C` keep a conductor's checkout sane.** `git sparse-checkout set --no-cone '/*'
  '!/kb/receipts/program_requirement_records_display_*'` before spawning made each worktree 2.5 GB instead of 4.85; a
  `cd` into a worker's worktree moved the conductor's working directory, so use `git -C`, and push `.apply` commits
  from a tiny sparse worktree with `HEAD:<branch>`.
- **The session trim waits.** As written it assumes a session rooted at the repo; ours root at the parent with three
  repos, the repo's own settings do not load there, and a trimmed tree breaks `check_generated.sh` and the tests until
  the data folders come back. It needs COBIx and a plain session.

## 2026-11-18 — S681 (SkyGrebe, the CPL Queue routine's conductor firing): a gate that cannot see the field

- **A load gated on "slices complete" posted 1,013 mislabeled rows.** Chabot's objectives were filed as its SLOs; the
  objectives standing test was already red on the read's branch, but a runner's commit gets no CI and step 11 pushed
  `.load` on completeness alone. The test now runs on the branch before `.load` (`scheduled_sessions` step 11); a guard
  in `course-outcomes-load.yml` is a plain session's. KB note: `methodology-a-self-check-must-see-what-the-rule-writes`.
- **A self-check on totals cannot see per-course values.** Units rule A4 scored 74 of 74 on totals while writing wrong
  per-course units; the check that found it compared each member's units with the state course file.
- **A stop rule needs a number and a default.** The brief's 1% line made the call mechanical: the rollback undid 17.7% of
  the day's outline rows, so the conductor stopped new writes, finished reviews on branches, rolled back, and told Sam
  the default (the next night applies the two reviewed plans and reads Chabot again).
- **Superseded CI holds the migrate queue.** About a dozen pushes in 45 minutes queued the rollback's migrate run for 11
  minutes. Cancel CI on branches a wave carries, batch a worker's pushes, and expect a migrate run to wait behind CI.
- **A carried branch leaves a wave by `git revert -m 1` of its merge** (`bf9703bb` took Chabot out of #3509), since the
  wave lands as one squash.
- **A live session's handoff reads from its open pull request** (`get_file_contents` at `refs/pull/N/head`). S681 read
  S680's that way and took the queue when its checkpoint merged two minutes later. The one-session rule stays end in
  one line; whether a firing may wait for a routine firing's checkpoint is Sam's or COBIx's to rule.
- **Worker worktrees are heavy.** Under `.claude/worktrees/` each took about 2.3 GB; six took the disk from 27 GB free to
  13 GB. Remove a finished worker's worktree once its head is pushed. `git -C`, never `cd`, into one.

## 2026-11-18 — S683 daytime (SkyDipper, Sam's code session by day): six merges, three parked, the watcher

- **A Workflow did not honor worker worktree isolation.** Two workers ran in the conductor's checkout; one committed on
  the session branch and another checked out #3472's old tree over it. A brief now names the worktree path the agent
  creates off `origin/main` and stays in (`.claude/skills/conductor-brief` item 4;
  `p-workflow-workers-share-main-checkout-s683`). The checkpoint worker's harness held it to its own worktree and
  refused a `cd` into the shared checkout: the guard that the Workflow lacked.
- **A run that changes a view's inputs rebuilds the view.** `cer-procedures.yml` changed what the Side by side views
  read and left them stale, so `main` went red after run 44350607385 (#3520). The run rebuilds them now, and a failed
  rebuild holds the review queue back and ends red; tests pick fixtures by rule, never by a fixed title.
- **Resolve once.** The inactive-card builder read 1,067 where 1,119 belonged because exhibit links were resolved
  through the alias chain a second time; `kb/coci_articulations.json` is already current-era (#3519). Read a resolved
  file raw and refuse one without its applied markers.
- **A generated file every PR rebuilds is a conflict machine.** The dependency map caused most of the day's
  conflicts; Sam's rule moves its rebuild to one job on `main` (#3526), and a PR leaves it alone.
- **Watch the reviewer instead of waiting for a relay.** `scripts/cobix_watch.sh` polls two GitHub searches every five
  minutes from a saved last-seen file; `tests/cobix_watch_test.py` fails any call but `gh api -X GET search/issues`,
  the one `gh` shape a cloud session may run.
- **Park a stalled PR as an issue** (PR closed, branch kept: #3522 to #3525) to hold the three-PR cap without losing
  the work; the issue names the branch and the next step.
- **A daytime session takes the night's number with a label** and appends a dated section to the newest handoff;
  `kb/_build_session_spend.py` reads that section's own `Spend:` line as session N daytime.
