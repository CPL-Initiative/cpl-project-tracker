---
title: A score measured in one population is not a score in another
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, partner-crosswalks, matcher, disclosure]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - college_briefing.js
  - kb/_score_occupation_matcher.py
  - kb/_emit_regional_opps_data.py
---

# A score measured in one population is not a score in another

> **One-sentence summary** — an accuracy figure carries the population it was
> measured on, so quoting it beside a different population presents a
> transferred number as a local one, and the page has to say which it is.

## Context

The occupation matcher was scored at precision 0.907 / recall 0.51 against 139
occupations a human ruled at San Joaquin Delta College. That caveat then shipped
on a **Bay Region** register covering 28 different colleges and a different
occupation list. Same sentence, different population, no signal to the reader.

## The claim

**Publishing a measured score obliges you to publish where it was measured, and
to say so when the reader is looking at somewhere else.** A disclosure that
names only the figure is weaker than it looks: readers reasonably assume a
number printed above a table describes that table.

This is not an argument against shipping the score. A measured caveat beats an
unmeasured one and beats silence. It is an argument that **the caveat has two
parts** — the figure, and its provenance — and that only shipping the first is
how a reader comes to trust a number that was never about their data.

### Derive the transfer warning; do not write it

The register computes whether the scoring college appears in the register's own
college list. Outside it, the page adds a sentence; inside it, the sentence does
not render. Nobody maintains a second fact, and a future Central Valley register
— which *does* contain Delta — loses the warning automatically, correctly, with
no edit.

**A caveat that always renders is boilerplate, and boilerplate stops being
read.** Deriving it is what keeps it informative, and the test asserts both
directions for exactly that reason.

### Keep the figures in the data, not the view

The score travels inside the data file's `meta.accuracy`, so a re-score and a
re-emit move the page together. A caveat quoting a stale score is worse than no
caveat: it is a specific, checkable, wrong claim.

## How we got here

Built on 2026-09-17 for Sigrid's meeting with the Bay Area Strong Workforce
consortium. The lane file had already recorded the mismatch in a different
form — only 17 of the 139 Delta rulings match the Bay's occupation list by
title, and all 17 are electrical or mechanical, an artifact of SJCOE's IBEW
roster, while the Bay's demand runs to health care, early childhood and
transportation. The score was measured on one of those mixes and printed above
the other.

Shipped in [#1591](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1591).

## When this applies (and when it doesn't)

Applies to any measured quality figure shown beside data it was not measured
on: matcher accuracy, model evaluation, a sampling error rate, a coverage
percentage. It applies hardest when the same instrument is pointed at a new
population, because the instrument is unchanged and so the number *feels*
portable.

It does not apply when the measurement population and the display population are
the same — there the provenance line is noise, which is precisely why the
sentence should be derived rather than pasted everywhere.

It is also not a reason to withhold the figure. Sam's ruling on 2026-09-16
stands: known gaps are acceptable when disclosed. This note says the disclosure
has to include *where the number came from*.

## See also

- `[[docs/regional_cpl_opportunity_lessons]]` — the workstream
- `[[docs/reference/lanes/partner-crosswalks]]` — lane state
- PR `#1591` — the register and the derived caveat

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
