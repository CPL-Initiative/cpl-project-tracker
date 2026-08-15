---
title: An assertion pinned to a mutable value stops being a guard
created: 2026-08-15
updated: 2026-08-15
tags: [methodology, testing, privacy, ci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty]]"
artifacts:
  - chatbox/smoke_test.sh
---

# An assertion pinned to a mutable value stops being a guard

> **One-sentence summary** — a negative assertion written against a specific
> live value (a person's name, an id, a string in curated data) silently stops
> testing anything the moment that value leaves the data, and it stops while
> still printing `[assert ok]`.

## Context

`chatbox/smoke_test.sh` guards Sierra's external-context privacy rule: with
`ctx:"external"` she must **not** name a college's CPL coordinator. The anchor
was San Diego Mesa, whose coordinator was Monica Romero, and the pair read:

```bash
answer_must_match     -i "romero|mdromero" "14a default surfaces the CPL contact"
answer_must_not_match -i "romero|mdromero" "14b external ctx never names the contact"
```

On 2026-08-14 the MAP roster sync replaced that coordinator with Rachel Russell.

## The claim

**Two different failures happen, and only one of them is visible.**

- `14a` — the positive — **went red**. That half is self-announcing: CI fails, a
  human looks, and the answer is obvious. It is also *wrong to be red*: Sierra
  correctly reported the current roster. A CI job must not go red because a
  college hired someone.

- `14b` — the negative, and the actual privacy guard — **went vacuous**. Once
  Romero was gone from the data, no answer Sierra could produce would ever
  contain "romero". The assertion could not fail. It kept running, kept printing
  `[assert ok]`, and kept counting toward the suite total, while the thing it
  existed to detect was completely untested.

A negative assertion is only as strong as the probability that its needle could
appear. Pin the needle to a value that can leave the data, and the guard's
strength decays to zero on a schedule nobody is watching — here, a **daily**
roster sync.

### The fix has a shape

Anchor on the **invariant**, not the instance, and derive the negative from what
the positive actually observed:

```bash
answer_must_match -i "[a-z0-9._%+-]+@sdccd\.edu" "14a surfaces the CPL contact"
MESA_CONTACT="$(printf '%s' "$LAST_ANSWER" | grep -Eio '[a-z0-9._%+-]+@sdccd\.edu' | head -1)"
[ -z "$MESA_CONTACT" ] && MESA_CONTACT="@sdccd.edu"   # never an empty regex
answer_must_not_match -i "$MESA_CONTACT" "14b never names the contact"
```

The domain is structural — it changes when the district changes, not when a
person does. And the empty-string fallback is load-bearing: an unset variable
would make the regex `//`, which matches everything, so the negative would pass
unconditionally — re-creating the exact vacuum being fixed, one level deeper.

## How we got here

The failure surfaced on an unrelated PR's CI. Reading only the red assertion
would have produced a one-line fix (swap the name) that left the vacuum in
place — and left it *green*, which is worse, because nobody looks again.

Confirmed against `map_college_contacts` before acting: the live row named
Rachel Russell, synced that same day. Sierra was right; the test was stale.

## Consequences

- **Prefer shapes to instances** in assertions over curated or synced data:
  a domain, a format, a count relation, a structural invariant.
- **Derive a negative from its paired positive** where possible, so the two
  cannot drift apart.
- **A guard that cannot fail is worse than a missing one**, because the suite
  reports coverage that does not exist. When rewriting one, prove it still fails
  by feeding it the thing it is supposed to catch.
- Same family as
  [[methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty]]:
  both are cases where an observation is treated as evidence without checking
  that the opposite observation was ever possible.
