---
title: Session 281 handoff — the verdicts landed, the storm is down to one prompt on execute_sql, and every sheet changes shape
date: 2026-09-20
session: 280 (SkyForge)
tags: [handoff, cr-reference, jev, decision-sheets, permissions, prompt-storm]
status: current
---

# You are Session 281

Your moniker is **SkyAnvil** — S280 (SkyForge) took Sam's 51 verdicts from
the Jev sheet into `cr_reference_decisions`, diagnosed the Allow-SQL storm to
its last lever, and wrote down the rulings that reshape every decision sheet
from here. What is left is building on those rulings; the storm is down to
one prompt on `execute_sql`, and that one is upstream of everything local.

## ✅ WHAT SHIPPED

| PR | What |
|---|---|
| [#1638](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1638) | KB note `reference-system-one-model-fit-by-lane`: Jev's 21 use cases mapped to our lanes, with the gates — merged |
| [#1639](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1639) | Approval-prompt reference: the session-root guards load; a hook allow does not stop the `execute_sql` prompt — merged |
| [#1640](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1640) | CR Reference: Sam's 51 verdicts recorded (41 fold, 10 keep) with the receipt, his decision-sheet rulings, this checkpoint — merged |
| [#1641](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1641) | Prompt guards: the `execute_sql` rule pinned to its hook by a test, the checker reads the session root, the installer's comments corrected, the dependency map regenerated — merged |
| [#1642](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1642) | The setup script runs once per environment snapshot: the correction, the procedure, the hook-entry count — merged |
| [#1643](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1643) | Sam's paste rule in `CLAUDE.md`; the 20:40:31 confirmation; the connector's mark on `execute_sql`; this handoff — merges on green |
| CPLBrain #158–#162 | S279's parked note and Ashley's; this session's note and tools booklet; two braindumps — all merged |

**Supabase:** `cr_reference_decisions` holds **30 rows** (was 0) under
`updated_by = cr-reference-s280@bot`, verified member-by-member against
`kb/receipts/cr_reference_decisions_2026-09-20_s280.json`; rollback is one
delete on that value. `cpl_memory` gained 11 rows (S279's six, one advice
row, four rulings and pitfalls). No SQL is owed for this checkpoint.

## ✅ THE SNAPSHOT REBUILT — and one prompt on `execute_sql` remains

The `execute_sql` allow rule is on `main` (Sam's c7382c94) with its test
(#1641). A session Sam started at 20:05, after the commit, still read one
`execute_sql` line, because a cloud session starts from the environment's
filesystem snapshot: the setup script runs once, later sessions skip it, and
it runs again only when the script or the allowed hosts change or after about
seven days (#1642 records the measurement and the docs). Sam added a dated
comment line to the setup script; the next session's settings were written at
20:40:31 with 33 rules and `check_hooks_live.py` read `execute_sql allow
rule: yes`.

**The confirmation, about 21:00:** the guard refused `update kb_curation set
value = value where false` before it reached Supabase (its text verbatim in
the reference doc), and `select 1` STILL prompted, Deny / Allow once, no
"don't ask again". Sam then ran the discriminating paste in that same
session (about 21:15): the checker read `execute_sql allow rule: yes` with 33
rules, the allow-listed `list_tables` went through with no prompt, and
`execute_sql` alone had asked. So the rules load and hold for every other
tool, and the one exception is a mark on `execute_sql` that Claude Code
honors past any allow rule (`anthropic/requiresUserInteraction`; the public
server source carries none, so it is added upstream, by the hosted build or
the connector platform). Nothing in this repo, the root settings, a hook or a
mode reaches it. **NEEDS SAM, a design choice, recommended order:** keep the
one prompt and ask Supabase support the one question (does the hosted
connector mark `execute_sql`, and does read-only mode change it); a read path
that is not this tool (the npm server in the sandbox in read-only mode, a
token and two allowed hosts) only as a decision-sheet item with its security
review. Writes (`apply_migration`, any mutating tool) prompt by
design and should; a session batches its memory writes into one call per
checkpoint so Sam sees one prompt, not two. Whenever `ALLOW_TOOLS` or the
guards change again: merge, then change the date on the setup script's
comment line. Nothing is pasted per session any more; if that ever changes,
it goes in the opening line Sam pastes, never in prose he must remember.
Full record: `docs/reference/approval_prompt_hooks.md`, "2026-09-20, later".

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
- **Hand over the whole paste** (2026-09-20): *"When you give me instructions,
  let me know exactly what to paste in the new session. I doubt I'll remember
  this habit."* A command for another session goes to him as the full message
  he pastes there: the command, *paste the output, no investigation*, and what
  a good result looks like. Now a CLAUDE.md team obligation; the session that
  got the bare version spent about twenty-five tool runs on two lines.
- **Open to him:** the Jev data rule (public catalog text is all that leaves
  the building), whether to start Sierra's semantic smoke assertions, and the
  `execute_sql` read path (keep the one prompt, or a path that is not this tool).

## Carryover

| Item | State |
|---|---|
| The `execute_sql` prompt | rule on `main` (#1641), snapshot rebuilt 20:40:31, guard refuses writes, rules load (`list_tables` silent); `execute_sql` alone prompts, by an upstream mark. **NEEDS SAM:** keep the one prompt (recommended, plus one question to Supabase support), or a read path that is not this tool, by decision sheet |
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
