# A catalog's printed courses (S690)

`<slug>.json.gz` holds every course a college's catalog prints, one row per course, read where the nightly script
reader is refused. Each file is gzipped with `gzip -9n`, so the same JSON always gives the same bytes. Read one with
`json.load(gzip.open("kb/hand_filed_catalogs/courses/<slug>.json.gz"))`. `index.json` is uncompressed and lists every
college: its file, catalog year, source (runner HTML, runner PDF or Sam's copy), runs, course count,
`missed_upper_bound`, the sha256 of the JSON inside the gzip, and the read time. The slug is `slug_of()` in `kb/_program_requirements_college.py`, as one folder up. These files are a
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

A course a person pasted by hand is filed apart, in `../handed_over/courses.json`, and wins over the row here.

## Who reads these files

The M-ID description pipeline (the M-ID cards with no description) and the "no longer offered" catalog factor, which
joins on `code`. The plain session and COBIx wire them in.

## Filed

- `north_orange_continuing_education.json.gz`: NOCE 2026-2027, 48 subject pages, 1,089 courses (runs 44756513382 and
  44757980757; Sky, S690).
- `southwestern.json.gz`: Southwestern 2026-2027, 86 of 89 subject pages, 1,692 courses (run 44759854547; Sky, S690).
- `clovis_community.json.gz`: Clovis 2026-2027, 473 courses from the college's catalog PDF (run 44759950664).
- `los_angeles_city.json.gz`: Los Angeles City 2026-2027, 1,123 courses from the college's catalog PDF (run 44759950664).
- `los_angeles_valley.json.gz`: Los Angeles Valley 2026-2027, 939 courses from the college's catalog PDF (run 44759950664).
- `east_los_angeles.json.gz`: East Los Angeles 2026-2027, 1,676 courses from the college's catalog PDF (run 44762233563).
- `los_angeles_harbor.json.gz`: Los Angeles Harbor 2026-2027, 765 courses from the college's catalog PDF (run 44762233563; its
  Sept 10 addendum is not in the file).
- `los_angeles_southwest.json.gz`: Los Angeles Southwest 2026-2027, 724 courses from the college's catalog PDF (run
  44762233563).
- `los_angeles_mission.json.gz`: Los Angeles Mission 2026-2027, 798 courses from the college's catalog PDF (run 44763620806).
- `los_angeles_pierce.json.gz`: Los Angeles Pierce 2026-2027, 414 courses from the college's catalog PDF (run 44763620806).
- `los_angeles_trade_technical.json.gz`: Los Angeles Trade-Tech 2026-2027, 1,099 courses from the college's catalog PDF,
  pages 238 on (run 44763620806).

- `west_los_angeles.json.gz`: West Los Angeles 2026-2027, 719 courses from the college's catalog PDF: credit pages 155 to
  230 (run 44764775167) and noncredit pages from 231 (run 44763620806).
- `el_camino.json.gz`: El Camino 2026-2027, 1,442 courses from Sam's hand-fetched copy (COBIx's text gist, run
  44762315427), whose course pages print one column. The Fall and Summer 2026 addenda are not read.
- `monterey_peninsula.json.gz`: Monterey Peninsula 2026-2027, 76 of 78 subject pages, 1,137 courses (run 44765198579).
- `long_beach_city.json.gz`: Long Beach City 2026-2027, 123 of 128 subject pages, 1,595 courses (run 44765123063).
- `cerritos.json.gz`: Cerritos 2026-2027, 91 of 93 subject pages, 1,656 courses (run 44767159068).

Mission, Pierce, Trade-Tech and West Los Angeles were read from the colleges' own PDFs, which the program capture already reads. Sam's hand-fetched copies
(COBIx's gists) print two columns side by side (`pdftotext -layout`), which this parse does not split.

A PDF college's rows come from the page read's pypdf text (plan keys `pdf_unfolded`, `pdf_page_cap`). Each file names
its heading and units patterns (`parse`) and how many units lines no heading claimed (`units_lines_unclaimed`, an upper
bound on the courses the parse missed, since front matter prints a few such lines too). `entry_printed` keeps each entry
as printed; `requisites` and `description` are split from it on a best-effort reading.

## The subject pages the first read missed (S700, 2026-11-21, #3655)

The first read of the four CourseLeaf catalogs made each subject's address from its code in lower case. Where the
catalog's index links the subject somewhere else, the page was never read. `kb/college_reads/<slug>_course_descriptions_missed*.json`
take each address from the index's own link (`../subjects/<slug>.json`), and `kb/_file_missed_subject_pages.py` parses
those logs and adds the courses in each file's own row shape, leaving a course the file already holds as filed. Added:
Cerritos 47 (Mathematics and Statistics, Political Science, Sociology), Long Beach City 47 (Design, GED/HiSET
Preparation, Psychology Trauma Studies, Social Work), Monterey Peninsula 71 (Law Enforcement Training Program,
Mathematics and Statistics, Work Experience), Southwestern 328 (the four Exercise Science subjects, Public
Administration, Recording Arts & Technology, Travel and Tourism): 493 courses on 21 pages, runs 44961387532,
44961768967, 44961846963, 44961971516, 44962016039 and 44962136733. Three pages print their courses under a code other
than the one the index names (Cerritos A&P prints AP, Monterey Peninsula SPCH prints COMM, Southwestern CBE prints
ATCBE); their courses were already filed. A run's log reads back at most 5,000 lines, so a plan holds about that many
printed lines (Southwestern's Exercise Science/Activity page alone prints 2,900).
