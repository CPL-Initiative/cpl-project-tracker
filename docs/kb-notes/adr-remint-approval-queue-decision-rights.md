---
title: ADR — The re-mint approval queue: a queue, never a fire button, and where its decision right sits
created: 2026-09-05
updated: 2026-09-05
tags: [adr, governance, mid-lifecycle, remint, decision-rights, write-surface, privacy]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/adr-judgment-in-tables-mechanism-in-code]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/reference/mid_lifecycle]]"
  - "[[docs/reference/data_write_rollback]]"
artifacts:
  - kb/governance_surface_map.json
  - kb/_merge_candidate_queue.py
  - kb/_identities_rekey_dryrun.py
  - docs/coursecontrolnumber_remint.md
---

# The re-mint approval queue

**Status: routed, not built.** Sam asked (2026-09-05) for *"an admin view that
allows me to fire a remint"*, and ruled yes to the counter-proposal: **a queue,
never a fire button** — candidates with their reasons, he approves, and the
approved set lands through Rule 7's playbook on the next cron window. He also
ruled that it routes through Governance and the privacy ADRs **before** it ships
(Rule 10 a3). This note is that routing. Nothing is built yet, and this note is
what the build has to satisfy.

## Why a button was the wrong shape

Rule 7 makes the re-mint playbook mandatory: dry-run, alias map, `promotions.json`
re-key, atomic land inside one cron window. A button that fires a re-mint from a
web view steps around all four, and the four are not ceremony — each one is a
past failure written down.

The deciding asymmetry is **reversibility**. Rule 10 (a2) says a data write must
be reversible from its receipt. An INSERT-only cohort satisfies that trivially:
delete by `reviewer_email`. A re-mint does not. Once a permutation has rippled
through the alias chain, `promotions.json`, `coci_articulations.json`,
`crnc_mirrors.json` and the Supabase curation rows, there is no undo — only a
compensating re-mint, which is another permutation with its own blast radius.

Session 232 is the worked example. A single dry run, gated by five post-state
checks that all passed, was one `--apply` away from deleting 172 live C-ID
identities carrying 662 articulation records. The gates were sound; the *plan*
was wrong, because its liveness set could not contain the identity system it was
judging. **Gates check that the post-state is consistent, not that the plan was
sane.** A button gives the plan no reader.

## The decision right

| | |
|---|---|
| **Who decides a re-mint happens** | Sam, per candidate, in the queue. |
| **Who decides it is *correct*** | the dry run's gates + a session's reading of the plan — neither sufficient alone |
| **Who executes** | the cron window, through the Rule 7 playbook, never the view |
| **What the view may write** | an approval row, and nothing else |
| **What the view may never write** | an id, an alias map, a `merge_into`, a curation row |

The queue is therefore a **new write surface** in exactly the sense Rule 10 (a3)
means: a read-only admin page gaining a write. It gets a row in
`kb/governance_surface_map.json` when it ships — mapped to a register row that
names Sam as the owner of the approval, not dismissed. Dismissing it would be
asserting that "who may re-mint the identity layer" is not a decision right,
which is the opposite of true.

⚠️ **Map it at the moment the first write lands, not after.** The surface map is
persistent memory for the drift detector; a surface that ships unmapped is
proposed as a candidate later, and by then the write has been live for however
long it took someone to look.

## The privacy check

**It clears.** The queue's rows are course identities — SUBJ4 codes, M-IDs,
titles, college counts, articulation counts. No student appears, so the
student-detail disclosure boundary
([`adr-student-detail-aggregate-disclosure-control`](adr-student-detail-aggregate-disclosure-control.md))
is not engaged, and neither are the CER-counts or funding-metrics ADRs.

Two things to hold anyway:

- **College counts are not small cells here.** They count *institutions offering
  a course*, not students, so `k=10` does not apply. If a future column ever
  carries a student count against a candidate, it does, and this note is wrong
  until it says so.
- **The reviewer's identity is recorded.** An approval is attributed with who and
  when, like every other curator judgment (the provenance tiers in
  `map_users.js`). That is staff data, not student data, and it is the point:
  an approval nobody signed is not an approval.

## What the queue must show per candidate

Learned from what the Session 232 near-miss needed and did not have:

1. **What moves** — every id, from and to, and how many rows each carries.
2. **Why** — the rule that proposed it, named, not summarized.
3. **What the plan judged it against** — the liveness set, *stated*. The C-ID
   near-miss is invisible unless the reader can see that the set was
   M-ID-only.
4. **What would be dropped**, in full, per Sam's ruling 5: a worklist, never a
   silent drop. A candidate that drops rows and does not list them is not
   approvable.
5. **The receipt path** the apply will use, so approval and execution are
   provably the same plan (the dry run's P1 check already enforces this: the
   recomputed plan must equal the frozen one, or the apply aborts).

## What "approved" means

An approval is a **claim about a frozen receipt**, not about a candidate id. The
apply re-derives the plan and refuses if it has drifted, so an approval cannot
silently authorize a different change than the one that was read. That is the P0
/ P1 shape `kb/_identities_rekey_dryrun.py` already carries, and the queue
inherits it rather than inventing a second one.

## Before it ships

- [ ] A register row naming the approval's owner, and the surface mapped in
      `kb/governance_surface_map.json` against it.
- [ ] The approval table's rollback documented per
      [`data_write_rollback`](../reference/data_write_rollback.md) — an
      INSERT-only cohort under a reviewer email, so it reverts by that email.
- [ ] A test asserting the view writes approvals and nothing else, in the shape
      of `tests/merge_candidate_queue_test.py`, whose first assertion is that
      the module holds no write path at all.
- [ ] The candidate rendering carries all five items above; a candidate missing
      any of them does not appear.

## Prior art in this repo

`kb/_merge_candidate_queue.py` (Sam's ruling 6, the same afternoon) is the same
posture one lane over: assemble the evidence, propose the survivor, print the
counts that argue against the proposal, and stop. It exists because sufficiency
is a curriculum judgment. This exists because a re-mint is not reversible.
