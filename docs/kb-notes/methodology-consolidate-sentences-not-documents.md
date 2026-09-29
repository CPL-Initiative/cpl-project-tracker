---
title: "Consolidate sentences, not documents: what a course description is when fourteen colleges wrote it"
created: 2026-09-10
updated: 2026-09-10
tags: [methodology, curation, descriptions, ccr, skyview, clustering]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
---

# Consolidate sentences, not documents

Sam, 2026-09-10, ruling on the SkyView outline card:

> "I don't want to choose the single most representative description and
> attribute it to the college it came from. Doing so could lead to division as
> some faculty may question the choice. It's better to generate a description
> that best represents what most agree upon and note the few additional
> descriptive items to be added with a note that some colleges also include
> them. If we always provide a generative description and note such, it will
> allow the faculty reviewers the freedom to revise and accept by consensus."

The card had quoted the **medoid** — the description with the highest mean
similarity to the others — and named the college. Session 235's reason for that
was sound as far as it went: composing prose out of several catalogs "would read
as authoritative while belonging to nobody." Sam's objection is about a cost
that reason never priced. Naming a winner is a curatorial act performed in
public, and the losers are faculty.

## Both constraints can hold at once

Keep the unit small enough that nothing is composed, and no document wins.

- The unit is the **sentence**, not the document. Every sentence on the card was
  written by a college.
- The selector is **agreement**, not typicality: a sentence carried by a
  majority of the catalogs, in near-identical words.
- **No college is named.** A sentence most of them wrote is nobody's in
  particular.
- What only some colleges add appears under *Some colleges also include*, with
  its count.

His own earlier words describe exactly this: *"a consolidation of all without
repetition."*

## Complete-link, and the threshold is a consequence

Cluster near-identical sentences by Dice on content words. The clustering
**link** matters more than the threshold, and getting this wrong produces a
confident wrong answer rather than a noisy one.

Single-link — a sentence joins if it clears the bar against *any* member —
chains. Measured over 400 identities:

| link | threshold | majority-supported sentence exists | clusters holding a pair under 0.25 |
|---|---|---|---|
| single | 0.4 | 64% | **10.1%** |
| single | 0.5 | 50% | 4.5% |
| **complete** | **0.3** | **64%** | **0.0%** |
| complete | 0.5 | 46% | 0.0% |

Complete-link at 0.3 reaches exactly as far as single-link at 0.4 with no drift
at all, because every pair in a cluster clears the bar by construction. The
chains it prevents are real: *"the fundamentals of acting in film and
television"* was welded to *"acting in film and television commercials, episodic
screen work"* through a third sentence touching both, and the card then reported
a shared sentence no two colleges shared.

The threshold moved from 0.5 to 0.3 because the rule got **stricter**, not
looser. A number that falls is not always a standard that slipped.

## Order by position, not by popularity

ITIS M1449's card opened *"Key topics include text preprocessing, syntactic and
semantic parsing…"* — a mid-description clause that carried a majority while
four differently-worded opening sentences each carried one. A description that
starts mid-thought is a worse artifact than any of the catalogs it came from.

Each sentence carries its relative position in its own description; a cluster
takes the median. The consolidation reads in the order the colleges wrote it.
Support still orders the held-out list, where the question is *how many*, not
*where*.

## Administration is what colleges copy from each other

**The most-shared sentences in the corpus are not descriptions.** PLGL M1026's
four colleges agree on exactly one thing:

> Lec Hrs: 24.00 Out of Class Hrs: 48.00 Total Student Learning Hrs: 72.00

Skip this filter and the machinery faithfully promotes that to a unanimous
consensus description. Advisories, prerequisites, hour counts, repeatability
notes, transfer codes and cross-references are 2.9% of sentences and a far
larger share of the agreed ones, because administration is the part every
college copies from a template.

Three details decided by data, each of which broke something first:

1. **Strip a numeric heading; drop a prose one.** `Lec Hrs: 24.00 … Current
   developments in the substantive law…` is one sentence — the hour block runs
   straight into the description with no full stop. Dropping the sentence for
   its heading deleted the only description four colleges had. A numeric value
   has a knowable end; `Advisory: EWRT 211 and READ 211…` does not, so those
   sentences still go whole. 71 sentences in a 1,500-identity sample carry real
   text after their numbers.
2. **A record dump needs its own title stripped.** ENTR M1004 led all seven of
   its catalogs with `ENP-51 : Entrepreneurship Basics Prerequisite: None
   Entrepreneurship has been described as…`. The course code, the inline
   `Prerequisite: None`, and the course's own title all have knowable ends. What
   follows a prose-valued key mid-sentence does not, and is left alone — some
   header text survives onto a card, and that is a data-quality item, not a
   reason to widen a regex until it takes prose with it.
3. **A sentence can end `.)`.** `(See general education pages for the
   requirement this course meets.) Advisory: EWRT 1A…` never splits for a
   splitter that wants a full stop followed by a space, so the advisory stops
   being at the front of anything and the whole administrative block leads the
   card. Worse, `(Also listed as CHLX 26.) This course is an introduction to the
   study of race.` is one sentence beginning with a cross-reference — so the
   description is *deleted*, not merely mis-ordered.

## `"".indexOf("")` is 0

The bracket-aware scan hung the page. `charAt` past the end of a string returns
`""`, and `indexOf("")` returns 0 on every string, so an unguarded
`")]".indexOf(t.charAt(i+1+n)) >= 0` is true forever at the end of every
description. The character has to exist before it can be a bracket.

## What the card says when there is nothing to consolidate

- **A majority share a sentence** (82% of identities with two or more real
  descriptions): the consolidation, then what only some add.
- **They share nothing**: say so, and show all of them. Promoting the best of a
  field of singletons is the move Sam ruled out, performed quietly.
- **Every field is administration**: say that instead, and point at the member
  list. The first draft printed *"all of them are below"* above an empty list.

Three different silences, three different pieces of work for a curator. A card
that renders them identically hides two of them.

## Not done

C-ID and CCN identities should take the statewide descriptor. MAP holds the
**designation**, not the descriptor text — 541 of 49,896 identities (484 C-ID,
57 CCN). Those cards name the descriptor as the authority and say MAP does not
hold it, rather than presenting a consolidation as if it were the statewide
text. Loading the descriptors is the fix, and it is a data feed, not a rendering
change.

## See also

- `prototype/ccr_universe.js` — `olSentences`, `olDescPart`, `olConsensus`
- `tests/ccr_skyview_outline.test.js` §12–13
- [`methodology-the-obvious-detector-measures-the-wrong-thing`](methodology-the-obvious-detector-measures-the-wrong-thing.md)
