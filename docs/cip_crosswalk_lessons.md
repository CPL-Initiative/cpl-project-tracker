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

# CIP Crosswalk tab + the CIP site

Workstream scratchpad. **SkyNew side-lane, 2026-07-14** — a third COBI area
(**CIP**) added beside CPL and C&I, extending SkyFlyer's org layer. Like the
SkyFlyer/SkyIron side-lanes, this track does **not** touch the numbered
session-handoff chain or `kb/cpl_todos.json` (those are the curation track's
live memory).

## Origin

The Chancellor's Office is transitioning course & program coding from **TOP**
to **CIP** effective **fall 2026** (ESS 26-06). ESS built a searchable Excel
workbook (`CIP_Searchable_260708.xlsx`) to email to faculty in the field. Sam
asked for a COBI tab that **replaces that spreadsheet** — faculty search/filter
the TOP↔CIP crosswalk and, TMC-style, **send suggested changes + notes to the
CO to curate** along the way.

## What shipped

A new top-level **CIP Crosswalk** tab (`#cip-crosswalk`, in the Reference &
Curation nav group) + a new **CIP site** in the org switcher.

- **Data (`kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js`, `window.CIP_CROSSWALK`).**
  Built from the CO's workbook (committed at `kb/reference/cip_searchable_260708.xlsx`).
  A **normalized** model so long CIP definitions/SOC lists live once, keyed by
  code: **420 TOP codes**, **2,325 CIP codes**, **5,353 crosswalk pairs**, 6,011
  SOC occupation links. The master sheet is *TOP-CIP Data* (the rich one:
  relationship source, colleges-with-pairing + count, noncredit, both CTE flags);
  *CIP Descriptions* adds the definition/examples/cross-refs + the **2020 CIP
  Action** (New / Deleted / Moved) that becomes transition badges; *CIP-SOC Data*
  adds occupations. O*NET URLs are reconstructed client-side from the SOC code
  (`onetonline.org/link/summary/<soc>.00`) — not stored.
- **Tab (`cip_crosswalk.js`, `window.CPL_CIP_CROSSWALK`).** Self-contained lazy
  module (scoped `.cipx` CSS, DOM via createElement — CodeQL-safe). Sticky
  search + filters (group TOP→CIP / CIP→TOP, credit, CTE, TOP sector, CIP family,
  source toggle chips). Fixed-layout table with visual TOP grouping (Sam's
  no-horizontal-scroll rule). Row expands to a 3-column detail: TOP context +
  **"COCI courses with TOP N"** deep-link; full CIP definition + examples +
  cross-refs + transition flag + SOC occupation chips; provenance + the college
  list; and an inline **suggest-to-curate** form. CSV export. A global
  "✍️ Suggest a change" modal (not row-bound) for brand-new mappings.
- **Suggest lane (Supabase `cip_crosswalk_suggestion`).** Open/anon like Quick
  Adopt: anon **INSERT-only** (`check status='new'`, `return=minimal`), **no
  public SELECT** (contact info never publicly readable); the CO reads the queue
  behind the reviewer/team-phrase gate (`is_allowed_reviewer() OR team_pass_ok()`,
  both already deployed). Schema of record: `kb/supabase_cip_crosswalk_suggestion.sql`,
  applied via MCP migration `cip_crosswalk_suggestion_intake` on the *Work Plan*
  project (`hvuwhnbuahrtptokpqfh`).
- **CIP site (`cobi_orgs.js`).** One `ORGS[]` entry — `{id:"cip", tag:"CIP",
  full:"TOP-to-CIP Transition", tabs:["cip-crosswalk","coci-lookup"], home:"cip-crosswalk"}`.
  `?org=cip` deep-links into it; wordmark tag reads **COBI ᶜᴵᴾ**. No gating
  (cosmetic, matching the pilot).
- **COCI cross-link (`coci_lookup.js`).** Added the TOP field to the COCI search
  haystack (one line) so the crosswalk's "COCI courses with TOP N" deep-link
  (sessionStorage `cpl_coci_focus`, the RACI focus pattern) actually filters.

## Decisions / judgement calls

- **CIP is an org site, not just a tab.** Sam said "a CIP site (to be added to
  our current CPL and C&I sites)" — so it's a third area in SkyFlyer's org layer,
  with its day-one tabs = the crosswalk + COCI Lookup (its deep-link target).
- **Submissions open, no phrase.** Faculty *in the field* submit, so no login
  gate — mirror Quick Adopt (`cpl_adoption_interest`). Did **not** mint a
  `cip-team-2026` phrase (the queue-read gate already works via existing cohort
  phrases + reviewers); add one later only if the CO wants a CIP-cohort phrase.
- **Normalized data model.** Definitions/SOC keyed by code, pairs reference them
  → 1.85 MB (vs. ~5× if denormalized). Committed (like `cpl_pathways_data.js`) —
  it is NOT a daily-cron artifact, so there's no cron path to publish it.
- **Source provenance is first-class.** The relationship source (COCI / CCCCO /
  Noncredit / Field-submitted / COE / CIP-file) drives a colored badge + a filter
  — faculty can see which mappings are CO-authoritative vs. field-submitted (the
  ones most in need of curation).

## Bugs caught before shipping

- **Sort sentinel under ICU collation.** Using `"~"` as a high sentinel with
  `localeCompare` did NOT sort null-TOP (CIP-only) rows last — ICU collates the
  tilde *before* digits, so a CIP-only row rendered first and its expand showed
  the wrong panel. Fixed with a deterministic nulls-last plain-string comparator
  (`cmp()`); zero-padded codes compare correctly with `<`. The jsdom test caught
  it.
- **RLS + RETURNING.** An anon INSERT with `RETURNING` fails RLS (the returned
  row is checked against the SELECT policy, which denies anon). The frontend uses
  `Prefer: return=minimal` (no RETURNING), so the real path is fine — verified
  live via MCP with a rolled-back `set local role anon` insert (succeeds) +
  select (0 rows).

## Verification

- `tests/cip_crosswalk.test.js` (jsdom, 36 assertions): wiring in both HTMLs
  (Rule 4), nav group, org registration, render, filtering seam, row expand,
  suggest form, scoped CSS, + failure-mode guards (missing data, null-TOP/orphan-CIP
  rows). `tests/cobi_orgs.test.js` extended to cover the CIP site (33 assertions).
- Real Chromium render (1280px): stats 420/2,325/5,353, "nursing" → 86 rows,
  expand + form work, **zero console errors**.
- Supabase RLS verified live (anon insert OK, anon select denied).

## 2026-07-14 (later) — transfer marker + the reference-manual pivot (#771, #772)

Two follow-ups landed the same day, and a **strategic reframe from the CO** reshaped
the tool's purpose.

### Transfer (C-ID) marker — #771
The CO CIP team is prioritizing **transfer courses first**. Examined the COCI course
extract (`kb/reference/coci_course_list.xlsx`, 141,738 rows): **it has no explicit
CSU/UC-transferable flag** — 12 columns, and the only transfer-adjacent signal is
**C-ID (`CIDNumber`)** presence (C-ID = the statewide transfer-model articulation
system). C-ID covers 16,067 courses (11.3%); 292/420 TOP codes have ≥1 C-ID course.
Shipped it as a **clearly-labeled interim floor** (not full transferability), with a
clean seam for a true flag if a fuller export adds one:
`kb/_build_cip_crosswalk.py` rolls a per-TOP `crs` (total COCI courses) + `cid`
(C-ID courses) up from COCI (TopCode `"CODE: Title"` split on `:` to match keys);
`cip_crosswalk.js` adds a Transfer filter + a "🎓 N C-ID" chip. **Lesson: name a
proxy as a proxy** — the chip/tooltip/filter all say "transfer-model (C-ID) … a
floor, not full CSU/UC transferability" so it can't mislead prioritization.

### The strategic reframe (Jenni Abbott, CO AA division) → the reference manual — #772
Sam asked Jenni whether the CO could assume **1 TOP → 1 CIP** and infer it down to
every COCI course (→ add a CIP column to COCI views). Grounded the question in the
data: the crosswalk is strongly **many-to-many** — only **9%** of TOP codes are 1:1
across all sources, **32%** credit-only, **38%** official-only (avg 8–11.6 CIP per
TOP). Jenni confirmed: **it IS one-to-many**; the **Tech Center is building the COCI
CIP-dropdown** where colleges actually pick; and **our tool is the "reference
manual"** — the successor to the CCC **TOP Code Manual** — and should expose the
**full federal CIP list (1,800+)** so colleges "can look at everything."

That killed the planned **canonical-CIP-designation curator surface** (the 1:1
premise is false) and pivoted the build to a **reference manual**:
- **New "Browse all CIP codes" view** (toggle beside the crosswalk) surfacing **all
  2,325** federal CIP codes — including the **181 that had no TOP mapping** and were
  previously unreachable (the tool only showed crosswalk *pairs*). Filters: CIP
  family, CTE, 2020-CIP status (New/Moved/Deleted/Unchanged). Each row expands to a
  CIP reference card (definition, examples, cross-refs, transition note, SOC
  occupations, and the TOP codes that map *from* it — each a jump into the crosswalk).
- **Header repositioned** as the transition reference manual.
- **Lesson: a pivot can be a small superset.** The existing tab already had the CIP
  narrative data + detail machinery; the reference manual was a *view mode* over the
  same normalized dataset, not a rebuild. Measuring the 181-orphan gap first pointed
  straight at the missing capability.

**Curator-surface status: dropped, not parked** — with one-to-many + COCI owning
data entry, there's no "designate the canonical CIP" job here. The
`cip_crosswalk_suggestion` lane (#770) still collects college feedback; a lightweight
CO reader for it is the only remaining curator-ish follow-up.

## Continuation (next session on this track)

Everything above is live (#770 tab, #771 transfer, #772 catalog). Natural follow-ups,
none blocking:
1. **True transfer flag** — if the CO provides a course export with CSU/UC-transferable
   columns, swap the C-ID proxy for the real flag (the `top[code].cid`/`crs` seam +
   the filter/chip are ready; just re-point the generator + relabel).
2. **A lightweight CO reader** for the `cip_crosswalk_suggestion` queue (no in-app
   reader yet — the CO queries Supabase; gate a read view behind
   `is_allowed_reviewer() OR team_pass_ok()` if they want one).
3. **Refresh the dataset** when ESS ships a newer workbook cut — drop it at
   `kb/reference/cip_searchable_<date>.xlsx`, bump `SRC`/`BUILT_AT`, rerun.
4. **Program-level crosswalk** — the workbook is course/discipline TOP↔CIP; the COCI
   *program* inventory could add a program lane.
5. Watch for the **Tech Center's COCI CIP-dropdown** shipping — if it exposes an API,
   this reference could link out to it per TOP code.

## 2026-07-15 — StarCIP: the pivot to a simple "easy button" CIP reference (prototype)

Sam relayed **Jenni Abbott's email feedback** and asked how to pivot to match her
vision. The reframe: **stop recreating the crosswalk** (COE hosts it, needed only a
couple years) — the product is the **full CIP code list as the authoritative
reference** ("the new reference site when designing new programs and courses. Clear,
comprehensive, user-friendly"), the **successor to the TOP Code Manual**. Her two
suggest-lane notes (Supabase `cip_crosswalk_suggestion`, submitter Jenni) confirmed
it: **remove the "source"/provenance column** (it implies the list is "still open for
review") and **don't expose "Suggest a change" to the field**. Sam's operative word:
**simple — faculty want an "easy button."** This replaces the **6-tab Excel workbook**
the CO was going to email out (send a *link*, not a maintenance burden).

**Method (repo practice): prototype in a fast-feedback canvas → lock → port.** Rather
than rewrite the monolith, built a self-contained artifact
(https://claude.ai/code/artifact/cf0085e0-7df8-46e4-87a3-b1eb34c2e880) with the real
2,325-code dataset. Iterated live across several rounds with Jenni. **Nothing ported to
the live dashboard yet** — that's the next step. Prototype + data preserved at
[`docs/cip_prototype/`](cip_prototype/) (rebuild: `python build_proto.py`).

**What the prototype is:** one search box + the full CIP list; each row shows the
**category label (CTE / Non-CTE / Both / Noncredit)** immediately; click → plain-English
definition, examples, CIP family, NCES link. Category pills + family filter + a **🎓
C-ID/CCN** toggle chip (ANDs) + a **plain-English finder** ("describe your program" →
top candidate codes) + a light/dark toggle. Retired/reserved hidden by default.

**Two data findings that MUST carry to the port** (detail in
[`docs/cip_prototype/README.md`](cip_prototype/README.md) + the KB note):
1. **Certified CTE designations, not either workbook tab.** Jenni's 45.0702 catch
   opened it: the workbook's *CIP Descriptions* and *TOP-CIP Data* tabs **disagree on
   244 codes in BOTH directions** — neither is reliable. The CO consultant's certified
   list is the authority (= live tool = searchable file; Descriptions lags since early
   June). Preserved: [`kb/reference/cip_cte_certified_260715.json`](../kb/reference/cip_cte_certified_260715.json)
   (244 codes; 243/244 matched my crosswalk-sourced guess, the 1 diff = a fresher
   update; **0 uncertified conflicts**). Refreshed to the **2026-07-15 cut**
   (`kb/reference/cip_searchable_260715.xlsx`, also fixes 32.0107).
2. **C-ID/CCN = a course-level floor.** `x=1` if any mapped TOP has C-ID or CCN
   coursework (COCI rollup) — 292 TOPs C-ID, 406 CCN → 1,299 CIPs. Name it by the
   identifier, never "Transfer" (Sam's own correction; TOP→CIP is one-to-many).

**Phased AI plan (Sam approved):** Sierra already exists as a grounded RAG edge
function (`/functions/v1/cpl-chat`, SSE, reusable client). Phase 0 = the no-backend
keyword+stem finder shipped here (zero hallucination risk — grounded to real records).
Phase 1 = wire Sierra scoped to the CIP dataset once the CO confirms the
**finder-not-decider** framing.

**Next step:** lock the look with Jenni, then **port into `cip_crosswalk.js`** per the
plan in the prototype README. **Side-lane discipline honored — `cpl_todos.json` + the
numbered handoff left untouched** (the CCR mainline session owns those).

## 2026-07-16 — SkyLoft: the port lands (mockup → production on COBI)

Sam: "get the mockup into production on COBI." Ported the locked StarCIP prototype
(`docs/cip_prototype/`) straight into the live `#cip-crosswalk` tab. The tab **is**
the mockup now: the **CIP Code Taxonomy** reference — search + the plain-English
finder + category pills + a 🎓 C-ID/CCN chip + family select + include-retired
toggle, over the full 2,325-code CIP-2020 list, each row expanding to definition /
examples / family / NCES link. The old TOP↔CIP **crosswalk table and the
suggest-to-curate form are gone** (Jenni: COE hosts the crosswalk; don't expose
"Suggest a change" to the field) — replaced by a header link out to COE's hosted
crosswalk. No Supabase in the tab anymore (backend-free reference).

**What shipped**
- **`kb/_build_cip_crosswalk.py` rebuilt to emit the lean reference shape**
  `{fams, rows:[{code,t,cat,fam,def,ex,act,x}]}` (was `{top,cip,pairs,sources}`).
  Repointed to the **260715 cut**. Folds in the **two data rules from the prototype
  README**: (1) `cat` = the CO consultant's **certified** CTE designation
  (`kb/reference/cip_cte_certified_260715.json` is the authority for the 244 codes
  where the workbook's two tabs disagree; agreed value elsewhere; single-tab for
  orphans), (2) `x` = 1 if any mapped TOP has **C-ID or CCN** coursework (COCI
  rollup — a course-level floor, never "transferable"). Rebuild parity is exact vs
  the prototype: **2,325 codes**, cat dist `{CTE 943, Non-CTE 678, Noncredit 433,
  Both 128, Retired 113, Reserved 30}`, **244/244 certified, 0 uncertified
  conflicts, 1,300 C-ID/CCN-flagged, 50 families**. Data file shrank 1.9 MB → 1.06 MB
  (dropped the now-unused top/pairs/SOC). Still a **committed artifact** (not a
  daily-cron output — no cron path publishes it).
- **`cip_crosswalk.js` fully rewritten** as the reference renderer (scoped `.cipx`
  CSS, **no `:root`** — the dashboard owns the theme, so the prototype's standalone
  light/dark toggle was dropped; the tab inherits dashboard tokens with fallbacks).
  DOM via `createElement`/`textContent` (CodeQL-safe). Kept the
  `window.CPL_CIP_CROSSWALK.activate()` lazy-boot contract, so **no HTML boot
  change** was needed. Added a small **⬇ CSV** of the filtered list (directly
  serves "replace the emailed workbook"). Finder is the same Phase-0 grounded
  keyword+stem ranker (zero hallucination); Phase-1 Sierra wiring is still the
  documented follow-up.
- **HTML (both, Rule 4):** nav label **"CIP Crosswalk" → "CIP Codes"** (hash
  `cip-crosswalk` kept stable, per the activities-projects precedent); pane +
  boot comments refreshed. The org entry (`cobi_orgs.js` `id:"cip"`) is unchanged —
  the CIP site's day-one tabs stay `[cip-crosswalk, coci-lookup]`.
- **Tests:** `tests/cip_crosswalk.test.js` rewritten for the reference (48
  assertions: wiring, backend-free guard, render, default-hide retired/reserved,
  category-pill / C-ID-CCN / family filtering, the finder ranking real records
  only, row expand, scoped-CSS, failure guards). `tests/cobi_orgs.test.js` label
  fixture updated. Real-Chromium verified at 1100px: **0 console errors**, finder
  "wildland firefighting" → `43.0206`, CTE pill → 943, families 50, 2,182 active
  shown by default.

**Decisions / judgement calls**
- **Replace, don't augment.** "Get the mockup into production" + Jenni's "stop
  recreating the crosswalk" + "don't expose suggest" = the tab becomes the
  reference, full stop. The `cip_crosswalk_suggestion` Supabase table + its SQL stay
  in the repo (unused by the tab) in case the CO later wants a **gated** reader —
  not deleted, just not surfaced to the field.
- **Kept the data file name + `window.CIP_CROSSWALK` var** (only the *shape*
  changed) so the two-HTML lazy loader (`loadScript('cip_crosswalk_data.js',
  'CIP_CROSSWALK', …)`) needed no edit. Slightly legacy name; not worth the churn.
- **Naming:** nav "CIP Codes", header "CIP Code Taxonomy" (the mockup's title). Easy
  to retune if Sam/Jenni prefer "CIP Reference" etc.

**Open follow-ups (unchanged from the prototype README, none blocking):** Phase-1
Sierra finder; a gated CO reader for the suggestion queue; refresh the dataset when
ESS ships a newer cut; a program-level lane. **Side-lane discipline honored —
`cpl_todos.json` + the numbered handoff left untouched.**

### 2026-07-16 (later) — SkyLoft: Sam's post-merge UX polish (6 tweaks)

Sam reviewed the live tab and asked for six refinements, all landed in
`cip_crosswalk.js` (JS-only — no data/HTML change):
1. **Dark mode toggle restored.** The dashboard is light-only (only `our_process.js`
   uses `prefers-color-scheme`), so the tab carries its **own** light/dark tokens
   **on `.cipx`** (not `:root`) and a top-right toggle flips a scoped
   `.cipx-theme-dark` class (persisted in `localStorage`). It themes **only this
   tab** — the rest of the dashboard is untouched. (The prototype's toggle had been
   dropped in the first port; Sam wanted it back.)
2. **Wider intro.** `.cipx` cap 1000→**1200px** (the `.main-container` is 1400), and
   the intro `.cipx-sub` widened to fill the container — it was leaving big right-side
   whitespace, unbalanced against the full-width panel/list below.
3. **All chips → rounded box, not oval.** Filter pills + the C-ID/CCN chip went from
   `border-radius:999px` to **7px**, matching the category badges (one chip language).
4. **One consolidated search.** Deleted the original keyword search box; the
   plain-English finder ("AlmostSierra") input is now **the single search**, living in
   ONE light rounded panel with the pills/chip/family/retired controls + the count/CSV.
   The single input drives **both** the live list filter (substring) **and** the ranked
   "closest matches" suggestions strip below the panel (shown only for descriptive
   text, skipped for a bare code lookup) — so no capability was lost when the second
   box went away.
5. **Consistent edge margins.** Uniform panel padding (16×18) + a `.cipx` inset so
   header/panel/list all align to one left edge.
6. **Muted category badges.** CTE/Both/Non-CTE/Noncredit/Retired/NEW recolored to
   low-chroma earthy/gray tones (via light+dark tokens) so they read as *additive*,
   not attention-grabbing.

Tests: `tests/cip_crosswalk.test.js` → 52 assertions (added: single-search-box guard,
theme-toggle flip, scoped-dark-theme static check). Real-Chromium verified light +
dark at 1400px: 0 console errors; "medical assisting" → 6 ranked suggestions + a
2-row filtered list from the one input.

### 2026-07-16 (later) — SkyLoft: the "Check a course" confidence tool (Phase 0)

Sam's ask: let a college pick/paste a **local course** they're assigning a CIP to,
**score the pairing**, and **offer more confident alternatives** — analyzed against
the course description (which lives in COCI). Approved Phase 0 (no backend), then:
*"put it into prod"* (audience = Raul at CO + Jenni only; **Raul owns the process**
once it goes to the field). Shipped as a **second mode inside the CIP Codes tab** —
a segmented toggle **📖 Browse codes | 🎯 Check a course** — so it shares the engine +
dataset and leaves the reference view as the default.

**The engine (Phase 0, grounded, no backend).** Paste a course title + catalog
description (+ optionally the CIP you're considering) → rank every active CIP by how
well the description's vocabulary matches each CIP's **official definition**, and
surface a confidence read + the closest codes. Two design decisions came straight out
of a real-course calibration (12 COCI courses):
1. **IDF weighting is the difference between credible and flaky.** Raw keyword overlap
   confidently mis-ranked generic descriptions — "Financial Accounting" → *Financial
   Forensics* #1; "Automotive Painting" → *Prepress/Desktop Publishing* at 99% (both
   on ubiquitous words: design, prepare, technology). Weighting each match by
   **inverse document frequency** over the 2,325 CIP definitions (computed once,
   client-side) lets DISTINCTIVE terms dominate — "collision"/"gis"/"police" carry the
   signal, "prepare"/"design" carry ~none. After IDF, Automotive Painting returns
   *all four automotive CIPs* and honestly flags "several close — review."
2. **The confidence signal is the MARGIN, not the top score.** GIS → #1 at 100% with
   the next at 42% (huge gap → "clear front-runner"); Automotive Painting → top four
   within 2% (tight cluster → "several fit — you decide"). So the tool's discrimination
   headline keys off `margin = 1 − score₂/score₁`, turning the ranker's weakness
   (can't split near-ties) into an honest feature. For a **chosen** CIP, the verdict
   tier (Strong / Plausible / Weak) is its score **relative to the best match**, with
   a severity stripe + pill + a labeled "vocabulary match" meter.
   - Stemming guard: never stem down to a <4-char stub ("speed"→"spe" was
     false-matching "specific"); keep the original there.

**Finder-not-decider, everywhere.** Every surface says *review aid, not a
determination — the CIP definition is the final word; your college enters the code in
COCI.* The meter is labeled "vocabulary match (lexical) … not a determination." The
6 one-click example courses deliberately mix clear-cut (GIS, Collision, Police) with
honestly-ambiguous (Financial Accounting → Forensics) so Jenni sees the tool admit
uncertainty.

**Mobile (Sam's real use case — he's on his phone).** Strengthened the `≤640px`
breakpoint: full-width mode toggle, a reserved header strip so the theme toggle can't
collide, chips/badges/pills tightened, the confidence meter drops to its own line
(never hidden), form inputs bumped to **16px** so iOS doesn't zoom-jump on focus.
Real-Chromium at **390×844**: **0 horizontal overflow**, light + dark, 0 console
errors; Collision Repair → `47.0603` "Strong fit", same course + `52.0201` → "Weak —
reconsider" (correctly flags the mismatch).

Tests: `tests/cip_crosswalk.test.js` → **65 assertions** (mode toggle, check-mode
render, analyze → candidates, chosen-CIP verdict + tier, thin-description guard, the
`_score`/`_resolve` engine seams, a mobile-breakpoint static check).

**Open — the pre-field roadmap (nothing blocking Raul + Jenni now):**
- 🔒 **Accessibility (WCAG) audit before field release — Sam's explicit gate.** Basics
  are in (label-wrapped inputs, `role=tab`/`aria-selected` mode toggle, `aria-live`
  results, `aria-label` meters, keyboard-operable rows, focus-visible). A full pass
  still owed: muted-badge/stripe **contrast ratios**, tablist⇄tabpanel wiring, meter
  `role`/value semantics, SR announcement copy, reduced-motion. Do this before it
  leaves Raul/Jenni.
- **Pick-from-COCI course selection** (vs paste) — wire the college→course picker to
  the COCI dataset (the COCI Lookup tab already loads it) so faculty select an
  existing course and its description auto-fills.
- **Local TOP→CIP tables as a corroborating signal** — Sam is checking whether the CO
  has local TOP→CIP mapping tables; if so, "your course's TOP also maps here" becomes
  a second, independent signal (treat TOP as corroborator, not gate — repo doctrine).
- **Phase 0.5 embeddings** (precomputed CIP-definition vectors → a real *semantic*
  score) and **Phase 1 Sierra** (explained judgment) per the original ladder.
- KB-note candidate: `methodology-idf-margin-confidence-finder-not-decider.md`.

**Side-lane discipline honored — `cpl_todos.json` + the numbered handoff untouched.**

### 2026-07-16 (later still) — SkyLoft: the fit-check goes INLINE at the CIP level

Sam tried the standalone Check-a-course mode and it was **too cumbersome for
faculty** — you had to already know the CIP code, go find your local course
somewhere, and copy-paste its description. His redesign: **wire it inline at the
CIP level** — pick your college once, and while viewing a CIP, choose one of your
local courses (sorted best-fit-first) and let the tool pull the **COCI description**
automatically. Paste stays only as the not-yet-in-COCI edge case.

Shipped exactly that. **Removed the standalone Check mode + its mode toggle.** Added:
- A remembered **"🏫 Your college"** selector at the top (localStorage `cipx_college`).
- Inside **every expanded CIP row**, a **"🎯 Check one of your courses against this
  code"** block: a native `<select>` (great on mobile) with a **★ Best matches for
  <CIP>** optgroup (top 8 by alignment) + an **All courses (A–Z)** optgroup. Pick a
  course → an inline confidence verdict (Strong / Plausible / Weak for THIS code) +
  the course's closest CIPs (the "more confident alternatives"). Paste fallback link
  for courses not in COCI.

**Data pipeline (`kb/_build_cip_fitcheck.py`).** The COCI course inventory (141,738
rows, 120 colleges) with catalog descriptions is **~50 MB** — too big to ship whole.
So it's split **per college**: `cip_fitcheck/<slug>.json` = `[[label, desc≤400, top], …]`
(desc-bearing courses, deduped by label, title-sorted), plus a tiny
`cip_fitcheck_colleges.json` manifest. The tab **lazy-`fetch()`es** only the selected
college (~1 MB max, `allan_hancock_college.json` is the biggest at 940 KB) — the
browser never loads more than one. Committed directly (precedent:
`unified_courses_member_desc.js` is 46 MB; **no cron regenerates these, so zero
conflict risk**); `cip_fitcheck/` added to the Obsidian vault-exclusion list. Slug is
sanitized (`[^a-z0-9_]`) before the fetch URL (CodeQL).

**Engine reuse + a speed refactor.** The IDF + margin scorer now precomputes a
**token Set per CIP** (title/examples/definition) at ingest, so scoring a whole
college's ~1,000 courses against the open CIP (for the best-fit sort) is Set-lookups,
not regex — fast enough to run on every row expansion. Same IDF/margin behavior as
Phase 0.

**Verified (real Chromium over HTTP so `fetch` works), desktop + phone, light + dark:**
Allan Hancock → expand `47.0603` (Autobody/Collision) → the Best-matches group tops
with **"AB 360 — Collision Repair"** → **Strong fit, 100%** + 5 candidate CIPs; **0
horizontal overflow**, **0 console errors** (only a harness favicon 404). Tests:
`tests/cip_crosswalk.test.js` → **58 assertions** (college bar, lazy-course seams,
best-fit sort, inline verdict, no-college nudge, empty-college guard).

**Open (unchanged): the WCAG pre-field gate** (Sam's) still owed; plus the earlier
roadmap (local TOP→CIP corroboration, Phase-0.5 embeddings, Phase-1 Sierra). The
per-college data will need a **refresh path** when COCI updates (rerun the generator;
a `workflow_dispatch` could publish it to avoid a big session commit next time).

### 2026-07-17 — SkyLoft: the coverage factor (a course's *fundamental purpose* wins)

Sam dinked around and found a sharp false positive: Citrus's **PUB 151 — Street
Construction and Maintenance** read **"Strong fit, 92%"** against **52.0301
Accounting**. Root cause (traced on real data): the catalog description literally
says *"cost accounting systems … budget preparation … public,"* so `account` hit
Accounting's **title** and a pile of generic admin words (`cost, budget, system,
public, method`) hit its unusually long definition. The engine actually ranked
Concrete Finishing (46.0402) #1 — the bug was the **tier**: 92%-of-#1 read Strong for
a match built on incidental wording.

Sam's framing nailed the fix: *"determine the most fundamental purpose of the course
— the accounting aspect is trumped by the overall goal of street maintenance."* So
`scoreAgainst()` now applies a **coverage factor**: identify the query's most
**distinctive** terms (top-8 by IDF — for PUB 151 that's `asphalt, portland,
pavement, drainage, cement, concrete`), and dampen any CIP that matches **none** of
them down to a floor (×0.25). Accounting matches 0 identity terms → dampened from 92%
→ **53%**; Concrete Finishing (matches cement/concrete) stays #1. Regression-clean:
Collision→Autobody (cov 37%), GIS→45.0702 (cov 50%), Nursing→nursing codes (cov 73%)
all still dominate.

**Two calibration rulings from Sam that shaped the final touch:**
1. *"Plausible is OK given the specific callouts to accounting and budgeting."* — So
   the coverage factor only **shapes the score** (92%→53%); `rel%` still picks the
   label. I'd briefly added a hard *coverage < 0.10 → force Weak* gate; **reverted
   it** — a course with genuine secondary callouts earns an honest "Plausible."
2. *"If we over-control we'll lose other more plausible possibilities for other
   courses."* — Confirms the light touch: a floor (not a cutoff), K=8 distinctive
   terms, no hard gate. Codes matching *some* identity terms keep their score, so
   real alternatives survive (the nursing course still surfaces 5 nursing codes at
   75–100%). The factor demotes only the *pure-incidental* matches.

Live-verified (Citrus → 52.0301 → PUB 151): **Plausible, 53%**, verdict *"partly fits
(mostly on secondary wording), but 46.0402 Concrete Finishing matches its core subject
more closely."* Tests: `tests/cip_crosswalk.test.js` still green (58).

### 2026-07-17 (cont.) — SkyLoft: three field-test polish items from Sam

1. **Scroll-jump on expand (bug).** Clicking a CIP row far down the list zipped the
   viewport to the top. Cause: `render()` does `clear(listHost)` then rebuilds — the
   momentary zero-height list collapses page height, so the browser clamps scroll to
   0. Fix: `render()` now captures `scrollingElement.scrollTop` before the clear and
   restores it after the rebuild. Verified: expand at scrollTop 2600 → stays 2600.
2. **Course dropdown opened upward, covering the row (bug).** The native `<select>`
   (1,800 options) popped its list upward when the row sat low in the viewport —
   browsers control that, CSS can't. Replaced it with a **custom combobox** (`.cipx-cbwrap`
   / `.cipx-fit-cb` input + an absolutely-positioned `.cipx-fit-panel` that opens
   **below**, `role=combobox`/`listbox`, arrow/enter/escape keys, outside-click close).
   Bonus: it's **searchable** — type to filter all 1,800 courses instead of scrolling.
3. **Improv-vs-Acting (not a bug — the tool being nuanced).** Sam noticed the Improv
   courses weren't in the "best matches" for **50.0506 Acting**. Traced it: Improv's
   description is general theatre technique (*"group expression, spontaneity, dramatic
   text"*), so it ranks **#1 against 50.0501 Drama/Theatre Arts, General (100%)** and
   only **#6 / 65% (Plausible) against 50.0506 Acting** — the college's *Stage Acting*
   courses (cov 44%) are the legitimately stronger fits for the Acting CIP. Sam's call:
   *"consider over-controlling… leave it to faculty."* So **no scoring change** — and
   item 2's search **is** the "leave it to faculty" fix: a faculty member can type
   "improv," pick it under Acting, and get the honest "Plausible" read. Method (the
   ranking is right) + magic (search lets them override it). Tests → **60 green**;
   real-Chromium (desktop + phone): scroll kept, panel opens below, 0 overflow, 0
   console errors.

## 2026-07-17 — checkpoint + handoff to SkyLiftoff: the TOP→CIP "easy button" (queued)

Sam, feeling for faculty who must assign CIPs to **800–1,500 courses** each: every
course already carries a **current TOP code**, and the CO's official **TOP→CIP
crosswalk** is the "candidate CIPs for this discipline" table — combine them for an
easy button. This is the **two-signals-agree** gate from our own §7 TOP doctrine
(crosswalk *proposes*, description-fit *ranks*, faculty *confirms*) — TOP never decides.

**Grounded in the workbook** (`kb/reference/cip_searchable_260715.xlsx`, TOP-CIP Data):
420 TOPs → 4,865 pairs, **median 5 CIPs/TOP** (mean 11.6, max 1331), **32% map to ≤3**.
Noise: every TOP carries noncredit boilerplate (`32.0107 Career Exploration`,
`32.0111 Workforce Dev`) — de-emphasize (description-fit already ranks it ~0. Each pair
has **provenance** (`CCCCO TOP-CIP` official / `Submitted by Field` softer) — a trust cue.
The magic in examples: `0949.00`→3 CIPs (Autobody wins); `1007.00` Dramatic Arts →
Acting/Theatre-General/Technical-Theatre (description places each — the elegant Improv
answer); `0502.00` → Accounting/Accounting-Tech/**Auditing** (an audit course routes right).

**Recommendation (SkyLoft → SkyLiftoff):**
- **Phase 1 (easy button):** on a picked course, show its **current TOP** + the crosswalk
  CIPs ranked by description-fit, top both-agree flagged **✓ Recommended**; a **"beyond the
  crosswalk"** lens (all-CIP matches) with a ⚠ when the two signals disagree; a **course-first
  entry**. Small data lift — re-emit a compact `TOP→[CIP+provenance]` map from
  `kb/_build_cip_crosswalk.py` (the pairs were slimmed out of the lean reference but the
  generator still reads them).
- **Phase 2 (CO "wow"):** a whole-catalog **review sheet** per college — every course →
  current TOP → recommended CIP → confidence, pre-filled for the clear ones; faculty
  adjudicate only the ambiguous minority. Turns a 1,500-course slog into review-and-approve.
- **Caveats:** recommendation not auto-assign; one-to-many is *why* we rank; TOP can be
  wrong (hence "beyond crosswalk" + disagreement flag); faculty enters the code in COCI.

**Standing gate:** the **WCAG accessibility pass** before field release (audience today =
Raul + Jenni only; Raul owns the process at field). Paste-able capsule for the next
session: [`docs/cip_crosswalk_handoff.md`](cip_crosswalk_handoff.md). Method note:
[`docs/kb-notes/methodology-grounded-lexical-cip-confidence.md`](kb-notes/methodology-grounded-lexical-cip-confidence.md).
Side-lane discipline held throughout — `cpl_todos.json` + the numbered handoff untouched.

## 2026-07-17 — SkyLiftoff: the TOP→CIP "easy button" ships (course-first recommend mode)

Built the queued priority. The tab now has **two modes** (a segmented toggle, Browse
default, remembered in `localStorage`): **📖 Browse codes** (the reference manual,
unchanged) and **🎯 Find my course's code** (the easy button). Course-first: pick your
college once, pick a course → the tool reads its COCI description, looks up its **current
TOP**, and ranks the CIP codes the official crosswalk maps from that TOP by description-fit.
This is the **two-signals-agree gate** from the §7 TOP doctrine made visible — the crosswalk
PROPOSES, description-fit RANKS, faculty CONFIRMS; TOP corroborates, never decides.

**What ships**
- **Data (`kb/_build_cip_crosswalk.py`).** Re-emits a compact `topcip` map into
  `cip_crosswalk_data.js` (embedded, no new fetch — data 1.06→1.16 MB): `topcip[<TOP>] =
  {t:title, c:[[cip, tier], …]}` from the workbook's *TOP-CIP Data* sheet — **420 TOPs,
  4,865 candidate pairs**. `tier` is a provenance letter (`o` official CCCCO/COCI/COE ·
  `f` field-submitted · `n` noncredit · `g` generic). Plus `boiler` = the two universal
  noncredit CIPs (`32.0107` Career Exploration, `32.0111` Workforce Dev) that map from
  ~280 TOPs each — a clean natural break at ≥40 TOPs. Parity-exact on the reference rows
  (2,325 codes, 244/244 certified, 1,300 C-ID/CCN).
- **Engine (`cip_crosswalk.js`).** `computeRecommend([label,desc,top])` reuses the existing
  IDF+margin+coverage scorer over ALL CIPs, then intersects with the TOP's crosswalk
  candidates. **Recommendation gate:** the top crosswalk candidate reads ✓ **Recommended**
  only when it's a globally-strong match (`rel≥85`) **and** clearly ahead of the next
  crosswalk candidate (`cwMargin≥0.25`). Else "no clear front-runner — compare." The tri-state
  Fable flagged: (a) in-crosswalk + strong = the green Recommended card; (b) in-crosswalk +
  weak = sits lower with its honest Strong/Plausible/Weak label; (c) **strong match NOT in
  the crosswalk → a separate ⚠ "outside the crosswalk" drawer** (never interleaved), which
  **auto-opens when there's no clear winner** so the better answer isn't hidden. Boilerplate
  collapses behind a "+N generic noncredit codes" expander.
- **Trust levers (Fable's calls, all taken):** matched-term chips per card (evidence beats
  badges), provenance as a **muted text label** not a colored axis, one badge max per card,
  non-imperative tone ("looks like the strongest fit," never "the right code"; disagreement =
  "the description points elsewhere," never "your TOP is wrong").
- Refactored the combobox into a shared `comboCore` (the inline check + the new mode both use
  it; the inline check's pinned DOM structure is byte-preserved so its 60 tests still pass).

**Live behavior (real-Chromium, Allan Hancock):** Collision Repair → ✓ 47.0603 Autobody
(Strong 100%); Accounting → ✓ 52.0301 Accounting (Strong) over Accounting-Tech/Auditing
(Weak, Auditing labeled *field-submitted*) + ⚠ 52.0809 Credit Management outside; Med-Surg
Nursing → **no false winner** (crosswalk's 51.3801 RN vs description's 51.3818 Nursing
Practice in the ⚠ drawer — the honest "compare" the lexical limit demands); Real Estate →
✓ 52.1501 over law/architecture real-estate variants outside. One TOP (Vacuum Technology,
0943.30) maps only to boilerplate → falls back to best description matches.

**Bug caught in verification:** changing the college **while in recommend mode** called the
browse-only `render()` (which throws on the absent `countHost`). Fixed: the college-bar
`onchange` rebuilds the right view per mode. Guarded by a jsdom test.

**Verification:** `tests/cip_crosswalk.test.js` → **84 assertions** (60 existing all green +
24 new: topcip/boiler data, mode toggle, `_recommend` model, two-signals winner, boiler
split, outside-the-crosswalk, thin-desc, no-crosswalk TOP, college-change rebuild). Full
suite **166 files green**. Real Chromium desktop 1280 + phone 390, light + dark: **0
horizontal overflow, 0 console errors** (only the harness favicon 404). Model setup honored —
spawned a **Fable consultant** on the IA/tri-state/tone fork; its calls shaped the final design.

**Open — the pre-field roadmap (unchanged, nothing blocking Raul + Jenni):**
- 🔒 **WCAG audit still the standing gate** — the new mode inherits the a11y hygiene
  (`role=tablist/tab`, `aria-selected`, `aria-live` result host, keyboard combobox, focus
  rings, expanders with `aria-expanded`) but the full contrast/semantics pass is still owed.
- **Phase 2 — the whole-catalog review sheet** per college (every course → current TOP →
  recommended CIP → confidence, CSV/table) is the CO "wow" and the natural next build. The
  `computeRecommend` seam already returns everything a batch pass needs.
- Phase-0.5 embeddings / Phase-1 Sierra remain the recall upgrade path.

Side-lane discipline held — `cpl_todos.json` + the numbered handoff untouched.

### 2026-07-17 (later) — SkyLiftoff: field-plunking fixes (prefix leak + crosswalk-anchored best matches)

Sam stress-tested the live tool ("plunking for plinkers") and surfaced two real
lexical-quality issues — both fixed on a follow-up PR (JS-only, no data change):

1. **Subject-code prefix leaked into scoring (bug).** Course labels are
   `"<SUBJ> <NUM> — <Title>"`. The scorer tokenized the WHOLE label, so
   `BUS 103 — Advertising` → the token **`bus`** matched **49.0205 Truck and Bus
   Driver** at 79%. Fix: `courseTitle()`/`courseText()` strip the `SUBJ NUM —`
   prefix before tokenizing (in `courseToks`, `computeRecommend`, `renderFit`) —
   score only the human title + catalog description. `_courseToks("BUS 103 —
   Advertising")` → `[advertis, media, campaign, design]`; 49.0205 drops out; the
   real Advertising code stays. Kills the `NC`/`ES`/`CHLD`/bare-number noise too.

2. **The inline "★ Best matches" was lexically guessing (quality).** For a fixed
   CIP it ranked the college's courses by raw keyword overlap, so generic words in
   long CIP definitions pulled cross-domain courses to the top: **history** courses
   topped *American Literature* (shared "american/united states"), a **childcare**
   course sat in *Aesthetician* (shared "health/safety/nutrition"), **theater** in
   *Drafting* (shared "design"). Fix: **anchor best-matches on the crosswalk** —
   `bestMatchCourses()` prefers the college's courses whose CURRENT TOP maps to this
   CIP (the inverse of the `topcip` map = the two-signals-agree anchor), ranked by
   description-fit, then fills the rest with the closest-by-description courses;
   falls back to pure lexical when the code has no mapped courses. American Lit →
   all ENGL; Aesthetician → all ESTH/skin; Drafting → all DRAF. The CIP-first
   inline check now thinks like the course-first recommend mode.

**A fix I prototyped and REJECTED:** a naive "coverage" reweight of best-matches
(down-weight courses that miss the CIP's high-IDF terms) — the prototype showed it
drops the *real* Advertising course and lets `AUTO 168` in on the shared word
"transmission" (**identity ≠ rarest term**). Crosswalk-anchoring is the principled
fix; don't ship differently-odd for known-odd.

**Honest limits (surfaced by plunking, not fixable — no data):** when a college
doesn't teach a field, the crosswalk has nothing to anchor (Citrus has no theology
→ Bible/Biblical Studies falls back to lexical noise, with "Literature of the Bible"
—an *English* course—correctly NOT anchoring there; no welding → the anchored set is
catch-all "independent study" courses). The tool degrades to "closest by description"
rather than pretending — method+magic honestly runs out of clues, and says so.

**Verification:** tests 84 → **89** (prefix-strip unit + `Truck and Bus` homonym
guard + anchored-leads + non-anchored-below + lexical fallback). Real Chromium
(Citrus): American Literature → all ENGL, Advertising pick → **no 49.0205**, recommend
BUS 103 → 09.0903 Advertising #1; 0 overflow, 0 console errors. New seam
`_bestMatches(cipRow, courses)`. Side-lane discipline held.

### 2026-07-17 (later) — SkyLiftoff: adversarial audit + a 4-fix quality pass

Ran a **5-agent adversarial audit fleet** (Workflow) over the merged easy button —
data integrity, recommendation quality over ~28k real courses, interaction/regression,
code correctness, a11y — each finding independently re-verified by a skeptic agent.
It **confirmed two real bugs**; Sam's live "plunking" surfaced two more. All four
fixed in one pass (`cip_crosswalk.js`, no data change):

1. **Noncredit CIP won the green ✓ over the official credit code (audit, HIGH).** The
   candidate sort keyed purely on lexical score, so a credit course spuriously
   matching a noncredit code took the ✓: "MATH 003F — Differential Equations" →
   ✓ `32.0202 High School Equivalent Exam Prep` on the word *"equivalent"*; Poli-Sci
   → `33.0104 Community Involvement`; the official credit CIP sat discarded in the same
   list. Fix: **credit-first candidate sort** (a `Noncredit`-category CIP never
   out-ranks a credit one; within a class description-fit still decides, so Painting >
   generic Art is preserved). Real impact: credit-course noncredit-✓ false positives
   **Berkeley City 3→0, Marin 7→0**; MATH 184 Diff-Eq top candidate `53.0105 [Noncredit]`
   → `27.0101 [credit]`.
2. **Boilerplate leaked into the ⚠ "outside the crosswalk" drawer (audit, MEDIUM).**
   The `beyond` filter had no boiler guard, so `32.0107 Career Exploration` self-ranked
   at rel 100 and surfaced (auto-opening) on courses like Intro-to-Engineering. Fix:
   `&& !BOILER[o.r.code]` in the beyond filter.
3. **Catch-all courses polluted the best-matches (Sam).** `STEM 698 — Cooperative
   Education` / `NC 686 — Workplace Skills` carry broad interdisciplinary TOPs that map
   to dozens of CIPs, so they anchored to `52.0304 Accounting & Finance` sharing zero
   accounting vocabulary. Fix: the anchored set now requires **description-fit > 0**
   (the second signal) — a TOP mapping alone isn't enough.
4. **The list "flailed" when a college has no course in the field (Sam).** For a CIP a
   college doesn't teach (`01.0902 Agricultural Animal Breeding`, `05.0101 African
   Studies` at Citrus), nothing anchors and the lexical fallback grasped at generic
   words. Sam's call: **don't dress up word-overlap as a match** — show an honest
   *"None of your courses map to <CIP> — pick from the full list if you like"* notice
   + the whole A–Z list. `bestMatchCourses` now returns `{anchored, lexical}` so the
   picker can be honest about which it's showing.

**Method notes:** the audit's independent verifiers earned their keep — the noncredit-✓
bug fires on the most common transfer subjects (Math/English/Health) and no amount of
single-course plunking would have surfaced its *scale*. And Sam's plunking found what
the fleet was still chewing on — the two work in tandem. A prototyped "coverage reweight"
was again rejected (it drops real courses). Tests **89 → 96**. Full story of the audit
lives in the workflow journal; the confirmed findings + fixes are here. (An inverted-index
speedup for the scorer — the enabler for the Phase 2 whole-catalog review sheet — is
staged on the Phase 2 branch, not this fix PR.)

### 2026-07-17 — SkyLiftoff: Phase 2 — the whole-catalog review sheet

The third mode, **📋 Review my catalog** — turns the 800–1,500-course CIP-assignment
slog into review-and-approve. Design Fable-consulted, then verified end-to-end.

- **Third top-level mode** (📖 Browse · 🎯 Find my course's code · 📋 Review my catalog),
  stacks on phone; remembered in `localStorage`.
- **Department-scoped** (Fable's key steer: nobody owns 1,500 courses, they own ACCT).
  Pick a department → the tool computes suggestions for just those courses (**ACCT 19
  courses = 274 ms**), not a 40 s whole-catalog freeze. `parseSubject` splits the label
  prefix; the `★ All departments` option does the full pass for a whole-college CSV.
- **Triage tiles double as filters** (All / ⚠ To review / ✓ Ready / ◻ Manual), sorted
  review-first and fewest-candidate-decisions-first (a 2-way choice before a 7-way).
- **Trust framing (Sam/Fable):** "**Suggested**" not "Recommended"; **dashed chips →
  solid** on confirm (the unconfirmed state is visible without a word of nagging); one
  honest banner; matched terms on expand; CSV stamps `auto-suggested` vs `faculty-confirmed`.
- **Override + persist:** tap a row → the ranked candidates as single-select radios + a
  "search all codes" escape hatch (reuses `comboCore`); picking confirms; decisions
  persist in `localStorage` per college. **Bulk-confirm all ready matches in a department**
  in one tap — the speed lever (turns 900 glances into ~15 decisions).
- **CSV export** — the deliverable that replaces the emailed workbook, now course→CIP.

**Perf enabler — the inverted index.** `buildEngine` builds `POSTINGS` (term→rows);
`scoreAgainst` scores only CIPs that share a query token, not all 2,182 — a **pure
speedup, 400/400 identical output**, 28→12 ms/course. Per-department lazy compute is
chunked via `requestAnimationFrame` for big departments (progress line), and results
cache per college+department. The review mode reuses the audit-fixed `computeRecommend`,
so credit-first + no-boiler-beyond apply automatically — ACCT recommendations came out
accurate (Tax→`52.1601`, Auditing→`52.0303`, Payroll→`52.0302 Accounting-Tech`,
general→`52.0301`), review-first with ⚠⚑ flags where a stronger match sits outside the
crosswalk.

**Verified:** tests **96 → 109** (review seams, `parseSubject`, triage classification,
mode render, department pick, tiles, row-expand, override→localStorage-persist). Real
Chromium (Citrus, desktop + phone): ACCT 274 ms, bulk-confirm → "12 of 19 confirmed",
0 overflow, 0 console errors. New seams `_parseSubject`, `_reviewRows`.

**Open / next:** the deferred **WCAG audit** stays the standing pre-field gate; a
resumable cross-department progress + a saved-decisions summary would round out v1;
Phase-0.5 embeddings / Phase-1 Sierra remain the recall upgrade path. Side-lane held —
`cpl_todos.json` + the numbered handoff untouched.

### 2026-07-17 — SkyLiftoff: field-testing cascade → confidence, TOP-in-every-view, audit remediation + WCAG (#822/#823/#824)

Sam plunked the live tool hard ("trust and verify, I always say") and the plinkers
drove three merged PRs.

**#822 — crosswalk-relative confidence (the global-max undersell).** Sam: *"Accounting
is correct, but it only lists as plausible and should be 98-100, right? Is it a wrong TOP
that's throwing everything off?"* It wasn't the TOP — it was the **normalizer**. Confidence
had been the raw fit score against the *global* max across all 2,182 CIPs, so even a clear
crosswalk winner read ~60-77%. Fix: normalize each candidate's confidence against **the
best candidate in this course's own crosswalk set**, scaled by a `qf` quality factor
(`min(1, bestRel/65)`) so a genuinely weak field can't inflate to 100%. The ✓ Recommended
gate now also requires a real crosswalk margin (`cwMargin ≥ .25`) + `conf ≥ 85`. Verified
post-merge: **ACCT 101 Financial + ACCT 102 Managerial → ✓ 52.0301 Accounting at 100%
Strong** (was Plausible ~77%). The honest tail stays honest — Cooperative-Ed / Work-
Experience catch-alls (broad TOP, no distinctive vocabulary) still read low, which is
correct, not a bug.

**#823 — the TOP in every view + outside-crosswalk matches assignable.** Two Sam asks:
(1) *"it would be helpful to see the TOP next to the CIP in various views, so one could
see where they are and where they are going"* — every review row now carries a **current-
TOP subline** (`cipx-rev-ctopline`, "Current TOP NNNN.NN · title") beside the suggested
CIP chip: where they are → where they're going, at a glance. (2) *"If they want to assign
another CIP to the course, can you look in all areas of this tool to add that capability"*
— the review candidate picker now renders a **stronger outside-crosswalk match as a
selectable radio** (not just a ⚠ flag), so faculty can assign a code the crosswalk missed.
The ⚠ still fires (honest signal) but no longer dead-ends.

**#824 — audit follow-through (functional/data) + the WCAG gate.** A 5-dimension
adversarial audit Workflow (28 agents, find→verify) plus Sam's continued plunking
converged on a clean fix list:
- **The TOP sentinel bucket.** The searchable workbook carries a `"No TOP Match in
  Records"` bucket (~1,331 pairs, **27% of the emitted map**) that no real course's TOP
  ever resolves to — pure noise in the candidate space. The generator now skips any
  non-`NNNN.NN` key: **420→419 TOPs, 4,865→3,534 pairs**, 2,325 reference rows unchanged.
- **Boilerplate quarantine.** The 2 universal noncredit codes (`32.0107`/`32.0111`)
  self-rank rel~100 on ~275 TOPs and were surfacing atop fallback lists ("Accounting &
  Finance" → STEM/noncredit catch-alls, the plinkers Sam kept hitting). A `nonBoiler()`
  filter now guards **every** fallback ranked display (search suggest, inline candidates,
  recommend no-crosswalk / only-generic fallbacks, review picker) so they only ever live
  behind the boiler expander. **Method note:** the audit's independent verifiers matter —
  this fires on the most common paths and single-course plunking can't reveal its *scale*.
- **comboCore listener guard** — the document `mousedown` listener closes + bails on a
  detached box (mode switches were orphaning a listener).
- **WCAG pass (the standing pre-field gate).** `aria-live="polite"` on the recommend
  result host; `aria-expanded` on every expandable row (browse / recommend / review),
  set on create + updated on toggle; `aria-selected` on the active combobox option;
  contrast darkenings (`--cipx-muted` #6a7f96→#566a80, `--cipx-ret-fg`, `--cipx-new-fg`)
  + a new `--cipx-recbadge-bg` token (#3f6b4e light / #7cc79b dark, white-on-green now
  passes) behind the ✓ Recommended badge. Tests **109 → 123**; real Chromium (desktop +
  phone, light + dark): aria present everywhere, no boilerplate in any ranked display,
  0 overflow, 0 console errors.

**Still owed / roadmap (Sam's steer):** (a) *unify "assign a CIP"* across all three modes
so the recommend mode's inline check and the review picker share one persistence path;
(b) **Phase 3** — *"port the verified CIPs directly to COCI … an API or batch upload
process"* to spare colleges course-by-course entry (the review sheet's confirmed
decisions are the natural payload); (c) remaining WCAG polish (full tablist⇄tabpanel
semantics, meter `role`/value, reduced-motion, SR announcement copy) before the field
release beyond Raul + Jenni. Side-lane held — `cpl_todos.json` + the numbered handoff
untouched.

### 2026-07-17 — SkyLiftoff: Review-tab polish batch, and a work-experience discipline rule (#826)

Sam plunked the Review-my-catalog tab at Norco/ACC and sent a 6-item batch. Five are
UI polish; one is a real doctrine call.

1. **Mode-tab icons → hairline SVG.** The 📖🎯📋 emoji read "cliparty" (Sam). Sam left
   the door open — *"if you had more elegant ones maybe I'd think differently."* Answer:
   an `svgIcon(d)` helper (createElementNS, `stroke:currentColor`, fill:none, 1.6
   hairline) → open-book / magnifier / clipboard-with-check glyphs that inherit the tab
   color (muted idle, accent active). Elegant, cohesive, CodeQL-safe. **Lesson: "drop the
   emoji" often means "give me a tasteful monochrome glyph," not "no icon" — offer the
   elegant version.**
2. **Department picker up in the college bar.** `reviewView` now appends the dept
   `<select>` into `collegeSelEl.parentNode` (one control row); `collegeBar` holds back
   its "check one course" hint in review mode.
3. **Count chips one-line** (`.cipx-rev-tilel{white-space:nowrap}`).
4. **TOP → CIP transition.** Each row reads `TOP NNNN.NN → CIP [code title]` (`.cipx-rev-tocip`)
   with a "CIP" label + a bigger/bolder boxed code (the focal point); the redundant
   expanded "Current TOP" line is gone; each crosswalk candidate carries a `← TOP NNNN.NN`
   tag (`.cipx-rev-candtop`) so the lineage is apparent, while outside-crosswalk ones keep
   their "outside crosswalk" tag — the two tags now *distinguish* crosswalk vs outside.
5. **Work-experience discipline rule (the doctrine call).** Sam: work-experience /
   cooperative-education courses "should always stay in the discipline based on the course
   discipline. Colleges often offer a work experience class within their discipline so it
   can be applied to their degree or cert. The fact that it's 'work experience' should not
   be factored into the algo's decision that it might fit better elsewhere." → new
   `isWorkExperience(label)` (matches "work experience", "cooperative (work) education",
   "occupational work experience", "work-based learning"); in `computeRecommend`,
   `if (isWorkExperience(label)) beyond = []`. This zeroes the outside-crosswalk drawer +
   the ⚑ flag + the "your TOP may be off" note for them, in BOTH recommend and review
   modes (single choke point). **Verified: ACC 200 Work Experience → no ⚑; ACC 62 Payroll
   Accounting (not WE) → still flags.** This is the same family of "a generic wrapper
   course's vocabulary lexically matches the wrong field" that the boiler quarantine and
   the catch-all >0-overlap guard address — work-experience is the third such carve-out.
6. **Meter % overflow** — `.cipx-rev-cand .cipx-meterwrap{min-width:0}` (the shared
   meterwrap's 150px min exceeded the 132px review-candidate grid column, pushing the %
   past the card edge).

Tests **123→128**; real Chromium (Norco/ACC, desktop + phone, light + dark), 0 overflow /
0 console errors. Side-lane held. **Open/next unchanged:** unify "assign a CIP" across modes,
Phase 3 batch/API port to COCI, the remaining WCAG polish (the standing pre-field gate).

### 2026-07-17 — SkyLiftoff: the cross-college CONSENSUS engine + multi-CIP (#829–#832)

The session's biggest arc — Sam live-designed a chain of features on the Review tab, each
plunked and shipped. The headline is the **consensus engine**: the corroborating "how do
peers code this course?" signal that turns the tool into a real easy button.

**#829 — college glyph + TOP titles inline.** The `🏫` label became a hairline institution
glyph (svgIcon). TOP titles now show inline everywhere a TOP code appears ("TOP 0407.00 ·
Zoology, General"), which alone makes a mis-coding self-evident. **Lesson (the pivotal
one):** a lexical "⚠ check TOP" mis-coding indicator I prototyped fired on ~19 of 21 BIO
courses — including *correctly*-coded ones — because a single course's description
lexically matches many CIPs. **Flagging a mis-coded TOP needs a CORROBORATING signal, not
a single-course lexical guess.** Dropped it; that failure motivated the consensus engine.

**#830 — the cross-college TOP consensus (Sam's idea).** One college's TOP is unreliable
(§7), but the CROWD is rich: across ~114 colleges, how do peers teaching the *same course
title* code it? `kb/_build_course_top_consensus.py` → `course_top_consensus.json` (408 KB,
committed, lazy-fetched): normalized title → per-TOP **distinct-college lists** (names
interned). 141,738 courses → 4,162 titles with ≥4 colleges. The review-row drawer shows a
**"Field consensus"** block: Sam's honest **"(M use, K differ)"** metric (which also
surfaces small-n — "2 use, 1 differ" reads thin), a **differ-hover** listing *which* TOPs
and *which* colleges differ (Sam: "cut to the chase for the curious"), the **outlier note**
("1 of 48"), and the **consensus CIP as a one-click candidate**. The consensus CIP = the
modal peer TOP's *best description-fit* crosswalk CIP — **two signals agree**: peers pick
the field, description-fit picks the specific CIP within it. Worked example: Norco's "BIO 4
— Human Biology" (coded Zoology, crosswalk→Zoology) is **1 of 48**; 43/48 code it
Biology-General; the block surfaces **30.2701 Human Biology**, which the lexical read missed.
**We do NOT correct the (abandoned) TOP — we harvest the agreement to strengthen the CIP.**

**#831 — multi-CIP + field-consensus-first ordering.** (a) A course can carry **>1 CIP**
(interdisciplinary; field decides): decisions are arrays (legacy strings migrate),
candidate rows are checkboxes (toggle, immediate-save), the chip shows "primary +N",
toggling keeps the row expanded (`revOpen`), "+ Add another code…" reuses the search
combobox, CSV joins with "; ". (b) Sam: "lead with the field consensus … then the other
signals" → `reviewExpand` renders **strongest-first**: Field consensus → "From this course's
TOP crosswalk" → outside-crosswalk lexical. A shared `candRow()` powers all three; the
consensus CIP is only offered as a separate candidate when it's NOT already a crosswalk
one (no duplicates).

**#832 — one-line rows.** Narrowed the course column + widened the transition + nowrap +
truncating TOP/CIP titles (full on hover), so all rows sit on one line.

**Method note (durable):** `docs/kb-notes/methodology-crowd-consensus-beats-single-item-signal.md`
(to author) — when a per-item signal is too noisy to gate on, aggregate the same decision
across a large peer set and use the modal + an honest agreement metric; it's the
two-signals-agree gate applied via the crowd. **Open/next (Sam's vision):** use the
consensus to **pre-fill** confident CIPs across the whole catalog (the true easy button —
"populate the whole kit and kaboodle"); extend the consensus block to "Find my course's
code"; the standing WCAG pass. Tests 123→**140**; real-Chromium verified throughout.
Side-lane held.

### 2026-07-17 — SkyLiftoff → SkyEasy handoff: the recommended-CIP inline "easy button" (#834)

Capping the consensus arc, Sam: *"shouldn't we show inline and beneath the current TOP/CIP,
the recommended one — easy button?"* Each collapsed review row now shows a **second line**
beneath the `TOP → CIP` transition with the strongest recommendation (`reviewRecommendation(r)`
= peer field consensus when confident, else the crosswalk winner). Two forms: blue
**"✓ Recommend `<code>` · `<title>` · N of M colleges"** when it differs from the shown
code (the better answer), green **"✓ Recommended — N of M colleges"** when peers confirm.
A curator scans a whole department and sees, per row, current-vs-recommended + confidence,
without expanding. That's the easy button made visible. Tests 140→**141**; real Chromium
(Norco/BIO) verified. **This is DISPLAY only** — the recommendation is not yet the default
*assignment* (bulk-confirm / ✓Ready still use the crosswalk `r.sug`); making the
recommendation drive the assignment across the whole catalog is **priority #0** (the
"kit and kaboodle" pre-fill Sam named).

**Session close (SkyLiftoff → SkyEasy).** 13 PRs on the CIP tool this session (#822–#834):
confidence fix, TOP-in-view, audit remediation + WCAG, the 6-item polish batch, college
glyph + TOP titles, the **cross-college consensus engine** (the headline), multi-CIP +
field-consensus-first ordering, one-line rows, and the recommended-inline easy-button line.
The tool went from a single-course fit-check to a statewide-corroborated, review-and-approve
easy button. Next session is **SkyEasy** — priority #0 is the whole-catalog consensus
pre-fill; full pointers in `docs/cip_crosswalk_handoff.md`.

---

## 2026-07-17 — SkyEasy: the Review-tab v2 (subject-scoped consensus + the two-box redesign)

Sam live-tested the recommended-inline easy button and sent 7 observations. The headline
was a **soundness catch** (his instinct, confirmed in the data):

- **Subject-scoped consensus (his BIO 35 "Health Science" catch).** The title-only consensus
  pooled a course across *every* department that reuses the words. "Health Science" is a
  **Health** course at most colleges (TOP 0837 Health Education → CIP 51.0001) but a **Biology**
  course at a few (TOP 0499 Other Bio Sci → 26.0101). The health majority (8 of 11) then wrongly
  recommended switching Norco's *Biology* "Health Science" to a Health CIP. Fix: the consensus is
  now **scoped to same-discipline peers** — a BIO course is compared only against other BIO/BIOL/…
  peers (`subjMatch` = alpha-upper prefix-containment, min 3 chars, folds BIO≈BIOL≈BIOSC). Data
  regen carries a per-(title,TOP) **subject list** (`kb/_build_course_top_consensus.py` → parallel
  `[top,[cIdx…],[sIdx…]]` + interned `subjects[]`). Verified on real Norco data: BIO 35 → **Ready**
  (3 of 3 BIO peers agree with Norco's 26.0101, no false switch); **BIO 4 Human Biology** stays a
  correction (42 of 47 BIO peers use Biology-General 0401 → 30.2701; Norco alone uses Zoology 0407).
  Falls back to the full-title consensus when <3 same-subject peers exist; legacy consensus data
  without `subjects[]` degrades gracefully.

- **The "Suggested change" two-box row.** An outlier no longer silently becomes *Ready*. When a
  confident **discipline-scoped** consensus points at a DIFFERENT code than the crosswalk-from-TOP
  pick, the row is a **`suggest`** status: two **aligned** CIP boxes (point 1) — the muted
  "your TOP maps to X" over the emphasized "peers say Y N of M" — a calm **?** glyph (point 3, no
  more ⚠⚑), a new **? Suggested** triage tile, an **Accept all N suggested changes** bulk button,
  and **default-expanded** (point 6). Ready (crosswalk == peers) stays a one-box green-corroborated
  row, bulk-confirmable.

- **Other point fixes:** candidate **Select** button replaces the checkbox (point 4); every CIP box
  is **clickable → a ▾ "change to any code" dropdown** (point 5, `cipBox()` + shared
  `allCodeGroupsFor`); **Expand all / Collapse all** utility (point 6); one-click **accept** by
  clicking a box.

**State:** shipped as the SkyEasy v2. `course_top_consensus.json` regenerated (408→594KB, committed
static — no workflow rebuilds it). Tests: `tests/cip_crosswalk.test.js` 167 assertions (added
subject-scoping, two-box, Select button, change-dropdown, expand-all); full suite 166 files green.
Real-Chromium verified on the actual Norco/BIO catalog, desktop + phone, light + dark, 0 overflow /
0 console errors.

**Next:** Sam re-tests v2 live. Carryover from SkyLiftoff still open — **Phase 2 whole-catalog
review sheet** and the standing **WCAG pre-field gate**.

### 2026-07-17 (later) — two live-test fixes: credit-first consensus + ephemeral college

Sam re-tested v2 and caught two things:

1. **Credit-first for the consensus pick (COMM 13 catch).** The CO crosswalk attaches the whole
   **noncredit CIP family** (ESL / basic-skills / exam-prep `32.*`, provenance `n`) to nearly every
   TOP. `bestCipForTop` — which drives the *consensus* recommendation — only skipped the 2 hardcoded
   boiler codes and otherwise picked by raw lexical fit, so "Gender and Communication" (TOP 1506
   Speech Communication) recommended `32.0203 Undergraduate Entrance/Placement Exam Prep` because
   its description says "exam**ine**." `computeRecommend` already had a **credit-first gate** ("a
   Noncredit-category CIP must not out-rank a credit one") — that's why the *crosswalk* box correctly
   showed `09.0100`. The fix applies the SAME gate to `bestCipForTop` (credit-first, then by score),
   so the consensus pick agrees with the crosswalk pick. Result on real Norco data: the whole COMM
   department went **1 bogus suggested-change → 12 clean Ready rows**, COMM 13 → `09.0100
   Communication, General` (11 of 11 peers). Falls back to noncredit only when a TOP has no credit CIP.

2. **Ephemeral college selection.** The picked college was persisted in `localStorage`
   (`cipx_college`) and restored on every load — it survived a hard refresh. Sam: "should clear on
   close." Removed the restore + the write; the college now lives only in memory for the session
   (`st.college`), so a fresh open / refresh starts blank. Per-college review decisions
   (`cipx_rev_<college>`) still persist — that's the user's work product, not the selection. Tests
   updated to pick the college via the dropdown (the real flow) instead of relying on the restore.

Tests 167 → **169** (credit-first `bestCipForTop`, ephemeral-college). Real-Chromium: COMM 13 Ready,
college blank on load despite a stale storage value, 0 overflow / 0 errors.

### 2026-07-18 — work-experience courses stay in their discipline (peer-consensus guard)

Sam (Bakersfield ARCH): "ARCH B48WE — Work Experience Education" was recommending **`13.0407`
Community College Administration**. Root cause: the title "Work Experience Education" is shared
across **every** department, so the cross-title peer consensus pooled all disciplines' work-
experience courses — most filed under the generic **TOP 4932 (General Work Experience) → CIP
13.0407** — and that discipline-blind modal overrode the course's own Architecture TOP (0201 →
`04.0201`). Subject-scoping didn't save it: too few *ARCH* peers share the generic title, so it
fell back to the full-title pool. The codebase already had `isWorkExperience()` + a doctrine
comment ("belongs to its own discipline's crosswalk CIP"), but the guard was only applied to the
lexical *outside-crosswalk* nudge — **not** to the peer consensus. Fix: `consensusPick()` and
`consensusSummaryEls()` now return null for work-experience courses, so they keep their own TOP's
crosswalk CIP and the misleading field-consensus block is suppressed (+ a short in-expand note
explaining why). On real Bakersfield data the ARCH department went 1 bogus suggested-change → 0,
ARCH B48WE → `04.0201 Architecture`.

**Deferred (a real edge case, worth a later look):** a work-experience course coded under the
*generic* TOP 4932 (not its discipline TOP) still shows `13.0407` from its own crosswalk — the
tool faithfully reflects the college's own (arguably mis-coded) TOP. Truly pinning those to the
discipline needs a subject→discipline inference (e.g. the modal TOP of the college's same-subject
sibling courses); Bakersfield codes ARCH work-experience under the discipline TOP 0201, so the
common/correctly-coded case is fixed. Tests 169 → **172**.

### 2026-07-18 (later) — the general rule: cross-discipline consensus can corroborate, never override

Sam (American River CARPT): "CARPT 224 — Materials of Construction" (an obvious Carpentry course,
subject CARPT + TOP 0952.10 Carpentry → `46.0201`) was recommending **`04.0901` Architectural
Technology**. Same shape as the work-experience bug but not a work-experience title, so that guard
didn't catch it: "Materials of Construction" is taught across many construction disciplines; the
cross-title consensus pooled 15 colleges (8 under an Architecture TOP → 04.0901), and there were
too few CARPT peers for subject-scoping to engage, so it fell back to the discipline-blind pool.

This generalizes the doctrine (supersedes the narrow work-experience guard for this class): a peer
consensus may **OVERRIDE** the course's own discipline **only when it is SUBJECT-SCOPED**
(`cons.scoped` — drawn from same-discipline peers). A full-title fallback (`consensusFor`'s
cross-discipline pool, used when <3 same-subject peers exist) may only **CORROBORATE** — if it
agrees with the course's own crosswalk it confirms Ready; if it disagrees it's discarded, and the
course keeps its own discipline's crosswalk CIP. `reviewRowOf` now starts from the own-TOP crosswalk
baseline and lets only a trustworthy consensus refine it; `consensusSummaryEls` hides the field-
consensus block unless it's scoped-or-agrees. Legit same-discipline corrections still fire (BIO 4
Human Biology: 42/47 BIO peers → scoped → suggests 30.2701; a mis-coded Nursing course: many NURS
peers → scoped → suggests the nursing CIP).

On real American River data the CARPT department went 1 bogus suggested-change → 0; CARPT 224 →
`46.0201 Carpentry`. Tests 172 → **174** (cross-discipline no-override + non-scoped-corroboration);
the `RCONSENSUS` test fixture now carries subjects (real data always does), so the Nursing outlier
stays a scoped override. Real-Chromium verified.

### 2026-07-18 (later still) — "quiet by default" row density (prototype → shipped)

Sam noticed the CARPT screenshot's simplicity ("if we can get to a level of simplicity like that
in our normal view, it might reinforce our easy-button approach") and asked me to think through the
tradeoff. Diagnosis: CARPT looked clean because those rows carry no peer-consensus caption; COMM/BIO
looked heavier because most Ready rows carried a second line — "✓ N of M colleges agree." That
caption was ~all the visual weight.

Prototyped the "quiet by default" density in a fast-feedback artifact (current ⇄ proposed toggle on
8 real row types, both themes) → Sam: "ship it." Ported: a Ready row is now a clean one-liner. The
peer-corroboration metric moved OFF the row to (a) the ✓'s tooltip + a faint accent **dot** ("hover
for the count") and (b) the expanded card (unchanged). The two-box **Suggested** row keeps its full
display — the rare row that earns the space, and quieting everything around it makes it pop. Aggregate
trust still shows in the tiles + the "N peer-corroborated" progress line. On real Norco/COMM data the
department went from a caption on every Ready row → 12 clean one-liners, 10 with the ✓· dot. Tests
174 → **176** (no caption line; peer-corroborated Ready row carries the dot + count-in-tooltip).
Method note: `docs/kb-notes/methodology-quiet-by-default-row-density.md` candidate.

### 2026-07-18 (rapid live-polish) — "simpler, simpler, simpler" + Coco the mascot

A fast back-and-forth on the Review row/summary layout, all shipped:
- **CIP codes line up + boxes are uniform width.** The inline TOP *title* (variable length) was
  what pushed the CIP boxes to ragged positions — dropped it to the TOP tooltip so every label is
  "TOP NNNN.NN" (tabular, uniform width) → codes align. The box column is now `1fr` and the chip
  fills it (title ellipsizes, ▾ anchors right) → every box the same width, one line each.
- **Em dash → plain gap** on the course label ("BIO 4  Human Biology" — bold number + gap; full
  label with the dash stays as the hover tooltip + the storage key).
- **Bulk Confirm/Accept ride on the tiles row** (right-aligned) instead of their own strip.
- **Top-right utility rail**: Theme + Expand-all + CSV stacked, one width "for harmony," reclaiming
  the old full-width utils row. Horizontal on phones. The Theme toggle moved out of its lone
  absolute corner into the rail.
- **🐾 Coco** — a muted, outlined line-art puppy mascot rides at the top of the rail as the tab's
  emotional-support pet (`cocoMascot()`, createElementNS SVG, currentColor so it themes).

**Product seed (Sam, for Raul's TOP→CIP Toolkit doc):** Coco could graduate from mascot to the
toolkit's **AI assistant** — ask-a-question / jump-to-section so faculty don't wade through the
whole doc. Wiring target: the existing Sierra `/functions/v1/cpl-chat` edge function (finder-not-
decider posture, per the §7 TOP caveat). Not built yet — captured here + in the handoff.

Tests 176 → **180** (tiles-row buttons, rail with Theme/Expand/CSV, Coco present, em-dash-free
course name). Real-Chromium desktop + phone, light + dark, 0 overflow / 0 errors.

### 2026-07-18 checkpoint — 4 open Review-tab items (Sam, reviewing Cerritos AB)

Everything above merged (#836–#840). Sam checkpointed with four next-session items (full detail +
root-cause notes in `docs/cip_crosswalk_handoff.md` → "Sam's checkpoint steer"):
1. **Review rows show no visible mark** — the Review glyph "·" is near-invisible; give review
   courses a clear (calm) "look here" prompt.
2. **Triage counts read as arbitrary** — Cerritos AB: "8 Review" among rows that all show the same
   `47.0603` (TOP 0949.00), some Ready some Review with no visible reason. Surface *why* a row is
   Review, and make the count↔list relationship legible. (Root: the `conf ≥ 85` gate in
   `computeRecommend` splits identical-looking rows.)
3. **Review my catalog → first mode tab** + default.
4. **"Confirm all N" needs reassuring subtext** — communicate it's not final, nothing breaks; the
   real step is entering the code in COCI (decisions are editable `localStorage`).

Side-lane discipline honored: `kb/cpl_todos.json` + the numbered `docs/session_<N>_handoff.md` left
untouched (CCR mainline owns those); this checkpoint lives in the CIP handoff + this lessons doc.

### 2026-07-18 (SkyCoco) — the Review-tab legibility pass (#842): the 4 checkpoint items

Picked up SkyEasy's 4-item steer and shipped all four in one JS-only PR (`cip_crosswalk.js` +
`tests/cip_crosswalk.test.js`; Rule 4 untouched, no artifacts). Sam confirmed item 1 live mid-session
(*"should be a question mark for needing review"*) and sent his Cerritos AB screenshot as the ground truth.

1. **Visible "look here" mark.** The muted `·` Review glyph — invisible against `--cipx-muted` — becomes
   a **visible amber `?`** on the row *and* the tile. Recolored `.cipx-rev-stat-warn` / `.cipx-rev-tile-warn`
   muted → `--cipx-warn-fg`. The **Suggested** glyph moved `?` → **`⇄`** so the two attention states stay
   distinct (SkyEasy's "distinct from the Suggested ?" note honored). Full set now:
   ✓ Ready (green) · **? Review (amber)** · ⇄ Suggested (blue) · ◻ Manual (grey).

2. **The Ready/Review split made legible.** Root cause of Sam's confusion: on Autobody all 45 courses map
   to `47.0603` (they share TOP 0949.00), and the 37/8 Ready/Review split is *purely* the `conf ≥ 85`
   description-confidence gate in `computeRecommend` — invisible to the user. Fix (display-only, no
   reclassification): a dept-wide `codeCount` tally powers an **inline "why" line** on each Review/Manual
   row. For the Autobody case it reads *"Same code as 44 other AB courses here — likely right, but this
   course's description doesn't confirm it on its own. Open to confirm or change."* — which turns an
   arbitrary-looking split into an honest, reassuring one. A **"Showing all N …"** context line ties the
   tile counts to the visible list (+ a one-click **Show all** from a filtered view) — resolving the
   "8 Review among 45 shown" confusion. **Doctrine note:** the sibling-count is TOP-derived (same TOP →
   same crosswalk CIP is definitional), so per the §7 TOP caveat it is used *only* to DISPLAY/explain —
   never to gate or upgrade a row's bucket. A Review row stays Review; the copy says "likely," not "is."

3. **Review-first + default.** `modeBar` reordered to `[Review · Browse · Find]`; `st.mode` defaults to
   `review` (init, `ingest()` MODE_KEY read, `_setMode` all flipped). A returning user's explicit tab
   click (which writes `cipx_mode`) is still honored — only new/unset users land on Review. Browse-view
   jsdom tests were pinned to `cipx_mode=browse` since the default moved.

4. **Confirm-all reassurance.** A muted line under the bulk buttons + the button's own tooltip: *"Confirming
   just fills in your starting point here in the browser — it's never final, every code stays editable, and
   nothing reaches COCI until your college enters it there."* Shown exactly when a bulk-confirm/accept
   button is present.

Ready rows stay clean one-liners (the quiet-by-default pass preserved) — only attention rows earn a reason
line. Tests **180 → 190**. Verified in **real Chromium on live Cerritos AB data** (desktop + phone, light +
dark, 0 overflow, 0 console errors) — the reported figures are the actual rendered ones, not fixtures.

**Method that worked (carry it):** Sam's live screenshot of the *exact* broken case + a headless-Chromium
driver that loads the *same* college/department is the tightest possible loop — the "44 other AB courses"
number in the fix is the real rendered value on his data, so the before/after is concrete, not "should be
fixed." Plus a 4-lens adversarial review of the diff (correctness · UX-honesty · WCAG · §7 doctrine) before
merge. Side-lane discipline honored: `kb/cpl_todos.json` + the numbered handoff untouched.

### 2026-07-18 (SkyCoco) — the program-coherence default + Cañada mojibake (#843)

Live-testing the Review tab on Cerritos welding surfaced two things:

1. **The "sus" recs → a program-coherence default (Sam's idea).** The Ironworker (**IWAP 40.xx**) courses
   are coded under the broad **TOP 0956.00 "Manufacturing & Industrial Technology"**, whose *official CO
   crosswalk* is a grab-bag with no ironworking CIP. On a "no clear winner" row the box surfaced a **weak**
   lexical pick (Rigging → `15.0405` Robotics, conf **26** among 13 candidates) as if it were a
   recommendation — a perfect §7 "TOP is unreliable" case in the wild. **Not our bug** (the crosswalk is
   faithful); the fix is honest *presentation*. Sam: *"for no clear winner and there are a bunch of other
   IWAP courses with the welding CIP, I'd default the rec to welding — still noting that it needs review."*
   Implemented as `effectiveSug()` + `deptTop`: a Review row whose own pick is weak **and** uncorroborated
   (its code is used by fewer than `REV_DOMINANT_MIN`=3 of its dept siblings) **defaults its box to the
   department's dominant code** (`48.0511` Metal Fabricator, used by 13 IWAP courses) — **still Review**, with
   an honest *"defaulted to … the code N of your IWAP courses use. Still needs review."* Display-only; never
   changes a row's status (the corroborated Autobody rows are untouched). CSV: `program-default (N …)`.
   *Adversarial-review catches (folded in before merge):* subject-scope the sibling count so the "★ All
   departments" view doesn't over-count/mislabel; drop "likely right" (same-TOP siblings are correlated, not
   independent evidence — §7); add an `aria-label` to the status cell.

2. **Cañada College mojibake.** The manifest stored `CaÃ±ada College` (a UTF-8 `ñ` decoded as Latin-1
   upstream). Repaired the committed name → `Cañada College` (+ slug + file rename), and hardened
   `kb/_build_cip_fitcheck.py`'s `clean()` with a `_demojibake()` Latin-1→UTF-8 round-trip so a regen
   self-heals. Method note: mojibake is repairable via `s.encode('latin-1').decode('utf-8')` gated on a
   tell-tale-byte regex; leaves clean names + em-dashes untouched (unit-tested).

### 2026-07-18 (SkyCoco) — inline multi-CIP add + apply-to-subject (#844)

Sam co-designed (prototype → lock → port) a full multi-CIP capability. Prototype:
https://claude.ai/code/artifact/114df6ab-184a-4b21-b0af-4ae62f241d09

- **`+` beside the box** adds another CIP **inline** (tooltip); extras **stack under** the primary, each
  removable (`×`); supports 3+.
- **Anchor-OK (Sam point 1):** clicking `+` before the original is OK'd asks to confirm it *in the popup*
  first ("OK — confirm 47.0603") — it becomes the anchor, changeable later without affecting added codes.
- **Prompt** (Sam's words) → **Apply to other courses** → a checklist of **only the subject courses that
  share this course's primary CIP** (Sam's scoping), pre-checked, Select-all/Clear, "has N extra" markers.
- **Assigned vs Validated (Sam point 2) — the key model change.** `✓` now means *individually validated*
  (accept a box / OK the anchor / select in the expand / Confirm-all), NOT merely "has a code." A course
  that only received a **bulk-applied** code from a sibling has the code but **stays in Review (`?`)** so it
  can be tuned individually, with an honest *"received N CIP codes applied from a sibling — review and
  confirm it, or leave it for a later pass."* New store `cipx_revok_<college>` (validated set) is separate
  from `cipx_rev_<college>` (assigned codes); the ✓ glyph, the "N confirmed" count, the Confirm-all filter,
  and the CSV `Source` (`applied (not yet validated)`) all key off it. **Watch-out for the next session:**
  every individual-confirm path must call `revSetValidated(label, true)`; the bulk-apply path must NOT — if
  you add a new assignment action, wire its validation deliberately.

Tests **190 → 207**. Verified in real Chromium on live Cerritos AB/IWAP (desktop + phone, light + dark, 0
overflow / 0 console errors) throughout. Method that keeps paying off: **Sam's live screenshot + a
headless-Chromium driver on the same college/department**, and (for the design-heavy multi-CIP) a
**clickable prototype locked with Sam before porting**. Side-lane discipline honored across all three PRs:
`kb/cpl_todos.json` + the numbered session handoff untouched.

### 2026-07-18 (SkyCoco) — Phase A: precomputed baseline status counts (#846)

Sam's **next-steps** message opened the progress-dashboard workstream: when a college opens the tool it
should see status-count boxes (like the per-subject counts, but for the whole college), plus system-level
counts, plus counts in both selector dropdowns ("37 OK, 244 Review, Last Active 7-18-2026"). Then two
strategic questions: **who may edit** (per-college team phrase vs open vs a COCI auth button vs magic
links) and how validated CIPs reach COCI. Sam's calls: **"Phase A first"**, **"fold [the access analysis]
into note."**

**The distinction that shaped everything — two kinds of "counts."** Sam's example line blends two different
data sources, and mixing them defeats the read:
- **Engine baseline** — how many courses exist and how the *tool* classifies them (Ready/Review/Suggested/
  Manual). Deterministic, identical for every viewer, **no human input → no backend**. This is "how much
  work exists."
- **Human progress** — how many faculty **validated** (`cipx_revok_`, #844) + Last Active. This is work
  *product*; today it lives only in one browser's `localStorage`. To show it per college / statewide / to
  anyone, it needs a **shared store → backend**.

Phase A ships **only the engine baseline** — and keeps it visually distinct from progress ("engine says
Review" ≠ "faculty validated"). Live progress + last-active are **Phase B**.

**What shipped (backend-free):**
1. **Statewide baseline line** (Sam #2) — "131,715 courses across 120 colleges · 59,340 flagged for review ·
   70,187 a confident match", with a muted note that these are *classifications, not confirmations*.
2. **College-open overview tiles** (Sam #1) — the whole college's Ready/Review/Suggested/Manual boxes,
   rendered the moment a college is picked and **before** a department is chosen; **hides on dept-select**
   (the per-dept review UI takes over). "Your validated progress fills in as you confirm" flags the Phase-B
   seam.
3. **Dropdown counts** (Sam #3, baseline half) — the college option carries "· N to review"; each department
   option carries "· N review". The `populateCollegeSel()` restore-selected-college fix keeps the current
   pick when the counts arrive and re-populate the list.

**The build — single source of truth, no re-implementation.** A live classify is a multi-second freeze per
college and infeasible statewide (~132k courses), so the counts are **precomputed** into a committed
`cip_status_counts.json` the tab fetches once. The keystone: `kb/build_cip_status_counts.js` runs the
**shipped classifier** (`cip_crosswalk.js` itself) over every college via its existing seams
(`_setData`/`_setConsensus`/`_reviewRows`) — so the baseline can **never drift from what the tab shows**. Two
build lessons worth carrying:
- **Load the engine in a bare `vm` context, not jsdom.** The seams never touch the DOM, so a minimal
  `window`/`document`/`localStorage` stub is enough — and it's dramatically faster than jsdom (jsdom made the
  single-process build ~40 min and hit a resource ceiling).
- **Split across short-lived worker processes.** A pool of `min(6, cpus−1)` `child_process.fork` workers,
  each classifying a small batch of colleges then exiting, keeps any one process short/light. ~9 min total,
  reproducible. Re-run when the crosswalk / course / consensus inputs change (documented in the script header).
  `cip_status_counts.json` is a **static committed artifact**, exactly like the tab's other data
  (`cip_crosswalk_data.js`, `cip_fitcheck/*`, `course_top_consensus.json`) — no workflow regenerates any of
  them, so committing it keeps the whole tab's data model consistent.

**Baseline numbers (2026-07-18):** 120 colleges, 131,715 courses; systemwide **70,187 ready / 59,340 review /
2,016 suggest / 172 manual**. Cross-checks that gave confidence: Cerritos college-level 938 ready / 847 review
matched a direct classify; the AB dept option "45 courses · 8 review" (⇒ 37 ready) matches Sam's original
screenshot (37 OK, 8 Review) exactly.

**The access analysis, folded into a note** (Sam: "Yes, fold into note") — `docs/cip_submission_access_plan.md`.
The reframing that unlocks it: **the real risk isn't "edits" — it's *irreversible, unattributed, cross-college*
edits.** Design **defense in depth**, not just a lock: (1) **scope** (RLS — a College-X session can't write
College-Y rows, the way `team_pass_ok()`/`is_allowed_reviewer()` already gate `cip_crosswalk_suggestion`);
(2) **attribution** (who + when on every change); (3) **reversibility** (append-only/versioned — the
`kb_curation` INSERT-only + receipts doctrine, Rule 9). With those three, a leaked credential is *contained,
traceable, undoable* — which makes the front-door choice low-stakes. Recommended layered model: **owner** =
college CIP coordinator (bootstrapped by COCI auth or a CO grant, seed `map_college_contacts`); **contributors**
= anyone the owner invites by **magic link** (college-scoped, light identity → attribution, individually
revocable) — which resolves the faculty-access tension Sam named (the faculty whose input you need lack COCI).
Ship the **team phrase as the MVP gate** (machinery exists), layer in magic links before wide release. The
Tech-Center COCI push (Sam's commissioned plan) takes the **validated set** as payload — human-gated, batch/API.

Tests **207 → 213** (statewide line · overview tiles · both dropdown counts · overview-hides-on-dept-select).
Verified in real Chromium on live Cerritos (desktop + phone, light + dark, 0 overflow / 0 console errors).
Side-lane discipline honored: `kb/cpl_todos.json` + the numbered session handoff untouched.

**Sequencing from here:** A (shipped) → B-progress store → B-access (phrase MVP → magic links) → B-COCI push.
A was independent and shippable today; B is the moment we commit to a shared backend — which we want anyway
for COCI submission, so **access + progress + submission are one project, built once.**

### 2026-07-18/19 (SkyCoco) — the Claude-for-Chrome live-test loop + six Review-tool fixes

Sam wanted to troubleshoot the CIP tool with **Claude for Chrome** but couldn't attach the repo. Two takeaways
that are worth carrying:

1. **Claude for Chrome is a diagnostician, not an editor** — it acts inside the browser (opens the live tool,
   reproduces, reads console/DOM/localStorage), but has no repo checkout or terminal. The productive division
   of labor: **Chrome diagnoses on the live site → hand the findings back to a Code session to implement + ship.**
   The self-contained prompt that worked is in the session chat (points at the live URL, gives the doctrine at
   the right altitude, asks for repro + evidence + behavior-level fix, "observe not edit"). *(Aside: the
   `cip_crosswalk_handoff.md` link Sam had was the `cpl-knowledge-base` copy, which 404s — the live handoff is
   the `cpl-project-tracker/docs/` copy. The tracker repo is public, so a link works, but the tailored prompt
   beats handing a Code-oriented handoff to a browser agent.)*

2. **Verify a browser agent's findings against the source before fixing — mechanism, not just symptom.** Chrome's
   report was excellent but two of six findings needed correction once I read the code + reproduced headless:

| # | Reported | Verdict | Root cause (verified headless) | Fix |
|---|---|---|---|---|
| 1 | Expanding a row auto-confirms | ✅ real, wrong mechanism | Expanding writes nothing; the **CIP box** one-click *accepts+validates* the default — and it's the big central target, easy to hit when aiming to expand | **Ready confirms; Review/Manual box OPENS the row** (`readyConfirm = r.status==="clear"`; else `onAccept: openRow`). Applied rows keep click-to-confirm |
| 2 | Counter diverges; mode-switch clears | ⚠️ misread | Confirmations **persist** across mode switch (verified); "N peer-corroborated" is a data property, not progress | none (non-bug) |
| 3 | Engineering codes @100% outrank art codes | ✅ real | The "outside crosswalk" (`beyond`) list gates on raw `rel≥85`; generic-token matches (principle/design/system) surface wrong-family codes | **Family guardrail** (`beyondOk`): a beyond candidate is credible only if its 2-digit CIP family matches the course field OR the peer consensus — the two-signals-agree gate (§7) applied to the lexical signal |
| 4 | "most use"/"PEER CONSENSUS" on a plurality | ✅ real | Wording unconditional; badge gates on `modal.n≥3` — neither requires a true majority | Require **strict majority** (`modal.n*2 > cons.n`) for "most use" + the "peer consensus" label; a tie/plurality reads "the most common is … no majority" / "most common · N of M" (display only — the pre-fill gate is untouched, so baseline counts don't move) |
| 5 | Review & Find disagree; Review picks the weak code | ✅ real | Review's box shows the crosswalk default; the strong description match (Ceramics I → 50.0711 Ceramic Arts @100%) is buried in the drawer | **Surface the strong credible match as the headline** (Sam's call): a bare-review row with a strong same-family `beyondOk[0]` (rel≥85) becomes `sug` with `sugKind:"description"`, still **? Review**; shielded from the dept-default swap; honest why-line |
| 6 | Stale `cipx_college`; no reload restore | ⚠️ mostly by-design | College is intentionally ephemeral; `cipx_college` is dead cruft from an old build | `localStorage.removeItem("cipx_college")` on activate (cleanup only) |

**The linchpin insight (Chrome's, and it's right):** Finding 1 is what turns the ranking/wording problems
(#3, #4, #5) into *silently recorded wrong answers* — one stray box-click validates a weak default. Fixing the
box interaction is the highest-value change; the ranking fixes make the thing it would have recorded correct.

**Method notes worth keeping:** the family guardrail is the §7 doctrine ("TOP/description alone never gates —
needs a second signal") applied to the CIP fit engine, not just the M-ID schema. And two of six agent findings
being mechanism-wrong is the argument for *always* reproducing headless on the same college/department before
touching code — the fix's numbers (50.0711 @100%, 3-of-6 tie) are then the real rendered values, not guesses.
Tests **213 → 220** (F1 box-behavior both ways, F3 family filter, F4 majority wording, F5 headline surface).
Side-lane discipline honored: `kb/cpl_todos.json` + the numbered session handoff untouched.

### 2026-07-19 (SkyCoco) — the confidence-scoring rework (Chaffey BIOL live-test)

Sam live-tested Chaffey BIOL and the confidence numbers were the story. Root cause + the fixes (all in
`computeRecommend`, diagnosed with a `vm`-context kb diagnostic on BIOL 2/3/10/42L/63/98C before touching code):

- **The scale mismatch.** Crosswalk candidates showed a *crosswalk-relative* `conf`; outside-crosswalk
  matches showed *global-relative* `rel` — and the outside match is always the global top, so it read
  **100%** while the official codes read 14–29%. Two different rulers side by side.
- **Title-match signal (Sam's key insight — "why wouldn't the CIP with the same title as the course get
  high confidence?").** CIP-title tokens already weigh 3× a definition word, but a long course description
  out-*volumes* a title match (Climate Science beat the identically-titled Environmental Science for BIOL 2).
  Fix: a dedicated **course-title ↔ CIP-title** signal (`titleHit`, IDF-weighted; `TITLE_BOOST` folds it into
  the ranking score) so the same-title code wins its TOP. A **generic-academic-qualifier stoplist**
  (Introduction/Concepts/Research Methods/California/…) strips filler so a verbose title
  ("Research Methods in Evolutionary Ecology") matches on its SUBSTANTIVE terms the same way a terse sibling
  ("Evolutionary Ecology") does — fixing the 42L-vs-63 inconsistency at the source.
- **De-inflated ABSOLUTE confidence** (Sam: "nothing should auto-read 100%", then "obvious pick ≥ 80%").
  `confOf = min(0.95, 0.80·titleSim + 0.60·coverage)` — a full title match alone = **80%**, capped at 95 so
  nothing reads a false-certain 100. `tierOf` recalibrated to the new scale (≥75 Strong / ≥45 Plausible).
- **Crosswalk stays primary (F5 reverted).** Sam's earlier "surface the strong outside match as the headline"
  (F5, #849) over-fired on BIOL 10 (Ecology stole the headline from the obvious 26.0101 Biology). Per his call,
  the outside match is now a **"worth a look" hint only** (`beyondOk`), never the headline — the box is always
  a crosswalk/consensus code. A **beat-the-crosswalk gate** (an outside code shows only if its confidence
  exceeds the best crosswalk code's) kills the generic-title flood (for "Independent Study: Biology" every
  "X Biology" code ties 26.0101, so none surfaces).
- **Kept the Ready/Review classification RELATIVE** so the de-inflated *display* confidence didn't collapse the
  baseline: tying the "Ready" gate to the new absolute conf swung Chaffey Ready 594→**314** (a 47% drop). The
  fix — gate Ready on a crosswalk-*relative* clarity (a clear winner with a decent match), as before — held the
  swing to a moderate, defensible ~15% (Chaffey 594→508; the title-boost only re-orders the winner, so a course
  whose boosted winner isn't the plain-score winner is genuinely ambiguous → "review"). **`cip_status_counts.json`
  regenerated** (statewide Ready down / Review up ~one notch — flagged to Sam as a real baseline shift).

**Method that keeps paying:** the `vm`-context diagnostic dumping cands (conf/boosted/score) + beyond for a
handful of the curator's own courses is the tightest calibration loop — every constant (`TITLE_BOOST`,
`CONF_TITLE_W`, the cap, the beat-crosswalk gate) was tuned against the real rendered rankings on BIOL 2/3/10/
42L/63/98C, not guessed. Also: **a browser agent's screenshot can be stale** — BIOL 98C's "ESL @100%" was
already fixed by #849 (family guardrail); confirmed by reproducing on the current engine before "fixing" a
non-bug. UI batch (relocate baseline line, Subject rename, centered tiles, consolidated text, a compact sticky
header) is queued to **prototype-then-port**; the college glyph delete rode along in this PR. Side-lane
discipline honored: `kb/cpl_todos.json` + the numbered session handoff untouched.

### 2026-07-20 (SkyCoco) — the Review-tab UI redesign: prototype → port (#TBD)

Sam co-designed the whole Review-tab look in a **fast-feedback Claude artifact** (the
`prototype-then-port` practice) across ~8 tight iterations, locked it ("obsessed with this new
version"), then said "get this into prod." Ported into `cip_crosswalk.js`; verified with the jsdom
suite (226 CIP assertions, 166 files) + a real-Chromium pass on Chaffey BIOL (light/dark/phone,
0 overflow, 0 console errors). What shipped:

- **Sticky College + Subject + count-tiles bar.** The shared `.cipx-collegebar` pins `top:0`; the
  tiles ride in their OWN host (`.cipx-rev-tileshost`, sibling of the list — NOT the short summary
  host, so a sticky element's parent is tall enough to keep it stuck through the whole list) and pin
  flush beneath it at `top:var(--cipx-cbh)`. `--cipx-cbh` = the college bar's **measured** height,
  published on `wrapEl` by `syncStickyOffsets()` (rAF after `rebuildShell` + on resize; jsdom's
  layout-less height 0 is guarded → CSS fallback). Verified: desktop tiles pin at 56 = college-bar
  height. Lets a curriculum specialist zip through **subjects** — and a CO reviewer through
  **colleges** — without scrolling up (Sam's exact ask). The dashboard is body-scroll with a
  **non-sticky masthead**, so `position:sticky;top:0` pins cleanly to the viewport (confirmed by
  reading `index.html`: `.cpl-layout` grid, `.cpl-main` no overflow, only `.filter-bar`/sidebar are
  sticky and neither is on this tab).
- **White row gutters + a subtle list field.** The prototype's white gutter popped because its rows
  sat on a bluish field; prod rows sit on cream (`--paper #F4F2ED`) where white would wash out — so
  the list got a faint cool-gray field (`--cipx-rev-field`) and the item separator became
  `2px var(--cipx-row-sep)` (**white** light / **slate** dark). Reproduces the prototype look:
  each brown "why" note now clearly brackets with the course **above** it.
- **Expanded course = one "package."** `paint()` toggles `.cipx-rev-item-open` → accent spine
  (`inset 3px` shadow) + framed top edge + tint bind the row to its detail, walling it off from
  neighbors.
- **"COCI Sync'd" destination tile** — a non-functional preview (dashed, muted, count 0, an "In
  Development" badge, non-clickable DIV) appended to both the per-subject tiles and the college
  overview, so the tiles read as the full pipeline **All → Review → Ready → COCI Sync'd**. Signals
  the coming Tech-Center sync without overpromising.
- **Header + copy.** Title **"CIP Coder"** + a `.cipx-beta` badge; eyebrow gains **Academic Affairs**;
  intro trimmed to *"A simplified process supporting the Fall 2026 TOP → CIP transition… soon, sync
  your settled codes straight to COCI."* (Sam picked "transition" over "switch".)
- **Smaller locks:** mode-tab **glyphs deleted** (labels only; `MODE_ICON` removed, `svgIcon` kept
  for the peer-consensus/work-experience leads), **Department → Subject** rename (picker label +
  nudges + "★ All subjects"; peer-consensus prose about *colleges'* departments left intact —
  different meaning), **tile contents centered**, **Subject dropdown widened**, **Manual tile hidden
  when 0** (both tile rows).

**Held back for a follow-up (flagged to Sam):** the prototype's **confidence % inside the box**.
The real box (`cipBox`) has more states than the prototype's (two-box "Suggested" layout, multi-CIP
stacks) and deliberately keeps confidence in the expanded candidate meters; jamming a % into every
box risks clutter + fights the "clean one-liner" Ready row. Easy to add as a scoped follow-up if Sam
wants it. Prototype artifact: `https://claude.ai/code/artifact/4369b106-abe8-4149-abf6-571d325bf508`.

**Method note that keeps paying:** before committing to the sticky design, I read the *dashboard's*
scroll model (not just the tab) — the sticky-parent gotcha (a sticky element unsticks when its
short parent scrolls past) is exactly why the tiles needed their own list-sibling host, not the
summary host. Side-lane discipline honored: `kb/cpl_todos.json` + the numbered session handoff
untouched.

### 2026-07-20 (SkyCIP) — checkpoint addendum: the deploy-outage fix + the sticky-parent method

Sam christened the session **SkyCIP** on the ship. Two learnings from getting #851 actually
live (the merge is not the finish line — the deploy is):

- **The sticky-parent gotcha (the crux of the sticky bar).** A CSS `position:sticky` element
  only stays stuck while its **parent box** is in view — it un-sticks the instant the parent's
  bottom scrolls past the stuck position. The first instinct was to put the tiles in the
  existing `revSummaryHost`, but that host is short (just tiles + progline + reassure), so the
  tiles would have un-stuck almost immediately. Fix: give the sticky tiles their **own host**
  (`.cipx-rev-tileshost`) that is a **sibling of the list** under the tall review view, so its
  parent spans the whole list and it stays pinned through it. The college bar was already fine
  (its parent is `wrapEl`, the whole tab). Read the *dashboard's* scroll model too — body-scroll
  with a non-sticky masthead → `sticky;top:0` pins to the viewport; had it been an overflow
  container the offsets would differ.
- **GitHub Pages deploy outage → dispatch fresh, never rerun the job.** A post-merge Pages **503**
  (deploy-step only; assembly + served-path assert passed) left the site stale — the merge was on
  `main` but Pages never published. `rerun_failed_jobs` made it WORSE (re-ran the upload step →
  two `github-pages` artifacts → `deploy-pages` "Multiple artifacts" error). Fix: a fresh
  `workflow_dispatch` of `pages.yml` on `main` (own run, single artifact) → green. New playbook
  `docs/kb-notes/playbook-github-pages-manual-redeploy.md` + a CLAUDE.md Troubleshooting entry.
  Lesson: a green merge with a stale site means look at the **deploy workflow**, not the code.

Side-lane discipline honored throughout: `kb/cpl_todos.json` + the numbered session handoff left
untouched (CCR mainline owns them); CIP-lane memory is this doc + `docs/cip_crosswalk_handoff.md`.

### 2026-07-20 (SkyCIP) — the CfC live-test laundry list → the strong-own-fit veto (F1–F5)

Claude for Chrome ran a fresh autonomous pass over CIP Coder (Beta) and returned a ranked
laundry list; its dominant theme (5 of the High findings, F1–F5) was **one root cause**, confirmed
in the code before any fix: a confident **peer consensus** (`consensusPick` → `bestCipForTop`)
overrides the headline **with no check on whether the course's own description/title fits a
different code far better**. CCSF "Intermediate Voice" → peers' *Musical Theatre* (13%) over own-fit
*Voice and Opera* (95%); ARC "Drawing and Composition" → peers' *Fine/Studio Arts* (0%) over
*Drawing* (41%); ARC A&P → peers' *Cell Biology* (7%). Sam's call (AskUserQuestion): **strong own-fit
wins, margin-gated.**

**Fix** (`reviewRowOf`, nested INSIDE the override branch so a discarded cross-discipline pool is
unaffected): when a consensus would override, compute the strongest surfaced own-fit
(`ownBest` = max `.conf` across `m.cands ∪ m.beyond`) and the peer pick's own fit (`peerConf`); if
`ownBest.conf ≥ OWN_FIT_MIN (40)` AND it's a different code AND it beats the peer pick by
`≥ OWN_VETO_MARGIN (30)`, keep the own-fit as the headline, flag **Review** (not a peer-Suggested
change), set `ownFitVeto`/`peerAlt`, and keep `cp` so the expand still notes how peers code it — the
peer consensus is **demoted to a note, not deciding**. `sugConf` now spans cands+beyond so the
description-headline isn't dept-default-swapped away. New `reviewWhy` branch names BOTH codes.

**Calibration crux:** the de-inflated confidence makes even a correct own-fit read moderate (Drawing
= 41%), so "strong in absolute terms (≥75)" was too strict — the real signal is **own-fit clearly
beats a near-zero peer pick**. So the **margin** does the work; the floor (40) just requires the
own-fit to be plausible. Verified on real data via a `vm`-context diagnostic (the tightest loop): the
veto is **surgical** — 3/44 ART, 1/78 MUS, 1/28 BIOL vetoed, and **0** NURS / **0** AUTO (the
confirmed-working peer corrections, where the peer pick IS a decent fit, are untouched). Tests
226→**229** (a Voice→Musical Theatre fixture guards the exact F1 failure mode); real-Chromium on
CCSF MUS 10C (Review, box 50.0908, honest whyline, 0 overflow/0 errors).

**Still on the CfC list (next PR):** F6 Browse "closest matches" duplicate rows, F7 Finder
"no clear front-runner" copy when one's ≥95%, F9 glyph legend + peer-corroborated ✓· aria, F10 Manual
rows showing a code, F8 tiny ▾ hit-target. F12 (two-box display) is by design. Side-lane discipline
held: `cpl_todos.json` + the numbered handoff untouched.

### 2026-07-20 (SkyCIP) — CfC list, batch 2: the clear fixes (F6–F10)

The rest of the Claude-for-Chrome list — no doctrine calls, verified before fixing:

- **F6 Browse "Closest matches" duplicated rows** (header "13 codes" rendered 19). Root cause: the
  plain-English finder (`renderFinder` → `suggestHost`) fired for ANY text, so a single keyword's
  top-6 showed above AND inside the full code list. Fix: gate the finder to **multi-word phrases**
  (a single keyword is a browse/filter the code list already serves). Real-Chromium: "biology" → 0
  finder cards, count "124 CIP codes" == 124 rows; a phrase still shows the finder.
- **F10 Manual rows claimed "no code" while showing one.** A thin-description course still rides its
  TOP's crosswalk code as a starting point (`sug = crosswalk`), but the why-line said "Too little
  … to suggest a code." Fix: branch the manual why-line on `r.sug` — name the crosswalk code as a
  starting point when there is one; keep the "nothing to show" copy only when there's no crosswalk.
- **F7 Finder "no single clear front-runner" fired even at 95% STRONG FIT.** The `m.recommended`
  gate is RELATIVE (margin/relConf), so a strong-but-close top candidate wasn't "recommended" → the
  lead read "no front-runner" while the card read STRONG. Fix: a middle branch — when `cands[0].conf
  ≥ 75`, name it as the best fit "though it's a close call," instead of denying a front-runner.
- **F9 peer-corroborated ✓· was invisible to screen readers** (aria was a generic "Ready status").
  Fix: append ", peer-corroborated" to the aria-label when the dot shows. (The ✓/⇄/?/◻ glyphs are
  already labeled by the count tiles, so no separate visible legend was needed.)
- **F8 tiny ▾ change hit-target** → aiming for it hit the box body (= confirm). Fix: enlarge the
  `.cipx-rev-chipchg` hit-area (padding + stretch + negative margin) so it's a comfortable target.

**F12** (the two-box "peers vs your TOP" display) is BY DESIGN — no change. Tests 229→**233** (source
+ data guards for F6/F7/F9/F10; the veto fixture from batch 1 stays). Side-lane discipline held:
`cpl_todos.json` + the numbered handoff untouched. **CfC list now fully triaged** — F1–F5 (batch 1,
the veto) + F6–F10 (this batch) shipped; F11 (mobile sticky height) is the one measure-and-trim
follow-up left.

### 2026-07-20 (SkyCIP) — mobile polish: Expand into the sticky row + tiles on one line (Sam, live phone test)

Sam hammered CIP Coder on his phone (Allan Hancock · AG), reported the suggestions "clean baby" and
the UI great, and asked for two mobile real-estate tweaks (the F11 lane):

- **Expand moved into the sticky tiles row.** It lived in the top-right utility rail (which scrolls
  away on phones), so Expand/Collapse-all wasn't reachable mid-scroll. Now built into
  `.cipx-rev-actions` inside the sticky `revTilesHost` (next to Confirm-all); only **CSV** stays in the
  rail. Reachable while scrolling on every viewport.
- **All four count tiles on one row (phone).** The COCI Sync'd tile wrapped to a 2nd row (its "In
  Development" badge made it taller + wider). Mobile CSS now: `.cipx-rev-tiles{flex-wrap:nowrap;flex:1
  1 100%}` + `.cipx-rev-tile{flex:1 1 0;min-width:0}` (four equal tiles fill the row), smaller tile
  fonts, and `.cipx-rev-tilesoon{display:none}` on phones so COCI Sync'd is the same 2-line height as
  the others (the dashed border still signals "not live"). Verified at 390px: 1 tile row, badge hidden,
  Expand in the sticky row, 0 overflow / 0 errors.

**Real-estate note (F11 lever still open):** the pinned sticky stack on a 390×820 phone is ~**287px**
(college bar ~134 + tiles host ~153) ≈ 35% of the screen. The tiles change trimmed a row; the biggest
remaining lever is the **college bar** (its "Your college"/"Subject" labels stack above full-width
dropdowns → ~4 lines). Trimming/inlining those labels on mobile is the next real-estate save if Sam
wants it — flagged, not done unprompted (it's the shared bar across all modes). CfC list: F1–F10
shipped; F11 partially addressed here.

### 2026-07-20 (SkyCIP) — the ▾-OKs-the-CIP bug (recurring) + Expand/Confirm one row + shorter label

Live phone testing (Riverside · AUT), same session:

- **The recurring "clicking the dropdown OKs the CIP" bug — root-caused and killed.** The change
  panel (`openP`) is appended as a **child of the chip**, and the chip's `onclick` = `onAccept`. So
  after ▾ opened the panel, clicking into its search field to type a keyword **bubbled up to the chip
  and confirmed the code**. Fix in `cipBox`: the chip's onclick now `stopPropagation()`s (still no row
  toggle) **and returns early when the click's target is inside `.cipx-rev-chipchg`, `.cipx-rev-chiprm`,
  or `.cipx-rev-chgpanel`** — those affordances own their clicks; the chip body alone means "use this
  code." Belt + suspenders with their existing stopPropagation. Also **de-risked the F8 ▾ hit-target**:
  dropped the negative margins (they let the ▾ overflow the chip so a click could resolve to the body →
  accept); now `align-self:stretch` + padding gives a big target within bounds. Real-Chromium on
  Riverside AUT 5: ▾ opens the panel, click+type "account" → panel stays open, **nothing confirmed**
  (both stores empty). Committed jsdom guard: clicking inside the open panel persists no decision.
- **Expand + Confirm on one row (mobile)** — `.cipx-rev-actions` on phones is now a `flex-wrap:nowrap`
  row (Expand `flex:0 0 auto`, the bulk button flexes) so they sit side by side instead of stacking.
- **Shorter Confirm label** (Sam): "✓ Confirm all 11 ready matches in AG" → **"✓ Confirm all 11 AG
  matches"** (drops "ready"/"in", folds the subject in) — reads cleaner and helps the one-row fit.

Tests → **234**. Lesson worth keeping: **a popover that's a DOM child of a clickable element inherits
that element's click handler** — either stop propagation on the popover or gate the parent handler by
target (done here); this bug recurs because the panel-in-chip structure invites it.

### 2026-07-20 (SkyCIP) — change-panel closes on click-away + the export feature is QUEUED (scope pending)

Two items late in the session:

- **The ▾ change-panel now closes on click-away / lost focus** (Sam: the open search box "shouldn't hog
  the screen when not needed"). In `cipBox.openP`, a capture-phase `mousedown` + `focusin` listener on
  `document` dismisses the panel when the pointer/focus lands OUTSIDE the chip; interactions inside
  (typing, picking) keep it open; `closeP` tears the listeners down. The search field is also focused on
  open so you can type immediately. Guarded by a jsdom test (open → outside mousedown → closed). Tests → **235**.

- **REQUESTED, NOT BUILT — bulk CSV export ("Select All" + CSV-on-open).** Sam wants: an **"All colleges"**
  option on the college dropdown (Subject already has "★ All subjects"), the **CSV button visible when the
  tab opens**, and the ability to **export a big dataset**. I flagged the architectural fork and Sam
  **dismissed the question** (deferred, not decided): the crux is that **all colleges × all subjects ≈
  131,715 courses**, whose suggested CIP is computed LIVE in-browser (+ ~50MB of per-college fitcheck to
  download) — computing that many rows live would freeze/crash the tab (esp. mobile). The three options I
  put to him (pick one next time):
  1. **Live, up to one college** — CSV exports the current selection live; a single college's full catalog
     (~2,500 courses) is the practical max; "All colleges" prompts to narrow. Ships fast, no pipeline.
  2. **Precomputed statewide file (recommended for "everything")** — a server-side build (like
     `kb/build_cip_status_counts.js` / the daily baseline counts) emits the complete all-colleges dataset;
     the button offers "Download full statewide (~131,715)" as an instant file. Needs a workflow + daily refresh.
  3. **Live, all colleges too** — compute live for any subject scope with a progress bar + warning; cap
     all×all (risky on mobile).
  **Unambiguous parts I can ship regardless of his pick:** make the CSV button always visible on tab open,
  and add the "All colleges" dropdown option. The scope/architecture (live vs precomputed) is the open call.

### 2026-07-20 (SkyQB) — the discipline-fit confidence lift (carpentry read 8% → ~60%) (#860)

Sam's steer: a screenshot of American River College's **CARPT** catalog — every course on
`TOP 0952.10 → 46.0201 Carpentry/Carpenter` reading **7–9% confidence**. *"I would expect carpentry
courses and carpentry CIPs to have higher than 8% … cure it without hurting our other considerations."*

**Root cause (found with the `vm`-context kb diagnostic on the real ARC CARPT rows — the tightest loop):**
the displayed confidence (`confOf`) only measures how well a **single course's own title + description**
overlaps the CIP's *definition*. Carpentry is a coherent vocational program whose courses are *specialized
slices* — "Rigging", "Welding II", "Structural Framing", "CAD Basics for Mill Cabinetry" — and none of them
individually overlap the *generic* "Carpentry/Carpenter" definition, so each reads a misleading single
digit. Yet `rel` was **95–100%** (it *is* the crosswalk winner) and the whole discipline maps 1:1 to the
CIP. The score was answering *"do this course's exact words appear in the CIP definition?"* when the
faculty's real question is *"how sure are we 46.0201 is right for this course?"* — and the discipline
clearly maps there.

**The cure — a discipline-fit lift on the DISPLAYED confidence (`dconf`).** In `computeRecommend`, per
crosswalk candidate, `fieldSim(r)` = the IDF-weighted overlap of the course's **TOP title** with the
**CIP's title** (`topTtToks`, generic-stripped like the course-title match; constant across the TOP →
lifts every course in a clean-mapping discipline uniformly). Then
`dconfOf(o) = round(100·min(0.95, raw + DISC_W·fieldSim·(1−raw)))` with `DISC_W = 0.60` — a big lift when
the course's own wording is thin but its discipline maps cleanly, a small lift when raw is already high,
capped below a false-certain 100%. Stored as `rec.dconf`; the two DISPLAY sites (`recCandCard` in
recommend mode, the review-expand `candRow`) read `dconf ?? conf ?? rel`.

**Numbers (real ARC data):** CARPT 8% → **60–73%** (Plausible amber, *not* a false green "Strong" — honest
to the de-inflation doctrine); ACCT 44→78, MATH 7→63, WELD-clean 46→78. **Self-limiting:** disciplines
whose TOP title doesn't match a CIP title get **no lift** — ART `1012.00` (14→14), ENGWR (63→63). The lift
is exactly proportional to how cleanly the field maps.

**Why it doesn't hurt the other considerations (the crux of Sam's ask):**
- **DISPLAY-ONLY.** Every *gate* keeps the raw description-fit `conf`: the Ready/Review split
  (`recommended`, relative-score gated), the strong-own-fit veto (`ownBest`/`peerConf`, verified still
  firing on ART 300 / ADMJ 300), the outside-crosswalk mis-code ⚑ flag (`bestCandConf`/`beyond`, raw), and
  `sugConf`. **Status is provably unchanged** → the precomputed `cip_status_counts.json` baseline does NOT
  move (it reads `r.status`, not conf) → no regeneration needed. Beyond (outside-crosswalk) cands are never
  lifted, which *reinforces* the crosswalk-primary contrast (the in-field CIP reads 60%, an outside lexical
  match reads its honest low %).
- **§7-clean.** The TOP↔CIP crosswalk is the one place TOP is authoritative by repo doctrine; `fieldSim`
  reads only that pairing's *own* quality (TOP-title ↔ CIP-title). It never infers discipline from TOP for
  any gate — the two-signals-agree posture, applied to the display.

**Seams / constants:** `DISC_W` (top of the file, next to `OWN_FIT_MIN`/`OWN_VETO_MARGIN`); `fieldSim` +
`dconfOf` + `topTtToks` inside `computeRecommend`; `rec.dconf` on each crosswalk cand. Tests **235 → 243**
(+8 guarding: cands carry `dconf`; a title-matching CIP is lifted while a non-matching one isn't; `dconf`
never exceeds 95 nor drops below raw `conf`; the lift doesn't fabricate a `recommended`). Full suite 166
green; real-Chromium ARC/CARPT verified (desktop light+dark 0 overflow / 0 JS errors; the phone's 50px
overflow is a pre-existing `cipx-rev-ctitle` issue, unrelated).

**Method note that paid off:** the `vm` diagnostic dumping `conf`/`rel`/`coverage`/`matched` per candidate
for the curator's *own* courses (here ARC CARPT) is the same tight calibration loop SkyCoco/SkyCIP used —
before/after numbers are the real rendered values on Sam's data, so "8% → 60%" is concrete, not "should be
fixed." And the display-vs-gate separation is the reusable pattern: when a number reads wrong but the
classification is right, lift the DISPLAY and leave every gate on the raw signal.

### 2026-07-20/21 (SkyQB) — the "Keep <crosswalk>" button (#868), then the sole-crosswalk cascade fix (#869)

Two rounds with Sam live-testing the Review tab.

**#868 — the matched "Keep" button (Suggested rows).** A ⇄ Suggested row shows two boxes (the course's own
TOP-crosswalk pick + the peer-suggested code) but the only explicit button was "✓ Confirm <peer>" — keeping
the crosswalk meant hunting for its Select in the list (Sam: "not sure how to keep 13.1210"). Added a matched
**Keep <crosswalk>** beside Confirm: peer pick stays the filled primary, Keep is the secondary outline, both
one click, both validate (✓). Only on the two-box case (`r.suggestChange && crosswalk ≠ sug`). Placement =
Sam's pedagogy call: **at the bottom, after the full signal list**, so the curator scans the options before
deciding (buttons at the top invite a snap decision). Guard: `.cipx-rev-keep` (var-token outline, both themes).

**#869 — Sam's BUSL 10 catch → the sole-crosswalk cascade fix.** Chaffey BUSL 10 "Introduction to Law"
defaulted its box to **22.0302 Legal Assistant/Paralegal** (not even in its crosswalk!) while **Legal Studies
22.0000** — the sole, direct crosswalk code for TOP 1401.00 "Law" — read a misleading **28%**. Sam's worry
was the real insight: *"are we in a recursive loop where our rules subvert each other… chasing our tail by
adding considerations that work for some and not others?"*

**The diagnostic that unlocked it — a visual decision-trace** ([artifact](https://claude.ai/code/artifact/dc65cc80-54e0-4790-a2e4-ed99c5a5b77a),
built by tracing the LIVE engine `_recommend`/`_reviewRowOf` over BUSL 10 + a working carpentry control + a
suggest control). It showed it was **NOT a loop but a CASCADE** — the rules run once, in a fixed order, and
one miscalibration at the top knocked over two dominoes:
1. **Confidence (root)** — the #860 discipline-fit lift keys on TOP-title↔CIP-title *stem* overlap. "Law"
   (TOP title) and "Legal" (CIP title) are the same field but stem differently → fieldSim 0 → the direct
   crosswalk pick read 28%.
2. **Dept-default (`effectiveSug`)** — a "weak Review pick" (conf 28 < 70, few siblings) → the box swapped to
   the dept's most-used code 22.0302. Meant for grab-bag TOPs (Ironworker "Rigging" → Robotics); wrong for a
   clean 1:1 mapping.
3. **Confirm ≠ box** — the Confirm button still targeted the raw sug (22.0000) while the box showed 22.0302.

**The fix — fix the ROOT, not add a counter-rule (the anti-tail-chasing discipline).** The trap Sam named
would be to add a downstream rule ("don't dept-default law courses"). Instead:
- **Fix A** — `fieldSim` credits a **sole credit crosswalk mapping** as a full discipline-fit (dconf → 1.0
  contribution): when a TOP maps to exactly ONE credit CIP, that CIP *is* the field's code by the approved
  crosswalk's own definition — the one place TOP is §7-authoritative. BUSL 10 → **71%**. `soleCreditCode` +
  `fieldSim`/`dconfOf` in `computeRecommend`. Display-only.
- **Fix B** — `effectiveSug` skips the dept-default for a **direct pick** (`directPick` = sole crosswalk +
  `sugKind==="crosswalk"`, OR `sugKind==="description"` — the veto/F5 headline). Grab-bag TOPs still default.
- **Fix C** — the Confirm button commits `effCode = effectiveSug(r,ctx).code` (what the box shows), never a
  different code. `reviewExpand` now takes `ctx`; exported `_effectiveSug`.
- **UI (Sam)** — action bar split: `.cipx-rev-actutils` (Add/Clear) left, `.cipx-rev-actdecide` (Keep +
  Confirm, **Confirm rightmost**, `margin-left:auto`) right — under the Select column. Sam: "on the right side
  with all the other confirms."
- The ⚑ outside-crosswalk mis-code flag is **untouched** — alternates stay a glance away (Sam: "TOPs are
  unreliable but the options are there if needed").

**Empirical soundness proof (Sam's call: skip a Fable design pass, let the regression sweep prove it).** A
**before/after diff vs the pre-fix engine** (`git show origin/main:cip_crosswalk.js`) over real college data:
- **status_changed = 0** (6 colleges / 2,136 courses) — provably display-only; no Ready/Review/Suggested/
  Manual moved → `cip_status_counts.json` unaffected, **no regen**.
- **0 UNEXPECTED box changes** (4 colleges) — every box change is a sole-crosswalk or description exemption.
- **0 mis-code ⚑ flags changed**; 307 dconf lifts; 325 confirm→box alignments.
- Tests 235 → **254** (+19 across #868/#869); full suite 166 files green; real-Chromium Chaffey BUSL 10
  (box 22.0000 · 71% · Confirm 22.0000 · right-aligned · 0 overflow / 0 JS errors).

**Two durable methods worth carrying:**
- **When a number reads wrong but the classification is right, lift the DISPLAY and leave every gate on the
  raw signal** (the display-vs-gate separation — #860's dconf, extended here). Provably can't move baseline
  counts, the veto, or the mis-code flag.
- **Fix the root, not a counter-rule.** When rules seem to fight, a visual decision-trace over the live engine
  reveals whether it's a *loop* (add a rule = tail-chasing) or a *cascade* (fix the top domino, the rest stop).
  A deterministic before/after sweep across real data — status/box/confirm/flag diffed — is the soundness proof.

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
