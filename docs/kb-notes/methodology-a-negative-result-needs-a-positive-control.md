---
title: A negative result needs a positive control in the same run
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, probe, api, discovery, verification, false-negative]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]"
artifacts:
  - kb/_probe_new_custom_reports.py
  - kb/_probe_new_custom_reports_followup.py
---

# A negative result needs a positive control in the same run

> **One-sentence summary** — "we looked and it isn't there" is only as good as
> proof, gathered in that same run, that the instrument could have found it.

## Context

On 2026-08-19 a probe swept 51 candidate `viewName` values against the MAP
Custom Report API looking for three reports. Every one returned
`400 … is not Valid`. The probe reported **"NONE exposed"** — a clean, confident,
completely wrong answer that would have sent a request to the vendor for names
he had already published.

The verdict rested on one premise: that `columnName: []` is a request a real
view answers with its schema. That premise was true when it was measured, five
days earlier, on a different view. It was not re-checked in the run that
depended on it.

It had stopped being true. `columnName: []` now returns **HTTP 500 on
known-good views** — ones the daily cron pulls every morning — while a named
column returns 200 with data. So the probe's success condition ("columns came
back ⇒ the view is real") **could not fire for any view in the universe**. The
sweep was structurally guaranteed to report absence, and it did so in the exact
tone it would have used if it were right.

## The rule

**Before reporting that something is absent, prove in the same run that your
method finds a thing you know is present.** Not in a previous run, not on a
different target, not by reasoning about the API's documented behavior — in
this run, over this connection, against a known-good instance.

A control is cheap: one extra request. A false negative is expensive in a way
that hides — nobody re-checks a "not found", because there is nothing to
re-check.

## The corollary: an odd one out is a lead, not a tally entry

The same sweep contained the answer and threw it away.

The API validates the view name *first*, so an invalid name is rejected with 400
before the empty column list can crash anything, while a **valid** name passes
that check and then 500s. On that sweep, **500 meant real and 400 meant absent** —
the instrument was not broken, it was *inverted*.

Exactly one of the 51 candidates returned 500. It was the one real view in the
list. The probe printed it as `✗`, counted it with the fifty rejections, and the
summary line said "NONE".

**A response that differs in KIND from the others is a signal about the target,
not a row in the count.** A 5xx is the server trying and failing; a 4xx is the
server declining. Summarizing them together destroys the only distinction that
mattered. Discovery code should collect the odd ones out separately and say so
loudly, because the anomaly is where the information is.

## What this looks like in code

```python
def control():
    """Prove the instrument before trusting a negative."""
    for known_good in ("View_CollegeCourses_APIDataset", ...):
        if probe(known_good).get("columns"):
            return True          # a 'not found' below is about the VIEW
    print("❌ control failed — every result below may be the REQUEST, "
          "not the view. DO NOT report absence from this run.")
    return False
```

…and the verdict block reads `if not instrument_ok:` before it prints anything
else, so a broken run cannot present its findings in the same voice as a sound
one.

## Where it applies beyond probes

Any absence claim built on a filter, a query, or a search: an empty result set
from a query you have not proven returns rows; a grep whose pattern you have not
tested against a known match; an RLS-filtered read, which answers **200 + `[]`**
and is indistinguishable from genuine emptiness
(`methodology-an-rls-filtered-read-is-not-an-error`). The failure shape is
identical — the instrument silently stops working and the report reads as fact.
