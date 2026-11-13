-- NOT YET RUN. Prepared 2026-11-13 by the S648 documents worker (the refresh) for the conductor to run in one execute_sql call.
-- cpl_memory rows for SkyTanager (S648), conductor mode, after the first checkpoint: 4 rows (3 decisions, 1 pitfall), status
-- proposed, for Sam to revise on Open Asks Sheet 194 (https://claude.ai/artifact/B6NYwHtu9cuMAEBqA9S6sq).
-- INSERT ... ON CONFLICT (slug) DO NOTHING, then the cpl_memory_log append, then the verify. Every summary at most 400
-- characters (the table's check), measured by script when written: 373, 393, 399, 358; the longest is 399.
-- d-busi-split-held-for-delete-s648 replaces the insert-only clause of d-reclustering-three-held-s648 (a conductor row; no human row is superseded).
-- ROLLBACK (by slug; never by author):
-- delete from cpl_memory_log where memory_id in (select id from cpl_memory where slug in (<the slugs below>));
-- delete from cpl_memory where slug in (<the slugs below>);
insert into cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-fire-m1274-into-fire-130x-applied-s648','decision','FIRE M1274 merged into FIRE 130 X (re-clustering case 2), applied','The S648 conductor, #3245 (c09ef2b3), on Sam''s Sheet 186 card 6: one kb_curation row (FIRE M1274, merge_into, FIRE 130 X, reclustering-s648@bot) through supabase-migrate.yml run 43493272194; receipt migration_s648_reclustering_cohort_43493272194.json, post-apply read confirmed. Undo: one guarded delete of that row. Adopter lists follow once the identities map is rebuilt.',array['commons','re-clustering','decision'],'proposed','S648, PR 3245; migration receipt 43493272194',null,null,'SkyTanager (S648)',date '2026-11-13'),
('d-busi-split-held-for-delete-s648','decision','The BUSI M1228 split waits for Sam''s word on deleting one bot row','The S648 conductor after #3245''s review (6 agents, 16 confirmed): the insert-only split leaves BUSI M1228 carrying Santa Ana BUS 115''s title, count and aggregates and mints BUSI M11TU beside a live BUSI M10XW. The clean route deletes the bot row BUSI M10XW merge_into BUSI M1228 (automerge-titlelane-v1@bot): Sheet 194 card 3. Replaces the insert-only clause of d-reclustering-three-held-s648.',array['commons','re-clustering','decision'],'proposed','S648, PR 3245 review; Open Asks Sheet 194 card 3',null,null,'SkyTanager (S648)',date '2026-11-13'),
('d-glendale-load-plan-s648','decision','Glendale''s load is planned against a live read of the table','The S648 conductor, #3202: the plan (load_plan_s648.json) inserts 31, rereads 139 (run 43415972509) and 4 (run 43497305929) and leaves 83 live rows; expected 257 live, 182 passing. A live read held 226 rows, not main''s 260 filed. A second reader found the load''s hold guard failed open (the file step dropped the hold list from summary.json); fixed, the load derives refused tabs itself, test added.',array['program-requirements-harvest','glendale','decision'],'proposed','S648, PR 3202; load_plan_s648.json',null,null,'SkyTanager (S648)',date '2026-11-13'),
('p-load-plan-from-live-read-s648','pitfall','A load plan built from filed records can be wrong about the table','S648, Glendale (#3202): a plan built from main''s 260 filed records assumed rows the table never held (226 live; 34 filed records place no course and were never loaded). The conductor''s write-time read caught it. Measure a load plan against a live read of the table, never against files, and test a guard that reads another step''s list with that list missing.',array['program-requirements-harvest','rule-10','pitfall'],'proposed','S648, PR 3202; conductor''s live read',null,null,'SkyTanager (S648)',date '2026-11-13')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyTanager (S648)', 'create', 'checkpoint auto-write (S648 refresh, 2026-11-13)', to_jsonb(m)
from public.cpl_memory m where m.slug in
  ('d-fire-m1274-into-fire-130x-applied-s648','d-busi-split-held-for-delete-s648','d-glendale-load-plan-s648','p-load-plan-from-live-read-s648')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, length(m.summary) as summary_chars, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in
  ('d-fire-m1274-into-fire-130x-applied-s648','d-busi-split-held-for-delete-s648','d-glendale-load-plan-s648','p-load-plan-from-live-read-s648')
group by m.slug, m.summary order by m.slug;
