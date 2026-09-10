---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-09-10
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Governance & team enablement

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam.


## Owned rows — DR-24, DR-25, DR-26 (2026-09-08)

**The register had ONE owned row for months.** Every `owner` was null except
DR-24 (Sam, 2026-09-07). Two more landed on 2026-09-08, both Sam's, both from
work that could not ship without them.

⭐ **DR-25 — the subject–discipline edge.** Four stores wrote this relationship
in two directions and none had an owner, which is how the same course could be
Psychology in one file and blank in another. Sam's ruling: **subject → discipline
is the primary edge** and `kb/reference/subject_discipline_map.json` is its
authority; the CSR (`discipline_canonical_subj4.json`) answers the different
question of which of a discipline's codes is canonical; the C-ID/CCN seeder's
prefix table and `discipline_inference.json`'s `subject_map` are INPUTS, not
parallel authorities. ⚠️ **The gap was never disagreement** — measured, the two
overlapping stores agreed on **143 of 143** rows. It was unowned duplication.

⭐ **DR-26 — the live-session banner.** SkyView's first outward write surface,
and a disclosure decision rather than a display setting: the link points at a
Claude Code session, which is private by default and may carry code and
credentials from private repos. ⚠️ **THE AUDIENCE TOOK THREE PASSES**, and the
register records all three because each was wrong differently:
`is_allowed_reviewer()` (10 people; **34 of the 42 team members are not in it**),
`is_map_team()` alone (exact, but demanded a sign-in Sam did not want), and
`is_map_team() OR team_pass_ok()` (the phrase as the trade — a shared secret,
wider than the roster, far narrower than the public). **Writing stays
`is_map_team()`**: a phrase holder may see the banner and never point it.

⚠️ **"Not signed in" and "only the team table" cannot BOTH hold.** Identity comes
from a credential. With none, the server sees an anonymous visitor and cannot
tell a team member from anyone else. Any surface asked for both gets the same
answer: name the trade, do not pretend it is absent.

⚠️ **THE BANNER HAS TWO SWITCHES AND FLIPPING ONE LOOKS LIKE ENOUGH (2026-09-09).**
Sam: *"I already forgot to set this session to public when opening it! I just set
it to public but I don't see the banner on COBI."* Nothing was broken. The
claude.ai **visibility** toggle decides whether the link WORKS; the
`cobi_live_session` row decides whether the banner SHOWS, and they know nothing
about each other. Measured at the time: the row was `active: true` but pointing
at `session_01PmWf…` — a **previous** session — with `expires_at` six hours in
the past, so the banner correctly rendered nothing. It had never been switched
off; it aged out. ⭐ **The Admin control already says exactly this** ("Now: not
showing *(the link expired)*"), so the gap was never the UI but that an author
who does not open Admin was never told their banner stopped. The 2/4/8-hour
expiry is the right default for a disclosure — a session link should not outlive
the session — so the fix was a notice to its author, never a longer life.

✅ **BUILT 2026-09-10 (#1537), because Sam hit it a second time** and reported
the banner as never built: *"I still don't see the banner saying I'm active in a
CC session with a link in the header."* An active row past its expiry now renders
a curator-only line where the banner would have been — *"Your live-session banner
expired 2 days ago"* — naming `expires_at` on `cobi_live_session` and what to
set. ⚠️ **It carries NO link**: the link is what expired, and offering it invites
the team into the dead session the expiry exists to prevent. ⚠️ **Its own dismiss
key**, so hiding the notice can never hide the real banner a fresh row produces.
⚠️ **Safe by construction, not by a second gate** — reaching that code means the
reader already read the row, and RLS gates the table by `is_map_team() OR
team_pass_ok()`, so a plain visitor never enters the function. An expiry this
engine cannot read gets its own sentence rather than "expired NaN days ago".

⭐ **THE LESSON IS BIGGER THAN THE BANNER: failing closed and failing silently
are separable, and only the first was ever the requirement.** Every check in
`tests/cobi_live_banner.test.js` asked whether the banner was ABSENT, and absent
was the correct answer each time — the suite was green for the whole day Sam
spent believing the feature did not exist.

⚠️ **DR-26 REVERSED TO OPTION B (Sam, 2026-09-10) — a session DOES set the row
now.** *"It's a hassle to do it that way; I'd prefer it be automatic ... perhaps
add an opt out."* The opt-out is `cobi_live_session.auto_announce`, on by
default, in Admin. ⚠️ **What he asked for could not be built:** "automatic as
long as I set the CC session public" needs a visibility signal, and nothing
exposes one — so the banner may now point at a Private session and the team
sees a link that will not open. Option A's fail-closed property is gone; the
failure is a dead link, and the banner copy names it. Procedure, the two things
a session cannot know, and why the hook is only a hint:
[`docs/reference/live_session_banner.md`](../live_session_banner.md).

⚠️ **Rule 10 a3 worked as designed.** Both rows were written BEFORE the code, and
five write surfaces are mapped in `kb/governance_surface_map.json`. The gate is
not paperwork: DR-26's first cut read under `using (true)`, and mapping it is
what made "who can see this" a question someone asked out loud.

## Status

✅ **LIVE — team-gated ⚖️ Governance tab: 23 decision rights · 8 acceptance standards · 7 cadences · 8 open questions** (SkyMail #997/#998; Sierra added SkyMiner #1031/#1034/#1036; expanded 12→18 SkyGate). **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** The register **measures itself**: the contact-refresh cadence was decided in June and has never run (0 rows in `map_college_nudges`), and CA-06 measured Sierra feedback at *21 of 25 untriaged* until **Sam cleared the whole queue 2026-08-26 — 0 still to do, 51 of 51 handled**. Owners live in a separate gated `governance_owners` table overlaying by row id, so regenerating the JSON can never wipe an assignment; no delete policy (so `Clear owner` is a no-op on the 3 cadences carrying a register-file owner — the likeliest thing to be mistaken for a regression; 7 more reported defects unfixed). **DR-11** records what Sierra tells the public — honestly noting the decider has been Sam personally. **DR-13…DR-18** (SkyGate) cover the six surfaces nobody had recorded: **the workplan itself** (the most public artifact the project has, four tables editable in-page, no named owner), phrase rotation, contracts, CPL News, the Common CR Reference, TMC submissions. **Drift detector live + wired to the cron** (step 4a0): **proposes, never auto-adds**, and since 2026-08-30 (#1397, Sam's go) its table/tab scans **project from `kb/dependency_map.json`** instead of a local regex — the old scan could not see trailing-slash REST, verb-first helper wrappers, URL consts fetched far from their definition, served pages, or write-shaped RPCs, and **eight human-write surfaces were invisible to the whole governance layer at once**. **The 15 tables are RULED (Sam, 2026-08-30 — the Fifteen Tables judgment sheet, `docs/visuals/2026-08-30-governance-fifteen-tables.html`):** DR-19 `cpl_memory` (with Sam's edit-rules clarification — sessions propose, humans decide, everything logged; the row doubles as the spec for the S211 cross-store checker) · DR-20 `item_raci`/`item_updates`/`team_members` · DR-21 `factsheet_overrides` · DR-22 `gr_areas`/`gr_revisions`/`gr_artifacts` · DR-23 `cpl_adoption_interest` · CA-07 `map_data_quality` triage · folds: `liftoff_state`→DR-13, `cpl_funding_config`/`_notes`/`_participation`→DR-09 · `cpl_reflections` dismissed with the reason in the surface map. **The 2 tab candidates are RULED (Sam, 2026-08-30, Open Verdicts items 14–15): `chatbot` folds into CA-06** (its `sierra_feedback_upsert` write is the triage cadence's intake) **and `college-briefing` into DR-09** (the money decision's college-facing doorway) — mapped with reasons on the register rows. Queue now **9 cadences only**, arriving as their own future sheet. Readability guard tightened back to <25 in `tests/governance.test.js`. A tab whose only writes are tables is no longer proposed (each table is its own row); a tab earns a row only for RPC writes a table row cannot represent. `governance.test.js` **91/91**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human). **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. **Routing is standing doctrine since 2026-08-30** (#1402, remediation D): CLAUDE.md Rule 10 (a3) now requires every NEW write surface through this register + the privacy ADRs before it ships — the detector proposes, the rule obliges. **Onboarding gained its first machine-checked practice 2026-08-30 (#1412):** the three-repo attach rule (Sam: all three, enforced) is session-side — CLAUDE.md's Working-with-the-MAP-team bullet verifies the set at start and names what's missing — with `scripts/install-three-repo-check.ps1` as the one-time per-machine backstop for the zero-repo case (no CLAUDE.md loads there), guide §12 as the human-facing half, and the vault's Cowork section now naming all three repos. **Next:** ① the 9 cadence candidates as their own sheet; ② fill the owner column — DR-13 first, and the six new rows (DR-19..DR-23, CA-07) all ship owner-unset, CA-07 also needing a frequency; ③ run that cadence once end-to-end with a named owner; ④ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ⑤ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md`.
