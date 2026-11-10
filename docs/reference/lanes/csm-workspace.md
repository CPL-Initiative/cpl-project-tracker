---
title: "CSM Workspace / the team's queue for each college — lane state"
created: 2026-11-02
updated: 2026-11-10
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
before you decide** (ask 15: Checked by the form / Meets / Check this with I checked this / Does not meet; Accept opens
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
- **The menu is two groups with a count beside every label.** **To do:** All open items, Ready to send, Waiting on the
  team, Follow-ups open, Confirmed, still held, Noncredit attestations waiting, Not yet confirmed. **Browse:** Qualifies
  (all conditions met), Confirmed, With a CPL Coordinator in MAP, With a Noncredit CPL Lead, Confirmed but missing the
  CPL Coordinator in MAP (`#csm-workspace/coord`, the list Sam chases), No CPL Coordinator in MAP, All institutions.
  A missing coordinator is status only: no CSM email for it.
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

**LIVE: the clarity mock, built (S624, 2026-11-10, on Sam's "go ahead and build it"; #3049, #3050 and the two after).**
The page reads **Funding Follow-up Dashboard** (Malone, 2026-11-10: the MAP team does most of this work; the address
stays `#csm-workspace`, and the file, the lane and the identifiers keep the old name). The summary is five metrics,
each opening its list, the deadline apart. The list sits in two groups, *Needs you* (a request waiting on the team, an
email that is due, a follow-up due) above *Waiting on the college*, most pressing first; every row names the email or
the date. The record is a table of conditions (Condition, Status, Email), then *Recommended action* with the email as
a preview and *Edit email*; the email is the one that is due (`recTpl`) in every list, and Sent is offered for that
email alone. One side panel under the record holds People (one list: role, person, source), CPL landing page and
History, and the review opens there; Accept says what it does. Access requests are one word in the header;
*Implementation Funding* opens a drawer with the college's max award, what qualifies now, the conditions met and the
date due. The Action center heading and the four-column board are gone. Tests: `tests/csm_workspace.test.js`
(5b6 to 5f8, 13a0, 13a1).

**LIVE: the review and the panel, after Sam's look at the live page (2026-11-10, his go in session on all five; #3061,
#3063, #3064 and the two after).** Sam: *"why do we click on Review when that's what we're there to do? shouldn't it just
be open for review and action?"* and *"links still opening to new tabs instead of sidebars"*. A waiting request's review
opens in the panel by itself (`sideOf`; a **Review** word closes it, `state.side = "none"`). The scroll gate is gone, which
reverses his 2026-11-02 *"unless they seen that section"*: Deny is open, Accept waits on the checks. Implementation
Funding in the record opens the drawer, which shows the CO Monitor's note (`fundWord`, `fundOpener`). The landing page
draws in a sandboxed frame in the panel and behind *Show the landing page here* in the review (`landingFrame`); MAP's
landing pages send no X-Frame-Options (read 2026-11-10), and a refusing site leaves a blank frame with the new-tab link
beside it. Contacts on file and the people filter sit in People; the pop-ups are gone (`contactsOnFileHtml`,
`state.psrc`). Not yet seen in a signed-in browser: the a11y sweep reads the signed-out view only.

**LIVE: Email templates a reviewer can change (2026-11-10, #3068; Sam: *"can you add a place for me or any reviewer to
make changes to the templates for these and later make additional changes if needed?"*).** The four emails the
dashboard writes itself (the lead ask, both asks, the nudge, the follow-up) are templates in `TPL_DEFAULT`, with words in
braces (`TPL_WORDS`: `{name}`, `{college}`, `{deadline}`, `{funding_page}`, `{close_title}`, `{open_items}`). *Email
templates* in the header (reviewers only) opens the pane: edit, preview for the chosen college, *Save for every
reviewer*; *Earlier versions* loads one back; *Put back the shipped wording* saves a reset. Store `csm_templates`
(insert-only, RLS `is_funding_reviewer()` select and insert, saver stamped from the JWT; DR-09; migration
`kb/migrations/2026-11-10_csm_templates.sql`, rollback beside it, applied by run 42847222590). A save re-reads first and
refuses to write over a teammate's newer version. With nothing saved the four emails match the old `seedMail` word for
word in 32 cases (`tests/fixtures/csm_templates_shipped.json`). The two acceptances stay the funding tab's
(`acceptMail`).

## NEXT

0. **Left from the clarity mock's build** (the go-live note, `CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/
   20261110_csm_workspace_go_live_checklist.md`):
   - **Turn on the two new emails once Sam has read them** (`LEAD_MAIL_ON` in `csm_workspace.js`, false today): the
     Noncredit CPL Lead ask and both asks in one email. Sam was reading them on 2026-11-10 and asked for the template
     pane, which shipped; their wording is now his to edit there. Off, no lead ask is ever due. NEEDS SAM: his go.
   - **Who may change a template** (COBIx on #3068, point 1): today `is_funding_reviewer()`, so a door sign-in with a
     30-day grant may too, on Sam's *"me or any reviewer"*. Narrower is one migration (insert to
     `is_allowed_reviewer()`). NEEDS SAM: confirm or narrow.
   - **The `database` environment has no required reviewer** (COBIx on #3068): `supabase-migrate.yml` applies on any
     `claude/**` push that changes `.apply`, by Sam's 2026-10-13 *"with or without my approvals"*. A required reviewer
     is his repository setting. NEEDS SAM: keep or add.
   - **The sign-in** with *Ask an approver* as the one lead action and the email link one click away
     (`reviewer_signin.js`; it changes the funding tab's sign-in too). Not built.
   - **The funding drawer's Priorities lines**: the snapshot does not carry them; `cpl_funding.js` would pass them.
   - **Check the side menu on the live site**: both HTMLs read *Funding Follow-up Dashboard*; a name stored for the
     item in the Admin tab's menu would still show the old one.
   - **Open with Malone:** Recommended action above or below the conditions; the panel under the record or as a third
     column; whether the row badges earn their place; a menu or visible words for the filter. He has more to send.
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
