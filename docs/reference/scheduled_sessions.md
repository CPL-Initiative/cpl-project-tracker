---
title: Scheduled sessions — what a session started by Sam's routine does
date: 2026-10-04
updated: 2026-10-30
tags: [reference, scheduled-sessions, checkpoint, governance-team-enablement]
---

# Scheduled sessions

**What it is.** Sam keeps the queue moving without pasting each opening line: a
routine he created in his claude.ai Routines list starts a fresh session on a
schedule. Each session reads the latest handoff, works the queue, checkpoints,
and writes the next handoff, which the next firing reads.
**No session starts another session.** The schedule is Sam's; to stop the run he
pauses the routine.

**Overnight, back to back (Sam, 2026-10-14, S393: "set it").** The routine fires
hourly from 10:12 PM to 6:12 AM Pacific
(`CRON_TZ=America/Los_Angeles 12 22,23,0,1,2,3,4,5,6 * * *`). A firing that finds
a queue session still working ends in one line (*At the start*, step 1), so the
sessions run one after another with at most an hour between them, about four or
five a night. Once a day, a session that signed off at midnight left the queue
idle until morning (S388, 2026-10-14). Sam edits the schedule himself: the
platform refuses an agent's edit to a routine made in the Routines form
(`https://claude.ai/code/routines/trig_01L8K64ZKYb5eALdT4HW6NAV`). A session Sam
opened by hand that is still working at a firing makes that firing stand down;
the next hour's firing tries again.

**Sam's terms (2026-10-04, S329, his words):** *"be more aggressive and go with
your recommendations more often--I'm guessing that about 80% of the time I go
with your recommendation--and very rarely would your recommendations have led to
a grave error. 2. Go for up to 6 sessions, which is less than I run on a regular
day. 3. Decide on the fly the effort to set and feel free to add Fable as an
advisor when needed."* He chose to create the schedule himself after the
session's permission check held a session-started relay twice (S329: "Create
Unsafe Agents").

## You are a scheduled session when

Your opening message says Sam's routine started you. A session Sam opens by hand
follows CLAUDE.md as always; this page's first rule (go with the recommendation)
is his standing preference there too.

## At the start

0. **The dashboard run, first, on the night's first firing** (Sam, 2026-10-30, S527: "go on 1"). GitHub
   creates this repo's scheduled runs 5 to 7 hours late (every day since at least 2026-09-20, before the
   routine existed), so the first firing of the night (05:12 UTC) dispatches `daily-dashboard.yml` on
   `main` (`actions_run_trigger`, `run_workflow`) unless `list_workflow_runs` shows a successful run
   created that UTC day. It does this before step 1, even when it then stands down for another session.
   The workflow's `gate` job makes each cron stand down once the day has a good run, so the crons are
   backstops. The run skips nothing else and needs no reply.
1. **One writer per queue.** `list_sessions` (claude-code-remote, `mine: true`),
   and read the newest few. An older session on this queue that is still working
   (`status_bucket` `working`) **or idle but still holding wakes** (a PR
   subscription, a check-in, an artifact watch) gets one `send_message` before you
   write anything, and the two agree on one writer. Idle is not inert: on
   2026-10-05 an idle S335 woke on CI and on Sam's sheet replies and acted on the
   same sheet as the S336 Sam had just opened (section *A signed-off session lets
   go*). A scheduled session that finds another one working ends its turn in one
   line instead: the next firing tries again.
   **`list_sessions` never lists a routine-fired run, so read the routine too**
   (S466, 2026-10-24: Sam opened a session at 12:21Z while the 12:12Z firing was
   working, and both ran as S466 on the same queue item). `get_trigger`
   `trig_01L8K64ZKYb5eALdT4HW6NAV` gives `last_run` (`fired_at`, `finished_at`,
   `session_id`). A run with no `finished_at` is live: `get_session` on its id
   with `cse_` read as `session_`, and agree one writer before you write. A run
   that finished after the handoff you read may have merged since: fetch `main`
   and read the newest handoff again. This check is for a session Sam opens by hand.
   **When `list_sessions` is not among your tools, read the open PRs** (newest
   updated first, with their comments) and the commits on `main` since the
   handoff. On 2026-10-17 the 05:12Z and 06:12Z firings both lacked it, both ran
   as S403, and each wrote a PDF reader; the 08:12Z firing found the two PRs, read
   the writer note in their comments, and merged the work (#2192). A PR updated in
   the last half hour is a live session: end in one line.
   **Read the open PRs even with `list_sessions` in hand, and an old one closely:**
   a side session's PR left open is work Sam approved that main never received.
   #2323 (the narrated funding film in Sam's own script, 2026-10-21) waited a week
   while main re-voiced the October 2 script, until Sam asked where his script had
   gone (S504, 2026-10-28). Its handoff was a side file the PR body named, never the
   numbered line: read any handoff an open PR names, then merge it, port it, or close it.
   **Every open PR leaves the start with a disposition: merge it, port it, or close it with a pointer** (S505,
   2026-10-28). Four drafts sat 2 to 9 days while handoffs 462 to 476 listed them as open: S450's #2379 (its data
   write had run, its code never merged), the credential watch's #2257 and #2468 (that routine opens a PR and cannot
   merge it) and #2469 (a side session that stopped before its checks). A fetch of another session's branch stalls
   here; read the PR's diff through the GitHub tools, take its files from raw.githubusercontent.com at the head and
   base shas, and `git merge-file` each onto main.
   **So a session Sam opens by hand inside the routine's hours opens a draft PR
   in its first minutes**, before any diagnosis, and pushes to it at least every
   half hour while it works. A firing has no `list_sessions`, so an open PR is the
   only sign it can read. On 2026-10-25 Sam opened S477 by hand at 11:54Z; it
   diagnosed the noncredit RPC for 40 minutes with no PR, the 12:14Z firing saw
   none, and both shipped the same retry (#2443 merged, #2444 closed).
2. **Paused?** If the latest handoff carries a line `Scheduled run: paused —
   <reason>`, and nothing on the standing sheet has been answered since, end in
   one line. Sam lifts a pause by answering the sheet or by saying so.
3. **The repos.** The usual three-repo check. A missing repo stops the session:
   write the reason as the pause line in a handoff commit if you can, and end.
4. **Tag yourself** `cpl-scheduled` (`set_session_tags`), so Sam can find the run.
5. Then the ordinary start: the handoff, Rule 8's memory read, and the standing
   decision sheet's replies (Sam may have answered between sessions).
   **Then the to-dos Sam marked done** (Sam, 2026-10-30, S527: *"When I complete a to do on the
   commons, it should alert the cpl queue schedule task."*). A call in `kb/status/<project>.json` that
   carries a `todo_id` shows **Mark done** on its Progress card; the mark is a row in `queue_todo_done`.
   Read the rows since the handoff's date:

   ```sql
   select project, todo_id, note, reopen, by_email, at from queue_todo_done
   where at >= '<the handoff's date>' order by id;
   ```

   The newest row per to-do wins. A done row is the session's **first** queue item, ahead of the
   handoff's: do what its note makes possible (a parked college restarts; a file he attached is read),
   then at the checkpoint write the call's `answer` ({by, at, words}: his note) into the status file.
   The schedule is the alert: a mark made in the day waits for the night's first firing.
6. **Requested briefs from the Library.** Anyone on the team can start a piece
   from the Library tab (*Create or Remediate a Document*, which saves the brief; built 2026-10-06 as
   *Start a piece*, one panel since 2026-10-29). Read them:

   ```sql
   select slug, title, kind, occasion, seen_by, brief, created_at from cpl_library
   where status = 'requested' and retired_at is null order by created_at;
   ```

   Each row is a queue item. Work it after the item the handoff names first; one
   whose `brief.due` falls within the week goes first. The brief's words are the
   ask (the tab's *Copy the brief* gives the same paste). Hand the draft to Sam
   for the Drafts folder of the Library's SharePoint folder (by hand for now, Sam,
   Open Asks Sheet 49, 2026-10-08), then file its link with **File it**: the record
   moves to Draft ([`lanes/library.md`](lanes/library.md)). A draft is never
   outward, so it needs no hold; approving it is Sam's.

   **Revise and remediate requests** are queue items too (Sam, 2026-10-26, S490, as
   Regenerate; moved into the one box 2026-10-29). Anyone picks a piece in the tab's
   *Create, Revise or Remediate a Document* box, or presses *Revise and remediate* on its
   card: it saves what to change (`refresh_note`; instructions past its 600 characters go
   whole into `sources` as *Instructions from …*), the documents to work from (`sources`,
   each a link or a file's words read in the browser) and the request (`regen`). A note
   left by the older box, with no `regen`, is still a request.

   ```sql
   select slug, title, kind, for_kind, for_name, url, public_listed, rebuild_from, refresh_note,
          sources, regen, updated_by, updated_at from cpl_library
   where (regen is not null or refresh_note is not null) and retired_at is null
   order by coalesce(regen->>'approved_at', regen->>'requested_at', updated_at::text);
   ```

   The tab's *Copy the request* gives the same paste. Read every source: a link with a
   web fetch, pasted text from the row. A SharePoint link stays unreadable until RCCD
   approves the Microsoft 365 connector (Sam, 2026-10-26); say so on the card's request
   rather than guessing at the file. Then, by the piece:

   - **An agency visual** (`rebuild_from` names `agency-visual/build.py`): change the
     piece's `make_brief.py`, rebuild, and publish the draft as a Claude page.
   - **A college's CPL Opportunity visual:** the page is one template, so write what the
     note or document asks for to `library/cpl-opportunity/notes/<slug>.json` (the slug is the
     Library's `collegeSlug`; the format is in `college_cpl_workbook.js`, `notesHtml`). A
     change every college needs goes to the template instead, and says so.
   - **Anything else:** rebuild from `rebuild_from`, keeping its link.

   **Remediate before you hand it over** (Sam, 2026-10-29: *"Maybe make Revise 'Revise and
   Remediate'"*). A page goes through `npm run a11y` against its target (add one in
   `a11y.config.js` when it has none); a deck, document, workbook or PDF through
   `library_remediate.js`'s `inspect` and `finish`, required in Node as `tests/library.test.js`
   does. Answer what it lists, and say in the version you add what it fixed.

   **Publishing.** A piece off the public library republishes at its own link and is done.
   A piece on the public library with `regen.publish` = `show` gets its draft at a separate
   link: write `regen.ready_at` and `regen.draft_url`, and the card offers *Replace the
   public copy*. Once `regen.approved_at` is set, or `publish` is `replace`, rerun
   `scripts/library_page.py`. A college's draft is `notes/<slug>.draft.json`, read at
   `library/cpl-opportunity/?college=<name>&draft=1` (its `draft_url`); on approval it becomes
   `<slug>.json` and the draft file goes. **Done:** add the version, empty `refresh_note` and set
   `regen` to null. Every write goes through a receipt with the row's before-values (Rule 10).

7. **Rules sent from the Exhibits tab** (Sam, Open Asks Sheet 149 card 2, 2026-10-31, *routine*). Teach a rule's
   *Send to the routine* writes a request row; the tab's Rules view shows each with its state. Read them:

   ```sql
   select r.course_id, r.value as ask, r.reviewer_email as sent_by, r.reviewed_at as sent_at,
          b.value as built, s.value as switch, s.reviewer_email as switch_by, s.reviewed_at as switch_at
   from kb_curation r
   left join kb_curation b on b.course_id = r.course_id and b.field = 'cer_procedure_built'
   left join kb_curation s on s.course_id = r.course_id and s.field = 'cer_procedure_switch'
   where r.course_id like '\_CER\_PROCEDURE\_REQUEST::%' and r.field = 'cer_procedure_request'
   order by r.reviewed_at;
   ```

   Each open row is a queue item after the handoff's first. Compare it with `kb/cer_procedures.json`, where a
   procedure's `request` names its row:

   - **No `built` row and no procedure: build it.** The ask (JSON) holds the rule's `words` and an example: the
     local title `raw`, the `title` it should read and its `issuer`. Add the procedure with `"on": false`, its
     `request`, and a `source` naming the sender (`sent_by`), the date and the words. A rule that settles a title
     by code gets its lane in `kb/_preseed_unclassified.py` and a test; one the classifier can apply from words is
     `guidance`. Run `python3 kb/_cer_procedures.py --try <id>` (it writes nothing), merge on a passing `test`, and
     write its JSON with `"pr": <number>` as the `cer_procedure_built` row. A rule that cannot be built (its words
     name nothing a rule can test) gets `{"could_not": "<one sentence>"}` instead.
   - **`switch` is `on` and the procedure is off:** set `"on": true`, add an `amended` entry (who: `switch_by`, the
     date, words *Turned on from the Exhibits tab*) and merge. That night's procedures run applies it and saves
     under `cer-procedure-<id>@bot`; `--undo <id>` takes its saves back.
   - **`switch` is `discard` and the procedure is in the store:** remove it and its lane, and merge. The request's
     rows stay as the record.
   - **On, or discarded and gone:** nothing to do.

   Turn on is the person's word: never set `on` without a switch row. The `built` row is INSERT-only under the
   run's cohort `cer-routine-s<N>@bot`, with its receipt (`kb/cer_procedures_out/routine/<date>.json`) in the same
   pull request (Rule 10); a request row is never deleted.

## The daytime Library run (Sam, Open Asks Sheet 131 card 1, 2026-10-26)

Sam ruled *two-hours*: a run every two hours on weekdays, 7 a.m. to 5 p.m. Pacific, working only the Library's
requests (step 6's two queries). It needs the three repos and the Supabase connector, which a session's
`create_trigger` cannot attach here (S490), so Sam creates it on claude.ai's routines page: the same repos and
connectors as the CPL queue routine, the schedule `CRON_TZ=America/Los_Angeles 34 6,8,10,12,14,16 * * 1-5`, a fresh
session each time, and this prompt:

> You are a scheduled CPL Initiative session, started by Sam's daytime Library routine (Open Asks Sheet 131 card 1),
> not by Sam. Work from the cpl-project-tracker repository, with CPLBrain and cpl-knowledge-base beside it. Your one job
> is the CPL Library's open requests. The overnight CPL queue routine owns everything else: take nothing from the
> session handoff, write no handoff, claim no moniker. 1. One session at a time: step 1 of
> docs/reference/scheduled_sessions.md; if another session is working the Library queue, end. 2. Read the open requests
> with step 6's queries through the Supabase connector. If none is open, end at once: no commits, no checkpoint, no
> message. 3. Otherwise work them oldest first, as many as fit in about an hour, as step 6 says for each kind of piece;
> one branch and one pull request, merged on a passing test check. 4. Record the work in the library lane and
> docs/library_lessons.md, and run python3 kb/_docs_audit.py before the last commit; no full checkpoint. 5. Drop any PR
> subscription or check-in you made.

## The UI pass: one view a night

Sam's Sheet 109 card 2 (2026-10-21) moved the UI pass out of `/checkpoint` (his 2026-10-08 ruling put one view in
every checkpoint; nine of twelve skipped it for want of room). **The first scheduled session of each UTC day takes
it as a queue item**, after the item the handoff names first, when `python3 scripts/ui_pass.py --next` names a view
and the ledger records no pass dated today. Audit that view with `/a11y-pass`, with its two pass checks: **wiring**
(`ui_pass.py --wiring <id>`: open each view sharing a dataset and confirm the shared figures agree on screen) and
**First Light** (tokens only, no raw hex, the theme's type, light and dark). A small fix ships in its own PR; a
larger one becomes a lane item or a sheet card. Then `ui_pass.py --record <id> "<what it found and fixed>"` and
commit the ledger with the fix. A session that cannot finish leaves the view due; the ledger carries it to the
next night. CI's `--check` fails when a tab joins the nav and the ledger lacks it (`--sync` adds it).

## The stopping rule: park a college when its catalog stops paying (Sam, 2026-10-30)

Sam, S527, after five sessions on Glendale's catalog: *"I want to automate everything but not at all
costs..."* and, on the rule the session proposed, *"good to go with 3."* A college is **parked** once
two sessions in a row each move fewer than **3%** of its loaded programs to passing (the session
proposed 1%, which would not have parked Glendale at 5 of 226 a session; it set 3% on his intent and
says so on the call; reply to reverse). Parking writes one call into the project's status file with a
`todo_id`, its part, and the plain steps that would turn the college back on (a structured export, a
curriculum contact, or a new catalog year). The queue moves to the college with the next largest gap.
A parked college restarts when Sam marks its to-do done, when a new catalog year loads, or when he
says so. Worked example: `glendale-parked-2026-10-30`.

## While working: go with the recommendation

**When a call has a clear recommendation and can be undone, act on it.**
Reversible means `git revert` undoes it, or its Rule 10 receipt does. Put a card
on the standing sheet that says *Proceeded on the recommendation (S<N>, <date>);
reply to reverse*, so Sam's reading is a review, never a gate.

**Hold for Sam, still:** the one hold list in `CLAUDE.md` (*Decisions arrive as decision sheets*, Sam's Sheet 109 card 3, 2026-10-21), which covers a session Sam opens by hand too. A held item becomes a card; move on to the next queue item.

**Extraction cost: a standing go up to $40 a college (Sam, 2026-10-14, S393,
his words: *"limit is $40 per college"*; `cpl_memory`
`sam-extraction-standing-go-40-per-college-2026-10-14`).** A college's
program-requirements extraction whose estimate is $40 or less runs without a
card; record its actual cost in the lane. Above $40 it is a card. It holds for a
session Sam opens by hand too.

**A permission-check denial is a hold.** Do not route around it. Record what was
asked and why on the sheet, finish what does not depend on it, and move on. A
Supabase write the connector holds for a person's confirmation is the same: name
the receipt on the sheet for Sam to run.

**Effort and Fable.** Call your own effort per piece of work (CLAUDE.md, Call the
effort level). For a judgment with nothing to score against (a definition, a
naming call, a design choice, a doctrine reading), ask Fable once through the
Agent tool (`model: "fable"`), record the advice in the lane or the lessons doc,
and decide. Fable advises; a call that is Sam's stays Sam's.

## At the end

Run `/checkpoint` as always: the handoff names the next moniker, and the next
firing claims it. Sign off with the opening line as CLAUDE.md asks, so Sam can
also paste it by hand.

## A signed-off session lets go (Sam, 2026-10-05)

*"Looks like we have 2 sessions working on same thing—sorry—thought I closed one
and started next. Please coordinate—probably due to my new routine that started
this morning. I need to stay out of the way of the automation"* (Sam, about 21:17Z,
in S335; vault braindump `braindump-2026-10-05-2117-two-sessions-one-queue.md`).

What happened: S335 gave its sign-off line at 20:23Z and went idle on CI with a PR
subscription, a check-in and two decision-sheet watches. Sam opened S336 from his
phone at 20:25Z (the routine did not start it). When he pressed Complete on sheet
42 at 20:59Z, the watch woke S335 and the comment reached S336 too; both acted on
the same three cards until a message between them settled one writer at 21:12Z.
The guarded receipts kept the duplicate write a no-op.

So Sam never closes a session for the queue to stay safe. The session lets go:

- **In the turn that gives the sign-off line,** unsubscribe every PR
  (`unsubscribe_pr_activity`), delete every pending check-in (`delete_trigger` on
  each `send_later`), and stop every artifact watch (`ArtifactComments`, `watch`
  with `on: false`). The handoff names each item it let go: the open PRs with their
  state, the sheet and its link, any deploy or run still in flight.
- **After the line, no queue work.** A wake that still reaches the session (a
  comment sent to Claude, a late event) goes to the newer session by
  `send_message`, if one is running, and to Sam in one line otherwise.
- **The next session picks the wakes up:** it subscribes to the PRs the handoff
  names and watches the current sheet, so nothing waits unwatched between them.

## Pause rules

Write `Scheduled run: paused — <reason>` near the top of the handoff you write,
send Sam a push notification (`PushNotification`, if the session has it), and say
the reason in chat, when any of these holds:

- Five or more held cards block the queue's remaining work, or nothing is left
  in the queue that is not held.
- CI stays red on a session's PR after one fix attempt on the same failure, and
  there is no other work.
- A repo cannot be attached.

Later firings see the pause line and end in one line until Sam answers.

## Why this shape

One session at a time because two sessions on one queue raced on 2026-10-04: the
same Sierra deploy ran twice and both sessions read the same smoke run. A pause
line in the handoff because it needs no shared state beyond the file every
session already reads first. Sam's schedule rather than a session-started chain
because the permission check holds a session that starts sessions on its own,
and a schedule a person creates keeps that decision with a person.
