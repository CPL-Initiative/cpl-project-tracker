---
title: The first run of a new instrument measures the instrument
created: 2026-09-04
updated: 2026-09-04
tags: [methodology, tooling, accessibility, audit, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-audit-by-rendered-value-not-by-file]]"
  - "[[docs/kb-notes/methodology-the-measuring-browser-can-hide-the-defect]]"
  - "[[docs/public_pages_a11y_lessons]]"
artifacts:
  - scripts/a11y.js
  - a11y.config.js
---

# The first run of a new instrument measures the instrument

> **One-sentence summary** — A new measuring harness's first output is a mixed
> list of real defects and harness defects, and the harness defects are usually
> the loudest ones; budget a tuning pass *before* you plan work off the backlog,
> because the failure mode is not a wasted afternoon — it is a "fix" applied to
> something that was never broken.

## The claim

Building the instrument is the cheap half. The expensive half is that a first
run's findings are not yet evidence: they are a hypothesis about what the page
does, produced by code that has never been checked against a page. Every
measurement rule carries an assumption, and a wrong assumption does not fail
loudly — it produces a confident, plausible, wrong finding, usually replicated
across every view, which is exactly the shape of a systemic defect.

**The tell is a finding that survives its own fix.** If you change the thing the
harness named and it still reports the same number, the harness is measuring
something else. That is not a puzzle to work around; it is the harness telling
you which of its assumptions is wrong.

## What happened

`npm run a11y` (`scripts/a11y.js`) walks all 42 views this repo ships — COBI's
38 hash routes discovered from its own nav, plus Sierra, the Fact Sheet, the
veteran map and SkyView — and measures in Chromium what jsdom cannot see. Its
first run reported a large backlog. Six of the loudest entries were the
instrument:

1. **Text at `opacity: 0` scored as 1:1.** The contrast pass already skipped an
   element's own zero opacity but not its ancestors', so a scroll-reveal section
   (`.op-reveal{opacity:0}`) failed on every line — 30 findings on one tab, all
   on text that is not on screen yet, in a tab that honors reduced motion
   correctly. Making the rule uniform up the tree cut it to six real ones.
2. **A `<textarea>` reported as an unreachable scroll region.** The check asked
   whether a scrolling container had `tabindex="0"` or a focusable child. A
   textarea is itself the focusable thing. 29 findings, zero defects.
3. **A `label[for]` shrank the target it was supposed to enlarge.** ⚠️ **This is
   the one that would have caused a regression.** Substituting a wrapping
   label's box is correct — a 13px checkbox inside its own label is pressed by
   the whole label. Doing the same for a label that merely *points* at a control
   swaps one box for another somewhere else on screen: the harness reported the
   masthead search box as 91×21 **after** it had been fixed to 32px tall,
   because the "Where To?" label beside it is 21.7px. The obvious next move —
   make the control bigger — would have been a change to something already
   passing, in response to a measurement of a different element.
4. **23.95px reported as "24".** Rounding a measurement up past the floor it is
   being judged against makes a true finding read as a harness bug. Floor it:
   understating can only cost a finding, overstating discredits the tool.
5. **Two halves of one check disagreed.** The reduced-motion pass tested mounted
   elements at `duration > 0` and declared rules at `> 0.01`. The standard
   stand-down is `animation-duration: 0.001ms` (not `none`, which silently
   breaks handlers waiting on `animationend`) — so the correct fix registered as
   "still animating" on one half and "stood down" on the other.
6. **A cross-origin stylesheet failed forever.** Failing on an unreadable sheet
   is right (a check that cannot look must not report "ok"). But a Google Fonts
   sheet will never be readable, so the run was permanently red on a condition
   nobody could clear. It is now declared in the config **with its reason**, and
   anything undeclared still fails.

## Why it matters

A harness that cries wolf gets skimmed, and a skimmed harness is worse than no
harness: it costs the same to run, and it launders "I did not read it" into "it
passed." Findings 1 and 2 were pure noise — 59 entries that a reader would
learn to scroll past, taking the real ones with them. Finding 3 was worse than
noise: it pointed at a healthy control and the natural response was to damage it.

The corollary is that **tuning is not a delay before the real work; it is the
first pass of the real work**, and it should be reported as such. The same
principle the repo already records for knowledge — a check that never registers
can never fail — has a twin on the other side: a check that registers on
everything says nothing.

## What to do

- **Run it, then read every finding as a question about the harness first.** For
  each, ask what the harness assumed. Only findings that survive that question
  are backlog.
- **Fix one real defect early and re-run.** A finding that does not clear when
  its cause is removed is a harness defect, and it is cheaper to catch on
  purpose than to discover by "fixing" a passing control.
- **Cluster before you count.** Report distinct rules, not nodes — 4,042
  sub-24px targets across COBI are 54 selectors, and 2,200 of them are one
  button in one dense grid. (See
  [[docs/kb-notes/methodology-audit-by-rendered-value-not-by-file]].)
- **Name every exemption and its reason in config, never in the code.** An
  exemption that cannot be read by the person reading the findings is
  indistinguishable from a blind spot.
- **Keep the harness honest about what it could not measure.** Unreadable
  sheets, image backgrounds and text that is not painted are reported as their
  own categories, never folded into the passes.
