# Session 89 handoff — you are Session 89

You are **Session 89** of the CPL Project Tracker (COBI) build. Session 88
(**SkyThru**) shipped four COBI tweaks across two PRs. Pick your own moniker
(Sky/Star streak).

## What SkyThru shipped (both merged to `main`, both live)

**PR #628 — three COBI tweaks (code-only → dispatched the daily workflow to publish):**
1. **CCC Collaborative metric match.** KPI Trends "CCC Collaborative" was reading
   `adopting_colleges` (61) while the MAP Exhibits card shows the statewide-exhibit
   count (132) under the same label. New `kpi_history` key **`ccc_exhibits`**
   (= `ccc.unique_exhibits`) repoints the Trends row; the legacy
   `ccc_collaborative` (adopting-colleges) series is kept for provenance. Deltas
   read "—" until the new series accrues (no fake jump).
2. **MIL vs JST data element.** `fetch_veteran_jst.py` pulls
   `EnrolledMilitaryStudents` (MIL) / `VeteransWithJSTs` (JST) + `StarCollegeCount`
   from the `potential-savings` API → **`veteran_jst.json`** (runner; soft-fail).
   The **Veteran Sprint card** shows the real uploaded JST + reported MIL + the
   75% star rule (was a military-students proxy). The **College Activity table**
   gains a **"MIL / JST"** column and its **★ became the Veteran Star** (JST ≥ 75%
   of MIL), gated on `COLLEGE_HAS_JST` with a criteria-star fallback.
3. **About-box z-index.** `.header`'s `backdrop-filter` trapped the About popover
   behind the KPI cards. `cobi_brand.js` lifts `.header` to
   `position:relative; z-index:150` (above content, below the mobile rail 199–201).

**PR #629 — MAP Users tab: the 3 new Custom Report fields.**
A value-signature probe confirmed `UserStatus` ∈ {Active, Inactive},
`UserDisciplines` (comma-delimited), `LastUpdatedOn` (10-char date) on
`View_CollegeUsersRoles_APIDataset` (16 fields). Schema (Supabase MCP):
`map_college_users` += `user_status` / `disciplines` / `last_updated_on`;
`map_users_replace` carries them; `map_users_summary()` adds a public
**`active_count`** (no PII — Disciplines + Last-updated stay reviewer-gated).
Sync FIELD_MAP + the tab (`(N active)` on each row; Status / Disciplines /
Last-updated columns in the reviewer roster). **The sync (`map-users-sync.yml`,
apply=true) was dispatched** to populate the new columns.

Tests: +4 new files for #628 (`ccc_metric_test.py`, `veteran_jst_test.py`,
`veteran_sprint_jst_test.py`, `college_activity_jst.test.js`) + `cobi_brand`
z-index guards; `map_users.test.js` → 70 checks. 114 JS test files green.

## Read these first (in order)
- `docs/cobi_lessons.md` (the Session 88 section) — the full story + the
  Veteran-Star 46-vs-50 discrepancy note.
- `CLAUDE.md` §2 (`fetch_veteran_jst.py` / `veteran_jst.json` / `map_users.js`),
  §5 (Veteran Sprint card), §8 (the new `map_college_users` columns), §11 (S88).

## Open / carryover (waiting on Sam, then YOU)
- **Veteran-Star count 46 vs MAP's 50.** The College Activity per-college star uses
  the exact "JST ≥ 75% of MIL" rule (≈46 stars); MAP's `StarCollegeCount` headline
  is 50. The `potential-savings` API has **no per-college star flag**, so the rule
  is the best signal; `fetch_veteran_jst.py` logs the gap (`computed_star_colleges`
  vs `statewide.star_colleges`). If Sam wants an exact match, he'd need to share
  MAP's precise rule (likely a rounding / boundary / MIL=0 difference).
- **MAP login URL** for the refresh-nudge link (still links each college's MAP
  dashboard; one-line swap in `map_users.js` / the sync).
- **Reference-tab header bands** (CCR/CSR/CER dark-navy sticky headers) — Sam to
  decide if they flip light.
- **Public KB PR #15** (Veterans plans) — Sam's sign-off.

## Standing lanes (the To-Do feed)
- Unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`, #494).
- TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`).
- CPL-Assistant CCR/CER recommender ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`).

## Patterns that worked (reuse them)
- **New history key, not a repointed one,** when a metric's meaning changes — the
  deltas read "—" until the new series builds, instead of jumping off a different
  metric's values (`ccc_exhibits`).
- **Runner-as-proxy direct fetch** when a new field isn't in the worker scrape and
  the worker can't be redeployed from a session — a small `fetch_*.py` →
  committed-aggregate JSON, soft-fail + graceful generator degradation, beats
  waiting on a Cloudflare redeploy (`fetch_veteran_jst.py`/`veteran_jst.json`).
- **A trapped popover is an ANCESTOR stacking-context problem** — bumping the
  popover's own z-index can't escape; lift the `backdrop-filter` ancestor.
- **Value-signature probe before extending a MAP-fed schema** — Builder labels can
  differ from API names (`CollegeID` vs `CollegeId`); the probe confirms the exact
  case-sensitive spelling AND that values come back.
- **Gate PII-adjacent fields, aggregate the safe one** — Disciplines/Last-updated
  attach to named staff → reviewer roster only; the active *count* is public.
- **Code-only PR + post-merge dispatch** publishes the regenerated HTML; **merge on
  `unstable`** once the required check (TruffleHog) is green — don't over-wait for
  the non-required js-tests.

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`). **Rule 5** (never force-push
  main). **Rule 8** (checkpoint).
- **MAP-Users PII** — never commit names/emails; gated Supabase only; the
  aggregate RPC is the only public surface.
- **Branch hygiene** — the designated `claude/*` branch squash-merges + auto-deletes;
  restart from `origin/main` for each new change (and **re-fetch** main right before
  branching off it — a stale `origin/main` ref bit this session once).

## Moniker
Session 88 was **SkyThru**. Claim your own (the Sky/Star streak continues).
