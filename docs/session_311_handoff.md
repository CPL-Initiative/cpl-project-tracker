---
title: Session 311 handoff — My CPL Funding in Sam's words, merged; "model" leaves the public text next
date: 2026-10-01
session: 310 (SkyTandem)
tags: [handoff, implementation-funding, my-cpl-funding, house-voice, decision-sheet]
status: current
---

# You are Session 311

Your moniker is **SkyQuill**. S310 ran an emergency-scope checkpoint, then a full one after the context
compacted; every Rule 9 artifact is current except the Pipeline tab (the pipeline did not move). Sam's
handoff 310 items (sheet 11's builds, the Sierra smoke, the three roster names, the Monday watch run) were
**not touched**; read [`session_310_handoff.md`](session_310_handoff.md) for them.

## First, in this order

1. **Run the staged memory SQL in ONE `execute_sql` call:**
   [`kb/memory_audit/2026-10-01-s310-staged.sql`](../kb/memory_audit/2026-10-01-s310-staged.sql). The
   seven `cpl_memory` rows S310 wrote are **written and unlogged** (no `cpl_memory_log` entry for any), and
   two calls carrying this SQL timed out at 60 s with nothing applied while reads answered at once. The
   repo guard allows it (checked locally), the table has only the `updated_at` touch trigger, and
   `pg_stat_activity` showed nothing waiting, so the wait sat upstream of the database. Every statement is
   idempotent. Its last query must show `creates = 1` on every SkyTandem-s310 row. If it times out again,
   tell Sam in one line and move on; do not retry in a loop.
2. **The "model" sweep, a mockup round first** (Sam, 2026-10-01: *"Yes replace model on other surfaces as
   well"*). Card 14 took "funding model" out of My CPL Funding (*"as it's finalized, it's no longer a model
   but now a procedure"*); this widens it to the explainer (`funding-model/index.html`) and the tab's public
   text. Rendered text only: paths, ids and the BroadcastChannel name keep the word. Method: the capture
   harness (`prototype/mockup_harness/capture_mycpl.mjs`, `assemble_mycpl.py`), one card per sentence, his
   replies as the spec. Grep `tests/` for every sentence you retire before you push (the pitfall below).
3. **Card 11 waits on Sam's typing** (checked 2026-10-01: neither text is on the tab): both scenarios,
   Access *"Applied CPL units (FTES) in MAP"*, Completion *"Transcribed CPL units (FTES) for students with
   the Counselor step checked in MAP"*. Remind him once; never write `cpl_funding_config` for it. Card 7's
   two lines still read the old words too (the To-Do feed carries both).
4. Then handoff 310's queue.

## What shipped

- **#1797** the language mockup (artifact [C5crxcr1KY7t1JgX3HTXMx](https://claude.ai/artifact/C5crxcr1KY7t1JgX3HTXMx),
  copy of record `docs/visuals/2026-10-01-my-cpl-funding-language.html`) and its harness.
- **#1798, merged 2026-10-01 (`9e65ff48`).** Sam's sentences verbatim on cards 1, 2, 6, 7, 8, 9, 12, 15;
  the three minimum conditions listed with each institution's state (`_conditions()` in `cpl_funding.js`,
  built on `eligReqList`); *"Current outcomes demonstrate $X funding"* at the public $1,000 rule; Do this
  next leads with what the conditions owe. **Bug fixed:** `topStrategy()` read `pr.strategies` while
  `buildBriefing()` carries `pr.items`, so the implementation step never rendered. Guard
  `tests/my_cpl_funding_words.test.js`.
- **The full checkpoint:** the funding lane (NEXT ⓪a card 11's texts, ⓪f the sweep), the lessons doc's S310
  section, two KB notes updated (no new note), the To-Do feed, `README.md`'s My College entry, the CPLBrain
  session note, the docs audit, and this handoff.

## Sam's rulings this run (verbatim in `cpl_memory`)

- **No "funding model" in college-facing text** (card 14), widened the same day to every public surface.
- **The seed grant's expend-by date stays off** (*"Leave this off"*, on restoring *"must be fully expended
  by June 30, 2028"*).
- **"Through apportionment"** is his word for how the seed grant reached colleges; the implementation
  funding stays "allocated".
- **The 84 are CER credentials** (card 4): MAP's statewide set is 134 exhibits with 354 recommendations.
- His Follow up flags (cards 1, 2, 4, 7, 8, 12, 14) meant "use my wording"; every one is built.

## Open asks

Sheet 12 ([B6Gnzmha8kArgiSQw1SdTe](https://claude.ai/artifact/B6Gnzmha8kArgiSQw1SdTe)) is unchanged: one
card (the City College of San Francisco check in Sierra), no replies yet. The builder rebuilt it identical
this run, so it keeps its link. Both of S310's questions were answered in chat and need no card.

## Patterns that worked

- **Mock up from the running code, then port with the replies as the spec.** The capture harness renders the
  Public view from an md5-checked config fixture; the same harness verified the port.
- **Read `replies` and `edits` before porting.** A note-only reply stores `v: ""`; the note is the verdict.
- **A test that pins a helper with a hand-built fixture can hide a dead path.** Add one check on the real
  builder's output ([note](kb-notes/methodology-a-guard-that-supplies-its-own-input-tests-only-half.md)).

## Safety patterns

- ⚠️ **Grep `tests/` for each retired sentence before pushing a wording change.** Six tests pinned
  S310's old words; the local run covered five and CI's shard 2 caught the sixth (S308's C9e was the same).
- ⚠️ **Verify the memory log landed** (`creates = 1` per row). S310's emergency checkpoint skipped it.
- ⚠️ **Budgets at the edge:** `CLAUDE.md` 59,975 / 60,000 B (add nothing; pull to `docs/reference/`), the
  funding lane 19,992 / 20,000 B (trim before adding), `docs/cpl_funding_lessons.md` 118,362 / 120,000 B
  (compact into the archive before the next section).
- ⚠️ The repo guard denies any SQL containing a write verb as a whole word, `replace()` included; use
  `position()` for a read.
- ⚠️ `git push --force-with-lease` refuses on a stale tracking ref after a squash-merge deleted the branch;
  `git update-ref -d refs/remotes/origin/<branch>` then a plain push. Never `pkill -f` a pattern your own
  command line contains.
