---
title: "Session 407 handoff: the eight hand-filed catalogs loaded, Sheet 90, MAP Export's UI pass"
date: 2026-10-17
session: 406 (SkyIronwood)
tags: [handoff, program-requirements, catalog-sweep, hand-filed, display-build, ui-pass, decision-sheet]
status: current
superseded: true
superseded_by: session_411_handoff.md
---

# You are Session 407

Your moniker is **SkyMesquite**. Session 406 (**SkyIronwood**) was a session Sam opened by hand on 2026-10-17
(`session_017RtLQumovBTviZhcyTpdmp`, 15:36Z on). If the routine started you, follow
`docs/reference/scheduled_sessions.md` first.

## What shipped (S406)

- **#2199 (merged): a hand-filed catalog is read from the copy a person posted.** Sam put eight refused colleges'
  catalog PDFs, Porterville's two addenda and De Anza's spring addendum into the `catalog-files` release's text. The
  session's proxy refuses GitHub's attachment host (403); a runner fetches it. A record in `kb/hand_filed_catalogs/`
  names `copy_url`, and the read job's first step, `pin`, writes the copy's sha256, size and run on the first fetch. A
  pinned hash never changes. No PDF enters git.
- **The wave PR (branch `claude/s406-wave`; see its number in the open PRs): the eight colleges loaded unchecked.**
  Cerro Coso 52, Porterville 76, Folsom Lake 104, De Anza 210 (its 2025-2026 catalog), Sacramento City 182, Cosumnes
  River 182, CCSF 294, American River 327: 1,427 records, $131.00, each under the $40 go. It carries their dated reads
  (registry rows matched by md5, MAP credit counts fingerprinted in SQL), display build **`fec9782a4dbc`** (13,851
  programs at 100 colleges), Cuesta's held correction receipt, the lane, lessons, queue status and this checkpoint.
- **#2200: MAP Export's UI pass.** Rows are buttons with `aria-pressed`, both scrolling panes labeled focusable
  regions, focus shows the theme's ring, controls are underlined words in place of the arrow and copy glyphs. Light
  and dark re-measure clean.
- **Open Asks Sheet 90** ([link](https://claude.ai/artifact/2mNgzt7uiup8msUahihBEq), current; Sheet 89 superseded):
  card 1 Grossmont, Ohlone, Cañada (carried); card 2 paste the six registry rows Sam's PDF addresses approved (the
  Supabase guard held the UPDATE); card 3 correct Cuesta's row to `cuesta.curriqunet.com/catalog/iq/29951`. Source
  in CPLBrain on `claude/determined-mccarthy-n98sb0`.

## Decisions Sam made this run

None in session. His standing inputs this run rode on: the catalog-files release and his pasted PDF addresses
(`cpl_memory` `sam-hand-filed-catalog-pdf-links-2026-10-17`, `sam-catalog-files-release-de-anza-2025-26-2026-10-17`).

## In flight at sign-off (check each first)

1. **The wave PR:** merge once `test` passes on its head, then dispatch `program-requirements-college.yml` from `main`
   with `step=display` (build `fec9782a4dbc`, about 50 minutes) and confirm the applied record on `main`. If S406
   already dispatched it, read the run and the applied-record commit.
2. **#2200:** merge once `test` passes on its head.
3. **Sheet 90:** read its `replies` first. Card 2 pasted: read the six rows back and refresh their entries in
   `kb/program_requirements_pilot/registry_read.json` (md5 each). Card 3 pasted: a capture-only read of Cuesta on a new
   branch (`claude/s407-cuesta`), then extraction under the $40 go.

## Priority, in order

1. The three items above.
2. **Own HTML not yet read:** College of the Desert, LA Trade Tech, LA Mission, LA Southwest, Glendale, Pasadena City.
   A capture-only run first, one branch per college; read the registry row's address first (four rows this week named
   a page about the catalog).
3. **Procedure records** for LA City, Pierce, San Mateo, S405's seven and S406's eight.
4. **The title gate in a large PDF:** CCSF left 55 records out, wrong-page picks the extraction caught (Physics 2.0
   drew course descriptions). A free reconcile tests a reader change.
5. The UI pass's next view (`python3 scripts/ui_pass.py --next`).

## Patterns and safety

- **A Supabase result too large for the context lands in a file:** parse it there and check it against a
  fingerprint the same query computed. Nothing retyped.
- **Cut each college's branch from the code branch** so captures run while its tests do; merge each loaded college
  into the wave with `-X theirs` (only its pinned record differs from `main`).
- **Never dispatch a run onto a branch whose previous run is still queued:** the concurrency group keeps one pending
  run, so a second dispatch can replace the queued load.
- One branch per college. Dispatch every read with `college=`. The Supabase guard holds an UPDATE: it goes on the
  sheet as a paste card.

## Not refreshed this checkpoint

- The Pipeline tab (step 7): the M-ID pipeline did not move. `kb/README.md`, `README.md`: nothing they describe
  changed (the hand-filed README carries its own steps).

## Subscriptions and check-ins

S406 drops its PR subscriptions at sign-off (#2199 merged; #2200 and the wave PR named above). No check-in, no
artifact watch (the remote environment registers none).
