---
title: "Sierra: false absences + the statewide flag — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Sierra: false absences + the statewide flag

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Why Sierra says "none" when there is plenty, why she disagreed with the Fact Sheet, and why she reported three colleges out of nine.

## Status

✅ **THREE FALSE-ABSENCE CLASSES FIXED.** ① **Cerritos ironworker** (#1162, v44) — the raw corpus abbreviates, there was **no college-scoped curated route at all**, `search_credentials_any` never searched **`issuer`/`trainer`** and failed on plurals, and the local route had the narrowest probe budget. Now `search_college_credentials()` + a shared tier ladder (**new tier 5 issuer/trainer**, below the title tiers) + plural folding + 4/4/8 probes → all **13** return, **three reachable ONLY via issuer**. ⭐ **90% of credentials have an issuer word absent from the title**; 30% carry a curated word absent from every raw variant. ② **Statewide flag** — synced from the wrong file, so **42 credentials read as LOCAL** and Sierra contradicted the public Fact Sheet. Now UNIONs both (**126, up from 84**). ⚠️ `cpl_memory` already said *"use the adoption file"*: a settled ruling does not enforce itself, the consumer has to change. ③ **The census defect** (#1277, **v52**) — asked what LACCD should do, Sierra said **"Three LACCD colleges appear in the MAP platform data"** then closed with *"across all nine"*. **Nothing was missing**: all 9 are in `map_colleges` AND `chatbox_college_profiles`. Three came from a `.slice(0, 3)` on the tie list (the query reduces to `["angeles","district"]`, so all nine tie). ⚠️ **The identical bug was fixed 34 lines above and its twin left standing.** ⭐ **Raising the cap is NOT the fix** — it yields *"Nine colleges…"*, still false and **harder to spot**; the load-bearing half is the **disclosure** (rows stamped `_match`; context ships shown-of-total and forbids the sentence). ④ **The district roster** (SkyApply, #1280) — the *"cannot enumerate a district"* caveat was obsolete the day it was written: #1278 landed `district`/`mis_district_code` on `map_colleges` hours later. `resolveDistrict()` now answers a district question from the roster (LACCD = 9, MIS 740), **alphabetically**, and the caveat survives ONLY on the name-match path. ⭐ **The caveat was the small half** — **four districts have ZERO colleges named after them** (Los Rios · Peralta · State Center · Kern), so a name match returned nothing at all for them. ⚠️ **Complete only because the join was MEASURED** (116/116 have a profile row); a partial roster names who is absent. ⚠️ **Intent is required** — a bare stem would answer a Los Angeles *City College* question with nine colleges. ⚠️ **A false zero is the worst answer she gives** — it closes the conversation and nobody files feedback about a door they were told wasn't there. ✅ **MODE 7 FIXED (Sky185, 2026-08-23).** Its part-3 prose grep — six LA-basin college names — had been red since **Session 125** while Sierra answered correctly: she leads with the colleges that have ARTICULATED NCCER (Norco, Barstow) rather than the ones that merely TEACH the trades, a choice of EMPHASIS between two true things. **Measured at the retrieval layer instead:** the function's own tsquery for that question returns **150 rows / 78 colleges, FIVE of the six LA-basin colleges present** — the data reaches her, so the assertion was testing wording, not capability. New mode **7r** calls `search_college_offerings` with a NEGATIVE control first, a positive control, and a **threshold (3 of 6, never a named college** — mode 14's lesson: an assertion pinned to a value that can leave the data stops being a guard the moment it does). ⚠️ **The query is a TRANSCRIPTION and transcriptions drift** — `tests/sierra_offerings_retrieval.test.js` re-derives the term set from `index.ts` and fails the moment `TOPIC_SYNONYMS` changes. ⚠️ **The offerings query FILLS its 150-row limit exactly**, so truncation is live; ordering is guarded by `sierra_geo_ranking`, not by 7r. **Open:** 12 adoption-file statewide titles absent from `chatbox_credentials`; the M-ID leverage layer still omits Cerritos from welding adoption (a *different* question). Story: `docs/sierra_credential_naming_lessons.md`.
