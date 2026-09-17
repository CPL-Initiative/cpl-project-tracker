---
title: Write the dependency-free output first
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, generators, pipeline, reliability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - kb/_build_regional_cpl_opportunity.py
---

# Write the dependency-free output first

> **One-sentence summary** — when an expensive computation writes several
> outputs and only one of them needs a third-party library, that one goes last,
> or a missing library throws away the whole run.

## The claim

Order a generator's writes by **what can fail**, not by what feels primary.

`kb/_build_regional_cpl_opportunity.py` produces four artifacts from one build:
a workbook, a screen page, a printable handout and a JSON run receipt. Only the
workbook needs `openpyxl`. It was written first, so on a machine without that
library the run raised at the first write and lost the page, the handout and the
receipt — none of which need it — after the build had already finished.

Measured here: **14 minutes of matcher work discarded**, and the output
directory created but empty, which reads as "the build produced nothing" rather
than "one writer could not load its library."

**Importable is not runnable.** An earlier fix had moved `from openpyxl import
Workbook` inside the function so the module could be imported without the
library present. That made the file importable and left the run just as fatal;
the import site moved and the failure did not. A guard that changes where an
error is raised without changing whether work survives it has not fixed
anything.

## The shape of the fix

1. Write every output that needs only the standard library.
2. Write the receipt — the thing that makes the run reproducible.
3. Attempt the dependent output last, catching `ImportError` and saying plainly
   that it was skipped and what did get written.

The run then degrades to "three of four artifacts, and here is why," which is a
usable outcome on any machine.

## ⚠ "Last" means last among the outputs that can fail, not last in the file

The first attempt at this rule put the workbook **dead last** and broke every
run. The handout is written after it and **reads the workbook off disk** to
base64-embed a download button, so moving the workbook to the end turned a
conditional `ImportError` into an unconditional `FileNotFoundError` — worse than
the bug being fixed, on every machine rather than on one.

The rule survives the correction and gains a second half:

> Order by what can fail, **then** re-check the dependencies that ordering
> created. A consumer of an output is pinned behind it regardless of which one
> is fragile.

The working order is page → receipt → workbook (guarded) → handout, and the
handout drops **only its download button** when the workbook is absent. That is
the general shape: a dependent output degrades to the part that does not need
its dependency, rather than to nothing.

Reordering writes is a change to a dependency graph. It reads like moving lines.

## When this applies (and when it doesn't)

Applies to any batch job whose compute dominates its writes — report builders,
ETL, model evaluation, anything where re-running is expensive. The longer the
build, the more the ordering matters, because the cost of the lost work scales
with it while the cost of reordering stays zero.

It does not apply when outputs are genuinely dependent on one another — if the
handout embeds a path to the workbook, the workbook must exist first. Check
whether the dependency is real, and check it **in the code** rather than from
what the output looks like: this note first recorded that the handout needed
only the workbook's *filename*, which is knowable without writing it. The
handout reads the workbook's **bytes**. The claim was written from the rendered
page, where a download button does look like a link, and the next run proved it
wrong.

It also does not apply where a missing dependency should be fatal. If the
workbook were the only deliverable anyone wanted, failing fast would be correct.
The rule is about **not letting an optional output's dependency decide the fate
of the required ones**.

## See also

- PR `#1591` — the reorder, which shipped the `FileNotFoundError`
- PR `#1594` — the corrected order, verified by a full run
- `[[docs/regional_cpl_opportunity_lessons]]` — the workstream

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
