---
title: Session 280 handoff — Jev is wired and proven; the CR Reference is a cross-group problem
date: 2026-09-20
session: 279 (SkyKeeper)
tags: [handoff, typesafe, jev, cr-reference, curation, permissions]
status: current
---

# You are Session 280

Your moniker is **SkyForge** — S279 proved TypeSafe's Jev on a real curation
problem and left the verdicts with Sam. What is left is building on an answer
he has not given yet, so read before you act.

## ✅ WHAT SHIPPED

| PR | What |
|---|---|
| [#1635](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1635) | TypeSafe key plumbing, verified wire contract, runner-side smoke test — merged |
| [#1636](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1636) | CR Reference trial + strip-back to one script — merged |
| [#1637](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1637) | The 51-item decision sheet + Sierra to-do — check whether it merged |

**Jev works.** Key is a repo Actions secret `TYPESAFE_API_KEY`. A runner calls
the API. Verified live: models → `jev-latest`, `jev-preview`; 51 pairs scored
in **10 seconds**.

## ⛔ THE OPEN THREAD IS SAM'S, NOT YOURS

He is working a 51-item decision sheet:
**https://claude.ai/artifact/KydcskYBqc93WAurcMEatq**
(source `docs/visuals/2026-09-20-jev-cr-reference-pairs.html`)

⚠️ **Read the verdicts FIRST** with the Artifact tool's `read_db`, collection
`replies`, before executing anything. An item with **no reply document has no
verdict** — it is never a silent yes; ask about the gaps in one line. An `edit`
verdict carries his wording in `note`: use it **verbatim**.

Do not chase him for it. Do not start the variable-battery work until his
verdicts exist — they are the only ground truth this lane will have.

## What the trial actually found

**`cr_reference_decisions` holds ZERO rows.** The lane's "156 of 2,159 groups
carry a decision" counts the MECHANICAL rung ladder, not curator judgments.
There is no human gold set. Reproduce a lane file's numbers before building on
them — that rule earned its keep this run.

**Every rung-5 group holds exactly one wording**, so the ~90% "no matcher
reaches" is a **cross-group** question. Brute force is 1,873,080 pairs;
blocking on the shared canonical gives **51 anchored pairs / 1,459 rows**, each
with a rung-1/2/3 anchor to ask against. **The leverage was the blocking, not
the matcher.**

**Jev discriminates.** *Introduction to Criminal Justice* 0.89 against
*Introduction to Criminology* 0.48 on the same AJ 110 anchor. Physics mechanics
0.64 above E&M 0.44. Spanish 1/2 at 0.84/0.86, Spanish 3 at 0.32.

⚠️ **It never says no.** Nothing fell below 0.32; the `keep` bucket was empty.
Usable gate is **p≥0.85 = suggest**. It suggests, never merges — rung 5's own
rule and Rule 7's TOP posture both hold.

## ⚠️ Two premises that would have cost you

1. **A noul is a PROBABILITY, not a boolean.** `{"noul": 0.89}`. Filtering
   `x is True` reports zero hits whatever the model said — a confidently wrong
   negative shaped like a finding. KB note:
   `methodology-a-typed-answer-is-not-a-boolean`.
2. **`kb_curation` has no column for a reason** (34,443 rows;
   `course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by`).
   Sam's abandoned variables-KB effort had nowhere to land beyond the volume
   problem. KB note: `methodology-a-curation-table-that-cannot-store-a-reason`.

## Carryover

| Item | State |
|---|---|
| Sam's 51 verdicts | **NEEDS SAM** — the gate on everything else here |
| Setup script for prompt guards | **NEEDS SAM** — he added it 2026-09-20; confirm with `python3 cpl-project-tracker/scripts/check_hooks_live.py` |
| `kb_curation` reason column | Needs Governance (Rule 10(a3)) before it ships |
| Variable battery + profile clustering | Designed, not built. Score profiles against Sam's verdicts first |
| Jev for Sierra | Parked in the To-Do feed with the two defects it fits |
| Sierra: four defects, Chaffey false negative | Untouched this session |
| **`cpl_memory` rows for this run** | **NOT WRITTEN** — the repo's Supabase guard blocked the INSERT (Rule 10). The six rows are drafted in the S279 checkpoint commit body; re-run them, or have Sam lift the guard for the run |
| SkyView pinch failure | Inherited, `s278-fable-skyview-pinch-registry` |

## Things that worked

- **Egress beats code.** Sam opened `*.typesafe.ai` (Custom network access +
  defaults). One `curl` of their docs caught the noul bug that no test had.
  **WebFetch takes a different egress path and stays blocked — use `curl`.**
- **Iterate without merging.** `js-tests.yml` fires on `pull_request` and
  pushes to `main` only. Push to a branch with **no open PR**, dispatch the
  workflow at that `ref`, get results in ~40s. Open the PR once at the end.
- **The Supabase SQL guard fired mid-session**, blocking a `cpl_memory` INSERT
  after `install_prompt_guards.py --apply` ran. So a PreToolUse hook installed
  into the session root CAN take effect without a restart, which contradicts
  the "start a NEW session" note the installer prints. Worth confirming.
- **Regenerate → verify → commit must be ONE shell invocation.** Three red CI
  cycles this session were all stale generated artifacts. Capture each gate's
  exit status directly; `methodology-a-pipe-discards-a-commands-verdict` names
  `_build_dependency_map.py` specifically.

## Safety patterns to honor

- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP; batch queries — the approval prompts are real).
- A `check_suite.completed` wake routinely names a **superseded head**. Always
  re-read `get_check_runs` on the current head.
- A branch auto-deletes on merge; restart it from `origin/main` rather than
  force-pushing stale history.
- The decision sheet **suggests**. Nothing on it merges anything.

---

*Greetings, you are Sky**Forge** (Session 280), see Sky**Keeper**'s handoff —
`docs/session_280_handoff.md` — let's keep rolling with our queue.*
