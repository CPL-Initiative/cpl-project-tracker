---
title: Methodology — Maintaining a committed-workbook model (one-shot revisions, input-driven builder)
created: 2026-06-11
updated: 2026-06-11
tags: [methodology, excel, openpyxl, workbook, funding, generators, single-source-of-truth]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[methodology-parity-test-cutover-proof]]"
artifacts:
  - funding/_revise_workbook_2026_06_11.py / _b.py (the one-shot revisions)
  - funding/_build_funding_data.py (the input-driven builder)
  - kb/_seed_college_short_names.py (the seeder-source lesson)
---

# Maintaining a committed-workbook model

> **One-sentence summary** — When a committed Excel workbook is a *model of
> record* that code consumes, revise it with committed one-shot scripts, make
> the builder compute the formula chain from typed inputs (never cached
> values), and always edit generated files at their generator's source.

## Context

The CPL Implementation Funding model lives in a committed `.xlsx` Sam edits in
Excel, extracted to a JS artifact by a builder, rendered by a dashboard tab.
One day of revisions (shares-first restructure, a college rename, a roster
insert, headcount updates) surfaced every failure mode of this setup at once.

## The claims

1. **openpyxl edits invalidate Excel's cached formula values — and openpyxl
   cannot evaluate formulas.** After a programmatic edit, `data_only=True`
   reads return stale values for untouched formulas and `None` for changed
   ones. So the **builder must compute the chain from the typed input cells**
   (pools, shares, per-row headcounts) and never read derived cells. Bonus:
   the artifact becomes deterministic, and the chain in code doubles as
   executable documentation of the model. Set `fullCalcOnLoad` so Excel
   recalculates when the human next opens it (until then, derived cells look
   blank — warn the owner).
2. **`insert_rows` does not adjust formula references.** Inserting a roster
   row below a `SUM(C9:C126)` silently re-creates the truncated-range bug.
   A revision script that inserts rows must **re-fill every range-bearing
   formula for the new extent** (the uniform per-row formulas, the SUM, the
   AVERAGE) in the same run.
3. **Detect table extent by a structural marker, not a constant.** The
   builder finds the college rows by "ORDER column is numeric" rather than a
   hardcoded last row — so the next insert can't fall outside the scan. (The
   original workbook bug — a SUM stopping one row short of its list — is the
   same disease in spreadsheet form.)
4. **Edit generated files at their generator's source.** A hand-edit to
   `kb/college_short_names.json` was silently overwritten because the seeder
   regenerates it from a raw table embedded in the script. The rename had to
   land in the seeder's `RAW` table (with the old value kept as an alias so
   stored data still resolves). Before editing any committed artifact, ask:
   *what writes this file?* — and edit there.
5. **One-shot revision scripts are committed, not discarded.** Each
   structural change (`_revise_workbook_<date>.py`) is provenance: the diff
   shows *what* changed, the script shows *why and how*, and git history
   keeps every prior edition recoverable.
6. **Hardcode no derived values in tests.** Two assertions memorized
   headcount-derived numbers ($5.27/student, 219,916 projected) and broke on
   a legitimate roster edit; recomputing expectations from the live data
   makes the suite invariant to data revisions while still pinning the
   formulas.

## When this applies (and when it doesn't)

- **Applies** to any committed spreadsheet that code consumes: funding
  models, config workbooks, seed tables — especially while a human still
  edits them in Excel (the dual-writer situation is exactly when caches and
  ranges betray you).
- **Doesn't apply** once the model migrates to a database (the
  Excel→Supabase five-step shape) — at that point the workbook is an export,
  not the record, and these failure modes dissolve.

## See also

- `[[docs/cpl_funding_lessons]]` — the day all six claims were earned
- `[[methodology-parity-test-cutover-proof]]` — the sibling pattern for data-source cutovers

---

*Authoring check: durable (outlives the funding model), reusable (any
committed-xlsx pipeline; peer colleges), distilled (one concept — the
workbook is code, treat it like code), self-contained.*
