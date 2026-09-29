---
title: "Fire & EMS eligibility (StarEmber) handoff → next session"
date: 2026-07-20
tags: [handoff, cpl, eligibility, credential-reference, statewide, fire, ems, paramedic, side-lane]
artifacts:
  - credential_reference_data.js
  - kb/statewide_exhibit_categories.json
  - excel_to_dashboard.py (export_credential_reference)
  - docs/fire_ems_eligibility_lessons.md
  - docs/kb-notes/methodology-area-eligibility-rollup-from-cer.md
related:
  - "[[fire_ems_eligibility_lessons]]"
  - "[[methodology-area-eligibility-rollup-from-cer]]"
  - "[[reference-cpl-eligibility-and-exhibit-cr-catalog]]"
  - "[[CLAUDE]]"
filtered_view: https://claude.ai/code/artifact/36e7fb36-10a7-44a3-a631-d0ec591ccc4c
---

# Fire & EMS eligibility side-lane handoff (StarEmber → you)

You picked up a **side request** from Sam: how many MAP students have eligible
credit, and how many credits, for **statewide credit recommendations** in
**Fire, EMT/EMS, Wildlands, Paramedic** — then the **local** ones too — and to
drop it into a **filtered view**. It's a read-only data lane; it did **not**
touch the CCR mainline, `cpl_todos.json`, or the numbered `session_*` handoff.

## What shipped
- **The answer** (as-of the 2026-07-20 14:38 UTC pull): statewide **27 creds ·
  ~238 counted students · ~1,946 eligible credits**; local **142 · ~251 ·
  ~2,567**; combined **169 · ~489 · ~4,513**. Per-area table in the lessons doc.
- **A filtered-view artifact** (private, shareable):
  https://claude.ai/code/artifact/36e7fb36-10a7-44a3-a631-d0ec591ccc4c
- **Two docs:** `docs/fire_ems_eligibility_lessons.md` (full run) +
  `docs/kb-notes/methodology-area-eligibility-rollup-from-cer.md` (the reusable
  recipe). No code changed.

## Read these first (in order)
1. `docs/fire_ems_eligibility_lessons.md` — the numbers, the hypothesis result,
   the two findings.
2. `docs/kb-notes/methodology-area-eligibility-rollup-from-cer.md` — the join
   recipe + the false-positive exclusions + the "two definitions of statewide"
   gotcha.
3. `docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog.md` — the
   underlying CER rollup rules (students = volume not headcount; `<5` mask;
   Title-bridge id gotcha).

## The one finding to act on
**"Statewide" has two independent definitions that diverge.** The CER
`statewide` flag = `has_ccc` (has a CCC-Collaborative *articulation*;
`excel_to_dashboard.py` `export_credential_reference()` ~L6890/6909). The
statewide **CPL category page** (`kb/statewide_exhibit_categories.json`) is a
curated list. **Paramedic License** (18 students / 721.5 credits — the biggest
paramedic line) sits on the page but is flagged **local**, which swings the
whole paramedic statewide/local split. Not obviously a bug — ask Sam which
definition he wants for the flag.

## Next steps (potential — Sam parked these as "perfect for now")
1. **Resolve the Paramedic License flag divergence.** If the category page
   should win: OR-in `statewide_exhibit_categories.json` membership when setting
   the row `statewide` in `export_credential_reference()`, regen the CER, re-check
   the paramedic split. Confirm the intended definition with Sam first.
2. **Make the view reproducible without ad-hoc node.** Either emit a small
   committed area×tier rollup the CER tab can filter, or add a multi-select /
   URL deep-link to the live Credential Reference tab (today its discipline
   filter is single-select with no hash state — that's why a static filtered
   view was the right call this round).
3. **Add "credit waiting to be unlocked"** (eligible − transcribed) to the view
   — the data is already on each CER row.
4. **Reconcile the title-drift** "Fire Inspector I" (category file) ↔ "Fire
   Inspector 1" (CER) so an exact category-file join stops missing it.
5. **Generalize** the statewide-vs-local filtered view to the other statewide
   categories if Sam wants it system-wide (AJ, Automotive, CIS, Construction,
   Corrections, Kinesiology/Health, Real Estate, Welding, World Languages).

## Patterns that worked
- The numbers were **already in the repo** (`credential_reference_data.js`) —
  no live MAP fetch needed (the sandbox can't reach the MAP hosts anyway).
- **Reverse-sweep to catch misses:** after the category-file join, a second
  pass over *all* fire/EMS-disciplined CER rows caught the title-drift and the
  Paramedic-flag divergence the exact join hid.
- A **purpose-built filtered view** beat forcing the live tab's single-select
  filters to express a four-discipline × two-tier cut.

## Safety patterns honored
- Read-only; no Supabase writes, no generator/consumer changes, no regen.
- Side-lane discipline: left `cpl_todos.json` + the numbered handoff to the CCR
  mainline (this lane owns only its own lessons/handoff/§11 subsection).

## Moniker
This lane went out as **StarEmber**. Claim your own, or carry it if you keep
the eligibility-view thread going.
