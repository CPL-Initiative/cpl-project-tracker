-- S287 (SkyMatrix), 2026-09-24, second write: Sam's ruling on the provisional ASCCC area map, after #1681 merged.
-- Rule 8 ingest — one row, INSERT-only, idempotent on slug; verified_by names him, the words are his.
-- Does NOT supersede asccc-areas-come-from-map-sam-2026-09-22 (MAP still holds the authoritative roster; this row
-- says the stand-in is accepted until that export arrives). Summary ≤ 400 chars, one sentence; plain present.
-- Rollback: delete from cpl_memory where slug = 'asccc-provisional-map-accepted-sam-2026-09-24';
--           then delete from cpl_memory_log where actor = 'SkyMatrix-s287' and action = 'create'
--             and note like 'S287 second write%';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, source, related, status, superseded_by, scope, verified_by, event_date, author)
values
 ('asccc-provisional-map-accepted-sam-2026-09-24', 'decision', 'Use the provisional ASCCC area map; the MAP report comes later',
  'Sam, 2026-09-24, on the provisional ASCCC Area map behind the EACR filter (36 of 118 colleges anchored to asccc.org text, 82 by the Areas'' geographic descriptions): use it as it stands, and the MAP Custom Report of locations by region replaces it when Pedro produces it, so the ask leaves the standing sheet.',
  'Verbatim: ''Go ahead and use what we have for ASCCC regions and we''ll get the new report later'' (2026-09-24, after #1681 merged). What changed on the ruling: the ASCCC card left kb/_build_open_asks_decision_sheet.py; the partner-crosswalks and EACR lanes state the map as the working map with no NEEDS-SAM marker; kb/reference/asccc_area_map.json _status records the acceptance; kb/reference/swp_region_map.json _asccc_areas no longer reads NOT FOUND. Still true from his 2026-09-22 note: MAP carries every location''s regions and Pedro can export them, which is the replacement path. My College''s Academic Senate scope stays not-ready until it is wired to college_lookup.js ascccArea.',
  'The Academic Senate area filter runs on the best map we have until MAP''s own export replaces it; nothing waits on Sam.',
  array['asccc','regions','eacr','partner-crosswalks','sam-ruling'],
  'Sam''s message, 2026-09-24 (session 287): Go ahead and use what we have for ASCCC regions and we''ll get the new report later',
  array['asccc-areas-come-from-map-sam-2026-09-22'],
  'verified', null, 'college identity', 'Sam', '2026-09-24', 'SkyMatrix-s287')
on conflict (slug) do nothing
returning slug, kind, status;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyMatrix-s287', 'create',
       'S287 second write, 2026-09-24 (kb/receipts/cpl_memory_2026-09-24_s287b.sql)',
       to_jsonb(m)
from public.cpl_memory m
where m.slug = 'asccc-provisional-map-accepted-sam-2026-09-24'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, length(m.summary) as summary_len, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m
left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug = 'asccc-provisional-map-accepted-sam-2026-09-24'
group by m.slug, m.summary;
