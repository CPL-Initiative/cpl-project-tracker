---
title: Retire a mode toggle by making both modes coexist
created: 2026-07-30
updated: 2026-07-30
kb-status: published
tags: [methodology, ui, data-integrity, dashboard-tab, funding]
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-achievement-based-funding-cap-and-earn]]"
---

# Retire a mode toggle by making both modes coexist

## The pattern

When a user reports that a **mode toggle "reads wrong,"** the bug is usually not in
either mode. It is in a **scope mismatch between the two things the toggle separates** —
and the toggle is what makes that mismatch invisible.

A toggle guarantees the user can never see both numbers at once. So if mode A renders a
*per-year* figure and mode B renders a *window* figure, nothing in the UI can ever
contradict itself. The user just develops a slow, correct suspicion that the numbers
don't add up, with no way to prove it.

**The fix is usually not to correct the toggle. It is to delete the toggle and put both
numbers in the same cell**, where a mismatch becomes structurally impossible to hide.

## How to recognize it

Suspect this whenever:

- A toggle switches between two views of *the same rows* (potential vs actual, plan vs
  spend, gross vs net, this-year vs all-time).
- A bug report is vague — "it reads wrong," "the numbers seem off" — rather than naming a
  specific wrong value. Vagueness is the signature: the user can feel the inconsistency
  but cannot point at it, because the UI never shows the two halves together.
- Each mode is individually defensible when you check it in isolation. That is exactly
  what a scope mismatch looks like from inside one mode.

A second, related failure: a toggle that swaps the **unit of analysis** (colleges ⇄
districts, users ⇄ accounts). Asking for the aggregate *deletes* the detail rows the
user was comparing. The fix there is the same shape — **grouping instead of switching**:
add subtotal header rows above the detail rows, so the aggregate is additive rather
than substitutive.

## The method

1. **Find the scopes, not the logic.** For each mode, write down exactly what unit and
   what time window each rendered number covers. The mismatch is nearly always there.
2. **Pick the cell shape that shows both.** Primary figure on top, secondary beneath, in
   the same cell. Reuse a stacked-cell pattern already blessed elsewhere in the product
   rather than inventing one.
3. **Name any sub-parts that carry different confidence.** If the secondary number
   aggregates things you actually *measured* with things you are *assuming*, split it
   and label the assumed part. An aggregate of two confidence levels silently reports
   the stronger one. (In the CPL funding tab, ~95% of a college's "earned" figure was a
   provisional advance on an unmeasurable metric — true all along, but unnamed until the
   split forced it into the open.)
4. **Delete the toggle, its state, its wiring, and everything only it reached.** A
   retired toggle usually strands a whole branch of code (alternate column sets, alternate
   row renderers, alternate CSV shapes). Leaving them is context tax on every future
   session.
5. **Rewrite the toggle's tests into behavior tests.** The old assertions ("mode B is
   selected," "mode B renders N rows") describe a mechanism that no longer exists.
   Replace them with the property the retirement was *for* — e.g. "every detail row stays
   visible when grouped," "Σ subtotals == Σ details," "both figures appear in the cell."

## Why not just fix the scopes and keep the toggle

You can. But the toggle will re-acquire a mismatch the next time either side changes,
and it will be invisible again. Coexistence is **self-policing**: the next person to
introduce a scope error sees two numbers that disagree, in one cell, immediately.

## Cost

Small. In the worked example both retirements were JS-only, ~1 day combined including
tests, and each *removed* more code than it added (the district-view retirement was net
−6 lines while adding a feature).

## Worked example

`cpl_funding.js`, 2026-07-30 (PRs #946, #947):

- **Potential⇄Earned basis toggle → stacked cap-over-earned cells.** The underlying
  mismatch: per-priority cells rendered the viewed *year* while the front-load "Yr 1"
  money column rendered the whole *window*, and `earned_total` silently summed both
  years — so the earned figure was dominated by year-2 advances invisible in the year-1
  cells. Also relabeled the front-load column "Window (front-loaded)", because it *is*
  the window and naming it "Yr 1" was the proximate cause of the confusion.
- **Colleges⇄Districts view toggle → "Group by district" on the one table.** Groups
  ordered by subtotal, detail rows sorted within groups, every college row still visible.
