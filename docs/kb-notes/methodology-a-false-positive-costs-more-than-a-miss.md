---
title: On a trust-building surface, a plausible false positive costs more than a miss
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, ranking, search, trust, ux, matching, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-two-signals-for-a-judgment-proposal]]"
  - "[[docs/local_course_alignment_lessons]]"
artifacts:
  - kb/supabase_alignment_routes.sql (cx_align_tokens, the content-token gate)
---

# On a trust-building surface, a plausible false positive costs more than a miss

> **One-sentence summary** — when a ranked list is asking a domain expert to trust
> a machine for the first time, one obviously-wrong row discredits every other row
> on the page, so the right threshold is far stricter than the one that maximises
> recall.

## Context

The alignment route ranks a college's own courses against a statewide credit
recommendation, so faculty do not have to guess which course to put forward. The
first implementation scored plain token overlap plus trigram similarity. Asked
for *"Introduction to Flux Cored Arc Welding (FCAW)"* at Cerritos College, it
returned:

| Rank | Course | Score |
|---|---|---|
| 1 | `WELD 214L` — Flux Cored Arc Welding (FCAW) Certification Laboratory | 0.604 |
| 2 | `AED 36.05` — Introduction to Basic Welding for the Building Trades | 0.406 |
| **3** | **`ART 100` — Introduction To World Art** | **0.328** |

Rank 1 is exactly right. Rank 3 is an **art-history course**, and it is there
because it shares *"introduction"* and *"to"* with the recommendation.

## Why that is worse than it looks

By any ordinary information-retrieval reasoning this is a minor defect: the top
hit is correct, the bad hit is third, and its score is half the winner's. Tune
later.

That reasoning is wrong here, because of **who is reading and what they are
deciding**. A welding instructor opening this for the first time is deciding
whether the tool is worth using at all. They will not reason about score
distributions. They will see an art course offered against a welding certificate
and conclude the system does not understand the domain — and then the *correct*
top suggestion loses its authority too, along with every peer articulation
underneath it.

**The blast radius of a false positive is the whole page, not the one row.**

Meanwhile a miss is nearly free. Something else on the page usually covers it:
in this design, peer precedent shows what other colleges actually used, so a
course the scorer failed to surface is often still reachable
(`methodology-two-signals-for-a-judgment-proposal`).

## The rule

On any surface where a machine is proposing something a human expert would
otherwise decide:

1. **Set the threshold for credibility, not recall.** Ask "what is the worst row
   a user will see?", not "what fraction of good rows do we catch?".
2. **Require a discriminating match, not just any match.** Overlap on structural
   words (`introduction`, `to`, `of`, `lab`, `level`, `part`) is not evidence.
   The fix here was a stoplist plus a hard gate: **at least one content token in
   common**, or the row does not appear at all.
3. **Do not stop words that carry real distinctions in your domain.**
   `advanced`, `beginning` and `basic` stayed, because *"Introduction to FCAW"*
   and *"Advanced FCAW"* are two different recommendations on the same
   credential — stopping them would merge two answers into one.
4. **Never render the score.** A number invites the reader to treat a ranking as
   a probability. Show the ordered list; keep the score for ordering.

## Evidence the fix worked

Dropping structural tokens from both sides also **raises** the right answer,
because the denominator shrinks: `WELD 214L` went **0.604 → 0.761**, and every
remaining Cerritos candidate is a welding course. Tightening the gate made the
correct match *more* confident, not less — a good sign that the removed signal
was noise rather than evidence.

## Smell test

You are probably over-tuned for recall if a hand-run of one realistic query
returns a row you would be embarrassed to show the person who asked for the
feature. Run that query before shipping. One example from the actual domain is
worth more than an aggregate precision number.
