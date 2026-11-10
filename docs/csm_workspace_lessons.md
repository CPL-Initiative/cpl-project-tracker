---
title: "CSM Workspace and the funding confirmations: lessons"
date: 2026-11-02
tags: [lessons, csm-workspace, implementation-funding, crm, confirmations]
artifacts:
  - cpl_funding.js
  - funding-model/edit_page.js
  - tests/cpl_funding_conditions_filter.test.js
  - tests/funding_page_requirements_edit.test.js
  - CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/
related:
  - "[[implementation-funding]]"
  - "[[cpl_funding_lessons]]"
---

# CSM Workspace and the funding confirmations

The team's communications with colleges about CPL Implementation Funding: accepting confirmations and noncredit
attestations, the emails, the follow-ups, and the CSM Workspace mock that would hold them. Started S554 (SkySombrero),
2026-11-02, the first day the team (Sam with Kristen) worked college requests at volume.

## S554 (2026-11-02): the funding asks, then the workspace mock

**Shipped on the funding tab** (#2701, #2703; lane: implementation-funding):

- Sam: *"I need to be able to edit (screenshot) Eligibility Requirements text but don't see that I can"*. The public
  page painted the list from the model and typed its note into markup, and *Edit this page* offered nothing there. Each
  condition now carries a ref (`coord`, `part`, `extra:<i>`, `nc_coord`, `nc_team`) the page's editor reads and writes
  through `reqText`/`setReqText`; the Noncredit CPL Lead line, typed into `requirementsList()`, resolves through the
  layers (`ncCoordLabel`). The payload (`funding_model_payload.js`) must carry new fields (`refs`, `introHtml`), or the
  page never sees them: the first test run caught exactly that.
- A **Show** filter on the table reads `baselineGate()`, the gate the pie and the released figure share, so it cannot
  disagree with them. A public-rendering test bans every select but Step 1's chooser; the filter, a reader's control,
  joined that exemption (`cpl_funding_gate_ledger_public` U1).
- **Email** beside Revoke reopens the acceptance email. Before it, the only way back to a closed email was Reject then
  Accept, which is how LA Mission's confirmation went missing until Sam re-confirmed it (20:15Z, the 17:19 request
  kept).
- The review lane now shows each request's conditions, contacts, the CO Monitor's note and the noncredit attestations.

**Kristen saw none of the reviewer controls** (no Accept, no notes, no Eligibility editing). She was on
`allowed_reviewers`; the auth audit log showed her link requested from Chrome on Windows (19:54Z) and opened in Chrome on
a Mac (19:55Z). A magic link signs in the browser that opens it. Read `auth_audit_logs` (`user_confirmation_requested`
then `user_signedup`, each with its user agent) before suspecting code. The team phrase never opens the funding tab
(named reviewers only since 2026-08-28).

**The CSM Workspace mock** (https://claude.ai/artifact/LLjcCzVzq7sqtPEjnebMYf, version 11; source and porting notes in
`CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/`): Commons look, priority cards, an action center, templates
with To/Cc/More Cc/Subject editable, a contacts popup, a mail merge for particular actions, and a review gate that holds
Accept and Deny until the requirements are seen and checked. A Fable design review reshaped version 2: the two items
needing the team now lead the six cohort counts, one control sets the filter, and Accept sits apart from Mark declined.
Sam: *"I will want to extend this to other activities, like onboarding colleges to MAP; communicating on activity
cards"* (braindump 2026-11-02 2205): the log, templates and follow-ups belong to an activity, not to the funding tab.

**Measured for the mock, 11-02:** landing pages that list people, 105; of them a CPL Coordinator 30, a CPL Counselor
45, MAP's primary CPL contact by name 35, a Noncredit CPL Lead 4 (`map_landing_contacts`, freehand titles grouped by
role; 13 role kinds in all). Of the 10 confirmed colleges, 4 meet all three conditions; the 6 held all lack a complete
coordinator record in MAP, 3 also the veteran JSTs. MAP's directory and the landing page disagree on the coordinator at
Marin and Butte (the page lists one, the directory none).

**Next (S554):** read the Slack channel, then plan the tab. Both done in S555, below.

## S555 SkyTadpole (2026-11-02/03): the workspace ships, with its log and its contacts

- **One read, never a second copy.** The tab paints from `CPL_FUNDING_TAB.csm.snapshot()`, one record per institution
  built from the funding tab's own `eligReqList`, `baselineGate`, rows and review RPCs, and decides through
  `csm.act`, which calls the review lane's own Accept, Deny, Follow up and Email. The two tabs cannot disagree, and a
  decision here is the same write and the same email (#2707).
- **A condition still loading reads as qualifying, never held.** The funding gate fails open; the first stageOf put a
  pending condition in *held*, which would have told the team to chase colleges that had met everything.
- **`csm_log` is keyed by activity, never by module** (`activity` 'funding' today), so MAP onboarding and the activity
  cards join without a table. A trigger stamps who wrote and who closed from the JWT, so no writer can name another.
- **A force-push re-runs `supabase-migrate.yml`** when the branch's `.apply` differs from main, and its receipt commit
  is a bot push that starts no CI: the PR shows no checks until your next commit. The migration is idempotent, so the
  second apply changed nothing.
- **A directory name keeps its comma.** Splitting MAP's `cpl_coordinator` on commas made *Rivera, Ana* two people;
  names split on a new line or a semicolon, addresses on commas too (#2709).
- **Dark `--surface` is translucent glass**; a popup over the page takes `--surface-opaque`, at a specificity the
  ported rules cannot override.
- **The default email follows the stage:** a confirmed college got the confirmation nudge in the first screenshot.
  Look at a seeded record in a real browser before shipping; the jsdom suite passed with the wrong default.
- **The Slack channel is `#mapanditpiteam`** (the ITPI CSMs and the MAP team); it carries college requests the log
  should hold. Proposed: a reviewer's *Log from Slack* entry with the thread link, never an automatic import.

## 2026-11-09 (S621 SkyBlackEye): the rollout day

- **The mailer cap is the bottleneck, not the reviewer list.** The Auth mailer sends two emails an hour for the whole
  project. With a team signing in at once, magic links stop arriving. The funding door (#2984) mints a session with admin
  generate_link + verify, which sends nothing, after an approver says yes in the workspace.
- **A remote image is not a logo in a pasted email.** Outlook and Gmail often refuse to fetch it. The copy now carries a data
  URI of a 7 KB email copy; a mailto or Gmail compose URL can never carry one.
- **"Accepted in COBI" is not "the college heard back."** Fifteen acceptances (Oct 31 to Nov 2) failed at Exchange
  (SendAsDenied, the shared mailbox in the From line). The Sent receipt is the only proof the workspace has; Not received
  resends the ones from before the log.
- **An Edge Function reading a table as service_role needs an explicit grant** in this project (the grants lint caught it).
- **A new mount option must be passed through `mountInto`**, or the box renders without it (the door button; a jsdom test
  caught it).

## 2026-11-09 (S622 SkyCartwheel): the eve of the rollout

- **Merged is not served.** The door merged and both Pages deploys after it were refused (*in progress deployment*); a
  third timed out at *syncing_files*. Sam reported the door "not working" while the database and the Edge Function were
  live and the request table held no rows. The check that settled it was a `curl` of the served `reviewer_signin.js`
  for the new words. Fix per troubleshooting: a fresh `pages.yml` dispatch, never `rerun_failed_jobs`.
- **A panel that reads on a timer must rebuild its headers each read.** *Access requests* kept the headers from its
  first read; the keeper replaces the token within the hour, the kept one is refused, and a refused read drew as an
  empty queue. An approver with the page open through a rollout would have stopped seeing requests with no error.
- **A section that draws only when it has rows hides where the work arrives.** An approver with nobody waiting saw
  nothing and could not tell where to answer a request. The approver's section now always draws, with *Check now*.
- **A helper that hides a literal hides a dependency.** Moving `rpc/<name>` into a helper's argument concatenation
  dropped two RPCs from the dependency map; the call sites keep the literal path so the map still finds them.
- **A roster row carries no award figure.** `ncAttestShown()` read `nc_award` off whatever row it was handed. The table
  hands it a shaped row; the workspace's snapshot and the Nudge handed it a roster row, so both saw the three
  noncredit-only institutions alone (*0 of 3* over twelve attestations on file, seven of them waiting). A count that
  looks small beside what the database holds is worth tracing before anyone trusts the card.
- **A what-if is not a safe fallback for a reviewer.** Giving a door sign-in the signed-out visitor's private what-if
  would have let a stray edit change the minimum conditions that CSM's acceptance email quotes. The model reads as
  published for a door sign-in, and that browser's what-if is set aside.
- **The connector's migration prompt can time out with nobody there to answer.** `apply_migration` asked for a
  confirmation on a `drop function`, waited 230 seconds and applied nothing. Rule 10 (c) is the route: the committed
  file through `supabase-migrate.yml`, whose receipt commit is a bot push that starts no CI, so a commit of your own
  follows it.
- **Two PRs that touch the same module both regenerate `kb/dependency_map.json`,** which carries line numbers, so
  the second always conflicts. Merge main into it and run the builder; never pick a side.
- **The suite outgrew Node's default heap.** `tests/csm_workspace.test.js` builds the funding tab once per case and
  needs the runner's `--max-old-space-size=12288` when run by hand.

