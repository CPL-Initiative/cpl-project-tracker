---
title: "CDCP, course-level, and the CIP-count rule"
created: 2026-07-28
kb-status: published
tags: [reference, cip, cdcp, noncredit, coci, apportionment, credit-type, cip-count-rule]
artifacts:
  - kb/_build_cip_fitcheck.py
  - cip_crosswalk.js
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
---

# CDCP, course-level, and the CIP-count rule

Distilled from Raul + Jenni (CO Academic Affairs), 2026-07-28, while building the CIP
Coder Review tool. The rules a college follows when assigning CIP codes in COCI, and how
we read them from the data.

## The CIP-count rule (how many CIPs a course/program may carry)

- A **credit course** takes **exactly 1** CIP.
- A **noncredit course** takes **1** — *unless* it is **CDCP**, in which case it may take
  **up to 2**.
- A **program** takes **1** CIP.

When a noncredit course lists **two** CIPs, that is the CDCP case.

## What CDCP is

**CDCP = Career Development and College Preparation.** CDCP noncredit courses/programs
earn a **higher apportionment rate** than non-CDCP noncredit — they are categorized as
**"Special Populations"** for apportionment purposes. That funding difference is *why* the
CIP-count rule bends for them.

## CDCP is a COURSE-level property — not inherited from the program

**Critical nuance (Sam's catch):** a course inside a CDCP *program* is **not automatically
CDCP itself**. The Master Program Course file can list non-CDCP courses inside a CDCP
program. So CDCP must be read from the **course's own** record, never inferred from its
program.

## Where we read it in the data

COCI's course inventory (`coci_course_list.xlsx`) carries **`CreditType`**, and the
**enhanced-funding** value IS the course-level CDCP marker:

| `CreditType` value | Meaning | CIP cap |
|---|---|---|
| `Credit Course` | credit | 1 |
| `Other Noncredit Enhanced Funding` | noncredit **CDCP** | 2 |
| `Workforce Preparation Enhanced Funding` | noncredit **CDCP** | 2 |
| `Non-Enhanced Funding` | noncredit, **not** CDCP | 1 |
| (blank) | unknown | 1 (safe default) |

Proof it's independent of the program: within one `Non_Credit_Category` (e.g. "Short-term
Vocational") the courses split both ways — 2,334 Enhanced-Funding (CDCP) vs 897
Non-Enhanced (not CDCP). The four CDCP-eligible noncredit categories are Short-term
Vocational, Workforce Preparation, Elementary & Secondary Basic Skills, and ESL — but the
**enhanced-funding designation** is the authoritative per-course flag, not the category.

**Gotcha when matching `CreditType`:** check `"Non-Enhanced"` *before* `"Enhanced Funding"`
— the former contains the latter as a substring.

`kb/_build_cip_fitcheck.py` encodes this into each course tuple's 4th element:
`"C"` credit · `"D"` noncredit-CDCP · `"N"` noncredit-non-CDCP · absent = unknown.

## The CTE / Non-CTE "Both" choice (related, from Jenni)

Separately: when the assigned CIP is certified **Both** CTE and non-CTE, the college must
record **which use** applies for that course/program. It's a per-assignment choice, not a
property of the CIP alone.
