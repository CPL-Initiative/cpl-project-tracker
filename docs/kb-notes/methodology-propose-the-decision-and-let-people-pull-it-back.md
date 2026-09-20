---
title: Propose the decision and let people pull it back — it is easier to respond to a decision than to make one
created: 2026-09-20
updated: 2026-09-20
tags: [methodology, curation, decision-sheets, ccr, cer, cr-reference, sam-ruling]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/decision_sheets]]"
  - "[[docs/reference/lanes/common-cr-reference]]"
  - "[[docs/kb-notes/reference-system-one-model-fit-by-lane]]"
artifacts:
  - kb/_decision_sheet_replies.py
  - kb/receipts/cr_reference_decisions_2026-09-20_s280.json
---

# Propose the decision and let people pull it back

> **One-sentence summary** — a curation sheet pre-decides every item and asks
> the reader to confirm or pull out, because a made decision costs a check
> where an unmade one costs a decision, and people leave when the decisions
> outrun what they can carry.

## Context

Sam, 2026-09-20, after working the 51-item Jev sheet on the Common CR
Reference: *"it is better to over merge and give faculty the chance to pull
them out rather than the other way around. It's easier to respond to a
decision than to make one. When humans see a decision, it kicks their thinking
into gear about all the reasons it might be right or wrong, especially if the
broader framing is kept in view."* And on why: *"making decisions is taxing
and only so many can be made before people bail out of the enterprise. If the
decisions are made beforehand (as an easy button that can easily be undone),
it reduces the tax outlook and keeps people in the game."*

The sheet he had just worked recorded the effect. Its first 25 items came
pre-decided as folds; he confirmed them in two minutes at four to six seconds
each. Its next 26 came proposed as hold-separate and asked him to judge; he
swept them in one minute, each clicked Yes and then flipped to Keep, and eight
of those keeps he later flipped back to fold when shown the anchors that
carried both. The sheet's Yes meant "take the proposal", and the proposal had
changed between sections, so the same chip meant fold on one page and keep on
the next. His words for it: *"I found myself saying yes to things that I later
had to flip keep because I didn't pay attention to your rec."*

## The pattern

- **Every item arrives decided**, with a one-line reason it might be wrong,
  written in the vocabulary of the variables that decide such items (level,
  scope, units, lab against lecture, vendor-specific, a different course).
- **The recommendation is the focal point of the item**, a callout above the
  chips, never a line in the same gray as the facts.
- **Chips name the outcome**, *Keep the fold* and *Pull out*, never a bare Yes
  whose meaning depends on the proposal. Edit sits behind Other. Every chip is
  a toggle, so undo costs one click.
- **The framing sits in the header, in the owner's words**: here, no student
  repeats a course they have already mastered, and credit mobility and
  articulation adoptability across the system.
- **Over-merge is safe only where pull-out exists.** In the CR Reference the
  decisions table carries `split` and `excluded`; a store with no way to pull
  a wording back out must not receive proposed merges.
- **Progress reads in outcome terms** (rows settled, colleges reached), the
  biggest win comes first, a stopping point appears every twenty items, and
  quality goes in the score as undo and reversal rates, never as clicks.

## Why the model belongs upstream of the sheet, never in it

A System One model can order the queue and pre-fill the proposal; on the CR
sheet it was right 25 of 25 above its gate and carried no signal below it. The
proposal is cheap to verify because a person reads two wordings and clicks.
That is the same test the repo applies to fan-out: automate where a hit is
cheap to recognize, keep the judgment where being wrong is the risk.

## Scope

Sam's ask is every major decision grouping: CER, CSR, CCRR and CCR, with CCR
*"the big kahuna with its thousands of decisions"*. Each needs a decisions
store with a reason column before its first sheet; the CR Reference has one,
and `kb_curation` does not yet.
