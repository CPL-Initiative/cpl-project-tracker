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

Live view: **`map_cleanup_worklist`** (reviewer-gated, `security_invoker = on`,
so it inherits the student-grain gate). It rebuilds itself — it reads
`map_student_credit`, which now reloads nightly.

```sql
select priority, class, subclass, effort_shape, owner,
       count(*) colleges, sum(rows) rows, sum(students) students
from map_cleanup_worklist group by 1,2,3,4,5 order by 1, rows desc;
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

## Next

- Work P1 as one instruction to ~100 colleges, not 100 conversations.
- Take P2 to **Pierce and Merced directly** — two calls, 94% of the class.
- Ask the **nine Initiator colleges** what is stalling.
- The list is live; it will move nightly with the load.
