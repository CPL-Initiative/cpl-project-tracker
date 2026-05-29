---
title: Cross-discipline over-merge re-mint (Scope)
date: 2026-05-29
kb-status: published
kb-type: playbook
tags: [unified-courses, m-id, over-merge, re-mint, rule-7, scope, auditor]
related:
  - docs/unified_courses_audit_lessons.md (the member_top_divergence rule that found this set)
  - docs/coursecontrolnumber_remint.md (the Rule 7 re-mint playbook this follows)
  - docs/subj4_canonicalization_remint_lessons.md (the closest prior re-mint — same dry-run/apply shape)
  - CLAUDE.md §10 (M-ID surrogate format) + §11 (M-ID lifecycle, auditor)
artifacts:
  - kb/_row_audit.py::_classify_member_top_divergence (the flagged set, 1,299 M-IDs)
  - kb/_seed_coci_minted_mids.py (the root-cause minter — grouping key is title-only)
  - kb/coci_minted_courses.json + coci_minted_memberships.json + coci_minted_singletons.json
  - kb/coci_articulations.json (payoff layer — 98 records re-key)
  - kb/coci_unified_courses.json (52 cluster member-refs update)
---

# Cross-discipline over-merge re-mint (Scope)

> **One-sentence summary** — the `member_top_divergence` auditor rule found 1,299
> M-IDs that minted courses from different TOP divisions under one identity; this
> scopes the discipline-aware re-mint that splits them, and surfaces the forks
> Sam must lock before the dry-run is built.

## Context — the problem and its root cause

`kb/_seed_coci_minted_mids.py` groups raw college courses into a corroborated
M-ID by **normalized title alone** (`by_title[ntitle(title)]`, ≥2 members). Its
only over-merge guard is a `subject_spread >= 8` *note* — it never splits. So a
generic title ("Ethics and Leadership", "Independent Projects", "Undergraduate
Research Experience") sweeps courses from unrelated program areas into one
identity. The motivating case: `CRIM M1231` (Administration of Justice) minted
Diablo Valley's `ADJUS 126` (TOP 2105.00) together with Mission College's
nursing `HOC 62` + `RNB 42` (TOP 1230.10), because the title matched.

The `member_top_divergence` rule (added 2026-05-29; see the auditor lessons doc)
flags the population: **1,299 M-IDs** whose member colleges carry TOP codes
spanning ≥2 two-digit divisions with ≥30% minority share.

## The fix — a discipline-aware split

Mechanically tiny: change the minting key from `(normalized_title)` to
`(normalized_title, top_division)`, where `top_division` = the member course's
2-digit TOP family. Courses that share a title but sit in different divisions
become **separate** identities instead of one. The re-mint applies this split to
the existing flagged set rather than re-running the seed from the source xlsx.

Per-M-ID procedure (the dry-run simulates, the apply executes):
1. Partition the M-ID's members by 2-digit TOP division.
2. Each division-group with **≥2 distinct colleges** → a corroborated M-ID
   (plurality group keeps the old id to minimise churn; others get fresh ids).
3. Each division-group with **1 college** → singleton(s) (`coci_minted_singletons.json`).
4. Reassign each new group's discipline from its division's TOP→discipline map
   (`discipline_source="top_code"`), else blank for curator review.
5. Record old-id → new-id(s) in the alias map; re-key articulations, cluster
   member-refs, and any curation pointers.

## Simulation findings (measure-first — this is the evidence)

Simulated over the 1,299 flagged M-IDs (4,759 member courses) by partitioning
each on 2-digit division and recounting corroboration:

| Outcome | Count | Note |
|---|---|---|
| **Fully de-corroborates** (dissolves to singletons) | **784 (60%)** | "Corroboration" was a title collision, not a shared course |
| Keeps ≥1 corroborated group | 515 (40%) | A genuine cross-college core survives + a minority peels off |
| Split factor 2 / 3 / 4 / 5 / 8 / 14 | 1164 / 111 / 17 / 5 / 1 / 1 | The 8- and 14-way are the "Independent Projects"-style mega-merges |
| New corroborated groups after split | **744** | |
| Member courses peeled to singleton status | **2,216** | |
| **Net corroborated-catalog change** | **1,299 → 744 (−555)** | The catalog *shrinks* — spurious corroborations removed |

**The headline is the 60% de-corroboration.** It proves the fix is structural,
not cosmetic: 784 of these were never real consolidated courses — they were two
or more single-college courses sharing a title. Curation can't fix that (you
can't un-merge with a discipline relabel); only a re-partition can. It also
means the corroborated catalog is currently *inflated* by ~555 phantom courses.

### Blast radius (small — smaller than the SUBJ4 re-mint)

| Surface | Touched | Of total |
|---|---|---|
| Minted M-IDs re-keyed/split | 1,299 | 16,308 |
| Articulation records re-keyed | **98** (66 M-IDs) | 4,592 |
| Curation entries at risk | **0** | 7 |
| `coci_unified_courses` cluster refs | 52 | 1,385 |

**0 curation entries on the flagged set** is the key de-risker: no curator has
touched any of the 1,299, so the Rule 7 "Supabase fresh-read at write-time"
collision concern is moot for these rows (re-confirm at apply time regardless).

## Forks to lock before the dry-run is built

1. **Scope: targeted re-key, not a full re-mint.** *Recommended:* split only the
   1,299 flagged M-IDs (everything else byte-identical) **and** fix
   `_seed_coci_minted_mids.py`'s grouping key so a future re-seed can't
   re-introduce the bug. The minter is one-shot (not in the daily cron), so a
   full re-key of all 65k identities would be gratuitous churn.
2. **Split signal: 2-digit TOP division.** *Recommended:* keep the auditor rule's
   granularity (conservative; within-division wobble is noise). Defer any
   4-digit-program splits (that wider net is ~3,843 M-IDs — a separate decision).
3. **Accept the dissolution (−555 corroborated, +2,216 singletons).** *Recommended:*
   yes — it's a correctness improvement (phantom corroborations removed), and the
   payoff layer barely moves (98 articulations). Headline adoption/identity counts
   shift; the daily auditor tracks it.
4. **Borderline interdisciplinary — flag, don't blind-split.** A minority are
   *legitimately* one cross-division course (`JOUR M1094` "Photojournalism" =
   Applied Photography + Journalism; `BIOL M1206` "Ethnoecology" = Biology +
   Ethnic Studies). *Recommended:* the dry-run splits mechanically but emits a
   `review_hold.json` decision queue for these (heuristic: interdisciplinary
   title tokens, or a known cross-division sister pair), and the apply **holds**
   them for curator veto rather than auto-splitting. Mirrors the prior re-mints'
   `blocked.json`/`collisions.json` decision-queue pattern.
5. **ID allocation (mechanical).** Plurality group keeps the old id; minority
   groups get fresh corroborated `SUBJ M####` (≥2 colleges) or singleton
   `SUBJ M<band><d><LL>` codes per §10; dissolved M-IDs retire, alias → their
   singletons. Deterministic, persisted (sorted by normalized title), per §10.
6. **Discipline of split groups (mechanical).** Set from the division's
   TOP→discipline map where it resolves (stamped `top_code` source), else blank
   for curator. Fixes the 255 "mis-disciplined" rows as a side effect.

## Rule 7 playbook mapping

| Playbook requirement | This re-mint |
|---|---|
| Dry-run first | `kb/_overmerge_dryrun.py` — re-runnable, no mutation; outputs `report.md`, `alias_map.json`, `review_hold.json`, `collisions.json` (mirrors `_subj4_dryrun.py`) |
| Alias map committed | `kb/overmerge_out/<date>/alias_map.json` (old M-ID → new id(s)) |
| Supabase fresh-read at write-time | 0 curation rows on the set today; apply still re-reads |
| Articulations re-keyed | 98 records → new identities via the alias map |
| Atomic land in one cron window | apply via `workflow_dispatch`, `concurrency: daily-dashboard` |
| Structural invariants (§ Rule 7) | 4-letter SUBJ preserved; corroborated all-digit / singleton trailing-letters format honoured |

## PR sequence (modeled on the SUBJ4 + CCN re-mints)

- **PR-1 — dry-run + alias map** (`kb/_overmerge_dryrun.py`). Read-only; the
  apply gate's green light. The artifact Sam reviews before any write.
  **DONE 2026-05-29** — all four gates PASS (V1 ✓, V2 member-conservation
  4507==4507 ✓, V3 collision-free 0 ✓, V4 article-routability 0 unroutable ✓);
  collisions empty. Result on locked forks: 1,299 flagged → **63 held** for
  curator veto (58 sister-pair Graphic-Arts↔Multimedia / CIS↔Office-Tech design
  courses + 5 interdisciplinary-token Photojournalism/Ethnoecology) → **1,236
  split**, of which **752 fully de-corroborate**, 484 keep their old corroborated
  id, 212 new corroborated groups, 1,951 members peel to singletons. Corroborated
  catalog 1,299 → **759 (−540)**. Motivating case verified: `CRIM M1231` →
  `NRSR M11SM` (Nursing, Mission) + `CRIM M11VD` (Admin Justice, Diablo Valley).
  Articulations: 98 (77 routable / 21 multi / 0 unroutable). 52 clusters touched.
  Artifacts at `kb/overmerge_out/2026-05-29/`.
- **PR-2 — apply** (`kb/_overmerge_apply.py` + `kb/_overmerge_apply_supabase.py`
  + `.github/workflows/overmerge-apply.yml`). V1–V4 gates baked in; manual
  `workflow_dispatch`; alias map committed.
- **PR-3 — minter source fix.** `_seed_coci_minted_mids.py` grouping key →
  `(title, division)` so a re-seed is over-merge-safe. Doc-only impact today
  (seed isn't in the cron).
- Post-apply: `member_top_divergence` count drops toward the ~legit-interdisciplinary
  residue; the auditor receipt confirms the cleanup (like `subject_collision_signal`
  → 0 after the SUBJ4 re-mint).

## Backlog — SUBJ4-curation cascade to the CCR (future)

Sam's direction (2026-05-29): when a discipline's **canonical SUBJ4 is changed
through curation** (the Common Subject Code tab → `discipline_canonical_subj4.json`
+ Supabase `_CANON_SUBJ4::<discipline>`), that change should **cascade-update the
CCR** — i.e. re-key every M-ID of that discipline to the new SUBJ4. This is a
*scoped re-mint* triggered by a curation edit rather than an audit flag, and it
reuses this exact dry-run → apply machinery (re-key minted ids + memberships +
articulations + cluster refs + curation pointers, alias map, atomic land in the
cron window per Rule 7). `discipline_canonical_subj4.json` is the SUBJ4 source of
truth both for this over-merge split's labeling AND for the future cascade, so the
two share an anchor. Scope it as its own small re-mint when picked up (likely a
`kb/_subj4_recurate_dryrun.py` / `_apply.py` pair parameterized on a discipline +
old→new SUBJ4). Not blocking the over-merge work.

## What this is NOT

- Not a curation pass — curation (re-discipline / merge) can't *split* an
  over-merged M-ID; this is the structural complement.
- Not the full minter re-run — surgical re-key of the known-bad 1,299 only.
- Not auto-applied — dry-run → review → manual `workflow_dispatch`, per Rule 7.
