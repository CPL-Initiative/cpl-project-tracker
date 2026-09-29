---
title: "A diagnosis that does not stop the run is a log line: the 2026-09-08 cron outage"
created: 2026-09-10
updated: 2026-09-10
tags: [methodology, pipeline, map-api, cron, guards, reliability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
---

# A diagnosis that does not stop the run is a log line

The daily dashboard cron failed nine consecutive times over three days —
2026-09-08 through 2026-09-10 — and the fetcher printed the correct diagnosis
on every one of them.

## The chain

Pedro added six CPL lifecycle booleans to
`View_StudentAggregatedValues_APIDataset` on 2026-09-02. They were real:
`'0'`/`'1'` strings, 100% fill over 53,267 rows, enumerated from the API itself
rather than guessed. By 2026-09-08 MAP had removed all six.

**Asking for a column a view does not have 400s the whole view:**

> `View_StudentAggregatedValues_APIDataset contains invalid columns:
> CPL_Docs_Verified, Ed_Plan_Created, Analysis_Completed, Counselor_Verified,
> Student_Verified, Transcribed`

**And a 400 on one view corrupts the labels of another.** This is MAP's known
behavior, first paid for in the 2026-08-24 outage: one invalid view in the batch
and MAP labels a neighbour's data with the invalid name.
`View_ProgramsofStudy_APIDataset` vanished from the response and the student view
came back **twice**.

`read_exhibit_metrics()` keys its `datasets` dict by `viewName`, so the second
copy replaced the first in silence. Its rows did not match its column map, and
`_compute_college_last_activity` died on `IndexError: list index out of range` —
three steps and one file from the cause.

## The guard fired every time and let it through

`summarize_response()` in `fetch_custom_report.py` named the duplicate and the
missing view on all nine runs. It was printed as a `WARNING` and the payload
saved anyway. The comment explaining that choice is the whole lesson:

> *"PRINTING IS UNCONDITIONAL, FAILING IS NOT — and the split is load-bearing…
> It consumes none of the views involved in the 2026-08-24 outage, so failing
> the whole pull here would drop the dashboard to its fallback path over a
> dataset it never reads."*

The reasoning was sound and the premise was not durable. **"Which view MAP
mislabels" is not a property we control.** In 2026-08-24 it landed on a view the
dashboard ignores; in 2026-09-08 it landed on one the dashboard reads. The guard
was calibrated on a sample of one.

## What separates a warning from a stop

Not "how bad is it" — **what does the rest of the pipeline still know how to
do.**

- A **400 on one view** leaves the others readable. The dashboard can publish
  with one dataset missing. Warning.
- A **repeated `viewName`** means the payload cannot be keyed by name at all,
  and keying it by name is the only thing any consumer does with it. Saving it
  is handing on a file we have already proved we cannot read. Stop.

That test needs no knowledge of which views are consumed, which is exactly why
it does not go stale the way the old one did.

## Failing was always cheaper than crashing

The fear behind the warning was losing a day's dashboard. What actually happened
was losing three days of dashboard *and* the diagnosis landing in step 10 instead
of step 5.

Had the fetch stopped, `read_exhibit_metrics()` would have returned `None` for
the missing file and `main()` would have printed *"No exhibit data found —
skipping exhibit KPIs"* — a published dashboard, minus the exhibit KPIs, with a
loud red step naming MAP's own message. The graceful path existed the whole time.

## Guessed column offsets are stale by construction

The crash site read:

```python
i_date = cm.get("Uploaded Date", 22)
i_pot  = cm.get("Potential Student", 18)
```

Those numbers were the offsets of a 25-column view. The live view is 19 columns
wide, so the fallback indexes past the end of every row the day the name stops
matching. **A column we cannot find by name is a column we do not read** — not a
column at a guessed position. `excel_to_dashboard.py` carries **51** of these;
one was fixed here because it was the crash site, and the rest are their own
work rather than a sweep bolted onto an outage fix.

## What it cost, named

`Counselor_Verified` feeds the funding model's `pac` / `pac_u` — applied CPL
units on a counselor-accepted Student CPL Plan, the Success band's measure —
through `ACCEPT_CANDIDATES` in `funding/_build_funding_performance.py`. With the
column gone those keys are **omitted, not zeroed**, which is the designed
degradation: `srcDelivered()` reads an absent key as "no feed yet" and pays $0
rather than measuring a false zero.

The probe (`kb/_probe_lifecycle_checks.py`) still **watches** all six even though
the fetch no longer **requests** them — that is how we find out the day MAP
serves them again. The invariant "everything watched is also requested" was not
loosened away; withdrawn columns are named, with the reason, in `WITHDRAWN`.

## The general shape

Three things have to be true of a guard, and this one had two:

1. it must **detect** the fault — it did, nine times;
2. it must **report** it where someone looks — it did, in the step log;
3. it must **change what happens next** — it did not.

A check that satisfies only the first two is a log line. The 2026-09-09 SkyView
run learned the same shape one layer up: sixteen checks asserted a message's
*string* and none asked where it landed
([`methodology-a-check-on-the-message-says-nothing-about-where-it-lands`](methodology-a-check-on-the-message-says-nothing-about-where-it-lands.md)),
and the live-session banner failed closed and silently
([`engineering_ui_practices`](../reference/engineering_ui_practices.md)).

## See also

- `fetch_custom_report.py` — `summarize_response`, `fetch_report`
- `excel_to_dashboard.py` — `read_exhibit_metrics`, `_compute_college_last_activity`
- `tests/custom_report_duplicate_view_test.py`
- Probe evidence: discover-map-datasets run 34478781366 (2026-09-10)
