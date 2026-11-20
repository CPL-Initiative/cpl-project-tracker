---
title: "Session 691 handoff (from SkyMerlin, S690)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# Declaration stub (S690, SkyMerlin)

The CPL Queue routine's 11:12Z firing of 2026-11-20 found S689 (SkyTern) live on #3584 and stood down in one line. The
account holder answered *"keep going"* in the session at about 11:45Z, so this session waits for S689's sign-off and
then takes the queue as S690, SkyMerlin, the moniker handoff 690 names.

Until #3584 lands on `main`, this session writes no shared data, starts no worker and merges nothing. A later firing
reads this PR as a live session and ends in one line. The checkpoint replaces this stub with the full handoff 691.

## The college split (written before any worker started, 12:23Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`).

**The order follows Sam's work order (handoff 690, item 2b; `r-collect-for-mids-work-order-sam-2026-11-20`): fixes
ranked by the M-ID cards each would unblock.** A read-only count over the committed files (12:22Z; 49,558 live
cards): City College of San Francisco's outlines are the one outline fill runnable tonight and the largest, with
2,065 cards improved, 1,020 completed and 1,401 given their first SLO or objective text. The next six by that count
(American River, Southwestern, Glendale, Santa Barbara City, Fullerton, College of the Canyons) have no public
outline system or sit behind a bot challenge, and no committed pipeline fills a missing course description. Program
records feed no M-ID card, so the two program workers run beside `ccsf` as the second tier.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `ccsf` (City College of San Francisco, every table; first):** its outline trial filing parsed outcomes only
  (`d-ccsf-outline-trial-no-staff-names-s689`), then its full read and load if the trial holds; rule D's prior-year
  read of its 27 not printed. Then, at colleges no other worker holds: Golden West's 474 header rows (the reader fix,
  and a guarded correction with before-values, run by the conductor after a second reader), and the held outline
  colleges' index fixes (Rio Hondo's search, Irvine Valley's status words).
- **Worker `reread` (the reread plan, `kb/program_requirements_reread_plan_s683.json`, rows 46 to 73 but Berkeley City):**
  Napa Valley, North Orange Continuing Education, Saddleback, Cerro Coso, Mt. San Antonio, Santa Monica, San Diego
  College of Continuing Education, Bakersfield and Butte; then Chaffey, Cuyamaca, Cypress, Fullerton, Merced, Mission,
  Moreno Valley, Norco, Reedley, San Diego City, San Joaquin Delta, San Jose City, Sacramento City, San Diego Mesa,
  College of the Canyons, Los Angeles Trade Technical, Los Angeles Southwest and West Los Angeles; then the free
  captures at Solano and Cañada (the ligature fold). $40 per college per run, at most 10 colleges a batch, the better
  record kept before posting, a load after each reread.
- **Worker `pages` (the census's next free page-finding levers):** Victor Valley, Diablo Valley, Laney, Mt. San
  Jacinto, Orange Coast and Southwestern. A free page read first; paid extraction only for programs whose own page is
  found.

**Lane 2, the cheap piles (one worker, free rule work; starts after lane 1's workers sign off).** S689's carry-overs
#3593 (Berkeley City's Cal-GETC 34, then Berkeley City's reread) and #3597 (the shared no-ending address), the minor
findings of #3586, #3590 and #3594, and the spend file's `updated`, in the night's one follow-up PR (item 2a of
handoff 690); then the catalog-wording rules at Glendale, Santa Monica, College of the Canyons and City College of San
Francisco once lane 1 has nothing in flight there. Los Medanos stays parked.

**The conductor's own:** dispositions of the open PRs, the wave PR, merges, the display build once after the night's
posts, then `harvest-gap-census.yml` against 5,069, and the checkpoint.

**Not tonight:** the Library (#3560 parts 4 and 3), repo slimming, Rule G, one credential list, the cer-procedures
pair apply and the CR exact match (the plain session's list, brief section 4).
