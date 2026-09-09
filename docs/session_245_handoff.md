---
title: "Session 245 handoff — one control where there were four, and a remediation pass with a 516-item backlog"
created: 2026-09-09
updated: 2026-09-09
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 245

Your moniker is **SkyPlain**. The name is the job: the next real work is *plain
words, not glyphs* — a 516-item control-class backlog with a tool already built
to work it. Predecessors: SkyTrue S242 → SkyGate S243 → **SkyExit S244** (this
run).

## What this run did

One PR, [#1523](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1523),
six commits, two workstreams — on one branch because the session was pinned to
`claude/cobi-header-dark-mode-1g4cu4`.

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **A USER-VISIBLE INCONSISTENCY IS OFTEN SEVERAL MECHANISMS, NOT ONE BUG.**
   Sam asked for a dark mode selector that *"sets all tabs and windows using that
   one control"*. COBI had **four** independent answers to "is it dark":
   `cpl_memory.js` had its own button that wrote `data-theme` and **persisted
   nothing**; two tabs were already correct; `our_process.js` keyed on
   `@media (prefers-color-scheme:dark)` **alone**, so it followed the OS and
   could not be told otherwise. He could only see that the theme did not behave
   like one setting. **"That one control" was a diagnosis, not just a
   requirement.**
2. ⭐ **A TOKEN WITH TWO JOBS CANNOT BE THEMED — COUNT USES BY *ROLE* FIRST.**
   The invisible wordmark invites flipping `--seal-blue` to its on-dark grade.
   Measured: **266 uses, mostly BACKGROUND fills carrying white text, against 48
   text uses.** Flipping fixes the one element you can see and turns 200+ fills
   into white-on-`#7DA1D4` at 2.3:1. Split `--seal-blue-text` instead — the
   pattern the palette already had for mustard.
   [`methodology-a-token-with-two-jobs-cannot-be-themed`](kb-notes/methodology-a-token-with-two-jobs-cannot-be-themed.md)
3. ⭐ **THE NUMBER OF FINDINGS IS NOT THE NUMBER OF PROBLEMS.** The first dark
   sweep was 38/38 routes and **511 findings — ~227 of them six shared-chrome
   selectors.** Reading the report top to bottom fixes the 38th-most-important
   thing first, which is exactly what happened by hand.
   [`methodology-the-number-of-findings-is-not-the-number-of-problems`](kb-notes/methodology-the-number-of-findings-is-not-the-number-of-problems.md)
4. ⚠️ **FIXING THE RULE YOU FOUND IS NOT FIXING THE RULE THAT APPLIES.**
   `.cpl-tab {color:#666}` was corrected and the sweep still said 1.74:1 on all
   38 tabs — `.cpl-sidebar .cpl-tab {color:#444}` is more specific and is what
   paints the rail. Grep for **every** rule setting the property.
5. ⚠️ **A HIT COUNT ABOVE YOUR ESTIMATE IS A BUG IN THE PATTERN, NOT A WINDFALL.**
   The token-split regex rewrote **20 border declarations** because `color:` also
   ends `border-color:`; and text on an explicit fill (the mustard chip,
   `background:#fff` cells) is not text on the ground. Both reverted.
6. ⚠️ **A MEMO KEYED ON THE WRONG THING IS A FEATURE THAT DOES NOTHING.**
   `islandPass` caches on the Show-switch signature; Isolate changes what passes
   **without touching a switch**, so the map would not have changed at all.
   Reverting the signature reproduces it (`shown=3 of 3`).
7. ⚠️ **`scripts/check_generated.sh` SAYS "RUN IT LAST" AND MEANS IT.** CI failed
   on `dependency map is STALE`. Not a flake — the builder is deterministic. I
   ran the check, then kept editing. **Verifying before your last edit is the
   same as not verifying.**

## The state of the two workstreams

**Dark mode — shipped and measured.** `cpl_theme.js` is the single owner: a
Theme selector (System · Light · Dark) in the masthead, `localStorage`
`cpl_theme`, `data-theme` on `<html>`, a `storage` listener so other windows
follow, loaded in `<head>` and render-blocking so a dark reader gets no white
flash. **Dark 38 → 26 routes; light 19 → 17** (improved, not regressed). SkyView
follows the same key as a **fallback, never an override**, so Sam's "Night by
default" ruling still owns the default.
[lane](reference/lanes/cobi-dark-mode.md)

**SkyView — Sam's five, all in.** Rotation `SPIN` 0.045→0.018; a dropped course
**parks** (world frame, because a member has no position of its own); courses
gather by level **within** the ring score already chose (**19.9% closer**, and
only 12% of points carry a level word); **CTE vs academic** as three switches
(25,857 · 16,470 · **7,569 with no verdict**); an **Isolate** toggle.
[lane](reference/lanes/skyview-ccr-interface.md)

## YOUR PRIORITY

1. ⭐ **THE GLYPH REMEDIATION — BUILT, TESTED, NOT RUN, AND SAM HAS NOT SAID GO.**
   `python3 kb/_glyph_sweep.py --apply` rewrites the **516 control-class** glyphs
   of a 1,549 baseline across 139 files. It is the first real execution of
   [`/a11y-pass`](../.claude/commands/a11y-pass.md) and deserves the full loop:
   apply → `npm test` → `npm run a11y cobi` **and** `cobi-dark` → record the
   delta in the lane. ⚠️ **Do not start it without his go** — it was offered and
   he has not answered. ⚠️ And it only touches the control class; **status (225)
   and decoration (808) need reworded sentences and judgment about legends.**
2. **The rest of the a11y backlog, through the triage tool, not by reading the
   report.** `npm run a11y cobi-dark > /tmp/d.txt && node scripts/a11y_triage.js
   /tmp/d.txt`. Named remainder in the lane: **25 `--cobalt` fills pair with a
   literal white** in the same declaration (2.65:1 in dark), out of 59 `--cobalt`
   backgrounds to review on COBI's own surfaces — ⚠️ **S244's handoff first said
   ~140; that was measured with a looser pattern over a wider file set and is
   corrected in the lane.** Mechanical, and still the largest single source left; hard-coded light fills inside
   generator-emitted panes (Rule 1: fix `excel_to_dashboard.py`, never the HTML);
   canvases that are light-only by construction (`ctx.fillStyle` ignores `var()`).
3. **`docs/reference/lanes/skyview-ccr-interface.md` is 2.5× its budget** and the
   lint says so every run. It is invariants, not stacked history, so the
   compaction is a real read-and-rule pass — several invariants predate rulings
   that superseded them. Worth its own sitting; do not keep appending.
4. **`CLAUDE.md` is 263 bytes over its 60,000 budget.** It was at 59,674 (99.5%
   full) when this run started and this run added a lane row, a doctrine
   supersession and a procedure pointer — trimmed from +1,653 to +589 net, with
   two pull-shaped blocks moved to the new `docs/reference/lanes/README.md`. The
   next structural room is §11's maintenance blockquote.
5. Carryover from S244's handoff, untouched by this run: **the Title 5 rename**
   (ruled, not built — 8 MQ names carrying a section number, 1,183 occurrences
   across 33 files, needs a dry-run and a receipt), **ENVS's retire half**, **the
   curator pass on the 86 blanks** (*"be more aggressive"*), and **PHTO's twelve
   mis-filed courses**.

## DECISIONS SAM MADE THIS RUN

- **A dark mode selector in the COBI header**, and it *"sets all tabs and windows
  using that one control"* (2026-09-09).
- **SkyView's header is the reference for COBI's** — *"I like how simple the
  SkyView header looks. So that's a good example."* ⭐ This closes a loop: on
  2026-09-05 he named Obsidian's canvas controls and Claude's own header as the
  reference **for SkyView's**. The lineage is Obsidian/Claude → SkyView → COBI.
- **The five SkyView items** (rotation, no snap-back, level proximity, CTE
  switches, Isolate), verbatim in the braindump.
- ⚠️ **"Remove all emoji glyphs and if any are crucial replace with a muted glyph
  using white and CO blue as default. If color is needed to clarify, keep it
  muted and aligned with the CO palette."** Read as **superseding the three named
  glyph exceptions** (📋 To-Do, 🧭 guidance, ⚖️ Governance), recorded on the
  exceptions line itself. **He has not confirmed that reading** — if he meant to
  keep those three, restore the carve-out.
- **A standing procedure** that *"checks and remediates each COBI surface for AA
  and mobile friendly standards"*.

## NEEDS SAM

① **Go / no-go on the 516-glyph remediation run.**
② **Did "remove all emoji glyphs" mean the 📋/🧭/⚖️ trio too?** (assumed yes)
③ The SkyView theme fallback ordering — his own choice, worth a veto.
④–⑨ Carried from S244 unanswered: agency skill statements when sources
disagree; which disciplines are grab bags; the three legacy anchors with no seed
discipline; whether 60 is the right search depth; the right-edge glyph rail; his
eye on the CPL face, the Sky's frame rate, and the live-session banner.

## Read these, in this order

1. This file.
2. [`/a11y-pass`](../.claude/commands/a11y-pass.md) — the procedure, before any
   accessibility work.
3. `docs/reference/lanes/cobi-dark-mode.md` — the measured remainder.
4. `docs/ccr_atlas_lessons.md`, the 2026-09-09 section.

## Safety patterns to honor

- ⚠️ **`./scripts/check_generated.sh` LAST before every push** — after your final
  edit, not before it. This run lost a CI cycle to exactly that.
- ⚠️ **A BOT PUSHES `[skip ci]` COMMITS ONTO YOUR BRANCH.** `first-light-art.yml`
  did it seconds after this PR opened, and CI never fired at all until the next
  real commit. Check `head_sha` against the PR head before trusting a green
  check; the fix is your next real commit, never an empty one.
- ⚠️ **Never edit a file while a sweep or suite is reading it.**
- ⚠️ **`npm test` proves NOTHING about layout** — jsdom returns zeroes for every
  rectangle. Run `npm run a11y <target>`.
- ⚠️ **Verify a guard by REVERTING its fix**, check by check. Every new guard
  this run was.
- ⚠️ **Count a token's uses by ROLE before theming it** — `color` vs `background`
  vs `border`.
- Never force-push `main` (Rule 5). Squash-merge on a green `test` whose
  `head_sha` matches the PR head.

---

Greetings, you are SkyPlain (Session 245), see SkyExit's handoff —
`docs/session_245_handoff.md` — let's keep rolling with our queue.
