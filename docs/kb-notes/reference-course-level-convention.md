---
title: Common-Course level convention (L1/L2/L3)
date: 2026-06-25
kb-status: published
kb-type: reference
tags: [ccr, levels, course-identity, cpl, title-5, convention, curation]
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - unified_courses.js   # courseBands() + the Level 1/2/3 band filter/chip
related:
  - "[[docs/ccr_merge_workspace_lessons]]"
  - "[[docs/kb-notes/reference-adt-acceptance-rules]]"
---

# Common-Course level convention (L1 / L2 / L3)

A Common Course Reference (CCR) that supports **consistent CPL opportunities across the
system** needs a consistent way to read the *level* a course title represents. Title 5
**§55050** authorizes faculty to award CPL for skills "**similar**" to a course's outcomes —
so the CCR groups by *common course at a level*, not by a college's exact catalog wording. This
note is the convention the CCR uses (Sam, Session 72).

## The three levels

| Level | Title terms that map here |
|---|---|
| **L1** | Introduction · Introductory · Elementary · Beginning · Basic · Fundamentals · Foundations · **First** (Semester) · Roman **I** · number **1** · range **1-2** (long sequences) · **any title with no level qualifier** |
| **L2** | Intermediate · **Second** (Semester) · Roman **II** · number **2** · range **3-4** (long sequences) |
| **L3** | Advanced · **Third** (Semester) · Roman **III** (and IV) · number **3+** · range **5-6** (long sequences) |

**Long sequences pack by pairs.** A discipline that runs a long ladder (the classic case is
ESL, and many foreign-language sequences) compresses to three levels by pairs: **1-2 → L1 ·
3-4 → L2 · 5-6 → L3**. Where the title carries the **explicit range** ("Algebra 1-2",
"ESL 3-4") the convention reads it directly.

## The one ambiguity — bare single numbers are a HINT

A bare single number can't reveal its sequence length: **"Spanish 3"** is **L2** in a six-part
ladder but **L3** in a three-part (I/II/III) one — same title, two different levels. We can't
know which from one title.

So the classifier is **best-effort, curator-overridable** — never a hard auto-merge/split:

1. **Explicit words + Roman ordinals + "First/Second/Third Semester"** classify reliably.
2. **Explicit ranges** (`1-2` / `3-4` / `5-6`) read directly to L1/L2/L3.
3. A **bare single number** is a HINT only: `1 → L1`, `2 → L2`, `3+ → L3`. The curator
   overrides it where a long sequence actually packs by pairs.

Bare numbers are read **only as whole single-digit tokens**, so `CS6` / `2D` / `Math 56`
(a course *number*, not a level) don't misread.

## Where it shows up (implementation)

`courseBands(title)` in `unified_courses.js` returns `{ level: "beg"|"int"|"adv", lab, wkexp }`
— the internal keys stay `beg/int/adv` (= L1/L2/L3) to avoid churn; the **UI relabels them
Level 1 / 2 / 3**:

- the **Levels filter** on the ✨ worklist and the per-row ⚇ dock (`L1 · L2 · L3 · Lab · WkExp`)
  — walk the queue one level at a time, or filter a single merge's candidate pool by level;
- the per-candidate-row **level chip** (`L1`/`L2`/`L3`).

`Lab` and `WkExp` are **independent format flags**, not levels — Lab / Lec / Lec-Lab are
distinct courses, so a Lab is curatable on its own and never folded into a Lec course.

The Suggested-merges **signature stays level-collapsing** (a family like "Japanese 1 / II /
Elementary Japanese" still surfaces together), so the curator **splits it into per-level common
courses** at confirm time using the Level filter + chips — the convention is **authoritative by
curation**, the classifier is the assist.

## Why not auto-assign and lock a level?

Because §55050 is about *similar outcomes*, and a single title is a lossy signal for sequence
length. Auto-locking a number-derived level would be confidently wrong on every long ladder.
The convention's value is consistency *once a human has read the course*; the classifier just
gets the curator most of the way there and stays out of the way on the ambiguous tail.
