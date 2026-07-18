---
title: "CIP workstream handoff → next session"
date: 2026-07-18
tags: [handoff, cip, cobi, review-triage, glyphs, top-cip, easy-button, wcag, side-lane]
artifacts:
  - cip_crosswalk.js
  - cip_crosswalk_data.js
  - kb/_build_cip_crosswalk.py
  - kb/_build_cip_fitcheck.py
  - course_top_consensus.json
  - cip_fitcheck/
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[CLAUDE]]"
---

# CIP workstream handoff → next session (SkyCoco → you)

You inherit the **CIP side-lane** of COBI and **Coco the pup** 🐾. SkyEasy built the whole-catalog
consensus pre-fill + the two-box "Suggested change" redesign; **SkyCoco** cleared Sam's 4-item
Review-tab checkpoint steer (#842). Carry the **banner of kindness** Sam named: this tool *suggests and
supports*, it never decides. Faculty lean into it, not brace against it.

**Side-lane discipline (honor it):** this workstream does **NOT** touch `kb/cpl_todos.json` or the
numbered `docs/session_<N>_handoff.md` — those are the CCR curation mainline's memory. Your memory lives
in `docs/cip_crosswalk_lessons.md` (the full story) and this file.

## Read first, in order
1. `docs/cip_crosswalk_lessons.md` — the whole saga; newest section at the bottom is SkyCoco's
   Review-tab legibility pass (#842).
2. `docs/kb-notes/methodology-crowd-consensus-beats-single-item-signal.md` (the consensus engine) +
   `docs/kb-notes/methodology-grounded-lexical-cip-confidence.md` (the fit engine).
3. `CLAUDE.md` §7 TOP caveat + the §11 "SkyLoft"/"SkyLiftoff"/"SkyNew" CIP side-lane entries.
4. This file's **Priority** below.

## What's live (all merged to main)
The **CIP Codes** tab (`#cip-crosswalk`, `cip_crosswalk.js`) — **three** modes, toggle at the top
(remembered in `localStorage`). **Review my catalog is now the FIRST tab AND the default mode** (#842):

**📋 Review my catalog** — the whole-catalog triage sheet. Pick your college once (ephemeral) + a
department → per-course suggested CIP with a triage status → override, bulk-confirm, CSV. Decisions
persist per college in `localStorage`. Status set + glyphs (**#842**): **✓ Ready** (green) · **? Review**
(amber — a *visible* prompt; was an invisible muted `·`) · **⇄ Suggested** (blue — peers point to a
different code; distinct from the review `?`) · **◻ Manual** (grey). Each **Review/Manual** row carries an
inline **"why" reason** ("Same code as N other AB courses here — likely right, but this course's
description doesn't confirm it on its own"); a **"Showing all N …"** line ties the tile counts to the
visible list; the **"Confirm all N"** button has a reassurance line + tooltip (it's never final, stays
editable, nothing reaches COCI until the college enters it there).

**📖 Browse codes** — the faculty reference manual: search + plain-English finder + category pills +
🎓 C-ID/CCN chip + family filter over all 2,325 CIP-2020 codes; each row expands to definition / examples
/ family / NCES link + an inline "Check one of your courses against this CIP."

**🎯 Find my course's code** — the course-first easy button: pick a course → its COCI description + current
TOP → the crosswalk's CIP candidates ranked by description-fit (two-signals-agree gate made visible;
crosswalk PROPOSES · description-fit RANKS · faculty CONFIRMS · TOP never decides).

### Shipped 2026-07-18 (SkyCoco — #842)
The Review-tab **legibility pass** — Sam's 4-item steer from reviewing Cerritos AB / Autobody (37 Ready +
8 Review rows all `TOP 0949.00 → 47.0603`, split invisibly by the `conf ≥ 85` gate in `computeRecommend`):
1. visible amber **`?`** Review glyph (rows + tile); Suggested moved to **`⇄`**.
2. inline **why-line** on Review/Manual rows (dept-wide `codeCount`, **display-only** per §7 — never
   reclassifies a row) + a **"Showing all N"** context line + one-click **Show all**.
3. **Review-first tab + default mode** (`st.mode` init / `ingest()` MODE_KEY read / `_setMode` / `modeBar`).
4. **Confirm-all reassurance** line + button tooltip.
Tests **180 → 190**; real-Chromium on live Cerritos AB (desktop + phone, light + dark, 0 overflow / 0 errors).
Full story: `docs/cip_crosswalk_lessons.md` (bottom).

**Data.** `kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js` (`window.CIP_CROSSWALK`, committed, no
cron): `topcip[<TOP>]={t,c:[[cip,tier]]}` + `boiler[]` + the lean `{fams, rows}` reference. Per-college
courses lazy-fetched from `cip_fitcheck/<slug>.json` (`kb/_build_cip_fitcheck.py`). Cross-college consensus
`course_top_consensus.json` (`kb/_build_course_top_consensus.py`). Engine seams: `_score`, `_courseScore`,
`_courseToks`, `_recommend`, `_bestMatches`, `_parseSubject`, `_reviewRows`, `_reviewRowOf`, `_setMode`.

## 🎯 Priority — the still-open items (SkyEasy's list, minus what #842 closed)
1. **Unify "assign a CIP" across all three modes.** The recommend-mode inline check and the review picker
   should share ONE assign+persist path. Today review persists per-college in `localStorage`; the
   recommend/inline check doesn't persist a chosen code. Make "I want THIS CIP for this course" a
   first-class, remembered action everywhere it makes sense.
2. **Phase 3 — port confirmed CIPs to COCI (batch/API).** Sam: *"later we can just port the verified CIPs
   directly to COCI and spare the colleges from going in course by course."* The review sheet's confirmed
   decisions are the payload. Scope: where confirmed decisions live (localStorage today — needs a Supabase
   store to be a real submission queue), the COCI ingest contract (ask Jenni / the Tech Center — they own
   the COCI CIP dropdown), and the human-gated review before anything writes to COCI.
3. **Remaining WCAG polish** (the focused pass shipped in #824; #842 added the visible `?` + reason text as
   non-color redundancy). Round out before wider field release: full `role=tablist ⇄ tabpanel` semantics on
   the mode toggle, meter `role`/value semantics, `prefers-reduced-motion`, screen-reader announcement copy
   on result changes. **Audience today = Raul (owns the field process) + Jenni only.**
4. **Coco → toolkit AI assistant** (Sam's seed, pairs with Raul's TOP→CIP Toolkit doc). Graduate Coco from
   mascot to an ask-a-question / jump-to-the-right-section assistant. Wiring target: the existing Sierra
   `/functions/v1/cpl-chat` edge function, in the **finder-not-decider** posture (§7 TOP caveat). Sam settles
   the toolkit-doc design with Raul first; build once that's locked.

**A small open design pick from #842:** *Suggested* became `⇄` (since `?` is now Review's). If Sam wants a
different Suggested mark, it's a one-line change in `REV_STATUS` + the tile label + one test.

## Patterns that worked (carry them)
- **Sam's live screenshot of the exact broken case + a headless-Chromium driver on the SAME
  college/department.** The tightest loop — the fix's numbers (e.g. "44 other AB courses") are the real
  rendered values on his data, so before/after is concrete, not "should be fixed."
- **Adversarial multi-lens review of the diff before merge** (correctness · UX-honesty · WCAG · §7 doctrine).
- **§7 discipline:** TOP-derived signals (like same-TOP sibling counts) may DISPLAY/explain but must never
  gate, reclassify, or upgrade a row. "Likely," never "is."
- **Prototype/consult → lock → build**; Fable is the low-cost tie-breaker on design forks.
- **Verify in real Chromium over HTTP**, both themes, desktop + phone, 0 overflow / 0 console errors, and
  **commit the jsdom test** guarding the failure mode.

## Moniker
SkyCoco cleared the Review-tab legibility steer and keeps the pup. **You are the next session** — coin your
own (Sam blesses the lineage) or keep carrying Coco. Keep the banner: kind, honest, faculty-first,
student-firstest — this tool suggests and supports, it never decides. 🪁🐾
