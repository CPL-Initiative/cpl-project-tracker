---
title: Dashboard Cleanup & Cross-Disciplinary Accounting — Lessons
date: 2026-05-30
session: 20 (Bruh — dashboard polish sprint)
tags: [lessons, dashboard, ui-cleanup, tabs, accounting, cross-listing, branch-policy]
artifacts:
  - CPL_Dashboard.html
  - index.html
  - unified_courses.js
  - canonical_subj4.js
  - credential_reference.js
  - quickstart.js
  - excel_to_dashboard.py
related:
  - "[[CLAUDE]]"
  - docs/kb-notes/playbook-move-generated-section-to-tab.md
  - docs/session_21_handoff.md
---

# Dashboard Cleanup & Cross-Disciplinary Accounting — Lessons

Session-20 workstream scratchpad. Two threads: (1) the cross-disciplinary
**accounting → Business** curation + cross-listing, and (2) a 10-item
**dashboard cleanup** sprint. Plus three branch/checkpoint **rule changes**.

## 2026-05-30 — Session 20 (Bruh)

### (a) What shipped

**Accounting / cross-listing (merged #198, #199):**
- 27 genuinely-accounting M-IDs/singletons in a blank/Vocational slot →
  discipline **Business** (Supabase `kb_curation` + `coci_curation.json` overlay,
  attributed `MAP@rccd.edu`). 21 cross-disciplinary accounting courses
  cross-listed via the new **`cross_listed_disciplines`** `kb_curation` field.
- **A** — anchor rows now surface `discipline_provisional` (e.g. Business →
  Accounting) in the CCR. **B** — locked anchors got a firewall-safe
  "propose correction" affordance (`anchor_discipline_proposal`, excluded from
  `_apply_curation.py` FIELDS so it never overwrites `common_courses.json`).

**Dashboard cleanup (merged #201, #202, #204):**
- #7 Common Subject Code → **Common Subjects Reference (CSR)**; Credential
  Reference → **Common Credential Reference** → then **Common Exhibit Reference
  (CER)** (CCR/CSR/CER initials family; "exhibit" is the right MAP term). Hashes
  + filenames preserved (CSC-D precedent).
- #10 full-width intros (dropped `max-width` cap). #9 quick-search opens blank
  (removed sessionStorage pre-fill). #4 slim one-line header (CSS-only flex bar;
  generator still owns the h1 text + PROJ-INFO). #5 CCR table economized
  (tighter padding/font + wrappable headers). #8 SUBJ filter on **CCR + CSR**.
- **CER expand bug** — `renderExpandedRow` used `tr`/`td`/`div` that were never
  declared (missing scaffolding) → expanding any row threw a `ReferenceError`
  that blanked the whole table. Restored `tr.cr-expanded > td[colspan] >
  div.cr-expanded-body` matching existing CSS.
- #6 **Exhibit Adoption & Credit Recommendations** → its own top-level tab
  (`#tab-exhibit-adoption`), pulled out from under CPL Analytics. See the KB-note
  playbook for the mechanics.

**Rule changes (merged #200, #201, #203):**
- Checkpoint rule (#200): pipeline-viz refresh + next-session handoff now on
  **every** checkpoint (was session-end-only) — the bricked-session safeguard.
- Auto-merge (#201): Sam's review is **no longer a gate** — green CI merges.
- Merge-promptly (#203): never park a PR in draft/"waiting"; mark ready
  immediately + squash-merge the instant CI is green.

### (b) What was learned

- **`disc_of()` overrides, not just fills.** The CCR generator's curation
  overlay (`disc_of(cid, base)`) returns the curated discipline over the base
  value, so a curation flips even a non-blank discipline (the 6 "Vocational"
  accounting rows → Business). Confirmed before writing.
- **The overlay can't reach anchors.** `export_unified_courses()` builds anchor
  rows straight from `common_courses.json` and never consults the curation
  overlay for them → an anchor discipline edit would be silently dropped. That's
  why **B** is a *propose-only* affordance, not a live edit (firewall intact).
- **Measure-first beats the summarized count.** The "11 safe / 14 cross" figure
  from a prior summary was an undercount + carried **false positives** (over-broad
  "auditing" keyword swept in IT/security/energy "auditing" courses). A fresh
  re-derivation gave the real set (22 safe + a clean cross-disciplinary list) and
  caught `QAMD M9004 "Quality Auditing for Medical Devices"` etc. before any write.
- **`kb_curation` writes are the source of truth; the JSON overlay is a mirror.**
  `_apply_curation.py` *regenerates* `coci_curation.json` from Supabase each cron,
  so a JSON-only edit would be clobbered — durable curation must hit Supabase.
- **Lingering a green PR in draft looks like "waiting for review."** Got caught
  doing recon while #202 sat green-but-draft. Fix: merge the instant CI is green
  (now codified — #203).
- **`tabs.js` auto-derives `VALID_TABS` from rendered nav buttons** → adding a tab
  is "drop a nav button + a pane," no whitelist edit (the old #117/#118 trap is gone).

### (c) Current state

All 10 cleanup items EXCEPT the two page moves are done. #6 (Exhibit Adoption
tab) landed; **#1 (Activities & Projects → "Workplan" tab) is NOT done** — it's
the high-risk one (see roadmap). Accounting curation is live in Supabase; the
daily cron folds it into the overlay + regenerates the CCR.

### (d) Strategic roadmap / next

1. **#1 — Workplan tab** (priority). The `<!-- Workplan Activities & Projects
   Section -->` marker is the **end-anchor for 4 generator ops** (KPI Summary
   replace 8407, MAP Articulation strip 8451, CPL Analytics strip 8455, outer
   find 8464). Moving the section needs a **sentinel marker that stays in the
   Dashboard tab** + rewiring all 4, then a **local `excel_to_dashboard.py` run**
   to verify (catastrophic-gobble failure mode otherwise). Full procedure:
   `docs/kb-notes/playbook-move-generated-section-to-tab.md`.
2. **#2 — sidebar sub-links** (after #1; depends on final tab layout). Expand each
   pane's `data-sections` to list sub-sections; `tabs.js` scroll-spy already wired.
3. **#3 — MID/CID/CCNID label sweep.** Cosmetic-only (Sam's call): rename
   `id_system` values + UI labels + code literals + docs; **preserve the 224
   `M-ID ACCT 100`-style anchor identifier keys** (renaming those = identifier
   re-key, ripples into curation/articulation pointers). CCN-ID → CCNID too. ~70k
   `.js` hits regenerate from source — lockstep the `=== "M-ID"` code comparisons.
4. **Backlog (Sam, this session):** KPI-card sort-order box (localStorage per-viewer
   recommended vs shared Supabase-anon); dark mode (basic moderate, all-elements
   hard — pervasive inline colors); a `dashboard-tab-surgery` Skill; full Excel
   retirement (Phases 4 Vision / 5 Personnel + migrate the KPI ladder + 3 report
   consumers).

## 2026-05-31 — Session 22 (Bruh Sentinel)

### (a) What shipped — #1, the deferred HIGH-RISK page move (PR #206, merged)

**Workplan Activities & Projects → its own "Activities & Projects" tab**
(`#tab-activities-projects`). The hard-case path from the playbook:

- The section's marker `<!-- ═══ Workplan Activities & Projects Section ═══ -->`
  was the **end-anchor for 4 generator ops** (KPI Summary replace, MAP
  Articulation strip, CPL Analytics strip, CPL Analytics insert). Moving it would
  let those `.*?` regexes gobble across the Dashboard→new-pane gap on the next regen.
- Fix: a permanent **`<!-- ═══ Dashboard Sections End ═══ -->` sentinel** stays in
  the Dashboard tab (where the section began); all 4 ops re-anchor on it (one
  `replace_all` of the marker string + comment updates). The section's inner
  anchors (`Filter Bar` 5108, `Projects Grid` 5198, `End Projects Grid` 7930,
  `activityKpiSection`) travelled with the ~4,600-line block, so Ops 5/6/7 still
  resolve via `html.find()` in the new pane. Op 6 (Annual Workplan Goals) was a
  red herring — it replaces in place at the *workplan-goals tab's* AWG markers
  (8547/9394), not in the moved block; its `<!-- Projects Grid -->` ref is a
  fresh-template fallback only.

### (b) What was learned

- **You CAN run `excel_to_dashboard.py` in a web session.** `pip install openpyxl
  pandas`; it falls back to `kb/*_snapshot.json` when `SUPABASE_SERVICE_KEY` is
  unset (snapshots + `live_metrics.json` + the project xlsx are committed). The
  Node `docx` report step fails (no npm module) but that's AFTER the HTML write
  (8896) + index mirror (8943) — non-fatal. This turns the playbook's "non-optional
  local regen" from a blocker into a 1-minute check.
- **Idempotency = run twice, diff.** Two consecutive regens diffed to only the
  5:33→5:34 PM timestamp + trailing whitespace (15 lines). That's the definitive
  proof the Rule-1 regex anchors don't gobble or accumulate. A structural drift or
  duplicated section would have shown up immediately.
- **Marker-based surgery beats line numbers.** The move was done by a throwaway
  Python script keyed on marker *strings* with `count()==1` assertions that
  `sys.exit` on surprise — robust against the 10k-line file's whitespace. (Script
  deleted post-merge; method lives in the commit + KB note.)
- **Ship structure-only HTML.** Reverted the regen's data files (CPL_Data.js,
  unified_*.js, exports/) and shipped the pre-regen HTML (move applied, committed
  data intact) → tight 3-file diff, no data churn. The move is a proven-idempotent
  generator input, so the next cron regenerates cleanly on top.

### (c) Current state

#1 DONE + merged. #6 (Exhibit Adoption) already landed Session 20. Both page moves
from the cleanup sprint are now complete. CLAUDE.md §6b/§7b/§11 synced to the new
layout. Tab nav now: Dashboard · **Activities & Projects** · Annual Workplan Goals ·
Budget · Vision 2030 · CCR · CSR · CER · Exhibit Adoption · Pipeline · Letters.

### (d) Strategic roadmap / next

1. **#2 sidebar sub-links** — now UNBLOCKED (depended on the final tab layout).
   Expand each pane's `data-sections`; scroll-spy already wired. Per-pane, additive,
   no generator risk. Verify rendering (can't eyeball scroll-spy headless).
2. **#3 MID/CID/CCNID cosmetic sweep** — own focused PR + measure-first; preserve
   the 224 anchor identifier keys; lockstep every `=== "M-ID"` comparison.
3. **Encode a `dashboard-tab-surgery` Skill** — there's now a clean, proven instance
   (this PR) + the KB-note playbook to encode it from.

## 2026-05-31 — Session 23 (Bruh 23): #2 + #3 carryover cleared

### (a) What shipped
- **#2 sidebar sub-links (PR #208, merged).** Expanded `data-sections` on the
  two genuinely multi-section panes: **Activities & Projects** → *Activity
  Metrics* (`#activityKpiSection`) + *Projects* (`#projectsGrid`) — a pure
  static-template edit (both ids already stable); **Budget** → *5-Year Funding
  Plan* / *Expenditure* / *Personnel Plan* — 4 stable `id`s added to the
  generator's budget divs (`render_budget_html`, both expenditure paths) +
  hand-applied to the live HTML. Left single-section panes (Vision/CCR/CSR/CER/
  Letters/Workplan-Goals) alone — a 1-item TOC is clutter, not value.
- **#3 MID/CID/CCNID (PR #209, merged).** Chose **display-only** over the
  data-value rename (Sam course-corrected mid-recon: "just cosmetic… not
  touching the keys"). `idSysLabel`/`id_sys_label` maps the value at ~9 render
  sites (CCR Source filter / detail modal / anchor tooltip / consolidation prose
  / Unify dialog; CER identity badge; Articulations-by-Course chips). Stored
  `id_system` value + the 224 anchor keys untouched; comparisons keep working.

### (b) What was learned
- **`data-sections` ids must be classified static-vs-generated.** `tabs.js`
  scroll-spy gracefully skips a missing id (no crash), but for a STABLE anchor
  you must confirm the id is either static-template OR stably generator-emitted.
  `#activityKpiSection` is generator-emitted but stable (re-emitted every run);
  `#projectsGrid` is static + already referenced by `dashboard_filters.js`.
- **Filter dropdown: map option TEXT, keep option VALUE raw.** The CCR Source
  filter's `<option value="M-ID">MID</option>` — display mapped, value raw — so
  the filter-match logic (`r.id_system !== state.source`) keeps comparing raw
  values. One optional `labelFn` param on `sel()`; nothing else changes.
- **Display-label map > stored-value rename for a "cosmetic" ask.** Mapping at
  render sites is inherently safe against conceptual prose, the pipeline
  narrative, and the **glossary** (where "C-ID"/"CCN" are the real ASCCC/AB-1111
  authority names that must NOT change) — because there's no global replace.
  Distilled to `docs/kb-notes/methodology-display-label-map-vs-data-rename.md`.

### (c) Current state
Both Session-20 carryover items (#2, #3) DONE + merged. The cleanup sprint
(#1–#10) is fully closed. Pivoted to Excel retirement (see
`docs/excel_to_supabase_lessons.md` Session 23).

### (d) Next
Backlog only (KPI-card sort-order, dark mode, a `dashboard-tab-surgery` Skill).
No open dashboard-cleanup threads.
