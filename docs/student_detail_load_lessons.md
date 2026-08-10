---
title: Student-detail load — lessons
date: 2026-08-08
tags: [lessons, student-data, supabase, access, disposition, veteran-sprint, ingestion]
artifacts:
  - map_student_credit (Supabase, reviewer-only)
  - docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md
  - docs/kb-notes/methodology-a-successful-import-is-not-a-correct-one.md
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
  - "[[docs/kb-notes/methodology-small-cell-suppression-must-survive-subtraction]]"
---

# Student-detail load — lessons

The lane that takes MAP's per-student CPL export from Sam's Microsoft Access
aggregates into Supabase, so the project can answer what colleges have **acted
on**, not merely what credit exists.

---

## 2026-08-08 — SkyNaut (Session 128): the table is live, and the handoff's plan was wrong in four places

### (a) What shipped

**`map_student_credit` is live and verified at 220,588 rows** — 42,346 distinct
students, 111 colleges, 8 catalog years. Reviewer-only RLS, **no write policies
at all**, never readable by the anon key Sierra's widget uses.

Division of labour, per the session-127 handoff: **Claude does the DDL, Sam does
the data.** That held, and it worked.

### (b) The handoff's schema was wrong in four places, all caught by looking at real rows

Every one of these was found by asking for actual data instead of designing
against the spec. None would have errored — they'd have produced a table that
looked right.

**1. "`ExhibitID` and `Source Code` both null" — only sometimes.** MAP supplies
its own sentinel `"Default Credit"` for the basic-military **-Course** variant.
The **-Area** variant genuinely is blank. And a third no-value spelling exists —
a literal **`"-"`** at Antelope Valley. Three representations of "no value"
across three colleges.

**2. The primary key did not hold.** `(student, college, exhibit, catalog_year)`
collided on ~8% of rows: the same exhibit appears for one student in one year
both as a bare recommendation (`course_type` blank) *and* as an awarded mapping
(`Course credit (1)`). `course_type` had to go **into** the key. Those are two
different facts, not a duplicate.

**3. `course_type` is two vocabularies, not one.** The handoff (and Sam's own
initial statement, correctly scoped to blank-ExhibitID rows) described three
values. The full enumeration is **eleven**: the basic-military family
(`…-Area` / `…-Course` / `…-Elective`) *plus* an articulated-exhibit family
(`Course credit`, `Course credit (1)`–`(4)`, `Area credit`, `Elective credit`,
`Elective credit (1)`), plus blank.

⭐ **That turned out to be the session's biggest win** — see (c).

**4. The Sprint goal-2 formula divides by zero.** The handoff specified
`CourseCredits ÷ (CourseCredits + AreaCredits + ElectiveCredits +
DefaultAreaCredits)`. On unapproved rows **all four are 0**, so the metric is
undefined on exactly the backlog population the Sprint exists to move. Worse,
Allan Hancock's *applied* rows put credit in `DefaultAreaCredits` even when
mapped to real courses (`PE-140`, `HED-100`), so a `CourseCredits`-based ratio
would score a college doing the right thing at 0%.

⭐ **Sam called this before I did** — *"I don't think we can rely on the Default
Units to determine anything...except that they haven't approved them yet."*
Exactly right, and sharper than he put it: it isn't imprecise, it's undefined.

### (c) The measure that replaced it

`course_type`'s own suffix carries the destination, on **every** awarded row —
articulated exhibits included, not just basic military:

| Destination | Rows | Students | Colleges |
|---|---|---|---|
| Nothing awarded yet | 156,562 (71.0%) | 26,442 | 111 |
| **COURSE** ✅ | 38,393 | 26,960 | 73 |
| **AREA** ❌ | 20,359 | 20,098 | 75 |
| **ELECTIVE** ❌ | 5,274 | 3,918 | 23 |

**Sprint goal 2, statewide, first time it has existed: 60.0% of awarded credit
goes to real course credit; 31.8% to a GE area; 8.2% to generic elective.**

**47% of every CPL student in the system** (20,098 of 42,346) holds at least one
award pointed at a GE area. `AREA` runs ~1.0 rows per student — the
basic-military signature, one 3-or-4 credit Area E award each — while `COURSE`
runs 1.42, so course credit arrives in multiples and area credit is one-and-done.

Two properties make this measure durable where the previous one wasn't:

- **`course_type` is MAP-generated.** Everything that broke during this session —
  `College Course` = `-`, the destination migrating between columns, `Status`
  being empty — is a field *colleges fill in themselves*. This one isn't.
- **It works on the backlog.** It needs no credit-bucket columns, which only
  populate after a college acts.

### (d) Why "read it from `College Course`" was also wrong

Worth recording because it was my proposal and it survived exactly one snippet.
Three colleges, three layouts:

| | `Credit Recommendation` | `College Course` |
|---|---|---|
| Allan Hancock (`-Course`) | Physical Fitness Laboratory | `PE-140 Physical Fitness Laboratory` |
| American River (`-Area`) | Living Skills Graduation Requirements | `CSU GE E – Lifelong Understanding…` |
| Antelope Valley (`-Area`) | **CSU-GE Area E** | **`-`** |

The destination lives in *different columns at different colleges*. That was the
third single-column rule to break in a row, which is what finally pointed at the
column colleges don't control.

### (e) The import silently duplicated 2,058 rows and reported success

Staging held **222,646** against a 220,588-row file — 2,058 groups, each exactly
twice. Sam re-imported the CSV back into Access and got 220,588, isolating the
fault to **Supabase Studio's CSV importer** re-sending a committed batch.

Distilled to [`methodology-a-successful-import-is-not-a-correct-one`](kb-notes/methodology-a-successful-import-is-not-a-correct-one.md).
The short version: both endpoints were correct, the transfer wasn't, and only a
count comparison across the boundary could see it. Over-counting by 0.93% is far
more dangerous than losing rows — it stays inside the range where a number still
looks plausible.

### (f) The disclosure-control decisions (ADR #1049/#1050)

Sam proposed skipping a shielded table: publish granular aggregates, show cells
under 10 as `<10`, keep real totals. The direction is right; that exact
combination is the failure this repo documented on 2026-08-06 — a published
total plus every sibling makes the hidden cell recoverable by subtraction.

Ratified: **k=10**, reviewer-only base + a separately-built published aggregate,
**suppression at write time**, thin cells show existence with no breakdown
(Sam's option b), complementary suppression at every level publishing a total,
suppression driven by distinct-student count **taking the credit sums with it**.

⚠️ **And a landmine:** the handoff said to give this table *"the same gate as
`kb_curation`."* Measured live — `kb_curation_read` is
`SELECT / {public} / USING (true)`. **`kb_curation` is world-readable.** Only its
*writes* are gated. Following that instruction literally would have published
student-grain rows to the anon key, which the very next line of the same
paragraph forbids. The correct template is `team_access`.

### (g) Current state

- ✅ `map_student_credit` live, 220,588 rows, verified, reviewer-only
- ✅ Staging table dropped
- ✅ Goal-2 statewide measured
- ⬜ **Per-college** goal-2 split — the actual deliverable, and where k=10 +
  never-rank-publicly start binding
- ⬜ `TblCOLL_STU_EXH_CR_UNIT` not yet loaded — so everything above is
  **recommendation counts, not credits**. The "how many credits sit dormant"
  headline still needs it.

### (h) Open questions

- **111 colleges, not 123.** Twelve have no rows. Genuinely no activity, or an
  export filter?
- **249 rows have a blank `catalog_year`.** Legal (it's `''`, not null) but
  unexplained.
- **The handoff's flagship claim needs re-measuring.** It called basic-military
  *"plausibly the largest and cheapest block of unawarded credit."* American
  River fits it perfectly (32 students, all Area E, all Needs Action); Allan
  Hancock is the counter-example (all applied, real courses). **The variance
  between colleges is the finding**, and it's more useful than the aggregate —
  "some colleges have solved this and here's what solved looks like" beats
  "colleges haven't done this."

### (i) Next concrete step

Build the per-college goal-2 split off `map_student_credit`, applying the #1049
suppression rules, then load `TblCOLL_STU_EXH_CR_UNIT` so the same analysis can
speak in credits rather than row counts.

---

## 2026-08-08 (part 2) — SkyNaut: the second table, and the number that did not exist

### (a) What shipped

**`map_college_cr_unit` is live — 204,714 rows, reconciled exactly** against the Access count. Aggregate (no student
identifier), carrying the credit funnel at `(college × exhibit × CR × college course × disposition × catalog year ×
course type)`.

Two published aggregates now sit on top, both with suppression applied at write time:
`map_college_goal2` (the three-way destination split) and `map_college_credit_summary` (credits).
Plus `map_colleges` (the id↔name↔kind lookup) and `map_data_loads` (provenance).

### (b) ⭐ The numbers

| | |
|---|---|
| **1,052,531** | units of credit at Needs Action — already earned, never awarded |
| **64,074** | of those **already articulated** — everything built, nobody acted |
| 111,779 → 60,246 | applied → transcribed (**54%**) — the next gap |
| 60.0% / 71.7% | Sprint goal 2 statewide / median college |

**Lead with the 64,074, not the million.** The million is a ceiling: of credit already dispositioned, ~65% was applied
and ~30% correctly found **Not Applicable**. Ruling a recommendation out is legitimate work, and a public framing that
implies otherwise will be corrected by someone else, less kindly. The 64,074 is a to-do list — no faculty review, no new
exhibit, no negotiation, just action.

### (c) The duplicate-key error was not a data defect

The first import targeted the strict table and failed at ~8,008 rows. The instinct was that the export had duplicates.
It did not: **zero colliding groups on the natural key, zero case-insensitive collisions, and staging landed at exactly
204,714.**

It was **Supabase Studio re-sending a batch** — the same bug that silently added 2,058 rows to the `map_student_credit`
load. The difference is that the strict table had a **primary key**, so it stopped rather than absorbed.

⭐ Two lessons, and they point in opposite directions until you hold both:
- **Staging makes the load succeed** (it captures the file whatever its shape).
- **The primary key is what DETECTS corruption** (it refuses to absorb it).
Use both: stage to capture, then let the PK on the strict table be the gate. And note the bug did **not** recur on the
staging import — it is **intermittent**, which is exactly why a count check that "passed last time" proves nothing.

### (d) ⭐ Sam was right and I had not checked

Asked three times for a `CollegeID → name` export. He pushed back: *"You should have all the variations we've used in
memory."* **`map_college_users` had it all along** — the only table carrying MAP's numeric CollegeID beside a name, same
namespace as the export (17 = Allan Hancock, verified against `TblSOURCE.Location`).

The same failure this workstream keeps cataloguing — assuming instead of measuring — pointed at a person rather than at
data. And checking produced a better result than the thing I set out to build: across five name-keyed tables, **123
distinct names, 120 resolve, ZERO spelled differently.** Our tables do not disagree with each other; they all descend
from one MAP sync. The variation is against **external** CCC sources, so `variants[]` should accumulate outside
spellings as sessions meet them rather than being harvested internally. It ships empty and says so.

### (e) `entity_kind`, and what it exposed

Sam, on unnamed high IDs: *"they're probably our agency partners… CPL Landing Pages for outside training agencies."*
MAP's `CollegeID` **1–118 are the CCC colleges alphabetically** (117 Woodland, 118 Yuba); above that sit continuing-ed
institutions, agency partners and test entries.

⭐ **Every non-college entity is at ZERO awarded credit** — 127 trainees across five institutions, not one award, while
colleges convert 29% of recommendations. That reframes the NC roadmap row: they are **not at zero on recommendations**,
they are at zero on **awards**. For the landing-page work that is the whole case — you would be sending people to a door
that has never opened.

Also verified, and it could have invalidated everything: **no test college appears in the student data**, so the 60.0%
and 71.7% figures are clean.

### (f) Current state

- ✅ Both tables live and reconciled; both staging tables dropped; both loads recorded
- ✅ Course Credit tab live with goal 2 **and** credits, 44 committed checks
- ✅ Procedure committed as `playbook-access-export-to-supabase` — no longer needs a session
- ⬜ **Sierra reaches none of it.** No retrieval path in `cpl-chat`, tables gated to reviewer/team
- ⬜ Nightly still manual — blocked on MAP publishing the view (spec drafted, name expected next week)

### (g) The decision blocking Sierra

**May a public assistant state a named college's unawarded-credit figure?** Sierra is **deployed on COBI only** (Sam,
2026-08-08 and again 2026-08-10) but is *intended* for colleges' pages, and `cpl-chat` ships `--no-verify-jwt`, so
*"your college has 12,000 units unawarded"* is a public per-college performance statement either way. "Never rank
colleges publicly" is standing. This is Sam's call, not an engineering one, and it gates the retrieval work behind it.

### (h) Next concrete step

Get that decision, then wire Sierra: retrieval path against the published aggregates, service-role read (the function is
server-side, so RLS need not be widened), prompt rules carrying the ceiling caveat, smoke assertions, deploy.

---

## 2026-08-10 — SkyLine (Session 137): the re-load landed, and two measures came apart

### (a) What shipped

`map_student_credit` is **537,908 rows, 16 columns**, re-loaded from `TblSOURCE` (the raw MAP extract) and live.
The prior 5-column table is retained as `map_student_credit_prev`; rollback is renaming the two back.

The load was gated, not assumed. What the gates caught, in order:

| Gate | Result |
|---|---|
| Row count | 543,579 — **+5,671 over expected** |
| `source_row_id` distinct | **537,908** ✅ |
| Duplicate payload conflicts | **0** — every duplicate byte-identical on all 15 payload columns |
| `student_key` range | dense **1…42,346**, 42,346 distinct |
| Credit columns parseable | 8/8, 0 bad |

⭐ **The importer duplicated for the third measured time** (0.9% at 220k, 1.5% on the first 537k attempt, 1.05% here).
It is a property of the Studio CSV import, not of any one file. `source_row_id` was made mandatory *because* of the
earlier occurrences, and it is what made this load recoverable — `distinct on (source_row_id)` was provably lossless.
**Never load this table without a row identity column.**

### (b) The reconciliations that made the swap safe

Two independent checks, from a *different source file* than the original load:

1. Collapsed to the old five columns, the new table yields **exactly 220,588** — the prior table's row count to the row.
2. Needs Action sums to **1,053,332.50** — the all-entity figure already documented in `CLAUDE.md`, **to the cent**.
   Also 81.2% of rows at Needs Action (documented 81%) and 31.1% of reviewed credit Not Applicable (documented ~30%).

And the one that actually licensed the swap: `(college_id, student_key, course_type)` is **set-identical** between old
and new — 81,007 triples, 0 differences either direction. That is what guaranteed `map_college_goal2.students` and
every suppression decision would be unchanged. After rebuild they were: **0 diffs both directions**, all three of the
script's own assertions returning 0, and `map_college_credit_summary` **byte-identical** (headline still
1,051,870.00 / 63,991.00).

### (c) ⭐ The two "applied" measures disagree by 55%

| Basis | Students |
|---|---:|
| `applied_credits > 0` (Sam's definition) | **18,889** |
| `cpl_status_plan = 'Applied to CPL Plan'` | **29,292** |

The gap is **24,885 rows** marked applied carrying zero applied units — and **24,561 of them have articulated credit
behind them**, so it is not "nothing to award". 12,375 students across **32 colleges**.

**Sam's call: publish both, name the gap** — surface it as a data-quality finding for colleges rather than silently
resolving it. Shipped as the view `map_applied_zero_units` (reviewer-only, `security_invoker = true`).

⚠️ One thing that looked like evidence and was not: every college in that worklist shows **0.0% transcribed**, which
reads as a finding until you check that `transcribed > applied` **never occurs** (0 rows) — credit cannot be
transcribed without first being applied. The 0.0% is a tautology. Verify that a striking number *can* vary before
reporting it.

### (d) ⭐ Batch-uploaded transcribed credit (Sam's domain knowledge)

Sam: *"some colleges batch upload student lists where they have already transcribed credit. Credit by exam, AP, IB,
and CLEP are frequent examples… SDCCD was the first to do this for thousands of students."*

It is visible in the data as a **shape**, and it explains three of the largest movers:

| College | Rows | Students | Exhibits | Rows/student |
|---|---:|---:|---:|---:|
| San Diego City | 2,982 | 2,836 | 28 | **1.05** |
| San Diego Mesa | 3,487 | 3,094 | 37 | **1.13** |
| San Diego Miramar | 1,776 | 1,502 | 44 | 1.18 |
| Merced | 4,819 | 3,048 | 63 | 1.58 |
| *West LA (individual review)* | *2,580* | *563* | *28* | *4.58* |
| *Norco (individual review)* | *830* | *270* | *140* | *3.07* |

**Batch upload ≈ 1 row per student, few exhibits, thousands of students.** Individual review ≈ several rows per
student across many exhibits (Modesto 207 exhibits).

⚠️ **Consequence: transcribed credit exists at only 24 of 111 colleges.** It measures *recording practice* as much as
student outcomes, and a college that batch-uploads is transformed overnight without changing what it does for
students. This independently supports Sam's standing call that **applied, not transcribed, is this phase's target** —
and it is a strong argument never to rank on transcribed.

### (e) ⚠️ A documented fact was half artefact

`Default Area` does **not exist** in the raw extract — 0 rows. The prior load synthesised it for 18,127 rows where
`ExhibitID` was null. `Default Credit` is genuine MAP data (24,556). So the recorded "32,360 `Default *` sentinels" was
part MAP, part invention. No code consumes it (the three code hits are the unrelated Custom Report field
*"Default Area Credits"*), so the new table preserves the raw values.

Same family as the `dropped at load` error corrected earlier the same day: **a transformation applied at load time
becomes, one document later, a stated fact about MAP.**

### (f) ⭐ A correction I had to make to my own recommendation, mid-conversation

`rows_n` changed with the finer grain (59,586 → 91,793), which moved the **COURSE share** for 43 of 96 colleges
(avg 2.6 pts, max 43.3). I recommended switching the share to a **distinct-student** basis, because that measure is
provably grain-invariant — 96 of 96 colleges unchanged.

Sam asked to see the colleges first. **The data killed the recommendation:** a student-based share **saturates at
exactly 100.0% for 34 of 96 colleges**, because nearly every student has at least one course-credit award. It is
grain-invariant and useless — it stops answering the question Goal 2 exists to ask.

⭐ **Grain-invariance is a property, not a virtue.** A measure that cannot move is not thereby a good measure; check it
still *discriminates* before preferring it for stability. Distilled to
`methodology-a-grain-invariant-measure-can-still-be-the-wrong-one`.

The rows-based share is kept. The new values are a **correction**, not drift, and the direction is explicable: the old
export collapsed rows sharing (student, college, exhibit, course_type, catalog_year), so an exhibit recommending
credit for *several specific courses* became one row while a *single area* award did not — systematically
under-counting course awards. **38 of the 43 moved up**, as that bias predicts. The one to know about is
**San Diego City College, −15.7 points at 4,252 students**.

### (g) Current state

- ✅ `map_student_credit` 537,908 rows live, reviewer-only RLS, 0 write policies, 4 indexes, 2 check constraints
- ✅ Both published aggregates rebuilt and verified unchanged; all three loads recorded in `map_data_loads`
- ✅ `map_applied_zero_units` follow-up view live
- ✅ **CRED·VOLUME unblocked** — applied/transcribed computable for the first time
- ⬜ `stg_student_credit` + `map_student_credit_prev` retained deliberately (both RLS-safe) until the tab is eyeballed
- ⬜ Nightly refresh still manual — the runbook is the procedure

### (h) Next concrete step

**CRED·ADOPT** (needs no new data), then **COLLEGE·CRED** carrying Sam's Mt. SAC Request-Review language. Anything
publishing a student number takes the pair from (c) with the gap named, and must not rank on transcribed per (d).
