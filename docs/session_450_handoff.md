---
title: "Session 450 handoff: the harvest queue after S448, Palo Verde's new catalog, a curriQunet view, Hartnell by its site"
date: 2026-10-22
session: 449 (SkyBuckwheat)
tags: [handoff, program-requirements-harvest, my-college-action-page]
status: current
superseded: true
superseded_by: session_452_handoff.md
---

# You are Session 450

Your moniker is **SkyMariposa**. Session 449 (**SkyBuckwheat**) was opened by Sam with the standard line and spent the
run on the harvest queue S448 left; two side sessions ran beside it (the funding session that answered Sheet 114, and a
Scenario 4 session on `claude/pensive-keller-qy1qwx`), one writer per file. Read, in order: this file,
`docs/reference/lanes/program-requirements-harvest.md`, `docs/program_requirements_harvest_lessons.md` S449, then
`docs/reference/lanes/my-college-action-page.md` (Sam has still not seen the fold's step 3 live).

## What shipped

- #2360: the Common Subjects Reference's scope note is a paragraph, so its handbook link is an inline text link.
- The page reader's `cq_view` (claude/s449-reads, not yet merged): a curriQunet entry read through the catalog's own
  JSON as the capture reads it. Berkeley City's credit Multimedia Arts pages print every listed code on a Requirements
  tab; main's capture never read that child page (lessons S449).
- `route=site` (claude/s449-hartnell-site, not yet merged): a dispatch input that reads a Coursedog catalog from its
  program search instead of its PDF procedure step. Hartnell's run read 0 of 105: the vendor-hosted pages link no
  Requisites tab (page read 39853502958 has their tab links and data calls; read its log first).
- Free captures under the S443-S447 rules: Palo Verde 54 to 66 of 68 on its new Acalog catalog (2026-2027), all 66
  extracted (run 39852997888); Cypress 260 to 274, 18 extracted (run 39853370754); Victor Valley 178 to 176, a
  correction (two department course lists); Mt. San Antonio (run 39848026989) and Long Beach City (39848042355) were
  still capturing at the checkpoint; Berkeley City's free capture on the current reader (run 39853098819) too.
- Settled by reading: Mt. San Jacinto's remaining gaps are the catalog's; Ohlone's 15 low-coverage programs are not in
  its 2026-2027 guide under the state's lists; Hartnell's PDF lacks 31 programs (S411 had measured it).

## Decisions Sam made this run

None in session. The funding side session recorded Sheet 114's rulings (#2359); CLAUDE.md's pointer reads Sheet 114,
answered, no card open, until Sheet 115 publishes.

## Open work, in order

0. **Land what the runner filed.** Palo Verde: load (`step=load` on `claude/harvest-palo-verde-s449`), reread, then
   one display build on the branch and a PR; Cypress the same on `claude/harvest-cypress-s449`. Compare Mt. San
   Antonio's and Long Beach City's previews with main's captures (the script in lessons S449's style: found, not
   found, page-claimed, gained, lost); extract only what moved. Berkeley City's preview: if the Multimedia Arts
   programs are still unfound, make `cq_pages` read an entry's child pages whenever its page shows a list, not only
   when the navigation record says `haschildbodynavs`, verify with `cq_view`, then extract (27 programs, about $2).
1. **Hartnell by its site.** From page read 39853502958, teach `cd_pages` the tab the vendor-hosted catalog names (or
   the data call it makes), re-run `route=site` free, and if it reads the 100, make the site route Coursedog's default
   and retire the PDF step; S411's 31 unprinted programs are the prize.
2. **Merge the two reader branches** (claude/s449-reads carries three plans and `cq_view`; claude/s449-hartnell-site
   carries `route=site` and one plan): one PR each, test green, squash.
3. **Sheet 115 card 1** (the 25 older-build rows, with Victor Valley's two department-list records): read its replies
   before acting; a removal needs a receipt with before-values.
4. **The next thin colleges** by the live list (under 60%): Skyline is COCI's ceiling, Canyons' missing 100 are
   noncredit; Cañada 56%, San Mateo 56%, East LA 59%, Marin 59% have had no S443-S447 free capture.
5. Two standing offers from S448, neither a card: retarget Sierra Training's *Try it in: My College* to CPL Pathways'
   section; whether CPL Pathways keeps My College's decision-right row.

## Lessons to honor

- Check what the repo already answered before measuring: S411 had already explained Hartnell's 31.
- A rendered view is not the capture's reading when the catalog draws its tabs from JSON; read the JSON as the
  capture does (`cq_view`), and a PDF by the codes the state lists, not by the program's title.
- A free capture can correct as well as gain: a count that falls may be a wrong page refused.
- Measure a disagreement before calling it the reader's: four of this run's five gaps were the catalog's.

## Other sessions and the routine

The funding side session finished (Sheet 114 answered, #2359 and CPLBrain#437). The Scenario 4 side session
(session_01FQcwC1NjSSdGHGPHWMcUgQ) took the noncredit funding lane's build only. The CPL Queue routine's next
firing is 05:12Z on 2026-10-23.

## Emergency close (21:20Z)

S449 closed at the context meter's EMERGENCY line (49,592 tokens left) after a light checkpoint. Refreshed: the
harvest lane, lessons S449, this handoff, INDEX and catalog, the status file, seven cpl_memory rows, the vault note.
Not refreshed: kb/README, README, kb-notes, the pipeline view, the four other references' run logs. **Sheet 115 is
built in the vault (`decision-sheets/open-asks/2026-10-22-open-asks-115.html`, chips injected, on CPLBrain#438) and
NOT published**: publish it as a Claude artifact with `capabilities: {db: {}, comments: {}}`, record it in
`decision_sheets.md`, the Library and `kb/status/program-requirements.json` `calls`, and move CLAUDE.md's pointer line
from Sheet 114 to 115. The vault's coverage check reads the tracker's main, so merge cpl-project-tracker#2361 before
CPLBrain#438. PRs left open at close: #2361 and CPLBrain#438 (both subscribed by S449; take them over).

## Let go

At this checkpoint S449 still holds the harvest branches' runs and no PR subscription (#2360 merged and
unsubscribed); the sign-off handoff names anything left.
