-- S611 SkyTadpole: Sam's Sheet 171 rulings, one decision row, INSERT-only with its log and verify. Lengths measured.
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('decision','sam-sheet-171-rulings-2026-11-08','Sheet 171: the ranking lag accepted, the key sketch merged, the anchor re-key as proposed',
 'Sam, Open Asks Sheet 171, 20:13-20:14Z 2026-11-08, all his own call: card 2 accept (the Exhibits ranking may lag a regrouping by a day); card 3 merge (#2932, one key-sketch pull, the 73 older deleted at the next load); card 4 proposed (next free numbers for three anchor collisions, hospitality three to the curator, 20 applied together).',
 'Card 1 drew a follow-up, not a verdict: "I believe there are no student IDs, names, emails, etc. just hashed ID with records of anonymous students CPL, right?" Answered in its thread from the schema and loader: no names, emails or MAP ids; a per-pull number; rows pseudonymous. Carried as Sheet 172 card 1 (where the datashare review lives).',
 'Sam accepted a one-day lag in the Exhibits ranking, approved trimming the key sample to one pull, and approved the course-id clean-up as proposed.',
 array['decision-sheets','disposition-grain-student-detail','common-subjects-reference'],'Open Asks Sheet 171 replies; cpl-project-tracker#2932','verified','Sam',now(),'2026-11-08','SkyTadpoleS611','high')
on conflict do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyTadpoleS611', 'create', 'Sheet 171 rulings (S611 SkyTadpole)', to_jsonb(m)
from public.cpl_memory m where m.slug = 'sam-sheet-171-rulings-2026-11-08'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug = 'sam-sheet-171-rulings-2026-11-08' group by m.slug;
-- Also written 2026-11-08 ~20:26Z (creates = 1): slug sam-no-cobi-datashare-review-2026-11-08, kind fact, verified_by Sam,
-- Sam's Sheet 172 card 1 answer verbatim in detail (no COBI datashare review; the CO GC's DAS and JST matters).
