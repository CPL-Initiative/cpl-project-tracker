---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-06-12 (Session 48 — First Light: the design sprint, 10 PRs #391–#400 — daily PD plein air greeting LIVE on the dashboard (first_light.js: grayscale→color reveal, read-aloud, anonymous reflections → new write-only Supabase cpl_reflections) + the theme spec BLESSED (prototype v1.4.2 + check_contrast.py derived AA tokens; glass=chrome/opaque=data; solid uniform chips); NEW first_light_lessons + methodology-derived-aa-token-palette + reference-public-domain-art-sourcing; NEXT: the live-dashboard token retheme — GO)
tags: [meta, index, obsidian-target]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/README]]"
---

# cpl-project-tracker — Docs Index

Auto-maintained landing page for the project's documentation surface, intended
as the **Obsidian vault entry-point** when browsing this repo from the
vault-side clone at `CPLBrain/COG-second-brain/cpl-project-tracker/`.

Refreshed at every checkpoint (per `CLAUDE.md` Rule 8).

## The three lanes

| Lane | What | Where |
|---|---|---|
| **KB notes** | Durable, distilled, reusable knowledge | [`docs/kb-notes/`](kb-notes/) |
| **Lessons (WIP)** | Workstream scratchpads, append-only | `docs/<workstream>_lessons.md` |
| **Session handoffs** | "Fattyfat" capsules for the next session | `docs/session_<N>_handoff.md` |

See [`docs/kb-notes/README.md`](kb-notes/README.md) for the lane contract.

---

## KB notes (`docs/kb-notes/`)

Lane established 2026-05-27, Session 11 (Bruh El). See
[`kb-notes/README.md`](kb-notes/README.md) for the contract.

| Title | Type | Status | Created | Updated |
|---|---|---|---|---|
| [ADR — Obsidian sync via vault-side clone (not edge function)](kb-notes/adr-obsidian-vault-via-clone.md) | adr | published | 2026-05-27 | 2026-05-27 |
| [ADR — Supersede, don't mutate, at the synthetic identity layer](kb-notes/adr-supersede-dont-mutate-synthetic-layer.md) | adr | published | 2026-05-27 | 2026-05-27 |
| [Methodology — Two-mode sync (safe Mode A vs identity-touching Mode B)](kb-notes/methodology-two-mode-sync.md) | methodology | published | 2026-05-27 | 2026-05-27 |
| [Methodology — Derive whitelists from rendered DOM, not hardcoded lists](kb-notes/methodology-derive-from-dom.md) | methodology | published | 2026-05-27 | 2026-05-27 |
| [Methodology — Snapshot-with-stamp fallback for live-data dependencies](kb-notes/methodology-snapshot-with-stamp-fallback.md) | methodology | published | 2026-05-28 | 2026-05-28 |
| [Methodology — XSS audit when a previously-trusted field becomes curator-editable](kb-notes/methodology-xss-audit-on-curator-editable-fields.md) | methodology | published | 2026-05-28 | 2026-05-29 (#192 JSON-in-script class) |
| [Methodology — Parity test as the proof for a data-source cutover](kb-notes/methodology-parity-test-cutover-proof.md) | methodology | published | 2026-05-29 | 2026-05-31 (PR-1 closed the blank-vs-0 gap) |
| [Methodology — Re-mint split invariants (id↔SUBJ4, control-number atomicity, dry-run↔apply cross-check)](kb-notes/methodology-remint-split-invariants.md) | methodology | published | 2026-05-29 | 2026-05-29 |
| [Methodology — Retiring an auto-seeded data layer (check for curator decisions riding on it)](kb-notes/methodology-retiring-an-auto-seeded-layer.md) | methodology | published | 2026-05-30 | 2026-05-30 |
| [Methodology — Cosmetic relabel via a display-label map, not a stored-value rename](kb-notes/methodology-display-label-map-vs-data-rename.md) | methodology | published | 2026-05-31 | 2026-05-31 |
| [Methodology — Verify the consumer graph before migrating a data class (a dead reader means delete)](kb-notes/methodology-verify-consumer-before-migrating.md) | methodology | published | 2026-05-31 | 2026-05-31 |
| [Playbook — Auto-sync vault-side repo clones via Windows Task Scheduler](kb-notes/playbook-vault-sync-setup.md) | playbook | published | 2026-05-27 | 2026-05-29 (consolidation + plugins follow-up) |
| [Playbook — Measure-first Supabase migration (snapshot → validate → dry-run → workflow_dispatch apply → cutover)](kb-notes/playbook-measure-first-supabase-migration.md) | playbook | published | 2026-05-28 | 2026-05-28 (Phase 2) |
| [Playbook — Phase 2 projects migration scope (column map, KPI ladder contract, 6 forks for Sam)](kb-notes/phase-2-projects-migration-scope.md) | playbook | published | 2026-05-28 | 2026-05-28 |
| [Playbook — Cross-discipline over-merge re-mint scope (split algorithm, 60% de-corroboration, 6 forks for Sam)](kb-notes/over-merge-remint-scope.md) | playbook | published | 2026-05-29 | 2026-05-29 |
| [Playbook — Moving a generator-managed dashboard section to its own tab (end-anchor classify + sentinel marker)](kb-notes/playbook-move-generated-section-to-tab.md) | playbook | published | 2026-05-30 | 2026-05-30 |
| [Playbook — GitHub scheduled-workflow reliability (diagnose a missed cron + backstop-cron fix)](kb-notes/playbook-github-scheduled-workflow-reliability.md) | playbook | published | 2026-06-01 | 2026-06-01 |
| [Playbook — Full Excel retirement final scope (KPI ladder blank-vs-0 crux, D.* helpers, read_projects sunset, 5 forks)](kb-notes/excel-retirement-final-scope.md) | playbook | published | 2026-05-31 | 2026-05-31 |
| [Playbook — CPL Chatbox → dashboard integration + cpl-knowledge-base re-point (shared-backend finding, 6 forks)](kb-notes/cpl-chatbox-integration-scope.md) | playbook | published | 2026-06-01 | 2026-06-01 (Phase 1 SHIPPED + LIVE v14) |
| [Playbook — Redeploying a shared, live Supabase Edge Function safely (capture-before-redeploy, preserve verify_jwt, fail-closed)](kb-notes/playbook-deploy-shared-supabase-edge-function.md) | playbook | published | 2026-06-01 | 2026-06-01 |
| [Reference — Excel dependency audit + fix queue (every remaining .xlsx touchpoint; the "Update→Excel" button)](kb-notes/excel-dependency-audit.md) | reference | published | 2026-06-01 | 2026-06-01 (P1+P2+P4 done) |
| [Reference — Daily dashboard data pipeline (all 7 sources, every KPI's lineage, the committed daily dataset)](kb-notes/reference-daily-dashboard-data-pipeline.md) | reference | published | 2026-06-01 | 2026-06-01 |
| [Reference — Windows PowerShell scripting gotchas (PS 5.1 + Task Scheduler)](kb-notes/reference-windows-powershell-gotchas.md) | reference | published | 2026-05-27 | 2026-05-27 |
| [Reference — Session 26 codebase audit findings catalog (51 findings, ranked fix queue)](kb-notes/reference-codebase-audit-2026-06-01.md) | reference | published | 2026-06-01 | 2026-06-01 |
| [Reference — College short-name dataset + resolver (compact chips across CCR/EACR/CER)](kb-notes/reference-college-short-names.md) | reference | published | 2026-06-02 | 2026-06-02 |
| [Playbook — Purge committed PII from git history (CustomReport_latest.json; Rule-5-override force-push)](kb-notes/playbook-pii-history-purge.md) | playbook | published | 2026-06-01 | 2026-06-01 |
| [Playbook — EACR consolidation + master-detail gallery scope (Local+CCC merge, versioned gallery, 3 audience views, 4-phase ladder, backlog)](kb-notes/eacr-consolidation-scope.md) | playbook | published | 2026-06-01 | 2026-06-01 (Session 28: PR-4 prescriptive layer SHIPPED) |
| [Methodology — Versioned prototype gallery (preserve v1, stack v2, graduate the winner)](kb-notes/methodology-versioned-prototype-gallery.md) | methodology | published | 2026-06-01 | 2026-06-01 |
| [Methodology — Styling a native &lt;details&gt;: keep a visible affordance, drive the toggle in JS](kb-notes/methodology-styling-native-details-toggle.md) | methodology | published | 2026-06-01 | 2026-06-01 |
| [Playbook — Pre-stage optional auth before an external API enforces it (no-op until secret set)](kb-notes/playbook-prestage-optional-external-auth.md) | playbook | published | 2026-06-01 | 2026-06-01 |
| [Methodology — A self-contained injected component must paint its own canvas, not just its text](kb-notes/methodology-self-contained-injected-component-styling.md) | methodology | published | 2026-06-02 | 2026-06-02 |
| [Playbook — Resuming a frozen session: check `main` before rebuilding its in-flight work](kb-notes/playbook-resume-frozen-session-check-main-first.md) | playbook | published | 2026-06-02 | 2026-06-02 |
| [Methodology — Ship generator changes live-on-merge when the artifact regenerates from committed inputs](kb-notes/methodology-ship-generator-changes-live-on-merge.md) | methodology | published | 2026-06-02 | 2026-06-02 |
| [Methodology — Adding a curation surface with a synthesized kb_curation namespace (zero schema migration)](kb-notes/methodology-kb-curation-synthesized-namespace.md) | methodology | published | 2026-06-02 | 2026-06-02 |
| [Methodology — Resolving the V4 articulation-ripple gate when folding a CER unclassified title](kb-notes/methodology-cer-fold-articulation-ripple-sync.md) | methodology | published | 2026-06-03 | 2026-06-03 |
| [Methodology — A consumer must guard fields the baked payload omits but the fallback fills](kb-notes/methodology-consumer-tolerate-omitted-baked-fields.md) | methodology | published | 2026-06-04 | 2026-06-04 |
| [Playbook — Merging two existing CER credentials (existing→existing fold)](kb-notes/playbook-cer-credential-merge.md) | playbook | published | 2026-06-04 | 2026-06-04 |
| [Reference — Dashboard UI design system (tokens + canonical components)](kb-notes/reference-ui-design-system.md) | reference | published | 2026-06-04 | 2026-06-04 |
| [Methodology — Commit the test harness; don't let verification evaporate](kb-notes/methodology-commit-the-test-harness.md) | methodology | published | 2026-06-04 | 2026-06-04 |
| [Reference — AP credit is a GE-Area mapping (the canonical anchor for AP/standardized-exam credentials)](kb-notes/reference-ap-credit-ge-area-canonicalization.md) | reference | published | 2026-06-04 | 2026-06-04 |
| [ADR — Student-impact counts in the public CER (aggregate + small-cell suppression)](kb-notes/adr-cer-student-impact-counts-privacy.md) | adr | published | 2026-06-04 | 2026-06-04 (Session 34 — per-college <2 + minimization + guard) |
| [Methodology — Turn a one-time PII audit into a standing guard (committed test over the public artifacts)](kb-notes/methodology-standing-pii-guard.md) | methodology | published | 2026-06-04 | 2026-06-04 |
| [Methodology — Consolidating near-duplicate course identities within one credential (the ordinal rule)](kb-notes/methodology-within-credential-identity-consolidation.md) | methodology | published | 2026-06-04 | 2026-06-04 (#310 worklist side: co-articulation + SUBJ4 gates) |
| [Reference — Recovering screen/computer-use reach on Claude Code (web)](kb-notes/reference-claude-code-web-environment-reach.md) | reference | published | 2026-06-04 | 2026-06-04 |
| [Methodology — Lazy-load heavy per-tab data behind tab activation](kb-notes/methodology-lazy-load-heavy-tab-data.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [Reference — CPL eligibility (military vs non-military) + the Exhibit CRs Catalog rollup](kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog.md) | reference | published | 2026-06-09 | 2026-06-09 |
| [Methodology — Cron-as-window (reach egress-blocked data via a workflow + run logs)](kb-notes/methodology-cron-as-discovery-window.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [Methodology — Triaging credential-dedup candidates (merge vs leave-split; scope-of-competency)](kb-notes/methodology-credential-dedup-triage.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [ADR — Official C-ID/CCN ids are the common course reference; M-IDs only where none exists (merge-into-official, honors rule, descriptor-catalog targets)](kb-notes/adr-official-ids-as-common-course-reference.md) | adr | published | 2026-06-10 | 2026-06-10 |
| [Methodology — Umbrella-discipline SUBJ4 split (one MQ discipline, many subjects)](kb-notes/methodology-umbrella-discipline-subj4-split.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [Methodology — Fan-in discipline convergence (fold alternate names to a canonical)](kb-notes/methodology-fan-in-discipline-convergence.md) | methodology | published | 2026-06-10 | 2026-06-11 (guard 7) |
| [Methodology — Re-key every id-keyed artifact (the severed promotions index; registry + conservation gates + drift detector)](kb-notes/methodology-rekey-every-id-keyed-artifact.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Auto-layout tables silently park columns off-pane (fixed layout + the inspector rung)](kb-notes/methodology-fixed-table-layout-off-pane-columns.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [`methodology-user-vocabulary-category-maps.md`](kb-notes/methodology-user-vocabulary-category-maps.md) | methodology | Rollup labels owned by the user = curated JSON (`titles{}` source of truth) + `^`-anchored ordered patterns as drift insurance + visible fallback bucket; merge-preserving seeder | 2026-06-11 |
| [`methodology-college-homonym-subject-codes.md`](kb-notes/methodology-college-homonym-subject-codes.md) | methodology | Subject codes are college-local vocabulary: detect homonym lexicon entries (TOP-division votes + minority-title evidence), SCOPE them per college instead of removing, and make inference passes RETRACT their own stale fills (the CRIM M1003 case) | 2026-06-11 |
| [Methodology — Title-similarity merge candidates: the guard suite and the licensure-spec lesson](kb-notes/methodology-title-similarity-merge-guards.md) | methodology | published | 2026-06-12 | 2026-06-12 |
| [Methodology — Witness-kinship gate (historical receipts need a present-tense validity check)](kb-notes/methodology-witness-kinship-gate.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Alias maps are permutations, not graphs (slot-reuse resolution semantics)](kb-notes/methodology-alias-map-resolution-semantics.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Rank a cleanup queue by downstream impact, not structural leverage](kb-notes/methodology-rank-cleanup-by-downstream-impact.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [Methodology — Coarse TOP-division discipline fallback (make the orphan tail visible)](kb-notes/methodology-coarse-top-division-discipline-fallback.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [Methodology — Surface a finer derived layer on a single-grain reference tab](kb-notes/methodology-surface-derived-layer-on-single-grain-tab.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [ADR — Per-college funding-priority metric counts (aggregate + suppression)](kb-notes/adr-funding-priority-metrics-privacy.md) | adr | **RATIFIED** | 2026-06-11 | 2026-06-11 (Sam: "Yes on forks"; shipped #364) |
| [Reference — The P1 completion-data gap (why completions aren't in MAP; the strategy ladder out)](kb-notes/reference-p1-completion-data-gap.md) | reference | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Maintaining a committed-workbook model (one-shot revisions, input-driven builder)](kb-notes/methodology-committed-workbook-models.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Derive theme tokens from brand seeds with a contrast script (the mock is the spec)](kb-notes/methodology-derived-aa-token-palette.md) | methodology | published | 2026-06-12 | 2026-06-12 |
| [Reference — Public-domain art sourcing for the dashboard (Adams 79-AA, CA Impressionists, the four traps)](kb-notes/reference-public-domain-art-sourcing.md) | reference | published | 2026-06-12 | 2026-06-12 |

---

## Lessons docs (`docs/*_lessons.md`)

Workstream-anchored scratchpads. Append a dated section every checkpoint.

| File | Workstream | Last touched |
|---|---|---|
| [`ccr_cluster_cleanup_lessons.md`](ccr_cluster_cleanup_lessons.md) | CCR cleanup — cluster dissolution; Session 37: impact columns + FL SUBJ4 re-mint; Session 38: CCR refinements #333 + the KIN/PE #334 & Drama/Theater #335 fan-in convergences; Session 39: cron verify + the Supabase-mirror fix #337 + the KINE/FLSP strict twin-merge (74 folds) + [`cis_cs_convergence_scope.md`](cis_cs_convergence_scope.md) (GATED); Session 39 cont.: the live-curation loop #339–#342 — merge ≠ verify, UC-CUR retired, official-id merge targets, Spanish → SPAN 100/110/220/230; **Session 40: the severed evidence index — [`official_id_fold_scope.md`](official_id_fold_scope.md) APPROVED + BUILT #344/#345 (promotions re-key applied, plurality rule, 🧾 evidence lane, Phase B 455→1,155 folds, M-ID SPAN 10x anchors retired)**; Sessions 41/42: kinship gate + slot-fix; Session 43: the off-pane-columns bug (#372/#373) + cron no-op verified; **Session 45: rules day — C-ID router statewide #379 (8,377 members, 454 descriptors, dual-approval honesty fix), the CADM homonym machinery #381 (scoped lexicon entries + retraction propagation), the description-evidence worklist lane #382 (474 dark-M-ID groups)**; **Session 46: the AUTO/smog over-mint case — the 🏷 title-evidence lane #385 (IDF title cosine over dark M-IDs + 54k stand-alones, shared guard suite, NO units gate) + the STATEWIDE strict twin-merge #386 (589 token-identical twins absorbed, guard-clique gated, Sam-confirmed smog families → AUTO M1001 / M1007)** | **Session 46 (2026-06-12)** |
| [Scope — C-ID articulation authority (the math cleanup)](cid_articulation_authority_scope.md) | 2026-06-11 | 2026-06-11 |
| [`dashboard_cleanup_lessons.md`](dashboard_cleanup_lessons.md) | Dashboard cleanup (renames, CER, slim header, SUBJ filters, Exhibit Adoption tab) + cross-disc accounting + 3 rule changes; **Session 23: #2 sidebar sub-links + #3 display-label map** | Session 23 (Bruh 23, 2026-05-31) |
| [`engineering_practices_lessons.md`](engineering_practices_lessons.md) | Dev infra / testing / design system (committed jsdom harness + CI, stop-hook fix, `:root` tokens + `var()` rule, prototype-first) | **Session 32 (Busy Feynman, 2026-06-04) NEW** |
| [`common_subject_code_tab_lessons.md`](common_subject_code_tab_lessons.md) | CSC tab / canonical SUBJ4 / CSC-G; **Session 37: orphan-tail discipline fallback #330 + FL-split CSR search/display #331** | **Session 37 (2026-06-09)** |
| [`cpl_assistant_lessons.md`](cpl_assistant_lessons.md) | CPL Assistant (in-dashboard RAG chatbot tab; Phase 1 shipped + live `cpl-chat` v14) | **Session 26 (Bruh 26, 2026-06-01) NEW** |
| [`cpl_funding_lessons.md`](cpl_funding_lessons.md) | CPL Implementation Funding tab — full arc #352–#368: shell → data/renderer → what-if sandbox → shares-first rev2 workbook → P2/P3 actuals (ratified ADR) → roster edits + no-scroll rule. Scope: [`funding_priority_metrics_scope.md`](funding_priority_metrics_scope.md); own handoff: [`cpl_funding_handoff.md`](cpl_funding_handoff.md) | **2026-06-11 (13 PRs, Rule-8 checkpointed)** |
| [`first_light_lessons.md`](first_light_lessons.md) | First Light — daily PD plein air greeting LIVE (#394/#396: gallery reveal, read-aloud, anonymous write-only reflections) + the theme spec (prototype v1.4.2 BLESSED: derived AA tokens, glass=chrome/opaque=data, solid uniform chips); next = the live retheme | **Session 48 (2026-06-12) NEW** |
| [`coursecontrolnumber_remint.md`](coursecontrolnumber_remint.md) | Re-mint playbook (THE reference) | Session 5 |
| [`excel_to_supabase_lessons.md`](excel_to_supabase_lessons.md) | Excel → Supabase migration (Phase 1 + Activity↔Project + Phase 2 + Budget read-path + **Excel-retirement P1/P2/P4 DONE** + the daily-pipeline reference doc) | **Session 25 (Bruh 25, 2026-06-01)** |
| [`exhibit_canonicalization_lessons.md`](exhibit_canonicalization_lessons.md) | Credential identity / EACR / Cred-Ref / CER triage / **merge tool** | **Session 32 (CER refinement #284/#285/#286 + the existing→existing credential MERGE tool)** |
| [`eacr_consolidation_lessons.md`](eacr_consolidation_lessons.md) | EACR consolidation + gallery (v2) + prescriptive + three-grains + Student view (v3) #301 + the data-unblock loop + **Session 35: CER consolidation EMT 29→18 #308 + the ordinal rule + the CCR worklist co-articulation family merges #310** + **Session 36: perf lazy-load #314 + cross-disc re-mint RSCH/WKEX #315 + the CER Eligible/Students columns from the Exhibit CRs Catalog #318/#319/#320 (the id-namespace Title-bridge)**; **Session 37: CER credential dedup — 21 Signal-B merges #323 + the detector elective-bucket gate #324 (162→77) + "Eligible students" relabel #322** | **Session 37 (2026-06-09)** |
| [`map_api_auth_handoff.md`](map_api_auth_handoff.md) | MAP CustomReport API auth coordination (Teams spec sheet + the no-op pre-stage activation steps) | **Session 27 (2026-06-01) NEW** |
| [`exhibit_unification_vision.md`](exhibit_unification_vision.md) | Credential design doc | retrospective |
| [`letter_curator_handoff.md`](letter_curator_handoff.md) | Letter Curator workstream | Session 10 |
| [`overmerge_remint_lessons.md`](overmerge_remint_lessons.md) | Cross-discipline over-merge re-mint (member_top_divergence → dry-run/apply → split-brain iters) | **Session 18 (2026-05-29)** |
| [`quickstart_chat_lessons.md`](quickstart_chat_lessons.md) | Quick-start chat | Session 10 |
| [`session_26_audit_lessons.md`](session_26_audit_lessons.md) | Session 26 codebase audit + remediation (PII fix, idempotency, security, BUG-1) | **Session 26 (Bruh 26, 2026-06-01)** |
| [`sidebar_lessons.md`](sidebar_lessons.md) | Sidebar / tabs.js router | Session 11 |
| [`statewide_kpi_lessons.md`](statewide_kpi_lessons.md) | Statewide Exhibits KPI card #375 → program-area categories + doublewide #376 + KPI card drag-to-reorder #377 | **Session 44 (2026-06-11) NEW** |
| [`subj4_canonicalization_remint_lessons.md`](subj4_canonicalization_remint_lessons.md) | Phase 1e re-mint | Session 5 |
| [`unified_courses_audit_lessons.md`](unified_courses_audit_lessons.md) | Trust-Card auditor | **Session 18 (`member_top_divergence`)** |
| [`vault_sync_lessons.md`](vault_sync_lessons.md) | Vault auto-sync (Windows Task Scheduler) | Session 11 (NEW) |

---

## Session handoffs (`docs/session_<N>_handoff.md`)

| Session | Moniker | Handoff doc |
|---|---|---|
| 5 → 6 | Bruh Hex | [`session_6_handoff.md`](session_6_handoff.md) |
| 6 → 7 | Bruh Hept | [`session_7_handoff.md`](session_7_handoff.md) |
| 7 → 8 | Octaman | [`session_8_handoff.md`](session_8_handoff.md) |
| 9 → 10 | Sexy Dexy | [`session_10_handoff.md`](session_10_handoff.md) |
| 10 → 11 | Bruh El | [`session_11_handoff.md`](session_11_handoff.md) |
| 11 → 12 | Bruh El (handoff) | [`session_12_handoff.md`](session_12_handoff.md) |
| 12 → 13 | Bruh Dec (handoff) | [`session_13_handoff.md`](session_13_handoff.md) |
| 13 → 14 | Bruh Baker (handoff) | [`session_14_handoff.md`](session_14_handoff.md) |
| 14 → 15 | Bruh Sonnet (handoff) | [`session_15_handoff.md`](session_15_handoff.md) |
| 15 → 16 | Bruh Parallax (handoff) | [`session_16_handoff.md`](session_16_handoff.md) |
| 16 → 17 | Bruh Word (handoff) | [`session_17_handoff.md`](session_17_handoff.md) |
| 17 → 18 | Qualitastic / Q (handoff) | [`session_18_handoff.md`](session_18_handoff.md) |
| 18 → 19 | Cascade (handoff) | [`session_19_handoff.md`](session_19_handoff.md) |
| 19 → 20 | Wizardly Turing (handoff) | [`session_20_handoff.md`](session_20_handoff.md) |
| 20 → 21 | Bruh / "Twenty" (handoff) | [`session_21_handoff.md`](session_21_handoff.md) |
| 22 → 23 | Bruh Sentinel (handoff) | [`session_23_handoff.md`](session_23_handoff.md) |
| 23 → 24 | Bruh 23 (handoff) | [`session_24_handoff.md`](session_24_handoff.md) |
| 24 → 25 | Bruh 24 (handoff) | [`session_25_handoff.md`](session_25_handoff.md) |
| 25 → 26 | Bruh 25 (handoff) | [`session_26_handoff.md`](session_26_handoff.md) |
| 26 → 27 | Bruh 26 / Deuce-Six (handoff) | [`session_27_handoff.md`](session_27_handoff.md) |
| 27 → 28 | Bruh 27 (handoff) | [`session_28_handoff.md`](session_28_handoff.md) |
| 28 → 29 | Bruh 28 (handoff) | [`session_29_handoff.md`](session_29_handoff.md) |
| 29 → 30 | Two-Niner (handoff) | [`session_30_handoff.md`](session_30_handoff.md) |
| 30 → 31 | Session 30 (handoff) | [`session_31_handoff.md`](session_31_handoff.md) |
| 31 → 32 | Session 31 (handoff) | [`session_32_handoff.md`](session_32_handoff.md) |
| 32 → 33 | Busy Feynman (handoff) | [`session_33_handoff.md`](session_33_handoff.md) |
| 33 → 34 | Sleepy Goodall (handoff) | [`session_34_handoff.md`](session_34_handoff.md) |
| 34 → 35 | Lucid Wozniak (handoff) | [`session_35_handoff.md`](session_35_handoff.md) |
| 35 → 36 | CER identity consolidation (handoff) | [`session_36_handoff.md`](session_36_handoff.md) |
| 36 → 37 | perf + cross-disc re-mint + CER Eligible/Students (handoff) | [`session_37_handoff.md`](session_37_handoff.md) |
| 37 → 38 | CER Signal-B dedup + CCR impact columns + Foreign-Language SUBJ4 re-mint (handoff) | [`session_38_handoff.md`](session_38_handoff.md) |
| 38 → 39 | CCR refinements #333 + the KIN/PE #334 & Drama/Theater #335 fan-in convergences (handoff) | [`session_39_handoff.md`](session_39_handoff.md) |
| 39 → 40 | Cron verify + Supabase-mirror fix #337 + KINE/FLSP twin-merge + CIS↔CS scope (handoff) | [`session_40_handoff.md`](session_40_handoff.md) |
| 40 → 41 | The severed evidence index #344/#345 — promotions re-key + plurality rule + evidence lane + anchor retirement (handoff) | [`session_41_handoff.md`](session_41_handoff.md) |
| 41 → 42 | Witness-kinship gate #347 + R4 singletons #348 (handoff) | [`session_42_handoff.md`](session_42_handoff.md) |
| 42 → 43 | Bruh Moonshot — the slot-fix #357 + era guard + C-ID router #365/#366 (handoff) | [`session_43_handoff.md`](session_43_handoff.md) |
| 43 → 44 | Bruh Starlord — cron no-op verified; off-pane-columns fix #370–#373 (handoff) | [`session_44_handoff.md`](session_44_handoff.md) |
| 44 → 45 | Statewide Exhibits KPI card #375/#376 + KPI reorder #377 (handoff) | [`session_45_handoff.md`](session_45_handoff.md) |
| 45 → 46 | CCR rules day: statewide router #379 + homonym repair #381 + description lane #382 (handoff) | [`session_46_handoff.md`](session_46_handoff.md) |
| 46 → 47 | The AUTO/smog over-mint case: 🏷 title lane #385 + statewide twin merge #386 + smog consolidations (handoff) | [`session_47_handoff.md`](session_47_handoff.md) |
| 48 → 49 | First Light design sprint #391–#400: daily plein air greeting LIVE + theme spec v1.4.2 BLESSED → the retheme is GO (handoff) | [`session_49_handoff.md`](session_49_handoff.md) |

---

## Top-level orientation docs

- [`../CLAUDE.md`](../CLAUDE.md) — project memory, Critical Rules, M-ID lifecycle (§11)
- [`roadmap_archive.md`](roadmap_archive.md) — museum annex to CLAUDE.md: completed roadmap rows + Session 26-31 narratives (moved out Session 33 to keep CLAUDE.md to live, steering content)
- [`../README.md`](../README.md) — first-time visitor entry
- [`../kb/README.md`](../kb/README.md) — knowledge-base schemas + generators

## Reference materials

Authoritative external sources we've cached:
- [`reference/`](reference/) — ASCCC / COCI / CCN-CID source documents

---

*This file is auto-maintained at every checkpoint. If you find a stale entry,
the checkpoint command will refresh on the next run; no need to hand-edit.*
