---
title: Bucket military and non-military credit recommendations before you total them
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, military, jst, ace, disposition, metrics, numbers, doctrine]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/kb-notes/reference-batch-uploaded-transcribed-credit]]"
artifacts:
  - map_student_credit (exhibit_id, course_type, cpl_status_plan, potential_credits)
---

# Bucket military and non-military credit recommendations before you total them

> **One-sentence summary** — a service member's JST lands scores of credit
> recommendations at once while a non-military exhibit lands one or two, so any
> undifferentiated "CRs awaiting action" total is ~99% military, reads as an
> impossible mountain, and hides the small tractable non-military backlog
> entirely.

## The two shapes (Sam, 2026-08-13)

**Military is a PUSH.** Every service member has a Joint Services Transcript, and
ACE Faculty Reviewers have already written credit recommendations against its
contents — anywhere from a few to **scores**, scaling with length of service and
depth of training. The whole transcript arrives at once. The student does not
choose which CRs land.

**Non-military is a PULL, and much more targeted.** A student indicates they hold
CompTIA Network+; that exhibit is added to their CPL plan; its **one or two** CRs
need acting on.

**The lifecycle is identical for both, and that is the point** — what differs is
volume, not work:

1. **Articulate** the CR to a local course where possible — this is what makes it
   *applicable* to a student's CPL plan;
2. **Apply** it, or set it **Not Applicable**;
3. **Transcribe** where appropriate.

Most colleges are not yet at that level of implementation, so most JST CRs sit
inert. The expectation is that this improves over time.

## What the undifferentiated total does

Measured on `map_student_credit` at `Needs Action`, 2026-08-13:

| Bucket | Inert CRs | Inert units | Students | Colleges | **CRs per student** |
|---|---:|---:|---:|---:|---:|
| **Military** | 432,693 (99.1%) | **1,040,447 (98.8%)** | 24,920 | 108 | **17.4** |
| **Non-military** | 3,305 (0.8%) | 10,698 (1.0%) | 868 | 28 | **3.8** |
| Unclassified | 722 (0.2%) | 2,188 (0.2%) | 109 | 36 | 6.6 |

A college told *"you have over a million units awaiting action"* is being told
about **1,040,447 units of military credit**. Meanwhile the non-military backlog —
the targeted, few-CRs-per-student kind, the sort a coordinator could clear —
is **10,698 units across 868 students at 28 colleges**, and it is completely
invisible inside the million.

**The generalizable form:** when a population contains two sub-populations whose
per-entity cardinality differs by an order of magnitude (here 17.4 vs 3.8, a
4.6× gap), an aggregate over both is *governed* by the high-cardinality one. The
total stops describing "how much work" and starts describing "how many veterans",
which is not the question anyone asked.

## The rule

- **Split the buckets in any figure a college will read** — dashboards, the $50k
  / ESS 25-82 surfaces, Sierra's answers, briefings.
- **⚠️ Bucketing is NOT discounting.** We want *all* eligible CRs acted upon.
  Never present the military bucket as lower-value, never drop it from a total,
  and never let "we separated them" quietly become "we stopped counting them" —
  that is the same failure family as an absence rendering as a zero.
- **⚠️ Never read raw inert volume as "this college is behind."** A college with
  many veterans has a huge military denominator by construction. This compounds
  the standing rule never to rank colleges publicly.
- **Lead a college with the tractable bucket**, then give the military figure with
  its per-student context ("~17 recommendations per veteran, because a JST carries
  the whole record"). The second number is not smaller, but it stops being
  bewildering once its shape is explained.

## Classifying, and two traps

There is **no military flag** on `map_student_credit`. The working heuristic:

```sql
case when exhibit_id ~ '^(AR|AF|MC|NV|CG|DD|SS|ACE|NWO)[-0-9]'
       or split_part(exhibit_id,'-',1) in ('NER','MCE','MOS','CGR','NEC')
       or course_type like 'Credit for Basic Military Service%' then 'military'
     when exhibit_id like 'MAP%' then 'non_military'
     else 'unclassified' end
```

**⚠️ Trap 1 — the columns named `military_credits` / `non_military_credits` do
NOT classify.** They are applied-credit *amounts*, and they are zero on **84% of
rows** (449,781 of 537,908). Using them as a classifier silently mis-splits the
corpus while looking authoritative.

**⚠️ Trap 2 — `Credit for Basic Military Service` rows carry no ACE-style
`exhibit_id`.** A first cut keyed only on exhibit codes dropped them into
*unclassified*, where they were **97%** of that bucket and made the military
share look like 93% instead of 99%. Any classifier must cover **both** the JST
exhibit codes and that `course_type`.

Totals reconcile: 432,693 + 3,305 + 722 = 436,720 CRs;
1,040,447 + 10,698 + 2,188 = 1,053,333 units.
