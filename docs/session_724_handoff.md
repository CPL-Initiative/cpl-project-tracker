---
title: "Session 724 handoff (from SkyBooby, S723, Sam's plain session of 2026-11-24: the Commons top section, Rulings to find, Common subject in doubt)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows the routine's own newest
handoff, never this file. **Numbering:** if 724 is taken when you start (a funding session ran beside this one and merged
#3777, #3779, #3780 and #3783), take the next free number and say so in your handoff.

# You are SkySandpiper (Session 724)

From SkyBooby (S723), Sam's plain session of 2026-11-24 (~15:55Z to ~19:20Z). A **light checkpoint**: no Roadmap row
moved, no re-mint, no Rule 10 data receipt. Skipped: step 2 (no KB structure change), step 3 (no tab joined or left),
step 5 (no kb-note crossed the bar), step 7 (the pipeline did not move).

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint PR. The funding session's PRs are its own; leave them.

## What shipped (all merged)

- **#3778** the Commons top section: Phase 1 Dates in two columns, each a date and a graph; Needs you holds only ranked
  links to what waits; every link lands highlighted on the card link that holds its item (`jump(id, to, ref)`); the
  outline list and term reports moved into Courses data, the catalog list into Colleges and catalogs, held exhibit
  titles into a held check; counts read one live figure.
- **#3781** Rulings to find (was Fixes owed) asks COBI by a prewritten issue; the doubt list is a Needs you item;
  COBIx never rendered on the Commons.
- **#3784** no cost bars (*"we just need the trend line"*); Back to CPL Commons survives a tab's redraw (`watchBack`).
- **#3787** (after the checkpoint) Accept and Move on each course row, not the M-ID heading (*"the courses should be curated individually under their mid course heading"*): Accept writes `mid_member_confirm` (new field, DR-25); Move re-homes by `merge_into` from a dropdown in the row; every course settled saves the card's Keep. Title hover shows the catalog description.
- **#3785** the Courses List's **Common subject in doubt**: full lists in both groups, codes beside names, the panel
  says a ruling assigns a common subject, **Accept** on each band, the column **Local subject**.

## Sam's words this run (verbatim, 2026-11-24)

- *"need you section should only show prioritized links to things that need me ... it should not show things I have
  already acted on"*; *"Make sure all numbers are dynamically updated when action is taken"*.
- *"I don't remember anything about those rulings..."*, *"maybe cobix can find them..."*.
- *"don't refer to cobix as, like sky, it is an internal tool..."*.
- *"the purpose of this action is to assign the course to a common subject ... we would never"* move it to another
  local subject; *"It would help to always label common subjects as 'common subject' vs. 'Local Subject' on surfaces"*.
- *"it would be convenient to be able to accept the current common subject on the in doubt course directly on the
  course row"*.

**RULED:** `r-cobix-never-rendered-sam-2026-11-24`, `r-label-common-vs-local-subject-sam-2026-11-24` (both in
CLAUDE.md). **FACT:** `f-five-doubt-rulings-not-recalled-s723`. **DECIDED (his to revise):**
`d-eta-two-columns-matching-graphs-s723`, `d-needs-you-links-only-s723`, `d-fixes-owed-ask-is-an-issue-s723`,
`d-doubt-list-in-needs-you-s723`.

## Read in order

1. `docs/reference/lanes/commons.md`, the *LIVE (S723 ...)* paragraph and its NEXT.
2. `docs/commons_lessons.md`, S723.

## Open work (from the lanes' NEXT)

1. **Sam is ruling on the Common subject in doubt cards.** Ask how row Accept and Move worked; KINE M1267 needs Cabrillo KIN 38A moved to a KINE yoga M-ID (Sam's PEDS ruling moved both of its courses); then add a short
   *why in doubt* line to each band (the reason now sits only in the panel).
2. **Common subject / local subject labels and COBIx out of rendered text** in the other tabs, each at its UI pass.
3. **CI, the second half** (S722's item 0): on a docs-only PR skip the lint steps that rebuild a generator; rebalance
   the four shards by a fresh run's step times.
4. **Derived titles into `kb/status/local_subject_titles.json`** as their own column; measure `WEB_SHARE`; the 0-100
   bar on every other confidence display.
5. **The CSR lane (`common-subjects-reference`):** ECONMT and Electricity's adult-education codes, Sam's refile in Local subjects; the MQ sections
   re-read as its own pass.
6. **Implementation funding (`implementation-funding`)** (the other session's lane this week): its NEXT holds card 11's two measure texts and the
   six carried strategies; leave it to that session unless Sam points you there.
7. **Waiting, by slug:** `cer-procedures`, `my-college-action-page`, `program-requirements-harvest`.

## Patterns that worked

- Check a figure another agent typed in before a page states it as a person's act.
- Reproduce a lost link with a test that redraws the destination pane; mutation-check the fix.
- Read a new PR's number from the create result; a guess subscribes the wrong PR.

## Pitfalls

- The local server and Playwright were refused; never route around it; say what was not verified in a browser.
- `CLAUDE.md` is over its 60,000-byte budget (about 65 KB); a rule added there should move prose out to match.

## Let go

At sign-off: no PR watch remains (#3778, #3781, #3784, #3785 merged; their watches and check-ins ended). No COBIx
watcher, no artifact watches.

Spend: not available; 2026-11-24T15:55Z to 2026-11-24T19:25Z.

Opening line: *Greetings, you are SkySandpiper (Session 724), see SkyBooby's handoff — `docs/session_724_handoff.md` — let's keep rolling with our queue.*
