---
title: "CER exhibit model — multi-issuer + aligned-assessment pathways (design note)"
date: 2026-07-12
tags: [cer, exhibits, issuing-agency, credit-by-exam, assessment, foreign-language, design]
kb-status: internal
related:
  - "[[docs/exhibit_unification_vision]]"
  - "[[docs/cer_v2_redesign_lessons]]"
---

# CER exhibit model — multi-issuer + aligned-assessment pathways

Captured from Sam's Unclassified-triage feedback, 2026-07-12. Four items; the
last two describe a **data-model gap** that's worth getting right before we
build, because they're facets of one underlying shape.

## The four pieces of feedback

1. **Multi-issuer add (near-term gap).** The Unclassified triage lets a curator
   add only ONE issuing agency; he needs to add **multiple**. (Multi-issuer
   machinery exists elsewhere in the CER — the `issuer_adds` fold lane + the
   `issuing_agency_additional_override` field, sessions 105/107 — so this is
   likely wiring the existing widget into the triage entry point, not new
   infrastructure. Confirm via the code investigation.)

2. **C-ID title pre-seed (near-term gap).** Many exhibits carry a reliable
   recommended **C-ID**, and its title should **pre-seed** the unified/credential
   title in triage. Today it doesn't.

3. **Aligned certificate / assessment-test name — a NEW field (future phase).**
   Exhibits are normally set up to list the **certificate** name. But some
   exhibits are **course-based** — the title is a *course* name, not a
   certificate — **most often for credit-by-exam**. These need a place to record
   the **most-aligned certificate _or_ assessment-test name**, kept **distinct
   from the issuing agency**. (Today the course name stands in for the
   credential, which loses the actual test/cert the student presents.)

4. **The Foreign-Language wrinkle (why #3 is multi-valued).** For an FL course,
   a student can earn the same credit through **several assessment pathways**:
   - a **local credit-by-exam** (issuer: the college),
   - an **AP language** result (issuer: **College Board**),
   - a **DLPT** score from the **Defense Language Institute** (issuer: **DoD / DLI**).
   One course-based exhibit ⟶ **N assessment pathways**, each with its **own
   issuer** and its **own assessment-test name** (and often its own score
   threshold / `cpl_type`).

## The underlying shape

Items 1, 3, and 4 are one model, not three features. A **course-based exhibit**
maps to a **list of aligned assessment pathways**:

```
exhibit (course-based)
  ├─ pathway: { assessment_name: "Local Credit-by-Exam",  issuer: <college>,        cpl_type, score? }
  ├─ pathway: { assessment_name: "AP Spanish Language",   issuer: "College Board",  cpl_type, score: "3+" }
  └─ pathway: { assessment_name: "DLPT (Spanish)",        issuer: "Defense Language Institute", cpl_type, score }
```

- **Multi-issuer (item 1)** is the near-term slice: it's the `issuer` column of
  that pathway list surfacing today, even before the full pathway object exists.
- **assessment-test name (item 3)** is the `assessment_name` column —
  **differentiated from `issuer`** (College Board is the issuer; "AP Spanish
  Language" is the assessment). For a plain certificate exhibit these collapse
  (the cert name is the credential); for a course-based / CBE exhibit they
  separate.
- The FL case (item 4) is the canonical N-pathway example and a good first
  test bed (SUBJ4 = the `FL**` per-language family already exists).

## Recommended sequencing

- **Now (near-term, if small):** (1) wire the existing multi-issuer add into the
  Unclassified triage; (2) pre-seed the unified title from a recommended C-ID.
- **Next phase (design + build):** the **aligned-assessment pathway** field on
  course-based exhibits — an `assessment_name` distinct from `issuer`, list-valued,
  with the FL local-CBE / AP / DLPT trio as the reference case. Likely a new
  Supabase curation field (e.g. `aligned_assessment` list) + a triage/CER editor
  row, mirroring the multi-issuer widget. Course-based vs certificate-based is
  itself a flag worth stamping (credit-by-exam exhibits are the tell).

## Open questions for Sam (future phase)
- Should the pathway's **score threshold** (AP 3+, a DLPT level) be a first-class
  field, or free-text in a note for now?
- Is "course-based vs certificate-based" a curator toggle, or inferable
  (cpl_type == credit-by-exam ⇒ course-based)?
- Do the FL pathways generalize (CLEP, IB, other DLI languages) — i.e. is there a
  reusable **assessment catalog** (College Board AP*, DLI DLPT*, CLEP*) to pick
  from rather than free-typing each?
