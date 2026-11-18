---
title: "CSM Workspace / the team's queue for each college — lane state"
created: 2026-11-02
updated: 2026-11-13
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

**The door and the reviewer list (2026-11-09, S621 and S622):** moved verbatim to `docs/csm_workspace_lessons.md`, *Moved from the lane (S626b)*. What stays true from them is in Status below.

## Status

✅ **PR 1, the tab over the funding tab's state (S555).** `csm_workspace.js` paints from
`CPL_FUNDING_TAB.csm.snapshot()`, one record per institution built from the funding tab's own `eligReqList`,
`baselineGate`, participation rows, noncredit attestations, the review RPCs and the requester context; it acts through
`CPL_FUNDING_TAB.csm.act` (the review lane's `acceptOptIn` / `denyOptIn` / `followOptIn` / `mailOptIn` and the
noncredit twins), `focus` (the funding tab opened on the college) and `nudge` (the funding tab's Nudge, the mail
merge). No second computation and no table of its own. Names and emails ride `req` for a signed-in reviewer on the
internal view alone. Carried from the mock: the header with Today, the action center (search, the queue with each next step), the record (minimum
conditions in the funding tab's words, who sent it, the CO Monitor's note), **Review
before you decide** (ask 15: Met / Check this with I checked this / Not met; Accept opens
once the reviewer has scrolled to the review's foot and ticked every check, a failing requirement keeps Accept shut),
the stage board, and the landing-page links (ask 16). The funding tab's toolbar links it beside Nudge. Look: the CPL
Commons palette as the mock shows it, the dark theme mapped onto First Light tokens. **Proceeded on the
recommendation (S555): the second COBI tab in Malone's look, after the CPL Commons; reply to reverse.** Guards
`tests/csm_workspace.test.js`; `npm run a11y -- cobi:csm-workspace` passes at both widths, light and `--dark`.

✅ **The top, tightened for the action center (Sam, 2026-11-03, S564).** The tab runs the full window width; the intro
under the title is gone; Today sits in the header, and each of its four counts is a word that opens its view (`review`,
`held`, `qual`, `notyet`). Guards 5b2 to 5b5.

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

✅ **The workspace after the walkthrough with Malone (S623, 2026-11-09, issue #3010; the parts that shipped without the
mock).** Sam, on COBIx's writeup: *"i think the cards can go away"*; *"we really don't need a college declining piece at
all--we can just leave the confirmation blank as an indicator--save the step"*; the Noncredit CPL Lead *"in MAP since
itpi just added the field in map users. if they attest, we can accept that now as well"*; the missing coordinators,
*"since I made the problem, I will chase them"*.
- **The priority cards are gone**, with their fold. Today's four counts stay in the header.
- **The menu, redrawn 2026-11-12 (below, *The lists*).** A missing coordinator is status only: no CSM email for it,
  and `#csm-workspace/coord` is the list Sam chases.
- **The exact MAP title *Noncredit CPL Lead* stands in for the whole noncredit attestation (Sam, in session 2026-11-10: *"Nc yes exact wor whole"*, then *"Word"*; COBIx had relayed it on #2999).** No form is needed and the form stays out under Scenario 4. The workspace reads it so since #3012 and its record reads *Noncredit share: complete*; the funding tab since #3033: the role meets `nc_team` as well as `nc_coord`, a college with the role is offered no form, counts as attested in the filter, and a form it left waiting shows no chip (guard `tests/cpl_funding_nc_lead_in_map.test.js`). The reviewer's confirmations panel still lists a form on file, so Accept and Reject stay reachable.
- **The Noncredit CPL Lead is met by the role in MAP or an accepted attestation** (`ncMet`). A form still waiting at a
  college that holds the role asks nothing of the team (`ncWaiting`): no pill, no place in Waiting on the team.
- **The Nudge logs itself (S625, 2026-11-10).** COBI sends nothing, so the reviewer says the mail merge went out: once a list has been downloaded or copied, *Log this Nudge* writes one `csm_log` entry for each institution in the list that left COBI, the latest download or copy, whatever is checked at the press (kind email, what was asked for, how many people, no name or address) with a follow-up a week out. One request carries every row on the reviewer's credential (`nudgeLog` in `cpl_funding.js`; the Nudge module holds no write), it files once a window, and the workspace reads its log again when told (`cpl-csm-log-changed`). `csm_log` stays under DR-09. Guard `tests/cpl_funding_nudge_log.test.js`.
- **No decline piece, in the workspace or the funding tab.** No *Mark Declined participation*, no Declined list, pill
  or chip, no decline line in the review, no gray row in Nudge, and nothing reads a mark (S624 took the funding tab's
  `setDeclined`, its chip and the Nudge's declined word; read 2026-11-10: 0 of 5 notes rows carry one).
  `cpl_funding_notes` keeps `declined_at` and `declined_by`, unread; dropping them is a schema change for Sam's word,
  and that migration rewrites the table's check (`note is not null or declined_at is not null`) as `note is not null`
  in the same step (COBIx on #3023).
Guards `tests/csm_workspace.test.js` 3f, 5a, 14a to 14x-g, 15e to 15j.

✅ **The role the reviewer confirmed is kept with the acceptance (S623, Sam, 2026-11-10: *"I meant for the reviewer to
add"*).** When the form gave *Other senior administrator*, the review's check carries *Their role, as you confirmed it*;
Accept writes it into its `csm_log` entry (*Sender's role, as checked: …*). No database change. Guards 9h to 9k, and a noncredit Accept run in `tests/csm_workspace_nc_accept.test.js` (S624, COBIx on #3014).

✅ **The queue and the record share a divider (S623, Sam, 2026-11-10: *"can you make the big side by side window on the
various views resizable horizontally--thinking when sidebars get opens users will want to shift things depending on what
they're looking at"*).** `#cw-split`, a `separator` between the two panes: drag it, or Left and Right step it two points
and Home puts it back; it stops at 25 and 70 so neither side closes. Its place is a layout choice, kept in
`localStorage` (`cplCsmSplit`) like a column width. Below 960px the panes stack and the divider leaves. Every Commons
List already carries the same control on its side panel (`pgrip` in `commons_list.js`). Guards 13y-a to 13y-g.

**LIVE (S624 to S633, 2026-11-10 to 11-12): the clarity mock, the review and its panel, Email templates, the plainer review with the conditions panel, the lists redrawn (since replaced by the seven stages below), and the acceptance no longer hidden with the email record, the minute check and Bcc.** Moved verbatim to `docs/csm_workspace_lessons.md`, *Moved from the lane (S667 checkpoint)*.

**LIVE: the seven stages (2026-11-13, #3253, served 20:31Z; Malone in session; the plan and the mock are in the vault,
`CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/`).** His words: *"we need a different filter structure....
because what we have is very confusing ... Ideally, it would be clean and sequential."* He and Sam ruled out a
rebuild of the page (*"we can simply adjust the logic of the filters and the content of the email templates"*), so
the layout, the record, the review, the panel and the composer are untouched: three rules changed.
- **The stage rule (`stageNum`, `STAGES`).** 1 No confirmation received (`notyet`), 2 Confirmation to review
  (`partreview`), 3 Noncredit CPL Lead not received (`nolead`), 4 Noncredit CPL Lead to review (`ncreview`), 5 Held by
  a condition (`held`), 6 All conditions met (`ready`), 7 Qualifies (`qual`). Every institution is in exactly one,
  worked out each time from the snapshot and the log; nothing is stored. Stages 3 and 4 never apply to a college with
  no noncredit share, with the role in MAP, or with an accepted attestation. An attestation that arrives before the
  confirmation is accepted waits at stage 1 or 2 and is reviewed from the record. Stage 7 is stage 6 with a
  *Qualifying email sent* receipt in `csm_log`; a bounce returns the college to 6. So the stage 7 count is the
  colleges told they qualify, and stage 6 plus stage 7 is the colleges that meet every condition: on the first day
  every such college sits at 6. A condition still being read keeps a college at 5 with no email due (`condPending`;
  COBIx on #3253).
- **The lists (`VIEWS`, two `GROUPS`).** *Stages:* Every stage (`open`, where the page opens, each college under its
  stage) and the seven. *Look up:* Confirmed, missing the CPL Coordinator in MAP (`coord`, the list Sam chases), Email
  record (`emails`), All institutions (`all`). Inside a stage the colleges are grouped To review, To send or follow up,
  Waiting on the college, Done (`subOf`, `groupsOf`). A follow-up due is a flag on a row and lifts it into To send or
  follow up. The summary is the seven counts in order. An address saved for a retired list opens its successor
  (`VIEW_WAS`).
- **One email a stage (`readyOf`).** 1 the participation request (`nudge`), 3 the Noncredit CPL Lead request (`lead`),
  5 the held follow-up (`held`, due again after 14 days; never for a missing CPL Coordinator, `heldOpen`), 6 the
  qualifying email (`qualify`). `LEAD_MAIL_ON` off still stops the lead request. Each says what the team
  accepted (`{accepted}`) and what remains (`{conditions}`, `{remaining}`, `{also_open}`), so **an acceptance is
  never due**; it stays in the Template menu and may be marked Sent, which feeds the Email record and moves no
  college. The both-in-one email is retired (the participation request names every condition); its past receipts
  still count. Receipts are told apart by subject in any letter case (the wording saved 2026-11-12 capitalizes its
  subjects, and the old case-bound patterns had stopped finding a copy of it).
- **Saved wording.** Read live 2026-11-13: each of the six templates had one version saved 2026-11-12. For the two
  whose shipped wording changed (`nudge`, `lead`), a version saved before `TPL_SINCE` is an earlier version: still in
  `csm_templates`, still under *Earlier versions*, no longer in force. The other four keep their saved versions.
- **No table, migration or stored value changed.** The only writes are the `csm_log` receipts the page already wrote,
  under two new prefixes (*Held follow-up sent*, *Qualifying email sent*).
- **DECIDED 2026-11-13 (Malone in session, D1 to D5 of the plan):** D1 the credit share qualifies while the noncredit
  share waits on the lead (Sam's Sheet 113 card 1 stands; the row reads *Credit share qualifies*); D2 an email may go
  at each step and none is forced where a college sent everything at once; D3 To send apart from Waiting inside a
  stage; D4 three look-up lists; D5 the templates follow the workflow, and a reviewer edits each before it goes.
- **DECIDED in the build, for Malone and Sam to revise:** the page opens on Every stage; a reviewer's follow-up note
  leads a row ahead of the stage's email. **Held for Sam (COBIx on #3253):** Malone's stage 5 email would name every
  missing condition, the coordinator included; Sam's call of 2026-11-09 is that the dashboard writes no email for a
  missing coordinator, so the held follow-up leaves it out and a college held by it alone is owed no email, until he
  rules.
- **The guide** was rewritten to the seven stages and its screenshots redrawn (version 5, published 2026-11-13 to the
  same link), and the stamp restamped in the same change. `cpl_memory`: `malone-funding-dash-seven-stages-2026-11-13`
  and `q-held-follow-up-names-coordinator-2026-11-13` (receipt `kb/receipts/cpl_memory_funding_dash_seven_stages_2026-11-13.sql`).
- **Rollback:** one squash commit; `git revert` restores the lists, the emails and the tests. Receipts written under
  the two new prefixes stay in `csm_log` as history and are read by nothing after a revert.
Guards `tests/csm_workspace_stages.test.js` (the stage model), `tests/csm_workspace.test.js`, `tests/csm_workspace_templates.test.js` 1a to 1f.

## NEXT

00. **Open from the seven stages (2026-11-13):**
   - **For Sam's read:** the wording of the four stage emails, the qualifying email above all (new, and it tells a
     college it qualifies); whether the held follow-up may name a missing coordinator (it does not today).
   - **Not yet ruled:** what a stage 1 row reads after December 31, 2026; a college at stage 3 that never names a
     lead never reaches stage 6, so its credit share would qualify with no email saying so.
   - **Not yet seen in a signed-in browser** on live data: the stage counts were read on the test roster and the
     guide's sample colleges.
0. **Left from the clarity mock's build** (the go-live note, `CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/
   20261110_csm_workspace_go_live_checklist.md`):
   - **Ruled 2026-11-10 (Sam, *"yes to all"*):** the two new emails are on (`LEAD_MAIL_ON` true; their wording is a
     template), and a door sign-in with a 30-day grant may change a template (`is_funding_reviewer()` stays).
     `supabase-migrate.yml` keeps applying at once with no required reviewer on `database`: Sam withdrew the same
     day's approval ask (*"I was confused by the migration approval request and don't want it"*).
   - **The sign-in is built (S634, 2026-11-10):** at the dashboard's door *Ask an approver* is the one lead action and
     Enter asks; *Use an email link instead* opens *Email me a link* beside it (`reviewer_signin.js`, door mounts only;
     the workspace is the one door mount, so no other tab's sign-in changes). Guard `tests/funding_door.test.js` e2 to e2c.
   - **Open with Malone:** Recommended action above or below the conditions; the panel under the record or as a third
     column; whether the row badges earn their place; a menu or visible words for the filter. He has more to send.
   - **Open with Malone (the 2026-11-12 session):** whether the Noncredit CPL Lead attestation's review should keep its three
     extra requirements (the landing page, the assignment, the meetings) now that the role in MAP alone meets the
     condition.
   - **Open with Sam:** whether a name with *Funding* in it still fits when a second activity joins (his 2026-11-02 plan).
1. **Build next from the mock:** the hover cards (ask 10) and every landing-page role across colleges (ask 6, the
   CPL Coordinator card's link).
2. **The denial email** the mock fills with what failed (ask 15); the funding tab's Deny sends none today.
3. **Other activities** (Sam: MAP onboarding, the activity cards): a second `activity` value and its own queue.
4. **The CSM team's Slack channel is `#mapanditpiteam`** (read S555, 2026-11-03, read-only): the ITPI CSMs and
   the MAP team coordinate there, and it carries college requests the log should hold (a college's new CPL
   Coordinator asking to join the listserv, 2026-11-02; who answers which college). Proposed: a **Log from Slack**
   entry kind carrying the thread's link, written by a reviewer from the workspace; never an automatic import, and
   never a post to Slack without Sam's go. `#map-internal-team` and `#map-intiative` read empty to this connector.
