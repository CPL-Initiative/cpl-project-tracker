# Hand-filed course outlines and catalogs (the blocked-catalog hunt)

Sam, 2026-11-17: "Make sure those blocked catalogs and cors are on my cdc to do." Six colleges' sites serve a bot
challenge or refuse robots.txt, so the course outline reader cannot read them (kb/reference/blocked_catalog_hunt.json).
A person may fetch a public file by hand.

To clear a college from the to-do on the College Data Collection page and the Commons' Waiting on a person list, put
`<slug>.json` here (the slug is in the hunt file), shaped like the program catalogs one folder up:

```json
{
 "college": "Grossmont College",
 "url": "https://.../course-outlines.pdf",
 "fetched_by": "Sam",
 "fetched_at": "2026-11-18",
 "file": "grossmont.pdf",
 "note": "Course outlines for the courses still taught."
}
```

The file itself goes beside it, or as a link in `url`. The outline reader reads it the way it reads routes A and B, with
the title check. Both pages clear the college on their next build.

## A catalog's course descriptions, one row per course (S690)

A college read from its HTML course-description pages files `<slug>_courses.json` beside its record, named in the
record's `file`. Each row is one printed course: `college`, `catalog_year`, `subject`, `subject_name`, `code`, `title`,
`hours`, `units` or `credits` as the page prints them, `requisites` (each printed Prerequisite, Corequisite, Advisory or
Recommended Preparation line), `description`, `source_url`, `read_at` and the `run` whose log holds the page. Every
course the page prints is kept, offered or not, so a set-aside of courses no longer offered is a join on `code`. The
file's header says how the pages were read and parsed. North Orange Continuing Education was the first:
`north_orange_continuing_education_courses.json`, read through `college-page-read.yml` (plans
`kb/college_reads/noce_course_descriptions_*.json`), where the runner answers 200 and the session sandbox 202.
