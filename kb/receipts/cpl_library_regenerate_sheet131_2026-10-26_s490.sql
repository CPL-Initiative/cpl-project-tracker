-- S490 (SkyGooseberry), 2026-10-26. Two writes, one receipt (Rule 10). Run 40347751180 failed on cpl_memory_summary_check
-- (a summary over 400 characters) and wrote nothing; this version keeps each summary under 400. The twelve college visuals' new address is its own
-- receipt (cpl_library_opportunity_urls_library_2026-10-26_s490.sql), applied once Pages serves the moved page.
--  B. The open-asks series record (open-asks-sheets) to Sheet 131 (https://claude.ai/artifact/6SM1HwKbvPWLt5534vhcyV).
--     Before: version 130, url https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD, updated_by S483 SkyCoyoteMint,
--     updated_at 2026-10-26 04:27:42.771803+00, 49 versions, made_by '... sheets 46 to 130 by S341 SkyTerrace through
--     S483 SkyCoyoteMint, sheet 49 by the library side session'.
--  C. Eight cpl_memory rows and their log rows, INSERT-only under author/actor library-s490-2026-10-26.
-- ROLLBACK (cpl_library_history_trg files each prior row either way):
--   B: update public.cpl_library set version = '130', url = 'https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD',
--        made_by = replace(made_by, 'sheets 46 to 131 by S341 SkyTerrace through S490 SkyGooseberry', 'sheets 46 to 130 by S341 SkyTerrace through S483 SkyCoyoteMint'),
--        versions = jsonb_set(versions - 0, '{0,status}', '"Current"'), updated_by = 'S483 SkyCoyoteMint' where slug = 'open-asks-sheets';
--   C: delete from public.cpl_memory_log where actor = 'library-s490-2026-10-26';
--      delete from public.cpl_memory where author = 'library-s490-2026-10-26';
-- A good result: B version 131 with 50 versions; C 8 rows and 8 log rows.


update public.cpl_library l
set version = '131',
    url = 'https://claude.ai/artifact/6SM1HwKbvPWLt5534vhcyV',
    made_by = 'Each sheet by the session that built it: sheets 46 to 131 by S341 SkyTerrace through S490 SkyGooseberry, sheet 49 by the library side session',
    versions = '[{"url":"https://claude.ai/artifact/6SM1HwKbvPWLt5534vhcyV","date":"2026-10-26","label":"Sheet 131","status":"Current"}]'::jsonb
               || jsonb_set(l.versions, '{0,status}', '"Earlier"'),
    updated_by = 'S490 SkyGooseberry'
where l.slug = 'open-asks-sheets'
  and l.version = '130'
  and l.updated_at = '2026-10-26 04:27:42.771803+00';

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'library-s490-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {
  "slug": "sam-library-regenerate-and-consolidate-ask-2026-10-26",
  "kind": "decision",
  "title": "Sam: Regenerate a visual when he adds a document or a note, generate a new one from an uploaded document, and consolidate the Library and CPL Opportunity procedures and sites",
  "summary": "Sam, 2026-10-26 ~13:50Z (S490): \"I want to make sure I can Regenerate a visual when I either add a document or note to it ... Also, when I want to generate a new visual based on a document I upload. Seems like perhaps we should consolidate the Library and CPL Opportunity Analysis procedures and sites. Recommend best steps.\"",
  "detail": "Asked of the Library and CPL Opportunity Analysis; his example was the note he added to the DSP visual. S490 recommended one procedure (Regenerate on every record, documents on the record, Make a visual as the one start, a daytime worker, a notes layer for each college page, one public address) and built it the same run; Sam's calls on the worker and the address went to Open Asks Sheet 131.",
  "plain": "One button rebuilds any Library piece from a note or a document, and both kinds of visual follow the same steps.",
  "tags": [
   "library",
   "cpl-opportunity",
   "regenerate",
   "visual"
  ],
  "status": "verified",
  "source": "Sam, in session S490, 2026-10-26",
  "verified_by": "Sam",
  "related": [
   "library-changes-to-make-built-2026-10-25",
   "sam-claude-artifacts-go-in-library-2026-10-20"
  ]
 },
 {
  "slug": "library-regenerate-built-2026-10-26",
  "kind": "milestone",
  "title": "The Library's Regenerate is built: what to change, the documents to work from, and the request on every record; a college page shows the MAP team's notes",
  "summary": "Built by S490 (#2472): Regenerate beside Edit on every Library record writes refresh_note, sources (a link or pasted text) and regen (who, when, whether the draft replaces a public copy at once); the card shows the request, a ready draft and Replace the public copy. Start a piece takes documents. cpl_library gained sources and regen (supabase-migrate run 40344549167).",
  "detail": "The CPL Opportunity page reads library/cpl-opportunity/notes/<slug>.json under At a glance, a draft at <slug>.draft.json with ?draft=1. scheduled_sessions.md step 6 says how a run works each kind of piece. Tests: library (13 rewritten, 14 new, 9), college_cpl_workbook (the notes).",
  "plain": "Anyone on the team can ask for a rebuild from the Library card, and the next scheduled run does it.",
  "tags": [
   "library",
   "regenerate",
   "cpl-opportunity"
  ],
  "status": "proposed",
  "source": "S490 build, 2026-10-26",
  "verified_by": null,
  "related": [
   "sam-library-regenerate-and-consolidate-ask-2026-10-26"
  ]
 },
 {
  "slug": "sam-sheet-131-rulings-2026-10-26",
  "kind": "decision",
  "title": "Sam's Sheet 131 rulings: a daytime Library run every two hours; the college visuals move under library/; S486's and S489's harvest readings stand",
  "summary": "Sam, Open Asks Sheet 131, 14:55-14:56Z 2026-10-26, each his own call, no notes: 1 two-hours (a run every two hours on weekdays, 7 a.m. to 5 p.m. Pacific, working only Library requests); 2 move (the CPL Opportunity page to library/cpl-opportunity/, the old address forwarding); 3 keep (S486's overlap words); 4 keep (S489's floors).",
  "detail": "S490 moved the page the same run. The daytime run could not be created from the session (create_trigger takes no connectors in this organization and attaches no repos), so Sam creates it from claude.ai's routines page with the paste in docs/reference/scheduled_sessions.md.",
  "plain": "Library requests get worked during the day, every visual lives under the library's address, and two Hartnell readings stand.",
  "tags": [
   "library",
   "decision-sheet",
   "program-requirements-harvest"
  ],
  "status": "verified",
  "source": "Sam, Open Asks Sheet 131 replies store, 2026-10-26 14:56Z",
  "verified_by": "Sam",
  "related": [
   "sam-library-regenerate-and-consolidate-ask-2026-10-26"
  ]
 },
 {
  "slug": "sam-hold-m365-connector-rccd-approval-2026-10-26",
  "kind": "decision",
  "title": "Sam: hold the Microsoft 365 connector until RCCD's admin approves it",
  "summary": "Sam, 2026-10-26 ~14:10Z (S490): \"We need to hold on the 365 connector until I can get admin approval from RCCD\". Until then a session cannot read the CPLLibrary SharePoint folder; a Regenerate request's documents reach a session as a public link or pasted text.",
  "detail": "The Library tab's documents help says so in words. The library lane's Next keeps the SharePoint moves for after the approval.",
  "plain": "Sessions cannot open the team's SharePoint files yet; paste the text instead.",
  "tags": [
   "library",
   "sharepoint",
   "m365"
  ],
  "status": "verified",
  "source": "Sam, in session S490, 2026-10-26",
  "verified_by": "Sam",
  "related": [
   "sam-sheet49-sharepoint-rulings-2026-10-08"
  ]
 },
 {
  "slug": "sam-commons-figures-match-todo-2026-10-26",
  "kind": "decision",
  "title": "Sam, to do later: every tab's figures on the Commons must match the Commons summaries",
  "summary": "Sam, 2026-10-26 ~15:00Z (S490), for later: \"The Commons program numbers don't match the PR tabs numbers. Need to make sure the numbers on all tabs on the commons match the commons summaries.\" The Commons card read 13,194 of 20,282 complete; the Program Requirements tab read 17,529 records read and 3,274 failing a machine check.",
  "detail": "Both Progress cards on the tab read Could not be read (coci_college_programs answered 500) in his 7:38 AM PT screenshot; an SQL read at 15:30Z returned 20,282 active programs. Recorded in the commons lane as a to-do for later. The two count different things from different reads, and neither page names the difference; the 500 comes first.",
  "plain": "The Commons and its tabs should show the same numbers, or say why they differ.",
  "tags": [
   "commons",
   "program-requirements-harvest",
   "figures"
  ],
  "status": "verified",
  "source": "Sam, in session S490, 2026-10-26",
  "verified_by": "Sam",
  "related": []
 },
 {
  "slug": "sam-braindump-outcomes-ccr-skills-catalog-2026-10-26",
  "kind": "opportunity",
  "title": "Sam's braindump: outcomes as the richer source for aligning courses in the CCR, a CER skills catalog, skills-to-outcomes articulation recommendations, and a skills catalog on The Commons",
  "summary": "Sam, 2026-10-26 ~14:45Z (S490), verbatim in the vault braindump of 14:45: a view of all SLOs and PLOs; outcomes factored into the CCR's M-ID procedure; outcomes aligned to a CER skills catalog; a skills-to-outcomes procedure recommending articulations between exhibits and courses for credit mobility and equitable access; a skills catalog on The Commons. All later.",
  "detail": "File: CPLBrain 03-professional/braindumps/braindump-2026-10-26-1445-outcomes-as-the-richer-alignment-source.md. None acted on. Pairs with the same morning's braindump on the M-ID as a public similarity reference.",
  "plain": "Course and program outcomes may group similar courses better than titles, and a skills catalog could suggest articulations.",
  "tags": [
   "outcomes",
   "ccr",
   "m-id",
   "skills",
   "commons",
   "braindump"
  ],
  "status": "verified",
  "source": "Sam, in session S490, 2026-10-26",
  "verified_by": "Sam",
  "related": []
 },
 {
  "slug": "pitfall-session-trigger-no-repos-no-connectors-2026-10-26",
  "kind": "pitfall",
  "title": "A scheduled task a session creates gets no repos and no connectors, so a routine that needs Supabase is made in claude.ai",
  "summary": "S490, 2026-10-26: create_trigger refused the connectors parameter (\"not available for this organization\"), and the task it made stored no connectors and a session request with sources [] (no repos), so its sessions could not read cpl_library. S490 deleted it unfired. A routine that needs the repos and Supabase is made on claude.ai's routines page from the session's paste.",
  "detail": "The overnight CPL queue routine (trig_01L8K64ZKYb5eALdT4HW6NAV) was created through the HTTP API and carries Supabase among its connections.",
  "plain": "Sessions cannot set up a fully equipped scheduled run; Sam does it from claude.ai.",
  "tags": [
   "scheduled-sessions",
   "routines",
   "library"
  ],
  "status": "proposed",
  "source": "S490, 2026-10-26",
  "verified_by": null,
  "related": [
   "sam-sheet-131-rulings-2026-10-26"
  ]
 },
 {
  "slug": "pitfall-funding-edit-saves-to-browser-whatif-2026-10-26",
  "kind": "pitfall",
  "title": "A funding tab title edit made without a fresh sign-in lands in that browser's what-if copy, which the public page never reads",
  "summary": "S490's fork (#2471), 2026-10-26: Sam's NC-1 label edit never reached cpl_funding_config; Scenario 4 holds NC-2's title edit but no label for either noncredit outcome. An edit made without a fresh sign-in saves only to the browser's what-if copy, which COBI's tab shows and the public page does not read. The public page now renames those labels and titles itself.",
  "detail": "The public page's Edit this page renames the noncredit labels and titles and its five sub-headings, and the curator bar says when the browser holds changes only it can see. Publishing a stale what-if copy from the tab could restore an earlier NC-2 title, so retyping on the page is the safer route. Test: tests/funding_page_titles_bullets.test.js.",
  "plain": "An edit can look saved in COBI while living only in one browser; the public page now takes the edit directly.",
  "tags": [
   "implementation-funding",
   "funding-model",
   "public-page"
  ],
  "status": "proposed",
  "source": "cpl-project-tracker#2471 (S490 fork), 2026-10-26",
  "verified_by": null,
  "related": [
   "sam-funding-page-library-look-sierra-light-2026-10-25"
  ]
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s490-2026-10-26', 'create', 'S490: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'library-s490-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'library-s490-2026-10-26');
