---
title: An idle session still holds wakes, so a signed-off session lets go of them
created: 2026-10-05
updated: 2026-10-05
tags: [methodology, sessions, scheduled-sessions, coordination, governance-team-enablement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/scheduled_sessions]]"
  - "[[docs/program_requirements_harvest_lessons]]"
artifacts:
  - docs/reference/scheduled_sessions.md
---

# An idle session still holds wakes, so a signed-off session lets go of them

> **A session that has given its sign-off line is idle, not inert: every PR subscription, check-in and artifact watch it still holds can wake it and set it working beside the next session.**

## Context

On 2026-10-05 Sam opened a new session (S336) two minutes after the previous one (S335) gave its sign-off line. He believed the older one was closed. When he pressed Complete on a decision sheet, both sessions woke and both acted on the same three cards. Sam's words: *"Looks like we have 2 sessions working on same thing—sorry—thought I closed one and started next. Please coordinate... I need to stay out of the way of the automation"* (vault braindump `braindump-2026-10-05-2117-two-sessions-one-queue.md`).

## The claim

1. **What wakes a session outlives its sign-off line.** A session's PR subscriptions, its `send_later` check-ins and its artifact watches stay registered after it goes idle. Any of them can start a new turn: a CI result, a comment sent to Claude, a Complete press on a sheet. A start-of-session check that reads only `status_bucket` sees such a session as idle and misses that it can wake.
2. **So the session lets go, in the same turn as the line.** It unsubscribes its PRs, deletes its check-ins and stops its artifact watches, and the handoff names each one so the next session can pick them up. After the line it does no queue work; a wake that still reaches it goes to the newer session by `send_message`.
3. **And every session agrees one writer at start.** `list_sessions` at start, pasted or scheduled; an older session on the queue that is working, or idle but still holding wakes, gets one message, and the two agree on a single writer before either writes.
4. **Guarded writes are the floor, not the plan.** The duplicate write was a no-op only because each receipt statement was conditioned on the row's md5. A deploy, a dispatch or an unguarded write has no such floor.

## How we got here

S335 signed off at 20:23Z holding a PR subscription, a check-in and two sheet watches. S336 started at 20:25Z (Sam, from his phone; the scheduled routine had not fired). Sam's Complete at 20:59Z reached S335 through its watch and S336 through the watch it had armed when it republished the same sheet. S335 applied card 1 and dispatched the deploy; S336 had begun on the same cards. Messages crossed once; by 21:12Z the sessions had agreed that S336 writes. The rule landed in #1879; the sheet's execution is in the harvest lessons doc, S336.

## When this applies (and when it doesn't)

It applies to any session that can be woken from outside: Claude Code cloud sessions with PR subscriptions, Routines-created check-ins or artifact watches. A session with none of these is inert once idle, and the sign-off line alone is enough. It does not replace the one-session-at-a-time check for scheduled runs; it widens what that check looks for.

## See also

- `docs/reference/scheduled_sessions.md`, *A signed-off session lets go*
- CLAUDE.md, the sign-off bullet (*Let go in the same turn*)
- `docs/program_requirements_harvest_lessons.md`, S336 lessons 6-8
