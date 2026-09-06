---
title: A liveness set must be able to contain what it judges — or it condemns by construction
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, data-quality, identity, mid-lifecycle, measurement, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-alias-map-resolution-semantics]]"
  - "[[docs/kb-notes/adr-remint-approval-queue-decision-rights]]"
  - "[[docs/reference/mid_lifecycle]]"
artifacts:
  - kb/_identities_rekey_dryrun.py
  - kb/reference/coci_courses.json
  - unified_courses_data.js
  - tests/identities_rekey_test.py
---

# A liveness set must be able to contain what it judges

Before calling a stored id **dead**, ask one question about the set you are
comparing it against: *can this set contain the thing I am judging?* If it
cannot, every miss is a false positive, and the count comes out clean, confident
and wrong.

Two versions of the same mistake, both found on 2026-09-05.

## 1. A display payload is not a catalog

`unified_courses_data.js` declares `count_total: 76,008` and ships
`count_inbrowser: 16,480` — the browser gets a fraction, because fifty thousand
dots are a smear. Measure "dead ids" against it and **"not shipped to the
browser" reads as "retired."**

| read | against the payload | against the catalog |
|---|---|---|
| welding credit-recommendation ids | 19 of 70 dead (27%) | **0 of 70** |
| articulation `course_id`s | 504 of 2,319 (22%) | **175 of 2,319 (7.5%)** |

About a fourfold over-report, and it propagated: the figures reached a handoff,
a lane file and a decision sheet, and a ruling was made on them.

## 2. A catalog of one identity system cannot judge another

`kb/coci_articulations.json`'s identities map holds 2,346 entries, and **175 of
them are `identity_system: C-ID`** — keyed by the C-ID code itself (`ACCT 110`),
not by an M-ID. The re-key's liveness set was minted courses ∪ singletons, an
M-ID-only space. A C-ID can never appear in it, so every one of those 175 was
dispositioned `drop_dead` **by construction**: 172 live identities carrying 662
articulation records, one `--apply` away from deletion.

Adding `kb/reference/coci_courses.json` — the same C-ID/CCN reference the seed
builder resolves them against — took the dead remainder from **175 to 3**, and
those three are malformed keys (`AG-AB 108 108`, a doubled course number;
`NULL`). A seed-join defect, not a retirement.

## Why the gates did not catch it

All five post-state gates passed. They check that the **result** is
self-consistent — every remaining key live, counts reconciling, no dropped key
surviving — and a plan that deletes a whole identity system produces a perfectly
consistent result. **Gates check that the post-state is consistent, not that the
plan was sane.** A plan needs a different kind of check, and the cheapest one is
a human or a session reading *what* it proposes to remove rather than *how many*.

## The tells

- **Look at WHICH, not how many.** 175 dead is a number. `ACCT 110`, `AG-AB 104`,
  `ADS 140 X` is a pattern, and it is visible in four rows.
- **Watch the DIRECTION a resolution moves the count.** Resolving an old-era key
  through an alias chain *heals* it (dead falls: 1,597 → 175). Resolving a
  key that is already current *moves* it onto a live but unrelated row (dead
  rises: 44% → 50%). **If your dead count goes up when you resolve, the keys were
  already current and you are one step from a double-applied permutation.**
- **Ask whether the file is stored or rebuilt.** `kb/cr_reference_worklist.json`
  is regenerated every morning by `daily-dashboard.yml`, so it cannot go stale —
  and "fixing" its 2,006 ids would have moved 1,197 live ones off their rows.
  The writer column in `docs/reference/dependency_map.md` answers this.
- **A number inherited from a handoff is a claim, not a measurement.** Reproduce
  it before building on it. Reproducing the wrong figure *exactly* (44%) is what
  made the correction safe to assert.

## The mechanism, not the note

Written down, this is advice. What makes it fire is
`.claude/skills/consult-doctrine/` (it triggers on its own description, on
phrases like "% dead" and "stale") and `python3 kb/doctrine.py --read`, which
takes the files a session has actually opened and asks what the repo already
decided about them — before there is a diff to trigger on.

And per Sam's ruling 5 (2026-09-05): **the dead are a worklist, never a silent
drop.** Writing the removed set out with what was on it is what turned "175 dead"
into "172 of these are C-IDs and should never have been here."
