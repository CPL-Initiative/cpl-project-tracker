-- Library side session (session_01WA43Ch5ZxzUCaozXbH4YeN), 2026-10-07 evening PT, after S343 signed off.
-- Rule 8 ingest: Sam's ruling to drop sharing CPLLibrary (his words, verified by Sam) and the measured
-- refusal behind it (proposed). INSERT-only, idempotent on slug. No addresses: the tracker is public.
-- Rollback: delete the two log rows (actor library-side-2026-10-07), then the two rows by slug.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.status = 'verified' then now() end, '2026-10-07'::date, 'library-side-2026-10-07', x.related
from jsonb_to_recordset($json$[
 {"slug":"sam-drop-cpllibrary-sharing-2026-10-07","kind":"decision",
  "title":"Sam: stop trying to share CPLLibrary in Drive",
  "summary":"Sam dropped sharing the CPLLibrary Drive folder with the team on 2026-10-07 because many teammates have no Google account, and named SharePoint as a possible home where they all have access.",
  "detail":"Sam, 2026-10-07, in chat, verbatim: \"Let's give up on sharing the Drive because so many on team do not have google accounts. May need to switch to sharepoint, where they all have access.\" This closes Open Asks Sheet 48 card 2 (the addresses) and withdraws sheet 47 card 3 (Shared). Drive stays where sessions file pieces; Library links open for the owner (camapinitiative) alone, and Sam hands a teammate a file himself. A move to SharePoint is parked: his word was may. The earlier ruling that Drive is home for approved files (sam-drive-is-home-for-approved-files-2026-10-05) stands.",
  "plain":"The team's shared library of decks and films lives in a Google Drive folder, and most of the team has no Google account, so Sam stopped trying to share the folder and may move the library to SharePoint, which everyone on the team can already open.",
  "tags":["library","drive","sharepoint","deliverables"],"status":"verified",
  "source":"Sam in chat, library side session, 2026-10-07","verified_by":"Sam",
  "related":["sam-drive-is-home-for-approved-files-2026-10-05","sam-sheet47-rulings-2026-10-07"]},
 {"slug":"drive-connector-share-refuses-team-addresses-2026-10-07","kind":"pitfall",
  "title":"The Drive connector cannot share CPLLibrary with the team",
  "summary":"The Drive connector's share_file refused every team address it tried on CPLLibrary (11 calls on 2026-10-07), and the Microsoft 365 connector reads SharePoint without uploading, so neither lets a session give the team a file.",
  "detail":"Measured 2026-10-07: share_file (role reader) on CPLLibrary answered Request contains an invalid argument for most rccd.edu, vendor.rccd.edu and norcocollege.edu addresses and The caller does not have permission for three (one rccd.edu, two cccco.edu); S341 tried 10 of 19, the side session one more after Sam's explicit go. Bare addresses were sent, so the name-and-bracket form was not the cause. The tool has no notify option, and an address with no Google account can be reached only through an emailed invitation (likely cause, unconfirmed). In auto mode the session's classifier also blocks share_file as a permission grant until the user's go is explicit. The Microsoft 365 connector (registry, not connected) offers sharepoint_search, sharepoint_folder_search and read_resource: no upload. A session upload to SharePoint would need a Microsoft Graph app in RCCD's tenant.",
  "plain":"A session cannot share the team's Drive folder with teammates, because the sharing tool fails for their work addresses, and the Microsoft tool that exists can only read SharePoint, so for now Sam passes files to people himself.",
  "tags":["library","drive","sharepoint","connectors"],"status":"proposed",
  "source":"library side session tool results, 2026-10-07; S341 transcript","verified_by":null,
  "related":["sam-drop-cpllibrary-sharing-2026-10-07"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-side-2026-10-07', 'create', 'Sam dropped sharing CPLLibrary; the refusal measured', to_jsonb(m)
from public.cpl_memory m
where m.author = 'library-side-2026-10-07'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

-- Verify (each slug creates = 1):
-- select m.slug, m.status, count(l.id) filter (where l.action = 'create') as creates from public.cpl_memory m
--   left join public.cpl_memory_log l on l.memory_id = m.id where m.author = 'library-side-2026-10-07' group by 1,2;
