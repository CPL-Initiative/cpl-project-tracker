---
title: "A message must ride every exit — a note computed and then dropped is the same as no note"
created: 2026-09-08
updated: 2026-09-08
tags: [methodology, ui, verification, skyview, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-correct-measurement-can-name-the-wrong-place]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
---

# A message must ride every exit

A function that builds a warning and then returns from several places has to
carry that warning out of **all** of them. Miss one and the warning still
appears in the code, still reads correctly, still passes review — and never
reaches a screen in the case it was written for.

## The case

DR-25 made the subject–discipline map the authority for which faculty
discipline a SUBJ4 belongs to, and left the identities' own filing as a
fallback. Sam asked the row to say which of the two answered. So SkyView's
subject table built the line:

> *(the subject map says Ethnic Studies; its identities sit under Chicano
> Studies)*

and appended it to its return. One of them. `standingHtml()` has four exits —
no seed entry for the home discipline; the subject IS its home's Common SUBJ;
the subject is an umbrella code under it; the subject is none of those — and
the note was attached only to the second.

That is the exit a disagreeing subject almost never takes. If a subject's
identities sit under a different discipline than the map assigns it, it is by
construction usually *not* that discipline's canonical code, so it leaves by
the third or fourth exit. Both dropped the note. The two largest cases never
got that far: their home discipline has no seed entry, so they returned at the
first exit, which also dropped it.

**Measured 2026-09-08 on the payload the page itself draws: nine subjects
disagreed and zero of them printed anything.**

## What made it invisible

Three things, each of which would normally catch a defect:

- **The feature was recorded as working.** The lane file said *"the row prints
  both"*, the code comment beside it said the same, and the session that wrote
  both had genuinely built the note. Nobody was wrong about the words.
- **The count was wrong in the safe direction.** The comment said *four*
  subjects disagree. It is nine. A number that is too small does not look like
  a bug; it looks like a small problem.
- **The one exit that worked was the one anybody would test by hand.** Open the
  table, find a subject that is its discipline's Common SUBJ, and the line is
  there.

## The rule

When a conditional message is computed once and returned from several places,
the question is never *"does the message read correctly"* — it is **"which
exits carry it, and which cases take those exits?"** Those are different
questions, and only the second one finds this.

Two habits that turn it up:

1. **Count the cases the message is FOR, then count the ones that print it.**
   Nine against zero is a one-line script, and no amount of reading finds what
   one measurement states.
2. **A guard per exit, not per message.** The suite written for this
   (`tests/ccr_subject_standing_note.test.js`) has one check per exit and names
   the exit in the check, because the defect was never in the note's wording.
   Reverting the fix fails exactly four of nine checks — the four exits — and
   leaves the wording checks green, which is the shape a guard for this ought
   to have.

## The same shape, elsewhere in this repo

- *"A refusal that prints out of sight is a dead control"* — SkyView's `#u-hint`
  sits in a pane that the default view never paints, so anything that said *no*
  there said it to nobody.
- *"An undefined CSS custom property fails to an invisible state"* — the decision
  sheets' selected chip was white on white; the state was recorded and unreadable.

All three are the same defect wearing different clothes: **the state was
computed correctly and never reached the reader.** Correctness of the value is
not delivery of the value.
