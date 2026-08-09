---
title: Verify the last hop of a resolution chain
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, configuration, data-lineage, funding, documentation-decay]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-a-written-backlog-decays-silently]]"
  - "[[docs/kb-notes/methodology-verify-consumer-before-migrating]]"
artifacts:
  - cpl_funding_data.js (year_priorities — baked defaults)
  - cpl_funding.js (activeScenario, prioStrategies)
  - Supabase cpl_funding_config
---

# Verify the last hop of a resolution chain

## What the documentation said

The $35M funding priorities are governed by an explicitly good rule — **sourced,
never pasted** — and the docs even wrote down the chain:

> resolution order is `cpl_funding_data.js` → `year_priorities` (baked,
> hand-maintained) ⊕ Supabase `cpl_funding_config.config.year_priorities`
> (Chancellor/team-editable, **currently EMPTY so defaults stand**)

Everything about that is right except the parenthetical, and the parenthetical
is what a reader acts on. It says: *you may stop at hop one.*

## What was actually there

`cpl_funding_config` was not empty. It held two full scenarios, and the active
one (`activeScenario` defaults to `"Scenario 1"`) disagreed with the baked
defaults on nearly everything that matters:

| | Baked `cpl_funding_data.js` | Live Scenario 1 |
|---|---|---|
| Shares | P1 **30%** · P2 **42%** · P3 **28%** | P1 **50%** · P2 **30%** · P3 **20%** |
| P1 description | *completion through CPL awards* | *consistent statewide college **access*** |
| P1 metric | Headcount eligible | **Applied CPL Units as FTES** |
| Strategies | none | **23**, hand-typed by the team |

A page built by following the documented source — the baked file — would have
shown a college the wrong priorities, the wrong weights, and the wrong measures,
while being able to point at a file and claim it was sourced.

And the 23 strategies are the sharper part. The roadmap listed the action
library as *"the hard part — we know each college's STATE, not the playbook that
moves it"*, and recommended seeding it by hand. **It had already been written.**
It was one hop further down the chain the docs told us to stop reading.

## The rule

A resolution chain is a claim about **where values come from**, and it decays
one hop at a time. An overlay is *designed* to be edited by people who will
never touch your documentation — that is the entire reason it exists — so
**"the overlay is empty" is the single least durable sentence you can write
about it.** It is a measurement with a timestamp, masquerading as a property.

So:

- **Read every hop before quoting any of them.** Cost here: one SQL query.
- **Never document a hop as empty.** Document *how to check* it. "Empty as of
  <date>" at minimum; better, a line of code the reader can run.
- **Suspect the chain first when the docs and the screen disagree** — the
  overlay is where humans work, so it is where truth accumulates fastest.
- When something is described as hard to build, **check whether the people who
  own it have already built it somewhere you are not looking.**

## The tell

The doc was not careless — it named the chain, the table, the column, and the
precedence. That precision is exactly what made the wrong parenthetical
persuasive. **Specificity reads as verification, and it is not.** The sentence
worth distrusting is never the vague one; it is the confident aside inside an
otherwise rigorous description.
