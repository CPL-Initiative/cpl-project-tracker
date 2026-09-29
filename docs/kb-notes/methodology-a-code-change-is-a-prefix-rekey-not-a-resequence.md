---
title: A code change is a prefix re-key that keeps the number, not a re-sequence
created: 2026-09-03
updated: 2026-09-03
tags: [methodology, remint, rule-7, subj4, identity, allocator, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/kb-notes/methodology-alias-map-resolution-semantics]]"
artifacts:
  - kb/_authority_recode_dryrun.py
  - kb/_zband_retire_dryrun.py
  - kb/_subj4_dryrun.py
  - kb/_pols_remint.py
  - kb/authority_recode_out/2026-09-03/report.md
---

# A code change is a prefix re-key that keeps the number, not a re-sequence

> **One-sentence summary** — when a ruling changes a subject code, re-key the
> prefix and keep every number; the allocator that numbers a bucket from scratch
> is a different tool, and running it for a rename renumbers the whole catalog.

## Context

Sam ruled eleven Common SUBJ changes on 2026-09-03 (THEA to THTR, ECED to CDEV,
the language codes, the agriculture families). The repo already had a fold
allocator, `kb/_subj4_dryrun.py`, which had applied the June canonical fold, so
the obvious move was to point it at a seed carrying the new codes. Measured
first, with the seed exactly as committed, it would have moved 62,638 of 70,946
ids to change nothing.

## The claim

Two allocators exist and they answer different questions.

**The re-sequencer** (`kb/_subj4_dryrun.py`) assigns every row in a bucket a
number by title order. It is right when a bucket is being created or merged,
because "which number" has no prior answer. It is wrong for a rename, because
every row already has a number and the title order has moved since June (the
title-normalization passes changed the sort keys), so the allocator's fixpoint
is no longer the catalog. A `no_change` fate in that tool still means a new
number.

**The prefix re-key** (`kb/_pols_remint.py`, the FL split, and now
`kb/_authority_recode_dryrun.py`) changes the letters and keeps the number:
`THEA M1001` becomes `THTR M1001`. It gap-fills only where the new key is
already taken, and it moves the whole namespace, Z ids included, because a
curation pointer that still reads the old prefix is an orphan.

Three rules make the prefix re-key safe:

1. **Two passes.** Let every row that can keep its number keep it first; then
   gap-fill the rest. In one pass a taken key makes its row take the next
   number, which is the next row's number, and the displacement runs to the end
   of the bucket. Measured: one stray under COMP shifted 554 Computer Science
   ids before the second pass existed.
2. **The collision surface is every key that exists**, not the rows a view
   shows. A merged-away member keeps its id forever because curation rows point
   at it; the export hides it. Z ids in the same buckets as M ids started at 1
   too, so 3,836 of 4,053 Z numbers were already M numbers.
3. **A key that exists only in the articulation identities map is a ghost**,
   not an occupant. The June fold re-keyed the catalogs and never that map, so
   its old keys describe pre-fold occupants. A recode that lands on one heals
   it; counting it as taken gap-fills a row for nothing.

## How we got here

The 2026-09-03 baseline run of the re-sequencer (alias map into the scratchpad,
62,638 moves, all fate `no_change` but 148) turned the fold plan into a rename
plan. The first recode run then reproduced both failures a re-key can have
(the cascade and the ghosts); `tests/authority_recode_dryrun_test.py` pins each
on a fixture. The Z-band retirement measured the collision surface the same
day and gap-fills by design.

## When this applies (and when it doesn't)

Any identifier scheme where the number is stable and the prefix carries a
classification: subject codes, org prefixes, band digits. It does not apply
when a bucket is genuinely being renumbered (a first mint, or a fold where the
old numbers were never stable), which is what the re-sequencer is for, and the
receipt must say which tool ran.

## See also

- [[docs/coursecontrolnumber_remint]] — the playbook (dry run, alias map, atomic
  land, `kb/promotions.json` re-key).
- [[docs/kb-notes/methodology-alias-map-resolution-semantics]] — why a receipt is
  a permutation, applied once, never walked.
