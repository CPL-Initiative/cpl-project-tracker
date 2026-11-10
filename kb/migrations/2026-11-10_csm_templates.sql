-- csm_templates: the Funding Follow-up Dashboard's email templates, editable by a reviewer (S626b, 2026-11-10; lane
-- csm-workspace).
--
-- Sam, in session 2026-11-10, reading the two new emails (the Noncredit CPL Lead ask, and both asks in one): "can you
-- add a place for me or any reviewer to make changes to the templates for these and later make additional changes if
-- needed?" One row is one saved version of one template's subject and message. Rows are never edited or deleted: the
-- newest row for a template is the wording every reviewer's next email starts from, an older version is restored by
-- saving it again, and a row with reset = true puts the template back to the wording the dashboard ships with. So
-- every change is reversible from the table itself (Rule 10 a2), and the history says who changed what and when.
--
-- Decision right: DR-09 (kb/governance_surface_map.json), the funding tab's own, with the same writers and audience as
-- csm_log: a signed-in funding reviewer (is_funding_reviewer()) reads and adds versions; nothing public reads. Rule 10
-- a3: the first writer is the dashboard's Email templates pane, mapped before it ships, and Sam asked for it.
-- Disclosure (adr-student-detail-aggregate-disclosure-control): a row holds template words with placeholders such as
-- {college} and {name}; it names no college, no person written to and no student. Who saved it is stamped from the JWT.
--
-- Apply: point kb/migrations/.apply here (supabase-migrate.yml), or the Supabase MCP apply_migration:
--   file=kb/migrations/2026-11-10_csm_templates.sql
--   name=s626b_csm_templates
-- Rollback: kb/migrations/2026-11-10_csm_templates_rollback.sql (drops the table; the dashboard falls back to the
-- wording it ships with).

create table if not exists public.csm_templates (
  id           bigserial primary key,
  activity     text not null default 'funding' check (activity ~ '^[a-z0-9-]{1,40}$'),
  template_id  text not null check (template_id ~ '^[a-z0-9_]{1,40}$'),
  subject      text check (subject is null or char_length(subject) between 1 and 300),
  body         text check (body is null or char_length(body) between 1 and 8000),
  reset        boolean not null default false,
  by_email     text check (by_email is null or char_length(by_email) <= 160),
  created_at   timestamptz not null default now(),
  constraint csm_templates_holds_words check (reset or (subject is not null and body is not null))
);
create index if not exists csm_templates_latest_idx on public.csm_templates (activity, template_id, created_at desc, id desc);

alter table public.csm_templates enable row level security;

drop policy if exists csm_templates_select on public.csm_templates;
create policy csm_templates_select on public.csm_templates for select
  to anon, authenticated using (public.is_funding_reviewer());
drop policy if exists csm_templates_insert on public.csm_templates;
create policy csm_templates_insert on public.csm_templates for insert
  to anon, authenticated with check (public.is_funding_reviewer());
-- No update or delete policy: a saved version stays as it was saved.

-- Supabase grants a new table to no API role (tests/supabase_table_grants_test.py), so the file says them: the commands
-- the policies allow, to the roles they name, and the service role for exports.
revoke all on public.csm_templates from anon, authenticated;
grant select, insert on public.csm_templates to anon, authenticated;
grant usage, select on sequence public.csm_templates_id_seq to anon, authenticated;
grant select, insert, update, delete on public.csm_templates to service_role;
grant usage, select on sequence public.csm_templates_id_seq to service_role;

create or replace function public.csm_templates_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.by_email := nullif(auth.jwt() ->> 'email', '');
  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.csm_templates_stamp() from public, anon, authenticated;

drop trigger if exists csm_templates_stamp on public.csm_templates;
create trigger csm_templates_stamp before insert on public.csm_templates
  for each row execute function public.csm_templates_stamp();
