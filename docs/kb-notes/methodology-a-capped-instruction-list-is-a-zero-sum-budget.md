---
title: A capped instruction list is a zero-sum budget, and the cap that binds is rarely the one on display
created: 2026-08-21
updated: 2026-08-21
tags: [methodology, sierra, governance, prompt, curation, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - sierra_training.js
  - chatbox/supabase_sierra_guidance.sql
---

# A capped instruction list is a zero-sum budget, and the cap that binds is rarely the one on display

> **One-sentence summary** — Sierra receives the **newest 10** switched-on
> instructions; an eleventh does not fail, it silently evicts the oldest — and the
> Training tab prominently displays a *character* budget that reads 40% full while
> the *row* cap is the one about to bite.

## Context

Sam asked for a new Sierra Training Fact on 2026-08-21. `sierra_guidance` held
exactly **10 active rows**. The oldest was the naming rule (`cb226a48`, 2026-07-03)
— "the program is the CPL Initiative, never MAP Initiative; never expand MAP as
Military Articulation Platform" — which `CLAUDE.md` names as enforced in five
places, one of them being that row.

Adding an eleventh would have turned the project's standing naming rule off,
silently, as a side effect of adding an unrelated instruction about a table.

## The claim

**Two caps govern this list and only one of them is visible.**

```ts
const GUIDANCE_MAX_RULES = 10;        // ← the one that binds
const GUIDANCE_MAX_CHARS = 9000;      // ← the one on screen
const GUIDANCE_MAX_CHARS_PER_RULE = 1500;
```

`fetchTeamGuidance()` orders `active = true` by `created_at desc` and `.limit(10)`.
So the eleventh instruction does not error, does not warn, and does not truncate —
it **displaces**, oldest first.

⚠️ **The Training tab renders the char budget as a headline and the row cap as a
per-row footnote.** At the moment of the near-miss it read *"Space used: 3,588 of
9,000 characters (40%)"* — a green light. The row cap surfaces only as
`ruleNotSentHelp()` on the individual rows that have fallen off the end, which you
see only if you scroll to a row you were not looking for.

⭐ **The eviction order is exactly backwards from the value order.** Newest-first
means the rows most likely to be evicted are the **oldest**, and in a guidance
layer the oldest rows are the *standing* ones — naming conventions, tone, safety
posture — while the newest are usually *reactive* (a thumbs-down on one question
last Tuesday). A cap that evicts by age evicts your constitution to make room for
a bug report.

## What to do

1. **Before adding, count.** `select count(*) from sierra_guidance where active;`
   If it is at the cap, adding is a **trade**, and naming what you are trading is
   part of the ask — not a footnote after the fact.
2. **Write it `active = false` first.** The row saves, the wording is reviewable in
   the 🧭 pane, and production is untouched until a human flips it. There is no
   DELETE policy on this table by design, and deactivated is the resting state, so
   an inactive draft costs nothing.
3. **Retire prose that CODE now enforces.** The two rules Sam retired to make room
   ("list all ten PST credit recommendations, not one"; "recommend the closest
   local course when suggesting an adoption") were both written in August 2026
   against defects that retrieval has since fixed structurally —
   `chatbox_credential_recs` publishes the full set, and
   `credential_alignment_for_college()` returns ranked local candidates. **An
   instruction is the cheapest fix and the most expensive slot.** When the
   mechanism changes, the instruction should be a candidate for retirement, not a
   permanent belt over a working brace.
4. **Read the neighbours before you write.** The draft's first wording said *"never
   rank colleges"*, which would have contradicted Sam's own 2026-08-18 instruction
   that naming high performers like Santiago, ARC and Norco is fine. Two
   instructions can be individually reasonable and jointly incoherent, and the
   model resolves that conflict without telling anyone. **Scope your clause to the
   surface it belongs to.**

## The general shape

Any fixed-size list of behavior-shaping inputs — prompt directives, feature
flags read in order, a top-N retrieval budget, a nav bar with an overflow — is a
zero-sum budget. Ask of each:

- **What does the Nth+1 entry do?** Error, truncate, or *displace*? Displacement
  is the dangerous one because nothing reports it.
- **What gets displaced first?** If it is "oldest", your most settled rules are
  the most fragile.
- **Where does the UI say so?** If the visible meter measures a different
  dimension from the binding cap, the meter is worse than no meter: it reads as
  reassurance.

## Related

- The repo's own recurring lesson — *"a settled ruling does not enforce itself,
  the consumer has to change"* — has a mirror here: **a settled ruling can also be
  quietly un-enforced by a consumer that only ever reads the newest ten.**
