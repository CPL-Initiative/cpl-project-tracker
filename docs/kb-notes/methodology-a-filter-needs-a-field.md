---
title: A filter needs a field — prose is not a facet
created: 2026-08-18
kb-status: published
tags: [methodology, data-model, filters, search, provenance, gr]
obsidian-folder: cpl-project-tracker
artifacts:
  - gr_priorities.js
  - kb/supabase_gr_register.sql
  - tests/gr_priorities.test.js
related:
  - "[[docs/gr_register_lessons]]"
  - "[[docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what]]"
---

# A filter needs a field — prose is not a facet

## The ask that cannot be built

Sam asked for "Title 5 and CA Ed Code section dropdown filters" on the GR tab.
It reads like a UI task. It is not buildable as one: **§55050 existed only inside
sentences.** There was no citation field anywhere in the data — not on the 16
priorities on screen, not in the export. A dropdown had nothing to read.

This is the general shape. *Filter*, *facet*, *drop-down*, *group by*, *sort by*
and *count of* are all the same request: **make this attribute addressable.** If
the attribute is currently a substring of a paragraph, the work is a schema
change and a backfill, and the UI is the last and smallest part.

Say so early. "Add a section filter" sounds like an afternoon; "sections aren't
data yet" is the actual estimate, and it is the difference between a demo that
works and one that quietly filters nothing.

## Extracting the field is the easy half. Labelling it is the hard half.

Backfilling 16 rows from prose took one regex. The trap was the classifier.

The sections in play looked like they fell into two buckets — Title 5 and
Education Code — and the obvious rule is *`5xxxx` is Title 5, everything else is
Ed. Code*. Applied to this corpus that rule is **wrong on §11342.2**, which is
**Government Code**: the Administrative Procedure Act's definition of what even
counts as a "regulation". Filed under Ed. Code it would have been a fabricated
citation, displayed as a fact, in a tool being shown to lawyers.

Two rules follow, and they generalise past citations to any parsed field:

1. **Assign by explicit membership, never by `else`.** Each code gets its own
   range test; anything matching none of them is left *unassigned* rather than
   swept into the largest bucket. A residual category defined as "whatever is
   left" will silently absorb the cases you did not know existed — and those are
   exactly the ones worth seeing.
2. **A derived value is labelled as derived.** The backfilled citations carry
   `citations_derived` and render with a dashed border and a "extracted from the
   text — not curator-confirmed" title, until a human edits the row. This is the
   same discipline as the TOP-code caveat and the `curator-set` contact chips:
   *display it, but never let a machine inference wear the costume of a curated
   fact.* The stakes scale with the audience — a wrong TOP code costs a curator
   five minutes, a wrong statutory citation in front of General Counsel costs the
   tool its credibility.

## Build the picklist from what exists, not from what could exist

The section dropdowns are populated from the citations actually stored in the
current area. A code with nothing cited gets **no dropdown at all** rather than
an empty one.

An empty filter control is a small lie: it says "this dimension is available and
you have nothing in it", when the truth is "nothing here has been classified on
this dimension yet". The first sends someone looking for missing records; the
second tells them the field needs populating. Same pixels, opposite diagnosis.

## The payoff is not the filter

Once the attribute is a field, things that were impossible become one query. The
GR register's structured citations immediately yielded a **cross-area section
index** — sections that two different priority areas both propose to amend —
which is the single feature that makes the register worth more than the folder
of Word documents it replaces, and which no amount of full-text search over the
same prose could ever have produced.

**A filter is rarely the point. Making the attribute addressable is the point;
the filter is just the first thing you notice you can now do.**
