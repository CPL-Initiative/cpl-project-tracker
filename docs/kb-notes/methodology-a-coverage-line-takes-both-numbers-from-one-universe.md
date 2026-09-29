---
title: A coverage line takes both numbers from one universe
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, measurement, skyview, cpl, map-platform, decision-sheet]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names]]"
artifacts:
  - kb/_build_ccr_cpl.py
  - prototype/ccr_cpl.json
  - kb/ccr_cpl_funnel.json
  - tests/ccr_cpl_payload_test.py
  - tests/ccr_skyview_cpl_face.test.js
---

# A coverage line takes both numbers from one universe

> **One-sentence summary** — a sentence of the form *"N of M reach…"* is only
> true when N is a subset of M; a ruled sentence carried a numerator that was an
> identity count and a denominator from a different exhibit universe, and the
> surface has to compute the line from the data rather than quote it.

## Context

Sam's 2026-09-07 decision sheet ruled that SkyView's CPL face must say its own
coverage on the surface, and proposed the line *"1,490 of 6,388 exhibits reach a
course on this map."* He answered **yes**. Building it (S238) showed that neither
number belonged in that sentence. `docs/ccr_atlas_lessons.md` carries the round.

## The claim

**Before a ratio goes on a surface, name the universe each number was counted
in, and make sure it is the same one.** Two failures hide in a sentence that
reads perfectly well:

1. **A mislabeled numerator.** 1,490 was the count of *course identities* on the
   map that carry an articulation. The count of *exhibits* that reach the map is
   1,924. The sheet's measurement was correct; the word beside it was wrong, and
   the sentence was ruled with the wrong word.
2. **A denominator from another universe.** 6,388 is the number of exhibits in
   MAP's credit funnel (`public.map_college_cr_unit`). Only **570** of the 1,924
   exhibits that reach the map appear in it at all. The funnel is ACE-keyed
   (6,291 of its 6,388 exhibit ids are ACE exhibits, the JST military record);
   the articulation crosswalk is MAP-keyed (industry certification, credit by
   exam, standardized assessment). They are nearly disjoint exhibit universes, so
   "1,924 of 6,388" would have been a ratio of apples to oranges that happened to
   be less than one.

The honest line is *"1,924 of 5,497 articulated exhibits reach a course on this
map"*: the numerator is the crosswalk's exhibits that resolve to a point, the
denominator is the articulated-exhibit feed (`statewide_data.js`, 5,413 ids)
unioned with the crosswalk's own exhibits (84 the feed no longer carries). Both
are exhibits, both are articulations, one contains the other.

**And the surface computes it.** `prototype/ccr_cpl.json` carries the counts and
`ccr_universe.js` builds the sentence from them; the test fixture's numbers (4 of
777) are deliberately unlike the real ones, so a literal in the source fails the
suite. A ruled sentence is a ruling about the *shape* of the statement, not a
license to hard-code the figures it was drafted with.

## How we got here

The handoff and the lane both quoted "1,490 of 6,388 exhibits" as the line to
build. Measuring the committed payload before writing the builder gave 1,924
exhibits on the map against 1,490 identities with `ar` — the same two numbers
the sheet had, with the label on the wrong one. Then the intersection with the
funnel, run through the Supabase MCP with the 1,924 ids in two halves, returned
232 + 338 = 570. The two universes are documented in `kb/_build_ccr_cpl.py`'s
docstring, the funnel read is kept as a dated sidecar
(`kb/ccr_cpl_funnel.json`) for the record, and `tests/ccr_cpl_payload_test.py`
asserts that the numerator is inside the denominator and that the denominator
is never the funnel's count.

## When this applies (and when it doesn't)

- Any *"N of M"* on a rendered surface, in a decision sheet, or in a memory row:
  check that the two counts share a universe and a grain before the sentence is
  written, and prefer computing the sentence from the data file that will be
  shipped.
- It does **not** say that the funnel is wrong or that the crosswalk is
  complete. Sam's *"source the root, not the config"* still holds for measuring
  MAP's credit record; the root of *articulations* is the articulation feed, the
  root of *credit awarded* is the funnel, and a question has to be asked of the
  right root.
- A ruling drafted with a number in it is still a ruling about the design. When
  the number turns out to be mislabeled, build the ruled shape with the measured
  number and say so in the handoff; do not build the mislabeled sentence because
  it was the one answered *yes*.

## See also

- `[[docs/ccr_atlas_lessons]]` — the S238 round that measured this
- `[[docs/reference/lanes/skyview-ccr-interface]]` — the lane state and invariants
- `[[docs/kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names]]` — the companion: a figure names a payload, and this one names a universe
- Sam's decision sheet: `docs/visuals/2026-09-07-cpl-views-skills-and-curate.html`

---

*Authoring check: durable (any ratio on any surface), reusable (every lane that
states coverage), distilled (one concept: same universe), self-contained.*
