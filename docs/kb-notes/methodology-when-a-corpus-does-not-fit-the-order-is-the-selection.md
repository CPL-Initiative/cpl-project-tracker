---
title: When a corpus does not fit, its order is the selection
created: 2026-08-26
updated: 2026-08-26
tags: [methodology, cpl-chat, memory-tab, retrieval, prompt-budget]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_memory_tab_lessons]]"
  - "[[docs/kb-notes/methodology-a-silent-input-cap-is-a-content-swap]]"
  - "[[docs/kb-notes/methodology-a-capped-list-must-never-read-as-a-census]]"
artifacts:
  - cpl_memory.js
  - tests/cpl_memory_briefing.test.js
---

# When a corpus does not fit, its order is the selection

> **One-sentence summary** — Any list you truncate to fit a model's input budget
> is being *chosen*, not merely *sequenced*, so the sort key silently becomes the
> selection policy — and the default sort key is almost never the one you would
> have chosen deliberately.

## Context

The Memory tab's Briefing panel sends the entries on screen to `cpl-chat` and
asks for a read-back. The panel is careful about disclosure: it says "Read 34 of
188" rather than implying a census, which is the lesson this repo has learned
repeatedly (`peer_total`, the EACR matrix column, the LACCD three).

What nobody had asked is **which** 34.

## The claim

The rows arrived in `updated_at` descending — the tab's own fetch order, chosen
because a curate view wants the most recently touched entry at the top. The
digest builder drops from the *end* to fit its budget. Nothing about either
decision is wrong on its own. Together they meant the briefing read the 34
**most recently edited** entries and dropped the other 154.

The measurement, on the live table:

| | |
|---|---|
| corpus budget | 17,951 chars (20,000 server cap − a 2,049-char measured envelope) |
| 188 verified entries digest to | 83,058 chars |
| entries that actually fit | **34** |
| oldest entry the model ever saw | 2026-08-05 |

So a typo fix on an entry promoted it over a standing rule nobody had needed to
touch since June. The foundations were never read — and the panel reported
exactly the same "Read 34 of 188" either way.

**Disclosure and selection are different problems.** Saying how much you read is
necessary and does not tell the reader *what* you read. When the truncation
ratio is this severe, the sort key IS the retrieval policy, and it deserves to
be authored rather than inherited.

## ⚠ The obvious fix is wrong, and only live data shows it

The natural repair is to sort by a reading ladder — ground rules, then what is
true, then what goes wrong, then what is unresolved, then what shipped, then
what is next. It is a good reading order and it was built first.

Measured against the live table, it is **worse than the recency order it
replaced**. 82 of the 188 verified rows are `procedure` or `decision`, so a
strict ladder sort spends the entire budget inside the first band: **38
decisions and zero facts, zero pitfalls, zero risks, zero milestones.** The
traps live in the bands it never reaches. A briefing that has read no pitfalls
cannot catch the misunderstanding the briefing exists to catch.

Nothing about the fixture tests said so. Every ladder assertion passed. The
defect was visible only by running the sort against the real band distribution.

## What to do instead

1. **Measure the ratio before assuming order is cosmetic.** Corpus size against
   budget — including the envelope, measured rather than estimated. At 100% fit,
   order is a reading aid. At 18%, order is the answer.
2. **Separate the two jobs: the ladder ORDERS, a proportional share SELECTS.**
   Give each row its position within its own band as a fraction,
   `(j + 0.5) / bandSize`, and sort on that fraction first, band second. Any
   prefix then holds roughly the same *fraction* of every band, so truncation
   keeps all of them represented, while inside each slice the bands still run
   down the ladder and the slices run oldest-first. Progressive on both axes.
3. **Know the guarantee you can actually make.** A band of *n* rows first
   appears at position `1/(2n)`, so at a truncation fraction *f* every band with
   `n ≥ 1/(2f)` is present — at a 20% cut, every band of **3 or more rows**. Assert
   that. "Every band, always" is a claim the arithmetic does not support for a
   one-row band, and a guard that overclaims is a guard that will be muted.
4. **Sort exactly once, at the point the consumer gets its rows.** The digest,
   the citation map and the fetch all read the same array; sorting inside any one
   of them lets the panel report having read entries it never sent.
5. **Hold an unknown category out of the share entirely and append it.** A new
   kind must not be able to take a slot from a known one.

Live result after the change: **49 entries instead of 34, and all seven kinds
present** — 12 fact, 12 procedure, 10 pitfall, 9 decision, 2 risk, 2 milestone,
2 opportunity.

## The trap that nearly shipped

The first cut of the guard asserted the ordering function in isolation. Deleting
the call from the panel — the wiring that actually applies it — still passed
**every check**. A rule written and not applied is the failure mode this repo
keeps re-learning (`a-recorded-rule-is-not-an-applied-rule`,
`a-rule-you-wrote-is-not-a-rule-you-applied`).

The guard that works drives the real panel and reads the body that was *sent*.
Both were proven by perturbation: five separate breaks, each producing a named
FAIL with the full check count still registering.

## See also

- `methodology-a-silent-input-cap-is-a-content-swap` — the same budget one level
  down, where truncation swapped the *subject* rather than the *selection*.
- `methodology-a-capped-list-must-never-read-as-a-census` — the disclosure half.
  Necessary, and not sufficient.
