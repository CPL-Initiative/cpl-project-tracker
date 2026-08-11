---
title: Publish the denominator with the number, as a column
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, metrics, data-quality, coverage, disclosure, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-tier-must-encode-what-you-could-not-check]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/sierra_credential_naming_lessons]]"
artifacts:
  - kb/supabase_credential_volume.sql
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Publish the denominator with the number, as a column

> **One-sentence summary** — when a count covers only part of its population,
> ship the coverage as a field beside it, because a caveat written in prose gets
> separated from the number the first time anyone quotes it.

## Context

Per-credential student counts became computable by bridging student-grain
exhibit ids to canonical credential names. But only **22,606 of 537,908 student
rows (4.2%)** can be named at all, because the exhibit corpus covers 59 of MAP's
123 colleges. CompTIA A+ shows **115 students across 7 colleges — and 21 colleges
have adopted it.**

So every count is a floor, and a large one: the visible 7 are not a sample of the
21, they are the subset we happen to be able to name.

## The claim

**Coverage is part of the measurement, so it belongs in the same row as the
measurement — not in a footnote, a chip, a tooltip, or a prompt caveat.**

The published rollup carries `colleges_adopted` next to `students`, so a consumer
physically cannot select the count without the denominator being available:

```sql
students                   -- 115
colleges_with_student_data --   7   <- what we can see
colleges_adopted           --  21   <- what exists
```

A caveat in prose survives exactly as long as the paragraph around it. The moment
a figure is lifted into a slide, a report, or a legislative ask, the caveat stays
behind and the floor becomes a total. Structuring it as a column means the
separation has to be *deliberate* rather than *accidental*.

## The distinction that must not collapse

Two states render identically if you are careless and mean opposite things:

| Field state | Meaning | What a reader must be told |
|---|---|---|
| `students_suppressed = true` | real students, below the k threshold | "fewer than 10" |
| `colleges_with_student_data = 0` | genuinely nothing recorded | "no student records yet" |

Collapsing them produces the failure this project has hit before in another
guise: **"not in this dataset" read as zero.** A blind spot reported as a zero
tells a college its programme is dead when the truth is that we cannot see it.
Bakersfield's per-CPL-type counts make this vivid — 57 nameable students against
582 actual, so a bare "2" for Credit by Exam is a visibility artefact, not a
finding.

## How to apply it

1. If a measure covers a subset, add a coverage column — never only a note.
2. Name the number honestly at the point of use: *"at least 115 students across 7
   colleges; 21 have adopted it, so the real figure is higher."*
3. Give "suppressed" and "empty" distinct fields, and distinct sentences.
4. Where a consumer is an LLM, put the rule in the emitted context itself
   (`AT LEAST`, plus the adopter count on the same line) rather than trusting a
   general instruction to be applied consistently.
