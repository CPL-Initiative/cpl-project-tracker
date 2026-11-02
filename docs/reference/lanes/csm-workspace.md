---
title: "CSM Workspace / the team's queue for each college — lane state"
created: 2026-11-02
updated: 2026-11-02
tags: [reference, roadmap-lane, csm-workspace, implementation-funding, crm]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[implementation-funding]]"
  - "[[communications]]"
---

# CSM Workspace / the team's queue for each college

**What this lane is:** one COBI tab (`#csm-workspace`, *Funding*) where the CPL Initiative team sees what waits on it
for each college and acts on it: requests to review, follow-ups and acceptances, with the record of what was said.
Sam, 2026-11-02 (S554): *"Can you publish a mock for a CSM workspace for handling the comms (notes, follow ups,
acceptances, etc.) for the colleges? Thinking of a tab linked from the internal view formatted like CPL Commons with
priority cards at top and action center below like a customer management system."* Then: *"I will want to extend this
to other activities, like onboarding colleges to MAP; communicating on activity cards, etc."* (braindump
`braindump-2026-11-02-2205-a-csm-workspace-for-every-activity`; `cpl_memory`
`sam-csm-workspace-every-activity-2026-11-02`). S555 (2026-11-02): *"we need to get the new CSM funding workspace up
before the CPL Commons work"*.

The design record is the mock, version 11 (https://claude.ai/artifact/LLjcCzVzq7sqtPEjnebMYf; source, porting notes
and his 18 asks in `CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/`).

## Status

✅ **PR 1, the tab over the funding tab's state (S555).** `csm_workspace.js` paints from
`CPL_FUNDING_TAB.csm.snapshot()`, one record per institution built from the funding tab's own `eligReqList`,
`baselineGate`, participation rows, noncredit attestations, the review RPCs and the requester context; it acts through
`CPL_FUNDING_TAB.csm.act` (the review lane's `acceptOptIn` / `denyOptIn` / `followOptIn` / `mailOptIn` and the
noncredit twins), `focus` (the funding tab opened on the college) and `nudge` (the funding tab's Nudge, the mail
merge). No second computation and no table of its own. Names and emails ride `req` for a signed-in reviewer on the
internal view alone. Carried from the mock: the header with **Hide the summary** (ask 18, the visit only), Today, the
five priority cards, the action center (eight views, search, the queue with each next step), the record (minimum
conditions in the funding tab's words, who sent it, the CO Monitor's note, Mark Declined participation), **Review
before you decide** (ask 15: Checked by the form / Meets / Check this with I checked this / Does not meet; Accept opens
once the reviewer has scrolled to the review's foot and ticked every check, a failing requirement keeps Accept shut),
the stage board, and the landing-page links (ask 16). The funding tab's toolbar links it beside Nudge. Look: the CPL
Commons palette as the mock shows it, the dark theme mapped onto First Light tokens. **Proceeded on the
recommendation (S555): the second COBI tab in Malone's look, after the CPL Commons; reply to reverse.** Guards
`tests/csm_workspace.test.js`; `npm run a11y -- cobi:csm-workspace` passes at both widths, light and `--dark`.

## NEXT

1. **The communications log (PR 2):** notes, calls and follow-up dates per college and activity, the record's
   history, the follow-up due ages in the queue. A first writer to a shared table: map it in
   `kb/governance_surface_map.json` and check the student-detail disclosure ADR before it ships (Rule 10 a3). Weigh
   `cpl_comms` (the communications lane's register) before a new table; keyed by activity, never by the funding
   module, so MAP onboarding and the activity cards join later.
2. **The mock's contacts surfaces:** the Cc picker (ask 8, 11), the contacts popup and the names table (asks 4, 7),
   every landing-page role (ask 6), the editable To and Subject (asks 12, 13), the hover cards (ask 10). The data
   exists: `map_college_contacts`, `map_landing_contacts`, `map_college_users` (reviewer-gated), as Nudge reads them.
3. **The denial email** the mock fills with what failed (ask 15); the funding tab's Deny sends none today.
4. **Read the CSM team's Slack channel** (Sam added the connector at the end of S554; read, never post without his go)
   and say how it could feed the log.
