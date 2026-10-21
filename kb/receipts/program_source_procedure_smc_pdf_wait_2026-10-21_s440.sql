-- S440 SkyChaparral, 2026-10-21: Santa Monica College's catalog step waits 1,500 s for its whole-catalog PDF (the
-- reader's ceiling), where the default 600 s timed out (capture run 39536186746: the link answered 200, the download
-- did not finish). The same reader, user agent and robots.txt check; only the wait changes. Appends the step.
-- Through program_source_procedure_set, expecting the row's md5 060d7b667c3b8a0694c670d97ab0683e.
-- Rollback: program_source_registry_history holds the prior record.

select public.program_source_procedure_set('Santa Monica College',
  p.procedure || jsonb_build_object(
    'catalog', (p.procedure->'catalog') || jsonb_build_object('timeout_s', 1500),
    'steps', coalesce(p.procedure->'steps', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'run', '39536186746', 'date', '2026-10-21',
      'plan', 'program-requirements-college.yml, extract=0',
      'found', 'The catalog link answered 200; the PDF download timed out at 600 s, so 0 of 240 listed programs were found. A page read (39538245162) shows the HTML catalog links no page per program and catalog.smc.edu/current/ timed out at 30 s.'))),
  'S440 SkyChaparral, 2026-10-21 (catalog sweep; capture run 39536186746)',
  '060d7b667c3b8a0694c670d97ab0683e')
from public.program_source_registry p
where p.college = 'Santa Monica College';
