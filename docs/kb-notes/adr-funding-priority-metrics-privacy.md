---
title: ADR — Per-college funding-priority metric counts in the public dashboard (aggregate + suppression)
created: 2026-06-11
updated: 2026-06-11
tags: [adr, privacy, pii, funding, implementation-funding, sec-10]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-standing-pii-guard]]"
  - "[[adr-cer-student-impact-counts-privacy]]"
  - "[[docs/funding_priority_metrics_scope]]"
artifacts:
  - docs/funding_priority_metrics_scope.md (the build scope this gates)
---

# ADR — Funding-priority metric counts (per college) in the public dashboard

> **Status: PROPOSED** (defaults mirror the ratified CER student-impact ADR;
> Sam ratifies or adjusts before the producer ships).

## Context

The Implementation Funding model pays against three priority metrics. P2/P3
are derivable per college from `View_StudentAggregatedValues` — a
**per-student-grain** (pseudonymous `MAP Internal StudentID`; name/DOB/real-ID
columns are deliberately never fetched) view that exists transiently on the
CI runner each daily run. Publishing "students meeting the metric" per
college on a public dashboard is a re-identification surface if counts are
small.

## Decision (proposed defaults)

1. **Aggregate counts only.** The committed artifact carries per-college
   COUNTs (and statewide sums); the pseudonymous student grain is never
   written to any committed/published file. `MAP Internal StudentID` is used
   exclusively as a distinct-count set key (the established
   `_compute_college_military_students` pattern).
2. **Small-cell suppression at <5** (the CER credential-rollup precedent):
   a per-college metric count of 1–4 is baked as `null` + `"suppressed"`,
   rendered "<5". Exact zero stays 0 (absence isn't re-identifying).
3. **Producer-side suppression** — the artifact is clean as committed; the
   consumer never sees the exact value (same reasoning as the standing
   guard: guards must pass on committed data).
4. **Standing-guard fold-in is part of the producer PR**: the new artifact
   joins `tests/pii_guard.test.js` EMAIL_FILES *and* gets a small-cell scan
   in `tests/cpl_funding.test.js` (no integer 1–4 in metric-count fields).
5. **Cron-artifact lifecycle** (unlike the static model data): computed
   from the fresh CustomReport each daily run → the workflow `git add` list
   and the §6 documentation must include it.
6. **Threshold changes get their own ADR** (per the standing-guard note —
   it's a policy call, not a constant).

## Consequences

- Small colleges' early progress reads "<5" until they cross the threshold —
  accepted (matches CER behavior; the alternative leaks).
- The tab can show "actual vs target" per priority without ever holding
  student-level data client-side.
- P1 (completions) is out of scope for this ADR until a completion source
  exists (see the scope doc) — the same rules will apply to it.

---

*Authoring check: durable (policy outlives the build), reusable (any
public per-college outcome count), distilled (one decision), self-contained.*
