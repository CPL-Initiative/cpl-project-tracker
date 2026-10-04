-- S327 (SkyAmend), 2026-10-04 ~18:24Z: Rule 8 ingest - one row, Sam's own words, logged.
-- New (author 'SkyAmend-s327'): the Cerritos Ironworker proof of concept, high school to career
-- (decision, verified: his words). Rollback: supersede the row by slug under actor
-- 'SkyAmend-s327-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-ironworker-proof-of-concept-full-pathway-2026-10-04',
 'Sam: prove the model on one pathway, Cerritos Ironworker, from high school to career',
 'decision',
 'Sam, 2026-10-04 18:23Z: Cerritos Iron and Steel Worker is the proof of concept, shown whole: HS dual enrollment, CTE articulation (Cx), noncredit, adult ed and ROP; Cerritos and stackable certificates; the A.S.; the B.S.; internships and jobs. North star: "leverage CPL on clear paths to increase access and completion leading to career improvement."',
 'His words: "I think as we go I want to zero in on one use case as proof of concept. Thinking Cerritos Iron and Steel Worker would be a good one. I''d like to show a complete pathway from HS dual enrollment and CTE articulated classes (often treated as Cx)--including any noncredit or adult ed, ROP classes we can identify for the earliest entryway to the path--moving to Cerritos certificates (and any stackable certs) then AS degree then BS degree and as a final bonus any internships or employment opportunities for career attainment, which is the whole northstar of all this work = leverage CPL on clear paths to increase access and completion leading to career improvement." Starting facts: the A.S. (control 42158) is a checked pilot record, up to 31.5 of 34-38 units through CPL Cerritos has articulated (15 Ironworker credentials in MAP''s articulated-exhibit feed); the Field Ironworker Supervisor B.S. (first cohort fall 2027) is the hand-built map in cpl_pathways_data.js. Vault braindump 2026-10-04 18:23.',
 'Show one complete path, high school to job, for Cerritos ironworkers, with the credit for prior learning at every step.',
 array['cpl-pathways','program-requirements','roep','proof-of-concept','cerritos','ironworker','north-star','noncredit','dual-enrollment'], array['docs/reference/lanes/program-requirements-harvest.md','cpl_pathways_data.js','cpl_pathways_roep_data.js'],
 'Sam, S327 chat, 2026-10-04', 'SkyAmend-s327', '2026-10-04', 'verified', 'Sam', now())
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyAmend-s327', 'create', 'S327 ingest (Ironworker proof of concept)', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'sam-ironworker-proof-of-concept-full-pathway-2026-10-04'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
