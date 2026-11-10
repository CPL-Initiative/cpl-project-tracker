---
title: "Session 633 handoff: the Funding Follow-up Dashboard's review opens itself, the panel holds the links, templates a reviewer can change"
date: 2026-11-10
session: 626b (SkyUmbrella, Sam's side session on handoff 626, 2026-11-10 13:37Z to ~16:30Z)
tags: [handoff, csm-workspace, program-requirements-harvest]
status: current
---

# You are Session 633

Your moniker is **SkySilverDollar** (galaxy names). Handoff 632 (SkyPhoenix) was written by the CPL Queue routine at
13:55Z and never ran; its queue is carried below, so read this one, not that one. A **full** checkpoint: the run added a
table (`csm_templates`, through `supabase-migrate.yml`, with its receipt). Skipped as not moved: the pipeline view (no
Roadmap row or auditor count moved), `kb/README.md`, a new decision sheet (see Open work 2).

## At the start

Sam opened on handoff 626 with *"Build Malone's mock changes on the vault main's copy (CPLBrain #749, artifact version
15)"*. That was already done (#749, #751); Malone has sent no further changes. He then asked for handoff 631's queue, which
the routine (S631) was already working, so this session stood off it. Then, looking at the live dashboard, he asked why
the review needed a click and why links left the page, and said **go on all five** fixes, then asked for editable
templates. Sam drove the whole run.

## What shipped (all merged, each its own revert)

1. **#3061** A waiting request's review opens in the side panel by itself; a **Review** word closes and reopens it.
2. **#3063** The scroll gate is gone (reverses Sam's 2026-11-02 *"unless they seen that section"*, on his go): Deny is
   open, Accept waits on the checks.
3. **#3064** Implementation Funding in the record opens the drawer, which shows the CO Monitor's note.
4. **#3066** The CPL landing page draws in a sandboxed frame in the panel, and behind *Show the landing page here* in the
   review; never this site's own origin; the new-tab link stays. Carries COBIx's four fixes.
5. **#3067** Contacts on file and the people filter sit in People; the pop-ups and their code are gone.
6. **#3068** **Email templates**: a reviewer-only pane edits the four emails the dashboard writes (the lead ask, both
   asks, the nudge, the follow-up); every save kept in `csm_templates` (insert-only, `is_funding_reviewer()`, DR-09); a
   save refuses to write over a teammate's newer version; with nothing saved the emails match the old wording word for
   word in 32 cases.

## Sam's decisions this run

- *"It's Sam, go on all five"* (2026-11-10 ~13:58Z): the five changes above, including lifting the scroll gate.
- *"can you add a place for me or any reviewer to make changes to the templates for these and later make additional
  changes if needed?"*: the template pane, open to any funding reviewer.
- *"cobix is your sidekick on this and will add comments"*: read `cobi-cto`'s comments on every PR before merging.

## Read first

- `docs/reference/lanes/csm-workspace.md` (the two LIVE paragraphs dated 2026-11-10, NEXT 0), then
  `docs/csm_workspace_lessons.md` (2026-11-10 section) and the KB note
  `docs/kb-notes/methodology-a-repaint-must-keep-what-the-reader-opened.md`.
- **The site:** check the served `csm_workspace.js` for `tplHtml` and `sideOf` (a failed Pages deploy takes a fresh
  `pages.yml` dispatch, never a rerun).

## Open work, in order

Built from the lanes:

1. **`program-requirements-harvest`** (from handoff 632): Las Positas passes 145 of 193; its local degrees wait on Sam's
   computed-GE card (the 2026-27 LPC-GE page prints units per area and no total; read job 129867813238's log for its
   figures). Confirm display run 42825327646 committed its applied record. #3056 (draft) still open. De Anza (#3044)
   waits on the two GE sheets. Alameda's semester layouts are Sheet 178 card 2. Step 11's full read and the UI pass fall
   to the first firing of 2026-11-11 UTC.
2. **Sam answered this session's three asks in session (*"yes to all"*, 16:4xZ):** the two lead emails are on
   (the last PR of this run), door sign-ins may change templates, and `supabase-migrate.yml` applies wait for his approval. That
   last needs his repository setting (Settings > Environments > database > Required reviewers); check the next apply's
   run for an approval record. **The next Open Asks sheet** still needs the `cer-procedures` card and De Anza's, built on
   CPLBrain #746's builder (Sheet 178, an open draft); until then the open-asks coverage check reads stale.
3. **`csm-workspace` NEXT 0** otherwise: the sign-in with *Ask an approver*, the funding drawer's Priorities lines, the
   side-menu label on the live site, Malone's four questions (he has sent nothing new). NEXT 1 and 2: the hover cards
   and every landing-page role; the denial email.
4. **`cer-procedures`:** the re-analysis's Jev runner job.
5. **`commons` NEXT:** Teach a rule on every reference, the Course auditor's count, the `--cmn` tokens.
6. **`implementation-funding`:** the funding email sender waits on RCCD IT's grant of the mailbox.
7. **`library`:** DSP Version 3 waits on Sam's Replace; IACA waits on Crystal; the Microsoft 365 connector waits on RCCD.
8. **`college-district-identity`, `reviewer-session-lifetime`:** carried; their NEXT lines stand.
9. **#2894** (COBIx inbox, draft) is Sam's to review.

## Patterns that worked

- **One concern per PR, stacked:** each change a commit on its own branch; after each squash merge,
  `git rebase --onto origin/main <old commit>` the next and regenerate `kb/dependency_map.json`.
- **Pin shipped text before templating it:** run the old function from `main` beside the new one over every case and
  commit the old output as a fixture (`tests/fixtures/csm_templates_shipped.json`).
- **Merge on `test`, after reading COBIx:** its workflow reads *skipped* (`COBIX_REVIEW_ENABLED` off), yet `cobi-cto`
  comments within about ten minutes; every one this run found something real.

## Safety patterns to honor

- A repaint keeps what the reader opened (the KB note). Check an element id is free before minting one (`cw-tpl` was
  the composer's).
- `expectedHeadSha` is the full SHA from `git rev-parse`, never an extended abbreviation.
- A migration that times out on the connector's prompt goes through `.apply`; its bot receipt lands on the branch, so
  rebase before the next push.

## Let go

Every PR subscription ended with its merge (#3061, #3063, #3064, #3066, #3067, #3068); the one-shot check-ins
*Funding dash PR chain* and *Templates table check* fired and are spent. No artifact watch. Open, not this session's:
#3056, #3044, #2894.

> *Greetings, you are SkySilverDollar (Session 633), see SkyUmbrella's handoff — `docs/session_633_handoff.md` — let's keep rolling with our queue.*
