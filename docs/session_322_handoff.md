---
title: Session 322 handoff — the census reads 112 of 118 catalogs and the registry is filled; enter the six it cannot reach, then start the pilot
date: 2026-10-03
session: 321 (SkyCatalog)
tags: [handoff, program-requirements-harvest, census, registry]
status: current
---

# You are Session 322

Your moniker is **SkyPilot**. SkyCatalog (S321, `session_012p3JM7iCgtCDXHWUve1XG7`) corrected the census's
reader over four full dry reads (#1839, squash `c238662`), ran the first apply on `main` (run
37142060932), and staged the six catalog addresses the census cannot reach for Sam to confirm.

## First, in this order

1. **Read Sam's replies on open-asks sheet 24**
   ([PNcwBXXZZpb6wKXDheDfnA](https://claude.ai/artifact/PNcwBXXZZpb6wKXDheDfnA); the ArtifactData tool's
   `list` on collection `replies`, then `replies/done`). Card 1: two memory receipts. Card 2: six
   catalog addresses. Execute what he answered, change the lane's NEEDS SAM marker in the same PR, and drop
   the answered card from the builder.
2. **Read the registry back** (`program_source_registry`). After the first apply it held 112 addresses,
   77 years (71 at 2026-27), four slice run ids and 118 history rows (read back 18:03Z). Expect six more
   addresses once card 2 runs, each with `corrected_by` set.
3. **Check the seven 2025-26 years** in the lane file (Cuyamaca, Evergreen Valley, Los Angeles City, Madera,
   Palo Verde, San Diego City, Santiago Canyon): a college that has published 2026-27 means a reader gap.
4. **Phase 1, the pilot**, once the registry holds: pick the PDF-catalog college from the lane's list, then
   ask Sam the three names (Riverside City's program, who checks the 20-program sample, who contacts the
   Tech Center) on a sheet.

## What shipped (merged, applied)

- **#1838** (SkyCensus): the vendor-link hop and the four-slice matrix (`--shard k/n`).
- **#1839** (SkyCatalog): district pages read by this college's own words, siblings refused, every
  college's name passed to each slice; two-digit years only in curriQunet `/alias/` names; the
  `catalog.<domain>` probe after a failed homepage; no hop onto an older year, a change log or an archive;
  `textContent` for hidden menus; "Class Schedule & Catalog" counts as a catalog link; a yearless college
  page tries its vendor or `catalog.*` link first; an index is counted before addenda and siblings are
  dropped. Four reads: 109 → 112 addresses, 67 → 78 years, 61 → 71 at 2026-27, no college worse off.
- **First apply** on `main`: run 37142060932 (Sam approved the weekly apply in S320). Read back: 112
  addresses, 77 years, 71 at 2026-27; Miramar, Yuba, Merced, Diablo Valley and Mission hold their
  corrected answers.
- **Three S320 memory rows** written (Sam's registry decision, the census milestone and the seed
  pitfall: the rows whose text names no destructive SQL word), each logged.
- **Docs:** lane file rewritten; lessons 12-15; KB note
  `methodology-a-reader-fix-moves-rows-it-was-not-aimed-at`; open-asks sheet 24.

## Sam's rulings this run

None. One coordination note: Sam had opened a second session believing S321 was done; it was "Coordination
with Sam" (`session_01SSnFeZoaZXr3ZqhVabkRVy`, Ashley's OpenClassrooms crosswalk, #1760), which touched
nothing in the census. Say clearly when a session is still working, and sign off only when it is done.

## Open

- **Sheet 24, card 1:** `kb/receipts/cpl_memory_2026-10-03_s320.sql` (two rows remain) and
  `kb/receipts/cpl_memory_2026-10-03_s321.sql`. Both skip rows already written.
- **Sheet 24, card 2:** `kb/receipts/program_source_registry_corrections_2026-10-03_s321.sql`, six rows,
  `corrected_by = 'Sam (open-asks sheet 24)'`, guarded by `corrected_by is null`.
- San Diego College of Continuing Education stays on the district catalogs page: no link on it names the
  college. A person may know its catalog's address.
- The census uses no model. 34 rows with an address carry no year; a model pass through an Edge Function
  (sheet 23 call 6) picks among the census's own candidate links if that number stays high.
- `#1839`'s squash commit carries its co-author trailer as HTML entities (`&lt;` `&gt;`). Cosmetic; `main`
  is never rewritten (Rule 5).
- From S319, still open: 7c's quick-list window; `fetchProgramCourses` still lists by TOP code; read the
  timing log (`chat_interactions.timings`) over real traffic.

## Patterns that worked

- **Compare every full read row by row against the last and the first.** Each round fixed rows and moved
  others; the totals rose every round and hid two regressions. Keep each read's JSON lines in the
  scratchpad and diff on address, year, platform and access.
- **A fake reader drives `census_one` end to end** with canned pages, so a rule about hops, probes or
  indexes is tested without a browser. Mutate each rule out with the bytecode cache off (`python3 -B`,
  `PYTHONDONTWRITEBYTECODE=1`): a same-size edit within one second reuses a stale `.pyc`.
- **Read the evidence of each row that moved before writing a rule.** Every fix this run came from a row's
  candidates, pages and catalog-like links, never from a guess.

## Safety patterns

- ⚠️ **The Supabase connector waits for confirmation on any statement whose text names drop, delete, revoke
  or truncate, quoted prose included,** and times out at 60 s with nothing written. Keep such rows in a
  receipt for Sam; write the rest directly.
- ⚠️ **`cpl_memory.summary` is capped at 400 characters, `detail` at 4,000.** One long row fails the whole
  statement; measure before staging.
- ⚠️ A person's correction is a person's: never set `corrected_by` from a session's inference.
- ⚠️ The census never works around a challenge page and never loads what robots.txt disallows.
- ⚠️ This container reaches no college site; logs through the GitHub MCP, data through the Supabase MCP.
- ⚠️ Budgets: `CLAUDE.md` 59,999 of 60,000 bytes. The §11 row reads "in progress · census built".
