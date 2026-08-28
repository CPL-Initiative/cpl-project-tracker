---
title: A default payout masks the data gap beneath it
created: 2026-07-31
updated: 2026-07-31
tags: [methodology, data-integrity, funding, incentives, entity-resolution]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-achievement-based-funding-cap-and-earn]]"
  - "[[docs/kb-notes/methodology-retire-a-mode-toggle-by-coexistence]]"
artifacts:
  - cpl_funding.js
  - funding/_build_funding_performance.py
  - tests/cpl_funding_frontload.test.js
---

# A default payout masks the data gap beneath it

> **One-sentence summary** — Any rule of the form "if we can't measure it, pay/pass/allow
> it anyway" is simultaneously a policy *and* a blindfold: it hides every upstream failure
> that would otherwise have shown up as a zero, so removing it must be paired with an audit
> of what was riding on it.

## Context

The CPL Implementation Funding tab funds colleges on achievement: `earned = cap ×
min(1, actual ÷ target)`. Metrics MAP cannot measure yet pay the full cap as a provisional
**advance**, which flips to achievement automatically once the feed lands. That advance is
a deliberate, defensible phase-in policy.

Under front-loaded disbursement the tab evaluated *each year on its own metrics* and summed
both into the Year-1 money cell. Year 2's three metrics are all data gaps — so **every
college was drawing a full advance on half the window, no matter what it had posted.**

Fixing that (front-load now earns the whole window against the Year-1 targets) was correct
on its own terms. But it had a second effect nobody asked for: four colleges immediately
dropped to **$0 across the board** — because their names had never joined the MAP feed at
all, and the advance had been quietly paying them the whole time.

The join bug was months old. It became *visible* the day the advance stopped.

## The pattern

A default-pay rule sits on the same code path as every upstream failure that produces "no
value":

| Upstream reality | With the default | Without it |
|---|---|---|
| Metric genuinely unmeasurable (the intended case) | pays | pays (still intended) |
| Feed row missing because the **name join** broke | pays | **$0** |
| Feed row missing because the builder silently skipped a branch | pays | **$0** |
| College genuinely posted nothing (the incentive!) | pays | $0 |

Only the first row is the policy. The rest are bugs and one real signal, all wearing the
policy's clothes. **A permissive default is indistinguishable from correct behavior right
up until you remove it** — which is exactly when it turns into a false accusation against
whoever the gap belonged to.

The same shape shows up well outside funding: fail-open auth, "unknown → allow", "no data →
assume healthy", `NULL` treated as a pass in a validation gate.

## The method

1. **Before removing a default payout, enumerate everything that reaches it.** For each
   producer of the "can't measure" state, ask whether it is the *policy* case or a defect.
   Here: three statuses (`gap`, `pending`) plus an absent feed row — and the absent row had
   two causes, one legitimate and one a broken join.
2. **Fix the defects in the same batch, not the next sprint.** The window between "removed
   the mask" and "fixed what it hid" is a window where the product actively lies about real
   institutions. It shipped as two PRs the same night for exactly that reason.
3. **Make the remaining honest gap say so.** A cell that can't be measured must read
   differently from a cell measured at zero. "held", "⏳", "carryover" — never a bare `$0`,
   which asserts something specific and possibly false.
4. **Add the assertion that would have caught it.** Not the fix — the *class*. Here: every
   Year-1 baked metric must be measurable, and no site may compute disbursement scope on
   its own.

## The instrument: a collision-checked fuzzy join

Repairing the join needed fuzzy name matching, which is normally the thing you don't ship
without review. The property that made it safe enough to ship unreviewed:

> Build the fuzzy index, then **drop every key reachable from two different entities**
> rather than picking one. The join can then *add* matches but can never *merge* distinct
> entities.

Worked example — MAP and the funding workbook disagree on `X College` vs
`X Community College`, **in both directions**, so no single canonical spelling could match
both:

```python
def _stem(name):
    """Normalized name with a TRAILING institutional suffix removed."""
    n = _norm(name)
    m = re.compile(r"(?:community)?college$").search(n)
    return (n[:m.start()] if m else n) or n     # never stem "College" to ""

stems = {}
for key, target in known_spellings:
    stems.setdefault(_stem(key), set()).add(target)
by_stem = {s: next(iter(t)) for s, t in stems.items() if len(t) == 1 and s}
```

Two details carry the safety:

- **Trailing-only.** "College of Alameda", "College of Marin" and "College of the
  Siskiyous" are untouched, and a distinguishing mid-name word survives ("San Diego City
  College" → `sandiegocity`).
- **`len(t) == 1`.** A stem shared by two colleges is discarded, not guessed.

Then verify against the *real* roster before shipping, not just a fixture: zero stem
collisions across all names plus every alias, and every canonical name still resolving to
itself. Both checks are three lines and both were run.

## Cost

Small, and mostly diagnosis. The front-load rework was ~1 evening including 37 new
assertions; the join fix was ~40 lines plus fixture rows. The expensive part was *noticing*
— the join had been broken for months behind a payout that made it look fine.

## Worked example

`cpl_funding.js` + `funding/_build_funding_performance.py`, 2026-07-31 (PRs #956, #957):

- **#956** — front-load earns the whole window against Year-1 targets, removing the Year-2
  gap advance. Both live scenarios had front-load ON, so this was live money.
- **#957** — the exposed join: Barstow (`pe` 133), Lassen (140), Madera (43) and
  Southwestern (571) had been in the `unmatched` bucket; plus a second instance of the same
  class where a short-names entry was matched on `short` alone and skipped outright when the
  workbook carried the CAPS spelling (`LA Swest` vs short `LA Southwest`).
