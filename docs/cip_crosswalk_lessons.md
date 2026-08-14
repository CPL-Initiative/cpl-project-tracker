---
title: "CIP Crosswalk tab + the CIP site (lessons)"
date: 2026-07-14
tags: [lessons, cobi, org-layer, cip, top-cip, crosswalk, transition, coci, suggest-to-curate, chancellors-office]
artifacts:
  - cip_crosswalk.js
  - cip_crosswalk_data.js
  - kb/_build_cip_crosswalk.py
  - kb/reference/cip_searchable_260708.xlsx
  - kb/supabase_cip_crosswalk_suggestion.sql
  - cobi_orgs.js
  - coci_lookup.js
  - tests/cip_crosswalk.test.js
related:
  - "[[co_platform_orglayer_lessons]]"
  - "[[co_platform_strategy]]"
  - "[[adr-cobi-org-layer]]"
  - "[[CLAUDE]]"
---

> **Earlier sections archived.** The 2026-07-14 → 2026-07-17 build-out — Origin,
> what first shipped, the StarCIP "easy button" prototype, the SkyLoft port to
> production, and the SkyEasy Review-tab v2 — moved verbatim to
> [`cip_crosswalk_lessons_archive.md`](cip_crosswalk_lessons_archive.md) on
> 2026-08-14 (the doc had crossed its size budget and this checkpoint needed to
> append). Those phases are shipped and settled; read the archive only for the
> reasoning behind a decision you are about to change.

## 2026-07-28 — SkyLark: the CO-handoff enhancement series (Raul + Jenni)

Sam brought a batch of feedback from **Raul and Jenni at the CO** who will **own the tab** once it's
finalized. Seven asks + two rules he added mid-stream. Shipping as a short series of focused PRs.

**Design calls locked with Sam (AskUserQuestion):**
- Programs curation = a **Courses ⇄ Programs toggle**, and it sits **top-level, above the mode tabs**
  (Sam's steer) — the modes shift under it (Programs = Review + Browse; a "Find my program's code" easy
  button can follow). The CO audience decides "courses vs programs" first.
- The CIP-count rule is **enforced with a clear reason** (not just a warning).

**Data facts established (recon):**
- **Programs already carry a college-assigned CIP.** `coci_programs_data.js` rows = `[collegeIdx, ctrl,
  title, top, cip, awardIdx, statusIdx, units, xfer]` — the CIP is `row[4]` (from the COCI program export's
  `CIP CODE` column). GOAL encodes CTE: **16,890 "C - CTE" + 678 "CT - CTE and Transfer"**. So the Programs
  view can render assigned-CIP + CTE + a mismatch flag now; the **old (first-gen) program crosswalk** is
  what Sam is requesting from the CO to pinpoint which assigned CIPs need revising to the new crosswalk —
  build the interim flag (assigned CIP ∉ current crosswalk for its TOP) with a seam for the old map.
- **Course-level CDCP DOES exist** (Sam's key worry — some courses in a CDCP program aren't themselves
  CDCP). `coci_course_list.xlsx` `CreditType` = **"…Enhanced Funding"** IS the course-level CDCP flag,
  **independent** of the program: e.g. "Short-term Vocational" splits 2,334 Enhanced-Funding (CDCP) vs 897
  Non-Enhanced (not CDCP). Values: `Credit Course` (105,402) · `Other Noncredit Enhanced Funding` (5,052)
  · `Non-Enhanced Funding` (4,298) · `Workforce Preparation Enhanced Funding` (2,085). CDCP = the two
  Enhanced-Funding types. `Non_Credit_Category` gives the noncredit category. **CDCP = higher apportionment
  ("Special Populations")** — good tooltip context.
- **CIP taxonomy category** `rows[].cat` ∈ CTE / **Both** / Non-CTE / Noncredit (+ Retired/Reserved) — drives
  the "choose CTE-use when Both" step and the bold CTE chip. 50 families, 2,325 codes; the workbook has
  2-digit family titles + 6-digit code titles but **no 4-digit series titles** (so the 4-digit dropdown
  labels by code + count — grounded, no hallucination).

### PR #915 (SkyLark) — 2/4/6-digit filters + prominent CTE chip + rename
Browse mode: three cascading CIP-code dropdowns (2-digit sector · 4-digit sub-series · 6-digit code),
**leftmost + most prominent** (accent-bordered group), each with a "Select All (all-…)" option at the top.
Fills are structural (independent of category/xfer/search), respecting the retired toggle; picking a sector
narrows the sub-series and code lists. CTE chip → **bold + bordered** (`--cipx-cte-stripe` token, weight 800)
so it reads as the big factor. Rename → **"California Community College Searchable CIP Code Taxonomy"**
(Jenni). **Mobile hunt (worth remembering):** three separate causes stacked up —
(1) selects with long option text need `min-width:0` to stack; (2) the mobile `.cipx-row` rule reset the
title track to `1fr auto`, so badges competed → moved `.cipx-tags` to a wrapped 2nd row + `minmax(0,1fr)`;
(3) the real killer was a single **unbreakable slash-joined CIP title**
("Electroneurodiagnostic/Electroencephalographic…") → `overflow-wrap:anywhere` on `.cipx-ttl`. Diagnose phone
overflow by measuring the `.cipx` container's own `scrollWidth`, and scan for the element with the largest
`scrollWidth − clientWidth` (an element within the viewport can still carry internal overflow — native
`<select>`s and nowrap text don't show up in a "right edge past viewport" scan). Tests 266; 0 overflow
desktop+phone, both themes.

### PR #917 (SkyLark) — crosswalk-only alternatives (Sam's "no free range" rule)
The tension Sam named: TOPs are unreliable (§7), so we can't hard-lock to the course's own TOP crosswalk,
but we also don't want free-ranging the full 2,325-code taxonomy. **Resolution (Sam's refinement): every
presented CIP is in the crosswalk under *some* TOP; when the course's own TOP fits poorly, surface crosswalk
CIPs from *more-appropriate* TOPs, each labeled `↔ TOP N` + "your TOP may need updating."** Built off the
existing `CIP_TOPS` inverse map: helpers `inXwalk` / `altTopsFor` / `xwalkAlts`. `beyond` now requires
`inXwalk` (a code in NO TOP's crosswalk is dropped entirely); the recommend "outside the crosswalk" drawer +
the no-crosswalk/only-generic fallbacks + the review closest-by-description fallback + the ⚑ mis-code flag
are all crosswalk-constrained and source-TOP-labeled. Tests 270 (+6). **Method that carries: turn the
unreliable-TOP problem into a feature — the alt-TOP surface IS the mis-code nudge.**

### Still open (this series)
- **PR3 — course CIP caps + CDCP + CTE-choice for "Both" + course titles/rows.** Enforce credit=1 /
  noncredit-CDCP=2 (CDCP from `CreditType` Enhanced Funding — needs a fitcheck-data regen to carry a credit
  flag on each course tuple). When a "Both" CIP is assigned, require a CTE / Non-CTE use choice, stored with
  the assignment. Bold CTE chip already global (PR #915). **Open Q for Sam:** constrain the manual
  "+ Add another code" search to the crosswalk too, or keep it open with an "outside crosswalk" flag?
- **PR4 — the Programs curation toggle** (top-level Courses/Programs). Program rows: title + award +
  college-assigned CIP + bold CTE (GOAL-derived) + a "needs revision" flag when the assigned CIP ∉ the
  current crosswalk for its TOP (interim; wire the old crosswalk when Sam supplies it) + the CTE/Non-CTE
  choice for Both.

### PR #919 (SkyLark) — credit-type CIP caps + CDCP + CTE/Non-CTE choice for "Both"
Two COCI rules for the Review tool. **(1) CIP count by credit type (Raul):** credit=1, noncredit=1 UNLESS
CDCP=2. CDCP is a COURSE-level property (Sam's key catch — a course in a CDCP program can itself be
non-enhanced-funding), read from the course's own `CreditType`. `kb/_build_cip_fitcheck.py` now emits a 4th
tuple element (`C`/`D`/`N`/absent; 7,029 CDCP · 99,945 credit · 4,064 noncredit · 20,677 blank). The Review
tool shows a credit-type label + an active "+" only for CDCP-under-cap, else a disabled "+"; a 1-CIP course
REPLACES on a new candidate pick (never accumulates); the add-picker, manual search, and apply-to-siblings
all respect each course's cap. **(2) CTE/Non-CTE choice (Jenni):** a "Both"-category assigned CIP surfaces a
CTE/Non-CTE toggle → `cipx_revcte_<college>`. **⚠ Bug caught (worth remembering):** the credit flag lives in
tuple slot `[3]` — the SAME slot `courseToks` used for its token-memo cache — so `courseToks` would have
returned the flag as "tokens," silently corrupting all fit-check scoring. Fixed by moving the cache to slot
`[4]`; guard test added. **Lesson: when adding a field to a shared array tuple, grep for every `c[N] =` cache
write on that tuple first.** Tests 270→275; real-Chromium review+recommend clean on the 4-element data.
`cip_status_counts.json` NOT regenerated (credit flag doesn't affect classification).

### PR4 — the Programs curation toggle (STILL OPEN, the headline / ask #1)
**Design (locked with Sam):** a **top-level Courses ⇄ Programs toggle ABOVE the mode tabs**; when Programs is
selected the mode tabs become **Review my programs + Browse codes** (Find-my-program deferred). Data is
READY: `coci_programs_data.js` (`window.CPL_COCI_PROGRAMS`) — `rows[]=[collegeIdx,ctrl,title,top,cip,awardIdx,
statusIdx,units,xfer]`, i.e. each program's **college-assigned CIP is `row[4]`**, TOP `row[3]`, title `row[2]`.
GOAL-derived CTE isn't in this dataset yet — `_build_coci_programs.py` drops GOAL; to show the bold CTE chip
on program rows, re-emit a CTE flag from GOAL ("C - CTE"/"CT..." → CTE) in the builder (small change + regen
of the ~2.4MB `coci_programs_data.js`). **Program review view (per college):** group by subject/award; each
row = program title + award + assigned CIP (bold CTE chip) + a **"needs revision"** flag when the assigned CIP
is NOT in the current authoritative TOP→CIP crosswalk for the program's TOP (interim — use the same `inXwalk`/
`topcip` logic from PR #917; the assigned CIP was set per the OLD first-gen crosswalk, so a mismatch = revise
to the new crosswalk's CIP). **Seam for the old crosswalk:** Sam is requesting the old program crosswalk from
the CO — when it lands, add it as a data file and flag specifically the CIPs the old map produced that differ
from the new map (more precise than "not in current crosswalk"). Reuse the **CTE/Non-CTE choice** (PR #919
`revCteChoice`) + the **crosswalk-only alternatives** (PR #917 `xwalkAlts`) for programs. Programs get 1 CIP
(the cap rule is course-specific). Titles in the program picker + rows (ask #5-program). **Open Q (from #917,
unanswered):** constrain the manual "+ Add another code" search to the crosswalk?

### PR #923 (SkyLark) — Programs curation: the top-level Courses/Programs toggle (ask #1) — SHIPPED
The headline. **Top-level Courses ⇄ Programs toggle ABOVE the mode tabs** (`scopeBar`, `st.scope`); Programs
scope → mode tabs become "Review my programs" + "Browse". Program review (`programsView`/`programRow`) is
per-college with its OWN college selector (program-export names differ from the fitcheck names — don't reuse
the course college bar). Each program: title + award (truncated + tooltip — award names like "Certificate of
Achievement: 12 to fewer than 18 semester units" are verbose and blew past the viewport on phone) + assigned
CIP (`row[4]`) + bold CTE chip (`row[9]` from the GOAL→CTE builder tweak) + category chip. A program whose
assigned CIP ∉ the current crosswalk for its TOP is flagged **⚑ needs revision**; the revise picker offers
ONLY the crosswalk CIPs for that TOP (`TOPCIP[top].c` — rule #7). Search + "needs revision only" filter;
flagged first. Choices persist in `cipx_prog_<collegeIdx>` (`{ctrl:{cip,cte}}`); CTE/Non-CTE choice for Both
reused. Real cases surfaced immediately (Alameda ESOL programs coded `32.0108` under a TOP the current
crosswalk maps elsewhere). **Seam reserved** for the OLD first-gen program crosswalk (Sam requesting from CO)
→ flag exact old→new diffs. Tests 275→292; real-Chromium Alameda (113 programs, 5 flagged) desktop+phone 0
overflow. **Lesson: two independent college-name vocabularies (fitcheck vs program-export) → give each surface
its own selector rather than forcing a fragile name match.**

### Series complete (2026-07-28, SkyLark) — all 6 asks + 2 rules + rename shipped
#915 (2/4/6-digit filters + bold CTE + rename) · #917 (crosswalk-only alternatives / more-appropriate-TOP) ·
#919 (credit-type caps + CDCP + CTE-choice for Both) · #923 (Programs toggle). Docs checkpoints #918/#920/this.
**Remaining follow-ups (all noted to Sam, none blocking):** (1) the OLD first-gen program crosswalk (Sam
requesting) → precise old→new revision flags; (2) the open manual "+ Add another code" free-search scope
question (crosswalk-limited vs open) — unanswered, applies to the COURSE review only; (3) optional
program-first "Find my program's code" easy button. New KB note: `reference-cdcp-and-the-cip-count-rule.md`.

## 2026-07-29 — SkyMark: 4 curator tweaks (Programs polish + a grounded 4-digit-title seam) — #926

Sam (from Raul + Jenni) sent 4 more tweaks off SkyLark's series. All landed in **one PR (#926, MERGED)** —
`cip_crosswalk.js` + `kb/_build_cip_crosswalk.py` + tests, **0 HTML** (no Rule-4 mirror). Adversarial review
before merge caught one real edge, fixed in a follow-up commit on the same PR.

**T1 — Programs toggle leftmost.** `scopeBar()` array reordered to `[["programs","Programs"],["courses","Courses"]]`.
Default *selection* deliberately left as `courses` (Sam asked to move the toggle position, not change the default).

**T2 — hide the duplicate college selector in Programs review.** Root cause confirmed: `rebuildShell()` appended
the course `collegeBar()` unconditionally (L2550), AND `programsView()` builds its OWN `.cipx-collegebar` (L1471,
because program-export college names differ from the fitcheck names), so Programs review showed TWO selectors.
Fix: `if (!programsReview) wrapEl.appendChild(collegeBar())`. Guarded on `programsReview` (scope=programs &&
mode=review) ONLY — Programs + Browse has no duplicate and its inline "check a course" feature depends on the
course bar, so it must keep it. `syncStickyOffsets` is null-safe on a stale/absent `collegeBarEl` (height 0 → no-op).

**T3 — Programs grouped by CIP sector, ascending.** `repaintProgList()` rewritten: group `shown` by the 2-digit
sector of the *chosen* CIP (`progCip`), sectors ascending, rows within ascending by full CIP code then title, a
`.cipx-prog-sector` header per group (code + `FAMS[sec]` family title + count), a "No CIP assigned yet" group last.
The old *flagged-first, then alphabetical* order is replaced (per Sam) — findability of needs-revision rows is
preserved by the retained red flag styling + the "Needs revision only" toggle (which pre-filters, max 34 flagged at
any college << the 400 cap). Sector titles come **only** from `FAMS` (grounded), fallback "CIP sector NN".

**T4 — 4-digit CIP series titles: a grounded seam that ships INERT.** The ask: put the NCES 4-digit *series* titles
in the Browse 4-digit dropdown (today it labels "51.38 · N codes"). The blocker + the decision are the real lesson:
- The CCCCO workbook (`cip_searchable_260715.xlsx`) is exported **6-digit-only** ("Level = 6 Digit - Specific",
  2,325 rows; 0 two-/four-digit rows) — so it has 2-digit family titles + 6-digit code titles but **no 4-digit
  series titles**. The official NCES all-levels CIP file DOES carry the 4-digit rows; our export just dropped them.
- **Sourcing attempts, all dead ends from the sandbox:** nces.ed.gov = **egress-policy-blocked** (403 CONNECT,
  non-retryable per the proxy README); no committed lossless CIP-**2020** GitHub raw mirror (SaiTeja/datamade/
  RVA repos only *reference* the file; jbryer/ipeds has it but it's **CIP-2010** AND stores `CIPCode` as a **lossy
  number** — `1.01`, trailing zeros dropped → 4-digit/6-digit collisions); no PyPI package.
- **The call (grounding doctrine):** the whole tool is "grounded, no hallucination" — so I **refused** to inject
  CIP-2010 or WebFetch-summarized (model-paraphrased) federal title strings. Instead I built the **seam**: builder
  `load_sub4(codes)` reads an authoritative file from `kb/reference/` (`cip_series4_titles.json` OR the NCES
  `CIPCode2020.csv`/`.xlsx`), keeps only 4-digit prefixes present among the built codes, strips trailing periods;
  emits `sub4` **only when non-empty** so a no-source rebuild is **byte-identical** (verified — `git diff` clean).
  Consumer `fillCip4()` shows `"NN.NN · <title> · N codes"` when `SUB4[k]` exists, else the prior label.
- **To finish it:** drop the official NCES all-levels CIP-2020 export (with the 2-/4-digit rows) into
  `kb/reference/` and re-run `python kb/_build_cip_crosswalk.py` — the titles light up. Same "source the
  authoritative file from the CO" pattern as the old first-gen program crosswalk. **Reusable lesson: when the
  only reachable source for grounded reference data is stale-edition or lossy or a summarizer, build the
  populate-on-file-drop seam and name the exact file — never fabricate the data to avoid an empty deliverable.**

**Adversarial review (3-lens workflow → adversarial verify) before merge — earned its keep.** Correctness /
doctrine-UX / regression lenses; 3 raw findings all pointed at ONE thing, split 1 CONFIRMED / 2 REFUTED: the
T3 sector header was appended **before** the per-row 400-cap check, so if the cumulative render count hit exactly
400 at a sector boundary, the NEXT sector rendered an **empty labeled header** (count, 0 rows). The refuters proved
it doesn't reproduce on *today's* data (the 400th row lands in the trailing no-CIP bucket for all 12 colleges with
>400 programs) — but the program data is **regenerated daily**, so I fixed it defensively: move the `shownCount>=400`
guard to the TOP of the sector loop (emit a header only when ≥1 row will render under it); drop the `capped` flag;
the "first 400" note keys off `shownCount < shown.length`. New jsdom guard: a 400-in-sector-01 + 3-in-sector-52
fixture proves the sector-52 header is omitted (not empty) at the exact boundary. **Method carried: "doesn't
reproduce on current data" is not a fix when the data regenerates daily — guard the code path.**

**Verification.** `cip_crosswalk.test.js` 292 → **302** (scope order, single college bar, sector grouping +
ascending, the cap-boundary empty-header guard, `sub4` dropdown title + grounded fallback). Full suite 173 files
green. Real-Chromium over HTTP (a preload-`_setPrograms`-then-activate harness, since the real tab lazy-loads
`coci_programs_data.js` async): desktop + phone, light + dark — Programs leftmost, exactly ONE college selector,
39 ascending sector headers with real family titles, **0 empty headers** on Mt. San Antonio's 542 programs, 0
horizontal overflow, 0 console errors (favicon 404 only). Byte-identical `cip_crosswalk_data.js` (code-only PR).

**Still open (unchanged from SkyLark, none blocking):** the OLD first-gen program crosswalk (Sam sourcing from CO);
the manual "+ Add another code" free-search scope question (crosswalk-limited vs open-with-flag — Sam's call);
optional program-first "Find my program's code" easy button; the standing WCAG pre-field gate + Phase B backend.
Side-lane discipline honored: left `kb/cpl_todos.json` + the numbered `session_<N>_handoff.md` untouched.

## 2026-07-29 cont. — SkyMark: the CO files landed → tweak 4 + the 2021 crosswalk shipped (#930, #932)

Same day, Sam supplied the two reference files the seams were waiting on. Both merged, both live.

**#930 — the 4-digit series titles (finishes tweak 4).** The `sub4` seam (builder `load_sub4()` +
consumer `fillCip4()`) had shipped inert in #926 because no authoritative source was reachable from the
sandbox. Sam dropped the official **NCES all-levels `CIPCode2020.csv`** into `kb/reference/` — and it's
exactly the right shape: **string-coded** (`="01.01"`, lossless — no leading/trailing-zero collisions
like the jbryer CIP-2010 mirror had) with **473 four-digit series rows** carrying titles (the 2-/4-digit
rows the CCCCO workbook was exported without). `load_sub4` parsed it unchanged — my `_norm_cip`
(`lstrip("=").strip('"')`) already handled the Excel text-guard, and the prefix-filter kept only series
present among the built codes. Regenerated → 473 titles; spot-checks perfect (51.38 → "Registered
Nursing, Nursing Administration, Nursing Research and Clinical Nursing"). Browse 4-digit dropdown now
reads `NN.NN · <series title> · N codes`. **The populate-on-file-drop seam paid off exactly as designed:
one `cp` + one builder run, zero code change.**

**#932 — the 2021 first-gen crosswalk (finishes the old→new program-flag follow-up, the handoff's
reserved seam).** Sam supplied `topcip_2021_crosswalk.xlsx` (sheet "TOP-CIP raw data": TOP Code · TOP
Title · CIP Code[dotless] · CIP Code[dotted] · CIP Title · Change/Addition). Builder `load_old_topcip()`
→ `oldtopcip[<TOP NNNN.NN>] = [old CIPs]`. **The join key was the crux:** the old file strips TOP leading
zeros + the `.00` (`"101"` = 0101.00, `"102.1"` = 0102.10), so `topnorm` = `left.zfill(4) + "." +
(right+"00")[:2]`; CIPs come from **col D** (dotted, `"1.0102"`) through the existing `canon()`. Result:
**401 TOPs / 772 pairs, 100% join** the current topcip keys (validated before wiring — the join is the
whole feature, so I proved it in a scratch script first). Consumer: the needs-revision message branches on
`OLDTOPCIP[top]` — *was a 2021 value the crosswalk changed* / *off both maps* / *no 2021 data → generic
fallback*. **Design decision (flagged to Sam): ENRICH, don't change the trigger** — the flag still fires on
"assigned ∉ current crosswalk" (unchanged counts), the 2021 map only sharpens the *why* + keeps the revise
picker current-crosswalk-only. This matches the handoff's stated seam ("flag specifically the CIPs the old
map produced that differ") and avoids surprising the baseline. Guarded with `OLDTOPCIP[top]` presence so a
TOP with no 2021 data falls back to the prior message (no false "not in 2021" claims).

**Real-data finding worth carrying:** on Mt. San Antonio's 13 flagged programs, only **4** were
"crosswalk changed" (a 2021 value the current map dropped) — **9** were **off BOTH maps** (the college
assigned a CIP that was never in the 2021 *or* the current crosswalk for that TOP). So the dominant
revision driver isn't crosswalk drift, it's original off-crosswalk coding — the enriched message makes
that visible, which the old "not in the current crosswalk" wording hid.

**Methods reused:** (1) *prove the join in a throwaway script before wiring* — 100%-join + real old→new
deltas (TOP 4930.00: old 24.0102 → current 24.0101) confirmed the normalization before a line of consumer
code; (2) *committed-only artifact* — no workflow rebuilds `cip_crosswalk_data.js`, so the regenerated file
is committed in each PR (verified no cron owns it); (3) two focused PRs (data-populate, then the feature)
off sequential mains so each regeneration is clean. Tests 302 → **305**; real-Chromium verified both.
Side-lane discipline honored: left `kb/cpl_todos.json` + the numbered `session_<N>_handoff.md` untouched.

---

## 2026-08-11 (SkyMap) — Jenni + Raul's three asks: the crosswalk was never single-valued, the UI was

Sam brought three items of Chancellor's Office feedback from **Jenni and Raul**, who will own the tab. All
three shipped in one PR against `cip_crosswalk.js` + `tests/cip_crosswalk.test.js` (no HTML, no data
rebuild). Tests **305 → 322**.

### 1. The intro promised a COCI sync that does not exist

Jenni: *"I don't understand the 'sync' — can they upload directly from this page?"*

**They cannot, and that is the whole finding.** The copy read *"soon, sync your settled codes straight to
COCI"*; the Tech Center batch/API push is **Phase B** (`cip_submission_access_plan.md` §3c), unbuilt. A
reader cannot tell a roadmap item from a feature when both are written in the present tense with a "soon"
in front. Her own proposed first half was adopted nearly verbatim (*"Start from one of your current TOP
codes, get a list of approved CIP codes that map to the TOP code, and confirm the fit"*) — note that her
wording is **TOP-first and plural**, which is the same mental model as her third ask. The second half now
states today's truth (*your work stays in this browser · your college enters the codes in COCI · there is
no upload from this page*) and marks the future as future.

### 2. "This CIP is Both — use as:" described the code instead of asking the college

Her replacement: *"This CIP can be either CTE or Non-CTE. Select the designation your college will use for
this program/course."* Adopted, specialised per surface (`…for this program.` on a program row, `…for this
course.` in the course chip's tooltip — the chip is inline and has no room for a sentence). The old label
also rode a `.6rem` uppercase chip style, which is why it rendered as `THIS CIP IS BOTH — USE AS:`; the
program row now gets a sentence-case, wrapping label.

### 3. The headline: Child Development looked like it mapped to one CIP. It maps to 17.

Jenni: *"Most of the Program TOP codes have more than one CIP it can map to. We should be able to see all
the options for all codes… The list only shows it mapping to a single CTE CIP code (19.0709). In many
cases, colleges need to use CIP 19.0706 (not-CTE)."*

**The data was always right — `topcip["1305.00"]` held all 17 codes.** The bug was that `programRow` built
its revise picker *inside* the `if (needsRev)` branch. A program whose assigned CIP is in the crosswalk is
not flagged, so it rendered one code and **no affordance whatsoever**. Measured blast radius:

- **381 of 419 TOP codes (91%) map to more than one CIP** — median 5 (median 3 excluding the two universal
  noncredit boilerplate codes). Single-valued is the exception.
- **600 programs statewide sit on TOP 1305.00**; **205 are assigned `19.0709`** (valid, CTE, therefore
  unflagged, therefore no picker) against **60 already on `19.0706`** (Non-CTE) and 139 on `13.1210`.

So the exact population Jenni is trying to move — CTE → Non-CTE as the designation changes — was the
population the UI had no path for. The durable form of this is
[`methodology-an-affordance-gated-on-a-problem-is-invisible-when-there-isnt-one`](kb-notes/methodology-an-affordance-gated-on-a-problem-is-invisible-when-there-isnt-one.md):
**gate the warning on the problem, never gate the choice.** The needs-revision flag now decides only
whether the list opens *expanded*.

Every program row carries `▸ All N approved CIP codes for TOP nnnn`, expanding to every crosswalk code
ascending by code — the Chancellor's Office's own table order — each with its **CTE / Non-CTE / Both /
Noncredit designation** (without which the CTE→Non-CTE decision cannot be made from the list), a
field-submitted marker where the pairing came from the field, peer-college usage, an `IN COCI` marker on
the code the college actually holds, and a `changed from <code>` chip once a curator picks something else.
Re-selecting the assigned code **clears** the override rather than recording a no-op revision.

### 4. The nav — Sam: "these labels are a bit confusing"

Same session, a fourth item. The tab had a two-level nav: `Code my: [Programs][Courses]` above
`[Review my catalog][Browse codes][Find my course's code]`. In Programs scope the word **Programs
appeared twice in a row**; in Courses scope, "Courses" sat directly above "Review my catalog".

Sam proposed deleting "Review my catalog" and renaming the scope tabs to *Review my Programs* /
*Review my Courses*. Right instinct, wrong lever — it breaks the moment you leave Review: the scope
tab would go on asserting **"Review my Courses" while you were browsing**, `Code my: Review my
Programs` doesn't parse, and **Browse is scope-free** (the whole 2,325-code taxonomy — nothing to
do with programs vs courses).

**The structural finding: the scope only ever split *Review*.** Two of the three modes ignored it,
so the nav made every visitor pick a dimension that mostly did nothing, and one tab spent most of
its life claiming an action the visitor wasn't taking. **A selector that governs only one of the
things beneath it isn't a level of hierarchy — it's a duplicate of one child.** Flattened to four
destinations in one bar (#1125): `Review my programs · Review my courses · Browse CIP codes · Find
a course's code`. `st.scope`/`st.mode` unchanged internally, so nothing downstream moved — scope is
now set as a *consequence* of the destination. Browse selects on mode alone; "Find a course's code"
carries the scope to `courses`, so `programs + recommend` is unreachable from the UI. Tests 322 → 326.

### Verification method worth reusing: reproduce the authority's own table

Rendering TOP 1305.00 headless and diffing it against Jenni's screenshot of the CO's TOP↔CIP table matched
on **all 17 codes, all 17 titles, and all 17 CTE categories**. That localised the only difference to one
column — peer college counts, **11 of 17 exact**, the rest slightly higher (68 vs 67 for `19.0709`; 62 vs 52
for `13.1210`). No program-status filter reproduces the CO's numbers, so it is a **vintage difference**: our
counts come from the COCI program export of **17 Jun 2026**. Rather than drop a genuinely useful column or
publish an undated near-match, the header now names the source and its date — an undated near-match invites
doubt about the whole surface; a dated one invites reconciliation. **Open for Raul: what does the CO table's
"Count of Colleges" filter on?**

Real-Chromium verified at 980px light + dark and 390px phone, on both the option list and the new nav
(every destination clicked in turn, exactly one selected each time): 0 horizontal overflow, 0 console errors.

**Still open (unchanged):** the manual "+ Add another code" free-search scope; the optional program-first
"Find my program's code" easy button; the standing WCAG pre-field gate; Phase B. **New and unbuilt:** a
TOP-first lookup in Browse (type a TOP, get its full approved-CIP list) — the same component, reachable
without picking a college. Side-lane discipline honored: `kb/cpl_todos.json` and the numbered
`session_<N>_handoff.md` untouched.

## 2026-08-14 — SkyCode: the noncredit CIP categories, and a blanket rule that was wrong for the majority (#1191 · #1192→#1194 · #1198 · #1199)

Worked with Sam and Jenni. Full reasoning + the population ladder live in
[`noncredit_cip_category_scope.md`](noncredit_cip_category_scope.md) — this is
the lessons-lane summary; the scope doc is the authority and the numbers are
not restated anywhere else.

**What happened.** A blanket rule — *all noncredit programs → CIP `32.0111`* —
shipped in **#1192** and was reverted in **#1194** after about twenty minutes
live. Jenni then clarified: `32.0111` is **Short-Term Vocational ONLY**. ESL,
Job Prep and some Basic Skills are CDCP-eligible on *other* codes, and the rest
of noncredit is leisure. The blanket rule was wrong for the **majority** of the
3,187 programs.

⭐ **The TOP is not load-bearing here, and that is the finding that made a whole
project unnecessary.** Jenni's Short-Term Vocational rule is `32.0111` **plus a
secondary credit CIP aligning with the subject**. So the **1,796** noncredit
programs sitting on a "wrong" credit CIP are not errors at all — that code *is*
the secondary. And **1,789 of the 1,796 (99.6%)** already sit inside their own
TOP's crosswalk, so the TOP and the college's own assignment corroborate each
other. What looked like a TOP-correction backlog was a **reading** error on our
side, not a data error on theirs.

⚠️ **TOP cannot decide the category even when it is correct.** Only **28.8%** of
programs are claimed by exactly one category; Short-Term Vocational and
Workforce Preparation are both "any vocational code", leaving **1,928**
undecidable. It blocks compliance for **17 programs at 13 colleges**. Peer
consensus repairs **38 of 3,187** — worth having, nowhere near a solution.

**The ladder:** 997 read to one category from their noncredit CIP · 76 off-list ·
1,796 hold the secondary · 247 no CIP · 71 retired. Secondary CIP categories:
CTE 1,327 · Both 177 · Non-CTE 292.

⚠️ **CTE here is FUNDING-BEARING** (Sam: CTE noncredit qualifies for funding,
non-CTE does not). So the **category is confirmed BEFORE CTE is concluded** — a
CTE secondary CIP does not prove a program is Short-Term Vocational. For the
same reason the *"noncredit TOP must start with 49"* error flag is **deliberately
unshipped**: it would flag **1,970** programs, **1,601 of them `GOAL = CTE`**,
and moving those off an asterisked TOP can strip the marker carrying that
designation.

⚠️ **A relayed code table had its Basic Skills labels shifted by one, silently.**
A Teams summary merged two codes onto one line, moving every pair after it. It
was caught only by checking **all seven pairs** against the CO's certified
catalog — the published CO page agrees with the catalog. Same shape as the MIS
`LocationID` column; appended as a second instance to
[`methodology-validate-a-code-column-by-its-structural-invariant`](kb-notes/methodology-validate-a-code-column-by-its-structural-invariant.md).

**Guards that survived the revert** and belong in whatever replaces #1192:
computed **never stored** (a rule-driven default must not be written as 3,187
curator revisions nobody made); a proposal says `proposed · COCI has X` and never
borrows *"changed from"*, which claims a human decision; and a proposed code must
appear in the row's own option list.

**Blocked on Jenni** (§6 of the scope): confirm the Basic Skills pairing — that
one alone unblocks build phases 1–3 · `32.0199` (60 programs) and `35.0101` (16)
are in use but absent from her list · is the **2026-07-15** crosswalk cut the
locked one · is the secondary CIP becoming a COCI field · **can non-CDCP
categories be CTE at all** (~1,300 programs).
**Blocked on Sam:** where a confirmed category persists — `localStorage` is wrong
for a funding-relevant determination; the recommendation is a gated Supabase
table with who/when, as with `cr_reference_decisions`.
