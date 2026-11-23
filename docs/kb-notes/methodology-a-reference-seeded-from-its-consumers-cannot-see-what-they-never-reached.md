---
title: "A reference seeded from its consumers cannot see what they never reached"
created: 2026-11-23
updated: 2026-11-23
tags: [methodology, csr, mq-disciplines, reference-data, data-quality, confidence]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[common-subjects-reference]]"
  - "[[common_subject_code_tab_lessons]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - kb/discipline_canonical_subj4.json
  - kb/reference/mq_handbook_20th.json
  - kb/_csr_propose_codes.py
  - kb/_csr_assign_codes.py
  - kb/_statewide_subject_codes.py
  - kb/status/mq_view.json
---

# A reference seeded from its consumers cannot see what they never reached

> **One-sentence summary** — a reference list built from the records that already use it holds only the entries
> those records reached, so every model that chooses among its entries sends the rest to the nearest entry it has,
> at full confidence, and each such call becomes evidence for the next one; check a reference against its authority's
> own list, never against its consumers.

## Context

The Common Subjects Reference (CSR) gives each Minimum Qualifications (MQ) discipline a four-letter Common SUBJ, the
prefix every M-ID is minted under. It was seeded in May 2026 from the disciplines the M-IDs already carried
(`kb/discipline_canonical_subj4.json`). In S717 (2026-11-23) the 20th edition of the MQ handbook was read whole
(`kb/reference/mq_handbook_20th.json`, 251 disciplines): 95 of them had no code. The lessons doc is
[`common_subject_code_tab_lessons`](../common_subject_code_tab_lessons.md), *S717*.

## The claim

### The gap is invisible from inside

Every check the reference ran compared it with itself or with its consumers: one code per discipline, the authority
rule, a confirmed pick for every discipline with courses. All passed (147 of 147 complete on 2026-11-04). A discipline
with no M-ID had no row, so no check could fail on it.

### Models that choose among the entries carry the gap downstream, confidently

The statewide subject-code model (`kb/_statewide_subject_codes.py`) and the subject map
(`kb/reference/subject_discipline_map.json`) can name only a code the reference holds. Measured on `main`,
2026-11-23, from `kb/status/statewide_subject_codes.json`:

| Local code | Colleges | Courses | Called | Confidence | The discipline it names |
|---|---:|---:|---|---:|---|
| ACCT | 50 | 639 | BUSI | 1.00 | Accounting |
| ACCTG | 18 | 190 | BUSI | 1.00 | Accounting |
| ACTG | 5 | 110 | BUSI | 1.00 | Accounting |
| ACC | 6 | 73 | BUSI | 1.00 | Accounting |
| HOSP | 20 | 205 | CULN | 1.00 | Hotel and Motel Services |
| AERO | 7 | 117 | AVIA | 1.00 | Aeronautics |
| LING | 24 | 70 | ANTH | 0.69 | Linguistics |
| MCOM | 4 | 69 | JOUR | 0.46 | Mass Communication |

Accounting alone is 1,012 courses called Business at a confidence of 1.0. The religion codes (RLST, RELS, RELG) went to
Real Estate, Humanities or History. The calls are wrong and sure.

### The gap feeds itself

The model's strongest vote is where peer M-IDs sit. Accounting courses minted under BUSI make BUSI the peers' answer,
so the next Accounting code is called BUSI with more certainty. A confidence of 1.0 here measures the model's agreement
with its own earlier placements. It says nothing about whether the list could have held the right answer.

### Adding the entry does not move the calls

After S717 assigned ACCT, LING, HOSP, RLST, MCOM and AERO, the statewide calls still read the old codes: the model
votes from where the M-IDs sit, and no M-ID sits under a new code. The members move only when a re-mint re-points
them (`docs/coursecontrolnumber_remint.md`).

## How we got here

Sam, 2026-11-23, looking at the MQ disciplines with no code: *"we don't need a course to reach this table to assign a
4-character code to them. note, we have acct for accounting"*. The 20th edition was parsed, `kb/_csr_propose_codes.py`
proposed a code for each of the 95 (2 from C-ID, 18 from codes colleges use, 75 minted), and `kb/_csr_assign_codes.py`
wrote them with a confidence each (receipt `kb/receipts/csr_assigned_codes_s717.json`, PR #3726). The table above is
the statewide list before the re-point. A commit message on the same PR claimed "LING now calls LING"; the rebuilt list
showed it did not, which is how the fourth sub-claim surfaced.

## When this applies (and when it doesn't)

- **Applies** to any reference seeded from usage: a credential list seeded from MAP exhibits, a recommendation list
  seeded from adopted rows, a code list seeded from minted identities. The test is one join: every entry in the
  authority's own list (a handbook, a registry, a state taxonomy) has a row. `tests/mq_view_test.py` (6) is that check
  for the CSR.
- **Applies** to any confidence a model reports when it can pick only among existing entries. Before trusting a 1.0,
  ask whether the right answer was on the menu.
- **Does not apply** where no authority list exists, as for colleges' own local codes; there the consumers are the
  authority. A new entry also does not settle a local code that means different things at different colleges (AT
  and INS, homonyms whose readings include Automotive and tutoring); that needs a college-by-college read.

## See also

- [`common-subjects-reference`](../reference/lanes/common-subjects-reference.md) — the lane, its ruling
  `r-csr-codes-settled-on-list-confidence-not-confirmation-sam-2026-11-23` and the re-point re-mint in NEXT
- [`methodology-top-is-a-last-in-line-signal`](methodology-top-is-a-last-in-line-signal.md) — another signal that
  reads strong and decides nothing alone
- PR #3726 — the assign and the MQ view

---

*Authoring check: durable (any reference seeded from usage), reusable (the CER, the CR reference, peer systems),
distilled (one concept: the menu bounds the answer), self-contained.*
