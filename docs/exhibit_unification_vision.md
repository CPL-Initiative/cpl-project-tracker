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

## 4. Open design questions

1. **Deterministic vs. LLM-driven mapping.** Pure LLM-per-row is
   expensive and non-reproducible. A reasonable architecture:
   - First-pass LLM classification produces a `(unified_title,
     issuing_agency, training_agency, confidence)` tuple for each
     distinct raw title.
   - Results are cached to a JSON/Excel reference file (the "CPL KB")
     and committed to the repo.
   - On future runs, raw titles are first looked up in the cache;
     only previously-unseen titles are sent to the LLM.
   - A periodic full re-classification pass (manually triggered)
     catches drift / improves mappings.

2. **Skill / prompt design.** A dedicated skill should codify:
   - The vocabulary of unified titles (closed list? open with
     review?).
   - Decision rules for borderline cases (e.g. `POST Basic Academy`
     vs `POST Modular Academy` — same or different unified title?).
   - Conventions for issuing-agency canonical names (`CompTIA` vs
     `Computing Technology Industry Association`).
   - When to refuse / mark as `Needs review`.

3. **Review workflow.** Low-confidence mappings should land in a
   human-review bucket before they go live. Options: a separate
   `pending_unified_titles.csv` checked into the repo, or an in-app
   review tool.

4. **KB location.** The unified-title cache + agency lookups belong
   somewhere all future Claude sessions can find them. Candidates:
   - A new `kb/` folder at repo root (JSON files, one per entity type).
   - A skill at `.claude/skills/exhibit-canonicalization/`.
   - Both: the skill carries the decision rules, the `kb/` folder
     carries the data.

5. **Surfacing in the UI.** Once unified titles exist, the EACR
   grouping key changes from `(Exhibit Title, CPL Type,
   Collaborative Type)` to `(Unified Title, CPL Type,
   Collaborative Type)`. Raw titles can still be shown beneath
   the unified title (an "also entered as…" line) so colleges can
   recognize their own data.

6. **Backwards compatibility with the Career Cluster filter.**
   Issuing-agency synthesis may suggest cleaner sector mappings
   than the TOP-derived one currently in `TOP_Code_Lookup.xlsx`.

## 5. Suggested implementation phases

| Phase | Output | Approx. effort |
|---|---|---|
| 1. Skill + prompt | `.claude/skills/exhibit-canonicalization/` with decision rules and prompt template. Dry-run on a 50-row sample. | 1 session |
| 2. Cache schema | `kb/unified_exhibit_titles.json` (raw_title → unified_title, issuing_agency, training_agency, confidence, last_reviewed). Manual seed for top-50. | 1 session |
| 3. Pipeline integration | `excel_to_dashboard.py` consults the cache when grouping. New cache entries flagged for review. | 1 session |
| 4. UI updates | EACR card shows unified title with raw-title disclosure; new filters for issuing agency. | 1 session |
| 5. Quality loop | Periodic re-classification, low-confidence triage UI. | ongoing |

## 6. What's done already (2026-05-18, branch `claude/refine-eacr-table-jIDKn`)

- EACR grouping moved from raw ExhibitID to `(Title, CPL Type,
  Collaborative Type)`. 3,451 → 3,274 cards.
- Added `CCC SW Sector` column to `TOP_Code_Lookup.xlsx` and a
  "Career Cluster" filter alongside the existing TOP Code Category
  filter.
- "MAP Exhibits" headline KPI now uses the grouped count so it matches
  the EACR card.

This work is the foundation; the unified-title layer described above
is the next step.
