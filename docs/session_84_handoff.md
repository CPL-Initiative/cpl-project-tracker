# Session 84 handoff — you are Session 84

You are **Session 84** of the CPL Project Tracker (COBI) build. Session 83
(**StarNova**) turned an "epic quest" strategy ask into a long-term plan doc, a
**Mission Control** program tracker inside the Team & RACI tab, and a shared
**team-phrase** edit gate so the team can update/nudge without per-person login.
Pick your own moniker.

## TL;DR of what Session 83 shipped (all merged to `main`)

1. **`docs/co_platform_strategy.md`** (#586, corrected #588) — the "plan of
   attack" for scaling COBI + the CPL KB into a governed, team-based, CO-wide
   platform with Director-of-Tech "Malone." Operating model (*AI proposes, a
   named human disposes*), Now/Next/Later roadmap + a parallel procurement track,
   accounts migration (off Sam's personal GitHub/Supabase/Cloudflare/Anthropic),
   knowledge lanes, integration/API (de-scrape behind data-sharing agreements),
   governance/security/accessibility/HUMANS, decisions only humans make, candid
   pushback, and a scorecard for all ~14 asks. **Built by a 12-agent workflow.**
2. **`kb/liftoff_plan.json` ("Lift Off")** (#588, forward-only #592) — the
   program tracker data: phases (Now/Next/Later) of **task** + **decision**
   nodes. A `decision` FORKS the work — an option `activates` its branch tasks
   and `archives` the rest; the choice doubles as the human decision log. **31
   tasks, 3 decisions, forward-only** (PII-incident items dropped — that work was
   done long ago).
3. **`mission_control.js` ("Mission Control")** (#590, #592) — a self-contained
   static overlay that renders the plan ⊕ a Supabase `liftoff_state` overlay,
   mounted as a **collapsible block BELOW the RACI functions** in the Team & RACI
   tab. Anon = read-only; a signed-in/team-phrase user sets task status + picks
   decision branches. Schema `mission/supabase_liftoff_state.sql` (applied live).
4. **RACI shared "team phrase" gate** (#593) — replaced the per-person magic-link
   *requirement* with a shared phrase. **Server-enforced**: `team_access` (not
   anon-readable) + `team_pass_ok()` reads the `x-team-pass` request header and
   widens the `item_raci`/`team_members`/`item_updates` write policies to
   `is_allowed_reviewer() OR team_pass_ok()`. Magic-link reviewers still work.

## Read these first (in order)

1. **`docs/co_platform_strategy.md`** — the whole forward plan + the scorecard.
   This is the map for the big lift.
2. **`docs/mission_control_lessons.md`** — the Session-83 arc, what worked, next
   steps.
3. **`docs/kb-notes/methodology-server-enforced-shared-password-gate.md`** — the
   reusable auth pattern (header-checked RLS + pseudo-session).
4. **`CLAUDE.md`** §11 "Session 83" + the File Inventory `mission_control.js` row
   + §8 `liftoff_state`/`team_access` bullets.
5. **`docs/cobi_raci_nudge_lessons.md`** — the RACI/nudge surface this all sits in.

## Carryover — verify + gut-check (do early)

- **⚠ Confirm the team phrase works LIVE.** The `team_pass_ok()` header path
  can't be exercised from the sandbox (Supabase is egress-blocked here). In a
  browser: open Team & RACI → "🔓 Unlock editing" → type the phrase → edit a
  RACI cell / post an update → reload → confirm it persisted. If a write 401s,
  the policy widening or the header name (`x-team-pass`) is the suspect.
- **The phrase is a TEMPORARY `cpl-team-2026`** in `team_access`. Sam said "I'll
  keep the phrase you set for now" — when he wants to rotate:
  `update public.team_access set secret='his phrase' where id='raci';`
- **Gut-check the Lift Off v1 plan** with Sam/Malone — owners, the 3 decision
  branch points (d-ownership, d-automerge, d-github-tier), and whether any NOW
  task should move to NEXT. It's a v1 scaffold meant to be edited live in the tab.

## Priority workstreams (Sam's "big lift", forward-only)

The strategy doc's **NOW lane** is the real near-term work:
1. **Institutional owner identity** → create a CO/RCCD-owned GitHub org + Supabase
   org, then **transfer** the repos/projects off personal accounts (decision
   `d-ownership` gates this). Everything else depends on it.
2. **`cobi-auth.js` consolidation** — fold the mirrored auth helpers
   (`unified_courses.js`, `raci.js`'s team-phrase, `mission_control.js`, the
   Fact Sheet's `factsheet_edit.js`) into one shared module. Reduces drift; sets
   up real user-level auth later.
3. **Required a11y CI** — make the accessibility lint a *required* check (today
   it's advisory in spots). Accessibility-from-the-get-go was ask #13.
4. **Data-sharing agreement (DSA) paperwork** for the MAP/CCCCO API — the
   prerequisite to *de-scraping* (ask #5/#6: real two-way API, not scraping).

Optionally extend **Mission Control**: wire per-task 📝 updates + 📣 nudges so
each Lift Off task reuses the RACI composer.

## Standing engineering lanes (unchanged, pick up anytime)

- **Unverified-M-ID renumber re-mint** — `docs/unverified_mid_renumber_scope.md`
  (#494). One Rule-7 pass after the merge wave settles; dry-run first.
- **TMC Phase-2 acceptance engine** — `docs/kb-notes/tmc-co-review-scope.md` +
  `reference-adt-acceptance-rules.md`. Sam said "Go for A."
- **CPL-Assistant CCR/CER recommender ETL** —
  `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.

## Patterns that worked (reuse them)

- **The build IS the operating model** — every artifact demonstrates "AI
  proposes, a named human disposes": the strategy doc is *input*, Mission
  Control's forks are *human* choices, each live Supabase change got a human OK.
- **Self-contained overlay module** (`card_updates.js`/`first_light.js`/now
  `mission_control.js`) — mount on `cpl-tab-activated`, inject own CSS, don't
  touch the host renderer. Mission Control didn't change one line of `raci.js`'s
  render path, so the 70-check RACI suite stayed green.
- **Pseudo-session** (`state.sess = {teamPass}`) — avoid editing 15+ `canEdit`
  guards by making the new auth path *look like* the old one.
- **Decision-fork tracker** — `task` + `decision` nodes (option activates/archives
  downstream tasks) = a real plan AND an audit trail. Validate every branch ref
  resolves, in the test.

## Safety patterns to honor

- **Rule 4** — `CPL_Dashboard.html` === `index.html` (the team-phrase nav/boot +
  any Mission Control wiring are mirrored in both).
- **Rule 5** — never force-push `main`.
- **Rule 8** — checkpoint docs (you're reading one).
- **Merge-on-green** (clean OR unstable), squash-merge, draft → ready → merge;
  don't park in draft. Code-only PRs; let the cron/dispatch publish artifacts.
- **Server-enforce any new shared-secret gate** — never a client-only check on a
  public-anon-key surface. Scope the gate to low-stakes tables only.
- **A parallel session may touch `CLAUDE.md`/`cpl_todos.json`/`INDEX.md`** —
  rebase if the PR comes back `dirty`/`behind`.

## Moniker

Session 83 was **StarNova**. The "Sky/Star" streak is alive — pick your own
(StarForge? SkyAnchor? — the NOW lane is about *anchoring* the platform to an
institution). Claim it in your first checkpoint.
