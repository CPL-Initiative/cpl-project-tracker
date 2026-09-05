---
title: "Session 230 handoff — the memory hopper was tested end to end; Sam's sheet replies are the queue"
created: 2026-09-05
updated: 2026-09-05
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 230

Your moniker is **SkyKeep** (assigned by SkyGrain at sign-off, per Sam's
2026-09-03 template): the work in front of you is executing Sam's keep-or-retire
verdicts on the memory table. Predecessors: SkyMint S227 → SkyQuiet S228 →
**SkyGrain S229**.

## What S229 did

Sam's ask: *"test all the unverified memories we have stored … against what we
know is most current knowledge and clear out anything stale."* SkyView's queue
was gated on his reactions, so this was the day's work. One PR, **#1480**.

1. **The memory table has a lint now.** `kb/_memory_audit.py` — twelve
   structural rules (dead paths, dangling pointers, stale stamps, PRs not on
   main, near-duplicates, snapshot claims, null slugs, author aliases,
   human-attributed proposed rows, questions a decision answers), READ-ONLY over
   an export, receipts under `kb/memory_audit/`, 47-check guard in CI. It closes
   the gap governance row DR-19 recorded.
2. **All 527 proposed rows were read against current truth** by thirteen
   read-only auditors, one per workstream, a citation per verdict, the evidence
   spot-checked mechanically (1,150 of 1,240 file quotes found verbatim).
3. **31 rows cleared** (11 stale, 20 superseded with a pointer), one guarded
   statement, before-images in `cpl_memory_log` under actor `SkyGrain S229` and
   in `kb/memory_audit/2026-09-05-receipt.json`.
4. **352 rows corroborated and HELD** for Sam's go — promoting them doubles the
   tab's default list and thins the Briefing.
5. **144 rows on a plain-English decision sheet**:
   `docs/visuals/2026-09-05-memory-audit-verdicts.html` (86 human-sourced, 13
   open direction items, the rest medium confidence).

⭐ **Sam's rulings this run (also in `cpl_memory`, verified by him):** the
OLDER memories are the concern, not the recent ones; a decision sheet reads in
PLAIN ENGLISH because the entries are technical.

## Read these, in this order

1. `docs/reference/lanes/memory-tab.md` — current truth and the NEXT list.
2. `docs/cobi_memory_tab_lessons.md`, the last section — what the lint saw,
   what the read saw, the paging trap, the permission-layer lesson.
3. `docs/kb-notes/methodology-a-memory-table-goes-stale-in-its-claims-not-its-links.md`.
4. `kb/memory_audit/2026-09-05-receipt.json` — `done`, `held_for_sam`,
   `not_written`; the SQL shape is in the lessons section.

## Your priority: Sam's replies

Expect a numbered reply against the sheet. Item 1 is the 352 promotions. Then:

- **Promotions (yes):** for each row in `held_for_sam`, `UPDATE cpl_memory SET
  status='verified', verified_by=<verified_by_if_promoted>, verified_at=now()
  WHERE id=<id> AND status='proposed'`, one `cpl_memory_log` row per write
  (action `verify`, before-image), actor `SkyKeep S230`, in batches of ~60 as one
  statement each. ⚠️ Rule 10: fresh live read first (`updated_at` since the
  receipt), never a delegated write — the permission layer declines a subagent
  or a prepared-SQL dump; the direct statement through the database tool passes.
- **Human-sourced rows (his verdicts):** stale → `status='stale'`, stamps
  cleared; retire → `status='superseded'` + `superseded_by`; verify → as above
  with `verified_by='Sam Lee (sheet, 2026-09-05)'`.
- **Direction items** (questions, wishes, opportunities): close = supersede
  by the decision row he names, or stale; keep = leave proposed.
- **Hygiene item (yes):** fix the 9 dead paths and 8 dangling `related`
  pointers on session rows with a logged `update`; the 2 dangling
  `superseded_by` from 2026-08-30 need his word (one names a vault lane in prose).
- Then re-export, run `python3 kb/_memory_audit.py --from-json <export>`,
  commit the dated report, update the lane file's counts.

## Carryover, with status

- **SkyView** — unchanged from S229's handoff: Sam has not driven the three
  shipped asks; his numbered list is still expected. NEXT ① in that lane is
  decision packs per discipline.
- **BLOCKED on Sam: the absence color** (`--text-quiet` #6B6B66). In the feed.
- **The a11y backlog**, unchanged from S227.
- **Findings the audit surfaced outside its rows** (verify, then fix or file):
  the nightly `map_cleanup_worklist` has lost its P1/P5 classes upstream
  (text keys match 0 rows on the cron-loaded table); the disposition lane file
  quotes pre-promotion figures; `prose_only()` blanks ~92% of `CLAUDE.md`, so the
  spelling lint sees 8% of it.
- **Queued, unstarted:** config-to-tables; the live-session banner; the
  identities-map sheet; the three HOSP anchors' discipline.

## Patterns that worked

- **Lint the structure, read the claims.** The regex pass cleared almost
  nothing; the reading cleared 31 and corroborated 352.
- **Manufactured luck with a cheap check.** Thirteen auditors in parallel,
  every verdict citing a file:line, then a script that opens every cited file
  and looks for the quote before anything is written.
- **Narrow the write to the literal ask when a gate says no.** The 31
  clear-outs were what Sam asked for; the 352 promotions were mine to propose.

## Safety patterns to honor

- ⚠️ **A human-sourced row is never written by a session** (DR-19), even when
  the contradicting source is Sam's own later ruling. Sheet, then his word.
- ⚠️ **Page a slice with `order by (created_at, id)`.** Ties on `created_at`
  duplicate and skip rows on plain offset paging.
- ⚠️ **Never delegate a bulk write**; one statement, keyed on `id`, guarded by
  `status` at write time, one log row per change.
- ⚠️ `docs/INDEX.md` and `docs/catalog/` are GENERATED: `python3 kb/_build_docs_index.py`.
- ⚠️ Regenerate the dependency map AFTER `git add`.
- ⚠️ `package-lock.json` is gitignored; both deps stay pinned exactly.

## Next concrete step

Open the sheet, read Sam's numbered replies, and start with item 1 (the 352
promotions) from `kb/memory_audit/2026-09-05-receipt.json` → `held_for_sam`.
