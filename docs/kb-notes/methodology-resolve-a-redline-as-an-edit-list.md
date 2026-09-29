---
title: Resolve a redline as an edit list, not as retyped prose
created: 2026-08-26
updated: 2026-08-26
tags: [methodology, drafting, regulation, pdf, tooling, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-change-inherits-every-reference-into-it]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - kb/_derive_55050_clean.py
  - kb/_verify_55050_redline.py
  - docs/reference/statute/t5_55050_clean_after_2026-08-12.txt
---

# Resolve a redline as an edit list, not as retyped prose

> **One-sentence summary** — a marked-up document extracts as garbage, and the
> fix is a reviewable list of (raw → clean, why) applied by a script, because
> retyping the finished text hides which readings were judgments and throws away
> two free structural checks.

## Context

Legal and policy documents arrive as redlines: struck text beside inserted text.
`pdftotext` drops the formatting, so the two halves run together as plain
characters. The adopted Title 5 §55050 extraction contains `at leastminimum`,
`standardized examsexaminations`, `(ab)`, `5575355050(i)`. **Twenty-one of these
in one regulation**, plus seven whole paragraphs struck with no marker at all,
identifiable only by content and position.

Sam, 2026-08-26: *"disregard all the strikethrough language as that will be
pulled off when the reg is published on the web."*

## The claim

**Resolving a redline is a judgment, so write it down as one.**

`kb/_derive_55050_clean.py` is 21 inline resolutions and 7 struck paragraphs,
each a row carrying the raw substring, the clean replacement, and the reason.
The script asserts every row matches the source and exits nonzero otherwise. The
clean text is *generated*, never typed.

Retyping the resolved text produces the same characters and is strictly worse:

- **It hides the judgments.** `at leastminimum` has two readings, and only one is
  grammatical. A reader of retyped prose cannot tell which calls were made, or
  check one.
- **It cannot fail.** A typo in retyped prose is silent. A wrong row in the edit
  list does not match the source and the script stops.
- ⭐ **It throws away two free structural checks:**
  1. **Contiguity.** The resolved subdivisions must run (a)–(m) with no gaps and
     no duplicates. Mis-assign a single struck-or-inserted paragraph and the
     letters collide. This is what confirmed seven whole-paragraph deletions
     with no other evidence available.
  2. **Residue.** Nothing may survive that still matches the run-together
     pattern. One missed collision fails the run.

### And the derived text is the baseline, not the extraction

Whatever you build next — an amendment, a quote, a comparison — is built on the
clean text. The raw extraction is for search only. A tracked-changes deliverable
gets the matching invariant: **reject all changes must reproduce the source
document exactly**, checked mechanically, subdivision by subdivision. If the
baseline is off by a word, every tracked change in the file is drawn against a
sentence that does not exist.

## How we got here

Two defects the checks caught that reading could not:

- **Same phrase, two answers.** `course contentoutcomes` appears in what becomes
  (f) — "content" struck, "outcomes" inserted. The *identical* phrase sits
  unstruck in (h). So (f) reads "course outcomes" and (h) reads "course content",
  in one section, deliberately. A global replace would have been wrong in one of
  the two places, and a reader who noticed the inconsistency would have been
  tempted to "fix" it.
- **A deleted conjunction orphans its punctuation.** The NOTE struck `" and"` to
  insert a citation, and accepting the change read *"66700 70901"* — no comma.
  Invisible in the redline view, which shows the strike and the insertion but
  never what the sentence reads as once accepted. Only rendering the accept-all
  view found it.

Both are guarded now, and four perturbations confirm the guards fail when broken
— one of which showed that writing a deletion as `w:t` instead of `w:delText`
does not merely break Word's rendering, it corrupts the reject-all view too.

## When this does not apply

A redline of two or three edits does not need a script. The threshold is roughly
where you stop being able to hold the resolutions in your head — which arrived
somewhere around edit five here, well below twenty-one.
