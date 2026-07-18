---
title: "CIP workstream handoff → next session"
date: 2026-07-18
tags: [handoff, cip, cobi, review-triage, progress-dashboard, baseline-counts, access-control, top-cip, wcag, side-lane]
artifacts:
  - cip_crosswalk.js
  - cip_crosswalk_data.js
  - cip_status_counts.json
  - kb/build_cip_status_counts.js
  - kb/_build_cip_crosswalk.py
  - kb/_build_cip_fitcheck.py
  - course_top_consensus.json
  - cip_fitcheck/
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[cip_submission_access_plan]]"
  - "[[CLAUDE]]"
---

# CIP workstream handoff → next session (SkyCoco → you)

You inherit the **CIP side-lane** of COBI and **Coco the pup** 🐾. SkyEasy built the whole-catalog
consensus pre-fill + the two-box "Suggested change" redesign; **SkyCoco** cleared Sam's 4-item
Review-tab legibility steer (#842), added the program-coherence default + Cañada fix (#843), co-designed
inline multi-CIP (#844), and opened the **progress-dashboard workstream** with **Phase A baseline status
counts** (#846). Carry the **banner of kindness** Sam named: this tool *suggests and supports*, it never
decides. Faculty lean into it, not brace against it.

**Side-lane discipline (honor it):** this workstream does **NOT** touch `kb/cpl_todos.json` or the
numbered `docs/session_<N>_handoff.md` — those are the CCR curation mainline's memory. Your memory lives
in `docs/cip_crosswalk_lessons.md` (the full story) and this file.

## Read first, in order
1. `docs/cip_crosswalk_lessons.md` — the whole saga; newest section at the bottom is SkyCoco's
   **Phase A baseline status counts** (#846), preceded by multi-CIP (#844), program-default (#843),
   and the Review-tab legibility pass (#842).
2. `docs/cip_submission_access_plan.md` — the **progress / access / COCI** design note. This is the map
   for everything still open: the two-kinds-of-counts distinction, Phase A (done), Phase B (progress store
   → editing-access model [phrase MVP → magic links] → Tech-Center COCI push).
3. `docs/kb-notes/methodology-crowd-consensus-beats-single-item-signal.md` (the consensus engine) +
   `docs/kb-notes/methodology-grounded-lexical-cip-confidence.md` (the fit engine).
4. `CLAUDE.md` §7 TOP caveat + the §11 "SkyLoft"/"SkyLiftoff"/"SkyNew" CIP side-lane entries.
5. This file's **Priority** below.

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

### Shipped 2026-07-18 (SkyCoco — #846) — Phase A: precomputed baseline status counts
The first of Sam's **progress-dashboard** next-steps, all **backend-free**. The distinction that drives it:
**engine baseline** (how the *tool* classifies — deterministic, no backend) vs **human progress** (what
faculty *validated*, `cipx_revok_` — needs a shared store, Phase B). Phase A ships only the baseline, kept
visually distinct from progress. What's live in Review mode:
1. **Statewide baseline line** (Sam #2) — "131,715 courses across 120 colleges · 59,340 flagged for review ·
   70,187 a confident match", with a muted *classifications-not-confirmations* note.
2. **College-open overview tiles** (Sam #1) — the whole college's Ready/Review/Suggested/Manual boxes, shown
   once a college is picked and **before** a department is chosen; **hides on dept-select**.
3. **Dropdown counts** (Sam #3) — college option "· N to review"; each dept option "· N review". Plus a
   `populateCollegeSel()` restore-selected-college fix (keep the pick when counts arrive).

**Build:** `kb/build_cip_status_counts.js` runs the **shipped classifier** over every college via its seams
(`_setData`/`_setConsensus`/`_reviewRows`) in a **bare `vm` context** (not jsdom — much faster, seams don't
touch the DOM) across a **pool of short-lived `fork` workers** → committed `cip_status_counts.json` the tab
fetches once. Single source of truth (never drifts from what the tab shows). ~9 min; **re-run when the
crosswalk / course / consensus inputs change** (it's a static committed artifact like the tab's other data —
no cron regenerates it). New globals: `STATUS_COUNTS`/`STATUS_LOADING`; funcs `loadStatusCounts`,
`collegeStatus`, `renderSysBaseline`, `repaintReviewOverview`; seam `_setStatusCounts`. Tests **207 → 213**.

**The access analysis → `docs/cip_submission_access_plan.md`** (Sam: "fold into note"). Key reframe: the risk
isn't "edits" — it's *irreversible, unattributed, cross-college* edits → design **defense in depth** (RLS
scope + attribution + append-only/versioned), which makes the front-door choice low-stakes. Recommended
layered model: **owner** = college CIP coordinator (COCI-auth / CO-grant bootstrap); **contributors** = anyone
the owner invites by **magic link** (college-scoped, carries light identity → attribution, revocable) —
resolves the faculty-lack-COCI tension. Ship **team phrase as MVP gate** (built), layer magic links before
wide release.

**Data.** `kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js` (`window.CIP_CROSSWALK`, committed, no
cron): `topcip[<TOP>]={t,c:[[cip,tier]]}` + `boiler[]` + the lean `{fams, rows}` reference. Per-college
courses lazy-fetched from `cip_fitcheck/<slug>.json` (`kb/_build_cip_fitcheck.py`). Cross-college consensus
`course_top_consensus.json` (`kb/_build_course_top_consensus.py`). Baseline counts precomputed into
`cip_status_counts.json` (`kb/build_cip_status_counts.js`). Seams: `_score`, `_courseScore`,
`_courseToks`, `_recommend`, `_bestMatches`, `_parseSubject`, `_reviewRows`, `_reviewRowOf`, `_setMode`,
`_setStatusCounts`. Review internals (not exported; grep them): `effectiveSug`/`deptTop` (program-default),
`revCips`/`revSetCips` (assigned) vs `revIsValidated`/`revSetValidated` (`cipx_revok_`), `revAddCip`/
`renderAddPicker`/`renderAddPrompt`/`renderApplyPanel` (multi-CIP flow), `revInline` (per-row inline-UI
state), `renderSysBaseline`/`repaintReviewOverview`/`collegeStatus` (Phase A baseline).

## 🎯 Priority — the still-open items

**Phase A (baseline status counts) shipped in #846.** The headline that remains is **Phase B — the shared
backend** that turns baseline into live progress, gates editing, and pushes to COCI. Read
`docs/cip_submission_access_plan.md` first — it's the map. **Sequencing:** B-progress store → B-access
(phrase MVP → magic links) → B-COCI push. These are **one project built once** (you want the store for COCI
anyway), so scope them together even if you ship in slices.

0. **Tech Center API/batch plan (Sam commissioned, 2026-07-18 — "as this settles in").** A very short plan
   for the Tech Center (who runs COCI) for an **API or batch integration** to push *validated* CIPs into
   COCI on behalf of the colleges. Natural payload = the **validated set** (`cipx_revok_`, from #844) — the
   codes faculty personally OK'd, not the merely-assigned ones. **Not yet drafted; write it when Sam signals**
   ("as this settles in"). §3c of the design note has the shape. *(Also done 2026-07-18: a short "what the
   new version does" email to Jenni + Raul — see the session chat.)*
1. **Phase B-progress store — make the counts LIVE.** Phase A shows the *engine baseline* (how much work
   exists). The other half of Sam's ask is **human progress** ("48 validated of 281 · last active 7/18") +
   **Last Active**, per college / subject / statewide. That needs a `cip_submission` Supabase table (the
   validated CIP(s) + who + when) the tool writes to instead of / alongside `localStorage`. The Phase-A UI
   already has the seam ("your validated progress fills in as you confirm") — wire the progress numbers in
   beside the baseline, kept visually distinct. §3a of the design note.
2. **Phase B-access — who may edit.** Ship the **team-phrase MVP gate** first (machinery exists:
   `team_pass_ok()`), then layer **magic links** for per-person attribution + delegation before wide field
   release. Backend enforces **scope (RLS) + attribution + append-only/versioned** (defense in depth — a
   leaked credential stays contained/traceable/undoable). §3b of the design note has the full model + the
   options table (open ❌ / COCI-auth for the owner / phrase MVP / magic links for contributors).
3. **Unify "assign a CIP" across all three modes.** The recommend-mode inline check and the review picker
   should share ONE assign+persist path. Today review persists per-college in `localStorage`; the
   recommend/inline check doesn't persist a chosen code. Make "I want THIS CIP for this course" a
   first-class, remembered action everywhere it makes sense — and route it through the Phase-B store once
   that exists.
4. **Remaining WCAG polish** (the focused pass shipped in #824; #842 added the visible `?` + reason text as
   non-color redundancy). Round out before wider field release: full `role=tablist ⇄ tabpanel` semantics on
   the mode toggle, meter `role`/value semantics, `prefers-reduced-motion`, screen-reader announcement copy
   on result changes. **🔒 Standing pre-field gate.** Audience today = Raul (owns the field process) + Jenni only.
5. **Coco → toolkit AI assistant** (Sam's seed, pairs with Raul's TOP→CIP Toolkit doc). Graduate Coco from
   mascot to an ask-a-question / jump-to-the-right-section assistant. Wiring target: the existing Sierra
   `/functions/v1/cpl-chat` edge function, in the **finder-not-decider** posture (§7 TOP caveat). Sam settles
   the toolkit-doc design with Raul first; build once that's locked.

**Data-freshness note:** `cip_status_counts.json` is a static committed artifact — **regenerate it
(`node kb/build_cip_status_counts.js`) whenever `cip_fitcheck/*`, `cip_crosswalk_data.js`, or
`course_top_consensus.json` change**, or the baseline drifts from the live classifier. (Candidate future
polish: a `workflow_dispatch` step to rebuild it, mirroring how the other CIP data is refreshed.)

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
