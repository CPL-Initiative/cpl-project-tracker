---
title: A fold carries the folded tab's rulings, not only its data
created: 2026-10-31
updated: 2026-10-31
tags: [methodology, ui, cer, eacr, rule-7, consolidation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cer_v2_redesign_lessons]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - kb/_build_exhibits_review.py
  - exhibits.js
  - tests/exhibits_review_build_test.py
---

# A fold carries the folded tab's rulings, not only its data

> **When one tab takes over what another shows, read the old tab's rulings on its fields before reading its payload. The payload holds fields the old tab chose not to show, and the new tab will show them unless someone carries the ruling across.**

## Context

Sam's Open Asks Sheet 147 (2026-10-31, card 1) folds Exhibit Adoption (EACR) into the Exhibits tab. EACR's payload,
`statewide_data.js`, carries `potential_names`: every college with a program under one of an exhibit's TOP codes or a
course carrying one of its C-IDs. On 2026-09-24 Sam ruled that list off every EACR screen and export (Rule 7: TOP is a
last-in-line signal). The tab kept the field for its Potential count and showed only the M-ID prescriptive layer
(`statewide_prescriptive.js`), which names the course a college already teaches. Lessons: `docs/cer_v2_redesign_lessons.md`,
2026-10-31 (SkyBayberry).

## The claim

**The field's presence is not permission to show it.** The Exhibits Review card read `potential_names` as its fallback
"Could adopt … from Exhibit Adoption". The mock-up's words were "else EACR's list", and EACR's visible list was the
prescriptive one. The builder took the payload's. By 2026-10-31 it put 14,669 college pairs on 269 of the 468 held
titles. The credential panel read the reference's `potential_colleges`, which is the M-ID `adoption_leverage` list without the over-merge
hold: 15,081 pairs against the 4,865 EACR names.

**Read the lane before the payload.** The folded tab's lane file states what it shows and what it refuses to show. A
build that starts from the payload inherits the data and drops the judgment.

**Test for the refusal.** The builder test now fails if any could-adopt college comes from `potential_names`. The
jsdom test fails if an older file's broad list renders.

## How we got here

The fold's first step put EACR's per-credential view into the credential panel. Measuring the panel's could-adopt list
against EACR's turned up the gap: 317 credentials disagreed. Tracing both fields to `excel_to_dashboard.py` showed the
TOP and C-ID overlap behind one and the unheld `adoption_leverage` behind the other.

## When this applies (and when it doesn't)

It applies to any consolidation: a tab folding into another, a public page taking a COBI view's figures, a report reading
a tab's payload. It does not apply when the payload was built for the new reader alone. The check is cheap: grep the old
tab's lane file and renderer for each field you are about to show.

## See also

- `docs/kb-notes/methodology-top-is-a-last-in-line-signal.md`: why the TOP overlap stays off a could-adopt claim.
- `docs/kb-notes/methodology-verify-an-ask-against-what-the-reader-sees.md`: the same lesson from the reader's side.
