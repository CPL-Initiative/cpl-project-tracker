---
title: "A value can exist in the repo and never reach the payload — two minting paths, one inference pipeline"
created: 2026-09-08
updated: 2026-09-08
tags: [methodology, ccr, discipline, data-quality, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
---

# A discipline can exist in the repo and never reach the payload

Sam, 2026-09-08, looking at SkyView's `(no discipline yet)` island: *"It has CCNs
and CIDs which should have obvious disciplines… does PSYC C1000 Introduction to
Psychology really not have the discipline of Psychology associated with it?"*

It does. `kb/reference/coci_courses.json` carries
`"discipline": "Psychology"` on `PSYC C1000`, classified 2026-05-20. The row
SkyView draws carries `"disc": null`. **The value was never missing; it was never
plumbed.**

## Two minting paths, one inference pipeline

| | M-ID | C-ID / CCN-ID |
|---|---|---|
| lands in | `kb/coci_minted_courses.json` | `kb/reference/coci_courses.json` |
| written by | the minting + consolidation pipeline | `kb/_seed_coci_courses.py` |
| discipline from | the seed, then five inference passes | its own prefix→MQ table |
| inference passes see it | **yes** | **no** |
| blank discipline | 67 / 15,937 = **0.4%** | 259 / 543 = **47.7%** |

All five inference passes (`subject_map`, `title_keyword`, `top_code`,
`top_division`, `description`) read and write `coci_minted_courses.json` — which
holds **19,568 records, every one of them M-ID**. An externally-minted identifier
is not in that file and never was, so no pass has ever run on one.

The seeder does the work correctly on its own side: `"PSYC": ("Psychology", None)`
is in its table and it fired. Then `excel_to_dashboard.py` loads
`coci_courses.json` when it builds the display payload and reads **only
`description`** from it. `discipline` is populated on 470 of 499 rows and is read
by nothing.

## What the gap costs

Of the 326 identities SkyView files under `(no discipline yet)`:

- **199 have a discipline in the reference right now** (173 C-ID, 26 CCN-ID) —
  Mathematics 17, Health 16, Fire Technology 12, Office Technologies 12, Earth
  Science 10, English 7, Political Science 5, …
- 15 are in the reference but null there (the seeder's own "needs review" prefixes)
- 112 are not in the reference at all (67 M-ID, 43 C-ID, 2 CCN-ID)

So the pile should be roughly **127, not 326** — and the official identifiers,
3.3% of the corpus, are **79% of it**.

⚠️ **TOP is not the answer here.** 219 of the 326 carry a TOP code, and under
Rule 7 that stays a last-in-line corroborator: the reference's discipline comes
from the identifier's own subject prefix against the MQ list, which is an
independent signal, not a TOP inference.

⚠️ **Checked before claiming it:** the join is identical direct and through
`kb/alias_chain.py` (199 both ways), so these ids are current-era and there is no
double-applied permutation waiting.

## The rule

**A blank in a display payload is a claim about the payload, not about the
repo.** Before recording "we don't have this", find every writer of the field and
ask whether the reader joins to all of them. Two seeders writing the same concept
into two files, with one consumer, is a gap that no amount of staring at the
consumer will reveal — the consumer is not wrong, it is *partial*.

The tell is a **rate that splits by provenance**. 0.4% blank on one id system and
47.7% on another is not a data-quality distribution; nothing about being a C-ID
makes a course harder to classify. A gap that tracks *where a row came from*
rather than *what the row is* is a plumbing gap.
