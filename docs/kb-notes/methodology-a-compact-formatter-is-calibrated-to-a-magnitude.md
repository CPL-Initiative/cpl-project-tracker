---
title: A compact formatter is calibrated to a magnitude, and a second lane rarely shares it
created: 2026-08-27
updated: 2026-08-27
tags: [methodology, ui, measurement, testing, cpl-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_nc_lane.test.js
  - scripts/check_funding_nc_row_layout.js
---

# A compact formatter is calibrated to a magnitude, and a second lane rarely shares it

> **One-sentence summary** — A "compact" number formatter encodes an assumption
> about the size of the numbers it will see; reuse it on a lane operating two or
> three orders of magnitude lower and it stops compacting and starts
> misstating — silently, and invisibly to any test without a layout engine.

## Context

Adding the noncredit earning lane to the CPL Implementation Funding tab meant a
second row per college, rendered in the same dense priority cells as the credit
row. Reusing the credit cell's formatters was the obvious move and produced a row
that was structurally perfect: right number of cells, right columns, right
labels, right states. The numbers in it were wrong.

## The claim

**A compact formatter is a lossy encoder with a calibration point.** `fmtCountK`
rounds to a whole number below 100,000 — correct for credit targets in the
hundreds or thousands, where the lost fraction is noise. Noncredit targets are
order **1–25 CPL FTES**. At that scale the same function turns:

- `1.4` into `"1"` — a **−29%** misstatement, and
- anything under `0.5` into **`"0"`** — an *absent-looking zero*, on the one lane
  whose whole design point is that its zeros are honest.

The second failure is the serious one. That lane deliberately renders `$0 · no
feed` because nothing has been measured yet, and the entire design distinguishes
three kinds of zero (absent / withheld / measured). A rounding artifact that
manufactures a fourth, indistinguishable zero attacks the one property the lane
was built to have.

**The rule:** before reusing a formatter across lanes, ask what magnitude it was
calibrated for and what magnitude the new lane actually produces. If they differ
by more than about an order of magnitude, the formatter needs a scale-aware
branch — not a wider column and not a comment.

## How we got here

Nine jsdom assertions covered that cell — that it exists, that it carries the
Tgt/Now shape, that it reads "no feed", that it omits a percentage, that its
hover names the noncredit measure. **All nine passed.** They had to: the markup
was correct. What was wrong was a *value inside a text node*, which nothing was
asserting because nothing had a reason to suspect it.

It was found by taking a screenshot. `Tgt 1 FTES` on a row whose real target was
2.3 looked wrong in a way no assertion had been written for.

The fix is `fmtFtesSmall()` — one decimal below 100, deferring to the shared
compaction above it — plus two assertions that now do suspect it: that a
sub-100 target keeps a decimal, and that the hover still carries full precision.
Mutation-checked (reverting to `fmtCountK` fails the first).

⚠️ **The credit lane has the same latent case** — a small college's
FTES-denominated credit target can also fall under 100. Left alone deliberately
rather than widened into a live tab mid-build, and recorded here so the next
person meets it as a known thing rather than a discovery.

## When this applies (and when it doesn't)

**Applies** wherever one presentation layer serves two populations with different
natural scales: a per-institution view beside a statewide roll-up, a pilot cohort
beside the full corpus, money in dollars beside money in millions, a credit lane
beside a noncredit one. It applies with particular force when the small-scale
lane is *new*, because its numbers have never been looked at.

**Does not apply** to formatters whose whole input domain is bounded and known
(a percentage, a count of table columns), and it is not an argument for showing
more decimals everywhere — precision the reader cannot use is its own cost. The
test is whether rounding changes what the number *claims*, not whether it loses
digits.

**A neighboring, distinct rule:**
[`a-percentage-must-not-round-up-into-a-claim`](methodology-a-percentage-must-not-round-up-into-a-claim.md)
covers rounding that manufactures a claim at the *top* of a range (99.6% → 100%).
This note is the mirror at the *bottom*: rounding that manufactures an absence.

## See also

- `[[docs/cpl_funding_lessons]]` — the 2026-08-27 (Session 200) section
- [`a-defect-that-produces-the-expected-value-is-invisible`](methodology-a-defect-that-produces-the-expected-value-is-invisible.md)
  — the general shape; this is a concrete instance where the expected value was
  a plausible small integer
- `scripts/check_funding_nc_row_layout.js` — the Chromium check that exists
  because jsdom measures nothing

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
