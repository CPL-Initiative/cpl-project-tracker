---
title: Index the doctrine to the file, because recall does not scale
created: 2026-08-21
updated: 2026-08-21
tags: [methodology, doctrine, governance, process, testing, tooling]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied]]"
  - "[[docs/kb-notes/methodology-a-check-that-never-registers-can-never-fail]]"
  - "[[docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted]]"
artifacts:
  - kb/doctrine.py
  - tests/doctrine_lookup_test.py
  - tests/lib/check_ledger.js
  - tests/check_ledger.test.js
  - tests/check_floor.json
  - tests/run.js
---

# Index the doctrine to the file, because recall does not scale

> **One-sentence summary** — when a project's written doctrine outgrows what
> anyone can hold in their head, the fix is not better writing or better reading
> order; it is a *lookup keyed by the artifact you are about to touch*, plus an
> *executable consumer* for the rules that can have one.

## Context

[`methodology-a-rule-you-wrote-is-not-a-rule-you-applied`](methodology-a-rule-you-wrote-is-not-a-rule-you-applied.md)
established the diagnosis: in a repo with large doctrine, the dominant failure
stops being ignorance and becomes **non-application**. This note is the
prescription, and it exists because the diagnosis had already been written four
separate times without changing anything.

Sam's framing, 2026-08-21: *"let's cure our need to internalize."*

## The measurement that settles it

Taken across this repo on 2026-08-21:

| | |
|---|---:|
| KB notes | **299** |
| Of those, prescriptive (`methodology` / `playbook` / `adr`) — i.e. rules | **236** |
| Rules naming a test or lint in `artifacts:` | **20** |
| Notes named anywhere inside an executable file | **8** |

So **92–97% of the doctrine has no consumer**. But the sharper number is this
one: the file where Session 178's capped-list defect shipped —
`chatbox/supabase/functions/cpl-chat/index.ts` — is named by **22 notes, four of
them about caps**, one titled *"A capped list must never read as a census."*

The knowledge was not merely written down. It was distilled to a title that
**states the rule**, and **indexed to the exact file**. What was missing was a
way to ask.

⭐ **That reframes the problem.** "Read the docs first" cannot work at 299 notes:
the cost of recall is proportional to corpus size, and the corpus only grows.
Lookup is proportional to the *diff*, which is small.

## The claim

**Three tiers, in descending order of reliability. Use the highest tier a rule
can reach.**

### 1. A test — the only tier that needs no invocation

Two of Session 178's four defects were caught by CI, and both were rules someone
had turned into a test. The two that stayed prose reached production. That
difference is the whole finding, and it is why a rule that *can* become a test
should.

**Corollary — the test layer itself needs a guard.** `tests/run.js` judged a file
by exit status alone, which is a complete answer to *"did anything fail?"* and no
answer at all to *"did everything run?"*. Demonstrated on real repo code:
skipping one block of a 12-check file produces

```
college_identity_variants.test.js: 10/10 checks passed      exit 0
```

Two checks left the suite; the count is self-consistent; the run is green. A
missing check is an **absence**, not a failure — it subtracts from *both* sides
of the ratio. The cure is a recorded floor per file (`tests/check_floor.json`),
compared against the count each file reports about itself.

### 2. A shared helper — a rule with a call site

`cplCollegeShort()`, `unlockRow`, `lift_ts`. A helper is obeyed by being called,
so it cannot be forgotten at the moment it matters. Measured counter-example:
`val()` is copy-pasted into **7 of 246** test files, which is why the trap it
guards recurred in three separate harnesses.

### 3. A lookup keyed by the file — for the majority that can be neither

Most rules are judgment and will never be a test. For those, replace recall with
a query: `python3 kb/doctrine.py --changed` reads the working diff and prints,
per file, the committed rules that name it — **titles, not a reading list**,
because in this corpus the title *is* the rule.

⚠️ **This tier still has to be invoked**, which is the same weakness as prose.
It is smaller only because `--changed` requires no knowledge of *which* note
matters — it reads the diff. Do not mistake it for tier 1.

## What building it taught, immediately

The lookup found two bugs in itself before it found anything else, and both were
the repo's signature failure — *dropping content while looking complete*:

1. **235 declared artifact entries were invisible.** The frontmatter regex
   captured the block *without* its closing newline, and the list pattern
   required each item to end in one, so **the last artifact of every note** was
   dropped. It surfaced only because a lookup on `tests/run.js` failed to return
   the note whose artifact list *ends* with `tests/run.js`.
2. **`--changed` omitted untracked files** — so the three files the session had
   just written were missing from its own answer. A brand-new file is precisely
   the one with no doctrine in anyone's head.

⚠️ **And a marker is load-bearing text, not prose.** A comment added to explain
the lift boundaries *quoted the marker strings verbatim*; `liftBlock()` resolves
them with `indexOf()`, so the start marker then matched inside the comment and
the lift began mid-sentence. Mentioning a marker moves it.

## Design constraints, each earned

- **Count drift; do not condemn it.** A rule flagging all 216 unenforced notes
  would fail on truth and be muted within a week
  ([`a-guard-that-fails-on-truth-gets-muted`](methodology-a-guard-that-fails-on-truth-gets-muted.md)).
  The check-count ledger fails **only on a drop** — never on a file with more
  checks, a new file, or one that prints no parseable count.
- **Floor at the minimum of two runs.** A test file whose count is not
  deterministic would otherwise flap. Non-determinism is recorded as
  "unfloored" with the reason, not silently floored at a lucky value.
- **Re-baselining is a reviewable act.** `npm run test:floor` rewrites the
  ledger; a *lower* floor shows up in the PR diff, which is exactly the moment a
  human should see that checks were removed.
- ⚠️ **Never baseline against a moving tree.** Done twice in one session: both
  ledgers recorded broken states as floors (`sierra_geo_ranking` at **1** where
  the truth is 50). Freeze the tree, then generate.

## When this applies (and when it doesn't)

Applies once a doctrine corpus passes roughly the size one person can hold —
here, somewhere well below 299 notes. Below that, reading order is genuinely
enough and this machinery is overhead.

It does **not** replace writing the notes: the notes are what made every
diagnosis fast once the defect was known, and the lookup is worthless without
them. It replaces *remembering* them.

## See also

- [`methodology-a-rule-you-wrote-is-not-a-rule-you-applied`](methodology-a-rule-you-wrote-is-not-a-rule-you-applied.md) — the diagnosis
- [`methodology-a-check-that-never-registers-can-never-fail`](methodology-a-check-that-never-registers-can-never-fail.md) — the rule the ledger finally gives a consumer
- `docs/doctrine_enforcement_lessons.md` — the workstream
