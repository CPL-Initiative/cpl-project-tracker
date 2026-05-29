# CPL Project Tracker — Claude Code Project Memory

This file is auto-loaded at the start of every Claude Code session in this
repo. Keep the **Critical Rules** section tight — move deep reference material
into the Pipeline Reference below or into dedicated docs.

---

## Critical Rules (do not violate)

1. **The daily GitHub Actions workflow regenerates the dashboard.**
   `.github/workflows/daily-dashboard.yml` runs daily (cron `17 10 * * *`, ≈10:17
   UTC). It executes
   `python excel_to_dashboard.py`, which reads the existing `CPL_Dashboard.html`
   and **replaces entire sections** (Filter Bar, Activity KPIs, Projects Grid,
   KPI section, exhibit CSS, title/h1). Any hand-edit inside one of those
   regenerated sections is overwritten on the next run. **If something needs to
   change, change the generator — not the HTML.**

2. **CSS-injection idempotency guard (`excel_to_dashboard.py` around line 5093)
   must not be removed.** The generator injects `EXHIBIT_ANALYSIS_CSS` before
   the first `</style>` tag. A guard strips any pre-existing copy before
   re-inserting so repeat runs don't accumulate duplicates. Before this guard
   existed, 34 copies (~6,500 lines) had piled up. See PR #4.

3. **`kpi_history.json` must have no date gaps.** The trend card's "1d" delta
   looks up "yesterday" with a `date <= target` filter, so a missing day causes
   the 1d delta to silently fall back to an earlier date. If a daily run is
   missed, backfill an interpolated entry with `"_interpolated": true`.

4. **`CPL_Dashboard.html` and `index.html` must stay identical.** The workflow
   copies one to the other at the end (`cp CPL_Dashboard.html index.html`).
   Never edit only one.

5. **Never force-push `main`.** GitHub Pages serves from it.

6. **Don't run a separate Cowork scheduled task for the daily dashboard while
   the GitHub Actions workflow is active.** Two schedulers racing to push to
   `main` caused the messy commit chain on 2026-04-19.

7. **M-IDs are in staging-cleanup phase — re-mints permitted under the
   playbook.** The M-ID identity layer is "AI-assisted STAGING" (per the
   data-file headers), **not yet faculty-published**. Re-mints in service
   of cleanup are welcome, but they must follow
   [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md):
   dry-run first, alias map committed, Supabase `kb_curation` fresh-read at
   write-time, articulations re-keyed, atomic land within one cron window
   (10:17 UTC). The "never bulk renumber" framing that previously lived
   here was **defensive** (against accidental re-keys); it's been relaxed
   for the staging phase. **Never re-mint casually** — the playbook is
   mandatory. Once we explicitly declare the M-ID layer
   **faculty-published**, this rule re-locks to "stable identifiers, no
   renumbering." Until then, principled re-mints are part of the cleanup
   loop.

   **M-ID structural invariants** (enforced at every re-mint; deviations
   become audit findings):
   - SUBJ portion is exactly **4 letters**. The 27 single-letter SUBJ
     artifacts the auditor flags as `mid_id_off_scheme` (`A M1001`,
     `F M1001`, etc.) get folded into proper 4-char SUBJ at the next
     re-mint.
   - Within `id_system == "M-ID"`, **all rows sharing a `discipline`
     share a SUBJ4.** The 10 SUBJ4 variants for `discipline ==
     "Sign Language, American"` (ASL/AMSL/DEAF/SIGN/INT/INTR/ACCS/MULT/
     SL/SNLA) collapse to a single canonical SUBJ4 at re-mint. The
     `subject_collision_signal` rule (Phase 1c queued) surfaces these
     so curators can confirm the canonical choice before re-mint.
   - **C-IDs and CCN-IDs preserve their official format** — they're
     external authorities with variable lengths (`ANTH 100`, `AG-PS 104`,
     `ANTH C1000`). Never re-key.
   - New M-IDs minted by `_seed_coci_minted_mids.py` (or curator
     consolidation via the Suggested-merges worklist) consult
     `kb/discipline_canonical_subj4.json` (TBD — created in the next
     re-mint project) for the canonical SUBJ4 per discipline.

   Authoritative old→new aliases for every re-mint live at
   `kb/remint_out/<date>/alias_map.json`. Rollback notes per the playbook.

   The 2026-05-22 `CourseControlNumber` re-mint (PR #84) was the first
   instance of this playbook in production. Old `M-ID SUBJ NNN` keys are
   dead — those aliases preserved in `kb/remint_out/alias_map.json`. Full
   decisions + validation methodology:
   [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md).

8. **Document at context checkpoints.** Roughly every ~100K tokens of context
   consumed in a session (heuristic — Claude Code doesn't expose an exact
   counter; use proxies: long conversations with many tool calls, large file
   reads, multi-phase strategic work), pause and update **every** artifact below
   — none are optional, all sync to the user's Obsidian via the repo:
   - **`CLAUDE.md`** — project memory + rules + roadmap + §11 (lifecycle,
     tag inventory, etc.). Refresh tag counts + roadmap-table status.
   - **`kb/README.md`** — when KB structure, generators, or audit artifacts
     change.
   - **`README.md`** — root project README. Kept current for first-time visitors.
   - **`docs/<topic>_lessons.md`** — **lessons doc REQUIRED on every checkpoint.**
     Create one on the first checkpoint for a workstream (e.g.
     `docs/unified_courses_audit_lessons.md`), then APPEND a dated section on
     every subsequent checkpoint capturing: what's been learned since the last
     checkpoint, current state, strategic roadmap, and next concrete step.
     Use the Obsidian frontmatter format that
     [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md)
     established (title / date / tags / artifacts / related front-matter).
   - **`docs/kb-notes/<topic>.md`** — **KB-candidate lane (added Session 11,
     2026-05-27).** At every checkpoint, ask: did this run produce a learning
     that's durable, reusable, distilled, and self-contained? If yes → author
     a standalone note in `docs/kb-notes/` using
     [`docs/kb-notes/_template.md`](docs/kb-notes/_template.md) with
     `kb-status: candidate`. Five types: `methodology` (reusable patterns),
     `reference` (external-source distillations), `adr` (architecture
     decisions), `glossary` (lookup cards), `playbook` (procedures). Lessons
     docs are the workstream scratchpad; KB notes are the **distilled, durable
     output** intended for Obsidian-vault first-class indexing. Promotion
     workflow + tag taxonomy in [`docs/kb-notes/README.md`](docs/kb-notes/README.md).
     The checkpoint commit body lists any new candidates added this run so Sam
     sees the review queue.
   - **`docs/INDEX.md`** — auto-maintained landing page for the project's docs
     surface. Refresh at every checkpoint: new KB notes, lessons docs, session
     handoffs all get table rows. Obsidian renders this as the vault-side
     entry point for `cpl-project-tracker/`.
   - **`docs/session_<N+1>_handoff.md`** — at SESSION END (not every
     checkpoint), once everything for the current session has shipped + the
     final checkpoint is committed, write a "fattyfat prompt" for the next
     session. The prompt is in second person ("You are Session N+1"),
     paste-able into the next session's first message, and covers: what
     shipped, docs to read in order, the priority workstream(s), carryover
     items + status, patterns that worked, safety patterns to honor, and a
     moniker suggestion with an open door for the next session to claim its
     own. Reference example: [`docs/session_6_handoff.md`](docs/session_6_handoff.md)
     (Bruh Quad → Session 6, the first instance of this practice). Keep
     it long enough to be useful (~4500 chars / 170 lines is the sweet
     spot) — the next session is starting cold.

   Capture in each: (a) what's been learned this checkpoint, (b) current
   state of the work, (c) strategic roadmap, (d) next concrete step.
   Better to checkpoint slightly early than slightly late — sessions can
   end abruptly and what's not in a markdown file is effectively lost. The
   user can trigger a checkpoint at any time with the **`/checkpoint`**
   slash command (`.claude/commands/checkpoint.md`).

## Branch policy

- Work on feature branches; open a PR to `main`.
- Claude sessions: use `claude/<short-description>` branches (the session
  harness handles this automatically).
- **Always watch PRs.** When a Claude session opens a PR, subscribe to its
  activity (CI + review comments) and follow through — fixing small/clear
  issues, asking when ambiguous — until the PR is merged or closed.
- **Auto-merge authorization (added Session 11, 2026-05-27; broadened
  Session 12, 2026-05-27 — Bruh Dec).** Claude sessions are authorized
  to merge **every** PR they open in this project once the universal
  gates below are met. The "confirm-before-merging for architecturally
  significant PRs" carve-out was removed: the real safety mechanisms
  for re-mints / schema migrations / Excel→Supabase phases are inside
  the workstream itself (pre-merge dry-run review, in-script V1–V4
  apply gates, `workflow_dispatch` manual triggers on the apply
  workflow), not at the PR-merge button. Merging an apply-script PR
  doesn't auto-run the apply.
  - **CI must be green** — every required check passing (TruffleHog, plus
    any push-only checks like CodeQL when they apply).
  - **No unresolved review comments or change-requests.** If a reviewer
    asks for changes, fix or ask before re-merging.
  - **Method: squash and merge** — collapses to one commit on `main` with
    the PR title + body. Matches the existing `Merge pull request #N`
    history pattern.
  - **Delete the feature branch on merge.**
  - **Never force-push `main`** (Rule 5 — Pages serves from it).
  - Use `mcp__github__merge_pull_request` with `merge_method: "squash"`.
  - The session-end handoff still notes any architecturally-significant
    PR that landed so the next session has context, even though no
    pre-merge pause happened.

## Deployed site

https://cpl-initiative.github.io/cpl-project-tracker/

## Obsidian vault wiring (added Session 11, 2026-05-27)

Sam's Obsidian vault is rooted at
`C:\Users\samuel.lee\Documents\GitHub\COG-second-brain\` (**repointed
2026-05-28, PR #178** — it previously pointed at
`Documents\Claude\Projects\CPLBrain\COG-second-brain\`, but the sync script
pulled there while Obsidian read the `GitHub\` path, so checkpoint commits +
KB notes never appeared in the vault; root cause + Windows cutover steps in
[`docs/kb-notes/playbook-vault-sync-setup.md`](docs/kb-notes/playbook-vault-sync-setup.md)).
This repo is cloned **into the vault** at
`COG-second-brain\cpl-project-tracker\` so Obsidian indexes every `.md` file
the session writes.

Three doc lanes in this repo, by lifecycle (see
[`docs/INDEX.md`](docs/INDEX.md) for the landing page):

| Lane | Path | Purpose |
|---|---|---|
| **KB notes** | `docs/kb-notes/<topic>.md` | Distilled, durable, reusable knowledge with `kb-status: published|archived|internal` (the `candidate` middle state was retired Session 11). **THE Obsidian-target lane.** |
| **Lessons (WIP)** | `docs/<workstream>_lessons.md` | Workstream scratchpads, append a dated section every checkpoint. |
| **Session handoffs** | `docs/session_<N>_handoff.md` | "Fattyfat" capsules for the next session. |

The KB-notes lane is **proactive + auto-flowing**: when a session learns
something durable, a new note lands in `docs/kb-notes/` with `kb-status:
published` (no review-queue middle state — sessions author at final
quality). The checkpoint commit body lists new notes for the audit trail.

**Vault auto-sync (added Session 11, 2026-05-27):** `scripts/sync-vault-clones.ps1`
runs on Sam's Windows Task Scheduler every 5–15 minutes, fast-forward-pulling
`cpl-project-tracker` + `cpl-knowledge-base` from origin into the canonical
`Documents\GitHub\COG-second-brain` vault root (`$vaultRoot` repointed
2026-05-28, PR #178). KB notes (and every other repo doc) appear in Obsidian
automatically. The script is strictly
safe: never auto-merges, skips repos with uncommitted work, logs to
`.vault-sync.log`. Setup walkthrough:
[`docs/kb-notes/playbook-vault-sync-setup.md`](docs/kb-notes/playbook-vault-sync-setup.md).

Vault-side hygiene: heavy non-markdown paths (`kb/coci_*.json`,
`unified_courses_*.js`, `kb/row_audit/`, etc.) are excluded in Obsidian's
**Files & Links → Excluded files** so the graph stays clean.

---

## Pipeline Reference

### 1. Architecture Overview

```
CCCCO MAP CPL Dashboard (Azure)
        │
        ▼  /api/potential-savings (JSON)
Cloudflare Worker (cpl-proxy.slee-548.workers.dev)
        │
        ▼  GET /scrape?secret=...
live_metrics.json
        │
        ├── CPL_Initiative_Project_List_v3.xlsx (project data, budget, workplan)
        ▼
excel_to_dashboard.py (Python pipeline)
        │
        ├── CPL_Dashboard.html (rendered with KPI cards, project cards, charts)
        ├── CPL_Data.js (JSON data for filters/search)
        ├── statewide_data.js
        ├── kpi_history.json (appended daily)
        └── reports/ (Word doc reports)
              │
              ▼  copied to index.html, committed, pushed
GitHub Pages (cpl-initiative.github.io/cpl-project-tracker/)
```

The Cloudflare Worker calls the CCCCO Dashboard's REST API directly — no
browser automation. This was a deliberate design decision after Chrome-based
scraping proved unreliable.

### 2. File Inventory

| File | Purpose |
|------|---------|
| `cloudflare-worker-proxy.js` | Dual-purpose Cloudflare Worker: POST `/` for Claude API proxy (Custom Reports), GET `/scrape` for KPI scraping |
| `excel_to_dashboard.py` | Main pipeline: reads Excel + live_metrics.json → generates HTML, JS, Word reports |
| `CPL_Initiative_Project_List_v3.xlsx` | Master project data: projects, budget, personnel, workplan goals |
| `live_metrics.json` | Latest scraped KPI data |
| `CPL_Dashboard.html` | Generated dashboard HTML |
| `index.html` | Mirror of `CPL_Dashboard.html` served by GitHub Pages |
| `CPL_Data.js` | Exported project data for client-side filtering |
| `kpi_history.json` | Daily KPI snapshots — drives trend sparklines + deltas |
| `statewide_data.js` | Statewide exhibit adoption data |
| `dashboard_filters.js` | Client-side filter/search/sort logic |
| `report_generator.js` | Custom Report Generator (Claude API via proxy) |
| `docx.min.js` | Local copy of docx@8.0.4 UMD build (do **not** switch to CDN) |
| `fetch_custom_report.py` | Fetches CustomReport JSON from the MAP API |

### 3. Cloudflare Worker (cpl-proxy)

**URL**: `https://cpl-proxy.slee-548.workers.dev`

**Env vars (encrypted in Cloudflare dashboard)**
- `ANTHROPIC_API_KEY` — for Claude API proxy (Custom Reports)
- `SCRAPE_SECRET` — shared secret for scrape endpoint (currently `CPL_SCRAPE_2026`)

**Endpoints**
- `POST /` — proxies to `https://api.anthropic.com/v1/messages`. CORS restricted
  to `cpl-initiative.github.io`, `localhost`, `127.0.0.1`.
- `GET /scrape?secret=SCRAPE_SECRET` — calls the CCCCO Dashboard API, returns
  JSON with 6 KPI metrics + college tier classification.

**Data source**: `GET /api/potential-savings?cpltype=0&indExcludeSA=0` on
`cpldashboardcccco.azurewebsites.net`. Returns ~117 rows: Count (`Sorder=-1`),
ALL COLLEGES aggregate (`Sorder=1`), ~115 individual colleges (`Sorder=2`).

**6 KPI metrics output**: STUDENTS SERVED, ELIGIBLE UNITS, TRANSCRIBED UNITS,
SAVINGS, 20-YEAR IMPACT, ACTIVE COLLEGES (with Leading/Advancing/Inactive tier
breakdowns).

### 4. 3-Tier College Classification — "3 of 5" criteria model

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Student Volume | Students ≥ 500 |
| 2 | Articulation Depth | Eligible Units ≥ 3,000 |
| 3 | Avg Eligible Units/Student | AverageUnits ≥ 5 |
| 4 | Transcription Rate | TranscribedUnits/Units ≥ 25% |
| 5 | Avg Transcribed Units/Student | TranscribedAverage ≥ 3 |

- **Leading**: meets ≥ 3 of 5
- **Advancing**: not Leading and not Inactive
- **Inactive**: Students < 10 AND Units = 0

Rationale: the 3-of-5 model lets small colleges like Palo Verde (14 students)
reach Leading through effectiveness metrics, while large colleges with only
volume stay Advancing.

### 5. Python Pipeline (excel_to_dashboard.py)

1. Reads `CPL_Initiative_Project_List_v3.xlsx` (projects, budget, workplan,
   update log)
2. Reads `live_metrics.json`
3. Merges live metrics into headline KPIs (replaces static values, adds LIVE
   badges)
4. Generates the dashboard HTML by **replacing sections in the existing HTML**:
   KPI Summary Cards, Activity KPI Cards, Project Cards, Workplan Progress,
   Budget, Vision 2030, exhibit analysis section
5. Exports `CPL_Data.js`, `statewide_data.js`
6. Appends snapshot to `kpi_history.json`
7. Generates Word reports (master + per-project)

**Live Metrics Merge** — `merge_live_metrics()` maps scraped metric titles to
KPI keys:

```python
title_map = {
    "STUDENTS SERVED":    "cumulative_students",
    "ELIGIBLE UNITS":     "eligible_units",
    "TRANSCRIBED UNITS":  "transcripted_units",
    "SAVINGS":            "estimated_savings",
    "20-YEAR IMPACT":     "twenty_year_impact",
    "ACTIVE COLLEGES":    "active_colleges",
}
```

Preserves `note` fields on breakdowns (rendered as parenthetical descriptions)
and `footnote` arrays (rendered as small text at bottom of KPI card).

**Running locally**
```bash
python3 excel_to_dashboard.py
```

### 6. Daily GitHub Actions Workflow

`.github/workflows/daily-dashboard.yml` — runs daily on cron `17 10 * * *`
(10:17 UTC ≈ 2:17 AM PT) and on manual dispatch. Uses `actions/checkout@v5` +
`actions/setup-python@v6` (Node 24 — earlier v4/v5 were deprecated).

Steps:
1. Checkout `main`
2. Fetch CustomReport JSON (`fetch_custom_report.py`)
3. Scrape live metrics via Cloudflare Worker
4. **Sync curation overlay from Supabase** — runs `kb/_apply_curation.py`
   (folds `public.kb_curation` edits into `kb/coci_curation.json`). Guarded on
   the `SUPABASE_SERVICE_KEY` secret; skips gracefully if it's unset.
5. Run `excel_to_dashboard.py`
6. `cp CPL_Dashboard.html index.html`
7. Commit + push to `main` (rebase-retry loop for concurrent pushes — see
   commit `679c5ef`). The commit list includes `kb/coci_curation.json`,
   `unified_courses_data.js`, `unified_courses_index.js`,
   `unified_courses_details.js`, `unified_courses_standalone.js`,
   `unified_courses_members.js`, and `exports/unified_courses.xlsx` so curation +
   the regenerated Unified Courses dataset, lazy files, and export are captured
   each day. (If you add a new generated `unified_courses_*.js`, add it to this
   `git add` list or the daily run won't publish it.)

Commits as `github-actions[bot]` with message `Daily dashboard update — YYYY-MM-DD`.

**Secret required for the curation sync**: `SUPABASE_SERVICE_KEY` (the Supabase
service-role key) in repo Actions secrets. Without it, step 4 no-ops and
curation only lives in Supabase (still shown live via the tab's overlay).

### 6a. CPL Analytics Section — collapsible card grid

The section previously called "MAP Articulation Analysis" / "Detailed
Articulation Data" was renamed to **CPL Analytics** on 2026-05-18. Key
properties to preserve:

- Collapsible chrome reuses the **KPI Metrics** wrapper classes
  (`.kpi-section-wrapper`, `.kpi-section-header`, `.kpi-section-title`,
  `.kpi-toggle-arrow`) so the two sections feel identical. Body class
  is `.cpl-analytics-body`; the collapse rule is
  `.kpi-section-wrapper.collapsed .cpl-analytics-body { display: none; }`.
- Each card has a header **title-row** with a per-table **Excel export
  button** on the right that links to `exports/<card_id>.xlsx`. The
  xlsx files are pre-generated by `_write_analytics_xlsx_export()`
  during the daily run; no client-side xlsx library is shipped.
- Each of the 5 main tables has a **Total row** styled with class
  `.exhibit-total-row`. The two ranking tables — **Top-50 Most-Articulated
  Exhibits** and **Articulations by Unified Course** — are intentionally
  excluded since rank rows don't sum.
- **Articulations by Unified Course** (added 2026-05-22) is the one card
  driven by the **course-identity layer**, not raw MAP rows: it reads
  `kb/coci_articulations.json` via `_build_articulations_by_course()` and
  groups earned MAP articulations by unified course identity (C-ID/CCN/M-ID),
  so the same course taught at many colleges collapses to one row. Columns:
  unified course, discipline, colleges earned, modal credit recommendation,
  linked credential, **adoption leverage** (peer colleges teaching the same
  identity that haven't earned it). HTML shows the top 50 by leverage; the
  xlsx export carries all ~2,355 identities. **Over-merge guardrail:** leverage
  on identities flagged `over_merged` is **withheld** (rendered as "⚠ flagged",
  exported as "over-merged (withheld)") so a conflated cluster never yields a
  bogus adoption target. Skips gracefully if `kb/coci_articulations.json` is
  absent. (This is item (1) of the EACR-identity open thread — the additive
  card; re-pivoting the interactive EACR table itself is the deferred follow-on.)
- The static CSS in the input template carries TWO historical marker
  blocks that the generator now strips on every run:
  `/* ═══ MAP Articulation Analysis Cards ═══ */` (current) and
  `/* ═══ MAP Exhibit Analysis Cards ═══ */` (legacy). Keep both
  strippers in `main()` near the EXHIBIT_CSS_MARKER block — they're
  what guarantees idempotency across rename events.

### 6b. Workplan Activities & Projects wrapper (Dashboard tab)

The Dashboard tab's Activity Metrics, Filter Bar, and Projects Grid
all collapse together as **one** unit, under the section title
**Workplan Activities & Projects**. The Filter Bar applies to both,
so they share one collapse toggle.

- Outer wrapper id: `#workplanProjectsWrapper` (class
  `kpi-section-wrapper`); body class is `.workplan-projects-body`.
  Collapse rule:
  `.kpi-section-wrapper.collapsed .workplan-projects-body { display: none; }`
  (lives inside `EXHIBIT_ANALYSIS_CSS` so the daily regen restores it).
- Wrapper open/close lives in the **static template** between
  `<!-- ═══ Workplan Activities & Projects Section ═══ -->` and
  `<!-- ═══ End Workplan Activities & Projects Section ═══ -->`.
- The injected **Workplan Activity Metrics** subsection has NO inner
  `kpi-section-wrapper` of its own — the outer wrapper provides the
  only collapse. If you re-add inner collapse chrome, you'll get
  nested collapsibles with confusing UX.
- **Generator anchor change**: KPI Summary Cards replacement, MAP
  Articulation Analysis strip, and CPL Analytics strip/inject all
  end-anchor on `<!-- ═══ Workplan Activities & Projects Section ═══ -->`
  (NOT `<!-- Filter Bar -->`). Filter Bar now lives inside the
  wrapper; using it as the end-anchor would wipe the wrapper opening
  every run. The Workplan Activity Metrics strip/inject still uses
  `<!-- Filter Bar -->` because that subsection sits between the
  wrapper opening and Filter Bar.

### 7. Custom Report Generator

- **UI**: Modal with audience picker, metric checkboxes, format selection
- **Backend**: POSTs to Cloudflare Worker → Anthropic API
- **Model**: `claude-sonnet-4-5-20250929`
- **Output**: in-browser preview or downloadable .docx (via local `docx.min.js`)
- **Config**: `window.CPL_REPORT_PROXY_URL` set in HTML before
  `report_generator.js` loads

### 7a. College Activity Custom Report — Output Style Guidance

`college_report_generator.js` produces the "[College Name] CPL Update" Word
document. The prompt inside `buildPrompt()` enforces a specific tone and
shape — keep these guarantees if you ever rewrite the prompt:

- **Title**: Single-college reports are titled `<College Name> CPL Update`;
  multi-college reports default to `Selected Colleges CPL Update`. The docx
  builder writes the title itself, so the model is instructed NOT to repeat
  it as a `#` heading.
- **Audience assumption**: a busy college CEO, trustee, or board member —
  someone looking for bragging rights to share with constituents.
- **Tone**: CPL is a new endeavor for most CCCs. Be grateful for any
  activity. Never imply that a college is negligent, behind, or failing.
- **Reframe weaknesses as opportunities.** Low transcription rate → "credit
  waiting to be unlocked." Thin discipline coverage → "room to expand."
  Funding is predicated on outcomes, so gently equip the reader with
  awareness of what unlocks more apportionment, but always invitingly.
- **Structure** (in this order, `##` headings):
  1. Executive Summary — 1-2 short paragraphs, high-level, achievements +
     biggest opportunity. No metric dump.
  2. Notable Accomplishments — bullet list of 3-6 wins, each with a real
     number.
  3. Opportunities to Maximize Funding & Student Impact — bullets/short
     paras reframing gaps as opportunities.
  4. Next Steps — 2-4 concrete actions.
- **Length**: target 600-1,000 words. Eliminate redundancies — never
  restate the same metric in multiple sections.
- **Filename**: `<College_Slug>_CPL_Update_<YYYY-MM-DD>.docx`.

If you change the prompt, mirror the change here so the guidance and the
code stay in sync.

### 7b. Top-level Tab Layout (Phase D, 2026-05-18)

The dashboard renders **4 top-level tabs**, navigated via URL hash so they
are linkable and survive a refresh:

| Tab key (hash) | Display label | Content |
|----------------|---------------|---------|
| `dashboard` (default, no hash) | Dashboard | KPI Metrics, CPL Analytics, Workplan Activity Metrics, Filter Bar, Projects Grid, **plus teaser cards** linking to the other three tabs |
| `workplan-goals` | Annual Workplan Goals | The 5-year goals + stretch + current table |
| `budget` | Budget | CPL Budget & Expenditure Plan |
| `vision-2030` | Vision 2030 | Vision 2030 Alignment cards with live progress |

Implementation notes (important — keep in sync with the generator):

- Tab nav, tab panes, and the tab-switch JS live in the **static
  template** (`CPL_Dashboard.html`), not in the generator. Each tab pane
  is wrapped with its own `<div class="main-container">` and ends with a
  `<!-- /tab-<name> -->` close comment.
- Section boundary markers were added on Phase D so generator
  replacements stay inside the right pane on repeat runs:
  `<!-- End Projects Grid -->` and `<!-- End Vision 2030 Section -->`
  delimit those two sections; Budget and Annual Workplan Goals
  already had paired `<!-- End ... -->` markers.
- **Annual Workplan Goals is injected TWICE in main()**
  (`render_workplan_goals_html` + `render_annual_goals_table_html`).
  Both code paths now replace **in place** between the AWG markers
  rather than re-anchoring against `<!-- Vision 2030 Section -->` — if
  you re-anchor against Vision again, the content ends up in the wrong
  tab. (See the bug fixed 2026-05-18.)
- The Dashboard tab carries auto-generated **teaser cards** built in
  the generator and injected at `<!-- TEASER_CARDS_PLACEHOLDER -->`.
  The placeholder lives between main-container close and Dashboard
  pane close, so the cards span full width but stay inside the pane.
- Tab switching JS sits at the bottom of the template (just before
  `</body>`) and uses `history.replaceState` for the default tab so the
  URL stays clean.

### 8. Supabase Database (Separate System)

- **Project**: `hvuwhnbuahrtptokpqfh.supabase.co`
- **Tables**: projects, budget_expenditures, personnel, workplan_goals
- Separate from live metrics scraping; handles project-level data storage.

### 9. EACR Exhibit Identity — current state and future direction

**Current grouping (shipped 2026-05-18):** the Exhibit Adoption & Credit
Recommendations table groups MAP rows by
`(Exhibit Title, CPL Type, Collaborative Type)` rather than raw
`ExhibitID`. This collapses MAP's ID fragmentation (3,451 IDs → 3,274
cards) but does not yet handle **title drift** — the same credential
entered under multiple freehand titles by different colleges still
produces multiple cards.

**Career Cluster filter** uses the `CCC SW Sector` column in
`TOP_Code_Lookup.xlsx` (CCC Strong Workforce 10-sector framework with
an "Academic Transfer & General Education" catch-all).

**TOP code caveat — they vary for the same course.** Colleges assign TOP
codes in COCI with discretion and no definitive guidance for ambiguous
cases, so the *same* course often carries different TOP codes across
colleges (in practice ~52% of consolidated M-IDs have a mixed TOP code).
Anything that picks one TOP code for a consolidated course (e.g. the
`top_code` on a minted M-ID) is choosing a representative, not ground
truth — prefer the modal (plurality) pick and surface the spread
(`top_code_mixed` / `top_code_distribution`) rather than trusting a single
value. For broad grouping, the coarser TOP digits are more stable than the
full 6-digit code.

**Credit status derivation (CreditType rule).** MAP's course list carries a
`CreditType` column (the funding type) and a separate `Non_Credit_Category`
(the CDCP *program* type — Short-term Vocational, ESL, Older Adults, …).
Credit status is derived from **`CreditType`**, not the program category:

| `CreditType` | credit_status |
|---|---|
| `Credit Course` | **Credit** |
| `Other Noncredit Enhanced Funding` | **Noncredit Enhanced** |
| `Workforce Preparation Enhanced Funding` | **Noncredit Enhanced** |
| `Non-Enhanced Funding` | **Noncredit** |
| blank / unrecognized | by `UnitValue`: **>0 → Credit, else Noncredit** |

`Non_Credit_Category` is kept as descriptive metadata in **`noncredit_category`**
(the CDCP program type — Short-term Vocational, ESL, Older Adults, …), not the
funding signal. It is populated only where a member is offered noncredit (null
otherwise), and — like TOP codes — it can differ across colleges, so it carries
`noncredit_category_mixed` + (on the catalog) `noncredit_category_distribution`.
A Credit-status M-ID may still carry a `noncredit_category` if some member
colleges offer the course noncredit. When members of one M-ID disagree on credit
status, store the modal status and set `credit_status_mixed`. The three system
credit statuses are **Credit / Noncredit / Noncredit Enhanced**. Implemented in
`kb/_join_credit_status.py`.

**Future direction — synthetic unified-title layer:** an AI-assisted
canonicalization layer that assigns each MAP exhibit a unified title,
issuing agency, and training agency, so all spelling/format variants
collapse into one card. Design doc:
[`docs/exhibit_unification_vision.md`](docs/exhibit_unification_vision.md).
When that lands, the EACR grouping key will become
`(Unified Title, CPL Type, Collaborative Type)` and a per-exhibit
`also entered as…` disclosure will surface the raw titles underneath.

### 10. C-ID / CCN numbering conventions (authoritative) + M-ID alignment direction

Source docs (ASCCC, uploaded 2026-05-22; checked in under `docs/reference/`):
`cid_ccn_2025_overview.pdf` (the C-ID/CCN one-pager + CCN structure
infographic) defines the **numbering scheme**; `cid_tmc_adt_handbook_f2022.pdf`
and `tmc_development_guidelines_2013.pdf` cover the descriptor/degree-development
process (read on demand if the renumber project needs them — note: PDF page
rendering needs `poppler-utils`, absent in some session containers).

**The two official systems (leave both VERBATIM as listed in COCI — never relabel):**

- **C-ID** (Course Identification Numbering System) — *faculty-driven,
  descriptor-based, many-to-one*: many local courses map to one C-ID descriptor
  (the descriptor is the **minimum** content; colleges may add more). Format is
  `SUBJ ###` (e.g. `COMP 122`, `POLS 110`) — **no `C` prefix on the number.**
  491 active descriptors; basis for 43 TMCs; ~30k CCC courses aligned.
- **CCN** (Common Course Numbering, AB 1111) — *student-facing, template-based,
  one-to-one*: identical template content statewide (extra content goes in an
  optional "Part 2"). Format `SUBJ C####&&`:
  - `SUBJ` — standardized **4-letter** subject abbreviation (a system-level
    standard list; we do NOT yet hold that authoritative list).
  - `C` — Course Type Identifier = "this is a CCN". **A local course has no `C`.**
  - `####` — 4-digit number with **banded meaning**: `0XXX` non-transferable ·
    `1XXX` 100-level · `2XXX` 200-level · `3XXX` 300-level · `4XXX` 400-level ·
    `9XXX` noncredit. (For CCC only lower-division applies → realistically
    `0/1/2/9` XXX.)
  - `&&` — up to **2** Course Speciality Identifiers, no filler when absent:
    `H` Honors · `L` Lab-only · `S` Support · `E` Embedded Support.
  - Example: `GEOL C1005H` = Geology · CCN · 100-level · Honors.
  Rollout: Phase I (6 templates) student-facing Fall 2025; Phase II (24) Fall
  2026/27; Phase III (55) Fall 2027.

**M-ID alignment direction (LANDED 2026-05-22 in the CourseControlNumber re-mint,
PR #84; PR #83 was the dry-run that recorded the decisions):**

Our minted identities (`coci_minted_courses.json`, currently rendered
`M-ID <SUBJ> <num>`) will adopt a CCN-*structured* surrogate format that is
unmistakably **ours, not official**:

- **Lead with `M` in the Course-Type-Identifier position** (`SUBJ M####&&`),
  exactly paralleling CCN's `C`. The `M` (Minted) signals a synthetic MAP
  identity and **prevents any collision with a real CCN `C####`**. This is the
  whole point of the prefix: an M-code must never read as an official CCN.
- **C-IDs and CCNs stay verbatim** (different formats, both authoritative). Only
  the *minted* tier gets the M-scheme.
- **Decisions locked:**
  - **Sequencing — bundle with the re-mint.** The M-prefix AND the banded
    renumber ship together inside the **CourseControlNumber re-mint** (NOT a
    separate relabel pass). Re-keying the minted identity space ripples into
    memberships, `coci_articulations.json` `course_id`, curation `merge_into`
    pointers, dashboard rows, and the Articulations-by-Course card — so it's
    one re-key, not two churns, and must carry an **old-M-ID → new-M-ID alias
    map** so curation/articulation pointers survive.
  - **Banding basis — `credit_status` only, initially.** Noncredit /
    Noncredit-Enhanced → `9XXX`; everything credit → `1XXX`. Honest with data we
    hold. `0XXX` (non-transferable) and the `1XXX` vs `2XXX` split are deferred
    until transferability/degree-applicability data is sourced/confirmed.
  - **Subjects — synthesize a 4-letter map for the M-IDs.** An authoritative
    CCN 4-letter subject-abbreviation list does **not** appear to exist publicly
    yet, so the re-mint will **synthetically derive** a 4-letter abbreviation per
    minted subject from the local COCI subject codes (deterministic, collision-
    managed, clearly **our** synthetic map — NOT the official CCN list). **C-IDs
    stay verbatim** (not re-subjected). Revisit if an authoritative list is later
    sourced. Like the M-numbers, document loudly that these 4-letter subjects are
    a MAP surrogate, not a CCN claim.
  - **Numbering format (confirmed 2026-05-22 via the dry-run, PR #83):**
    CCN's `SUBJ C####` is 4 digits = leading **band** digit + 3-digit sequence.
    Mirror it: **corroborated** M-IDs (≥2 colleges) → clean 4-digit
    `SUBJ M<band><seq:03d>` (`9`=noncredit, `1`=credit; corroborated max per
    (subject,band) is 496 → fits with room). **Stand-alones** (1 college) →
    `SUBJ M<band><d><LL>` — band + 1 sequence digit + **2 letters** (same 4-char
    width; the trailing letters expand capacity to 10·26·26 = **6,760** per
    (subject,band) vs a max stand-alone bucket of 1,432, and signal "stand-alone"
    since corroborated codes are all-digit). It promotes to a corroborated
    `M####` if a second college later joins the title. The within-(subject,band)
    sequence must be **stable, deterministic, persisted** (sorted by normalized
    title) or codes churn each daily regen.
- Always document loudly: **M-numbers are CCN-aligned surrogate keys, NOT a
  claim of CCN equivalence.**


---

## Knowledge Base & Unified Courses Curation — Build Status

The `kb/` directory holds the synthetic-identity knowledge base above MAP's
exhibit/course data, plus the data behind the dashboard's **Unified Courses**
curation tab. Full schema/design: `kb/README.md` and
`docs/exhibit_unification_vision.md`. This section is the orientation map for a
session resuming the build — read it before touching `kb/` or the curation tab.

**Two identity layers:**

1. **Credential layer** (which credential an exhibit represents) — built &
   curated across the full dataset.
   - `unified_titles.json` — every distinct raw exhibit title → a unified
     credential name (+ confidence, `quality_flag`). `quality_flag:
     "suspect_course_as_exhibit"` marks ~200 exhibits typed "Industry
     Certification" that are really a course with no credential (data-entry
     pattern, ~half Modesto JC) — a triage backlog, not a verdict.
   - `credentials.json` — per `(unified_title, issuing_agency)` issuer/trainer
     metadata.

2. **Course-identity layer** (which common course a local course is) — staging
   built; the **articulation crosswalk is the current frontier**. Identifier
   precedence is **CCN-ID > C-ID > M-ID** (see the README section).
   - **CURATED ANCHOR — firewalled, do NOT bulk-edit:** `common_courses.json` +
     `course_crosswalk.json` are a small hand-reviewed quality anchor. NEVER
     bulk-merge staging into them; promote individual entries only after review.
   - **Reference authorities (read-only):** `reference/cid_descriptors.json`,
     `ccn_courses.json`, `mq_disciplines.json` (official MQ discipline
     vocabulary), `reference/coci_courses.json` (authoritative C-ID/CCN courses
     + descriptions from the MAP COCI list), `reference/subject_discipline_map.json`.
   - **Staging (operational, machine-built from the COCI course universe):**
     `coci_minted_courses.json` (minted **M-ID** consolidated courses — identity,
     discipline, credit_status, typical_units, top_code, noncredit_category, each
     with `*_mixed` variance flags), `coci_minted_memberships.json` (lean
     M-ID → member `(subject, number)` join index), `coci_minted_singletons.json`
     (deferred single-college courses), `coci_unified_courses.json` (variant-
     unified clusters), `coci_articulations.json` (earned articulations resolved
     to identity + credential, with cross-college **adoption-leverage** lists —
     the payoff layer), `coci_curation.json` (human curation overlay synced from
     Supabase — each entry carries `discipline` + `reviewed_by` + `reviewed_at`).
   - **Discipline inference (re-runnable, AI-assisted draft):**
     `kb/discipline_inference.json` is an **authored, editable lexicon** — a
     `subject_map` (subject code → discipline, for codes whose member titles are
     unambiguously one discipline) + a tight `title_keyword` fallback (terms that
     are unambiguous alone). `kb/_infer_disciplines.py` applies it to the minted
     courses, clusters, and singletons: validates every target against
     `mq_disciplines.json`, **skips reviewed/curated entries**, and stamps each
     fill with `discipline_source` (`subject_map`|`title_keyword`),
     `discipline_confidence`, `discipline_inferred_at`. Re-run after editing the
     lexicon; it only fills entries that are still blank. Passes 1–3 filled the
     lexicon-tractable courses; the long tail (ambiguous catch-all subject codes)
     remains.
   - **Description-aware inference (re-runnable, complementary):**
     `kb/_infer_disciplines_from_desc.py` mines the course *description* for
     courses whose title/subject gave no signal (e.g. "Climate Control" →
     description names HVAC). It uses a **safe, high-precision phrase set** (only
     terms decisive inside long prose — welding, automotive, dental, CNC,
     paramedic, …) with **plurality scoring + unique-winner** (ties skipped),
     since descriptions mention disciplines tangentially. Descriptions come from
     the in-file `description`/`synthesized_description` for parents and from the
     generated `unified_courses_details.js` for singletons (skipped if that file
     is absent → parents-only). Fills are stamped `discipline_source="description"`
     at confidence **0.5** (the lowest tier — surfaced as `⚙ descr` for reviewer
     triage). Pass 4 filled ~941 (850 singletons + 91 parents).
   - **TOP-aware inference (re-runnable, highest-yield):**
     `kb/_infer_disciplines_from_top.py` maps each blank course's `top_code` to an
     MQ discipline via the authored `kb/top_discipline_map.json` (the 6-digit MAP
     TOP program title is a curated category that often names the discipline:
     "0948.00" → Automotive Technology, "1230.10" → Registered Nursing → Nursing).
     **Guardrail:** colleges vary in TOP assignment, so it's an intent signal, not
     ground truth — fills at **confidence 0.5**, `discipline_source="top_code"`
     (surfaced as `⚙ TOP`), reviewer-verifiable. The coarse catch-all codes
     (`4930.xx` Interdisciplinary/Basic-Skills/Guidance, the `*99.00 Other` and
     `* General` buckets) are **deliberately omitted** from the map so they stay
     blank rather than get a misleading lump-discipline (only ESL `4930.86/.87`
     are mapped). Pass 5 filled **~10,344** (the biggest pass — every staging
     course carries a top_code; blanks 17,537 → ~7,193). Edit the map + re-run.

**Generators** (`kb/_seed_*.py`, `_join_*.py`, `_curation_*.py`, `_flag_*.py`)
are one-shot, kept for provenance — curate by editing JSON / via Supabase, not
by re-running them. **Exception:** `kb/_infer_disciplines.py` is intentionally
re-runnable (idempotent — only fills blanks, never overwrites reviewed/curated).

**Unified Courses dashboard tab + Supabase:**
- The **Unified Courses** tab lets allowed reviewers curate disciplines.
  `unified_courses.js` is a **static asset** — edit it directly; it is NOT
  regenerated by `excel_to_dashboard.py`. (Its DATA, `unified_courses_data.js`,
  IS generated by `export_unified_courses()`.)
- Auth is **Supabase GoTrue magic-link** sign-in gated by an `allowed_reviewers`
  list. The magic link's redirect must be passed as a **`?redirect_to=` query
  param** (not a body `options` object) and must match the Supabase **Site URL /
  allowed Redirect URLs** (both currently set to
  `https://cpl-initiative.github.io/cpl-project-tracker/`). Don't re-break that.
  Sessions are kept alive via the **refresh token** (no repeated magic-link
  emails); the stored token is validated as a well-formed JWT before use so a
  garbled token can't silently break saves. Schema setup:
  `kb/supabase_curation_setup.sql`.
- **Curation UX** (all in `unified_courses.js`): click a Discipline cell to set
  it (MQ vocabulary); after a save, an **opt-in subject-code bulk apply** offers
  to fill other *blank* same-subject courses (never overwrites; warns that
  subject codes vary by college). Edits write to `kb_curation` and show live via
  an overlay. **Batch-verify** — a toolbar **"✓ Verify N filtered"** button
  accepts the machine-inferred discipline AS-IS for every currently-filtered
  Generated row that has a discipline (chunked bulk upsert; excludes blanks /
  locked anchors / already-Verified; the confirm surfaces the lower-confidence
  title-keyword/description share so the curator can narrow to "by subject-code"
  first). It clears the Generated backlog in bulk rather than one Verify per row.
  The **⚇ Unify** candidate ranking factors **subject + units** agreement, not
  title alone (title-token Jaccard ≥ 0.5 gates inclusion; same-subject +0.15 and
  same-units +0.10 reorder to the top — `unified_courses_index.js` now carries
  units as a 5th field). **Suggested-merges worklist** — a **"✨ Suggested
  merges"** toolbar button opens a review queue over precomputed same-course
  groups (`unified_courses_suggestions.js`, lazy). The generator groups identities
  by a **level-safe title signature** (parentheticals removed, articles dropped,
  roman numerals → digits, tokens sorted — so "Japanese I"/"Japanese 1" group but
  "Japanese I"/"II" do NOT), ranked by cohesion (subject + units agreement + size).
  The payload has **two sections, anchored first**: `groups` are
  **identity-anchored** (every group has ≥1 main M-ID/Cluster identity, excludes
  `cid_conflict` over-merges, attaches matching orphan singletons) — **Confirm
  MERGES into that existing identity**. `singleton_groups` (V2, done 2026-05-22)
  are **singleton-only** — ≥2 single-college Stand-Alone courses sharing a
  signature but matching NO existing identity (~1,030 groups) — **Confirm MINTS a
  brand-new unified course** (target left blank → `doConsolidate` generates a
  `UC-CUR-*` id, all members get `merge_into` it + the unified title). Each
  singleton group carries a **`same_college`** flag (set by the generator via the
  title-filtered raw-list join: True when every member resolves to one college →
  likely intra-college variant ladders / credit-noncredit / language pairs, NOT
  cross-college duplicates); these are **flagged in the UI** (amber warning) and
  **ranked last** within the section so genuine cross-college candidates surface
  first (~869 cross-college vs ~161 same-college at last build). The curator
  reviews one group at a time, members pre-checked; **Confirm** reuses
  `doConsolidate`, **Skip** advances. **Never auto-applied.** A **pending-sync indicator** ("⟳ N edits awaiting daily sync") +
  **Sync now** link surface edits not yet in git (diffed against the dataset's
  `committed_curation` snapshot). The **curated common-course anchor**
  (`common_courses.json`, C-ID/CCN/M-ID) is shown **read-only** (an "anchor"
  badge; curation disabled — it's firewalled). Filters include **Source**
  (`id_system`), discipline, credit, confidence, adoption, **Generated-by**
  (discipline provenance — `by subject-code` / `by title-keyword` /
  `by description`), flagged-only, blank-only; default sort is **Subject(s)
  then course number**. Subject(s) cells hover to show the course title(s) /
  cluster title variants.
- **Discipline provenance surfacing** (added 2026-05-22). Generated (not-yet-
  verified) rows whose discipline was machine-inferred carry a small
  `⚙ subj-code` / `⚙ title-kw` / `⚙ descr` badge (title-keyword AND description
  use the warn color, since they're the riskier 0.55/0.5-confidence fills) plus
  the **Generated-by** filter, so a reviewer can blast through the safe
  `subject_map` fills with **Verify** and scrutinize the keyword/description
  ones. The data comes from per-row `dsrc`/`dconf` keys emitted by
  `export_unified_courses()` via the `_add_prov()` helper — emitted **only** on
  non-curated rows that carry a `discipline_source` (blank/manual/anchor rows
  stay lean, no extra keys). Curated rows render as Verified, so no badge. The
  four `discipline_source` values are `subject_map` + `title_keyword` (from
  `kb/_infer_disciplines.py`), `description` (from
  `kb/_infer_disciplines_from_desc.py`), and `top_code` (from
  `kb/_infer_disciplines_from_top.py`) — the Generated-by filter has a matching
  option for each (`by subject-code` / `by title-keyword` / `by description` /
  `by TOP code`); only `subject_map` renders ok-colored, the rest warn.
- Supabase is **live and shared**: only the unified-courses curation tables
  (`kb_curation`, `allowed_reviewers`) are in scope. The
  projects/budget/personnel/workplan tables (§8) and the auth/Redirect-URL config
  are off-limits without explicit confirmation, and no destructive migrations
  without sign-off.

**Generated artifacts + lazy files (all from `export_unified_courses()`).** The
tab keeps `unified_courses_data.js` lean by splitting heavy data into files the
client fetches **only on demand**. All are regenerated daily and MUST be in the
workflow `git add` list (§6):

| File | Global | Loaded when | Contents |
|------|--------|-------------|----------|
| `unified_courses_data.js` | `CPL_UNIFIED_COURSES` | always (script tag) | in-browser rows (~16.4k: Course/Cluster + curated C-ID/CCN/M-ID anchors), `colleges[]`, `mq_disciplines`, `committed_curation`, `committed_descriptions`, `topmap` (TOP code→title, ~400, for the list's TOP hover) |
| `unified_courses_index.js` | `CPL_UC_INDEX` | ⚇ Unify dialog | compact `[id,title,subject,kind,units]` search index (units feeds the subject/units-aware ranking) |
| `unified_courses_details.js` | `CPL_UC_DETAILS` | ⓘ details modal | `id → {d:description, s:source}` (~70k incl. stand-alones; ~34MB, lazy/gzipped) |
| `unified_courses_standalone.js` | `CPL_UC_STANDALONE` | "Stand-Alone" kind filter | ~57.7k single-college rows (kept out of the main payload) |
| `unified_courses_members.js` | `CPL_UC_MEMBERS` | row expand caret ▸ | `id → [{c:collegeIdx,n:code,t:title,u:units,p:topcode}]` member college courses + `topmap` (TOP code→title, deduped) |
| `unified_courses_member_desc.js` | `CPL_UC_MEMBER_DESC` | member "Show descriptions" link | `id → [desc,…]` PARALLEL to `members[id]` (each ≤500 chars) — on-demand, ~51MB so loaded only when a curator opens member descriptions |
| `unified_courses_suggestions.js` | `CPL_UC_SUGGESTIONS` | ✨ Suggested-merges worklist | `{groups:[…], singleton_groups:[{sig,n,score,same_college,members:[{id,t,s,u,k,g}]}]}` — `groups` = identity-anchored same-title merges; `singleton_groups` (V2) = singleton-only matches that mint a NEW unified course (`same_college` flags likely intra-college variants). Ranked by cohesion |

**Raw course source — `kb/reference/coci_course_list.xlsx`** (committed, ~24MB,
141,738 rows). Cols: College, CourseControlNumber, Subject, Course_Number,
CourseTitle, UnitValue, CreditType, Non_Credit_Category, TopCode, **CIDNumber**,
**CatalogDescription**, **CommonCourseNumber**. Read **once** (openpyxl
read-only, streaming — never cat it) in `export_unified_courses()` and shared by
the description + member-row builds. If absent, those two artifacts skip
gracefully.

**Member-college rows + the title-filter (important).** Member rows are a
**forward join**: each identity → its member `(subject, course_number)` pairs →
raw college courses. The membership key `(subject, number)` is **globally
ambiguous** (e.g. "MATH 31" is a different course at every college), so the join
**re-applies the minting's title check**: a candidate is kept only if its title
matches the identity's (token-set Jaccard ≥ 0.5; generic/empty titles kept).
**C-ID / CCN joins are authoritative and trusted** (no title filter — join on
`CIDNumber`/`CommonCourseNumber`). Clusters/merge targets filter each constituent
leaf against its own title. The same title-aware candidate set also feeds the raw
description fallback. (Bug history: without the filter, M-ID A 100 "Undergraduate
Research Experience" listed every college's MATH 31 — Plane Trig, Precalc, etc.)

**Descriptions.** ⓘ modal shows the full record + an **editable description**.
Precedence per id: curated (`kb_curation` field **`description`** — added to
`_apply_curation.py` FIELDS) > existing layer (minted "representative/modal",
synthesized cluster, C-ID/CCN reference) > **raw `CatalogDescription` fallback**.
Stand-alones are included so ~54k get a description. The pending-sync badge
counts description edits too (diffed against `committed_descriptions`).

**Source filter now includes `CCN-ID`** — the 58 AB-1111 Common Course Numbers
(`kb/reference/ccn_courses.json`) are emitted as locked read-only anchor rows,
mirroring the C-ID anchor, and are usable as ⚇ Unify merge targets.

**Frontier / open work:**

- **Suggested-merge worklist V2 — DONE (2026-05-22).** The ~1,030
  **singleton-only** merge clusters (single-college courses that match each other
  but no existing identity) now surface as a second `singleton_groups` section in
  `unified_courses_suggestions.js`, reusing the same generator grouping + UI;
  Confirm mints a brand-new `UC-CUR-*` unified course. Same-college groups
  (~161, likely intra-college variants) are flagged + ranked last. See the
  "Suggested-merges worklist" bullet above for the full description.
- **Dashboard analytics by Unified-Course identity — additive card DONE
  (2026-05-22, Approach A).** The **Articulations by Unified Course** card in CPL
  Analytics (`_build_articulations_by_course()` ← `kb/coci_articulations.json`)
  groups earned articulations by unified identity, surfacing cross-college
  adoption leverage with the over-merge guardrail (see §6a). Collapse: 10,853 raw
  MAP articulation rows → 2,355 distinct course identities (4,592 identity×credential
  records). **Approach B — DONE 2026-05-26 (Session 8, Octaman, PRs #125/#127/#128/#131/#132).** The
  *interactive* EACR (`statewide_adoption` / `statewide_interactive.js`) table was re-pivoted from
  raw-title grouping to unified-credential identity grouping `(unified_title, issuing_agency,
  cpl_type, collab_type)`. Headline collapse: 3,274 cards → 2,351 (28%). Shipped in five PRs:
  dry-run + alias map (#125), unclassified-backfill (#127), producer (#128), consumer +
  migration script (#131), schema-column hotfix (#132). Migration applied as no-op (0 existing
  flags); script retained for future re-pivots. Full lessons in
  `docs/exhibit_canonicalization_lessons.md` "Session 8 — Octaman" section.
- **Open threads (next sessions), in priority order:** (1) **`CourseControlNumber`
  re-mint — LANDED (PR #84, 2026-05-22).** Memberships are re-keyed at the raw
  college-course level (each member carries its own `(College, CourseControlNumber,
  C-ID/CCN)`); minted ids re-keyed to CCN-shaped surrogates (`SUBJ M####`
  corroborated / `SUBJ M<band><d><LL>` stand-alone, synthetic 4-letter SUBJ);
  splits captured in `kb/promotions.json`; `export_unified_courses()` consumes
  the exact joins + promotions-driven Phase A/B. Authoritative alias for
  rollback: `kb/remint_out/alias_map.json`. **Unblocked**: crosswalk Phase C.
  (2) **EACR interactive re-pivot (Approach B above) — DONE Session 8.** (3) **Singleton-only
  worklist follow-up** — consider a `same_college`/blank-disc filter on the
  worklist and extending V2's grouping with a description tie-breaker for the
  borderline cross-college pairs.
- **Crosswalk re-key initiative.** Use the raw list's
  `CIDNumber`/`CommonCourseNumber` to promote minted M-IDs to their real C-ID/CCN
  identity (precedence CCN > C-ID > M-ID). **Phase A — DONE (PR #66):** each row
  carries a `match` field ({`cid`} single agreed C-ID, {`ccn`}, or
  {`cid_conflict`:[…]} when members disagree), surfaced as row badges + an
  "Official ID" filter, computed over the *title-consistent* member set. No
  identity change. In-browser counts: 960 single C-ID, 26 CCN, 235 C-ID
  conflicts (`NULL`/`N/A` sentinels filtered). **Phase B — DONE (2026-05-22,
  decisions: consolidate-by-ID + inline-generator).** Implemented as a
  **post-pass in `export_unified_courses()`** right after the Phase A `match`
  loop: every minted/cluster row whose title-consistent members agree on ONE
  clean official C-ID/CCN is grouped into a single official-identity row —
  **folded under the existing anchor** when one exists, else a **synthesized
  official row** (`id` = the C-ID/CCN, `id_system` accordingly). Last run:
  **896 M-IDs → 173 new official-ID rows + 36 anchor folds** (main payload
  16,442 → 15,719). Each consolidated row carries `consolidated_from` (the
  underlying M-ID keys) and those keys are registered in `merge_into`/
  `merge_members`, so the lazy member/detail joins fold correctly and
  curation/articulation pointers survive. The Unify-dialog index
  (`unified_courses_index.js`) is now built **after** Phase B so consumed M-IDs
  aren't offered as ghost targets and the official rows are searchable. UI:
  rows show a `⛓ N merged` badge (`unified_courses.js`). Regen-safe / no KB
  mutation / reversible. Guardrail honored: only **clean unanimous** matches —
  the 235 `cid_conflict` rows are never touched; a lone M-ID with no anchor
  keeps just its Phase A badge (no synthetic relabel). **Phase C — PARKED
  (2026-05-22, informed decision).** Splitting the `cid_conflict` / no-official-ID
  rows is deferred; conflicts stay safely surfaced via the existing "C-ID
  conflict — do not promote" badge + filter, and Phase B (clean official-ID
  consolidation) remains the automatic stopping point. **Root cause:** the
  membership key is `(subject, number)`, which is **lossy** — the same key is a
  different course across colleges (`ACCT 110` at one, `ACCT 120` at another), so
  conflicts **cannot be split at the generator level**. It's a key-granularity
  problem, not a similarity one, so a description tie-breaker can't fix it.
  **Numbers:** 231 conflicts across 2,274 member pairs; ~60% carry any C-ID,
  ~32% (718) map to >1 C-ID themselves, only ~29% cleanly extractable. **Real
  fix (its own project — scope before any build):** a `CourseControlNumber`-
  grained re-mint that rebuilds memberships at the raw college-course level so
  each member carries its own C-ID (the per-college COCI course list, which
  carries the control number, is the likely input). NOT a generator post-pass.
- Refine + curate the articulation crosswalk — precise title-based
  disambiguation when a `(subject, number)` maps to multiple M-IDs, carry
  confidence/`*_mixed`/over-merge flags onto each record, never emit an adoption
  suggestion off a flagged over-merged cluster. Backlog: fuzzy variant merging +
  subject canonicalization, singleton minting, and the
  `suspect_course_as_exhibit` triage (raise the Modesto pattern with the college).
- **Description-similarity tie-breaker (Phase C candidate).** The member-row
  forward join currently keeps a candidate when its title matches the identity
  (token-set Jaccard ≥ 0.5). Titles are the right *primary* signal, but the
  borderline band (titles differ enough to fail the threshold yet are the same
  course, e.g. "Intro to Programming" vs "Programming Fundamentals", or the
  reverse — same generic title, different course) would benefit from a
  *secondary* check on `CatalogDescription` similarity (TF-IDF/cosine with
  boilerplate like "students will…"/prereqs/repeatability stripped). Scope it to
  the ambiguous middle (~0.3–0.5 title Jaccard), NOT every pair — descriptions
  share boilerplate that inflates naive similarity, and it's heavier (~450 chars
  × 141k rows). Prototype + **measure how many member rows flip** before
  committing. (Motivating case: College of the Desert's MATH 31 genuinely *is*
  "Undergraduate Research Experience" in STEM — title match already keeps it; the
  tie-breaker is for the harder cases the title gate can't settle.)
**Discipline completion — 5 inference passes done (2026-05-22).** Blank
disciplines went from **21,656 → ~7,193** (~67% filled) across: lexicon passes
1–3 (`discipline_inference.json` + `_infer_disciplines.py` — subject_map +
title_keyword), the description pass (`_infer_disciplines_from_desc.py`), and
the highest-yield TOP-aware pass (`_infer_disciplines_from_top.py` +
`top_discipline_map.json`, ~10.3k fills). Each fill is a confidence-tiered,
reviewer-verifiable draft (`discipline_source` ∈
`subject_map`/`title_keyword`/`description`/`top_code`; surfaced via the
Generated-by filter + `⚙` badges + **batch-verify**). **The remaining ~7,193
are mostly the genuinely-ambiguous `4930.xx` academic catch-all** (deliberately
not auto-filled) — best closed by **reviewer curation in the tab** (now
well-tooled), not more heuristics. Re-run any pass after editing its
lexicon/map; all skip reviewed/curated and only fill blanks.

**Guardrails when resuming:**
- The `coci_*.json` files are large (tens of MB). **Never read/cat them into the
  conversation** — it trips `400: text content blocks must be non-empty` /
  context overflow. Inspect via scripts that print counts/samples only.
- Staging only; don't touch the curated anchor or Supabase auth/other tables
  without confirmation. Feature branch + PR; don't push to `main`.

---

## 11. M-ID Lifecycle, Model Curriculum (MC), and the CID/CIDx Pathway

M-IDs are not just identity surrogates — they're staging points in a strategic
pipeline toward ASCCC C-ID approval. The dual-score auditor at
`kb/_row_audit.py` and any future curation work depend on this framing.

### The pipeline

```
seed-untouched M-ID (Phase B draft from _seed_coci_minted_mids.py)
  → curator-Verified M-ID (faculty trust signal — UCL Verify in Supabase)
  → MC-ready M-ID (MC slots populated: SLOs, content outline, methods, …)
  → submitted to ASCCC for C-ID / CIDx approval
  → APPROVED → M-ID substituted out for new CID in the Unified Course catalog
              (alias-tracked via the same Rule 7 / re-mint playbook)
```

The auditor identifies M-IDs at each stage and what gates them from the next;
it never drives the substitution itself. Approval is a re-key — the M-ID
disappears from the catalog, the new CID anchor takes its place, and the
old→new alias is preserved in the same manner as the 2026-05-22 re-mint.

### CID vs CIDx — pick your pathway

| Pathway | Approval body | Speed | Notes |
|---|---|---|---|
| **CID** (general C-ID)  | CIAC (CCC + CSU + UC intersegmental) | Slow, hard | UC defaults often dominate and kill candidates |
| **CIDx** (CTE C-ID)     | ASCCC C-ID team only | Fast, easy | Intersegmental agreement not required |

Eventual automation target = **CIDx submission flow** (CTE only). Every M-ID is
*theoretically* eligible to submit (faculty discretion is the gate, not a CTE
flag); the CID-vs-CIDx lane is decided at submission time. The COCI extract
carries a CTE field that will be wired in when the CIDx workflow lands —
deferred for now.

### MC, NOT TMC — the terminology landmine

For M-IDs we say **MC** (Model Curriculum). NOT **TMC** (Transfer Model
Curriculum). The distinction is strategic:

- **TMC** implies **transferability** — which requires intersegmental
  agreement (CIAC), which is the hard/slow lane M-IDs were designed to avoid.
- **MC** is the curriculum package without the transferability claim — the
  bar is lower; faculty + AOs review CPL articulation adoption without the
  angst of UC defaults killing the course.

M-IDs are CPL articulation-adoption signals, full stop. They are NOT a
transferability claim. **Do not reintroduce TMC framing for M-IDs.**

`transferability` and `degree_applicability` are deliberately EXCLUDED from
the `MC_NOT_YET_CAPTURED` slot list in `kb/_row_audit.py`. Adding them back
would reintroduce the UC-defaults trap and undo the angst-removal benefit.

### The Trust-Card auditor — `kb/_row_audit.py`

Read-only auditor over every M-ID + Cluster. Per row, produces a Trust Card:

- **`faculty_trust_score`** ∈ [0,1] — is the row trustworthy enough that a
  discipline faculty member should rely on it to ratify a cross-college
  articulation? Weighted across faculty_fields: discipline (0.30),
  credit_status (0.20), typical_units (0.20), description (0.15),
  top_code (0.10), confidence (0.05).
- **`mc_ready_score`** ∈ [0,1] — is the row a viable MC submission? Sums
  faculty_fields (70% share) + MC slots (30% share, currently all
  `not_yet_captured`). Every row sits well below mc_ready until SLOs land —
  that's the strategic message: MC-readiness is the destination, not the
  current state.
- **Field states:** real / aggregated-unanimous / aggregated-modal /
  aggregated-varied / inferred / curated / seed-untouched / off-scheme /
  missing / conflicting / not_yet_captured.
- **Readiness tiers:** ready (≥0.85) / needs_review (≥0.65) /
  needs_repair (≥0.40) / not_ready.
- **Rule tags + counts (2026-05-27, after `merge_into_orphan` landed):**
  - `seed_untouched_discipline` (11,158) — Phase B subject_map draft never reviewed (Phase 1a)
  - `subject_collision_signal` (**0** ✓) — Phase 1e cleanup receipt: every M-ID with a discipline now shares the canonical SUBJ4 (down from 7,203 pre-apply)
  - `unit_anomaly` (4,385) — typical_units represents <50% of member colleges (member-unit variance is high, possible over-merge across different unit-load variants); 71% of flags are 2-member splits like `[3.0, 0.0]` (credit vs noncredit drift in the same M-ID) (Phase 1c)
  - `top_discipline_disagreement` (857, was 2,201 before SISTER_PAIRS) — TOP code → different discipline than assigned (Phase 1c)
  - `blank_description` (1,733) — Phase 1a
  - `blank_discipline` (1,266) — Phase 1a
  - `discipline_title_mismatch` (742) — title shares 0 tokens with assigned discipline AND ≥2 with some other (Phase 1c)
  - `description_discipline_disagreement` (78) — description's safe-phrase set points elsewhere with ≥2 mentions (Phase 1c)
  - `generic_title_concrete_discipline` (44) — title is course-format generic; can't justify a specific discipline (Phase 1c)
  - `mid_id_off_scheme` (**2** — `F M1002` + `N M9001`, both blank-discipline; unfixable residue) — was 27 pre-apply
  - `merge_into_orphan` (**0** — preventive infrastructure; fires when a curation `merge_into` points to a target not in courses ∪ singletons ∪ `UC-CUR-*`. All 3 current pointers cleanly target `UC-CUR-MPG029OM`) (Phase 1c, 2026-05-27)
  - `cluster_blanks_when_aggregatable` (1), `cluster_id_off_scheme` (1), `uc_cur_ripe_for_promotion` (1) — Phase 1a

- **Score now incorporates per-tag penalties (`TAG_PENALTY_ON_DISCIPLINE` + `TAG_PENALTY_ON_UNITS`).** Each cross-validation tag deducts from its target field's per-field score before the weighted mean (floored at 0). Tags compound: a row firing 3 discipline rules drops materially below a row firing 1, even with the same field states. Penalties: `discipline_title_mismatch` −0.20, `top_discipline_disagreement` −0.15, `description_discipline_disagreement` −0.15, `generic_title_concrete_discipline` −0.20 (all dock the `discipline` field); `unit_anomaly` −0.20 (docks the `typical_units` field). Mirrored client-side in `unified_courses.js` for the breakdown tooltip — keep the two in sync.

- **UCL chip + filter wiring (Phase 1b + 1c UX):**
  - Per-row chip: `⚠ N · 0.XX` (tag count + faculty_trust_score), color-graded by score severity — `warn`/red <0.40, `mix`/amber 0.40-0.65, `muted`/gray ≥0.65 (matches `READINESS_TIERS`).
  - Hover tooltip: tag-derived score breakdown (e.g. *"discipline penalized −0.35 (2 signals)"* + per-tag labels). Computed client-side from the summary — no per-field state inlined into `latest.json`.
  - Toolbar `Triage:` dropdown with 8 modes: *Any audit flag*, *3+ findings* (high-confidence misassignment subset — ~246 rows), *Title mismatch*, *TOP mismatch*, *Description mismatch*, *Generic title*, *Seed untouched*, *Cluster issues*.
  - Toolbar `⚠ N rows flagged (audit YYYY-MM-DD)` indicator — live confirmation that the audit overlay is loaded.

**Outputs:**
- `kb/row_audit/latest.json` — slim per-row summaries + full Cluster cards (~2 MB, committed)
- `kb/row_audit/<date>.md` — human report with top-50 cleanup queue (~7 KB, committed)
- `kb/row_audit/<date>.full.json` — full per-row breakdown (~12 MB, gitignored)

Re-runnable, never mutates. Suggested-fix payloads on aggregable Cluster
fields are shaped for `_apply_curation.py` to consume in Phase 1b. Run from
repo root: `python3 kb/_row_audit.py`.

### Roadmap

| Phase | What | Status |
|---|---|---|
| 1a | Trust-Card auditor (read-only) | **DONE** 2026-05-23 |
| 1b (1/2) | Cluster row member-aggregation in renderer (fixes UC-CUR-MPG029OM blanks) | **DONE** 2026-05-23 |
| 1b (2/2) | UCL "⚠ hinky" chip + audit-status toolbar indicator + daily auditor cron | **DONE** 2026-05-23 |
| 1b (3/3) | Curate-write Repair-from-members action (Supabase schema migration + fresh-read + cron-window) | parked (low immediate value — 1 cluster; build when ≥5 clusters exist) |
| 1c | More audit rules — **8 of 9 landed:** `discipline_title_mismatch`, `generic_title_concrete_discipline`, `top_discipline_disagreement` (+ SISTER_PAIRS suppression), `description_discipline_disagreement`, `subject_collision_signal` (Phase 1e diagnostic — **7,203 flags pre-re-mint**, target 0 post-re-mint), `unit_anomaly` (2026-05-26, 4,385 flags — first member-level cross-validation, also first non-discipline penalty via `TAG_PENALTY_ON_UNITS`; surfaces possible over-merges across credit-vs-noncredit unit-load variants), and **`merge_into_orphan`** (2026-05-27, **0 flags on current data** — preventive data-integrity detector for dangling `merge_into` pointers; valid targets = courses ∪ singletons ∪ `UC-CUR-*`; fires symmetrically on M-IDs + clusters with bad curation pointers). **Still queued:** `cluster_title_drift` (low yield until more clusters mint) | in progress |
| 1c-UX | Score-with-tag-penalty + chip-with-score + severity color grade + breakdown hover + UCL Triage filter + .uc-flags-cell nowrap + Adoptable rename | **DONE** 2026-05-23 |
| 1d | UI rename "Unified Courses" → "Common Course Reference" (CCR); URL hash + filenames preserved | **DONE** 2026-05-23 (PR #87) |
| **1e-5a** | SUBJ4-canonicalization Session 5a — seed + curator tab + audit rule. `kb/_seed_canonical_subj4.py` produces `kb/discipline_canonical_subj4.json` (144 disciplines: 44 pre-seeded with 4-letter data-modal, 100 needs_review). New top-level **Canonical SUBJ4** tab in the dashboard (auth-gated CRUD; writes to Supabase `kb_curation` with synthesized `_CANON_SUBJ4::<discipline>` namespace, no schema migration). `kb/_apply_canonical_subj4.py` sync wired into the daily cron. | **DONE** 2026-05-23 (PR #89, Bruh Quad) |
| **1e-5b** | SUBJ4-canonicalization Session 5b — measure-first dry-run. `kb/_subj4_dryrun.py` is re-runnable, walks both `coci_minted_courses.json` + `coci_minted_singletons.json`, applies the curation overlay, classifies every M-ID's fate, reallocates new course_ids deterministically by `(normalized_title, old_id)`, validates 4 gates, surfaces curated-collision decision points, counts downstream apply scope (memberships + articulations + cluster refs). Artifacts at `kb/subj4_dryrun/{report.md, alias_map.json, blocked.json, collisions.json}`. Apply gate signal becomes the green light for 5c. Bonus: regen-safe seed generator preserves curator-reviewed entries; caught singleton-only discipline (`Upholstering`) missing from initial seed. | **DONE** 2026-05-23 (Bruh Quad) |
| **1e-5c** | SUBJ4-canonicalization Session 5c — atomic apply. `kb/_subj4_apply.py` re-keyed 14,971 minted + 50,182 singleton M-IDs + 14,971 memberships + 3,750 articulations + 2,868 cluster member refs + 5 curation entries; `kb/_subj4_apply_supabase.py` PATCHed the live `kb_curation` rows. Orchestrated by `.github/workflows/phase-1e-apply.yml` (manual-dispatch, concurrency group `daily-dashboard`). Cleanup receipt: `subject_collision_signal` = 0 ✓; `mid_id_off_scheme` = 2 unfixable blank-discipline rows. Three bugs caught + fixed mid-stream: 386-row silent overwrite (added V4 `new_id_disjoint_from_untouched` gate), YAML scanner error on multi-line `-m` (switched to multiple `-m` flags), Supabase fan-out (13k PATCHes → ~7 via pre-fetch of curated set). | **DONE** 2026-05-23 (PRs #93/#94/#95; apply commit `5406055`) |
| 1e-5d | M-ID → MID, C-ID → CID label rename (cosmetic; no identifier format change). Touches `id_system` field values in 3 JSON files (~16,850 rows) + 25+ code/doc references + UI labels. UI labels DONE in PR #100 (Bruh Quad CSC PR C); full data-value rename across `id_system` field still queued. | UI labels DONE 2026-05-23 (PR #100); data-value rename queued |
| **CSC-A** | Common Subject Code tab (formerly Canonical SUBJ4) — UI polish for faculty: rename, plain-language intro, Development Draft badge, Curation guidelines modal, "(CCCCO MAP only)" auth label, beta-box removal, "needs 4-letter" warning badge | **DONE** 2026-05-23 (PR #98, Bruh Quad) |
| **CSC-B** | Common Subject Code tab — affordances: variants popup with CID/CCN matches, per-row CID/CCN match badges, native-datalist typeahead search, sortable columns | **DONE** 2026-05-23 (PR #99, Bruh Quad) |
| **CSC-C** | Common Subject Code tab — validate workflow (Supabase migration: validated_at/validated_by added to kb_curation), TOP column + 2-digit grouping + filter, CIP placeholder column, CTE designation (from CCC 2023 TOP Manual: 236/380 CTE-designated; M-ID-level + discipline-level aggregates), MID/CID UI label rename | **DONE** 2026-05-23 (PR #100, Bruh Quad) |
| **CSC-D** | Common Subject Code tab — search-focus bug fix (render() refactor: toolbar built once, auth widget gets its own renderAuth), label tweaks (Common SUBJ / Most-used locally), enriched MID + CID/CCN badge tooltips, badges clickable to open variants modal, CIP moved next to TOP, Collapse-all twisty, scope-note callout linking the CCC 2025-26 MQ Handbook | **DONE** 2026-05-23 (PR #107, Bruh Quad) |
| **CSC-E** | Common Subject Code tab — local-variants data refresh. New `local_subject_variants` field per discipline aggregated from `kb/coci_minted_memberships.json` (corroborated MIDs' member.subject) + `coci_minted_singletons.json` (each singleton's own subject). Variants column + modal + Most-used-locally now reflect REAL local college codes (e.g. Sign Language American shows ASL/SIGN/DEAF/AMSL/SL/… with real counts instead of post-apply uniform canonical). data_modal recomputed from local data. | **DONE** 2026-05-23 (PR #109, Bruh Quad) |
| **CSC-F** | Common Subject Code tab — column centering prototype. 6 lines of CSS scoped to `#tab-canonical-subj4`: th/td center H+V; first column (Discipline) overrides to left-align; `:has(textarea)` cell overrides Notes back to left. Per the agreed plan, this is the PROTOTYPE only; global sweep across CCR/KPI/projects/exhibit tables queued as CSC-G pending curator eyeball. | **DONE** 2026-05-23 (PR #110, Bruh Quad) |
| **CSC-G** | Global column-centering sweep — applied CSC-F's H+V-center-except-first rule to the CCR (`.uc-table`) with per-column opt-outs for the long-text identifier columns (Title col 3, Discipline col 4 stay left-aligned alongside col 1). KPI cards + Projects Grid are card-based, natural opt-outs. Exhibit Analysis tables (`.exhibit-table`) have mixed column intent (some `.exhibit-cell-num`/`-pct` right-aligned, some plain `<td>` text); a blanket th alignment misaligns the ranking tables, so they're left as-is — a per-column th-class pass is its own future scope if we want a deeper sweep. | **DONE 2026-05-26** (PR #139, Sexy Dexy) |
| **Letters-A** | Letters tab — integrate the budget-support letter curator from the cpl-knowledge-base repo as a top-level dashboard tab. Iframe-embed `budget-support/web/curator.html` (curator's `:root` CSS vars would leak if inlined). Backend stays on the KB's separate Supabase project (`mdxutmbpoqjtdcwjscux`), not project-tracker's. Auth: passcode-gated inside the curator (sessionStorage `curator_pass`), public read-only browsing. Full hand-off prompt for future work at `docs/letter_curator_handoff.md`. | **DONE 2026-05-26** (PR #136, Sexy Dexy) |
| **Quickstart-Dashboard** | Quickstart filter-hint vocabulary for the Dashboard tab. PR #135 (Quickstart-C) shipped the architecture but only wired three curator tabs (credential-reference, unified-courses, canonical-subj4). Prompts like "apprenticeship initiative" routed to Dashboard but landed on the unfiltered grid. Adds `search` free-text + `activity`/`goal`/`status` enums to `HINT_VOCAB.dashboard`; adds `applyQuickstartHint()` consumer in `dashboard_filters.js` covering both cold-load (sessionStorage) and live-event (`cpl-qs-hint`) paths. Side fix: missing `letters` tab routing (regression from PR #136). | **DONE 2026-05-26** (PR #141, Sexy Dexy) |
| **Apprentice-rename** | Workplan project 3.1.2a renamed: both 3.1 and 3.1.2a carried the title "CPL Offers & Awards Tracking" — confusing in the projects grid. They track DISTINCT KPI series (3.1 = 250k all Californians; 3.1.2a = 20k apprentices + journey workers), so deletion would lose the apprentice progress bar. Rename to "CPL Offers & Awards Tracking — Apprentice Cohort" preserves both, removes duplication. Other apprenticeship projects (4.1.2 Apprenticeship Sprint, 5.3 AI Apprenticeship CPL Tools, D.* KPI metric rows) stay distinct. | **DONE 2026-05-26** (PR #142, Sexy Dexy) |
| **Quickstart-Typeahead** | Typeahead suggestion dropdown + `scroll_to` direct-jump in the Quick-start chat. Two-part PR: (1) on mount, `quickstart.js` builds a search directory from `window.CPL_DATA.projects` + the existing `TABS` list; as the user types ≥2 chars, up to 6 matches surface in a small dropdown (name-prefix beats contains; project IDs like `4.1.2` searchable; mouse + arrow-keys + Enter + Escape all wired). Picking a suggestion BYPASSES the AI router. (2) New `scroll_to` key in `HINT_VOCAB.dashboard` — `dashboard_filters.js` consumes by finding the `.project-card` by exact `.project-name` text match, scrolling to it, and flashing a 1.6s box-shadow. Skips the filter mutations entirely (no noisy filter). Free-form prompts still go through Claude. CSS (`.qs-suggest*`, `@keyframes qsCardFlash`) mirrored to index.html. | **DONE 2026-05-26** (PR #144, Sexy Dexy) |
| **Cohort-family-rename** | Activity 3 had four cards titled "CPL Offers & Awards Tracking" (3.1, 3.1.1, 3.1.2, 3.1.2a). PR #142 disambiguated 3.1.2a only; this finishes the family: 3.1 → "— All Populations", 3.1.1 → "— Working Adults", 3.1.2 → "— Veterans & Service Members". 3.1.2a left as "— Apprentice Cohort" per user (suffix style varies slightly but disambiguation is clear). All four track distinct KPI series (per-cohort goal/stretch ladders), so folding was off-table — disambiguation is the right move. | **DONE 2026-05-26** (PR #145, Sexy Dexy) |
| **SEC-baseline** | Security tooling baseline — Dependabot (pip + github-actions, weekly), CodeQL (Python + JS, push/PR/weekly), TruffleHog secret scan (`--results=verified` to avoid false-positives on public Supabase anon keys). All free for public repos. ALL THREE STAGES MERGED this session (pip bumps #105/#106 stage 1, actions/checkout + setup-python #102/#104 stage 2, codeql-action v3→v4 #103 stage 3). | **DONE** 2026-05-23 (PR #101 + #102/#103/#104/#105/#106, Bruh Quad) |
| **CSC-polish** | Three CSC tab UI polish items: status badge label `Reviewed` → `Initiated` (DB fields, internal filter keys, and the "Reviewed" column header for who-acted stay as-is — the rename is the user-facing label only); `.cs-var-show` chip ("Show all (N) →") font-size .78rem → .7rem + color navy → slate-600 dark grey; `.cs-var-modal` (first/most-used variant in inline cell) font-weight 700 → 400 + color navy → black. CSS mirrored in both `CPL_Dashboard.html` and `index.html` per Rule 4; static template, not regenerated. | **DONE 2026-05-24** (PR #112, Bruh Hex) |
| **Exhibit-canon PR-A** | `kb/_audit_exhibits.py` re-runnable auditor over `kb/unified_titles.json` + `kb/credentials.json` (3,217 raw → 1,969 unified, 0 titles reviewed, 194 unclassified-in-MAP, 211 agency-collision candidates, 200 `suspect_course_as_exhibit`). Outputs to `kb/exhibit_audit/{latest.json, <date>.md}`. Rules: low/very-low confidence-band tags, `agency_name_collision_signal`, drift checks. `null_issuer_with_high_confidence` rule scoped + dropped (99% noise on legit local-college Cx buckets). Lessons doc: `docs/exhibit_canonicalization_lessons.md` (Rule 8, first checkpoint for this workstream). | **DONE 2026-05-24** (Session 6, Bruh Hex) |
| **Exhibit-canon PR-B** | **Credential Reference** tab — new top-level dashboard tab modeled on the CSC tab. Row grain: one per unified_title (1,969 rows). Shows raw-variant count, primary issuer, modal title confidence + issuer confidence, audit-tag chip (⚠ N from `kb/exhibit_audit/latest.json` per raw variant), quality_flag, curator-reviewed state. Click a row to expand → raw_title list + credential record(s) + audit-rule rollup. Filters: confidence band, issuing-agency typeahead (datalist over 126 issuers), audit-tag triage dropdown, quality-flag only, free-text search across unified/raw/issuer. Curation: **Mark initiated** writes to Supabase `kb_curation` via synthesized key namespace `_CREDENTIAL_REVIEW::<unified_title>` + field `reviewed_marker`. Auth piggybacks on the unified_courses.js session (sessionStorage key `cpl_sb`). Runtime fetch (no excel_to_dashboard.py changes, no daily-cron changes); JSON sync script `kb/_apply_credential_review.py` deferred — MVP edits live in Supabase + overlay only. | **DONE 2026-05-24** (Session 6, Bruh Hex) |
| **Exhibit-canon PR-C0** | EACR Phase 4 dry-run + alias map. `kb/_eacr_dryrun.py` projects every raw MAP row onto the post-pivot `(unified_title, issuing_agency, cpl_type, collab_type)` key, emits the alias map (`kb/eacr_dryrun/alias_map.json`) for the downstream re-key. Output: 3,217 raw IDs → 2,351 cards (27% collapse); 310 cards fold ≥2 raw IDs; max fold = 26 raw variants on AP World History. | **DONE 2026-05-26** (PR #125, Octaman) |
| **Exhibit-canon PR-C0b** | Re-classify the 58 raw titles flagged `unclassified_in_map_only` in PR-A's audit — closes the audit queue to zero before the producer re-pivot. | **DONE 2026-05-26** (PR #127, Octaman) |
| **Exhibit-canon PR-C1** | EACR Phase 4 producer re-pivot. `_build_statewide_adoption()` grouping key: `(raw_title, cpl_type, collab_type)` → `(unified_title, issuing_agency, cpl_type, collab_type)`. New per-card fields: `unified_title`, `issuing_agency`, `training_agency`, `confidence_title`, `confidence_issuer`, `quality_flag`, `raw_titles[]`. Generator-side strip pattern added to keep the daily regen idempotent. Headline adoption numbers shifted: 3,274 cards → 2,351. | **DONE 2026-05-26** (PR #128, Octaman) |
| **Exhibit-canon PR-C2** | EACR Phase 4 consumer redesign. Card title shows `unified_title` in bold + issuer subtitle in muted italic; "Also entered as N variants" disclosure (310 cards have ≥2 raw variants); confidence badge ("needs review · 0.NN" below threshold 0.75 per vision §6.2); quality_flag badge ("⚠ course-as-exhibit" on 193 cards). New Issuing Agency filter button. CSS in EXHIBIT_ANALYSIS_CSS so the daily regen carries it. Migration script `kb/_eacr_flag_migrate.py` for `_EACR_FLAG::*` curator-flag re-key (script-only; runs from curator laptop with `SUPABASE_SERVICE_KEY`). | **DONE 2026-05-26** (PR #131, Octaman) |
| **Exhibit-canon PR-C2-hotfix** | Hotfix on `_eacr_flag_migrate.py` — column is `reviewer_email`, not `reviewed_by` (`fetchFlagOverlay()` aliases the column to a property on the in-memory JS object; the migration script's first author read the rendering code and assumed the property name was the column name). Five character-substitutions. Migration applied via dry-run: **0 existing flags** (PR-D shipped only 2 days prior; no curator flagged anything in the window). Script stays for future-proofing. | **DONE 2026-05-26** (PR #132, Octaman) |
| **Quickstart-A** | Quick-start natural-language tab routing — single text input on the Dashboard first screen; Claude API classifies user prompt to one of the 8 tabs. New file `quickstart.js`; Cloudflare Worker proxy used for the API call. | **DONE 2026-05-26** (PR #129, Octaman) |
| **Quickstart-B** | Quick-start polish — swap `claude-sonnet-4-5` → `claude-haiku-4-5-20251001` (4-6s → 1-2s round-trip) since routing is a 1-of-8 classification; new `navigateTo()` provides scroll-to-top + nav-button pulse when the destination matches the active tab (the silent-no-op trap of `location.hash = current`). | **DONE 2026-05-26** (PR #130, Octaman) |
| **Quickstart-C** | Quick-start Tier B — filter-hint hand-off. Router emits an optional `filter_hint` object alongside `{tab, message}`; each curator tab pre-applies recognized keys to its filter state. `quickstart.js` stashes the hint in `sessionStorage['cpl_qs_hint_<tab>']` + fires a `cpl-qs-hint` window event before navigating, covering both already-mounted (event) and refresh-on-deep-link (sessionStorage) paths. `HINT_VOCAB` enumerates exact enum values per tab so Haiku copies strings verbatim (mismatch risk ~zero). Three tabs wired: `credential-reference` (audit_tag / confidence_band / issuer / quality_flag_only / search), `unified-courses` (12 keys incl. status/prov/triage/disc/search), `canonical-subj4` (status / top_2digit / search). Unknown keys silently dropped — bad hint never blocks nav. **Examples that work end-to-end:** "review unclassified credentials" → CR + `audit_tag=unclassified_in_map`; "find Adobe credentials" → CR + `search=Adobe`; "title-keyword Generated rows in CCR" → CCR + `status=Generated, prov=by title-keyword`; "subjects needing review" → CSC + `status=needs_review`. | **DONE 2026-05-26** (PR #135, Bruh Nona) |
| **SEC-CodeQL-trigger** | Disable CodeQL on PR events (push + weekly cron only). Eliminates CodeQL fatigue from PRs that touch innocent DOM-builders the analyzer perpetually flags as `js/xss`. Push + weekly schedule retain real coverage. | **DONE 2026-05-26** (PR #126, Octaman) |
| **Exhibit-canon PR-D** | EACR-card **stale/dup flag** — small in-place addition to the existing EACR table (`statewide_interactive.js`). Per-row `<select>` with three options (— / 🚩 stale / 🚩 dup). Auth-gated; curator signs in via the Common Course Reference or Credential Reference tab (sessionStorage `cpl_sb`). Writes to Supabase `kb_curation` via synthesized key namespace `_EACR_FLAG::<exhibit_card_key>` + field `flag`. Anonymous viewers see flagged rows with a read-only 🚩 badge so the curator's annotation is publicly visible. Tooltip carries the audit trail (flagged by user · on date). **Deliberately narrow scope per user direction:** no Credit Recommendation overrides, no approval status, no notes — only the stale/dup flag. | **DONE 2026-05-24** (Session 6, Bruh Hex) |
| **Cred-Ref-hotfix-A** | `VALID_TABS` whitelist coupling — PR-B added the Credential Reference tab nav button + pane + script tag, but the inline tab-router whitelist (`CPL_Dashboard.html` line 13013) wasn't updated, so clicking the tab fell through to the dashboard fallback. Curator reported the tab "is a copy of the dashboard main". One-line fix: append `'credential-reference'` to the whitelist. | **DONE 2026-05-25** (PR #117, Bruh Hept) |
| **Cred-Ref-hotfix-B** | Magic-link return-tab — `unified_courses.js`'s `consumeAuthHash()` hardcoded `location.hash = "unified-courses"` after magic-link callback, bouncing the curator to the Common Course Reference tab regardless of where they started sign-in. Each tab's `signIn()` now stashes its identifier in `sessionStorage.cpl_sb_return_tab` before the OTP request; `consumeAuthHash` reads it back, defaulting to `"unified-courses"`. Same fix applied to canonical_subj4.js. | **DONE 2026-05-25** (PR #118, Bruh Hept) |
| **Cred-Ref-hotfix-C** | Inline sign-in feedback panel across all 3 curator tabs — replaces the easily-missed corner toast (and `unified_courses.js`'s clunky `alert()`) with a prominent green inline panel that lives where the "sign in to edit" link used to be. "✉ Magic link sent to {email}" + a "use a different email" link; red error variant with "try again" for failures. Per-tab `pendingSignInEmail` / `pendingSignInError` state. | **DONE 2026-05-25** (PR #119, Bruh Hept) |
| **Cred-Ref-hotfix-D** | 429-aware error mapping — distinguish Supabase rate-limit responses ("Too many sign-in emails…") from 400/422 allowlist errors ("Server rejected — confirm allowed-reviewers") from generic 5xx. Three tabs symmetric: `unified_courses.js` already had the branch; `credential_reference.js` and `canonical_subj4.js` were not mirrored. | **DONE 2026-05-25** (PR #120, Bruh Hept) |
| **Cred-Ref PR-1** | Common-course join + Local/Statewide badge + Discipline column. New `export_credential_reference()` in `excel_to_dashboard.py` joins `kb/unified_titles.json` + `credentials.json` with the course-identity layer (`coci_articulations.json` + minted/unified/singleton catalogs) → emits `credential_reference_data.js` (~1.5 MB lean payload, pre-joined + audit-tag rollup + `top_categories` map). Tab loads the baked global synchronously; runtime fetch of `kb/*.json` kept as fallback. Per-row Scope badge (🏛 Statewide / 🏠 Local / —), Discipline column (modal MQ discipline across articulations). Expanded body leads with a per-identity table: CCN-ID/C-ID/M-ID/Cluster identity (color-coded), local course code+title, earning college(s); identity cell rowspan'd when ≥1 local course shares it. Stats: 1,969 unified titles · 1,726 articulated · 4,324 local-course lines · 90 statewide · 1,106 audit-flagged. | **DONE 2026-05-25** (PR #121, Bruh Hept) |
| **Cred-Ref PR-2** | Select-all + bulk "Mark N initiated" workflow — clears the audit-flagged backlog without one-at-a-time clicks. New first-column per-row checkbox (disabled if already initiated OR during a save); header "select all visible eligible" (filtered-view-scoped) with indeterminate state on partial selection. Toolbar widget shows green "✓ Mark N initiated" button + clear link when N>0; swaps to a yellow "Saving X of N…" progress indicator during the sequential Supabase save. Per-row UI flips to ✓ as each save completes. Confirm dialog before kickoff; final toast reports ok/failed counts. | **DONE 2026-05-25** (PR #122, Bruh Hept) |
| **Cred-Ref PR-3** | TOP / Discipline grouping with collapsible category headers. "Group by:" toolbar dropdown (none / TOP category / Discipline). TOP mode buckets by 2-digit TOP code with `TOP 12 — Health` headers (using `top_categories` map from the baked payload, sourced from `kb/discipline_canonical_subj4.json` — the same source the CSC tab uses). Discipline mode buckets by MQ discipline. Group headers are colspan'd table rows with ▶/▼ twisty; click to toggle collapse. Empty buckets ("(No TOP category)" / "(No discipline)") sink to the bottom. `state.collapsedGroups` keyed by `mode:key` to avoid clashes across mode switches; resets on mode change for predictability. | **DONE 2026-05-25** (PR #123, Bruh Hept) |
| **Cred-Ref PR-4** | Edit-override curation on Credential Reference — `unified_title` rename, `issuing_agency` override, `training_agency` override, `quality_flag` toggle. Click any of the four fields to edit inline; save to Supabase via `_CREDENTIAL_REVIEW::<unified_title>` namespace with per-field column. Override-takes-precedence display rule. Auth-gated; same allowed-reviewers list. **Risk hot-spot**: any `unified_title` rename ripples into `kb/coci_articulations.json` (which inlines the field) — re-mint playbook discipline applies (alias map at write-time, daily-cron picks up via `kb/_apply_credential_review.py` sync script, atomic). | **DONE 2026-05-26** (Session 10, Sexy Dexy — overlay-only display-override ships; rename promotion = PR-5b) |
| **PR-Sidebar-A** | Replace top tab nav with a fixed left rail sidebar. CSS Grid layout (`grid-template-columns: 220px 1fr`). Each tab as a list item in the rail; sign-in status surfaces in the rail footer (read-only badge); URL-hash routing unchanged. Hamburger toggle at ≤900px (fixed slide-over). **Bundled `tabs.js` extraction**: derives `VALID_TABS` from rendered nav items, closes the 5-touch-points trap that caused PR #117/#118/Letters-Quickstart regression. Exposes `window.CPL_TABS.activate()` for other modules. | **DONE 2026-05-27** (PR #147, Bruh El) |
| **PR-Sidebar-B** | Per-tab section TOC + scroll-spy under the active rail item. Each pane declares its sections via `data-sections='[{slug,id,label},…]'`; tabs.js reads, renders nested `<ul>`, wires smooth-scroll + URL hash (`#tab/section`). IntersectionObserver highlights current section (rootMargin `-80px 0 -55% 0`). Dashboard sections: KPI Metrics, CPL Analytics, Workplan & Projects. Pipeline sections: Phase roadmap, M-ID lifecycle, Auditor receipt, Recent re-mint (added IDs to `.pl-section` divs). | **DONE 2026-05-27** (PR #148, Bruh El) |
| **Auto-merge-auth** | CLAUDE.md Branch Policy gets explicit auto-merge gates so Claude sessions can complete the merge step on PRs they opened: CI green, no unresolved reviews, squash-merge, delete branch, **confirm for architecturally significant PRs** (re-mints, schema migrations, Excel→Supabase phases, cross-repo state). Use `mcp__github__merge_pull_request` with `merge_method: "squash"`. Established via AskUserQuestion in Session 11. | **DONE 2026-05-27** (PR #149, Bruh El) |
| **Cred-Ref PR-5a** | Daily sync of `_CREDENTIAL_REVIEW::*` Supabase rows → `kb/credential_review_overlay.json` (git-canonical overlay; mirrors `_apply_curation.py`). Mode A scope: `issuing_agency_override`, `training_agency_override`, `quality_flag_override`, `reviewed_marker` folded in. `unified_title_override` recorded but NOT applied (Mode B / PR-5b territory — full re-mint playbook). Daily workflow step 3 + step 6 commit add it. Non-fatal sync; gracefully absent on first run. | **DONE 2026-05-27** (PR #150, Bruh El) |
| **KB-notes lane** | New `docs/kb-notes/` lane for distilled, durable, reusable knowledge with frontmatter-strict `kb-status: published|archived|internal` (the `candidate` middle state was retired Session 11). Three-lane doc model (KB notes / lessons / handoffs). `docs/INDEX.md` auto-maintained landing page. CLAUDE.md gets new "Obsidian vault wiring" section documenting the vault-side clone pattern at `CPLBrain\COG-second-brain\cpl-project-tracker\`. Checkpoint command upgraded to surface KB candidates in commit body. | **DONE 2026-05-27** (PR #151, Bruh El) |
| **Cred-Ref PR-5a follow-up** | Bake curator overrides into `credential_reference_data.js` with AI baselines preserved on `_original_<field>` siblings. Rewrites `applyOverlay()` to be **bake-aware**: case (a) live override wins + baseline from `_original_`; case (b) baked-then-cleared revert; case (c) no-op. Cleared overrides now revert immediately on reload, not stuck until next 10:17 UTC sync. Backwards-compat with the runtime-fetch path (no `_original_*` → falls through to original semantics). | **DONE 2026-05-27** (PR #152, Bruh El) |
| **CSC-G phase 2** | Exhibit-table per-column header alignment. `table_card()` accepts `(text, kind)` tuples (kind ∈ `num`/`pct`/`name`) alongside plain strings; emits matching `<th class="exhibit-th-{kind}">`. All 7 exhibit-analysis emissions updated. CSS rules in `EXHIBIT_ANALYSIS_CSS`. xlsx exporter strips tuples to plain strings at the export boundary. | **DONE 2026-05-27** (PR #153, Bruh El) |
| **Vault auto-sync** | `scripts/sync-vault-clones.ps1` + Windows Task Scheduler entry keep the in-vault clones of `cpl-project-tracker` + `cpl-knowledge-base` fresh on a scheduled fast-forward pull. Strictly safe: never auto-merges, skips uncommitted/diverged repos, logs to `.vault-sync.log`. Checkpoint commits flow into Sam's Obsidian without manual `git pull`. **Retired** the `kb-status: candidate` middle state — sessions now author KB notes at `published` quality directly (no review queue). | **DONE 2026-05-27** (PR #154, Bruh El) |
| **Sync-script ASCII hotfix** | PowerShell 5.1 reads `.ps1` files as Windows-1252 by default; my em dashes (U+2014) decoded as garbage and broke string parsing at the first log message. Replaced 11 em dashes with ASCII `--`. Lesson: Windows-PowerShell-targeted scripts must be pure-ASCII or carry a UTF-8 BOM. | **DONE 2026-05-27** (PR #155, Bruh El) |
| **Task Scheduler companion** | `scripts/setup-task-scheduler.ps1` — single-paste registration of the "CPL Vault Sync" task; idempotent, `-CadenceMinutes`/`-Remove` switches, elevation check. Playbook updated with Option A (script) + Option B (GUI). Documents the `[TimeSpan]::MaxValue` gotcha that bit Sam's first attempt at the inline registration block. | **DONE 2026-05-27** (PR #156, Bruh El) |
| **Auditor `merge_into_orphan`** | Eighth audit rule, first **curation-pointer** rule. Fires when a curation `merge_into` target can't be resolved to any known identity (M-ID ∪ singleton ∪ `UC-CUR-*`). New `_curation_orphan_tags()` helper runs symmetrically over M-ID + Cluster loops so future curation-edge rules (cycle detection, source↔target title drift) plug in without touching record-derived tag code. No per-field penalty — data-integrity signal, not field-quality evidence. Calibration: 0 flags on current data (all 3 live pointers cleanly target `UC-CUR-MPG029OM`); preventive infrastructure for the next re-mint. | **DONE 2026-05-27** (PR #157, Bruh Dec) |
| **Cred-Ref PR-5b/0** | Mode B prep — bakes `display_title` + `_original_display_title` siblings into `credential_reference_data.js` so `unified_title_override` works as a Mode-A *display* override (the `ut` field STAYS as the original since it's the overlay lookup key — only the display field changes; mirrors the bake-aware pattern PR-5a follow-up established for issuer/trainer/quality_flag, but with the override surfacing into a SEPARATE display field rather than overwriting the identity key). Adds `kb/_cred_rename_dryrun.py` — re-runnable, reads `kb/credential_review_overlay.json`, projects each override onto post-rename state, classifies as clean/collision/skipped, runs V1 (intra-batch) + V2 (source exists) + V3 (target collision-free) gates, writes `kb/cred_rename_dryrun/{report.md, alias_map.json, collisions.json}`. Daily workflow runs the dry-run as a report-only step (Step 4c, after the auditor; non-fatal). Zero source mutation. Calibration: 0 overrides in overlay today; infrastructure populates the moment a curator enters a rename. | **DONE 2026-05-27** (Bruh Dec) |
| **Cred-Ref PR-5b/1** | Mode B apply — two apply scripts (`_cred_rename_apply.py` re-keys `kb/credentials.json` + rewrites `kb/unified_titles.json` + `kb/coci_articulations.json` values; `_cred_rename_apply_supabase.py` DELETEs fulfilled `unified_title_override` rows + PATCHes other override rows' `course_id` to the new identity). Manual `workflow_dispatch` trigger at `.github/workflows/cred-rename-apply.yml`, shares `concurrency: daily-dashboard` lock. V1–V4 apply gates baked into the apply script (V1: dry-run apply_safe; V2: source exists; V3: target collision-free at apply time; V4: articulation cardinality preserved). Alias map committed at `kb/cred_rename_out/<date>/alias_map.json` (the canonical audit trail per the ADR). Collision policy: **reject + decision-queue** (no auto-merge, no auto-disambiguate). **Light workflow** — 5 steps, ~110 lines (vs Phase 1e's 7 steps + 200 lines); credential rename has no auditor cleanup-receipt invariants, so post-apply re-checks dropped. End-to-end synthetic-injection test confirms V4 + idempotency on real data. | **DONE 2026-05-27** (Bruh Dec) |
| **Cred-Ref PR-5b/2** | Collision-resolution UX in the Credential Reference tab — "Confirm merge" affordance when a rename target collides with an existing credential key. Deferred until a curator actually hits a collision (zero today). | deferred (zero demand) |
| **Excel→Supabase Phase 1** | Migrate Workplan Goals tab from `CPL_Initiative_Project_List_v3.xlsx` reads to Supabase `workplan_goals` table reads (proof-of-concept). `excel_to_dashboard.py` reads from Supabase via service-role key (already a secret per §6); inline editor on the tab with curator overlay (same pattern as the credential/CCR/CSC tabs). One-time data import from Excel → Supabase. Validates the architecture before the larger Dashboard / Budget / Vision 2030 migrations in Phases 2-4. **Scoped + decisions locked (Bruh Baker, 2026-05-28):** Supabase = source of truth, Excel abandoned. Activity-set = "A+" auto-derivation (every Project List row with a non-zero KPI cell, excluding `D.*`, no parent/child aggregation — `4.1` and `4.1.1`-`4.1.4` each render as their own row). Snapshot fallback at `kb/workplan_goals_snapshot.json` for graceful degradation on Supabase outage; subtle "as of YYYY-MM-DD" staleness signal in the tab header. 6-PR plan:<br>· **PR-1 #162 DONE** (2026-05-28) — validator (`kb/_validate_workplan_goals.py`) + Excel snapshot at `archive/CPL_Initiative_Project_List_v3_2026-05-28_pre-supabase-migration.xlsx` + initial drift report (`kb/workplan_goals_validation.md`). Surfaced three-way drift: Excel ≠ Supabase ≠ renderer `core_ids`. Latent renderer bug exposed: 4.1 sprint aggregation expecting `4.1a/b/c/d` but Excel has `4.1.1-4.1.4` → silently summing zero; cohort family (3.1.1/3.1.2/3.1.2a) + Activity 5 invisible.<br>· **PR-2 #163 DONE** (2026-05-28) — A+ derivation replaces `core_ids` projection. Dry-run seed planner (`kb/_seed_workplan_goals.py`) emits per-row INSERT/UPDATE/DELETE plan (`kb/workplan_goals_seed_plan.md`). 27 A+-derived activities (vs 19 hardcoded). Plan totals: 34 INSERTs + 20 UPDATEs + 0 NO-OPs + 0 DELETEs. Pre-seed Supabase snapshot at `archive/workplan_goals_supabase_2026-05-28_pre-seed.json` for forensics. Notable rename: `2.4` flips from Supabase's stale "AI-Ready California Demonstration" → Excel's current "Validated Skills" (AI-Ready moved to Excel's `5.1`).<br>· **PR-3 #164 DONE** (2026-05-28) — seed apply (`kb/_seed_workplan_goals_apply.py`) + `workflow_dispatch` workflow (`.github/workflows/workplan-goals-seed-apply.yml`). V1-V4 gates: V1 fresh Excel A+ derivation produces N>0 activities; V2 every UPDATE/DELETE matches ≥1 Supabase row (source-exists); V3 post-apply row count = `2 × |A+ activities|`; V4 validator re-runs clean. Per-row INSERT (POST) / UPDATE (PATCH) / DELETE behind PostgREST. End-to-end synthetic test passing (monkey-patched HTTP layer, 2 INSERT + 2 UPDATE + 2 DELETE round-trip green). Apply log + plan snapshot under `kb/workplan_goals_seed_out/<date>/`. **Sam dispatched the workflow mid-session — V4 green on first attempt** (54 matches / 0 mismatches / 0 missing / 0 orphans = exactly the plan's prediction).<br>· **PR-4 #166 DONE** (2026-05-28) — generator reads Supabase + snapshot fallback. New `kb/_load_workplan_goals.py` with `fetch → write snapshot → render` chain; on Supabase failure, falls back to `kb/workplan_goals_snapshot.json` and renders with the snapshot's `_fetched_at` date stamp. Subtle "Data as of YYYY-MM-DD" line under the section description. Both Supabase down AND snapshot missing → RuntimeError (no silent rendering of nothing). Daily workflow now passes `SUPABASE_SERVICE_KEY` into the pipeline + git-adds the snapshot. First daily run after merge rendered 27 activities cleanly (Sam confirmed "Dash update complete and clean!"). **Scope wrinkle held:** Excel `kpi_metric` (the "Current" column) stays Excel-sourced until Phase 2.<br>· **PR-6 #167 DONE** (2026-05-28) — dead-code retirement. Deleted `build_workplan_goals_from_projects` (148 lines, unreferenced after PR-4). Excel KPI ladder columns stay alive in `read_projects()` because three JS report consumers (`generate_reports.js`, `report_generator.js`, `college_report_generator.js`) still read them off `CPL_Data.js`; their migration is bundled with Phase 2 when project metadata moves.<br>· **PR-5 #168 DONE** (2026-05-28) — inline editor. ~300-line `workplan_goals.js` hydrates the Python-rendered tables with click-to-edit affordances. Per-cell edit on GOAL/STRETCH year values; magic-link auth via the shared `cpl_sb` session; optimistic save via PATCH to Supabase; dual-table mirroring (cell edit fans out to both the grouped section AND the comprehensive table via shared `data-aid`/`data-rt`/`data-yr-key` selectors). **Narrow scope per mid-session call:** edit-only on existing 27 rows; NO add-flow (deferred until Activity↔Project N-to-N data model is designed); NO Current-column editing (kpi_metric is Excel territory). Auth-banner UI states: editable (pointer cursor) / editing (input box) / saving (amber) / saved (green) / error (red rollback).<br>· **RLS tightening DONE** (2026-05-28, migration `workplan_goals_rls_tighten_to_allowed_reviewers`) — `workplan_goals` previously had `"Allow auth write"` with `qual=true` (any authenticated user could write). Dropped + replaced with per-command policies gating on `is_allowed_reviewer()`. Mirrors `kb_curation`'s policy shape. Public read unchanged. Today's `allowed_reviewers` = `map@rccd.edu`.<br>· **Phase 1 functionally complete at the dashboard-tab level.** The deferred work (Activity↔Project N-to-N model + add-flow + page UX) is scoped in `docs/excel_to_supabase_lessons.md` Session 13 end-state section as 4 PRs (PR-A schema migration + PR-B generator/renderer + PR-C editor/add-flow + optional PR-D separate-page). | **Phase 1 DONE** (2026-05-28); Activity↔Project model + Phase 2-4 queued |
| **Activity↔Project PR-A** | Schema migration adding the Activity vs. Project distinction to `workplan_goals` + an N-to-N association table. `kind` column (CHECK in `{'activity','project'}`, default `'project'`); 5 `kind='activity'` rows pre-seeded for Activities 1-5 (curator-editable ladder, initially zeroed — Sam's call: uniform shape with project rows). New `workplan_activity_associations(project_id, activity_id)` with public-read / allowed-reviewer-write RLS mirroring `workplan_goals`. **No DB-level FK** (workplan_goals.activity_id is non-unique because of the dual GOAL/STRETCH row shape; cleaner FK would have required collapsing that shape — application-enforced check via the validator instead, mirroring how `kb_curation` handles loose pointers). Backfill from project_id leading digit produced 27 1-to-1 associations (Activity 1 → 4 projects, 2 → 4, 3 → 9, 4 → 9, 5 → 1). Code ripples: loader exposes new `load_workplan_goals_full()` returning `(rows, assocs, fetched, source)`; legacy `load_workplan_goals()` stays backwards-compat. Validator's `reshape_supabase()` scopes to `kind='project'` for the Excel-A+ diff + new `validate_associations()` catches orphan-activity / orphan-project / projects-without-assoc. Apply script's PATCH/DELETE scoped to `kind=eq.project` so Activity rows can never be touched by the Excel seed loop; V3 cardinality check counts `kind='project'` rows. Generator's `build_workplan_goals_from_supabase()` filters `kind='activity'` rows out so existing renderer is unchanged. V1-V4 gates green inline (apply via `apply_migration` MCP — no `workflow_dispatch` since one-shot DDL + a single backfill INSERT fit one transaction, unlike Phase 1 PR-3's 54 per-row PostgREST operations). Pre-migration snapshot at `archive/workplan_goals_2026-05-28_pre-pr-a.json`. **Unblocks PR-B** (first-class Activities rendering + "Contributes to: Activity N" project chips). | **DONE 2026-05-28** (Session 14, Bruh Sonnet) |
| **Activity↔Project PR-B** | Generator + renderer update for first-class Activities. `build_workplan_goals_from_supabase(rows, associations, projects, …)` now returns `(activities, workplan_goals, annual_goals)`; per-project `activity_ids: ["N"]` sourced from the associations table (fallback: project_id leading digit). Renderer (`render_workplan_goals_html`) gains an `activities` parameter and emits a dedicated **Activities — Top-Level Aggregate Targets** table above the existing per-Activity project tables; ladders show even when zero (curator-editable). Group header labels source from Supabase Activity names (hardcoded `activity_labels` dict survives as defensive fallback when a row is missing). Every project row carries a "Contributes to: Activity N" chip below its name (always rendered — future-proof for N-to-N data, even though today's data is 1-to-1). Editable cells gain optional `data-kind="activity"`/`"project"` and `workplan_goals.js`'s `saveCell()` includes `kind=eq.{kind}` in the PATCH query when present; optimistic-paint selectors also scope by `data-kind`. Backwards-compatible (pre-PR-B cells fall through; activity ids `"1"`-`"5"` and project ids `"1.1"`-… are disjoint, so the unscoped PATCH is still safe). Smoke-tested from snapshot: 5 activities + 27 projects + 27 chips + 60 `data-kind=activity` attrs + 324 `data-kind=project` attrs; HTML tag balance clean. **Open follow-up**: `build_activity_kpis()` has its own hardcoded `activity_labels` dict (missing Activity 5) feeding the Workplan Activity Metrics KPI cards — out of PR-B scope (different section). | **DONE 2026-05-28** (Session 14, Bruh Sonnet) |
| **Activity↔Project PR-C** | Editor add-flow modal. New "+ Add new row" button in the auth widget (signed-in curators only) opens a single modal with: Activity/Project radio (Project default); ID input (strict validation — Activities = single digit, Projects = `N.x` where N is an existing Activity ID; collision check against current page state via `data-aid` query); Name input; for Projects, a checkbox row of existing Activities (multi-select for N-to-N — at least one required); GOAL + STRETCH ladder fields (5 inputs each, default 0). On submit: POST batch `[GOAL, STRETCH]` rows to `workplan_goals` with `kind` set + total computed; for Projects, POST associations to `workplan_activity_associations`; page reloads on success to render the new row. Validation errors surface inline in the modal (e.g. "Project ID '3.7' already exists"). Esc / overlay click / Cancel all close. Scope locked at Sam's call: add-flow only. Edit-name / edit-associations / delete-row deferred (no curator demand signal yet; can be a small follow-up if asked). | **DONE 2026-05-28** (Session 14, Bruh Sonnet) |
| **Activity↔Project PR-D** | (Optional) split Workplan Goals into its own top-level tab if the page gets dense (Sam's prior preference: one page with two sections). | parked unless curator usage signals demand |
| **Activity-KPI cards label cleanup** | Small followup to PR-B: `build_activity_kpis()` had its own hardcoded `activity_labels` dict missing Activity 5. New optional `activities` parameter sources labels from the Supabase Activity rows (same pattern as `render_workplan_goals_html`); hardcoded fallback retained + now covers Activity 5. `main()` reorders the workplan-goals load so `activities` is available before `build_activity_kpis()`. Closes the LABEL half of PR-B's open follow-up. The related `core_ids` drift bug it flagged (missing `5.1`; `4.1a-d` vs `4.1.1-4.1.4`) was **FIXED Session 15** (Bruh Parallax, PR #180 — see the core_ids auto-derive row below). | **DONE 2026-05-28** (PR #173, Session 14, Bruh Sonnet) |
| **Activity↔Project bug-hunt fixes** | Post-merge code review over PR-A/B/C surfaced three small issues, all fixed: (1) **XSS hygiene** — Supabase-sourced names flow into rendered HTML in 6 places (chip `title=""` attribute, Activity + Project name cell bodies, group header labels) without escape. Realistic threat low (only `is_allowed_reviewer()` users write; today = `map@rccd.edu` self-attack), but cheap hygiene. Now uses `from html import escape as html_escape` to dodge name-shadow against renderers' local `html` variables. Smoke-tested with `<script>` + `"><img onerror=…` payloads — both render harmless. (2) **Esc-listener leak** in the PR-C add-flow modal — Cancel/overlay-click left the listener attached; each subsequent open stacked another. Fixed by storing `_activeEscListener` on the module scope + detaching in `closeAddModal()`. (3) **`syncKindUI` robustness** — was reading via `querySelector('input[name="wpg-kind"]:checked').value` (can throw if no radio is briefly `:checked`); now mirrors `validateAdd`'s ternary read from the bound refs. Bug-hunt findings #3/#5/#6/#7/#8/#9 reviewed + dismissed (intentional behavior, race resolves correctly, future risk only). | **DONE 2026-05-28** (PR #174, Session 14, Bruh Sonnet) |
| **Excel→Supabase Phase 2 scoping doc** | KB note at `docs/kb-notes/phase-2-projects-migration-scope.md` (registered in `docs/INDEX.md` under the playbook lane). Covers: why projects is the right Phase 2 entry point (empty Supabase table → smallest possible PR-3 blast radius; biggest downstream unlock via 3 JS report consumers); full Excel→Supabase column mapping (8 renames + 3 type changes + 2 drops + 10 ladder cols handled out-of-band); KPI ladder contract-preservation strategy (join `workplan_goals` `kind='project'` into `CPL_Data.js` builder so JS consumers see no contract change); 5-step PR plan modeled on Phase 1 (PR-1 validator → PR-2 dry-run → PR-3 apply + workflow_dispatch → PR-4 generator switch + snapshot fallback → PR-5 inline editor → PR-6 retire `read_projects()`); **6 forks Sam must lock before PR-1 ships** (date parser strictness, budget type, status enum vs free-form, override/excel_row drop confirmation, JS contract on `kpi_target_*`, RLS shape). Cost estimate: ~6-7 PRs, one focused session. No code cut from this PR — it's the contract for Sam to review before any Phase 2 PR ships under it. | **DONE 2026-05-28** (PR #175, Session 14, Bruh Sonnet) |
| **Excel→Supabase Phase 2-4** | Migrate remaining Excel-driven tabs (Dashboard project cards, Budget, Vision 2030, Personnel). Per-tab inline editors. Excel file retires once Phase 4 cuts over; periodic Supabase→xlsx export retained as backup. **Phase 2 (projects) is COMPLETE: seeded + cut over + editor all landed (Session 15 build → Session 16 seed/cutover/editor).** Phases 3-5 (Budget/Vision/Personnel) follow the same five-step shape + the RLS-tighten step; Personnel already has 26 rows so its PR-3 has UPDATEs. | **Phase 2 DONE** (Session 16); **Phase 3 Budget read-path cutover DONE** (PR #189, Session 17 — fixed live $0→$89M); Budget inline editor + Phases 4-5 queued |
| **Vault-sync repoint** | `scripts/sync-vault-clones.ps1` `$vaultRoot` pointed at `Documents\Claude\Projects\CPLBrain\COG-second-brain`, but Sam's Obsidian reads `Documents\GitHub\COG-second-brain` — the 18 logged pulls succeeded yet landed where Obsidian wasn't looking, so KB notes never appeared. Repointed `$vaultRoot` + playbook cutover steps (clone into new root, re-run `setup-task-scheduler.ps1`, archive orphan clones). `setup-task-scheduler.ps1` needed no change (resolves the sync script via `$PSScriptRoot`). | **DONE 2026-05-28** (PR #178, Session 15, Bruh Parallax) |
| **core_ids auto-derive** | `build_activity_kpis()` drove its KPI cards off a hardcoded `core_ids` (no `5.x` → Activity 5 never rendered) + `sprint_ids=['4.1a'..'4.1d']` (don't exist → the 4.1 sprint composite never built, fell back to the raw row). Replaced both with `derive_core_activity_ids(projects)` (A+ rule: non-zero-KPI, excl `D.*` + the real `4.1.1-4.1.4` sprint children that fold into 4.1) + module-level `SPRINT_IDS`; fixed the stale `4.1a→4.1.1` in `pid_to_kpi_key`. Verified vs live Excel: Activity 5 renders (5.1); 4.1 composite counts 4 sprints; Activity 3 6→9 cards. Labels already Supabase-sourced (PR #173) — untouched. | **DONE 2026-05-28** (PR #180, Session 15, Bruh Parallax) |
| **Excel→Supabase Phase 2 PR-1** | Projects-table validator (`kb/_validate_projects.py`) + pre-seed snapshots, mirroring Phase 1. Reuses `read_projects()` for exact dashboard parity; maps to the 21 comparable Supabase cols (8 renames + pct→numeric + 3 str→date); drops `override`/`excel_row`; 10 KPI-ladder cols handled out-of-band; lenient date parse (fork #1 — 3 `"Ongoing"` end_dates → NULL). **Measure-first caught a scope-doc assumption:** the projects-table unit is **all 34 real projects** (every grid card), NOT the workplan_goals A+ non-zero-KPI subset (27) — Sam: "keep the zero-KPI cards." Initial diff: 34 missing / 0 / 0 (empty table). | **DONE 2026-05-28** (PR #179, Session 15, Bruh Parallax) |
| **Excel→Supabase Phase 2 PR-2** | Dry-run seed planner (`kb/_seed_projects.py` → `kb/projects_seed_plan.md`), importing the PR-1 validator (DRY). Plan vs the empty table: **34 INSERT / 0 UPDATE / 0 NO-OP / 0 DELETE**. Read-only pre-write review artifact. | **DONE 2026-05-28** (PR #181, Session 15, Bruh Parallax) |
| **Excel→Supabase Phase 2 PR-3** | Apply artifacts + the live RLS tighten. `kb/_seed_projects_apply.py` (per-row PostgREST behind V1-V4 gates; single-row-per-id, so V3 = `len(Excel)` not `2×`) + `kb/supabase_projects_rls_tighten.sql` + `.github/workflows/projects-seed-apply.yml` (`workflow_dispatch`, concurrency `daily-dashboard`). Synthetic-tested vs an in-memory fake Supabase (empty→34 INSERT; idempotent re-run; drift+orphan = 1 UPDATE+1 DELETE+33 INSERT), all V1-V4 green. **RLS migration applied LIVE via MCP** (`projects_rls_tighten_to_allowed_reviewers`: dropped loose `Allow auth write`, added `is_allowed_reviewer()`-gated INSERT/UPDATE/DELETE, kept public SELECT; verified). **Seed DISPATCHED + landed 2026-05-29** (Session 16): Sam ran the workflow → 34 rows, V1-V4 green on first attempt, receipts at `kb/projects_seed_out/2026-05-29/` (commit `472f798`). | **DONE 2026-05-28** (PR #182 + live RLS, Session 15); **seed landed 2026-05-29** (Session 16) |
| **Excel→Supabase Phase 2 PR-4** | **Generator cutover** — the 34 real projects now load from Supabase (`kb/_load_projects.py` + `build_projects_from_supabase()` + `load_projects()` in `excel_to_dashboard.py`); three-tier resilience **Supabase → `kb/projects_snapshot.json` → Excel `read_projects()`**; subtle "Project data as of YYYY-MM-DD" stamp on the grid. **Parity-proven** by `kb/_test_projects_parity.py` (34 projects byte-identical to `read_projects()` modulo 3 invisible `"Ongoing"`→NULL end-dates [start/end render nowhere] + 8 HTML-invisible whitespace trims). **3 scope-doc gaps caught + handled, all behavior-preserving:** (1) `read_projects()` returns **49 rows** (34 grid cards + 15 `D.*` KPI-helpers; `D.1/2/3` feed the cohort composites) → `D.*` stays Excel-sourced; (2) `excel_row` (Excel-web deep-links) kept Excel-sourced (scope doc said drop); (3) the **KPI ladder stays Excel-sourced** — workplan_goals conflates blank-vs-literal-0 so it can't losslessly reconstruct (1.4 has a real `0`), AND the Excel ladder cols aren't retired in Phase 2 anyway. `override` verified all-None → drop is a true no-op. Daily workflow git-adds the snapshot. | **DONE 2026-05-29** (PR #184, Session 16, Bruh Word) |
| **Excel→Supabase Phase 2 PR-5** | **Projects inline editor** — all 17 fields click-to-edit on the project cards (`projects_editor.js`, mirrors `workplan_goals.js`: shared `cpl_sb` magic-link auth, `PATCH projects?id=eq.{pid}` single-PK no kind-filter, 12 inline inputs + 5 modal textareas, optimistic paint + rollback, `data-status`/`data-lead`/`data-goal` filter-sync, progress-bar repaint). 7 previously-hidden fields (Team/CPL-Goal/Timeline/KPI/Milestones) now render on **public** cards (Sam's "show on public cards" call — richer dashboard; empty fields render a neutral `—`). RLS already gates writes (PR-3). **Built by a worktree sub-agent, then reviewed + hardened:** the review's hostile-input smoke test caught a `data-folder` XSS sink the agent missed (project `name` is now curator-editable) → escaped ALL curator-editable render sites + both `data-folder` sinks (project + activity-KPI cards) + switched JS optimistic paint to `textContent` (mirrors PR #174). Editor `proj-*` CSS lands on the next daily regen. | **DONE 2026-05-29** (PR #186, Session 16, Bruh Word) |
| **Excel→Supabase Phase 2 PR-6** | "Retire `read_projects()`" — **moot / superseded.** `read_projects()` stays load-bearing: it supplies the `D.*` KPI-helper rows, the KPI ladder, `excel_row`, and the ultimate Excel fallback inside `load_projects()`. It retires only when the Excel ladder cols + `D.*` helpers themselves migrate (Phase 3+, bundled with the JS-consumer migration). | **N/A — superseded** (Session 16, Bruh Word) |
| **Gitignore agent worktrees** | Added `.claude/worktrees/` (harness-created transient worktrees for background agents, `isolation: worktree`) to `.gitignore` so they never show as untracked or get committed. Surfaced when a stop-hook flagged the running PR-5 build agent's worktree dir. | **DONE 2026-05-29** (PR #185, Session 16, Bruh Word) |
| **Excel→Supabase Phase 3 PR-1 (Budget cutover)** | Budget tab cut over Excel→Supabase `budget_expenditures` — fixes a **live $0 bug** (the deployed dashboard rendered the budget as $0; the Supabase read restores the real **~$89M** plan). `kb/_load_budget.py` + `build_budget_from_supabase()` + snapshot fallback + "Data as of YYYY-MM-DD" stamp, mirroring the Phase 2 cutover shape. **Compressed vs Phase 2** because `budget_expenditures` already held rows → a direct read-path cutover, not the full seed dance. Budget inline editor (PR-5-equivalent) still queued. | **DONE 2026-05-29** (PR #189, Session 17, Qualitastic) |
| **Activity↔Project association editor (#190)** | The "Contributes to: Activity N" chip line in the Workplan Goals tab became **click-to-edit** (popover: 5 Activity checkboxes + a primary radio; Supabase CRUD on `workplan_activity_associations`). Added the **`is_primary`** column (migration applied via MCP `apply_migration` — §8 source-of-truth schema, Sam pre-authorized in the same AskUserQuestion as the merge). Also folded in a **CSS-accumulation fix** (the editor's `.wpg-assoc-*` block was accreting across regens → restores the Rule-2 idempotency guard). | **DONE 2026-05-29** (PR #190, Session 17, Qualitastic) |
| **Activity↔Project orphan close-out** | 7 Activity-5 projects (`5.2`–`5.8`) had **no `workplan_goals` ladder row** → never backfilled into `workplan_activity_associations` → orphaned in the N-to-N model (and unreachable by the #190 editor, which attaches to rendered workplan rows). Linked all 7 (product-owner-confirmed leads via AskUserQuestion: `5.2→A1`, `5.3→A1 primary +A4`, `5.4→A4`, `5.5→A5`, `5.6→A4`, `5.7→A3`, `5.8→A4`) + default-primary-backfilled the 27 pre-existing 1-to-1 associations. Verification: **35 associations · 34/34 projects exactly one primary · 0 orphans**. Audit trail: `docs/activity_association_orphan_plan.md` (marked APPLIED). Supabase data ops (execute_sql), no code. | **DONE 2026-05-29** (Session 17, Qualitastic) |
| **Assoc editor on all 34 Dashboard cards (#191)** | The 7 orphans don't render in the Workplan Goals tab, so the #190 editor couldn't reach them. Extracted the popover into a **shared `assoc_editor.js`** module (ONE delegated `document` click listener, `_hasListener`-guarded) and wired it onto **all 34 project cards** in the Dashboard Projects Grid — card assoc data sourced from the **associations table joined to the full projects list** (covers 5.2–5.8, which aren't in `workplan_goals`). `workplan_goals.js` refactored to delegate (**−441 lines**, no duplicate popover; the "two popovers open at once" trap avoided). Reuses `.wpg-assoc-*` CSS; graceful on Supabase outage (backfilled chips). Sub-agent-built, **hard-reviewed** (both surfaces + hostile-input + 3× idempotency + Rule 4). | **DONE 2026-05-29** (PR #191, Session 17, Qualitastic) |
| **akpi / CPL_DATA XSS hardening (#192)** | Closed a **pre-existing stored-XSS sink** surfaced (and confirmed via injection) during the #191 review: Activity-KPI cards rendered curator-editable project/activity/goal names **unescaped**, and the inline `window.CPL_DATA` `<script>` blob could **break out via a name containing `</script>`**. Fix: `html_escape(quote=True)` on the akpi HTML sites + new **`_js_safe_json()`** (neutralizes `<`/`>`/`&`/U+2028/9 → `\uXXXX` in the JSON; `JSON.parse` decodes back → client data byte-identical) on both `window.CPL_DATA` emissions. Hostile-input injection: raw leaks **3+2 → 0**. Generator-only diff (Rule 1). Third confirming instance of `methodology-xss-audit-on-curator-editable-fields` — adds the **inline-JSON-in-`<script>`** injection class. | **DONE 2026-05-29** (PR #192, Session 17, Qualitastic) |
| 2 | Articulations by Unified Course — interactive view + curation | parked |
| 3 | EACR interactive re-pivot to course-identity grouping (Approach B per §9) | **DONE 2026-05-26** (Session 8, Octaman — see Exhibit-canon PR-C0/C0b/C1/C2/C2-hotfix rows above) |
| 4 | SLO ingestion + the rest of the MC slot fields | parked (unlocks MC-readiness scoring) |
| 5 | CTE classifier (TOP code → COCI CTE field) | parked (unlocks CIDx lane) |
| 6 | CIDx submission automation (the eventual goal) | parked (the destination) |
| 7 | M-ID → CID substitution workflow on approval | parked (governed by Rule 7 once re-locked at faculty publication) |

The auditor is the foundational instrument for the whole pipeline: every phase
upstream of CIDx submission produces a higher trust score and graduates rows
from one readiness tier to the next.

---

## Troubleshooting

### Dashboard not updating
1. Check the GitHub Actions run — Actions tab in GitHub
2. Check `live_metrics.json` → `scraped_at` timestamp
3. Check if commit was pushed (`git log origin/main -5`)
4. If browser shows stale content, hard-refresh (Ctrl/Cmd+Shift+R)

### Scrape returning errors
1. Test: `https://cpl-proxy.slee-548.workers.dev/scrape?secret=CPL_SCRAPE_2026`
2. `Invalid or missing secret` → check `SCRAPE_SECRET` in Cloudflare dashboard
3. `CPL API returned 502` → CCCCO Dashboard may be down
4. `ALL COLLEGES row not found` → API response structure may have changed

### KPI values stale but date updated
- Pipeline updates the "Updated" date but only refreshes KPIs if
  `live_metrics.json` has newer data
- Check `live_metrics.json` → `scraped_at`
- If old, the scrape step failed — test the worker endpoint directly

### "Duplicate sections" / HTML growing on every run
- You've likely removed or broken the idempotency guard in
  `excel_to_dashboard.py`. Verify the block around the
  `EXHIBIT_CSS_MARKER` check still strips existing copies before re-injecting.

### `kpi_history.json` 1d delta shows stale comparison
- Check for date gaps in the JSON. If yesterday is missing, backfill with
  `"_interpolated": true`.

### docx library errors
- Local `docx.min.js` is v8.0.4 UMD, 334KB. CDN versions were unreliable — do
  **not** switch back to CDN. To refresh the local copy:
  `npm pack docx@8.0.4`, extract, copy `umd/docx.min.js`.
