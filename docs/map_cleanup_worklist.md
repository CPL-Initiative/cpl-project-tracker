---
title: The CPL clean-up worklist — what to fix, in what order, and who fixes it
created: 2026-08-19
updated: 2026-08-19
tags: [worklist, cleanup, disposition, student-detail, supabase, map, prioritisation]
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
413 rows needing 413 judgements.** Sorting by row count puts them in the wrong
order, so the list carries an `effort_shape`:

| shape | meaning |
|---|---|
| `one rule` | a single policy decision clears every row at that college |
| `per row` | a human must look at each one |
| `upstream` | nobody at the college can fix it — the data arrived wrong |

---

## The list

### Priority 1 · Recommendations that cannot yield credit — **17,594 rows, ~100 colleges**

ACE already said no credit is recommended, or that it needs an individual
assessment, or recommended zero hours. **A college cannot act on these except to
rule them Not Applicable.** They carry **zero units of opportunity** and yet sit
in the Needs Action pile, depressing every disposition rate.

| | rows | colleges | students |
|---|---:|---:|---:|
| ACE: credit is not recommended | 11,926 | 100 | 7,744 |
| ACE: individualized assessment | 3,955 | 95 | 2,803 |
| zero-hour recommendation | 1,713 | 92 | 1,466 |

**One rule clears the lot**, and it is the same rule at every college. Heaviest:
San Diego Miramar 1,640 · San Diego Mesa 932 · CCSF 899 · San Diego City 745 ·
El Camino 732 · Coastline 665 · Long Beach City 649 · Mt. SAC 584.

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

| college | total | P1 one rule | P2 transcribed | P3 applied | P4 approval |
|---|---:|---:|---:|---:|---:|
| Los Angeles Pierce | 10,680 | 80 | **10,600** | — | — |
| Merced | 2,975 | 18 | **2,956** | — | 1 |
| San Diego Miramar | 1,643 | **1,640** | — | — | 3 |
| Moreno Valley | 1,055 | 124 | 530 | — | **401** |
| City College of San Francisco | 946 | **899** | — | 2 | 45 |
| San Diego Mesa | 934 | **932** | — | — | 2 |
| Long Beach City | 899 | 649 | — | **217** | 33 |
| Riverside City | 536 | 14 | 190 | — | **332** |

**The mix matters more than the total.** Miramar's 1,643 is one decision;
Pierce's 10,680 is one phone call; Moreno Valley's 1,055 is three different jobs
with three different owners.

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

## Next

- Work P1 as one instruction to ~100 colleges, not 100 conversations.
- Take P2 to **Pierce and Merced directly** — two calls, 94% of the class.
- Ask the **nine Initiator colleges** what is stalling.
- The list is live; it will move nightly with the load.
