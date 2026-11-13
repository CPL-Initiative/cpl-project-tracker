-- Rollback for cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.sql. Restores both rows from the history rows the forward write filed
-- (cpl_library_history_trg, changed_by library-s647@bot), only while each still stands as the forward write left it, and raises,
-- changing nothing, unless both restores touch exactly one row; only then deletes the stored draft. The restore sets
-- updated_by back to 'Ally Barker', so cpl_library_history files the rollback itself under her name.
do $$
declare v_n int;
begin
  update public.cpl_library l
  set regen = h.before->'regen', refresh_note = h.before->>'refresh_note', rebuild_from = h.before->>'rebuild_from',
      note = h.before->>'note', updated_by = h.before->>'updated_by'
  from (select before from public.cpl_library_history where library_id = '4660a13b-984e-4030-a83b-762c507510a7' and changed_by = 'library-s647@bot'
        order by changed_at asc limit 1) h
  where l.id = '4660a13b-984e-4030-a83b-762c507510a7' and l.updated_by = 'library-s647@bot' and l.regen->>'draft_id' = 'b18c5759-b55b-4341-b3fc-f59c1fd5bcf6';
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'S647 rollback: how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1 is not as the forward write left it (% rows)', v_n; end if;

  update public.cpl_library l
  set regen = h.before->'regen', refresh_note = h.before->>'refresh_note', note = h.before->>'note',
      updated_by = h.before->>'updated_by'
  from (select before from public.cpl_library_history where library_id = 'f1078c28-d9fc-423b-bfc3-0832ae5e43fd' and changed_by = 'library-s647@bot'
        order by changed_at asc limit 1) h
  where l.id = 'f1078c28-d9fc-423b-bfc3-0832ae5e43fd' and l.updated_by = 'library-s647@bot' and l.regen is null and l.note like 'Superseded by how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1%';
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'S647 rollback: how-to-confirm-and-qualify-for-cpl-funding-mwdv9pl5 is not as the forward write left it (% rows)', v_n; end if;

  delete from public.cpl_library_drafts where id = 'b18c5759-b55b-4341-b3fc-f59c1fd5bcf6' and made_by = 'S647 session' and published_at is null;
  get diagnostics v_n = row_count;
  raise notice 'S647 rollback: both rows restored; % draft row deleted', v_n;
end $$;
