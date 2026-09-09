---
title: "Session 249 handoff — four kinds of token that cannot flip, and a fifth theme control nobody could grep for"
created: 2026-09-09
updated: 2026-09-09
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 249

Your moniker is **SkyGround**. The name is the job: this run's every finding was
a *surface* that could not change — a ground, a fill, a palette — while the ink
on it moved.

⚠️ **Two sessions ran in parallel on 2026-09-09.** SkyLedger wrote handoff 248
(SkyView on a phone); this run — **SkyTouch** — took the dark-mode remainder and
touched no `prototype/` file, so the two do not collide. Sam said so explicitly
mid-run.

## What this run did

One PR, **[#1534](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1534)**
(draft, watched). Sam's ask, then three screenshots: *"the remaining COBI
surfaces that are still not responsive to dark mode … and there are many more."*

**Dark 128 → 87 contrast findings (−32%), 26 → 20 failing routes. Light 63 → 62,
18 → 18 routes. `npm test` 321/321.**

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **THE REMAINDER WAS NOT RAW HEXES — IT WAS FOUR SHAPES OF TOKEN THAT
   CANNOT FLIP,** and every one reads as correct, tokenized code. That is why
   three sessions of sweeping left so much behind. Full note:
   **[`methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme`](kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme.md)**
   — read it before theming anything.
2. ⭐ **THE BIGGEST CAUSE WAS A TOKEN THAT DID NOT EXIST.** `--surface-1` /
   `--surface-2`: 26 references, zero definitions, **19 of 128** findings.
   Found by a *structural scan* (collect every `--x:`, collect every
   `var(--x, …)`, subtract) in about a second, with no browser. **25 phantom
   color tokens / 83 uses remain** — now all inks and accents, no grounds.
3. ⭐ **COUNT A TOKEN'S USES BY ROLE BEFORE YOU DECIDE.** `--navy-primary` is
   **551 INK vs 26 FILL** (flipping it was right); `--seal-blue` is **65 FILL vs
   20 INK** (which is why this repo refuses to flip it). Same question, opposite
   answers, and only the count tells you which.
4. ⚠️ **A SEARCH FOR KNOWN SPELLINGS CANNOT FIND AN UNKNOWN ONE.**
   `cip_crosswalk.js` was a **fifth** answer to "is it dark" — own button, own
   key, 108 grounds on its own **class** — and it survived four rounds because
   it used neither `data-theme` nor `prefers-color-scheme`. The durable fix is a
   behavioral invariant, not a better grep: *no tab may persist a theme of its
   own.*
5. ⚠️ **THE SWEEP UNDER-REPORTS.** Annual Report showed **2** findings with both
   panes white — content built on demand is not sampled. Sweep and structural
   scan are complements. Fix what the **sweep** names; size the rest with the
   scan.
6. ⚠️ **VERIFY A SCREENSHOT AGAINST `main` BEFORE CHASING IT.** Sam's third was
   already fixed five commits earlier — a **cached asset**, settled by
   `git merge-base --is-ancestor` in two minutes. The sandbox cannot reach the
   Pages site (proxy 403), so check git, never the URL.

## ⚠️ WHAT I GOT WRONG — the useful part

- **Both pairing guards could not fire**, and so could the fix for them. They
  required `color:` immediately after `background:`, in that order; every real
  defect broke that. Rewritten as a block parser — then the "outermost `var()`"
  refinement returned a bare token name while the regexes matched on `var(--`,
  killing both again. **Caught only by reverting each fix and watching the suite
  stay green.** Third session running to find this shape.
- **`git checkout <file>` discarded three of my own uncommitted fixes** while
  falsifying guards. Back up with `cp`, restore from the copy.
- **My falsification harness miscounted** — `count("\nFAIL")` misses a FAIL on
  line 1, which is where the Rule-4 check prints. Use `grep -cE "^FAIL"`.
- **I hand-typed a print palette and guessed `--crimson` wrong** (`#920000`, not
  what I typed). Never retype a palette; derive it or narrow the change.

## Read in this order

1. This file.
2. ⭐ [`kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme`](kb-notes/methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme.md)
3. [`reference/lanes/cobi-dark-mode.md`](reference/lanes/cobi-dark-mode.md) — state-only, 12.2 KB.
4. [`cobi_lessons.md`](cobi_lessons.md) — this run's section at the end.
5. [`/a11y-pass`](../.claude/commands/a11y-pass.md) before any accessibility work.

## Open — what to pick up

**NEEDS SAM (two, both design calls, neither blocking):**
1. **Should `--surface-1`/`--surface-2` get LIGHT values too?** It unifies six
   tabs' blue/cream tints into one warm grey — a restyle, not a fix. Today they
   are dark-only and light is untouched.
2. **The `--text-faint` sites on Implementation Funding** (6 findings, ~12
   sites: `cplfund-src`, `-card-note`, `-goal-cite`, `-foot`, `-repnote`,
   `-saving`). `--text-muted` is the fix (3.87:1 → 6.9:1) but it changes his tab
   in light too. S245 did this pass everywhere else and excluded the tab.

**THEN, in order:** the raw dark inks the sweep names (`#666666` 8 · `#374151` 6
· `#5A6478` 4 · `#555555` 3) · the 25 remaining phantom tokens · **printing
while in dark mode** (the masthead is fixed; consumer-JS dark rules still apply
to a print, so it is dark-on-dark in places — needs `@media screen` scoping on
every dark rule, a real pass).

**Carryover, untouched:** the Title 5 rename (1,183 occurrences / 33 files),
ENVS's retire half, the curator pass on the 86 blanks, PHTO's twelve mis-filed
courses, and handoff 248's SkyView queue (that lane is another session's).

## Patterns that worked

- **A structural scan beside the sweep.** One found the largest cause in a
  second; the other proved it fixed. Neither alone would have.
- **Measure the baseline on a clean worktree.** `git worktree add` + a symlinked
  `node_modules` gives a before-number in two minutes, which turns "no
  regression" from an inference into a measurement.
- **Predict the win, then check the measurement against it.** 128 → 109 after
  one token confirmed the diagnosis before forty more edits rode on it.

## Safety patterns honored

Rule 1 — the funding table's fills changed in `excel_to_dashboard.py`, not only
in the HTML. Rule 4 holds (`diff -q` clean after every edit). Dependency map
regenerated and `--check` clean; `./scripts/check_generated.sh` all green
(`openpyxl` had to be `pip install`ed for the worklist check to run at all).
Every new guard verified by reverting its own fix. No `prototype/` file touched.
No Supabase writes beyond `cpl_memory`.

⚠️ **`CLAUDE.md` is at 59,995 of 60,000 bytes.** Anything you add there has to
come out of something else.

---

Greetings, you are SkyGround (Session 249), see SkyTouch's handoff —
`docs/session_249_handoff.md` — let's keep rolling with our queue.
