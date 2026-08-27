# KB — Knowledge Base

This directory stores the synthetic-identity layers that sit above
MAP's `View_ArticulatedMAPExhibits` / `View_CollegeCourses` data. It is
the cached output of the **exhibit-canonicalization** skill (see
`.claude/skills/exhibit-canonicalization/SKILL.md`) and the design
doc that motivates it (`docs/exhibit_unification_vision.md`).

There are **two** layers:

- **Credential identity** — canonicalizes freehand exhibit *titles*
  into unified credential names plus issuing/training agencies.
  Files: `unified_titles.json`, `credentials.json`.
- **Course identity (common-course crosswalk)** — assigns each college
  course its best available common-course identifier so the same course
  taught at many colleges resolves to one identity. Files:
  `common_courses.json`, `course_crosswalk.json`. Seeded first from
  **Cx** (Credit-by-Exam) exhibits.

| File | Layer | Purpose | Keyed by |
|---|---|---|---|
| `unified_titles.json` | Credential | Map every distinct **raw** MAP exhibit title to its **unified** canonical name. Many-to-one. | `raw_title` |
| `credentials.json` | Credential | Per-credential issuer/trainer metadata. Composite key — same unified title can have multiple issuers (e.g. ICC vs NFPA Fire Inspector I). | `unified_title` → list of records keyed implicitly on `issuing_agency` |
| `common_courses.json` | Course | Catalog of common courses (identifier + title + official MQ discipline). | `course_id` (a CCN-ID, C-ID, or M-ID) |
| `course_crosswalk.json` | Course | Map each local college course → a `course_id`. Many-to-one. | `"<college> :: <course_code> :: <local_title>"` |
| `reference/cid_descriptors.json` | Reference | Official C-ID approved course descriptors (495). Read-only authority. | — |
| `reference/ccn_courses.json` | Reference | Approved AB 1111 Common Course Numbers (58 so far), from COCI. Read-only authority. | — |
| `reference/mq_disciplines.json` | Reference | Official CCC discipline titles (19th Ed. Minimum Qualifications Disciplines Index) — **248 titles** (re-validated 2026-07-11 by a positional PDF re-parse; the prior text parse had dropped 8, incl. Accounting; #746). Controlled vocabulary for the `discipline` field + the CCR fire-gate. Companion `reference/mq_sections.json` carries per-discipline `mq_list` (masters / not_masters / both_lists / noncredit_53412) — the faculty-qualification signal the CSR renders as 🎓/🔧 chips and the CCR scanner feeds adjudicators. | — |
| `reference/subject_discipline_map.json` | Reference | Subject-code → MQ discipline lookup used by the M-ID consolidation generator (STAGING draft; 309 unambiguous codes mapped, ambiguous/bucket codes deliberately left null). Built by `_seed_subject_discipline_map.py`. | normalized subject code |
| `reference/coci_course_list.xlsx` | Reference | Raw per-college COCI course list (~24MB, 141,738 rows): College, CourseControlNumber, Subject, Course_Number, CourseTitle, UnitValue, CreditType, Non_Credit_Category, TopCode, **CIDNumber**, **CatalogDescription**, **CommonCourseNumber**. Read-only build input — `excel_to_dashboard.py` streams it (openpyxl read-only; **never cat it**) for the member-college rows + description fallbacks. | — |
| `college_short_names.json` | Reference | Curator-provided college full-name → short-name map (118 colleges) for compact chips across CCR/EACR/CER. `_meta` + `colleges[]` of `{canonical, short (Title Case), short_caps (ALL CAPS), aliases[]}`. Consumed in the browser via the root `college_short_names.js` resolver (`window.cplCollegeShort`); NOT a daily-cron artifact. See [`docs/kb-notes/reference-college-short-names.md`](../docs/kb-notes/reference-college-short-names.md). | `canonical` college name |
| `_seed_college_short_names.py` | Reference | **Re-runnable, idempotent.** Builds `college_short_names.json` + the root `college_short_names.js` from the embedded curator table; applies short-name cleanups + Title-Case special cases; discovers spelling aliases; asserts no two colleges collapse to one normalized key; reports every chip-name string that fails to resolve against the live data. Edit + re-run when the dataset changes. **The emitted resolver indexes `canonical` + `aliases` + `short` + `short_caps`** (2026-08-11) so it ROUND-TRIPS its own output — before that it did not, and `cplCollegeShort("LA Swest")` fell through to the safe fallback, silently losing Los Angeles Southwest College from any join routed through it. Mirrors the Python resolver in `funding/_build_funding_performance.py`; verified collision-free at 146 normalized keys. | — |
| `discipline_inference.json` | Course | Authored, editable lexicon for filling blank disciplines: `subject_map` (subject → discipline; entries may be **college-scoped** `{discipline, colleges}` for homonym subjects — Session 45) + `title_keyword` fallback. Applied by `_infer_disciplines.py`; validated by `_audit_subject_map.py` (curator clearances persist in `_subject_map_notes.audit_cleared`). | — |
| `coci_curation.json` | Course | Human curation overlay synced from Supabase `kb_curation` by `_apply_curation.py`; each entry carries curated fields (`discipline`, `merge_into`, `unified_title`, `description`) + `reviewed_by` + `reviewed_at`. Applied on top of the AI drafts by `excel_to_dashboard.py` (regen-safe). | `course_id` |
| `_infer_disciplines.py` | Course | **Re-runnable** discipline inference: applies `discipline_inference.json` to the minted/cluster/singleton staging files. Validates targets against `mq_disciplines.json`; skips reviewed/curated; stamps `discipline_source`/`_confidence`/`_inferred_at` (`subject_map`\|`title_keyword`). Re-derives + **RETRACTS its own prior fills** when the lexicon changes (Session 45 — removals propagate; the later passes re-fill from per-row evidence); other passes' fills untouched. College-scoped entries fire only when every college behind the row is allowlisted. | — |
| `_infer_disciplines_from_desc.py` | Course | **Re-runnable** description-aware discipline inference (complement to the above): scores the course *description* against a safe, high-precision phrase set (plurality, unique-winner). Descriptions from in-file `description`/`synthesized_description` (parents) + generated `unified_courses_details.js` (singletons; skipped if absent). Stamps `discipline_source="description"` at confidence 0.5. Skips reviewed/curated; fills blanks only. | — |
| `_infer_disciplines_from_top.py` | Course | **Re-runnable** TOP-aware discipline inference (highest-yield): maps each blank course's `top_code` → MQ discipline via `top_discipline_map.json`. Stamps `discipline_source="top_code"` at confidence 0.5. Skips reviewed/curated + the coarse catch-all TOP codes (omitted from the map); fills blanks only. | — |
| `top_discipline_map.json` | Course | Authored TOP code → MQ discipline map for the pass above. Only codes whose TOP program title maps cleanly to ONE MQ discipline (a low-confidence, blanks-only *suggestion* — TOP is a last-in-line signal, not authoritative); coarse `4930.xx` / `*99 Other` / `* General` buckets deliberately omitted. Validated against `mq_disciplines.json`. | TOP code |
| `_infer_disciplines_from_top_division.py` | Course | **Re-runnable, COARSEST tier (Session 37, 2026-06-09).** Fills the orphan tail the precise passes leave blank (catch-all 6-digit codes) with the broad umbrella discipline of their **2-digit TOP division** via `top_division_discipline_map.json`. Stamps `discipline_source="top_division"` at confidence **0.4** (`⚙ TOP-div` badge + "by TOP division" filter). A deliberate, reversible relaxation of the "leave catch-alls blank" guardrail so ~5.9k orphan singletons stop being invisible to the CSR. **Filled 6,590** (blanks ~7,193→~580). Run, then re-seed the CSR (`_seed_canonical_subj4.py`). Validates targets against MQ; skips reviewed/curated; fills blanks only. Tested by `_verify_top_division_inference.py`. | — |
| `_audit_subject_map.py` | Course | **Re-runnable homonym auditor (Session 45 — the CRIM M1003 case).** Validates every `subject_map` entry statewide: per-college TOP-division votes (internal-consistency gated) + minority-title evidence grading (`foreign`/`mixed`/`consistent`; curator clearances suppress re-flags). Receipt `subject_map_audit.json`. Run after every lexicon edit; repair = scope/remove the entry, then re-run the inference chain. See `docs/kb-notes/methodology-college-homonym-subject-codes.md`. | — |
| `_desc_consolidation_dryrun.py` | Course | **Re-runnable description-similarity consolidator for DARK M-IDs** (no C-ID/CCN claim, no c-id.net coverage, no promotions, no curation — 13.9k of 16.1k post-#379). TF-IDF cosine over catalog descriptions; gates = cosine ≥0.60 + credit + units(±0.5) + not-the-title-lane's + the shared `_consolidation_guards.py` title-safety suite. Receipt `desc_consolidation_out/candidates.json` (416 groups post-twin-merge; 121 cross-college) — **committed input** the generator joins into the worklist as `desc_groups`; re-run termly like the c-id.net refresh + after any twin-merge apply. Never auto-applies. | — |
| `_consolidation_guards.py` | Course | **Shared title-safety guard suite (Session 46)** imported by BOTH consolidation receipt builders so they can't drift: **two-axis level marks** (word-levels vs digit-levels — kills the "Elementary X 2" / "Intermediate X 1" flat-set collision; digits, romans, **cardinal word-numbers**, A/B + context-marked session letters), **strict-equality variant-type marks** (refresher/update/supplemental/instructor/supervisor/module/bridge/honors — a variant never pairs with its base), **year edition marks** (15xx–20xx), gender + sport marks. `docs/kb-notes/methodology-title-similarity-merge-guards.md`. | — |
| `_title_consolidation_dryrun.py` | Course | **Re-runnable title-similarity consolidator (Session 46 — the AUTO/smog over-mint case)** over dark M-IDs **+ Stand-Alone singletons** (66.9k titles — the desc lane can't see singletons, and 42 of the 52 smog fragments were singletons). IDF-weighted title-token cosine ≥0.62; gates = credit + discipline-OR-TOP-division corroboration + ≥2 shared content tokens + the shared guard suite; **NO units gate** (licensure-spec courses pack 1–7u by college — spread is reported, not gated); **clique-consistent components** (unmarked titles can't chain Level 1 + Level 2). Receipt `title_consolidation_out/candidates.json` (5,584 groups post-twin-merge; 4,358 cross-college; 2,215 mixed) — **committed input** joined as `title_groups` (🏷, the 6th worklist section; mixed groups merge into the M-ID, all-singleton groups mint new). Re-run termly + after any twin-merge apply. Never auto-applies. | — |
| `_similar_family_dryrun.py` | Course | **Measure-first dry-run for the consolidation loosening (Session 57).** Groups minted M-IDs + Stand-Alone singletons by a **level-COLLAPSING same-subject** signature (folds the level axis — level words, roman/word/digit ordinals, a–h section letters — mirroring `_consolidation_guards`); reports family yield + quality (units spread, cross-college, discipline agreement). It MEASURED the level-collapse before Sam's call to make it the worklist default: 7,849 raw families / 24,060 ids, 99% discipline-unanimous. The decision shipped by making `excel_to_dashboard.py`'s `_sug_sig` level-collapsing (#442) so the worklist itself merges across levels (suggestions-only / curator-confirmed). Receipt `similar_family_out/candidates.json` is **gitignored** (regenerable; not consumed — unlike the title/desc receipts). Scope: `docs/similar_course_family_scope.md`; ADR: `docs/kb-notes/adr-level-collapsing-consolidation.md`. | — |
| `_sug_segment_dryrun.py` | Course | **Measure-first dry-run for the worklist signature (`_sug_sig`) — Session 58.** Replicates the generator's signature (segment-fold + synonym-map) over minted M-IDs + singletons and prints regrouping impact + a biggest-group over-merge guard. Loads **`synonym_map.json`** (curated abbreviation↔expansion — ESL≡English as a Second Language, ASL/PE/Math/AJ — because a similarity threshold can't bridge a zero-overlap synonym; add a pair only after grepping the bare canonical token for collisions) plus the `_SUG_SEGMENT` divider words (part/semester/module/half/level). Measurement-only; the worklist is suggestions-only / curator-confirmed. KB note: `docs/kb-notes/methodology-synonym-map-vs-similarity-threshold.md`. | — |
| `_synonym_candidate_dryrun.py` | Course | **Re-runnable synonym-candidate validator (Session 62).** Automates the Session-58 rule *grep the bare canonical token for collisions before adding a `synonym_map.json` pair*: scans the title corpus for each candidate's standalone abbreviation and reports whether every hit is genuinely that subject. Cleared ECE/EMT/CNA/HVAC/LVN (#461); **rejected** `cis`/`cd`/`ma` (ambiguous). Measurement-only; the worklist stays suggestions-only / curator-confirmed. | — |
| `_morphological_variant_dryrun.py` | Course | **Measure-first dry-run for the morphological fold (Session 70).** Replicates `_sug_sig` exactly, then adds a conservative suffix-stripping stemmer (conversation/conversational→conv, assisting/assistant→assist, welding/welds→weld) and compares current vs stemmed grouping over the full data.js + standalone.js identity pool. Sized the apply (#509): **+866** identities into merge groups via 572 new unions (326 clean / 246 cross-discipline). Receipt `morph_variant_out/<date>/{report.md,dryrun.json}`. The stemmer is byte-identical to the one now in `excel_to_dashboard.py`'s `_sug_sig`; cross-discipline unions surface in the worklist with a "⚠ Spans N disciplines" flag (not withheld — suggestions-only). Measurement-only. | — |
| `_apply_twin_merge_statewide.py` | Course | **STATEWIDE strict twin-merge (Session 46 — Sam: "consolidations that should happen")**, the Session-39 KINE/FLSP pass unscoped + hardened. Twin key `(subj4, discipline, band, strict_fam, credit_status, typical_units)` **+ the `_consolidation_guards.py` clique gate** (the ordinal-rule fam key drops "1", so "X Level 1 & 2" fam-equals "X Level 2" — level marks catch it; any conflicting pair sends the whole group to the worklist). Winner = existing curator merge-target > corroboration > lowest M-number. First apply 2026-06-12: **589 losers absorbed** (16,143→15,554), 107 articulations re-pointed, 65 groups guard-skipped, V-gates G1–G6 + Supabase mirror + promotions re-key (registered in `_rekey_promotions.py` ALIAS_MAPS). Receipts `twin_merge_out/2026-06-12/`. Dry-run default; `--apply` mutates. | — |
| `top_division_discipline_map.json` | Course | Authored 2-digit TOP **division** → MQ-verified umbrella discipline (19 mapped: `49`→Interdisciplinary Studies, `12`→Health, `09`→Industrial Technology, …; 5 skipped — Media/Fine-Arts/Commercial/2-untitled — no honest umbrella → stay blank). Division titles from `TOP_Code_Lookup.xlsx`. The pass aborts if any target isn't in `mq_disciplines.json`. | TOP division |
| `_apply_curation.py` | Course | Sync Supabase `kb_curation` → `coci_curation.json` (needs `SUPABASE_SERVICE_KEY`). Run in the daily workflow; safe to run manually. | — |
| `_rekey_promotions.py` | Course | **Re-runnable, idempotent — MANDATORY after every re-mint (Rule 7 checklist / fan-in guard 7).** Re-keys `promotions.json` (the Phase A/B official-ID fold evidence) through every applied alias map; folds converged keys (witnesses sum, colleges union); V1–V4 conservation gates; receipts `promotions_rekey_out/<date>/`. Added 2026-06-11 after four re-mints skipped the manifest and silently severed 53% of the fold evidence (`docs/official_id_fold_scope.md`). Dry-run default; `--apply` writes. | — |
| `_analyze_official_fold_evidence.py` | Course | **Read-only drift detector** for the promotions evidence: resolves keys through the alias chain, reports severance counts, R2 evidence tiers, the Spanish-family table, and validation against existing curator merges. Its re-keyed-resolvable count should stay ~0 while the Rule-7 checklist is honored. | — |
| `_analyze_witness_kinship.py` | Course | **Read-only measure-first analyzer for the WITNESS-KINSHIP gate** (Session 41): per promotions record, resolves each witness's claimant course from the raw list and scores title kinship vs the remnant (and vs the official catalog title). The gate it models is live in `_official_match()`/`_row_official()` (excel_to_dashboard.py): a witness only drives an auto-fold if kin-valid — receipts describe the FAMILY THAT EXISTED AT THE RE-MINT, and ids that survive a later split keep receipts that no longer describe them (no re-key can fix that; 781/1,635 edges were stale, incl. one with 40 unanimous stale witnesses). Also the recovery path for the 340 blocked singleton receipts R4 left un-laned. `docs/kb-notes/methodology-witness-kinship-gate.md`. | — |
| `discipline_canonical_subj4.json` | Course | **Phase 1e** — curator-confirmed canonical 4-letter SUBJ4 per M-ID discipline + per-discipline TOP/CTE/CIP + `local_subject_variants` (raw college subject codes joined from memberships, added in PR #109). Consumed by the SUBJ4-canonicalization re-mint to fold same-discipline SUBJ4 variants (e.g. ASL/AMSL/DEAF/SIGN/… → one canonical). Edited via the dashboard's **Common Subject Code** tab (writes to Supabase `kb_curation` with synthesized `_CANON_SUBJ4::<discipline>` namespace). | discipline |
| `_seed_canonical_subj4.py` | Course | **Re-runnable, regen-safe.** Generates `discipline_canonical_subj4.json` by counting SUBJ4 variants per discipline across both `coci_minted_courses.json` + `coci_minted_singletons.json`, plus joining `coci_minted_memberships.json` for raw local college subject codes (`local_subject_variants` field). Also aggregates TOP code modal + 4-digit category + CTE share + flag. Preserves curator-reviewed/validated entries on re-run; only the data-driven fields refresh. **TOP-gate (2026-07-16, #800):** rows whose discipline is TOP-sourced (`top_code`/`top_division`) are excluded from the canonical-SUBJ4 vote via `_top_gate.discipline_is_corroborated`; disciplines are still enumerated over all rows, so a discipline resting entirely on TOP appears with a blank canonical + `top_only`/`corroborated_voters` flags. | — |
| `_top_gate.py` | Course | **The shared TOP identity-gating predicate (2026-07-16, #800).** `discipline_is_corroborated(rec)` — a row may participate in an identity decision (SUBJ4 vote/fold) iff its discipline is present AND not `top_code`/`top_division`-sourced. The one contract the seed + every future fold/apply consult ("gate identity, keep display"). Doctrine: `docs/kb-notes/methodology-top-is-a-last-in-line-signal.md`. | — |
| `_top_fold_gate_dryrun.py` | Course | **READ-ONLY** impact measurement for the TOP identity gate — never writes the curated identity map. Reports rows held from the vote (17,059), disciplines with a corroborated anchor (130) vs entirely-TOP (16). Receipt → `kb/top_gate_out/<date>/impact.json`. | — |
| `_apply_canonical_subj4.py` | Course | Sync Supabase `_CANON_SUBJ4::*` rows → `discipline_canonical_subj4.json`. Mirrors `_apply_curation.py` pattern; runs in the daily workflow after the main curation sync. Validates 4-letter SUBJ4 before applying. | — |
| `_apply_unclassified_triage.py` | Exhibit | **CER unclassified-triage PR-2.** Sync Supabase `_UNCLASSIFIED::<raw_title>` rows (the CER worklist's raw-title→unified-title assignments) → `unclassified_assignments.json`. Mirrors `_apply_credential_review.py`; idempotent (no rewrite when unchanged → no empty-overlay daily churn). Records only — the fold into `unified_titles.json`/`credentials.json` is the dry-run-first PR-3. | — |
| `unclassified_assignments.json` | Exhibit | Git-canonical overlay of CER unclassified-triage assignments: `raw_title → {unified_title, issuing_agency, reviewed_by, reviewed_at}`. Synced daily by `_apply_unclassified_triage.py`. Durable record + the input `_fold_unclassified.py` consumes. | `raw_title` |
| `_fold_unclassified.py` | Exhibit | **CER unclassified-triage PR-3 — the FOLD (in the daily cron since 2026-07-07 as `--apply-if-safe`).** Dry-run-first (`--apply`), V-gates V1–V4. Reads `unclassified_assignments.json` → ADDs `raw_title → {unified_title, confidence 1.0, classified_by curator}` to `unified_titles.json` (+ `credentials.json` if the title has no record) + PRUNES the folded raws from `exhibit_audit/latest.json` (minified, matching the auditor). Buckets: already-classified→SKIP; **SUPERSEDE** (2026-07-07) — a curator assignment beats an UNREVIEWED MACHINE draft across whitespace-twin spellings, re-points those raws' `coci_articulations.json` rows in-apply, prunes orphaned machine credential records, fills a null issuer on an unreviewed target record; **STALE** — overlay older than a curator KB decision (report-only, no gate); human-reviewed disagreement→CONFLICT (blocks). Clean-lane articulation ripples still block (methodology note's human call). Receipt → `unclassified_fold/<date>/`. | — |
| `_apply_credential_review.py` | Exhibit | Sync Supabase `_CREDENTIAL_REVIEW::<unified_title>` overrides → `credential_review_overlay.json`, then PROMOTE canonically into `credentials.json`: **Mode A2** issuer fill-or-append (BOTH `issuing_agency_override` and, since Session 106, `issuing_agency_additional_override` — Rule 4 multi-issuer; never overwrites) + **Mode A3** trainer fill-when-null. Title renames recorded-not-applied (Mode B → the PR-5b re-key). Daily cron. | — |
| `_preseed_unclassified.py` | Exhibit | **STAGED pre-seed for the CER unclassified worklist** (Rule 5e — prefill-only, the curator's Save writes): brand families (Rule 5d), CSLB, statewide catalog, CPL-type router. Verified by `_verify_preseed_rules.py` (100 checks). Regenerate only against a FRESH bake. | — |
| `_preseed_null_issuers.py` | Exhibit | **STAGED pre-seed for the CER issuer lane** (`issuer_preseed.json`, plan schema v2: `title`/`trainer`/`issuer:null`/`resurface`). Lanes: statewide · statewide-agency (blank statewide issuer → curated agency, e.g. AWS welding) · family · **cert-family** (FAA aviation) · apprenticeship (Norco/Santiago DIR-DAS sponsors) · cx→CCC · course-as-exhibit ("" verdict) · Rule-5f local-trainer · Rule-5c course-title · Rule-5g title-style. Every staged title styled per Rule 5g (level word → end, "Intro" → "Introduction"). **Session 108 (#707): Rule 5c resolves code-shaped titles** — tight-hyphen parse ("CD-005"), decoration-immune sanity guard, college-scoped subject-PREFIX hop ("Cinema 24" → CCSF CINE 24), and a staged title that is still a bare code gets UPGRADED to the resolved CCN > C-ID > COCI title (receipted). **Sam's HS rule (#710):** fused `**HS` tokens (BIRMINGHAM CCHS), dotted "H.S.", all-caps/display-title HS signals, and multi-school rows → the "Local High School" placeholder; bare `HS ###` before digits is a SUBJECT code, never a school. Verified by `_verify_issuer_preseed.py` (63 checks, queue-anchored spots presence-conditional). Regenerate AFTER the cron publishes a fresh bake. | — |
| `_detect_cpl_type_dupes.py` | Exhibit | **READ-ONLY CPL-type-duplicate detector** feeding `credential_merges.json`. Signal A = normalized-title collisions (&/and/punctuation — prints ready-to-paste snippets, high precision). Signal B = same `course_id`+local-course, different `unified_title` (manual review), gated by full-title Jaccard ≥0.5 + a level-safe guard + (2026-06-09, Session 37) an **elective-bucket** gate that suppresses pairs sharing ONLY a generic dumping-ground course (mirrors the CER R1 ≥0.8-elective / ≥5-credential / ≤3-college rule; e.g. COMM M1038). On current data: Signal B 162→77 after the gate. | — |
| `_merge_credentials.py` | Exhibit | **CER credential MERGE (existing→existing).** Sibling of `_fold_unclassified.py` (which is unclassified→existing). Dry-run-first (`--apply`), V-gates V1–V4. Folds a `loser` unified_title into a `winner`: re-points the loser's raws in `unified_titles.json`, DROPs the orphan loser record in `credentials.json` (winner authoritative; MOVEs it if the winner has none), and re-points the loser's records in `coci_articulations.json`. For near-duplicate AI titles of the **same exhibit** (e.g. one exhibit entered under two CPL types → two titles — the 10-Key case). Idempotent: loser already gone → SKIP. Receipt → `credential_merges_out/<date>/`. (Session 32, #285) | — |
| `_sync_cos_certifications.py` | Exhibit | **CareerOneStop authority sync (runner-only).** Pulls the national Certification Finder registry (bulk flat file, API fallback) into `reference/cos_certifications.json` via `.github/workflows/cos-authority-sync.yml` (dispatch `mode=probe` first; monthly cron). Sandbox cannot reach careeronestop.org. Display requires USDOL ETA / MN DEED attribution. | — |
| `_verify_cos_sync_lanes.py` | Exhibit | **No-network verify harness for the COS sync lanes** (23 checks, mocked `api_get`): acronym-suffix split edge cases (level tokens exempt), both lanes' record shape, pagination scenarios (sub-limit page caps, ignored-startRecord bail, empty-keyword full-pass skip, fail-soft keyword). Run after ANY `_sync_cos_certifications.py` edit. (Session 101, #676) | — |
| `_sync_moc_crosswalk.py` | Exhibit | **Military COOL/MOC crosswalk sync (runner-only).** Pulls the O*NET MOC→O*NET-SOC crosswalk (milx bulk zip; numbered ONET1..4 columns, '-' sentinel, change-history rows aggregated per (branch, code)) into `reference/moc_crosswalk.json` (33,874 MOCs, 52% mapped) via `moc-crosswalk-sync.yml` (probe-first; monthly cron day-5; same COS secrets). The veteran-pathway bridge's first leg — the cert finder accepts a dotted O*NET code as KEYWORD (probe-proven), so MOC → ONET → COS certs → CER anchors. Registry tracker-internal (pages.yml prune). (Session 101, #679–#681) | — |
| `_match_cos_authority.py` | Exhibit | **COS authority match ladder.** exact → acronym → token-subset contains (level guard: Firefighter I ≠ II; `+`-folding: CompTIA A+ ≠ Network+) → org-fuzzy, over every unified title. Writes `cos_matches.json` (derived overlay → the CER ✓/≈ COS chips) + receipts `cos_match_out/<date>/`; ambiguous matches skipped + reported. `--apply-issuers` (null-issuer, unreviewed records, T1/T2 only) is a deliberate manual step. | `unified_title` |
| `_suggest_unclassified.py` | Exhibit | **Rule-5c identity suggestions** for the CER triage worklist (daily cron, after the exhibit auditor). Parses local course codes from unclassified raw titles → COCI (SUBJ,NUM) join (unanimous-identity + remainder-title-overlap guards; AP/IB/CLEP excluded) → suggests CCN > C-ID > COS-authority > modal-course titles as `unclassified_suggestions.json` (the worklist's 💡 fill chips; curator confirms). M-ID tier gated behind `--with-mids` until Sam declares the layer stable. | `raw_title` |
| `credential_merges.json` | Exhibit | Curator-confirmed merge decisions consumed by `_merge_credentials.py`: `merges: [{loser, winner, reviewed_by, reviewed_at, reason}]`. Add a one-line entry per merge; re-run the tool. | — |
| `_subj4_dryrun.py` | Course | **Phase 1e measure-first dry-run.** Re-runnable. Reads the curator-confirmed canonical map, classifies every M-ID's fate, reallocates new course_ids deterministically by `(normalized_title, old_id)`, validates **5 gates** (including V4 `new_id_disjoint_from_untouched`, added 2026-05-23 after a 386-row silent-overwrite bug), surfaces curated-collision decision points, counts downstream apply scope, reserves CCN/C-ID sequence numbers + untouched-row suffixes. Writes `kb/subj4_dryrun/{report.md, alias_map.json, blocked.json, collisions.json}`. | — |
| `_subj4_apply.py` | Course | **Phase 1e atomic apply — REBUILT 2026-06-12 (Session 50, the canonical fold).** No longer consumes the frozen plan verbatim: calls `_subj4_dryrun.compute_plan()` (apply == spec by construction; `docs/kb-notes/methodology-apply-equals-spec-via-shared-allocator.md`) with gates **P1** recomputed-plan == frozen reviewed plan (byte), **P2** apply-readiness, **P3** `--curation-export` fresh-read rebuilds the committed overlay, **G1–G8** post-mutation conservation. Mutates minted/singletons/memberships/articulations/curation in place (per-row `_subj4_fold_from` stamps; `merge_into` values re-pointed; record order kept for diff hygiene), emits the exact Supabase `kb_curation` ops (`supabase_ops.json` — executed via the MCP `execute_sql` lane in the same cron window after a PK-order simulation), restamps the consumed dry-run's `_status`. Receipts: `kb/subj4_fold_out/<date>/`. ⚠ The 2026-05-23 receipts in `kb/subj4_apply/` are REGISTERED HISTORY (`_rekey_promotions.py` ALIAS_MAPS) — never overwrite that dir. | — |
| `_post_apply_chain.py` | Course | **Rule-7 post-apply chain driver (Session 50).** Runs the none-skippable downstream chain after a re-mint apply + ALIAS_MAPS registration, fail-fast with `--from` resume: promotions re-key → CSR re-seed → row audit → desc receipt → title receipt → fold-verify dry-run (redirected via `SUBJ4_DRYRUN_OUT` so the frozen receipts aren't churned). Prints the before/after `subject_collision_signal` receipt. | — |
| `foreign_language_subj4.json` | Course | **Umbrella-discipline map (Session 37).** Per-language SUBJ4 for the "Foreign Languages" MQ umbrella — `FL` + 2-letter (FLSP/FLFR/FLCH/…); classifier uses the self-describing TOP-11xx language taxonomy (a rare exception where the TOP title names the language) *corroborated by* title + member-subject — not TOP alone. NOT a cron artifact. See `docs/fl_subj4_remint_scope.md`. | language |
| `_fl_subj4_dryrun.py` | Course | **READ-ONLY measure-first dry-run** for the FL SUBJ4 split. Classifies 409 FLNG M-IDs + 1,045 singletons → per-language SUBJ4 (99.5%, via the self-describing CCC TOP-11xx taxonomy); manifest at `kb/fl_subj4_dryrun/manifest.json`. | — |
| `_apply_fl_subj4_remint.py` | Course | **FL SUBJ4 re-mint apply (Rule 7).** Re-prefixes `FLNG M#### → FL** M####` (keeps the unique number → collision-free, no re-sequence); re-keys courses/singletons/memberships/articulations/curation + the `discipline_canonical_subj4` "Foreign Languages" umbrella entry. **Discipline stays "Foreign Languages."** Dry-run + `--apply`, V1–V4; receipt `kb/fl_subj4_out/<date>/alias_map.json`. (Session 37, #328) | — |
| `discipline_aliases.json` | Course | **Fan-in alias map (Session 38).** Canonical discipline → its **alternate names** ("Kinesiology" ← "Physical Education"; "Drama/Theater Arts" ← "Theater Arts"). The inverse of the umbrella split: two MQ names for one converging field fold to a canonical; the alternate stays in the MQ vocab (never deleted) + surfaces as an "also:" chip. See `docs/kin_pe_convergence_scope.md`. | canonical discipline |
| `_apply_kin_pe_convergence.py` | Course | **KIN/PE fan-in convergence apply (Rule 7, Session 38, #334).** Discipline-scoped (NEVER `subject_4letter` — `PHYS` was overloaded with Physics): "Physical Education" → Kinesiology, carve-outs adapted→`PEDS` (new MQ "Physical Education Disabled Students") + intercollegiate→`ATHL`; the 88 level-safe (band,`_fam_key`+roman-strict) duplicates MERGE into their KINE twin (band-cap fit), orphans re-sequence. Dry-run + `--apply`, V-gates; receipt `kb/kin_pe_out/<date>/alias_map.json`. | — |
| `_apply_drama_theater_convergence.py` | Course | **Drama/Theater fan-in apply (Rule 7, Session 38, #335).** "Theater Arts" → canonical "Drama/Theater Arts" (MQ slash form), SUBJ4 `THEA`; 4 merges + 50 re-sequences + 266 discipline flips. Asserts no SUBJ4 overload before touching anything. Receipt `kb/drama_theater_out/<date>/alias_map.json`. | — |
| `_apply_convergence_singletons.py` | Course | **Singleton-layer convergence extension (Session 38, #335).** The parent applies left ~56k stand-alones on the old names; same rules, NO merging at this layer (the worklist's job): 2,929 ids re-keyed collision-aware in the stand-alone `M<band><d><LL>` space + 1,187 discipline flips. Receipt `kb/convergence_singletons_out/<date>/alias_map.json`. | — |
| `_apply_kine_flsp_twin_merge.py` | Course | **KINE/FLSP strict twin-merge (Rule 7, Session 39, Sam-authorized).** Merges ONLY the strictest twin class the convergences exposed — same discipline + band + STRICT level-safe fam (roman-fixed) + `credit_status` + `typical_units`; winner = most corroborated; merge-only (no re-numbering). 70 groups / 74 losers (16,217 → 16,143). Prints any curation rows needing the **Supabase `kb_curation` mirror** (fan-in guard 6 — the local overlay is a rebuild target). ⚠ Do NOT extend to `CISC` without the single-letter guard (`R Programming` ≠ `C# Programming` — `docs/cis_cs_convergence_scope.md` §3). Receipt `kb/twin_merge_out/<date>/alias_map.json`. | — |
| `_subj4_apply_supabase.py` | Course | **Phase 1e Supabase row renames.** Pre-fetches the curated `course_id` set (so we only PATCH the ~7 aliases with live rows instead of fanning out 13k network calls — caught 2026-05-23). Best-effort per record with verbose log at `kb/subj4_apply/supabase_log.json`. | — |
| `_uc_cur_zscheme_dryrun.py` | Unified | **UC-CUR → Z-scheme re-mint dry-run (Rule 7, Session 56).** Re-keys the synthetic `UC-CUR-AUTO*` unified-course ids → `SUBJ Z<band><seq:03d>` (e.g. `BIOL Z9001`). SUBJ4 = canonical of members' modal discipline **+ umbrella exception** (FL/KIN keep splits); band 9/1 from credit_status; seq by title-sort. `compute_plan()` is the shared allocator (apply == spec). 7 validation gates; emits `kb/uc_cur_zscheme_out/<date>/{alias_map.json, zseq_seed.json, collisions.json, supabase_apply.sql, report.md}`. Re-runnable, deterministic. | — |
| `_uc_cur_zscheme_apply.py` | Unified | **UC-CUR → Z-scheme apply (Rule 7, Session 56).** Imports `compute_plan`, asserts the alias == the dry-run receipt, re-keys `kb/coci_curation.json` in place (0 UC-CUR left), writes `kb/uc_cur_zseq.json` (option B persisted counter), restamps the receipt → APPLIED, V-validates. The Supabase half runs via `_rekey_kb_curation_supabase.py`. | — |
| `_rekey_kb_curation_supabase.py` | — | **Reusable Supabase `kb_curation` re-key (Session 56).** Reads a committed `alias_map.json` and PATCHes `course_id` + `merge_into` value via PostgREST with `SUPABASE_SERVICE_KEY`; idempotent (clean bijection), retried, self-verifies 0 old keys remain. Run via `.github/workflows/supabase-rekey.yml` (the only place the service key lives). For EVERY future re-mint's Supabase half (the alias map is too large to hand-pass as SQL). `docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md`. | — |
| `_overmerge_dryrun.py` | Course | **Over-merge re-mint dry-run (Session 18).** Reads the auditor's `member_top_divergence`-flagged M-IDs (1,299) and plans a 1:N **split** into discipline-pure pieces. Pass-1 split brain is title/subject/description-aware (first-match-wins): review-hold → title→discipline keep-whole (`overmerge_title_discipline.json`) → container-by-subject → member-discipline cascade (SUBJ4→subject_map→TOP→description, raw-subject fallback). Collapses members sharing a CourseControlNumber into atomic units (cross-listed = one course). V1–V4 gates; writes `kb/overmerge_out/<date>/{report.md, alias_map.json, review_hold.json, collisions.json}`. Re-runnable. | discipline |
| `_overmerge_apply.py` | Course | **Over-merge re-mint apply (STAGED, dispatch-only).** Consumes `kb/overmerge_out/<date>/alias_map.json`; constructs corroborated + singleton piece records from each piece's members; mutates the 5 `coci_*.json` + curation in place. FRESH-READ + partial-apply abort + V1–V4 (V2 member-conservation, V4 article-cardinality via disjoint-partition) + stamp-based idempotency. Default DRY; `--commit` writes. Sibling `_overmerge_apply_supabase.py` + `.github/workflows/overmerge-apply.yml` (`workflow_dispatch`, concurrency `daily-dashboard`). | — |
| `overmerge_title_discipline.json` | Course | **Curator title→discipline keep-whole map** for the over-merge re-mint (data, not a generator). Seeded from Sam's dry-run review notes (Social Media→Multimedia, Death & Dying→Gerontology, …). A flagged M-ID whose title matches is kept WHOLE at the mapped discipline (single course whose TOP/subject varies by college). Grows as curation continues. | discipline |
| `_build_aligned_exhibits.py` | Course | **Re-runnable, deterministic.** Standalone generator for `unified_courses_aligned.js` (`window.CPL_UC_ALIGNED`) — the **CCR inverse view** (one row per course → the aligned exhibits/credentials that articulate to it; mirror of the EACR). Pivots `coci_articulations.json` by `course_id`; imports `excel_to_dashboard._write_aligned_exhibits_js` so the committed file is byte-identical to the daily regen. No timestamp → no-op daily diff. (Session 29, #259) | — |
| `_build_cpl_by_discipline.py` | Course | **Re-runnable, deterministic.** Standalone generator for `kb/discipline_cpl_rollup.json` — the **CSR rollup** (one row per discipline → how many exhibits/credentials articulate to its courses, across how many colleges). Rolls `coci_articulations.json` up by discipline (discipline sourced from the minted catalogs). Imports `excel_to_dashboard._write_cpl_by_discipline_json`. Sorted keys, no timestamp. (Session 29, #260) | — |
| `_seed_top50.py` | Credential | One-shot generator for the Phase 2 hand-curated credential seed. **Do not re-run** — would overwrite human edits. Kept for provenance. | — |
| `_seed_cx_common_courses.py` | Course | One-shot generator for the Phase 2 Cx seed (AI-assisted draft). **Do not re-run** — would overwrite human edits. Kept for provenance. | — |
| `_seed_coci_unified_courses.py` | Course | One-shot generator for the `coci_unified_courses.json` variant-unification clusters (`UC-XXXXX`). **Output DISSOLVED 2026-05-30** — the token-sorted title key collapsed distinct course levels (e.g. "Algebra 1: Part 2" == "Algebra 2: Part 1"), the clusters were never curator-reviewed, double-emitted their members as Stand-Alone rows, and carried zero articulations. The curator-confirmed **Suggested-merges worklist** supersedes it (itself level-COLLAPSING since Session 57 — but every merge is human-confirmed, the safety the auto-applied clusters lacked). `clusters` dict now empty (archived at `archive/coci_unified_courses_clusters_2026-05-30_pre-dissolution.json`). The `id_system: Cluster` category was then **retired entirely**: curator `merge_into` targets keep their native identity (M-ID/C-ID/CCN) or, when synthetic (`UC-CUR-*`), get the new `id_system: Unified`. **Do not re-run.** | — |
| `_apply_crossdisc_remint.py` | Course | **Cross-disciplinary re-mint apply (Rule 7, Session 36, #315).** Idempotent. Mints/relabels the **cross-listed shell-course** identities — courses sharing ONE Course Outline of Record across many subject codes so students earn credit in their own degree's discipline: `RSCH M1001` "Undergraduate Research Experience" (folds `MATH M1262` + 17 singletons) + `WKEX M1001` "Work Experience Education" (net-new; 2,190 members, 105 disciplines). Sets `cross_disciplinary: true` + `discipline: "Interdisciplinary Studies"`, writes `cross_listed_disciplines` onto the **minted record** (cron-safe — `coci_curation.json` is rebuilt from Supabase), parses the member TOP `"0401.00: Title"` → bare code via `split(":")` for the discipline union, and CANON-guards a self-alias. Alias receipt `kb/crossdisc_out/alias_map.json`. The auditor EXEMPTS `cross_disciplinary` rows (`kb/_row_audit.py` early-return). | discipline |
| `_discover_map_datasets.py` | Pipeline | **One-click MAP-dataset grain + skill-level analyzer (Session 36, #316/#317).** Read-only probe behind `.github/workflows/discover-map-datasets.yml` (`workflow_dispatch`, no secrets, no commit) — the "cron-as-window" mechanism (a Claude session can't reach the MAP hosts; a runner can, and Claude reads the run log). Column-oriented parse (`columnValue`), PII-safe (`<5` mask, no identity cols). Confirmed the Exhibit CRs Catalog grain + the ACE skill-level structure. | — |
| `_probe_new_custom_reports.py` | Pipeline | **Candidate-name sweep for an unknown MAP viewName (Session 170, #1246).** Same cron-as-window mechanism. ⚠️ Its 2026-08-19 run reported "NONE exposed" and was WRONG: `columnName: []` had silently stopped enumerating (it now 500s on known-good views), so the success condition could not fire for ANY view. Now runs a POSITIVE CONTROL first and stamps a warning over its own verdict if that fails, and collects 5xx responses separately — on that run 500 meant *real* and the single 500 was the one real view, printed as ✗. Kept for the next unknown view; off by default. | — |
| `_probe_new_custom_reports_followup.py` | Pipeline | **The control that caught the above (Session 170).** Asks a known-good view the same question in the same run, and repeats the odd-one-out 5xx to tell a fault attached to the NAME from one attached to the moment. Off by default; its questions are answered. | — |
| `_probe_confirmed_custom_reports.py` | Pipeline | **Serve-check for the three CONFIRMED reports (Session 170, #1246/#1247).** A header pasted from the report BUILDER proves the report exists in the builder, not that the API serves it — and only the API makes it self-refreshing on the cron. Confirmed all three (dataCount matching the builder exactly) and reconciles each against what Supabase holds. Profiles a view only after its schema passes a PII denylist, printing what was withheld. | — |
| `_verify_exhibit_cr_eligible.py` | Pipeline | **Synthetic-payload test (Session 36, #318–#320)** for `excel_to_dashboard._rollup_exhibit_cr_catalog` — the egress wall blocks the real catalog, so this guards the rollup LOGIC (Title→unified_title bridge, MAX-per-(exhibit,skill,CR) de-dupe, credit-UNIT sum, MAX-per-exhibit-then-sum student headcount, military-title exclusion). 10 checks. Run `python3 kb/_verify_exhibit_cr_eligible.py`. | — |

## Course identifiers — precedence CCN-ID > C-ID > M-ID

Every common course gets the **best available** identifier, recorded in
`id_system`:

1. **CCN-ID** — an AB 1111 **Common Course Number** (e.g. `ANTH C1000`),
   the statewide, student-facing common-course identity. Format: 4-letter
   subject + `C` + 4-digit number (+ optional `H`/`E`/`L`). The
   purpose-built system for cross-college course identity, so it wins when
   present. Source: `reference/ccn_courses.json`. (Only 58 courses are
   CCN-numbered so far — Phase II rollout.)
2. **C-ID** — a **Course Identification Numbering System** descriptor
   (e.g. `ACCT 110`). The established articulation/transfer descriptor.
   Source: `reference/cid_descriptors.json`.
3. **M-ID** — a synthetic **MAP-originated** descriptor in CCN-shaped
   4-character form: corroborated (≥2 colleges) gets an all-digit
   `SUBJ M####` (band digit + 3-digit sequence, e.g. `AUTO M1001`);
   stand-alone (1 college) gets `SUBJ M####` where the trailing 2 chars
   are letters (band + 1 digit + 2 letters, e.g. `AUTO M10AA`). The
   leading `M` sits where CCN puts `C`, so the key is unmistakably
   ours — never read as an official CCN/C-ID. Minted **only** when no
   CCN or C-ID aligns. Re-mint 2026-05-22 (PR #84); the prior format
   `M-ID SUBJ NNN` is dead — `kb/remint_out/alias_map.json` is the
   authoritative old→new. Full decisions / validation / lessons:
   [`docs/coursecontrolnumber_remint.md`](../docs/coursecontrolnumber_remint.md).

Why M-ID exists: only **~11%** of CCC courses carry a C-ID, and most carry
no CCN either. Without a shared key, an articulation a college earns
(e.g. "AUTO A5 Brakes → ASE A5") cannot propagate to the other colleges
teaching the same course, because `(discipline code + number + title +
units)` never matches across colleges. The identifier — CCN-ID, C-ID, or
M-ID — is the shared key that makes an articulation **systemically
adoptable** from one college to many. When a course later earns a CCN or
C-ID, re-key it from its M-ID and set `id_system` accordingly.

## COCI Lookup tab data (added Session 110)

`kb/_build_coci_lookup.py` builds the **COCI Lookup** tab's static files from
`kb/reference/coci_course_list.xlsx` ⊕ the minted M-ID join
(`coci_minted_memberships.json` + `coci_minted_singletons.json`, keyed by
`control_number`): root `coci_lookup_data.js` (compact row array, ~17 MB,
lazy on first tab open) + 25 `coci_lookup_desc_<A-Z>.js` description shards
(fetched per expanded row). STATIC — rebuild on a fresh COCI extract; NOT
daily-cron artifacts. The tab renderer is root `coci_lookup.js`.

## Governance register (added Session 120, 2026-08-05)

`kb/governance_register.json` backs the team-gated **⚖️ Governance** tab
(root `governance.js`). It holds the parts that are true because a human decided
them — **decision rights** (who decides each data element, and what we do when
it's empty), **acceptance standards** (how far each input is trusted; generalises
the TOP "corroborate, don't gate" doctrine to every other source), **cadences**,
and the **open questions**.

Deliberately absent from the file: anything measurable. Every fact the page could
be *wrong* about — completeness counts, when a cadence last ran — is computed at
render time from the gated MAP contact tables, because a stored fact is one that
can quietly go stale. Rule of thumb when editing: *could this be false without
anyone editing the file?* If yes, it does not belong here. Every `owner` field is
intentionally `null` and renders as a visible gap; filling them is the review, not
a defect. Story: [`docs/governance_lessons.md`](../docs/governance_lessons.md).

## Status

**Phase 2 seed — hand-curated, 50 raw titles** (credential layer) plus
the Cx-seeded course-identity layer (244 common courses). This is the
quality anchor against which the Phase 3 full first-pass classification
(~3,200 distinct raw titles) will be evaluated. Not yet wired into
the daily pipeline; `excel_to_dashboard.py` does not consult these
files. Pipeline integration is Phase 4.

**Curation pass 1 (2026-05-20, `kb/_curation_01.py`)** — human review of
the course-identity layer: cleared all 38 flagged entries (4 fuzzy C-ID
matches confirmed/split, 16 approximate disciplines + 18 single-source
entries resolved), split the Spanish level ladder (SPAN 100/110/200/210),
and introduced the `cross_listing_group` field with two seeded groups
(CAD drafting `XL-0001`, photojournalism `XL-0002`). 246 common courses;
49 carry `reviewed_at`/`reviewed_by`.

**Course descriptions (2026-05-20, `kb/_add_descriptions.py`)** — added
`description`/`description_source` fields. Populated the 22 C-ID entries
with authoritative C-ID descriptor text (now carried in
`reference/cid_descriptors.json`); cross-listed M-ID mirrors inherit their
C-ID sibling's description (23 total). Synthetic M-ID descriptions are
deferred to the Phase 3 classification pass.

**Backlog — crosswalk Phase C is PARKED (2026-05-22):** splitting the
`cid_conflict` rows can't be done at the generator level because the
`(subject, number)` membership key is lossy (same key = different course across
colleges; ~32% of conflict member-pairs map to >1 C-ID). The real fix is a
`CourseControlNumber`-grained re-mint of memberships (its own project — scope
before build). Conflicts stay safely surfaced via the "C-ID conflict" badge;
Phase B clean consolidation is the automatic stopping point. See CLAUDE.md
"Crosswalk re-key initiative" for the full diagnosis.

**Docs-corpus auditor (2026-08-09, `kb/_docs_audit.py`)** — the PROSE
counterpart to `_row_audit.py`, and deliberately the same shape: READ-ONLY by
default, dated JSON + markdown receipts under `kb/docs_audit/`, one narrowly
scoped mutation behind `--apply`. `_row_audit.py` keeps the DATA honest;
nothing kept the docs honest, and the docs corpus is the larger of the two.
Wired as **step 0 of `/checkpoint`** so its findings shape what the checkpoint
writes rather than arriving after.

Seven rules: `superseded_handoff` (FIXABLE — stamps `superseded: true` on every
`session_<N>_handoff.md` below the highest, so search can filter them),
`oversized_doc` (per-LANE budgets — an always-loaded file, a KB note and a
lessons doc have different economics), `kb_note_frontmatter`,
`kb_note_dialect` (informational, not a defect — the corpus states a note's
type three ways and its date two), `frontmatter_log_chain` (a frontmatter field
being used as a changelog), `unindexed_kb_note`, and `vault_heavy_path` (emits a
paste-able Obsidian `userIgnoreFilters` block from what is actually on disk).

Zero third-party dependencies — no PyYAML anywhere in `kb/*.py`, so the
frontmatter reader is a minimal hand-roll. Receipts are date-only (no wall-clock
stamp) and the scan excludes its own output directory, so two runs on the same
day are byte-identical and never dirty the tree. Guarded by
`tests/docs_audit_test.py` (56 checks). Run: `python3 kb/_docs_audit.py`.

**Row Trust-Card auditor (2026-05-23, `kb/_row_audit.py`)** — read-only
auditor over every M-ID + Cluster, producing per-row Trust Cards with two
scores: `faculty_trust_score` (today's cross-college articulation adoption
bar) and `mc_ready_score` (the ASCCC Model Curriculum submission destination
— see CLAUDE.md §11 for the lifecycle + MC-vs-TMC framing). Outputs
`kb/row_audit/latest.json` (~2 MB, committed) + `<date>.md` (human report,
~7 KB, committed) + `<date>.full.json` (~12 MB, gitignored). Re-runnable,
never mutates; suggested-fix payloads on aggregable Cluster fields are
shaped for `_apply_curation.py` to consume in Phase 1b. Run from repo root:
`python3 kb/_row_audit.py`.

**Active rule set (Phase 1a + 1c, 13 rules):** `seed_untouched_discipline`,
`blank_discipline`, `blank_description`, `subject_spread_high_low_confidence`,
`mid_id_off_scheme`, `discipline_title_mismatch`,
`generic_title_concrete_discipline`, `top_discipline_disagreement` (with
SISTER_PAIRS suppression for synonymous-discipline pairs),
`description_discipline_disagreement`, **`subject_collision_signal`** (Phase 1e
diagnostic — fires when an M-ID's SUBJ4 ≠ the modal SUBJ4 for its discipline;
7,203 flags pre-re-mint, target 0 post-re-mint), `unit_anomaly`, `merge_into_orphan`,
**`member_top_divergence`** (Session 18 — the cross-discipline over-merge detector;
M-ID members span ≥2 two-digit TOP divisions with ≥30% minority share; 1,299 flags,
736 invisible to prior rules; drives the over-merge re-mint),
**`subject_discipline_outlier`** (Session 113 — the mis-mint detector; a row's
assigned discipline is a small minority of its LOCAL subject-code cohort AND the
TOP code OR curated lexicon corroborates the SAME correction (two-signals-agree);
**covers singletons** the corroboration-gated rules skip; ~302 flags, each with a
`suggested_fix`; penalty 0.20), `cluster_blanks_when_aggregatable`,
`cluster_id_off_scheme`, `uc_cur_ripe_for_promotion`. The score incorporates
per-tag penalties (`TAG_PENALTY_ON_DISCIPLINE`) on discipline-related tags so
multi-signal misassignments score lower than single-signal ones.

**Important:** we say **MC** (Model Curriculum), not **TMC** (Transfer Model
Curriculum) — M-IDs do NOT claim transferability, which keeps the bar lower
and avoids the UC-defaults trap; see CLAUDE.md §11 for why this matters.

**Surfaces in the UCL:** per-row "⚠ N · 0.XX" chip in the Flags column (tag
count + faculty_trust_score), color-graded by severity (red <0.40 / amber
0.40-0.65 / gray ≥0.65). Toolbar `Triage:` dropdown with 8 modes carves the
cleanup queue, plus a live "⚠ N rows flagged (audit YYYY-MM-DD)" status
indicator. Hover the chip for the tag-derived score breakdown. The daily
GitHub Actions cron re-runs the auditor and commits the refreshed
`kb/row_audit/latest.json` so the UCL stays current.

**Full decisions / calibration / lessons-learned**:
[`docs/unified_courses_audit_lessons.md`](../docs/unified_courses_audit_lessons.md).

**Credential-layer auditor (2026-05-24, `kb/_audit_exhibits.py`)** — sister
read-only auditor over `kb/unified_titles.json` + `kb/credentials.json` (the
credential-identity layer). Walks every raw_title + credential record,
fires confidence-band tags + drift signals (`unclassified_in_map`,
`stale_kb_entry`) + an `agency_name_collision_signal` rule (issuer names
whose token sets are proper subsets of another). Outputs to
`kb/exhibit_audit/{latest.json, <date>.md, <date>.full.json}` (full
breakdown gitignored, same pattern). Baseline run 2026-05-24: 3,217 raw →
1,969 unified (61.2% compression), 0 titles reviewed, 194 unclassified-in-MAP
backlog, 211 agency-collision candidates, 200 `suspect_course_as_exhibit`.
Full decisions / lessons:
[`docs/exhibit_canonicalization_lessons.md`](../docs/exhibit_canonicalization_lessons.md).

**SUBJ4-canonicalization re-mint (Phase 1e, COMPLETE 2026-05-23)** — first
re-mint under the revised Rule 7 staging-phase framing. Folded same-discipline
SUBJ4 variants (the 2026-05-22 re-mint synthesized SUBJ4 from each M-ID's
modal local college subject code; the same discipline could therefore spread
across many SUBJ4 codes — canonical example: 92 "Sign Language, American"
M-IDs across 10 variants → 1 canonical). Sessions 5a (PR #89), 5b (PR #90),
5c (PR #93 + #94 + #95; apply commit `5406055`) all shipped. Cleanup-receipt
invariant: `subject_collision_signal` auditor rule fires **0 times** post-apply
(down from 7,203 pre-apply). 14,971 minted + 50,182 singleton M-IDs re-keyed;
all downstream references (memberships, articulations, clusters, curation
overlay, live Supabase) updated in lockstep. Full decisions / bugs caught /
lessons: [`docs/subj4_canonicalization_remint_lessons.md`](../docs/subj4_canonicalization_remint_lessons.md).

## Statewide exhibit program-area categories (2026-06-11)

`statewide_exhibit_categories.json` maps each statewide (CCC Collaborative)
exhibit title to the program-area categories on
<https://map.rccd.edu/statewidecpl/> (12 areas + an `Other Statewide` review
bucket + the in-progress HVAC workgroup line). Consumed daily by
`excel_to_dashboard.py` (`_load_statewide_categories()`) for the Statewide
Exhibits KPI card's per-area rollup; **the JSON is the editable source of
truth** — reassign a title by editing it, no code change. Seeded by
`_seed_statewide_categories.py` (merge-preserving: re-runs keep existing
assignments and only classify new titles; the ordered `^`-anchorable keyword
patterns double as the generator's runtime fallback for future titles).
Review queue = the `Other Statewide` titles (currently "California State Bar
Membership" + "HRCM 001").

## Schemas

### `unified_titles.json`

Top-level object keyed by exact `raw_title` (whitespace and tabs
preserved — they're how MAP serves the data). Per entry:

```json
{
  "<raw_title>": {
    "unified_title": "<canonical name>",
    "confidence_title": 0.97,
    "classified_at": "YYYY-MM-DD",
    "classified_by": "<source — model id, 'hand-curated seed', reviewer name, …>",
    "reviewed_at": null,
    "reviewed_by": null,
    "source_exhibit_ids": ["MAPSAS-…"],
    "quality_flag": null,
    "_notes": "Optional. Mandatory when confidence_title < 0.85."
  }
}
```

- `quality_flag` is a triage signal (`null` normally). Currently the only
  value is `"suspect_course_as_exhibit"` — set by `_flag_hinky_exhibits.py`
  on the ~200 exhibits typed "Industry Certification" that resolved to **no
  identifiable issuing agency** (the title is a course, not a credential; a
  data-entry pattern concentrated at a few colleges, ~half Modesto Junior
  College). It's a heuristic for later cleanup, not a verdict — a few may be
  genuine certs we couldn't pin down.

### `credentials.json`

Top-level object keyed by `unified_title`. Each value is a **list**
of issuer records (composite key: `(unified_title, issuing_agency)`).
Most unified titles have exactly one issuer record; credentials like
Fire Inspector I — issued by ICC, NFPA, SFT, and Cal-JAC — get one
record per issuer.

```json
{
  "<unified_title>": [
    {
      "issuing_agency": "<canonical name>" | null,
      "training_agency": "<canonical name>" | null | "varies by academy",
      "confidence_issuer": 0.95,
      "confidence_trainer": 1.0,
      "classified_at": "YYYY-MM-DD",
      "classified_by": "<source>",
      "reviewed_at": null,
      "reviewed_by": null,
      "_notes": "Optional. Mandatory when either confidence < 0.85."
    }
  ]
}
```

**Lookup semantics for the pipeline:**

1. Resolve a raw title → unified title via
   `unified_titles.json[raw_title].unified_title`.
2. Pull all issuer records via `credentials.json[unified_title]`.
3. If multiple issuer records exist, pick by row context
   (Articulation College, course code, etc.) — fall back to the
   highest `confidence_issuer` when there's no signal.
4. EACR grouping key once issuer-level grouping ships:
   `(unified_title, issuing_agency, CPL Type, Collaborative Type)`.

### `common_courses.json`

Top-level object keyed by `course_id` (a CCN-ID, C-ID, or M-ID — see
precedence above). Each value describes one common course:

```json
{
  "ACCT 110": {
    "common_title": "Financial Accounting",
    "description": "This is the study of accounting as an information system …",
    "description_source": "C-ID",
    "id_system": "C-ID",
    "ccn_id": null,
    "c_id": "ACCT 110",
    "cross_listing_group": null,
    "subject": "ACCT",
    "discipline": "Business",
    "discipline_provisional": "Accounting",
    "typical_units": 5.0,
    "confidence": 0.95,
    "source_college_count": 2,
    "classified_at": "YYYY-MM-DD",
    "classified_by": "<source>",
    "reviewed_at": null,
    "reviewed_by": null,
    "_notes": "MQ discipline approximate: 'Accounting' has no exact MQ match; mapped to 'Business' — verify."
  },
  "AUTO M1001": {
    "common_title": "Engine Repair",
    "id_system": "M-ID",
    "ccn_id": null,
    "c_id": null,
    "subject": "AUTO",
    "discipline": "Automotive Technology",
    "discipline_provisional": "Automotive Technology",
    "typical_units": 4.0,
    "confidence": 0.88,
    "source_college_count": 2,
    "...": "..."
  }
}
```

- `description` is the consolidated course description; `description_source`
  is its provenance (`"C-ID"`, `"C-ID (cross-listed <id>)"`, or `null`).
  Populated from the official C-ID descriptor text; cross-listed M-ID
  mirrors inherit their C-ID sibling's description. CCN and synthetic M-ID
  descriptions are `null` for now — M-ID synthesis is deferred to Phase 3.
- `id_system` ∈ `{"CCN-ID", "C-ID", "M-ID"}`; `ccn_id` / `c_id` hold the
  official descriptor when matched, else `null`. For an `M-ID` entry both
  are `null` and the key carries the synthetic descriptor.
- `cross_listing_group` links **cross-listed** courses — the same course
  offered under two department subjects (e.g. a CAD course listed as both
  `ARCH 50` and `DR 50`). Each discipline mirror keeps its own
  `course_id`/discipline but shares a group id (`"XL-NNNN"`), so an
  articulation to one applies to all. `null` when not cross-listed. See
  "Cross-listed courses" below.
- `discipline` is the official **MQ Disciplines List** title
  (`reference/mq_disciplines.json`); `discipline_provisional` keeps the
  pre-MQ label for traceability. When no exact MQ discipline exists, the
  nearest is used and `_notes` flags it (`mq_approx`).
- `subject` is the C-ID-style subject prefix (e.g. `SPAN`, `ECE`, `AUTO`).
- `source_college_count` ≥ 2 means the course was corroborated across
  colleges — the high-value crosswalk matches.
- M-ID numbers are stable synthetic identifiers; they are **not**
  semantically meaningful beyond grouping (no implied level/sequence).
  Don't renumber existing M-IDs — local courses point at them. When a
  course later earns a CCN or C-ID, re-key it and set `id_system`.

### `course_crosswalk.json`

Top-level object keyed by `"<college> :: <course_code> :: <local_title>"`.
Each value points one local college course at a `course_id`:

```json
{
  "San Diego City College :: CHIL 291A :: Child Development Center Practicum": {
    "college": "San Diego City College",
    "local_course_code": "CHIL 291A",
    "local_course_title": "Child Development Center Practicum",
    "units": 1.0,
    "top_code": "106",
    "course_id": "ECE M1001",
    "id_system": "M-ID",
    "source": "Cx exhibit",
    "source_exhibit_titles": ["Credit By Exam San Diego City College"],
    "source_exhibit_ids": ["MAPCBES-CBES-1-001"],
    "classified_at": "YYYY-MM-DD",
    "classified_by": "<source>",
    "reviewed_at": null,
    "reviewed_by": null
  }
}
```

The crosswalk is the many-to-one mapping; the catalog
(`common_courses.json`) holds the one-per-`course_id` canonical details,
so discipline/title metadata is never duplicated across the many local
courses that share an identifier. (Same split rationale as
`unified_titles.json` vs `credentials.json`.)

**Lookup semantics for the pipeline:** resolve a local course →
`course_crosswalk.json[key].course_id`, then read
`common_courses.json[course_id]` for the canonical title / discipline /
`id_system`. Group cross-college articulations by `course_id`.

### Cross-listed courses

Some courses are offered under two department subjects at the same college
(common in Drafting/Architecture, Electricity/Electronics, Journalism/
Photography). MAP records both local codes (e.g. `ARCH 50` *and* `DR 50`
for one CAD course). Rather than collapse them, each discipline keeps its
own `course_id` and the entries share a `cross_listing_group` id
(`"XL-NNNN"`):

- Each local code routes to its discipline's mirror in
  `course_crosswalk.json` (e.g. `ARCH 50 → ARCH M1004`,
  `DR 50 → DRFT M1008`).
- Both catalog entries carry the same `cross_listing_group`, so the
  pipeline can union them — an articulation earned on one mirror applies
  to the whole group.
- A mirror can be a C-ID/CCN on one side and an M-ID on the other (e.g.
  Introduction to Photojournalism: `JOUR 160` (C-ID, Journalism) ↔
  `PHOT M1006` (Photography), group `XL-0002`).

Curation pass 1 seeded two groups (`XL-0001` CAD drafting, `XL-0002`
photojournalism). Phase 3 should auto-detect candidates: same college +
same normalized title + same units under different subject prefixes.

### Relationship to the Cx generic-bucket entries

The three generic Cx buckets in `unified_titles.json`
(`Generic Credit by Exam — <College>`) describe the *exhibit* as a
whole. The course-identity layer operates one level *below*, on the
individual courses inside those buckets. The two coexist today; the
forward direction (design doc §10) is for the EACR table to explode a Cx
bucket into its constituent common courses rather than showing a single
opaque "Generic Credit by Exam" card.

### Canonical sentinel values

| Value | Meaning |
|---|---|
| `training_agency = "varies by academy"` | Pipeline badges the card with a "Multiple training providers" indicator (e.g. POST Basic Academy). Lowercase, no brackets — see SKILL.md Rule 7. |
| `issuing_agency = null` | Locally-issued / not a credential / generic bucket. `_notes` should explain. |

## Confidence rubric (per SKILL.md Rule 8)

| Score | Meaning |
|---|---|
| 0.95 – 1.00 | Title clearly matches a well-known credential. |
| 0.80 – 0.94 | Matches a known credential with some noise to interpret. |
| 0.60 – 0.79 | Educated guess; multiple plausible canonical names. |
| 0.40 – 0.59 | Generic bucket or weak signal. |
| < 0.40 | Uninterpretable; needs external context. |

Confidence is **per-field**. A title can be 0.98 confident while its
training agency is 0.60 confident — keep them separate.

## Curation workflow

1. **Edit the JSON directly** in this directory — these are the
   source of truth.
2. When marking an entry as human-reviewed, set `reviewed_at` to the
   date (YYYY-MM-DD) and `reviewed_by` to the reviewer's GitHub
   handle.
3. For low-confidence entries, write the reasoning into `_notes` so
   the next reviewer (human or model) can pick up where you left off.
4. After bulk re-classification by the LLM, hand-reviewed entries
   are recognizable by `reviewed_at != null`; future re-runs should
   **never** overwrite them. (Phase 3 will encode this guard in the
   classification driver.)
5. Keep diffs small — sort top-level keys when adding entries
   programmatically so review is easy.

## What this directory does **not** hold

- TOP code → Career Cluster mapping. Lives in
  `TOP_Code_Lookup.xlsx`.
- Per-college metadata (tier, contacts, …). Lives in the Excel
  workbook and live metrics.
- Anything from the daily KPI snapshot. Lives in
  `kpi_history.json`.

## Auto-merge pass 1 (Session 53, 2026-06-12)

`kb/_auto_merge_worklist.py` — DRY-RUN planner for bulk-applying the
dependable suggested-merge lanes (anchored same-title + cross-college
singleton mints; band-purity/same-college/dismissal/contested gates; titles
regularized deterministically via `_normalize_common_titles.normalize` + the
Honors rule; write shape mirrors the CCR Confirm button, never a discipline
row). Receipts + the applied plan + audit trail: `kb/automerge_out/<date>/`
(plan.json `_status` restamped APPLIED; apply_log.json). Cohort marker
`reviewer_email='automerge-v1@bot'` — the second-look / bulk-revert handle.
Pattern doc: `docs/kb-notes/playbook-gated-bulk-autocuration.md`.

`kb/coci_title_corrections.json` — the COCI source-correction queue: raw
college course titles carrying encoding artifacts (mojibake), repaired for
display by `excel_to_dashboard.py _fix_text_encoding()` (member rows flag
`e:1` → the CCR "⚠ fix in COCI" chip). Regenerated each daily run;
deterministic; rows leave as colleges fix their source records.

## CCR Convergence — the Merge/Mint Doctrine layer (2026-07-03)

The doctrine-driven campaign to converge the suggested-merge worklist into a
≤2,500-course CPL-facing crosswalk (strategy of record:
`docs/ccr_convergence_strategy.md`). Files in this directory:

- `merge_doctrine.md` — the written merge/mint decision policy (ESTABLISHED /
  PROPOSED / OPEN rules, ids D-* / P-* / Q-*). Versioned; batch passes cite
  rule ids in receipts. THE mind-meld artifact — edited at checkpoints from
  Sam's captured reasoning.
- `doctrine_questions.json` — the contextual question bank the CCR worklist's
  🧠 Mind-meld panel surfaces per group (triggers → Q-* ids). Keep triggers in
  sync with `doctrineFeatures()` in `unified_courses.js` AND `features()` in
  the sampler below.
- `supabase_merge_doctrine.sql` — schema of record for `merge_doctrine_notes`
  (voice/text reasoning notes; reviewer-gated writes, no delete; applied live
  2026-07-03).
- `supabase_budget_structure.sql` — **receipt of record for the Budget-tab
  rework** (SkyReconcile, 2026-07-30; migration `budget_funding_structure` +
  the seed, applied live the same day). Turns `budget_funding` from a flat
  funding-source list into the whole CPL ledger: `description` · `archived`
  (the 2025-26 cutoff) · `parent_id` (collapsible detail) · `section`
  (`source_one_time|source_ongoing|use_35m|use_15m|use_ongoing|pool|history`) ·
  `sort_order` · `window_label`. 45 rows; nothing deleted (the two existing
  $6M rows are the natural parents of the seven $6M allocations). Idempotent —
  every INSERT is guarded on a natural key. Carries the post-apply verification
  block, and the two rules any consumer must honour: **totals sum PARENT rows
  only** (children are detail, never addends) and **archived rows are excluded
  from every total**. See `docs/kb-notes/methodology-parent-child-ledger-totals.md`.
- `_doctrine_calibration_sample.py` — re-runnable, read-only stratified
  sampler over `unified_courses_suggestions.js` (13 doctrine-trigger strata,
  seeded). Outputs to `doctrine_out/<date>/`.
- `doctrine_out/<date>/` — calibration receipts: `calibration_sample.json`,
  `calibration_decisions.json` (AI pre-decisions: call / survivor /
  exclusions / rationale / doctrine_cited / confidence / open_question — the
  same schema the future batch pass 2 plans in), `calibration_review.md`
  (the human review doc Sam reacts to).

## SkyView universe payloads (2026-08-24, Session 189)

The prototype graph view (`prototype/ccr_atlas_v1.html`) is fed by two generated payloads. They
are separate on purpose: the layout is what every reader needs, the members are what only the
drag needs, and keeping the 2.5 MB visible stops it becoming a silent doubling of a file nobody
re-measures.

| File | What |
|---|---|
| `kb/_build_ccr_universe.py` | READ-ONLY. Emits **both** payloads from `unified_courses_data.js` + `unified_courses_members.js`. |
| `prototype/ccr_universe.json` | Precomputed island layout — 16,484 identities in 158 discipline islands, ~1.7 MB. Coordinates only; the browser draws, it does not solve a layout. |
| `prototype/ccr_universe_members.json` | The **draggable** member college courses — 101,063 over 16,240 identities, ~2.5 MB. Record is `[control_number, course code, college index]`. |
| `tests/ccr_universe_members_test.py` | Payload invariants; wired into `js-tests.yml`. |
| `prototype/check_ccr_atlas.js` | Chromium behavior harness (on demand, **not** `npm test`) — a drag needs a layout engine. |

⚠️ **No title is carried on a member record.** Measured: 9.9 MB as full dicts · 5.5 MB with the
title · **2.5 MB without**, and the drag list renders code + college. Adding one back buys
3.1 MB to show nothing.

⚠️ **A member with no usable control number is DROPPED and counted** (2 today). The write key is
`CN:<control_number>`; coercing a blank to zero would ship a course that writes against
`CCC000000000`.

⚠️ **1,122 control numbers sit under more than one identity** — the forward join surfaces an
over-merged course on every card claiming it. The write is one row per control number, so a
re-home is a **global** statement and the course must leave every card it was showing on.

Merge chains need no handling here: `unified_courses_members.js` is built after
`flatten_merge_chains()` and honors `CN:`, so a merged-away identity's members already sit on
its survivor.

## ESL packaging + fold spot-check (2026-08-24, Sessions 187–188)

The first **packaging** pass — deciding what the catalog should *contain*, then mapping into
it, rather than merging what already exists. ESL went **2,300 identities → 27**.

| File | What |
|---|---|
| `kb/_esl_package_dryrun.py` | Classifies the ESL identity space by level/carve-out from the TITLE. Emits `kb/esl_package_out/2026-07-15/esl_package_plan.json`. |
| `kb/_esl_package_actionable.py` | Subtracts rows curation already spoke for; what an apply would really write. |
| `kb/_esl_package_apply.py` | The gated apply. Receipt: `kb/esl_package_out/2026-08-24/esl_apply_plan.json` (restamped DRY-RUN → APPLIED), cohort `package-esl-s187@bot`. |
| `kb/_build_esl_fold_spotcheck.py` | **READ-ONLY.** Re-checks every landed fold against the member courses' `CatalogDescription`, and CALIBRATES each fold signal by how often it disagrees. Writes `kb/esl_fold_spotcheck/<date>/{worklist.json,report.md}`. `--scope all\|default-beginning`. |
| `tests/esl_fold_spotcheck_test.py` | 40 checks, wired into `js-tests.yml` (non-required). |

**Seven survivors** — Beginning `ESOL M9168` · Intermediate `ESOL M9256` · Advanced
`ESOL M1141` · Vocational `ESOL M9023` · Civic `ESOL M9177` · Enrichment `ESOL M1152` ·
Vocational—Healthcare `ESOL M91IL`. **Survivors, not new ids**: `merge_into_orphan` self-trusts
only `UC-CUR-*` and Session 56 re-minted all of those away, so a Z-scheme target would flag as
an orphan forever.

⭐ **The spot-check's finding governs the next discipline too.** The classifier read only the
modal TITLE; the COCI export describes 96% of member courses in prose. Wrong rates over rows a
description can CHECK: `default-beginning/medium` **76.7%** · `numeric/medium` **49.2%** ·
`combo/high` 12.5% · `word/high` **6.2%**. **Calibrate before ranking a queue** —
[`calibrate-a-signal-before-you-rank-the-queue`](../docs/kb-notes/methodology-calibrate-a-signal-before-you-rank-the-queue.md).

⚠️ **The denominator is rows the source can DECIDE.** 1,217 folds assert nothing either way and
are excluded, never counted as agreement.
⚠️ **A local course NUMBER is not a level ordinal** — a calibrated ladder was built and
rejected; colleges run parallel numbering schemes (credit 300s / noncredit 700s), so
nearest-anchor would have proposed 325 re-levels on an ordinal that does not exist.
⚠️ **A purpose bucket is not a level bucket** — Enrichment/Civic/Vocational are carve-outs by
purpose; re-pointing one at a level survivor strips the carve-out.

**Open:** 222 re-level proposals staged, **nothing written to Supabase**; the 9 over-claims and
the fate of the numeric pinning are Sam's calls. 67 Z-scheme `ESOL Z####` rows were never in
the fold's candidate set.

## Noncredit & Learning Partners register (2026-08-05, SkyPartner)

Two files here back the **🤝 Noncredit & Learning Partners** tab:

| File | What |
|---|---|
| `nc_learning_partners.json` | The curated **register** — 6 modes, 12 use cases, 9 opportunities, 10 questions. The *structured, actionable* half of `docs/noncredit_cpl_thinking.md`; the prose reasoning stays in the doc so the two can't drift. Derived college lists carry a `_derived_at` stamp + the query that produced them. |
| `supabase_sierra_feedback_ci_status.sql` | **Applied 2026-08-09** to `hvuwhnbuahrtptokpqfh`. Keeps the CI smoke test's rows out of the human feedback queue by fixing it at the WRITE path, not at display time: widens the `status` CHECK to allow `'ci'` and has `sierra_feedback_upsert` stamp it when `page='smoke'` (43 rows backfilled). `ON CONFLICT` still never touches `status`, so a human's triage survives a visitor re-rating. The predicate was measured before it was encoded — `page='smoke'` ⟺ `session_id LIKE 'smoke%'` on 43/43 rows, and no real row carries either marker. Header states the residual risk: `page` is caller-supplied, so it is a LABEL, never an authorisation. |
| `map_team_tracked.json` | The 📥 MAP Team Queue's **hand-tracked lane** — the only items on that tab not measured live, kept deliberately small and rendered WITH their staleness (`last_confirmed`) so an unconfirmed item looks unreliable rather than authoritative. **Add here only after confirming no live source could answer it; delete the item the day it becomes measurable.** The list should shrink over time — if it grows, the discipline has inverted. |
| `supabase_alignment_routes.sql` | **Applied 2026-08-13** to `hvuwhnbuahrtptokpqfh` (Session 148). Receipt of record for route **ALIGN** — `credential_alignment_for_college(credential, college, per_rec)` returns BOTH signals in one round trip, discriminated by `row_kind`: `peer` (FACT — a named college really articulated that course against that rec, from `chatbox_peer_articulations`) and `candidate` (PROPOSAL — the college's own courses ranked by title match, from `chatbox_college_courses`). **Neither is sufficient alone**: Santa Ana articulated `WELD 240 Structural Welding SMAW` against an **FCAW** rec, so title similarity is structurally blind to the broader-course pattern. ⚠️ **The content-token gate was earned by a failing result** — plain overlap ranked `ART 100 Introduction To World Art` third for the FCAW rec on "introduction"+"to"; `cx_align_tokens()` drops structural words and the scorer requires ≥1 content token. `advanced`/`beginning`/`basic` deliberately NOT stopped (they separate the Intro rec from the Advanced one). ⚠️ Candidates come from the college's WHOLE catalogue — scoping by TOP would gate on TOP (Rule 7). Builders: `_build_peer_articulations.py`, `_build_college_courses.py`; syncs ride `credential-catalog-sync.yml`. |
| `supabase_credential_recs_routes.sql` | **Applied 2026-08-13** to `hvuwhnbuahrtptokpqfh` (Session 148). The CONSUMER half of `chatbox_credential_recs`: `credential_recs_for_titles(titles)` batches the full credit-recommendation set for titles a route has ALREADY matched — deliberately not a second search function, because a second matcher over the same vocabulary would drift from the first and attach recommendations to a credential Sierra never named. Also widens `search_statewide_recommendations`' gate from `ccc_rec is not null` to `ccc_rec OR a published statewide rec set`: **`ccc_rec` is derived from ADOPTIONS, so the clause silently meant "has any college already adopted this?" and excluded 38 never-adopted statewide credentials, 36 of them carrying 75 published rec lines.** And splits `college_adoption_opportunities` into two labelled bands (`peer_leverage` / `ready_to_adopt`) with reserved slots rather than one popularity-sorted list — merging them would let Sierra claim "N peers already articulate it" about a zero-adopter credential. |
| `supabase_nc_partner_notes.sql` | Schema of record for the **write layer** (`public.nc_partner_notes`), **applied 2026-08-05** to `hvuwhnbuahrtptokpqfh`. Keyed by item ID so one ✎ affordance covers every section. Enforces two rulings structurally: a revision **supersedes** (there is **no DELETE policy** — answering never closes), and notes sit **alongside** the register, reaching it only via an explicit promotion packet. |

⚠ The **dormant-statewide-exhibit worklist is NOT stored here** — it is computed live
from `credential_reference_data.js` at render time, so it can't go stale the way a
hand-copied list would. See
[`docs/kb-notes/methodology-dormant-asset-worklist.md`](../docs/kb-notes/methodology-dormant-asset-worklist.md).

## Futuro Health HTH → CCC CNA crosswalk (2026-08-12, Session 144)

Ashley's second partner deliverable, and deliberately **NOT** the partner engine
above. That engine reconciles a partner's **occupation vocabulary** against MAP's
**credential vocabulary** (many-to-many, judgment-heavy). This asks **one known
course × one known program type** across every college — no vocabulary to
reconcile — so it gets its own simple generator. *Match the instrument to the
question's shape, not to the word "crosswalk".*

| File | What |
|---|---|
| `_build_futuro_hth_crosswalk.py` | The matcher. Universe = colleges teaching a CNA course (MIS `cb_course_basic_fall2025.csv`, TOP 1230.30); award level from the COCI program export; receiving-course candidates gated on **two signals** (HTH-module title lens AND a related TOP family) then ranked by `fit_of()`. Emits `futuro_hth_out/crosswalk.json`. **The join asserts BOTH sides through `norm()` and exits on any miss.** |
| `_write_futuro_hth_workbook.py` | The 5-sheet workbook (Read me · College crosswalk · Receiving course detail · HTH course profile · Statewide summary). Consumes `crosswalk.json`. The `.xlsx` is **gitignored as regenerable**, matching the partner-crosswalk precedent. |
| `futuro_hth_map_reference.json` | MAP snapshot for the 61 colleges — exhibits, credit recs, contacts, landing pages, region/county — synced from Supabase 2026-08-12. Also records that **Futuro Health is MAP entity 133 with a live landing page and ZERO exhibits**. |

⚠ **`fit_of()` exists because tier alone ranks badly.** The health TOP family
covers *every* allied-health occupation, so *Funeral Service Law and Ethics* and
*RDA Law and Ethics* out-ranked the canonical *Interpersonal Communication*. Those
teach another occupation's scope of practice; they are scored down, as are
placements (internship/practicum).

⚠ **The MIS course file ABBREVIATES titles** — `INTERCULTURAL COMM`,
`Interpersonal Commun`, `BIO-ETHICS`. Matching full words produced **six false
"none found"** rows. Titles pass through `tidy_title()` and the patterns match the
`comm` stem — **in the fit regexes as well as the module patterns**, since fixing
only the latter reproduces the identical symptom. See
`docs/kb-notes/methodology-a-source-file-that-abbreviates-titles-fakes-an-absence.md`.

⚠ **Course-level MIS finds 61 colleges; program-level COCI finds 32.** Many
colleges run CNA as a noncredit course with no award record. For "which colleges
offer X", start at the course file and use COCI only for the award level —
`docs/kb-notes/reference-course-level-mis-beats-program-level-coci.md`.

## Partner occupation → CPL crosswalk (2026-08-05, SkyWalker)

## Sierra's credit-recommendation layer (added 2026-08-13, Session 147)

Sierra could say *that* a credential is articulated and by whom, but not **what
credit it earns**: `chatbox_credentials.ccc_rec` is a SINGLE string, so asked what
Cerritos might adopt for POST she named one course where there are ten. The other
nine were never missing — they sit in `statewide_data.js` and are already rendered
on the public CPL Fact Sheet — they had just never reached Supabase, the only place
Sierra reads.

| File | What |
|---|---|
| `_build_credential_recs.py` | Builds one recommendation SET per credential into `kb/credential_recs.json` (gitignored, ~1.2MB, rebuilt each run). **Sam's rule, 2026-08-13:** a statewide exhibit exists → emit its `authoritative_recs` and **largely ignore the local versions**; no statewide → the **most common** local `credit_recs` with the DISTINCT-college count behind each, capped at 8. Never both. Delegates the statewide half to `fact-sheet/_build_statewide_recs.py` — **imported, not reimplemented**, because Sierra quoting different credit from the published Fact Sheet is a credibility failure and two copies of the parsing rules would drift into exactly that. Emits BOTH C-ID counts (`n_cid_recs` distinct, `n_cid_lines`) plus `cid_repeats`, because POST carries `AJ 110` on two lines and whether that is an error or a C-ID legitimately backing an elective is a curator's call. |
| `_sync_map_custom_reports.py` | **The nightly MAP Custom Report load (runner-only).** Reads `CustomReport_latest.json`, fills `stg_map_college_cr_unit` (211,005) + `stg_map_student_credit` (591,820), then calls the gated `map_promote_custom_reports()` RPC which swaps both into live **in one transaction** and rebuilds `map_college_goal2`, `map_college_credit_summary`, `map_cleanup_worklist` and `map_transcribed_gap` alongside them. Runs on `map-custom-report-load.yml` (13:40 UTC daily; `dry-run` / `staging-only` / `apply` modes). ⚠️ **Minimisation happens twice** — the payload decides what we ASK, this decides what we KEEP: 12 student attributes with no consumer are dropped and *listed* in `HELD_COLUMNS`, and `StudentMAPID` derives a dense surrogate and is discarded. ⚠️ **Blank handling is PER TABLE** (`CR_UNIT_ZERO_FILL` / `STUDENT_ZERO_FILL`) because the two live tables disagree, and text `''` is stored verbatim — a load must reproduce its source, not improve it. Guarded by `tests/map_custom_report_sync_test.py`; schema of record `kb/supabase_map_promote_custom_reports.sql`, runbook `docs/map_custom_report_load.md`. | — |
| `_sync_credential_recs.py` | Publishes the built rows to Supabase `chatbox_credential_recs` (public-read, no write policy). Runs on `credential-catalog-sync.yml` straight after the catalog step — the two tables join on `unified_title` and must not drift apart in time. `normalize_keys()` expands every row to the union of keys before sending: PostgREST rejects a bulk payload whose objects differ in shape (`PGRST102`), and that fails POSITIONALLY, so one odd row in 2,205 left the table two-thirds loaded and looking populated. Refuses to publish if the statewide sets ever come back empty. |

Current: **2,205 rows — 134 statewide (351 lines) · 2,071 local (3,357)**.

Three files back the reusable **"which of the occupations we train for can our
students already get college credit for, and where?"** instrument:

| File | What |
|---|---|
| `_build_partner_crosswalk.py` | The engine. Reads any partner list (`.xlsx/.csv/.tsv/.txt`), joins the adoption view + the Common Exhibit Reference, emits a distributable workbook + `summary.json` + `unmapped.json`. `--region-preset` adds the Partner Region + Regional Capacity sheets. The **Flat Extract** sheet (added 2026-08-06) is the joinable one — occupation × credit recommendation × college × course, plus MAP exhibit IDs attributed to the exhibit GROUP each college adopted (`statewide_data.js` groups by `unified_title × cpl_type`, each group carrying its own adopter list). |
| `occupation_credential_map.json` | The **shared, growable rulings** — occupation→credential is subject-matter JUDGMENT, so it accumulates here across engagements instead of being recomputed. Keyed by a normalized occupation string so `Plumber`/`PLUMBER` share one ruling. Seeded from the SJCOE list: 139 occupations, 406 credential rulings, 35 curated "no CPL exists" findings. |
| `partner_crosswalk_regions.json` | Named college regions for `--region-preset`. College names must match MAP adopter names EXACTLY — a typo yields an empty region silently, which `tests/partner_crosswalk_test.py` guards. |

⚠ **Statewide comes from the ADOPTION file.** `statewide_data.js`
(`collaborative_type == "CCC Collaborative"`) carries **138** statewide titles;
`credential_reference_data.js` (`statewide: true`) flags only **84**, a strict
SUBSET. The 54-title delta is the newer CSLB-contractor-licence / Carpenters
Apprenticeship / NCCER cohort — precisely the rows a trades-heavy partner list
matches. The test asserts the subset relationship so an upstream change fails
loudly instead of under-counting.

⚠ **`adopters` is a UNION** across every exhibit record sharing a unified title
(statewide adoptions AND local articulations), because the partner's question is
"where can my student get credit?". Counts here can legally exceed the Statewide
Exhibits tab, which counts the CCC-Collaborative record alone.

⚠ **Do not reach for `kb/coci_articulations.json` for exhibit→college questions.** It
has exactly the right shape (`exhibit_id`, `exhibit_title`, `earned_by_colleges`,
`local_courses`) but its `_status` is **PREVIEW**, last re-keyed 2026-05-23: measured
against the live index it misses **21% of the credentials** a partner list touches and
disagrees on the college set for 18 more. Attribution comes from `statewide_data.js`
instead — see the KB note.

Outputs land in `kb/partner_crosswalk_out/<date>-<slug>/`. The workbook is a
regenerable artifact and is **not committed**; `summary.json` / `unmapped.json`
are the run receipt, and `unmapped.json` **is the curator worklist**. Method:
[`docs/kb-notes/methodology-partner-occupation-crosswalk.md`](../docs/kb-notes/methodology-partner-occupation-crosswalk.md).

## `college_cr_evidence/` — a CR for a course a college already approved (2026-08-27)

A college names courses it will award for a CPL type but holds no credit recommendation, and
MAP needs one before an articulation can exist. Jessica: *"This is a common problem we have
with colleges."*

- **`_match_courses_to_ace_recs.py`** — matches a college's course list to the ACE credit
  recommendation vocabulary in `map_college_cr_unit`. Two signals kept separate: the
  recommendation EXISTS (a proposal) vs a named peer college USED it (a fact). Reuses the
  Supabase `cx_align_tokens()` stopword list, adds a WEAK set (generic nouns may contribute
  to a score but never carry a match alone) and a domain gate.
- **`college_cr_evidence/<college>_<lane>_<date>.{json,html}`** — the payload and the
  rendered worklist. First run: LATTC military CPL, 139 courses → 87 peer-backed /
  46 recommendation-only / 6 needing a faculty call.
- Guard: `tests/lattc_worklist_page_test.py` (browser, 51 checks; needs Chromium, skips
  cleanly without it — it is NOT part of `npm test`).

⚠️ **The unit rule (Jessica, 2026-08-27):** recommendation hours more than **1 unit** from
the course are not listed; exactly one apart stay at a lower score. Applied **only** where
COCI supplied units — a course with no units is never filtered, because an absent
measurement must not read as a failed one.
