---
title: A saved setting is not the effective value — ask the model, not the config
created: 2026-08-26
updated: 2026-08-26
tags: [methodology, cpl-funding, config, measurement, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting]]"
artifacts:
  - cpl_funding.js
  - scripts/funding_effective.js
  - tests/cpl_funding_effective.test.js
---

# A saved setting is not the effective value — ask the model, not the config

> **One-sentence summary** — a stored configuration value is an *input* to a
> model, never its output; overrides sitting on top of it can leave a saved,
> present, authoritative-looking value doing nothing at all.

## Context

A session read `yearPriorities["2"].factor = 1` out of the **live** Supabase
funding config and reported it as the model's Year‑2 factor. The model uses
**0.5**. Sam: *"Check your data … Never rely on the config, Sky."*

The value was not stale and not missing. It was saved, present, and completely
**inert**, because `mirrorYears` makes `prioSlot()` return `"1"` for every year,
so that block is never read.

## The claim

**A missing value sends you looking. A dormant one does not.** That asymmetry is
why this is the failure mode a codebase repeats: nothing prompts you to doubt a
value that is right there, correctly typed, in the authoritative store.

This repo already had the rule for **money** — *never re-derive an allocation,
call `_alloc()` / `ncModel()`*. The same rule applies to **dials**, and stating
it only for money is what let a session obey it for one and not the other.

There is a second, softer trap in the same shape: a store can be *layered*, and
knowing you must read the live layer is not the same as knowing the live layer
is authoritative. The prior guidance here — *read the Supabase overlay, not the
baked defaults* — is true and **not sufficient**. The overlay is still an input.

## Four overrides that make a stored value dormant or mislabeled

Each of these is live in the CPL funding model today:

| override | effect on a stored value |
|---|---|
| `mirrorYears: true` | later years read Year 1's block; their own is never read |
| `disbursement: "frontload"` | every year after 1 has a **zero cap**, so its block cannot matter |
| `priorityOrder: [2,0,1]` | the stored index is **not** the screen ordinal — P1 is stored slot 2 |
| `SCENARIO` (per-browser what-if) | beats the shared config via `firstDefined()` |

## What to do instead

Give the model **one function that answers "what are you using"**, and read that.
`cpl_funding.js` exposes `_effective()`; `scripts/funding_effective.js` prints it
and **refuses to run without a config**, because printing baked defaults under
the heading "effective" reproduces the very error the tool exists to prevent.

Two details that turned out to be load-bearing:

- **Report the reason, not just the value.** `_effective()` flags each year as
  `MIRRORED` or `CARRYOVER`. A reader given only "factor 0.5" cannot tell whether
  the Year‑2 config is being honored or bypassed.
- **Clear the caches first.** The hook initially read a memoised `ncModel()` from
  boot, so a caller that set a config afterwards got **baked** numbers reported
  as "effective" — the same bug, reproduced *inside* the fix. Its own test caught
  it, by asserting `_effective()` and `_nc()` agree.

## How to verify a tool like this

Against **independently recorded numbers**, not self-consistency. The harness
reproduces 30 of 33 at the noncredit floor, break-even 3,909 FTES, and
$25,240,308 to institutions — figures `CLAUDE.md` recorded from Sam's own dials
before the tool existed. A tool that only agrees with itself proves nothing.

And build the fixture as a **trap**: Year 2 carries deliberately different
shares, factors and titles from Year 1, so a hook that transcribes storage and a
hook that asks the model give different answers. Then run the same fixture with
the mirror **off** — the mirror-on case alone would also pass a hook that simply
hardcoded slot 1.

## Generalization

Wherever a system has a settings store and a runtime that layers on top of it,
"what is saved" and "what is in force" are two different questions, and only the
second one is ever the answer to "what is it doing". Expose the second as a
first-class read. A rule people must remember will be forgotten; a command they
can run will not.
