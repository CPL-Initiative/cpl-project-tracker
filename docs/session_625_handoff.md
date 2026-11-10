---
title: "Session 625 handoff: the funding tab says when access has ended, the decline pieces leave, a ruling can cross-list, the identity baseline is current"
date: 2026-11-10
session: 624 (SkyCocoon, Sam's session, 2026-11-10 ~01:05Z to ~02:40Z)
tags: [handoff, csm-workspace, reviewer-session-lifetime, college-district-identity, commons, discipline-crosslist, implementation-funding]
status: current
---

# You are Session 625

Your moniker is **SkyWhale** (galaxy names). A **light** checkpoint, written at 10 commits past handoff 624 with 265k
of context left: no Roadmap row moved, no re-mint, and the run wrote no data (three `cpl_memory` rows aside). Sam gave
no new ruling this run; he opened the session and the queue ran. The MAP team rolls the funding confirmations out to
the whole team on 2026-11-10. COBIx (`cobi-cto`) reviews every PR; `docs/reference/cobix_pr_loop.md` says how to
answer. Run `/coord` before you start.

**Two sessions ran on handoff 624.** Sam pasted the SkyCocoon greeting into a second session at 01:43Z
(`session_01Rvwe2U562qR7UqfSmi4LXw`). It took the `commons` NEXT (the path mock's items, `kb/status/commons.json`,
`lanes/commons.md`, branches `claude/s624b-*`) and stayed out of the CSM, funding and identity files; this session
stayed out of the Commons view. It merged #3024 (a stalled routine, or a backlog that stops shrinking, becomes a queue
item). If it checkpoints it writes `docs/session_626_handoff.md`: read the highest-numbered
handoff, and this one beside it for the lanes named here.

## What shipped

Merged and on main:
1. **The two PRs handoff 624 left open** (#3014 the reviewer's role field, #3015 the sender's title on both public
   forms; #3016, its database half, was already applied).
2. **The college identity baseline is current** (#3019): the committed input is the 2026-11-10 read (129 names,
   verified live), the artifact carries 9 findings, and the daily check's issue (#3018) opened on the old baseline and
   closed itself on the next run. Readers ask `kb/_college_identity_latest.py` for the newest baseline; the Futuro
   Health builder is pinned on purpose and says so.
3. **A noncredit Accept run pins the reviewer's role** (#3021, COBIx's ask on #3014), in its own six-second test file.
4. **The funding tab says when a sign-in's funding access has ended** (#3022, the `reviewer-session-lifetime` NEXT):
   the note, *Ask an approver*, the review and model controls gone, and a check set from each answer so an idle tab
   picks up an approval.
5. **The funding tab's decline pieces left** (#3023, `csm-workspace` NEXT 0a): the mark, its chip, the Nudge's gray
   row. `cpl_funding_notes` keeps its two columns, unread.
6. **A doubt ruling can keep the home discipline and also list a second one** (#3025, issue #2981): one
   `cross_listed_disciplines` row, the home and the M-ID untouched. `kb/discipline_list.py` splits a list of
   disciplines against the MQ names, since two names carry commas; the generator reads through it.

**After #3025's merge the daily run regenerates `unified_courses_data.js`:** one umbrella record's `xdisc` loses three
phantom disciplines (*Refrigeration*, *Heating*, *American*). Expect that diff; it is the fix.

## Decisions this run

- **Sam:** none new. His 2026-11-09 rulings carried the work (no decline piece; the reviewer adds the sender's role).
- **A correction to carry:** this session wrote that what Cal State LA is waited on Sam, then found his word already
  in the identity lane (2026-10-04: the first CSU campus on MAP, kept in the mix, `kb/non_ccc_institutions.json`).
  Nothing waits on him there. Read the lane's own paragraphs, and the PR threads, before calling anything his.
- **Relayed, to confirm in one line:** COBIx relays Sam's word on #2999 (2026-11-09 22:22Z) that the exact MAP title
  *Noncredit CPL Lead* stands in for the **whole** noncredit attestation: no form needed, a waiting form counts as
  complete, and the form stays out under Scenario 4. Handoff 624 and the lane had carried the strike-team half
  (`nc_team`) as open for him, and this session repeated that until COBIx pointed at the thread (#3028). #3012 built the
  workspace's half. The funding tab's half is open work item 2 below: ask Sam *yes* on the relay, then build.
- **For Sam's word, no hurry:** dropping `cpl_funding_notes`' two unread columns, with a migration that rewrites the
  table's check in the same step.
- **Open for Malone, unchanged (asked, not yet answered):** Recommended action above or below the four conditions;
  the People, landing page and History panel under the record or as a third column; whether the row pills earn their
  place; a menu or visible words for the filter. **He has more UI changes to send.**

## Read first

- `docs/reference/lanes/csm-workspace.md` (NEXT 0 and 0b), `reviewer-session-lifetime.md`, `college-district-identity.md`
  (its NEXT), `commons.md` (the *Also list as* sentences).
- **The site:** check the served `cpl_funding.js` for `cplFundAccessAsk` (#3022) and that `data-declineset` is gone
  (#3023), and the served `coci_lookup.js` for `also list as` (#3025). A failed Pages deploy takes a fresh `pages.yml`
  dispatch, never a rerun.
- The mock for #3010 (not built; nothing from it goes live without Sam's word):
  https://claude.ai/artifact/Bj8psKPeZS3DFHmgcSpoeL, source in the vault at
  `04-projects/cpl-initiative/csm-workspace-mock/20261110_csm_workspace_clarity_mock.html` (on the vault's main).

## Open work, in order

1. **Malone's remaining UI changes, in the mock, one version each.** Then, on Sam's word, **build the mock into the
   live workspace** (`csm-workspace` NEXT 0).
2. **The role in MAP meets the whole noncredit attestation, in the funding tab** (`csm-workspace` NEXT 0b, on Sam's
   *yes* to COBIx's relay): `ncCondList` lets the role meet `nc_team` as well as `nc_coord` (tests 1f and 1g flip), the
   Attest control and the *Noncredit CPL Lead attested* filter read the role, and the comments in `ncCondList` and
   `map/supabase_map_contacts.sql` say so. Nothing differs on the page until a scenario shows `nc_team`.
3. **`college-district-identity` NEXT:** the crosswalk builder's lint reads `kb/non_ccc_institutions.json`, so Cal
   State LA's finding carries Sam's 2026-10-04 statement in place of `unknown`; then re-baseline (the class changes,
   so the daily check will say the set moved once).
4. **`commons` lane is 1.3 times its budget** (26.5 KB against 20): move its finished paragraphs to
   `docs/commons_lessons.md` at the next checkpoint (the second session holds that lane; check what it did first).
   Then **`commons` NEXT** (the path mock: Teach a rule on every
   reference; the confidence count; the other references' paths). KINE M1142 still has no saved ruling; Sam's to rule.
5. **`csm-workspace` NEXT 1 to 3:** the hover cards and landing-page roles; the denial email; Nudge logs itself.
6. **`library`:** Sam's Replace on the ELL Healthcare Pathways piece, or his next note.
7. Carried, untouched: COBIx #2967 item 3 remainder (Team RACI into the reviewer list behind a flag); #2972's ask;
   "one place to rule"; Sheet 177's answers (read `replies` first: https://claude.ai/artifact/ArGaTSSRgbYjvqb9fvKVkm,
   still current, two cards open, no reply at 01:10Z 2026-11-10); the "Water Supply" title on
   `_UNCLASSIFIED::Credit by Exam`; S620's queue; `common-subjects-reference`; `org-phrase-scope-auth` NEXT;
   `program-requirements-harvest` NEXT.
8. Sam to verify, from handoff 622: Copy the email into Outlook and Gmail once each; does the logo survive the paste?
9. **CI weight (issue #2927):** `tests/csm_workspace.test.js` takes 2 min 40 s and needs more than Node's default heap
   (`tests/run.js` gives it 12 GB). New CSM checks go in their own file, as #3021's did.

## Not refreshed by this checkpoint (light)

`kb/README.md`, `README.md`, the pipeline view, KB notes (none), a lessons doc beyond the three notes #3023 put in
`docs/cpl_funding_lessons.md`, `kb/status/` other than `course.json`, and no new decision sheet (nothing new waits on
Sam; Sheet 177 stays current).

## Patterns that worked

- **COBIx found a real defect on four of six PRs**, each within minutes: two pinned readers (three more turned up on a
  search), a check that fired once, a doc that still described removed controls, and two discipline names with commas.
  Put *For COBIx* in the body and wait for the answer before merging.
- **Rebuild on both sides before repointing a reader.** Three builders moved to the new identity baseline with their
  outputs byte for byte the same; the proof took a minute each.
- **Stand the timers in.** A test that answers no twice and checks the third ask would have caught the once-only check.
- **A removal gets tests that pin the absence**, fed the old field, so a stale caller is shown to be ignored.
- When two PRs touch a generated file, merge one, merge main into the other and rebuild; never pick sides.

## Let go

Subscriptions at this writing: this checkpoint's PR (dropped once merged). Every other PR this session opened is
merged and unsubscribed. No check-in is scheduled and no artifact is watched.

> *Greetings, you are SkyWhale (Session 625), see SkyCocoon's handoff — `docs/session_625_handoff.md` — let's keep rolling with our queue.*
