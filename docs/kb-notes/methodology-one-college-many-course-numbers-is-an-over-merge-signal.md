---
title: One college, many course numbers is an over-merge signal
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, audit, over-merge, identity, curation, ccr, detector]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-title-similarity-merge-guards]]"
artifacts:
  - kb/_row_audit.py
  - kb/esl_package_out/2026-08-24/revalidation.md
---

# One college, many course numbers is an over-merge signal

> **One-sentence summary** — when every member of a course identity comes from
> ONE college but the members carry DIFFERENT course numbers, the identity is
> probably an over-merge: a college does not teach the same course under five
> numbers.

## The case that found it

`ESOL Z9023` displays as *"ESL Support for Freshman Composition: Advanced
Pronunciation Noncredit"* and carries five members — all Orange Coast College:

| number | course |
|---|---|
| `ESL A045N` | Reading and Vocabulary |
| `ESL A046N` | Sentence Structure |
| `ESL A047N` | Spelling Techniques |
| `ESL A048N` | Advanced Pronunciation |
| `ESL A049N` | Advanced Grammar |

Five distinct catalog courses, folded on a shared prefix, displayed under the
name of one of them. `ESOL Z9045` is the same shape (Essays + Paragraphs, shown
as "Paragraphs").

## The rule

**A college's own course numbering is an identity assertion.** When a college
files `A045N` and `A046N` separately with the state, it is saying these are
different courses. An identity that folds them is contradicting the only party
with authority over that distinction.

So the detector is structural, not textual:

```
members all from ONE college
  AND ≥2 distinct course numbers among them
  → over-merge candidate
```

It needs no title parsing, no similarity threshold, and no TOP code — which
matters, because TOP may not gate a primary determination (CLAUDE.md Rule 7).

## Scale

Measured across the CCR, 2026-08-24: **3,320 identities**, sweeping **7,915
local courses**. Distribution: 2,736 pairs, 335 triples, 249 larger.

## ⚠️ It is a signal, not a verdict

Legitimate cases share the shape:

- **Variable-topic and independent-study courses.** `MUSI M1466 "Independent
  Projects"` carries 28 numbers at Allan Hancock and is plausibly one course.
- **Sequence/section marks.** `199A/199B/199C` may be one course in three parts.

The distinguishing question is whether the differing part names different
**content** (Spelling vs Pronunciation — different courses) or a
**section/sequence** (A/B/C — arguably one). That is curator judgment, which is
exactly why this belongs in the auditor as a flag and **must not** be an
auto-unmerge.

## Why the title lane cannot catch it

Title similarity sees `"…Composition: Spelling"` and `"…Composition: Advanced
Pronunciation"` as highly similar — they share a long prefix. The signal that
separates them is not in the titles at all; it is in the *filing*. A rule that
reads only titles is structurally blind to this class.
