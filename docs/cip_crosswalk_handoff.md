---
title: "CIP workstream handoff → next session"
date: 2026-07-17
tags: [handoff, cip, cobi, fit-check, top-cip, easy-button, review-sheet, wcag, side-lane]
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
static mockup to a live fit-check tool; **SkyLiftoff shipped the TOP→CIP "easy button"**
(course-first recommend mode), **Phase 2** (the whole-catalog review sheet), and a
**field-testing cascade** with Sam that closed the confidence, TOP-visibility, and
accessibility gaps. Carry it further — and carry the **banner of kindness** Sam named:
this tool *suggests and supports*, it never decides. Faculty should lean into it, not
brace against it.

**Side-lane discipline (honor it):** this workstream does **NOT** touch
`kb/cpl_todos.json` or the numbered `docs/session_<N>_handoff.md` — those are the
CCR curation mainline's memory. Your memory lives in `docs/cip_crosswalk_lessons.md`
(the full story) and this file.

## Read first, in order
1. `docs/cip_crosswalk_lessons.md` — the whole saga; the newest sections (Phase 2, then
   the #822/#823/#824 field-testing cascade) are at the bottom.
2. `docs/kb-notes/methodology-grounded-lexical-cip-confidence.md` — the fit engine +
   the crosswalk-corroboration extension.
3. `CLAUDE.md` §7 TOP caveat + the §11 "SkyLoft"/"SkyLiftoff" side-lane entries.
4. This file's **Priority** below.

## What's live (all merged to main)
The **CIP Codes** tab (`#cip-crosswalk`, `cip_crosswalk.js`) — **three** modes, toggle at
the top (remembered in `localStorage`, Browse is default):

**📖 Browse codes** — the faculty reference manual: search + plain-English finder +
category pills + 🎓 C-ID/CCN chip + family filter over all 2,325 CIP-2020 codes; each row
expands to definition / examples / family / NCES link, plus an **inline "Check one of
your courses against this CIP"** (pick college once, pick a local course → a grounded
confidence read).

**🎯 Find my course's code** — *the easy button*. Course-first: pick your college once,
pick a course → the tool reads its COCI description, looks up its **current TOP**, and
ranks the CIP codes the **official crosswalk** maps from that TOP by description-fit. The
**two-signals-agree gate** made visible (crosswalk PROPOSES · description-fit RANKS ·
faculty CONFIRMS · TOP never decides): top strong+clear candidate → green ✓ **Recommended**;
weaker crosswalk candidates below with honest tiers; a strong description match the
crosswalk *doesn't* list → a separate **⚠ "outside the crosswalk"** drawer; the 2
noncredit boilerplate codes collapse behind an expander; matched-term chips + muted
provenance labels.

**📋 Review my catalog** — the whole-catalog triage sheet (Sam's CO "wow"). Pick a
department → per-course suggested CIP + ✓Ready/⚠Review/◻Manual triage → override,
bulk-confirm, CSV. Decisions persist per college in `localStorage`. Every row shows the
**current TOP subline** beside the suggested CIP ("where they are → where they're going").
Outside-crosswalk matches are **selectable**, not just flagged.

### The field-testing cascade (2026-07-17, all merged)
- **#822 confidence fix** — confidence is now **crosswalk-relative** (normalized against
  the course's own candidate set × a quality factor), not global-max. Clear winners read
  ~100% (ACCT → 52.0301 Accounting 100% Strong), not ~77%. Catch-all Cooperative-Ed /
  Work-Experience courses still read low — that's honest, not a bug.
- **#823 TOP-in-every-view + assignable outside matches** — current TOP subline on review
  rows; stronger outside-crosswalk matches render as selectable radios.
- **#824 audit remediation + WCAG** — dropped the workbook's "No TOP Match" sentinel
  bucket (27% of the map); `nonBoiler()` quarantines the 2 boilerplate codes out of every
  ranked display; comboCore detached-listener guard; **WCAG pass** (aria-live host,
  aria-expanded rows, aria-selected options, contrast token darkenings + accessible
  ✓ Recommended badge). Tests **123**; real-Chromium clean desktop+phone, light+dark.
- **#826 Review-tab polish + work-experience rule** — hairline SVG mode-tab glyphs (the
  `svgIcon()` helper — elegant, not emoji); Department picker moved up beside the college;
  one-line count chips; the **TOP → CIP transition** on every row (`.cipx-rev-tocip`,
  bigger boxed CIP + `← TOP` candidate tags); and the **work-experience discipline rule**
  — `isWorkExperience(label)` zeroes `beyond` in `computeRecommend`, so work-experience /
  cooperative-ed courses no longer get an "outside the crosswalk" nudge (they belong to
  their own discipline). Tests **128**.
- **#829 college glyph + TOP titles inline** — hairline institution glyph; TOP titles
  inline everywhere (makes a mis-coding self-evident). Dropped a lexical "check TOP"
  indicator that fired on ~19/21 BIO rows — the lesson that motivated the consensus engine.
- **#830 the cross-college CONSENSUS engine (the headline)** — `kb/_build_course_top_consensus.py`
  → `course_top_consensus.json` (408 KB, committed, lazy). The review-row drawer's **"Field
  consensus"** block: "(M use, K differ)" metric + differ-hover (who/which TOPs) + outlier
  note + the consensus CIP as a one-click candidate (modal peer TOP's best-fit crosswalk
  CIP). Norco "Human Biology" = 1 of 48 → surfaces 30.2701. Seams `_consensus`,
  `_consensusKey`, `_setConsensus`. Method note: `methodology-crowd-consensus-beats-single-item-signal.md`.
- **#831 multi-CIP + field-consensus-first ordering** — decisions are arrays (checkboxes,
  toggle, "+N" chip, `revOpen` keep-expanded, "+ Add another code…"); `reviewExpand` renders
  strongest-first (consensus → crosswalk → outside), shared `candRow()`.
- **#832 one-line rows** — narrowed course col, nowrap transition, truncating titles.
  Tests **140**.

**Data.** `kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js` (`window.CIP_CROSSWALK`,
committed, no cron). Carries `topcip[<TOP>]={t,c:[[cip,tier]]}` (**419 TOPs, 3,534 pairs**
after the sentinel drop) + `boiler[]` alongside the lean `{fams, rows}` reference. Per-
college courses lazy-fetched from `cip_fitcheck/<slug>.json` (`kb/_build_cip_fitcheck.py`).
Engine seams: `_score`, `_courseScore`, `_courseToks`, `_recommend([label,desc,top])`,
`_bestMatches`, `_parseSubject`, `_reviewRows`, `_setMode`.

## 🎯 Priority — what's next (Sam's steer)
0. **Whole-catalog CONSENSUS pre-fill (Sam's "kit and kaboodle" — the true easy button).**
   The consensus signal (#830) is statewide, so it can **pre-fill a confident CIP for every
   course** in a college's catalog — turning the review sheet into pure review-and-approve.
   Scope: for each course, if the peer consensus is strong (high modal fraction, decent n),
   pre-populate its `revSetCips` suggestion (or a distinct "consensus-suggested" tier) so
   ✓Ready reflects consensus, not just the single-course crosswalk. Extend the consensus
   block to the **"Find my course's code"** mode too (today it's review-only).
1. **Unify "assign a CIP" across all three modes.** The recommend mode's inline check and
   the review picker should share ONE assign+persist path (today the review mode persists
   per-college in `localStorage`; the recommend/inline check doesn't persist a chosen
   code). Make "I want THIS CIP for this course" a first-class, remembered action
   everywhere it makes sense.
2. **Phase 3 — port confirmed CIPs to COCI (batch/API).** Sam: *"later we can just port
   the verified CIPs directly to COCI and spare the colleges from having to go into COCI
   course by course … an API or batch upload process."* The review sheet's confirmed
   decisions are the natural payload. Scope: where do confirmed decisions live (they're
   `localStorage` today — needs a Supabase store to be a real submission queue), what's
   the COCI ingest contract (ask Jenni / the Tech Center — they own the COCI CIP dropdown),
   and the human-gated review before anything writes to COCI.
3. **Remaining WCAG polish** (the focused pass shipped in #824; these round it out before
   field release beyond Raul + Jenni): full `role=tablist`⇄`tabpanel` semantics on the
   mode toggle, meter `role`/value semantics, `prefers-reduced-motion`, screen-reader
   announcement copy on result changes. **Audience today = Raul (owns the field process) +
   Jenni only.**

Grounded scale check for any batch pass: median 5 CIPs/TOP, 32% ≤3, a handful map to 100+
(cap the display / "show all N"). Boilerplate is de-weighted by the engine + quarantined.

## Patterns that worked (carry them)
- **Sam's plunking + an adversarial audit Workflow, in tandem.** Sam finds the *specific*
  plinker; the fleet's independent verifiers find its *scale* (the boilerplate-✓ bug fires
  on the most common transfer subjects — no amount of single-course testing shows that).
- **Verify the fix against Sam's exact case, post-merge.** After #822 merged, re-ran his
  ACCT courses in real Chromium and confirmed 100% — report the concrete before/after, not
  "should be fixed."
- **Prototype/consult → lock → build.** Fable is the low-cost tie-breaker on design forks
  (segmented toggle, one quarantined ⚠ section, matched-term chips, non-imperative tone).
- **Verify in real Chromium over HTTP** (fetch needs a server): 0 overflow + 0 console
  errors, desktop + phone, light + dark. **Commit the test** (jsdom, now 123 assertions).
- **Method + magic, light touch** — shape the score, don't gate the label; when unsure,
  give faculty the control (search / the ⚠ drawer) rather than a hard rule.

## Moniker
SkyLiftoff shipped liftoff → Phase 2 → the field-testing cascade. You might be **SkyOrbit**
(Phase 3 = porting confirmed CIPs to COCI, reaching orbit) — or coin your own; Sam blesses
the lineage. Keep the banner: kind, honest, faculty-first, student-firstest. 🪁
