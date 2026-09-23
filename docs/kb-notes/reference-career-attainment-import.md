---
title: Career-attainment import — the Chancellor's Office's EDD measure for goal (C)
created: 2026-09-23
updated: 2026-09-23
tags: [reference, implementation-funding, career-attainment, edd, import]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[adr-funding-counts-mask-under-10-units-carry-the-money]]"
artifacts:
  - funding/_build_funding_performance.py
  - tests/funding_career_import_test.py
---

# Career-attainment import — the Chancellor's Office's EDD measure for goal (C)

PULL-side reference for the Implementation Funding lane. Read it when CO research sends its first file
or a later update, or when Priority 4's figures look wrong. Lane state:
[`lanes/implementation-funding`](../reference/lanes/implementation-funding.md).

## The rulings behind it

- **Sam, 2026-09-22:** *"we can use EDD wage data to measure this... This would not be reported by the
  colleges but instead measured by the CO and reflected on our funding model with periodic updates
  (imports) of the data."*
- **Funding review, 2026-09-23, item 1 (hold):** Priority 4 stays at a 0% share until the first import
  lands. Its share and a funding factor of 0.5 (matching the other three priorities) are then set together.
- **Item 2 (CO research defines it):** CO research defines the career outcome. The import carries, per
  college, the CPL units of students awarded CPL who reach that outcome. Counts under 10 are masked by CO
  research before the file reaches the model, per the
  [funding-counts ADR](adr-funding-counts-mask-under-10-units-carry-the-money.md).

## The file

`funding/career_attainment_import.json`, committed through a pull request. The daily dashboard run
(`funding/_build_funding_performance.py`) merges it into `cpl_funding_performance.js`, so the tab shows it
the morning after the merge. Each update replaces the file.

```json
{
  "as_of": "YYYY-MM-DD",
  "source": "CCCCO Research, EDD unemployment-insurance wage records",
  "definition": "the career outcome CO research measures, in its own words",
  "colleges": {
    "<college name>": { "cpl_units": 0, "nc_cpl_units": 0, "students": null, "nc_students": null }
  }
}
```

| Field | Rule |
|---|---|
| `as_of` | The date CO research produced the import. The tab dates the figure by it. |
| `source`, `definition` | Required. The definition is CO research's, word for word; the model names no outcome of its own. |
| `cpl_units` | Required. Units of CPL, as awarded, for students who reach the outcome. The model converts them to FTES at the college's calendar (30 semester or 45 quarter units per FTES). |
| `nc_cpl_units` | Optional. The same for students whose CPL originated in a noncredit program, recorded on the credit college that awarded it. Leave it out entirely when there are none; a row of zeros means measured zero. |
| `students`, `nc_students` | Optional, for CO research's own record. A whole count of 10 or more, or `null` when masked. **No count ever reaches the artifact.** The model funds on units. |
| college names | As MAP or the college spells them. The builder resolves them the way it resolves MAP's names; a name it cannot resolve is listed, by name only, in the build log and in `career_attainment.unmatched`, and moves no figure. |

## What the model does with it

- **No file:** `ca_u` and `nc_ca_u` are absent, so Priority 4 reads *awaiting measurement* and counts $0.
- **A file:** `ca_u` statewide and per college (and `nc_ca_u` when the file carries noncredit units),
  plus a `career_attainment` block with `as_of`, `source`, `definition`, the college count and any
  unmatched names. A college the import does not name reads as a measured zero, which is what a complete
  import means.
- **At a 0% share** Priority 4 moves no award, whatever the import says. The funding follows the
  ruling that sets its share.

## The checks

`tests/funding_career_import_test.py` runs in CI:

- The builder writes nothing when there is no file (absent, never zero).
- Only units reach the artifact.
- An unmasked count under 10 stops the whole import, with the row named in the log.
- A malformed file is skipped and the MAP measures still build.
- The committed file, once there is one, passes every rule above.

On the tab, `tests/cpl_funding_career_attainment.test.js` checks two things: the card dates the figure by
the import, and the (d)(2) account reads *per the Chancellor's Office import*.
