---
title: Group an audit by the decision, not by the symptom
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, a11y, tooling, dark-mode, quality]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-the-number-of-findings-is-not-the-number-of-problems]]"
  - "[[docs/reference/lanes/cobi-dark-mode]]"
artifacts:
  - scripts/a11y.js
  - scripts/a11y_triage.js
  - .claude/commands/a11y-pass.md
---

# Group an audit by the decision, not by the symptom

> **One-sentence summary** — An audit report's grouping key should be the thing a
> human would change, and when it is not, the biggest problem sorts to the bottom
> looking like many small ones.

## Context

`scripts/a11y_triage.js` exists because *the number of findings is not the number
of problems* — COBI's first dark sweep was 511 findings that were ~227
occurrences of six shared selectors. It collapsed those correctly. Yet on the
2026-09-09 remainder it still buried the largest fault, for a reason its own
header had already named and then not acted on.

## What happened

The tool grouped by **selector** and ranked by **route count**. The largest single
dark fault was one color — dark-mode ink on a hard-coded white ground — appearing
**25 times across 11 routes on 12 different selectors, one route each**. Every
one printed as `one route — that tab's own CSS`, at the BOTTOM of the list, below
faults a tenth its size.

The header of that very section read: *"A ratio repeated exactly across routes is
ONE color, not many."* The insight was present and applied along the **route**
axis only. Nothing looked across selectors.

⭐ **And a ratio without its two colors is not actionable.** `scripts/a11y.js`
computed the composited background — `worstBg`, sitting right there in the loop —
and never put it on the finding. A report said `1.21:1` on `h3` and left the
reader to guess which of forty greys that was.

## The fix, and the size of it

Record `fg`/`bg` on every finding, print `#FG on #BG`, and group by the pair:

    193 "distinct causes"  →  a handful of color decisions

The remediation stopped being selector-chasing and became roughly ten judgments,
each with a provable answer. Dark contrast findings went **184 → 120** in one
session, every step measured.

## The general rule

Ask: **what is the smallest edit that removes this finding?** Group by *that*.

- A CSS contrast fault → the **color pair**, not the selector that wears it.
- A target-size fault → the **element the engine measures**, not the label around it.
- A glyph finding → the **owner** (ours vs a generator's), because Rule 1 decides
  which file you may touch.
- A test failure → the **assertion's subject**, not the file it lives in.

## Two supporting habits

**Keep the old format parsing.** The triage regex takes the color pair as
*optional*, so reports saved before the change still parse. A triage that
silently matches nothing is worse than one that says less — and a parser that
hard-fails on last week's report is how a tool quietly stops being run.

**The coarse count is not the steering signal.** Failing *routes* sat at 26 dark
and 18 light through the entire S245 run while findings fell 184 → 120, because
a route fails on any single finding. Report the coarse number; steer by the fine
one.
