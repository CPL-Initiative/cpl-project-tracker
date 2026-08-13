---
title: A summary field will be read as the whole record
created: 2026-08-13
updated: 2026-08-13
type: methodology
kb-status: published
tags: [data-modelling, retrieval, rag, sierra, publishing, pitfall]
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/kb-notes/methodology-a-retrieval-miss-and-a-data-gap-look-identical]]"
---

# A summary field will be read as the whole record

## The claim

When a table carries a **single scalar** that stands in for a **set**, every
downstream consumer will eventually quote the scalar as if it were the set — and
the answer will look complete, so nobody files a bug.

## What happened

`chatbox_credentials.ccc_rec` is one `text` column. For **POST Basic Academy** it
holds:

```
3 hours in Criminal Investigation
```

The actual statewide credit recommendation is **ten lines** — eight distinct C-ID
courses plus two electives. Asked what a college might adopt, Sierra named the one
course. A curator who knows the credential immediately saw nine missing; a student
or a new staff member would not have.

The other nine were never absent from our data. They sit in `statewide_data.js` as
`exhibit.authoritative_recs` (134 of 137 statewide exhibits, 361 lines) and are
**already rendered on the public CPL Fact Sheet**. They had simply never been
published anywhere the consumer could read.

## Why it is hard to see

A scalar summary produces a **fluent, plausible, non-empty** answer. Compare the
two failure shapes:

| | Looks like | Gets reported? |
|---|---|---|
| Missing data | an empty or hedged answer | usually yes |
| **Summary-as-record** | a confident partial answer | **rarely** |

The second is worse precisely because it is well-formed. It is the same family as
*a retrieval miss and a data gap look identical* — the answer's surface tells you
nothing about which layer failed.

## The rule

1. **A field that summarises a set must be named as a summary** (`ccc_rec_summary`,
   `primary_rec`) or must not exist alongside consumers that can reach the set.
2. **Publish the set.** If a richer layer exists but lives somewhere the consumer
   cannot read (a committed JS file, an unpublished view), that is a *publish step*,
   not a build — cheap, and usually the whole fix.
3. **Lead with the list, not a count.** Counts invite a single number to stand in
   for the set again, and counts are where definitional disputes hide (see the
   sibling note on C-ID repeats).
4. When you find one, ask **who else reads this field** — the same scalar usually
   feeds several surfaces.

## Test for it

Pick the richest record you have — the one a curator would describe as
"complicated" — and ask the consumer about it. If the answer is shorter than the
record, you have found one. A credential with a single recommendation cannot
distinguish the two designs.

## Worked example

`kb/_build_credential_recs.py` (2026-08-13) publishes one recommendation *set* per
credential into `chatbox_credential_recs`: the statewide authoritative set where a
statewide exhibit exists, otherwise the most common local recommendations with the
college count behind each. 2,205 rows, 134 statewide.
