---
title: A word in a request may have no referent yet
created: 2026-08-25
updated: 2026-08-25
tags: [methodology, scoping, requirements, measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-measure-your-mechanism-ceiling-before-working-the-queue]]"
artifacts:
  - gr_priorities.js
  - docs/gr_register_lessons.md
---

# A word in a request may have no referent yet

> **One-sentence summary** — "re-run the analysis" presumes an analysis exists;
> checking whether it does can change the task from plumbing into a design
> decision, and the check costs one grep.

## Context

Sam, 2026-08-25: *"be able to edit the drop down info on each regulation priority
and **run a reanalysis** on the items edited on demand after edits are in."*

"Reanalysis" reads like plumbing: find the analyzer, expose a button, call it
again. Before building, I looked for the analyzer. **`blast_rank` — the only
computed-looking column on the table — appears in no Python, no SQL and no
workflow in the repo.** All 16 CPL revisions carry a rank; all 4 in the other
area carry none. The ranks were *authored* by hand during an earlier rebuild.

There was nothing to re-run. Building the button would have meant building an
analyzer and calling it a re-run — and shipping whatever it happened to compute
as though it were the thing that had been there all along.

## What the check changes

Once the word has no referent, the real question surfaces: **what should it
compute?** And that is answered by the audience, not by the codebase. These rows
become a **Chancellor's Office submission**, so:

- a deterministic check the curator can re-derive is **defensible**
- a model's judgment about "blast radius" is **not**, however plausible

So the analysis became the four checks a lawyer makes first — citations in the
text vs the list, listed-but-unsupported, ambiguous code bands, and sections a
*second* priority area also claims — all derivable from the row itself. The LLM
lane stayed scoped-not-built, and named as such.

## The general shape

A request's verb encodes an assumption about the system. Worth one grep before
building:

| the word | the assumption | what to check |
|---|---|---|
| *re-run* / *refresh* | a producer exists | does anything write this column? |
| *sync* | two stores are meant to agree | which is canonical? is the other read? |
| *restore* | a prior state was kept | is there history, and does it cover this? |
| *the report* | one artifact is meant | how many surfaces produce it today? |

⚠️ **Answering the literal request when the assumption is false produces
something that looks finished and is not.** It also destroys the evidence: once a
button exists, nobody asks again whether the thing behind it was ever real.

## The move

State the finding **before** proposing, then offer the fork. The user often knows
the answer instantly once the assumption is named — and it is their call which
of the two things they wanted.
