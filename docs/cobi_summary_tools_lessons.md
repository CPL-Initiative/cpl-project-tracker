---
title: COBI summary-data tools — lessons & roadmap
created: 2026-08-03
updated: 2026-08-03
tags: [lessons, cobi, summary-data, credential-reference, apprenticeship, slides]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[methodology-college-apprenticeship-cpl-roster]]"
artifacts:
  - kb/_college_apprenticeship_cpl_roster.js
  - kb/apprentice_roster_out/american-river-college.json
---

# COBI summary-data tools — lessons & roadmap

Workstream scratchpad. Append a dated section every checkpoint.

## 2026-08-03 — SkyCobi: ARC apprenticeship-CPL slides (the seed)

### What was asked
Sam needed, for a presentation, **which programs at American River College have
CPL for apprentices** — examples for a slide like the existing "ARC / NorCAL
Carpenters Training · 10 Programs with CPL · Over 120 Exhibits" card. Sierra
"does not have access to COBI data currently," and the EACR/Common Exhibit
Reference **tab filters weren't working**, so he couldn't self-serve it.

### What we did
- Pulled the answer **straight from the source artifacts** (bypassing the broken
  tab filters): `credential_reference_data.js` (the Common Exhibit Reference
  export) + `coci_programs_data.js` + `kb/reference/coci_program_course_file.csv.gz`.
- **Decoded the slide's numbers:** "Over 120 Exhibits" = **120 distinct CTCNC
  (NorCAL Carpenters) exhibits** at ARC (exact); "10 Programs" ≈ the NorCAL
  Carpenters **apprenticeship associate-degree family** (Sam's hunch — "associate
  degree programs in the trades" — was right).
- **Findings (as-of the daily bake):** ARC apprentice CPL spans **5 sponsors ·
  149 exhibits · 149 courses**, feeding **~13 associate-degree apprenticeship
  programs**. NorCAL Carpenters (CTCNC) is the flagship: **120 exhibits → 8
  A.A./A.S. degrees** (Carpenter, Acoustical Installer, Pile Driver, Scaffold
  Erector, Mill & Cabinet Maker, Hardwood Floor Layer, Drywall/Lathing,
  Millwright) + cert-only trades (Office Modular Systems, Insulator, Shingler).
  Other sponsors: Iron Workers (16→Ironworkers A.A.), Elevator/NEIEP (9→Elevator
  A.A.), Sheet Metal/UA Local 342 (3→2 A.A.), Electrical/IBEW (1→Electrical A.A.).
- **Built 2 slides** (PPTX, CCCCO-branded): slide 1 = the 8 A.A./A.S. NorCAL
  Carpenters degrees; slide 2 = ARC as the statewide flagship (5·149·13 + the
  sponsor table). Delivered `20260803_ARC_Apprenticeship_CPL_Slides.pptx`. Sam
  removed the CO seal (already on his master slide).
- **Committed the reusable extraction** as `kb/_college_apprenticeship_cpl_roster.js`
  (parameterized by college) — the seed of the tool below.

### What was learned (durable → KB note)
[[methodology-college-apprenticeship-cpl-roster]] — the three-artifact join, and
the load-bearing caveat that **the program→course join is a LOWER BOUND** (the
COCI program-course file is partially populated; ARC's Scaffold Erector &
Hardwood Floor Layer degrees were absent from it despite genuinely having CPL
courses). Corroborate any degree count against the by-subject sponsor rollup +
COCI program titles before quoting it.

Tooling gotchas: `execSync('zcat')` overflows on the 8 MB gz (use
`zlib.gunzipSync`); `/Active/i` matches `"Inactive"`; PPTX render QA — LibreOffice
can't load files in this sandbox, so we rendered an **HTML twin via the
pre-installed Chromium** for visual QA (fonts approximate; PPTX passed schema
validation + content QA).

### Strategic roadmap — the COBI summary-data tool Sam wants
> Sam: "I will want to come back to this later to **build tools in COBI to more
> easily access summary data like this**."

The join above is the spec. Candidate builds, smallest-first:
1. **CLI/report generalization** — `_college_apprenticeship_cpl_roster.js`
   already runs for any college; wrap a tiny batch to emit all colleges'
   rosters → `kb/apprentice_roster_out/`. (Cheap; do first.)
2. **A "College CPL Summary" drawer/tab in COBI** — pick a college, see:
   sponsors → exhibits → courses → degree/certificate programs, with the
   lower-bound caveat surfaced. Reuse the Common Exhibit Reference data already
   loaded client-side; join the COCI program layer.
3. **Slide/one-pager export** from that view — the ARC deck generalized (the
   pptxgenjs generator in this session is a starting template), so any college's
   apprenticeship-CPL summary is one click.
4. **Close the source gap** — the partial `coci_program_course_file` is the
   accuracy ceiling; the full CO multi-college export
   (`kb/_fetch_program_course_files.py` / the CO deliverable) upgrades the
   program layer from lower-bound to census.

### Next concrete step
When Sam picks this up: start with (1) the all-colleges batch (trivial off the
committed script), then scope (2) the COBI drawer against the CER tab's existing
client data. Confirm whether "programs" should mean **associate degrees only**
(this session's framing) or **all credentials incl. certificate ladders**.
