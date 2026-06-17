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
