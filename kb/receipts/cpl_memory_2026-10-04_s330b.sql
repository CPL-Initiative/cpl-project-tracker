-- S330 (SkyRoutine) checkpoint, 2026-10-04 ~23:45Z: two more rows, and the create log for all five S330 rows.
-- The three rows of kb/receipts/cpl_memory_2026-10-04_s330.sql were inserted at ~23:20Z without their log entries;
-- these entries are late (playbook-cpl-memory-auto-write-at-checkpoint step 6).
-- Rollback: supersede each row by slug under actor 'SkyRoutine-s330-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('ironworker-film-draft-v1-2026-10-04',
 'The Ironworker pathway film, draft v1: 100 seconds, only In our data lines',
 'milestone',
 'prototype/ironworker_video/ (S330, #1859): the funding film''s engine forked, nine scenes, only In our data lines; the A.S. is the turn (up to 31.5 of the major''s 34-38 units through CPL). Player https://claude.ai/artifact/VdxzrRS7wVxw6o5m6fRTS9; sheet 36 card 3 asks Sam to keep, narrate or edit it.',
 'MP4 20261004_Ironworker_Pathway_in_Motion_v1.mp4 beside its source. Left out on purpose: the noncredit step (registered apprentices only; no sections this year), the B.S.''s 2024 proposed course list, every To confirm line, and "a degree" for the A.S. figure (34-38 is the major). build.py FACTS carries each figure with its source; a ladder change means an edit there and a re-render (render.sh, about five minutes). The score climbs to the A.S. (-17.2 dBFS mean) and is quiet under the recap.',
 'There is now a short draft film that walks through the ironworker pathway at Cerritos, from high school to a bachelor''s degree, using only facts we have confirmed; it waits for Sam''s review.',
 array['cpl-pathways','ironworker-film','cerritos','program-requirements'], array['prototype/ironworker_video/README.md','cpl_pathways_data.js'],
 'S330, PR #1859', 'SkyRoutine-s330', '2026-10-04', 'proposed'),
('advisor-asserts-beyond-fact-list-2026-10-04',
 'An advisor working from a vetted fact list still writes lines the list does not support',
 'pitfall',
 'Fable critiqued the Ironworker film storyboard from a brief of only In our data lines and still wrote four unsupported lines: a join, a category upgrade, a borrowed mechanism, a draft promoted to fact. Check each line an advisor drafts against its source line, never against the brief.',
 'The four: Columbus High''s mapping plus Credit by Exam as one claim; 34-38 major units as "nearly a whole degree"; Credit by Exam for the apprenticeship; the B.S. lower-division line from a discussion draft. KB note docs/kb-notes/methodology-an-advisor-asserts-what-its-fact-list-does-not-say.md. The structural advice (climax, cuts, barriers, recap) was taken whole; the risk sits in the sentences.',
 'An AI adviser given only checked facts can still combine or stretch them into claims we cannot back up, so every line it suggests has to be checked against where it came from.',
 array['methodology','advisors','verification','outward-artifacts','fable'], array['docs/kb-notes/methodology-an-advisor-asserts-what-its-fact-list-does-not-say.md','prototype/ironworker_video/README.md'],
 'docs/kb-notes/methodology-an-advisor-asserts-what-its-fact-list-does-not-say.md (S330)', 'SkyRoutine-s330', '2026-10-04', 'proposed')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyRoutine-s330', 'create', 'S330 checkpoint', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyRoutine-s330'
 and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, (select count(*) from public.cpl_memory_log l where l.memory_id=m.id and l.action='create') creates
from public.cpl_memory m where m.author = 'SkyRoutine-s330' order by m.slug;
