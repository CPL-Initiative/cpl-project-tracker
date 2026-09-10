---
title: "The live-session banner — how a session announces itself, and the two things it cannot know"
created: 2026-09-10
updated: 2026-09-10
tags: [reference, governance, banner, dr-26]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[docs/reference/lanes/governance-team-enablement]]"
---

# The live-session banner

One row, `cobi_live_session` id 1, decides whether COBI tells the MAP team that
a Claude Code session is open and links to it. Governed by **DR-26**, owned by
Sam.

## The ruling changed on 2026-09-10

**Option A (2026-09-08 — superseded).** The banner appears only after a session
has been shared: Sam sets Team visibility in claude.ai, *then* turns the banner
on from Admin. It could never advertise a Private session.

**Option B (2026-09-10 — current).** A session announces itself at start. Sam's
words: *"It's a hassle to do it that way; I'd prefer it be automatic … perhaps
add an opt out for me rather than the admin procedure which takes just enough
steps that I will likely neglect to do it."*

⚠️ **What Option B costs, stated once so nobody rediscovers it as a bug.** The
banner can now point at a session that is still Private, and the team sees a
link that will not open. Option A's fail-closed property is gone; the failure
mode is a dead link, not a disclosure. The banner's own copy names it — *"If it
will not open, it has not been shared yet"* — and that sentence is load-bearing.

## The two things a session cannot know

**1. Its own visibility.** Nothing exposes it. `get_session` returns id, title,
status, model, repos and usage — no sharing field. So "announce only when
public", which is what Sam actually asked for, **cannot be built**. Measured
2026-09-10; re-check before anyone proposes it again.

**2. Its own claude.ai id, from the shell.** `CLAUDE_CODE_SESSION_ID` and the
transcript filename are the same internal UUID (`c49acb9f-…`), not the
`session_01…` id the URL needs. Only the `get_session` MCP tool returns that.

Together these are why the announce is **the model's job, prompted by a hook**,
rather than the hook's job: `scripts/announce_session_hint.py` prints the
procedure at SessionStart, and the session carries it out. The sandbox also
cannot reach `*.supabase.co` (Rule 10c), so the write goes through the Supabase
MCP tools — again, the model.

## The procedure

1. `select auto_announce from cobi_live_session where id = 1;` — **false means
   stop.** That is the opt-out, and it is checked by the session because the
   hook has no network.
2. `get_session` → the `session_01…` id.
3. `update cobi_live_session set active = true, session_url = …,
   expires_at = now() + interval '8 hours', updated_by = '<moniker> —
   auto-announce' where id = 1 and auto_announce is true;`
   The `and auto_announce is true` is not belt-and-braces: Sam may untick the
   box between step 1 and step 3, and he curates live beside sessions.
4. Say so in one line, so he can veto it.

**Eight hours** because Sam ruled that sufficient on 2026-09-09 (*"8 hours is
enough."*). A session outliving its own banner is intended.

## Last writer wins, and why

Sam runs several sessions at once. Each announces at start, so the banner points
at whichever started most recently. That is usually the one he is in, and when
it is not, Admin fixes it in a click. The alternative — refusing to overwrite a
live row — lets a session he has abandoned hold the banner for eight hours,
which is the worse failure.

## The opt-out

**Admin → Live-session banner → "Announce my sessions automatically."** On by
default. It saves on its own rather than with Show/Hide: ticking it must not
re-announce a stale link, and unticking it must not take the current banner
down. A row written before the column existed reads as ON, which is the column
default, so the panel never claims a preference nobody set.

## Who sees it

`is_map_team() OR team_pass_ok()` — the 42-person MAP roster, or a holder of the
shared team phrase. **Not** the 2,801 college staff in `map_college_users`. That
audience is DR-26's and did not change with Option B.
