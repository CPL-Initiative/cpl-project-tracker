---
title: "Session 624 handoff: the action center in two groups, the Courses List keeps your row, the identity check runs again, a sign-in whose funding access ended says so"
date: 2026-11-09
session: 623 (SkyButterfly, Sam's session with Malone joining, 2026-11-09 ~22:30Z to 2026-11-10 ~01:00Z)
tags: [handoff, csm-workspace, commons, college-district-identity, reviewer-session-lifetime, implementation-funding, library]
status: current
superseded: true
superseded_by: session_625_handoff.md
---

# You are Session 624

Your moniker is **SkyCocoon** (galaxy names). A **light** checkpoint, written at 7 commits past handoff 623 with 405k of
context left, then refreshed near 95k: no Roadmap row moved and no re-mint. One additive migration ran (#3016, receipt in its PR). The MAP team rolls the funding confirmations
out to the whole team on 2026-11-10. COBIx (`cobi-cto`) reviews every PR; `docs/reference/cobix_pr_loop.md` says how to
answer. Run `/coord` before you start.

## What shipped

Merged and on main:
1. **The action center's menu in two groups** (#3001), then **the workspace after the walkthrough with Malone** (#3012,
   issue #3010): the priority cards are gone, every menu label carries its list's count, the coordinator lists sit under
   Browse, the Noncredit CPL Lead is met by the role in MAP or an accepted attestation, and there is no decline piece.
2. **The Courses List keeps the row you rule on** (#3004). 3. **The daily college identity check reads its names** (#3005).
4. **A sign-in whose funding access has ended says so** (#3007).

Open at this writing, each waiting on `test` (merge each on a pass; the second to merge takes main and regenerates):
- **#3013** the divider between the queue and the record (COBIx's three findings fixed in d96c0be1).
- **#3014** the reviewer's field for the sender's role, kept in the acceptance's `csm_log` entry.
- **#3015** both public forms require *Your title at the college* when the sender picks Other; `selfPost` falls back.
- **#3016** the database half of #3015, **already applied and read back** (two `attestor_title_text` columns,
  `cpl_funding_sender_titles()`; anon cannot read either). Merge it so main holds the migration and its `.apply`.

**The mock for #3010** (not built; nothing from it goes live without Sam's word):
https://claude.ai/artifact/Bj8psKPeZS3DFHmgcSpoeL, source `CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/
20261110_csm_workspace_clarity_mock.html` (vault branch `claude/s623-csm-mock-2`; open its PR and merge it if it is not
on the vault's main). It opens as a signed-in reviewer sees the workspace, at full width.

## Decisions this run (Sam's words are in `cpl_memory` `sam-csm-workspace-after-the-walkthrough-2026-11-09` and the lanes)

- **Sam:** the cards go; no college-declining piece (a blank confirmation is the indicator); the Noncredit CPL Lead ask
  is for the role in MAP and an attestation is accepted too; he chases the missing coordinators
  (`#csm-workspace/coord`); the side-by-side panes resize; the reviewer adds the sender's role; the sender is required to
  give a title when they pick Other; in the mock, only what a reviewer sees, full width, Implementation Funding opens a
  side drawer (*"love the simple side bar with link to go full monty if needed"*), access requests sit quietly in the
  header, and Accept says what it does.
- **Malone (in session 2026-11-10, giving UI changes one at a time so each rolls back):** 1, the summary as scannable
  metrics, number above label, the deadline set apart, still clickable; 2, the college list with what needs the CSM
  above what waits on the college, every badge kept, each line a specific next action; 3, skipped by him; 4, *This
  visit* becomes *Recommended action*, the email section is *Email preview* with recipient, subject and message apart
  and *Edit email*. All four are in the mock, each as its own version. **He has more to send.**
- **Open for Sam:** whether the role in MAP also counts for the strike-team condition (`nc_team`, hidden in every
  scenario today; `csm-workspace` NEXT 0b).
- **Open for Malone (asked, not yet answered):** Recommended action above or below the four conditions; the
  People, landing page and History panel under the record or as a third column; whether the row pills earn their place;
  a menu or visible words for the filter.

## Read first

- The four open PRs above. Then `docs/reference/lanes/csm-workspace.md` (the S623 paragraphs and NEXT 0, 0a, 0b),
  `implementation-funding.md` (the sender's title paragraph), `reviewer-session-lifetime.md`.
- **The site:** check the served `csm_workspace.js` for `cw-grant-h` (#3007) and `ncMet` (#3012); a failed Pages
  deploy takes a fresh `pages.yml` dispatch, never a rerun.

## Open work, in order

1. **Malone's remaining UI changes, in the mock, one version each.** Then, on Sam's word, **build the mock into the
   live workspace** (`csm-workspace` NEXT 0): the metrics, the two-group list with specific next actions, the record as
   four conditions with *Recommended action* and the email preview, the funding drawer, access requests in the header,
   the side panel and the one people list of #2978, and the sign-in with *Ask an approver* as the one lead action.
2. **`csm-workspace` NEXT 0a and 0b:** the funding tab's own decline pieces can leave; `nc_team` and the role.
3. **`reviewer-session-lifetime` NEXT:** the funding tab's own review controls for a sign-in whose access ended.
4. **`college-district-identity`:** the first working run of the daily check should raise the `college-identity` issue
   (`California State University Los Angeles` new; two trailing-space names gone). Rule on it, then re-baseline.
5. **`commons` NEXT** (the path mock). KINE M1142 still has no saved ruling; it is Sam's to rule again.
6. **`library`** (the ELL Healthcare Pathways side session's lane): Sam's Replace, or his next note.
7. Carried from handoff 623, untouched: COBIx #2967 item 3 remainder; #2981 and #2972's asks; "one place to rule";
   Sheet 177's answers (read `replies` first: https://claude.ai/artifact/ArGaTSSRgbYjvqb9fvKVkm, still current, two
   cards open); the "Water Supply" title on `_UNCLASSIFIED::Credit by Exam`; S620's queue; `common-subjects-reference`;
   `org-phrase-scope-auth` NEXT; `program-requirements-harvest` NEXT.
8. Sam to verify, from handoff 622: Copy the email into Outlook and Gmail once each; does the logo survive the paste?

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

Subscriptions at this writing: #3013, #3014, #3015, #3016 and this checkpoint's PR (drop each once merged), and the
mock artifact's watch. No check-in is scheduled.

> *Greetings, you are SkyCocoon (Session 624), see SkyButterfly's handoff — `docs/session_624_handoff.md` — let's keep rolling with our queue.*
