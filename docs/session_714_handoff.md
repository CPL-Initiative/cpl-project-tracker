---
title: "Session 714 handoff (from SkyKittiwake, S713, the CPL Queue routine's collection run of 2026-11-23)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Draft, written at the start (06:20Z) so the college split stands before any worker starts.** The checkpoint rewrites
this file at sign-off.

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
plain-session handoff (`docs/session_712_handoff.md` named SkyPuffin, Session 712, and #3702 took that number), never
this file. **Numbering.** Handoff 704 named the routine's next session SkyKittiwake, Session 704, but Sam's plain
sessions have since taken 705 to 712, so this run takes the next free number, S713, and writes 714 to stay clear of the
713 that S712's checkpoint would write.

# You are the routine's next session (named at sign-off)

## The start (06:12Z firing, 2026-11-23)

- Step 0: no `daily-dashboard.yml` run created on 2026-11-23 UTC, so this firing dispatched it on `main` at 06:16Z.
- One writer: no `list_sessions` or `get_trigger` in this session, so the run read the open PRs (#3684, #3675, #3683,
  #3686, all S703's, newest updated 16:26Z on 11-22) and `main` since handoff 712 (#3702 at 02:40Z, then nothing). No
  PR was updated in the last half hour, so the run took the queue.
- No pause line in handoffs 704 or 712. Three repos attached. Sheet 200's replies: none since 2026-11-19.
  `queue_todo_done` since 11-22: none. No exhibit re-analysis request open.

## The college split (written before any worker started, 06:20Z)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`);
outline fills first, program records second (`r-collect-for-mids-work-order-sam-2026-11-20`).

**Lane 1 (collection):**
- `peralta`: #3684's dry run and load (Laney, Merritt, College of Alameda, Berkeley City); then City College of San
  Francisco, whole (its next outline read, then its 53 page-finding programs), as the one writer there.
- `land`: S703's records PRs brought up from `main` one at a time and merged by the conductor: #3686 (Ohlone, San
  Joaquin Delta, Mt. San Antonio, Santa Barbara City, Orange Coast), #3675 (Glendale, Butte; Glendale 38973 filed as a
  named gap), #3683 (Clovis and S697's findings); then the display build (gate college Cosumnes River) and the census on
  `main`. Each college leaves lane 1 when its PR merges.
- Later, when a slot frees: `levers` at Mt. San Antonio, Santa Barbara City and Orange Coast where #3686 did not
  reach, and Santa Ana's program pages from its filed credit catalog (#3669).

**Lane 2 (cheap piles, one worker, `piles`):** Santa Monica (30) and Santa Rosa Junior (27) first; Glendale's 28 once
#3675 merges and Clovis's 14 once #3683 merges. City College of San Francisco's 28 wording rules stay with lane 1's
writer there and wait for a later run.

**Held to a later slot:** Mt. San Antonio's credit-catalog program pages wait for `levers`, since #3686 holds that
college until it merges.

## Progress (refreshed at least every half hour so another firing reads this run as live)

- 06:23Z: today's daily update landed on `main` (`a588fc77`).
- 06:34Z: Peralta's dry run (3,738 rows) carried label lines (SCANS framework lines, bare "Part N" headings, stray
  colons, "None" blocks). The fix went ahead of the load (`d-peralta-load-cleans-labels-first-s713`): a load-time clean
  at the `lan` folder only, on #3684 (`51bee0ca`), 3,731 rows and 7 placeholder skips after it. A second reader checks
  it before `.load` is pushed.
- 06:47Z: #3686 brought up from `main` (`9332ac1d`, main's side of four Commons files, both builders rerun); its `test`
  is running.
- 06:57Z: #3686 merged (`9b8480e3`); Ohlone, San Joaquin Delta, Mt. San Antonio, Santa Barbara City and Orange Coast
  leave lane 1's landing. #3675 is coming up from `main` next (Glendale 38973 filed as `page_challenged`, the host's
  bot check in run 45030485543).
- Peralta's load: the second reader held it for 12 system notes ("Won't delete", "duplicate to be removed") that would
  have loaded as objectives; fixed on #3684, then load run 45127831747 inserted 3,731 rows, confirmed live (Laney
  663/663, Merritt 463/465, College of Alameda 365/368, Berkeley City 372/372, SLO/objective). `peralta` moves to City
  College of San Francisco as its one writer (the outline read, then the 53 page-finding programs).
- Lane 2: #3705 (draft) moves 17 Santa Rosa Junior records (5 pass, 12 as `section_cut_off`); a second reader is on it.
  Santa Monica's 26 stay held (6 wait on runner page text, 17 need a reread, 3 a page read or a person).
