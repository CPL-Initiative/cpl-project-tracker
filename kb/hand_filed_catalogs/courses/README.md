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
