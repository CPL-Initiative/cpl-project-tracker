-- supabase_program_record_verdicts.sql — a reviewer's reading of a program record,
-- written from the Program records view.
--
-- Sam, Open Asks Sheet 51 card 1 ("build", 2026-10-08 20:35Z; confirmed in chat the
-- same evening: "Sheet 51: 1 Build it, 2 Go."), on the mock-up Program Records Review
-- (prototype/roep_record_flags_mockup.html). Each record ends with Confirm and Needs a
-- fix; only a reviewer signed in with the magic link sees them. Lane:
-- docs/reference/lanes/program-requirements-harvest.md.
--
-- WHAT A ROW IS: one verdict on one record (college, control_number): confirm or
-- needs_fix, the note, who (the session's email, never a client argument), when, and
-- the fingerprint of the requirements the page showed. The log keeps every verdict;
-- undoing one adds a row. Nothing updates or removes a row.
--
-- THE FINGERPRINT: program_record_fp(record) hashes the program's figures and every
-- block, leaving out the outcomes, as kb/_program_requirements_score.py
-- requirements_md5() does for the repo's readings (Postgres prints jsonb its own way,
-- so the two hashes differ in value and agree in what they cover). The page reads it
-- through the computed field requirements_fp, and the write refuses a fingerprint that
-- no longer matches the row: a reviewer confirms the record they read.
--
-- CHECKED FOLLOWS THE LATEST VERDICT while its fingerprint matches the row: confirm
-- marks the record checked when its three machine checks pass (coverage, nothing
-- invented, the units equal the printed total or the catalog prints none; the tab's
-- recordChecks() reads them the same way), and needs_fix leaves it unchecked. The
-- trigger program_requirement_records_follow_verdict applies that rule on every write
-- to the row, so a later reload from the repo's files cannot undo a person's reading
-- of the same requirements; a reload that changes a block changes the fingerprint,
-- and the record waits for a person to read it again.
--
-- NEEDS A FIX files the note on the college's reading procedure (procedure.open)
-- through program_source_procedure_set, so the registry's history keeps the prior
-- record and names the reviewer and the verdict.
--
-- WHO WRITES: program_record_verdict_add only, as an allowed reviewer
-- (is_allowed_reviewer(), kb/supabase_curation_setup.sql). WHO READS: reviewers (the
-- log names staff emails, so it is not public). Reviewers also read the unchecked
-- records, which the public read never shows, so they can read them before confirming.
--
-- GOVERNANCE (Rule 10 a3): kb/governance_surface_map.json dismisses the table and the
-- function with the reason. No student grain: the student-detail ADR does not reach it.
--
-- Rollback (Rule 10 a2): a verdict is undone by the opposite verdict (a row). To
-- retire the surface: the trigger and the function go first, then the policy on
-- program_requirement_records, then the table; checked returns to the loader's value
-- on the next reload.
-- Receipt: kb/receipts/program_record_verdicts_2026-10-08_s347.sql.

-- 1. The fingerprint, the machine checks, and the computed field the page selects.
create or replace function public.program_record_fp(rec jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select md5(jsonb_build_object(
    'program', coalesce(rec->'program', '{}'::jsonb) - 'outcomes',
    'blocks',  coalesce(rec->'blocks', '[]'::jsonb))::text);
$$;

create or replace function public.program_record_machine_pass(c jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(c->>'coverage', '') = 'true'
     and coalesce(c->>'invented', '') = 'true'
     and coalesce(c->>'arithmetic', '') in ('equal', 'unstated');
$$;

-- PostgREST computed field: select=...,requirements_fp
create or replace function public.requirements_fp(r public.program_requirement_records)
returns text
language sql
stable
set search_path = public
as $$
  select public.program_record_fp(r.record);
$$;

revoke all on function public.program_record_fp(jsonb) from public, anon;
revoke all on function public.program_record_machine_pass(jsonb) from public, anon;
revoke all on function public.requirements_fp(public.program_requirement_records) from public, anon;
grant execute on function public.program_record_fp(jsonb) to authenticated, service_role;
grant execute on function public.program_record_machine_pass(jsonb) to authenticated, service_role;
grant execute on function public.requirements_fp(public.program_requirement_records) to authenticated, service_role;

-- 2. The log.
create table if not exists public.program_record_verdicts (
  id               bigint generated always as identity primary key,
  college          text not null,
  control_number   text not null,
  verdict          text not null check (verdict in ('confirm', 'needs_fix')),
  note             text check (note is null or char_length(note) <= 2000),
  requirements_fp  text not null,
  checked_after    boolean not null,
  by_email         text not null,
  at               timestamptz not null default now(),
  check (verdict = 'confirm' or note is not null),
  foreign key (college, control_number)
    references public.program_requirement_records (college, control_number)
);
create index if not exists program_record_verdicts_record
  on public.program_record_verdicts (college, control_number, id desc);

alter table public.program_record_verdicts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'program_record_verdicts' and policyname = 'program_record_verdicts_reviewer_read') then
    create policy program_record_verdicts_reviewer_read on public.program_record_verdicts
      for select to authenticated using (public.is_allowed_reviewer());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'program_requirement_records' and policyname = 'program_requirement_records_reviewer_read') then
    create policy program_requirement_records_reviewer_read on public.program_requirement_records
      for select to authenticated using (public.is_allowed_reviewer());
  end if;
end
$$;

-- This project's default privileges grant every privilege on a new table to anon and
-- authenticated; RLS stops row writes but not TRUNCATE. The log grants reads only.
revoke all on table public.program_record_verdicts from public, anon, authenticated;
grant select on table public.program_record_verdicts to authenticated;
grant select on table public.program_record_verdicts to service_role;

-- 3. Checked follows the latest verdict on every write to a record.
create or replace function public.program_requirement_records_follow_verdict()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.program_record_verdicts%rowtype;
begin
  select * into v from public.program_record_verdicts
   where college = new.college and control_number = new.control_number
   order by id desc limit 1;
  if found and v.requirements_fp = public.program_record_fp(new.record) then
    if v.verdict = 'confirm' and public.program_record_machine_pass(new.checks) then
      new.checked := true;
      new.checked_by := v.by_email;
      new.checked_at := v.at;
    else
      new.checked := false;
      new.checked_by := null;
      new.checked_at := null;
    end if;
  end if;
  return new;
end
$$;
revoke all on function public.program_requirement_records_follow_verdict() from public, anon, authenticated;

create or replace trigger program_requirement_records_follow_verdict
  before insert or update on public.program_requirement_records
  for each row execute function public.program_requirement_records_follow_verdict();

-- 4. The one write.
create or replace function public.program_record_verdict_add(
  p_college text, p_control_number text, p_verdict text, p_note text, p_requirements_fp text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r      public.program_requirement_records%rowtype;
  reg    public.program_source_registry%rowtype;
  who    text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  fp     text;
  after  boolean;
  vid    bigint;
  vat    timestamptz;
  proc   jsonb;
  filed  boolean := false;
begin
  if who = '' or not public.is_allowed_reviewer() then
    raise exception 'program_record_verdict_add: not an allowed reviewer' using errcode = '42501';
  end if;
  if p_verdict is null or p_verdict not in ('confirm', 'needs_fix') then
    raise exception 'program_record_verdict_add: the verdict is confirm or needs_fix' using errcode = '22023';
  end if;
  if p_verdict = 'needs_fix' and v_note is null then
    raise exception 'program_record_verdict_add: Needs a fix takes a note saying what should change' using errcode = '22023';
  end if;
  if v_note is not null and char_length(v_note) > 2000 then
    raise exception 'program_record_verdict_add: the note is longer than 2,000 characters' using errcode = '22001';
  end if;

  select * into r from public.program_requirement_records
   where college = p_college and control_number = p_control_number for update;
  if not found then
    raise exception 'program_record_verdict_add: no record for % %', p_college, p_control_number using errcode = 'P0002';
  end if;
  fp := public.program_record_fp(r.record);
  if p_requirements_fp is distinct from fp then
    raise exception 'program_record_verdict_add: the record changed since the page read it; reload it and read it again'
      using errcode = '40001';
  end if;

  after := p_verdict = 'confirm' and public.program_record_machine_pass(r.checks);
  insert into public.program_record_verdicts (college, control_number, verdict, note, requirements_fp, checked_after, by_email)
  values (p_college, p_control_number, p_verdict, v_note, fp, after, who)
  returning id, at into vid, vat;

  -- The trigger reads the verdict just logged and sets the same values.
  update public.program_requirement_records
     set checked = after,
         checked_by = case when after then who end,
         checked_at = case when after then vat end
   where college = p_college and control_number = p_control_number;

  if p_verdict = 'needs_fix' then
    select * into reg from public.program_source_registry where college = p_college for update;
    if found then
      proc := coalesce(reg.procedure, '{}'::jsonb);
      proc := proc || jsonb_build_object(
        'v', coalesce((proc->>'v')::int, 0) + 1,
        'hosts', coalesce(proc->'hosts', '[]'::jsonb),
        'open', coalesce(proc->'open', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'question', r.program_title || ' (' || r.control_number || '): a reviewer''s reading',
          'next', v_note,
          'by', who,
          'on', to_char(vat at time zone 'America/Los_Angeles', 'YYYY-MM-DD'),
          'verdict', vid)));
      perform public.program_source_procedure_set(p_college, proc,
        who || ' (Program records view, verdict ' || vid || ')',
        coalesce(md5(reg.procedure::text), 'none'));
      filed := true;
    end if;
  end if;

  return jsonb_build_object('id', vid, 'verdict', p_verdict, 'checked', after, 'by', who, 'at', vat,
                            'requirements_fp', fp, 'filed', filed);
end
$$;
revoke all on function public.program_record_verdict_add(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.program_record_verdict_add(text, text, text, text, text) to authenticated, service_role;

-- PostgREST picks up the new function, computed field and table.
notify pgrst, 'reload schema';
