---
title: A scoped question may need a different instrument, not a filter
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, crosswalk, partners, tooling, deliverables]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/delta_college_crosswalk_lessons]]"
  - "[[docs/partner_crosswalk_lessons]]"
  - "[[docs/futuro_hth_crosswalk_lessons]]"
artifacts:
  - kb/_build_college_offering_crosswalk.py
  - kb/_build_partner_crosswalk.py
  - kb/_build_futuro_hth_crosswalk.py
---

# A scoped question may need a different instrument, not a filter

> **One-sentence summary** — When a follow-up request looks like the last one
> "but narrower", check whether the two questions agree about what a *good
> answer* is; when they don't, a filter on the existing tool produces a
> confident, well-formatted wrong deliverable.

## Context

Three times now a CPL request has arrived phrased as a variation on an existing
crosswalk, and twice the right move was a new generator rather than a parameter.
The pull toward reuse is strong and usually correct — this note is about the
specific signal that says it isn't.

## The claim

**Two questions can share their inputs, their vocabulary, and even their output
format, and still be different instruments — because they disagree about what
counts as a good answer.**

The test is not "is the scope narrower?" It is: *state the best possible outcome
for each question. Are they the same sentence?*

Worked example. The statewide partner crosswalk answers *"where in California can
our students get credit for these occupations?"* Its best outcome is **"some
college already offers this"** — a **fact**, and the tool deliberately does not
privilege the partner's in-county college, because a referral should go wherever
the credit actually is.

The college-scoped version answers *"what can THIS college carry?"* Its best
outcome is **"this college teaches the content AND the exhibit exists AND nobody
joined them up"** — a **task**, and it privileges exactly one college, because
that is the entire question.

Filtering the first tool to one college would have answered the first question
about a subset. It would have reported that college's coverage as thin and
pointed at better-covered neighbours — which is *correct for a referral* and
useless in a room where the college is sitting across the table.

### Corollary: the shape of the vocabulary decides too

A separate case, same principle. The partner engine exists to reconcile a
partner's **occupation** vocabulary against MAP's **credential** vocabulary —
many-to-many and judgment-heavy. When a request had **one known course × one
known program type** across every college, there was no vocabulary to reconcile,
and a simpler purpose-built generator was right. Forcing the engine would have
dressed a mechanical lookup in a judgment layer it did not need.

**Match the instrument to the question's shape, not to the word in the request.**

## How we got here

- **2026-08-05** — statewide SJCOE partner crosswalk (139 occupations, all
  colleges). Reported that San Joaquin Delta carried 69 credentials of which
  exactly one was career/technical, and that the nearest real capacity was
  Modesto Junior College. Correct, and correct *as a referral answer*.
- **2026-08-13** — Futuro Health / HTH. Phrased as a crosswalk; had no vocabulary
  to reconcile. A separate simple generator was built instead of extending the
  engine.
- **2026-08-19** — the same partner asked for the Delta-scoped version. Written as
  a new tool. It surfaced 42 occupations where Delta already teaches the content
  *and* MAP already lists it as a potential adopter — a result the statewide tool
  structurally cannot produce, because "is this college flagged on an exhibit it
  hasn't adopted?" is not a question it asks.

## Consequences and caveats

- **Cost is lower than it looks.** The new tool reused the expensive layer (the
  occupation→credential rulings) unchanged. What was rebuilt was the cheap layer:
  how results are joined, ranked and presented. Reuse the judgment, not
  necessarily the program.
- **This is not a licence to fork on every request.** The signal is a genuine
  disagreement about the best outcome, not mere narrowing. A request for the same
  answer about fewer rows *is* a filter.
- **Say which you built and why.** A caller who asked for "the same thing but for
  X" should be told they got a different instrument, or they will compare the two
  outputs and think one is broken.
