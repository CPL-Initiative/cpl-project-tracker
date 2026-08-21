---
title: A crosswalk's value is the lint, not the mapping
created: 2026-08-21
updated: 2026-08-21
tags: [methodology, identity, data-quality, joins, crosswalk]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-validate-a-code-column-by-its-structural-invariant]]"
  - "[[docs/college_identity_lessons]]"
artifacts:
  - kb/_build_college_identity_crosswalk.py
  - kb/college_identity/2026-08-21/crosswalk.json
---

# A crosswalk's value is the lint, not the mapping

> **One-sentence summary** — A crosswalk that only maps what it was handed cannot
> tell you what it **missed**, and the misses are where the damage is: every
> unmapped name is a string some consumer keys on, joining to nothing.

## Context

The college/district identity crosswalk was built in August 2026 and resolved
116 of 116 colleges with zero unresolved — a clean result that said nothing
about the names it was never shown.

Feeding it a second input — **every college-name string observed in a live
table** — turned it from a mapping into a lint, and it immediately found a
production defect nobody had reported.

## The claim

**Add an "observed" input and report what resolves to nothing.** Classify the
residue, because the classes need different fixes:

| Class | Meaning | Fix |
|---|---|---|
| `whitespace` | Normalises to a known identity but is not byte-identical | **A defect in one row's data.** Silently breaks exact-match joins |
| `spelling` | A genuine alias | Fold into `variants` |
| `credit_twin` | `X Credit` beside `X` | **A curator decides** — never fold automatically |
| `unknown` | Claimed by nothing | Test rows, out-of-scope institutions, real gaps |

### The find that justifies the whole approach

`map_college_contacts` held `"Cypress College "` and `"San Jose City College "`
— **with a trailing space**. Both carried a real `primary_contact_email` and a
named CPL coordinator. Neither exact-matched `map_colleges`.

So the contact index was built under a key nothing ever looked up, and both
colleges rendered as having **no CPL contact** — silently, because *a missing key
is indistinguishable from a college that genuinely has none*.

## Fix the join, not the data

⚠️ The contacts table is rebuilt from the upstream system nightly, so trimming it
puts the space back tomorrow — and **a load must reproduce its source, not
improve it**. The join is what has to tolerate the variance, which is what a
populated `variants` column is for.

⚠️ **A variant must never shadow another entity's canonical name.** "Mission
College" is a real college *and* a plausible variant of "Los Angeles Mission
College". Letting a variant win attaches one college's coordinator to another —
worse than the blank being fixed. Build the alias index in a **second pass**,
after every canonical name is known, and skip any variant that collides.
Measured: zero collisions in the live data, so the guard is *preventive*.

## Also: a missing value is a finding only for the class it applies to

Four entities correctly carry no MIS code — partners are not in a registry of
community colleges. Filing them as "unresolved" would push that counter off zero
permanently, **which is how a real regression gets lost.** Record a *reason*
instead, keyed on the entity kind.

## How we got here

Built 2026-08-12, written and linted 2026-08-21 (PR #1278). 13 of 133 observed
names resolved to no identity. Two of them were the live defect above.
