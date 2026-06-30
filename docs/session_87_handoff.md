# Session 87 handoff — you are Session 87

You are **Session 87** of the CPL Project Tracker (COBI) build. Session 86
(**SkyGuy**) was a long, multi-ask session: six COBI refinements, a full
light/glass theme pass, and the scoping of a **MAP-Users** management tab. Pick
your own moniker (Sky/Star streak).

## What SkyGuy shipped (3 merged PRs, all on `main`)
1. **#610 — six COBI refinements** (`docs/cobi_lessons.md` S86): KPI cards
   hide/center/collapse (new static `kpi_cards.js`); Activity-card big number
   wired live (`apply_live_activity_current()`); RACI update popup show-all +
   edit/delete polish; **KB tab unlock via the shared team phrase**.
2. **#611 — light/glass theme** (`docs/cobi_lessons.md` S87 cont.): flipped the
   dark-navy data surfaces to light — **KPI Trends card**, the shared
   `EXHIBIT_ANALYSIS_CSS` `.exhibit-*`/`.sw-*` (**CPL Analytics + EACR**),
   **College Activity** (`college_activity_template.html`/`.js`), and the EACR
   `statewide_interactive.js`. Chips/trendlines contrast-fixed. Source-guarded by
   `kb/_test_light_theme.py`. Reusable map:
   `docs/kb-notes/methodology-dark-to-light-recolor-mapping.md`.
3. **#612 — MAP-Users scoped**: a PII-safe schema probe + a 4-phase scope for a
   gated user-management tab + college-nudge.

## PRIORITY workstream — build the MAP-Users tab
Read **`docs/map_users_tab_scope.md`** first (the whole plan). TL;DR:
- "MAP users" = **`View_CollegeUsersRoles_APIDataset`** (MAP category #9, **2,741
  rows** = staff **names+emails+roles**). It is **NOT in our datasets** — dropped
  from the daily fetch for PII-minimization (Session 34), never committed.
- **#1 rule: never commit this PII to the public repo.** It lives only in a gated
  Supabase table, synced server-side.
- **P0 — DONE (dispatch #4, §1a of the scope doc).** Real view names confirmed:
  **`View_CollegeUsersRoles_APIDataset`** (2,741 rows) + **`View_CollegeContacts_APIDataset`**
  (121 rows, for the P3 nudge). Both are **reachable UNAUTHENTICATED** from a runner
  *with an explicit `columnName` list* (no `MAP_API_KEY` needed — the no-column
  self-describe mode 500s, which is how we ID'd the real names). **Residual:** the
  exact 11 field NAMES — the no-column discovery can't enumerate them. **Do this
  FIRST:** get the field list from the **MAP Custom Report Builder UI** (categories
  "College Users & Roles" + "College Contacts") OR add a **guess-and-confirm** pass
  to `map/probe_users_schema.py` (name likely columns; keep the ones echoed back
  with values), then fold the list into the scope doc + P1's `columnName`.
- **P1:** gated Supabase `map_college_users` + a runner sync (the curation-sync /
  `cpl-landing-pages.yml` runner-as-proxy template) that fetches the view **with an
  explicit `columnName`** and upserts via the **Supabase** service key. **P2:** the
  COBI tab (the `raci.js`/`cpl_news.js` lazy-renderer pattern, reviewer/team-phrase-
  gated for PII). **P3:** reuse the **RACI nudge engine** (`raci.js` already emails
  people, drafts via the report proxy, tracks `last_nudged_at`/`last_response_at`).

## Carryover / standing lanes (in the To-Do feed)
- **Reference-tab header bands** — Sam to decide if the CCR/CSR/CER dark-navy
  sticky header bands should also flip light (quick follow-up; the tables are
  already light).
- **Unverified-M-ID renumber** — `docs/unverified_mid_renumber_scope.md` (#494).
- **TMC Phase-2 acceptance engine** — `docs/kb-notes/tmc-co-review-scope.md`.
- **CPL-Assistant CCR/CER recommender ETL** — `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.
- **Public KB PR #15** (Veterans plans) waiting on Sam's sign-off.

## Patterns that worked (reuse them)
- **Regen-safe runtime overlay** for per-card chrome the generator owns
  (`kpi_cards.js` — re-wrap + re-match by a stable label each load; CSS from JS).
- **Live-value sync = a POST-PASS after the merges** (`apply_live_activity_current`).
- **Dark→light recolor** — the token mapping in the KB note above; **guard the
  SOURCE** when the CSS is generator-injected (can't render it in the sandbox).
- **Parallelize independent files with subagents** given ONE precise spec; own the
  shared/risky piece yourself; verify by grep + a source test.
- **Cross-bundle team gate** — validate the shared `cpl_team_pass` against the
  main project's `team_pass_ok()` RPC; the secret never leaves Postgres.
- **Runner-as-proxy for Azure** — the MAP API is egress-blocked from the sandbox;
  fetch on a runner (probe / landing-pages / cpl-chat-smoke).
- **PII-safe probe** — print field names + low-cardinality enums only; mask
  high-cardinality/`@`-bearing values; write nothing to disk.

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`). **Rule 5** (never force-push
  main; feature branches `--force-with-lease` fine). **Rule 8** (checkpoint).
- **Merge-on-green** (`clean` OR `unstable`), squash, ready→merge; poll CI via the
  MCP `github` tools (curl can't reach GitHub here). Code-only PRs + post-merge
  `daily-dashboard.yml` dispatch publish generated artifacts.
- **Designated branch `claude/cobi-kpi-cards-refinements-kq7la1` keeps getting
  merged + auto-deleted** — restart it from `origin/main` for each new change
  (`git checkout -B … origin/main`), then a plain `push -u` recreates it.
- **MAP-Users PII** — never commit names/emails; gated Supabase only.

## Moniker
Session 86 was **SkyGuy**. Claim your own (the Sky/Star streak continues).
