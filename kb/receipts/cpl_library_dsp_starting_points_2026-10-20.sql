-- DSP side session (session_01WRu69eX7fJgZ85JsTyyrA5), 2026-10-20, beside S439/S440.
-- Sam, in chat: "Can you add it to the Library? I want to add artifacts like this routinely to the library."
-- (1) One Library record for the DSP Credit Starting Points page. (2) Rule 8 ingest of the standing ruling.
-- INSERT-only, idempotent on slug, cohort library-dsp-side@bot.
-- Rollback: delete from cpl_library where slug = 'dsp-credit-starting-points' and added_by = 'library-dsp-side@bot';
--           delete the memory log row (actor library-dsp-side-2026-10-20), then the memory row by slug.
insert into public.cpl_library (slug, title, kind, occasion, made_on, version, summary, extent, file_type,
  status, seen_by, home, url, file_name, made_by, rebuild_from, note, versions, added_by)
values ('dsp-credit-starting-points', 'DSP Credit Starting Points', 'document',
  'DDS, Aging and LWDA meeting on DSP Training', '2026-10-20', '1',
  'Preliminary scan of CCC courses and programs that could award CPL for California''s Direct Support Professional Training: Taft and Porterville first, then Pasadena City, West Valley and short medication courses, and a wider ring.',
  'One page', 'html', 'draft', null, 'web', 'https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE',
  '20261020_DSP_Credit_Starting_Points.html', 'DSP side session, 2026-10-20',
  'CPLBrain/04-projects/cpl-initiative/dsp-training/20261020_DSP_Credit_Starting_Points.html',
  'Online and CVC delivery not yet confirmed. Sources: COCI course list and the program requirements harvest, read 2026-10-20.',
  '[{"url":"https://claude.ai/artifact/P4R8jJ84xdnLGhdmDhQ3xE","date":"2026-10-20","label":"Version 1","status":"Current"}]'::jsonb,
  'library-dsp-side@bot')
on conflict (slug) do nothing;

insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       now(), '2026-10-20'::date, 'library-dsp-side-2026-10-20', x.related
from jsonb_to_recordset($json$[
 {"slug":"sam-claude-artifacts-go-in-library-2026-10-20","kind":"decision",
  "title":"Sam: shareable Claude artifacts get a Library record, routinely",
  "summary":"Sam ruled on 2026-10-20 that Claude artifacts made to share (a page like DSP Credit Starting Points) get a record in the COBI Library tab as a matter of routine, without being asked; the artifact stays on claude.ai and the record links it.",
  "detail":"Sam, 2026-10-20, in chat, verbatim: \"Can you add it to the Library? I want to add artifacts like this routinely to the library.\" First record: dsp-credit-starting-points (home web, status draft). The source HTML goes in the vault beside the work, and rebuild_from names it. Decision sheets were already recorded as one series row (open-asks-sheets).",
  "plain":"Whenever a session makes a page meant for others to see, it adds that page to the Library tab in COBI, so the team can find it again.",
  "tags":["library","artifacts","deliverables"],"status":"verified",
  "source":"Sam in chat, DSP side session, 2026-10-20","verified_by":"Sam",
  "related":["sam-drive-is-home-for-approved-files-2026-10-05"]}
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;

-- Log, as its own statement (a CTE log insert sees nothing; playbook step 6).
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-dsp-side-2026-10-20', 'create', 'Sam: shareable artifacts go in the Library routinely', to_jsonb(m)
from public.cpl_memory m
where m.author = 'library-dsp-side-2026-10-20'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
