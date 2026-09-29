---
title: Fire & Emergency Services CPL eligibility — statewide vs local (StarEmber)
date: 2026-07-20
tags: [lessons, cpl, eligibility, credential-reference, statewide, fire, ems, paramedic, wildland, data-query, side-lane]
artifacts:
  - credential_reference_data.js
  - kb/statewide_exhibit_categories.json
  - excel_to_dashboard.py (export_credential_reference, _load_statewide_categories)
  - docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog.md
  - docs/kb-notes/methodology-area-eligibility-rollup-from-cer.md
related:
  - "[[reference-cpl-eligibility-and-exhibit-cr-catalog]]"
  - "[[methodology-area-eligibility-rollup-from-cer]]"
  - "[[CLAUDE]]"
filtered_view: https://claude.ai/code/artifact/36e7fb36-10a7-44a3-a631-d0ec591ccc4c
---

# Fire & Emergency Services CPL eligibility — statewide vs local

> **One-sentence summary** — Sam asked how many MAP students have eligible
> credit (and how many credits) for statewide credit recommendations in Fire,
> EMT/EMS, Wildlands and Paramedic, then for the local ones too; the answer
> comes from joining the curated statewide category map to the Credential
> Reference (CER) rollup, and the run surfaced a real "two definitions of
> statewide" data-quality flag.

## 2026-07-20 — StarEmber (the query + the filtered view)

### What we were asked
1. Students with eligible credit + credit volume for **statewide** credit
   recommendations in **Fire / EMT / EMS / Wildlands / Paramedic**.
2. Then the **local** (non-statewide) credentials in the same areas — Sam's
   hypothesis: the locals "were likely developed based on the statewides."
3. Drop it into a **filtered view**.

### Where the numbers live (no new pipeline needed)
- **`credential_reference_data.js`** (`window.CPL_CREDENTIAL_REFERENCE.unified_titles`)
  carries, per credential (`ut`): `students_served` (the catalog
  `TotalStudentsForCR` "Eligible students" rollup, `<5`-masked),
  `eligible_credits` (the `TotalEligibleCreditsForCR` unit volume),
  `transcribed_credits`, and a `statewide` boolean. Refreshed on the daily MAP
  pull; carries forward when the (gitignored) CustomReport is absent. See
  `[[reference-cpl-eligibility-and-exhibit-cr-catalog]]` for the rollup rules.
- **`kb/statewide_exhibit_categories.json`** maps statewide credential titles →
  the program-area categories on **map.rccd.edu/statewidecpl/** — including the
  four we needed: **Fire Technology**, **Fire Technology - Wildland**,
  **Emergency Medical Services** (which holds both EMT and Paramedic titles).
- Method: filter CER `unified_titles` to the fire/EMS disciplines + title
  patterns, bucket into the four areas, split by the `statewide` flag. The
  reusable recipe + the false-positive exclusions are in
  `[[methodology-area-eligibility-rollup-from-cer]]`.

### The answer (as of the 2026-07-20 14:38 UTC pull)
Eligible **students** are `<5`-masked and a *volume* signal (not distinct
people); eligible **credits** are a *unit-volume* total.

| Area | Statewide (creds · students · credits) | Local (creds · students · credits) |
|---|---|---|
| Fire | 17 · 57 · ~616 | 105 · 141 · ~790 |
| Wildlands | 6 · <5 each · ~3 | 11 · <5 each · ~2 |
| EMT/EMS | 2 · 181 · ~1,327 | 23 · 77 · ~342 |
| Paramedic | 2 · 0 · 0 | 3 · 33 · ~1,433 |
| **Total** | **27 · ~238 · ~1,946** | **142 · ~251 · ~2,567** |

Combined: **169 credentials · ~489 counted students · ~4,513 eligible credits**
(146 of 169 are `<5`-masked, so true student volume is modestly higher).

### Two things worth remembering
1. **Sam's hypothesis holds.** The local set is visibly the statewide series
   re-articulated college-by-college — Company Officer 2A–2E, Fire Inspector
   1A–1D/2A–2D, Firefighter 1/2, Chief Fire Officer 3A–3D, EMT, Paramedic all
   recur locally, mostly issued by **California State Fire Training (SFT)** at
   the same unit values. Local Fire actually carries **more** counted students
   (141) than statewide Fire (57).
2. **"Statewide" has two independent definitions here, and they diverge.**
   - The CER **`statewide` flag** = `has_ccc` — "this credential has at least
     one **CCC-Collaborative articulation**" (`excel_to_dashboard.py` ~L6890/
     6909, derived from the exhibit's `collab_types` containing "CCC").
   - The **statewide CPL category page** (`statewide_exhibit_categories.json`)
     = a curated program-area list.
   - **Paramedic License** (18 students / 721.5 credits — the single biggest
     paramedic line) is on the category page but its articulations carry no CCC
     collaborative type, so the flag reads **local**. That one row swings the
     paramedic statewide/local split entirely. This is a data-consistency
     question to raise with Sam, not obviously a bug (a college-articulated
     EMSA license genuinely may not be a CCC-Collaborative row).
   - Minor: a **title-drift** near-miss — the category file lists "Fire
     Inspector **I**" (Roman) while the CER has "Fire Inspector **1**" (Arabic);
     the flag-based bucketing catches it, an exact category-file join misses it.

### The deliverable
A private **filtered view** artifact (fire/EMS ember + EMS steel-blue tiers,
instrument-panel mono numerals, theme-aware): statewide-vs-local KPIs, a share
split, and per-area credential detail with a tier toggle.
→ https://claude.ai/code/artifact/36e7fb36-10a7-44a3-a631-d0ec591ccc4c

This stayed a **read-only side-lane**: no generator/consumer code changed, no
`unified_courses`/CER regen, the numbered handoff + `cpl_todos.json` left to the
CCR mainline.

### Next steps (see the handoff)
- Resolve the **Paramedic License** statewide-flag divergence (decide the
  intended definition; if the category page should win for the flag, the fix is
  to OR-in category-map membership at `export_credential_reference()`).
- Make the area×tier eligibility view **reproducible** without ad-hoc node —
  either a small committed rollup the CER tab can filter, or a multi-select /
  deep-link on the live Credential Reference tab (today its discipline filter is
  single-select with no URL state).
- Optionally add the **transcribed-vs-eligible** ("credit still waiting to be
  unlocked") column to the view.
- If useful, **generalize** the statewide-vs-local view to the other statewide
  categories (AJ, Automotive, CIS, Construction, Corrections, Kinesiology/Health,
  Real Estate, Welding, World Languages).
