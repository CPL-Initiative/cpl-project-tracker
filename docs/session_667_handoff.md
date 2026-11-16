---
title: "Session 667 handoff (from SkyDipper, S666)"
created: 2026-11-16
updated: 2026-11-16
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyPlover (Session 667)

From SkyDipper, S666, Sam's session on 2026-11-16 (13:50Z on, opened by hand, "keep rolling"). A **full checkpoint**
(Rule 10 data writes with receipts; the harvest, commons, cer-procedures and governance lanes moved). Step 7 skipped:
the pipeline did not move (no roadmap row, auditor count or re-mint).

Read this file, then `CLAUDE.md` *Decide, carry out, record* (the ask test, new today), then the harvest lane
(`docs/reference/lanes/program-requirements-harvest.md`, the GE-page paragraph and NEXT), then
`docs/program_requirements_harvest_lessons.md` S666, then the commons lane's *Plain words* paragraph.

## What shipped

- **#3395** (`d35d8d53`): doctrine. The ask test, pick a lane, an ask never blocks, no re-asking, person-settled wins,
  the Execute SQL prompt is the app's, plain asks (Sam 2026-11-16, relayed by COBIx on #3358 and #3395).
- **#3396** (`b460ea57`): Another look drops a move away from a person's save; the fold's revise lane needs a person's
  row. The Nov 13 sweep's 6 cards (all Sam's own saves) fell to 0.
- **#3397** (`32d69d90`): Honors step 2 applied, 380 `honors_of` rows under `honors-rows-s653@bot` (run 43889173474).
  Sheet 200 card 1 is answered by it.
- **Closed #3393:** Physics 32745's prior read held on a free `prior` + `step=reconcile` dispatch (62 passes 60, no
  double counting stated). The current record stays.
- **Data:** Monterey Peninsula 03653, 22098, 39361 reloaded insert-only (run 43892853333, 3 in, 197 kept), draft #3399.
- **Read, no PR:** Riverside City archive 7 for 30578 and 33829 (run 43889274787, $0.078); both records stay.
- **Drafts:** #3398 (Sam's Sheet 195 card 4 CVMA answer into `kb/status/exhibit.json`; Commons decisions read "We went
  with this"), #3400 (`tests/plain_words_for_sam_test.py`).

PR-STATE

## First things, in order

1. **Step 11 (UTC Nov 17).** Coastline's objectives reread is the full read, then Golden West (`cccd`), plus one
   preparation run. College of the Redwoods (#3387) and Allan Hancock (#3284) are read and wait their turn.
2. **Gate and merge #3398, #3399, #3400** if not merged above: `test` green on the current head, then squash. #3398 is
   the one writer of `kb/status/exhibit.json`. #3399 merged means the next display build carries Monterey Peninsula's three.
3. **The six re-clustering cases and Sheet 195 card 2** ("Take every recommendation") against #3245 (commons lane,
   the re-clustering paragraph's NEXT).
4. **The decision-sheet plain-words wiring** in the vault (`CPLBrain/decision-sheets/`): the HTML lint #3400 does not reach.
5. **Lanes with a NEXT not taken:** `program-requirements-harvest` (3) a PDF-catalog route for Riverside City 30578 and
   33829, or leave them, then slice B's named-course minimum, #3293, Lassen; `commons` (Sam's billing paste into
   `kb/reference/model_spend_daily.json`; Honors reader minors); `cer-procedures` (the rename batch, `series_aliases`);
   `governance-team-enablement` (the first daily rebuild log); `library`, `college-district-identity`,
   `eacr-exhibit-cr-adoption`, `implementation-funding` (card 11 is Sam's), `reviewer-session-lifetime`,
   `sierra-retrieval-corpus`, `sierra-page-redesign` (#3159 is Sam's), `workplan-annual-goals`, `csm-workspace`,
   `map-users-student-contact` (next Sunday's contacts). Slice B of #3299 waits behind #3293.

## Session settings

One Opus 5.5 session works the queue: no conductor block (retired 2026-11-15), no parallel workers unless Sam starts
them. The $40-per-college-per-run limits and the #3351 gates stand. Merge only to `main`, confirmed with `git log
origin/main`.

## Ledger (PR, state, next)

| PR | State | Next |
|---|---|---|
| #3395, #3396, #3397 | merged | none |
| #3393 | closed | none |
| #3398, #3399, #3400 | drafts (see PR-STATE) | First thing 2 |
| #3387, #3284 | drafts; keep | First thing 1 |
| #3293 | draft; keep | harvest NEXT (5) |
| #2894 | Sam's | none |
| this checkpoint | merge | none |
| CPLBrain S666 session note | merge | none |

## Decisions and Sam's words

`cpl_memory` receipt `kb/receipts/cpl_memory_s666_rows_2026-11-16.sql` (7 rows): `d-rcc-originals-predate-curriqunet-s666`,
`d-mpc-reload-three-s666`, `d-honors-step2-applied-not-a-hold-s666`, `d-person-saved-never-returns-s666` (proposed),
`p-prior-rescore-route-is-prior-plus-reconcile-s666`, `p-dependency-map-reads-committed-files-s666`, and Sam's
`sam-sql-prompt-is-app-level-2026-11-16`: *"it is set that way and has been for some time"* (the Supabase connector is
on Always allow; the per-call prompt is the app's). COBIx's four "decisions wait on you" were all already answered
(Sheets 191, 187, 188, 195).

## Patterns that worked, and safety

- Rescore a prior read for free with a `prior` dispatch and `step=reconcile`; `sources_from` refuses a prior run.
- Read a prior page's heading before paying for the next year back: archive 7 already printed the 2.0.
- Check a write by the runner's committed receipt; batch the reads that remain into one call.
- `kb/_build_dependency_map.py` reads committed files: commit, regenerate, commit again.
- The safety check refused adding `apply_migration` to `.claude/settings.json`; never route around a denial.
- Fetch by name (`git fetch origin main`), never a bare `git pull`.

## Checkpoint notes

Lint: 6 oversized docs at start; the harvest lane compacted to 19,234 bytes, commons 17,193, cer-procedures 19,081,
governance 18,403 (retired text moved verbatim to each lessons doc). Not taken: `CLAUDE.md` at 1.04x (#3395's
doctrine), csm-workspace, implementation-funding, library, the dependency map. `handoff_drops_active_lane`
(commons) answered above. No KB note: the app-level prompt lesson is already doctrine in `CLAUDE.md`. Wiki
candidates for `/wiki-ingest`: the ask test; a person's save is terminal.

## Let go

No PR subscription, check-in or artifact watch is held by this session. The standing sheet stays
[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current; card 1 answered by #3397).

Spend: not available; 2026-11-16T13:50Z to 2026-11-16T15:35Z.

Greetings, you are SkyPlover (Session 667), see SkyDipper's handoff — `docs/session_667_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_667_handoff.md) — let's keep rolling with our queue.
