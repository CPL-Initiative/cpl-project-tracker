---
title: A prompt that quotes the wrong sentence teaches it
created: 2026-10-02
updated: 2026-10-02
tags: [methodology, prompting, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_place_anchor.test.js
  - chatbox/smoke_test.sh
---

# A prompt that quotes the wrong sentence teaches it

> **One-sentence summary** — when a model's instructions quote a bad sentence as the thing to avoid, the model can write that sentence back word for word; give the model the right form only, and keep the wrong one in the code comment and the test.

## Context

Sierra's catalog rule told her to attribute an absence to the catalog ("the catalog data lists no LVN entry program at an Orange County community college") and never to state it as a fact about the county. To make the point, the rule quoted the sentence an earlier answer had used to close: *"since no Orange County college currently teaches an LVN entry program."* Lessons: [`docs/cpl_assistant_lessons.md`](../cpl_assistant_lessons.md) (S314).

## The claim

### A quoted example is still a sentence in the context

The model reads a prompt as text to draw from, not only as rules about text. A sentence placed in the prompt, even under "do not write this", is a fluent, on-topic sentence the model has already seen in the exact situation it is answering. On the preview of #1812 (A/B run 36953527862) Sierra closed the Orange County answer with that quoted sentence, letter for letter, while production, whose prompt carried the same rule, happened to pass the same check on the same run.

### State the behavior positively, once, and move the counterexample out of the prompt

The rewrite (#1812, `sierra_place_anchor` 10) says what to write and when: *state the catalog's absence once, in the first paragraph, attributed to the catalog, and do not return to it; a later paragraph that must touch it says "the catalog data lists" again.* It describes the failure in words ("answers that opened with the attributed form have closed by restating it without the attribution") without reproducing it. The bad sentence lives on in the code comment beside the rule and in the test that forbids its return to the prompt. The next A/B passed every mode on both functions.

### The test pins the absence of the quote

`sierra_place_anchor` (10) fails if the prompt ever quotes *"since no Orange County college currently teaches an LVN entry program"* again. A later session adding a "for example, never say …" line would otherwise restore the failure with good intentions.

## How we got here

- The rule had quoted the bad sentence since S311 (a smoke failure on 7c's closing caveat).
- S314 changed the place rules around it (#1812); the A/B on that branch failed one assertion, 7c's absence guard, on the quoted sentence verbatim.
- Removing the quote and stating the positive form produced a clean A/B (run 36954842101).

The house-voice rule Sam set for prose (2026-09-16: *"Just make positive, active voice declarations"*, no "it is this, not that") reached the same conclusion for human readers: the contrastive frame makes the reader hold the wrong idea in mind.

## When this applies (and when it doesn't)

- **Applies** to any instruction a model reads at answer time: system prompts, rule overlays (`sierra_rules`), guidance rows, report-generator prompts.
- **Does not forbid naming a failure.** Describe what went wrong in your own words ("closed by dropping the attribution"); just do not hand the model the exact string.
- **One run is weak evidence.** The A/B grid is a single sample per function, and Sierra's prose varies run to run. Here the failure repeated the quote verbatim, which is strong evidence of the mechanism, and the next clean run agrees. Watch the smokes before treating it as settled for every rule.

## See also

- [`methodology-an-absence-in-the-data-is-a-statement-about-the-data`](methodology-an-absence-in-the-data-is-a-statement-about-the-data.md): the rule the quote was meant to enforce.
- [`reference-cccco-house-voice`](reference-cccco-house-voice.md): the positive-declaration rule for prose.
