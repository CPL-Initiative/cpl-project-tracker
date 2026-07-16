---
title: Infer required-core coursework from embedded-certificate structure when the catalog flag is missing
created: 2026-07-16
updated: 2026-07-16
tags: [methodology, cpl-pathways, coci, program-course, method-and-magic, inference]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_pathways_lessons]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - kb/_build_cpl_pathway_membership.py
  - cpl_pathways.js
---

# Infer required-core coursework from embedded-certificate structure when the catalog flag is missing

> **One-sentence summary** — COCI's program→course membership carries no
> required/elective designation (it lives only in local catalogs), but a course
> that sits inside an *embedded Certificate of Achievement* is a strong,
> structural proxy for "required-core," and field-family frequency ranks
> foundational-vs-niche within that — so you can list required work first without
> the catalog, as long as you label it inferred.

## Context

The CPL Pathways reframe (`#810`, StarMora) needed to list an associate degree's
courses **required-first**, then the rest. The authoritative program→course join
(`program_course_graph.json`, from the CCCCO Data Mart Program Course File) has
every course a program contains but **not** whether each is required, an option,
or an elective — COCI never collects that; it's a local-catalog / CTDL layer.
Sam asked for "method & magic" to differentiate at least the required core. This
note is the pattern that answered it.

## The claim

When you have a credential's full course list but no required/elective flag,
**infer a required-core ordering from the credential family's own structure**:

1. **Embedded certificates mark the core.** In CCC CTE, a Certificate of
   Achievement is itself a required, standalone credential, and the degree
   *embeds* it — detectable directly as `cert.courses ⊆ AS/AA.courses`. A course
   that belongs to an embedded certificate is treated as **required-core**; a
   course in the degree but in *no* embedded cert is an **option/elective**.
2. **Field-family frequency ranks within the core.** Count, for each course, how
   many credentials in the college's field family (the degree + its embedded/
   sibling certs) contain it. Foundational courses recur across the family
   (Intro, Work Experience, the discipline's fundamentals); niche courses appear
   in one specialized cert. Rank required-core by descending frequency.
3. **Label it inferred; the catalog is authoritative.** This is a structural
   proxy, never the college's official requirement list — surface it as an
   inferred "core" badge with a tooltip that says so, and keep it out of any
   determination that must be authoritative.

## How we got here

Validated on Santa Ana College's Automotive family (TOP 0948) before building it
in: 23 credentials (2 A.S., 1 B.S., 16 certs, 4 noncredit). The primary A.S.
"Automotive Technology" (16 courses) embeds **7** certificates; every one of its
16 courses is in ≥1 embedded cert, and frequency separates them cleanly —
`AUTO 102` Introduction and `AUTO 299` Work Experience appear in 8 of the family's
credentials (most foundational), while individual service-area courses (Brakes,
Steering) appear in 2 (one cert each). Rendered, that produces exactly the
"foundational first, specialized last" ordering a counselor expects.

## When it applies / when it doesn't

- **Applies** to CTE credential families with stacked/embedded certificates (the
  common CCC shape). The richer the embedding, the sharper the signal.
- **Degrades gracefully** where a degree has no embedded certs: every course
  falls to "option," but frequency ordering still surfaces the shared foundation.
- **Don't** use it as a gate or an authoritative requirement source, and don't
  present it without the "inferred, catalog authoritative" caveat — same
  discipline as the TOP caveat (`methodology-top-is-a-last-in-line-signal`): a
  structural proxy is a display/ordering aid, not a determination.

## See also

- `kb/_build_cpl_pathway_membership.py` — `build()` computes `core_freq`,
  `in_certs`, and the `tier` (core/option) per course; `emit_courses` orders
  core-first by frequency.
- The reframe story: `docs/cpl_pathways_lessons.md` (2026-07-16 StarMora).
