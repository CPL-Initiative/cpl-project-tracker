---
title: "College & district identity — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# College & district identity

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** One taxonomy: every college/district name variant resolving to MAP's authoritative `college_id`, the CCCCO MIS district code, and every spelling any system uses.

## Status

✅ **LIVE IN SUPABASE AND SURFACED AS A TAB** (#1131–#1133, #1278). `map_colleges` carries `district` · `mis_district_code` · `mis_college_code` · `district_type` · `mis_absent_why`; **`variants` populated on 118 of 128 rows**, 73 districts. ⭐ **SCOPE IS EVERY ENTITY WE HOST A LANDING PAGE FOR** (Sam, 2026-08-21), not just credit colleges. ⭐ **THE LINT IS THE POINT, NOT THE MAPPING** — `--observed-json` feeds every college-name STRING in a live table and reports the ones claimed by no identity: **10 findings over 130 observed names** today. ⚠️ **IT IS ONLY A LINT WHEN ITS INPUT IS SUPPLIED, AND THAT IS NOW ENFORCED** (Sky185): the input is optional, a rebuild without it publishes ZERO findings, and zero reads as a clean bill of health. The builder **exits 1** rather than overwrite a linted artifact with an unlinted one (`--no-lint` is the deliberate escape hatch), stamps `linted` + `observed_names`, and the tab renders **"not checked"**, never "Nothing outstanding". Inputs md5-verified against live before each rebuild. ⭐ **MAP's three sandbox colleges are OUT of Sierra's corpus** (`CabTest` · `Las PosTest` · `SantTest Ana`); ⚠️ **`entity_kind` could never have reached `Las PosTest College` — it has no `map_colleges` row to join to**, and its STATS were empty while its CONTACTS were real. Receipt: `kb/college_identity/2026-08-23_test_org_removal.md`. **Standing invariants:** ⚠️ fix the **JOIN**, never the table (`map_college_contacts` rebuilds from MAP nightly, so trimming its two trailing-space names puts them back tomorrow); ⚠️ **a variant must never shadow a canonical name** ("Mission College" is both); ⚠️ **a missing MIS code is a finding only for a COLLEGE**, or four permanent partner blanks push `unresolved` off zero for ever; ⭐ NOCE is `NORTH ORANGE ADULT` 863/860 and SDCCE is `SAN DIEGO ADULT` 076/070 — both pass the district-prefix invariant. ✅ **Sam's ruling (2026-08-21)** — Calbright and LAUNCH are two entities each, San Diego and North Orange one — is attributed DATA in `kb/reference/college_identity_rulings.json`, never hard-coded. ⚠️ **NEEDS MAP: `college_id` for `Calbright College Credit` + `Launch Apprenticeship Non-Credit`** — minting one would fabricate an identity the whole system trusts; reported `awaiting_map_id`. **Still open:** nothing in `cpl-chat` stops an equivalent sandbox row arriving tomorrow. **NEXT:** Sam looks at the tab; MAP supplies the two ids; district columns (done) vs its own `districts` table. Story: `docs/college_identity_lessons.md`.
