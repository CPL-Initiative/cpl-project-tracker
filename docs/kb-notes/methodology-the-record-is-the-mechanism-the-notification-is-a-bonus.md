---
title: "The record is the mechanism; the notification is a bonus"
created: 2026-09-21
updated: 2026-09-21
kb-status: published
tags: [methodology, decision-sheets, artifacts, notification, claude-code]
artifacts:
  - kb/_decision_sheet_replies.py
  - docs/reference/decision_sheets.md
related:
  - "[[decision_sheets]]"
---

# The record is the mechanism; the notification is a bonus

A decision sheet ends with a Complete button whose job sounds like telling the
session the work is done. Build it that way and the sheet has a single point of
failure sitting between a curator's finished work and anyone acting on it.

Build it the other way round:

1. **Write the record first.** `replies/done` lands in the artifact's own store
   before anything is sent. It is durable, it needs nothing alive at the moment
   of the press, and any later session can read it.
2. **Then try to notify.** If it lands, good. If it does not, nothing is lost.
3. **Say which of the two happened** — in different words, a different button
   label and a different panel, because a failed doorbell that looks like a
   delivered one is worse than no doorbell at all.

## The measurement behind it

`sendToClaude()` — the `comments` capability's one page-side route to Claude —
reports `no_session` for a **Claude Code session running in a remote
container**, and a live artifact watch does not change that.

Measured 2026-09-21: the watch was re-registered and confirmed
(`ArtifactComments action=watch` listing it at 13:42:11Z), the button was
pressed at 13:43:24Z, and the page reported `no session is listening` with
`replies/done` carrying `sent: false`. The first diagnosis — a watch that had
lapsed on a session restart — was true and was **not** the cause. Do not spend
another session on consent or permissions.

It works from a claude.ai chat session, so the button keeps offering it.

## The hand-over procedure

When you give someone a decision sheet, **arm a check on the record** rather
than waiting to be told: a `send_later` that reads `replies/done` and compares
its `at` against the last one seen. A new timestamp means a sitting ended.

Tell them a word in the chat gets it read immediately — as the *expedite*, never
as the mechanism. The difference matters to how the page is worded: "say the
word and Claude will read them" implies the work is stranded until they speak,
and it is not.

## The general shape

Any asynchronous hand-off between a human surface and an agent has this choice.
Durable record plus best-effort notification survives a failed channel, a
restarted session, a closed laptop and a press at midnight. Notification-as-
mechanism survives none of them, and its failure mode is silence — which the
person on the other end reads as "it worked".
