---
name: exhibit-canonicalization
description: Use when canonicalizing CPL exhibit titles in this repo — collapsing freehand college-entered titles in MAP `View_ArticulatedMAPExhibits` data into unified credential names, identifying the issuing agency and (when distinct) the training agency. Trigger phrases include "canonicalize exhibit titles", "build unified-title mapping", "classify exhibits", and any task that updates `kb/unified_titles.json` or `kb/credentials.json`. Background context lives in `docs/exhibit_unification_vision.md`.
---

# Exhibit Canonicalization

You assign three synthetic identity fields to each raw MAP exhibit title:

| Field | What it is | Example for `MUSG 101 Music Appreciation - Portfolio Review` |
|---|---|---|
| **unified_title** | The canonical, user-facing name of the credential or experience itself, stripped of college-specific course codes, formatting noise, and CPL-mechanism phrasing | `Music Appreciation` |
| **issuing_agency** | The body that issues, awards, or governs the credential | `(none — local college exhibit)` |
| **training_agency** | The body that delivers the training, when distinct from the issuer | `(none — college course)` |

Each field gets a **confidence score** between 0.0 and 1.0.

## Decision rules

These rules resolve the cases that come up most often in CCC MAP data. When in doubt, prefer **fewer** unified titles (collapse aggressively) over splitting hairs — but never collapse across the lines drawn below.

### Rule 1 — Strip the noise

From every raw title, mentally remove:

- College course prefixes and numbers (`CMPET 315`, `(CIS) 140`, `MUSG 101`, `BIOL 109L`)
- CPL-mechanism phrasing (`Credit by Exam`, `Portfolio Review`, `Industry Certification`, `Prep`, `Certificate Prep`) — the CPL Type column already carries this
- Articulation-area suffixes (`Cal-GETC Area 2`, `(score 3-5)`, `BIOL 109 and BIOL 109L`)
- Score qualifiers and version notes (`score 3-5`, `prior Fall 2025`, `effective FALL 2025`, `Version 2`)
- Whitespace/punctuation noise (stray tabs, double spaces, trailing punctuation)
- College-name suffixes when the body of the title is generic (`Credit By Exam at Saddleback College` — the credential is generic CBE, not Saddleback-specific)

What remains is the **credential itself**. That's the seed for the unified title.

### Rule 2 — Don't split mechanism variants

The CPL Type column is a separate axis. Do NOT make the unified title carry the mechanism. Same credential delivered as `Industry Certification` and `Portfolio Review` (e.g., the Norco IBEW case) gets the **same unified title** — the EACR grouping key still includes CPL Type, so the two pathways will appear as separate cards anyway, but they'll share an identity.

### Rule 3 — Don't split version/cohort variants

`POST Academy prior Fall 2025` and `POST Academy effective FALL 2025` are the same credential at two points in time. One unified title: `POST Basic Academy`. Same logic for `CompTIA A+ Core 1` vs `CompTIA A+ Core 2` — both are subtests of CompTIA A+ certification. Unify under `CompTIA A+`.

### Rule 4 — DO split when the credential is genuinely different

These look similar but are distinct credentials. Keep them separate:

- `CompTIA A+` vs `CompTIA Network+` vs `CompTIA Security+` — different certs from the same vendor.
- `POST Basic Academy` (peace officer) vs `CDCR/CPOST` (corrections officer) — different agencies, different roles.
- `AP Biology` vs `AP Chemistry` — different subject exams.
- `RN License` vs `LVN License` vs `CNA Certification` — different scopes of practice.

### Rule 5 — Generic-bucket titles need a separate marker

Titles like `Credit By Exam at Mesa`, `Credit By Exam at Saddleback College`, `Credit By Exam San Diego City College` are NOT credentials — they're administrative buckets a college uses to register multiple unrelated CBE awards. Set:

- `unified_title = "Generic Credit by Exam — <College Name>"` (so they stay separately addressable per college, but flagged as administrative buckets, not real credentials).
- `confidence_title ≤ 0.6` to invite human review.
- Note in `_notes` that this is a generic bucket, not a specific credential.

### Rule 6 — Issuing agency is canonical, not as-written

Use the short, recognizable canonical name of the issuing body. Examples:

- `CompTIA` (not `Computing Technology Industry Association`)
- `California Commission on POST` (not `POST` alone — there's a federal POST too)
- `Google` (for vendor certs delivered via Coursera; `training_agency = "Coursera"` is acceptable when distinct)
- `International Code Council (ICC)`
- `College Board` (for AP exams)
- `Cisco`
- `American Welding Society (AWS)` (for welding industry certs)
- `American Council on Education (ACE)` — for JST military credit recommendations
- For credentials issued by a CCC college locally, set `issuing_agency = null` and explain in `_notes`.

### Rule 7 — Training agency only if distinct

Most credentials have an issuer but no separate training agency. Set `training_agency = null` for those. Use it only when the training is delivered by a clearly different entity:

- POST Basic Academy: issuer = Cal POST; training_agency = the specific academy (e.g., `Allan Hancock Public Safety Academy`). When the academy varies per row, set `training_agency = "<varies by academy>"`.
- IBEW apprenticeship: issuer = IBEW; training_agency = `Joint Apprenticeship Training Committee (JATC)` when applicable.
- JST military credit: issuer = ACE; training_agency = `U.S. Armed Forces` or the specific branch when known.

### Rule 8 — Confidence scoring

| Score | When to assign |
|---|---|
| **0.95–1.00** | Title clearly matches a well-known credential (POST Basic Academy, AP Biology, CompTIA A+) with no ambiguity. |
| **0.80–0.94** | Title matches a known credential but has some noise/wording to interpret. |
| **0.60–0.79** | Educated guess: title is unusual, abbreviated, or has multiple plausible canonical names. |
| **0.40–0.59** | Generic bucket (see Rule 5), or title gives only weak signal about what credential is meant. |
| **< 0.40** | Title is uninterpretable from text alone; needs human input or external context. Still ship the row — confidence flags it for review. |

Confidence is per-field. A title can be high-confidence (`POST Basic Academy`, 0.98) while its training agency is low-confidence (`varies by academy`, 0.6).

### Rule 9 — Never refuse, always classify

Every raw title gets a mapping with a confidence score. Low confidence is the signal to reviewers — there is no "skip" or "needs review" status. If you have only weak signal, ship your best guess at low confidence and explain your reasoning in `_notes`.

## Output schema (one record per raw title)

```json
{
  "raw_title": "<exact string from MAP>",
  "unified_title": "<canonical name>",
  "issuing_agency": "<canonical name or null>",
  "training_agency": "<canonical name or null>",
  "confidence_title": 0.0,
  "confidence_issuer": 0.0,
  "confidence_trainer": 0.0,
  "_notes": "<one short sentence explaining any judgment call>"
}
```

The `_notes` field is mandatory whenever any confidence < 0.85, optional otherwise.

## When invoking the prompt

Pass the raw titles in batches (50–200 per call works well). Include for each row:
- `raw_title` (string)
- `cpl_types` (list — informs whether mechanism phrasing is OK to strip)
- `articulating_colleges_sample` (≤3 names — disambiguates generic buckets and helps with training-agency inference)

Cache results in `kb/unified_titles.json` (keyed by `raw_title`). Issuer/trainer details for each distinct `unified_title` go into `kb/credentials.json` (keyed by `unified_title`).

## What this skill does NOT do

- It does not change how the EACR table is grouped — that's the pipeline's job, reading the KB output of this skill.
- It does not write to the KB on its own — Phase 1 dry-runs return tables for human review; Phase 2+ does the writes under separate task control.
- It does not modify TOP code or Career Cluster classifications.
