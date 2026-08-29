---
title: Session 207 handoff — from SkyCrush (Session 206, the CLAUDE.md consolidation)
created: 2026-08-28
updated: 2026-08-29
tags: [handoff, session-207, claude-md, docs-corpus, cpl-memory, context]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 207

SkyCrush here. Session 206 executed the consolidation Sessions 203 and 204
scoped in parallel, then two follow-ups Sam asked for. **All five PRs are
merged.** `CLAUDE.md` **151,484 B → 58,373 B** with nothing deleted, and
`npm test` **20.7 min → 6 min 55 s in CI**, nothing skipped.

| PR | |
|---|---|
| **#1381** | §11's 29 lane cells → `docs/reference/lanes/`; `stacked_roadmap_cell` repaired; `docs/reference/**` indexed for the first time (0 → 37) |
| **#1382** | the assignment rule, into `CLAUDE.md` **and** `.claude/commands/checkpoint.md` |
| **#1383** | checkpoint · the three broken pointers · the presentation-rules section + `presentation_doctrine` |
| **#1384** | concurrent test runner + `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` |
| **CPLBrain#35** | vault session note |

⚠️ **Numbering:** 205 and 206 were written by two sessions running in parallel
and are peers. This one supersedes both — but read them if you touch the Funding
lane (206) or the docs corpus (205).

## The rule you are now working under

> **PUSH what a session cannot know to ask for. PULL everything else.**
> — Sam, 2026-08-28

It is the second thing in `CLAUDE.md` now, and it decides where anything goes.

- **§11 is a POINTER INDEX.** Each lane's detail is in
  [`docs/reference/lanes/<lane>.md`](reference/lanes/). **At checkpoint you
  update the LANE FILE**, not the row; the row moves only when the lane's
  *state* changes. `.claude/commands/checkpoint.md` step 1 spells this out.
- ⚠️ **Do not re-inflate a cell.** `oversized_doc` will flag the regression, and
  the new `roadmap_lane` budget (12,000 B) watches the lane files.

## What shipped

| | |
|---|---|
| **#1381** | 29 lane cells + the `1c` audit-rule detail + Obsidian wiring → `docs/reference/`; guard repaired; `roadmap_lane` budget; the reference lane added to the docs index |
| **#1382** | the assignment rule into `CLAUDE.md` + `checkpoint.md`; branch policy 8,227 → 3,304 B and Engineering & UI 6,072 → 2,940 B, evidence to `docs/reference/` |

Everything relocated was verified byte-for-byte against the pre-change file.

## ⚠️ Corrections — check claims, do not inherit them

1. **The "5 rows / 14,379 B retirable with no judgment calls" measurement in
   `session_206_handoff.md` was wrong.** Read per-row, **four of the five carry
   an explicit `NEXT` or `Open` list in their own text** (NC / Learning
   Partners, Partner crosswalks, Governance & team enablement, Sierra: false
   absences), and the fifth (Disposition grain) holds load-bearing *invariants*
   rather than finished history. **Nothing was retired.** Handoff 205 had
   predicted this exactly. The test is now written into the §11 preamble: no
   `NEXT`, no `NEEDS SAM`, no `BLOCKED` in the row's own text.
2. **`cpl_memory.scope` is set on 68 of 652 rows, not 4 of 646** — and it cannot
   answer "global or lane-local" anyway. See below.

## The four things worth carrying forward

1. **A guard keyed to a file path stops guarding the moment content moves, and
   the diff looks like progress.** Three instances this session:
   `stacked_roadmap_cell` hard-coded `rel == "CLAUDE.md"`; and
   **`docs/reference/**` had never been indexed at all** because every lane in
   `_build_docs_index.py` globs `docs/*.md`, which is *flat* — so the pare-down
   files `CLAUDE.md` itself tells sessions to read had never once appeared in
   the corpus index (0 → 37). **Re-point the guard in the same commit as the
   move, then re-run it.**
2. **A row a checker cannot parse is skipped, so the worst rows are invisible.**
   The rule split on a bare `|` and skipped anything with fewer than four — the
   **two largest cells in the live table** exempted themselves that way, one
   missing its trailing pipe (4,930 chars, over the cap) and one carrying
   `` `1|2,3|4` `` inside a code span. **When a validator has a skip branch, ask
   what the skipped population looks like.** It is rarely a random sample.
3. **Two new assertions passed for the wrong reason.** Reverting the parser to
   prove the guard fails showed the *malformed* branch catching inputs written
   for the *size* branch. Tightened to assert both. A guard proven to fail is
   worth more than one that merely passes.
4. **Split a section; do not relocate it whole.** Most are entirely PUSH at the
   level of the rule and almost entirely PULL at the level of the evidence.
   Keeping the rule and moving the evidence made branch policy *shorter and
   clearer* — the rule stopped competing with its own footnotes.

## Shipped after the first handoff was written

Sam asked two things at the end of the session, and both turned into real work.

### 1. "Make sure formatting preferences are preserved and properly prioritized"

He was right to ask. **"PLAIN WORDS, NO GLYPHS" had been in `CLAUDE.md`** —
inside the §11 Admin roadmap row — and the consolidation relocated that row to a
lane file, carrying the rule out of the always-loaded file entirely. Zero
occurrences remained.

⚠️ **That rule had already failed once the same way.** `cpl_memory` row
`a-recorded-rule-is-not-an-applied-rule`: recorded in the memory table on
2026-08-14, and the Admin tab shipped covered in emoji that same week.

New **`## Presentation rules — EVERY view we ship (non-negotiable)`** section:
First Light · accessible (verified, not claimed) · mobile-friendly · no
horizontal scroll · plain words not glyphs · American spelling · full-width
prose. First Light/accessibility/mobile were one bullet and are now three,
because Sam names them as three concerns and a rule buried inside another rule
is weaker. Net reorganization, not addition — `CLAUDE.md` is **59,954 B**.

**`presentation_doctrine` lint** fails if any of them leaves the file. ⚠️ Four
false passes were found while building it, each the shape of the bug it guards:
searching the whole file was satisfied by the section's own *post-mortem* naming
the lost rule; patterns keyed on "NO GLYPHS" missed the bullet's own "NOT
GLYPHS"; bare `accessib`/`mobile-friendly` were satisfied by **Sam's quote inside
the First Light bullet**, so either rule could have been deleted in full; and the
synthetic fixture passed while the live file failed, because the fixture had no
quotation in it. **The suite now runs the check against the real `CLAUDE.md`**,
deleting each live bullet in turn and asserting exactly one topic is reported.

⭐ **Where formatting rules should live — the answer, since it comes up.**
`CLAUDE.md` is the *high-priority* store for these, not `cpl_memory`. Four
formatting rulings are already in `cpl_memory` and `verified`
(`artifacts-use-first-light-accessible-and-mobile`, `sam-american-spelling-always`,
`sam-full-width-prose-throughout-cobi`, `sam-eacr-defaults-and-a11y-standing`) —
**and the glyph rule still shipped broken.** Memory is the record, not the
enforcement: ~21% of verified rows fit the briefing budget, so a rule there can
be present and silently unread. The escalation that works is
**always-loaded → lint → CI**, and two already run (`american_spelling`,
`prototype/check_contrast.py --live`).
⚠️ **Do NOT build an emoji lint over the UI JS.** The codebase deliberately uses
emoji in places Sam approved (the 📋 To-Do button, the 🧭 pane, the ⚖️ Governance
tab, all named in `CLAUDE.md`), so it would need an allowlist and would emit
findings nobody can action — the unactionable-findings failure Session 204
already fixed once.

### 2. "Is there anything I can safely do about the npm test?"

Measured rather than guessed. **Every file timed individually: 280 files,
1,245s (20.7 min).** `cpl_funding_*` is **28 files and 967s — 78%**; everything
else is 252 files in 277s; the median file is 1.1s.

- **`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1`** in the workflow. `playwright` is a
  RUNTIME dependency but **nothing under `tests/` requires it** — only the
  browser-check scripts, which are deliberately outside `npm test`. CI was
  downloading three browsers on every run for a suite that never launches one.
- **`tests/run.js` runs files concurrently**, each still in its own process.
  ⚠️ **My first design was wrong and the measurement killed it:** "serialize the
  heavy family, parallelize the rest" is bounded at 967s *no matter how many
  workers you add*. The heavy files ARE the suite, so they have to run together
  — which makes memory the constraint, not scheduling.
- **Peak RSS, polled:** `cpl_funding_render` **3,825 MB** (a lone outlier), the
  rest of the family ~2,100 MB, a typical file 258 MB. ⚠️ Modeling this as
  `N × worst-file` said 3 concurrent needed 11.5 GB and forced the cap to 2;
  running the three heaviest together measured **6,187 MB**, because peaks do
  not coincide. The cap is derived from `os.totalmem()` — 4 on a 16 GB runner,
  degrading to 2 or 1 on a smaller box — and `TEST_CONCURRENCY` overrides it.
- ⚠️ **A pool would have printed nothing until the end** — losing progress, and
  printing *nothing at all* on a hang. It is a limiter, not a pool: every file
  gets its promise up front so the reporting loop awaits them in alphabetical
  order and the log streams in the same sequence as the serial runner's.
- `tests/lib/limiter.js` + `tests/limiter.test.js` (9 checks). ⚠️ An unresolved
  promise does **not** keep Node alive, so a deadlock originally **exited 0** —
  a silent pass for the exact bug the file exists to catch. Every wait is
  time-bounded and the check total is asserted.

⚠️ **Three more bugs surfaced only in full end-to-end runs, all mine, and each
symptom named the wrong thing.** Targeted tests were green throughout.

1. **PIPES TRUNCATE.** `console.log` to a pipe is asynchronous, so a child
   ending in `process.exit()` discards whatever is still buffered. `spawnSync`
   never saw it — the parent was blocked, the OS pipe filled, and the child
   blocked on write rather than getting ahead. Measured on a child printing
   20,000 lines then exiting: **pipe delivered 3,179, a file descriptor
   delivered 20,000.** It surfaced as `cip_crosswalk.test.js` reporting 178 of
   354 assertions, which the check-ledger called *"176 checks stopped running"*
   — the signal that is supposed to mean a rule was silently disabled. Every
   assertion had run. Children write to a temp file now.
2. **`node --check` PARSES; it does not resolve references.** A rewrite deleted
   the limiter's `require`, `--check` stayed green, and the runner died at
   startup having run **zero** tests. A parse check is not a smoke test.
3. **`check_ledger.test.js` copies the runner into a fixture with a HAND-LISTED
   set of `lib/` dependencies**, which did not include the new `lib/limiter.js`.
   The copied runner died on `MODULE_NOT_FOUND`, surfacing as four failing
   ledger assertions rather than "the fixture is missing a file". It copies the
   whole directory now — a dependency list inside a test is a second copy of
   `run.js`'s requires and will drift again.

✅ **CI confirmed the speedup, and my worry that it would not was wrong.** The
GitHub run executed all 282 files in **~8.5 minutes including `npm install`**
(against 20.7 min serial), failing only on bug 3 above. `cip_crosswalk` passed
there too, which independently confirms the file-descriptor fix off this
sandbox. The runner now prints its chosen width and the machine's RAM as its
first line, because a slow CI run was otherwise indistinguishable from a serial
one. **Next lever if more speed is wanted:** `cpl_funding_render` is 3,825 MB
against ~2,100 MB for the rest of the family and alone forces the conservative
cap — splitting it is the documented fix, with precedent.

## Your queue

1. **Retire the lanes that genuinely are finished.** A per-row read of all 29
   against the written test. This is a real worklist; the old five were not it.
   ⚠️ Read the lane file — **do not grep for a ✅**.
2. **`cpl_memory.scope` — Sam's call, do not write it.** Measured: 68 of 652
   rows, **uncontrolled vocabulary** (`project` 30, `funding` 9, `cpl-funding` 6,
   `global` 5, `cpl` 5, `sierra` 5, `ccr` 4, `engineering` 2, …). `funding`/
   `cpl-funding` and `global`/`engineering` are one intent spelled twice, and
   **25 of the 68 values are literally repeated in the row's own `tags`**. It
   conflates *where a learning was found* with *how far it applies* — generic
   methodology sits under `funding` because that is the lane it surfaced in.
   **Recommendation: make `scope` a two-value controlled axis — `global` vs
   `lane-local` — and let `tags` keep carrying topic.** That is the minimum that
   answers the question without duplicating `tags`. 68 rows need remapping, 584
   are null. Sam's standing rule: *"If we need to add to a supabase table,
   recommend."*
3. **`Critical Rules` is now 22,894 B of a 58,108 B file (39%)** and Rule 7's
   M-ID structural invariants are the bulk of it. Arguably PULL — you read them
   when you are re-minting, which you know you are doing. Not touched this run
   because the file is already under budget; worth a look if it creeps back.
4. **Carryover from 205, untouched:** the 5 British-form *filenames*,
   `docs/roadmap_archive.md` at 3.45× (decide whether the `other` budget is
   simply wrong for an archive lane — it grew again this run), `vault_heavy_path`
   (45; a Windows-side sparse-checkout action for Sam), and the two public-KB
   recommendations awaiting Sam's go.

## Patterns that worked

- **Re-measure the inherited number before acting on it.** Ten minutes of
  per-row reading turned "5 retirable rows" into "0" and saved retiring four
  lanes with live work in them.
- **Break the guard on purpose and watch it fail.** It caught two assertions
  that were passing for the wrong reason.
- **Verify the relocation, do not assert it.** Every moved block was diffed
  byte-for-byte against the pre-change file, and the non-table lines were
  diffed to prove nothing else moved.
- **Read the memory table first** (Rule 8). It is also how the `scope` finding
  surfaced — the column's live contents contradicted the plan built on it.

## Safety patterns to honor

- Never force-push `main`. Merge on `clean` **or** `unstable`.
- A `check_suite` wake names a routinely superseded `head_sha` — re-read
  `get_check_runs` on the current head.
- **Ask before writing a shared artifact another live session owns.** Sam runs
  several sessions; a later write silently wins. Check open PRs first — this run
  did, and found only dependabot.
- Sam, 2026-08-28: *"If we need to add to a supabase table, recommend."*

## Moniker

**SkyCrush**, given by Sam at the start of the run. Yours is open.

**Next is Session 208 — `docs/session_208_handoff.md`.**

---

## ⚠️ The probes: you are the EXPERIMENTER, not the subject

Sam asked the sharp question that reframes this whole lane:

> *"Can your handoff set up the next session to check our scenarios against
> rules only rather than cueing up the next session with cheater context?"*

He is right that a handoff-fed session cannot test the rules — **and you are a
handoff-fed session.** By the time you read this you know about `presentation_
doctrine`, the assignment rule, Rule 9a and the six scenarios. Your answers to
them are worth nothing as evidence.

So **do not answer the scenarios yourself.** Your job is to run them on sessions
that have not read this file.

**The protocol is committed:** [`docs/scenarios/README.md`](scenarios/README.md).
The short version:

| Role | Gets | Job |
|---|---|---|
| **You** | this handoff, full context | spawn probes, score them, fix what fails |
| **Probe** | `CLAUDE.md` (auto-loads anyway) + one realistic prompt | just does the task |

`CLAUDE.md` is the honest control — it is what every session gets for free.

**Run them in this order, and do not skip step 0:**

0. **Read [`docs/scenarios/rubric.md`](scenarios/rubric.md) and do not edit it.**
   It was committed *before* any probe ran, precisely so the scorer (you, or me,
   equally contaminated) cannot retrofit expectations to results. It also carries
   SkyCrush's advance predictions — clearly marked as **not criteria**. If a
   result contradicts a prediction, the prediction was wrong; the rubric stands.
1. Spawn one fresh session per probe, pasting **only** the quoted block from
   `docs/scenarios/probes/<p>.md`. One probe per session — a probe asked two
   scenarios learns from the first.
2. Score HIT/MISS against the rubric. Record the session id.
3. **Report holes, not a score.** A pass is weak evidence (a capable session
   reaches good behavior without the rule); a fail is strong evidence. "5/6
   passed" is not a coverage number and must not be written as one.

**P6 needs the repo staged** so `checkpoint_overdue` genuinely fires — verify
with `python3 kb/_docs_audit.py` before running it, or it measures nothing.

Two scenarios are **not probeable cold** and that is recorded, not hidden:
context pressure at 600K (a fresh session has none — handled mechanically
instead, below) and sign-out staleness (probeable only via the staged repo).

## Rule 9a — the compact warning (INSTALL IT, it is inert until you do)

We auto-compacted at **786,077 tokens** with the checkpoint 150K stale. Rule 9's
trigger had said Claude Code *"doesn't expose an exact counter; use proxies."*
**That premise was false.** The exact counter is in the session transcript every
turn, and `compactMetadata.preTokens` records every compaction.

- `kb/_context_budget.py` — reads it in ~50 ms, self-calibrates its ceiling from
  compactions the transcript has actually seen. Run it any time.
- `scripts/context-pressure-hook.sh` — PostToolUse hook so it fires unprompted.
  **Install like the stop-hook:** `cp scripts/context-pressure-hook.sh ~/.claude/
  && chmod +x ~/.claude/context-pressure-hook.sh`, then register it as a
  `PostToolUse` hook in `~/.claude/settings.json`.
- **WARN ≤110,000 left** → finish the thought, full `/checkpoint`, tell Sam the
  number. **EMERGENCY ≤50,000** → reduced checkpoint, no permission-asking.

Thresholds are a **sum of measured costs**, not a round multiple: a checkpoint
cost 49,723 and the worst single turn 50,425. The first draft used "2×
checkpoint" = 100,000 and its own test caught it — short by 336 tokens. Replayed
against the real failure it warns **10 human turns** early and stays quiet at
633,409 where Sam had just checkpointed. Story:
[`methodology-context-pressure-is-measurable`](kb-notes/methodology-context-pressure-is-measurable.md).

⚠️ **Do not "verify" the meter by trusting this handoff.** Run
`python3 kb/_context_budget.py` on your own session — it should report your live
context. If it reports something implausible, the calibration is wrong and the
warning is worse than none.
