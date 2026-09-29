---
title: "Push what a session cannot know to ask for; pull everything else"
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, context, claude-md, memory, docs-corpus]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - "CLAUDE.md"
  - ".claude/commands/checkpoint.md"
  - "docs/reference/lanes/"
related:
  - "[[methodology-a-knowledge-base-needs-a-lint-pass]]"
  - "[[playbook-cpl-memory-auto-write-at-checkpoint]]"
---

# Push what a session cannot know to ask for; pull everything else

**Sam's rule, 2026-08-28.** It decides where any piece of knowledge belongs, and
it is the only test that has held up against a corpus with three stores.

## The problem it solves

Three stores were each doing all three jobs, with nothing assigned:

| Job | `CLAUDE.md` | `cpl_memory` | `docs/kb-notes/` |
|---|:--:|:--:|:--:|
| **Rules** — must fire unprompted | ✅ | ⚠️ 85 of Sam's rulings | — |
| **State** — what is true in a lane now | ⚠️ §11, 90 KB | ⚠️ some | — |
| **Findings** — what we learned | ⚠️ narratives | ✅ | ✅ |

"Put it wherever it fits" is not an assignment, so everything accreted into the
one store that loads unconditionally. `CLAUDE.md` reached **151,484 B against a
60,000 B budget**, paid by every session in three repos.

## The test

**PUSH** — present before you know you need it:

> *"Never force-push `main`."* You would only query that if you already
> suspected it, and by then you have either done it or not.

**PULL** — you arrive with the question:

> *"What is the state of the funding lane?"* You know you have that question.
> A pointer row plus `docs/reference/lanes/implementation-funding.md` serves it
> exactly as well as an inline paragraph, at 1/25th the always-loaded cost.

Applied to `CLAUDE.md` on 2026-08-28 this took it to **58,006 B — under budget
for the first time — with nothing deleted.** §11's 29 lane cells, the Obsidian
wiring, and the *evidence* behind the branch and UI practices all moved; the
rules stayed.

## Three things that make or break it

**The pointer is the safety mechanism, not a courtesy.** A pulled store nobody
was told exists is the same as no store. That is precisely the failure Rule 8
was written for — a session re-derived three settled facts that were already
written down. Every relocation leaves the line saying where it went.

**Doctrine cannot be pulled into a budgeted store.** `cpl_memory`'s briefing
budget is 17,951 chars against ~85,500 of verified rows: **~21% fits**. A rule
there can be *present and silently unread*, which is strictly worse than a large
always-loaded file that at least loads completely. Push stores must be complete;
pull stores may be sampled.

**Split a section, do not relocate it whole.** Most sections are mixed. The
branch policy's *rules* ("merge on `clean` OR `unstable`") must fire unprompted;
its *evidence* (which PR each rule was written against, Sam's wording when he
expanded the trust) is pull. Keeping the rule and moving the evidence cut it
8,227 B → 3,304 B and made it more readable, because the rule stopped competing
with its own footnotes.

## The failure mode to watch

Every relocation disables whatever guard was pointed at the old address, **and
the diff looks like progress.** Moving §11's cells silently un-guarded them:
`stacked_roadmap_cell` hard-coded `rel == "CLAUDE.md"`. Moving the detail into
`docs/reference/` put it somewhere `_build_docs_index.py` had never looked —
its lanes glob `docs/*.md`, which is flat, so the whole reference lane had
**never once appeared in the corpus index**.

**Re-point the guard in the same commit as the move**, and re-run it afterwards.
A guard that passes because it is no longer looking is indistinguishable from
one that passes because the work was done.
