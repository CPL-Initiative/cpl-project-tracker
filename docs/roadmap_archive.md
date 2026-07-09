---
title: CPL Project Tracker — Roadmap Archive (completed work)
date: 2026-06-04
tags: [archive, roadmap, project-memory, session-history]
related:
  - CLAUDE.md (the live project memory; this is its museum annex)
  - docs/INDEX.md (docs landing page)
status: archive
---

# Roadmap Archive — Completed Work & Session Narratives

This file is the **museum annex** to [`CLAUDE.md`](../CLAUDE.md). It holds the
**completed** roadmap-table rows and the **per-session narrative subsections for
Sessions 26-31**, relocated out of CLAUDE.md (Session 33, 2026-06-04) so the live
project memory stays focused on steering content.

**Nothing here is live work.** For the current Critical Rules, the full Pipeline
Reference, the still-open roadmap rows (in progress / parked / queued), the
Session-25 strategic queue, and the most-recent session narrative, see
[`CLAUDE.md`](../CLAUDE.md). For per-workstream detail see the lessons docs and
[`docs/INDEX.md`](INDEX.md).

> Verbatim move — these blocks were relocated, not edited. Phase/PR rows
> reference each other and the KB notes; paths are relative to the repo root.

---

## Archived session narrative — Session 62 (SkyLion, moved out Session 64)

### Session 62 — SkyLion: First Light reflections digest + CCR synonym pairings (2026-06-18)

Two code-only PRs. **#460** — First Light **local-day painting rotation** (no
day-to-day repeats) + the **weekly reflections digest builder**
(`reflections/build_reflections_digest.py` + README): reads the anonymous
write-only `cpl_reflections` via the **service role**, renders per-ISO-week
Obsidian "musings" — output **gitignored here**, bound for the **private
`cpl-knowledge-base` vault** (a sibling session is wiring the weekly GitHub Action
there; needs Sam to add `SUPABASE_SERVICE_KEY` on that repo). **#461** — CCR
Suggested-merges **synonym-map growth** (ECE/EMT/CNA/HVAC/LVN; +13 ids into
multi-member groups, no over-merge) + an ambiguity validator
`kb/_synonym_candidate_dryrun.py` (rejected `cis`/`cd`/`ma`). Also re-installed the
canonical stop-hook over a stale container copy (a squash-merge `noreply@github.com`
false-positive). Full story: `docs/first_light_lessons.md` +
`docs/ccr_cluster_cleanup_lessons.md` (S62); new reflections-digest playbook KB
note + the synonym note extended.

---

## Completed roadmap rows (DONE / N-A / superseded)

These are the shipped phases. The still-open rows stayed in CLAUDE.md §11 Roadmap.

| Phase | What | Status |
|---|---|---|
| 1a | Trust-Card auditor (read-only) | **DONE** 2026-05-23 |
| 1b (1/2) | Cluster row member-aggregation in renderer (fixes UC-CUR-MPG029OM blanks) | **DONE** 2026-05-23 |
| 1b (2/2) | UCL "⚠ hinky" chip + audit-status toolbar indicator + daily auditor cron | **DONE** 2026-05-23 |
| 1c-UX | Score-with-tag-penalty + chip-with-score + severity color grade + breakdown hover + UCL Triage filter + .uc-flags-cell nowrap + Adoptable rename | **DONE** 2026-05-23 |
| 1d | UI rename "Unified Courses" → "Common Course Reference" (CCR); URL hash + filenames preserved | **DONE** 2026-05-23 (PR #87) |
| **1e-5a** | SUBJ4-canonicalization Session 5a — seed + curator tab + audit rule. `kb/_seed_canonical_subj4.py` produces `kb/discipline_canonical_subj4.json` (144 disciplines: 44 pre-seeded with 4-letter data-modal, 100 needs_review). New top-level **Canonical SUBJ4** tab in the dashboard (auth-gated CRUD; writes to Supabase `kb_curation` with synthesized `_CANON_SUBJ4::<discipline>` namespace, no schema migration). `kb/_apply_canonical_subj4.py` sync wired into the daily cron. | **DONE** 2026-05-23 (PR #89, Bruh Quad) |
| **1e-5b** | SUBJ4-canonicalization Session 5b — measure-first dry-run. `kb/_subj4_dryrun.py` is re-runnable, walks both `coci_minted_courses.json` + `coci_minted_singletons.json`, applies the curation overlay, classifies every M-ID's fate, reallocates new course_ids deterministically by `(normalized_title, old_id)`, validates 4 gates, surfaces curated-collision decision points, counts downstream apply scope (memberships + articulations + cluster refs). Artifacts at `kb/subj4_dryrun/{report.md, alias_map.json, blocked.json, collisions.json}`. Apply gate signal becomes the green light for 5c. Bonus: regen-safe seed generator preserves curator-reviewed entries; caught singleton-only discipline (`Upholstering`) missing from initial seed. | **DONE** 2026-05-23 (Bruh Quad) |
| **1e-5c** | SUBJ4-canonicalization Session 5c — atomic apply. `kb/_subj4_apply.py` re-keyed 14,971 minted + 50,182 singleton M-IDs + 14,971 memberships + 3,750 articulations + 2,868 cluster member refs + 5 curation entries; `kb/_subj4_apply_supabase.py` PATCHed the live `kb_curation` rows. Orchestrated by `.github/workflows/phase-1e-apply.yml` (manual-dispatch, concurrency group `daily-dashboard`). Cleanup receipt: `subject_collision_signal` = 0 ✓; `mid_id_off_scheme` = 2 unfixable blank-discipline rows. Three bugs caught + fixed mid-stream: 386-row silent overwrite (added V4 `new_id_disjoint_from_untouched` gate), YAML scanner error on multi-line `-m` (switched to multiple `-m` flags), Supabase fan-out (13k PATCHes → ~7 via pre-fetch of curated set). | **DONE** 2026-05-23 (PRs #93/#94/#95; apply commit `5406055`) |
| 1e-5d | M-ID → MID, C-ID → CID label rename (cosmetic; no identifier format change). Touches `id_system` field values in 3 JSON files (~16,850 rows) + 25+ code/doc references + UI labels. UI labels DONE in PR #100 (Bruh Quad CSC PR C); full data-value rename across `id_system` field still queued. | UI labels DONE 2026-05-23 (PR #100); **cosmetic display-label map DONE 2026-05-31 (PR #209, Session 23)** — `idSysLabel`/`id_sys_label` maps M-ID→MID/C-ID→CID/CCN-ID→CCNID at render sites ONLY; stored `id_system` value UNCHANGED (every `== "M-ID"` comparison + the 224 anchor keys preserved). **The full data-value rename is SUPERSEDED** (Sam's call) — display-only achieves the visible goal with zero data/key risk. Method: `docs/kb-notes/methodology-display-label-map-vs-data-rename.md`. |
| **CSC-A** | Common Subject Code tab (formerly Canonical SUBJ4) — UI polish for faculty: rename, plain-language intro, Development Draft badge, Curation guidelines modal, "(CCCCO MAP only)" auth label, beta-box removal, "needs 4-letter" warning badge | **DONE** 2026-05-23 (PR #98, Bruh Quad) |
| **CSC-B** | Common Subject Code tab — affordances: variants popup with CID/CCN matches, per-row CID/CCN match badges, native-datalist typeahead search, sortable columns | **DONE** 2026-05-23 (PR #99, Bruh Quad) |
| **CSC-C** | Common Subject Code tab — validate workflow (Supabase migration: validated_at/validated_by added to kb_curation), TOP column + 2-digit grouping + filter, CIP placeholder column, CTE designation (from CCC 2023 TOP Manual: 236/380 CTE-designated; M-ID-level + discipline-level aggregates), MID/CID UI label rename | **DONE** 2026-05-23 (PR #100, Bruh Quad) |
| **CSC-D** | Common Subject Code tab — search-focus bug fix (render() refactor: toolbar built once, auth widget gets its own renderAuth), label tweaks (Common SUBJ / Most-used locally), enriched MID + CID/CCN badge tooltips, badges clickable to open variants modal, CIP moved next to TOP, Collapse-all twisty, scope-note callout linking the CCC 2025-26 MQ Handbook | **DONE** 2026-05-23 (PR #107, Bruh Quad) |
| **CSC-E** | Common Subject Code tab — local-variants data refresh. New `local_subject_variants` field per discipline aggregated from `kb/coci_minted_memberships.json` (corroborated MIDs' member.subject) + `coci_minted_singletons.json` (each singleton's own subject). Variants column + modal + Most-used-locally now reflect REAL local college codes (e.g. Sign Language American shows ASL/SIGN/DEAF/AMSL/SL/… with real counts instead of post-apply uniform canonical). data_modal recomputed from local data. | **DONE** 2026-05-23 (PR #109, Bruh Quad) |
| **CSC-F** | Common Subject Code tab — column centering prototype. 6 lines of CSS scoped to `#tab-canonical-subj4`: th/td center H+V; first column (Discipline) overrides to left-align; `:has(textarea)` cell overrides Notes back to left. Per the agreed plan, this is the PROTOTYPE only; global sweep across CCR/KPI/projects/exhibit tables queued as CSC-G pending curator eyeball. | **DONE** 2026-05-23 (PR #110, Bruh Quad) |
| **CSC-G** | Global column-centering sweep — applied CSC-F's H+V-center-except-first rule to the CCR (`.uc-table`) with per-column opt-outs for the long-text identifier columns (Title col 3, Discipline col 4 stay left-aligned alongside col 1). KPI cards + Projects Grid are card-based, natural opt-outs. Exhibit Analysis tables (`.exhibit-table`) have mixed column intent (some `.exhibit-cell-num`/`-pct` right-aligned, some plain `<td>` text); a blanket th alignment misaligns the ranking tables, so they're left as-is — a per-column th-class pass is its own future scope if we want a deeper sweep. | **DONE 2026-05-26** (PR #139, Sexy Dexy) |
| **Letters-A** | Letters tab — integrate the budget-support letter curator from the cpl-knowledge-base repo as a top-level dashboard tab. Iframe-embed `budget-support/web/curator.html` (curator's `:root` CSS vars would leak if inlined). Backend stays on the KB's separate Supabase project (`mdxutmbpoqjtdcwjscux`), not project-tracker's. Auth: passcode-gated inside the curator (sessionStorage `curator_pass`), public read-only browsing. Full hand-off prompt for future work at `docs/letter_curator_handoff.md`. | **DONE 2026-05-26** (PR #136, Sexy Dexy) |
| **Quickstart-Dashboard** | Quickstart filter-hint vocabulary for the Dashboard tab. PR #135 (Quickstart-C) shipped the architecture but only wired three curator tabs (credential-reference, unified-courses, canonical-subj4). Prompts like "apprenticeship initiative" routed to Dashboard but landed on the unfiltered grid. Adds `search` free-text + `activity`/`goal`/`status` enums to `HINT_VOCAB.dashboard`; adds `applyQuickstartHint()` consumer in `dashboard_filters.js` covering both cold-load (sessionStorage) and live-event (`cpl-qs-hint`) paths. Side fix: missing `letters` tab routing (regression from PR #136). | **DONE 2026-05-26** (PR #141, Sexy Dexy) |
| **Apprentice-rename** | Workplan project 3.1.2a renamed: both 3.1 and 3.1.2a carried the title "CPL Offers & Awards Tracking" — confusing in the projects grid. They track DISTINCT KPI series (3.1 = 250k all Californians; 3.1.2a = 20k apprentices + journey workers), so deletion would lose the apprentice progress bar. Rename to "CPL Offers & Awards Tracking — Apprentice Cohort" preserves both, removes duplication. Other apprenticeship projects (4.1.2 Apprenticeship Sprint, 5.3 AI Apprenticeship CPL Tools, D.* KPI metric rows) stay distinct. | **DONE 2026-05-26** (PR #142, Sexy Dexy) |
| **Quickstart-Typeahead** | Typeahead suggestion dropdown + `scroll_to` direct-jump in the Quick-start chat. Two-part PR: (1) on mount, `quickstart.js` builds a search directory from `window.CPL_DATA.projects` + the existing `TABS` list; as the user types ≥2 chars, up to 6 matches surface in a small dropdown (name-prefix beats contains; project IDs like `4.1.2` searchable; mouse + arrow-keys + Enter + Escape all wired). Picking a suggestion BYPASSES the AI router. (2) New `scroll_to` key in `HINT_VOCAB.dashboard` — `dashboard_filters.js` consumes by finding the `.project-card` by exact `.project-name` text match, scrolling to it, and flashing a 1.6s box-shadow. Skips the filter mutations entirely (no noisy filter). Free-form prompts still go through Claude. CSS (`.qs-suggest*`, `@keyframes qsCardFlash`) mirrored to index.html. | **DONE 2026-05-26** (PR #144, Sexy Dexy) |
| **Cohort-family-rename** | Activity 3 had four cards titled "CPL Offers & Awards Tracking" (3.1, 3.1.1, 3.1.2, 3.1.2a). PR #142 disambiguated 3.1.2a only; this finishes the family: 3.1 → "— All Populations", 3.1.1 → "— Working Adults", 3.1.2 → "— Veterans & Service Members". 3.1.2a left as "— Apprentice Cohort" per user (suffix style varies slightly but disambiguation is clear). All four track distinct KPI series (per-cohort goal/stretch ladders), so folding was off-table — disambiguation is the right move. | **DONE 2026-05-26** (PR #145, Sexy Dexy) |
| **SEC-baseline** | Security tooling baseline — Dependabot (pip + github-actions, weekly), CodeQL (Python + JS, push/PR/weekly), TruffleHog secret scan (`--results=verified` to avoid false-positives on public Supabase anon keys). All free for public repos. ALL THREE STAGES MERGED this session (pip bumps #105/#106 stage 1, actions/checkout + setup-python #102/#104 stage 2, codeql-action v3→v4 #103 stage 3). | **DONE** 2026-05-23 (PR #101 + #102/#103/#104/#105/#106, Bruh Quad) |
| **CSC-polish** | Three CSC tab UI polish items: status badge label `Reviewed` → `Initiated` (DB fields, internal filter keys, and the "Reviewed" column header for who-acted stay as-is — the rename is the user-facing label only); `.cs-var-show` chip ("Show all (N) →") font-size .78rem → .7rem + color navy → slate-600 dark grey; `.cs-var-modal` (first/most-used variant in inline cell) font-weight 700 → 400 + color navy → black. CSS mirrored in both `CPL_Dashboard.html` and `index.html` per Rule 4; static template, not regenerated. | **DONE 2026-05-24** (PR #112, Bruh Hex) |
| **Exhibit-canon PR-A** | `kb/_audit_exhibits.py` re-runnable auditor over `kb/unified_titles.json` + `kb/credentials.json` (3,217 raw → 1,969 unified, 0 titles reviewed, 194 unclassified-in-MAP, 211 agency-collision candidates, 200 `suspect_course_as_exhibit`). Outputs to `kb/exhibit_audit/{latest.json, <date>.md}`. Rules: low/very-low confidence-band tags, `agency_name_collision_signal`, drift checks. `null_issuer_with_high_confidence` rule scoped + dropped (99% noise on legit local-college Cx buckets). Lessons doc: `docs/exhibit_canonicalization_lessons.md` (Rule 8, first checkpoint for this workstream). | **DONE 2026-05-24** (Session 6, Bruh Hex) |
| **Exhibit-canon PR-B** | **Credential Reference** tab — new top-level dashboard tab modeled on the CSC tab. Row grain: one per unified_title (1,969 rows). Shows raw-variant count, primary issuer, modal title confidence + issuer confidence, audit-tag chip (⚠ N from `kb/exhibit_audit/latest.json` per raw variant), quality_flag, curator-reviewed state. Click a row to expand → raw_title list + credential record(s) + audit-rule rollup. Filters: confidence band, issuing-agency typeahead (datalist over 126 issuers), audit-tag triage dropdown, quality-flag only, free-text search across unified/raw/issuer. Curation: **Mark initiated** writes to Supabase `kb_curation` via synthesized key namespace `_CREDENTIAL_REVIEW::<unified_title>` + field `reviewed_marker`. Auth piggybacks on the unified_courses.js session (sessionStorage key `cpl_sb`). Runtime fetch (no excel_to_dashboard.py changes, no daily-cron changes); JSON sync script `kb/_apply_credential_review.py` deferred — MVP edits live in Supabase + overlay only. | **DONE 2026-05-24** (Session 6, Bruh Hex) |
| **Exhibit-canon PR-C0** | EACR Phase 4 dry-run + alias map. `kb/_eacr_dryrun.py` projects every raw MAP row onto the post-pivot `(unified_title, issuing_agency, cpl_type, collab_type)` key, emits the alias map (`kb/eacr_dryrun/alias_map.json`) for the downstream re-key. Output: 3,217 raw IDs → 2,351 cards (27% collapse); 310 cards fold ≥2 raw IDs; max fold = 26 raw variants on AP World History. | **DONE 2026-05-26** (PR #125, Octaman) |
| **Exhibit-canon PR-C0b** | Re-classify the 58 raw titles flagged `unclassified_in_map_only` in PR-A's audit — closes the audit queue to zero before the producer re-pivot. | **DONE 2026-05-26** (PR #127, Octaman) |
| **Exhibit-canon PR-C1** | EACR Phase 4 producer re-pivot. `_build_statewide_adoption()` grouping key: `(raw_title, cpl_type, collab_type)` → `(unified_title, issuing_agency, cpl_type, collab_type)`. New per-card fields: `unified_title`, `issuing_agency`, `training_agency`, `confidence_title`, `confidence_issuer`, `quality_flag`, `raw_titles[]`. Generator-side strip pattern added to keep the daily regen idempotent. Headline adoption numbers shifted: 3,274 cards → 2,351. | **DONE 2026-05-26** (PR #128, Octaman) |
| **Exhibit-canon PR-C2** | EACR Phase 4 consumer redesign. Card title shows `unified_title` in bold + issuer subtitle in muted italic; "Also entered as N variants" disclosure (310 cards have ≥2 raw variants); confidence badge ("needs review · 0.NN" below threshold 0.75 per vision §6.2); quality_flag badge ("⚠ course-as-exhibit" on 193 cards). New Issuing Agency filter button. CSS in EXHIBIT_ANALYSIS_CSS so the daily regen carries it. Migration script `kb/_eacr_flag_migrate.py` for `_EACR_FLAG::*` curator-flag re-key (script-only; runs from curator laptop with `SUPABASE_SERVICE_KEY`). | **DONE 2026-05-26** (PR #131, Octaman) |
| **Exhibit-canon PR-C2-hotfix** | Hotfix on `_eacr_flag_migrate.py` — column is `reviewer_email`, not `reviewed_by` (`fetchFlagOverlay()` aliases the column to a property on the in-memory JS object; the migration script's first author read the rendering code and assumed the property name was the column name). Five character-substitutions. Migration applied via dry-run: **0 existing flags** (PR-D shipped only 2 days prior; no curator flagged anything in the window). Script stays for future-proofing. | **DONE 2026-05-26** (PR #132, Octaman) |
| **Quickstart-A** | Quick-start natural-language tab routing — single text input on the Dashboard first screen; Claude API classifies user prompt to one of the 8 tabs. New file `quickstart.js`; Cloudflare Worker proxy used for the API call. | **DONE 2026-05-26** (PR #129, Octaman) |
| **Quickstart-B** | Quick-start polish — swap `claude-sonnet-4-5` → `claude-haiku-4-5-20251001` (4-6s → 1-2s round-trip) since routing is a 1-of-8 classification; new `navigateTo()` provides scroll-to-top + nav-button pulse when the destination matches the active tab (the silent-no-op trap of `location.hash = current`). | **DONE 2026-05-26** (PR #130, Octaman) |
| **Quickstart-C** | Quick-start Tier B — filter-hint hand-off. Router emits an optional `filter_hint` object alongside `{tab, message}`; each curator tab pre-applies recognized keys to its filter state. `quickstart.js` stashes the hint in `sessionStorage['cpl_qs_hint_<tab>']` + fires a `cpl-qs-hint` window event before navigating, covering both already-mounted (event) and refresh-on-deep-link (sessionStorage) paths. `HINT_VOCAB` enumerates exact enum values per tab so Haiku copies strings verbatim (mismatch risk ~zero). Three tabs wired: `credential-reference` (audit_tag / confidence_band / issuer / quality_flag_only / search), `unified-courses` (12 keys incl. status/prov/triage/disc/search), `canonical-subj4` (status / top_2digit / search). Unknown keys silently dropped — bad hint never blocks nav. **Examples that work end-to-end:** "review unclassified credentials" → CR + `audit_tag=unclassified_in_map`; "find Adobe credentials" → CR + `search=Adobe`; "title-keyword Generated rows in CCR" → CCR + `status=Generated, prov=by title-keyword`; "subjects needing review" → CSC + `status=needs_review`. | **DONE 2026-05-26** (PR #135, Bruh Nona) |
| **SEC-CodeQL-trigger** | Disable CodeQL on PR events (push + weekly cron only). Eliminates CodeQL fatigue from PRs that touch innocent DOM-builders the analyzer perpetually flags as `js/xss`. Push + weekly schedule retain real coverage. | **DONE 2026-05-26** (PR #126, Octaman) |
| **Exhibit-canon PR-D** | EACR-card **stale/dup flag** — small in-place addition to the existing EACR table (`statewide_interactive.js`). Per-row `<select>` with three options (— / 🚩 stale / 🚩 dup). Auth-gated; curator signs in via the Common Course Reference or Credential Reference tab (sessionStorage `cpl_sb`). Writes to Supabase `kb_curation` via synthesized key namespace `_EACR_FLAG::<exhibit_card_key>` + field `flag`. Anonymous viewers see flagged rows with a read-only 🚩 badge so the curator's annotation is publicly visible. Tooltip carries the audit trail (flagged by user · on date). **Deliberately narrow scope per user direction:** no Credit Recommendation overrides, no approval status, no notes — only the stale/dup flag. | **DONE 2026-05-24** (Session 6, Bruh Hex) |
| **Cred-Ref-hotfix-A** | `VALID_TABS` whitelist coupling — PR-B added the Credential Reference tab nav button + pane + script tag, but the inline tab-router whitelist (`CPL_Dashboard.html` line 13013) wasn't updated, so clicking the tab fell through to the dashboard fallback. Curator reported the tab "is a copy of the dashboard main". One-line fix: append `'credential-reference'` to the whitelist. | **DONE 2026-05-25** (PR #117, Bruh Hept) |
| **Cred-Ref-hotfix-B** | Magic-link return-tab — `unified_courses.js`'s `consumeAuthHash()` hardcoded `location.hash = "unified-courses"` after magic-link callback, bouncing the curator to the Common Course Reference tab regardless of where they started sign-in. Each tab's `signIn()` now stashes its identifier in `sessionStorage.cpl_sb_return_tab` before the OTP request; `consumeAuthHash` reads it back, defaulting to `"unified-courses"`. Same fix applied to canonical_subj4.js. | **DONE 2026-05-25** (PR #118, Bruh Hept) |
| **Cred-Ref-hotfix-C** | Inline sign-in feedback panel across all 3 curator tabs — replaces the easily-missed corner toast (and `unified_courses.js`'s clunky `alert()`) with a prominent green inline panel that lives where the "sign in to edit" link used to be. "✉ Magic link sent to {email}" + a "use a different email" link; red error variant with "try again" for failures. Per-tab `pendingSignInEmail` / `pendingSignInError` state. | **DONE 2026-05-25** (PR #119, Bruh Hept) |
| **Cred-Ref-hotfix-D** | 429-aware error mapping — distinguish Supabase rate-limit responses ("Too many sign-in emails…") from 400/422 allowlist errors ("Server rejected — confirm allowed-reviewers") from generic 5xx. Three tabs symmetric: `unified_courses.js` already had the branch; `credential_reference.js` and `canonical_subj4.js` were not mirrored. | **DONE 2026-05-25** (PR #120, Bruh Hept) |
| **Cred-Ref PR-1** | Common-course join + Local/Statewide badge + Discipline column. New `export_credential_reference()` in `excel_to_dashboard.py` joins `kb/unified_titles.json` + `credentials.json` with the course-identity layer (`coci_articulations.json` + minted/unified/singleton catalogs) → emits `credential_reference_data.js` (~1.5 MB lean payload, pre-joined + audit-tag rollup + `top_categories` map). Tab loads the baked global synchronously; runtime fetch of `kb/*.json` kept as fallback. Per-row Scope badge (🏛 Statewide / 🏠 Local / —), Discipline column (modal MQ discipline across articulations). Expanded body leads with a per-identity table: CCN-ID/C-ID/M-ID/Cluster identity (color-coded), local course code+title, earning college(s); identity cell rowspan'd when ≥1 local course shares it. Stats: 1,969 unified titles · 1,726 articulated · 4,324 local-course lines · 90 statewide · 1,106 audit-flagged. | **DONE 2026-05-25** (PR #121, Bruh Hept) |
| **Cred-Ref PR-2** | Select-all + bulk "Mark N initiated" workflow — clears the audit-flagged backlog without one-at-a-time clicks. New first-column per-row checkbox (disabled if already initiated OR during a save); header "select all visible eligible" (filtered-view-scoped) with indeterminate state on partial selection. Toolbar widget shows green "✓ Mark N initiated" button + clear link when N>0; swaps to a yellow "Saving X of N…" progress indicator during the sequential Supabase save. Per-row UI flips to ✓ as each save completes. Confirm dialog before kickoff; final toast reports ok/failed counts. | **DONE 2026-05-25** (PR #122, Bruh Hept) |
| **Cred-Ref PR-3** | TOP / Discipline grouping with collapsible category headers. "Group by:" toolbar dropdown (none / TOP category / Discipline). TOP mode buckets by 2-digit TOP code with `TOP 12 — Health` headers (using `top_categories` map from the baked payload, sourced from `kb/discipline_canonical_subj4.json` — the same source the CSC tab uses). Discipline mode buckets by MQ discipline. Group headers are colspan'd table rows with ▶/▼ twisty; click to toggle collapse. Empty buckets ("(No TOP category)" / "(No discipline)") sink to the bottom. `state.collapsedGroups` keyed by `mode:key` to avoid clashes across mode switches; resets on mode change for predictability. | **DONE 2026-05-25** (PR #123, Bruh Hept) |
| **Cred-Ref PR-4** | Edit-override curation on Credential Reference — `unified_title` rename, `issuing_agency` override, `training_agency` override, `quality_flag` toggle. Click any of the four fields to edit inline; save to Supabase via `_CREDENTIAL_REVIEW::<unified_title>` namespace with per-field column. Override-takes-precedence display rule. Auth-gated; same allowed-reviewers list. **Risk hot-spot**: any `unified_title` rename ripples into `kb/coci_articulations.json` (which inlines the field) — re-mint playbook discipline applies (alias map at write-time, daily-cron picks up via `kb/_apply_credential_review.py` sync script, atomic). | **DONE 2026-05-26** (Session 10, Sexy Dexy — overlay-only display-override ships; rename promotion = PR-5b) |
| **PR-Sidebar-A** | Replace top tab nav with a fixed left rail sidebar. CSS Grid layout (`grid-template-columns: 220px 1fr`). Each tab as a list item in the rail; sign-in status surfaces in the rail footer (read-only badge); URL-hash routing unchanged. Hamburger toggle at ≤900px (fixed slide-over). **Bundled `tabs.js` extraction**: derives `VALID_TABS` from rendered nav items, closes the 5-touch-points trap that caused PR #117/#118/Letters-Quickstart regression. Exposes `window.CPL_TABS.activate()` for other modules. | **DONE 2026-05-27** (PR #147, Bruh El) |
| **PR-Sidebar-B** | Per-tab section TOC + scroll-spy under the active rail item. Each pane declares its sections via `data-sections='[{slug,id,label},…]'`; tabs.js reads, renders nested `<ul>`, wires smooth-scroll + URL hash (`#tab/section`). IntersectionObserver highlights current section (rootMargin `-80px 0 -55% 0`). Dashboard sections: KPI Metrics, CPL Analytics, Workplan & Projects. Pipeline sections: Phase roadmap, M-ID lifecycle, Auditor receipt, Recent re-mint (added IDs to `.pl-section` divs). | **DONE 2026-05-27** (PR #148, Bruh El) |
| **Auto-merge-auth** | CLAUDE.md Branch Policy gets explicit auto-merge gates so Claude sessions can complete the merge step on PRs they opened: CI green, no unresolved reviews, squash-merge, delete branch, **confirm for architecturally significant PRs** (re-mints, schema migrations, Excel→Supabase phases, cross-repo state). Use `mcp__github__merge_pull_request` with `merge_method: "squash"`. Established via AskUserQuestion in Session 11. | **DONE 2026-05-27** (PR #149, Bruh El) |
| **Cred-Ref PR-5a** | Daily sync of `_CREDENTIAL_REVIEW::*` Supabase rows → `kb/credential_review_overlay.json` (git-canonical overlay; mirrors `_apply_curation.py`). Mode A scope: `issuing_agency_override`, `training_agency_override`, `quality_flag_override`, `reviewed_marker` folded in. `unified_title_override` recorded but NOT applied (Mode B / PR-5b territory — full re-mint playbook). Daily workflow step 3 + step 6 commit add it. Non-fatal sync; gracefully absent on first run. | **DONE 2026-05-27** (PR #150, Bruh El) |
| **KB-notes lane** | New `docs/kb-notes/` lane for distilled, durable, reusable knowledge with frontmatter-strict `kb-status: published|archived|internal` (the `candidate` middle state was retired Session 11). Three-lane doc model (KB notes / lessons / handoffs). `docs/INDEX.md` auto-maintained landing page. CLAUDE.md gets new "Obsidian vault wiring" section documenting the vault-side clone pattern at `CPLBrain\COG-second-brain\cpl-project-tracker\`. Checkpoint command upgraded to surface KB candidates in commit body. | **DONE 2026-05-27** (PR #151, Bruh El) |
| **Cred-Ref PR-5a follow-up** | Bake curator overrides into `credential_reference_data.js` with AI baselines preserved on `_original_<field>` siblings. Rewrites `applyOverlay()` to be **bake-aware**: case (a) live override wins + baseline from `_original_`; case (b) baked-then-cleared revert; case (c) no-op. Cleared overrides now revert immediately on reload, not stuck until next 10:17 UTC sync. Backwards-compat with the runtime-fetch path (no `_original_*` → falls through to original semantics). | **DONE 2026-05-27** (PR #152, Bruh El) |
| **CSC-G phase 2** | Exhibit-table per-column header alignment. `table_card()` accepts `(text, kind)` tuples (kind ∈ `num`/`pct`/`name`) alongside plain strings; emits matching `<th class="exhibit-th-{kind}">`. All 7 exhibit-analysis emissions updated. CSS rules in `EXHIBIT_ANALYSIS_CSS`. xlsx exporter strips tuples to plain strings at the export boundary. | **DONE 2026-05-27** (PR #153, Bruh El) |
| **Vault auto-sync** | `scripts/sync-vault-clones.ps1` + Windows Task Scheduler entry keep the in-vault clones of `cpl-project-tracker` + `cpl-knowledge-base` fresh on a scheduled fast-forward pull. Strictly safe: never auto-merges, skips uncommitted/diverged repos, logs to `.vault-sync.log`. Checkpoint commits flow into Sam's Obsidian without manual `git pull`. **Retired** the `kb-status: candidate` middle state — sessions now author KB notes at `published` quality directly (no review queue). | **DONE 2026-05-27** (PR #154, Bruh El) |
| **Sync-script ASCII hotfix** | PowerShell 5.1 reads `.ps1` files as Windows-1252 by default; my em dashes (U+2014) decoded as garbage and broke string parsing at the first log message. Replaced 11 em dashes with ASCII `--`. Lesson: Windows-PowerShell-targeted scripts must be pure-ASCII or carry a UTF-8 BOM. | **DONE 2026-05-27** (PR #155, Bruh El) |
| **Task Scheduler companion** | `scripts/setup-task-scheduler.ps1` — single-paste registration of the "CPL Vault Sync" task; idempotent, `-CadenceMinutes`/`-Remove` switches, elevation check. Playbook updated with Option A (script) + Option B (GUI). Documents the `[TimeSpan]::MaxValue` gotcha that bit Sam's first attempt at the inline registration block. | **DONE 2026-05-27** (PR #156, Bruh El) |
| **Auditor `merge_into_orphan`** | Eighth audit rule, first **curation-pointer** rule. Fires when a curation `merge_into` target can't be resolved to any known identity (M-ID ∪ singleton ∪ `UC-CUR-*`). New `_curation_orphan_tags()` helper runs symmetrically over M-ID + Cluster loops so future curation-edge rules (cycle detection, source↔target title drift) plug in without touching record-derived tag code. No per-field penalty — data-integrity signal, not field-quality evidence. Calibration: 0 flags on current data (all 3 live pointers cleanly target `UC-CUR-MPG029OM`); preventive infrastructure for the next re-mint. | **DONE 2026-05-27** (PR #157, Bruh Dec) |
| **Cred-Ref PR-5b/0** | Mode B prep — bakes `display_title` + `_original_display_title` siblings into `credential_reference_data.js` so `unified_title_override` works as a Mode-A *display* override (the `ut` field STAYS as the original since it's the overlay lookup key — only the display field changes; mirrors the bake-aware pattern PR-5a follow-up established for issuer/trainer/quality_flag, but with the override surfacing into a SEPARATE display field rather than overwriting the identity key). Adds `kb/_cred_rename_dryrun.py` — re-runnable, reads `kb/credential_review_overlay.json`, projects each override onto post-rename state, classifies as clean/collision/skipped, runs V1 (intra-batch) + V2 (source exists) + V3 (target collision-free) gates, writes `kb/cred_rename_dryrun/{report.md, alias_map.json, collisions.json}`. Daily workflow runs the dry-run as a report-only step (Step 4c, after the auditor; non-fatal). Zero source mutation. Calibration: 0 overrides in overlay today; infrastructure populates the moment a curator enters a rename. | **DONE 2026-05-27** (Bruh Dec) |
| **Cred-Ref PR-5b/1** | Mode B apply — two apply scripts (`_cred_rename_apply.py` re-keys `kb/credentials.json` + rewrites `kb/unified_titles.json` + `kb/coci_articulations.json` values; `_cred_rename_apply_supabase.py` DELETEs fulfilled `unified_title_override` rows + PATCHes other override rows' `course_id` to the new identity). Manual `workflow_dispatch` trigger at `.github/workflows/cred-rename-apply.yml`, shares `concurrency: daily-dashboard` lock. V1–V4 apply gates baked into the apply script (V1: dry-run apply_safe; V2: source exists; V3: target collision-free at apply time; V4: articulation cardinality preserved). Alias map committed at `kb/cred_rename_out/<date>/alias_map.json` (the canonical audit trail per the ADR). Collision policy: **reject + decision-queue** (no auto-merge, no auto-disambiguate). **Light workflow** — 5 steps, ~110 lines (vs Phase 1e's 7 steps + 200 lines); credential rename has no auditor cleanup-receipt invariants, so post-apply re-checks dropped. End-to-end synthetic-injection test confirms V4 + idempotency on real data. | **DONE 2026-05-27** (Bruh Dec) |
| **Excel→Supabase Phase 1** | Migrate Workplan Goals tab from `CPL_Initiative_Project_List_v3.xlsx` reads to Supabase `workplan_goals` table reads (proof-of-concept). `excel_to_dashboard.py` reads from Supabase via service-role key (already a secret per §6); inline editor on the tab with curator overlay (same pattern as the credential/CCR/CSC tabs). One-time data import from Excel → Supabase. Validates the architecture before the larger Dashboard / Budget / Vision 2030 migrations in Phases 2-4. **Scoped + decisions locked (Bruh Baker, 2026-05-28):** Supabase = source of truth, Excel abandoned. Activity-set = "A+" auto-derivation (every Project List row with a non-zero KPI cell, excluding `D.*`, no parent/child aggregation — `4.1` and `4.1.1`-`4.1.4` each render as their own row). Snapshot fallback at `kb/workplan_goals_snapshot.json` for graceful degradation on Supabase outage; subtle "as of YYYY-MM-DD" staleness signal in the tab header. 6-PR plan:<br>· **PR-1 #162 DONE** (2026-05-28) — validator (`kb/_validate_workplan_goals.py`) + Excel snapshot at `archive/CPL_Initiative_Project_List_v3_2026-05-28_pre-supabase-migration.xlsx` + initial drift report (`kb/workplan_goals_validation.md`). Surfaced three-way drift: Excel ≠ Supabase ≠ renderer `core_ids`. Latent renderer bug exposed: 4.1 sprint aggregation expecting `4.1a/b/c/d` but Excel has `4.1.1-4.1.4` → silently summing zero; cohort family (3.1.1/3.1.2/3.1.2a) + Activity 5 invisible.<br>· **PR-2 #163 DONE** (2026-05-28) — A+ derivation replaces `core_ids` projection. Dry-run seed planner (`kb/_seed_workplan_goals.py`) emits per-row INSERT/UPDATE/DELETE plan (`kb/workplan_goals_seed_plan.md`). 27 A+-derived activities (vs 19 hardcoded). Plan totals: 34 INSERTs + 20 UPDATEs + 0 NO-OPs + 0 DELETEs. Pre-seed Supabase snapshot at `archive/workplan_goals_supabase_2026-05-28_pre-seed.json` for forensics. Notable rename: `2.4` flips from Supabase's stale "AI-Ready California Demonstration" → Excel's current "Validated Skills" (AI-Ready moved to Excel's `5.1`).<br>· **PR-3 #164 DONE** (2026-05-28) — seed apply (`kb/_seed_workplan_goals_apply.py`) + `workflow_dispatch` workflow (`.github/workflows/workplan-goals-seed-apply.yml`). V1-V4 gates: V1 fresh Excel A+ derivation produces N>0 activities; V2 every UPDATE/DELETE matches ≥1 Supabase row (source-exists); V3 post-apply row count = `2 × |A+ activities|`; V4 validator re-runs clean. Per-row INSERT (POST) / UPDATE (PATCH) / DELETE behind PostgREST. End-to-end synthetic test passing (monkey-patched HTTP layer, 2 INSERT + 2 UPDATE + 2 DELETE round-trip green). Apply log + plan snapshot under `kb/workplan_goals_seed_out/<date>/`. **Sam dispatched the workflow mid-session — V4 green on first attempt** (54 matches / 0 mismatches / 0 missing / 0 orphans = exactly the plan's prediction).<br>· **PR-4 #166 DONE** (2026-05-28) — generator reads Supabase + snapshot fallback. New `kb/_load_workplan_goals.py` with `fetch → write snapshot → render` chain; on Supabase failure, falls back to `kb/workplan_goals_snapshot.json` and renders with the snapshot's `_fetched_at` date stamp. Subtle "Data as of YYYY-MM-DD" line under the section description. Both Supabase down AND snapshot missing → RuntimeError (no silent rendering of nothing). Daily workflow now passes `SUPABASE_SERVICE_KEY` into the pipeline + git-adds the snapshot. First daily run after merge rendered 27 activities cleanly (Sam confirmed "Dash update complete and clean!"). **Scope wrinkle held:** Excel `kpi_metric` (the "Current" column) stays Excel-sourced until Phase 2.<br>· **PR-6 #167 DONE** (2026-05-28) — dead-code retirement. Deleted `build_workplan_goals_from_projects` (148 lines, unreferenced after PR-4). Excel KPI ladder columns stay alive in `read_projects()` because three JS report consumers (`generate_reports.js`, `report_generator.js`, `college_report_generator.js`) still read them off `CPL_Data.js`; their migration is bundled with Phase 2 when project metadata moves.<br>· **PR-5 #168 DONE** (2026-05-28) — inline editor. ~300-line `workplan_goals.js` hydrates the Python-rendered tables with click-to-edit affordances. Per-cell edit on GOAL/STRETCH year values; magic-link auth via the shared `cpl_sb` session; optimistic save via PATCH to Supabase; dual-table mirroring (cell edit fans out to both the grouped section AND the comprehensive table via shared `data-aid`/`data-rt`/`data-yr-key` selectors). **Narrow scope per mid-session call:** edit-only on existing 27 rows; NO add-flow (deferred until Activity↔Project N-to-N data model is designed); NO Current-column editing (kpi_metric is Excel territory). Auth-banner UI states: editable (pointer cursor) / editing (input box) / saving (amber) / saved (green) / error (red rollback).<br>· **RLS tightening DONE** (2026-05-28, migration `workplan_goals_rls_tighten_to_allowed_reviewers`) — `workplan_goals` previously had `"Allow auth write"` with `qual=true` (any authenticated user could write). Dropped + replaced with per-command policies gating on `is_allowed_reviewer()`. Mirrors `kb_curation`'s policy shape. Public read unchanged. Today's `allowed_reviewers` = `map@rccd.edu`.<br>· **Phase 1 functionally complete at the dashboard-tab level.** The deferred work (Activity↔Project N-to-N model + add-flow + page UX) is scoped in `docs/excel_to_supabase_lessons.md` Session 13 end-state section as 4 PRs (PR-A schema migration + PR-B generator/renderer + PR-C editor/add-flow + optional PR-D separate-page). | **Phase 1 DONE** (2026-05-28); Activity↔Project model + Phase 2-4 queued |
| **Activity↔Project PR-A** | Schema migration adding the Activity vs. Project distinction to `workplan_goals` + an N-to-N association table. `kind` column (CHECK in `{'activity','project'}`, default `'project'`); 5 `kind='activity'` rows pre-seeded for Activities 1-5 (curator-editable ladder, initially zeroed — Sam's call: uniform shape with project rows). New `workplan_activity_associations(project_id, activity_id)` with public-read / allowed-reviewer-write RLS mirroring `workplan_goals`. **No DB-level FK** (workplan_goals.activity_id is non-unique because of the dual GOAL/STRETCH row shape; cleaner FK would have required collapsing that shape — application-enforced check via the validator instead, mirroring how `kb_curation` handles loose pointers). Backfill from project_id leading digit produced 27 1-to-1 associations (Activity 1 → 4 projects, 2 → 4, 3 → 9, 4 → 9, 5 → 1). Code ripples: loader exposes new `load_workplan_goals_full()` returning `(rows, assocs, fetched, source)`; legacy `load_workplan_goals()` stays backwards-compat. Validator's `reshape_supabase()` scopes to `kind='project'` for the Excel-A+ diff + new `validate_associations()` catches orphan-activity / orphan-project / projects-without-assoc. Apply script's PATCH/DELETE scoped to `kind=eq.project` so Activity rows can never be touched by the Excel seed loop; V3 cardinality check counts `kind='project'` rows. Generator's `build_workplan_goals_from_supabase()` filters `kind='activity'` rows out so existing renderer is unchanged. V1-V4 gates green inline (apply via `apply_migration` MCP — no `workflow_dispatch` since one-shot DDL + a single backfill INSERT fit one transaction, unlike Phase 1 PR-3's 54 per-row PostgREST operations). Pre-migration snapshot at `archive/workplan_goals_2026-05-28_pre-pr-a.json`. **Unblocks PR-B** (first-class Activities rendering + "Contributes to: Activity N" project chips). | **DONE 2026-05-28** (Session 14, Bruh Sonnet) |
| **Activity↔Project PR-B** | Generator + renderer update for first-class Activities. `build_workplan_goals_from_supabase(rows, associations, projects, …)` now returns `(activities, workplan_goals, annual_goals)`; per-project `activity_ids: ["N"]` sourced from the associations table (fallback: project_id leading digit). Renderer (`render_workplan_goals_html`) gains an `activities` parameter and emits a dedicated **Activities — Top-Level Aggregate Targets** table above the existing per-Activity project tables; ladders show even when zero (curator-editable). Group header labels source from Supabase Activity names (hardcoded `activity_labels` dict survives as defensive fallback when a row is missing). Every project row carries a "Contributes to: Activity N" chip below its name (always rendered — future-proof for N-to-N data, even though today's data is 1-to-1). Editable cells gain optional `data-kind="activity"`/`"project"` and `workplan_goals.js`'s `saveCell()` includes `kind=eq.{kind}` in the PATCH query when present; optimistic-paint selectors also scope by `data-kind`. Backwards-compatible (pre-PR-B cells fall through; activity ids `"1"`-`"5"` and project ids `"1.1"`-… are disjoint, so the unscoped PATCH is still safe). Smoke-tested from snapshot: 5 activities + 27 projects + 27 chips + 60 `data-kind=activity` attrs + 324 `data-kind=project` attrs; HTML tag balance clean. **Open follow-up**: `build_activity_kpis()` has its own hardcoded `activity_labels` dict (missing Activity 5) feeding the Workplan Activity Metrics KPI cards — out of PR-B scope (different section). | **DONE 2026-05-28** (Session 14, Bruh Sonnet) |
| **Activity↔Project PR-C** | Editor add-flow modal. New "+ Add new row" button in the auth widget (signed-in curators only) opens a single modal with: Activity/Project radio (Project default); ID input (strict validation — Activities = single digit, Projects = `N.x` where N is an existing Activity ID; collision check against current page state via `data-aid` query); Name input; for Projects, a checkbox row of existing Activities (multi-select for N-to-N — at least one required); GOAL + STRETCH ladder fields (5 inputs each, default 0). On submit: POST batch `[GOAL, STRETCH]` rows to `workplan_goals` with `kind` set + total computed; for Projects, POST associations to `workplan_activity_associations`; page reloads on success to render the new row. Validation errors surface inline in the modal (e.g. "Project ID '3.7' already exists"). Esc / overlay click / Cancel all close. Scope locked at Sam's call: add-flow only. Edit-name / edit-associations / delete-row deferred (no curator demand signal yet; can be a small follow-up if asked). | **DONE 2026-05-28** (Session 14, Bruh Sonnet) |
| **Activity-KPI cards label cleanup** | Small followup to PR-B: `build_activity_kpis()` had its own hardcoded `activity_labels` dict missing Activity 5. New optional `activities` parameter sources labels from the Supabase Activity rows (same pattern as `render_workplan_goals_html`); hardcoded fallback retained + now covers Activity 5. `main()` reorders the workplan-goals load so `activities` is available before `build_activity_kpis()`. Closes the LABEL half of PR-B's open follow-up. The related `core_ids` drift bug it flagged (missing `5.1`; `4.1a-d` vs `4.1.1-4.1.4`) was **FIXED Session 15** (Bruh Parallax, PR #180 — see the core_ids auto-derive row below). | **DONE 2026-05-28** (PR #173, Session 14, Bruh Sonnet) |
| **Activity↔Project bug-hunt fixes** | Post-merge code review over PR-A/B/C surfaced three small issues, all fixed: (1) **XSS hygiene** — Supabase-sourced names flow into rendered HTML in 6 places (chip `title=""` attribute, Activity + Project name cell bodies, group header labels) without escape. Realistic threat low (only `is_allowed_reviewer()` users write; today = `map@rccd.edu` self-attack), but cheap hygiene. Now uses `from html import escape as html_escape` to dodge name-shadow against renderers' local `html` variables. Smoke-tested with `<script>` + `"><img onerror=…` payloads — both render harmless. (2) **Esc-listener leak** in the PR-C add-flow modal — Cancel/overlay-click left the listener attached; each subsequent open stacked another. Fixed by storing `_activeEscListener` on the module scope + detaching in `closeAddModal()`. (3) **`syncKindUI` robustness** — was reading via `querySelector('input[name="wpg-kind"]:checked').value` (can throw if no radio is briefly `:checked`); now mirrors `validateAdd`'s ternary read from the bound refs. Bug-hunt findings #3/#5/#6/#7/#8/#9 reviewed + dismissed (intentional behavior, race resolves correctly, future risk only). | **DONE 2026-05-28** (PR #174, Session 14, Bruh Sonnet) |
| **Excel→Supabase Phase 2 scoping doc** | KB note at `docs/kb-notes/phase-2-projects-migration-scope.md` (registered in `docs/INDEX.md` under the playbook lane). Covers: why projects is the right Phase 2 entry point (empty Supabase table → smallest possible PR-3 blast radius; biggest downstream unlock via 3 JS report consumers); full Excel→Supabase column mapping (8 renames + 3 type changes + 2 drops + 10 ladder cols handled out-of-band); KPI ladder contract-preservation strategy (join `workplan_goals` `kind='project'` into `CPL_Data.js` builder so JS consumers see no contract change); 5-step PR plan modeled on Phase 1 (PR-1 validator → PR-2 dry-run → PR-3 apply + workflow_dispatch → PR-4 generator switch + snapshot fallback → PR-5 inline editor → PR-6 retire `read_projects()`); **6 forks Sam must lock before PR-1 ships** (date parser strictness, budget type, status enum vs free-form, override/excel_row drop confirmation, JS contract on `kpi_target_*`, RLS shape). Cost estimate: ~6-7 PRs, one focused session. No code cut from this PR — it's the contract for Sam to review before any Phase 2 PR ships under it. | **DONE 2026-05-28** (PR #175, Session 14, Bruh Sonnet) |
| **Vault-sync repoint** | `scripts/sync-vault-clones.ps1` `$vaultRoot` pointed at `Documents\Claude\Projects\CPLBrain\COG-second-brain`, but Sam's Obsidian reads `Documents\GitHub\COG-second-brain` — the 18 logged pulls succeeded yet landed where Obsidian wasn't looking, so KB notes never appeared. Repointed `$vaultRoot` + playbook cutover steps (clone into new root, re-run `setup-task-scheduler.ps1`, archive orphan clones). `setup-task-scheduler.ps1` needed no change (resolves the sync script via `$PSScriptRoot`). | **DONE 2026-05-28** (PR #178, Session 15, Bruh Parallax) |
| **core_ids auto-derive** | `build_activity_kpis()` drove its KPI cards off a hardcoded `core_ids` (no `5.x` → Activity 5 never rendered) + `sprint_ids=['4.1a'..'4.1d']` (don't exist → the 4.1 sprint composite never built, fell back to the raw row). Replaced both with `derive_core_activity_ids(projects)` (A+ rule: non-zero-KPI, excl `D.*` + the real `4.1.1-4.1.4` sprint children that fold into 4.1) + module-level `SPRINT_IDS`; fixed the stale `4.1a→4.1.1` in `pid_to_kpi_key`. Verified vs live Excel: Activity 5 renders (5.1); 4.1 composite counts 4 sprints; Activity 3 6→9 cards. Labels already Supabase-sourced (PR #173) — untouched. | **DONE 2026-05-28** (PR #180, Session 15, Bruh Parallax) |
| **Excel→Supabase Phase 2 PR-1** | Projects-table validator (`kb/_validate_projects.py`) + pre-seed snapshots, mirroring Phase 1. Reuses `read_projects()` for exact dashboard parity; maps to the 21 comparable Supabase cols (8 renames + pct→numeric + 3 str→date); drops `override`/`excel_row`; 10 KPI-ladder cols handled out-of-band; lenient date parse (fork #1 — 3 `"Ongoing"` end_dates → NULL). **Measure-first caught a scope-doc assumption:** the projects-table unit is **all 34 real projects** (every grid card), NOT the workplan_goals A+ non-zero-KPI subset (27) — Sam: "keep the zero-KPI cards." Initial diff: 34 missing / 0 / 0 (empty table). | **DONE 2026-05-28** (PR #179, Session 15, Bruh Parallax) |
| **Excel→Supabase Phase 2 PR-2** | Dry-run seed planner (`kb/_seed_projects.py` → `kb/projects_seed_plan.md`), importing the PR-1 validator (DRY). Plan vs the empty table: **34 INSERT / 0 UPDATE / 0 NO-OP / 0 DELETE**. Read-only pre-write review artifact. | **DONE 2026-05-28** (PR #181, Session 15, Bruh Parallax) |
| **Excel→Supabase Phase 2 PR-3** | Apply artifacts + the live RLS tighten. `kb/_seed_projects_apply.py` (per-row PostgREST behind V1-V4 gates; single-row-per-id, so V3 = `len(Excel)` not `2×`) + `kb/supabase_projects_rls_tighten.sql` + `.github/workflows/projects-seed-apply.yml` (`workflow_dispatch`, concurrency `daily-dashboard`). Synthetic-tested vs an in-memory fake Supabase (empty→34 INSERT; idempotent re-run; drift+orphan = 1 UPDATE+1 DELETE+33 INSERT), all V1-V4 green. **RLS migration applied LIVE via MCP** (`projects_rls_tighten_to_allowed_reviewers`: dropped loose `Allow auth write`, added `is_allowed_reviewer()`-gated INSERT/UPDATE/DELETE, kept public SELECT; verified). **Seed DISPATCHED + landed 2026-05-29** (Session 16): Sam ran the workflow → 34 rows, V1-V4 green on first attempt, receipts at `kb/projects_seed_out/2026-05-29/` (commit `472f798`). | **DONE 2026-05-28** (PR #182 + live RLS, Session 15); **seed landed 2026-05-29** (Session 16) |
| **Excel→Supabase Phase 2 PR-4** | **Generator cutover** — the 34 real projects now load from Supabase (`kb/_load_projects.py` + `build_projects_from_supabase()` + `load_projects()` in `excel_to_dashboard.py`); three-tier resilience **Supabase → `kb/projects_snapshot.json` → Excel `read_projects()`**; subtle "Project data as of YYYY-MM-DD" stamp on the grid. **Parity-proven** by `kb/_test_projects_parity.py` (34 projects byte-identical to `read_projects()` modulo 3 invisible `"Ongoing"`→NULL end-dates [start/end render nowhere] + 8 HTML-invisible whitespace trims). **3 scope-doc gaps caught + handled, all behavior-preserving:** (1) `read_projects()` returns **49 rows** (34 grid cards + 15 `D.*` KPI-helpers; `D.1/2/3` feed the cohort composites) → `D.*` stays Excel-sourced; (2) `excel_row` (Excel-web deep-links) kept Excel-sourced (scope doc said drop); (3) the **KPI ladder stays Excel-sourced** — workplan_goals conflates blank-vs-literal-0 so it can't losslessly reconstruct (1.4 has a real `0`), AND the Excel ladder cols aren't retired in Phase 2 anyway. `override` verified all-None → drop is a true no-op. Daily workflow git-adds the snapshot. | **DONE 2026-05-29** (PR #184, Session 16, Bruh Word) |
| **Excel→Supabase Phase 2 PR-5** | **Projects inline editor** — all 17 fields click-to-edit on the project cards (`projects_editor.js`, mirrors `workplan_goals.js`: shared `cpl_sb` magic-link auth, `PATCH projects?id=eq.{pid}` single-PK no kind-filter, 12 inline inputs + 5 modal textareas, optimistic paint + rollback, `data-status`/`data-lead`/`data-goal` filter-sync, progress-bar repaint). 7 previously-hidden fields (Team/CPL-Goal/Timeline/KPI/Milestones) now render on **public** cards (Sam's "show on public cards" call — richer dashboard; empty fields render a neutral `—`). RLS already gates writes (PR-3). **Built by a worktree sub-agent, then reviewed + hardened:** the review's hostile-input smoke test caught a `data-folder` XSS sink the agent missed (project `name` is now curator-editable) → escaped ALL curator-editable render sites + both `data-folder` sinks (project + activity-KPI cards) + switched JS optimistic paint to `textContent` (mirrors PR #174). Editor `proj-*` CSS lands on the next daily regen. | **DONE 2026-05-29** (PR #186, Session 16, Bruh Word) |
| **Excel→Supabase Phase 2 PR-6** | "Retire `read_projects()`" — **moot / superseded.** `read_projects()` stays load-bearing: it supplies the `D.*` KPI-helper rows, the KPI ladder, `excel_row`, and the ultimate Excel fallback inside `load_projects()`. It retires only when the Excel ladder cols + `D.*` helpers themselves migrate (Phase 3+, bundled with the JS-consumer migration). | **N/A — superseded** (Session 16, Bruh Word) |
| **Gitignore agent worktrees** | Added `.claude/worktrees/` (harness-created transient worktrees for background agents, `isolation: worktree`) to `.gitignore` so they never show as untracked or get committed. Surfaced when a stop-hook flagged the running PR-5 build agent's worktree dir. | **DONE 2026-05-29** (PR #185, Session 16, Bruh Word) |
| **Excel→Supabase Phase 3 PR-1 (Budget cutover)** | Budget tab cut over Excel→Supabase `budget_expenditures` — fixes a **live $0 bug** (the deployed dashboard rendered the budget as $0; the Supabase read restores the real **~$89M** plan). `kb/_load_budget.py` + `build_budget_from_supabase()` + snapshot fallback + "Data as of YYYY-MM-DD" stamp, mirroring the Phase 2 cutover shape. **Compressed vs Phase 2** because `budget_expenditures` already held rows → a direct read-path cutover, not the full seed dance. Budget inline editor (PR-5-equivalent) still queued. | **DONE 2026-05-29** (PR #189, Session 17, Qualitastic) |
| **Activity↔Project association editor (#190)** | The "Contributes to: Activity N" chip line in the Workplan Goals tab became **click-to-edit** (popover: 5 Activity checkboxes + a primary radio; Supabase CRUD on `workplan_activity_associations`). Added the **`is_primary`** column (migration applied via MCP `apply_migration` — §8 source-of-truth schema, Sam pre-authorized in the same AskUserQuestion as the merge). Also folded in a **CSS-accumulation fix** (the editor's `.wpg-assoc-*` block was accreting across regens → restores the Rule-2 idempotency guard). | **DONE 2026-05-29** (PR #190, Session 17, Qualitastic) |
| **Activity↔Project orphan close-out** | 7 Activity-5 projects (`5.2`–`5.8`) had **no `workplan_goals` ladder row** → never backfilled into `workplan_activity_associations` → orphaned in the N-to-N model (and unreachable by the #190 editor, which attaches to rendered workplan rows). Linked all 7 (product-owner-confirmed leads via AskUserQuestion: `5.2→A1`, `5.3→A1 primary +A4`, `5.4→A4`, `5.5→A5`, `5.6→A4`, `5.7→A3`, `5.8→A4`) + default-primary-backfilled the 27 pre-existing 1-to-1 associations. Verification: **35 associations · 34/34 projects exactly one primary · 0 orphans**. Audit trail: `docs/activity_association_orphan_plan.md` (marked APPLIED). Supabase data ops (execute_sql), no code. | **DONE 2026-05-29** (Session 17, Qualitastic) |
| **Assoc editor on all 34 Dashboard cards (#191)** | The 7 orphans don't render in the Workplan Goals tab, so the #190 editor couldn't reach them. Extracted the popover into a **shared `assoc_editor.js`** module (ONE delegated `document` click listener, `_hasListener`-guarded) and wired it onto **all 34 project cards** in the Dashboard Projects Grid — card assoc data sourced from the **associations table joined to the full projects list** (covers 5.2–5.8, which aren't in `workplan_goals`). `workplan_goals.js` refactored to delegate (**−441 lines**, no duplicate popover; the "two popovers open at once" trap avoided). Reuses `.wpg-assoc-*` CSS; graceful on Supabase outage (backfilled chips). Sub-agent-built, **hard-reviewed** (both surfaces + hostile-input + 3× idempotency + Rule 4). | **DONE 2026-05-29** (PR #191, Session 17, Qualitastic) |
| **akpi / CPL_DATA XSS hardening (#192)** | Closed a **pre-existing stored-XSS sink** surfaced (and confirmed via injection) during the #191 review: Activity-KPI cards rendered curator-editable project/activity/goal names **unescaped**, and the inline `window.CPL_DATA` `<script>` blob could **break out via a name containing `</script>`**. Fix: `html_escape(quote=True)` on the akpi HTML sites + new **`_js_safe_json()`** (neutralizes `<`/`>`/`&`/U+2028/9 → `\uXXXX` in the JSON; `JSON.parse` decodes back → client data byte-identical) on both `window.CPL_DATA` emissions. Hostile-input injection: raw leaks **3+2 → 0**. Generator-only diff (Rule 1). Third confirming instance of `methodology-xss-audit-on-curator-editable-fields` — adds the **inline-JSON-in-`<script>`** injection class. | **DONE 2026-05-29** (PR #192, Session 17, Qualitastic) |
| **Over-merge re-mint (Session 18)** | Cross-discipline over-merge cleanup of the CCR. **`member_top_divergence` auditor rule** (PR #194, 1,299 flags — M-ID members span ≥2 two-digit TOP divisions, ≥30% minority; 736 invisible to prior rules; the cross-discipline over-merge detector). Then a Rule-7 re-mint that **splits** each flagged M-ID into discipline-pure pieces: **dry-run** `kb/_overmerge_dryrun.py` (all 4 gates green) + **apply** `kb/_overmerge_apply.py` + `_supabase.py` + `.github/workflows/overmerge-apply.yml` (STAGED, dispatch-only, V1–V4 + FRESH-READ + idempotent). 60% of flagged "corroborated" M-IDs de-corroborate on split (phantom title-collisions). **Split brain redesigned twice from Sam's review** (TOP-only → title/subject/description-aware): iter-1 cascade (SUBJ4→subject→TOP→description, raw-subject fallback) + curator **title→discipline keep-whole map** (`kb/overmerge_title_discipline.json`) + container-by-subject → blank-piece rate **51%→38.6%**; iter-2 description-similarity keep-vs-split (Jaccard 0.55 → **36.3%**). Two re-mint invariants learned (id-prefix==SUBJ4 re-key; control-number atomicity) → `docs/kb-notes/methodology-remint-split-invariants.md`. Full state: `docs/overmerge_remint_lessons.md` + scope `docs/kb-notes/over-merge-remint-scope.md`. **Apply gated on Sam's final preview review** (he dispatches). Backlog: SUBJ4-curation→CCR cascade; 341 SUBJ4→discipline blank-backfill. | **DONE + MERGED to main** (PR #194, squash `340d753`, 2026-05-30); split iter-1 + iter-2 DONE; apply STAGED + gated on Sam's dispatch (Session 18) |
| **CCR cluster dissolution (Session 19)** | Retired the **1,385 auto-seeded `UC-XXXXX` variant-unification clusters** (`coci_unified_courses.json` `clusters` → `{}`, archived). They token-sorted titles (collapsing distinct levels, e.g. "Algebra 1: Part 2" == "Algebra 2: Part 1"), were never curator-reviewed, double-emitted members as Stand-Alone, carried 0 articulations — superseded by the level-safe Suggested-merges worklist. The **9 already-curated clusters migrated to per-member `merge_into`** (Supabase `kb_curation` + `coci_curation.json`) FIRST so no decision was lost — measure-first found 16/17 per-member equivalents already existed, so the migration was 1 INSERT (`PHYS M11WB→PHYS M1265`) + 9 DELETEs; side-benefit cleared 9 `cluster_member_unresolved` findings. CCR `id_system: Cluster` rows: ~1,376 → **0** — the category is RETIRED. **Then relabelled the merge-target path** (same session): native-identity targets (M-ID/C-ID/CCN) keep their `id_system` + `kind:"Course"` (an M-ID gaining members is still that M-ID; 9 rows), and synthetic `UC-CUR-*` targets get the new `id_system/kind: "Unified"` (1 row, grows with singleton-only merges). Touched the generator `_target_identity()`, `unified_courses.js` (Kind/Source/QS/triage labels + `doConsolidate` live-merge mirror), and the auditor (`row_kind/id_system → "Unified"`; tag *keys* stay `cluster_*`). Generator + auditor regenerated + verified in isolation (0 Cluster anywhere). Full rule in the "Cluster category RETIRED" note above; lessons `docs/ccr_cluster_cleanup_lessons.md`; method `docs/kb-notes/methodology-retiring-an-auto-seeded-layer.md`. | **DONE** (Session 19, 2026-05-30) |
| **Dashboard cleanup + cross-disc accounting (Session 20)** | Two threads + rule changes. **Accounting (PR #198/#199):** 27 accounting M-IDs/singletons in a blank/Vocational slot → `Business` (Supabase `kb_curation` + overlay); 21 cross-disciplinary accounting courses cross-listed via the new **`cross_listed_disciplines`** `kb_curation` field; CCR anchors surface `discipline_provisional` (A); firewall-safe **`anchor_discipline_proposal`** propose-correction on locked anchors (B, excluded from `_apply_curation.py` FIELDS). **Dashboard cleanup (PR #201/#202/#204):** Common Subject Code → **Common Subjects Reference (CSR)**; Credential Reference → **Common Exhibit Reference (CER)** (CCR/CSR/CER family); full-width intros; blank quick-search; slim one-line header (CSS-only); CCR table economize; **SUBJ filter on CCR+CSR**; fixed CER blank-on-expand bug (`renderExpandedRow` undeclared tr/td/div); **#6 Exhibit Adoption & Credit Recommendations → its own `#tab-exhibit-adoption`** (out of CPL Analytics — generator no longer emits the mount; static container in the new pane). **Rule changes (PR #200/#201/#203):** checkpoint refreshes pipeline-viz + writes the handoff EVERY time; auto-merge needs no Sam review (green CI is the gate); merge promptly (never park a PR in draft). **Deferred → Session 21:** #1 Workplan tab (HIGH RISK — its marker is the end-anchor for 4 generator ops; sentinel-marker plan in `docs/kb-notes/playbook-move-generated-section-to-tab.md`), #2 sidebar sub-links, #3 MID/CID/CCNID **cosmetic** sweep (preserve the 224 `M-ID ACCT 100` anchor keys; CCN-ID→CCNID). Backlog: KPI-card sort-order, dark mode (phased), tab-surgery Skill, full Excel retirement. Lessons: `docs/dashboard_cleanup_lessons.md`. | **DONE** (Session 20, 2026-05-30) |
| **Workplan → own tab (#1, Session 22)** | The deferred HIGH-RISK page move: **Workplan Activities & Projects** (Activity Metrics + Filter Bar + Projects Grid) moved OUT of the Dashboard tab into its own top-level **"Activities & Projects"** tab (`#tab-activities-projects`). Hard-case playbook executed: a permanent **`<!-- ═══ Dashboard Sections End ═══ -->` sentinel** now stays in the Dashboard tab and the **4 generator end-anchor ops** (KPI Summary replace + MAP Articulation strip + CPL Analytics strip + CPL Analytics insert) re-anchor on it; the section's inner anchors (`Filter Bar`/`Projects Grid`/`activityKpiSection`) travelled with the content so Ops 5/6/7 relocate via `html.find()`. **Verified by running `excel_to_dashboard.py` locally twice** (pip-installed openpyxl/pandas, snapshot fallbacks — no Supabase key): all 7 ops fire, **idempotent** (only timestamp/whitespace diffs), correct pane placement, marker counts = 1 (no gobble). Shipped structure-only HTML (no data churn). Label "Activities & Projects" (distinct from "Annual Workplan Goals") — Sam approved. §6b + §7b updated. **Next: #2 sidebar sub-links now UNBLOCKED** (depends on the final tab layout). | **DONE + MERGED** (PR #206, Session 22, 2026-05-31) |
| **Cleanup close-out + Excel PR-1 (Session 23, Bruh 23)** | Cleared the last two Session-20 carryover items + started Excel retirement. **#2 sidebar sub-links (PR #208):** `data-sections` expanded on the two genuinely multi-section panes — Activities & Projects (Activity Metrics `#activityKpiSection` + Projects `#projectsGrid`, pure static edit) and Budget (5-Year Funding/Expenditure/Personnel; 4 stable `id`s added to the generator's budget divs + hand-applied). Verified via local regen (ids land, data-sections survive, idempotent). **#3 MID/CID/CCNID (PR #209):** chose **display-only** (Sam's call) over the data-value rename — `idSysLabel`/`id_sys_label` maps the value at ~9 render sites (CCR Source filter/modal/badges/Unify, CER badge, Articulations-by-Course chips); stored value + keys untouched. **Excel retirement scope (PR #210)** + **PR-1 keystone (PR #211):** KPI ladder repointed Excel→`workplan_goals`, parity-exact (0 diffs/49 projects); the blank-vs-0 crux was exactly 11 cells, fixed live in Supabase (1.4's real 0s kept). Lessons: `docs/dashboard_cleanup_lessons.md` + `docs/excel_to_supabase_lessons.md`. | **DONE + MERGED** (PRs #208/#209/#210/#211, Session 23, 2026-05-31) |
| **CPL Assistant chatbot tab (Phase 1, Session 26)** | The live map.rccd.edu RAG chatbox brought into the dashboard as its own top-level **CPL Assistant** tab (`#tab-chatbot`). **Backend (PR #230):** captured the live `cpl-chat` Edge Function source into `chatbox/supabase/functions/cpl-chat/index.ts` + added `https://cpl-initiative.github.io` to `ALLOWED_ORIGINS`; **redeployed v13 → v14** via Supabase MCP `deploy_edge_function`, **`verify_jwt:false` preserved** (captured v13 first for rollback). **Front-end (PR #230):** self-contained `cpl_chat.js` (SSE reader `sources`→`text` deltas→`done`; markdown-lite, escape-FIRST XSS safety; `crypto.randomUUID` session; starter chips; 429/offline handling) + `#tab-chatbot` nav/pane/script + CSS in `EXHIBIT_ANALYSIS_CSS` (Rule 1/2) + `quickstart.js` TABS row (router lands "ask"/"what is" prompts here) + Rule-4 mirror to `index.html`. **Also Session 26:** generator whitespace-accretion idempotency fixes IDEM-1..5 (PR #231) + 2 inline-`<script>` `</script>`-breakout hardenings SEC-4/5 (PR #232), both from the Session-26 codebase audit (PR #229, 51 findings). Backend is **SHARED + LIVE** (a redeploy hits the map.rccd.edu widget too) → §7c operational invariants. Sam confirmed: "Works fantastically!" **Next:** Phase 2 (re-point content CPLBrain → `cpl-knowledge-base`), Phase 3 (Student Portal embed). | **DONE + LIVE (v14)** (Session 26, 2026-06-01) |
| 3 | EACR interactive re-pivot to course-identity grouping (Approach B per §9) | **DONE 2026-05-26** (Session 8, Octaman — see Exhibit-canon PR-C0/C0b/C1/C2/C2-hotfix rows above) |

---

## Archived session narratives (Sessions 26-31)

The Session-25 strategic queue and the most-recent session narrative stayed in
CLAUDE.md; Sessions 26-31 "what shipped" narratives live here.

### Session 26 — codebase audit + remediation (Bruh 26, shipped 2026-06-01)

Ran strategic-queue **item 1 (codebase audit)** as a 6-subagent fan-out (`/workflow`
isn't available in this env — ran it via parallel `Agent`s) + parent verification →
**51 findings**, catalogued in
[`docs/kb-notes/reference-codebase-audit-2026-06-01.md`](docs/kb-notes/reference-codebase-audit-2026-06-01.md)
(PR #229). Sam green-lit fixes; shipped this session (all merged):

- 🔴 **SEC-10 — student PII committed to the PUBLIC repo** (≈48k names, ≈30k IDs,
  ≈22.8k birthdates in `CustomReport_latest.json`, re-committed daily). **Forward-stop
  MERGED (PR #227):** gitignore + `git rm --cached` + dropped the workflow `git add` +
  trimmed the 4 unused student-identity columns from `fetch_custom_report.py` (kept
  `MAP Internal StudentID` — aggregate-only). **History purge DONE** (Sam executed
  2026-06-01: `git filter-repo` + force-push to main [.git 385→248 MB] + deleted the merged
  session branches + closed PR #238; runbook
  [`docs/kb-notes/playbook-pii-history-purge.md`](docs/kb-notes/playbook-pii-history-purge.md)).
  The data is out of main AND its history. **Do NOT re-add the trimmed PII columns to the
  fetch.** (PR #238's cheat-sheet feature was re-created clean on the rewritten main in #239.)
- **Idempotency IDEM-1–5 (PR #231):** fixed 4 live whitespace-accretion inject sites
  (refresh button, PROJ-INFO, Vision 2030, the Annual-Workplan-Goals 446-char mega-line)
  + hardened the ALGO_DETAILS_CSS strip with an End marker. Verified by triple regen
  (8-space cruft 329→275, stable). **IDEM-6 NOT done** (CLAUDE.md §6a requires keeping
  the legacy "MAP Exhibit Analysis Cards" stripper). **IDEM-7 (NEW, QUEUED):** a separate
  pre-existing empty-line accretion (+3–4/run) at the EXHIBIT_ANALYSIS_CSS guard +
  CPL-Analytics-HTML inject — deferred so as not to bundle a change to the Rule-2 guard.
- **SEC-4/5 (PR #232):** routed `window.CPL_KB` + `window.COLLEGE_ACTIVITY_DATA`/
  `_DISCIPLINE_DETAIL` inline `<script>` blobs through `_js_safe_json` (`</script>`-breakout).
- **SEC-1/2/3 worker hardening (PR #233):** exact-match CORS (closes the `*.evil.com`
  `startsWith` bypass), origin gate + 256 KB body cap on the `POST /` open Anthropic
  proxy, origin gate on `/trigger`. **⚠ NEEDS Sam's Cloudflare redeploy + WAF rate-limit
  rules** to take effect (the repo file isn't auto-deployed; rate-limiting is the real
  backstop for forged-Origin `curl` abuse). `/scrape` left ungated (server-side caller).

**All Session-26 green-lit fixes shipped** — BUG-1 (quickstart project-nav) landed in PR #235
(added the missing `activities-projects` entry to quickstart's router + moved HINT_VOCAB /
routing / `dashboard_filters.js` selector+consumer there). **Pending Sam-actions (guided
2026-06-01):** (1) PII **history force-push** (runbook:
[`docs/kb-notes/playbook-pii-history-purge.md`](docs/kb-notes/playbook-pii-history-purge.md)),
(2) **Cloudflare worker redeploy + WAF rate-limit** (PR #233 is inert until redeployed),
(3) repo **"Allow auto-merge"** toggle. **Queued for Session 27** (green-lit, not yet built):
**BUG-2** (quickstart Cluster→Unified vocab desync), **IDEM-7** (empty-line accretion at the
EXHIBIT_ANALYSIS_CSS Rule-2 guard), the rest of the audit menu, and strategic-queue
**items 2–6** (KPI reorder, student-eligibility counts [privacy ADR first], contacts panel,
EACR↔CER convergence, project→activity consolidation) + sidebar levels. Full ranked menu in
the audit KB-note. Pipeline viz correctly SKIPPED (no M-ID pipeline change this session).

### Session 27 — EACR consolidation + master-detail gallery (shipped 2026-06-01)

Ran strategic-queue **item 7** end-to-end from Sam's live EACR screenshot review —
the exhibit-adoption surface (NOT the M-ID pipeline; all consumer/generator, no
re-mint). Shipped + merged:

- **PR-1 (#244)** — credit-rec consolidation: `buildCreditRecsHtml()` (in
  `statewide_interactive.js`) groups recs by `(course title, units)` with local
  codes inline + a **"💡 Typical CPL: ~N units (range a–b) · not the sum"**
  headline. Also fixed the "undefined (N)" Issuing-Agency filter-button label.
- **Sort (#245)** — cluster a credential's variants together (CompTIA A+ was
  scattered) + **sink the 105 unclassified cards (4%) to the bottom**. Consumer-side.
- **PR-2 (#246)** — **merge Local + CCC into one card** (CCC top billing): dropped
  `Collaborative Type` from the EACR group key; `_parse_exhibits()` (the "MAP
  Exhibits" KPI) moved in **lockstep** on the same key. **Generator** change,
  verified live on the next regen: **2,456 → 2,406 cards**, CompTIA A+ 4→2, merged
  CCC card unions to 21 adopters. `cpl_type` kept in the key.
- **PR-3 (#249)** — **master-detail "Credential view" (v2)** as the first entry in
  the **versioned gallery**: v1 = the existing adoption table (preserved,
  collapsible); v2 = one card per credential (`unified_title`+issuer), CCC version
  as the standard on top (or a synthesized **⚙ Suggested standard** for the ~94%
  no-CCC case), other CPL-Type/collab variants sub-listed. Reuses PR-1; additive
  (v2 behind a collapsed `<details>`). 2,406 cards → 2,114 credential cards.
- **MAP-auth pre-stage + spec sheet (#248)** — MAP is adding user auth to the
  Custom Report Builder that `fetch_custom_report.py` hits **unauthenticated**.
  Pre-staged an optional `MAP_API_KEY` header (no-op until the secret is set;
  Bearer/APIM/x-api-key). Teams spec sheet + activation steps at
  [`docs/map_api_auth_handoff.md`](docs/map_api_auth_handoff.md) (Sam sent it to
  MAP). **Second host** (`cpldashboardcccco.../potential-savings`, the KPI scrape)
  flagged for the same treatment.

**Decision evolved:** locked decision #1 ("keep CPL Type separate") was **revised**
mid-run — Sam wants CPL Type as a tag, not a card-splitter (the v2 master-detail
delivers that visually; a full producer-side `cpl_type`-drop merge is the captured
"full credential merge" backlog item).

**Backlog captured** (`docs/kb-notes/eacr-consolidation-scope.md`): full credential
merge (CPL Type as tag), **CCR inverse view** (one row per course → aligned
exhibits), **CSR rollup** (one row per discipline → CPL opportunities, for faculty),
curate-the-unclassified (CER triage), per-group college counts, a mojibake-em-dash
data nit. **Next: PR-4 — the prescriptive layer** (per potential-adopter college,
the recommended local course; turns `adoption_leverage` into "here's how to adopt")
+ then the 3 audience views (Student/College/System) as further gallery renderers.
Lessons: [`docs/eacr_consolidation_lessons.md`](docs/eacr_consolidation_lessons.md).

### Session 28 — EACR PR-4 prescriptive layer + v2-toggle fix (shipped 2026-06-01)

Cleared Session 27's carryover (the v2-toggle bug) + shipped the priority build
(PR-4), both merged:

- **v2-toggle fix (#252)** — the EACR "🎓 Credential view" `<details>` wouldn't
  expand: its native marker was hidden for styling (no affordance) and the
  summary's native toggle could be swallowed by a stacking/overflow quirk in the
  v1 table. Robust consumer fix in `statewide_interactive.js`: a visible `::before`
  chevron (rotates when `[open]`) + a delegated JS toggle on `.sw-gallery-sum` with
  `preventDefault()` so the native toggle can't race ours. Scoped to the gallery
  summaries only (nested `algo-details`/`sw-also-entered` keep native behavior).
  Verified by a jsdom test (12 assertions). Method note:
  [`docs/kb-notes/methodology-styling-native-details-toggle.md`](docs/kb-notes/methodology-styling-native-details-toggle.md).
- **PR-4 — prescriptive layer (#253)** — turns the v2 card from "who could adopt"
  into "here's the **specific local course** to articulate." **Producer-side**
  (the consumer has no `course_id`): new `_build_statewide_prescriptive()` joins
  `kb/coci_articulations.json` (`adoption_leverage` = leverage college NAMES) ⨝
  `kb/coci_minted_memberships.json` (`{college, subject, course_number, units}` per
  M-ID `course_id`) on `course_id`, **aggregated by `unified_title`** (one
  credential fans to many M-IDs — CompTIA A+ → ~24). Emits a new committed lazy
  file **`statewide_prescriptive.js`** (`window.CPL_STATEWIDE_PRESCRIPTIVE`); the
  consumer's `buildPrescriptiveHtml()` renders a collapsible per-card block.
  **Numbers: 806 credentials, 5,235 (title,college) recs, 4,538 withheld; 100% of
  prescriptive keys match an EACR card (0 orphans).** **Guardrails (§6a):**
  over-merged leverage is WITHHELD (counted, never emitted — a college still
  surfaces via a CLEAN M-ID); lossy `(subject,number)` key → recs labelled
  "likely"; **M-ID leverage only** (~100% resolves; C-ID's 30.4k slots deferred —
  keyed by CIDNumber in the 24 MB raw xlsx). **In-session test:**
  `kb/_verify_prescriptive_join.py` (join + over-merge invariant + the documented
  **CNST M1029 → Rio Hondo CARP 050T** spot-check) + a jsdom render test (13
  assertions). The producer is idempotent (regen byte-identical) and the inline
  write matches the committed file char-for-char (daily regen = no-op diff).
  Added to the daily-workflow `git add`; `index.html == CPL_Dashboard.html` (Rule 4).

**Patterns reused:** consumer-side for the toggle fix (live on merge);
producer-side for the join (keyed by the consumer's group key, materializes on
merge via the committed file + HTML `<script>` tag); standalone verify script for a
regen-untestable producer change. **Next: the 3 audience views** (Student/College/
System) + the backlog. Lessons:
[`docs/eacr_consolidation_lessons.md`](docs/eacr_consolidation_lessons.md).

### Session 29 — three grains complete + EACR/CER enrichment (shipped 2026-06-02, "Two-Niner")

Resumed after a bricked/parallel-session scare; **opened with a diagnostic** — the
"missing work" was a **stale `origin/main` ref** (the first `git fetch origin main
<branch>` aborted on a non-existent remote branch, so the tracking ref never updated;
a clean `git fetch origin main` forced-updated it and divergence collapsed to `0 0`).
The frozen Session 28 + recovery session had already self-healed (dup PRs #255/#257
closed, new work landed as #258). Then shipped **4 PRs, all merged + live**:

- **#259 CCR inverse view** — mirror of the EACR: expand a CCR row → all aligned
  exhibits/credentials that articulate to that course. `_build_aligned_exhibits_by_course()`
  pivots `coci_articulations.json` by `course_id` → committed lazy file
  `unified_courses_aligned.js` (`window.CPL_UC_ALIGNED`, 2,355 courses; in the daily
  git-add + the §"lazy files" table). Consumer renders "🎓 N aligned …" in the existing
  CCR row-expand (reuses `.uc-member-table`, unions Phase-B `consolidated_from`). jsdom 13/13.
- **#260 CSR rollup** — discipline grain: a sortable **"CPL opportunities"** column on
  the Common Subjects Reference tab + a credential-list modal. `_build_cpl_by_discipline()`
  rolls articulations up by discipline (discipline sourced from the minted catalogs —
  the articulations' `identities` map keys only ~381/2,355 re-minted course_ids) →
  committed `kb/discipline_cpl_rollup.json` (97 disciplines; in the daily git-add).
  jsdom 12/12. **Completes the "same data, three grains" family — CER/EACR (credential)
  · CCR (course) · CSR (discipline).**
- **#261 EACR filter lift + darker titles** — the v1/v2 gallery filters were *inside*
  the v1 `<details>` (hidden on collapse, unshared). Lifted search + filters to a
  page-level dark bar above the whole gallery (every view shares `state.filters` /
  `getFiltered()`); darkened `.sw-gallery-sum` from gold `#C9A84C` (washed out on the
  light page) → navy `#0A2240`. Consumer-only (`statewide_interactive.js`). jsdom 13/13.
- **#262 CER enrichment** — per credential's expanded detail (between curation header
  and the identities table): **scope chips** (🏛 CCC + 🏠 Local both when both;
  "⚙ CCC Generated · consideration only" when only Local), **CPL-type chips**, the
  **statewide standard** rec (modal CCC) or a **generated** suggestion (modal across all,
  labeled NOT official per §11), and **green (articulated) / orange (potential, from
  `adoption_leverage`, over-merge-withheld)** college badges + "+N more".
  `export_credential_reference()` emits 5 new fields (`has_local`, `cpl_types`,
  `ccc_rec`, `gen_rec`, `potential_colleges`); consumer `renderScopeAndBadges()` (Rule-4-safe,
  CSS injected from JS). jsdom 17/17.

**Patterns / learnings (this session):** (1) **CER producer regenerates from committed
inputs → shipped live-on-merge** (regen `credential_reference_data.js` locally + commit;
unlike EACR's `statewide_data.js`, which needs the raw MAP pull → next-cron). New KB note
`methodology-ship-generator-changes-live-on-merge.md`. (2) **Consumer adapters whitelist**
— new producer fields are dropped at the consumer until added to `adaptBakedRow`. (3)
**The daily cron is a mid-flight merge hazard** for generated files — #262 went `dirty`;
fix = rebase onto main, re-run the producer to regenerate, verify additive-only,
force-push. (4) **jsdom-test the real consumer** with a minimal fixture + stubbed fetch.

**Carryover / next:** CER unclassified-triage (the original ask) · EACR v2 version of the
scope/generated-rec treatment (producer-side → next cron) · MID curation passes (CompTIA
A+ fragmentation → Suggested-merges worklist) · the 3 audience views (Student first;
System needs a privacy ADR). Pipeline viz correctly SKIPPED — no M-ID pipeline movement.

### Session 30 — college short-names + CER economize + unclassified-triage worklist (shipped 2026-06-02)

Opened with a **curator dataset add** (Sam's ask), then cleared CER polish + started the
queue's CER triage. **4 PRs merged.** None touched the M-ID pipeline → pipeline viz skipped.

- **#264 College short-name dataset + chip resolver** — Sam supplied a 118-row
  CollegeName→short-name table to shrink the college chips. `kb/_seed_college_short_names.py`
  (one-shot, idempotent) emits the KB source-of-truth `kb/college_short_names.json` +
  the on-page `college_short_names.js` (`window.CPL_COLLEGE_SHORT` + `window.cplCollegeShort(name[,style])`
  resolver: exact → **normalized** fallback that folds funding suffixes (Credit/Non-Credit),
  Community/Junior, the `Cañada`/`Canada`/mojibake-`CaÃ±ada` trio, and the West Hills→Coalinga/Lemoore
  rename — one short per campus across every spelling). `<script>`-loaded in both HTMLs;
  CCR/EACR/CER chips wired via a lazy `SHORT()` helper. **Title Case** default (both casings
  stored). Storage = **committed, NOT Supabase** (static reference data — like `college_lookup.js`).
  Re-verified this session: seed re-runs **byte-identical** (sound), 122/123 chip names resolve
  (the 1 miss is a junk `CA MAP INITIATIVE COLLEGE` placeholder, safe full-name fallback).
  Reference note: `docs/kb-notes/reference-college-short-names.md`.
- **#265 CER economize (cosmetic, consumer-only `credential_reference.js`)** — 4 curator asks:
  (1) the per-row **Curate** panel is now behind a collapsed `✎ Curate` button (persists in
  `state.curateOpen`); (2) the unclear **"Scope" column was folded into title-level chips**
  (compact 🏛 CCC / 🏠 Local / ⚙ Generated + CPL-type under each unified title; column 12→11);
  (3) **common-course identity rows collapse to ONE row per identity** (was rowspan'd per local
  course — local codes inline w/ titles on hover, colleges a deduped short-name union); (4)
  **Unified Title left-justified**. New CSS via the JS-injected `cr-scope-css` (no HTML edit).
  jsdom 20/20.
- **#266 CER unclassified-triage worklist (PR-1)** — the original "CER triage" ask. A
  `⚠ Triage unclassified (N)` toolbar button opens a worklist over the **194 raw MAP exhibit
  titles** the exhibit auditor flagged `unclassified_in_map` (no `unified_titles.json` entry).
  Lazily fetches the committed audit snapshot `kb/exhibit_audit/latest.json` (no producer/cron
  change). Each row: raw title + assign-unified-title input (datalist typeahead over the 1,969
  existing credentials, or type new) + optional issuer + Save. Writes to Supabase `kb_curation`
  under a new **`_UNCLASSIFIED::<raw_title>`** namespace (`unified_title_assignment` /
  `issuing_agency_assignment`) — **no schema migration** (generic course_id/field/value table).
  In-place row updates on save (unsaved sibling input preserved); progress counter; clear.
  Overlay-only display (mirrors the original CER PR-B MVP). jsdom 18/18.
- **#267 unclassified-triage daily sync (PR-2)** — `kb/_apply_unclassified_triage.py` folds the
  `_UNCLASSIFIED::` rows into the git-canonical overlay `kb/unclassified_assignments.json`
  (mirrors `_apply_credential_review.py`; idempotent — no rewrite when unchanged → no empty-overlay
  daily churn). Wired into the daily "Sync curation overlay" step (guarded on `SUPABASE_SERVICE_KEY`)
  + git-add. Synthetic-tested 9/9.

**Patterns / learnings:** (1) **`kb_curation` synthesized-namespace** = add a whole curation
surface with ZERO schema migration — new `course_id` prefix + `field` values on the generic
`(course_id, field, value)` table. Now used 4× (`_CREDENTIAL_REVIEW`, `_CANON_SUBJ4`, `_EACR_FLAG`,
`_UNCLASSIFIED`). New KB note `methodology-kb-curation-synthesized-namespace.md`. (2) **Runtime-fetch
a committed snapshot** to drive a worklist (audit `latest.json`) — single-file, no producer/cron
coupling, good for an MVP. (3) **In-place DOM row updates** beat full re-render when a save mustn't
wipe sibling unsaved input. (4) **jsdom needs a `url:`** option or `sessionStorage` throws
`SecurityError: opaque origin`. (5) **Reusing the one session branch** after each squash-merge =
`git reset --hard origin/main` then **`git push --force-with-lease`** (the remote branch still points
at the pre-squash head — non-fast-forward is expected).

**CER triage PR-3 — the FOLD — DONE (#270) + tire-kick (#269).** `kb/_fold_unclassified.py`
(dry-run-first, V-gates V1–V4) folds confirmed `unclassified_assignments.json` entries into
`kb/unified_titles.json` (+ `credentials.json` if missing) and PRUNES `kb/exhibit_audit/latest.json`
(the worklist's source — the exhibit auditor isn't in the daily cron + needs the purged CustomReport)
in the auditor's minified format. Idempotent: already-classified→SKIP, different-target→CONFLICT
(rejected); detects + blocks `coci_articulations.json` ripples (V4). First real run (3 tire-kick
assignments entered live as `map@rccd.edu`, RLS write-gate confirmed): 2 CLEAN adds (CompTIA Linux+,
NCCER Welding Level 1), 1 SKIP (Azure Admin — stale audit flag), `unified_titles` 3274→3276,
`unclassified_in_map` 194→192, 0 credential adds, 0 ripples. **The CER unclassified-triage loop is
COMPLETE end-to-end** (worklist #266 → sync #267 → assign #269 → fold #270). The CER baked payload
surfaces folded titles as raw variants under existing credential rows on the next daily cron.

**CER triage — 125 of 194 cleared (#272 + #273), backlog 194→67.** Two vetted batches of
"duplicate raw spelling → EXISTING credential" folds (53 exact-normalized + 71 fuzzy-≥0.72,
both hand-reviewed with an exclude-list for level/subscore/bundle traps): real worklist
assignments (Supabase `_UNCLASSIFIED::`, `map@rccd.edu`) → overlay → `kb/_fold_unclassified.py`.
The **V4 articulation-ripple gate caught 3 punctuation-variant duplicate credentials** (KB carries
the same credential twice, e.g. `History of Architecture I` vs `1`) → re-assigned to the
articulation's spelling. Method: surface candidates by exact/fuzzy normalized match to existing
credentials, hand-vet, batch-insert, fold (SKIP already-classified, CONFLICT-block mismatches).

**Carryover / next:** the remaining **67** are the LONG TAIL — **~50 need a NEW credential
created** (new `unified_title` + issuer, not a fold-into-existing) → the `exhibit-canonicalization`
skill's domain (heavier, per-item judgment); the rest are genuinely ambiguous (AP Calculus AB/BC
subscores, bare "Automotive", mismatched cert bundles). Then the rest of the Session-30 queue: the
**3 audience views** (Student/College/System — System needs a privacy ADR), **EACR v2**
scope/generated-rec (producer-side → next cron), **MID curation** (CompTIA A+ fragmentation →
Suggested-merges worklist).

### Session 31 — CER triage tail cleared (67 → 5) + CER row/column economy (shipped 2026-06-03)

Finished the CER unclassified-triage loop the long way down and economized the CER
tab from Sam's live screenshot review. **7 PRs merged**; none touched the M-ID
pipeline (pipeline viz correctly skipped).

- **#276 CER row consolidation** (consumer-only `credential_reference.js`) — dropped
  the duplicate scope/CPL chips from the row body (they live at the title level since
  Session 30) + moved the per-row **✎ Curate** affordance into the Action cell.
- **#278 CER economy pass** (consumer-only) — merged the two **Confidence** columns
  (title + issuer) into one and folded the **Initiated** stamp into the Action cell:
  **11 → 9 columns**. Cosmetic; no producer/data change.
- **CER unclassified-triage, backlog 67 → 5** across five folds:
  - **#277** fold 30 (67→38) · **#279** fold 18 (38→20) — both the safe "duplicate raw
    spelling → existing credential" class (exact-normalized + fuzzy ≥0.72, hand-vetted).
  - **#280 Option A** (20→16) — the 4 raws whose fold tripped the **V4 articulation
    ripple gate** because the articulation layer used a *different valid spelling* of the
    target credential. Fix: **adopt the articulation's spelling** (re-point the raw to the
    credential string the article rows already inline) → 0 ripple, both spellings valid.
  - **#281 group A** (16→8) — 8 bare-course-code local exhibits (`AUTO 050`, `WELD 100`,
    …) given best-judgment unified titles + local-college issuers (no existing credential
    to fold into; small new-credential adds).
  - **#282 group C** (8→5) — Sam's 3 module-vs-cert judgment calls: `POST - Peace Officer
    Standards and Training` → `POST Basic Academy` (clean fold) · `Credit by Exam AUTO A1
    Engine Repair` → `ASE A1 — Engine Repair` (clean fold) · **`Firefighter 1A
    Certification` kept DISTINCT** as a new `Firefighter 1A` module (issuer SFT), **not**
    folded into `Firefighter 1` — its **13 articulation rows re-pointed** `Firefighter 1`
    → `Firefighter 1A` so the 1A exhibit's articulations attribute to the distinct module.
- **16 articulation-layer desyncs repaired** along the way (ASE / Water Supply /
  Firefighter / Math / Culinary / Cinema rows) so those exhibits now attribute to the
  right credential in the EACR/CER/CCR-aligned views.

**The remaining 5 are un-classifiable by design** and left flagged: 3 bare `AUTO
600/601/602 Completion` rows (no content signal) + 2 generic buckets (`Automotive`,
`Inspection Portfolio Spring 2026 #1`). No defensible target.

**Patterns / learnings:** (1) **Three V4-ripple resolution strategies** for a CER fold
— clean-fold (article already uses the target spelling) / **adopt-the-article-spelling**
(two valid spellings of the same credential) / **re-point-the-article-rows** (minting a
DISTINCT credential: the exhibit's articulations move WITH it). New KB note
`methodology-cer-fold-articulation-ripple-sync.md`. (2) **The daily cron is a mid-flight
merge hazard for the overlay** — #282 went `dirty` against `kb/unclassified_assignments.json`
(the cron's Supabase sync rewrote it). Fix per the established playbook: rebase onto main,
take main's cron-synced overlay (authoritative Supabase state), re-add only the entries
inserted *after* the cron ran (group C, since the cron synced pre-19:32), `--continue`,
force-push. (3) **A V4 ripple often means "two valid spellings," not "wrong"** — align to
the articulation layer rather than overwriting it.

**Carryover / next** (unchanged from Session 30, minus the cleared CER tail): the remaining
**5** CER unclassifieds are intentionally left; the broader long-tail CER work (~50 NEW
credentials to mint) is the `exhibit-canonicalization` skill's per-item domain, not batch
work. Then the rest of the queue: the **3 audience views** (Student/College/System — System
needs a privacy ADR), **EACR v2** scope/generated-rec (producer-side → next cron), **MID
curation** (CompTIA A+ fragmentation → Suggested-merges worklist).

---

## Archived session narratives (Sessions 32–40) — moved 2026-06-11 (Session 41)

Moved verbatim from CLAUDE.md §11 at the Session-41 checkpoint (policy: ≤2
session narratives stay inline). Each narrative carries its PR numbers, doc
links, and locked decisions — consult when carryover items or artifacts trace
back here.

### Session 32 — CER refinement pass + credential merge tool (shipped 2026-06-04)

Seven-item CER polish from Sam's live screenshot review of the **Common Exhibit
Reference** tab. All consumer/producer/KB — no M-ID pipeline movement (pipeline
viz correctly skipped). **3 PRs merged.**

- **#284 — the headline fixes (consumer `credential_reference.js` + producer
  `export_credential_reference()`):**
  - **Search + expand crash (items 2 & 7 — same root cause).** `passesFilter`
    called `row.raw_variants.some(...)`, but **baked rows carry `raw_variants:
    null`** (only the runtime-fetch fallback path populated it). The instant you
    typed in search, the first non-matching row threw a `TypeError` that aborted
    the whole `render()` — freezing **both** search AND every expand wedge ("expand
    stopped working after the first two" = they'd searched in between). One `|| []`
    guard fixes both; search now also matches `display_title` + the raw variants.
    Distilled as `methodology-consumer-tolerate-omitted-baked-fields.md`.
  - **Generated chips clarified (item 3).** The existing `⚙ Generated` chip was
    actually about the credit rec → relabeled **`⚙ Generated MID Credit Rec`**;
    added a new **`⚙ Generated Title`** chip on every AI-draft title (not yet
    curator-confirmed/renamed — Sam's pick: show on all AI-draft titles).
  - **CCR identities box (item 4).** Identity now on ONE line (title/disc/TOP as
    inline spans, not stacked divs); local courses read **`CODE Title (N units)`**;
    units **baked** (`u`) from singleton `typical_units` + corroborated-membership
    modal units (3393/4360 local lines resolve). Headers centered first (#284),
    then **flipped to left-align (#286)** at Sam's call (centered long one-liners
    read awkwardly).
  - **Audit signals moved up (item 5)** to sit directly under the
    Articulated/Potential section.
  - **Raw variants surfaced (item 6).** Baked a lean `raw_variants` list per
    credential; the expanded row lists the **college-entered exhibit titles** so a
    `Variants: 1` is explainable (one college title, may differ from the generated
    unified title). Verified with an ad-hoc jsdom test (20/20).
- **#285 — 10-Key consolidation (item 1) + reusable merge tool.** Diagnosis:
  "10-Key Data Entry" + "10-Key Numeric Data Entry" are the **same exhibit** (both
  `BIT 375 "10-Key on the Computer"`, Modesto JC, `CNSR M10AA`, same credit rec) —
  the classifier split them by CPL type. **There is NO CPL-Type rule in the CER to
  turn off** (it keys on `unified_title`, never CPL type); the split was baked into
  `unified_titles.json` as two AI titles → the fix is a credential **merge**, not a
  grouping change. New **`kb/_merge_credentials.py`** (dry-run + `--apply`, V1–V4
  gates, receipt) driven by curator decisions in **`kb/credential_merges.json`**:
  folds a `loser` unified_title into a `winner` across `unified_titles.json`
  (re-point raws), `credentials.json` (drop the orphan; winner authoritative), and
  `coci_articulations.json` (re-point the articulation). This is the **existing→
  existing** sibling of `_fold_unclassified.py` (unclassified→existing). Applied:
  "10-Key Data Entry" → `raw_count 2`, both CPL types, one identity row; the
  Numeric row gone (2014 → 2013). Playbook:
  [`docs/kb-notes/playbook-cer-credential-merge.md`](docs/kb-notes/playbook-cer-credential-merge.md).
- **#286 — CCR table left-align** (consumer CSS follow-up to item 4).

**Patterns / learnings:** (1) **CER producer ships live on merge** — I regenerate
`credential_reference_data.js` locally + commit, so the changes are live without
waiting for the cron (the regen also catches the baked file up to already-merged
Session-31 folds — Firefighter 1A etc.); idempotent → cron sees a no-op. (2) The
**baked-vs-fallback shape divergence** crash class (item 2/7) — a consumer must
guard any field the baked payload omits but the runtime path fills. (3) The
**CPL-type-duplicate class**: same exhibit entered under ≥2 CPL types → ≥2
near-duplicate AI titles; detectable as articulations sharing a `course_id` +
local course but differing `unified_title`. Offered Sam a detector for the rest.

**Carryover / next:** (1) **CPL-type-duplicate detector** — surface the rest of
the class for review (each merge = a one-line add to `credential_merges.json`).
(2) The Session-31 carryover stands: the **3 audience views** (Student/College/
System — System needs a privacy ADR), **EACR v2** scope/generated-rec
(producer-side → next cron), **MID curation** (CompTIA A+ → Suggested-merges), the
remaining **5** un-classifiable CER unclassifieds (left flagged), and the long-tail
~50 NEW-credential mints (`exhibit-canonicalization` skill domain).

### Session 33 — CLAUDE.md trim + the CER intelligence layer (shipped 2026-06-04, "Sleepy Goodall")

A marathon: the staged CLAUDE.md trim + a full CER prioritization/canonicalization
layer driven by Sam's live AP-card review + authoritative policy docs. **6 PRs, all
merged + live.** No M-ID pipeline movement → pipeline viz correctly skipped.

- **#291 — CLAUDE.md history→archive trim** (staged item [A]): 1908→1514 lines; 84
  DONE roadmap rows + Session 26-31 narratives → `docs/roadmap_archive.md` (pointers
  left inline). Kept: Critical Rules, full Pipeline Reference, §11 framing, open
  roadmap rows, Session-25 queue, most-recent narrative.
- **#292 — CER R1 noise suppression**: the "curious COMM" Sam flagged is a *systemic*
  pattern — `COMM M1038` "Group Communication" (Clovis) articulates to **61
  credentials**, all generic "Elective Course Credits." Producer flags **elective-
  bucket** identities (≈100%-elective recs + ≥5 credentials + ≤3 colleges → exactly
  COMM M1038) → consumer **demotes** them to a collapsed disclosure; **subject-outlier**
  identities get a visible review badge. (61 + 251 baked flags.)
- **#293/#294 — GE-Area exam-credit layer**: AP credit is **system-level** (AB 1985 /
  AA 17-20; IB+CLEP title 5 §55052.5) — the canonical anchor for an exam credential is
  its **GE Area + min units**, NOT a course-identity fold (course-to-course is a *local*
  decision). This **reframed the would-be "fold Western-Civ M-IDs into HIST 170/180" R2
  as the wrong layer.** New `kb/reference/ccc_ge_exam_credit.json` (AP+IB+CLEP from the
  current **ESLEI 24-35** charts; alias + char-prefix rules collapse the CER's legacy
  IB names) → per-row `ge_credit`; CER headlines the statewide credit. **147/154**
  exam credentials joined. The elective fallback in the policy *explains* #292's bucket.
- **#295 — GE-Area grain view**: a "Group: GE Area" mode (multi-bucket via new
  `groupKeysOf`) — the CER/CCR/CSR grain family's exam-credit rollup.
- **#296 — CER "Students" impact column** (path 1): per-credential **students served**
  = SUM of MAP `View_ArticulatedCollegeCourses.Students` rolled up `exhibit_id →
  unified_title`; sortable column to prioritize curation by reach. **Privacy ADR**
  (`docs/kb-notes/adr-cer-student-impact-counts-privacy.md`): aggregate-only, **small-
  cell suppression below 5** (Sam's threshold — 1-4 → "<5", exact never baked), test
  colleges excluded, volume-not-distinct. Cron-only data → no-ops locally, lights up on
  the daily pull; verified end-to-end via `kb/_verify_students_served.py`.
- **#298 — GE-Area coherence check** (recommended-order #3): a `discipline_ge_areas`
  map (MQ disc → CCC division[s]) baked as `disc_ge_areas`; consumer flags an
  articulated course whose discipline's division is disjoint from the exam's GE Area
  (`⚠ off GE Area`) + a callout note. **Audit finding:** post-#292 the data is already
  GE-coherent — 1 non-bucket residual (SOCI under AP Statistics); a future-proof cue.
- **#299 + the apply — CPL-type-duplicate detector** (recommended-order #4):
  read-only `kb/_detect_cpl_type_dupes.py` (Signal A = `&`/`and` + punctuation
  normalized-title collisions; Signal B = same-exhibit-different-phrasing leads,
  manual-review only). **Applied the 18 Signal-A groups (19 pairs)** via
  `credential_merges.json` + `_merge_credentials.py --apply` (V1-V4 green): the AP
  "Language & Culture"→"and Culture" family, ASE "& "→"and", AB-Subscore variants,
  Self-Defense, etc. CER rows **2013 → 1994**. (Winner = dominant record; Fire
  Service kept the `&` form as the established record — renamable later.)

Patterns reused: CER ships **live-on-merge** (producer regenerates from committed
inputs); **whitelist new baked fields in `adaptBakedRow`** (the Session-29 omitted-
field trap bit twice); jsdom-test the real consumer (now **6 CER test files, 77
assertions**). Lessons: `docs/eacr_consolidation_lessons.md` (Session 33). KB notes:
`reference-ap-credit-ge-area-canonicalization`, `adr-cer-student-impact-counts-privacy`.

**Carryover / next** (recommended-order #1-#4 ALL shipped): the **eligible** side of
student impact (needs an exhibit-keyed MAP eligibility export — only college×CPL-type
today); the **Signal-B dedup leads** (162, manual-review — `exhibit-canonicalization`
skill, semantic not lexical); the **3 audience views** (Student/College/System — System
needs the privacy ADR, now half-written); plus the standing Session-31/32 carryover
(EACR v2 scope/generated-rec, MID curation → Suggested-merges).

### Session 34 — Student view (v3) + the data-unblock loop + PII small-cell hardening (shipped 2026-06-04, "Lucid Wozniak")

EACR/CER/dashboard + PII session (no M-ID pipeline movement → pipeline viz correctly skipped). **5 PRs, all merged + live.**

- **#301 — EACR Student view (v3).** The first of the 3 audience views. A 3rd gallery
  renderer (v1 table / v2 credential / **v3 "🎒 Student view"**) over the same filtered +
  prescriptive data: pick a College/District/Region → each credential resolves to **✅
  available now** / **🎯 likely-qualify** (names the exact local course from
  `statewide_prescriptive.js`) / **○ aligned-program**, with a "you'd typically earn ~N
  units" headline; browse mode nudges to pick a college. Consumer-only, additive (v1/v2
  untouched). `tests/eacr_student.test.js` (27 assertions). **College + System views remain.**
- **#302 / #305 — CER students-served carry-forward + robust parse + diagnostics.** #302: a
  session live-on-merge regen runs without the PII CustomReport → was NULLing the public
  Students column on every CER ship (oscillating blank); now **carries forward** the last
  cron values when the report's absent (privacy-safe — only already-public/suppressed values).
  #305: robust `_to_count()` (int/float/comma/whitespace), strip the ExhibitID before the
  crosswalk join, normalized column lookup, + a detailed roll-up diagnostic line.
- **#303 — Header restyle.** Uniform meta row — every secondary header item to one
  font-size/family/weight/color (`var(--light-blue)`), vertically+horizontally centered,
  interactive items as consistent pills; **h1 untouched**. One scoped CSS block in the static
  `<style>` (survives regen; Rule 4 mirrored in both HTMLs).
- **#304 — PII small-cell hardening (the headline).** Per-college cohort counts
  (students/veterans/working-adults/apprentices) are now **`<2`-suppressed** (Sam's threshold
  — mask only a true singleton → `"<2"`; 2+ exact); the 34 existing singleton cells re-masked
  **live** in both HTMLs; **dropped `View_CollegeContacts` + `View_CollegeUsersRoles` from the
  fetch payload** (audit-confirmed unused → staff PII never lands on the runner, 9→7 views);
  new standing **`tests/pii_guard.test.js`** fails the build if any committed artifact carries
  a suppressible small count or an out-of-domain email. A read-only **PII audit** (subagent)
  confirmed the pipeline is **column-selective + aggregate-only** → the authenticated pull's
  new PII columns (names/DOB/StudentID) are never read or baked.
- **The data-unblock loop (Sam-driven).** Sam revised the MAP report PII-free + ran the daily
  workflow on `main` (I **can't** dispatch — the session's integration token 403s on `actions:
  write`). Verified safe end-to-end: per-college student/veteran data flowed + `<2`-suppressed +
  PII guard green + Rule 4 intact + no `NaN`. **The CER per-exhibit "Students" column is still
  `—`** — root cause confirmed (Sam): the per-exhibit count he wants is **students ELIGIBLE for
  CPL**, which is in **neither** the MAP dashboard nor the Custom Report. He's preparing a **new
  dataset**; the roll-up + suppression + carry-forward + column are ready to receive it (key on
  `ExhibitID` or credential, one count column, same `<5` suppression).

**Carryover / next:** (1) **Wire the new eligible-students-per-exhibit dataset** into the
existing roll-up when Sam sends it (decide replace-vs-alongside the served column). (2) **College
+ System audience views** (System still needs the privacy ADR finished — `adr-cer-student-impact-counts-privacy`
is the seed). (3) Standing: EACR v2 scope/generated-rec, MID curation → Suggested-merges, the
Signal-B dedup leads. **New practice this session:** small-cell-suppress *every* aggregate count on
a public surface + a committed PII guard test — `docs/kb-notes/methodology-standing-pii-guard.md`.

### Session 35 — CER identity consolidation (EMT 29→18) + the ordinal rule (shipped 2026-06-04)

From Sam's screenshot review of **EMT Certification** in the CER: the expanded
identity table showed **29 rows** for ~12 real courses (the EMT-Basic course
minted as a dozen single-college M-IDs). Asks: refine the CER — *why* are these
here, *why* don't near-identical M-IDs consolidate ("involves the CCR procedures
too"), collapse them, + widen the first column. All CER/CCR consumer/producer — no
M-ID pipeline movement (pipeline viz correctly skipped). **4 PRs, all merged.**

- **#307 — widen the CCR identity column.** HTML `<style>` capped `.cr-art-ident`
  at `max-width:32ch` under `table-layout:auto` → the longest column wrapped to
  5-6 lines. Switched to `table-layout:fixed` 42/40/18 in `ensureCerScopeCss()`
  (one static JS file → both HTMLs, no Rule-4 mirror). `tests/cer_arts_width.test.js`.
- **#308 — consolidate near-duplicate identities (headline).** `export_credential_reference()._consolidate_arts`
  folds same-course **M-ID/Unified** identities into one CER row at build time —
  **display only, no identity mutation, reversible**. EMT **29→18**; globally **94
  rows fold / 47 cards**, **0 of 72** merged groups suspect. `⛓ N variants` badge
  (folded ids in the tooltip). `tests/cer_consolidation.test.js` (15).
- **The two "why" answers:** courses are here because the CER reflects raw MAP
  faithfully (incl. an upstream miskey — `AUTO 156G "Engine"` mapped to an EMT
  exhibit, already subject-outlier-flagged → a signal to send upstream, not our
  bug). M-IDs don't consolidate because the worklist `_sug_sig` is *level-SAFE*
  (won't merge "Tech I"≠"Tech II") **and** `coci_articulations.json` is a static
  raw-M-ID artifact. Hence Sam's **"CER view + worklist"** + **"Core EMT-Basic
  only"** decisions (via AskUserQuestion).

**The ordinal rule** (reusable — `methodology-within-credential-identity-consolidation.md`):
`"1"/"I"` non-distinguishing (bare title == its "I"); `"2"+/"II"+` kept — folds
EMT-Basic while keeping **Calculus I≠II / Spanish 1≠2 / Paramedic 2/3/4** apart.
Traps: `len(w)<=1` letter-guard eats single-digit ordinals; exclude C-ID/CCN
anchors (blank titles); audit every merge for a shared substantive word.

- **#310 — the durable "+ worklist" half.** `export_unified_courses()` now surfaces
  the EMT-style clusters in the CCR Suggested-merges worklist via a **co-articulation
  family pass**: group mergeable M-IDs by `(subject prefix, _fam_key)` GATED on a
  shared credential in `coci_articulations.json` (29 groups, 0 cross-SUBJ4 — fixed an
  AUTO+AVIA early run; EMT's 9 live-mergeable M-IDs lead with the canonical `EMST
  M1064`). Consumer: a third worklist `_kind:"family"` reusing Confirm→`merge_into`.
  `_fam_key` factored to **module scope** (shared with #308; CER output byte-identical).
  Never auto-applies. `tests/uc_family_merges.test.js` (11).

**Carryover / next:** (1) **Re-key follow-on (open).** Confirmed worklist merges
propagate to the CCR + auditor but NOT to the static `coci_articulations.json`, so
the **EACR/CER articulation views won't reflect them** (beyond #308's view fold)
until a **Rule-7 re-key** — scope that project if Sam wants full propagation. (Also:
extend the family pass to single-college singletons, not just `rows` M-IDs.) (2) The
Session-34 carryover stands: eligible-students dataset wiring, College/System
audience views, EACR v2 scope, the Signal-B dedup leads.

### Session 36 — perf + cross-disc re-mint + the CER Eligible/Students columns (shipped 2026-06-09)

Three workstreams, **8 PRs merged**. No deep M-ID pipeline churn beyond the
cross-disc re-mint (pipeline viz refreshed: the re-mint card).

- **#314 PERF (Sam: "super fast"):** lazy-load ~17 MB of per-tab data
  (`unified_courses_data` 7.1 MB + `statewide_data` 6.6 MB +
  `credential_reference_data` 2.6 MB + `statewide_prescriptive`) only on first
  tab-open. `tabs.js` gained `onActivate`/`loadScript`; consumers boot lazily
  (defensive eager fallback when `CPL_TABS` absent); the generator stops
  eager-injecting the data tags + self-heals old HTML. Default Dashboard load
  17 MB → ~1 MB. `tests/lazy_tab_data.test.js`,
  `docs/kb-notes/methodology-lazy-load-heavy-tab-data.md`.
- **#315 CROSS-DISC RE-MINT (Rule 7):** minted **RSCH M1001** "Undergraduate
  Research Experience" (folds `MATH M1262` + 17 research singletons; 34 members,
  10 cross-listed disciplines) + **WKEX M1001** "Work Experience Education"
  (net-new; 2,190 members, 105 disciplines). Both `cross_disciplinary=true` /
  discipline "Interdisciplinary Studies". The auditor EXEMPTS them
  (`kb/_row_audit.py` early-return → no over-merge/`member_top_divergence`/
  seed-untouched flags; `member_top_divergence` 1299→1298, `seed_untouched`
  11150→11148). `cross_listed_disciplines` rides the **minted record** (cron-safe —
  `coci_curation.json` is rebuilt from Supabase) via an `xdisc_of()` fallback. The
  root cause this surfaces: `kb/_seed_coci_minted_mids.py` `STOP_PATTERNS`
  deliberately excludes the whole shell class — that's *why* work-experience was
  invisible. `kb/_apply_crossdisc_remint.py` (idempotent); alias receipt
  `kb/crossdisc_out/alias_map.json`. Scope:
  `docs/research_workexp_crossdisc_remint_scope.md`. **Open follow-on:** ACE
  skill-level child-exhibits (data-confirmed — own scope doc).
- **#316/#317 DISCOVERY TOOLING — "cron-as-window":** a session can't reach the
  MAP hosts (egress allowlist), but a GitHub runner can + Claude reads run logs.
  `kb/_discover_map_datasets.py` behind a `workflow_dispatch` workflow confirmed
  the catalog's grain + the ACE skill-level structure.
  `docs/kb-notes/methodology-cron-as-discovery-window.md`.
- **#318/#319/#320 CER ELIGIBLE + STUDENTS (the headline — 3-session blocker
  closed):** MAP's new **Exhibit CRs Catalog** (`View_ExhibitCRsCatalog_Dataset` —
  note `_Dataset`, NOT `_APIDataset`) → `fetch_custom_report.py` pulls it (lean
  9 cols) → `_rollup_exhibit_cr_catalog` → CER **"Eligible (units)"** column with
  "credit waiting to be unlocked = eligible − transcribed". **1,726/1,994
  populate; eligible ≥ transcribed 100%** (e.g. Military Basic Training 11,528
  eligible / 0 transcribed). **THE ID-NAMESPACE GOTCHA (#319):** the catalog keys
  exhibits by a NUMERIC ExhibitID (+ military), but `View_ArticulatedMAPExhibits`
  (our crosswalk's source) keys by the `MAP…` STRING id (no military) — two
  namespaces, a naive id join baked 0. Fix: bridge on exhibit **Title** →
  unified_title. **Students column (#320):** same root cause sank it
  (`View_ArticulatedCollegeCourses.ExhibitID` is also numeric, 0/37,093 matched +
  no Title to bridge) → sourced from the catalog's `TotalStudentsForCR` (MAX per
  exhibit, summed; `<5`-suppressed headcount). Credits sum, headcounts don't.
  Both columns **confirmed live on the cron** (Sam, 2026-06-09: "Student count is
  working!"). `kb/_verify_exhibit_cr_eligible.py`, `tests/cer_eligible.test.js`,
  `docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog.md`. Carryover:
  confirm `TotalStudentsForCR` semantics (label only — not a blocker); the JST
  individual planner + `View_StudentAggregatedValues` ExhibitID/SkillLevel join
  are the deferred student-portal tier.

### Session 37 — CER credential dedup (Signal-B) + the "Eligible students" relabel (shipped 2026-06-09)

Sam picked the **Signal-B dedup leads** + relabeling the CER student column. All
CER/credential-layer + detector tooling — no M-ID pipeline movement (pipeline viz
correctly skipped). **3 PRs, all merged.**

- **#322 — CER "Students" → "Eligible students".** The student-impact column is
  the catalog's `TotalStudentsForCR` = the cohort eligible for each credential's
  CPL credit recs (parallel to "Eligible (units)"); the generic "Students" header
  read ambiguously. Consumer-only relabel (`credential_reference.js` label +
  tooltip; `tests/cer_students.test.js` finder regex; the reference KB note). This
  resolved the Session-36 carryover "confirm the label semantics with Sam."
- **#323 — merged 21 Signal-B duplicate credentials.** Worked all **162** Signal-B
  leads from `kb/_detect_cpl_type_dupes.py` (the manual-review, semantic class).
  The large majority are **false positives**, correctly left split: ~62 are the
  `COMM M1038` **elective-bucket** noise (two different exams both landing on one
  generic-elective-credit course), and most of the rest are genuinely-distinct
  credentials that merely **share a course** (different FAA ratings, AWS welding
  processes/codes, AP exams, WSET levels, per-high-school articulations) — kept
  split per **scope-of-competency** (skill Rule 4). **21** are true
  same-credential phrasing variants, curator-verified against the KB (issuer +
  credit rec) and applied via `kb/_merge_credentials.py` (V1–V4 green): FAA
  Airframe/Powerplant "Mechanic Certification" → "Mechanic Certificate — {…}
  Rating" (A&P combined kept separate); CDCR Correctional/Corrections Officer
  Academy → Basic Correctional Officer Academy; SFT Fire Inspector 1A/1B/1C
  subtitle + "SFT " prefix → bare code; Fire and Emergency Services Instructor 1
  → Fire Instructor 1; 7× AWS "{code} {process} Certification" → "Qualified
  Welder" (identical issuer + credit rec); + 4 spelling/Rule-1 strips. CER
  credentials **1994 → 1973**; regenerated `credential_reference_data.js`
  live-on-merge (carried forward 543 students + 1726 eligible cron-only values).
- **#324 — taught the detector to suppress elective-bucket noise.** Added a third
  Signal-B gate mirroring the producer's R1 elective-bucket rule (≥0.8-elective /
  ≥5-credentials / ≤3-colleges): a pair sharing ONLY a bucket course is
  suppressed. High-precision (a true dup always shares a REAL course → can't hide
  one). **Signal B 162 → 77** (62 bucket-only suppressed, 23 gone because #323
  merged their losers). Makes the next Signal-B pass tractable.

**Patterns/learnings:** the CER ships **live-on-merge** (regenerate the baked file
from committed inputs; the carry-forward preserves the cron-only Eligible/Students
columns). The Signal-B **triage methodology** (false-positive taxonomy +
scope-of-competency line) is the durable output → new KB note
[`methodology-credential-dedup-triage.md`](docs/kb-notes/methodology-credential-dedup-triage.md);
it complements the existing merge **mechanism** playbook. Lessons:
`docs/eacr_consolidation_lessons.md` (Session 37).

**Carryover / next:** the residual **77** Signal-B pairs are genuine but mostly
legitimate splits (Rule 4) — leave for a curator; the **Signal-A** queue is empty.
The Session-36 carryover stands: **ACE skill-level child-exhibit** scope (the
handoff's flagged next-real-work, data-confirmed), the **College + System
audience views** (System needs the privacy ADR finished), **EACR v2** scope, and
the eligible-students-per-exhibit dataset wiring when Sam sends it.

### Session 37 (cont.) — CCR impact columns + the Foreign-Language SUBJ4 re-mint (shipped 2026-06-09)

Sam pivoted to "get the CCR cleaner where there are obvious opportunities." **3 PRs.**

- **#326 — CCR Eligible-units + Students columns + 🎯 Cleanup-impact preset.** The
  Unified Courses tab can now be ranked by **real student-credit payoff**, not just
  the auditor's structural leverage (`members × (1−trust)`). `export_unified_courses`
  rolls the CER's per-credential eligible-credit + student totals up to each course
  via the articulation crosswalk (credential→course), unioning Phase-B
  `consolidated_from`; emitted on ~693 main rows (`eu`/`st`). Consumer: 2 sortable
  columns + over-merge ⚠ badge + the login-free preset (auditor-flagged ∩ eu>0,
  sorted by eligible desc). `<5`-safe by construction (students sum already-public
  ≥5 counts). `tests/uc_impact_columns.test.js` + a CCR `st` PII guard.
- **The lens immediately surfaced the cleanup target:** the **Spanish /
  foreign-language pile-up** — `SPAN 100` / `FLNG M1019` / `FLNG M1272` all
  "Elementary Spanish I", ~12k eligible units each, **all blank-discipline**.
- **#327 / #328 — Foreign-Language SUBJ4 re-mint (Rule 7).** Root cause: the MQ
  list has only **"Foreign Languages"** (no per-language discipline), so the SUBJ4
  invariant forced every language into one `FLNG`. Fix (Sam's design): split the
  SUBJ4 **per language** (`FLSP`/`FLFR`/`FLCH`/…) while the **discipline stays
  "Foreign Languages."** Model: **SUBJ4 = the subject a student enrolls in;
  discipline = the MQ category** — "Foreign Languages" is the lone umbrella. The
  apply re-prefixed (kept the already-unique M-number → collision-free, no
  re-sequence) **1,452 FL identities → 17 per-language SUBJ4s** + re-keyed 115
  articulations; **99.5–99.9% auto-classified** by the self-describing CCC TOP-11xx
  taxonomy (`1105=Spanish`). V1–V4 green; `subject_collision_signal` held at **0**
  via the new `UMBRELLA_DISCIPLINES` auditor exemption (see Rule 7). Scope +
  dry-run: [`docs/fl_subj4_remint_scope.md`](docs/fl_subj4_remint_scope.md); apply:
  `kb/_apply_fl_subj4_remint.py`; alias receipt: `kb/fl_subj4_out/2026-06-09/`.

**Patterns/learnings (KB notes this checkpoint):** rank a cleanup queue by the
**downstream impact the data already carries** (eligible-units/students), not just
structural leverage — `docs/kb-notes/methodology-rank-cleanup-by-downstream-impact.md`;
and the **umbrella-discipline SUBJ4 split** (re-prefix keeps the unique number;
auditor umbrella exemption) — `docs/kb-notes/methodology-umbrella-discipline-subj4-split.md`.
Lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 37).

**Carryover / next:** the next daily cron regenerates `unified_courses_*.js` with
the FL** ids → the CCR impact columns + Suggested-merges become per-language-coherent;
**then drive the Spanish/FL consolidation** (all `FLSP` rows now consolidate cleanly
+ fill the blank disciplines). Future umbrellas (none else identified). Plus the
standing Session-36/37 carryover (ACE skill-level scope, College + System views).

### Session 37 (cont. 2) — orphan-tail discipline fallback + FL-split CSR surfacing (shipped 2026-06-09, branch stoic-bardeen)

Triggered by Sam's CSR observation ("FLSP, etc. subjects don't show on the CSR").
Diagnosis: the CSR is **discipline-grain** (one row per MQ discipline), so a course
with **no discipline** attaches to no row — and ~5.9k single-college orphans were
blank because their 6-digit TOP codes are the catch-all buckets the precise passes
deliberately skip. **2 PRs merged.** No M-ID pipeline re-key (the auditor receipt is
dynamic — auto-current from `latest.json`; pipeline viz correctly needs no edit).

- **#330 — coarse TOP-division discipline fallback (the orphan tail).** New lowest-
  precision pass `kb/_infer_disciplines_from_top_division.py` + `kb/top_division_discipline_map.json`
  fill the orphans with the broad umbrella discipline of their **2-digit TOP division**
  (`49`→Interdisciplinary Studies, `12`→Health, `09`→Industrial Technology, …; 19
  divisions mapped to an MQ-verified umbrella, 5 with no honest umbrella left blank).
  **Filled 6,590** → tail **~7,193→~580**. A deliberate, reversible relaxation of the
  "leave catch-alls blank" guardrail (Sam: "whole tail please") at confidence **0.4** /
  `discipline_source="top_division"` (`⚙ TOP-div` badge + "by TOP division" filter).
  CSR re-seeded → new umbrella rows (Industrial Technology 806, Public Safety 496,
  Interdisciplinary Studies 2109). Auditor: `blank_discipline` 1,266→**73**;
  `subject_collision_signal` 0→**1,076** (expected — coarse fills assign a discipline
  without re-keying SUBJ4 to canonical → candidates for a future canonical-SUBJ4 fold).
  `kb/_verify_top_division_inference.py` (12 checks). KB note:
  `methodology-coarse-top-division-discipline-fallback.md`.
- **#331 — FL splits searchable + visible on the CSR.** The #328 FL re-mint put the
  per-language codes (`FLSP`/`FLFR`/…) in `kb/foreign_language_subj4.json`, but the
  discipline-grain CSR kept one "Foreign Languages" row and never surfaced them —
  searching "Spanish"/"FLSP" found nothing. `canonical_subj4.js` now loads the split
  file → shows a `⚯ N splits` chip + a per-language codes line on the row, and matches
  the split language-names+codes in **both** search boxes. Static asset → live on
  merge. `tests/csr_fl_split.test.js` (9 checks, real consumer via jsdom).

**Patterns:** (1) **A single-grain reference view can surface a finer derived layer**
(per-language splits under one discipline) via display chips + search-matching the
derived tokens, without breaking the one-row-per-X grain. (2) **Verify the data that
drives a browser view you can't load** — compute what each row renders from the JSON
(mirroring the consumer's `status()`/`variantsFor()`) + jsdom-test the real consumer.
(3) When a **parallel session already solved part of the problem** (the FL re-mint),
pivot your fix to the actual remaining gap (searchability), don't redo it. Lessons:
`docs/common_subject_code_tab_lessons.md`.

**Carryover:** the ~580 honestly-blank residual (no-umbrella divisions — curate in-tab);
the 1,076 new `subject_collision_signal` rows are a future canonical-SUBJ4-fold queue;
plus the standing ACE skill-level scope + College/System EACR views.

### Session 38 — CCR refinements + the fan-in convergences (shipped 2026-06-10, "Trusting Newton")

Sam's 5-item CCR hand-off (built partly from a KB-scoped consult's patch) + the
**first two fan-in discipline convergences** — the mirror pattern of the FL umbrella
split. **3 PRs merged (#333/#334/#335).**

- **#333 — CCR refinements (all 5 items).** #2 Subject column/filter/sort → the
  canonical **SUBJ4** (id prefix; raw local codes → hover; `subj4Of()`); #3
  fit-on-open via inner **`.uc-trunc`** spans (the consult patch's bare-`<td>`
  `max-width` is ignored under `table-layout:auto` — the CER-#307 trap — and its
  `white-space:nowrap` would have *widened* the column); #4 sortable member-table
  headers (descriptions order-pinned via `_oi`); #1 the merge affordance **surfaced**
  ("⚇ Merge" pill leading the actions cell, disabled signed-out; dialog renamed
  "Merge courses") — Sam's pick over checkbox-multiselect; #5 **units-as-a-range**
  (`umin`/`umax` baked in `export_unified_courses()` when members disagree; consumer
  renders "lo–hi" + a **>2.0 ⚠ over-merge alarm**, scalar fallback; populates on the
  cron). `tests/uc_subj4_member_sort.test.js` (23 assertions). #4's per-college
  student count: **data gap** — `st` is a credential-level rollup; not fabricated.
- **#334 — Kinesiology ⟵ Physical Education convergence (Rule 7 fan-in #1).** Two MQ
  names for one converging field → canonical **Kinesiology**, "Physical Education" an
  **alternate name** (new `kb/discipline_aliases.json`; never deleted from the MQ
  vocab). Measure-first caught: (a) **`PHYS` SUBJ4 overloaded** (PE 745 + Physics 87)
  → re-key **discipline-scoped**, `PHYS` now = Physics; (b) **band overflow** (~1,140
  > 1,000/band) → merge the **88** true dups (naive fam-key over-merged Golf I–IV;
  fixed with the canonical level-safe `_fam_key` + single-letter-roman strictness +
  same-credit guard → 0 mismatched merges). Carve-outs per Sam: **ATHL** (299
  intercollegiate, disc Kinesiology) + **PEDS** (41 adapted → new MQ "Physical
  Education Disabled Students"; garbled `53414` name cleaned). Parents 16,309→16,221.
- **#335 — Drama/Theater Arts ⟵ Theater Arts (fan-in #2) + the singleton-layer
  extension + auditor refresh.** Canonical **"Drama/Theater Arts"** (MQ slash form),
  SUBJ4 **THEA** (4 merges + 50 re-sequences + 266 flips; 16,221→16,217). The
  **singleton gap**: parents-only convergence left ~56k stand-alones on the old names
  (2,590 PE / 1,187 Theater Arts / 192 DRAM) — extended with the same rules, no
  merging (2,929 re-keys, collision-aware in the `M<band><d><LL>` space).
  **Kinesiology → `UMBRELLA_DISCIPLINES`** (sanctioned KINE+ATHL span) →
  `subject_collision_signal` back to its 1,076 baseline. CSR re-seeded (148→146
  disciplines; dead names gone; canonical pins THEA/PEDS as re-seed-surviving
  overrides). Auditor `latest.json` + `2026-06-10.md` committed (16,227 cards).

**Patterns:** (1) **fan-in vs fan-out** — two discipline *names* for one field fold to
a canonical + alternate-name alias (`discipline_aliases.json`); one discipline over
many subjects splits SUBJ4 (umbrella). KIN/PE set the fan-in template the way FL set
fan-out. (2) **Never key a re-mint on `subject_4letter`** — it can be overloaded
(PHYS); key on discipline. (3) **A convergence isn't done at the parent layer** —
singletons carry the same names and feed the CSR/CCR/worklist. (4) For an
**irreversible apply**, be stricter than the curator-confirmed worklist's family key
(single-letter romans). KB note: `methodology-fan-in-discipline-convergence.md`.

**Carryover / next:** (1) **verify the cron regen** — first daily run after #333/#335
should show the CCR units-ranges (`umin`/`umax`), KINE/ATHL/PEDS/THEA rows, and the
"⚇ Merge" pill on live data. (2) **Next fan-in candidates** (measured, in order):
CIS↔CS↔Office-Tech cluster (39/29/26 shared families — only *partly* renames, needs
judgment), Health↔Health Care Ancillaries (16), Commercial Music↔Music (12); the
visual-arts tangle is mostly real distinctions. (3) The 5 other DSPS disciplines
carry a stray `53414` in the MQ vocab (pre-existing bug). (4) The Supabase
`_CANON_SUBJ4::Theater Arts` row is an orphan (cleanup whenever). (5) `PEDS M10AE`
stray (raw local code literally "PEDS") → canonical-SUBJ4-fold queue. (6) Standing:
Spanish/FL consolidation via the worklist, ACE skill-level scope, College/System
EACR views, EACR v2.

### Session 39 — cron verify + the Supabase-mirror fix + the KINE/FLSP twin-merge (shipped 2026-06-10)

Post-convergence follow-through. **2 PRs (#337 merged; twin-merge + scope + checkpoint
in the second).** Pipeline viz refreshed (re-mint card → the twin-merge).

- **Cron verification (handoff priority 1) — CLEAN, one defect found + fixed.** The
  regenerated artifacts carried everything #333/#335 promised: units-ranges on 7,103
  rows (`KINE M1371` = 1.0–1.5 exactly), KINE 1009 / ATHL 299 / PEDS 41 / THEA 296,
  0 dead disciplines both layers, PHYS = Physics-only, audit chips 1:1, worklist
  surfacing KINE 178+107 + FLSP 29+13 dedup groups. The FL discipline-fill carryover
  was already done (1,455 FL** rows, 0 blank).
- **#337 — the defect: stale Supabase curation resurrected `PHYS M1265`.** The daily
  sync REBUILDS `kb/coci_curation.json` FROM Supabase; the convergence had re-pointed
  only the local overlay, so the cron resurrected the dead id as a ghost "Unified" row
  (+ `cluster_member_unresolved`). Fixed at the source (live `kb_curation` UPDATEs,
  alias-map-driven, reviewer stamps preserved; checked against ALL 77,726 aliases from
  every applied re-mint — exactly 5 stale course_ids); deleted the two orphaned
  `_CANON_SUBJ4` pins ("Theater Arts" + "Physical Education"); mirrored the overlay;
  fixed the one dead-name anchor (`M-ID THEA 100` → "Drama/Theater Arts"); shipped the
  **CSR alternate-name chip** ("also: Physical Education" on Kinesiology, #331 pattern,
  `tests/csr_alias_chip.test.js`). **Institutionalized as fan-in guard 6** (Supabase
  mirror) in `methodology-fan-in-discipline-convergence.md`.
- **KINE + FLSP strict twin-merge pass (Sam-authorized narrowing of the KIN/PE
  sign-off #5).** `kb/_apply_kine_flsp_twin_merge.py` (dry-run → review every line →
  `--apply` with 6 V-gates → independent re-verify): merged the strictest twin class
  only — same discipline + band + STRICT level-safe fam + credit_status +
  typical_units; winner = most corroborated. **70 groups, 74 losers folded
  (16,217 → 16,143):** FLSP 21 (the "Elementary Spanish I/…/1" pile-up → ONE
  59-college identity), KINE 53. Ripple: 19 articulations, 74 membership folds,
  0 curation. Receipt `kb/twin_merge_out/2026-06-10/`. CSR re-seeded; auditor
  16,153 cards, collision signal at the 1,076 baseline. Everything fuzzier stays in
  the curator worklist.
- **Fan-in candidates measured → mostly NOT fan-ins (Sam asked, data answered).**
  CIS↔CS 10/44 shared families (parents/both-layers), CIS↔OTEC 4/12, Health↔HCA 3/9,
  CommMusic↔Music 0/2 — vs KIN/PE's 93 across two SUBJ4 spaces. The big pairs already
  share one SUBJ4 (CISC, HLTH — Sam's pins), so their twins are ordinary worklist
  dups. Sam chose **"Scope CIS↔CS anyway"** →
  [`docs/cis_cs_convergence_scope.md`](docs/cis_cs_convergence_scope.md) (options
  A/B/C, recommendation **B** = guarded twin-merge over CISC, sign-off GATED).
- **⚠ New trap found (gates any CISC twin-merge): the single-letter token drop.**
  `R Programming` ↔ `C# Programming` collide under the strict fam key (R / C# → `c`
  dropped as "section letters") — in computing titles the single letter IS the
  content. The applied KINE/FLSP pass was audited clean (only possessive-`'s`
  artifacts). Added as trap 4 in
  `methodology-within-credential-identity-consolidation.md`; the CER's display-only
  `_consolidate_arts` shares the key → flagged for a future audit pass.

**Carryover / next:** (1) verify the next cron regenerates `unified_courses_*.js`
with the 74 merges folded (Elementary Spanish I @ 59 colleges on the CCR) and the
ghost `PHYS M1265` row gone. (2) Sam's §5 sign-off on
`docs/cis_cs_convergence_scope.md` (Option B + the single-letter guard + the CIS
SUBJ4-tail fold). (3) The KINE/FLSP worklist queues (178+107 / 29+13) are teed up
for curator confirms — twin-merge took only the strictest slice. (4) Standing:
ACE skill-level scope, College/System EACR views, EACR v2, the 5 DSPS `53414`
strays, `PEDS M10AE`.

### Session 39 (cont.) — the live-curation loop: merge ≠ verify + official-id targets (#339–#342, 2026-06-10)

Sam curated live against the fresh regen; 4 PRs shipped in direct response. Full
narrative: `docs/ccr_cluster_cleanup_lessons.md` (Session 39 cont.).

- **#339 — the Weight Training merge incident** (his 15-course merge silently
  minted a synthetic UC-CUR target, lost the members' st/eu from the Students
  sort, and auto-stamped Verified): dialog now target-explicit ("Merge into"
  defaults to the opened row; button states the action); merged rows carry
  members' st/eu (max live; TRUE union in the generator — eu/st + umin/umax
  rollups union `merge_members`); **merge ≠ verify** — merged rows (baked `mt:1`)
  stay Generated until Verify records `validated_at/_by` (the CSR two-tier
  pattern; `_apply_curation.py` syncs those columns; batch-verify excludes `mt`
  rows; the dialog stopped writing `discipline` on existing targets so its
  presence stays an explicit-verify signal). His merge re-pointed into
  `KINE M1015` "Weight Training".
- **#340 — UC-CUR demystified + retired.** `UC-CUR-<base36 timestamp>` is the
  browser's deliberately off-scheme placeholder (it can't safely allocate
  `(SUBJ4, band)` numbers). The 1 existing id re-pointed into `AUTB M1002`;
  0 remain. Future promotion script deferred until singleton-only mints
  accumulate.
- **#341/#342 — official ids are the common course reference (ADR:**
  [`docs/kb-notes/adr-official-ids-as-common-course-reference.md`](docs/kb-notes/adr-official-ids-as-common-course-reference.md)**).**
  Mint an M-ID only where no aligned C-ID/CCN exists; variants MERGE INTO the
  official id (precedence CCN > C-ID > M-ID): worklist groups lead with anchors
  (61), the dialog defaults to the official id, Confirm writes ONLY merge
  pointers on it, and the **whole 495-descriptor C-ID catalog is a valid target**
  (row or no row — `_member_v`/`_target_identity` + the auditor's orphan rule).
  **Honors rule:** C-ID has NO honors tier (0 H-suffixed descriptors; honors
  bundle by design — colleges' own COCI mappings); CCN honors ARE separate (23)
  and stay exact-string distinct. Sam's 5-item review also shipped: Subject(s)
  beside Discipline; the `nowrap` Flags column (the real horizontal-scroll
  culprit) wraps in a capped `.uc-flags-wrap`; anchor `credit: None` fixed
  (302 → 1 honestly blank). **Spanish consolidation data:** 7 → SPAN 100,
  7 → SPAN 110, 5 → SPAN 220, 3 → SPAN 230 (heritage/native/speakers; honors +
  A-B + M1184 Comp&Conv excluded as different/ambiguous).

**Carryover:** SPAN 200/210 confirms queued in the worklist; Sam's Verify clicks
on the merged KINE M1015 / AUTB M1002 / SPAN rows; the level-ambiguous Spanish
rows (Honors, A/B, High-Beginning, Advanced Elementary) are curator calls.

### Session 40 — the severed evidence index + rules-based official-ID folds (#344/#345, 2026-06-11)

Sam's screenshot ask — *"SPAN 200 should include all the Intermediate Spanish
variants; I thought our rules checked title+description alignment… let's get to
rules-based merging"* — became a root-cause find + the restored/upgraded
automatic fold. **3 PRs (#344 scope · #345 build · the anchor retirement), all
merged.** Pipeline viz refreshed (re-mint card → the promotions re-key).

- **Root cause (#344):** `kb/promotions.json` — the ONLY evidence source for
  the automatic Phase A/B official-ID fold — still spoke the 2026-05-22 ids;
  four re-mints re-keyed identities without it, and `_row_official()` resolves
  no aliases → **53% of the evidence (1,111/2,083 records) severed**, Phase B
  decayed to 455 folds, the whole Spanish family invisible (FLSP M1342
  "Intermediate Spanish I" held 30 SPAN-200 witnesses the generator couldn't
  see). Silent failure class: no error, no audit flag. Analyzer:
  `kb/_analyze_official_fold_evidence.py` (reproduces every number).
- **The build (#345, Sam approved all 4 gates):** **R1**
  `kb/_rekey_promotions.py` (dry-run/--apply, V1–V4 conservation gates,
  idempotent; 1,111 re-keyed + 13 twin folds, 9,826 witnesses conserved;
  receipts `kb/promotions_rekey_out/`). **R2** plurality rule — unanimous
  evidence folds at any witness count (the strict ≥2 spec would have unfolded
  174 established rows — measured, flagged to Sam); with dissent: ≥80% share +
  ≥2 witnesses. `match.evidence` carries the distribution (CCR badge hover).
  **R3** worklist **🧾 evidence lane** (`evidence_groups`, 151) — sub-bar rows
  surface under their top official target with witness chips instead of being
  hidden as conflicts; contested members (`x:1`, e.g. FLSP M1379 "Intermediate
  Spanish" = SPAN 200 ×8 vs 210 ×6 — two courses wearing one title) start
  UNCHECKED. **Bonus**: the new jsdom test caught a #342 gap — `doConsolidate`
  wrote `unified_title` on ROW-LESS official targets; fixed via the
  chosen-tuple id_system. **Net regen:** Phase B 455 → **1,155 M-IDs folded**
  (235 official rows + 45 anchor folds; CCR 16,080 → 15,489); SPAN 200 =
  anchor+M1342+M1043("Spanish 3")+M1362+M1246; SPAN 210 = anchor+M1352(24:1)+
  M1045+M1237+M1337+M1036. `tests/uc_evidence_lane.test.js` (30); suite 21/21.
- **Anchor retirement (gate 5):** legacy `M-ID SPAN 104/106/108` ("Spanish
  1/2/3") removed from firewalled `common_courses.json`; their 9 RCCD crosswalk
  rows re-pointed to SPAN 100/110/200. Receipt:
  `archive/common_courses_mid_span_anchors_2026-06-11_retired.json`.
- **Institutionalized:** Rule 7's checklist + the re-mint playbook artifact
  table + fan-in **guard 7** all now carry "re-key `kb/promotions.json`". KB
  note: `methodology-rekey-every-id-keyed-artifact.md` (the registry of
  id-keyed artifact classes + the drift-detector pattern).
- **Validation that made auto-fold safe to approve:** the rule reproduces 11 of
  Sam's 15 evidence-bearing hand-merges exactly, holds 3 (same target, below
  bar), contradicts none — and correctly REFUSES the bare-title over-merge.

**Carryover / next:** (1) **R4 singletons** — 653 evidence-bearing stand-alones
fold/queue under their official ids (approved as a follow-up PR). (2) The 31
`_unresolved` promotions keys. (3) Verify the next cron no-ops on the
live-shipped artifacts. (4) Sam's curator queue: the 151-group evidence lane
(FLSP M1379 is the marquee contested row) + the standing Verify clicks. (5)
Standing: CIS↔CS §5 sign-off, ACE skill-level scope, College/System EACR views,
EACR v2, 5 DSPS `53414` strays, `PEDS M10AE`.

### Session 41 — the witness-kinship gate: chimera receipts un-folded (2026-06-11)

Sam's screenshot — `AUTO 120 X` titled "Advanced Automotive Eng…" over
transmission members, `AUTO 150 X` "Advanced Engine Manage…" over brakes —
exposed that **~half of Session 40's restored folds were built on stale
receipts.** The members were RIGHT (colleges' own COCI claims; AUTO 120 X *is*
"Automatic Transmissions and Transaxles"); the folded M-IDs + row titles were
wrong. Root cause: a `kb/promotions.json` receipt is a **departure record**
about the family that existed 2026-05-22; the lossy pre-re-mint chimera
families were later carved up by the 2026-05-29 over-merge splits, but ids
that SURVIVED a split kept receipts describing the pre-split family — a decay
mode **no re-key can fix** (the key is live; the *meaning* is stale). Witness
counts are no defense ("APPLIED ANTHROPOLOGY" had 40 unanimous witnesses for
ANTH 120 — all from the dead family).

**The fix — the witness-kinship gate** (measured first via
`kb/_analyze_witness_kinship.py`): a witness counts toward an auto-fold only
if the remnant's title matches the witness's OWN claimant-course title or the
official catalog title (token-set Jaccard ≥ 0.5, level-safe). Blocks 781 of
1,635 evidence edges, unfolds 565 chimera folds, keeps all 7 SPAN folds,
unlocks new good folds (SOCI M1023's "conflict" was one chimera witness
diluting 3 real ones). Shipped with it: **synthesized official rows titled by
the official catalog** (never a remnant); **claims-only official rows** (307 —
an official id with real COCI claimants gets a row with zero folds; C-ID rows
259 → 456); **official-row stats describe the DISPLAYED members** (claims ∪
folded leaves: members count, modal units + range — the "0–6 ⚠" chip had been
computed over invisible bogus folds while the table showed 4/6/4 — modal TOP,
credit default Credit); member tables on official rows now show folded-leaf
members too. **Lane goes kin-aware**: `tm` flags + pre-unchecked, kin-ranked
groups (187 all-stale groups sink under a banner), "🧾 stale evidence" row
badge. UI: Title column wraps (no "…"), member-table headers white-on-navy.
CCR 15,489 → 16,289 rows; 0 curator-verified rows disturbed; suite 22/22
(`tests/uc_kinship_gate.test.js`). KB note:
[`methodology-witness-kinship-gate.md`](docs/kb-notes/methodology-witness-kinship-gate.md);
lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 41).

**Ops (same morning):** GitHub's scheduler dropped/over-delayed the 06-11
primary cron (the documented flakiness — backstop catches it); session
self-dispatch still 403s (`actions: write`). **Manual Refresh root cause:**
the deployed Cloudflare worker's `/trigger` reads the secret from the QUERY
STRING (old version), while the dash button POSTs it in the JSON body → 403
"Invalid or missing secret". Fix: button sends both (`?secret=` + body);
durable fix = re-paste `cloudflare-worker-proxy.js` into the Cloudflare
dashboard (Sam-only — sessions can't reach Cloudflare).

**R4 singletons SHIPPED same day (#348):** of the 653 evidence-bearing
stand-alones, **301 auto-fold** under their official rows (kinship-gated:
297 unanimous + 4 plurality; `sfold` on the row, counted in the ⛓ chip),
**12 contested → evidence-lane `g:1` stand-alone entries**, and **340
all-witness-blocked stale receipts deliberately NOT laned** (keeps ~340
noise groups out of the curator queue; recoverable via
`kb/_analyze_witness_kinship.py`). SPAN 200 absorbed "Intermediate Spanish:
Level I", SPAN 210 absorbed Level II/IV/Advanced Intermediate — the scope
§4's named R4 queue, exactly. `_row_official`'s core became
`_official_match(leaves)`; folds are display-level (in-memory
merge_into/merge_members, NO curation writes, Generated until Verify).
Stand-alone payload −301 exactly.

**Ops resolution:** the 06-11 backstop cron fired at 14:17 UTC (primary was
dropped — the documented scheduler flakiness, no action needed) and ran with
the #347 generator, so the deployed dashboard already carries the gate + the
fixed refresh button.

**Carryover / next:** (1) The 31 `_unresolved` promotions keys (now
gate-aware). (2) Sam's curator queue: the kin-ranked evidence lane top (~123
kin-backed groups incl. the 12 stand-alone contested entries; the 187
stale-receipt groups below the banner are Skip material). (3) Verify
tomorrow's cron no-ops on the R4 artifacts. (4) Sam-only: re-paste
`cloudflare-worker-proxy.js` into the Cloudflare dashboard (durable
refresh-button fix; the button works against either version now). (5)
Standing: CIS↔CS §5 sign-off, ACE skill-level scope, College/System EACR
views, EACR v2, 5 DSPS `53414` strays, `PEDS M10AE`.

### Session 42 — the slot-fix: 51% of the promotions evidence was keyed to slot-mates (2026-06-11)

The handoff's "31 `_unresolved` keys" unraveled R1 itself: the over-merge map
was STAGED-never-dispatched, the subj4 map's "DRY-RUN" `_status` was a stale
header on a fully-applied catalog-wide **permutation with slot reuse**, and
R1's iterate+liveness-shortcut resolver mis-keyed **1,066/2,083 records**.
Rebuilt `kb/_rekey_promotions.py` (single-step chronological, era-stamped,
V5 stamp gate 1,954/0) + re-applied from baseline: lane 310→**158 all-kin**
groups, R4 folds 301→**610**, ANTH 120 2→7 folds, AUTO 120X/150X gain real
kin folds; SPAN intact. + CCR **era guard** (mixed-era lazy joins = Sam's
"non-argumentation in COMM M1006"; banner + `?v=` bust) + `family_groups`
sort tiebreak. THEN (same session, Sam's extract): the **C-ID articulation
authority** — c-id.net per-college approvals as evidence tier 2′ (28,070
rows; 9,676 new-authority; 76 true conflicts) + the **Phase-1 router**
(329 MATH members display under their descriptors; M1175 "Calculus I"
splits 210/211 below family grain; `rfold`/`routed_from`; multi-approval/
sequence/conflict NEVER auto-route) + the layman's **CCR rules brief**
(`docs/ccr_rules_brief.md`, linked from the tab). Tests green. Full story:
`docs/ccr_cluster_cleanup_lessons.md` (Session 42); rules:
`methodology-alias-map-resolution-semantics.md` +
`docs/cid_articulation_authority_scope.md`.

### Session 43 — Bruh Starlord: cron no-op verified + the off-pane-columns bug (2026-06-11)

Troubleshooting day; 4 PRs, all merged on green. **Slotfix cron no-op
VERIFIED** (timestamp-normalized payload hashes byte-stable across #357 + 3
daily runs; suggestions churn gone; a `/tmp` regen reproduced HEAD exactly).
**#370** audit overlay era-busted (the one unbusted lazy fetch) + 2 UC_OUT_DIR
seam papercuts. **#371** `.claude/settings.json` defaults sessions to
`claude-fable-5[1m]` (web `/model` picks are session-scoped; the picker strips
`[1m]` — upstream #41078). **#372/#373** Sam's "AJ blank columns": auto table
layout parks columns past the scroll wrap's right edge (h-scrollbar buried at
the bottom of the 70vh wrap; per-discipline since each filtered set lays out
its own widths; DOM was complete — jsdom can't see layout) → `table-layout:
fixed` + colgroups + min-width 900 net; clipping scoped to 5 text columns
after a perf dip (**"still a bit slow" — WATCH**). KB note:
[`methodology-fixed-table-layout-off-pane-columns.md`](docs/kb-notes/methodology-fixed-table-layout-off-pane-columns.md);
lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 43).

## Archived session narratives (Session 44) — moved 2026-06-12 (Session 46)

### Session 44 — Statewide Exhibits KPI card + program-area categories + KPI reorder (2026-06-11)

Sam's live feature day; 3 PRs, all merged on green + dispatched. **#375** new
**Statewide Exhibits** headline KPI card (CCC Collaborative / ASCCC focus — a
NEW card, not a revision of the adoption card, per Sam): exhibits + areas +
credit recs + adoptions, total/per-area; **distinct (course,credit) recs vs
row-count adoptions** semantics locked in the popover. **#376** rollup re-keyed
from TOP disciplines to the **map.rccd.edu/statewidecpl program areas** via
curated `kb/statewide_exhibit_categories.json` (merge-preserving seeder
`kb/_seed_statewide_categories.py`; `^`-anchored pattern fallback; "Other
Statewide" review bucket — State Bar + HRCM 001 parked for Sam) + **doublewide**
card (`kpi-card-wide` rides `EXHIBIT_ANALYSIS_CSS`, no Rule-4 mirror). **#377**
login-free **KPI card drag-to-reorder** (`kpi_reorder.js`, per-browser
localStorage, label-identity re-match across regens, ↺ reset) — strategic-queue
item 2. Full story: `docs/statewide_kpi_lessons.md`; pattern distilled:
`docs/kb-notes/methodology-user-vocabulary-category-maps.md`. Checkpoint #378.

## Archived session narratives (Session 45) — moved 2026-06-12 (Session 48)

### Session 45 — CCR rules day: statewide C-ID routing + the CADM homonym + the description lane (2026-06-11)

Sam's three asks, three PRs, merged on green. **#379** C-ID router **Phase 3
statewide** (gate removed): 8,377 members under 454 descriptors, 174 M-IDs +
1,682 stand-alones rfold; 0 members vanish, 125 invisible claimants
materialize; 4 MATH∧SOCI dual-approval stats courses un-route (scope-gates
must filter AFTER assembling the full approval set — scope §9). **#381** the
screenshot's `CRIM M1003` root-caused to the `CADM` college-homonym lexicon
entry laundered by the SUBJ4 re-key → `kb/_audit_subject_map.py` (TOP-division
votes + minority-title grading), **college-scoped subject_map entries**,
**retraction propagation**; 11 homonyms scoped, ~320 rows re-filled honestly
(CRIM M1003 → Drafting/CADD). **#382** the dark 86% (13,922 M-IDs, no official
evidence): TF-IDF description lane, level/gender/sport-guarded → **474 groups
(135 cross-college)** as the worklist's 4th section (`desc_groups`, receipt
`kb/desc_consolidation_out/candidates.json`, termly re-run). Suite 29/29.
Lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 45); KB note:
`methodology-college-homonym-subject-codes.md`.

## Session 46 — the AUTO/smog over-mint case → the 🏷 title-evidence lane + the STATEWIDE twin merge (2026-06-12)

Sam's brief: refine minting/merging rules off the AUTO over-mints (smog I/II),
then statewide. One BAR state spec = **52 identities**; all lanes combined had
surfaced 3 pairs. **#385**: `kb/_title_consolidation_dryrun.py` — IDF-weighted
title cosine over dark M-IDs **+ 54k stand-alones**, discipline-OR-TOP
corroboration, **NO units gate** (licensure specs pack 1–7u by college),
clique-consistent components → 6th worklist section (🏷); shared guard suite
`kb/_consolidation_guards.py`: **two-axis level marks**, **strict-equality
variant marks** (refresher/instructor/module/honors/lab), year-edition marks,
word-number folds (also `_sug_sig`/`_fam_key`). **#386** (Sam: "consolidations
that should happen — rule sharpening"): the Session-39 twin merge taken
**STATEWIDE** (`kb/_apply_twin_merge_statewide.py`) + guard-clique gate —
**589 token-identical twins absorbed** (16,143→15,554 parents; 65 groups
guard-skipped; curator targets honored; V-gates + promotions re-key + receipts
`kb/twin_merge_out/2026-06-12/`), **plus the Sam-confirmed smog merges**:
L1&2 → `AUTO M1001`, the 12-member Level-2 family → `AUTO M1007` (Supabase
`kb_curation` + overlay). `docs/ccr_rules_brief.md` amended — the strict twin
tier is the ONE title-based auto-merge, fully condition-listed. Smog: 52
identities → 9 queue families → **2 merged rows + 8 residual queue groups**.
Suite 30/30. Lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 46 +
part 2); KB note: `methodology-title-similarity-merge-guards.md`.

### Session 47 — Bruh Supernova: SUBJ ⇄ CCR error checking, the To-Do feed, the fold dry-run (2026-06-12)

Sam's asks, four PRs, all merged on green. **#388** the CSR "✓ Check SUBJ ⇄
CCR" sweep + live Common SUBJ input feedback (collision/in-use badges,
collision-free suggestion chips, confirm-on-collision); Sam cured **all 11
shared Common SUBJ codes the same morning**. **#402** the sweep's THEA false
positive (Drama/Theater Arts ↔ its alias "Theater Arts") → **alias-family
awareness** (`kb/discipline_aliases.json` joins the umbrella exemptions as
shared SUBJ4-consumer semantics); the needless DRAM re-code reverted with an
intent note. **#389** the 📋 To-Do button on every tab (`cpl_todos.js` +
`kb/cpl_todos.json` — the handoff distilled; Rule-8 item 9). **#405** the
SUBJ4 fold DRY-RUN: seed synced, `_subj4_dryrun.py` taught the umbrella
allowances (it predated them — was folding FL** back to FLNG + ATHL to KINE,
bursting KINE M1###), **71,710 M-IDs → 10,974 re-keys, 5/5 gates PASS**;
apply gate = 19 curated-collision buckets to approve. Suite 34/34. Lessons:
`docs/ccr_cluster_cleanup_lessons.md` (Session 47); KB note:
`methodology-subj4-consumer-semantics.md`. **NEXT: the receipted apply**
(one cron window, twin-merge re-run bundled) + the CCR Subject-dropdown
grouping (Sam yes'd; spec in `docs/session_50_handoff.md`).

### Session 48 (Bruh Glasstronaut) — First Light: the design sprint (daily plein air art LIVE + the theme spec BLESSED) (2026-06-12)

Sam's "personality" brief → a design system + a live feature; **13 PRs
(#391–#404; #402 was a sibling session's) merged same-day**. **LIVE:** `first_light.js` — once-a-day PD
plein air greeting (Redmond/LACMA + 2 Paynes; Commons hotlinks + fallback),
grayscale→color reveal, read-aloud (`speechSynthesis` — Huell declined on
publicity-rights grounds), reflection box → NEW Supabase **`cpl_reflections`**
(anon write-only RLS, verified as anon). **SPEC BLESSED (v1.4.2):**
`prototype/first_light_theme_v1.html` + `check_contrast.py` (derived AA
tokens — crimson `#920000` · cobalt `#0047AB` · hunter `#2C601A` · violet
`#6D28D9`; glass=chrome/opaque=data; **GLASS-QUIET uniform chips graduated at
session close** — translucent fill/no per-chip blur, gray outline, dark accent
labels, 6.5rem + `chip-fit`; solid family archived in the Chip Studio).
**NEXT: the live-dashboard token retheme — GO** (`docs/session_49_handoff.md`;
restyle checklist includes the To-Do chips + the CSR sweep chips, per the
sibling CCR/CSR session's note).
Lessons: `docs/first_light_lessons.md`; KB notes:
`methodology-derived-aa-token-palette`, `reference-public-domain-art-sourcing`.

---

### Session 49 (Bruh Orbitron) — the First Light retheme SHIPPED to prod (2026-06-12)

The v1.6 spec painted onto the live dashboard, three PRs merged + dispatched
same-afternoon: **#407** the palette flip (`:root` value-swap in BOTH HTMLs +
legacy navy/gold aliases remapped; contextual legacy-hex sweep across the
styleblock, body, `excel_to_dashboard.py` in Rule-1 lockstep, the College
Activity template, and ~20 JS assets; canvas/SVG get literal hexes — `var()`
doesn't resolve there; `check_contrast.py --live` CI lint + 27-pin
`tests/retheme_tokens.test.js`); **#408** glass chrome (masthead/rail/KPI
hero/filter bar) + the ghosted painting (`first_light.js` `.cplfl-bg`,
opt-out-aware) + `prefers-reduced-transparency`/`contrast` honored — dark
trend/College-Activity cards deliberately stay ink; **#410** glass-quiet
chips (CCR `.uc-badge`, CSR `.cs-badge`, CER `.cr-chip` — Generated rides
VIOLET now — To-Do FAB → cobalt). Word-docx/xlsx export branding + the
Element Map deliberately untouched. Lessons: `docs/first_light_lessons.md`
(Session 49); KB note: `methodology-token-retheme-on-generated-html`.
**NEXT (design lane): `docs/session_52_handoff.md`** — Sam's screenshot
verdicts, kpi_reorder keyboard path, per-tab polish.

### Session 50 — Bruh Dawnleader: the SUBJ4 canonical fold APPLIED (2026-06-12)

The Rule-7 apply of dry-run #405, one PR, landed in the evening cron window.
**71,037-alias permutation, 48,820 id moves** (10,974 SUBJ4 re-keys + bucket
re-sequencing) across minted/singletons/memberships/articulations/curation +
**119 Supabase ops** (md5-verified, PK-order simulated); plan recomputed at
apply == frozen reviewed plan byte-identical (`compute_plan()` shared with the
dry-run); post-fold twin pass +19 (15,535 parents); chain
(`kb/_post_apply_chain.py`): promotions 1,678 re-keyed/0 unresolved/V5 clean,
CSR re-seed, audit — **`subject_collision_signal` 1,206 → 3** (documented
baseline-vs-overlay residuals), `mid_id_off_scheme` → 1; receipts re-run (415
desc / 5,581 title); fold-verify re_key 0; suite 34/34 (title-lane pins →
mechanism-style). Receipts `kb/subj4_fold_out/2026-06-12/`. Full story:
`docs/ccr_cluster_cleanup_lessons.md` (Session 50); KB note:
`methodology-apply-equals-spec-via-shared-allocator.md`. **NEXT: the CCR
Subject-dropdown grouping** (`docs/session_51_handoff.md`).

## Session 51 — Bruh Photonicus: KIN/PE pass 2 + the merging night (2026-06-12) — archived 2026-06-13 (Session 54)

Sam-interactive (his CCR/CSR screenshots + 5 live follow-ups). PRs #412–#415.
**Root cause repaired:** the 2026-06-10 fan-ins never re-pointed the inference
lexicons → re-derivation resurrected "Physical Education" (605 rows → Sam's PEDU
pin) + "Theater Arts" (147). Lexicons re-pointed (bare `intercollegiate` DROPPED),
`kb/_alias_canon.py` guards all 4 passes, `kb/_kin_pe_pass2.py` re-keyed **1,057
ids** (PEDU dissolved; refined athletics rule = modal TOP 0835.50 minus
instruction-exceptions → 552 rows to ATHL; flips stamped manual). 19,739 titles
normalized (Title Case / romans→digits / "(formerly…)" cut); **205 curation
merges** mirrored to Supabase (26 roster families + Sam's fitness set + 35
HS-title folds; analysis receipts `kb/kin_pe_pass2_out/2026-06-12/`). #415 fixed
the lost-worklist-saves bug (overlay fetched only discipline rows) + added
**Keep-as-is** + CCR Subject optgroups; #414 the CSR tweaks; #413 re-pinned the 6
post-fold-stale test files (35/35). Full story:
`docs/ccr_cluster_cleanup_lessons.md` (Session 51); KB note:
`methodology-fanin-alias-lexicon-contamination.md`.


## Session 53 — Bruh Infinitus: auto-merge pass 1 + Sam's UI batch (2026-06-12 night) — archived 2026-06-15 (Session 55)

Sam-interactive. PRs #418–#424, all squash-merged + published same-hour.
**AUTO-MERGE PASS 1 APPLIED** (Sam reviewed ~80 of 9,087 worklist groups →
"auto curate"): `kb/_auto_merge_worklist.py` planned the dependable lanes
ONLY (anchored + cross-college singletons; gates: band purity caught 325
credit/noncredit mixes, same-college 214, dismissals honored) → **2,272
groups / 5,838 rows applied 5,838-for-0-conflicts** via SHA-pinned md5-gated
server-side insert; cohort `reviewer_email='automerge-v1@bot'` (revert =
delete the cohort); receipts+apply_log `kb/automerge_out/2026-06-12/`.
Also: worklist popup chrome (#418 drag/✕/proposal framing), 4 stale test
re-pins post-regen (#419), KPI consolidation + Veteran ⭐/JST + quickstart
width (#420), mojibake repair + `kb/coci_title_corrections.json` queue +
CCR "fix in COCI" chip (#421). Lessons: `docs/ccr_cluster_cleanup_lessons.md`
(Session 53); KB note: `playbook-gated-bulk-autocuration.md`.

### Session 54 — Bruh Spaceranger: the auto-merge cohort made reviewable (2026-06-13)

PR #428 (merged + dispatched + LIVE). Follow-through on Bruh Infinitus's
auto-merge night: **verified** the overnight regen (941 `UC-CUR-AUTO*` mints +
1,331 anchored = 2,272 targets / 3,588 folds, exact match to the receipt;
worklist 9,087 → 6,583, **title lane 5,457** the big remainder; suite 43/43),
then **surfaced** the cohort for one-click review. Generator stamps each merge
target with `auto_n` (count of folds from `reviewed_by=='automerge-v1@bot'`,
>0 only, in the single `merge_members` loop); consumer renders an amber **⚙
auto-merged** chip (distinct from cobalt `⛓ merged`) + a **row-level "Auto-merged"
Triage lane** (works without sign-in/audit overlay; QS_TRIAGE deep-linkable).
Code-only PR; verified end-to-end via an isolated `export_unified_courses()`
run (2,272, 0 leakage), then artifacts restored + cron-dispatched. Pipeline tab
`#pl-section-remint` refreshed (both HTMLs). jsdom test
`tests/uc_auto_merged_chip.test.js` (14). **Correction:** the ceramic-tech
To-Do was imprecise — "Ceramic Technology" IS an MQ name; `skip_unknown_disc`
fires from the SUBJ4 fold's `discipline_canonical_subj4.json` (148) lacking it
→ a curator pick (surfaced to Sam). Lessons: `docs/ccr_cluster_cleanup_lessons.md`
(Session 54). **NEXT: `docs/session_55_handoff.md`** (title-lane pass-2 DRY-RUN
on Sam's go; per-row revert affordance; MilStudents wiring).


### Session 55 — Bruh Nebula: Suggested-merges clarity + the UC-CUR→Z scope (2026-06-15)

Sam-interactive (his two CCR worklist screenshots). PRs #434–#437, all
squash-merged. **Worklist UX, from Sam's confusion:** (#434) the surviving
identity now wears a **★ merge target** badge (§10 CCN>C-ID>M-ID>Unified pick,
live as checkboxes toggle, reference-equality so duplicate-id rows don't both
light) + a dynamic note that spells out the 2-candidate case; (#435) the
**self-merge ghost groups** — a promoted singleton re-offered as its own orphan
(member id == anchor id) — fixed in `export_unified_courses()` (skip singletons
whose id is already a payload row; **20→0** anchored ghosts, verified live), and
the **Discipline picker** now disables + explains itself (it's only written on a
fresh mint, silently ignored on a merge-into); (#436) a **"⌕ merge into a
different existing course"** search picker reusing the `⚇ Unify` index — fold the
group into ANY identity the title-signature grouping won't surface (e.g. a real
Anatomy & Physiology C-ID). Suite 44→47. **Sam's UC-CUR→Z decision (#437, SCOPE
only):** rename the 4,053 synthetic `UC-CUR-*` ids to `SUBJ Z<band><seq>` (e.g.
`BIOL Z9001`; Z = curator-minted, needs attention) — **full re-key**, but the
blast radius is **entirely inside curation** (4,053 targets + 4,053 title rows +
10,682 `merge_into` pointers; **0** articulations/promotions). Scope:
`docs/uc_cur_zscheme_remint_scope.md`.

### Session 56 — Star Treader: the UC-CUR → Z-scheme re-mint, APPLIED (2026-06-15)

PR #439 (merged + both workflows dispatched + LIVE). Built the Z-scheme dry-run,
Sam said **"Go now,"** and landed the full Rule-7 re-mint same window. The 4,053
synthetic `UC-CUR-AUTO*` ids → `SUBJ Z<band><seq:03d>` (e.g. `BIOL Z9001`;
**Z** = curator/auto-minted Unified, needs attention — parallel to `C`/`M`).
SUBJ4 = canonical of members' modal discipline **with the umbrella exception**
(FL/KIN keep their split codes, never collapse to FLNG/KINE); band 9/1 from
credit_status; persisted counter `kb/uc_cur_zseq.json` (option B). Dry-run 7/7
gates; `compute_plan()` shared by dry-run + apply (apply == spec). Surface was
**entirely inside `kb_curation`** (4,053 self-keys + 10,682 `merge_into`; **0**
articulations/promotions), **fresh-read md5-verified git…live** before writing.
Live Supabase re-keyed via a new **reusable** service-key path
(`kb/_rekey_kb_curation_supabase.py` + `.github/workflows/supabase-rekey.yml` —
the alias map is too large to hand-pass as SQL; read the committed file in
Actions), verified by md5 (0 UC-CUR, 4,053 Z); then `daily-dashboard.yml`
regenerated the overlay + `unified_courses_*.js` (4,053 Z rows, all `id_system`
Unified, 0 leakage). Coupled consumer/auditor recognition shipped in the same PR
(a `Z` target had been mis-classified as a C-ID). Tests:
`tests/uc_zscheme_recognition.test.js` (8) + `tests/uc_cur_zscheme_dryrun_test.py`
(12); suite 48 green. **Deferred** (graceful, no runs scheduled): auto-merge
mint → Z + the client-mint promote-step (new UC-CUR mints still work via dual
recognition); the auditor re-run (Z rows show no audit chip until `kb/_row_audit.py`
re-runs). Lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 56); KB note
`docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md`.

## Archived session narrative (Session 57) — moved 2026-06-18 (Session 61)

### Session 57 — Bruh Skydriver: worklist polish + the consolidation loosening (2026-06-16)

Sam-interactive (his "Voice (NC)" worklist screenshot). Two merged PRs, both
dispatched + LIVE. **#441 — the worklist popup + CCR:** count "N of M" moved into
the title bar (subtitle + "drag to move" dropped); the proposed title now prefers
the ★ target's **cleaned** name (new client `cleanTitle()` strips "(NC)"); a
per-candidate **ⓘ description toggle**; the Discipline field shows the inherited
disc / **pre-selects the modal member disc** on a mint (generator emits per-member
`d`); CCR course-ID column wraps/clips instead of overlapping the title. **"(NC)"
cleanup** (data half): `_normalize_common_titles.py` gained a noncredit-paren strip
(110 singleton titles; meaningful parens like (BIM)/(FSVP) kept) — the auto-merge
worklist auto-cleans future mints via the shared `regularize_title()` — and the 13
bot-minted curated `unified_title`s carrying the noise were stripped in **Supabase
`kb_curation` + the snapshot** (all `automerge-*@bot`, no human text). **#442 — the
consolidation push:** Sam chose to **loosen the existing lanes** (over the measured
opt-in-lane option), so `_sug_sig` went **level-SAFE → level-COLLAPSING** (folds
the level axis: level words, roman/word/digit ordinals, a–h section letters) — the
worklist now merges across levels by default. Suggestions-only / curator-confirmed
/ reversible. Worklist regrouped **229→2,665 anchored, 217→2,519 singleton**
(other lanes unchanged). Measure-first evidence committed: `kb/_similar_family_
dryrun.py` (7,849 families, 99% disc-unanimous; receipt gitignored — regenerable).
Suite 48→49. **DEFERRED** (its own measured PR — `kb/README.md` mandates measuring
member-row flips first): the member-join **Jaccard 0.5→~0.4**. Lessons:
`docs/ccr_cluster_cleanup_lessons.md` + `docs/similar_course_family_scope.md`; KB
note `docs/kb-notes/adr-level-collapsing-consolidation.md`. **NEXT:
`docs/session_58_handoff.md`** — the Jaccard measurement; work the 10× bigger
worklist; title-lane pass-2 still open.

## Archived session narrative (Session 58) — moved 2026-06-18 (Session 62)

### Session 58 — Bruh Skyleader: Suggested-merges deep refinement (2026-06-16)

Sam-interactive (Algebra then ESL worklist screenshots). **Three code-only PRs**
(cron/dispatch republishes artifacts). Full story:
`docs/ccr_cluster_cleanup_lessons.md` (Session 58 + cont.).
- **#445 — override-rename + segment-fold + completion note.** Picking a
  NON-official course in "⌕ Merge into a different course" pulls its cleaned title
  in **editable** (renames the target on Confirm; official stays firewalled);
  `_SUG_SEGMENT = {part,semester,module,half,level,levels}` folds divider words so
  "Algebra 1-2, Semester 1"/"…, Part 1"/"Algebra 3-4" group under one `algebra`
  sig; new `merge_note` curation field (⚑ chip + ⓘ-modal line) for "both parts
  required for full credit" on segmented mints.
- **#446 — synonym map + keyword-gather.** `kb/synonym_map.json` normalizes
  abbreviation↔expansion (ESL≡English as a Second Language, ASL/PE/Math/AJ) in
  `_sug_sig` — **a similarity threshold can't bridge a zero-overlap synonym**
  (ESL→84, ASL→60, PE→18; global flat). The popup ➕ **keyword-gather** lets the
  curator search + multi-select extra members (the broad-family judgment).
- **PR-B — looseness slider.** 🏷 "match strength ≥ X" header slider filters the
  title lane by weakest-pair cosine; lowered the title dry-run `COSINE_MIN`
  0.62→0.50 + regenerated the receipt (5.9MB→2.0MB — it was stale), default 0.62
  = no-op, slide to 0.50 reveals ~1.3k weaker groups. The slider rides the title
  lane because it's the ONLY continuous-score lane.

Measure-first: `kb/_sug_segment_dryrun.py` (synonym-aware). Tests 48→53
(override-rename, keyword-gather, looseness-slider). **NEXT:
`docs/session_59_handoff.md`** — member-join Jaccard 0.5→0.4 (measure first).

### Session 61 — Bruh Skymarker: the per-college approved-ADT overlay (2026-06-18)

Sam-interactive. The COCI **program** export (the 2nd COCI principal set —
alongside the *course* set we already had) is now in the library as the
**authoritative approved-ADT source**. **PR #458** (merged + LIVE):
`tmc/_build_college_adts.py` → `tmc_college_adts.js` (lazy) — **3,238
(college,TMC) pairs · 115 colleges · 42 ASCCC TMCs + UCTP**, mapped **99.9%**
via TOP-code-corroborated title match. The TMC tab now stamps a per-college ADT
status onto every TMC: a directory **ADT column** (✓ Approved / ⏳ In progress /
◐ Teachout when a college is picked; the **statewide approved-college count** in
review mode), a detail **status banner** (`adtBannerEl`), and a **"this college's
approved ADTs / not yet established"** filter. **UCTP** (Chemistry/Physics *for UC
Transfer*, sub-award "A.S. UCTP Degree") = its **own instances** (`extra_tmcs`,
`renderPathwayDetail`), never folded into the Chem/Physics ADT (Sam's mid-build
call). "Approved" = STATUS ∈ {Active, Approved}; PH-Science + ETE-plain fold;
Inactive hidden. Tests 55→56 files. Sam's **taxonomy** ask → ADR: keep college
names **committed JSON**, Supabase only for live curation. Full story:
`docs/tmc_builder_lessons.md` (S61); KB notes
`adr-reference-data-committed-json-vs-supabase` +
`methodology-coded-key-over-freehand-text-join`. **NEXT:
`docs/session_62_handoff.md`** — faculty-verify the drafts + the taxonomy
follow-up (`college_short_names.json` hardening).

## Archived session narratives (Sessions 63–64) — moved 2026-06-20 (Session 66)

### Session 63 — SkyGate: the KB Portal (transplant → login-gated tab → composer) (2026-06-19)

Sam-interactive, fast loop; a side-quest off the data/TMC lanes. Five squash-merged
PRs built the **KB Portal** end-to-end: **#464** transplanted the self-contained
`kb-portal/` bundle (a Supabase-magic-link reader over the public KB) into the tracker;
**#465** wired it in as a login-gated **Knowledge Base** tab (`<iframe src="kb-portal/">`
in BOTH HTMLs per Rule 4, like Letters; `tabs.js` auto-derives it); **#466** the **✍️
New-doc composer** (draft → ✨ Claude polish → tokenless GitHub create-file deep-link,
author commits as themselves — no write token in the app); **#467** a **← Dashboard**
back button (`target="_top"` to escape the iframe); **#468** **attachment upload**
(text/PDF/Word/Excel/images → in-browser pdf.js/mammoth/SheetJS extraction + image
downscale, dodging the proxy's 256 KB cap). Gate = the bundle's own allowlist
(`slee@cccco.edu` + `malone.dunlavy@rccd.edu`; `map@rccd.edu` deliberately OFF — it can
reach private CPLBrain). Tests 56→58 files. Full story: `docs/kb_portal_lessons.md`;
2 new KB notes (embed-bundle-as-tab playbook + browser-doc-capture methodology).
**NEXT: `docs/session_64_handoff.md`** — Sam smoke-tests the 5 attachment types (fix any
esm.sh lib path); the bundle-divergence decision (backport vs canonical); then the
standing data/CCR + TMC lanes resume.

### Session 64 — Startripper: the retired-model 502 fix + the CCR/CER recommender kickoff (2026-06-19)

The CPL Assistant (and the shared `map.rccd.edu` widget) was 502ing on **every** turn —
the `cpl-chat` Edge Function called `claude-sonnet-4-20250514`, which Anthropic
**retired 2026-06-15** (404 → the `!anthropicRes.ok` guard's 502). Swapped to
**`claude-sonnet-4-6`**, **deployed live as v15** (`verify_jwt:false`), PR #471; repo
swept — no other feature on a retired id. New note:
`docs/kb-notes/playbook-edge-function-502-retired-model.md`. Then a strategy session
with Sam kicked off a workstream (scope **PR #472**): make this assistant the
**CCR/CER-grounded recommendation reference + real-time benchmark** for the MAP Student
Portal bot, + a per-college **demand signal** on the college CPL Landing Sites — full
scope + locked decisions D1–D5 in
[`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`](docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md).
Full story: `docs/cpl_assistant_lessons.md` (S64). **NEXT: `docs/session_65_handoff.md`**
— build the CCR/CER/adoption ETL into shared Supabase (green-lit), then M1; the standing
data/CCR + TMC + KB-portal lanes resume.

### Session 66 — Skylander: TMC → a CO-staff ADT review tool (split · scope · rules · template metadata) (2026-06-20)

A Sam-directed pivot into the **TMC Builder** lane, building toward a Chancellor's-Office
ADT **review/processing tool** (it replaces the manual PDF-vs-PDF course-by-course diffing
CO staff do today). Three PRs: **#477** split the COCI program status into **✓ Active**
(live in the catalog) vs **✓ Approved** (CO-approved, pending activation) — 2,867 active /
218 pending across 40 TMCs (previously invisible). **#478** the scope
([`tmc-co-review-scope.md`](docs/kb-notes/tmc-co-review-scope.md)) + the **ASCCC acceptance
ruleset** distilled ([`reference-adt-acceptance-rules.md`](docs/kb-notes/reference-adt-acceptance-rules.md));
Phase-0 joins VALIDATED on 4 colleges (PCF `Program Control Number` = 100%, course-join
90–95%, C-ID coverage 51/29/8/0% — but **non-C-ID ≠ non-compliant**). **#479** the
**acceptance metadata** on `tmc_templates.js` (`refine_slot()`): **119 flexible slots**
flagged, per-TMC **`flexibility:fixed|flexible`**, 15 embedded C-IDs recovered (African
American Studies 0→3 — the only empty template, fixed). Full story:
[`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) (S66). **NEXT:
[`docs/session_67_handoff.md`](docs/session_67_handoff.md)** — build the Phase-2
**acceptance engine** (Sam: "Go for A!") + the bulk-PCF Playwright extractor.

### Session 67 — Skywatch (nick SkyMurrow): the CPL News lane (2026-06-21)

A Sam-commissioned, **unattended** CPL News tab (`#cpl-news`): the `cpl-news-harvest`
Edge Function (Google News / GDELT / CalMatters / CCCCO / Bluesky + a manual
suggest-a-story queue for closed socials via OpenGraph) → Claude triage →
`public.cpl_news`; `cpl-news.yml` cron 13:17 UTC; `cpl_news.js` live-reads it (CA-first).
First run: **12 CA items, avg rel 0.84** (Career Passport launch, CCCCO earn-and-learn, CA
budget). Capability-probe auth; harvested news also auto-flows to the CPLBrain vault digest
(`05-knowledge/cpl-news/`); the **public KB stays human-gated** (not auto-written). PRs:
**#481** (tracker), CPLBrain #9. Full story:
[`docs/cpl_news_lessons.md`](cpl_news_lessons.md) + the reusable
[`docs/kb-notes/playbook-cpl-news-aggregation.md`](kb-notes/playbook-cpl-news-aggregation.md).

### Session 68 — SkyAlizarin: spotty-cron fixes + the COBI masthead consolidation (2026-06-22)

A live UI+ops session. **Ops (both merged):** the daily refresh was "spotty" — measured
~25 runs and found GitHub's scheduler **delays** this cron 1.5–4h (not drops), so it
published mid-morning; pulled it **earlier + a 3rd cron** → the **06:17/09:17/12:17 UTC
ladder** (#485, Rule 1 + §6 updated). Then found the real miss-cause: a transient Supabase
TLS blip in `kb/_apply_curation.py` (the one unguarded sync call) aborted the *whole*
publish → **retry + non-fatal guard** (#486); today re-dispatched + current. **UI (PR #487):**
the **COBI masthead → a single-row app bar** (seal + COBI`CPL` / tagline · centered
**"Where To?"** search · subtle **ℹ About** popover + **Manually Refresh COBI**); Mamba
retired, gold CPL superscript, COBI in seal-navy. Ported **regen-safe** (anchor-parked
generator + CSS-from-JS; idempotent, −159 blank lines). Method:
[`docs/kb-notes/methodology-regen-safe-section-rework.md`](kb-notes/methodology-regen-safe-section-rework.md);
full story: [`docs/cobi_lessons.md`](cobi_lessons.md).

### Session 69 — Stargaze: TMC title-fill + the CCR polish sweep (2026-06-23)

A TMC + CCR polish sprint, Sam live throughout — 6 small tested PRs + 2 scope docs, all
merged. **TMC:** title-fill pre-fills a college's blank C-ID slots from title matches for
approved **and** in-progress ADTs (#489/#490, `≈ verify`), Status folded into the ADT
column; + the **COR-upload scope** (#491 — TMC tab as the ADT-intake that mints structured
data + the missing per-course **contact hours**; submitting-college uploads to a private
Storage bucket; [`docs/kb-notes/tmc-adt-document-upload-scope.md`](kb-notes/tmc-adt-document-upload-scope.md)).
**CCR (`unified_courses.js`):** filter bar — Search leads + wider, **"Generated by" filter
removed** (the ⚙ provenance badge stays), Subjects narrowed (#492); flag chips →
**`+ NC` / `+ CR` / `NC type`** (#493); **Disciplines legend** — local-subject rollup +
chip legend + homonym caveat (#495); **Suggested-merges search** (#496). + the
**unverified-M-ID renumber re-mint scope** ([#494](unverified_mid_renumber_scope.md) —
full Rule-7, unverified-only, close-gaps+re-sort, one pass *after the merge wave settles*)
and the live-merge durability note
([`reference-ccr-curation-sync-and-live-merge.md`](kb-notes/reference-ccr-curation-sync-and-live-merge.md)).
Full stories: [`docs/ccr_cluster_cleanup_lessons.md`](ccr_cluster_cleanup_lessons.md) +
[`docs/tmc_builder_lessons.md`](tmc_builder_lessons.md) (Session 69).

### Session 70 — PaintSky: the CCR merge workspace, leveled up (2026-06-23/24)

A long, live CCR-curation session — **9 PRs**. **First half (#500):** the **Pending-merges
tracking panel** (the `⟳ N edits awaiting sync` badge → a **📋 Review merges** click-through
with per-member/group **Undo**), a **mint → Common SUBJ preview** in the worklist, a
reviewer-gated `kb_curation` **DELETE** policy, and re-landing the **empty-squashed #499**
(KB note `methodology-stacked-pr-empty-squash.md`). **Second half — the merge workspace arc**
(Sam digging into Disciplines/Subjects/merging): **#503** re-discipline ON the merge dialog +
a **forward-looking Common SUBJ** column (curated discipline → shows its canonical `PHOT ⟲`
immediately; M-ID letters re-key at the next fold; KB note
`methodology-forward-looking-display-curate-now-rekey-later.md`); **#504** fixed the merge
search-add silently no-op'ing; **#505** Beg/Int/Adv/Lab/WkExp **band filters**; **#506** a
global **Conservative↔Aggressive slider** (replaced the title-only one; gates all scored
lanes, evidence exempt); **#507** **opt-in checkboxes** (only the ★ target pre-checked);
**#508/#509** the **morphological-variant fold** — `_sug_sig` now stems tokens
(conversation/conversational→conv, …; measure-first dry-run sized it: **+866** identities into
groups, 326 clean / 246 cross-discipline) + an amber **"⚠ Spans N disciplines"** worklist flag
for the homonym risk (workflow-dispatched live). Two architecture asks captured for the epic:
**dock the worklist as a panel** + **consolidate the two merge popups into one shared editor**.
Full story: [`docs/ccr_cluster_cleanup_lessons.md`](ccr_cluster_cleanup_lessons.md)
(Session 70). **NEXT: [`docs/session_71_handoff.md`](session_71_handoff.md)** — the
merge-workspace epic (scope-first), then the unverified-M-ID renumber re-mint + TMC engine.

### Session 71 — the CCR merge-workspace epic, completed (2026-06-24)

Executed the Session-70 epic end-to-end — **6 PRs, all merged**. The CCR had **two** merge
popups (the per-row ⚇ `openUnifyDialog` + the ✨ worklist `renderGroup`) that had **drifted**,
causing several Session-70 bugs. Now they are **one shared `buildMergeEditor(container, opts)`,
two feeders**: **#511** scope ([`docs/ccr_merge_workspace_epic_scope.md`](docs/ccr_merge_workspace_epic_scope.md));
**#512 PR-1** extract the editor, worklist embeds it (byte-identical DOM, parity); **#513 PR-2a**
hoist it to `init` scope with a `deps` contract; **#514 PR-2b** the per-row dialog adopts it
(in-row ★ model — Sam's pick; gains completion-note/band-chips/ⓘ/gather/override, keeps
re-discipline #503 via `allowRediscipline`); **#516 PR-3** the worklist is now a **right-hand
docked panel** (resize grip · » collapse-to-rail · ✕; page reflows via `body padding-right`;
`localStorage` `cplWorklistDock.v1`); **#518 PR-4** the dock **re-filters LIVE** with the CCR table
(`render()` calls an assigned `worklistRefilter`, gated on a `ccrSig()` of the carried filter fields
so a post-merge render / CCR-search keystroke never resets the queue; carry-over checkbox = off
switch). The four parameterized opts (`preCheckedIds`, `allowRediscipline`, `dismissLabel`, `deps`)
each default to the worklist's behavior, so adopting the editor regressed neither surface. A latent
bug the move surfaced: the seed member's `k` must be its id_system (§10 axis), not the display
`kind`. Full story:
[`docs/ccr_merge_workspace_lessons.md`](docs/ccr_merge_workspace_lessons.md).

### Session 72 — StarLander: the post-consolidation polish pass (2026-06-24/25)

Sam's hands-on review of the now-shared merge workspace — **13 PRs #520–#532, all merged**; because
the editor is shared, each editor-internal change landed once and BOTH surfaces (✨ worklist +
per-row ⚇ dialog) inherited it. **Wave 1/2 (#520–#525):** Cons↔Aggr slider floor 0.40→0.00 + the
opt-in **Confirm no-op fix** (disabled-until-≥2-checked); ⌕ override moved up under the title +
verbose copy → ⓘ tooltips; "Add more" → search-into-candidate-list; the **per-row ⚇ Merge opens the
docked sidebar** (single-course mode, `setBandFilter`); and the **Tight↔Loose candidate-looseness
slider** (the control Sam expected the strength bar to be). **Wave 3 (#527–#531) — 9 refinements:**
sidebar Prev/Next pager · worklist **Discipline filter** · **CCR table syncs to the sidebar's
current course** (`state.focusId` floats it + subject neighbors to top) · candidate slider defaults
**Loose** + persists (`cplCandLoosen.v1`) + auto-surfaces · editor keyword box **eliminated** (one
top Search box) · multi-term **comma=OR** search w/ ghost text · "Merge into existing" chip → section
note · the **Title-5 §55050 level convention** in `courseBands()` (ranges/words/ordinals classify;
bare numbers a curator-overridable hint). **Wave 4 (#532):** kept the human labels **Beg/Int/Adv**
(tried L1/L2/L3, reverted — internal keys stay `beg/int/adv`, no data churn). **Wave 5 (#534):**
**DECOUPLED the worklist from the CCR table filters** (dropped the "Match the CCR table filters"
checkbox — `applyCcr` now false; `rowPassesCcr` gates on it) so a **keyword surfaces ALL matching
courses** (cap 25→100, no longer CCR-gated); a **single-course RENAME** (★-checked + edited title →
"✓ Save" via `doRename()`); and **header Prev/Next** (‹ ›). 81→**88 green**. Full story:
`docs/ccr_merge_workspace_lessons.md`; KB note `docs/kb-notes/reference-course-level-convention.md`.

### Session 74 — SkyBlaster: the public CPL Fact Sheet (2026-06-25)

A self-contained product sprint with Sam in the loop. Built **`fact-sheet/`** — a
**standalone, public** page (own HTML/CSS/JS, NO COBI nav, the `kb-portal/` pattern
minus auth) that recreates the Feb-2026 journalist Fact Sheet PDF, served by Pages at
`…/fact-sheet/`, and a **`📄 CPL Fact Sheet ↗`** launch link in the COBI nav rail (a
non-tab `<a class="cpl-tab">`, no `data-tab` → `tabs.js` ignores it; both HTMLs, Rule 4).
`factsheet.js` binds the 6 headline KPIs (+ breakdowns + Veteran-Sprint figures) from
`../live_metrics.json` (baked values = fallback); the exhibit/recommendation KPI cards +
Statewide Exhibits counts are a labeled MAP Custom Reporting Module **snapshot**. Cambria
prose / Calibri data; print CSS (0.4in) → "Save as PDF" is the export. Reconciled the two
KPI cards' statewide credit-rec counts (**1,304** CCC articulation rows = **1,298**
adoptions + 6; **1,101** = distinct recs) and added a **Statewide Exhibits** section (132
exhibits / 12 program areas, expandable per-sector lists from
`kb/statewide_exhibit_categories.json`). **PRs #537 + #540, both merged + LIVE.** Full
story: [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md); reusable pattern:
[`docs/kb-notes/playbook-standalone-public-page.md`](docs/kb-notes/playbook-standalone-public-page.md).

### Session 77 — StarPort: the RACI update loop, end to end (2026-06-26)

A hyperglide sprint, Sam live-testing throughout — **8 PRs #556–#562, all merged + live.** Built the
full *"nudge → braindump → CC writes it up → card"* loop on the Team & RACI tab, and fixed a real
save-persistence bug along the way. Headlines: **Copy-RACI** (#556 — `⧉ copy` a row's R/A/C/I to others);
**Annual Report tab** (#557 — `annual_report.js`, 6-section draft from live `CPL_DATA` + ✨AI/⬇Word/🖨Print);
**check-all/clear-all + manual 📣 team nudge** (#558); **🐛 the save-persistence fix** (#559 — `raci.js`
never refreshed the magic-link token, so writes 401'd silently after ~1h; `sbWrite` is now refresh-gated +
`saveRaci` rolls back on failure — plus the **nudge accountability layer**: `last_nudged_at`/
`last_response_at` + directory Last-nudged/✓responded/⏳awaiting columns); the **📝 update composer**
(#560 — braindump → CC polish → new immutable `item_updates` table; deep-link consumer
`?update=<key>#raci`); the **per-item 📣 nudge** (#561 — emails a row's R/A people, quotes the card +
links to the composer); and **📝 on every Activity/Project card** (#562 — generator deep-link; retired the
old `✎ Update` button; dispatched the daily workflow). Round-trip = **link-to-form**, no mailbox. New KB
note: [`methodology-refresh-token-before-write.md`](kb-notes/methodology-refresh-token-before-write.md).
Full story: [`cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) (Session 77).

### Session 78 — SkyMap: posted updates surface on the card face (2026-06-26)

A short, snappy follow-on to StarPort — **1 PR #564, merged + live** — closing Session-77 carryover #4
(the first half). Two RACI-update tweaks Sam flagged: **(1) the 📝 Update + 👥 RACI deep-links now render
on every SUB-ACTIVITY card** (the `activity-kpi` cards 1.1/1.2/…), not just the Activity header + Project
cards — each sub-activity is its own RACI row keyed `project:<id>`, so the composer/focus already worked
there. **(2) posted `item_updates` now show ON the card face** via a new read-only overlay
**`card_updates.js`**: the generator stamps a hidden `<div class="cpl-live-update" data-update-key="…">`
hook (keyed `activity:N`/`project:<id>`) on every Activity/sub-activity/project card; the overlay fetches
the newest `item_updates` row per key (anon read), fills it with **body + date + author**, and **hides that
card's creation-era `.cpl-static-update` line** so there's one current "Latest Update." Code-only PR
(hooks/links are regenerated sections) → dispatched the daily workflow post-merge. New KB note:
[`methodology-live-overlay-onto-generated-cards.md`](kb-notes/methodology-live-overlay-onto-generated-cards.md).
Tests: `tests/card_updates.test.js` (17). Full story:
[`cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) (Session 78).

## Archived session narratives (Session 79) — moved 2026-06-28 (Session 81)

### Session 79 — StarBender: RACI becomes the card's source of truth + statewide Fact Sheet recs (2026-06-28)

Two threads, Sam live-testing throughout — **6 PRs #567–#571, all merged + live.** **(1) RACI-driven
cards** (#567–#570): the card **Lead** now derives from the RACI **Responsible** (was the stale
`projects.lead`) via a new read-only overlay **`card_raci.js`** (the `card_updates.js` pattern) + a **hover
roster** on the 👥 button; the 27 remaining `projects.lead` values **seeded** into `item_raci` as
Responsible (Beth Kay dropped; titles' embedded orgs kept); **nudge made opt-OUT-gated**
(`itemNudgeRecipients()` drops `nudge===false` — fixed wrongful nudges to unchecked members) + cleared the
stale ⏳awaiting tags; **sortable matrix/directory columns** (tree flattens on sort, `⤺ tree view`
restores). **(2) Statewide Fact Sheet recs** (#571): each statewide credential's authoritative credit recs
(C-ID/title/units) surfaced from **our own MAP dataset, no scraping**. The key insight (a runner probe
found it): the **one authoritative statewide exhibit is the raw row with `Collaborative Type == "CCC"`** —
adopting colleges tag their *adaptations* CCC too, which had inflated POST Basic Academy to 42 recs vs the
canonical **10**. Producer adds an additive `authoritative_recs` (CCC-only); builder
`fact-sheet/_build_statewide_recs.py` → `fact-sheet/statewide_recs.js` (daily cron); 129 exhibits/329 recs
live, no-CCC list = 3 (DLPT-Russian, HRCM 001, NCCER CORE — fix in MAP). New KB note:
[`reference-authoritative-statewide-exhibit-signal.md`](kb-notes/reference-authoritative-statewide-exhibit-signal.md).
Tests: `card_raci`/`raci_sortable`/`raci_nudge_optout`/`statewide_recs_test` (51). Full stories:
[`cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) + [`fact_sheet_lessons.md`](fact_sheet_lessons.md)
(both 2026-06-28).

## Archived session narrative (Session 80) — moved 2026-06-28 (Session 82)

### Session 80 — StarMan: the public Fact Sheet becomes Curate-editable (2026-06-28)

Concurrent with StarBender (79), Sam live-testing — **1 PR #570, merged + live; he was editing within
minutes.** The standalone public **Fact Sheet** is now editable in place by a signed-in reviewer (the shared
`cpl_sb` magic-link + `is_allowed_reviewer()` gate, same as CCR/RACI/TMC). New standalone
**`fact-sheet/factsheet_edit.js`** — a content-agnostic Supabase **overlay**: it walks the DOM at load,
assigns each editable box a **stable key** (`sectionId|slug(baked text)`, stamped `data-fsk` — so
`index.html` needs no per-box markup, a tiny diff), reads `public.factsheet_overrides` (anon) and overlays
`{html,hidden}` for every visitor; a reviewer gets **✎ Curate** mode (click a box → docked raw-HTML editor →
Save/Hide/Reset-to-original). Self-contained magic-link auth (mints `cpl_sb` from the hash),
refresh-before-write, **allowlist** sanitizer (hardened after a security review closed the foreign-content
mXSS class). `index.html` diff = button + script tag + JST-card removal → **zero overlap** with StarBender's
Statewide-CRs region (editing **excludes** `#statewide-exhibits`/`#progress`/`[data-bind]`). New table
`factsheet_overrides` (public read, reviewer write). 31 jsdom tests. New KB note:
[`playbook-curate-editable-standalone-page.md`](kb-notes/playbook-curate-editable-standalone-page.md).
Full story: [`fact_sheet_lessons.md`](fact_sheet_lessons.md) (2026-06-28).

## Archived session narrative (Session 81) — moved 2026-06-29 (Session 83)

### Session 81 — StarFarout: per-row + per-card nudges + "Nudge All" (2026-06-28)

A focused RACI/nudge tweak pass Sam asked for ("tweak the RACI and Activity cards") — **1 PR #574,
squash-merged + `daily-dashboard.yml` dispatched post-merge to publish the card buttons.** Three changes:
**(1)** the per-item 📣 nudge now shows on EVERY matrix row when signed in (gate dropped from
`itemNudgeRecipients(item).length` → `canEdit` so any one item can be nudged; opt-out still enforced in
`itemNudgeRecipients`, empty-recipient case alerts gracefully); **(2)** the bulk button renamed
**"📣 Nudge for updates" → "📣 Nudge All"** (tooltip now points to a row's 📣 for a single item); **(3)** a
📣 Nudge button on every Activity / sub-activity / project **card** (generator emits a `cpl_nudge_focus`
deep-link beside the existing 📝/👥 — verified 4 Activity + 57 project = 61, `CPL_Dashboard.html` ===
`index.html`), consumed by a new `consumePendingFocus` `NUDGE_KEY` branch → `openItemNudge`. Durable lesson —
**separate affordance VISIBILITY from action ELIGIBILITY** (show the affordance everywhere; enforce
opt-out / no-recipient in the DATA/href layer; test eligibility there, not button presence) — new KB note
[`docs/kb-notes/methodology-affordance-visibility-vs-action-eligibility.md`](kb-notes/methodology-affordance-visibility-vs-action-eligibility.md);
builds on Session 79's audience-by-consent lesson. Code-only PR per the #562/#564 precedent. Tests 96/96
(`raci_card_nudge.test.js` new, `raci_nudge_optout.test.js` rewritten, `raci.test.js` updated). Full story:
[`docs/cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) (2026-06-28).

**Then (same session) — the Fact Sheet Curate arc, 3 merged PRs.** Sam: "be able to add or delete anywhere
there are boxes or images" on the public Fact Sheet. **#576** boxes — ＋ add (clones the section's box →
sample text, so a new box always matches the format) / ✕ delete (added = real delete, baked = hide) /
drag-reorder. **#578** images — 🖼 add (upload) / S·M·L·Full resize / ⤢ replace / ✕ delete, bytes in a
public-read·reviewer-write **`factsheet-images`** Storage bucket, the override storing the URL. Both ride the
**unchanged `factsheet_overrides` table** via **reserved key namespaces** (`|add|`/`|__order`/`|img|`/`|fig|`)
the overlay *materializes* — no schema migration; `index.html` untouched (the overlay injects all chrome).
**#577** a rotating **"My CPL Stories"** section (4 random) — sourced from the SiteGround-bot-protected
`map.rccd.edu/cplstories/` by **headless Chromium on a runner** (the runner-as-proxy escalated past a JS
challenge with retry + a `.card`-count `waitForFunction`, last-good on failure). Tests 99/99. New KB note:
`docs/kb-notes/methodology-reserved-key-namespaces-on-overrides-table.md`; full story in
[`docs/fact_sheet_lessons.md`](fact_sheet_lessons.md) (the three 2026-06-28 StarFarout sections). The
M-ID pipeline did NOT move — `#tab-pipeline` intentionally untouched this checkpoint.

### Session 83 — StarNova: CO-platform strategy → Mission Control → team-phrase gate (2026-06-29)

Sam's "epic quest": recommend a long-term plan to move COBI + the CPL KB into a governed, team-based,
CO-wide structure (with Director-of-Tech "Malone"), then build a tracker for the lift and drop the per-person
login wall on team edits. **4 merged PRs.**

**(1) `docs/co_platform_strategy.md` (#586, corrected #588)** — the "plan of attack." Built by a
**12-agent workflow** (5 web-research threads → 6 design sections → synthesis), grounded in the **verified**
current state (GitHub owner = Sam's personal `samueltlee`; `CPL-Initiative` org has 0 teams; Supabase =
personal `LiveOak`/Pro; Cloudflare Worker + Anthropic key on personal accounts → the platform is owned by
*individuals*, not the institution). Covers the operating model (**AI proposes, a named human disposes**), a
Now/Next/Later roadmap + a parallel procurement track, account migration off personal logins, knowledge lanes
(CPL · CCC Baccalaureate · Apprenticeships · Internships · MIS · Student Services), integration/API
(de-scrape behind data-sharing agreements), governance/security/accessibility/HUMANS, decisions only humans
make, candid pushback, and a scorecard against all ~14 asks. The PII ask was a no-op — **verified clean on
`main`** (audit's "pending" was stale; Sam had already purged history).

**(2) `kb/liftoff_plan.json` ("Lift Off") (#588, forward-only #592)** — the program-tracker data: phases
(Now/Next/Later) of **`task` + `decision` nodes**. A `decision` FORKS the work — an option `activates` its
branch tasks and `archives` the others; the choice doubles as the human decision log. **Forward-only** (31
tasks, 3 decisions; PII-incident nodes dropped per Sam — handled long ago).

**(3) `mission_control.js` ("Mission Control") (#590, #592)** — a self-contained static overlay (the
`card_updates.js`/`first_light.js` pattern) that renders the plan ⊕ a Supabase `liftoff_state` overlay as a
**collapsible `<details>` block mounted BELOW the RACI functions** in Team & RACI (mounts on
`cpl-tab-activated`; inserts `#mission-control-root` after `#raci-root`; **didn't change one line of
`raci.js`** → its 70-check suite stayed green). Anon = read-only; signed-in/team-phrase = set task status +
pick decision branches (optimistic write + rollback).

**(4) the RACI shared "team phrase" gate (#593)** — replaced the per-person magic-link *requirement* with a
shared phrase so the team can update/nudge without each signing in. **Server-enforced** (the differentiator,
not client-side theater on a public-anon-key surface): `team_access` (RLS on, **no anon policies** → not
client-readable) + **`team_pass_ok()`** reads the **`x-team-pass`** request header and widens the
`item_raci`/`team_members`/`item_updates`/`liftoff_state` write policies to `is_allowed_reviewer() OR
team_pass_ok()` — magic-link reviewers still work. Client used a **pseudo-session** (`state.sess =
{teamPass}`) so every existing `canEdit`/`state.sess` guard passed unchanged; only `sbWrite`'s header +
`load()`'s fallback changed. Temp phrase `cpl-team-2026` (Sam to rotate). **⚠ The live header path is
unverified from the sandbox** (Supabase egress-blocked) — Sam to confirm a save persists after deploy.

**(5) Team-phrase hardening — same session, Sam live-testing with Malone (PRs #595–#598 + 2 Dependabot).**
The gate shipped but Malone hit a **401 on save despite entering the phrase** — root cause: a team-phrase
session has no user token, so `headersFor` sent `Authorization: "Bearer "` (empty), which **PostgREST rejects
at the auth layer (401) BEFORE RLS/`team_pass_ok()` runs** (an RLS denial is 403 — the 401 pointed straight
at auth). **#595** fixes it (fall back to the anon key as the bearer; never an empty Bearer) + adds the phrase
box to the composer when not unlocked. **#596** makes the card 📝/📣 popups open **in place** (new
`card_actions.js` interceptor + lazy-load; the nudge email lands on `#activities-projects` now) — no redirect
to `#raci`. **#597** brings **Mission Control** to parity (same empty-Bearer fix + it now reads the team
phrase; `liftoff_state` writes widened to `team_pass_ok()`). **#598** **validates the phrase on entry** (POST
`rpc/team_pass_ok` — a wrong phrase is rejected, never stored, killing the silent-401 trap) + a reviewer-only
**⚙ Manage team phrase** admin (view/rotate `team_access.secret` via new reviewer-only `ta_select`/`ta_update`
RLS; anon still can't read it). Also merged the two pending **Dependabot** CI bumps (`setup-node` 4→6 #587,
`checkout` 6→7 #482). All static JS → live on merge; suite **107 files green**.

Durable lessons: **the build IS the operating model** (each artifact demonstrates AI-proposes/human-disposes);
the **decision-fork tracker model**; **server-enforced shared password without per-user accounts** (new KB
note [`docs/kb-notes/methodology-server-enforced-shared-password-gate.md`](kb-notes/methodology-server-enforced-shared-password-gate.md));
**repo-private ≠ site-private** (a Sam Q — Pages stays public to URL-holders; site-gating needs an app gate
or Enterprise, and Pages-from-private needs a paid plan); **an empty `Bearer ` 401s at PostgREST's auth layer
before RLS** (so on a public-anon-key surface, always send the anon key as the bearer — never `Bearer ` with
no token — and remember a *wrong-credential* RLS rejection is 403, an *auth-layer* rejection is 401); **you
can validate a secret the client can't read by calling the gate function itself as an RPC** (the same
right/wrong signal a write gives, no new exposure). Tests: `card_actions.test.js` (15), `mission_control.test.js`
(38), `raci_team_pass.test.js` (22), raci 70/70 → **107 files green**. Full stories:
[`docs/mission_control_lessons.md`](mission_control_lessons.md) +
[`docs/cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md).

### Session 84 — SkyScribe: project soft-delete · lean Pages · computed progress bars (2026-06-29)

Started "refine COBI a bit more"; the team using the dashboard surfaced a run of needs. **6 merged PRs.**
- **Project soft-delete (#600)** — a reviewer / team-phrase user can **Table** (pause) or **Archive** (close)
  a project; it leaves the live priority surfaces and moves to a collapsed **"Tabled & Archived"** section,
  reversible (♻ Restore). New Supabase **`project_lifecycle`** overlay (absence of a row = active; write gated
  `is_allowed_reviewer() OR team_pass_ok()`) + the committed `kb/project_lifecycle.json` ledger (the "noted in
  the KB" record) + static `project_lifecycle.js` (the `card_updates.js` overlay pattern). **Wired across ALL
  surfaces** (#605): the generator excludes tabled from the grid, `CPL_DATA.projects`, the Annual Workplan
  tables, AND `build_activity_kpis` (so they drop from the Activity Metrics cards + the RACI matrix); the
  client live-hides each surface pre-regen (`raci.js` filters `buildItems` by the overlay).
- **Pages deploy fixed + leaned** — Sam's Jekyll build was hung on the 553 MB repo; **`.nojekyll` (#601)**
  unstuck it, then a **custom lean `pages.yml` (#602)** (`git archive` → prune internal-only `kb/` staging /
  alias maps / build inputs → assert every served path survives → upload + deploy) cut the published site to
  **~192 MB (−65%)**, validated 0 served files dropped. Sam switched Settings → Pages → Source to "GitHub
  Actions"; triggers = push + **`workflow_run` on "Daily CPL Dashboard"** (the cron's `GITHUB_TOKEN` push
  doesn't self-trigger) + dispatch — all three verified green.
- **Computed progress bars (#604)** — the Activity KPI card bar now computes **Goal (blue) + Stretch (gold)**
  from `current ÷ current-fiscal-year target` (was the manual `percent_complete`); manual fallback where no
  numeric/ladder. 1.1 reads Goal 200% ✓ / Stretch 100% ✓.
- **Scoped, build next session:** the Annual Workplan tab as the **authoritative source** — hybrid Current
  (live for the 5 `pid_to_kpi_key`-mapped, manual-editable for the rest) + editable titles (single
  `projects.name` store). Decisions locked → [`docs/annual_workplan_authoritative_scope.md`](annual_workplan_authoritative_scope.md).

Suite **109 files green**. Full story: [`docs/project_lifecycle_lessons.md`](project_lifecycle_lessons.md)
+ [`docs/pages_lean_deploy_scope.md`](pages_lean_deploy_scope.md). M-ID pipeline did NOT move
(`#tab-pipeline` untouched). **NEXT: [`docs/session_85_handoff.md`](session_85_handoff.md).**

---

### Session 86 — SkyGuy: KPI-card shelf · card-metric live sync · update-popup · KB team-phrase (2026-06-30)

Sam's six COBI refinements (PR #610, code-only → post-merge dispatch publishes the HTML):
- **KPI cards: hide + centered metric + collapse** — new static **`kpi_cards.js`** (the regen-safe
  `kpi_reorder.js` pattern, NOT a generator change): at runtime wraps each `.kpi-card`'s metric+label into a
  centered `.kc-head` + the rest into a collapsible `.kc-body`; cards open **collapsed (top half only)**, per-card
  × hides (→ "Hidden (N)" restore tray), Expand-all/Collapse-all toolbar; per-browser `localStorage`, scopes to
  `.kpi-section > .kpi-card`, coexists with `kpi_reorder.js`. `<script>` in BOTH HTMLs (Rule 4).
- **Activity-card big number = live KPI** (#5) — new post-pass `apply_live_activity_current()` (after the merges
  + `apply_live_workplan_current`) drives each Activity Metrics sub-activity card's `metric` from the live
  headline KPI (the 5 `PID_TO_KPI_KEY` rows) or an explicit `workplan_goals.current` (unmapped), mirroring the
  Session-85 hybrid; `current_manual_explicit` stamp gates the override (un-set cards unchanged). 3.1 43,630 →
  live 48,158; `_parse_metric_num` now handles `k`/`M`/`B`/`$`.
- **RACI Update popup** (#4) — was ALREADY show-all + edit/delete-any (incl. team-phrase); added a live
  `Updates (N)` count + taller viewport + fresh-save id backfill, and a test that guards it.
- **KB tab team-phrase** (#6) — the KB portal (a separate Supabase project) now unlocks + curates via the shared
  `cpl_team_pass` (validated server-side against the MAIN project's `team_pass_ok()` RPC; carries over from the
  Team & RACI tab via same-origin localStorage). Pure `KBComposer.teamPassRequest` keeps it unit-tested.
- **Light/glass theme (#611)** — flipped the dark-navy data surfaces to COBI's light look, chips/trendlines
  recolored for contrast: KPI Trends card + the shared `EXHIBIT_ANALYSIS_CSS` `.exhibit-*`/`.sw-*` families (CPL
  Analytics **+** EACR) + College Activity (`college_activity_template.html`/`.js`) + EACR `statewide_interactive.js`.
  Delta chips `--*-on-dark`→`--hunter`/`--crimson`, sparkline `#E3B341`→`#8B6800`, gold text→`--mustard-text`.
  Exhibit CSS publishes via the cron (injected only when MAP exhibit data present → source-guarded by
  `kb/_test_light_theme.py`). The CCR/CSR/CER reference tabs (light tables w/ dark header bands) left as-is.
  Reusable dark→light map: [`docs/kb-notes/methodology-dark-to-light-recolor-mapping.md`](docs/kb-notes/methodology-dark-to-light-recolor-mapping.md).
- **MAP Users — scoped (#612)** — Sam wants a tab to manage MAP college users + nudge colleges to refresh them.
  Finding: "MAP users" = `View_CollegeUsersRoles` (~2,710 rows / 11 fields = staff names+emails+roles), MAP
  category #9, **NOT in our datasets** (dropped from the fetch for PII-minimization, never committed). Built a
  **PII-safe schema probe** (`map/probe_users_schema.py` + `map-users-schema-probe.yml`, dispatch-only,
  runner-as-proxy) + a 4-phase scope ([`docs/map_users_tab_scope.md`](docs/map_users_tab_scope.md): runner sync
  → gated Supabase `map_college_users` → COBI tab → reuse the RACI nudge engine). The probe fix handles MAP's
  **column-oriented** response (`columnName`/`columnValue`, 2-pass). NEXT: dispatch it, fold the schema in, build P1.

112 JS test files + Python tests green; generator EXIT 0. Full story:
[`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S86–87). **NEXT: [`docs/session_87_handoff.md`](docs/session_87_handoff.md).**

### Session 87 — StarMax: card↔KPI breakdown sync + the MAP Users tab end-to-end (2026-06-30)

Two asks. **(1) Cured the population sub-activity cards** (PR #617, code-only): 3.1.1
Working Adults / 3.1.2 Veterans / 3.1.2a Apprentice were stale because Session 86's
live-sync only wired **top-level**-KPI sub-activities; these three are **breakdown rows
WITHIN** STUDENTS SERVED. New `PID_TO_KPI_BREAKDOWN` + `_kpi_breakdown_value()` wired
through both post-passes → cards now match the headline breakdown by construction
(23,388 / 24,864 / 753). **(2) Built the MAP Users tab end-to-end** (`#map-users`,
§2/§7b/§8; PRs #618–#621): a runner probe captured the schema (the **value-signature**
method — the MAP report API pads unknown columns, so confirm a column by whether its
VALUES come back, calibrated with garbage sentinels; MAP is case-sensitive + multi-word
Contacts columns keep their **spaces**). Gated Supabase `map_college_users` (2,741 rows;
public aggregate via `map_users_summary()`, roster reviewer/team-phrase gated) +
`map_college_contacts` (121); runner sync `map/sync_map_users.py` (`map-users-sync.yml`);
the tab `map_users.js` (lazy, both HTMLs) + a 📣 **mailto nudge** to Primary Contact /
VPAA / VPSS. Gotcha: Supabase **pg-safeupdate** needs `where true` on a full-table DELETE
through the API roles. 113 JS test files green.

**(3) Nudge follow-up (PRs #623–#626).** Per Sam: a **recipient PICKER** (all pre-checked,
uncheck anyone) + **CEO** as a 4th recipient (71/121 have one) + a **last-nudged log**
(`map_college_nudges`, kept separate from the monthly-wiped contacts table) (#623); the draft
**links the college to their own MAP CPL dashboard** (`map_college_contacts.landing_page_url`,
joined in the sync from `chatbox_college_profiles`; 118/121 match) (#624); and the
**college's own user roster** rides in the email body as a **Check-All checklist** (drop a
departed staffer before sending) so leadership sees their CPL people (#626). **Architecture
call (durable):** MAP is the system of record for users and there's **no MAP write API**, so
we DON'T build a roster editor in COBI — colleges edit in MAP (deep-linked), COBI owns the
nudge → `docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record.md`. Parked: the
"✓ confirmed current" attestation loop. 56 map_users checks; 113 JS test files green. Full
story: `docs/cobi_lessons.md` (S87) + `docs/map_users_tab_scope.md`.

---

### Session 88 — SkyThru: CCC-metric match · MIL/JST + Veteran Star · About z-index · MAP-Users 3 fields (2026-06-30)

Four COBI tweaks across two PRs (both merged + live). **PR #628 (code-only → daily-dispatch
publishes):** (1) **CCC Collaborative match** — KPI Trends read `ccc_collaborative`=adopting_colleges
(61) under the same label as the MAP Exhibits card's exhibit count (132). New `kpi_history` key
**`ccc_exhibits`** (= `ccc.unique_exhibits`) repoints the Trends row; legacy series kept. NEW key →
deltas read "—" until its own series accrues (no fake jump). (2) **MIL vs JST + the Veteran Star** —
new **`fetch_veteran_jst.py`** → committed **`veteran_jst.json`** (runner-as-proxy, soft-fail; the
worker scrape lacks MIL/JST + can't be redeployed from a session). `apply_veteran_jst` puts the REAL
JST + reported MIL + the 75% rule on the **Veteran Sprint card** (was a proxy); the **College
Activity** table gains a "MIL / JST" column + the ★ becomes the Veteran Star (JST≥75%MIL), gated on
`COLLEGE_HAS_JST`. ⚠ per-college star count ≈46 vs MAP's `StarCollegeCount` 50 — boundary cases, the
savings API has no per-college star flag (logged as `computed_star_colleges`). (3) **About-box
z-index** — `.header`'s `backdrop-filter` trapped the popover (z-index:300) behind the cards;
`cobi_brand.js` lifts `.header` to `z-index:150`. **PR #629 (MAP Users):** the value-signature probe
confirmed UserStatus∈{Active,Inactive}/UserDisciplines/LastUpdatedOn on the 16-field Users view;
`map_college_users` += `user_status`/`disciplines`/`last_updated_on`, `map_users_summary()` += public
`active_count` (Disciplines+Last-updated reviewer-gated). Sync FIELD_MAP + tab roster columns. Tests:
+4 new files (#628) + cobi_brand z-index guards; map_users → 70 checks; 114 JS files green. Full
story: [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S88).

### Session 89 — SkyMiles: Sierra sees what colleges TEACH (the COCI offerings catalog, v20) (2026-07-01)

Sam's ask (from a Boys & Girls Club colleague's detailed NCCER/OSHA/welding CPL
question): free Sierra to research the course/program catalog. Root cause — the
shared `cpl-chat` function could search only the **earned-exhibit** set
(`chatbox_exhibits`), never **what a college TEACHES**, so it couldn't reason
"LA Harbor hasn't articulated NCCER, but does it teach construction? if not, which
nearby college does?" (confirmed: LA Harbor **0** construction-crafts courses, El
Camino **25**, Long Beach City **14**). **Full build shipped (PR #631):** a public
COCI **offerings catalog** in Supabase (`coci_college_offerings` 16k · `coci_college_programs`
22k · `college_geo` 120; §8), built by `chatbox/build_coci_offerings.py`, loaded by
the runner sync `coci-offerings-sync.yml`; wired into **`cpl-chat` v20** (5th parallel
lookup + relevance-ranked `search_college_offerings` + core-vs-tangential gating +
nearest-college ranking + `OFFERINGS_RULE` adoption prompt; `verify_jwt` preserved
false). Smoke modes 7–8. This is the **offerings slice of the CCR/CER ETL** (CER +
adoption-leverage layers are the next wire). Full story: `docs/cpl_assistant_lessons.md`
(Session 89).

## Archived session narrative (Session 90) — moved 2026-07-01 (Session 92)

### Session 90 — SkySherpa: the standalone Sierra page gets its brand (2026-07-01)

A focused visual pass on the **standalone Sierra page** (`sierra/`, added S89 PR #633),
3 PRs all merged + live. **#635** — the header 🏔️ emoji → the official **CPL Initiative
logo** (`sierra/cpl-initiative-logo.png`, white-on-transparent, cropped to content) as a
co-brand lockup left of the wordmark. **#636** — a hand-traced **Mt Whitney ridge ghosted
behind "Sierra"** (`sierra/whitney-mark.svg`, single white stroke + a summit snowcap, 34%
opacity, flat base on the text baseline, nudged right to clear the "a") + tagline "Your
Credit for Prior Learning guide" → **"Your CPL Sherpa"** (Whitney = tallest Sierra Nevada
peak; a Sherpa guides you up). **#637** — trimmed the tagline to just "Your CPL Sherpa".
Two reusable tricks: **a pasted image isn't on disk** — recover its bytes from the
base64 `image` block in the session `.jsonl` transcript; **hand-authored SVG line-art**
beats raster for a UI mark (scalable, recolorable, ~0.5 KB). All `sierra/` files are
static (no Rule-4 mirror, not a cron artifact); merged on `unstable` (TruffleHog green).
Full story: `docs/cpl_assistant_lessons.md` (Session 90).


## Archived session narratives — Sessions 91 + 92 (moved at the Session-93 checkpoint, 2026-07-02)

### Session 91 — SkyGOAT: the TMC Builder gets both C-ID authorities + "OR" alternatives (2026-07-01)

Sam's two TMC asks (from the Saddleback Administration-of-Justice screenshot showing
many NULL right-side alignments), both shipped + merged. **PR #639 — right-side C-ID
coverage doubled:** auto-match keyed only on COCI's under-reported `CIDNumber`; wired in
the already-in-repo but **unused** c-id.net authority (`cid_articulations.json`) →
`tmc/_build_college_courses.py` unions both (join `(college,subject,number)` exact +
leading-zero fallback; `sequence:true` excluded). **10,627 → 21,300** college×C-ID pairs
(+100%); **9,924** courses gained a C-ID; 961 carry ≥2 → rows gain an optional 6th
element `xcid[]`, consumer matches `{cid}∪xcid` + `autoMatch` used-tracks. **PR #640 —
"X OR Y" alternatives:** the consumer already rendered/matched per-slot `alts[]` but
**0/756 slots had any** (the PDFs' multi-column "OR" scrambles under `fitz`). Extracted
the OR-groups by a **visual PDF read** — a Workflow fanned an extractor + adversarial
verifier over all 45 PDFs → curated `tmc/tmc_or_groups.json` (80 groups, evidence
quotes); the parser folds each into one slot (`cid` + `alts[]`). **77/80 folded**,
zero drift; 3 skipped-and-logged (LPPS overlap, studio-art missing line). Genuine-absence
slots stay honest blanks (no dataset fills them; we don't hold MIS). Consumer needed no
change for #640. Suite 117 green (+2 test files). Full story: `docs/tmc_builder_lessons.md`;
new KB note `docs/kb-notes/methodology-visual-pdf-read-for-layout-encoded-facts.md`.

### Session 92 — StarFab: every c-id.net approval lands + the confidence-score data map (2026-07-01)

Same Saddleback AJ screenshot, layer deeper. **PR #642 (merged):** a c-id.net approval
with no COCI row **vanished silently** — 3,684 unattached → **1,195 visible wrong blanks
across 114 colleges** (biggest driver: the CCN transition — Saddleback's SOCI 110 lived
on retired `SOC 1/1H`). Now a **join ladder** lands every approval (exact 18,157 ·
zero-norm 1,903 · squashed-code 629 · strict-title 915 → verify-tier `tcid[]` ·
**synthesized flagged rows 1,986**) + comma-joined `CIDNumber` split (46). **Graded
provenance** per C-ID (hard ✓ / tcid ≈ verify / synth badge; autoMatch prefers
hard>title>synth; save/resume round-trips it). 2-round adversarial verify caught a real
title-stripping blocker pre-merge. 0 wrong blanks remain; suite 118 (+31-check test).
Sam reframed the goal: **CO confidence score + can't-submit-misaligned** (200+ backlog
before the mid-July Curriculum Institute) → data scorecard + build order in
`docs/kb-notes/reference-tmc-confidence-data-requirements.md` (hours = the one true gap).
**Then Sam said "Let's build:)" — the CONFIDENCE ENGINE shipped same-day:** per-slot
verdict tiers (✓ auto / ≈ verify / 📎 evidence / ⚠ review) per the ASCCC ladder, submit
gates (select-N · per-list units · ≥18 major units w/ a units-capture remedy for synth
courses), hours-placeholder + evidence capture, and the **server-gated CO review queue**
(rank-by-readiness, per-slot five-check panel, Approve/Return via the
`tmc_review_submission` RPC — `is_allowed_reviewer()`, JWT-stamped; anon can no longer
mint approved/returned) + the ⏳ In-progress backlog proxy. The adversarial verify caught
2 more blockers pre-merge (stored XSS via anon-writable `_readiness`; forgeable
approvals). Suite 119 (+38-check test). Full story: `docs/tmc_builder_lessons.md`.
**NEXT: `docs/session_93_handoff.md`.**

### Session 92 — StarLab: Sierra audience selector + 👍/👎 feedback (v22) + the Training-tab scope (2026-07-01)

Sam's three Sierra asks, all landed. **Feedback:** new Supabase **`sierra_feedback`**
(👍/👎 + note per answer, client-uuid `turn_id`, UPSERT merge-duplicates; anon
write-only, reviewer/team-phrase SELECT; §8) with the bar on BOTH surfaces
(`sierra/sierra.js` + `cpl_chat.js`). **Audience:** a REQUIRED 5-chip primary-population
selector on both surfaces (shared key `cplSierraAudience.v1`) → optional `audience`
body field → **`cpl-chat` v22** `AUDIENCE_RULES` (students get zero inside-baseball;
widget untouched); `audience` also logs to `chat_interactions`, which gained a
reviewer SELECT for gap mining. **Training tab: recommended YES, phased** —
`docs/sierra_training_tab_scope.md` (P1 review-queue+gap-miner · P2 guidance table ·
P3 RAG-corpus ingestion · the Malone guardrails lane pre-"Credit for Being Me").
**v23** (same session): the missing-landing-page rule (never invent a link; route to
the college + MAP@rccd.edu); feedback writes hardened to the `sierra_feedback_upsert`
RPC after the smoke run caught the ON-CONFLICT-needs-SELECT RLS 401.
Tests 32+16 new checks, 118 files green; smoke modes 10–12. Full story:
`docs/cpl_assistant_lessons.md` (Session 92). **NEXT: `docs/session_93_handoff.md`.**

## Archived session narrative — Session 93 (moved at the Session-95 checkpoint, 2026-07-02)

### Session 93 — SkyReach: the CPR retrieval miss fixed (cpl-chat v24) + the Sierra Training tab ships (2026-07-01/02)

Sam's CPR question exposed that `search_exhibits_by_topic` ranked by `rec_count DESC` with NO
relevance ranking — 76% of exhibits (rec_count=1) were unfindable once a query matched >200 rows
(his 16 CPR rows sat at positions 285–677; only Cabrillo's bundle surfaced). **PR #646 (merged):**
migration `search_exhibits_by_topic_relevance_rank` (ts_rank_cd over title-A/discipline-B;
cpl_type/collab_type OUT of the searched vector; schema-of-record now committed) + **cpl-chat v24**
(CPR synonym family, meta stop-words) + smoke mode 13 — CPR rows now return at positions 2–8; smoke
13/13 green. His two 👎 notes were the trail — the day-old feedback loop's first real catch. Then Sam's
"go green": **PR #647 (merged)** shipped the **Sierra Training tab** (Phase 1 — §7b `sierra-training`;
feedback queue with `status` triage via `sierra_feedback_set_status`, gap miner over chat_interactions;
38-check test; suite 121). New KB notes: `methodology-capped-retrieval-ranks-by-relevance` +
`methodology-live-db-functions-need-committed-schema`. **NEXT: `docs/session_94_handoff.md`.**

## Archived session narrative — Session 94 (moved at the Session-96 checkpoint, 2026-07-02)

### Session 94 — SkySierra: Sierra branding + markdown + Training P1 + the GUIDANCE layer (cpl-chat v26) (2026-07-02)

Sam's three asks, all shipped same-day (PRs **#649/#650/#651**, merged): the **Whitney-roundel
Sierra mark** replaces 🏔️/🎓 everywhere (rail + all three chat avatars); the chat renderers now
handle **headings/tables/rules/ordered lists** (escape-first, byte-identical across the three
surfaces — `tests/sierra_markdown.test.js`); Training-tab **P1** (🧪 Test-in-Sierra prefill handoff,
date filters, bulk triage, feedback→chat-turn telemetry link + the **window-vs-document
`cpl-tab-activated` listener fix** in sierra_training.js/map_users.js); and **Phase 2 SHIPPED** —
`sierra_guidance` (team-gated, no-delete; `chatbox/supabase_sierra_guidance.sql`) + cpl-chat
`fetchTeamGuidance()` (newest 10 active rules, ~2.5k-char cap) + the tab's 🧭 pane, proven with a
marker rule in the smoke run. ⚠ Deploy footgun: the MCP deploy tool **defaults `verify_jwt` to
true** — always pass `false` explicitly (v25 briefly carried it; v26 = same sha, flag restored).
Full story: `docs/cpl_assistant_lessons.md` (S94). **NEXT: `docs/session_95_handoff.md`.**


## Archived session narrative — Session 95 (moved from CLAUDE.md §11 at the Session 97 checkpoint)

### Session 95 — the Activity ⇄ Project separation + the Archive-radio fix (2026-07-02)

Sam's morning mixup: he tabled **23 cards** as "redundant with Activity cards" and the Activity
cards vanished too (both are the same `projects` rows dual-rendered; Session 84 wired the overlay
to hide the Activity card deliberately). Fixes, one PR: ① the 23 mistaken `project_lifecycle` rows
DELETED (5.1's deliberate June-29 tabling kept); ② the **activity layer**
(`derive_core_activity_ids` minus `5.x` — ladder-bearing `5.1` is a REAL project, caught in A/B) is
now **IMMUNE** to table/archive at every consumer (generator scrub + `project_lifecycle.js`
`activityLayerIds()` + `raci.js`); ③ the Projects Grid **no longer duplicates** activity-layer rows
("no redundant activity or project cards") — grid = `4.1.x` sprint children + `5.x` only; the
Activity card already carried every affordance; ④ the **Archive radio bug**: the capture-phase
overlay walk closed the modal on ANY inner click, so only default-Tabled/no-reason could save —
now backdrop-only. Tests 25 → 42. **Afternoon wave (Sam's poke-around, 2nd PR):** the
Path-to-2030 charts → top of CPL Analytics (Dashboard tab); the 4.1 Sprints composite inherits the
real row's goal (no more phantom row); **`project_add.js`** — the ＋ Add-project flow (projects
INSERT/UPDATE widened to the team-phrase gate, `projects_write_team_phrase_widen`); the **AWG
Projects section** (work-item projects table at the bottom of Annual Workplan Goals, own markers
AFTER the End-AWG marker); + the grid-replace **+1-blank-line/run accretion fixed** (198 piled up —
regen now byte-idempotent modulo timestamps). Suite 125 green. Full story:
`docs/project_lifecycle_lessons.md` (both 2026-07-02 sections).


### Session 96 — SkyPress: report generators go live-data + the attach handoff (2026-07-02)

Sam's report audit, one PR: the **Custom Report** now fetches the live overlays before prompting
(newest `item_updates` + RACI lead per project + an activity-updates block); the **Master Report**
button opens a **selection modal** (same Activities & Projects tree) and builds the Workplan-style
docx **client-side** from live data (`master_report.js`; the pre-built docx = fallback). Root cause
of the staleness: the runner never had node `docx` (reports failed silently every cron) and
`reports/` was never committed — both fixed in the workflow. Pipeline now folds `item_updates` into
`projects[].update` + exports `CPL_DATA.live_updates` (`kb/_load_projects.py:load_item_updates()`).
Tweaks: 📝 composer closes after "✓ Saved."; nudge mailtos semicolon-delimited (Outlook); the
Path-to-2030 charts → BOTTOM of CPL Analytics; a first-click 📎 **attach explainer** (SharePoint
"＋ Create or upload" handoff wasn't discoverable). Parked for Sam: native Supabase-Storage
attachments (access model) + attachments→KB-md ingest. Suite 128. Full story: `docs/cobi_lessons.md` (S96).


### CCR Convergence kickoff — MindMeld: doctrine + voice mind-meld + calibration (2026-07-03)

Parallel-lane session on Sam's charge: converge the 7,716-group worklist into a
≤2,500-course CPL crosswalk via a written **Merge/Mint Doctrine** calibrated to his
judgment, then batch passes. Shipped (one PR): `docs/ccr_convergence_strategy.md`
(plan of record; two-number goal — Tier-1 ≤2,500 over a converging total space;
measured: ladders 1,533 + same-college 1,773 ≈ 43% of the worklist = 2 policy calls),
`kb/merge_doctrine.md` v0 + `kb/doctrine_questions.json` (11 open Q-*), the **🧠
Mind-meld voice panel** in the CCR worklist (→ new Supabase `merge_doctrine_notes`,
schema `kb/supabase_merge_doctrine.sql`; tests `uc_mind_meld.test.js`, 31), and the
78-group calibration sample pre-decided by 4 agents (`kb/doctrine_out/2026-07-03/`).
Next: Sam's voice pass → distill v1 → batch pass 2 + ESL packaging pass per
[`docs/ccr_convergence_handoff.md`](docs/ccr_convergence_handoff.md). Full story:
`docs/ccr_convergence_lessons.md`.


### Session 97 — BigSky: the Activities tab optimization + reports consolidation (2026-07-03)

Sam's laundry list, one PR: the **Custom Report** gains a staged **progress bar**, **per-audience
document titles**, the **Elevation slider** (0→30,000 ft detail control feeding an Altitude prompt
block), and absorbs the **Master Report** as a Report-Type option (filter-bar button retired). The
**slim actions bar** (Lead + Search + Element Map + Custom Report) moved to the TOP of the Activities
pane — the Activity/Vision/Goal/Status selects, Apply/Reset, and the bar-level Attach Doc were
retired (the generator's `<!-- Filter Bar -->` comment stays put as the injection anchor; the Lead
dropdown is now rebuilt every run — it had been frozen since first populate). **Sidebar grouped**
into 5 collapsible groups + Share (`nav_groups.js`, runtime-wrap, regen-proof) with the label renamed
**Activities**; Where To now resets after each use; **MAP naming locked** (see Naming & terminology
above) across prompts, footers, the KB repo (draft PR), and a `sierra_guidance` row; report models
de-pinned to the `claude-sonnet-4-5` alias. Team-phrase expansion plan authored:
[`docs/team_phrase_expansion_plan.md`](docs/team_phrase_expansion_plan.md) (recommendation: widen
most, keep 4 reviewer-only). Suite 132 files green (+3 new). Full story: `docs/cobi_lessons.md` (S97).


<!-- Archived at the Session-101 checkpoint (2026-07-07) per Rule 8. -->

### Session 98 — the Implementation Funding rework: Chancellor-facing scenario tool (2026-07-03)

Sam's funding-tab spec, one PR (#663, merged): **2-year selectable window** (year dropdowns; pool ÷
selected years), **year-specific priorities** (Year 1/2 filter; Sam's six metrics seeded; all text
editable), the **noncredit-feeder carve-out** ($1M editable → NOCE / SD Cont. Ed / Mt. SAC NC /
Calbright split by headcount — the 4 moved OUT of the college table), and **3-layer editing**:
per-browser scenario ⊕ shared Supabase **`cpl_funding_config`** (team-phrase write via
`team_phrase.js`; unlock promotes an explored scenario) ⊕ baked defaults — resolution
`SCENARIO ?? SHARED ?? BASE`. **Excel workbook RETIRED** (Sam: "we don't need that excel book
anymore") — `cpl_funding_data.js` is now the hand-maintained snapshot; **2025-26 headcounts applied**
(74 rows; 41 keep 2022-23 with per-row `hc_vintage` + a data-driven mixed-vintage note; roster 115,
SYSTEM 2,258,784). Suite 134 green (funding test 119 assertions). Full story:
`docs/cpl_funding_lessons.md` (Session 2); KB note
`docs/kb-notes/methodology-three-layer-scenario-config.md`.

<!-- Archived at the Session-102 checkpoint (2026-07-07) per Rule 8. -->

### Session 100 — SkyVault: the CER triage loop unstuck end-to-end (2026-07-07)

Sam's "the tab stopped working" after saving 5 triage assignments = **CER never refreshed the
magic-link token before writes** (the pre-Session-77 raci.js bug; adversarially CONFIRMED via a
4-lane workflow + jsdom repro) — ported the trio as `withFreshSession()` + single-flight refresh +
401 session-drop (`tests/cer_token_refresh.test.js`, 18). The deeper stall: the fold (PR-3) ran in
NO workflow, the exhibit audit was frozen at 2026-05-24, and all 5 raws sat under stale machine
drafts on **trailing-space twin spellings**. `kb/_fold_unclassified.py` gained SUPERSEDE (curator >
unreviewed machine, twins included, articulations re-pointed) + STALE lanes + `--apply-if-safe`;
applied: 11 supersedes, 8 art rows re-pointed, 7 orphan creds pruned, queue → 0 (receipts
`kb/unclassified_fold/2026-07-07/`). Cron now runs fold + `kb/_audit_exhibits.py` daily; Pages
asserts the 4 CER paths; skill Rule 5c = Sam's Cx/portfolio naming procedure (issuer **California
Community Colleges**). Authority-anchoring strategy (CareerOneStop/O*NET/CE):
`docs/kb-notes/reference-authority-anchored-credential-naming.md`. Full story:
`docs/exhibit_canonicalization_lessons.md` (2026-07-07).

### Session 101 — SkyAnchor: CareerOneStop authority LIVE + triage QA + the AP fold (2026-07-07)

Sam's COS credentials went live: probe → contract fixes (#676 — acronym-suffix split into both
lanes, pagination hardening + `kb/_verify_cos_sync_lanes.py`, 23 checks) → apply: **6,490
certifications, 83 CER ✓/≈ COS matches** (receipts `kb/cos_match_out/2026-07-07/`). Serving gap
fixed (#677): `pages.yml` `workflow_run: cos-authority-sync` + the `kb/cos_matches.json` assert +
the registry prune (tracker-internal per COS terms). Triage QA (all 10 fixes Sam-approved, applied
in Supabase): ASE/AP/apprenticeship assignments retargeted to EXISTING house families — the
doctrine: retarget-to-existing-family verbatim beats authority-verbatim. **AP art fold APPLIED**
(`kb/_merge_credentials.py`): 5 colon variants → College Board-current, 18 raws + 20 articulations
re-pointed, 9 families → 4. Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07
"continued 3"); next: `docs/session_102_handoff.md` (COOL/MOC vs License Finder is Sam's queued pick).


## Archived session narrative — Session 102 (moved from CLAUDE.md §11 at the Session-104 checkpoint)

### Session 102 — SkySeed: the brand-family PRE-SEED — 158 of 451 triage rows in one pass (2026-07-07)

Sam: "pre-seed the common exhibit titles and issuing agencies — all the APs should be an easy win."
Measured: the queue is 38 AP + 125 CLEP = **163 College Board exams (36%)**, and both house families
already exist → `kb/_preseed_unclassified.py` maps each raw to its EXISTING family (cleanup →
normalized key → exact/alias/insert-Language/era-subtitle ladder; twin-pick boosted by the run's own
exact hits so same-exam raws converge; **NEVER invents a title** — residuals report for Sam).
**Applied via MCP: 158 seeded** (`preseed-v1@bot`, on-conflict-do-nothing; md5 of live rows ==
`kb/preseed_out/2026-07-07/plan.json` — the checksum caught 4 nbsp-dropped garbage rows, deleted;
lesson: generate SQL from the JSON receipt, never a terminal round-trip). 5 residuals = 3 multi-level
"Complete both" + 2 Level III (no family). Harness `kb/_verify_preseed_rules.py` (43); skill Rule 5d.
Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 5").

### Session 103 — Bruh SkyWay: the STAGED pre-seed + triage toggle + issuer authority sources (2026-07-07)

Sam (triaging live all evening — ~90 hand-saves landed DURING the session): "more pre-seeding …
leave them ready to save but not yet saved … a toggle [for] just the ones needing to be triaged …
preseed the credit-by-exam titles using your judgement and the issuing agency CCC."
`kb/_preseed_unclassified.py --stage` → the committed `kb/unclassified_preseed.json`: **163 rows
staged, ZERO Supabase writes** (cx 31 · hs 73 · journeyman 13 · carpenters 10 · ironworker 16 ·
nccer 13 · singles 7; 107 residual — C-##/CSLB, IC-*, fire certs). The CER worklist gained the
**Needs-triage/All toggle** (default hides saved rows), **⚡ prefilled inputs** + badge, and a
confirm-gated **"Save all pre-filled shown"** (saves what the inputs SHOW; live assignment always
wins). Authority links noted for future exhibits (DIR DAS occ 2180 → SW-JATC/CTCNC; NCCER
assessments; CSLB queued): `docs/kb-notes/reference-issuing-agency-authority-sources.md` + skill
Rule 5e. Curator VALUES fetched via MCP are now verified per-row (md5 pairs, order-independent) —
caught 2 nbsp-corrupted rows + Sam's concurrent saves. Tests: `tests/cer_worklist_preseed.test.js`
(29) + `kb/_verify_preseed_rules.py` grown to 73. QA flags for Sam: the THEATER-280 issuer slip,
SMM 4 issuer==title, 3 mojibake `â€”` Generic-CBE families. Full story:
`docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 6"); next:
`docs/session_104_handoff.md`.


### Session 104 — Bruh SkyTime: the statewide-catalog pass — 97 of the last 100 staged + college chips + multi-issuer (2026-07-07)

Sam (live, 4 asks): statewide-CR matching ("IC-Welding Level I → NCCER"), originating-college chips,
the CCR crossover think, a blindspot pass — plus 10-Key's missing issuer edit + multi-issuer Fire +
a list-vanish bug. Queue re-measured 451→351 assigned→**100 left → 97 STAGED** (residual = the 3
CLEP "Complete both" spans): v3 lanes in `kb/_preseed_unclassified.py` — statewide/family match over
`statewide_data.js` (133 CCC records, issuers) ∪ house families, `stage_ic`, `stage_cslb` (verbatim +
CSLB), `stage_cx_type` (CPL-Type-routed), +24 receipted singles; harness 76→**100**. Auditor stamps
`colleges` on queue cards → worklist chips; `_suggest_unclassified.py` mechanism-strip (💡 19→39) +
college-scoped COCI joins (`docs/kb-notes/cer-ccr-crossover-integrations.md`). Fold gained the
**`issuer_adds`** multi-issuer lane (append distinct, never overwrite; acronym-dupe guard); Mode A2
in `_apply_credential_review.py` promotes issuer overrides into `credentials.json`; CER: "+N" issuer
chip, "＋ set" on null-issuer cells, **`appendRowSafe`** row-error isolation (+3 test files, suite
140 green). Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 7"); next:
`docs/session_105_handoff.md`.


### Session 105 — SkyClose: the truncated-read fix + the missing-issuer lane + the seal-blue pass (2026-07-08)

Sam's "fire certs didn't save" + "113 still showing" were ONE bug: 1,200 overlay rows vs
PostgREST's 1,000-row unordered cap — saves were fine, the READ truncated a different tail
per load. `fetchAllRows()` Range-pagination now backs both CER overlay fetchers
(`docs/kb-notes/methodology-paginate-postgrest-reads.md`). Save-All broadened to every
FILLED shown row (hand-typed included) + loud per-row failures + `wlDraft` survival + live
issuer datalists. `_CREDENTIAL_REVIEW::` held ZERO rows — Sam's 10-Key pick had never
landed; "＋ set" now opens the issuer input DIRECTLY and the pick was seeded
(`session105-skyclose@bot`, Mode A2 folds it). New **missing-issuer triage lane** (1,130
null-issuer credentials; `kb/_preseed_null_issuers.py` staged 978 → `kb/issuer_preseed.json`,
verifier 19 checks; empty-Save = explicit no-formal-issuer). COBI-wide: black ink headers →
`--seal-blue`; Curate-panel black-box bleed fixed; CER title/chip row-height pass. Suite 142
green (+2 files). Full story: lessons "continued 8"; next: `docs/session_106_handoff.md`.

### Session 106 — SkySeal: the Triage rules day — 5f / 5c-mech / 5g + four new issuer lanes + multi-issuer (2026-07-08)

Six PRs merged live against Sam's triage pass (#690–#695). **Rules:** 5f (school = issuer =
trainer, title stripped; the EMT-405 unanimity guard), 5c MECHANIZED (CCN > C-ID > COCI course
titles, discipline-prefix strip, code-led + CCSF name-led lookups), **5g** (leading
Beginning/Intermediate/Advanced → END of the title; "Intro" → "Introduction"; AP / Advanced EMT /
ACLS exempt — 68 restyled). **Lanes:** apprenticeship (Norco/Santiago DIR-DAS sponsors, occId
82/490), statewide-agency (blank statewide issuer → AWS, the 5 welding rows), **cert-family**
(FAA ×22 — Part-147 AMT + the Reedley FLGHT ladder), title-style. **Lane UX:** editable titles +
raw/college context; the save→re-edit dead-button trap FIXED (re-arm on input, `data-busy`
in-flight guard); **＋ add issuing agency** → new `issuing_agency_additional_override`, Mode A2
promotes BOTH issuer fields additively (+ Mode A3 trainer). Plan: **1,009 staged / 1,125 queue**,
284 titles, 152 residual; verifier 50 checks; suite 142 green. Full story:
`docs/exhibit_canonicalization_lessons.md` (2026-07-08 "continued 9" – "continued 11 addendum").


### Session 107 — SkyKey: the PR-5b re-key goes LIVE — 49 renames applied, the confirm-merge lane, and Sam's four evening asks (2026-07-08)

Sam's 137 Session-106-day saves folded (dispatch); the refreshed dry-run showed 49 clean
renames held hostage by his 6 merge-shaped collisions (AoJ code rows → existing C-ID-anchored
credentials — the case PR-5b/2 was deferred for). #697 made the collision queue NON-BLOCKING;
the **first production rename apply** (PR-5b/1 run #1) landed all 49 (V1–V4 green; Supabase
106 ops/0 fail; receipts `kb/cred_rename_out/2026-07-08/`). #698 shipped **PR-5b/2**: Save-time
collision detect + confirm → the new `unified_title_merge_confirm` row; a pending-merges strip
for the saved six; dry-run `merges` lane; apply FOLD with dedupe + drift abort. Sam's four
evening asks landed within the hour: unlimited ＋ agencies (#699, " | "-joined + Mode A2 split),
the hs-generic "Local High School" + ase-align lanes (#702 — 12 ASE rows whose Saves flow
through the new confirm-merge), 🔎/✨ issuer lookup via the report proxy (#701); plus the
daily-run push-race fix (#700 — unstaged regen discarded before the retry rebase). Suite 145;
verifier 56. Sam's calls pending: confirm the 6 merges · ASE/AWS/OSHA spellings · IBEW re-point.
Full story: `docs/exhibit_canonicalization_lessons.md` ("continued 12"); next: `docs/session_108_handoff.md`.
