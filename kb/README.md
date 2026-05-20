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
3. **M-ID** — a synthetic **MAP-originated** descriptor that mimics the
   C-ID shape (`SUBJ NNN`) but carries the literal `M-ID` prefix so it is
   never mistaken for an official C-ID (e.g. `M-ID AUTO 100`). Minted
   **only** when no CCN or C-ID aligns.

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
    "_notes": "Optional. Mandatory when confidence_title < 0.85."
  }
}
```

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
  "M-ID AUTO 100": {
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
    "course_id": "M-ID ECE 100",
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
  `course_crosswalk.json` (e.g. `ARCH 50 → M-ID ARCH 104`,
  `DR 50 → M-ID DRFT 108`).
- Both catalog entries carry the same `cross_listing_group`, so the
  pipeline can union them — an articulation earned on one mirror applies
  to the whole group.
- A mirror can be a C-ID/CCN on one side and an M-ID on the other (e.g.
  Introduction to Photojournalism: `JOUR 160` (C-ID, Journalism) ↔
  `M-ID PHOT 106` (Photography), group `XL-0002`).

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
