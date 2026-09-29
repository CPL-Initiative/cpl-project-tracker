---
title: Assert that an argument arrives, not that it is last
created: 2026-08-22
updated: 2026-08-22
tags: [methodology, testing, ci, regex, cpl-assistant]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - tests/sierra_rules_overlay.test.js
  - tests/sierra_host_scope.test.js
  - tests/sierra_credential_volume.test.js
---

# Assert that an argument arrives, not that it is last

> **One-sentence summary** — A source-text check that anchors on a call's closing
> paren fails the moment anyone appends a parameter, and it fails by naming
> something that is not wrong.

## Context

`sierra_rules_overlay.test.js` guarded that the curator rules overlay reaches the
prompt builder, with:

```js
/rulesOverlay, ruleReport\)/.test(src)
```

Appending a `hostScope` argument to that call in v53 turned the check red with
the message **"the overlay is read per turn and passed into the prompt builder"**
— while the overlay was being read per turn and passed into the prompt builder.

## The claim

### A red that names the wrong thing costs more than no test

A failing check is read as a claim about the system. This one claimed the rules
overlay had been disconnected. Acting on that claim means looking at the overlay,
`fetchSierraRules`, the registry — none of which had changed. The check's failure
mode was *misdirection*, which is the one thing a guard must never do, because
the cost lands on whoever is least equipped to discount it.

### The fix is to assert the intent, never to delete the assertion

The intent is *"this value reaches that function"*. Position is not the intent —
nobody ever decided the overlay must be the second-to-last argument. So:

```js
/buildSystemPrompt\([^;]*\brulesOverlay\b[^;]*\bruleReport\b[^;]*\)/
```

Still strict about both values reaching the builder, in that order. Silent about
what follows them.

### But a looser check must still be proved able to fail

Loosening is how a check quietly becomes unfailable, and this repo has been
burned by that repeatedly. Two probes, not one:

- remove the value → the check **must** fail;
- change only the argument count → the check **must** stay green.

The second probe is the point of the change and is the one people skip.

### The pattern was already in the repo, with the lesson in a comment

`sierra_credential_volume.test.js`, written earlier:

```js
// Assert that volumeContext REACHES buildSystemPrompt, not that it is the last
/buildSystemPrompt\([^;]*\bvolumeContext\b[^;]*\)/
```

So this is not a new insight — it is a rule that existed in one file and had no
reach into its siblings. The same shape as
[`a-rule-you-wrote-is-not-a-rule-you-applied`](methodology-a-rule-you-wrote-is-not-a-rule-you-applied.md).

## How we got here

CI caught it on #1291. Fixing it exposed the sharper half: **the brand-new test
written in that same PR had the identical defect** — it pinned
`rulesOverlay, ruleReport, hostScope\)`, which would have handed the same trap to
whoever adds the next parameter. Reading a failure is not the same as
generalizing it; the generalization has to be applied to your own diff in the
same sitting, or you ship a fresh instance of the bug you just fixed.

## Consequences / how to apply it

- Source-text checks assert **presence and relative order**, never adjacency to a
  delimiter. `\b…\b[^;]*` over `, …\)`.
- After loosening any check, run both probes above.
- When CI hands you a brittle check, grep your own diff for the same shape before
  you push the fix.
- This applies to any regex over source: imports, call sites, config keys. The
  tell is a literal `)`, `,` or `;` doing structural work in the pattern.
