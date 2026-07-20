---
title: "CIP workstream handoff → next session"
date: 2026-07-20
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
inline multi-CIP (#844), opened the **progress-dashboard workstream** with **Phase A baseline status
counts** (#846), reworked confidence scoring (title-match + de-inflation), and — the big one — **renamed the
tool "CIP Coder (Beta)" and shipped the full Review-tab UI redesign** (sticky College+Subject+tiles, white
row gutters, expanded-course "package," the "COCI Sync'd" destination tile) via prototype→port. Carry the
**banner of kindness** Sam named: this tool *suggests and supports*, it never decides. Faculty lean into it,
not brace against it.

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

### Shipped 2026-07-19 (SkyCoco) — six Review-tool fixes from a Claude-for-Chrome live-test
Sam live-tested with **Claude for Chrome** (a browser diagnostician — no repo checkout; it hands findings back
to a Code session). Each verified against source + reproduced headless before fixing (two of six were
mechanism-wrong):
- **F1 box-click safety (the linchpin):** a **✓ Ready** row's box confirms in one click; a **? Review / ◻ Manual**
  row's box now **OPENS the row** instead of validating a weak default (`readyConfirm = r.status==="clear"` →
  `onAccept: openRow`). A stray click meant to expand no longer silently confirms.
- **F3 outside-crosswalk trust:** a `beyond` (outside-crosswalk) match is credible only if its **2-digit CIP
  family** matches the course field OR the peer consensus (`beyondOk` filter in `reviewRowOf`) — the
  two-signals-agree gate (§7) applied to the lexical engine. Kills the "Applied Engineering @100% for Color
  Theory" noise.
- **F5 headline surface (Sam's call):** a bare-review row with a **strong same-family** `beyondOk[0]` (rel≥85)
  shows THAT code as the headline (`sug`, `sugKind:"description"`), still **? Review** — e.g. Ceramics I →
  **50.0711 Ceramic Arts** instead of the generic 50.0401. Shielded from the dept-default swap; honest why-line.
- **F4 majority honesty:** "most use" / the "peer consensus" badge now require a **strict majority**
  (`modal.n*2 > cons.n`); a tie/plurality reads "the most common is … no majority" / "most common · N of M".
  **Display only** — the pre-fill gate is untouched, so the Phase-A baseline counts don't move.
- **F6 cleanup:** drop the stale `cipx_college` localStorage key (college is intentionally ephemeral).
- **F2 non-bug:** confirmations persist across mode switches (verified); "N peer-corroborated" is a data
  property, not progress.

Seams touched: `reviewRowOf` (`beyondOk`/family guardrail + headline surface), `effectiveSug` (skip dept-default
when `sugKind==="description"`), `reviewWhy` (description branch), `reviewExpand` (uses `r.beyondOk`),
`consensusSummaryEls`/`peerConsensusBlock` (majority wording+badge), `reviewRow` (box `onAccept`/`openRow`).
Tests **213 → 220**; real-Chromium (Chabot·ART) desktop+phone, light+dark, 0 overflow / 0 console errors.
**Follow-up worth noting:** the same family guardrail could be applied to **Find-my-course** mode's outside-crosswalk
list (left raw there — it's the exploratory description-fit view; F3 fixed the Review surface that drives a saved decision).

### Shipped 2026-07-19 (SkyCoco) — the confidence-scoring rework (Chaffey BIOL live-test)
The confidence numbers were the story. All in `computeRecommend`; diagnosed with a `vm`-context kb diagnostic on
BIOL 2/3/10/42L/63/98C before touching code:
- **Title-match signal** (Sam's key insight): a dedicated course-title↔CIP-title score (`titleHit`, IDF-weighted;
  `TITLE_BOOST` in the ranking) + a **generic-qualifier stoplist** (`_titleStop`) so the same-title code wins
  (BIOL 2 → 03.0104 Environmental Science, not Climate Science; verbose titles match on substantive terms).
- **De-inflated ABSOLUTE confidence:** `confOf = min(0.95, 0.80·titleSim + 0.60·coverage)` — obvious pick = 80%,
  capped 95 (no false 100%). `tierOf` recalibrated (≥75 Strong / ≥45 Plausible).
- **Crosswalk stays primary (F5 reverted):** the outside match is a **"worth a look"** hint (`beyondOk`), never
  the headline. A **beat-the-crosswalk gate** (`o.conf > bestCandConf`) kills the generic-title flood.
- **Ready/Review gate kept RELATIVE** (`relConf`) so the display de-inflation didn't collapse the baseline — held
  the swing to ~15% (Chaffey Ready 594→508), not 47%. **`cip_status_counts.json` regenerated** (a real baseline
  shift — Ready down / Review up one notch — flagged to Sam).
- **College glyph deleted** (Sam) — the institution icon by "Your college".
Constants: `TITLE_BOOST` / `CONF_TITLE_W` / `CONF_COV_W` / `BEYOND_CONF_MIN` (top of the file, next to `COV_K`).

### Shipped 2026-07-20 (SkyCoco) — the Review-tab UI redesign (prototype → port)
Sam co-designed the whole look in a fast-feedback artifact
([final](https://claude.ai/code/artifact/4369b106-abe8-4149-abf6-571d325bf508)), locked it, and said "get
this into prod." Ported into `cip_crosswalk.js`; jsdom **226** CIP assertions / 166 files + real-Chromium
(Chaffey BIOL, light/dark/phone, 0 overflow / 0 errors):
- **Sticky College + Subject + count-tiles.** `.cipx-collegebar` pins `top:0`; the tiles ride in their own
  list-sibling host `.cipx-rev-tileshost` (NOT the short summary host — a sticky element unsticks when its
  parent scrolls past) pinned at `top:var(--cipx-cbh)` = the college bar's **measured** height
  (`syncStickyOffsets()`, rAF+resize; jsdom height-0 guarded). Switch subjects/colleges without scrolling up.
  Prod is body-scroll + non-sticky masthead → `sticky;top:0` pins to the viewport (verified in `index.html`).
- **White row gutters + faint list field** (`--cipx-row-sep` white/slate, `--cipx-rev-field`) — the prototype's
  white gutter washed out on cream, so the list got a subtle field to make it pop; each brown note now brackets
  with the course **above**. **Expanded course = "package"** (`.cipx-rev-item-open`: accent spine + framed top + tint).
- **"COCI Sync'd" destination tile** — non-functional preview (dashed, count 0, "In Development") on both tile
  rows, so tiles read as the pipeline **All → Review → Ready → COCI Sync'd**.
- **Header:** title **"CIP Coder"** + `.cipx-beta` badge; eyebrow gains **Academic Affairs**; intro trimmed to
  "A simplified process supporting the Fall 2026 TOP → CIP transition… soon, sync your settled codes straight to
  COCI." Mode-tab **glyphs removed**; **Department → Subject**; tiles centered; Subject dropdown widened; **Manual
  tile hidden when 0**.
- **Held for a scoped follow-up (flagged to Sam):** the prototype's **% inside the box** — the real `cipBox` has
  more states (two-box Suggested, multi-CIP stacks) and keeps confidence in the expanded meters; adding it risks
  clutter. Easy add if Sam wants it.

**Method:** the `vm` diagnostic dumping cands (conf/boosted/score)+beyond for the curator's own courses is the
tightest calibration loop; and read the *dashboard's* scroll model (not just the tab) before committing to sticky.

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

### Shipped 2026-07-20 (SkyCIP) — CfC round 2: the strong-own-fit veto (F1–F5)
A fresh Claude-for-Chrome autonomous pass returned a ranked laundry list; its dominant theme (F1–F5)
was one root cause: a confident **peer consensus** overrode the headline even when the course's own
description/title fit a different code far better (CCSF "Intermediate Voice" → peers' Musical Theatre
13% over own-fit Voice & Opera 95%; ARC "Drawing" → Fine/Studio Arts 0% over Drawing 41%). Sam's call:
**strong own-fit wins, margin-gated.** Fix in `reviewRowOf` (nested inside the override branch):
`ownBest` (max `.conf` over cands+beyond) vs `peerConf`; veto when `ownBest.conf ≥ OWN_FIT_MIN(40)` &&
different code && margin `≥ OWN_VETO_MARGIN(30)` → keep own-fit as headline, flag **Review**, set
`ownFitVeto`/`peerAlt`, keep `cp` as a demoted note. Calibration crux: de-inflated conf reads Drawing
at 41%, so the **margin** (own-fit beats a near-zero peer pick) does the work, not an absolute-strong
floor. `vm`-diagnostic proof it's surgical: 3/44 ART, 1/78 MUS, 1/28 BIOL vetoed, **0 NURS / 0 AUTO**
(good peer corrections untouched). Tests 226→**229**; real-Chromium CCSF MUS 10C verified. Full story:
`cip_crosswalk_lessons.md` (2026-07-20).

**CfC list — batch 2 SHIPPED (F6–F10, clear fixes):** **F6** the Browse "Closest matches" finder now
only fires for multi-word phrases (a single keyword is a list filter) → no more duplicate rows / count
mismatch; **F10** Manual why-line names the crosswalk code as a starting point instead of claiming "no
code"; **F7** the Finder lead names a strong top candidate ("close call") instead of "no front-runner"
at 95%; **F9** the peer-corroborated ✓· now carries ", peer-corroborated" in its aria-label; **F8** the
▾ change hit-target enlarged so aiming for it no longer lands on the box body (= confirm). **F12**
(two-box display) BY DESIGN — no change. **CfC list now fully triaged.**

**CfC list — FULLY SHIPPED.** F1–F5 (veto #856), F6–F10 (#857), F11 mobile real estate + the ▾-OKs-CIP
bug (#858), and the ▾ change-panel now closes on click-away (this session). Live-tested clean on phone
(Riverside/Allan Hancock) — Sam: "clean baby."

**🎯 TOP QUEUED — bulk CSV export ("Select All" + CSV-on-open) — Sam requested, scope decision OPEN.**
He wants an **"All colleges"** option (Subject already has "★ All subjects"), the **CSV button visible on
tab open**, and to **export a big dataset**. I raised the architectural fork; Sam **dismissed the question**
(deferred). Crux: **all colleges × all subjects ≈ 131,715 courses** computed LIVE in-browser (+~50MB
fitcheck) would freeze/crash the tab. **Unambiguous — just build:** CSV button always visible on open +
add the "All colleges" dropdown option. **Needs Sam's pick (the open call):**
1. **Live, up to one college** — export the current selection live; one college's full catalog (~2,500) is
   the max; "All colleges" prompts to narrow. Fast, no pipeline.
2. **Precomputed statewide file (rec. for "everything")** — server-side build (like the daily baseline
   counts) emits the full all-colleges dataset → "Download full statewide (~131,715)" instant file. Needs a
   workflow + daily refresh.
3. **Live, all colleges** — live compute for any subject scope + progress bar + warning; cap all×all.
   Full story: `cip_crosswalk_lessons.md` (2026-07-20, last section).

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
**SkyCoco → SkyCIP** — Sam christened the session **SkyCIP** on shipping CIP Coder (Beta). It cleared the
Review-tab legibility steer, reworked confidence scoring, shipped the whole UI redesign (prototype→port),
and kept the pup. **You are the next session** — coin your own (Sam blesses the lineage) or keep carrying
Coco. Keep the banner: kind, honest, faculty-first, student-firstest — this tool suggests and supports, it
never decides. 🪁🐾

_Deploy note (2026-07-20): #851 merged clean but the site lagged on a transient GitHub Pages **503** — the
deploy step only, build was fine. Fixed by a fresh `workflow_dispatch` of `pages.yml` (NOT
`rerun_failed_jobs` — that dupes the `github-pages` artifact). If a merge ever looks live-but-stale, check
the "Deploy Pages (lean)" run first: `docs/kb-notes/playbook-github-pages-manual-redeploy.md`._
