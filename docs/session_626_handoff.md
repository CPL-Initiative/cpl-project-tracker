---
title: "Session 626 handoff: the MAP role stands in for the whole noncredit attestation, Cal State LA carries its ruling, the Nudge logs itself"
date: 2026-11-10
session: 625 (SkyWhale, Sam's session, 2026-11-10 ~03:00Z to ~04:15Z)
tags: [handoff, csm-workspace, implementation-funding, college-district-identity]
status: current
superseded: true
superseded_by: session_637_handoff.md
---

# You are Session 626

Your moniker is **SkyUmbrella** (galaxy names). A **light** checkpoint, written at 4 commits past handoff 625 with 428k
of context left: no Roadmap row moved, no re-mint, and the run wrote no data (three `cpl_memory` rows aside). Sam opened
the session with the queue and gave no new ruling in it. COBIx (`cobi-cto`) reviews every PR;
`docs/reference/cobix_pr_loop.md` says how to answer. Run `/coord` before you start.

SkyCocoon's session was still open at the start, holding #3031 (Sam's ruling on the noncredit role, docs only). It
merged that PR and let go of the tracker; its vault note is `CPLBrain#743`, a draft left for Sam.

## What shipped

Merged and on main:
1. **The exact MAP title *Noncredit CPL Lead* stands in for the whole noncredit attestation, in the funding tab**
   (#3033, handoff 625 item 2; Sam, in session 2026-11-10: *"Nc yes exact wor whole"*, then *"Word"*). The role meets
   `nc_team` as well as `nc_coord`; a college with the role is offered no form, counts as attested in the filter, and a
   form it left waiting shows no chip. The workspace record reads *Noncredit share: complete* for such a college.
   Nothing differs on the page under Scenario 4, which hides the strike-team condition.
2. **Cal State LA carries Sam's 2026-10-04 ruling in place of `unknown`** (#3034, item 3). The identity lint reads
   `kb/non_ccc_institutions.json`; a name it covers is class `non_ccc`, with the entry's own `decided_by` and
   `decided_on`. The artifact was re-baselined in the same PR (9 findings). In the tab a ruled name keeps its class once
   the live contacts load, which also corrects `Calbright College Credit`.
3. **The Nudge logs itself** (#3035, `csm-workspace` NEXT 3). After a download or a copy, *Log this Nudge* writes one
   `csm_log` entry for each institution in the list that left COBI, with a follow-up a week out, in one request on the
   reviewer's credential. It files once a window.

## Decisions this run

- **Sam:** none new in session. His 2026-11-10 words on the role carried item 1.
- **Mine, for Sam to reverse if he prefers:** the Nudge's log is written on the reviewer's press, after the export,
  and never on download. COBI sends nothing, so a download does not show the merge went out. COBIx agreed.
- **Mine:** the reviewer's confirmations panel in the funding tab still lists a role college's form on file, so Accept
  and Reject stay reachable. It feeds no count outside that panel.
- **Carried, for Sam's word, no hurry:** dropping `cpl_funding_notes`' two unread columns; whether a widened CR rule
  group counts as plain kept (#3027).
- **Open for Malone, unchanged:** Recommended action above or below the four conditions; the People, landing page and
  History panel under the record or as a third column; whether the row pills earn their place; a menu or visible words
  for the filter. He has more UI changes to send.

## Read first

- `docs/reference/lanes/csm-workspace.md` (NEXT 0 to 2, and the two new bullets on the role and the Nudge), `implementation-funding.md`
  (the Noncredit CPL Lead paragraph), `college-district-identity.md`.
- **The site:** check the served `cpl_funding.js` for `nudgeLog` and `Noncredit CPL Lead in MAP` under `nc_team`, the
  served `cpl_funding_nudge.js` for `Log this Nudge`, and the served `college_identity_data.js` for `non_ccc`. A failed
  Pages deploy takes a fresh `pages.yml` dispatch, never a rerun.
- The mock for #3010 (not built; nothing from it goes live without Sam's word):
  https://claude.ai/artifact/Bj8psKPeZS3DFHmgcSpoeL, source in the vault at
  `04-projects/cpl-initiative/csm-workspace-mock/20261110_csm_workspace_clarity_mock.html`.

## Open work, in order

1. **Malone's remaining UI changes, in the mock, one version each.** Then, on Sam's word, **build the mock into the
   live workspace** (`csm-workspace` NEXT 0).
2. **`commons` NEXT** (the path mock): Teach a rule on every reference (a new write surface, so Governance first,
   Rule 10 a3); the Course auditor's confidence count, which needs a receipt of what the auditor scored before a person
   changed the card; the other references' paths; then every Commons view on the `--cmn` tokens. KINE M1142 still has
   no saved ruling; Sam's to rule.
3. **`csm-workspace` NEXT 1 and 2:** the hover cards and landing-page roles; the denial email. Both come from the mock.
4. **`college-district-identity` NEXT:** MAP supplies the two `awaiting_map_id` ids; nothing on our side.
5. **`reviewer-session-lifetime` NEXT:** one real-browser round trip (sign in, the other open tab signs in, drag and
   Save on Admin, sign out, both stay out). It waits on a person at a browser; this session could not run it.
6. **`library`:** Sam's Replace on the ELL Healthcare Pathways piece, or his next note.
7. Carried, untouched: COBIx #2967 item 3 remainder (Team RACI into the reviewer list behind a flag); #2972's ask;
   "one place to rule"; Sheet 177's answers (read `replies` first: https://claude.ai/artifact/ArGaTSSRgbYjvqb9fvKVkm,
   still current, two cards open; this session did not read its replies); the "Water Supply" title on
   `_UNCLASSIFIED::Credit by Exam`; S620's queue; `common-subjects-reference`; `org-phrase-scope-auth` NEXT;
   `program-requirements-harvest` NEXT.
8. Sam to verify, from handoff 622: Copy the email into Outlook and Gmail once each; does the logo survive the paste?
9. **CI weight (issue #2927):** `tests/csm_workspace.test.js` needs more than Node's default heap. New CSM and funding
   checks go in their own file, as this run's three did.

## Not refreshed by this checkpoint (light)

`kb/README.md`, `README.md`, the pipeline view, KB notes (none), the lessons docs, every file under `kb/status/` (this
run touched no common reference), and no new decision sheet (nothing new waits on Sam; Sheet 177 stays current).
`npm run a11y` was not run for #3035: one underlined-word button of an existing class inside the Nudge dialog.

## Patterns that worked

- **COBIx found a real defect on all three PRs**, each within minutes: a workspace line that told a role college *not
  yet attested*; who-ruled parsed from a file-wide source line, which would have named Sam on the next entry added;
  and a log that filed what was checked at the press, with a test of mine locking that fault in. Put *For COBIx* in the
  body and read the answer before merging.
- **A comment can fail a test.** `tests/csm_workspace.test.js` 6d refuses any `#` followed by three to six hex digits
  in `csm_workspace.js`, and a PR number in a comment (three zeros, three threes) matched. Write *PR 3033* there.
- **A test hook can read a fixture as loaded.** `_setElig` sets `ncAttestOk` true when `ncAttest` is given at all;
  pass `ncAttest: null` to test the loading state.
- **A check wake names a commit.** Four of this run's wakes named a superseded head; read `get_check_runs` on the
  current head every time.
- When a second PR touches a generated file the first one changed, merge main into it and rebuild the maps.

## Let go

Subscriptions at this writing: this checkpoint's PR (dropped once merged). #3033, #3034 and #3035 are merged and
unsubscribed. No check-in is scheduled and no artifact is watched.

> *Greetings, you are SkyUmbrella (Session 626), see SkyWhale's handoff — `docs/session_626_handoff.md` — let's keep rolling with our queue.*
