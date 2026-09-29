---
title: A dropped row still needs its own name
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, ui, data-quality, disclosure, my-college]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - kb/_emit_regional_opps_data.py
  - college_briefing.js
---

# A dropped row still needs its own name

> **One-sentence summary** — when a view drops most of its rows to become
> readable, the rows that leave carry distinctions the reader still needs, and
> collapsing them into a single "nothing here" reports something false about
> every one of them.

## The claim

A filter that removes 80% of a dataset makes two decisions, and only one of them
is the one being asked for. The first is *stop showing these*. The second,
usually unnoticed, is *stop distinguishing between these*.

The occupation register in the My College tab listed every occupation a region
trains for against one college's catalog. Sam's instruction was one line: **"No
need to list items where the college has no aligned course or program."** That
is `fit == "none"`, and it is 12,170 of 15,148 rows across 28 colleges.

Dropping them is right. Dropping them into one bucket would have been wrong,
because "no aligned course or program" covers three different situations:

- California holds a credit recommendation for this work and **this college does
  not teach toward it** — a live question for a regional consortium, and the
  answer to "what should we build next?"
- The college is **already on the exhibit** and no program matched. Thirty-two
  rows in a set of fifteen thousand. Almost certainly the matcher missing a
  program, and the single most useful thing a curator could look at.
- **Nothing anywhere in California** covers this occupation. Genuinely nothing
  to say.

One drawer headed "occupations with nothing found" would be accurate for the
third and false for the first two. The first has a credit recommendation sitting
ready. The second is the college's own adoption, reported back to it as an
absence.

## Why the distinction survives the drop

The reason is recall. This register's matcher finds roughly half of what a human
reviewer finds, so an absence is unconfirmed rather than established. Every
dropped row is a claim the room can correct, and a person can only correct a
claim they can see. **Counts cannot be corrected; names can.** Someone reads
"Dental Hygienist" in a list of things their college supposedly does not teach
and says so out loud, which is the whole point of showing a college its own data.

## The test

Before collapsing a set of rows into a summary, ask what a reader could do with
each one if it were still visible. Where the answers differ, the bucket has to
split. Where they are the same, one bucket is honest.

This is cheap to get right at the moment of writing the filter and expensive
later: the collapsed version looks finished, reads as tidy, and gives no signal
that it is answering three questions with one word.

## When this does not apply

A genuinely uniform drop needs no ceremony. Pagination, a search that matched
nothing, rows excluded by a filter the reader set themselves — in each of those
the reader already knows what left and why. The rule bites when **the system**
decides what to hide, on a rule the reader never saw, in a view whose whole
purpose is to tell them what is true about them.

## See also

- PR `#1594` — the three drawers
- `[[methodology-a-score-measured-in-one-population-is-not-a-score-in-another]]`
- `[[docs/reference/lanes/partner-crosswalks]]` — the lane

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
