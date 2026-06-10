---
title: Consolidating near-duplicate course identities within one credential (the ordinal rule)
created: 2026-06-04
updated: 2026-06-04
tags: [methodology, cer, consolidation, credential-reference, m-id, course-identity, display-grouping]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/eacr_consolidation_lessons.md]]"
  - "[[docs/kb-notes/eacr-consolidation-scope.md]]"
artifacts:
  - excel_to_dashboard.py (export_credential_reference()._consolidate_arts + module-level _fam_key)
  - excel_to_dashboard.py (export_unified_courses() co-articulation family pass → unified_courses_suggestions.js)
  - credential_reference.js (the "⛓ N variants" badge in mkArtRow)
  - unified_courses.js (worklist family _kind)
  - tests/cer_consolidation.test.js
  - tests/uc_family_merges.test.js
---

# Consolidating near-duplicate course identities within one credential (the ordinal rule)

> **One-sentence summary** — to collapse "the same course minted as N
> single-college M-IDs" into one row at *display* time, group by a course-FAMILY
> key that strips format words but keeps level information — with the key rule
> that the ordinal **"1"/"I" is non-distinguishing** (a bare title equals its
> "I") while **"2"+/"II"+ are kept**, so genuine sequences (Calculus I≠II) never
> fold.

## Context — why the worklist's signature isn't enough

A credential like **EMT Certification** articulates to the same underlying
course minted as ~12 separate single-college M-IDs whose titles differ only by
level/format wording: *"Emergency Medical Technician" / "EMT Academy" / "EMT
(Basic)" / "EMT I" / "EMT Training" / "EMERGENCY MEDICAL TECH"*. The CER (and the
EACR) render one row per raw `course_id`, so the card sprawls to 29 rows for ~12
real courses (Sam's screenshot review, 2026-06-04).

Two upstream facts make this unavoidable without a new layer:
1. The **CCR Suggested-merges worklist** groups by a deliberately *level-SAFE*
   title signature (`_sug_sig`: parens stripped, articles dropped, tokens
   sorted) that keeps "Tech I" ≠ "Tech II" — by design it **won't** merge these,
   to avoid over-merging sequences. So it surfaces ~26 buckets for the 29.
2. `coci_articulations.json` is a **static raw-M-ID artifact** (not regenerated
   daily; the seed doesn't fold curation `merge_into`). So curator merges in the
   worklist **don't collapse the CER view** until a re-key.

Result: a "CER view + worklist" split (Sam's call) — **collapse the view now**
(this note), **queue the durable identity merges in the worklist** (separate).

## The heuristic — a course-FAMILY key, scoped within one credential

In `export_credential_reference()`, after the per-`course_id` rows are built,
`_consolidate_arts()` folds same-family **M-ID/Unified** entries into one row.
`_fam_key(title)`:

1. strip parentheticals + punctuation; expand `EMT`→"emergency medical
   technician", `Tech`→"technician";
2. drop FORMAT words (`basic`, `training`, `academy`, `preparation`,
   `certificate`, `course`, `application`, `module`, `part`, …), articles, and
   bare single **letters** (section markers "A"/"B") — **but keep single
   digits**;
3. **the ordinal rule:** roman→digit; then `"1"`/`"I"` is **dropped**
   (non-distinguishing — a bare title is the same course as its "I"); `"2"`–`"9"`
   (and `"II"`–`"IX"`) are **kept** as distinguishing tokens; multi-digit numbers
   (≥10) are course numbers → dropped;
4. the family key = the sorted set of the surviving tokens.

Whatever survives is the *distinguishing concept*, so **Lab / Clinical /
Refresher / First-Responder / Intro-to-EMS / National-Registry** keep their
component word and stay separate, while the EMT-Basic core collapses to one row.

## The four traps (each one cost a debug cycle — guard them)

- **Removing ordinals over-merges SEQUENCES.** Blindly dropping "I/II/1/2"
  folded Calculus I+II, Spanish 1+2, Paramedic 1/2/3/4, Barbering 1+2. The
  ordinal rule (drop 1/I, keep 2+/II+) is the fix: "X" == "X I" (almost always
  the same/only course) but "X" ≠ "X II" (a real second course).
- **A `len(w) <= 1` guard meant for section letters also eats single-digit
  ordinals.** `"2"` has length 1, so the "drop bare letters A/B" check silently
  dropped every `"2"`–`"9"` before the digit logic ran → Calculus 2 merged with
  Calculus. Fix: `len(w) == 1 and not w.isdigit()`.
- **The same guard eats single-letter LANGUAGE/CONTENT tokens (found Session
  39).** In computing titles the single letter IS the course: `R Programming`
  and `C# Programming` both reduce to bare `programming` (`R` dropped as a
  "section letter"; `C#` → `c` → dropped) — a false fold the KINE/FLSP domain
  never triggers (its single-letter drops are possessive-`'s` artifacts). Any
  fold over computing subjects (CISC etc.) must refuse to merge a pair whose
  RAW titles differ in single-letter tokens. See
  `docs/cis_cs_convergence_scope.md` §3.
- **C-ID/CCN anchors have blank titles → a family key would be unreliable.**
  They're authoritative + one-per-course anyway, so **exclude them from folding**
  (only `M-ID`/`Unified` surrogates fold; anchors are always their own row).
  This also dodges the order-dependent "first local course" fallback.

## Validation pattern — audit every merge for a shared substantive word

Before shipping a global grouping heuristic, **audit it**: for every merged
group, take the set-intersection of the members' title words (minus
`{1, i, and, of, the, …}`); a group that shares **no** substantive word is a
suspect merge. Here: **0 of 72** merged groups were suspect. Pair it with an
idempotency check (regen twice → only the timestamp differs) and a `<25`-rows
assertion on the motivating card.

## When this applies (and when it doesn't)

- **Applies** to *display* consolidation of identities that already share a
  parent grouping (one credential, one discipline) and are recomputed from raw
  every run — reversible by code revert, no identity mutation. The members ride
  in a `members[]` list + the `⛓ N variants` badge tooltip, so nothing is lost.
- **Does NOT apply** as a substitute for the **durable** identity merge — that's
  the worklist → `merge_into` → (eventually) a `coci_articulations.json` re-key,
  which propagates to CCR/EACR/audits. This note is the *view*; that is the
  *data*. Keep them as two steps.
- **Reuse target:** the EACR's per-college credit-rec list has the same
  fragmentation; `_fam_key` is the natural grouping key there too.

## The durable side — applying `_fam_key` globally needs a SECOND gate (#310)

The view fold (above) is scoped *within one credential's card*, so `_fam_key`
alone is safe there. The **worklist** (the durable merge that writes `merge_into`)
runs over the *whole* identity space, where `_fam_key` alone would **over-merge
globally** — every "Welding" M-ID statewide, etc. `export_unified_courses()`'s
co-articulation family pass adds **two gates** that make it tight (29 groups, not
hundreds):

1. **Co-articulation gate** — two identities group only when they **share a
   credential** in `coci_articulations.json`. Co-articulating to the same
   credential is strong evidence they're the same course; it's the signal the
   level-safe worklist signature can't see.
2. **Subject-prefix (SUBJ4) gate** — group by `(M-ID subject prefix, _fam_key)`,
   not `_fam_key` alone. Per the M-ID invariant *one discipline ⇒ one SUBJ4*, this
   keeps a generic title from folding **across disciplines**. A first run without
   it surfaced `AUTO + AVIA` under one ASE cert (an automotive cert an aviation
   M-ID happened to articulate to); the prefix gate dropped it. Conservative on
   purpose — a worklist over-surfacing a bad merge is worse than missing a
   cross-SUBJ4 one (curators can still Unify those by hand).

Other reusable bits of the worklist side: **lead the member list with the
cleanest-title identity** (fewest tokens) so the default merge target is the
canonical name (`EMST M1064 "Emergency Medical Technician"`, not
"…Basic Training Application"); **factor `_fam_key` to module scope** so the view
and the worklist share one key (CER output stays byte-identical); and the merge
**never auto-applies** — it only surfaces for the curator's Confirm.

**The boundary that remains:** even after a curator confirms, `merge_into`
propagates to the CCR + auditor but **not** to the static `coci_articulations.json`
(so the EACR/CER articulation *views* don't re-collapse beyond the display fold)
until a **Rule-7 re-key**. View = display; worklist = identity layer; re-key =
articulation layer. Three steps, not one.

---

*Authoring check: durable (the ordinal rule + the two traps recur on any
title-family grouping), reusable (EACR credit-recs next), distilled (one
heuristic), self-contained (a stranger can re-implement from this).*
