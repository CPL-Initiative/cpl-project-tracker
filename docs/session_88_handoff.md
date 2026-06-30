# Session 88 handoff — you are Session 88

You are **Session 88** of the CPL Project Tracker (COBI) build. Session 87
(**StarMax**) shipped two things end-to-end. Pick your own moniker (Sky/Star streak).

## What StarMax shipped (5 merged PRs, all on `main`, all live)

1. **#617 — population sub-activity cards now match the KPI breakdown.** 3.1.1
   Working Adults / 3.1.2 Veterans / 3.1.2a Apprentice were stale (Session 86's
   live-sync only wired top-level-KPI sub-activities; these three are **breakdown
   rows within** STUDENTS SERVED). New `PID_TO_KPI_BREAKDOWN` + `_kpi_breakdown_value()`
   in `excel_to_dashboard.py`, wired through both the card + Annual-Workplan post-passes.
   Now 23,388 / 24,864 / 753 by construction. Code-only; published via the cron dispatch.
2. **#618–#621 — the MAP Users tab, end-to-end (P1→P2→P3).** A gated COBI tab to
   manage MAP's per-college **user roster** (staff PII) + a per-college refresh **nudge**.
   - **Data** (gated Supabase, PII NEVER in the repo): `map_college_users` (2,741 rows;
     public aggregate `map_users_summary()` = counts + 7-way RoleName mix; roster
     reviewer/team-phrase gated) + `map_college_contacts` (121 rows). Sync
     `map/sync_map_users.py` + `.github/workflows/map-users-sync.yml` (dispatch + monthly
     cron; runner-as-proxy; service-key writes).
   - **Tab** `map_users.js` (lazy, both HTMLs): public counts/role-mix, reviewer roster
     drawer, **📣 mailto nudge** to Primary Contact / VPAA (VP Instruction) / VPSS (VP
     Student Services). Tests `tests/map_users.test.js` (29). 113 JS files green.

## Read these first (in order)
- `docs/cobi_lessons.md` (S87) — the value-signature probe, the gated-PII pattern,
  the pg-safeupdate gotcha, the mailto nudge.
- `docs/map_users_tab_scope.md` — the full MAP Users scope, now all-DONE + the future list.
- `docs/kb-notes/methodology-map-api-value-signature-probe.md` — reusable MAP-API probe.
- `CLAUDE.md` §2 (`map_users.js`), §7b (the tab), §8 (the two gated tables).

## MAP Users — possible follow-ups (not committed to)
- **Staleness signal**: `Last Updated On` exists in MAP "College Contacts" but is
  **all-null** today → if MAP starts populating it, fetch it (already a nullable column)
  and surface per-college "needs refresh".
- **More nudge roles**: the Contacts view also has CEO / Articulation Officer / CPL
  Coordinator / Academic Senate President / Faculty Lead / Lead Initiator / School
  Certifying Official (all with emails, value-signature-confirmed) — add to the nudge if Sam wants.
- **Nudge accountability**: today the nudge is mailto-only (nothing tracked). A
  `last_nudged_at` like the RACI tab would need a write path.
- **Reference-tab header bands** (carryover) — Sam to decide if CCR/CSR/CER dark-navy
  sticky header bands should flip light (the tables are already light).

## Standing lanes (the To-Do feed)
- Unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`, #494).
- TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`).
- CPL-Assistant CCR/CER recommender ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`).
- Public KB PR #15 (Veterans plans) waiting on Sam's sign-off.

## Patterns that worked (reuse them)
- **Value-signature API probe** + garbage sentinels (structure lies; values don't).
- **Gated-PII Supabase**: no anon SELECT, reviewer/team-phrase SELECT, no write policy
  (service-role only); a SECURITY DEFINER aggregate RPC for the public surface.
- **pg-safeupdate**: full-table DELETE through the API roles needs `where true`.
- **mailto nudge** (the RACI pattern) — no email infra needed.
- **A new `workflow_dispatch` workflow must be on the DEFAULT branch** before the
  dispatch API finds it (it 404s on a feature-branch-only workflow).
- **Subagents for huge Actions logs** — one precise spec; they return just the answer.

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`). **Rule 5** (never force-push main;
  feature branches `--force-with-lease` fine). **Rule 8** (checkpoint).
- **Merge-on-green** (`clean` OR `unstable`), squash; poll CI via the MCP `github` tools.
- **MAP-Users PII** — never commit names/emails; gated Supabase only.
- The designated `claude/*` branch keeps getting merged + auto-deleted — restart it from
  `origin/main` for each new change (`git checkout -B … origin/main`), then `push -u`.

## Moniker
Session 87 was **StarMax**. Claim your own (the Sky/Star streak continues).
