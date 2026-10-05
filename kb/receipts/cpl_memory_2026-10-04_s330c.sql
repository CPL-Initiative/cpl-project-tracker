-- S330 (SkyRoutine), 2026-10-04 23:43Z: Sam's verdict on the Ironworker film, in his words (verified: he said it).
-- Rollback: supersede the row by slug under actor 'SkyRoutine-s330-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-ironworker-film-excellent-2026-10-04',
 'Sam: the Ironworker pathway film draft v1 is excellent; kept as is',
 'decision',
 'Sam, in session S330, 2026-10-04 23:42Z, after watching draft v1: "Video is excellent!" The film (prototype/ironworker_video/, 100 s, only In our data lines) is kept as is; open-asks sheet 36 card 3 left with the ruling.',
 'Player https://claude.ai/artifact/VdxzrRS7wVxw6o5m6fRTS9; MP4 20261004_Ironworker_Pathway_in_Motion_v1.mp4. The card proposed keeping v1 with a narrated cut by Sierra only if he wants one; he did not ask for narration. Re-render when a ladder line the film shows changes (build.py FACTS).',
 'Sam watched the short Ironworker pathway film and called it excellent, so it stays as made.',
 array['cpl-pathways','ironworker-film','decision-sheet','cerritos'], array['prototype/ironworker_video/README.md','docs/reference/lanes/program-requirements-harvest.md'],
 'Sam in session S330, 2026-10-04 23:42Z', 'SkyRoutine-s330', '2026-10-04', 'verified', 'Sam', now())
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyRoutine-s330', 'create', 'S330 Sam film verdict', to_jsonb(m)
from public.cpl_memory m where m.slug = 'sam-ironworker-film-excellent-2026-10-04'
 and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, m.verified_by, (select count(*) from public.cpl_memory_log l where l.memory_id=m.id and l.action='create') creates
from public.cpl_memory m where m.slug = 'sam-ironworker-film-excellent-2026-10-04';
