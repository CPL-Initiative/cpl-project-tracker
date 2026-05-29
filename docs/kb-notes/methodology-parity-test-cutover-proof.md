---
title: Methodology — Parity test as the proof for a data-source cutover
created: 2026-05-29
updated: 2026-05-29
tags: [methodology, migration, testing, cutover, supabase, excel, parity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[excel_to_supabase_lessons]]"
  - "[[playbook-measure-first-supabase-migration]]"
artifacts:
  - kb/_test_projects_parity.py
  - excel_to_dashboard.py
---

# Methodology — Parity test as the proof for a data-source cutover

> **One-sentence summary** — When you switch a renderer from data source A
> (e.g. Excel) to data source B (e.g. Supabase), don't *reason* that the
> output is unchanged — *prove* it with a test that diffs the new path against
> the old one field-by-field and asserts the only differences are an
> explicitly-enumerated, intentional set.

## The claim

A data-source cutover is behavior-preserving **iff** the object it produces is
identical to what the old path produced, modulo a known set of intended
changes. That's a testable property, so test it:

1. Keep the **old reader callable** during the cutover (don't delete it yet).
2. Build the new path so it returns the **exact same shape** the old path did
   (same keys, same formatting helpers, same types).
3. Write a test that loads **both**, diffs every field of every record, and
   bucketizes each difference into: **hard failure** (unexplained) vs
   **expected divergence** (enumerated + justified) vs **cosmetic**
   (e.g. whitespace the downstream renderer ignores).
4. The cutover is green when there are **zero hard failures**. The expected
   divergences are documented in the test itself, so the test is also the
   spec of what the migration deliberately changes.

This flips the cutover from "I believe it's equivalent" to "the diff is
empty except for these N lines, and here's why each is fine."

## Why it beats reasoning

A scope doc / mental model of the cutover is a **hypothesis**. The parity test
is the **falsifier**. On the Phase 2 projects cutover (Session 16) the test
caught **three** things the scope doc got wrong that careful reasoning had
already missed:

- the old reader returned **49 rows, not 34** (15 hidden `D.*` KPI-helper rows
  the downstream KPI math depended on),
- a field slated for "drop" (`excel_row`) was still feeding deep-link buttons,
- the "source it from the other table" plan was **lossy** (the other table
  conflated blank vs literal-`0`, so it couldn't reconstruct the old output).

None of these were visible from the scope doc; all three were one assertion
away in the parity test. The test turned "ship and hope" into "ship because
the diff is provably the intended one."

## Shape of the test

```python
old = {r["id"]: r for r in old_reader()}          # e.g. read_projects()
new = {r["id"]: r for r in new_path()}             # e.g. load_projects()
hard, expected, cosmetic = [], [], []
for id_ in old.keys() & new.keys():
    for key in old[id_].keys() | new[id_].keys():
        a, b = old[id_].get(key), new[id_].get(key)
        if a == b:                       continue
        elif is_intended_divergence(id_, key, a, b): expected.append(...)
        elif whitespace_only(a, b):                  cosmetic.append(...)
        else:                                        hard.append(...)
assert not hard, hard            # green iff zero unexplained diffs
```

Plus: assert the **id set** matches (catches dropped/added records), and run
the **new path through its fallback** (no live credentials in the test env →
the test exercises the snapshot path, which is also what you want covered).

## Guardrails / gotchas

- **Idempotent formatting matters.** If the seed stored the *formatted* value
  (e.g. `"42,620"`) and the new path re-applies the formatter, that formatter
  must be idempotent (`fmt_number("42,620") == "42,620"`) or every record is a
  false diff. Verify your format helpers round-trip.
- **Cosmetic ≠ hard.** Trailing-whitespace and HTML-invisible differences are
  real diffs but not behavior changes — bucket them separately so they don't
  drown the signal. (If the *validator* that gated the seed already normalizes
  whitespace, your parity test should too, for consistency.)
- **Enumerate, don't suppress.** Each expected divergence gets a one-line
  justification in the test. "3 `end` dates went `"Ongoing"`→`""` because the
  date column is typed `date` and those fields render nowhere" is a spec line,
  not noise.
- **Keep the test after cutover.** It's the regression guard for every future
  regen — if a later change makes the two paths diverge, the test tells you.

## When this applies

- Any migration that swaps a renderer's data source while promising "no visible
  change" (Excel→Supabase Phases 2-5; CDN→local asset; one API→another).
- NOT for migrations that intentionally change output (then it's a
  golden-file/snapshot test of the *new* expected output, not a parity test
  against the old).

## See also

- `[[playbook-measure-first-supabase-migration]]` — the surrounding 5-step
  migration shape; this note is the proof step of the cutover (PR-4) phase.
- `[[docs/excel_to_supabase_lessons]]` — Session 16 lessons #1-#2.
- `kb/_test_projects_parity.py` — the reference implementation.

---

*Authoring check: durable (the "prove equivalence by diffing" idea outlives any
one migration), reusable (Phases 3-5 + any future source swap), distilled (one
concept — parity test as cutover proof), self-contained (frontmatter + opener
give a stranger the claim).*
