---
title: Methodology — Triaging credential-dedup candidates (merge vs leave-split)
created: 2026-06-09
updated: 2026-06-09
tags: [methodology, exhibit-canonicalization, credential-identity, cer, kb]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-cer-credential-merge]]"
  - "[[docs/eacr_consolidation_lessons]]"
artifacts:
  - kb/_detect_cpl_type_dupes.py
  - kb/credential_merges.json
---

# Methodology — Triaging credential-dedup candidates (merge vs leave-split)

> **One-sentence summary** — when `_detect_cpl_type_dupes.py` Signal B surfaces two
> CER credentials that share a `(course_id, local course)`, most are NOT duplicates;
> merge only true same-credential phrasing variants, and decide by **scope of
> competency**, never by title similarity.

## Context

`playbook-cer-credential-merge.md` covers the *mechanism* (`_merge_credentials.py`,
the V-gates, the live-on-merge regen). It explicitly defers the *merge-vs-skip
judgment* to "the exhibit-canonicalization skill." This note is that judgment — the
triage taxonomy, validated against all 162 Signal-B leads in Session 37 (PR #323),
where only **21 (~13%)** were real merges.

## The claim

A Signal-B pair (same `course_id` + same local course, different `unified_title`,
title Jaccard ≥ 0.5, level-safe) is mostly a **false positive**. Bucket it before
touching `credential_merges.json`:

### False positive A — elective-bucket coincidence (suppress, never merge)
Two genuinely-different exams both articulate to ONE generic dumping-ground course
(e.g. Clovis's `COMM M1038` → 60+ credentials, ~100% "Elective Course Credits").
They collide on the key without being the same exhibit. **~62 of 162.** The detector
now suppresses these automatically (the elective-bucket gate, #324 — mirrors the CER
producer's R1 rule: ≥0.8-elective recs AND ≥5 credentials AND ≤3 colleges).

### False positive B — distinct credentials sharing a real course (leave split)
Different credentials legitimately articulate to the same local course. The deciding
line is **scope of competency** (skill Rule 4), NOT how similar the titles look:
- different **ratings/parts**: FAA Airframe ≠ Powerplant ≠ A&P combined
- different **processes/standards** (preserve issuer codes, Rule 8b): AWS SMAW ≠ FCAW
  ≠ GMAW; D1.1 ≠ D1.5 ≠ D9.1
- different **exams**: AP Calculus AB ≠ BC; AP Language ≠ Literature; IB subject X ≠ Y
- different **levels**: WSET Level 2 ≠ 3 ≠ 4; apprenticeship Year 4 ≠ Year 5
- different **sources**: per-high-school articulations of one college course are
  distinct entries, not one credential
- **code-vs-no-code** (Rule 8b): "ASE A8 — Engine Performance" ≠ bare "Engine
  Performance" — keep split (the bare one may be a local course, not the cert)

### True merge — same credential, different phrasing (the ~13%)
Merge when the two titles are the **same competency** differing only in wording:
- **orthographic**: "Drivetrain" vs "Drive Train"; "Correctional" vs "Corrections"
- **issuer prefix / mechanism / course-id / provider suffix** (strip per Rule 1):
  "SFT Fire Inspector 1A" → "Fire Inspector 1A"; "… Industry Certification";
  "… (Administration of Justice 3)"; "PLTW IED — Baldy View ROP"
- **official-name vs short-name**: "Fire and Emergency Services Instructor 1" (NFPA
  1041) → "Fire Instructor 1"; the SFT module subtitle (1A = "Duties and
  Administration") → bare code
- **synonym terms of art**: AWS "{code} {process} Certification" vs "Qualified
  Welder" — same issuer (AWS), code, process, and credit rec

## How we got here

Session 37 worked all 162 Signal-B leads. The decisive validation step was a small
read-only probe printing each candidate's `issuing_agency` (from `credentials.json`)
and a sample `credit_recommendation` (from `coci_articulations.json`): identical
issuer **and** credit rec confirmed the 7 AWS and the CDCR/FAA merges; the elective
buckets and distinct-rating pairs failed it. Then the merge ran via the V1–V4 tool;
the residual queue dropped 162 → 77 once the elective-bucket gate landed.

## When this applies (and when it doesn't)

- **Applies** to any CER credential-dedup pass (Signal B), and to the
  `exhibit-canonicalization` skill's classify-time decisions.
- **Does NOT** decide course-IDENTITY merges (M-ID/Cluster) — that's the CCR
  Suggested-merges worklist + the ordinal rule
  (`methodology-within-credential-identity-consolidation.md`).
- **Caveat:** a pair sharing only an elective bucket is suppressed, but a pair
  sharing a bucket AND a real course is kept and judged on the real course.

## See also

- `[[docs/kb-notes/playbook-cer-credential-merge]]` — the merge mechanism (the sibling)
- `[[docs/eacr_consolidation_lessons]]` — Session 37 section
- PRs `#323` (the 21 merges) / `#324` (the detector elective-bucket gate)
- `.claude/skills/exhibit-canonicalization` — Rules 1, 4, 8b

---

*Authoring check: durable (the Signal-B class is worked down over many sessions),
reusable (any CER curator / peer college), distilled (one concept: the merge-vs-split
triage line is scope-of-competency), self-contained.*
