---
title: Scheduled sessions — what a session started by Sam's routine does
date: 2026-10-04
updated: 2026-10-06
tags: [reference, scheduled-sessions, checkpoint, governance-team-enablement]
---

# Scheduled sessions

**What it is.** Sam keeps the queue moving without pasting each opening line: a
routine he created in his claude.ai Routines list starts a fresh session on a
schedule (up to six a day). Each session reads the latest handoff, works the
queue, checkpoints, and writes the next handoff, which the next firing reads.
**No session starts another session.** The schedule is Sam's; to stop the run he
pauses the routine.

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

1. **One writer per queue.** `list_sessions` (claude-code-remote, `mine: true`),
   and read the newest few. An older session on this queue that is still working
   (`status_bucket` `working`) **or idle but still holding wakes** (a PR
   subscription, a check-in, an artifact watch) gets one `send_message` before you
   write anything, and the two agree on one writer. Idle is not inert: on
   2026-10-05 an idle S335 woke on CI and on Sam's sheet replies and acted on the
   same sheet as the S336 Sam had just opened (section *A signed-off session lets
   go*). A scheduled session that finds another one working ends its turn in one
   line instead: the next firing tries again.
2. **Paused?** If the latest handoff carries a line `Scheduled run: paused —
   <reason>`, and nothing on the standing sheet has been answered since, end in
   one line. Sam lifts a pause by answering the sheet or by saying so.
3. **The repos.** The usual three-repo check. A missing repo stops the session:
   write the reason as the pause line in a handoff commit if you can, and end.
4. **Tag yourself** `cpl-scheduled` (`set_session_tags`), so Sam can find the run.
5. Then the ordinary start: the handoff, Rule 8's memory read, and the standing
   decision sheet's replies (Sam may have answered between sessions).
6. **Requested briefs from the Library.** Anyone on the team can start a piece
   from the Library tab (*Start a piece*, built 2026-10-06). Read them:

   ```sql
   select slug, title, kind, occasion, seen_by, brief, created_at from cpl_library
   where status = 'requested' and retired_at is null order by created_at;
   ```

   Each row is a queue item. Work it after the item the handoff names first; one
   whose `brief.due` falls within the week goes first. The brief's words are the
   ask (the tab's *Copy the brief* gives the same paste). File the draft with
   `scripts/library_file.py <file> --slug <slug>` and apply the receipt it
   writes: the record moves to Draft with its Drive link. A draft is never
   outward, so it needs no hold; approving it is Sam's.

## While working: go with the recommendation

**When a call has a clear recommendation and can be undone, act on it.**
Reversible means `git revert` undoes it, or its Rule 10 receipt does. Put a card
on the standing sheet that says *Proceeded on the recommendation (S<N>, <date>);
reply to reverse*, so Sam's reading is a review, never a gate.

**Hold for Sam, still:** anything outward (sending to a college or a person;
drafts are fine), a public KB merge (human-gated by its curation pipeline),
deleting data, a production deploy outside a standing authorization, a change to
the program's name or identity, funding figures published to colleges, who does
what on the team, and any call a lane marks as his. A held item becomes a card;
move on to the next queue item.

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
