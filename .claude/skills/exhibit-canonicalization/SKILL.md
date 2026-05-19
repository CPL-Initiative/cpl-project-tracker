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
- `Microsoft Office Specialist — Excel` vs `Microsoft Office Specialist — Excel Expert` — separate exams at different levels, keep split.

**Same credential issued by different bodies → unify, let the issuer field discriminate.**
Fire Inspector I is certified by ICC, NFPA, California State Fire Training (SFT),
and Cal-JAC. All four cover the same competency (NFPA 1031 Level I inspector).
Unified title for all of them: `Fire Inspector I`. The `issuing_agency` field is
the discriminator — the UI can badge each row with its issuer and let viewers
filter on it. Apply the same logic to EMT certification (issued by multiple
state EMS authorities), OSHA Outreach trainers, etc.

The line between "different issuer / same credential" (unify) and "different
issuer / different credential" (split) is the **scope of competency**, not the
issuer. POST vs CDCR is a split because peace officer ≠ correctional officer
— different jobs. ICC vs NFPA Fire Inspector I is a unify because both certify
the same inspector role.

### Rule 5 — Generic-bucket titles need a separate marker

Titles like `Credit By Exam at Mesa`, `Credit By Exam at Saddleback College`, `Credit By Exam San Diego City College` are NOT credentials — they're administrative buckets a college uses to register multiple unrelated CBE awards. Set:

- `unified_title = "Generic Credit by Exam — <College Name>"` (so they stay separately addressable per college, but flagged as administrative buckets, not real credentials).
- `confidence_title ≤ 0.6` to invite human review.
- Note in `_notes` that this is a generic bucket, not a specific credential.

### Rule 5b — Prerequisite-language titles refer to the cert they describe

Some colleges enter exhibits with titles like `Current EMT Certification or
Paramedic License` or `Current NREMT certification or State of California EMT
license AND current American Heart Association BLS`. These read as prerequisite
descriptions, but they're **referring to actual credentials**. Cluster them
with the corresponding cert's unified title (e.g., `EMT Certification`),
**not** a separate "prerequisite" bucket. Use a `_notes` entry to capture
that the source title used prerequisite phrasing. Confidence should be
0.65–0.80 to flag for review, but the mapping itself unifies with the cert.

The same applies to course-section titles like `EMT 1 Module A and B` — if
the credential being referenced is identifiable, cluster with that cert.

### Rule 6 — Issuing agency uses the longer recognizable canonical name

Use the **longer, full canonical name with the common abbreviation in
parentheses** so the field is unambiguous on its own and reads well in tables
and reports. Examples:

- `Amazon Web Services (AWS)` — not just `AWS`
- `Computing Technology Industry Association (CompTIA)` — only if the short
  brand `CompTIA` is genuinely common; CompTIA is well-known enough alone, so
  `CompTIA` is acceptable. When in doubt, use the longer form.
- `California Commission on Peace Officer Standards and Training (POST)`
- `International Code Council (ICC)`
- `National Fire Protection Association (NFPA)`
- `California State Fire Training (SFT)`
- `California Joint Apprenticeship Committee (Cal-JAC)`
- `National Institute for Automotive Service Excellence (ASE)`
- `International Brotherhood of Electrical Workers (IBEW)`
- `California Emergency Medical Services Authority (EMSA)`
- `California Department of Public Health (CDPH)`
- `Council for Professional Recognition` (for CDA credential)
- `U.S. Occupational Safety and Health Administration (OSHA)`
- `College Board` — short, no abbreviation
- `Google` — vendor name; `training_agency = "Coursera"` when distinct
- `Cisco` — vendor name
- `American Council on Education (ACE)` — for JST military credit recommendations

For credentials issued by a CCC college locally, set `issuing_agency = null` and explain in `_notes`.

### Rule 7 — Training agency only if distinct

Most credentials have an issuer but no separate training agency. Set
`training_agency = null` for those. Use it only when the training is delivered
by a clearly different entity:

- POST Basic Academy: issuer = California Commission on POST;
  `training_agency = "varies by academy"` (canonical sentinel string — the
  pipeline treats it as a non-null marker that means
  "different per articulating college"). When a specific academy is in
  the raw title, use the specific name instead (e.g.,
  `San Mateo County Community College District Police Academy`).
- IBEW apprenticeship: issuer = IBEW;
  training_agency = `Joint Apprenticeship Training Committee (JATC)`
  when applicable.
- JST military credit: issuer = ACE; training_agency = `U.S. Armed Forces`
  or the specific branch when known.

The canonical sentinel `varies by academy` is intentionally lowercase and
without brackets — it's a real string value, not a placeholder. The pipeline
keys on it to render a special "Multiple training providers" badge in the UI.

### Rule 8 — Confidence scoring

| Score | When to assign |
|---|---|
| **0.95–1.00** | Title clearly matches a well-known credential (POST Basic Academy, AP Biology, CompTIA A+) with no ambiguity. |
| **0.80–0.94** | Title matches a known credential but has some noise/wording to interpret. |
| **0.60–0.79** | Educated guess: title is unusual, abbreviated, or has multiple plausible canonical names. |
| **0.40–0.59** | Generic bucket (see Rule 5), or title gives only weak signal about what credential is meant. |
| **< 0.40** | Title is uninterpretable from text alone; needs human input or external context. Still ship the row — confidence flags it for review. |

Confidence is per-field. A title can be high-confidence (`POST Basic Academy`, 0.98) while its training agency is low-confidence (`varies by academy`, 0.6).

### Rule 8b — Preserve issuer-assigned numeric codes when present

Some issuers assign numeric codes that are part of the credential's
identity (OSHA Outreach codes like `030`, `035`; ASE subtest codes like
`A1`, `A2`, `A5`, `L3`). **Preserve those codes in the unified title**,
even when two raw titles describe the same underlying curriculum under
different codes. The codes carry meaning to industry consumers (the
30-hour General Industry course is a different curriculum from the
30-hour Construction course) and the credential the worker actually
holds carries the code.

Examples:

- `OSHA 030 - Federal OSHA Outreach: Construction Industry Safety` →
  unified_title `OSHA 030 — Construction Industry Outreach (30-hour)`
- `OSHA 035 - Federal OSHA Outreach: General Industry Safety` →
  unified_title `OSHA 035 — General Industry Outreach (30-hour)`
- `OSHA Outreach for General Industry-30 hour` →
  unified_title `OSHA 30 — General Industry` (no source code, fall
  back to hour-count form)
- `ASE CERTIFICATION (A2) A2 – AUTOMATIC TRANSMISSION/TRANSAXLE` →
  unified_title `ASE A2 — Automatic Transmission/Transaxle`

If two raw titles describe the same curriculum but one has a code and
one doesn't, keep them as **separate unified titles** — they may
genuinely differ (one might be the official Outreach version, the
other a local equivalent).

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
