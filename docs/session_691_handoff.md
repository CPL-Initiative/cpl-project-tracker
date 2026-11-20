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

**Split changes during the run.**
- Worker `pages` finished at 14:1xZ, and its six colleges are released.
- Lane 2's worker `piles` started at about 14:15Z on Berkeley City and Glendale only.
- At 14:35Z, Sam's go of Nov 20, 6:26 AM PT (relayed by COBIx on #3584, comment 7042043701: *"read these catalogs with
  a plain, browser-like page read in tonight's collection wave"*) started worker `catalogs` on NOCE first, then
  Southwestern, Cerritos, Long Beach City, Monterey Peninsula, Clovis, Los Angeles Valley, Los Angeles City, Los
  Angeles Southwest, Los Angeles Harbor, East Los Angeles, West Los Angeles, Los Angeles Trade-Tech, Pierce, Los
  Angeles Mission and El Camino.
- `reread` released North Orange Continuing Education, Los Angeles Trade Technical, Los Angeles Southwest and West
  Los Angeles to it.

**Lane 2, the cheap piles (one worker, free rule work; starts after lane 1's workers sign off).** S689's carry-overs
#3593 (Berkeley City's Cal-GETC 34, then Berkeley City's reread) and #3597 (the shared no-ending address), the minor
findings of #3586, #3590 and #3594, and the spend file's `updated`, in the night's one follow-up PR (item 2a of
handoff 690); then the catalog-wording rules at Glendale, Santa Monica, College of the Canyons and City College of San
Francisco once lane 1 has nothing in flight there. Los Medanos stays parked.

**The conductor's own:** dispositions of the open PRs, the wave PR, merges, the display build once after the night's
posts, then `harvest-gap-census.yml` against 5,069, and the checkpoint.

**Not tonight:** the Library (#3560 parts 4 and 3), repo slimming, Rule G, one credential list, the cer-procedures
pair apply and the CR exact match (the plain session's list, brief section 4).

## State at 15:48Z (a safety note; the checkpoint rewrites this file)

**Merged:**
- #3600 `9fc88a07` (13:01Z): the Library check line stays out of Sierra's reading text and out of new pieces. This turned `main` green, red since 653864b7. Not deployed: `cpl-chat-deploy.yml` for `cpl-chat` and `library-revise-draft` waits for a plain session.
- #3601 `46f92c76` (13:48Z): City College of San Francisco's outlines are filed as parsed outcomes only. The recall gate counts from the trial's job-log excerpt (trial 44744884314, 12/12) under a parser fingerprint. Second reader, two rounds.

**In flight:**
- `ccsf`: City College of San Francisco's full outline read, run 44748015052 on `claude/s690-wave-ccsf`. Part 1 filed 709 pages and 2,904 SLOs (c7ce553d); part 2 is running. Then the standing test and the load (`.load`, `host=ccsf`).
- `reread`: the reread plan's rows 46 to 73 on `claude/s690-wave-reread`.
- `catalogs`: Sam's go of Nov 20, 6:26 AM PT.
  - North Orange Continuing Education's 1,089 printed courses are filed (`kb/hand_filed_catalogs/courses/`) from runner page reads 44756513382 and 44757980757 (HTTP 200, no WAF check; the sandbox gets 202).
  - Southwestern, Cerritos, Long Beach City, Monterey Peninsula, the LACCD PDFs and Sam's copies are in progress, on `claude/s690-wave-catalogs`.
- `piles`: the night's one follow-up PR (`claude/s690-follow-up`), then Berkeley City and Glendale.

**Done:** `pages`: Laney, Diablo Valley and Orange Coast posted and loaded, with 11 new, 69 replaced and 1 restored, $7.68 (on `claude/s690-wave-pages` bc01f3bd). Victor Valley, Mt. San Jacinto and Southwestern found no own page, so no paid read ran.

**Stopped:**
- Golden West's header correction, after two review rounds (`claude/s690-goldenwest-header` ae5be1d5, no PR). Its rollback depends on a 263 KB write result, and a load of the corrected filed reads before the write would double 476 rows.
- City College of San Francisco's rule D prior-year read: `www.ccsf.edu` serves a Cloudflare 403. The catalog was asked of COBIx on #3358 (comment 7040201320).

**Closed with pointers:** #3593 and #3597, which fold into the follow-up PR.
