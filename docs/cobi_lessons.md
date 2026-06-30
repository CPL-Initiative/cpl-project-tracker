---
title: COBI — the masthead rename and the Mamba brand layer
created: 2026-06-19
updated: 2026-06-30
tags: [lessons, cobi, branding, masthead, ui, easter-egg, kpi-cards]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/first_light_lessons]]"
artifacts:
  - cobi_brand.js
  - kpi_cards.js
  - excel_to_dashboard.py
  - tests/cobi_brand.test.js
  - tests/kpi_cards.test.js
---

# COBI — the masthead rename + the Mamba brand layer

Workstream scratchpad for renaming the dashboard masthead to **COBI —
Chancellor's Office Business Intelligence**, a light Kobe homage Sam asked for.

## Session 65 (2026-06-19, Skyloft) — shipped PR #475

### What shipped

- **Masthead → COBI.** The wordmark **COBI** + the backronym tagline
  *Chancellor's Office Business Intelligence* (Sam's improvement on his own
  "Interface" → "Intelligence": it *is* a BI/analytics surface). Nav label
  "CPL Project Tracker" → "COBI"; CPL stays discoverable in the project
  description + the data tabs.
- **`cobi_brand.js`** — a STATIC, regen-proof asset (the `first_light.js`
  pattern): injects its own CSS + runtime DOM. Three touches:
  1. a **rotating "Mamba" subtitle**, a fresh phrase each load (Mamba Mentality ·
     Bean Counting 🫘 · Mamba Time · Mambadata · Black Mambanator · Job's Not
     Finished · Every Unit Counts · Data Don't Lie · Mambacademics · …);
  2. an **8 → 24 jersey wink** — a tiny superscript on the wordmark that flips
     between Kobe's two retired numbers on hover;
  3. **Mamba Day (Aug 24)** — the masthead goes purple & gold for the day.
- **Generator (`excel_to_dashboard.py`)** — the `<title>`/`<h1>` now emit COBI,
  **decoupled from `proj_title`** so the Word reports keep the project's own
  name. Rule 1 honored (the generator still owns the h1; the static template
  carries the same COBI fallback).
- **Tests** — `tests/cobi_brand.test.js`, 17 jsdom checks (Rule 4, the rotating
  slot drawn from the lineup, the 8→24 hover flip, Mamba Day). Full suite green
  (59 files).

### Lessons worth remembering

1. **Decouple the masthead from `proj_title`.** The generator built the h1 from
   `proj_title`, which also (potentially) names other outputs. Hardcoding the
   COBI h1/title literally — rather than repurposing `proj_title` — kept the
   rename scoped to the dashboard surface and out of the Word reports.
2. **Keep the generator-replaced h1 simple.** The generator's `<h1>[^<]*</h1>`
   regex only matches plain text — so the wordmark is `<h1>COBI</h1>` and all
   the personality (the 8→24 span, the sizing) is layered on at runtime by
   `cobi_brand.js`. Same regen-proof move as First Light's chip.
3. **A double-quoted Python string for the apostrophe.** "Chancellor's" inside a
   single-quoted f-string would break; the `re.sub` replacement uses a
   double-quoted literal.
4. **The homage winks, it doesn't shout.** A rotating subtitle + a hover flip +
   a once-a-year color flip read as warmth to those who notice and as a normal
   BI masthead to everyone else — defensible on an org-facing CO dashboard.

### Current state / next steps

- **DONE + LIVE** (PR #475 merged to `main`). COBI is the masthead now.
- Tunables on the table if Sam wants: wordmark size/letter-spacing, the Mamba
  lineup (add/cut phrases in `cobi_brand.js` `MAMBA`), the Mamba-Day colors.
- No follow-on work queued. The rename is self-contained.

## Session 68 (2026-06-22, SkyAlizarin) — the masthead consolidation (PR #487)

Sam asked to make the whole title "as simple and cohesive as possible." Iterated
five prototypes (`prototype/cobi_header_v1..v5.html`, sent via `SendUserFile` with
real tokens/fonts) → locked a **single-row "app bar"**, then ported it regen-safe.

### What shipped (PR #487 — built, tested, ready; holding merge for the seal asset)
- **Layout**: `seal + COBI`​`CPL` / tagline` (left) · **centered "Where To?" search**
  (the quick-start, moved out of its own yellow band into the masthead center slot,
  label + box + Go on one line) · subtle utility cluster (**ℹ About** popover ·
  **Manually Refresh COBI** · Updated stamp).
- **ℹ About popover** collapses the three info links (Project Description / See
  Attachments / Cheat Sheet) + **Today's painting** into one menu — the top bar reads
  as identity + one action, not a row of competing chrome.
- **Brand**: tagline = "Chancellor's Office Business Intelligence" **under COBI** (the
  "for CPL" suffix dropped); the **Kobe 8→24 wink → a gold `CPL` superscript**; the
  rotating **Mamba subtitle retired** ("for now," Sam). A v5 hairline outline on the
  gold CPL was tried then **removed** (Sam). **COBI now renders in seal-navy**
  (`--seal-blue`, a new `:root` token) with a Chancellor's-Office **seal to its left**.

### Lessons worth remembering
1. **You can rework a generator-owned + Rule-4 region almost without touching the
   generator** — park its text-anchor (the now-hidden `#cobi-mamba`) *inside* the new
   structure so the existing PROJ-INFO inject lands where you want; inject the new
   layout CSS from `cobi_brand.js` (no Rule-4 `<style>` mirror); keep `<h1>COBI</h1>`
   plain for the regex; only the Refresh button needed a generator edit (label +
   **strip-by-id** so a label change can't orphan a duplicate). Full method:
   `docs/kb-notes/methodology-regen-safe-section-rework.md`.
2. **Prove idempotency by running `excel_to_dashboard.py` twice and diffing** — the
   only delta should be the timestamp. (Also cleared 159 blank lines the old header
   had silently accreted.) jsdom test rewritten to 26 checks; full suite 61 files green.
3. **Code-only PR** — reset the HTMLs to the cron's `main`, re-apply *only* the
   structure + token, leave PROJ-INFO empty + no Refresh seed; the post-merge dispatch
   repopulates. Never commit the regenerated `unified_courses_*.js` data artifacts.
4. **Graceful-degrade a pending hand-off asset** — the seal `<img onerror=…hide>` means
   the rework merges with no broken image, decoupled from the seal upload.
5. **An image binary can't be pulled from chat** in this sandbox — Sam must upload the
   seal to the repo (GitHub web upload to the branch). Plan the hand-off, don't fight it.

### Current state / next steps
- **PR #487 is READY**, all green, **holding the merge only on the seal upload**
  (`assets/cccco_seal.png` on `claude/awesome-brown-dyd33o`). Next session: pull it,
  point `<img src>` at it, **sample its exact navy into `--seal-blue` (both HTMLs)**,
  commit, squash-merge, **dispatch the daily workflow** to publish the populated header.
- The seal `<img>` onerror-hides, so "merge now" (seal-less, fills in later) is a safe
  fallback if Sam prefers.

## Session 86 (2026-06-30, SkyGuy) — six COBI refinements (PR #610)

Sam's list of six refinements. Five shipped as code; one was already built and got
clarity polish. Patterns worth keeping:

1. **KPI cards: hide + centered title row + per-card collapse — a NEW static
   `kpi_cards.js`, NOT a generator change.** The headline KPI card markup is
   regenerated daily, so the regen-safe move (the `kpi_reorder.js` pattern) is a
   runtime overlay: on load, wrap each `.kpi-number` + `.kpi-label` into a centered
   `.kc-head` and the rest into a collapsible `.kc-body`, inject controls + CSS, and
   re-match cards by `.kpi-label` text across regens. Per-browser `localStorage`, no
   auth, no generator/HTML edit beyond the one `<script>` tag (mirrored, Rule 4).
   **Scope to `.kpi-section > .kpi-card`** — the grid also holds two full-width
   non-`.kpi-card` panels (KPI Trends, College Activity) that must be left alone.
   **Coexists with `kpi_reorder.js`:** controls live INSIDE the card so they ride a
   drag; `stopPropagation` on control clicks + a head-click toggle (a drag suppresses
   the click) keep both working. Default = collapsed ("only the top half shows").
2. **Activity-card big number → live KPI: a post-pass, never inline.** Same lesson
   Session 85 learned for the Annual Workplan: `build_activity_kpis()` runs BEFORE
   `merge_live_metrics`, so the live value isn't available there. `apply_live_activity_current()`
   mutates `activity_kpis` AFTER the merges + `apply_live_workplan_current()`,
   mirroring the workplan hybrid (mapped → live verbatim string; unmapped+explicit
   `workplan_goals.current` → that). Stamp a `current_manual_explicit` flag in the
   build so the post-pass only overrides an explicitly-set manual Current (un-set
   cards keep their `kpi_metric` — zero regression). Real regen: 3.1 43,630 → 48,158.
   Pitfall fixed: `_parse_metric_num` didn't handle `k`/`M`/`B` → `"100k"`/`"$269M"`
   live strings parsed to `None` and silently disabled the computed progress bar.
3. **"Already built" is a real outcome — verify before building.** The RACI Update
   popup already showed the full history (no `.limit()`) with per-row ✏️/🗑 for any
   entry, incl. team-phrase reviewers (`canEdit = !!state.sess`, and a team-phrase
   session IS a `state.sess`). The right move was clarity (a live `Updates (N)` count)
   + robustness (re-fetch on a missing-id fresh save) + a test that GUARDS the
   show-all/edit-any behavior — not a rebuild. Likely source of the user's confusion:
   the read-only `card_updates.js` card-FACE overlay shows only the newest update by
   design; the full list is one click away in the popup.
4. **Reuse the server-enforced team-phrase gate cross-bundle via shared same-origin
   localStorage.** The KB portal is a SEPARATE Supabase project with its own
   magic-link auth, but it's served same-origin as the dashboard, so the team phrase
   stored under `cpl_team_pass` (by `raci.js`) is readable there. kb-portal validates
   it against the MAIN project's `team_pass_ok()` RPC (the secret never leaves
   Postgres), then unlocks the portal + composer WITHOUT a Supabase session — the
   composer's only "write" is a tokenless GitHub deep-link, so unlocking it for
   team-phrase users is pure UX. The pure request builder (`KBComposer.teamPassRequest`)
   keeps the URL/header contract unit-tested even though `app.js` (esm.sh imports)
   can't be eval'd in Node.

**Delivery:** code-only PR (#610) — restore the regenerated HTMLs to `main`,
re-apply only the `<script>` tag, let the post-merge `daily-dashboard.yml` dispatch
publish the activity-card change. 112 JS test files + Python tests green; generator
EXIT 0.

## Session 87 cont. (2026-06-30, SkyGuy) — light/glass theme (#611) + MAP-Users scope (#612)

Same session, two more asks after the six refinements.

### Light/glass theme (PR #611)
Sam: make the **KPI Metrics + CPL Analytics tables** match COBI's light look, then
"**EACR should also be adjusted… consistent look throughout COBI**," with **chips +
trendlines** contrast-fixed. Flipped four dark-navy surfaces to light:
- **KPI Trends card** (`render_kpi_history_card` + `_delta_badge` + `_sparkline_svg`).
- **CPL Analytics + EACR** — the *shared* `EXHIBIT_ANALYSIS_CSS` `.exhibit-*`/`.sw-*`
  families, so **one base-rule flip covered both** (the consistent outcome Sam wanted).
- **College Activity card** (`college_activity_template.html` + `college_activity.js`).
- **EACR interactive** (`statewide_interactive.js` `CV_STYLE`/`.cv-*`/`.sv-*`).

Lessons (full mapping → `docs/kb-notes/methodology-dark-to-light-recolor-mapping.md`):
1. **Contrast is the whole point** — delta chips `--*-on-dark`→`--hunter`/`--crimson`,
   gold text `--gold-accent`→`--mustard-text`, sparkline `#E3B341`→`#8B6800`, white
   bar-tracks→`rgba(28,28,26,.08)`. Light tints kept; only their text flips.
2. **Generator-injected CSS can't be verified in the sandbox** — `EXHIBIT_ANALYSIS_CSS`
   injects only `if exhibit_tables:` (MAP fetch, egress-blocked here), so a sandbox
   regen leaves the stale baked copy. **Guard the SOURCE** (`kb/_test_light_theme.py`,
   15 assertions) instead of a rendered diff; the daily cron strips+injects the light
   version. The static JS (college_activity/statewide_interactive) is live on commit.
3. **Parallelized the independent files** — 2 subagents (College Activity, EACR JS)
   with ONE precise token mapping while I owned the shared CSS + KPI Trends; verified
   by grep (no stray dark) + the source test.
4. **Scope discipline** — flipped exactly the fully-dark "boxes" Sam named; left the
   CCR/CSR/CER reference tabs (light tables w/ dark header bands) and flagged them for
   his call rather than unilaterally restyling the heaviest tabs.

### MAP-Users management tab — scoped (PR #612)
Sam asked whether we have MAP college **users**. Research finding: yes in MAP
(`View_CollegeUsersRoles`, category #9, ~2,710 rows / 11 fields = staff
names+emails+roles) but **NOT in our datasets** — dropped from the fetch for
PII-minimization (Session 34) and never committed. Delivered a **PII-safe schema
probe** (`map/probe_users_schema.py`, dispatch-only, runner-as-proxy, masks all
names/emails, writes nothing) + a 4-phase **scope** (`docs/map_users_tab_scope.md`:
runner sync → gated Supabase `map_college_users` → COBI tab → reuse the RACI nudge).
**Probe lesson:** MAP's API is **column-oriented** — each dataset is
`{columnName:[fields], columnValue:[rows], dataCount, responseCode/Message}`, and a
no-`columnName` request returns the field list but **no values**, so the probe is
2-pass (discover fields → re-request WITH them for the rows). NEXT: dispatch the
fixed probe, fold the schema into the scope doc, build P1 (the gated sync).

## Session 87 — StarMax: population sub-activity cards = live KPI breakdowns

Sam's screenshot review of Goal 2: 3.1 (48,176, ✅) and 3.2 (100k, ✅) matched the
headline KPIs, but **3.1.1 Working Adults (21,552), 3.1.2 Veterans (22,149), and
3.1.2a Apprentice (700)** were stale (sad faces). Session 86's
`apply_live_activity_current` only wired the 5 `PID_TO_KPI_KEY` sub-activities,
which map to **top-level** headline KPIs. These three populations are instead
**breakdown ROWS within** the STUDENTS SERVED KPI (`cumulative_students.breakdowns`
= Military / Workforce-Other / Apprentice, reported by CCCCO directly), so they had
no key and kept their Excel `kpi_metric`.

Fix (generator-only, mirrors the Session-85/86 hybrid):
- New module map **`PID_TO_KPI_BREAKDOWN`** = `{3.1.1→(cumulative_students,
  workforce), 3.1.2→(…,military), 3.1.2a→(…,apprentice)}` + a
  **`_kpi_breakdown_value()`** helper (case-insensitive label-prefix match;
  returns `None` when the KPI/breakdown is absent → graceful Excel-fallback no-op).
- Wired into **both** post-passes so the card == the Annual Workplan Current ==
  the headline breakdown by construction: `apply_live_activity_current`
  (card `metric`, `metric_source='live'`) and `apply_live_workplan_current`
  (the AWG Current row flips read-only-live via a new `current_kpi_breakdown`
  stamp on the annual_goals row). The renderer gates purely on
  `current_source=='live'`, so **no renderer change** was needed.
- Mapping rationale: Military→Veterans/Service, Workforce-Other (non-military)→
  Working Adults, Apprentice→Apprentice — confirmed against the 2030 goal split
  (160k + 70k + 20k = 250k).

Result (live 2026-06-30): cards now read **23,388 / 24,864 / 753**, all
`metric_source=live`; generator EXIT 0 ("Activity cards: 7 synced", "Annual
Workplan: 8 synced" — each +3). Verification extended **both** existing Python
tests (`kb/_test_activity_card_current.py` + `kb/_test_workplan_current_hybrid.py`)
with breakdown cases incl. the no-breakdowns graceful-degrade path.

Lessons: (1) **a "sub-activity" can map to a breakdown, not a KPI** — the live-sync
mechanism needed a parallel breakdown map, not a new entry in `PID_TO_KPI_KEY`.
(2) **One value, two surfaces** — wiring only the card would have re-introduced
card↔Annual-Workplan drift (the exact thing Session 85 killed); fix both in
lockstep through a shared helper. (3) **Code-only PR** — reverted all regenerated
artifacts; the post-merge `daily-dashboard.yml` dispatch publishes the live HTML/JS.

## Session 87 — StarMax: the MAP Users tab end-to-end (P1→P2→P3)

Sam wanted a COBI tab to **manage MAP's per-college user roster** (staff PII) + a
**nudge** to remind colleges to keep it current. Built it across PRs #618–#621.

**The schema probe — value-signature, not structure.** MAP's Custom Report API has
no self-describe mode (a no-`columnName` request 500s) AND it **pads unknown columns
into 2-wide rows** — so a structural "did the column come back?" guess-and-confirm
**over-accepts** (run #1: all 57 candidates "passed"). The reliable method is
**value signature**: probe each candidate alongside a known-good anchor, and keep it
only if its VALUES come back (`responseCode='000'`, non-null) — calibrated with 3
**garbage sentinel** columns so the "fake" baseline is data-driven. Two more gotchas:
MAP is **case-sensitive** (`UserName` ✓ vs `Username` ✗), and the multi-word Contacts
columns keep the **spaces** from the Builder labels (`VPAA Email` ✓, `VPAAEmail` ✗).
PII-safe throughout: print field names + counts + low-cardinality non-`@` enums only.
KB note: [`docs/kb-notes/methodology-map-api-value-signature-probe.md`](docs/kb-notes/methodology-map-api-value-signature-probe.md).

**The gated-PII pattern (reusable).** Staff PII must never touch the repo, so it lives
ONLY in a gated Supabase table: **no anon SELECT policy** (the public key can't read
rows), a reviewer/team-phrase SELECT policy (`is_allowed_reviewer() OR team_pass_ok()`),
and **no write policy at all** (only the service-role sync mutates it, bypassing RLS).
The PUBLIC surface is a separate **SECURITY DEFINER aggregate RPC** (`map_users_summary()`,
anon-granted) that returns counts + role-mix only — never a row. The sync is the
**runner-as-proxy** template (the MAP API is egress-blocked from the sandbox): fetch on a
runner with an explicit `columnName`, write via the service key through an **atomic replace
RPC**. Gotcha that cost two failed runs: Supabase's **pg-safeupdate** guard blocks an
unqualified `DELETE` through the PostgREST API roles (`21000` "DELETE requires a WHERE
clause") even though it worked via the MCP/direct SQL — add `where true`.

**The nudge is a `mailto:`, not an email server.** The RACI nudge (the precedent) just
opens the user's mail client pre-filled — nothing is auto-sent. So P3 needed no email
infra: a gated `map_college_contacts` table (Primary Contact / VPAA = VP Instruction /
VPSS = VP Student Services + emails, confirmed via the same probe) + a 📣 button that
builds a `mailto:` to the present emails. Cheap, honest, reviewer-driven.

**Other lessons.** (1) **A "sub-activity" can map to a KPI BREAKDOWN, not a top-level
KPI** — the card fix (#617) needed a parallel `PID_TO_KPI_BREAKDOWN` map, wired through
BOTH the card and the Annual-Workplan post-passes so they stay consistent. (2) **Lazy
tabs need their workflow on the DEFAULT branch to be API-dispatchable** — a brand-new
`workflow_dispatch` workflow 404s on the dispatch API until it's merged to main. (3)
**Surface the error body** — the sync swallowed an opaque 400; capturing the PostgREST
message (PII-free) made the safeupdate cause obvious in one more run.

## Session 87 follow-up — the MAP Users nudge grows up (2026-06-30, PRs #623–#626)

After the tab shipped, Sam refined the nudge. Four PRs, all code/docs-only (the static
`map_users.js` publishes via Pages; the schema bits applied live via MCP + a sync re-run):

- **Recipient PICKER + CEO + last-nudged log (#623).** Clicking 📣 now opens a confirm
  dialog with every contact **pre-checked** — uncheck anyone, then *✉ Open email draft*.
  `buildNudgeMailto(college, picks, …)` takes the chosen picks, not the whole contacts
  row. **CEO** joined Primary Contact / VPAA / VPSS as a 4th recipient (new `ceo`/`ceo_email`
  columns; 71/121 colleges have one). A new gated **`map_college_nudges`** table
  (`last_nudged_at`/`last_nudged_by`) logs each open — kept **separate** from
  `map_college_contacts` so the monthly full-refresh sync never wipes it (a clean instance
  of "mutable state and refreshed-from-source data don't share a table").
- **Deep-link into MAP (#624).** The draft links the college to **their own MAP CPL
  dashboard** — reused the per-college `landing_page_url` already in
  `chatbox_college_profiles` (the CPL Assistant's source), joined in the sync by exact
  college name (118/121 match). Lesson: **before sourcing a new field, check what an
  adjacent feature already stores** — the landing URLs were one join away.
- **Roster-in-the-email, as a Check-All checklist (#626).** Leadership wanted "eyes on
  their CPL heroes," so the nudge body now carries the college's **own** user roster.
  Rendered in the picker as an **opt-out checklist** (all checked) with a **Check-All
  master in the header row** + a checkbox per user (drop a departed staffer before
  sending). Only checked users hit the email. "Add a Check All" was the tell that Sam
  wanted *per-user* checkboxes, not a single toggle — a single checkbox has nothing to
  "check all." Privacy: it's the college's OWN staff shown to that college's OWN
  leadership (no cross-college leak), client-side draft only, never logged. The per-user
  checklist doubles as the escape hatch for big colleges (a long roster can hit Outlook's
  mailto length cap).

**The load-bearing architecture call.** Sam asked for a self-service "edit your users"
link that *feeds MAP*. The right answer was to **not** build that: MAP is the system of
record for users and exposes **no write API** (the Custom Report API is read-only), so a
COBI-side editor would be a second roster that drifts. COBI owns the **nudge + the
deep-link + the accountability log**; colleges edit **in MAP**. Distilled to an ADR:
`docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record.md`. Parked the "✓ confirmed
current" attestation loop (buildable COBI-only later). Incoming: 3 per-user Custom Report
fields Sam asked MAP to add (Active/Inactive · Disciplines · Last updated) — fold them in
via the value-signature probe when they land (`map_users_tab_scope.md` §8).
