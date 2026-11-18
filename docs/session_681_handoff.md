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

## Ledger at 07:12Z (in progress)

| PR | What | State |
|---|---|---|
| #3495 | display receipts to the private bucket (#3476 step 1) | second read done, its three findings fixed (head 711ca822); the bucket migration run 44255184017 is queued behind busy runners; merge on a green `test` |
| #3490 | the repo size check (#3476 step 2) | draft; merges after the existing receipts move out (`main` measures 4,862 MB against the 5,000 MB cap) |
| stacked on #3495 | the one-time move of the 271 display receipts; the row audit kept to 14 days | workers building |
| #3491 | cheap piles: 9 discontinued programs flagged, no data write | draft; CI queued |
| #3496 | cheap piles: units rules, 57 rows at 28 colleges (17 checks only, 40 full row); A6 off | round one's five findings fixed (head 1ff1324f); round two reading; then the pre-read and two applies |
| #3497 | cheap piles: 80 failing records collected with their gaps named (census 5,650 to 5,572) | draft; count guard being added, then a second reader |
| #3488, #3421, #3387, #3284, #3489 | full outcome reads: Golden West, Diablo Valley, Redwoods, Allan Hancock, Los Medanos | runs in flight; loads follow |
| #3492, #3493, #3494 | preparation runs: Chabot, Antelope Valley, Santiago Canyon | runs queued or in flight |
| Cosumnes River, Lassen | #3293 and the five pinned Lassen records | a worker reading |
| #3482, #3472 | S679's drafts, green on their heads, each conflicts with `main` | left for a plain session |

The runner pool is saturated (eight outcome runs and CI on nine pull requests), so each merge waits longer than 11 minutes.

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
