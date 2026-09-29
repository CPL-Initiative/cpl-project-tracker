---
title: A fill that does not flip needs ink that does not flip either
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, dark-mode, ui, tokens, a11y]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-token-with-two-jobs-cannot-be-themed]]"
  - "[[reference-ui-design-system]]"
artifacts:
  - CPL_Dashboard.html
  - tests/cpl_theme.test.js
  - docs/reference/lanes/cobi-dark-mode.md
---

# A fill that does not flip needs ink that does not flip either

> **One-sentence summary** — Themed text on an unthemed fill is a contrast bug in
> one theme by construction, and the obvious repair token makes the *other* theme
> worse.

## Context

A companion to [`methodology-a-token-with-two-jobs-cannot-be-themed`](methodology-a-token-with-two-jobs-cannot-be-themed.md).
That note says a token used as both text and fill has no dark value that works.
This one is the case *after* you have split them: a fill token that is
deliberately identical in both themes, carrying an ink token that is not.

## The failure

`--gold-accent` resolves to `#E3B341` in **both** themes — it is a brand hue, and
`--mustard-on-dark` is never redefined. COBI's To-Do badge, the Admin chip and
the Activity KPI badges painted `--navy-primary` on it. That token flips
`#1C1C1A → #ECE9E2`:

| | fill | ink | ratio |
|---|---|---|---|
| light | `#E3B341` | `#1C1C1A` | 8.77:1 ✅ |
| dark | `#E3B341` | `#ECE9E2` | **1.61:1** ✗ |

Nobody chose that. The badge was written in a light-only world, where
`--navy-primary` meant "dark ink", and adding a dark theme silently redefined
what the declaration said.

## Why the obvious fix is wrong

`--on-accent` exists for exactly this — text on an accent fill — and it is the
right answer for **cobalt, crimson, hunter and violet**, all of which flip to a
lighter grade in dark:

| fill | white on the LIGHT fill | `#141413` on the DARK fill |
|---|---|---|
| cobalt | 8.44:1 | 6.95:1 |
| crimson | 9.45:1 | 7.00:1 |
| hunter | 7.51:1 | 6.87:1 |
| violet | 7.10:1 | 6.94:1 |

But `--on-accent` is `#FFFFFF` in light. On the mustard, which does **not** flip,
that paints white on gold at **1.95:1 and regresses the light theme** — trading a
dark-mode bug for a light-mode one, while looking like the principled fix.

## The rule

**Count the token's behavior across themes before choosing its partner.**

- Fill **flips** → ink must flip with it. `--on-accent`.
- Fill is **invariant** → ink must be invariant too. A token defined once at
  `:root` and never redefined — the `--seal-blue` pattern. Here: `--on-mustard`.

Three ink roles, not two. The third is easy to miss precisely because the palette
already has a token that *sounds* like it covers the case.

## Guarding it

Assert both halves — the ink token exists and is not redefined dark, **and** the
fill is not redefined either. The pairing only holds if both are true, and a
future session tidying the dark block could break it from either side. Verify by
reverting each: redefining `--on-mustard` dark, redefining `--gold-accent` dark,
and restoring the flipping ink each fail exactly their own check.

⚠️ **The symptom points at the wrong culprit.** What a reader reports is "the
badge is unreadable at night". The instinct is to change the badge's color. The
defect is one line away, in a token whose declaration has not been edited in
months and reads correctly on its own.
