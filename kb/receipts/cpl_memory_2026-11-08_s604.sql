-- S604 SkySculptor checkpoint: three cpl_memory rows, STAGED and NOT YET WRITTEN. An unattended scheduled run cannot
-- answer the Supabase write approval prompt (it timed out at ~06:16Z 2026-11-08), so the next session that holds the
-- connector with a person present runs this file AND kb/receipts/cpl_memory_2026-11-08_s603.sql, each as one call.
-- First check the slugs are absent; the verify must show creates = 1 for each.
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('milestone','m-nvidia-ai-power-cooling-2026-11','NVIDIA announced NVIDIA-Certified Associate: AI Power and Cooling',
 'The credential watch (S604, 2026-11-08) found a new NVIDIA associate AI credential on nvidia.com, beta, no exam code yet (webinar 2026-11-19). Added to kb/reference/industry_credential_watch.json; PR #2913.',
 'A tech-giant AI credential launch: the credential watch instruction asks for a memory row (tag credential-registry).',
 'NVIDIA has announced a new entry-level certification on powering and cooling AI data centers.',
 array['credential-registry','industry-credentials'],'cpl-project-tracker#2913; kb/credential_watch_out/2026-11-08.md','proposed',null,null,'2026-11-08','SkySculptorS604','medium'),
('fact','f-ccna-200-301-v2-2027-02','The CCNA (MAP-articulated) moves to 200-301 v2.0 on 2027-02-03',
 'Same name and exam code; v1.1 ends 2027-02-02. Dates from training-vendor pages (blogs.cisco.com is blocked from sessions). The catalog now names the joined row "CCNA" from Cisco''s own page; the CTID and exhibit link are kept (#2913).',
 'A version change, not a rename or retirement: MAP exhibits filed as CCNA stay valid. Confirm on cisco.com when a session can read it.',
 'The CCNA exam gets a new version in February 2027 under the same name and code, so existing credit for it is unaffected.',
 array['credential-registry','industry-credentials','exhibit-canonicalization'],'cpl-project-tracker#2913','proposed',null,null,'2026-11-08','SkySculptorS604','medium'),
('pitfall','p-free-recapture-unchanged-pages','A free catalog re-capture pays only when the pages changed',
 'Columbia (42454382707) and Redwoods (42455994350) re-captured with extract=0 on the current eLumen reader: would_extract kept every page (82 and 73) and sent 0. A low pass share there sits in the records and their reconcile steps, not the capture; read the failures by shape first (the Los Medanos method, S600).',
 'Check would_extract.kept against found before planning an extraction; a Siskiyous-style gain needs a reader change that alters the page text.',
 'Reading a college catalog again only helps if its pages changed; otherwise the fix is in how the requirements are scored.',
 array['program-requirements-harvest','catalog-sweep'],'docs/program_requirements_harvest_lessons.md (S604)','proposed',null,null,'2026-11-08','SkySculptorS604','high')
on conflict do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkySculptorS604', 'create', 'checkpoint auto-write (late: staged S604)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('m-nvidia-ai-power-cooling-2026-11','f-ccna-200-301-v2-2027-02','p-free-recapture-unchanged-pages')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkySculptorS604' group by m.slug order by m.slug;
