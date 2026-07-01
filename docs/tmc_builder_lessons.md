---
title: TMC Builder — workstream lessons
date: 2026-06-16
session: 59 (Bruh Star Navicus) — design-lane detour
tags: [tmc, adt, c-id, tab, supabase, coci, workstream-lessons]
artifacts:
  - tmc_builder.js (renderer/interaction — STATIC, lazy)
  - tmc_templates.js (8 draft TMC definitions — the fixed left column)
  - tmc_college_courses.js (per-college COCI index — STATIC artifact, 7.5 MB)
  - tmc/_build_college_courses.py (one-shot builder for the artifact)
  - tmc/supabase_tmc_submissions.sql (schema of record)
  - tests/tmc_builder.test.js (jsdom guard)
related:
  - docs/kb-notes/reference-tmc-adt-data-model.md
  - kb/reference/cid_descriptors.json (495 official C-ID descriptors)
  - kb/reference/coci_course_list.xlsx (141,738-row source)
---

# TMC Builder — Transfer Model Curriculum (ADT) submission tab

A new top-level tab (`#tmc-builder`, nav label **TMC Builder**) that lets a
college build its alignment of local courses to an ASCCC Transfer Model
Curriculum (the basis for an Associate Degree for Transfer). Sam's detour from
the data lane, built interactively against his live direction.

## The model (Sam's spec, verbatim intent)

- **Top of the form:** two selectors — *submitting College* and *Program /
  Discipline (TMC)*. The C-ID TMC site (c-idsystem.org/transfer-efforts) is the
  authoritative master list of every approved TMC.
- **Left column = FIXED**, ASCCC/CSU-faculty-defined C-ID course list (plus
  "select non-C-ID" rows). Doesn't change once established. Grouped Required Core
  / List A / List B / List C, each with a required-units range + a select-count.
- **Right column = the college's own COCI offerings**, chosen from a searchable
  dropdown, "matching the units and contact hours of the C-ID in order to be
  legitimate."
- **Auto-populate**: the right side pre-fills the local course that already
  carries each slot's C-ID (Sam: "hopefully you can populate initially the course
  that aligns with the C-ID").
- **Total Units** of the selected right-side courses shown on the form (header
  meter + per-section subtotal + a grand-total footer).
- Output: **export** (.docx via the existing docx.min.js / print / JSON) **and
  save to Supabase** (resume/track).

## What shipped (Session 59)

| Piece | Notes |
|---|---|
| `tmc_templates.js` | 8 DRAFT TMCs (Psychology, Sociology, Anthropology, Communication Studies 2.0, History, Business Admin 2.0, Mathematics, Biology). Slot C-ID numbers/titles are REAL (from `cid_descriptors.json`); section/unit/select details are seed — **faculty must verify against the official template**. Add the rest by appending to `templates[]`. |
| `tmc_college_courses.js` | Per-college COCI index `{colleges[], courses{idx:[[subj,num,title,units,cid]]}}`. 120 colleges, 141,699 courses. 7.5 MB raw / 1.8 MB gzipped. STATIC (rebuild only on a fresh COCI extract). cid normalized to the descriptor key so the client auto-matches with `==`. |
| `tmc_builder.js` | Lazy renderer. Injects own CSS. College+TMC selectors → fixed-left / COCI-dropdown-right form, C-ID auto-match, units-in-range check, Total Units, Save/Resume (Supabase), export. |
| `public.tmc_submissions` | New Supabase table, anon RLS (insert/update/select), `(college,tmc_id)` unique → upsert. No PII. |
| `tests/tmc_builder.test.js` | jsdom: Rule 4, nav/pane/boot wiring, auto-match, Total Units, null-safety. 27 assertions. |

## Lessons / decisions

1. **The repo already had both data sources.** `cid_descriptors.json` (495
   official C-ID titles) for the left column + `coci_course_list.xlsx`
   (per-college courses, `CIDNumber` column) for the right. COCI's `CIDNumber` is
   **byte-identical** to the descriptor key ("ANTH 110") — 12,738/12,792 exact —
   so auto-match is a plain normalized string compare, no fuzzy join.
2. **Auto-match is C-ID-only (safe).** We only pre-fill when a college course
   literally carries the slot's C-ID (or an `alts` C-ID). We never guess-fill by
   title — the picker's title/subject scoring surfaces good manual candidates
   instead. Real-data probe: American River 12/14, Glendale 12/14, Bakersfield
   13/14 Psychology slots auto-fill.
3. **C-ID coverage in COCI is uneven** — 33/120 colleges report <20 C-IDs in this
   extract (Norco 0, Riverside 25, but Moreno Valley 140, American River 266).
   The tool degrades gracefully: sparse-coverage colleges pick from the dropdown
   (title-sorted). This is a *MAP-extract* limitation, not the tool — colleges
   with C-ID-approved courses in C-ID.net may simply not record the number in
   COCI. **Candidate enhancement:** a title-similarity "suggested (verify)"
   secondary fill for sparse colleges, clearly distinct from C-ID auto-fill.
4. **Contact hours aren't in COCI.** COCI carries `UnitValue` but no contact
   hours, so legitimacy-matching is **units + C-ID** today; contact-hour parity
   is a manual/faculty step (noted in the UI). If a contact-hours source lands,
   add it to the builder + the unit check.
5. **No new daily-cron artifact.** Both data files are STATIC (COCI updates
   rarely). `tmc_college_courses.js` is committed like `cpl_funding_data.js` — it
   is NOT in the workflow `git add` list and must be rebuilt by hand on a new
   extract (`python3 tmc/_build_college_courses.py`).
6. **Lazy everything.** Nothing loads until the tab opens: the boot wiring
   lazy-loads `tmc_builder.js`, which lazy-loads `tmc_templates.js` then the 7.5 MB
   `tmc_college_courses.js` (precedent: the CCR's 34 MB details file).

## Session 60 cont. (Bruh Momentus) — GE Breadth companion: the full ADT package (2026-06-17)

Sam: integrate the CCCCO **IGETC / Cal-GETC Breadth Forms** on the TMC tab, paired
with each TMC, legacy patterns included. (The CCCCO site Cloudflare-blocks the agent
env — page + direct `/-/media/…pdf` both 403, same as c-idsystem.org — so the
official Breadth Form PDFs await Sam's upload; encoded from public ASCCC/CCC
standards meanwhile, flagged draft-for-verification like the 45 majors.)

- **An ADT = a TMC major + a GE Breadth pattern + electives to 60 CSU-transferable
  units.** The builder did the major; this adds the **GE half**.
- **`tmc_ge_patterns.js`** (new STATIC, lazy-loaded like `tmc_templates.js`):
  three patterns — **`cal-getc`** (the single statewide ADT GE pattern as of Fall
  2025, AB 928; primary) + legacy **`igetc`** and **`csu-ge`**. Each is modeled as
  `sections[].slots[]` exactly like a TMC, but slots are **`ge:true` + `noncid:true`**
  (GE areas are college-certified, not C-ID-keyed) so the builder renders a manual
  picker (no C-ID auto-match) and treats `units` as a per-course **minimum**.
- **Builder reuse, not a fork.** `renderSlot` gained a `keyPrefix` param (GE choices
  live under `ge:`-prefixed keys in the same `state.choice`); a `renderGeInto()`
  companion panel renders below the major with a **GE pattern selector** (Cal-GETC
  default, IGETC/CSU GE flagged legacy), a combined **Full ADT total** (major + GE),
  and review-mode read-only. `statusFor` got a GE branch (warn only when *below* the
  area minimum). Save/Resume + the `.docx`/JSON export carry GE under the same
  `alignments` jsonb (`ge:`-keys + a `_ge_pattern` meta record) — **no Supabase
  schema migration**.
- **No HTML touched** (builder loads `tmc_ge_patterns.js` itself) → Rule 4 intact.
  Tests: `tests/tmc_ge_breadth.test.js` (24 assertions). Suite 54 → 55 files green.
- **Open:** GE auto-match isn't possible (COCI carries no GE-area flag) — manual pick
  for now; true up the area structures + counts when Sam uploads the official Breadth
  Form PDFs.

## Session 60 (Bruh Momentus) — list-first redesign + real-estate consolidation (2026-06-17)

Sam wanted the tab to do two jobs cleanly: **(a)** a directory of *every* TMC (any
status) any reviewer/initiator/collaborator can jump into, and **(b)** the
individual build/review/submit flow. Five asks, all shipped in `tmc_builder.js`
(STATIC — no HTML/Rule-4 touch) + `quickstart.js`:

1. **List-first.** The tab now lands on a **TMC directory** (`renderList()`): a
   filterable table of all 45 TMCs (Discipline · Degree · Status chip · C-ID slots
   · *Your auto-matches* when a college is picked · official/PDF links). Clicking a
   row (`openTmc`) opens that one TMC's builder; a **← All TMCs** back link
   (`backToList`) returns. The old **Program/Discipline (TMC) dropdown was dropped**
   — the list replaces it as the selector. `state.view` ∈ `list` | `detail`.
2. **"All colleges" default = review mode.** The college filter leads with **All
   colleges (browse/review)** (`state.college === ""`). Opening a TMC then shows the
   fixed C-ID list + curator notes with the right column muted ("Select a college to
   align a local course"), a review banner, and Save/Submit hidden (Export/Print
   kept). Pick a real college → full **build mode** (auto-match, Total Units,
   save/submit) **and** the directory gains a per-TMC **coverage** column
   (`coverageFor()` = how many slots' C-IDs that college already carries).
3. **"Coming soon" retired.** All 45 TMCs are `draft`, so `planned`/"Coming soon"
   was an empty, confusing bucket. `STATUS_META` is now **official | draft** only;
   `tmcStatus()` returns `official` iff `status==="official"`, else `draft`. Removed
   from the Show filter, the optgroup split, the legend, and the planned panel.
4. **Consolidated filters.** One `.tmc-filters` block — **College · Show · Find a
   TMC · Curator sign-in** — replaces the old separate topbar (auth+status) and
   pickers row. The big yellow draft box + long intro paragraph are gone; the draft
   disclosure is now a slim **"· Draft, for test & development"** note appended to
   the single `<h2>` title.
5. **Quickstart lifted to the header.** The global **"What are you working on"**
   bar (`quickstart.js`) now mounts right after `.header` (full-width global chrome)
   instead of at the top of each tab's main column — frees real estate on *every*
   tab. Single global widget, so it still shows on all tabs.

Tests: `tests/tmc_builder.test.js` rewritten to the list-first model (drove the
removed dropdown / planned panel before) — **42 → 52 assertions**, full suite green
(53 files). **Open/pushback for Sam:** the quickstart bar scrolls with the header
(not pinned) — say the word to make it sticky. CLAUDE.md §7d still describes the
old dropdown/Coming-soon model in places; full §7d rewrite deferred to the next
checkpoint once the TMC design settles.

## Session 59 cont. (3) — curator layer: login, status filter, requests, notes, PDF artifacts (2026-06-17)

Five Sam asks, all reusing existing infra:
- **Login**: ported the CCR's magic-link auth into `tmc_builder.js`, reusing the
  **shared `cpl_sb` sessionStorage key** — so signing in on the CCR carries over,
  and the eager CCR script already handles the redirect-hash. `allowed_reviewers`
  gates writes (`map@rccd.edu` now; CCCCO later). Public read, reviewer write.
- **Status filter** (All / Official / Draft / Coming soon / **New requests**) atop
  the form; non-"requested" values filter the TMC picker, "New requests" swaps the
  body for the **CO-review queue**.
- **"New request" = submit for CO review** (Sam's clarification: "a college wants
  to complete a new TMC ADT request for the CO to review"). The form's **📤 Submit
  for CO review** sets the `tmc_submissions` row to `status='submitted'` — no new
  table needed; the queue reads `status=eq.submitted`. (`tmc_requests` exists for
  free-form discipline requests but the submission-status IS the request.)
- **Global curator notes** per course row (`tmc_curator_notes`, one per
  (tmc_id, slot_key), reviewer-gated). Fits the C-ID-discrepancy use; the 25
  `cid_unverified` slots also show a **⚠ not in C-ID ref** flag inline.
- **PDF artifacts**: since the 45 PDFs are committed under `tmc/source_pdfs/`,
  GitHub Pages serves them — each TMC links `tmc/source_pdfs/<basename(source)>`
  (no Cloudflare). Derived in JS from the `_meta.sources` URL; no data change.

New Supabase tables: `tmc_curator_notes`, `tmc_requests` (`tmc/supabase_tmc_curator.sql`).
Tests 34 → 42 (auth bar, status filter, PDF link, submit action, curator note,
discrepancy flag, CO-review queue). Verified anon can read notes but not write them.

## Session 59 cont. (2) — all 45 TMCs encoded from the official PDFs (2026-06-16)

Sam ran a PowerShell `Invoke-WebRequest` loop **on his own machine** (his network
passes Cloudflare; mine 403s even with a browser UA + sandbox off — confirmed with
curl AND urllib) and **uploaded the 45 PDFs as a zip**. That's the durable pattern
when a host bot-blocks the agent env: the human (browser/desktop) fetches, uploads;
the agent parses.

- **Parser** `tmc/_parse_tmc_pdfs.py` (committed, re-runnable; PDFs committed under
  `tmc/source_pdfs/`). PDF text via **PyMuPDF** (`fitz`) — pdfplumber/pypdf both
  import a **broken `cryptography` rust binding** in this container (`_cffi_backend`
  missing → pyo3 panic); PyMuPDF is self-contained and sidesteps it.
- **The key robustness move**: extract C-IDs from the table cells, validate against
  `cid_descriptors.json`, and for any VERIFIED C-ID use the **descriptor's official
  title** — so PDF column/line noise in titles is irrelevant (the C-ID is what drives
  auto-match anyway). Humanities/social-science TMCs parse near-perfectly; science
  TMCs with "OR" sequence-branches are messier but their C-IDs extract fine.
- **`cid_unverified` flags (25 across the set)** are KEPT as a deliberate
  **discrepancy signal** (Sam: "an indicator that perhaps C-ID needs updating, or
  otherwise") — usually a 2026 TMC (e.g. Music Industry Studies, 10/10) whose codes
  post-date our 2026-05 descriptor extract.
- Result: **45/45 `draft`** (756 slots), 0 planned. Footer-cut at "TOTAL MAJOR
  UNITS", section regex tolerates a "Courses:" prefix (Chemistry), `PSY 205B`→
  `PSY 205 B` canonicalization, per-section dedupe by C-ID, GE-prefix strip on
  non-C-ID titles. Tests still 34/34 (Part A evals the real file).

## Session 59 cont. — Status indicator + 45-TMC catalog (2026-06-16)

Sam asked for "a Status indicator for each TMC" and sent the official **TMC
download .docx** (89 embedded links). Extracted all 45 TMC template URLs from
`word/_rels/document.xml.rels` (the `.docx` is a zip; hyperlink targets live in
the rels, display text in `document.xml`).

- **Catalog grew to 45 TMCs**: the 8 detailed (`draft`) + 37 `planned` stubs
  (id + discipline + status), each mapped to its official-template PDF in
  `_meta.sources`.
- **Status model** (`tmcStatus()` in `tmc_builder.js`): `official` (encoded from
  the authoritative template) / `draft` (sections present, faculty-verify) /
  `planned` (catalog only). Surfaced as: optgroups in the picker (**Available now
  (8)** / **Coming soon (37)**), a status chip in each option + the form header,
  an "**N of 45 built**" legend, and a **Coming soon panel** (with the
  official-template link) when a planned TMC is selected.
- **Blocker that remains**: c-idsystem.org **Cloudflare-blocks** automated fetch
  even for direct PDF URLs and even with a browser UA + sandbox off (403, 101-byte
  challenge page). So the 37 can't be auto-encoded — **Sam needs to upload the
  PDFs** (he can, like the .docx) and a session parses + encodes them. Until then
  they're honest `planned` stubs that link out.
- Test grew 27 → 34 assertions; no HTML changed → Rule 4 intact.

## Next concrete steps

- **Faculty verification of the 8 seed TMCs** + author the remaining ~37 from the
  C-ID TMC master list (append to `tmc_templates.js`). Best done by someone who
  can read the official templates (they 403 automated fetch).
- A small **"N of your courses carry a C-ID in COCI"** coverage hint + the
  title-similarity suggested-fill for sparse colleges (#3).
- Optional **statewide adoption view** off `tmc_submissions` (which colleges have
  aligned which TMCs) — privacy is trivial here (no PII), unlike the EACR.
- Wire a **contact-name/email + notes** capture into the form (columns already
  exist) and a "mark submitted" status.

---

## Session 61 — Bruh Skymarker: the per-college approved-ADT overlay (2026-06-18)

Sam-interactive. Sam supplied the **COCI program export** (the second COCI
principal set — *program*, alongside the *course* set we already had as
`coci_course_list.xlsx`) and asked: is it in our library, and use it as the
**authoritative source for which colleges have an approved ADT** on the TMC tab.
Answer to "did I add it?": **no** — this PR adds it.

**What shipped (one PR, code + the static artifact + provenance CSV):**
- `tmc/_build_college_adts.py` → `tmc_college_adts.js`
  (`window.CPL_TMC_COLLEGE_ADTS`, lazy). Distills the program export's ADT rows
  (`AWARD ∈ {A.A-T, A.S-T}` ∪ `SUB AWARD ∈ {ADT Degree, A.S. UCTP Degree}`) into
  `by_college[college][tmc_id] → {b,s,c,a,u,t}` + `tmc_totals` + `extra_tmcs`.
  **3,238 (college,TMC) pairs · 115 colleges · 42 ASCCC TMCs + UCTP.**
- TMC tab (`tmc_builder.js`): a directory **ADT column** (the college's status
  when one is picked; the **statewide approved-college count** in review mode), a
  prominent **status banner** on the TMC detail (`adtBannerEl`), a **"this
  college's approved ADTs / not yet established"** Show-filter, and the UCTP
  **pathway detail** (`renderPathwayDetail`).
- `tests/tmc_college_adts.test.js` (30 checks): Part A locks build-correctness
  invariants on the *committed* artifact (no orphan tmc_ids, every college joins
  the tab list, valid buckets, UCTP-as-own-instance); Part B drives the new UI.

**Decisions (Sam, 2026-06-18):**
- **"Approved" = COCI STATUS ∈ {Active, Approved}.** Also surface ⏳ in-progress
  (Submitted/Review/Revision/Draft) + ◐ teachout; **Inactive kept in data, hidden
  in UI.** Dedup per (college,TMC) keeps the most-affirmative bucket (a college
  mid-transition from an old inactive to a new active reads ✓ Approved).
- **UCTP gets its own instances.** Sam's mid-build correction: "Chemistry for UC
  Transfer needs its own instance." UCTP = the *UC Transfer Pathway* (sub-award
  "A.S. UCTP Degree", TOP "…for UC Transfer"), a UC instrument, **not** an ASCCC
  ADT-T. So `uctp-chemistry` / `uctp-physics` are `extra_tmcs`
  (`kind:"uc-transfer-pathway"`), never folded into Chemistry/Physics. Public
  Health Science + Elementary Teacher Education (plain) **did** fold into their
  nearest TMC per Sam's Q2 call.

**Matching that worked:**
- **TOP code is the bulletproof key, not freehand titles.** Title normalization
  alone matched 93/197 distinct titles; TOP-code corroboration + folding the
  Social Justice Studies concentrations + a small alias map → **3,814/3,819 rows
  (99.9%)**. Each TMC discipline maps to ~one modal TOP at ~100%.
- **College-name reconciliation is the loose-data tax.** The program export uses
  short labels ("L.A. CITY", "SAN FRANCISCO CITY", "MIRA COSTA"); the tab joins on
  the full *course*-export names ("Los Angeles City College", …). Resolver =
  normalize() vs the tab's own college list + a consult of
  `kb/college_short_names.json` + a 13-entry explicit fallback; any unresolved
  college **fails the build loud** (so a future extract can't silently drop one).

**Taxonomy recommendation (Sam asked for pushback).** Sam floated a Supabase
college-name taxonomy. Recommendation: **keep it committed JSON** (extend
`college_short_names.json`) — the consumers are the cron + static builders
(CI/offline), where a committed file is zero-dependency, diffable, Obsidian-synced,
and college identity rarely changes. Promote to a Supabase overlay **only if** live
curator editing of name-variants becomes a workflow (the `kb_curation` pattern).
Kept the program→tab aliases in the builder for now to keep this PR one-concern; a
focused `college_short_names.json` alias-hardening pass is the clean follow-up.

## Next concrete steps (Session 61 → 62)
- **Faculty-verify the draft TMCs**, then the ADT overlay reads even better
  (Official template + your approved ADT side by side).
- **Refresh cadence**: the overlay is a snapshot — re-run
  `python3 tmc/_build_college_adts.py` on a fresh COCI program extract (drop the
  new CSV in `tmc/source_data/`, update `SRC_CSV`).
- **Taxonomy follow-up**: harden `kb/college_short_names.json` with per-source
  COCI-program aliases + regen `college_short_names.js`, so every loose dataset
  resolves through one authority (the down-payment on Sam's taxonomy ask).
- **UCTP depth**: if faculty want a UCTP slot-by-slot builder, source the UCTP
  templates (we only host the COCI standing today).

---

## Session 66 — Skylander: split Active vs Approved program status (2026-06-20)

Sam-interactive. Building on the Session 61 ADT overlay, Sam chose to make the
per-college program status **faithful to COCI's two distinct affirmative
states** instead of collapsing them into one badge:

- **Active** (`STATUS = "Active"`) — approved AND live in the college catalog
  (students can enroll). **2,867** of the 3,238 (college,TMC) pairs.
- **Approved** (`STATUS = "Approved"`) — CO-approved but **not yet activated**
  in the catalog (pending). **218** pairs across **40 of 44** TMCs — previously
  invisible (indistinguishable from live ADTs).

**What shipped (one PR, code + the static artifact):**
- `tmc/_build_college_adts.py` — split the old `approved={Active,Approved}`
  bucket into `active` + `approved`; `BUCKET_RANK` makes **Active outrank
  Approved** in the per-(college,TMC) dedup (a college with a live ADT reads
  "Active" even if a newer revision is pending). `tmc_totals` now carries both
  counts; `colleges` (the truthiness gate) is unchanged in value
  (active+approved == old approved). Added a bucket tally to the run summary.
- `tmc_builder.js` — `ADT_BADGE` gains **✓ Active** (green `adt-ok`) and
  restyles **✓ Approved** to a distinct teal `adt-appr` (chip + banner CSS).
  The detail banner gets an Active branch ("…has an **active** … ADT (live in
  the catalog)…") ahead of the Approved one ("…**is approved** — pending
  activation in the catalog…"). The statewide review banner + directory cell now
  show the **established** count (active+approved) and surface the split
  ("N active · M approved (pending activation)") only when pending ones exist;
  the review banner handles the in-progress-only edge case cleanly.
- `tests/tmc_college_adts.test.js` — Part A valid-bucket set gains `active`; the
  Business-Admin invariant checks `active+approved > 50`. Part B adds a third
  mock TMC so all three surfaced states are covered (active / approved-pending /
  none) + a teal-banner assertion. **30 → 33 checks; full suite 59 files green.**

**Why it's a static-artifact PR (not code-only):** `tmc_college_adts.js` is NOT
a daily-cron artifact (the cron doesn't rebuild it), so the regenerated overlay
**must** be committed — unlike the `unified_courses_*` artifact policy.

**Next concrete steps (Session 66 →):**
- The directory header still reads "Approved (CA)" — kept as a colloquial
  shorthand (cell tooltip breaks down active vs pending). Rename to
  "Established (CA)" if Sam prefers.
- Teachout (25) + in-progress (99) remain their own buckets; a future "pipeline
  view" could foreground the in-progress/teachout lanes (the parked Session-61
  "Pipeline & teach-out focus" direction).

## Session 66 cont. — Skylander: TMC template structure + flexibility metadata (2026-06-20)

Sam set the priority — a **CO-staff ADT review/processing tool**
([scope](kb-notes/tmc-co-review-scope.md)) grounded in the ASCCC acceptance
ruleset ([rules](kb-notes/reference-adt-acceptance-rules.md)). The first build
step (Sam: "kick off tmc") is making `tmc_templates.js` carry the structure the
Phase-2 acceptance engine needs.

- **`refine_slot()` in `tmc/_parse_tmc_pdfs.py`** post-processes every non-C-ID
  slot into one of: (1) **recover an embedded C-ID** — an explicit inline
  "…C-ID AFS 100", or a stray VERIFIED token like "ARTS 230" sitting in a clean
  specific title → promote to a real `cid` slot; (2) **flag a FLEXIBLE proviso**
  ("any articulated major-prep / CSU-transferable course", "another … course")
  `flexible:true` — acceptance-engine tier 2 (accept any qualifying course +
  ASSIST evidence); (3) leave genuine specific non-C-ID example courses.
- **Results:** C-ID slots 569 → **584** (15 recovered); **African American
  Studies 0 → 3** — the *only* 0-C-ID template, and the bug was simply that its
  C-IDs were inline in the title text ("…C-ID AFS 100"), not in their own cell;
  **119 flexible** slots flagged; per-TMC **`flexibility: 'fixed'|'flexible'`**
  (5 fixed: Chemistry / Computer Science / Environmental Science / Geology /
  Music Industry Studies). *(My earlier "Math/Biology/Business have 0 C-ID slots"
  was a false alarm — a `discipline`-exact-match bug in a throwaway probe; those
  templates carry a "2.0" suffix the COCI ADT titles lack. They were never broken.)*
- **Faithful-to-the-PDF nuance:** the 2019 ASCCC paper calls ECE "zero
  flexibility," yet the live 2023 ECE template has a "maximum of two … articulated"
  allowance → we classify on the **actual PDF**, not the doc's illustrative example.
- Order in `refine_slot` matters: explicit inline C-ID first; **then** flexible
  flagging (so an *example* C-ID named inside an "any … such as …" proviso stays
  flexible — the Sociology `SOCI 125` case); token-recovery only on clean
  specific titles.
- Test: `tests/tmc_templates_structure.test.js` (9 checks — no 0-C-ID templates,
  recovered C-IDs present, flexible/flexibility invariants). Suite 59 → 60 files.
- **Next:** the Phase-2 **acceptance engine** consumes `flexible`/`flexibility`
  (C-ID match = mandatory accept · flexible slot = accept-with-ASSIST · descriptor
  comparison = human) + the structural checklist; and the **bulk PCF** (Playwright)
  for the current-state bootstrap.

## Session 69 — Bruh Stargaze: title-fill recovery for approved ADTs + the Status/ADT consolidation (2026-06-22)

Sam-async (he set the direction, then left for a meeting; "act on your best
judgement … exploratory … doesn't impact prod"). Three asks, all in
`tmc_builder.js` (STATIC — no HTML/Rule-4 touch, not a cron artifact; live on
the next Pages deploy):

1. **Default `Show` = "✓ This college's approved ADTs."** `state.statusFilter`
   defaults to `adt-yes`. It's college-gated (meaningless without a college) and
   falls back to `all` until a college is picked AND the ADT overlay has loaded
   (`renderList`: `(!state.college || !adtData())`). So: land on All-colleges →
   all TMCs; pick your college → your approved ADTs (the screenshot state). No
   "my college" concept exists, so the *filter* default is the realizable "default
   view" — it engages the moment a college is chosen.

2. **Title-fill recovery on approved ADTs (the meaty one).** Approval implies every
   course was CO-vetted, but the CO keeps no parseable PDF and COCI often doesn't
   record the C-ID → the slot can't C-ID auto-match even though the course exists.
   New second pass `titleAutoFill()` (after the C-ID `autoMatch()`, wrapped as
   `autoPopulate()`): for colleges with a **real ADT presence** in that discipline —
   established (active/approved/teachout → courses CO-vetted) OR **in-progress**
   (building it; widened from approved-only when Sam said "yes to in-progress also",
   S69) — fill each blank C-ID slot with the best **title-matching** local
   course. Flagged **`≈ title-matched — verify C-ID`** (new `tmatch` status cls,
   blue) — *never* `✓ C-ID aligned`; a headstart, not a claim.
   - **Matcher:** token-set Jaccard with a tiny stopword set + **light stemming**
     (`introductory|introduction|intro → intro`, `fundamental(s)`, `principle(s)`),
     threshold **0.72**, ties broken by same-subject-as-the-C-ID then units-in-range,
     greedy with no double-assignment. `course._tt` memoizes per-course tokens.
   - **Measure-first (the pattern that worked):** validated against the real
     `tmc_college_courses.js` BEFORE building. **24,004** blank C-ID slots on
     active/approved ADTs → **~5,250 title-filled (21.9%)**, **84% exact-title**;
     stemming added ~250 (the very common `Introductory X` ↔ `Introduction to X`
     C-ID pattern). Fuzzy band (0.72–0.99) is overwhelmingly the same course under a
     different local subject code (`PSY 200 Research Methods → PSYC 12 Research
     Methods in Psychology`); imperfect ones (lab vs lecture) carry a units-differ
     sub-flag. **0.72 rejects the near-misses** (`SOCI 125 Intro to Statistics in
     Sociology` ≠ `SOC 101 Intro to Sociology` @ 0.67). Sam's exact example —
     Allan Hancock `AJ 200 Introduction to Corrections → AJ 130 Introduction to
     Corrections` — fills at J=1.00.
   - Surfaced: per-slot `tmatch` pill + a `≈ title-matched` legend entry + a meter
     count + an explainer note in the form (only when an approved ADT has title-fills).
     `statusFor` computes the title match directly, so it also labels a *manual*
     same-title pick — no extra state.

3. **Consolidated the Status + "This college's ADT" columns (Sam: "please advise").**
   The standalone **Status** column read "⚠ Draft" for all 45 TMCs → pure noise.
   Removed it; moved the positive signal **inline** next to the TMC name and only
   when it carries meaning (**✓ Official** / **◆ UC Transfer Pathway** — the uniform
   Draft is covered by the global "· Draft" h2 disclosure). The single ADT column now
   also folds in the old Draft *meaning* Sam described — a not-established TMC reads
   **`○ Potential`** ("open it to pre-populate the aligned C-IDs and build a
   submission") instead of a bare `—`. One column covers all bases: established →
   COCI status badge; not-established → a build-it opportunity. **My advice to Sam:**
   the consolidation is the right call (the uniform Draft column was noise; the
   Official chip returns as a real signal the day faculty verify a template). Fully
   reversible if he prefers the separate column back.

- Tests: new `tests/tmc_title_fill.test.js` (15 checks — exact + stemmed recovery,
  C-ID still wins, no false fill, the explainer/legend/meter, and the **scope gate**:
  a college without an approved ADT gets NO title-fill though the same titles exist
  locally). `tests/tmc_college_adts.test.js` updated for the new default + the
  `○ Potential` cell + the removed Status column. **Suite 61 → 62 files green.**
- **Sam's calls (afternoon review — all settled):** (a) **keep the consolidation**;
  (b) **extend title-fill to in-progress ADTs too — DONE** (gate widened to any real
  ADT presence via `adtFillEligible` = `adtShown`; the explainer note is now
  status-aware — "building this ADT (<status>)" for in-progress vs the CO-vetted
  framing for established); (c) the `12/6` select-N counter — **leave as-is until Sam
  checks it** (pre-existing — auto-match + title-fill populate *every* matchable slot,
  not just the `select N`; deselect extras).

## Session 69 (Bruh Stargaze, 2026-06-23) — title-fill + the COR-upload reframe

Title-fill recovery (#489/#490) is documented above. Net: a college that holds **or is
building** an ADT gets blank C-ID slots pre-filled from title matches (`≈ verify`), and
the directory's Status column folded into the ADT column (`○ Potential`…).

**The strategic reframe — TMC tab as ADT intake (#491, scope-only).** The CO keeps no
queryable store of completed ADT applications, and **contact hours** are absent from every
structured source we hold (COCI / PCF / C-ID descriptors — they live on the per-course
**COR**). So rather than reverse-engineer hours forever, make the tab the **intake that
mints the structured data**: every in-tool submission is born structured (the
`tmc_submissions` alignment jsonb) **plus a COR attached per course** for the hours. That
needs a **document-upload layer** — scoped in
[`docs/kb-notes/tmc-adt-document-upload-scope.md`](kb-notes/tmc-adt-document-upload-scope.md):
Supabase Storage **private** bucket + a thin `tmc_submission_docs` index, **submitting
college uploads** (Sam's call, anon), reviewer 📄 COR link; two feeds (backfilled CO-queue
PDFs + forward uploads) on one model; phasing (capture+surface → parse-for-hours, which is
format-dependent). Schema of record: `tmc/supabase_tmc_submission_docs.sql` (proposed, not
applied). Plus the honest **COCI-embed/SSO** analysis: an embed *can't sniff* COCI's
session (cross-origin) — it's a CCC-Tech-Center partnership via OIDC/LTI/signed-token, so
build standalone-with-our-auth now behind a **swappable identity shim**, then pitch the
embed as the graduation step with the prototype in hand.

**Still queued:** the Phase-2 **acceptance engine** (Sam: "Go for A") — per-slot verdicts
from `slot.flexible` + `t.flexibility` (#479) + the structural checklist + the bulk-PCF
Playwright extractor. Hours stay a manual flag until the COR-upload layer lands.

---

## 2026-07-01 (Session 90, SkySherpa) — the c-id.net authority doubles right-side C-ID coverage

**Ask (Sam, from the Saddleback AoJ screenshot):** the right-side pickers show many
NULL alignments (only 2 of 6+ AoJ slots auto-filled). Can our datasets complete them?

**Diagnosis.** Auto-match was keyed **only** on COCI's `CIDNumber` column, which colleges
**under-report** (~1/4 report few/no C-IDs). We already held a second, unused authority:
`kb/reference/cid_articulations.json` — the **official c-id.net approved-courses export**
(28,070 articulations, supplied 2026-06-11, "same trust tier as COCI's CIDNumber"). It was
wired into the kb/CCR pipeline but **not the TMC builder**. Coverage measured:
`(college × C-ID)` distinct pairs = **10,627 COCI → 21,300 union (+100%)**; for the AoJ
slots specifically, +28 to +43 colleges *per slot*.

**Three gap types (only #1 is fillable by data):**
1. **Reporting gap** — college IS c-id.net-approved but COCI blank → the union fills it
   (8,307 courses gain a C-ID). This PR.
2. **Subject relabel** — course sits under a different subject (Saddleback teaches AoJ under
   `HS`/`SOC`, not `AJ`). C-ID match already crosses subjects; only the picker *label* reads
   "Select your AJ course" (cosmetic).
3. **Genuine absence** — no C-ID-approved local course exists (Saddleback's `AJ 120/122/…`
   are absent from BOTH authorities). No course dataset closes these; the approved-ADT
   evidence lives in COCI's **program** export, which carries no course-to-slot map. (We do
   NOT hold the CCCCO **MIS Master Program/Course** table; MIS carries CB-codes/transfer
   flags, not C-ID, so it wouldn't add C-ID coverage anyway.)

**Build (`tmc/_build_college_courses.py`).** Union each course's COCI `CIDNumber` with the
c-id.net C-IDs joined on `(college, subject, number)` EXACT + a leading-zero-normalized
fallback (`MATH 019 ↔ MATH 19`, +1,903 attaches). `sequence:true` rows excluded (a single
course isn't a standalone match for a sequence descriptor). A course can now carry >1 C-ID →
rows gain an optional 6th element `xcid[]` (primary `cid` for display; `xcid` = the extras).
Soft-fails if the c-id.net file is absent. Result: courses-with-a-C-ID **~doubled**
(→22,037); 9,924 gained a C-ID; 961 carry ≥2. All 469 distinct c-id.net C-IDs are recognized
(descriptor ∪ TMC slot cids) → **zero** new noise; the 6 "malformed" agriculture C-IDs
(`AG-PS 104 104`) line up with their equally-malformed `cid_unverified` slots.

**Consumer (`tmc_builder.js`).** `courseCids()`/`matchedCid()` match a slot against
`{cid}∪xcid`; `setCollege` registers a course in `byCid` under **each** of its C-IDs;
`candidatesFor`/`statusFor` use the intersection; the picker option shows the **matched**
C-ID (may be an xcid, not the primary). `autoMatch` now **used-tracks** so one physical
course can't auto-fill two slots (more likely now that courses are multi-C-ID). Test:
`tests/tmc_cid_articulations.test.js` (16 checks) guards xcid-match, used-tracking,
backward-compat, and the shipped-artifact contract.

**Limitation logged:** ~24% of c-id.net course-keys have no matching COCI course row (the
college doesn't list that course in COCI) → those articulations can't surface as a pickable
course. And genuine-absence slots (gap type #3) stay honest blanks.

---

## 2026-07-01 (Session 90, SkySherpa) — "OR" alternatives on the left side

**Ask (Sam):** some template courses are a **choice of "OR"** — one of two/three
courses satisfies a single requirement. Can the builder's left side show that?

**Finding — the machinery already existed; the data didn't.** The consumer
already fully supported per-slot `alts[]`: it renders "`X` or `Y`" (`tmc_builder.js`
`renderSlot`) and auto-matches a course carrying any of `{cid}∪alts` (`slotCids`).
But **0 of 756 slots carried alts** — the parser's OR-fold (`parse_body`, the
"line starts with `or `" heuristic) never fired, because the ASCCC PDFs render
"X OR Y" as a **multi-column layout** that `fitz` text-extraction scrambles, so
the "OR" tokens never line up with their C-IDs. 244 "OR"-lines exist across 41/45
PDFs → every one was flattened into independent slots.

**Approach — a curated overlay, extracted by visual PDF read.** Rather than fight
the column-scramble in code, I extracted the OR-groups by **reading the rendered
PDFs visually** — a Workflow fanned one extractor + one **adversarial verifier**
per template across all 45 PDFs (the verifier re-read the PDF to reject "select-N"
lists misread as ORs and flexible provisos). Output: `tmc/tmc_or_groups.json` — 80
verified groups, each with an evidence quote. This is the **"curated overlay"**
recommendation from the analysis (curriculum-authoritative data shouldn't be
guessed from mangled text).

**Fold (`tmc/_parse_tmc_pdfs.py:apply_or_groups`).** Per group, fold the members
into ONE slot: the first member that is an existing parsed slot becomes the `cid`,
the rest become `alts[]`; the other member-slots are removed. Guards + skips
(logged in `_meta.or_groups.skipped`):
- **no existing-slot anchor** — the parser missed the whole line (studio-art
  `ARTS 280/281/282`) → needs a manual slot-add, not a fold.
- **member overlap** — one course is an option in two lines (LPPS `COMM 120`) →
  can't fold into two anchors.
- **duplicate section names** — African American Studies has *two* "Required
  Core" sections; the apply resolves each group to the section that actually
  contains an anchor (a `name→section` dict silently dropped one — the bug that
  first wrongly-skipped AAS). Overlap is judged per section **object**, not name.

**Result: 77/80 folded** (3 skipped, all logged + legitimate). A structural diff
old→new confirmed **zero drift**: the only change is 77 slots gaining alts; no cid
lost, no non-C-ID slot touched. Missing-descriptor members (valid C-IDs the parser
missed, e.g. music `MUS 180`) are added as alts (the anchor stays an existing
slot — no fabricated slots). Tests: `tests/tmc_or_alternatives.test.js` (13) +
updated the AAS assertion in `tmc_templates_structure.test.js` (AFS 141 is now an
alt of AFS 140). Consumer needed **no change** — the alts plumbing was already there.

**Lesson — read the PDF, don't parse the text, for layout-encoded facts.** When a
fact lives in a document's *visual layout* (columns, "OR" adjacency) that text
extraction destroys, a visual read (per-item, verified) beats ever-more-elaborate
text heuristics. The Workflow's adversarial-verify stage was load-bearing: it
caught the "select-N list ≠ OR-group" and "flexible proviso ≠ C-ID OR" traps.

## 2026-07-01 (Session 92, StarFab) — the join ladder: every c-id.net approval lands, with graded provenance (#642)

Sam's follow-up on the same Saddleback AJ screenshot: the right side still looked
sparse. Two findings up front: the screenshot's *"Select a college to align a local
course"* rows were the **review-mode empty state** (no college picked), not failed
matches — and with Saddleback actually selected, the real defect was **SOCI 110
showing blank while c-id.net lists Saddleback's SOC 1/1H as approved**. Root cause:
the #639 union only attached c-id.net C-IDs to courses that EXIST in our COCI
extract; an approval with no COCI row **vanished silently**. Audit: **3,684
approvals unattached → 1,195 visible wrong blanks across 114 colleges**. The
biggest driver is the CCN transition: legacy intro-sociology rows have left the
COCI Active export while `SOCI C1000` rows haven't landed (8 statewide vs 144–185
for the Phase-1 CCN subjects).

**The fix — a precedence ladder** in `tmc/_build_college_courses.py`; every
non-sequence approval lands exactly one way (receipts in
`_meta.cidnet_join_lanes`): exact **18,157** → zero-normalized **1,903** →
**squashed full code 629** (`PHYS 223`+`F` ↔ `PHYS`+`223 F`; `C DEV` ↔ `CDEV` —
subject/number split drift from the c-id.net ingestion) → **strict unique-title
915** (subject renames SPCH→CMST, CCN renumbers — lands as the verify-tier
`tcid[]` 8th row element) → **synthesized flagged rows 1,986** (course absent
from the extract; 7-element rows, units unknown, `per c-id.net` badge). Plus:
**comma-joined COCI `CIDNumber` split** (46 rows like `'AJ 110, SOCI 160'` whose
primary could never match a slot).

**The adversarial verify earned its keep (again).** Round 1 (3 agents) caught a
real **blocker** in the draft title lane: stripping `honors`/`a` from titles let
approvals be captured by *sibling* courses — West Valley `HIST 017BH` (the B-half
honors) inherited the A-half's `HIST 130`; SBCC's 2-unit `Elementary Statistics A`
swallowed the honors full-course approval. **Lesson: uniqueness of a normalized
title is only meaningful under STRICT equality — every token you strip is a
dimension a sibling can hide in**, precisely because the true owner is absent
(that's why the lane ran at all). Stripped-only matches now fall through to
honest synthesis. Round 2 passed; the 18 residual sibling-pattern title joins all
ship in the ≈ verify tier — which is the tier's job.

**Provenance is graded per C-ID** — the confidence-score foundation for the CO
review queue (`reference-tmc-confidence-data-requirements.md`): hard carrier →
`✓ C-ID aligned`; synth → `✓ aligned · per c-id.net — verify course & units`;
tcid → `≈ … verify` (never COCI-grade). `autoMatch` prefers hard > title > synth;
save/resume round-trips `course_cids`/`course_tcids`/`course_src` (the flag used
to die on resume). Post-fix: **0 unattached approvals · 0 visible wrong blanks ·
0 comma primaries**. Saddleback AJ: SOCI 110 fills via synth SOC 1/1H, SOCI 125
via its MATH 110 OR-alt (#640), AJ 120–160 stay blank **because that's true**.
Suite 118 files green (+`tests/tmc_cidnet_synth.test.js`, 31 checks).

**Follow-ups:** directory `coverageFor` counts verify-tier carriers same as hard
(cosmetic inflation — fold into the Phase-2 confidence engine); the 3 skipped
OR-groups still need Sam's faculty-verify calls; a FRESH COCI extract (+ hours
columns if exportable) is the top data ask — see the data-requirements note.

## 2026-07-01 (Session 92 cont., StarFab) — the confidence engine ships (same-day "Let's build:)")

Sam's green light with three ground rules: hours as a **placeholder** (COCI master
report requested, don't hold breath), roll with the current COCI extract, and the
CO has **no extract of pending files** ("old school") → use our COCI In-progress
pairs as the queue. Shipped the engine end-to-end the same day:

- **College side:** `confidenceFor()` verdict tiers per the ASCCC ladder (✓ auto ·
  ≈ verify · 📎 evidence · ⚠ review · open) with chips on every slot; readiness
  mix + gates on the meter; **submit blocks** on select-N, per-list units floors,
  and the ≥18-major-units STAR gate; capture inputs for **hours** (placeholder),
  **units** (unknown-units synth courses — the gate remedy), and **evidence**
  (flexible slots). All round-trip save/resume; cleared when a slot's course changes.
- **CO side:** the New-requests queue ranks by readiness mix (`_readiness` in the
  jsonb, PostgREST-selected as `alignments->_readiness`), rows expand to the
  five-check panel (provenance + matched C-ID + college-entered values flagged),
  **Approve / Return + note**, and the **⏳ In-progress backlog proxy** ranked by
  computed coverage.
- **The adversarial verify caught two blockers pre-merge (third time this session
  the pattern paid):** ① **stored XSS** — `_readiness` is anon-writable jsonb and
  its "numbers" were interpolated into innerHTML unescaped (`(v.auto || 0)` passes
  a non-falsy string straight through) → `rNum()` coercion + a malicious-payload
  regression test; ② **forgeable approvals** — the PATCH rode the table's
  always-true anon UPDATE, so anyone with the public key could stamp "✅ approved"
  → the `tmc_review_submission` SECURITY DEFINER RPC (`is_allowed_reviewer()`,
  `reviewed_by` from the JWT), anon policies narrowed WITH CHECK
  (draft|submitted), review columns revoked from direct API writes. **Lesson: the
  moment a UI action becomes an AUTHORITY CLAIM (a CO approval), UI-gating is no
  longer enough — move it server-side even when the table's anon-write design was
  deliberate for the college flow.** Also fixed from the verify: legacy-tier
  overshoot (non-C-ID slots can never be rule-1 auto), open-slot dilution in the
  triage ranking, the 18-unit dead end for CCN-transition colleges, cid_unverified
  auto-downgrade, rule-2 vs rule-3 wording, stale capture values on course change.
- **Known honest limits:** the 18-unit gate uses local unit values (quarter
  colleges are under-gated — wording says so; calendar detection needs data we
  don't hold); evidence is free text (CO reads it — not auto-trusted); hours never
  scored until the COCI report lands.

Suite 119 files green (`tests/tmc_confidence.test.js`, 38 checks). Schema:
`tmc/supabase_tmc_submissions.sql` (2 migrations applied live).
