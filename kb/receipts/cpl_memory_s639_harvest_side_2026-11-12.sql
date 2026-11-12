-- S639 harvest side session (a second session beside the S639 conductor), 2026-11-12: five decisions, a pitfall,
-- a procedure and a fact for the program-requirements-harvest lane. One INSERT-only statement under author
-- memory-s639-harvest-side-2026-11-12; every row status 'proposed'. Written by the session, run by the conductor.
-- ROLLBACK:
--   delete from public.cpl_memory where author = 'memory-s639-harvest-side-2026-11-12';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s639-harvest-side-2026-11-12', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "d-lacc-heading-minimum-60-s639",
  "kind": "decision",
  "title": "Los Angeles City: the heading's Minimum of 60 is a floor; GE is the printed 18-27",
  "summary": "Los Angeles City College's local degrees print 'Total Units: Minimum of 60' in each heading; the front matter prints 'Completion of 18-27 units in the LACCD General Education Plan'. Two set steps, gated local, scoped to the record's own heading (only_with: degree_total); heading_above_code keeps a heading printed above the State Code line. Reconciles moved 25 to passing, none regressed (#3130).",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "los-angeles-city",
   "reconcile"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; #3130",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-occ-up-to-ge-maximum-s639",
  "kind": "decision",
  "title": "Orange Coast: a printed Up to N general education line is that pattern's maximum",
  "summary": "Orange Coast's REQUIREMENTS tab prints 'Up to 21' (A.S.), 'Up to 27' (A.A.), Cal-GETC 'up to 34' and an exact 21. Ten reconcile steps read each as printed, the N as the pattern's maximum; the degree total is read only from a Total Units line directly after the GE or electives line; the electives flag reads local degrees only. Simulated 194 to 202 on nine read pages (#3133).",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "orange-coast",
   "reconcile"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; #3133",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-hours-meets-top-term-length-s639",
  "kind": "decision",
  "title": "An hours range whose low end is eight ninths of the top is one total over two term lengths",
  "summary": "Session call for Sam to revise: an hours program passes (meets_top) when its printed range's low end is eight ninths of the top within 0.05 (16 weeks against 18), every course's hours are single figures and they sum to exactly the top. Measured at every college: built wider it reached 29 records in three shapes; narrowed it reaches 22, all Victor Valley. Sheet 120 card 1 unchanged (#3131).",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "victor-valley",
   "scorer",
   "hours"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; #3131; told to Sam in chat about 01:50Z and 02:05Z 2026-11-12, no reply",
  "related": [
   "sam-sheet-85-rulings-2026-10-16"
  ],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-rio-hondo-cal-getc-areas-count-s639",
  "kind": "decision",
  "title": "Rio Hondo: Cal-GETC 34 counted from the college's own printed areas",
  "summary": "Rio Hondo's catalog prints Cal-GETC's units by area and no total (reads 43137946308, 43138694150, 43139467468). The lane conductor decided count: transfer degrees take the sum of the college's own printed areas, 34, extending Sam's count on Open Asks Sheet 180 cards 2 and 4; for Sam to revise. Simulated 276 of 288 (#3136).",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "rio-hondo",
   "cal-getc",
   "reconcile"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; #3136",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-west-valley-cal-getc-areas-count-s639",
  "kind": "decision",
  "title": "West Valley: Cal-GETC 34 counted from the college's own printed areas",
  "summary": "West Valley's Cal-GETC page and advising guides print each area's units and no total (reads 43138048261, 43139111307). The lane conductor decided count: transfer degrees take the sum of the college's own printed areas, 34, extending Sam's count on Open Asks Sheet 180 cards 2 and 4; for Sam to revise. Simulated 120 of 133 (#3137).",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "west-valley",
   "cal-getc",
   "reconcile"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; #3137",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "pitfall-renumbered-edition-reextracts-every-moved-page-2026-11-12",
  "kind": "pitfall",
  "title": "A renumbered PDF edition sends every moved program back to the model",
  "summary": "American River read 43134279776 (extract=1, 23 forced) was estimated at about $1.50 and cost $12.99: the new edition is four pages shorter and unchanged() compares the source address with its #page=N, so all 154 moved programs were re-extracted. 16 improved, 30 passing now fail (22 from a department award list read as a heading). Not loaded. #3135 adds text_sha and a list-page rule.",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "american-river",
   "pdf-reader",
   "cost"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; #3135; branch claude/harvest-american-river-s639",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "procedure-free-capture-before-paid-read-new-edition-2026-11-12",
  "kind": "procedure",
  "title": "Run a free capture before any paid read on a new catalog edition",
  "summary": "Before a step=read with extract=1 on a college whose catalog has a new edition, dispatch the same read with extract=0 (capture only, no model call). Its would_extract names every program that would go to the model; price the run from that count and check the picks against the filed read. Only then dispatch the paid read, under the $40 a college go.",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "cost",
   "procedure"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; the American River run 43134279776",
  "related": [
   "pitfall-renumbered-edition-reextracts-every-moved-page-2026-11-12",
   "sam-extraction-standing-go-40-per-college-2026-10-14"
  ],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "fact-ge-pattern-no-units-shared-cause-2026-11-12",
  "kind": "fact",
  "title": "The harvest's largest shared failure: a degree names a GE pattern with no units",
  "summary": "Measured live 01:20Z 2026-11-12: 17,580 rows, 14,963 pass; 1,522 read unequal, 932 incomplete. The incomplete degrees mostly name a GE pattern and print no units for it: Orange Coast 50, Rio Hondo 30, Grossmont 27, West Valley 27, East Los Angeles 23, American River 23, Los Angeles City 22, Berkeley City 21, Solano 21, Cosumnes River 19, Sacramento City 18, Cerro Coso 14.",
  "tags": [
   "program-requirements",
   "harvest",
   "s639",
   "measured"
  ],
  "source": "S639 harvest side session (second session beside the S639 conductor); docs/harvest_side_handoff_s639.md; live read of program_requirement_records 01:20Z",
  "related": [
   "d-butte-ge-units-own-words-s636"
  ],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
