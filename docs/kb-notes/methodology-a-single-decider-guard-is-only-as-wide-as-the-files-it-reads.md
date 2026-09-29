---
title: A single-decider guard is only as wide as the files it reads
created: 2026-09-19
updated: 2026-09-19
tags: [methodology, testing, auth, guards]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - tests/ccr_skyview_read_only.test.js
  - prototype/ccr_atlas_graph.js
  - prototype/ccr_universe.js
---

# A single-decider guard is only as wide as the files it reads

> **One-sentence summary** — a test asserting "exactly one place decides X"
> proves nothing about the files it never opens, and it fails *silently*,
> because a second decider in another file produces no error anywhere.

## Context

SkyView's curation ladder puts every authorization question through one
function, `curationRung()`. A jsdom suite guards that property directly:
*"nothing outside curationRung() decides authorization."* It passed on every
run for the life of the rule.

On 2026-09-19 an audit for a different reason found `__ccrDecision` in
`prototype/ccr_atlas_graph.js` — a complete drag-to-move curation surface with
a drop target per circle, a Move button, a review-status selector and its own
`moves[]` array. The ladder had never seen it. Two ordinary doors reached it
from a read-only page: the comprehensive view embeds a forest whose *Open this
one* calls it directly, and `#work/<discipline>` routed to it by URL.

The guard was correct about what it read. It read `ccr_universe.js`.

## The shape of the failure

A single-decider assertion is usually written like this:

```js
const univ = fs.readFileSync("prototype/ccr_universe.js", "utf8");
for (const m of univ.matchAll(/if\s*\([^)]{0,120}?(CPL_SESSION|CPL_TEAM_PHRASE)/g)) {
  // …flag any gate outside the one function
}
```

Everything about it is right except its **scope**, and scope is the one thing
it cannot assert about itself. The failure has three properties that make it
survive review:

1. **It is silent.** A second decider is working code. Nothing throws, no test
   reddens, the surface behaves — it just answers a question the ladder thought
   it owned.
2. **It reads as thorough.** The suite *names* the invariant, in prose, in a
   file called `read_only`. A reviewer checking whether the property is guarded
   finds a guard and stops.
3. **It grows with the codebase.** The guard was written when one file held the
   logic. The second file arrived later — or, here, predated it and was never
   swept in.

## What to do instead

- **Enumerate the files, and assert the enumeration.** A guard over "the
  authorization surface" should derive its file list (a glob over
  `prototype/*.js`) rather than naming one path, so a new file joins the sweep
  by existing.
- **Grep for the CAPABILITY, not the decider.** `curationRung` is what you
  hope is unique; `CPL_SESSION` / `cpl_team_pass` / a drag handler / a POST is
  what actually grants. Search the repo for the capability and check each hit
  routes through the decider.
- **Export the decider and make the other file ask.** The repair here kept one
  decider rather than adding a second: `window.__ccrRung` exports
  `rung`/`canStage`/`canExecute`, and `ccr_atlas_graph.js` calls it — failing
  **closed** when absent, since the build refuses to write a page missing
  either file. The suite now reads *both* files and asserts neither touches the
  raw storage keys.

## The generalization

This is not about JavaScript or about auth. Any guard of the form *"there is
exactly one X"* is really *"there is exactly one X in the region I inspected"*,
and the gap between those two statements is invisible from inside the guard.
When you write one, write down the region — and prefer a region that grows by
itself.

⚠️ **The same session hit a second instance of the same class**: a baseline
measured against a stale `origin/main` that predated the feature under test.
Both were confident answers derived from an unstated scope. See
[`methodology-verify-the-premise-before-you-build-on-it`](methodology-verify-the-premise-before-you-build-on-it.md).
