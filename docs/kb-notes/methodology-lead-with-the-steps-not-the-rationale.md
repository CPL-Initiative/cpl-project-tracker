---
title: Lead with the steps, not the rationale
created: 2026-08-10
updated: 2026-08-10
tags: [methodology, communication, colleges, adoption, documentation, briefing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-tier-must-encode-what-you-could-not-check]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/map_student_credit_reload]]"
artifacts:
  - docs/map_student_credit_reload.md
  - college_briefing.js
---

# Lead with the steps, not the rationale

**Sam's observation, 2026-08-10**, after a runbook I wrote buried its own
procedure: *"We have a similar problem when working with our colleges on
implementing CPL — we tend to get buried in rationale rather than just telling
them the simple steps."*

## The pattern

Someone who understands a thing deeply writes it down for someone who has to
*do* it, and produces a document organised around **why** when the reader needs
**what next**. It is not padding and it is not condescension — every paragraph
earns its place on the merits. It is an ordering failure, and it is invisible to
the author because the author already knows the steps.

The tell is that the writer can't answer *"what is step 3?"* without re-reading
their own document.

## Two audiences want opposite orderings

| | Wants | Order |
|---|---|---|
| **Doing it now** | the next action | steps first, reasons on demand |
| **Understanding it later** | the reasoning | context first, steps as illustration |

Both are real. **The one executing wins the top of the page** — they are the one
who fails if the document fails, and the reader who wants reasoning will scroll.

## Worked instance 1 — a runbook (2026-08-10)

`docs/map_student_credit_reload.md` had a correct 8-step procedure whose thread
ran underneath ~150 lines of rationale, warnings and reconciliation notes. Worse,
the SQL blocks were headed *Step N* in a numbering that did not match the
reader's actions: importing the CSV was buried **inside** "Step 2", while the
count check that gates it got its own "Step 3" heading. Two numbering schemes,
neither of them the reader's.

Fix: a 9-row table at the very top — one action per row, where to do it, and the
two hard gates called out inline. SQL blocks renamed so a step can reference one
without the schemes colliding. Rationale below a rule, explicitly labelled as not
needed to run the thing. **No content removed.**

## Worked instance 2 — the college briefing (same day)

The same defect, one level up, on the surface built to tell colleges what to do:

- Opens correctly with **"Start here"** — the items a college can act on.
- Then prints **all 22 strategies at equal weight**, only **3** of which carry a
  measurement. Nineteen pieces of unscored advice follow three concrete ones.
- Shows **"50% of the pot"** — how the *state* allocates money. A coordinator
  cannot act on a funding share; it is the Chancellor's framing on the college's
  to-do page.
- Closes by explaining that strategies come from the funding configuration and
  can be edited there. That sentence is for **us**.

The instinct was right and the page then reverted to explaining itself.

## What to do instead

1. **Put the actions first, numbered, one action each.** If a step needs a
   caveat to be safe, put the caveat *in* the step, not before it.
2. **Mark the gates.** Most steps are mechanical; one or two need judgement. Say
   which, so attention lands where it matters instead of spreading evenly.
3. **State what makes it low-stakes.** "Nothing changes until step 7" is worth
   more than three paragraphs of reassurance, and it is the sentence a nervous
   reader is actually looking for.
4. **Demote, don't delete.** Rationale below a rule, marked as optional. It is
   what makes a gate stick once someone hits it.
5. **Cut what serves the author.** Provenance notes, allocation percentages,
   editing instructions for a config the reader can't reach — real information,
   wrong audience.
6. **Separate advice from a step.** A step has a done state. Advice does not.
   Nineteen pieces of advice indistinguishable from three real steps make the
   three harder to find, not the nineteen more useful.

## Why it matters more with colleges than with docs

A confusing runbook costs a re-read. A confusing implementation guide costs
**adoption** — and the failure is silent, because a college that doesn't know
what to do next doesn't file a complaint. It just doesn't act, and the credit
stays dormant. That population is already measured: **1,051,870 units at Needs
Action**, of which **63,991 are already articulated** — everything built, nobody
acted.

Not all of that is a communication failure. But "we told them and they didn't
act" and "we told them in an order they couldn't act on" look identical from our
side of the screen, and only one of them is their fault.
