---
title: Verify the consumer graph before migrating a data class — a dead reader means delete, not migrate
created: 2026-05-31
updated: 2026-05-31
tags: [methodology, excel-to-supabase, migration, dead-code, measure-first]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-parity-test-cutover-proof]]"
  - "[[excel-retirement-final-scope]]"
artifacts:
  - excel_to_dashboard.py
  - kb/_test_projects_parity.py
---

# Verify the consumer graph before migrating a data class

> **One-sentence summary** — Before migrating a data class to a new store, grep
> for who *reads its values* (not who passes it through or excludes it); if the
> only reader is dead code, the correct move is **delete**, not migrate.

## Context

Excel-retirement PR-2 was scoped (in a published plan + the prior session's
hand-off) as "migrate the 15 `D.*` cohort-helper rows into Supabase
`workplan_goals` as `kind='kpi_helper'`." That framing assumed the rows were
*consumed*. They weren't. Tracing the consumer graph turned a schema-migration
task into a dead-code deletion. (Workstream notebook:
`docs/excel_to_supabase_lessons.md`, Session 24.)

## The claim

**A migration plan is only as good as its consumer audit.** A row/field/table is
worth migrating *only if something reads its values downstream*. Three kinds of
reference masquerade as "consumption" and must be filtered out first:

1. **Pass-through** — code that carries the data into an output payload
   (`"projects": projects`) without reading any field. Removing the data removes
   it from the payload; nothing breaks.
2. **Exclusion guards** — code that *skips* the data (`if id.startswith("D."):
   continue`). These prove the data is *unwanted* in that path, the opposite of
   consumption.
3. **Dead readers** — a function that *would* read the values but is **never
   called**. The `def` lingering in the file looks like a live dependency; it
   isn't.

Only a **live value-read** (`x = row["kpi_metric"]` inside a function on a real
call path) justifies migration. If the audit finds none, **delete** — migrating
dead data into a new store just relocates the liability (and here would have
forced a needless CHECK-constraint + text-column migration to faithfully store
`$172M`/`99k` strings nothing read).

## How we got here

The `D.*` rows' only value-reader was `populate_current_metrics()`. The tell:

```
grep -n "populate_current_metrics(" excel_to_dashboard.py
# → only the `def` line. Zero call sites.
```

It went dead on 2026-05-28 when Phase 1 PR-4 moved the annual-goals "Current"
column to `build_workplan_goals_from_supabase()` and dropped the call but left
the `def`. Every *other* `D.*` reference was an exclusion guard (grid, count,
leads, `derive_core_activity_ids`) or pass-through (`CPL_Data.js` emission), and
all three JS report generators `continue` on `D.*`. Net: **nothing read their
values**, so PR #213 deleted the rows + the dead `populate_current_metrics()`
cluster (`_override_int`/`_pmetric_int`/`_ppct`/`_pcount`, all orphaned with it).

Two cheap tools did the whole audit: (a) `grep` for the literal ids to find
candidate readers, and (b) `grep -c "funcname("` to prove a `def` is uncalled.
The deletion was then proven safe by the **parity-minus-X** technique
(`[[methodology-parity-test-cutover-proof]]`): regenerated output ==
committed output **minus exactly the deleted ids**, everything else
byte-identical.

## When this applies (and when it doesn't)

- **Applies** to any "migrate data class X from store A to store B" task, and
  especially when a *plan* or *hand-off* asserts a consumer ("X feeds Y") —
  verify the assertion against the code before building; summarized plans drift
  from reality.
- **Surface the finding, don't act unilaterally** when delete-vs-migrate is a
  product call (someone may want the data preserved for a future feature) or
  when a schema change needs sign-off. Here it was one `AskUserQuestion`
  (delete / migrate / JSON) — the owner chose delete.
- **Doesn't apply** to data with a live reader, obviously — and beware
  *client-side* or *cross-repo* readers a single-repo grep misses (here the JS
  consumers were in-repo and checked too). Audit every language/surface that
  loads the payload, not just the generator.

## See also

- `[[methodology-parity-test-cutover-proof]]` — the diff-minus-X proof that
  made the deletion safe to ship.
- `[[excel-retirement-final-scope]]` — the plan whose `D.*` consumer premise
  this corrected.
- PR #213; `docs/excel_to_supabase_lessons.md` (Session 24).
