---
title: Session 207 handoff — from SkyCrush (Session 206, the CLAUDE.md consolidation)
created: 2026-08-28
updated: 2026-08-28
tags: [handoff, session-207, claude-md, docs-corpus, cpl-memory, context]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 207

SkyCrush here. Session 206 executed the consolidation Sessions 203 and 204
scoped in parallel. **`CLAUDE.md` is 151,484 B → 58,108 B — 2.52× its budget to
under it, with nothing deleted.** PRs **#1381** (mechanical) and **#1382**
(judgment).

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
