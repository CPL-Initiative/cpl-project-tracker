# CPL Project Tracker

A live dashboard, data pipeline, and curation workbench for the
**California Community Colleges Credit for Prior Learning Initiative** —
tracking statewide CPL adoption, articulation, and project work across all
116 California Community Colleges (CCC).

**Live site:** <https://cpl-initiative.github.io/cpl-project-tracker/>

The dashboard combines (a) project-management data for the CPL Initiative
itself (workplan, budget, personnel, deliverables) with (b) live statewide
CPL metrics scraped daily from the CCCCO MAP CPL Dashboard, plus (c) a
synthetic knowledge-base layer that unifies course identities and CPL
exhibits (credentials) across colleges so adoption can propagate from one
college's articulation decision to the rest of the system.

---

## What this project covers

The whole ecosystem, end-to-end:

1. **The public dashboard** (GitHub Pages) — KPI cards, project cards, CPL
   Analytics, plus a dedicated **Exhibit Adoption & Credit Recommendations**
   tab (moved out of CPL Analytics into its own top-level tab 2026-05-30)
   that groups cards by unified credential identity: each card shows the
   canonical title in bold + issuing-agency subtitle, a confidence /
   quality-flag badge when the underlying classification is shaky, and an
   "Also entered as N variants" disclosure that exposes every raw MAP title
   folded into the card (28% collapse vs raw IDs as of 2026-05-26),
   Workplan Activities & Projects, Annual Goals, Budget, Vision 2030, a
   per-college **Common Course Reference** curation tab, a **Common Subjects
   Reference** tab (faculty-facing per-discipline curation with validate workflow
   + TOP/CTE/CIP columns + collapsible category groupings; Variants column
   shows the raw local college subject codes colleges actually use, sourced
   from `kb/coci_minted_memberships.json`), a **Common Exhibit Reference** tab
   (sister to CCR, with edit-override curation landed in Cred-Ref PR-4), a
   **quick-start natural-language chat** widget on the first screen (Claude
   API classifies your prompt to one of the 11 tabs **and** can pre-pop the
   destination tab's filters — "review unclassified credentials" lands you
   in Common Exhibit Reference with the unclassified-in-MAP queue already
   filtered; "apprenticeship initiative" pre-fills the Dashboard search;
   "subjects needing review" lands in Common Subjects Reference filtered to
   needs-review), a **Letters** tab embedding the budget-support letter
   curator (iframe to `budget-support/web/curator.html`, passcode-gated),
   a **CPL Assistant** tab (a conversational RAG chatbot — ask CPL questions
   and get streamed answers drawn from the knowledge base, live dashboard
   metrics, and 2,300+ statewide exhibits; it talks to the shared `cpl-chat`
   Supabase Edge Function that also powers the live map.rccd.edu widget),
   and a **Pipeline** progress board.
2. **The data pipeline** — daily GitHub Actions cron pulls fresh statewide
   metrics from the CCCCO MAP CPL Dashboard via a Cloudflare Worker proxy,
   then `excel_to_dashboard.py` regenerates the dashboard HTML, exports the
   client-side data files, builds Word reports, and pushes back to `main`
   so GitHub Pages re-publishes.
3. **The knowledge base** (`kb/`) — synthetic identity layers above the raw
   MAP exhibit + course data: unified credential titles (so "First Aid /
   AHA / American Heart Assoc. First Aid" all collapse to one card),
   unified course identities using a CCN-aligned surrogate scheme
   (CCN-ID > C-ID > M-ID), with a Phase B fold that consolidates M-IDs
   under official C-ID/CCN anchors when the underlying members agree.
4. **The Common Course Reference curation tab** (formerly "Unified Courses" —
   renamed to avoid UC/University-of-California confusion and to signal that
   the tab is a *reference faculty consult*, not an authority replacing them) —
   authenticated reviewers (Supabase
   magic-link auth) curate disciplines, merge variants, and verify
   inferred values. Edits write to a live Supabase table and overlay the
   git-tracked KB.
5. **The row Trust-Card auditor** (`kb/_row_audit.py`) — produces a per-row
   Trust Card for every M-ID + Cluster with a `faculty_trust_score` (the
   bar for cross-college articulation adoption) and an `mc_ready_score`
   (the destination — Model Curriculum readiness for ASCCC C-ID
   submission). 11 active rules cross-validate discipline assignments
   against title, TOP code, description, and member aggregation. The
   UCL surfaces findings as a "⚠ N · 0.XX" chip color-graded by severity,
   with a `Triage:` filter to carve the cleanup queue (8 modes including
   "3+ findings" for the high-confidence misassignment subset). Full
   decisions + lessons: [`docs/unified_courses_audit_lessons.md`](docs/unified_courses_audit_lessons.md).
   See `CLAUDE.md §11` for the M-ID → CIDx pipeline framing.
6. **Custom Word reports** — a per-college "[College Name] CPL Update"
   .docx generated on demand via a Claude API proxy (also a Cloudflare
   Worker endpoint), suitable for board / trustee distribution.

---

## Architecture

```
                CCCCO MAP CPL Dashboard (Azure)
                            │
                            ▼  REST /api/potential-savings
            Cloudflare Worker  (cpl-proxy.slee-548.workers.dev)
                            │
                            ▼  GET /scrape?secret=…
                    live_metrics.json
                            │
   CPL_Initiative_Project_List_v3.xlsx ──┐
   kb/ (knowledge base, curation)        │
                                         ▼
                  excel_to_dashboard.py  (Python pipeline)
                            │
       ┌────────────────────┼─────────────────────┬────────────────┐
       ▼                    ▼                     ▼                ▼
  CPL_Dashboard.html   CPL_Data.js / etc.   kpi_history.json    reports/*.docx
       │
       ▼  cp → index.html, commit, push
        GitHub Pages  (cpl-initiative.github.io/cpl-project-tracker/)


Supabase (hvuwhnbuahrtptokpqfh.supabase.co)
    ├── workplan_goals, projects   ← READ BY the pipeline (source of truth as of the
    │      Excel→Supabase migration; daily snapshot + Excel fallback);
    │      inline-editable on their tabs by allowed reviewers
    ├── budget_funding, budget_expenditures, personnel  ← also Supabase-read (Budget
    │      cutover, PR #189); inline-editable. Dashboard config (title/desc/KPI
    │      params) moved to committed kb/dashboard_config.json (Excel-retirement P2).
    │      The master .xlsx is no longer WRITTEN on any run; a few readers remain.
    └── kb_curation, allowed_reviewers   (UCL curation overlay)

Cloudflare Worker (cpl-proxy.slee-548.workers.dev)
    ├── GET  /scrape    → CCCCO MAP API → live_metrics.json
    └── POST /          → Anthropic API → Custom Report Generator
```

The worker calls the CCCCO Dashboard's REST API directly — no browser
automation. That was a deliberate decision after Chrome-based scraping
proved unreliable.

---

## Daily pipeline

`.github/workflows/daily-dashboard.yml` runs on cron `17 10 * * *`
(≈10:17 UTC / 2:17 AM PT) and on manual dispatch. Steps:

1. Checkout `main`.
2. Fetch the CustomReport JSON (`fetch_custom_report.py`).
3. Scrape live metrics via the Cloudflare Worker (6 KPIs + tier breakdown).
4. Sync the curation overlay from Supabase (`kb/_apply_curation.py`) so the
   morning's reviewer edits land in `kb/coci_curation.json`.
5. Run `excel_to_dashboard.py` — regenerates the dashboard HTML in place,
   exports the client-side JS data files, builds Word reports, snapshots
   today's KPIs into `kpi_history.json`.
6. `cp CPL_Dashboard.html index.html` (Pages serves `index.html`).
7. Commit + push to `main` with a rebase-retry loop for concurrent pushes.

The commit always includes the regenerated dashboard, the Unified Courses
data files, and `exports/unified_courses.xlsx`, so curation + the daily
data refresh are captured atomically.

---

## Repo orientation

```
.
├── CLAUDE.md                          ← project memory, rules, roadmap (read first)
├── README.md                          ← this file
├── excel_to_dashboard.py              ← main pipeline (reads Excel + live_metrics, generates HTML/JS/docx)
├── CPL_Dashboard.html                 ← generated dashboard (mirror of index.html)
├── index.html                         ← served by GitHub Pages
├── CPL_Data.js / statewide_data.js    ← client-side data for filters/search
├── unified_courses*.js                ← Unified Courses tab data + lazy files
├── dashboard_filters.js               ← client-side filter/search/sort
├── report_generator.js                ← Custom Report (Claude API via proxy)
├── college_report_generator.js        ← per-college .docx generator
├── docx.min.js                        ← local docx@8.0.4 UMD build (do NOT switch to CDN)
├── cloudflare-worker-proxy.js         ← dual-purpose worker (scrape + Anthropic proxy)
├── live_metrics.json                  ← latest scrape
├── kpi_history.json                   ← daily KPI snapshots (must have no date gaps)
├── CPL_Initiative_Project_List_v3.xlsx ← master project data
├── reports/                           ← generated Word reports
├── exports/                           ← per-table .xlsx exports + unified_courses.xlsx
├── kb/                                ← knowledge base + curation + auditor
│   ├── README.md                      ← KB schemas + identity precedence + status
│   ├── _row_audit.py                  ← row Trust-Card auditor (see CLAUDE.md §11)
│   ├── _apply_curation.py             ← Supabase kb_curation → coci_curation.json sync
│   ├── _infer_disciplines*.py         ← re-runnable discipline inference passes
│   ├── coci_minted_*.json             ← minted M-ID identities + memberships + singletons
│   ├── coci_unified_courses.json      ← variant-unified clusters
│   ├── coci_articulations.json        ← earned articulations resolved to identity + credential
│   ├── coci_curation.json             ← human curation overlay (regen-safe)
│   ├── promotions.json                ← Phase A/B official-id consolidation manifest
│   ├── reference/                     ← read-only authorities (C-ID, CCN, MQ disciplines, COCI list)
│   ├── remint_out/                    ← re-mint dry-run artifacts + alias_map.json
│   └── row_audit/                     ← per-day Trust Card artifacts (latest.json + <date>.md)
├── docs/                              ← decision docs + lessons-learned (synced to Obsidian)
│   ├── coursecontrolnumber_remint.md  ← the 2026-05-22 M-ID re-mint playbook
│   ├── exhibit_unification_vision.md  ← credential-layer canonicalization design
│   └── reference/                     ← C-ID / CCN / TMC reference PDFs from ASCCC
└── .github/workflows/                 ← GitHub Actions (daily-dashboard.yml)
```

---

## Local development

The full pipeline is Python + a few static assets — no build step.

```bash
# Regenerate the dashboard locally
python3 excel_to_dashboard.py

# Re-run the row Trust-Card auditor (read-only)
python3 kb/_row_audit.py

# Re-run a discipline inference pass (idempotent — only fills blanks)
python3 kb/_infer_disciplines.py
python3 kb/_infer_disciplines_from_desc.py
python3 kb/_infer_disciplines_from_top.py
```

`excel_to_dashboard.py` streams the 24 MB `kb/reference/coci_course_list.xlsx`
with openpyxl read-only — never `cat` it.

---

## Where to read more

- **`CLAUDE.md`** — project memory, critical rules, full pipeline reference,
  knowledge-base build status, M-ID lifecycle + MC vs TMC framing,
  roadmap, troubleshooting.
- **`kb/README.md`** — KB schemas, course-identifier precedence
  (CCN-ID > C-ID > M-ID), curation workflow, generator inventory.
- **`docs/coursecontrolnumber_remint.md`** — the playbook for safely
  re-keying shared-system identifiers (used for the 2026-05-22 re-mint;
  any future identifier re-key should follow the same pattern).
- **`docs/subj4_canonicalization_remint_lessons.md`** — Phase 1e decisions +
  lessons (the second re-mint, first under the revised Rule 7 staging
  framing; **complete 2026-05-23** — 65k aliases applied, cleanup receipt
  zero).
- **`docs/common_subject_code_tab_lessons.md`** — Common Subject Code tab
  evolution (the four-PR series A → D, 2026-05-23). UX patterns, validate
  workflow design, TOP/CTE/CIP column rationale, render-refactor lessons.
- **`docs/exhibit_unification_vision.md`** — the credential-layer
  canonicalization design (synthetic unified-title layer over MAP's freehand
  exhibit titles).

---

## Contributing

- Feature branches; open a PR to `main`. Claude Code sessions use
  `claude/<short-description>` branches automatically.
- The daily GitHub Actions cron pushes to `main` — coordinate around the
  10:17 UTC window for any shared-system change (Supabase, alias maps).
- Never force-push `main` (GitHub Pages serves from it).
- **Every PR runs three security scans** (added 2026-05-23): Dependabot
  (pip + github-actions, weekly bumps), CodeQL (Python + JavaScript SAST,
  every push + PR + weekly), and TruffleHog (secret detection with
  live-verification). Findings show up under **Security → Code scanning
  alerts**. Dependabot opens PRs you can merge after CI greens.
- M-IDs are in **staging-cleanup phase** (per CLAUDE.md Rule 7, revised
  2026-05-23). Re-mints are permitted in service of cleanup but must follow
  [`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md)
  — dry-run + alias map + Supabase fresh-read + atomic land + cron-window.
  Once the M-ID layer is faculty-published, Rule 7 re-locks to "stable
  identifiers, no renumbering."

---

## License

This project tracks public statewide CPL data and is maintained by the CPL
Initiative team at RCCD on behalf of the California Community Colleges
system. See repository settings for license / use terms.
