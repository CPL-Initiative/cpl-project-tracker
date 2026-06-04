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
