---
title: A rule you wrote down is not a rule you applied
created: 2026-08-21
updated: 2026-09-04
tags: [methodology, governance, process, testing, doctrine, accessibility, lint]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-capped-list-must-never-read-as-a-census]]"
  - "[[docs/kb-notes/methodology-a-manager-must-show-everything-it-manages]]"
  - "[[docs/kb-notes/methodology-hiding-a-control-also-hides-the-way-in]]"
  - "[[docs/public_pages_a11y_lessons]]"
artifacts:
  - scripts/check_cobi_header_layout.js
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/team_phrase_affordance.test.js
  - cobi_admin_surface.js
---

# A rule you wrote down is not a rule you applied

> **One-sentence summary** — In a repo with a large written doctrine, the
> dominant failure mode stops being *ignorance* and becomes *non-application*:
> the rule that would have prevented the bug is already committed, sometimes
> feet away from the defect, and nobody consulted it.

## Context

Session 178 fixed four defects across Sierra, My College and a new COBI tab.
Afterwards, every one of them turned out to be covered by a rule this repository
had **already written down** — three as published KB notes and one as a code
comment in the same function. None was a new lesson.

That is a different problem from "we didn't know", and it needs a different fix.

## The claim

**Once a project's doctrine is large enough to be useful, its main risk is that
it is not consulted.** Writing the rule felt like solving the problem; it only
recorded the solution.

Four instances from one session:

| Defect | The rule that already existed | Where it lived |
|---|---|---|
| `.slice(0, 3)` truncated 9 colleges to 3 | *`"angeles" alone matches 9; a limit of 3 truncated the answer`* | **A comment 34 lines above the defect**, describing the identical bug on the identical colleges |
| A capped list rendered as a complete set | *"`peer_total` ships as a COLUMN ('showing 9 of 261') — a capped list must never read as a census"* | `CLAUDE.md` §11, alignment workstream |
| A gated tab named an obstacle with no way in | `hiding-a-control-also-hides-the-way-in` | A published KB note |
| A new tab missing from the Admin inventory | `a-manager-must-show-everything-it-manages` | A published KB note |

⭐ **The first is the sharpest.** A previous session hit that exact bug, on those
exact nine colleges, fixed the inner query (3 → 12), wrote a comment explaining
why — and left the identical cap 34 lines below. Proximity did not help. The
comment was *about* the fix, not *a check on* the rest of the function.

## Why writing it down is not enough

- **A rule in prose has no consumer.** Nothing reads `CLAUDE.md` at the moment
  the defect is introduced. This repo already learned the general version —
  *"a settled ruling does not enforce itself, the consumer has to change"* — and
  then kept discovering it in new places.
- **The corpus grows faster than anyone re-reads it.** `CLAUDE.md` is 2.2× its
  own lint budget; the KB-notes lane has dozens of entries. Recall of the right
  note at the right second is the bottleneck, not authorship.
- **Fixing one instance does not generalize.** Repairing the inner limit did not
  prompt anyone to ask *"where else is this same bound?"* — which is the question
  that would have found the twin.

## What to do instead

1. **Turn the rule into a test or a consumer.** Two of the four defects were
   caught by CI precisely because someone had done this: `team_phrase_affordance
   .test.js` and `admin_tab.test.js` are the *executable* form of two KB notes.
   The two that were only prose reached production. **That difference is the
   whole finding.**
2. **When you fix an instance, grep for its twins in the same file.** The cheapest
   possible check, and it would have caught the cap.
3. **Search the repo before generating.** `CLAUDE.md` already advises this
   ("check whether this repo has already answered it"); the session that wrote
   this note still hand-rolled a TS-extraction helper while `tests/lib/lift_ts.js`
   sat in the tests directory doing exactly that job.
4. **Prefer a shared helper over a local copy** — `unlockRow`, `lift_ts`,
   `cplCollegeShort()`. A helper is a rule with a call site.

## How we got here

Measured across one session (2026-08-21, PRs #1276–#1278). CI found two of the
four; the other two were found by the user reporting a wrong answer. Zero were
found by a session recalling the relevant note unprompted.

## Limits

This is not an argument against writing doctrine — the notes are what made the
diagnosis fast once the defect was known. It is an argument that **a note's job
is only half done until something executes it.** When a new rule is authored, the
next question is: *what would fail if this were violated?* If the answer is
"nothing", it will be violated.

---

## Update 2026-09-04 — the sharpest instance yet, and the test that picks the remedy

**A rule authored MINUTES earlier, by the same author, in the same session, was
still violated.** While reworking the COBI masthead (PR #1469) a comment was
written into `cobi_brand.js` saying in as many words that `--text-faint` must
never be used for essential text — and `--text-faint` was then used for a new
essential row label in `cobi_identity.js` a few edits later. There was no stale
corpus and no failure of recall: the rule had just been *written*. That rules
out the "nobody re-reads it" explanation for this class and leaves a harder one.

**Why it happened: a rule states a standard, but only a measurement detects a
violation.** "Never use faint for essential text" is a *goal*. It cannot tell
you that `--text-faint` composites to 3.53:1 on the masthead's glass — nothing
can, except computing it. Consulting the rule and complying with it are
different acts whenever compliance is a computable property the author cannot
see. The same session's second proof: **299 jsdom test files were green while
the header visibly overlapped itself and six of its text styles failed AA**,
because jsdom has no layout engine and paints nothing.

**So the note's "turn it into a test or a consumer" gains a selection test.**
Ask whether the rule's predicate is *computable*:

- **Computable** — contrast ratios, target sizes, file sizes, naming patterns,
  spelling, generated-artifact freshness, no-raw-hex. Wording is not the lever
  here and never was; **add the lint**. Rewriting a rule that is already correct
  and already loaded treats a detection failure as an attention failure.
- **Not computable** — whether a glyph earns its place, whether prose is in
  house voice, whether absence should be de-emphasized. A check can surface a
  candidate; the standard itself stays doctrine and its enforcement stays human.

**And the trigger is a third, separate thing.** A check nobody runs is worth
exactly what a rule nobody applies is worth. Detection, firing and remediation
fail independently: the checker detects, a hook or CI step fires it, and a
playbook says how to fix. Sam's framing of the same gap, 2026-09-04: *"I can't
seem to get claude.md or memory to reliably enforce this when we are building
day to day and I often forget to remind you."*

Evidence: `scripts/check_cobi_header_layout.js` found seven real AA failures and
19 layout failures on `main` in one header — none prevented by any rule, all of
them present while the suite was green.
