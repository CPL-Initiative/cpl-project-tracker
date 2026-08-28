---
title: College-homonym subject codes — detect, scope, retract
created: 2026-06-11
kb-status: published
tags: [methodology, kb, discipline-inference, subject-codes, data-quality, ccr, lexicon]
artifacts:
  - kb/_audit_subject_map.py (the detector + receipt kb/subject_map_audit.json)
  - kb/_infer_disciplines.py (scoped entries + retraction propagation)
  - kb/discipline_inference.json (_subject_map_notes: scoped/cleared ledger)
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 45 section)
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md (how the SUBJ4 re-key laundered the error)
---

# College-homonym subject codes — detect, scope, retract

## The failure class

**Subject codes are college-local vocabulary.** The same 2–5 letters can name
different departments at different colleges: `CADM` is Corrections
ADMinistration at Bakersfield (47 courses, TOP 21xx) and Computer-Aided
Drafting & Manufacturing at Merced (4 courses, TOP 09xx). `AP` is Art
Photography at Cabrillo and Anatomy & Physiology at Modesto. `PLS` is Plant
Science in the State Center colleges and Paralegal Studies at CCSF/Santa Rosa.

A **global** subject→discipline map entry is therefore right for the majority
college(s) and silently poisons the minority's courses. The motivating case
chain (CRIM M1003): `subject_map["CADM"] = "Administration of Justice"` →
"Introduction to 3D" (Cypress MAD 104 C + Merced CADM 10) filled as AoJ at
0.8 confidence → the canonical-SUBJ4 apply re-keyed `MAD M1003 → CRIM M1003`
— **a lexicon error laundered into an authoritative-looking identity**, parked
between police-academy courses in the CCR. (The row auditor *did* flag it —
⚠3, `top_discipline_disagreement` + `member_top_divergence` — but the
common-cause lexicon entry stayed live, poisoning every future fill.)

## The three-part fix (Session 45)

1. **Detect at the lexicon grain** — `kb/_audit_subject_map.py`. Per entry:
   each college votes with the plurality 2-digit TOP division of its own
   courses on that code, counted only when internally consistent (≥3 courses,
   ≥0.6 plurality share). Colleges disagreeing with the volume-weighted
   majority make the entry a homonym candidate. **Title evidence then grades
   each minority college** — share of its titles containing a token of the
   mapped discipline name: high overlap = "consistent" (same content,
   different TOP philosophy — Mt. SAC files art history under Humanities;
   keep), low = "foreign" (a different department; act). Found 17 candidates:
   11 true homonyms, 6 false positives. Receipt: `kb/subject_map_audit.json`.

2. **Scope, don't remove** — `subject_map` entries now take a second form:
   `{"discipline": ..., "colleges": [allowlist]}`, firing only when **every**
   college behind the row (singleton's college / M-ID's member colleges) is
   allowlisted. Flat removal would have degraded the *majority* side —
   Lassen's 118 correct Gunsmithing fills would have coarsened to "Industrial
   Technology" (division umbrella) just to fix Saddleback's 6 gender-studies
   courses. Scoping keeps the majority at 0.8 precision; the minority falls
   through to per-row evidence (TOP/description/division passes).

3. **Retraction propagation** — `kb/_infer_disciplines.py` always re-inferred
   its own fills so lexicon *refinements* propagate, but a *removed/scoped*
   entry left its stale fill behind (infer() returned None → row untouched).
   Now a prior `subject_map`/`title_keyword` fill that no longer re-derives
   is **blanked, with provenance keys dropped**, so the later passes or
   curation re-fill it. Fills owned by other passes are never touched.

## The repair pipeline (re-runnable)

```
kb/_audit_subject_map.py          # detect; grade; receipt
<edit kb/discipline_inference.json>   # scope/remove entries; record in _subject_map_notes
kb/_infer_disciplines.py          # retract stale fills + re-fill scoped majorities
kb/_infer_disciplines_from_desc.py
kb/_infer_disciplines_from_top.py # minority sides re-fill from per-row evidence
kb/_infer_disciplines_from_top_division.py
kb/_seed_canonical_subj4.py       # CSR re-seed (preserves curator-reviewed rows)
kb/_row_audit.py                  # refresh the audit overlay
kb/_audit_subject_map.py          # verify: candidates cleared, 0 suspects
```

Measured (2026-06-11): 651 fills retracted; 363 re-filled at 0.8 via scoped
entries; ~320 minority-side rows re-filled from honest per-row evidence
(Merced's "Introduction to 3D" → Drafting/CADD; LATTC/MiraCosta police
courses → Administration of Justice; Modesto's anatomy → Biological
Sciences; paralegal → Legal Assisting). Audit deltas: title-mismatch
773→712, TOP-disagreement 960→926; `subject_collision_signal` +134 (the
re-filled rows' SUBJ4s now await the next canonical re-mint — by design,
Rule 7).

## Rules to carry forward

- **A global subject→discipline entry asserts a statewide claim; validate it
  statewide.** Per-college TOP-division votes + minority-title evidence is a
  cheap, decisive validation.
- **The title-overlap heuristic under-credits abstract discipline names**
  ('Multimedia', 'Computer Information Systems') — machine grade "foreign"
  needs a human eyeball on the actual titles before acting. Curator
  clearances live in `_subject_map_notes.audit_cleared` and suppress
  re-flagging (verdict "cleared (curator)").
- **Any inference pass that re-derives its own fills must also retract
  them.** Refinements-propagate without retractions-propagate leaves removed
  entries' poison behind permanently.
- **Identity (SUBJ4) inherits discipline errors via re-keys** — fixing the
  discipline does NOT fix the key inline; the collision signal queues it for
  the next re-mint. Expect `subject_collision_signal` to grow after any
  large discipline repair.
