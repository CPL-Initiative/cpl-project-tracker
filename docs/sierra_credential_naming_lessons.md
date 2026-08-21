---
title: Sierra credential naming & the route map — lessons
created: 2026-08-10
updated: 2026-08-10
tags: [lessons, sierra, retrieval, credentials, naming, routing, privacy]
artifacts:
  - kb/supabase_chatbox_credentials.sql
  - kb/_sync_credential_catalog.py
  - .github/workflows/credential-catalog-sync.yml
  - tests/credential_catalog_sync_test.py
  - tests/suppression_floor.test.js
related:
  - "[[docs/kb-notes/methodology-a-concatenated-haystack-penalises-your-best-record]]"
  - "[[docs/kb-notes/methodology-emit-the-threshold-with-the-label-it-prints]]"
  - "[[docs/kb-notes/reference-postgres-fts-pitfalls-for-credential-titles]]"
  - "[[docs/college_action_page_lessons]]"
---

# Sierra credential naming & the route map — lessons

The workstream Sam opened with *"Sierra's access to student-level data"* and a
real transcript where Sierra said exhibit-level student counts *"aren't available
in the data I have access to right now."* Working it through ten concrete POST
questions turned out to reframe the problem twice. Append a dated section every
checkpoint.

---

## 2026-08-10 — SkyLine (Session 134): the layer already existed

### ⭐ The premise was wrong, twice

**First reframe: not an access problem.** The obvious fix — point Sierra at
`map_student_credit` — produces confidently wrong numbers. Only **6.1% of student
rows can be given a credential name** (13,488 of 220,588): the student grain is
keyed by **ACE military codes** (`AR-`/`MC-`/`NV-`/`NER-`/`MOS-`, `source_code =
'ACE'`) plus 32,360 rows carrying a `Default Area`/`Default Credit` sentinel,
while Sierra's catalog is locally-created `MAPICI-*` exhibits. Overlap: **624 of
6,280 ids**.

The control that proved it: CPR/AED, measured at **17,904 students** in the local
run, reproduces as **17** through the obvious join. Three orders of magnitude,
silently, from real tables. Today's honest *"I don't have that"* is **safer** than
the naive fix.

**Second reframe: the naming layer was already built.** `kb/unified_titles.json`
(3,813 variants → 1,987 canonical) → `kb/credentials.json` →
`credential_reference_data.js`, curated by `map@rccd.edu`. POST folds **16**
freehand titles into `POST Basic Academy`, carries the ASCCC statewide
recommendation, and knows **32 adopters vs 71 potential, zero overlap**. It simply
never reached the database Sierra queries. **This was a publish step, not a build.**

Third session running where the best catch came from reading a committed artefact
rather than generating a new one.

### The measures need naming too

POST has **three student counts, all defensible, all different**: 30 (the
reference's `students_served`, from `TotalStudentsForCR`, documented as
overstating), 28 (truly distinct, nameable exhibits only), 236 (summing
`distinct_students`, double-counting across recommendations). Wire any one without
deciding which it *is* and Sierra states an integer another surface contradicts.

⚠️ **Sam's definitions 2 and 3 are not computable today.** "Distinct students
where Applied Credits > 0" needs credit columns at student grain;
`map_student_credit` has five columns and **the four credit columns were dropped
at load**. His 29-column export carries them. That is a re-load, not a Malone
dependency, and it is the only hard blocker on route CRED·VOLUME.

### What shipped

| PR | What |
|---|---|
| #1091 | Suppression floor k=5 → **10**, mask derived from an emitted value |
| #1092 | `chatbox_credentials` published — **1,987 rows live**, 0 suppressed counts leaked |
| #1093 | Fixed the one test the floor change broke |
| #1094 | CRED·STD retrieval functions, version-controlled |

### Route CRED·STD took three passes, each failure informative

1. **Trigram over the whole haystack** → `peace officer` returned *Correctional
   Officer*, not POST. Cause: length normalization means **the best-curated
   records rank worst**. Distilled to
   `methodology-a-concatenated-haystack-penalises-your-best-record`.
2. **Best single variant** → fixed `emt`; `peace officer` still wrong, because
   *Report Writing for Peace Officers* matched on **title** (tier 3) while POST
   matched on a **variant** (tier 4), and tier outranked standing.
3. **`statewide` is a FILTER, not a tie-break** → correct. Someone asking for the
   statewide recommendation only wants statewide credentials.

⭐ **A route's purpose changes its ranking.** Not one retrieval function with
per-route filters — the ordering itself is route-specific.

Final defect: `cpr` matched *EMT Certification* via the variant *"Emergency
Medical Technician NRE and CPR"* — a real substring, an incidental mention, the
wrong credential. Fixed with a **measured** tier-4 similarity floor (0.098 wrong
vs 0.727/0.711 right → floor 0.25, in open space), plus `matched_via` so an
incidental hit is visible rather than silent.

**Zero rows is a result, not a failure.** `search_credentials_any()` is the honest
second half: *"No statewide recommendation for CPR; 'First Aid, CPR & AED' is in
the catalog with local articulations only."*

### A near-miss worth keeping

The `emt` ordering *also* looked wrong. Before fixing it I checked, and the cause
was `string_agg(... order by tier)` in **my own test query** — the function had
ordered correctly all along. Probe the thing, then verify the probe before fixing
what it accuses.

### The route map

Ten questions collapse to **nine routes / four subject families**. Six are served
by publishing the naming layer alone, so **the router and the naming layer are the
same work**. The cost of a router is **misrouting** — answering the wrong question
confidently — so a route must never be the only path: low confidence falls back to
general retrieval, and routing predicts the *question*, never the data.

### Next

1. Wire CRED·STD into `cpl-chat` + commit the route assertion.
2. `CRED·ADOPT`, then `COLLEGE·CRED` (carries Sam's Mt. SAC Request-Review
   language — route the seeker to **their own college's** Request Review button,
   which dissolves the poaching tension).
3. Re-load `map_student_credit` with its credit columns → unblocks CRED·VOLUME.
4. **L3 does not exist**: no grouping of credentials into occupational families.
   Grow it from `kb/occupation_credential_map.json`, and prove it on Real Estate
   rather than POST.

### ⚠️ A correction I had to make the same day

I wrote, in four places, that `map_student_credit`'s four credit columns were
**"dropped at load."** That was an *inference* from two true facts — the table has
five columns, and `funding/_student_detail_local.py` sums four credit columns from
a 29-column export — and it was **wrong**. Sam's `Tbl_MAP_STUDENT_CREDIT` export is
five columns by construction. Nothing was lost in loading.

He caught it by asking the obvious question — *"isn't it just a Supabase issue
needing the re-load?"* — and uploading the actual files. Measured:

| File | Rows | Credits | Student key |
|---|---|---|---|
| `20260808_Tbl_MAP_STUDENT_CREDIT` | 220,588 | no | yes |
| `Qry3_export` | 204,714 | yes | **no** |
| `TblCOLL_STU_EXH_CR_UNIT` | 171,439 | yes | **no** |

`Qry3_export` is already live and reconciles to the cent. The real source is
**`TblSOURCE`, the raw MAP extract at 537,908 rows**, which carries the credits
*and* `CPLStatusPlan` at student grain.

The lesson is not "check your facts" — it is that **"dropped" and "never present"
are different claims with the same symptom**, and I asserted the one that implied
someone had made a mistake. The symptom (five columns) was compatible with both.
Prefer the description of the observation over the reconstruction of its cause,
especially when the reconstruction assigns fault.

### Open for Sam

- Adopter-vs-potential wording when the asker's own college isn't an adopter.
- MAP has **no "Apprenticeship" CPL type** — six values only (Credit By Exam 798 ·
  Industry Certification 671 · Portfolio Review 238 · Standardized Assessment 125
  · Military 43 · Other 22). Any apprenticeship filter returns 0, which reads as
  "we do none" when the truth is "MAP doesn't classify it separately."

---

## 2026-08-10/11 — SkyRoute (Session 138): the answer that looked like a search failure

### ⭐ The premise was wrong a third time

Sam pasted a live transcript: *"How many students statewide are eligible for
credit for a CompTIA cert? And for which certs?"* Sierra replied that no
statewide CCC recommendation *"has been adopted yet"* for CompTIA, that the query
*"didn't surface specific CompTIA exhibit records,"* and then listed A+,
Network+, Security+, Cloud+ and CySA+ as certs *"commonly articulated at
community colleges nationally."*

MAP holds **14 CompTIA credentials, 10 of them with statewide ASCCC
recommendations**, 114 adopter-college lines.

Every signal pointed at retrieval. **Retrieval was fine.** One query settled it:
`search_statewide_recommendations('comptia')` returns A+, Tech+, CySA+, Cloud+ at
tier 3, and every other probe that question generates (`students`, `statewide`,
`eligible`, `students statewide`, `eligible comptia`) correctly returns nothing.
Had the fix followed the accusation it would have been a rewrite of a working
function — the `aed` shape again.

The real gap was the half Sierra stated **honestly** and that is easy to skim
past: *"I don't have a CompTIA-specific student count."*

Distilled: `methodology-a-retrieval-miss-and-a-data-gap-look-identical`.

### The invented list was correct, which is worse

"A+, Network+, Security+, Cloud+, CySA+" is right. A reviewer sees a plausible,
accurate answer and files no bug — so the behavior survives to a question where
the guess is wrong. **Accidental correctness is not evidence of grounding.** The
prohibition is now explicit in `VOLUME_RULE`, because a fluent invented list is
indistinguishable from a retrieved one at read time.

### The bridge was already in the curation

`map_student_credit` carries per-college exhibit ids and no credential name
(`MAPICI-CAC1-1-001` is Long Beach's A+, `MAPICI-CA-1-001` is West LA's).
Folding those is exactly what curated `raw_variants` does:

`exhibit_id` → `chatbox_exhibits.exhibit_title` → `raw_variants` → `unified_title`

**1,886 of 2,050 ids fold (92%)**, 13 ambiguous (benign near-duplicates like "AP
Physics 1" vs "AP Physics 1: Algebra-Based") and flagged rather than silently
resolved. Fourth run in a row where the catch came from an existing artefact.

Answers now: CompTIA A+ **115 students / 7 of 21 colleges**, Security+ 57 / 6 of
17, Network+ 20 / 5 of 21, POST Basic Academy 27 / 10 of 32.

### The floor is a column, not a caveat

Only **22,606 of 537,908 rows (4.2%)** can be named — 436 credentials, 36
colleges — because the corpus covers 59 of 123 colleges. So `colleges_adopted`
sits in the same row as `students`; a caveat in prose survives exactly as long as
the paragraph around it, and dies the moment a figure moves to a slide.

Two states must never render alike: `students_suppressed = true` (real students,
under k) versus `colleges_with_student_data = 0` (nothing there). Bakersfield
makes it vivid — 57 nameable students of 582, so a bare "2" for Credit by Exam is
a visibility artefact, not a finding.

Distilled: `methodology-publish-the-denominator-with-the-number`.

### ⚠️ I shipped a disclosure leak, and the checkpoint caught it

Two privacy defects, one caught during the build and one only at checkpoint:

1. **Masking the count while publishing the units.** At one student, "3.0
   potential units" *is* that student's record. Caught before shipping; under k
   every measure now nulls together.
2. **No complementary suppression** — shipped, live, and only found because the
   checkpoint re-read ADR decision 5 and tested it. Units sum, so
   `statewide − Σ(published siblings)` recovered a lone hidden cell exactly:
   **AP Chemistry 755.00 − 695.00 = 60.00**, twelve-plus credentials in that
   shape.

The row-level assertion returned **0 leaks the whole time**. **A suppression test
must model the attack, not the field.** Fixed by suppressing the smallest
published sibling when a cell would otherwise stand alone (16 complement cells);
both assertions now live in the committed SQL.

### Sam's decisions this run

1. **Floor + coverage, always** — never a bare per-credential count.
2. **Map the CPL-type boxes to MAP's real six**, and source Apprenticeship from
   `apprenticeship_credits` instead (no such type exists; a filter returns 0 and
   reads as "we do none").
3. **"Fewer than 10", not silence** — a bounded range confirms activity exists,
   stays FERPA-safe, and Sierra explains the protection when asked.
4. **Revisit the k=10 floor later.** Measured for him: it hides **320 of 436
   credentials but only 5.1% of students and 5.4% of units** — the price is
   breadth, not volume.
5. **The 100% on the Course Credit tab is unhelpful** — *"makes me think I can
   check the box and be done."* Confirmed: the 14 colleges at 100% carry
   **155,153 dormant units**, averaging 11,082 each.
6. **Show the design before publishing.** Mock-up built on real Bakersfield data,
   then extended on his direction: expandable boxes with per-population funding,
   Eligible + Transcribed boxes, averages in the header, a funding box, per-type
   student counts.

### Also worth keeping

- **Two "average applied" figures differ 2.2×** — 4.78 across all 582 CPL
  students, **10.62 among the 262 who actually received credit.** Show both.
- **Two CI assertions were already red on `main`** before this branch, broken by
  CRED·STD and unnoticed because `test` is non-required. They pinned argument
  order and template adjacency, not the contract.
  `methodology-assert-the-contract-not-the-argument-order`.
- **The smoke test validates the version it replaces** — it auto-triggers on
  push, the deploy is a manual dispatch, so the green run at 23:35 tested v37
  while v38 landed at 23:47.
  `methodology-order-the-post-deploy-check-after-the-deploy`.

### Next

1. **EACR prescriptive layer → Supabase.** `statewide_prescriptive.js` knows *the
   likely local course each college already teaches*, which turns "adopt CompTIA
   A+" into "adopt it against CIS-25, which you already run." Sam spotted this.
2. **Build the College tab** once he has reacted to the mock-up.
3. **COLLEGE·CRED**, carrying his Mt. SAC Request-Review language.
4. Re-point the Course Credit tab's headline off the saturating course share.

---

## 2026-08-21 — SkyVouch: a candidate list read as a census

**PR #1277, cpl-chat v52.** Sam asked what LACCD should do for its colleges.
Sierra opened with **"Three LACCD colleges appear in the MAP platform data"**,
tabulated three, and closed the *same answer* with "across all nine LACCD
colleges" — a number the retrieval never gave her.

### Nothing was missing

| Check | Result |
|---|---|
| LACCD colleges in `map_colleges` | 9 of 9 (ids 49, 69–75, 115) |
| In `chatbox_college_profiles` | 9 of 9 |
| In `map_college_credit_summary` | 8 of 9 (LA Southwest, k=10) |

The three were `.slice(0, 3)` on the tie list in `detectAndFetchCollegeProfile`.
The query reduces to `["angeles", "district"]` — `"los"` is under four characters
and `community`/`college` are stopwords — so all nine score 1, all nine tie, and
three survived the slice.

### ⚠️ The lesson was already learned 34 lines above

The per-word query in the same function carries this comment:

```js
.limit(12);   // "angeles" alone matches 9; a limit of 3 truncated the answer
```

The identical bug, on these identical nine colleges, fixed *there* and left
standing *here*. That is why LA Harbor came back and the other six did not.
Fixing one instance did not prompt anyone to ask where its twin was.

### ⭐ Raising the cap would have been worse

3 → 12 returns all nine and yields *"Nine colleges appear in the MAP platform
data"* — still a name match presented as MAP's contents, still false, and
**harder to spot**, because nine is right for LACCD and wrong for every district
whose colleges are not all named after it. A plausible wrong answer survives
review that an implausible one fails.

So the cap became one shared `CANDIDATE_MAX` (the two bounds can no longer
drift), and the load-bearing change is the **disclosure**: rows are stamped
`_match`, and `buildCollegeContext` declares the set a candidate list, ships
shown-of-total, forbids the exact sentence with the count interpolated, states
that a district cannot be enumerated, and forbids filling the gap from general
knowledge.

**⚠️ Stamp the ROW, not the array** — `withLiveContacts` does `profile.map(attach)`
and `buildCollegeContext` does `profiles.map(...)`, so a property on the array is
dropped by the first of those.

### Verification worth copying

`tests/sierra_candidate_census.test.js` lifts the **real** functions via
`tests/lib/lift_ts.js` rather than re-implementing them, and runs Sam's actual
sentence through the actual matcher: pre-fix it returns exactly the three
colleges from his screenshot. 30 checks, 23 red pre-fix.

Three of my own checks were wrong before the code was — a regex that could not
span `(s) => s.college`, a lift naming a constant that did not exist pre-fix (so
the demonstration was skipped rather than failing), and a null guard whose `|| []`
precedence let the throw run anyway.

### Open

Smoke **mode 7** still greps model prose for a nearby college name, so it reds
intermittently on correct answers — `methodology-assert-what-retrieval-returns`
already calls it "the last place still grepping an answer".

---

## 2026-08-21 — SkyApply: the district dimension landed and nobody wired it

Sam re-asked the LACCD question after #1277 and reported three things. All three
were code, none needed a `sierra_guidance` slot.

### 1. The caveat was obsolete the day it was written

`index.ts` carried, in a comment: *"Sierra has no district dimension at ALL
(verified 2026-08-21: zero columns named district in the whole public schema)."*
True when written. **PR #1278 landed `district`, `mis_district_code`,
`district_type` on `map_colleges` a few hours later** — 118 of 128 rows, 73
districts. The capability arrived; the consumer never changed.

⭐ **The caveat was the small half.** LACCD is the easy case — all nine colleges
are named "Los Angeles", so name-matching finds them. Measured across the
roster, **four multi-college districts have ZERO colleges named after them**:

| District | Name-matched | Actual members |
|---|---:|---|
| Los Rios | 0 | American River · Cosumnes River · Folsom Lake · Sacramento City |
| Peralta | 0 | Berkeley City · College of Alameda · Laney · Merritt |
| State Center | 0 | Clovis · Fresno City · Madera · Reedley |
| Kern | 0 | Bakersfield · Cerro Coso · Porterville |

For those, the honest caveat was the only answer available. `resolveDistrict()`
makes them answerable.

⚠️ **A roster may only call itself complete because the join was measured** — all
116 district colleges have an exact-name row in `chatbox_college_profiles`, 0
missing. A partial roster presented as complete is the census defect with better
provenance, so `missing` is carried and stated.

⚠️ **Intent is required or the route eats ordinary questions.** The stem of "Los
Angeles Community College District" is inside a question about Los Angeles City
College. An acronym resolves alone; a stem needs "district" or a plural cue.

### 2. "Students Awarded" was WRONG, not just badly labelled

Sam asked for the column to read "Students in MAP". It is a correctness fix:
**Los Angeles City College reads 0 applied units, 0 transcribed units, and 147
"students awarded"**. You cannot award credit to 147 students while applying zero
units — the figure counts students with a CPL record. MAP's own source column is
titled "Students Awarded" and `excel_to_dashboard.py` carries the name through.

Sierra had stated it to a district as a finding: *"LA City has 5,623 eligible
units and 147 students already awarded."*

⚠️ **Transcribed units were already in the context** and the model simply did not
tabulate them. Shipping a figure is not the same as asking for it.

### 3. Alpha sort, for a reason worth recording

Sam: ranking a district's own colleges by units invites inter-college rivalry.
Sorted before the rows reach the model, with the order stated in the header so
it is not re-sorted.

### The guidance budget, measured while there

`fetchTeamGuidance()` applies `.eq("active", true)` **before** `.limit(10)`, so
deactivating a row does free its slot (9 active / 4 inactive / 4,720 of 9,000
chars). ⚠️ **The row cap is a fossil**: on 2026-08-12 per-rule went 500 → 1,500
and the total 2,500 → 9,000, and `GUIDANCE_MAX_RULES` stayed at 10 — so the
char budget would carry ~17 at today's average length. ⚠️ **And eviction is
oldest-first and silent**, so the rule most at risk is the standing **naming
rule** (2026-07-03), not the reactive one written this afternoon.
