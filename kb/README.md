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
| `discipline_inference.json` | Course | Authored, editable lexicon for filling blank disciplines: `subject_map` (subject → discipline) + `title_keyword` fallback. Applied by `_infer_disciplines.py`. | — |
| `coci_curation.json` | Course | Human curation overlay synced from Supabase `kb_curation` by `_apply_curation.py`; each entry carries curated fields (`discipline`, `merge_into`, `unified_title`, `description`) + `reviewed_by` + `reviewed_at`. Applied on top of the AI drafts by `excel_to_dashboard.py` (regen-safe). | `course_id` |
| `_infer_disciplines.py` | Course | **Re-runnable** discipline inference: applies `discipline_inference.json` to the minted/cluster/singleton staging files. Validates targets against `mq_disciplines.json`; skips reviewed/curated; stamps `discipline_source`/`_confidence`/`_inferred_at` (`subject_map`\|`title_keyword`). Idempotent — only fills blanks. | — |
| `_infer_disciplines_from_desc.py` | Course | **Re-runnable** description-aware discipline inference (complement to the above): scores the course *description* against a safe, high-precision phrase set (plurality, unique-winner). Descriptions from in-file `description`/`synthesized_description` (parents) + generated `unified_courses_details.js` (singletons; skipped if absent). Stamps `discipline_source="description"` at confidence 0.5. Skips reviewed/curated; fills blanks only. | — |
| `_infer_disciplines_from_top.py` | Course | **Re-runnable** TOP-aware discipline inference (highest-yield): maps each blank course's `top_code` → MQ discipline via `top_discipline_map.json`. Stamps `discipline_source="top_code"` at confidence 0.5. Skips reviewed/curated + the coarse catch-all TOP codes (omitted from the map); fills blanks only. | — |
| `top_discipline_map.json` | Course | Authored TOP code → MQ discipline map for the pass above. Only codes whose TOP program title pins ONE MQ discipline; coarse `4930.xx` / `*99 Other` / `* General` buckets deliberately omitted. Validated against `mq_disciplines.json`. | TOP code |
| `_apply_curation.py` | Course | Sync Supabase `kb_curation` → `coci_curation.json` (needs `SUPABASE_SERVICE_KEY`). Run in the daily workflow; safe to run manually. | — |
| `discipline_canonical_subj4.json` | Course | **Phase 1e** — curator-confirmed canonical 4-letter SUBJ4 per M-ID discipline + per-discipline TOP/CTE/CIP + `local_subject_variants` (raw college subject codes joined from memberships, added in PR #109). Consumed by the SUBJ4-canonicalization re-mint to fold same-discipline SUBJ4 variants (e.g. ASL/AMSL/DEAF/SIGN/… → one canonical). Edited via the dashboard's **Common Subject Code** tab (writes to Supabase `kb_curation` with synthesized `_CANON_SUBJ4::<discipline>` namespace). | discipline |
| `_seed_canonical_subj4.py` | Course | **Re-runnable, regen-safe.** Generates `discipline_canonical_subj4.json` by counting SUBJ4 variants per discipline across both `coci_minted_courses.json` + `coci_minted_singletons.json`, plus joining `coci_minted_memberships.json` for raw local college subject codes (`local_subject_variants` field). Also aggregates TOP code modal + 4-digit category + CTE share + flag. Preserves curator-reviewed/validated entries on re-run; only the data-driven fields refresh. | — |
| `_apply_canonical_subj4.py` | Course | Sync Supabase `_CANON_SUBJ4::*` rows → `discipline_canonical_subj4.json`. Mirrors `_apply_curation.py` pattern; runs in the daily workflow after the main curation sync. Validates 4-letter SUBJ4 before applying. | — |
| `_subj4_dryrun.py` | Course | **Phase 1e measure-first dry-run.** Re-runnable. Reads the curator-confirmed canonical map, classifies every M-ID's fate, reallocates new course_ids deterministically by `(normalized_title, old_id)`, validates **5 gates** (including V4 `new_id_disjoint_from_untouched`, added 2026-05-23 after a 386-row silent-overwrite bug), surfaces curated-collision decision points, counts downstream apply scope, reserves CCN/C-ID sequence numbers + untouched-row suffixes. Writes `kb/subj4_dryrun/{report.md, alias_map.json, blocked.json, collisions.json}`. | — |
| `_subj4_apply.py` | Course | **Phase 1e atomic apply.** Consumes `kb/subj4_dryrun/alias_map.json`. Mutates `coci_minted_courses.json`, `coci_minted_singletons.json`, `coci_minted_memberships.json`, `coci_articulations.json`, `coci_unified_courses.json`, `coci_curation.json` in place; defensive abort on key collision; idempotent. Writes audit receipts to `kb/subj4_apply/{report.md, validation.md, alias_map.json}`. | — |
| `_subj4_apply_supabase.py` | Course | **Phase 1e Supabase row renames.** Pre-fetches the curated `course_id` set (so we only PATCH the ~7 aliases with live rows instead of fanning out 13k network calls — caught 2026-05-23). Best-effort per record with verbose log at `kb/subj4_apply/supabase_log.json`. | — |
| `_seed_top50.py` | Credential | One-shot generator for the Phase 2 hand-curated credential seed. **Do not re-run** — would overwrite human edits. Kept for provenance. | — |
| `_seed_cx_common_courses.py` | Course | One-shot generator for the Phase 2 Cx seed (AI-assisted draft). **Do not re-run** — would overwrite human edits. Kept for provenance. | — |

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
7,203 flags pre-re-mint, target 0 post-re-mint), `cluster_blanks_when_aggregatable`,
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
