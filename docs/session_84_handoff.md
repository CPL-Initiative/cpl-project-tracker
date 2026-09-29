---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 84 handoff — you are Session 84

You are **Session 84** of the CPL Project Tracker (COBI) build. Session 83
(**StarNova**) recommended a long-term CO-platform strategy, built **Mission
Control** (the "Lift Off" tracker) inside the Team & RACI tab, shipped a shared
**team-phrase** edit gate so the team can edit without per-person login — then
**hardened that gate** through live testing with Sam + Malone. Pick your own moniker.

## TL;DR of what Session 83 shipped (all merged + live on `main`)

**The strategy + tracker (earlier):**
1. **`docs/co_platform_strategy.md`** (#586/#588) — the "plan of attack" for a
   governed, team-based, CO-wide platform. Scorecard against all ~14 asks.
2. **`kb/liftoff_plan.json`** (#588/#592) — Now/Next/Later phases of **task +
   decision-fork** nodes (a `decision` activates one branch, archives the others).
3. **`mission_control.js`** (#590/#592) — collapsible overlay rendering the plan ⊕
   Supabase `liftoff_state`, mounted **below** the RACI matrix.
4. **The RACI team-phrase gate** (#593) — server-enforced shared phrase
   (`team_access` + `team_pass_ok()` reads the `x-team-pass` header; write policies
   widened to `is_allowed_reviewer() OR team_pass_ok()`).

**The hardening (this session, Sam + Malone live-testing):**
5. **#595** — fixed Malone's **401-on-save**: a team-phrase session has no user
   token, so the client sent an empty `Authorization: "Bearer "`, which **PostgREST
   401s at the auth layer before RLS runs**. Fix: send the **anon key** as the
   bearer. (RLS denial = 403; auth-layer = 401 — that's how you tell.) + a phrase
   box in the composer when locked.
6. **#596** — card **📝 Update / 📣 Nudge** popups open **in place** on Activities
   & Projects (no `#raci` redirect). New `card_actions.js` (global interceptor +
   lazy-load `raci.js`); nudge email now lands on `#activities-projects`.
7. **#597** — Mission Control parity (same Bearer fix; reads the team phrase;
   `liftoff_state` writes widened to `team_pass_ok()`).
8. **#598** — **validate the phrase on entry** (POST `rpc/team_pass_ok` — a wrong
   phrase is rejected, never stored) + reviewer-only **⚙ Manage team phrase** admin
   (view/rotate `team_access.secret`; reviewer-only `ta_select`/`ta_update` RLS,
   anon still can't read it). Also merged 2 Dependabot CI bumps (#587, #482).

## Read these first (in order)

1. **`docs/mission_control_lessons.md`** — the full StarNova arc incl. the 2026-06-29
   "team-phrase hardening" section (the 401, validation, admin).
2. **`docs/kb-notes/methodology-server-enforced-shared-password-gate.md`** — the
   reusable pattern, now with the empty-Bearer pitfall + validate-via-gate-RPC +
   reviewer-manage.
3. **`docs/cobi_raci_nudge_lessons.md`** (2026-06-29 section) — the card-popup-in-place
   pattern (`card_actions.js`).
4. **`docs/co_platform_strategy.md`** — the forward plan + scorecard.
5. **`CLAUDE.md`** §11 "Session 83" + §8 `team_access`/`liftoff_state` bullets + the
   `card_actions.js`/`mission_control.js` File Inventory rows.

## Carryover — verify live (do early)

- **⚠ Confirm the team phrase works LIVE.** The `x-team-pass` header path can't be
  exercised from the sandbox (Supabase egress-blocked). In a browser: Team & RACI →
  🔓 Unlock editing → phrase `cpl-team-2026` → edit a cell / post an update → reload,
  confirm it persisted. Then signed in as a reviewer, open **⚙ Manage team phrase**
  and confirm it loads + saves. Have Malone confirm on his side too.
- **Gut-check the Lift Off plan** with Sam/Malone (owners + the 3 decision points).

## Priority workstreams (Sam's "big lift" — the strategy's NOW lane)

1. **Institutional owner identity** → CO/RCCD-owned GitHub org + Supabase org, then
   transfer repos/projects off the personal accounts (decision `d-ownership` gates it).
2. **`cobi-auth.js` consolidation** — fold the mirrored auth helpers
   (`unified_courses.js`, `raci.js`'s team-phrase + validation, `mission_control.js`,
   `factsheet_edit.js`) into one shared module. The team-phrase code is now in 2
   places (raci + mission_control) — prime consolidation target.
3. **Required a11y CI** (ask #13). 4. **DSA paperwork** for the MAP/CCCCO API (the
   prerequisite to de-scraping, ask #5/#6).

## Standing engineering lanes (unchanged)

- **Unverified-M-ID renumber re-mint** — `docs/unverified_mid_renumber_scope.md` (#494).
- **TMC Phase-2 acceptance engine** — `docs/kb-notes/tmc-co-review-scope.md`.
- **CPL-Assistant CCR/CER recommender ETL** — `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.

## Patterns that worked (reuse them)

- **Empty `Bearer ` 401s before RLS** — on a public-anon-key surface, always send the
  anon key as the bearer; never `Bearer ` with no token. 401 = auth layer, 403 = RLS.
- **Validate an unreadable secret via the gate's own anon-RPC** — same right/wrong
  signal a write gives, no new exposure.
- **Open a lazy tab's popup from anywhere** — a global delegated interceptor + the
  idempotent `CPL_TABS.loadScript` + thin `openCardX(key)` entry points that self-heal
  their data/CSS load. No generator change (read the key from the existing inline onclick).
- **Self-contained overlay module** (`card_updates.js`/`card_actions.js`/`mission_control.js`)
  — mount globally, don't touch the host renderer; the RACI 70-check suite stayed green.

## Safety patterns to honor

- **Rule 4** (`CPL_Dashboard.html` === `index.html`), **Rule 5** (never force-push main),
  **Rule 8** (checkpoint docs). Merge-on-green (clean OR unstable), squash, ready→merge.
- Server-enforce any new shared-secret gate; scope it to low-stakes tables only.
- A parallel session may touch `CLAUDE.md`/`cpl_todos.json`/`INDEX.md` — rebase if `dirty`/`behind`.

## Moniker

Session 83 was **StarNova**. The Sky/Star streak lives on — claim your own
(StarForge? SkyAnchor?) in your first checkpoint.
