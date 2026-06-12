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
| `reference/mq_disciplines.json` | Reference | Official CCC discipline titles (19th Ed. Minimum Qualifications Disciplines Index). Controlled vocabulary for the `discipline` field. | — |
| `reference/subject_discipline_map.json` | Reference | Subject-code → MQ discipline lookup used by the M-ID consolidation generator (STAGING draft; 309 unambiguous codes mapped, ambiguous/bucket codes deliberately left null). Built by `_seed_subject_discipline_map.py`. | normalized subject code |
| `reference/coci_course_list.xlsx` | Reference | Raw per-college COCI course list (~24MB, 141,738 rows): College, CourseControlNumber, Subject, Course_Number, CourseTitle, UnitValue, CreditType, Non_Credit_Category, TopCode, **CIDNumber**, **CatalogDescription**, **CommonCourseNumber**. Read-only build input — `excel_to_dashboard.py` streams it (openpyxl read-only; **never cat it**) for the member-college rows + description fallbacks. | — |
| `college_short_names.json` | Reference | Curator-provided college full-name → short-name map (118 colleges) for compact chips across CCR/EACR/CER. `_meta` + `colleges[]` of `{canonical, short (Title Case), short_caps (ALL CAPS), aliases[]}`. Consumed in the browser via the root `college_short_names.js` resolver (`window.cplCollegeShort`); NOT a daily-cron artifact. See [`docs/kb-notes/reference-college-short-names.md`](../docs/kb-notes/reference-college-short-names.md). | `canonical` college name |
| `_seed_college_short_names.py` | Reference | **Re-runnable, idempotent.** Builds `college_short_names.json` + the root `college_short_names.js` from the embedded curator table; applies short-name cleanups + Title-Case special cases; discovers spelling aliases; asserts no two colleges collapse to one normalized key; reports every chip-name string that fails to resolve against the live data. Edit + re-run when the dataset changes. | — |
| `discipline_inference.json` | Course | Authored, editable lexicon for filling blank disciplines: `subject_map` (subject → discipline; entries may be **college-scoped** `{discipline, colleges}` for homonym subjects — Session 45) + `title_keyword` fallback. Applied by `_infer_disciplines.py`; validated by `_audit_subject_map.py` (curator clearances persist in `_subject_map_notes.audit_cleared`). | — |
| `coci_curation.json` | Course | Human curation overlay synced from Supabase `kb_curation` by `_apply_curation.py`; each entry carries curated fields (`discipline`, `merge_into`, `unified_title`, `description`) + `reviewed_by` + `reviewed_at`. Applied on top of the AI drafts by `excel_to_dashboard.py` (regen-safe). | `course_id` |
| `_infer_disciplines.py` | Course | **Re-runnable** discipline inference: applies `discipline_inference.json` to the minted/cluster/singleton staging files. Validates targets against `mq_disciplines.json`; skips reviewed/curated; stamps `discipline_source`/`_confidence`/`_inferred_at` (`subject_map`\|`title_keyword`). Re-derives + **RETRACTS its own prior fills** when the lexicon changes (Session 45 — removals propagate; the later passes re-fill from per-row evidence); other passes' fills untouched. College-scoped entries fire only when every college behind the row is allowlisted. | — |
| `_infer_disciplines_from_desc.py` | Course | **Re-runnable** description-aware discipline inference (complement to the above): scores the course *description* against a safe, high-precision phrase set (plurality, unique-winner). Descriptions from in-file `description`/`synthesized_description` (parents) + generated `unified_courses_details.js` (singletons; skipped if absent). Stamps `discipline_source="description"` at confidence 0.5. Skips reviewed/curated; fills blanks only. | — |
| `_infer_disciplines_from_top.py` | Course | **Re-runnable** TOP-aware discipline inference (highest-yield): maps each blank course's `top_code` → MQ discipline via `top_discipline_map.json`. Stamps `discipline_source="top_code"` at confidence 0.5. Skips reviewed/curated + the coarse catch-all TOP codes (omitted from the map); fills blanks only. | — |
| `top_discipline_map.json` | Course | Authored TOP code → MQ discipline map for the pass above. Only codes whose TOP program title pins ONE MQ discipline; coarse `4930.xx` / `*99 Other` / `* General` buckets deliberately omitted. Validated against `mq_disciplines.json`. | TOP code |
| `_infer_disciplines_from_top_division.py` | Course | **Re-runnable, COARSEST tier (Session 37, 2026-06-09).** Fills the orphan tail the precise passes leave blank (catch-all 6-digit codes) with the broad umbrella discipline of their **2-digit TOP division** via `top_division_discipline_map.json`. Stamps `discipline_source="top_division"` at confidence **0.4** (`⚙ TOP-div` badge + "by TOP division" filter). A deliberate, reversible relaxation of the "leave catch-alls blank" guardrail so ~5.9k orphan singletons stop being invisible to the CSR. **Filled 6,590** (blanks ~7,193→~580). Run, then re-seed the CSR (`_seed_canonical_subj4.py`). Validates targets against MQ; skips reviewed/curated; fills blanks only. Tested by `_verify_top_division_inference.py`. | — |
| `_audit_subject_map.py` | Course | **Re-runnable homonym auditor (Session 45 — the CRIM M1003 case).** Validates every `subject_map` entry statewide: per-college TOP-division votes (internal-consistency gated) + minority-title evidence grading (`foreign`/`mixed`/`consistent`; curator clearances suppress re-flags). Receipt `subject_map_audit.json`. Run after every lexicon edit; repair = scope/remove the entry, then re-run the inference chain. See `docs/kb-notes/methodology-college-homonym-subject-codes.md`. | — |
| `_desc_consolidation_dryrun.py` | Course | **Re-runnable description-similarity consolidator for DARK M-IDs** (no C-ID/CCN claim, no c-id.net coverage, no promotions, no curation — 13.9k of 16.1k post-#379). TF-IDF cosine over catalog descriptions; gates = cosine ≥0.60 + credit + units(±0.5) + not-the-title-lane's + the shared `_consolidation_guards.py` title-safety suite. Receipt `desc_consolidation_out/candidates.json` (446 groups post-Session-46 guard upgrade; 134 cross-college) — **committed input** the generator joins into the worklist as `desc_groups`; re-run termly like the c-id.net refresh. Never auto-applies. | — |
| `_consolidation_guards.py` | Course | **Shared title-safety guard suite (Session 46)** imported by BOTH consolidation receipt builders so they can't drift: **two-axis level marks** (word-levels vs digit-levels — kills the "Elementary X 2" / "Intermediate X 1" flat-set collision; digits, romans, **cardinal word-numbers**, A/B + context-marked session letters), **strict-equality variant-type marks** (refresher/update/supplemental/instructor/supervisor/module/bridge/honors — a variant never pairs with its base), **year edition marks** (15xx–20xx), gender + sport marks. `docs/kb-notes/methodology-title-similarity-merge-guards.md`. | — |
| `_title_consolidation_dryrun.py` | Course | **Re-runnable title-similarity consolidator (Session 46 — the AUTO/smog over-mint case)** over dark M-IDs **+ Stand-Alone singletons** (67.3k titles — the desc lane can't see singletons, and 42 of the 52 smog fragments were singletons). IDF-weighted title-token cosine ≥0.62; gates = credit + discipline-OR-TOP-division corroboration + ≥2 shared content tokens + the shared guard suite; **NO units gate** (licensure-spec courses pack 1–7u by college — spread is reported, not gated); **clique-consistent components** (unmarked titles can't chain Level 1 + Level 2). Receipt `title_consolidation_out/candidates.json` (5,662 groups; 4,376 cross-college; 2,255 mixed M-ID+stand-alone) — **committed input** joined as `title_groups` (🏷, the 6th worklist section; mixed groups merge into the M-ID, all-singleton groups mint new). Re-run termly. Never auto-applies. | — |
| `top_division_discipline_map.json` | Course | Authored 2-digit TOP **division** → MQ-verified umbrella discipline (19 mapped: `49`→Interdisciplinary Studies, `12`→Health, `09`→Industrial Technology, …; 5 skipped — Media/Fine-Arts/Commercial/2-untitled — no honest umbrella → stay blank). Division titles from `TOP_Code_Lookup.xlsx`. The pass aborts if any target isn't in `mq_disciplines.json`. | TOP division |
| `_apply_curation.py` | Course | Sync Supabase `kb_curation` → `coci_curation.json` (needs `SUPABASE_SERVICE_KEY`). Run in the daily workflow; safe to run manually. | — |
| `_rekey_promotions.py` | Course | **Re-runnable, idempotent — MANDATORY after every re-mint (Rule 7 checklist / fan-in guard 7).** Re-keys `promotions.json` (the Phase A/B official-ID fold evidence) through every applied alias map; folds converged keys (witnesses sum, colleges union); V1–V4 conservation gates; receipts `promotions_rekey_out/<date>/`. Added 2026-06-11 after four re-mints skipped the manifest and silently severed 53% of the fold evidence (`docs/official_id_fold_scope.md`). Dry-run default; `--apply` writes. | — |
| `_analyze_official_fold_evidence.py` | Course | **Read-only drift detector** for the promotions evidence: resolves keys through the alias chain, reports severance counts, R2 evidence tiers, the Spanish-family table, and validation against existing curator merges. Its re-keyed-resolvable count should stay ~0 while the Rule-7 checklist is honored. | — |
| `_analyze_witness_kinship.py` | Course | **Read-only measure-first analyzer for the WITNESS-KINSHIP gate** (Session 41): per promotions record, resolves each witness's claimant course from the raw list and scores title kinship vs the remnant (and vs the official catalog title). The gate it models is live in `_official_match()`/`_row_official()` (excel_to_dashboard.py): a witness only drives an auto-fold if kin-valid — receipts describe the FAMILY THAT EXISTED AT THE RE-MINT, and ids that survive a later split keep receipts that no longer describe them (no re-key can fix that; 781/1,635 edges were stale, incl. one with 40 unanimous stale witnesses). Also the recovery path for the 340 blocked singleton receipts R4 left un-laned. `docs/kb-notes/methodology-witness-kinship-gate.md`. | — |
| `discipline_canonical_subj4.json` | Course | **Phase 1e** — curator-confirmed canonical 4-letter SUBJ4 per M-ID discipline + per-discipline TOP/CTE/CIP + `local_subject_variants` (raw college subject codes joined from memberships, added in PR #109). Consumed by the SUBJ4-canonicalization re-mint to fold same-discipline SUBJ4 variants (e.g. ASL/AMSL/DEAF/SIGN/… → one canonical). Edited via the dashboard's **Common Subject Code** tab (writes to Supabase `kb_curation` with synthesized `_CANON_SUBJ4::<discipline>` namespace). | discipline |
| `_seed_canonical_subj4.py` | Course | **Re-runnable, regen-safe.** Generates `discipline_canonical_subj4.json` by counting SUBJ4 variants per discipline across both `coci_minted_courses.json` + `coci_minted_singletons.json`, plus joining `coci_minted_memberships.json` for raw local college subject codes (`local_subject_variants` field). Also aggregates TOP code modal + 4-digit category + CTE share + flag. Preserves curator-reviewed/validated entries on re-run; only the data-driven fields refresh. | — |
| `_apply_canonical_subj4.py` | Course | Sync Supabase `_CANON_SUBJ4::*` rows → `discipline_canonical_subj4.json`. Mirrors `_apply_curation.py` pattern; runs in the daily workflow after the main curation sync. Validates 4-letter SUBJ4 before applying. | — |
| `_apply_unclassified_triage.py` | Exhibit | **CER unclassified-triage PR-2.** Sync Supabase `_UNCLASSIFIED::<raw_title>` rows (the CER worklist's raw-title→unified-title assignments) → `unclassified_assignments.json`. Mirrors `_apply_credential_review.py`; idempotent (no rewrite when unchanged → no empty-overlay daily churn). Records only — the fold into `unified_titles.json`/`credentials.json` is the dry-run-first PR-3. | — |
| `unclassified_assignments.json` | Exhibit | Git-canonical overlay of CER unclassified-triage assignments: `raw_title → {unified_title, issuing_agency, reviewed_by, reviewed_at}`. Synced daily by `_apply_unclassified_triage.py`. Durable record + the input `_fold_unclassified.py` consumes. | `raw_title` |
| `_fold_unclassified.py` | Exhibit | **CER unclassified-triage PR-3 — the FOLD.** Dry-run-first (`--apply`), V-gates V1–V4. Reads `unclassified_assignments.json` → ADDs `raw_title → {unified_title, confidence 1.0, classified_by curator}` to `unified_titles.json` (+ `credentials.json` if the title has no record) + PRUNES the folded raws from `exhibit_audit/latest.json` (minified, matching the auditor). Idempotent: already-classified→SKIP, different-target→CONFLICT (rejected); detects + blocks `coci_articulations.json` ripples. Receipt → `unclassified_fold/<date>/`. Re-run after more worklist assignments. | — |
| `_detect_cpl_type_dupes.py` | Exhibit | **READ-ONLY CPL-type-duplicate detector** feeding `credential_merges.json`. Signal A = normalized-title collisions (&/and/punctuation — prints ready-to-paste snippets, high precision). Signal B = same `course_id`+local-course, different `unified_title` (manual review), gated by full-title Jaccard ≥0.5 + a level-safe guard + (2026-06-09, Session 37) an **elective-bucket** gate that suppresses pairs sharing ONLY a generic dumping-ground course (mirrors the CER R1 ≥0.8-elective / ≥5-credential / ≤3-college rule; e.g. COMM M1038). On current data: Signal B 162→77 after the gate. | — |
| `_merge_credentials.py` | Exhibit | **CER credential MERGE (existing→existing).** Sibling of `_fold_unclassified.py` (which is unclassified→existing). Dry-run-first (`--apply`), V-gates V1–V4. Folds a `loser` unified_title into a `winner`: re-points the loser's raws in `unified_titles.json`, DROPs the orphan loser record in `credentials.json` (winner authoritative; MOVEs it if the winner has none), and re-points the loser's records in `coci_articulations.json`. For near-duplicate AI titles of the **same exhibit** (e.g. one exhibit entered under two CPL types → two titles — the 10-Key case). Idempotent: loser already gone → SKIP. Receipt → `credential_merges_out/<date>/`. (Session 32, #285) | — |
| `credential_merges.json` | Exhibit | Curator-confirmed merge decisions consumed by `_merge_credentials.py`: `merges: [{loser, winner, reviewed_by, reviewed_at, reason}]`. Add a one-line entry per merge; re-run the tool. | — |
| `_subj4_dryrun.py` | Course | **Phase 1e measure-first dry-run.** Re-runnable. Reads the curator-confirmed canonical map, classifies every M-ID's fate, reallocates new course_ids deterministically by `(normalized_title, old_id)`, validates **5 gates** (including V4 `new_id_disjoint_from_untouched`, added 2026-05-23 after a 386-row silent-overwrite bug), surfaces curated-collision decision points, counts downstream apply scope, reserves CCN/C-ID sequence numbers + untouched-row suffixes. Writes `kb/subj4_dryrun/{report.md, alias_map.json, blocked.json, collisions.json}`. | — |
| `_subj4_apply.py` | Course | **Phase 1e atomic apply.** Consumes `kb/subj4_dryrun/alias_map.json`. Mutates `coci_minted_courses.json`, `coci_minted_singletons.json`, `coci_minted_memberships.json`, `coci_articulations.json`, `coci_unified_courses.json`, `coci_curation.json` in place; defensive abort on key collision; idempotent. Writes audit receipts to `kb/subj4_apply/{report.md, validation.md, alias_map.json}`. | — |
| `foreign_language_subj4.json` | Course | **Umbrella-discipline map (Session 37).** Per-language SUBJ4 for the "Foreign Languages" MQ umbrella — `FL` + 2-letter (FLSP/FLFR/FLCH/…); classifier precedence TOP-11xx → title → member-subject. NOT a cron artifact. See `docs/fl_subj4_remint_scope.md`. | language |
| `_fl_subj4_dryrun.py` | Course | **READ-ONLY measure-first dry-run** for the FL SUBJ4 split. Classifies 409 FLNG M-IDs + 1,045 singletons → per-language SUBJ4 (99.5%, via the self-describing CCC TOP-11xx taxonomy); manifest at `kb/fl_subj4_dryrun/manifest.json`. | — |
| `_apply_fl_subj4_remint.py` | Course | **FL SUBJ4 re-mint apply (Rule 7).** Re-prefixes `FLNG M#### → FL** M####` (keeps the unique number → collision-free, no re-sequence); re-keys courses/singletons/memberships/articulations/curation + the `discipline_canonical_subj4` "Foreign Languages" umbrella entry. **Discipline stays "Foreign Languages."** Dry-run + `--apply`, V1–V4; receipt `kb/fl_subj4_out/<date>/alias_map.json`. (Session 37, #328) | — |
| `discipline_aliases.json` | Course | **Fan-in alias map (Session 38).** Canonical discipline → its **alternate names** ("Kinesiology" ← "Physical Education"; "Drama/Theater Arts" ← "Theater Arts"). The inverse of the umbrella split: two MQ names for one converging field fold to a canonical; the alternate stays in the MQ vocab (never deleted) + surfaces as an "also:" chip. See `docs/kin_pe_convergence_scope.md`. | canonical discipline |
| `_apply_kin_pe_convergence.py` | Course | **KIN/PE fan-in convergence apply (Rule 7, Session 38, #334).** Discipline-scoped (NEVER `subject_4letter` — `PHYS` was overloaded with Physics): "Physical Education" → Kinesiology, carve-outs adapted→`PEDS` (new MQ "Physical Education Disabled Students") + intercollegiate→`ATHL`; the 88 level-safe (band,`_fam_key`+roman-strict) duplicates MERGE into their KINE twin (band-cap fit), orphans re-sequence. Dry-run + `--apply`, V-gates; receipt `kb/kin_pe_out/<date>/alias_map.json`. | — |
| `_apply_drama_theater_convergence.py` | Course | **Drama/Theater fan-in apply (Rule 7, Session 38, #335).** "Theater Arts" → canonical "Drama/Theater Arts" (MQ slash form), SUBJ4 `THEA`; 4 merges + 50 re-sequences + 266 discipline flips. Asserts no SUBJ4 overload before touching anything. Receipt `kb/drama_theater_out/<date>/alias_map.json`. | — |
| `_apply_convergence_singletons.py` | Course | **Singleton-layer convergence extension (Session 38, #335).** The parent applies left ~56k stand-alones on the old names; same rules, NO merging at this layer (the worklist's job): 2,929 ids re-keyed collision-aware in the stand-alone `M<band><d><LL>` space + 1,187 discipline flips. Receipt `kb/convergence_singletons_out/<date>/alias_map.json`. | — |
| `_apply_kine_flsp_twin_merge.py` | Course | **KINE/FLSP strict twin-merge (Rule 7, Session 39, Sam-authorized).** Merges ONLY the strictest twin class the convergences exposed — same discipline + band + STRICT level-safe fam (roman-fixed) + `credit_status` + `typical_units`; winner = most corroborated; merge-only (no re-numbering). 70 groups / 74 losers (16,217 → 16,143). Prints any curation rows needing the **Supabase `kb_curation` mirror** (fan-in guard 6 — the local overlay is a rebuild target). ⚠ Do NOT extend to `CISC` without the single-letter guard (`R Programming` ≠ `C# Programming` — `docs/cis_cs_convergence_scope.md` §3). Receipt `kb/twin_merge_out/<date>/alias_map.json`. | — |
| `_subj4_apply_supabase.py` | Course | **Phase 1e Supabase row renames.** Pre-fetches the curated `course_id` set (so we only PATCH the ~7 aliases with live rows instead of fanning out 13k network calls — caught 2026-05-23). Best-effort per record with verbose log at `kb/subj4_apply/supabase_log.json`. | — |
| `_overmerge_dryrun.py` | Course | **Over-merge re-mint dry-run (Session 18).** Reads the auditor's `member_top_divergence`-flagged M-IDs (1,299) and plans a 1:N **split** into discipline-pure pieces. Pass-1 split brain is title/subject/description-aware (first-match-wins): review-hold → title→discipline keep-whole (`overmerge_title_discipline.json`) → container-by-subject → member-discipline cascade (SUBJ4→subject_map→TOP→description, raw-subject fallback). Collapses members sharing a CourseControlNumber into atomic units (cross-listed = one course). V1–V4 gates; writes `kb/overmerge_out/<date>/{report.md, alias_map.json, review_hold.json, collisions.json}`. Re-runnable. | discipline |
| `_overmerge_apply.py` | Course | **Over-merge re-mint apply (STAGED, dispatch-only).** Consumes `kb/overmerge_out/<date>/alias_map.json`; constructs corroborated + singleton piece records from each piece's members; mutates the 5 `coci_*.json` + curation in place. FRESH-READ + partial-apply abort + V1–V4 (V2 member-conservation, V4 article-cardinality via disjoint-partition) + stamp-based idempotency. Default DRY; `--commit` writes. Sibling `_overmerge_apply_supabase.py` + `.github/workflows/overmerge-apply.yml` (`workflow_dispatch`, concurrency `daily-dashboard`). | — |
| `overmerge_title_discipline.json` | Course | **Curator title→discipline keep-whole map** for the over-merge re-mint (data, not a generator). Seeded from Sam's dry-run review notes (Social Media→Multimedia, Death & Dying→Gerontology, …). A flagged M-ID whose title matches is kept WHOLE at the mapped discipline (single course whose TOP/subject varies by college). Grows as curation continues. | discipline |
| `_build_aligned_exhibits.py` | Course | **Re-runnable, deterministic.** Standalone generator for `unified_courses_aligned.js` (`window.CPL_UC_ALIGNED`) — the **CCR inverse view** (one row per course → the aligned exhibits/credentials that articulate to it; mirror of the EACR). Pivots `coci_articulations.json` by `course_id`; imports `excel_to_dashboard._write_aligned_exhibits_js` so the committed file is byte-identical to the daily regen. No timestamp → no-op daily diff. (Session 29, #259) | — |
| `_build_cpl_by_discipline.py` | Course | **Re-runnable, deterministic.** Standalone generator for `kb/discipline_cpl_rollup.json` — the **CSR rollup** (one row per discipline → how many exhibits/credentials articulate to its courses, across how many colleges). Rolls `coci_articulations.json` up by discipline (discipline sourced from the minted catalogs). Imports `excel_to_dashboard._write_cpl_by_discipline_json`. Sorted keys, no timestamp. (Session 29, #260) | — |
| `_seed_top50.py` | Credential | One-shot generator for the Phase 2 hand-curated credential seed. **Do not re-run** — would overwrite human edits. Kept for provenance. | — |
| `_seed_cx_common_courses.py` | Course | One-shot generator for the Phase 2 Cx seed (AI-assisted draft). **Do not re-run** — would overwrite human edits. Kept for provenance. | — |
| `_seed_coci_unified_courses.py` | Course | One-shot generator for the `coci_unified_courses.json` variant-unification clusters (`UC-XXXXX`). **Output DISSOLVED 2026-05-30** — the token-sorted title key collapsed distinct course levels (e.g. "Algebra 1: Part 2" == "Algebra 2: Part 1"), the clusters were never curator-reviewed, double-emitted their members as Stand-Alone rows, and carried zero articulations. The level-safe **Suggested-merges worklist** supersedes it. `clusters` dict now empty (archived at `archive/coci_unified_courses_clusters_2026-05-30_pre-dissolution.json`). The `id_system: Cluster` category was then **retired entirely**: curator `merge_into` targets keep their native identity (M-ID/C-ID/CCN) or, when synthetic (`UC-CUR-*`), get the new `id_system: Unified`. **Do not re-run.** | — |
| `_apply_crossdisc_remint.py` | Course | **Cross-disciplinary re-mint apply (Rule 7, Session 36, #315).** Idempotent. Mints/relabels the **cross-listed shell-course** identities — courses sharing ONE Course Outline of Record across many subject codes so students earn credit in their own degree's discipline: `RSCH M1001` "Undergraduate Research Experience" (folds `MATH M1262` + 17 singletons) + `WKEX M1001` "Work Experience Education" (net-new; 2,190 members, 105 disciplines). Sets `cross_disciplinary: true` + `discipline: "Interdisciplinary Studies"`, writes `cross_listed_disciplines` onto the **minted record** (cron-safe — `coci_curation.json` is rebuilt from Supabase), parses the member TOP `"0401.00: Title"` → bare code via `split(":")` for the discipline union, and CANON-guards a self-alias. Alias receipt `kb/crossdisc_out/alias_map.json`. The auditor EXEMPTS `cross_disciplinary` rows (`kb/_row_audit.py` early-return). | discipline |
| `_discover_map_datasets.py` | Pipeline | **One-click MAP-dataset grain + skill-level analyzer (Session 36, #316/#317).** Read-only probe behind `.github/workflows/discover-map-datasets.yml` (`workflow_dispatch`, no secrets, no commit) — the "cron-as-window" mechanism (a Claude session can't reach the MAP hosts; a runner can, and Claude reads the run log). Column-oriented parse (`columnValue`), PII-safe (`<5` mask, no identity cols). Confirmed the Exhibit CRs Catalog grain + the ACE skill-level structure. | — |
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

**Active rule set (Phase 1a + 1c, 12 rules):** `seed_untouched_discipline`,
`blank_discipline`, `blank_description`, `subject_spread_high_low_confidence`,
`mid_id_off_scheme`, `discipline_title_mismatch`,
`generic_title_concrete_discipline`, `top_discipline_disagreement` (with
SISTER_PAIRS suppression for synonymous-discipline pairs),
`description_discipline_disagreement`, **`subject_collision_signal`** (Phase 1e
diagnostic — fires when an M-ID's SUBJ4 ≠ the modal SUBJ4 for its discipline;
7,203 flags pre-re-mint, target 0 post-re-mint), `unit_anomaly`, `merge_into_orphan`,
**`member_top_divergence`** (Session 18 — the cross-discipline over-merge detector;
M-ID members span ≥2 two-digit TOP divisions with ≥30% minority share; 1,299 flags,
736 invisible to prior rules; drives the over-merge re-mint), `cluster_blanks_when_aggregatable`,
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
