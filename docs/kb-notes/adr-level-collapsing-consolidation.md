---
title: Level-collapsing consolidation — over-merge beats under-merge for CPL
created: 2026-06-16
updated: 2026-06-16
tags: [adr, consolidation, m-id, worklist, title-5, over-merge]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[similar_course_family_scope]]"
  - "[[ccr_cluster_cleanup_lessons]]"
artifacts:
  - excel_to_dashboard.py
  - kb/_similar_family_dryrun.py
  - docs/similar_course_family_scope.md
---

# Level-collapsing consolidation — over-merge beats under-merge for CPL

> **Summary** — For CPL, the Suggested-merges worklist should group course-level
> variants ("X 1" / "X II" / "Elementary X") into ONE family rather than keep them
> apart. Under-merging fragments a credential across many M-IDs and hurts
> portability; over-merging is cheap because the curator confirms every merge.

## Context

The worklist's grouping signature (`_sug_sig` in `export_unified_courses()`) was
historically **level-SAFE**: it normalized titles but kept ordinals/levels as
distinguishing tokens, so "Japanese I" and "Japanese II" never grouped. That guard
was built defensively (don't fuse Calculus I with Calculus II — genuinely
different content, prerequisites, units).

But that defensiveness is backwards for **CPL**. **Title 5 §55050** lets a college
grant credit for prior learning *similar* to a course's objectives — so for
articulation-adoption purposes, level variants of the same skill are usually one
common course. Under-merging means a single credential fragments across many
M-IDs (CompTIA A+ → 24 M-IDs; the MUSI "voice" family → ~20 M-IDs across levels),
which complicates the crosswalk and makes CPL less portable across colleges.

## Decision (Sam, 2026-06-16)

**Make `_sug_sig` level-COLLAPSING.** Fold the level axis (level words
beginning/intermediate/advanced…, roman/word/digit ordinals, bare a–h section
letters) so same-subject level variants group into one family. "Better to
over-merge than under-merge" — merge every reasonably similar course.

The level vocabulary mirrors `_consolidation_guards` (the title-safety guard
suite's level axis) and the measure-first dry-run `kb/_similar_family_dryrun.py`.

## Why this is safe to be aggressive

**The worklist is suggestions-only.** It never auto-applies — the curator Confirms
or Skips each group, one at a time, with member units + discipline shown. So an
over-broad grouping costs nothing but a Skip; the curator is the
faculty-acceptability gate (and every merge is reversible via `merge_into` / the
cohort marker). The level-safe-vs-collapse question is therefore a *surfacing*
decision, not a data-integrity one — which is what made it safe to flip a core
grouping function on one word of go-ahead.

Contrast the dissolved auto-seeded `UC-*` clusters: those token-sorted level
collapses were **auto-applied** (no human gate), so they wrongly fused levels
silently. Same collapse logic, opposite safety — the gate is what matters.

## Consequences

- Worklist regrouped (live residual, after existing auto-merges): anchored
  229→2,665, singleton 217→2,519. ~99% of families are discipline-unanimous.
- The co-articulation family lane (`_fam_key`) is now largely subsumed (kept).
- Genuine progressions (Cosmetology 1–5, Elementary vs College Algebra) DO group
  — the curator unchecks them; units are the tell (a wide unit spread flags
  scope differences).

## What is NOT collapsed

- **Gender / sport / variant-type** words (Men's/Women's, Refresher/Lab) stay as
  distinguishing tokens — they're not levels, so the signature separates them
  naturally (plus a belt-and-suspenders gender/sport check in the dry-run).
- Ambiguous markers **high/low/upper/lower** are NOT folded ("High Voltage" /
  "High School" aren't levels).

## Deferred (a separate, higher-blast-radius knob)

The **member-join Jaccard** (the title-match threshold that decides which raw
college courses attach to an identity, currently ≥0.5) is a DIFFERENT axis — it
changes every identity's actual membership/aggregation, not just suggestions.
`kb/README.md` mandates **measuring how many member rows flip before lowering it**.
Keep it out of a "loosen the grouping" change; lower it (→~0.4) only behind its
own measured PR.
