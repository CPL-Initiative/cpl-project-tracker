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
