---
title: "Subject/discipline cleanup lessons — mis-mint detection + blank-discipline pre-seed"
date: 2026-07-13
tags: [discipline, auditor, mis-mint, curation, subject-code, blank-discipline, ccr, lessons]
artifacts:
  - kb/_row_audit.py
  - tests/row_audit_subject_outlier_test.py
  - kb/mismint_out/2026-07-13/
  - reference/subject_discipline_map.json
  - kb/_seed_subject_discipline_map.py
  - unified_courses.js
related:
  - "[[docs/kb-notes/methodology-subject-cohort-discipline-outlier]]"
  - "[[docs/ccr_convergence_lessons]]"
  - "[[CLAUDE]]"
---

# Subject / discipline cleanup — lessons

## 2026-07-13 — Session 113 (SkyTeleo): mis-mint detection + blank-discipline cleanup

### (a) What was learned

**Title-keyword discipline inference is a live mis-mint source, and the
existing corroboration-gated audit rule can't see it.** Sam was looking up
HVAC CPL and caught `HVAC M10FR` — LA Trade local course `DIESLTK 122C`,
"Heavy Duty Heating, Ventilation, and Air Conditioning (HVAC)" — minted
`SUBJ4=HVAC` and disciplined **"Air Conditioning, Refrigeration, Heating."**
But the local subject code `DIESLTK` **and** TOP `0947.00` both say **Diesel**.
Root cause: `discipline_source: "title_keyword"` — the literal word "HVAC" in
the title overrode the authoritative fields. The `top_discipline_disagreement`
rule never fired because it **skips singletons** (`corroboration_members < 2`),
and `M10FR` is single-member. Singletons are exactly where this class of error
lives, and the auditor had a blind spot over them.

**Two independent signals must AGREE on the same correction, not merely
disagree with the assignment.** A cohort-only or code-only seed mislabels
ambiguous subject codes. The two-signals-agree bar is what makes the detector
safe to auto-apply from.

### (b) Current state

Three PRs shipped this session:

- **#761 — new `subject_discipline_outlier` detector** in `kb/_row_audit.py`.
  Fires when a minted M-ID's **effective** (curated-overlay) discipline is a
  small minority (≤3 rows AND ≤15%) of its **local subject-code** cohort
  (cohort ≥4 rows, dominant sibling ≥40%), AND the TOP code **or** the curated
  subject→discipline lexicon corroborates the **same** cohort-implied
  correction. Skips curator-set rows (never re-flags a fix). Covers **both**
  clusters (via `_tags_for_mid`) **and** singletons (a dedicated pass — Phase
  1a is otherwise cluster-only). Penalty **0.20**. **~302 live flags**, each
  carrying a `suggested_fix` (the cohort-implied discipline).
- **#761 apply batch** — 42 tightest candidates (25 HVAC-assigned + 18
  three-signal, dedup 42) written to Supabase `kb_curation` `field=discipline`
  under reviewer `mismint-s113@bot`, INSERT-only `ON CONFLICT DO NOTHING`
  (Rule 9: fresh read first, PK `(course_id,field)` verified). **41 landed; 1
  skipped** (`ETHS M1132` already Kinesiology via wave 3). Receipt:
  `kb/mismint_out/2026-07-13/`. Examples: `HVAC M10FR/M10KZ/M10KY` → Diesel
  Mechanics (rail-vehicle HVAC/pneumatics); `HVAC M1056` (a Math course) →
  Mathematics; `ETHS M1020` "Beach Volleyball" → Kinesiology.
- **#762 — tab wiring.** Added the tag to the Unified Courses **Triage**
  dropdown across the 3 sync points (`<select>` option "Subject-code outlier
  (likely mis-mint)", `TRIAGE_PRED` predicate, `QS_TRIAGE` deep-link
  whitelist) + a test pinning the sync (no orphaned predicates). Also blanked
  the Common SUBJ column (`—`) for rows with no discipline — was leaking local
  codes; this is the **display** half of the provisional-mint invariant.
- **#763 — blank-discipline pre-seed.** 595 minted courses carry **no**
  discipline; ~half are recurring recognizable local subject codes. Added **5
  homonym-audited codes** to the **LIVE** minter lexicon
  (`reference/subject_discipline_map.json` via `_seed_subject_discipline_map.py`
  GROUPS): `ARCE`/`ARTF`/`NCART`→Art, `PHTO`→Photography, `CSMTLGY`→Cosmetology
  (~77 blanks fill at the next coci reseed as reviewable "Generated"
  disciplines). The **≥2-agree gate dropped** these: `DANCFOLK` (code = Folk
  Dance, but titles are "Mind Body Health" / "Wealth & Wellness"), `MCOM`
  (existing rows = Broadcasting Technology / Journalism, not "Mass
  Communication"), `LIS` (existing = Interdisciplinary Studies, mixed TOP), and
  `NC`/`ATC`/`IXD`/`HTT`/`SGNGRPH` (credit-flags or mixed). The ambiguous
  majority (~480) → **wave-4 human disposition.**

**Invariant check (healthy):** of 71,671 minted identities, 64,445 disciplined
ones carry canonical SUBJ4 (**99.99%**); only **9** disciplined stragglers
violate it (fold-lag / collision residuals); the 595 blanks carry provisional
local-derived SUBJ4 **by definition**; 6,622 umbrella (Foreign Languages,
Kinesiology) split SUBJ4 by design.

### (c) Strategic roadmap

- The detector is now a steady-state **CCR triage chip** — each wave picks up
  fresh `subject_discipline_outlier` flags plus the shrinking blank set.
- The blank-discipline set shrinks in two ways: LIVE-lexicon fills (safe,
  ≥2-agree) at the next reseed, and human disposition (wave 4) for the
  ambiguous majority.
- **Pipeline gap surfaced (worth closing):** there are **TWO** lexicons —
  `reference/subject_discipline_map.json` (the **LIVE minter**, read at mint
  time) vs `discipline_inference.json` (backfill via `_infer_disciplines.py`,
  which writes **compact** JSON not matching the committed pretty format AND
  isn't wired into any workflow). Lexicon edits only apply at the **next coci
  reseed**, and the reseed/backfill isn't automated. A follow-up should
  reconcile the two lexicons and put the reseed on a dispatchable path so a
  lexicon edit has a deterministic apply.

### (d) Next concrete step

**CCR wave 4 (multi-college ranks 2001–4000)** — picks up the new
`subject_discipline_outlier` chip + the shrinking blank set. The **v0.6
calibration re-seed** (see `docs/ccr_convergence_lessons.md`) is the other
priority for the CCR lane.

Distilled, reusable form of the detector:
[`docs/kb-notes/methodology-subject-cohort-discipline-outlier.md`](kb-notes/methodology-subject-cohort-discipline-outlier.md).
