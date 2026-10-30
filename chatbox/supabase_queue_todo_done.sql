-- supabase_queue_todo_done.sql — Sam marks one of his to-dos done, and the queue reads it.
--
-- Sam, 2026-10-30 ~12:30Z, in S527, on the stopping rule for a college whose catalog stops paying
-- for itself: "Add a to do list on Catalog common that shows on Sam's To do. Give me instructions
-- on what you need to turn the process for the college back on. When I complete a to do on the
-- commons, it should alert the cpl queue schedule task." Lane:
-- docs/reference/lanes/program-requirements-harvest.md (the stopping rule).
--
-- WHAT A ROW IS: one "done" on one to-do: the project's status file (kb/status/<project>.json)
-- names the to-do in a call's todo_id; the row carries the project, the todo_id, the note Sam
-- leaves (what he did, a contact, a file's link), who (the session's email, never a client
-- argument) and when. Nothing updates or removes a row; marking a to-do open again adds a row
-- with reopen = true, and the newest row for a to-do wins.
--
-- THE ALERT: a scheduled session reads the rows newer than its handoff at the start
-- (docs/reference/scheduled_sessions.md, At the start, step 5), works each one as the first
-- queue item, and writes the call's answer into the status file at its checkpoint.
--
-- WHO WRITES: queue_todo_done_add only, as an allowed reviewer (is_allowed_reviewer(),
-- kb/supabase_curation_setup.sql). WHO READS: reviewers (the rows name staff emails).
--
-- GOVERNANCE (Rule 10 a3): kb/governance_surface_map.json maps the table and the function, with
-- the reason. No student grain: the student-detail ADR does not reach it.
--
-- Rollback (Rule 10 a2): a done is undone by a reopen row. To retire the surface: revoke and drop
-- the function, then the table; the status files keep each call's answer as text.
-- Receipt: kb/receipts/queue_todo_done_2026-10-30_s527.sql.

create table if not exists public.queue_todo_done (
  id        bigint generated always as identity primary key,
  project   text not null check (project ~ '^[a-z][a-z0-9-]{1,40}$'),
  todo_id   text not null check (todo_id ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  note      text check (note is null or char_length(note) <= 2000),
  reopen    boolean not null default false,
  by_email  text not null,
  at        timestamptz not null default now()
);
create index if not exists queue_todo_done_todo on public.queue_todo_done (project, todo_id, id desc);

alter table public.queue_todo_done enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'queue_todo_done' and policyname = 'queue_todo_done_reviewer_read') then
    create policy queue_todo_done_reviewer_read on public.queue_todo_done
      for select to authenticated using (public.is_allowed_reviewer());
  end if;
end
$$;

-- Default privileges here grant every privilege on a new table to anon and authenticated; RLS
-- stops row writes but not TRUNCATE. The table grants reads only.
revoke all on table public.queue_todo_done from public, anon, authenticated;
grant select on table public.queue_todo_done to authenticated;
grant select on table public.queue_todo_done to service_role;
revoke all on sequence public.queue_todo_done_id_seq from public, anon, authenticated;

create or replace function public.queue_todo_done_add(
  p_project text, p_todo_id text, p_note text, p_reopen boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  who    text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  vid    bigint;
  vat    timestamptz;
begin
  if who = '' or not public.is_allowed_reviewer() then
    raise exception 'queue_todo_done_add: not an allowed reviewer' using errcode = '42501';
  end if;
  if p_project is null or p_project !~ '^[a-z][a-z0-9-]{1,40}$'
     or p_todo_id is null or p_todo_id !~ '^[a-z0-9][a-z0-9-]{1,80}$' then
    raise exception 'queue_todo_done_add: the to-do is named by its project and todo_id' using errcode = '22023';
  end if;
  if v_note is not null and char_length(v_note) > 2000 then
    raise exception 'queue_todo_done_add: the note is longer than 2,000 characters' using errcode = '22001';
  end if;
  insert into public.queue_todo_done (project, todo_id, note, reopen, by_email)
  values (p_project, p_todo_id, v_note, coalesce(p_reopen, false), who)
  returning id, at into vid, vat;
  return jsonb_build_object('id', vid, 'at', vat, 'project', p_project, 'todo_id', p_todo_id,
                            'reopen', coalesce(p_reopen, false), 'by_email', who);
end
$$;
-- PUBLIC holds EXECUTE from creation and default privileges grant anon by name (Rule 10 b2):
-- revoke from all three, then grant the signed-in role; the function checks the reviewer list.
revoke all on function public.queue_todo_done_add(text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.queue_todo_done_add(text, text, text, boolean) to authenticated, service_role;
