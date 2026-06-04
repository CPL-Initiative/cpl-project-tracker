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
  - excel_to_dashboard.py (export_credential_reference()._consolidate_arts + _fam_key)
  - credential_reference.js (the "⛓ N variants" badge in mkArtRow)
  - tests/cer_consolidation.test.js
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

## The three traps (each one cost a debug cycle — guard them)

- **Removing ordinals over-merges SEQUENCES.** Blindly dropping "I/II/1/2"
  folded Calculus I+II, Spanish 1+2, Paramedic 1/2/3/4, Barbering 1+2. The
  ordinal rule (drop 1/I, keep 2+/II+) is the fix: "X" == "X I" (almost always
  the same/only course) but "X" ≠ "X II" (a real second course).
- **A `len(w) <= 1` guard meant for section letters also eats single-digit
  ordinals.** `"2"` has length 1, so the "drop bare letters A/B" check silently
  dropped every `"2"`–`"9"` before the digit logic ran → Calculus 2 merged with
  Calculus. Fix: `len(w) == 1 and not w.isdigit()`.
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

---

*Authoring check: durable (the ordinal rule + the two traps recur on any
title-family grouping), reusable (EACR credit-recs next), distilled (one
heuristic), self-contained (a stranger can re-implement from this).*
