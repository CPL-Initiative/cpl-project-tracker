---
title: Cross-Disciplinary Shared-COR Course Identity — Re-mint Scope
date: 2026-06-09
status: SCOPE — pending Sam's approval of the open decisions (§5). NO build yet.
session: 36 (stoic-bardeen)
tags: [scope, remint, rule-7, cross-listing, cross-disciplinary, work-experience, research, m-id, knowledge-base]
related:
  - docs/coursecontrolnumber_remint.md (the re-mint playbook this must follow)
  - docs/accounting_crossdisc_plan.md (prior cross-disciplinary cleanup precedent)
  - CLAUDE.md (Rule 7 re-mint playbook · §10 numbering · §11 lifecycle/auditor)
  - kb/_seed_coci_minted_mids.py (the STOP_PATTERNS exclusion at the root of this)
  - kb/_remint_apply_articulations.py (the articulation re-key template)
artifacts:
  - kb/coci_minted_courses.json
  - kb/coci_minted_singletons.json
  - kb/coci_articulations.json
  - kb/coci_curation.json
---

# Cross-Disciplinary Shared-COR Course Identity — Re-mint Scope

> **The ask (Sam, 2026-06-09).** Courses like **Undergraduate Research Experience**
> and **Cooperative/Occupational Work Experience** share *one* Course Outline of
> Record, and colleges cross-list that single COR under many subject codes —
> College of the Desert files it as `BI 31 / CH 31 / MATH 31 / PH 31 / A 31`, all
> "Undergraduate Research Experience," 2 units — precisely so a student earns the
> credit under the subject that fits *their* degree pathway. These should get their
> **own common-course subject + number** and be recognized as **cross-listed across
> the disciplines**, not filed under one arbitrary discipline and flagged as an
> over-merge. This is a principled re-mint (Rule 7); it rides the same
> articulation-re-key engine the curator-merge propagation needs.

This is a **scope**, not a build. It states the problem with real numbers,
proposes a design, lays out the decisions that are Sam's to make (§5), and gives
the measure-first dry-run + validation + rollback plan per the re-mint playbook.

---

## 1. The motivating case

`MATH M1262` "Undergraduate Research Experience" (Mathematics, 2 units, 6 members):
College of the Desert's `BI 31 / CH 31 / MATH 31 / PH 31 / A 31` (Biology,
Chemistry, Math, Physics, Astronomy) + Santa Ana's `ENVR 262`. The auditor flags
it `member_top_divergence` (`⊘ TOP`) — TOP codes span Biology / Chemistry / Math /
Physics / Astronomy — i.e. it reads a **legitimate cross-disciplinary course** as
a single-discipline over-merge. The "Mathematics" discipline label is arbitrary
(it's just the modal/first subject). This is the visible tip; the class beneath it
is much larger and mostly **invisible** to the identity layer.

## 2. What the data says (5 findings)

1. **The class is deliberately excluded from minting.** `kb/_seed_coci_minted_mids.py`
   carries `STOP_PATTERNS` (~30 regexes, lines 100-110) that drop "administrative
   shell" titles — *independent study, directed study, special project/topic, work
   experience, cooperative work/education, coop, internship, supervised tutoring,
   service learning, occupational work, tutoring, practicum, fieldwork, field
   study, directed/clinical practice, work-based learning, on the job,
   apprenticeship, seminar, volunteer, community service* — as "not consolidatable
   common courses." That rationale (no fixed content to articulate) is *why*
   work-experience is invisible.

2. **But the class is large in raw COCI.** Streaming the 141,738-row
   `kb/reference/coci_course_list.xlsx`:
   - **Intra-college cross-listing: 3,525 groups / 9,448 course rows** — same
     college + same title under **≥2 distinct subjects**. Top cross-listed titles
     are exactly the class: *independent study* (18 colleges), *work experience*
     (8) + *work experience education* (6), *supervised tutoring* (8), *directed
     study* (5) — mixed with genuinely-interdisciplinary **content** courses
     (*social psychology* 10, *medical terminology* 10, *intercultural
     communication* 8, *ethnic studies* 6).
   - **Work-experience exists in raw COCI: 2,944 rows**, 1,676 titles, 852 subjects
     — "Work Experience Education" (130), "Cooperative Education" (75), "Work
     Experience" (69), "Occupational Work Experience" (46)… under dedicated
     subjects (WEE/WE/WEXP) and disciplinary ones (BUS/ART/AUTO/CIS/EMS/BIOL/KIN).

3. **"Research" slipped the STOP list; its siblings didn't.** `STOP_PATTERNS` has
   no `research` pattern, so research-experience courses *do* mint — but only 1
   corroborated M-ID (`MATH M1262`) + **16 single-college singletons** scattered
   across 7 SUBJ4 (BIOL 4, PSYC 3, STEM 2, ENGL 2, ENGR 2, PHYS 2, CHEM 1). So
   even the *un*-excluded half is fragmented + mis-subjected. The excluded half
   (work experience, independent study, internship, …) is absent entirely.

4. **The right classifier is specific — generic flags miss it.** `subject_spread`
   / `member_top_divergence` do **not** isolate this class: `subject_spread ≥ 4`
   returns 1,885 M-IDs dominated by **cross-college subject-code variance**
   ("Medical Terminology" under **53** local codes — one discipline, messy coding),
   not Sam's case. The distinguishing signal is **intra-college**: the *same
   college* offering the *same-titled* course under *multiple subjects at once*
   (College of the Desert's `BI/CH/MATH/PH/A 31`). That classifier doesn't exist
   yet.

5. **Exclusion likely costs articulations.** `coci_articulations.json` resolves
   earned MAP articulations to an identity; an articulation pointing at an excluded
   shell course can't resolve → it's dropped/unmatched. Work-experience & CWEE are
   prime experiential CPL targets, so the exclusion may be silently losing real
   articulation signal. **(Quantify in the dry-run — §6.)**

## 3. Why this is a Rule-7 re-mint (not a quick fix)

The fix is an **identity change** governed by Rule 7: consolidate the fragments
into a **dedicated cross-disciplinary identity** per shared-COR course type, give
it its own SUBJ4 + number, mark it cross-listed across its member disciplines,
exempt it from the over-merge flags, and **propagate** through the static
`coci_articulations.json` → EACR/CER views. That propagation is the same
articulation-re-key engine the 27 pending curator merges need (`kb/_remint_apply_articulations.py`
is the 1:1 template; this needs MANY→1 + re-subject), so the engine is shared.

## 4. Proposed design

### 4a. Classifier — the shared-COR shell detector
A read-only pass over the raw list (+ minted/singleton layers) that flags a
course as **shared-COR cross-disciplinary** when, at one college, a single
normalized title appears under ≥2 distinct subjects (optionally same
course_number, as in `*/31`). Intersect with a curated **shell-type lexicon**
(research experience, work experience / CWEE, independent/directed study,
internship, service learning, supervised tutoring) so we target the shell class
first and hold genuinely-interdisciplinary *content* courses (Social Psychology,
Ethnic Studies) for a later phase. Output a reviewable manifest, never auto-apply.

### 4b. Dedicated identity per shell-type
Mint ONE canonical cross-disciplinary identity per shell course type, with a
synthetic SUBJ4 in the established M-scheme (§10) — e.g. a research identity, a
work-experience identity, an independent-study identity. The local subject codes
(`BI/CH/MATH/PH/A 31`) become **cross-list members**, not separate identities.
`discipline` = "Interdisciplinary/Cross-listed" (or the COR's home), and the full
member-discipline set is carried via the existing **`cross_listed_disciplines`**
mechanism (kb_curation field → generator `xdisc` → CCR "+ Discipline" chip;
discipline filter already matches primary OR cross-listed). Candidate canonical
SUBJ4s (Sam to confirm — §5): `RSCH` research · `WKEX` work-experience · `INDS`
independent study · `INTN` internship · `SERV` service learning · `TUTR`
supervised tutoring. Loudly synthetic, not a CCN claim (§10).

### 4c. Over-merge flag exemption
Mark these identities `cross_disciplinary: true` and have the auditor's
`member_top_divergence` / `over_merge` rules **skip** them — for a recognized
cross-listed course, spanning TOP divisions is *expected*, not an error. (Add to
`kb/_row_audit.py` as a recognized-class exemption, mirrored in the client
breakdown.)

### 4d. Re-key engine (the propagation)
A new `kb/_apply_crossdisc_remint.py` modeled on `_remint_apply_articulations.py`
but MANY→1 + re-subject: read the confirmed manifest → build an old→new **alias
map** (the N fragment M-IDs/singletons → the canonical shared-COR id) → re-key
`coci_articulations.json` `course_id`, **union** `earned_by_colleges`, recompute
`adoption_leverage`, refresh flags. Same engine handles the **27 pending curator
merges** already in `coci_curation.json` (a free win — they currently propagate to
the CCR + auditor but NOT to EACR/CER). Consumers that then reflect it:
`_build_statewide_prescriptive` (EACR prescriptive), `export_credential_reference`
(CER — its `_consolidate_arts` display band-aid #308 becomes redundant/durable),
`_build_articulations_by_course` (Analytics card), `_build_aligned_exhibits_by_course`
(aligned view).

### 4e. The STOP_PATTERNS question
To bring work-experience / independent-study / internship in, the minting
exclusion must change for the shell-types we promote — NOT by minting them like
content courses (the original rationale stands for free-form shells), but by
routing them to the **dedicated shared-COR identities** (4b). Keep excluding the
truly-program-specific ones (apprenticeship, clinical practice) unless Sam wants
them too.

## 5. Open decisions (Sam's call — lock before build)

1. **Scope of types.** Just **research + work-experience** (the two you named), or
   the full shell lexicon (independent study, internship, service learning,
   supervised tutoring)? Recommendation: **research + work-experience first**,
   others as fast-follows on the same engine.
2. **Subject-coding scheme.** Confirm the canonical synthetic SUBJ4s (RSCH/WKEX/…)
   and whether each shell-type is ONE statewide identity or split by a real
   sub-distinction (e.g. *General* vs *Occupational* Work Experience; CWEE is a
   Title-5 framework + a possible CIDx/CTE candidate per §11).
3. **Cross-list representation.** Reuse `cross_listed_disciplines` (lightweight,
   already wired) vs. a richer new "cross-listed members" structure. Recommendation:
   **reuse `cross_listed_disciplines`**.
4. **Bundle the 27 pending curator merges** into the same re-key land (they need it
   anyway and prove the engine), or ship them separately first? Recommendation:
   **bundle** — one atomic articulation re-key.

## 6. Dry-run plan (measure-first, per the playbook)

Build a read-only `kb/_crossdisc_dryrun.py` that produces a committed manifest +
report **before any apply** (the `coursecontrolnumber_remint` pattern):
- The classifier manifest: every shared-COR group, its member (college, subject,
  number, title, units, TOP), proposed canonical id, and the member-discipline set.
- Counts: # canonical identities minted, # fragment M-IDs/singletons folded, #
  raw rows captured, per shell-type.
- **Articulation impact:** how many `coci_articulations.json` records re-key; how
  much `adoption_leverage` moves; **how many MAP articulations currently point at
  excluded shells and are being lost** (§2.5) — re-resolve against the new ids.
- Alias map (old→new) committed as the receipt + rollback inverse.

## 7. Validation gates + rollback

- **V1 conservation:** no articulation record dropped; `earned_by_colleges` is a
  superset union (no college lost); every old id resolves via the alias map.
- **V2 no-collision:** new canonical SUBJ4+number never collides with an existing
  M-ID / C-ID / CCN.
- **V3 flag sanity:** promoted identities carry `cross_disciplinary: true` and no
  longer fire `member_top_divergence`; nothing *else* newly fires it.
- **V4 output diff:** pipe both branches through the generator (UC_KB_DIR /
  UC_OUT_DIR seam) and diff EACR/CER/aligned artifacts — a reviewable go/no-go.
- **Atomic land** producer (kb re-key) + consumer (generator) in one commit within
  one 10:17-UTC cron window; **rollback** = `git revert` + the alias-map inverse,
  inside the same window (per `coursecontrolnumber_remint.md` §rollback).

## 8. Phasing

1. **Dry-run + manifest** (read-only, committed) — answers "what changes?"
   including the lost-articulations measurement. ← *first build step, after §5.*
2. **Lock §5 decisions** with Sam against the dry-run numbers.
3. **Apply:** mint canonical identities, re-key articulations (+ the 27 merges),
   `cross_disciplinary` flag + auditor exemption, STOP_PATTERNS routing.
4. **Verify** (V1-V4) + atomic land + dashboard regen so EACR/CER are current
   before the next cron.
5. **Fast-follows:** remaining shell-types; then the harder
   *interdisciplinary-content* cross-listings (Social Psychology, Ethnic Studies).

---

*Scope authored Session 36. Awaiting Sam's §5 decisions before the dry-run build.*
