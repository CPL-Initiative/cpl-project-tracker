---
title: A green check you did not scope is not evidence
created: 2026-08-23
updated: 2026-10-14
tags: [methodology, testing, ci, verification, process]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - tests/cpl_funding_equity.test.js
  - tests/cpl_funding_public_private.test.js
  - tests/funding_model_page.test.js
---

# A green check you did not scope is not evidence

> **One-sentence summary** — Before treating a passing check as verification,
> name which of *your* changes it actually exercised; three different green
> signals in one afternoon each covered something other than the change they
> were taken to clear, and the third of them put `main` red.

## Three greens, none of them evidence

All three happened on 2026-08-23, on the same tab.

**1. A required check that covered nothing I touched.** The repo's merge rule is
"merge on green required checks", where the required check is a secret scanner.
It says nothing about behavior. The suite that *did* cover the change was
non-required and still running. Merging on the first while ignoring the second
is not following the rule — the rule assumes the non-required check is not the
one carrying your risk.

**2. A local subset I chose myself.** Rather than the full suite I ran the files
I judged relevant. Both files that broke were outside my selection — and one of
them (`cpl_funding_equity`) held a **duplicate** of an assertion I had already
corrected in a file I *did* run. Choosing the subset is choosing the result.

**3. An exit code belonging to the wrong process.** A background run reported
"exit code 0"; that was the wrapper shell's status, not the test runner's. The
run had been killed — `REAL_EXIT=143`, SIGTERM, by my own `pkill`. I reported it
as a clean full-suite pass.

## The related trap: asserting on the part that cannot fail

The same day, a page test asserted the rendered row count of `#tbody` and
passed, while three sibling containers accumulated a duplicate copy of
themselves on every repaint. `#tbody` was the only container whose own draw
routine cleared it first. **The assertion was on the one element that could not
exhibit the bug.**

That is the same error in miniature: a green signal chosen without asking what
it is capable of showing.

## A fourth green: the stand-in that stopped matching (2026-10-14)

The a11y sweep seeds each COBI view by replacing `window.fetch` with stand-ins
keyed on the URL a read makes. When My College moved its drafts read from
`program_requirement_records` to the view `program_record_college_items`
(#2097), the seed's stand-in no longer matched any request. The section simply
did not paint, and the sweep measured the rest of the page and passed. Nothing
failed, because nothing that was checked contained the change.

The fix scopes the green: the seed now waits for the element its stand-in feeds
(`ul.cb-dr li`), so a stand-in that stops matching fails the seed instead of
thinning the page. Proved both ways: pointed back at the old table, the seed
times out. Any stand-in keyed on a URL deserves the same wait for the element it
exists to paint.

## The check

Before a passing signal counts as verification, answer all three:

1. **What did it run?** Name the files, not "CI". If you cannot name them, the
   signal has no scope and no weight.
2. **Does that intersect what I changed?** A required check that scans for
   secrets does not verify a solver. A subset you picked is an argument you
   made, not evidence you gathered.
3. **Whose exit code is that?** A wrapper, a pipe's last stage, and a background
   task's reported status are all different from the command you care about.
   `REAL_EXIT=$?` immediately after the command, or read the runner's own
   summary line.

And for the assertion itself: **would this check fail if the bug were present?**
Break it deliberately and watch it go red. Three of the guards written this week
were vacuous until that was done.

## Why this is worth a note rather than more care

Care did not prevent it — the same person wrote `; echo "EXIT=$?"` reports the
last pipe stage into a handoff that morning and then trusted a wrapper's exit
code that afternoon. The counter is procedural, not attentional: **name the
scope out loud before you rely on the green.**
