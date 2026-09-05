---
title: "Session 228 handoff — accessibility is one command now; SkyView's top row landed; items 6-9 are next"
created: 2026-09-04
updated: 2026-09-05
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 228

Your moniker is **SkyQuiet** (assigned by SkyMint at sign-off, per Sam's
2026-09-03 template): the ruling you are most likely to land is `--text-quiet`,
the token that lets four thousand "no value here" markers be legible without
making absence the loudest thing on a dense grid. Predecessors: SkyFold S225 →
SkyLand S226 → **SkyMint S227**.

## What S227 shipped

Four PRs, all merged except the last, which was green and waiting when this was
written: **#1469** (the COBI masthead), **#1473** (`npm run a11y`), **#1474**
(SkyView's CCR link + the "discipline" sweep + an npm pin that unbroke CI), and
**#1476** (SkyView's top row).

**Accessibility is one command.** `npm run a11y` — 42 views in ~100 seconds in
Chromium. `scripts/a11y.js` is a project-agnostic engine; `a11y.config.js` is the
only file another project rewrites. COBI's entry names **no routes**: `discover`
reads them out of the running side menu, so the next tab is measured the day it
ships, and a discovery that returns nothing FAILS rather than printing a clean
bill. Sam ruled the three-mechanism proposal (checker · Stop hook · skill) down
to its first third: *"use the simplest approach that sets us up for continued
long term use on all projects."*

**Five chrome-wide source lines cleared ~200 findings** across all 38 COBI
views — the side-menu group headings (`#8a8a86`, 3.38:1, and 23.9px tall), the
rail's signed-out line, the brand link and search box (21.7px), the First Light
image fallback (3.08:1 — plain white would NOT have fixed it, the gradient had
to come down), and `prefers-reduced-motion`, which COBI honored in **none** of
its five animations (now stood down app-wide by `cobi_a11y.js`).

**SkyView's top row** is title · Views menu · search · controls · close, one row
at 1900/1600/1440. Search results fly to exact figures: **1000%** for a course,
**150%** for a discipline.

## Read these, in this order

1. `docs/reference/lanes/skyview-ccr-interface.md` — the lane you are picking up.
2. `docs/public_pages_a11y_lessons.md`, last two sections — the sweep, its
   backlog, and why six of its first findings were the harness.
3. `docs/ccr_atlas_lessons.md`, last two sections — SkyView's item 2 and the top
   row.
4. `scripts/a11y.js`'s header — it is the instrument's contract.

## Your priority: Sam's SkyView items 6-9

These are one job, not four, and they are an information-architecture decision
more than a coding one — stay single-threaded:

- **6.** Consolidate "All disciplines" and "Disciplines as a list" into ONE tab
  with a toggle for **view by subject** vs **view by discipline**, and a line
  explaining the difference. ⚠️ **His "subject" is the SUBJ4 grain** (`ENGL`,
  `WELD` — COBI's Common Subjects Reference tab), not the island. Today both
  views show disciplines, so this ADDS a grain rather than renaming one.
- **7.** Fold **ESL packaging** into that view rather than leaving it a door.
- **8.** Put the **map** on the same tab, "so there are fewer places to click
  around and get confused."
- **9.** Every view reachable from every other — the `Views` menu shipped in
  #1476 exists only on the map; it needs to ride all of them.

## Carryover, with status

- **BLOCKED on Sam — the absence color.** A new `--text-quiet` at `#6B6B66`
  (4.89:1 worst-case, measured against the worst ground in use) versus plain
  `--text-muted`. It unblocks ~4,000 renders. It is in the To-Do feed.
- **The a11y backlog, named rather than hidden:** 5 COBI tabs scroll sideways at
  390px (Dashboard by 887px, then `raci` 392, `budget` 218, `memory` 203,
  `activities-projects` 179); 18 tabs carry 86 sub-AA pairs; 4,042 sub-24px
  targets are **54 selectors**, 2,200 of them `button.cr-title-toggle` alone.
  Several sit in sections the daily generator owns — fix `excel_to_dashboard.py`,
  not the HTML (Rule 1). **Start with the sideways scroll.**
- **Queued, unstarted:** the mute-non-essential-labels toggle and the
  resizable/pop-out detail panel (Sam's earlier SkyView list); config-to-tables
  (`ORGS` in `cobi_orgs.js`, the alpha-banner copy); the dependency map's
  line-number churn.
- **LANDED FROM A PARALLEL SESSION — #1475, the stop-hook nag is fixed.** Sam
  teleported a second session into the cloud on 2026-09-04; it shipped this one
  while S227 was finishing above, so it appears in no S227 narrative. **The
  "There are N unpushed commit(s) on branch `claude/...`" nag is gone**, and
  CLAUDE.md's troubleshooting stanza now says *fixed* rather than *ignore this*.
  Two faults, both measured: the environment manager creates a LOCAL
  `refs/remotes/origin/claude/<slug>` pinned at the session's STARTING commit for
  a branch that never existed on GitHub, so `origin/<branch>..HEAD` counted 1
  where `HEAD --not --remotes` correctly counts 0; and ⭐ **the Session-32 guard
  that already handled this had never once run in a remote session**, because the
  harness provisions its own `~/.claude/stop-hook-git-check.sh` over ours. So a
  SessionStart hook now PATCHES the installed file
  (`scripts/patch_stop_hook.py`) rather than overwriting it — theirs carries
  SSH-signature detection ours lacks. ⚠️ **Do not test this against
  `scripts/stop-hook-git-check.sh`**: that copy's ancestor guard masks the case,
  so such a test passes with or without the fix. `tests/stop_hook_git_check_test.py`
  uses a vendor-shaped hook and is wired as its own step in `js-tests.yml`. Full
  mechanism: `docs/reference/troubleshooting.md`.

## Patterns that worked

- **Run the instrument on your own change, in the same session.** It caught a
  21.3px control written minutes earlier, twice in two days.
- **Cluster findings by rendered VALUE, not by file.** 4,042 → 54.
- **Fix one real defect early and re-run.** A finding that does not clear when
  its cause is removed is a harness defect — cheaper to catch on purpose than to
  discover by "fixing" a passing control.

## Safety patterns to honor

- ⚠️ **Regenerate the dependency map AFTER `git add`.** It enumerates with
  `git ls-files`, so an untracked new module is silently omitted and the check
  fires on the NEXT run as an unexplained stale map.
- ⚠️ **`docs/INDEX.md` and `docs/catalog/` are GENERATED.** Hand-editing them is
  a red check; run `python3 kb/_build_docs_index.py`.
- ⚠️ **Never background `npm run test:floor`** — it writes the floor whenever it
  finishes, including partway through. Add a single entry by hand instead.
- ⚠️ **`package-lock.json` is gitignored**, so CI resolves ranges live. Both deps
  are pinned exactly; never widen one back to a range.
- ⚠️ **A red run whose failure names a PACKAGE rather than a test is almost never
  the PR's** — check the base branch before debugging your own diff.
- ⚠️ **Three sources report your context and they disagree; only one is the
  instrument.** On 2026-09-05 the control plane's `context_usage` read 776,304
  used and was FROZEN (identical to the digit across three reads while
  `updated_at` moved); Sam's UI showed ~449k; `python3 kb/_context_budget.py`,
  which Rule 9a names as the source of truth because it reads the transcript on
  disk, said **598,686 used / 187,603 left**. Act on the instrument. A frozen
  API field failing in the alarming direction cost a mid-session scramble.

## Next concrete step

Open `prototype/ccr_universe.js` and `prototype/ccr_atlas_v1.html`, and sketch
items 6-9 as ONE view with a subject ⇄ discipline toggle before writing any of
it — the grain question (SUBJ4 vs discipline) decides the whole shape, and
getting it wrong costs the rebuild twice.
