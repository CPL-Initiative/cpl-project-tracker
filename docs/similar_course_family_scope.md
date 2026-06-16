---
title: Similar-course FAMILY consolidation lane — scope + measure-first
date: 2026-06-16
session: 57 (Bruh Skydriver)
tags: [consolidation, worklist, m-id, over-merge, title-5-55050, measure-first, scope]
artifacts:
  - kb/_similar_family_dryrun.py (the dry-run / receipt builder)
  - kb/similar_family_out/candidates.json (the committed receipt)
related:
  - kb/_title_consolidation_dryrun.py (the title-evidence lane — the closest sibling)
  - kb/_consolidation_guards.py (the shared title-safety guard suite)
  - CLAUDE.md §"Suggested-merges worklist" (the six existing lanes)
---

# Similar-course FAMILY consolidation lane

## Why (Sam, 2026-06-16)

The worklist's level-safe signature (`_sug_sig`) keeps `X 1` / `X 2` / `Advanced X`
apart **on purpose** — so Calculus I never fuses with Calculus II. That guard is
the **single biggest under-merge driver**: every level/sequence variant of the
same skill stays a separate M-ID.

For **CPL** that's backwards. **Title 5 §55050** lets a college grant credit for
prior learning *similar* to a course's objectives — so level variants are usually
**one common course**, and under-merging fragments a credential across many M-IDs
(CompTIA A+ → 24 M-IDs), hurting portability. Sam's call: *"better to over-merge
than under-merge … merge every reasonably similar course"* — provided it stays
**curator-confirmed + reversible** (the curator is the faculty-acceptability gate).

## What the lane is

The **inverse** of `_sug_sig`: it **collapses the level axis** (exactly the marks
`_consolidation_guards` treats as `level_risk` — beginning/intermediate/advanced,
I–IX, digits, cardinal word-numbers, bare section letters) and groups the
remaining **same-subject** tokens into a course **FAMILY**. So `Beginning Voice` /
`Intermediate Voice` / `Advanced Voice 1-2` / `Elementary Voice 1-2` surface as
**one** curator-confirmable group.

- **Gender / sport / variant-type** words are NOT level marks, so they stay as
  distinguishing tokens — the signature separates them naturally (`Men's
  Basketball` ≠ `Women's Basketball`; `EMT Refresher` ≠ `EMT`). A belt-and-
  suspenders gender/sport conflict check is applied anyway (25 families blocked).
- **Scope:** minted M-IDs + Stand-Alone singletons (the synthetic tier). Official
  C-ID/CCN anchors are never members; a generator join can attach one as the ★
  merge target when it shares the family signature.
- **Never auto-applied.** Mirrors the title/desc lanes: committed receipt
  (`kb/similar_family_out/candidates.json`), re-run manually, the generator only
  JOINS it (validating live mergeable rows at regen) so the daily cron stays flat.

## Measure-first quality (run 2026-06-16)

| Metric | Value |
|---|---|
| Families (≥2 members) | **7,849** |
| Identities consolidated | **24,060** |
| Discipline unanimous within family | **99.2%** (7,786 / 7,849) |
| Units uniform (0u spread) | 5,067 · ≤1u 1,406 · ≤2u 608 · **>2u 768** |
| Cross-college / same-college | 4,698 / 3,151 |
| Contains an already-multi-college M-ID | 3,358 |
| Size: 2 / 3–5 / 6–10 / 11+ | 4,703 / 2,541 / 469 / 136 |
| Gender/sport-blocked | 25 |

**Clean** (obvious merges): `Printmaking` (15), `Jewelry & Metalsmithing` (14),
the ESL level ladders, the MUSI `voice` family (38). Same-subject scoping makes
discipline ~unanimous and ⅔ of families have identical units.

**Over-merge risk concentrates in the 768 wide-spread (>2u) families** — they mix
*scope*: `ESL` 0–3u (credit + noncredit together), `Culinary Arts` 0–9u (Intro 3u
vs Advanced 9u). That's the band a curator must scrutinize, and the signal the UI
must surface.

## Decision (Sam, 2026-06-16): LOOSEN the existing lanes — not a separate lane

After the measure-first numbers, Sam chose the more aggressive path: instead of
adding a separate opt-in "family" worklist lane, make level-collapsing the
**default grouping of the existing anchored + singleton-only lanes**. So the main
worklist itself now merges across levels — `_sug_sig` in `excel_to_dashboard.py`
was changed from level-SAFE to **level-COLLAPSING** (the same level vocabulary the
dry-run validated). Still **suggestions-only / curator-confirmed** — it changes
what appears in the worklist, never an auto-merge, and is reversible.

**Impact on the live worklist** (regenerated; the residual *after* the existing
auto-merge cohorts):

| Lane | Before (level-safe) | After (level-collapse) |
|---|---|---|
| anchored `groups` | 229 | **2,665** |
| `singleton_groups` | 217 | **2,519** |
| family / title / desc / evidence | unchanged (own keys/receipts) | — |

Biggest families now surfaced for one-click review: `dance modern` (30),
`ceramics` (27), `ballet` (26), `algebra` (26), `english language` (26),
`cosmetology` (25). The curator unchecks any genuine progression (units shown per
row) before Confirm. The family lane (`_fam_key`, co-articulation-gated) is now
largely subsumed but left in place.

## Status

- ✅ Measure-first dry-run + receipt + scope (`kb/_similar_family_dryrun.py`).
- ✅ **Loosening shipped**: `_sug_sig` level-collapse (the core lever); worklist
  regrouped 229→2,665 anchored / 217→2,519 singleton; generator clean; tests green.
- ⏳ **Member-join Jaccard 0.5 → ~0.4** (the second knob Sam endorsed) — DEFERRED to
  its own measured PR. `kb/README.md` mandates *measuring how many member rows flip
  before committing* (it changes every identity's membership/aggregation, not just
  suggestions), so it is not bundled here.
- ⏳ **Follow-on:** once curators work the bigger worklist, the cleanest
  cross-college + uniform-units families are candidates for a bulk **auto-merge
  cohort** (Sam's "go further" path), incrementally.
