---
title: "Session 624 handoff: the action center in two groups, the Courses List keeps your row, the identity check runs again, a sign-in whose funding access ended says so"
date: 2026-11-09
session: 623 (SkyButterfly, Sam's session, 2026-11-09 ~22:30Z to ~23:40Z)
tags: [handoff, csm-workspace, commons, college-district-identity, reviewer-session-lifetime, implementation-funding, library]
status: current
---

# You are Session 624

Your moniker is **SkyCocoon** (galaxy names). A **light** checkpoint, written at 7 commits past handoff 623 with 405k of
context left: no Roadmap row moved, the run wrote no data and no re-mint. The MAP team rolls the funding confirmations
out to the whole team on 2026-11-10. COBIx (`cobi-cto`) reviews every PR; `docs/reference/cobix_pr_loop.md` says how to
answer. Run `/coord` before you start.

## What shipped

1. **The action center's menu in two groups** (#3001, closes #2989): To do, then Browse, as `<optgroup>`s; two added
   lists (`nocoord`, `declined`); a gap word on the Noncredit and coordinator cards that counts the list it opens. A
   college that declined leaves the chase list (COBIx's finding).
2. **The Courses List keeps the row you rule on** (#3004, closes #2995): the list engine's public `redraw` puts the
   scroll back (`redrawKeep` in `commons_list.js`, so every List gets it), the current row and its band are marked, and
   the Discipline in doubt panel's ruling, edits and SkyView link sit apart.
3. **The daily college identity check reads its names** (#3005): the builder takes a bare name or a record; a failed
   check now annotates the run and notes the `college-identity` issue, whose title follows the latest note.
4. **A sign-in whose funding access has ended says so** (#3007): the CSM Workspace asks
   `is_funding_reviewer()`; on `false` it draws the note and *Ask an approver*; the door's later words (declined,
   lapsed) reach the note through `cpl-funding-door-said`. No database change.

## Decisions Sam made this run

None new. He asked for `/coord` with the ELL Healthcare Pathways side session and said to keep rolling with item 3
while the PRs finished. Everything built came from handoff 623's queue and his earlier "go" on COBIx's proposal.

## Read first

- **The site:** #3001's own Pages deploy failed (run 2899, the *syncing_files* timeout again); run 2900 carries it.
  the site served `nocoord` at 23:39Z. Check #3007 the same way (`curl` the served `csm_workspace.js` for `cw-grant-h`); a failed deploy takes a fresh `pages.yml` dispatch, never a rerun.
- The lanes: `csm-workspace.md` (the S623 paragraph, NEXT 0, 0a, 0b), `commons.md`, `college-district-identity.md`,
  `reviewer-session-lifetime.md`.

## Open work, in order

1. **`csm-workspace` NEXT 0, 0a, 0b, with `implementation-funding`'s Noncredit card** (one change): the card's name
   once the Noncredit CPL Lead role in MAP counts beside the attestation; a waiting attestation at a college with the
   role (COBIx on #3001: it still reads *waiting on the team*); a declined college out of *Not yet confirmed* and
   Today's count, changed together with the funding tab's Nudge so both agree. A CSM follow-up to Napa and Fresno City
   to use the role.
2. **`reviewer-session-lifetime` NEXT:** the funding tab's own review controls still draw for a sign-in whose access
   ended; give them the workspace's note. Natalie and Terence have no Auth account yet; each approves once in.
3. **`college-district-identity`:** the first working run of the daily check (the next `map-users-sync.yml` run) is
   expected to raise the `college-identity` issue: `California State University Los Angeles` is new in the live tables
   and two trailing-space names are gone (129 live against the committed 130). Rule on the new name in
   `kb/reference/college_identity_rulings.json`, then re-baseline the committed input and artifact in a reviewed PR.
   Its standing NEXT: MAP supplies the two `awaiting_map_id` ids.
4. **`commons` NEXT** (the path mock: Teach a rule on every reference, and the rest of that line). KINE M1142 (First Aid
   and CPR) still has no saved ruling; it is Sam's to rule again now that #3004 is live.
5. **`library` (the ELL Healthcare Pathways side session, #3000, #3006, its own PRs):** the lane's NEXT is Sam's
   Replace, or his next note. That session wrote no handoff; its cohort name is `library-hp-s623@bot`.
6. Carried from handoff 623, untouched: COBIx #2967 item 3 remainder (Team RACI into `allowed_reviewers` behind a
   flag, Sam's call on the flag); #2981 and #2972's asks; "one place to rule"; Sheet 177's answers (read `replies`
   first: https://claude.ai/artifact/ArGaTSSRgbYjvqb9fvKVkm, still current, two cards open); the "Water Supply" title
   on `_UNCLASSIFIED::Credit by Exam` (Sam's row; ask him); S620's queue (Cuesta's full read 2026-11-10, the
   cer-procedures report, student-grain PR 4/5, COBIx #2927, Docket step 4); `common-subjects-reference` (three HOSP
   anchors, 93 stray codes); `org-phrase-scope-auth` NEXT (read `team_pass_attempts` after the first real failed
   unlock); `program-requirements-harvest` NEXT (the CPL Queue routine's).
7. Sam to verify, from handoff 622: Copy the email into Outlook and Gmail once each; does the logo survive the paste?

## Not refreshed by this checkpoint (light)

`kb/README.md`, `README.md`, the pipeline view, KB notes (none), a lessons doc (nothing retired), `kb/status/` other
than `course.json`, and no new decision sheet (nothing new waits on Sam; Sheet 177 stays current).

## Patterns that worked

- A `check_suite.completed` wake named a superseded commit seven times this run. Read `get_check_runs` on the current
  head every time.
- A step with `continue-on-error` that sets no output looks like a quiet day. Give the failure its own step.
- When two PRs touch the dependency map, merge one, then merge main into the other and rebuild; never pick sides.
- COBIx answered each PR within minutes when the body carried *For COBIx*; three of its findings were real and small.

## Let go

Subscriptions at this writing: #3009, this checkpoint (drop once merged). One check-in was set for 23:44Z (`trig_01DemD77dYFjdeVJ93o8rGFL`);
it is canceled at sign-off if it has not fired. No artifact watch.

> *Greetings, you are SkyCocoon (Session 624), see SkyButterfly's handoff — `docs/session_624_handoff.md` — let's keep rolling with our queue.*
