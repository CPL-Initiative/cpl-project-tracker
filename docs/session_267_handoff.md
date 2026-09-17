---
title: Session 267 handoff — the explainer reads the model, and a test that pinned the cron's data
date: 2026-09-17
session: 265 (SkyPublius)
tags: [handoff, implementation-funding, funding-explainer, testing]
status: current
---

# You are Session 267

Your moniker is **SkyQuarry** — you cut what is already in the rock rather than
inventing it, which is what both of S265's findings turned out to be.

⚠️ **WHY 267 AND NOT 266.** `docs/session_266_handoff.md` exists on the UNMERGED
crosswalk branch `claude/keen-gates-04kmwq` (PR #1576) and is not on `main`. A
session that reads `main` sees 265 as highest and writes 266 — straight into a
collision. **Check the open PRs, not just `main`, before numbering a handoff.**

⚠️ **PARALLEL LANE.** The SJCOE crosswalk (PR #1576) is Sam's, in a separate
session, and he asked that funding work stay clear of it. Do not push to that
branch. It needs only a base merge to pick up the test fix below.

Read in order:
[`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md) ·
[`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md) ·
[`methodology-a-display-name-is-not-a-key`](kb-notes/methodology-a-display-name-is-not-a-key.md) ·
[`cpl_funding_lessons.md`](cpl_funding_lessons.md) (last two sections) · PRs #1588 #1589.

## What shipped

- ⭐ **#1588 — THE EXPLAINER READS THE MODEL INSTEAD OF COPIES OF IT.** The
  priority card's plain sentence came from a map keyed on the priority TITLE
  (glosses for the retired Access/Outreach/Success), so two cards fell through to
  the raw metric string and the third — still matching its key — described
  *eligible* units under a priority measuring *applied* units. **The card that
  lied was the only one that looked normal.** Same shape twice more: typed
  baseline requirements whose first entry contradicted the live model, and a
  typed "1 Nov 2026" against a stored `2026-11-01`. All read `_requirements()` /
  `description` now. Plus: new **Funding outcomes and milestones** section
  (`outcomes`), strategies folded closed, section titles in the model's words,
  the table given the window (1,039px of table in a 942px box), **Download PDF**
  via print, the Columns menu closable, and 138 focus rings that were never drawn.
- ⭐ **#1589 — `main` WAS RED AND NOBODY HAD TOUCHED IT.** Three assertions
  hard-coded figures out of `cpl_funding_performance.js`, which the daily cron
  rewrites. Derived now. `main` green at `a0bdc78` (js-tests run #3039).

## ⚠️ Sam's decisions this run — do not re-litigate

1. **The table may take the window** — *"you can widen the table if helpful"*
   after he found the overflow himself by hiding the District column.
2. **Section titles use the model's language** — his explicit follow-up ask. The
   titles now come from the tab's own section names and his live rename.
3. **The crosswalk goes to its own session**, steering clear of funding work.
4. **Unruled, his call when he wants it:** whether the participation deadline
   should read `2026-11-01` (the model's own format, which the page now prints)
   or "1 November 2026" for a college-facing page. Formatting it here would
   re-introduce a transform between the model and the page — the cleaner fix is
   to store it the way he wants it read. **Do not decide this for him.**

## Carryover

- ⭐ **THE ORIGINATION CUTOVER IS STILL ASYMMETRIC** — NC (`LocID2`) lands
  automatically; the credit side holds PENDING on confirmed spellings and signals
  only through one line in a daily run log. Unchanged this run.
- **PR #1576** needs a base merge to pick up #1589. Not yours to push.
- **The explainer video shot sheet** — ⚠️ the steps and strategies now fold
  CLOSED, so a pan down the page shows headings rather than content. Open them
  before recording, or add an expand-all parameter.
- Carried from S264: `Counselor_Verified` into the daily fetch; 51 guessed column
  offsets in `excel_to_dashboard.py`; SkyView ⑩/⑪; COBI-wide contrast (17 of 38).
- ⚠️ **Budgets:** `roadmap_archive.md` 4.34× · `cpl_funding_lessons_archive.md`
  **1.92×** (it grew — this checkpoint moved three sections into it to bring the
  live lessons doc back under budget) · `lanes/implementation-funding.md` 1.34×
  (compacted from 1.55× this run) · `CLAUDE.md` at exactly **1.0×**, so anything
  added there must displace something.

## Patterns that worked

- **Bisect before accepting an attribution, even a well-argued one.** The
  crosswalk session's write-up was right, and checking it cost two worktrees and
  ruled my own merge in or out on evidence rather than plausibility.
- **Measure the complaint before designing the fix.** "Doesn't fit" became
  "1,039px in a 942px box with District shown", which named both cause and remedy.
- **Screenshot the print medium.** Two defects existed only at paint — an empty
  Institution column and re-stacked grids — in a medium no test renders.
- **A small ask can be the most valuable one.** "Align the section titles" read
  like a copy-edit; doing it meant listing the tab's ids beside the page's, which
  is the only reason a live id collision was ever seen.

## ⚠️ Safety patterns to honor

- **A mutation that changes nothing proves nothing.** Verify the mutation moved
  the output before concluding a guard is weak — a no-op mutation and a passing
  guard are indistinguishable from the result alone.
- **`kb/_docs_audit.py` and `kb/_build_docs_index.py` check different things.**
  The audit flags an unindexed note; adding an `INDEX.md` line clears that flag
  **without** rebuilding the generated catalogs, so the lint reads green while CI
  stays red. Run the generator whenever `docs/kb-notes/` gains a file.
- **Rebuild the dependency map genuinely last** (`--check` runs in CI).
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase only
  through MCP) · the `test` check green on the CURRENT head before every merge,
  and a `check_suite` wake routinely names a SUPERSEDED `head_sha` · a draft PR
  cannot be merged (mark ready first) · dials are Sam's, through the tab · MAP
  read-only · the public KB untouched.

## KB notes added this run

- `methodology-a-display-name-is-not-a-key`
- `methodology-a-ban-is-only-as-wide-as-the-files-it-opens`
- `methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`

---

*Greetings, you are Sky**Quarry** (Session 267), see Sky**Publius**'s handoff —
`docs/session_267_handoff.md` — let's keep rolling with our queue.*
