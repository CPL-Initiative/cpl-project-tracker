---
title: Session 185 handoff — the ceiling is built; the number is Sam's call
created: 2026-08-22
updated: 2026-08-22
tags: [handoff, session-185, funding, implementation-funding, allocation, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_184_handoff]]"
  - "[[docs/cpl_funding_lessons]]"
---

# Session 185 handoff

You are **Session 185**. Session 184 was **SkyBound**, and it ran **concurrently
with Session 183 (SkyScope)** — Sam had two sessions open on the same handoff.
SkyScope did My College / Sierra scope (#1291) and wrote `session_184_handoff.md`;
SkyBound did the funding ceiling (#1293) and wrote this one. **Read both.** They
touched one file in common (`college_briefing.js`) and the merge was clean.

⚠️ Sam frequently runs several sessions at once. Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## What shipped — #1293

Sam's four items, verbatim: move the "How this model works" link to the title
row; add a **Max Funding** factor to the Min Funding box, editable, set to
**$400,000**; recalculate everything; *"push back and simpler recommendations
welcome."*

| | |
|---|---|
| Title row | `sanityLinkHtml()` is a compact link in a `#cplFundTitleLink` slot beside the tab's `<h2>` (both HTMLs, Rule 4), not a full-width strip |
| The dial | `pool.cap_window`, default $400,000, two editable amounts + two editable labels in one box, `0` disables it |
| The solver | `allocModel()` bisects `lambda` in `clamp(lambda*size, floor, cap)` — both bounds at once |
| The bar | `capScale()` scales a capped college's targets down with its money |
| Downstream | My College explains it; the explainer artifact regenerated + republished to the same URL |

---

## The finding, which matters more than the feature

⭐ **A $400,000 ceiling is close to a no-op for equity.** It holds **6 colleges**
and moves **$262,241 — 1.1% of the pool**, all of it to the colleges ranked
~7–70. **The 45 at the minimum gain nothing**, because a college pinned to the
floor cannot be lifted by a ceiling. Biggest gainer: Santa Monica, **+$7,079**.

⭐ **The floor is the lever.** A **$200,000 minimum** takes the max/min ratio from
3.48x to **1.88x on its own**, and at that floor a $400,000 ceiling never binds —
one dial instead of two. The floor's own limit is **~$210,785** (the average
award); above that every college is at the average.

**This is the open decision.** The ceiling shipped at $400,000 as Sam asked,
because it is a live dial he can move in the tab in five seconds. The
recommendation is in the PR body and in `kb/cpl_todos.json`.

---

## Read in this order

1. `CLAUDE.md` §11 — the **Implementation Funding** row (rewritten and trimmed
   this run; it was flagged as an append-only log at 5,335 chars, now 3,702).
2. [`docs/cpl_funding_lessons.md`](cpl_funding_lessons.md) — the 2026-08-22
   *(later)* section carries the full measurement table and every trap.
3. [`methodology-a-second-bound-breaks-a-pin-as-you-go-solver`](kb-notes/methodology-a-second-bound-breaks-a-pin-as-you-go-solver.md)
   — the durable half.
4. `docs/session_184_handoff.md` — the other session's run.

---

## Carryover — what is actually open

- 🔴 **Sam picks the ceiling number.** $400,000 as shipped, or the floor raise.
  Nothing is blocked on it; the model is correct either way.
- 🔴 **Nobody has opened any of this in a browser** — the sandbox is egress-blocked
  from the Pages host and from `*.supabase.co`. The title-row link, the two-dial
  box and the rewritten explainer are verified only by test and by reading.
- 🟡 **The explainer is a SNAPSHOT.** Any change to shares, factors, order **or
  the bounds** means: pull the live config (`select config::text from
  public.cpl_funding_config where id='default'` via the Supabase MCP), run
  `node prototype/build_funding_model_explainer.js <config.json>`, then republish
  `prototype/funding_model_explainer.html` to `SANITY_URL` in `cpl_funding.js`.
  ⚠️ The Artifact tool refuses a publish until you have READ the live version in
  the same turn — read first, diff against `origin/main`, then publish.
- 🟡 **The Year-2 mirror for Scenario 2** — still Sam's call, unchanged since S181.
- 🟢 Docs lint long tail: 171 files carry British spellings, 4 oversized docs
  (`roadmap_archive` 3.08x, `INDEX.md` 6.38x). Fix in the files you touch.

---

## Patterns that worked

- **Measure the policy before you build it.** One probe script over the live
  roster turned "add a $400K cap" into "here is what a $400K cap does, and here
  is the dial that does more." That measurement is the deliverable Sam did not
  ask for and most needed.
- **Make a solver migration bit-for-bit provable.** Bisect to find the bound
  SETS, then compute the free rows with the *old* arithmetic — so with the new
  bound off the output is identical (`0.000e+0`), asserted against a
  transcription of the old algorithm rather than a stored snapshot.
- **Break your own checks.** Four deliberate breakages; three fired. The fourth
  did not, because no rural college comes near $400,000 and the assertion was
  vacuous — it now runs at a ceiling that binds. **Fourth consecutive session to
  find a check that cannot fail.**
- **Read the lint's complaint about your own edit.** `stacked_roadmap_cell` and
  `unindexed_kb_note` both fired on this run's work and both were fixed before
  commit.

## Safety patterns to honor

- **Rule 4**: `CPL_Dashboard.html` and `index.html` byte-identical — this run
  added a slot to both; `cpl_funding_cap.test.js` asserts it.
- **Rule 5**: never force-push `main`.
- **Merge on `unstable`**, not just `clean`.
- ⚠️ **`_alloc()` reads a CACHED model.** `_model()` is what clears it. A probe
  that calls `_setScenario()` then `_alloc()` measures the *previous* settings —
  this run's first measurement "proved" the ceiling did nothing.
- ⚠️ **A marker is load-bearing text.** A comment quoting a retired phrase broke
  the test that greps the source for it.

---

## Moniker

**SkySolve** is going if you want it — this run was about what a solver can and
cannot promise once you give it a second bound. Take it, take your own, or use
whatever Sam names in his greeting.
