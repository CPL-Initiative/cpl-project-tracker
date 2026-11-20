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

## The other way in: hand it over on the page (2026-11-20)

A signed-in reviewer can hand an outline over without a session: each still-taught course in the Commons' Needs you
opens a panel with a drop box, Try the link, a place to paste the data and a place to leave a note (a course that
is not in the catalog is noted there), and each college's College Data Collection panel has the same box
(`commons_handover.js`). The file goes to the private bucket `commons-handover`
and a row in `commons_handover`; nothing is filed in this folder by that route. Pasted course data and notes are
filed in `../handed_over/courses.json`, and a course filed there is off the hunt's to-do (S693). The lane names the steps that carry a
hand-over into the outcomes table: [`docs/reference/lanes/commons.md`](../../../docs/reference/lanes/commons.md).
