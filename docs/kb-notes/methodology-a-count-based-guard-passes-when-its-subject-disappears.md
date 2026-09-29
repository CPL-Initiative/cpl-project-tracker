---
title: "A count-based guard passes when its subject disappears"
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, testing, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-pipelines-exit-status-is-its-last-commands]]"
---

# A count-based guard passes when its subject disappears

## The shape

A test that asserts **"at most N occurrences of X"** stops guarding anything the
moment X stops occurring. It does not fail. It counts zero, satisfies `<= N`,
and prints as a clean pass — indistinguishable from the case it was written for.

`tests/cpl_funding_detail_trim.test.js` T1d asserted that the phrase *"qualifying
later still lets it draw"* appeared at most once in a rendered drill-in. On
2026-09-09 a vocabulary sweep replaced *draw* with *earn* everywhere. The test
went on passing, now measuring nothing.

## Why the obvious fix is wrong

The reflex is to flip it to "must be present". That is what was tried first, and
it failed immediately: the fixture's college is not always gated, so the phrase
is legitimately absent in some runs. **The count genuinely must tolerate zero.**

That is the trap. A guard whose subject may legitimately be absent cannot prove
its own relevance from the rendered output alone — absence is a valid state and
an ungrounded assertion at the same time.

## The fix

Split the two claims, and anchor the one that must not silently drift:

- Keep the count tolerant (`<= 1`), because zero is a real state.
- Assert the phrase **still exists in the module source**, where its absence is
  unambiguous — a reword there is always a change, never a legitimate state.

Then a future reword fails the test, and the failure message points at the count
that needs re-aiming rather than at a mystery.

## How it was found, which is the uncomfortable part

Not by review, and not by looking for dead tests. The sweep happened to delete
the exact string the guard counted, and the guard's silence was noticed only
because the sweep's author went looking for what else mentioned that phrase.

So the detection story does not generalize. What generalizes is the audit
question: **for every "at most N" assertion, what makes N ≥ 1 in the first
place — and would this test notice if that stopped being true?**

## Related

Third occurrence in this repo of a test coupled to wording or position breaking
on correct work. The prior two are `cpl_memory` rows, not notes —
`a-test-coupled-to-position-or-wording-breaks-on-correct-work` (2026-08-27) and
`read-a-tables-cells-by-header-not-by-position` (2026-09-01), the latter
recording itself as the second occurrence.

**The first two broke loudly and were fixed in minutes. This one broke silently
and would have survived indefinitely** — which is the argument for writing this
one down as a note rather than a third memory row.
