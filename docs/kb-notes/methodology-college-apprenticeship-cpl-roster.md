---
title: Answering "which programs at <college> have CPL for apprentices?" — the three-artifact join
created: 2026-08-03
updated: 2026-08-03
tags: [methodology, credential-reference, coci-programs, apprenticeship, summary-data, cobi]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cobi_summary_tools_lessons]]"
  - "[[reference-issuing-agency-authority-sources]]"
artifacts:
  - kb/_college_apprenticeship_cpl_roster.js
  - credential_reference_data.js
  - coci_programs_data.js
  - kb/reference/coci_program_course_file.csv.gz
---

# Answering "which programs at &lt;college&gt; have CPL for apprentices?"

> **One-sentence summary** — the Common Exhibit Reference is keyed by EXHIBIT,
> not by college or academic program, so a college-program question is a
> three-artifact join (exhibits → college courses → COCI programs), and the
> program layer is a *lower bound* because the COCI program-course file is only
> partially populated.

## Context

Sam asked (for an ARC / NorCAL Carpenters slide) **which programs at American
River College have CPL for apprentices**. Sierra/the EACR tab couldn't answer it
directly (filters weren't working, and the tab curates *exhibit identity*, not a
college-program roster). The data is all in the repo — it just isn't pre-joined
into a "college → apprenticeship programs" shape. This note captures the join so
the next person (or a future COBI summary tool) doesn't re-derive it.

## The claim — three artifacts, joined

1. **`credential_reference_data.js`** (the Common Exhibit Reference export) is
   keyed by `ut` (unified credential/exhibit title). Each row carries `issuer`
   and `articulations[].local[]` = the LOCAL college courses (`subj`/`num`/`t`/
   `u`/`colleges[]`) that grant CPL for that exhibit. **Filter to your college +
   an apprenticeship signal** — issuer matches a Joint Apprenticeship Training
   Committee / building-trades union / `CTCNC`, OR the title matches
   `/apprentice/`. This yields the **EXHIBITS** ("Over 120 Exhibits") and the
   **COURSES** that grant CPL. Group by issuer for the **sponsor** rollup.

2. **`coci_programs_data.js`** is the COCI program inventory — one row per
   degree/certificate: `[collegeIdx, ctrl, title, top, cip, awardIdx,
   statusIdx, units, xfer, cte]`, with `colleges`/`awards`/`statuses` lookup
   arrays. **College is stored WITHOUT the " College" suffix** (`AMERICAN
   RIVER`). This is the **DEGREE/CERTIFICATE** layer (the "programs").

3. **`kb/reference/coci_program_course_file.csv.gz`** is the program→course
   membership (`ProgramControlNumber` × `CrsId`, where `CrsId` = `SUBJ`+`NUM`,
   e.g. `CARPT107`). **Join the CPL courses from (1) onto it** to learn which
   PROGRAMS from (2) contain them.

`kb/_college_apprenticeship_cpl_roster.js` does exactly this, parameterized by
college name, and writes `kb/apprentice_roster_out/<slug>.json`. For ARC it
reproduced: **149 exhibits · 5 sponsors · 11 associate-degree programs** (NorCAL
Carpenters/CTCNC alone = **120 exhibits** — the slide's "Over 120 Exhibits").

## The load-bearing caveat — the program join is a LOWER BOUND

`coci_program_course_file.csv.gz` has **partial coverage** (per its builder
`kb/_build_program_course_graph.py`, the full multi-college export is still a CO
deliverable). A program can be **active and genuinely contain a CPL course yet
be absent from the file.** ARC proved it: **Scaffold Erector** and **Hardwood
Floor Layer** are active A.A. apprenticeships whose CARPT courses (260–268,
181–182) ARE in the CPL set, but the join didn't surface them — so the join
returned **6** CTCNC degrees while the true CTCNC degree family is **8**.

**Therefore: the program→course join is a floor, not a census.** Corroborate the
degree count two other ways before quoting it:
- **By-subject sponsor rollup** (each exhibit subject → its trade family), and
- **COCI program titles** — filter `coci_programs_data.js` to the college's
  trade TOP codes (`0945`, `0952.*`, `0956.*`, …) + `/apprentic/i` titles and
  read the award column directly.

The two-signals rule mirrors the house TOP doctrine: don't let one incomplete
signal gate a number a stakeholder will put on a slide.

## Gotchas

- **`execSync('zcat …')` overflows** on the 8 MB program-course file
  (`ENOBUFS`). Gunzip in-process (`zlib.gunzipSync(fs.readFileSync(...))`).
- **Exhibit ≠ course ≠ program** are three different grains. "120 exhibits" and
  "120 courses" happened to match at ARC (≈1:1 articulation), but that is not
  guaranteed — count distinct sets, don't assume.
- **`/Active/i.test(status)` matches `"Inactive"`** (substring). Guard with
  `… && !/Inactive/i.test(status)`.
- Numbers are as-of the daily `credential_reference_data.js` bake
  (`_generated_at`) — re-run the script rather than quoting a stale roster.

## Why it matters

This is the first worked example of pulling a **college-scoped apprenticeship-CPL
summary** out of the exhibit/program artifacts. Sam flagged wanting **COBI tools
to reach summary data like this more easily** — this join is the spec for that
tool. See [[cobi_summary_tools_lessons]].
