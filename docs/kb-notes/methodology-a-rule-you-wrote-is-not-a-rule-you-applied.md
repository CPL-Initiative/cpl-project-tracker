---
title: A rule you wrote down is not a rule you applied
created: 2026-08-21
updated: 2026-08-21
tags: [methodology, governance, process, testing, doctrine]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-capped-list-must-never-read-as-a-census]]"
  - "[[docs/kb-notes/methodology-a-manager-must-show-everything-it-manages]]"
  - "[[docs/kb-notes/methodology-hiding-a-control-also-hides-the-way-in]]"
artifacts:
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
