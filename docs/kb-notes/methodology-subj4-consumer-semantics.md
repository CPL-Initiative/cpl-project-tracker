---
title: SUBJ4-consumer semantics — umbrella allowances and alias families must be mirrored everywhere
created: 2026-06-12
kb-status: published
tags: [methodology, kb, subj4, umbrella, alias, convergence, csr, ccr, re-mint, diagnostics]
artifacts:
  - kb/_row_audit.py (UMBRELLA_DISCIPLINES — the original exemption)
  - canonical_subj4.js (UMBRELLA_EXTRA_SUBJ4 + aliasFamilyOf — the sweep + live input)
  - kb/_subj4_dryrun.py (load_umbrella_allowances — the fold allocator)
  - kb/discipline_aliases.json · kb/foreign_language_subj4.json (the shared sources)
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 47)
  - docs/kb-notes/methodology-umbrella-discipline-subj4-split.md
---

# SUBJ4-consumer semantics — umbrella allowances and alias families must be mirrored everywhere

## The rule

Two deliberate exceptions soften the "one discipline → one SUBJ4" invariant:

1. **Umbrella disciplines** span MANY SUBJ4s by design (Foreign Languages →
   per-language `FL**`; Kinesiology → `KINE` + `ATHL`).
2. **Alias families** (fan-in convergences) are ONE discipline wearing two MQ
   names (`Drama/Theater Arts` ⟵ `Theater Arts`), deliberately sharing one
   SUBJ4.

**Every consumer that reasons about SUBJ4 ownership must implement BOTH
exceptions, from the shared source files** (`kb/foreign_language_subj4.json`,
`kb/discipline_aliases.json`, and the `UMBRELLA_DISCIPLINES` mirror), or it
produces one of two failure classes:

- **Diagnostics push wrong cures.** The CSR sweep shipped without alias
  awareness, flagged the THEA-sharing alias pair as a 🔴 collision, and a
  diligent curator "cured" it by re-coding one side — which would have
  re-keyed 1,540 rows and un-converged the pair at the next fold. A false
  positive in a *checker* becomes a real regression the moment a human
  trusts it.
- **Appliers plan regressions.** The fold dry-run shipped before umbrellas
  existed and planned to fold all per-language `FL**` rows back into `FLNG`
  (silently undoing the FL split re-mint) and `ATHL` into `KINE` — which
  also burst the `M1###` 999-sequence capacity. The overflow gate caught it
  only by luck of scale; the FL fold-back would have validated clean.

## The implementation contract

- **In-allowance rows keep their OWN SUBJ4** (an `ATHL` row's "canonical" is
  `ATHL`, not the umbrella's nominal code).
- **Off-allowance rows under an umbrella are surfaced, never auto-folded**
  (`skip_umbrella_offcode`) — assigning an off-code FL course to a language
  is the umbrella's own apply's decision, not a generic allocator's.
- **Within-family code sharing is "expected", not a collision** — render it
  informationally; suppress cross-claim/in-use warnings between family
  members; validation gates that assert one-SUBJ4-per-discipline exempt
  umbrellas.
- **New convergence or umbrella decision ⇒ sweep the consumer list** (today:
  `kb/_row_audit.py`, `canonical_subj4.js`, `kb/_subj4_dryrun.py`) in the
  same PR that records the decision.

## The smell to watch for

Any new script or UI that compares `subject_4letter` against a per-discipline
canonical — or counts "owners" of a code — and does NOT import/mirror the
umbrella + alias sources is wrong by default. Write the test case with a
Foreign-Languages row, a `KINE/ATHL` row, and an alias pair before trusting
its output.
