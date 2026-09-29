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

✅ **MAP USERS RESOLVES THROUGH THIS TAXONOMY (#1561, 2026-09-11)** — and ⚠️ **the
wiring replaced LUCK, not a break.** Measured before building: **128 of 128** names in
`map_college_users` match a canonical `college_name` exactly, **74 of 78** distinct
hardcoded keys do too, and only **3 of 123** names in `map_college_contacts` do not.
Nothing was failing. It worked because MAP happens to spell things canonically and
nothing enforced that it keeps doing so. ⭐ **What `normCollege()` could never do is
bridge a VARIANT to its canonical name** — it folds case and whitespace, but
`San Diego College of Continuing Education Credit` and `…Continuing Education`
normalize to different strings and only `variants` joins them. Now: both reads ask for
every spelling (`in.("canonical","variant",…)`, an unresolved name yielding exactly the
old query); `loadContacts` **merges canonical-first**, recovering SDCCE's
`landing_page_url` that the `eq.<canonical>` read dropped silently; and `CPL_PAGES` +
`CPL_LIAISONS`, which had **no normalization at all**, route through `pickByIdentity`.
⭐ **MERGING IS SAFE ONLY BECAUSE THE TAXONOMY ENCODES SAM'S 2026-08-21 RULING** —
the continuing-education arms merge because it says they are one identity, and
`Calbright College Credit` does not merge into Non-Credit because it resolves to
nothing. **No special case for Calbright exists in the code**; the ruling does the work,
and `tests/map_users_taxonomy.test.js` (28) asserts it in both payload orders.
⚠️ Fail-open but **not fail-silent**: a failed taxonomy read degrades to the old
behavior and records `taxonomy.status`. Live taxonomy: **128 rows, `college_id` on all
128, `variants` on 118, district + MIS on 118, 73 districts.**

✅ **THE DAILY LINT RUNS (#1561)** — `kb/_identity_daily_check.py`, from
`map-users-sync.yml` (already daily at `0 13 * * *`, already holding
`SUPABASE_SERVICE_KEY`, and the job that pulls from MAP, so the names are fresh in the
same run). **Read-only; it never commits** — the reviewed `college_identity_data.js`
stays the artifact and this only reports whether the finding set MOVED, raising one
reusable issue and closing it when they match again. Landing regenerated identity
decisions by schedule is what `college_identity_rulings.json` exists to prevent.
⚠️ Two guards: it **refuses on a short read** (<100 colleges or <100 names — a failed
read would report the whole roster as findings), and it restores the artifact from git
because the builder writes it regardless of `--out`. Sources are pinned to the
committed baseline's two tables (`chatbox_college_profiles` + `map_college_contacts`);
adding `map_college_users` is a deliberate re-baseline, not a freebie.

**Still open:** nothing in `cpl-chat` stops an equivalent sandbox row arriving tomorrow.
**NEXT:** MAP supplies the two `awaiting_map_id` ids (`Calbright College Credit`,
`Launch Apprenticeship Non-Credit`) — the only thing here nobody on our side can do;
district columns (done) vs its own `districts` table. Story:
`docs/college_identity_lessons.md`.
