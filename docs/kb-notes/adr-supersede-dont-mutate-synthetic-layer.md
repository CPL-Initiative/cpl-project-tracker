---
title: Supersede, don't mutate, at the synthetic identity layer
created: 2026-05-27
updated: 2026-05-27
tags: [adr, identity-layer, provenance, credentials, m-id, c-id, re-mint, cred-ref]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/subj4_canonicalization_remint_lessons]]"
artifacts:
  - kb/unified_titles.json
  - kb/credentials.json
  - kb/coci_minted_courses.json
---

# Supersede, don't mutate, at the synthetic identity layer

> **One-sentence summary** — when curators rename or refine a synthetic identity (unified credential, M-ID, cluster), the rename only edits the synthetic layer; raw upstream identities and historical synthetic versions are preserved through superseding metadata, never overwritten.

## Context

CPL's data model has two stacked layers per identity domain:

- **Raw layer** — what a college (or CCCCO MAP, or COCI) actually authored. Owned upstream; immutable from our side. Example: the freehand exhibit title a college typed into MAP, like `"Adobe PS Cert. Assoc."`. Or a college's `(Subject, CourseControlNumber)` row in the COCI extract.
- **Synthetic layer** — our AI-drafted-then-curated canonical identity that absorbs raw variants. Example: the `unified_title` `"Adobe Certified Professional - Photoshop"` that groups every raw spelling of that credential. Or the minted M-ID `AUTB M1003` that groups college-level `(Subject, CourseControlNumber)` rows into one consolidated course.

Curators evolve the synthetic layer over time as understanding sharpens. This note governs **what they're allowed to mutate** when they do.

## The claim

**Three rules, derived together:**

1. **Raw layer keys are immutable.** Never edit a college's authored string in `kb/unified_titles.json`'s dict KEYS, or a `CourseControlNumber` in a college's COCI row, or the source side of any upstream-owned identity. We don't own those records; mutating our copy is both a credibility violation ("this college didn't really type what they typed") and a no-op (the next upstream refresh overwrites the edit).

2. **Synthetic layer renames evolve a *new* version of the synthetic identity, with the old version preserved through superseding metadata.** When a curator renames the unified credential `X → Y`, the data shape becomes:
   - The raw_title keys that previously pointed to `X` now have `unified_title: Y` *and* `_original_ut: X` (or extend `_original_ut_history: [X, ...]` if there's already a chain).
   - The new key `credentials[Y]` carries the issuer/trainer metadata; the old `credentials[X]` is alias-mapped through `kb/cred_rename_out/<date>/alias_map.json` (committed at apply time).
   - Downstream references (`coci_articulations.json`, baked JS payloads) update to the new name, but the alias map preserves the round-trip.

3. **Provenance compounds across renames, doesn't flatten.** A second rename `Y → Z` later adds to the history list (`_original_ut_history: [X, Y]`), not replaces it. The trail end-to-end stays: raw → unified v1 → unified v2 → … → current.

## How we got here

The principle crystallized during Cred-Ref PR-5b scoping (Session 12, Bruh Dec). Mid-scope, Sam asked "when we refer to rename, does this actually touch the original exhibit name established by the authoring college or does it just associate that original name with the new synthetic layer we produced?" Answering it surfaced three separable reasons (upstream-ownership, design-intent, provenance-value) and made clear the rule applies cross-domain — not just to credential titles, but to M-ID → C-ID promotion (which also preserves the old M-ID via alias map), SUBJ4 canonicalization re-mints (which preserve old SUBJ via `kb/subj4_dryrun/alias_map.json`), and any future synthetic identity layer we build.

The rule is also what makes the [re-mint playbook](../coursecontrolnumber_remint.md) safe to apply iteratively: every re-mint preserves the old→new alias, never claims authority over the upstream layer, and never destroys prior synthetic state.

## When this applies (and when it doesn't)

**Applies to:**

- `unified_title` renames at the credential layer (PR-5b).
- M-ID → C-ID promotions when a curated official ID is adopted (`kb/coci_minted_courses.json` row gets a new `id_system: "C-ID"` identity; old M-ID preserved via `kb/promotions.json`).
- M-ID re-mints inside the staging phase (`CourseControlNumber` re-mint, PR #84; SUBJ4 canonicalization, PRs #93/#94/#95). Old keys retained in `alias_map.json` until faculty-publication declares the layer stable.
- Cluster (`UC-CUR-*`) consolidation when a curator merges members into an existing identity (the cluster id is retired but the alias map preserves the route).
- Any future synthetic layer (e.g. a discipline canonicalization beyond SUBJ4; a TOP-code refinement layer).

**Does NOT apply to:**

- **Raw upstream identities** — never mutate. If we want a college to fix their entry, we surface a recommendation; we don't edit our copy.
- **External authoritative IDs** — C-ID descriptors, CCN codes, ASCCC-approved identifiers. These are owned by faculty/intersegmental bodies; we accept them verbatim. Renaming a C-ID is not in our gift.
- **Faculty-published M-IDs** (when that state is declared per CLAUDE.md Rule 7) — at that point the M-ID layer locks; "stable identifiers, no renumbering" kicks in and re-mint becomes off-table without explicit re-opening.
- **Pure typo corrections inside a synthetic layer where the curator declares the original was wrong, not refined.** In practice this is rare — almost any "fix" benefits from preserved history, and `_original_ut_history` costs nothing. The carve-out exists for completeness but should be used sparingly.

## See also

- `[[docs/exhibit_canonicalization_lessons]]` — Bruh Dec section captures the scoping conversation that produced this note
- `[[docs/coursecontrolnumber_remint]]` — the re-mint playbook this principle generalizes from
- `[[docs/subj4_canonicalization_remint_lessons]]` — Phase 1e re-mint, an instance of supersede-don't-mutate on a non-credential synthetic layer
- CLAUDE.md Rule 7 — M-ID lifecycle (the explicit re-mint authorization that the supersede rule is the safety mechanism for)
- PR `#157` (`merge_into_orphan` rule) — the audit rule that catches when a synthetic-layer alias goes orphan (the failure mode supersede-don't-mutate guards against)
- PR `#150` / `#152` (Cred-Ref PR-5a + follow-up) — the first instance of `_original_<field>` baking, the mechanism this note generalizes

---

*Authoring check: durable (this is foundational to the identity-layer architecture, not a passing implementation detail), reusable (every future synthetic-identity workstream — credentials, courses, disciplines, TOP codes — consults this rule), distilled (one principle, three rules), self-contained (frontmatter + opener tell a stranger the claim before they scroll).*
