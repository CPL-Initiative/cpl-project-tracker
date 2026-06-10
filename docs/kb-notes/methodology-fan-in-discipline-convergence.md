---
title: Fan-in discipline convergence — fold alternate names to a canonical, the mirror of the umbrella split
created: 2026-06-10
updated: 2026-06-10
tags: [methodology, remint, rule-7, discipline, subj4, convergence, alias, m-id]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kin_pe_convergence_scope]]"
  - "[[docs/kb-notes/methodology-umbrella-discipline-subj4-split]]"
  - "[[docs/kb-notes/methodology-within-credential-identity-consolidation]]"
artifacts:
  - kb/_apply_kin_pe_convergence.py
  - kb/_apply_drama_theater_convergence.py
  - kb/_apply_convergence_singletons.py
  - kb/discipline_aliases.json
---

# Fan-in discipline convergence — fold alternate names to a canonical

> **One-sentence summary** — when the MQ vocabulary carries **two discipline
> names for one converging field** (Kinesiology/Physical Education,
> Drama-Theater-Arts/Theater-Arts), fold to a **canonical name + an
> alternate-name alias** (`kb/discipline_aliases.json`) — the mirror of the
> umbrella SUBJ4 split — and apply it as a Rule-7 re-mint with five specific
> guards (below), at **both** the parent and singleton layers.

## Context

The CCR impact lens surfaced KIN/PE as the dataset's #1 discipline collision
(93 shared course-title families — the same course minted twice because two MQ
names exist for one field mid-rename). First applied 2026-06-10 (PRs #334/#335);
Drama/Theater followed the same day. Workstream record:
`docs/ccr_cluster_cleanup_lessons.md` (Session 38) +
`docs/kin_pe_convergence_scope.md`.

## The claim

**Diagnose the shape first — fan-in and fan-out are mirror images:**

| Shape | Signal | Fix |
|---|---|---|
| **Fan-OUT (umbrella)** | one MQ discipline over many distinct *enrollment subjects* (Foreign Languages → Spanish/French/…) | split SUBJ4 per subject; discipline unchanged |
| **Fan-IN (convergence)** | two MQ *names* for one converging field (PE → Kinesiology) | fold to a canonical discipline; alternate name → `discipline_aliases.json` |

Modeling a fan-in as a parent/child ("PE child under KIN") **perpetuates** the
split; an alternate-name alias **resolves** it. Never delete the losing name
from the MQ vocab (it stays a valid credential basis — use
`cross_listed_disciplines` where dual-MQ eligibility is real).

**The five apply guards:**

1. **Key the re-key on `discipline`, never `subject_4letter`.** SUBJ4 codes can
   be overloaded: `PHYS` carried 745 Physical-Education + 87 Physics rows. A
   subject-keyed re-key corrupts the bystanders; a discipline-keyed one
   *vacates* the code (bonus: `PHYS` now simply means Physics).
2. **Check the M-ID band capacity in the dry-run.** The `M<band><seq:03d>`
   scheme caps a subject at 1,000/band. Merged Kinesiology (~1,140 raw credit)
   only fit because the 88 true duplicates merged (→ 987/999). If dups don't
   close the gap, the convergence forces a numbering-scheme decision — find out
   *before* the apply.
3. **Merge only level-safe, same-credit duplicates — stricter than the
   worklist.** Use the canonical `_fam_key` (ordinal rule) **plus**
   single-letter-roman conversion *before* the bare-letter drop ("Swimming V" ≠
   "Swimming I" ≠ "Swimming") **plus** a same-band guard (noncredit never folds
   into credit). A curator-confirmed queue can tolerate a fuzzy key; an
   irreversible apply cannot. Verify **0 mismatched-family merges** post-hoc.
4. **Converge BOTH layers.** Minted parents *and* the ~56k single-college
   stand-alones carry discipline names + SUBJ4-prefixed ids; both feed the CSR
   seed, the CCR, and the worklist. A parents-only convergence leaves dead
   discipline rows in the CSR (how the gap was discovered). No merging at the
   singleton layer — that stays the worklist's curator-confirmed job.
5. **Register sanctioned multi-SUBJ4 spans in `UMBRELLA_DISCIPLINES`.** If the
   convergence carves out a sibling subject under the canonical discipline
   (Kinesiology → KINE + ATHL), the auditor's `subject_collision_signal` fires
   on every carved row (+299, exactly the ATHL parents) unless the discipline
   is registered as deliberately-spanning.

**Diff hygiene for the KB mutation:** serialize with the file's native indent
and rebuild dicts in **original key order** (re-keys replace in place). The
naive rewrite produced a 1.5M-line whole-file reshuffle; in-order rebuild got
it proportional (~23k lines for 792 re-keys + 88 merges).

## How we got here

KIN/PE (#334): measure-first dry-runs caught both the `PHYS` overload and the
band overflow that the scope doc missed; the first merge heuristic over-merged
Golf I/II/III/IV into one identity before the level-safe key fixed it (0
mismatches verified). Drama/Theater (#335) reused the machinery untouched and
surfaced the singleton gap via a stale CSR row. Receipts (rollback inverses):
`kb/kin_pe_out/`, `kb/drama_theater_out/`, `kb/convergence_singletons_out/`.

## When this applies (and when it doesn't)

- Applies when two MQ names are **genuinely one converging field** (faculty
  hold either credential; courses duplicate across the pair). Confirm with the
  shared-title-family count before scoping.
- Does NOT apply when the pair is a **real distinction wearing similar names**
  — e.g. Computer Science vs Computer Information Systems (transfer vs applied)
  or Art History vs Art. Those need case-by-case curation, not a bulk fold.
- The alternate name must remain a **valid MQ** — this converges the identity
  layer, not the credential vocabulary.

## See also

- `docs/kin_pe_convergence_scope.md` — the full scope + §8/§9 applied results
- `docs/kb-notes/methodology-umbrella-discipline-subj4-split.md` — the mirror
  (fan-out) pattern
- `docs/kb-notes/methodology-within-credential-identity-consolidation.md` — the
  ordinal rule this strengthens for irreversible applies
- PRs #334, #335 — the implementations

---

*Authoring check: durable (the MQ vocab will keep carrying converging name
pairs), reusable (next candidates already measured: Health/Health-Care-
Ancillaries, Commercial-Music/Music), distilled (one pattern, five guards),
self-contained.*
