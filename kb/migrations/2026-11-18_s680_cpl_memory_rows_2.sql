-- cpl_memory corrections and two new rows for SkyPhoebe (S680), second checkpoint pass, 2026-11-18. Applied by
-- supabase-migrate.yml (kb/migrations/.apply). The UPDATEs touch only this run's own rows, matched on slug and
-- status = 'proposed', so a row someone verified or superseded since is left alone. The INSERTs are ON CONFLICT DO NOTHING.
-- ROLLBACK: kb/migrations/2026-11-18_s680_cpl_memory_rows_2_rollback.sql (restores the before-values below).

update public.cpl_memory set title = 'When every merge conflicts a generated file, land the work as one wave PR, not a chain', summary = 'S680: a chain (each branch holding the one before it) landed #3496, then #3498 conflicted: a squash on main and a branch holding the same change plus more edit the same generated-file hunks. One wave PR, #3504, carried the other nine PRs: one merge of main, one CI run, one squash, each carried PR closed with a pointer. The checkpoint lands last.', updated_at = now() where slug = 'pr-pr-chain-generated-conflicts-s680' and status = 'proposed';
update public.cpl_memory set title = 'MiraCosta 21976''s live row is on an older run than its filed record', summary = 'S680 pre-read (run 44258162212): MiraCosta 21976 is live on an older run (38748842603) than its filed record (39726634443), so the units rules apply left it out. Read both before any write to it. The slug says newer; the title and summary are corrected.', updated_at = now() where slug = 'f-miracosta-21976-live-newer-run-s680' and status = 'proposed';

insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('p-apply-line-carried-by-merge-s680','pitfall','A branch that merges another carries its kb/migrations/.apply line, and a push re-runs the apply','S680: chaining carried #3496''s .apply line onto other branches, and each push re-triggered its full-row apply (runs 44269433074, 44272782139). The count guard refused both ("the UPDATE matched 0 rows, the plan names 39"); nothing was written twice. A branch that merges another keeps main''s .apply text; every apply file stays guarded and idempotent.',array['supabase-migrate','merging','rule-10'],'proposed','docs/engineering_practices_lessons.md, S680; runs 44269433074 and 44272782139','SkyPhoebe (S680), the conductor',null,'SkyPhoebe (S680)',date '2026-11-18'),
('d-a5-five-rows-stay-applied-s680','decision','A5''s five applied rows stay applied; A5 runs on nothing further until its misses are listed','COBIx on #3496 (08:41Z, not blocking): A5''s self-check (69 right, 31 wrong of 123) does not support its five applied rows (Chaffey 38854, Marin 36465, Madera 44516, Merritt 33540, Saddleback 40326). Decided: they stay applied (each on the printed range at both ends; rollback committed); A5 runs on no further record until the 31 are listed by cause; the five get a lower confidence and a note.',array['program-requirements-harvest','units-rules'],'proposed','COBIx on #3496 (08:41Z); docs/reference/lanes/program-requirements-harvest.md','SkyPhoebe (S680), the conductor',null,'SkyPhoebe (S680)',date '2026-11-18')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyPhoebe (S680)', 'update', 'S680 second pass (2026-11-18): corrected title and summary', to_jsonb(m)
from public.cpl_memory m where m.slug in ('pr-pr-chain-generated-conflicts-s680','f-miracosta-21976-live-newer-run-s680') and m.status = 'proposed';
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyPhoebe (S680)', 'create', 'S680 second pass (2026-11-18)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('p-apply-line-carried-by-merge-s680','d-a5-five-rows-stay-applied-s680')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select slug, kind, status, length(summary) as summary_len, title from public.cpl_memory where slug in ('pr-pr-chain-generated-conflicts-s680','f-miracosta-21976-live-newer-run-s680','p-apply-line-carried-by-merge-s680','d-a5-five-rows-stay-applied-s680') order by slug;
