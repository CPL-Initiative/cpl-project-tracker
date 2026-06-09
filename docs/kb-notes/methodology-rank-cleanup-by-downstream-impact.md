---
title: Methodology — Rank a cleanup queue by downstream impact, not structural leverage
created: 2026-06-09
updated: 2026-06-09
tags: [methodology, ccr, auditor, cleanup, impact, articulations, kb]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
  - "[[docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog]]"
artifacts:
  - excel_to_dashboard.py (export_unified_courses — the per-course impact rollup)
  - unified_courses.js (the columns + Cleanup-impact preset)
---

# Methodology — Rank a cleanup queue by downstream impact, not structural leverage

> **One-sentence summary** — a curation/cleanup queue should be ranked by the
> **real-world payoff the data already carries** (here: CPL eligible-units +
> students riding on an identity) — not just a structural proxy like
> "members × (1 − trust)" — and the impact usually already exists one join away.

## Context

The Trust-Card auditor ranks its cleanup queue by `members × (1 − faculty_trust)` —
"how many colleges teach it × how untrustworthy." But that buries the rows where the
most *student credit* is at stake. Sam's steer (2026-06-09): surface **Eligible
units + Students** on the CCR so cleanup is ranked by payoff. The instant it shipped
it re-ranked the queue to the Spanish/foreign-language pile-up (~12k eligible units
each, blank discipline) over the structural #1 ("Medical Terminology", 85 colleges
but ~3.9k eligible).

## The claim

- **The structural proxy and the impact metric are different — and impact is usually
  the better prioritizer** for an initiative whose currency is the downstream outcome
  (CPL student credit). A mis-disciplined course with 5,000 eligible units matters
  more than one taught at 85 colleges with little CPL flow.
- **The impact is almost always one join away from data you already have.** Don't
  fetch anything new: the CER already bakes per-credential `eligible_credits` +
  `students_served`; the articulation crosswalk already links credential→course. So
  per-course impact = sum the per-credential values over the credentials that
  articulate to the course (union consolidated ids). ~700 of 16k rows light up — the
  ones carrying real credit today, which is exactly the cleanup-worth concentration.
- **Carry the privacy posture through the join.** Summing already-`<5`-suppressed
  per-credential student counts yields a course total that is `≥5` or absent **by
  construction** — never a fresh small cell. Credit *units* aren't headcounts → no
  suppression. (Guard it anyway in the standing PII test.)
- **Make it a one-click preset, not just columns.** A login-free "Cleanup impact"
  toggle (auditor-flagged ∩ impact>0, sorted by impact desc) turns the new columns
  into an actual workflow; over-merged rows are **badged, not withheld** (for
  cleanup you *want* the high-impact over-merges front-and-center — the opposite of
  the EACR adoption-leverage withholding).

## How we got here

PR #326: `export_unified_courses` rolls the baked CER per-credential eligible/students
to each course via the existing aligned/articulation linkage; `unified_courses.js`
renders two sortable columns + the preset. The lens then drove the Foreign-Language
SUBJ4 re-mint (#327/#328) — the cleanup it pointed at.

## When this applies (and when it doesn't)

- **Applies** to any curation/cleanup queue with a measurable downstream payoff that
  the pipeline already computes elsewhere (impact, reach, revenue, risk).
- **Caveat:** the rollup is a **volume signal, not a distinct accounting** (a
  credential articulating to several courses attributes its impact to each) — fine
  for *prioritization*, not for a headcount total.
- **Don't drop the structural metric** — keep both; impact says "how much rides on
  it," structure says "how wrong + how widespread." The cleanup target is the
  intersection.

## See also

- `[[docs/ccr_cluster_cleanup_lessons]]` — Session 37
- `[[docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog]]` — the eligible/students source
- PR `#326` — the columns + preset

---

*Authoring check: durable (impact-ranking outlives this queue), reusable (any
curation surface), distilled (one concept: rank by downstream payoff you already
have), self-contained.*
