---
title: "Session 406 handoff: the year scope, seven colleges loaded, ligature glyphs read, the hand-filed catalog step"
date: 2026-10-17
session: 405 (SkyCholla)
tags: [handoff, program-requirements, catalog-sweep, own-html, pdf, display-build, scheduled-sessions]
status: current
---

# You are Session 406

Your moniker is **SkyIronwood**. Session 405 (**SkyCholla**) was the 12:12Z CPL Queue firing on 2026-10-17
(`session_01ECpBFfxBZp1QCwtNU3KtsX`). A second session Sam opened by hand at 11:41Z
(`session_01P5nKs9TwAM4UnpR6eLEEQm`) also took the S405 name and handed the queue to this one at 12:57Z; its work is
named below. If the routine started you, follow `docs/reference/scheduled_sessions.md` first. With no `list_sessions`
tool, read the open PRs and their comments before you write anything.

## What shipped (S405)

- **The wave PR** (branch `claude/practical-meitner-ipbptn`; see its number in the open PRs). It carries:
  - **`year_scope()`**: an own-HTML catalog's sitemap, child pages and link search keep to the registry address's year
    segment. Skyline's capture went from 3,927 candidate pages in 78 minutes to 466 in 42.
  - **Loaded unchecked:** Coalinga 52, Skyline 42, West Valley 133, Copper Mountain 46, San Diego Continuing Education
    90, Solano 144. Extraction $40.32 plus Skyline's two runs ($1.29, $3.83).
  - **The scorer's ligature reading**: Solano's PDF prints ti, tt, ft, fi and ff as stand-in glyphs with a space
    (*"IntroducƟ on"*, *"draŌ "*). Free reconciles and rereads: Solano's outcomes failures went from 135 to 25 (135 rows
    replaced), Santa Rosa's from 38 to 1 (37 replaced).
  - **The hand-filed catalog step** (Sam's ruling 2, below): `kb/hand_filed_catalogs/` with its README.
  - **Dated reads** for the seven colleges and San Mateo, md5-matched. **Display build `c111c9b05ca0`, 12,424
    programs at 92 colleges.**
- **Open Asks Sheet 89** ([link](https://claude.ai/artifact/VUnFao67CB2biA3qGFZkXW), current, one card): correct
  Grossmont, Ohlone and Cañada's registry rows. CPLBrain branch `claude/determined-mayer-ipbptn`.
- **The hand-opened S405 session:** carried out Sheet 88 (five registry rows corrected; the 49-row undo read back,
  #2195); moved the Program Requirements tab's index onto four stored generated columns (#2196: never list `idx_fp`,
  `idx_display_arithmetic`, `idx_display_reviewer`, `idx_display_here` in an insert or update); drafted the four
  district access notes and the Program Mapper vendor note
  (`CPLBrain/04-projects/cpl-initiative/20261017_Catalog_Reader_Access_Notes_Draft_1.md`, waiting on Sam to add names
  and send); opened #2197, the My College Sierra restyle Sam approved.

## Decisions Sam made this run

- **Sheet 88** (completed 12:49Z): card 1 "correct", card 2 "pasted".
- **The refusing hosts** (chat, about 13:20Z, to the hand-opened session: *"1. yes 2. yes 3. draft the district notes
  I should send. Good advise, Bruh! 4. yes"*; `cpl_memory` `sam-sheet-29-revised-refusal-workarounds-2026-10-17`):
  (1) Sheet 29's refusal rule is revised: automated reads still name the CPL Initiative and respect blocks and
  robots.txt, a person may fetch a public file by hand, and the CO may ask a college or vendor for access. (2) Build the
  hand-filed step (done). (3) Draft the district notes (done, drafts). (4) The vendor note (drafted).

## In flight at sign-off (check each first)

1. **The wave PR:** merge once `test` passes on its head. Then dispatch `program-requirements-college.yml` from
   `main` with `step=display` (build `c111c9b05ca0`, about 50 minutes) and confirm the applied record on `main`.
2. **Cuesta** (branch `claude/s405-cuesta`): a capture-only read started 12:55Z on the whole host (its registry row
   names a class-search page). Read its capture report; if it found little, a page read of its catalog address first.
3. **Ohlone, Cañada, Grossmont**: wait on Sheet 89. Once corrected, Grossmont reads as CourseLeaf on the district host
   and Ohlone as one PDF (chapter 7); Cañada stays refused.

## Priority, in order

1. **#2197** (the hand-opened S405's PR): My College's Sierra and Sierra AI take the public Sierra page's style, from
   the mock-up Sam approved (`cpl_memory` `sam-my-college-sierra-public-style-2026-10-17`). If that session has let it
   go, see it merged on a green `test`.
2. The three items above.
3. **Hand-filed PDFs** as Sam files them (De Anza, CCSF, American River, Cosumnes River, Folsom Lake, Sacramento City,
   Cerro Coso; Porterville and Cañada joined them). Each: commit the file and its record, dispatch `step=read`.
4. **Own HTML not yet read:** College of the Desert, LA Trade Tech, LA Mission, LA Southwest, Glendale, Pasadena City.
   A capture-only run first, one branch per college; read the registry row's address first, since three of this run's
   rows named a page about the catalog.
5. Procedure records for LA City, Pierce, San Mateo and this run's seven.
6. The UI pass on **MAP Export** (S405 skipped it: no room for a fix PR).

## Patterns and safety

- **A 401 from the extraction function is its caller probe timing out**, not a bad key; re-run with
  `force=incomplete` (lessons S405).
- **A display build needs the college's dated reads**, or it builds with no registry row and no MAP credit
  recommendations.
- **When a PDF college fails the outcomes check in bulk, page-read the PDF around one failing outcome** before
  touching the scorer.
- One branch per college. Dispatch every read with `college=`. The Supabase guard holds an UPDATE: it goes on the
  sheet as a paste card.

## Not refreshed this checkpoint

- The Pipeline tab (step 7): no phase moved. `kb/README.md`, `README.md`: nothing they describe changed.
- The UI pass (step 9): skipped, no room for a fix PR; MAP Export stays due.

## Subscriptions and check-ins

S405 held no PR subscription, no check-in and no artifact watch at sign-off (the remote environment does not support
artifact watches). Nothing to drop. The capture on `claude/s405-cuesta` was still running.
