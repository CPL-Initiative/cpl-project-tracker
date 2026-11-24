---
title: A source that only checks the winner never wins
created: 2026-11-24
updated: 2026-11-24
tags: [methodology, recommendations, confidence, commons]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[commons_lessons]]"
artifacts:
  - kb/_build_local_subject_recommendations.py
  - tests/local_subject_recommendations_test.py
---

# A source that only checks the winner never wins

> **One-sentence summary:** when a recommender ranks some sources and only compares another against the winner, that
> other source can never lead, however strong it is; give every source a number and rank them all together.

## Context

The Commons' local subject title recommender ranked its measured sources (other colleges, the district, joined
courses, program titles) by their measured share. A web search on the college's own site was not ranked: it was
appended afterward as "agrees" or "differs" with whatever had won. At Clovis, MECH's one joined course (a condition
right 57.5% of the time) said *Law*; the college's own page said *Mechatronics/Industrial Automation*. The row read
Law, and its common code followed the title to LEGL. Sam caught it on 2026-11-24
([`commons_lessons`](../commons_lessons.md), S722).

## The claim

A source that can only confirm or contradict the leader is a veto at most, never a candidate. If it is evidence,
it belongs in the ranking with its own confidence, and the confidence may be **set** where no labeled set can
measure it, as long as the file says *set, not measured* and names the value (`WEB_SHARE`: 80 for a title on the
college's own site, 55 for a label). Sources that name the same answer then combine (1 − ∏(1 − share)), every
candidate shows its own bar, and the reader sees the weaker answers too, most confident first.

Group candidates by matching any member of a group, and show the most specific member. Grouping by the first title
alone let a short title ("Technologies") absorb and hide the full one.

## How we got here

`recommend_title` in `kb/_build_local_subject_recommendations.py` sorted the measured sources, then wrote the search
into `agree` or `differ`. The rewrite puts the search in `entries` beside the measured sources, groups, combines and
sorts. `tests/local_subject_recommendations_test.py` pins Clovis MECH and the candidate order.

## Where it applies

Any recommender that mixes measured sources with an unmeasured one: a curator's hint, a web search, a program label.
Rank it with a stated number, or say plainly that it is only a check.
