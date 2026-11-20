-- The Library's publishing model, part 1 of 4 (#3560; SkyPipit S687, 2026-11-19).
--
-- Sam's decisions of Nov 19, 2026 (8:23 and 8:55 AM PT, relayed by COBIx on #3560): two publish buttons, "Publish to
-- Internal Library" and "Publish to Public Library"; no approval from Sam; the Internal Library has no gate; the only
-- gate on the Public Library is a passing accessibility check record for the current draft or page; Public includes
-- Internal, and removing a piece from the Public Library leaves it in the Internal Library; a Template checkbox on
-- each record; and the accessibility standard, the reviewer or tool, and the footer wording are per-division
-- settings, with the CPL Initiative's standard "WCAG 2.1 AA and Section 508" (his words).
--
-- What this adds:
--   cpl_library.publish_target  'internal' or 'public': the library a person last published the piece to. Public
--                               means the piece waits to be listed until its check passes (Part 2's run lists it
--                               through the same guarded columns). Null: no choice made here yet.
--   cpl_library.template        a starting point for pieces with a similar purpose; the team sets or clears it.
--   cpl_library.division        whose settings the piece follows; 'cobi' (the CPL Initiative) by default.
--   cpl_library_checks          one row per accessibility check of one version of one piece, append-only.
--   cpl_library_division_settings  one row per division: the standard, the reviewer or tool, the footer wording.
--   cpl_library_publish_target_trg  unlisting a piece (any route: the Library card, Admin's Remove, retiring it,
--                               narrowing its audience) sets publish_target back to 'internal', so nothing relists
--                               a piece a person removed.
--
-- The version a check covers (version_key), the same rule library.js's checkKey() reads:
--   'draft:<cpl_library_drafts.id>'  a draft from the card that is ready or approved and not yet published;
--   'version:<cpl_library.version>'  the page a record names now;
--   'page'                           a page with no version number.
-- The latest check for the record's current key decides. A check of a draft does not carry to the page it becomes:
-- the page is checked again once it is up.
--
-- Decision rights (Rule 10 a3; kb/governance_surface_map.json): the team phrase or a reviewer sign-in reads checks and
-- settings, as it reads cpl_library. Only the service role writes a check (Part 2's check run in library-publish.yml),
-- so the tab never certifies a piece. Settings change through the service role until an editor ships. publish_target
-- and template ride cpl_library's own policies and history trigger; listing itself stays inside
-- cpl_library_set_public() and its guard trigger, unchanged.
-- Disclosure (adr-student-detail-aggregate-disclosure-control): a check row names a standard, a date, a tool or a
-- reviewer's name or role, and a report link. It holds no student detail.
--
-- Apply: the Supabase MCP apply_migration, or point kb/migrations/.apply here (supabase-migrate.yml):
--   file=kb/migrations/2026-11-19_library_publishing_model.sql
--   name=s687_library_publishing_model
-- Re-runnable. Rollback: kb/migrations/2026-11-19_library_publishing_model_rollback.sql.

-- ── Division settings ───────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.cpl_library_division_settings (
  division         text primary key check (division ~ '^[a-z][a-z0-9_-]{1,39}$'),
  division_name    text not null check (char_length(btrim(division_name)) between 1 and 120),
  standard         text not null check (char_length(btrim(standard)) between 1 and 200),
  reviewer_or_tool text not null check (char_length(btrim(reviewer_or_tool)) between 1 and 200),
  -- {standard}, {date}, {reviewer} and {report} are filled from the piece's own check record.
  footer_template  text not null check (char_length(btrim(footer_template)) between 1 and 400),
  not_certified    text not null check (char_length(btrim(not_certified)) between 1 and 200),
  updated_by       text check (updated_by is null or char_length(updated_by) <= 160),
  updated_at       timestamptz not null default now()
);

insert into public.cpl_library_division_settings
  (division, division_name, standard, reviewer_or_tool, footer_template, not_certified, updated_by)
values ('cobi', 'CPL Initiative', 'WCAG 2.1 AA and Section 508', 'axe-core automated check',
        'Accessibility: {standard}, checked {date}, report linked.', 'Accessibility: Not yet certified.',
        'library-s687@bot')
on conflict (division) do nothing;

alter table public.cpl_library_division_settings enable row level security;
drop policy if exists cpl_library_division_settings_read on public.cpl_library_division_settings;
create policy cpl_library_division_settings_read on public.cpl_library_division_settings for select
  to anon, authenticated using (public.team_pass_ok() or public.is_allowed_reviewer());

revoke all on public.cpl_library_division_settings from anon, authenticated;
grant select on public.cpl_library_division_settings to anon, authenticated;
grant select, insert, update on public.cpl_library_division_settings to service_role;

-- ── The record's new columns ────────────────────────────────────────────────────────────────────────────────────
alter table public.cpl_library
  add column if not exists publish_target text,
  add column if not exists template       boolean not null default false,
  add column if not exists division       text not null default 'cobi';
alter table public.cpl_library drop constraint if exists cpl_library_publish_target_ck;
alter table public.cpl_library add constraint cpl_library_publish_target_ck check (
  publish_target is null or publish_target in ('internal', 'public'));
alter table public.cpl_library drop constraint if exists cpl_library_division_fk;
alter table public.cpl_library add constraint cpl_library_division_fk
  foreign key (division) references public.cpl_library_division_settings (division);

-- Unlisting by any route leaves the piece in the Internal Library and drops the wish to list it. Fires after
-- cpl_library_guard_public_trg (triggers fire in name order), so it sees that trigger's own unlisting too.
create or replace function public.cpl_library_publish_target_on_unlist() returns trigger
  language plpgsql set search_path = public as $$
begin
  if old.public_listed and not new.public_listed and new.publish_target = 'public' then
    new.publish_target := 'internal';
  end if;
  return new;
end $$;
revoke execute on function public.cpl_library_publish_target_on_unlist() from public, anon, authenticated;

drop trigger if exists cpl_library_publish_target_trg on public.cpl_library;
create trigger cpl_library_publish_target_trg before update on public.cpl_library
  for each row execute function public.cpl_library_publish_target_on_unlist();

-- ── Accessibility check records ─────────────────────────────────────────────────────────────────────────────────
create table if not exists public.cpl_library_checks (
  id               uuid primary key default gen_random_uuid(),
  library_id       uuid not null references public.cpl_library (id),
  version_key      text not null check (version_key ~ '^(draft:[0-9a-f-]{36}|version:[A-Za-z0-9 ._-]{1,40}|page)$'),
  standard         text not null check (char_length(btrim(standard)) between 1 and 200),
  checked_at       timestamptz not null default now(),
  tool_or_reviewer text not null check (char_length(btrim(tool_or_reviewer)) between 1 and 200),
  result           text not null check (result in ('pass', 'fail')),
  report_url       text check (report_url is null or (report_url ~ '^https://' and char_length(report_url) <= 600)),
  findings         integer check (findings is null or findings >= 0),
  created_by       text not null check (char_length(btrim(created_by)) between 1 and 160),
  created_at       timestamptz not null default now()
);
create index if not exists cpl_library_checks_key_idx
  on public.cpl_library_checks (library_id, version_key, checked_at desc);

alter table public.cpl_library_checks enable row level security;
drop policy if exists cpl_library_checks_read on public.cpl_library_checks;
create policy cpl_library_checks_read on public.cpl_library_checks for select
  to anon, authenticated using (public.team_pass_ok() or public.is_allowed_reviewer());

-- The tab reads; only the check run writes, and nobody changes or deletes a check (a new check supersedes it).
revoke all on public.cpl_library_checks from anon, authenticated;
grant select on public.cpl_library_checks to anon, authenticated;
grant select, insert on public.cpl_library_checks to service_role;

-- ── The gate inside cpl_library_set_public() (second read of #3572) ──────────────────────────────────────────────
-- The tab is not the only gate: a phrase holder calling the function directly with no passing check is refused.
-- Same signature, grants and revokes as kb/supabase_cpl_library_public.sql, which carries the same body.
-- List or unlist one piece. Listing also sets Seen by to Public, the audience the
-- listing declares. Returns the row's public fields so the caller can show them.
-- The one gate on the Public Library (#3560; Sam, Nov 19, 2026, via COBIx: "The only gate on the Public Library is
-- the passing accessibility check record"): listing needs the latest check of the page the record names now
-- (version_key 'version:<version>', or 'page' with no version number) to be a pass. A draft's check never lists a page.
-- Unlisting takes no check, and the service role is exempt. The check table and this body ride
-- kb/migrations/2026-11-19_library_publishing_model.sql; its rollback restores the body without the gate.
create or replace function public.cpl_library_set_public(
  p_slug text, p_listed boolean, p_summary text default null,
  p_topics text[] default null, p_by text default null)
returns table (slug text, public_listed boolean, public_summary text, public_topics text[], listed_at timestamptz)
  language plpgsql security definer set search_path = public as $$
declare
  v_result text;
begin
  if not (public.is_allowed_reviewer() or public.team_pass_ok()) then
    raise exception 'Listing in the public library needs the team phrase or a reviewer sign-in';
  end if;
  if p_listed and coalesce(auth.role(), '') <> 'service_role' then
    select c.result into v_result
      from public.cpl_library l
      join public.cpl_library_checks c on c.library_id = l.id
       and c.version_key = case when nullif(l.version, '') is not null then 'version:' || l.version else 'page' end
     where l.slug = p_slug and l.retired_at is null
     order by c.checked_at desc, c.created_at desc
     limit 1;
    if v_result is distinct from 'pass' then
      raise exception 'Listing in the Public Library needs a passing accessibility check record for the page it names now';
    end if;
  end if;
  perform set_config('cpl.library_public', 'on', true);
  update public.cpl_library l set
    public_listed  = p_listed,
    seen_by        = case when p_listed then 'public' else l.seen_by end,
    public_summary = coalesce(nullif(btrim(p_summary), ''), l.public_summary),
    public_topics  = coalesce(p_topics, l.public_topics),
    listed_at      = case when p_listed then now() else l.listed_at end,
    listed_by      = left(coalesce(nullif(btrim(p_by), ''), auth.jwt() ->> 'email',
                          case when public.is_allowed_reviewer() then 'reviewer' else 'team phrase' end), 120),
    updated_by     = left(coalesce(nullif(btrim(p_by), ''), auth.jwt() ->> 'email',
                          case when public.is_allowed_reviewer() then 'reviewer' else 'team phrase' end), 120)
  where l.slug = p_slug and l.retired_at is null;
  if not found then raise exception 'No current Library piece with slug %', p_slug; end if;
  return query select l.slug, l.public_listed, l.public_summary, l.public_topics, l.listed_at
    from public.cpl_library l where l.slug = p_slug;
end $$;
-- anon holds EXECUTE on purpose (Sam, 2026-10-23): a phrase holder calls it with the
-- anon key and the x-team-pass header, and the gate inside refuses everyone else.
revoke execute on function public.cpl_library_set_public(text, boolean, text, text[], text) from public;
grant execute on function public.cpl_library_set_public(text, boolean, text, text[], text) to anon, authenticated, service_role;
