---
title: User-vocabulary category maps — curated JSON + anchored-pattern fallback
created: 2026-06-11
updated: 2026-06-11
tags: [methodology, categories, curation, rollups, kpi-cards, statewide-exhibits]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[statewide_kpi_lessons]]"
artifacts:
  - kb/statewide_exhibit_categories.json
  - kb/_seed_statewide_categories.py
  - excel_to_dashboard.py (_load_statewide_categories / _statewide_category)
---

# User-vocabulary category maps — curated JSON + anchored-pattern fallback

> **One-sentence summary** — when a rollup's labels belong to the USER's
> vocabulary (their webpage, their program areas), store the assignment as a
> curated JSON the user edits directly, with ordered `^`-anchorable keyword
> patterns only as drift insurance and a merge-preserving seeder so curator
> edits always win.

## Context

The Statewide Exhibits KPI card first rolled up by TOP-code discipline —
honest but too broad ("Engineering and Industrial Technologies" lumped
Welding, Construction, and Automotive). Sam's real vocabulary was the 13
program areas on map.rccd.edu/statewidecpl. Session 44 (PR #376) re-keyed the
rollup to those categories. Full story: `docs/statewide_kpi_lessons.md`.

## The claim

A display vocabulary owned by the user should be **data, not code**, with
three layers in one committed JSON:

1. **`titles{}` — exact assignments, the source of truth.** Every known key
   (exhibit title) → category, casefold-matched. Editing this file IS the
   curation interface; no code change to reassign.
2. **`patterns[]` — ordered first-match keyword rules, drift insurance
   only.** They classify items that appear AFTER the last seeding. Support a
   leading `^` to anchor at start — substring rules WILL false-positive
   eventually (`"ase "` hits "Datab**ase** ", `"cisco"` hits "San Fran**cisco**",
   bare `"emt"` is a trap; Amazon's "AWS Certified" must outrank the American
   Welding Society's "AWS D…"; CDCR/"CPOST" must outrank "POST"). Order =
   precedence; broad buckets (building trades) go LAST.
3. **`fallback` — a visible review bucket, never a silent drop.** Unmatched
   items land in e.g. "Other Statewide": shown in the rollup, sorted last,
   excluded from the headline count. The bucket's contents ARE the curator's
   review queue.

The **seeder is merge-preserving**: re-runs keep every existing `titles{}`
assignment (curator edits win) and only classify new keys; it also retains
curated entries whose item vanished from today's data (title drift ≠ lost
work). Same philosophy as `kb/discipline_inference.json`, but for *display
vocabulary* rather than machine inference — the JSON here is authoritative,
not a draft awaiting Verify.

## How we got here

PR #375 shipped the TOP-based rollup; Sam's screenshot of his webpage's
category accordion (the container's network allowlist blocked fetching the
page itself) drove the #376 re-key. All 132 statewide titles classified by
the rules, hand-verified, two honest leftovers parked in the fallback bucket
("California State Bar Membership", "HRCM 001"). The first seeder run after
adding `^` anchors silently mis-bucketed 14 titles because `classify()`
didn't yet implement the anchor convention — the committed test's
classifier-sanity block (rule-order traps as assertions) now guards exactly
that.

## When this applies (and when it doesn't)

Applies whenever a grouping's labels are owned by a human/system outside the
repo (program areas, funding priorities, a partner's taxonomy) and the keyed
universe is small enough to enumerate (~10²–10³ keys). Does NOT replace the
inference lexicons for open-ended machine classification (disciplines across
141k courses — confidence-tiered drafts a reviewer verifies), and don't use
bare-substring patterns as the primary mechanism — patterns are the safety
net, `titles{}` is the product.

## See also

- `docs/statewide_kpi_lessons.md` — Session 44 build narrative
- `kb/README.md` § "Statewide exhibit program-area categories"
- `tests/statewide_kpi_test.py` — the classifier-sanity + trap assertions
