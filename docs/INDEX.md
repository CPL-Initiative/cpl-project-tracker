---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-09-04
tags: [meta, index, obsidian-target]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/README]]"
---

# cpl-project-tracker — Docs Index

Landing page for the project's documentation surface, intended as the
**Obsidian vault entry-point** when browsing this repo from the vault-side clone
at `CPLBrain/COG-second-brain/cpl-project-tracker/`.

The per-lane catalogs below are **generated** by `kb/_build_docs_index.py` from
each doc's own frontmatter — rebuild rather than hand-append. The prose on this
page is hand-written and is preserved across rebuilds; only the block between
the `generated:corpus` markers is replaced.

> Previously this page listed every document inline and reached **273,616 B,
> 6.8× the 40,000 B index budget** — a landing page you must scroll is not a
> landing page. The catalogs are where the full listings live now.

## The three lanes

| Lane | What | Where |
|---|---|---|
| **KB notes** | Durable, distilled, reusable knowledge | [`docs/kb-notes/`](kb-notes/) |
| **Lessons (WIP)** | Workstream scratchpads, append-only | `docs/<workstream>_lessons.md` |
| **Session handoffs** | "Fattyfat" capsules for the next session | `docs/session_<N>_handoff.md` |

See [`docs/kb-notes/README.md`](kb-notes/README.md) for the lane contract.

## CLAUDE.md reference offloads (`docs/reference/`) — added 2026-07-10 (Session 111, the pare-down)

Always-current project memory moved out of `CLAUDE.md` (2,514 → ~590 lines);
**Rule 9 checkpoints update these files now**, and `CLAUDE.md` keeps read-before
stubs pointing here.

| Doc | Was | Read before |
|---|---|---|
| [Pipeline Reference](reference/pipeline_reference.md) | `CLAUDE.md` §Pipeline Reference (1,087 lines) | generator/workflow/tabs/Supabase/EACR/C-ID work |
| [KB Build Status](reference/kb_build_status.md) | `CLAUDE.md` §KB & Unified Courses (421 lines) | KB/CCR curation work, build-phase history |
| [M-ID Lifecycle & CID/CIDx](reference/mid_lifecycle.md) | `CLAUDE.md` §11 prose + strategic roadmap (449 lines) | re-mints, MC/TMC calls, auditor, pathway decisions |
| [Branch policy](reference/branch_policy.md) | `CLAUDE.md` §Branch policy evidence (2026-08-28) | why a merge rule says what it says |
| [Engineering & UI practices](reference/engineering_ui_practices.md) | `CLAUDE.md` §Engineering & UI evidence (2026-08-28) | a UI rework, a First Light artifact, a table layout |
| [Obsidian vault wiring](reference/obsidian_vault_wiring.md) | `CLAUDE.md` §Obsidian vault wiring (2026-08-28) | vault-sync, exclusion, the sparse-checkout fix |
| [**`reference/lanes/` — one file per §11 roadmap lane**](catalog/reference.md) | `CLAUDE.md` §11 roadmap cells, 88 KB (2026-08-28) | **working any lane — and REFRESHING it at checkpoint** |

⚠️ **The lane files are the usual checkpoint edit now.** §11's table is a
pointer index: it carries each lane's state, and the lane file carries what you
learned. A checkpoint that updates only the row leaves 30 files to go stale.

---

## The catalogs

Every document in `docs/`, by lane. Rebuild with `python3 kb/_build_docs_index.py`
(`--check` fails when a rebuild would change anything, so CI catches a stale index).

<!-- generated:corpus -->
| Lane | Docs | Catalog |
|---|---:|---|
| Doctrine (behavior-shaping) | 4 | [`catalog/doctrine.md`](catalog/doctrine.md) |
| KB notes | 373 | [`catalog/kb-notes.md`](catalog/kb-notes.md) |
| Lessons docs | 75 | [`catalog/lessons.md`](catalog/lessons.md) |
| Workstream docs | 75 | [`catalog/workstream-docs.md`](catalog/workstream-docs.md) |
| Reference (pull-side) | 42 | [`catalog/reference.md`](catalog/reference.md) |
| Session handoffs | 200 | [`catalog/session-handoffs.md`](catalog/session-handoffs.md) |
| **total** | **769** | |
<!-- /generated:corpus -->

Not covered by a lane catalog:

- [`visuals/README.md`](visuals/README.md) — **Visuals**: decision briefs and
  mock-ups worth returning to, committed as HTML with a dated filename.
- [`catalog/`](catalog/) — the generated catalogs themselves.

## Top-level orientation docs

- [`../CLAUDE.md`](../CLAUDE.md) — project memory, Critical Rules, M-ID lifecycle (§11)
- [`co_platform_strategy.md`](co_platform_strategy.md) — **the long-term "plan of attack"** (Session 83): scaling COBI + the CPL KB into a governed, team-based, CO-wide platform — operating model, account migration off personal logins, knowledge lanes, real APIs vs scraping, governance/security/accessibility/HUMANS, decisions only humans make, pushback, and a scorecard against all ~14 asks
- [`roadmap_archive.md`](roadmap_archive.md) — museum annex to CLAUDE.md: completed roadmap rows + Session 26-31 narratives (moved out Session 33 to keep CLAUDE.md to live, steering content)
- [`../README.md`](../README.md) — first-time visitor entry
- [`../kb/README.md`](../kb/README.md) — knowledge-base schemas + generators

## Sierra integration docs (vendor-facing, added 2026-07-02)

Commissioned by Sam for integrating Sierra into a vendor-built platform:

- [`sierra_technical_reference.md`](sierra_technical_reference.md) — how
  Sierra is built: architecture, the full `cpl-chat` API contract (request /
  SSE protocol / errors), the six-lookup answer pipeline, behavior rules,
  data layer, client surfaces, security model, ops, v13→v26 timeline.
- [`sierra_integration_analysis.md`](sierra_integration_analysis.md) —
  benefits / risks / challenges of embedding Sierra on another site, the
  pre-launch preconditions checklist, and the decision points for Sam.
- [`sierra_integration_guide.md`](sierra_integration_guide.md) — the vendor
  implementation plan: link / iframe / native-API / server-proxy paths, a
  minimal reference client, non-negotiable client requirements, launch
  checklist, ongoing-operations expectations.
- [`sierra_iframe_implementation_guide.md`](sierra_iframe_implementation_guide.md)
  — the **day-one iframe recipe** (2026-07-03): the exact `?ctx=external`
  URL, annotated markup/CSP/sandbox, sizing, QA checklist (incl. the
  contacts-gate check), launch coordination, rollback.
- [`sierra_maturity_roadmap.md`](sierra_maturity_roadmap.md) — **Malone's
  scope-and-sequence to end-state** (2026-07-03): Phases 1–6 (guardrails →
  contract hardening → content maturity → integration graduation →
  recommender depth → platform ops), efforts, dependencies, the three
  human-only decisions, the critical path. The iframe is explicitly interim.
- [`sierra_vendor_lane_handoff.md`](sierra_vendor_lane_handoff.md) — the
  lane handoff (2026-07-03): what shipped (#654/#657 + v27 LIVE), locked
  decisions, verified access facts, the priority queue, safety rails.

## Reference materials

Authoritative external sources we've cached:
- [`reference/`](reference/) — ASCCC / COCI / CCN-CID source documents

## Update history
- **2026-09-04 (SkyFold, S225 — the fold apply, rehearsed, then landed on Sam's yes to all; the sixth id-keyed class)** — Two PRs and a follow-up. #1462 built the receipted half of #1458 before Sam ruled: `kb/_prefix_fold_apply.py`, apply == spec under the receipt's own flags (`--scope` carries item 2's hold, `--ruled-held` item 3's "fold them" with the ruling on each row's evidence; any other receipt refused by P1), P0 per receipt, the fresh read at write-time, thirteen conservation gates, rehearsed end to end on a scratch copy of `kb/`. ⚠️ A "no old id left" sweep must exclude chained keys (30 vacated and refilled in one plan). ⭐ Scanning every file that names one of the 278 old ids found `kb/crnc_mirrors.json` — the sixth id-keyed artifact class, never in the post-apply chain — with 398 keys the 2026-09-03 recode retired, so the dashboard's D-3 mirror suppression had silently stopped for those identities; `kb/_rekey_crnc_mirrors.py` re-keyed it (never regenerated: eleven curated mirrors inside) and runs in the chain now. Sam then replied *"Yes to all recommendations"* (`kb/prefix_fold_rulings_2026-09-04.json`) and #1463 landed the frozen receipt in one cron window: 278 ids onto their discipline's code, 13/13 gates, promotions 24, crnc mirrors 29, `subject_collision_signal` 153 → 113, fold-verify `re_key` 7 = the seven held rows, `kb_curation` re-keyed in 65 seconds (30 chained keys vacate-first, 0 left), artifacts and SkyView rebuilt. Measured on the way: the identities map's 1,597 ghost keys resolve best from the May re-mint map (1,422 live), and the C-ID joins regenerate to identical dispositions (so `current_home` was refreshed). 1 KB note ([`kb-notes/methodology-every-id-keyed-artifact-class-belongs-in-the-post-apply-chain`](kb-notes/methodology-every-id-keyed-artifact-class-belongs-in-the-post-apply-chain.md)), 1 bumped (the rehearsal note), new suites `prefix_fold_apply_test.py` (41) and `rekey_crnc_mirrors_test.py` (17).
- **2026-09-03/04 (SkyTune, S224 — the re-mint series applied, the fold worklist on Sam's sheet, SkyView after his drive)** — Fifteen PRs in one day. Morning: the C-ID chip (#1447), the recode dry run (#1448: a keep-number prefix re-key, not the June re-sequencer), the Z-band retirement dry run (#1449), a fourteen-readings sheet. Sam replied *"Yes to all"*: the rulings as data (#1452), the two applies (#1453), the land in one cron window (#1454: 10,296 ids recoded, 4,053 machine clusters materialized as M-ID records, the Z band retired), the Supabase re-keys and the seven canonical picks, the artifacts and SkyView rebuilt (#1457). The recode re-key's red verify was a chained-key false positive (#1455). The land surfaced the next worklist — 285 rows on a prefix their discipline does not own — planned as a keep-number re-key (#1458, 278 moves, 7 held) on a seven-item sheet. Sam then drove SkyView and wrote eight notes; all eight shipped (#1460), including an identity that opens to show its college courses. Checkpoints #1450/#1451, #1456, #1459 and the closing one; handoff 225 (SkyFold).
- **2026-09-03 (SkyOrbit, S223 — SkyView meets the five goals: full screen, jump to anything, details on hover and click, every stand-alone in orbit)** — The funding queue was measured first (dials unset, `CollegeID2` on none of the four MAP views by probe run 33767273456, only dependabot PRs open) and Sam pivoted to SkyView with five goals, verbatim in `cpl_memory`. One PR (#1441) shipped all five: the map fills the first screen (a **Full screen** word-button; the write panel and the embedded discipline forest one scroll below); the header box jumps to a subject, an identity, a stand-alone or a college course by code or control number; hover is a quick look and click an inspector over the map where a course number opens its catalog description; canvas labels grow with zoom (number → title → units · system); and **every stand-alone course orbits the identity it is most aligned to** — 30,274 of 33,423, 3,149 on the rim — hollow, tethered, the shared signals named, accepted one course at a time by **Move here** as the same `CN:` row a drag writes. Descriptions live in the new public Supabase Storage bucket `ccr-desc` (Sam's 2026-08-24 lean, delivered; empty until the publishing workflow's first dispatch). ⭐ Corroborators must not outvote the primary signal — the first weights let subject + TOP + units + credit beat a clear title, and the test now pins both directions. The same PR, the same day, let **orbits cross disciplines** on Sam's Business / Vocational example (a grab-bag course looks across the whole reference with a bonus for staying home; others cross only for a strong title match when nothing at home fits): 1,521 cross, the rim fell from 3,149 to 2,073. Also captured on the fly: his live-session banner wish (a to-do) and his paste-ready sign-off template (now in `CLAUDE.md`); later that day his loner-orbit direction, his Subject vs Discipline question (the invariant runs the other way; his FLNG example sits on the seam between C-ID's and the MQ list's word "discipline") and the queued-message rule were measured, answered and filed (two to-dos, four memory rows, the vault braindump). 1 KB note ([`kb-notes/methodology-key-a-side-table-by-the-write-key-not-by-position`](kb-notes/methodology-key-a-side-table-by-the-write-key-not-by-position.md)), 1 bumped (the TOP note), 13 memory rows, new suites `ccr_universe_orbits_test.py` (49) and `ccr_skyview_universe.test.js` (69).
- **2026-09-03 (SkyCheck, S222 — the lifecycle checks are on the API, and under 10 is the mask)** — Three PRs. **#1437**: a runner-side probe found Pedro's six CPL lifecycle checks as `'0'`/`'1'` columns on the student aggregated view (the sandbox cannot reach MAP; `columnName: []` now 500s, `["*"]` enumerates) and wired them into the daily fetch. **#1438**: Sam ruled the funding attestation is `Counselor_Verified` alone; `pac` publishes from the 2026-09-03 run (2,820 students · 24,699 units · 18 colleges). **#1439**: the "applied but no eligible" worklist he asked for had zero rows at either grain — the shape was the artifact's own inconsistent suppression (54 small-portal colleges at $0 on Access) — and his ruling shipped as the under-10 package: counts mask under 10, units carry the money, public dollars read "<$1,000" or the nearest $1,000, curator exact (ADR `adr-funding-counts-mask-under-10-units-carry-the-money`); 57 colleges earn on Access now. The funding lane file compacted from 36.7 KB to budget; KB note `methodology-a-floor-lives-in-fixtures-as-well-as-code`.
- **2026-09-02 (SkyLead, S221 — the table leads; the explainer is the public view)** — One PR (#1436) from Sam's seven asks: the institution table is the FIRST section after the introduction on the Implementation Funding tab and on the public explainer (*"most won't care about the details, just their funding"*); every other section is folded on open, **per visit** (the per-browser fold store retired); the Summary sits inside the introduction's box (R11 re-aimed to its requirement — never hidden on open); the priority cards are a fixed two-column pair; the card's "Combined funding" line is gone (it restated the band head's Total Possible, the Target line and the price line). ⭐ **The explainer hosts the tab's OWN college section in a new embed mode** instead of painting a second table from the payload — the hidden engine mount was an embed waiting to happen — and paints the timing milestones and each priority's strategies from the engine. The recommendation to Sam: the explainer is the public view; the old public page should become a redirect (lane NEEDS SAM ④). 1 KB note ([`kb-notes/methodology-a-remembered-toggle-hides-the-default-from-its-author`](kb-notes/methodology-a-remembered-toggle-hides-the-default-from-its-author.md)), 4 memory rows, new suite `cpl_funding_lead_with_the_table.test.js` (29 checks, twelve mutations caught by name).
- **2026-09-02 (SkyCalm, S220 — the calm pass)** — One PR on the Implementation Funding tab, on Sam's brief (*"get rid of any cheesy glyphs … I want folks to feel calm when they open this model"*): every rendered glyph is a word or gone (the row toggle is the institution's NAME; the sort mark is the one ghosted survivor), the chrome lost its fills, stripes and red, the "pools" subtitle left both HTMLs, and **five prose blocks are editable in curate** (plain-text overrides under `text.<key>`, Edit → Save · Cancel · Restore, public page included). His mid-turn call moved the held-in-reserve figure into the gate sentence and ahead of Total Possible. ⭐ **`textContent` has no seams and no tooltips** — a word sweep must read the markup with a space per tag, which is how a `\bpool\b` guard passed "poolRemove" and missed two arrows in `title`s and an `&rarr;`. 1 KB note ([`kb-notes/methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads`](kb-notes/methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads.md)), 5 memory rows.
- **2026-09-02 (SkyTrim, S219 — the drill-in trim, both consolidations, and the explainer audit)** — Three PRs on the Implementation Funding tab. **#1432**: four restatements struck from the college expand, and the finding that the per-priority targets were never missing — `.cplfund-dtl-tscroll` is a child of a `minmax(240px, 1fr)` grid, so a 620px table scrolled sideways inside 240px with three columns past the clip edge; a `grid-column: 1 / -1` span is the whole fix. New **To go** column prints a distance only for a MEASURED row (a suppressed actual plus a gap IS the value, by subtraction). **#1433**: Sam ruled both sheet decisions the day they were put to him — the goal spine folds into the bands (per-goal evidence lines, the limits on the line they belong to, the four cards reduced to a four-row (d)(2) table, **one function feeding both surfaces**) and the flat ledger, with his mid-flight condition *"I don't want to lose editability of variables"* met by keeping the class vocabulary and guarding the dials rather than the look. **#1434**: a register pass over the public explainer (`pot` ×19, "money", "offered", and the "riding college awards" house idiom Sam struck) that turned up **four wrong claims, not the two the handoff named**. ⭐ **The factors one was not stale prose:** `_prios()` never emitted `factor`, the payload defaulted a missing one to 1, and the page printed 1.0 at every setting through a fully live path — a defaulted field looks computed and never moves, and no single-paint test can see it. 1 KB note ([`kb-notes/methodology-a-defaulted-field-looks-computed-and-never-moves`](kb-notes/methodology-a-defaulted-field-looks-computed-and-never-moves.md)), 1 bumped, 7 memory rows.
- **2026-09-01 (SkyMeld, S218 — the house voice, and a `$NaN` on the public page)** — Two follow-ons to the band consolidation. **Sam caught the public explainer printing `$NaN`** where the institution allocation should read: it computed `hero = one_time - admin - scaling - P.feeder; inst = hero + P.feeder`, a carve-out the one-pool model retired, so `P.feeder` was `undefined`. ⚠️ Every assertion in `funding_model_page.test.js` passed through it — that suite reads the page as TEXT and **a static check cannot see a NaN**; it now boots the engine and asserts every `P.<key>` the painter reads still exists (PR #1430). ⚠️ That is the **third** one-pool leftover on that page to surface singly — an audit pass now beats a fourth surprise. **And the CCCCO house voice became doctrine** (PR #1431): Sam shared his VC of Academic Affairs' letter to CSU as the standard, asking for a standing influence rather than a new tool, so it rides three existing stores by the PUSH/PULL rule — rules in `CLAUDE.md`, the nine moves in [`kb-notes/reference-cccco-house-voice`](kb-notes/reference-cccco-house-voice.md), exemplars in the vault, and a `house_voice` lint covering only the mechanical floor. The lint **flagged its own documentation** on the first run (fixed with code spans, the `american_spelling` precedent) and `robust` was dropped as 7 of 27 false positives. 1 KB note, 1 memory row.
