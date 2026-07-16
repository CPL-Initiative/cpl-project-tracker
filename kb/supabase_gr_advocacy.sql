-- supabase_gr_advocacy.sql — GR (Government Relations) gated advocacy content.
-- Applied to the "Work Plan" project (hvuwhnbuahrtptokpqfh) via MCP migration
-- `gr_advocacy_gated_content` (2026-07-16). Recorded here for the audit trail;
-- the SECRET and the CONTENT are NOT in this file (content lives only in the
-- gr_content table in Supabase, released by RLS — never in the repo/page source).
--
-- Requirement (Sam, 2026-07-16): pre-decisional CPL Title 5 §55050 advocacy
-- materials must not be visible on the public COBI site until the MAP team is
-- ready — "just the MAP team," NOT the CO. A client-side phrase gate would leak
-- the content in page source, so protection is SERVER-SIDE, and COHORT-SPECIFIC:
-- unlike team_pass_ok() (which team_pass_check matches for ANY cohort's secret),
-- gr_pass_ok() accepts ONLY the 'gr' secret — so the ci/raci phrases held by CO
-- teams cannot read GR content.
-- Pattern: docs/kb-notes/methodology-server-enforced-shared-password-gate.md

-- The MAP-team secret (value set at apply-time; rotate by updating this row).
-- insert into public.team_access (id, secret) values ('gr', '<phrase>')
--   on conflict (id) do update set secret = excluded.secret;

-- Cohort-specific comparator (revoked from public — not a brute-force oracle).
create or replace function public.gr_pass_check(p text) returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.team_access where id = 'gr' and secret = p);
$$;
revoke all on function public.gr_pass_check(text) from public;

-- Header reader the RLS policy calls (reads the x-team-pass request header).
create or replace function public.gr_pass_ok() returns boolean
  language plpgsql security definer stable set search_path = public as $$
  declare hdr text;
  begin
    hdr := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
    if hdr is null then return false; end if;
    return public.gr_pass_check(hdr);
  end;
$$;
grant execute on function public.gr_pass_ok() to anon, authenticated;

-- Content store — one row (id='cpl-t5-priorities') holding the whole briefing doc.
create table if not exists public.gr_content (
  id text primary key,
  doc jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.gr_content enable row level security;

-- Read only for the GR cohort phrase OR a signed-in reviewer. No blanket anon read.
drop policy if exists gr_content_read on public.gr_content;
create policy gr_content_read on public.gr_content for select
  using (public.gr_pass_ok() or public.is_allowed_reviewer());

-- Reviewers (magic-link) may manage the content (future in-place editing); no anon write.
drop policy if exists gr_content_write on public.gr_content;
create policy gr_content_write on public.gr_content for all
  using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
