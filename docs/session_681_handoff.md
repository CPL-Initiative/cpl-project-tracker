---
title: "Session 681 handoff (from SkyPhoebe, S680)"
created: 2026-11-18
updated: 2026-11-18
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyGrebe (Session 681)

**In progress.** SkyPhoebe (S680), the routine's 06:12Z firing of 2026-11-18, holds the queue and is conducting. This
file is its declaration and the college split, written at 06:22Z before any worker started. The checkpoint rewrites it.
A later firing that finds this pull request updated within the half hour ends in one line.

## The college split (written before any worker started)

- **Collection lane** (harvest workers), twelve colleges, frozen at 06:46Z: Golden West, Coastline and Orange Coast
  (the `cccd` host; Golden West's objectives full read, #3488), Cosumnes River (#3293's seven), Lassen (its five pinned
  records), Los Medanos (#3489, trial 12 of 12, full read tonight), Diablo Valley (#3421), College of the Redwoods
  (#3387) and Allan Hancock (#3284), whose full outcome reads run tonight, and Chabot, Antelope Valley and Santiago
  Canyon (preparation runs). One reader per host.
- **Cheap-piles lane** (one worker): every other college. Its statewide rules (the discontinued flags, units rules A1,
  A4, A5, A6, A8 and A11, the retired-course flags, the named-gap labels and the two paid reread lanes) leave the
  collection lane's twelve colleges out tonight and reach them on a later night.
- One writer per college. A college changes lanes only by an edit to this section before the write.
- The slimming pull requests (#3476) touch no college record.

## Ledger at 08:23Z (in progress)

**Merged (2):** #3491 (cheap piles: 9 discontinued programs flagged out of the gap census; `main` e50a87fb) and #3495 (#3476 step 1: display receipts are built, stored and applied by the runner from the private bucket `cpl-receipts`, never committed; `main` 25c79493).

**Data written so far, each with a committed receipt and an unapplied rollback:** 56 program requirement records rescored by the units rules (#3496: 17 checks only, migrate run 44259625861; 39 full row, run 44261575737; none skipped). 443 course outline rows loaded for College of the Redwoods (load run 44259060063). The bucket (migrate run 44255184017) holds 141 display receipts (1,596.1 MB) and 165 row audit reports (982.5 MB), by a live count.

**The merge chain.** Every merge to `main` puts each other code pull request in conflict on the dependency maps, and the runner pool is saturated, so the remaining code pull requests merge as a chain, each branch already holding the one before it: #3496, then #3498 (which now carries #3501 too), then #3497, #3490, #3503, #3502, #3499. The outcome pull requests touch only data and merge beside the chain.

| PR | What | State |
|---|---|---|
| #3496 | cheap piles: units rules A1, A4, A5; A6 off | both applies landed, rollbacks rebuilt from the returned rows; `main` being merged in; first in the chain |
| #3498 (+ #3501) | #3476 steps 4 and 5: 141 display receipts and 165 old row audit reports leave the tree; the daily run keeps the newest 14 reports | both one-time moves stored and verified; being combined on `main` behind #3496 |
| #3497 | cheap piles: named gaps, 75 rows, all `no_units_read` | second read's findings fixed (ac452730); pre-read and apply follow #3496 |
| #3490 | the repo size check (#3476 step 2) | draft; after the receipts leave the tree |
| #3503 | the Spend line: sessions key rebuilt at each checkpoint; collection, curation and infrastructure tags | draft; CI running |
| #3502 | cheap piles: the paid reread plan | plan of record: no blind paid reads; two records ($0.20) have a changed page; 54 more records take a named gap through #3497's mechanism; the rest wait on reader changes |
| #3387 | College of the Redwoods outcomes, 443 rows loaded | ready; CI running |
| #3493 | Antelope Valley outcomes: trial parsed 0 of 12; verdict `held`, as College of Marin | ready; CI running |
| #3488, #3489, #3421 | Golden West (580 objective rows in the dry run), Los Medanos (483), Diablo Valley (946) | reads filed; load runs 44263910106, 44264033797, 44264252782 queued |
| #3284, #3494, #3492 | Allan Hancock (2 of 3 slices), Santiago Canyon (queued), Chabot (trial 12 of 12, full read pushed; its run to be rechecked) | reads in flight |
| #3499 | Lassen: five records pinned to `main`'s pages | reconcile 44259115005: 33729 and 33730 pass, the other three carry `ge_units` 34 with the gap named; reread run 44263840460 |
| #3500 | Cosumnes River: four clean pins | the paid read is off tonight: the preview lists programs beyond the pinned set; needs a named-programs input |
| #3293 | the passing dry run | still waits on COBIx after four days; a plain-session decision |
| #3482, #3472 | S679's drafts, green on their heads, each conflicts with `main` | left for a plain session |

## Order tonight (COBIx's brief on #3358, written 6:45 PM PT Nov 17)

1. The slimming pull requests (#3476 Part 4): display receipts to the private bucket, the size check, the existing
   receipts moved out, the row audit kept to 14 days.
2. Both collection lanes. No display build is committed the old way; the wave's one display build waits for step 1.
3. Left for a plain session: reader rules A to C, the CDC widget, Courses G and M, Exhibits rules 1 and 2, the CR exact
   match, #3482 and #3472, the two Library briefs requested on 2026-11-12 and three open revise requests.

## Session settings

A conductor run for collection only (Sam's cost rules of 2026-11-17): one conductor, Opus 5.5 workers, high effort on
any worker that writes shared data, about $750 a day for everything, $40 per college per run. This is night one of the
two-night conductor comparison; the routine form set tonight's conductor.

Spend: not available; 2026-11-18T06:12Z to (in progress).

Opening line: *Greetings, you are SkyGrebe (Session 681), see SkyPhoebe's handoff, `docs/session_681_handoff.md`,
let's keep rolling with our queue.*
