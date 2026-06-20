---
title: Session 67 handoff — you are Session 67
created: 2026-06-20
tags: [handoff, session-67, tmc, co-review]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_66_handoff]]"
  - "[[docs/kb-notes/tmc-co-review-scope]]"
  - "[[docs/kb-notes/reference-adt-acceptance-rules]]"
---

# You are Session 67

Session 66 (**Skylander**) pivoted hard into the **TMC Builder** lane at Sam's
direction, building toward a **Chancellor's-Office ADT review/processing tool**
that replaces the painful manual PDF-vs-PDF course-by-course diffing CO staff do
today. Three PRs shipped to `main`; you pick up at the **acceptance engine**.

## What shipped (Session 66, all merged)

1. **#477 — Active vs Approved split.** The per-college ADT overlay collapsed
   COCI's two affirmative states into one badge; split them: **✓ Active** (live in
   the catalog) vs **✓ Approved** (CO-approved, pending activation). Real data:
   **2,867 active / 218 pending** across 40 of 44 TMCs (previously invisible).
   `tmc/_build_college_adts.py` + `tmc_builder.js`; 33 checks.
2. **#478 — scope + rules.** [`tmc-co-review-scope.md`](kb-notes/tmc-co-review-scope.md)
   (Phase-0 join validation DONE on 4 colleges) + the distilled **ASCCC acceptance
   ruleset** [`reference-adt-acceptance-rules.md`](kb-notes/reference-adt-acceptance-rules.md)
   (the CO program-approval checklist + the tiered acceptance ladder).
3. **#479 — template acceptance metadata.** `tmc/_parse_tmc_pdfs.py` `refine_slot()`:
   **119 flexible slots** flagged (`flexible:true`), per-TMC **`flexibility:fixed|flexible`**,
   **15 embedded C-IDs recovered** (African American Studies 0→3 — the only empty
   template, fixed). `tests/tmc_templates_structure.test.js` (9 checks); suite 60 files.

## The validated architecture (read the scope doc for detail)
- **Program join** COCI `CONTROL NUMBER` == PCF `Program Control Number` = **100%**.
- **Course join** PCF `Course Control Number` (CCC0…) → COCI course list = 90–95%.
- **C-ID coverage** on ADT courses is structurally uneven (51/29/8/**0%**) — BUT the
  rules say **non-C-ID ≠ non-compliant** (flexible List B/C slots accept any qualifying
  course + ASSIST evidence). The PCF's real-roster half is bulletproof regardless.

## Your priority — Phase 2, the acceptance engine (Sam: "Go for A!")

Wire the ASCCC rules into the TMC Builder's build-mode form as a **per-slot
verdict + readiness summary**. **No new data needed** — build it on the existing
builder's live per-slot selections, demonstrable on the 4 colleges (Allan Hancock
rich-C-ID vs **San Diego City zero-C-ID** is the perfect auto-accept-vs-ASSIST pair).

The verdict per slot (from `reference-adt-acceptance-rules.md` §3):
- C-ID match → **✓ accepted** (mandatory accept).
- `slot.flexible` + any course → **⚠ accept w/ ASSIST evidence**.
- specific C-ID slot filled by a non-matching course → **needs faculty descriptor review**.
- unfilled → **○ needs a course**.
Plus the **structural checklist** (§1): major units ≥ 18 sem · ≤ 60 total · section
select-counts met · no added local requirements → a "Ready / N issues" banner.

**Integration points in `tmc_builder.js`** (I was mid-read when the checkpoint hit):
- `statusFor(slot, course)` (~L444) already does units checks — extend it to the
  rules verdict (it now sees `slot.flexible`).
- `state.choice["si:sj"]` = per-slot selections; `sumSectionUnits`/`sectionUnits` = totals.
- The template now carries `slot.flexible` + `t.flexibility` (#479) — consume them.
- It's a STATIC asset (no Rule-4 mirror; inject CSS from JS). Commit a jsdom test.

## Parallel track — Phase 1, the bulk PCF (owe Sam a Playwright script)
The Data Mart (`College_MCF.aspx`) is a **DevExpress** stateful form — recipe per
college is **select → View Report → Export** (CSV); college code in `ASPxComboBoxC_VI`
(San Diego City=071). A **Playwright** script that drives a real browser + self-discovers
the dropdown is the robust bulk path (Sam runs it on a host that reaches
`datamart.cccco.edu`; the sandbox can't). 115 CSVs → `tmc/_build_college_adt_courses.py`
→ `tmc_college_adt_courses.js` → current-state bootstrap. The 4 validation PCFs
(Allan Hancock/Riverside/SD City/Santa Monica) were uploads, NOT committed.

## Carryover (standing lanes, pick up as Sam steers)
- **CPL-Assistant CCR/CER recommender ETL** — green-lit BEFORE the TMC pivot; still
  the other priority (`cpl-assistant-ccr-cer-recommendation-scope.md`).
- **CCR data lane** — `fable-morphological` + `fable-titlelane-dryrun` (measure-first, own PRs).
- **TMC follow-ups** — `college_short_names.json` alias hardening; ADT-overlay refresh
  on a fresh extract; faculty-verify the 45 drafts; a C-ID-discrepancy export.
- **KB Portal** — Sam smoke-tests 5 attachment types; bundle-divergence decision.

## Patterns that worked (steal these)
- **Measure-first**: validate the joins on a few colleges before building anything.
- **Human-as-proxy** for the bot-blocked Data Mart: Sam exports, you parse.
- **`refine_slot` order**: explicit inline C-ID → flexible-flag → token-recovery (so an
  *example* C-ID inside an "any … such as …" proviso stays flexible).
- **Correct your own misreads loudly**: the "Math/Biology/Business 0-C-ID" was a probe
  bug (the "2.0" suffix), not a template defect — caught + documented.

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` == `index.html`) — TMC tab nav/pane/boot live in BOTH.
- **`tmc_college_adts.js` + `tmc_templates.js` are STATIC** (NOT daily-cron) — commit the regen.
- **Merge-on-green** for your own engineering PRs (clean OR unstable); **hold scope docs**
  for Sam's steer only with a concrete reason.
- **Checkpoint** (Rule 8) at ~100K tokens or on `/checkpoint`.

## Your moniker
Sky lineage held (SkyGate → Startripper → Skyloft → Skylander). Suggestion:
**Skywright** (you're building the engine) — but claim your own. Welcome. 🛫
