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
