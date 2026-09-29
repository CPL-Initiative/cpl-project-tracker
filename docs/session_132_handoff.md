---
title: Session 132 handoff (SkyTime/SkyDesk → next) — the inbox is live; now build the college half
created: 2026-08-09
updated: 2026-08-09
tags: [handoff, college-action-page, map-team-queue, contacts, sierra, governance]
related:
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-a-written-backlog-decays-silently]]"
  - "[[docs/kb-notes/methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow]]"
superseded: true
superseded_by: session_133_handoff.md
---

# You are Session 132

Previous session was **SkyTime (131)**, which also ran under the name **SkyDesk** —
two PRs merged plus a checkpoint, and one production migration. Sam called it SkyTime
at both greeting and sign-off; it had been running as SkyDesk because SkyTime was
already Session 104's moniker. **Sam's name wins, and both are recorded so either
term finds this work** — the same reconciliation SkyWire/SkyMind got. Note the
numbering: this session was **131**, and the branch says 129 only because it was
named off a stale number. The highest-numbered handoff is always the
authoritative one.

Sam separately flagged that he'd muddled the session before that: **SkyWire and
SkyMind are the same session** — it ran as SkyWire (hence the branch name) and he
named it SkyMind at sign-off. Take a name or coin one.

## Read first, in order

1. This file.
2. `docs/college_action_page_lessons.md` § **2026-08-09 SkyTime / SkyDesk** — the
   story, written once, there.
3. `docs/kb-notes/methodology-a-written-backlog-decays-silently.md` — **before
   you trust any count in this file.** Including the ones below.
4. `docs/kb-notes/methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow.md` —
   before scoping any remediation batch.

## ✅ What is live

- **📥 MAP Team Queue** (`map_team_queue.js`, #1073) — team-gated tab, top-level
  in the nav. Every item **measured at load**; the three that can't be are in
  `kb/map_team_tracked.json` and render with their staleness.
  `buildQueue(sources, now)` is **pure** and is the engine the college half is
  meant to reuse — don't grow a second copy of the ranking rules.
- **CI rows out of the Sierra feedback queue** (#1072) — fixed at the write path,
  not at display. `sierra_feedback_upsert` stamps `status='ci'` when
  `page='smoke'`. Queue: **23 real open · 4 addressed · 43 CI**.

## ⚠️ Do not trust the numbers below without re-measuring

That is not modesty — it is this session's central finding. The last handoff's
six-item backlog had **two items wrong within two days**, and the numbers here
will decay the same way. **The queue tab measures all of them live. Open it
instead of believing this file.**

As of 2026-08-09 it read: 23 Sierra reports untriaged (oldest **39 days**) · 14
contact proposals waiting on the MAP team · **7 colleges never looked up** · 4
with nothing usable found · 1 cadence never run · 3 hand-tracked · governance
owners **CLEAR (17/17)** · data 1 day old.

## 🎯 PRIORITY 1 — the college-facing briefing

The other audience for the same engine. One page, not 123: a college picks
itself + a role and gets its stats, its opportunities against the goals, and
concrete to-dos.

**Design calls already made — do not re-derive:**
- Open with a **rendered briefing, not a blank chat box.** A coordinator sitting
  at a prompt does not know what to ask.
- Role is a dropdown that **tailors but never gates.**
- **The action library is the hard part**, not Sierra. We know each college's
  STATE; we do not have the playbook that moves it. **Seed from the IFM P1/P2/P3
  strategies** (Sam) rather than inventing to-dos.
- Goals are **SOURCED, never pasted**: ESS 25-82's 3 outcomes from
  `funding/_build_funding_ess.py`; the $35M priorities resolved at runtime from
  `cpl_funding_data.js` → `year_priorities` ⊕ Supabase `cpl_funding_config`
  (currently empty, so defaults stand). Descriptions are stable; **metrics are
  year-specific**.
- Leads with **opportunity**, never a ranking. Standing rule: never rank colleges
  publicly.

⭐ **Inbound CPL requests outrank every stat on the page** — colleges will start
receiving them daily for the first time, and a person is waiting on each one.
That makes the **nightly feed a prerequisite**, and it is blocked on one thing:
**Malone's Custom Report view name**. It is item 6 on the queue, aging in public.
`docs/map_custom_report_request_for_malone.md` is forwardable today.

## 🥇 Cheapest real work on the board

**Seven colleges have no primary contact in MAP and have never been looked up** —
Citrus · College of the Canyons · Palomar · Saddleback · Yuba · Futuro Health ·
Launch Apprenticeship. One lookup each. They were invisible because the original
sweep scoped to *"colleges without a CPL Assistant"*, which is a proxy for the
need, not the need. Use **Jessica's sourcing rules** (a designated *person* can
be the contact; a name off a list is not) and record provenance.

## ⚠️ Things this session got wrong — do not re-inherit

1. **Two test assertions failed on first run and both were the assertion, not
   the code.** The instructive one matched a legitimate backfill because it
   wasn't scoped to the `ON CONFLICT` clause — the proxy-instead-of-property
   mistake, committed with that very KB note open. Scope your match; add a
   positive control so a regex matching nothing cannot pass.
2. **I wrote `CPL_TABS.show()` from memory. The API is `navigate()`.** It fails
   *silently* into the hash fallback, which half-works. Grep the API before you
   call it.

## Patterns that worked

- **Measure the handoff before building on it.** Fifteen minutes of SQL turned a
  six-item list into a materially different one, and produced the design.
- **Ask what the denominator was.** "56 looked up" vs "25 that need routing" is
  where the 7 shadow colleges were hiding.
- **Put the positive control next to the negative assertion.** Every "this hides
  things" check in both new test files has a partner proving it doesn't hide
  everything.

## Safety patterns to honour

- Never route per-student rows through a session's context. Aggregates only.
- Sandbox cannot reach `*.supabase.co` — all Supabase access via MCP.
- **Never commit any MAP export** — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- Rule 4: `CPL_Dashboard.html` and `index.html` stay byte-identical.
- After a squash-merge, `git fetch && git reset --hard origin/main`. The
  stop-hook "unpushed commits" nag that follows is a **documented false
  positive** — verify committer + ancestry, then ignore.
- Deploying `cpl-chat` reaches production with no staging tier. Dispatch
  `cpl-chat-deploy.yml` (pinned `ref: main`, so **merge first**), then
  `cpl-chat-smoke.yml`.

## Moniker

**SkyBrief** is suggested — the next lane is the briefing colleges open.
