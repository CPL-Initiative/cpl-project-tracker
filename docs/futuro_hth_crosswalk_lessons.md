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
credit recommendations). Different instrument, different scale — labeled
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

---

## 2026-08-12 (checkpoint) — what the workbook build itself taught

Appended at the Rule 8 checkpoint, after #1134 merged (`085abbe`).

### A summary formula counted a different thing than its label said

The Statewide summary tab claimed *"Colleges with at least one plausible receiving
course"* but pointed `COUNTIF` at the **HTH-modules-covered** column. **58 vs 59.**
San Diego College of Continuing Education has one candidate course that matches the
allied-health *professionalism* lens — the 7th lens — and none of the six named
modules, so it counted in one and not the other.

Caught by verifying each formula's **target column and expected value** against the
source JSON rather than by reading the formula, which looked fine. Fixed by adding
a real `Candidate courses` column and pointing the formula at it, then publishing
**both** counts with the discrepancy explained in the "How it is counted" column.
**A label and a range are two separate claims; verify them separately.**

### `recalc.py` cannot run in this sandbox

LibreOffice timed out at **119s, then 539s**, twice. The verification step the
`xlsx` skill mandates was simply unavailable — not a failure, an absence. What
replaced it: every formula's target column asserted, every expected value computed
independently from `crosswalk.json` (61 / 59 / 58 / 24 / 22 / 9), and the formulas
kept to quoted Excel-2007-era `COUNTA`/`COUNTIF` that Excel computes on open. The
Read me tab tells the reader those cells may look empty in a non-calculating
preview pane. **When a verification tool is unavailable, say which check you ran
instead — don't let its absence read as a pass.**

### Rendering the page found a bug no assertion would have

The HTML sorted by alignment score descending, then by CPL activity — except the
tiebreak was **inside the negation**, so within equal scores the colleges with the
*most* CPL activity sank to the bottom. Every top row showed 0 credit recs. Nothing
was factually wrong; the page just gave the worst possible advice about where to
start. Found by screenshotting the render and reading it. (Same lesson as
`methodology-assert-what-the-reader-sees`, one session earlier.)

### A second partner engagement is not a second engine run

Recorded in §11 because it is the kind of thing that gets misread later: the
partner engine's roadmap row says *"next: run a 2nd partner list"*, and this run
could look like it. It is not. The engine reconciles a **partner's occupation
vocabulary** against MAP's **credential vocabulary** — many-to-many, judgment-heavy.
This was **one known course × one known program type** across every college, with no
vocabulary to reconcile. A separate, simpler generator was right; forcing the engine
would have been wrong. The engine's second run is still outstanding.

### Next concrete step (unchanged)

1. Load **HTH as an exhibit in MAP** under Futuro Health (ID 133) — everything is
   downstream of it.
2. Work the **readiness A + score 4–5** rows first: Long Beach, CCSF, Cuesta.
3. Confirm the **2 "none found"** colleges (Lassen, Santa Monica) against live catalogs.
4. Offer this as a **COBI tab** if Ashley wants it as the MAP columns drift.

### Late addition — the coded join, via Sam relaying SkyLink

Sam passed on, mid-checkpoint, that a concurrent session had landed
`kb/college_identity/2026-08-12/crosswalk.json` — 262 name variants resolving to a
MAP `college_id`. Adopted, and it is a genuine upgrade, but **not** in the form
offered.

**Name lookup against it resolved only 47 of 61.** Its variant list does not carry
the MIS `College_name_long` inversions (`ALAMEDA, COLLEGE OF`, `DESERT, COLLEGE OF
THE`) that this build's `norm()` already handled. Joining on the **MIS college
code** instead — `cb_course_basic.CB_COLLEGE_ID` *is* `mis_college_code` — resolved
**60 of 61**, with the crosswalk asserting its codes are unique. A code cannot be
defeated by a spelling; that is the whole point of the file, and the name list is
the weaker half of it.

⚠️ **The name fallback had to stay.** The identity crosswalk scopes to the **116
credit colleges**, so the continuing-education institutions are outside it — they
appear in its own `mis_rows_not_matched_to_a_map_college` list. **San Diego College
of Continuing Education (MIS code 076) is a real MAP entity (id 119) teaching 4 CNA
courses**, and a naive swap to the coded join would have silently dropped it from a
61-row deliverable. Coded key first, name fallback second, and the 61/61 assertion
holds either way. Its ID cell says *"Not in the identity crosswalk (continuing
ed)"* rather than sitting empty.

**Reported back to SkyLink** as a scope finding on their file, not a defect: the CE
institutions carry their own MAP `college_id` and are invisible to anything joining
through that crosswalk alone.

---

## 2026-08-12 (later) — the noncredit lens, and a count that overstated by 6x

Ashley: *"can you please run this for non credit courses."* Two readings, materially
different, so both were measured before choosing: restrict the **CNA side** to
noncredit (23 of 61 colleges) or restrict the **receiving side** to noncredit. Built
as a `--lens noncredit` flag on the same generator — same instrument, a lens, not a
fork — which answers both at once.

### The finding is the opposite of the intuition

Noncredit is where a non-college provider's 80-hour course *ought* to land: no unit
cost, no transcript friction, the cleanest possible ask. **It is almost never
available.**

- **23** colleges teach CNA as noncredit (63 of the 153 CNA courses).
- **6** of those have any noncredit receiving course.
- ⭐ **1** has a noncredit course that matches an actual HTH module — Saddleback's
  `PH404NC INTERPROFESSIONAL COMMUNICATION IN HEALTHCARE`, which is close to a
  perfect fit.
- **15** would have to route through the **credit** course.

Cause: community-college noncredit catalogs in health are **clinical and technical**.
Of 372 noncredit courses at these colleges in the accepted TOP families, only 12
survive the HTH lens — the rest are Home Health Aide, CPR/BLS, paramedic life
support, nursing skills labs, phlebotomy, pharmacy law. The lens was not
under-finding; the courses genuinely are not there.

### ⚠️ The count overstated by 6x until it was checked

"6 colleges have a noncredit receiving course" was true and misleading. Five of the
six matched only the **7th lens — allied-health professionalism** — which catches
*Survey of Health Careers*, *Pathways to Health Careers*, *Healthcare Careers
Exploration*. A career-survey course is not where an interpersonal-skills course
articulates. Only Saddleback matched one of HTH's **six named modules**.

Fixed with a `real_module_match` flag carried per candidate, surfaced in the cell
text itself (`[career-survey course — matches allied-health professionalism broadly,
NOT one of HTH's six modules]`) and in the summary. **A broad catch-all lens must be
distinguishable from the named ones in the OUTPUT, not just in the code** — otherwise
the headline number silently absorbs it. Same family as the absence rules: a weak
match rendered like a strong one is a false positive that reads as a finding.

### Deriving formula columns from header NAMES

The two lenses ship different column sets (22 vs 20). Hard-coded summary-formula
letters would have pointed at the wrong column on one of them — silently, since
`COUNTIF` over the wrong column still returns a plausible number. `col_of(headers,
name)` removes the failure mode; verification confirmed the noncredit workbook's
formulas correctly land on **K/L/O/N/R** where the full one uses **I/J/M/L/P**.
