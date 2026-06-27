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
