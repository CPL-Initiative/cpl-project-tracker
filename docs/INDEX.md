---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-06-26 (Session 78 — SkyMap: posted `item_updates` now surface ON the Activity/sub-activity/project card face + 📝/👥 deep-links on sub-activity cards, PR #564 — new read-only overlay `card_updates.js`; NEW kb-note methodology-live-overlay-onto-generated-cards)
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
| [Playbook — GitHub scheduled-workflow reliability (diagnose a missed cron + backstop-cron fix)](kb-notes/playbook-github-scheduled-workflow-reliability.md) | playbook | published | 2026-06-01 | 2026-06-22 (S68 — 3-cron ladder + transient-failure resilience) |
| [Playbook — Full Excel retirement final scope (KPI ladder blank-vs-0 crux, D.* helpers, read_projects sunset, 5 forks)](kb-notes/excel-retirement-final-scope.md) | playbook | published | 2026-05-31 | 2026-05-31 |
| [Playbook — CPL Chatbox → dashboard integration + cpl-knowledge-base re-point (shared-backend finding, 6 forks)](kb-notes/cpl-chatbox-integration-scope.md) | playbook | published | 2026-06-01 | 2026-06-01 (Phase 1 SHIPPED + LIVE v14) |
| [Playbook — Redeploying a shared, live Supabase Edge Function safely (capture-before-redeploy, preserve verify_jwt, fail-closed)](kb-notes/playbook-deploy-shared-supabase-edge-function.md) | playbook | published | 2026-06-01 | 2026-06-01 |
| [Reference — Excel dependency audit + fix queue (every remaining .xlsx touchpoint; the "Update→Excel" button)](kb-notes/excel-dependency-audit.md) | reference | published | 2026-06-01 | 2026-06-01 (P1+P2+P4 done) |
| [Reference — Daily dashboard data pipeline (all 7 sources, every KPI's lineage, the committed daily dataset)](kb-notes/reference-daily-dashboard-data-pipeline.md) | reference | published | 2026-06-01 | 2026-06-01 |
| [Reference — Windows PowerShell scripting gotchas (PS 5.1 + Task Scheduler)](kb-notes/reference-windows-powershell-gotchas.md) | reference | published | 2026-05-27 | 2026-05-27 |
| [Reference — Session 26 codebase audit findings catalog (51 findings, ranked fix queue)](kb-notes/reference-codebase-audit-2026-06-01.md) | reference | published | 2026-06-01 | 2026-06-01 |
| [Reference — College short-name dataset + resolver (compact chips across CCR/EACR/CER)](kb-notes/reference-college-short-names.md) | reference | published | 2026-06-02 | 2026-06-02 |
| [Reference — TMC / ADT data model & the C-ID auto-match (the transfer chain, the two in-repo sources, the exact-match rule)](kb-notes/reference-tmc-adt-data-model.md) | reference | published | 2026-06-16 | 2026-06-16 |
| [Playbook — Purge committed PII from git history (CustomReport_latest.json; Rule-5-override force-push)](kb-notes/playbook-pii-history-purge.md) | playbook | published | 2026-06-01 | 2026-06-01 |
| [Playbook — EACR consolidation + master-detail gallery scope (Local+CCC merge, versioned gallery, 3 audience views, 4-phase ladder, backlog)](kb-notes/eacr-consolidation-scope.md) | playbook | published | 2026-06-01 | 2026-06-01 (Session 28: PR-4 prescriptive layer SHIPPED) |
| [Methodology — Versioned prototype gallery (preserve v1, stack v2, graduate the winner)](kb-notes/methodology-versioned-prototype-gallery.md) | methodology | published | 2026-06-01 | 2026-06-01 |
| [Methodology — Styling a native &lt;details&gt;: keep a visible affordance, drive the toggle in JS](kb-notes/methodology-styling-native-details-toggle.md) | methodology | published | 2026-06-01 | 2026-06-01 |
| [Playbook — Pre-stage optional auth before an external API enforces it (no-op until secret set)](kb-notes/playbook-prestage-optional-external-auth.md) | playbook | published | 2026-06-01 | 2026-06-01 |
| [Methodology — A self-contained injected component must paint its own canvas, not just its text](kb-notes/methodology-self-contained-injected-component-styling.md) | methodology | published | 2026-06-02 | 2026-06-02 |
| [Playbook — Resuming a frozen session: check `main` before rebuilding its in-flight work](kb-notes/playbook-resume-frozen-session-check-main-first.md) | playbook | published | 2026-06-02 | 2026-06-02 |
| [Playbook — Runner-as-proxy for an external API the sandbox can't reach (source/verify on a CI runner, commit back)](kb-notes/playbook-runner-as-external-api-proxy.md) | playbook | published | 2026-06-19 | 2026-06-19 |
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
| [Methodology — SUBJ4-consumer semantics: umbrella allowances + alias families mirrored everywhere](kb-notes/methodology-subj4-consumer-semantics.md) | methodology | published | 2026-06-12 | 2026-06-12 |
| [Methodology — re-mint applies: recompute through the dry-run's own allocator, gate on byte-fidelity to the reviewed plan](kb-notes/methodology-apply-equals-spec-via-shared-allocator.md) | methodology | published | 2026-06-12 | 2026-06-12 |
| [Methodology — Witness-kinship gate (historical receipts need a present-tense validity check)](kb-notes/methodology-witness-kinship-gate.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Alias maps are permutations, not graphs (slot-reuse resolution semantics)](kb-notes/methodology-alias-map-resolution-semantics.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [`kb-notes/methodology-fanin-alias-lexicon-contamination.md`](kb-notes/methodology-fanin-alias-lexicon-contamination.md) | Fan-in folds must re-point inference lexicons (the PEDU incident) | Session 51 |
| [`kb-notes/playbook-gated-bulk-autocuration.md`](kb-notes/playbook-gated-bulk-autocuration.md) | Gated bulk auto-curation: dry-run receipt → human skim → md5-pinned server-side apply (auto-merge pass 1) | Session 53 |
| [Methodology — Promoted-record ghosts in candidate worklists (exclude promoted orphans at join time)](kb-notes/methodology-promoted-record-ghosts-in-worklists.md) | methodology | published | 2026-06-15 | 2026-06-15 |
| [Methodology — A similarity threshold can't bridge a zero-overlap synonym; use a curated synonym map](kb-notes/methodology-synonym-map-vs-similarity-threshold.md) | methodology | published | 2026-06-16 | 2026-06-18 (Session 62 — candidate validator) |
| [Playbook — Re-keying a shared DB from a committed re-mint alias map (service-key script in CI + md5 set-equality)](kb-notes/playbook-rekey-shared-db-from-alias-map.md) | playbook | published | 2026-06-15 | 2026-06-15 (Session 56 — the UC-CUR→Z re-mint) |
| [Methodology — Rank a cleanup queue by downstream impact, not structural leverage](kb-notes/methodology-rank-cleanup-by-downstream-impact.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [Methodology — Coarse TOP-division discipline fallback (make the orphan tail visible)](kb-notes/methodology-coarse-top-division-discipline-fallback.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [Methodology — Surface a finer derived layer on a single-grain reference tab](kb-notes/methodology-surface-derived-layer-on-single-grain-tab.md) | methodology | published | 2026-06-09 | 2026-06-09 |
| [ADR — Per-college funding-priority metric counts (aggregate + suppression)](kb-notes/adr-funding-priority-metrics-privacy.md) | adr | **RATIFIED** | 2026-06-11 | 2026-06-11 (Sam: "Yes on forks"; shipped #364) |
| [Reference — The P1 completion-data gap (why completions aren't in MAP; the strategy ladder out)](kb-notes/reference-p1-completion-data-gap.md) | reference | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Maintaining a committed-workbook model (one-shot revisions, input-driven builder)](kb-notes/methodology-committed-workbook-models.md) | methodology | published | 2026-06-11 | 2026-06-11 |
| [Methodology — Derive theme tokens from brand seeds with a contrast script (the mock is the spec)](kb-notes/methodology-derived-aa-token-palette.md) | methodology | published | 2026-06-12 | 2026-06-12 |
| [Methodology — Retheming a generator-owned HTML monolith via token value-swap](kb-notes/methodology-token-retheme-on-generated-html.md) | methodology | published | 2026-06-12 | 2026-06-12 |
| [Reference — Public-domain art sourcing for the dashboard (Adams 79-AA, CA Impressionists, the four traps)](kb-notes/reference-public-domain-art-sourcing.md) | reference | published | 2026-06-12 | 2026-06-12 |
| [ADR — Level-collapsing consolidation: over-merge beats under-merge for CPL (Title 5 §55050; suggestions-only so safe to be aggressive)](kb-notes/adr-level-collapsing-consolidation.md) | adr | published | 2026-06-16 | 2026-06-16 |
| [ADR — Reference-data home: committed JSON by default, Supabase only for live curation](kb-notes/adr-reference-data-committed-json-vs-supabase.md) | adr | published | 2026-06-18 | 2026-06-18 |
| [Methodology — Join loose institutional datasets on the coded key, not freehand text](kb-notes/methodology-coded-key-over-freehand-text-join.md) | methodology | published | 2026-06-18 | 2026-06-18 |
| [Playbook — Digest an anonymous write-only table into a private vault (service-role in CI, output never touches the public repo)](kb-notes/playbook-write-only-table-private-vault-digest.md) | playbook | published | 2026-06-18 | 2026-06-18 |
| [Playbook — Embed a self-contained auth-gated bundle as a dashboard tab (iframe; directory-`src` + `target="_top"`)](kb-notes/playbook-embed-auth-gated-bundle-as-dashboard-tab.md) | playbook | published | 2026-06-19 | 2026-06-19 |
| [Methodology — In-browser doc capture → Claude → tokenless GitHub write (extract-text-to-dodge-proxy-cap, vision blocks, create-new-file deep-link)](kb-notes/methodology-browser-doc-capture-to-claude-and-github.md) | methodology | published | 2026-06-19 | 2026-06-19 |
| [Playbook — A live Edge Function 502 is often a RETIRED model id (diagnose via logs, fix via model swap)](kb-notes/playbook-edge-function-502-retired-model.md) | playbook | published | 2026-06-19 | 2026-06-19 |
| [Scope — CPL Assistant CCR/CER-grounded recommendations + real-time benchmark + landing-site demand signal (D1–D5, build ladder, Custom Reports opportunity)](kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md) | scope | published | 2026-06-19 | 2026-06-19 |
| [Scope — TMC tab → CO-staff ADT review/processing tool (validated PCF↔COCI joins, C-ID coverage limiter, CO-first phased plan)](kb-notes/tmc-co-review-scope.md) | scope | published | 2026-06-20 | 2026-06-20 |
| [Reference — ADT acceptance & course-substitution rules (ASCCC C-ID guidance + STAR Act; the tiered-acceptance engine, structural checklist, per-TMC flexibility)](kb-notes/reference-adt-acceptance-rules.md) | reference | published | 2026-06-20 | 2026-06-20 |
| [Playbook — Unattended news aggregation into a live dashboard tab (free adapters, capability-probe auth, closed-social manual queue, curation boundary)](kb-notes/playbook-cpl-news-aggregation.md) | playbook | published | 2026-06-21 | 2026-06-21 |
| [Methodology — Reworking a generator-managed section without touching the generator (anchor-park + CSS-from-JS + run-twice idempotency)](kb-notes/methodology-regen-safe-section-rework.md) | methodology | published | 2026-06-22 | 2026-06-22 |
| [Scope — TMC ADT supporting-document (COR) upload (private Storage bucket + tmc_submission_docs index; submitting-college uploads; two-feeds-one-model; COCI-embed/SSO graduation path)](kb-notes/tmc-adt-document-upload-scope.md) | scope | published | 2026-06-22 | 2026-06-22 |
| [Reference — CCR curation sync & live-merge durability (instant fold + Supabase replay vs the cron's downstream regen; per-click regen is infeasible)](kb-notes/reference-ccr-curation-sync-and-live-merge.md) | reference | published | 2026-06-23 | 2026-06-23 |
| [Reference — Common SUBJ vs Local SUBJ, and the real discipline↔subject invariant (one discipline → one canonical SUBJ4; C-ID/CCN verbatim; the cardinality table)](kb-notes/reference-common-vs-local-subj-and-discipline-cardinality.md) | reference | published | 2026-06-23 | 2026-06-23 |
| [Methodology — A stacked PR can squash to an empty commit; verify `main` has the diff (branch fresh per PR; the receipt is not the outcome)](kb-notes/methodology-stacked-pr-empty-squash.md) | methodology | published | 2026-06-23 | 2026-06-23 |
| [Methodology — Forward-looking display for a curate-now / re-key-later split (show the destination + a pending marker; don't let the deferred backlog skew the derived map)](kb-notes/methodology-forward-looking-display-curate-now-rekey-later.md) | methodology | published | 2026-06-24 | 2026-06-24 |
| [Reference — Common-Course level convention (Beg/Int/Adv; the §55050 classifier — ranges/words/ordinals win, bare numbers are a curator-overridable hint; the Levels filter + chip)](kb-notes/reference-course-level-convention.md) | reference | published | 2026-06-25 | 2026-06-25 |
| [Reference — Statewide Collaborative (CCC) credit recommendations are not housed at one college (system-wide standards; access via your OWN college's landing page)](kb-notes/reference-statewide-credit-recommendations.md) | reference | published | 2026-06-25 | 2026-06-25 |
| [Methodology — Build a hierarchy from dotted ids without migrating stored keys (id-prefix parenting; re-tier visually, keep the persisted key stable)](kb-notes/methodology-tree-from-dotted-ids-stable-keys.md) | methodology | published | 2026-06-26 | 2026-06-26 |
| [Methodology — Refresh the access token before every write (don't trust a format-valid JWT; the silent-401 phantom-save trap)](kb-notes/methodology-refresh-token-before-write.md) | methodology | published | 2026-06-26 | 2026-06-26 (Session 77 — StarPort) |
| [Methodology — Overlay live data onto generated cards via a stamped data-key hook (generator stamps the hook, a static read-only JS overlay fills it)](kb-notes/methodology-live-overlay-onto-generated-cards.md) | methodology | published | 2026-06-26 | 2026-06-26 (Session 78 — SkyMap) |
| [Playbook — A standalone public page on the COBI Pages site (sits-alone subdir, live data via `../live_metrics.json`, non-tab nav anchor, print-to-PDF)](kb-notes/playbook-standalone-public-page.md) | playbook | published | 2026-06-25 | 2026-06-25 (Session 74 — the Fact Sheet) |

---

## Lessons docs (`docs/*_lessons.md`)

Workstream-anchored scratchpads. Append a dated section every checkpoint.

| File | Workstream | Last touched |
|---|---|---|
| [`ccr_cluster_cleanup_lessons.md`](ccr_cluster_cleanup_lessons.md) | CCR cleanup — cluster dissolution; Session 37: impact columns + FL SUBJ4 re-mint; Session 38: CCR refinements #333 + the KIN/PE #334 & Drama/Theater #335 fan-in convergences; Session 39: cron verify + the Supabase-mirror fix #337 + the KINE/FLSP strict twin-merge (74 folds) + [`cis_cs_convergence_scope.md`](cis_cs_convergence_scope.md) (GATED); Session 39 cont.: the live-curation loop #339–#342 — merge ≠ verify, UC-CUR retired, official-id merge targets, Spanish → SPAN 100/110/220/230; **Session 40: the severed evidence index — [`official_id_fold_scope.md`](official_id_fold_scope.md) APPROVED + BUILT #344/#345 (promotions re-key applied, plurality rule, 🧾 evidence lane, Phase B 455→1,155 folds, M-ID SPAN 10x anchors retired)**; Sessions 41/42: kinship gate + slot-fix; Session 43: the off-pane-columns bug (#372/#373) + cron no-op verified; **Session 45: rules day — C-ID router statewide #379 (8,377 members, 454 descriptors, dual-approval honesty fix), the CADM homonym machinery #381 (scoped lexicon entries + retraction propagation), the description-evidence worklist lane #382 (474 dark-M-ID groups)**; **Session 46: the AUTO/smog over-mint case — the 🏷 title-evidence lane #385 (IDF title cosine over dark M-IDs + 54k stand-alones, shared guard suite, NO units gate) + the STATEWIDE strict twin-merge #386 (589 token-identical twins absorbed, guard-clique gated, Sam-confirmed smog families → AUTO M1001 / M1007)**; **Session 53: auto-merge pass 1 APPLIED (2,272 dependable groups / 5,838 rows, 0 conflicts, band-purity gate, cohort automerge-v1@bot) + the mojibake repair + COCI correction queue + Sam's KPI/popup batch (#418–#424)**; **Session 55: Suggested-merges clarity — ★ merge-target badge #434, self-merge ghosts fixed + Discipline picker clarity #435, "⌕ merge into a different existing course" search picker #436, + the UC-CUR→Z re-mint SCOPE #437**; **Session 56: the UC-CUR → Z-scheme re-mint APPLIED #439 (4,053 ids → SUBJ Z<band><seq>, dry-run 7/7 → Sam's go → atomic land, md5-verified live; reusable Supabase re-key tool + workflow)**; **Session 57: worklist popup polish + the "(NC)" title cleanup #441 (110 singleton + 13 bot curated titles, Supabase + snapshot) + the CONSOLIDATION LOOSENING #442 (_sug_sig level-SAFE → level-COLLAPSING, worklist 229→2,665 anchored / 217→2,519 singleton, suggestions-only); **Session 62: synonym-map growth #461 (ECE/EMT/CNA/HVAC/LVN) + the candidate ambiguity validator**; **Session 69: the CCR UI polish sweep — filter-bar #492, flag chips #493, Disciplines legend #495, worklist search #496 + the live-merge durability note**; **Session 70: the CCR merge-workspace arc — Pending-merges panel + mint→Common SUBJ preview #500; re-discipline-on-merge + forward-looking Common SUBJ #503; search-add fix #504; band filters #505; Conservative↔Aggressive slider #506; opt-in checkboxes #507; morphological-variant fold + cross-discipline flag #508/#509** | **Session 70 (PaintSky, 2026-06-24)** |
| [Scope — Similar-course family consolidation (level-collapsing, the measure-first dry-run + the over-merge decision; loosening shipped #442)](similar_course_family_scope.md) | 2026-06-16 | 2026-06-16 |
| [Scope — UC-CUR → Z-scheme re-mint (full re-key of 4,053 synthetic ids → SUBJ Z<band><seq>; Rule 7, **APPLIED Session 56**, PR #439)](uc_cur_zscheme_remint_scope.md) | 2026-06-15 | 2026-06-15 |
| [Scope — Unverified-M-ID renumber re-mint (close gaps + re-sort; full Rule-7, unverified-only, ONE pass after the merge wave; the grounded re-key chain; #494)](unverified_mid_renumber_scope.md) | 2026-06-23 | 2026-06-23 |
| [Scope — CCR merge-workspace EPIC (consolidate the two merge popups into one shared MergeEditor + dock the worklist panel; divergence table, two-feeders design, 4-PR ladder, Session 71)](ccr_merge_workspace_epic_scope.md) | 2026-06-24 | 2026-06-24 |
| [`ccr_merge_workspace_lessons.md`](ccr_merge_workspace_lessons.md) — Session 71: the shared-editor extraction (#511–#518); two-feeders/one-editor design, the seed-`k` precedence bug, deterministic-splice method. **Session 72 (StarLander): the post-consolidation polish pass — 14 PRs #520–#534 (Wave 1/2 six asks + candidate slider; Wave 3 nine refinements #527–#531; Wave 4 Beg/Int/Adv relabel #532; Wave 5 #534 — decouple-from-CCR-filters + keyword-surfaces-all + single-course-rename→Save + header Prev/Next)** | 2026-06-24 | 2026-06-25 |
| [Scope — C-ID articulation authority (the math cleanup)](cid_articulation_authority_scope.md) | 2026-06-11 | 2026-06-11 |
| [`cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) | Team & RACI tab + the update-nudge loop. **Session 77 (StarPort):** the full nudge → braindump → CC-writes-it-up → card loop + the save-persistence token-refresh fix (#556–#562). **Session 78 (SkyMap):** posted `item_updates` surface ON the Activity/sub-activity/project card face + 📝/👥 deep-links on sub-activity cards (#564, `card_updates.js`) | **Session 78 (SkyMap, 2026-06-26)** |
| [`dashboard_cleanup_lessons.md`](dashboard_cleanup_lessons.md) | Dashboard cleanup (renames, CER, slim header, SUBJ filters, Exhibit Adoption tab) + cross-disc accounting + 3 rule changes; **Session 23: #2 sidebar sub-links + #3 display-label map** | Session 23 (Bruh 23, 2026-05-31) |
| [`engineering_practices_lessons.md`](engineering_practices_lessons.md) | Dev infra / testing / design system (committed jsdom harness + CI, stop-hook fix, `:root` tokens + `var()` rule, prototype-first) | **Session 32 (Busy Feynman, 2026-06-04) NEW** |
| [`common_subject_code_tab_lessons.md`](common_subject_code_tab_lessons.md) | CSC tab / canonical SUBJ4 / CSC-G; **Session 37: orphan-tail discipline fallback #330 + FL-split CSR search/display #331** | **Session 37 (2026-06-09)** |
| [`cpl_assistant_lessons.md`](cpl_assistant_lessons.md) | CPL Assistant (in-dashboard RAG chatbot tab); **Session 64: the retired-model 502 fix (cpl-chat v15, `claude-sonnet-4-6`) + the CCR/CER recommender + benchmark + landing-site demand kickoff (scope #472)** | **Session 64 (Startripper, 2026-06-19)** |
| [`cpl_funding_lessons.md`](cpl_funding_lessons.md) | CPL Implementation Funding tab — full arc #352–#368: shell → data/renderer → what-if sandbox → shares-first rev2 workbook → P2/P3 actuals (ratified ADR) → roster edits + no-scroll rule. Scope: [`funding_priority_metrics_scope.md`](funding_priority_metrics_scope.md); own handoff: [`cpl_funding_handoff.md`](cpl_funding_handoff.md) | **2026-06-11 (13 PRs, Rule-8 checkpointed)** |
| [`tmc_builder_lessons.md`](tmc_builder_lessons.md) | TMC Builder tab — interactive ADT submission (fixed C-ID left / per-college COCI-dropdown right, C-ID auto-match, Total Units, Save/Resume + export); Session 60 list-first + GE companion; Session 61: the per-college approved-ADT overlay #458; **Session 66: the CO-review pivot — Active/Approved split #477, scope + ASCCC acceptance ruleset #478, acceptance metadata on the templates #479 (flexible slots + per-TMC flexibility + recovered C-IDs)**. Data model: [`kb-notes/reference-tmc-adt-data-model.md`](kb-notes/reference-tmc-adt-data-model.md); scope: [`kb-notes/tmc-co-review-scope.md`](kb-notes/tmc-co-review-scope.md); rules: [`kb-notes/reference-adt-acceptance-rules.md`](kb-notes/reference-adt-acceptance-rules.md); **Session 69: title-fill recovery for approved + in-progress ADTs #489/#490 + the COR-upload scope #491 ([`kb-notes/tmc-adt-document-upload-scope.md`](kb-notes/tmc-adt-document-upload-scope.md))** | **Session 69 (Stargaze, 2026-06-23)** |
| [`first_light_lessons.md`](first_light_lessons.md) | First Light — daily PD plein air greeting LIVE (#394/#396: gallery reveal, read-aloud, anonymous write-only reflections) + the theme spec (prototype v1.4.2 BLESSED: derived AA tokens, glass=chrome/opaque=data, solid uniform chips); retheme shipped S49; **S62: local-day rotation + the reflections digest #460; S65: gallery 3→89 + the runner-as-Commons-proxy sourcing pipeline #474** | **Session 65 (2026-06-19)** |
| [`cobi_lessons.md`](cobi_lessons.md) | COBI — masthead rename #475 (Mamba brand layer); **Session 68: the single-row masthead consolidation #487 — app bar (seal + COBI`CPL` / centered "Where To?" search / ℹ About popover + Manually Refresh COBI), Mamba retired, regen-safe port (anchor-park + CSS-from-JS)** | **Session 68 (2026-06-22)** |
| [`cpl_news_lessons.md`](cpl_news_lessons.md) | CPL News lane — automated harvest (cpl-news-harvest Edge Function: Google News/GDELT/CalMatters/CCCCO/Bluesky + a suggest-a-story queue) → Claude triage → `public.cpl_news` → `#cpl-news` tab (live-read) + CPLBrain vault digest; capability-probe auth; first run 12 CA items (avg rel 0.84) | **Session 67 (Skywatch, 2026-06-21) NEW** |
| [`fact_sheet_lessons.md`](fact_sheet_lessons.md) | Public CPL Fact Sheet — standalone Pages page (`fact-sheet/`) recreating the journalist PDF, live KPIs from `../live_metrics.json` + baked fallback, full COBI KPI grid + Statewide Exhibits section (expandable per-sector lists), "The CPL Bump" CAEL/WICHE citation, the 1,304-vs-1,101 KPI reconciliation, Cambria/Calibri + 0.4in print-to-PDF, non-tab nav-rail launch link; sandbox PDF-extraction + headless-verify notes. PRs #537/#540 | **Session 74 (SkyBlaster, 2026-06-25) NEW** |
| [`kb_portal_lessons.md`](kb_portal_lessons.md) | KB Portal — transplant #464 + login-gated Knowledge Base tab (iframe) #465 + the New-doc composer (draft → Claude polish → tokenless GitHub deep-link) #466/#467 + attachment upload (in-browser pdf.js/mammoth/SheetJS extraction + image downscale) #468 | **Session 63 (2026-06-19) NEW** |
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
| 47 → 50 | Data lane (Bruh Supernova): SUBJ ⇄ CCR checker #388/#402 + 📋 To-Do feed #389 + SUBJ4 fold dry-run #405 (5/5 gates) → the receipted APPLY | [`session_50_handoff.md`](session_50_handoff.md) |
| 50 → 51 | Data lane (Bruh Dawnleader): the SUBJ4 canonical fold APPLIED (71,037-alias permutation + Supabase mirror + post-fold twins + the full Rule-7 chain; collision signal 1,206 → 3) → verify regen, CCR Subject grouping | [`session_51_handoff.md`](session_51_handoff.md) |
| 51 → 53 | Data lane (Bruh Photonicus): KIN/PE pass 2 — PEDU dissolved + TOP-aware ATHL carve-out (1,057 re-keys), 19.7k titles normalized, 205 merges (roster/fitness/HS), lost-saves fix + Keep-as-is + Subject optgroups (#412–#415) → verify regen, the flagged family queues | [`session_53_handoff.md`](session_53_handoff.md) |
| 53 → 54 | Data lane: auto-merge pass 1 applied (2,272 groups, cohort automerge-v1@bot) + mojibake repair + KPI batch → ⚙ chip + Triage lane, title-lane pass-2 decision, post-apply regen verify, MilStudents wiring | [`session_54_handoff.md`](session_54_handoff.md) |
| 54 → 55 | Data lane (Bruh Spaceranger): auto-merge cohort made reviewable — ⚙ auto-merged chip + "Auto-merged" Triage lane LIVE (#428, `auto_n` on 2,272 rows) + Pipeline-tab refresh + post-apply verify → title-lane pass-2 DRY-RUN (Sam's go), per-row revert, ceramic-tech curator pick | [`session_55_handoff.md`](session_55_handoff.md) |
| 55 → 56 | Data lane (Bruh Nebula): Suggested-merges clarity — ★ merge-target badge #434, self-merge ghosts fixed + Discipline picker disable/explain #435, "⌕ merge into a different existing course" search picker #436, + the UC-CUR→Z re-mint SCOPE #437 → build the Z-scheme DRY-RUN (Sam's go), title-lane pass-2 | [`session_56_handoff.md`](session_56_handoff.md) |
| 56 → 57 | Data lane (Star Treader): the UC-CUR → Z-scheme re-mint APPLIED #439 (4,053 ids → SUBJ Z<band><seq>, dry-run 7/7 → Sam's "Go now" → atomic land, live md5-verified; reusable Supabase re-key tool + workflow) → the Z future-mint half + auditor re-run, title-lane pass-2 dry-run, per-row auto-merge revert | [`session_57_handoff.md`](session_57_handoff.md) |
| 57 → 58 | Data lane (Bruh Skydriver): worklist popup polish + "(NC)" cleanup #441 + the CONSOLIDATION LOOSENING #442 (_sug_sig level-COLLAPSING, worklist ~10× bigger, suggestions-only) → the member-join Jaccard 0.5→~0.4 (measure member-flips first), work the bigger worklist, title-lane pass-2 | [`session_58_handoff.md`](session_58_handoff.md) |
| 58 → 59 | Data lane (Bruh Skyleader): extend the merge candidate set — override-rename + segment-fold + completion note #445, synonym map + keyword-gather #446, looseness slider #447, AJ synonym #448 (a threshold can't bridge a zero-overlap synonym — use the map) → the member-join Jaccard 0.5→~0.4 (measure member-flips first), grow the synonym map, title-lane pass-2 | [`session_59_handoff.md`](session_59_handoff.md) |
| 49 → 52 | Design lane (Bruh Orbitron): the First Light retheme SHIPPED (#407 palette flip · #408 glass + ghosted painting · #410 glass-quiet chips; --live contrast lint in CI) → Sam's screenshot verdicts, kpi_reorder keyboard path, per-tab polish | [`session_52_handoff.md`](session_52_handoff.md) |
| 59 → 60 | TMC Builder (Bruh Star Navicus → Momentus): the new tab end-to-end #450–#452 (all 45 official TMCs, C-ID auto-match, curator layer + CO-review queue) → the list-first redesign + GE Breadth companion, then CPL-native TMC wiring | [`session_60_handoff.md`](session_60_handoff.md) |
| 61 → 62 | Bruh Skymarker: the per-college approved-ADT overlay from the COCI program export #458 (`tmc_college_adts.js`, 3,238 pairs/115 colleges/99.9% by TOP code, UCTP own instance, the taxonomy ADR) → faculty-verify the drafts + the `college_short_names.json` taxonomy follow-up | [`session_62_handoff.md`](session_62_handoff.md) |
| 62 → 63 | SkyLion: First Light reflections digest #460 + CCR synonym pairings #461 (candidate validator) → morphological-variant CCR pass (Med Assisting/Assistant) + faculty-verify the TMC drafts | [`session_63_handoff.md`](session_63_handoff.md) |
| 63 → 64 | SkyGate: the KB Portal end-to-end — transplant #464 + login-gated Knowledge Base tab #465 + New-doc composer #466/#467 + attachment upload #468 → smoke-test the 5 attachment types (fix any esm.sh path), the bundle-divergence decision, then data/CCR + TMC lanes | [`session_64_handoff.md`](session_64_handoff.md) |
| 64 → 65 | Startripper: the retired-model 502 fix #471 (`cpl-chat` v15, `claude-sonnet-4-6`) + the CCR/CER recommender + real-time benchmark + landing-site demand kickoff (scope #472) → build the CCR/CER/adoption ETL into shared Supabase, then M1 | [`session_65_handoff.md`](session_65_handoff.md) |
| 65 → 66 | Skyloft: First Light gallery 3→89 via the runner-as-Commons-proxy pipeline #474 + the COBI masthead rename #475 (Mamba brand layer) → the standing data/CCR (CPL-Assistant CCR/CER recommender ETL, green-lit) + TMC + KB-portal lanes resume | [`session_66_handoff.md`](session_66_handoff.md) |
| 66 → 67 | Skylander: TMC → a CO-staff ADT review tool — the Active/Approved split #477, the scope + ASCCC acceptance ruleset #478, the template acceptance metadata #479 (119 flexible slots + per-TMC flexibility + 15 recovered C-IDs, AfAm 0→3) → build the Phase-2 acceptance engine (Sam: "Go for A") + the bulk-PCF Playwright extractor | [`session_67_handoff.md`](session_67_handoff.md) |
| 67 → 68 | Skywatch (nick SkyMurrow): the CPL News lane — cpl-news-harvest Edge Function + cron + `#cpl-news` tab #481 + CPLBrain vault digest #9 (12 CA items, avg rel 0.84; capability-probe auth; closed-social manual queue; CA-first) → the TMC acceptance engine (still queued from the S67 handoff) + CPL News tuning + the public-KB decision | [`session_68_handoff.md`](session_68_handoff.md) |
| 68 → 69 | SkyAlizarin: spotty-cron fixes — the 06:17/09:17/12:17 UTC cron ladder #485 + the curation-sync resilience fix #486 (transient Supabase TLS was killing the whole publish) — AND the COBI masthead consolidation #487 (single-row app bar, ready + tested, holding for Sam's seal upload) → finish #487 (sample the seal navy → merge → dispatch), then the TMC acceptance engine | [`session_69_handoff.md`](session_69_handoff.md) |
| 69 → 70 | Stargaze: TMC title-fill (approved + in-progress ADTs) #489/#490 + the COR-upload scope #491 + the CCR polish sweep — filter-bar #492, flag chips +NC/+CR/NC type #493, Disciplines legend #495, worklist search #496 — + the unverified-M-ID renumber re-mint scope #494 → the Pending-merges tracking panel, then the re-mint build (when merges settle) + the TMC acceptance engine | [`session_70_handoff.md`](session_70_handoff.md) |
| 70 → 71 | PaintSky: the CCR merge-workspace arc (9 PRs) — Pending-merges panel #500, re-discipline-on-merge + forward-looking Common SUBJ #503, search-add fix #504, band filters #505, Conservative↔Aggressive slider #506, opt-in checkboxes #507, morphological-variant fold + cross-discipline flag #508/#509 → the merge-workspace EPIC (dock the worklist as a panel + consolidate the two merge popups, scope-first), then the unverified-M-ID renumber re-mint + the TMC acceptance engine; bonus: more First Light CA plein-air landscapes | [`session_71_handoff.md`](session_71_handoff.md) |
| 71 → 72 | (Session 71) the CCR merge-workspace EPIC, completed in full — #511 scope, #512 PR-1 (extract shared `buildMergeEditor`), #513 PR-2a (hoist to init scope), #514 PR-2b (per-row dialog adopts it, in-row ★ model), #515 lessons, #516 PR-3 (dock the worklist as a right-hand panel), #518 PR-4 (live CCR↔worklist re-filter) → the standing lanes: unverified-M-ID renumber re-mint, TMC acceptance engine, CPL-Assistant recommender ETL | [`session_72_handoff.md`](session_72_handoff.md) |
| 72 → 73 | StarLander: the post-consolidation merge-workspace polish pass — 14 PRs #520–#534 (decouple worklist from CCR filters, keyword-surfaces-all, single-course rename→Save, header Prev/Next) → the standing lanes | [`session_73_handoff.md`](session_73_handoff.md) |
| 74 → 75 | SkyBlaster: the public CPL Fact Sheet — standalone live page (`fact-sheet/`) #537 + Statewide Exhibits section & KPI-count reconciliation #540 → Fact-Sheet follow-ups (live-wire the snapshot tier; tech-landscape → live HTML) + the standing lanes | [`session_75_handoff.md`](session_75_handoff.md) |
| 75 → 76 | SkyMaster: the COBI ownership + nudge + report layer — workplan-alignment regroup #545, Team & RACI tab + registry #546, nudge toggle + test modes #547, editable Directory cells #548; Annual Report draft delivered (not a tab yet) → the RACI carry-overs (matrix filter, nudge SEND channel, `allowed_reviewers`, per-card RACI links, `update_log`, Report tab) | [`session_76_handoff.md`](session_76_handoff.md) |
| 76 → 77 | SkyTrek: Team & RACI — matrix **filter** + per-card **`👥 RACI` deep-links** #550, the **CI-poll-via-MCP** learning → CLAUDE.md #552, and the **3-tier matrix** (Activity → sub-activity → project, hierarchical filter) #553; PLUS the **Veterans Sprint + Military Base dp plans** added to the vault (CPLBrain #10/#11) and a scrubbed public-KB mirror (draft PR #15, awaiting Sam) → the decision-gated RACI carry-overs (nudge channel, lead emails, `update_log`) + the Annual Report tab + the standing lanes | [`session_77_handoff.md`](session_77_handoff.md) |
| 77 → 78 | StarPort: the RACI update loop end-to-end (8 PRs #556–#562) — Copy-RACI #556, Annual Report tab #557, check-all/clear-all + manual nudge #558, **the save-persistence token-refresh fix** + nudge accountability #559, the 📝 braindump→CC composer + `item_updates` #560, per-item 📣 nudge #561, 📝 on every card #562 → surface `item_updates` on the card face + Annual Report (self-freshening); the 3 lead emails; standing lanes | [`session_78_handoff.md`](session_78_handoff.md) |
| 78 → 79 | SkyMap: posted updates surface ON the card face (PR #564) — 📝/👥 deep-links on sub-activity cards + the read-only `card_updates.js` overlay (newest `item_updates` per `activity:N`/`project:<id>` key → card, hides the creation-era line); NEW kb-note `methodology-live-overlay-onto-generated-cards` → the Annual Report half of the same carryover (fold `item_updates` into `annual_report.js`); the 3 lead emails; standing lanes | [`session_79_handoff.md`](session_79_handoff.md) |

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
