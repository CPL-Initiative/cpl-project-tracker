---
title: Session 311 handoff — My CPL Funding in Sam's words; an emergency-scope checkpoint
date: 2026-10-01
session: 310 (SkyTandem)
tags: [handoff, implementation-funding, my-cpl-funding, house-voice, decision-sheet]
status: current
---

# You are Session 311

Your moniker is **SkyQuill**. This was an **emergency-scope checkpoint** (Rule 9a: the meter read 72,284
tokens left), so only this handoff, the funding lane and `cpl_memory` were refreshed. **Not refreshed:**
the lessons doc, a KB note, `kb/cpl_todos.json`, the CPLBrain session note, the open-asks sheet rebuild,
`kb/README.md`, `README.md` and the Pipeline tab (unmoved). Do those first if the work below is light.
Sam's handoff 310 items (sheet 11's builds, the Sierra smoke, the three roster names, the Monday watch run)
were **not touched** this session; read [`session_310_handoff.md`](session_310_handoff.md) for them.

## First, in this order

1. **Confirm [#1798](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1798) merged** (the port). If
   not, read its checks on the current head and drive it to green, then merge (squash).
2. **Card 11 waits on Sam's typing:** the two measure texts on the tab, both scenarios: Access *"Applied CPL
   units (FTES) in MAP"* and Completion *"Transcribed CPL units (FTES) for students with the Counselor step
   checked in MAP"*. Remind him once; never write `cpl_funding_config` for it.
3. **Ask Sam two small things** (put them on the next open-asks sheet): his card-2 sentence dropped the
   seed grant's *"must be fully expended by June 30, 2028"*; and should "model" leave the explainer and the
   tab's public text too (card 14 ruled it out of My CPL Funding only).
4. Then handoff 310's queue.

## What shipped

- **#1797** the language mockup (artifact [C5crxcr1KY7t1JgX3HTXMx](https://claude.ai/artifact/C5crxcr1KY7t1JgX3HTXMx),
  copy of record `docs/visuals/2026-10-01-my-cpl-funding-language.html`) and its harness
  (`prototype/mockup_harness/capture_mycpl.mjs`, `assemble_mycpl.py`).
- **#1798** the port. Sam's sentences verbatim on cards 1, 2, 6, 7, 8, 9, 12, 15; the three minimum
  conditions listed with each institution's state (`_conditions()` in `cpl_funding.js`, built on
  `eligReqList`); *"Current outcomes demonstrate $X funding"* at the public $1,000 rule; Do this next leads
  with what the conditions owe. **Bug fixed:** `topStrategy()` read `pr.strategies` while `buildBriefing()`
  carries `pr.items`, so the implementation step never rendered. Guard `tests/my_cpl_funding_words.test.js`.

## Sam's rulings this run (verbatim in `cpl_memory`)

- **"Funding model" leaves college-facing text** (card 14): *"as it's finalized, it's no longer a model but
  now a procedure."* The block says "CPL funding".
- **"Through apportionment"** is his word for how the seed grant reached colleges (card 2); the
  implementation funding stays "allocated". The vocabulary guards scan the tab and the explainer, not the block.
- **The 84 are CER credentials, not recommendations** (card 4: *"I believe there are more than 84"*):
  MAP's statewide set is **134 exhibits with 354 recommendations** (`fact-sheet/statewide_recs.js`, 2026-10-01).
- His Follow up flags (cards 1, 2, 4, 7, 8, 12, 14) meant "use my wording"; every one is built.

## Patterns that worked

- **Mock up from the running code, then port with the replies as the spec.** The capture harness renders the
  Public view from an md5-checked config fixture; the same harness verified the port.
- **Read `replies` and `edits` before porting.** A note-only reply stores `v: ""`; the note is the verdict.
- **A test that pins a helper with a hand-built fixture can hide a dead path.** Add one check on the real
  builder's output (`topStrategy(buildBriefing(...))`).

## Safety patterns

- ⚠️ `git push --force-with-lease` refuses on a stale tracking ref after a squash-merge deleted the branch;
  `git update-ref -d refs/remotes/origin/<branch>` then a plain push. `git fetch --prune origin` is slow here.
- ⚠️ Never `pkill -f` a pattern your own command line contains: it kills the shell (exit 144).
- ⚠️ The funding lane sits at its 20,000-byte cap; trim settled text before adding.
