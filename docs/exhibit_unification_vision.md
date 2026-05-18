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
├── credentials.json        # unified_title → {issuing_agency, training_agency, ...}
└── README.md               # schema + curation workflow
```

**`unified_titles.json` schema** (per entry):
```json
{
  "raw_title": "CMPET 315\tGoogle IT Support Professional Certificate Prep Industry Certificate",
  "unified_title": "Google IT Support Professional Certificate",
  "confidence": 0.92,
  "classified_at": "2026-05-19",
  "classified_by": "claude-opus-4-7",
  "reviewed_at": null,
  "reviewed_by": null,
  "source_exhibit_ids": ["MAPICI-C3IS-1-001"]
}
```

**`credentials.json` schema** (keyed by `unified_title`):
```json
{
  "Google IT Support Professional Certificate": {
    "issuing_agency": "Google / Coursera",
    "training_agency": null,
    "confidence_issuer": 0.95,
    "confidence_trainer": 1.0,
    "classified_at": "2026-05-19",
    "reviewed_at": null,
    "notes": "Self-study certificate; no training agency."
  }
}
```

Two files, not one, because:
- Issuing/training agencies are properties of the *credential* (one
  per unified title), not the *raw entry*. Splitting avoids
  duplicating agency data across every raw-title variant.
- Re-classifying titles vs. re-classifying agencies become
  independent operations.

## 6. Remaining open questions

1. **Surfacing in the UI.** Once unified titles exist, the EACR
   grouping key changes from `(Exhibit Title, CPL Type,
   Collaborative Type)` to `(Unified Title, CPL Type,
   Collaborative Type)`. Raw titles can be shown beneath the unified
   title (an "also entered as…" line) so colleges recognize their
   own data. Low-confidence rows get a visual marker.

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
