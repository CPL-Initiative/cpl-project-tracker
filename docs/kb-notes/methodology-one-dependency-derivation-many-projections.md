---
title: One dependency derivation, many projections
created: 2026-08-30
updated: 2026-08-30
tags: [methodology, dependency-map, cross-impact, scanners, governance, admin-tab]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-knowledge-base-needs-a-lint-pass]]"
artifacts:
  - kb/_build_dependency_map.py
  - kb/_build_governance_candidates.py
  - kb/_build_cobi_admin_surface.py
  - tests/dependency_map_test.py
---

# One dependency derivation, many projections

> **One-sentence summary** — when several tools each answer "who touches this
> data?" with their own scanner, they drift apart independently and each
> under-reports differently; derive the answer ONCE, from the code,
> adversarially verified, and make every other tool a projection of that one
> artifact.

## Context

By 2026-08-30 this repo held three independent answers to the same question.
The Admin tab scanned modules for tables (`kb/_build_cobi_admin_surface.py`),
the Governance drift detector scanned modules for human writes
(`kb/_build_governance_candidates.py`), and the new dependency map
(`kb/_build_dependency_map.py`, Sam's remediation A) scanned everything for
everything. Each had grown its own regex, and each regex had its own blind
spots. Lessons doc: `docs/doctrine_enforcement_lessons.md` (2026-08-30
section).

## The claim

**A dependency scanner is a liability in plural.** Two scanners over the same
ground do not disagree loudly — each silently misses a different subset, and
every miss reads as "nothing there," which on safety surfaces is the most
dangerous wrong answer available. The remedy is structural, not more regex:

1. **One derivation.** A single builder extracts every consumption idiom the
   code actually uses, is drift-checked in CI (`--check`), and is verified by
   adversarial sampling (independent refuters told to break its entries).
2. **Many projections.** Every other tool that needs the answer READS the
   derived artifact and projects it — a filter and a reshape, never a re-scan.
3. **A loop, not a fork.** The projection host can still own primitives the
   deriver imports (the Admin builder keeps the boot-dispatch parser; the map
   imports it). Reuse in both directions keeps either side from re-growing a
   private copy.
4. **Absence must be visible.** The one derivation carries an UNMEASURED tail
   and seed edges pinned to anchor regexes — a seed whose anchor stops
   matching drops its edges WITH a warning. A projection inherits this
   honesty for free; a private scanner has to re-learn it.

## How we got here

Measured, not argued. The governance scan required a slash after the REST base
and `method:` adjacency; the Admin scan could not follow helper wrappers.
Between them: **eight human-write Supabase tables invisible to the whole
governance layer at once** (`cpl_memory` among them — the table Rule 8 orders
every session to read), and the raci tab reporting `reads: [] writes: []`
while touching four tables. After the switch (#1397, #1398): 15 never-seen
human-write tables proposed for judgment, four tabs corrected, and both tools
now inherit every future idiom the map learns.

Two supporting findings worth carrying:

- **Direction lives at the fetch site, not the const line.** A table bound to
  a URL constant (`ADOPT_INTAKE = …/rest/v1/cpl_adoption_interest`) scored
  read-only while a `fetch(ADOPT_INTAKE, {method: "POST"})` sat 56 lines
  below. Follow the identifier to its uses before deciding read or write.
- **A noise guard breached by a better detector is raised with the reason on
  the record** (25→30 in `tests/governance.test.js`), never satisfied by
  suppressing genuine finds — and the comment says when to tighten it back.

## Scope and limits

The single derivation is only as good as its verification: two of three
adversarial samples found real defects on the first pass (a bulk PATCH
recorded read-only; a tempdir self-bake counted as a consumer). Sampling is
part of the method, not an optional extra. And a projection may still apply
its own JUDGMENT layer (the governance builder's write-shaped-RPC name
heuristic lives in the proposer, not in the map) — the split is measured
facts in the derivation, interpretation in the projection.
