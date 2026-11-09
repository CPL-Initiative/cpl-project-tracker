---
title: "CSM Workspace / the team's queue for each college — lane state"
created: 2026-11-02
updated: 2026-11-09
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

**2026-11-09 (S622 SkyCartwheel, Sam in session, the eve of the rollout):** the door's front end reached the site at 20:44Z (the two Pages deploys after #2984 were refused on a deployment collision and a third timed out at *syncing_files*; a fresh `pages.yml` dispatch published it), and Sam's own request was approved and signed in at 20:51Z. **The approver's side (#2987):** an approver always sees *Access requests*, with *Check now* and how a teammate asks; every read builds its headers from the session as it stands (a token kept from the first read lapsed within the hour and a refused read drew as an empty queue). **A sign-in lasts 30 days in the browser** (#2988; Sam: *"everyone if cobix is OK with it"*; COBIx found no defect; `reviewer-session-lifetime`). **Each priority card opens the list its figure counts** (#2990; Sam: *"I expect to see 61 colleges in action center but it's sorting for a subset"*): views `coordmet` (*With a CPL Coordinator in MAP*) and `ncmet` (*Noncredit CPL Lead attested*); the count line keeps CPL and MAP in capitals. **A credit college's noncredit attestation is seen** (#2993): `ncAttestShown()` read `nc_award` off a roster row that has none, so the workspace and the Nudge saw the three noncredit-only institutions alone (Sam's screen: *0 of 3* over twelve attestations on file); a row without the figure asks its allocation (3 before, 111 after, with Scenario 4's lane). **The Noncredit CPL Lead role in MAP** (Sam's rule, in `implementation-funding`): the record says the role meets the condition, or that the landing page lists a close title and to ask the college for the role. Guards `tests/csm_workspace.test.js` 13a to 15g, `tests/cpl_funding_door_readonly.test.js`, `tests/cpl_funding_nc_lead_in_map.test.js`.

**2026-11-09 (SkyCigar, #2967, before the CSMs' first funding-confirmation session):** the three CSMs joined the reviewer list (3 of 3; list of 13). **Accept and Deny wait for the save** (#2973, open): the funding tab's `CSM_ACT` answers `{ok}` from the re-read (Accept: the row reads confirmed; Deny: gone), and the workspace logs, speaks and lets the email open only on `ok`; a refused save says *Not saved* and leaves `csm_log` untouched (`tests/csm_workspace.test.js` 9a to 9g). **2026-11-09 ~17:55Z (S621, COBIx on #2967 17:42Z, Sam in session):** the MAP team on Sam's call were told to sign in as a reviewer. Janelle Brekke joined `allowed_reviewers` from `team_members`; Natalie Powell and Chelsea Marada also at `rccd.edu` (same local part as their `vendor.rccd.edu` rows), since `is_allowed_reviewer()` compares the exact address. Read back: Janelle 1, Natalie 2, Chelsea 2, Ally 1. Migration `kb/migrations/2026-11-09_map_reviewers_rccd.sql`, rollback beside it. Still open: COBIx's item 3 there, Team RACI flowing into the list behind an explicit flag. **The funding door (S621, #2983, Sam's go in session 2026-11-09):** the Auth mailer is capped at two emails an hour for the whole project, which locked the CSMs out. A teammate asks from the CSM Workspace's sign-in box (*Ask an approver*; `reviewer_signin.js` door mounts); `funding_access_request` stores a SHA-256 of a secret the tab keeps; an approver (`funding_approvers`, managed in Admin by Sam or Malone, seeded with Sam, Malone, Kristen, Natalie, Terence; each must also be on the reviewer list) approves in the workspace's *Access requests*; the open tab claims a session from the Edge Function `funding-door` (admin generate_link + verify: no email) and `CPL_SESSION.adopt` stores it. `is_funding_reviewer()` replaces `is_allowed_reviewer()` in the seven funding/CSM tables' policies and four read functions only; a grant lasts 30 days. No phrase (Sam's go). Migration `kb/migrations/2026-11-09_funding_door.sql`, rollback beside it. Guards `tests/funding_door.test.js`, `tests/csm_workspace.test.js` 1e. A door sign-in that is not on the reviewer list reads the model as published and keeps the review controls (S622, #2991: `reviewing()` opens the review work, `unlocked()` the model, on the database's answer to `rpc/is_allowed_reviewer`; a what-if left in that browser is set aside). Natalie and Terence have no Auth account yet, so they approve once signed in. **LIVE: Ready to send (#2967 item 3, S621 SkyBlackEye):** a view (`#csm-workspace/send`) of each college whose next email is due, by `readyOf`: confirmed with no *Acceptance sent* receipt, the acceptance (template *The acceptance, with what still waits*: the funding tab's own `acceptEmail` text through `csm.acceptMail`, To the request's sender or, with no request on file, the first person in Sam's order; Cc the CPL Coordinator; the `missingWords` conditions appended with the public funding page); not yet confirmed and no nudge in 14 days (a *Nudge sent* receipt, or any email row carrying the nudge's subject), the nudge; a request waiting, *Accept first* (Accept stays in the review). Acceptances sort first, the waiting last; a declined college never enters. The send view's draft keeps its own key (`<college>|send`), so the record's draft is untouched. *Open in Outlook* (renamed from *Open a draft* everywhere) opens the mailto; past 1,900 characters the email goes to the clipboard and the draft opens with To, Cc and Subject. *Sent* writes the `csm_log` receipt (`Acceptance sent:` / `Nudge sent:`, a follow-up a week out unless unticked), drops the college and selects the next. Sheet 146 card 3's Microsoft 365 sender replaces the mailto at `mailAct` when it comes. **Not received, the From line, It bounced (S621, COBIx on #2967 16:17Z):** Sam's acceptances from Oct 31 on never left Outlook (Exchange `SendAsDenied`: the From line held the shared MAP mailbox). Every acceptance confirmed before the log went live (`LOG_LIVE` 2026-11-09; measured 15: 10 participation, 5 noncredit, Oct 31 to Nov 2) leads Ready to send as *Not received*, ready to resend. Noncredit attestation acceptances join the queue (`accept_nc`, the funding tab's `acceptMail("nc")`) once the participation acceptance is sent. Beside the controls: *Send from your own address. The shared MAP mailbox needs Send As rights from RCCD IT.* The record offers *It bounced* on each sent receipt; it writes `It bounced, <the receipt>`, and the later row decides, so the college returns to the queue. Guards `tests/csm_workspace.test.js` 11a to 11g. **Open in Gmail and the logo as bytes (S621, COBIx on #2967 18:25Z; Malone: ITPI's CSM team uses Gmail):** *Open in Gmail* beside *Open in Outlook* opens Gmail's compose (`mail.google.com/mail/?view=cm&fs=1`, to, cc, su, body), with the same 1,900-character fallback (copy, then a draft with no body). Neither draft link can carry the logo; *Copy the email* does, now as a data URI of `sierra/cpl-initiative-logo-navy-email.png` (400x75, 7 KB, read from the site when the email box first draws; the published address until then), since Outlook and Gmail often refuse an outside image on paste. Not tested in a live Outlook or Gmail from a session: if either still drops the embedded image, say so in the hint. Guards 12a to 12f. The fallback deadline is the published Scenario 4's **2026-12-31** (`cpl_funding_data.js`, `participationDeadline()`; was Nov 1). Guards `tests/csm_workspace.test.js` 10a to 10k, `tests/cpl_funding_equity.test.js`.

## Status

✅ **PR 1, the tab over the funding tab's state (S555).** `csm_workspace.js` paints from
`CPL_FUNDING_TAB.csm.snapshot()`, one record per institution built from the funding tab's own `eligReqList`,
`baselineGate`, participation rows, noncredit attestations, the review RPCs and the requester context; it acts through
`CPL_FUNDING_TAB.csm.act` (the review lane's `acceptOptIn` / `denyOptIn` / `followOptIn` / `mailOptIn` and the
noncredit twins), `focus` (the funding tab opened on the college) and `nudge` (the funding tab's Nudge, the mail
merge). No second computation and no table of its own. Names and emails ride `req` for a signed-in reviewer on the
internal view alone. Carried from the mock: the header with **Hide the priorities** (ask 18, the visit only), Today, the
five priority cards, the action center (eight views, search, the queue with each next step), the record (minimum
conditions in the funding tab's words, who sent it, the CO Monitor's note, Mark Declined participation), **Review
before you decide** (ask 15: Checked by the form / Meets / Check this with I checked this / Does not meet; Accept opens
once the reviewer has scrolled to the review's foot and ticked every check, a failing requirement keeps Accept shut),
the stage board, and the landing-page links (ask 16). The funding tab's toolbar links it beside Nudge. Look: the CPL
Commons palette as the mock shows it, the dark theme mapped onto First Light tokens. **Proceeded on the
recommendation (S555): the second COBI tab in Malone's look, after the CPL Commons; reply to reverse.** Guards
`tests/csm_workspace.test.js`; `npm run a11y -- cobi:csm-workspace` passes at both widths, light and `--dark`.

✅ **The top, tightened for the action center (Sam, 2026-11-03, S564).** The tab runs the full window width; the intro
under the title is gone; Today sits in the header, outside the fold, and each of its four counts is a word that opens
the same view as its card (`review`, `held`, `qual`, `notyet`); the fold holds only the priority cards; card padding and
gaps are tighter, and the noncredit card carries no line under its count. Guards 5b2 to 5b5.

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
and **Open in Outlook** (named *Open a draft* until S621); the log notes either, with a follow-up a week out unless unticked. A directory name keeps its
comma (*Rivera, Ana*): names split on a new line or a semicolon alone.

## NEXT

0. **The action center's list (Sam, 2026-11-09: *"see if it needs to be cleaned up or clarified"*; COBIx reviews it on
   #2990's thread, Sam picks):** option groups (to do, by stage, by condition, everyone); a *No CPL Coordinator in MAP*
   view (54 that day) and whether *Confirmed but missing the CPL Coordinator in MAP* then stays; a *Declined* view;
   *Follow-ups open* beside the pill *Follow-up due*; the Noncredit card's name once the role in MAP counts beside the
   attestation.
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
