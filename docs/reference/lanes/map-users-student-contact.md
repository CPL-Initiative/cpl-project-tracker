---
title: "MAP Users / student contact — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# MAP Users / student contact

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Every college landing page routes a student's CPL request to a real person. MAP routes on `primary_contact_email`.

## Status

✅ **WORKLIST LIVE, WIRING AUDITED SOUND, CURATOR PROPOSALS ARE DATA** (SkyMail #991–#993/#1001; SkyHigh #1078; SkyBridge #1151; SkyRef #1167/#1171). **25 of 123 colleges have no `primary_contact_email`**: 17 resolve from the college's own MAP designations (coordinator→assistant→counselor→AO→initiator→faculty), 5 leadership-only, 3 no-MAP-presence (the standalone continuing-ed institutions). ⚠️ **MAP IS READ-ONLY FOR US — the nulls cannot be filled by us.** `map_users.js` `FALLBACK_CONTACTS` is a **DISPLAY-LAYER** fallback over **78** colleges (61 with an address, 17 blank-with-a-finding, 3 curator-supplied by Jessica); gated `map_contact_proposals` overlays the worklist with all 25 rows editable, chipped **`curator-set`** with who/when and **never claiming MAP holds them**. **Sierra does NOT read it** (Sam's call: MAP to-do only; a test asserts `cpl-chat` never references the table). Clearing writes **nulls, not a delete**; an RLS-filtered write returns **200 + empty body**, so a no-row write reports as FAILURE with the typed text kept. ⭐ **A provenance chip must say WHY, not WHAT** — a bare email beside a named row is not a lookup failure (`cpl_assistant_email` has no matching name column). ⚠️ **5 of the 8 "must be asked" are NOT empty colleges** — Gavilan has 13 active MAP users, Hartnell 15, nobody in any CPL role. ⚠️ **7 entries are `via:"search"` and `proposedFillFor()` REFUSES them in code** — sessions are egress-blocked from college domains, so Jessica's sourcing rules could not be applied; they render "Candidate — confirm". ⚠️ **2 colleges publish only a mental-health inbox — DELIBERATELY DECLINED** for CPL routing. ⚠️ **Mission College's proposal is a free-mail address** — MAP's own `cpl_coordinator_email`, first in the cascade; **FLAGGED, never filtered**. ⚡ **Roster sync is DAILY** (Sam, 2026-08-13) and Sierra reads `map_college_contacts` LIVE since v45 — a stale roster costs a student the wrong person to email. ⚠️ **MAP's sandbox orgs leaked into Custom Reports**; the suppress field already existed (`map_colleges.entity_kind`), `college_briefing.js` just never read it (#1171, `entity_kind=neq.test`). ⚠️ **`map_colleges` is a lookup table nothing rewrites** — the user/contact tables self-clean on the cron, it does not. **NEXT:** confirm the 7 search-tier candidates (start Palomar, Canyons) then flip to `via:"curator"`; work the 17 blanks; the 52 colleges WITH a CPL Assistant need a differently-egressed sweep. **NEEDS SAM:** 8 colleges keep a 2026-06-25 snapshot contact where MAP is now blank. Story: `docs/map_users_lessons.md`; durable [`methodology-a-provenance-label-must-say-why-not-what`](docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what.md).
