---
title: A receipt measures a worklist once; a lane recomputes it every build
created: 2026-09-04
updated: 2026-09-04
tags: [methodology, curation, worklist, receipts, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/kb-notes/methodology-land-a-re-mint-by-rehearsal-and-a-fresh-read]]"
artifacts:
  - excel_to_dashboard.py
  - unified_courses.js
  - kb/zband_retire_out/2026-09-03/duplicates.json
  - tests/legacy_anchor_duplicates_test.py
---

# A receipt measures a worklist once; a lane recomputes it every build

> **One-sentence summary** — a dry run's worklist file is a measurement at one
> moment; the queue a curator drains must be recomputed from the live state on
> every build, and where the two disagree the live state is what the tab shows
> and the disagreement is itself a finding.

## Context

The Z-band retirement dry run (2026-09-03) wrote `duplicates.json`: 130 May
2026 curated anchors whose title and discipline matched a catalog identity,
"a curator's merge worklist after the fold, not folded by it." A day later the
handoff still carried an earlier count (122), one twin had been re-keyed by
the prefix fold, and one twin's displayed discipline had been changed by a bot
cohort in July. The file was already three facts stale before anyone opened
it. See `docs/ccr_atlas_lessons.md` §2026-09-04.

## The claim

A worklist has two lives. The **receipt** is the dry run's measurement: frozen,
committed, the thing a ruling is made against and the thing an apply asserts
equality with. The **lane** is what a curator works: it must be derived from the
live catalog on every build, so that a confirmed merge leaves it, a re-keyed id
is followed to its live row, a merged-away twin resolves to its target, and a
dead id can never be offered. Ship the lane as a recomputation, never as a
render of the receipt.

Where the lane and the receipt disagree, do not reconcile them by hand. The
receipt was right about the record at its moment; the lane is right about what
the tab displays now; the row that moved between them is the finding. On
2026-09-04 that row was a bot-written discipline (`Stagecraft`, outside the MQ
list) on the twin of `THTR M1377` — a data-quality item the receipt could not
have shown and the lane surfaced by omission.

The lane's test should say this out loud: every receipt entry is offered, or
already acted on, or explained by a named live change — and the count of
explained entries is printed, not hidden.

## How we got here

`legacy_anchor_duplicate_groups()` (#1465) recomputes the anchors' duplicates
with the same strict title key and the same discipline resolution the dry run
used, but over the live catalog, the flattened `merge_into` map (Phase B and
routing folds included) and the displayed discipline. Its committed-files test
reproduces 129 of the receipt's 130 pairs, names the 130th and why, and finds
one pair the receipt lacked (`PHOT M10RG`).

## When this applies (and when it doesn't)

Any queue a human drains from a committed measurement: merge suggestions,
re-level spot-checks, re-mint candidates. It does not apply to the receipt of
an APPLY — that file is the rollback handle and must stay frozen (the
never-twice P0 of the re-mint playbook); the lane is what grows and shrinks,
the receipt is what is asserted against.

## See also

- `[[docs/ccr_atlas_lessons]]` §2026-09-04 — the worked instance
- PR `#1465` — the lane, the tab kind, the two suites
- `[[docs/kb-notes/methodology-land-a-re-mint-by-rehearsal-and-a-fresh-read]]` — the receipt side of the same distinction
