---
title: The feedback queue already knew — collection is not the bottleneck, triage is
created: 2026-08-07
updated: 2026-08-07
tags: [methodology, feedback, governance, sierra, cpl-assistant, product]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase_sierra_feedback.sql
  - tests/sierra_geo_ranking.test.js
---

# The feedback queue already knew

> **One-sentence summary** — a defect that took an engineering session and an automated battery to find had been
> reported by a human, in writing, in the product's own feedback table, **five weeks earlier**; the queue had 43
> rows and not one had ever been triaged, which makes collection the part that was working.

## The claim

**Before building a better detector, read the reports you already have.** Feedback surfaces are cheap to ship and
feel like progress, so they get built; triage is unglamorous recurring labour, so it doesn't get staffed. The
result is an organization that believes it is listening because the button exists.

## What happened

Sierra's smoke battery flagged that a college recommendation ignored distance. Root-causing it produced a
committed regression test and a fix. While querying `sierra_feedback` for something unrelated, this turned up —
a thumbs-**up** with a caveat, dated **2026-07-03**:

> *"Good answer, but could be improved. Moreno Valley College is closer to Crafton than Bako and should have been
> mentioned"*

That is the same defect, stated plainly, by a domain expert, in the tool built for it. Crafton Hills is Inland
Empire; Bakersfield is San Joaquin Valley with 9 matching exhibits; Moreno Valley is Inland Empire with 2. Volume
ordering put Bakersfield fourth and Moreno Valley nowhere.

The measurements taken at the same time:

| | |
|---|---|
| Rows since 2026-07-01 | **43** |
| Ever advanced past `status='new'` | **0** |
| Rows that are the **smoke test** writing into its own queue (`page='smoke'`) | **19** |
| Real rows | 25 (10 thumbs-down, 26 carrying notes) |

## Three failure modes, all visible in that table

1. **Nobody owns the queue.** A `status` column with a triage workflow was built (`new → triaged → addressed`)
   and has never advanced once. A schema is not a process.
2. **The harness pollutes the queue it fills.** Nearly half the rows are the automated smoke test's own
   `page='smoke'` writes. Any human opening the queue wades through test noise, which makes it likelier they stop
   opening it. **A test that writes to production feedback must be filterable, and filtered by default.**
3. **The invitation outpaced the capacity.** The natural next move — invite a wider team to try it and rate
   answers — would have taken 43 unread rows to several hundred unread rows. **An unread queue that grows is
   worse than a small one: it teaches people their feedback goes nowhere, and that lesson is expensive to
   reverse.**

## Triage by class, not by vote

The instinct is to sort by rating. Ratings are the least informative field. Sort by **what kind of gap the note
describes**:

- **Retrieval gap** — the system had the answer and failed to surface it. A real bug. *(the Crafton note)*
- **Data gap** — the system does not hold the answer. A corpus/ingest item, not a bug.
- **Expectation gap** — the system was **right** and the person expected something else. Not noise: this is a map
  of what the field misunderstands about the domain, and is often the most valuable category collected. It is a
  documentation and UX signal that no amount of retrieval work will fix.

That third class is also the answer to *"what if the feedback is misinformed?"* Misinformed notes are not a
contaminant to be filtered — they are a finding about the audience, provided a human reads them and nothing
auto-learns from them.

## Ask for questions, not ratings

Every conversational aside a domain expert offered during two sessions — *"nursing"*, *"fire fighter"*,
*"cardiopulminary"* (their own misspelling), *"Moreno Valley is closer than Bako"* — **found a real defect.**
Bare ratings found none.

**A rating without a question is nearly useless; a question without a rating is gold.** So ask users for the
*questions they asked and what they expected*, and treat the rating as an optional afterthought. Instrument for
the input, not the verdict.

## Never let feedback auto-tune the system

Tempting, and wrong, for exactly the reason people worry about misinformed feedback: one confident incorrect
thumbs-down becomes policy. Keep a human gate between the queue and behavior — and then **staff the gate**,
because an ungated-but-unread queue and a gated-but-unread queue are the same queue.

## Checklist before inviting a crowd to test

1. Drain the existing queue once, end to end.
2. Filter the test harness's own rows out of the review surface.
3. Name an owner and a cadence — *before* the invitation, not after.
4. Ask for questions and expectations; make the rating optional.
5. Decide where each class routes (bug tracker / ingest backlog / docs), so triage is a sort, not a debate.
