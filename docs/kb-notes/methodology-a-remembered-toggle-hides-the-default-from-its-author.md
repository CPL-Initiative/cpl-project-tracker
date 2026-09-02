---
title: A remembered toggle hides the default from its author
created: 2026-09-02
updated: 2026-09-02
tags: [methodology, ui, state, testing, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_lead_with_the_table.test.js
---

# A remembered toggle hides the default from its author

> **One-sentence summary** — when a page persists its open/closed state per
> browser, the person who reviews it most is the one person who never sees
> what it looks like on open, and will ask for a default the page already has.

## Context

On 2026-09-02 Sam asked for the Implementation Funding tab to *"collapse all
sections on open except the intro and college table view."* The tab already
did that: a screenshot from a fresh browser, taken before any change, showed
the introduction and the table open and every other section folded. He was
asking anyway because on his browser it was not true. The section folds had
been persisted per browser since 2026-07-28, so every section he had opened
across six weeks of review stayed open on every visit since. Story:
[`docs/cpl_funding_lessons.md`](../cpl_funding_lessons.md) §2026-09-02
(Session 221).

## The claim

A persisted UI preference splits the audience in two: first-time visitors,
who see the default, and the page's own curators, who see their accumulated
choices. The curators are the ones who review the page, file the asks and
approve the screenshots, so the default they are asked to judge is the one
state they cannot see. Their report of "it opens with everything expanded"
is accurate for their browser and false for everyone else.

Two consequences follow.

**The fix is usually a smaller memory, not a bigger default.** Remembering a
toggle across the re-renders that an edit triggers is the reason the store
existed, and that reason survives with an in-memory record for the visit. It
is the cross-visit half that produces the split, and that half is the one to
retire. When the requirement is stated as "on open", per-visit state is the
requirement.

**The guard has to seed the store.** A screenshot, a fresh jsdom window and a
default-state assertion all show the default and all pass against the
per-browser bug, because none of them carries a stored preference. The check
that distinguishes the two writes the old store first — three sections open,
the table closed — boots, and requires the default. That mutation is the only
one that can fail for the right reason.

## How we got here

The BEFORE screenshot from a fresh Chromium contradicted the ask, which is
what turned a layout change into a storage change. The fold store
(`cplfund_sections_v2`) was retired, the open-state kept in memory for the
visit, the old key removed once on load, and
`tests/cpl_funding_lead_with_the_table.test.js` seeds the retired store and
boots. Restoring the per-browser read and write fails three checks by name.

## When this applies (and when it doesn't)

It applies to any remembered view state — folds, column choices, sort order,
a selected tab — that the page's reviewers accumulate faster than its
visitors do, and especially where a rule is phrased "on open". It does not
say persistence is wrong: column preferences on the same tab stay per browser
on purpose, because there the visitor's choice is the point and no default
is being judged. The test is whether someone is being asked to approve the
default: if so, look at it from a browser with nothing stored before
believing either the ask or the page.

## See also

- [`methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads`](methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads.md)
  — the sibling failure, where what a test reads is not what a reader sees.
- [`docs/reference/lanes/implementation-funding.md`](../reference/lanes/implementation-funding.md)
  — the lane's current state.
