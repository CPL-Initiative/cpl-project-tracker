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

## Ledger at 08:01Z (in progress)

**Merged:** #3491 (cheap piles: 9 discontinued programs flagged out of the gap census; `main` e50a87fb).

**Data written so far, each with a committed receipt and an unapplied rollback:** 56 program requirement records rescored by the units rules (#3496: 17 checks only, migrate run 44259625861; 39 full row, run 44261575737; none skipped). The private bucket `cpl-receipts` (migrate run 44255184017) holds 141 display receipts (1,596.1 MB) and 165 row audit reports (982.5 MB), by a live count.

| PR | What | State |
|---|---|---|
| #3495 | display receipts to the private bucket (#3476 step 1) | ready; second read and COBIx's finding fixed, COBIx confirmed at 07:38Z; `test` running on 1332a699; merge when green |
| #3501 | the one-time move of 141 display receipts (#3476 step 4), stacked on #3495 | upload run 44259862567 succeeded; the removal commit is being written |
| #3498 | row audit reports kept to the newest 14 (#3476 step 5), stacked on #3495 | second read done, three minor fixes in (b2f140d5); move run 44258551009 stored 165 and removed them from the branch |
| #3490 | the repo size check (#3476 step 2) | draft; merges after the receipts leave the tree |
| #3496 | cheap piles: units rules A1, A4, A5; A6 off | both applies landed; rollbacks rebuilt from the returned rows, `main` merged in, then merge on a green `test` |
| #3497 | cheap piles: named gaps, 75 rows, all `no_units_read` | second read's findings fixed (ac452730); pre-read and apply after #3496 merges |
| #3502 | cheap piles: the paid reread plan | plan of record: no blind paid reads; two records ($0.20) have a changed page; the rest wait on reader changes |
| #3503 | the Spend line: sessions key rebuilt at each checkpoint, and the collection, curation and infrastructure tags | draft |
| #3488, #3421, #3284, #3489, #3494 | full outcome reads: Golden West, Diablo Valley, Allan Hancock, Los Medanos, Santiago Canyon | runs in flight or queued |
| #3387 | College of the Redwoods outcomes | read filed, 443 rows in the dry run, load run 44259060063 |
| #3492 | Chabot outcomes | index done, 12-page trial run 44258605342 |
| #3493 | Antelope Valley outcomes | trial parsed 0 of 12; verdict `held`, as College of Marin |
| #3499 | Lassen: five records pinned to `main`'s pages | second reader cleared it; reconcile 44259115005 done; review, restore and reread next |
| #3500 | Cosumnes River: four clean pins | the paid read is off tonight: the preview lists programs beyond the pinned set |
| #3293 | the passing dry run | still waits on COBIx after four days; a plain-session decision |
| #3482, #3472 | S679's drafts, green on their heads, each conflicts with `main` | left for a plain session |

The runner pool is saturated, so each merge waits longer than 11 minutes.

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
