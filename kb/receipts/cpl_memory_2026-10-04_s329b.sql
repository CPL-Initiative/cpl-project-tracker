-- S329 (SkyRunner), 2026-10-04 ~21:55Z: one row after Sam pasted Cerritos's procedure record (sheet 35).
-- An UPDATE appending this to sam-apply-procedure-record-2026-10-04's detail timed out at the connector
-- with nothing written, so the fact is a new milestone row instead (inserts pass).
-- Rollback: supersede the row by slug under actor 'SkyRunner-s329-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values ('cerritos-procedure-record-written-2026-10-04',
 'Cerritos''s procedure record is on its registry row (the first one)',
 'milestone',
 'Sam pasted Cerritos''s procedure record from open-asks sheet 35 at 21:42Z on 2026-10-04 ("success no rows returned"); read back: procedure_by college-page-read S329, procedure_at 21:42:37Z, 6 hosts, 3 steps, 4 answers, 5 nuances, 3 open items. kb/_college_page_read.py loads it before each Cerritos run.',
 'The card''s first build took the receipt''s first UPDATE, which sits in its rollback comment, so his first paste failed as a syntax error with nothing written (fixed in b51f89e: the builder takes the statement after "-- The record" and refuses paste text with comment lines). The connector holds an UPDATE, through apply_migration or execute_sql, for a person''s confirmation: two 60 s timeouts on the registry and one on cpl_memory, nothing written each time. Receipt kb/receipts/program_source_registry_procedure_2026-10-04_s329.sql.',
 'The notes on how to read Cerritos''s website are now saved where the reading tool finds them before each visit.',
 array['program-requirements','procedure-record','cerritos','registry','decision-sheet'], array['docs/reference/lanes/program-requirements-harvest.md'],
 'Sam, open-asks sheet 35 reply (2026-10-04 21:43Z); S329 read-back', 'SkyRunner-s329', '2026-10-04', 'verified', 'Sam', now())
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyRunner-s329', 'create', 'S329: Sam pasted the record', to_jsonb(m)
from public.cpl_memory m where m.slug = 'cerritos-procedure-record-written-2026-10-04'
 and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
