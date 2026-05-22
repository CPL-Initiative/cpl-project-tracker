# EACR Vision: Unified Exhibit Identity Layer

**Status**: design / discovery — no implementation yet.
**Owner**: project lead.
**Last updated**: 2026-05-18.

## 1. Problem

The Exhibit Adoption & Credit Recommendations (EACR) table on the CPL
dashboard is driven by MAP's `View_ArticulatedMAPExhibits_APIDataset`.
The shape of that data makes "one exhibit" hard to pin down:

- **Title drift** — Colleges enter exhibit titles freehand. The same
  Industry Certification surfaces under several titles, e.g.
  `Google IT Support Professional Certification`,
  `Google IT Support Professional Certificate`,
  `CMPET 315\tGoogle IT Support Professional Certificate Prep Industry Certificate`.
- **ID fragmentation** — MAP sometimes issues separate ExhibitIDs for
  what is conceptually one exhibit (e.g. one ID per articulated course).
- **Inconsistent TOP codes** — Colleges classify the same certification
  under different TOP codes; some leave it blank.

After the 2026-05-18 refactor, the table groups by
`(Exhibit Title, CPL Type, Collaborative Type)` — see
`_build_statewide_adoption()` in `excel_to_dashboard.py`. That collapsed
3,451 raw ExhibitIDs to 3,274 cards, but it only handles the
ID-fragmentation case. **Title drift is still untreated**, so the same
industry certification can show up under several cards just because
colleges spelled the title differently.

## 2. Vision — synthetic identity layer

Add a synthetic layer above MAP data, generated with AI assistance,
that gives every exhibit:

| Synthetic field | Meaning | Example |
|---|---|---|
| **Unified Title** | Canonical, user-facing name for the credential, normalized across all college-entered variants. | `POST Basic Academy` |
| **Issuing Agency** | The body that issues / awards the credential. | `California Commission on POST` |
| **Training Agency** | The body (often different) that delivers the training, where distinct. | `Allan Hancock Public Safety Academy` |

End-user effect: searching `google it` returns **one** card per
genuinely distinct certification path, not five. Filter dropdowns
become usable. Reports group cleanly by issuing agency.

## 3. Worked examples (the canonicalization should handle these)

| Raw MAP titles | Proposed Unified Title | Issuing Agency | Training Agency |
|---|---|---|---|
| `Peace Officer Standards Training (POST) Basic Academy` · `POST Basic Course` · `POST Academy Modular` · various AJ course-coded titles | **POST Basic Academy** | California Commission on POST | (varies per college academy) |
| `Google IT Support Professional Certification` · `Google IT Support Professional Certificate` · `CMPET 315\tGoogle IT Support Prep…` | **Google IT Support Professional Certificate** | Google / Coursera | (none — self-study) |
| `ICC Fire Inspector 1 Certificate` (one row per articulating course) | **ICC Fire Inspector I** | International Code Council | (issuing agency proctors; college course articulates) |
| `CompTIA A+` (5+ ExhibitIDs across colleges, slight spelling variants) | **CompTIA A+** | CompTIA | (varies) |

## 4. Design decisions (locked in 2026-05-18)

1. **Architecture — cached LLM-driven classification.**
   - First-pass LLM classification produces a `(unified_title,
     issuing_agency, training_agency, confidence)` tuple for each
     distinct raw title.
   - Results are cached as JSON in the KB and committed to the repo.
   - On future runs, raw titles are first looked up in the cache;
     only previously-unseen titles are sent to the LLM.
   - A periodic full re-classification pass (manually triggered)
     catches drift / improves mappings.

2. **Unified-title vocabulary — OPEN list.** The LLM proposes a
   canonical name; humans curate the cache by editing the JSON
   directly. No fixed taxonomy.

3. **Confidence handling — ship everything, label it.** Every
   mapping carries a `confidence` score (0.0–1.0). Low-confidence
   mappings are NOT quarantined; they're surfaced in the dashboard
   with a visible indicator so reviewers can spot and curate them
   in place. No separate pending queue.

4. **KB location — `/kb/` at the repo root.**
   - `excel_to_dashboard.py` (the primary consumer) is at repo root,
     so sibling positioning gives clean relative paths.
   - Discoverable when browsing GitHub; not buried under `.claude/`.
   - Reusable from outside the canonicalization skill.

5. **Skill location — `.claude/skills/exhibit-canonicalization/`.**
   The skill carries decision rules + prompt template; the KB carries
   the data. Two separable artifacts in their natural homes.

## 5. Proposed KB file layout

```
kb/
├── unified_titles.json     # raw_title → unified_title mapping (many-to-one)
├── credentials.json        # (unified_title, issuing_agency) → {training_agency, ...}
├── common_courses.json     # course_id → {common_title, id_system, discipline, ...}  (course-identity layer, §10)
├── course_crosswalk.json   # local college course → course_id (many-to-one)          (course-identity layer, §10)
├── reference/              # read-only authorities (C-ID, CCN, MQ disciplines)        (§10)
│   ├── cid_descriptors.json
│   ├── ccn_courses.json
│   └── mq_disciplines.json
└── README.md               # schema + curation workflow
```

**`unified_titles.json` schema** — top-level object keyed by `raw_title`,
values per entry:
```json
{
  "CMPET 315\tGoogle IT Support Professional Certificate Prep Industry Certificate": {
    "unified_title": "Google IT Support Professional Certificate",
    "confidence_title": 0.92,
    "classified_at": "2026-05-19",
    "classified_by": "claude-opus-4-7",
    "reviewed_at": null,
    "reviewed_by": null,
    "source_exhibit_ids": ["MAPICI-C3IS-1-001"],
    "_notes": null
  }
}
```

**`credentials.json` schema** — keyed on the composite
`(unified_title, issuing_agency)` because the same unified title can be
issued by multiple distinct bodies (e.g. `Fire Inspector I` is certified
by ICC, NFPA, California State Fire Training, and Cal-JAC; each row
needs its own training-agency, confidence, and notes). To preserve a
clean two-level browse and to handle the `issuing_agency = null` case
naturally, the JSON nests issuer records *under* the unified title:

```json
{
  "Google IT Support Professional Certificate": [
    {
      "issuing_agency": "Google",
      "training_agency": "Coursera",
      "confidence_issuer": 0.95,
      "confidence_trainer": 0.90,
      "classified_at": "2026-05-19",
      "classified_by": "claude-opus-4-7",
      "reviewed_at": null,
      "reviewed_by": null,
      "_notes": "Self-study Coursera professional certificate."
    }
  ],
  "Fire Inspector I": [
    {
      "issuing_agency": "International Code Council (ICC)",
      "training_agency": null,
      "confidence_issuer": 0.95,
      "confidence_trainer": 1.0,
      "classified_at": "2026-05-19",
      "classified_by": "claude-opus-4-7",
      "reviewed_at": null,
      "reviewed_by": null,
      "_notes": "ICC's Fire Inspector I exam covers NFPA 1031 Level I."
    },
    {
      "issuing_agency": "National Fire Protection Association (NFPA)",
      "training_agency": null,
      "confidence_issuer": 0.95,
      "confidence_trainer": 1.0,
      "classified_at": "2026-05-19",
      "classified_by": "claude-opus-4-7",
      "reviewed_at": null,
      "reviewed_by": null,
      "_notes": "NFPA-issued ProBoard-accredited Fire Inspector I."
    }
  ],
  "Generic Credit by Exam — Saddleback College": [
    {
      "issuing_agency": null,
      "training_agency": null,
      "confidence_issuer": 0.55,
      "confidence_trainer": 0.55,
      "classified_at": "2026-05-19",
      "classified_by": "claude-opus-4-7",
      "reviewed_at": null,
      "reviewed_by": null,
      "_notes": "Administrative bucket used by Saddleback to register multiple CBE awards under one MAP ExhibitID; not a single credential."
    }
  ]
}
```

Lookup semantics:
- Pipeline reads `unified_titles.json[raw_title].unified_title` to get
  the canonical name.
- Pipeline then reads `credentials.json[unified_title]` and matches the
  appropriate issuer record (if multiple, by inspecting Articulation
  College or other row context; default to the highest-confidence
  record if no signal).
- The EACR grouping key becomes
  `(unified_title, issuing_agency, CPL Type, Collaborative Type)` once
  issuer-level grouping ships — that lets ICC vs NFPA Fire Inspector I
  appear as separate cards even though they share a unified title.

Two files, not one, because:
- Issuing/training agencies are properties of the *credential* (one
  per `(unified_title, issuing_agency)` tuple), not the *raw entry*.
  Splitting avoids duplicating agency data across every raw-title
  variant.
- Re-classifying titles vs. re-classifying agencies become
  independent operations.

## 6. Remaining open questions

1. **Surfacing in the UI.** Once unified titles exist, the EACR
   grouping key changes from `(Exhibit Title, CPL Type,
   Collaborative Type)` to `(Unified Title, Issuing Agency, CPL Type,
   Collaborative Type)`. The issuer is part of the key so that, e.g.,
   ICC-issued Fire Inspector I and NFPA-issued Fire Inspector I render
   as separate, issuer-badged cards even though they share a unified
   title. Raw titles can be shown beneath each card (an "also entered
   as…" line) so colleges recognize their own data. Low-confidence
   rows get a visual marker.

2. **Confidence threshold for visual marking.** What threshold
   warrants a "needs review" pill in the UI? Suggest 0.75 as a
   starting point.

3. **Backwards compatibility with the Career Cluster filter.**
   Issuing-agency synthesis may suggest cleaner sector mappings than
   the TOP-derived one currently in `TOP_Code_Lookup.xlsx`. Decide
   whether to keep TOP-based clustering, agency-based clustering, or
   a blend.

## 7. Suggested implementation phases

| Phase | Output | Approx. effort |
|---|---|---|
| 1. Skill + prompt | `.claude/skills/exhibit-canonicalization/` with decision rules and prompt template. Dry-run on a 50-row sample drawn from the live data. | 1 session |
| 2. KB seed | `kb/unified_titles.json` + `kb/credentials.json` + `kb/README.md`. Hand-curate top-50 mappings as a quality anchor. | 1 session |
| 3. Full first-pass classification | Classify every distinct raw title (~5k–10k entries) via the skill, write to KB. | 1 session |
| 4. Pipeline integration | `excel_to_dashboard.py` consults `kb/unified_titles.json` when grouping; EACR groups by unified title. New unseen titles get classified on the fly. | 1 session |
| 5. UI updates | EACR card shows unified title, raw titles in a disclosure, confidence badge for low-confidence rows; new filters for issuing agency. | 1 session |
| 6. Quality loop | Periodic re-classification trigger; reviewer workflow for editing the KB JSONs. | ongoing |

## 8. What's done already (2026-05-18, branch `claude/refine-eacr-table-jIDKn`)

- EACR grouping moved from raw ExhibitID to `(Title, CPL Type,
  Collaborative Type)`. 3,451 → 3,274 cards.
- Added `CCC SW Sector` column to `TOP_Code_Lookup.xlsx` and a
  "Career Cluster" filter alongside the existing TOP Code Category
  filter.
- "MAP Exhibits" headline KPI now uses the grouped count so it matches
  the EACR card.

This work is the foundation; the unified-title layer described above
is the next step.

## 9. Schema fix (2026-05-19) — composite credential key

`credentials.json` is keyed on the composite `(unified_title,
issuing_agency)`, not `unified_title` alone. The same unified title can
roll up across multiple issuers (Fire Inspector I is certified by ICC,
NFPA, California State Fire Training, and Cal-JAC; EMT by multiple state
EMS authorities). Each issuer needs its own training-agency, confidence,
and notes. See §5 for the nested layout. The EACR grouping key gains
Issuing Agency accordingly (see §6.1).

## 10. Second synthetic layer — common-course crosswalk (CCN-ID / C-ID / M-ID)

The unified-title layer canonicalizes *credentials*. A parallel layer
canonicalizes *courses*, because the deeper bottleneck to systemic
adoption is that **one college's course does not match another's**:
`(discipline code + number + title + units)` differs college to
college, and only ~11% of CCC courses carry a C-ID (most carry no
Common Course Number either). So an articulation one college earns
cannot propagate to the many colleges teaching the same course.

**Identifier precedence — CCN-ID > C-ID > M-ID.** Each common course
gets the best available identifier (`id_system` records which):

1. **CCN-ID** — an AB 1111 Common Course Number (e.g. `ANTH C1000`); the
   statewide, student-facing common-course identity, so it wins. Format:
   4-letter subject + `C` + 4-digit number, optional `H`/`E`/`L`
   designators (see `reference/` notes). Authority:
   `kb/reference/ccn_courses.json` (58 courses so far — Phase II rollout).
2. **C-ID** — a Course Identification Numbering System descriptor
   (e.g. `ACCT 110`). Authority: `kb/reference/cid_descriptors.json` (495).
3. **M-ID** ("MAP-ID") — a synthetic, MAP-originated descriptor in
   CCN-shaped 4-character form: corroborated (≥2 colleges) gets
   `SUBJ M####` all-digit (band digit + 3-digit sequence, e.g.
   `AUTO M1001`); stand-alone (1 college) gets `SUBJ M####` where the
   trailing 2 chars are letters (e.g. `AUTO M10AA`). The leading `M`
   sits where CCN puts `C`, so the key is unmistakably ours and is
   never confused with an official CCN/C-ID. Minted **only** when no
   CCN or C-ID aligns. It is the fallback crosswalk key that makes
   articulations systemically adoptable from one college to many. When
   a course later earns a CCN or C-ID, re-key it and set `id_system`.
   (Re-mint 2026-05-22, PR #84; the prior `M-ID SUBJ NNN` format is
   dead — `kb/remint_out/alias_map.json` carries the old→new alias.)

**Discipline vocabulary** comes from the official CCC Minimum
Qualifications Disciplines List (`kb/reference/mq_disciplines.json`, 19th
Ed.). The catalog's `discipline` field uses MQ titles; the pre-MQ label is
kept as `discipline_provisional`. Where no exact MQ discipline exists
(e.g. Accounting → Business; Human Services → Counseling — there is no MQ
"Human Services" or "Human Resources" discipline), the nearest is used and
flagged in `_notes`.

**KB files (see §5 layout):**
- `common_courses.json` — catalog: `course_id` (CCN-ID/C-ID/M-ID) →
  `{common_title, description, description_source, id_system, ccn_id, c_id,
  cross_listing_group, subject, discipline, discipline_provisional,
  typical_units, confidence, source_college_count, …}`. `description` is
  the consolidated course description (authoritative C-ID text where
  matched; cross-listed mirrors inherit a sibling's; synthetic M-ID
  descriptions deferred to Phase 3). `cross_listing_group` (`"XL-NNNN"` or null)
  links the discipline mirrors of a **cross-listed** course (same course
  under two subjects, e.g. `ARCH 50` / `DR 50`) so an articulation to one
  mirror applies to the whole group.
- `course_crosswalk.json` — mapping: local college course → `course_id`
  (many-to-one), keyed by `"<college> :: <course_code> :: <local_title>"`.
- `reference/` — read-only authorities: `cid_descriptors.json`,
  `ccn_courses.json`, `mq_disciplines.json`.

Same two-file split rationale as the credential layer: course-identity
metadata lives once per `course_id`, not duplicated across every local
course that shares it.

**Seeded first from Cx (Credit-by-Exam) exhibits** (2026-05-19). "Cx" is
used in preference to "CBE" to avoid collision with Competency-Based
Education. The Cx generic buckets (`Credit By Exam at <College>`) are the
clearest motivation: today they collapse to one opaque EACR card, but
each underlying course (e.g. `CHIL 291A Child Development Center
Practicum`) is a real, articulable course. The Phase 2 seed crosswalks
all 296 local courses behind the Cx exhibits into 243 common courses
(21 matched to a C-ID, 0 to a CCN, 222 minted as M-ID), with cross-college
corroboration (Child Development Center Practicum spans 12 local courses
across 3 colleges; the world-language sequences; Medical Terminology →
C-ID HIT 103 X; Financial/Managerial Accounting → ACCT 110/120). The seed
is an AI-assisted draft for human review — exact C-ID matches and
cross-college clusters get high confidence; fuzzy matches and
single-college long-tail entries are flagged in `_notes`.

**Forward direction:** once reviewed, the EACR table can explode a Cx
bucket into its constituent common courses instead of a single
"Generic Credit by Exam" card, and — more broadly — the `course_id`
becomes the join key that lets an articulation earned at one college
surface as a candidate articulation at every college teaching the same
common course.
Pipeline integration and UI work are deferred to later phases (this seed
is the dataset only; `excel_to_dashboard.py` does not yet consult these
files).
