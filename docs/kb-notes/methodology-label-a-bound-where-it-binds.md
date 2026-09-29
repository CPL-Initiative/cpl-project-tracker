---
title: Label a bound where it binds
created: 2026-09-23
updated: 2026-09-23
tags: [methodology, funding-model, presentation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-figure-tagged-to-two-owners-is-claimed-twice]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_combined.test.js
---

# Label a bound where it binds

> **When a minimum or maximum applies to a total, print the total and put the label beside it.** A label placed on
> one part of that total reads as a claim about the part, and the reader concludes the bound was missed.

## Context

The CPL Implementation Funding model gives every institution a $150,000 base and a $400,000 cap on its combined
award, then splits that award into a credit share and a noncredit share by FTES. The institution table showed only
the two shares. On 2026-09-23 the model's own designer read the table and reported that colleges at the base
received about $149,000.

Every one of the 51 institutions at the base received exactly $150,000. Clovis's row read **$149,321 (at base)**
in the credit column and **$679** in the noncredit column. The word "(at base)" sat on the credit share, so the
reader compared $149,321 with $150,000 and found a shortfall that did not exist.

## The rule

1. **Find the figure the bound binds.** Here the base and the cap bind the combined award, never either share.
2. **Print that figure.** A bound is a claim about one number; if the table does not show the number, the reader
   reconstructs it by addition or, more often, reads the bound against the nearest figure instead.
3. **Put the label on that figure alone.** A second copy on a component restates the claim about the wrong number.
4. **Keep the components as components.** The shares still show, now as the parts of a figure the reader can see.

## How the fix was checked

- The model was never wrong: `solveBounded()` holds every floored award at exactly the base. A harness run over
  the live dials listed each floored institution's combined award, credit share and noncredit share, which located
  the confusion in one step.
- A test pins the reported case: an institution at the base reads the base in its Max award cell with "(at base)"
  beside it, and its credit share reads less with no bound word
  (`tests/cpl_funding_combined.test.js`).

## Why the combined column had gone

It had been retired on 2026-08-31 for a sound reason: the share pair's sum IS the award, so a third column looked
redundant. The redundancy argument held for arithmetic and failed for reading. A figure a reader must add up is a
figure the bound word cannot sit beside.
