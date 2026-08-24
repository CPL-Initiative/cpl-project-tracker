---
title: Ask whether the list can contain what you are counting
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, verification, measurement, pitfall, lint]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - kb/_build_esl_fold_preview.py
  - kb/_esl_package_apply.py
---

# Ask whether the list can contain what you are counting

> **One-sentence summary** — a derived list built for one purpose will happily
> return "nothing found" when queried for something outside that purpose, and
> that empty answer reads as a clean bill of health rather than as "never
> measured".

## Three instances, one session

| surface | reported | true | why |
|---|---|---|---|
| ESL carve-out card | "22 of 22 still standing" | **8** | read a skip list scoped to the three FOLD buckets; no carve-out id can appear in it |
| survivor strength check | Vocational and Civic pools **empty** | 116 and 35 | same list, same scoping |
| college identity lint | **0 findings** — tab said "Nothing outstanding" | 13 | the `--observed-json` input is optional; a rebuild without it publishes zero |

Different code, different authors, same shape.

## The shape

1. A list is derived for one job — "the rows this apply will write".
2. Later, something asks it a different question — "which carve-outs survived?"
3. The list cannot express the answer, so it returns nothing.
4. **Nothing looks like good news.**

The danger is entirely in step 4. A wrong number invites scrutiny; a reassuring
zero does not. That asymmetry is why this survives review.

## What actually fixes it

**Not a bigger list.** Widening the scope just moves the boundary. Three things
work:

- **Derive from the authoritative source** for each question, not from whatever
  list is nearest. The carve-out figures now come from the curation file and the
  published rows directly, and reconcile exactly with a hand trace.
- **Make the surface report what it LOST**, not what it found. "8 of 22 still
  standing · 8 curated away · 6 vanished" cannot be mistaken for intact; "22"
  can. A committed check asserts the card still says so.
- **Refuse to publish an unmeasured zero.** The identity builder now exits
  non-zero rather than overwrite a linted artifact with an unlinted one, and the
  tab renders **"not checked"** — never "Nothing outstanding".

## The check that catches it

Before trusting a count, ask one question:

> *Could the list I just read have contained the thing I am counting, if it
> existed?*

If the honest answer is "no" or "I'm not sure", the number is not a measurement.
Say **"not checked"** and mean it.

## Related

A count going UP because you started showing something is the same family of
false finding — see the Admin tab's "Not checked" rising by two the day Share
became visible.
