---
title: A course title reads as its level, so name the course's program beside it
created: 2026-10-12
updated: 2026-10-12
tags: [methodology, sierra, prompt-context, articulation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-same-context-size-means-the-model-varied]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_prospective_credit.test.js
---
# A course title reads as its level, so name the course's program beside it

> **One-sentence summary**: when a prompt hands a model a course as evidence, the model judges the course's level from its title, so a course titled for an entry credential in a higher program gets dismissed unless the line says which program it belongs to.

## Why it matters
An articulation precedent is evidence only when the reader sees that it reaches the program asked about. A course
whose title starts with the credential the student already holds (an "Acute Care Nursing Assistant" course in a
vocational nursing program) reads as that credential's own course. The model then discards a real precedent and says
the request would be a first, which is the one answer that discourages the student from asking.

## How
Give the course's field beside its code, from the catalog data, and mark the line when that field is the program the
visitor asked about:

`Chaffey College articulated Acute Care Nursing Assistant against 6 hours in ... (NURVN 414) — NURVN 414 is a
Licensed Vocational Nursing course at Chaffey College (6 units), the program the visitor wants to enter: this is the
precedent for this request`

When the field comes from a TOP code, require a second signal (a word the course title shares with the program title)
before marking it, because TOP is a last-in-line corroborator. Say the course's field, not that a program lists it,
unless the program's course list does.

## Worked case (S372, 2026-10-12)
Smoke 7c asks about CNA training toward an LVN program in Orange County. On v90 Sierra sometimes wrote that Chaffey's
articulation was "against CNA-level courses, not LVN ones ... would be a first" (the production side of A/B
38281837466), with the same context as turns that cited it. v91 (#2040) names the field; the candidate cited NURVN 414
as "an LVN-program course" and the smoke after deploy did too. NURVN 414 is not on Chaffey's Vocational Nursing program
list in the catalog data, so the line names the field only.

## Caveat
The mark needs the course's catalog line, one more read per turn; when it fails the line renders as before. Model
variance remains: the fix makes the right reading easier, and only repeated runs show the rate.
