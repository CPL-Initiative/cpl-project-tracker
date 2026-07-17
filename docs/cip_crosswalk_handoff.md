---
title: "CIP workstream handoff → next session"
date: 2026-07-17
tags: [handoff, cip, cobi, fit-check, top-cip, easy-button, review-sheet, side-lane]
artifacts:
  - cip_crosswalk.js
  - cip_crosswalk_data.js
  - kb/_build_cip_crosswalk.py
  - kb/_build_cip_fitcheck.py
  - cip_fitcheck_colleges.json
  - cip_fitcheck/
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[CLAUDE]]"
---

# CIP workstream handoff → next session

You are **Session N+1** on the **CIP side-lane** of COBI. SkyLoft carried it from a
static mockup to a live fit-check tool; **SkyLiftoff shipped the TOP→CIP "easy
button"** (course-first recommend mode). Carry it further — and carry the **banner
of kindness** Sam named: this tool *suggests and supports*, it never decides.
Faculty should lean into it, not brace against it.

**Side-lane discipline (honor it):** this workstream does **NOT** touch
`kb/cpl_todos.json` or the numbered `docs/session_<N>_handoff.md` — those are the
CCR curation mainline's memory. Your memory lives in `docs/cip_crosswalk_lessons.md`
(the full story) and this file.

## Read first, in order
1. `docs/cip_crosswalk_lessons.md` — the whole saga; newest section (SkyLiftoff, the
   easy button) at the bottom.
2. `docs/kb-notes/methodology-grounded-lexical-cip-confidence.md` — the fit engine +
   the crosswalk-corroboration extension.
3. `CLAUDE.md` §7 TOP caveat + the §11 "SkyLoft"/"SkyLiftoff" side-lane entries.
4. This file's **Priority** below.

> **Update 2026-07-17 (SkyLiftoff):** three fix PRs merged (#818 easy button, #819
> prefix+anchor, #820 the adversarial-audit + field fixes) **and Phase 2 shipped** —
> the **📋 Review my catalog** whole-catalog review sheet (third mode). The tool now has
> **three** modes. An inverted-index speedup landed with Phase 2 (28→12 ms/course, pure
> speedup). Full story bottom of `docs/cip_crosswalk_lessons.md`. **Next priority: the
> WCAG audit (standing pre-field gate)** + Phase 2 polish (cross-department progress /
> saved-decisions summary).

## What's live (all merged to main)
The **CIP Codes** tab (`#cip-crosswalk`, `cip_crosswalk.js`) — **three** modes, toggle at
the top (remembered in `localStorage`, Browse is default). The third, **📋 Review my
catalog**, is the department-scoped whole-catalog triage sheet: pick a department →
per-course suggested CIP + ✓Ready/⚠Review/◻Manual triage → override, bulk-confirm, CSV
(decisions persist in `localStorage`). The first two:

**📖 Browse codes** — the faculty reference manual: search + plain-English finder +
category pills + 🎓 C-ID/CCN chip + family filter over all 2,325 CIP-2020 codes; each
row expands to definition / examples / family / NCES link, plus an **inline "Check
one of your courses against this CIP"** (pick college once, pick a local course → a
grounded confidence read).

**🎯 Find my course's code** — *the easy button* (SkyLiftoff, 2026-07-17). Course-
first: pick your college once, pick a course → the tool reads its COCI description,
looks up its **current TOP**, and ranks the CIP codes the **official crosswalk** maps
from that TOP by description-fit. The **two-signals-agree gate** from the §7 TOP
doctrine, made visible:
- top crosswalk candidate that's a strong match + clearly ahead → green ✓ **Recommended**;
- weaker crosswalk candidates sit below with honest Strong/Plausible/Weak labels;
- a strong description match the crosswalk *doesn't* list → a separate **⚠ "outside the
  crosswalk"** drawer (auto-opens when there's no clear winner);
- the two universal noncredit boilerplate codes collapse behind "+N generic noncredit codes";
- matched-term chips per card (the trust lever), provenance as a muted label
  (official / field-submitted / noncredit), non-imperative tone throughout.

**Data.** `kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js` (`window.CIP_CROSSWALK`,
committed, no cron). Now carries `topcip[<TOP>]={t,c:[[cip,tier]]}` (420 TOPs, 4,865
pairs) + `boiler[]` alongside the lean `{fams, rows}` reference. Per-college courses
lazy-fetched from `cip_fitcheck/<slug>.json` (`kb/_build_cip_fitcheck.py`). Engine seams
for tests/Phase-2: `_score`, `_courseScore`, `_courseToks`, **`_recommend([label,desc,top])`**
(returns the full model: top/topTitle/cands/boiler/recommended/beyond), `_setMode`.

## 🎯 Priority — Phase 2: the whole-catalog review sheet (Sam's CO "wow")
The easy button solves ONE course at a time. Phase 2 turns the 800–1,500-course slog
into review-and-approve: a per-college sheet — **every course → current TOP → recommended
CIP → confidence** — pre-filled for the clear ones (the ✓ Recommended cases), so faculty
only adjudicate the ambiguous minority. `_recommend()` already returns everything a batch
pass needs; run it over a college's whole `cip_fitcheck/<slug>.json` and render a table +
**CSV export** (directly serves "replace the emailed workbook"). Keep the honest columns:
mark the ⚠ signal-disagreements and the "no clear winner" rows so faculty know exactly
where to look. Recommendation, never auto-assign; faculty enters the code in COCI.

Grounded scale check: median 5 CIPs/TOP, 32% ≤3, but a handful of TOPs map to 100+ CIPs
(cap the display / rank + "show all N"). Boilerplate is already de-weighted by the engine.

## 🔒 The standing gate: accessibility (WCAG) before field release
Sam's explicit pre-field gate — **do this before it leaves Raul + Jenni.** The new
recommend mode inherits the a11y hygiene (`role=tablist/tab` + `aria-selected` on the
mode toggle, `aria-live` result host, keyboard-operable combobox + cards, expanders
with `aria-expanded`, focus-visible rings). Still owed, whole tab: muted badge/stripe
**contrast ratios** (the earthy category + tier tokens), listbox/option + tablist⇄
tabpanel semantics polish, meter `role`/value semantics, reduced-motion, SR
announcement copy. Audience today = **Raul (owns the process at field) + Jenni** only.

## Patterns that worked (carry them)
- **Prototype/consult → lock → build.** Fable consultant on the 50/50 design fork
  (IA, tri-state, tone) — its calls (segmented toggle, one quarantined ⚠ section,
  matched-term chips, non-imperative phrasing) shaped the final design. Opus builds,
  Sam steers, Fable is the low-cost tie-breaker.
- **Calibrate on REAL data.** Ran `_recommend` over real Allan Hancock courses BEFORE
  writing formal tests — surfaced the honest Med-Surg-Nursing disagreement + the
  Vacuum-Technology only-boilerplate edge, both now handled.
- **Refactor under test cover.** Factored the shared `comboCore` while byte-preserving
  the inline check's pinned DOM so its 60 tests stayed green.
- **Verify in real Chromium over HTTP** (fetch needs a server): 0 overflow + 0 console
  errors, desktop + phone, light + dark. **Commit the test** (jsdom, now 84 assertions).
- **Method + magic, light touch** — shape the score, don't gate the label; when unsure,
  give faculty the control (search / the ⚠ drawer) rather than a hard rule.

## Moniker
SkyLiftoff shipped the liftoff. You might be **SkyOrbit** (Phase 2 = catalog-scale
review, reaching orbit) — or coin your own; Sam blesses the lineage. Keep the banner:
kind, honest, faculty-first. 🪁
