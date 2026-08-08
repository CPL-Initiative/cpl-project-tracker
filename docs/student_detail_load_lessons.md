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
