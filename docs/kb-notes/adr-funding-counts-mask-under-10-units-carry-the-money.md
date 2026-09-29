---
title: ADR — Public funding figures mask student counts under 10; units carry the money; dollars coarsen on the public page
created: 2026-09-03
updated: 2026-09-03
tags: [adr, privacy, pii, funding, implementation-funding, sec-10]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[adr-funding-priority-metrics-privacy]]"
  - "[[adr-cer-student-impact-counts-privacy]]"
  - "[[methodology-standing-pii-guard]]"
artifacts:
  - funding/_build_funding_performance.py (SUPPRESS_BELOW, suppress())
  - cpl_funding.js (collegeMoney / collegeMoneyK, suppressFloor)
---

# ADR — Funding figures on the public page: counts mask under 10, units carry the money, dollars coarsen

> **Status: RATIFIED** (Sam, 2026-09-03 — *"Yes, go for it!"* on the package
> below). Supersedes decision 2 (the floor of 5) and the units-follow-count
> practice of [[adr-funding-priority-metrics-privacy]]; that ADR's other
> decisions stand.

## Context

The Implementation Funding tab and its public explainer show, per college,
how many students reached each funnel rung and how much funding those rungs
earn. The 2026-06-11 ADR masked per-college counts of 1–4 as "<5" and masked
the matching unit sums with them, so a masked count earned nothing. Two
things then happened. Sam exempted the portal-origin counts from the mask
(`pp`, 2026-07-27; `ppa`, 2026-08-27) precisely because a masked count could
not pay a college. And on 2026-09-02 a newer portal-origin count (`ppe`, the
Access band's measure) that had *not* been exempted read, beside its raw
sibling, as a data anomaly that did not exist, while 54 small-portal colleges
sat at $0 on Access for the same reason.

## Decision

Sam, 2026-09-03, verbatim: *"On the public view, the student count for low
numbers should actually be changed to <10 to conform with ferpa practices
often used. That said, I would still like to compute the numbers in the FTES
total and funding. I think this is sufficiently buried to protect privacy."*
The package he approved:

1. **Counts mask under 10, every metric alike.** A per-college student count
   of 1–9 bakes as `null` + `_suppressed`, rendered "<10". Exact zero stays 0.
   The portal-origin carve-outs are retired: a public rule keeps no exception
   for one group of students, and their reason (see 3) is gone. The floor is
   the same one the CR-backlog artifact adopted on 2026-08-10.
2. **Where the file is read, the mask applies.** The artifact is committed by
   the daily workflow and served on the public site, so the internal COBI tab
   sees the same "<10" until a gated internal copy exists (the public/private
   split lane).
3. **Unit sums are never masked; the money computes on the true numbers.**
   Units, CPL FTES and dollars describe credit, not people, and a masked count
   that earned nothing was a funding error dressed as a privacy measure.
4. **Complementary masking.** When exactly one college is masked for a metric,
   the smallest visible college is masked too (`_complementary`), so the hidden
   count cannot be read off the statewide figure by subtraction. Counts only.
5. **Dollars coarsen on the public page.** A college's figures are floored at
   "<$1,000" and rounded to the nearest $1,000 above it, row totals included,
   so subtracting visible measures cannot recover a masked one. $0 stays $0
   ("posted nothing" is a state, not a small amount). The curator view keeps
   exact dollars: this is a formatting rule, since dollars are computed on the
   page.
6. **The rate and the explanations stay public.** What dollars deconstruct to
   is units, never students; the rate is derivable from figures public by
   statute; and the explainer exists to explain.

## Consequences

- Small colleges read "<10" on counts but see their real CPL FTES and their
  funding; the 54 colleges at $0 on Access begin earning on the next rebuild.
- Per-college units become visible for masked colleges (they were nulled
  before). That is the deliberate trade in decision 3.
- The public dollar rule lives in `cpl_funding.js` (`collegeMoney`,
  `collegeMoneyK`) and is pinned by `tests/cpl_funding_public_dollars.test.js`;
  the builder rules by the four Python funding suites.
- A future threshold change still gets its own ADR (decision 6 of the 2026-06-11 ADR).

---

*Authoring check: durable (policy outlives the build), reusable (any public
per-college outcome figure), distilled (one package), self-contained.*
