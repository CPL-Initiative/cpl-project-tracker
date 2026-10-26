-- S490 (SkyGooseberry), 2026-10-26. Sam's Open Asks Sheet 131 card 2 (move, 14:56Z): the twelve college CPL Opportunity
-- visuals link the page's new home, library/cpl-opportunity/?college=. Applied only once Pages serves that page (the merge of
-- the move), so no public link points at an address not yet served; the old cpl-opportunity/ address forwards meanwhile.
-- Rule 10: guarded UPDATE on each row's url and updated_at as read live at ~15:05Z. rows_updated < 12 means someone edited
-- a row: re-read. Before-values (url, updated_at), all updated_by library-made-for-s459@bot except Riverside City (Sam):
--   cpl-opportunity-american-river-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=American%20River%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-bakersfield-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-cerritos-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Cerritos%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-foothill-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Foothill%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-moreno-valley-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Moreno%20Valley%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-norco-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Norco%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-rio-hondo-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Rio%20Hondo%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-riverside-city-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Riverside%20City%20College, 2026-10-24 13:44:24.758677+00
--   cpl-opportunity-san-bernardino-valley-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Bernardino%20Valley%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-san-joaquin-delta-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Joaquin%20Delta%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-santiago-canyon-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Santiago%20Canyon%20College, 2026-10-23 22:14:22.319777+00
--   cpl-opportunity-sierra-visual: https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Sierra%20College, 2026-10-23 22:14:22.319777+00
-- ROLLBACK (cpl_library_history_trg files each prior row either way):
--   update public.cpl_library set url = replace(url, '/cpl-project-tracker/library/cpl-opportunity/', '/cpl-project-tracker/cpl-opportunity/')
--     where slug like 'cpl-opportunity-%-visual' and updated_by = 'S490 SkyGooseberry';
-- A good result: 12 rows read the new address.

update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=American%20River%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-american-river-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=American%20River%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Bakersfield%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-bakersfield-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Cerritos%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-cerritos-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Cerritos%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Foothill%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-foothill-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Foothill%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Moreno%20Valley%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-moreno-valley-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Moreno%20Valley%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Norco%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-norco-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Norco%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Rio%20Hondo%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-rio-hondo-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Rio%20Hondo%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Riverside%20City%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-riverside-city-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Riverside%20City%20College' and updated_at = '2026-10-24 13:44:24.758677+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=San%20Bernardino%20Valley%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-san-bernardino-valley-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Bernardino%20Valley%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=San%20Joaquin%20Delta%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-san-joaquin-delta-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=San%20Joaquin%20Delta%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Santiago%20Canyon%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-santiago-canyon-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Santiago%20Canyon%20College' and updated_at = '2026-10-23 22:14:22.319777+00';
update public.cpl_library set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Sierra%20College', updated_by = 'S490 SkyGooseberry'
  where slug = 'cpl-opportunity-sierra-visual' and url = 'https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Sierra%20College' and updated_at = '2026-10-23 22:14:22.319777+00';

-- And one cpl_memory row (Sam's Sierra ask of ~15:30Z, done the same hour), INSERT-only under author/actor library-s490-urls-2026-10-26.
-- ROLLBACK: delete from public.cpl_memory_log where actor = 'library-s490-urls-2026-10-26';
--           delete from public.cpl_memory where author = 'library-s490-urls-2026-10-26';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, '2026-10-26'::date, 'library-s490-urls-2026-10-26', x.related
from jsonb_to_recordset($json$[
 {
  "slug": "sam-sierra-no-internal-tool-names-2026-10-26",
  "kind": "decision",
  "title": "Sam: Sierra uses what the internal tools hold but never names them or sends a reader to a page the reader cannot open",
  "summary": "Sam, 2026-10-26 ~15:30Z (S490): his instruction (sierra_guidance 910ebe25) told Sierra to check COCI Lookup and the Catalog Commons, and she referred a reader to those tabs, which are not public. \"She should reference the information from the resources but not name them.\" S490 reworded his row and added a standing directive the same hour.",
  "detail": "Receipt kb/receipts/sierra_guidance_no_internal_names_2026-10-26_s490.sql (before-values, rollback). Sierra searches what colleges teach through search_college_offerings over course titles, so the rewording points her there. 18 active directives after, about 8,600 of 9,000 characters.",
  "plain": "Sierra gives readers the courses and colleges and never points them at staff-only tools.",
  "tags": [
   "sierra",
   "guidance",
   "public"
  ],
  "status": "verified",
  "source": "Sam, in session S490, 2026-10-26",
  "verified_by": "Sam",
  "related": []
 }
]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text,
       source text, verified_by text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'library-s490-urls-2026-10-26', 'create', 'S490: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'library-s490-urls-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'library-s490-urls-2026-10-26');
