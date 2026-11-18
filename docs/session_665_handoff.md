---
title: "Session 665 handoff (from SkyWren, S664)"
created: 2026-11-16
updated: 2026-11-16
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_671_handoff.md
---

# You are SkyThrush (Session 665)

From SkyWren, S664, the CPL Queue routine's 10:12Z firing on 2026-11-16. A **full checkpoint** (a Rule 10 data
write and its receipt; the harvest lane moved). Step 7 skipped (the pipeline did not move).

Read this file, then the harvest lane (`docs/reference/lanes/program-requirements-harvest.md`, the course objectives
paragraph and the Riverside City paragraph), then `docs/program_requirements_harvest_lessons.md` S664.

## What shipped

- **#3389**: COBIx's parser item from #3386. The SLO reader's lead-in pattern now reads *Upon the completion of this
  course, ...* (Las Positas), which it had filed as outcome 1. Reparsing all 17 filed trials changed only Las Positas.
  **Data write:** a guarded UPDATE corrected the 505 live Las Positas SLO rows in place (ids 9385 to 9889; 59 are now
  `paragraph`), with the receipt and rollback in `kb/receipts/course_outcomes_laspositas_lead_fix_s664.md`. The filed
  Las Positas reads were matched. Decided `d-laspositas-lead-fix-in-place-s664`.

## First things, in order

1. **Step 11, on the next UTC day (Nov 17).** Nov 16 had its full read (Las Positas, #3386). Next comes Coastline's
   objectives reread, which counts as the full read, then Golden West (`cccd`, one host), plus one preparation run.
   College of the Redwoods (#3387, run 43817157271) and Allan Hancock (#3284) are both *read* (12 of 12), and each
   waits its turn. SLOs, PLOs and objectives have their own $40-per-college limit.
   **Before Golden West's reread:** 3 of its live CourseLeaf SLO rows file the heading *Course outcomes:* as outcome 1
   (COBIx on #3389, verified). Fix that in the parse and correct the 3 rows in place, the way #3389 did, so the
   reread does not file them twice.
2. **The prior-catalog read** (harvest lane NEXT): (b) a Cal-GETC units step for Riverside City, cited from its own
   catalog, then the prior dispatch for Physics 32745; (c) Communication Studies 30578 and Business Administration
   33829 from archive 7 (2024-2025), with that year's renumber map read from its own pages. After that, the other
   colleges' same-page pairs. Paid extraction stays under the $40-per-college-per-run limit, judged on the estimate.
3. **For Sam:** `cdc-restricted-tables-read-by-team-phrase-s660` (the `org-phrase-scope-auth` lane's call) and Honors
   step 2's apply (Sheet 200 card 1). Change no grant or policy.
4. **Monterey Peninsula** 03653, 22098 and 39361 need a person. **Slice B of #3299** waits behind #3293. Next Sunday's
   contacts (`map-users-student-contact`).
5. **Sam's billing paste after Nov 15**, when he supplies it, goes into `kb/reference/model_spend_daily.json` (`commons`).
6. **Lanes with a NEXT not taken:** `library`, `college-district-identity` (waits on MAP's two `awaiting_map_id`
   ids), `eacr-exhibit-cr-adoption`, `implementation-funding` (card 11 is Sam's), `reviewer-session-lifetime`,
   `sierra-retrieval-corpus`, `sierra-page-redesign` (#3159 is Sam's), `governance-team-enablement`,
   `cer-procedures`, `workplan-annual-goals`, `csm-workspace`.

## Session settings

One Opus 5.5 session works the queue: no conductor, no ultracode, and no parallel workers unless Sam starts them.
The $40-per-college-per-run limits (program requirements, and separately SLOs, PLOs and objectives) and the #3351
gates stand. Merge only to `main`, confirmed with `git log origin/main`. Two review rounds, then Sam or COBIx.

## Ledger (PR, state, next)

| PR | State | Next |
|---|---|---|
| #3389 | merged | none |
| #3387, #3284 | drafts; keep | First thing 1 |
| #3293 | draft; keep | First thing 4 |
| #2894 | Sam's | none |
| #3383 | dependabot | none taken |
| CPLBrain #803 | the S664 session note | merge |

## Decisions and pitfalls

`cpl_memory` row `d-laspositas-lead-fix-in-place-s664` (proposed), logged to `cpl_memory_log` as `create`. No new
ruling from Sam. **Pitfalls:** `course_outcomes` loads insert-only by fingerprint, so a parser change that alters a
block makes a second row on reread unless the live rows move first. Reparse every filed trial before and after a
parser change, because that measures the blast radius. Measure a reviewer's count before repeating it: COBIx's
"535 at 2 colleges" read as 505 at Las Positas alone.

## Checkpoint notes

Lint: 201 vault-heavy paths (76 on main's earlier run; the count depends on the clone, not taken up here), 5 oversized
docs, 1 kb-note dialect. `kb/status/program-requirements.json` was stamped without `get_trigger`, which is not
among this firing's tools, so the next run reads the routine's hourly cadence. Wiki candidate for `/wiki-ingest`:
an insert-only, fingerprint-keyed load turns a parser fix into a duplicate unless the live rows are corrected first.

## Let go

No PR subscription, check-in or artifact watch was made. Nothing is held. The standing sheet stays
[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current; card 1 waits on Sam).

Cost: this session's cost not available (no `get_session` tool in this firing); substantive PRs merged 1 (#3389).

Spend: not available; 2026-11-16T10:12Z to 2026-11-16T10:58Z.

Greetings, you are SkyThrush (Session 665), see SkyWren's handoff — `docs/session_665_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_665_handoff.md) — let's keep rolling with our queue.
