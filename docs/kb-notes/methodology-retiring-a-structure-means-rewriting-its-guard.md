---
title: Retiring a structure means rewriting its guard, not deleting it
created: 2026-09-14
updated: 2026-09-14
tags: [methodology, testing, refactoring]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[implementation-funding]]"
artifacts:
  - tests/cpl_funding_outcome_cards.test.js
  - tests/check_floor.json
---

# Retiring a structure means rewriting its guard, not deleting it

> **One-sentence summary** — a suite written against a structure is protecting an
> invariant, not the structure, so retiring the structure obliges you to find the
> invariant and re-express it rather than delete the file.

## Context

The funding tab grouped priority cards into three statutory "bands". A 2026-09-14 ruling
retired the wrapper entirely: the outcome moved onto each card and the cards became one
flat grid. `tests/cpl_funding_statutory_bands.test.js` — 26 assertions, every one keyed
to `.cplfund-band` — went red on the first commit, and every assertion in it was about
markup that no longer existed.

The tempting move is `git rm`. Its header argued otherwise:

> ⚠️ **WHAT THIS SUITE PROTECTS IS THAT NO PRIORITY CAN GO MISSING.** Grouping cards into
> bands introduces a failure the flat list could not have: a card whose goal does not
> resolve gets filtered into nothing and silently stops rendering — and a priority that is
> invisible on this page still earns funding against a target nobody can see.

That is not a fact about bands. It is a fact about **money being allocated against a
target no one can see**, and it outlived the structure by a wide margin.

## The distinction

Every structural test is two things wearing one name:

| | survives a rewrite? |
|---|---|
| The **invariant** — what must stay true of the system | yes, always |
| The **binding** — the selectors and shapes that express it | no |

A suite going red on a refactor tells you only that the binding broke. Whether the
invariant broke is a separate question, and the answer is usually no — which is exactly
why deleting the file feels safe and usually is not.

## The procedure

1. **Read the retired suite's header before touching it.** A well-written one states its
   invariant in prose, above the assertions. That paragraph is the specification for the
   replacement.
2. **Ask whether the new structure satisfies the invariant better or worse.** Here it was
   strictly better: the orphan *band* existed because grouping could filter a card into
   nothing, and a flat grid filters nothing at all — every card renders unconditionally.
   The replacement says so, and says why, so the next reader does not mistake the missing
   orphan band for a lost guarantee.
3. **Write the replacement as a rename, not a new file.** `cpl_funding_outcome_cards.test.js`
   opens by naming what it replaces and quoting the invariant it inherits. The lineage is
   the point: it stops a future session concluding the guarantee was dropped.
4. **Add an absence guard for the retired structure.** The first section of the new suite
   asserts no band renders, so the wrapper cannot come back beside the card and give the
   page two places to state the same outcome.
5. **Carry the check-count floor across by hand.** A retired entry in `check_floor.json`
   fails the ledger; a missing one leaves the new suite unprotected against silently
   shrinking. Swap the entry, measured from an *isolated* run, and never re-baseline the
   whole file off a contended one.

## The same move on the other failures

Seven further suites failed on that retirement, and none was wrong about what it wanted.
Each was repointed at where its subject now lives — the per-outcome total moved to a
totals row, the strategies fold joined a card-section family, the goal limit moved into
the reporting account. The one that needed real thought asserted:

> the (d)(2) account and the band agree that (C) has no performance measure

It existed to catch a **second copy** of the evidence state appearing. With the band
retired there is only one renderer, so agreement is trivially true and the check became
vacuous while still passing. It was rewritten to assert what it was actually protecting:

```js
// Every occurrence on the page is inside the (d)(2) account. A band printing
// its own copy — the shape this replaced — would make inMount exceed it.
return inAccount > 0 && inMount === inAccount;
```

⚠️ **A check that still passes can still have stopped protecting anything.** A refactor
that makes an assertion trivially true is as much a loss as one that breaks it, and it is
harder to notice, because the suite stays green.

## The test to apply

Before deleting any test file a refactor has broken, answer in one sentence: *what would
now be able to go wrong, undetected, that this file used to catch?* If the answer is
"nothing", delete it. If you can name something, you owe a replacement — and the sentence
you just wrote is its header.
