---
title: Tell a parser defect from a people defect before you build a curation queue
created: 2026-08-14
updated: 2026-08-14
tags: [methodology, data-quality, curation, normalization, ingest, measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/military_cr_reference_scope]]"
  - "[[docs/common_cr_reference_scope]]"
  - "[[docs/kb-notes/methodology-a-normalisation-and-its-screens-must-see-the-same-text]]"
artifacts:
  - docs/military_cr_reference_scope.md
---

# Tell a parser defect from a people defect before you build a curation queue

> **One-sentence summary** — When one field holds many spellings of the same
> value, ask whether the variance is mixed *within* the entity that would have
> typed it: if it is, a machine made it, and a human queue is the wrong fix.

## Context

Two corpora in this project look identical at a glance: a field of free-ish text
where the same underlying thing appears under many spellings, and a stated goal
of collapsing it into a canonical vocabulary.

- The **freehand** credit-recommendation corpus — text colleges typed.
- The **ACE/military** credit-recommendation corpus — text ACE published and
  MAP ingested.

The obvious move is to point the same curation workbench at both. That is
wrong, and one measurement tells you so in about a minute.

## The diagnostic

**Group the variance by the entity that would have produced it, and ask whether
that entity is internally consistent.**

If 108 colleges each typed a title their own way, each college is *consistent
with itself* and *differs from the others*. That is a people defect, and a
curation queue is the right instrument.

If the same college holds **both** spellings, no human chose between them —
something upstream emitted both. That is a parser defect, and no amount of
curator attention fixes it, because there is no judgment to exercise.

Measured on the ACE lane (`map_college_cr_unit`, 200,840 rows):

| Casing pattern | Colleges | Rows |
|---|---:|---:|
| Never lowercase | 50 | 58,193 |
| **Mixed within the same college** | **58** | 142,647 |
| Always lowercase | **0** | 0 |

Zero colleges are internally consistent in the lowercase direction, and 58 hold
both forms. Nobody typed this. The variance travels with the **record**, not
the institution.

The corroborating figure is the proportion: typographic variants are **7.6%** of
the ACE vocabulary against **0.6%** of the freehand one — 13× more prevalent in
the corpus that supposedly came from an *authority*. A controlled vocabulary
should be *cleaner* than freehand text. When it is dirtier, the dirt was added
in transit.

## Why it matters

The two defects have opposite economics.

| | People defect | Parser defect |
|---|---|---|
| Fix | Curator judgment, once per distinct case | One code change |
| Scales with | Number of distinct variants | Nothing |
| Recurs on new data | No — decisions persist | **Yes, forever** |
| Right instrument | Curation workbench | Ingest fix |

Building a workbench for a parser defect asks humans to do a machine's job, once
per variant, and the next data load re-creates every case they cleared. In this
lane that would have been **767 hand-merges** of things like
`3 hours in supervision` into `3 hours in Supervision`.

## How to apply it

1. Pick the entity that would plausibly have authored the variance — the
   college, the user, the vendor, the upload batch.
2. Per entity, count rows matching each variant form.
3. Classify each entity: **only form A**, **only form B**, or **mixed**.
4. A large *mixed* population means the entity did not choose. Look upstream.
5. Compare the variant rate against a genuinely freehand corpus in the same
   system. An "authoritative" source that is dirtier than freehand text is
   diagnostic on its own.

## Caveats

- **Mixed is evidence, not proof.** An entity can legitimately hold both forms
  if it changed practice over time, or merged with another. Check whether the
  variance correlates with a date or a batch before concluding.
- **This does not tell you the fix is available.** MAP is read-only for us, so
  identifying a parser defect may still leave a downstream fold as the only
  reachable remedy — but it changes what you *tell the owner*, and it stops you
  charging a curator for it.
- **Not every dirty controlled vocabulary is a parser.** A genuinely
  multi-source feed may carry several publishers' conventions. The test is
  internal consistency of the *authoring* entity, not of the corpus.

## Related

- [`docs/military_cr_reference_scope.md`](../military_cr_reference_scope.md) —
  the scoping pass this came from (§2).
- [`docs/common_cr_reference_scope.md`](../common_cr_reference_scope.md) — the
  freehand lane, where a curation workbench *was* the right answer, and the
  measurement that established it.
