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
