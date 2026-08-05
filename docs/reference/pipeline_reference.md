---
title: "Pipeline Reference — architecture, file inventory, generator, tabs, Supabase (CLAUDE.md offload)"
date: 2026-07-10
tags: [reference, claude-md-offload]
kb-status: internal
obsidian-folder: cpl-project-tracker/docs/reference
related:
  - "[[CLAUDE]]"
---

> **Moved verbatim from `CLAUDE.md` on 2026-07-10 (Session 111 — SkyMighty,
> the pare-down).** This is ALWAYS-CURRENT project memory, not an archive:
> Rule 8 checkpoints update THIS file now. `CLAUDE.md` keeps a stub pointing here.

## Pipeline Reference

### 1. Architecture Overview

```
CCCCO MAP CPL Dashboard (Azure)
        │
        ▼  /api/potential-savings (JSON)
Cloudflare Worker (cpl-proxy.slee-548.workers.dev)
        │
        ▼  GET /scrape?secret=...
live_metrics.json
        │
        ├── CPL_Initiative_Project_List_v3.xlsx (project data, budget, workplan)
        ▼
excel_to_dashboard.py (Python pipeline)
        │
        ├── CPL_Dashboard.html (rendered with KPI cards, project cards, charts)
        ├── CPL_Data.js (JSON data for filters/search)
        ├── statewide_data.js
        ├── kpi_history.json (appended daily)
        └── reports/ (Word doc reports)
              │
              ▼  copied to index.html, committed, pushed
GitHub Pages (cpl-initiative.github.io/cpl-project-tracker/)
```

The Cloudflare Worker calls the CCCCO Dashboard's REST API directly — no
browser automation. This was a deliberate design decision after Chrome-based
scraping proved unreliable.

### 2. File Inventory

| File | Purpose |
|------|---------|
| `cloudflare-worker-proxy.js` | Dual-purpose Cloudflare Worker: POST `/` for Claude API proxy (Custom Reports), GET `/scrape` for KPI scraping |
| `excel_to_dashboard.py` | Main pipeline: reads Excel + live_metrics.json → generates HTML, JS, Word reports |
| `CPL_Initiative_Project_List_v3.xlsx` | Master project data: projects, budget, personnel, workplan goals |
| `live_metrics.json` | Latest scraped KPI data |
| `CPL_Dashboard.html` | Generated dashboard HTML |
| `index.html` | Mirror of `CPL_Dashboard.html` served by GitHub Pages |
| `CPL_Data.js` | Exported project data for client-side filtering |
| `kpi_history.json` | Daily KPI snapshots — drives trend sparklines + deltas. **Session 88 added `ccc_exhibits`** (= the statewide CCC-collaborative EXHIBIT count) and repointed the KPI Trends "CCC Collaborative" row to it, so Trends matches the MAP Exhibits card (132) instead of the legacy `ccc_collaborative` = adopting-colleges (61, still recorded for provenance / the Statewide Exhibits card's "Adopting Colleges"). **Session 109 (2026-07-09) re-grained the headline to COMMON EXHIBIT TITLES** (Sam's call): NEW keys `common_titles` + `ccc_common_titles` (distinct canonical unified titles — issuer/CPL-type variants collapse) drive the Trends "Common Exhibit Titles" / "CCC Common Titles" rows; `map_exhibits` + `ccc_exhibits` (the GROUP grain — now the cards' "Issuer/type variants" breakdown) keep recording for provenance, off Trends. Never repurpose a key to a different grain — new key, deltas read "—" until the series accrues. |
| `fetch_veteran_jst.py` + `veteran_jst.json` | **MIL vs JST** (Session 88). `fetch_veteran_jst.py` GETs the public `potential-savings` API on the daily runner (the Azure host is egress-blocked from the sandbox; the worker scrape doesn't carry these) and writes `veteran_jst.json` = statewide `{mil=EnrolledMilitaryStudents, jst=VeteransWithJSTs, star_colleges=StarCollegeCount}` + per-college `{mil, jst, star}` (Veteran Star = JST ≥ 75% of MIL). **No PII** (same counts the public MAP dashboard shows) → committed (guarded `git add`). Soft-fails (keeps the prior file). Consumed by the generator: `read_veteran_jst()` → `apply_veteran_jst()` (Veteran Sprint card: real JST + MIL + the 75% rule, replacing the military-students proxy) + `render_college_activity_card(veteran_jst=…)` (the College Activity "MIL / JST" column + the Veteran Star, gated `window.COLLEGE_HAS_JST`). ⚠ the computed per-college star count (~46) runs slightly under MAP's `StarCollegeCount` (50) — the savings API has no per-college star flag, so the 75% rule is the best signal (logged as `computed_star_colleges`). Workflow step: daily-dashboard.yml "Fetch MIL/JST veteran data". |
| `statewide_data.js` | Statewide exhibit adoption data. **Session 79 added an additive per-exhibit `authoritative_recs`** (`_build_statewide_adoption`) = credit recs collected from raw `Collaborative Type == "CCC"` rows ONLY (the one MAP-published statewide exhibit, not adopt/adapt copies). Consumed by the Fact Sheet's `fact-sheet/_build_statewide_recs.py` → `fact-sheet/statewide_recs.js`. The existing `credit_recs` (EACR's source) is untouched. See `docs/kb-notes/reference-authoritative-statewide-exhibit-signal.md`. |
| `statewide_prescriptive.js` | EACR prescriptive layer (`window.CPL_STATEWIDE_PRESCRIPTIVE`, keyed by `unified_title`): per credential, the colleges that could adopt it + the likely local course each already teaches. M-ID `adoption_leverage` ⨝ minted memberships, over-merged withheld (§6a). Generated by `_build_statewide_prescriptive()`; consumed by the EACR v2 Credential view. |
| `college_short_names.js` | College full-name → short-name resolver (`window.cplCollegeShort(name[, style])`, `window.CPL_COLLEGE_SHORT`). Generated from `kb/college_short_names.json` by `kb/_seed_college_short_names.py`; `<script>`-loaded after `college_lookup.js`. Powers compact college chips on CCR/EACR/CER (short text + full name in `title`). Static — NOT a daily-cron artifact. See `docs/kb-notes/reference-college-short-names.md`. |
| `coci_lookup.js` + `coci_lookup_data.js` + `coci_lookup_desc_*.js` | **COCI Lookup tab** renderer (`window.CPL_COCI_LOOKUP_TAB`, `#coci-lookup`, added Session 110 — Sam: "a COCI tab I could go to for lookups… with any MID, CID, CCN in chips"). The raw COCI catalog (141,738 rows · 120 colleges) with key fields, **M-ID/C-ID/CCN chips per row** (control-number join via `coci_minted_memberships/singletons`), catalog description on row expand, sortable headers, search/College/Subject/identity/credit filters, drag-resizable widths (`cplCociColWidths.v1`), ⬇ CSV. Data = `coci_lookup_data.js` (17 MB, lazy on first open) + 25 per-subject-letter description shards (56 MB, fetched per expanded row) — built one-shot by `kb/_build_coci_lookup.py`; STATIC, rebuild on a fresh COCI extract, NOT daily-cron artifacts. Tests: `tests/coci_lookup.test.js` (20). |
| `cpl_funding.js` | Implementation Funding tab renderer (`window.CPL_FUNDING_TAB`). Lazy-loaded by the tab shell's inline boot on first `#implementation-funding` open; injects its own `var(--token)` CSS (no Rule-4 mirror needed). Static — NOT a daily-cron artifact. **Session 2 (2026-07-03) Chancellor-facing rework:** a **2-year selectable window** (two year dropdowns; the pool splits by the number of selected years), **year-specific priorities** (Year 1 / Year 2 filter switches each priority's metric text + share + target and the college P1/P2/P3 columns), **editable priority metric/description/share/target + editable feeder headcount/metric + pool inputs**, a **noncredit-feeder carve-out section** (pool = carve-out ÷ years, split among NOCE / SD Cont. Ed / Mt. SAC NC / Calbright by headcount), and a **team-phrase auth bar** (reuses `window.CPL_TEAM_PHRASE`): edits resolve `SCENARIO (per-browser what-if) ?? SHARED (Supabase cpl_funding_config, team-phrase editable) ?? BASE (baked defaults)` — unlocked edits PATCH the shared config for everyone, locked edits are a local scenario the Chancellor explores freely. Kept the college table / drill-ins / district rollup / period toggle / P2/P3 actuals. Requires `team_phrase.js` (loaded eagerly before it). **Session 3 (2026-07-06) equity refinements (team asks, Sam: "Build all 4"):** a **front-load toggle** (disbursement even ⇄ Front-load Year 1 — full window in Yr 1, `↻ carryover` cells, close-out = window end + 1; timing only), the **minimum-viable floor** (`pool.floor_window` $150K default; `allocModel()` iterative waterfall — floored colleges get exactly the floor, remainder renormalizes over the rest, Σ = net pool; ⬆ chips + top-up card), the **rural performance allowance** (`pool.rural_carveout` $1M; 10 RCTC colleges rural-flagged (DRAFT) + in-tab override; each earns carve-out ÷ #rural at ≥ `rural_threshold` (50%) of measurable Yr-1 targets; 🌲 chips + section table), and **baseline-eligibility badges** (informational: ① CPL Coordinator in MAP via the PII-free anon `map_coordinator_summary()` RPC; ② opt-in by 2026-09-01 via `cpl_funding_participation`; Elig column ✓/◐/○ + drill-in team toggles). **Session 3 evening batch:** County column hidden (data stays in drill-in/CSV), **Eligible†** column (perf builder's new PE = distinct students with any eligible units) next to **Transcribed†**, floor-≠-higher-targets note, **⬇ Excel (CSV) + ⬇ PDF (print-window)** exports, **CO Monitor's notes** (gated `cpl_funding_notes` — read AND write reviewer/team-phrase), **seal-blue backgrounds** (`--seal-blue` replaces the charcoal `--navy-primary` on hero/th/seg/buttons), and **named per-browser scenarios** (`cpl_funding_scenarios_v2` slots + authbar selector; v1 auto-migrates). Docs: `docs/cpl_funding_lessons.md`. |
| `cpl_funding_data.js` | Funding-model **defaults** (`window.CPL_FUNDING`, model `2026-07-03.1`): pool inputs, `year_options`/`default_years` (2-year window), `year_priorities` (slot 1 & 2, 3 priorities each with Year-1/Year-2 metric text + shares/targets), `feeders` (4, editable headcount estimates) + `feeder_metric` + `pool.feeder_carveout`, **115 colleges** + SYSTEM (headcount + geo only — **per-college dollars are computed LIVE by the renderer**, not baked; the 4 feeder institutions live in `feeders`, NOT the college table). **The Excel workbook + one-shot builder were RETIRED 2026-07-03** (Sam: "we don't need that excel book anymore") — this is now a **committed, hand-maintained static snapshot** (PII-clean institutional/census aggregates). **Headcounts = the 2025-26 MIS update Sam supplied 2026-07-03** (74 rows; the other 41 carry 2022-23, per-row `hc_vintage` — the tab renders a data-driven mixed-vintage note until the refresh completes). Refresh by editing the `colleges`/SYSTEM headcounts + `headcount_pct` here directly + bumping `model_version`; the prior builder is in git history. NOT a daily-cron artifact. **Session 3 (2026-07-06) policy defaults added** (all in-tab editable): `disbursement` (even), `pool.floor_window` ($150K), `pool.rural_carveout` ($1M) + per-college `rural` flags (DRAFT = the 10-college CCCCO Rural College Transfer Collaborative cohort, `rural_source` provenance) + `rural_threshold` (0.5), `participation_deadline` (2026-09-01). |
| `cpl_funding_performance.js` | Funding priority-metric actuals (`window.CPL_FUNDING_PERF`: per-college P2/P3 distinct-student counts + statewide, small-cell suppressed <5 per the RATIFIED `docs/kb-notes/adr-funding-priority-metrics-privacy.md`). **Daily-cron artifact**: built by `funding/_build_funding_performance.py` from the transient `CustomReport_latest.json` (workflow step 4a2; in the `git add` list); skips gracefully on fetch fallback. P1 is a deliberate gap (`docs/kb-notes/reference-p1-completion-data-gap.md`). |
| `tmc_builder.js` | TMC Builder tab renderer (`window.CPL_TMC_BUILDER`). Lazy-loaded on first `#tmc-builder` open; injects own `var(--token)` CSS. College+TMC selectors → fixed C-ID left / COCI-dropdown right, C-ID auto-match, units check, Total Units, Supabase Save/Resume, export (.docx/print/JSON). Static — NOT a daily-cron artifact. Docs: `docs/tmc_builder_lessons.md`. |
| `tmc_templates.js` | The **45-TMC catalog** (`window.CPL_TMC_TEMPLATES`) — **AUTO-GENERATED by `tmc/_parse_tmc_pdfs.py`** from the official ASCCC TMC PDFs (`tmc/source_pdfs/*.pdf`, committed for provenance). All 45 are `draft` (parsed from the official template, faculty-verify) with real C-IDs + authoritative titles (verified C-IDs pull their title from `cid_descriptors.json`), per-section structure (Required Core / List A/B/C), and an official-template URL in `_meta.sources`. Slots with `cid_unverified:true` carry a C-ID not in our descriptor extract — a deliberate **discrepancy signal** that C-ID (or our reference) may need updating. **Session 66 added the CO-review acceptance metadata** (`refine_slot()`): per-slot **`flexible:true`** marks a FLEXIBLE proviso ("any articulated major-prep / CSU-transferable course") = accept any qualifying course + ASSIST evidence (engine tier 2); per-TMC **`flexibility:'fixed'|'flexible'`** (5 fixed); embedded C-IDs (inline "…C-ID AFS 100" / stray verified tokens) are recovered → real slots, fixing the only 0-C-ID template (African American Studies). 584 C-ID + 119 flexible slots. **Session 90 added the OR-alternative fold**: the parser folds `tmc_or_groups.json`'s intra-line "X OR Y" groups into a single slot with `alts[]` (77/80 folded; `_meta.or_groups` reports applied/skipped). See `docs/kb-notes/reference-adt-acceptance-rules.md` + `reference-tmc-adt-data-model.md`. Re-run after refreshing a PDF or the overlay. Static. |
| `tmc_or_groups.json` | **Curated OR-alternatives overlay** (`tmc/tmc_or_groups.json`, added Session 90). Per `(tmc, section)`, the C-IDs that satisfy ONE requirement line the official template joins with "OR" (pick one) — the intra-line OR that `parse_tmc_pdfs.py` can't recover from `fitz`'s column-scrambled text. Extracted by a per-template **visual PDF read + adversarial verification** (80 groups, each with an evidence quote). Consumed by the parser's OR-fold (first existing-slot member → `cid`, rest → `alts[]`; skips a group with no existing-slot anchor or a within-section member overlap). Authored/editable — correct a group here, then re-run `tmc/_parse_tmc_pdfs.py`. Static — NOT a daily-cron artifact. |
| `tmc_college_courses.js` | Per-college course index (`window.CPL_TMC_COLLEGE_COURSES`: 120 colleges, 141,699 courses + 1,986 synth rows, 8.0 MB) powering the right-side pickers. Built one-shot by `tmc/_build_college_courses.py`. **Session 90 unioned the c-id.net authority** (`kb/reference/cid_articulations.json`) with COCI's `CIDNumber`; **Session 92 (#642) made the union a JOIN LADDER so EVERY non-sequence approval lands** (receipts in `_meta.cidnet_join_lanes`): exact → zero-norm → squashed full code (`PHYS 223`+`F` ↔ `223 F`) → **strict unique-title** (→ the verify-tier `tcid[]` 8th element) → **synthesized flagged row** (7th element `1` — approval real per c-id.net, course absent from our stale-mid-CCN COCI extract; units null). Comma-joined `CIDNumber` values are split (46 were unmatchable primaries). Rows: `[subj,num,title,units,cid]` / `[…,cid,xcid[]]` / `[…,xcid[],1]` synth / `[…,xcid[],0,tcid[]]` title-inferred; consumer matches `{cid}∪xcid∪tcid`, renders tcid `≈ verify` + synth `per c-id.net` chips (never COCI-grade ✓), `autoMatch` prefers hard>title>synth carriers + used-tracks, save/resume round-trips `course_cids/tcids/src`. `sequence:true` rows excluded; soft-fails without the c-id.net file. Static — rebuild only on a fresh COCI/c-id.net extract; NOT in the daily `git add` list. Tests: `tests/tmc_cidnet_synth.test.js` (31). |
| `tmc_college_adts.js` | Per-college **approved-ADT overlay** (`window.CPL_TMC_COLLEGE_ADTS`: `by_college[college][tmc_id] → {b:bucket, s:status, c:control#, a:approvedDate, u:units, t:rawTitle}` + `tmc_totals` + `extra_tmcs`) — the **authoritative source** for which colleges hold an approved ADT in each discipline. Built one-shot by `tmc/_build_college_adts.py` from the COCI **program** export (`tmc/source_data/coci_program_export_<date>.csv`, committed for provenance). The TMC tab stamps a per-college status onto each TMC, mirroring COCI's two affirmative states separately (Session 66 — ✓ Active = live in catalog · ✓ Approved = CO-approved, pending activation · ⏳ In progress · ◐ Teachout; Inactive hidden). 3,238 (college,TMC) pairs (2,867 active · 218 approved-pending) · 115 colleges · 42 ASCCC TMCs + UCTP. UC Transfer Pathway (UCTP Chemistry/Physics) are their **own instances** (`extra_tmcs`, `kind:"uc-transfer-pathway"`), never folded into the Chemistry/Physics ADT. Lazy-loaded by `tmc_builder.js`. Static — NOT a daily-cron artifact; rebuild on a fresh COCI program extract. |
| `tmc_ge_patterns.js` | The **GE Breadth patterns** (`window.CPL_TMC_GE_PATTERNS`) for the full-ADT companion panel (Session 60): **Cal-GETC** (the single statewide ADT GE pattern as of Fall 2025, AB 928; primary) + legacy **IGETC** and **CSU GE Breadth**. Each modeled as `sections[].slots[]` like a TMC but `ge:true`+`noncid:true` (college-certified GE areas, no C-ID auto-match; `units` = per-course minimum). **DRAFT** — encoded from public ASCCC/CCC standards (CCCCO Breadth Form PDFs bot-block the agent env), verify against the official forms. Lazy-loaded by `tmc_builder.js`. Static — NOT a daily-cron artifact. |
| `team_phrase.js` | **Shared team-phrase unlock helper** (`window.CPL_TEAM_PHRASE`, added Session 97 follow-up — Phase 1 of `docs/team_phrase_expansion_plan.md`): validate-BEFORE-store against `rpc/team_pass_ok` (the #598 lesson), the shared `cpl_team_pass` localStorage key, `decorateHeaders` (anon bearer + `x-team-pass` — never "Bearer undefined"), stale-phrase drop on 401/403, and a reusable `unlockRow` UI. Consumed by `workplan_goals.js`, `budget_editor.js`, `assoc_editor.js`, `tmc_builder.js` (curator notes ONLY — the review RPC path stays magic-link). raci.js keeps its own original implementation (same key). STATIC; `<script>` in BOTH HTMLs (Rule 4). Tests: `tests/team_phrase_p1.test.js` (41). |
| `dashboard_filters.js` | Client-side filter/search logic. **Session 97:** reads the slim actions bar (Lead + Search only) defensively — the Activity/Vision/Goal/Status selects, Apply/Reset, and the bar-level Master Report/Attach Doc buttons are retired (attach = card-level 📎 only; the explainer stays). |
| `nav_groups.js` | **Sidebar nav groups** (added Session 97): runtime-wraps the flat rail into 5 labeled collapsible groups + Share (Workplan / Funding / Strategy & Impact / Reference & Curation / Sierra & Team Tools) — the `kpi_cards.js` regen-proof pattern; Dashboard stays pinned; unlisted future tabs stay top-level; active tab force-opens its group; per-browser state `cplNavGroups.v1`; `<script>` in BOTH HTMLs (Rule 4). Tests: `tests/nav_groups.test.js`. |
| `kpi_reorder.js` | Login-free drag-to-reorder for the headline KPI grid (`.kpi-section`): per-browser order in localStorage (`cplKpiOrder.v1`), cards re-matched by label text across daily regens, new cards re-enter at default position, ↺ reset affordance. Static — NOT a daily-cron artifact. |
| `kpi_cards.js` | **KPI card shelf** (added Session 86): per-browser **HIDE** + **centered title row** + per-card **COLLAPSE** for the headline KPI grid — the `kpi_reorder.js` pattern. At runtime it wraps each `.kpi-card`'s `.kpi-number`+`.kpi-label` into a centered `.kc-head` and the rest into a collapsible `.kc-body`; cards open **collapsed (top half only)**, click a card's head to expand, per-card × hides (→ a "Hidden (N)" restore tray), and an **Expand-all/Collapse-all** toolbar flips them all. Scopes to `.kpi-section > .kpi-card` ONLY (the full-width KPI-Trends + College-Activity panels are left alone). State in localStorage (`cplKpiCards.v1`), re-matched by `.kpi-label` across daily regens, injects own CSS, coexists with `kpi_reorder.js` (controls ride a drag; clicks stopPropagation). `<script>` in BOTH HTMLs (Rule 4). Static — NOT a daily-cron artifact. Tests: `tests/kpi_cards.test.js`. Docs: `docs/cobi_lessons.md` (S86). |
| `first_light.js` | **First Light** — the once-a-day plein air greeting (added Session 48): date-seeded painting-of-the-day modal with **local-day rotation** (no day-to-day repeats, Session 62; **89-painting gallery, Session 65**; grayscale→color reveal **(mono:true B&W prints skip the no-op fade via `.cplfl-mono` — load-bearing since 2026-06-23; a build guard fails any un-flagged B&W)**, read-aloud via browser `speechSynthesis`, hand-written alt text), opt-out + once-per-day localStorage guards, a **hidden reviewer almanac** (type `almanac` anywhere → ‹ Prev/Next › the full catalog with a counter; a review pass never consumes the daily greeting — the private QA tool, NOT a public browse-all), runtime-injected "Today's painting" header chip (regen-proof), an anonymous reflection box POSTing `{painting, reflection}` to Supabase `cpl_reflections` (anon WRITE-ONLY RLS; the weekly **musings digest** reads them server-side via `reflections/build_reflections_digest.py` → output bound for the private `cpl-knowledge-base` vault, NOT this repo), and — since the Session-49 retheme — the **ghosted painting layer** behind the whole page (`.cplfl-bg`: today's pick grayscaled at 14% opacity, painterly fallback, honors the opt-out + `prefers-reduced-transparency`/`contrast`). Manifest = **89** verified-PD paintings, built by the **runner-as-Commons-proxy** pipeline — `tools/source_first_light_art.mjs` (sources exact PD filenames from the Commons API on a CI runner, since the agent sandbox can't reach Wikimedia) → `tools/build_first_light_manifest.mjs` (assembles from the curated `tools/first_light_selection.json`; no hand-typed filenames) → `.github/workflows/first-light-art.yml` (push-triggered source + image-liveness verify). Categories in `tools/art_categories.json`; iconic works via the append-only `tools/art_extra_files.json`. Sourcing rules: `docs/kb-notes/reference-public-domain-art-sourcing.md`; pipeline: `docs/kb-notes/playbook-runner-as-external-api-proxy.md` + `docs/first_light_lessons.md`. Static — NOT a daily-cron artifact. Theme spec/prototype: `prototype/first_light_theme_v1.html` (**v1.6 — GLASS-QUIET chips graduated**, Sam-blessed 2026-06-12; solid family archived in the Chip Studio) + `prototype/check_contrast.py` (whose `--live` mode lints the live `:root` in CI — the retheme SHIPPED Session 49, PRs #407/#408/#410). Tests: `tests/first_light*.test.js`. |
| `cobi_brand.js` | **COBI brand layer** (added Session 65): the masthead personality for *COBI — Chancellor's Office Business Intelligence* (a light Kobe homage). STATIC, regen-proof (the `first_light.js` pattern — injects own CSS + runtime DOM): a **rotating Mamba subtitle** (random per load), an **8→24** jersey wink on the wordmark, **Mamba Day** (Aug 24 → purple & gold). The `<h1>`/`<title>` emit `COBI` from the generator (decoupled from `proj_title` so Word reports keep their name); tagline + `#cobi-mamba` slot + nav label are static in BOTH HTMLs (Rule 4). Tests: `tests/cobi_brand.test.js`. Docs: `docs/cobi_lessons.md`. |
| `cpl_todos.js` | The 📋 To-Do button on every tab (added Session 47): renders `kb/cpl_todos.json` as a For-Sam / For-Fable daily checklist with a "where we are" status line; per-browser check-offs (`cplTodos.v1`, keyed by the feed's `_as_of` so each refresh starts fresh); per-tab badge + nav chips for other tabs' items. Feed refreshed at every Rule-8 checkpoint. Static — NOT a daily-cron artifact. |
| `report_generator.js` | Custom Report Generator (Claude API via proxy). **Session 96 wired it LIVE:** before prompting it fetches the newest `item_updates` per activity/project + `item_raci` (lead = Responsible → Accountable) — the same anon overlays the card faces use — and adds a "Latest Activity-Level Updates" prompt block; falls back to the build-time `CPL_DATA.live_updates`, then the baked fields. Test hooks on `window.CPL_CUSTOM_REPORT`. **Session 97:** Report-Type toggle (absorbs the Master Report), Elevation slider, per-audience titles, progress bar, `NAMING_RULE` (see §7). Tests: `tests/report_live_wiring.test.js` + `tests/report_session97.test.js`. |
| `master_report.js` | **Master Report builder** (`window.CPL_MASTER_REPORT`, added Session 96). **Session 97: the filter-bar button was RETIRED** — the Custom Report modal's 📋 Master Report-Type option now drives this module's `fetchLiveOverlay`/`buildReportModel`/`renderDocx` with its own checkbox selection (lazy-loaded via `CPL_TABS.loadScript`; this file's own modal remains as a dormant fallback). Opens the same Activities & Projects checkbox tree as the Custom Report and builds the Workplan-style master .docx CLIENT-SIDE from `CPL_DATA` + the live `item_updates`/`item_raci` overlays — always-current at click time; partial selections stamp a "Scope: N of M" line. Layout ported 1:1 from `generate_reports.js`; uses the local `docx.min.js` (never CDN). The daily pre-built `reports/CPL_Master_Report.docx` stays as the modal's fallback link (and is FRESH again — the workflow now installs node `docx` + commits `reports/*.docx`; it had been failing silently since forever). STATIC, lazy — NOT a daily-cron artifact. Tests: `tests/master_report.test.js` (28). Docs: `docs/cobi_lessons.md` (S96). |
| `docx.min.js` | Local copy of docx@8.0.4 UMD build (do **not** switch to CDN) |
| `fetch_custom_report.py` | Fetches CustomReport JSON from the MAP API |
| `cpl_news.js` | **CPL News** tab renderer (`window.CPL_NEWS_TAB`). Lazy-loaded on first `#cpl-news` open; injects own `var(--token)` CSS; reads `public.cpl_news` LIVE (anon) — CA-first, scope/source/search filters, suggest-a-story, reviewer feature/hide. Static — NOT a daily-cron artifact (the feed is the live table, not a committed file). Fed by the **`cpl-news-harvest`** Supabase Edge Function (`chatbox/supabase/functions/cpl-news-harvest/index.ts`) invoked by **`.github/workflows/cpl-news.yml`** (cron 13:17 UTC). Schema: `news/supabase_cpl_news.sql`. Docs: `docs/cpl_news_lessons.md` + `docs/kb-notes/playbook-cpl-news-aggregation.md`. Added Session 67 (Skywatch, PR #481). |
| `fact-sheet/` | **Public CPL Fact Sheet** — a self-contained, **standalone** page (`index.html` + `factsheet.css` + `factsheet.js` + `img/`) recreating the Feb-2026 journalist Fact Sheet PDF, served publicly by Pages at `…/cpl-project-tracker/fact-sheet/`. "Sits alone" (NO COBI nav) so it's shareable without exposing the internal tabs — the `kb-portal/` pattern, minus the auth gate. `factsheet.js` binds the 6 headline KPIs (+ Military/Workforce/Apprentice breakdowns + Veteran-Sprint figures) from `../live_metrics.json` on load (baked values = graceful fallback); the 5 exhibit/recommendation KPI cards + the Statewide Exhibits per-sector counts are a **labeled MAP Custom Reporting Module snapshot** (not live). Cambria prose / Calibri data; print CSS at 0.4in → browser "Save as PDF" is the export (opens `<details>` for print). Launched from COBI by a **non-tab** `📄 CPL Fact Sheet ↗` anchor in the nav rail (`<a class="cpl-tab cpl-tab-external">`, no `data-tab` so `tabs.js` ignores it; mirrored in BOTH HTMLs, Rule 4). Statewide exhibit lists come from `kb/statewide_exhibit_categories.json`. Static — NOT a daily-cron artifact. Added Session 74 (SkyBlaster), PRs #537/#540. **Session 80 (StarMan) made it Curate-editable** (PR #570): standalone **`factsheet_edit.js`** overlays reviewer edits (text + hide/show) onto any box, keyed by DOM-walked stable `data-fsk` keys (no per-box HTML markup), from `public.factsheet_overrides` (anon read, `is_allowed_reviewer()` write); ✎ Curate button + magic-link `cpl_sb` session + **allowlist**-sanitized HTML; the JST upload card was removed. Editing **excludes** `#statewide-exhibits`/`#progress`/`[data-bind]`. **Session 81 (StarFarout) extended Curate** (PRs #576/#578): **add / ✕ delete / drag-reorder boxes** + **add / replace / resize / ✕ delete images** — all on the *unchanged* `factsheet_overrides` table via **reserved key namespaces** (`\|add\|`, `\|__order`, `\|img\|`, `\|fig\|`) the overlay materializes (image *bytes* live in a public-read / reviewer-write **`factsheet-images`** Storage bucket, `supabase_factsheet_images.sql`); plus a rotating **"My CPL Stories"** section (4 random, headless-sourced from `map.rccd.edu/cplstories/` via `tools/source_cpl_stories.mjs`, PR #577). **Session 82 (SkyFlyer) made the rest of it Curate-able + a11y + Word** (PR #584): the live **Veteran-Sprint** stats are now editable+moveable+Add (live-aware `applyBlock`); the **`#progress` KPI cards** are **move/delete-only** (`MOVE_ONLY_SECTIONS`); the **budget table** is **hide-only**; **＋Add box is per-GRID** (added boxes carry a `gN` grid signature); stable keys now **exclude `[data-bind]` text**. Plus ~15 embedded links, a **WCAG 2.1 AA** pass, print fixes (navy table header no longer white-on-white), and a new **⬇ Word** export. Docs: `docs/fact_sheet_lessons.md` + `docs/kb-notes/playbook-standalone-public-page.md` + `docs/kb-notes/playbook-curate-editable-standalone-page.md` + `docs/kb-notes/methodology-reserved-key-namespaces-on-overrides-table.md` + `docs/kb-notes/methodology-stable-dom-keys-exclude-live-text.md` + `docs/kb-notes/playbook-standalone-dom-to-word-export.md`. |
| `fact-sheet/factsheet_word.js` | **Fact Sheet ⬇ Word export** (`window.CPL_FACTSHEET_WORD`, added Session 82). Dependency-free **DOM-to-`.doc`**: clones the LIVE `<main>` (so it reflects live KPIs + Supabase Curate overrides), strips chrome (TOC / curate controls / live chip / `.no-print` / `.fs-ov-hidden`), expands collapsibles, rebuilds the statewide CSS-grid pseudo-table as a real `<table>`, rewrites images to absolute URLs, and wraps in mso-namespaced Word HTML (`@page WordSection1`, BOM) → `California_CPL_Fact_Sheet_<date>.doc`. Clone-not-mutate (the on-screen page is untouched). Wired to the `#btn-word` action-bar button. Static — NOT a daily-cron artifact. Tests: `tests/factsheet_word.test.js` (19). KB note: `docs/kb-notes/playbook-standalone-dom-to-word-export.md`. |
| `raci.js` | **Team & RACI** tab renderer (`window.CPL_RACI_TAB`, `#raci`). Lazy-loaded on first `#raci` open; injects own `var(--token)` CSS. A **RACI Matrix** (4 Activities + their projects × R/A/C/I, click a cell → member-picker) + an editable **Team Directory** + per-member **Nudge for Updates** toggle. Public reads of Supabase `team_members` + `item_raci` (anon); writes gated by the shared `cpl_sb` magic-link reviewer session + `is_allowed_reviewer()`. **Session 76 (SkyTrek) made the matrix a 3-tier tree** — `buildItems()` nests **Activity → sub-activity → project/work item** from `window.CPL_DATA` (`activity_kpis` = the official sub-activity ids; `projects`' **dotted ids** encode the nesting via id-prefix parenting, `4.1`→`4.1.1`, `3.1.2`→`3.1.2a`; `5.x` with no numbered parent nest under their Activity). 38 rows, depth-indented + tier-styled (`sub-activity` tag). Each row independently RACI-able; **non-Activity rows keep `item_type:"project"`** so no key migration / no lost assignments. Nav: a **hierarchical scope filter** (`<optgroup>` per Activity → "▸ All of Activity N" + its sub-activities; scope `all`/`act:N`/`sub:ID`, ancestor-preserving search) + per-card **`👥 RACI` deep-links** (cards set `sessionStorage['cpl_raci_focus']` then navigate `#raci`; consumer flashes the row — every `<tr>` carries `data-raci-key`). Static — NOT a daily-cron artifact; only the nav button + pane + boot are mirrored in BOTH HTMLs (Rule 4). Schema: `raci/supabase_raci.sql`. Tests: `tests/raci.test.js` (64 checks). Docs: `docs/cobi_raci_nudge_lessons.md`. Added Session 75 (SkyMaster), PRs #546–#548; nav + 3-tier PRs #550/#553 (Session 76). **Session 77 (StarPort) added** (PRs #556–#562): **Copy-RACI** (`⧉ copy` a row's R/A/C/I to others), the **token-refresh-on-write fix** (`ensureFresh()` renews the magic-link access token before every `sbWrite` — a format-valid-but-expired JWT was 401-ing saves silently; `saveRaci` rolls back optimistic state on failure — `docs/kb-notes/methodology-refresh-token-before-write.md`), the **nudge accountability layer** (`team_members += last_nudged_at/last_response_at`; directory Last-nudged + ✓responded/⏳awaiting columns; manual team 📣 + check-all/clear-all), the **per-item 📣 nudge** (emails a row's R/A people, quotes the card + a deep-link to its composer), and the **📝 update composer** (braindump → ✨"Let CC write it up" via the report proxy → appends `item_updates`; deep-link consumer `?update=<key>#raci` / `sessionStorage.cpl_update_focus`; the 📝 link is emitted on every Activity/Project card by the generator). **Session 79 (StarBender) made RACI the card's source of truth** (PRs #567–#571): the card **Lead** now derives from the RACI **Responsible** (not the old `projects.lead`) via the new `card_raci.js` overlay + a hover roster on the 👥 button; the 27 remaining `projects.lead` values were **seeded** into `item_raci` as Responsible (Beth Kay dropped — left the org; titles' embedded orgs kept over seed placeholders); `cplItem()` lead now resolves `raciFor → R→A→pr.lead` + `saveRaci` fires `cpl-raci-updated`; **nudge is now opt-OUT-gated** (`itemNudgeRecipients()` drops `nudge===false` members — fixed wrongful nudges firing for unchecked members); **sortable matrix + directory columns** (click-to-sort; the tree flattens on sort with a `⤺ tree view` restore). **Session 81 (StarFarout) added** (PR #574): the per-item 📣 nudge now shows on EVERY matrix row when signed in (nudge just one item; opt-out still enforced in `itemNudgeRecipients`), the filter-bar bulk button was renamed **"📣 Nudge for updates" → "📣 Nudge All"**, and a 📣 Nudge button now sits on every Activity / sub-activity / project CARD (the generator emits a `cpl_nudge_focus` deep-link beside the existing 📝/👥; a new `consumePendingFocus` `NUDGE_KEY` branch → `openItemNudge` — affordance-visibility-vs-eligibility, `docs/kb-notes/methodology-affordance-visibility-vs-action-eligibility.md`). Tests: `tests/card_raci.test.js` (23), `tests/raci_sortable.test.js` (13), `tests/raci_nudge_optout.test.js` (rewritten), `tests/raci_card_nudge.test.js` (new). |
| `card_raci.js` | **Live card-Lead + RACI-roster overlay** (added Session 79, StarBender). Static, read-only, anon-Supabase (the `card_updates.js` pattern): the generator stamps a `<span class="cpl-raci-lead" data-raci-key="activity:N\|project:<id>">` (seeded with the old `projects.lead` as fallback) + a `data-raci-key` on each 👥 RACI affordance; the overlay fetches `item_raci` and (1) rewrites each card's **Lead** to the resolved **Responsible → Accountable → old-lead**, (2) builds a **hover roster** tooltip (R/A/C/I names) on the 👥 button. Listens to `cpl-tab-activated` + `cpl-raci-updated`. Exports `leadNames`/`byKey`/`rosterHtml`/`roleNames`/`escapeHtml`. STATIC, NOT a daily-cron artifact; `<script>`-loaded in BOTH HTMLs (Rule 4). Tests: `tests/card_raci.test.js` (23). Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `card_updates.js` | **Live card-update overlay** (`window.CPL_CARD_UPDATES`, added Session 78). Read-only: fetches the newest `item_updates` row per `item_type:item_id` (anon Supabase read) and overlays it — body + timestamp + author — onto each Activity / sub-activity / project card via a generator-stamped `<div class="cpl-live-update" data-update-key="activity:N|project:<id>">` hook, hiding that card's creation-era `.cpl-static-update` line when a live update exists. Closes the gap where a 📝 update posted on the RACI tab showed there but not on the card face. Runs on load + on `cpl-tab-activated` (activities-projects/dashboard). STATIC, no auth, NOT a daily-cron artifact; `<script>`-loaded in BOTH HTMLs (Rule 4). The hooks + the sub-activity cards' 📝/👥 deep-links are emitted by `excel_to_dashboard.py` (regenerated sections). Tests: `tests/card_updates.test.js`. Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `card_actions.js` | **Card action opener** (`window.CPL_CARD_ACTIONS`, added Session 83). Static, globally-loaded, no auth of its own. Makes the Activity/Project cards' **📝 Update / 📣 Nudge** affordances open the popup **IN PLACE** instead of bouncing to `#raci` (Sam: "none of this should direct the user to RACI, rather to the Activity and Project tab"): a delegated click interceptor on `.update-link`/`.nudge-link` (+ `.act-*`) reads the item key from the link's inline `onclick`, cancels the `#raci` navigation, lazy-loads `raci.js` via the idempotent `CPL_TABS.loadScript`, and calls `raci.js`'s `openCardUpdate`/`openCardNudge` (which ensure data+CSS loaded then open the existing composer/nudge). Also consumes the nudge-email `?update=`/`?nudge=` deep-link on ANY tab at boot + strips the param (the email now lands on `#activities-projects`). No generator change → works on already-deployed cards. `<script>`-loaded in BOTH HTMLs (Rule 4). Tests: `tests/card_actions.test.js` (15). Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `annual_report.js` | **Annual Report tab** renderer (`window.CPL_ANNUAL_REPORT`, `#annual-report`). Lazy-loaded on first open; injects own `var(--token)` CSS. Assembles a 6-section report draft from live `window.CPL_DATA` each open — Exec Summary · Vision 2030 & Goals · Activity Progress (the 4) · Statewide Impact · Spotlights (Veteran Sprint / Military Base) · Looking Ahead — EDITABLE in place (textarea) with a live markdown preview; toolbar = ↻ Rebuild from data · ✨ AI polish (reuses `CPL_REPORT_PROXY_URL`; disabled if unset) · ⬇ Word (`docx.min.js`) · 🖨 Print. Content is creation-era until `item_updates` is surfaced into it (next). Static — NOT a daily-cron artifact. Tests: `tests/annual_report.test.js` (29). Added Session 77 (StarPort), PR #557. Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `mission_control.js` | **Mission Control** — the "Lift Off" program tracker (`window.CPL_MISSION_CONTROL`, added Session 83). A self-contained **read-only-by-default overlay** (the `card_updates.js` pattern) that renders `kb/liftoff_plan.json` ⊕ a Supabase `liftoff_state` overlay as a **collapsible `<details>` block mounted BELOW the RACI functions** in the Team & RACI tab (mounts on `cpl-tab-activated` when `tab==='raci'`; inserts `#mission-control-root` after `#raci-root`; injects own `var(--token)` CSS; never touches `raci.js`). The plan is **phases (Now/Next/Later) of `task` + `decision` nodes** — a `decision` FORKS the work (an option `activates` its branch tasks + `archives` the others; the choice doubles as the human decision log). Anonymous = read-only; a signed-in/team-phrase user sets task status (`setStatus`) + picks decision branches (`setChoice`) — optimistic write + rollback, upsert to `liftoff_state`. **Forward-only** (PII-incident items dropped — handled long ago). Static — NOT a daily-cron artifact; nav/boot mirrored in BOTH HTMLs (Rule 4). Schema: `mission/supabase_liftoff_state.sql`. Tests: `tests/mission_control.test.js` (32). Docs: `docs/mission_control_lessons.md` + `docs/co_platform_strategy.md`. |
| `project_lifecycle.js` | **Project soft-delete overlay** (`window.CPL_PROJECT_LIFECYCLE`, added Session 84). Lets a reviewer / team-phrase user **Table** (pause) or **Archive** (close) a project on the Activities & Projects cards — it leaves the active grid + every `CPL_DATA` consumer (RACI matrix, Annual Report, custom reports, Workplan Goals ladder) and moves to a collapsed **"Tabled & Archived"** `<details>` section with the reason + date; **♻ Restore** reverses it. Never a hard delete. STATIC, anon-read overlay (the `card_updates.js` pattern) over Supabase **`public.project_lifecycle`** (write gated `is_allowed_reviewer() OR team_pass_ok()`); injects own CSS; reconciles drift since the last regen + provides the 🗄 Table/Archive + ♻ Restore controls. The generator bakes the last-known overlay (tabled cards render HIDDEN with `data-lifecycle`; the collapsed section; tabled ids excluded from `CPL_DATA.projects` + the Workplan Goals tables) and `kb/_load_projects.py:load_project_lifecycle()` folds it into the committed `kb/project_lifecycle.json` ledger (the "noted in the KB" record). `dashboard_filters.js` skips `[data-lifecycle]` cards. Script-loaded in BOTH HTMLs (Rule 4). **SCOPE — real work-item projects ONLY (Session 95):** the **activity layer** (the official 1.x–4.x sub-activities = `derive_core_activity_ids` minus the legacy `5.x` family) is **IMMUNE** — the generator scrubs overlay rows on those ids, the grid no longer renders duplicate cards for them (Activity-metrics card only — "no redundant activity or project cards", Sam 2026-07-02), and `project_lifecycle.js` `activityLayerIds()` + `raci.js` mirror the rule client-side. The modal closes only on a true backdrop click (the capture-walk bug that made Archive unpickable is fixed). Schema: `kb/supabase_project_lifecycle.sql`. Tests: `tests/project_lifecycle.test.js` (42). Docs: `docs/project_lifecycle_lessons.md` + `docs/kb-notes/playbook-soft-delete-generated-entity-via-overlay.md`. |
| `project_add.js` | **Add Project** (`window.CPL_PROJECT_ADD`, added Session 95). "＋ Add project" button beside the Projects (N) header (Activities & Projects) and in the AWG Projects section header (`#awgProjectsAddSlot`); modal form INSERTs `public.projects` — ID auto-suggested as the next free `5.N` from the LIVE id list (tabled rows can't collide), Name/Description/Activity/CPL Goal/Lead/Status/Timeline. Auth = reviewer magic-link OR team phrase (`x-team-pass`; `projects` INSERT/UPDATE widened to `is_allowed_reviewer() OR team_pass_ok()` — migration `projects_write_team_phrase_widen`, schema `kb/supabase_projects_rls_tighten.sql`; DELETE stays reviewer-only). Refresh-before-write, duplicate-id guard, escaped optimistic card, backdrop-only modal close. New rows render fully on the next daily rebuild. STATIC, `<script>` in BOTH HTMLs (Rule 4). Tests: `tests/project_add.test.js` (24). Docs: `docs/project_lifecycle_lessons.md` (S95 continued). |
| `map_users.js` | **MAP Users tab** renderer (`window.CPL_MAP_USERS_TAB`, `#map-users`, added Session 87). Lazy-loaded; injects own CSS. Manages the MAP platform's per-college user roster (MAP "College Users & Roles" — STAFF PII). **DEFAULT public view** = per-college user **counts + the 7-way RoleName mix** + "data as of", from the anon `map_users_summary()` RPC (no PII). **Roster drawer** (👥) reveals names/emails — read with the shared `cpl_sb` reviewer token / `cpl_team_pass` header, **gated server-side** by `map_college_users` RLS (logged-out → no rows → a sign-in gate). **📣 nudge** (signed-in only) opens a **recipient PICKER** (all pre-checked, uncheck anyone) then a pre-filled `mailto:` — nothing auto-sent (the RACI-nudge pattern). Recipients = Primary Contact + VPAA (VP Instruction) + VPSS (VP Student Services) + **CEO** (Session-87 follow-up) from the gated `map_college_contacts`; the draft also (a) links the college to **their own MAP CPL dashboard** (`landing_page_url`, joined in the sync from `chatbox_college_profiles`) and (b) embeds the **college's own user roster** as a Check-All **checklist** (drop a departed staffer before sending → `rosterEmailBlock`) so leadership sees their CPL people. A **last-nudged log** (`map_college_nudges`) stamps "last nudged &lt;date&gt; by &lt;who&gt;" per row. All output HTML-escaped. STATIC, lazy, NOT a daily-cron artifact; nav/pane/boot in BOTH HTMLs (Rule 4). Data synced by `map/sync_map_users.py` + `.github/workflows/map-users-sync.yml` (dispatch + monthly cron; runner-as-proxy to the egress-blocked MAP API; service-key writes; PII never committed). Schema: `map/supabase_map_users.sql` + `map/supabase_map_contacts.sql`. **Session 88** wired the 3 new Custom Report fields (value-signature confirmed): `UserStatus` ∈ {Active, Inactive} → a public **`(N active)`** count per college (`map_users_summary().active_count`); `UserDisciplines` + `LastUpdatedOn` → **reviewer-gated roster columns** (Status badge · Disciplines · Last-updated), never the public aggregate (`statusBadge`/`discCell`). Tests: `tests/map_users.test.js` (70). Scope/story: `docs/map_users_tab_scope.md` + `docs/cobi_lessons.md` (S87–88). |

### 3. Cloudflare Worker (cpl-proxy)

**URL**: `https://cpl-proxy.slee-548.workers.dev`

**Env vars (encrypted in Cloudflare dashboard)**
- `ANTHROPIC_API_KEY` — for Claude API proxy (Custom Reports)
- `SCRAPE_SECRET` — shared secret for scrape endpoint (currently `CPL_SCRAPE_2026`)

**Endpoints**
- `POST /` — proxies to `https://api.anthropic.com/v1/messages`. CORS restricted
  to `cpl-initiative.github.io`, `localhost`, `127.0.0.1`.
- `GET /scrape?secret=SCRAPE_SECRET` — calls the CCCCO Dashboard API, returns
  JSON with 6 KPI metrics + college tier classification.

**Data source**: `GET /api/potential-savings?cpltype=0&indExcludeSA=0` on
`cpldashboardcccco.azurewebsites.net`. Returns ~117 rows: Count (`Sorder=-1`),
ALL COLLEGES aggregate (`Sorder=1`), ~115 individual colleges (`Sorder=2`).

**6 KPI metrics output**: STUDENTS SERVED, ELIGIBLE UNITS, TRANSCRIBED UNITS,
SAVINGS, 20-YEAR IMPACT, ACTIVE COLLEGES (with Leading/Advancing/Inactive tier
breakdowns).

### 4. 3-Tier College Classification — "3 of 5" criteria model

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Student Volume | Students ≥ 500 |
| 2 | Articulation Depth | Eligible Units ≥ 3,000 |
| 3 | Avg Eligible Units/Student | AverageUnits ≥ 5 |
| 4 | Transcription Rate | TranscribedUnits/Units ≥ 25% |
| 5 | Avg Transcribed Units/Student | TranscribedAverage ≥ 3 |

- **Leading**: meets ≥ 3 of 5
- **Advancing**: not Leading and not Inactive
- **Inactive**: Students < 10 AND Units = 0

Rationale: the 3-of-5 model lets small colleges like Palo Verde (14 students)
reach Leading through effectiveness metrics, while large colleges with only
volume stay Advancing.

### 5. Python Pipeline (excel_to_dashboard.py)

1. Reads `CPL_Initiative_Project_List_v3.xlsx` (projects, budget, workplan,
   update log)
2. Reads `live_metrics.json`
3. Merges live metrics into headline KPIs (replaces static values, adds LIVE
   badges)
4. Generates the dashboard HTML by **replacing sections in the existing HTML**:
   KPI Summary Cards, Activity KPI Cards, Project Cards, Workplan Progress,
   Budget, Vision 2030, exhibit analysis section
5. Exports `CPL_Data.js`, `statewide_data.js`
6. Appends snapshot to `kpi_history.json`
7. Generates Word reports (master + per-project)

**Live Metrics Merge** — `merge_live_metrics()` maps scraped metric titles to
KPI keys:

```python
title_map = {
    "STUDENTS SERVED":    "cumulative_students",
    "ELIGIBLE UNITS":     "eligible_units",
    "TRANSCRIBED UNITS":  "transcripted_units",
    "SAVINGS":            "estimated_savings",
    "20-YEAR IMPACT":     "twenty_year_impact",
    "ACTIVE COLLEGES":    "active_colleges",
}
```

Preserves `note` fields on breakdowns (rendered as parenthetical descriptions)
and `footnote` arrays (rendered as small text at bottom of KPI card).

**Running locally**
```bash
python3 excel_to_dashboard.py
```

### 6. Daily GitHub Actions Workflow

`.github/workflows/daily-dashboard.yml` — runs daily on a **3-cron ladder**
(`17 6` / `17 9` / `17 12 * * *` = 06:17 / 09:17 / 12:17 UTC, ~3h apart; pulled
earlier + a 3rd cron added 2026-06-22, superseding the 2026-06-01 PR #216 two-cron
setup) and on manual dispatch. The ladder exists because GitHub's `schedule`
trigger is best-effort: it chronically delays this cron 1.5–4h and occasionally
**drops** a run with no failed run + nothing queued (e.g. 2026-06-01; prior
2026-04-18 needed a Rule-3 interpolated `kpi_history` backfill). We can't shrink
the delay, so we schedule EARLY (primary ≈11 PM PT the night before) for buffer
and let later crons catch a dropped/over-delayed earlier one before the workday.
The job is idempotent (concurrency group `daily-dashboard` + same-day
snapshot/`kpi_history` overwrite + "no staged diff → no commit"), so a later cron
firing after a good earlier run is a safe no-op. Diagnosis + fix playbook:
[`docs/kb-notes/playbook-github-scheduled-workflow-reliability.md`](docs/kb-notes/playbook-github-scheduled-workflow-reliability.md).
Uses `actions/checkout@v6` + `actions/setup-python@v6`.

Steps:
1. Checkout `main`
2. Fetch CustomReport JSON (`fetch_custom_report.py`)
3. Scrape live metrics via Cloudflare Worker
4. **Sync curation overlay from Supabase** — runs `kb/_apply_curation.py`
   (folds `public.kb_curation` edits into `kb/coci_curation.json`). Guarded on
   the `SUPABASE_SERVICE_KEY` secret; skips gracefully if it's unset.
5. Run `excel_to_dashboard.py`
6. `cp CPL_Dashboard.html index.html`
7. Commit + push to `main` (rebase-retry loop for concurrent pushes — see
   commit `679c5ef`). The commit list includes `kb/coci_curation.json`,
   `unified_courses_data.js`, `unified_courses_index.js`,
   `unified_courses_details.js`, `unified_courses_standalone.js`,
   `unified_courses_members.js`, and `exports/unified_courses.xlsx` so curation +
   the regenerated Unified Courses dataset, lazy files, and export are captured
   each day. (If you add a new generated `unified_courses_*.js`, add it to this
   `git add` list or the daily run won't publish it.)

Commits as `github-actions[bot]` with message `Daily dashboard update — YYYY-MM-DD`.

**Secret required for the curation sync**: `SUPABASE_SERVICE_KEY` (the Supabase
service-role key) in repo Actions secrets. Without it, step 4 no-ops and
curation only lives in Supabase (still shown live via the tab's overlay).

### 6a. CPL Analytics Section — collapsible card grid

The section previously called "MAP Articulation Analysis" / "Detailed
Articulation Data" was renamed to **CPL Analytics** on 2026-05-18. Key
properties to preserve:

- Collapsible chrome reuses the **KPI Metrics** wrapper classes
  (`.kpi-section-wrapper`, `.kpi-section-header`, `.kpi-section-title`,
  `.kpi-toggle-arrow`) so the two sections feel identical. Body class
  is `.cpl-analytics-body`; the collapse rule is
  `.kpi-section-wrapper.collapsed .cpl-analytics-body { display: none; }`.
- Each card has a header **title-row** with a per-table **Excel export
  button** on the right that links to `exports/<card_id>.xlsx`. The
  xlsx files are pre-generated by `_write_analytics_xlsx_export()`
  during the daily run; no client-side xlsx library is shipped.
- Each of the 5 main tables has a **Total row** styled with class
  `.exhibit-total-row`. The two ranking tables — **Top-50 Most-Articulated
  Exhibits** and **Articulations by Unified Course** — are intentionally
  excluded since rank rows don't sum.
- **Articulations by Unified Course** (added 2026-05-22) is the one card
  driven by the **course-identity layer**, not raw MAP rows: it reads
  `kb/coci_articulations.json` via `_build_articulations_by_course()` and
  groups earned MAP articulations by unified course identity (C-ID/CCN/M-ID),
  so the same course taught at many colleges collapses to one row. Columns:
  unified course, discipline, colleges earned, modal credit recommendation,
  linked credential, **adoption leverage** (peer colleges teaching the same
  identity that haven't earned it). HTML shows the top 50 by leverage; the
  xlsx export carries all ~2,355 identities. **Over-merge guardrail:** leverage
  on identities flagged `over_merged` is **withheld** (rendered as "⚠ flagged",
  exported as "over-merged (withheld)") so a conflated cluster never yields a
  bogus adoption target. Skips gracefully if `kb/coci_articulations.json` is
  absent. (This is item (1) of the EACR-identity open thread — the additive
  card; re-pivoting the interactive EACR table itself is the deferred follow-on.)
- The static CSS in the input template carries TWO historical marker
  blocks that the generator now strips on every run:
  `/* ═══ MAP Articulation Analysis Cards ═══ */` (current) and
  `/* ═══ MAP Exhibit Analysis Cards ═══ */` (legacy). Keep both
  strippers in `main()` near the EXHIBIT_CSS_MARKER block — they're
  what guarantees idempotency across rename events.

### 6b. Workplan Activities & Projects wrapper (own tab — moved 2026-05-31)

**Moved out of the Dashboard tab into its own top-level "Activities &
Projects" tab (`#tab-activities-projects`, hash `activities-projects`) on
2026-05-31 (Session 22, PR #206).** Inside that tab, the Activity Metrics,
Filter Bar, and Projects Grid still collapse together as **one** unit, under
the section title **Workplan Activities & Projects**. The Filter Bar applies to
both, so they share one collapse toggle. (Distinct from the **Annual Workplan
Goals** tab, which holds the 5-year targets table — different content.)

- Outer wrapper id: `#workplanProjectsWrapper` (class
  `kpi-section-wrapper`); body class is `.workplan-projects-body`.
  Collapse rule:
  `.kpi-section-wrapper.collapsed .workplan-projects-body { display: none; }`
  (lives inside `EXHIBIT_ANALYSIS_CSS` so the daily regen restores it).
- Wrapper open/close lives in the **static template** (now inside the
  `#tab-activities-projects` pane) between
  `<!-- ═══ Workplan Activities & Projects Section ═══ -->` and
  `<!-- ═══ End Workplan Activities & Projects Section ═══ -->`.
- The injected **Workplan Activity Metrics** subsection has NO inner
  `kpi-section-wrapper` of its own — the outer wrapper provides the
  only collapse. If you re-add inner collapse chrome, you'll get
  nested collapsibles with confusing UX.
- **Generator anchors (post-move — IMPORTANT):** KPI Summary Cards
  replacement, MAP Articulation Analysis strip, and CPL Analytics strip/inject
  end-anchor on the **permanent sentinel `<!-- ═══ Dashboard Sections End
  ═══ -->`**, which **stays in the Dashboard tab** where this section used to
  begin (after CPL Analytics, before the teaser cards). The section's own
  marker travelled with it to the new pane, so it can no longer serve as the
  end-anchor (it'd let the bounded regexes gobble everything between the
  Dashboard tab and the new pane on the next regen — catastrophic). The
  **Workplan Activity Metrics strip/inject** and the **Projects Grid replace**
  still use `<!-- Filter Bar -->` / `<!-- Projects Grid -->` / `<!-- End
  Projects Grid -->` because those anchors travelled *with* the content into
  the new pane and resolve there via `html.find()`. Hard-case procedure:
  [`docs/kb-notes/playbook-move-generated-section-to-tab.md`](docs/kb-notes/playbook-move-generated-section-to-tab.md).

### 7. Custom Report Generator

- **UI**: Modal with a **Report Type toggle** (⚡ audience narrative / 📋 Master
  data report — the Master Report was consolidated INTO this modal in Session 97;
  its filter-bar button is retired), audience picker (each audience carries a
  document `title` stamped by the docx template — the model is told NOT to write
  its own), the **Elevation slider** (0→30,000 ft; bands in `ELEVATION_BANDS` map
  to detail/length guidance + a structure swap at >20k ft; persisted per-browser
  in `cplReportElevation.v1`), checkbox tree, and a staged **progress bar**
  (replaces the old "Generating..." label; time-based creep during the API call).
- **Backend**: POSTs to Cloudflare Worker → Anthropic API
- **Model**: `claude-sonnet-4-5` (unversioned alias — never re-pin a dated
  snapshot; `college_report_generator.js` + `annual_report.js` de-pinned too)
- **Naming**: every prompt carries `NAMING_RULE` (CPL Initiative / Mapping
  Articulated Pathways (MAP) platform; "Military Articulation Platform" is
  history-only — see Naming & terminology)
- **Output**: in-browser preview or downloadable .docx (via local `docx.min.js`)
- **Config**: `window.CPL_REPORT_PROXY_URL` set in HTML before
  `report_generator.js` loads
- **Live data (Session 96):** at Generate time the prompt is built from the
  LIVE overlays, not the build-time bake — newest `item_updates` per
  activity/project (RACI 📝 composer) folded into each selected project's
  Latest Update, RACI Responsible→Accountable as the Lead, and an
  activity-level updates block. The **Master Report** button opens the same
  checkbox tree via `master_report.js` (§2) and builds its docx client-side
  from the same live overlay.

### 7a. College Activity Custom Report — Output Style Guidance

`college_report_generator.js` produces the "[College Name] CPL Update" Word
document. The prompt inside `buildPrompt()` enforces a specific tone and
shape — keep these guarantees if you ever rewrite the prompt:

- **Title**: Single-college reports are titled `<College Name> CPL Update`;
  multi-college reports default to `Selected Colleges CPL Update`. The docx
  builder writes the title itself, so the model is instructed NOT to repeat
  it as a `#` heading.
- **Audience assumption**: a busy college CEO, trustee, or board member —
  someone looking for bragging rights to share with constituents.
- **Tone**: CPL is a new endeavor for most CCCs. Be grateful for any
  activity. Never imply that a college is negligent, behind, or failing.
- **Reframe weaknesses as opportunities.** Low transcription rate → "credit
  waiting to be unlocked." Thin discipline coverage → "room to expand."
  Funding is predicated on outcomes, so gently equip the reader with
  awareness of what unlocks more apportionment, but always invitingly.
- **Structure** (in this order, `##` headings):
  1. Executive Summary — 1-2 short paragraphs, high-level, achievements +
     biggest opportunity. No metric dump.
  2. Notable Accomplishments — bullet list of 3-6 wins, each with a real
     number.
  3. Opportunities to Maximize Funding & Student Impact — bullets/short
     paras reframing gaps as opportunities.
  4. Next Steps — 2-4 concrete actions.
- **Length**: target 600-1,000 words. Eliminate redundancies — never
  restate the same metric in multiple sections.
- **Filename**: `<College_Slug>_CPL_Update_<YYYY-MM-DD>.docx`.

If you change the prompt, mirror the change here so the guidance and the
code stay in sync.

### 7b. Top-level Tab Layout (Phase D, 2026-05-18)

The dashboard renders a left-rail nav of top-level tabs, navigated via URL
hash so they are linkable and survive a refresh. `tabs.js` **auto-derives
`VALID_TABS` from the rendered nav buttons** — adding a tab is "drop a nav
button + a pane," no whitelist edit. The core data tabs (the rest —
`unified-courses`/CCR, `canonical-subj4`/CSR, `credential-reference`/CER,
`exhibit-adoption`, `tmc-builder`/TMC Builder (§7d), `pipeline`, `letters`,
`chatbot`/CPL Assistant — are documented elsewhere; the CPL Assistant RAG tab is
detailed in §7c):

| Tab key (hash) | Display label | Content |
|----------------|---------------|---------|
| `dashboard` (default, no hash) | Dashboard | KPI Metrics, CPL Analytics, **plus teaser cards** linking to the other tabs. (Workplan Activity Metrics + Filter Bar + Projects Grid MOVED OUT 2026-05-31 → `activities-projects`.) |
| `activities-projects` | Activities (renamed Session 97; = activities + projects) | Workplan Activity Metrics, Filter Bar, Projects Grid (the `#workplanProjectsWrapper` collapsible — see §6b). **Added 2026-05-31, PR #206.** **Session 95: the grid holds only real work-item projects** (4.1.x + 5.x) — sub-activities render as Activity cards only, and are IMMUNE to Table/Archive; the Path-to-2030 charts moved to CPL Analytics (Dashboard tab). |
| `workplan-goals` | Annual Workplan Goals | The 5-year goals + stretch + current table, **plus the Projects section (Session 95)** — the real work-item projects (4.1.x sprint children + 5.x) in a compact table (live RACI lead via `card_raci.js`), with a ＋ Add-project button (`project_add.js`) |
| `budget` | Budget | CPL Budget & Expenditure Plan |
| `implementation-funding` | Implementation Funding | CPL Implementation Funding model (DRAFT-chipped), **Chancellor-facing scenario tool (Session 2, 2026-07-03)** — a **2-year selectable window** (year dropdowns), **year-specific priorities** (Year 1 / Year 2 filter, editable metric/description/share/target), a **noncredit-feeder carve-out** (NOCE / SD Cont. Ed / Mt. SAC NC / Calbright, headcount-split), 115 colleges' potential allocations, and **P2/P3 actuals vs target** from the daily `cpl_funding_performance.js` (P1 = deliberate incentive gap). Edits layer **per-browser what-if ⊕ shared Supabase config (team-phrase editable, `cpl_funding_config`) ⊕ baked defaults**. **Session 3 (2026-07-06) equity refinements:** front-load-Year-1 disbursement toggle (+ carryover/close-out), $150K minimum-viable floor (waterfall within the pool), the rural performance allowance ($1M carve-out, RCTC DRAFT roster, ≥50% of Yr-1 targets), and baseline-eligibility badges (CPL Coordinator live from MAP + Sept-1 opt-in registry — informational, dollars unchanged). Shell static; renders from `cpl_funding.js` + `cpl_funding_data.js` (lazy; data static, actuals cron). **Built 2026-06-11, PRs #352–#368; reworked 2026-07-03** — `docs/cpl_funding_lessons.md`. |
| `vision-2030` | Vision 2030 | Vision 2030 Alignment cards with live progress |
| `annual-report` | Annual Report | Capstone — assembles a 6-section CPL Annual Report draft from live `CPL_DATA` (Exec Summary · Vision 2030 & Goals · Activity Progress · Statewide Impact · Spotlights · Looking Ahead), editable + live preview + ✨AI polish / ⬇Word / 🖨Print. Renderer `annual_report.js` (static, lazy). **Added Session 77 (StarPort), PR #557.** |
| `knowledge-base` | Knowledge Base | Sign-in-gated **KB Portal** — an `<iframe src="kb-portal/">` (like Letters) over the public CPL Knowledge Base: a magic-link-gated reader + a **New-doc composer** (draft/upload → Claude polish → tokenless GitHub commit). The bundle's own Supabase auth is the gate. **Added Session 63, PRs #464/#465/#467/#468.** **Session 86 added shared-team-phrase access** (PR #610) — an alternative to the magic link: the SAME `cpl_team_pass` as the Team & RACI tab, validated server-side against the MAIN project's `team_pass_ok()` RPC (carries over via same-origin localStorage; unlocks the reader + the composer). `kb-portal/config.js` (`TEAM_SUPABASE_*` consts) + `app.js`. Docs: `docs/kb_portal_lessons.md` + `docs/cobi_lessons.md` (S86). |
| `cpl-news` | CPL News | **Auto-curated** CPL news feed (CA-first, then national; + adjacent systems Career Passport / CA Master Plan / workforce-upskilling + CA budget items). Live-reads `public.cpl_news` (filled daily by the `cpl-news-harvest` Edge Function); filters, suggest-a-story (the path closed socials enter), reviewer feature/hide. Renderer `cpl_news.js` (static, lazy). **Added Session 67 (Skywatch), PR #481.** Docs: `docs/cpl_news_lessons.md`. |
| `raci` | Team & RACI | Ownership spine for the workplan — a **3-tier RACI Matrix** (Activity → sub-activity → project/work item, each RACI-able × R/A/C/I) + an editable **Team Directory** + per-member update-**nudge** toggle, over Supabase `team_members` + `item_raci` (public read, reviewer write). Matrix has a **hierarchical scope filter** (Activity / sub-activity optgroups) + per-card **`👥 RACI` deep-links** (Session 76). Renderer `raci.js` (static, lazy). **Added Session 75 (SkyMaster), PRs #546–#548; nav PR #550 + 3-tier PR #553 (Session 76).** Docs: `docs/cobi_raci_nudge_lessons.md`. |
| `map-users` | MAP Users | Manage the MAP platform's per-college **user roster** (MAP "College Users & Roles", staff PII) + a per-college refresh **nudge**. Public view = counts + role mix (anon `map_users_summary()`); roster (names/emails) reviewer/team-phrase-gated; 📣 nudge = mailto to Primary Contact + VPAA + VPSS. Renderer `map_users.js` (static, lazy). Gated Supabase `map_college_users` + `map_college_contacts`, synced by `map/sync_map_users.py` (`map-users-sync.yml`). **Added Session 87 (StarMax), PRs #618–#621.** Scope: `docs/map_users_tab_scope.md`. |
| `map-export` | 🗺 MAP Export | The **canonical credential layer shaped to the MAP Exhibit Module** (Malone's FullExhibitJSON — sample committed at `kb/reference/map_full_exhibit_sample.json`): one record per unified title with honest nulls, live kb_curation overrides applied, additive `localVariants` (the raw college-entered titles) + `trainingAgency` extension fields; search + master-detail JSON viewer + ⬇ Download all (JSON) / ⬇ CSV / per-record ⬇⧉. Renderer `map_export.js` (static, lazy — loads `credential_reference_data.js` on demand). **Added Session 109 (SkyBreak).** Tests: `tests/map_export.test.js` (70). Docs: `docs/cer_v2_redesign_lessons.md`. |
| `coci-lookup` | COCI Lookup | The **raw COCI course catalog** as a lookup surface (Session 110): 141,738 course records with M-ID / C-ID / CCN identity chips, descriptions on expand, sortable/filterable/drag-resizable columns, ⬇ CSV. Renderer `coci_lookup.js` (static, lazy); data static one-shot from `kb/_build_coci_lookup.py`. |
| `cpl-pathways` | 🎓 CPL Pathways | Audience-facing **apprenticeship-to-baccalaureate course maps** with CPL check-offs (built for the California Apprenticeship Council presentation, 2026-08-13). Pathway REQUIREMENTS live in `cpl_pathways_data.js` (curated static); the ✓ marks are **derived at render time from the live CER dataset** (`credential_reference_data.js` — a course lights up when the college's MAP articulation exists; number-normalized "40.5"≡"40.50"), CLEP ◆ GE options from the ESLEI 24-35 chart baked into CER `ge_credit`. `no_count` sections show alternate-track courses without double-counting units. First pathway: **Cerritos Field Ironworker Supervisor BS** — 15 IWAP courses ✓ 31.5u, 15u CLEP-eligible GE, hero tiles + segmented unit meter + "The billboard" outreach callout. Renderer `cpl_pathways.js` (static, lazy). Deliberately top-level/ungrouped in the nav during CAC prep (`nav_groups.js` leaves unlisted tabs top-level). **Added SkyIron side-lane, 2026-07-10.** Tests: `tests/cpl_pathways.test.js` (50). Docs: `docs/cpl_pathways_lessons.md`. |
| `nc-learning-partners` | 🤝 Noncredit & Learning Partners | The **actionable half** of [`docs/noncredit_cpl_thinking.md`](../noncredit_cpl_thinking.md) — the thinking doc keeps the prose REASONING, this tab keeps the picture as it sits TODAY plus the state that changes (deliberate split: rendering the doc here would fork a 1,500-line file into two that drift). Five collapsible sections + jump links + expand/collapse-all: **(1) Where this sits today** — narrative opening with the **six MODES** of Learning Partner CPL (M1 mirrored courses · M2 certificates and licenses · M3 noncredit certificates · M4 high-school Cx · M5 portfolio and work experience · M6 CPL toward a noncredit award), each defined by what the student brings / cost / fit / current state so the team can prioritize institution by institution; **(2) Opportunity register**; **(3) Dormant statewide exhibits — COMPUTED LIVE** from `credential_reference_data.js` (statewide exhibits published at ≥2 colleges with **zero** transcriptions = completed faculty work nothing is flowing through — 49 across 252 college-slots at build time; only 30 of 84 statewide exhibits have ever converted a unit); **(4)** the twelve-case taxonomy by tier; **(5)** open questions (Needs Input / Needs research). **Report generator**: ⧉ Copy · ⬇ Markdown · ⬇ Word (local `docx.min.js`) · 🖨 Print — narrative pulled from the RENDERED DOM so the report cannot drift from the screen. Curated data `kb/nc_learning_partners.json`; renderer `nc_learning_partners.js` (static, lazy, injects own CSS, lazy-loads the ~3 MB CER on first open). **PRIVATE for now** (Sam: "private now, field-facing later") — data shapes are partner-safe so a public view needs no rework. **Write layer (2026-08-05):** every card (question / opportunity / mode / use case) carries an **✎ Add insight** affordance over Supabase `nc_partner_notes` (`kb/supabase_nc_partner_notes.sql`), keyed by ITEM ID so one affordance covers all four sections. Read AND write are gated by the generic team phrase (`cpl_team_pass`, same as Team & RACI) or a signed-in reviewer — the tab is private and notes carry internal thinking, so there is no blanket anon read. **Answering never closes, just revises** (Sam): a revision goes through the `nc_partner_note_revise` RPC which links `supersedes`/`superseded_by` atomically; the predecessor is retained and **there is no delete policy at all**. Notes sit **alongside** the curated register, never rewriting it — an **↑ Promote notes** button emits a dated promotion packet (per-note decision: register field / `docs/kb-notes/` / both / hold) that a human commits, so the version-controlled spine keeps its audit trail. ⚠ **Tracker lanes only** — the public `cpl-knowledge-base` changes ONLY via its own `CURATION.md` human-reviewed draft PR; nothing here writes there. **Added 2026-08-05.** Tests: `tests/nc_learning_partners.test.js` (82). |
| `sierra-training` | Sierra Training | **Team-only** improvement loop for Sierra (Phases 1+2 of `docs/sierra_training_tab_scope.md`): the 👍/👎 **feedback queue** (`sierra_feedback`, triage `new→triaged→addressed` via the `sierra_feedback_set_status` RPC; **Session 94 P1**: 🧪 Test-in-Sierra prefill handoff → `#chatbot`, ⧉ copy, 24h/7d/30d date filters, bulk triage, and a per-row **chat-turn telemetry link** — similarity/topic-match/gap chips) + a **gap miner** over `chat_interactions` (low-similarity turns, punt-signature answers, recurring themes, audience slice) + the **🧭 GUIDANCE pane** (Session 94 Phase 2 — author short directives in `sierra_guidance`; cpl-chat v26 appends the newest 10 active to every prompt INCLUDING the production widget; deactivate, never delete; honest "sent / beyond top-10" chips). Renderer `sierra_training.js` (static, lazy, the `map_users.js` pattern); reviewer/team-phrase gated server-side by RLS — logged out sees only the sign-in gate. NEVER writes to the public KB (curation pipeline only). **Added Session 93 (SkyReach); P1+P2 Session 94 (SkySierra, #650/#651).** Tests: `tests/sierra_training.test.js` (38) + `tests/sierra_training_p1.test.js` (26) + `tests/sierra_guidance.test.js` (23). |

**Not a tab, but launched from the rail:** the **public CPL Fact Sheet**
(`fact-sheet/`, §2 File Inventory) is reached by a `📄 CPL Fact Sheet ↗` anchor at
the bottom of the nav rail — an `<a class="cpl-tab cpl-tab-external">` with **no
`data-tab`**, so `tabs.js` (which derives tabs from `.cpl-tab[data-tab]`) ignores
it and it opens the standalone page in a new tab. Mirrored in both HTMLs (Rule 4).
Added Session 74. **Session 89 added a second such rail launcher — `Ask Sierra ↗`
→ the standalone `sierra/` chat page** (chat-first, multi-turn Sierra, shareable
externally without the internal tabs; served by the lean Pages deploy; PR #633).
**Session 94 (SkySierra, #649) replaced its 🏔️ emoji with the Sierra mark** — the
Whitney ridge in a navy roundel as an inline SVG (both HTMLs, Rule 4); the same
`SIERRA_MARK` roundel is now the chat avatar in `sierra/sierra.js`, `cpl_chat.js`
(was 🎓), and `fact-sheet/factsheet_sierra.js`.
**Session 90 (SkySherpa) rebranded that page's header** (PRs #635/#636/#637): the
🏔️ emoji → the official **CPL Initiative logo** (`sierra/cpl-initiative-logo.png`,
white/transparent), a hand-traced **Mt Whitney ridge ghosted behind the "Sierra"
wordmark** (`sierra/whitney-mark.svg` — single white stroke + snowcap, 34% opacity,
flat base on the text baseline), and the tagline **"Your CPL Sherpa"**. Static
files under `sierra/` — no Rule-4 mirror, not a daily-cron artifact. Story:
`docs/cpl_assistant_lessons.md` (Session 90).

Implementation notes (important — keep in sync with the generator):

- Tab nav, tab panes, and the tab-switch JS live in the **static
  template** (`CPL_Dashboard.html`), not in the generator. Each tab pane
  is wrapped with its own `<div class="main-container">` and ends with a
  `<!-- /tab-<name> -->` close comment.
- Section boundary markers were added on Phase D so generator
  replacements stay inside the right pane on repeat runs:
  `<!-- End Projects Grid -->` and `<!-- End Vision 2030 Section -->`
  delimit those two sections; Budget and Annual Workplan Goals
  already had paired `<!-- End ... -->` markers.
- **Annual Workplan Goals is injected TWICE in main()**
  (`render_workplan_goals_html` + `render_annual_goals_table_html`).
  Both code paths now replace **in place** between the AWG markers
  rather than re-anchoring against `<!-- Vision 2030 Section -->` — if
  you re-anchor against Vision again, the content ends up in the wrong
  tab. (See the bug fixed 2026-05-18.)
- The Dashboard tab carries auto-generated **teaser cards** built in
  the generator and injected at `<!-- TEASER_CARDS_PLACEHOLDER -->`.
  The placeholder lives between main-container close and Dashboard
  pane close, so the cards span full width but stay inside the pane.
- Tab switching JS sits at the bottom of the template (just before
  `</body>`) and uses `history.replaceState` for the default tab so the
  URL stays clean.

### 7c. CPL Assistant — in-dashboard RAG chatbot tab (Phase 1, 2026-06-01)

The **CPL Assistant** tab (`#tab-chatbot`, hash `chatbot`) is a conversational
RAG surface. `cpl_chat.js` (a self-contained **static** asset — NOT regenerated
by `excel_to_dashboard.py`) POSTs `{query, session_id}` to the shared Supabase
Edge Function **`cpl-chat`** and streams the answer over SSE (`event: sources`
→ `event: text` deltas → `event: done`). The function runs 4 parallel lookups
(pgvector RAG over `cpl_documents`/`cpl_document_sections`, college detection,
live `live_metrics.json` fetch, topic exhibit search) → a streamed
`claude-sonnet-4-6` answer. Model output is HTML-escaped **before** the
markdown-lite pass (XSS-safe). The browser uses only the public anon key (the
same one already in `unified_courses.js`); 20 req/min/IP rate limit; every turn
is logged to `chat_interactions` (anon-INSERT, no-SELECT) — **don't put PII in
queries.** It's the literal artifact a future Student CPL Portal embed will
reuse, so keep it self-contained behind its CONFIG block.

**Operational invariants (do not violate):**
- The Edge Function is **SHARED + LIVE** — the production map.rccd.edu widget
  calls the same `cpl-chat` + same tables. **Redeploying it affects that widget
  too.** Capture the running version first (`get_edge_function`) so you can roll
  back; Deno validates at deploy time and fails *closed* (a bad deploy leaves the
  prior version up). Smoke-test all 4 modes (general / college / topic /
  college+topic) after a deploy.
- **`verify_jwt` MUST stay `false`** — the function does its own anon-key +
  rate-limit gating; flipping it to `true` would break the live widget.
- Deploy is a **one-shot** via the Supabase MCP `deploy_edge_function` (project
  `hvuwhnbuahrtptokpqfh`, slug `cpl-chat`, `entrypoint_path: index.ts`) — **NOT**
  part of the daily GitHub Actions cron. Source-of-record is the **live
  function**, captured at `chatbox/supabase/functions/cpl-chat/index.ts`
  (re-capture with `get_edge_function` before editing if in doubt).
- Live now: **v27 ACTIVE** (2026-07-02, the Sierra vendor lane — the **fail-open
  external contacts gate**: an opt-in body field **`ctx:"external"`** makes
  `buildCollegeContext` omit the college staff `CPL Contact: name (email)` line,
  so external/vendor embeds never broadcast staff contacts (contacts are
  reviewer-gated elsewhere — `map_college_contacts`; Sierra quoting them
  publicly was the outlier). Absent/unknown `ctx` = byte-identical prior
  behavior — COBI tab / standalone page / Fact Sheet / production widget all
  unchanged (the third opt-in field on the v17-`history` / v22-`audience`
  convention). `sierra/?ctx=external` passes it through for iframe embeds
  (`tests/sierra_ctx.test.js`); **smoke mode 14a/b** asserts both directions on
  the San Diego Mesa anchor. Fail-closed flip (default-suppress, internal
  surfaces opt in) parked on the guardrails backlog. Vendor docs:
  `docs/sierra_integration_guide.md`.). Prior: **v26** (Session 94, SkySierra — the **team-guidance layer**:
  `fetchTeamGuidance()` joins the parallel fan-out and appends the newest **10
  ACTIVE `sierra_guidance` rules** (~2,500-char cap, fails soft) as a TEAM
  GUIDANCE block that wins on conflict — the Training tab's 🧭 pane is the
  same-minute tuning knob, no redeploy; schema of record
  `chatbox/supabase_sierra_guidance.sql`. ⚠ the MCP `deploy_edge_function` tool
  **silently defaults `verify_jwt` to TRUE** — v25 briefly carried it; v26 =
  identical code (same sha) with `false` restored. **Always pass
  `verify_jwt:false` explicitly.**). Prior: **v24** (Session 93, SkyReach — the CPR retrieval miss: the
  `search_exhibits_by_topic` RPC ranked by `rec_count DESC` with NO relevance
  ranking, so the 76% of exhibits with `rec_count=1` were unfindable whenever a
  query matched >200 rows; migration `search_exhibits_by_topic_relevance_rank`
  re-ranks by `ts_rank_cd` over a title-A/discipline-B weighted vector
  (cpl_type/collaborative_type REMOVED from the searched text — "certs" was
  matching every Industry-Certification row), schema of record now committed at
  `chatbox/supabase_search_exhibits_by_topic.sql`; v24 also adds the CPR/First-Aid
  synonym family + meta words (check/again/already/exist/map/colleges) to
  `TOPIC_STOP_WORDS` so continuation turns fold the prior topic per v18; smoke
  mode 13 guards it. Story: `docs/cpl_assistant_lessons.md` Session 93). Prior:
  **v23** (Session 92, StarLab) adds `LANDING_PAGE_RULE`:
  a college with no CPL Landing Page URL in context → never invent a link; say the
  page isn't configured yet + suggest asking the college to set it up + offer
  MAP@rccd.edu. **v22** (same session) — the **audience-aware voice**: an
  optional `audience` body field (validated against `AUDIENCE_RULES` keys
  student/faculty/administrator/employer/civic) appends a per-population tone/content
  rule to the system prompt — the student rule bans system inside-baseball; absent or
  unknown → default voice, production widget untouched; `audience` also logs to
  `chat_interactions`. Prior: **v21** (Session 89 added the **COCI offerings catalog** lookup —
  Sierra now sees what each college *teaches*, not only earned exhibits; see the
  offerings bullet at the end of this section + §8. **v21** fixed a preflight-found
  false-negative — a query naming several colleges detected only the first, so the
  80-row offerings cap dropped another named college and the model wrongly said it
  "doesn't teach" the subject; v21 raises the cap to 150 + forbids asserting absence
  from the top-N list). There's also a **standalone shareable Sierra page** at
  `sierra/` (chat-first, multi-turn, no internal nav — the fact-sheet/kb-portal
  pattern; `sierra/sierra.js`, launched from the COBI rail, PR #633). Prior: model `claude-sonnet-4-6`; v15→v19 = the Session-73
  response-logic tuning below — v16/v17 the three tweaks, **v18 the multi-turn
  retrieval-fold** (a place-only refinement like "How about West LA?" folds the
  whole recent conversation's topic into the search via `REFINE_NOISE` +
  `ownTopic.length < 2`), **v19 the ambiguous-college-detection fix** (the ACTUAL
  West-LA bug: `ilike '%west%'` matched 5 colleges → an array → the router fell to
  college-only mode and DISCARDED the topic results, so West LA's real-estate
  exhibit was never surfaced; v19 narrows an ambiguous array to the matched
  college that has topic hits + adds a `west la` alias). v15 = v14 + the model swap from the retired
  `claude-sonnet-4-20250514` snapshot, Session 64 PR #471; v14 added
  `https://cpl-initiative.github.io` to `ALLOWED_ORIGINS`). **Use unversioned model
  aliases here, not dated snapshots** — a pinned `claude-*-YYYYMMDD` is a latent
  outage on its retirement date (`docs/kb-notes/playbook-edge-function-502-retired-model.md`).
- **Response-logic conventions (tuned ongoing — `docs/cpl_assistant_lessons.md`).**
  Answer *wording/behavior* is tuned by editing the system prompt + context builders
  in `index.ts`, redeploying, and re-smoke-testing — a recurring activity (Sam:
  "we'll be honing the logic for some time to come"). Standing rules baked into v17:
  ① **Statewide ≠ one college** — Statewide Collaborative (CCC) standards are
  system-wide; present them as available statewide and route the visitor to *their
  own* college's landing page, never one college's page (`STATEWIDE_RULE` +
  dedupe-by-title in `buildTopicContext`; the durable fact is
  [`docs/kb-notes/reference-statewide-credit-recommendations.md`](docs/kb-notes/reference-statewide-credit-recommendations.md)).
  ② **List course titles + units, never a bare "N credit recs"** (`CREDIT_LIST_RULE`
  + `Eligible courses (title — units/credit)` lines). ③ **Ask a focusing follow-up
  before dumping a big list** (`FOLLOWUP_RULE`), gated on the **client opting into
  multi-turn** by sending a `history` field — `multiTurn = Array.isArray(history)`,
  NOT `history.length` (the ask must be able to fire on the *first* broad question).
  Cross-cutting rules go in a **module-level const appended to every mode's prompt**,
  not inlined per-mode. `cpl_chat.js` sends `history`; the production widget omits it
  and stays single-turn (backward-compatible — never regress that).
- **Smoke-test on a RUNNER, not the sandbox.** `*.supabase.co` is egress-blocked
  (org policy → 403 at the agent proxy), so you can't curl the function locally.
  `chatbox/smoke_test.sh` + `.github/workflows/cpl-chat-smoke.yml` run all 4 modes +
  a multi-turn follow-up on a GitHub Actions runner (push the script → read the
  Actions log). Re-run after every redeploy.
- **Heading toward "Sierra" + the CPL Student Portal.** Sam: the assistant will be
  named **Sierra** and embedded in the upcoming **CPL Student Portal** (students
  assemble a prior-learning portfolio + document storage + statewide
  get/request-CPL recommendations). Not wired now; the multi-turn plumbing (v17) is
  the foundation. The **Sierra rename** (base-prompt persona — currently still "You
  are the CPL Chatbox" — + the tab avatar/intro/name chip) lands WITH the Portal,
  not piecemeal. Keep `cpl_chat.js` self-contained behind its CONFIG block (it's the
  embed unit).
  **NEXT for this surface:** the CCR/CER-grounded recommender + real-time benchmark +
  landing-site demand signal — scope + locked decisions in
  [`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`](docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md).
  Scope + phased plan
  (Phase 2 content re-point CPLBrain → `cpl-knowledge-base`; Phase 3 Student
  Portal):
  [`docs/kb-notes/cpl-chatbox-integration-scope.md`](docs/kb-notes/cpl-chatbox-integration-scope.md);
  deploy mechanics: [`chatbox/README.md`](chatbox/README.md); the durable
  redeploy procedure:
  [`docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md`](docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md).

- **Audience selector + 👍/👎 feedback (added Session 92, 2026-07-01).** Both
  first-party surfaces (`cpl_chat.js` tab + `sierra/` page) now REQUIRE a
  single-select **primary-population pick** before the first send (5 chips:
  student / faculty / administrator / employer / civic; persisted per-browser in
  the SHARED same-origin key **`cplSierraAudience.v1`**; sent as the optional
  `audience` body field that v22 turns into per-audience response rules — the
  driving case: students never get system inside-baseball). Every completed
  answer gets a **👍/👎 + optional note** bar that UPSERTs (client-uuid
  `turn_id`) via the SECURITY DEFINER RPC **`sierra_feedback_upsert`** into
  **`sierra_feedback`** with the audience + page + Q/A snapshot — the RPC is
  the only public write path (a direct PostgREST upsert would trip RLS: ON
  CONFLICT needs SELECT visibility, which anon lacks); reviewer/team-phrase
  SELECT (the future Sierra-Training review queue; `chat_interactions` gained
  the same reviewer SELECT for log-informed gap mining). The production map.rccd.edu widget sends neither field —
  unaffected. Schema: `chatbox/supabase_sierra_feedback.sql`; scope +
  Training-tab recommendation: `docs/sierra_training_tab_scope.md`; tests:
  `tests/sierra_page.test.js` + `tests/cpl_chat_audience.test.js`; smoke modes
  10–12.

- **College landing-page links (added Session 73, 2026-06-25).** The assistant
  surfaces each college's CPL landing page from
  **`chatbox_college_profiles.landing_page_url`** (the `cpl-chat` function joins
  it on the college name, LIVE). Kept fresh by
  **`chatbox/scrape_landing_pages.py`** + **`.github/workflows/cpl-landing-pages.yml`**
  (push = dry-run, weekly cron + dispatch = `--apply`). **Source = the MAP
  College Landing Page API** (`POST .../api/mapcollegelanding/GetData {}` → full
  `{College, CollegeLandingURL}` list — the same one the public page's script
  calls; no auth). We rewrite the old base `map.rccd.edu/cpl-student-portal/<code>`
  → **`cpldashboardcccco.azurewebsites.net/<code>`** (path-encoded) and store
  that — the exact link the official page's buttons use, which Sam verified work.
  Runs on a runner because the Azure API host is egress-blocked from the agent
  sandbox (a plain JSON POST — no browser/WAF). **Pitfall:** the page ALSO embeds
  a STALE inline `mapfyCollegeUrls` blob (2025-08-18, wrong codes like Allan
  Hancock=`test`); the first build scraped that by mistake — use the API, not the
  page HTML. 2 source-side data errors (Cerritos=`www.cerritos.edu`, East
  LA=`elac.edu`) are mirrored + flagged. **Editing the `cpl-chat` function does
  NOT touch these links** (they're table data, not code). **⚠ INTERIM:** Sam is
  adding these URLs to the MAP Custom Report → when that lands, retire the scraper
  + workflow and source from the Custom Report. Story:
  `docs/cpl_landing_pages_lessons.md`.

- **COCI offerings catalog — what each college TEACHES (added Session 89, v20).**
  The function gained a **5th parallel lookup** `searchCollegeOfferings()` →
  `search_college_offerings` RPC over the new **`coci_college_offerings`** table
  (16k `college × TOP-program` rollups; relevance-ranked with TOP-title weighted A
  over the course-title blob D). `buildOfferingsContext()` distinguishes a
  **core-discipline** match (query keyword in the TOP-program title) from a
  tangential one, and ranks **nearby** colleges (same county > region, via
  `fetchCollegeGeo()`/`college_geo`). The `OFFERINGS_RULE` prompt turns this into
  adoption reasoning: *teaches-but-no-exhibit → adoption opportunity; doesn't-teach
  → nearest teaching college; peers who already articulated = proof; never claim an
  articulation from a taught course alone.* This is what lets Sierra answer the
  Boys-&-Girls-Club / NCCER case (LA Harbor teaches 0 construction-crafts → route to
  El Camino/Trade-Tech/Rio Hondo, cite Norco/Barstow's existing NCCER). It's the
  **offerings slice of the CCR/CER ETL** (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`);
  the CER credential + adoption-leverage layers are the next wire. Builder
  `chatbox/build_coci_offerings.py` + geo `chatbox/_seed_college_geo.py` + runner
  sync `chatbox/sync_coci_offerings.py` (`coci-offerings-sync.yml`). Smoke modes 7–8.
  Story: `docs/cpl_assistant_lessons.md` (Session 89).

- **Vendor-integration doc set (added 2026-07-02).** Sam is integrating Sierra
  into a vendor-built platform; three vendor-facing docs cover it:
  [`docs/sierra_technical_reference.md`](docs/sierra_technical_reference.md)
  (how Sierra is built — full API contract, pipeline, data layer, ops),
  [`docs/sierra_integration_analysis.md`](docs/sierra_integration_analysis.md)
  (benefits/risks/challenges + the pre-launch preconditions checklist — cost
  breaker + durable rate limit before a native embed scales), and
  [`docs/sierra_integration_guide.md`](docs/sierra_integration_guide.md) (the
  implementation plan: link / iframe / native-API / server-proxy paths; iframe
  of `sierra/` needs NO backend change; a native embed = one-line
  `ALLOWED_ORIGINS` add + playbook redeploy). Keep these in sync with future
  `cpl-chat` contract changes.

### 7d. TMC Builder — interactive ADT submission tab (Session 59, 2026-06-16)

The **TMC Builder** tab (`#tmc-builder`, hash `tmc-builder`) lets a college align
its local courses to an ASCCC **Transfer Model Curriculum** (the basis for an
Associate Degree for Transfer). Pick a *College* + a *TMC* at the top → the LEFT
column is the **fixed** ASCCC-defined C-ID course list (Required Core / List A/B/C);
the RIGHT column is a searchable picker of **that college's own COCI offerings**,
**auto-populating** the local course that already carries each slot's C-ID. Shows
**Total Units** of the selected courses; exports (.docx via `docx.min.js` / print /
JSON) and Saves/Resumes to Supabase `tmc_submissions`.

- **List-first redesign (Session 60).** The tab lands on a filterable **TMC
  directory** (all 45, any status) — click a row to open one TMC's builder, **←
  All TMCs** to return (the old Program/Discipline dropdown was dropped). One
  consolidated filter block: **College · Show · Find a TMC · Curator sign-in**.
  The college filter leads with **All colleges** = a review view (fixed C-ID list
  + curator notes, no picker, Save/Submit hidden); pick a real college → build
  mode + a per-TMC **auto-matches coverage** column in the directory. The
  **"Coming soon"/`planned` status was retired** (all 45 are `draft`) — status is
  now **Official | Draft** only. The "What are you working on" bar moved to the
  overall header level (`quickstart.js`). Full story:
  [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) (Session 60). Some
  bullets below still describe the prior dropdown model — reconcile at the next
  checkpoint.
- **Per-TMC status indicator** (Session 59 follow-up): the directory/list is the
  full **45-TMC catalog**, with a status chip (`✓ Official` / `⚠ Draft`) + an
  **official-template link** (`_meta.sources[id]`). **All 45 are now `draft`** — parsed from the official
  ASCCC PDFs by `tmc/_parse_tmc_pdfs.py` (Sam supplied the PDFs; the C-ID site
  Cloudflare-blocks automated fetch — even direct PDF URLs 403). `tmcStatus()`
  returns `official` iff `status==="official"`, else `draft`; flip to `official`
  when faculty-verified. `cid_unverified` slots are C-ID-discrepancy signals.
- **GE Breadth companion — the full ADT (Session 60).** An ADT = a TMC **major**
  + a **GE Breadth pattern** + electives to 60 CSU-transferable units. Below the
  major, a build-mode **GE companion panel** (`renderGeInto`, data in
  `tmc_ge_patterns.js`) lets a college map local courses to GE areas, with a
  **pattern selector** — **Cal-GETC** (Fall 2025+ default) + legacy **IGETC** /
  **CSU GE Breadth** — and a combined **Full-ADT total** (major + GE). GE areas
  are college-certified (no C-ID), so picks are **manual** (no auto-match) and
  `units` is a per-course minimum. GE selections + the chosen pattern save into the
  same `tmc_submissions.alignments` jsonb (`ge:`-keys + `_ge_pattern`) — no schema
  change. Areas are **DRAFT** (encoded from public standards; CCCCO Breadth Form
  PDFs bot-block the agent — verify/true-up on upload).
- **Per-college approved-ADT overlay (Session 61).** The **COCI program export**
  is the authoritative source for which colleges already hold an approved ADT in
  each discipline. `tmc/_build_college_adts.py` distills it into
  `tmc_college_adts.js` (`window.CPL_TMC_COLLEGE_ADTS`, lazy), and the tab stamps
  a per-college status onto every TMC: a directory **ADT column** (the college's
  ✓ Active / ✓ Approved-pending / ⏳ In progress / ◐ Teachout when one is picked;
  the **statewide established-college count** in review mode) + a prominent
  **status banner** on the TMC detail (`adtBannerEl`), plus a **"this college's
  approved ADTs / not yet established"** Show-filter. **Session 66 split COCI's
  two affirmative states** (Sam, 2026-06-20): `active` (STATUS "Active" — live in
  the catalog) vs `approved` (STATUS "Approved" — CO-approved, pending
  activation) are now distinct buckets/badges; Active outranks Approved in dedup.
  Inactive is kept in the data but hidden (Sam, 2026-06-18). The **UC Transfer
  Pathway** (UCTP Chemistry/Physics — sub-award "A.S. UCTP Degree", a UC
  instrument distinct from an ASCCC ADT-T) gets its **own directory instances**
  (`extra_tmcs`, `kind:"uc-transfer-pathway"`, `renderPathwayDetail`), never
  folded into the Chemistry/Physics ADT. College-name reconciliation (the loose
  COCI-program labels — "L.A. CITY", "SAN FRANCISCO CITY" — → the tab's full
  course-export names) is in the builder + consults `kb/college_short_names.json`;
  any unresolved college fails the build loud. Full story:
  [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) (Session 61).
- **Real ASCCC transfer process — NOT the §11 M-ID/MC lane** (which deliberately
  avoids the transferability claim). Keep the two framings separate.
- All-**STATIC**, all-**lazy**, NOT regenerated by `excel_to_dashboard.py` and NOT
  daily-cron artifacts: the boot wiring lazy-loads `tmc_builder.js` → which loads
  `tmc_templates.js` (45-TMC catalog, all `draft`, auto-generated by
  `tmc/_parse_tmc_pdfs.py` from `tmc/source_pdfs/*.pdf` + `_meta.sources`) → then
  `tmc_college_courses.js` (per-college COCI index, 7.5 MB,
  rebuild only on a fresh extract: `python3 tmc/_build_college_courses.py`).
- Auto-match is **C-ID-exact only** (course C-ID == slot C-ID/alt); never
  title-guessed. C-ID coverage is the UNION of COCI's `CIDNumber` **and** the
  official c-id.net authority (`cid_articulations.json`, Session 90), and since
  **Session 92 (#642) every c-id.net approval lands via a join ladder** with
  graded provenance — hard `✓ aligned` / title-inferred `tcid[]` `≈ verify` /
  synthesized `per c-id.net` rows (course absent from our COCI extract) — so a
  blank slot now means the college genuinely holds no approval. A course can
  carry multiple C-IDs (`{cid}∪xcid∪tcid`); `autoMatch` prefers hard > title >
  synth carriers and used-tracks to avoid filling two slots with one course. No
  contact-hours in COCI → legitimacy = units + C-ID for now (the confidence-score
  data map: `docs/kb-notes/reference-tmc-confidence-data-requirements.md`).
- **"OR" alternatives (Session 90).** A slot can be one requirement satisfiable by
  one of several C-IDs (the template's "X **OR** Y" — distinct from a "Select N"
  *section*). Modeled as `slot.alts[]`; the left side renders "X or Y" and
  auto-match accepts any of `{cid}∪alts`. Source = the curated `tmc_or_groups.json`
  overlay (visual-PDF-read + verified), folded by the parser. See §7d file
  inventory + `docs/kb-notes/reference-tmc-adt-data-model.md`.
- **Curator + submission layer (Session 59 follow-up).** A **Status filter** ("Show")
  (All / Official / Draft / **New requests**) sits in the filter block;
  **New requests** = the **CO-review queue** (colleges' completed alignments
  submitted to the Chancellor's Office — a `tmc_submissions` row with
  `status='submitted'`, written by the form's **📤 Submit for CO review** action).
  **Magic-link login** reuses the CCR's shared `cpl_sb` session + `allowed_reviewers`
  (`map@rccd.edu` now; a CCCCO account later) — public reads, reviewer writes.
  Signed-in reviewers add a **global curator note** per course row
  (`tmc_curator_notes`, reviewer-gated by `is_allowed_reviewer()`). Each TMC also
  links its **committed PDF artifact** (`tmc/source_pdfs/<file>`, Pages-served) +
  the external template. `cid_unverified` slots show a **⚠ not in C-ID ref** flag.
- Tab nav button + pane + boot wiring are mirrored in BOTH HTMLs (Rule 4). Schema
  of record: `tmc/supabase_tmc_submissions.sql`. Full story:
  [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md);
  data model: [`docs/kb-notes/reference-tmc-adt-data-model.md`](docs/kb-notes/reference-tmc-adt-data-model.md).

### 8. Supabase Database (Separate System)

- **Project**: `hvuwhnbuahrtptokpqfh.supabase.co`
- **Tables**: projects, budget_expenditures, personnel, workplan_goals
- **`projects` writes (Session 95):** INSERT/UPDATE gated `is_allowed_reviewer() OR team_pass_ok()` (widened for the `project_add.js` Add-project flow, migration `projects_write_team_phrase_widen`); DELETE reviewer-only; public SELECT. Schema of record: `kb/supabase_projects_rls_tighten.sql`.
- **Team-phrase widening Phase 1 (2026-07-03, migrations `team_phrase_widen_p1`
  + `team_phrase_widen_p1_associations`;
  plan: [`docs/team_phrase_expansion_plan.md`](docs/team_phrase_expansion_plan.md)):**
  `workplan_goals`, `budget_funding`, `budget_expenditures`, `personnel`
  INSERT/UPDATE + `tmc_curator_notes` write/update (recreated for
  anon+authenticated) are now gated `is_allowed_reviewer() OR team_pass_ok()`;
  DELETEs stay reviewer-only **except the documented
  `workplan_activity_associations` exception** — waa INSERT/UPDATE/**DELETE**
  all widened, because it's a reversible join table where DELETE is the
  popover's un-check action (rationale + SQL:
  `kb/supabase_activity_associations_add_primary.sql` appendix; pinned in
  `tests/team_phrase_p1.test.js`). Phase 2 (kb_curation + `team:<name>` stamp,
  which also moves `tmc_curator_notes.reviewer_email` attribution server-side)
  is authored-not-executed; reviewer-only forever: `tmc_review_submission`,
  `team_access` manage, `projects` DELETE; Fact Sheet Curate held.
- **`workplan_goals.current`** (numeric, added Session 85): the manual "Current"
  value for the Annual Workplan tab — used ONLY for sub-activities NOT mapped to a
  live headline KPI (`PID_TO_KPI_KEY`); read on the **GOAL** row (canonical).
  Mapped sub-activities source Current from the live scrape and ignore it. Edited
  in the tab via `workplan_goals.js` (PATCH on the GOAL row); reviewer-gated
  (`is_allowed_reviewer()`). Titles in the same tab PATCH **`projects.name`** (the
  single authoritative title store). See `docs/annual_workplan_authoritative_lessons.md`.
- **`tmc_submissions`** (added Session 59; **CO-review states Session 92**): TMC
  Builder's per-college course→TMC alignment store. Anon INSERT/UPDATE/SELECT RLS
  (institutional curriculum data, **no student PII**), `(college, tmc_id)` unique →
  upsert/resume; the anon write policies now carry **WITH CHECK (status in
  draft|submitted)** — the college flow stays no-login, but **approved/returned +
  the review receipts (`review_note`/`reviewed_by`/`reviewed_at`) are SERVER-GATED**:
  set only by the `tmc_review_submission(college, tmc_id, status, note)` SECURITY
  DEFINER RPC (`is_allowed_reviewer()`, `reviewed_by` stamped from the JWT; the
  receipt columns are revoked from direct anon/authenticated writes — an approval
  is a CO authority claim, never forgeable with the public key). The alignments
  jsonb also carries per-slot `verdict`/`course_hours`/`course_units_entered`/
  `evidence`/`matched_cid` + `_readiness` (the CO queue's triage ranking).
  Schema: `tmc/supabase_tmc_submissions.sql`.
- **`tmc_curator_notes`** + **`tmc_requests`** (added Session 59): TMC Builder's
  curator layer. `tmc_curator_notes` = one global note per (tmc_id, slot_key),
  anon SELECT + **reviewer-gated** INSERT/UPDATE (`is_allowed_reviewer()`).
  `tmc_requests` = free-form "request a TMC" log (anon insert/read). The primary
  "new request" path is a `tmc_submissions` row with `status='submitted'` (CO-review
  queue). Schema: `tmc/supabase_tmc_curator.sql`.
- **`cpl_reflections`** (added Session 48): First Light's anonymous daily
  reflections — anon INSERT-only RLS with a 1–2000-char CHECK, **no SELECT
  policy** (write-only from the public; service role reads for the future
  uplifting-themes analysis). Never add a public read path; the payload shape
  (`painting`, `reflection` — nothing identifying) is pinned by
  `tests/first_light.test.js`.
- **`sierra_feedback`** (added Session 92): the Sierra 👍/👎 + note store behind
  both chat surfaces. One row per assistant turn keyed by a client-uuid
  `turn_id`; the client UPSERTs (rating on thumb click, note/rating-switch
  updates the same row) via the **SECURITY DEFINER RPC `sierra_feedback_upsert`**
  — the ONLY public write path (a direct PostgREST upsert 401s: ON CONFLICT
  needs SELECT visibility, which anon deliberately lacks; the RPC also
  centralizes validation). Carries `page`, `audience`, and the Q/A snapshot.
  RLS: no anon table policies; SELECT gated `is_allowed_reviewer() OR
  team_pass_ok()` (the Sierra-Training review queue — **live since Session 93**,
  the `#sierra-training` tab). Same wave: `chat_interactions` gained
  an `audience` column + the same reviewer/team-phrase SELECT policy (was
  write-only) for log-informed gap mining. **Session 93 added the triage
  `status` column** (`new/triaged/addressed`, default `new`) + the SECURITY
  DEFINER RPC **`sierra_feedback_set_status`** (gated `is_allowed_reviewer()
  OR team_pass_ok()`; the only public write besides the upsert RPC — the rest
  of the row stays immutable to the public), migration
  `sierra_feedback_triage_status`. Schema:
  `chatbox/supabase_sierra_feedback.sql`.
- **`sierra_guidance`** (added Session 94, migration `sierra_guidance_layer`):
  the **team guidance layer** — short response directives (rule 3–500 chars +
  `active` flag + note + author) that cpl-chat **v26** appends to EVERY system
  prompt (newest 10 active, ~2,500-char cap, fails soft; the block header tells
  the model team guidance wins on conflict). Authored in the Training tab's 🧭
  pane. RLS: SELECT/INSERT/UPDATE gated `is_allowed_reviewer() OR
  team_pass_ok()`; **NO delete policy** — deactivate (`active=false`) instead,
  the table is its own audit trail; touch trigger keeps `created_at`/
  `created_by` immutable. ⚠ Guidance steers the **production map.rccd.edu
  widget too** — the write gate is the security boundary; never widen to anon.
  Schema of record: `chatbox/supabase_sierra_guidance.sql`.
- **`item_updates`** (added Session 77): the Update Log behind the RACI tab's 📝 braindump→CC
  composer. One row per status update on an Activity/sub-activity/project, keyed `(item_type, item_id)`
  like `item_raci`. Anon SELECT + **reviewer-gated** INSERT/UPDATE/DELETE (`is_allowed_reviewer()`).
  Was append-only/immutable; **reviewers gained EDIT + DELETE 2026-06-27 (SkyMap)** so a test/mistaken
  entry can be removed and a posted update corrected (an edit stamps `edited_at`; the composer history shows
  ✏️/🗑 per row, and deleting the last update reverts the card to its creation-era line). The single live
  source for both activity AND project card updates. Schema:
  `raci/supabase_raci.sql`. (A pre-existing project-only `update_log` table — id/project_id/update_text —
  is unrelated/vestigial; left untouched.) `team_members` also gained `last_nudged_at` + `last_response_at`
  (nudge accountability).
- **`factsheet_overrides`** (added Session 80): the Curate-editable overlay behind the standalone public
  **Fact Sheet** (`fact-sheet/factsheet_edit.js`). One row per editable box, keyed by the page's stable
  `block_key` → `{html, hidden, edited_by/at}` (+ `page` for forward-compat). Anon SELECT (the overlay is
  applied for every visitor); **reviewer-gated** write via `is_allowed_reviewer()` (same gate as
  `item_raci`/`item_updates`). The baked HTML in `index.html` is always the fallback — empty table = the
  page as authored. Reviewer HTML is allowlist-sanitized on the public render path. Schema:
  `fact-sheet/supabase_factsheet_overrides.sql`. **Session 81 added reserved
  `block_key` namespaces** (no schema change) so the same table also carries
  reviewer-**added** boxes (`<sid>|add|<kind>|<token>`), per-section drag
  **order** (`<sid>|__order`), and **images** (added `<sid>|img|<token>` / baked
  `<sid>|fig|<basename>`) — the overlay *materializes* the synthetic keys instead
  of matching a baked element (`docs/kb-notes/methodology-reserved-key-namespaces-on-overrides-table.md`).
- **`factsheet-images`** (Storage bucket, added Session 81): the image *bytes*
  behind the Fact Sheet Curate image layer (`factsheet_overrides` stores only the
  public URL). **Public read**, writes gated by `is_allowed_reviewer()` (same
  reviewer boundary as `factsheet_overrides`), 5 MB cap, raster MIME only. Schema:
  `fact-sheet/supabase_factsheet_images.sql` (applied live via the Supabase MCP).
- **`liftoff_state`** (added Session 83): the **Mission Control** overlay store
  (`mission_control.js`). One row per plan node id → `{status, chosen, note,
  updated_by, updated_at}`, overlaying the committed `kb/liftoff_plan.json` (the
  plan is the static fallback; an empty table = the plan as authored). Anon SELECT
  (the board renders for every viewer); writes gated by `is_allowed_reviewer() OR
  team_pass_ok()` (the shared team-phrase gate below). Schema:
  `mission/supabase_liftoff_state.sql` (applied live via the Supabase MCP).
- **`team_access`** + the **shared team-phrase gate** (added Session 83): a
  **lower-stakes alternative to per-person magic-link login** for editing the
  Team & RACI surface. `team_access(id, secret)` holds one shared phrase — RLS on,
  **NO anon policies** so the client can't read it; only the SECURITY DEFINER funcs
  see it. **`team_pass_ok()`** reads the **`x-team-pass` request header** (sent by
  `raci.js`/`mission_control.js` on writes when the phrase is unlocked) and compares
  via the revoked-from-public `team_pass_check(p)`. The `item_raci` / `team_members`
  / `item_updates` / `liftoff_state` write policies are widened to
  `is_allowed_reviewer() OR team_pass_ok()` — so the public anon key **alone** still
  can't write, and magic-link reviewers keep working. Server-enforced (the phrase is
  validated inside Postgres, not client-side). **Phrase is VALIDATED on entry
  (#598):** `raci.js` POSTs the anon-granted **`rpc/team_pass_ok`** (with the typed
  phrase as the `x-team-pass` header) before storing it, so a wrong phrase is
  rejected ("doesn't match") instead of being saved + silently 401ing on first save;
  a save that 401/403s on a stale (rotated) phrase drops it + reopens the entry box.
  **Reviewer-manage (#598):** a magic-link reviewer (NOT a team-phrase user) gets a
  **⚙ Manage team phrase** admin in the RACI auth bar to view/change the secret —
  backed by reviewer-only **`ta_select`/`ta_update`** RLS policies (the anon role
  still has NO policy, so the public can't read it). Rotate via that admin or
  `update public.team_access set secret='…' where id='raci';` (temp `cpl-team-2026`).
  Schema documented in `raci/supabase_raci.sql`; pattern:
  `docs/kb-notes/methodology-server-enforced-shared-password-gate.md`.
- **`project_lifecycle`** (added Session 84): the **project soft-delete** overlay
  (`project_lifecycle.js`). One row per project a reviewer has **Tabled** (paused)
  or **Archived** (closed) — `(project_id pk, state ∈ tabled|archived, reason,
  updated_by, updated_at)`; **absence of a row = active**. Anon SELECT (the overlay
  applies for everyone); writes gated `is_allowed_reviewer() OR team_pass_ok()` (the
  RACI / Mission Control gate — the `projects` table itself is untouched, so its
  RACI/update relations survive a "delete"). The generator drops tabled projects
  from the live priority surfaces (grid cards render HIDDEN with `data-lifecycle`;
  `CPL_DATA.projects` + the Workplan Goals tables exclude them → they leave the RACI
  matrix / Annual Report / custom reports) and renders them in a collapsed
  **"Tabled & Archived"** section; `kb/_load_projects.py:load_project_lifecycle()`
  folds it into the committed `kb/project_lifecycle.json` ledger (offline fallback +
  the vault-synced "noted in the KB" record). Reversible (♻ Restore = DELETE the
  row). **Scope (Session 95): real work-item projects only** — rows keyed to the
  official 1.x–4.x sub-activities (the activity layer, `derive_core_activity_ids`
  minus `5.x`) are **ignored by every consumer** (generator scrub +
  `project_lifecycle.js`/`raci.js` mirrors); tabling a project can never remove an
  Activity card, its RACI rows, or its Workplan Goals ladder. Schema:
  `kb/supabase_project_lifecycle.sql` (applied live via the Supabase
  MCP). Docs: `docs/project_lifecycle_lessons.md`.
- **`map_college_users`** + **`map_college_contacts`** (added Session 87): the gated
  MAP-Users tab store (STAFF PII — names/emails/roles synced from MAP "College Users &
  Roles" + "College Contacts", **never committed to the repo**). `map_college_users`
  (2,741 rows): RLS = reviewer/team-phrase SELECT ONLY (no anon read, no anon write);
  a **public aggregate** `map_users_summary()` (SECURITY DEFINER, anon) returns
  per-college counts + the 7-way RoleName mix + last_synced (no PII). **Session 88
  added 3 columns** from the new Custom Report fields: `user_status`
  (∈ {Active, Inactive}) → a public **`active_count`** in `map_users_summary()`;
  `disciplines` (comma-delimited) + `last_updated_on` (text date) stay **reviewer-gated**
  (per-named-staff → roster only, never the public aggregate). `map_users_replace`
  carries all three. `map_college_contacts`
  (121 rows): reviewer/team-phrase SELECT only — the Primary Contact / VPAA (VP
  Instruction) / VPSS (VP Student Services) / **CEO** + emails behind the 📣 nudge, plus
  **`landing_page_url`** (the college's MAP CPL dashboard, joined in the sync from
  `chatbox_college_profiles`). Both refreshed
  atomically by service-role-only `map_users_replace`/`map_contacts_replace(jsonb)` RPCs
  (note the **`where true`** on the full-table delete — Supabase's pg-safeupdate blocks an
  unqualified DELETE through the PostgREST API roles). A third table **`map_college_nudges`**
  (Session-87 follow-up: college pk, `last_nudged_at`/`last_nudged_by`; reviewer/team-phrase
  R+W) is the "last nudged" log — kept SEPARATE from the contacts table so the monthly
  full-refresh never wipes it. Synced by `map/sync_map_users.py`
  (runner-as-proxy; `map-users-sync.yml`, dispatch + monthly cron). Schema of record:
  `map/supabase_map_users.sql` + `map/supabase_map_contacts.sql` (applied live via the
  Supabase MCP). Docs: `docs/map_users_tab_scope.md`.
- **`coci_college_offerings` + `coci_college_programs` + `college_geo`** (added
  Session 89): the **COCI offerings catalog** the shared `cpl-chat` function
  (Sierra) queries to know what each college **teaches** (vs the earned-exhibit set
  `chatbox_exhibits`). `coci_college_offerings` (16,097 `college × TOP-program`
  rollups: course/credit/noncredit counts, C-ID coverage, sample courses, a
  full-text `titles_text` blob), `coci_college_programs` (22,335 active/approved
  awards), `college_geo` (120 colleges → region/county). **Public read (no PII —
  course/program catalogs); writes only via SECURITY DEFINER `*_replace(jsonb, p_truncate)`
  RPCs** (service-role, chunkable). Search via **`search_college_offerings(search_query, college_filter, result_limit)`**
  (anon; `ts_rank`, TOP-title weighted A over the blob D). Built by
  `chatbox/build_coci_offerings.py` from `kb/reference/coci_course_list.xlsx` + the
  COCI program export; loaded by the runner sync `chatbox/sync_coci_offerings.py`
  (`coci-offerings-sync.yml`, push + dispatch). STATIC — rebuild on a fresh COCI
  extract, NOT a daily-cron artifact. Schema applied live via the Supabase MCP.
- **`cpl_funding_participation`** (added 2026-07-06, Session 3): the funding
  tab's **baseline-eligibility opt-in registry** — one row per college that has
  requested to participate by the deadline (absence = not opted in; no PII).
  Anon SELECT; INSERT/UPDATE **and DELETE** gated `is_allowed_reviewer() OR
  team_pass_ok()` (DELETE widened per the waa precedent — un-checking an opt-in
  is the drill-in toggle's reversible undo; the tab re-fetches after every
  write, #598). Same wave: `map_college_contacts` gained `cpl_coordinator` +
  `cpl_coordinator_email` (synced from the MAP Contacts view) and the PII-free
  anon **`map_coordinator_summary()`** RPC (college + boolean + synced_at) —
  the eligibility badge's live source; names/emails stay reviewer-gated.
  Schemas: `funding/supabase_cpl_funding_participation.sql` +
  `map/supabase_map_contacts.sql`.
- **`cpl_funding_notes`** (added 2026-07-06, Session 3 evening): **CO Monitor's
  per-college notes** on the funding tab's drill-in. Internal commentary on a
  public page → RLS gates **read AND write** to `is_allowed_reviewer() OR
  team_pass_ok()` (anonymous = zero rows; phrase-holders read; team-editing-on
  edits). One row per college, 1–4000 chars, touch-triggered `updated_at`;
  empty note deletes the row; tab re-fetches after every write (#598). Schema:
  `funding/supabase_cpl_funding_notes.sql`.
- **`cpl_funding_config`** (added 2026-07-03): the **Implementation Funding tab's
  shared model config** (`cpl_funding.js`). One JSONB `config` blob on a single
  `default` row holding the Chancellor-facing POLICY layer — selected years,
  per-year priority metric text + shares/targets, and the noncredit-feeder
  carve-out + roster. Anon SELECT (the shared model everyone opens to); writes
  gated `is_allowed_reviewer() OR team_pass_ok()` (team-phrase editable via
  `team_phrase.js`'s `decorateHeaders`; the anon key alone can't write). The tab
  resolves per field: **local what-if scenario ⊕ this shared config ⊕ the baked
  `cpl_funding_data.js` defaults** — so anonymous viewers layer per-browser
  scenarios on top of the team-configured base without the phrase. Touch trigger
  keeps `updated_at` fresh. Schema of record: `funding/supabase_cpl_funding_config.sql`
  (applied live via the Supabase MCP, migration `cpl_funding_config`). Docs:
  `docs/cpl_funding_lessons.md` (Session 2).
- Separate from live metrics scraping; handles project-level data storage.

### 9. EACR Exhibit Identity — current state and future direction

**Current grouping (shipped 2026-05-18):** the Exhibit Adoption & Credit
Recommendations table groups MAP rows by
`(Exhibit Title, CPL Type, Collaborative Type)` rather than raw
`ExhibitID`. This collapses MAP's ID fragmentation (3,451 IDs → 3,274
cards) but does not yet handle **title drift** — the same credential
entered under multiple freehand titles by different colleges still
produces multiple cards.

**Career Cluster filter** uses the `CCC SW Sector` column in
`TOP_Code_Lookup.xlsx` (CCC Strong Workforce 10-sector framework with
an "Academic Transfer & General Education" catch-all).

**TOP code caveat — they vary for the same course.** Colleges assign TOP
codes in COCI with discretion and no definitive guidance for ambiguous
cases, so the *same* course often carries different TOP codes across
colleges (in practice ~52% of consolidated M-IDs have a mixed TOP code).
Anything that picks one TOP code for a consolidated course (e.g. the
`top_code` on a minted M-ID) is choosing a representative, not ground
truth — prefer the modal (plurality) pick and surface the spread
(`top_code_mixed` / `top_code_distribution`) rather than trusting a single
value. For broad grouping, the coarser TOP digits are more stable than the
full 6-digit code.

**Credit status derivation (CreditType rule).** MAP's course list carries a
`CreditType` column (the funding type) and a separate `Non_Credit_Category`
(the CDCP *program* type — Short-term Vocational, ESL, Older Adults, …).
Credit status is derived from **`CreditType`**, not the program category:

| `CreditType` | credit_status |
|---|---|
| `Credit Course` | **Credit** |
| `Other Noncredit Enhanced Funding` | **Noncredit Enhanced** |
| `Workforce Preparation Enhanced Funding` | **Noncredit Enhanced** |
| `Non-Enhanced Funding` | **Noncredit** |
| blank / unrecognized | by `UnitValue`: **>0 → Credit, else Noncredit** |

`Non_Credit_Category` is kept as descriptive metadata in **`noncredit_category`**
(the CDCP program type — Short-term Vocational, ESL, Older Adults, …), not the
funding signal. It is populated only where a member is offered noncredit (null
otherwise), and — like TOP codes — it can differ across colleges, so it carries
`noncredit_category_mixed` + (on the catalog) `noncredit_category_distribution`.
A Credit-status M-ID may still carry a `noncredit_category` if some member
colleges offer the course noncredit. When members of one M-ID disagree on credit
status, store the modal status and set `credit_status_mixed`. The three system
credit statuses are **Credit / Noncredit / Noncredit Enhanced**. Implemented in
`kb/_join_credit_status.py`.

**Future direction — synthetic unified-title layer:** an AI-assisted
canonicalization layer that assigns each MAP exhibit a unified title,
issuing agency, and training agency, so all spelling/format variants
collapse into one card. Design doc:
[`docs/exhibit_unification_vision.md`](docs/exhibit_unification_vision.md).
When that lands, the EACR grouping key will become
`(Unified Title, CPL Type, Collaborative Type)` and a per-exhibit
`also entered as…` disclosure will surface the raw titles underneath.

### 10. C-ID / CCN numbering conventions (authoritative) + M-ID alignment direction

Source docs (ASCCC, uploaded 2026-05-22; checked in under `docs/reference/`):
`cid_ccn_2025_overview.pdf` (the C-ID/CCN one-pager + CCN structure
infographic) defines the **numbering scheme**; `cid_tmc_adt_handbook_f2022.pdf`
and `tmc_development_guidelines_2013.pdf` cover the descriptor/degree-development
process (read on demand if the renumber project needs them — note: PDF page
rendering needs `poppler-utils`, absent in some session containers).

**The two official systems (leave both VERBATIM as listed in COCI — never relabel):**

- **C-ID** (Course Identification Numbering System) — *faculty-driven,
  descriptor-based, many-to-one*: many local courses map to one C-ID descriptor
  (the descriptor is the **minimum** content; colleges may add more). Format is
  `SUBJ ###` (e.g. `COMP 122`, `POLS 110`) — **no `C` prefix on the number.**
  491 active descriptors; basis for 43 TMCs; ~30k CCC courses aligned.
- **CCN** (Common Course Numbering, AB 1111) — *student-facing, template-based,
  one-to-one*: identical template content statewide (extra content goes in an
  optional "Part 2"). Format `SUBJ C####&&`:
  - `SUBJ` — standardized **4-letter** subject abbreviation (a system-level
    standard list; we do NOT yet hold that authoritative list).
  - `C` — Course Type Identifier = "this is a CCN". **A local course has no `C`.**
  - `####` — 4-digit number with **banded meaning**: `0XXX` non-transferable ·
    `1XXX` 100-level · `2XXX` 200-level · `3XXX` 300-level · `4XXX` 400-level ·
    `9XXX` noncredit. (For CCC only lower-division applies → realistically
    `0/1/2/9` XXX.)
  - `&&` — up to **2** Course Speciality Identifiers, no filler when absent:
    `H` Honors · `L` Lab-only · `S` Support · `E` Embedded Support.
  - Example: `GEOL C1005H` = Geology · CCN · 100-level · Honors.
  Rollout: Phase I (6 templates) student-facing Fall 2025; Phase II (24) Fall
  2026/27; Phase III (55) Fall 2027.

**M-ID alignment direction (LANDED 2026-05-22 in the CourseControlNumber re-mint,
PR #84; PR #83 was the dry-run that recorded the decisions):**

Our minted identities (`coci_minted_courses.json`, currently rendered
`M-ID <SUBJ> <num>`) will adopt a CCN-*structured* surrogate format that is
unmistakably **ours, not official**:

- **Lead with `M` in the Course-Type-Identifier position** (`SUBJ M####&&`),
  exactly paralleling CCN's `C`. The `M` (Minted) signals a synthetic MAP
  identity and **prevents any collision with a real CCN `C####`**. This is the
  whole point of the prefix: an M-code must never read as an official CCN.
- **C-IDs and CCNs stay verbatim** (different formats, both authoritative). Only
  the *minted* tier gets the M-scheme.
- **Decisions locked:**
  - **Sequencing — bundle with the re-mint.** The M-prefix AND the banded
    renumber ship together inside the **CourseControlNumber re-mint** (NOT a
    separate relabel pass). Re-keying the minted identity space ripples into
    memberships, `coci_articulations.json` `course_id`, curation `merge_into`
    pointers, dashboard rows, and the Articulations-by-Course card — so it's
    one re-key, not two churns, and must carry an **old-M-ID → new-M-ID alias
    map** so curation/articulation pointers survive.
  - **Banding basis — `credit_status` only, initially.** Noncredit /
    Noncredit-Enhanced → `9XXX`; everything credit → `1XXX`. Honest with data we
    hold. `0XXX` (non-transferable) and the `1XXX` vs `2XXX` split are deferred
    until transferability/degree-applicability data is sourced/confirmed.
  - **Subjects — synthesize a 4-letter map for the M-IDs.** An authoritative
    CCN 4-letter subject-abbreviation list does **not** appear to exist publicly
    yet, so the re-mint will **synthetically derive** a 4-letter abbreviation per
    minted subject from the local COCI subject codes (deterministic, collision-
    managed, clearly **our** synthetic map — NOT the official CCN list). **C-IDs
    stay verbatim** (not re-subjected). Revisit if an authoritative list is later
    sourced. Like the M-numbers, document loudly that these 4-letter subjects are
    a MAP surrogate, not a CCN claim.
  - **Numbering format (confirmed 2026-05-22 via the dry-run, PR #83):**
    CCN's `SUBJ C####` is 4 digits = leading **band** digit + 3-digit sequence.
    Mirror it: **corroborated** M-IDs (≥2 colleges) → clean 4-digit
    `SUBJ M<band><seq:03d>` (`9`=noncredit, `1`=credit; corroborated max per
    (subject,band) is 496 → fits with room). **Stand-alones** (1 college) →
    `SUBJ M<band><d><LL>` — band + 1 sequence digit + **2 letters** (same 4-char
    width; the trailing letters expand capacity to 10·26·26 = **6,760** per
    (subject,band) vs a max stand-alone bucket of 1,432, and signal "stand-alone"
    since corroborated codes are all-digit). It promotes to a corroborated
    `M####` if a second college later joins the title. The within-(subject,band)
    sequence must be **stable, deterministic, persisted** (sorted by normalized
    title) or codes churn each daily regen.
- Always document loudly: **M-numbers are CCN-aligned surrogate keys, NOT a
  claim of CCN equivalence.**


---

