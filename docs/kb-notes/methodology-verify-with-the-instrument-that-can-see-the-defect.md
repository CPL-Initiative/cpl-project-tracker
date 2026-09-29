---
title: Verify with the instrument that can see the defect
created: 2026-08-20
updated: 2026-08-24
tags: [methodology, testing, accessibility, mobile, verification, sky-curate]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/fact_sheet_lessons]]"
artifacts:
  - fact-sheet/check_mobile_layout.js
  - tests/factsheet_a11y.test.js
---

# Verify with the instrument that can see the defect

> **One-sentence summary** — a jsdom test cannot see a layout defect and an
> assertion cannot see a visual regression, so split verification by what each
> instrument can physically observe and keep both; a green suite over the wrong
> instrument is worse than no suite, because it reads as coverage.

## Context

An accessibility and mobile audit of the public CPL Fact Sheet found four real
defects. The page already had **nine committed jsdom test files** and a carefully
WCAG-annotated stylesheet. None of the four was catchable by any of it.

## The claim

### jsdom has no layout engine, so geometry is invisible to it

Every defect that mattered was geometric:

- a five-column grid whose fixed tracks needed 368px, rendering on a 360px phone —
  the page scrolled sideways, the flexible column collapsed to zero so a label
  **printed on top of its own number**, and the last column was **clipped out of
  existence** by an `overflow:hidden` ancestor;
- a 674px table inside a horizontal scroll container: correctly contained (so the
  page never scrolled sideways) and therefore **keyboard-unreachable**, because a
  scroll container is mouse-draggable but not focusable.

`getBoundingClientRect()` in jsdom returns zeroes. No amount of DOM assertion
reaches these. They need a **real renderer**, driven at real viewport widths.

⚠️ **The clipped column is the one that should change your priors.** It is
strictly worse than a broken layout, because a page that silently drops a column
**looks complete** — to a reviewer, to a screenshot, and to the person who built
it. Absence of visible breakage is not evidence of correctness.

### An assertion cannot see a visual regression either

The same run corrected skipped heading levels by changing the tag and carrying the
old appearance on a utility class. The whole claim of that change is *"the
semantics moved and the appearance did not"* — which is a claim about **pixels**,
and can only be checked by comparing them. A class was applied at the wrong tag
(`h-sub` on an `h2` while the rule read `h3.h-sub`, which matches nothing), and the
heading silently fell back to the browser default. Every test still passed. **A
before/after pixel diff caught it.**

### So: two instruments, and be explicit about which sees what

| Instrument | Sees | Runs |
|---|---|---|
| jsdom test | structure, wiring, computable values (contrast maths) | in CI, every push |
| headless browser | geometry, overflow, focus order, computed style, pixels | on demand |

Keep both **committed**. Put the browser harness outside the CI test directory so
it cannot be picked up by a runner that has no browser, and say in its header why
it lives apart — otherwise someone helpfully "fixes" it into the suite and CI
starts downloading browsers for a check it never runs. (Adding `playwright` to
`package.json` does exactly that; it was added by an incidental `npm install` here
and reverted.)

### Compute the values you would otherwise assert

Contrast is the case where the CI-side instrument *is* sufficient — provided you
**compute** it rather than assert it. Derive the tokens from the stylesheet, build
the composites the page actually paints (a translucent bar over the page ground,
a chip fill over *that*), and check each pair against its target. Claimed
compliance in a comment is not compliance; here the palette turned out to be
genuinely sound, which is only worth knowing because it was measured.

### When a new check fails, suspect the check

Two of the audit's own checks were wrong before the code was: an overlap detector
that compared only the x-axis (a false positive the moment the row stacks — the
name is on row 1 and the figures on row 2, so they share x and never y), and an
unanchored `color:` regex that matched `outline-color`. Both produced confident
red on correct code. A brand-new assertion has no track record; the first time it
fires, it is as likely to be wrong as the thing it is testing.

## How we got here

`cpl-project-tracker` #1269 (2026-08-20). `fact-sheet/check_mobile_layout.js`
measures nine viewport widths plus keyboard and reduced-motion behavior and exits
non-zero on a defect; `tests/factsheet_a11y.test.js` carries 69 structural and
contrast checks in CI. The browser harness found two of the four defects and the
screenshot diff found the regression introduced while fixing a third.

## Applies to

Any UI change where the acceptance criterion is spatial ("fits", "does not
overlap", "is reachable", "looks the same"). Also a useful prompt in reverse:
before writing a test, ask what the defect would *look* like, and whether the
instrument you are about to use could observe it at all.

## 2026-08-24 — the corollary: an EXEMPTION is a claim, so it needs an instrument too

The Memory tab's briefing cites each claim with a superscript number. Those are
deliberately smaller than the WCAG 2.2 AA 24x24 target minimum, which is allowed:
SC 2.5.8 exempts a target whose position is determined by the flow of the
sentence it sits in. The justification written down was that the numbered source
list underneath repeats every citation at full size.

**The source-list links measured 15px.** So both were undersized and the
exemption rested on a fact that was not true — and no unit test could have said
so, because jsdom returns zeroes from `getBoundingClientRect()`.

The fix is not only the padding. `scripts/check_memory_briefing_layout.js` now
asserts **the exemption itself**: the inline targets are allowed to be small only
while the list underneath carries them at full size. Delete that list and the
check goes red, instead of the justification quietly evaporating while the
exemption stays in the code comments.

This is the same shape as the veteran map's 7x7 pins, which are exempt only while
the directory rows provide an equivalent route, and the harness verifies those
rows exist. Generalized:

> **When you exempt something from a rule, the thing that earns the exemption is
> a claim about the world. Assert it. An exemption whose justification is only
> written in a comment decays into an unconditional exemption the first time
> someone edits what it depended on.**

The same run produced the mirror-image failure in a unit test: three budget
assertions derived their fixture from a value the code under test may not
declare, so against exactly the code they existed to catch the fixture was empty
and `indexOf("")` returned 0 — green. An assertion has to fail when the thing it
guards is absent, which is why the perturbation run (stash the fix, watch it go
red) is not optional.

## See also

- [[docs/kb-notes/methodology-commit-the-test-harness]] — a test worth running
  once is worth committing.
- `docs/fact_sheet_lessons.md` — the 2026-08-20 SkyCurate section, with the
  measurements.
- `docs/cobi_memory_tab_lessons.md` — the 2026-08-24 SkyRead section (the unearned
  exemption, and the vacuous budget assertions).
