---
title: Filter live-derived counts against a current-catalog snapshot to drop retired identifiers
created: 2026-07-14
updated: 2026-07-14
tags: [methodology, cpl-pathways, data-quality, coci, live-derived, fail-open]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_pathways_lessons]]"
  - "[[methodology-live-derived-pathway-checkoffs]]"
artifacts:
  - kb/_build_coci_lookup.py
  - cpl_pathways.js
  - cpl_coci_course_keys.js
---

# Filter live-derived counts against a current-catalog snapshot to drop retired identifiers

> **One-sentence summary** — when a count is derived live from a source that keeps
> *retired identifiers alive* (old course numbers, renamed keys), it inflates;
> filter it against a **current-catalog snapshot**, keyed **precisely**, and
> **fail-open per entity** so you can only ever remove a confirmably-stale record.

## Context

The CPL Pathways directory derives each baccalaureate's ✓ CPL course count *live*
from the MAP articulation dataset (CER). Santa Ana's Automotive card read **31
courses** when the truth is **~18 credentials**: the MAP platform retains
*retired/renumbered* articulations (`AT 106`, `AUTO 53`, `AUTO A1`) beside the
current numbers (`AUTO 118`, `AUTO 115`), so every ASE competency was articulated
two or three times. The credential mapping was correct — the **course link was
stale**. (Full story: `cpl_pathways_lessons.md`, 2026-07-14.)

## The claim

**A live count is only as clean as the source's willingness to forget.** MAP
never deletes a historical articulation, so "count the distinct courses
articulated" over-counts by however many retired twins exist. The fix is not to
edit the live data — it's to intersect it with a **snapshot of what still
exists**:

1. **Snapshot the current catalog.** Here: the current MAP course list
   (`coci_course_list.xlsx` → the compact `cpl_coci_course_keys.js` sidecar).
   A record present in the catalog is current; one absent is retired.
2. **Key it precisely — match the grain of the real-world entity.** Course
   identity is **(college, subject, normalized number)**, *not* subject alone.
   Every stale Santa Ana course shares its SUBJ with a current one elsewhere, so
   a subject-only test would keep all of them. College-scoped drops exactly the
   19 stale ones. Get the normalization identical on both sides (here `normNum`:
   `"118" → "118.00"`, `"40.5" → "40.50"`) or every lookup misses.
3. **Fail-open per entity.** Remove a record **only** when its entity IS in the
   snapshot and the record is absent. No snapshot loaded, or the college not in
   it → **keep**. This makes the filter monotone-safe: it can subtract a
   confirmably-stale record but can *never* drop a valid one — the worst case is
   a no-op, never a wrong deletion.

## Why fail-open is the load-bearing property

It also answers the "is the snapshot itself clean?" objection. Sam asked whether
the course export included inactive/draft rows (it has no status column to check).
It didn't matter: because the filter only ever removes records *absent* from the
snapshot, and an active record is always *present*, the filter cannot drop an
active course under any snapshot-purity scenario. If some inactive rows had leaked
into the snapshot, they'd merely survive the filter — never cause a false drop.
That property let us proceed on a status-less export with confidence.

## How we got here

Before writing any consumer code, the join was reproduced offline in Python
against the real data (31 → 12 for Santa Ana), which both **validated the finding**
and **proved college-scoped beats subject-only**. Then the filter went into the
consumer (`resolveDirectory`), the snapshot into the generator that already builds
the sibling lookup (so they can't drift), and the result was checked in real
Chromium (✓ 12 courses, all current `AUTO`, zero `AT`).

## Scope boundary — filter counts, keep opportunity menus inclusive

Only the **count** was filtered (the home college's ✓ list). The ⊕ adoption
**pool** stays inclusive: a peer's recognized competency is still adoptable even
if its local course number has rolled, and filtering an opportunity menu against a
possibly-lagging snapshot risks hiding something real. Rule of thumb: **filter
what you're asserting is true today; stay inclusive about what's merely possible.**

## Reusable beyond this tab

The same intersection is the **root fix** for a systemwide *stale-articulation
data-quality signal* in the CER/CCR generator: flag any articulation whose
`(college, subj, num)` is absent from the current catalog. That would tighten
every count in the platform, not just this tab — and the all-college
`CPL_COCI_COURSE_KEYS` set is the join it needs.
