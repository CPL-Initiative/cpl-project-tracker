---
title: Dependency map — dataset to consuming tabs, scripts, workflows and surfaces
created: 2026-08-30
tags: [reference, dependency-map, cross-impact, supabase, cron, pipeline]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
---

# Dependency map — who consumes what

**GENERATED — do not hand-edit.** Rebuild: `python3 kb/_build_dependency_map.py`
(`--check` exits 1 when stale; wired into `js-tests.yml`). Full edge list with
file:line evidence: [`kb/dependency_map.json`](../../kb/dependency_map.json).

This answers the cross-impact question CLAUDE.md orders every session to ask:
*for a given dataset — Supabase table, generated JS, JSON — which tabs, scripts,
workflows and public surfaces consume it?* Derived from the code, not the docs.
Consumer vocabulary: **tabs** are COBI tab ids (`data-tab`); **modules** are JS
files not attributed to a tab; **pages** are standalone HTML surfaces; scripts
and workflows by path. tests/ and docs/ are deliberately not consumers.

## The direct-to-main lane (bypasses PRs — Pages serves from main)

Workflows that commit to `main` without a PR. `js-tests` gating (ruling E)
closes the PR path only; THIS lane stays open by design.

| Workflow | Schedule | Push shape | Commits |
|---|---|---|---|
| `cos-authority-sync.yml` | `17 8 3 * *` | main (cron checkout) | `kb/reference/cos_certifications.json`, `kb/cos_matches.json`, `kb/cos_match_out/` |
| `cpl-landing-pages.yml` | `37 14 * * 1` | main (cron checkout) | `chatbox/college_landing_pages.json` |
| `cpl-stories.yml` | `23 7 * * 1` | main (cron checkout) | `fact-sheet/cpl_stories.js` |
| `cred-rename-apply.yml` | dispatch-only | main | `kb/credentials.json`, `kb/unified_titles.json`, `kb/coci_articulations.json`, `kb/credential_review_overlay.json`, `kb/cred_rename_dryrun/`, `kb/cred_rename_out/` |
| `daily-dashboard.yml` | `17 6 * * *`; `17 9 * * *`; `17 12 * * *` | main | `index.html`, `CPL_Dashboard.html`, `CPL_Data.js`, `live_metrics.json`, `kpi_history.json`, `statewide_data.js`, `fact-sheet/statewide_recs.js`, `fact_sheet_metrics.json`, `statewide_prescriptive.js`, `college_activity.js`, `college_activity_template.html`, `kb/coci_curation.json`, `unified_courses_data.js`, `unified_courses_index.js`, `unified_courses_details.js`, `unified_courses_standalone.js`, `unified_courses_members.js`, `unified_courses_member_desc.js`, `unified_courses_suggestions.js`, `unified_courses_aligned.js`, `credential_reference_data.js`, `kb/row_audit/latest.json`, `kb/row_audit/*.md`, `exports/unified_courses.xlsx`, `cpl_pathways_membership_data.js`, `kb/discipline_canonical_subj4.json`, `kb/discipline_cpl_rollup.json`, `kb/credential_review_overlay.json`, `kb/governance_candidates.json`, `kb/cr_reference_worklist.json`, `kb/unclassified_assignments.json`, `kb/unified_titles.json`, `kb/credentials.json`, `kb/coci_articulations.json`, `kb/unclassified_fold/`, `kb/exhibit_audit/latest.json`, `kb/exhibit_audit/*.md`, `kb/unclassified_suggestions.json`, `kb/coci_title_corrections.json`, `kb/coci_duplicate_control_numbers.json`, `kb/cred_rename_dryrun/report.md`, `kb/cred_rename_dryrun/alias_map.json`, `kb/cred_rename_dryrun/collisions.json`, `cpl_funding_performance.js`, `cpl_funding_ess.js`, `veteran_jst.json`, `kb/workplan_goals_snapshot.json`, `kb/projects_snapshot.json`, `kb/project_lifecycle.json`, `kb/budget_snapshot.json`, `reports/CPL_Master_Report.docx`, `reports/projects/*.docx` |
| `moc-crosswalk-sync.yml` | `17 8 5 * *` | main (cron checkout) | `kb/reference/moc_crosswalk.json` |
| `overmerge-apply.yml` | dispatch-only | main | `kb/coci_minted_courses.json`, `kb/coci_minted_singletons.json`, `kb/coci_minted_memberships.json`, `kb/coci_articulations.json`, `kb/coci_unified_courses.json`, `kb/coci_curation.json`, `kb/overmerge_out/`, `kb/overmerge_apply/`, `kb/row_audit/` |
| `phase-1e-apply.yml` | dispatch-only | main | `kb/coci_minted_courses.json`, `kb/coci_minted_singletons.json`, `kb/coci_minted_memberships.json`, `kb/coci_articulations.json`, `kb/coci_unified_courses.json`, `kb/coci_curation.json`, `kb/discipline_canonical_subj4.json`, `kb/subj4_dryrun/`, `kb/subj4_apply/`, `kb/row_audit/` |
| `phase-1e-sync.yml` | dispatch-only | main | `kb/discipline_canonical_subj4.json`, `kb/subj4_dryrun/` |
| `program-course-fetch.yml` | `23 8 * * 0` | main | `kb/reference/coci_program_course_file.csv`, `kb/reference/coci_program_file.csv`, `kb/program_course_graph.json` |
| `projects-seed-apply.yml` | dispatch-only | main | `kb/projects_validation.md`, `kb/projects_seed_plan.md`, `kb/projects_seed_out/` |
| `weekly-reflections-summary.yml` | `0 15 * * 1` | main (cron checkout) | `reflections/summary.json` |
| `workplan-goals-seed-apply.yml` | dispatch-only | main | `kb/workplan_goals_validation.md`, `kb/workplan_goals_seed_plan.md`, `kb/workplan_goals_seed_out/` |

`pages.yml` deploys after "Daily CPL Dashboard", "cos-authority-sync" by workflow NAME — runner-token pushes fire no
push triggers, so this name edge is the only deploy path for cron commits.

## Supabase tables

Rule 10's blast-radius question, computed. Directions come from the HTTP
method nearest each reference; a table both read and written lists in both
columns. Sam curates these LIVE — check who else reads before any bulk write.

| Dataset | Read by | Written by |
|---|---|---|
| `allowed_reviewers` | `edgefn:cpl-news-harvest` | — |
| `budget_funding` | tabs: `budget`, `college-briefing`, `implementation-funding` · scripts: `excel_to_dashboard.py`, `kb/_load_budget.py`, `kb/_test_budget_cutover.py` | tabs: `budget` |
| `chat_interactions` | tabs: `sierra-training` | `edgefn:cpl-chat` |
| `chatbox_college_courses` | none found | scripts: `kb/_sync_college_courses.py` |
| `chatbox_college_profiles` | scripts: `map/sync_map_users.py` · `edgefn:cpl-chat` | — |
| `chatbox_credential_recs` | none found | scripts: `kb/_sync_credential_recs.py` |
| `chatbox_credentials` | tabs: `college-briefing` · `edgefn:cpl-chat` | scripts: `kb/_sync_credential_catalog.py` |
| `chatbox_exhibits` | `edgefn:cpl-chat` | — |
| `chatbox_peer_articulations` | none found | scripts: `kb/_sync_peer_articulations.py` |
| `cobi_nav` | pages: `CPL_Dashboard.html` | tabs: `admin` |
| `college_geo` | `edgefn:cpl-chat` | — |
| `cpl_adoption_interest` | tabs: `cpl-pathways` | tabs: `cpl-pathways` |
| `cpl_contract_deliverables` | tabs: `contracts` | — |
| `cpl_contract_documents` | tabs: `contracts` | tabs: `contracts` |
| `cpl_contract_reports` | tabs: `contracts` | tabs: `contracts` |
| `cpl_contracts` | tabs: `contracts` | — |
| `cpl_document_sections` | `edgefn:cpl-chat` | — |
| `cpl_documents` | `edgefn:cpl-chat` | — |
| `cpl_funding_config` | tabs: `college-briefing`, `implementation-funding` | tabs: `college-briefing`, `implementation-funding` |
| `cpl_funding_notes` | tabs: `college-briefing`, `implementation-funding` | tabs: `college-briefing`, `implementation-funding` |
| `cpl_funding_participation` | tabs: `college-briefing`, `implementation-funding` | tabs: `college-briefing`, `implementation-funding` |
| `cpl_memory` | tabs: `memory` | tabs: `memory` |
| `cpl_memory_log` | none found | tabs: `memory` |
| `cpl_news` | tabs: `cpl-news` · `edgefn:cpl-news-harvest` | tabs: `cpl-news` · `edgefn:cpl-news-harvest` |
| `cpl_news_requests` | `edgefn:cpl-news-harvest` | tabs: `cpl-news` · `edgefn:cpl-news-harvest` |
| `cpl_reflections` | pages: `CPL_Dashboard.html` · scripts: `reflections/build_reflections_digest.py`, `reflections/build_reflections_summary.py` | pages: `CPL_Dashboard.html` |
| `cr_reference_decisions` | tabs: `cr-reference` | tabs: `cr-reference` |
| `factsheet_overrides` | pages: `fact-sheet/index.html` | pages: `fact-sheet/index.html` |
| `governance_owners` | tabs: `governance`, `map-queue` | tabs: `governance` |
| `gr_areas` | tabs: `gr-priorities` | tabs: `gr-priorities` |
| `gr_artifacts` | tabs: `gr-priorities` | tabs: `gr-priorities` |
| `gr_memo_sections` | tabs: `gr-priorities` | tabs: `gr-priorities` |
| `gr_memos` | tabs: `gr-priorities` | tabs: `gr-priorities` |
| `gr_revisions` | tabs: `gr-priorities` | tabs: `gr-priorities` |
| `item_raci` | tabs: `raci` · modules: `master_report.js` · pages: `CPL_Dashboard.html` | tabs: `raci` |
| `item_updates` | tabs: `annual-report`, `raci` · modules: `master_report.js` · pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py`, `kb/_load_projects.py` | tabs: `raci` |
| `kb_curation` | tabs: `canonical-subj4`, `credential-reference`, `map-export`, `unified-courses`, `vision-2030` · scripts: `kb/_apply_canonical_subj4.py`, `kb/_apply_credential_review.py`, `kb/_apply_curation.py`, `kb/_apply_unclassified_triage.py`, `kb/_cred_rename_apply_supabase.py`, `kb/_eacr_flag_migrate.py`, `kb/_overmerge_apply_supabase.py`, `kb/_preseed_unclassified.py`, `kb/_rekey_kb_curation_supabase.py`, `kb/_subj4_apply_supabase.py` | tabs: `canonical-subj4`, `credential-reference`, `unified-courses`, `vision-2030` · scripts: `kb/_cred_rename_apply_supabase.py`, `kb/_eacr_flag_migrate.py`, `kb/_overmerge_apply_supabase.py`, `kb/_preseed_unclassified.py`, `kb/_rekey_kb_curation_supabase.py`, `kb/_subj4_apply_supabase.py` |
| `liftoff_state` | pages: `CPL_Dashboard.html` | pages: `CPL_Dashboard.html` |
| `map_cleanup_worklist` | tabs: `map-data-quality` | — |
| `map_college_contacts` | tabs: `college-briefing`, `college-identity`, `map-queue`, `map-users` · `edgefn:cpl-chat` | — |
| `map_college_cr_unit` | tabs: `college-briefing` · scripts: `chatbox/smoke_test.sh` | — |
| `map_college_credit_summary` | tabs: `college-briefing` · scripts: `chatbox/smoke_test.sh` · `edgefn:cpl-chat` | — |
| `map_college_goal2` | tabs: `college-briefing` · scripts: `chatbox/smoke_test.sh` · `edgefn:cpl-chat` | — |
| `map_college_nudges` | tabs: `governance`, `map-queue`, `map-users` | tabs: `map-queue`, `map-users` |
| `map_college_users` | tabs: `map-queue`, `map-users` | — |
| `map_colleges` | tabs: `college-briefing`, `college-identity` · scripts: `chatbox/smoke_test.sh` · `edgefn:cpl-chat` | — |
| `map_contact_gaps` | tabs: `governance`, `map-queue`, `map-users` | — |
| `map_contact_proposals` | tabs: `map-queue`, `map-users` | tabs: `map-queue`, `map-users` |
| `map_credential_student_rollup` | tabs: `college-briefing` | — |
| `map_cx_exhibit_guidance` | tabs: `map-data-quality` | — |
| `map_data_loads` | tabs: `map-queue` · `edgefn:cpl-chat` | — |
| `map_data_quality` | tabs: `map-data-quality` | tabs: `map-data-quality` |
| `map_student_credit` | scripts: `chatbox/smoke_test.sh` | — |
| `map_student_key_sketch` | scripts: `kb/_sync_map_custom_reports.py` | — |
| `merge_doctrine_notes` | none found | tabs: `unified-courses` |
| `nc_artifacts` | tabs: `nc-learning-partners` | — |
| `nc_integration_backlog` | tabs: `nc-learning-partners` | — |
| `nc_partner_notes` | tabs: `nc-learning-partners` | — |
| `personnel` | scripts: `excel_to_dashboard.py`, `kb/_load_budget.py`, `kb/_test_budget_cutover.py` | — |
| `project_lifecycle` | tabs: `raci` · pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py`, `kb/_load_projects.py` | pages: `CPL_Dashboard.html` |
| `projects` | pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py`, `kb/_load_projects.py`, `kb/_seed_projects.py`, `kb/_seed_projects_apply.py`, `kb/_validate_projects.py` | tabs: `workplan-goals` · pages: `CPL_Dashboard.html` · scripts: `kb/_seed_projects_apply.py` |
| `sierra_feedback` | tabs: `governance`, `map-queue`, `sierra-training` · scripts: `chatbox/smoke_test.sh` | — |
| `sierra_guidance` | tabs: `sierra-training` · `edgefn:cpl-chat` | tabs: `sierra-training` |
| `sierra_rules` | tabs: `sierra-training` · `edgefn:cpl-chat` | tabs: `sierra-training` |
| `sierra_turn_review` | tabs: `sierra-training` | tabs: `sierra-training` |
| `stg_map_ace_exhibit_titles` | scripts: `kb/_sync_map_custom_reports.py` | — |
| `stg_map_college_cr_unit` | scripts: `kb/_sync_map_custom_reports.py` | — |
| `stg_map_student_credit` | scripts: `kb/_sync_map_custom_reports.py` | — |
| `team_access` | tabs: `sierra-training`, `team-phrases` | tabs: `team-phrases` |
| `team_members` | tabs: `raci` · scripts: `nudges/build_nudges.py` | tabs: `raci` |
| `tmc_curator_notes` | tabs: `tmc-builder` | tabs: `tmc-builder` |
| `tmc_submissions` | tabs: `tmc-builder` | tabs: `tmc-builder` |
| `workplan_activity_associations` | pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py`, `kb/_load_workplan_goals.py`, `kb/_seed_workplan_goals.py`, `kb/_seed_workplan_goals_apply.py`, `kb/_validate_workplan_goals.py` | tabs: `workplan-goals` · pages: `CPL_Dashboard.html` |
| `workplan_goals` | scripts: `excel_to_dashboard.py`, `kb/_load_workplan_goals.py`, `kb/_seed_workplan_goals.py`, `kb/_seed_workplan_goals_apply.py`, `kb/_validate_workplan_goals.py` | tabs: `workplan-goals` |

## Supabase RPCs

| Dataset | Read by | Written by |
|---|---|---|
| `cobi_rls_gates` | tabs: `admin` | — |
| `coci_offerings_replace` | scripts: `chatbox/sync_coci_offerings.py` | — |
| `coci_programs_replace` | scripts: `chatbox/sync_coci_offerings.py` | — |
| `college_adoption_opportunities` | `edgefn:cpl-chat` | — |
| `college_geo_replace` | scripts: `chatbox/sync_coci_offerings.py` | — |
| `cpl_funding_optin_review` | tabs: `college-briefing`, `implementation-funding` | — |
| `credential_alignment_for_college` | `edgefn:cpl-chat` | — |
| `credential_recs_for_titles` | `edgefn:cpl-chat` | — |
| `fin_pass_ok` | pages: `CPL_Dashboard.html` | — |
| `gr_pass_ok` | tabs: `gr-priorities` · pages: `CPL_Dashboard.html` | — |
| `map_clear_custom_report_staging` | scripts: `kb/_sync_map_custom_reports.py` | — |
| `map_contacts_replace` | scripts: `map/sync_map_users.py` | — |
| `map_coordinator_summary` | tabs: `college-briefing`, `implementation-funding` | — |
| `map_promote_custom_reports` | scripts: `kb/_sync_map_custom_reports.py` | — |
| `map_users_replace` | scripts: `map/sync_map_users.py` | — |
| `map_users_summary` | tabs: `map-queue`, `map-users` | — |
| `match_document_sections` | `edgefn:cpl-chat` | — |
| `nc_artifact_revise` | tabs: `nc-learning-partners` | — |
| `nc_partner_note_revise` | tabs: `nc-learning-partners` | — |
| `search_college_credentials` | `edgefn:cpl-chat` | — |
| `search_college_offerings` | scripts: `chatbox/smoke_test.sh` · `edgefn:cpl-chat` | — |
| `search_credential_volume` | `edgefn:cpl-chat` | — |
| `search_credentials_any` | `edgefn:cpl-chat` | — |
| `search_exhibits_by_topic` | `edgefn:cpl-chat` | — |
| `search_exhibits_by_topic_v2` | `edgefn:cpl-chat` | — |
| `search_statewide_recommendations` | `edgefn:cpl-chat` | — |
| `sierra_feedback_set_status` | tabs: `sierra-training` | — |
| `sierra_feedback_upsert` | tabs: `chatbot` · pages: `sierra/index.html` · scripts: `chatbox/smoke_test.sh` | — |
| `team_pass_ok` | tabs: `raci` · pages: `CPL_Dashboard.html`, `kb-portal/index.html` | — |
| `tmc_review_submission` | tabs: `tmc-builder` | — |

## Edge functions

| Dataset | Read by | Written by |
|---|---|---|
| `cpl-chat` | tabs: `chatbot`, `gr-priorities`, `memory` · pages: `fact-sheet/index.html`, `sierra/index.html` | produced by: `chatbox/supabase/functions/cpl-chat/index.ts`, `cpl-chat-deploy.yml` |
| `cpl-chat-preview` | none found | produced by: `cpl-chat-preview-ab.yml` |
| `cpl-news-harvest` | none found | produced by: `chatbox/supabase/functions/cpl-news-harvest/index.ts` |
| `generate-letter` | pages: `budget-support/web/curator.html`, `budget-support/web/new-letter.html` | — |
| `letter-curator` | pages: `budget-support/web/curator.html`, `budget-support/web/new-letter.html` | — |

## Storage buckets

| Dataset | Read by | Written by |
|---|---|---|
| `ccr-desc` | pages: `prototype/skyview.html` | — |
| `factsheet-images` | pages: `fact-sheet/index.html` | pages: `fact-sheet/index.html` |

## Generated JS data artifacts

| File | Global | Producer | Consumed by |
|---|---|---|---|
| `CPL_Data.js` | `CPL_DATA` | `excel_to_dashboard.py` | tabs: `annual-report`, `college-briefing`, `implementation-funding`, `raci` · modules: `generate_reports.js`, `master_report.js` · pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` |
| `cip_crosswalk_data.js` | `CIP_CROSSWALK` | `kb/_build_cip_crosswalk.py` | tabs: `cip-crosswalk` · modules: `kb/build_cip_status_counts.js` · pages: `CPL_Dashboard.html` · scripts: `kb/_build_cip_crosswalk.py`, `kb/_build_noncredit_cip_categories.py`, `kb/_classify_noncredit_programs.py` |
| `cobi_admin_surface.js` | `COBI_ADMIN_SURFACE` | `kb/_build_cobi_admin_surface.py` | tabs: `admin` · pages: `CPL_Dashboard.html` |
| `coci_lookup_data.js` | `CPL_COCI_LOOKUP` | `kb/_build_coci_lookup.py` | tabs: `coci-lookup` · pages: `CPL_Dashboard.html` · scripts: `kb/_build_coci_lookup.py`, `kb/_csr_trail.py` |
| `coci_lookup_desc_A.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_B.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_C.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_D.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_E.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_F.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_G.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_H.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_I.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_J.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_K.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_L.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_M.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_N.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_O.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_P.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_Q.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_R.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_S.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_T.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_U.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_V.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_W.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_Y.js` | `CPL_COCI_DESC` | not stated in header | none found |
| `coci_lookup_desc_Z.js` | `CPL_COCI_DESC` | not stated in header | tabs: `coci-lookup` |
| `coci_programs_data.js` | `CPL_COCI_PROGRAMS` | `kb/_build_coci_programs.py` | tabs: `cip-crosswalk`, `coci-lookup` · modules: `kb/_college_apprenticeship_cpl_roster.js` · scripts: `kb/_build_coci_programs.py`, `kb/_build_college_offering_crosswalk.py` |
| `college_identity_data.js` | `CPL_COLLEGE_IDENTITY` | `kb/_build_college_identity_crosswalk.py` | tabs: `college-identity` · pages: `CPL_Dashboard.html` · scripts: `kb/_build_college_identity_crosswalk.py` |
| `college_lookup.js` | `CCC_COLLEGE_LOOKUP` | not stated in header | tabs: `vision-2030` · pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` |
| `cpl_baccalaureates_data.js` | `CPL_BACCALAUREATES` | `kb/_build_baccalaureate_pathways.py` | tabs: `cpl-pathways` · pages: `CPL_Dashboard.html` · scripts: `kb/_build_baccalaureate_pathways.py`, `kb/_build_cpl_pathway_ccr.py`, `kb/_build_cpl_pathway_membership.py` |
| `cpl_coci_course_keys.js` | `CPL_COCI_COURSE_KEYS` | `kb/_build_coci_lookup.py` | tabs: `cpl-pathways` · scripts: `kb/_build_coci_lookup.py` |
| `cpl_funding_data.js` | `CPL_FUNDING` | not stated in header | tabs: `college-briefing`, `implementation-funding` · modules: `prototype/build_funding_model_explainer.js` · pages: `cpl_funding_public.html`, `funding-model/index.html` · scripts: `excel_to_dashboard.py`, `funding/_build_funding_ess.py`, `funding/_build_funding_performance.py` |
| `cpl_funding_ess.js` | `CPL_FUNDING_ESS` | not stated in header | tabs: `college-briefing`, `implementation-funding` · scripts: `funding/_build_funding_ess.py` |
| `cpl_funding_performance.js` | `CPL_FUNDING_PERF` | not stated in header | tabs: `college-briefing`, `implementation-funding` · scripts: `funding/_build_funding_performance.py` |
| `cpl_pathways_ccr_data.js` | `CPL_PATHWAY_CCR` | `kb/_build_cpl_pathway_ccr.py` | tabs: `cpl-pathways` · pages: `CPL_Dashboard.html` · scripts: `kb/_build_cpl_pathway_ccr.py` |
| `cpl_pathways_data.js` | `CPL_PATHWAYS` | not stated in header | tabs: `cpl-pathways` · pages: `CPL_Dashboard.html` |
| `cpl_pathways_membership_data.js` | `CPL_PATHWAY_MEMBERSHIP` | `kb/_build_cpl_pathway_membership.py` | tabs: `cpl-pathways` · pages: `CPL_Dashboard.html` · scripts: `kb/_build_cpl_pathway_membership.py` |
| `credential_reference_data.js` | `CPL_CREDENTIAL_REFERENCE` | `excel_to_dashboard.py:export_credential_reference()` | tabs: `cpl-pathways`, `credential-reference`, `map-export`, `nc-learning-partners` · modules: `kb/_carp_apprentice_plan_s109.js`, `kb/_college_apprenticeship_cpl_roster.js` · scripts: `excel_to_dashboard.py`, `funding/_build_funding_ess.py`, `kb/_build_baccalaureate_pathways.py`, `kb/_build_partner_crosswalk.py`, `kb/_build_peer_articulations.py`, `kb/_preseed_null_issuers.py`, `kb/_seed_college_short_names.py`, `kb/_sync_credential_catalog.py`, `kb/_trail_crew.py`, `kb/_trail_crew_assemble.py`, `kb/_verify_issuer_preseed.py` |
| `fact-sheet/cpl_stories.js` | `CPL_STORIES` | `tools/source_cpl_stories.mjs` | tabs: `college-briefing`, `implementation-funding` · pages: `fact-sheet/index.html` · scripts: `tools/source_cpl_stories.mjs` |
| `fact-sheet/statewide_recs.js` | `CPL_STATEWIDE_RECS` | `fact-sheet/_build_statewide_recs.py` | pages: `fact-sheet/index.html` · scripts: `fact-sheet/_build_statewide_recs.py` |
| `scripts/check_funding_nc_row_layout.js` | `CPL_FUNDING_NO_REMOTE` | not stated in header | none found |
| `scripts/funding_effective.js` | `CPL_FUNDING_NO_REMOTE` | not stated in header | tabs: `college-briefing`, `implementation-funding` |
| `sierra_rule_defaults.js` | `SIERRA_RULE_DEFAULTS` | `kb/_build_sierra_rule_defaults.py` | tabs: `sierra-training` · pages: `CPL_Dashboard.html` · scripts: `kb/_build_sierra_rule_defaults.py` |
| `statewide_data.js` | `CPL_STATEWIDE` | not stated in header | tabs: `vision-2030` · scripts: `excel_to_dashboard.py`, `fact-sheet/_build_statewide_recs.py`, `kb/_build_college_offering_crosswalk.py`, `kb/_build_credential_recs.py`, `kb/_build_partner_crosswalk.py`, `kb/_preseed_unclassified.py`, `kb/_seed_college_short_names.py`, `kb/_seed_statewide_categories.py`, `kb/_sync_credential_catalog.py` |
| `statewide_prescriptive.js` | `CPL_STATEWIDE_PRESCRIPTIVE` | not stated in header | tabs: `vision-2030` · scripts: `excel_to_dashboard.py` |
| `tmc_college_adts.js` | `CPL_TMC_COLLEGE_ADTS` | `tmc/_build_college_adts.py` | tabs: `tmc-builder` · scripts: `tmc/_build_college_adts.py` |
| `tmc_college_courses.js` | `CPL_TMC_COLLEGE_COURSES` | `tmc/_build_college_courses.py` | tabs: `tmc-builder` · scripts: `tmc/_build_college_adts.py`, `tmc/_build_college_courses.py` |
| `tmc_ge_patterns.js` | `CPL_TMC_GE_PATTERNS` | not stated in header | tabs: `tmc-builder` |
| `tmc_templates.js` | `CPL_TMC_TEMPLATES` | `tmc/_parse_tmc_pdfs.py` | tabs: `tmc-builder` · scripts: `tmc/_build_college_adts.py`, `tmc/_parse_tmc_pdfs.py` |
| `unified_courses_aligned.js` | `CPL_UC_ALIGNED` | not stated in header | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_build_aligned_exhibits.py` |
| `unified_courses_data.js` | `CPL_UNIFIED_COURSES` | not stated in header | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_analyze_witness_kinship.py`, `kb/_build_ccr_atlas_extract.py`, `kb/_build_ccr_universe.py`, `kb/_esl_ladder_relevel_dryrun.py`, `kb/_morphological_variant_dryrun.py`, `kb/_seed_college_short_names.py` |
| `unified_courses_index.js` | `CPL_UC_INDEX` | not stated in header | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_build_esl_fold_preview.py`, `kb/_esl_package_actionable.py`, `kb/_esl_package_apply.py` |
| `unified_courses_member_desc.js` | `CPL_UC_MEMBER_DESC` | not stated in header | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_build_ccr_universe.py` |
| `unified_courses_members.js` | `CPL_UC_MEMBERS` | not stated in header | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_build_ccr_atlas_extract.py`, `kb/_build_ccr_universe.py`, `kb/_build_esl_fold_preview.py`, `kb/_esl_ladder_relevel_dryrun.py`, `kb/_esl_package_apply.py` |
| `unified_courses_standalone.js` | `CPL_UC_STANDALONE` | not stated in header | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_build_ccr_universe.py`, `kb/_build_esl_fold_preview.py`, `kb/_esl_package_actionable.py`, `kb/_esl_package_apply.py`, `kb/_morphological_variant_dryrun.py` |
| `unified_courses_suggestions.js` | `CPL_UC_SUGGESTIONS` | not stated in header | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_auto_merge_worklist.py`, `kb/_build_ccr_atlas_extract.py`, `kb/_doctrine_calibration_sample.py` |

## JSON / CSV / XLSX and other file datasets

Only files with at least one code consumer or producer. Dated receipt dirs
collapse to one `<date>` family so writer and reader edges join.

| File | Read by | Written by |
|---|---|---|
| `  - kb/csr_authority_codes_rulings_<date>.json` | scripts: `kb/_authority_recode_dryrun.py`, `kb/_zband_retire_dryrun.py` | — |
| `*.full.json` | scripts: `kb/_ccr_trail.py` | — |
| `.claude/commands/checkpoint.md` | scripts: `kb/_consolidation_loss_audit.py`, `kb/_doctrine_scenarios.py` | — |
| `/tmp/metrics_status` | workflows: `daily-dashboard.yml` | — |
| `CLAUDE.md` | scripts: `kb/_build_docs_index.py`, `kb/_consolidation_loss_audit.py`, `kb/_docs_audit.py`, `kb/_doctrine_scenarios.py`, `kb/doctrine.py` | — |
| `CPL_Dashboard.html` | scripts: `excel_to_dashboard.py`, `prototype/check_contrast.py` | scripts: `excel_to_dashboard.py` · committed by: `daily-dashboard.yml` |
| `CPL_Initiative_Project_List_v3.xlsx` | scripts: `excel_to_dashboard.py`, `kb/_validate_projects.py`, `kb/_validate_workplan_goals.py` | — |
| `CustomReport_*.json` | scripts: `funding/_build_cr_backlog.py`, `funding/_build_funding_performance.py`, `kb/_sync_map_custom_reports.py` | — |
| `README.md` | scripts: `excel_to_dashboard.py`, `kb/_build_docs_index.py`, `kb/_docs_audit.py`, `kb/_normalize_kb_note_frontmatter.py`, `kb/doctrine.py` | — |
| `TOP_Code_Lookup.xlsx` | scripts: `excel_to_dashboard.py` | — |
| `admin.js` | pages: `CPL_Dashboard.html` | — |
| `annual_report.js` | pages: `CPL_Dashboard.html` | — |
| `assoc_editor.js` | pages: `CPL_Dashboard.html` | — |
| `budget-support/web/config.js` | pages: `budget-support/web/curator.html`, `budget-support/web/new-letter.html` | — |
| `budget-support/web/curator.html` | pages: `CPL_Dashboard.html` | — |
| `budget_editor.js` | pages: `CPL_Dashboard.html` | — |
| `budget_ledger.js` | pages: `CPL_Dashboard.html` | — |
| `canonical_subj4.js` | pages: `CPL_Dashboard.html` | — |
| `card_actions.js` | pages: `CPL_Dashboard.html` | — |
| `card_raci.js` | pages: `CPL_Dashboard.html` | — |
| `card_updates.js` | pages: `CPL_Dashboard.html` | — |
| `chatbox/build_coci_offerings.py` | workflows: `coci-offerings-sync.yml` | — |
| `chatbox/college_geo.json` | scripts: `chatbox/_seed_college_geo.py`, `chatbox/build_coci_offerings.py` | scripts: `chatbox/_seed_college_geo.py` |
| `chatbox/college_landing_pages.json` | scripts: `chatbox/scrape_landing_pages.py` | scripts: `chatbox/scrape_landing_pages.py` · committed by: `cpl-landing-pages.yml` |
| `chatbox/health_check.sh` | workflows: `cpl-chat-health.yml` | — |
| `chatbox/preflight_bgca.sh` | workflows: `sierra-preflight.yml` | — |
| `chatbox/scrape_landing_pages.py` | workflows: `cpl-landing-pages.yml` | — |
| `chatbox/smoke_test.sh` | workflows: `cpl-chat-preview-ab.yml`, `cpl-chat-smoke.yml` | — |
| `chatbox/sync_coci_offerings.py` | workflows: `coci-offerings-sync.yml` | — |
| `cip_crosswalk.js` | pages: `CPL_Dashboard.html` | — |
| `cip_fitcheck/*.json` | tabs: `cip-crosswalk` | — |
| `cip_fitcheck_colleges.json` | tabs: `cip-crosswalk` · scripts: `kb/_build_cip_fitcheck.py` | scripts: `kb/_build_cip_fitcheck.py` |
| `cip_status_counts.json` | tabs: `cip-crosswalk` | — |
| `cobi_a11y.js` | pages: `CPL_Dashboard.html` | — |
| `cobi_brand.js` | pages: `CPL_Dashboard.html` | — |
| `cobi_identity.js` | pages: `CPL_Dashboard.html` | — |
| `cobi_orgs.js` | pages: `CPL_Dashboard.html` | — |
| `coci_lookup.js` | pages: `CPL_Dashboard.html` | — |
| `coci_lookup_desc_*.js` | tabs: `coci-lookup` | — |
| `coci_program_export_*.csv` | scripts: `chatbox/build_coci_offerings.py` | — |
| `coci_program_export_<date>.csv` | scripts: `kb/_build_baccalaureate_pathways.py`, `kb/_build_coci_programs.py`, `kb/_build_futuro_hth_crosswalk.py`, `kb/_build_program_course_graph.py`, `kb/_classify_noncredit_programs.py`, `tmc/_build_college_adts.py` | — |
| `college_activity.js` | pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` | committed by: `daily-dashboard.yml` |
| `college_activity_template.html` | scripts: `excel_to_dashboard.py`, `kb/_test_light_theme.py` | committed by: `daily-dashboard.yml` |
| `college_briefing.js` | pages: `CPL_Dashboard.html` · scripts: `scripts/stamp_asset_versions.py` | — |
| `college_identity.js` | pages: `CPL_Dashboard.html` | — |
| `college_report_generator.js` | pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` | — |
| `college_short_names.js` | pages: `CPL_Dashboard.html` · scripts: `kb/_seed_college_short_names.py` | scripts: `kb/_seed_college_short_names.py` |
| `contracts.js` | pages: `CPL_Dashboard.html` | — |
| `course_top_consensus.json` | tabs: `cip-crosswalk` · scripts: `kb/_build_course_top_consensus.py` | scripts: `kb/_build_course_top_consensus.py` |
| `cpl_chat.js` | pages: `CPL_Dashboard.html` | — |
| `cpl_funding.js` | tabs: `college-briefing` · pages: `CPL_Dashboard.html`, `cpl_funding_public.html`, `funding-model/index.html` | — |
| `cpl_memory.js` | pages: `CPL_Dashboard.html` | — |
| `cpl_news.js` | pages: `CPL_Dashboard.html` | — |
| `cpl_pathways.js` | pages: `CPL_Dashboard.html` | — |
| `cpl_session.js` | pages: `CPL_Dashboard.html`, `fact-sheet/index.html` | — |
| `cpl_todos.js` | pages: `CPL_Dashboard.html` | — |
| `cr_reference.js` | pages: `CPL_Dashboard.html` | — |
| `credential_reference.js` | pages: `CPL_Dashboard.html` | — |
| `csr_authority_codes_rulings_<date>.json` | scripts: `kb/_authority_recode_dryrun.py`, `kb/_seed_authority_codes.py` | — |
| `dashboard_filters.js` | pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` | — |
| `docs/*.md` | scripts: `kb/_build_docs_index.py` | — |
| `docs/*_lessons.md` | scripts: `kb/_build_docs_index.py` | — |
| `docs/INDEX.md` | scripts: `kb/_build_docs_index.py`, `kb/_docs_audit.py`, `kb/doctrine.py` | — |
| `docs/catalog/index.json` | tabs: `governance` · scripts: `kb/_build_docs_index.py` | — |
| `docs/common_cr_reference_scope.md` | scripts: `kb/_build_cr_reference.py` | — |
| `docs/reference/mid_lifecycle.md` | scripts: `kb/_doctrine_scenarios.py` | — |
| `docs/reference/statute/README.md` | scripts: `kb/_doctrine_scenarios.py` | — |
| `docs/reference/statute/t5_55050_55051_final_reg_text_<date>.txt` | scripts: `kb/_derive_55050_clean.py` | — |
| `docs/reference/statute/t5_55050_clean_after_<date>.txt` | scripts: `kb/_verify_55050_redline.py` | scripts: `kb/_derive_55050_clean.py` |
| `docs/research_workexp_crossdisc_remint_scope.md` | scripts: `kb/_crossdisc_dryrun.py` | — |
| `docs/roadmap_archive.md` | scripts: `kb/_consolidation_loss_audit.py` | — |
| `docs/session_<N>_handoff.md` | scripts: `kb/_build_docs_index.py` | — |
| `docx.min.js` | tabs: `annual-report`, `college-briefing`, `implementation-funding` · modules: `master_report.js` · pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` | — |
| `excel_to_dashboard.py` | workflows: `daily-dashboard.yml` | — |
| `exports/20260826_T5_55050_Article9_Conformity_TrackedChanges_v5.docx` | none found | scripts: `kb/_build_55050_redline_docx.py`, `kb/_verify_55050_redline.py` |
| `exports/unified_courses.xlsx` | scripts: `excel_to_dashboard.py` | committed by: `daily-dashboard.yml` |
| `fact-sheet/_build_statewide_recs.py` | workflows: `daily-dashboard.yml` | — |
| `fact-sheet/cpl_stories_render.js` | pages: `fact-sheet/index.html` | — |
| `fact-sheet/factsheet.js` | pages: `fact-sheet/index.html` | — |
| `fact-sheet/factsheet_edit.js` | pages: `fact-sheet/index.html` | — |
| `fact-sheet/factsheet_sierra.js` | pages: `fact-sheet/index.html` | — |
| `fact-sheet/factsheet_word.js` | pages: `fact-sheet/index.html` | — |
| `fact-sheet/statewide_recs_render.js` | pages: `fact-sheet/index.html` | — |
| `fact_sheet_metrics.json` | pages: `fact-sheet/index.html` · scripts: `excel_to_dashboard.py` | committed by: `daily-dashboard.yml` |
| `fetch_custom_report.py` | workflows: `daily-dashboard.yml`, `map-custom-report-load.yml` | — |
| `fetch_veteran_jst.py` | workflows: `daily-dashboard.yml` | — |
| `first_light.js` | pages: `CPL_Dashboard.html` | — |
| `funding/_build_funding_ess.py` | workflows: `daily-dashboard.yml` | — |
| `funding/_build_funding_performance.py` | workflows: `daily-dashboard.yml` | — |
| `funding_model_payload.js` | pages: `funding-model/index.html` | — |
| `generate_reports.js` | scripts: `excel_to_dashboard.py` · workflows: `daily-dashboard.yml` | — |
| `governance.js` | pages: `CPL_Dashboard.html` | — |
| `gr_priorities.js` | pages: `CPL_Dashboard.html` | — |
| `index.html` | scripts: `excel_to_dashboard.py`, `nudges/build_nudges.py`, `prototype/check_contrast.py`, `raci/_seed_team_members.py` | committed by: `daily-dashboard.yml` |
| `kb-portal/app.js` | pages: `kb-portal/index.html` | — |
| `kb-portal/composer_util.js` | pages: `kb-portal/index.html` | — |
| `kb/README.md` | scripts: `kb/_build_docs_index.py` | — |
| `kb/_apply_canonical_subj4.py` | workflows: `daily-dashboard.yml`, `phase-1e-apply.yml`, `phase-1e-sync.yml` | — |
| `kb/_apply_credential_review.py` | workflows: `cred-rename-apply.yml`, `daily-dashboard.yml` | — |
| `kb/_apply_curation.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_apply_unclassified_triage.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_audit_exhibits.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_build_ccr_universe.py` | workflows: `daily-dashboard.yml`, `skyview-desc-shards.yml` | — |
| `kb/_build_college_courses.py` | workflows: `credential-catalog-sync.yml` | — |
| `kb/_build_cpl_pathway_ccr.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_build_cpl_pathway_membership.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_build_cr_reference.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_build_credential_recs.py` | workflows: `credential-catalog-sync.yml`, `daily-dashboard.yml` | — |
| `kb/_build_dependency_map.py` | workflows: `js-tests.yml` | — |
| `kb/_build_docs_index.py` | workflows: `js-tests.yml` | — |
| `kb/_build_governance_candidates.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_build_peer_articulations.py` | workflows: `credential-catalog-sync.yml`, `daily-dashboard.yml` | — |
| `kb/_build_program_course_graph.py` | workflows: `daily-dashboard.yml`, `program-course-fetch.yml` | — |
| `kb/_cred_rename_apply.py` | workflows: `cred-rename-apply.yml` | — |
| `kb/_cred_rename_apply_supabase.py` | workflows: `cred-rename-apply.yml` | — |
| `kb/_cred_rename_dryrun.py` | workflows: `cred-rename-apply.yml`, `daily-dashboard.yml` | — |
| `kb/_fetch_program_course_files.py` | workflows: `program-course-fetch.yml` | — |
| `kb/_fold_unclassified.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_match_cos_authority.py` | workflows: `cos-authority-sync.yml` | — |
| `kb/_overmerge_apply.py` | workflows: `overmerge-apply.yml` | — |
| `kb/_overmerge_apply_supabase.py` | workflows: `overmerge-apply.yml` | — |
| `kb/_probe_lifecycle_checks.py` | workflows: `discover-map-datasets.yml` | — |
| `kb/_rekey_kb_curation_supabase.py` | workflows: `supabase-rekey.yml` | — |
| `kb/_row_audit.py` | workflows: `daily-dashboard.yml`, `overmerge-apply.yml`, `phase-1e-apply.yml` | — |
| `kb/_seed_projects_apply.py` | workflows: `projects-seed-apply.yml` | — |
| `kb/_seed_workplan_goals_apply.py` | workflows: `workplan-goals-seed-apply.yml` | — |
| `kb/_subj4_apply.py` | workflows: `phase-1e-apply.yml` | — |
| `kb/_subj4_apply_supabase.py` | workflows: `phase-1e-apply.yml` | — |
| `kb/_subj4_dryrun.py` | workflows: `phase-1e-apply.yml`, `phase-1e-sync.yml` | — |
| `kb/_suggest_unclassified.py` | workflows: `daily-dashboard.yml` | — |
| `kb/_sync_college_courses.py` | workflows: `credential-catalog-sync.yml` | — |
| `kb/_sync_cos_certifications.py` | workflows: `cos-authority-sync.yml` | — |
| `kb/_sync_credential_catalog.py` | workflows: `credential-catalog-sync.yml` | — |
| `kb/_sync_credential_recs.py` | workflows: `credential-catalog-sync.yml` | — |
| `kb/_sync_map_custom_reports.py` | workflows: `map-custom-report-load.yml` | — |
| `kb/_sync_moc_crosswalk.py` | workflows: `moc-crosswalk-sync.yml` | — |
| `kb/_sync_peer_articulations.py` | workflows: `credential-catalog-sync.yml` | — |
| `kb/authority_recode_out/2026-09-03/ag_classification.json` | scripts: `kb/_authority_recode_dryrun.py` | — |
| `kb/authority_recode_out/2026-09-03/fl_classification.json` | scripts: `kb/_authority_recode_dryrun.py` | — |
| `kb/authority_recode_out/2026-09-03/seed_edits.json` | scripts: `kb/_authority_recode_dryrun.py`, `kb/_zband_retire_dryrun.py` | — |
| `kb/authority_recode_out/<date>/alias_map.json` | scripts: `kb/_rekey_promotions.py` | — |
| `kb/budget_snapshot.json` | scripts: `kb/_load_budget.py` | scripts: `kb/_load_budget.py` · committed by: `daily-dashboard.yml` |
| `kb/cid_articulation_joins.json` | scripts: `excel_to_dashboard.py`, `kb/_desc_consolidation_dryrun.py`, `kb/_join_cid_articulations.py`, `kb/_title_consolidation_dryrun.py` | scripts: `kb/_join_cid_articulations.py` |
| `kb/coci_articulations.json` | scripts: `excel_to_dashboard.py`, `kb/_apply_convergence_singletons.py`, `kb/_apply_crossdisc_remint.py`, `kb/_apply_drama_theater_convergence.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_apply_kin_pe_convergence.py`, `kb/_apply_kine_flsp_twin_merge.py`, `kb/_apply_twin_merge_statewide.py`, `kb/_authority_recode_dryrun.py`, `kb/_build_cpl_pathway_ccr.py`, `kb/_build_cpl_pathway_membership.py`, `kb/_build_peer_articulations.py`, `kb/_ccr_trail.py`, `kb/_cred_rename_apply.py`, `kb/_cred_rename_dryrun.py`, `kb/_crossdisc_dryrun.py`, `kb/_detect_cpl_type_dupes.py`, `kb/_fold_unclassified.py`, `kb/_identities_rekey_dryrun.py`, `kb/_kin_pe_pass2.py`, `kb/_merge_credentials.py`, `kb/_overmerge_apply.py`, `kb/_overmerge_dryrun.py`, `kb/_pols_remint.py`, `kb/_remint_apply_articulations.py`, `kb/_seed_coci_articulations.py`, `kb/_subj4_apply.py`, `kb/_subj4_dryrun.py`, `kb/_uc_cur_zscheme_dryrun.py`, `kb/_verify_prescriptive_join.py`, `kb/_verify_students_served.py`, `kb/_zband_retire_dryrun.py` | scripts: `kb/_apply_fl_subj4_remint.py`, `kb/_fold_unclassified.py`, `kb/_pols_remint.py`, `kb/_remint_apply_articulations.py`, `kb/_seed_coci_articulations.py` · committed by: `cred-rename-apply.yml`, `daily-dashboard.yml`, `overmerge-apply.yml`, `phase-1e-apply.yml` |
| `kb/coci_curation.json` | scripts: `excel_to_dashboard.py`, `kb/_analyze_official_fold_evidence.py`, `kb/_apply_convergence_singletons.py`, `kb/_apply_curation.py`, `kb/_apply_drama_theater_convergence.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_apply_kin_pe_convergence.py`, `kb/_apply_kine_flsp_twin_merge.py`, `kb/_apply_twin_merge_statewide.py`, `kb/_athl_fitness_merge_curation.py`, `kb/_authority_recode_dryrun.py`, `kb/_auto_merge_worklist.py`, `kb/_build_esl_fold_preview.py`, `kb/_build_esl_fold_spotcheck.py`, `kb/_desc_consolidation_dryrun.py`, `kb/_esl_package_actionable.py`, `kb/_esl_package_apply.py`, `kb/_hs_title_fold.py`, `kb/_infer_disciplines.py`, `kb/_infer_disciplines_from_desc.py`, `kb/_infer_disciplines_from_top.py`, `kb/_infer_disciplines_from_top_division.py`, `kb/_kin_pe_pass2.py`, `kb/_overmerge_apply.py`, `kb/_pols_remint.py`, `kb/_remint_dryrun.py`, `kb/_row_audit.py`, `kb/_seed_authority_codes.py`, `kb/_subj4_apply.py`, `kb/_subj4_dryrun.py`, `kb/_title_consolidation_dryrun.py`, `kb/_uc_cur_zscheme_apply.py`, `kb/_uc_cur_zscheme_dryrun.py`, `kb/_zband_retire_dryrun.py` | scripts: `kb/_apply_curation.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_athl_fitness_merge_curation.py`, `kb/_hs_title_fold.py`, `kb/_pols_remint.py`, `kb/_uc_cur_zscheme_apply.py` · committed by: `daily-dashboard.yml`, `overmerge-apply.yml`, `phase-1e-apply.yml` |
| `kb/coci_duplicate_control_numbers.json` | scripts: `excel_to_dashboard.py` | committed by: `daily-dashboard.yml` |
| `kb/coci_minted_courses.json` | scripts: `excel_to_dashboard.py`, `kb/_analyze_official_fold_evidence.py`, `kb/_analyze_witness_kinship.py`, `kb/_apply_crossdisc_remint.py`, `kb/_apply_drama_theater_convergence.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_apply_kin_pe_convergence.py`, `kb/_apply_kine_flsp_twin_merge.py`, `kb/_apply_twin_merge_statewide.py`, `kb/_athl_fitness_merge_curation.py`, `kb/_audit_subject_map.py`, `kb/_authority_recode_dryrun.py`, `kb/_build_cpl_pathway_ccr.py`, `kb/_build_cpl_pathway_membership.py`, `kb/_ccr_trail.py`, `kb/_crossdisc_dryrun.py`, `kb/_desc_consolidation_dryrun.py`, `kb/_esl_package_dryrun.py`, `kb/_fl_subj4_dryrun.py`, `kb/_hs_title_fold.py`, `kb/_identities_rekey_dryrun.py`, `kb/_infer_disciplines_from_desc.py`, `kb/_infer_disciplines_from_top.py`, `kb/_infer_disciplines_from_top_division.py`, `kb/_join_credit_status.py`, `kb/_join_cte_from_top.py`, `kb/_kin_pe_pass2.py`, `kb/_normalize_common_titles.py`, `kb/_overmerge_apply.py`, `kb/_overmerge_dryrun.py`, `kb/_pols_remint.py`, `kb/_rekey_promotions.py`, `kb/_remint_apply.py`, `kb/_remint_apply_articulations.py`, `kb/_remint_dryrun.py`, `kb/_row_audit.py`, `kb/_seed_authority_codes.py`, `kb/_seed_canonical_subj4.py`, `kb/_seed_coci_articulations.py`, `kb/_seed_coci_minted_mids.py`, `kb/_seed_coci_unified_courses.py`, `kb/_similar_family_dryrun.py`, `kb/_subj4_apply.py`, `kb/_subj4_dryrun.py`, `kb/_sug_segment_dryrun.py`, `kb/_suggest_unclassified.py`, `kb/_synonym_candidate_dryrun.py`, `kb/_title_consolidation_dryrun.py`, `kb/_top_fold_gate_dryrun.py`, `kb/_uc_cur_zscheme_dryrun.py`, `kb/_zband_retire_dryrun.py` | scripts: `kb/_apply_crossdisc_remint.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_infer_disciplines.py`, `kb/_pols_remint.py` · committed by: `overmerge-apply.yml`, `phase-1e-apply.yml` |
| `kb/coci_minted_memberships.json` | scripts: `excel_to_dashboard.py`, `kb/_analyze_official_fold_evidence.py`, `kb/_apply_crossdisc_remint.py`, `kb/_apply_drama_theater_convergence.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_apply_kin_pe_convergence.py`, `kb/_apply_kine_flsp_twin_merge.py`, `kb/_apply_twin_merge_statewide.py`, `kb/_audit_subject_map.py`, `kb/_authority_recode_dryrun.py`, `kb/_build_coci_lookup.py`, `kb/_build_cpl_pathway_ccr.py`, `kb/_build_cpl_pathway_membership.py`, `kb/_build_esl_fold_spotcheck.py`, `kb/_ccr_trail.py`, `kb/_desc_consolidation_dryrun.py`, `kb/_detect_crnc_mirrors.py`, `kb/_esl_ladder_relevel_dryrun.py`, `kb/_fl_subj4_dryrun.py`, `kb/_infer_disciplines.py`, `kb/_join_cid_articulations.py`, `kb/_join_credit_status.py`, `kb/_kin_pe_pass2.py`, `kb/_overmerge_apply.py`, `kb/_overmerge_dryrun.py`, `kb/_pols_remint.py`, `kb/_rekey_crnc_mirrors.py`, `kb/_rekey_promotions.py`, `kb/_remint_apply.py`, `kb/_remint_apply_articulations.py`, `kb/_row_audit.py`, `kb/_seed_canonical_subj4.py`, `kb/_seed_coci_articulations.py`, `kb/_seed_coci_minted_mids.py`, `kb/_subj4_apply.py`, `kb/_subj4_dryrun.py`, `kb/_title_consolidation_dryrun.py`, `kb/_uc_cur_promote.py`, `kb/_verify_prescriptive_join.py`, `kb/_zband_retire_apply.py` | scripts: `kb/_apply_crossdisc_remint.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_pols_remint.py` · committed by: `overmerge-apply.yml`, `phase-1e-apply.yml` |
| `kb/coci_minted_singletons.json` | scripts: `excel_to_dashboard.py`, `kb/_analyze_official_fold_evidence.py`, `kb/_analyze_witness_kinship.py`, `kb/_apply_convergence_singletons.py`, `kb/_apply_crossdisc_remint.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_audit_subject_map.py`, `kb/_authority_recode_dryrun.py`, `kb/_build_coci_lookup.py`, `kb/_build_esl_fold_spotcheck.py`, `kb/_ccr_trail.py`, `kb/_crossdisc_dryrun.py`, `kb/_esl_ladder_relevel_dryrun.py`, `kb/_esl_package_dryrun.py`, `kb/_fl_subj4_dryrun.py`, `kb/_hs_title_fold.py`, `kb/_identities_rekey_dryrun.py`, `kb/_infer_disciplines_from_desc.py`, `kb/_infer_disciplines_from_top.py`, `kb/_infer_disciplines_from_top_division.py`, `kb/_join_cid_articulations.py`, `kb/_join_credit_status.py`, `kb/_join_cte_from_top.py`, `kb/_kin_pe_pass2.py`, `kb/_normalize_common_titles.py`, `kb/_overmerge_apply.py`, `kb/_overmerge_dryrun.py`, `kb/_pols_remint.py`, `kb/_rekey_promotions.py`, `kb/_remint_apply.py`, `kb/_remint_apply_articulations.py`, `kb/_remint_dryrun.py`, `kb/_row_audit.py`, `kb/_seed_authority_codes.py`, `kb/_seed_canonical_subj4.py`, `kb/_seed_coci_articulations.py`, `kb/_seed_coci_minted_mids.py`, `kb/_seed_coci_unified_courses.py`, `kb/_similar_family_dryrun.py`, `kb/_subj4_apply.py`, `kb/_subj4_dryrun.py`, `kb/_sug_segment_dryrun.py`, `kb/_synonym_candidate_dryrun.py`, `kb/_title_consolidation_dryrun.py`, `kb/_top_fold_gate_dryrun.py`, `kb/_uc_cur_zscheme_dryrun.py`, `kb/_zband_retire_dryrun.py` | scripts: `kb/_apply_crossdisc_remint.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_infer_disciplines.py`, `kb/_pols_remint.py` · committed by: `overmerge-apply.yml`, `phase-1e-apply.yml` |
| `kb/coci_title_corrections.json` | scripts: `excel_to_dashboard.py` | scripts: `excel_to_dashboard.py` · committed by: `daily-dashboard.yml` |
| `kb/coci_unified_courses.json` | scripts: `excel_to_dashboard.py`, `kb/_infer_disciplines_from_desc.py`, `kb/_infer_disciplines_from_top.py`, `kb/_infer_disciplines_from_top_division.py`, `kb/_overmerge_apply.py`, `kb/_overmerge_dryrun.py`, `kb/_remint_apply_clusters.py`, `kb/_seed_coci_unified_courses.py`, `kb/_subj4_dryrun.py` | scripts: `kb/_infer_disciplines.py`, `kb/_remint_apply_clusters.py`, `kb/_seed_coci_unified_courses.py` · committed by: `overmerge-apply.yml`, `phase-1e-apply.yml` |
| `kb/college_short_names.json` | scripts: `chatbox/build_coci_offerings.py`, `funding/_build_funding_ess.py`, `funding/_build_funding_performance.py`, `kb/_build_college_identity_crosswalk.py`, `kb/_seed_college_short_names.py`, `tmc/_build_college_adts.py` | scripts: `kb/_seed_college_short_names.py` |
| `kb/common_courses.json` | scripts: `excel_to_dashboard.py`, `kb/_add_descriptions.py`, `kb/_csr_trail.py`, `kb/_curation_01.py`, `kb/_row_audit.py`, `kb/_seed_coci_minted_mids.py`, `kb/_zband_retire_dryrun.py` | scripts: `kb/_add_descriptions.py`, `kb/_seed_cx_common_courses.py` |
| `kb/convergence_singletons_out/<date>/alias_map.json` | scripts: `kb/_analyze_official_fold_evidence.py`, `kb/_rekey_promotions.py` | — |
| `kb/cos_match_out` | none found | committed by: `cos-authority-sync.yml` |
| `kb/cos_matches.json` | tabs: `credential-reference` · scripts: `kb/_match_cos_authority.py` | committed by: `cos-authority-sync.yml` |
| `kb/course_crosswalk.json` | scripts: `kb/_curation_01.py`, `kb/_esl_package_dryrun.py`, `kb/_zband_retire_dryrun.py` | scripts: `kb/_seed_cx_common_courses.py` |
| `kb/cpl_todos.json` | pages: `CPL_Dashboard.html` | — |
| `kb/cr_reference_worklist.json` | tabs: `cr-reference` · scripts: `kb/_build_cr_reference.py` | scripts: `kb/_build_cr_reference.py` · committed by: `daily-dashboard.yml` |
| `kb/cred_rename_dryrun` | none found | committed by: `cred-rename-apply.yml` |
| `kb/cred_rename_dryrun/alias_map.json` | workflows: `cred-rename-apply.yml` | committed by: `daily-dashboard.yml` |
| `kb/cred_rename_dryrun/collisions.json` | none found | committed by: `daily-dashboard.yml` |
| `kb/cred_rename_dryrun/report.md` | none found | committed by: `daily-dashboard.yml` |
| `kb/cred_rename_out` | none found | committed by: `cred-rename-apply.yml` |
| `kb/credential_merges.json` | scripts: `kb/_merge_credentials.py` | — |
| `kb/credential_review_overlay.json` | scripts: `excel_to_dashboard.py`, `kb/_apply_credential_review.py`, `kb/_cred_rename_dryrun.py` | scripts: `kb/_apply_credential_review.py` · committed by: `cred-rename-apply.yml`, `daily-dashboard.yml` |
| `kb/credentials.json` | tabs: `credential-reference` · scripts: `excel_to_dashboard.py`, `kb/_apply_credential_review.py`, `kb/_audit_exhibits.py`, `kb/_cred_rename_apply.py`, `kb/_cred_rename_dryrun.py`, `kb/_curation_credentials_01.py`, `kb/_detect_cpl_type_dupes.py`, `kb/_eacr_dryrun.py`, `kb/_flag_hinky_exhibits.py`, `kb/_fold_unclassified.py`, `kb/_match_cos_authority.py`, `kb/_merge_credentials.py`, `kb/_preseed_unclassified.py`, `kb/_seed_coci_articulations.py`, `kb/_verify_issuer_preseed.py`, `kb/classify_exhibits.py` | scripts: `kb/_apply_credential_review.py`, `kb/_curation_credentials_01.py`, `kb/_fold_unclassified.py`, `kb/_match_cos_authority.py`, `kb/_seed_top50.py` · committed by: `cred-rename-apply.yml`, `daily-dashboard.yml` |
| `kb/crnc_mirrors.json` | scripts: `excel_to_dashboard.py`, `kb/_detect_crnc_mirrors.py`, `kb/_rekey_crnc_mirrors.py` | — |
| `kb/crossdisc_out/alias_map.json` | scripts: `kb/_analyze_official_fold_evidence.py`, `kb/_rekey_promotions.py` | — |
| `kb/dashboard_config.json` | scripts: `excel_to_dashboard.py` | — |
| `kb/dependency_map.json` | tabs: `admin` | — |
| `kb/discipline_aliases.json` | tabs: `canonical-subj4` · scripts: `excel_to_dashboard.py`, `kb/_alias_canon.py`, `kb/_apply_drama_theater_convergence.py`, `kb/_apply_kin_pe_convergence.py`, `kb/_uc_cur_promote.py`, `kb/_zband_retire_apply.py`, `kb/_zband_retire_dryrun.py` | — |
| `kb/discipline_canonical_subj4.json` | tabs: `canonical-subj4`, `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_apply_canonical_subj4.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_authority_recode_dryrun.py`, `kb/_csr_trail.py`, `kb/_kin_pe_pass2.py`, `kb/_overmerge_dryrun.py`, `kb/_pols_remint.py`, `kb/_seed_authority_codes.py`, `kb/_seed_canonical_subj4.py`, `kb/_seed_coci_minted_mids.py`, `kb/_subj4_apply.py`, `kb/_subj4_dryrun.py`, `kb/_uc_cur_zscheme_dryrun.py`, `kb/_zband_retire_dryrun.py` | scripts: `kb/_apply_canonical_subj4.py`, `kb/_apply_fl_subj4_remint.py`, `kb/_pols_remint.py`, `kb/_seed_authority_codes.py`, `kb/_seed_canonical_subj4.py` · committed by: `daily-dashboard.yml`, `phase-1e-apply.yml`, `phase-1e-sync.yml` |
| `kb/discipline_cpl_rollup.json` | tabs: `canonical-subj4` · scripts: `excel_to_dashboard.py`, `kb/_build_cpl_by_discipline.py` | committed by: `daily-dashboard.yml` |
| `kb/discipline_inference.json` | scripts: `kb/_audit_subject_map.py`, `kb/_infer_disciplines.py`, `kb/_overmerge_dryrun.py`, `kb/_row_audit.py` | — |
| `kb/doctrine_questions.json` | tabs: `unified-courses` | — |
| `kb/drama_theater_out/<date>/alias_map.json` | scripts: `kb/_analyze_official_fold_evidence.py`, `kb/_rekey_promotions.py` | — |
| `kb/eacr_dryrun/unclassified.json` | scripts: `kb/_eacr_dryrun.py` | scripts: `kb/_eacr_dryrun.py` |
| `kb/esl_fold_spotcheck/2026-08-24/worklist.json` | none found | scripts: `kb/_build_esl_fold_spotcheck.py` |
| `kb/esl_fold_spotcheck/<date>/worklist.json` | scripts: `kb/_esl_relevel_dryrun.py` | — |
| `kb/esl_package_out/2026-07-15/esl_package_plan.json` | none found | scripts: `kb/_esl_package_dryrun.py` |
| `kb/esl_package_out/2026-07-15/esl_package_report.md` | none found | scripts: `kb/_esl_package_dryrun.py` |
| `kb/esl_package_out/2026-08-24/esl_actionable.json` | scripts: `kb/_esl_package_actionable.py` | scripts: `kb/_esl_package_actionable.py` |
| `kb/esl_package_out/2026-08-24/esl_apply_plan.json` | scripts: `kb/_esl_package_apply.py` | scripts: `kb/_esl_package_apply.py` |
| `kb/esl_package_out/<date>/esl_actionable.json` | scripts: `kb/_build_esl_fold_preview.py` | — |
| `kb/esl_package_out/<date>/esl_apply_plan.json` | scripts: `kb/_build_esl_fold_spotcheck.py`, `kb/_esl_relevel_dryrun.py` | — |
| `kb/esl_package_out/<date>/esl_package_plan.json` | scripts: `kb/_build_esl_fold_preview.py`, `kb/_build_esl_fold_spotcheck.py`, `kb/_esl_package_actionable.py`, `kb/_esl_package_apply.py` | — |
| `kb/esl_relevel_out/<date>/plan.json` | scripts: `kb/_esl_ladder_relevel_dryrun.py` | — |
| `kb/exhibit_audit/*.md` | none found | committed by: `daily-dashboard.yml` |
| `kb/exhibit_audit/latest.json` | tabs: `credential-reference` | committed by: `daily-dashboard.yml` |
| `kb/fl_subj4_out/<date>/alias_map.json` | scripts: `kb/_analyze_official_fold_evidence.py`, `kb/_rekey_promotions.py` | — |
| `kb/foreign_language_subj4.json` | tabs: `canonical-subj4` · scripts: `kb/_authority_recode_dryrun.py`, `kb/_fl_subj4_dryrun.py`, `kb/_subj4_dryrun.py`, `kb/_zband_retire_dryrun.py` | — |
| `kb/futuro_hth_map_reference.json` | scripts: `kb/_build_futuro_hth_crosswalk.py` | — |
| `kb/governance_candidates.json` | tabs: `governance` | committed by: `daily-dashboard.yml` |
| `kb/governance_register.json` | tabs: `governance` | — |
| `kb/insert.sql` | none found | modules: `kb/_carp_apprentice_plan_s109.js` |
| `kb/issuer_preseed.json` | tabs: `credential-reference` · scripts: `kb/_preseed_null_issuers.py`, `kb/_verify_issuer_preseed.py` | scripts: `kb/_preseed_null_issuers.py` |
| `kb/kb/reference/coci_program_course_file.csv.gz` | modules: `kb/_college_apprenticeship_cpl_roster.js` | — |
| `kb/kin_pe_out/<date>/alias_map.json` | scripts: `kb/_analyze_official_fold_evidence.py`, `kb/_rekey_promotions.py` | — |
| `kb/kin_pe_pass2_out/2026-06-12/athl_family_analysis.md` | scripts: `kb/_athl_fitness_merge_curation.py` | scripts: `kb/_athl_fitness_merge_curation.py` |
| `kb/kin_pe_pass2_out/2026-06-12/hs_title_fold.json` | none found | scripts: `kb/_hs_title_fold.py` |
| `kb/kin_pe_pass2_out/2026-06-12/hs_title_fold.md` | scripts: `kb/_hs_title_fold.py` | scripts: `kb/_hs_title_fold.py` |
| `kb/kin_pe_pass2_out/2026-06-12/supabase_hs_ops.json` | none found | scripts: `kb/_hs_title_fold.py` |
| `kb/kin_pe_pass2_out/2026-06-12/supabase_merge_ops.json` | scripts: `kb/_athl_fitness_merge_curation.py` | scripts: `kb/_athl_fitness_merge_curation.py` |
| `kb/kin_pe_pass2_out/<date>/alias_map.json` | scripts: `kb/_rekey_promotions.py` | — |
| `kb/liftoff_plan.json` | pages: `CPL_Dashboard.html` | — |
| `kb/morph_variant_out/2026-06-24/dryrun.json` | none found | scripts: `kb/_morphological_variant_dryrun.py` |
| `kb/nc_learning_partners.json` | tabs: `nc-learning-partners` | — |
| `kb/noncredit_cip_categories.json` | scripts: `kb/_build_noncredit_cip_categories.py`, `kb/_classify_noncredit_programs.py` | scripts: `kb/_build_noncredit_cip_categories.py` |
| `kb/occupation_credential_map.json` | scripts: `kb/_build_college_offering_crosswalk.py`, `kb/_build_partner_crosswalk.py` | — |
| `kb/overmerge_apply` | none found | committed by: `overmerge-apply.yml` |
| `kb/overmerge_out` | none found | committed by: `overmerge-apply.yml` |
| `kb/overmerge_out/2026-05-29/coherence.json` | none found | scripts: `kb/_overmerge_dryrun.py` |
| `kb/overmerge_out/2026-05-29/review_hold.json` | none found | scripts: `kb/_overmerge_dryrun.py` |
| `kb/overmerge_title_discipline.json` | scripts: `kb/_overmerge_dryrun.py` | — |
| `kb/partner_crosswalk_regions.json` | scripts: `kb/_build_partner_crosswalk.py` | — |
| `kb/pathway_feeder_fields.json` | scripts: `kb/_build_cpl_pathway_ccr.py`, `kb/_build_cpl_pathway_membership.py` | — |
| `kb/plan.json` | none found | modules: `kb/_carp_apprentice_plan_s109.js` |
| `kb/pols_remint_out/<date>/alias_map.json` | scripts: `kb/_rekey_promotions.py` | — |
| `kb/prefix_fold_out/2026-09-03/held.json` | scripts: `kb/_prefix_fold_dryrun.py` | — |
| `kb/prefix_fold_out/<date>/alias_map.json` | scripts: `kb/_rekey_promotions.py` | — |
| `kb/preseed_out/2026-07-07/live_values.json` | scripts: `kb/_preseed_unclassified.py` | — |
| `kb/program_course_graph.json` | none found | committed by: `program-course-fetch.yml` |
| `kb/project_lifecycle.json` | scripts: `kb/_load_projects.py` | scripts: `kb/_load_projects.py` · committed by: `daily-dashboard.yml` |
| `kb/projects_seed_out` | none found | committed by: `projects-seed-apply.yml` |
| `kb/projects_seed_plan.md` | none found | scripts: `kb/_seed_projects.py` · committed by: `projects-seed-apply.yml` |
| `kb/projects_snapshot.json` | scripts: `kb/_load_projects.py`, `nudges/build_nudges.py` | scripts: `kb/_load_projects.py` · committed by: `daily-dashboard.yml` |
| `kb/projects_validation.md` | none found | scripts: `kb/_validate_projects.py` · committed by: `projects-seed-apply.yml` |
| `kb/promotions.json` | scripts: `excel_to_dashboard.py`, `kb/_analyze_official_fold_evidence.py`, `kb/_analyze_witness_kinship.py`, `kb/_desc_consolidation_dryrun.py`, `kb/_esl_package_dryrun.py`, `kb/_rekey_promotions.py`, `kb/_remint_apply.py`, `kb/_seed_authority_codes.py`, `kb/_title_consolidation_dryrun.py`, `kb/_uc_cur_zscheme_dryrun.py` | scripts: `kb/_rekey_promotions.py` |
| `kb/reference/CIPCode2020.csv` | scripts: `kb/_build_cip_crosswalk.py` | — |
| `kb/reference/authority_subject_codes.json` | scripts: `kb/_seed_authority_codes.py` | scripts: `kb/_seed_authority_codes.py` |
| `kb/reference/cb_course_basic_fall2025.csv` | scripts: `kb/_build_futuro_hth_crosswalk.py`, `kb/_build_program_course_graph.py` | — |
| `kb/reference/ccc_coll_dist_2025.json` | scripts: `kb/_build_college_identity_crosswalk.py` | — |
| `kb/reference/ccc_colleges_ceo_2026.json` | scripts: `kb/_build_college_identity_crosswalk.py` | — |
| `kb/reference/ccc_ge_exam_credit.json` | scripts: `excel_to_dashboard.py` | — |
| `kb/reference/ccn_courses.json` | tabs: `canonical-subj4` · scripts: `excel_to_dashboard.py`, `kb/_analyze_witness_kinship.py`, `kb/_build_cr_reference.py`, `kb/_overmerge_dryrun.py`, `kb/_preseed_null_issuers.py`, `kb/_row_audit.py`, `kb/_seed_authority_codes.py`, `kb/_seed_coci_courses.py`, `kb/_seed_cx_common_courses.py`, `kb/_subj4_dryrun.py`, `kb/_suggest_unclassified.py` | — |
| `kb/reference/cid_articulations.json` | scripts: `kb/_ingest_cid_articulations.py`, `kb/_join_cid_articulations.py`, `tmc/_build_college_courses.py` | scripts: `kb/_ingest_cid_articulations.py` |
| `kb/reference/cid_articulations_raw.csv` | scripts: `kb/_ingest_cid_articulations.py` | — |
| `kb/reference/cid_descriptors.json` | tabs: `canonical-subj4` · scripts: `excel_to_dashboard.py`, `kb/_add_descriptions.py`, `kb/_analyze_witness_kinship.py`, `kb/_build_cr_reference.py`, `kb/_overmerge_dryrun.py`, `kb/_preseed_null_issuers.py`, `kb/_row_audit.py`, `kb/_seed_authority_codes.py`, `kb/_seed_coci_courses.py`, `kb/_seed_cx_common_courses.py`, `kb/_subj4_dryrun.py`, `kb/_suggest_unclassified.py`, `tmc/_parse_tmc_pdfs.py` | — |
| `kb/reference/cip_cte_certified_260715.json` | scripts: `kb/_build_cip_crosswalk.py` | — |
| `kb/reference/cip_searchable_260715.xlsx` | scripts: `kb/_build_cip_crosswalk.py` | — |
| `kb/reference/coci_course_list.xlsx` | scripts: `chatbox/build_coci_offerings.py`, `excel_to_dashboard.py`, `kb/_analyze_witness_kinship.py`, `kb/_apply_crossdisc_remint.py`, `kb/_audit_control_number_claims.py`, `kb/_audit_subject_map.py`, `kb/_build_cip_crosswalk.py`, `kb/_build_cip_fitcheck.py`, `kb/_build_coci_lookup.py`, `kb/_build_college_courses.py`, `kb/_build_course_top_consensus.py`, `kb/_build_cpl_pathway_ccr.py`, `kb/_build_esl_fold_spotcheck.py`, `kb/_build_program_course_graph.py`, `kb/_crossdisc_dryrun.py`, `kb/_join_cid_articulations.py`, `kb/_overmerge_dryrun.py`, `kb/_remint_apply.py`, `kb/_remint_dryrun.py`, `kb/_suggest_unclassified.py`, `tmc/_build_college_courses.py` | — |
| `kb/reference/coci_courses.json` | scripts: `excel_to_dashboard.py`, `kb/_seed_coci_articulations.py`, `kb/_seed_coci_courses.py` | scripts: `kb/_seed_coci_courses.py` |
| `kb/reference/coci_program_course_file.csv` | none found | committed by: `program-course-fetch.yml` |
| `kb/reference/coci_program_file.csv` | none found | committed by: `program-course-fetch.yml` |
| `kb/reference/college_identity_rulings.json` | scripts: `kb/_build_college_identity_crosswalk.py` | — |
| `kb/reference/cos_certifications.json` | scripts: `kb/_match_cos_authority.py`, `kb/_suggest_unclassified.py`, `kb/_sync_cos_certifications.py` | scripts: `kb/_sync_cos_certifications.py` · committed by: `cos-authority-sync.yml` |
| `kb/reference/esl_level_sets.json` | scripts: `kb/_esl_ladder_relevel_dryrun.py` | — |
| `kb/reference/map_college_roster_rules.json` | scripts: `excel_to_dashboard.py`, `kb/_audit_control_number_claims.py` | — |
| `kb/reference/mis_district_college_codes.json` | scripts: `kb/_build_college_identity_crosswalk.py` | — |
| `kb/reference/moc_crosswalk.json` | scripts: `kb/_sync_moc_crosswalk.py` | scripts: `kb/_sync_moc_crosswalk.py` · committed by: `moc-crosswalk-sync.yml` |
| `kb/reference/mq_disciplines.json` | scripts: `excel_to_dashboard.py`, `kb/_apply_kin_pe_convergence.py`, `kb/_infer_disciplines.py`, `kb/_infer_disciplines_from_desc.py`, `kb/_infer_disciplines_from_top.py`, `kb/_infer_disciplines_from_top_division.py`, `kb/_preseed_null_issuers.py`, `kb/_seed_coci_courses.py`, `kb/_seed_coci_minted_mids.py`, `kb/_seed_subject_discipline_map.py`, `kb/_verify_top_division_inference.py` | — |
| `kb/reference/mq_sections.json` | tabs: `canonical-subj4` · scripts: `kb/_ccr_trail.py` | — |
| `kb/reference/subject_discipline_map.json` | scripts: `kb/_apply_crossdisc_remint.py`, `kb/_preseed_null_issuers.py`, `kb/_seed_coci_minted_mids.py`, `kb/_seed_subject_discipline_map.py` | scripts: `kb/_seed_subject_discipline_map.py` |
| `kb/reference/top_categories.json` | scripts: `kb/_authority_recode_dryrun.py`, `kb/_join_cte_from_top.py`, `kb/_seed_canonical_subj4.py` | — |
| `kb/reference/topcip_2021_crosswalk.xlsx` | scripts: `kb/_build_cip_crosswalk.py` | — |
| `kb/row_audit` | none found | committed by: `overmerge-apply.yml`, `phase-1e-apply.yml` |
| `kb/row_audit/*.md` | none found | committed by: `daily-dashboard.yml` |
| `kb/row_audit/latest.json` | tabs: `pipeline`, `unified-courses` · workflows: `overmerge-apply.yml`, `phase-1e-apply.yml` | committed by: `daily-dashboard.yml` |
| `kb/statewide_exhibit_categories.json` | scripts: `excel_to_dashboard.py`, `kb/_seed_statewide_categories.py` | scripts: `kb/_seed_statewide_categories.py` |
| `kb/subj4_apply` | none found | committed by: `phase-1e-apply.yml` |
| `kb/subj4_apply/alias_map.json` | scripts: `kb/_analyze_official_fold_evidence.py`, `kb/_rekey_promotions.py` | — |
| `kb/subj4_dryrun` | none found | committed by: `phase-1e-apply.yml`, `phase-1e-sync.yml` |
| `kb/subj4_dryrun/alias_map.json` | workflows: `phase-1e-apply.yml` | — |
| `kb/subj4_dryrun/blocked.json` | none found | scripts: `kb/_subj4_dryrun.py` |
| `kb/subj4_dryrun/report.md` | workflows: `phase-1e-apply.yml` | — |
| `kb/subj4_fold_out/<date>/alias_map.json` | scripts: `kb/_rekey_promotions.py` | — |
| `kb/subject_map_audit.json` | scripts: `kb/_audit_subject_map.py` | scripts: `kb/_audit_subject_map.py` |
| `kb/synonym_map.json` | scripts: `excel_to_dashboard.py`, `kb/_morphological_variant_dryrun.py`, `kb/_sug_segment_dryrun.py`, `kb/_synonym_candidate_dryrun.py` | — |
| `kb/top_discipline_map.json` | scripts: `kb/_apply_crossdisc_remint.py`, `kb/_infer_disciplines_from_top.py`, `kb/_overmerge_dryrun.py`, `kb/_row_audit.py` | — |
| `kb/top_division_discipline_map.json` | scripts: `kb/_audit_subject_map.py`, `kb/_infer_disciplines_from_top_division.py`, `kb/_verify_top_division_inference.py` | — |
| `kb/top_gate_out/2026-07-16/impact.json` | scripts: `kb/_top_fold_gate_dryrun.py` | scripts: `kb/_top_fold_gate_dryrun.py` |
| `kb/trail_crew_out/2026-07-10/staged_fixes.json` | none found | scripts: `kb/_trail_crew_assemble.py` |
| `kb/trail_crew_out/2026-07-10/trail_report.md` | none found | scripts: `kb/_trail_crew_assemble.py` |
| `kb/twin_merge_out/<date>-postfold/alias_map.json` | scripts: `kb/_rekey_promotions.py` | — |
| `kb/twin_merge_out/<date>/alias_map.json` | scripts: `kb/_analyze_official_fold_evidence.py`, `kb/_rekey_promotions.py` | — |
| `kb/uc_cur_zscheme_out/2026-06-15/zseq_seed.json` | none found | scripts: `kb/_uc_cur_zscheme_dryrun.py` |
| `kb/uc_cur_zseq.json` | scripts: `kb/_authority_recode_apply.py`, `kb/_pols_remint.py`, `kb/_uc_cur_zscheme_apply.py`, `kb/_zband_retire_apply.py` | scripts: `kb/_pols_remint.py`, `kb/_uc_cur_zscheme_apply.py` |
| `kb/unclassified_assignments.json` | scripts: `kb/_apply_unclassified_triage.py`, `kb/_fold_unclassified.py`, `kb/_preseed_unclassified.py` | scripts: `kb/_apply_unclassified_triage.py` · committed by: `daily-dashboard.yml` |
| `kb/unclassified_fold` | none found | committed by: `daily-dashboard.yml` |
| `kb/unclassified_preseed.json` | tabs: `credential-reference` · scripts: `kb/_preseed_unclassified.py` | scripts: `kb/_preseed_unclassified.py` |
| `kb/unclassified_suggestions.json` | tabs: `credential-reference` · scripts: `kb/_fold_unclassified.py`, `kb/_suggest_unclassified.py` | scripts: `kb/_suggest_unclassified.py` · committed by: `daily-dashboard.yml` |
| `kb/unified_titles.json` | tabs: `credential-reference` · scripts: `excel_to_dashboard.py`, `kb/_audit_exhibits.py`, `kb/_cred_rename_apply.py`, `kb/_cred_rename_dryrun.py`, `kb/_curation_credentials_01.py`, `kb/_detect_cpl_type_dupes.py`, `kb/_eacr_dryrun.py`, `kb/_flag_hinky_exhibits.py`, `kb/_fold_unclassified.py`, `kb/_match_cos_authority.py`, `kb/_merge_credentials.py`, `kb/_preseed_unclassified.py`, `kb/_seed_coci_articulations.py`, `kb/classify_exhibits.py` | scripts: `kb/_flag_hinky_exhibits.py`, `kb/_fold_unclassified.py`, `kb/_seed_top50.py` · committed by: `cred-rename-apply.yml`, `daily-dashboard.yml` |
| `kb/workplan_goals_seed_out` | none found | committed by: `workplan-goals-seed-apply.yml` |
| `kb/workplan_goals_seed_plan.md` | none found | scripts: `kb/_seed_workplan_goals.py` · committed by: `workplan-goals-seed-apply.yml` |
| `kb/workplan_goals_snapshot.json` | scripts: `kb/_load_workplan_goals.py` | scripts: `kb/_load_workplan_goals.py` · committed by: `daily-dashboard.yml` |
| `kb/workplan_goals_validation.md` | none found | scripts: `kb/_validate_workplan_goals.py` · committed by: `workplan-goals-seed-apply.yml` |
| `kb/zband_retire_out/2026-09-03/capacity.json` | scripts: `kb/_zband_retire_dryrun.py` | — |
| `kb/zband_retire_out/2026-09-03/duplicates.json` | scripts: `kb/_zband_retire_dryrun.py` | — |
| `kb/zband_retire_out/2026-09-03/materialized.json` | scripts: `kb/_uc_cur_promote.py`, `kb/_zband_retire_apply.py` | — |
| `kb/zband_retire_out/<date>/alias_map.json` | scripts: `kb/_rekey_promotions.py` | — |
| `kpi_cards.js` | pages: `CPL_Dashboard.html` | — |
| `kpi_history.json` | scripts: `excel_to_dashboard.py` | scripts: `excel_to_dashboard.py` · committed by: `daily-dashboard.yml` |
| `kpi_reorder.js` | pages: `CPL_Dashboard.html` | — |
| `live_metrics.json` | tabs: `college-briefing` · pages: `fact-sheet/index.html` · scripts: `excel_to_dashboard.py`, `veteran-sprint-map/extract_military.py` · `edgefn:cpl-chat` | committed by: `daily-dashboard.yml` |
| `live_metrics_new.json` | workflows: `daily-dashboard.yml` | — |
| `map/probe_users_schema.py` | workflows: `map-users-schema-probe.yml` | — |
| `map/sync_map_users.py` | workflows: `map-users-sync.yml` | — |
| `map_cleanup_views.js` | pages: `CPL_Dashboard.html` | — |
| `map_data_quality.js` | pages: `CPL_Dashboard.html` | — |
| `map_export.js` | pages: `CPL_Dashboard.html` | — |
| `map_team_queue.js` | pages: `CPL_Dashboard.html` | — |
| `map_users.js` | tabs: `map-queue` · pages: `CPL_Dashboard.html` | — |
| `master_report.js` | pages: `CPL_Dashboard.html` | — |
| `mission_control.js` | pages: `CPL_Dashboard.html` | — |
| `nav_groups.js` | pages: `CPL_Dashboard.html` | — |
| `nav_overlay.js` | pages: `CPL_Dashboard.html` | — |
| `nc_learning_partners.js` | pages: `CPL_Dashboard.html` | — |
| `nudges/team_directory.json` | scripts: `nudges/build_nudges.py` | — |
| `our_process.js` | pages: `CPL_Dashboard.html` | — |
| `package.json` | scripts: `kb/doctrine.py` | — |
| `pipeline.js` | pages: `CPL_Dashboard.html` | — |
| `project_add.js` | pages: `CPL_Dashboard.html` | — |
| `project_lifecycle.js` | pages: `CPL_Dashboard.html` | — |
| `projects_editor.js` | pages: `CPL_Dashboard.html` | — |
| `prototype/ccr_atlas_data.json` | scripts: `kb/_build_ccr_atlas_extract.py`, `prototype/build_ccr_atlas.py` | — |
| `prototype/ccr_atlas_esl.js` | scripts: `prototype/build_ccr_atlas.py` | — |
| `prototype/ccr_atlas_esl.json` | scripts: `kb/_build_esl_fold_preview.py`, `prototype/build_ccr_atlas.py` | — |
| `prototype/ccr_atlas_graph.js` | scripts: `prototype/build_ccr_atlas.py` | — |
| `prototype/ccr_atlas_v1.html` | scripts: `prototype/build_ccr_atlas.py` | — |
| `prototype/ccr_desc/*.json` | pages: `prototype/skyview.html` | — |
| `prototype/ccr_universe.js` | scripts: `prototype/build_ccr_atlas.py` | — |
| `prototype/ccr_universe.json` | scripts: `kb/_build_ccr_universe.py`, `prototype/build_ccr_atlas.py` | — |
| `prototype/ccr_universe_members.json` | scripts: `kb/_audit_control_number_claims.py`, `kb/_build_ccr_universe.py`, `prototype/build_ccr_atlas.py` | — |
| `prototype/check_contrast.py` | workflows: `js-tests.yml` | — |
| `prototype/skyview.html` | scripts: `prototype/build_ccr_atlas.py` | scripts: `prototype/build_ccr_atlas.py` |
| `quickstart.js` | pages: `CPL_Dashboard.html` | — |
| `raci.js` | pages: `CPL_Dashboard.html` | — |
| `reflections/build_reflections_summary.py` | workflows: `weekly-reflections-summary.yml` | — |
| `reflections/summary.json` | scripts: `reflections/build_reflections_summary.py` | committed by: `weekly-reflections-summary.yml` |
| `remint_series_readings_rulings_<date>.json` | scripts: `kb/_authority_recode_apply.py` | — |
| `report_generator.js` | pages: `CPL_Dashboard.html` | — |
| `reports/CPL_Master_Report.docx` | none found | committed by: `daily-dashboard.yml` |
| `reports/projects/*.docx` | none found | committed by: `daily-dashboard.yml` |
| `reviewer_signin.js` | pages: `CPL_Dashboard.html` | — |
| `scripts/publish_skyview_desc_shards.sh` | workflows: `daily-dashboard.yml`, `skyview-desc-shards.yml` | — |
| `scripts/stamp_asset_versions.py` | workflows: `pages.yml` | — |
| `sierra/sierra.js` | pages: `sierra/index.html` | — |
| `sierra_training.js` | pages: `CPL_Dashboard.html` | — |
| `statewide/_probe_exhibit_authority.py` | workflows: `statewide-probe-authority.yml` | — |
| `statewide_interactive.js` | pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` | — |
| `tabs.js` | pages: `CPL_Dashboard.html` | — |
| `team_phrase.js` | pages: `CPL_Dashboard.html` | — |
| `team_phrase_header.js` | pages: `CPL_Dashboard.html` | — |
| `team_phrases.js` | pages: `CPL_Dashboard.html` | — |
| `tests/american_spelling_test.py` | workflows: `js-tests.yml` | — |
| `tests/authority_recode_apply_test.py` | workflows: `js-tests.yml` | — |
| `tests/ccr_universe_members_test.py` | workflows: `js-tests.yml` | — |
| `tests/ccr_universe_orbits_test.py` | workflows: `js-tests.yml` | — |
| `tests/context_budget_test.py` | workflows: `js-tests.yml` | — |
| `tests/custom_report_payload_test.py` | workflows: `map-custom-report-load.yml` | — |
| `tests/custom_report_response_test.py` | workflows: `js-tests.yml` | — |
| `tests/dependency_map_test.py` | workflows: `js-tests.yml` | — |
| `tests/docs_audit_test.py` | workflows: `js-tests.yml` | — |
| `tests/docs_index_build_test.py` | workflows: `js-tests.yml` | — |
| `tests/doctrine_lookup_test.py` | workflows: `js-tests.yml` | — |
| `tests/esl_fold_spotcheck_test.py` | workflows: `js-tests.yml` | — |
| `tests/esl_relevel_bands_test.py` | workflows: `js-tests.yml` | — |
| `tests/funding_origination_test.py` | workflows: `js-tests.yml` | — |
| `tests/governance_docs_panel.test.js` | workflows: `js-tests.yml` | — |
| `tests/identities_rekey_test.py` | workflows: `js-tests.yml` | — |
| `tests/js_suite_gate_test.py` | workflows: `js-tests.yml` | — |
| `tests/legacy_anchor_duplicates_test.py` | workflows: `js-tests.yml` | — |
| `tests/map_custom_report_sync_test.py` | workflows: `map-custom-report-load.yml` | — |
| `tests/merge_chain_flatten_test.py` | workflows: `js-tests.yml` | — |
| `tests/prefix_fold_apply_test.py` | workflows: `js-tests.yml` | — |
| `tests/prefix_fold_dryrun_test.py` | workflows: `js-tests.yml` | — |
| `tests/probe_lifecycle_checks_test.py` | workflows: `js-tests.yml` | — |
| `tests/rekey_crnc_mirrors_test.py` | workflows: `js-tests.yml` | — |
| `tests/rekey_kb_curation_chain_test.py` | workflows: `js-tests.yml` | — |
| `tests/supabase_function_grants_test.py` | workflows: `js-tests.yml` | — |
| `tests/uc_cur_promote_test.py` | workflows: `js-tests.yml` | — |
| `tests/zband_retire_apply_test.py` | workflows: `js-tests.yml` | — |
| `tmc/tmc_or_groups.json` | scripts: `tmc/_parse_tmc_pdfs.py` | — |
| `tmc_builder.js` | pages: `CPL_Dashboard.html` | — |
| `tools/first_light_candidates.json` | none found | committed by: `first-light-art.yml` |
| `tools/first_light_verify.json` | none found | committed by: `first-light-art.yml` |
| `tools/source_cpl_stories.mjs` | workflows: `cpl-stories.yml` | — |
| `tools/source_first_light_art.mjs` | workflows: `first-light-art.yml` | — |
| `unified_courses.js` | pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` | — |
| `unified_courses_details.js` | tabs: `unified-courses` · scripts: `excel_to_dashboard.py`, `kb/_infer_disciplines_from_desc.py` | scripts: `excel_to_dashboard.py` · committed by: `daily-dashboard.yml` |
| `veteran-sprint-map/ca_cpl_map_selfcontained.html` | pages: `CPL_Dashboard.html` · scripts: `veteran-sprint-map/build_selfcontained.py` | scripts: `veteran-sprint-map/build_selfcontained.py` |
| `veteran-sprint-map/california.geojson` | scripts: `veteran-sprint-map/build_selfcontained.py`, `veteran-sprint-map/build_static.py`, `veteran-sprint-map/build_static_ref.py` | — |
| `veteran-sprint-map/colleges_cpl.csv` | scripts: `veteran-sprint-map/build_selfcontained.py`, `veteran-sprint-map/build_web.py` | — |
| `veteran-sprint-map/military_by_college.json` | scripts: `veteran-sprint-map/build_selfcontained.py`, `veteran-sprint-map/build_static.py`, `veteran-sprint-map/build_static_ref.py`, `veteran-sprint-map/extract_military.py` | scripts: `veteran-sprint-map/extract_military.py` |
| `veteran_jst.json` | scripts: `excel_to_dashboard.py`, `fetch_veteran_jst.py`, `funding/_build_funding_performance.py` | scripts: `fetch_veteran_jst.py` · committed by: `daily-dashboard.yml` |
| `wave*_manifest.json` | scripts: `kb/_ccr_trail.py` | — |
| `workplan_goals.js` | pages: `CPL_Dashboard.html` | — |

## External services

| Service | Called by |
|---|---|
| `127.0.0.1` | `worker:cloudflare-worker-proxy.js`, `worker:worker-to-paste.js` |
| `127.0.0.1:` | modules: `prototype/check_ccr_atlas.js`, `prototype/check_funding_explainer.js`, `scripts/a11y.js`, `scripts/check_memory_briefing_layout.js` |
| `alameda.edu` | tabs: `map-queue`, `map-users` |
| `api.anthropic.com` | tabs: `annual-report` · pages: `CPL_Dashboard.html` · `edgefn:cpl-chat`, `edgefn:cpl-news-harvest`, `worker:cloudflare-worker-proxy.js`, `worker:worker-to-paste.js` |
| `api.careeronestop.org` | scripts: `kb/_sync_cos_certifications.py`, `kb/_sync_moc_crosswalk.py` |
| `api.gdeltproject.org` | `edgefn:cpl-news-harvest` |
| `api.github.com/repos/` | modules: `kb-portal/config.js` |
| `api.github.com/repos/cpl-initiative` | `worker:cloudflare-worker-proxy.js`, `worker:worker-to-paste.js` |
| `arc.losrios.edu` | tabs: `map-queue`, `map-users` |
| `bsky.app` | `edgefn:cpl-news-harvest` |
| `c-id.net` | scripts: `kb/_ingest_cid_articulations.py` |
| `c-idsystem.org` | scripts: `tmc/_parse_tmc_pdfs.py` |
| `california.public.law` | tabs: `college-briefing`, `implementation-funding` |
| `calmatters.org` | `edgefn:cpl-news-harvest` |
| `canadacollege.edu` | tabs: `map-queue`, `map-users` |
| `cdn.jsdelivr.net` | tabs: `pipeline` |
| `claude.ai` | workflows: `cpl-chat-health.yml` |
| `commons.wikimedia.org` | pages: `CPL_Dashboard.html` · scripts: `tools/source_first_light_art.mjs` |
| `counseling.santarosa.edu` | tabs: `map-queue`, `map-users` |
| `cpl-initiative.github.io` | tabs: `college-briefing`, `implementation-funding`, `map-queue`, `map-users` · scripts: `kb/_build_partner_crosswalk.py` · workflows: `daily-dashboard.yml` · `edgefn:cpl-chat`, `edgefn:cpl-news-harvest`, `worker:cloudflare-worker-proxy.js`, `worker:worker-to-paste.js` |
| `cpl-proxy.slee-548.workers.dev` | tabs: `annual-report`, `credential-reference`, `raci` · modules: `kb-portal/config.js` · pages: `CPL_Dashboard.html` · scripts: `excel_to_dashboard.py` · workflows: `daily-dashboard.yml` |
| `cpldashboardcccco.azurewebsites.net` | tabs: `college-briefing`, `cpl-pathways` · scripts: `chatbox/scrape_landing_pages.py`, `fetch_veteran_jst.py`, `kb/_build_futuro_hth_crosswalk.py` · `worker:cloudflare-worker-proxy.js`, `worker:worker-to-paste.js` |
| `crc.losrios.edu` | tabs: `map-queue`, `map-users` |
| `creditforbeingyou.org` | `edgefn:cpl-chat` |
| `customreportingmodule.azurewebsites.net` | scripts: `kb/_probe_new_custom_reports.py` |
| `datamart.cccco.edu` | scripts: `kb/_fetch_program_course_files.py` |
| `datastudio.google.com` | tabs: `cip-crosswalk` |
| `docs.google.com` | tabs: `nc-learning-partners` |
| `esm.sh` | pages: `kb-portal/index.html` |
| `fhweb.foothill.edu` | tabs: `map-queue`, `map-users` |
| `flc.losrios.edu` | tabs: `map-queue`, `map-users` |
| `fonts.googleapis.com` | scripts: `kb/_build_college_offering_crosswalk.py` |
| `fonts.gstatic.com` | scripts: `kb/_build_college_offering_crosswalk.py` |
| `foothill.edu` | tabs: `map-queue`, `map-users` |
| `futurohealth.org` | tabs: `map-queue`, `map-users` |
| `github.com` | pages: `kb-portal/index.html` |
| `github.com/CPL-Initiative/cpl-knowledge-base` | pages: `kb-portal/index.html` |
| `github.com/CPL-Initiative/cpl-project-tracker` | tabs: `governance`, `unified-courses` |
| `github.com/CPL-Initiative/cpl-project-tracker;` | scripts: `tools/source_first_light_art.mjs` |
| `github.com/cpl-initiative/cpl-project-tracker` | tabs: `unified-courses` |
| `icangotocollege.com` | tabs: `cpl-pathways` |
| `laney.edu` | tabs: `map-queue`, `map-users` |
| `launchapprenticeship.org` | tabs: `map-queue`, `map-users` |
| `localhost` | `edgefn:cpl-chat`, `worker:cloudflare-worker-proxy.js`, `worker:worker-to-paste.js` |
| `localhost:3000` | `edgefn:cpl-chat` |
| `localhost:8000` | modules: `prototype/ccr_universe.js` · `edgefn:cpl-chat` |
| `map-collegelanding-pages-bkh3ffghf4cqd7fu.westus-01` | scripts: `chatbox/scrape_landing_pages.py` |
| `map-collegelanding-pages-bkh3ffghf4cqd7fu.westus-01.azurewebsites.net` | scripts: `chatbox/scrape_landing_pages.py` |
| `map.rccd.edu` | tabs: `college-briefing`, `implementation-funding` · scripts: `kb/_seed_statewide_categories.py`, `tools/source_cpl_stories.mjs`, `veteran-sprint-map/build_selfcontained.py`, `veteran-sprint-map/build_web.py` · `edgefn:cpl-chat` |
| `mapwebapinew.azurewebsites.net` | scripts: `fetch_custom_report.py`, `kb/_discover_map_datasets.py`, `kb/_probe_confirmed_custom_reports.py`, `kb/_probe_exhibit_evidence_fields.py`, `kb/_probe_lifecycle_checks.py`, `kb/_probe_new_custom_reports.py`, `kb/_probe_new_custom_reports_followup.py`, `kb/_probe_student_detail_view.py`, `map/probe_users_schema.py`, `map/sync_map_users.py`, `statewide/_probe_exhibit_authority.py` |
| `merritt.edu` | tabs: `map-queue`, `map-users` |
| `miracosta.edu` | tabs: `map-queue`, `map-users` |
| `missioncollege.edu` | tabs: `map-queue`, `map-users` |
| `nces.ed.gov` | tabs: `cip-crosswalk` |
| `news.google.com` | `edgefn:cpl-news-harvest` |
| `noce.edu` | tabs: `map-queue`, `map-users` |
| `orangecoastcollege.edu` | tabs: `map-queue`, `map-users` |
| `pasadena.edu` | tabs: `map-queue`, `map-users` |
| `public.api.bsky.app` | `edgefn:cpl-news-harvest` |
| `raw.githubusercontent.com` | modules: `kb-portal/config.js` |
| `raw.githubusercontent.com/CPL-Initiative/cpl-project-tracker` | `edgefn:cpl-chat` |
| `raw.githubusercontent.com/{CPL_KB_REPO}/{CPL_KB_BRANCH}` | scripts: `excel_to_dashboard.py` |
| `scc.losrios.edu` | tabs: `map-queue`, `map-users` |
| `schemas.openxmlformats.org` | scripts: `kb/_build_55050_redline_docx.py` |
| `sdcce.edu` | tabs: `map-queue`, `map-users` |
| `skylinecollege.edu` | tabs: `map-queue`, `map-users` |
| `solano.edu` | tabs: `map-queue`, `map-users` |
| `ss.marin.edu` | tabs: `map-queue`, `map-users` |
| `studentrcc.sharepoint.com` | pages: `CPL_Dashboard.html` |
| `westhillscollege.com` | tabs: `map-queue`, `map-users` |
| `www.apprenticeship4you.com` | modules: `unified_courses_details.js` |
| `www.asccc.org` | tabs: `college-briefing`, `map-queue`, `map-users` |
| `www.avc.edu` | tabs: `map-queue`, `map-users` |
| `www.barstow.edu` | tabs: `map-queue`, `map-users` |
| `www.berkeleycitycollege.edu` | tabs: `map-queue`, `map-users` |
| `www.butte.edu` | tabs: `map-queue`, `map-users` |
| `www.calbright.edu` | tabs: `map-queue`, `map-users` |
| `www.canyons.edu` | tabs: `map-queue`, `map-users` |
| `www.careeronestop.org` | scripts: `kb/_sync_cos_certifications.py` |
| `www.cccco.edu` | tabs: `cip-crosswalk`, `cpl-pathways` · `edgefn:cpl-news-harvest` |
| `www.chaffey.edu` | tabs: `map-queue`, `map-users` |
| `www.citruscollege.edu` | tabs: `map-queue`, `map-users` |
| `www.cmccd.edu` | tabs: `map-queue`, `map-users` |
| `www.collegeofsanmateo.edu` | tabs: `map-queue`, `map-users` |
| `www.compton.edu` | tabs: `map-queue`, `map-users` |
| `www.contracosta.edu` | tabs: `map-queue`, `map-users` |
| `www.cos.edu` | tabs: `map-queue`, `map-users` |
| `www.craftonhills.edu` | tabs: `map-queue`, `map-users` |
| `www.cuyamaca.edu` | tabs: `map-queue`, `map-users` |
| `www.cypresscollege.edu` | tabs: `map-queue`, `map-users` |
| `www.dir.ca.gov` | scripts: `kb/_preseed_null_issuers.py` |
| `www.dvc.edu` | tabs: `map-queue`, `map-users` |
| `www.frc.edu` | tabs: `map-queue`, `map-users` |
| `www.fresnocitycollege.edu` | tabs: `map-queue`, `map-users` |
| `www.gavilan.edu` | tabs: `map-queue`, `map-users` |
| `www.goldenwestcollege.edu` | tabs: `map-queue`, `map-users` |
| `www.google.com` | tabs: `credential-reference` |
| `www.grossmont.edu` | tabs: `map-queue`, `map-users` |
| `www.hancockcollege.edu` | tabs: `map-queue`, `map-users` |
| `www.hartnell.edu` | tabs: `map-queue`, `map-users` |
| `www.imperial.edu` | tabs: `map-queue`, `map-users` |
| `www.ivc.edu` | tabs: `map-queue`, `map-users` |
| `www.lacc.edu` | tabs: `map-queue`, `map-users` |
| `www.lahc.edu` | tabs: `map-queue`, `map-users` |
| `www.lasc.edu` | tabs: `map-queue`, `map-users` |
| `www.lassencollege.edu` | tabs: `map-queue`, `map-users` |
| `www.lavc.edu` | tabs: `map-queue`, `map-users` |
| `www.ltcc.edu` | tabs: `map-queue`, `map-users` |
| `www.maderacollege.edu` | tabs: `map-queue`, `map-users` |
| `www.mccd.edu` | tabs: `map-queue`, `map-users` |
| `www.mendocino.edu` | tabs: `map-queue`, `map-users` |
| `www.miracosta.edu` | tabs: `map-queue`, `map-users` |
| `www.mtsac.edu` | tabs: `map-queue`, `map-users` |
| `www.napavalley.edu` | tabs: `map-queue`, `map-users` |
| `www.onetcenter.org` | scripts: `kb/_sync_moc_crosswalk.py` · workflows: `moc-crosswalk-sync.yml` |
| `www.oxnardcollege.edu` | tabs: `map-queue`, `map-users` |
| `www.palomar.edu` | tabs: `map-queue`, `map-users` |
| `www.paloverde.edu` | tabs: `map-queue`, `map-users` |
| `www.peralta.edu` | tabs: `map-queue`, `map-users` |
| `www.portervillecollege.edu` | tabs: `map-queue`, `map-users` |
| `www.reedleycollege.edu` | tabs: `map-queue`, `map-users` |
| `www.saddleback.edu` | tabs: `map-queue`, `map-users` |
| `www.sbcc.edu` | tabs: `map-queue`, `map-users` |
| `www.sccollege.edu` | tabs: `map-queue`, `map-users` |
| `www.sdccd.edu` | tabs: `map-queue`, `map-users` |
| `www.sierracollege.edu` | tabs: `map-queue`, `map-users` |
| `www.siskiyous.edu` | tabs: `map-queue`, `map-users` |
| `www.swccd.edu` | tabs: `map-queue`, `map-users` |
| `www.taftcollege.edu` | tabs: `map-queue`, `map-users` |
| `www.venturacollege.edu` | tabs: `map-queue`, `map-users` |
| `www.w3.org` | tabs: `cip-crosswalk`, `gr-priorities` · pages: `fact-sheet/index.html` · scripts: `veteran-sprint-map/build_selfcontained.py` |
| `www.westvalley.edu` | tabs: `map-queue`, `map-users` |
| `www.wiche.edu` | tabs: `college-briefing` |
| `www.wlac.edu` | tabs: `map-queue`, `map-users` |
| `x` | scripts: `kb/_verify_cos_sync_lanes.py` |
| `yc.yccd.edu` | tabs: `map-queue`, `map-users` |
| `…` | tabs: `cpl-news`, `gr-priorities` |

## Stale-copy risk

Tracked artifacts a main-committing workflow REBUILDS but never commits —
the committed copy silently drifts from what the cron computed:

- cpl_pathways_ccr_data.js rebuilt by kb/_build_cpl_pathway_ccr.py under daily-dashboard.yml but not in its commit list
- kb/credentials.json rebuilt by kb/_match_cos_authority.py under cos-authority-sync.yml but not in its commit list

## Not measured

An absent measurement is not a clean bill. Excluded on purpose: tests/
(guards), docs/ (prose naming datasets it does not read), archive/ (dead),
and the meta-scanners whose rest/v1 regexes are data, not dependencies:
`kb/_build_cobi_admin_surface.py`, `kb/_build_dependency_map.py`, `kb/_build_governance_candidates.py`.

Files with network/read markers where nothing could be attributed —
check these BY HAND before trusting an absence:

- `cpl_session.js`
- `reviewer_signin.js`

Coverage: 74 Supabase tables · 30 RPCs · 5 edge functions · 422 file
datasets · 137 external services · 315 consumers · 33 workflows · 37 tabs.
