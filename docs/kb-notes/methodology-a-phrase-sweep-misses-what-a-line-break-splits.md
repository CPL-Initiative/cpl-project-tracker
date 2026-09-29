---
title: "A phrase sweep misses what a line break splits"
created: 2026-08-31
updated: 2026-08-31
kb-status: published
tags: [methodology, sweeps, vocabulary, prose, tooling]
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-funding-is-restricted-by-its-earning-rule-not-by-a-label]]"
---

# A phrase sweep misses what a line break splits

## The failure

Renaming a multi-word phrase with a literal find-and-replace looks exhaustive
and is not: prose in this repo is hard-wrapped at ~80 columns, so any two-word
phrase eventually appears as `Word␊Word` — first word at one line's end, second
at the next line's start — and a literal `"Potential Total"` replacement walks
straight past it. The result is worse than an unswept file: a **mixed-
vocabulary** document in which most occurrences carry the new term, so a
spot-check confirms the sweep "worked" while the old term still renders.

Worked instance (2026-08-31): Sam renamed a funding label, `replace_all` swept
every same-line occurrence of the old phrase, and one occurrence split across a
wrap survived — inside the visible planning note of a page built for his
reaction.

## The guard, in two parts

1. **Sweep with whitespace-flexible matching**, not a literal: the target is
   `Potential\s+Total` (any whitespace, newlines included), never
   `"Potential Total"`. If the tool only does literal replacement, re-wrap or
   normalize first — or accept that step 2 is doing the real work.
2. **Always pair a sweep with a residual scan for the distinctive WORD, not
   the phrase.** After the rename, grep the one word that should no longer
   exist at all (`Potential`) over everything the reader can see — rendered
   output included, not just the source. The word-level scan cannot be
   defeated by wrapping, punctuation, or markup splitting the phrase. That
   scan, not the sweep, is what caught the instance above — in the same run.

## Scope

This is the mechanical sibling of the existing sweep doctrine: the
`american_spelling` / CCC-vocabulary rules say **where** a sweep may act
(prose only, never identifiers — `prose_only()` masks code spans). This note
says **how a phrase target escapes** even inside legitimate prose. Both apply
to every rename: naming-convention changes, vocabulary rulings, label
renames on any surface a human reads.

The test for done is never "the replace reported N substitutions." It is "the
residual scan reports zero."
