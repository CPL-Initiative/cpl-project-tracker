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

✅ **LIVE IN SUPABASE AND SURFACED AS A TAB** (#1131–#1133, #1278). `map_colleges` carries `district` · `mis_district_code` · `mis_college_code` · `district_type` · `mis_absent_why`; **`variants` populated on 118 of 128 rows**, 73 districts. ⭐ **SCOPE IS EVERY ENTITY WE HOST A LANDING PAGE FOR** (Sam, 2026-08-21), not just credit colleges. ⭐ **THE LINT IS THE POINT, NOT THE MAPPING** — `--observed-json` feeds every college-name STRING in a live table and reports the ones claimed by no identity: **10 findings over 130 observed names** today. ⚠️ **IT IS ONLY A LINT WHEN ITS INPUT IS SUPPLIED, AND THAT IS NOW ENFORCED** (Sky185): the input is optional, a rebuild without it publishes ZERO findings, and zero reads as a clean bill of health. The builder **exits 1** rather than overwrite a linted artifact with an unlinted one (`--no-lint` is the deliberate escape hatch), stamps `linted` + `observed_names`, and the tab renders **"not checked"**, never "Nothing outstanding". Inputs md5-verified against live before each rebuild. ⭐ **MAP's three sandbox colleges are OUT of Sierra's corpus** (`CabTest` · `Las PosTest` · `SantTest Ana`); ⚠️ **`entity_kind` could never have reached `Las PosTest College` — it has no `map_colleges` row to join to**, and its STATS were empty while its CONTACTS were real. Receipt: `kb/college_identity/2026-08-23_test_org_removal.md`. **Standing invariants:** ⚠️ fix the **JOIN**, never the table (`map_college_contacts` rebuilds from MAP nightly, so trimming its two trailing-space names puts them back tomorrow); ⚠️ **a variant must never shadow a canonical name** ("Mission College" is both); ⚠️ **a missing MIS code is a finding only for a COLLEGE**, or four permanent partner blanks push `unresolved` off zero for ever; ⭐ NOCE is `NORTH ORANGE ADULT` 863/860 and SDCCE is `SAN DIEGO ADULT` 076/070 — both pass the district-prefix invariant. ✅ **Sam's ruling (2026-08-21)** — Calbright and LAUNCH are two entities each, San Diego and North Orange one — is attributed DATA in `kb/reference/college_identity_rulings.json`, never hard-coded. ⚠️ **NEEDS MAP: `college_id` for `Calbright College Credit` + `Launch Apprenticeship Non-Credit`** — minting one would fabricate an identity the whole system trusts; reported `awaiting_map_id`. ⭐ **THE TAB'S MAIN TABLE HAD NEVER RENDERED FOR ANYONE UNTIL 2026-09-11 (#1559).**
`authHeaders()` sent NO headers at all, because it feature-tested
`window.CPL_TEAM_PHRASE.headers` — which does not exist; `decorateHeaders` does.
The guard was always false, every fetch went out with no `apikey`, `map_colleges`
answered **401**, and the roster draws under `if (live)`. Signed in or not, since
the tab shipped. ⚠️ **The polite else-branch is why it survived**: a missing method
and an unmounted module are indistinguishable to a truthiness guard, so the page
calmly reported a permissions gate that was not the problem — and the file's header
had drifted to describe the broken screen (*"a LINT SURFACE, not a lookup"*) three
lines below Sam's own verbatim ask for a lookup. KB note:
[`methodology-a-feature-test-on-a-missing-method-fails-silent`](../../kb-notes/methodology-a-feature-test-on-a-missing-method-fails-silent.md).
⭐ **Sam ruled the ORDER (2026-09-11): *"show the full table and just give a link to
the discrepancies."*** The roster leads; findings sit below under `id="cid-findings"`;
a jump link above the table names the count and is not drawn when there is nothing
to link to. A **link, not a disclosure** — the findings stay in the DOM and in
document order for Ctrl-F, the heading list and deep links. Headings h3→h2 (the
view's only a11y failure, in both themes; re-verified 38→36 total). Guards:
`college_identity_auth.test.js` (12) checks every `CPL_TEAM_PHRASE` member the tab
names against `team_phrase.js`'s own api; `college_identity_tab.test.js` block 5 (10)
asserts ORDER, not presence.

⚠️ **MAP USERS IS NOT WIRED TO THIS TAXONOMY — measured 2026-09-11, and Sam assumed
it was.** `map_users.js` holds **zero** references to `map_colleges`, `college_id`
or `variants`; it keys on the college **NAME STRING** (`map_college_users?college=eq.<name>`)
plus three hardcoded name-keyed objects — `FALLBACK_CONTACTS` (78), `CPL_PAGES` (16),
`CPL_LIAISONS` (1). No duplicate keys (checked; repeats are one college across two
objects). Name-string keying is the recurring weak link, and `variants` exists to end
it. Live taxonomy: **128 rows, `college_id` on all 128, `variants` on 118, district +
MIS codes on 118, 73 districts.**

**Still open:** nothing in `cpl-chat` stops an equivalent sandbox row arriving tomorrow.
**NEXT — both AWAITING SAM, do not start without a reply:** (a) wire the identity lint
into `map-users-sync.yml` (already daily at `0 13 * * *`, and it is the job that pulls
from MAP, so it holds the fresh names) for the daily diff Sam proposed — the builder
already takes `--observed-json`, only the trigger is missing; (b) make MAP Users
resolve through `college_id`/variants instead of name strings. Also: MAP supplies the
two `awaiting_map_id` ids; district columns (done) vs its own `districts` table.
⚠️ `map-users-sync.yml`'s header says "schedule (monthly)" while its cron is daily —
the comment is wrong. Story: `docs/college_identity_lessons.md`.
