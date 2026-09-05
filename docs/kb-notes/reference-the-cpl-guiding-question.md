---
title: The CPL guiding question, and why sufficiency is not equivalence
created: 2026-09-05
updated: 2026-09-05
tags: [reference, cpl, ccr, doctrine, faculty-review]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
---

# The CPL guiding question, and why sufficiency is not equivalence

> **One-sentence summary** — Every screen in the CPL evaluation lane exists to
> help a faculty member answer one question about one person: *would I want this
> person to have to take my class when they already know this stuff?*

## Context

Sam, 2026-09-05, correcting the direction the session had assumed and naming
the test the process serves:

> It's often one certification evaluated to see which course or courses it
> aligns with enough for CPL. Process answers our guiding question, "Would I
> want this person to have to take my class when they already know this stuff?"

## The claim

**The evaluation runs certification → courses.** One certification is examined
to see which course or courses it aligns with **enough** for credit. A
course-first view — here is a course, here is what aligns to it — is the
*destination* of an evaluation, not its entry point. A certification-first
entry is a first-class view.

**"Aligns with enough" is a sufficiency test, not an equivalence test**, and
this governs every threshold in the lane. No certification and no course will
ever match completely. The question is never *do these match* but *is this
close enough that awarding credit is sound.* A design that reports percentage
overlap and stops has answered nothing — a faculty member still makes the call,
and the tooling's job is to give them what the call needs.

**The guiding question is the acceptance test for every screen we ship.** It
repays reading closely:

- It is asked in the **first person, by a faculty member**, about a **real
  person** — not by an institution about a credential class.
- It is about **waste and fairness**, not paperwork. The failure it names is a
  human being sitting through something they can already do.
- It presumes the answer is often **no** — that the honest response to a
  well-trained person is to let them past.
- It is **falsifiable in the other direction.** Sometimes the answer is yes,
  take the class, and the tooling must make that answer just as easy to reach
  and just as well-evidenced. A design that can only produce "award credit" is
  not a decision aid.

## Consequences

- **Test every panel against it.** Does this help a faculty member answer that
  question about a person in front of them? A screen that does not is
  decoration, however tidy. The unit-spread panel passes: settling whether a
  course is 2 units or 5 changes what a student is granted. A completeness
  percentage does not.
- **Evidence over verdicts.** Because the judgment is the faculty member's, the
  interface should surface what supports a judgment — how many colleges teach a
  thing, what the certification claims, where they diverge — and stop short of
  scoring the match.
- **It pairs with the learner's version of the same test.** Sam, the same day:
  *"I would love to walk in to my next career opportunity armed with a verified
  catalog of my skills."* The faculty question and the learner's are one test
  seen from two ends, and a feature that serves neither end serves nobody.

## Related

The reciprocal framing this sits inside — that CTE programs already teach to
industry standards and nobody has examined it one certification at a time — is
captured verbatim in the `CPLBrain` vault braindumps of 2026-09-05, together
with the equity framing (*"those who grew up believing college wasn't for
them"*) and the prospective one (*"with foreknowledge"*).
