---
title: "Session 719 handoff (from SkyPetrel, S718, Sam's plain session of 2026-11-23: Needs attention by confidence, the code-address read, check_generated covers every status file)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_726_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** If 719 is taken when you start, take the next
free number and say so in your handoff.

# You are SkyShearwater (Session 719)

From SkyPetrel (S718), Sam's plain session of 2026-11-23 to 24. A **full checkpoint**: the common-subjects-reference
and commons lanes moved, and the S717 assign receipt was edited (#3730). Skipped: steps 2 and 3 (no KB structure or
README surface changed), 7 (no re-mint, the pipeline did not move) and 9 (not a step). The `cpl_memory` rows and the
status files are the conductor's, in the same checkpoint PR.

## Open with the standing block

1. **COBIx:** as in 715, 717 and 718, Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]`
   only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the
   input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes; a fix goes ahead of the next wave only
   when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the M-IDs, so
   its fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **A CI wake that names an older head: read the current head's checks and say nothing.**
2c. **Before a push, `bash scripts/check_generated.sh` must read all ok; it now covers every kb/status file** (#3737's
   guard fails a new status file until it gets a check line or a reason).
3. **Merge order:** #3737, then this checkpoint PR if still open.

## What shipped (all merged)

- **#3728** S717's checkpoint; **#3727** the sidebar beside the view.
- **#3730** Estimating reads ESTG in the proposer, the reference's note and the S717 receipt (a `_corrected` line).
- **#3732** the Subjects view by confidence: a Needs attention column after College, wording on the confidence rule,
  *Act on it* at the top of the course panel, course lines that read *INST 273 …*, the card's quick links with
  Collect, Curate and Connect folded.
- **#3733** `kb/_subject_code_address_probe.py`: a code the catalog index omits is read at its code's address and filed
  only when the page names it in parentheses (Cerritos INST, Long Beach City CART; 22 tried).
- **#3734** the same read for pages a filed web search found and never titled (11 read, none filed).
- **#3737 (open at the checkpoint):** `check_generated.sh` covers all 31 status files (20 checked, 11 excused) with
  `tests/check_generated_covers_status_test.py`; the no-stacked-PR line in CLAUDE.md; two live-data tests relaxed.

## Read in order

1. `docs/reference/lanes/commons.md`, the *Subjects, by confidence* paragraph (its NEXT).
2. `docs/reference/lanes/common-subjects-reference.md` (Status and NEXT).
3. `docs/common_subject_code_tab_lessons.md` and `docs/engineering_practices_lessons.md`, the S718 sections.
4. `docs/kb-notes/methodology-a-hand-listed-checklist-drifts-a-guard-on-the-unlisted-item-does-not.md`.
5. `docs/coursecontrolnumber_remint.md` before the re-point.

## Sam's words this run (in `cpl_memory`)

- 21:20Z, the Subjects view: *"the most important thing to see on the list is a column to indicate the number of
  subjects that our confidence score indicates need attention. the sidebar should show immediate ways to take action."*
- On Cerritos INST: *"Seems we should have found this through our procedures...advise. Also, we need 'try web search'
  like we do for our credential catalog when we need to find the cert issuer."*
- 21:37Z: quick links under the card's headline, the sections folded but the top.
- 23:55Z, stale CI wakes: *"If there is something solid we can embed in our handoff and rules or .md. advise"* (the
  guard in #3737 and items 2b and 2c above).
- 00:20Z, memo ESS 26-75: every college (118) and district (72) row matches the dashboard's published Scenario 4; the
  errors are in the totals rows only (Appendix C's credit and noncredit totals; Appendix D puts Calbright's $150,000
  under credit and has no Calbright row). Sam: *"very help and reassiring that same errors were found"*.

**DECIDED by the session:** `d-estimating-keeps-estg-s718`, `d-subjects-needs-attention-rule-s718`,
`d-code-address-read-s718` (amends S698's never-at-an-address rule for codes the index omits),
`d-search-page-read-s718`, `d-check-generated-covers-status-s718`.

## Open work (from the lanes' NEXT)

1. **Merge #3737** on a green `test`.
2. **The web-search pass for the 206 untitled codes with no filed search** (156 not read, mostly Los Angeles district
   colleges; 50 not in the catalog), per Sam's 2026-11-21 ruling ([`commons`](reference/lanes/commons.md)).
3. **`levels()` in `commons_subjects.js`:** match names ignoring punctuation, so the card's 83% counts Los Angeles
   Trade-Technical as the table does.
4. **Southwestern PE/* to ES/*:** find a printed source, then file it in `kb/reference/subject_code_history/`.
5. **Sweep the tests that assert on live committed rows;** a test judges only what it injects.
6. **The MQ view in COBI,** `#commons/subjects/mq` (mock https://claude.ai/artifact/SHS5eNN4nb5vLkNCzzWvVE): the
   statewide list filtered to a code as its sidebar, at its own address; a link on the card; sidebar tables that sort,
   resize and open a second sidebar.
7. **Re-point the folded local codes** (ACCT, ACCTG, ACC, ACTG to ACCT; LING; HOSP; the religion codes to RLST; MCOM;
   AERO, AFROTC to MILS): a re-mint, dry run first.
8. **CIP in place of TOP for MQ type;** the outline's MQ discipline in the SLO pass; `csr-quarterly.yml` re-baselined
   on the 20th edition before January; the panel over COBI's top header bar.
9. **From handoff 718, unchanged:** Sam's ask 3 (the same process on every Commons card); probe round 2 and the eLumen,
   curriQunet and CourseLeaf filers; the code history's next readers; the mint takes Confident calls; the 787 Unsure
   codes; FLNG and Athletics into KINE; his twelve AED titles, then one re-mint.
10. **Waiting, by slug:** `cer-procedures`, `my-college-action-page`, `program-requirements-harvest`. S718 moved none.

## Patterns that worked

- Treat a page guess as evidence only when the page names the code; record every miss as tried.
- Hand a worker the whole view ask with Sam's words; check the screen, not the code.

## Pitfalls

- A generated file that reads another goes stale when that one is rebuilt: run `check_generated.sh` and read every line.
- The daily sync brings person saves into committed files; a test asserting on those rows breaks, and the save wins.
- Every `lints` Python check locally takes about 10 minutes; `check_generated.sh` about 33 seconds.

## Let go

At sign-off: the PR watches on #3737 and the checkpoint PR. No COBIx watcher ran; no artifact watches.

Spend: not available; 2026-11-23T20:48Z to 2026-11-24T00:55Z.

Opening line: *Greetings, you are SkyShearwater (Session 719), see SkyPetrel's handoff — `docs/session_719_handoff.md` — let's keep rolling with our queue.*
