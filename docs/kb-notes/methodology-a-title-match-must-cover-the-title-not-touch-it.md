---
title: A title match must cover the title, not merely touch it
created: 2026-09-16
updated: 2026-09-16
tags: [methodology, matching, crosswalk, occupations, soc, data-quality]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-an-articulation-college-list-belongs-to-the-group-not-the-course]]"
  - "[[docs/regional_cpl_opportunity_lessons]]"
artifacts:
  - kb/_build_regional_cpl_opportunity.py
---

# A title match must cover the title, not merely touch it

> **One-sentence summary** — When you match two titles by shared words, require
> the shared words to account for a real share of the thing you are matching
> FROM; a single shared token produces matches that read plausibly, survive a
> rarity test, and are wrong.

## Context

Crosswalks in this repo repeatedly need to ask "is this occupation the same thing
as this program" without a shared identifier. The obvious approach is to compare
titles: tokenize, stop the connective words, and call any overlap a candidate.

That approach has a failure mode that hides in plain sight, because every wrong
answer it produces is a real occupation matched to a real program.

## The claim

**Score the overlap against the length of the source title, and require it to
cover at least half. Rarity is not a substitute.**

Measured 2026-09-16, matching 541 COE occupations against one college's programs:

| Rule | "Adopt now" rows | Verdict |
|---|---:|---|
| any shared token, plus a rarity test | **233** | wrong — Delta's comparable figure was 42 |
| shared tokens must cover ≥ 0.5 of the occupation title | **24** | plausible |

The rows the coverage test removed were not marginal. *Diagnostic Medical
Sonographers* matched **Medical Assisting** on `medical`. *Security and Fire Alarm
Systems Installers* matched a **Solar Photovoltaics** program on `system`.
*Sales Representatives, Wholesale and Manufacturing* matched **Advanced
Manufacturing**.

### Why the rarity test fails

Rarity is measured against the corpus, and these corpora are small. A college
holds roughly 150 programs, so "appears in at most 2% of documents" means
"appears in at most three programs" — and *medical*, *manufacturing*, *equipment*
and *commercial* all clear that bar while carrying almost no discriminating
meaning. **A word can be statistically rare and semantically generic at the same
time**, and a term-frequency test cannot tell the difference.

Coverage can, because it asks a different question: not *is this word unusual*
but *does what we matched account for what the thing IS*.

## Corollary: a title that contains an exclusion must be read as one

SOC titles carry negations in ordinary prose. *Dispatchers, Except Police, Fire,
and Ambulance* is explicitly **not** about police or fire, and tokenizing the
whole string matched it to a police academy. *Metal Workers and Plastic Workers,
All Other* is a residual category.

Strip `except …` and `, all other` clauses before tokenizing. The clause is doing
semantic work in the opposite direction from every other word in the string.

## What is still open

Coverage does not finish the job. The single-shared-token path — where the
occupation title is short enough that one word covers half of it — still admits
*Commercial Pilots* against *Commercial Music*. Resist fixing that with a
hand-written list of forbidden words: on this repo's crosswalk lineage that
rebuilds, one word at a time, the hand-curated map the mechanical matcher exists
to avoid.

The defensible route is a labeled test set. The Delta run produced **139 human
rulings for one college**; a mechanical matcher can be scored against them and
carry a published error rate, which is what lets a match be argued with rather
than merely asserted.

## Scope

Any title-to-title match without a shared key: occupation to program, occupation
to credential, course to course, credential to exhibit. It does not apply where a
real identifier exists — join on the identifier.
