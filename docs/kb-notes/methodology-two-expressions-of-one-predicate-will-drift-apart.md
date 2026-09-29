---
title: Two expressions of one predicate will drift apart, and the drift is silent
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, ui, debugging, testing, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/ccr_universe.js
  - tests/ccr_skyview_isolate.test.js
---

# Two expressions of one predicate will drift apart, and the drift is silent

> **One-sentence summary** — When a control's ENABLEMENT and its EFFECT each
> compute "is anything selected?" from their own expression, the two will
> eventually answer differently, and the result is not an error but a control
> that arms, fires, and does the opposite of what it promises.

## Context

SkyView's *Isolate* toggle means "hide everything not selected". Sam pressed it
and reported: *"it cleared the field with no groupings displayed."* Measured on
the committed payload, the map went from **49,896 courses across 159 islands to
0 and 0** — a blank canvas.

Nothing threw. The button was enabled, the press was accepted, the frame was
drawn, and the drawing was empty.

## The claim

The control asked the same question twice, in two places, and got two answers:

```js
// enablement — used by the button's `can` test AND by isoActive()
searchHits.length > 0 || !!selNode || !!selIsl

// effect — used by isoNodeOK(), once per node
searchHits.includes(nd) || nd === selNode || lastFocus[nd.i]
```

`selIsl` appears in the first and not the second. A discipline is selected as an
**island** — the model of this map outlines a discipline in blue rather than
ringing its courses in red, so a discipline contributes no node hits at all.
Select one and `searchHits` is empty, `selNode` is null, and `selIsl` is set: the
first expression says *yes, something is selected* and enables the button; the
second says *no* for every node in the payload.

**The two halves were both correct in isolation and neither could report the
disagreement.** The enablement test cannot see what the filter does with its
answer; the filter cannot see that it was invited to run.

⭐ **This is Rule 7's stored-id failure in a different costume.** A lookup that
matches nothing does not error — it returns empty, and empty is a legal value
that renders as a legitimate-looking result. Here "no node passed the filter" and
"the reader selected nothing" produce the identical frame and mean opposite
things.

### What to do about it

- **Name the predicate once and call it from both sides.** Two derivations of
  one question is the defect; the fix is one function, whatever it costs in
  indirection.
- **Where the two genuinely differ, say so at the difference.** They did differ
  here: `selIsl` is ALSO set to the parent of a clicked course, so honoring it
  unconditionally would make "isolate this one course" open its whole discipline.
  The real predicate is *the island counts only when the island IS the
  selection* — `!selNode && selIsl` — and that condition deserves a comment,
  because a later reader will otherwise "simplify" it back into the bug.
- **Treat a control that can empty its own surface as a special case.** Whatever
  the enablement says, an effect that removes everything is worth a floor.

## How we got here

The suite had ten checks on this toggle, including a starred one for the
empty-selection case, and all ten passed. ⚠️ **The fixture had ONE island.** The
sentence "isolate a discipline and the other disciplines go" cannot be written
against a single island, so the case could not be stated, let alone tested — and
the checks that existed covered the *course* path, where `searchHits` is
populated and the bug does not appear.

The fixture now carries two islands; check (12) reports `shown=0 islands=0/2`
when the fix's own line is reverted, which is the blank canvas itself. Fixed in
PR [#1532](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1532).

⚠️ **The performance shape matters and nearly hid the fix.** `islandPass` counts
every course in the payload on a frame, so re-deriving the selected-island set
per node is ~50k allocations per frame. The set is stamped onto the nodes and
rebuilt only when the selection's shape changes, compared by reference — and
every path that rewrites a token's islands **in place** has to say so, because a
reference comparison cannot see that.

## When this applies (and when it doesn't)

**Applies** wherever a control's availability and its behavior are computed
separately: enable/disable vs. the filter it drives, a "can submit" check vs. the
validator, a permission gate vs. the query it guards, a menu item's visibility
vs. its handler. The symptom is always that the control is offered and then
under-delivers, never that it errors.

**Does not apply** where the two are the same expression already, and it is not
an argument against having a disabled state — the disabled state here was correct
and prevented the *other* blank-canvas route. It prevented the case it was
written for and had nothing to say about the case reached from the other side.

## See also

- `[[docs/ccr_atlas_lessons]]` — the run that produced this (2026-09-09, SkySight)
- `[[docs/kb-notes/methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration]]` —
  why the one-island fixture could not have caught it
- `CLAUDE.md` Critical Rule 7 — the stored-id version of the same silent-empty shape
- PR `#1532` — the implementation and checks (11)–(13)

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
