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

### Shipped 2026-07-18 (SkyCoco — #843)
1. **Program-coherence default** (Sam's idea): a "no clear winner" Review row whose own pick is weak +
   uncorroborated (its code used by < `REV_DOMINANT_MIN`=3 dept siblings) **defaults its box to the
   department's dominant code** — e.g. Ironworker IWAP 40.xx (broad TOP 0956.00 grab-bag → weak `15.0405`
   Robotics) now default to `48.0511` Metal Fabricator (13 IWAP courses use it), **still Review**, with an
   honest "defaulted to … N of your IWAP courses use" reason. `effectiveSug()` + `deptTop`, display-only,
   never changes status (§7-safe). A textbook "TOP is unreliable" case for the CIP-transition messaging.
2. **Cañada mojibake** fixed (`CaÃ±ada`→`Cañada`), generator hardened with a `_demojibake()` repair.

### Shipped 2026-07-18 (SkyCoco — #844) — inline multi-CIP
Full flow, prototype-locked ([artifact](https://claude.ai/code/artifact/114df6ab-184a-4b21-b0af-4ae62f241d09)):
`+` beside the box adds a CIP inline; extras **stack** (3+), each removable; **anchor-OK** popup confirms the
original first if needed (it stays the anchor); a prompt → **Apply to other courses** = a checklist of ONLY
the subject courses sharing the primary CIP. **KEY MODEL:** `✓` = *individually validated* (new store
`cipx_revok_<college>`), separate from *assigned* codes (`cipx_rev_<college>`). Bulk-applied siblings get the
code but **stay in Review (`?`)** ("received N … from a sibling — review and confirm, or leave for a later
pass"). Every individual-confirm path calls `revSetValidated(true)`; the bulk-apply path does NOT — **honor
this when adding any new assignment action.** Tests → **207**.

**Data.** `kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js` (`window.CIP_CROSSWALK`, committed, no
cron): `topcip[<TOP>]={t,c:[[cip,tier]]}` + `boiler[]` + the lean `{fams, rows}` reference. Per-college
courses lazy-fetched from `cip_fitcheck/<slug>.json` (`kb/_build_cip_fitcheck.py`). Cross-college consensus
`course_top_consensus.json` (`kb/_build_course_top_consensus.py`). Seams: `_score`, `_courseScore`,
`_courseToks`, `_recommend`, `_bestMatches`, `_parseSubject`, `_reviewRows`, `_reviewRowOf`, `_setMode`.
Review internals (not exported; grep them): `effectiveSug`/`deptTop` (program-default), `revCips`/`revSetCips`
(assigned) vs `revIsValidated`/`revSetValidated` (`cipx_revok_`), `revAddCip`/`renderAddPicker`/
`renderAddPrompt`/`renderApplyPanel` (multi-CIP flow), `revInline` (per-row inline-UI state).

## 🎯 Priority — the still-open items
0. **Tech Center API/batch plan (Sam commissioned, 2026-07-18 — "as this settles in").** A very short plan
   for the Tech Center (who runs COCI) for an **API or batch integration** to push *validated* CIPs into
   COCI on behalf of the colleges. Natural payload = the **validated set** (`cipx_revok_`, from #844) — the
   codes faculty personally OK'd, not the merely-assigned ones. Not yet drafted; write it when Sam signals.
   *(Also done 2026-07-18: a short "what the new version does" email to Jenni + Raul — see the session chat.)*
1. **Unify "assign a CIP" across all three modes.** The recommend-mode inline check and the review picker
   should share ONE assign+persist path. Today review persists per-college in `localStorage`; the
   recommend/inline check doesn't persist a chosen code. Make "I want THIS CIP for this course" a
   first-class, remembered action everywhere it makes sense.
2. **Phase 3 — port VALIDATED CIPs to COCI (batch/API).** Sam: *"later we can just port the verified CIPs
   directly to COCI and spare the colleges from going in course by course."* #844's **validated set**
   (`cipx_revok_`) is exactly the human-gated payload. Scope: it lives in `localStorage` today — a real
   submission queue needs a **Supabase store**; the COCI ingest contract (ask Jenni / the Tech Center — they
   own the COCI CIP dropdown, per §7); and the human-gated review before anything writes to COCI. Pairs with
   priority #0.
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
