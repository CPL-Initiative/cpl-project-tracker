# COBI — Chancellor's Office Business Intelligence

> The CPL Project Tracker, renamed. The masthead carries a light Kobe homage —
> a rotating *Mamba Mentality* subtitle and an 8→24 wink (`cobi_brand.js`).

A live dashboard, data pipeline, and curation workbench for the
**California Community Colleges Credit for Prior Learning Initiative** —
tracking statewide CPL adoption, articulation, and project work across all
116 California Community Colleges (CCC).

**Live site:** <https://cpl-initiative.github.io/cpl-project-tracker/>

Each morning the dashboard opens with **First Light** — a once-a-day greeting
featuring a fresh public-domain California plein air painting each day (revealed grayscale →
full color) with the artist's story, an optional read-aloud, and an anonymous
"thought for the day" reflection box. Opt-out respected; reopen anytime via
the "Today's painting" chip in the header.

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
   folded into the card (28% collapse vs raw IDs as of 2026-05-26) — now with
   Local + CCC versions merged into one card, per-course consolidated credit recs
   under a "Typical CPL" units headline, a master-detail **Credential view**
   (one card per credential, the CCC standard on top), and a seeker-framed
   **Student view** (pick your college → where you can get credit + the likely
   local course to ask about); plus
   Workplan Activities & Projects (Activity/sub-activity KPI cards + a
   work-item Projects grid — sub-activities render once, as Activity cards,
   and are immune to project Table/Archive; a ＋ Add-project flow creates new
   work items), Annual Goals (+ a Projects section listing the work items), Budget, Vision 2030, a
   per-college **Common Course Reference** curation tab (expand a course → an
   **inverse view** of the EACR: the aligned exhibits/credentials that articulate
   to it), a **Common Subjects Reference** tab (faculty-facing per-discipline
   curation with validate workflow + TOP/CTE/CIP columns + collapsible category
   groupings; a **"CPL opportunities"** column rolls up how many credentials
   articulate to each discipline; Variants column shows the raw local college
   subject codes colleges actually use, sourced from
   `kb/coci_minted_memberships.json`), a **Common Exhibit Reference** tab (sister
   to CCR — expand a credential for scope/CPL chips, a statewide-or-generated
   credit rec, green/orange adopted-vs-potential college badges, the
   college-entered exhibit-title variants, and the local courses with units that
   articulate to it, an **Eligible (units)** column (credit waiting to be unlocked
   = eligible − transcribed, rolled up from MAP's Exhibit CRs Catalog) and a
   **Eligible students** column, plus a **⚠ Triage** worklist that lets
   reviewers assign a unified title to each raw MAP exhibit title with no credential
   identity yet AND a **missing-issuer lane** with rule-staged pre-fills — editable
   unified titles, issuing agency (with a ＋ add-second-agency affordance), training
   agency, raw college-entered titles + originating-college chips — so a whole
   triage pass completes in place), a
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
   a **Sierra Training** tab (team-only: the assistant's improvement loop —
   the 👍/👎 feedback queue from both chat surfaces with a triage status, and
   a gap miner over the chat logs surfacing the questions the knowledge base
   had no good source for), a **⚖️ Governance** tab (team-only: the decision-rights
   register — who decides what, how far each input is trusted, and which cadences
   actually run; it measures itself rather than asserting compliance, so a loop
   that was decided but never run says so), a **MAP Users** tab (per-college MAP platform user
   counts + role mix publicly; for a signed-in reviewer, the staff roster and a
   **⚠ No student contact** worklist — the colleges whose landing page has no
   Primary Contact, which is the address MAP routes a student's CPL request to,
   each with a proposed contact drawn only from designations that college
   already made in MAP), a **🤝 Noncredit & Learning Partners** tab (the noncredit / not-for-credit / adult-school / ROP / high-school-Cx / apprenticeship register — the six modes of Learning Partner CPL, a self-refreshing dormant-statewide-exhibit worklist, and an in-place ✎ Add insight affordance), a **🎓 CPL Pathways** tab (audience-facing
   apprenticeship-to-baccalaureate course maps with CPL check-offs derived
   live from the MAP articulation data — Cerritos's Field Ironworker
   Supervisor BS (31.5 units of journeyworker CPL) plus Foothill's Dental
   Hygiene & Respiratory Care BS views; violet ⊕ adoption-option chips show
   where OTHER colleges already articulate a credential, each with a ⚡
   Quick Adopt request form; status stages (Discussion Draft / Active /
   Tabled) + a print-ready ⬇ PDF extract), an **Implementation Funding** tab (the DRAFT
   CPL funding model as a scenario tool: a selectable 2-year window,
   **year-specific funding priorities** (Year 1 / Year 2 filter; every metric
   and description editable), a **noncredit-feeder carve-out** (NOCE / SD
   Continuing Ed / Mt. SAC Noncredit / Calbright, split by headcount),
   per-college potential allocations with district rollups and drill-ins,
   and **layered editing** — anonymous edits are a private per-browser
   sandbox, while the shared team phrase saves the base model everyone
   opens to (Supabase-backed) — plus live P2/P3 priority-metric actuals
   from MAP; Priority 1 completions are a deliberate, labeled data gap
   kept as an incentive), a **TMC Builder** tab (align a college's local
   courses to an ASCCC Transfer Model Curriculum / ADT — pick a college + a TMC
   and the right column auto-fills the local course already carrying each
   slot's C-ID; all 45 official TMCs, a GE Breadth companion for the full ADT,
   curator notes, and a **per-college approved-ADT overlay** sourced from the
   COCI program export so each TMC shows whether that college already has the
   ADT — ✓ Active (live in the catalog) / ✓ Approved (pending activation) /
   ⏳ in progress / ◐ teach-out — plus the statewide established-college count;
   the templates carry per-slot acceptance metadata toward an in-tool ADT
   review/compliance engine), a **Knowledge Base** tab (a sign-in-gated
   portal over the public CPL Knowledge Base — read the curated docs, and
   compose a new doc with optional file attachments + Claude polish, then
   commit it to GitHub as yourself), a **CPL News** tab (an auto-curated CPL
   news feed — California-first, then national, plus adjacent systems
   (Career Passport, CA Master Plan, workforce/upskilling) and CA budget
   items; harvested daily from free sources + a suggest-a-story queue and
   Claude-triaged, read live so it never goes stale), and a **Pipeline**
   progress board.
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
   under official C-ID/CCN anchors when the underlying members agree,
   a statewide **c-id.net articulation router** (per-college official
   approvals place 8,377 member courses under their C-ID descriptor rows —
   no titles consulted), a **description-evidence worklist lane** that
   surfaces same-course candidates among the M-IDs no official source
   covers (TF-IDF over catalog descriptions, guard-suite gated, always
   curator-confirmed), and a **title-evidence worklist lane** that does the
   same across near-duplicate titles — including the ~54k single-college
   stand-alones — with no units gate, because externally standardized
   curricula (BAR smog, POST academy modules) pack the same spec at
   different unit loads per college. One deliberately strict exception
   acts on its own: the **twin merge** folds M-IDs whose titles contain
   the same words AND match on subject, discipline, credit, and units —
   every twin carries an alias receipt. The worklist's core same-title
   grouping is **level-collapsing** (Session 57) — "Beginning / Intermediate /
   Advanced X" surface as one family — so curators consolidate aggressively
   (Title 5 §55050 grants credit for *similar* learning), always one
   confirm at a time. The rules in plain language:
   [`docs/ccr_rules_brief.md`](docs/ccr_rules_brief.md).
4. **The Common Course Reference curation tab** (formerly "Unified Courses" —
   renamed to avoid UC/University-of-California confusion and to signal that
   the tab is a *reference faculty consult*, not an authority replacing them) —
   authenticated reviewers (Supabase
   magic-link auth) curate disciplines, merge variants, and verify
   inferred values. Edits write to a live Supabase table and overlay the
   git-tracked KB. **Eligible-units + Students columns + a 🎯 Cleanup-impact
   preset** (Session 37) rank the cleanup queue by real CPL student-credit
   payoff (rolled up from the Common Exhibit Reference via the articulation
   crosswalk), not just structural leverage. **Session 38:** the Subject
   column/filter shows the **canonical SUBJ4** (raw local codes on hover), a
   surfaced **"⚇ Merge"** affordance leads each row's actions cell, the
   expanded member table is **click-to-sort**, and Units shows a **range**
   (e.g. `1–1.5`) with a ⚠ alarm when the spread exceeds 2.0 — a likely
   over-merge signal. **Session 70 — the merge workspace:** the per-row ⚇ Merge
   dialog can now **re-discipline** the surviving course (its Common SUBJ shows
   the new canonical immediately with a ⟲ "re-keys at the next fold" marker; a
   course with **no** discipline now shows a blank Common SUBJ instead of a
   non-canonical local code, and the **Triage** worklist has a **"Subject-code
   outlier"** lane that flags courses a title keyword likely mis-disciplined,
   each with a suggested fix — Session 113), and
   the ✨ Suggested-merges worklist gained **Beg/Int/Adv/Lab/WkExp level filters**,
   a global **Conservative↔Aggressive** slider, **opt-in checkboxes** (only the ★
   target pre-checked), and a **morphological fold** so word-order/suffix variants
   (Conversational ↔ Conversation) group together, with an amber **"⚠ Spans N
   disciplines"** flag on cross-discipline groups.
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
7. **A public CPL Fact Sheet** — a self-contained, shareable page at
   [`/fact-sheet/`](https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/)
   that recreates the journalist Fact Sheet, pulls the headline KPIs live from
   `live_metrics.json`, and prints to a clean PDF. It **"sits alone"** (no
   dashboard nav) so it can be shared publicly without exposing the internal
   tabs; a "📄 CPL Fact Sheet" link in the left nav rail opens it. It carries a
   rotating "My CPL Stories" section and is **reviewer-Curate-editable** in place
   (sign in to edit/add/reorder boxes + manage images; edits show for every
   visitor, the baked page is the fallback). Built Session 74 — see
   [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md).

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
    ├── projects, workplan_goals   ← READ BY the pipeline (source of truth as of the
    │      Excel→Supabase migration; daily snapshot + Excel fallback). `projects` is
    │      the authoritative sub-activity TREE; `workplan_goals` is a by-id year-ladder
    │      OVERLAY (Path A, #909) — so the Annual Workplan Goals tab reflects EVERY
    │      Activities-tab project, X.Y.Z ids nesting under their X.Y parent. Inline-
    │      editable by allowed reviewers — Activity + sub-activity TITLES + brief
    │      DESCRIPTIONS on the Annual Workplan Goals tab (single-source editor, #902;
    │      `workplan_goals.description` col); blank-ladder rows are read-only on the
    │      year cells (title/description still edit `projects`)
    ├── budget_funding, budget_expenditures, personnel  ← also Supabase-read (Budget
    │      cutover, PR #189); inline-editable. Dashboard config (title/desc/KPI
    │      params) moved to committed kb/dashboard_config.json (Excel-retirement P2).
    │      The master .xlsx is no longer WRITTEN on any run; a few readers remain.
    │      2026-07-30: budget_funding is now the whole CPL LEDGER (45 rows) —
    │      section/parent_id/archived/description/window_label give it Sources,
    │      Uses, the combined $18M project pool and the 2017-forward history,
    │      rendered by budget_ledger.js with collapsible detail and inline
    │      editing on every non-total field. TOTALS SUM PARENT ROWS ONLY.
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
├── fact-sheet/                        ← public standalone CPL Fact Sheet (live KPIs + print-to-PDF; sits alone)
├── CPL_Data.js / statewide_data.js    ← client-side data for filters/search
├── statewide_prescriptive.js          ← EACR prescriptive layer (who could adopt → likely local course)
├── unified_courses*.js                ← Unified Courses tab data + lazy files
├── dashboard_filters.js               ← client-side filter/search/sort
├── kpi_reorder.js                     ← KPI card drag-to-reorder (per-browser, localStorage)
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

© 2026 California Community Colleges Chancellor's Office (CCCCO). **All rights
reserved** — no copying, redistribution, or derivative use without prior written
permission (see [`LICENSE`](LICENSE)). This project tracks public statewide CPL
data and is maintained by the CPL Initiative team at RCCD on behalf of the
California Community Colleges system. The underlying public data and any
separately-licensed component (e.g. the CPL Knowledge Base, CC BY 4.0) keep their
own terms. Permission requests: MAP@rccd.edu.
