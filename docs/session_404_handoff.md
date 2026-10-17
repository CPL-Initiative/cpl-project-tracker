---
title: "Session 404 handoff: one PDF reader from two, LA City and Pierce rescored, Sheet 88 open"
date: 2026-10-17
session: 403 (SkyYarrow)
tags: [handoff, program-requirements, catalog-sweep, pdf, display-build, decision-sheet, scheduled-sessions]
status: current
---

# You are Session 404

Your moniker is **SkyBuckeye**. Session 403 (**SkyYarrow**) ran as three CPL Queue firings on 2026-10-17. Both the 05:12Z
(`session_016Lf2LaZHLhdR4sVRv7gPXD`) and the 06:12Z (`session_01W9R5gmJpRQdYY3hL7tRfMm`) firings claimed handoff 403,
because neither could list sessions. The 08:12Z firing (`session_01Gqh1pvRKdgJqTeus9AYoud`) merged their work and wrote
this handoff. If the routine started you, follow `docs/reference/scheduled_sessions.md` first. With no `list_sessions`
tool, read the open PRs and their comments before you write anything (added S403).

## What shipped (S403)

- **#2189 (05:12Z), the PDF wave:** a whole-catalog PDF reader and fifteen colleges loaded unchecked, 1,725 records:
  Clovis 100, Barstow 56, Calbright College Credit 11, Compton 73, Lassen 59, Mendocino 93, Woodland 64, Canyons 148,
  Los Angeles City 223, Harbor 107, Pierce 173, Valley 204, Santa Rosa 222, Shasta 103, Yuba 89. Extraction cost
  $149.41. Display build `7f4744e8e4ae` was applied (run 39011116868), along with fifteen procedure records. Cerro
  Coso's robots.txt disallows its PDF.
- **East Los Angeles, 120 records loaded unchecked (06:12Z, run 39012416324)** through a second PDF reader. That
  reader's PR, #2190, is closed in favor of #2192.
- **#2192 (08:12Z): one reader.** It keeps #2189's reader and folds in East LA's signals: the printed control number,
  a heading naming title and award, dot-leader contents lines, `pdf_unproven()`, and a procedure step that follows
  only a PDF. Free reconcile runs on the first merge caught three regressions before any load, all fixed with tests
  (lessons S403, the merge). Build `b153d6b70ef8` was removed unapplied. Build `726bde512dfa` covers 11,862 programs.
- **LA City and Pierce rescored for free.** The scorer now reads a line-break hyphen printed with spaces. LA City's
  outcomes failures went from 145 to 12 and Pierce's from 85 to 15. Rereads 39018615618 and 39018617236 replaced 156
  and 94 rows, each with a rollback receipt.
- A reconcile now stamps a rescored record with its run, so a reread posts it. It also refuses a page other than the
  one the record was extracted from.
- **Open Asks Sheet 88** ([link](https://claude.ai/artifact/WkqwWZTrLCXffyzrNihLfG), current, two cards). Sheet 87
  ([link](https://claude.ai/artifact/2MXnDExf1kzV3F8XpH2YUj)) is superseded; its store held no reply at 09:30Z.
- 85 colleges hold 11,862 records, 32 checked. Lessons: `docs/program_requirements_harvest_lessons.md`, S403 (three
  sections). S372-S385 moved to archive 2.

## Decisions Sam made this run

None. The routine started all three firings and Sam did not write.

## In flight at sign-off (check each first)

1. **#2192:** merge it once `test` passes on its head. Then dispatch `program-requirements-college.yml` from `main`
   with `step=display` (build `726bde512dfa`), and confirm the applied record on `main`.
2. **Sheet 88's replies.** Read the `replies` store first.
   - Card 1, "correct": the five registry rows, as handoff 403 item 2 describes.
   - Card 2, "pasted": read back the counts the card names (LA City 96 rows on run 39006380342 and 127 on 39018419466;
     Pierce 99 on 39006383070 and 74 on 39018421038). Then drop the lane's S403 marker.
   - The repo already holds those 49 records as they were.
3. **Thirteen `claude/s403-rescore-<college>` branches and two `claude/s403-recon-*` branches** stay on the remote,
   unmerged. The recon pair is folded into #2192. The thirteen hold reconciles run before the moved-page guard, and their
   checks fell, so they are discarded. Sessions cannot delete branches.

## Priority, in order

1. Sam's reaction to My College's Sierra (S400's screenshots); still unanswered.
2. The three items above.
3. **An own-HTML reader for the 20 colleges** that print their own catalog pages. American River, Folsom Lake and
   Sacramento City share Los Rios's shape, so start there. A free page read of one host's outline comes first.
4. Procedure records for LA City's and Pierce's reconcile runs (39018419466, 39018421038) and East LA's v1, merged.
5. Santiago Canyon's Catalog Archives (handoff 403 item 4), Diablo Valley, SmartCatalog (Crafton Hills, Taft),
   Coursedog (Hartnell, Merced), and CCSF's PDF by section.
6. **The UI pass is due on MAP Data Quality** (`map_data_quality.js`, never audited). Raw hex palette, an emoji mark,
   pill controls: a PR of its own.
7. The procedure generator: a repeatable `--load-receipt`, a `--reread-receipt`, and a `--merge` that skips recorded runs.

## Patterns and safety

- **A reconcile run tests a reader change for free.** Compare its summary's `found` against the filed read before any
  load. It caught a 194-to-76 loss at Pierce this run.
- **The Supabase guard holds an UPDATE.** Put it on the sheet as a paste card; never route around it.
- One branch per college. Dispatch every read with `college=`. Poll with `git ls-remote` and the filed JSON.
- `get_check_runs` on a PR whose head a college run also used lists those runs too: look for `test` by name.

## Not refreshed this checkpoint

- The Pipeline tab (step 7): no phase moved.
- The UI pass (step 9): the fix is a PR of its own, and the merge held the run. The ledger keeps MAP Data Quality due.

## Subscriptions and check-ins

S403 held no PR subscription, no check-in and no artifact watch (the remote session cannot watch artifacts). Nothing
to drop.
