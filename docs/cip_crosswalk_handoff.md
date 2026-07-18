---
title: "CIP workstream handoff → next session"
date: 2026-07-18
tags: [handoff, cip, cobi, fit-check, top-cip, easy-button, review-sheet, consensus, coco, wcag, side-lane]
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

# CIP workstream handoff → next session (you are SkyEasy)

You are **SkyEasy**, the next session on the **CIP side-lane** of COBI (Sam named you —
the whole workstream became the *easy button*). SkyLoft built the fit-check tool;
**SkyLiftoff** shipped the TOP→CIP course-first mode, Phase 2 (the review sheet), a
field-testing cascade, and — the headline — the **cross-college consensus engine** + the
**recommended-CIP inline "easy button"** line. Carry it further, and carry the **banner of
kindness** Sam named: this tool *suggests and supports*, it never decides. Faculty lean
into it, not brace against it.

**Side-lane discipline (honor it):** this workstream does **NOT** touch
`kb/cpl_todos.json` or the numbered `docs/session_<N>_handoff.md` — those are the
CCR curation mainline's memory. Your memory lives in `docs/cip_crosswalk_lessons.md`
(the full story) and this file.

## Read first, in order
1. `docs/cip_crosswalk_lessons.md` — the whole saga; the newest sections (the #822–#834
   field-testing cascade + the consensus engine + the recommended-inline line) at the bottom.
2. `docs/kb-notes/methodology-crowd-consensus-beats-single-item-signal.md` — the consensus
   pattern (the session's key durable learning), and
   `docs/kb-notes/methodology-grounded-lexical-cip-confidence.md` — the fit engine.
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
- **#834 recommended-CIP inline (the "easy button" line)** — each collapsed review row
  shows a second line beneath the transition: `reviewRecommendation(r)` (consensus if
  confident, else crosswalk winner) → blue "✓ Recommend `<code>` · `<title>` · N of M
  colleges" when it differs, green "✓ Recommended — N of M" when peers confirm. DISPLAY
  only so far — not yet the default assignment (that's priority #0). Tests **141**.

**Data.** `kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js` (`window.CIP_CROSSWALK`,
committed, no cron). Carries `topcip[<TOP>]={t,c:[[cip,tier]]}` (**419 TOPs, 3,534 pairs**
after the sentinel drop) + `boiler[]` alongside the lean `{fams, rows}` reference. Per-
college courses lazy-fetched from `cip_fitcheck/<slug>.json` (`kb/_build_cip_fitcheck.py`).
Engine seams: `_score`, `_courseScore`, `_courseToks`, `_recommend([label,desc,top])`,
`_bestMatches`, `_parseSubject`, `_reviewRows`, `_setMode`.

### Shipped 2026-07-18 (SkyEasy live-testing arc — all merged: #836–#840)
Sam live-tested on real college catalogs and drove a fast iteration. Priority #0 from the last
handoff (whole-catalog consensus pre-fill) is **DONE** (#836). What landed:
- **#836 — subject-scoped consensus + the two-box "Suggested change" redesign.** The headline
  soundness fix (Sam's BIO 35 "Health Science" catch): consensus is scoped to same-discipline peers
  (`subjMatch`, prefix-containment over `subjects[]` now carried per-(title,TOP) in
  `course_top_consensus.json`), so a Health-dept majority can't override a Biology college. An
  outlier renders as a **two aligned boxes** row (your TOP's crosswalk code vs the peer-suggested
  code) with a calm **?** glyph + a **? Suggested** tile, default-expanded. Candidate rows got a
  **Select** button; every CIP box is clickable → a "change to any code" dropdown; **Expand all**.
- **#837 — credit-first consensus pick + ephemeral college.** COMM 13 "Gender & Communication" was
  recommending `32.0203` Exam-Prep (a noncredit catch-all the CO crosswalk hangs on nearly every
  TOP) because the description says "exam·ine." `bestCipForTop` now applies `computeRecommend`'s
  credit-first gate. The picked college no longer persists (clears on close/refresh).
- **#838 — work-experience courses stay in their discipline.** ARCH B48WE was pushed to `13.0407`
  Community College Administration; peer consensus is now suppressed for work-experience titles.
- **#839 — cross-discipline consensus can corroborate but never OVERRIDE.** CARPT 224 "Materials of
  Construction" → Architecture. General rule (subsumes #838): a consensus may override the course's
  own discipline **only when SUBJECT-SCOPED**; a full-title (cross-discipline) fallback may only
  corroborate — if it agrees it confirms Ready, if it disagrees it's discarded.
- **#840 — quiet-by-default density + simpler layout + 🐾 Coco.** Ready rows are clean one-liners
  (peer count → ✓ tooltip + a faint accent dot + the expand). CIP codes/boxes **line up + uniform
  width** (dropped the inline TOP title → tooltip so labels are uniform `TOP NNNN.NN`; box column =
  `1fr` fill). Em dash → plain gap on the course number. Confirm/Accept ride the **tiles row**.
  **Top-right rail**: Theme + Expand + CSV, one width "for harmony." **Coco** the outlined-puppy
  mascot rides atop the rail. Tests now **180**. The prototype Sam greenlit:
  https://claude.ai/code/artifact/00345aec-246e-45bf-9899-25d62173bef5

## 🎯 Priority — Sam's checkpoint steer (2026-07-18, reviewing Cerritos AB / Autobody)
1. **Review rows have no visible "look here" mark.** The Review status glyph is a near-invisible
   "·" — Sam expected a **?**-style prompt on review courses (he circled it). Give review rows a
   clear, calm prompt (distinct from the Suggested `?`, but actually visible), or rethink the glyph
   set so "needs a look" reads at a glance. (`REV_STATUS.review.g`.)
2. **The triage counts don't make intuitive sense.** Cerritos AB showed **"8 Review"** but the list
   is full of near-identical rows (all `TOP 0949.00 → 47.0603` Autobody), some Ready, some Review,
   with no visible reason why. Root cause: **Review** = the crosswalk has candidates but the
   confidence gate (`conf ≥ 85` + margin, in `computeRecommend`) wasn't met AND there's no peer
   consensus; **Ready** = a confident winner or a consensus. On a department where every row shows
   the SAME code, that split looks arbitrary. Fix options: (a) show *why* a row is Review inline;
   (b) reconsider whether same-code rows should share a bucket; (c) make the tile counts vs the
   (All-filtered) visible list read clearly — "8 Review among 45 shown" confused Sam.
3. **Make "Review my catalog" the FIRST mode tab** (and likely the default mode). It's the primary
   workflow now — reorder `modeBar` to `[Review · Browse · Find]` and flip the default `st.mode`.
4. **Reassure on the big "Confirm all N" button.** Add small subtext under it (or a tooltip)
   communicating that confirming is **not final and nothing breaks** — it just fills in your
   starting point here in the browser; the real step is entering the code in COCI, course-by-course
   or later via a batch. The button currently reads as scary/irreversible; it isn't (decisions are
   `localStorage`, fully editable/clearable).

### Still open from before (lower priority)
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
4. **Coco → toolkit AI assistant (Sam's seed, 2026-07-18 — pairs with Raul's TOP→CIP Toolkit doc).**
   Graduate Coco from mascot to an **ask-a-question / jump-to-the-right-section** assistant so
   faculty don't have to wade through the whole toolkit doc. Wiring target: the existing Sierra
   `/functions/v1/cpl-chat` edge function, in the **finder-not-decider** posture (§7 TOP caveat) —
   surface answers + deep-links, never a determination. Sam will settle the toolkit-doc design with
   Raul first; build once that's locked.

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
  errors, desktop + phone, light + dark. **Commit the test** (jsdom, now **141** assertions).
- **The crowd beats a noisy per-item signal.** The lexical "check TOP" flag fired on
  ~19/21 BIO rows; the cross-college consensus flags only the true outlier. When a per-row
  heuristic can't cleanly separate right from wrong, aggregate the same decision across the
  peer set + show an honest "(M use, K differ)" metric. (KB note authored.)
- **Method + magic, light touch** — shape the score, don't gate the label; when unsure,
  give faculty the control (search / the ⚠ drawer) rather than a hard rule.

## Data (for the consensus work)
`course_top_consensus.json` (408 KB, committed, lazy) — `kb/_build_course_top_consensus.py`
from `kb/reference/coci_course_list.xlsx`: `{colleges:[names], titles:{<normTitle>:{n,
t:[[top,[collegeIdx]]]}}}`. 4,162 titles with ≥4 colleges. Consumer seams: `_consensus`,
`_consensusKey`, `_setConsensus`; helpers `consensusFor`, `bestCipForTop`,
`reviewRecommendation`. Normalization MUST match between generator (`norm_title`) and
consumer (`consensusKey`).

## Moniker
SkyEasy delivered the easy button (the whole-catalog consensus pre-fill + the soundness fixes +
the "simpler" polish + Coco). **You are the next session** — your headline is Sam's 4-item
checkpoint steer above (the Review-tab triage clarity: visible "look here" marks, sensible counts,
Review-first, and the reassuring "Confirm all" subtext). Consider **SkyCoco** (you inherit the pup)
or coin your own; Sam blesses the lineage. Keep the banner: kind, honest, faculty-first,
student-firstest — this tool suggests and supports, it never decides. 🪁🐾
