---
title: A classification code cannot say who a program is for
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, top-codes, cip, coci, retrieval, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - coci_college_programs (Supabase)
  - coci_college_offerings (Supabase)
  - tmc/source_data/coci_program_export_*.csv
---

# A classification code cannot say who a program is for

> **One-sentence summary** — TOP and CIP both classify what a program *teaches*,
> so neither can answer "which colleges serve someone holding credential X";
> that fact lives in the program title, and swapping one code for the other
> changes nothing.

## The case

A student asked which of Santa Ana's LVN courses align with their CNA, so they
could request credit. Searching `coci_college_offerings` for TOP 1230.2x
(Licensed Vocational Nursing) returned 44 colleges and none in Orange County.
That answer was wrong, and Sam said so.

`coci_college_programs` shows LVN programs at Cypress, Golden West and
Saddleback. The reason the code search missed two of them:

| College | Program | TOP | CIP |
|---|---|---|---|
| Cypress | 30-Unit Option Career Mobility: LVN to RN | 1230.10 Registered Nursing | 51.3801 Registered Nursing |
| Golden West | LVN to RN · LVN 30 Unit Option | 1230.10 Registered Nursing | 51.3801 Registered Nursing |
| Saddleback | LVN to RN 30-Unit Option | 1230.20 LVN | 51.3901 LVN Training |

## Why CIP does not rescue it

The obvious next move is CIP, which the CO is moving to and which this repo
already treats as TOP's successor. Measured against this extract, it changes
nothing here: **the two programs the TOP search missed carry an RN code in BOTH
taxonomies.** They agree because they are both right — an "LVN to RN" bridge
genuinely *is* a Registered Nursing program. It awards RN.

⚠️ **The programs are not miscoded. The query was asking a question the codes do
not answer.** What distinguishes these programs is the credential a student
arrives *holding*, and no subject taxonomy encodes that. It lives in the title.

Measured across the same extract:

- LVN by program **title**: **53 colleges**. By either **code**: **44**.
- CIP is blank on **29.1%** of all programs and **14.1%** of active ones.
  TOP is blank on **0%**.

So CIP today is the better-shaped taxonomy with the worse coverage, which is why
the standing posture — corroborate, never gate — applies to it as much as to TOP.

## The rule

- **Before reaching for a better code, ask whether any code can answer the
  question.** "What does this teach" is a code question. "Who is this for",
  "what does it award", "what does it assume you already hold" are not.
- **Search the title alongside the code, and let neither alone decide.** Two
  independent signals agreeing is the standing gate; a title and a code are two.
- **A taxonomy swap inherits every error of the thing it was derived from.**
  Where CIP is crosswalked from TOP rather than independently assigned, it
  cannot correct a TOP the crosswalk is keyed on.
- **Coverage is part of reliability.** A field that is blank on one active
  program in seven cannot be the gate, however well-designed it is.
