---
title: Foreign-Language SUBJ4 Split — Re-mint Scope
date: 2026-06-09
status: SCOPE (measure-first dry-run DONE, §2a) — awaiting Sam's §5 sign-off before the apply
session: 37
tags: [scope, remint, rule-7, subj4, foreign-languages, csr, m-id, knowledge-base]
related:
  - docs/coursecontrolnumber_remint.md (the re-mint playbook this must follow)
  - docs/research_workexp_crossdisc_remint_scope.md (the prior cross-disc re-mint — the engine template)
  - CLAUDE.md (Rule 7 re-mint playbook · §10 numbering · §11 lifecycle/auditor)
  - kb/foreign_language_subj4.json (the curated language→SUBJ4 map)
  - kb/_fl_subj4_dryrun.py (the measure-first classifier; manifest at kb/fl_subj4_dryrun/manifest.json)
artifacts:
  - kb/discipline_canonical_subj4.json
  - kb/coci_minted_courses.json
  - kb/coci_minted_singletons.json
  - kb/coci_minted_memberships.json
  - kb/coci_articulations.json
---

# Foreign-Language SUBJ4 Split — Re-mint Scope

> **The ask (Sam, 2026-06-09).** Our authoritative MQ list has **"Foreign
> Languages"** but no Spanish/French/etc., so the Rule-7 invariant "all M-IDs of
> one discipline share one SUBJ4" forces **every** language into a single `FLNG`
> bucket. That makes the foreign-language courses a jumble (Spanish, French,
> Chinese… all `FLNG`) — impossible to consolidate cleanly, and the visible cause
> of the `SPAN 100` / `FLNG M1019` / `FLNG M1272` "Elementary Spanish I" collision
> the new CCR impact columns surfaced. Split the SUBJ4 by language in the CSR —
> `FLSP`, `FLFR`, `FLGE`, … — while the MQ **discipline stays "Foreign Languages."**

This is a **scope**, not a build. It states the problem with real numbers, gives
the measure-first dry-run (§2a), proposes the design, and lays out what's Sam's to
sign off (§5) before any apply — per the re-mint playbook.

---

## 1. The conceptual model (the resolution)

**SUBJ4 tracks the SUBJECT a student enrolls in; the discipline tracks the MQ
category.** They coincide for ~every discipline — "Foreign Languages" is the lone
**umbrella** (you enroll in *Spanish*, not "a foreign language"), so it earns
per-language SUBJ4s. The MQ discipline stays **"Foreign Languages"** (authoritative,
untouched). This **refines** the Rule-7 invariant — *one SUBJECT → one SUBJ4* — it
does **not** break it. (ASL, ESL, and Sign-Interpreting are already their *own* MQ
disciplines with their own SUBJ4s — SLNA/ESOL/SLNG — single-subject, out of scope.)

## 2. What the data says

- **The collision is built in.** All **409 `FLNG` M-IDs** + **1,045 `FLNG`
  singletons** carry `discipline == "Foreign Languages"` and are forced into the
  single `FLNG` SUBJ4. `kb/discipline_canonical_subj4.json` maps
  `"Foreign Languages" → "FLNG"` (one code, curator_override).
- **MQ is coarse here.** `kb/reference/mq_disciplines.json` has "Foreign Languages"
  and no per-language discipline. (It *does* separate ESL, "Sign Language, American",
  and Sign/English Interpreting — those are fine.)
- **The languages separate cleanly — the data already does it.** The canonical
  map's own `local_subject_variants` show colleges code by language: **SPAN 709,
  FREN 219, CHIN 196, ITAL 189, JAPN 128, GERM 83, RUSS 53, VIET 39, ARAB 58,
  KOR 36, PORT 21…** And the **CCC TOP 11xx taxonomy is self-describing** — member
  TOP codes are *labeled* (`"1105.00: Spanish"`), giving an authoritative
  code→language map: `1102 French · 1103 German · 1104 Italian · 1105 Spanish ·
  1106 Russian · 1107 Chinese · 1108 Japanese · 1111 Hebrew · 1112 Arabic ·
  1117.10 Tagalog · 1117.20 Vietnamese · 1117.30 Korean · 1119 Portuguese`
  (1101 general / 1117.00 / 1199 "other" = residual).

## 2a. Dry-run results (measured 2026-06-09, READ-ONLY)

`kb/_fl_subj4_dryrun.py` over the 409 M-IDs + 1,045 singletons (manifest:
`kb/fl_subj4_dryrun/manifest.json`), classifier precedence **TOP code → title →
member subject**:

| language | SUBJ4 | M-IDs | singletons | total |
|---|---|---:|---:|---:|
| Spanish | `FLSP` | 138 | 401 | **539** |
| Chinese | `FLCH` | 49 | 113 | 162 |
| French | `FLFR` | 54 | 105 | 159 |
| Japanese | `FLJA` | 41 | 110 | 151 |
| Italian | `FLIT` | 41 | 69 | 110 |
| German | `FLGE` | 27 | 62 | 89 |
| Arabic | `FLAR` | 14 | 41 | 55 |
| Russian | `FLRU` | 10 | 37 | 47 |
| Vietnamese | `FLVI` | 8 | 31 | 39 |
| Korean | `FLKO` | 10 | 23 | 33 |
| Portuguese | `FLPO` | 7 | 9 | 16 |
| Tagalog | `FLTA` | 2 | 12 | 14 |
| Hebrew | `FLHE` | 3 | 8 | 11 |
| Persian | `FLPE` | 1 | 10 | 11 |
| Hmong | `FLHM` | 0 | 7 | 7 |
| Punjabi | `FLPU` | 4 | 0 | 4 |
| **residual → `FLNG`** | | 0 | 7 | **7** |

- **99.5% classified** (1,447 / 1,454). The **TOP-code signal does the heavy
  lifting** (381 M-IDs + 899 singletons by TOP; 158 by title; 9 by member subject).
- **7 residuals** stay `FLNG`: **5 are "Nahuatl"** (an indigenous language not yet
  in the map — see §5.3), 1 "Cross Age Teaching" (not a language course), 1
  "Fundamentals of Healthcare Interpreting" (interpreting).
- **Capacity is comfortable** (§10 caps: corroborated 496 / standalone 6,760 per
  `(subject, band)`). Largest bucket = Spanish; **138 corroborated band-1 M-IDs**
  (< 496) and ~344 standalone band-1 (< 6,760) — separate id formats, separate
  caps, both well clear.

## 3. Why this is a Rule-7 re-mint (not a quick relabel)

Re-keying `FLNG M####` → `FLSP M####` (etc.) is a **SUBJ4 identity change**
governed by Rule 7. It ripples into **memberships**, **`coci_articulations.json`
`course_id`** (FL carries real CPL credit — `FLNG M1019` alone = ~12k eligible
units, so the articulation re-key is what makes the EACR/CER/CCR-impact reflect
the split), **curation `merge_into` pointers**, and **`discipline_canonical_subj4`**.
It rides the **same articulation re-key engine** the cross-disc re-mint built
(`kb/_apply_crossdisc_remint.py` / `_remint_apply_articulations.py`).

## 4. Proposed design

### 4a. The curated map — `kb/foreign_language_subj4.json` (DONE)
Language → `{subj4, top[], subjects[], title[]}`, scheme **`FL` + intuitive
2-letter** (Sam's call). Chinese folds Mandarin+Cantonese (§5.2). ASL is explicitly
**not folded** (its own discipline). The dry-run + the apply both read this map.

### 4b. CSR change — discipline → SET of SUBJ4
`kb/discipline_canonical_subj4.json` "Foreign Languages" entry goes from one
`canonical_subj4: "FLNG"` to a **per-language set** (FLSP/FLFR/…), with `FLNG`
retained as the residual. This is the CSR-table refinement Sam asked for. Curator-
visible in the `canonical-subj4` (CSR) tab.

### 4c. Classifier (TOP → title → subject)
Per §2a. The authoritative, self-describing TOP-11xx label is primary; title +
member subject corroborate/fallback. Re-runnable, idempotent.

### 4d. Auditor exemption (REQUIRED)
`subject_collision_signal` flags a discipline with >1 SUBJ4 (currently **0** post
Phase-1e). After the split, "Foreign Languages" will legitimately carry ~18 SUBJ4s
→ the rule must **whitelist umbrella disciplines** (mirroring how the cross-disc
re-mint exempted RSCH/WKEX from over-merge flags), or it regresses the 0-count with
~18 false findings. Add a `UMBRELLA_DISCIPLINES = {"Foreign Languages"}` exemption
in `kb/_row_audit.py`, mirrored in the client breakdown.

### 4e. Re-key engine + propagation
Build the old→new **alias map** (`FLNG M#### → FL** M####`), re-sequencing the
M-number **deterministically per `(new SUBJ4, band)`** (sorted by normalized title),
**separately for corroborated** (`M<band><seq:03d>`) **and standalone**
(`M<band><d><LL>`) per §10 — they're different id formats with separate caps.
Re-key `coci_minted_courses` / `_singletons` / `_memberships` keys, then
`coci_articulations.json` `course_id` via the alias map (union `earned_by_colleges`,
recompute `adoption_leverage`). Consumers then reflect it: CCR rows + the new impact
columns, EACR prescriptive, CER, the Analytics card. Atomic land per the playbook.

## 5. Open decisions (Sam's call — lock before apply)

1. **Naming — LOCKED:** `FL` + intuitive 2-letter (FLSP/FLFR/FLGE/…) (Sam, 2026-06-09).
2. **Chinese varieties — default applied:** Mandarin + Cantonese **fold into one
   `FLCH` (Chinese)** (varieties of one language). Override → split `FLMA`/`FLCA`.
3. **Residual + Nahuatl:** the dry-run leaves **5 "Nahuatl" singletons** in `FLNG`.
   Recommend **adding Nahuatl → `FLNA`** to the map (it's a real language) and
   leaving only the 2 genuinely language-agnostic courses (Cross Age Teaching,
   Healthcare Interpreting) as `FLNG` residual. Confirm.
4. **Singleton scope:** re-key **both** the 409 M-IDs **and** the 1,045 singletons
   (recommended — the impact lens shows singletons carry FL credit too), or M-IDs
   only first? Recommend **both** (one clean pass).

## 6. Validation gates + rollback

- **V1 conservation:** every old id resolves via the alias map; no articulation
  dropped; `earned_by_colleges` a superset union.
- **V2 no-collision:** new `(SUBJ4, band, seq)` never collides with an existing
  M-ID / C-ID / CCN; corroborated vs standalone id formats stay disjoint.
- **V3 discipline unchanged:** every re-keyed row keeps `discipline ==
  "Foreign Languages"`; only the SUBJ4 (and id) changed.
- **V4 auditor sanity:** `subject_collision_signal` stays **0** via the umbrella
  exemption (not by mis-sharing a SUBJ4); nothing else newly fires.
- **V5 output diff:** pipe both branches through `export_unified_courses` (UC_KB_DIR
  / UC_OUT_DIR seam) + diff CCR/EACR/CER artifacts — a reviewable go/no-go.
- **Atomic land** producer (kb re-key) + consumer (generator) in one commit within
  one 10:17-UTC cron window; **rollback** = `git revert` + the alias-map inverse.

## 7. Phasing

1. **Dry-run + map** — ✅ **DONE** (§2a; `kb/foreign_language_subj4.json` +
   `kb/_fl_subj4_dryrun.py` + manifest).
2. **§5 sign-off** (naming locked; confirm Chinese-fold, Nahuatl→FLNA, both-tiers).
3. **Apply** — `kb/_apply_fl_subj4_remint.py` (alias map + deterministic re-sequence
   + articulation re-key + the `discipline_canonical_subj4` set + the auditor
   umbrella exemption). Receipt at `kb/fl_subj4_out/<date>/alias_map.json`.
4. **Verify** — V1–V5 + the export-seam diff; the next daily cron regenerates the
   published `unified_courses_*.js` (incl. the impact columns now per-language).
5. **Fast-follows:** hand-curate the 2 residuals; consider promoting a "language"
   sub-attribute for display; revisit whether spoken-language interpreting/
   translation warrants its own identity.

---

*Scope authored Session 37. Naming locked; awaiting Sam's §5.2–5.4 confirmation
before building the apply.*
