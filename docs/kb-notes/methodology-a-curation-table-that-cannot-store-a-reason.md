---
title: A curation table that cannot store a reason will never build a reason KB
created: 2026-09-20
updated: 2026-09-20
tags: [methodology, curation, schema, governance, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
artifacts:
  - kb/cr_reference_worklist.json
---

# A curation table that cannot store a reason will never build a reason KB

> **One-sentence summary** — Sam abandoned an effort to capture why he merges
> courses, blaming volume; the table he was curating into has no column for a
> reason, so the writing had nowhere to land either.

## Context

Sam, 2026-09-20: *"We started in CCR a process where I comment on each merge
opportunity I decide on, hoping to develop a KB of variables I take into
consideration when determining a merge. I abandoned that effort because there
were just too many unclassified courses to deal with."*

Volume was real. It was not the only cause. `kb_curation` holds **34,443 rows**
and its columns are:

    course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by

There is **no note, comment, reason or rationale column.** The schema records
*what* a curator decided and *who* decided it. It has never had anywhere to put
*why*. (By contrast `cr_reference_decisions` does carry a `note` — and holds
zero rows, so the capability exists unused on one lane and is absent on the
other.)

## The general shape

An effort to capture reasoning fails in two independent ways, and they look
identical from the outside:

1. **Too expensive to produce** — one free-text explanation per case, at N
   cases, where N is large.
2. **Nowhere to put it** — the store records outcomes, not reasons.

Diagnosing (1) and missing (2) leads to "make it cheaper", which does not help
because the writing is still discarded. **Check the schema before you optimize
the workflow.**

## What actually makes it feasible

Stop asking for prose. Ask the **variables** as typed questions, several per
call, and let the *profile* of answers be the reason:

    is this a course-level difference?        noul
    is one broader in scope?                  noul
    vendor- or language-specific vs generic?  noul
    lab against lecture?                      noul
    do the units differ materially?           score

Then cluster cases by their variable profile. A curator rules on the
**pattern** once and it covers every case carrying that profile — which turns
N decisions into a short set of profile-to-disposition rules. That set *is* the
KB of variables the effort was trying to produce.

⚠️ Adding the column is a **new write surface** on a shared human-write table,
so it routes through Governance under Rule 10(a3) before it ships, not as a
schema detail.

## The reusable test

Before building a workflow that asks a human to explain themselves: open the
table and find the column the explanation goes in. If it is not there, the
workflow is already broken and no amount of tooling will fix it.
