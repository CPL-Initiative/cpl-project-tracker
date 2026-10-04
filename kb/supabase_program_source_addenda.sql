-- supabase_program_source_addenda.sql — catalog addenda, one row per addendum
-- a college publishes against its catalog of record.
--
-- ⚠️ PROPOSED, NOT APPLIED. Waits on Sam's go (open-asks sheet), as the
-- registry did (S320). Until then the census keeps what it sees in
-- program_source_registry.census_evidence -> 'addenda' through its existing
-- apply function.
--
-- Lane: docs/reference/lanes/program-requirements-harvest.md. Sam, 2026-10-04
-- (S325): "colleges are often publishing catalog addendum to correct errors and
-- add late changes to the official catalog. We need to track this in our schema
-- and have our agents aware."
--
-- WHAT A ROW IS: one addendum (or supplement, or errata) the census found
-- linked from a college's homepage, catalog index or catalog page, keyed by
-- (college, url). It names the catalog year it amends, and moves through a
-- status an agent or a person sets:
--   listed           the census saw the link; nobody has read it yet
--   read             an agent read it and filed programs_changed
--   applied          every program record it changes carries the change
--   gone             the census no longer finds the link (the row stays)
--   not_an_addendum  a person ruled the link out
--
-- WHO WRITES
--   * The census, ONLY through program_source_addenda_apply(), service key: it
--     inserts new links as listed and stamps last_seen on known ones. It never
--     changes status except listed -> gone (and gone -> listed when a link
--     returns), and never touches a row a person corrected.
--   * The reading agent sets read / applied and programs_changed (a later
--     function, same pattern, once the reader exists).
--   * A person corrects a row with a direct UPDATE that sets corrected_by and
--     corrected_at; from then on the census leaves its decided fields alone
--     (CLAUDE.md Rule 10: a human row wins).
--
-- REVERSIBLE (Rule 10 a2): every UPDATE or DELETE copies the old row into
-- program_source_addenda_history with who changed it. A census run rolls back
-- by restoring the history rows whose changed_by is its run id, and by deleting
-- the rows whose first_seen_run is its run id.
--
-- READERS: public facts about public documents, so anon and authenticated may
-- SELECT (the tab and Sierra read it). The history table has no API read.

-- ── Tables ─────────────────────────────────────────────────────────────────
create table if not exists public.program_source_addenda (
  id               bigserial primary key,
  college          text not null references public.program_source_registry (college),
  url              text not null,
  kind             text not null check (kind in ('addendum', 'supplement', 'errata')),
  title            text,
  amends_year      text,                          -- '2026-2027': the catalog it amends
  published_on     date,                          -- the date the addendum prints, once read
  effective_term   text,                          -- 'Spring 2027', once read
  found_on         text,                          -- the page that linked it
  status           text not null default 'listed'
                   check (status in ('listed', 'read', 'applied', 'gone', 'not_an_addendum')),
  programs_changed jsonb,                         -- [{control_number, title, change}], once read
  first_seen_run   text,
  first_seen_at    timestamptz not null default now(),
  last_seen_run    text,
  last_seen_at     timestamptz,
  read_run         text,
  read_at          timestamptz,
  corrected_by     text,
  corrected_at     timestamptz,
  correction_note  text,
  updated_at       timestamptz not null default now(),
  unique (college, url)
);
create index if not exists program_source_addenda_college
  on public.program_source_addenda (college, status);

create table if not exists public.program_source_addenda_history (
  id          bigserial primary key,
  addendum_id bigint not null,
  changed_at  timestamptz not null default now(),
  changed_by  text,                             -- census run id, reader run id, or the person
  op          text not null,                    -- UPDATE or DELETE
  old_row     jsonb not null
);

-- ── History trigger ────────────────────────────────────────────────────────
create or replace function public.program_source_addenda_keep_history()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.program_source_addenda_history (addendum_id, changed_by, op, old_row)
  values (
    old.id,
    case when tg_op = 'UPDATE'
         then coalesce(
                case when new.corrected_at is distinct from old.corrected_at
                     then new.corrected_by end,
                case when new.read_run is distinct from old.read_run
                     then new.read_run end,
                new.last_seen_run)
    end,
    tg_op,
    to_jsonb(old));
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    return new;
  end if;
  return old;
end
$$;
revoke all on function public.program_source_addenda_keep_history() from public, anon, authenticated;

drop trigger if exists program_source_addenda_history on public.program_source_addenda;
create trigger program_source_addenda_history
  before update or delete on public.program_source_addenda
  for each row execute function public.program_source_addenda_keep_history();

-- ── RLS + grants (the registry's pattern) ──────────────────────────────────
alter table public.program_source_addenda enable row level security;
alter table public.program_source_addenda_history enable row level security;

drop policy if exists program_source_addenda_read on public.program_source_addenda;
create policy program_source_addenda_read on public.program_source_addenda
  for select to anon, authenticated using (true);

grant select on public.program_source_addenda to anon, authenticated;
grant select, insert, update, delete on public.program_source_addenda to service_role;
grant usage, select on sequence public.program_source_addenda_id_seq to service_role;
grant select, insert on public.program_source_addenda_history to service_role;
grant usage, select on sequence public.program_source_addenda_history_id_seq to service_role;
-- Default privileges here hand anon and authenticated every table privilege on
-- a new table; TRUNCATE ignores RLS, so the extras are revoked outright.
revoke insert, update, delete, truncate, references, trigger
  on public.program_source_addenda from anon, authenticated;
revoke all on sequence public.program_source_addenda_id_seq from anon, authenticated;
revoke all on public.program_source_addenda_history from anon, authenticated;
revoke all on sequence public.program_source_addenda_history_id_seq from anon, authenticated;

-- ── The census writes here and nowhere else ────────────────────────────────
-- p_rows: a JSON array, one object per college the census READ this run:
--   {college, catalog_year, addenda: [{kind, title, url, year, found_on}]}
-- A college the run could not read is left out of p_rows, so a failed read
-- never marks its addenda gone.
create or replace function public.program_source_addenda_apply(p_run_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r      jsonb;
  a      jsonb;
  urls   text[];
  n_new  int := 0;
  n_seen int := 0;
  n_marked int := 0;
  n_gone int := 0;
begin
  if p_run_id is null or length(p_run_id) < 6 then
    raise exception 'program_source_addenda_apply: a run id is required';
  end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if not exists (select 1 from public.program_source_registry where college = r->>'college') then
      continue;
    end if;
    urls := array(select x->>'url' from jsonb_array_elements(coalesce(r->'addenda', '[]'::jsonb)) x);
    for a in select * from jsonb_array_elements(coalesce(r->'addenda', '[]'::jsonb)) loop
      insert into public.program_source_addenda
        (college, url, kind, title, amends_year, found_on, first_seen_run, last_seen_run, last_seen_at)
      values (r->>'college', a->>'url', a->>'kind', a->>'title',
              coalesce(a->>'year', r->>'catalog_year'), a->>'found_on',
              p_run_id, p_run_id, now())
      on conflict (college, url) do nothing;
      if found then
        n_new := n_new + 1;
      else
        update public.program_source_addenda set
          last_seen_run = p_run_id,
          last_seen_at  = now(),
          status        = case when status = 'gone' and corrected_by is null
                               then 'listed' else status end
        where college = r->>'college' and url = a->>'url';
        n_seen := n_seen + 1;
      end if;
    end loop;
    update public.program_source_addenda set
      status = 'gone', last_seen_run = p_run_id
    where college = r->>'college'
      and corrected_by is null
      and status in ('listed', 'read', 'applied')
      and not (url = any (urls));
    get diagnostics n_marked = row_count;
    n_gone := n_gone + n_marked;
  end loop;
  return jsonb_build_object('run_id', p_run_id, 'new', n_new, 'seen_again', n_seen,
                            'gone', n_gone);
end
$$;
revoke all on function public.program_source_addenda_apply(text, jsonb) from public, anon, authenticated;
grant execute on function public.program_source_addenda_apply(text, jsonb) to service_role;
