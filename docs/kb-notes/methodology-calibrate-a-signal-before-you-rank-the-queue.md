---
title: Calibrate a signal against an independent source before you rank the queue
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, curation, prioritization, measurement, calibration, esl, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-measure-your-mechanism-ceiling-before-working-the-queue]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - kb/_build_esl_fold_spotcheck.py
  - tests/esl_fold_spotcheck_test.py
  - kb/esl_fold_spotcheck/2026-08-24/report.md
---

# Calibrate a signal against an independent source before you rank the queue

> **One-sentence summary** — a `confidence` label on a derived signal is a
> *claim*, not a measurement; if a second, independent source can adjudicate the
> same rows, compute each signal's actual wrong rate against it **before**
> deciding which lane to work first, because intuition about evidence strength
> gets the order backwards.

## The situation

The 2026-08-24 ESL packaging fold assigned each of 1,990 identities to a level
comprehensive using signals derived from the identity's **title**, and stamped
each with a confidence:

| Signal | Confidence | What it means |
|---|---|---|
| `word` | high | the title contains "Beginning" / "Intermediate" / "Advanced" |
| `combo` | high/medium | the title spans two levels |
| `numeric` | medium | the title carries a ladder number (1–2 → Beginning, 3–4 → Intermediate, 5+ → Advanced) |
| `default-beginning` | medium | no level signal at all → Beginning, the CPL-safe under-claim |

The Session-188 handoff ranked the follow-up work by reasoning about evidence
strength: work the 517 `default-beginning` rows first, because the 248 `numeric`
rows carry *"a number in the title implying a level — weak evidence, but it **is**
evidence."*

That is a perfectly sensible-sounding argument. It is also wrong, and nothing
about it could be checked without an independent source.

## The independent source was already in the repo

The classifier read **titles**. The COCI course export
(`kb/reference/coci_course_list.xlsx`) carries a `CatalogDescription` for
**96% of the member courses**, and those descriptions state the level outright —
*"at the advanced ESL level"*, *"for high-intermediate ESL learners"*,
*"this low-intermediate level course"*.

That is a genuinely independent adjudicator: it is written by the same college,
about the same course, and the classifier never saw it.

## The calibration

| Signal / confidence | Disagrees | Agrees | Unchecked | **Wrong rate** |
|---|---:|---:|---:|---:|
| `combo/medium` | 2 | 0 | 3 | **100.0%** |
| `default-beginning/medium` | 102 | 31 | 384 | **76.7%** |
| `numeric/medium` | **94** | 97 | 241 | **49.2%** |
| `combo/high` | 1 | 7 | 24 | 12.5% |
| `word/high` | 23 | 345 | 455 | **6.2%** |

Three things fall out that no amount of reasoning would have produced:

1. **`numeric` is a coin flip.** It was ranked *below* `default-beginning` as a
   lane worth less attention. It is 94 more rows of exactly the same work.
2. **`word` is the only signal that behaves like its label.** At 6.2% it earns
   "high confidence"; `combo/high` at 12.5% is twice as wrong on a small n.
3. **The confidence stamps were never validated.** They encoded how *convincing
   the rule felt* when it was written, which is a different quantity from how
   often it is right.

## Three mechanics that make the number honest

### 1. The denominator is the rows the source can DECIDE

`unchecked` rows — where the description asserts no level either way — are
**excluded**, never counted as agreement. 1,217 of 1,990 folds are in that
state. Folding them into the denominator would report `default-beginning` at
20% wrong instead of 77%, and the whole finding evaporates.

This is the local instance of the standing trap: *ask whether the list you read
can contain what you are counting.* A row that cannot disagree is not evidence
of agreement.

### 2. Key the calibration on every axis the label varies over

The first cut keyed on the signal name alone. `combo` carries **both** high- and
medium-confidence rows, so the lane was labeled with whichever confidence
happened to be read first. Split properly, the two halves land at **12.5%** and
**100%** — the same name covering two different things.

### 3. Check each row against ITS OWN assignment, not a fixed reference

The first implementation compared every row against Beginning, because the
worklist started life scoped to the `default-beginning` lane. Generalizing
`categorize()` to take the row's own band is what made the **reverse** direction
visible at all: 5 rows folded *up* that the catalog puts *lower*.

## The payoff finding: directional error beats aggregate error

The numeric mis-fires are not random. **85 under-claim, 9 over-claim.**

The pinning assumes every college runs a ladder of the **same length**. A college
with a 1–3 ladder has `2` as its *middle* rung, so Contra Costa's
`ESL 126 Listening and Speaking 2` is intermediate in its own catalog while the
rule reads it as Beginning.

⭐ **The small half matters more.** Under-claiming is the direction the doctrine
*deliberately chose* (award at the entry band rather than over-claim).
Over-claiming is the direction it exists to prevent. So the **9** rows are the
first thing a curator should look at, and the 85 are a slow correction — the
opposite of what a raw count ranks.

An aggregate wrong rate would have hidden this entirely: 49.2% says "this signal
is unreliable", while the direction split says "this signal is *systematically
conservative*, with nine exceptions that violate its own safety property."

## When this applies

Reach for it whenever:

- a pipeline stamps rows with a derived `confidence`, `score` or `tier`, **and**
- some second source — a description, a peer's decision, an external authority,
  a later human review — can adjudicate a subset of the same rows.

Then the wrong rate per stamp is computable, and it should be computed **before**
the queue is ordered. The cost here was one afternoon; it re-ordered the lane and
found 94 rows that were about to be skipped.

## What this does NOT license

⚠️ **A signal that disagrees is not automatically the wrong one.** The
calibration says the description and the title-derived signal disagree; deciding
which wins is a curation judgment. Everything here **proposes**, and the apply is
a separate gated step.

⚠️ **Do not go looking for a second signal that is merely available.** The same
run built a "calibrated course-number ladder" — anchor a college's course numbers
against its own level-worded siblings — and **threw it away**: colleges run
parallel numbering schemes at once (Santa Rosa's `EMLS` anchors at 30 = Advanced,
371/372 = Intermediate, 701/702 = Beginning, because the 700s are the *noncredit
mirror* of the 300s), and off-ladder courses still carry numbers. It would have
proposed 325 re-levels on an ordinal that does not exist. An independent source
has to be independent **and** meaningful — the same standard Rule 7 applies to
TOP codes.

## See also

- [[docs/kb-notes/methodology-measure-your-mechanism-ceiling-before-working-the-queue]]
  — the companion question. That one asks *"does finishing this queue reach the
  goal?"*; this one asks *"is the queue in the right order?"*
- [[docs/kb-notes/methodology-top-is-a-last-in-line-signal]] — the standing case
  of a field that looks authoritative and is not.
