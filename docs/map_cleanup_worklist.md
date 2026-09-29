---
title: The CPL clean-up worklist — what to fix, in what order, and who fixes it
created: 2026-08-19
updated: 2026-08-19
tags: [worklist, cleanup, disposition, student-detail, supabase, map, prioritization]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - kb/supabase_map_cleanup_worklist.sql
related:
  - "[[docs/map_custom_report_load]]"
  - "[[docs/map_custom_reports_lessons]]"
---

# The CPL clean-up worklist

> Sam, 2026-08-19: *"Perhaps this will turn up a prioritized clean up list for
> the team to follow up on."*

**Built for the Customer Success Team** — Natalie Powell (lead), supported by
Chelsea Mirada and Ally Barker (Sam, 2026-08-19).

**`map_cleanup_worklist`** is a table, rebuilt nightly inside
`map_promote_custom_reports()` so it can never describe a different day from the
dashboard beside it. It carries the **college contact for that class of work**.

### They need the TEAM PHRASE, not reviewer access

None of the three is on the reviewer roster, and **they should not be added to it
for this.** Reviewer is all-or-nothing: beyond this list it reaches
`map_student_credit` (591,820 rows at student grain), `kb_curation`, the `gr_*`
register, and **`team_access` itself — so a reviewer can read and rotate every
team phrase.** Granting that to read a per-college summary is the opposite of
least privilege.

The list does not need it. Every row is a **per-college aggregate** — counts by
class. No student grain survives the group-by, so the table is gated
`is_allowed_reviewer() OR team_pass_ok()`, matching `map_college_cr_unit` and
`map_college_contacts`.

⚠️ **The gate dropped by MATERIALISING, not by weakening.** As a view over
`map_student_credit` it was permanently reviewer-only; relaxing
`security_invoker` would have silently bypassed the student-grain gate. Those two
changes look similar in a diff and are opposite in effect.

⚠️ **`G9` in the promotion refuses to finish if the table loses that gate.** It
is rebuilt by `DROP`/`CREATE` nightly, so the policy is re-declared every run and
a mistake would be **silent** — the table would simply be readable, and nothing
about a readable table looks wrong.

⚠️ **No k-anonymity.** Internal team tool. **Never a public surface** without the
suppression `map_college_credit_summary` applies.

```sql
-- the statewide shape
select priority, class, subclass, effort_shape, owner,
       count(*) colleges, sum(rows) rows, sum(students) students
from map_cleanup_worklist group by 1,2,3,4,5 order by 1, rows desc;

-- a call list: one college, in priority order, with who to contact
select priority, class, rows, students, owner, contact_name, contact_email, action
from map_cleanup_worklist
where college_name = 'Los Angeles Pierce College'
order by priority;
```

---

## Ranked by DECISIONS, not by rows

This is the whole design, and the project has been burned by the alternative
before: the Common CR Reference was nearly ranked by how widely a string spread,
and the widest-spreading string turned out to be a placeholder at one college.

**A class of 11,926 rows that all resolve under one rule is a smaller job than
413 rows needing 413 judgments.** (⚠️ The corollary, learned the hard way in
session 172: **check that they really do all resolve under the same rule.** The
class that looked like 17,594 one-rule rows contained 5,311 that needed the
opposite treatment — see Priority 1 below.) Sorting by row count puts them in the wrong
order, so the list carries an `effort_shape`:

| shape | meaning |
|---|---|
| `one rule` | a single policy decision clears every row at that college |
| `per row` | a human must look at each one |
| `upstream` | nobody at the college can fix it — the data arrived wrong |

---

## The list

### Priority 1 · Recommendations that cannot yield credit — **12,283 rows, ~100 colleges**

> ⚠️ **CORRECTED 2026-08-19 (session 172), before the instruction went out.**
> This class held **17,594** rows under one action: *"Rule these Not Applicable.
> ACE has already said no credit is recommended."* **That was false for 5,311 of
> them**, whose text says the opposite — *"Credit may be granted on the basis of
> an individualized assessment of the student"*, *"…on the Basis of Institutional
> Evaluation"*. ACE is **deferring to the college**, not refusing.
>
> Sending one instruction to ~100 colleges would have told them to close 5,311
> recommendations on a stated ground that contradicts the recommendation itself
> — a **false zero at scale**, and the college that acted on it would never learn
> the door was open. Those rows are now **Priority 5** below, with their own
> action and no prescription. Total is unchanged (12,283 + 5,311 = 17,594);
> what changed is what colleges are told to do with them.
>
> Two matcher misses surfaced the same way and are now covered: the corpus
> contains the misspelling **"Credit Is Not Recommeded"** (26 rows), and
> **"individual assessment"** without the *-ized* (20 rows) fell into the
> residue bucket.

ACE recommends no credit, or the recommendation's own validity window has
closed. **A college cannot act on these except to rule them Not Applicable.**
They carry **zero units of opportunity** and yet sit in the Needs Action pile,
depressing every disposition rate.

| | rows | colleges | students |
|---|---:|---:|---:|
| ACE: credit is not recommended | 11,926 | 100 | 7,744 |
| recommendation's validity window has closed | 137 | 48 | 113 |
| other zero-hour text (**read before ruling**) | 220 | 63 | 207 |

**One rule clears the lot**, and it is the same rule at every college. Heaviest
(recounted after the P1/P5 split): San Diego Miramar 1,452 · San Diego Mesa 742 ·
CCSF 615 · San Diego City 522 · El Camino 513 · Long Beach City 445 ·
Mt. San Jacinto 409 · Mt. SAC 372.

⚠️ Clearing these **raises every disposition rate without awarding a single
unit**, because it shrinks the denominator. That is legitimate — ruling a
recommendation out is real work, and the $50k measure already counts Not
Applicable as work done — but say so when the rate moves, or it reads as
progress that did not happen.

### Priority 2 · Plan says Transcribed, no units recorded — **14,348 rows, 4,196 students**

> ✅ **Settled (Sam, 2026-08-19):** *"Transcribed refers to the whole student record
> even though it is stamped on CR rows. Only when transcribed units are present we
> count those as transcribed and the others are ignored."* So the tick alone counts
> as nothing, and these 4,196 are unambiguously a defect rather than a definitional
> question. **No code change was needed** — every published figure already sums units.
>
> ⚠️ **The grain will change.** Sam: transcribed check marks on CR rows are coming,
> *"not ready yet."* When that ships, re-measure the constant-within-student test
> before trusting the per-student measurement below.

Two patterns, at **completely non-overlapping** colleges.

**2a · batch upload, units never landed — `upstream`, 3,628 students, 4 colleges.**
The plan carries the bare string `Transcribed` with no other lifecycle step,
because no workflow ran, on `MAPSAS-*` (AP / standardised exam) exhibits.
**Los Angeles Pierce 1,842 students — 73% of its students — and Merced 1,787**,
then Riverside City 14, Chaffey 2.

⚠️ **Two colleges are 94% of this class.** Despite being the largest class by
rows, it is **two conversations**, and it is not a curation task: the credit was
recorded, the unit amounts were not. It needs a re-upload, with MAP/ITPI.

**2b · full workflow completed, units still zero — `per row`, 568 students, 7 colleges.**
On `MAPCXH-*` high-school-articulation exhibits. **Moreno Valley 530**, then
Modesto 17, Bakersfield 3, East LA 1.

⚠️ **10,699 of the 14,348 rows sit at `Needs Action` while the plan claims
Transcribed** — counted in the backlog *and* claimed as done.

### Priority 3 · Marked Applied with zero applied units — **413 rows, 10 colleges**

Small and clerical: either the units were never entered or the disposition is
wrong. Long Beach City 217 is most of it.

### Priority 4 · Articulations waiting on approval — **2,225 articulations, ~45 colleges**

**Not a defect — a queue**, and the only class that names its own owner.

| stage | articulations | colleges | units |
|---|---:|---:|---:|
| Faculty | 1,055 | 45 | 8,293 |
| Initiator | 1,026 | 9 | 9,096 |
| Articulation Officer | 144 | 21 | 909 |

⚠️ **Initiator is 1,026 articulations across only NINE colleges.** A stage that
concentrated is a stalled queue at a handful of institutions, not a statewide
condition — worth asking those nine what is blocking them. Moreno Valley (401)
and Riverside City (332) carry most of it.

Counted at **articulation grain**, not rows: many students share one
articulation, so rows overstate a queue.

---

## Where the work actually is

| college | total | P1 one rule | P2 transcribed | P3 applied | P4 approval | P5 needs a ruling |
|---|---:|---:|---:|---:|---:|---:|
| Los Angeles Pierce | 10,680 | 65 | **10,600** | — | — | 15 |
| Merced | 2,975 | 12 | **2,956** | — | 1 | 6 |
| San Diego Miramar | 1,643 | **1,452** | — | — | 3 | 188 |
| Moreno Valley | 1,055 | 79 | 530 | — | **401** | 45 |
| City College of San Francisco | 946 | **615** | — | 2 | 45 | 284 |
| San Diego Mesa | 934 | **742** | — | — | 2 | 190 |
| Long Beach City | 899 | 445 | — | **217** | 33 | 204 |
| San Diego City | 753 | **522** | — | 1 | 7 | 223 |

**The mix matters more than the total.** Miramar's 1,643 is one decision;
Pierce's 10,680 is one phone call; Moreno Valley's 1,055 is three different jobs
with three different owners.

⚠️ **The P5 column is why the split mattered.** CCSF's 946 was going to be
described as 899 rows resolving under one rule; **284 of them are rows where ACE
says credit may be granted after the college evaluates.** Long Beach 204, San
Diego City 223, Mesa 190, Miramar 188 — every large P1 college carried a
substantial share.

---

## Two measurement traps this list is built to avoid

⚠️ **`cpl_plan_status` is a STUDENT attribute** — constant within a student for
47,804 of 47,804. A row-level test reports a grain artefact as a defect: a
`Transcribed` tick appears on every row that student owns, including
recommendations that were ruled out. **P2 is measured per student for that
reason**, which is why it is 4,196 students rather than the 56,614 rows a naive
test returns.

⚠️ **`applied_credits > 0` is NOT a test for "credit was awarded."** On **all
462,355 `Needs Action` rows it is identical to `articulated_credits`** — it
means credit *exists*, not that it was applied. P3 filters on the disposition
first. Scoped that way the two applied measures agree to **0.1%** (30,055 vs
30,091 students), not the 55% on record from the earlier table.

---

## Following up on Priority 2 — `map_transcribed_gap`

Sam, 2026-08-19: *"For the defects you found we want to follow up on those."*

The worklist says a college **has** the problem. `map_transcribed_gap` says
**where**, at the grain a college can search on in MAP: **exhibit × catalog
year**. 270 rows, 8 colleges, **46,496 units at stake**. Team-phrase gated,
rebuilt in the same nightly transaction.

```sql
select exhibit_id, catalog_year, students, records, units_at_stake,
       still_needs_action, ask
from map_transcribed_gap
where college_name = 'Los Angeles Pierce College'
order by units_at_stake desc;
```

⚠️ **We cannot name the students, and that is by design.** `StudentMAPID` is
salt-hashed and never stored; `student_key` is our own counting surrogate,
re-assigned nightly, identifying nobody. The college locates these records in MAP
themselves by filtering the exhibit and catalog year. Anyone tempted to "fix"
this by storing a durable student key should read
[`docs/map_dataset_sql_for_malone.md`](map_dataset_sql_for_malone.md) first — we
asked MAP for a one-way hash precisely so nobody here holds one.

⚠️ **"Units at stake" is the question, not the answer.** The plan says transcribed
and the units say nothing, which fits two different stories: the credit was
transcribed and the amount never got recorded, **or** it was never transcribed and
the tick is wrong. Only the college can say which — which is the entire point of
following up.

**Where to start.** Los Angeles Pierce is 1,840 students / 10,562 records / 46
exhibits / **35,169 units**, all on `MAPSAS` AP and standardised-exam exhibits and
all still sitting at Needs Action. Merced is 1,785 students / 8,947 units. Those
two are 87% of the whole thing.

## 12 colleges have work and nobody to call

`contact_email` is null for at least one class at **Citrus (109 rows), Allan
Hancock (99), Saddleback (63), Hartnell (53), West Valley (48), Cuyamaca (44),
Sacramento City (40), Gavilan (33), Crafton Hills (11), Feather River (5),
Orange Coast (1), Launch Apprenticeship (1)**.

That is a Customer Success to-do in its own right, and it independently
corroborates the MAP Users finding: **Hartnell and Gavilan have plenty of active
MAP users and nobody in a CPL role.** Finding the right person there is the first
step, not the clean-up.

### Priority 5 · Credit by Exam opportunities — **5,311 rows, 101 colleges, 3,898 students**

> ✅ **RULED (Sam, 2026-08-20):** *"These should be presented to students as Credit
> by Exam options for them — not ruled out by college staff (unless they don't
> permit Cx for that particular course). Later, as I curate the CCRR table I will
> normalize these ACE CRs as Cx for specific courses on the CCR."*
>
> ⭐ **This is better than the three options it was asked to choose between.** The
> question was framed as *what disposition does a college record* — and the answer
> is that it is not a disposition problem. It is an **offer nobody was making**.
> ACE defers the award to the college's own assessment; **Credit by Exam is the
> mechanism California community colleges already use for exactly that**, and it is
> the largest CPL type in the curated corpus — **798 credentials**, ahead of
> Industry Certification's 671.
>
> ⭐ **So it costs nothing to build.** The option on the table was "MAP needs a
> state it doesn't have." It doesn't. Measured 2026-08-20: **all 5,311 rows carry an
> empty `course_type`** — they are *untyped*, not refused, and an untyped row reads
> exactly like a closed one.
>
> ⭐ **One rule with one exception covers the whole class.** This looked like it
> needed two rulings (individualized assessment is 75%; swimming takes it to 95%,
> but only if swimming rules the same way). It doesn't: offering the row as Cx
> never requires deciding in advance whether swimming deserves credit — **the
> college's own Cx policy for that course decides it**, which is where that
> judgment belonged.
>
> ⚠️ **AND ITS REACH IS A QUARTER OF THE CLASS — Sam's own challenge to his own
> ruling, same day.** *"Is the CR for many of these just a vague 'College may grant
> credit based on its own assessment' — no reference to a discipline or course?
> The swimming example is a good Cx opportunity, but if there is no course or
> discipline, it's meaningless and a copout on ACE's part. Students can request Cx
> at any time provided the catalog allows for it for the particular course."*
>
> He is right about **three quarters** of it:
>
> | shape | rows | exhibits | colleges | |
> |---|---:|---:|---:|---|
> | **names a subject** — swimming, surveying, First Aid and Fire Science, Anatomy and Physiology, Air-Conditioning and Refrigeration, Gas Turbine Technology | **1,310** | 26 | 89 | ✅ sendable |
> | **names no course at all** — *"Credit may be granted on the basis of an individualized assessment of the student"*, and nothing more | **4,001** | 225 | 95 | ⚠️ **not sendable** |
>
> ⭐ **A Cx offer has to name a course to challenge.** Where none is named the
> offer collapses into *"you may request Cx"* — which every student can already do
> for any course the catalog allows. **It adds nothing the student did not have**,
> so those 4,001 are marked NOT SENDABLE and owned by the MAP team, not a college.
>
> ⭐ **The row is not empty — the RECOMMENDATION is.** Each still carries its
> **exhibit**: the military training ACE reviewed. Attach that title and the offer
> becomes concrete. ⚠️ **We already fetch it and never store it** —
> `fetch_custom_report.py` asks `View_ExhibitCRsCatalog_Dataset` for `AceID` **and**
> `Title`, and these rows are keyed on the ACE id (`AF-0101-0002`). That is a loader
> change, not a request to ITPI. ⚠️ **The join rate is NOT yet measured** — the
> catalog is fetched on the runner and never written down, so it can only be
> counted on the next run. Do not quote a coverage figure until it is.
>
> ⚠️ `chatbox_exhibits` does **not** rescue them: 0 of the 225 have a title there.
> That zero was checked against a positive control first — 785 of 6,330
> `map_student_credit` exhibit ids DO join to it, so the join works and the corpus
> simply does not carry ACE military exhibits.

> ### The guidance list — `map_cx_exhibit_guidance` (built 2026-08-20)
>
> Sam: *"a short list of the no course CRs + the title of their ACE exhibit (e.g.,
> Corpsman, Hospitalman, Rifleman, MP, etc.)… tag the generic Cx opportunity with
> an indicator of where their training might align with a course."*
>
> ✅ **The titles work: 219 of 225 exhibits resolve (97.3%), 3,963 of 4,001 rows.**
> Exactly the vocabulary he named — `MOS-11B-006` is **Infantryman**,
> `MOS-31B-002` **Military Police**, `MOS-68W-001` **Health Care Specialist**,
> `MOS-42A-001` **Human Resources Specialist**, `MC-2204-0105` **Marine Combat
> Training**. That is the deliverable, and it is real.
>
> ⚠️ **The alignment indicator is much weaker than it first looked, and the first
> build of it was wrong.** Tier 1 originally required a course named by ≥2
> colleges. That shipped a tier 1 where **11 of 14 exhibits pointed at
> `MAG-51 Elements of Supervision`** — for Infantryman, Combat Medic, Cook, Truck
> Driver and HR Specialist alike.
>
> ⭐ **Counting colleges cannot tell corroboration from a blanket mapping.** Three
> colleges blanket-map any military service to a supervision course, and three
> colleges agreeing looks identical to three colleges independently deciding. The
> discriminator is **specificity**: how many different exhibits does this course
> appear against? `MAG-51` spans **33**. `MAG-200` spans 10. `AUTOCOR-114 BASIC
> WELDING` spans 8. `ADJ-1 Introduction to the Administration of Justice` spans
> **1** — Military Police — and is worth reading.
>
> | tier | meaning | exhibits | rows |
> |---|---|---:|---:|
> | 1 | a course named by ≥2 colleges **and** spanning <4 exhibits | **3** | 689 |
> | 2 | colleges named something, but nothing corroborated *and* specific | 47 | 2,282 |
> | 3 | nobody has named a course; the title is the only guidance | 175 | 1,030 |
>
> The whole of tier 1: **Military Police → ADJ-1 Introduction to the
> Administration of Justice** (3 colleges), **Human Resources Specialist →
> MAG-56 HRM + CIS-001 Intro to CIS** (2 each), and **Marine Combat Training →
> CPL-3 Elective Course Credits** (3) — which is a *placeholder*, the same
> "Elective Course Credits" string the Common CR Reference already flags.
>
> ⭐ **So the honest read: the titles are the deliverable; peer precedent is
> mostly noise.** Two exhibits have a pointer worth acting on. Every
> `peer_courses` entry carries **both** `colleges` and `spans_exhibits`, and
> blanket courses are **labeled rather than hidden** — a curator who cannot see
> why an exhibit has no strong course cannot judge the list.
>
> ⭐ **A finding for the CCRR lane in its own right:** three colleges have mapped
> `MAG-51 Elements of Supervision` against **33 distinct military exhibits**.
> That is worth looking at as a data-quality question, separately from this list.

> ⚠️ **The rank now understates it.** Priority 5 meant READINESS — nobody had
> ruled. That reason is gone and this is the highest-**value** class in the list.
> The number is left alone only because renumbering moves every other class the
> team already refers to by number. Say the word and it moves.

**Not a defect, and the only class here that can still become credit for a
student.** What the 5,311 rows actually say:

| ACE's own words | rows | colleges |
|---|---:|---:|
| `Credit may be granted on the basis of an individualized assessment of the student` | 3,970 | 95 |
| `Additional swimming … on the Basis of Institutional Evaluation` | 1,075 | 86 |
| `Credit in surveying on the basis of institutional evaluation` | 171 | 57 |
| other `… on the basis of institutional evaluation` (first aid, fire science) | 95 | 41 |

⚠️ **Do NOT bulk-rule these Not Applicable.** The recommendation says the award
is the college's call after its own assessment. Closing them records a refusal
ACE never made.

**Two subclasses, two instructions** — one class with one action across both
halves would repeat exactly the mistake the P1 split fixed a day earlier:

- `cx-course-named` (1,310 / 89 colleges, `one rule`, **college CPL staff —
  student-facing**): *"Present these to the student as CREDIT BY EXAM options…
  The only reason to close one is that your college does not permit Credit by Exam
  for that particular course."*
- `cx-no-course-named` (4,001 / 95 colleges, `upstream`, **MAP team — attach the
  exhibit title**): *"NOT SENDABLE YET — do not pass this to a college… there is no
  course to offer a challenge exam in, and a student can already request Credit by
  Exam for any course the catalog allows… Attaching the exhibit title turns it into
  an offer; until then it is a copout in the source data, not a task for a
  college."*

⭐ **A small number of ACE exhibits repeating widely**, so one ruling covers most
of the class — 75% of it is a single sentence about individualized assessment,
and another 20% is swimming.

⚠️ **A row saying "institutional evaluation" is only here if it also carries ZERO
hours.** 807 rows mention institutional evaluation *and* carry units — those are
real recommendations with a note attached, not this class, and they are correctly
absent.

## Next

- Work P1 as one instruction to ~100 colleges, not 100 conversations — **it is
  now safe to send**, which it was not before the P1/P5 split above.
- **P5 `cx-course-named` (1,310) is ruled and sendable** — present as Credit by
  Exam, never bulk-close.
- **Attach the exhibit title** so the other 4,001 can be offered too. The columns
  are already in the daily pull (`AceID` + `Title`); nothing stores them. Measure
  the join rate on the next run before quoting any coverage figure.
- Follow-on in Sam's own lane: normalizing these ACE recommendations as Cx against
  specific courses in the Common CR Reference.
- Decide whether P5's **rank** should move to match its value now that readiness
  is no longer the constraint (see the note under Priority 5).
- Take P2 to **Pierce and Merced directly** — two calls, 94% of the class.
- Ask the **nine Initiator colleges** what is stalling.
- The list is live; it will move nightly with the load.
