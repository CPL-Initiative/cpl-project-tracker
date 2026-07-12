---
title: The CPL merge lens — the student-repeat test (anchored to Title 5 §55050's "similar" standard)
created: 2026-07-13
updated: 2026-07-13
tags: [glossary, doctrine, ccr, cpl, merge, title-5]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[kb/merge_doctrine]]"
  - "[[docs/ccr_convergence_lessons]]"
artifacts:
  - kb/merge_doctrine.md
  - kb/doctrine_out/2026-07-10/calibration_sitting_results.md
---

# The CPL merge lens — the student-repeat test

> **One-sentence summary** — Whether two local courses are *one* common course
> for CPL is decided by a single question: *"If a student showed up with evidence
> they'd already done it, would you make them repeat your local course under its
> local name?"* No → merge (one identity). Yes → keep separate.

## Context

The CCR (Common Course Reference) must collapse ~7,700 local course identities
into a concise crosswalk so faculty workgroups can grant Credit for Prior
Learning by *common* course name. Every merge/mint decision needs one organizing
test that a human or an AI curator can apply consistently at scale. Sam
articulated it during the 2026-07-13 calibration sitting; it is now **P-1** of
`kb/merge_doctrine.md` (v0.6).

## The claim

**The student-repeat test is the north star; every other rule serves it, and
when a sub-rule disagrees with the test, the test wins.**

- **It is about *learning*, not text or taxonomy.** Not "are the titles
  identical?" and not "same discipline code?" — *would a student with the skills
  be sent to repeat the course?*
- **It reproduces the sub-rules for free:** rungs stay split (Intermediate →
  you'd repeat Advanced); homonyms stay split (music-"keyboard" vs
  office-"keyboard" → different skills → you'd repeat); title-drift merges (same
  learning → you wouldn't repeat); **CR/NC mirrors merge** (the free noncredit
  twin *is* the Credit-by-Exam on-ramp — you'd never make them repeat it).
- **Legal foundation — CA Title 5 §55050.** The statute grants CPL for skills
  **"similar to"** the course outcomes — *not identical*. That "similar" bar is
  the window that lets faculty **err on the side of the student**, and it is why
  the staging-phase default is **merge / grant, with receipts**: under-serving a
  qualified learner is the worse error.
- **Learning-equivalence beats subject-code matching.** Same-content courses in
  *different departments* are one identity — the department is a taxonomy
  artifact the student doesn't care about (e.g. *Wellness Arts* in Family &
  Consumer Sciences ≡ *Arts for Wellness* in Interdisciplinary Studies). This is
  safe because the homonym guard survives on its own terms: different *skills*
  means the student *would* repeat, so same-word-different-skill still splits.

## How we got here

The 2026-07-13 calibration sitting walked 52 pre-decided groups (Doctrine v0.2).
The 30 non-CR/NC calls agreed 100%; the CR/NC calls looked "inverted" only
because the reviewer's labels lagged a resolved doctrine question (Q-CREDITNC →
the D-3 mirror carve-out). Asked to name the theme, Sam gave the one-sentence
lens instead — which resolved every borderline call at once and exposed that the
old "different discipline → keep separate" reflex was too rigid. Ratified into
doctrine v0.6 (PR #758). Full record:
`kb/doctrine_out/2026-07-10/calibration_sitting_results.md`.

## When this applies (and when it doesn't)

- **Applies** to any course-convergence / unified-title / credential-merge
  decision on the CCR, CSR, or CER — and to CPL policy conversations generally
  (it is the plain-language form of §55050).
- **Does not override** the hard structural guards that exist for *data
  integrity* rather than learning equivalence: official-ID formats are never
  re-keyed (C-IDs/CCN-IDs), and the M-ID SUBJ4 invariants still hold. The lens
  decides *whether two things are one course*; it does not decide *how the
  identity is keyed*.
- **Not a licence to skip receipts.** "Merge when in doubt" is paired with a
  `merge_note` on every doubt-merge so faculty validation can split back.

## See also

- `[[kb/merge_doctrine]]` — P-1 (the lens), the §55050 anchor, refinements P-1a/7a/9a/10a
- `[[docs/ccr_convergence_lessons]]` — the workstream that produced it
- PR `#758` — doctrine v0.6
- External: California Code of Regulations, Title 5 §55050 (Credit for Prior Learning)

---

*Authoring check: durable (the CPL purpose test won't change), reusable (peer
colleges + faculty + auditors apply the same question), distilled (one concept),
self-contained.*
