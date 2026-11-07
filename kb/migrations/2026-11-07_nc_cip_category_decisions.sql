-- PROJECT: Work Plan (hvuwhnbuahrtptokpqfh). HELD: not named in .apply. It applies with build
-- phase 3 of docs/noncredit_cip_category_scope.md (the picker), the table's first writer, so
-- the table never sits live with no surface. S603 SkyMaffei, 2026-11-07.
--
-- Where a confirmed noncredit CIP category is saved (Sam, Open Asks Sheet 169 card 2, 20:57Z:
-- "table"). A browser's localStorage cannot hold a funding-relevant determination: it names
-- nobody, lives in one browser and vanishes with it. One row per program, keyed on the same
-- program key the Programs list uses, carrying who confirmed it and when.
--
-- Governance (Rule 10 a3): register row DR-33 (kb/governance_register.json), mapped in
-- kb/governance_surface_map.json. The decision is the college's (the CO page: codes are
-- "examples … colleges … identify the most appropriate CIP"); a signed-in reviewer records it
-- on the college's word. No student or staff detail: the row carries a program, a category, codes
-- and the recorder's sign-in email, so the student-detail disclosure ADR does not reach it.
--
-- Gates, each earned:
--   * Writers are a reviewer sign-in only (is_allowed_reviewer()). The team phrase names nobody,
--     and the point of the table is who and when. confirmed_by is set from the sign-in by the
--     trigger, never taken from the client.
--   * Readers: team phrase or reviewer sign-in. No anon read (funding-relevant, unpublished).
--   * A rule never writes here: the guard from #1192 ("computed, never stored"). The picker's
--     proposal stays computed; only a person's confirm inserts.
--   * No DELETE policy. Every edit files the prior row in the history table (Rule 10 a2), so a
--     change of mind is an UPDATE that the history can undo.
--   * Populations (substantial_disabilities, older_adults) are categories here like any other;
--     the scope's rule that they are never inferred is the picker's, since only a person writes.
--   * secondary_cip only on Short-Term Vocational, where the category requires one.
-- Rollback: 2026-11-07_nc_cip_category_decisions_rollback.sql.

create table if not exists public.nc_cip_category_decisions (
  program_key    text primary key,
  college        text not null,
  program_title  text,
  category       text not null check (category in (
                   'short_term_vocational', 'workforce_preparation', 'esl',
                   'elementary_secondary_basic_skills', 'immigrant_education',
                   'health_and_safety', 'parenting', 'home_economics',
                   'substantial_disabilities', 'older_adults')),
  primary_cip    text not null check (primary_cip ~ '^[0-9]{2}\.[0-9]{4}$'),
  secondary_cip  text check (secondary_cip is null or secondary_cip ~ '^[0-9]{2}\.[0-9]{4}$'),
  coci_cip       text,
  note           text,
  confirmed_by   text not null,
  confirmed_at   timestamptz not null default now(),
  constraint nc_cip_secondary_only_stv check (
    (category = 'short_term_vocational') = (secondary_cip is not null))
);

create table if not exists public.nc_cip_category_decisions_history (
  id           bigserial primary key,
  program_key  text not null,
  changed_by   text,
  changed_at   timestamptz not null default now(),
  before       jsonb not null
);
create index if not exists nc_cip_category_decisions_history_key_idx
  on public.nc_cip_category_decisions_history (program_key, changed_at desc);

-- confirmed_by and confirmed_at come from the sign-in and the clock, never the client.
create or replace function public.nc_cip_category_stamp() returns trigger
  language plpgsql security invoker set search_path = public, pg_catalog as
$$
begin
  new.confirmed_by := coalesce(auth.jwt() ->> 'email', current_user);
  new.confirmed_at := now();
  return new;
end;
$$;

-- SECURITY DEFINER so the trigger can file history that no client may write.
create or replace function public.nc_cip_category_file_history() returns trigger
  language plpgsql security definer set search_path = public, pg_catalog as
$$
begin
  insert into public.nc_cip_category_decisions_history (program_key, changed_by, before)
  values (old.program_key, new.confirmed_by, to_jsonb(old));
  return new;
end;
$$;

-- Rule 10 b2: PUBLIC holds EXECUTE from creation, and anon is granted by name.
revoke execute on function public.nc_cip_category_stamp() from public, anon, authenticated;
revoke execute on function public.nc_cip_category_file_history() from public, anon, authenticated;

drop trigger if exists nc_cip_category_stamp_trg on public.nc_cip_category_decisions;
create trigger nc_cip_category_stamp_trg before insert or update on public.nc_cip_category_decisions
  for each row execute function public.nc_cip_category_stamp();
drop trigger if exists nc_cip_category_history_trg on public.nc_cip_category_decisions;
create trigger nc_cip_category_history_trg after update on public.nc_cip_category_decisions
  for each row execute function public.nc_cip_category_file_history();

alter table public.nc_cip_category_decisions enable row level security;
alter table public.nc_cip_category_decisions_history enable row level security;

drop policy if exists nc_cip_category_read on public.nc_cip_category_decisions;
create policy nc_cip_category_read on public.nc_cip_category_decisions for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());
drop policy if exists nc_cip_category_insert on public.nc_cip_category_decisions;
create policy nc_cip_category_insert on public.nc_cip_category_decisions for insert
  with check (public.is_allowed_reviewer());
drop policy if exists nc_cip_category_update on public.nc_cip_category_decisions;
create policy nc_cip_category_update on public.nc_cip_category_decisions for update
  using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
drop policy if exists nc_cip_category_history_read on public.nc_cip_category_decisions_history;
create policy nc_cip_category_history_read on public.nc_cip_category_decisions_history for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());

-- Data API grants, stated rather than inherited (tests/supabase_table_grants_test.py).
grant select, insert, update on public.nc_cip_category_decisions to anon, authenticated;
grant select, insert, update, delete on public.nc_cip_category_decisions to service_role;
grant select on public.nc_cip_category_decisions_history to anon, authenticated;
grant select, insert on public.nc_cip_category_decisions_history to service_role;
grant usage, select on sequence public.nc_cip_category_decisions_history_id_seq to service_role;
revoke delete on public.nc_cip_category_decisions from anon, authenticated;
revoke insert, update, delete on public.nc_cip_category_decisions_history from anon, authenticated;
revoke usage, select on sequence public.nc_cip_category_decisions_history_id_seq from anon, authenticated;
revoke truncate, references, trigger on public.nc_cip_category_decisions from anon, authenticated;
revoke truncate, references, trigger on public.nc_cip_category_decisions_history from anon, authenticated;
