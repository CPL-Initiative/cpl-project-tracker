# Session 87 handoff — you are Session 87

You are **Session 87** of the CPL Project Tracker (COBI) build. Session 86
(**SkyGuy**) shipped six COBI refinements Sam asked for in one PR. Pick your own
moniker (Sky/Star streak).

## TL;DR of what Session 86 shipped — PR #610 (code-only)
All six of Sam's asks, code-only (the post-merge `daily-dashboard.yml` dispatch
publishes the activity-card HTML). 112 JS test files + Python tests green; full
generator run EXIT 0.

1. **KPI cards — hide / center / collapse** → new static **`kpi_cards.js`**
   (the regen-safe `kpi_reorder.js` pattern, NOT a generator change). At runtime
   it wraps each headline `.kpi-card`'s metric+label into a centered `.kc-head`
   and the rest into a collapsible `.kc-body`: cards open **collapsed (top half
   only)**, click a card's head to expand, per-card `×` hides → a "Hidden (N)"
   restore tray, and an **Expand-all/Collapse-all** toolbar. Per-browser
   `localStorage` (`cplKpiCards.v1`), scopes to `.kpi-section > .kpi-card` only,
   injects its own CSS, coexists with `kpi_reorder.js`. `<script>` in BOTH HTMLs.
2. **Activity-card big number = live KPI** → new generator post-pass
   **`apply_live_activity_current()`** (after the merges + `apply_live_workplan_current`)
   drives the Activity Metrics sub-activity card `metric` from the live headline
   KPI (the 5 `PID_TO_KPI_KEY` rows) or an explicit `workplan_goals.current`
   (unmapped). 3.1 was 43,630 → now the live **48,158**; Goal/Stretch bars
   recompute. `_parse_metric_num` now parses `k`/`M`/`B`/`$` suffixes.
3. **RACI Update popup** — was ALREADY show-all + edit/delete-any (incl.
   team-phrase). Added a live `Updates (N)` count, a taller viewport (30→44vh),
   and a fresh-save id backfill; a test now guards the behavior.
4. **KB tab team-phrase** — the KB portal (a SEPARATE Supabase project) now
   unlocks + curates via the shared `cpl_team_pass` (validated server-side against
   the MAIN project's `team_pass_ok()` RPC; carries over from Team & RACI via
   same-origin localStorage). `kb-portal/config.js` + `app.js` + `index.html`.

## Read these first (in order)
1. `docs/cobi_lessons.md` — the **Session 86** section has the full story + the
   four reusable patterns (regen-safe card overlay; post-pass-after-merge;
   "already built, verify don't rebuild"; cross-bundle team-phrase via shared
   localStorage).
2. `CLAUDE.md` §11 "Session 86" + the File Inventory `kpi_cards.js` row + §7b
   Knowledge Base row.
3. `docs/dashboard_card_metrics_recommendations.md` — item 1 is now DONE for the
   Activity cards; the project-GRID card's small editable `KPI:` row was left
   manual on purpose (see below).

## First things to check
- **Confirm the publish landed.** After PR #610 merged, the dispatch should have
  regenerated the HTML. Open `#activities-projects`: the 5 KPI-mapped Activity
  Metrics cards (3.1/3.2/2.1/3.3) should match the headline KPI cards (3.1 ≈
  48,158, not 43,630). If the dispatch didn't fire, dispatch `daily-dashboard.yml`.
- The **four Session-86 confirm items** are in the To-Do feed (`kpi-cards-confirm`,
  `card-metric-sync-confirm`, `kb-teamphrase-confirm`, `update-popup-confirm`).

## Open / deferred from this session (small, only if Sam asks)
- **Project-GRID card `KPI:` row** — left as the editable manual `kpi_metric`
  (the deliberate decision in `docs/dashboard_card_metrics_recommendations.md`).
  Wiring it live for the 5 mapped would remove the inline editor; trivial follow-up
  if Sam wants it (reuse `PID_TO_KPI_KEY` + a read-only badge like Session 85).
- **KPI cards default state** — they open COLLAPSED (Sam said "only the top half
  shows by default"). If he'd rather they open expanded, it's a one-line flip in
  `kpi_cards.js applyCardState` (default `expanded` instead of `collapsed`).
- **Team-phrase secret** — currently `cpl-team-2026` (rotate via the RACI ⚙ admin
  or `update public.team_access set secret='…' where id='raci';`). The KB portal
  reads the same `team_pass_ok()`, so a rotation covers both.

## Carryover / standing lanes (unchanged — in the To-Do feed)
- **Unverified-M-ID renumber** — `docs/unverified_mid_renumber_scope.md` (#494).
- **TMC Phase-2 acceptance engine** — `docs/kb-notes/tmc-co-review-scope.md`.
- **CPL-Assistant CCR/CER recommender ETL** — `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.
- **Public KB PR #15** (Veterans plans) waiting on Sam's sign-off.
- **Strategy NOW lane** — institution-owned GitHub/Supabase, `cobi-auth.js`
  consolidation, a11y CI, DSA paperwork.

## Patterns that worked (reuse them)
- **Regen-safe card overlay** — when the markup is regenerated daily but you need
  per-card chrome (hide/collapse/center), don't touch the generator: a static JS
  asset that re-wraps + re-matches by a stable label on every load is the move
  (`kpi_cards.js`, like `kpi_reorder.js` / `card_updates.js`). Inject CSS from the
  JS so there's no Rule-4 `<style>` mirror — only the one `<script>` tag.
- **Live-value sync = a POST-PASS after the merges**, never inlined in a build
  that runs before `merge_live_metrics` (the Session-85 lesson, reused here).
- **"Already built" is a valid finding** — recon the actual code before building;
  the Update popup already did what was asked. Verify + clarify + test, don't
  rebuild.
- **Cross-bundle team gate via same-origin localStorage** — a separate bundle can
  honor the shared `cpl_team_pass` by validating it against the gate's own RPC;
  the secret never leaves Postgres.
- **Code-only PR + post-merge dispatch** — reset the HTMLs to the cron's `main`,
  re-apply only the `<script>` tag, let `daily-dashboard.yml` publish.

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`) — only the `kpi_cards.js`
  `<script>` tag was added; verify identical if you touch HTML.
- **Rule 5** (never force-push main). **Rule 8** (checkpoint). Merge-on-green
  (`clean` OR `unstable`), squash, ready→merge.
- `build_activity_kpis` / `build_workplan_goals_from_supabase` run **before**
  `merge_live_metrics` — anything needing merged `kpis` is a post-pass.
- `kb-portal/app.js` imports esm.sh modules at the top, so it can't be eval'd in
  Node — test the wiring via source checks + the pure `teamPassRequest` helper.

## Moniker
Session 86 was **SkyGuy**. Claim your own (the Sky/Star streak continues).
