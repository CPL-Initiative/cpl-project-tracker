---
title: A harvest's tail needs a different instrument than its body
created: 2026-10-19
updated: 2026-10-19
tags: [methodology, program-requirements, harvest, jev, second-reader, catalog-sweep]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[program-requirements-harvest]]"
  - "[[reference-system-one-model-fit-by-lane]]"
  - "[[methodology-a-second-look-shown-the-verdict-rubber-stamps-it]]"
artifacts:
  - kb/_jev_harvest.py
  - kb/_program_requirements_college.py
  - kb/_program_requirements_score.py
  - .github/workflows/typesafe-smoke.yml
---

# A harvest's tail needs a different instrument than its body

Sam asked on 2026-10-19 whether the one-college-at-a-time reader is the most effective way to
assemble the systemwide dataset. The run's own numbers answer in two parts.

## The body and the tail, measured

The catalog sweep read 15,946 program records at 114 colleges between S394 and S414 (sixteen
days), and 11,621 of 20,282 active programs pass the three machine checks. The readers that did
it are deterministic: CourseLeaf's sitemap road, Acalog, curriQunet, eLumen, Coursedog's own
program search, and the whole-catalog PDF picker. Each reader paid off across many colleges
because the body of the corpus shares a few vendor shapes.

Then one session (S419) spent itself on eleven records at one college. Cañada's catalog heads a
section with the award's letters, wraps a long title onto a short next line, and opens a list on
the page after its heading; finding those three shapes took two page reads of the catalog's own
words and a reader change, and the change recovered eight of the eleven. The marginal cost moved
from a college an hour to a session a dozen records. That is the tail: each catalog's own habit,
where a rule written for one habit is a procedure that serves one college.

## The instrument for the tail is judgment, not another rule

Two layers, both of which rank and suggest and neither of which writes:

1. **A typed cause per failing record.** The scorer names the symptom ("the blocks sum to
   12; the catalog states 19") and no cause. `kb/_jev_harvest.py` asks Jev, from the record,
   the checks and the page text the reader handed the model, which of seven causes fits and
   who would have to change something (the reading procedure, the extraction, the scorer, the
   catalog, the state's list, or nothing). A session starts from a ranked list instead of
   reading every page cold. The answers are uncalibrated until a person's verdicts set a gate
   (the ladder's item 3: every reference calibrates its own gate, and none inherits another's).
2. **A second reader on the failing records** (Sam's Sheet 97 ruling, 2026-10-19: build it
   with xAI's Grok). The same text read by a second model, both readings scored by the same
   checks. Agreement is evidence; disagreement is a known issue carrying both readings. Fan-out
   pays here for the reason Sam gave on 2026-08-08: the hit is cheap to verify, because the
   scorer verifies a second reading for nothing.

What stays deterministic is what makes the judgments cheap to check: the capture, the closed
course list from COCI, the scorer, the insert-only loads and their receipts.

## How to recognize the turn

When a reader change needs a page read of the catalog's own words before it can be written
(S419's procedure), the records in question are in the tail. Count sessions per record, not
records per session; when the first number passes one, stop adding rules and add a judgment.

## Where else it applies

The CER already runs this shape: rule procedures first, a classifier on what the rules leave,
a person on the conflicts. The CCR's adjudication has had Jev as its magic half since S281. Any
corpus read by vendor shape will show the same body and tail.
