---
title: Provenance is the spine of a generated document, not a footnote on it
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, ui, provenance, ccr, ai-generated]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/ccr_universe.js
---

# Provenance is the spine of a generated document, not a footnote on it

> **One-sentence summary** — When a document mixes authoritative, reported and
> machine-written values, the label saying which is which has to sit on every
> field, because a reader cannot tell them apart from the text.

## Context

The CCR course outline (SkyView, 2026-09-05) puts four kinds of value on one
page for a single common course: an official C-ID descriptor where one exists,
figures colleges reported to the Chancellor's Office, a description and a
competency list the platform wrote from member catalog text, and whatever a
curator has since edited. They read identically as prose. Only 484 of 16,478
clustered identities carry a C-ID at all, so for **97%** the page is
platform-written and reported values with no authority text anywhere.

Sam's ruling, 2026-09-05: *"A synthetic description can be shown as long as it
is clearly labeled MAP-Generated for faculty consideration and revision before
use."*

## The claim

**A generated document needs provenance as its organizing structure, not as a
disclaimer at the top.** One banner saying "some of this is machine-written"
does not tell a reader which sentence to distrust, and a reader who cannot tell
either distrusts all of it or none of it — both wrong.

Three rules that follow:

1. **The label travels with the text.** It sits beside the field it describes,
   so a value copied, quoted or read aloud out of context carries its own
   standing. A page-level notice is lost the moment anything is excerpted.
2. **Name the tier, and use the owner's words for it.** *MAP-Generated for
   faculty consideration and revision before use* is Sam's phrasing and it does
   work that "AI-generated" does not: it says who made it, what the reader is
   expected to do with it, and that using it before revision is not the
   intended path.
3. **Show the evidence base, not just the tier.** A description drafted from 24
   member catalogs and one drafted from a single college's paragraph carry the
   same tier and very different weight. The count belongs next to the label —
   and where the evidence is thin, the interface should say so rather than
   present the same badge on both.

## Consequences

- **Measure the evidence base before promising synthesis.** Of 16,478 clustered
  identities, 90.4% have ≥2 member descriptions, 46.4% have ≥3, 23.5% have ≥5.
  All 33,418 stand-alone courses have exactly one — "synthesis" there is
  tidying one college's paragraph, and calling it synthesis overclaims.
- **A tier is not a quality score.** *Reported* values carry real variance: the
  units on one welding identity run 0 to 5 across 22 colleges. Showing the modal
  value alone would have implied an agreement that does not exist, so the
  outline shows the mode with its spread.
- **An unlabeled machine-written field is worse than an absent one.** Where a
  generated value reaches an external surface — a Career Passport, a college's
  evidence file — the label is what stands between a useful draft and a
  fabricated record.

## Write it as breadth, never as a standard

A description synthesized across many sources is describing **what the field
looks like**, not what any one contributor should have done. The wording has to
carry that, or the artifact quietly becomes an audit.

The welding description drafted from 24 college catalogs ends:

> Colleges commonly add brazing and soldering, plasma cutting, welding symbols,
> and basic metallurgy.

Sam, on reading it: *"I love the way you noted in the description, 'Colleges
commonly...' — takes the bite out of it for colleges who don't cover all those
things."*

Six of the twelve elements were named by a minority — 25% down to 12.5%. Stated
flatly ("the course covers brazing, plasma cutting, welding symbols and basic
metallurgy") the same sentence would tell three quarters of the contributing
colleges they had fallen short of a standard nobody set. **The majority core and
the minority additions are different claims and must read differently.**

⚠️ This is the same failure the gap panel had to be rescued from: a
one-directional comparison reads as an audit of colleges and invites
defensiveness from the people whose cooperation the work needs. A generated
document assembled *from* a community's contributions is in a poor position to
grade that community. Describe the distribution; let the reader locate
themselves in it.

## Counter-signals

Provenance chips become noise when everything on a page shares one tier: a
table entirely of reported values needs one caption, not a badge per row. The
structure earns its place only where tiers are genuinely mixed and the reader
must act differently depending on which they are looking at.
