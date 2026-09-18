---
title: The record cannot say which credential is held — only the visitor's words can
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, sierra, retrieval, epistemics, prospective-credit]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it]]"
  - "[[methodology-an-absence-in-the-data-is-a-statement-about-the-data]]"
  - "[[methodology-assert-what-retrieval-returns]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/smoke_test.sh
  - tests/sierra_prospective_credit.test.js
---

# The record cannot say which credential is held — only the visitor's words can

> **One-sentence summary** — A prospective-credit question names two credentials, the one the visitor holds and the one the target program leads to, and the credential record matches both, so the block that tells the model "the visitor holds X" has to read X from the visitor's own holding phrase ("I have a CNA certificate"), and the program that trains X is rendered last, marked BACKGROUND.

## Context

cpl-chat v70 shipped with the direct answer first: the LEAD bullet of the
prospective rule says the first sentence names a course to ask about. The
post-deploy smoke (run 35318277251) and the next run on production
(35319154259) both failed the one assertion that reads the head of the
answer. The answers opened with a CNA course — *"Ask the CPL coordinator at
Golden West College to review your CNA certificate against NURS G060N
(Certified Nurse Assistant)"*, then *"…against VHLTH 101/102/103/104 (the
Nursing Assistant Training sequence…)"* — and reached Long Beach's VN 220,
the first Vocational Nursing course, at character 854.

## What was measured

Two causes, both in the context the model read, neither in the prose.

**The CNA section rendered first.** The prospective block groups course lists
by TOP program in the order the offerings rows arrived, and the offerings
RPC leads with the rows inside the visitor's county. Orange County teaches
Certified Nurse Assistant and no Vocational Nursing entry program, so the
first section the model saw was the program that trains the credential the
visitor already holds — three colleges, all in the county, one a mile from
its center — and the rule said to name a course first.

**The block's intro named the wrong credential as held.** The intro read
*"The visitor holds a credential (matched in the credential record above as
Licensed Vocational Nurse (LVN) License; Certified Nurse Assistant (CNA)
Certification; LVN License; Nurse Assistant Training)"*. The held titles were
the first four of the matched titles, and the local route matches every
credential the question names: `search_credentials_any('lvn')` returns
Licensed Vocational Nurse (LVN) License at tier 3 with three adopters, and
the adopted-first sort ranks it first of six. The record has no way to know
that the visitor holds the CNA and is asking about the LVN. It matched what
was asked, which is exactly its job.

## The rule

The question carries the fact the record lacks. A first-person holding
phrase — *I have a*, *I hold*, *I'm a*, *as a*, *with my* — names the
credential the visitor holds, and nothing else in the pipeline does.
`heldCredentialPhrases` reads it (the verb, then the words up to a
credential noun or a clause boundary), `pickHeldTitles` keeps the matched
titles that name it or are the same kind of thing (Acute Care Nursing
Assistant stays, because it carries the one CNA-to-LVN precedent), and the
block marks the program that trains it:

```
## Certified Nurse Assistant (TOP 1230.30) — BACKGROUND: the program that
   trains the credential the visitor holds; never the course to ask about
```

Target sections render first, background last, and the intro says what the
mark means. The fail-safe matters as much as the mark: a question with no
holding phrase marks nothing and renders in the picks' own order, and a
phrase every section answers to (someone who says "I have nursing
experience") marks nothing either, because a block with no target section
has nothing left to point at.

## Why a rule in prose was not enough

The v69 rule already said *"THE PROGRAM THEY WANT TO ENTER IS THE TARGET…
that list is background, not the answer."* The model read that sentence and
still opened with the CNA course, because the same context told it, in the
sentence that introduces the section, that the visitor held an LVN license,
and then showed it the CNA list first. A prompt rule cannot outrun a
context that contradicts it. The fix is in what retrieval builds, the
assertion is on what retrieval builds (block 10 of
`sierra_prospective_credit`), and the smoke reads the first 300 characters
of the answer for a CNA course code — the shape the failure took.

## Related

- [[methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it]] — the question this route answers.
- [[methodology-an-absence-in-the-data-is-a-statement-about-the-data]] — the previous v70 lesson from the same answer.
- [[methodology-assert-what-retrieval-returns]] — why the pin is on the block, never on the prose.
