# A catalog's printed courses (S690)

`<slug>.json` holds every course a college's catalog prints, one row per course, read where the nightly script reader
is refused. The slug is `slug_of()` in `kb/_program_requirements_college.py`, as one folder up. These files are a
catalog's course descriptions. Course outlines (SLOs and objectives) are a different filing, in `../outlines/`, and the
blocked-catalog hunt counts outlines only, so a file here clears nothing from it.

## What a row holds

`college`, `catalog_year`, `subject`, `subject_name`, `code`, `title`, then `hours`, `units` or `credits` as the page
prints the measure, `requisites` (each printed Prerequisite, Corequisite, Advisory or Recommended Preparation line),
`description`, `source_url`, `read_at` and `run`, the run whose log holds the page. A row whose requisite printed inline
ahead of its description names `requisite_split` and keeps the line as printed in `requisites_printed`. Every printed
course is kept, offered or not.

The file's header says how its pages were read and parsed, who read them and when, the runs, and what the pages do not
print.

## How the pages were read

Through `college-page-read.yml` on a GitHub runner, with a plan under `kb/college_reads/`, for example
`noce_course_descriptions_*.json`. The census Reader asks for robots.txt first with a plain request and stops at a WAF
challenge header, waits 4 s between loads and names the CPL Initiative in its user agent. Each subject page prints
line for line through the plan's `capture_view`, with `capture_lines` raised so a long page prints whole. A session
downloads the whole log (`gh run view <run> --log`) and parses it. On 2026-11-20 the runner got HTTP 200 with content
from catalog.nocccd.edu, while the session sandbox got 202 with AWS WAF's check page. The runner was served no check
and passed none.

## Who reads these files

The M-ID description pipeline (the M-ID cards with no description) and the "no longer offered" catalog factor, which
joins on `code`. The plain session and COBIx wire them in.

## Filed

- `north_orange_continuing_education.json`: NOCE 2026-2027, 48 subject pages, 1,089 courses (runs 44756513382 and
  44757980757; Sky, S690).
- `southwestern.json`: Southwestern 2026-2027, 86 of 89 subject pages, 1,692 courses (run 44759854547; Sky, S690).
- `clovis_community.json`: Clovis 2026-2027, 473 courses from the college's catalog PDF (run 44759950664).
- `los_angeles_city.json`: Los Angeles City 2026-2027, 1,123 courses from the college's catalog PDF (run 44759950664).
- `los_angeles_valley.json`: Los Angeles Valley 2026-2027, 939 courses from the college's catalog PDF (run 44759950664).
- `east_los_angeles.json`: East Los Angeles 2026-2027, 1,676 courses from the college's catalog PDF (run 44762233563).
- `los_angeles_harbor.json`: Los Angeles Harbor 2026-2027, 765 courses from the college's catalog PDF (run 44762233563; its
  Sept 10 addendum is not in the file).
- `los_angeles_southwest.json`: Los Angeles Southwest 2026-2027, 724 courses from the college's catalog PDF (run
  44762233563).
- `los_angeles_mission.json`: Los Angeles Mission 2026-2027, 798 courses from the college's catalog PDF (run 44763620806).
- `los_angeles_pierce.json`: Los Angeles Pierce 2026-2027, 414 courses from the college's catalog PDF (run 44763620806).
- `los_angeles_trade_technical.json`: Los Angeles Trade-Tech 2026-2027, 1,099 courses from the college's catalog PDF,
  pages 238 on (run 44763620806).

- `west_los_angeles.json`: West Los Angeles 2026-2027, 719 courses from the college's catalog PDF: credit pages 155 to
  230 (run 44764775167) and noncredit pages from 231 (run 44763620806).
- `el_camino.json`: El Camino 2026-2027, 1,442 courses from Sam's hand-fetched copy (COBIx's text gist, run
  44762315427), whose course pages print one column. The Fall and Summer 2026 addenda are not read.
- `monterey_peninsula.json`: Monterey Peninsula 2026-2027, 76 of 78 subject pages, 1,137 courses (run 44765198579).
- `long_beach_city.json`: Long Beach City 2026-2027, 123 of 128 subject pages, 1,595 courses (run 44765123063).

Mission, Pierce, Trade-Tech and West Los Angeles were read from the colleges' own PDFs, which the program capture already reads. Sam's hand-fetched copies
(COBIx's gists) print two columns side by side (`pdftotext -layout`), which this parse does not split.

A PDF college's rows come from the page read's pypdf text (plan keys `pdf_unfolded`, `pdf_page_cap`). Each file names
its heading and units patterns (`parse`) and how many units lines no heading claimed (`units_lines_unclaimed`, an upper
bound on the courses the parse missed, since front matter prints a few such lines too). `entry_printed` keeps each entry
as printed; `requisites` and `description` are split from it on a best-effort reading.
