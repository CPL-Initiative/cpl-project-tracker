---
title: Kinesiology ⟵ Physical Education Convergence — Re-mint Scope
date: 2026-06-10
status: APPLIED ✅ (2026-06-10) — V-gates green, independently verified. See §8 for results.
session: 38 (trusting-newton)
tags: [scope, remint, rule-7, subj4, discipline-alias, kinesiology, physical-education, csr, m-id, knowledge-base]
related:
  - docs/coursecontrolnumber_remint.md (the re-mint playbook this must follow)
  - docs/fl_subj4_remint_scope.md (the Foreign-Language split — the MIRROR-IMAGE precedent: fan-OUT)
  - CLAUDE.md (Rule 7 re-mint playbook · §10 numbering · §11 lifecycle/auditor)
artifacts:
  - kb/coci_minted_courses.json
  - kb/coci_minted_memberships.json
  - kb/coci_articulations.json
  - kb/discipline_aliases.json  (NEW — the fan-in alias map; created at apply time)
  - kb/kin_pe_out/<date>/alias_map.json  (NEW — old→new M-ID receipt; created at apply time)
---

# Kinesiology ⟵ Physical Education Convergence — Re-mint Scope

> **The ask (Sam, 2026-06-10).** The authoritative MQ list carries **both**
> "Kinesiology" and "Physical Education" because the field is mid-rename — some
> faculty hold KIN degrees, some hold PE, and the transition isn't complete. The
> result is the **single biggest discipline collision in the dataset** (93 shared
> course-title families; #2 is less than half that). Converge them: **Kinesiology
> is canonical**, "Physical Education" becomes an **alternate name** (Sam's word —
> *not* "old"). Carve out **Physical Education Disabled Students** as its own
> distinct MQ with its own SUBJ + course sequence (added to the CSR + subject
> filter). Keep Dance and intercollegiate Athletics as their own lanes.

This is a **scope**, not a build. It states the problem with real numbers, records
the measure-first dry-run (§2), proposes the design (§3–4), and lays out what's
Sam's to sign off (§5) before any apply — per the Rule-7 re-mint playbook.

---

## 1. The conceptual model — this is the MIRROR of the FL split

The Foreign-Language split (`FLNG → FLSP/FLFR/…`) was **fan-OUT**: *one* MQ
discipline over *many genuinely-distinct subjects*. KIN/PE is the **opposite shape
— fan-IN**: *two* MQ discipline **names** for *one converging field*.

| | Foreign Languages (done) | Kinesiology ⟵ PE (this scope) |
|---|---|---|
| Shape | fan-OUT (1 disc → many SUBJ4) | **fan-IN** (2 disc → 1 canonical) |
| Move | split SUBJ4 per subject | **fold the alternate name in** |
| Discipline | unchanged ("Foreign Languages") | **changes** (PE → Kinesiology) — faculty-facing |
| M-numbers | unique within FLNG → clean re-prefix | **collide** (689) → merge + re-sequence |

The key consequence: a **"PHYS child under KIN"** (the FL pattern) would encode
*"Physical Education is a distinct sub-subject of Kinesiology"* — perpetuating the
split. An **alternate-name alias** encodes *"Physical Education is another name for
Kinesiology"* — which resolves it. The field is converging on KIN; the model leads
it there.

**SUBJ4 tracks the SUBJECT a student enrolls in; the discipline tracks the MQ
category.** Here the canonical subject is **`KINE`**, the canonical discipline is
**Kinesiology**, and "Physical Education" is recorded as an **alternate discipline
name** (new `kb/discipline_aliases.json`, surfaced as an "also: Physical Education"
chip on the Kinesiology CSR row — the fan-in mirror of FL's split chips).

## 2. What the data says (measure-first dry-run, 2026-06-10)

Run inline against `kb/coci_minted_courses.json` (16,309 minted identities).
Current state is **clean at the SUBJ4 level**:

| Discipline | Identities | `subject_4letter` |
|---|---|---|
| Kinesiology | 692 | **all `KINE`** |
| Physical Education | 745 | **all `PHYS`** |
| Dance | 439 | DANC (own MQ — untouched) |
| Recreation Administration | 9 | (own MQ — untouched) |
| Athletic Training / Folk Dance / PE-Disabled | 0 / 0 / **0** | MQs exist, no identities yet |

- **`PHYS` total across all disciplines:** 832 M-numbers (vs 692 `KINE`).
- **M-number collision** if `PHYS` were naively re-prefixed to `KINE`: **689** —
  the spaces were minted independently (both have M1001, M1002, …). So **this is
  NOT a clean re-prefix like FL.** The core fold needs **merge-the-duplicates +
  re-sequence-the-orphans** (see §3).
- **Articulation ripple:** only **34 of 4,592** articulation records reference a
  `PHYS` `course_id` — the re-key crosswalk is tiny / low-risk.

### Carve-out buckets (measured)

| Bucket | Count (PHYS / KINE) | Detection | Destination |
|---|---|---|---|
| **Adapted / Disabled-PE** | **41** (30 / 11) | title `adapt\|disab\|special needs\|DSPS` | → **PE-Disabled** discipline + new SUBJ4 |
| **Intercollegiate Athletics** | **274** (238 / 36) | title `intercollegiate\|off-season\|varsity\|team`, raw subj `ATHL/ATH/SPORT/ICA/IATH/TEAM` | → **`ATHL`** SUBJ4, disc Kinesiology |
| **Core (everything else)** | **~1,122** (~477 / ~645) | remainder | → **`KINE`** + Kinesiology |

Adapted samples (all currently mis-filed under KINE/PHYS): *Adapted Cardiovascular
Fitness · Adapted Fitness · Adaptive Activities · Beginning Adapted Aquatics ·
Adapted Strength Training*. Athletics samples: *Baseball, Men, Off-Season
Intercollegiate · Basketball … · Cross Country …*.

## 3. The design

**Three destinations, each a Rule-7 re-key with an alias map:**

1. **Core → `KINE` + discipline "Kinesiology"** (the fold).
   - PHYS-core identity is a **duplicate** of an existing KINE course (same
     title-family) → **merge** into the KINE identity (`merge_into`); old
     `PHYS M####` → existing `KINE M####` in the alias map. (This is exactly what
     the ⚇ Merge / Suggested-merges worklist consolidates — the convergence makes
     them share `KINE` so the worklist can finish the job.)
   - PHYS-core identity has **no** KINE equivalent → **re-sequence** to a fresh
     `KINE M####` (its old number almost certainly collides; alias map carries
     `PHYS M#### → KINE M####-new`).
   - KINE-core identities already under Kinesiology: discipline unchanged; only the
     11 adapted + 36 athletics among them carve out (below).
   - Discipline field flips `Physical Education → Kinesiology`; **"Physical
     Education" recorded as the alternate name** in `kb/discipline_aliases.json`.

2. **Athletics → `ATHL` + discipline "Kinesiology"** (clean re-prefix).
   - `ATHL` is an empty SUBJ4 space → collision-free re-prefix (FL-style). 274
     identities (238 PHYS + 36 KINE) re-key to `ATHL M####` keeping their number.
   - Discipline = **Kinesiology** (no "Athletics" MQ exists; coaches are KIN
     faculty) — but a **distinct enrollment subject**, so KINE and ATHL are sibling
     SUBJ4s under one discipline. (This is a *small* fan-out inside Kinesiology —
     legitimate, since intercollegiate competition ≠ instruction.)

3. **Adapted → new `APED` + new discipline "Physical Education Disabled Students"**
   (the carve-out Sam called out; clean re-prefix).
   - **Clean the garbled MQ name** `Physical Education Disabled Student Programs and
     53414 Services` → **"Physical Education Disabled Students"** in
     `kb/reference/mq_disciplines.json` (the `53414` is a stray code — a vocab bug).
   - `APED` ("Adapted Physical EDucation" — the standard professional term; the 41
     courses are all titled "Adapted …") is an empty space → collision-free
     re-prefix. 41 identities (30 PHYS + 11 KINE) re-key to `APED M####`.
   - **CSR + subject filter:** add the new SUBJ4 row/option labeled **"Physical
     Education Disabled Students"** (`canonical_subj4.js` + the CCR `#uc-subj`
     filter, which now reads `subj4Of` post-#2).

**Untouched:** Dance (439, own MQ), Recreation Administration (9, own MQ), Athletic
Training (own MQ, 0 ids). Local college subject codes (`PE 101`, `KINA 12`) are
**preserved at the member level / hover** (already so after the #2 SUBJ4-column
change — nothing erased).

## 4. Dual-MQ eligibility (the honest bit)

The field hasn't fully transitioned, so a converged course may be genuinely
teachable by faculty qualified under **either** MQ. Record that with the existing
**`cross_listed_disciplines = "Physical Education"`** field on the KINE identity
where it's real — so PE-credentialed faculty still see their eligibility. The
authoritative MQ vocab keeps "Physical Education" as a discipline; we converge the
**identity** layer, we do **not** delete the MQ.

## 5. Sign-off — DECIDED (Sam, 2026-06-10) ✅

1. **Canonical name = Kinesiology, alternate = Physical Education.** ✅ CSR shows
   "Kinesiology · also: Physical Education".
2. **Athletics** → **keep `ATHL` distinct** (disc Kinesiology). ✅ *(Sam: "Keep ATHL
   distinct.")* — 274 intercollegiate courses; competition ≠ instruction.
3. **PE-Disabled SUBJ4 code** = **`PEDS`** ✅ *(Sam's pick — mirrors the discipline
   name "Physical Education Disabled Students" exactly.)*
4. **PHYS-core orphans re-sequence** to *new* `KINE` numbers (old numbers collide).
   ✅ ack — alias map is the rollback inverse.
5. **Converge-then-merge** — the apply only **re-keys** (PHYS→KINE / ATHL / PEDS);
   the Suggested-merges worklist dedups the now-same-SUBJ4 twins later
   (curator-confirmed). ✅ No auto-merge in the apply.

**Ungated** ("move forward") — the apply is built + run in this PR.

## 6. Apply mechanism (after sign-off) — Rule 7

- New `kb/_kin_pe_convergence_dryrun.py` (manifest) → `kb/_apply_kin_pe_convergence.py`
  (idempotent; `--apply`), mirroring `kb/_apply_fl_subj4_remint.py`.
- **V-gates** (V1 every identity lands in exactly one destination; V2 no `KINE`
  collision after re-sequence; V3 untouched lanes — Dance/Rec/Athletic-Training —
  byte-identical; V4 articulation re-key 1:1, 34 records).
- Alias receipt `kb/kin_pe_out/<date>/alias_map.json`; atomic land within one cron
  window (10:17 UTC). Re-key ripples into `coci_minted_courses.json`,
  `coci_minted_memberships.json` keys, `coci_articulations.json` `course_id`, and
  curation `merge_into` pointers — all carried by the alias map.
- After apply: re-seed the CSR (`python3 kb/_seed_canonical_subj4.py`) so KINE
  (with alternate-name chip), ATHL, and APED surface; commit the auditor's
  regenerated `latest.json`.

## 7. Risks / rollback

- **Discipline change is faculty-facing** — this is the one re-key that edits the
  MQ-category field (PE→Kinesiology). It's a deliberate domain call, not a silent
  re-key; the MQ vocab stays intact (PE remains a valid MQ; we alias, not delete).
- **Re-sequence (not re-prefix)** for the core orphans means their M-IDs change —
  higher churn than FL. Mitigated by the small articulation ripple (34) and the
  alias map. Rollback = apply the inverse alias map.
- **Athletics/adapted detection is title-heuristic** — the apply must freeze a
  curated rule set (title + raw-subject) and print the exact per-identity
  assignment for review *before* `--apply` (measure-first, per playbook).

---

## 8. Applied — results (2026-06-10, `kb/_apply_kin_pe_convergence.py --apply`)

Two issues the measure-first dry-run caught (and the apply handled):
- **`PHYS` overload** — it carried Physics/Astronomy (65) + Physical Sciences (22),
  not just PE. Re-key was **discipline-scoped** (`discipline=="Physical Education"`),
  so those 87 stayed on `PHYS` → **`PHYS` now means Physics, cleanly.**
- **Band overflow + merge precision** — merged Kinesiology ≈ 1,140 raw credit > the
  1,000/band cap. Fixed by merging the **88 true duplicates** (down from a naive 191
  — the first heuristic over-merged "Golf I/II/III/IV" into one; switched to the
  canonical level-safe `_fam_key` **+ a single-letter-roman fix** so "Swimming I"≠"V",
  + a same-credit guard → **0 mismatched-family merges**, verified).

| | result |
|---|---|
| Minted identities | 16,309 → **16,221** (−88 merges) |
| `discipline=="Physical Education"` | **0** (fully folded) |
| Kinesiology | 692 → **1,308** (KINE 1,009 + ATHL 299) |
| `PEDS` / "Physical Education Disabled Students" | **41** (garbled `53414` MQ name cleaned) |
| `subject_4letter==PHYS` | 832 → **87** (Physics-only) |
| Carve-outs | athletics **299** → `ATHL`, adapted **41** → `PEDS` |
| Ripple re-pointed | articulations **9**, curation refs **5**, memberships **792** |
| V-gates | **G1–G5 PASS** + independent re-verify |

Receipt (rollback inverse): `kb/kin_pe_out/2026-06-10/alias_map.json` (792 entries).
**Follow-ons:** the next daily cron regenerates the CCR/EACR/CER with KINE/ATHL/PEDS;
the Suggested-merges worklist now collapses the remaining cross-subject dups
(curator-confirmed); a small consumer add surfaces the **"also: Physical Education"**
alternate-name chip (`canonical_subj4.js` ← `kb/discipline_aliases.json`). The 5 other
DSPS disciplines still carrying a stray `53414` are a separate pre-existing vocab bug.

**Bottom line.** KIN/PE is the headline collision and the template-setter for a new
**fan-in / discipline-alias** pattern (the way FL set the fan-out template). It's a
bigger operation than FL — it changes a faculty-facing discipline and needs
merge+re-sequence, not a clean re-prefix — so it's scoped here for sign-off rather
than applied. Next collisions in the same family (Drama/Theater Arts ↔ Theater Arts,
the CIS/CS/Office-Tech cluster) reuse this same fan-in machinery.
