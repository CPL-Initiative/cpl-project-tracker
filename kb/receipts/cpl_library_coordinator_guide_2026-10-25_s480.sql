-- S480 (SkyChia), 2026-10-25. Sam, in chat (~22:37Z): "For the Library artifact maker, that would be a good
-- place to have the Coordinator Guide we are curating", and of the request box this session built: "That would
-- be needed for the Coordinator Guide and other visuals as well."
--     Then, mid-run: "For the Coord Guide, if you can, go ahead and build a draft incorporating all the analysis you
--     got from the initial run ... I will likely like to add more specific MAP procedural docs later and ask for a
--     refresh and keep iterating like that before we publish to the public library."
-- (1) One Library record for the CPL Coordinator Getting Started Guide, In development at step 2 (Draft, with a
--     brief), linking S480's Draft 1 (a private Claude page built from the S479 audit), the Chaffey draft in the
--     Drive folder kept as its first version. Status draft, never requested: Sam's comments under Changes to make
--     drive each revision. (2) Rule 8 ingest: Sam's asks of this session, and the Changes to make build.
-- INSERT-only, idempotent on slug, cohort library-s480@bot.
-- Rollback: delete from cpl_library where slug = 'cpl-coordinator-getting-started-guide' and added_by = 'library-s480@bot';
--           delete the memory log rows (actor library-s480-2026-10-25), then the memory rows by slug.
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type,
  status, seen_by, home, url, made_by, rebuild_from, note, versions, brief, for_kind, for_category, knowledge, added_by)
values ('cpl-coordinator-getting-started-guide', 'CPL Coordinator Getting Started Guide', 'document',
  'Field guides for CPL coordinators', '2026-10-25', 'Draft 1',
  'The getting-started guide for a college''s CPL coordinator, adapted from Chaffey College''s draft for every college: the first of the field-facing technical support guides.',
  'About 4,100 words, with a one-page Quick Reference', 'html', 'draft', 'team', 'web',
  'https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1',
  'Draft 1 by S480, from the draft an articulation officer at Chaffey College wrote for the CPL Initiative and the S479 audit of it',
  'CPLBrain/04-projects/cpl-initiative/coordinator-guide/20261025_CPL_Coordinator_Guide.html (republish to the same artifact); the Chaffey draft: the .docx files in the Drive folder CPL Coordinator Getting Started Guides (guide 1pg_p17W_FGBTwDJi48zpKEZSWP_fRw92, Quick Reference 1zJK-a5mZm4yNLAbKyYW9iVjTzjAR9F5B); the audit: audit_workflow.js and 20261025_Coordinator_Guide_Audit.md beside the page',
  'The S479 audit found 132 items; 10 of the 14 most severe conflicts stood a second reader. Draft 1 carries every core correction and lists, at its top, the eleven items to confirm before release. The page stays private until Sam lists it; anything sent to the drafter is outward and waits for him.',
  '[{"url":"https://drive.google.com/drive/folders/1a9-zbN9oc0G8I2GdV3y6VGOUDZA4X8Dn","date":"2026-10-21","label":"Chaffey draft","status":"Superseded"},{"url":"https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1","date":"2026-10-25","label":"Draft 1","status":"Current"}]'::jsonb,
  jsonb_build_object(
    'say', 'A guide any college''s CPL coordinator can follow. Start where the audit''s section 8 starts: rebuild the Phase 2 student workflow and its Quick Reference panel (identify students before they ask, as Ed. Code 78093.2(b)(1) requires; the counselor before transcription; the college''s MAP landing page as the request form). Then rebuild Money and Help from the Initiative''s record, and move Chaffey''s offices, forms and calendar into a local template each college fills in.',
    'sources', 'The Chaffey draft and Quick Reference in the Drive folder CPL Coordinator Getting Started Guides; the audit report 20261025_Coordinator_Guide_Audit.md (sections 3, 7 and 8); ESS 25-82; Title 5 section 55050; the public CPL Knowledge Base.',
    'shape', 'A web page in the public library''s look with a one-page Quick Reference, so a revision keeps its link and the public library and Sierra can read it once listed; Sam''s comments on this record (Changes to make) set each revision.',
    'requested_by', 'Sam', 'requested_on', '2026-10-25'),
  'other', 'CPL coordinators', true, 'library-s480@bot')
on conflict (slug) do nothing;

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-25'::date, 'library-s480-2026-10-25', x.related
from jsonb_to_recordset($json$[
 {"slug":"sam-s480-funding-chips-library-requests-2026-10-25","kind":"decision",
  "title":"Sam's S480 asks: NC label, outcome chips, Serves on P3 and P4, the guide and change requests in the Library",
  "summary":"Sam, 2026-10-25 ~22:37Z (S480): make the NC priorities' title editable (from NC-1); outcome chips beside the titles on the college rows (\"CR Priority 1 [access chip]; NC Priority 1 [access - career attainment chips]\"); P3 and P4 get the Serves boxes; the Coordinator Guide in the Library; a place to enter comments on a piece and refresh it.",
  "detail":"Verbatim: \"1. On funding tab, make the NC priorities title editable (want to change it from NC-1 2. Where we list the priority area (Access, Completion...), maybe we should make those chips on the college rows next to the titles. Example CR Priority 1 [access chip]; NC Priority 1 [access - career attainment chips] 2.1 Should set Priority 3 and 4 to have the same priority area checkboxes as the other priority areas 3. For the Library artifact maker, that would be a good place to have the Coordinator Guide we are curating 4. Related to that, before I send out the link to the ELL visual in the Library, I'd like to request some edits from the Library edit form but there's no place for me to enter my comments and then Refresh based on the input. That would be needed for the Coordinator Guide and other visuals as well. Advise\" Then, ~23:20Z: \"For the Coord Guide, if you can, go ahead and build a draft incorporating all the analysis you got from the initial run. I read the .md file and it has good insights and recommendations. I will likely like to add more specific MAP procedural docs later and ask for a refresh and keep iterating like that before we publish to the public library. I'll get team members trained on how to do this so they won't need to jump in a session and get it all wired up each time.\" Draft 1: https://claude.ai/artifact/7HPvgHpX8jnfpCLd7e4Tv1",
  "plain":"Sam asked for four changes: rename the noncredit priority labels, show each priority's outcomes as small labels on the college rows, give priorities 3 and 4 the same outcome checkboxes, and let him write comments on a Library piece so it can be revised.",
  "tags":["implementation-funding","library","coordinator-guide","nc-1"],"status":"verified",
  "source":"Sam in chat, S480, 2026-10-25","verified_by":"Sam",
  "related":["procedure-coordinator-guide-audit-from-drive-2026-10-25"]},
 {"slug":"library-changes-to-make-built-2026-10-25","kind":"procedure",
  "title":"Library: Changes to make holds a reader's comments; a session rebuilds the piece",
  "summary":"Built by S480: the Library record's refresh_note (was Figures to refresh) is a Changes to make box in Edit. Set, the piece lists under Needs attention and Copy the request gives the paste: record, link, source, the comments with who asked. The scheduled run reads it too (step 6). The page rebuilds nothing; a session does, keeps the link, and empties the box.",
  "detail":"No schema change: refresh_note was already free text, flagged under Needs attention, written by the team-phrase PATCH, and kept in cpl_library_history on every edit. The paste tells the session to republish a Claude page to the same artifact, rerun scripts/library_page.py for a public piece, show the revision to whoever asked before it replaces a public copy, add the version, and empty the box. A Refresh-now button would need the worker to fire the routine with a stored token, a cost and permission call left to Sam. Test: tests/library.test.js (13).",
  "plain":"Anyone on the team can now write what should change about a Library piece; the next Claude session (or the nightly one) makes the changes and clears the note.",
  "tags":["library","coordinator-guide","scheduled-sessions"],"status":"proposed",
  "source":"S480 build, 2026-10-25","verified_by":null,
  "related":["sam-s480-funding-chips-library-requests-2026-10-25"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s480-2026-10-25', 'create', 'S480: Sam''s asks and the Changes to make build', to_jsonb(m)
from public.cpl_memory m
where m.author = 'library-s480-2026-10-25'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
