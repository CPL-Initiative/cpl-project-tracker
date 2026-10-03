---
title: Session 323 handoff — the census reads each catalog's own year (95 of 118); sheet 25 asks the pilot's three names; build the pilot reader
date: 2026-10-03
session: 322 (SkyPilot)
tags: [handoff, program-requirements-harvest, census, registry, pilot]
status: current
---

# You are Session 323

Your moniker is **SkyHarvest**. SkyPilot (S322, `session_01EEeqBvugvYK1JFCZjQV2mo`) corrected the census
three more ways over three full branch reads (#1841, squash `35b3fb3`), ran the apply on `main` (run
37157737048), picked the pilot's PDF college, and put the pilot's three open names on open-asks sheet 25.

## First, in this order

1. **Read Sam's replies on open-asks sheet 25**
   ([SqKFZpLcY9Q4Jg1GLVGk1B](https://claude.ai/artifact/SqKFZpLcY9Q4Jg1GLVGk1B); the ArtifactData tool's
   `list` on collection `replies`, then `replies/done`). Sheet 24
   ([PNcwBXXZZpb6wKXDheDfnA](https://claude.ai/artifact/PNcwBXXZZpb6wKXDheDfnA)) carried no replies at
   22:10Z; check it too, since a reply there still counts for its two cards. Cards 1-2 carry over (memory
   receipts; six catalog addresses). Cards 3-5 are the pilot's names: Riverside City's program (proposed:
   the Culinary Arts Certificate of Achievement, 22804), who checks the 20-program sample (proposed:
   Jessica), and who asks the Tech Center (proposed: Sam, after the pilot's first records). Execute what he
   answered, change the lane's NEEDS SAM marker in the same PR, and drop answered cards from the builder.
2. **Read the registry back** (`program_source_registry`). Expect about 112 addresses, 95 years and 91 at
   2026-27 after run 37157737048 (read 3 on the branch gave exactly that). `year_from` sits in each row's
   `census_evidence.catalog_pages`; a `banner` year carries `banner_words`.
3. **Phase 1, the pilot reader.** Five colleges, one fixed program each: Cerritos (Ironworker pathway,
   CourseLeaf), Mt. San Antonio (LVN-to-RN A.S., CourseLeaf), Miramar (a program with a PPM map,
   curriQunet), Riverside City (Sam's pick; curriQunet) and **West Los Angeles** (a Real Estate certificate
   with an electives block, one PDF). Score each on course coverage against the Program Course File, no
   invented courses, unit arithmetic, and agreement with a person. Runners read the sites; model calls go
   through a Supabase Edge Function (the `cpl-news.yml` pattern; Sam's call 6). Start a new `claude/*`
   branch for it.

## What shipped (merged, applied)

- **#1841** (squash `35b3fb3`):
  - Two links on one host that name different years put the newer first (San Diego City's `city26-27`,
    whose link text is misspelled "Catolog").
  - A vendor catalog's own edition banner names its year, after the title and h1: CourseLeaf, curriQunet,
    eLumen, Coursedog and SmartCatalog pages only (by address or assets), beside "catalog" or "edition",
    never an archive's phrase or a "coming soon", and never lowering the address's or link's year.
  - A read that finds no catalog keeps the registry's address and notes the run it came from (Columbia
    timed out in read 2; Santa Monica found no link in read 3).
  - Evidence: h1, `year_from`, `banner_words`, `body_year`.
  - Open-asks sheet 25.
- **Three branch reads**, compared row by row: registry 112 / 77 / 71 → read 3 112 / 95 / 91 (addresses /
  years / 2026-27). No college lost an address or a year, or went to an older year.
- **Apply** on `main`: run 37157737048 (hand dispatch, Sam's S320 approval of hand dispatch and the weekly
  run).
- **Docs:** lane file rewritten; lessons 16-20; the KB note
  `methodology-a-failed-read-is-not-an-empty-result` gained the census case.

## Sam's rulings this run

None. Sheet 24 had no replies; its cards moved to sheet 25.

## Open

- Sheet 25's five cards (above).
- The seven 2025-26 years: San Diego City, Cuyamaca and Madera now read 2026-27. Los Angeles City, Palo
  Verde, Santiago Canyon and Evergreen Valley name 2025-26 on their own pages, and a web search found no
  2026-27 catalog for them (October 2026). The weekly read moves them when they publish.
- About 23 rows with an address still carry no year, most on custom college pages, Acalog, or PDFs whose
  address names none. A model pass through an Edge Function (sheet 23, call 6) picks among the census's
  own candidates if that number matters to the pilot.
- From S319: 7c's quick-list window; `fetchProgramCourses` still lists by TOP code; read the timing log
  (`chat_interactions.timings`) over real traffic.

## Patterns that worked

- **Simulate a rule against stored evidence before the read.** The registry's stored candidates predicted
  the newer-year rule's one move. Read 1's body words predicted read 2's 18 moves, and the simulation
  caught Crafton Hills' regression (a sibling check reading "Mission" in a menu) before any push.
- **Hand the logs to a subagent that writes them to disk byte for byte.** `get_job_logs` with
  `return_content` saves a large log to a tool-results JSON file; extract `logs_content` with python3,
  never retype it. The proxy blocks the log host for curl.
- **A pure guard test that drives `main()`** with a fake registry and a fake read proves the guard is
  wired, not just defined. Mutate each guard out with `python3 -B`.

## Safety patterns

- ⚠️ **The Supabase connector waits for confirmation on any statement whose text names drop, delete,
  revoke or truncate, quoted prose included,** and times out at 60 s with nothing written.
- ⚠️ `cpl_memory.summary` is capped at 400 characters, `detail` at 4,000.
- ⚠️ A person's correction is a person's: never set `corrected_by` from a session's inference.
- ⚠️ The census never works around a challenge page and never loads what robots.txt disallows.
- ⚠️ This container reaches no college site and not the Actions log host; logs through the GitHub MCP,
  data through the Supabase MCP.
- ⚠️ Budgets: `CLAUDE.md` 59,989 of 60,000 bytes. The §11 row reads "in progress · census built".
