---
title: A change inherits every reference into it, and the same-cycle reference is the one you miss
created: 2026-08-26
updated: 2026-08-26
tags: [methodology, drafting, regulation, refactoring, blast-radius, title-5]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/t5_55050_amendment_package_draft]]"
  - "[[docs/kb-notes/methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting]]"
artifacts:
  - docs/reference/statute/t5_55050_clean_after_2026-08-12.txt
  - kb/_derive_55050_clean.py
---

# A change inherits every reference into it

> **One-sentence summary** — before you renumber, rename, or re-letter anything,
> look for references *into* it, and look hardest at the ones created by the same
> change you are reading, because those are invisible to a search of the old text.

## Context

Title 5 §55050 was revised and the Board of Governors adopted the revision on
2026-08-12. The obvious next move — a fresh redraft implementing the new
Education Code Article 9 — was foreclosed by one clause in a *different* section
of the same rulemaking. Finding it changed the whole shape of the deliverable,
from "here is a better §55050" to "here are five amendments that shift nothing."

## The claim

**The blast radius of a change is not what it contains. It is what points at it.**

Two corollaries, and the second is the useful one:

1. **Inbound references bound the change.** §55050's subdivisions are addressable:
   §55051(d) names §55050(i). So (a)–(m) are frozen, and anything new goes on the
   end as (n). Not a style preference — inserting in sequence would break a live
   citation.

2. ⭐ **A reference created by the same cycle is the one that gets missed.** The
   adopted redline *strikes* `55753` and *inserts* `55050(i)`. So the pointer did
   not exist in the operative text at all. Anyone who checked "what currently
   references §55050?" against the published regulation would have found nothing
   and concluded they were free to renumber. The reference and the thing it points
   at were created in the same document, by the same people, in the same week.

This generalizes past regulation, and the second corollary is why it is worth a
note. It is the same shape as a schema migration that renames a column while
another migration in the same release starts reading it; a function extracted in
one commit and called from a second commit in the same PR; a config key that a
sibling service begins consuming in the release you are removing it from. **In
each case a search of the deployed state finds nothing, because the caller is not
deployed yet either.**

The search that works is not "who references this?" but "who references this in
anything that lands at the same time or later?"

## How we got here

Not by looking for it. It surfaced while resolving the adopted redline into clean
text (see the sibling note on redline resolution): the §55051 half of the same
document contained the run-together token `5575355050(i)`, which resolves to
"~~55753~~ 55050(i)". The §55051 half was being processed only because it happened
to sit in the same PDF.

⚠️ **Which is itself the lesson's evidence.** The reference was found by reading
the whole adopted document rather than the section under amendment. Scoping the
read to §55050 — the obvious, efficient thing — would have missed it, and the
first anyone would have known is a broken citation in a filed regulation.

## Consequences

- The §55050 Article 9 conformity package appends its new subdivision as **(n)**
  and re-letters nothing. That is stated in the package, in the drafting notes on
  the .docx itself, and in the Regulatory Action Proposal, because it is the kind
  of constraint a later reader will otherwise "tidy up."
- It is also an *argument*: a package that can be adopted without reopening
  anything else is a package that can move. The constraint turned out to be a
  selling point.
- `docs/reference/statute/README.md` states it where a drafter will hit it.

## When this does not apply

When you own every caller and can change them atomically, an inbound reference is
a cost, not a constraint. The rule bites when the referencing thing is owned by
someone else, is already adopted, or is expensive to reopen — which is exactly
the regulation case, and often the cross-team case.
