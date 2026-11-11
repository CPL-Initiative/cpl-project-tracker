---
title: "Session 630 handoff: the clarity mock is built into the live workspace, now the Funding Follow-up Dashboard; two emails held for Sam; the sign-in not built"
date: 2026-11-10
session: the second Session 624 session (SkyCocoon), Sam's and then Malone's, 2026-11-10 01:43Z to ~11:30Z
tags: [handoff, csm-workspace, commons, implementation-funding, mock]
status: current
superseded: true
superseded_by: session_637_handoff.md
---

# You are Session 630

Your moniker is **SkyCartwheel** (galaxy names). A **light** checkpoint, written at 140k of context left. This session
ran beside the routine's sessions 625 to 629 on its own lanes. It wrote no data except four `cpl_memory` rows. Run
`/coord` before you start.

## What shipped

1. **The CSM Workspace clarity mock, built into the live tab on Sam's "go ahead and build it" (09:50Z).** Four pull
   requests, each one revert: the list (#3049), the record (#3050), the side panel (#3052), and the header (the PR
   that carries this handoff). The page reads **Funding Follow-up Dashboard** (Malone, in session: the MAP team does
   most of this work). What each built, and the rules COBIx's reviews changed, are in `lanes/csm-workspace.md`,
   *LIVE: the clarity mock, built*.
2. **The mock itself**: its summary filters and search work (version 15), and it carries the new name (version 16):
   https://claude.ai/artifact/Bj8psKPeZS3DFHmgcSpoeL, source on the vault's main (CPLBrain#749, #751).
3. **The go-live note** (CPLBrain#750, a draft left open for Sam): fourteen items, eight decisions, and now what was
   built on his go.
4. **Three Commons items, earlier in the session** (#3024, #3027, #3029): in handoff 625.

## Read first

- **`lanes/csm-workspace.md` NEXT 0**, the list of what is left from the build.
- **The two new emails are off.** `LEAD_MAIL_ON` in `csm_workspace.js` is false until Sam has read the Noncredit CPL
  Lead ask and the both-in-one email (their words are in `seedMail`). Ask him; turning them on is one word and one
  check (5d5a) to update.
- **The live site**: confirm the tab draws (the metrics, the two groups, the conditions table, the panel, the drawer)
  and that the side menu reads *Funding Follow-up Dashboard*. A failed Pages deploy takes a fresh `pages.yml`
  dispatch, never a rerun (handoff 629 saw three time out).

## Open work, in order

1. **Sam's read of the two emails**, then turn them on.
2. **The sign-in** with *Ask an approver* as the one lead action (`reviewer_signin.js`; it changes the funding tab's
   sign-in too). Not built.
3. **Malone's four open questions and his next changes** (lane NEXT 0). Sam's: whether *Funding* in the name fits a
   second activity.
4. **The funding drawer's Priorities lines** (`cpl_funding.js` would pass them in the snapshot).
5. **Everything in handoff 629's *Open work***, untouched here: Sheet 178's answers, the catalog sweep, the
   `cer-procedures` Jev runner job, `commons` NEXT.
6. **`scripts/check_generated.sh` reads *open-asks sheet coverage* stale** for a `cer-procedures` marker, on `main`
   too: the next Open Asks sheet needs that card (and De Anza's, per handoff 629).

## Not refreshed by this checkpoint (light)

`kb/README.md`, `README.md`, the pipeline view, KB notes, a lessons doc, `kb/status/`, the wiki, and no new decision
sheet: Sheet 178 (https://claude.ai/artifact/25QifpeGgtQGJgUiJpt4Pk) stays current, and the go-live note's eight
decisions were carried out on Sam's go. The `csm-workspace` lane stands at 21.5 KB against its 20 KB budget; compact
it at the next checkpoint.

## Patterns that worked

- **A stack of branches, one per piece, each rebased onto `main` as the one below merged.** A generated file that
  conflicts is regenerated, never picked.
- **Run every test file that mentions the tab, not the tab's own alone.** #3050 went red on a source check in
  `cpl_funding_nc_lead_in_map.test.js` that the tab's test never runs.
- **`node --max-old-space-size=12288`** for `tests/csm_workspace.test.js`; the default heap runs out.
- **COBIx found something real on every pull request**: the order inside Needs you, Sent for a hand-picked template,
  the hold on unread emails, focus after a decision. Read its comment before the checks finish.
- **A look in a browser without Supabase**: render the tab in jsdom over the test fixture, write the page out, and
  open that file in Chromium.

## Let go

No subscription, check-in or artifact watch is held once the header PR merges. CPLBrain#750 stays an open draft on
purpose.

> *Greetings, you are SkyCartwheel (Session 630), see SkyCocoon's handoff — `docs/session_630_handoff.md` — let's keep rolling with our queue.*
