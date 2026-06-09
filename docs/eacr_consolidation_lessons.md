---
title: EACR Consolidation + Master-Detail Gallery — Lessons
date: 2026-06-01
session: 27
tags: [eacr, exhibit-adoption, consolidation, master-detail, gallery, credit-recs, lessons]
artifacts:
  - statewide_interactive.js (consumer: buildCreditRecsHtml, buildCredentialView, sort)
  - excel_to_dashboard.py (_build_statewide_adoption, _parse_exhibits — Local+CCC merge)
  - fetch_custom_report.py (_build_headers — MAP auth pre-stage)
  - docs/kb-notes/eacr-consolidation-scope.md (the scope + 4-phase ladder + backlog)
  - docs/map_api_auth_handoff.md (MAP auth coordination)
related:
  - "[[docs/exhibit_canonicalization_lessons.md]]" (the Session-8 EACR re-pivot that preceded this)
  - "[[docs/kb-notes/methodology-versioned-prototype-gallery.md]]"
  - "[[docs/kb-notes/playbook-prestage-optional-external-auth.md]]"
---

# EACR Consolidation + Master-Detail Gallery — Lessons

Workstream scratchpad for the EACR (Exhibit Adoption & Credit Recommendations)
refinement that started from Sam's live screenshot review (Session 27). The
durable, distilled patterns are split out into KB notes (see `related`); this is
the workstream narrative + state.

## Session 27 (2026-06-01) — first checkpoint

### What shipped (all merged to `main`)
| PR | What | Side |
|---|---|---|
| #244 | **Credit-rec consolidation** — group recs by `(course title, units)`, local codes inline, **"💡 Typical CPL: ~N units (range a–b) · not the sum"** headline. + fixed the "undefined (N)" Issuing-Agency filter label. | consumer |
| #245 | **Sort** — cluster a credential's variants together (CompTIA A+ was scattered) + **sink 105 unclassified (4%) to the bottom**. | consumer |
| #246 | **Merge Local + CCC into one card** (CCC top billing) — drop `Collaborative Type` from the EACR key; `_parse_exhibits()` KPI moves in **lockstep**. 2,456→2,406 cards; CompTIA A+ 4→2; merged card unions to 21 adopters. | generator |
| #248 | **MAP-auth pre-stage + spec sheet** — optional `MAP_API_KEY` header (no-op until set) ahead of MAP's user-auth rollout. | infra |
| #249 | **Master-detail "Credential view" (v2)** — gallery: v1 table preserved, v2 = one card per credential, CCC/synth standard on top, variants sub-listed. 2,406→2,114 credential cards. | consumer |

### What's been learned
- **Consumer-side wins for testability + speed.** The raw CustomReport isn't in
  the session container (can't regenerate `statewide_data.js`), so display logic
  (consolidation, sort, master-detail) went **consumer-side** in
  `statewide_interactive.js` → testable via `node` logic harness against the
  committed data + **live the instant the PR merges** (no regen). Only the
  identity-grain change (Local+CCC merge, PR-2) HAD to be producer-side, because it
  also moves the headline KPI — and that one waits for the daily regen.
- **When you change a grouping key in the producer, move the KPI counter on the
  SAME key in lockstep.** PR-2 dropped `Collaborative Type` from BOTH
  `_build_statewide_adoption()` (the cards) and `_parse_exhibits()` (the "MAP
  Exhibits" KPI). Verified with a synthetic unit test that asserts
  `KPI.unique_exhibits == len(cards)`. Skip the lockstep and the headline number
  silently disagrees with the table.
- **Synthetic unit test rescues a regen-untestable producer change.** PR-2 couldn't
  be regen-tested in-session, so I `import excel_to_dashboard` and called
  `_build_statewide_adoption` + `_parse_exhibits` on a handful of constructed rows,
  asserting the merge + the lockstep. (Needed `pip install openpyxl pandas` for the
  import.) Confirmed correct on the real data only after Sam's regen (2,456→2,406).
- **The versioned gallery is the right delivery vehicle for a divergent view.** v2
  (master-detail) is a different paradigm from v1 (flat table); building it
  **additively** (v1 untouched, v2 behind a collapsed `<details>`) made it
  zero-risk to merge on green and let Sam compare side-by-side. See the methodology
  note.
- **Sam's design instincts re-derived the scope live.** His "sub-list Local under
  CCC" + "synthesize a flagged standard for no-CCC" were exactly PR-3 + the
  synthesized-standard we'd scoped — validation that the scope doc was right.
- **Decisions evolve mid-run; record the evolution.** Locked decision #1 ("keep CPL
  Type separate") was revised when Sam saw CompTIA Linux+ split by CPL Type — he
  wants CPL Type as a *tag*, not a card-splitter. The v2 master-detail delivers that
  visually; the full producer-side `cpl_type`-drop is the captured "full credential
  merge" backlog item. Flagged the revision on decision #1 in the scope doc.

### Current state
- v1 (table) + v2 (master-detail Credential view) both live in the gallery, sharing
  search + filters. PR-2's Local+CCC merge is live (post-regen). MAP-auth pre-stage
  merged + inert (waiting on MAP's credential). Spec sheet sent to MAP.

### Strategic roadmap
- **Next: PR-4 — the prescriptive layer (SCOPED, producer-side).** A background
  agent confirmed the data path at checkpoint time:
  - The EACR card carries `potential_names` as **plain college-name strings only**
    — no `course_id`, no per-college course. The prescriptive data lives in
    `kb/coci_articulations.json` (`adoption_leverage` = leverage college NAMES,
    47,994 total) + `kb/coci_minted_memberships.json` (`{college, subject,
    course_number, units, …}` per `course_id`). They **join on `course_id`**:
    leverage-college ⨝ memberships → that college's local `(subject, number, units)`.
  - **M-ID leverage (17,575 slots) resolves 100%** from committed JSON (verified on
    `CNST M1029` → Palomar `AP DL 728`, Rio Hondo `CARP 050T`). **C-ID leverage
    (~30.4k, ~63%) is deferred** — those per-college courses are keyed by
    `CIDNumber` in the 24 MB raw `coci_course_list.xlsx`, a heavier add.
  - **Verdict: PRODUCER-side.** The consumer can't bridge it (`statewide_data.js`
    has no `course_id`, and one `unified_title` fans to ≤89 `course_id`s). Build a
    new lazy file `statewide_prescriptive.js` (`window.CPL_STATEWIDE_PRESCRIPTIVE`,
    keyed by `unified_title`) in `_build_statewide_adoption()`; render a collapsible
    "Colleges that could adopt → likely matching local course" block per v2 card.
  - **Guardrails:** honor **over_merge** (skip prescriptive emission for any
    `course_id` flagged `over_merged`, per §6a); membership key `(subject, number)`
    is lossy → label recs "likely"; add `statewide_prescriptive.js` to the daily
    `git add`. **The JOIN is in-session testable** against committed `kb/*.json`
    (write a standalone verify script) even though the full regen isn't.
- **Then the 3 audience views** (Student / College / System) as further gallery
  renderers over the same data (per the scope doc).
- **Backlog** (`docs/kb-notes/eacr-consolidation-scope.md`): full credential merge
  (CPL Type as tag), **CCR inverse view** (one row per course → aligned exhibits),
  **CSR rollup** (one row per discipline → CPL opportunities, for faculty),
  curate-the-unclassified (CER triage queue), per-group college counts, mojibake nit.

### Next concrete step
Read the PR-4 scoping agent's findings → decide consumer vs producer for the
prescriptive layer → build it (v2 first, then graduate). If producer, mirror the
PR-2 pattern (synthetic unit test + regen-gated, Sam verifies live).

## Session 28 (2026-06-01) — PR-4 prescriptive layer + v2-toggle fix

### What shipped (both merged to `main`)
| PR | What | Side |
|---|---|---|
| #252 | **v2-toggle fix (fix-first)** — the "🎓 Credential view" `<details>` wouldn't expand. Visible `::before` chevron + delegated JS toggle on `.sw-gallery-sum` with `preventDefault()`. jsdom-tested (12 assertions). | consumer |
| #253 | **PR-4 prescriptive layer** — per credential, the colleges that could adopt it + the **likely local course each already teaches**. New producer `_build_statewide_prescriptive()` → `statewide_prescriptive.js`; consumer `buildPrescriptiveHtml()` renders a collapsible block per v2 card. | producer + consumer |

### What's been learned
- **The EACR card's `potential_names` is NOT the prescriptive data.** The card's
  potential adopters come from TOP/CID *program* matching (`ProgramsofStudy` +
  `CollegeCourses`). The actionable "which local course" data lives in a different
  place — `coci_articulations.json` `adoption_leverage` (leverage college NAMES) ⨝
  `coci_minted_memberships.json` (`{college,subject,course_number,units}` per M-ID
  `course_id`). Bridged by `unified_title`. Don't assume one "potential" list is
  the other.
- **Producer-side, keyed by the consumer's group key.** The consumer
  (`statewide_data.js`) has no `course_id`, and one `unified_title` fans to many
  M-IDs — so the join MUST be producer-side, and the emitted file is keyed by the
  exact field the consumer groups on (`unified_title`). Then the consumer is a
  trivial `map[title]` lookup. (Same lesson the PR-4 scoping agent predicted.)
- **The over-merge guardrail needs a *clean-source* invariant, not a naive
  "withheld>0" check.** A college can appear in BOTH an over_merged record's
  leverage AND a clean M-ID's leverage for the same credential — it's legitimately
  recommendable via the clean one. The right invariant: *every emitted (title,
  college) pair has a clean (non-over-merged) source*; `withheld` counts only
  colleges with NO clean source. My first verify-script assertion got this wrong
  (flagged a legit emit as a leak) — the BUILD was right, the TEST was wrong. 4,538
  pairs correctly withheld, 0 leaks.
- **Spot-check against a documented example pays off.** The handoff named
  `CNST M1029 → Rio Hondo CARP 050T`; my join reproduced it exactly — instant
  confidence the membership join resolves real local course codes.
- **Commit the generated file + hand-add the `<script>` tag so it's live on
  merge.** A producer-side change normally waits for the daily regen, but
  committing `statewide_prescriptive.js` (generated via the real
  `_build_statewide_prescriptive()`) + adding the tag to both HTML files (Rule 4)
  makes it live immediately. Confirmed the inline producer header matches the
  committed file char-for-char → the daily regen is a no-op diff (no churn).
- **The `<details>` styling gotcha is real + reusable** → split into
  `docs/kb-notes/methodology-styling-native-details-toggle.md`.

### Current state
- v1 (table) + v2 (master-detail Credential view, now with a per-card
  **prescriptive block**) both live; v2 expands correctly. PR-4 is producer-side +
  live on merge (committed file + tag). 806 credentials carry recommendations.

### Strategic roadmap
- **Next: the 3 audience views** (Student / College / System) as further gallery
  renderers over the same consolidated + prescriptive data (per the scope doc).
  The prescriptive layer is the data spine for the **College** ("my adoption
  options") and **System** ("inequitable-access map") views.
- **Backlog** (`docs/kb-notes/eacr-consolidation-scope.md`): full credential merge
  (CPL Type as a tag), CCR inverse view, CSR rollup, curate-the-unclassified,
  per-group college counts, the mojibake-em-dash nit. Also: **C-ID prescriptive
  leverage** (30.4k slots, deferred — keyed by CIDNumber in the 24 MB raw
  `coci_course_list.xlsx`) is the natural extension once that heavier join is worth
  it.

### Next concrete step
Pick the **Student view** (highest-value seeker lens) or wire **C-ID leverage**
into the prescriptive layer. For the Student view, reuse `buildCredentialView` +
`buildPrescriptiveHtml` as a new gallery renderer (v3) with a near-me/region
filter; per the versioned-gallery methodology, keep v1/v2 untouched and graduate
the winner.

---

## Session 29 — three grains complete (CCR inverse + CSR rollup) + EACR filter lift + CER enrichment (2026-06-02 · "Two-Niner")

Resumed cold after a bricked/parallel-session scare. **First act: a diagnostic.**
The alarming "10 sessions of work missing from `main`" was a **stale `origin/main`
tracking ref** — the container's first `git fetch origin main <branch>` aborted on a
non-existent remote branch, so `origin/main` never updated from its clone-time value.
A clean `git fetch origin main` (alone) corrected it with a *forced update* (the
Session-26 PII-purge force-push footprint) → divergence collapsed to `0 0`; branch ==
`main` exactly. The real episode (frozen Session 28 + a parallel recovery session) had
already self-healed: duplicate PRs #255/#257 were closed, the new work landed as #258.
Captured in `playbook-resume-frozen-session-check-main-first.md`.

### What shipped (4 PRs, all merged + live)
- **#259 CCR inverse view** — mirror of the EACR: expand a CCR row → all aligned
  exhibits/credentials. `_build_aligned_exhibits_by_course()` pivots
  `coci_articulations.json` by `course_id` → committed lazy file
  `unified_courses_aligned.js` (2,355 courses); consumer renders "🎓 N aligned …" in
  the row-expand (reuses `.uc-member-table`, unions Phase-B `consolidated_from`). 13/13.
- **#260 CSR rollup** — discipline grain: sortable **"CPL opportunities"** column on the
  CSR tab + a credential-list modal. `_build_cpl_by_discipline()` rolls up by discipline
  (sourced from the minted catalogs — the articulations' own `identities` map keys only
  ~381/2,355 re-minted course_ids) → `kb/discipline_cpl_rollup.json` (97 disciplines).
  12/12. **Completes "same data, three grains": CER/EACR (credential) · CCR (course) ·
  CSR (discipline).**
- **#261 EACR filter lift + darker titles** — filters were *inside* the v1 `<details>`
  (hidden on collapse, unshared). Lifted search + filters into a page-level dark bar
  above the gallery. Darkened `.sw-gallery-sum` gold `#C9A84C` (washed out on the light
  page) → navy `#0A2240`. Consumer-only. 13/13.
- **#262 CER enrichment** — per credential's expanded detail: scope chips (🏛 CCC + 🏠
  Local; "⚙ CCC Generated · consideration only" when only Local), CPL-type chips, the
  statewide standard rec (modal CCC) or a generated suggestion (modal, labeled
  not-official per §11), green(articulated)/orange(potential) college badges + "+N more".
  Producer emits 5 new fields from `coci_articulations.json`; consumer
  `renderScopeAndBadges()`. 17/17.

### Learned this checkpoint
- **CER producer regenerates from committed inputs → ship live-on-merge.** Unlike the
  EACR (`statewide_data.js` needs the raw MAP pull, absent locally → next-cron),
  `export_credential_reference()` reads only `kb/*.json`, so I regenerated
  `credential_reference_data.js` locally + committed it. Generalized in
  `methodology-ship-generator-changes-live-on-merge.md`.
- **Watch the adapter.** `adaptBakedRow()` whitelists fields — new producer fields are
  silently dropped at the consumer until added there. Caught in the build, not by Sam.
- **Daily cron = mid-flight merge hazard for generated files.** #262 went `dirty` when
  the 2026-06-02 daily run regenerated `credential_reference_data.js` on `main`. Fix:
  rebase onto main, **re-run the producer** to regenerate (never hand-merge a minified
  one-liner), verify additive-only vs the new main, force-push.
- **jsdom-test the real consumer** — ran each actual `*.js` IIFE in jsdom with a minimal
  fixture + stubbed `fetch`; caught the CSR grouped-by-default render + the thead-row
  selector quirk, and proved the EACR filter wiring survived the bar move.

### Current state
Three grains all live (CER/EACR · CCR inverse · CSR rollup); EACR gallery filters
page-level (primed for more views). New committed artifacts: `unified_courses_aligned.js`,
`kb/discipline_cpl_rollup.json` (both in the daily git-add); new generators
`kb/_build_aligned_exhibits.py`, `kb/_build_cpl_by_discipline.py`.

### Strategic roadmap / next
- **CER unclassified-triage** (the original "CER triage") — assign a unified_title to
  the 105 unclassified exhibits.
- **EACR v2** version of the CER scope/generated-rec treatment (producer-side → next cron).
- **MID curation passes** (CompTIA A+ fragmentation) → Suggested-merges worklist;
  tightens the CCR/CER/CSR lists automatically.
- **The 3 audience views** (Student/College/System) — still the headline; System needs a
  privacy ADR first.

### Next concrete step
CER unclassified-triage OR the Student audience view (v3 gallery renderer, reuse
`buildCredentialView` + `buildPrescriptiveHtml` + a near-me filter; keep v1/v2 untouched).

## Session 33 — CER intelligence layer: noise suppression + GE-Area credit + student impact (2026-06-04 · "Sleepy Goodall")

Triggered by Sam's live AP-card review ("CIDs for 170/180, a curious COMM, several
MIDs that shouldn't exist") + three authoritative AP-credit policy docs he supplied.
6 PRs (#291-#296), all merged + live. The arc: diagnose → noise-suppress → discover
the *right* canonical layer (GE Area, not course-fold) → operationalize → prioritize.

### What was learned
- **The "curious COMM" was systemic.** `COMM M1038` "Group Communication" (Clovis)
  articulates to **61 credentials**, all "Elective Course Credits" — a high-precision
  detector (≈100%-elective recs + ≥5 credentials + ≤3 colleges) matches exactly it,
  never the legit broad CTE courses (WELD/AJ carry real recs → 0% elective).
- **AP/CER canonicalization is a GE-AREA mapping, NOT a course-identity fold.** Per
  AB 1985 / AA 17-20 (+ IB/CLEP title 5 §55052.5; current charts ESLEI 24-35), an exam's
  system-level meaning is its **GE Area + min units**; course-to-course is explicitly a
  *local* decision. A would-be re-mint ("fold Western-Civ M-IDs into HIST 170/180") was
  the **wrong layer**; the GE-Area reference layer is right, authoritative, additive (no
  re-key). The policy's "no GE Area → elective" fallback *explains* the COMM bucket.
  Model: KB note `reference-ap-credit-ge-area-canonicalization`.
- **49% of Western/World-Civ local courses carry no CIDNumber** → the fragmentation is
  title-only, not a resolution bug; can't be auto-folded, and shouldn't be (it's local).
  **World ≠ Western** (HIST 150/160 vs 170/180) — a "curious" World-Civ→AP-European-History
  articulation is a genuinely different course, not noise to fold.
- **Student-impact data grain matters.** Per-exhibit "students served" IS derivable
  (`View_ArticulatedCollegeCourses.Students` → roll up exhibit_id→unified_title);
  per-exhibit **eligibility** is NOT (only college×CPL-type) — a real gap pending an
  exhibit-keyed MAP export. Public counts need a privacy ADR: aggregate + small-cell
  suppression <5 (Sam). ADR: `adr-cer-student-impact-counts-privacy`.

### Patterns that worked
- **CER ships live-on-merge** (producer regenerates from committed inputs) — but
  cron-only data (the PII-purged CustomReport) no-ops locally + lights up on the daily
  pull; verify with a synthetic-fixture script (`kb/_verify_students_served.py`).
- **Whitelist every new baked field in `adaptBakedRow`** — the Session-29 omitted-field
  trap bit twice (`ge_credit`, `students_served`); a red test each time.
- **char-prefix match rules** beat 30 exact aliases for IB's legacy name zoo.
- 5 committed CER jsdom test files now (68 assertions); guard the failure mode + the
  privacy mask, not just the happy path.

### Next concrete step
Recommended-order **#1-#4 ALL shipped.** #3 GE-Area coherence check (#298) found the data
is already GE-coherent (1 residual) — a future-proof cue. #4 detector (#299) + **applied
the 18 Signal-A `&`/`and` dupe groups** (19 pairs, CER 2013→1994); Signal B (162) is
manual-review leads (sibling-credential noise lexical heuristics can't filter — the
exhibit-canon skill's domain). **Lesson:** a `&`/`and`-class winner should be the
DOMINANT record (most articulations to keep, fewest to re-point), NOT the cleaner
spelling — they usually agree, but diverge when the `&` form dominates (Fire Service).
Next: eligibility side of student-impact (needs an exhibit-keyed MAP export); the 3
audience views (System needs the privacy ADR — now half-written); the Signal-B leads.

## Session 34 — Student view (v3) + the data-unblock loop + PII small-cell hardening (2026-06-04 · "Lucid Wozniak")

Shipped the **Student view** (first audience view), then a long live thread where Sam
unblocked the authenticated MAP data — which surfaced both a real CER parse-robustness gap
and the true shape of the missing input. **5 PRs (#301-#305), all merged + live.**

### What shipped
- **#301 Student view (v3)** — a 3rd gallery renderer over the same filtered + prescriptive
  data. Pick a College/District/Region → each credential is classified **✅ available now**
  (adopter) / **🎯 likely-qualify** (names the exact local course the college teaches, from
  `statewide_prescriptive.js`) / **○ aligned-program**, sorted most-actionable-first, with a
  "you'd typically earn ~N units" headline; browse mode nudges to pick a college. Consumer-only,
  v1/v2 untouched. Factored a shared `typicalAward()` helper (DRY, behavior-preserving). 27 jsdom assertions.
- **#302 CER carry-forward** — the CER ships live-on-merge *without* the PII CustomReport, so each
  ship was NULLing the public Students column (oscillating blank). Now carries forward the last
  cron values when the report's absent (privacy-safe). #303 **header restyle** (uniform meta row).
- **#304 PII small-cell hardening** — `<2`-suppress the per-college cohort counts; drop 2 unused
  staff-PII views from the fetch; new standing `tests/pii_guard.test.js`. #305 **robust Students
  parse** (`_to_count`: int/float/comma/whitespace) + ExhibitID-strip + roll-up diagnostics.

### What was learned
- **"Unexpectedly 0" from a roll-up is a *source* question first, a *bug* question second.** I
  chased the blank CER Students column through carry-forward (#302) → robust parse (#305) →
  instrument-the-roll-up, and confirmed the **join key was sound** (coci_articulations.exhibit_id
  == the raw MAP ExhibitID, 100% overlap with `View_ArticulatedMAPExhibits`). The real answer
  (Sam, from his side): **the per-exhibit count he wants is students ELIGIBLE for CPL, which is
  in neither the MAP dashboard nor the Custom Report.** Served ≠ eligible; eligibility isn't at
  exhibit grain anywhere upstream. So it's a **missing input**, not a code bug — a new dataset is
  the fix, and the roll-up/suppression/carry-forward/column structure is already there to receive it.
- **`int(v or 0)` silently zeros a `"3.0"`/`"3,000"` string** (ValueError → 0) — a whole-column
  blanker if the source returns numeric strings. The robust `_to_count` + a diagnostic that prints
  *dataset_found / rows / matched_exhibitid / students>0 / unparseable* (counts only, no raw
  values) makes the next "0" conclusive without needing the PII file or the (403-gated) run log.
- **A read-only PII audit before flipping the switch paid off.** The pipeline is **column-selective
  + aggregate-only** — every CustomReport consumer reads named columns and reduces to counts, so the
  authenticated pull's new PII columns (names/DOB/StudentID) are *never read*. The one gap was
  small-cell *counts* (the audit hunts PII *values*); closed with `<2` suppression + the guard.
- **I can't dispatch workflows** (session integration token → 403 `actions: write`); Sam runs them
  from the Actions UI. The watch pattern: a background `git fetch origin main` until-loop that pings
  me when the daily commit lands (no webhook for main commits).

### Current state
Student view live (College/System remain). PII posture hardened + verified live (per-college counts
`<2`-suppressed, guard green, staff views no longer fetched). CER Students column `—` awaiting Sam's
eligible-per-exhibit dataset.

### Next concrete step
Wire the new eligible-students-per-exhibit dataset into the roll-up when it lands (key on ExhibitID
or credential; decide replace-vs-alongside the served column; same `<5` suppression). Then the
**College** + **System** audience views.

---

## Session 35 — CER identity consolidation: the EMT 29→18 collapse + the ordinal rule (2026-06-04)

Sam's screenshot review of **EMT Certification** in the CER: the expanded
"Common-course identities" table showed **29 rows** for what is really ~12
courses — the EMT-Basic course minted as a dozen single-college M-IDs ("EMT" /
"EMT Academy" / "EMT (Basic)" / "EMT I" / "EMT Training" …), plus genuinely
distinct sub-courses (Lab/Clinical/Refresher/First-Responder/Intro/NatRegistry),
First-Aid/CPR (a separate credential), and one automotive course. Ask: refine the
CER — *why* are these here, *why* don't the near-identical M-IDs consolidate, and
collapse them (it "involves the CCR procedures too"). Plus a UI tweak: widen the
first column so rows are shorter. **3 PRs, all merged.**

- **#307 — widen the CCR identity column.** The HTML `<style>` capped
  `.cr-art-ident` at `max-width:32ch` under `table-layout:auto`, squeezing the
  longest column (identity = code · title · disc · TOP) into 5-6 lines. Switched
  the arts table to `table-layout:fixed` 42/40/18 in `ensureCerScopeCss()` (one
  static JS file → both HTMLs, no Rule-4 mirror). `tests/cer_arts_width.test.js`.
- **#308 — consolidate near-duplicate identities (the headline).** Folded
  same-course M-ID/Unified identities into one CER row at build time
  (`export_credential_reference()._consolidate_arts`) — **display only, no
  identity mutation, reversible**. EMT: **29 → 18**; globally **94 rows fold
  across 47 cards**, **0 of 72** merged groups suspect (audit = members share a
  substantive word). `⛓ N variants` badge; folded ids in the tooltip; full KB
  note: `methodology-within-credential-identity-consolidation.md`.

### Two answers Sam wanted (the "why")
- **Why these courses are under one exhibit:** the CER groups raw articulation
  records by `unified_title`; each record's local course → minted M-ID. The 29
  are: the EMT-Basic core (now folded), distinct sub-courses, First-Aid/CPR (a
  separate credential, already subject-outlier-flagged), and `AUTO 156G "Engine
  and Related Systems"` — an **upstream MAP data-entry error** (San Diego Miramar
  mapped an EMT exhibit to an automotive course). The pipeline reflects raw MAP
  faithfully; the subject-outlier badge already flags the noise. **Not a bug
  here — a signal to send upstream.**
- **Why the M-IDs don't consolidate:** the CCR worklist's `_sug_sig` is
  *level-SAFE* (won't merge "Tech I"≠"Tech II") → ~26 buckets for the 29; and
  `coci_articulations.json` is a static raw-M-ID artifact, so even curator merges
  wouldn't collapse the view. Hence Sam's **"CER view + worklist"** decision.

### Learnings
- **The ordinal rule** is the crux of any title-family grouping: `"1"/"I"` is
  non-distinguishing (a bare title == its "I"); `"2"+/"II"+` are kept. It folds
  EMT-Basic while keeping Calculus I≠II / Spanish 1≠2 / Paramedic 2/3/4 apart.
  (Removing all ordinals over-merged sequences — caught by the global audit.)
- **A `len(w) <= 1` letter-guard silently eats single-digit ordinals.** `"2"`
  has length 1 → dropped before the digit logic. `len==1 and not isdigit()`.
- **Exclude C-ID/CCN anchors from folding** — blank titles → unreliable key, and
  they're authoritative one-per-course anyway.
- **Audit a global grouping heuristic before shipping:** every merged group must
  share a substantive word; pair with idempotency + a rows-count assertion.
- A `null`-byte slipped into a Python string literal via the Edit tool once
  (`" solo%d"` → `"\x00solo"`); `ast.parse` + a `\x00` count caught it fast.

- **#310 — the durable "+ worklist" half (SHIPPED).** `export_unified_courses()`
  now surfaces the EMT-style clusters in the CCR Suggested-merges worklist via a
  **co-articulation family pass**: mergeable M-IDs grouped by `(subject prefix,
  _fam_key)`, GATED on a shared credential in `coci_articulations.json` (29 groups,
  0 cross-SUBJ4 — fixed an AUTO+AVIA-under-one-ASE-cert early run; EMT's 9 live-
  mergeable M-IDs lead with the canonical `EMST M1064`). Consumer: a third worklist
  `_kind:"family"` reusing Confirm→`doConsolidate`→`merge_into`. `_fam_key` factored
  to module scope (shared with #308; CER output byte-identical). Never auto-applies.
  `tests/uc_family_merges.test.js` (11). **The co-articulation gate is the key
  safety idea** — grouping by `_fam_key` alone would over-merge globally; requiring
  a shared credential + same SUBJ4 keeps it tight (29 groups) and within-discipline.

### Current state
The full **"CER view + worklist"** deliverable is shipped (4 PRs). The CER view
de-clutters (#308); the worklist surfaces the durable merges (#310). **Open
follow-on:** confirmed merges propagate to the CCR + auditor but NOT to the static
`coci_articulations.json`, so the EACR/CER articulation views won't reflect them
(beyond #308's view fold) until a **Rule-7 re-key**.

### Next concrete step
If Sam wants the EACR/CER to reflect confirmed worklist merges, scope a **Rule-7
re-key** of `coci_articulations.json` (dry-run + alias map + atomic land). Else the
standing carryover: the eligible-students dataset wiring + the College/System
audience views.

### Checkpoint 2 (2026-06-04, session close)
Session 35 closed with **5 PRs merged** (#307 column width, #308 CER view fold,
#309 checkpoint, #310 the worklist co-articulation family pass, #311 doc record).
The full **"CER view + worklist"** deliverable is shipped; the only open follow-on
is the Rule-7 re-key (above) — Sam: *"I'll wait on those for the next session."*
Off-workstream but captured: an **environment-reach advisory** (recovering
Cowork-style screen/computer-use on the web env) → new KB note
`docs/kb-notes/reference-claude-code-web-environment-reach.md`. The reusable
worklist learning (the co-articulation + SUBJ4 double-gate that makes `_fam_key`
safe to apply globally) was folded into
`docs/kb-notes/methodology-within-credential-identity-consolidation.md`.

---

## Session 36 — perf + cross-disc re-mint + the CER Eligible/Students columns (2026-06-09)

A long session across three workstreams. **8 PRs merged** (#314 perf, #315
cross-disc re-mint, #316/#317 discovery tooling, #318/#319 eligible column +
Title-bridge fix, #320 students-from-catalog).

### Learnings
- **Lazy-load heavy per-tab data behind tab activation** (#314). The dashboard
  eager-`<script>`-loaded ~17 MB of per-tab JSON before the page was interactive —
  none needed by the default tab. Defer each payload + its first render to first
  tab-open (`tabs.js` onActivate/loadScript). 17 MB → ~1 MB default load.
  `methodology-lazy-load-heavy-tab-data.md`.
- **The cross-disc shell class was invisible by design** (#315). `kb/_seed_coci_
  minted_mids.py` STOP_PATTERNS deliberately excluded "administrative shells"
  (work experience, independent study, …) — that's *why* work-experience had 0
  minted identities. A principled re-mint (RSCH M1001 + WKEX M1001,
  cross_disciplinary, auditor-exempt) brings them in. Cross-list rides the MINTED
  RECORD (cron-safe — `coci_curation.json` is rebuilt from Supabase).
- **Cron-as-window** (#316/#317): a session can't reach MAP (egress allowlist),
  but a runner can + Claude reads run logs. Ship a read-only probe behind
  `workflow_dispatch`. `methodology-cron-as-discovery-window.md`.
- **The id-namespace gotcha** (#319, the big one): MAP's Exhibit CRs Catalog keys
  exhibits by a NUMERIC ExhibitID (+ includes military/ACE); View_Articulated
  MAPExhibits (our crosswalk's source) keys by the MAP… STRING id (no military).
  Two namespaces — a naive ExhibitID join baked 0. Bridge on exhibit **Title** →
  unified_title. When a MAP dataset won't join on id, check the id NAMESPACE
  before assuming a data bug. (Same root cause sank the Students column —
  View_ArticulatedCollegeCourses.ExhibitID is also numeric, 0/37,093 matched.)
- **Credits sum, headcounts don't** (#318/#320): eligible/transcribed/applied
  CREDIT UNITS are additive across CRs/skill-levels (sum them); per-CR STUDENT
  counts are NOT (one student spans CRs → MAX per exhibit, then sum across
  exhibits). Credits → no suppression; headcounts → <5-suppressed.

### Current state
The CER now has an **Eligible (units)** column (1,726/1,994 populate; eligible ≥
transcribed 100%; "credit waiting to be unlocked = eligible − transcribed" — e.g.
Military Basic Training 11,528 eligible / 0 transcribed) and a **Students** column
sourced from the catalog's TotalStudentsForCR (#320) — **both confirmed live on the
cron** (Sam, 2026-06-09: "Student count is working!"). Cross-disc RSCH/WKEX
identities are live. Dashboard loads ~1 MB.

### Next concrete step
Both CER columns are live; only a soft follow-up remains (confirm the
TotalStudentsForCR label semantics with Sam — not a blocker). Next real work: scope
the **ACE skill-level child-exhibit** decomposition (data-confirmed: 3,013
skill-leveled exhibits, 2,428 multi-level).
