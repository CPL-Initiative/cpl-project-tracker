---
title: Session 281 handoff — the verdicts landed, the storm is down to one setup-script edit, and every sheet changes shape
date: 2026-09-20
session: 280 (SkyForge)
tags: [handoff, cr-reference, jev, decision-sheets, permissions, prompt-storm]
status: current
---

# You are Session 281

Your moniker is **SkyAnvil** — S280 (SkyForge) took Sam's 51 verdicts from
the Jev sheet into `cr_reference_decisions`, diagnosed the Allow-SQL storm to
its last lever, and wrote down the rulings that reshape every decision sheet
from here. What is left is building on those rulings, and one edit of the
cloud environment's setup script that only Sam can make.

## ✅ WHAT SHIPPED

| PR | What |
|---|---|
| [#1638](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1638) | KB note `reference-system-one-model-fit-by-lane`: Jev's 21 use cases mapped to our lanes, with the gates — merged |
| [#1639](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1639) | Approval-prompt reference: the session-root guards load; a hook allow does not stop the `execute_sql` prompt — merged |
| [#1640](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1640) | CR Reference: Sam's 51 verdicts recorded (41 fold, 10 keep) with the receipt, his decision-sheet rulings, this checkpoint — merged |
| [#1641](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1641) | Prompt guards: the `execute_sql` rule pinned to its hook by a test, the checker reads the session root, the installer's comments corrected, the dependency map regenerated — merged |
| CPLBrain #158–#162 | S279's parked note and Ashley's; this session's note and tools booklet; two braindumps — all merged |

**Supabase:** `cr_reference_decisions` holds **30 rows** (was 0) under
`updated_by = cr-reference-s280@bot`, verified member-by-member against
`kb/receipts/cr_reference_decisions_2026-09-20_s280.json`; rollback is one
delete on that value. `cpl_memory` gained 11 rows (S279's six, one advice
row, four rulings and pitfalls). No SQL is owed for this checkpoint.

## ⛔ ONE EDIT WAITS ON SAM — rebuild the environment snapshot

The `execute_sql` allow rule is on `main` (Sam's c7382c94) with its test
(#1641). A session Sam started at 20:05, after the commit, still read one
`execute_sql` line in `/home/user/.claude/settings.json`, and its container
carried the same clone and settings timestamps as this one, to the second
(15:03:17 / 15:03:27 / 15:03:31). The docs name the mechanism: the setup
script runs once, Anthropic snapshots the filesystem, and every later session
starts from the snapshot and skips the script. It runs again only when the
environment's setup script or allowed hosts change, or after about seven days.

**Sam's action, once:** edit the setup script at claude.ai/code (a dated
comment line is enough), save. The next new session rebuilds the snapshot and
`python3 scripts/check_hooks_live.py` reads `execute_sql allow rule: yes`.
**Until then, per session:** `python3 scripts/install_prompt_guards.py
--apply`; settings edits reach the running session (docs, "When edits take
effect"). **Confirm** in a session that reads `yes`: a plain `select` through
the Supabase tool with no prompt, and `update kb_curation set value = value
where false` still refused by the guard. If that ever executes, the rule is
short-circuiting the hook and comes out. Full record and the two routes
considered: `docs/reference/approval_prompt_hooks.md`, "2026-09-20, later".

## SAM'S DECISIONS THIS RUN

- **Flip 26, 27, 28, 29, 32, 35, 37, 38 to fold, and go.** 41 fold, 10 keep.
  Yes read as fold throughout; the sheet's own Yes was ambiguous in the review band.
- **"Make your recommendation line more visually a focal point."** He clicked
  Yes on hold-separate proposals by reflex and had to flip them.
- **Over-merge by design.** *"It is better to over merge and give faculty the
  chance to pull them out... It's easier to respond to a decision than to make
  one."* The framing on every sheet: no student repeats a mastered course;
  credit mobility and articulation adoptability. The flow runs for CER, CSR,
  CCRR and CCR; CCR is *"the big kahuna with its thousands of decisions"*.
- **Decision fatigue is the design constraint; gamify without a game.** He
  agreed with the pushback: quality in the score, rewards native to the work,
  shared challenges rather than college rankings. *"Good pushback--agree!"*
- **CI:** shard the JS suite and run only what the diff touches, plus the
  funding hot spot — *"sounds good to me"*, as recommendations. Measure first.
  Add to the plan: the dependency map records line numbers, so a one-line
  edit above a mapped reference (Sam's, in the installer: 180 to 181) turned
  `main` red at the next push; make the staleness check ignore line drift, or
  drop the numbers from the map.
- **Stay on Auto** (he asked about Accept Edits). **TruffleHog stays.**
- **Open to him:** the Jev data rule (public catalog text is all that leaves
  the building) and whether to start Sierra's semantic smoke assertions.

## Carryover

| Item | State |
|---|---|
| The `execute_sql` allow rule | on `main` with its test (#1641). **NEEDS SAM:** one edit of the environment's setup script so the snapshot rebuilds; `--apply` per session until then |
| Decision-sheet template rebuild | `s280-fable-decision-sheet-template-rec-is-the-focal-point` — the next build; rules in `docs/reference/decision_sheets.md` |
| Variable battery | `s279-fable-jev-variable-battery` — score profiles against the receipt's 51 verdicts; the gate is settled, the band under it is the work |
| CI plan | `s280-fable-ci-shard-and-run-only-what-the-diff-touches` — measure per-file timings first |
| Sierra semantic smoke assertions | proposed in the KB note; awaits Sam's go |
| `kb_curation` reason column | Governance first; a prerequisite for CER and CCR sheets |
| Sierra: four defects, Chaffey false negative | untouched |
| SkyView pinch failure | inherited, `s278-fable-skyview-pinch-registry` |

## Read in order

This file · `docs/reference/lanes/common-cr-reference.md` ·
`docs/reference/decision_sheets.md` (Sam's rulings) ·
`docs/kb-notes/reference-system-one-model-fit-by-lane.md` ·
`docs/reference/approval_prompt_hooks.md` (2026-09-20 section) ·
the receipt · `docs/common_cr_reference_lessons.md` (2026-09-20).

## Things that worked

- **The transcript is the instrument.** `hook_success` entries and the gap
  from `tool_use` to `tool_result` settled in one table what five sessions had
  reasoned about. KB note: `methodology-measure-a-guard-by-the-wait-it-removes`.
- **One prompt per decision.** Every `execute_sql` call costs Sam a click
  until the rule lands; a CTE that inserts the memory rows and returns the
  verification in the same statement paid once.
- **`ArtifactData` list on `replies`** reads verdicts; `build_pairs()` from
  the trial script joins the sheet's wordings to worklist keys;
  `md5(members::text)` in Postgres jsonb text form verifies a write.
- **`apply_migration` carried the reviewed data write** when the hook denies
  `execute_sql`; Sam's go came first, the receipt was committed, the table was
  read fresh at write time.
- **Capture on the fly.** Two braindumps merged within the hour of Sam
  saying the words.

## Safety patterns to honor

- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (fresh
  read, INSERT-only, receipt, rollback key — the write above is the worked example).
- The classifier's `[Self-Modification]` refusal is the human gate; never
  route around it with another tool.
- A `check_suite.completed` wake names a superseded head; re-read
  `get_check_runs` on the current head before merging.
- A branch auto-deletes on merge; restart it from `origin/main`.
- Nothing on a decision sheet executes until Sam says go; an item with no
  reply has no verdict.

---

*Greetings, you are Sky**Anvil** (Session 281), see Sky**Forge**'s handoff —
`docs/session_281_handoff.md` — let's keep rolling with our queue.*
