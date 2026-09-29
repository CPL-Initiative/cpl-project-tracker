---
title: "ESL packaging plan — re-validation before apply (2026-08-24)"
created: 2026-08-24
tags: [ccr, esl, packaging, revalidation, curation, rule-10]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - kb/esl_package_out/2026-07-15/esl_package_plan.json   # the plan under review
  - kb/esl_package_out/2026-07-15/esl_package_report.md
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_convergence_strategy]]"
---

# ESL packaging plan — re-validation

**READ-ONLY. Nothing was written to `kb_curation` or to any identity file.**
Sam asked for this pass before deciding whether to apply the 2026-07-15 ESL
packaging dry-run. Verdict up front: **do not apply it as written.**

## 1. The plan's headline number is 14% stale

| | plan (2026-07-15) | today (2026-08-24) |
|---|---:|---:|
| identities classified | 2,364 | — |
| would fold into the 3 comprehensives | 2,149 | **1,846** |
| already carry a `merge_into` (skipped by `ON CONFLICT`) | — | 297 |
| id no longer exists in the artifacts | — | 300 |

**40 of the skipped rows are Sam's own decisions.** `INSERT … ON CONFLICT DO
NOTHING` protects them, so an apply would not overwrite a curator — but the
plan's arithmetic no longer describes what an apply does.

**72 ESL identities minted since the plan** (`ESOL Z1001…`, `ESLN Z9001…`) are
classified by nothing. A rebuild of the dry-run is cheap and is the right first
step; re-running the classifier costs one command.

## 2. The bucket flagged as highest-risk has already been consumed

The plan singled out **transfer-level ESL** for individual confirmation, because
it awards *real transferable credit* and a mis-fold under-serves a student
badly: *"no transferable flag in source; confirm each before it escapes the
fold."*

Of those 22 identities, **only 8 are still standing as reviewable rows**:

- **9 merged** — 8 by `automerge-titlelane-v1@bot` on 2026-06-13, 1 by
  `map@rccd.edu` (`ESOL M1206 Introduction to College Composition` → `ENGL 100`,
  a real C-ID descriptor; that is a curator decision and it stands)
- **5 vanished** with no curation row explaining them
  (`ESOL M10NH/M10NI/M10NJ/M10NK/M10NL` — all "College Composition for
  ESL/Multilingual" variants)

The review gate the plan built for its riskiest bucket had already closed
before anyone opened it.

## 3. A confirmed over-merge, found on the way

`ESOL Z9023` — displayed title *"ESL Support for Freshman Composition: Advanced
Pronunciation Noncredit"* — carries **five members, all Orange Coast College,
each a different course number**:

| number | course |
|---|---|
| `ESL A045N` | Reading and Vocabulary |
| `ESL A046N` | Sentence Structure |
| `ESL A047N` | Spelling Techniques |
| `ESL A048N` | Advanced Pronunciation |
| `ESL A049N` | Advanced Grammar |

These are five distinct courses in one college's catalog, folded on a shared
prefix. `ESOL Z9045` is the same shape (Essays + Paragraphs → displayed as
"Paragraphs"). Both were written by `automerge-titlelane-v1@bot`, 2026-06-13.

**The tell is structural, and it generalizes:** a college does not teach the
same course under five different numbers. Where every member of an identity
comes from ONE college but the members carry DIFFERENT course numbers, the
identity is an over-merge candidate.

Measured across the whole CCR: **3,320 identities have this shape, sweeping
7,915 local courses.** Distribution is 2,736 pairs, 335 triples, 249 larger.

⚠️ **This is a signal, not a verdict.** Some are legitimate — variable-topic and
independent-study courses (`MUSI M1466 Independent Projects`, 28 numbers at
Allan Hancock) may genuinely be one course offered under many numbers. The
distinguishing question is whether the differing part names different **content**
(Spelling vs Pronunciation — different) or a **section/sequence** (199A/B/C —
arguably the same). That is curator judgment, which is what makes it a good
audit rule and a bad auto-fix.

Proposed as a new `kb/_row_audit.py` rule, sibling to `unit_anomaly` and
`member_top_divergence` (both member-level cross-validators). CLAUDE.md §11
Phase 1c tracks the audit-rule queue.

## 4. Rule 10 pre-write checks

| check | result |
|---|---|
| fresh live read of `kb_curation` at analysis time | done — 349 ESL merge/dismiss rows |
| pending `unified_title_merge_confirm` targets | **1 row, unrelated** (`_CREDENTIAL_REVIEW::Intermediate Algebra`) — no collision with ESL |
| curator rows that an apply would fight | none — 40 of Sam's rows are protected by `ON CONFLICT DO NOTHING` |
| newest ESL curation | 2026-06-25, *before* the plan was generated |

## 5. The step the plan defers

The plan writes `merge_into` pointers, and **every row's `target` field is
`null`**. It sorts identities into buckets (`ESOL M9082` → *Beginning ESL*) but
the three comprehensive rows those buckets point at **do not exist**. The
report names this: *"Survivors to mint/choose: 3 comprehensive courses."*

Minting three new identities is **not** a Rule 7 re-mint — no existing M-ID
changes, no alias map, no re-keying of articulations or promotions. But it is a
real step with a naming decision in it, and it has to happen before any of the
1,846 pointers has somewhere to point.

## 6. Recommendation

1. **Re-run the dry-run** against today's data — it picks up the 72 new
   identities, drops the 300 that no longer exist, and reports the true
   fold count.
2. **Decide the three comprehensive identities** (mint or choose) — Sam's
   naming call.
3. **Look at the transfer-level 8 that survive**, and at whether the 9 already
   folded should be unwound. Reversing is one row per identity.
4. **Then apply**, per Rule 10: fresh read at write-time, INSERT-only
   `ON CONFLICT DO NOTHING`, cohort `package-esl-s188@bot`, receipt committed,
   inside one cron window.

⚠️ **53% of what would write is `medium` confidence** — 544 default-Beginning
(no level word in the title, assumed Beginning as a CPL-safe under-claim) and
434 numeric-ladder pins. The plan asks for a spot-check of exactly these, and
that ask is unchanged.
