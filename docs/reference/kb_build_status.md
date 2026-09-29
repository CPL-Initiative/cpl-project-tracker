---
title: "Knowledge Base & Unified Courses Curation — Build Status (CLAUDE.md offload)"
date: 2026-07-10
tags: [reference, claude-md-offload]
kb-status: internal
obsidian-folder: cpl-project-tracker/docs/reference
related:
  - "[[CLAUDE]]"
---

> **Moved verbatim from `CLAUDE.md` on 2026-07-10 (Session 111 — SkyMighty,
> the pare-down).** This is ALWAYS-CURRENT project memory, not an archive:
> Rule 9 checkpoints update THIS file now. `CLAUDE.md` keeps a stub pointing here.

## Knowledge Base & Unified Courses Curation — Build Status

The `kb/` directory holds the synthetic-identity knowledge base above MAP's
exhibit/course data, plus the data behind the dashboard's **Unified Courses**
curation tab. Full schema/design: `kb/README.md` and
`docs/exhibit_unification_vision.md`. This section is the orientation map for a
session resuming the build — read it before touching `kb/` or the curation tab.

**Two identity layers:**

1. **Credential layer** (which credential an exhibit represents) — built &
   curated across the full dataset.
   - `unified_titles.json` — every distinct raw exhibit title → a unified
     credential name (+ confidence, `quality_flag`). `quality_flag:
     "suspect_course_as_exhibit"` marks ~200 exhibits typed "Industry
     Certification" that are really a course with no credential (data-entry
     pattern, ~half Modesto JC) — a triage backlog, not a verdict.
   - `credentials.json` — per `(unified_title, issuing_agency)` issuer/trainer
     metadata.

2. **Course-identity layer** (which common course a local course is) — staging
   built; the **articulation crosswalk is the current frontier**. Identifier
   precedence is **CCN-ID > C-ID > M-ID** (see the README section).

   **Cluster category RETIRED (rule, 2026-05-30, Session 19).** There is no
   longer any `id_system: "Cluster"` row in the CCR. Two things ever carried
   that label; both are gone:
   1. **Auto-seeded variant-unification clusters** (`UC-XXXXX`, from
      `_seed_coci_unified_courses.py`) — **DISSOLVED.** They grouped M-IDs by a
      **token-sorted** title key, which collapsed distinct course *levels* (e.g.
      "Algebra 1: Part 2" and "Algebra 2: Part 1" both sort to `1 2 algebra part`
      → wrongly merged). Never curator-reviewed, **double-emitted** their members
      as Stand-Alone rows, and carried **zero** articulations. The
      **Suggested-merges worklist** does this job now — curator-confirmed (the
      safety these auto-applied clusters lacked; it became level-COLLAPSING in
      Session 57, but every merge is still human-confirmed).
      The `clusters` dict in `coci_unified_courses.json` is empty (archived at
      `archive/coci_unified_courses_clusters_2026-05-30_pre-dissolution.json`);
      every `for … in clusters` loop in `export_unified_courses()` no-ops.
   2. **Curator merge targets** — **RELABELED.** When a curator folds members
      into a target via `merge_into`, the result no longer overrides the
      target's identity with "Cluster". Instead:
      - a target with a **native identity** (M-ID / C-ID / CCN-ID) keeps that
        `id_system` + `kind: "Course"` — an M-ID gaining members is still that
        M-ID (e.g. `ARTS M1159`, `PHYS M1265`). 9 such rows.
      - a **synthetic** target with no pre-existing identity (a `UC-CUR-*` minted
        by a singleton-only worklist merge) becomes the new `id_system: "Unified"`
        / `kind: "Unified"`. 1 such row today; grows as singleton-only merges are
        confirmed. The CCR Kind filter + Source filter list **Unified** (not
        Cluster); the generator `_target_identity()` derives it; `unified_courses.js`
        `doConsolidate()` mirrors it for live edits; the auditor labels these cards
        `row_kind/id_system: "Unified"`. (Auditor tag *keys* stay `cluster_*` —
        internal stable identifiers; their human labels read "Unified".)

   The 9 clusters that had ALREADY been curated (merged into an M-ID) were
   migrated to **per-member `merge_into`** entries in Supabase `kb_curation` +
   `kb/coci_curation.json` BEFORE dissolution, so no curator decision was lost
   (16 of 17 per-member equivalents already existed from the worklist; only
   `PHYS M11WB → PHYS M1265` had to be added). Side-benefit: this cleared all 9
   `cluster_member_unresolved` auditor findings (they fired on the redundant
   cluster-key merges).
   - **CURATED ANCHOR — firewalled, do NOT bulk-edit:** `common_courses.json` +
     `course_crosswalk.json` are a small hand-reviewed quality anchor. NEVER
     bulk-merge staging into them; promote individual entries only after review.
     **Anchor curation affordances (PR #198 + follow-up, 2026-05-30):** anchors now
     surface their `discipline_provisional` sub-area in the CCR (e.g. Business →
     Accounting; generator emits `disc_prov` on anchor rows). They stay read-only,
     but a signed-in reviewer can **propose** a correction — written to a
     `kb_curation` row with field **`anchor_discipline_proposal`** (deliberately
     EXCLUDED from `_apply_curation.py` FIELDS, so it never folds into the overlay
     or overwrites `common_courses.json`); shown as a public "✎ proposed" badge until
     a maintainer promotes it. **Cross-listing** (a course under two disciplines, same
     number) uses the new `kb_curation` field **`cross_listed_disciplines`**
     (comma-separated MQ disciplines, IN `_apply_curation.py` FIELDS) — generator
     `xdisc_of()` emits `xdisc` on M-ID/singleton rows, CCR shows a "+ Discipline"
     chip and the discipline filter matches primary OR cross-listed. Additive, same
     number, no re-mint. (Used for the cross-disciplinary accounting cleanup —
     `docs/accounting_crossdisc_plan.md`.)
   - **Reference authorities (read-only):** `reference/cid_descriptors.json`,
     `ccn_courses.json`, `mq_disciplines.json` (official MQ discipline
     vocabulary), `reference/coci_courses.json` (authoritative C-ID/CCN courses
     + descriptions from the MAP COCI list), `reference/subject_discipline_map.json`.
   - **Staging (operational, machine-built from the COCI course universe):**
     `coci_minted_courses.json` (minted **M-ID** consolidated courses — identity,
     discipline, credit_status, typical_units, top_code, noncredit_category, each
     with `*_mixed` variance flags), `coci_minted_memberships.json` (lean
     M-ID → member `(subject, number)` join index), `coci_minted_singletons.json`
     (deferred single-college courses), `coci_unified_courses.json` (its
     auto-seeded variant-unification clusters were **DISSOLVED 2026-05-30** — the
     `clusters` dict is now empty; see the "Cluster lifecycle" note below),
     `coci_articulations.json` (earned articulations resolved
     to identity + credential, with cross-college **adoption-leverage** lists —
     the payoff layer), `coci_curation.json` (human curation overlay synced from
     Supabase — each entry carries `discipline` + `reviewed_by` + `reviewed_at`).
   - **Discipline inference (re-runnable, AI-assisted draft):**
     `kb/discipline_inference.json` is an **authored, editable lexicon** — a
     `subject_map` (subject code → discipline, for codes whose member titles are
     unambiguously one discipline) + a tight `title_keyword` fallback (terms that
     are unambiguous alone). `kb/_infer_disciplines.py` applies it to the minted
     courses, clusters, and singletons: validates every target against
     `mq_disciplines.json`, **skips reviewed/curated entries**, and stamps each
     fill with `discipline_source` (`subject_map`|`title_keyword`),
     `discipline_confidence`, `discipline_inferred_at`. Re-run after editing the
     lexicon; it only fills entries that are still blank. Passes 1–3 filled the
     lexicon-tractable courses; the long tail (ambiguous catch-all subject codes)
     remains.
   - **Description-aware inference (re-runnable, complementary):**
     `kb/_infer_disciplines_from_desc.py` mines the course *description* for
     courses whose title/subject gave no signal (e.g. "Climate Control" →
     description names HVAC). It uses a **safe, high-precision phrase set** (only
     terms decisive inside long prose — welding, automotive, dental, CNC,
     paramedic, …) with **plurality scoring + unique-winner** (ties skipped),
     since descriptions mention disciplines tangentially. Descriptions come from
     the in-file `description`/`synthesized_description` for parents and from the
     generated `unified_courses_details.js` for singletons (skipped if that file
     is absent → parents-only). Fills are stamped `discipline_source="description"`
     at confidence **0.5** (the lowest tier — surfaced as `⚙ descr` for reviewer
     triage). Pass 4 filled ~941 (850 singletons + 91 parents).
   - **TOP-aware inference (re-runnable, highest-yield):**
     `kb/_infer_disciplines_from_top.py` maps each blank course's `top_code` to an
     MQ discipline via the authored `kb/top_discipline_map.json` (the 6-digit MAP
     TOP program title is a curated category that often names the discipline:
     "0948.00" → Automotive Technology, "1230.10" → Registered Nursing → Nursing).
     **Guardrail:** colleges vary in TOP assignment, so it's an intent signal, not
     ground truth — fills at **confidence 0.5**, `discipline_source="top_code"`
     (surfaced as `⚙ TOP`), reviewer-verifiable. The coarse catch-all codes
     (`4930.xx` Interdisciplinary/Basic-Skills/Guidance, the `*99.00 Other` and
     `* General` buckets) are **deliberately omitted** from the map so they stay
     blank rather than get a misleading lump-discipline (only ESL `4930.86/.87`
     are mapped). Pass 5 filled **~10,344** (the biggest pass — every staging
     course carries a top_code; blanks 17,537 → ~7,193). Edit the map + re-run.
   - **COARSE TOP-division fallback (re-runnable, lowest-precision — added Session
     37, 2026-06-09):** `kb/_infer_disciplines_from_top_division.py` fills the
     orphan tail the precise passes leave blank (their 6-digit TOP code is a
     catch-all `*99.00 Other` / `* General` / `4930.xx` Interdisciplinary that
     `top_discipline_map.json` deliberately omits) with the **broad umbrella
     discipline of their 2-digit TOP division** via `kb/top_division_discipline_map.json`
     (`49`→Interdisciplinary Studies, `12`→Health, `09`→Industrial Technology, …;
     19 divisions mapped to an **MQ-verified** umbrella, 5 with no honest umbrella —
     Media/Fine-Arts/Commercial — left blank). Fills at **confidence 0.4**,
     `discipline_source="top_division"` (surfaced as `⚙ TOP-div`, warn-colored, with
     a **"by TOP division"** Generated-by filter). A deliberate, **reversible
     relaxation** of the "leave catch-alls blank" guardrail (Sam, 2026-06-09: "whole
     tail please") so the ~5.9k orphan singletons stop being invisible to the CSR.
     A division fill is honest (a 09xx course IS an industrial technology) but
     COARSE (welding vs drafting both → Industrial Technology) — refine via
     curation. **Filled 6,590** (singletons 5,904→500 blank, minted parents
     1,268→80). Side-effect: reintroduces `subject_collision_signal` (0→1,076) since
     the coarse fills assign a discipline without re-keying SUBJ4 to that
     discipline's canonical — expected, pending a future canonical-SUBJ4 fold.
     Verified by `kb/_verify_top_division_inference.py`. After running, **re-seed the
     CSR** (`python3 kb/_seed_canonical_subj4.py`) so the new disciplines/variants
     surface (the cron doesn't re-seed; it only applies Supabase overlays).

**Generators** (`kb/_seed_*.py`, `_join_*.py`, `_curation_*.py`, `_flag_*.py`)
are one-shot, kept for provenance — curate by editing JSON / via Supabase, not
by re-running them. **Exception:** `kb/_infer_disciplines.py` is intentionally
re-runnable (re-derives + RETRACTS its own prior fills when the lexicon changes — Session 45; never touches reviewed/curated/manual or other passes' fills). subject_map entries may be COLLEGE-SCOPED ({discipline, colleges}) for homonym subjects — validate with `kb/_audit_subject_map.py` after edits (docs/kb-notes/methodology-college-homonym-subject-codes.md).

**Unified Courses dashboard tab + Supabase:**
- The **Unified Courses** tab lets allowed reviewers curate disciplines.
  `unified_courses.js` is a **static asset** — edit it directly; it is NOT
  regenerated by `excel_to_dashboard.py`. (Its DATA, `unified_courses_data.js`,
  IS generated by `export_unified_courses()`.)
- Auth is **Supabase GoTrue magic-link** sign-in gated by an `allowed_reviewers`
  list. The magic link's redirect must be passed as a **`?redirect_to=` query
  param** (not a body `options` object) and must match the Supabase **Site URL /
  allowed Redirect URLs** (both currently set to
  `https://cpl-initiative.github.io/cpl-project-tracker/`). Don't re-break that.
  Sessions are kept alive via the **refresh token** (no repeated magic-link
  emails); the stored token is validated as a well-formed JWT before use so a
  garbled token can't silently break saves. Schema setup:
  `kb/supabase_curation_setup.sql`.
- **Curation UX** (all in `unified_courses.js`): click a Discipline cell to set
  it (MQ vocabulary); after a save, an **opt-in subject-code bulk apply** offers
  to fill other *blank* same-subject courses (never overwrites; warns that
  subject codes vary by college). Edits write to `kb_curation` and show live via
  an overlay. **Batch-verify** — a toolbar **"✓ Verify N filtered"** button
  accepts the machine-inferred discipline AS-IS for every currently-filtered
  Generated row that has a discipline (chunked bulk upsert; excludes blanks /
  locked anchors / already-Verified; the confirm surfaces the lower-confidence
  title-keyword/description share so the curator can narrow to "by subject-code"
  first). It clears the Generated backlog in bulk rather than one Verify per row.
  The **⚇ Unify** candidate ranking factors **subject + units** agreement, not
  title alone (title-token Jaccard ≥ 0.5 gates inclusion; same-subject +0.15 and
  same-units +0.10 reorder to the top — `unified_courses_index.js` now carries
  units as a 5th field). **Suggested-merges worklist** — a **"✨ Suggested
  merges"** toolbar button opens a review queue over precomputed same-course
  groups (`unified_courses_suggestions.js`, lazy). The generator groups identities
  by a **level-COLLAPSING + segment-folding + synonym-normalizing title
  signature** (parentheticals + articles removed, the LEVEL axis folded out —
  level words begin/interm/advanced…, roman/word/digit ordinals, bare a–h section
  letters — **plus structural DIVIDER words `_SUG_SEGMENT = {part, semester,
  module, half, level, levels}`** since Session 58 **plus a curated
  abbreviation↔expansion `kb/synonym_map.json`** (ESL≡English as a Second
  Language, ASL/PE/Math/AJ — a similarity threshold can't bridge a zero-overlap
  synonym) — tokens sorted, so "Japanese 1" / "Japanese II" / "Elementary
  Japanese" AND "Algebra 1-2, Semester 1" / "Elementary Algebra, Part 1" /
  "Algebra 3-4" all GROUP into one family; **loosened from level-SAFE in Session 57**
  per Sam's "over-merge > under-merge", Title 5 §55050 — the worklist is
  curator-confirmed so this only changes what surfaces, never an auto-merge.
  **In the popup (Session 58):** a ➕ **keyword-gather** (search + multi-select
  extra members into the merge) and a 🏷 **"match strength" looseness slider**
  (filters the title-evidence lane by weakest-pair cosine; default 0.62, slide to
  0.50 to reveal more — the title receipt's `COSINE_MIN` is now 0.50);
  measured by `kb/_sug_segment_dryrun.py`), ranked by cohesion (subject + units
  agreement + size).
  The payload has **two sections, anchored first**: `groups` are
  **identity-anchored** (every group has ≥1 main M-ID/Cluster identity, excludes
  `cid_conflict` over-merges, attaches matching orphan singletons) — **Confirm
  MERGES into that existing identity**. `singleton_groups` (V2, done 2026-05-22)
  are **singleton-only** — ≥2 single-college Stand-Alone courses sharing a
  signature but matching NO existing identity (~1,030 groups) — **Confirm MINTS a
  brand-new unified course** (target left blank → `doConsolidate` generates a
  `UC-CUR-*` id, all members get `merge_into` it + the unified title). Each
  singleton group carries a **`same_college`** flag (set by the generator via the
  title-filtered raw-list join: True when every member resolves to one college →
  likely intra-college variant ladders / credit-noncredit / language pairs, NOT
  cross-college duplicates); these are **flagged in the UI** (amber warning) and
  **ranked last** within the section so genuine cross-college candidates surface
  first (~869 cross-college vs ~161 same-college at last build). The curator
  reviews one group at a time, members pre-checked; **Confirm** reuses
  `doConsolidate`, **Skip** advances. **Never auto-applied.** A **pending-sync indicator** ("⟳ N edits awaiting daily sync") +
  **Sync now** link surface edits not yet in git (diffed against the dataset's
  `committed_curation` snapshot). The **curated common-course anchor**
  (`common_courses.json`, C-ID/CCN/M-ID) is shown **read-only** (an "anchor"
  badge; curation disabled — it's firewalled). Filters include **Source**
  (`id_system`), discipline, credit, confidence, adoption, flagged-only,
  blank-only; default sort is **Subject(s) then course number**. (The
  **Generated-by** provenance filter was **removed Session 69, #492** — the
  per-row ⚙ `discipline_source` badge remains.) Subject(s) cells hover to show the course title(s) /
  cluster title variants.
- **Discipline provenance surfacing** (added 2026-05-22). Generated (not-yet-
  verified) rows whose discipline was machine-inferred carry a small
  `⚙ subj-code` / `⚙ title-kw` / `⚙ descr` badge (title-keyword AND description
  use the warn color, since they're the riskier 0.55/0.5-confidence fills) plus
  the **Generated-by** filter, so a reviewer can blast through the safe
  `subject_map` fills with **Verify** and scrutinize the keyword/description
  ones. The data comes from per-row `dsrc`/`dconf` keys emitted by
  `export_unified_courses()` via the `_add_prov()` helper — emitted **only** on
  non-curated rows that carry a `discipline_source` (blank/manual/anchor rows
  stay lean, no extra keys). Curated rows render as Verified, so no badge. The
  four `discipline_source` values are `subject_map` + `title_keyword` (from
  `kb/_infer_disciplines.py`), `description` (from
  `kb/_infer_disciplines_from_desc.py`), and `top_code` (from
  `kb/_infer_disciplines_from_top.py`) — the Generated-by filter has a matching
  option for each (`by subject-code` / `by title-keyword` / `by description` /
  `by TOP code`); only `subject_map` renders ok-colored, the rest warn.
- Supabase is **live and shared**: only the unified-courses curation tables
  (`kb_curation`, `allowed_reviewers`) are in scope. The
  projects/budget/personnel/workplan tables (§8) and the auth/Redirect-URL config
  are off-limits without explicit confirmation, and no destructive migrations
  without sign-off.

**Generated artifacts + lazy files (all from `export_unified_courses()`).** The
tab keeps `unified_courses_data.js` lean by splitting heavy data into files the
client fetches **only on demand**. All are regenerated daily and MUST be in the
workflow `git add` list (§6):

| File | Global | Loaded when | Contents |
|------|--------|-------------|----------|
| `unified_courses_data.js` | `CPL_UNIFIED_COURSES` | **lazy — first CCR-tab open** (Session 36 perf split; was an eager `<script>`) | in-browser rows (~16.4k: Course/Cluster + curated C-ID/CCN/M-ID anchors), `colleges[]`, `mq_disciplines`, `committed_curation`, `committed_descriptions`, `topmap` (TOP code→title, ~400, for the list's TOP hover) |
| `unified_courses_index.js` | `CPL_UC_INDEX` | ⚇ Unify dialog | compact `[id,title,subject,kind,units]` search index (units feeds the subject/units-aware ranking) |
| `unified_courses_details.js` | `CPL_UC_DETAILS` | ⓘ details modal | `id → {d:description, s:source}` (~70k incl. stand-alones; ~34MB, lazy/gzipped) |
| `unified_courses_standalone.js` | `CPL_UC_STANDALONE` | "Stand-Alone" kind filter | ~57.7k single-college rows (kept out of the main payload) |
| `unified_courses_members.js` | `CPL_UC_MEMBERS` | row expand caret ▸ | `id → [{c:collegeIdx,n:code,t:title,u:units,p:topcode}]` member college courses + `topmap` (TOP code→title, deduped) |
| `unified_courses_member_desc.js` | `CPL_UC_MEMBER_DESC` | member "Show descriptions" link | `id → [desc,…]` PARALLEL to `members[id]` (each ≤500 chars) — on-demand, ~51MB so loaded only when a curator opens member descriptions |
| `unified_courses_suggestions.js` | `CPL_UC_SUGGESTIONS` | ✨ Suggested-merges worklist | **Six sections, all HUMAN-CONFIRMED / never auto-applied:** `groups` = identity-anchored same-title merges (**level-COLLAPSING + segment-folding `_sug_sig`** — folds the level axis since Session 57 (word-numbers since Session 46) AND structural divider words `_SUG_SEGMENT` {part/semester/module/half/level} since Session 58, so "X 1"/"X II"/"Elementary X" and "X 1-2, Semester 1"/"X, Part 1" group into one family); `singleton_groups` (V2) = singleton-only matches that mint a NEW unified course (`same_college` flags likely intra-college variants); `family_groups` (#310) = co-articulation family merges (`(M-ID subject prefix, _fam_key)` gated on a shared credential); `desc_groups` (#382) = 📝 description-evidence merges over DARK M-IDs (TF-IDF catalog-description cosine; receipt `kb/desc_consolidation_out/`); `title_groups` (#385, Session 46) = 🏷 title-evidence merges over dark M-IDs + Stand-Alone singletons (IDF-weighted title cosine, guard suite `kb/_consolidation_guards.py`, NO units gate — receipt `kb/title_consolidation_out/`; mixed groups merge into the M-ID, all-singleton groups mint new); `evidence_groups` = 🧾 COCI-evidence folds into official C-IDs (witness counts; `x:1` members pre-unchecked). Ranked by cohesion, cross-college first |
| `unified_courses_aligned.js` | `CPL_UC_ALIGNED` | row expand caret ▸ (CCR **inverse view**) | `aligned[course_id] → [{c:credential, i:issuer, p:CPL type, r:[credit recs], g:[earning colleges], n:#colleges, x:'CCC' if a statewide CCC-collaborative standard}]` — the **mirror of the EACR** (one row per course → the aligned exhibits/credentials that articulate to it). Built by `_build_aligned_exhibits_by_course()` from `kb/coci_articulations.json`; deterministic (no timestamp → no-op daily diff). 2,355 courses. Consumer unions Phase-B `consolidated_from` ids. |

**Raw course source — `kb/reference/coci_course_list.xlsx`** (committed, ~24MB,
141,738 rows). Cols: College, CourseControlNumber, Subject, Course_Number,
CourseTitle, UnitValue, CreditType, Non_Credit_Category, TopCode, **CIDNumber**,
**CatalogDescription**, **CommonCourseNumber**. Read **once** (openpyxl
read-only, streaming — never cat it) in `export_unified_courses()` and shared by
the description + member-row builds. If absent, those two artifacts skip
gracefully.

**Member-college rows + the title-filter (important).** Member rows are a
**forward join**: each identity → its member `(subject, course_number)` pairs →
raw college courses. The membership key `(subject, number)` is **globally
ambiguous** (e.g. "MATH 31" is a different course at every college), so the join
**re-applies the minting's title check**: a candidate is kept only if its title
matches the identity's (token-set Jaccard ≥ 0.5; generic/empty titles kept).
**C-ID / CCN joins are authoritative and trusted** (no title filter — join on
`CIDNumber`/`CommonCourseNumber`). Clusters/merge targets filter each constituent
leaf against its own title. The same title-aware candidate set also feeds the raw
description fallback. (Bug history: without the filter, M-ID A 100 "Undergraduate
Research Experience" listed every college's MATH 31 — Plane Trig, Precalc, etc.)

**Descriptions.** ⓘ modal shows the full record + an **editable description**.
Precedence per id: curated (`kb_curation` field **`description`** — added to
`_apply_curation.py` FIELDS) > existing layer (minted "representative/modal",
synthesized cluster, C-ID/CCN reference) > **raw `CatalogDescription` fallback**.
Stand-alones are included so ~54k get a description. The pending-sync badge
counts description edits too (diffed against `committed_descriptions`).

**Source filter now includes `CCN-ID`** — the 58 AB-1111 Common Course Numbers
(`kb/reference/ccn_courses.json`) are emitted as locked read-only anchor rows,
mirroring the C-ID anchor, and are usable as ⚇ Unify merge targets.

**Frontier / open work:**

- **Suggested-merge worklist V2 — DONE (2026-05-22).** The ~1,030
  **singleton-only** merge clusters (single-college courses that match each other
  but no existing identity) now surface as a second `singleton_groups` section in
  `unified_courses_suggestions.js`, reusing the same generator grouping + UI;
  Confirm mints a brand-new `UC-CUR-*` unified course. Same-college groups
  (~161, likely intra-college variants) are flagged + ranked last. See the
  "Suggested-merges worklist" bullet above for the full description.
- **Dashboard analytics by Unified-Course identity — additive card DONE
  (2026-05-22, Approach A).** The **Articulations by Unified Course** card in CPL
  Analytics (`_build_articulations_by_course()` ← `kb/coci_articulations.json`)
  groups earned articulations by unified identity, surfacing cross-college
  adoption leverage with the over-merge guardrail (see §6a). Collapse: 10,853 raw
  MAP articulation rows → 2,355 distinct course identities (4,592 identity×credential
  records). **Approach B — DONE 2026-05-26 (Session 8, Octaman, PRs #125/#127/#128/#131/#132).** The
  *interactive* EACR (`statewide_adoption` / `statewide_interactive.js`) table was re-pivoted from
  raw-title grouping to unified-credential identity grouping `(unified_title, issuing_agency,
  cpl_type, collab_type)`. Headline collapse: 3,274 cards → 2,351 (28%). Shipped in five PRs:
  dry-run + alias map (#125), unclassified-backfill (#127), producer (#128), consumer +
  migration script (#131), schema-column hotfix (#132). Migration applied as no-op (0 existing
  flags); script retained for future re-pivots. Full lessons in
  `docs/exhibit_canonicalization_lessons.md` "Session 8 — Octaman" section.
- **Open threads (next sessions), in priority order:** (1) **`CourseControlNumber`
  re-mint — LANDED (PR #84, 2026-05-22).** Memberships are re-keyed at the raw
  college-course level (each member carries its own `(College, CourseControlNumber,
  C-ID/CCN)`); minted ids re-keyed to CCN-shaped surrogates (`SUBJ M####`
  corroborated / `SUBJ M<band><d><LL>` stand-alone, synthetic 4-letter SUBJ);
  splits captured in `kb/promotions.json`; `export_unified_courses()` consumes
  the exact joins + promotions-driven Phase A/B. Authoritative alias for
  rollback: `kb/remint_out/alias_map.json`. **Unblocked**: crosswalk Phase C.
  (2) **EACR interactive re-pivot (Approach B above) — DONE Session 8.** (3) **Singleton-only
  worklist follow-up** — consider a `same_college`/blank-disc filter on the
  worklist and extending V2's grouping with a description tie-breaker for the
  borderline cross-college pairs.
- **Crosswalk re-key initiative.** Use the raw list's
  `CIDNumber`/`CommonCourseNumber` to promote minted M-IDs to their real C-ID/CCN
  identity (precedence CCN > C-ID > M-ID). **Phase A — DONE (PR #66):** each row
  carries a `match` field ({`cid`} single agreed C-ID, {`ccn`}, or
  {`cid_conflict`:[…]} when members disagree), surfaced as row badges + an
  "Official ID" filter, computed over the *title-consistent* member set. No
  identity change. In-browser counts: 960 single C-ID, 26 CCN, 235 C-ID
  conflicts (`NULL`/`N/A` sentinels filtered). **Phase B — DONE (2026-05-22,
  decisions: consolidate-by-ID + inline-generator).** Implemented as a
  **post-pass in `export_unified_courses()`** right after the Phase A `match`
  loop: every minted/cluster row whose title-consistent members agree on ONE
  clean official C-ID/CCN is grouped into a single official-identity row —
  **folded under the existing anchor** when one exists, else a **synthesized
  official row** (`id` = the C-ID/CCN, `id_system` accordingly). Last run:
  **896 M-IDs → 173 new official-ID rows + 36 anchor folds** (main payload
  16,442 → 15,719). Each consolidated row carries `consolidated_from` (the
  underlying M-ID keys) and those keys are registered in `merge_into`/
  `merge_members`, so the lazy member/detail joins fold correctly and
  curation/articulation pointers survive. The Unify-dialog index
  (`unified_courses_index.js`) is now built **after** Phase B so consumed M-IDs
  aren't offered as ghost targets and the official rows are searchable. UI:
  rows show a `⛓ N merged` badge (`unified_courses.js`). Regen-safe / no KB
  mutation / reversible. Guardrail honored: only **clean unanimous** matches —
  the 235 `cid_conflict` rows are never touched; a lone M-ID with no anchor
  keeps just its Phase A badge (no synthetic relabel). **Phase C — PARKED
  (2026-05-22, informed decision).** Splitting the `cid_conflict` / no-official-ID
  rows is deferred; conflicts stay safely surfaced via the existing "C-ID
  conflict — do not promote" badge + filter, and Phase B (clean official-ID
  consolidation) remains the automatic stopping point. **Root cause:** the
  membership key is `(subject, number)`, which is **lossy** — the same key is a
  different course across colleges (`ACCT 110` at one, `ACCT 120` at another), so
  conflicts **cannot be split at the generator level**. It's a key-granularity
  problem, not a similarity one, so a description tie-breaker can't fix it.
  **Numbers:** 231 conflicts across 2,274 member pairs; ~60% carry any C-ID,
  ~32% (718) map to >1 C-ID themselves, only ~29% cleanly extractable. **Real
  fix (its own project — scope before any build):** a `CourseControlNumber`-
  grained re-mint that rebuilds memberships at the raw college-course level so
  each member carries its own C-ID (the per-college COCI course list, which
  carries the control number, is the likely input). NOT a generator post-pass.
- Refine + curate the articulation crosswalk — precise title-based
  disambiguation when a `(subject, number)` maps to multiple M-IDs, carry
  confidence/`*_mixed`/over-merge flags onto each record, never emit an adoption
  suggestion off a flagged over-merged cluster. Backlog: fuzzy variant merging +
  subject canonicalization, singleton minting, and the
  `suspect_course_as_exhibit` triage (raise the Modesto pattern with the college).
- **Description-similarity tie-breaker (Phase C candidate).** The member-row
  forward join currently keeps a candidate when its title matches the identity
  (token-set Jaccard ≥ 0.5). Titles are the right *primary* signal, but the
  borderline band (titles differ enough to fail the threshold yet are the same
  course, e.g. "Intro to Programming" vs "Programming Fundamentals", or the
  reverse — same generic title, different course) would benefit from a
  *secondary* check on `CatalogDescription` similarity (TF-IDF/cosine with
  boilerplate like "students will…"/prereqs/repeatability stripped). Scope it to
  the ambiguous middle (~0.3–0.5 title Jaccard), NOT every pair — descriptions
  share boilerplate that inflates naive similarity, and it's heavier (~450 chars
  × 141k rows). Prototype + **measure how many member rows flip** before
  committing. (Motivating case: College of the Desert's MATH 31 genuinely *is*
  "Undergraduate Research Experience" in STEM — title match already keeps it; the
  tie-breaker is for the harder cases the title gate can't settle.)
**Discipline completion — 6 inference passes done (5 precise 2026-05-22; the
coarse division fallback 2026-06-09).** Blank disciplines went from **21,656 →
~580** across: lexicon passes 1–3 (`discipline_inference.json` +
`_infer_disciplines.py` — subject_map + title_keyword), the description pass
(`_infer_disciplines_from_desc.py`), the highest-yield TOP-aware pass
(`_infer_disciplines_from_top.py` + `top_discipline_map.json`, ~10.3k fills), and
the **Session-37 COARSE TOP-division fallback** (`_infer_disciplines_from_top_division.py`
+ `top_division_discipline_map.json`, **6,590 fills** — closed the orphan tail from
~7,193 to ~580 so it stops being invisible to the CSR). Each fill is a
confidence-tiered, reviewer-verifiable draft (`discipline_source` ∈
`subject_map`/`title_keyword`/`description`/`top_code`/`top_division`; surfaced via
the Generated-by filter + `⚙` badges + **batch-verify**). **The remaining ~580 are
the divisions with no honest single MQ umbrella** (Media, Fine/Applied Arts,
Commercial Services, 2 untitled) — intentionally left blank; best closed by
**reviewer curation in the tab**. Re-run any pass after editing its lexicon/map;
all skip reviewed/curated; pass 1 re-derives + retracts its own fills (Session 45 — lexicon removals propagate), the rest only fill blanks. Homonym subject codes are college-scoped in the lexicon, enforced by `kb/_audit_subject_map.py`.

**Guardrails when resuming:**
- The `coci_*.json` files are large (tens of MB). **Never read/cat them into the
  conversation** — it trips `400: text content blocks must be non-empty` /
  context overflow. Inspect via scripts that print counts/samples only.
- Staging only; don't touch the curated anchor or Supabase auth/other tables
  without confirmation. Feature branch + PR; don't push to `main`.

---

