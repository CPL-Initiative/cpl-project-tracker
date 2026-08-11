---
title: ADR — Student-detail aggregates: k=10, published grain, and the reviewer/published split
created: 2026-08-08
updated: 2026-08-11
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
     Real numbers, no suppression. **Never readable by the anon key Sierra's
     widget uses.** The SELECT policy is `USING (is_allowed_reviewer())` —
     the `team_access` shape, *not* the `kb_curation` shape.

     ⚠️ **Do not copy `kb_curation`'s policy set**, despite what
     `docs/session_128_handoff.md` says ("Reviewer-only RLS, same gate as
     `kb_curation`"). Measured 2026-08-08: `kb_curation_read` is
     `SELECT / {public} / USING (true)` — **`kb_curation` is publicly
     readable**, and only its writes are reviewer-gated. That is correct for
     institutional curation data and catastrophic for student grain; applied
     literally it would have published this table to the anon key, which the
     very next line of the same handoff paragraph forbids. The tables that
     actually gate reads are `team_access`
     (`SELECT / {public} / USING (is_allowed_reviewer())`) and
     `sierra_feedback` / `chat_interactions`
     (`is_allowed_reviewer() OR team_pass_ok()`).

     **`team_pass_ok()` is deliberately excluded here.** It is a single shared
     phrase sent in a request header — a reasonable gate for editing a RACI
     board, too weak to be the only thing between a shared password and
     per-student rows.
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

## Amendment 2026-08-11 — suppress the WHOLE ROW, not just the count

Building the per-credential rollups (`map_credential_volume`,
`map_credential_student_rollup`) surfaced a hole in how this ADR had been
applied. The first cut masked `students` when the cell was under k=10 but still
published the measures beside it:

```
students: null   potential_units: 3.0   rows_needs_action: 1
```

**That defeats the floor entirely.** At one student, "3.0 potential units" *is*
that student's credit record; hiding the count while publishing the amount
discloses more than the count would have. Caught before shipping, not after.

The rule is now explicit: **under k, every measure in the row goes null**, and
the row survives only to assert that the cell exists (`students_suppressed =
true`). Verified with a standing assertion — *no published measure may be
non-null on a suppressed row* — which returns 0 on both rollups.

### And decision 5 was violated in the same build — caught at checkpoint

Row-level suppression was necessary and **not sufficient**. These rollups publish
a statewide unit total *and* its per-college components, and **units sum**. Where
exactly one college cell was hidden, the residual

```
statewide_units − Σ(published sibling units)  =  the hidden cell, exactly
```

Measured before the fix: **AP Chemistry 755.00 − 695.00 = 60.00**, AP Calculus BC
48.00, AP 2-D Art and Design 24.00 — twelve-plus credentials in that shape.

That is precisely what decision 5 above already required, written down two days
earlier, and the first implementation did not do it. **Writing the control down
is not implementing it, and neither is passing the row-level test** — the
row-level assertion returned 0 leaks while every one of those cells was
arithmetically recoverable.

Fix: within a credential, if only one cell would be suppressed, suppress the
**smallest published cell** alongside it, so two unknowns share the residual.
Smallest = cheapest real information lost. Cost: **16 complement cells** (123 of
543 rows published, down from 139).

**Both assertions now stand in the committed SQL** and must return 0:
no published measure on a suppressed row, *and* no credential with exactly one
suppressed cell.

The generalisable lesson: **a suppression test must model the attack, not the
field.** `assert cell is None` and "does any measure survive on a hidden row"
both pass on a schema that leaks by subtraction. Ask instead: *what can be
derived from everything published, taken together?*

Two consequences worth carrying:

- **Suppression is a property of the ROW, not of the identifying field.** Any
  measure derived from the same small population leaks at the same rate. Ask of
  every column: *at n=1, what does this reveal?*
- **"Suppressed" and "no data" must remain distinguishable.**
  `students_suppressed = true` (real students, below k) and
  `colleges_with_student_data = 0` (nothing recorded) are different facts, and
  collapsing them turns a blind spot into a reported zero. See
  [[docs/kb-notes/methodology-publish-the-denominator-with-the-number]].

Sam's refinement on the reporting side (2026-08-10): Sierra states **"fewer than
10"** rather than declining. A bounded range confirms activity exists, stays
FERPA-safe, and is strictly more useful than silence — and it explains the
privacy protection when asked. Still never an exact number, never estimated,
never derived by subtraction.

**Measured cost of k=10**, for the open question of whether the floor is too
blunt (Sam flagged wanting to revisit): suppression hides **320 of 436
credentials — but only 5.1% of students and 5.4% of units.** It is a long tail.
The price is *breadth* (three-quarters of credentials cannot be named
individually), not *volume*. That reframes the revisit: the question is whether
per-credential naming is worth a different technique (e.g. banding), not whether
the totals are being distorted.

---

*Authoring check: durable (policy outlives the load), reusable (any student-grain
aggregate this project publishes), distilled (one decision set), self-contained.*
