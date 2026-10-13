-- Schema of record: the Annual Goals Move control (lane workplan-annual-goals, PR C).
--
-- Sam, 2026-10-12: move 1.1.2 AI Apprenticeship CPL Tools under 4.2 Apprenticeship
-- Sprint "now", and give the tab a Move control. The workplan tree is keyed by the id
-- itself (projects has no parent column; nesting is the id's depth), so a move is a
-- re-key of every table that stores the id. The #872 reorg re-keyed three of them and
-- left the rest on the old numbers, silently mis-attaching targets and hiding ten
-- projects. This function re-keys all of them in one transaction, and refuses to
-- finish if any table it does not know still holds the old id.
--
-- The tables it re-keys (measured live 2026-10-13):
--   projects                        id (primary key; no parent column)
--   update_log                      project_id  (FK to projects.id, NOT deferrable,
--                                   no cascade: so the projects row is copied under
--                                   the new id, update_log re-pointed, then the old
--                                   row deleted)
--   item_raci                       item_id where item_type = 'project'
--   item_updates                    item_id where item_type = 'project'
--   project_lifecycle               project_id
--   workplan_goals                  activity_id where kind = 'project' (the ladder)
--   workplan_activity_associations  project_id; the new home Activity becomes the
--                                   primary link, the other links stay (Sam's
--                                   1.1.2 ruling: "keep Activity 1 link"), unless
--                                   the caller asks to drop the old home's link
-- Not re-keyed: item_raci / item_updates rows with item_type = 'activity' (Activity
-- numbers, never dotted) and nc_artifacts / nc_partner_notes (their item_id holds
-- learning-partner keys such as UC-..., never a workplan id).
--
-- THE GUARD. After the re-key, every public base table with a text column named
-- project_id, item_id or activity_id is scanned for the old id. A hit raises, and the
-- whole move rolls back: a table added later that stores the id cannot be silently
-- left behind (tests/workplan_move_sql.test.js pins the scan and the table list).
--
-- WHO MAY MOVE. A signed-in reviewer (is_allowed_reviewer()), not the team phrase:
-- a move renumbers a sub-activity everywhere, so it starts with the narrower gate.
-- Whether the team phrase may move too is Sam's call (Open Asks sheet). Widening is
-- one line here plus `grant execute ... to anon` (the phrase rides the anon role).
--
-- REVERSIBLE (Rule 10 a2). Every move files the rows it changed, as they stood, in
-- workplan_id_moves.before. To undo move N: call the function again from new_id
-- back to old_id, then restore the links' primary flags (and any link the move
-- dropped) from that row:
--   select public.workplan_move_sub_activity('<new_id>', '<old_id>', true);
--   delete from public.workplan_activity_associations where project_id = '<old_id>';
--   insert into public.workplan_activity_associations (project_id, activity_id, is_primary, created_at)
--   select project_id, activity_id, is_primary, created_at
--     from jsonb_to_recordset((select before->'workplan_activity_associations'
--                                from public.workplan_id_moves where id = N))
--       as x(project_id text, activity_id text, is_primary boolean, created_at timestamptz);
--   update public.projects set workplan_activity = (select before->'projects'->>'workplan_activity'
--     from public.workplan_id_moves where id = N) where id = '<old_id>';
--
-- Applied with apply_migration (name: workplan_move_sub_activity). Drop to retire:
--   drop function public.workplan_move_sub_activity(text, text, boolean);
--   drop table public.workplan_id_moves;

create table if not exists public.workplan_id_moves (
  id        bigint generated always as identity primary key,
  moved_at  timestamptz not null default now(),
  moved_by  text not null,
  old_id    text not null,
  new_id    text not null,
  before    jsonb not null,
  counts    jsonb not null
);
comment on table public.workplan_id_moves is
  'One row per Move on Annual Workplan Goals (workplan_move_sub_activity): who, when, old and new id, every row the move changed as it stood (before), and how many rows each table re-keyed. The undo reads it (kb/supabase_workplan_move.sql).';
alter table public.workplan_id_moves enable row level security;
drop policy if exists workplan_id_moves_reviewer_read on public.workplan_id_moves;
create policy workplan_id_moves_reviewer_read on public.workplan_id_moves
  for select to authenticated using (public.is_allowed_reviewer());
-- Written only by the function (security definer); read by a signed-in reviewer.
revoke all on table public.workplan_id_moves from public, anon, authenticated;
grant select on table public.workplan_id_moves to authenticated;
grant all on table public.workplan_id_moves to service_role;

create or replace function public.workplan_move_sub_activity(
  p_old_id text, p_new_id text, p_keep_old_link boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  who        text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_old      text := btrim(coalesce(p_old_id, ''));
  v_new      text := btrim(coalesce(p_new_id, ''));
  v_parent   text;
  v_old_home text;
  v_home     text;
  v_label    text;
  v_before   jsonb;
  c          jsonb := '{}'::jsonb;
  n          int;
  t          record;
  leftover   bigint;
  mid        bigint;
begin
  if who = '' or not public.is_allowed_reviewer() then
    raise exception 'workplan_move_sub_activity: not an allowed reviewer' using errcode = '42501';
  end if;
  if v_old !~ '^[1-4](\.[0-9]+)+$' or v_new !~ '^[1-4](\.[0-9]+)+$' then
    raise exception 'workplan_move_sub_activity: a sub-activity id looks like 3.9 or 4.2.1 (got % and %)', v_old, v_new
      using errcode = '22023';
  end if;
  if v_old = v_new then
    raise exception 'workplan_move_sub_activity: % is already %', v_old, v_new using errcode = '22023';
  end if;
  if v_new like v_old || '.%' then
    raise exception 'workplan_move_sub_activity: % cannot move under itself', v_old using errcode = '22023';
  end if;

  perform 1 from public.projects where id = v_old for update;
  if not found then
    raise exception 'workplan_move_sub_activity: no sub-activity %', v_old using errcode = 'P0002';
  end if;
  if exists (select 1 from public.projects where id like v_old || '.%') then
    raise exception 'workplan_move_sub_activity: % has sub-activities under it; move those first', v_old
      using errcode = '22023';
  end if;
  if exists (select 1 from public.projects where id = v_new)
     or exists (select 1 from public.workplan_goals where activity_id = v_new)
     or exists (select 1 from public.workplan_activity_associations where project_id = v_new)
     or exists (select 1 from public.item_raci where item_type = 'project' and item_id = v_new)
     or exists (select 1 from public.item_updates where item_type = 'project' and item_id = v_new)
     or exists (select 1 from public.project_lifecycle where project_id = v_new)
     or exists (select 1 from public.update_log where project_id = v_new) then
    raise exception 'workplan_move_sub_activity: % is already in use', v_new using errcode = '23505';
  end if;

  v_parent   := regexp_replace(v_new, '\.[0-9]+$', '');
  v_home     := split_part(v_new, '.', 1);
  v_old_home := split_part(v_old, '.', 1);
  if v_parent <> v_home and not exists (select 1 from public.projects where id = v_parent) then
    raise exception 'workplan_move_sub_activity: no sub-activity % to move under', v_parent using errcode = 'P0002';
  end if;
  -- The home label projects.workplan_activity carries: the one its new siblings use
  -- (the field is read by its number; the name part may differ from workplan_goals).
  select workplan_activity into v_label from public.projects
   where workplan_activity like 'Activity ' || v_home || ':%' and id <> v_old
   group by workplan_activity order by count(*) desc, workplan_activity limit 1;
  if v_label is null then
    select name into v_label from public.workplan_goals
     where kind = 'activity' and activity_id = v_home order by row_type limit 1;
  end if;
  if v_label is null then
    raise exception 'workplan_move_sub_activity: no Activity %', v_home using errcode = 'P0002';
  end if;

  -- Every row the move changes, as it stands (the undo reads this).
  v_before := jsonb_build_object(
    'projects', (select to_jsonb(p) from public.projects p where p.id = v_old),
    'update_log', (select coalesce(jsonb_agg(u.id order by u.id), '[]'::jsonb)
                     from public.update_log u where u.project_id = v_old),
    'item_raci', (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
                    from public.item_raci r where r.item_type = 'project' and r.item_id = v_old),
    'item_updates', (select coalesce(jsonb_agg(i.id order by i.id), '[]'::jsonb)
                       from public.item_updates i where i.item_type = 'project' and i.item_id = v_old),
    'project_lifecycle', (select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb)
                            from public.project_lifecycle l where l.project_id = v_old),
    'workplan_goals', (select coalesce(jsonb_agg(g.id order by g.id), '[]'::jsonb)
                         from public.workplan_goals g where g.kind = 'project' and g.activity_id = v_old),
    'workplan_activity_associations', (select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
                         from public.workplan_activity_associations a where a.project_id = v_old));

  -- projects: copy under the new id, re-point the one FK, then drop the old row.
  insert into public.projects
  select (jsonb_populate_record(null::public.projects,
            to_jsonb(p) || jsonb_build_object(
              'id', v_new,
              'workplan_activity', case when v_old_home = v_home then p.workplan_activity else v_label end))).*
    from public.projects p where p.id = v_old;
  update public.update_log set project_id = v_new where project_id = v_old;
  get diagnostics n = row_count; c := c || jsonb_build_object('update_log', n);
  delete from public.projects where id = v_old;
  c := c || jsonb_build_object('projects', 1);

  update public.item_raci set item_id = v_new where item_type = 'project' and item_id = v_old;
  get diagnostics n = row_count; c := c || jsonb_build_object('item_raci', n);
  update public.item_updates set item_id = v_new where item_type = 'project' and item_id = v_old;
  get diagnostics n = row_count; c := c || jsonb_build_object('item_updates', n);
  update public.project_lifecycle set project_id = v_new where project_id = v_old;
  get diagnostics n = row_count; c := c || jsonb_build_object('project_lifecycle', n);
  update public.workplan_goals set activity_id = v_new where kind = 'project' and activity_id = v_old;
  get diagnostics n = row_count; c := c || jsonb_build_object('workplan_goals', n);

  update public.workplan_activity_associations
     set project_id = v_new, is_primary = (activity_id = v_home)
   where project_id = v_old;
  get diagnostics n = row_count; c := c || jsonb_build_object('workplan_activity_associations', n);
  insert into public.workplan_activity_associations (project_id, activity_id, is_primary)
  values (v_new, v_home, true)
  on conflict (project_id, activity_id) do update set is_primary = true;
  if not p_keep_old_link and v_old_home <> v_home then
    delete from public.workplan_activity_associations where project_id = v_new and activity_id = v_old_home;
  end if;

  -- THE GUARD: no table may still hold the old id.
  for t in
    select c2.table_name, c2.column_name
      from information_schema.columns c2
      join information_schema.tables tb
        on tb.table_schema = c2.table_schema and tb.table_name = c2.table_name
     where c2.table_schema = 'public' and tb.table_type = 'BASE TABLE'
       and c2.column_name in ('project_id', 'item_id', 'activity_id')
       and c2.data_type in ('text', 'character varying')
       and c2.table_name <> 'workplan_id_moves'
  loop
    execute format('select count(*) from public.%I where %I = $1', t.table_name, t.column_name)
      into leftover using v_old;
    if leftover > 0 then
      raise exception 'workplan_move_sub_activity: %.% still holds % after the move (a table the move does not know); nothing was changed',
        t.table_name, t.column_name, v_old using errcode = '55000';
    end if;
  end loop;

  insert into public.workplan_id_moves (moved_by, old_id, new_id, before, counts)
  values (who, v_old, v_new, v_before, c)
  returning id into mid;

  return jsonb_build_object('ok', true, 'move', mid, 'old_id', v_old, 'new_id', v_new,
                            'home', v_home, 'counts', c);
end;
$$;

comment on function public.workplan_move_sub_activity(text, text, boolean) is
  'Move a sub-activity to a new id (a new parent): re-keys projects, update_log, item_raci, item_updates, project_lifecycle, workplan_goals and workplan_activity_associations in one transaction, refuses when any other table still holds the old id, and files the before-values in workplan_id_moves. Reviewer-only. kb/supabase_workplan_move.sql.';

-- Closed to anon (Rule 10 b2: PUBLIC holds EXECUTE from creation and default
-- privileges grant anon by name); open to a signed-in caller, gated inside.
revoke all on function public.workplan_move_sub_activity(text, text, boolean) from public, anon, authenticated;
grant execute on function public.workplan_move_sub_activity(text, text, boolean) to authenticated, service_role;
