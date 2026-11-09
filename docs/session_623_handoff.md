---
title: "Session 623 handoff: the eve of the rollout — the door live, 30 days, the cards, the noncredit attestation, the Noncredit CPL Lead rule, To do then Browse"
date: 2026-11-09
session: 622 (SkyCartwheel, Sam's session, 2026-11-09 ~20:20Z to ~22:30Z)
tags: [handoff, csm-workspace, implementation-funding, reviewer-session-lifetime, commons, college-district-identity]
status: current
---

# You are Session 623

Your moniker is **SkyButterfly** (galaxy names). A full checkpoint, written at the context WARN line (about 120k left).
The MAP team rolls the funding confirmations out to the whole team on 2026-11-10. COBIx (the account `cobi-cto`)
reviews every PR and files issues that relay Sam; `docs/reference/cobix_pr_loop.md` says how to answer.

## What shipped

1. **The funding door is live** (#2984's front end reached the site at 20:44Z after three failed Pages deploys; Sam's own
   request was approved and signed in at 20:51Z). **The approver's side** (#2987): *Access requests* always draws for an
   approver, with *Check now*; each read carries the session's current token.
2. **A sign-in lasts 30 days in the browser** (#2988; COBIx found no defect).
3. **Each priority card opens the list its figure counts** (#2990): views `coordmet`, `ncmet`.
4. **A door sign-in reads the model as published** and keeps the review controls (#2991: `reviewing()`, `unlocked()`).
5. **A credit college's noncredit attestation is seen** in the workspace and the Nudge (#2993; 3 institutions before,
   111 after). The Nudge's list grows.
6. **The Noncredit CPL Lead role in MAP meets the Noncredit CPL Lead condition** (#2996; the function change is applied
   and read back: Chaffey, LA Mission; near titles at Napa, Fresno City).
7. **The Courses List's filter words in To do and Browse** (#2998, issue #2997; `filterGroups` in `commons_list.js`).

## Decisions Sam made this run (his words are in the lanes and in `cpl_memory`)

- Sign-in: *"30 days sounds good"*; *"everyone if cobix is OK with it"*.
- The Noncredit CPL Lead role: *"yes"* to both recommendations (the role meets the lead condition alone; the exact title
  only, a near title flagged). Under the published Scenario 4 that releases the noncredit share with no attestation; he
  was told and has not asked for the form to stay required.
- The action center's list: *"go"* on COBIx's proposal (#2990's thread). The Courses List: *"see his comments on 2997"*.
- COBIx may take review tasks while a session builds: *"cobix can work on the new task if you want to stick to the door
  sign in."*

## Read first

- **Open PRs at sign-off:** #2996 and #2998 if either is not merged. Both regenerate `kb/dependency_map.json`: merge the
  green one, then merge main into the other, run `python3 kb/_build_dependency_map.py`, `bash scripts/check_generated.sh`,
  push, and merge on a passing `test`. Then check the site serves them (`curl` the served file for a new word; a failed
  deploy takes a fresh `pages.yml` dispatch).
- `docs/reference/lanes/csm-workspace.md` (the S622 paragraph and NEXT 0) and `implementation-funding.md` (the Noncredit
  CPL Lead paragraph under Status).

## Open work, in order

1. **`csm-workspace` NEXT 0, Sam's go:** the action center's menu in two groups (To do, Browse) with `<optgroup>`, two
   added lists (*No CPL Coordinator in MAP*, *Declined*), and a short gap word on each progress card (issue #2989). Then
   answer on #2990's thread and close #2989.
2. **Issue #2995** (COBIx relaying Sam): the Courses List keeps the current row in view after a ruling. `commons` lane.
3. **`reviewer-session-lifetime` NEXT:** a door sign-in whose 30-day grant lapsed on an open tab says the access ended and
   offers *Ask an approver* (earliest 2026-12-09). Natalie and Terence have no Auth account yet; each approves once in.
4. **`college-district-identity`:** the daily identity check crashes (`kb/_build_college_identity_crosswalk.py` line 327)
   and its step stays green. Fix the reader, then make the step fail when the builder does.
5. **`implementation-funding`:** the Noncredit card's name once the role in MAP counts beside the attestation; a CSM
   follow-up to Napa and Fresno City to use the role.
6. Carried from handoff 622, untouched this run: COBIx #2967 item 3 remainder (Team RACI into `allowed_reviewers` behind
   a flag, Sam's call on the flag); #2981 (*Also list as…* on the CCR doubt ruling menu) and #2972's asks; "one place to
   rule" (a sheet card that is also a Docket case links to the case); Sheet 177's answers (read `replies` first:
   https://claude.ai/artifact/ArGaTSSRgbYjvqb9fvKVkm, still current, two cards open); the "Water Supply" title on
   `_UNCLASSIFIED::Credit by Exam` (Sam's row; ask him); S620's queue (Cuesta's full read 2026-11-10, the cer-procedures
   report, student-grain PR 4/5, COBIx #2927, Docket step 4); `common-subjects-reference` (three HOSP anchors, 93 stray
   codes).
7. **`org-phrase-scope-auth` NEXT (waits; this run's auth work was the door and the 30-day sign-in):** read
   `team_pass_attempts` after the first real failed unlock to settle the IP question; COBIx's console items; steps 5
   and 6; Sam's go on the role column.
8. **`program-requirements-harvest` NEXT (the CPL Queue routine's, untouched here):** the ten loaded colleges read once
   more for objectives, after Cuesta's full read on 2026-11-10.
9. Sam to verify, from handoff 622: Copy the email into Outlook and Gmail once each; does the logo survive the paste?

## Not refreshed by this checkpoint

`kb/status/*.json` (this run did not touch the harvest; the queue routine's stamp of 11:50Z stands), `kb/README.md`,
`README.md`, the pipeline view, KB notes (none this run), and no new decision sheet (nothing new waits on Sam; Sheet 177
stays current).

## Patterns that worked

- When a person says a new feature is missing, look at what the site serves before debugging the feature.
- A count that looks small beside the database (0 of 3 over twelve rows) is a defect until traced.
- Put the reviewer's questions in the PR body under *For COBIx*; it answered three PRs within minutes.
- `apply_migration` timed out on its prompt; the committed file through `supabase-migrate.yml` applied in four minutes.

## Let go

Subscriptions this session held at sign-off: #2996 and #2998 (drop each once merged). No artifact watch. Any check-in
still scheduled is named in the session's last message.

> *Greetings, you are SkyButterfly (Session 623), see SkyCartwheel's handoff — `docs/session_623_handoff.md` — let's keep rolling with our queue.*
