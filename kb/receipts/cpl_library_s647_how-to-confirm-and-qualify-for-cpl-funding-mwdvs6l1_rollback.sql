-- Rollback for cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.sql, one statement, all or nothing: restores both rows from the history rows the
-- forward write filed (changed_by library-s647@bot) while each stands as it left them, then deletes the unpublished draft. Expect 1 1 1.
with h1 as (select before from public.cpl_library_history where library_id = '4660a13b-984e-4030-a83b-762c507510a7' and changed_by = 'library-s647@bot' order by changed_at asc limit 1),
h2 as (select before from public.cpl_library_history where library_id = 'f1078c28-d9fc-423b-bfc3-0832ae5e43fd' and changed_by = 'library-s647@bot' order by changed_at asc limit 1),
g as (select 1 from h1, h2
  where exists (select 1 from public.cpl_library where id = '4660a13b-984e-4030-a83b-762c507510a7' and updated_by = 'library-s647@bot' and regen->>'draft_id' = 'b18c5759-b55b-4341-b3fc-f59c1fd5bcf6')
    and exists (select 1 from public.cpl_library where id = 'f1078c28-d9fc-423b-bfc3-0832ae5e43fd' and updated_by = 'library-s647@bot' and regen is null and note like 'Superseded by how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1%')),
r1 as (update public.cpl_library l
  set regen = h1.before->'regen', refresh_note = h1.before->>'refresh_note', rebuild_from = h1.before->>'rebuild_from',
      note = h1.before->>'note', updated_by = h1.before->>'updated_by'
  from h1 where l.id = '4660a13b-984e-4030-a83b-762c507510a7' and l.updated_by = 'library-s647@bot' and l.regen->>'draft_id' = 'b18c5759-b55b-4341-b3fc-f59c1fd5bcf6' and exists (select 1 from g) returning l.id),
r2 as (update public.cpl_library l
  set regen = h2.before->'regen', refresh_note = h2.before->>'refresh_note', note = h2.before->>'note', updated_by = h2.before->>'updated_by'
  from h2 where l.id = 'f1078c28-d9fc-423b-bfc3-0832ae5e43fd' and l.updated_by = 'library-s647@bot' and l.regen is null and l.note like 'Superseded by how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1%'
    and exists (select 1 from g) returning l.id),
dd as (delete from public.cpl_library_drafts where id = 'b18c5759-b55b-4341-b3fc-f59c1fd5bcf6' and made_by = 'S647 session' and published_at is null
  and exists (select 1 from g) returning id),
n as (select (select count(*) from r1) as r1, (select count(*) from r2) as r2, (select count(*) from dd) as dd, exists (select 1 from g) as ok)
select r1, r2, dd, ok,
  case when ok and (r1, r2) <> (1, 1) then ('S647 rollback: a restore missed its row, so none stands: ' || r1 || r2)::int end as undone
from n;
