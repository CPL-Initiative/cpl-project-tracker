---
title: A regressed mode must reach the changed code
created: 2026-10-18
updated: 2026-10-18
tags: [methodology, sierra, smoke-test, a-b-test]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/smoke_test.sh
  - .github/workflows/cpl-chat-preview-ab.yml
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# A regressed mode must reach the changed code

> **One-sentence summary** — Before an A/B regression on a model-prose smoke counts as the candidate's fault, trace the regressed mode's request through the function to the diff; a mode whose route never enters the changed code cannot regress from it, and what is left is the model's variance.

## Context

Sierra's preview A/B runs a 40-mode smoke against production and the candidate and fails on any assertion production passes and the candidate fails. The assertions read model prose, so two runs of the same function differ in wording, and the grid's own footer says so. The temptation on a red grid is to read the regressed answer, find a plausible story in the diff, and fix the function. On 2026-10-18 that story was ready to hand (more catalog blocks in the context), and it was wrong.

## The claim

A regression is the candidate's only if the regressed mode's request reaches the code the candidate changed. Trace the route first: which detection fired, which blocks the context builder ran, and whether the diff sits on that path. When the path does not touch the diff, the two deployments built the same context for that question, and a different answer is variance. The grid then says what to do: a mode that reaches the diff and regresses twice is a bug; a mode that cannot reach it is noise, however bad its prose reads.

## How we got here

cpl-project-tracker#2230 changed one block of the chat function: the complete-records read behind a single college's program course lists. Three A/Bs regressed three different modes. Run 1 lost 7l, which does reach the block, to a real gate bug (Active only; COCI marks most credit programs Approved), fixed in 57b25bb4. Run 2 regressed 7c and 9; run 3 regressed 7s alone, with 7c and 7l green. 7c (Orange County) and 7s (the San Gabriel Valley) name a place: `resolveAskedPlace` strips the place from `routeText` before `detectAndFetchCollegeProfile(routeText)` runs, so no single college resolves and the changed block never runs for them. The candidate's 7s answer never used the regional course lists production's did, from the same context. The deploy proceeded and the lane records the production smoke.

## When this applies (and when it doesn't)

It applies to any A/B whose assertions read model output: the smoke, the drafting checks, a classifier's sampled answers. It does not excuse a mode that reaches the diff: there, two regressions in a row are real, and the fix is in the function. It also does not replace reading the prose; the prose names which story to test, and the route test settles it.

## See also

- `[[docs/cpl_assistant_lessons]]` S418 — the three runs and the route trace
- PR `#2230` — the change and its A/B comment
- `[[docs/kb-notes/methodology-verify-an-ask-against-what-the-reader-sees]]` — the same move for a UI ask

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
