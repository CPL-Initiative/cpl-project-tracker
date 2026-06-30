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
- "MAP users" = `View_CollegeUsersRoles` (MAP category #9, ~2,710 rows / 11
  fields = staff **names+emails+roles**). It is **NOT in our datasets** — dropped
  from the daily fetch for PII-minimization (Session 34), never committed.
- **#1 rule: never commit this PII to the public repo.** It lives only in a gated
  Supabase table, synced server-side.
- **P0 (do this FIRST):** dispatch **`map-users-schema-probe.yml`** (Actions tab →
  Run). The probe (`map/probe_users_schema.py`) is **2-pass** (MAP's API is
  column-oriented: `columnName`/`columnValue`; a no-column request returns the
  field list but no values). Read its log → it prints the 11 field names + the
  role vocabulary, **PII-masked**. Fold the schema into the scope doc's §1/§5.
- **P1:** gated Supabase `map_college_users` + a runner sync (the curation-sync /
  `cpl-landing-pages.yml` runner-as-proxy template). **P2:** the COBI tab (the
  `raci.js`/`cpl_news.js` lazy-renderer pattern, reviewer/team-phrase-gated for
  PII). **P3:** reuse the **RACI nudge engine** (`raci.js` already emails people,
  drafts via the report proxy, tracks `last_nudged_at`/`last_response_at`).

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
