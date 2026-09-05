---
title: A generator committed behind its output is a trap, not a convenience
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, generators, provenance, decision-sheet, memory]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_memory_tab_lessons]]"
  - "[[docs/kb-notes/playbook-decision-sheet-replies]]"
artifacts:
  - kb/memory_audit/2026-09-05-sheet_builder.py
  - kb/_decision_sheet_replies.py
---

# A generator committed behind its output is a trap, not a convenience

> **One-sentence summary** — "Change the generator, not the output" only holds while the committed generator can reproduce the committed output; when it cannot, re-running it regresses the output, and the safe change is an idempotent pass over the output, with the mismatch written where the next reader will look.

## Context

Rule 1 of this repo says to change the generator, never the generated file.
On 2026-09-05 a session set out to add reply chips to a decision sheet by
editing its builder, and found that the committed builder could not produce
the committed sheet: the sheet carried an item and a section order the
builder never emits, and the builder's input export was not in the repo. The
previous session had evolved the builder in-session and committed an earlier
version.

## The claim

- **The tell is content the generator cannot produce.** Before editing a
  generator, look for one string in the output that the generator does not
  contain (here, the heading of item 2). If it is absent from the generator,
  the generator lags the output, and running it is a regression.
- **The safe change is a pass over the output**, guarded by markers so it is
  idempotent — the same shape as the CSS-injection guard in
  `excel_to_dashboard.py` (Rule 2). The pass is a generator too, just one
  whose input is the finished file.
- **Say it where the next session will look**: in the generator's own
  docstring, in the lane file, and in the note that names the pass. A stale
  generator with no warning is a trap set for whoever reads Rule 1 next.
- **Prevent it at the commit**: a generator and the output it produced belong
  in the same PR, and a generator that reads a file the repo does not hold
  (an export, a scratch JSON) should either commit a slim copy of that input
  or say in its header that it is not re-runnable.

## How we got here

`kb/memory_audit/2026-09-05-sheet_builder.py` (committed with #1480) versus
`docs/visuals/2026-09-05-memory-audit-verdicts.html`: `grep -c "Still true as
written"` returns 0 for the builder and 1 for the sheet. The reply controls
landed through `kb/_decision_sheet_replies.py --inject`, run twice to prove the
second pass changes nothing.

## When this applies (and when it doesn't)

Any committed artifact with a committed generator: dashboards, sheets, seeds,
built pages. It does not apply to artifacts regenerated on a schedule from
live inputs (the daily dashboard): those are reproduced every day, and a lag
shows up as the next run's diff rather than as a trap.

## See also

- `[[docs/cobi_memory_tab_lessons]]` — the 2026-09-05 section
- `CLAUDE.md` Critical Rules 1 and 2 — the doctrine this qualifies

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
