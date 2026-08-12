---
title: Futuro Health — Human Touch Healthcare → CCC CNA crosswalk — lessons
date: 2026-08-12
tags: [lessons, partners, crosswalk, futuro-health, cna, healthcare, cpl]
artifacts:
  - kb/_build_futuro_hth_crosswalk.py
  - kb/_write_futuro_hth_workbook.py
  - kb/futuro_hth_map_reference.json
  - kb/futuro_hth_out/crosswalk.json
  - kb/futuro_hth_out/hth_cna_crosswalk.html
related:
  - "[[CLAUDE]]"
  - "[[docs/partner_crosswalk_lessons]]"
---

# Futuro Health HTH → CCC CNA crosswalk — lessons

Workstream scratchpad. Append a dated section every checkpoint.

---

## 2026-08-12 — Ashley's second crosswalk, and why it is not the San Joaquin engine

### What prompted it

**Ashley opened the session**, referencing the San Joaquin (SJCOE) crosswalk as the
model. Two documents supplied: the **HTH General Syllabus 3.0 v2.2** and a
**Top-10 CCC decision guide** she had already produced from HTH scholar-proximity
analysis. The ask: *"an excel sheet that provides any colleges statewide that
offers CNA programs that may align with the Human Touch Healthcare program."*
Mid-request she added: *"Please show me an html visual of this work."*

### The shape is different from SJCOE, and that matters

The partner engine (`kb/_build_partner_crosswalk.py`) answers **"which occupations
on a partner's list already have CPL somewhere?"** — a judgment-based join from
*job titles* to *credential titles*. This ask is the inverse: **one known course**,
matched against **one known program type**, across every college. There is no
occupation vocabulary to reconcile, so the engine does not apply. A separate,
simpler generator was the right call, not a forced reuse.

### The finding that reframes the deliverable

**HTH cannot articulate into the CNA course.** A California CNA program is a
**CDPH-approved 160-hour course** (60 theory / 100 clinical) with hours and content
fixed in regulation; no college can award CPL against it for an 80-hour online
soft-skills course with no clinical component. The whole value of the sheet is
therefore pointing at the **adjacent** receiving course — interpersonal
communication, intercultural communication, healthcare ethics — which is also a
much easier faculty conversation, because HTH's outcomes and that course's
outcomes are the same kind of thing.

Taking the question literally ("colleges with CNA programs") and stopping there
would have produced a list that cannot be acted on.

### Course-level MIS beats program-level COCI for "who offers X"

- COCI program export (TOP 1230.30 + CNA-titled): **32 colleges**.
- MIS `cb_course_basic_fall2025.csv` (TOP 1230.30): **61 colleges**, 153 courses.

Nearly double. Many colleges run CNA as a **course** (often noncredit) without a
separate COCI award record. **For an "which colleges offer X" question, start at
the course file; use COCI only for the award level.** Both are reported per college.

### Two signals, then curate — the SJCOE lesson held

Title-only matching surfaced *Library Teamwork Supervision Skills*, *Automotive
Leadership and Team Building*, and *Compassion Training for Yoga Teachers and
Everyone*. Requiring **title lens AND TOP family** killed the noise. This is the
sanctioned use of TOP under the standing caveat: a **search/filter aid**, never a
gatekeeper, and corroborated by a second signal.

But tier alone still ranked badly: the health TOP family covers *every* allied
health occupation, so **"Funeral Service Law and Ethics"** and **"RDA Law and
Ethics"** (dental) outranked the canonical *Interpersonal Communication*. Those
teach another occupation's scope of practice. A `fit_of()` score — health context
`+2`, canonical interpersonal/intercultural pair `+3`, other-occupation or
placement `-3`/`-2` — fixed the ordering and dropped the rest.

### ⭐ The MIS course file ABBREVIATES titles, and that reads as "none found"

The costliest bug, caught only by opening the four colleges reporting no receiving
course and listing their communication inventory by hand:

| Written in MIS | My pattern wanted | Result |
|---|---|---|
| `INTERCULTURAL COMM` | `intercultural communicat` | missed |
| `Interpersonal Commun` | `interpersonal communicat` | missed |
| `BIO-ETHICS` | `bio\s*ethics` | missed (hyphen) |

Six colleges were being told **"no receiving course found"** when the canonical
course was plainly in the catalog — College of Alameda, LA Valley, LA Harbor, LA
Southwest among them. **A false "we looked and found nothing" is worse than a
missing row**, because it closes the question. Fixed with a `tidy_title()` fold
(punctuation → space) and by matching on `comm` rather than `communicat`
**everywhere, including the fit regexes** — I fixed the module patterns first and
the fit regexes still silently scored those rows to 0, which produced the identical
symptom a second time.

Final: **59 of 61** colleges have a candidate; the remaining 2 (Lassen, Santa
Monica) were verified by listing their full TOP 1506 inventory — genuinely no
interpersonal/intercultural course in the fall-2025 file.

### The join assertion earned its keep immediately

`norm()` applied to **both** sides, then `sys.exit` if any college fails to match.
It fired on the first run: `MIRA COSTA COLLEGE` vs `MiraCosta College`. One space.
Without the assertion that college silently drops out of a 61-row deliverable and
nobody notices. (Same lesson as the college-action-page join, one day earlier.)

### The actionable headline was in `cpl_memory`, not in the data

Querying the memory table first (Rule 8) surfaced
`non-college-entities-are-at-zero-awarded`: **Futuro Health is already a MAP
partner entity (ID 133) with a live landing page and ZERO exhibits / ZERO credit
recommendations.** That reframes the whole deliverable — the 61 colleges are not
reachable until HTH exists in MAP as an exhibit. It leads both the workbook and
the HTML. Reading memory before working paid for itself in one query.

### Ashley's guide and this sheet measure different things — say so

Her Top-10 guide scores **CPL Readiness Levels 1–3 from public website review**.
Sessions are **egress-blocked from college domains**, so that method was
unavailable. This sheet's readiness is **A–D derived from MAP itself** (exhibits +
credit recommendations). Different instrument, different scale — labelled
explicitly so the two are not read as the same number. A tier must encode what you
could not check.

### Current state

- **61 colleges**, 153 CNA courses, 57 COCI CNA programs.
- **59** have ≥1 plausible receiving course; **25** have a health-discipline one.
- **22** score 4–5 for alignment; **24** already run CPL in MAP.
- Workbook (5 sheets) + published HTML view; workbook gitignored as regenerable.

### Next concrete step

1. Load **HTH as an exhibit in MAP** under Futuro Health — everything else is
   downstream of it.
2. Work the **A + score 4–5** rows first (Long Beach, CCSF, Cuesta): CPL already
   operates and the receiving course is clear, so the ask is about one course.
3. Confirm the **2 "none found"** colleges against their live catalogs.
4. If this becomes recurring, offer it as a **COBI tab** rather than a spreadsheet —
   the MAP-side columns drift, and a sheet handed over in chat is a snapshot.
