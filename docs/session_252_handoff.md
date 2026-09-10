---
title: "Session 252 handoff — the rest of the phantoms, and three guards that reported nothing"
created: 2026-09-10
updated: 2026-09-10
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 252

Your moniker is **SkyProof**. The name is the job: nearly everything this run
turned on was the difference between a fix being *correct* and a fix being
*shown* — a sweep that measured nothing, a probe that could not fail, a guard
with no runner, and two rival repairs that a falsification settled in a second.

⚠️ **SkyTouch (S249) wrote this file.** Its work is on
**[PR #1542](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1542)**
(draft, branch `claude/cobi-dark-mode-responsive-gpdu27`). ⚠️ **Check whether it
merged before you build on it** — the harness pinned that session to one branch,
so the PR carries two independent asks plus three CI repairs.

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **A FINDING COUNT IS NOT AN ACCEPTANCE TEST FOR A TOKEN-LAYER FIX.**
   S249 defined the remaining 21 phantom tokens — 62 uses across 14 files — and
   `npm run a11y cobi-dark` moved **66 → 67**. Measured both ways on one tree
   with `git stash`; the diff of the two finding lists is **empty in one
   direction**. None of the 62 uses was ever sampled: `.cplccr` chips,
   `.cplmem` cards, `.mtq` items, `.tphx` cards and `.grx` boxes are built on
   demand. **Prove the token layer directly** — load both themes, read each
   token off `getComputedStyle(document.documentElement)`. Correct is: the
   intended value under `data-theme="dark"`, and **empty** under `light`, because
   empty is what leaves each site's fallback in place.
   [`methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme`](kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme.md)

2. ⚠️ **THE CRON'S COMMITS NEVER TEST THEMSELVES, AND THAT IS HOW `main` GOES
   RED IN SILENCE.** `js-tests.yml` runs on push to `main`, but a push made with
   `GITHUB_TOKEN` does not trigger workflows. `main`'s last green js-tests run
   was an **ancestor** of the commit that broke `discipline_edge_fill_test.py`.
   Twice this session a failure was already on `main` before the branch touched
   it. **When a check fails on your PR, reproduce it on a clean worktree at the
   base SHA before assuming it is yours.** Two minutes, and it decides who owns it.

3. ⭐ **TWO REPAIRS TO ONE GUARD MAY BOTH BE RIGHT — BREAK THE THING AND RUN
   BOTH.** Another session fixed the same failing check from the opposite side
   the same day. Emptying the `edge` map inside `discipline_edge_fill()` leaves
   **both** of their live-payload checks green and fails only the round trip,
   because their assertion is `filled == 0` and a dead function also returns 0.
   Complementary, so both were kept — measured, not polite.
   [`methodology-two-fixes-to-one-guard-may-both-be-right`](kb-notes/methodology-two-fixes-to-one-guard-may-both-be-right.md)

4. ⚠️ **A `*_test.py` RUNS NOWHERE UNLESS A WORKFLOW STEP NAMES IT.**
   `tests/run.js` auto-discovers `tests/*.test.js` only. #1541 shipped
   `tests/kpi_history_no_gaps_test.py` referenced in no workflow, no script and
   no `package.json` — Rule 3's guard had reported nothing since it landed. It
   is wired in now. **`npm test` passing proves nothing about the 41 python
   steps**; run them before you push (they are greppable out of
   `.github/workflows/js-tests.yml`).

5. ⚠️ **FALSIFY THE VERIFIER, NOT JUST THE FIX.** The token probe's first
   version compared the light value against `""` after an `|| "(unset)"`
   coalesce, so all 21 tokens read BAD while the data underneath was perfect.
   That is the third check in this lane that could not fire. Every guard S249
   added was verified by reverting its own fix.

## WHERE THE DARK-MODE LANE STANDS

Read [`docs/reference/lanes/cobi-dark-mode.md`](reference/lanes/cobi-dark-mode.md)
first — it was compacted this run (17.8 KB → 15.8 KB) and states current truth.

✅ **All four "cannot flip" classes are cleared** — 47 phantom tokens / 88 uses,
7 `var(--white)` grounds, 21 fixed-ink-on-flipping-fill sites, and both tabs
that kept their own theme state. ✅ **Mobile is clean at 390px on all 38 routes.**

**NEXT:** the raw dark inks the sweep names (`#666666` 8 · `#374151` 6 ·
`#5A6478` 4 · `#555555` 3), the raw **light grounds** under them (`#8F8F8E`,
`#F1F5F9`, `#F6F2FD`, `#F7F9FC` all show up as backgrounds in dark findings),
and printing while in dark mode — consumer-JS dark rules still apply to a print,
so that pass wants `@media screen` scoping and is its own job.

**NEEDS SAM** — three, all of which change the LIGHT theme, which is why none
was swept:
1. Whether `--surface-1`/`--surface-2` get light values too (unifies six tabs'
   tints and repaints them — a design call).
2. The `--text-faint` sites on Implementation Funding (6 findings, ~12 sites).
3. ⭐ **The 24 `var(--brand)` / `var(--link)` / `var(--text)` declarations that
   resolve to NOTHING in both themes** — written with no fallback, invalid at
   computed-value time, so `college_briefing.js`'s `.cb-bfrac>i` progress bar is
   `transparent` and its `.cb-lead`/`.cb-next` accent borders do not draw. Not a
   theming bug; fixing it is visible in light.

## SAFETY PATTERNS TO HONOR

- **Rule 4** — `index.html` and `CPL_Dashboard.html` byte-identical. `cmp` them
  before every commit; `tests/cpl_theme.test.js` checks it first.
- **Rule 1** — the generator, not the HTML. And **sweep the generator's INPUT**:
  `college_activity_template.html` is emitted verbatim and a guard reading only
  the HTML could not see it.
- **A dark-only token definition needs every use to carry a fallback.** Without
  one, light gets nothing and dark gets a value — a change light never asked for.
- **A fill whose token flips cannot keep a fixed ink** — use `--on-accent`.
  `tests/cpl_theme.test.js` now scans every consumer JS for this shape.
- **Sam runs parallel sessions.** One was on SkyView this run. Fetch before you
  assume the base is where you left it; #1542 went `dirty` twice.

## READ IN THIS ORDER

1. `docs/reference/lanes/cobi-dark-mode.md` — lane state, compacted
2. `docs/cobi_lessons.md` — the 2026-09-10 S249 section
3. `docs/kb-notes/methodology-two-fixes-to-one-guard-may-both-be-right.md`
4. `docs/kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme.md`
5. PR #1542's description and its one comment — the CI archaeology is there

## FIRST CONCRETE STEP

Check #1542's state. If it merged, dispatch `daily-dashboard.yml` so the runner
publishes, then take the raw dark inks. If it did not, read `get_check_runs` on
the current head and drive it to green — `test` must be green before merge, and
the four remaining greys are the only sweep-named work in the PR's own scope.
