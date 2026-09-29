---
title: A filter must be able to see what you are about to declare missing
created: 2026-09-11
updated: 2026-09-11
tags: [methodology, data-quality, absence-claims, classifiers, crosswalk]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-follow-the-recommendation-to-the-course-that-receives-it]]"
  - "[[methodology-shared-prose-over-claims-on-rows-it-was-not-written-for]]"
  - "[[docs/statewide_fire_electrical_crosswalk_lessons]]"
artifacts:
  - kb/fire_electrical_domain_map.json
  - kb/occupation_crosswalk_out/2026-09-11-fire-electrical-statewide/
---

# A filter must be able to see what you are about to declare missing

> **One-sentence summary** — When a classifier decides which rows enter an analysis, its
> false negatives do not surface as errors; they surface as **absence**, and absence is
> the finding people act on.

## Context

This repo already has two notes about absence. One says separate *"no exhibit exists"*
from *"nobody has looked"*. Another says never let authored prose assert an absence the
data contradicts. Both assume the row reached you. This note is about the layer before
that: **the filter that decided which rows exist at all.**

## The claim

**Before publishing "X does not exist", run the inverse query: what would X look like in
this data, and can my filter match it?**

A missing row and a correctly-excluded row are indistinguishable in the output. Nothing
renders. No count goes wrong. No guard fires — the absence-claim guard checks prose
against matched data, and here there *was* no matched data to contradict.

### The worked case

A statewide crosswalk classified California Community College programs into lanes with a
title regex. The electrical lane matched:

```
electric|electrician|lineworker|line worker|photovoltaic|solar
```

It reported that the **lineworker / utility cluster — 16 of 60 occupations — had no
college pathway in California.** That went into a partnership document and into a reply
to the person commissioning it.

It was wrong. **Six colleges run 18 active lineworker programs.** The regex matched
`lineworker` and `line worker` but not **`Lineman`** or **`Powerline`**, and California
colleges overwhelmingly use those two:

| College | Programs |
|---|---|
| Santiago Canyon | Apprenticeship: Power **Lineman** (Cert + A.S.) |
| Los Angeles Trade-Technical | **Powerline** Mechanic (A.S.) · **Powerline** Worker: Pole Climbing · Electrical **Lineman** Apprenticeship · Utility Industry Fundamentals |
| San Diego City | **Lineman** (A.S. + Cert) · SDG&E **Lineman** Apprenticeship · two San Diego Trolley **lineman** apprenticeships |
| Imperial Valley | Apprenticeship: Power **Lineman** (Cert + A.S.) |
| Mission | Overhead Line Worker |
| College of the Desert | Power Generation and Distribution |

**The cost was not the missing rows. It was the conclusion they licensed.** "No college
teaches this" points a partnership at building a program from nothing. "Six colleges
teach it and a national credit recommendation already exists" points it at adopting one.
Opposite work, same blank output.

## How to check

- **Query the inverse before asserting absence.** Search the source for the *concept*
  with the widest net you can stand, then read what comes back and decide what to
  exclude. Here: everything matching `lineman|powerline|line work|transmission|
  distribution|utility` was 78 programs; reading them showed the electrical ones and the
  automotive-transmission and warehouse-distribution noise that had to go.
- **The exclusion list is the artifact worth keeping**, not the inclusion list. Write it
  down with its reason — "transmission and distribution are dominated by automotive and
  logistics programs" is the sentence that stops the next session widening the net and
  drowning.
- **Ask a second instrument.** The correction here came from external research finding
  Santiago Canyon's program and contradicting the local data — a disagreement between
  two sources is cheap, and it is what surfaced the miss.
- **Name a synonym set for every domain term.** Lineman / lineworker / line worker /
  powerline / power line / outside line are one occupation with six spellings.

## Consequences and caveats

- **This applies hardest to absence, but not only.** A false negative in a filter also
  under-counts anything downstream of it; absence is simply the case where nothing in the
  output hints that a check is needed.
- **A wide net is not free.** Widening `distribution` pulls in warehousing and logistics;
  widening `transmission` pulls in automotive transaxles. The answer is to widen, *read*,
  and exclude explicitly — not to widen and ship.
- **Say it plainly when you correct it.** The document that carried the wrong finding
  should carry the correction in the same voice and the same prominence, including what
  was *not* wrong — here, that no MAP exhibit exists for those occupations, which was
  correct and still stands.
