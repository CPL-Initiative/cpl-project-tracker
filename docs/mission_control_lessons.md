---
title: Mission Control + CO-Platform Strategy — lessons
date: 2026-06-29
tags: [lessons, strategy, mission-control, lift-off, raci, auth, governance, session-83]
artifacts:
  - docs/co_platform_strategy.md
  - kb/liftoff_plan.json
  - mission_control.js
  - mission/supabase_liftoff_state.sql
  - raci.js
  - raci/supabase_raci.sql
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-server-enforced-shared-password-gate]]"
  - "[[docs/kb-notes/reference-humans-principles]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
---

# Mission Control + CO-Platform Strategy — lessons

Workstream scratchpad for the Session-83 (StarNova) strategy + team-tooling arc.
Append a dated section each checkpoint.

## 2026-06-29 — Session 83 (StarNova): strategy doc → Mission Control → team-phrase gate

### What shipped (4 merged PRs)
1. **`docs/co_platform_strategy.md`** (#586) — the long-term "plan of attack" for
   scaling COBI + the CPL KB into a governed, team-based, CO-wide platform. Built
   by a **12-agent workflow** (5 web-research threads → 6 design sections → 1
   synthesis), grounded in the live stack. Covers: operating model (AI proposes /
   named human disposes), a Now/Next/Later roadmap + a parallel procurement track,
   accounts migration (off personal accounts), knowledge lanes, integration/API
   (de-scrape behind data-sharing agreements), governance/security/accessibility/
   HUMANS, decisions only humans can make, candid pushback, and a scorecard for
   all ~14 asks. **Verified current state** live: GitHub owner is Sam's *personal*
   `samueltlee`; `CPL-Initiative` org has **0 teams**; Supabase org is the personal
   **`LiveOak` / Pro** (2 projects); Cloudflare Worker + Anthropic key on a personal
   account. Throughline: the platform is owned by *individuals*, not the institution.
2. **`kb/liftoff_plan.json` (Lift Off)** (#588) — the program tracker behind the
   strategy doc: phases (Now/Next/Later) of **task** + **decision** nodes. A
   `decision` node FORKS the work — choosing an option `activates` its branch tasks
   and `archives` the others; the choice doubles as the human-owned decision log.
3. **`mission_control.js` (Mission Control)** (#590, revised #592) — a self-contained
   static module that renders the plan ⊕ a Supabase `liftoff_state` overlay, mounted
   as a **collapsible block BELOW the RACI functions** in the Team & RACI tab.
   Anonymous = read-only; a signed-in reviewer sets task status + chooses decision
   branches. Revised to **forward-only** (PII-incident items dropped — that work was
   handled long ago).
4. **RACI shared "team phrase" gate** (#593) — replaced the per-person magic-link
   *requirement* with a shared phrase. **Server-enforced** (the differentiator):
   `team_access` (not anon-readable) + `team_pass_ok()` (reads the `x-team-pass`
   request header) widen the `item_raci`/`team_members`/`item_updates` write policies
   to `is_allowed_reviewer() OR team_pass_ok()`. Magic-link reviewers still work.

### What worked / durable lessons
- **The build IS the operating model.** Each artifact demonstrated "AI proposes,
  a named human disposes": the strategy doc is *input*, not "the plan"; Mission
  Control's decision forks are *human* choices; the gated-20% (live RACI/Supabase)
  got a human (Sam) authorizing each live change.
- **Decision-fork tracker model** — `task` + `decision` nodes where an option
  activates/archives downstream tasks turns a flat checklist into a real plan AND
  an audit trail. Validate branch refs (every `activates`/`archives` id resolves)
  in the test.
- **Server-enforced shared password without per-user accounts** — a header-checked
  RLS gate (`x-team-pass` → `team_pass_ok()`) keeps the public anon key from being a
  write bypass, with a tiny client change (one header) + a backward-compatible
  `OR is_allowed_reviewer()`. New KB note: `methodology-server-enforced-shared-password-gate`.
- **Pseudo-session to avoid touching 15+ guards** — making the team phrase set a
  `state.sess = {teamPass}` pseudo-session meant every existing `state.sess`/`canEdit`
  check passed unchanged; only `sbWrite`'s header + `load()`'s fallback changed.
- **Self-contained overlay module** (the `card_updates.js`/`first_light.js` pattern)
  let Mission Control mount into the live RACI tab on `cpl-tab-activated` **without
  touching `raci.js`** (its 64-check suite stayed green).
- **Repo-private ≠ site-private** (a Sam Q this session): repo visibility hides the
  *code*; the published Pages **site stays public to URL-holders** (and needs a paid
  plan to serve Pages from a private repo at all). Site-level view-gating = an app
  gate or GitHub Enterprise — not repo privacy. The Fact Sheet can't be "public" while
  the rest of the same Pages site goes private.

### Current state
- All 4 PRs merged to `main`; suite green (103 files; +`mission_control.test.js` 32,
  +`raci_team_pass.test.js` 14, raci 70/70).
- The team phrase is a **temporary** `cpl-team-2026` in `team_access` — Sam to rotate
  (`update public.team_access set secret='…' where id='raci';`).
- Live header-path of `team_pass_ok()` is **unverified from the sandbox** (Supabase is
  egress-blocked here) — Sam to confirm a save works after the deploy.

### Strategic roadmap / next
- Mission Control: optionally wire **per-task 📝 updates + 📣 nudges** so each Lift Off
  task reuses the RACI composer; gut-check the v1 plan's branch points/owners.
- The strategy doc's **NOW lane** is the real work: institutional owner identity →
  account transfers → `cobi-auth.js` consolidation (which absorbs `mission_control.js`'s
  + the team-phrase's mirrored auth helpers) → required a11y CI → the DSA paperwork.
- Standing engineering lanes (unchanged): unverified-M-ID renumber, TMC Phase-2
  acceptance engine, CPL-Assistant CCR/CER recommender ETL.
