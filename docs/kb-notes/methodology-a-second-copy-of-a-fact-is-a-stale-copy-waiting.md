---
title: A second copy of a fact is a stale copy waiting
created: 2026-08-25
updated: 2026-08-25
tags: [methodology, data-quality, sierra, staleness, single-source]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-a-silent-input-cap-is-a-content-swap]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_district_credit_figures.test.js
---

# A second copy of a fact is a stale copy waiting

> **One-sentence summary** — When the same fact is stored twice, the copy without a
> writer goes stale silently, because a stale number looks exactly like a fresh one;
> the fix is to delete the copy, not to refresh it.

## Context

Sierra held per-college CPL credit figures in two places:

| | |
|---|---|
| `map_college_credit_summary` | rebuilt nightly in the 13:40 promotion |
| `chatbox_college_profiles.credit_distribution` | seeded once, **2026-06-25 21:59:58** |

Four jobs write `chatbox_college_profiles` — a landing-page sync, an identity
crosswalk, a scraper, a user sync — and **not one of them touches that column**.
Nobody decided to freeze it. It simply had no writer, and nothing anywhere reported
that.

Asked what a district should do, Sierra quoted the frozen copy: Moreno Valley College
as **0 students, 0 applied, 0 transcribed** when the live table said **2,887 / 14,029
/ 12,861** — the largest of its district's three colleges. Across the 103 colleges
that join, the frozen copy understated transcribed units by **61%** and students by
**40%**, with a false zero for transcribed at **17** colleges.

## The claim

### Staleness is invisible at the point of use

A wrong number and a right number are the same shape. Nothing about `26` announces
that it was true in June. This is what separates a stale copy from most defects: there
is no error, no log line, no ragged edge — the answer is confident, well-formed, and
wrong. It fails the way [[docs/kb-notes/methodology-a-silent-input-cap-is-a-content-swap|a silent input cap]]
fails, one layer up.

### The cost lands as a FALSE ZERO, which is the worst shape it can take

Understating a busy college by 40% is bad. Reporting it as **zero** is worse, because
zero is not a smaller number — it is a different claim. It says *nothing is happening
here*, it closes the conversation, and **nobody files feedback about a door they were
told was not there.** Any surface that can render a measurement must distinguish three
states that are easy to collapse into one:

- **a real zero** — measured, and it is zero
- **not in this dataset** — no row; say that, never `0`
- **withheld** — suppressed for privacy; say that, never `0`

### Refreshing the copy does not fix it

The obvious repair is to repopulate the stale column from its source. That restores
today's numbers and **rebuilds the same trap**: two copies, one of which will lose its
writer again, failing silently the next time. The durable repair is to **delete the
second copy** so the question "which one is current?" cannot be asked.

Deleting has a prerequisite people skip: the remaining source has to actually serve
*every* shape the deleted one served. Here the live table served a single-college
lookup and nothing else, so removing the stale copy meant first teaching it to answer
the multi-college shape too. **A single source is only single once it covers every
caller** — otherwise deletion just moves the false zero somewhere new.

### Two copies also let a prompt promise what it cannot show

The prompt naming the table columns asserted *"it is given for every college below."*
That was true of the stale copy and false of the live one, so the instruction survived
the drift while its guarantee did not. **A prompt must not promise a number it cannot
show** — and when the promise and the data live in different files, nothing checks
that they still agree.

## How to spot it before it bites

- For any figure a user-facing surface renders, ask **"what writes this, and when did
  it last run?"** If the answer is a one-time seed, it is already drifting.
- **Join the two copies and diff them.** Three lines of SQL turned a single reported
  college into a measured 61%/40% understatement across 103 rows — that measurement is
  what made "delete it" obviously right rather than arguable.
- A timestamp column is worth more than it looks. `updated_at` on the stale table is
  what settled the question in one query; without it this would have been an argument.

## Guard

`tests/sierra_district_credit_figures.test.js` asserts the profile block emits **no**
per-college credit figures at all, and pins the live values for a real district — so
re-adding the second copy turns it red rather than quietly working.
