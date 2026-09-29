---
title: Retire a global dial into per-item dials without moving any numbers
created: 2026-08-04
updated: 2026-08-04
tags: [methodology, funding, refactor, migration, config]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
  - cpl_funding_data.js
  - kb/supabase_funding_priority_factors.sql
  - tests/cpl_funding_cumulative_target.test.js
---

# Retire a global dial into per-item dials without moving any numbers

> **One-sentence summary** — to replace a single global scalar with a per-item
> one, pick the per-item *neutral value* so it reproduces the old global exactly,
> fold any structural role the global was secretly doing into the formula, and the
> code change moves zero numbers — then the per-item values are a separate,
> post-deploy policy step.

## Context

The Implementation Funding model had one global **target multiplier** (2.0). Sam &
Malone wanted to **decouple two things it conflated**: the *funding split* (how the
pool divides across priorities — the `share`) and the *FTES difficulty* (how much
prior-learning a college must post to earn a priority's pot). One global scalar
can't tune those independently. The ask: move the dial to the priority level.

## The claim

Replacing a **global scalar dial** with **per-item dials** is safest as a
**behavior-neutral refactor plus a separate policy write** — three moves:

1. **Choose the per-item neutral value to be an exact identity.** Here `factor 1.0`
   had to reproduce today's model. A priority's *price* per unit = `factor × base
   rate`; its target = `pot ÷ price`. So `factor 1.0` = the plain base rate = the
   uniform model. Higher factor ⇒ pays more per unit ⇒ **fewer** units earn the pot
   (a premium on the harder / more-valued behavior); this is the *price reading*,
   and it scales the target **inversely** (`factor 2.0` halves the target).

2. **Fold any structural role the global was secretly doing into the formula.** The
   old ×2 was doing *double duty*: a policy dial **and** the cumulative-window
   conversion (`nYears`). If you only move the policy role, the neutral default
   silently reverts the window (targets halve). So make the window conversion
   **structural** — `target = entitlement/rate × (nYears / factor)` — leaving
   `entitlement` per-year (never fold `nYears` into it; that would double under
   front-load and cancel the front-load incentive). Now `factor 1.0` is a true
   identity: `(perYear/rate) × nYears` = the cumulative target the ×2 produced.

3. **Split the merge from the activation.** With the neutral default an identity,
   **merging the code moves no live numbers** (the live config still carries the old
   dial, which the new code ignores → neutral). The per-item *values* are a separate
   write to the shared config — and it is **post-deploy only**: removing the old
   global from the config while the *old* code is still deployed makes it fall back
   to a default and silently breaks (targets halved). Order: merge → deploy → config.

## How we got here

Prototyped the whole model in the calculation sanity-check artifact first
(real-Chromium verified: neutral `1/1/1` reproduced the anchors — pool
$23,240,308, statewide target 4,114 CPL FTES — before any code moved), then ported
to `cpl_funding.js`. `factor 1.0` reproduced the live numbers to the dollar in a
jsdom boot. The two affected tests were rewritten to assert the **inverse** scaling
(`factor 2.0` halves the target) and the cumulative default. PR #971; live config
activated post-deploy via `kb/supabase_funding_priority_factors.sql` (P1 0.5 / P2
1.0 / P3 2.0 → statewide target 5,759 FTES, pool earns 35.6%). Retired
`targetMultiplier` / `effectiveFtesRate` / `setTargetMultiplier` in the same sweep
— grep the *formula*, not just the functions you remember (a display site had a
stale multiplier note).

## When this applies (and when it doesn't)

- **Applies** whenever you're generalizing one knob into many (global → per-row,
  per-tenant, per-priority) and want a reviewable, reversible migration: the
  identity default lets you prove "no behavior change" with a test, and the
  post-deploy activation keeps the shared state readable during the transition.
- **The `factor 1.0 = identity` trick needs the global to have a *neutral point*.**
  A multiplier's is 1.0; an additive offset's is 0. If the global has no neutral
  value, you can't make the migration behavior-neutral this way.
- **Watch the shared-config sequencing.** The post-deploy rule only bites when the
  same config row is read by deployed code you don't control the timing of (here,
  GitHub Pages). For a config read only by the new code, order doesn't matter.
- **Direction is a real decision, not a default.** A per-item factor can scale the
  *target* (stringency) or the *price* (premium) — they're inverses and flip the
  incentive 180°. Confirm which the owner means before building (Sam meant price:
  higher factor = pay more per unit = easier pot).

## See also

- `[[docs/cpl_funding_lessons]]` — the 2026-08-04 section (the full port narrative)
- `[[docs/kb-notes/methodology-a-default-payout-masks-the-gap-beneath-it]]` — the sibling "a dial doing two jobs hides one of them" lesson
- PR `#971` — the implementation; `kb/supabase_funding_priority_factors.sql` — the post-deploy activation

---

*Authoring check: durable (the migration pattern outlives this model), reusable
(any global→per-item dial refactor), distilled (one concept: neutral-identity +
structural-fold + split-the-activation), self-contained.*
