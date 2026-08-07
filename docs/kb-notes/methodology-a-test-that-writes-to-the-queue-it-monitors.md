---
title: A test that writes to the queue it monitors — CI noise is indistinguishable from user signal
created: 2026-08-07
updated: 2026-08-07
tags: [methodology, testing, observability, feedback, telemetry, sierra, cpl-assistant]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-the-feedback-queue-already-knew]]"
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/smoke_test.sh
  - sierra_training.js
  - tests/sierra_training.test.js
---

# A test that writes to the queue it monitors

> **One-sentence summary** — when an end-to-end test exercises a write path, its rows land in the same table a
> human reads for signal; unless the reading surface separates them, the test steadily converts a feedback
> channel into noise, and the people who would have acted on the signal quietly stop looking.

## The shape of it

A smoke test verified the thumbs-up/thumbs-down write path by actually submitting feedback — the correct way to
test it, since a mocked write proves nothing about the live RLS policy, the RPC signature, or the anon grant.
Each CI run left one row behind, rated `down`.

Five weeks later:

| | |
|---|---|
| Rows in the table | **53** |
| Written by CI | **28 (53%)**, every one rated `down` |
| Real user reports | 10 thumbs-down, 15 thumbs-up |
| Rows ever triaged | **0** |
| Headline "👎 total" on the review tab | **38** — when the real number was **10** |

The queue was not *broken*. It was **diluted**, which is worse, because dilution looks like data. A reviewer
opening a tab that says 38 negatives, scrolling a list where every other row is `page='smoke' / question:"q" /
note:"smoke note"`, learns in about fifteen seconds that this surface is not worth their time. Nothing errors.
Nothing alerts. The channel just dies.

## The trap: the test usually cannot clean up after itself

The instinct is "have the test delete its row." Often it can't, and for a *good* reason.

Here the write went through an anon-credentialed RPC, because that is exactly what a real visitor's browser
uses — and anon is deliberately **write-only** on that table. The test asserts precisely this:

```bash
# anon SELECT must come back EMPTY (reviewer gate) — not an error.
sel=$(curl -sS "$REST_BASE/sierra_feedback?turn_id=eq.$TID" -H "apikey: $ANON" …)
[ "$sel" = "[]" ] && echo "  [assert ok] anon select returns [] (write-only for the public)"
```

A test that could delete its own row would be a test running with **more privilege than the path it is
verifying** — which would silently stop testing the thing it was written to test. The residue is not sloppiness;
it is the price of an honest end-to-end test.

Two other tempting fixes that trade away coverage:

- **Reuse a fixed `turn_id`** so the upsert always updates one row. Leaves exactly one row forever — but after
  the first run it only ever exercises the UPDATE branch, never the INSERT. Insert and update are different
  code paths in an upsert; that is coverage you are deleting.
- **Point the test at a separate table.** Then it no longer tests the production table's grants and policies,
  which is most of what an end-to-end write test is for.

## The fix belongs at the reading surface, not the writing one

Filter where a human reads, and mark the rows at the source so filtering is possible:

1. **Stamp CI writes** with a field the reader can key on (`page='smoke'`). Cheap, and it must exist *before*
   you need it — retrofitting provenance onto rows already written is guesswork.
2. **Exclude them by default** from the queue **and from every count derived from it.** The stat tile is the
   number a reviewer trusts at a glance; leaving CI in the headline while filtering the list below is worse
   than not filtering at all, because now the two disagree.
3. **Disclose, never silently drop.** Show the count next to a toggle that brings them back — `show 28 CI rows`.
   A reviewer who cannot see what was withheld cannot tell a filter from a bug.
4. **Budget for the residue.** If the fetch is limited (`limit=200`), undeletable rows accumulate against that
   budget and will eventually evict real reports. Raise it, or filter server-side.

```js
function isSmoke(f) { return (f && f.page) === "smoke"; }
// Queue AND stats follow the same rule — never one without the other.
const rows = state.fSmoke ? all : all.filter((f) => !isSmoke(f));
```

## The generalisable rule

> **Any telemetry a test writes must be separable, by a field, from telemetry a human wrote — and the reading
> surface must separate it by default.**

This applies well beyond feedback tables: synthetic transactions in an orders table, health-check requests in
an access log, canary users in an analytics funnel, monitoring probes in an error tracker. In each case the
test is *right* to use the real path, and the burden therefore falls on the reader.

The failure mode is quiet and slow, so name it explicitly when reviewing a new end-to-end test:

- **Ask at write time:** does this test write anywhere a person reads? If yes, how is its row labelled?
- **Ask at read time:** does every count on this surface exclude synthetic rows, or only the list?
- **Watch the ratio.** CI runs on a schedule; humans give feedback occasionally. Left alone, the synthetic
  share only ever goes **up**. 53% was reached in five weeks from a standing start.

## The related failure this compounds

The same queue held a **five-week-old user report of a real geography bug** that nobody read
([[docs/kb-notes/methodology-the-feedback-queue-already-knew]]). It is worth being blunt about the interaction:
the noise did not merely coexist with the unread signal, it **helped cause it**. Every reason a person has to
skim past a queue is a reason the next real report waits five weeks.

> Before inviting anyone to test a tool, look at what its feedback channel already contains. If more than half
> of it is your own robot, the invitation is a request for reports into a place no one reads.
