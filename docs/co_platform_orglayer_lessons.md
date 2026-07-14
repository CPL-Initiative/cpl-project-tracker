---
title: "COBI org layer — the C&I subsite pilot + Our Process tab (lessons)"
date: 2026-07-14
tags: [lessons, cobi, org-layer, co-platform, ci-subsite, tmc, site-switcher, chancellors-office]
artifacts:
  - our_process.js
  - cobi_orgs.js
  - cobi_brand.js
  - quickstart.js
  - raci/supabase_raci.sql
  - tests/our_process.test.js
  - tests/cobi_orgs.test.js
related:
  - "[[co_platform_strategy]]"
  - "[[adr-cobi-org-layer]]"
  - "[[CLAUDE]]"
---

# COBI org layer — the C&I subsite pilot + Our Process tab

Workstream scratchpad. **SkyFlyer side-lane, 2026-07-14** — a parallel track to
the main KB-curation sessions (112/113), so it did **not** touch the numbered
session-handoff chain or `kb/cpl_todos.json` (those are the curation track's
live memory). Continuation for this track lives here.

## Origin

Sam did a Chancellor's Office staff presentation on *how he uses Claude Code to
build tools + business processes*. It was a hit, and it turned into "our process
is a product": the CO **Curriculum & Instruction** team (Dean Raul Arambula,
David Garcia) asked for **their own COBI (C&I) site**. That seeded a small org
layer above the CPL Initiative — the first proof the platform generalizes past
CPL.

## What shipped (all merged to `main`)

| PR | What |
|---|---|
| **#765** | **"Our Process" tab** — the high-elevation "how we work" viz (four systems → checkpoint loop → private/public guardrail → TMC Builder touchdown), ported from the blessed standalone artifact into a lazy, self-contained tab (`our_process.js`, scoped `.opv` CSS, contour backdrop, in-app `#tmc-builder` deep-link). Next to Pipeline in Reference & Curation. |
| **#766** | **COBI site-switcher** (`cobi_orgs.js`) — the pilot org layer: a masthead "Site" dropdown (CPL / C&I), a per-site identity tag on the wordmark (reuses `cobi_brand.js`'s gold `.cobi-num` superscript → "CPL" / "C&I"), nav filtered to the site's tabs, `?org=ci` shareable deep-link. **No gating** (cosmetic). C&I = Our Process + TMC Builder. |
| **#767** | **Masthead polish** — fixed the site-picker↔"Where To?" collision (grid was `1fr\|center-search\|1fr`; brand+switcher overflowed center at intermediate widths → moved search off-center right, reflow bumped to 1180px), dropped the "Go →" button (Enter submits), enlarged the CO seal 46→60px. |
| **#768** | **C&I curation phrase** `ci-team-2026` — added a `team_access` row + broadened `team_pass_check` to match any cohort secret (live via Supabase MCP `ci_team_phrase_add`; schema-of-record synced). |

The standalone presentation artifact (published, shareable) stays separate from
the embedded tab — they can diverge.

## The strategy this sits on

Grounded in **`docs/co_platform_strategy.md`** + `kb/liftoff_plan.json` (the
"Malone plan", Session 83): **one platform, org as a metadata/RLS *dimension* —
NOT a repo or a site per org.** Sam's "Divisions → Areas (CPL, C&I, CIP, CCN…)"
model *is* that dimension with friendlier two-level naming. We extended what
already existed (nav groups, the team phrase, `cobi_brand`) rather than
rebuilding. This kept the C&I pilot **below** the plan's "get a named sponsor +
charter before divisional lanes" gate — the pilot is Exhibit A that *earns* the
mandate, not infra we over-invested in.

## Decisions (Sam, 2026-07-14)

- **CI = a site-switcher, no gating** ("a dropdown to choose which site to work
  on … no gating out folks for now … still pilot").
- **COBI is the umbrella; each subsite wears a little identity tag** (COBI ᶜᴾᴸ /
  COBI ᶜ&ᴵ).
- **TMC Builder + Our Process** are C&I's day-one tabs; not ripped out of CPL.
- **CI phrase = `ci-team-2026`** for now (rotatable later).
- **Logo swap ON HOLD** — don't change `cccco_seal.png` yet (kept the bigger
  sizing). The USA-250 art swap needs the file committed (a pasted screenshot
  can't be saved to the repo).
- **Divisions tier: later.** Sam sent the CCCCO division list for the long names:
  Educational Services & Support · Workforce & Economic Development · College
  Finance & Facilities Planning · Institutional Effectiveness · Government
  Relations · Information Services, Technology & Innovation (ISTI) · Research,
  Analytics & Data · People & Culture Operations · Office of General Counsel ·
  Office of Communications & Marketing. `cobi_orgs.js` has a `DIVISION` slot
  ready.

## Open items / next steps (this track)

1. **Sam's 4 tuning calls** on the switcher (answer when he's clicked around
   live): Division name for the label · C&I's tab set · tag text · whether the
   switcher shows for everyone vs only on `?org=`.
2. **Phase 1b — per-area team-phrase *data isolation*** (deferred, Rule 9).
   Today both phrases unlock the *same* curation tables (cohort separation +
   independent rotation only). True "C&I can't touch CPL's data" needs:
   parameterize `team_pass_check(area)`, an area-aware client (`team_phrase.js`
   + `cobi_orgs` sends the site), per-table policies gated by site. The agent
   recon flagged this as the one genuinely cross-cutting change (4 layers).
3. **Divisions tier** — wire `DIVISION` → a two-level switcher when Sam names it.
4. **New seal artwork** — swap `cccco_seal.png` when Sam commits the file.
5. Adding a site later = one entry in `cobi_orgs.js` `ORGS[]` + (if it curates)
   a `team_access` row.

## Patterns that worked (reuse these)

- **Verify UI changes in a real browser.** Playwright + the pre-installed
  Chromium (`executablePath: '/opt/pw-browsers/chromium'`, `NODE_PATH` at the
  repo `node_modules`, abort external requests, remove `[class*="cplfl"]` fixed
  overlays so First Light doesn't cover the header) caught the masthead layout
  at 1440/1100/820 + the `?org=ci` view before shipping.
- **Runtime-inject + scope, so the daily regen can't strand it** — `cobi_orgs`
  and `our_process` both follow the `cobi_brand`/`kpi_cards` pattern: only a
  `<script>` tag is mirrored in both HTMLs (Rule 4); everything else (DOM + CSS)
  is in the one static JS file. `our_process` prefixes every token `--op-*` and
  scopes every rule under `.opv` so it can't collide with COBI's globals.
- **Regression-guard the thing you might break** — `cobi_orgs.test.js` asserts
  the **default CPL view still shows every tab** (the flagship is unchanged),
  not just that C&I filters.
- **Supabase auth change: read → apply additively → verify before/after.**
  Confirmed `cpl-team-2026` preserved and `ci-team-2026` newly valid, wrong
  phrase still rejected — with `execute_sql` on the live gate.

## Continuation (for the next session on this track)

Everything above is live. If Sam returns with the 4 tuning answers, apply them
to `cobi_orgs.js` `ORGS[]`/`DIVISION` (a small edit + `tests/cobi_orgs.test.js`
update) and ship. If he wants real per-site isolation, that's Phase 1b (§Open
items #2) — treat it as a careful Supabase workstream (dry-run the policy
rewrite, keep `cpl-team-2026` working, test each gated table). Do **not** fold
this track's items into `kb/cpl_todos.json` or the numbered handoff — they belong
to the curation track.
