---
title: A wrong column is worse than a missing one
created: 2026-08-07
updated: 2026-08-07
tags: [methodology, data-quality, ingestion, metrics, privacy]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]"
  - "[[docs/kb-notes/methodology-a-failed-read-is-not-an-empty-result]]"
  - "[[docs/kb-notes/methodology-capped-retrieval-ranks-by-relevance]]"
artifacts:
  - funding/_student_detail_local.py
  - kb/_probe_student_detail_view.py
---

# A wrong column is worse than a missing one

> **One-sentence summary** — a missing field raises an error somebody
> investigates; a wrongly-matched field produces a confident, plausible number
> that gets repeated as a finding, so any loose column matcher must verify the
> VALUES it got, not just that it got something.

## Context

Session 127 built a local aggregator over MAP's 537,908-row student-detail
export to answer "how many students statewide are eligible for CPL based on CPR
or AED certs?". Column headers drift between MAP exports, so the matcher was
written loosely on purpose — a hard-coded header that silently matches nothing
is its own failure mode. The looseness then produced a worse one.

## The claim

### 1. Loose matching must be ORDERED, not alternated

The first matcher used a single regex per field:

```python
"status": re.compile(r"cpl\s*status\s*plan|^status$", re.I)
```

Read that as "prefer `CPLStatusPlan`, fall back to `Status`" and it looks
correct. It isn't. The resolver walks the COLUMNS and takes the first one
matching ANY branch — so precedence is decided by **header order in the file**,
not by the order of the alternatives. The export happened to carry a column
named plainly `Status` earlier in the row, and it won.

The fix is to invert the loops: try each pattern, most-specific first, ACROSS
ALL COLUMNS, before falling back to the next pattern.

```python
"status": [r"^cpl\s*status\s*plan$", r"cpl\s*status\s*plan",
           r"cpl.*status", r"disposition", r"^status$"],
```

### 2. The failure is invisible where it matters most

`Status` holds MAP's workflow stage and role routing — *Needs Action /
Implementation / Faculty / Initiator / Articulation Officer*. `CPLStatusPlan`
holds the disposition — *Applied to CPL Plan / Not Applicable / In Process /
Needs Action*. They share exactly one value, and it is the most common one.

So the run completed, matched a column, produced a full breakdown, and reported:

```
DISPOSITION RATE statewide: 0.0% (0 acted / 525,362)
```

⭐ **It was wrong in the direction that looked right.** This project already
expects a low disposition rate — the measured median is 4.7% — so 0.0% reads as
a sharper version of a known finding rather than as a defect. Had nobody
inspected the value labels, "the statewide disposition rate is zero" would have
entered the record as a fact.

Compare the missing-column case: an error, a stack trace, five minutes, no
false belief. The wrong column cost more precisely because it succeeded.

### 3. Verify the VALUES, then withhold rather than emit

A matcher cannot validate itself; the check has to come from the data. Assert
the observed values against the vocabulary the field is supposed to hold:

```python
DISPOSITION_VOCAB = {"applied to cpl plan", "not applicable",
                     "in process", "needs action"}
```

with one refinement that is the whole point: **the shared value does not count
as agreement.** `Needs Action` appears in both columns, so accepting it as
evidence reproduces the original bug. Require a match on a value only the right
column can hold.

On disagreement, print what was found, what was expected, and what to do — then
**withhold the derived metric instead of emitting it.** The rate helper returns
`None`, never `0.0`, and the payload carries `status_column` and
`disposition_rates_valid` so no downstream reader can mistake one for the other.
Figures that do not depend on the disputed column (student, college and exhibit
counts) stay, and the output says so explicitly rather than leaving the reader
to guess how far the damage spreads.

### 4. Print every header on every run

The first run printed only the columns it matched. There was no way to see what
it could have chosen instead — the evidence needed to diagnose the bug was one
`print` away and withheld. Print the full header list always, not only on
failure. Same family as
[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]].

## How we got here

Two instances in one session, hours apart, both the same shape:

1. **The API probe.** `kb/_probe_student_detail_view.py` reported a bare
   `NOT FOUND` for three candidate view names while the response carried
   `responseCode` and `responseMessage` keys it never printed. Printing them
   turned a guess into a verdict: `400 — View_StudentDetailCredits_APIDataset is
   not Valid`, identical on a single-column retry, which distinguishes *unknown
   view* from *rejected column* — two states needing opposite follow-ups.
2. **The status column**, above.

Both were caught by a human reading output and finding it implausible, not by
any check in the code. That is the argument for the checks.

Verified red-then-green on a fixture reproducing the real header order — a decoy
`Status` sitting *before* `CPLStatusPlan`: the correct column now wins and the
rate reads 73.3%; with `CPLStatusPlan` removed the run prints `WRONG COLUMN`,
lists the values it saw, and withholds the rate.

## Where it applies

Any ingestion of an external export whose schema is not under our control —
the MAP CustomReport views, COCI pulls, college-supplied spreadsheets, partner
occupation lists. Checklist when adding one:

- (a) ordered patterns, most-specific first, across all columns
- (b) a value-vocabulary check on every field a metric depends on, excluding
      values the field shares with its likely decoys
- (c) withhold the metric on disagreement — `None`, never a zero
- (d) record which column was used, and whether it validated, in the output
- (e) print every header on every run

## What this note does NOT claim

Loose matching is still right. The alternative — pinning exact headers — fails
on the next export and fails silently in the other direction, reporting zero
rows as though the data were empty. The lesson is not "match strictly"; it is
"match loosely, then prove you matched the thing you meant."
