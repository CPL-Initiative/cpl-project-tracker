---
title: Small-cell suppression must survive subtraction
created: 2026-08-06
updated: 2026-08-06
tags: [methodology, privacy, ferpa, disclosure-control, funding, student-data]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/adr-funding-priority-metrics-privacy]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - funding/_build_cr_backlog.py
  - tests/funding_cr_backlog_test.py
---

# Small-cell suppression must survive subtraction

> **One-sentence summary** — hiding a cell below a threshold protects nobody if
> the same record publishes the total and every sibling; the reader recovers it
> by arithmetic, and the `null` is decoration.

## Context

FERPA-style small-cell suppression is usually implemented cell-by-cell: if a
count is below *k*, publish `null` and a `_suppressed` flag. That is the easy
half. The half that decides whether it works is **what else the record
publishes**.

## The claim

**Suppression is a property of the whole publication, not of a cell.** Before
shipping, write down every published figure and ask what a reader can solve for.

### Complementary suppression

If cells are known to sum to a published total, hiding exactly **one** of them
hides nothing:

```
total 47 | Applied null (_suppressed) | Not Applicable 6
In Process 30 | Needs Action 10 | acted 37

47 − (6 + 30 + 10) = 1        ← the hidden value, exactly
37 − (6 + 30)      = 1        ← and again, independently
```

Hide a **second** cell and the reader recovers only their *sum* — two unknowns
against one equation is genuinely underdetermined. Choose the smallest remaining
cell: it costs the least analytically. **A zero is a legitimate complement** —
hiding it adds a real unknown and breaks the "suppressed, therefore 1..k−1"
inference a reader would otherwise be entitled to draw.

### Derived figures leak their inputs

A rate is not a summary of the cells, it is another equation. If you publish
`total` and `rate = acted/total` at any useful precision, you have published
`acted`. If `backlog = total − acted`, you have published `backlog` too. Any two
of `{total, acted, backlog, rate}` give the rest.

**So some cells cannot be protected at the cell level at all** — and the honest
move is to say so, in the code, rather than add a `null` that implies protection
you are not providing.

### Protect the thin rows at the row level

When the headline metric *is* the thing you would need to hide, don't degrade
the metric — **stop publishing the row**. A unit with fewer than *k* records in
total is too thin to break out: every cell in it is small by construction and
its rate is noise. Publish its existence and nothing else.

### Keep the suppressed record's SHAPE

A suppressed row should carry **every key, all nulled** — not fewer keys. An
omitted key turns a privacy control into a downstream `KeyError`. (This is how
the first draft of the fix failed its own test: a median computed across all
rows hit a suppressed record that had dropped the key.)

## How we got here

`funding/_build_cr_backlog.py` aggregates a per-student × per-credit-recommendation
MAP export into per-college counts. It suppressed disposition cells below 5 and
flagged them — and published `total`, every sibling, and `acted`. The Allan
Hancock record above is from the 2026-08-06 build; the hidden cell was
recoverable exactly, two independent ways.

Nothing was disclosed — that artifact was a partial local build, never committed
and never wired to a page. The rule was fixed before it fed a public tab, and
before the same pattern was reused for the student-detail aggregation being
scoped alongside it.

## Consequences

- **Test the property, not the flag.** `assert cell is None` passes on a broken
  implementation. Assert that subtraction cannot pin the value.
- Threshold choice is a separate, human decision from mechanism. This builder
  uses 5; a curator may want 10. Changing it is one line — making the hiding
  actually hold is not.
- Masked source fields are not a safety net. Prefer an **explicit column
  allowlist** at read time over trusting that an upstream export blanked a name:
  a field that arrives populated in a later export is then structurally harmless
  rather than a near miss.
- Free-text fields (a `Notes` column) are the highest-risk column in any student
  export and usually have no analytical value. **Drop them at read time**, don't
  sanitise them.

## See also

- [`adr-funding-priority-metrics-privacy`](adr-funding-priority-metrics-privacy.md) — the standing privacy posture for the funding surfaces.
