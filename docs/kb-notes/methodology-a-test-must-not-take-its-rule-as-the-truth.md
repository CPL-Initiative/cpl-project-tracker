---
title: A test must not take its own rule as the truth
created: 2026-11-14
updated: 2026-11-20
tags: [methodology, testing, matching, program-requirements, honors]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/commons_lessons]]"
---

# A test must not take its own rule as the truth

> **A test's expected answers come from a person or from a derivation that shares no code with the rule under test.
> A test that pins the rule's own output, or the filed claim the rule was built to judge, passes on every wrong answer
> the rule gives.**

## Context

Session 653 had two tests of this shape, both caught by readers before anything applied.

- **#3324, the GE-pattern page claim.** The test's allowed list (`GE_ALLOWED`) was the set of claims the new rule
  allowed when it first ran. It pinned the rule's output, so a wrong allowance passed and a later fix that refused it
  failed the test.
- **#3315, the Honors rows dry run.** The matcher's recall script counted "right" as the matcher's own pairs minus a
  hand-written list of wrong ones. A new wrong pair counted as right, the count could never fall, and "right 523, missed
  0" measured nothing. Its derivation also used the matcher's own code parser, so a code with a space before the
  college letter (`PHIL 225 F`) failed both the same way. An independent pass over the members file found six real
  pairs that both missed.

## The claim

A rule's test proves something only where its expected answer could have come out differently from the rule. Two
sources qualify: answers a person wrote down from the source, and a second derivation built from other code and other
evidence (for the Honors pairs, a code-H pass over the local courses beside the title matcher). A snapshot of the
rule's output pins its behavior; it is a regression guard, and it is labeled as one.

## How to apply it

1. Write the expected answers before reading the rule's output, from the page or the record itself.
2. Where answers come from a second derivation, check it imports nothing from the rule under test.
3. Report recall as a count that can fall: pairs the independent pass found that the rule missed.
4. Keep a snapshot test only beside a hand-written one, and name it a regression guard.

## A recall gate on outline pages (S690, #3601)

The same failure reached a gate. #3601 let City College of San Francisco's outline reader run its full read only
after a recall count on a 12-page trial. In the first review round (BLOCKING), the gate's "hand" counts equalled
`len()` of the parser's own outcomes, so the parser was compared with itself; and a trial that filed no pages, or
pages answered 403, passed, because zero matched zero. The second round took the counts by eye from the SLOs the
trial's job log prints (trial 44744884314, job 136319047157, 12 of 12 right), bound them to the parser's fingerprint
(`d5cef493`), and refuses a page that did not answer 200, a page cut at the Reader's cap, a count with no source and
a fingerprint that no longer matches. The full read then filed 1,417 pages and the load 1,416 rows.

Two rules for a recall gate follow. Count the page, from what a person can see, before the parser's output is
read. And make the gate refuse what it cannot judge (an empty trial, a refused page, a changed parser) instead of
passing it. Two points stayed open for the follow-up: the gate does not check the host, and the fingerprint does not
cover `_ws`, `READER_HTML_CAP` or `SLO_HEADING`. Pitfall row `p-recall-gate-counts-parser-output-s690`; the run:
[`program_requirements_harvest_lessons`](../program_requirements_harvest_lessons.md), *S690*.

Related: [A new matcher is gated by a self-recall test](methodology-a-new-matcher-is-gated-by-a-self-recall-test.md).
Pitfall row `p-snapshot-test-pins-the-rule-s653`.
