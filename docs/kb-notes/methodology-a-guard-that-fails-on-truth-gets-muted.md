---
title: A guard that fails on truth gets muted
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, testing, assertions, security, false-positives, smoke-tests]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-rls-is-not-a-gate-in-front-of-a-service-role-function]]"
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/kb-notes/methodology-a-test-that-writes-to-the-queue-it-monitors]]"
artifacts:
  - chatbox/smoke_test.sh (modes 15c, 15d)
---

# A guard that fails on truth gets muted

## The claim

An assertion that fires on **correct** behavior is worse than no assertion. It
does not merely waste a run — it trains everyone reading the output to discount
that check, and a discounted check protects nothing. The cost is asymmetric on
security-shaped assertions, where the whole value is being believed the one time
it is right.

## Two instances, hours apart, same author (2026-08-09)

Both were written while wiring Sierra to the credit-disposition aggregates, and
the second was written *after* diagnosing the first — which is the point. Knowing
the failure mode did not prevent re-committing it.

### 1. An error is not a leak

A boundary check asserted the anon key gets nothing from a reviewer-gated table:

```bash
if [ "$sel" = "[]" ]; then pass; else echo "::error::STUDENT GRAIN LEAKED"; fi
```

First CI run:

```
::error::STUDENT GRAIN LEAKED to anon: {"code":"57014",
         "message":"canceling statement due to statement timeout"}
```

Nothing leaked. PostgREST returned an **error body**, and the check had conflated
*"not the empty array"* with *"rows were served."*

The property is **"the caller receives no rows."** Three responses, three
meanings, and the middle one is the one people forget:

| Response | Meaning | Verdict |
|---|---|---|
| `[]` | policy filtered everything | pass |
| `{"code":…,"message":…}` | error; **no rows served** | pass — and print the error |
| `[{…}]` | rows reached the caller | fail |

Printing the error on the passing branch matters: it keeps a *new* 500 visible
instead of silently absorbed by a check that now says "pass."

### 2. Broadening a regex caught more truth, not more fabrication

A second assertion checked that a college absent from a dataset is never reported
as having zero. It went green **without being exercised** (the model answered from
a different dataset), so the obvious fix was to widen the pattern to catch more
phrasings.

Before shipping it, one query asked which rows the wider pattern could actually
fire on:

```sql
SELECT p.college FROM profiles p
LEFT JOIN summary s ON s.college_id = p.college_id
WHERE s.college_id IS NULL AND p.total_exhibits > 0;
```

**One row.** Of 17 institutions absent from the aggregate, exactly one had any
activity at all. The dataset covers essentially every institution that *has*
anything — so for an absent one, "zero" is approximately **true**, and the wider
regex would fail the system for being right. Reverted the same day.

## Why it recurs

The instinct "this assertion is too narrow, tighten it" is almost always framed
as rigour, and tightening feels free. It isn't: every widening moves the boundary
between *wrong* and *right*, and if you have not measured which real cases sit
near that boundary, you are as likely to have swallowed correct behavior as
incorrect.

Both instances share one shape: **the assertion encoded a proxy** ("response is
literally `[]`", "the words 'zero' and 'awarded' co-occur") **instead of the
property** ("no rows were served", "a figure was invented").

## The rules

1. **Enumerate the response space before asserting on it.** Success, empty,
   error, and malformed are four outcomes, not two. Name what each one means.
2. **Never treat "not the expected value" as "the failure."** Say what failure
   looks like, positively.
3. **Before widening a pattern, query which real cases it would newly catch.** If
   any of them are correct behavior, the widening is a regression.
4. **Add a positive control to every "returns nothing" assertion.** An expired
   key or a broken client makes every negative check pass for the wrong reason.
   Assert something that *must* come back before trusting anything that must not.
5. **Say in the file what the check cannot prove.** A negative assertion passes
   both when the system behaves and when the subject never came up; a green is
   not evidence unless the check was exercised.
6. **Put the measurement next to the narrow assertion**, so the next reader who
   thinks "too narrow" finds the reason rather than re-broadening it.

## The tell

If you cannot name a *specific, real* input that the assertion would newly fail
on, you are not tightening a check — you are guessing at one. Go measure first.

---

*Authoring check: durable (a property of assertions, not of one feature),
reusable (any test, smoke, or monitor), distilled (one claim), self-contained.*
