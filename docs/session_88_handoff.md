---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 88 handoff — you are Session 88

You are **Session 88** of the CPL Project Tracker (COBI) build. Session 87
(**StarMax**) shipped the MAP Users tab end-to-end **and** its full nudge
follow-up. Pick your own moniker (Sky/Star streak).

## What StarMax shipped (all merged to `main`, all live)

**Earlier (recap):**
1. **#617** — population sub-activity cards now match the live STUDENTS-SERVED
   breakdown (`PID_TO_KPI_BREAKDOWN` + `_kpi_breakdown_value()`).
2. **#618–#621** — the **MAP Users tab** end-to-end: gated Supabase
   `map_college_users` (2,741 rows; public aggregate `map_users_summary()`,
   roster reviewer/team-phrase gated) + `map_college_contacts` (121); runner sync
   `map/sync_map_users.py` (`map-users-sync.yml`, dispatch + monthly cron); the tab
   `map_users.js` (lazy, both HTMLs).

**The nudge follow-up (#623–#626):**
3. **#623** — 📣 opens a **recipient picker** (all pre-checked, uncheck anyone) +
   **CEO** as a 4th recipient (71/121 have one) + a **last-nudged log**
   (`map_college_nudges`, separate from the monthly-wiped contacts table).
4. **#624** — the draft **links the college to their own MAP CPL dashboard**
   (`map_college_contacts.landing_page_url`, joined in the sync from
   `chatbox_college_profiles`; 118/121 match).
5. **#626** — the **college's own user roster** rides in the email body as a
   **Check-All checklist** (drop a departed staffer before sending) so leadership
   sees their CPL people.
6. **#625** — docs.

Tests: `tests/map_users.test.js` → **56 checks**; 113 JS test files green.

## Read these first (in order)
- `docs/cobi_lessons.md` (S87 + the S87 follow-up section) — the value-signature
  probe, gated-PII pattern, pg-safeupdate, the nudge growth.
- `docs/map_users_tab_scope.md` §7–§8 — the nudge follow-up + the 3 incoming
  Custom Report fields with recommendations + the wiring checklist.
- `docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record.md` — the load-bearing
  architecture call (NEW this run).
- `CLAUDE.md` §2 (`map_users.js`), §7b (the tab), §8 (the 3 gated tables).

## MAP Users — carryover (waiting on Sam, then ME)
- **MAP login URL** — Sam will send the exact URL he wants the nudge's "update your
  users" link to point at; today it links each college's MAP CPL dashboard
  (interim, fine). One-line swap in `map_users.js` `buildNudgeMailto` / the sync.
- **3 incoming per-user Custom Report fields** — Sam asked MAP to add **Active/Inactive**,
  **Disciplines** (comma-delimited, multi), **Last updated**. When they land:
  re-run the **value-signature probe** (`map/probe_users_schema.py`) to lock exact
  case-sensitive column spellings → add columns to `map_college_users` + `FIELD_MAP`
  + `map_users_replace` → extend `map_users_summary()` (active count, no PII) →
  render in the tab/roster. Recommendations in scope doc §8. **Open product Q:**
  should the Disciplines filter be public or reviewer-gated (default: gated, since
  attached to named staff)?
- **Parked** — the "✓ confirmed current" attestation loop (a tokenized confirm page
  → gated `map_college_attestations`; COBI-only, no MAP dependency). Sam chose the
  deep-link only for now.

## Standing lanes (the To-Do feed)
- Unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`, #494).
- TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`).
- CPL-Assistant CCR/CER recommender ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`).
- Public KB PR #15 (Veterans plans) waiting on Sam's sign-off.
- Reference-tab header bands (CCR/CSR/CER dark-navy sticky headers) — Sam to decide if they flip light.

## Patterns that worked (reuse them)
- **Surface, don't edit, a read-only system of record** — deep-link + nudge, never a
  shadow editor (the new ADR).
- **Before sourcing a new field, check what an adjacent feature already stores** — the
  landing URLs were one join away in `chatbox_college_profiles`.
- **"Add a Check All" ⇒ per-item checkboxes** — a single toggle has nothing to check-all.
- **Value-signature API probe** + garbage sentinels; **gated-PII Supabase**; **pg-safeupdate
  needs `where true`**; **mailto nudge** (no email infra).
- **A new `workflow_dispatch` workflow must be on the DEFAULT branch** before the
  dispatch API finds it.
- **Branch hygiene** — the designated `claude/*` branch gets squash-merged + auto-deleted;
  restart it from `origin/main` for each new change (`git checkout -B … origin/main`),
  then `push --force -u` (Rule 5 allows force on `claude/*`; force-with-lease "stale info"
  after a `-B` reset → use `--force`).

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`). **Rule 5** (never force-push main).
  **Rule 8** (checkpoint).
- **Merge-on-green** (`clean` OR `unstable`), squash; poll CI via the MCP `github` tools.
- **MAP-Users PII** — never commit names/emails; gated Supabase only; the roster-in-email
  is the college's OWN staff to its OWN leadership, client-side draft, never logged.

## Moniker
Session 87 was **StarMax**. Claim your own (the Sky/Star streak continues).
