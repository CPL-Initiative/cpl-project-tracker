-- ─────────────────────────────────────────────────────────────────────────
-- Team & RACI schema for COBI (Session: SkyMaster, 2026-06-26)
--
-- Two tables behind the "Team & RACI" tab + the per-card RACI affordance:
--   • team_members — the people registry (who can be assigned + who gets nudged)
--   • item_raci    — RACI assignments per work item (activity / project)
--
-- RLS mirrors public.projects: public SELECT (the dashboard reads live), writes
-- gated by is_allowed_reviewer() (the shared magic-link reviewer list). Staff
-- names/emails here are already public on the CPL Fact Sheet, so this adds no
-- new PII exposure.
--
-- Forward-compat (Sam's CO-division / Plan-Builder vision): both tables carry a
-- tenant column (`org` / `scope`, default the CPL Initiative) so multi-division
-- COBI is a filter later, not a migration.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.team_members (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text,
  role        text,
  org         text not null default 'MAP',          -- tenant/division (forward-compat)
  active      boolean not null default true,
  nudge       boolean not null default true,        -- per-member update-nudge opt-in (Team & RACI toggle)
  last_nudged_at   timestamptz,                      -- when a nudge was last fired at this member (StarPort, 2026-06-26)
  last_response_at timestamptz,                      -- when this member last recorded a response (✓ in the directory)
  sort_order  int,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One RACI record per work item. `raci` is a jsonb object keyed by role letter,
-- each value an array of {name, email} member references (self-contained so the
-- client renders without a join):
--   {"R":[{"name":"Crystal Nasio","email":"crystal.nasio@rccd.edu"}],
--    "A":[...], "C":[...], "I":[...]}
create table if not exists public.item_raci (
  item_type   text not null check (item_type in ('activity','project')),
  item_id     text not null,
  raci        jsonb not null default '{"R":[],"A":[],"C":[],"I":[]}'::jsonb,
  scope       text not null default 'cpl-initiative',  -- plan/tenant (forward-compat)
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (item_type, item_id)
);

alter table public.team_members enable row level security;
alter table public.item_raci    enable row level security;

-- Public read
drop policy if exists tm_select on public.team_members;
create policy tm_select on public.team_members for select using (true);
drop policy if exists ir_select on public.item_raci;
create policy ir_select on public.item_raci for select using (true);

-- Reviewer-gated write (is_allowed_reviewer() already exists — used by projects/tmc)
drop policy if exists tm_write on public.team_members;
create policy tm_write on public.team_members for all
  using (is_allowed_reviewer()) with check (is_allowed_reviewer());
drop policy if exists ir_write on public.item_raci;
create policy ir_write on public.item_raci for all
  using (is_allowed_reviewer()) with check (is_allowed_reviewer());

-- ─────────────────────────────────────────────────────────────────────────
-- item_updates — the Update Log (StarPort, 2026-06-26).
-- One row per status update on an Activity/sub-activity/project; written by the
-- RACI tab's 📝 braindump→CC-polish composer. The single live source for card
-- updates (both activities AND projects — keyed like item_raci). Public read,
-- reviewer-gated insert/update/delete. (Was append-only/immutable; reviewers
-- gained EDIT + DELETE on 2026-06-27 — SkyMap — so a test/mistaken entry can be
-- removed and a posted update corrected; an edit stamps edited_at.)
-- (A pre-existing project-only `update_log` table is unrelated/vestigial.)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.item_updates (
  id          bigint generated always as identity primary key,
  item_type   text not null check (item_type in ('activity','project')),
  item_id     text not null,
  body        text not null,          -- the finished (CC-polished or hand-written) update
  raw         text,                   -- the original braindump, kept for provenance (optional)
  author      text,                   -- reviewer email who posted it
  scope       text not null default 'cpl-initiative',
  created_at  timestamptz not null default now(),
  edited_at   timestamptz             -- set when a reviewer edits the body (null = never edited)
);
-- Backfill column for an already-created table (additive, idempotent).
alter table public.item_updates add column if not exists edited_at timestamptz;
create index if not exists item_updates_item_idx on public.item_updates (item_type, item_id, created_at desc);

alter table public.item_updates enable row level security;
drop policy if exists iu_select on public.item_updates;
create policy iu_select on public.item_updates for select using (true);
drop policy if exists iu_insert on public.item_updates;
create policy iu_insert on public.item_updates for insert with check (is_allowed_reviewer());
-- Reviewer-gated EDIT + DELETE (added 2026-06-27, SkyMap).
drop policy if exists iu_update on public.item_updates;
create policy iu_update on public.item_updates for update
  using (is_allowed_reviewer()) with check (is_allowed_reviewer());
drop policy if exists iu_delete on public.item_updates;
create policy iu_delete on public.item_updates for delete
  using (is_allowed_reviewer());

-- ─────────────────────────────────────────────────────────────────────────
-- Shared "team phrase" edit gate (StarNova, 2026-06-29). A lower-stakes
-- alternative to per-person magic-link login: one shared phrase unlocks editing
-- of the RACI matrix / members / updates / nudges. Server-enforced — the phrase
-- is validated INSIDE Postgres (RLS), so the public anon key alone can't write.
-- Magic-link reviewers still work (the policies accept reviewer OR phrase).
--
--   • team_access   — holds the phrase. RLS on, NO anon policies → not readable
--                     by clients; only the SECURITY DEFINER funcs (running as
--                     owner) can read it. Set/rotate the phrase with:
--                       update public.team_access set secret = 'your phrase' where id = 'team';
--   • team_pass_check(p) — comparator (revoked from public so it can't be a
--                     brute-force oracle); used for testing + internally.
--   • team_pass_ok()    — reads the `x-team-pass` request header (sent by
--                     raci.js sbWrite when the phrase is unlocked) and compares.
-- Applied live via the Supabase MCP; this file is the schema of record.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.team_access (
  id          text primary key,
  secret      text not null,
  updated_at  timestamptz not null default now()
);
alter table public.team_access enable row level security;   -- (no ANON policies on purpose)
-- One row per COBI subsite cohort (Sam's org layer, 2026-07-14). Each holds
-- that site's curation phrase; rotate a site independently via the UPDATE above
-- (…where id = 'ci';). team_pass_check() (below) matches ANY row's secret.
-- ⚠ 'team' was 'raci' until 2026-08-15. The shared phrase was named after the
-- Team & RACI tab it used to live on; Sam renamed that tab to "Team", leaving
-- the phrase named after something that no longer existed. Renamed live with
--   update public.team_access set id = 'team' where id = 'raci';
-- The SECRET was untouched, so no holder was locked out — the id is internal and
-- appears nowhere a phrase holder can see. team_phrases.js reads either id (see
-- its `legacy` field) so the rename and the deploy did not have to be
-- simultaneous: a card that cannot find its row renders BLANK, and saving a
-- blank card would create a SECOND row — which team_pass_check() would then
-- accept, giving two live shared phrases with only one of them visible.
insert into public.team_access (id, secret) values
  ('team', 'cpl-team-2026'),   -- shared CPL cohort — TEMPORARY, rotate via the UPDATE above / the admin UI
  ('ci',   'ci-team-2026')     -- C&I subsite cohort (ci_team_phrase_add migration, 2026-07-14)
  on conflict (id) do nothing;

-- Reviewer-only manage policies (StarNova, 2026-06-29 — team_access_reviewer_manage
-- migration): a magic-link reviewer can READ + UPDATE the phrase from the RACI tab's
-- "⚙ Manage team phrase" admin. The anon role still has NO policy here, so the secret
-- stays unreadable to non-reviewer clients; team_pass_ok()/team_pass_check() are
-- SECURITY DEFINER and bypass RLS regardless.
drop policy if exists ta_select on public.team_access;
create policy ta_select on public.team_access for select using (is_allowed_reviewer());
drop policy if exists ta_update on public.team_access;
create policy ta_update on public.team_access for update
  using (is_allowed_reviewer()) with check (is_allowed_reviewer());

create or replace function public.team_pass_check(p text)
  returns boolean language sql security definer stable set search_path = public as $$
  -- Matches ANY subsite's secret, so every cohort phrase (cpl-team-2026,
  -- ci-team-2026, …) validates + unlocks curation. This is cohort separation +
  -- independent rotation — NOT per-table data isolation yet (future per-area
  -- scope would parameterize this with the site and gate each table by it).
  select exists (select 1 from public.team_access where secret = p);
$$;
revoke all on function public.team_pass_check(text) from public;

create or replace function public.team_pass_ok()
  returns boolean language plpgsql security definer stable set search_path = public as $$
  declare hdr text;
  begin
    hdr := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
    if hdr is null then return false; end if;
    return public.team_pass_check(hdr);
  end;
$$;
grant execute on function public.team_pass_ok() to anon, authenticated;
-- team_pass_ok() is also called as an RPC (POST /rest/v1/rpc/team_pass_ok with the
-- x-team-pass header) by raci.js to VALIDATE a phrase before storing it, so a wrong
-- phrase is rejected on entry instead of silently 401ing on the first save.

-- The tm_write / ir_write / iu_insert / iu_update / iu_delete policies above are
-- widened to `is_allowed_reviewer() OR team_pass_ok()` by the
-- raci_shared_team_phrase_gate migration (kept inline there for the live apply).
