---
title: ADR — Student-detail aggregates: k=10, published grain, and the reviewer/published split
created: 2026-08-08
updated: 2026-08-08
tags: [adr, privacy, ferpa, disclosure-control, student-data, sierra, supabase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-small-cell-suppression-must-survive-subtraction]]"
  - "[[docs/kb-notes/adr-funding-priority-metrics-privacy]]"
  - "[[docs/kb-notes/adr-cer-student-impact-counts-privacy]]"
  - "[[docs/session_128_handoff]]"
artifacts:
  - map_student_credit (Supabase, reviewer-only)
  - the published aggregate (Supabase, Sierra-readable)
---

# ADR — Student-detail aggregates: k=10, published grain, reviewer/published split

> **Status: RATIFIED** (Sam, 2026-08-08 — threshold stated in his own words
> *"report those with fewer than 10 as <10"*; thin-row handling chosen as
> option (b), existence with no breakdown.)

## Context

Sam built aggregates in Microsoft Access over the 537,908-row MAP
student-detail export and is loading them into Supabase so Sierra can answer
what a college has **acted on**, not merely what credit exists
(`cplstatusplan-absent-from-fetched-map-views`).

His proposal was to skip a separate shielded table entirely: upload aggregates
granular enough that Sierra reads them directly, showing cells below 10 as
`<10` in the public view "while actually relying on the real numbers for other
totals."

The direction is right and the threshold is an improvement on the 5 currently
used by the funding surfaces. The specific combination is not safe, and this
project documented why two days earlier
([[methodology-small-cell-suppression-must-survive-subtraction]], 2026-08-06):
publishing a total plus every sibling makes the hidden cell recoverable by
arithmetic, and suppression applied at *display* time over real underlying rows
is decoration.

A chatbot adds a failure mode a static tab does not have. Sierra answers many
questions over the same data; per-answer suppression does not survive a
sequence of answers that re-cut it (the classic tracker attack). Fixing the
published grain once, at build time, is what makes the disclosure question
tractable at all — the alternative is proving that no sequence of arbitrary
`GROUP BY`s over live student rows ever pins a person.

## Decision

1. **k = 10** for every student-detail surface. Cells backed by fewer than 10
   distinct students are suppressed. Existing surfaces (`_build_cr_backlog.py`,
   the funding priority metrics) keep k=5 until separately revisited — see Open
   Questions.

2. **Two objects, not one.**
   - **Reviewer-only base** — `map_student_credit` and the fine-grain rollups.
     Real numbers, no suppression. RLS `is_allowed_reviewer()`, the same gate as
     `kb_curation`. **Never readable by the anon key Sierra's widget uses.**
   - **Published aggregate** — suppression already applied. Sierra reads this
     one, and reads it without restriction.

3. **Suppression happens at write time, in a build step — never at render
   time.** If Sierra holds real rows and hides them on display, anything she can
   sum she can also subtract.

4. **Thin cells show existence, not breakdown** (Sam's option (b)): the row
   persists carrying `<10` with its disposition/credit breakdown nulled. A
   coordinator seeing that a credential is present at their own college is a
   legitimate use; the accepted cost is confirming that ≥1 student holds it.

5. **Complementary suppression at every level that publishes a total.** Hiding
   one cell of a set that sums to a published total hides nothing. Hide the
   next-smallest too. A zero is a legitimate complement and is usually cheapest —
   it also breaks the "suppressed, therefore 1..k−1" inference.

6. **Suppression is driven by the distinct-student count, and takes the credit
   sums with it.** These aggregates carry both headcounts and credit figures;
   a cell with one student whose `PotentialCredits` is published has disclosed
   that student's exact credit total. The headcount was never the sensitive
   part on its own. Credits sum, students dedupe — but both go when a cell is
   thin.

7. **No rate at a grain where its inputs are suppressed.** Any two of
   `{total, acted, backlog, rate}` give the rest. The disposition rate publishes
   only where its components do.

8. **Suppressed records keep their full key shape**, every measure nulled. An
   omitted key turns a privacy control into a downstream `KeyError`.

9. **Test the property, not the flag.** `assert cell is None` passes on a broken
   implementation. The test asserts that subtraction cannot pin a suppressed
   value at any published grain.

## Consequences

- **Most of what Sierra needs is unaffected.** Statewide dormant-credit sums,
  per-college totals across exhibits, per-exhibit statewide counts, and the
  basic-military flagship (on ~14 of 15 military CPL students) are all far above
  threshold. Suppression bites only at the deep cut — college × exhibit × CR ×
  disposition — which is also where the numbers are least useful.
- The published layer is a **build step with a test**, not a SQL view.
  Complementary suppression is iterative: hiding a complement can oblige its own
  group to find one. That is not expressible as a trivial view and it needs to
  be tested.
- Sam's Access grain never leaves his machine; the surrogate `student_key` map
  stays local. Loading the base table does not change that posture — it moves
  pseudonymous rows into a reviewer-gated table, which is why (2) is not
  optional.
- Refresh is manual/monthly (CSV import from Access), so a build step costs
  nothing operationally — it runs when Sam loads.

## Open questions

- **Do the existing k=5 surfaces move to 10?** Consistency argues yes; it is a
  separate change with its own blast radius (the funding tab and the CER
  rollups), so it is not folded in here.
- Whether the published aggregate should also carry a `_suppressed_siblings`
  count so a reader can tell a complement from a genuinely thin cell. Leaning
  no — it re-narrows the unknown.

---

*Authoring check: durable (policy outlives the load), reusable (any student-grain
aggregate this project publishes), distilled (one decision set), self-contained.*
