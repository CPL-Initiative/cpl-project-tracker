-- cobi_rls_gates() — what actually protects each table, read live.
--
-- WHY THIS EXISTS
-- ---------------
-- Sam, 2026-08-14: "I want to make the COBI side menu items rearrangeable by
-- drag and drop from a single place where I can manage the org where they
-- appear, hierarchy, naming, visibility, and access via either team phrase or
-- magic link."
--
-- The trap is the word ACCESS. A nav setting is a DISPLAY control: hiding a menu
-- item does not protect the data behind it — RLS does. A manager UI with an
-- access dropdown actively invites the opposite belief, and someone acting on
-- that belief would "secure" a tab by unticking a box while every row behind it
-- stayed readable to anyone with the anon key.
--
-- So the Admin tab shows both halves side by side, and the security half has to
-- come from the DATABASE rather than from a description of it. A committed
-- snapshot would be a second source of truth for the one fact on the page that
-- must never be wrong, and it would go stale the first time a policy changed
-- without anyone regenerating it — silently, and in the reassuring direction.
--
-- WHAT IT RETURNS
-- ---------------
-- Policy METADATA only: table names, whether RLS is on, and the boolean
-- expressions that gate each command. No row of any table is read. It is still
-- reviewer-gated, because the set of gate expressions is a map of where the
-- soft spots are.
--
-- SECURITY DEFINER is required: pg_policies is readable, but the underlying
-- catalog is filtered per-role, so an anon/authenticated caller sees a partial
-- picture — and a partial picture here reads as "fewer things are protected than
-- actually are", which is the wrong direction to be wrong in.

create or replace function public.cobi_rls_gates()
returns table (
  tbl          text,
  kind         text,
  rls_enabled  boolean,
  select_gate  text,
  write_gates  text,
  policy_count integer
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    c.relname::text as tbl,
    -- Views and MATVIEWS are included and LABELLED, not filtered out. A view has
    -- no row-level security of its own: unless it is security_invoker it runs
    -- with its owner's rights and bypasses the RLS on its source tables
    -- entirely. That is a real exposure category in this project already —
    -- CLAUDE.md carries the standing warning that map_credential_student_rollup
    -- is a matview Postgres cannot give RLS to, with anon holding the grant.
    -- Excluding them would have made every tab that reads one report
    -- "not mapped", burying the one shape most worth looking at.
    case c.relkind when 'v' then 'view' when 'm' then 'matview' else 'table' end as kind,
    c.relrowsecurity as rls_enabled,
    -- NULL (rather than an empty string) when there is no SELECT policy at all,
    -- which is a DIFFERENT state from "gated by an expression": RLS on with no
    -- SELECT policy means nothing can read it through PostgREST at all — the
    -- service key only. The consumer must be able to tell those apart.
    (select string_agg(distinct p.qual, ' | ')
       from pg_policies p
      where p.schemaname = 'public' and p.tablename = c.relname and p.cmd = 'SELECT')::text
      as select_gate,
    (select string_agg(distinct coalesce(p.with_check, p.qual), ' | ')
       from pg_policies p
      where p.schemaname = 'public' and p.tablename = c.relname
        and p.cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))::text
      as write_gates,
    (select count(*)::integer
       from pg_policies p
      where p.schemaname = 'public' and p.tablename = c.relname)
      as policy_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p', 'v', 'm')
    -- Reviewer-only. The gate map is not sensitive the way a row is, but it does
    -- describe where the walls are, so it follows the same rule as team_access.
    and public.is_allowed_reviewer()
  order by c.relname;
$$;

comment on function public.cobi_rls_gates() is
  'Live RLS gate map for the Admin tab. Policy metadata only — reads no table '
  'rows. Reviewer-gated. Exists so the Admin tab states what ACTUALLY protects a '
  'tab rather than what the nav merely hides.';

revoke all on function public.cobi_rls_gates() from public;
grant execute on function public.cobi_rls_gates() to anon, authenticated;
