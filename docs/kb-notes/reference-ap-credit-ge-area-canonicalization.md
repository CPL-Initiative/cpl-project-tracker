---
title: Reference — AP credit is a GE-Area mapping (the canonical anchor for AP/standardized-exam credentials)
created: 2026-06-04
updated: 2026-06-04
tags: [reference, cer, canonicalization, ap-credit, ge-area, policy, exhibit-canonicalization]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/eacr_consolidation_lessons]]"
  - "[[docs/kb-notes/playbook-cer-credential-merge]]"
artifacts:
  - kb/reference/ccc_ge_exam_credit.json
  - docs/reference/ccc_ib_clep_ap_exam_charts_ESLEI24-35_2024-06-25.pdf
  - docs/reference/ccc_ap_credit_policy_AA17-20_2017.docx
  - docs/reference/ccc_ge_ap_policy_faqs_AA17-33_2017.docx
  - docs/reference/ccr_title5_awarding_credit_ap_external_exams_45day_2026-01-12.pdf
  - excel_to_dashboard.py (export_credential_reference → ge_credit)
  - credential_reference.js (renderGeApCredit)
---

> **Scope update (2026-06-04):** extended from AP-only to **AP + IB + CLEP**,
> now sourced from the current annual chart **ESLEI 24-35** (2024-06-25;
> IB App. B / CLEP App. C / AP App. D). The single dataset is
> `kb/reference/ccc_ge_exam_credit.json` (`programs: {AP, IB, CLEP}`); the baked
> field is `ge_credit` (was `ge_ap`). **147 of 154** exam credentials join
> (AP 62 · IB 44 · CLEP 41). The 2024 AP chart also corrected a few 2017 values
> — e.g. **Computer Science Principles** N/A → Language & Rationality; **English
> Literature & Composition** → 6 units across *both* L&R **and** Arts & Humanities
> (`areas_all`); **PreCalculus** now mapped; "Humanities" → "Arts and Humanities".

# AP credit is a GE-Area mapping, not a course-identity fold

**The single most important framing for canonicalizing AP / standardized-exam
credentials in the CER:** for an external standardized exam (AP, and — per the
2026 rulemaking — CLEP/IB/etc.), the **authoritative, system-level meaning** of
the credential is the **General Education Area (+ minimum units)** it satisfies,
**not** a specific local course or a folded course identity.

> Sam, 2026-06-04: *"AP credit is determined at the system level per Title 5 …
> every college determines which local GE courses satisfies the GE Area for the
> AP exam. While local course titles vary, the GE Areas do not."*

## The policy chain (authoritative)

- **AB 1985 (2016, Williams)** → Education Code §79500: directs the CCCCO +
  ASCCC to adopt a **uniform statewide AP credit policy** for GE. Supersedes
  title 5 §55052 where conflicting.
- **AA 17-20** (CCCCO Educational Services, 2017-03-30): publishes the
  **California Community College GE Advanced Placement (CCC GE AP) List** — each
  AP exam → a **GE Area** (the title 5 §55063 "four divisions": Natural Sciences,
  Social/Behavioral Sciences, Humanities, Language & Rationality) + a **minimum
  semester-unit** value. Score ≥ 3 required.
- **AA 17-33** (FAQ, 2017-06-16): clarifies — colleges conform to the CCC GE AP
  List *at a minimum*; may award more; Humanities subsumes Arts; **if the college
  has a similar course → course credit; if not → GE-Area certification**.
- **CCR Title 5 NPRM** (45-day notice, 2026-01-12): codifies + **extends the
  framework to "other external standardized examinations"** (CLEP, IB, …).

Source docs committed under `docs/reference/`.

## The two load-bearing sentences (from AA 17-20)

1. *"If there is no GE Area that fits the AP Examination, the college may award
   **elective credit**."* → **This is the documented origin of the "elective
   bucket"** noise pattern in MAP CPL data. Six AP exams are **N/A** (no GE Area):
   Computer Science A, Computer Science Principles, Seminar (0 units), Studio Art
   2-D / 3-D / Drawing. Colleges award elective units for these.
2. *"This policy does not address **course-to-course** awarding of AP credit as
   that is a **local decision** made by the appropriate discipline faculty."* →
   The specific *local course* an AP maps to is a local choice; the **GE Area is
   the statewide constant.** So folding the local courses into one "canonical
   course" (a re-mint) would be canonicalizing at the **wrong layer**.

## What this means for the CER (and reframes "R2")

The CER's per-credential "common-course identities" table lists the local courses
that articulate to a credential. For AP credentials those are **not competing
canonical identities** — they're the local course-to-course choices colleges made.
The "boil down to essentials" Sam asked for is therefore **the GE-Area headline**,
not an M-ID→C-ID fold:

- **AP European History → GE: Social/Behavioral Sciences *or* Humanities · 3 units.**
  That is the essential. The 10 local identities (Western Civ I/II under HIST
  170/180, plus assorted M-IDs) are *how individual colleges grant it locally*.
- A previously-considered R2 ("re-mint the Western-Civ M-IDs into HIST 170/180")
  is therefore **NOT the right move** — it imposes a course-to-course
  canonicalization the policy explicitly leaves local. Prefer the GE-Area layer.

## How it's wired (shipped Session 33)

- **`kb/reference/ccc_ge_exam_credit.json`** — the transcribed charts under
  `programs: {AP, IB, CLEP}`, per exam `{exam, areas[], min_units, na,
  areas_all, aliases[], prefix[]}`. **`aliases`** bridge the CER's names to the
  chart names (e.g. AP "World History: Modern"→"World History", "Calculus BC — AB
  Subscore"→"Calculus BC/AB Subscore"; CLEP "History of the United States I"→
  "History, United States I"). **`prefix`** char-prefix rules collapse the CER's
  ~30 old IB names: `language a`→Arts & Humanities, `language b`→N/A,
  `mathematics`→Language & Rationality, `history`→the History entry.
- **Producer** (`export_credential_reference()`): detect program from the
  `AP `/`IB `/`CLEP ` prefix, normalize the rest (`&`→`and`, lowercase,
  non-alnum→space), then exact/alias match, else the program's char-prefix rules
  → bake a per-row `ge_credit` `{program, exam, areas, units, na, areas_all}`.
  **147 of 154** exam credentials match (AP 62 · IB 44 · CLEP 41); the 7
  unmatched are exams off the 2024 charts (AP African American Studies / Physics
  B / French & Latin Literature / bare "Physics"; CLEP English Literature /
  Trigonometry).
- **Consumer** (`renderGeApCredit()` in `credential_reference.js`): a navy
  callout at the **top** of the expanded row — *"📜 Statewide AP credit · CCC GE
  AP List → General Education — Social/Behavioral Sciences or Arts and Humanities
  · 3 semester units (minimum)"*, with the note that the local courses below are
  the local grant. `areas_all` joins with **and** (e.g. AP English Lit = "Language
  and Rationality and Arts and Humanities · 6 units"). N/A exams render *"No GE
  Area assigned (N/A) — colleges may award N elective units."* **Remember to
  whitelist new baked fields in `adaptBakedRow`** (the field is dropped otherwise
  — Session 29 trap; cost a red test here too).

## Related noise-suppression (Session 33 R1, shipped first)

The same AP analysis surfaced the **elective-bucket** detector: a single local
course (`COMM M1038` "Group Communication", Clovis) articulated to **61
credentials**, all "3 hours in Elective Course Credits" — the policy's elective
fallback, used as a catch-all. The CER now demotes such identities into a
collapsed disclosure (`bucket` flag) and badges minority-subject identities
(`outlier`) for review. See PR #292.

## Next (not yet built)

- **CLEP / IB — DONE** (Session 33, from ESLEI 24-35). Future: when the 2026
  Title 5 NPRM finalizes (it may add exams / shift to Cal-GETC area numbers),
  re-transcribe the updated chart into `ccc_ge_exam_credit.json`.
- **GE-Area grain view — DONE** (Session 33): a "Group: GE Area" mode on the CER
  toolbar (`groupKeysOf` multi-buckets a row under each area it satisfies;
  consumer-only, reuses the TOP/Discipline grouping machinery). N/A → an
  elective bucket; non-exam credentials → a default-collapsed catch-all.
- **GE-Area coherence check — DONE** (Session 33): a `discipline_ge_areas` map
  (MQ discipline → CCC division[s]) in `ccc_ge_exam_credit.json`, baked as
  `disc_ge_areas`; the consumer flags any articulated course whose discipline's
  division is disjoint from the exam's GE Area with a **`⚠ off GE Area`** badge +
  a credential-level callout note. **Audit finding:** post-noise-suppression the
  exam-credential data is **already GE-coherent** — only 1 non-bucket residual
  (`SOCI M1083` under AP Statistics, an arguably-legit soc-stats articulation);
  the rest of the off-division signal is the `COMM M1038` elective bucket, already
  demoted. So this is a future-proof cue (catches new mismatches as data shifts),
  not a backlog of fixes. Disciplines that cross divisions (History/Geography) and
  unknown disciplines never flag.
