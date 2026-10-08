-- S345 SkyLantern (Sam's session), 2026-10-08. Rule 8 ingest at checkpoint: Sam's three asks and his sheet 50 rulings
-- (verified, his words), the map reads' findings (proposed), and the library table's timeouts (proposed).
-- INSERT-only, idempotent on slug. Rollback: delete the log rows (actor s345-skylantern), then the rows by slug.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is not null then now() end, '2026-10-08'::date, 's345-skylantern', x.related
from jsonb_to_recordset($json$[
 {
  "slug": "sam-calls-link-from-the-tab-2026-10-08",
  "kind": "decision",
  "title": "Sam: a call on the Progress view links where he answers it and where he sees the item",
  "summary": "Sam, 2026-10-08, on the Progress view: \"want to check the 2 items pending for me (screenshot) but don't see how to view them and respond\", then \"If you can embed the links on the tab, it would be fantastic.\" He agreed to keep sheet sources in the vault and link the published sheet: \"No, your plan sounds good to me.\"",
  "detail": "Verbatim: \"I'm on the Program Requirements tab and want to check the 2 items pending for me (screenshot) but don't see how to view them and respond...\" / \"If you can embed the links on the tab, it would be fantastic.\" / \"Yah, maybe until we can get the local storage path set up correctly we should store the decision sheets on the repo so we can link to them on the tab.\" / \"No, your plan sounds good to me\". Built S345 (#1908): kb/queue_status.json calls carry link (the sheet card), link_text and view (a COBI tab's bare hash or an https page); scripts/queue_status.py checks them; program_requirements.js callLinks(). S344 had listed two calls with no sheet. Rule: a call on the view is a card on a sheet, and its lane carries the NEEDS SAM.",
  "plain": "Each item waiting on Sam on the harvest's Progress view links the decision-sheet card where he answers it and the page where he can look at it.",
  "tags": [
   "program-requirements-harvest",
   "decision-sheets",
   "progress-view"
  ],
  "status": "verified",
  "source": "Sam in chat, 2026-10-08 ~17:00-17:15Z (S345)",
  "verified_by": "Sam",
  "related": [
   "progress-view-built-2026-10-07"
  ]
 },
 {
  "slug": "sam-sheet50-rulings-2026-10-08",
  "kind": "decision",
  "title": "Sam's Open Asks Sheet 50: flag mismatches and confirm from the tab; accept a mostly-listed map; settle refused maps",
  "summary": "Sheet 50, 2026-10-08, his own call: cards 1-2 follow up, \"add a note or flag to the items where there is a question or mismatch and a way to confirm or curate from the tab\"; card 3 pasted; card 4 as proposed (a map passes when listed courses outnumber off-list ones, each marked); card 5 as proposed (refused maps settled once routes are tried).",
  "detail": "Card 1 note verbatim: \"Would it be more clear to add a note or flag to the items where there is a question or mismatch and a way to confirm or curate from the tab? Thinking particularly of these: The two it leaves out, ARTH C1100 and ARTH C1200...\"; card 2: \"Same note as the Irvine example\"; card 3: \"Success. No rows returned\". Card 5 built S345 (MILESTONES maps, mapsSettled). Card 4 not yet built: accepts() in kb/_program_map_parse.py, the off-list marking through the display build and CPL Pathways' read map, then the live display apply on a fresh go. Cards 1-2: a mock-up of the Program records view first; both records stay unchecked. Sheet https://claude.ai/artifact/95hhDzp9aZ4E5jybe4AxAr.",
  "plain": "Sam asked for the harvest tab to flag where a program record and its sources disagree and to let him confirm a record there; he accepted a map that recommends a few extra courses, and counted maps the reader is refused as settled once other routes were tried.",
  "tags": [
   "program-requirements-harvest",
   "decision-sheets",
   "roep"
  ],
  "status": "verified",
  "source": "Open Asks Sheet 50 replies store, 2026-10-08 (S345)",
  "verified_by": "Sam",
  "related": [
   "sam-calls-link-from-the-tab-2026-10-08"
  ]
 },
 {
  "slug": "sam-cpl-pathways-college-selector-2026-10-08",
  "kind": "decision",
  "title": "Sam: CPL Pathways needs a college selector ahead of the pathway selector",
  "summary": "Sam, 2026-10-08: \"need to maybe have another selector that allows to narrow the current pathways selector to a college selected... for other purposes, we'll want to first select a college and then the pathways they offer.\"",
  "detail": "Verbatim: \"Note on the CPL Pathways tab--need to maybe have another selector that allows to narrow the current pathways selector to a college selected. The current selector is based on pathways first and colleges second, which is great when you want to see what pathways are available regardless of the college...but for other purposes, we'll want to first select a college and then the pathways they offer.\" cpl_pathways.js buildSelector() builds one select grouped by featured, field and catalog records. The ask: a college select before it that narrows those options to the college's pathways, keeping the pathway-first view as All colleges.",
  "plain": "Sam wants CPL Pathways to let a person choose a college first and then see the pathways that college offers.",
  "tags": [
   "cpl-pathways",
   "program-requirements-harvest"
  ],
  "status": "verified",
  "source": "Sam in chat, 2026-10-08 ~17:25Z (S345)",
  "verified_by": "Sam",
  "related": []
 },
 {
  "slug": "mtsac-gps-sequences-by-local-code-2026-10-08",
  "kind": "fact",
  "title": "Mt. San Antonio publishes a sequence per program on its Guided Pathways pages, matched by the code its catalog prints",
  "summary": "Mt. San Antonio's Guided Pathways list (455 programs) links a suggested sequence per program at pathway-results.html?pthwyvar=<local code>. Match by the code the catalog prints in the title: 03086 is N0486, 33876 is S0401, 08086 is S0957 (not listed; an older S1201 carries old course numbers).",
  "detail": "Runs 37810862182 and 37812133411 (S345). kb/_program_map_parse.py parse_mtsac reads the tab-separated terms. Fire Technology N0486: five terms, 8 of 15 listed plus KINF 51A, 51B, 52A off the list (filed, not accepted under S336's rule; sheet 50 card 4 changes the rule). ECE S0401: seven terms, all 12 listed CHLD courses, not yet filed.",
  "plain": "One pilot college publishes a term-by-term plan for every program on its own website, and each plan is matched to the right program by the code the catalog prints in the program's title.",
  "tags": [
   "program-requirements-harvest",
   "roep",
   "procedures",
   "program-maps"
  ],
  "status": "proposed",
  "source": "S345 SkyLantern, PR #1908",
  "verified_by": null,
  "related": [
   "pilot-procedures-written-2026-10-08"
  ]
 },
 {
  "slug": "map-reads-sixteen-colleges-2026-10-08",
  "kind": "milestone",
  "title": "Map sources read at sixteen colleges: every Program Mapper refused; 19 of 118 colleges hold a procedure",
  "summary": "S345 read sixteen colleges' map sources: five more Program Mapper hosts answered 403 (24 of 32 published now refused), the four Los Rios map pages 404, Palo Verde's lead does not resolve. Registry map columns for twelve colleges and twelve v1 procedures went live: 19 of 118 colleges hold one.",
  "detail": "Runs 37810652946, 37810862182, 37811253611. Receipts kb/receipts/program_source_registry_sequence_access_2026-10-08_s345.sql and program_source_procedure_twelve_v1_2026-10-08_s345.sql. The view counts a read-found map (sequence_host) as published: 3 of 32 read.",
  "plain": "The harvest checked where sixteen more colleges publish course maps; the shared map service refuses the reader everywhere, so the next step is each college's own pages.",
  "tags": [
   "program-requirements-harvest",
   "procedures",
   "program-maps"
  ],
  "status": "proposed",
  "source": "S345 SkyLantern, PR #1908",
  "verified_by": null,
  "related": [
   "pilot-procedures-written-2026-10-08"
  ]
 },
 {
  "slug": "apply-migration-cpl-library-table-specific-2026-10-08",
  "kind": "pitfall",
  "title": "apply_migration times out on cpl_library and nowhere else",
  "summary": "A fourth apply_migration on the open-asks cpl_library update timed out and wrote nothing (S345) while a registry migration minutes earlier applied first try: the timeouts belong to the table. Sam pasted the sheet 50 receipt; the row reads version 50.",
  "detail": "Receipt kb/receipts/cpl_library_open_asks_sheet50_2026-10-08.sql (guarded on version 48; replaced the sheet 49 receipt, which never applied). Next writes to cpl_library go to Sam as a paste card until the cause is found (a trigger on the table is the likely place to look).",
  "plain": "Database changes to the team's library listing time out through the sessions' tool, so Sam pastes them by hand for now.",
  "tags": [
   "library",
   "supabase",
   "mcp",
   "open-asks"
  ],
  "status": "proposed",
  "source": "S345 SkyLantern tool results, 2026-10-08",
  "verified_by": null,
  "related": [
   "apply-migration-timeout-cpl-library-2026-10-08"
  ]
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's345-skylantern', 'create', 'S345 checkpoint ingest', to_jsonb(m)
from public.cpl_memory m
where m.author = 's345-skylantern'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
