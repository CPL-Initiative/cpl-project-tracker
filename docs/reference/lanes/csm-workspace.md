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

✅ **The communications log, `csm_log` (S555).** One row per note, call, email or meeting with a college, keyed by
**activity** (`funding` today, never the funding module) with an optional follow-up date. History sits in each record
with a Log form (*no student detail*, its placeholder says); a follow-up due puts the college in the open queue,
its age reading *Follow-up due*, its next step the note; *Mark the follow-up done* closes it. Every decision made in
the workspace logs itself (Accept, Deny with what failed, Follow up with a date a week out, Email again). RLS: a
signed-in reviewer reads and writes (`is_allowed_reviewer()`), as `cpl_funding_notes`; the trigger stamps who wrote
and who closed from the JWT. Mapped DR-09 in `kb/governance_surface_map.json` before its first write (Rule 10 a3).
Migration `kb/migrations/2026-11-02_csm_log.sql` (rollback beside it), applied through `supabase-migrate.yml` (run 41547663538, receipt `kb/receipts/migration_s555_csm_log_41547663538.json`); read back live 23:53Z: RLS on, four policies, the stamp trigger, 0 rows. **Lesson:** a force-push (here the rebase onto #2708) re-runs `supabase-migrate.yml` when the branch's `.apply` differs from main, and its receipt commit (run 41551549036) is a bot push that starts no CI; the migration is idempotent, so the second apply changed nothing, and the next commit of your own runs the checks.

✅ **The contacts and the email (S555).** For a signed-in reviewer the workspace reads MAP's directory
(`map_college_contacts`), the landing pages (`rpc/map_landing_contacts_roster`) and MAP's active users (paged), each
reviewer-gated in the database, matched to an institution as Nudge matches it (through `college_short_names.js`).
**Contacts on file** (ask 4) opens a popup: the directory's twelve fields (*Not on file* where blank), the landing
page's people with their MAP roles, MAP users by role, the mismatches in a sentence each (the coordinator missing from
the landing page, the primary contact not an active MAP user), Copy every address. **Names, titles and emails** (ask 7):
one table of every row, filtered by source. **Write an email** in each record: a template (a college not yet confirmed
gets the nudge, To the first of Sam's cascade with the VPAA on Cc; any other a follow-up, To the requester or the CPL
Coordinator), To, Cc, More Cc and Subject editable (asks 12, 13), **Add people to Cc** (asks 8, 11: a checklist grouped
by source with a finder, each tick adding to More Cc), **Copy the email** (formatted, the logo on its signature line)
and **Open a draft**; the log notes either, with a follow-up a week out unless unticked. A directory name keeps its
comma (*Rivera, Ana*): names split on a new line or a semicolon alone.

## NEXT

1. **Build next from the mock:** the hover cards (ask 10) and every landing-page role across colleges (ask 6, the
   CPL Coordinator card's link).
2. **The denial email** the mock fills with what failed (ask 15); the funding tab's Deny sends none today.
3. **Nudge logs itself:** a mail merge writes one entry per college it reached, with a follow-up date.
4. **Other activities** (Sam: MAP onboarding, the activity cards): a second `activity` value and its own queue.
5. **The CSM team's Slack channel is `#mapanditpiteam`** (read S555, 2026-11-03, read-only): the ITPI CSMs and
   the MAP team coordinate there, and it carries college requests the log should hold (a college's new CPL
   Coordinator asking to join the listserv, 2026-11-02; who answers which college). Proposed: a **Log from Slack**
   entry kind carrying the thread's link, written by a reviewer from the workspace; never an automatic import, and
   never a post to Slack without Sam's go. `#map-internal-team` and `#map-intiative` read empty to this connector.
