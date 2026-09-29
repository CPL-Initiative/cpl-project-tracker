---
title: A total that balances is not a total that is right
created: 2026-08-23
updated: 2026-08-23
tags: [methodology, funding, migration, verification, exports]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-verify-consumer-before-migrating]]"
  - "[[docs/kb-notes/methodology-migrate-the-display-not-just-the-data]]"
  - "[[docs/kb-notes/methodology-a-deduplication-has-a-scope]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_memo_noncredit.test.js
---

# A total that balances is not a total that is right

> **One-sentence summary** — when a mechanism is replaced, a consumer that
> *re-derives* the old split keeps producing a table that adds up to the correct
> grand total while distributing it to the wrong parties, and the balancing total
> is precisely what stops anyone noticing.

## Context

The CPL noncredit lane was a flat FTES split of a carve-out among four standalone
campuses. It became a bounded allocation over 33 institutions — 30 of them credit
colleges running their own noncredit programs. The tab was migrated to the new
model. The **exported memo** was not: it still computed
`campusBasis / Σ campusBasis × carveout`.

That produced a document which paid the entire carve-out to four institutions,
paid **$779,862 to an institution the model pays $0** (a deliberately deduped
record), and showed **nothing at all for the 30 colleges** that actually receive
the money.

It had been shipping for as long as the new lane had existed.

## The finding

**The defect was invisible because the numbers balanced.** The memo's statewide
total was correct to the cent — credit pool plus carve-out — because the four
campuses had absorbed exactly the whole carve-out between them. Every check a
reader would casually apply passed:

- the grand total tied to the appropriation
- each district subtotal summed to its rows
- no figure was negative, missing, or absurd on its face

A reconciliation check confirms that *the money is all accounted for*. It says
nothing about *who is accounted for*. Those are different properties, and only
the first is cheap to test — which is why the first is usually the one tested.

## Why it hides in the export specifically

Three compounding reasons, and they generalize past this one document:

1. **Nobody reads the export next to the screen.** The tab and the memo are
   consulted in different sessions, by different people, for different purposes.
   A discrepancy between them is only visible to someone holding both.
2. **An export is a re-implementation.** It cannot reuse the screen's rendering,
   so it re-reaches for the underlying numbers — and re-reaching is exactly where
   a stale derivation survives. The screen changed because the screen was the
   thing being worked on.
3. **The export is the artifact with the widest blast radius.** It leaves the
   tab, the gate and the room. It is emailed, printed and quoted, and it carries
   no indication of when it was generated or against which mechanism.

## The rule

**When you replace a computation, grep for everything that reproduces its
*shape*, not just everything that calls its name.** A migrated `model()` leaves
no dangling reference behind — the old formula is open-coded arithmetic, so
neither the compiler nor a rename can find it. Search for the operation:
`/ total *`, `share ×`, `Σ ... /`.

Then, for verification:

- **Assert the distribution, not the total.** Compare per-party figures against
  the model, party by party. Our test asserts the model's figure appears on the
  institution's own row *and* that the retired formula's figure appears nowhere.
- **A tie-out is a necessary condition, never a sufficient one.** Keep it — it
  catches a different class — but never let it stand as the whole check.
- **Parse the row, do not grep the document.** An early draft of the same test
  substring-matched a dollar figure against the whole memo and three assertions
  could not fail, because `$50,000` is also a seed grant named in the intro.
- **A `$0` and a `—` are different claims.** A party outside a lane has no
  applicable figure; printing `$0` says it was considered and awarded nothing.

## Signals that you are exposed to this

- A surface that re-derives an allocation instead of calling the model (this repo
  states the rule for one lane — *never re-derive an allocation, call `_alloc()`*
  — and the second lane inherited no such line until it was violated).
- A mechanism replaced *in place*, keeping the same pot and the same grand total.
- Any consumer that must run without the DOM: exports, memos, PDFs, scheduled
  emails, docx builders.
- A comment near the old formula asserting the two paths "can never disagree" —
  a claim that was true of the mechanism it was written for.

## Counter-note

This is not an argument for one code path everywhere. A frozen snapshot, a
printable memo and a live tab legitimately differ in *when* they are computed.
The rule is narrower: they must not differ in **how**. Where a second caller is
genuinely needed, extract the builder and share it, so the two can differ only by
timestamp — the pattern already used for this project's funding-model payload.
