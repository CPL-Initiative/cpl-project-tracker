---
title: Re-mint split invariants — id↔SUBJ4, control-number atomicity, dry-run↔apply cross-check
created: 2026-05-29
updated: 2026-05-29
tags: [methodology, re-mint, m-id, dry-run, apply, invariants, gates]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[over-merge-remint-scope]]"
  - "[[overmerge_remint_lessons]]"
  - "[[CLAUDE]]"
artifacts:
  - kb/_overmerge_dryrun.py
  - kb/_overmerge_apply.py
  - docs/coursecontrolnumber_remint.md
---

# Re-mint split invariants

> **One-sentence summary** — three invariants any M-ID re-mint that *splits or
> re-keys* identities must hold, learned (the hard way) building the
> cross-discipline over-merge re-mint: the id prefix must equal the SUBJ4, a
> CourseControlNumber must be atomic across pieces, and the dry-run↔apply pair is
> a cross-check you must re-run after any planner change.

## Context

A re-mint dry-run plans a 1:N split (old M-ID → kept + new corroborated +
singleton pieces); the apply consumes the dry-run's `alias_map.json` and executes
it. Both run V1–V4 gates. These three invariants are where "looks correct" and
"is correct" diverge — each was caught only by a gate or a cross-check, not by
reading the code.

## 1. id-prefix MUST equal SUBJ4 (re-key, don't inherit, when the discipline changes)

A minted id is `SUBJ4 M<band><suffix>`; the prefix **is** the SUBJ4, and
(post-Phase-1e) all M-IDs of a discipline share one SUBJ4. So when a split/relabel
changes a group's discipline, its SUBJ4 changes — and it must NOT keep the old id.

> A group inherits the old id **only if its SUBJ4 still matches the old prefix**;
> otherwise the old id retires and every group re-keys to its own SUBJ4.

Failure mode caught: a keep-whole "Social Media" relabeled `OTEC M1212` →
Multimedia kept the old id but carried `subj4=MULT` → an `OTEC`-prefixed id that's
Multimedia. The fix re-keys it to `MULT M####` (old id retires, aliased). Verify
with a post-pass: **0 rows where `id_prefix != subj4`**.

This matters double when a downstream feature derives discipline *from* the SUBJ4
(e.g. a SUBJ4-curation cascade): a prefix↔SUBJ4 mismatch silently corrupts that
inference.

## 2. A CourseControlNumber must be ATOMIC across pieces

If the alias map assigns members to pieces by `control_numbers`, and the apply
gathers each piece's members by looking up `control_number → members`, then a CN
that lands in **two** pieces gets its members gathered (and counted) **twice** →
V2 member-conservation fails.

This happens when **cross-listed courses** (one course offered under two subject
codes at one college — e.g. `DMA C201` / `DMAC 201`, same CCN) are split by a
finer key (subject/discipline) into different pieces. They're ONE course; they
must stay in ONE piece.

> Before grouping, **collapse members sharing a control_number into one atomic
> unit**; resolve the unit's discipline by the modal of its members; assign the
> whole unit to one group.

Verify: **0 control_numbers appear in >1 piece**. (Conceptually correct too —
cross-listed = one course, one identity.)

## 3. Re-run the APPLY against every changed plan — the dry-run↔apply pair is a cross-check

The dry-run computes V2 by counting grouped members directly; the apply computes
V2 by gathering members *by control_number* from the live file. **These can
disagree.** When the over-merge split logic changed (iter 1), the dry-run's V2
still passed (4,590 == 4,590) but the apply's V2 *failed* (4,602 ≠ 4,590) — only
the apply's CN-keyed gather exposed invariant #2.

> After ANY change to the planner, re-run `apply.py` in **dry mode against the
> real files** (no `--commit`) and confirm all four apply gates PASS, not just the
> dry-run's. The two scripts validate the plan along different axes.

## Why these are gate-shaped, not review-shaped

All three were invisible to careful code-reading and surfaced via:
- a deterministic **post-pass count** (id↔SUBJ4 mismatches; CN-in->1-piece), and
- the **apply's own V2/V3 gates** run on real data.

Bake the invariant as a gate or a one-line count assertion, then a sub-agent build
(or a future-you) can't merge past it. The validation oracle — ground-truth counts
+ the gates + the product owner's annotated examples — is what makes a heavy
sub-agent-built re-mint reviewable at all.

## Reuse

Any future re-mint that splits or re-keys minted identities (the SUBJ4-curation→CCR
cascade, a `CourseControlNumber` re-mint, a credential rename that ripples into
`course_id`) should carry all three checks. They generalize beyond the over-merge
case that produced them.
