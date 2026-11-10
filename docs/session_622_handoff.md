---
title: "Session 622 handoff: the funding rollout day — Ready to send, Not received, Gmail, the coordinator rule, the reviewer list, and the CSM funding door"
date: 2026-11-09
session: 621 (SkyBlackEye, Sam's session, 2026-11-09 ~15:50Z to ~20:10Z)
tags: [handoff, csm-workspace, implementation-funding, commons, program-requirements-harvest, org-phrase-scope-auth]
status: current
superseded: true
superseded_by: session_625_handoff.md
---

# You are Session 622

Your moniker is **SkyCartwheel** (galaxy names). A full checkpoint (Rule 10 data writes this run), written
at the context WARN line (~105k left). The MAP team rolls the funding confirmations out to the whole team on 2026-11-10.

## What shipped (all merged unless marked)

1. **Sheet 175 answered *five*** → #2974: Music 250, Fire Technology 169, Mathematics 128, Child Development/ECE 107, English 99
   seed cards confirmed by description and TOP (753; receipts `kb/ccr_seed_confirm_out/2026-11-09/`). Docket case marked done.
2. **Open Asks Sheet 177** (current): https://claude.ai/artifact/ArGaTSSRgbYjvqb9fvKVkm — card 1 the next disciplines (rec *every
   remaining*, 26 / 584; or the next five, 354), card 2 Alameda's semester subtotals (rec *count them*). Vault CPLBrain#736.
3. **CSM Workspace for the rollout** (#2975, #2980): Ready to send (acceptance / nudge / Accept first; Sent receipt; It bounced);
   *Not received* leads (15 acceptances Oct 31 to Nov 2 that Exchange never sent: SendAsDenied on the shared mailbox); noncredit
   acceptances; From-line hint; **Open in Gmail** beside Outlook; the copied email carries the logo as bytes (data URI of
   `sierra/cpl-initiative-logo-navy-email.png`). Fallback participation deadline now 2026-12-31 (published Scenario 4).
4. **Coordinator rule** (#2979, Sam in session): a CPL Coordinator plus a CPL Assistant email in MAP meets the coordinator
   condition. `map_coordinator_summary()` gained `has_cpl_assistant`; 61 of 124 meet (was 59).
5. **Reviewer list** (#2977): Janelle Brekke added; Natalie and Chelsea at rccd.edu too. Commons status test fixed.
6. **The CSM funding door** (#2984 — see Read first): request → approve → session with no Auth email.

## Decisions Sam made this run

- Sheet 175: *five*. Coordinator rule above (his words in the funding lane). Reviewer fixes (COBIx relay, his ask).
- Funding door: **go**; **no phrase** (approval mints the session); approvers in an **Admin table** (Sam, Malone, Kristen,
  Natalie, Terence), owners Sam and Malone; **deploy today**.
- Funding is the priority over #2981 (cross-list choice) and "one place to rule" (parked).

## Read first

- **#2984 state.** Migration applied live (`funding_door`, then `funding_door_service_role_grants`): 19 policies on the seven
  funding/CSM tables + 4 read functions now take `is_funding_reviewer()`; 5 approvers seeded. If #2984 is not merged, merge it on
  a passing `test`; then dispatch `cpl-chat-deploy.yml` with `function=funding-door`, `confirm=DEPLOY` (Sam's go for today).
  Then ask Sam to have one teammate try *Ask an approver* in the CSM Workspace while he approves. Natalie and Terence have no
  Auth account yet: they approve once signed in. Known cosmetic: a door user sees the funding tab's model-editing controls
  (RLS refuses them); hide them next.
- Sam to verify tomorrow: Copy the email into Outlook and Gmail once each — does the logo survive the paste?

## Open work, in order

1. Finish #2984 (above). Then the funding tab hides config controls from a door-only session.
2. COBIx #2967 item 3 remainder: Team RACI → `allowed_reviewers` behind an explicit flag (separate PR, Sam's call on the flag).
3. #2981: *Also list as…* (cross-list) on the CCR doubt ruling menu; #2972 asks (the "applies to all N" line, the two moves).
4. "One place to rule" (Sam: build it; parked for funding): a sheet card that is also a Docket case links to the case.
5. Sheet 177's answers (read `replies` first): apply per discipline with `--expect`; Alameda per his call.
6. Your 15:12Z "Water Supply" title on `_UNCLASSIFIED::Credit by Exam` — Sam's row; ask him.
7. Carry S620's queue (`docs/session_620_handoff.md`): Cuesta's full read 2026-11-10, the cer-procedures report, student-grain
   PR 4/5, COBIx #2927; Docket step 4 (reviewer-only Open Asks table).
8. Lanes active this week that wait: `common-subjects-reference` (three HOSP anchors, 93 stray codes; its NEXT stands).

## Patterns that worked

- Reproduce a CI lint locally against `main` before blaming the PR (the Commons next_batch check was main's, caused by closing
  the case).
- The repo's grant lint caught a real defect: a table an Edge Function reads as `service_role` needs an explicit grant.
- A jsdom test caught `mountInto` dropping a new option (`door`).

## Let go

Subscriptions this session held: #2984 (drop it once merged and deployed). No check-ins, no artifact watches kept.

> *Greetings, you are SkyCartwheel (Session 622), see SkyBlackEye's handoff — `docs/session_622_handoff.md` — let's keep rolling with our queue.*
