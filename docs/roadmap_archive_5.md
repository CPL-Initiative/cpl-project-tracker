---
title: CPL Project Tracker — Roadmap Archive, part 5
date: 2026-10-25
tags: [archive, roadmap, project-memory, session-history]
related:
  - docs/roadmap_archive.md (part 1, where new rotations land)
status: archive
---

# Roadmap Archive, part 5

Session 141, the INDEX history trimmed 2026-08-19 to 08-21, moved verbatim and in their original order from
[`roadmap_archive.md`](roadmap_archive.md) on 2026-10-25 (S474) so each file fits the 150 KB archive
budget. Parts 2 to 6 hold the body that sat between part 1's newest rotations at the top and its
2026-09-17-onward rotations at the bottom.

## Archived session narrative — Session 141 (SkyLink, moved out Session 144)

### SkyLink — the lead figure was one decision, not three hundred (2026-08-11, Session 141)

Shipped **#1121**: the waiting-credit breakdown, the funding-pool split (real tab names, each priority's cap + the
college's own target, a *Do this next* per pool), 15-entry Resources, and the tier block — *"Advancing — 2 of 5"* with the
missing criteria named, validated across **all 115 colleges, 0 mismatches**. Tests **104 → 170**.
⭐ **98.8% of the 64,074 articulated-and-waiting units is Credit for Basic Military Service** (87.7% to a GE/graduation
area); **65 of 73** colleges are at 100%, the whole backlog is **592 rows**, and **33 of 106 colleges have none** — a
finished queue, not a missing measurement. It is one decision applied repeatedly, not 300 judgment calls.
⭐ **A percentage must never round UP into a claim it cannot support** — "100% military" printed with a non-military row
visibly above it (true 99.76%); every assertion passed, and it was caught by *rendering the page and reading it*. Same PR
already guarded the inbound form (published 25.0% is really 24.96%).
⚠️ **The access shape is an RLS decision, not a UI change** — four of the tab's reads are DB-gated, so `?college=` for an
unauthenticated college returns nothing. ⚠️ **`map_credential_student_rollup` is a MATVIEW: Postgres cannot give it RLS,
and `anon` holds the grant.** Nothing exposed today (0 published cells under k=10; all 420 suppressed rows null *every*
measure) — but its suppression has no backstop beneath the build script. Durable:
`methodology-a-percentage-must-not-round-up-into-a-claim`, `methodology-a-materialized-view-cannot-carry-rls`,
`reference-the-waiting-credit-backlog-is-basic-military-service`.
**Then Sam read the live tab (#1123):** suggested questions now **fill AND send** in one click (`cpl_chat.js` gained a
sibling `ask()` — ⚠️ **`prefill()` stays send-free**, the Sierra Training replay depends on it; add the sibling, never
retune the shared helper), and the tier block is **prose**, with the three tiers named in the header because *a
classification label must ship with its scheme*. Unmet criteria sort **nearest-threshold first — in prose the ORDER is
the advice** — and **Inactive gets its own sentence, never "0 of 5"** (the worker assigns it by absence of recorded
activity, so a score blames a college for a scheme it never entered). Both confirmed by Sam.
⭐ **A source-text assertion is unsound in BOTH directions** — four tier checks went red on a correct page because the
copy is built from concatenated literals and reflowing split the phrase, one hour after 163 assertions went green on the
self-contradicting "100%". Assert `root.textContent`; reserve source-greps for real source invariants.
**Reading all four tier states then found copy no assertion would name** ("you meet 0 of the 5 criteria" → "you do not
yet meet any of the five"). Tests **104 → 183**. Durable: `methodology-assert-what-the-reader-sees`.
Story: `docs/college_action_page_lessons.md` · handoff `docs/session_142_handoff.md`.

### SkyPro — the tab folds down, and two things it was quietly saying wrong (2026-08-12, Session 143)

Sam **held** MAP deep links, the RLS decision and MIS; the work is the tab. After the MAP team used it he asked that
**Sierra AI lead** and everything under her collapse (default closed) — *"a minimal initial view with nested expandable
details for the inquisitive"* — and that the **22 strategies stop reading as "a long list of intimidating to-dos"*.
Shipped **#1128**; tests **183 → 228**.
⭐ **Collapsing is not hiding** — every closed header carries that college's own figure, so shut the tab is an eight-line
standing report. Strategies now nest under the funding priority they earn against (10/6/6).
⭐ **Five colleges were being told they have NO implementation funding** — Mt. SAC, Norco, Reedley, MiraCosta, LA
Southwest. Only ONE side of the name join went through `cplCollegeShort()`. The old join test asserted `S(roster)` vs
`S(roster)` and reported "0 orphans" while five were orphaned live. Mt. SAC now returns **$522,239** (Sep-BOG).
⭐ **An absent measurement was rendering as an achievement** — a college with no data was told its queue was finished.
⚠️ Sam's corrections: contacts/staff are **not PII**; "Statewide CPL Benchmarks", not a tier or a comparison (fixed
thresholds ≠ ranking); the `indExcludeSA` lead I offered was wrong (it is set to *include*). The two student counts are
**parked** — MAP records are mid-correction, so our extract is stale. Durable:
`methodology-normalise-both-sides-of-a-join`, `methodology-a-collapsed-section-must-still-inform`.
Story: `docs/college_action_page_lessons.md` · handoff `docs/session_144_handoff.md`.


### SkyTouch — Ashley's second crosswalk, and the file that abbreviates its own titles (2026-08-12, Session 144)

**Ashley drove this one**, not Sam: Futuro Health's **Human Touch Healthcare** (6 weeks / 80 hrs / online soft skills)
crosswalked to every CCC **CNA** program. Shipped **#1134** — 5-sheet workbook + published HTML view.
⭐ **The literal ask would have produced an unusable list.** HTH cannot articulate into the CNA course: that is a
**CDPH-approved 160-hour course** (60 theory / 100 clinical) fixed in regulation. It maps to the course *beside* it —
interpersonal/intercultural communication, healthcare ethics — which is also the easier faculty ask.
⭐ **Course-level MIS beats program-level COCI for "who offers X"** — **61** colleges teach CNA (153 courses) vs **32**
with a COCI award record; many run it as a noncredit course with no award. 59 have a receiving course, 22 score 4–5,
24 already run CPL in MAP.
⭐ **Futuro Health is ALREADY a MAP partner entity (ID 133)** with a live landing page and **ZERO exhibits / ZERO credit
recs** — surfaced by *querying `cpl_memory` first*, and it is upstream of all 61 colleges.
⚠️ **The MIS course file ABBREVIATES titles** (`INTERCULTURAL COMM`, `Interpersonal Commun`, `BIO-ETHICS`) — six colleges
were about to be reported as having **no receiving course** when the canonical course was in their catalog. A false
absence is worse than a missing row: it closes the question. Fixing the module patterns alone left the *fit* regexes
carrying the same assumption and reproduced the identical symptom.
⚠️ `recalc.py` **cannot run in this sandbox** (LibreOffice timed out at 539s, twice) — formulas verified by column +
expected value against the source JSON instead. Durable:
`methodology-a-source-file-that-abbreviates-titles-fakes-an-absence`, `reference-course-level-mis-beats-program-level-coci`.
Story: `docs/futuro_hth_crosswalk_lessons.md` · handoff `docs/session_145_handoff.md`.


### Excel→Supabase Phase 2-4 — full shipped-phase log (retired from CLAUDE.md §11, 2026-08-13)

The cell below is the verbatim changelog that had accumulated in the roadmap table. The live cell
now states current truth only (P3 + P5 remaining).

| **Excel→Supabase Phase 2-4** | Migrate remaining Excel-driven tabs (Dashboard project cards, Budget, Vision 2030, Personnel). Per-tab inline editors. Excel file retires once Phase 4 cuts over; periodic Supabase→xlsx export retained as backup. **Phase 2 (projects) is COMPLETE: seeded + cut over + editor all landed (Session 15 build → Session 16 seed/cutover/editor).** Phases 3-5 (Budget/Vision/Personnel) follow the same five-step shape + the RLS-tighten step; Personnel already has 26 rows so its PR-3 has UPDATEs. | **Phase 2 DONE** (Session 16); **Phase 3 Budget read-path DONE** (PR #189); **Excel-retirement scope DONE** (PR #210, Session 23 — `docs/kb-notes/excel-retirement-final-scope.md`; corrected the surface: Personnel already Supabase, Vision 2030 is static/computed — neither needs migration); **Excel PR-1 (KPI-ladder keystone) DONE** (PR #211, Session 23 — ladder now sourced from `workplan_goals` not Excel, parity-exact across 49 projects; live 11-cell blank-vs-0 fix on `workplan_goals`, 1.4's real 0s kept); **Excel PR-2 (D.* rows RETIRED, not migrated) DONE** (PR #213, Session 24 — the 15 `D.*` sub-population helper rows were **100% vestigial**: sole value-reader `populate_current_metrics()` dead since 2026-05-28, every other ref excludes them, all 3 JS report gens skip them. Deleted the rows + the dead `populate_current_metrics()`/`_override_int`/`_pmetric_int`/`_ppct`/`_pcount` cluster; generator-only, proven parity-minus-D.* on snapshot + Excel-fallback paths. Method: `docs/kb-notes/methodology-verify-consumer-before-migrating.md`); **KPI-ladder editor = ALREADY DONE** (Session 24 measure-first — PR-1 sourced the ladder from `workplan_goals`, which `workplan_goals.js` already edits; 27 ladder-bearing projects all editable, 0 gaps — no build needed); **Budget inline editor DONE** (PR #215, Session 24 — click-to-edit dollar cells on the 5-Year Funding Plan, `budget_editor.js`; 7 cells/row PATCH `budget_funding`; no `total=Σyears`/`avg` formula yet per Sam; **budget_funding/budget_expenditures/personnel RLS tightened** to `is_allowed_reviewer()` live, `kb/supabase_budget_rls_tighten.sql`). **Excel-dependency audit + fix queue DONE** (PR #217, Session 24 — `docs/kb-notes/excel-dependency-audit.md`, the authoritative remaining-work catalog; triggered by a curator hitting the card "Update" button → it opened Excel-for-the-Web). **Excel retirement — Session 25 (Bruh 25) shipped P1+P2+P4, all merged:** **P1 ✅ (#219)** the "Update→Excel" card button now triggers the inline Latest Update editor (akpi copy dropped; `excel_row` no longer emitted; `dashboard_filters.js` rewire + toolbar button removed); **P2 ✅ (#221)** config tables moved to committed `kb/dashboard_config.json` via new `load_dashboard_config()` (`read_project_config`/`read_config_overrides`/`read_kpi_parameters` rewritten, all drop their `wb` param) + the `ensure_kpi_config_sheet` **WRITER deleted** — the master `.xlsx` is **no longer written on any run** (writer-blockers 2→1); measure-first found Col AG empty + KPI_Config == code defaults, so the JSON carries only the 4 real `project_config` fields; parity-proven (byte-identical readers + full A/B regen); **P4 ✅ (#220)** dead readers `read_annual_goals`/`read_workplan_goals` deleted (148 lines). **Remaining:** **P3** Update Log history (product fork — Sam **dismissed/parked** the decision 2026-06-01; measured: 38 projects / 120 stale entries (latest 2026-04-08); options = read-only **snapshot** / **retire** (keep `latest_update`) / **Supabase `project_update_log`** table); **P5** drop the `.xlsx` — now blocked only by `read_projects` (KPI-ladder + outage fallback), `read_budget_plan` (+ the carved-out budget `factors`/`year_labels`), and `read_update_log`/`archive_updates_to_log` (the **1 remaining writer**, gated on P3) + the `.bak`; keep a Supabase→xlsx backup. Independent: Budget `total`/`avg` formula layer (+ total read-only) + personnel editor (fix the 26→13 dedupe row-identity first). **Also Session 25:** new **daily data-pipeline reference doc** (`docs/kb-notes/reference-daily-dashboard-data-pipeline.md`, #222/#223) — accounts for all **7 data sources** + every headline KPI's lineage + the committed daily dataset; confirmed (via Sam's screenshot) the **MAP Custom Reporting Module's 9 categories are pulled in full** (151 fields), with **College Contacts + College Users & Roles fetched-but-unused** (drop-or-wire decision pending). |


### docs/INDEX.md update history — entries retired 2026-08-13
- 2026-10-20 (S433 SkyCoffeeberry, the routine): the two ENVR forestry pairs queued for a faculty reviewer as `surfaced` pairs (#2278); the CSR quarterly routine compares the handbook with the accepted 19th edition on a quarterly cron (#2279); the CSR lane compacted under its budget; Sheet 105 still open; handoff 434; no KB note.
- 2026-10-20 (S432 SkyYerbaSanta, the routine): Sheet 104 applied, ten forestry identities to ENVR and four wine to AGPR, each discipline following its code (#2276), re-keyed live and read back; the quarterly probe read a second time; Open Asks Sheet 105 asks about the two forestry stragglers (the permission check held their apply); handoff 433; no KB note.
- 2026-10-20 (S431 SkyChaparral): #2269 and #2270 landed and the 44 re-keyed live (run 39362668144, read back); the Sierra hashchange test waits for its state (#2271); Open Asks Sheet 104 asked and ruled, move-ten and agpr (#2272, CPLBrain#404); the handbook link to the live page (#2273); the CSR quarterly probe (#2274); handoff 432.

- **2026-08-10** — SkyDeck: CAC apprenticeship-pathway slides rebuilt from flattened PNGs (3 → 6 slides, 3-click builds, speaker notes on all 15 + a printable run sheet); ⭐ the re-key caught two source unit totals that do not reconcile because the originals clipped their own tables; pre-apprenticeship CPL mechanisms recorded from Sam.


### SkyBridge — the gate nobody knew was a gate (2026-08-13, Session 148)

Wire Sierra to SkyPeak's 2,205 rows, check MAP Users contacts, experiment with local↔adoption alignment.
Two PRs (**#1150**, **#1151**), one migration, **cpl-chat v40 live**.
⭐ **`ccc_rec` was a RETRIEVAL GATE, not just a lossy summary.** It is derived from *adoptions*, and
`search_statewide_recommendations` required it non-null — so **38 never-adopted statewide credentials (36 carrying
75 published rec lines)** were **excluded from every credential route**, not merely ranked last. The whole
construction shelf MAP builds ahead of demand — the inverse of Sam's *prominent choices for adoption* ruling.
⭐ **Two bands, not one re-sorted list**: "N peers already articulate it" said of a zero-adopter credential
fabricates a route, so `ready_to_adopt` is slot-reserved and separately labeled.
⭐ **The shelf collapses to 32 distinct courses**, one of which (*Introduction to Construction Safety*) unlocks **12**.
⭐ **MAP Users was SOUND** — I expected the raw-string join bug; it wasn't there, and I said so rather than
manufacture a fix. Real findings: a personal Gmail first in Mission College's cascade, and a trailing-space
fragility caught before it fired.
⭐ **Then the alignment layer SHIPPED** (#1153/#1154/#1155, **v41**): peer articulations 9,413 · college courses
141,696 · one RPC returning both. Cerritos `WELD 214L` tops both FCAW recs, with Barstow's near-identical course as
corroboration. It needs TWO signals — Santa Ana mapped courses whose titles contain no "FCAW".
⚠️ **The first scorer ranked `ART 100 Introduction To World Art` third for a WELDING rec.** A plausible false
positive costs more than a missed match on a trust-building surface; content-token gate added.
Durable: `methodology-a-summary-field-can-be-a-retrieval-gate`, `methodology-two-signals-for-a-judgment-proposal`,
`methodology-an-unadopted-item-is-a-shelf-not-an-absence`, `methodology-a-false-positive-costs-more-than-a-miss`.
Story: `docs/sierra_credit_recs_lessons.md` · `docs/local_course_alignment_lessons.md` · handoff `docs/session_149_handoff.md`.

### Archived from §11 at the 2026-08-13 checkpoint (SkyRef)

Fully shipped with no open follow-up, moved out of the always-loaded file
per the "Completed rows archived" convention.

| Phase | What | Status |
|---|---|---|
| **Cred-Ref PR-5b/2** | Collision-resolution UX in the Credential Reference tab — "Confirm merge" affordance when a rename target collides with an existing credential key. | ✅ **DONE Session 107 (#698)** — Sam hit 6 collisions on 2026-07-08; shipped same-day: Save-time detect + confirm dialog → `unified_title_merge_confirm` row, pending-merges strip, dry-run `merges` lane, apply fold. His 6 await ✓ Confirm merge in the lane. |


### SkyTop — the answer that looked right (2026-08-13, Session 149)

Sam tested the alignment layer himself and sent the prose back. It read well; that is why the defect
survived three deploys. Two PRs (**#1161**, **#1162**), three migrations, **cpl-chat v43 → v44**.
⭐ **THE RPC WAS RIGHT AND THE ANSWER WAS WRONG** — five C-ID-confirmed matches (`AJ 102`·`103`·`101`·
`107`·`222`) rendered as *"⬜ check catalog"*. `per_rec` bounded **one side of a union** (3,807 peers vs
9 candidates), and peers were never resolved to the recommendation set, manufacturing **~34 phantom
rec groups** — and **a phantom empty group is indistinguishable from a real one**. 43→10 groups,
3,816→94 rows, 1→**6 of 6**. Cost: one peer college of 31.
⭐ **THE FALSE ZERO IS THE WORST ANSWER** — the Cerritos ironworker miss, carried three sessions, was
**three** defects: an abbreviating raw corpus with **no college-scoped curated route beside it**, a
matcher that never read **issuer/trainer** and failed on the plural, and the **narrowest probe budget
on the route reaching local data** — which dropped "iron", the subject of Sam's sentence. All 13 now
return; **three are reachable ONLY via issuer**. Not local color: **90%** of the catalog has an
issuer word absent from title+variants.
⚠️ **Sam's "closest match unless obviously wrong" was built, measured, WITHDRAWN** — `AUTO 160
Introduction to Automotive Electrical` for a *policing* rec. Not tunable: a rec with no candidate is
one where nothing shares a subject word. His request was right; the mechanism wasn't, and fixing the
phantom groups answered it.
⭐ **Sam's CR Reference ruling: C-ID is ONE factor, not the key** — match like the CCR (title, course
name and number, description, subject). Only **17%** of rec strings carry a C-ID.
Durable: `methodology-bound-both-sides-of-a-union`,
`methodology-a-grouping-key-must-come-from-the-authoritative-set`,
`methodology-search-the-awarding-body-not-just-the-name`.
Story: `docs/local_course_alignment_lessons.md` · `docs/sierra_credit_recs_lessons.md` · handoff
`docs/session_150_handoff.md`.

### SkyRunner — the gate that failed the case it was built for (2026-08-13, Session 151)

One PR (**#1174**). Both of Sam's queued items: the EACR filters fixed, the Common CR Reference scoped.
⭐ **THE DROPDOWNS EXISTED AND WERE INVISIBLE.** *"Filters need drop downs and they don't all work"* is
**one** defect: `.sw-interactive` sets `overflow:hidden` and the filter bar reuses the class, so eight
`position:absolute` dropdowns opened into a **~70px-tall clipped sliver**. Converting to native
`<select>` would have cost multi-select across 122 colleges to fix a CSS inheritance. Also
`Calbright College Non-Credit` — **88 rows**, no lookup entry, **fail-closed and silent**.
⭐ **I GUESSED A GATE, MEASURED ITS POPULATION, AND SHIPPED IT INTO THE SCOPE DOC BEFORE TESTING IT.**
The cartesian gate (43 pairs — a real number) **does not fire on the case it was invented for**:
`AJ 110` hits 8 of POST's 43 lines, reads non-cartesian, and *Physical Training* still merges into
*Intro to Administration of Justice*. **Measuring a gate's population is not testing the gate.**
⭐ **THE STRONGEST-LOOKING FACTOR IS THE SMALLEST RUNG.** CCR course identity produced every compelling
example (`HIST 130` folds *"The United States to 1877"* with *"United States History, 1550-1877"*) and
resolves **40 of 2,344 — 1.7%**. Compellingness of examples is not yield.
⚠️ **And I nearly killed it on a correct measurement of the wrong grain** — "zero real evidence" is true
*within* a credential while the good merges live *across* them.
⭐ **Consequence: automation reaches ~10%, so the deliverable is a CURATION WORKBENCH, not a merge
engine.** Worklist first, matcher last.
Story: `docs/common_cr_reference_lessons.md` · scope `docs/common_cr_reference_scope.md` ·
handoff `docs/session_152_handoff.md`.

### SkyCall — the ranking premise was backwards (2026-08-13, Session 152)

One PR (**#1176**). The Common CR Reference **worklist is live** — Sam's Priority 1, built
to the shape the scope measured rather than to the word "reference".
⭐ **SAM RULED SCOPE = GLOBAL + a split affordance.** 407 strings (17%) span >1 credential but
carry **45% of all articulation rows**; `Introduction to FCAW` is one recommendation under all
ten AWS/ASME credentials that carry it.
⭐ **THE HANDOFF'S RANKING PREMISE WAS BACKWARDS.** It said the value is where strings span the
most credentials. The 61-credential string is `3 hours in Elective Course Credits` — **one
college**, a placeholder. Ranking by credentials-spanned puts the corpus's *least* useful string
at #1; **collapse value (wordings × colleges)** sinks it to #174 with no special case.
⭐ **TWO BUGS, ONE SHAPE — two places normalizing the same text differently.** `screen_profile()`
judged the RAW topic while the key used the FOLDED one, so `Intro`/`Introduction` read as
different levels and the level screen **blocked the single highest-value merge in the corpus**.
Then my own test re-implemented the folds, missed `adv`, and failed two correct groups. The fix
was to **EMIT** the profile, not re-derive it — delete the duplicate, don't sync it.
⚠️ **Measuring a group's population is still not testing the gate** — the probe that "passed"
tested whether a key contained two words, not whether merging members disagreed.
Story: `docs/common_cr_reference_lessons.md` · handoff `docs/session_153_handoff.md`.

### Sky153 — the military lane is the opposite of what everyone assumed (2026-08-14, Session 153)

One PR. Handoff 153's Priority 2: the **military (ACE) CR Reference is SCOPED**, measured not assumed.
⭐ **SAM IS RIGHT THAT IT IS THE HARDEST LANE, AND RIGHT FOR A DIFFERENT REASON.** ACE is **already a
controlled vocabulary** — **93.4%** of (exhibit, units, topic) groups hold exactly ONE text, and the
6.6% residue is case and punctuation, not wording. So automation reaches **3× FURTHER** here than in
the freehand lane: **33.5%** of the vocabulary resolves with no judgment, against ~10%.
⭐ **THE STICKINESS IS VOLUME AND NAMING, NOT WORDING.** 6,725 topics vs 2,183, and a far flatter head —
**250 decisions for half the lane against 50**. The cascade fires on **2.6%** of ACE rows vs **94%** of
MAP-local: the mechanical proof behind "subject areas, not courses." The two lanes share only
**134 topics (5.9% of ACE rows)**, so the built CCRR does not cover this one.
⭐ **A RUNG THAT EXISTS ONLY HERE:** USMC skill-level tokens leaked into the topic text (**482 topics /
12,157 rows**); stripping the rank lands **306** on an existing base topic — `cpl_memory` row `f8` at
the text grain. Strip list still needs widening (`leadership ssgt and above`, spelled-out ranks).
⚠️ **THE FREEHAND LANE'S RANKING RULE DOES NOT TRANSFER** — spread is near-constant (top 200 topics
average **78 of 108** colleges), so collapse value ranks nothing. **Rank by rows.**
⚠️ **Containment stays SUGGESTION-ONLY** — `management` contains 21 narrower topics including
`project management`; none of them are `management`.
⭐ **POSTURE CHANGE: a third of this lane is an INGEST defect, not a curation decision** — 58 colleges
hold BOTH casings and **0** hold only one, so no human chose. A workbench would ask curators to do a
parser's job 767 times. Durable:
[`methodology-tell-a-parser-defect-from-a-people-defect`](docs/kb-notes/methodology-tell-a-parser-defect-from-a-people-defect.md).
Scope: `docs/military_cr_reference_scope.md` · handoff `docs/session_154_handoff.md`.

---

### SkyGate — the menu became data, and a long-red guard was finally read (2026-08-14, Session 156)

Five merges (**#1190**, **#1193**, **#1195**, **#1196** + the governance resolution). Sam tested
live throughout; every correction came from a real report.
⭐ **THE COBI SIDE MENU IS DATA** (`cobi_nav`) — order, grouping, labels, per-site mapping and a new
DISPLAY-ONLY audience filter, all drag-and-drop from the Admin tab. It **overlays** the code
defaults and never gates them: offline, HTTP error, malformed rows, a throwing `plan()`, a corrupt
cache and *a read that never resolves* each land on exactly the shipped menu, each with a test. A
nav that fails closed is a site with no navigation, so the fail-safe got more test surface than the
feature. `admin`/`dashboard` cannot be hidden and refuse to be dragged into a group — enforced in
CODE at three points, because the table is the thing being guarded. Seeded EMPTY.
⭐ **AN EMPTY READ IS ONLY EVIDENCE IF THE SET CANNOT BE EMPTY.** `team_access` is known non-empty so
`200 + []` proves "not a reviewer"; `sierra_rules` is seeded empty ON PURPOSE, so the same inference
would have told a reviewer they were locked out AND told a locked-out person Sierra has no rules.
[`methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty`](docs/kb-notes/methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty.md).
⭐ **SIERRA'S TEN BUILT-IN RULES ARE VISIBLE AND EDITABLE** — on **Sierra Training**, not Admin (Sam's
call). The pane renders GENERATED defaults with the overlay painted on top, and a test lifts the real
`assembleRules` and proves the display merge equals it across 40 overlay×context combinations.
⚠️ **FIVE WAYS A STATIC SCAN SAYS "NOTHING TO PROTECT"** — eager-loaded tabs, only the first
`loadScript` per tab, a trailing slash on `REST`, RPC-only tabs, and excluded VIEWS. On a
security-facing surface each is a claim, not a gap.
⚠️ **READ A RED GUARD'S RATIONALE BEFORE FIXING *OR* DEFENDING IT.** `governance.test.js` had been red
for two days; "pre-existing, not mine" and "it must stay red" were both defensible and both useless.
The assertion's own comment said it is a **noise** guard. **19 of 26 candidates were genuinely
resolvable** — 4 mapped, and 15 belonged to six previously-unrecorded decision rights (DR-13…DR-18),
including **the workplan itself, which had no named owner**. DR-16 then flagged itself stale, which
was a **detector bug** (`\b` cannot match before a dot, so `.github/...` read as missing). **90/90,
and all 218 suites green.**
Story: `docs/admin_tab_lessons.md` · ADR
[`adr-the-side-menu-as-an-overlay-over-code-defaults`](docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults.md)
· handoff `docs/session_157_handoff.md`.

---

### Sky157 — a door that was never there, and eight tabs with no input (2026-08-14, Session 157)

Two merges (**#1200**, **#1201**). Sam tested live throughout; every fix came from a real report.
⭐ **THE REVIEWER SIGN-IN WAS A POINTER AT A ROUTE THAT NO LONGER EXISTED.** Sam: *"I tried using the
magic link login on RACI tab but it only has the team phrase input now, so I can't edit the new Admin
tab."* `raci.js` still carried a **complete `signIn()` whose button had been removed** — no caller
anywhere — while `admin.js` told anyone signed-out to *"sign in with a magic link on the Team & RACI
tab."* Admin is reviewer-ONLY, so the phrase could never have opened it either: the single documented
way in was an instruction that could not be carried out, and **nothing failed**. Moved to **ℹ About**
on Sam's call (*"Since Admin supersedes RACI"*) — also structurally right, since the 🔒 masthead
control is site-scoped while a reviewer sign-in is personal identity. Admin mounts the same control
inline; RACI keeps the phrase.
⭐ **THEN MEASURED, NOT GUESSED.** 43 tables gate on a phrase, **26 on the READ**; of 18 tabs touching
one, **eight** had neither an input nor a mention of the header and **thirteen live strings across
five files** still sent people to Team & RACI. Where the gate is on the read, the tab does not look
locked — it looks **broken**. One shared `lockedBanner()` with a working input + a CI guard, because
a rule that depends on the next author remembering it fails on their first day.
⚠️ **MY OWN DETECTOR WAS WRONG TWICE, BOTH CAUGHT BY READING ITS OUTPUT** — 3 of 5 flagged tabs were
false (acting on them would have shipped three wrong banners), then it reported **clean while five
live instances sat in one file**, because the copy is split across concatenated string literals a
regex cannot cross.
⚠️ **A FAIL-SAFE THE TESTS CAUGHT:** without `team_phrase.js` loaded, the rewritten tabs rendered an
**empty** locked state — worse than the copy replaced.
**SkyCode, same day:** the noncredit CIP categories — a blanket `32.0111` rule shipped (#1192) and was
reverted (#1194) after ~20 minutes; **the TOP turned out not to be load-bearing** and a whole
TOP-correction project was unnecessary. See the §11 row and `docs/noncredit_cip_category_scope.md`.
Story: `docs/team_phrase_lessons.md` · `docs/cip_crosswalk_lessons.md` · handoff `docs/session_158_handoff.md`.

### SkyKey — one dead token wearing four costumes (2026-08-14/15, Session 158)

Four merges (**#1203**, **#1205**, **#1206**, plus #1204 held by Sam), one open (**#1207**). Sam tested live all
evening; every fix came from a real report and he diagnosed the last one himself.
⭐ **THE ADMIN SAVE HAD NEVER WORKED ONCE** — `cobi_nav` held **zero rows**. A bulk POST is one INSERT over the
**union** of the array's keys, so `audience` (NOT NULL, tab rows only) arrived NULL on every group row → 400. The
defect exists only ACROSS the array, so row-level tests and the mock all passed — and an overlay **seeded empty on
purpose** gives no signal that writes are failing.
⭐ **THREE MORE REPORTS WERE ONE EXPIRED TOKEN**, fixed with a keeper rather than a fourteenth copy.
⚠️ **SHIPPING THAT ALONE WOULD HAVE BEEN WORSE THAN THE BUG** — rotation + six cached refreshers = silent sign-out.
**Audit what a new component makes FREQUENT, not just whether it is correct.**
⚠️ **A PRIVACY GUARD HAD SILENTLY STOPPED GUARDING**, and **every detector written this run was wrong on first
writing** — all three caught by printing what they found instead of trusting the count.
Story: `docs/session_credentials_lessons.md` · handoff `docs/session_159_handoff.md`.


### Sky162 — the filter was answering a different question (2026-08-16, Session 162)

Four merges (**#1221**–**#1223**, plus sibling **#1224**) against Sam's four EACR questions. **224/224 green.**
⭐ **THE COLLEGE FILTER WAS 93.6% NOISE** and **the strong signal already existed, driving nothing** — the
prescriptive M-ID layer names the local course and no filter could reach it. Hence **three scopes, not Sam's
two-position toggle**: a binary would pool it with the TOP guesses, which is the conflation being fixed.
⭐ **THE EXPORTS WERE OUTSIDE THE LOOP I HAD JUST BUILT** — found by re-reading against Sam's *goal*, not my
diff. **A spreadsheet outlives the screen that produced it.**
⭐ **THE A11Y PASS FOUND MORE DEFECTS IN DAY-OLD WORK THAN IN INHERITED CODE** — four, all mine from hours
earlier. Where a native element carries the semantics, taking it deletes the whole error class.
⚠️ **`val()` GUARDS THE CHECK; THE DRIVER IS THE OTHER HALF.** Handoff 161 predicted this trap and prescribed
`val()`; the harness used it and still printed **zero checks** pre-fix, because the throw was in a driver
*between* checks. **The prescription was recorded at the wrong altitude** — mechanism, not principle.
⚠️ **The one red file on main was a stale `{0,900}` window**, not a defect — Sky160's own rename pushed the
target to 1,458 chars, and `cpl_memory` had recorded that class on 08-14 with nobody re-sweeping.
Story: `docs/eacr_scope_lessons.md` · durable [`methodology-a-filter-and-what-justifies-it-must-share-one-source`](docs/kb-notes/methodology-a-filter-and-what-justifies-it-must-share-one-source.md) · [`methodology-a-partial-aria-pattern-is-worse-than-none`](docs/kb-notes/methodology-a-partial-aria-pattern-is-worse-than-none.md) · handoff `docs/session_163_handoff.md`.


### Sky163 — the opportunity number cannot be what the record allows (2026-08-17, Session 163)

One merge (**#1226**) — the generator half of the CER Adoption Matrix sub-tab Sam scoped. **40 checks, 31 fail pre-fix.**
⭐ **THE HEADLINE FINDING KILLED THE OBVIOUS DESIGN.** Sam asked for "possible CR units" in brown for non-adopters.
**83% of adoptions are PARTIAL** (median **3.07 of 9.26** lines) and **no college has ever reached the line total** —
AP Biology carries 36 units where the median adopter gets **4** and the best in the state gets 12. The natural number
would have promised ~3× the strongest peer, **in a column that leaves as a CSV**. Brown is the **peer benchmark**.
⭐ **THE NATURAL UNITS SOURCE WAS A LOSSY RECONSTRUCTION** — `chatbox_peer_articulations` covers **32.5%** of adoption
pairs because it JOINS two half-sources; the raw MAP row carries college+course+rec **on one line** and the payload was
discarding it. Shipping on the reconstruction would have rendered **5,502 real adoptions as opportunities**.
⭐ **SAM'S SANDBOX RULING FIXED A LIVE PUBLIC NUMBER** — `CA MAP INITIATIVE COLLEGE` published **7 adopters on
California Real Estate Broker License where the truth is 6**. Keyed on `entity_kind`, not the name.
⚠️ **A 118-COLUMN NUMERIC GRID IS ARITHMETICALLY IMPOSSIBLE** (~3,500px, ~2× a desktop) — say so with the measurement
rather than building it and discovering it.
⚠️ **The short-name gap was already solved in the repo** — 19 of 122 spellings had none; SkyLink's committed crosswalk
resolved **15**, taking fallbacks to zero. Fourth session running that the best catch was a thing already committed.
Story: `docs/eacr_scope_lessons.md` · durable [`methodology-an-opportunity-figure-must-be-what-peers-achieved`](docs/kb-notes/methodology-an-opportunity-figure-must-be-what-peers-achieved.md) · handoff `docs/session_164_handoff.md`.

### Sky165 — the spec survived, the code did not (2026-08-17, Session 165)

Session 164 built this view and **never pushed it** — no branch, no PR, no stash. What survived was the
handoff, the `_expected_axis` tripwire, four `cpl_memory` rulings and the published payload; that was enough to
rebuild to the same measured numbers in one sitting. **The handoff discipline is what made a lost session
survivable**, and the parts that paid were the checkable ones: expected counts, rulings recorded as rulings,
figures stated with their measurement.
Two merges — **#1229** (the matrix view + the roster fold) and the test-bound rescope. **62 checks, 49 fail pre-fix.**
⭐ **A FOLD AT THE LABEL LAYER IS NOT A FOLD** — the axis was 119 where the tripwire said 118, and the duplicate
was hidden by the very resolver every consumer counted through. See the EACR row.
⚠️ **Two neighbouring tests were BOUNDS, not guards** — "exactly two sub-tabs" and an ArrowRight wrap driven from
`tabs()[1]`, which only wraps on a two-tab bar. The handler was correct throughout. Third instance of
`a-test-bound-rots-when-the-code-legitimately-changes` in this workstream: **assume any count-shaped assertion is one.**
Story: `docs/eacr_scope_lessons.md` · durable [`methodology-a-fold-at-the-label-layer-is-not-a-fold`](docs/kb-notes/methodology-a-fold-at-the-label-layer-is-not-a-fold.md) · handoff `docs/session_166_handoff.md`.

## docs/INDEX.md update history — trimmed 2026-08-19 (Sky169)

Moved out of `docs/INDEX.md` to keep that file's history list at ~8 bullets (it is flagged `oversized_doc`). Newest first.

- **2026-08-13 (latest)** — SkyRef: **one report, a third of the system** (#1164–#1167, **cpl-chat v44 → v46**). Sam filed one line — *"Wrong contact information for RCC"* — and the right move was not to fix RCC but to ask how many disagree. ⭐ **A copy with no refresh path is a fossil**: Sierra read a contacts blob written **2026-06-25** that **nothing writes** (`sync_map_users.py` writes the authoritative table and only *reads* the profiles one). **41 of 122 colleges got a wrong email, 13 more got silence, 50 agreed.** Re-seeding would make a fresher fossil — the CONSUMER changed. Reading the authority is harder than reading the flattened copy: trailing spaces in two real college names, 22 fields holding several people, one address with **no TLD**. ⭐ **Three ironworker reports were three complaints** — the newest asked for the COURSES, and COLLEGE·CRED was the only credential route never fetching them. ⭐ **Silent failure was the theme**: the Training hand-off typed into a **hidden pane** (a module-level `inputEl` re-pointed by a second mount), burned its own retry, and ate text selections; `copyText` passed an **empty rejection handler** to an API that rejects routinely. ⭐ **Sam read the cascade correctly** — the assistant WAS already promoted; the chip said *what*, not *why*. Curator contact proposals are now data, not hardcoded JS. 3 new KB notes.
- **2026-08-13 (SkyTop)** — SkyTop: **the answer looked right** (#1161, #1162, **cpl-chat v43 → v44**). Sam pasted a live POST × Cerritos answer telling faculty to *"check your catalog"* for **five** recommendations whose courses Cerritos already teaches and the RPC was returning correctly. The loss was **between the RPC and the prose** — both verified clean alone. ⭐ **`per_rec` bounded ONE side of a union**: 3,807 peer rows against 9 candidates, and the model summarized what dominated. ⭐ **Peers were never resolved to the recommendation set**, so POST's TEN became **43 wordings** and ~34 **phantom recommendation groups** each honestly reporting "no match" — *a phantom empty group is indistinguishable from a real one*. Fixed: 43→10 groups, 3,816→94 rows, **1→6 of 6** C-ID matches, for the cost of one peer college of 31. ⭐ **The Cerritos ironworker false zero — carried three sessions — was THREE defects**: an abbreviating raw corpus with no college-scoped curated route beside it, a matcher that never read **issuer/trainer** and failed on plurals, and the **narrowest probe budget on the route reaching local data**, which dropped "iron" itself. All 13 return; three only via issuer. **90%** of the catalog has an issuer word absent from title+variants. ⚠️ Sam's "closest match unless obviously wrong" was built, measured and **withdrawn** — `AUTO 160 Introduction to Automotive Electrical` for a *policing* rec. ⭐ Sam's ruling: a **Common CR Reference** matches like the CCR — **C-ID is one factor, not the key** (only 17% of rec strings carry one). 3 new KB notes.
- **2026-08-13 (ladder)** — SkyBridge: **Sam's alignment ladder — C-ID first, then title, then best-aligned** (#1158, **cpl-chat v42**). The scorer **never read the `cid` column**, so Sierra told faculty to *"look for an AJ 101 or equivalent"* while AJ 101 sat in the table carrying that exact C-ID. **6 of POST's 8 distinct C-IDs match a Cerritos course exactly**; 16,067 courses at 112 colleges carry one. Only the best rung renders — which also removed `Community Symphonic Band` and `Foundational Concepts of Nursing` without any threshold tuning. ⚠️ A C-ID match whose NAMES diverge is **flagged, never suppressed** (POST's AJ 110 repeat). 1 new KB note.
- **2026-08-13 (late)** — SkyBridge: **military vs non-military CR bucketing** recorded from Sam. A JST lands a few to *scores* of ACE-reviewed CRs per service member (the whole transcript arrives at once); a non-military exhibit lands 1–2. Same lifecycle, so an undifferentiated "awaiting action" total is **98.8% military** — measured: military 432,693 CRs / 1,040,447 units at 17.4 per student, non-military 3,305 / 10,698 at 3.8. "A million units awaiting action" describes a college's veteran population rather than its workload, and **hides the tractable 10,698-unit non-military backlog entirely**. ⚠️ Bucketing is **not** discounting, and raw inert volume never means "behind". ⚠️ Two classifier traps found: `military_credits` is an applied AMOUNT (zero on 84% of rows), and `Credit for Basic Military Service` rows carry no ACE exhibit code. 1 new KB note.

## Archived INDEX update history
- 2026-10-20 (side session beside S438, opened by Sam): the funding page asks for the view first (All Institutions / My Institution), then the college or district, and the Funding outcomes cards follow it (#2293); the funding lane and lessons compacted under budget; privacy UI pass clean; handoff 439 gains a section; no KB note.
- 2026-10-20 (S438 SkySumac, opened by Sam): the Annual Workplan Goals table without its Total column, centered, each row's details folded, gray borders only, links to the Activity cards (#2291, live after run 619); Grok steps given, the reader parked on the district card; handoff 439 (SkySaltbush); no KB note.
- 2026-10-19 (S422 SkyWillow, the routine): San Joaquin Delta's three scorer readings, 154 to 195 of 202 live rows passing (#2250); Taft's two local GE patterns, no step (#2249); the Sierra Training UI pass (#2251); lessons S422, handoff 423.
- 2026-10-19 (S420 SkyTanoak, hand-opened): Cañada's re-read landed (#2244: 26 moved pages re-extracted, 8 loaded, 17 replaced, display build 3aa52b4afcb6); the CPL News UI pass (#2243); a Jev calibration sitting over a college's failing records (`kb/_jev_harvest.py`, #2245) and the xAI smoke for the second reader's key; Open Asks Sheet 97 asked and answered (Build with Grok, 03:11Z); KB note `methodology-a-harvests-tail-needs-a-different-instrument`.
- 2026-10-17 (S401 SkyManzanita, Sam's session): five catalog-reader faults read from the hosts' own outlines (#2177 curriQunet retry, #2178 Butte's two title forms, #2179 and #2183 the eLumen menu walk, #2182 Las Positas's comma); the eLumen wave, six colleges loaded, build `d4ac5009f5aa` applied (#2181); Lake Tahoe and Marin extracted; handoff 402 names SkyToyon.
- 2026-10-10 (S356 SkyThicket): Sam's three rulings (apply display build 5be53871ebf4; read Approved programs; a standing go for each display build after a college load); the college workflow's display job applies a receipt from the runner, verified by one combined hash (5be53871ebf4 on 292, 153ead0ce992 on 605); Mt. San Antonio read and loaded (313 records); the Approved programs loaded at both colleges (+33, +70) and `ee814befc65d` on 700; Team & RACI's first UI pass (#1957); KB note `methodology-a-receipt-too-large-for-the-connector-applies-from-the-runner`; handoff 357.

- 2026-10-07 (S340 SkyLedger): Santa Monica Barbering A.S. 43767's record (extraction 37548804006) in `records_maps/`; CPL Pathways places each course in its read map's term (display build 9f60f746ea49); `plan()` counts a course once; both dated reads cover seven colleges; open-asks sheet 46 (#1894; vault #264); KB note `methodology-a-postgres-md5-proves-a-transcribed-jsonb-copy` gains the per-row refresh
- 2026-10-06 (S339 SkyReel): the Noncredit Summit film v2 (#1891: Sarah Explains, unnamed; Sam's greeting; $7 million ongoing; four grants with Calbright; 30,795; Nadia an industry certificate; brighter portraits; MP4s to Drive, never the repo; vault #262); the harvest capture follows a procedure's catalog step, and Santa Monica's first procedure record reads Barbering A.S. from its full-catalog PDF (#1892); handoff 340 (SkyLedger).
- **2026-08-14 (Session 157, Sky157 + SkyCode)** — **a door that was never there.** `raci.js` carried a complete `signIn()` **whose button had been removed** — no caller anywhere — while `admin.js` told anyone signed-out to *"sign in with a magic link on the Team & RACI tab"*; Admin is reviewer-ONLY, so the phrase could never have opened it either. The one documented way in **could not be carried out, and nothing failed**. Moved to **ℹ About** (Sam: *"Since Admin supersedes RACI"*). ⭐ Then measured rather than guessed: **43 tables gate on a phrase, 26 on the READ**; of 18 tabs touching one, **eight** had neither an input nor a mention of the header and **13 live strings across 5 files** still sent people to RACI — where the gate is on the read, such a tab does not look locked, it looks **broken**. One shared `lockedBanner()` + a CI guard. ⚠️ **The guard was wrong twice**: 3 of 5 flagged tabs were false positives, then it reported clean while **5 live instances sat in one file** (copy split across concatenated literals a regex cannot cross). **SkyCode, same day:** noncredit CIP categories — a blanket `32.0111` rule shipped (#1192) and was reverted (#1194); **the TOP is not load-bearing**, and 1,789 of 1,796 'wrong' codes were the *secondary* CIP all along. 3 new KB notes. Housekeeping: `cip_crosswalk_lessons.md` 155 KB → 30 KB (archive split); both flagged `stacked_roadmap_cell` §11 cells compacted (5,379 → 2,300 and 4,600 → 2,876).- **2026-08-13 (evening)** — SkyRef, part 2: **the gap list was 83% robot** (#1169–#1171, cron to daily). Sam asked to bulk-clear "questions Sierra struggled with"; measuring first changed the answer — **78 rows, 65 of them `session_id='smoke-ci'`, only 13 real**. ⭐ It also dissolved the duplicate-pair mystery: the smoke suite asks each question **twice** and one probe deliberately carries no college context, so **43% of punts have a SUCCESSFUL twin within 45s** — nothing was flapping. The theme strip was reporting the robot's vocabulary as a pattern in what people want. ⭐ **Advised AGAINST merging the two panes** (a human report and a heuristic suspicion are different objects) but aligned their behavior; **group-by-question was chosen and deliberately not built** once the 83% landed. ⭐ **The suppress field Sam proposed for MAP's sandbox orgs already existed** — `map_colleges.entity_kind` tagged all eight `test` and `college_briefing.js` never read it. Third time in one day that the right value existed and the consumer did not ask. Roster sync **monthly → daily**, since Sierra reads contacts live now. 0 new KB notes.

---

### Sky169 — what the college already teaches, and nobody claimed (2026-08-19, Session 169)

**Merged #1243.** Ashley, continuing her August SJCOE crosswalk, for a meeting with San Joaquin Delta.
⭐ **A college-scoped ask is a different instrument, not a flag on the statewide engine** — which
deliberately does not privilege the in-county college, and whose best answer (*"some college offers
this"*, a fact) is not this one's (*"this college teaches it AND the exhibit exists AND nobody joined
them up"*, a task). ⭐ **Keeping "teaches it" and "exhibit exists" in SEPARATE columns IS the
deliverable**: crossed, they give **42 adopt-now** rows needing neither curriculum nor exhibit — against
**0 of 139 articulated at Delta today**. ⭐ Delta holds curriculum for the utility/hydro cluster run 1
found had **no CPL anywhere in California** (6 rows, first-in-state) — but **not lineworker**, which is
line work, not the substation/plant electrical Delta teaches. ⚠️ **A capability can be invisible to a
program search** (`A CON 87A–90D` is a plumbing apprenticeship under no plumbing-named program).
⚠️ **Shared prose over-claims on the rows it was not written for** — `check_absence_claims()` caught 6
rows asserting "no CPL anywhere" against exhibits that exist; in a document going into a room with a
college, one over-claim discredits the other 138. Story: `docs/delta_college_crosswalk_lessons.md` ·
handoff `docs/session_170_handoff.md`.

### SkyFetch — the reports were already there, and the probe lied about it (2026-08-19, Session 170)

**Merged #1246, #1247, #1248.** Sam: *"I want to see the new MAP Custom Reports supabase data."*
⭐ **All three are served by the API the cron already pulls** — `dataCount` matching the builder exactly — so
wiring was config, and the ITPI daily-push offer is declinable on the merits. `REQUEST_PAYLOAD` is now 10 datasets.
⭐ **Two of the three are OUR OWN SPEC coming back** (`map_dataset_sql_for_malone.md` Dataset A = the 13-column
report = `map_college_cr_unit`), so the job was a reconciliation; all three deltas run one way and are our
staleness resolving. ⚠️ **§11 had said catalog year was new — it was 100% filled all along** at student grain.
⚠️ **THE PROBE REPORTED "NONE EXPOSED" AND WAS WRONG.** `columnName: []` had stopped enumerating and now 500s on
known-good views, so the validity test could never fire for ANY view — only a positive control caught it, and
without one Sam would have been sent to Pedro on a broken instrument. It still leaked the truth: valid names 500,
invalid names 400, and the single 500 was the real student view — printed as a rejection and summarized away.
⭐ **Pedro's salt-hash assurance was corroborated, not just accepted** — the spec's own warning ("the ID space is
small enough to enumerate") run as an experiment; 5M decimals + 8 variants ≠ a sampled hash.
Story: `docs/map_custom_reports_lessons.md` · handoff `docs/session_171_handoff.md`.

### SkyLoad — the load, and then Sam took the human out of it (2026-08-19, Session 171)

**Merged #1251–#1254.** Sam gave the three field definitions, then: *"This will run in the daily cron so just making sure I don't have to do a staging to live approval every day."*
⭐ **The value is two NEW DIMENSIONS, not freshness** — `Status` (approval stage) and `CPLPlanStatus` (lifecycle checks) were carried by no table we held.
⭐ **Removing the human meant replacing what he was providing, not deleting it** — one transaction, contents-replace so the **RLS trap stops existing as a step**, aggregates rebuilt inside the same transaction, and gates that fail closed. **G5 was tested by breaking it**: it raised, live stayed byte-identical, the junk row rolled back too.
⚠️ **The gate then caught two real contract mismatches in my own loader** — `""` emitted as NULL where live stores `""` (~200k rows), and a NOT NULL violation. **Zero-fill is PER TABLE**: the two live tables genuinely disagree, so filling the student side would be the same defect reversed.
⚠️ **A one-directional TOTAL does not license a swap** — +3.07%, yet 2 of 112 colleges fell. Cause: a **catalog-year roll-forward**, so the axis is **mutable**.
⚠️ **`Status` is 91.2% BLANK and led by `Implementation`** — it cannot facet the backlog. ⚠️ **The Transcribed CHECK is 3.2× the UNITS and strictly contains them** — needs Sam's ruling.
⚠️ **A client timeout mid-promotion proved the atomicity** rather than breaking it; the fix was TRUNCATE over DELETE and a statement timeout on the FUNCTION, since the runner inherits the role setting, not the client's patience.
Story: `docs/map_custom_reports_lessons.md` · runbook `docs/map_custom_report_load.md` · handoff `docs/session_172_handoff.md`.

## docs/INDEX.md update-history entries retired 2026-08-20

- **2026-08-16 (Session 162, Sky162)** — **the filter was answering a different question** (#1221–#1223, plus sibling #1224). Sam suspected the EACR College filter matched *adopted or could adopt*; he was right, and the ratio is the argument: **93.6% of College-filter hits were not adoptions** — Pasadena City College returned **1,790 cards against 44 adopted**, and the median card carries **1 adopter and 41 potentials**, because `potential` is *program-of-study under the same TOP code* (Rule 7, as a primary determination). ⭐ **The strong signal already existed and drove nothing** — the prescriptive M-ID layer (739 titles / 4,972 pairs, 25× tighter) **names the local course** and no filter could reach it, which is why the answer is **three scopes rather than Sam's two-position toggle**: a binary would pool it with the TOP guesses, the exact conflation being fixed. ⭐ **The exports were outside the loop I had just built** — found by re-reading against Sam's *goal* rather than my diff; CSV/JSON/Word still emitted the 41-college list, and **a spreadsheet outlives the screen that produced it**. ✅ CER wiring sound (**1,745/1,745** titles resolve); 8 credentials had been rendering twice under a **blank-issuer** twin (*unknown is not different*), and **5,135 `exhibit_ids` were in the payload and rendered nowhere**. ⭐ **The a11y pass found more defects in day-old work than in inherited code** — a half-declared ARIA tab pattern, a scope control exposing no selected state, a **color-only** WCAG 1.4.1 failure. ⚠️ **`val()` guards the check; the driver is the other half** — handoff 161 predicted the harness trap and prescribed `val()`, the harness used it, and it still printed **zero checks** pre-fix: the throw was in a driver *between* checks. The prescription had been recorded as a mechanism, not a principle. ⚠️ The one red file on main was a **stale `{0,900}` window** from Sky160's own rename, not a defect. **All 224 test files pass.** 2 new KB notes, 1 updated.
- **2026-08-15 (Session 158, SkyKey)** — **one dead token wearing four costumes.** Sam reported six things live; four were real and **three were the same defect**. ⭐ **The Admin Save had NEVER worked** — `cobi_nav` held **zero rows**: a bulk POST is one INSERT over the **union** of the array's keys, so `audience` (NOT NULL, on tab rows only) arrived NULL on every group row → 400. The defect exists only ACROSS the array, so every row-level test and the jsdom mock passed, and an overlay **seeded empty on purpose** gives no signal that writes are failing. ⭐ **Sierra "not signed in", CR Reference "could not read" and the 400's misleading advice were one expired token** — a Supabase access token lives ~1h and **13 of 26 modules check only its SHAPE**; re-signing in "fixes" it, which is what hides the cause. Fixed with a **keeper** (`cpl_session.js`) rather than a fourteenth copy, so the 13 benefit untouched. ⚠️ **Shipping that alone would have been worse than the bug**: refresh tokens rotate, six modules renew from a cached session and three drop it on any failure = silent sign-out mid-edit; `credential_reference.js` already carried the fix *and the reason* and nine files did not. ⚠️ **A privacy guard had silently stopped guarding** (a negative pinned to a coordinator's name that left the data). ⚠️ **Every detector written this run was wrong on first writing**, all three caught by printing what they found. Sam diagnosed the last one himself: `sessionStorage` is **per browser tab**, so the magic link's new tab left his working tab signed out. 3 new KB notes.

---

### SkySwap — the cron would have failed tonight, one step short of the gates (2026-08-19, Session 172)

**Merged #1262.** The queue said *watch the first unattended 13:40 UTC run*; the most recent dispatch had already **failed**.
⚠️ **Not the promotion — the step that FILLS staging**, which no gate is downstream of. Emptying `stg_map_student_credit` by PostgREST `DELETE` writes 591,820 dead tuples: Postgres logged `canceling statement due to statement timeout`, the runner saw a bare `HTTP 500`.
⭐ **The fix already existed a few lines away, written the same day** — `map_promote_custom_reports()` swaps live with TRUNCATE and says why in its own comments. The staging half kept the DELETE. *A lesson recorded inside one function is not a lesson applied to the pipeline.*
⚠️ **It would have failed EVERY night**: runs 1–3 met a small staging table, run 4 met a full one, and staging is full after every success. **A manual run tests a state the schedule never sees again.**
Fixed with `map_clear_custom_report_staging()` — **5.3 s** on the same 802,825 rows — which takes **NO ARGUMENT**, so the pipeline's one destructive call has no table name to get wrong (the `assert table.startswith("stg_")` it replaces left the student-grain table one bad string away). Three mutations caught; applied and run against full staging before merge, live untouched.
🔒 **AND THE ACL, WHICH OUTRANKS THE OUTAGE.** Writing the new function meant writing the same `revoke ... from anon, authenticated` line the workstream already used; **checking it instead of trusting it** showed `proacl {=X/postgres,...}` — the empty grantee is **PUBLIC**, anon inherits through it, and the revoke protects **nothing**. **SIX security-definer functions were callable with the PUBLISHED anon key**, including the promotion that truncates both live tables. ⭐ The correct idiom was **already in this repo twice** (`cpl_funding_optin_review`, `gr_pass_check` name `public`) — two spellings of one intent, one silently inert, so it is a **lint**: `tests/supabase_function_grants_test.py`, wired to js-tests. ⚠️ **`service_role`'s EXPLICIT grant was verified on all six BEFORE revoking PUBLIC** — had its privilege come only from PUBLIC, the same statement would have broken the cron. Now anon `false` / service_role `true` on all six.
Durable: [`methodology-a-gate-cannot-protect-the-step-that-fills-it`](docs/kb-notes/methodology-a-gate-cannot-protect-the-step-that-fills-it.md) · [`methodology-revoking-from-anon-does-not-remove-the-public-grant`](docs/kb-notes/methodology-revoking-from-anon-does-not-remove-the-public-grant.md) · story `docs/map_custom_reports_lessons.md` · handoff `docs/session_173_handoff.md`.

---

### SkyCurate — the second door, and an audit that outfound the feature (2026-08-20, Session 173)

**Merged #1269.** Sam: *"hide the Curate button so the public doesn't see it…but I would like it to be available somehow for the MAP team."* Then, mid-run: *"make sure everything is accessible and mobile friendly."*
⭐ **Hiding a control also hides the way to GET access** — the button *was* the sign-in entry point, so `isReviewer()` alone strands a curator with no session. Two doors: the shared session keeper (which also fixed a latent same-tab-only gap) plus `?curate=1`, stripped from the URL on read.
⚠️ **The button was never the gate** — RLS was, and the JS is public, so the reveal is discoverable by design. Written into the module so nobody starts leaning on it.
⭐ **The audit found four defects that nine committed jsdom suites could not see**, because jsdom has no layout engine. Worst: the statewide grid needed 368px on a 360px phone — name printed over its own figure and **"Could adopt" was clipped out of existence**. **A page that silently drops a column looks complete.**
⚠️ **Fixing the heading levels broke the Contents heading and every test still passed** — a **pixel diff** caught it. A change claiming "semantics moved, appearance did not" is only checkable in pixels.
⚠️ **Two of my own new checks were wrong before the code was** (an x-axis-only overlap test; an unanchored `color:` regex matching `outline-color`). **When a new check fails, suspect the check.**
Durable: [`hiding-a-control-also-hides-the-way-in`](docs/kb-notes/methodology-hiding-a-control-also-hides-the-way-in.md) · [`verify-with-the-instrument-that-can-see-the-defect`](docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect.md) · story `docs/fact_sheet_lessons.md` · handoff `docs/session_174_handoff.md`.

### SkySort — a reorder that rewrites nothing, and the join it would have broken (2026-08-20, Session 173)

**PR #1268.** Sam: *"moving Priority 3 to the Priority 1 position … rather than copying and pasting everything for both years … drag and drop them into position"*, rename **Price factor → Funding factor**, and auto-copy Year 1 → Year 2 on front-load. *"Push back and better alternatives always welcome."*
⭐ **A REORDER MUST NOT REWRITE THE CONFIG.** Permuting the stored priorities has to enumerate every field, and a field it forgets silently re-points a priority at a different identity's baked default — **the live overrides are PARTIAL** (Scenario 2 sets `metric`/`share` on two and neither `factor` nor `title`) and `yearPriorities[slot]` is an **object keyed by index string**, not an array. Shipped as a **permutation stored beside the config**; every allocation, cap and target comes back byte-identical.
⭐ **ONE TRANSLATION SEAM, never per-emitter** — `prioField`/`prioMetricSource`/`prioUnit`/`setPrio` + `priorities()`. Above it, DISPLAY index; below it, SOURCE index. The failure mode is an edit landing on the wrong priority, and a per-call-site translation is a call site somebody misses. `label` is positional, `key`/`src` are the identity.
⭐ **MY COLLEGE JOINED THE MONEY TO THE ADVICE BY POSITION, AND ITS GUARD COULD NOT SEE IT** — `prioritiesAlign()` gates on COUNT, and three still equals three. Now an identity join. ⚠️ **`buildBriefing()` was DROPPING the key** in its remap, so the first identity join resolved to nothing and the strategies left the funding box silently — caught by that file's own Part-P assertions.
⭐ **PUSHED BACK ON "copy on front-load"**: it overwrites Year 2 with no undo as a side effect of a *cash-timing* control, is a no-op for Scenario 1 and a silent policy edit for Scenario 2, and front-load is where it matters LEAST (Year 2 is already carryover, its metrics never scored). Shipped a **non-destructive MIRROR** + an explicit **Copy Year 1 → Year 2** that asks first. **Default OFF.**
⚠️ **The order is WINDOW-LEVEL** — Sam's own 2026-08-09 ruling (`cpl_memory` `funding-years-are-mirrored-two-year-project`) decides it; per-year would make P1/P2/P3 mean different things in different years and cost the second drag.
Durable: [`methodology-reorder-by-permutation-not-by-rewriting-the-config`](docs/kb-notes/methodology-reorder-by-permutation-not-by-rewriting-the-config.md) · [`methodology-a-count-gate-cannot-see-a-reorder`](docs/kb-notes/methodology-a-count-gate-cannot-see-a-reorder.md) · story `docs/cpl_funding_lessons.md` · handoff `docs/session_174_handoff.md`.

## Session narratives rotated out of CLAUDE.md §11 (2026-08-21)

Moved verbatim by SkyAsk (Session 177) — `CLAUDE.md` sits at 2.22x its
docs-audit budget and §11 holds at most two inline narratives, so the older
one rotates here whenever a new one lands.

### Sky175 — a phone lost the whole panel, and one check could not fail (2026-08-20, Session 175)

**Merged #1271.** Sam: *"make sure everything is fully wired in from that session, and do a similar accessibility and mobile friendly check on Sierra AI and the Veteran Sprint MAP."*
⭐ **The Veteran map's `#side{display:none}` below 760px deleted the Details pane, both directories, both searches and every CPL landing-page link on any phone** — tapping a college still rendered its detail into a panel that was not on the page. The map remained, so nothing looked broken.
⚠️ **The map's whole content was keyboard-unreachable** (an SVG `<g>` is not focusable; the rows were `li.onclick`). Sierra: the **beta disclaimer at 2.80:1** — the sentence telling a student to confirm with their coordinator was the least legible text on the page — plus no `prefers-reduced-motion`, a false `radiogroup`, and a log whose keyboard reachability **fell as its content grew**.
⭐ **Chromium 127+ makes an overflowing scroller focusable with NO tabindex, so both behavioral checks passed against the UNFIXED page.** The measuring browser can hide the defect: assert the attribute, label the behavior a regression guard. Three more of my own checks were wrong before the code was.
⚠️ **Handoff 174's two open items were closed by EXERCISE**, not reading: the Curate reveal clicked end to end over http:// (10/10, both doors).
Durable: [`the-measuring-browser-can-hide-the-defect`](docs/kb-notes/methodology-the-measuring-browser-can-hide-the-defect.md) · story `docs/public_pages_a11y_lessons.md` · handoff `docs/session_176_handoff.md`.

## INDEX update-history entries rotated out (2026-08-21)

- **2026-08-17 (Session 167, Sky167)** — **the key was a ghost** (#1232/#1233/#1234). Sam: *"all the colleges are coming up blank on this."* `getSession()` on My College read `localStorage.cpl_team_session` — **a string occurring exactly once in the repo, as that read**. Nothing has ever written it, so neither the reviewer session (`cpl_sb`, kept fresh by the #1205 keeper) nor the team phrase reached the server, and **an RLS-filtered SELECT answers 200 + `[]`** — four gated tables returned empty arrays indistinguishable from *"this college has nothing"*, on every college, while the public reads beside them kept the tab looking healthy. **109 of 120 non-test colleges had a summary row the whole time.** ⚠️ **The 232-check suite signed in via the broken path and stubbed `fetch`** — it exercised the defect every run and asserted nothing about it; the new guard asserts HEADERS, because no rendered state distinguishes the bug from the truth. Then Sam's seven asks: the tab opens on a **scope question**, Sierra is a **collapsible section expanded by default**, Collapse all closes her too (his ruling), and the briefing is a **docx that reads the rendered DOM** so it cannot drift from the screen and inherits the k=10 suppression by construction. ⭐ **A roll-up must not leak a withheld college** — district and statewide sum unsuppressed rows only, or `total − visible` hands back the withheld figure. ⚠️ **Two of five scopes ship disabled with their reason**: SWP region and ASCCC region exist nowhere here, and the region data we DO hold (`college_geo`) is a ~10-way *proximity* map — SWP has 8 consortia, ASCCC has 4 areas — so a test pins that it stays unwired. ⚠️ **Two bugs the tests caught, both introduced by this work**: `finish()` hoisted the first `.cb-bar` in document order (a positional selector is a bound on authoring order), and the briefing extractor was **empty for two of the three scopes**. Sierra also aligned across all three surfaces she is mounted on. 3 new KB notes; `CLAUDE.md` net **−8.6 KB** (two finished rows + Sky165's narrative moved out).
- **2026-08-17 (Sky165)** — CER Adoption Matrix VIEW shipped (#1229): 434 credentials x 118 colleges, 17.0% inked, Sam's four rulings each carried by a check. Found and folded a college that was two columns (the `CaÃ±ada`/`Cañada` mojibake pair). Two neighbouring test bounds rescoped to properties. New KB note `methodology-a-fold-at-the-label-layer-is-not-a-fold`; new handoff `session_166_handoff.md`; Sky162's narrative archived out of `CLAUDE.md`. Session 164's work was lost unpushed — its `cpl_memory` rows survived and two are now corroborated.
- **2026-08-17 (Sky163)** — CER Adoption Matrix scoped with Sam and the generator half shipped (#1226): sandbox colleges dropped, duplicate spellings folded, per-college CR units emitted. New KB note `methodology-an-opportunity-figure-must-be-what-peers-achieved`; new handoff `session_164_handoff.md`; Sky160's narrative archived out of `CLAUDE.md`.

### SkyAsk — a page that answered before it asked, and two lists that should have been one (2026-08-21, Session 177)

**Merged #1274.** Sam's six-point pass on My College. ⭐ **The tab opened on Cabrillo College because the remembered choice was restored into state** — so a second reader silently got someone else's college. It is a **named shortcut** now; the tab always asks.
⭐ **The "narrow paragraphs beside full-width content" was not the measure caps.** Both HTMLs ship the pane with an **inline `text-align:center`** for its loading placeholder, and inline out-ranks the `text-align:left` the module injects — every capped paragraph rendered *centerd inside a left-anchored box*. Cleared at render.
⭐ **TWO question clusters with the role picker BETWEEN them**, and clicking the upper one printed *"tap who you are above"* at chips that were below. One cluster now, in Sierra's own slot under the chips — which also retires a generic starter that names **Riverside City College** on every college's page.
⚠️ **`sierra_guidance` is a ZERO-SUM BUDGET at 10 rows and nothing says so where it bites.** Sam's snapshot instruction was the 11th, and an 11th silently stops the OLDEST reaching Sierra — the naming rule. The tab's headline reads *"3,588 of 9,000 characters (40%)"*, which looks healthy; the **row cap** binds. Sam retired the two 2026-08-12 rules now handled in retrieval, and it is live at 9.
⭐ **The statewide column in Sierra's snapshot cannot be repaired, only removed** — she holds totals and a count, so the only comparator she can compute is an average, and the average runs **2–3x the median** on every measure.
Durable: [`an-inline-placeholder-style-outranks-the-css-you-inject`](docs/kb-notes/methodology-an-inline-placeholder-style-outranks-the-css-you-inject.md) · [`a-capped-instruction-list-is-a-zero-sum-budget`](docs/kb-notes/methodology-a-capped-instruction-list-is-a-zero-sum-budget.md) · story `docs/college_action_page_lessons.md` · handoff `docs/session_178_handoff.md`.

---

### SkyVouch — the rule was already written down, one line above (2026-08-21, Session 178)

**Merged #1276 · #1277 (cpl-chat v52 live) · #1278.** Sam: role confirmation, org-adjusted questions, then *"it only listed 3 of the 9 LACCD colleges."*
⭐ **EVERY DEFECT THIS RUN WAS A RULE THIS REPO HAD ALREADY WRITTEN, UNAPPLIED.** The 3-cap sat **34 lines below** a comment reading *`"angeles" alone matches 9; a limit of 3 truncated the answer`* — same bug, same nine colleges, fixed there and left here. The gated tab that named an obstacle with no way in is `hiding-a-control-also-hides-the-way-in`. The missing Admin inventory is `a-manager-must-show-everything-it-manages`. The capped list read as a census is *"`peer_total` ships as a COLUMN"*. **Not one was a new lesson.** Sam's own framing already covers it: *a settled ruling does not enforce itself, the consumer has to change.*
⭐ **RAISING THE CAP WOULD HAVE BEEN WORSE THAN LEAVING IT** — *"Nine colleges appear in the MAP platform data"* is still a name match dressed as MAP's contents, and harder to catch because nine is right for LACCD. The fix is the **disclosure**, not the number.
⭐ **A CROSSWALK'S VALUE IS THE LINT, NOT THE MAPPING.** Feeding it every name observed in a live table found **two colleges whose CPL contacts were invisible** — `"Cypress College "` and `"San Jose City College "`, trailing space, real coordinator, no exact match. Fixed in the JOIN; the table rebuilds nightly.
⚠️ **CI FOUND TWO DEFECTS MY TARGETED RUNS MISSED**, both repo-authored tab rules. Wait for the full suite on anything touching tabs.
⚠️ **FOUR OF MY OWN CHECKS COULD NOT FAIL** — a regex that could not span `(s) => s.college`; a lift naming a constant that did not exist pre-fix, so the demonstration was skipped; a `|| []` precedence guard; a bare `check(..., true)`. **Verify fail-first, every time.**
Durable: [`a-rule-you-wrote-is-not-a-rule-you-applied`](docs/kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied.md) · [`a-capped-list-must-never-read-as-a-census`](docs/kb-notes/methodology-a-capped-list-must-never-read-as-a-census.md) · [`a-crosswalks-value-is-the-lint`](docs/kb-notes/methodology-a-crosswalks-value-is-the-lint-not-the-mapping.md) · [`a-curator-ruling-must-be-attributed-data`](docs/kb-notes/methodology-a-curator-ruling-must-be-attributed-data.md) · story `docs/college_identity_lessons.md` · handoff `docs/session_179_handoff.md`.

### SkyApply — a lookup, because recall does not scale (2026-08-21, Session 179)

**Sam: *"let's cure our need to internalize."*** Measured before building: **299 KB notes, 236 of them rules, 20 naming a test, 8 named in any executable file — 92–97% of the doctrine has no consumer.** The decisive figure: `cpl-chat/index.ts`, where the capped-list defect shipped, is named by **22 notes, four about caps**, one titled *"A capped list must never read as a census."* The corpus was not badly written — it was **un-queryable**. Recall costs scale with the corpus; lookup scales with the diff.
⭐ **TWO MECHANISMS AT DIFFERENT TIERS.** ① **The check-count floor** (`tests/check_floor.json` + `tests/run.js`) — the runner judged a file by **exit status alone**, which cannot see a check that stops registering. Demonstrated on real code: skipping one block of a 12-check file prints `10/10 checks passed`, exit 0, green. Now **241 of 247 files floored, ~7,500 checks under guard**; it fails **only on a drop**. This is the consumer `a-check-that-never-registers-can-never-fail` has wanted since 08-15 — it already said *"watch the total, not just the ratio"* and nothing watched it, so the trap recurred in two more harnesses. ② **`kb/doctrine.py --changed`** — prints the committed rules naming each changed file. Titles, not a reading list.
⚠️ **THE LOOKUP'S FIRST TWO BUGS WERE BOTH SILENT OMISSIONS** — **235 declared artifact entries** invisible (the frontmatter regex dropped every note's *last* item), and `--changed` omitted **untracked files**, so it left out the three files this session had just written.
⚠️ **I NEARLY WROTE A DUPLICATE NOTE**, and my own comment broke a test by **quoting a lift marker** (`indexOf` matched inside the comment). **A marker is load-bearing text, not prose.**
⚠️ **BASELINED AGAINST A MOVING TREE TWICE** — both ledgers recorded broken states as floors (`sierra_geo_ranking` at **1** vs a true 50). ⚠️ **Two of my own checks could not fail**, one of them the exact trap `sierra_candidate_census.test.js` already warns about in writing.
🚨 **AND THE SMOKE RUN FOUND A LIVE OUTAGE, UNRELATED TO ANY OF IT:** at 21:33 UTC every model-backed mode failed with *"Your credit balance is too low to access the Anthropic API"* — **Sierra answers nothing on any surface** (public page, COBI tab, Fact Sheet drawer, `map.rccd.edu`, college landing pages, vendor iframe). The function deployed cleanly and every non-AI assertion passed, so it is a **billing balance, not a regression**; only Sam can clear it. ⚠️ **Nothing alerts on this** — the smoke workflow runs only on dispatch or push, so it was found by a post-deploy check rather than a monitor, and a student hitting the widget reaches nobody.
**Also shipped for Sam:** Sierra's **district roster** (#1280, above), *Students in MAP* replacing the false *Students Awarded*, and a **suppressed chip** on the College Identity tab. Durable: [`index-the-doctrine-to-the-file`](docs/kb-notes/methodology-index-the-doctrine-to-the-file.md) · story `docs/doctrine_enforcement_lessons.md` · handoff `docs/session_180_handoff.md`.

---

### SkyPlain — the page was arguing the opposite of its own case (2026-08-22, Session 182)

**Merged #1285 · #1286 · #1287 · #1288 · #1289**, five rounds on the funding explainer with Sam reading it as its audience (CO, maybe CA Finance) would.
⭐ **EVERY FIGURE WAS TRUE AND THE PAGE STILL READ AS THE CO WITHHOLDING MONEY** — *"What is set aside before anything reaches a college"*, *"Left for institutions"*, and a crimson ▼ on every non-college line. The fix was never softer words: it was **naming the beneficiary of each amount** (*"held by the Chancellor's Office"* → *"the work all 115 colleges draw on"*), and then **retiring the waterfall entirely** — a waterfall reconciles an account, so it argues that spending is loss, and it was the only consumer of crimson on the page. ⭐ **Grouping argues too**: the noncredit $1M as its own box read as money taken out; folded into **$25,240,308 to the 115 colleges AND the four noncredit campuses** it reads as the whole effort funded. Same two numbers.
⚠️ **Deleting a section nearly deleted a figure** — `$800,000` CO staff existed ONLY in the waterfall. Diff what a retired surface was the sole display of. ⚠️ **The boxes must SUM or a Finance reader stops**; the residual is now *defined* as the appropriation minus the rest. ⚠️ **"Also say noncredit" cannot go blanket** — those campuses are correctly NOT in the credit-FTES split.
✅ **FULL-WIDTH PROSE IS NOW A COBI-WIDE RULE (Sam):** `--cpl-measure: none` on `:root` in both HTMLs, **39 sites / 17 files** on `var(--cpl-measure,none)` — one lever, or columns later. ⚠️ **The threshold is the point:** of 60 `ch` caps, 34 (60–82ch) are measures and 26 (9–46ch) are LAYOUT (cell truncation, a badge, a short hero lede); a blanket sweep breaks them, so `cobi_prose_measure.test.js` **pins a sample of the layout caps**. ⚠️ **A px cap is the same defect in other units** — four tab intros at 880/760px were invisible to a `ch` grep. Columns declined with a reason: most COBI blocks are 1–3 lines, so columns would stack one-liners.
Durable: [`the-same-arithmetic-can-read-as-withholding-or-as-investment`](docs/kb-notes/methodology-the-same-arithmetic-can-read-as-withholding-or-as-investment.md) · [`a-text-measure-must-agree-with-what-sits-beside-it`](docs/kb-notes/methodology-a-text-measure-must-agree-with-what-sits-beside-it.md) · story `docs/cpl_funding_lessons.md` · handoff `docs/session_183_handoff.md`.

### SkyScope — the district was right and the answer was about somewhere else (2026-08-22, Session 183)

**Sam, with LACCD selected on My College: *"she configured her response based on RCCD."*** Merged **#1291**.
⭐ **THE DISTRICT MACHINERY WAS ENTIRELY SOUND** — `resolveDistrict()` deployed (read the LIVE function, not the repo), 9 of 9 LACCD colleges have profiles, and the district chip's own question resolves correctly. Ruling those out first is what left only two suspects, and neither was in the district code.
⭐ **TWO INDIVIDUALLY CORRECT DECISIONS COMPOSED INTO THE BUG.** `convo` is module-level *on purpose* so a thread follows the reader between panes; `finish()` does `root.innerHTML = h` on every scope change, so the widget rebuilds and the log starts EMPTY. Together: a clean-looking conversation still shipping eight turns about the previous district. **Neither author could have seen it in their own file.**
⚠️ **A STALE THREAD SOURCES THE ANSWER, IT DOES NOT TINT IT** — `cpl-chat` folds prior user turns into the RETRIEVAL text when the new question carries <2 topic words of its own, and that folded string reaches `detectAndFetchCollegeProfile()`. `riverside` is in the alias map.
⭐ **AND NOTHING EVER TOLD SIERRA WHICH INSTITUTION WAS SELECTED** while `sierra_guidance` `15ec666b` told her to *"confine your answers to the selected institution"*. **A rule whose subject the request does not carry does not degrade to "no rule" — it degrades to "pick one"**, and is most confident exactly when wrong.
⚠️ **CI EARNED ITS KEEP TWICE.** The smoke red was the pre-existing mode-7 **prose grep** against the unchanged live deployment — not this PR's. The `test` red WAS: an assertion pinned the literal `rulesOverlay, ruleReport\)` and broke on an appended argument, reporting *"the overlay is not passed into the prompt builder"* when the overlay was fine — **and my own new test had shipped the identical defect.** `sierra_credential_volume.test.js` already had the pattern, in a comment.
⚠️ **THREE OF MY CHECKS COULD NOT FAIL** (a fake reader with no `releaseLock()`; a question saying *"this district"* instead of naming Riverside; a chips check run after `submit()` deletes the chips) and **my first transcript clear deleted the widget** — caught by `my_college_sierra_box.test.js`, not the new file. **Committed tests from three sessions ago are the ones that catch you.**
Durable: [`a-conversation-is-scoped-state`](docs/kb-notes/methodology-a-conversation-is-scoped-state.md) · [`a-guidance-rule-must-name-the-fact-it-depends-on`](docs/kb-notes/methodology-a-guidance-rule-must-name-the-fact-it-depends-on.md) · [`assert-that-an-argument-arrives-not-that-it-is-last`](docs/kb-notes/methodology-assert-that-an-argument-arrives-not-that-it-is-last.md) · story `docs/college_action_page_lessons.md` · handoff `docs/session_184_handoff.md`.


- **2026-08-19 (Session 170, SkyFetch)** — **the reports were already there, and the probe lied about it** (#1246/#1247/#1248). Sam built three MAP Custom Reports and asked whether a session could fetch them. ⭐ **All three are served by the API the daily cron already pulls**, `dataCount` matching the builder exactly — so wiring was config (`REQUEST_PAYLOAD` 8 → 10 datasets) and ITPI's daily-push offer is declinable on the merits. ⭐ **Two of the three are OUR OWN SPEC coming back**: the 13-column report IS Dataset A of `map_dataset_sql_for_malone.md`, already held as `map_college_cr_unit`, so the job was a **reconciliation** — found by re-reading a committed doc, not by generating anything. All three deltas run one way (+1.46% · +3.07% · +10.02%) = our staleness resolving, exactly as `cpl_memory` predicted. ⚠️ **A standing §11 claim was wrong** — "catalog year: nothing we hold carries it" — `map_student_credit.catalog_year` is **100% filled**, 9 values. ⚠️ **THE PROBE REPORTED "NONE EXPOSED" AND WAS WRONG**: `columnName: []` had silently stopped enumerating and now 500s on known-good views, so its success condition could not fire for **any** view — only a positive control caught it. It still leaked the truth (valid names 500, invalid 400; the single 500 was the real student view, printed as ✗ and summarized away). ⭐ **Pedro's salt-hash assurance was corroborated, not merely accepted** — the spec's own warning run as an experiment: 5M decimals + 8 variants ≠ a sampled hash. ⚠️ **The payload IS the PII boundary** (minimization is the *absence* of entries), now pinned by a test verified to FAIL, not just pass. 2 new KB notes; Sky167's narrative archived out of `CLAUDE.md`.

### SkyBound — two bounds, one dial fewer, then a whole new lane (2026-08-22/23, Session 184)

**Sam: add a Max Funding factor beside the minimum, set $400,000, recalculate — then,
once both bounds existed: *"we don't need the rural carve out since all are benefitting
from the floor… fold the funds into the total available."*** Merged **#1293** + **#1297**.
⭐ **MEASURED BEFORE BUILDING, TWICE, AND BOTH TIMES IT CHANGED THE RECOMMENDATION.** The
$400K ceiling holds 6 colleges and moves **1.1% of the pool**, none of it to the 45 at the
minimum — **a ceiling cannot lift a floored college**. And the rural removal was
*two-thirds* right: ten of 13 rural colleges moved **$0**, but three sat above the floor
and the released money re-splits to the **largest** colleges — regressive in direction
while "near zero" in aggregate. Shipped **paired with the floor raise to $175,000**, which
pays that cohort **$236,406 more** than the carve-out ever did.
⭐ **THE FLOOR IS THE LEVER, AND IT IS NOT FREE** — at $175K, **69 of 115** colleges sit at
the minimum, **the median college IS the minimum**, and the unbound earn rate falls to
**78.2% of base**. A floor is a transfer priced in the earn rate of the middle.
⭐ **THE SOLVER HAD TO CHANGE SHAPE**: a floor is monotone, a ceiling is not — pinning at a
ceiling RELEASES money and lifts colleges back **off** the floor, which the old
pin-as-you-go loop strands **with the pool still balancing and every row inside both
bounds** — invisible. `allocModel()` bisects `lambda` in `clamp(lambda*size, floor, cap)`
and reproduces the old loop **bit-for-bit** with the ceiling off (`0.000e+0`), asserted
against a transcription of it.
⚠️ **A BOUND ON THE MONEY IS A BOUND ON THE BAR** — scale to **cap ÷ `plainRatio`**, not the
bare cap, or the largest colleges get the state's only unsubsidized rate; and the clamp
must reach **both** target paths.
⭐ **A REDUNDANT-LOOKING MECHANISM CARRIED A SECOND JOB NO COLUMN SHOWS** — the rural
allowance was the pool's only **unconditional** money, so the 13 went **$76,923 guaranteed
→ $0** while ten of their allocation figures did not move at all.
⚠️ **FOUR VACUOUS CHECKS IN TWO SESSIONS ON THIS ONE TAB** — every one a threshold that
moved out from under an assertion naming a specific number. ⚠️ **The explainer's
worked-example cards were hand-typed and two of four figures were stale**; generated from
the payload now, in a file whose docstring says every figure comes from the engine.
⚠️ **Sierra is DOWN** — every model-backed smoke mode returns *"credit balance is too low"*;
nothing alerts on it (the workflow runs only on dispatch or a cpl-chat push).
Durable: [`a-second-bound-breaks-a-pin-as-you-go-solver`](docs/kb-notes/methodology-a-second-bound-breaks-a-pin-as-you-go-solver.md) · [`a-mechanism-that-looks-redundant-may-be-carrying-a-second-job`](docs/kb-notes/methodology-a-mechanism-that-looks-redundant-may-be-carrying-a-second-job.md) · story `docs/cpl_funding_lessons.md` · handoff `docs/session_185_handoff.md`.
⭐ **THEN THE NONCREDIT LANE** (2026-08-23). Sam: *"Let's go with the NC>=500 with a $25k
floor… we could retire the NC section provided we could integrate the values on the college
rows"*, then *"add a funding box to make the NC>=500 a variable."* It was a flat FTES split of
$1M among four campuses; it is now the **same clamp** over **33 institutions — 30 credit
colleges plus 3 standalone** — with three editable dials. ⭐ **Noncredit is 111 institutions,
not 4** (108 college rows carry NC FTES), so the THRESHOLD is what makes it affordable.
⭐ **A COMMENT PREDICTED THE SEAM** — `solveAlloc`'s bounds functions were documented as *"the
one seam a second pool would swap"*, so the new lane calls `solveBounded()` and the credit lane
became a five-line caller; the transcription test still proves no dollar moved.
⚠️ **A DEDUP HAS A SCOPE.** Removing Mt. SAC NC's duplicated FTES by deleting its roster row
**erased its real $50,000 ESS seed grant** — caught by a test on an unrelated surface that
asserted a count *with its reason attached*. The FTES was the duplicate; the institution was not.
⚠️ **THE CSV'S TOTAL ROW HAD BEEN ONE CELL TOO WIDE FOR MONTHS** — three empties against two
headers on the SYSTEM row and every district subtotal, so every figure from that point right sat
under the wrong heading in the one row a reader checks first. Invisible in the browser.
⚠️ **27 of 33 sit at the NC floor and growth only starts paying at 3,022 FTES** — Sam's stated
reason for the lane was the incentive, so the model now reports `breakEven` and the box prints it.
Durable: [`a-deduplication-has-a-scope`](docs/kb-notes/methodology-a-deduplication-has-a-scope.md) · story `docs/cpl_funding_lessons.md`.
⭐ **THEN SAM MOVED THE DIALS AND EVERY REMAINING DEFECT FELL OUT OF IT** (2026-08-23, #1302–#1306).
He set the credit floor to $150K and the NC floor to $50K "just to see", and reported the changes
had not propagated. They had — the tab's own numbers were his — but the report was still right:
**three surfaces were lying, each in a different way.**
⚠️ **$50K × 33 = $1,650,000 against a $1,000,000 pool**, so the solver's degenerate branch paid
each institution **$30,303** while the box said *"33 at the minimum"*. A model that silently pays
less than the number on its own dial is the worst state this has; `floorInfeasible` now REPLACES
the note in both lanes (the ceiling's mirror case has had a warning since it shipped).
⚠️ **The explainer had not moved at all** — it was a Claude artifact rebuilt by hand, on a host
that blocks the call it would need. Sam: *"move explainer to Pages"*. It is now a live page at
`/funding-model/` off the same engine; the payload builder is SHARED so a snapshot and the live
page can differ only by WHEN, never by HOW.
⚠️ **The "held $X" label** (Sam: *"worried about the message we're sending"*) appeared on all 115
rows months before the deadline, reading as system-wide withholding. Phase-dependent now.
⭐ **THE PARITY NUMBER HE ASKED FOR EXPOSED A THIRD DEFECT** — building "noncredit is 7.1% of the
teaching and 4.0% of the money" surfaced a **CCC total counting only the standalone roster**,
missing **56,993 FTES** on the exact card a reader uses to judge that share.
⚠️ **TWO VERIFICATION FAILURES, AND THEY COST A RED MAIN.** I merged #1303 and #1304 on the green
REQUIRED check while the non-required suite covering my own change was still running — and had
verified locally with a subset I chose myself, which happened to exclude both files that broke.
Then I told Sam the local full run passed on exit 0; it was **SIGTERM 143**, killed by my own
pkill, and the "exit 0" belonged to the wrapper. Same class as the `; echo "EXIT=$?"` trap already
in this file. ⚠️ And my page test asserted on `#tbody` — **the one container that clears itself** —
so it passed while three others accumulated copies until Sam saw the cards render three times.
Durable: [`a-green-check-you-did-not-scope-is-not-evidence`](docs/kb-notes/methodology-a-green-check-you-did-not-scope-is-not-evidence.md) · [`a-snapshot-of-a-live-model-is-a-claim-that-decays`](docs/kb-notes/methodology-a-snapshot-of-a-live-model-is-a-claim-that-decays.md) · handoff `docs/session_186_handoff.md`.

### SkyScope S185 — nobody was watching, and she was paying full price twice over (2026-08-23, Session 185)

**Sam: *"let's pick up the queue"*.** (Moniker collision: Session 183 also ran as
SkyScope; Sam's greeting named this one, so both exist — disambiguate by number.)
⭐ **THE FIRST QUEUE ITEM WAS NOT IN THE QUEUE.** Rule 8's read step surfaced a
`verified` `cpl_memory` row from that evening: **Sierra was down** — Anthropic credit
exhausted, **second outage in two days**, and both found by a session happening to look.
A fresh smoke dispatch confirmed it live at 00:01 UTC. Sam topped up mid-run.
⭐ **NOTHING WATCHED HER**: `cpl-chat-smoke.yml` and `sierra-preflight.yml` fire only on
dispatch or push, so outage duration was set by luck. New `cpl-chat-health.yml` — one
question every 3 hours, raises/reuses/closes a GitHub issue. ⚠️ **A liveness check is
only worth having if it can say no**, so the test RUNS the probe against a mock in five
shapes and asserts exactly one reports up. ⚠️ **The cadence carries its price in the
file** (hourly ≈ $22/mo vs 3-hourly ≈ $7) — Sam funds this personally today.
⭐ **THE COST LEVER WAS NOT THE MODEL.** Asked whether Haiku would be cheaper: there is
**no Haiku 4.6** (it is 4.5, $1/$5 vs $3/$15, and 200K context not 1M) — but
**`cache_control` appeared ZERO times** in a 200 KB function carrying ~7,000 stable
tokens per turn. ⚠️ **I told Sam caching was risk-free and it is not**: caching is a
PREFIX match, the preamble is 242 tokens (below the ~1024 minimum, so a breakpoint there
caches nothing **and says nothing**), so the always-rules had to move ahead of the
sources. ⚠️ **"Mostly stable" is WORSE than no caching** — a write costs 1.25x, so
caching the whole rule block (the one-line version) would have been a surcharge, since
`appliesWhen` varies it by mode. Shipped: the `always` half only, **2,992 tokens
byte-identical every request**, proven by RUNNING the assembler over all 16 context
combinations.
⭐ **SMOKE MODE 7 HAD BEEN RED SINCE SESSION 125 ON CORRECT ANSWERS.** Its part-3 prose
grep wanted LA-basin colleges that TEACH construction; Sierra leads with the ones that
ARTICULATED NCCER — the other true thing. Measured at retrieval instead: the function's
own tsquery returns **150 rows / 78 colleges, 5 of the 6 present**. Mode **7r** asserts
that via the RPC with a **negative control first** and a **threshold, not a named
college**; a committed test re-derives the tsquery from `index.ts` so the transcription
cannot drift.
⚠️ **THE IDENTITY LINT HAD EMPTIED ITSELF AND SHIPPED THAT WAY FOR FOUR MERGES** —
`--observed-json` is optional, #1283 ran without it, `findings` 13 → 0, and the tab said
**"Nothing outstanding"** while two live join defects sat unfixed. `cpl_memory` recorded
the hazard the same day and it still shipped: **recording a rule and enforcing it are two
events.** Builder now exits 1; artifact stamps `linted`; tab says "not checked".
⚠️ **MAP's three sandbox colleges are out of Sierra's corpus** — and `entity_kind` could
never have caught `Las PosTest College`, which has **no `map_colleges` row to join to**;
its stats were empty but its CONTACTS were a real coordinator at a college that does not
exist.
⚠️ **The lint fired on MY OWN edit twice** (`stacked_roadmap_cell`, `unindexed_kb_note`)
and **my own grep tripped on my own comment** quoting the retired assertion. Both fixed
pre-commit; the cell is now SMALLER than before this run.
✅ **DEPLOYED AND MEASURED THE SAME RUN — v57 ACTIVE.** 34 turns post-deploy: **1 write, 33 hits, 0 inert**, and **`read=3027` IDENTICAL on every request** while `uncached_input` ranged **10,843 → 22,762** — production proof the always/conditional split was load-bearing, since caching the whole rule block would have jittered that figure and billed a 1.25x write on most turns. ⚠️ **The log source is `function_logs`, NOT `function_edge_logs`** (the latter returns zero rows and looks like a dead feature). ⚠️ **A merge push fires its own smoke run that can RACE the deploy** — here it started 01:17:40 against a deploy that finished 01:18:17, so it tested the OLD function with the NEW script; dispatch your own after confirming the version bumped. ⭐ **The telemetry closed the Haiku capacity question for free**: peak ~23K against Haiku 4.5's 200K is a 9x margin, so only rule-adherence remains to be scored.
Durable: [`a-cache-breakpoint-must-lead-and-must-not-move`](docs/kb-notes/methodology-a-cache-breakpoint-must-lead-and-must-not-move.md) · story `docs/cpl_assistant_lessons.md` · `docs/college_identity_lessons.md` · handoff `docs/session_186_handoff.md`.

### SkySew S186 — the tab was migrated, the document it exports was not (2026-08-23)

**Sam: *"let's get the funding tab sewn up!"*** ⭐ **RULE 8's READ STEP CLOSED ONE OF THE
TWO OPEN ITEMS BEFORE ANY CODE WAS READ** — the parity question was already ruled
(`sam-keep-nc-carveout-at-1m-parity-later`, verified), and the LIVE config showed he had
since set the carve-out to **$1,800,000** and the credit floor to **$150,000**. The tab was
in a configuration nobody had looked at.
⭐ **THE RETIRED MECHANISM SURVIVED IN THE EXPORT.** `memoModel()` still computed the flat
FTES split, so the memo paid the **entire** carve-out to four standalone campuses —
**$779,862 to Mt. SAC Noncredit, which the model pays $0** because its FTES is counted on
the Mt. San Antonio credit row — and showed **nothing for the 30 colleges** that receive the
other $1.6M. ⭐ **THE TIE-OUT IS WHAT LET IT SURVIVE**: the statewide total was correct to
the cent, because the four campuses had absorbed exactly the whole carve-out. A migrated
model leaves no dangling reference behind — the old formula is open-coded arithmetic, so
**grep for its SHAPE, not its name**. Durable:
[`a-total-that-balances-is-not-a-total-that-is-right`](docs/kb-notes/methodology-a-total-that-balances-is-not-a-total-that-is-right.md).
⚠️ **TWO CARDS DESCRIBED A 33-INSTITUTION LANE AS "4 NC CAMPUSES"** off `feeders().length` —
including the pool card a reader uses to judge whether the carve-out is proportionate, the
exact question the $1.8M answers — and one printed a **74,968 headcount**, the wrong basis,
counting the deduped campus's 35,363.
⚠️ **THE OPT-IN PROMPT KEYED ON `held > 0.5`** (Sam: *"why don't Cosumnes and Grossmont…"*),
so a GATED college that had earned nothing rendered **no prompt at all** — the one cohort it
exists for. `yearEarnParts()` already named the case in a comment. Driven by the gate now;
the figure still appears only when there is one, so nothing reads "held $0". ⚠️ **Not
reproducible offline** — the harness has no coordinator feed, so the gate reads PENDING.
⚠️ **A HAND-MAINTAINED LINT IS THE THING THAT GOES STALE** — three of the explainer's four
carve-out mentions repainted to $1.8M; the fourth was a bare `<b class="num">` with **no
id**, invisible to both the painter and the `BOUND` map. **Three agreeing and one not is
worse than four wrong.** Both the live page and the frozen snapshot now carry a *structural*
check needing nobody to extend a list.
⭐ **Also:** the priority columns carry their names (**P1 Access**, centered) — ⚠️ a first
test "proving" the missing-title fallback **failed and the CODE was right** (`prioTitle()`
falls back to `DEFAULT_PRIORITY_TITLES`), so it now asserts what is true rather than staging
an unreachable path; and **the noncredit calculation is in "How an allocation is computed"**,
which described only the credit pool, stating an infeasible minimum **there too**.
⚠️ **§11 said "factors 1.0"; live is 0.5** — corrected above. ⚠️ **`cpl_memory`
`p3-portal-routing-is-standard-practice` is STALE** (P1 now measures applied units by origin;
P3 measures transcribed) — flagged, not silently superseded, per Rule 8.
Story `docs/cpl_funding_lessons.md` · handoff `docs/session_187_handoff.md`.

### SkyView S187 — the queue cannot reach the goal, and a fold exposed a modeling defect (2026-08-24)

**Sam: *"a left turn over to the CCR … an interactive interface something like my graph view
in obsidian"*, then the frame: *"cluster 142k local courses down to 2k-2.5k."***
⭐ **The governing finding is arithmetic: grinding all 6,056 decisions perfectly lands at
35,937 — 14.4× short.** Merging compares what exists; only **packaging** reaches the target.
⭐ **The corpus is 6,056 decisions, not 17,321 rows** — 97.1% ≤12 identities, modal 2.
⭐ **Member re-home (`CN:`) was built in Session 54, tested, reversible, never re-mints — and
had ZERO uses**: the picture was the missing half of a shipped feature.
⭐ **SAM REVERSED THE DESIGN CALL AND HIS REASON WAS RIGHT** — *"courses are mismatched in the
wrong subject area … pull an area over closer to the clusters in another area."* A
per-decision view **structurally cannot show a cross-area move**, so the universe view (all
identities on canvas, precomputed stable layout, draggable islands) is the only place that
repair happens. ⚠️ Labels had to be **collected then collision-rejected** — drawing each
inline reproduced the unreadable pile of his own Obsidian screenshot.
⭐ **THE ESL FOLD IS APPLIED AND PUBLISHED: 2,300 identities → 27**, seven comprehensives,
1,997 rows. Mechanism is **survivors, not new ids**. ⚠️ **`ON CONFLICT` blocked three of seven
RENAMES — 1,994 landed where 1,997 was planned, and that gap was the whole story**; one
blocker was Sam's own row, superseded explicitly per Rule 8 and **confirmed by him the same
day**. ⚠️ **Automotive VESL does not exist** — his own example had zero rows.
⭐ **VERIFYING THE FOLD FOUND A DEFECT WORTH MORE THAN THE FOLD.** ESL rendered 169 rows
against 27 survivors: the overlay stores **one hop per row**, so an identity merged into and
then merged onward is a source AND a target, and **340 folded identities were rendering as
their own rows** with members stranded mid-chain. **Only 96 are mine — 248 are not even ESL.**
⚠️ It looks like it breaks *"grouping is by KEY, NEVER transitive"* and does not: that rule
governs **similarity** edges, which are measurements; a `merge_into` is a **decision**, and
sameness composes. ⚠️ My first fix wrote a **self-merge** on a cycle — worse than the stale
edge because it is invisible; the test caught it.
⭐ **Packaging HIDES pre-existing over-merges**: a film-studies course bot-merged into an ESL
row went from 1-of-2 and conspicuous to **1-of-35** and unremarkable.
⚠️ **The fold-scoped-list trap fired FOUR times** — the fourth was checking whether the
*survivors* were sources when the question was whether my *sources* were targets: *ask whether
the list you read can contain what you are counting.*
⚠️ **`college_identity_lint_guard` went red at 00:00 UTC for everyone** (byte-for-byte vs a
date-stamped artifact); fixed and proven to still fail on real drift.
Story `docs/ccr_atlas_lessons.md` · handoff `docs/session_188_handoff.md`.

---

### Sky188 — a confidence label is a claim, and the queue was ranked backwards (2026-08-24)

**Sam: locate the *"CPL Initiative Dashboard Daily Update"* Routine to toggle off, then
*"continue the queue"*.** The Routine was confirmed independent of the daily cron on four
checks (the real cron is `.github/workflows/daily-dashboard.yml`, a 3-cron ladder in the repo;
the Routine had **never run**, was already Paused, and the dashboard updated anyway) — **Sam
deleted it**, closing the Rule 6 second-scheduler risk and the `CPL_SCRAPE_2026` secret in its
prompt. An agent could neither disable nor delete it (`created_via: http_api`).
⭐ **THE HANDOFF'S FIRST JOB RESTED ON FOUR WRONG CLAIMS.** The 543 `default-beginning` folds
were called *"the truly evidence-free pile"* with *"no surface"*, ranked above the 248
`numeric` rows. The fold classifier only ever read the **modal title**, while the COCI export
carries a `CatalogDescription` for **96%** of member courses stating the level outright.
⭐ **CALIBRATION BEAT INTUITION: `numeric` is 49.2% wrong** — a coin flip, ranked *below* the
lane to work first; 94 rows were about to be skipped. `word/high` at 6.2% is the only signal
behaving like its label.
⭐ **DIRECTIONAL ERROR BEATS AGGREGATE ERROR** — 85 under-claim vs **9** over-claim, and the
small half is the one to work; all 9 are the `5+` cut sitting one rung too low for 6-rung
ladders. ⚠️ **The course-NUMBER ladder was built and THROWN AWAY** (325 false proposals).
⚠️ **My own first boilerplate guard PASSED while perturbed** — untestable against live data —
and rewriting it exposed a real gap (the strip took the field NAME, left its VALUE).
⚠️ **Four `check_suite.completed` events, four useless**: three named superseded heads, the
fourth named the current head but reported a suite I had **canceled** as "completed". Treat
that event as a prompt to go look, never as the green light. #1315 merged on `unstable` with
the secret scan stalled twice at zero log output — diff scanned locally instead, named in the
merge commit. Story `docs/ccr_atlas_lessons.md` · handoff `docs/session_189_handoff.md`.

### SkyRead S190 — the note never reached the model, and the doctrine filled the vacuum (2026-08-24)

**Sam: *"fix a bug in the memory procedures"*** — Autogenerate returned a confident entry about
the two-band answer structure for a note about which kind of credit to award (#1320/#1321).
⭐ **THE TOPIC ARRIVED AS SIXTEEN CHARACTERS.** The envelope was 984 of a 1,000-char server cap
and led the prompt, so `When responding ` is all the model got; with no subject and ~9 KB of
answer doctrine it wrote about the doctrine, verbatim from `STATEWIDE_RULE`. Retrieval keyed on
the envelope too — **99 keywords, one of them the curator's**, at 0.86 similarity.
⚠️ **NAMING THE LISTS IS NOT CHECKING THEM.** The surface vocabulary lives in THREE places; I
updated two and CI found the third (the curator picker), exactly as its comment warned.
⚠️ **AN EXEMPTION MUST BE ASSERTED, NOT ARGUED** — the inline citations are under 24px on
purpose, justified by a source list that measured **15px**. The harness now checks the
justification, so deleting the list turns it red.
⚠️ **Three budget assertions passed VACUOUSLY** against a client declaring no budget.
⭐ **The first real briefing found two things in the table** — a stale `verified` row and two
contacts entries that are each right and misleading apart.
**Both merged, neither live at the time** — deployed the next day by SkyAlign (below).
Story `docs/cobi_memory_tab_lessons.md` · handoff `docs/session_191_handoff.md`.

---

### SkyAlign S190 — a stale copy said a busy college was empty (2026-08-25)

**Sam: *"The data are wrong, particularly for Moreno Valley College."*** (#1325/#1326)
⭐ Sierra read a **June snapshot** on district questions only: MVC **0 students** against a live **2,887**.
Fixed by DELETING the second source, not refreshing it — two copies of one fact drift again, and a stale
number looks exactly like a fresh one.
⚠️ **Half a two-half feature deploys itself** — the memory client is a static file (Pages, on merge), the
Edge Function needs a dispatch, and `cpl-chat-smoke` tests the DEPLOYED function so nothing notices.
⚠️ **The repo is not the deployment** — I inferred v57 from `git show` until Sam pointed at the doc that
says read the LIVE source. It matched (`4796b51376780b07`); that was luck, not method.
⚠️ **I shipped the bug I had just read about, 4×** (assertions pinned to a closing paren); 34 of that shape
survive repo-wide. ⭐ And **`exit=0` was my trailing `grep`** — a red suite nearly passed for green.
Story `docs/college_action_page_lessons.md` · handoff `docs/session_192_handoff.md`.

### SkyCruise S192 — the key that named two courses, and a search that reported what it could not draw (2026-08-25)

**A live session: Sam drove SkyView in a browser and reported defects as he found them** (#1329).
⭐ **A CourseControlNumber is not a unique course key.** The re-home writes `CN:<control number>` and
nothing else; **1,814 of 139,834** name more than one course as the artifacts build them (**462** in the
source after the declared fold), and every layer below picked the first match. **3,634 draggable rows.**
Nothing had gone wrong — zero `CN:` rows exist — which is the window you get. Refused now, with the reason.
⚠️ **My first perturbation did not go red**: two guards, only one reachable through the UI, so the deeper
one was untested. Each has its own assertion now.
⭐ **Split by required repair, never one headline** — the real worklist is **73** rows, 93 of them at one
college. ⚠️ **A declared fold reaches only the roster that consults it**: `CaÃ±ada College` renders that
way in the member list today, and the raw export carries **only** the broken spelling, 678×.
⭐ **A view must not fly where it cannot draw** — the search reported *"Ringed in red"* at zoom 12% while
`draw()` needs 0.20; removing the floor reproduces Sam's screenshot at exactly `0.120`. Also 344 course
titles queued and **54** fit.
⭐ **SkyView is the landing view** (Sam's call) — shipped with keyboard operation of the canvas, which
**did not exist**. ⚠️ **The work surface behind it is 1.2% built** — 5 of 159 subjects.
Story `docs/ccr_atlas_lessons.md` · handoff `docs/session_193_handoff.md`.

---

### SkyFixer S193 — a write key that named nothing, and a link that always came home to the wrong room (2026-08-25)

**A live session: Sam drove COBI in a browser all afternoon** (#1330, #1331).
⭐ **The Memory ✎ chip "did nothing" because its write key named NOTHING.** `slug` is UNIQUE but NULLABLE and
the display handle falls back to the uuid, so on **6 of 572 rows** the PATCH matched zero rows and the page
blamed the team phrase. Then the chip turned out to be a CYCLE that **wrote every state it passed through** —
his two clicks sit in `cpl_memory_log` 15s apart and left a `stale` row carrying a verification stamp.
⭐ **The magic link came back to the wrong screen for everyone** — nine modules stashed the return tab in
`sessionStorage`, which is per browser tab, and the link opens a new one. `cpl_session.js`'s own header
claimed that key restored the right tab while it could not, for the reason that file exists.
⭐ **Naming the credential that actually failed** turned out to matter more than the failure: "your team
phrase may have expired" was shown to a magic-link curator, pointing at an unlock row that was not rendered.
⭐ **GR "reanalysis" had no referent** — `blast_rank` is computed by nothing in the repo. Built the checks a
lawyer makes first instead; an answer you can re-derive is one you can defend to the CO.
⚠️ **Five times a perturbation read as 0 FAIL because the suite CRASHED and stopped** — the most useful
thing learned today. Story `docs/ccr_atlas_lessons.md` · `docs/gr_register_lessons.md` ·
`docs/cobi_memory_tab_lessons.md` · handoff `docs/session_194_handoff.md`.
