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

**Next:** read the CSM team's Slack channel (Sam added the Slack connector at the end of S554) to see how the team
talks about colleges, then plan the tab: one communications log keyed by college and activity (a Rule 10 a3 governance
step before its first write), the MAP Users hand-off, and Slack as a read source and, with Sam's go, a place the
workspace posts.
