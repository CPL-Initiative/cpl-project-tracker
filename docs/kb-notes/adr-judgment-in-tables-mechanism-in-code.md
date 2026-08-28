---
title: "ADR — Judgment goes in curatable tables; mechanism stays in code"
created: 2026-08-14
kb-status: published
tags: [adr, governance, architecture, curation, sierra, cobi, decision-rights]
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts (the ~10 built-in rules this is about)
  - cpl_memory rows judgment-in-tables-mechanism-in-code, sierra-rules-stay-separate-from-cpl-memory
related:
  - "[[docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what]]"
  - "[[docs/sierra_training_tab_scope]]"
  - "[[docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint]]"
---

# ADR — Judgment goes in curatable tables; mechanism stays in code

**Status:** accepted (Sam, 2026-08-14) · **Scope:** COBI/CPL surfaces generally,
Sierra first

## The decision

> "Seems this should be a design principle for COBI — to move as much as
> possible instructional variables to curatable tables. Thinking of all the
> guiding decisions we've made for things in CCR, etc."
> — Sam, 2026-08-14
>
> "…unless doing so is less efficient or less reliable for AI procedures, which
> consult all sorts of sources for memory and context."
> — Sam, same conversation

**Judgment goes in tables. Mechanism stays in code.** The caveat is not a
weakening — it is what makes the principle implementable, because it forces the
four tests below instead of a blanket "move everything."

## What forced it

Sam wrote a Sierra training instruction at 13:33 on 2026-08-14 telling her to
answer a credential question by naming the colleges that had articulated it. He
re-tested at 14:49 and got the old behaviour. The rule was active, correctly
authored, and well inside both the newest-10 and 9,000-char budgets.

Two things were wrong, and **both were invisible to him**:

1. The adopter **names** never reached the prompt at all — every credential RPC
   reduces them to a count in SQL (`cardinality(c.adopter_colleges)::integer`).
   The instruction could not be obeyed. (PR #1178.)
2. `STATEWIDE_RULE` — a hard-coded const saying *"never tell them to go to one
   specific college's page to 'access' a statewide credit"* — was actively
   suppressing the answer he wanted. He could not see it, could not edit it, and
   the prompt block promising *"the team guidance wins"* is a sentence, not a
   mechanism.

The team can see and edit `sierra_guidance`. The team cannot see or edit the
~10 rules that **outrank** it.

## The four tests

**1. Would a curator ever have a defensible reason to change this?**
If no, it is code. The ACE typographic fold is a *parser's* concern — making it
curatable would ask humans to hand-merge `3 hours in supervision` into
`3 hours in Supervision` **767 times**, which is the posture finding in
[`methodology-tell-a-parser-defect-from-a-people-defect`](methodology-tell-a-parser-defect-from-a-people-defect.md).
`ADOPTER_CAP = 12` is a display choice. `SHAPE_RE` is mechanism.

**2. Is the read cheap where it is needed?**
Sierra's latency budget is 1.7–5.0s and she already makes many calls per turn.
**One table holding all rules is one read. Five tables for five rule families is
five.** Sam's efficiency caveat therefore argues for *one* table, not many — and
that is also the answer to "AI procedures consult all sorts of sources."

**3. Does a failed read leave the system ungoverned?**
This is the reliability half and the rule most likely to be got wrong:

> **A curatable table must OVERLAY code defaults, never replace them.**

Then a failed read costs the *edits*, never the *governance* — Sierra is never
running with no rules at all. Same shape as `FALLBACK_CONTACTS` being a
display-layer fallback, and the tab rule that a failed read renders `unknown` at
the top, never `0`.

**4. Does moving it increase or decrease the number of places to look?**
Usually **decrease**, which is counter-intuitive and worth measuring before
assuming otherwise. The naming rule alone currently lives in `report_generator.js`,
`college_report_generator.js`, `annual_report.js`, `sierra_guidance` row
`cb226a48`, `CLAUDE.md`, and the public KB's `claude/CLAUDE.md` — six copies that
can drift. One curatable table with a code fallback is fewer sources than today.

## Already proven twice in this repo

- **`cr_reference_decisions`** — keyed on `group_key` precisely so a rebuild can
  never overwrite a curator's judgement.
- **`map_contact_proposals`** (#1167) — written up at the time as *"curator
  proposals are data now, not code."* That is this ADR, learned once already in
  a different corner.

## The backlog it generates

Roughly by value:

| Where judgment currently sits in code | Why it qualifies |
|---|---|
| The ~10 built-in Sierra rules + `AUDIENCE_RULES` | Governs a public bot; just caused a live defect |
| `NAMING_RULE` × 3 report generators | Six copies of one ruling |
| `FALLBACK_CONTACTS` / `CPL_PAGES` / `CPL_LIAISONS` | Curator knowledge about real people |
| `UMBRELLA_DISCIPLINES`, `SISTER_PAIRS` (`kb/_row_audit.py`) | "Which disciplines are umbrellas" is pure curator judgment |
| The USMC rank-strip list (ACE spine) | Already flagged *needs widening*; in code, every widening is a PR |
| `occupation_credential_map.json` | 139 occupations / 406 rulings |

## What the principle does NOT excuse

**Curatable ≠ ungoverned.** A table edit reaches the public with no PR, no CI, no
deploy. For `sierra_guidance` that is the entire point — same-minute tuning. For
rules governing a public-facing bot it also means a bad edit reaches students
with nothing in between. Minimum: an audit trail and a revert. Properly, it is a
**DR-11** question, since what Sierra tells the public is a named decision right.

**Editability is not the win — visibility is.** What would have saved Sam four
hours was not the power to edit `STATEWIDE_RULE`. It was *seeing that it existed
and was fighting his instruction.* A "which rules were in play for this answer"
panel is cheaper than the migration and worth more.

## Consequence: Sierra's rules do NOT become `cpl_memory` rows

Asked whether Instructions for Sierra should consolidate into the memory tab:
**consolidate the surface, not the storage.** Three collisions:

1. **Audience.** `cpl_memory` is written for *sessions*. *"The person key is
   `tblStudentKey`"* is vital to a session and meaningless to a student.
2. **Budget.** Sierra caps guidance at 9,000 chars; `cpl_memory` grows every
   checkpoint. You would need a "this row governs Sierra" flag — which
   re-invents a rules table inside a table with the wrong shape.
3. **A safety hole.** Rule 9 has sessions **auto-write `cpl_memory` at every
   checkpoint with no approval gate**. If `cpl_memory` fed Sierra, a session
   could change what a public bot tells students with no human in the loop —
   a DR-11 violation by construction. `cpl_memory` also has no ordering concept,
   and precedence is exactly what failed here.

**Build instead:** `sierra_rules` (with `sort_order`, `applies_when`, `active`,
overlaying code defaults) carrying an optional **`memory_slug`** back to the
`cpl_memory` row that justifies it. The *why* is written once, in memory; the
*instruction* lives where it executes. The memory tab renders **both lanes**,
filterable.

## The payoff that justifies the build

Once the lanes are linked, the tab can report:

> **"This decision is recorded in memory, and no Sierra rule implements it."**

That is the failure that keeps recurring — three documented instances:

- `statewide-is-138-not-84` sat in `cpl_memory` saying *use the adoption file*;
  the sync predated it and nobody rechecked. 42 credentials read as local.
- `ccc_rec` was a retrieval gate nobody noticed until 38 statewide credentials
  turned out unreachable.
- The adopter names: curated, nightly-synced, never read.

`CLAUDE.md` already carries the epitaph — *"a settled ruling does not enforce
itself, the consumer has to change."* A drift check between the two lanes is
that sentence made mechanical, and it is the same posture as the governance
drift detector already on the cron: **proposes, never auto-adds.**

## Build order (Sam, 2026-08-14)

1. `sierra_rules` + the overlay — closes the live gap and makes the
   `STATEWIDE_RULE` rewrite something Sam does himself.
2. The two-lane memory tab + the `memory_slug` link.
3. The drift check, wired to the cron.

## Caveat on this ADR's own confidence

This is an architecture argument, not a measurement. The adopter-names bug was
verified against live data; the two-lane split is *reasoned*. It is the kind of
call [`CLAUDE.md`'s effort-level guidance](../../CLAUDE.md) says to stay
single-threaded on and think harder about — there is nothing to score candidate
designs against, so a fan-out would regress toward the most common intuition.
Worth stress-testing in a fresh session with this document in front of it.
