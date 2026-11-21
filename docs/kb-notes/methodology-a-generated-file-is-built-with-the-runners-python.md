---
title: A generated file is built with the runner's Python, because float sums round differently across versions
created: 2026-11-21
updated: 2026-11-21
tags: [methodology, generated-files, ci, python, commons]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/methodology-a-guard-on-generated-output-cannot-see-its-source]]"
artifacts:
  - kb/_build_commons_data_status.py
  - scripts/check_generated.sh
  - .github/workflows/js-tests.yml
---

# A generated file is built with the runner's Python, because float sums round differently across versions

> **A committed file that CI rebuilds and compares must be built with the interpreter CI runs. Python 3.12's `sum()`
> compensates float sums and 3.11's does not, so a mean rounded to four places can differ in its last digit, and the
> `--check` step fails on a file whose data is right. Build with the runner's version, and make a builder's float
> sums version-proof with `math.fsum`.**

## Context

S691 (2026-11-21, the CPL Queue routine) updated #3602 from `main` and rebuilt `kb/status/commons_data.json` with
`kb/_build_commons_data_status.py`. The session's sandbox runs Python 3.11 as `python3`; the runner that checks the
file runs 3.12. CI failed on one statewide mean: 0.6544 in the committed file against 0.6543 from the runner's build.
Lessons: `docs/program_requirements_harvest_lessons.md`, *S691*.

## The claim

### Float sums are not the same across Python versions

Python 3.12 changed `sum()` over floats to use compensated (Neumaier) summation. Python 3.11 adds left to right with
plain rounding at each step. Over thousands of values the two totals can differ in the last bits, and a figure rounded
to a fixed number of places can land on the other side of a rounding boundary. Integer sums are unaffected.

### Two remedies, both in use

1. **Build with the runner's interpreter.** Run the builder with `/usr/bin/python3.12` (the version CI's runner
   uses), and run `scripts/check_generated.sh` with a `python3` symlink to 3.12 first on PATH, since the script calls
   `python3` by name (`d-generated-files-built-with-runner-python-s691`).
2. **Make the sum independent of the version.** `math.fsum` returns the correctly rounded sum on every version, so a
   builder whose output is compared byte for byte uses it for any float total that feeds a rounded figure. #3633 moved
   the Commons builder's spend, cost and mean sums to `math.fsum`.

## How we got here

#3602's first CI run failed the generated check on `kb/status/commons_data.json`. The rebuild under 3.12 matched and
passed; the follow-up #3633 (`b6d52c8e`) made the builder use `math.fsum` so a 3.11 build matches too
(`f-py312-sum-rounds-differently-s691`).

## When this applies (and when it doesn't)

It applies to any committed file a CI step regenerates and compares, when the builder adds floats or divides a float
total before rounding. It does not apply to integer counts, to files nothing regenerates, or to a figure the builder
never rounds into the committed text. A change of runner image can move CI's version; read the version the check
runs before trusting a local build.

## See also

- [`methodology-a-guard-on-generated-output-cannot-see-its-source`](methodology-a-guard-on-generated-output-cannot-see-its-source.md)
- [`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md)
