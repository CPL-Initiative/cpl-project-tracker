---
title: Session 367 handoff — Long Beach City's 74 fixed in #2012 (re-read next), Sheet 65 card 2 answered, two UI passes
date: 2026-10-11
session: 366 (SkyHazel)
tags: [handoff, program-requirements, long-beach-city, ui-pass, decision-sheet]
status: current
---

# You are Session 367

Your moniker is **SkyAspen**. Session 366 (**SkyHazel**, `session_012HFx9U3f1J2cdYa643LfhX`) ran with Sam present for
the second half. This checkpoint ran at a context warning (108k left), so it is full but terse.

## First, in this order

0. **One writer.** `list_sessions`. S366 may still hold the #2012 subscription and check-in `trig_011KnzjKMkjpXD6rQRXUeCnJ`
   (23:42Z); if S366 is idle, take #2012 over.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `long-beach-city`, `ui-pass`, `sierra-feedback`.
2. **Read Open Asks Sheet 65's replies** (https://claude.ai/artifact/7gAZzsrv9LRLaYdQxvyFvv, current; card 2 is
   answered in chat, below, so only card 1 is open).

## Sam's decisions this run (in chat, 2026-10-11 ~23:16Z)

- **Harvest order:** *"Long Beach City's 74 (Recommended)"*: fix page matching, list the programs the catalog does not
  print, then re-read the own pages (about $0.60). `cpl_memory` `sam-lbcc-74-first-2026-10-11`.
- **Sheet 65 card 2:** *"Read from the table (Recommended)"*: CPL Pathways reads a program's record from
  `program_requirement_records` when opened (anon checked, a reviewer all, unchecked marked); the pilot file stays the
  offline tier; no per-college file. `cpl_memory` `sam-sheet-65-card-2-read-from-table-2026-10-11`. The lane's NEEDS
  SAM is gone; **the card is still in the vault builder** (`CPLBrain/decision-sheets/`): move it out and republish
  the sheet under a fresh `SHEET_ID` (cards changed), tracker change first, vault second.

## In flight

**#2012** (claude/s366-lbcc-assign), Long Beach City's two causes, code only:
- `candidates()`: a page reached only through hidden text must name the program in its heading (both-way word share,
  award words aside, never a different level). On the 74: keeps 10 own + 6 renamed/sibling pages, turns away 58.
- `best_text()`: a page with tab panels is read from its tabs, whatever share they name. Only Long Beach City's pages
  have tab panels; every other college's sources read `innerText`.
- `kb/_college_page_read.py`: `expand` now clicks a page's own tabs.
Merge on `test`, then the next steps below.

## Next in the queue

1. **Re-read Long Beach City** after #2012 merges: dispatch `program-requirements-college.yml` `step=read`, college
   Long Beach City College (the read job may run 360 minutes; Sam's go). Expect most of the 58 to come back with no
   page: that list, with COCI's status, is the college's to settle (addendum first). Load the rest (insert-only), then
   the display build (Sam's standing go). Excel's catalog prints COSA 601 and 618 where COCI lists 615-617.
2. **Build card 2:** CPL Pathways reads a record from the table when opened, as `program_requirements.js` does; then
   lift the ledger hold on `cobi:cpl-pathways` and run its UI pass.
3. **UI pass:** `python3 scripts/ui_pass.py --next` (Team Phrases and Governance done this run).

## What shipped (S366)

#2007 Governance UI pass (seeded `governance-editor`; the shell's dashed centered placeholder left on the root; Docs
panel blank after a repaint; tables reachable; dialog opaque, Escape, focus return) · #2008 `sierra_feedback` readers
filter CI rows on the server (Sierra Training was about a week from dropping real reports under its 500 cap) · #2009
the 74 reframed · #2010 Team Phrases UI pass (five unnamed inputs; "phrase phrase"; quiet warning) · #2011 Governance
Docs panel load race.

## Safety patterns

- **A seeded sweep that passes alone can fail in a sequence:** that was a real race (#2011), not a flake.
- **Screenshots catch what no check measures:** centered text under a leftover placeholder; read 320/390/1440.
- **Probe a page on the runner before spending on a re-read** (`kb/_college_page_read.py`, no model call); the
  sandbox cannot reach college hosts or the artifact store.
- **A share rule needs a floor case:** "whichever names more" loses to any page that names everything.

## Not refreshed this checkpoint

Pipeline tab (did not move); `kb/README.md`, `README.md` (no structure or surface change); no new KB note; the
decision sheet (card 2 removal deferred, above); no third UI pass (two ran).

## Sign-off line for Sam

Greetings, you are SkyAspen (Session 367), see SkyHazel's handoff — `docs/session_367_handoff.md` — let's keep rolling with our queue.
