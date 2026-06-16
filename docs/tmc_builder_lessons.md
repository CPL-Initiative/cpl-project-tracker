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
