---
title: A retrieval miss and a data gap look identical from the answer
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, sierra, retrieval, rag, debugging, diagnosis]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/kb-notes/methodology-publish-the-denominator-with-the-number]]"
  - "[[docs/sierra_credential_naming_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - kb/supabase_credential_volume.sql
---

# A retrieval miss and a data gap look identical from the answer

> **One-sentence summary** — when an assistant says "I couldn't find that," the
> cause may be one layer downstream of where the sentence points, so probe the
> retrieval function directly before you touch it.

## Context

Sierra was asked *"How many students statewide are eligible for credit for a
CompTIA cert? And for which certs?"* It replied that no statewide CCC credit
recommendation *"has been adopted yet"* for CompTIA, that *"the data returned for
this query didn't surface specific CompTIA exhibit records,"* and then listed
A+, Network+, Security+, Cloud+ and CySA+ as certs *"commonly articulated at
community colleges nationally."*

Every signal in that answer pointed at retrieval. MAP in fact holds **14 CompTIA
credentials, 10 of them with statewide ASCCC recommendations**.

## The claim

**The sentence an assistant writes about its own failure is a hypothesis, not a
diagnosis.** It is generated from the absence of a context section, and the model
cannot distinguish *"the search returned nothing"* from *"the search returned
something, but nothing answered the question actually asked."*

Running the deployed path by hand settled it in one query:

```sql
select * from search_statewide_recommendations('comptia', 5);
-- CompTIA A+, Tech+, CySA+, Cloud+  — tier 3, correct
```

Every other probe that question generates (`students`, `statewide`, `eligible`,
`students statewide`, `eligible comptia`) correctly returned zero rows. **The
retrieval layer was working perfectly.** The gap was the half of the answer
Sierra stated *honestly* and that was easy to skim past: *"I don't have a
CompTIA-specific student count."* True — the student-grain table carried exhibit
ids and no credential name.

Had the fix followed the accusation, it would have been a rewrite of a correct
retrieval function — the classic remedy-becomes-the-next-outage shape already
recorded for the `aed` synonym.

## Why it matters

The two causes have opposite fixes:

| Symptom in the answer | Actual cause | Fix |
|---|---|---|
| "didn't surface records" | retrieval genuinely missed | tune matching / synonyms |
| "didn't surface records" | retrieval fine, no such **measure** exists | build the measure |

Only a direct probe separates them, and the probe costs one query.

## The corollary that is more dangerous

Having found nothing, the model **filled the silence from world knowledge** — and
its list of CompTIA certs was *correct*. That is the worst available outcome: a
reviewer sees a plausible, accurate answer and files no bug, so the behavior
survives to a question where the guess is wrong. Accidental correctness is not
evidence of grounding.

The guard has to be explicit in the prompt (*never supply a credential from
general knowledge; if the section does not contain it, we do not have it*),
because a fluent invented list is indistinguishable from a retrieved one at read
time.

## How to apply it

1. Take the assistant's failure sentence as a *pointer*, not a finding.
2. Call the retrieval function directly with the terms the question produces —
   including the probe *pairs*, not just the words.
3. If retrieval returns the right rows, the gap is downstream: a missing measure,
   a missing join, or a context section that was never built.
4. Verify the probe itself before fixing what it accuses (a `string_agg` in a
   test query once faked an ordering defect that did not exist).
