---
title: "Change the input, not the consumers — derive the old field at the single seam"
date: 2026-07-27
kb-status: published
kb-type: methodology
tags: [methodology, refactoring, funding, implementation-funding, data-model, migration, cpl]
artifacts:
  - cpl_funding.js (priorities · prioPerStudent · prioTargetRate · applyEdit "perstudent")
  - tests/cpl_funding.test.js (Part H — per-student derivation + inverse)
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-achievement-based-funding-cap-and-earn]]"
---

# Change the input, not the consumers — derive the old field at the single seam

> **One-sentence summary** — when a curator asks to *change what they type* (a percent
> becomes a dollar rate) but the derived quantity feeds a dozen consumers, store the new
> value as the source of truth and **derive the old field at the one place the object is
> built** — every consumer keeps reading the old field, so the blast radius is one function.

## Context

Sam asked to replace the Implementation Funding "**% of headcount**" projection input with a
**per-student dollar** rate he types, with the student count and % *derived* from it
(`students = priority funding ÷ $/student`). The percent (`target_rate`) was read in ~15
places: the earn model (`earnFraction`), the per-priority table cells (`prioCellHtml`),
`sysHeads`, the CSV export, the rural attainment calc, the drill-in. Rewriting all of them
to read a new `per_student` field would have been a large, error-prone diff.

## The claim

**Invert the input at the model seam, not at every consumer.** The renderer builds each
priority object in exactly one function (`priorities(slot)`). Make that function:

1. Read the **new** stored field (`per_student`) as the source of truth.
2. **Derive** the old field from it right there:
   `target_rate = clamp((share × perYear) ÷ (per_student × totalHeads), 0..1)`.
3. Also expose the effective new value (`per_student`) on the object for display.
4. **Fall back** to the old stored field when the new one is absent, and expose the
   *implied* new value — so legacy rows keep working and **self-migrate** the moment the
   curator edits one (the edit writes `per_student`, which then wins).

Every downstream consumer keeps reading `p.target_rate` **unchanged** — they never learn the
input flipped. The only other edits are cosmetic: the input control (now a `$` field whose
`applyEdit` branch stores `per_student` as a raw dollar, not `/100`) and wherever you *want*
the new value shown.

```js
function prioTargetRate(slot, idx, share) {
  var stored = prioField(slot, idx, "per_student");
  if (stored != null && Number(stored) > 0) {
    var denom = Number(stored) * totalHeads();
    return denom > 0 ? Math.min(1, (share * perYear()) / denom) : 0;
  }
  return prioField(slot, idx, "target_rate");   // legacy: the old field is the source
}
```

### Corollaries

- **No schema migration.** The config is a JSON blob, so `per_student` is just a new key —
  no table change, and `setPrio(slot, idx, "per_student", $)` persists it like any other.
- **Guard the derivation against divide-by-zero and clamp the result** (a very low $/student
  would imply > 100% of headcount → cap at 1.0). Do it once, at the seam.
- **Pick the source-of-truth by what the user controls.** Storing `per_student` (not
  `target_rate`) means: if the funding pool later changes, the *rate stays put* and the
  student count re-derives — which is what "the rate I typed" should mean. Storing the
  derived field instead would silently re-price the rate. Store what the human sets.
- **Watch for recursion before calling siblings at the seam.** `priorities()` now calls
  `perYear()`/`totalHeads()`; confirm neither path calls back into `priorities()` (they read
  pool config only) or you get infinite recursion.

## How we got here

Shipped in PR #901 (2026-07-27, SkyMoney). The whole input flip touched **one** model
function (`priorities()`) plus the input control — the earn-model target computation, the CSV
target column, and the rural calc keep **reading `p.target_rate` unchanged**, none re-wired
to consume the new field. (The per-priority cells, `prioCellHtml`, *were* edited in the same
PR — to *display* the `per_student` rate — but not to change how they compute the target; and
`earnFraction`/the CSV cells got an unrelated `advancing`-status edit. The point is that
**nothing had to change to keep computing the target from `target_rate`**.) Tests (Part H)
assert the inverse relationship directly — halving `$/student` ~doubles the derived student
target while the **dollar allocation is unchanged** (dollars come from the share, never the
rate) — the cleanest proof the derivation is wired without touching the money.

## When NOT to use this

If the new and old quantities are **not** a pure function of each other (the derivation needs
information the seam doesn't have), or if consumers genuinely need the *new* semantics (not
just the same number by another name), then you do have to touch them — the seam trick only
works when the old field remains a faithful, derivable proxy.
