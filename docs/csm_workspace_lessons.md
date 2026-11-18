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

## Moved from the lane (S626b, 2026-11-10)

The two paragraphs below left `docs/reference/lanes/csm-workspace.md` verbatim to bring it under its 20 KB budget.

**2026-11-09 (S622 SkyCartwheel, Sam in session, the eve of the rollout):** the door's front end reached the site at 20:44Z (the two Pages deploys after #2984 were refused on a deployment collision and a third timed out at *syncing_files*; a fresh `pages.yml` dispatch published it), and Sam's own request was approved and signed in at 20:51Z. **The approver's side (#2987):** an approver always sees *Access requests*, with *Check now* and how a teammate asks; every read builds its headers from the session as it stands (a token kept from the first read lapsed within the hour and a refused read drew as an empty queue). **A sign-in lasts 30 days in the browser** (#2988; Sam: *"everyone if cobix is OK with it"*; COBIx found no defect; `reviewer-session-lifetime`). **Each priority card opens the list its figure counts** (#2990; Sam: *"I expect to see 61 colleges in action center but it's sorting for a subset"*): views `coordmet` (*With a CPL Coordinator in MAP*) and `ncmet` (*Noncredit CPL Lead attested*); the count line keeps CPL and MAP in capitals. **A credit college's noncredit attestation is seen** (#2993): `ncAttestShown()` read `nc_award` off a roster row that has none, so the workspace and the Nudge saw the three noncredit-only institutions alone (Sam's screen: *0 of 3* over twelve attestations on file); a row without the figure asks its allocation (3 before, 111 after, with Scenario 4's lane). **The Noncredit CPL Lead role in MAP** (Sam's rule, in `implementation-funding`): the record says the role meets the condition, or that the landing page lists a close title and to ask the college for the role. Guards `tests/csm_workspace.test.js` 13a to 15g, `tests/cpl_funding_door_readonly.test.js`, `tests/cpl_funding_nc_lead_in_map.test.js`.

**2026-11-09 (SkyCigar, #2967, before the CSMs' first funding-confirmation session):** the three CSMs joined the reviewer list (3 of 3; list of 13). **Accept and Deny wait for the save** (#2973, open): the funding tab's `CSM_ACT` answers `{ok}` from the re-read (Accept: the row reads confirmed; Deny: gone), and the workspace logs, speaks and lets the email open only on `ok`; a refused save says *Not saved* and leaves `csm_log` untouched (`tests/csm_workspace.test.js` 9a to 9g). **2026-11-09 ~17:55Z (S621, COBIx on #2967 17:42Z, Sam in session):** the MAP team on Sam's call were told to sign in as a reviewer. Janelle Brekke joined `allowed_reviewers` from `team_members`; Natalie Powell and Chelsea Marada also at `rccd.edu` (same local part as their `vendor.rccd.edu` rows), since `is_allowed_reviewer()` compares the exact address. Read back: Janelle 1, Natalie 2, Chelsea 2, Ally 1. Migration `kb/migrations/2026-11-09_map_reviewers_rccd.sql`, rollback beside it. Still open: COBIx's item 3 there, Team RACI flowing into the list behind an explicit flag. **The funding door (S621, #2983, Sam's go in session 2026-11-09):** the Auth mailer is capped at two emails an hour for the whole project, which locked the CSMs out. A teammate asks from the CSM Workspace's sign-in box (*Ask an approver*; `reviewer_signin.js` door mounts); `funding_access_request` stores a SHA-256 of a secret the tab keeps; an approver (`funding_approvers`, managed in Admin by Sam or Malone, seeded with Sam, Malone, Kristen, Natalie, Terence; each must also be on the reviewer list) approves in the workspace's *Access requests*; the open tab claims a session from the Edge Function `funding-door` (admin generate_link + verify: no email) and `CPL_SESSION.adopt` stores it. `is_funding_reviewer()` replaces `is_allowed_reviewer()` in the seven funding/CSM tables' policies and four read functions only; a grant lasts 30 days. No phrase (Sam's go). Migration `kb/migrations/2026-11-09_funding_door.sql`, rollback beside it. Guards `tests/funding_door.test.js`, `tests/csm_workspace.test.js` 1e. A door sign-in that is not on the reviewer list reads the model as published and keeps the review controls (S622, #2991: `reviewing()` opens the review work, `unlocked()` the model, on the database's answer to `rpc/is_allowed_reviewer`; a what-if left in that browser is set aside). Natalie and Terence have no Auth account yet, so they approve once signed in. **LIVE: Ready to send (#2967 item 3, S621 SkyBlackEye):** a view (`#csm-workspace/send`) of each college whose next email is due, by `readyOf`: confirmed with no *Acceptance sent* receipt, the acceptance (template *The acceptance, with what still waits*: the funding tab's own `acceptEmail` text through `csm.acceptMail`, To the request's sender or, with no request on file, the first person in Sam's order; Cc the CPL Coordinator; the `missingWords` conditions appended with the public funding page); not yet confirmed and no nudge in 14 days (a *Nudge sent* receipt, or any email row carrying the nudge's subject), the nudge; a request waiting, *Accept first* (Accept stays in the review). Acceptances sort first, the waiting last. The send view's draft keeps its own key (`<college>|send`), so the record's draft is untouched. *Open in Outlook* (renamed from *Open a draft* everywhere) opens the mailto; past 1,900 characters the email goes to the clipboard and the draft opens with To, Cc and Subject. *Sent* writes the `csm_log` receipt (`Acceptance sent:` / `Nudge sent:`, a follow-up a week out unless unticked), drops the college and selects the next. Sheet 146 card 3's Microsoft 365 sender replaces the mailto at `mailAct` when it comes. **Not received, the From line, It bounced (S621, COBIx on #2967 16:17Z):** Sam's acceptances from Oct 31 on never left Outlook (Exchange `SendAsDenied`: the From line held the shared MAP mailbox). Every acceptance confirmed before the log went live (`LOG_LIVE` 2026-11-09; measured 15: 10 participation, 5 noncredit, Oct 31 to Nov 2) leads Ready to send as *Not received*, ready to resend. Noncredit attestation acceptances join the queue (`accept_nc`, the funding tab's `acceptMail("nc")`) once the participation acceptance is sent. Beside the controls: *Send from your own address. The shared MAP mailbox needs Send As rights from RCCD IT.* The record offers *It bounced* on each sent receipt; it writes `It bounced, <the receipt>`, and the later row decides, so the college returns to the queue. Guards `tests/csm_workspace.test.js` 11a to 11g. **Open in Gmail and the logo as bytes (S621, COBIx on #2967 18:25Z; Malone: ITPI's CSM team uses Gmail):** *Open in Gmail* beside *Open in Outlook* opens Gmail's compose (`mail.google.com/mail/?view=cm&fs=1`, to, cc, su, body), with the same 1,900-character fallback (copy, then a draft with no body). Neither draft link can carry the logo; *Copy the email* does, now as a data URI of `sierra/cpl-initiative-logo-navy-email.png` (400x75, 7 KB, read from the site when the email box first draws; the published address until then), since Outlook and Gmail often refuse an outside image on paste. Not tested in a live Outlook or Gmail from a session: if either still drops the embedded image, say so in the hint. Guards 12a to 12f. The fallback deadline is the published Scenario 4's **2026-12-31** (`cpl_funding_data.js`, `participationDeadline()`; was Nov 1). Guards `tests/csm_workspace.test.js` 10a to 10k, `tests/cpl_funding_equity.test.js`.

## 2026-11-10 (S626b, SkyUmbrella's side session): the review opens itself, the panel holds the links, templates

- **Read the live page before reading the mock.** Sam's *"why do we click on Review when that's what we're there to do?"*
  was the mock's own design, faithfully built. Building a mock exactly carries its awkward steps into the live tab;
  ask what a reviewer came to the record to do, and open that.
- **A repaint discards whatever the reader opened.** COBIx caught it three times in one afternoon: the landing page frame
  closed when the contacts arrived (#3066), *Every field on file* snapped shut when the filter changed (#3067), and the
  template box lost its cursor (#3068). This tab repaints by `innerHTML` on every data arrival, so anything a reader
  opens or positions (a `details`, a frame, a caret) needs its state kept outside the DOM and drawn back. KB note:
  `methodology-a-repaint-must-keep-what-the-reader-opened`.
- **Check an element id before you mint one.** The template pane took `cw-tpl`, which the composer's template menu
  already held; the test's `#cw-tpl` found the composer and read as a pane that was open. Grep the module for the id.
- **Turning shipped text into a template: pin the old output first.** Run the old function from `main` and the new one
  side by side over every case (here 32), save the old output as a fixture, and compare word for word. A whole-message
  tidy-up (collapsing spaces) passed the piecewise tests and would have rewritten a CO Monitor's note; only the empty
  placeholder and its one space may be removed.
- **MAP's landing pages can be framed.** `cpldashboardcccco.azurewebsites.net/<code>` sends no X-Frame-Options or
  frame-ancestors (read 2026-11-10). Refuse the frame for this site's own origin, since the address is data a college
  can edit, and keep the new-tab link beside every frame.
- **One concern per PR, stacked:** build each change as a commit on its own branch off the last, then after each squash
  merge `git rebase --onto origin/main <the old commit>` the next. `kb/dependency_map.json` regenerates cleanly each time.
- **`expectedHeadSha` takes the full SHA.** Extending an abbreviated one by guesswork gives a 409 *Head branch was
  modified*; read it from `git rev-parse`.
- **The migration prompt timed out again** (230 s, nobody to answer), so `.apply` and `supabase-migrate.yml` carried it;
  its bot receipt commit lands on the branch, so the next push needs a rebase. The `database` environment holds no
  required reviewer (Sam's 2026-10-13 call), which COBIx raised; it is his setting.
- **COBIx's workflow reads skipped** (`COBIX_REVIEW_ENABLED` is off), yet `cobi-cto` comments arrive about ten minutes
  after a PR opens. Read the PR's comments before merging, not the check list.

## 2026-11-10 (S633 SkySilverDollar): the side menu on the live site

- **The live menu reads *Funding Follow-up Dashboard*.** The served `index.html` carries the label, and `cobi_nav` (54
  rows, read 17:40Z) holds no `csm-workspace` row, so no name stored in the Admin tab masks it. The served
  `csm_workspace.js` carries `tplHtml` and `sideOf`. The NEXT 0 line that asked for this check left the lane.
- **The funding drawer's Priorities lines (S633).** `csmSnapshot()` now carries `prios`, one line per priority for each
  college, written by `csmPrioLines()` from the same reads as the college CSV (`priorities()`, `prioTarget()`,
  `earnFraction()`), in the mock's form (*"Access: …, 41 of a target of 60."*). An unmeasured actual and a count target
  waiting on its denominator read TBA; a suppressed actual reads *fewer than* the privacy floor. Guard
  `tests/csm_workspace.test.js` 5f5a to 5f5c. This test needs the runner's heap (`--max-old-space-size=12288`, as
  `tests/run.js` passes); run bare, it runs out of memory on `main` too.

## Moved from the lane (S667 checkpoint)

Verbatim from `docs/reference/lanes/csm-workspace.md`, moved to bring the lane under its 20 KB budget:

**LIVE: the clarity mock, built (S624, 2026-11-10, on Sam's "go ahead and build it"; #3049, #3050 and the two after).**
The page reads **Funding Follow-up Dashboard** (Malone, 2026-11-10: the MAP team does most of this work; the address
stays `#csm-workspace`, and the file, the lane and the identifiers keep the old name). The summary is the seven stage
counts (2026-11-13), each opening its list, the deadline apart. Every row names the email or the date. The record is a table of conditions (Condition, Status, Next step), then *Recommended action* with the email as
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
word (the fixture that pinned it went with the stage emails, 2026-11-13). The two acceptances stay the funding tab's
(`acceptMail`).

**LIVE once its PR merges: the plainer review, the conditions panel and the copied email (2026-11-12, asked in session
from the MAP account; asked who was driving, the reply was *"I think Malone is the one driving this session"*, so it is recorded as Malone's, likely).** The concern, in the driver's words: the recommended action
*"is not immediately clear to someone who isn't swimming in this water"*, and *"some of the wording doesn't make it
immediately obvious what has happened yet or how each of those lines tracks with the minimum conditions"*.
- **The review reads three words:** Met, Check this, Not met (`REQ_PILL`). The lines that need the reviewer lead; the
  met ones fold under *N requirements already met, with nothing for you to check* (`reqDone`, `state.doneOpen`). One
  line names the minimum condition the review settles, in the funding tab's label (`settlesWords`). The checks, the
  gate and what Accept requires are unchanged.
- **The conditions table's third column is *Next step*:** None, The team reviews the request, The team emails the
  college, The college updates MAP (`stepWord`). It replaces *Email* with *Status only* and *When not met*.
- **Recommended action says what has happened** (`recOf`): the college named, what it has not sent, what the email asks.
- **Funding conditions explained** under the summary opens a drawer (`condxHtml`, `CONDX`, `state.condx`): each
  condition under the funding tab's own label from the snapshot, then how a college meets it, who settles it and what
  the dashboard does. The sentences were written from the funding tab's code; the driver recalled a document of
  2026-11-10 that no repo, the vault or the Drive showed, so the wording waits on their read.
- **A copied or drafted request keeps its Sent word** (`draftedOf`). A copy or a draft counts as asked for 14 days, so
  the email stopped being due and Sent left with it: the log read *Email copied* for good. The record now reads
  *Copied Nov 12 and not yet marked as sent* with Sent beside it, and Sent files the receipt with the copy's subject
  and address. What is due and when is unchanged; the college stays out of *Needs you*.
- **The guide (2026-11-12):** *Funding Follow-up Dashboard Guide*, step by step with screenshots on sample data, one
  section for each stage a college can be in (https://claude.ai/artifact/XqJpfTdCWPhAkGFLA3gsBq; Library record
  `funding-follow-up-dashboard-guide`, a team draft, applied by run 43275652355 and read back live 18:07Z, receipt
  `kb/receipts/migration_library_funding_followup_guide_43275652355.json`; source and `capture.js` in
  `CPLBrain/04-projects/cpl-initiative/funding-follow-up-guide/`). Redraw the screenshots when the dashboard changes.
  Writing it found two things: the coordinator sentence in *Funding conditions explained* named parts the live label
  no longer has (reworded to point at the label), and a college whose email is due appears under *Ready to send* and
  not under *All open items*, the list the page opens on.
- **Rollback:** one squash commit; `git revert` of it restores every piece. No table, migration or stored value changed.
Guards `tests/csm_workspace.test.js` 3b2 to 3b6, 5d1, 5d2, 5d9 to 5d9c.

**LIVE once its PR merges: the lists redrawn, every email in the editor, and the guide's stamp (2026-11-12, Malone in
session).** His words: *"the filters are either not working or not corresponding to logical divisions ... I recently
got a list of 14 colleges with Non-credit CPL leads from COBI, but in the NC attestation filter, it's only got 7 ...
right now the filters are many and the accuracy seems few"*; and *"make sure that every single Email template is
contained in the Email Template editor"*.
- **What was wrong.** Every list counted what its code said, and the definitions overlapped. Read live 2026-11-12: 13
  attestations (5 accepted, 8 waiting) and 3 colleges with the role in MAP, 14 colleges in all. *Noncredit
  attestations waiting* read 7 (8 less Chaffey, which holds the role) and *With a Noncredit CPL Lead* read 7 (5
  accepted and the 3 with the role, LA Mission in both); no list held the 14. *All open items* left out every email
  that was due and held colleges with nothing to do; *Ready to send* held requests still under review.
- **The lists of 2026-11-12 are replaced by the seven stages** (below, *The seven stages*). What was found that day stands: the definitions overlapped, and `csm_log` held almost no Sent receipt.
- **Every email is in Email templates (`TPL_EDITABLE`, seven since the stages).** The four stage emails, the follow-up on a condition, and
  the funding tab's two: the acceptance (one wording for the confirmation and the attestation) and the follow-up
  on a request under review. Their saved versions live in `csm_templates` under `accept` and `request_follow`; the
  funding tab reads them when a reviewer's data loads (`csmTplLoad`) and the dashboard hands them back after a save
  (`setTemplates`), so both pages write the same words. With none saved the wording is the funding tab's own, and
  *the response email* editor on Implementation Funding still sets that default: once a version is saved in the
  dashboard, an edit there shows only after *Put back the shipped wording*. Guards `csm_workspace_templates` 5b to 5b4.
- **The acceptance's message was the empty letter (found on Malone's screen, 2026-11-12, Napa; fixed the same day).**
  `seedMail` took the acceptance's words from the funding tab and then ran the Blank branch over them, so the preview
  read *Dear ..., The CPL Initiative team* under a subject that was right. It had done so since the templates landed;
  the guide's own screenshot showed it and was not read closely. Guards 10c2 to 10c4.
- **The guide follows the page (`tests/csm_workspace_guide_stamp.test.js`).** Malone: *"Make a note somewhere to
  automatically update this documentation whenever this page gets changed in functionality or layout."* The test
  reads every control and label on the dashboard and fails when the set differs from the one the guide was written
  against, naming what was added and removed; the fix is the guide's update and `--restamp` in the same change.
- **DECIDED 2026-11-12 (in session, recorded here for Sam and Malone to revise):** a copied request counts as to do
  until marked Sent; the list group headings are second-level headings.
- **Rollback:** one squash commit; no table or migration. A template saved under `accept` or `request_follow` is a
  row in `csm_templates`, undone with *Put back the shipped wording*.

**LIVE once its PR merges: the acceptance no longer hidden, the email record, the minute check and Bcc (2026-11-13,
Malone in session).** His words: *"we should save who completes a step (attestation confirmation, NC confirmation, sent
attestation request)"*; *"do refresh every minute, ideally a backend check first, if none of the data is different then
we don't need a refresh ... We don't want to accidentally send 2 of the same email or send conflicting emails"*;
*"put MAP@rccd.edu in bcc for the mailto: links. that way we at least always know that the map email is in the mix."*
- **Email record (`emails`, Look up; `emailRecord`).** Every confirmed college: who accepted and when, and what the log
  holds for the acceptance email (marked sent, copied or drafted with no Sent, or no record), each with the reviewer.
  Read live the same day: 17 confirmed, 3 acceptances marked Sent. Guard 14b6.
- **Who completed a step.** The acceptances already stored it (`confirmed_by` on the confirmation and the attestation;
  `by_email` on every log entry); the snapshot now carries it (`part.by`, `nc.by`) and the record shows *Confirmation
  accepted by ...*. The ticks inside a review are still kept in the browser alone, by his word.
- **The once-a-minute check (`watchCheck`, `WATCH`).** Three small reads (confirmations, attestations, log ids and
  closures) make one string; the same string does nothing, a different one has the funding tab read again
  (`csm.reload`) and the log reload, and the page says so. It also runs when a college is opened, and before Sent is
  filed: a receipt another reviewer filed in the meantime stops a second one. Guard 14b7. Not yet seen across two
  live browsers.
- **Bcc.** Every draft the page opens (Outlook, Gmail, and the funding tab's own mail window) carries the team's
  mailbox on Bcc (`TEAM_BCC`, `teamBcc`); the preview shows the line, and a copied email says to add it by hand.
- **DECIDED, left as it is by his word:** the review's ticks and what Accept requires.
- **Rollback:** one squash commit; no table or migration.
