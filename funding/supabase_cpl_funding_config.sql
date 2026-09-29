-- ⚠️ NARROWED 2026-08-28 (Sam): curating funding requires a magic-link
-- reviewer, NOT the team phrase. Live policies were altered to match; this
-- file is the SQL of record and must state the same gate.
-- Schema of record — public.cpl_funding_config
-- ============================================================================
-- The CPL Implementation Funding tab's SHARED model configuration, editable
-- with the team phrase (or a magic-link reviewer). One JSONB blob on a single
-- 'default' row. Applied live via the Supabase MCP (migration
-- `cpl_funding_config`, 2026-07-03). This file is the human-readable copy.
--
-- Design (Sam, 2026-07-03): the funding model is a POLICY configuration the
-- CCC Chancellor tries scenarios against — not a data extract. So the
-- year-specific priority metrics/factors, the selected years, and the noncredit
-- feeder carve-out live here (editable), while cpl_funding_data.js supplies the
-- stable data-derived defaults (pool inputs, college + feeder headcounts).
--
-- Resolution order in cpl_funding.js:
--   baked defaults (cpl_funding_data.js)
--     ⊕ this shared config      (team-phrase / reviewer WRITE, anon READ)
--     ⊕ per-browser what-if     (localStorage — anonymous scenario play)
--
-- The RLS boundary is the security gate: the public anon key ALONE cannot
-- write. (Team-phrase writes were accepted here until 2026-08-28; team_pass_ok()
-- validates server-side (the raci.js / budget_editor.js pattern via
-- team_phrase.js's decorateHeaders).
-- ============================================================================

create table if not exists public.cpl_funding_config (
  id          text primary key default 'default',
  config      jsonb not null default '{}'::jsonb,
  updated_by  text,
  updated_at  timestamptz not null default now()
);

alter table public.cpl_funding_config enable row level security;

-- Anyone may read the shared config (it drives the tab for every visitor).
drop policy if exists cfc_select on public.cpl_funding_config;
create policy cfc_select on public.cpl_funding_config
  for select to anon, authenticated using (true);

-- Writes require a magic-link reviewer OR the shared team phrase.
drop policy if exists cfc_insert on public.cpl_funding_config;
create policy cfc_insert on public.cpl_funding_config
  for insert to anon, authenticated
  with check (is_allowed_reviewer());

drop policy if exists cfc_update on public.cpl_funding_config;
create policy cfc_update on public.cpl_funding_config
  for update to anon, authenticated
  using (is_allowed_reviewer())
  with check (is_allowed_reviewer());

-- Keep updated_at fresh on every write.
create or replace function public.cpl_funding_config_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists cfc_touch on public.cpl_funding_config;
create trigger cfc_touch before update on public.cpl_funding_config
  for each row execute function public.cpl_funding_config_touch();

-- Seed the singleton so the client PATCHes (not INSERTs) the common path.
insert into public.cpl_funding_config (id, config)
  values ('default', '{}'::jsonb)
  on conflict (id) do nothing;

-- config blob shape (all keys optional — only overridden fields are stored):
--   {
--     "years": ["2026-27","2027-28"],           -- selected calendar years (slot order)
--     "pool":  { "remaining_2025_26": n, "one_time_2026_27": n,
--                "admin_cost": n, "scaling_projects_tech": n,
--                "feeder_carveout": n },
--     "year_priorities": {                       -- keyed by 1-based slot string
--       "1": [ {"share": n, "target_rate": n, "metric": "…", "description": "…"} x3 ],
--       "2": [ … x3 ]
--     },
--     "feeders": [ {"name":"…","short":"…","headcount": n} … ],
--     "feeder_metric": "…"
--   }
