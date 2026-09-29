---
title: A normalization and the screens that judge it must see the same text
created: 2026-08-13
kb-status: published
tags: [methodology, matching, identity, curation, normalization, silent-failure, pitfall]
artifacts:
  - kb/_build_cr_reference.py
  - tests/cr_reference.test.js
related:
  - "[[docs/kb-notes/methodology-normalise-both-sides-of-a-join]]"
  - "[[docs/kb-notes/methodology-use-the-identity-key-before-you-score-strings]]"
  - "[[docs/common_cr_reference_lessons]]"
---

# A normalization and the screens that judge it must see the same text

## The rule

When a matcher normalizes text to form a key, every **safety screen** that then
decides whether the match may proceed has to run on that **same normalized
text** — not on the raw input, and not on its own private re-derivation.

Two derivations of one normalization will drift. When they drift, the screen
stops guarding the thing it was written to guard and starts blocking things it
was never meant to touch, and it does both silently.

## How it failed, three times in one run

Building the Common CR Reference, a group key folded abbreviations
(`Intro`→`Introduction`, `Adv`→`Advanced`) before comparing topics. Safety
screens — level, Honors, lab, sport, gender — then checked that a group's
members agreed before any automatic merge.

**1. The screen ran on the raw topic.** So `Intro to Administration of Justice`
matched no level word and `Introduction to Administration of Justice` matched
one. They "disagreed", the level screen fired, and it blocked the single
highest-value merge in the corpus — five wordings across 26 colleges, the top of
the ranked queue. The abbreviation fold had been silently undone by the screen
that ran before it.

**2. The test re-implemented the folds** to check the invariant independently,
missed `adv`→`advanced`, and reported two *correctly* merged groups
(`Adv Acoustical Ceiling Layout` / `Advanced Acoustical Ceiling Layout`) as
screen-straddling failures. A third derivation, a third drift.

**3. The acceptance probe tested a proxy for the condition** rather than the
condition — whether a group's key contained both "introduction" and "advanced",
instead of whether members of a *merging* group disagreed. It reported two
failures that were single-wording groups whose one string legitimately carries
both words (*"Advanced Composition & Introduction to Literature"*). Nothing was
being merged; there was nothing for a screen to act on.

## The fix is deletion, not synchronisation

The instinct on discovering drift is to bring the copies into line. That is the
wrong repair: it leaves N derivations and buys time until the next edit.

- **One derivation.** The normalizer is a named function; the key and the
  screens both call it.
- **Emit what you computed.** The builder writes each member's screen profile
  into the artifact, so a consumer or a test asserts on **what the builder
  actually decided** rather than recomputing it. This removed the duplicate from
  the test entirely — the test now compares emitted profiles and cannot drift.
- **Test the condition, not a proxy for it.** "Does the key contain both words"
  is not "do the merging members disagree."

## Why it is hard to see

Every one of these failures is invisible from the code and obvious from the
output. The screen looks correct in isolation, the fold looks correct in
isolation, and each one is doing exactly what it says. The defect lives in the
*seam*, and seams have no line number.

The tell is a **safety mechanism firing on a case that is obviously fine**. A
screen that blocks something a human would wave through is far more often
mis-wired than right — genuine screen hits look genuinely ambiguous. Treat a
surprising block as a bug report against the screen's inputs before accepting it
as a finding.

## Where else this applies

- **Both sides of a join** — the same family; a join key normalized on one side
  only silently drops rows
  ([[docs/kb-notes/methodology-normalise-both-sides-of-a-join]], where five
  colleges lost their implementation funding).
- **A search index and its query parser** — fold plurals when indexing but not
  when querying and the corpus goes dark for exactly the terms users type.
- **A suppression rule and the aggregate it protects** — if the k-anonymity
  check counts differently from the publisher, the disclosure control is
  decorative.
- **A validator and the writer it validates** — a `maxlength` enforced at two
  layers with different limits truncates at whichever is smaller, invisibly.

## The generalization

*Any* predicate that gates a transformation must consume the transformation's
own output. If it re-derives its input, the gate and the transformation are two
programs that merely agree today.

## A fourth instance — a lint and its fixer (2026-08-28, Session 204)

The `american_spelling` rule scanned a document's **raw text**; the sweeper that
applies it scanned **prose only**, masking code spans, markdown link targets,
wikilinks, `*.md` filenames and quoted spans (an imported COCI title, a MAP
field, or a person's own words are not ours to correct).

Two definitions of "the text to judge", so after a full sweep the lint still
reported **25 findings the fixer structurally refuses to touch** — a British
form inside a filename, inside a code span, inside Sam quoted verbatim. Nothing
was broken; the rule was simply asking for work nobody could do, which is how a
guard gets muted (`methodology-a-guard-that-fails-on-truth-gets-muted`).

Resolved by moving `prose_only()` into the auditor and having **both** read it —
findings 25 → 1, and the one left belongs to a concurrently-owned file. A test
asserts the fixer imports the mask and defines no second copy, because the fork
is easy to reintroduce and costs nothing until it costs a muted lint.

⭐ **The tell is a checker and a fixer disagreeing about the size of the
backlog.** If the thing that reports the work and the thing that does the work
return different counts, they are reading different text.

---

## A normalizer will correct its own documentation (2026-08-29)

A third instance, and the sharpest: **`american_spelling` rewrote the very words
the rule was documenting.** `CLAUDE.md`'s word list was written as

> `while (not whilst) · among (not amongst)`

and the sweeper corrected the British forms *inside the parenthetical that
existed to name them*, leaving

> `while (not while) · among (not among)`

which is not a rule, it is noise. It sat that way for weeks, in the
always-loaded file, and nobody caught it — the sentence still scans, and a
reader skims past it as a formatting oddity rather than a destroyed rule.

**The general shape:** a normalizer cannot see the difference between *using* a
form and *naming* one. Any document that teaches a transformation contains, by
necessity, examples of the input — which is exactly what the transformation
consumes. Style guides, lint docs, migration notes and glossaries are all
self-consuming in this way.

**The fix is to put the named form somewhere the mask already excludes.**
`prose_only()` masks code spans, so backticks make a word-list entry survive its
own lint:

```
while (not `whilst`) · among (not `amongst`)
```

Verified by running the fixer: **0 replacements**. Before the backticks it would
have eaten them again on the next sweep.

⚠️ **The detection problem is worse than the fix.** This was found only by
diffing a pre-consolidation file against its successors and reading the
unmatched spans — nothing flags `X (not X)`, because both halves are correctly
spelled American English. If you add a word-list entry, backtick the foreign
form the same day; there is no lint that will tell you later.
